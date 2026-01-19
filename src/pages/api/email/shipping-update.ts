/**
 * Send Shipping Update Email
 * Uses Gmail SMTP via Nodemailer
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, formatEmailDate as formatDate } from '../../../lib/services/email';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

const statusInfo: Record<string, { title: string, message: string, icon: string }> = {
    'shipped': {
        title: 'Tu pedido ha sido enviado',
        message: 'Tu paquete esta en camino.',
        icon: '📦'
    },
    'in_transit': {
        title: 'Pedido en transito',
        message: 'Tu paquete esta viajando hacia ti.',
        icon: '🚚'
    },
    'out_for_delivery': {
        title: 'Pedido en reparto',
        message: 'Tu paquete llegara hoy.',
        icon: '🏠'
    },
    'delivered': {
        title: 'Pedido entregado',
        message: 'Tu paquete ha sido entregado.',
        icon: '✅'
    }
};

const generateShippingUpdateHTML = (order: any, status: string) => {
    const info = statusInfo[status] || { title: 'Actualizacion', message: '', icon: '📬' };

    return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
    <table width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td style="background-color: #1e293b; padding: 30px; border-radius: 8px;">
                <h1 style="margin: 0 0 20px; color: #fff; font-size: 24px; border-bottom: 1px solid #334155; padding-bottom: 20px;">
                    FASHION<span style="color: #ef4444;">MARKET</span>
                </h1>

                <div style="text-align: center; padding: 30px;">
                    <div style="font-size: 60px; margin-bottom: 15px;">${info.icon}</div>
                    <h2 style="color: #fff; margin: 0 0 10px;">${info.title}</h2>
                    <p style="color: #94a3b8; margin: 0;">${info.message}</p>
                </div>

                <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <table width="100%" style="color: #fff;">
                        <tr>
                            <td style="color: #94a3b8;">Seguimiento:</td>
                            <td style="text-align: right; font-family: monospace; font-weight: bold;">${order.tracking_number}</td>
                        </tr>
                        ${order.estimated_delivery ? `
                        <tr>
                            <td style="color: #94a3b8; padding-top: 8px;">Entrega estimada:</td>
                            <td style="text-align: right; padding-top: 8px;">${formatDate(order.estimated_delivery)}</td>
                        </tr>
                        ` : ''}
                    </table>
                </div>

                <div style="text-align: center; margin-top: 20px;">
                    <a href="${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/pedidos/${order.id}" 
                       style="display: inline-block; padding: 14px 28px; background-color: #ef4444; color: #fff; text-decoration: none; font-weight: bold; border-radius: 4px;">
                        Ver Seguimiento
                    </a>
                </div>

                <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 30px;">
                    © ${new Date().getFullYear()} FashionMarket
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `;
};

export const POST: APIRoute = async ({ request }) => {
    try {
        const { orderId, status } = await request.json();

        if (!orderId || !status) {
            return new Response(JSON.stringify({ error: 'Order ID and status required' }), { status: 400 });
        }

        // Get order and user
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
        }

        // Get user email
        const { data: userData } = await supabase.auth.admin.getUserById(order.user_id);
        const recipientEmail = userData?.user?.email;

        if (!recipientEmail) {
            return new Response(JSON.stringify({ error: 'User email not found' }), { status: 404 });
        }

        const emailHTML = generateShippingUpdateHTML(order, status);
        const info = statusInfo[status] || { title: 'Actualizacion de envio' };

        // Send email via Gmail SMTP
        const result = await sendEmail({
            to: recipientEmail,
            subject: `${info.title} - ${order.tracking_number}`,
            html: emailHTML
        });

        return new Response(JSON.stringify({
            success: result.success,
            error: result.error
        }), { status: 200 });

    } catch (error: any) {
        console.error('Shipping email error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
