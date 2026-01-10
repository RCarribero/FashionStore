
import type { APIRoute } from 'astro';
import { createAdminClient } from '../../modules/auth/services/auth.service';

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

export const GET: APIRoute = async () => {
    const supabase = createAdminClient();

    // 1. Fetch products
    const { data: products, error } = await supabase.from('products').select('id, name');

    if (error) {
        return new Response(JSON.stringify({ error }), { status: 500 });
    }

    const variants = [];

    // 2. Generate variants
    for (const product of products) {
        // Randomly skip some sizes
        const productSizes = SIZES.filter(() => Math.random() > 0.2);

        for (const size of productSizes) {
            variants.push({
                product_id: product.id,
                size: size,
                stock: Math.floor(Math.random() * 20) + 1,
            });
        }
    }

    // 3. Upsert variants
    const { error: insertError } = await supabase
        .from('product_variants')
        .upsert(variants, { onConflict: 'product_id, size' });

    if (insertError) {
        return new Response(JSON.stringify({ error: insertError }), { status: 500 });
    }

    return new Response(JSON.stringify({
        success: true,
        message: `Seeded ${variants.length} variants for ${products.length} products`
    }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
};
