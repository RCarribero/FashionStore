/**
 * Fictional Product Catalog with AI Generated Images
 * All products are original fiction, all images are custom AI generated
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log('Seeding fictional product catalog...\n');

// Get category IDs
const { data: categories } = await supabase
    .from('categories')
    .select('id, slug');

const categoryMap: Record<string, string> = {};
categories?.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
});

const products = [
    // ZAPATILLAS DEPORTIVAS
    {
        name: 'UrbanStride Runner Pro',
        slug: 'urbanstride-runner-pro',
        description: 'Zapatillas de running de alto rendimiento con malla transpirable y suela con amortiguación avanzada. Diseño aerodinámico en negro y verde neón.',
        price: 12999,
        stock: 45,
        category_id: categoryMap['zapatillas'],
        images: ['/C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024/urbanstride_runner_1768291383787.png'],
        featured: true
    },
    {
        name: 'CloudStep Casual White',
        slug: 'cloudstep-casual-white',
        description: 'Zapatillas casuales minimalistas en piel blanca premium con detalles grises. Diseño limpio y versátil para uso diario.',
        price: 8999,
        stock: 60,
        category_id: categoryMap['zapatillas'],
        images: ['/C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024/cloudstep_casual_1768291399128.png'],
        featured: true
    },
    {
        name: 'FlexMotion Training Elite',
        slug: 'flexmotion-training-elite',
        description: 'Zapatillas de entrenamiento en azul marino y blanco. Diseño técnico con paneles de malla para máxima transpirabilidad.',
        price: 9999,
        stock: 50,
        category_id: categoryMap['zapatillas'],
        images: ['/C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024/flexmotion_trainer_1768291413641.png'],
        featured: true
    },
    {
        name: 'StreetStyle High Classic',
        slug: 'streetstyle-high-classic',
        description: 'Zapatillas urbanas de caña alta en lona negra con suela blanca. Estilo clásico de street wear.',
        price: 6999,
        stock: 55,
        category_id: categoryMap['zapatillas'],
        images: ['/C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024/streetstyle_high_1768291427714.png'],
        featured: false
    },
    {
        name: 'UrbanStride Classic All-White',
        slug: 'urbanstride-classic-white',
        description: 'Zapatillas deportivo-casuales todo blanco con perforaciones decorativas. Diseño moderno y limpio.',
        price: 7999,
        stock: 65,
        category_id: categoryMap['zapatillas'],
        images: ['/C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024/urbanstride_classic_white_1768291494780.png'],
        featured: false
    },
    {
        name: 'RetroCourtVintage Burgundy',
        slug: 'retro-court-burgundy',
        description: 'Zapatillas retro de inspiración vintage en ante burdeos y crema. Diseño clásico de pista de tenis.',
        price: 8499,
        stock: 40,
        category_id: categoryMap['zapatillas'],
        images: ['/C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024/retro_court_sneaker_1768291508676.png'],
        featured: false
    },

    // SUDADERAS
    {
        name: 'TechWear Pro Hoodie Black',
        slug: 'techwear-pro-hoodie',
        description: 'Sudadera técnica de alto rendimiento en negro. Diseño moderno con detalles reflectantes y bolsillos con cremallera.',
        price: 7999,
        stock: 45,
        category_id: categoryMap['sudaderas'],
        images: ['/C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024/techware_hoodie_black_1768291441248.png'],
        featured: true
    },
    {
        name: 'ComfortFleece Classic Grey',
        slug: 'comfort-fleece-grey',
        description: 'Sudadera clásica de felpa suave en gris jaspeado. Diseño relajado con bolsillo canguro y capucha ajustable.',
        price: 4999,
        stock: 70,
        category_id: categoryMap['sudaderas'],
        images: ['/C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024/comfort_fleece_grey_1768291454960.png'],
        featured: false
    },

    // PANTALONES
    {
        name: 'Athletic Joggers Pro Black',
        slug: 'athletic-joggers-black',
        description: 'Pantalones deportivos en negro con ajuste cónico. Cintura elástica con cordón y puños en tobillos.',
        price: 5999,
        stock: 60,
        category_id: categoryMap['pantalones'],
        images: ['/C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024/athletic_joggers_black_1768291467050.png'],
        featured: true
    },

    // CAMISETAS
    {
        name: 'Essential Cotton Tee White',
        slug: 'essential-tee-white',
        description: 'Camiseta básica de algodón 100% en blanco. Cuello redondo clásico y ajuste estándar.',
        price: 1999,
        stock: 90,
        category_id: categoryMap['camisetas'],
        images: ['/C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024/essential_tee_white_1768291481766.png'],
        featured: false
    }
];

console.log(`Inserting ${products.length} fictional products...\n`);

let successCount = 0;
for (const product of products) {
    console.log(`  → ${product.name}`);

    const { data: insertedProduct, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single();

    if (error) {
        console.error(`    ✗ Error:`, error.message);
        continue;
    }

    // Create variants
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const variants = sizes.map(size => ({
        product_id: insertedProduct.id,
        size: size,
        stock: Math.floor(Math.random() * 20) + 5
    }));

    const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variants);

    if (variantError) {
        console.error(`    ✗ Variant error:`, variantError.message);
    } else {
        console.log(`    ✓ Created with variants`);
        successCount++;
    }
}

console.log(`\n✓ Fictional catalog complete!`);
console.log(`Successfully created: ${successCount}/${products.length} products`);
console.log('\nAll products use 100% AI-generated custom images!');
