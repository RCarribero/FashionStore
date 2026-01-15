/**
 * Validate multiple coupon codes and return the best one
 * Accepts an array of codes and returns the one with highest discount
 */
import type { APIRoute } from 'astro';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.PUBLIC_SUPABASE_URL,
    import.meta.env.SUPABASE_SERVICE_ROLE_KEY
);

export const prerender = false;

interface CartItem {
    productId: string;
    price: number;
    quantity: number;
}

interface CouponResult {
    code: string;
    valid: boolean;
    error?: string;
    discountAmount: number;
    coupon?: any;
}

async function validateSingleCoupon(
    code: string,
    purchaseAmount: number,
    cartItems: CartItem[],
    userId?: string
): Promise<CouponResult> {
    // Get coupon with product associations
    const { data: coupon, error } = await supabase
        .from('coupons')
        .select('*, coupon_products(product_id)')
        .eq('code', code.toUpperCase())
        .single();

    if (error || !coupon) {
        return { code, valid: false, error: 'Cupon no encontrado', discountAmount: 0 };
    }

    // Validate coupon status
    if (!coupon.is_active) {
        return { code, valid: false, error: 'Cupon inactivo', discountAmount: 0 };
    }

    // Special validation for BIENVENIDO coupon - first purchase only
    if (code.toUpperCase() === 'BIENVENIDO') {
        if (!userId) {
            return { code, valid: false, error: 'Debes iniciar sesion para usar este cupon', discountAmount: 0 };
        }

        const { data: profile } = await supabase
            .from('user_profiles')
            .select('has_made_purchase')
            .eq('id', userId)
            .single();

        if (profile && profile.has_made_purchase === true) {
            return { code, valid: false, error: 'Este cupon solo es valido para tu primera compra', discountAmount: 0 };
        }
    }

    const now = new Date();
    if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        return { code, valid: false, error: 'Cupon aun no valido', discountAmount: 0 };
    }

    if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        return { code, valid: false, error: 'Cupon expirado', discountAmount: 0 };
    }

    if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
        return { code, valid: false, error: 'Cupon agotado', discountAmount: 0 };
    }

    if (coupon.min_purchase > purchaseAmount) {
        return {
            code,
            valid: false,
            error: `Compra minima: ${(coupon.min_purchase / 100).toFixed(2)} EUR`,
            discountAmount: 0
        };
    }

    // Calculate eligible amount based on product restrictions
    let eligibleAmount = purchaseAmount;

    if (coupon.applies_to === 'specific') {
        const allowedProductIds = coupon.coupon_products?.map((cp: any) => cp.product_id) || [];

        eligibleAmount = cartItems.reduce((total: number, item: CartItem) => {
            if (allowedProductIds.includes(item.productId)) {
                return total + (item.price * item.quantity);
            }
            return total;
        }, 0);

        if (eligibleAmount === 0) {
            return {
                code,
                valid: false,
                error: 'Cupon no aplica a productos del carrito',
                discountAmount: 0
            };
        }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
        discountAmount = Math.round(eligibleAmount * coupon.discount_value / 100);
    } else {
        discountAmount = coupon.discount_value;
    }

    // Cap discount at total
    if (discountAmount > purchaseAmount) {
        discountAmount = purchaseAmount;
    }

    return {
        code,
        valid: true,
        discountAmount,
        coupon: {
            id: coupon.id,
            code: coupon.code,
            discount_type: coupon.discount_type,
            discount_value: coupon.discount_value,
            description: coupon.description,
            applies_to: coupon.applies_to
        }
    };
}

export const POST: APIRoute = async ({ request }) => {
    try {
        const { codes, purchaseAmount, cartItems, userId } = await request.json();

        if (!codes || !Array.isArray(codes) || codes.length === 0) {
            return new Response(JSON.stringify({
                valid: false,
                error: 'Se requiere al menos un codigo de cupon',
                results: []
            }), { status: 400 });
        }

        // Validate each coupon
        const results: CouponResult[] = await Promise.all(
            codes.map((code: string) =>
                validateSingleCoupon(code.trim(), purchaseAmount || 0, cartItems || [], userId)
            )
        );

        // Filter valid coupons
        const validCoupons = results.filter(r => r.valid);

        if (validCoupons.length === 0) {
            // Return all errors for feedback
            return new Response(JSON.stringify({
                valid: false,
                error: results.map(r => `${r.code}: ${r.error}`).join(', '),
                results,
                bestCoupon: null
            }), { status: 200 });
        }

        // Find the best coupon (highest discount)
        const bestCoupon = validCoupons.reduce((best, current) =>
            current.discountAmount > best.discountAmount ? current : best
        );

        return new Response(JSON.stringify({
            valid: true,
            results,
            bestCoupon: {
                code: bestCoupon.code,
                coupon: bestCoupon.coupon,
                discountAmount: bestCoupon.discountAmount
            },
            // For compatibility with existing code
            coupon: bestCoupon.coupon,
            discountAmount: bestCoupon.discountAmount
        }), { status: 200 });

    } catch (error: any) {
        return new Response(JSON.stringify({
            valid: false,
            error: error.message
        }), { status: 500 });
    }
};
