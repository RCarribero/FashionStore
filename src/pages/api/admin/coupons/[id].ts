/**
 * Coupon CRUD by ID
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

// Update coupon
export const PUT: APIRoute = async ({ params, request }) => {
    try {
        const { id } = params;
        const { product_ids, ...couponData } = await request.json();

        const { data: coupon, error } = await supabase
            .from('coupons')
            .update(couponData)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        // Update product associations if applies_to is provided
        if (couponData.applies_to !== undefined) {
            // Delete existing associations
            await supabase.from('coupon_products').delete().eq('coupon_id', id);

            // Add new associations if specific
            if (couponData.applies_to === 'specific' && product_ids?.length > 0) {
                const productLinks = product_ids.map((productId: string) => ({
                    coupon_id: id,
                    product_id: productId
                }));

                await supabase.from('coupon_products').insert(productLinks);
            }
        }

        return new Response(JSON.stringify(coupon), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};

// Delete coupon
export const DELETE: APIRoute = async ({ params }) => {
    try {
        const { id } = params;

        // First delete associated products (foreign key constraint)
        await supabase
            .from('coupon_products')
            .delete()
            .eq('coupon_id', id);

        const { error } = await supabase
            .from('coupons')
            .delete()
            .eq('id', id);

        if (error) {
            return new Response(JSON.stringify({ error: error.message }), { status: 500 });
        }

        return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }
};
