import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { generateCreditNote } from '../../../../lib/invoicing'; // Adjust path if needed
import { sendEmail } from '../../../../lib/services/email';
import Stripe from 'stripe';

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
        const returnId: string | undefined = body?.returnId || body?.return_id;

        if (!returnId) {
            return new Response(JSON.stringify({ error: 'Missing returnId' }), { status: 400 });
        }

        const { data: returnReq, error: returnError } = await supabase
            .from('returns')
            .select('id, status, order_id, user_id')
            .eq('id', returnId)
            .single();

        if (returnError || !returnReq) {
            return new Response(JSON.stringify({ error: 'Return not found' }), { status: 404 });
        }

        // 1. Update Return Request Status
        const { error: updateError } = await supabase
            .from('returns')
            .update({ status: 'approved' })
            .eq('id', returnId);

        if (updateError) {
            console.error('Error updating return:', updateError);
            return new Response(JSON.stringify({ error: 'Failed to approve return' }), { status: 500 });
        }

        // 2. Fetch full order + customer
        const { data: order, error: orderFetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', returnReq.order_id)
            .single();

        if (orderFetchError || !order) {
            return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
        }

        const { data: customer } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', order.user_id)
            .single();

        // 3. Refund in Stripe (on approval)
        const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            return new Response(JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY' }), { status: 500 });
        }

        const stripe = new Stripe(stripeSecretKey);

        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {
            expand: ['payment_intent'],
        });

        const paymentIntent = session.payment_intent;
        const paymentIntentId = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;

        if (!paymentIntentId) {
            return new Response(JSON.stringify({ error: 'Unable to resolve Stripe payment_intent' }), { status: 500 });
        }

        await stripe.refunds.create(
            {
                payment_intent: paymentIntentId,
                // Full refund by default. If partial refunds are needed later, pass amount.
            },
            {
                idempotencyKey: `return_${returnId}`,
            },
        );

        // 4. Update order status now that refund was processed in Stripe
        await supabase
            .from('orders')
            .update({ status: 'refunded' })
            .eq('id', order.id);

        // 5. Generate Credit Note
        if (customer) {
            const creditNoteBuffer = await generateCreditNote(order, customer);

            // 6. Notify customer
            if (customer.email) {
                await sendEmail({
                    to: customer.email,
                    subject: `Devolución Aprobada - Nota de Crédito #${order.order_number}`,
                    html: `
                        <div style="font-family: sans-serif; color: #333;">
                            <h1>Devolución Aprobada</h1>
                            <p>Hola ${customer.first_name || 'Cliente'},</p>
                            <p>Tu solicitud de devolución ha sido aprobada.</p>
                            <p>Adjunto encontrarás la nota de crédito correspondiente.</p>
                            <p>El reembolso de <strong>${(order.total_amount || 0) / 100} EUR</strong> ha sido procesado.</p>
                            <br>
                            <p>Gracias por confiar en Fashion Market.</p>
                        </div>
                    `,
                    attachments: [
                        {
                            filename: `CreditNote-${order.order_number}.pdf`,
                            content: creditNoteBuffer,
                            contentType: 'application/pdf',
                        },
                    ],
                });
            }
        }

        return new Response(JSON.stringify({ success: true, message: 'Return approved and refunded in Stripe' }), { status: 200 });
    } catch (error: any) {
        console.error('Error processing return approval:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
