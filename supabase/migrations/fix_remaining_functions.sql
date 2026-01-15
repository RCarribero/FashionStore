-- =====================================================
-- FIX REMAINING 3 FUNCTIONS
-- Run this in Supabase SQL Editor
-- =====================================================

-- 1. Fix get_available_stock
DROP FUNCTION IF EXISTS public.get_available_stock(uuid, text);

CREATE FUNCTION public.get_available_stock(p_product_id uuid, p_size text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    base_stock integer;
    reserved_stock integer;
BEGIN
    SELECT stock INTO base_stock
    FROM public.product_variants
    WHERE product_id = p_product_id AND size = p_size;
    
    IF base_stock IS NULL THEN
        RETURN 0;
    END IF;
    
    SELECT COALESCE(SUM(quantity), 0) INTO reserved_stock
    FROM public.stock_reservations
    WHERE product_id = p_product_id 
      AND size = p_size 
      AND expires_at > NOW();
    
    RETURN GREATEST(0, base_stock - reserved_stock);
END;
$$;

-- 2. Fix is_user_admin  
DROP FUNCTION IF EXISTS public.is_user_admin();

CREATE FUNCTION public.is_user_admin()
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

-- 3. Fix use_coupon
DROP FUNCTION IF EXISTS public.use_coupon(text);

CREATE FUNCTION public.use_coupon(p_code text)
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

-- Verify functions have search_path set
SELECT proname, prosecdef, proconfig 
FROM pg_proc 
WHERE proname IN ('get_available_stock', 'is_user_admin', 'use_coupon')
  AND pronamespace = 'public'::regnamespace;
