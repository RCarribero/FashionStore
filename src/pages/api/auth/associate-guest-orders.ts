/**
 * Associate Guest Orders with User Account
 * When a user logs in or registers, link any orders made as guest with the same email
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
        const { email, userId } = await request.json();

        if (!email || !userId) {
            return new Response(JSON.stringify({ error: 'Email and userId required' }), { status: 400 });
        }

        // Find guest orders with this email that have no user_id
        const { data: guestOrders, error: fetchError } = await supabase
            .from('orders')
            .select('id')
            .is('user_id', null)
            .eq('guest_email', email);

        if (fetchError) {
            console.error('Error fetching guest orders:', fetchError);
            return new Response(JSON.stringify({ error: 'Failed to fetch guest orders' }), { status: 500 });
        }

        if (!guestOrders || guestOrders.length === 0) {
            return new Response(JSON.stringify({ message: 'No guest orders to associate', count: 0 }), { status: 200 });
        }

        // Update all matching orders to be owned by this user
        const orderIds = guestOrders.map(o => o.id);
        const { error: updateError } = await supabase
            .from('orders')
            .update({ user_id: userId })
            .in('id', orderIds);

        if (updateError) {
            console.error('Error associating guest orders:', updateError);
            return new Response(JSON.stringify({ error: 'Failed to associate orders' }), { status: 500 });
        }

        console.log(`Associated ${orderIds.length} guest order(s) for ${email} with user ${userId}`);

        return new Response(JSON.stringify({
            success: true,
            count: orderIds.length,
            message: `${orderIds.length} pedido(s) asociado(s) a tu cuenta`
        }), { status: 200 });

    } catch (error: any) {
        console.error('Associate guest orders error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
