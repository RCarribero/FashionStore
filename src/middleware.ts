import { defineMiddleware } from 'astro:middleware';
import { setupSupabaseMockFetch } from './lib/supabase-mock-fetch';

// Ensure mock fetch is active on the server-side SSR runtime
setupSupabaseMockFetch();

export const onRequest = defineMiddleware(async (context, next) => {
    // Ensure mock fetch is initialized for the request lifecycle
    setupSupabaseMockFetch();

    const response = await next();

    // Security Headers
    const headers = response.headers;

    // 1. Content-Security-Policy (CSP) - Allow local images, Cloudinary, Notion embedding
    const csp = [
        "default-src 'self' *",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: blob: https: http:",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https: http: wss: ws:",
        "frame-src 'self' *",
        "frame-ancestors *",
        "object-src 'none'",
        "base-uri 'self'",
    ].join('; ');

    headers.set('Content-Security-Policy', csp);

    // 2. Strict-Transport-Security (HSTS)
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // 3. X-Content-Type-Options
    headers.set('X-Content-Type-Options', 'nosniff');

    // 4. X-Frame-Options - Allow Notion / iframe embedding
    headers.set('X-Frame-Options', 'ALLOWALL');

    // 5. Referrer-Policy
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 6. Permissions-Policy
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

    return response;
});
