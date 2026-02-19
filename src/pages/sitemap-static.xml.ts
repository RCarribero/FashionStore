/**
 * Static Pages Sitemap
 * Contains all static routes that don't require database queries
 */

import type { APIRoute } from 'astro';

const SITE_URL = 'https://fashionstore.victoriafp.online';

const staticPages = [
    { url: '/', priority: '1.0', changefreq: 'daily' },
    { url: '/tienda', priority: '0.9', changefreq: 'daily' },
    { url: '/tienda/ofertas', priority: '0.9', changefreq: 'daily' },
    { url: '/tienda/outlet', priority: '0.8', changefreq: 'daily' },
    { url: '/tienda/buscar', priority: '0.7', changefreq: 'weekly' },
    { url: '/productos', priority: '0.9', changefreq: 'daily' },
    { url: '/editorial', priority: '0.7', changefreq: 'weekly' },
    { url: '/info/contacto', priority: '0.6', changefreq: 'monthly' },
    { url: '/info/envio', priority: '0.6', changefreq: 'monthly' },
    { url: '/legal/privacidad', priority: '0.5', changefreq: 'monthly' },
    { url: '/legal/terminos', priority: '0.5', changefreq: 'monthly' },
    { url: '/legal/cookies', priority: '0.5', changefreq: 'monthly' },
    { url: '/legal/devoluciones', priority: '0.5', changefreq: 'monthly' },
];

export const GET: APIRoute = async () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticPages.map(page => `    <url>
        <loc>${SITE_URL}${page.url}</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>${page.changefreq}</changefreq>
        <priority>${page.priority}</priority>
    </url>`).join('\n')}
</urlset>`;

    return new Response(xml, {
        status: 200,
        headers: {
            'Content-Type': 'application/xml',
            'Cache-Control': 'max-age=3600, must-revalidate',
        },
    });
};
