/**
 * Stripe Checkout API
 */
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createAdminClient } from '../../../modules/auth';

const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
    throw new Error('Missing STRIPE_SECRET_KEY environment variable');
}
const stripe = new Stripe(stripeSecretKey, {
    httpClient: Stripe.createFetchHttpClient(),
});

const supabase = createAdminClient();

export const prerender = false;

interface CartItem {
    productId: string;
    productName: string;
    productImage?: string;
    price: number;
    quantity: number;
    size: string;
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const { items, customer, userId, couponCode, cartSessionId } = await request.json() as {
            items: CartItem[],
            customer: any,
            userId?: string,
            couponCode?: string,
            cartSessionId?: string
        };

        if (!items || items.length === 0) {
            return new Response(JSON.stringify({ error: 'No items' }), { status: 400 });
        }

        // Check if this is user's first purchase
        let isFirstPurchase = false;
        console.log('Checkout - userId received:', userId);

        if (userId) {
            const { data: profile, error: profileError } = await supabase
                .from('user_profiles')
                .select('has_made_purchase')
                .eq('id', userId)
                .single();

            console.log('Checkout - profile query result:', { profile, profileError });

            // If profile exists and has_made_purchase is false, it's first purchase
            if (profile && profile.has_made_purchase === false) {
                isFirstPurchase = true;
            }
            // If profile doesn't exist (new user), treat as first purchase
            if (profileError && profileError.code === 'PGRST116') {
                console.log('Checkout - No profile found, treating as first purchase');
                isFirstPurchase = true;
            }
        } else {
            console.log('Checkout - Guest user, skipping first purchase check');
        }

        console.log('Checkout - isFirstPurchase:', isFirstPurchase);

        // --- ADDED TEMPORAL STOCK RESERVATION LOGIC ---
        // Stripe requires expires_at to be at least 30 mins. We use 31 mins to be safe from sub-second clock differences.
        const thirtyOneMinsSeconds = 31 * 60;
        const expiresAtEpochSeconds = Math.floor(Date.now() / 1000) + thirtyOneMinsSeconds;
        const dbExpiresAt = new Date(expiresAtEpochSeconds * 1000);
        const reservationSessionId = cartSessionId || `session_${Date.now()}`;

        // Validate stock for all items BEFORE doing anything
        for (const item of items) {
            const { data: variant, error: variantError } = await supabase
                .from('product_variants')
                .select('id, stock')
                .eq('product_id', item.productId)
                .eq('size', item.size)
                .single();

            if (variantError && variantError.code !== 'PGRST116') {
                return new Response(JSON.stringify({ error: `Error verificando stock: ${variantError.message}` }), { status: 500 });
            }

            if (!variant) {
                // Fallback validation against absolute product stock without size dependency
                const { data: product } = await supabase.from('products').select('stock').eq('id', item.productId).single();
                if (!product || product.stock < item.quantity) {
                    return new Response(JSON.stringify({ error: `No hay suficiente stock para ${item.productName}. Por favor reduce la cantidad.` }), { status: 400 });
                }
            } else if (variant.stock < item.quantity) {
                return new Response(JSON.stringify({ error: `No hay suficiente stock para ${item.productName} (Talla: ${item.size}). Por favor reduce la cantidad.` }), { status: 400 });
            }
        }

        // Subtract stock and create reservations
        for (const item of items) {
            const { data: variant } = await supabase
                .from('product_variants')
                .select('id, stock')
                .eq('product_id', item.productId)
                .eq('size', item.size)
                .single();

            if (variant) {
                // Check if this session already reserved this exact variant
                const { data: existingReservation } = await supabase
                    .from('stock_reservations')
                    .select('id, quantity')
                    .eq('session_id', reservationSessionId)
                    .eq('variant_id', variant.id)
                    .single();

                if (existingReservation) {
                    // Update only expires_at and optionally adjust stock if quantity changed
                    const quantityDiff = item.quantity - existingReservation.quantity;

                    if (quantityDiff > 0) {
                        // Needs to reserve more
                        await supabase
                            .from('product_variants')
                            .update({ stock: Math.max(0, variant.stock - quantityDiff) })
                            .eq('id', variant.id);
                    } else if (quantityDiff < 0) {
                        // Restoring some stock
                        await supabase
                            .from('product_variants')
                            .update({ stock: variant.stock + Math.abs(quantityDiff) })
                            .eq('id', variant.id);
                    }

                    await supabase
                        .from('stock_reservations')
                        .update({
                            quantity: item.quantity,
                            expires_at: dbExpiresAt.toISOString()
                        })
                        .eq('id', existingReservation.id);
                } else {
                    // 1. Subtract stock immediately
                    await supabase
                        .from('product_variants')
                        .update({ stock: Math.max(0, variant.stock - item.quantity) })
                        .eq('id', variant.id);

                    // 2. Create reservation
                    await supabase
                        .from('stock_reservations')
                        .insert({
                            session_id: reservationSessionId,
                            product_id: item.productId,
                            variant_id: variant.id,
                            size: item.size,
                            quantity: item.quantity,
                            expires_at: dbExpiresAt.toISOString()
                        });
                }
            } else {
                // Fallback for products without variants - subtract generically without reservation DB lock tracking
                const { data: product } = await supabase.from('products').select('stock').eq('id', item.productId).single();
                if (product) {
                    await supabase.from('products').update({ stock: Math.max(0, product.stock - item.quantity) }).eq('id', item.productId);
                }
            }
        }
        // --- END TEMPORAL STOCK RESERVATION LOGIC ---

        // Calculate cart total
        const cartTotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
        const FREE_SHIPPING_THRESHOLD = 10000; // 100 EUR in cents
        const SHIPPING_COST = 599; // 5.99 EUR in cents

        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
            price_data: {
                currency: 'eur',
                product_data: {
                    name: item.productName,
                    description: `Talla: ${item.size}`,
                    images: item.productImage ? [item.productImage] : [],
                    metadata: {
                        productId: item.productId,
                        size: item.size
                    },
                },
                unit_amount: item.price,
            },
            quantity: item.quantity,
        }));

        // Add shipping cost if below threshold
        if (cartTotal < FREE_SHIPPING_THRESHOLD) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Envío',
                        description: 'Envío estándar (2-5 días laborables)',
                    },
                    unit_amount: SHIPPING_COST,
                },
                quantity: 1,
            });
        }

        let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined;
        let appliedCouponCode: string | undefined;

        // Process Coupon if provided
        if (couponCode) {
            // Fetch coupon logic
            const { data: coupon, error } = await supabase
                .from('coupons')
                .select('*, coupon_products(product_id)')
                .eq('code', couponCode.toUpperCase())
                .single();

            if (coupon && !error && coupon.is_active) {
                // Basic validation
                const now = new Date();
                const validFrom = coupon.valid_from ? new Date(coupon.valid_from) <= now : true;
                const validUntil = coupon.valid_until ? new Date(coupon.valid_until) >= now : true;
                const usesValid = coupon.max_uses ? coupon.uses_count < coupon.max_uses : true;
                const minPurchaseValid = coupon.min_purchase ? (cartTotal >= coupon.min_purchase) : true;

                if (validFrom && validUntil && usesValid && minPurchaseValid) {
                    // Calculate Discount
                    let eligibleAmount = cartTotal;

                    // Product restrictions
                    if (coupon.applies_to === 'specific') {
                        const allowedProductIds = coupon.coupon_products?.map((cp: any) => cp.product_id) || [];
                        eligibleAmount = items.reduce((total, item) => {
                            if (allowedProductIds.includes(item.productId)) {
                                return total + (item.price * item.quantity);
                            }
                            return total;
                        }, 0);
                    }

                    if (eligibleAmount > 0) {
                        let discountAmount = 0;
                        if (coupon.discount_type === 'percentage') {
                            discountAmount = Math.round(eligibleAmount * coupon.discount_value / 100);
                        } else {
                            discountAmount = coupon.discount_value;
                        }

                        // Cap discount
                        if (discountAmount > cartTotal) {
                            discountAmount = cartTotal;
                        }

                        if (discountAmount > 0) {
                            // Create Stripe Coupon on the fly
                            const stripeCoupon = await stripe.coupons.create({
                                amount_off: discountAmount,
                                currency: 'eur',
                                duration: 'once',
                                name: `Cupon ${coupon.code}`,
                            });

                            discounts = [{ coupon: stripeCoupon.id }];
                            isFirstPurchase = false; // Disable first purchase discount if coupon applies
                            appliedCouponCode = coupon.code;
                        }
                    }
                }
            }
        }

        // First Purchase Discount DISABLED
        // To re-enable, uncomment the code below:
        // if (isFirstPurchase && !discounts) {
        //     const coupon = await stripe.coupons.create({
        //         percent_off: 20,
        //         duration: 'once',
        //         name: '20% OFF - Primera Compra',
        //     });
        //     discounts = [{ coupon: coupon.id }];
        // }

        const session = await stripe.checkout.sessions.create({
            line_items: lineItems,
            mode: 'payment',
            expires_at: expiresAtEpochSeconds,
            success_url: `${new URL(request.url).origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${new URL(request.url).origin}/api/checkout/cancel-session?session_id={CHECKOUT_SESSION_ID}`,
            locale: 'es',
            discounts: discounts,
            payment_method_types: [
                'card',           // Tarjetas + Apple Pay + Google Pay (automatico)
                'paypal',         // PayPal
                'klarna',         // Klarna - pago a plazos
                'link',           // Link - checkout rapido
                'bancontact',     // Bancontact - Belgica
                'eps',            // EPS - Austria
            ],
            metadata: {
                userId: userId || '',
                isFirstPurchase: isFirstPurchase ? 'true' : 'false',
                couponCode: appliedCouponCode || '',
                cartSessionId: reservationSessionId, // Used to track the reservation in the webhook
                customerFirstName: customer?.firstName || '',
                customerLastName: customer?.lastName || '',
                customerPhone: customer?.phone || '',
                shippingAddress: customer?.address || '',
                shippingCity: customer?.city || '',
                shippingState: customer?.state || '',
                shippingZip: customer?.zip || '',
                shippingCountry: customer?.country || 'ES'
            },
            customer_email: customer?.email,
        });

        return new Response(JSON.stringify({ url: session.url }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (error: any) {
        console.error('Checkout error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
