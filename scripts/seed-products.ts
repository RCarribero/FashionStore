/**
 * Seed Products Script
 * Creates products in Stripe and Supabase
 */

import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe('sk_REDACTED51Snb87CFzYRW6R0mDBbMEZRsdMg3damRDQ4a0h4whl5OPZM0YO9NRdntcOw3GuPKPcdaPRQwT8OTw03zwYbgdU1200ivNMMn3i');

const supabase = createClient(
    'https://dixaynqqloclazirzgik.supabase.co',
    'JWT_REDACTED'
);

interface ProductData {
    name: string;
    description: string;
    price: number; // in cents
    category: string;
    stock: number;
    featured: boolean;
    image: string;
}

const products: ProductData[] = [
    {
        name: 'Camisa Oxford Azul Marino',
        description: 'Camisa Oxford de algodon premium con cuello button-down. Corte slim fit, ideal para looks casuales o formales. Tejido resistente y suave al tacto.',
        price: 8900, // 89.00 EUR
        category: 'camisas',
        stock: 25,
        featured: true,
        image: 'camisa_oxford_azul',
    },
    {
        name: 'Camisa Lino Blanca',
        description: 'Camisa de lino 100% natural, perfecta para el verano. Transpirable, ligera y con acabado premium. Cuello italiano y botones de nacar.',
        price: 11900, // 119.00 EUR
        category: 'camisas',
        stock: 18,
        featured: true,
        image: 'camisa_lino_blanca',
    },
    {
        name: 'Pantalon Chino Arena',
        description: 'Pantalon chino de algodon con elastano para mayor comodidad. Corte regular, ideal para el dia a dia. Lavado suave para un tacto premium.',
        price: 7900, // 79.00 EUR
        category: 'pantalones',
        stock: 30,
        featured: false,
        image: 'pantalon_chino_beige',
    },
    {
        name: 'Traje Azul Marino Slim',
        description: 'Traje de dos piezas en lana fria italiana. Chaqueta de dos botones con solapas estrechas. Pantalon slim fit con pinzas. Perfecto para ocasiones formales.',
        price: 34900, // 349.00 EUR
        category: 'trajes',
        stock: 10,
        featured: true,
        image: 'traje_azul_marino',
    },
    {
        name: 'Polo Premium Negro',
        description: 'Polo de pique de algodon de alta calidad. Cuello y punos acanalados, logo bordado discreto. Corte slim fit que estiliza la figura.',
        price: 6900, // 69.00 EUR
        category: 'camisas',
        stock: 35,
        featured: false,
        image: 'polo_negro',
    },
    {
        name: 'Pantalon de Vestir Gris',
        description: 'Pantalon de vestir en lana mezclada. Corte slim con raya marcada. Ideal para combinar con blazers o usar en la oficina.',
        price: 9900, // 99.00 EUR
        category: 'pantalones',
        stock: 22,
        featured: true,
        image: 'pantalon_vestir_gris',
    },
];

async function getCategoryId(slug: string): Promise<string | null> {
    const { data } = await supabase
        .from('categories')
        .select('id')
        .eq('slug', slug)
        .single();
    return data?.id || null;
}

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

async function seedProducts() {
    console.log('Starting product seed...\n');

    for (const product of products) {
        try {
            // Create product in Stripe
            console.log(`Creating ${product.name} in Stripe...`);
            const stripeProduct = await stripe.products.create({
                name: product.name,
                description: product.description,
                metadata: {
                    category: product.category,
                },
            });

            // Create price in Stripe
            const stripePrice = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: product.price,
                currency: 'eur',
            });

            console.log(`  Stripe Product ID: ${stripeProduct.id}`);
            console.log(`  Stripe Price ID: ${stripePrice.id}`);

            // Get category ID
            const categoryId = await getCategoryId(product.category);

            // Create product in Supabase
            console.log(`Creating ${product.name} in Supabase...`);
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
                    images: [], // Images will need to be uploaded separately
                })
                .select()
                .single();

            if (error) {
                console.error(`  Error: ${error.message}`);
            } else {
                console.log(`  Supabase ID: ${data.id}`);
            }

            console.log('');
        } catch (err) {
            console.error(`Error creating ${product.name}:`, err);
        }
    }

    console.log('Seed complete!');
}

seedProducts();
