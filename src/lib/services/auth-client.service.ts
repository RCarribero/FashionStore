/**
 * Auth Client Service
 * Client-side authentication operations using Supabase
 */
import { supabase } from '../supabase';

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
