import type { Category, Product, DashboardStats } from '../types';

export const EMBEDDED_CATEGORIES: (Category & { image: string })[] = [
    {
        id: 'cat-zapatillas',
        name: 'Zapatillas',
        slug: 'zapatillas',
        image: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
        created_at: new Date('2024-01-01').toISOString(),
    },
    {
        id: 'cat-sudaderas',
        name: 'Sudaderas',
        slug: 'sudaderas',
        image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
        created_at: new Date('2024-01-02').toISOString(),
    },
    {
        id: 'cat-pantalones',
        name: 'Pantalones',
        slug: 'pantalones',
        image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
        created_at: new Date('2024-01-03').toISOString(),
    },
    {
        id: 'cat-camisetas',
        name: 'Camisetas',
        slug: 'camisetas',
        image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
        created_at: new Date('2024-01-04').toISOString(),
    },
    {
        id: 'cat-chaquetas',
        name: 'Chaquetas',
        slug: 'chaquetas',
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
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
            'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1495105787522-5334e3ffa0ef?auto=format&fit=crop&w=1000&q=80'
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
            'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&w=1000&q=80'
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
            'https://images.unsplash.com/photo-1552346154-21d32810aba3?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1000&q=80'
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
            'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1517445312882-bc9910d016b7?auto=format&fit=crop&w=1000&q=80'
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
            'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=1000&q=80',
            'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&w=1000&q=80'
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
            'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1000&q=80'
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
            'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?auto=format&fit=crop&w=1000&q=80'
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
            'https://images.unsplash.com/photo-1506629082955-511b1aa562c8?auto=format&fit=crop&w=1000&q=80'
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
