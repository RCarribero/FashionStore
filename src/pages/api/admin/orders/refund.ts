import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const POST: APIRoute = async ({ request, cookies }) => {
    // 1. Auth Check - Server Side
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
    const accessToken = cookies.get('sb-access-token')?.value || bearerToken;

    if (!accessToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(accessToken);
    if (authError || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
    }

    // 2. Admin Check
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        return new Response(JSON.stringify({ error: 'Forbidden: Admin access required' }), { status: 403 });
    }

    const { orderId, reason } = await request.json();

    if (!orderId) {
        return new Response(JSON.stringify({ error: 'Order ID required' }), { status: 400 });
    }

    // 3. Fetch Order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('*, items, shipping_address')
        .eq('id', orderId)
        .single();

    if (orderError || !order) {
        return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
    }

    if (!order.user_id) {
        return new Response(
            JSON.stringify({ error: 'Guest orders cannot be returned from admin (missing user_id)' }),
            { status: 400 },
        );
    }

    // If there is already a return request for this order, reuse it.
    const { data: existingReturn } = await supabase
        .from('returns')
        .select('id, status, created_at')
        .eq('order_id', orderId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (existingReturn?.id) {
        return new Response(
            JSON.stringify({
                message: 'Return request already exists',
                returnId: existingReturn.id,
                status: existingReturn.status,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        );
    }

    // 4. Create Return Request (pending)
    const { data: returnRecord, error: returnError } = await supabase
        .from('returns')
        .insert({
            order_id: orderId,
            user_id: order.user_id,
            reason: 'admin_initiated',
            details: reason || 'Solicitud creada desde el panel de administración',
            status: 'pending',
        })
        .select('id, status')
        .single();

    if (returnError || !returnRecord) {
        console.error('Return creation error:', returnError);
        return new Response(JSON.stringify({ error: 'Failed to create return request' }), { status: 500 });
    }

    return new Response(
        JSON.stringify({ message: 'Return request created', returnId: returnRecord.id, status: returnRecord.status }),
        {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
        },
    );
};
