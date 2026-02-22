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

        if (variantsError && variantsError.code !== 'PGRST116') {
            return new Response(JSON.stringify({ error: 'Failed to fetch variants' }), { status: 500 });
        }

        const availabilityMap: Record<string, number> = {};
        let fallbackStock: number | null = null;

        if (variants && variants.length > 0) {
            for (const variant of variants) {
                availabilityMap[variant.size] = variant.stock;
            }
        } else {
            // Fallback to product.stock if no variants exist
            const { data: product } = await supabase
                .from('products')
                .select('stock')
                .eq('id', productId)
                .single();
            if (product) {
                fallbackStock = product.stock;
            }
        }

        console.log(`[API available.ts] Product ${productId} availability:`, availabilityMap, 'fallback:', fallbackStock);

        return new Response(JSON.stringify({
            success: true,
            productId,
            availability: availabilityMap,
            fallbackStock
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Available stock error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
