/**
 * Auto-apply best promotion API
 * Used to find the best automatic discount for the current cart
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
    try {
        const { purchaseAmount, cartItems } = await request.json();

        // fetch active automatic coupons
        const now = new Date().toISOString();

        // Supabase filter limitations mean we filter dates mostly in memory or precise query
        const { data: coupons, error } = await supabase
            .from('coupons')
            .select('*, coupon_products(product_id)')
            .eq('is_automatic', true)
            .eq('is_active', true);

        if (error || !coupons || coupons.length === 0) {
            return new Response(JSON.stringify({ valid: false }), { status: 200 });
        }

        let bestCoupon = null;
        let maxDiscount = -1;

        for (const coupon of coupons) {
            // Validate Dates
            const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
            const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;
            const currentDate = new Date();

            if (validFrom && validFrom > currentDate) continue;
            if (validUntil && validUntil < currentDate) continue;

            // Validate Limits
            if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) continue;

            // Validate Min Purchase
            if (purchaseAmount < (coupon.min_purchase || 0)) continue;

            // Calculate Eligible Amount
            let eligibleAmount = purchaseAmount || 0;
            if (coupon.applies_to === 'specific') {
                const allowedProductIds = coupon.coupon_products?.map((cp: any) => cp.product_id) || [];
                if (cartItems && Array.isArray(cartItems)) {
                    eligibleAmount = cartItems.reduce((total: number, item: any) => {
                        if (allowedProductIds.includes(item.productId)) {
                            return total + (item.price * item.quantity);
                        }
                        return total;
                    }, 0);
                } else {
                    eligibleAmount = 0; // Cannot validate specifics without items
                }
            }

            if (eligibleAmount <= 0) continue;

            // Calculate Discount
            let discount = 0;
            if (coupon.discount_type === 'percentage') {
                discount = Math.round(eligibleAmount * coupon.discount_value / 100);
            } else {
                discount = coupon.discount_value;
            }

            // Cap at total
            if (discount > purchaseAmount) discount = purchaseAmount;

            // Pick Best
            if (discount > maxDiscount) {
                maxDiscount = discount;
                bestCoupon = { ...coupon, calculatedDiscount: discount };
            }
        }

        if (bestCoupon && maxDiscount > 0) {
            return new Response(JSON.stringify({
                valid: true,
                coupon: {
                    id: bestCoupon.id,
                    code: bestCoupon.code,
                    public_title: bestCoupon.public_title, // Return to display
                    discount_type: bestCoupon.discount_type,
                    discount_value: bestCoupon.discount_value,
                    description: bestCoupon.description,
                    applies_to: bestCoupon.applies_to
                },
                discountAmount: maxDiscount
            }), { status: 200 });
        }

        return new Response(JSON.stringify({ valid: false }), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({
            valid: false,
            error: error.message
        }), { status: 500 });
    }
};
