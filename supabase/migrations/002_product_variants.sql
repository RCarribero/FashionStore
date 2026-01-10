-- Migration: Add product_variants table
-- Run this in Supabase SQL Editor

-- 1. Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  size TEXT NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  UNIQUE(product_id, size)
);

-- 2. Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Public read
CREATE POLICY "Public read product_variants"
  ON product_variants FOR SELECT
  USING (true);

-- Admin write
CREATE POLICY "Admin insert product_variants"
  ON product_variants FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin update product_variants"
  ON product_variants FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin delete product_variants"
  ON product_variants FOR DELETE
  TO authenticated
  USING (true);
