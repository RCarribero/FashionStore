/**
 * Categories CRUD API
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

// Create category
export const POST: APIRoute = async ({ request }) => {
    try {
        const data = await request.json();
        console.log('Creating category:', data);

        const { data: category, error } = await supabase
            .from('categories')
            .insert(data)
            .select()
            .single();

        if (error) {
            console.error('Category creation error:', error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        console.log('Category created:', category);
        return new Response(JSON.stringify(category), { status: 201 });
    } catch (error: any) {
        console.error('Category API error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
