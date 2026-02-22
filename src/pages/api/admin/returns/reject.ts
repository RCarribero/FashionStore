import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const POST: APIRoute = async ({ request, cookies }) => {
    // Auth Check
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
    const accessToken = bearerToken || cookies.get('sb-access-token')?.value;
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
        const { returnId, rejectionReason } = body;

        if (!returnId) {
            return new Response(JSON.stringify({ error: 'Missing returnId' }), { status: 400 });
        }

        console.log('[reject] Processing return:', returnId);

        // 1. Get return request
        const { data: returnReq, error: fetchError } = await supabase
            .from('returns')
            .select('id, status, order_id, user_id')
            .eq('id', returnId)
            .single();

        if (fetchError || !returnReq) {
            console.error('[reject] Return not found:', fetchError);
            return new Response(
                JSON.stringify({ error: 'Return request not found' }),
                { status: 404 }
            );
        }

        // Get order info separately
        const { data: order } = await supabase
            .from('orders')
            .select('order_number')
            .eq('id', returnReq.order_id)
            .single();

        // Get customer info separately
        const { data: customer } = await supabase
            .from('user_profiles')
            .select('email, first_name')
            .eq('id', returnReq.user_id)
            .single();

        // 2. Update Return Status to Rejected (critical path)
        const { error: updateError } = await supabase
            .from('returns')
            .update({
                status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('id', returnId);

        if (updateError) {
            console.error('[reject] Error updating return:', updateError);
            return new Response(
                JSON.stringify({ error: `Error updating return: ${updateError.message}` }),
                { status: 500 }
            );
        }

        console.log('[reject] Return status updated to rejected');

        // 3. Send Email to Customer (non-blocking)
        if (customer?.email) {
            try {
                const { sendEmail } = await import('../../../../lib/services/email');
                await sendEmail({
                    to: customer.email,
                    subject: `Solicitud de Devolucion Rechazada - Pedido #${order?.order_number || ''}`,
                    html: `
                        <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                            <h1 style="color: #dc2626;">Solicitud de Devolucion Rechazada</h1>
                            <p>Hola ${customer.first_name || 'Cliente'},</p>
                            <p>Lamentamos informarte que tu solicitud de devolucion para el pedido <strong>#${order?.order_number || ''}</strong> ha sido rechazada.</p>
                            
                            ${rejectionReason ? `
                                <div style="background-color: #fee; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                                    <p style="margin: 0;"><strong>Motivo:</strong></p>
                                    <p style="margin: 5px 0 0 0;">${rejectionReason}</p>
                                </div>
                            ` : ''}
                            
                            <p>Si tienes alguna pregunta o deseas mas informacion, no dudes en contactarnos.</p>
                            <br>
                            <p>Saludos,<br><strong>Fashion Market Team</strong></p>
                        </div>
                    `,
                });
                console.log('[reject] Email sent to:', customer.email);
            } catch (emailErr: any) {
                console.error('[reject] Email error (non-blocking):', emailErr?.message || emailErr);
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: 'Return rejected successfully' }),
            { status: 200 }
        );

    } catch (error: any) {
        console.error('[reject] Unexpected error:', error?.message || error, error?.stack);
        return new Response(
            JSON.stringify({ error: error?.message || 'Internal server error' }),
            { status: 500 }
        );
    }
};
