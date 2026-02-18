/**
 * Seed Sportswear Products Script
 * Clears existing products and creates new sportswear products
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';
import { v2 as cloudinary } from 'cloudinary';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

function requireEnv(name: string, value: string | undefined) {
    if (!value) {
        throw new Error(`Missing ${name} in environment`);
    }
    return value;
}

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const stripe = new Stripe(requireEnv('STRIPE_SECRET_KEY', process.env.STRIPE_SECRET_KEY));

const supabase = createClient(
    requireEnv('PUBLIC_SUPABASE_URL', process.env.PUBLIC_SUPABASE_URL),
    requireEnv('SUPABASE_SERVICE_ROLE_KEY', process.env.SUPABASE_SERVICE_ROLE_KEY)
);

interface ProductData {
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    featured: boolean;
    images: string[];
}

// Sportswear categories
const categories = [
    { name: 'Zapatillas', slug: 'zapatillas', description: 'Zapatillas deportivas de running y training' },
    { name: 'Camisetas', slug: 'camisetas', description: 'Camisetas deportivas y de entrenamiento' },
    { name: 'Pantalones', slug: 'pantalones', description: 'Pantalones y mallas deportivas' },
    { name: 'Sudaderas', slug: 'sudaderas', description: 'Sudaderas y hoodies deportivos' },
];

// Sportswear products
const products: ProductData[] = [
    // Zapatillas
    {
        name: 'Nike Air Jordan 1 High OG',
        description: 'La leyenda continua con las Nike Air Jordan 1 High OG. Piel premium, amortiguacion Air encapsulada y el clasico diseño que revoluciono el baloncesto y la moda urbana.',
        price: 18900,
        category: 'zapatillas',
        stock: 40,
        featured: true,
        images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800'], // Correct: Red Nike
    },
    {
        name: 'Adidas Samba OG',
        description: 'Nacidas en los campos de futbol, las Adidas Samba OG son un icono del estilo urbano. Parte superior de piel suave y ante, con la inconfundible suela de goma color caramelo.',
        price: 11900,
        category: 'zapatillas',
        stock: 60,
        featured: true,
        images: ['https://images.unsplash.com/photo-1587563871167-1ee9c731aef4?w=800'], // Correct: Adidas Shoe
    },
    {
        name: 'Nike Air Force 1 \'07',
        description: 'El fulgor sigue vivo con las Nike Air Force 1 \'07. La leyenda del baloncesto combina comodidad en la cancha con un estilo fuera de ella. Piel impecable y amortiguacion Nike Air.',
        price: 12900,
        category: 'zapatillas',
        stock: 75,
        featured: false,
        images: ['https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=800'], // Correct: White Nike AF1 style
    },
    {
        name: 'Adidas Ultraboost Light',
        description: 'Experimenta una energia epica con las Adidas Ultraboost Light. Nuestras Ultraboost mas ligeras hasta la fecha, con tecnologia BOOST mas reactiva para un retorno de energia sin fin.',
        price: 19900,
        category: 'zapatillas',
        stock: 30,
        featured: true,
        images: ['https://images.unsplash.com/photo-1555274175-75f4056dfd05?w=800'], // Correct: Adidas Boost style
    },
    {
        name: 'Nike Pegasus 41',
        description: 'La amortiguacion reactiva de las Nike Pegasus 41 te ofrece una pisada energica para tus carreras diarias. Malla de ingenieria transpirable y espuma ReactX para mayor comodidad.',
        price: 13900,
        category: 'zapatillas',
        stock: 50,
        featured: false,
        images: ['https://images.unsplash.com/photo-1584735175315-9d5df23860e6?w=800'], // Generic running, acceptable
    },

    // Camisetas
    {
        name: 'Nike Sportswear Premium Essentials',
        description: 'Camiseta de algodon de alta densidad con un ajuste holgado. El diseño sencillo y el tejido organico grueso la convierten en un basico imprescindible de calidad premium.',
        price: 4500,
        category: 'camisetas',
        stock: 100,
        featured: true,
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
    },
    {
        name: 'Adidas Adicolor Classics 3-Stripes',
        description: 'Un estilo autentico que no pasa de moda. Esta camiseta Adidas luce las 3 bandas en las mangas y el trebol bordado. Corte entallado y tejido de algodon suave.',
        price: 3500,
        category: 'camisetas',
        stock: 85,
        featured: false,
        images: ['https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=800'], // Generic tee, acceptable
    },
    {
        name: 'Nike Dri-FIT Rise 365',
        description: 'Camiseta de running ligera y transpirable. El tejido Dri-FIT capilariza el sudor para mantener la frescura. Elementos reflectantes para mayor visibilidad.',
        price: 5500,
        category: 'camisetas',
        stock: 60,
        featured: true,
        images: ['https://images.unsplash.com/photo-1503341504253-dff4815485f1?w=800'],
    },
    {
        name: 'Adidas Techfit Training',
        description: 'Supera tus limites con esta camiseta de compresion Adidas. La tecnologia AEROREADY mantiene la piel seca y el ajuste Techfit concentra la energia de tus musculos.',
        price: 4900,
        category: 'camisetas',
        stock: 55,
        featured: false,
        images: ['https://images.unsplash.com/photo-1562157873-818bc0726f68?w=800'], // Generic activewear
    },
    {
        name: 'Nike Legend Long Sleeve',
        description: 'La camiseta de manga larga Nike Legend es un basico de rendimiento. Tejido que absorbe el sudor y corte estandar para una comodidad duradera en cualquier entrenamiento.',
        price: 3900,
        category: 'camisetas',
        stock: 70,
        featured: false,
        images: ['https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=800'],
    },

    // Pantalones
    {
        name: 'Nike Solo Swoosh Fleece Pants',
        description: 'Pantalones de chandal de tejido Fleece cepillado, suave y calido. Diseño minimalista con el Swoosh bordado. Cintura elastica y ajuste holgado para un look relajado.',
        price: 9900,
        category: 'pantalones',
        stock: 45,
        featured: true,
        images: ['https://images.unsplash.com/photo-1552902865-b72c031ac5ea?w=800'],
    },
    {
        name: 'Adidas Adicolor Firebird Track Pants',
        description: 'El pantalon de chandal Firebird es un icono de Adidas. Tejido de tricot brillante con las 3 bandas a lo largo de las piernas. Cremalleras en los tobillos para un estilo retro.',
        price: 7900,
        category: 'pantalones',
        stock: 65,
        featured: true,
        images: ['https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800'], // Generic pants
    },
    {
        name: 'Nike Tech Fleece Joggers',
        description: 'Pantalones Tech Fleece con un diseño aerodinamico. Ofrecen calidez sin peso añadido. Bolsillo con cremallera termosellada para guardar tus cosas de forma segura.',
        price: 11000,
        category: 'pantalones',
        stock: 50,
        featured: true,
        images: ['https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800'],
    },
    {
        name: 'Adidas Essentials Fleece Pants',
        description: 'Pantalones deportivos clasicos para el confort diario. Tejido de felpa suave, corte conerico y puños de canalé. Cintura elastica con cordon para un ajuste personalizado.',
        price: 5900,
        category: 'pantalones',
        stock: 80,
        featured: false,
        images: ['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800'],
    },
    {
        name: 'Nike Challenger Dri-FIT',
        description: 'Pantalones de running versatiles con tejido Dri-FIT. Ligeros y elasticos para total libertad de movimiento. Bolsillos con cierre a presion para tus basicos.',
        price: 6900,
        category: 'pantalones',
        stock: 40,
        featured: false,
        images: ['https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800'],
    },

    // Sudaderas
    {
        name: 'Nike Sportswear Tech Fleece Hoodie',
        description: 'La sudadera con capucha Nike Tech Fleece con cremallera completa. Calor premium y look moderno. Capucha de 4 paneles para un ajuste comodo y estilizado.',
        price: 12900,
        category: 'sudaderas',
        stock: 55,
        featured: true,
        images: ['https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800'], // Generic hoodie
    },
    {
        name: 'Adidas Adicolor Classics Trefoil Hoodie',
        description: 'Sudadera con capucha y el gran logotipo del trebol de Adidas en el pecho. Tejido de felpa francesa de algodon muy comodo. Bolsillo canguro para el dia a dia.',
        price: 7900,
        category: 'sudaderas',
        stock: 70,
        featured: true,
        images: ['https://images.unsplash.com/photo-1614252369475-531eba835eb1?w=800'], // Adidas hoodie! (Previous was mismatch maybe)
    },
    {
        name: 'Nike Club Fleece Pullover',
        description: 'La sudadera que todos adoran. Tejido Club Fleece cepillado por dentro para mayor suavidad y calidez. Un basico esencial en cualquier armario deportivo.',
        price: 6500,
        category: 'sudaderas',
        stock: 90,
        featured: false,
        images: ['https://images.unsplash.com/photo-1620799140408-ed5341cd2431?w=800'],
    },
    {
        name: 'Adidas 3-Stripes Full-Zip Hoodie',
        description: 'Chaqueta con capucha y cremallera con el estilo clasico de las 3 bandas. Diseño ajustado y tejido suave. Perfecta para calentar o relajarse despues de entrenar.',
        price: 7500,
        category: 'sudaderas',
        stock: 60,
        featured: false,
        images: ['https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=800'],
    },
    {
        name: 'Jordan Brooklyn Fleece',
        description: 'Sudadera con capucha Jordan de tejido Fleece cepillado de densidad media. Ajuste holgado y comodo. Logotipo Jumpman bordado para un toque de legado.',
        price: 8900,
        category: 'sudaderas',
        stock: 35,
        featured: true,
        images: ['https://images.unsplash.com/photo-1554568218-0f1715e72254?w=800'],
    },
];

function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/[\s_]+/g, '-')
        .replace(/-+/g, '-')
        .trim();
}

async function uploadToCloudinary(imageUrl: string, fileName: string): Promise<string> {
    try {
        console.log(`    Uploading to Cloudinary: ${fileName}...`);
        const result = await cloudinary.uploader.upload(imageUrl, {
            folder: 'sportswear',
            public_id: fileName,
            overwrite: true,
            format: 'webp',
            quality: 'auto'
        });
        return result.secure_url;
    } catch (err) {
        console.error(`    Cloudinary upload failed for ${imageUrl}:`, (err as Error).message);
        return imageUrl; // Fallback to original Unsplash URL
    }
}

async function seedSportswear() {
    console.log('Starting sportswear seed...\n');
    console.log('WARNING: This will DELETE all existing products and categories!\n');

    // Delete existing data
    console.log('Deleting existing product variants...');
    const { error: variantErr } = await supabase.from('product_variants').delete().gte('created_at', '1970-01-01');
    if (variantErr) console.log('  Variants delete error:', variantErr.message);

    console.log('Deleting existing products...');
    const { error: prodErr } = await supabase.from('products').delete().gte('created_at', '1970-01-01');
    if (prodErr) console.log('  Products delete error:', prodErr.message);

    console.log('Deleting existing categories...');
    const { error: catErr } = await supabase.from('categories').delete().gte('created_at', '1970-01-01');
    if (catErr) console.log('  Categories delete error:', catErr.message);

    // Create categories
    console.log('\nCreating sportswear categories...');
    const categoryMap = new Map<string, string>();

    for (const cat of categories) {
        const { data, error } = await supabase
            .from('categories')
            .insert({
                name: cat.name,
                slug: cat.slug,
            })
            .select()
            .single();

        if (error) {
            console.error(`  Error creating ${cat.name}: ${error.message}`);
        } else {
            console.log(`  Created: ${cat.name} (${data.id})`);
            categoryMap.set(cat.slug, data.id);
        }
    }

    // Create products
    console.log('\nCreating sportswear products...');

    for (const product of products) {
        try {
            const categoryId = categoryMap.get(product.category);

            if (!categoryId) {
                console.error(`  Category not found for ${product.name}`);
                continue;
            }

            // Upload images to Cloudinary
            const cloudinaryImageUrls: string[] = [];
            for (let i = 0; i < product.images.length; i++) {
                const publicId = `${slugify(product.name)}-${i}`;
                const url = await uploadToCloudinary(product.images[i], publicId);
                cloudinaryImageUrls.push(url);
            }

            // Create in Supabase
            const { data, error } = await supabase
                .from('products')
                .insert({
                    name: product.name,
                    slug: slugify(product.name),
                    description: product.description,
                    price: product.price,
                    stock: product.stock,
                    category_id: categoryId,
                    featured: product.featured,
                    images: cloudinaryImageUrls,
                })
                .select()
                .single();

            if (error) {
                console.error(`  Error creating ${product.name} in Supabase: ${error.message}`);
            } else {
                console.log(`  Created in Supabase: ${product.name} (${data.id})`);

                // Create variants for each size
                const sizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
                for (const size of sizes) {
                    await supabase.from('product_variants').insert({
                        product_id: data.id,
                        size: size,
                        stock: Math.floor(Math.random() * 15) + 5,
                    });
                }
            }

            // Create in Stripe
            console.log(`  Creating ${product.name} in Stripe...`);
            const stripeProduct = await stripe.products.create({
                name: product.name,
                description: product.description,
                images: cloudinaryImageUrls.length > 0 ? [cloudinaryImageUrls[0]] : product.images,
                metadata: {
                    category: product.category,
                },
            });

            await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: product.price,
                currency: 'eur',
            });

        } catch (err) {
            console.error(`  Error with ${product.name}:`, err);
        }
    }

    console.log('\nSportswear seed complete!');
}

seedSportswear();
