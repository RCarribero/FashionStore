/**
 * API to update order shipping status
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return new Response(JSON.stringify({ error: 'Order ID and status required' }), { status: 400 });
        }

        const validStatuses = ['processing', 'shipped', 'in_transit', 'out_for_delivery', 'delivered'];
        if (!validStatuses.includes(status)) {
            return new Response(JSON.stringify({ error: 'Invalid status' }), { status: 400 });
        }

        const updateData: any = { shipping_status: status };

        if (status === 'shipped') {
            updateData.shipped_at = new Date().toISOString();
        }
        if (status === 'delivered') {
            updateData.delivered_at = new Date().toISOString();
        }

        const { error } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', orderId);

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        // Create shipment event
        const eventDescriptions: Record<string, string> = {
            'processing': 'Pedido en preparación',
            'shipped': 'Pedido enviado',
            'in_transit': 'Paquete en tránsito',
            'out_for_delivery': 'Paquete en reparto',
            'delivered': 'Paquete entregado'
        };

        await supabase.from('shipment_events').insert({
            order_id: orderId,
            status: status,
            location: 'Sistema Admin',
            description: eventDescriptions[status] || 'Estado actualizado'
        });

        // Send email notification for important status changes
        if (['shipped', 'out_for_delivery', 'delivered'].includes(status)) {
            try {
                await fetch(new URL('/api/email/shipping-update', request.url).toString(), {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ orderId, status })
                });
            } catch (e) {
                console.error('Failed to send email notification');
            }
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
