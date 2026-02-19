export const prerender = false;

import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
import { sendEmail } from "../../../lib/services/email";

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseServiceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export const POST: APIRoute = async ({ request }) => {
    try {
        const body = await request.json();
        const { orderId, userId, reason, details, images } = body;

        if (!orderId || !userId || !reason) {
            return new Response(JSON.stringify({ message: "Faltan datos requeridos" }), { status: 400 });
        }

        // 1. Insert Return Record
        const { data: returnRecord, error: dbError } = await supabase
            .from('returns')
            .insert({
                order_id: orderId,
                user_id: userId,
                reason: reason,
                details: details,
                images: images,
                status: 'pending'
            })
            .select()
            .single();

        if (dbError) {
            console.error('DB Error:', dbError);
            return new Response(JSON.stringify({ message: "Error al guardar en base de datos" }), { status: 500 });
        }

        // 2. Fetch Order and User details for Email
        const { data: order } = await supabase
            .from('orders')
            .select('*')
            .eq('id', orderId)
            .single();

        const { data: userProfile } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', userId)
            .single();

        const reasonLabels: Record<string, string> = {
            wrong_size: "Talla incorrecta",
            damaged: "Producto dañado",
            not_as_described: "No coincide con descripción",
            changed_mind: "Cambio de opinión",
            other: "Otro motivo",
        };

        // 3. Send Email to Customer
        if (userProfile?.email) {
            await sendEmail({
                to: userProfile.email,
                subject: `Solicitud de Devolución Recibida - Pedido #${order?.order_number}`,
                html: `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #1e293b;">Solicitud de Devolución Recibida</h1>
                        <p>Hola ${userProfile.first_name || 'Cliente'},</p>
                        <p>Hemos recibido tu solicitud de devolución para el pedido <strong>#${order?.order_number}</strong>.</p>
                        
                        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #0ea5e9; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Motivo:</strong> ${reasonLabels[reason] || reason}</p>
                            ${details ? `<p style="margin: 5px 0 0 0;"><strong>Detalles:</strong> ${details}</p>` : ''}
                        </div>
                        
                        <p>Nuestro equipo revisará tu solicitud y te responderemos en un plazo máximo de 48 horas.</p>
                        <p>Mientras tanto, puedes seguir el estado de tu devolución desde tu cuenta.</p>
                        <br>
                        <p>Saludos,<br><strong>Fashion Market Team</strong></p>
                    </div>
                `,
            });
        }

        // 4. Send Email to Admin
        const adminEmail = import.meta.env.ADMIN_EMAIL || import.meta.env.SMTP_USER;
        if (adminEmail) {
            await sendEmail({
                to: adminEmail,
                subject: `🔴 Nueva Solicitud de Devolución - Pedido #${order?.order_number}`,
                html: `
                    <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
                        <h1 style="color: #dc2626;">Nueva Solicitud de Devolución</h1>
                        
                        <div style="background-color: #fef2f2; padding: 15px; border-left: 4px solid #dc2626; margin: 20px 0;">
                            <p style="margin: 0;"><strong>Pedido:</strong> #${order?.order_number}</p>
                            <p style="margin: 5px 0 0 0;"><strong>Cliente:</strong> ${userProfile?.first_name || ''} ${userProfile?.last_name || ''} (${userProfile?.email})</p>
                            <p style="margin: 5px 0 0 0;"><strong>Motivo:</strong> ${reasonLabels[reason] || reason}</p>
                            ${details ? `<p style="margin: 5px 0 0 0;"><strong>Detalles:</strong> ${details}</p>` : ''}
                            <p style="margin: 5px 0 0 0;"><strong>Imágenes adjuntas:</strong> ${images?.length || 0}</p>
                        </div>
                        
                        <p><a href="${import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321'}/gestion-fm/devoluciones/${returnRecord.id}" style="display: inline-block; background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold;">Ver Solicitud en Admin Panel</a></p>
                        
                        <p style="color: #64748b; font-size: 12px; margin-top: 30px;">ID de Devolución: ${returnRecord.id}</p>
                    </div>
                `,
            });
        } else {
            console.warn('No ADMIN_EMAIL configured for return notifications');
        }

        return new Response(JSON.stringify({
            success: true,
            message: "Devolución creada correctamente",
            returnId: returnRecord.id
        }), { status: 200 });

    } catch (error: any) {
        console.error('API Error:', error);
        return new Response(JSON.stringify({ message: error.message || "Error interno del servidor" }), { status: 500 });
    }
};
