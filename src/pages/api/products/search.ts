import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');

    if (!q || q.length < 2) {
        return new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });
    }

    const { data, error } = await supabase
        .from('products')
        .select('id, name, slug, price, images')
        .or(`name.ilike.%${q}%,description.ilike.%${q}%`)
        .limit(5);

    if (error) {
        console.error('Search error:', error);
        return new Response(JSON.stringify({ error: 'Search failed' }), { status: 500 });
    }

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
