/**
 * Auth Module Index
 * Re-exports all auth module exports
 */

export { AUTH_CONFIG } from './config';
export {
    supabase,
    createAdminClient,
    signIn,
    signOut,
    getSession,
    createAuthCookies,
    createLogoutCookies,
    isSupabaseConfigured,
} from './services/auth.service';
