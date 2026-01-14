-- Add coupon_code column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_code TEXT;

COMMENT ON COLUMN orders.coupon_code IS 'Code of the coupon applied to this order';
