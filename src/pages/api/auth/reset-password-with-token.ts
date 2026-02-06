/**
 * Reset Password with Custom Token
 * Validates token from password_recovery_tokens table and updates password
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const POST: APIRoute = async ({ request }) => {
    try {
        const { token, password } = await request.json();

        if (!token || !password) {
            return new Response(JSON.stringify({
                error: 'Se requiere el token y la nueva contrasena'
            }), { status: 400 });
        }

        if (password.length < 6) {
            return new Response(JSON.stringify({
                error: 'La contrasena debe tener al menos 6 caracteres'
            }), { status: 400 });
        }

        // Find valid token
        const { data: tokenData, error: tokenError } = await supabase
            .from('password_recovery_tokens')
            .select('*')
            .eq('token', token)
            .eq('used', false)
            .single();

        if (tokenError || !tokenData) {
            return new Response(JSON.stringify({
                error: 'El enlace de recuperacion no es valido'
            }), { status: 400 });
        }

        // Check expiration
        if (new Date(tokenData.expires_at) < new Date()) {
            return new Response(JSON.stringify({
                error: 'El enlace de recuperacion ha expirado'
            }), { status: 400 });
        }

        // Update password using admin API
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            tokenData.user_id,
            { password: password }
        );

        if (updateError) {
            console.error('Password update error:', updateError);
            return new Response(JSON.stringify({
                error: 'Error al actualizar la contrasena'
            }), { status: 500 });
        }

        // Mark token as used
        await supabase
            .from('password_recovery_tokens')
            .update({ used: true })
            .eq('id', tokenData.id);

        // Clean up old tokens for this user
        await supabase
            .from('password_recovery_tokens')
            .delete()
            .eq('user_id', tokenData.user_id)
            .eq('used', true);

        return new Response(JSON.stringify({
            success: true,
            message: 'Contrasena actualizada correctamente'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Reset password error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Error interno del servidor'
        }), { status: 500 });
    }
};
