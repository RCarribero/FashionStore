/**
 * Application Configuration
 * Global settings and constants with embedded mock support
 */

import { setupSupabaseMockFetch } from '../lib/supabase-mock-fetch';

const defaultSupabaseUrl = 'https://demo-fashionstore.supabase.co';
const defaultAnonKey = 'demo-anon-key-fashionstore';

const rawUrl = import.meta.env.PUBLIC_SUPABASE_URL;
const rawKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

const isSupabaseConfigured = Boolean(
    rawUrl &&
    rawKey &&
    !rawUrl.includes('placeholder') &&
    rawUrl.startsWith('http') &&
    !rawUrl.includes('demo-fashionstore')
);

// Enable mock fetch interceptor if not connected to live external Supabase
if (!isSupabaseConfigured) {
    setupSupabaseMockFetch();
}

export const APP_CONFIG = {
    name: 'FashionMarket',
    tagline: 'Moda masculina premium con estilo sofisticado',
    currency: 'EUR',
    locale: 'es-ES',

    // Supabase
    supabase: {
        url: isSupabaseConfigured ? rawUrl : defaultSupabaseUrl,
        anonKey: isSupabaseConfigured ? rawKey : defaultAnonKey,
        storageBucket: 'product-images',
    },

    // Pagination
    pagination: {
        productsPerPage: 12,
        adminProductsPerPage: 20,
    },

    // Stock thresholds
    stock: {
        lowThreshold: 5,
        criticalThreshold: 0,
    },

    // Image upload
    upload: {
        maxSizeMB: 10,
        acceptedTypes: ['image/png', 'image/jpeg', 'image/webp'],
    },
} as const;

export type AppConfig = typeof APP_CONFIG;
