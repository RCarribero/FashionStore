/**
 * Sync Orders from Stripe
 * Manual endpoint to sync completed payments when webhook doesn't work
 */
import type { APIRoute } from 'astro';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY || 'sk_REDACTED51Snb87CFzYRW6R0mDBbMEZRsdMg3damRDQ4a0h4whl5OPZM0YO9NRdntcOw3GuPKPcdaPRQwT8OTw03zwYbgdU1200ivNMMn3i');

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { sessionId } = await request.json();

        if (!sessionId) {
            return new Response(JSON.stringify({ error: 'Session ID required' }), { status: 400 });
        }

        // Check if order already exists
        const { data: existingOrder } = await supabase
            .from('orders')
            .select('id')
            .eq('stripe_session_id', sessionId)
            .single();

        if (existingOrder) {
            return new Response(JSON.stringify({ message: 'Order already synced', orderId: existingOrder.id }), { status: 200 });
        }

        // Retrieve the session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items.data.price.product'],
        });

        if (session.payment_status !== 'paid') {
            return new Response(JSON.stringify({ error: 'Payment not completed' }), { status: 400 });
        }

        const userId = session.metadata?.userId;
        const isFirstPurchase = session.metadata?.isFirstPurchase === 'true';
        const lineItems = session.line_items?.data || [];

        // 1. Update stock for each item
        console.log(`Processing ${lineItems.length} line items for stock update`);
        let stockUpdateCount = 0;

        for (const item of lineItems) {
            const product = item.price?.product as Stripe.Product;
            const quantity = item.quantity || 1;

            // Skip shipping item (no metadata)
            if (!product?.metadata?.productId || !product?.metadata?.size) {
                console.log(`Skipping item without metadata: ${item.description || 'unknown'}`);
                continue;
            }

            const { productId, size } = product.metadata;
            console.log(`Updating stock for ${productId}, size ${size}, qty ${quantity}`);

            // Get current stock
            const { data: variant, error: variantError } = await supabase
                .from('product_variants')
                .select('id, stock')
                .eq('product_id', productId)
                .eq('size', size)
                .single();

            if (variantError) {
                console.error(`Variant not found for ${productId}/${size}:`, variantError.message);
                continue;
            }

            if (variant) {
                const newStock = Math.max(0, variant.stock - quantity);
                const { error: updateError } = await supabase
                    .from('product_variants')
                    .update({ stock: newStock })
                    .eq('id', variant.id);

                if (updateError) {
                    console.error(`Failed to update stock for ${productId}/${size}:`, updateError.message);
                } else {
                    console.log(`Stock updated for ${productId}/${size}: ${variant.stock} -> ${newStock}`);
                    stockUpdateCount++;
                }
            }
        }

        console.log(`Updated stock for ${stockUpdateCount} variants`);

        // 2. Mark first purchase complete
        if (userId && isFirstPurchase) {
            await supabase
                .from('user_profiles')
                .update({ has_made_purchase: true })
                .eq('id', userId);

            console.log(`Marked first purchase for user ${userId}`);
        }

        // 3. Create order record (for both logged-in users and guests)
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

        // Generate tracking number: FM-XXXXXXXX
        const trackingNumber = 'FM-' + Math.random().toString(36).substring(2, 10).toUpperCase();

        // Calculate estimated delivery (3-5 business days)
        const estimatedDelivery = new Date();
        estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 3) + 3);

        // Get customer email from session
        const customerEmail = session.customer_email || session.customer_details?.email;

        const { data: order, error } = await supabase
            .from('orders')
            .insert({
                user_id: userId || null, // null for guest orders
                stripe_session_id: sessionId,
                status: 'completed',
                shipping_status: 'processing',
                tracking_number: trackingNumber,
                estimated_delivery: estimatedDelivery.toISOString(),
                total_amount: session.amount_total,
                discount_amount: session.total_details?.amount_discount || 0,
                shipping_amount: session.total_details?.amount_shipping || 0,
                items: orderItems
            })
            .select()
            .single();

        if (order) {
            // Create initial shipment event
            await supabase.from('shipment_events').insert({
                order_id: order.id,
                status: 'processing',
                location: 'Almacén FashionMarket',
                description: 'Pedido recibido y en preparación'
            });
        }

        if (error) {
            console.error('Failed to create order:', error);
            return new Response(JSON.stringify({ error: 'Failed to create order', details: error.message }), { status: 500 });
        }

        // Send order confirmation email
        if (customerEmail && order) {
            try {
                await fetch(new URL('/api/email/order-confirmation', request.url).toString(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: order.id,
                        recipientEmail: customerEmail
                    })
                });
                console.log(`Confirmation email sent to ${customerEmail}`);
            } catch (emailError) {
                console.error('Failed to send confirmation email:', emailError);
                // Don't fail the order sync if email fails
            }
        }

        console.log(`Order created: ${order.id} ${userId ? `for user ${userId}` : `for guest (${customerEmail})`}`);
        return new Response(JSON.stringify({
            success: true,
            orderId: order.id,
            stockUpdated: true,
            firstPurchaseMarked: isFirstPurchase && !!userId,
            emailSent: !!customerEmail,
            isGuest: !userId
        }), { status: 200 });

    } catch (error: any) {
        console.error('Sync error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
