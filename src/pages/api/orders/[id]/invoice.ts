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

    // Auth check
    const accessToken = cookies.get('sb-access-token')?.value;
    if (!accessToken) return new Response('Unauthorized', { status: 401 });

    const authClient = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );

    const { data: { user } } = await authClient.auth.getUser();
    if (!user) return new Response('Unauthorized', { status: 401 });

    // Fetch Order
    const { data: order, error } = await supabase
        .from('orders')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !order) return new Response('Order not found', { status: 404 });

    // Verify ownership (or Admin)
    // For demo, assume admin has access too, but simple check:
    // If not admin (how to check? maybe email?) let's just check user_id if not admin.
    // Assuming simple check for now:
    // Verify ownership or Admin role
    if (order.user_id !== user.id) {
        const { data: callerProfile } = await supabase
            .from('user_profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single();

        if (!callerProfile?.is_admin) {
            return new Response('Unauthorized', { status: 403 });
        }
    }

    // Fetch User Profile for name
    const { data: userProfile } = await supabase
        .from('user_profiles')
        .select('first_name, last_name, email')
        .eq('id', order.user_id)
        .single();

    if (!userProfile) return new Response('User profile not found', { status: 404 });

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
