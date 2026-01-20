
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const SIZE_MAPPING: Record<string, string> = {
    'XS': '39',
    'S': '40',
    'M': '41',
    'L': '42',
    'XL': '43',
    'XXL': '44'
};

async function fixShoeSizes() {
    console.log('Starting shoe size fix...');

    // 1. Get "zapatillas" category ID (or similar)
    const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .ilike('slug', '%zapatillas%');

    if (!categories || categories.length === 0) {
        console.log('No "zapatillas" category found.');
        return;
    }

    const categoryIds = categories.map(c => c.id);

    // 2. Get products in those categories
    const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('category_id', categoryIds);

    if (!products || products.length === 0) {
        console.log('No products found in footwear categories.');
        return;
    }

    console.log(`Found ${products.length} footwear products to check.`);

    // 3. Update variants for each product
    for (const product of products) {
        const { data: variants } = await supabase
            .from('product_variants')
            .select('id, size')
            .eq('product_id', product.id);

        if (!variants) continue;

        for (const variant of variants) {
            const newSize = SIZE_MAPPING[variant.size];
            if (newSize) {
                console.log(`Updating ${product.name}: ${variant.size} -> ${newSize}`);
                const { error } = await supabase
                    .from('product_variants')
                    .update({ size: newSize })
                    .eq('id', variant.id);

                if (error) {
                    console.error(`Failed to update variant ${variant.id}:`, error);
                }
            }
        }
    }
    console.log('Shoe size fix completed.');
}

fixShoeSizes().catch(console.error);
