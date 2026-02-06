/**
 * Auth Client Service
 * Client-side authentication operations using Supabase
 */
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
    {
        auth: {
            storage: typeof window !== 'undefined' ? window.localStorage : undefined,
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        }
    }
);

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface RegisterData extends LoginCredentials {
    confirmPassword?: string;
}

/**
 * Register a new user
 */
export async function register(data: RegisterData) {
    const { email, password } = data;

    const { data: authData, error } = await supabase.auth.signUp({
        email,
        password
    });

    if (error) {
        throw new Error(error.message);
    }

    // Associate any guest orders made with this email
    if (authData.user?.id) {
        try {
            await fetch('/api/auth/associate-guest-orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, userId: authData.user.id })
            });
        } catch (e) {
            console.error('Failed to associate guest orders on register:', e);
        }
    }

    return authData;
}

/**
 * Login user
 */
export async function login(credentials: LoginCredentials) {
    const { email, password } = credentials;

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        throw new Error(error.message);
    }

    // Associate any guest orders made with this email
    try {
        await fetch('/api/auth/associate-guest-orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, userId: data.user?.id })
        });
    } catch (e) {
        // Don't block login if association fails
        console.error('Failed to associate guest orders:', e);
    }

    return data;
}

/**
 * Logout user
 */
export async function logout() {
    const { error } = await supabase.auth.signOut();

    if (error) {
        throw new Error(error.message);
    }
}

/**
 * Get current user
 */
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error) {
        console.error('Error getting user:', error);
        return null;
    }

    return user;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const user = await getCurrentUser();
    return !!user;
}

/**
 * Get authentication session
 */
export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();

    if (error) {
        console.error('Error getting session:', error);
        return null;
    }

    return session;
}

export { supabase };
