-- FashionMarket Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Products table
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  price INTEGER NOT NULL,  -- Price in cents (e.g., 9999 = 99.99 EUR)
  stock INTEGER NOT NULL DEFAULT 0,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  images TEXT[] DEFAULT '{}',  -- Array of Storage URLs
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for faster lookups
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_featured ON products(featured) WHERE featured = true;

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS on tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ: Anyone can view categories and products
CREATE POLICY "Public read categories"
  ON categories FOR SELECT
  USING (true);

CREATE POLICY "Public read products"
  ON products FOR SELECT
  USING (true);

-- ADMIN WRITE: Only authenticated users can modify products
CREATE POLICY "Admin insert products"
  ON products FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin update products"
  ON products FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin delete products"
  ON products FOR DELETE
  TO authenticated
  USING (true);

-- ADMIN WRITE: Only authenticated users can modify categories
CREATE POLICY "Admin insert categories"
  ON categories FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Admin update categories"
  ON categories FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin delete categories"
  ON categories FOR DELETE
  TO authenticated
  USING (true);

-- ============================================
-- INITIAL DATA
-- ============================================

INSERT INTO categories (name, slug) VALUES
  ('Camisas', 'camisas'),
  ('Pantalones', 'pantalones'),
  ('Trajes', 'trajes');

-- ============================================
-- STORAGE BUCKET POLICIES (run separately in Storage > Policies)
-- ============================================
-- 
-- Bucket name: product-images
-- Set bucket to PUBLIC for read access
--
-- Policy 1: Public read images
-- CREATE POLICY "Public read images"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'product-images');
--
-- Policy 2: Admin upload images
-- CREATE POLICY "Admin upload images"
--   ON storage.objects FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'product-images');
--
-- Policy 3: Admin delete images
-- CREATE POLICY "Admin delete images"
--   ON storage.objects FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'product-images');
