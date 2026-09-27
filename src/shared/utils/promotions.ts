/**
 * Promotion utilities for server-side price calculations
 */
import { supabase as authSupabase } from '../../modules/auth';

function getSupabase() {
    return authSupabase;
}

interface ActivePromotion {
    id: string;
    code: string;
    public_title: string;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    applies_to: 'all' | 'specific';
    product_ids: string[];
}

/**
 * Fetches all currently active automatic promotions
 */
export async function getActivePromotions(): Promise<ActivePromotion[]> {
    const db = getSupabase();

    const { data: coupons, error } = await db
        .from('coupons')
        .select('*, coupon_products(product_id)')
        .eq('is_automatic', true)
        .eq('is_active', true);

    if (error || !coupons) {
        return [];
    }

    const currentDate = new Date();

    // Type assertion for coupons array
    const typedCoupons = coupons as Array<{
        id: string;
        code: string;
        public_title: string | null;
        discount_type: string;
        discount_value: number;
        applies_to: string | null;
        valid_from: string | null;
        valid_until: string | null;
        max_uses: number | null;
        uses_count: number;
        coupon_products: Array<{ product_id: string }> | null;
    }>;

    return typedCoupons
        .filter(coupon => {
            const validFrom = coupon.valid_from ? new Date(coupon.valid_from) : null;
            const validUntil = coupon.valid_until ? new Date(coupon.valid_until) : null;

            if (validFrom && validFrom > currentDate) return false;
            if (validUntil && validUntil < currentDate) return false;
            if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) return false;

            return true;
        })
        .map(coupon => ({
            id: coupon.id,
            code: coupon.code,
            public_title: coupon.public_title || 'Oferta',
            discount_type: coupon.discount_type as 'percentage' | 'fixed',
            discount_value: coupon.discount_value,
            applies_to: (coupon.applies_to || 'all') as 'all' | 'specific',
            product_ids: coupon.coupon_products?.map(cp => cp.product_id) || []
        }));
}

/**
 * Calculates the best discounted price for a product
 * Returns null if no promotion applies
 */
export function calculateDiscountedPrice(
    productId: string,
    originalPrice: number,
    promotions: ActivePromotion[]
): { discountedPrice: number; promotion: ActivePromotion } | null {
    let bestDiscount = 0;
    let bestPromotion: ActivePromotion | null = null;

    for (const promo of promotions) {
        // Check if promotion applies to this product
        if (promo.applies_to === 'specific' && !promo.product_ids.includes(productId)) {
            continue;
        }

        // Calculate discount
        let discount = 0;
        if (promo.discount_type === 'percentage') {
            discount = Math.round(originalPrice * promo.discount_value / 100);
        } else {
            discount = promo.discount_value;
        }

        // Cap at original price
        if (discount > originalPrice) discount = originalPrice;

        // Keep best
        if (discount > bestDiscount) {
            bestDiscount = discount;
            bestPromotion = promo;
        }
    }

    if (bestPromotion && bestDiscount > 0) {
        return {
            discountedPrice: originalPrice - bestDiscount,
            promotion: bestPromotion
        };
    }

    return null;
}

/**
 * Type for products with calculated discount info
 */
export interface ProductWithDiscount {
    id: string;
    name: string;
    slug: string;
    price: number;
    discountedPrice: number | null;
    promotionTitle: string | null;
    images: string[];
    stock: number;
    [key: string]: any; // Allow other product fields
}

/**
 * Enriches a list of products with discount information
 */
export async function enrichProductsWithDiscounts(
    products: any[]
): Promise<ProductWithDiscount[]> {
    const promotions = await getActivePromotions();

    return products.map(product => {
        const discountInfo = calculateDiscountedPrice(product.id, product.price, promotions);

        return {
            ...product,
            discountedPrice: discountInfo?.discountedPrice ?? null,
            promotionTitle: discountInfo?.promotion.public_title ?? null
        };
    });
}
