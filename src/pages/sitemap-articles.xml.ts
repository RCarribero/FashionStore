/**
 * Articles Sitemap
 * Dynamically generates sitemap for all published articles
 */

import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || '';

const SITE_URL = 'https://fashionstore.victoriafp.online';

export const GET: APIRoute = async () => {
    try {
        const supabase = createClient(supabaseUrl, supabaseAnonKey);

        // Fetch all published articles
        const { data: articles, error } = await supabase
            .from('articles')
            .select('slug, updated_at')
            .eq('status', 'published')
            .order('updated_at', { ascending: false });

        if (error || !articles) {
            console.error('Error fetching articles for sitemap:', error);
            // Return empty sitemap if no articles
            const emptyXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
</urlset>`;
            return new Response(emptyXml, {
                status: 200,
                headers: {
                    'Content-Type': 'application/xml',
                    'Cache-Control': 'max-age=3600, must-revalidate',
                },
            });
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${articles.map(article => `    <url>
        <loc>${SITE_URL}/editorial/${article.slug}</loc>
        <lastmod>${new Date(article.updated_at).toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
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
        console.error('Error generating articles sitemap:', error);
        return new Response('Error generating sitemap', { status: 500 });
    }
};
