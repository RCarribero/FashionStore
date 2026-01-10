/**
 * Auth Service
 * Supabase authentication functions
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { APP_CONFIG } from '../../../config/app';
import { AUTH_CONFIG } from '../config';
import type { Session } from '../../../shared/types';

const supabaseUrl = APP_CONFIG.supabase.url || 'https://placeholder.supabase.co';
const supabaseAnonKey = APP_CONFIG.supabase.anonKey || 'placeholder';

/**
 * Public Supabase client
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Check if Supabase is properly configured
 */
export function isSupabaseConfigured(): boolean {
    return !supabaseUrl.includes('placeholder') && supabaseAnonKey !== 'placeholder';
}

/**
 * Create admin client for server-side operations
 */
export function createAdminClient(): SupabaseClient {
    const serviceRoleKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
        throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable');
    }

    return createClient(supabaseUrl, serviceRoleKey, {
        auth: {
            autoRefreshToken: AUTH_CONFIG.session.autoRefresh,
            persistSession: false,
        },
    });
}

/**
 * Sign in with email and password
 */
export async function signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({ email, password });
}

/**
 * Sign out
 */
export async function signOut() {
    return await supabase.auth.signOut();
}

/**
 * Get session from request cookies (SSR)
 */
export async function getSession(request: Request): Promise<Session | null> {
    const cookies = request.headers.get('cookie');

    if (!cookies) {
        return null;
    }

    const accessToken = cookies
        .split(';')
        .find(c => c.trim().startsWith(`${AUTH_CONFIG.cookies.accessToken}=`))
        ?.split('=')[1];

    const refreshToken = cookies
        .split(';')
        .find(c => c.trim().startsWith(`${AUTH_CONFIG.cookies.refreshToken}=`))
        ?.split('=')[1];

    if (!accessToken || !refreshToken) {
        return null;
    }

    const { data: { user }, error } = await supabase.auth.getUser(accessToken);

    if (error || !user) {
        return null;
    }

    return {
        user: { id: user.id, email: user.email || '' },
        accessToken,
        refreshToken
    };
}

/**
 * Create auth cookies for response
 */
export function createAuthCookies(accessToken: string, refreshToken: string): string[] {
    return [
        `${AUTH_CONFIG.cookies.accessToken}=${accessToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${AUTH_CONFIG.cookies.maxAge.access}`,
        `${AUTH_CONFIG.cookies.refreshToken}=${refreshToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${AUTH_CONFIG.cookies.maxAge.refresh}`,
    ];
}

/**
 * Create logout cookies (delete cookies)
 */
export function createLogoutCookies(): string[] {
    return [
        `${AUTH_CONFIG.cookies.accessToken}=; Path=/; HttpOnly; Max-Age=0`,
        `${AUTH_CONFIG.cookies.refreshToken}=; Path=/; HttpOnly; Max-Age=0`,
    ];
}
