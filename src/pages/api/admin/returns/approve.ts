import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const POST: APIRoute = async ({ request, cookies }) => {
    // Auth Check
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
    const accessToken = cookies.get('sb-access-token')?.value || bearerToken;
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

        console.log('[approve] Processing return:', returnId);

        const { data: returnReq, error: returnError } = await supabase
            .from('returns')
            .select('id, status, order_id, user_id')
            .eq('id', returnId)
            .single();

        if (returnError || !returnReq) {
            console.error('[approve] Return not found:', returnError);
            return new Response(JSON.stringify({ error: 'Return not found' }), { status: 404 });
        }

        // 1. Fetch full order + customer
        const { data: order, error: orderFetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', returnReq.order_id)
            .single();

        if (orderFetchError || !order) {
            console.error('[approve] Order not found:', orderFetchError);
            return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
        }

        const { data: customer } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', order.user_id)
            .single();

        // 2. Refund in Stripe
        const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
        if (!stripeSecretKey) {
            return new Response(JSON.stringify({ error: 'Missing STRIPE_SECRET_KEY' }), { status: 500 });
        }

        const stripe = new Stripe(stripeSecretKey, {
            httpClient: Stripe.createFetchHttpClient(),
        });

        let refundSuccess = false;

        if (order.stripe_session_id) {
            try {
                console.log('[approve] Retrieving Stripe session:', order.stripe_session_id);
                const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {
                    expand: ['payment_intent'],
                });

                const paymentIntent = session.payment_intent;
                const paymentIntentId = typeof paymentIntent === 'string' ? paymentIntent : paymentIntent?.id;

                if (!paymentIntentId) {
                    console.error('[approve] Could not resolve payment_intent from session');
                    return new Response(JSON.stringify({ error: 'Unable to resolve Stripe payment_intent' }), { status: 500 });
                }

                console.log('[approve] Creating refund for payment_intent:', paymentIntentId);
                await stripe.refunds.create(
                    { payment_intent: paymentIntentId },
                    { idempotencyKey: `return_${returnId}` },
                );
                refundSuccess = true;
                console.log('[approve] Stripe refund created successfully');
            } catch (err: any) {
                const code = err?.code || err?.raw?.code;
                if (code === 'charge_already_refunded' || code === 'already_refunded') {
                    console.log('[approve] Charge already refunded, continuing');
                    refundSuccess = true;
                } else {
                    console.error('[approve] Stripe refund error:', err?.message || err);
                    return new Response(
                        JSON.stringify({ error: `Stripe refund failed: ${err?.message || 'Unknown error'}` }),
                        { status: 502 }
                    );
                }
            }
        } else {
            console.warn('[approve] No stripe_session_id found, skipping refund');
            refundSuccess = true;
        }

        // 3. Update DB statuses (critical path)
        if (returnReq.status !== 'approved' && returnReq.status !== 'completed') {
            const { error: updateError } = await supabase
                .from('returns')
                .update({ status: 'approved', updated_at: new Date().toISOString() })
                .eq('id', returnId);

            if (updateError) {
                console.error('[approve] Error updating return status:', updateError);
                return new Response(JSON.stringify({ error: 'Failed to approve return in database' }), { status: 500 });
            }
            console.log('[approve] Return status updated to approved');
        }

        await supabase
            .from('orders')
            .update({ status: 'refunded' })
            .eq('id', order.id);
        console.log('[approve] Order status updated to refunded');

        // 4. Credit note + email (non-blocking -- failures here do NOT cause a 500)
        if (customer) {
            try {
                const { generateCreditNote } = await import('../../../../lib/invoicing');
                const creditNoteBuffer = await generateCreditNote(order, customer);
                console.log('[approve] Credit note generated');

                if (customer.email) {
                    const { sendEmail } = await import('../../../../lib/services/email');
                    await sendEmail({
                        to: customer.email,
                        subject: `Devolucion Aprobada - Nota de Credito #${order.order_number}`,
                        html: `
                            <div style="font-family: sans-serif; color: #333;">
                                <h1>Devolucion Aprobada</h1>
                                <p>Hola ${customer.first_name || 'Cliente'},</p>
                                <p>Tu solicitud de devolucion ha sido aprobada.</p>
                                <p>Adjunto encontraras la nota de credito correspondiente.</p>
                                <p>El reembolso de <strong>${((order.total_amount || 0) / 100).toFixed(2)} EUR</strong> ha sido procesado.</p>
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
                    console.log('[approve] Email sent to:', customer.email);
                }
            } catch (emailErr: any) {
                // Log but do NOT fail the request -- the refund is already processed
                console.error('[approve] Credit note / email error (non-blocking):', emailErr?.message || emailErr);
            }
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Return approved' + (refundSuccess ? ' and refunded in Stripe' : ''),
        }), { status: 200 });
    } catch (error: any) {
        console.error('[approve] Unexpected error:', error?.message || error, error?.stack);
        return new Response(JSON.stringify({ error: error?.message || 'Internal server error' }), { status: 500 });
    }
};
