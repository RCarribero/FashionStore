/**
 * Auth Module Configuration
 */

export const AUTH_CONFIG = {
    name: 'auth',
    description: 'Authentication module for login/logout',

    // Cookie settings
    cookies: {
        accessToken: 'sb-access-token',
        refreshToken: 'sb-refresh-token',
        maxAge: {
            access: 3600,      // 1 hour
            refresh: 604800,   // 7 days
        },
    },

    // Redirect paths
    redirects: {
        afterLogin: '/admin',
        afterLogout: '/admin/login',
        unauthorized: '/admin/login',
    },

    // Session settings
    session: {
        autoRefresh: true,
        persistSession: true,
    },
} as const;

export type AuthConfig = typeof AUTH_CONFIG;
