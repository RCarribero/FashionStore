import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { generateInvoice, generateCreditNote } from '../../../../lib/invoicing';

export const prerender = false;

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const GET: APIRoute = async ({ params, request, cookies }) => {
    const { id } = params;

    // Fetch Order first
    const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !order) return new Response('Order not found', { status: 404 });

    // Auth check - try cookie auth first
    const accessToken = cookies.get('sb-access-token')?.value;
    let authenticatedUserId: string | null = null;

    if (accessToken) {
        const authClient = createClient(
            import.meta.env.PUBLIC_SUPABASE_URL,
            import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
            { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
        );

        const { data: { user } } = await authClient.auth.getUser();
        if (user) authenticatedUserId = user.id;
    }

    // Authorization: allow if user owns order, is admin, or order is a guest order (no user_id)
    if (order.user_id) {
        // Order belongs to a registered user - require auth
        if (!authenticatedUserId) return new Response('Unauthorized', { status: 401 });

        if (order.user_id !== authenticatedUserId) {
            const { data: callerProfile } = await supabase
                .from('user_profiles')
                .select('is_admin')
                .eq('id', authenticatedUserId)
                .single();

            if (!callerProfile?.is_admin) {
                return new Response('Unauthorized', { status: 403 });
            }
        }
    }
    // If order.user_id is null (guest order), allow download - 
    // the order ID itself acts as a secret (UUID is unguessable)

    // Fetch User Profile for name (if registered user)
    let userProfile: any = null;
    if (order.user_id) {
        const { data } = await supabase
            .from('user_profiles')
            .select('first_name, last_name, email')
            .eq('id', order.user_id)
            .single();
        userProfile = data;
    }

    // For guest orders, build profile from shipping_address or guest_email
    if (!userProfile) {
        const addr = order.shipping_address;
        userProfile = {
            first_name: addr?.name?.split(' ')[0] || 'Cliente',
            last_name: addr?.name?.split(' ').slice(1).join(' ') || '',
            email: order.guest_email || ''
        };
    }

    const url = new URL(request.url);
    const type = url.searchParams.get('type');

    try {
        let pdfBuffer: Buffer;
        if (type === 'credit_note') {
            pdfBuffer = await generateCreditNote(order, userProfile);
        } else {
            pdfBuffer = await generateInvoice(order, userProfile);
        }

        return new Response(pdfBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="invoice-${order.order_number || id}.pdf"`
            }
        });
    } catch (e) {
        console.error(e);
        return new Response('Error generating PDF', { status: 500 });
    }
};
