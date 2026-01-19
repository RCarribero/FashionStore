/**
 * Services Module Index
 * Re-exports all service utilities
 */

// Email service
export { sendEmail, formatEmailPrice, formatEmailDate } from './email';
export type { EmailOptions, EmailAttachment } from './email';

// Invoice service
export { generateInvoicePDF } from './invoice';
export type { OrderData, OrderItem } from './invoice';

// Promotion service
export { getActivePromotions, calculateDiscountedPrice, enrichProductsWithDiscounts } from './promotions';
export type { ProductWithDiscount } from './promotions';

// Auth services (client-side)
export { getCurrentUser, login, logout, register, isAuthenticated } from './auth-client.service';
export type { LoginCredentials, RegisterData } from './auth-client.service';
export {
    supabase,
    createAdminClient,
    signIn,
    signOut,
    getSession,
    createAuthCookies,
    createLogoutCookies,
    isSupabaseConfigured,
} from './auth.service';

