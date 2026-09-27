import type { Category, Product, DashboardStats } from '../types';

export interface MockUser {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'customer';
    is_admin: boolean;
}

export const EMBEDDED_USERS: MockUser[] = [
    {
        id: 'user-admin-1',
        email: 'admin@fashionstore.com',
        name: 'Carlos Director (Admin)',
        role: 'admin',
        is_admin: true,
    },
    {
        id: 'user-client-1',
        email: 'cliente@fashionstore.com',
        name: 'Laura Gómez (Cliente)',
        role: 'customer',
        is_admin: false,
    },
];

export const EMBEDDED_CATEGORIES: (Category & { image: string })[] = [
    {
        id: 'cat-zapatillas',
        name: 'Zapatillas',
        slug: 'zapatillas',
        image: '/images/categories/zapatillas.svg',
        created_at: new Date('2024-01-01').toISOString(),
    },
    {
        id: 'cat-sudaderas',
        name: 'Sudaderas',
        slug: 'sudaderas',
        image: '/images/categories/sudaderas.svg',
        created_at: new Date('2024-01-02').toISOString(),
    },
    {
        id: 'cat-pantalones',
        name: 'Pantalones',
        slug: 'pantalones',
        image: '/images/categories/pantalones.svg',
        created_at: new Date('2024-01-03').toISOString(),
    },
    {
        id: 'cat-camisetas',
        name: 'Camisetas',
        slug: 'camisetas',
        image: '/images/categories/camisetas.svg',
        created_at: new Date('2024-01-04').toISOString(),
    },
    {
        id: 'cat-chaquetas',
        name: 'Chaquetas',
        slug: 'chaquetas',
        image: '/images/categories/chaquetas.svg',
        created_at: new Date('2024-01-05').toISOString(),
    },
];

export const EMBEDDED_PRODUCTS: Product[] = [
    {
        id: 'prod-1',
        name: 'Cazadora Bomber Aviator Obsidian',
        slug: 'cazadora-bomber-aviator-obsidian',
        description: 'Chaqueta bomber premium en tejido técnico hidrófugo con forro térmico satinado y detalles metálicos en acabado gunmetal.',
        price: 12900,
        stock: 14,
        category_id: 'cat-chaquetas',
        category: EMBEDDED_CATEGORIES[4],
        images: [
            '/images/products/cazadora-bomber-aviator-obsidian.svg'
        ],
        featured: true,
        created_at: new Date('2024-02-01').toISOString(),
    },
    {
        id: 'prod-2',
        name: 'Sudadera Oversize Acid Wash',
        slug: 'sudadera-oversize-acid-wash',
        description: 'Sudadera holgada de alto gramaje (460 GSM) en algodón orgánico peinado con lavado ácido artesanal y capucha estructurada.',
        price: 6990,
        stock: 22,
        category_id: 'cat-sudaderas',
        category: EMBEDDED_CATEGORIES[1],
        images: [
            '/images/products/sudadera-oversize-acid-wash.svg'
        ],
        featured: true,
        created_at: new Date('2024-02-02').toISOString(),
    },
    {
        id: 'prod-3',
        name: 'Zapatillas Street Runner Pro V2',
        slug: 'zapatillas-street-runner-pro-v2',
        description: 'Sneakers urbanas vanguardistas con suela ergonómica de amortiguación reactiva, empeine de malla transpirable y paneles de ante.',
        price: 11950,
        stock: 18,
        category_id: 'cat-zapatillas',
        category: EMBEDDED_CATEGORIES[0],
        images: [
            '/images/products/zapatillas-street-runner-pro-v2.svg'
        ],
        featured: true,
        created_at: new Date('2024-02-03').toISOString(),
    },
    {
        id: 'prod-4',
        name: 'Pantalón Cargo Táctico Modular',
        slug: 'pantalon-cargo-tactico-modular',
        description: 'Pantalón cargo de corte relaxed con múltiples bolsillos reforzados, hebillas magnéticas de ajuste rápido y bajos ajustables.',
        price: 8490,
        stock: 11,
        category_id: 'cat-pantalones',
        category: EMBEDDED_CATEGORIES[2],
        images: [
            '/images/products/pantalon-cargo-tactico-modular.svg'
        ],
        featured: true,
        created_at: new Date('2024-02-04').toISOString(),
    },
    {
        id: 'prod-5',
        name: 'Camiseta Heavyweight Boxy Fit',
        slug: 'camiseta-heavyweight-boxy-fit',
        description: 'Camiseta de corte cuadrado (Boxy Fit) en 100% algodón cardado de 280 GSM, cuello acanalado reforzado y costuras dobles.',
        price: 3490,
        stock: 35,
        category_id: 'cat-camisetas',
        category: EMBEDDED_CATEGORIES[3],
        images: [
            '/images/products/camiseta-heavyweight-boxy-fit.svg'
        ],
        featured: true,
        created_at: new Date('2024-02-05').toISOString(),
    },
    {
        id: 'prod-6',
        name: 'Chaqueta Denim Vintage Washed',
        slug: 'chaqueta-denim-vintage-washed',
        description: 'Chaqueta vaquera icónica en denim rígido de 14 oz con efecto desgastado manual, botones de bronce y forro interior con micromalla.',
        price: 9900,
        stock: 9,
        category_id: 'cat-chaquetas',
        category: EMBEDDED_CATEGORIES[4],
        images: [
            '/images/products/chaqueta-denim-vintage-washed.svg'
        ],
        featured: true,
        created_at: new Date('2024-02-06').toISOString(),
    },
    {
        id: 'prod-7',
        name: 'Zapatillas Retro Low Classic',
        slug: 'zapatillas-retro-low-classic',
        description: 'Silueta clásica de caña baja inspirada en el calzado de pista de los 80, confeccionada en cuero nobuck y suela color caramelo.',
        price: 8990,
        stock: 16,
        category_id: 'cat-zapatillas',
        category: EMBEDDED_CATEGORIES[0],
        images: [
            '/images/products/zapatillas-retro-low-classic.svg'
        ],
        featured: false,
        created_at: new Date('2024-02-07').toISOString(),
    },
    {
        id: 'prod-8',
        name: 'Pantalón Sastre Relaxed Pleated',
        slug: 'pantalon-sastre-relaxed-pleated',
        description: 'Pantalón sastre contemporáneo de tiro medio con pinzas delanteras dobles y caída fluida en mezcla de lana fría y elastano.',
        price: 7990,
        stock: 13,
        category_id: 'cat-pantalones',
        category: EMBEDDED_CATEGORIES[2],
        images: [
            '/images/products/pantalon-sastre-relaxed-pleated.svg'
        ],
        featured: false,
        created_at: new Date('2024-02-08').toISOString(),
    }
];

export const EMBEDDED_VARIANTS = EMBEDDED_PRODUCTS.flatMap((prod) => [
    { id: `${prod.id}-s`, product_id: prod.id, size: 'S', stock: 4 },
    { id: `${prod.id}-m`, product_id: prod.id, size: 'M', stock: 6 },
    { id: `${prod.id}-l`, product_id: prod.id, size: 'L', stock: 5 },
    { id: `${prod.id}-xl`, product_id: prod.id, size: 'XL', stock: 3 },
]);

export const EMBEDDED_HOME_SECTIONS = [
    { id: '1', key: 'hero', is_visible: true, order_index: 0 },
    { id: '2', key: 'offer_banner', is_visible: true, order_index: 1 },
    { id: '3', key: 'categories', is_visible: true, order_index: 2 },
    { id: '4', key: 'featured', is_visible: true, order_index: 3 },
    { id: '5', key: 'values', is_visible: true, order_index: 4 },
];

export const EMBEDDED_COUPONS = [
    {
        id: 'coup-welcome',
        code: 'WELCOME10',
        public_title: '10% OFF en Colección Nueva',
        discount_type: 'percentage',
        discount_value: 10,
        applies_to: 'all',
        valid_from: null,
        valid_until: null,
        max_uses: null,
        uses_count: 34,
        is_automatic: true,
        is_active: true,
        coupon_products: [],
    },
];

export const EMBEDDED_DASHBOARD_STATS: DashboardStats = {
    productCount: EMBEDDED_PRODUCTS.length,
    categoryCount: EMBEDDED_CATEGORIES.length,
    totalStock: EMBEDDED_PRODUCTS.reduce((acc, p) => acc + p.stock, 0),
    totalValue: EMBEDDED_PRODUCTS.reduce((acc, p) => acc + p.price * p.stock, 0),
    lowStockCount: EMBEDDED_PRODUCTS.filter((p) => p.stock < 10).length,
    outOfStockCount: 0,
    featuredCount: EMBEDDED_PRODUCTS.filter((p) => p.featured).length,
    pendingReturnsCount: 0,
};

export const EMBEDDED_ORDERS = [
    {
        id: 'ord-1001',
        order_number: 'FM-2026-1001',
        customer_email: 'carlos.m@example.com',
        total_amount: 19890,
        status: 'completed',
        created_at: new Date('2026-03-01').toISOString(),
    },
    {
        id: 'ord-1002',
        order_number: 'FM-2026-1002',
        customer_email: 'lucia.s@example.com',
        total_amount: 6990,
        status: 'processing',
        created_at: new Date('2026-03-02').toISOString(),
    },
];
