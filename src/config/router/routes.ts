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
    SALE: '/tienda/ofertas',
    OUTLET: '/tienda/outlet',
    SEARCH: '/tienda/buscar',
    CONTACT: '/info/contacto',
    VALENTINES: '/d',

    // Legal Pages
    LEGAL: {
        PRIVACY: '/legal/privacidad',
        TERMS: '/legal/terminos',
        COOKIES: '/legal/cookies',
        RETURNS: '/legal/devoluciones',
        SHIPPING: '/info/envio',
    },

    // Auth Routes
    AUTH: {
        LOGIN: '/auth/login',
        REGISTER: '/auth/registro',
        PROFILE: '/cuenta/perfil',
        ADMIN_LOGIN: '/admin/login',
        LOGOUT: '/api/auth/logout',
    },

    // Shorthand for common auth routes
    LOGIN: '/auth/login',
    REGISTER: '/auth/registro',

    // Checkout Routes
    CHECKOUT: {
        INDEX: '/checkout',
        SUCCESS: '/cuenta/success',
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
        USERS: '/gestion-fm/usuarios',
        COUPONS: '/gestion-fm/cupones',
        PROMOTIONS: '/gestion-fm/promociones',
        DESIGN: '/gestion-fm/diseno',
    },

    // API Routes
    API: {
        AUTH: {
            LOGOUT: '/api/auth/logout',
        },
        PRODUCTS: {
            DELETE: (id: string) => `/api/products/${id}`,
        },
        ADMIN: {
            PRODUCTS: '/api/admin/products',
            CATEGORIES: '/api/admin/categories',
            ORDERS: '/api/admin/orders',
            USERS: '/api/admin/users',
            COUPONS: '/api/admin/coupons',
            LAYOUT: '/api/admin/layout/home',
        },
        CHECKOUT: {
            CREATE_SESSION: '/api/checkout/create-session',
        },
        COUPONS: {
            VALIDATE: '/api/coupons/validate',
        },
        ORDERS: {
            GET: (id: string) => `/api/orders/${id}`,
        },
        STOCK: {
            CHECK: '/api/stock/check',
            RESERVE: '/api/stock/reserve',
            RELEASE: '/api/stock/release',
        },
        UPLOAD: '/api/upload',
        SEARCH: '/api/search',
        NEWSLETTER: '/api/newsletter/subscribe',
        RETURNS: '/api/returns',
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
    { name: 'Usuarios', href: ROUTES.ADMIN.USERS, icon: 'users' },
    { name: 'Cupones', href: ROUTES.ADMIN.COUPONS, icon: 'ticket' },
    { name: 'Promociones', href: ROUTES.ADMIN.PROMOTIONS, icon: 'tag' },
    { name: 'Diseño Inicio', href: ROUTES.ADMIN.DESIGN, icon: 'layout' },
];

// Footer navigation
export const FOOTER_NAV = {
    legal: [
        { name: 'Privacidad', href: ROUTES.LEGAL.PRIVACY },
        { name: 'Terminos', href: ROUTES.LEGAL.TERMS },
        { name: 'Cookies', href: ROUTES.LEGAL.COOKIES },
    ],
    help: [
        { name: 'Devoluciones', href: ROUTES.LEGAL.RETURNS },
        { name: 'Envio', href: ROUTES.LEGAL.SHIPPING },
        { name: 'Contacto', href: ROUTES.CONTACT },
    ],
};

export type Routes = typeof ROUTES;
