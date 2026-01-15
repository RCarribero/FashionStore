export const prerender = false;

import type { APIRoute } from "astro";
import { createClient } from "@supabase/supabase-js";
// import { sendEmail } from "../../../lib/email"; // Assuming this utility exists, otherwise mocked below

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
        const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single();
        const { data: userProfile } = await supabase.from('user_profiles').select('*').eq('id', userId).single();
        // Fallback for user email if not in profile, usually needed from auth.users which we can't easily query without admin API
        // For now, we assume we might need to send to a hardcoded admin or logged info.

        // Mock email sending log for now or implement real one if `lib/email` is available.
        console.log(`[EMAIL] To Admin: New Return Request for Order #${order?.order_number}`);
        console.log(`[EMAIL] To User: Return Request Received for Order #${order?.order_number}`);

        // Ideally:
        // await sendEmail({ to: userEmail, subject: 'Solicitud de Devolución Recibida', html: ... });
        // await sendEmail({ to: 'admin@fashionstore.com', subject: 'Nueva Solicitud de Devolución', html: ... });

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
