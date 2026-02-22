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

        // For each variant, available stock is simply the db stock 
        // because reservations are ALREADY physically deducted from stock during checkout
        const availabilityMap: Record<string, number> = {};

        for (const variant of variants) {
            availabilityMap[variant.size] = variant.stock;
        }

        console.log(`[API available.ts] Product ${productId} availability:`, availabilityMap);

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
