-- Seed product_variants with random stock
-- Run this in Supabase SQL Editor

DO $$
DECLARE
  prod RECORD;
  sizes TEXT[] := ARRAY['XS', 'S', 'M', 'L', 'XL', 'XXL'];
  sz TEXT;
BEGIN
  -- Iterate through all existing products
  FOR prod IN SELECT id FROM products LOOP
    -- For each size
    FOREACH sz IN ARRAY sizes LOOP
      -- Insert random stock between 1 and 20
      -- Use ON CONFLICT to avoid errors if run multiple times
      INSERT INTO product_variants (product_id, size, stock)
      VALUES (prod.id, sz, floor(random() * 20 + 1)::int)
      ON CONFLICT (product_id, size) DO UPDATE
      SET stock = EXCLUDED.stock; -- Ensure stock is updated/reset
    END LOOP;
  END LOOP;
END $$;
