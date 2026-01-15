/**
 * Stock Reservation API - Cleanup Expired Reservations
 * Removes expired reservations from the database
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
        // Delete all expired reservations
        const { data, error } = await supabase
            .from('stock_reservations')
            .delete()
            .lt('expires_at', new Date().toISOString())
            .select('id');

        if (error) {
            console.error('Failed to cleanup reservations:', error);
            return new Response(JSON.stringify({ error: 'Failed to cleanup' }), { status: 500 });
        }

        const deletedCount = data?.length || 0;
        console.log(`Cleaned up ${deletedCount} expired reservations`);

        return new Response(JSON.stringify({
            success: true,
            deleted: deletedCount
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Cleanup error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};

// Also allow GET for easier testing/cron
export const GET: APIRoute = async (context) => {
    return POST(context);
};
