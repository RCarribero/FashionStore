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
        image: 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292616/fashionstore/categories/zapatillas.webp',
        created_at: new Date('2024-01-01').toISOString(),
    },
    {
        id: 'cat-sudaderas',
        name: 'Sudaderas',
        slug: 'sudaderas',
        image: 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292618/fashionstore/categories/sudaderas.webp',
        created_at: new Date('2024-01-02').toISOString(),
    },
    {
        id: 'cat-pantalones',
        name: 'Pantalones',
        slug: 'pantalones',
        image: 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292619/fashionstore/categories/pantalones.webp',
        created_at: new Date('2024-01-03').toISOString(),
    },
    {
        id: 'cat-camisetas',
        name: 'Camisetas',
        slug: 'camisetas',
        image: 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292621/fashionstore/categories/camisetas.webp',
        created_at: new Date('2024-01-04').toISOString(),
    },
    {
        id: 'cat-chaquetas',
        name: 'Chaquetas',
        slug: 'chaquetas',
        image: 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768292621/fashionstore/categories/chaquetas.webp',
        created_at: new Date('2024-01-05').toISOString(),
    },
];

export const EMBEDDED_PRODUCTS: Product[] = [
    {
        id: 'prod-1',
        name: 'Chaqueta Windrunner Sportswear',
        slug: 'chaqueta-windrunner-sportswear',
        description: 'Chaqueta icónica cortavientos de inspiración running con diseño en chevron de 26 grados y tejido hidrófugo.',
        price: 11900,
        stock: 14,
        category_id: 'cat-chaquetas',
        category: EMBEDDED_CATEGORIES[4],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768207470/sportswear/windrunner-jacket-0.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-01').toISOString(),
    },
    {
        id: 'prod-2',
        name: 'Sudadera Vintage Hoodie Cream',
        slug: 'sudadera-vintage-hoodie-cream',
        description: 'Sudadera premium con capucha en tono crema vintage, algodón peinado de alta densidad y acabado suave.',
        price: 7990,
        stock: 22,
        category_id: 'cat-sudaderas',
        category: EMBEDDED_CATEGORIES[1],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389284/fashionstore/products/vintage-hoodie-cream.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-02').toISOString(),
    },
    {
        id: 'prod-3',
        name: 'Nike Air Jordan 1 High OG',
        slug: 'nike-air-jordan-1-high-og',
        description: 'La legendaria zapatilla de baloncesto de 1985 con amortiguación Air-Sole encapsulada y confección en piel de primera calidad.',
        price: 18999,
        stock: 18,
        category_id: 'cat-zapatillas',
        category: EMBEDDED_CATEGORIES[0],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768207952/sportswear/nike-air-jordan-1-high-og-0.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-03').toISOString(),
    },
    {
        id: 'prod-4',
        name: 'Pantalón Chino Beige Classic',
        slug: 'pantalon-chino-beige-classic',
        description: 'Pantalón chino beige de corte entallado contemporáneo con elasticidad añadida para máxima comodidad diaria.',
        price: 6990,
        stock: 19,
        category_id: 'cat-pantalones',
        category: EMBEDDED_CATEGORIES[2],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389276/fashionstore/products/chino-pants-beige.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-04').toISOString(),
    },
    {
        id: 'prod-5',
        name: 'Camiseta Graphic Tee Black',
        slug: 'camiseta-graphic-tee-black',
        description: 'Camiseta gráfica de corte regular en algodón orgánico suave con estampado frontal de inspiración urbana.',
        price: 3490,
        stock: 35,
        category_id: 'cat-camisetas',
        category: EMBEDDED_CATEGORIES[3],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389277/fashionstore/products/graphic-tee-black.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-05').toISOString(),
    },
    {
        id: 'prod-6',
        name: 'Chaqueta Zip Hoodie Navy',
        slug: 'chaqueta-zip-hoodie-navy',
        description: 'Chaqueta con cremallera completa y capucha en azul marino profundo, forro polar interior y bolsillos canguro.',
        price: 8490,
        stock: 12,
        category_id: 'cat-chaquetas',
        category: EMBEDDED_CATEGORIES[4],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389281/fashionstore/products/zip-hoodie-navy.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-06').toISOString(),
    },
    {
        id: 'prod-7',
        name: 'Adidas Samba OG White Black',
        slug: 'adidas-samba-og-white-black',
        description: 'El clásico atemporal del fútbol y la moda urbana con parte superior de piel suave, puntera de ante en T y suela de goma caramelo.',
        price: 11999,
        stock: 25,
        category_id: 'cat-zapatillas',
        category: EMBEDDED_CATEGORIES[0],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768207954/sportswear/adidas-samba-og-0.webp'
        ],
        featured: false,
        created_at: new Date('2024-02-07').toISOString(),
    },
    {
        id: 'prod-8',
        name: 'Pantalón Slim Jeans Dark Wash',
        slug: 'pantalon-slim-jeans-dark-wash',
        description: 'Vaquero de corte slim en denim tintado azul oscuro con elasticidad moderada y confección resistente de 5 bolsillos.',
        price: 7990,
        stock: 16,
        category_id: 'cat-pantalones',
        category: EMBEDDED_CATEGORIES[2],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389275/fashionstore/products/slim-jeans-dark.webp'
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
