/**
 * Categories Sitemap
 * Dynamically generates sitemap for all categories
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

const SITE_URL = 'https://fashionstore.victoriafp.online';

export const GET: APIRoute = async () => {
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Fetch all categories
        const { data: categories, error } = await supabase
            .from('categories')
            .select('slug, updated_at')
            .order('name');

        if (error || !categories) {
            console.error('Error fetching categories for sitemap:', error);
            return new Response('Error generating sitemap', { status: 500 });
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categories.map(category => `    <url>
        <loc>${SITE_URL}/categoria/${category.slug}</loc>
        <lastmod>${new Date(category.updated_at || Date.now()).toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
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
        console.error('Error generating categories sitemap:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
};
