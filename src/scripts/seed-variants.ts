
import { createAdminClient } from '../modules/auth/services/auth.service';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

async function seedVariants() {
    const supabase = createAdminClient();

    console.log('Fetching products...');
    const { data: products, error } = await supabase.from('products').select('id, name');

    if (error) {
        console.error('Error fetching products:', error);
        return;
    }

    console.log(`Found ${products.length} products. Generating variants...`);

    const variants = [];

    for (const product of products) {
        // Randomly skip some sizes for realism
        const productSizes = SIZES.filter(() => Math.random() > 0.2);

        for (const size of productSizes) {
            variants.push({
                product_id: product.id,
                size: size,
                stock: Math.floor(Math.random() * 20) + 1, // 1-20 units
            });
        }
    }

    console.log(`Inserting ${variants.length} variants...`);

    const { error: insertError } = await supabase
        .from('product_variants')
        .upsert(variants, { onConflict: 'product_id, size' });

    if (insertError) {
        console.error('Error seeding variants:', insertError);
    } else {
        console.log('Success! Variants seeded.');
    }
}

seedVariants();
