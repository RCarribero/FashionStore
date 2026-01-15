
-- Remove UNIQUE constraint from key column in home_sections
ALTER TABLE public.home_sections DROP CONSTRAINT IF EXISTS home_sections_key_key;
