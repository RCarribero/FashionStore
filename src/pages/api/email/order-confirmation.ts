/**
 * Send Order Confirmation Email
 * Uses Gmail SMTP via Nodemailer
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail, formatEmailPrice as formatPrice, formatEmailDate as formatDate } from '../../../lib/services/email';
import { generateInvoicePDF } from '../../../lib/services/invoice';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

// Email HTML template
const generateOrderConfirmationHTML = (order: any, items: any[], recommendations: any[] = []) => {
    const itemsHTML = items.map(item => `
        <tr>
            <td style="padding: 12px; border-bottom: 1px solid #333;">
                ${item.name} <span style="color: #888;">(Talla ${item.size})</span>
            </td>
            <td style="padding: 12px; border-bottom: 1px solid #333; text-align: center;">x${item.quantity}</td>
            <td style="padding: 12px; border-bottom: 1px solid #333; text-align: right;">${formatPrice(item.price)}</td>
        </tr>
    `).join('');

    const recommendationsHTML = recommendations.length > 0 ? `
        <div style="margin-top: 40px; border-top: 1px solid #334155; padding-top: 30px;">
            <h3 style="color: #fff; text-align: center; margin-bottom: 20px;">Completa tu look</h3>
            <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                    ${recommendations.map(prod => `
                        <td width="50%" style="padding: 10px; text-align: center;">
                            <img src="${prod.images?.[0] || 'https://via.placeholder.com/150'}" alt="${prod.name}" style="width: 100%; max-width: 150px; border-radius: 4px; border: 1px solid #334155; margin-bottom: 10px;">
                            <p style="color: #cbd5e1; margin: 5px 0; font-size: 14px;">${prod.name}</p>
                            <p style="color: #fff; font-weight: bold; margin: 0;">${formatPrice(prod.price)}</p>
                            <a href="${import.meta.env.PUBLIC_SITE_URL || 'https://fashionstore.victoriafp.online/'}/productos/${prod.slug}" style="display: inline-block; margin-top: 8px; color: #ef4444; text-decoration: none; font-size: 13px;">Ver Producto</a>
                        </td>
                    `).join('')}
                </tr>
            </table>
        </div>
    ` : '';

    return `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <tr>
            <td style="background-color: #1e293b; padding: 30px; border-radius: 8px;">
                <h1 style="margin: 0 0 20px; color: #fff; font-size: 24px; border-bottom: 1px solid #334155; padding-bottom: 20px;">
                    FASHION<span style="color: #ef4444;">MARKET</span>
                </h1>

                <div style="text-align: center; padding: 20px;">
                    <div style="font-size: 50px; margin-bottom: 10px;">✅</div>
                    <h2 style="color: #fff; margin: 0 0 10px;">Pedido Confirmado</h2>
                    <p style="color: #94a3b8; margin: 0;">Gracias por tu compra</p>
                </div>

                <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <table width="100%" style="color: #fff;">
                        <tr>
                            <td style="color: #94a3b8;">Numero:</td>
                            <td style="text-align: right; font-family: monospace;">${order.tracking_number || order.id.slice(0, 8)}</td>
                        </tr>
                        <tr>
                            <td style="color: #94a3b8; padding-top: 8px;">Fecha:</td>
                            <td style="text-align: right; padding-top: 8px;">${formatDate(order.created_at)}</td>
                        </tr>
                    </table>
                </div>

                <table width="100%" style="color: #fff; margin: 20px 0;">
                    <tr style="background-color: #334155;">
                        <th style="padding: 12px; text-align: left;">Producto</th>
                        <th style="padding: 12px; text-align: center;">Cant.</th>
                        <th style="padding: 12px; text-align: right;">Precio</th>
                    </tr>
                    ${itemsHTML}
                </table>

                <table width="100%" style="color: #fff;">
                    ${order.discount_amount > 0 ? `
                    <tr>
                        <td style="padding: 8px 0; color: #22c55e;">Descuento</td>
                        <td style="text-align: right; color: #22c55e;">-${formatPrice(order.discount_amount)}</td>
                    </tr>
                    ` : ''}
                    <tr style="border-top: 2px solid #334155;">
                        <td style="padding: 12px 0; font-weight: bold; font-size: 18px;">Total</td>
                        <td style="text-align: right; font-weight: bold; font-size: 18px;">${formatPrice(order.total_amount)}</td>
                    </tr>
                </table>
                <div style="text-align: center; margin-top: 30px;">
                    <a href="${import.meta.env.PUBLIC_SITE_URL || 'https://fashionstore.victoriafp.online/'}/pedidos/${order.id}" 
                       style="display: inline-block; padding: 14px 28px; background-color: #ef4444; color: #fff; text-decoration: none; font-weight: bold; border-radius: 4px;">
                        Ver Seguimiento
                    </a>
                </div>

                ${recommendationsHTML}

                <p style="text-align: center; color: #64748b; font-size: 12px; margin-top: 30px; border-top: 1px solid #334155; padding-top: 20px;">
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
        const { orderId, recipientEmail } = await request.json();

        if (!orderId || !recipientEmail) {
            return new Response(JSON.stringify({ error: 'Order ID and email required' }), { status: 400 });
        }

        // Get order details
        const { data: order, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        if (orderError || !order) {
            return new Response(JSON.stringify({ error: 'Order not found' }), { status: 404 });
        }

        // Fetch 2 recommendation products (simple strategy: just take 2 items that are not in the order)
        const { data: recommendations } = await supabase
            .from('products')
            .select('id, name, price, images, slug')
            .limit(2);

        const emailHTML = generateOrderConfirmationHTML(order, order.items || [], recommendations || []);
        const subject = `Confirmacion de Pedido ${order.tracking_number || '#' + order.id.slice(0, 8)}`;

        // Generate invoice PDF
        let invoicePDF: Buffer | null = null;
        try {
            invoicePDF = await generateInvoicePDF(order);
        } catch (pdfError) {
            console.error('Failed to generate invoice PDF:', pdfError);
            // Continue without attachment if PDF generation fails
        }

        // Send email via Gmail SMTP with invoice attachment
        const result = await sendEmail({
            to: recipientEmail,
            subject: subject,
            html: emailHTML,
            attachments: invoicePDF ? [{
                filename: `factura-${order.order_number || order.id.slice(0, 8)}.pdf`,
                content: invoicePDF,
                contentType: 'application/pdf'
            }] : undefined
        });

        return new Response(JSON.stringify({
            success: result.success,
            message: result.success ? 'Email sent' : 'Email not sent (SMTP not configured)',
            error: result.error
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Email error:', error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
