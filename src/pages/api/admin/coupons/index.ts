/**
 * Coupons CRUD API
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

// Create coupon
export const POST: APIRoute = async ({ request }) => {
    try {
        const { product_ids, ...couponData } = await request.json();

        const { data: coupon, error } = await supabase
            .from('coupons')
            .insert(couponData)
            .select()
            .single();

        if (error) {
            console.error('Coupon creation error:', error);
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        // Add product associations if applies_to is specific
        if (couponData.applies_to === 'specific' && product_ids?.length > 0) {
            const productLinks = product_ids.map((productId: string) => ({
                coupon_id: coupon.id,
                product_id: productId
            }));

            const { error: linkError } = await supabase
                .from('coupon_products')
                .insert(productLinks);

            if (linkError) {
                console.error('Product link error:', linkError);
            }
        }

        return new Response(JSON.stringify(coupon), { status: 201 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
