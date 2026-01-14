/**
 * Toggle user admin status
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { userId, isAdmin } = await request.json();

        if (!userId) {
            return new Response(JSON.stringify({ error: 'User ID required' }), { status: 400 });
        }

        const { error } = await supabase
            .from('user_profiles')
            .update({ is_admin: isAdmin })
            .eq('id', userId);

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
