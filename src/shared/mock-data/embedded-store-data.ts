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
        image: 'https://res.cloudinary.com/dzaka0idb/image/upload/v1768291799/fashionstore/fashionstore/techwear-pro-hoodie.webp',
        created_at: new Date('2024-01-05').toISOString(),
    },
];

const createVariants = (productId: string) => [
    { id: `${productId}-xs`, product_id: productId, size: 'XS', stock: 5 },
    { id: `${productId}-s`, product_id: productId, size: 'S', stock: 12 },
    { id: `${productId}-m`, product_id: productId, size: 'M', stock: 18 },
    { id: `${productId}-l`, product_id: productId, size: 'L', stock: 15 },
    { id: `${productId}-xl`, product_id: productId, size: 'XL', stock: 8 },
    { id: `${productId}-xxl`, product_id: productId, size: 'XXL', stock: 4 },
];

export const EMBEDDED_PRODUCTS: (Product & { variants: any[] })[] = [
    {
        id: 'prod-1',
        name: 'Chaqueta Técnica TechWear Pro',
        slug: 'chaqueta-tecnica-techwear-pro',
        description: 'Chaqueta técnica de alto rendimiento en tejido negro mate hidrófugo con cremallera termosellada, capucha envolvente y bolsillos ergonómicos.',
        price: 12900,
        stock: 14,
        category_id: 'cat-chaquetas',
        category: EMBEDDED_CATEGORIES[4],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768291799/fashionstore/fashionstore/techwear-pro-hoodie.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-01').toISOString(),
        variants: createVariants('prod-1'),
    },
    {
        id: 'prod-2',
        name: 'Sudadera Vintage Hoodie Cream',
        slug: 'sudadera-vintage-hoodie-cream',
        description: 'Sudadera premium con capucha en tono crema vintage, algodón peinado de alta densidad (450 GSM) y lavado suave al tacto.',
        price: 7990,
        stock: 22,
        category_id: 'cat-sudaderas',
        category: EMBEDDED_CATEGORIES[1],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389284/fashionstore/products/vintage-hoodie-cream.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-02').toISOString(),
        variants: createVariants('prod-2'),
    },
    {
        id: 'prod-3',
        name: 'Sneakers Retro Court Burgundy',
        slug: 'sneakers-retro-court-burgundy',
        description: 'Zapatillas clásicas de pista inspiradas en los años 80, confeccionadas en ante prémium color burdeos con detalles crema y suela envejecida.',
        price: 11999,
        stock: 18,
        category_id: 'cat-zapatillas',
        category: EMBEDDED_CATEGORIES[0],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768291803/fashionstore/fashionstore/retro-court-burgundy.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-03').toISOString(),
        variants: createVariants('prod-3'),
    },
    {
        id: 'prod-4',
        name: 'Pantalón Chino Beige Classic',
        slug: 'pantalon-chino-beige-classic',
        description: 'Pantalón chino beige de corte entallado contemporáneo en sarga de algodón stretch para máxima comodidad diaria.',
        price: 6990,
        stock: 19,
        category_id: 'cat-pantalones',
        category: EMBEDDED_CATEGORIES[2],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389276/fashionstore/products/chino-pants-beige.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-04').toISOString(),
        variants: createVariants('prod-4'),
    },
    {
        id: 'prod-5',
        name: 'Camiseta Heavyweight Boxy Fit Grey',
        slug: 'camiseta-heavyweight-boxy-fit-grey',
        description: 'Camiseta de corte boxy fit en algodón peinado de 280 GSM color gris melange, con hombros caídos y cuello acanalado reforzado.',
        price: 3490,
        stock: 35,
        category_id: 'cat-camisetas',
        category: EMBEDDED_CATEGORIES[3],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389279/fashionstore/products/oversized-tee-grey.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-05').toISOString(),
        variants: createVariants('prod-5'),
    },
    {
        id: 'prod-6',
        name: 'Chaqueta Zip Hoodie Navy',
        slug: 'chaqueta-zip-hoodie-navy',
        description: 'Chaqueta con cremallera completa y capucha en azul marino profundo, forro de felpa perchada y cordones a juego.',
        price: 8490,
        stock: 12,
        category_id: 'cat-chaquetas',
        category: EMBEDDED_CATEGORIES[4],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389281/fashionstore/products/zip-hoodie-navy.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-06').toISOString(),
        variants: createVariants('prod-6'),
    },
    {
        id: 'prod-7',
        name: 'Zapatillas Urban CloudStep White',
        slug: 'zapatillas-urban-cloudstep-white',
        description: 'Sneakers minimalistas de piel napa blanca con talonera en ante gris claro y suela vulcanizada de gran amortiguación.',
        price: 9999,
        stock: 25,
        category_id: 'cat-zapatillas',
        category: EMBEDDED_CATEGORIES[0],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768291796/fashionstore/fashionstore/cloudstep-casual-white.webp'
        ],
        featured: false,
        created_at: new Date('2024-02-07').toISOString(),
        variants: createVariants('prod-7'),
    },
    {
        id: 'prod-8',
        name: 'Pantalón Slim Jeans Dark Wash',
        slug: 'pantalon-slim-jeans-dark-wash',
        description: 'Vaquero de corte slim en denim azul oscuro lavado con hilado elástico de alta recuperación y costuras reforzadas.',
        price: 7990,
        stock: 16,
        category_id: 'cat-pantalones',
        category: EMBEDDED_CATEGORIES[2],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389275/fashionstore/products/slim-jeans-dark.webp'
        ],
        featured: false,
        created_at: new Date('2024-02-08').toISOString(),
        variants: createVariants('prod-8'),
    },
    {
        id: 'prod-9',
        name: 'Camiseta Graphic Tee Black Urban',
        slug: 'camiseta-graphic-tee-black-urban',
        description: 'Camiseta gráfica de corte regular confeccionada en algodón 100% orgánico negro con diseño geométrico serigrafiado en blanco.',
        price: 2990,
        stock: 40,
        category_id: 'cat-camisetas',
        category: EMBEDDED_CATEGORIES[3],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389277/fashionstore/products/graphic-tee-black.webp'
        ],
        featured: false,
        created_at: new Date('2024-02-09').toISOString(),
        variants: createVariants('prod-9'),
    },
    {
        id: 'prod-10',
        name: 'Pantalón Cargo Táctico Olive',
        slug: 'pantalon-cargo-tactico-olive',
        description: 'Pantalón militar táctico en verde oliva con bolsillos laterales de fuelle y botones de presión, rodillas articuladas y tejido antidesgarro.',
        price: 8990,
        stock: 15,
        category_id: 'cat-pantalones',
        category: EMBEDDED_CATEGORIES[2],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389274/fashionstore/products/cargo-pants-olive.webp'
        ],
        featured: false,
        created_at: new Date('2024-02-10').toISOString(),
        variants: createVariants('prod-10'),
    },
    {
        id: 'prod-11',
        name: 'Sudadera Crewneck Fleece Burgundy',
        slug: 'sudadera-crewneck-fleece-burgundy',
        description: 'Sudadera clásica de cuello redondo en felpa cálida color burdeos con puños y cintura acanalados elásticos.',
        price: 6490,
        stock: 20,
        category_id: 'cat-sudaderas',
        category: EMBEDDED_CATEGORIES[1],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389282/fashionstore/products/crewneck-burgundy.webp'
        ],
        featured: false,
        created_at: new Date('2024-02-11').toISOString(),
        variants: createVariants('prod-11'),
    },
    {
        id: 'prod-12',
        name: 'Sneakers Air Max Runner Red',
        slug: 'sneakers-air-max-runner-red',
        description: 'Zapatillas de running de alto rendimiento en rojo fuego con cámara de aire visible en toda la suela y parte superior de malla transpirable.',
        price: 13999,
        stock: 28,
        category_id: 'cat-zapatillas',
        category: EMBEDDED_CATEGORIES[0],
        images: [
            'https://res.cloudinary.com/dzaka0idb/image/upload/v1768389286/fashionstore/products/running-shoes-red.webp'
        ],
        featured: true,
        created_at: new Date('2024-02-12').toISOString(),
        variants: createVariants('prod-12'),
    },
];

export const EMBEDDED_VARIANTS = EMBEDDED_PRODUCTS.flatMap((prod) => prod.variants);

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
