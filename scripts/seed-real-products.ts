/**
 * Real Product Catalog Seeder
 * Seeds database with authentic Nike and Adidas products
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log('Seeding real product catalog...\n');

// Get category IDs
const { data: categories } = await supabase
    .from('categories')
    .select('id, slug');

const categoryMap: Record<string, string> = {};
categories?.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
});

const products = [
    // ===== NIKE ZAPATILLAS =====
    {
        name: 'Nike Air Max 270',
        slug: 'nike-air-max-270',
        description: 'Zapatillas con la unidad Air Max más grande hasta la fecha. Diseño moderno con malla transpirable y amortiguación excepcional para uso diario.',
        price: 14999, // €149.99
        stock: 45,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'],
        featured: true
    },
    {
        name: 'Nike Air Max 90',
        slug: 'nike-air-max-90',
        description: 'Icono atemporal con diseño clásico de líneas limpias y detalles distintivos. Amortiguación Air visible y parte superior duradera.',
        price: 13999, // €139.99
        stock: 50,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800'],
        featured: true
    },
    {
        name: 'Nike Air Force 1 \'07',
        slug: 'nike-air-force-1-07',
        description: 'El clásico que lo inició todo. Diseño limpio de baloncesto con base de espuma suave y plantilla acolchada para mayor comodidad.',
        price: 11999, // €119.99
        stock: 60,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1549298916-b41d1e6bf77d?w=800'],
        featured: true
    },
    {
        name: 'Nike Air Jordan 1 Mid',
        slug: 'nike-air-jordan-1-mid',
        description: 'Estilo icónico de Jordan en formato mid-top. Combina la herencia del baloncesto con comodidad versátil para el día a día.',
        price: 12999, // €129.99
        stock: 40,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800'],
        featured: false
    },
    {
        name: 'Nike Dunk Low',
        slug: 'nike-dunk-low',
        description: 'Diseño retro de college basketball reimaginado. Estilo clásico de los 80 con combinaciones de colores vibrantes.',
        price: 11999, // €119.99
        stock: 35,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800'],
        featured: false
    },

    // ===== NIKE ROPA =====
    {
        name: 'Nike Sportswear Club Fleece Hoodie',
        slug: 'nike-sportswear-club-fleece-hoodie',
        description: 'Sudadera con capucha de felpa suave y cepillada. Diseño clásico con ajuste relajado y logo Swoosh bordado.',
        price: 5999, // €59.99
        stock: 70,
        category_id: categoryMap['sudaderas'],
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'],
        featured: false
    },
    {
        name: 'Nike Sportswear Tech Fleece Hoodie',
        slug: 'nike-sportswear-tech-fleece-hoodie',
        description: 'Innovador tejido Tech Fleece que proporciona calidez sin peso. Diseño premium con capucha ajustable y bolsillos con cremallera.',
        price: 10999, // €109.99
        stock: 45,
        category_id: categoryMap['sudaderas'],
        images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800'],
        featured: true
    },
    {
        name: 'Nike Sportswear Tech Fleece Joggers',
        slug: 'nike-sportswear-tech-fleece-joggers',
        description: 'Pantalones deportivos en tejido Tech Fleece premium. Corte ajustado con cintura elástica y puños en los tobillos.',
        price: 9999, // €99.99
        stock: 50,
        category_id: categoryMap['pantalones'],
        images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800'],
        featured: true
    },
    {
        name: 'Nike Club Fleece Crew Sweatshirt',
        slug: 'nike-club-fleece-crew-sweatshirt',
        description: 'Sudadera clásica de cuello redondo en felpa suave. Esencial del armario con logo bordado y ajuste estándar.',
        price: 5499, // €54.99
        stock: 60,
        category_id: categoryMap['sudaderas'],
        images: ['https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=800'],
        featured: false
    },
    {
        name: 'Nike Sportswear Essential T-Shirt',
        slug: 'nike-sportswear-essential-t-shirt',
        description: 'Camiseta básica de algodón con logo Swoosh. Ajuste estándar perfecto para uso diario.',
        price: 2999, // €29.99
        stock: 80,
        category_id: categoryMap['camisetas'],
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
        featured: false
    },

    // ===== ADIDAS ZAPATILLAS =====
    {
        name: 'Adidas Ultraboost 5',
        slug: 'adidas-ultraboost-5',
        description: 'Tecnología Boost de retorno de energía para cada zancada. Parte superior Primeknit+ adaptable y diseño enfocado en el rendimiento.',
        price: 17999, // €179.99
        stock: 35,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800'],
        featured: true
    },
    {
        name: 'Adidas Samba OG',
        slug: 'adidas-samba-og',
        description: 'Icono del fútbol sala reimaginado para la calle. Diseño clásico con parte superior de piel suave y suela de goma.',
        price: 9999, // €99.99
        stock: 55,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800'],
        featured: true
    },
    {
        name: 'Adidas Stan Smith',
        slug: 'adidas-stan-smith',
        description: 'Zapatilla legendaria de tenis con perfil minimalista. Diseño limpio de piel blanca con detalles verdes característicos.',
        price: 9499, // €94.99
        stock: 65,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1622556498246-755f44ca76f3?w=800'],
        featured: false
    },
    {
        name: 'Adidas Forum Low',
        slug: 'adidas-forum-low',
        description: 'Estilo retro de baloncesto de los 80. Diseño icónico con correa en X característica y parte superior de piel premium.',
        price: 10999, // €109.99
        stock: 40,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800'],
        featured: false
    },
    {
        name: 'Adidas Gazelle',
        slug: 'adidas-gazelle',
        description: 'Clásico de ante de los años 60. Diseño elegante con las tres franjas características y suela de goma vulcanizada.',
        price: 9999, // €99.99
        stock: 50,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1552346989-e069318e20a5?w=800'],
        featured: false
    },

    // ===== ADIDAS ROPA =====
    {
        name: 'Adidas Adicolor Classics Trefoil Hoodie',
        slug: 'adidas-adicolor-classics-trefoil-hoodie',
        description: 'Sudadera icónica con el legendario logo Trefoil. Diseño casual con capucha ajustable y bolsillo canguro.',
        price: 6999, // €69.99
        stock: 60,
        category_id: categoryMap['sudaderas'],
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'],
        featured: true
    },
    {
        name: 'Adidas Essentials 3-Stripes Hoodie',
        slug: 'adidas-essentials-3-stripes-hoodie',
        description: 'Sudadera esencial con las icónicas 3 rayas. Felpa suave de algodón y ajuste regular para máxima comodidad.',
        price: 5499, // €54.99
        stock: 70,
        category_id: categoryMap['sudaderas'],
        images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800'],
        featured: false
    },
    {
        name: 'Adidas Z.N.E. Hoodie',
        slug: 'adidas-zne-hoodie',
        description: 'Sudadera de alta calidad diseñada para ayudarte a concentrarte. Tejido premium con capucha de tres piezas.',
        price: 8999, // €89.99
        stock: 35,
        category_id: categoryMap['sudaderas'],
        images: ['https://images.unsplash.com/photo-1614252368534-1e477c8f9ced?w=800'],
        featured: false
    },
    {
        name: 'Adidas Adicolor Classics 3-Stripes Track Pants',
        slug: 'adidas-adicolor-classics-3-stripes-track-pants',
        description: 'Pantalones de chándal retro con las icónicas 3 rayas. Diseño cónico con cintura elástica y bolsillos laterales.',
        price: 6499, // €64.99
        stock: 55,
        category_id: categoryMap['pantalones'],
        images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800'],
        featured: false
    },
    {
        name: 'Adidas Essentials Logo T-Shirt',
        slug: 'adidas-essentials-logo-t-shirt',
        description: 'Camiseta básica de algodón con logo icónico. Ajuste classic para uso diario versátil.',
        price: 2499, // €24.99
        stock: 90,
        category_id: categoryMap['camisetas'],
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
        featured: false
    },

    // ===== PRODUCTOS ADICIONALES NIKE =====
    {
        name: 'Nike Air Max Plus',
        slug: 'nike-air-max-plus',
        description: 'Diseño distintivo con inspiración en palmeras tropicales. Tecnología Tuned Air para estabilidad y amortiguación máximas.',
        price: 16999, // €169.99
        stock: 30,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800'],
        featured: false
    },
    {
        name: 'Nike Blazer Mid \'77',
        slug: 'nike-blazer-mid-77',
        description: 'Zapatilla de baloncesto vintage con estilo retro auténtico. Parte superior de ante y diseño mid-top clásico.',
        price: 10999, // €109.99
        stock: 45,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800'],
        featured: false
    },
    {
        name: 'Nike Sportswear Windrunner Jacket',
        slug: 'nike-sportswear-windrunner-jacket',
        description: 'Chaqueta cortavientos icónica con diseño chevron característico. Ligera, repelente al agua y con capucha integrada.',
        price: 8999, // €89.99
        stock: 40,
        category_id: categoryMap['chaquetas'],
        images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'],
        featured: false
    },

    // ===== PRODUCTOS ADICIONALES ADIDAS =====
    {
        name: 'Adidas Superstar',
        slug: 'adidas-superstar',
        description: 'Zapatilla legendaria con la icónica puntera de concha. Estilo urbano atemporal desde 1970.',
        price: 9999, // €99.99
        stock: 60,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800'],
        featured: false
    },
    {
        name: 'Adidas Firebird Track Jacket',
        slug: 'adidas-firebird-track-jacket',
        description: 'Chaqueta de chándal icónica con las 3 rayas. Diseño retro con cierre completo y bolsillos laterales.',
        price: 7499, // €74.99
        stock: 50,
        category_id: categoryMap['chaquetas'],
        images: ['https://images.unsplash.com/photo-1551488831-00ddcb6c6bd3?w=800'],
        featured: false
    },
    {
        name: 'Adidas Tiro Track Pants',
        slug: 'adidas-tiro-track-pants',
        description: 'Pantalones deportivos diseñados para entrenar. Tejido ligero con tecnología AEROREADY que absorbe la humedad.',
        price: 5499, // €54.99
        stock: 65,
        category_id: categoryMap['pantalones'],
        images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800'],
        featured: false
    }
];

console.log(`Inserting ${products.length} products...\n`);

// Insert products one by one to get their IDs
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

    // Create variants for each product (sizes XS to XXL)
    const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const variants = sizes.map(size => ({
        product_id: insertedProduct.id,
        size: size,
        stock: Math.floor(Math.random() * 20) + 5 // 5-25 items per size
    }));

    const { error: variantError } = await supabase
        .from('product_variants')
        .insert(variants);

    if (variantError) {
        console.error(`    ✗ Variant error:`, variantError.message);
    } else {
        console.log(`    ✓ Created with variants`);
    }
}

console.log('\n✓ Catalog seeding complete!');
console.log(`\nTotal products: ${products.length}`);
console.log('Nike products: 13');
console.log('Adidas products: 13');
