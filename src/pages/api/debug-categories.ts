
import type { APIRoute } from 'astro';
import { createAdminClient } from '../../modules/auth/services/auth.service';

export const GET: APIRoute = async () => {
    const supabase = createAdminClient();
    const { data: categories, error } = await supabase
        .from('categories')
        .select('id, name, slug');

    if (error) {
        return new Response(JSON.stringify({ error }), { status: 500 });
    }

    return new Response(JSON.stringify({ categories }), {
        status: 200,
        headers: {
            'Content-Type': 'application/json',
        },
    });
};
