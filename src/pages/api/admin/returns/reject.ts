import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../../lib/services/email';

export const POST: APIRoute = async ({ request, cookies }) => {
    // Auth Check
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
    const accessToken = cookies.get('sb-access-token')?.value || bearerToken;
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

        // 1. Get return request details
        const { data: returnReq, error: fetchError } = await supabase
            .from('returns')
            .select(`
                *,
                orders!inner(order_number),
                user_profiles!inner(email, first_name)
            `)
            .eq('id', returnId)
            .single();

        if (fetchError || !returnReq) {
            return new Response(
                JSON.stringify({ error: 'Return request not found' }),
                { status: 404 }
            );
        }

        // 2. Update Return Status to Rejected
        const { error: updateError } = await supabase
            .from('returns')
            .update({ 
                status: 'rejected',
                updated_at: new Date().toISOString()
            })
            .eq('id', returnId);

        if (updateError) {
            throw new Error(`Error updating return: ${updateError.message}`);
        }

        // 3. Send Email to Customer
        await sendEmail({
            to: returnReq.user_profiles.email,
            subject: `Solicitud de Devolución Rechazada - Pedido #${returnReq.orders.order_number}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #dc2626;">Solicitud de Devolución Rechazada</h1>
                    <p>Hola ${returnReq.user_profiles.first_name || 'Cliente'},</p>
                    <p>Lamentamos informarte que tu solicitud de devolución para el pedido <strong>#${returnReq.orders.order_number}</strong> ha sido rechazada.</p>
                    
                    ${rejectionReason ? `
                        <div style="background-color: #fee; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Motivo:</strong></p>
                            <p style="margin: 5px 0 0 0;">${rejectionReason}</p>
                        </div>
                    ` : ''}
                    
                    <p>Si tienes alguna pregunta o deseas más información, no dudes en contactarnos.</p>
                    <br>
                    <p>Saludos,<br><strong>Fashion Market Team</strong></p>
                </div>
            `,
        });

        return new Response(
            JSON.stringify({ success: true, message: 'Return rejected successfully' }),
            { status: 200 }
        );

    } catch (error: any) {
        console.error('Error rejecting return:', error);
        return new Response(
            JSON.stringify({ error: error.message || 'Internal server error' }),
            { status: 500 }
        );
    }
};
