/**
 * Stock Availability API
 * Returns available stock for product variants, accounting for active reservations
 * GET /api/stock/available?productId=...&sessionId=...  (session optional, excludes own reservations)
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    try {
        const productId = url.searchParams.get('productId');
        const sessionId = url.searchParams.get('sessionId') || null;

        if (!productId) {
            return new Response(JSON.stringify({ error: 'Missing productId' }), { status: 400 });
        }

        // Get all variants for this product
        const { data: variants, error: variantsError } = await supabase
            .from('product_variants')
            .select('id, size, stock')
            .eq('product_id', productId);

        if (variantsError || !variants) {
            return new Response(JSON.stringify({ error: 'Failed to fetch variants' }), { status: 500 });
        }

        // For each variant, calculate available stock (subtract active reservations from OTHER sessions)
        const availabilityMap: Record<string, number> = {};

        for (const variant of variants) {
            // Get sum of active reservations from OTHER sessions
            let query = supabase
                .from('stock_reservations')
                .select('quantity')
                .eq('variant_id', variant.id)
                .gt('expires_at', new Date().toISOString());

            if (sessionId) {
                query = query.neq('session_id', sessionId);
            }

            const { data: reservations } = await query;

            const reservedByOthers = reservations?.reduce((sum, r) => sum + r.quantity, 0) || 0;
            const available = Math.max(0, variant.stock - reservedByOthers);
            availabilityMap[variant.size] = available;
        }

        return new Response(JSON.stringify({
            success: true,
            productId,
            availability: availabilityMap  // { "38": 3, "39": 0, "40": 2, ... }
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Available stock error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
