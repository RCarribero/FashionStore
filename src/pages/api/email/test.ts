/**
 * Test Email Endpoint
 * For debugging email configuration
 */
import type { APIRoute } from 'astro';
import { sendEmail } from '../../../lib/services/email';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
    const url = new URL(request.url);
    const to = url.searchParams.get('to');

    if (!to) {
        return new Response(JSON.stringify({
            error: 'Missing "to" parameter. Use /api/email/test?to=your@email.com'
        }), { status: 400 });
    }

    try {
        const result = await sendEmail({
            to: to,
            subject: 'Test Email - FashionMarket',
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; background: #1e293b; color: white;">
                    <h1 style="color: #ef4444;">FashionMarket</h1>
                    <p>Este es un email de prueba.</p>
                    <p>Si recibes esto, la configuracion SMTP funciona correctamente.</p>
                    <p style="color: #94a3b8; font-size: 12px; margin-top: 20px;">
                        Enviado: ${new Date().toLocaleString('es-ES')}
                    </p>
                </div>
            `
        });

        return new Response(JSON.stringify({
            success: result.success,
            message: result.success ? `Email enviado a ${to}` : 'Error al enviar',
            error: result.error,
            smtpUser: import.meta.env.SMTP_USER || 'NOT SET'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        return new Response(JSON.stringify({
            error: error.message,
            smtpUser: import.meta.env.SMTP_USER || 'NOT SET'
        }), { status: 500 });
    }
};
