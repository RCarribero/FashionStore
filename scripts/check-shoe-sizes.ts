
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

async function checkShoeSizes() {
    console.log('Checking footwear products...');

    // 1. Get "zapatillas" category ID (or similar)
    const { data: categories } = await supabase
        .from('categories')
        .select('id, name, slug')
        .ilike('slug', '%zapatillas%');

    if (!categories || categories.length === 0) {
        console.log('No "zapatillas" category found.');
        return;
    }

    const categoryIds = categories.map(c => c.id);
    console.log('Categories found:', categories.map(c => `${c.name} (${c.slug})`).join(', '));

    // 2. Get products in those categories
    const { data: products } = await supabase
        .from('products')
        .select('id, name')
        .in('category_id', categoryIds);

    if (!products || products.length === 0) {
        console.log('No products found in footwear categories.');
        return;
    }

    console.log(`Found ${products.length} footwear products.`);

    // 3. Check variants for each product
    for (const product of products) {
        const { data: variants } = await supabase
            .from('product_variants')
            .select('id, size, stock')
            .eq('product_id', product.id);

        if (!variants) continue;

        const sizes = variants.map(v => v.size).join(', ');
        const hasLetterSizes = variants.some(v => !/^\d+$/.test(v.size));

        if (hasLetterSizes) {
            console.log(`[FIX NEEDED] Product "${product.name}" has invalid sizes: ${sizes}`);
        } else {
            console.log(`[OK] Product "${product.name}" has numeric sizes: ${sizes}`);
        }
    }
}

checkShoeSizes().catch(console.error);
