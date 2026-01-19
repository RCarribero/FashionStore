/**
 * Change Password API
 * Allows authenticated users to change their password
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

export const prerender = false;

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const POST: APIRoute = async ({ request, cookies }) => {
    try {
        const { currentPassword, newPassword } = await request.json();

        if (!currentPassword || !newPassword) {
            return new Response(JSON.stringify({
                error: 'Se requieren la contrasena actual y la nueva'
            }), { status: 400 });
        }

        if (newPassword.length < 6) {
            return new Response(JSON.stringify({
                error: 'La nueva contrasena debe tener al menos 6 caracteres'
            }), { status: 400 });
        }

        // Get access token from cookies
        const accessToken = cookies.get('sb-access-token')?.value;
        const refreshToken = cookies.get('sb-refresh-token')?.value;

        if (!accessToken) {
            return new Response(JSON.stringify({
                error: 'No autenticado'
            }), { status: 401 });
        }

        // Create client with user's session
        const userSupabase = createClient(
            import.meta.env.PUBLIC_SUPABASE_URL,
            import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
            {
                global: {
                    headers: {
                        Authorization: `Bearer ${accessToken}`
                    }
                }
            }
        );

        // Get current user
        const { data: { user }, error: userError } = await userSupabase.auth.getUser();

        if (userError || !user) {
            return new Response(JSON.stringify({
                error: 'Sesion invalida'
            }), { status: 401 });
        }

        // Verify current password by trying to sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email!,
            password: currentPassword
        });

        if (signInError) {
            return new Response(JSON.stringify({
                error: 'La contrasena actual es incorrecta'
            }), { status: 400 });
        }

        // Update password using admin client
        const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (updateError) {
            return new Response(JSON.stringify({
                error: 'Error al actualizar la contrasena'
            }), { status: 500 });
        }

        return new Response(JSON.stringify({
            success: true,
            message: 'Contrasena actualizada correctamente'
        }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' }
        });

    } catch (error: any) {
        console.error('Change password error:', error);
        return new Response(JSON.stringify({
            error: error.message || 'Error interno del servidor'
        }), { status: 500 });
    }
};
