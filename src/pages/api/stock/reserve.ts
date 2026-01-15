/**
 * Stock Reservation API - Create Reservation
 * Reserves stock for a cart item for 15 minutes
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

const RESERVATION_DURATION_MS = 15 * 60 * 1000; // 15 minutes

export const POST: APIRoute = async ({ request }) => {
    try {
        const { sessionId, productId, size, quantity } = await request.json();

        if (!sessionId || !productId || !size || !quantity) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: sessionId, productId, size, quantity'
            }), { status: 400 });
        }

        // Get variant info
        const { data: variant, error: variantError } = await supabase
            .from('product_variants')
            .select('id, stock')
            .eq('product_id', productId)
            .eq('size', size)
            .single();

        if (variantError || !variant) {
            return new Response(JSON.stringify({
                error: 'Variant not found'
            }), { status: 404 });
        }

        // Check for existing reservation for this session/product/size
        const { data: existingReservation } = await supabase
            .from('stock_reservations')
            .select('id, quantity')
            .eq('session_id', sessionId)
            .eq('product_id', productId)
            .eq('size', size)
            .gt('expires_at', new Date().toISOString())
            .single();

        // Calculate available stock (actual stock - active reservations from OTHER sessions)
        const { data: reservations } = await supabase
            .from('stock_reservations')
            .select('quantity')
            .eq('variant_id', variant.id)
            .neq('session_id', sessionId)
            .gt('expires_at', new Date().toISOString());

        const otherReservedQty = reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0;
        const currentlyReservedByMe = existingReservation?.quantity || 0;
        const availableStock = variant.stock - otherReservedQty;

        // Check if we can reserve the requested quantity
        const totalNeeded = quantity; // We're updating to this quantity, not adding
        if (totalNeeded > availableStock) {
            return new Response(JSON.stringify({
                error: 'Not enough stock available',
                available: availableStock
            }), { status: 400 });
        }

        const expiresAt = new Date(Date.now() + RESERVATION_DURATION_MS);

        if (existingReservation) {
            // Update existing reservation
            const { error: updateError } = await supabase
                .from('stock_reservations')
                .update({
                    quantity: totalNeeded,
                    expires_at: expiresAt.toISOString()
                })
                .eq('id', existingReservation.id);

            if (updateError) {
                console.error('Failed to update reservation:', updateError);
                return new Response(JSON.stringify({ error: 'Failed to update reservation' }), { status: 500 });
            }
        } else {
            // Create new reservation
            const { error: insertError } = await supabase
                .from('stock_reservations')
                .insert({
                    session_id: sessionId,
                    product_id: productId,
                    variant_id: variant.id,
                    size,
                    quantity: totalNeeded,
                    expires_at: expiresAt.toISOString()
                });

            if (insertError) {
                console.error('Failed to create reservation:', insertError);
                return new Response(JSON.stringify({ error: 'Failed to create reservation' }), { status: 500 });
            }
        }

        return new Response(JSON.stringify({
            success: true,
            expiresAt: expiresAt.getTime(),
            reserved: totalNeeded
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Reserve stock error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
