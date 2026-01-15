/**
 * Stock Reservation API - Release All Reservations for a Session
 * Used after successful checkout to clear all reservations
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
        const { sessionId } = await request.json();

        if (!sessionId) {
            return new Response(JSON.stringify({
                error: 'Missing sessionId'
            }), { status: 400 });
        }

        // Delete all reservations for this session
        const { data, error } = await supabase
            .from('stock_reservations')
            .delete()
            .eq('session_id', sessionId)
            .select('id');

        if (error) {
            console.error('Failed to release session reservations:', error);
            return new Response(JSON.stringify({ error: 'Failed to release reservations' }), { status: 500 });
        }

        return new Response(JSON.stringify({
            success: true,
            released: data?.length || 0
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Release all error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
