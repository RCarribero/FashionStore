/**
 * Server-side Registration Handler
 * Bypasses Supabase internal SMTP to use application's properly configured Nodemailer
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/services/email';

export const prerender = false;

// Initialize Supabase Admin Client
const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export const POST: APIRoute = async ({ request }) => {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return new Response(JSON.stringify({ error: 'Email and password required' }), { status: 400 });
        }

        // 1. Generate Signup Link using Admin API
        // This creates the user if they don't exist and returns a confirmation link
        const { data, error } = await supabase.auth.admin.generateLink({
            type: 'signup',
            email,
            password,
            options: {
                redirectTo: `${new URL(request.url).origin}/auth/login`
            }
        });

        if (error) {
            console.error('Supabase Generate Link Error:', error);
            // Handle "User already registered" specifically if needed, 
            // but Supabase usually returns a clear message
            return new Response(JSON.stringify({ error: error.message }), { status: 400 });
        }

        const { user, properties } = data;

        // 2. Send Email using our working SMTP service
        if (properties?.action_link) {
            const emailResult = await sendEmail({
                to: email,
                subject: 'Confirma tu cuenta - FashionStore',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <h2 style="color: #0f172a; text-align: center;">Bienvenido a FashionStore</h2>
                        <p style="color: #334155; line-height: 1.6;">Gracias por registrarte. Para comenzar a comprar, por favor confirma tu dirección de correo electrónico.</p>
                        
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${properties.action_link}" style="background-color: #ef4444; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Confirmar Cuenta</a>
                        </div>
                        
                        <p style="color: #64748b; font-size: 14px;">O copia y pega este enlace en tu navegador:</p>
                        <p style="color: #64748b; font-size: 12px; word-break: break-all;">${properties.action_link}</p>
                    </div>
                `
            });

            if (!emailResult.success) {
                console.error('SMTP Error:', emailResult.error);
                // We created the user but failed to send email. 
                // Ideally we might want to delete the user, but for now let's report error.
                return new Response(JSON.stringify({
                    error: 'User created but failed to send email. Please contact support.'
                }), { status: 500 });
            }
        }

        // 3. Associate guest orders (reusing logic or calling the other endpoint if needed)
        // For simplicity, we'll let the client handle calling associate-guest-orders
        // or trigger it here if we imported the logic. 
        // Given the existing architecture, the client calls it after registration.

        return new Response(JSON.stringify({
            success: true,
            user: user
        }), { status: 200 });

    } catch (error: any) {
        console.error('Registration Error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Internal Server Error' }), { status: 500 });
    }
};
