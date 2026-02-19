/**
 * Cron Job - Cleanup Expired Stock Reservations
 * Deletes reservations that have expired (expires_at < NOW())
 *
 * Can be called by:
 * - Supabase pg_cron extension
 * - External cron service (e.g. cron-job.org)
 * - Vercel/Netlify scheduled functions
 *
 * Protected by CRON_SECRET header to avoid unauthorized calls.
 *
 * Example call:
 *   GET /api/cron/cleanup-reservations
 *   Authorization: Bearer <CRON_SECRET>
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    // Optional secret check - only enforced if CRON_SECRET is set
    const cronSecret = import.meta.env.CRON_SECRET;
    if (cronSecret) {
        const authHeader = request.headers.get('Authorization');
        const token = authHeader?.replace('Bearer ', '');
        if (token !== cronSecret) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
        }
    }

    try {
        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('stock_reservations')
            .delete()
            .lt('expires_at', now)
            .select('id');

        if (error) {
            console.error('[Cron] Failed to cleanup reservations:', error);
            return new Response(JSON.stringify({ error: 'Cleanup failed' }), { status: 500 });
        }

        const deletedCount = data?.length || 0;
        console.log(`[Cron] Cleaned up ${deletedCount} expired reservations`);

        return new Response(JSON.stringify({
            success: true,
            deleted: deletedCount,
            timestamp: now
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('[Cron] Cleanup error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
