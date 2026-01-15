export const prerender = false;

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';
import { sendEmail } from '../../../lib/email';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

// ... (comments) ...

const supabase = createClient(supabaseUrl || '', supabaseServiceKey || supabaseAnonKey || '');

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { email } = body;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Email invalido'
            }), { status: 400 });
        }

        // Check if already subscribed
        const { data: existing } = await supabase
            .from('newsletter_subscribers')
            .select('id')
            .eq('email', email)
            .single();

        if (existing) {
            return new Response(JSON.stringify({
                success: false,
                error: 'Ya estas suscrito a nuestro club'
            }), { status: 400 });
        }

        // Insert new subscriber
        const { error: insertError } = await supabase
            .from('newsletter_subscribers')
            .insert({ email });

        if (insertError) {
            console.error('Newsletter insert error:', insertError);
            return new Response(JSON.stringify({
                success: false,
                error: 'Error al procesar la suscripcion'
            }), { status: 500 });
        }

        // Send welcome email
        const welcomeHtml = `
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #000; padding: 30px; text-align: center; }
        .logo { color: #fff; font-size: 24px; font-weight: bold; text-decoration: none; }
        .logo span { color: #e11d48; }
        .content { padding: 40px 20px; text-align: center; }
        .title { font-size: 28px; font-weight: bold; margin-bottom: 20px; text-transform: uppercase; }
        .text { margin-bottom: 30px; font-size: 16px; color: #666; }
        .button { display: inline-block; padding: 15px 30px; background-color: #e11d48; color: #ffffff; text-decoration: none; font-weight: bold; border-radius: 4px; text-transform: uppercase; }
        .footer { border-top: 1px solid #eee; padding-top: 20px; margin-top: 40px; text-align: center; font-size: 12px; color: #999; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <a href="${import.meta.env.PUBLIC_SITE_URL}" class="logo">FASHION<span>MARKET</span></a>
        </div>
        <div class="content">
            <h1 class="title">¡Bienvenido al Club!</h1>
            <p class="text">Gracias por unirte a nuestra comunidad exclusiva. Ahora serás el primero en enterarte de:</p>
            <ul style="text-align: left; max-width: 300px; margin: 0 auto 30px auto; color: #666;">
                <li>Nuevos lanzamientos y colecciones</li>
                <li>Ofertas exclusivas para miembros</li>
                <li>Acceso anticipado a rebajas</li>
                <li>Promociones especiales y cupones</li>
            </ul>
            <p class="text">Tu estilo empieza aquí.</p>
            <a href="${import.meta.env.PUBLIC_SITE_URL}/productos" class="button">Ver Novedades</a>
        </div>
        <div class="footer">
            <p>&copy; ${new Date().getFullYear()} FashionMarket. Todos los derechos reservados.</p>
            <p><a href="#">Darse de baja</a></p>
        </div>
    </div>
</body>
</html>
`;

        await sendEmail({
            to: email,
            subject: '¡Bienvenido a FashionMarket Club!',
            html: welcomeHtml
        });

        return new Response(JSON.stringify({
            success: true,
            message: 'Suscripción completada'
        }));

    } catch (error) {
        console.error('Newsletter API error:', error);
        return new Response(JSON.stringify({
            success: false,
            error: 'Error interno del servidor'
        }), { status: 500 });
    }
};
