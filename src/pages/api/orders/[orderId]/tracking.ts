/**
 * Get tracking details for an order
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

export const GET: APIRoute = async ({ params, request }) => {
    const orderId = params.orderId;

    if (!orderId) {
        return new Response(JSON.stringify({ error: 'Order ID required' }), { status: 400 });
    }

    try {
        // Get order with shipping details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('id, tracking_number, shipping_status, estimated_delivery, shipped_at, delivered_at, items, total_amount, discount_amount, created_at')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
        }

        // Get shipment events
        const { data: events } = await supabase
            .from('shipment_events')
            .select('*')
            .eq('order_id', orderId)
            .order('created_at', { ascending: true });

        return new Response(JSON.stringify({
            order: {
                id: order.id,
                trackingNumber: order.tracking_number,
                status: order.shipping_status,
                estimatedDelivery: order.estimated_delivery,
                shippedAt: order.shipped_at,
                deliveredAt: order.delivered_at,
                items: order.items,
                totalAmount: order.total_amount,
                discountAmount: order.discount_amount,
                createdAt: order.created_at
            },
            events: events || []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Tracking error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
