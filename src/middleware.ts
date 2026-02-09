import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (context, next) => {
    const response = await next();

    // Security Headers
    const headers = response.headers;

    // 1. Content-Security-Policy (CSP) - Allow Cloudinary images and Google Fonts
    // Note: Using 'unsafe-inline' and 'unsafe-eval' for React/Astro client-side hydration compatibility
    // In strict mode, we would need nonces, but for now we focus on basic protection + external sources
    const csp = [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://*.stripe.com",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "img-src 'self' data: https://res.cloudinary.com https://*.stripe.com https://upload.wikimedia.org",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://res.cloudinary.com https://api.stripe.com https://*.stripe.com https://dixaynqqloclazirzgik.supabase.co wss://dixaynqqloclazirzgik.supabase.co",
        "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests"
    ].join('; ');

    headers.set('Content-Security-Policy', csp);

    // 2. Strict-Transport-Security (HSTS)
    // Force HTTPS for 1 year, include subdomains, allow preload
    headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

    // 3. X-Content-Type-Options
    // Prevent MIME type sniffing
    headers.set('X-Content-Type-Options', 'nosniff');

    // 4. X-Frame-Options
    // Prevent clickjacking by ensuring content is not embedded in other sites
    headers.set('X-Frame-Options', 'DENY');

    // 5. Referrer-Policy
    // Control how much referrer information is included with requests
    headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // 6. Permissions-Policy
    // Disable access to sensitive features not used by the site
    headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');

    return response;
});
