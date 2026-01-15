/**
 * Application Constants
 * Global settings and environment configuration
 */

export const APP_CONFIG = {
    name: 'FashionMarket',
    tagline: 'Moda masculina premium con estilo sofisticado',
    currency: 'EUR',
    locale: 'es-ES',

    // Supabase
    supabase: {
        url: import.meta.env.PUBLIC_SUPABASE_URL,
        anonKey: import.meta.env.PUBLIC_SUPABASE_ANON_KEY,
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

// Environment detection
export const ENV = {
    isDev: import.meta.env.DEV,
    isProd: import.meta.env.PROD,
    mode: import.meta.env.MODE,
} as const;
