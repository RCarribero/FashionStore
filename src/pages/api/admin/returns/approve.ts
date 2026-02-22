import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
    // Auth Check
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : undefined;
    // Bearer header takes priority over cookie -- the cookie can be stale/expired
    // but the JS client always sends a fresh token in the Authorization header
    const accessToken = bearerToken || cookies.get('sb-access-token')?.value;
    if (!accessToken) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const supabase = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.SUPABASE_SERVICE_ROLE_KEY
    );

    // Verify admin
    const authClient = createClient(
        import.meta.env.PUBLIC_SUPABASE_URL,
        import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
        { global: { headers: { Authorization: `Bearer ${accessToken}` } } }
    );
    const { data: { user }, error: authErr } = await authClient.auth.getUser();
    if (authErr || !user) {
        return new Response(JSON.stringify({ error: 'Unauthorized' }), {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), {
            status: 403,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Parse body
    let returnId: string | undefined;
    try {
        const body = await request.json();
        returnId = body?.returnId || body?.return_id;
    } catch {
        return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    if (!returnId) {
        return new Response(JSON.stringify({ error: 'Missing returnId' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Fetch return
    const { data: returnReq, error: returnError } = await supabase
        .from('returns')
        .select('id, status, order_id, user_id')
        .eq('id', returnId)
        .single();

    if (returnError || !returnReq) {
        return new Response(JSON.stringify({ error: 'Return not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Fetch order
    const { data: order, error: orderError } = await supabase
        .from('orders')
        .select('id, order_number, stripe_session_id, total_amount, user_id, items, shipping_address')
        .eq('id', returnReq.order_id)
        .single();

    if (orderError || !order) {
        return new Response(JSON.stringify({ error: 'Order not found' }), {
            status: 404,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    // Stripe refund
    const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY;
    if (!stripeSecretKey) {
        return new Response(JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }

    const stripe = new Stripe(stripeSecretKey, {
        httpClient: Stripe.createFetchHttpClient(),
    });

    let stripeRefunded = false;

    if (order.stripe_session_id) {
        try {
            const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id, {
                expand: ['payment_intent'],
            });

            const pi = session.payment_intent;
            const piId = typeof pi === 'string' ? pi : pi?.id;

            if (!piId) {
                return new Response(JSON.stringify({ error: 'Could not resolve Stripe payment_intent' }), {
                    status: 500,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            await stripe.refunds.create(
                { payment_intent: piId },
                { idempotencyKey: `return_${returnId}` }
            );
            stripeRefunded = true;
        } catch (stripeErr: any) {
            const code = stripeErr?.code || stripeErr?.raw?.code;
            if (code === 'charge_already_refunded' || code === 'already_refunded') {
                stripeRefunded = true;
            } else {
                return new Response(
                    JSON.stringify({ error: `Stripe refund failed: ${stripeErr?.message || 'Unknown error'}` }),
                    { status: 502, headers: { 'Content-Type': 'application/json' } }
                );
            }
        }
    } else {
        stripeRefunded = true; // no session to refund
    }

    // Update return status
    if (returnReq.status !== 'approved' && returnReq.status !== 'completed') {
        const { error: updateReturnErr } = await supabase
            .from('returns')
            .update({ status: 'approved', updated_at: new Date().toISOString() })
            .eq('id', returnId);

        if (updateReturnErr) {
            return new Response(JSON.stringify({ error: `DB update failed: ${updateReturnErr.message}` }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    }

    // Update order status
    await supabase
        .from('orders')
        .update({ status: 'refunded' })
        .eq('id', order.id);

    // Non-blocking: send email notification (no PDF for now to avoid pdfkit issues)
    const { data: customer } = await supabase
        .from('user_profiles')
        .select('email, first_name')
        .eq('id', returnReq.user_id)
        .single();

    if (customer?.email) {
        // Fire and forget -- do not await so a failure cannot crash this response
        const emailPayload = {
            to: customer.email,
            subject: `Devolucion Aprobada - Pedido #${order.order_number}`,
            html: `
                <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                    <h1 style="color: #16a34a;">Devolucion Aprobada</h1>
                    <p>Hola ${customer.first_name || 'Cliente'},</p>
                    <p>Tu solicitud de devolucion ha sido aprobada.</p>
                    <p>El reembolso de <strong>${((order.total_amount || 0) / 100).toFixed(2)} EUR</strong> ha sido procesado y se vera reflejado en tu metodo de pago original en 5-10 dias habiles.</p>
                    <br>
                    <p>Gracias por confiar en Fashion Market.</p>
                </div>
            `,
        };

        import('../../../../lib/services/email')
            .then(({ sendEmail }) => sendEmail(emailPayload))
            .catch((err) => console.error('[approve] Email error (non-blocking):', err?.message));
    }

    return new Response(JSON.stringify({
        success: true,
        stripeRefunded,
        message: 'Return approved successfully',
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
    });
};
