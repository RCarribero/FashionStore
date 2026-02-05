import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
    const query = url.searchParams.get('q');

    if (!query || query.trim() === '') {
        return new Response(JSON.stringify({ products: [] }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    try {
        const searchPattern = `%${query}%`;

        // Parallel search: Products and Categories
        const [productsResult, categoriesResult] = await Promise.all([
            supabase
                .from('products')
                .select('id, name, slug, description, price, stock, images, category_id')
                .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
                .order('name')
                .limit(10),

            supabase
                .from('categories')
                .select('id, name, slug')
                .ilike('name', searchPattern)
                .limit(5)
        ]);

        if (productsResult.error) {
            console.error('Search products error:', productsResult.error);
            throw productsResult.error;
        }

        if (categoriesResult.error) {
            console.error('Search categories error:', categoriesResult.error);
            // We won't throw here, just return empty categories if this fails
        }

        return new Response(JSON.stringify({
            products: productsResult.data || [],
            categories: categoriesResult.data || []
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    } catch (err) {
        console.error('Unexpected error:', err);
        return new Response(JSON.stringify({ error: 'Internal server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' }
        });
    }
};
