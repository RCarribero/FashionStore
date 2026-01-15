import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { supabase } from '../../../modules/auth';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || 'sk_REDACTED51Snb87CFzYRW6R0mDBbMEZRsdMg3damRDQ4a0h4whl5OPZM0YO9NRdntcOw3GuPKPcdaPRQwT8OTw03zwYbgdU1200ivNMMn3i', {
    apiVersion: '2024-12-18.acacia',
});

const endpointSecret = import.meta.env.STRIPE_WEBHOOK_SECRET;

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    const signature = request.headers.get('stripe-signature');

    if (!signature || !endpointSecret) {
        return new Response('Webhook Error: Missing signature or secret', { status: 400 });
    }

    let event: Stripe.Event;
    const body = await request.text(); // Read raw body as text for verification

    try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret);
    } catch (err) {
        console.error(`Webhook signature verification failed: ${(err as Error).message}`);
        return new Response(`Webhook Error: ${(err as Error).message}`, { status: 400 });
    }

    // Handle the event
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        // Retrieve the session with line_items expanded to get the product metadata
        const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['line_items.data.price.product'],
        });

        const lineItems = expandedSession.line_items?.data || [];

        for (const item of lineItems) {
            const product = item.price?.product as Stripe.Product;
            const quantity = item.quantity || 1;

            if (product && product.metadata && product.metadata.productId && product.metadata.size) {
                const { productId, size } = product.metadata;

                console.log(`Processing sale: Product ${productId}, Size ${size}, Qty ${quantity}`);

                try {
                    // 1. Get current stock for variant
                    const { data: variant, error: fetchError } = await supabase
                        .from('product_variants')
                        .select('id, stock')
                        .eq('product_id', productId)
                        .eq('size', size)
                        .single();

                    if (fetchError || !variant) {
                        console.error(`Variant not found for ${productId}/${size}:`, fetchError);
                        continue;
                    }

                    // 2. Decrement variant stock
                    const newStock = Math.max(0, variant.stock - quantity);
                    const { error: updateError } = await supabase
                        .from('product_variants')
                        .update({ stock: newStock })
                        .eq('id', variant.id);

                    if (updateError) {
                        console.error(`Failed to update variant stock for ${variant.id}:`, updateError);
                    } else {
                        console.log(`Updated stock for variant ${variant.id}: ${variant.stock} -> ${newStock}`);
                    }

                } catch (error) {
                    console.error(`Failed to update stock for ${productId} size ${size}:`, error);
                }
            } else {
                console.warn('Item missing metadata:', item.description);
            }
        }

        // Mark user's first purchase as complete
        const userId = expandedSession.metadata?.userId;
        const couponCode = expandedSession.metadata?.couponCode;

        if (userId && expandedSession.metadata?.isFirstPurchase === 'true') {
            try {
                const { error } = await supabase
                    .from('user_profiles')
                    .update({ has_made_purchase: true })
                    .eq('id', userId);

                if (error) {
                    console.error('Failed to update user profile:', error);
                } else {
                    console.log(`Marked first purchase for user ${userId}`);
                }
            } catch (error) {
                console.error('Error updating user profile:', error);
            }
        }

        // Increment coupon usage
        if (couponCode) {
            try {
                // First get current count
                const { data: coupon, error: fetchError } = await supabase
                    .from('coupons')
                    .select('id, uses_count')
                    .eq('code', couponCode.toUpperCase())
                    .single();

                if (coupon && !fetchError) {
                    const { error: updateError } = await supabase
                        .from('coupons')
                        .update({ uses_count: coupon.uses_count + 1 })
                        .eq('id', coupon.id);

                    if (updateError) {
                        console.error(`Failed to increment usage for coupon ${couponCode}:`, updateError);
                    } else {
                        console.log(`Incremented usage for coupon ${couponCode}`);
                    }
                }
            } catch (error) {
                console.error(`Error processing coupon usage for ${couponCode}:`, error);
            }
        }

        // Save order to database
        if (userId) {
            try {
                // Build order items from line items
                const orderItems = lineItems
                    .filter(item => {
                        const product = item.price?.product as Stripe.Product;
                        return product?.metadata?.productId;
                    })
                    .map(item => {
                        const product = item.price?.product as Stripe.Product;
                        return {
                            productId: product.metadata.productId,
                            name: product.name,
                            size: product.metadata.size,
                            quantity: item.quantity,
                            price: item.amount_total
                        };
                    });

                const { error: orderError } = await supabase
                    .from('orders')
                    .insert({
                        user_id: userId,
                        stripe_session_id: expandedSession.id,
                        status: 'completed',
                        total_amount: expandedSession.amount_total,
                        discount_amount: expandedSession.total_details?.amount_discount || 0,
                        shipping_amount: expandedSession.total_details?.amount_shipping || 0,
                        items: orderItems,
                        coupon_code: couponCode // Optional: Save which coupon was used if column exists (might need schema update)
                    });

                if (orderError) {
                    console.error('Failed to save order:', orderError);
                } else {
                    console.log(`Order saved for user ${userId}`);
                }
            } catch (error) {
                console.error('Error saving order:', error);
            }
        }

        // Clear stock reservations after successful purchase
        const cartSessionId = expandedSession.metadata?.cartSessionId;
        if (cartSessionId) {
            try {
                const { error: reserveError } = await supabase
                    .from('stock_reservations')
                    .delete()
                    .eq('session_id', cartSessionId);

                if (reserveError) {
                    console.error('Failed to clear reservations:', reserveError);
                } else {
                    console.log(`Cleared reservations for session ${cartSessionId}`);
                }
            } catch (error) {
                console.error('Error clearing reservations:', error);
            }
        }

        console.log('Payment successful and stock updated');
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
};
