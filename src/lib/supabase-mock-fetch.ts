import {
    EMBEDDED_CATEGORIES,
    EMBEDDED_PRODUCTS,
    EMBEDDED_VARIANTS,
    EMBEDDED_HOME_SECTIONS,
    EMBEDDED_COUPONS,
    EMBEDDED_ORDERS,
    EMBEDDED_DASHBOARD_STATS,
} from '../shared/mock-data/embedded-store-data';

const originalFetch = globalThis.fetch;

export function setupSupabaseMockFetch() {
    if ((globalThis as any).__mock_supabase_fetch_installed) {
        return;
    }
    (globalThis as any).__mock_supabase_fetch_installed = true;

    globalThis.fetch = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
        const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;

        // Only intercept supabase calls
        if (!urlStr.includes('supabase.co')) {
            return originalFetch(input, init);
        }

        try {
            const url = new URL(urlStr);
            const path = url.pathname;
            const searchParams = url.searchParams;

            // Handle Auth
            if (path.includes('/auth/v1/')) {
                let reqEmail = 'admin@fashionstore.com';
                try {
                    if (init?.body) {
                        const parsed = JSON.parse(init.body as string);
                        if (parsed.email) reqEmail = parsed.email;
                    }
                } catch (_) {}

                const isAdmin = reqEmail.toLowerCase().includes('admin');
                const mockUser = {
                    id: isAdmin ? 'user-admin-1' : 'user-client-1',
                    aud: 'authenticated',
                    role: 'authenticated',
                    email: reqEmail,
                    email_confirmed_at: new Date().toISOString(),
                    app_metadata: { provider: 'email', providers: ['email'] },
                    user_metadata: {
                        name: isAdmin ? 'Carlos Director (Admin)' : 'Laura Gómez (Cliente)'
                    },
                    created_at: new Date().toISOString(),
                };

                return new Response(
                    JSON.stringify({
                        access_token: 'demo-token-' + (isAdmin ? 'admin' : 'client'),
                        token_type: 'bearer',
                        expires_in: 3600,
                        refresh_token: 'demo-refresh-token',
                        user: mockUser,
                    }),
                    {
                        status: 200,
                        headers: { 'Content-Type': 'application/json' },
                    }
                );
            }

            // Handle REST API (/rest/v1/<table_name>)
            const match = path.match(/\/rest\/v1\/([^/?#]+)/);
            if (!match) {
                return new Response(JSON.stringify([]), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            const table = match[1];
            let items: any[] = [];

            switch (table) {
                case 'products':
                    items = [...EMBEDDED_PRODUCTS];
                    break;
                case 'categories':
                    items = [...EMBEDDED_CATEGORIES];
                    break;
                case 'product_variants':
                    items = [...EMBEDDED_VARIANTS];
                    break;
                case 'home_sections':
                    items = [...EMBEDDED_HOME_SECTIONS];
                    break;
                case 'coupons':
                    items = [...EMBEDDED_COUPONS];
                    break;
                case 'orders':
                    items = [...EMBEDDED_ORDERS];
                    break;
                case 'user_profiles':
                case 'profiles':
                    items = [
                        {
                            id: 'user-admin-1',
                            email: 'admin@fashionstore.com',
                            role: 'admin',
                            is_admin: true,
                        },
                        {
                            id: 'user-client-1',
                            email: 'cliente@fashionstore.com',
                            role: 'customer',
                            is_admin: false,
                        },
                    ];
                    break;
                default:
                    items = [];
            }

            // Filter by search parameters (e.g. slug=eq.cazadora-bomber..., category_id=eq..., stock=gt.0)
            for (const [key, value] of searchParams.entries()) {
                if (key === 'select' || key === 'order' || key === 'limit' || key === 'offset') continue;

                if (value.startsWith('eq.')) {
                    const targetVal = value.substring(3);
                    if (key === 'category.slug') {
                        items = items.filter((item) => item.category?.slug === targetVal);
                    } else {
                        items = items.filter((item) => String(item[key]) === targetVal);
                    }
                } else if (value.startsWith('gt.')) {
                    const num = Number(value.substring(3));
                    items = items.filter((item) => Number(item[key]) > num);
                } else if (value.startsWith('gte.')) {
                    const num = Number(value.substring(4));
                    items = items.filter((item) => Number(item[key]) >= num);
                } else if (value.startsWith('lt.')) {
                    const num = Number(value.substring(3));
                    items = items.filter((item) => Number(item[key]) < num);
                } else if (value.startsWith('lte.')) {
                    const num = Number(value.substring(4));
                    items = items.filter((item) => Number(item[key]) <= num);
                }
            }

            // Ordering
            const orderParam = searchParams.get('order');
            if (orderParam) {
                const [col, dir] = orderParam.split('.');
                const asc = dir !== 'desc';
                items.sort((a, b) => {
                    if (a[col] === b[col]) return 0;
                    if (asc) return a[col] > b[col] ? 1 : -1;
                    return a[col] < b[col] ? 1 : -1;
                });
            }

            // Limit
            const limitParam = searchParams.get('limit');
            if (limitParam) {
                items = items.slice(0, Number(limitParam));
            }

            // Check if single object requested
            const acceptHeader = init?.headers ? (new Headers(init.headers)).get('Accept') : '';
            if (acceptHeader?.includes('application/vnd.pgrst.object+json')) {
                const singleItem = items[0] || null;
                if (!singleItem) {
                    return new Response(JSON.stringify({ message: 'JSON object requested, multiple (or no) rows returned' }), {
                        status: 406,
                        headers: { 'Content-Type': 'application/json' },
                    });
                }
                return new Response(JSON.stringify(singleItem), {
                    status: 200,
                    headers: { 'Content-Type': 'application/json' },
                });
            }

            return new Response(JSON.stringify(items), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Range': `0-${items.length}/${items.length}`,
                },
            });
        } catch (err) {
            console.warn('[Mock Supabase Fetch Error]:', err);
            return new Response(JSON.stringify([]), {
                status: 200,
                headers: { 'Content-Type': 'application/json' },
            });
        }
    };
}
