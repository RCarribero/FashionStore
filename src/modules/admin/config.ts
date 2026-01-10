/**
 * Admin Module Configuration
 */

export const ADMIN_CONFIG = {
    name: 'admin',
    description: 'Administration panel for store management',

    // Dashboard settings
    dashboard: {
        recentProductsLimit: 5,
        lowStockThreshold: 5,
    },

    // Products settings
    products: {
        perPage: 20,
        imageBucket: 'product-images',
    },

    // UI settings
    ui: {
        sidebarWidth: '16rem', // 256px
    },
} as const;

export type AdminConfig = typeof ADMIN_CONFIG;
