import {
    EMBEDDED_CATEGORIES,
    EMBEDDED_PRODUCTS,
    EMBEDDED_VARIANTS,
    EMBEDDED_HOME_SECTIONS,
    EMBEDDED_COUPONS,
    EMBEDDED_ORDERS,
    EMBEDDED_DASHBOARD_STATS
} from '../shared/mock-data/embedded-store-data';

class MockQueryBuilder<T = any> implements PromiseLike<{ data: any; error: any; count?: number | null }> {
    private items: any[];
    private isSingle: boolean = false;
    private countType: string | null = null;

    constructor(initialItems: any[]) {
        this.items = [...initialItems];
    }

    select(columns?: string, options?: { count?: 'exact' | 'planned' | 'estimated' }) {
        if (options?.count) {
            this.countType = options.count;
        }
        return this;
    }

    eq(column: string, value: any) {
        if (column === 'category.slug') {
            this.items = this.items.filter((item) => item.category?.slug === value);
        } else {
            this.items = this.items.filter((item) => item[column] === value);
        }
        return this;
    }

    neq(column: string, value: any) {
        this.items = this.items.filter((item) => item[column] !== value);
        return this;
    }

    gt(column: string, value: any) {
        this.items = this.items.filter((item) => item[column] > value);
        return this;
    }

    gte(column: string, value: any) {
        this.items = this.items.filter((item) => item[column] >= value);
        return this;
    }

    lt(column: string, value: any) {
        this.items = this.items.filter((item) => item[column] < value);
        return this;
    }

    lte(column: string, value: any) {
        this.items = this.items.filter((item) => item[column] <= value);
        return this;
    }

    order(column: string, options?: { ascending?: boolean }) {
        const ascending = options?.ascending !== false;
        this.items.sort((a, b) => {
            const valA = a[column];
            const valB = b[column];
            if (valA === valB) return 0;
            if (ascending) return valA > valB ? 1 : -1;
            return valA < valB ? 1 : -1;
        });
        return this;
    }

    limit(count: number) {
        this.items = this.items.slice(0, count);
        return this;
    }

    range(from: number, to: number) {
        this.items = this.items.slice(from, to + 1);
        return this;
    }

    single() {
        this.isSingle = true;
        return this;
    }

    insert(data: any) {
        const toInsert = Array.isArray(data) ? data : [data];
        this.items = toInsert.map((d, index) => ({
            id: `mock-${Date.now()}-${index}`,
            created_at: new Date().toISOString(),
            ...d
        }));
        return this;
    }

    update(data: any) {
        this.items = this.items.map((item) => ({ ...item, ...data }));
        return this;
    }

    delete() {
        this.items = [];
        return this;
    }

    async then<TResult1 = { data: any; error: any }, TResult2 = never>(
        onfulfilled?: ((value: { data: any; error: any; count?: number | null }) => TResult1 | PromiseLike<TResult1>) | null,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
    ): Promise<TResult1 | TResult2> {
        let resultData: any;
        if (this.isSingle) {
            resultData = this.items.length > 0 ? this.items[0] : null;
        } else {
            resultData = this.items;
        }

        const result = {
            data: resultData,
            error: null,
            count: this.countType ? this.items.length : undefined
        };

        if (onfulfilled) {
            return Promise.resolve(onfulfilled(result));
        }
        return Promise.resolve(result as any);
    }
}

export function createMockSupabaseClient() {
    return {
        from(table: string) {
            switch (table) {
                case 'products':
                    return new MockQueryBuilder(EMBEDDED_PRODUCTS);
                case 'categories':
                    return new MockQueryBuilder(EMBEDDED_CATEGORIES);
                case 'product_variants':
                    return new MockQueryBuilder(EMBEDDED_VARIANTS);
                case 'home_sections':
                    return new MockQueryBuilder(EMBEDDED_HOME_SECTIONS);
                case 'coupons':
                    return new MockQueryBuilder(EMBEDDED_COUPONS);
                case 'orders':
                    return new MockQueryBuilder(EMBEDDED_ORDERS);
                case 'returns':
                    return new MockQueryBuilder([]);
                case 'wishlists':
                    return new MockQueryBuilder([]);
                case 'user_profiles':
                case 'profiles':
                    return new MockQueryBuilder([
                        {
                            id: 'user-admin-1',
                            email: 'admin@fashionstore.com',
                            role: 'admin',
                            is_admin: true,
                            created_at: new Date().toISOString(),
                        },
                        {
                            id: 'user-client-1',
                            email: 'cliente@fashionstore.com',
                            role: 'customer',
                            is_admin: false,
                            created_at: new Date().toISOString(),
                        }
                    ]);
                default:
                    return new MockQueryBuilder([]);
            }
        },
        auth: {
            currentUser: {
                id: 'user-admin-1',
                email: 'admin@fashionstore.com',
                user_metadata: { name: 'Carlos Director (Admin)' }
            },
            currentSession: {
                access_token: 'demo-token-admin',
                refresh_token: 'demo-refresh-token',
                user: {
                    id: 'user-admin-1',
                    email: 'admin@fashionstore.com',
                    user_metadata: { name: 'Carlos Director (Admin)' }
                }
            },
            async getUser(token?: string) {
                // If in localStorage a client is stored, return client, else admin
                let isClient = false;
                if (typeof window !== 'undefined' && window.localStorage) {
                    const stored = window.localStorage.getItem('fm_demo_user');
                    if (stored === 'cliente') isClient = true;
                }
                const user = isClient
                    ? { id: 'user-client-1', email: 'cliente@fashionstore.com', user_metadata: { name: 'Laura Gómez (Cliente)' } }
                    : { id: 'user-admin-1', email: 'admin@fashionstore.com', user_metadata: { name: 'Carlos Director (Admin)' } };

                return {
                    data: { user },
                    error: null
                };
            },
            async getSession() {
                const { data } = await this.getUser();
                return {
                    data: {
                        session: {
                            access_token: 'demo-token',
                            refresh_token: 'demo-refresh-token',
                            user: data.user
                        }
                    },
                    error: null
                };
            },
            async signInWithPassword({ email, password }: any) {
                const reqEmail = email || 'admin@fashionstore.com';
                const isAdmin = reqEmail.toLowerCase().includes('admin');
                const user = {
                    id: isAdmin ? 'user-admin-1' : 'user-client-1',
                    email: reqEmail,
                    user_metadata: { name: isAdmin ? 'Carlos Director (Admin)' : 'Laura Gómez (Cliente)' }
                };

                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem('fm_demo_user', isAdmin ? 'admin' : 'cliente');
                    window.localStorage.setItem('sb-demo-auth-token', JSON.stringify({ user }));
                }

                return {
                    data: {
                        user,
                        session: {
                            access_token: 'demo-token-' + (isAdmin ? 'admin' : 'client'),
                            refresh_token: 'demo-refresh-token'
                        }
                    },
                    error: null
                };
            },
            async signOut() {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.removeItem('fm_demo_user');
                    window.localStorage.removeItem('sb-demo-auth-token');
                }
                return { error: null };
            },
            onAuthStateChange(callback: any) {
                return { data: { subscription: { unsubscribe: () => {} } } };
            }
        },
        storage: {
            from(bucket: string) {
                return {
                    getPublicUrl(path: string) {
                        return { data: { publicUrl: path } };
                    },
                    async upload(path: string, file: any) {
                        return { data: { path }, error: null };
                    }
                };
            }
        }
    };
}
