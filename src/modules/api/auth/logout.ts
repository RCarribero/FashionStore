import type { APIRoute } from 'astro';
import { supabase } from '../../../lib/supabase';

export const POST: APIRoute = async ({ redirect, cookies }) => {
    // Sign out from Supabase
    await supabase.auth.signOut();

    // Clear auth cookies
    cookies.delete('sb-access-token', { path: '/' });
    cookies.delete('sb-refresh-token', { path: '/' });

    // Redirect to login page
    return redirect('/admin/login');
};
