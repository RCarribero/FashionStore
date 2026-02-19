import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, cookies }) => {
    // Auth Check
    const accessToken = cookies.get('sb-access-token')?.value;
    if (!accessToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const supabase = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Get Admin User
    const authClient = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    const { data: { user } } = await authClient.auth.getUser();

    // Check Admin Role
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user?.id)
        .single();

    if (!profile?.is_admin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });
    }

    try {
        const body = await request.json();
        const { returnId, status } = body;

        if (!returnId || !status) {
            return new Response(
                JSON.stringify({ error: 'Missing required fields: returnId, status' }),
                { status: 400 }
            );
        }

        // Validate status
        const validStatuses = ['pending', 'approved', 'rejected', 'completed'];
        if (!validStatuses.includes(status)) {
            return new Response(
                JSON.stringify({ error: 'Invalid status' }),
                { status: 400 }
            );
        }

        // Update Return Status
        const { error: updateError } = await supabase
            .from('returns')
            .update({ 
                status,
                updated_at: new Date().toISOString()
            })
            .eq('id', returnId);

        if (updateError) {
            throw new Error(`Error updating return status: ${updateError.message}`);
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Return status updated successfully' }),
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error updating return status:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500 }
        );
    }
};
