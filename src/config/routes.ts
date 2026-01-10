/**
 * Centralized Routes Configuration
 * All application routes defined in one place
 */

export const ROUTES = {
    // Public Store Routes
    HOME: '/',
    PRODUCTS: '/productos',
    PRODUCT_DETAIL: (slug: string) => `/productos/${slug}`,
    CATEGORY: (slug: string) => `/categoria/${slug}`,

    // Auth Routes
    AUTH: {
        LOGIN: '/admin/login',
        LOGOUT: '/api/auth/logout',
    },

    // Admin Routes
    ADMIN: {
        DASHBOARD: '/admin',
        PRODUCTS: {
            LIST: '/admin/productos',
            NEW: '/admin/productos/nuevo',
            EDIT: (id: string) => `/admin/productos/${id}`,
        },
        CATEGORIES: '/admin/categorias',
        ORDERS: '/admin/pedidos',
    },

    // API Routes
    API: {
        AUTH: {
            LOGOUT: '/api/auth/logout',
        },
        PRODUCTS: {
            DELETE: (id: string) => `/api/products/${id}`,
        },
    },
} as const;

// Navigation items for store header
export const STORE_NAV = [
    { name: 'Inicio', href: ROUTES.HOME },
    { name: 'Camisas', href: ROUTES.CATEGORY('camisas') },
    { name: 'Pantalones', href: ROUTES.CATEGORY('pantalones') },
    { name: 'Trajes', href: ROUTES.CATEGORY('trajes') },
];

// Navigation items for admin sidebar
export const ADMIN_NAV = [
    { name: 'Dashboard', href: ROUTES.ADMIN.DASHBOARD, icon: 'home' },
    { name: 'Productos', href: ROUTES.ADMIN.PRODUCTS.LIST, icon: 'box' },
    { name: 'Categorias', href: ROUTES.ADMIN.CATEGORIES, icon: 'folder' },
    { name: 'Pedidos', href: ROUTES.ADMIN.ORDERS, icon: 'shopping-bag' },
];

export type Routes = typeof ROUTES;
