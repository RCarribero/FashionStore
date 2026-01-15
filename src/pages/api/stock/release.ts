/**
 * Stock Reservation API - Release Reservation
 * Releases a reservation when item is removed from cart
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
        const { sessionId, productId, size } = await request.json();

        if (!sessionId || !productId || !size) {
            return new Response(JSON.stringify({
                error: 'Missing required fields: sessionId, productId, size'
            }), { status: 400 });
        }

        // Delete the reservation
        const { error } = await supabase
            .from('stock_reservations')
            .delete()
            .eq('session_id', sessionId)
            .eq('product_id', productId)
            .eq('size', size);

        if (error) {
            console.error('Failed to release reservation:', error);
            return new Response(JSON.stringify({ error: 'Failed to release reservation' }), { status: 500 });
        }

        return new Response(JSON.stringify({
            success: true
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Release stock error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
