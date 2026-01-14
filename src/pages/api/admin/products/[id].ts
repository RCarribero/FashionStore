/**
 * Product CRUD by ID
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

// Get product
export const GET: APIRoute = async ({ params }) => {
    const { id } = params;

    const { data, error } = await supabase
        .from('products')
        .select('*, variants:product_variants(*)')
        .eq('id', id)
        .single();

    if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 404 });
    }

    return new Response(JSON.stringify(data), { status: 200 });
};

// Update product
export const PUT: APIRoute = async ({ params, request }) => {
    try {
        const { id } = params;
        const { variants, ...productData } = await request.json();

        const { data: product, error } = await supabase
            .from('products')
            .update(productData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        // Update variants if provided
        if (variants) {
            for (const v of variants) {
                await supabase
                    .from('product_variants')
                    .upsert({
                        product_id: id,
                        size: v.size,
                        stock: v.stock
                    }, { onConflict: 'product_id,size' });
            }
        }

        return new Response(JSON.stringify(product), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};

// Delete product
export const DELETE: APIRoute = async ({ params }) => {
    try {
        const { id } = params;

        // Delete variants first
        await supabase.from('product_variants').delete().eq('product_id', id);

        const { error } = await supabase
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
