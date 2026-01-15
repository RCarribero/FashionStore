-- =====================================================
-- FIX SUPABASE SECURITY WARNINGS
-- Run this in Supabase SQL Editor
-- =====================================================

-- =====================================================
-- 1. FIX FUNCTION SEARCH_PATH (Security Fix)
-- Drop existing functions first to avoid conflicts
-- Using CASCADE for functions with trigger dependencies
-- =====================================================

DROP FUNCTION IF EXISTS public.get_available_stock(uuid, text);
DROP FUNCTION IF EXISTS public.generate_tracking_number() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_user_admin();
DROP FUNCTION IF EXISTS public.validate_coupon(text, integer);
DROP FUNCTION IF EXISTS public.use_coupon(text);

-- Fix: get_available_stock
CREATE OR REPLACE FUNCTION public.get_available_stock(p_product_id uuid, p_size text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    base_stock integer;
    reserved_stock integer;
BEGIN
    -- Get base stock from product_variants
    SELECT stock INTO base_stock
    FROM public.product_variants
    WHERE product_id = p_product_id AND size = p_size;
    
    IF base_stock IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Get reserved stock (unexpired reservations from other sessions)
    SELECT COALESCE(SUM(quantity), 0) INTO reserved_stock
    FROM public.stock_reservations
    WHERE product_id = p_product_id 
      AND size = p_size 
      AND expires_at > NOW();
    
    RETURN GREATEST(0, base_stock - reserved_stock);
END;
$$;

-- Fix: generate_tracking_number
CREATE OR REPLACE FUNCTION public.generate_tracking_number()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.tracking_number := 'FM' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEW.order_number::text, 6, '0');
    RETURN NEW;
END;
$$;

-- Fix: handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, is_admin, has_made_purchase)
    VALUES (NEW.id, false, false)
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$;

-- Fix: handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- Fix: is_user_admin
CREATE OR REPLACE FUNCTION public.is_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$;

-- Fix: validate_coupon
CREATE OR REPLACE FUNCTION public.validate_coupon(p_code text, p_purchase_amount integer)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_coupon record;
    v_discount integer;
BEGIN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE UPPER(code) = UPPER(p_code)
      AND is_active = true
      AND (valid_from IS NULL OR valid_from <= NOW())
      AND (valid_until IS NULL OR valid_until >= NOW())
      AND (uses_count < max_uses OR max_uses IS NULL);
    
    IF v_coupon IS NULL THEN
        RETURN json_build_object('valid', false, 'error', 'Cupon no valido o expirado');
    END IF;
    
    IF v_coupon.minimum_purchase IS NOT NULL AND p_purchase_amount < v_coupon.minimum_purchase THEN
        RETURN json_build_object('valid', false, 'error', 'Compra minima no alcanzada');
    END IF;
    
    IF v_coupon.discount_type = 'percentage' THEN
        v_discount := (p_purchase_amount * v_coupon.discount_value / 100);
    ELSE
        v_discount := v_coupon.discount_value;
    END IF;
    
    RETURN json_build_object(
        'valid', true,
        'coupon', row_to_json(v_coupon),
        'discountAmount', v_discount
    );
END;
$$;

-- Fix: use_coupon
CREATE OR REPLACE FUNCTION public.use_coupon(p_code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    UPDATE public.coupons
    SET uses_count = uses_count + 1
    WHERE UPPER(code) = UPPER(p_code);
    
    RETURN FOUND;
END;
$$;

-- =====================================================
-- 2. FIX ADMIN RLS POLICIES (Use is_user_admin() check)
-- =====================================================

-- Drop and recreate categories admin policies
DROP POLICY IF EXISTS "Admin delete categories" ON public.categories;
DROP POLICY IF EXISTS "Admin insert categories" ON public.categories;
DROP POLICY IF EXISTS "Admin update categories" ON public.categories;

CREATE POLICY "Admin delete categories" ON public.categories
    FOR DELETE TO authenticated
    USING (public.is_user_admin());

CREATE POLICY "Admin insert categories" ON public.categories
    FOR INSERT TO authenticated
    WITH CHECK (public.is_user_admin());

CREATE POLICY "Admin update categories" ON public.categories
    FOR UPDATE TO authenticated
    USING (public.is_user_admin())
    WITH CHECK (public.is_user_admin());

-- Drop and recreate products admin policies
DROP POLICY IF EXISTS "Admin delete products" ON public.products;
DROP POLICY IF EXISTS "Admin insert products" ON public.products;
DROP POLICY IF EXISTS "Admin update products" ON public.products;

CREATE POLICY "Admin delete products" ON public.products
    FOR DELETE TO authenticated
    USING (public.is_user_admin());

CREATE POLICY "Admin insert products" ON public.products
    FOR INSERT TO authenticated
    WITH CHECK (public.is_user_admin());

CREATE POLICY "Admin update products" ON public.products
    FOR UPDATE TO authenticated
    USING (public.is_user_admin())
    WITH CHECK (public.is_user_admin());

-- Drop and recreate product_variants admin policies
DROP POLICY IF EXISTS "Admin delete product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admin insert product_variants" ON public.product_variants;
DROP POLICY IF EXISTS "Admin update product_variants" ON public.product_variants;

CREATE POLICY "Admin delete product_variants" ON public.product_variants
    FOR DELETE TO authenticated
    USING (public.is_user_admin());

CREATE POLICY "Admin insert product_variants" ON public.product_variants
    FOR INSERT TO authenticated
    WITH CHECK (public.is_user_admin());

CREATE POLICY "Admin update product_variants" ON public.product_variants
    FOR UPDATE TO authenticated
    USING (public.is_user_admin())
    WITH CHECK (public.is_user_admin());

-- =====================================================
-- NOTE: Service role policies (coupons, orders, etc.)
-- are intentionally permissive since they're accessed
-- only from the backend with service_role key.
-- =====================================================

-- =====================================================
-- 3. RECREATE TRIGGERS (dropped by CASCADE)
-- =====================================================

-- Trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Trigger for tracking number generation
DROP TRIGGER IF EXISTS set_tracking_number ON public.orders;
CREATE TRIGGER set_tracking_number
    BEFORE INSERT ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_tracking_number();

-- Trigger for updated_at on products
DROP TRIGGER IF EXISTS handle_products_updated_at ON public.products;
CREATE TRIGGER handle_products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Trigger for updated_at on user_profiles
DROP TRIGGER IF EXISTS handle_user_profiles_updated_at ON public.user_profiles;
CREATE TRIGGER handle_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 4. LEAKED PASSWORD PROTECTION
-- Enable in: Dashboard > Authentication > Settings > Password Security
-- Toggle: "Check passwords against HaveIBeenPwned.org"
-- =====================================================
