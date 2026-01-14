/**
 * Products CRUD API
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

// Create product with variants
export const POST: APIRoute = async ({ request }) => {
    try {
        const { name, slug, description, price, category_id, images, stock, variants } = await request.json();

        // Create product
        const { data: product, error: productError } = await supabase
            .from('products')
            .insert({
                name,
                slug,
                description,
                price,
                category_id,
                images,
                stock
            })
            .select()
            .single();

        if (productError) {
            return new Response(JSON.stringify({ error: productError.message }), { status: 500 });
        }

        // Create variants
        if (variants && variants.length > 0) {
            const variantData = variants.map((v: { size: string; stock: number }) => ({
                product_id: product.id,
                size: v.size,
                stock: v.stock
            }));

            const { error: variantsError } = await supabase
                .from('product_variants')
                .insert(variantData);

            if (variantsError) {
                console.error('Error creating variants:', variantsError);
            }
        }

        return new Response(JSON.stringify(product), { status: 201 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
