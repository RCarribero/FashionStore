/**
 * Order Cancellation API
 * Performs atomic cancellation: updates order status and restores stock
 */
import type { APIRoute } from 'astro';
import { AUTH_CONFIG } from '../../../modules/auth';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

function getAccessTokenFromRequest(request: Request, cookies: { get: (name: string) => { value?: string } | undefined }): string | null {
    const authorization = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authorization && authorization.toLowerCase().startsWith('bearer ')) {
        const token = authorization.slice('bearer '.length).trim();
        return token.length > 0 ? token : null;
    }

    const cookieToken = cookies.get(AUTH_CONFIG.cookies.accessToken)?.value;
    return cookieToken ?? null;
}

const jsonHeaders = { 'Content-Type': 'application/json' };

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { orderId } = await request.json();

        if (!orderId) {
            return new Response(JSON.stringify({
                error: 'Se requiere el ID del pedido'
            }), { status: 400, headers: jsonHeaders });
        }

        const accessToken = getAccessTokenFromRequest(request, cookies);

        if (!accessToken) {
            return new Response(JSON.stringify({
                error: 'No autenticado'
            }), { status: 401, headers: jsonHeaders });
        }
        if (!supabaseUrl || !supabaseAnonKey) {
            return new Response(JSON.stringify({
                error: 'Supabase no está configurado en el servidor'
            }), { status: 500, headers: jsonHeaders });
        }

        const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                headers: { Authorization: `Bearer ${accessToken}` }
            },
            auth: {
                persistSession: false,
                autoRefreshToken: false,
            }
        });

        const { data, error } = await userSupabase.rpc('cancel_order', { p_order_id: orderId });

        if (error) {
            const message = error.message || 'Error al cancelar el pedido';
            const status = message.toLowerCase().includes('no autenticado') || message.toLowerCase().includes('sesion') ? 401
                : message.toLowerCase().includes('no encontrado') ? 404
                    : message.toLowerCase().includes('no puede') || message.toLowerCase().includes('no permite') ? 400
                        : 500;

            return new Response(JSON.stringify({ error: message }), { status, headers: jsonHeaders });
        }

        return new Response(JSON.stringify(data ?? { success: true }), { status: 200, headers: jsonHeaders });

    } catch (error: any) {
        console.error('Cancel order error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Error interno del servidor'
        }), { status: 500, headers: jsonHeaders });
    }
};
