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
    SALE: '/ofertas',
    OUTLET: '/outlet',
    EDITORIAL: {
        LIST: '/editorial',
        DETAIL: (slug: string) => `/editorial/${slug}`,
    },

    // Auth Routes
    LOGIN: '/auth/login',
    REGISTER: '/registro',
    PROFILE: '/perfil',
    AUTH: {
        LOGIN: '/admin/login',
        LOGOUT: '/api/auth/logout',
    },

    // Admin Routes
    ADMIN: {
        DASHBOARD: '/gestion-fm',
        PRODUCTS: {
            LIST: '/gestion-fm/productos',
            NEW: '/gestion-fm/productos/nuevo',
            EDIT: (id: string) => `/gestion-fm/productos/${id}`,
        },
        CATEGORIES: '/gestion-fm/categorias',
        ORDERS: '/gestion-fm/pedidos',
        RETURNS: '/gestion-fm/devoluciones',
        RETURN_DETAIL: (id: string) => `/gestion-fm/devoluciones/${id}`,
        USERS: '/gestion-fm/usuarios',
        COUPONS: '/gestion-fm/cupones',
        PROMOTIONS: '/gestion-fm/promociones',
        DESIGN: '/gestion-fm/diseno',
        EDITORIAL: {
            LIST: '/gestion-fm/editorial',
            NEW: '/gestion-fm/editorial/nuevo',
            EDIT: (id: string) => `/gestion-fm/editorial/${id}`,
        },
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
    { name: 'Productos', href: ROUTES.PRODUCTS },
    { name: 'Ofertas', href: ROUTES.SALE },
    { name: 'Outlet', href: ROUTES.OUTLET },
    { name: 'Zapatillas', href: ROUTES.CATEGORY('zapatillas') },
    { name: 'Camisetas', href: ROUTES.CATEGORY('camisetas') },
    { name: 'Pantalones', href: ROUTES.CATEGORY('pantalones') },
    { name: 'Sudaderas', href: ROUTES.CATEGORY('sudaderas') },
];

// Navigation items for admin sidebar
export const ADMIN_NAV = [
    { name: 'Dashboard', href: ROUTES.ADMIN.DASHBOARD, icon: 'home' },
    { name: 'Productos', href: ROUTES.ADMIN.PRODUCTS.LIST, icon: 'box' },
    { name: 'Categorias', href: ROUTES.ADMIN.CATEGORIES, icon: 'folder' },
    { name: 'Pedidos', href: ROUTES.ADMIN.ORDERS, icon: 'shopping-bag' },
    { name: 'Devoluciones', href: ROUTES.ADMIN.RETURNS, icon: 'return' },
    { name: 'Usuarios', href: ROUTES.ADMIN.USERS, icon: 'users' },
    { name: 'Cupones', href: ROUTES.ADMIN.COUPONS, icon: 'ticket' },
    { name: 'Promociones', href: ROUTES.ADMIN.PROMOTIONS, icon: 'tag' },
    { name: 'Editorial', href: ROUTES.ADMIN.EDITORIAL.LIST, icon: 'document-text' },
    { name: 'Diseño Inicio', href: ROUTES.ADMIN.DESIGN, icon: 'layout' },
];

export type Routes = typeof ROUTES;
