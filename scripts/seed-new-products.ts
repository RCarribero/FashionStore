/**
 * Upload new product images to Cloudinary and seed database
 */
import { v2 as cloudinary } from 'cloudinary';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const supabase = createClient(
    process.env.PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Image files to upload (from artifact directory)
const artifactDir = 'C:/Users/RBX/.gemini/antigravity/brain/1d075cd6-fc1c-49cf-9f7c-54c1359f7024';

const newProducts = [
    // PANTALONES
    {
        name: 'Urban Cargo Pants Olive',
        slug: 'cargo-pants-olive',
        description: 'Pantalones cargo de inspiración militar en verde oliva. Múltiples bolsillos funcionales, ajuste relajado y tejido resistente de algodón.',
        price: 6999,
        stock: 50,
        category: 'pantalones',
        imageFile: 'cargo_pants_olive_1768388968194.png',
        featured: true
    },
    {
        name: 'SlimFit Denim Dark Blue',
        slug: 'slim-jeans-dark',
        description: 'Vaqueros slim fit en denim premium azul oscuro. Corte moderno, ligero efecto desgastado, cinco bolsillos clásicos.',
        price: 5999,
        stock: 65,
        category: 'pantalones',
        imageFile: 'slim_jeans_dark_1768388986721.png',
        featured: false
    },
    {
        name: 'Classic Chino Beige',
        slug: 'chino-pants-beige',
        description: 'Pantalón chino clásico en beige arena. Corte entallado, algodón premium, perfecto para ocasiones casuales y formales.',
        price: 4999,
        stock: 55,
        category: 'pantalones',
        imageFile: 'chino_pants_beige_1768388998750.png',
        featured: false
    },

    // CAMISETAS
    {
        name: 'Geometric Graphic Tee Black',
        slug: 'graphic-tee-black',
        description: 'Camiseta negra con estampado geométrico abstracto en blanco. Algodón premium 100%, corte relajado streetwear.',
        price: 2999,
        stock: 80,
        category: 'camisetas',
        imageFile: 'graphic_tee_black_1768389029091.png',
        featured: true
    },
    {
        name: 'Essential Polo Navy',
        slug: 'polo-shirt-navy',
        description: 'Polo clásico en azul marino. Algodón piqué de alta calidad, cuello con botones, corte regular elegante.',
        price: 3999,
        stock: 70,
        category: 'camisetas',
        imageFile: 'polo_shirt_navy_1768389042868.png',
        featured: true
    },
    {
        name: 'Oversized Tee Grey Melange',
        slug: 'oversized-tee-grey',
        description: 'Camiseta oversize en gris jaspeado. Hombros caídos, corte amplio y cómodo, algodón suave premium.',
        price: 2499,
        stock: 90,
        category: 'camisetas',
        imageFile: 'oversized_tee_grey_1768389056635.png',
        featured: false
    },
    {
        name: 'Breton Striped Tee Navy',
        slug: 'striped-tee-navy',
        description: 'Camiseta de rayas estilo bretón en azul marino y blanco. Diseño marinero clásico, algodón 100%.',
        price: 2799,
        stock: 75,
        category: 'camisetas',
        imageFile: 'striped_tee_navy_1768389072310.png',
        featured: false
    },

    // SUDADERAS
    {
        name: 'ZipUp Hoodie Navy',
        slug: 'zip-hoodie-navy',
        description: 'Sudadera con cremallera en azul marino. Capucha con cordón ajustable, bolsillos frontales, interior afelpado.',
        price: 5999,
        stock: 45,
        category: 'sudaderas',
        imageFile: 'zip_hoodie_navy_1768389109047.png',
        featured: true
    },
    {
        name: 'Classic Crewneck Burgundy',
        slug: 'crewneck-burgundy',
        description: 'Sudadera cuello redondo en burdeos. Corte clásico, interior de felpa suave, puños y bajo acanalados.',
        price: 4499,
        stock: 55,
        category: 'sudaderas',
        imageFile: 'crewneck_sweater_burgundy_1768389120889.png',
        featured: false
    },
    {
        name: 'Vintage Wash Hoodie Cream',
        slug: 'vintage-hoodie-cream',
        description: 'Sudadera vintage en crema con efecto desgastado. Corte oversize, detalles distressed, estilo retro premium.',
        price: 6499,
        stock: 40,
        category: 'sudaderas',
        imageFile: 'vintage_hoodie_cream_1768389135022.png',
        featured: true
    },

    // ZAPATILLAS
    {
        name: 'AirMax Runner Pro Red',
        slug: 'running-shoes-red',
        description: 'Zapatillas de running en rojo y negro. Diseño aerodinámico, malla transpirable, suela con amortiguación de aire visible.',
        price: 14999,
        stock: 35,
        category: 'zapatillas',
        imageFile: 'running_shoes_red_1768389148124.png',
        featured: true
    },
    {
        name: 'CourtKing Basketball Blue',
        slug: 'basketball-shoes-blue',
        description: 'Zapatillas de baloncesto en azul y naranja. Caña alta con soporte de tobillo, suela chunky antideslizante.',
        price: 13999,
        stock: 30,
        category: 'zapatillas',
        imageFile: 'basketball_shoes_blue_1768389176464.png',
        featured: false
    },
    {
        name: 'SkateClassic Suede Grey',
        slug: 'skate-shoes-grey',
        description: 'Zapatillas de skate en ante gris. Caña baja, suela vulcanizada resistente, diseño minimalista urbano.',
        price: 7999,
        stock: 50,
        category: 'zapatillas',
        imageFile: 'skate_shoes_grey_1768389190039.png',
        featured: false
    },
    {
        name: 'TrailMaster Hiking Boots',
        slug: 'hiking-boots-brown',
        description: 'Botas de senderismo en cuero marrón. Impermeables, suela robusta con agarre extremo, altura tobillo.',
        price: 15999,
        stock: 25,
        category: 'zapatillas',
        imageFile: 'hiking_boots_brown_1768389202944.png',
        featured: false
    }
];

async function uploadAndSeed() {
    console.log('Fetching categories...');
    const { data: categories } = await supabase.from('categories').select('id, slug');
    const categoryMap: Record<string, string> = {};
    categories?.forEach(cat => { categoryMap[cat.slug] = cat.id; });

    console.log('Categories:', Object.keys(categoryMap));

    let successCount = 0;

    for (const product of newProducts) {
        console.log(`\nProcessing: ${product.name}`);

        // Upload image to Cloudinary
        const imagePath = path.join(artifactDir, product.imageFile);

        if (!fs.existsSync(imagePath)) {
            console.log(`  ✗ Image not found: ${product.imageFile}`);
            continue;
        }

        try {
            console.log(`  → Uploading to Cloudinary...`);
            const uploadResult = await cloudinary.uploader.upload(imagePath, {
                folder: 'fashionstore/products',
                public_id: product.slug,
                format: 'webp',
                transformation: [{ width: 800, height: 800, crop: 'fill' }]
            });

            const imageUrl = uploadResult.secure_url;
            console.log(`  → Uploaded: ${imageUrl}`);

            // Insert product
            const { data: insertedProduct, error } = await supabase
                .from('products')
                .insert([{
                    name: product.name,
                    slug: product.slug,
                    description: product.description,
                    price: product.price,
                    stock: product.stock,
                    category_id: categoryMap[product.category],
                    images: [imageUrl],
                    featured: product.featured
                }])
                .select()
                .single();

            if (error) {
                if (error.code === '23505') {
                    console.log(`  ⚠ Product already exists, skipping`);
                } else {
                    console.error(`  ✗ Insert error:`, error.message);
                }
                continue;
            }

            // Create variants
            const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
            const variants = sizes.map(size => ({
                product_id: insertedProduct.id,
                size: size,
                stock: Math.floor(Math.random() * 20) + 5
            }));

            await supabase.from('product_variants').insert(variants);

            console.log(`  ✓ Created with variants`);
            successCount++;

        } catch (err: any) {
            console.error(`  ✗ Error:`, err.message);
        }
    }

    console.log(`\n✓ Complete! Created ${successCount}/${newProducts.length} products`);
}

uploadAndSeed();
