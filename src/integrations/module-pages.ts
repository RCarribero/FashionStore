/**
 * Custom Pages Integration
 * Registers routes from module directories
 */

import type { AstroIntegration } from 'astro';

export default function modulePages(): AstroIntegration {
    return {
        name: 'module-pages',
        hooks: {
            'astro:config:setup': ({ injectRoute }) => {

                // ========== AUTH MODULE ==========
                injectRoute({
                    pattern: '/admin/login',
                    entrypoint: './src/modules/auth/pages/LoginPage.astro',
                    prerender: false,
                });

                // ========== ADMIN MODULE ==========
                injectRoute({
                    pattern: '/admin',
                    entrypoint: './src/modules/admin/pages/DashboardPage.astro',
                    prerender: false,
                });

                injectRoute({
                    pattern: '/admin/productos',
                    entrypoint: './src/modules/admin/pages/ProductsListPage.astro',
                    prerender: false,
                });

                injectRoute({
                    pattern: '/admin/categorias',
                    entrypoint: './src/modules/admin/pages/CategoriesPage.astro',
                    prerender: false,
                });

                injectRoute({
                    pattern: '/admin/pedidos',
                    entrypoint: './src/modules/admin/pages/OrdersPage.astro',
                    prerender: false,
                });

                // ========== STORE MODULE ==========
                injectRoute({
                    pattern: '/',
                    entrypoint: './src/modules/store/pages/HomePage.astro',
                    prerender: true,
                });

                injectRoute({
                    pattern: '/productos',
                    entrypoint: './src/modules/store/pages/CatalogPage.astro',
                    prerender: true,
                });

                // ========== API MODULE ==========
                injectRoute({
                    pattern: '/api/auth/logout',
                    entrypoint: './src/modules/api/auth/logout.ts',
                    prerender: false,
                });

                injectRoute({
                    pattern: '/api/products/[id]',
                    entrypoint: './src/modules/api/products/[id].ts',
                    prerender: false,
                });

                // Product Detail (dynamic)
                injectRoute({
                    pattern: '/productos/[slug]',
                    entrypoint: './src/modules/store/pages/ProductDetailPage.astro',
                    prerender: false,
                });

                // Checkout Success
                injectRoute({
                    pattern: '/checkout/success',
                    entrypoint: './src/modules/store/pages/CheckoutSuccessPage.astro',
                    prerender: false,
                });

                // Checkout API
                injectRoute({
                    pattern: '/api/checkout/create-session',
                    entrypoint: './src/modules/api/checkout/create-session.ts',
                    prerender: false,
                });

                // Category Page (store)
                injectRoute({
                    pattern: '/categoria/[slug]',
                    entrypoint: './src/modules/store/pages/CategoryPage.astro',
                    prerender: false,
                });
            },
        },
    };
}
