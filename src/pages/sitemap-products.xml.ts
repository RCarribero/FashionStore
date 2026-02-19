/**
 * Products Sitemap
 * Dynamically generates sitemap for all products
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

const SITE_URL = 'https://fashionstore.victoriafp.online';

export const GET: APIRoute = async () => {
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Fetch all active products
        const { data: products, error } = await supabase
            .from('products')
            .select('slug, updated_at')
            .eq('status', 'active')
            .order('updated_at', { ascending: false });

        if (error || !products) {
            console.error('Error fetching products for sitemap:', error);
            return new Response('Error generating sitemap', { status: 500 });
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${products.map(product => `    <url>
        <loc>${SITE_URL}/productos/${product.slug}</loc>
        <lastmod>${new Date(product.updated_at).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.8</priority>
    </url>`).join('\n')}
</urlset>`;

        return new Response(xml, {
            status: 200,
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'max-age=3600, must-revalidate',
            },
        });
    } catch (error) {
        console.error('Error generating products sitemap:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
};
