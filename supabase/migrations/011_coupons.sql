-- Coupons and Promotions System
-- Allows admins to create discount codes

CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT NOT NULL UNIQUE,
    description TEXT,
    discount_type TEXT NOT NULL DEFAULT 'percentage', -- 'percentage' or 'fixed'
    discount_value INTEGER NOT NULL, -- percentage (0-100) or cents for fixed
    min_purchase INTEGER DEFAULT 0, -- minimum purchase amount in cents
    max_uses INTEGER, -- null = unlimited
    uses_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT valid_discount_type CHECK (discount_type IN ('percentage', 'fixed')),
    CONSTRAINT valid_percentage CHECK (
        (discount_type = 'percentage' AND discount_value >= 0 AND discount_value <= 100) OR
        (discount_type = 'fixed' AND discount_value >= 0)
    )
);

-- Index for code lookups
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active, valid_until);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Only service role can manage coupons
CREATE POLICY "Service role manages coupons"
    ON coupons
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Function to validate a coupon
CREATE OR REPLACE FUNCTION validate_coupon(coupon_code TEXT, purchase_amount INTEGER)
RETURNS TABLE (
    valid BOOLEAN,
    coupon_id UUID,
    discount_type TEXT,
    discount_value INTEGER,
    error_message TEXT
) AS $$
DECLARE
    c RECORD;
BEGIN
    SELECT * INTO c FROM coupons WHERE code = UPPER(coupon_code) LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, 'Cupon no encontrado'::TEXT;
        RETURN;
    END IF;
    
    IF NOT c.is_active THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, 'Cupon inactivo'::TEXT;
        RETURN;
    END IF;
    
    IF c.valid_from > NOW() THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, 'Cupon aun no valido'::TEXT;
        RETURN;
    END IF;
    
    IF c.valid_until IS NOT NULL AND c.valid_until < NOW() THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, 'Cupon expirado'::TEXT;
        RETURN;
    END IF;
    
    IF c.max_uses IS NOT NULL AND c.uses_count >= c.max_uses THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, 'Cupon agotado'::TEXT;
        RETURN;
    END IF;
    
    IF purchase_amount < c.min_purchase THEN
        RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT, NULL::INTEGER, 
            ('Compra minima: ' || (c.min_purchase / 100.0)::TEXT || ' EUR')::TEXT;
        RETURN;
    END IF;
    
    RETURN QUERY SELECT true, c.id, c.discount_type, c.discount_value, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to use a coupon (increment uses_count)
CREATE OR REPLACE FUNCTION use_coupon(coupon_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE coupons SET uses_count = uses_count + 1 WHERE id = coupon_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE coupons IS 'Discount coupons for promotions';
