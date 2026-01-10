/**
 * Store Module Configuration
 * Client-facing store settings
 */

export const STORE_CONFIG = {
    name: 'store',
    description: 'Public store for customers',

    // Cart settings
    cart: {
        storageKey: 'fashionmarket-cart',
        maxQuantity: 10,
    },

    // Product display
    products: {
        perPage: 12,
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
    },

    // UI settings
    ui: {
        headerHeight: '4rem',  // 64px
    },
} as const;

export type StoreConfig = typeof STORE_CONFIG;
