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
        // Search products by name OR description (case-insensitive)
        const searchPattern = `%${query}%`;
        const { data: products, error } = await supabase
            .from('products')
            .select('id, name, slug, description, price, stock, images, category_id')
            .or(`name.ilike.${searchPattern},description.ilike.${searchPattern}`)
            .order('name');

        if (error) {
            console.error('Search error:', error);
            return new Response(JSON.stringify({ error: 'Search failed' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        return new Response(JSON.stringify({ products }), {
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
