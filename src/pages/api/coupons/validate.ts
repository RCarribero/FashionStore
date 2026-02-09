/**
 * Validate coupon code API
 * Used in checkout to verify and apply discount
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
        const { code, purchaseAmount, cartItems, userId } = await request.json();

        if (!code) {
            return new Response(JSON.stringify({
                valid: false,
                error: 'Codigo de cupon requerido'
            }), { status: 400 });
        }

        // Require authentication for all coupons
        if (!userId) {
            return new Response(JSON.stringify({
                valid: false,
                error: 'Debes iniciar sesion para usar cupones'
            }), { status: 200 });
        }

        // Get coupon with product associations
        const { data: coupon, error } = await supabase
            .from('coupons')
            .select('*, coupon_products(product_id)')
            .eq('code', code.toUpperCase())
            .single();

        if (error || !coupon) {
            return new Response(JSON.stringify({
                valid: false,
                error: 'Cupon no encontrado'
            }), { status: 200 });
        }

        // Validate coupon status
        if (!coupon.is_active) {
            return new Response(JSON.stringify({ valid: false, error: 'Cupon inactivo' }), { status: 200 });
        }

        // Special validation for BIENVENIDO coupon - first purchase only
        if (code.toUpperCase() === 'BIENVENIDO') {
            if (!userId) {
                return new Response(JSON.stringify({
                    valid: false,
                    error: 'Debes iniciar sesion para usar este cupon'
                }), { status: 200 });
            }

            // Check if user has made a purchase before
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('has_made_purchase')
                .eq('id', userId)
                .single();

            if (profile && profile.has_made_purchase === true) {
                return new Response(JSON.stringify({
                    valid: false,
                    error: 'Este cupon solo es valido para tu primera compra'
                }), { status: 200 });
            }
        }

        const now = new Date();
        if (coupon.valid_from && new Date(coupon.valid_from) > now) {
            return new Response(JSON.stringify({ valid: false, error: 'Cupon aun no valido' }), { status: 200 });
        }

        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
            return new Response(JSON.stringify({ valid: false, error: 'Cupon expirado' }), { status: 200 });
        }

        if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
            return new Response(JSON.stringify({ valid: false, error: 'Cupon agotado' }), { status: 200 });
        }

        if (purchaseAmount && coupon.min_purchase > purchaseAmount) {
            return new Response(JSON.stringify({
                valid: false,
                error: `Compra minima: ${(coupon.min_purchase / 100).toFixed(2)} EUR`
            }), { status: 200 });
        }

        // Calculate eligible amount based on product restrictions
        let eligibleAmount = purchaseAmount || 0;

        if (coupon.applies_to === 'specific') {
            const allowedProductIds = coupon.coupon_products?.map((cp: any) => cp.product_id) || [];

            if (cartItems && Array.isArray(cartItems)) {
                // Calculate total of only eligible items
                eligibleAmount = cartItems.reduce((total: number, item: any) => {
                    if (allowedProductIds.includes(item.productId)) {
                        return total + (item.price * item.quantity);
                    }
                    return total;
                }, 0);

                if (eligibleAmount === 0) {
                    return new Response(JSON.stringify({
                        valid: false,
                        error: 'Este cupon no aplica a los productos del carrito'
                    }), { status: 200 });
                }
            } else {
                // Fallback (should not happen with updated frontend)
                return new Response(JSON.stringify({
                    valid: false,
                    error: 'No se pudieron validar los productos'
                }), { status: 200 });
            }
        }

        // Calculate discount
        let discountAmount = 0;
        if (coupon.discount_type === 'percentage') {
            discountAmount = Math.round(eligibleAmount * coupon.discount_value / 100);
        } else {
            discountAmount = coupon.discount_value;
        }

        if (discountAmount > purchaseAmount) {
            discountAmount = purchaseAmount;
        }

        return new Response(JSON.stringify({
            valid: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                discount_type: coupon.discount_type,
                discount_value: coupon.discount_value,
                description: coupon.description,
                applies_to: coupon.applies_to
            },
            discountAmount
        }), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({
            valid: false,
            error: error.message
        }), { status: 500 });
    }
};
