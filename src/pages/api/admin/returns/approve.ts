import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { generateCreditNote } from '../../../../lib/invoicing'; // Adjust path if needed
import { sendEmail } from '../../../../lib/services/email';

export const POST: APIRoute = async ({ request, cookies }) => {
    // Auth Check
    const accessToken = cookies.get('sb-access-token')?.value;
    if (!accessToken) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

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
    const { data: profile } = await supabase.from('user_profiles').select('is_admin').eq('id', user?.id).single();
    if (!profile?.is_admin) return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403 });

    try {
        const body = await request.json();
        const { return_id, order_id, action, amount } = body;

        if (!return_id || !order_id) {
            return new Response(JSON.stringify({ error: 'Missing required fields' }), { status: 400 });
        }

        // 1. Update Return Request Status
        const { error: updateError } = await supabase
            .from('returns') // Assuming a 'returns' table exists, or update order status directly
            .update({ status: 'approved', resolution: action })
            .eq('id', return_id);

        if (updateError) {
            console.error("Error updating return:", updateError);
            // If table doesn't exist, we might just be handling this via order status direct update in this simplified flow
        }

        // 2. Update Order Status to Refunded (or partial)
        // For simplicity, mark as refunded
        await supabase
            .from('orders')
            .update({ status: 'refunded', shipping_status: 'refunded' })
            .eq('id', order_id);

        // 3. Generate Credit Note
        // Fetch full order data for PDF
        const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', order_id)
            .single();

        const { data: customer } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', order.user_id)
            .single();

        const creditNoteBuffer = await generateCreditNote(order, customer);

        // 4. Send Email
        await sendEmail({
            to: customer.email,
            subject: `Devolución Aprobada - Nota de Crédito #${order.order_number}`,
            html: `
                <div style="font-family: sans-serif; color: #333;">
                    <h1>Devolución Aprobada</h1>
                    <p>Hola ${customer.first_name},</p>
                    <p>Tu solicitud de devolución ha sido aprobada.</p>
                    <p>Adjunto encontrarás la nota de crédito correspondiente.</p>
                    <p>El reembolso de <strong>${(amount || order.total_amount) / 100} EUR</strong> ha sido procesado.</p>
                    <br>
                    <p>Gracias por confiar en Fashion Market.</p>
                </div>
            `,
            attachments: [
                {
                    filename: `CreditNote-${order.order_number}.pdf`,
                    content: creditNoteBuffer,
                    contentType: 'application/pdf'
                }
            ]
        });

        return new Response(JSON.stringify({ success: true, message: 'Return processed' }), { status: 200 });

    } catch (error: any) {
        console.error('Error processing return:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
