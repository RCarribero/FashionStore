-- Add product-specific coupons support
-- Allows coupons to be restricted to specific products

-- Table to link coupons to specific products
CREATE TABLE IF NOT EXISTS coupon_products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coupon_id, product_id)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_coupon_products_coupon ON coupon_products(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_products_product ON coupon_products(product_id);

-- Enable RLS
ALTER TABLE coupon_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages coupon_products"
    ON coupon_products
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Add applies_to column to coupons table
ALTER TABLE coupons ADD COLUMN IF NOT EXISTS applies_to TEXT DEFAULT 'all';
-- 'all' = all products, 'specific' = only products in coupon_products table

COMMENT ON TABLE coupon_products IS 'Links coupons to specific products they apply to';
COMMENT ON COLUMN coupons.applies_to IS 'Whether coupon applies to all products or specific ones';
