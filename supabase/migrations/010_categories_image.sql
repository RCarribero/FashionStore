-- Add image column to categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS image TEXT;

COMMENT ON COLUMN categories.image IS 'URL of the category image';
