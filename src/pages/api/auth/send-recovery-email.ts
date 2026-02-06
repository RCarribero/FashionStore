/**
 * Send Password Recovery Email
 * Uses Gmail SMTP via Nodemailer (custom flow, not Supabase Auth SMTP)
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/services/email';
import crypto from 'crypto';

export const prerender = false;

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

// Generate secure token
const generateToken = (): string => {
    return crypto.randomBytes(32).toString('hex');
};

// Email HTML template for password recovery
const generateRecoveryEmailHTML = (resetLink: string) => {
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
                    <div style="font-size: 50px; margin-bottom: 10px;">🔐</div>
                    <h2 style="color: #fff; margin: 0 0 10px;">Recupera tu Contrasena</h2>
                    <p style="color: #94a3b8; margin: 0;">Has solicitado restablecer tu contrasena</p>
                </div>

                <div style="background-color: #0f172a; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="color: #cbd5e1; text-align: center; margin: 0 0 20px;">
                        Haz clic en el boton para crear una nueva contrasena. Este enlace expira en 1 hora.
                    </p>
                    <div style="text-align: center;">
                        <a href="${resetLink}" 
                           style="display: inline-block; padding: 14px 28px; background-color: #ef4444; color: #fff; text-decoration: none; font-weight: bold; border-radius: 4px;">
                            Restablecer Contrasena
                        </a>
                    </div>
                </div>

                <p style="color: #64748b; font-size: 14px; text-align: center; margin: 20px 0;">
                    Si no solicitaste este cambio, puedes ignorar este correo. Tu contrasena permanecera igual.
                </p>

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
        const { email } = await request.json();

        if (!email) {
            return new Response(JSON.stringify({
                error: 'Se requiere el correo electronico'
            }), { status: 400 });
        }

        // Find user by email using admin API
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();

        if (listError) {
            console.error('Error listing users:', listError);
            return new Response(JSON.stringify({
                success: true,
                message: 'Si el correo esta registrado, recibiras un enlace de recuperacion'
            }), { status: 200 });
        }

        const user = users.find(u => u.email?.toLowerCase() === email.toLowerCase());

        // Always return success to prevent email enumeration attacks
        if (!user) {
            console.log('User not found for email:', email);
            return new Response(JSON.stringify({
                success: true,
                message: 'Si el correo esta registrado, recibiras un enlace de recuperacion'
            }), { status: 200 });
        }

        // Generate secure token
        const token = generateToken();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

        // Store token in database
        const { error: insertError } = await supabase
            .from('password_recovery_tokens')
            .insert({
                user_id: user.id,
                email: user.email,
                token: token,
                expires_at: expiresAt.toISOString()
            });

        if (insertError) {
            console.error('Error storing token:', insertError);
            return new Response(JSON.stringify({
                error: 'Error al procesar la solicitud'
            }), { status: 500 });
        }

        // Build reset link
        const siteUrl = import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321';
        const resetLink = `${siteUrl}/auth/cambiar-password?token=${token}`;

        // Send email
        const emailHTML = generateRecoveryEmailHTML(resetLink);
        const result = await sendEmail({
            to: user.email!,
            subject: 'Recupera tu Contrasena - FashionMarket',
            html: emailHTML
        });

        if (!result.success) {
            console.error('Email send failed:', result.error);
            return new Response(JSON.stringify({
                error: 'Error al enviar el correo'
            }), { status: 500 });
        }

        console.log('Recovery email sent to:', user.email);

        return new Response(JSON.stringify({
            success: true,
            message: 'Si el correo esta registrado, recibiras un enlace de recuperacion'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Recovery email error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Error interno del servidor'
        }), { status: 500 });
    }
};
