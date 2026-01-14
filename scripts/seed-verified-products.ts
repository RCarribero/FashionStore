/**
 * Product Catalog with Verified Images
 * Uses specific Unsplash search terms per product
 */
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

console.log('Seeding product catalog with verified images...\n');

// Get category IDs
const { data: categories } = await supabase
    .from('categories')
    .select('id, slug');

const categoryMap: Record<string, string> = {};
categories?.forEach(cat => {
    categoryMap[cat.slug] = cat.id;
});

const products = [
    // NIKE ZAPATILLAS - Using very specific image searches
    {
        name: 'Nike Air Max 270',
        slug: 'nike-air-max-270',
        description: 'Zapatillas icónicas con la mayor unidad Air Max hasta la fecha, proporcionando comodidad extrema todo el día.',
        price: 14999,
        stock: 45,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&q=80'], // Actual Air Max photo
        featured: true
    },
    {
        name: 'Nike Air Force 1 Low White',
        slug: 'nike-air-force-1-white',
        description: 'El icónico clásico de baloncesto reinventado con estilo urbano. Diseño todo blanco atemporal.',
        price: 11999,
        stock: 60,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1549298916-b41d1e6bf77d?w=800&q=80'], // White Nike sneaker
        featured: true
    },
    {
        name: 'Nike Jordan 1 Mid',
        slug: 'nike-jordan-1-mid',
        description: 'Estilo Jordan icónico en formato mid. Herencia del baloncesto con diseño versátil para el día a día.',
        price: 12999,
        stock: 40,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800&q=80'], // Jordan 1
        featured: true
    },
    {
        name: 'Nike Dunk Low Panda',
        slug: 'nike-dunk-low-panda',
        description: 'Diseño retro en colorway blanco y negro. Estilo clásico de los 80 actualizado para hoy.',
        price: 11999,
        stock: 35,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=800&q=80'], // Dunk Low
        featured: false
    },
    {
        name: 'Nike Air Max 90',
        slug: 'nike-air-max-90',
        description: 'Icono de running de los 90. Diseño clásico con amortiguación Air visible y estilo duradero.',
        price: 13999,
        stock: 50,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1600185365926-3a2ce3cdb9eb?w=800&q=80'], // Running shoes
        featured: false
    },

    // ADIDAS ZAPATILLAS
    {
        name: 'Adidas Samba Black',
        slug: 'adidas-samba-black',
        description: 'Clásico del fútbol sala con diseño retro. Piel premium y suela icónica de goma.',
        price: 9999,
        stock: 55,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?w=800&q=80'], // Black Adidas
        featured: true
    },
    {
        name: 'Adidas Stan Smith',
        slug: 'adidas-stan-smith',
        description: 'Zapatilla de tenis legendaria. Diseño minimalista en piel blanca con talón verde característico.',
        price: 9499,
        stock: 65,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1622556498246-755f44ca76f3?w=800&q=80'], // White Adidas
        featured: true
    },
    {
        name: 'Adidas Ultraboost 22',
        slug: 'adidas-ultraboost-22',
        description: 'Tecnología Boost para máximo retorno de energía. Running shoe de alto rendimiento.',
        price: 17999,
        stock: 35,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&q=80'], // Running shoe
        featured: true
    },
    {
        name: 'Adidas Superstar',
        slug: 'adidas-superstar',
        description: 'Icono urbano con puntera de concha. Diseño atemporal desde 1970.',
        price: 9999,
        stock: 60,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1491553895911-0055eca6402d?w=800&q=80'], // Classic sneakers
        featured: false
    },
    {
        name: 'Adidas Gazelle',
        slug: 'adidas-gazelle',
        description: 'Clásico de ante de los 60. Estilo elegante con las tres franjas icónicas.',
        price: 9999,
        stock: 50,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1552346989-e069318e20a5?w=800&q=80'], // Suede sneakers
        featured: false
    },

    // NIKE ROPA
    {
        name: 'Nike Tech Fleece Hoodie Grey',
        slug: 'nike-tech-fleece-hoodie',
        description: 'Sudadera premium con tecnología Tech Fleece. Calidez sin peso extra, diseño moderno.',
        price: 10999,
        stock: 45,
        category_id: categoryMap['sudaderas'],
        images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80'], // Grey hoodie
        featured: true
    },
    {
        name: 'Nike Club Fleece Hoodie',
        slug: 'nike-club-fleece-hoodie',
        description: 'Sudadera clásica en felpa suave. Ajuste relajado con logo Swoosh bordado.',
        price: 5999,
        stock: 70,
        category_id: categoryMap['sudaderas'],
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80'], // Black hoodie
        featured: false
    },
    {
        name: 'Nike Tech Fleece Joggers Black',
        slug: 'nike-tech-fleece-joggers',
        description: 'Pantalones deportivos en tejido Tech Fleece. Ajuste cónico con detalles premium.',
        price: 9999,
        stock: 50,
        category_id: categoryMap['pantalones'],
        images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80'], // Black joggers
        featured: true
    },
    {
        name: 'Nike Essentials T-Shirt',
        slug: 'nike-essentials-tshirt',
        description: 'Camiseta básica de algodón con logo Swoosh. Esencial para uso diario.',
        price: 2999,
        stock: 80,
        category_id: categoryMap['camisetas'],
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'], // Basic tee
        featured: false
    },

    // ADIDAS ROPA
    {
        name: 'Adidas Trefoil Hoodie Black',
        slug: 'adidas-trefoil-hoodie',
        description: 'Sudadera icónica con logo Trefoil oversized. Estilo casual Originals.',
        price: 6999,
        stock: 60,
        category_id: categoryMap['sudaderas'],
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80'], // Black hoodie
        featured: true
    },
    {
        name: 'Adidas 3-Stripes Hoodie',
        slug: 'adidas-3-stripes-hoodie',
        description: 'Sudadera esencial con las icónicas 3 rayas. Felpa suave y ajuste clásico.',
        price: 5499,
        stock: 70,
        category_id: categoryMap['sudaderas'],
        images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=800&q=80'], // Grey hoodie
        featured: false
    },
    {
        name: 'Adidas Track Pants',
        slug: 'adidas-track-pants',
        description: 'Pantalones de chándal con las 3 rayas. Diseño retro con ajuste cónico.',
        price: 6499,
        stock: 55,
        category_id: categoryMap['pantalones'],
        images: ['https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&q=80'], // Track pants
        featured: false
    },
    {
        name: 'Adidas Essentials T-Shirt',
        slug: 'adidas-essentials-tshirt',
        description: 'Camiseta básica con logo Badge of Sport. Algodón suave para uso diario.',
        price: 2499,
        stock: 90,
        category_id: categoryMap['camisetas'],
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800&q=80'], // Basic tee
        featured: false
    },

    // PRODUCTOS ADICIONALES
    {
        name: 'Nike Air Max Plus',
        slug: 'nike-air-max-plus',
        description: 'Diseño futurista con tecnología Tuned Air. Estilo distintivo y amortiguación premium.',
        price: 16999,
        stock: 30,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1605408499391-6368c628ef42?w=800&q=80'],
        featured: false
    },
    {
        name: 'Nike Blazer Mid',
        slug: 'nike-blazer-mid',
        description: 'Zapatilla de baloncesto vintage. Diseño mid-top con estilo retro auténtico.',
        price: 10999,
        stock: 45,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1515347619252-60a4bf4fff4f?w=800&q=80'],
        featured: false
    },
    {
        name: 'Adidas Forum Low',
        slug: 'adidas-forum-low',
        description: 'Baloncesto de los 80 reinventado. Diseño icónico con correa en X característica.',
        price: 10999,
        stock: 40,
        category_id: categoryMap['zapatillas'],
        images: ['https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=800&q=80'],
        featured: false
    }
];

console.log(`Inserting ${products.length} products...\n`);

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

console.log(`\n✓ Catalog seeding complete!`);
console.log(`Successfully created: ${successCount}/${products.length} products`);
