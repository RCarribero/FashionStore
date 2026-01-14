/**
 * Simulate Shipping Progress
 * Advances orders through shipping stages and creates tracking events
 * Run manually: npx tsx scripts/simulate-shipping.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const statusFlow = [
    { status: 'processing', next: 'shipped' },
    { status: 'shipped', next: 'in_transit' },
    { status: 'in_transit', next: 'out_for_delivery' },
    { status: 'out_for_delivery', next: 'delivered' },
];

const eventTemplates: Record<string, { location: string, description: string }[]> = {
    'shipped': [
        { location: 'Almacén FashionMarket', description: 'Paquete preparado y entregado al transportista' },
    ],
    'in_transit': [
        { location: 'Centro de Clasificación Madrid', description: 'Paquete en tránsito hacia destino' },
        { location: 'Centro Logístico Regional', description: 'Paquete procesado en centro de distribución' },
    ],
    'out_for_delivery': [
        { location: 'Oficina de Reparto Local', description: 'Paquete en reparto - Llegará hoy' },
    ],
    'delivered': [
        { location: 'Destino Final', description: 'Paquete entregado correctamente' },
    ],
};

async function simulateShipping() {
    console.log('Simulating shipping progress...\n');

    // Get orders that are not yet delivered
    const { data: orders, error } = await supabase
        .from('orders')
        .select('id, shipping_status, tracking_number')
        .neq('shipping_status', 'delivered')
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching orders:', error);
        return;
    }

    if (!orders || orders.length === 0) {
        console.log('No orders to update.');
        return;
    }

    console.log(`Found ${orders.length} orders to process\n`);

    for (const order of orders) {
        const currentStep = statusFlow.find(s => s.status === order.shipping_status);

        if (!currentStep) {
            console.log(`Order ${order.tracking_number}: Unknown status "${order.shipping_status}", skipping`);
            continue;
        }

        const nextStatus = currentStep.next;
        const events = eventTemplates[nextStatus];

        console.log(`Order ${order.tracking_number}: ${order.shipping_status} -> ${nextStatus}`);

        // Update order status
        const updateData: any = { shipping_status: nextStatus };

        if (nextStatus === 'shipped') {
            updateData.shipped_at = new Date().toISOString();
        }
        if (nextStatus === 'delivered') {
            updateData.delivered_at = new Date().toISOString();
        }

        const { error: updateError } = await supabase
            .from('orders')
            .update(updateData)
            .eq('id', order.id);

        if (updateError) {
            console.error(`  Error updating order:`, updateError.message);
            continue;
        }

        // Add tracking event
        if (events && events.length > 0) {
            const event = events[Math.floor(Math.random() * events.length)];

            const { error: eventError } = await supabase
                .from('shipment_events')
                .insert({
                    order_id: order.id,
                    status: nextStatus,
                    location: event.location,
                    description: event.description
                });

            if (eventError) {
                console.error(`  Error creating event:`, eventError.message);
            } else {
                console.log(`  Created event: ${event.description}`);
            }
        }

        // Send shipping update email (only for major status changes)
        if (['shipped', 'out_for_delivery', 'delivered'].includes(nextStatus)) {
            try {
                const baseUrl = process.env.PUBLIC_SITE_URL || 'http://localhost:4321';
                await fetch(`${baseUrl}/api/email/shipping-update`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: order.id,
                        status: nextStatus
                    })
                });
                console.log(`  Email notification sent for status: ${nextStatus}`);
            } catch (emailError) {
                console.error(`  Failed to send email notification`);
            }
        }
    }

    console.log('\nSimulation complete!');
}

simulateShipping();
