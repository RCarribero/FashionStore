/**
 * Stripe Checkout API
 */
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe('sk_REDACTED51Snb87CFzYRW6R0mDBbMEZRsdMg3damRDQ4a0h4whl5OPZM0YO9NRdntcOw3GuPKPcdaPRQwT8OTw03zwYbgdU1200ivNMMn3i');

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

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
            success_url: `${new URL(request.url).origin}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${new URL(request.url).origin}/checkout`,
            locale: 'es',
            discounts: discounts,
            payment_method_types: [
                'card',           // Tarjetas + Apple Pay + Google Pay (automático)
                'paypal',         // PayPal
                'klarna',         // Klarna - pago a plazos
                'link',           // Link - checkout rápido
                'bancontact',     // Bancontact - Bélgica
                'eps',            // EPS - Austria
                'revolut_pay',    // Revolut Pay - Europa
                'samsung_pay',    // Samsung Pay
            ],
            metadata: {
                userId: userId || '',
                isFirstPurchase: isFirstPurchase ? 'true' : 'false',
                couponCode: appliedCouponCode || '',
                cartSessionId: cartSessionId || ''
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
