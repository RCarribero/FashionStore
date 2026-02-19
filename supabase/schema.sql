--
-- PostgreSQL database dump
--

-- \restrict YpyAyC7Vh0cRriLwB1Iqc9qZsPqkrfGFH12PZ4IVUg25004zcWlnGFEBunTcJv0

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
-- SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: SCHEMA "public"; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA "public" IS 'standard public schema';


--
-- Name: pg_graphql; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";


--
-- Name: EXTENSION "pg_graphql"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "pg_graphql" IS 'pg_graphql: GraphQL support';


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pg_stat_statements"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "pg_stat_statements" IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "pgcrypto"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "pgcrypto" IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";


--
-- Name: EXTENSION "supabase_vault"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "supabase_vault" IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

-- COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: cancel_order("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."cancel_order"("p_order_id" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    SET "row_security" TO 'off'
    AS $$
DECLARE
  v_user_id uuid;
  v_order record;
  v_item jsonb;
  v_product_id uuid;
  v_size text;
  v_qty integer;
  v_variant record;
  v_stock_restored integer := 0;
  v_return_id uuid;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'No autenticado';
  END IF;

  SELECT *
  INTO v_order
  FROM public.orders
  WHERE id = p_order_id
    AND user_id = v_user_id
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pedido no encontrado';
  END IF;

  IF v_order.shipping_status IN ('shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled')
     OR v_order.status IN ('shipped', 'in_transit', 'out_for_delivery', 'delivered', 'cancelled') THEN
    RAISE EXCEPTION 'Este pedido ya no puede ser cancelado porque ya ha sido enviado';
  END IF;

  IF v_order.status NOT IN ('paid', 'processing', 'pending')
     AND v_order.shipping_status NOT IN ('paid', 'processing', 'pending') THEN
    RAISE EXCEPTION 'El estado actual del pedido no permite cancelacion';
  END IF;

  -- Restore stock based on order items jsonb
  IF v_order.items IS NOT NULL THEN
    FOR v_item IN
      SELECT value
      FROM jsonb_array_elements(v_order.items)
    LOOP
      v_product_id := NULLIF(v_item->>'productId', '')::uuid;
      v_size := NULLIF(v_item->>'size', '');
      v_qty := COALESCE(NULLIF(v_item->>'quantity', '')::int, 0);

      IF v_product_id IS NULL OR v_size IS NULL OR v_qty <= 0 THEN
        CONTINUE;
      END IF;

      SELECT id, stock
      INTO v_variant
      FROM public.product_variants
      WHERE product_id = v_product_id
        AND size = v_size
      LIMIT 1;

      IF NOT FOUND THEN
        CONTINUE;
      END IF;

      UPDATE public.product_variants
      SET stock = COALESCE(stock, 0) + v_qty
      WHERE id = v_variant.id;

      v_stock_restored := v_stock_restored + 1;
    END LOOP;
  END IF;

  -- Create a return request entry
  INSERT INTO public.returns (
    order_id,
    user_id,
    reason,
    details,
    status,
    created_at
  ) VALUES (
    p_order_id,
    v_user_id,
    'cancelled_by_user',
    'Pedido cancelado por el usuario antes del envío',
    'pending',
    now()
  )
  RETURNING id INTO v_return_id;

  -- Update order status
  UPDATE public.orders
  SET status = 'cancelled',
      shipping_status = 'cancelled',
      cancelled_at = now()
  WHERE id = p_order_id
    AND user_id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Pedido cancelado correctamente. El stock ha sido restaurado y se ha creado una solicitud de devolución.',
    'stockRestored', v_stock_restored,
    'returnId', v_return_id
  );
END;
$$;


ALTER FUNCTION "public"."cancel_order"("p_order_id" "uuid") OWNER TO "postgres";

--
-- Name: generate_tracking_number(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."generate_tracking_number"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    NEW.tracking_number := 'FM' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(NEW.order_number::text, 6, '0');
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."generate_tracking_number"() OWNER TO "postgres";

--
-- Name: get_available_stock("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_available_stock"("p_variant_id" "uuid") RETURNS integer
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    actual_stock INTEGER;
    reserved_qty INTEGER;
BEGIN
    -- Get actual stock
    SELECT stock INTO actual_stock FROM product_variants WHERE id = p_variant_id;
    
    -- Get sum of active reservations
    SELECT COALESCE(SUM(quantity), 0) INTO reserved_qty 
    FROM stock_reservations 
    WHERE variant_id = p_variant_id AND expires_at > NOW();
    
    RETURN GREATEST(0, actual_stock - reserved_qty);
END;
$$;


ALTER FUNCTION "public"."get_available_stock"("p_variant_id" "uuid") OWNER TO "postgres";

--
-- Name: get_available_stock("uuid", "text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."get_available_stock"("p_product_id" "uuid", "p_size" "text") RETURNS integer
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."get_available_stock"("p_product_id" "uuid", "p_size" "text") OWNER TO "postgres";

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
begin
  insert into public.user_profiles (id, is_admin)
  values (new.id, false);
  return new;
end;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";

--
-- Name: handle_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."handle_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_updated_at"() OWNER TO "postgres";

--
-- Name: is_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_profiles
    WHERE id = auth.uid()
    AND is_admin = true
  );
END;
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";

--
-- Name: is_user_admin(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_user_admin"() RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_profiles
        WHERE id = auth.uid() AND is_admin = true
    );
END;
$$;


ALTER FUNCTION "public"."is_user_admin"() OWNER TO "postgres";

--
-- Name: is_user_admin("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."is_user_admin"("user_id" "uuid") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
    admin_status BOOLEAN;
BEGIN
    SELECT is_admin INTO admin_status
    FROM user_profiles
    WHERE id = user_id;
    
    RETURN COALESCE(admin_status, false);
END;
$$;


ALTER FUNCTION "public"."is_user_admin"("user_id" "uuid") OWNER TO "postgres";

--
-- Name: use_coupon("text"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."use_coupon"("p_code" "text") RETURNS boolean
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
    AS $$
BEGIN
    UPDATE public.coupons
    SET uses_count = uses_count + 1
    WHERE UPPER(code) = UPPER(p_code);
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION "public"."use_coupon"("p_code" "text") OWNER TO "postgres";

--
-- Name: use_coupon("uuid"); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."use_coupon"("coupon_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    UPDATE coupons SET uses_count = uses_count + 1 WHERE id = coupon_id;
END;
$$;


ALTER FUNCTION "public"."use_coupon"("coupon_id" "uuid") OWNER TO "postgres";

--
-- Name: validate_coupon("text", integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION "public"."validate_coupon"("p_code" "text", "p_purchase_amount" integer) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO ''
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


ALTER FUNCTION "public"."validate_coupon"("p_code" "text", "p_purchase_amount" integer) OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: app_config; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."app_config" (
    "id" integer DEFAULT 1 NOT NULL,
    "offers_enabled" boolean DEFAULT true,
    "banner_text" "text",
    "banner_image_url" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "app_config_id_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."app_config" OWNER TO "postgres";

--
-- Name: articles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."articles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "excerpt" "text",
    "content" "jsonb" DEFAULT '[]'::"jsonb",
    "cover_image" "text",
    "published_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."articles" OWNER TO "postgres";

--
-- Name: categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."categories" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "image" "text"
);


ALTER TABLE "public"."categories" OWNER TO "postgres";

--
-- Name: coupon_products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."coupon_products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "coupon_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."coupon_products" OWNER TO "postgres";

--
-- Name: TABLE "coupon_products"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."coupon_products" IS 'Links coupons to specific products they apply to';


--
-- Name: coupons; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."coupons" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "description" "text",
    "discount_type" "text" DEFAULT 'percentage'::"text" NOT NULL,
    "discount_value" integer NOT NULL,
    "min_purchase" integer DEFAULT 0,
    "max_uses" integer,
    "uses_count" integer DEFAULT 0,
    "valid_from" timestamp with time zone DEFAULT "now"(),
    "valid_until" timestamp with time zone,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "applies_to" "text" DEFAULT 'all'::"text",
    "is_automatic" boolean DEFAULT false,
    "public_title" "text",
    CONSTRAINT "valid_discount_type" CHECK (("discount_type" = ANY (ARRAY['percentage'::"text", 'fixed'::"text"]))),
    CONSTRAINT "valid_percentage" CHECK (((("discount_type" = 'percentage'::"text") AND ("discount_value" >= 0) AND ("discount_value" <= 100)) OR (("discount_type" = 'fixed'::"text") AND ("discount_value" >= 0))))
);


ALTER TABLE "public"."coupons" OWNER TO "postgres";

--
-- Name: TABLE "coupons"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."coupons" IS 'Discount coupons for promotions';


--
-- Name: COLUMN "coupons"."applies_to"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."coupons"."applies_to" IS 'Whether coupon applies to all products or specific ones';


--
-- Name: COLUMN "coupons"."is_automatic"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."coupons"."is_automatic" IS 'If true, this coupon applies automatically without user input';


--
-- Name: COLUMN "coupons"."public_title"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."coupons"."public_title" IS 'Display title for automatic promotions (e.g., "Summer Sale")';


--
-- Name: home_sections; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."home_sections" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "key" "text" NOT NULL,
    "label" "text" NOT NULL,
    "order_index" integer DEFAULT 0 NOT NULL,
    "is_visible" boolean DEFAULT true,
    "component_config" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."home_sections" OWNER TO "postgres";

--
-- Name: newsletter_subscribers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."newsletter_subscribers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."newsletter_subscribers" OWNER TO "postgres";

--
-- Name: orders; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "stripe_session_id" "text" NOT NULL,
    "status" "text" DEFAULT 'completed'::"text",
    "total_amount" integer NOT NULL,
    "discount_amount" integer DEFAULT 0,
    "shipping_amount" integer DEFAULT 0,
    "items" "jsonb" NOT NULL,
    "shipping_address" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "shipping_status" "text" DEFAULT 'processing'::"text",
    "tracking_number" "text",
    "estimated_delivery" timestamp with time zone,
    "shipped_at" timestamp with time zone,
    "delivered_at" timestamp with time zone,
    "coupon_code" "text",
    "order_number" bigint NOT NULL,
    "guest_email" "text",
    "review_email_sent_at" timestamp with time zone
);


ALTER TABLE "public"."orders" OWNER TO "postgres";

--
-- Name: TABLE "orders"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."orders" IS 'User orders from successful Stripe payments';


--
-- Name: COLUMN "orders"."items"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."items" IS 'JSON array of ordered items with productId, name, size, quantity, price';


--
-- Name: COLUMN "orders"."shipping_status"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."shipping_status" IS 'Current shipping status: processing, shipped, in_transit, out_for_delivery, delivered';


--
-- Name: COLUMN "orders"."coupon_code"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."coupon_code" IS 'Code of the coupon applied to this order';


--
-- Name: COLUMN "orders"."order_number"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."orders"."order_number" IS 'Human-readable incremental order ID';


--
-- Name: orders_order_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE "public"."orders" ALTER COLUMN "order_number" ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME "public"."orders_order_number_seq"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: password_recovery_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."password_recovery_tokens" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "token" "text" NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."password_recovery_tokens" OWNER TO "postgres";

--
-- Name: TABLE "password_recovery_tokens"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."password_recovery_tokens" IS 'Stores password recovery tokens for custom email flow';


--
-- Name: product_variants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."product_variants" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "product_id" "uuid",
    "size" "text" NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL
);


ALTER TABLE "public"."product_variants" OWNER TO "postgres";

--
-- Name: products; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "name" "text" NOT NULL,
    "slug" "text" NOT NULL,
    "description" "text",
    "price" integer NOT NULL,
    "stock" integer DEFAULT 0 NOT NULL,
    "category_id" "uuid",
    "images" "text"[] DEFAULT '{}'::"text"[],
    "featured" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";

--
-- Name: returns; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."returns" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "reason" "text" NOT NULL,
    "details" "text",
    "images" "text"[],
    "status" "text" DEFAULT 'pending'::"text",
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    CONSTRAINT "returns_status_check" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'rejected'::"text", 'completed'::"text"])))
);


ALTER TABLE "public"."returns" OWNER TO "postgres";

--
-- Name: shipment_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."shipment_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "order_id" "uuid",
    "status" "text" NOT NULL,
    "location" "text",
    "description" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shipment_events" OWNER TO "postgres";

--
-- Name: TABLE "shipment_events"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."shipment_events" IS 'Tracking history for order shipments';


--
-- Name: stock_reservations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."stock_reservations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "session_id" "text" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "variant_id" "uuid" NOT NULL,
    "size" "text" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."stock_reservations" OWNER TO "postgres";

--
-- Name: user_addresses; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_addresses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "line1" "text" NOT NULL,
    "line2" "text",
    "city" "text" NOT NULL,
    "postal_code" "text" NOT NULL,
    "country" "text" NOT NULL,
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."user_addresses" OWNER TO "postgres";

--
-- Name: TABLE "user_addresses"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."user_addresses" IS 'User saved delivery addresses';


--
-- Name: user_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."user_profiles" (
    "id" "uuid" NOT NULL,
    "has_made_purchase" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "first_name" "text",
    "last_name" "text",
    "phone" "text",
    "is_admin" boolean DEFAULT false
);


ALTER TABLE "public"."user_profiles" OWNER TO "postgres";

--
-- Name: TABLE "user_profiles"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE "public"."user_profiles" IS 'Extended user profile data including purchase history';


--
-- Name: COLUMN "user_profiles"."has_made_purchase"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_profiles"."has_made_purchase" IS 'Tracks if user has completed at least one purchase (for first-time discount)';


--
-- Name: COLUMN "user_profiles"."first_name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_profiles"."first_name" IS 'User first name';


--
-- Name: COLUMN "user_profiles"."last_name"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_profiles"."last_name" IS 'User last name';


--
-- Name: COLUMN "user_profiles"."phone"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_profiles"."phone" IS 'User phone number';


--
-- Name: COLUMN "user_profiles"."is_admin"; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN "public"."user_profiles"."is_admin" IS 'Whether the user has admin access to the dashboard';


--
-- Name: wishlists; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS "public"."wishlists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL
);


ALTER TABLE "public"."wishlists" OWNER TO "postgres";

--
-- Name: app_config app_config_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."app_config"
    ADD CONSTRAINT "app_config_pkey" PRIMARY KEY ("id");


--
-- Name: articles articles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_pkey" PRIMARY KEY ("id");


--
-- Name: articles articles_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."articles"
    ADD CONSTRAINT "articles_slug_key" UNIQUE ("slug");


--
-- Name: categories categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_pkey" PRIMARY KEY ("id");


--
-- Name: categories categories_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."categories"
    ADD CONSTRAINT "categories_slug_key" UNIQUE ("slug");


--
-- Name: coupon_products coupon_products_coupon_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."coupon_products"
    ADD CONSTRAINT "coupon_products_coupon_id_product_id_key" UNIQUE ("coupon_id", "product_id");


--
-- Name: coupon_products coupon_products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."coupon_products"
    ADD CONSTRAINT "coupon_products_pkey" PRIMARY KEY ("id");


--
-- Name: coupons coupons_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_code_key" UNIQUE ("code");


--
-- Name: coupons coupons_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."coupons"
    ADD CONSTRAINT "coupons_pkey" PRIMARY KEY ("id");


--
-- Name: home_sections home_sections_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."home_sections"
    ADD CONSTRAINT "home_sections_pkey" PRIMARY KEY ("id");


--
-- Name: newsletter_subscribers newsletter_subscribers_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_email_key" UNIQUE ("email");


--
-- Name: newsletter_subscribers newsletter_subscribers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."newsletter_subscribers"
    ADD CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id");


--
-- Name: orders orders_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_pkey" PRIMARY KEY ("id");


--
-- Name: orders orders_stripe_session_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_stripe_session_id_key" UNIQUE ("stripe_session_id");


--
-- Name: orders orders_tracking_number_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_tracking_number_key" UNIQUE ("tracking_number");


--
-- Name: password_recovery_tokens password_recovery_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."password_recovery_tokens"
    ADD CONSTRAINT "password_recovery_tokens_pkey" PRIMARY KEY ("id");


--
-- Name: password_recovery_tokens password_recovery_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."password_recovery_tokens"
    ADD CONSTRAINT "password_recovery_tokens_token_key" UNIQUE ("token");


--
-- Name: product_variants product_variants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_pkey" PRIMARY KEY ("id");


--
-- Name: product_variants product_variants_product_id_size_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_size_key" UNIQUE ("product_id", "size");


--
-- Name: products products_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");


--
-- Name: products products_slug_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_slug_key" UNIQUE ("slug");


--
-- Name: returns returns_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_pkey" PRIMARY KEY ("id");


--
-- Name: shipment_events shipment_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."shipment_events"
    ADD CONSTRAINT "shipment_events_pkey" PRIMARY KEY ("id");


--
-- Name: stock_reservations stock_reservations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."stock_reservations"
    ADD CONSTRAINT "stock_reservations_pkey" PRIMARY KEY ("id");


--
-- Name: user_addresses user_addresses_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_addresses"
    ADD CONSTRAINT "user_addresses_pkey" PRIMARY KEY ("id");


--
-- Name: user_profiles user_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_pkey" PRIMARY KEY ("id");


--
-- Name: wishlists wishlists_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_pkey" PRIMARY KEY ("id");


--
-- Name: wishlists wishlists_user_id_product_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_product_id_key" UNIQUE ("user_id", "product_id");


--
-- Name: idx_coupon_products_coupon; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_coupon_products_coupon" ON "public"."coupon_products" USING "btree" ("coupon_id");


--
-- Name: idx_coupon_products_product; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_coupon_products_product" ON "public"."coupon_products" USING "btree" ("product_id");


--
-- Name: idx_coupons_active_auto; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_coupons_active_auto" ON "public"."coupons" USING "btree" ("is_active", "valid_until", "is_automatic");


--
-- Name: idx_coupons_code; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_coupons_code" ON "public"."coupons" USING "btree" ("code");


--
-- Name: idx_orders_order_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_orders_order_number" ON "public"."orders" USING "btree" ("order_number");


--
-- Name: idx_orders_shipping_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_orders_shipping_status" ON "public"."orders" USING "btree" ("shipping_status");


--
-- Name: idx_orders_stripe_session_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_orders_stripe_session_id" ON "public"."orders" USING "btree" ("stripe_session_id");


--
-- Name: idx_orders_tracking_number; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_orders_tracking_number" ON "public"."orders" USING "btree" ("tracking_number");


--
-- Name: idx_orders_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_orders_user_id" ON "public"."orders" USING "btree" ("user_id");


--
-- Name: idx_products_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_products_category" ON "public"."products" USING "btree" ("category_id");


--
-- Name: idx_products_featured; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_products_featured" ON "public"."products" USING "btree" ("featured") WHERE ("featured" = true);


--
-- Name: idx_products_slug; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_products_slug" ON "public"."products" USING "btree" ("slug");


--
-- Name: idx_recovery_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_recovery_token" ON "public"."password_recovery_tokens" USING "btree" ("token");


--
-- Name: idx_recovery_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_recovery_user" ON "public"."password_recovery_tokens" USING "btree" ("user_id");


--
-- Name: idx_reservations_expires; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reservations_expires" ON "public"."stock_reservations" USING "btree" ("expires_at");


--
-- Name: idx_reservations_session; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reservations_session" ON "public"."stock_reservations" USING "btree" ("session_id");


--
-- Name: idx_reservations_variant; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_reservations_variant" ON "public"."stock_reservations" USING "btree" ("variant_id");


--
-- Name: idx_shipment_events_order_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_shipment_events_order_id" ON "public"."shipment_events" USING "btree" ("order_id");


--
-- Name: idx_user_addresses_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_addresses_user_id" ON "public"."user_addresses" USING "btree" ("user_id");


--
-- Name: idx_user_profiles_admin; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "idx_user_profiles_admin" ON "public"."user_profiles" USING "btree" ("is_admin") WHERE ("is_admin" = true);


--
-- Name: products handle_products_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "handle_products_updated_at" BEFORE UPDATE ON "public"."products" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();


--
-- Name: user_profiles handle_user_profiles_updated_at; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "handle_user_profiles_updated_at" BEFORE UPDATE ON "public"."user_profiles" FOR EACH ROW EXECUTE FUNCTION "public"."handle_updated_at"();


--
-- Name: orders set_tracking_number; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE OR REPLACE TRIGGER "set_tracking_number" BEFORE INSERT ON "public"."orders" FOR EACH ROW EXECUTE FUNCTION "public"."generate_tracking_number"();


--
-- Name: coupon_products coupon_products_coupon_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."coupon_products"
    ADD CONSTRAINT "coupon_products_coupon_id_fkey" FOREIGN KEY ("coupon_id") REFERENCES "public"."coupons"("id") ON DELETE CASCADE;


--
-- Name: coupon_products coupon_products_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."coupon_products"
    ADD CONSTRAINT "coupon_products_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;


--
-- Name: orders orders_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."orders"
    ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE SET NULL;


--
-- Name: password_recovery_tokens password_recovery_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."password_recovery_tokens"
    ADD CONSTRAINT "password_recovery_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: product_variants product_variants_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."product_variants"
    ADD CONSTRAINT "product_variants_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;


--
-- Name: products products_category_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE SET NULL;


--
-- Name: returns returns_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id");


--
-- Name: returns returns_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."returns"
    ADD CONSTRAINT "returns_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");


--
-- Name: shipment_events shipment_events_order_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."shipment_events"
    ADD CONSTRAINT "shipment_events_order_id_fkey" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE CASCADE;


--
-- Name: stock_reservations stock_reservations_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."stock_reservations"
    ADD CONSTRAINT "stock_reservations_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;


--
-- Name: stock_reservations stock_reservations_variant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."stock_reservations"
    ADD CONSTRAINT "stock_reservations_variant_id_fkey" FOREIGN KEY ("variant_id") REFERENCES "public"."product_variants"("id") ON DELETE CASCADE;


--
-- Name: user_addresses user_addresses_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_addresses"
    ADD CONSTRAINT "user_addresses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: user_profiles user_profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."user_profiles"
    ADD CONSTRAINT "user_profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: wishlists wishlists_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id") ON DELETE CASCADE;


--
-- Name: wishlists wishlists_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY "public"."wishlists"
    ADD CONSTRAINT "wishlists_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;


--
-- Name: coupons Admin all access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin all access" ON "public"."coupons" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));


--
-- Name: categories Admin delete categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin delete categories" ON "public"."categories" FOR DELETE TO "authenticated" USING ("public"."is_user_admin"());


--
-- Name: product_variants Admin delete product_variants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin delete product_variants" ON "public"."product_variants" FOR DELETE TO "authenticated" USING ("public"."is_user_admin"());


--
-- Name: products Admin delete products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin delete products" ON "public"."products" FOR DELETE TO "authenticated" USING ("public"."is_user_admin"());


--
-- Name: categories Admin insert categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin insert categories" ON "public"."categories" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_user_admin"());


--
-- Name: product_variants Admin insert product_variants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin insert product_variants" ON "public"."product_variants" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_user_admin"());


--
-- Name: products Admin insert products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin insert products" ON "public"."products" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_user_admin"());


--
-- Name: coupon_products Admin manages coupon_products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin manages coupon_products" ON "public"."coupon_products" TO "authenticated" USING ("public"."is_user_admin"()) WITH CHECK ("public"."is_user_admin"());


--
-- Name: categories Admin update categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin update categories" ON "public"."categories" FOR UPDATE TO "authenticated" USING ("public"."is_user_admin"()) WITH CHECK ("public"."is_user_admin"());


--
-- Name: product_variants Admin update product_variants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin update product_variants" ON "public"."product_variants" FOR UPDATE TO "authenticated" USING ("public"."is_user_admin"()) WITH CHECK ("public"."is_user_admin"());


--
-- Name: products Admin update products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admin update products" ON "public"."products" FOR UPDATE TO "authenticated" USING ("public"."is_user_admin"()) WITH CHECK ("public"."is_user_admin"());


--
-- Name: articles Admins can do everything with articles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can do everything with articles" ON "public"."articles" USING (("auth"."uid"() IN ( SELECT "user_profiles"."id"
   FROM "public"."user_profiles"
  WHERE ("user_profiles"."is_admin" = true))));


--
-- Name: user_profiles Admins can see all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can see all profiles" ON "public"."user_profiles" FOR SELECT USING ("public"."is_admin"());


--
-- Name: user_profiles Admins can update all profiles; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update all profiles" ON "public"."user_profiles" FOR UPDATE USING ("public"."is_admin"());


--
-- Name: app_config Admins can update config; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update config" ON "public"."app_config" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));


--
-- Name: home_sections Admins can update home_sections; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update home_sections" ON "public"."home_sections" USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));


--
-- Name: orders Admins can update orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update orders" ON "public"."orders" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));


--
-- Name: returns Admins can update returns; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can update returns" ON "public"."returns" FOR UPDATE TO "service_role" USING (true);


--
-- Name: orders Admins can view all orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all orders" ON "public"."orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."user_profiles"
  WHERE (("user_profiles"."id" = "auth"."uid"()) AND ("user_profiles"."is_admin" = true)))));


--
-- Name: returns Admins can view all returns; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Admins can view all returns" ON "public"."returns" FOR SELECT TO "service_role" USING (true);


--
-- Name: returns Allow admins to update returns; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Allow admins to update returns" ON "public"."returns" FOR UPDATE TO "authenticated" USING (((("auth"."jwt"() ->> 'is_admin'::"text"))::boolean = true)) WITH CHECK (true);


--
-- Name: newsletter_subscribers Enable all access for service role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable all access for service role" ON "public"."newsletter_subscribers" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));


--
-- Name: newsletter_subscribers Enable insert for everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable insert for everyone" ON "public"."newsletter_subscribers" FOR INSERT WITH CHECK (true);


--
-- Name: home_sections Enable read access for all users; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable read access for all users" ON "public"."home_sections" FOR SELECT USING (true);


--
-- Name: home_sections Enable write access for service role; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Enable write access for service role" ON "public"."home_sections" USING (("auth"."role"() = 'service_role'::"text")) WITH CHECK (("auth"."role"() = 'service_role'::"text"));


--
-- Name: articles Public articles are viewable by everyone; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public articles are viewable by everyone" ON "public"."articles" FOR SELECT USING ((("published_at" IS NOT NULL) AND ("published_at" <= "now"())));


--
-- Name: app_config Public read access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access" ON "public"."app_config" FOR SELECT USING (true);


--
-- Name: coupons Public read access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read access" ON "public"."coupons" FOR SELECT USING (true);


--
-- Name: categories Public read categories; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read categories" ON "public"."categories" FOR SELECT USING (true);


--
-- Name: coupon_products Public read coupon_products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read coupon_products" ON "public"."coupon_products" FOR SELECT USING (true);


--
-- Name: product_variants Public read product_variants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read product_variants" ON "public"."product_variants" FOR SELECT USING (true);


--
-- Name: products Public read products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Public read products" ON "public"."products" FOR SELECT USING (true);


--
-- Name: orders Service role can insert orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role can insert orders" ON "public"."orders" FOR INSERT WITH CHECK (true);


--
-- Name: shipment_events Service role can manage shipment events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role can manage shipment events" ON "public"."shipment_events" TO "service_role" USING (true) WITH CHECK (true);


--
-- Name: user_profiles Service role has full access; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role has full access" ON "public"."user_profiles" USING (("auth"."role"() = 'service_role'::"text"));


--
-- Name: coupon_products Service role manages coupon_products; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role manages coupon_products" ON "public"."coupon_products" TO "service_role" USING (true) WITH CHECK (true);


--
-- Name: coupons Service role manages coupons; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role manages coupons" ON "public"."coupons" TO "service_role" USING (true) WITH CHECK (true);


--
-- Name: orders Service role manages orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role manages orders" ON "public"."orders" TO "service_role" USING (true) WITH CHECK (true);


--
-- Name: product_variants Service role manages product_variants; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Service role manages product_variants" ON "public"."product_variants" TO "service_role" USING (true) WITH CHECK (true);


--
-- Name: stock_reservations Session can delete reservations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Session can delete reservations" ON "public"."stock_reservations" FOR DELETE USING ((("session_id" = ("auth"."uid"())::"text") OR ("session_id" = ((COALESCE("current_setting"('request.headers'::"text", true), '{}'::"text"))::json ->> 'x-session-id'::"text"))));


--
-- Name: stock_reservations Session can insert reservation; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Session can insert reservation" ON "public"."stock_reservations" FOR INSERT WITH CHECK (((("session_id" = ("auth"."uid"())::"text") OR ("session_id" = ((COALESCE("current_setting"('request.headers'::"text", true), '{}'::"text"))::json ->> 'x-session-id'::"text"))) AND ("quantity" > 0) AND ("quantity" <= 10) AND ("expires_at" <= ("now"() + '00:31:00'::interval)) AND ("expires_at" >= ("now"() - '00:01:00'::interval))));


--
-- Name: stock_reservations Session can read reservations; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Session can read reservations" ON "public"."stock_reservations" FOR SELECT USING ((("session_id" = ("auth"."uid"())::"text") OR ("session_id" = ((COALESCE("current_setting"('request.headers'::"text", true), '{}'::"text"))::json ->> 'x-session-id'::"text"))));


--
-- Name: returns Users can create their own returns; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can create their own returns" ON "public"."returns" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: wishlists Users can delete from their own wishlist; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete from their own wishlist" ON "public"."wishlists" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: user_addresses Users can delete own addresses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can delete own addresses" ON "public"."user_addresses" FOR DELETE USING (("auth"."uid"() = "user_id"));


--
-- Name: wishlists Users can insert into their own wishlist; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert into their own wishlist" ON "public"."wishlists" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: user_addresses Users can insert own addresses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can insert own addresses" ON "public"."user_addresses" FOR INSERT WITH CHECK (("auth"."uid"() = "user_id"));


--
-- Name: user_profiles Users can see own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can see own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));


--
-- Name: user_addresses Users can update own addresses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own addresses" ON "public"."user_addresses" FOR UPDATE USING (("auth"."uid"() = "user_id"));


--
-- Name: user_profiles Users can update own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can update own profile" ON "public"."user_profiles" FOR UPDATE USING (("auth"."uid"() = "id"));


--
-- Name: user_addresses Users can view own addresses; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own addresses" ON "public"."user_addresses" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: user_profiles Users can view own profile; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own profile" ON "public"."user_profiles" FOR SELECT USING (("auth"."uid"() = "id"));


--
-- Name: shipment_events Users can view own shipment events; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view own shipment events" ON "public"."shipment_events" FOR SELECT USING (("order_id" IN ( SELECT "orders"."id"
   FROM "public"."orders"
  WHERE ("orders"."user_id" = "auth"."uid"()))));


--
-- Name: orders Users can view their own orders; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own orders" ON "public"."orders" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: returns Users can view their own returns; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own returns" ON "public"."returns" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));


--
-- Name: wishlists Users can view their own wishlist; Type: POLICY; Schema: public; Owner: postgres
--

CREATE POLICY "Users can view their own wishlist" ON "public"."wishlists" FOR SELECT USING (("auth"."uid"() = "user_id"));


--
-- Name: app_config; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."app_config" ENABLE ROW LEVEL SECURITY;

--
-- Name: articles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."articles" ENABLE ROW LEVEL SECURITY;

--
-- Name: categories; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."categories" ENABLE ROW LEVEL SECURITY;

--
-- Name: coupon_products; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."coupon_products" ENABLE ROW LEVEL SECURITY;

--
-- Name: coupons; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."coupons" ENABLE ROW LEVEL SECURITY;

--
-- Name: home_sections; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."home_sections" ENABLE ROW LEVEL SECURITY;

--
-- Name: newsletter_subscribers; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."newsletter_subscribers" ENABLE ROW LEVEL SECURITY;

--
-- Name: orders; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."orders" ENABLE ROW LEVEL SECURITY;

--
-- Name: password_recovery_tokens; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."password_recovery_tokens" ENABLE ROW LEVEL SECURITY;

--
-- Name: product_variants; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."product_variants" ENABLE ROW LEVEL SECURITY;

--
-- Name: products; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;

--
-- Name: returns; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."returns" ENABLE ROW LEVEL SECURITY;

--
-- Name: shipment_events; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."shipment_events" ENABLE ROW LEVEL SECURITY;

--
-- Name: stock_reservations; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."stock_reservations" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_addresses; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_addresses" ENABLE ROW LEVEL SECURITY;

--
-- Name: user_profiles; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."user_profiles" ENABLE ROW LEVEL SECURITY;

--
-- Name: wishlists; Type: ROW SECURITY; Schema: public; Owner: postgres
--

ALTER TABLE "public"."wishlists" ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: postgres
--

-- CREATE PUBLICATION "supabase_realtime" WITH (publish = 'insert, update, delete, truncate');


ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";

--
-- Name: supabase_realtime_messages_publication; Type: PUBLICATION; Schema: -; Owner: supabase_admin
--

-- CREATE PUBLICATION "supabase_realtime_messages_publication" WITH (publish = 'insert, update, delete, truncate');


-- ALTER PUBLICATION "supabase_realtime_messages_publication" OWNER TO "supabase_admin";

--
-- Name: supabase_realtime app_config; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."app_config";


--
-- Name: supabase_realtime coupons; Type: PUBLICATION TABLE; Schema: public; Owner: postgres
--

ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."coupons";


--
-- Name: SCHEMA "public"; Type: ACL; Schema: -; Owner: pg_database_owner
--

GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";


--
-- Name: FUNCTION "armor"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."armor"("bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "armor"("bytea", "text"[], "text"[]); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."armor"("bytea", "text"[], "text"[]) TO "dashboard_user";


--
-- Name: FUNCTION "crypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."crypt"("text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."crypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "dearmor"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."dearmor"("text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."dearmor"("text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "decrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."decrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."digest"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."digest"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "digest"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."digest"("text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."digest"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."encrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "encrypt_iv"("bytea", "bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."encrypt_iv"("bytea", "bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_bytes"(integer); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_random_bytes"(integer) TO "dashboard_user";


--
-- Name: FUNCTION "gen_random_uuid"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."gen_random_uuid"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_random_uuid"() TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."gen_salt"("text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text") TO "dashboard_user";


--
-- Name: FUNCTION "gen_salt"("text", integer); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."gen_salt"("text", integer) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."gen_salt"("text", integer) TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."hmac"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "hmac"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."hmac"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements"("showtext" boolean, OUT "userid" "oid", OUT "dbid" "oid", OUT "toplevel" boolean, OUT "queryid" bigint, OUT "query" "text", OUT "plans" bigint, OUT "total_plan_time" double precision, OUT "min_plan_time" double precision, OUT "max_plan_time" double precision, OUT "mean_plan_time" double precision, OUT "stddev_plan_time" double precision, OUT "calls" bigint, OUT "total_exec_time" double precision, OUT "min_exec_time" double precision, OUT "max_exec_time" double precision, OUT "mean_exec_time" double precision, OUT "stddev_exec_time" double precision, OUT "rows" bigint, OUT "shared_blks_hit" bigint, OUT "shared_blks_read" bigint, OUT "shared_blks_dirtied" bigint, OUT "shared_blks_written" bigint, OUT "local_blks_hit" bigint, OUT "local_blks_read" bigint, OUT "local_blks_dirtied" bigint, OUT "local_blks_written" bigint, OUT "temp_blks_read" bigint, OUT "temp_blks_written" bigint, OUT "shared_blk_read_time" double precision, OUT "shared_blk_write_time" double precision, OUT "local_blk_read_time" double precision, OUT "local_blk_write_time" double precision, OUT "temp_blk_read_time" double precision, OUT "temp_blk_write_time" double precision, OUT "wal_records" bigint, OUT "wal_fpi" bigint, OUT "wal_bytes" numeric, OUT "jit_functions" bigint, OUT "jit_generation_time" double precision, OUT "jit_inlining_count" bigint, OUT "jit_inlining_time" double precision, OUT "jit_optimization_count" bigint, OUT "jit_optimization_time" double precision, OUT "jit_emission_count" bigint, OUT "jit_emission_time" double precision, OUT "jit_deform_count" bigint, OUT "jit_deform_time" double precision, OUT "stats_since" timestamp with time zone, OUT "minmax_stats_since" timestamp with time zone) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_info"(OUT "dealloc" bigint, OUT "stats_reset" timestamp with time zone) TO "dashboard_user";


--
-- Name: FUNCTION "pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pg_stat_statements_reset"("userid" "oid", "dbid" "oid", "queryid" bigint, "minmax_only" boolean) TO "dashboard_user";


--
-- Name: FUNCTION "pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_armor_headers"("text", OUT "key" "text", OUT "value" "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_key_id"("bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_key_id"("bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_decrypt_bytea"("bytea", "bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt"("text", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt"("text", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_pub_encrypt_bytea"("bytea", "bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_pub_encrypt_bytea"("bytea", "bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_decrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_decrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt"("text", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt"("text", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text") TO "dashboard_user";


--
-- Name: FUNCTION "pgp_sym_encrypt_bytea"("bytea", "text", "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."pgp_sym_encrypt_bytea"("bytea", "text", "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v1"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v1mc"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v1mc"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v3"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v3"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v4"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v4"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v4"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_generate_v5"("namespace" "uuid", "name" "text"); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_generate_v5"("namespace" "uuid", "name" "text") TO "dashboard_user";


--
-- Name: FUNCTION "uuid_nil"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_nil"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_nil"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_dns"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_ns_dns"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_dns"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_oid"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_ns_oid"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_oid"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_url"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_ns_url"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_url"() TO "dashboard_user";


--
-- Name: FUNCTION "uuid_ns_x500"(); Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON FUNCTION "extensions"."uuid_ns_x500"() FROM "postgres";
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "extensions"."uuid_ns_x500"() TO "dashboard_user";


--
-- Name: FUNCTION "graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb"); Type: ACL; Schema: graphql_public; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "postgres";
-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "anon";
-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "authenticated";
-- GRANT ALL ON FUNCTION "graphql_public"."graphql"("operationName" "text", "query" "text", "variables" "jsonb", "extensions" "jsonb") TO "service_role";


--
-- Name: FUNCTION "cancel_order"("p_order_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

REVOKE ALL ON FUNCTION "public"."cancel_order"("p_order_id" "uuid") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "generate_tracking_number"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."generate_tracking_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_tracking_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_tracking_number"() TO "service_role";


--
-- Name: FUNCTION "get_available_stock"("p_variant_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_available_stock"("p_variant_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_stock"("p_variant_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_stock"("p_variant_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "get_available_stock"("p_product_id" "uuid", "p_size" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."get_available_stock"("p_product_id" "uuid", "p_size" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_stock"("p_product_id" "uuid", "p_size" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_stock"("p_product_id" "uuid", "p_size" "text") TO "service_role";


--
-- Name: FUNCTION "handle_new_user"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";


--
-- Name: FUNCTION "handle_updated_at"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_updated_at"() TO "service_role";


--
-- Name: FUNCTION "is_admin"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";


--
-- Name: FUNCTION "is_user_admin"(); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_user_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_admin"() TO "service_role";


--
-- Name: FUNCTION "is_user_admin"("user_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."is_user_admin"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."is_user_admin"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_user_admin"("user_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "use_coupon"("p_code" "text"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."use_coupon"("p_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."use_coupon"("p_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."use_coupon"("p_code" "text") TO "service_role";


--
-- Name: FUNCTION "use_coupon"("coupon_id" "uuid"); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."use_coupon"("coupon_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."use_coupon"("coupon_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."use_coupon"("coupon_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "validate_coupon"("p_code" "text", "p_purchase_amount" integer); Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON FUNCTION "public"."validate_coupon"("p_code" "text", "p_purchase_amount" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."validate_coupon"("p_code" "text", "p_purchase_amount" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_coupon"("p_code" "text", "p_purchase_amount" integer) TO "service_role";


--
-- Name: FUNCTION "_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."_crypto_aead_det_decrypt"("message" "bytea", "additional" "bytea", "key_id" bigint, "context" "bytea", "nonce" "bytea") TO "service_role";


--
-- Name: FUNCTION "create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."create_secret"("new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: FUNCTION "update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid"); Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON FUNCTION "vault"."update_secret"("secret_id" "uuid", "new_secret" "text", "new_name" "text", "new_description" "text", "new_key_id" "uuid") TO "service_role";


--
-- Name: TABLE "pg_stat_statements"; Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON TABLE "extensions"."pg_stat_statements" FROM "postgres";
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements" TO "dashboard_user";


--
-- Name: TABLE "pg_stat_statements_info"; Type: ACL; Schema: extensions; Owner: postgres
--

-- REVOKE ALL ON TABLE "extensions"."pg_stat_statements_info" FROM "postgres";
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "postgres" WITH GRANT OPTION;
-- GRANT ALL ON TABLE "extensions"."pg_stat_statements_info" TO "dashboard_user";


--
-- Name: TABLE "app_config"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."app_config" TO "anon";
GRANT ALL ON TABLE "public"."app_config" TO "authenticated";
GRANT ALL ON TABLE "public"."app_config" TO "service_role";


--
-- Name: TABLE "articles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."articles" TO "anon";
GRANT ALL ON TABLE "public"."articles" TO "authenticated";
GRANT ALL ON TABLE "public"."articles" TO "service_role";


--
-- Name: TABLE "categories"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."categories" TO "anon";
GRANT ALL ON TABLE "public"."categories" TO "authenticated";
GRANT ALL ON TABLE "public"."categories" TO "service_role";


--
-- Name: TABLE "coupon_products"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."coupon_products" TO "anon";
GRANT ALL ON TABLE "public"."coupon_products" TO "authenticated";
GRANT ALL ON TABLE "public"."coupon_products" TO "service_role";


--
-- Name: TABLE "coupons"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."coupons" TO "anon";
GRANT ALL ON TABLE "public"."coupons" TO "authenticated";
GRANT ALL ON TABLE "public"."coupons" TO "service_role";


--
-- Name: TABLE "home_sections"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."home_sections" TO "anon";
GRANT ALL ON TABLE "public"."home_sections" TO "authenticated";
GRANT ALL ON TABLE "public"."home_sections" TO "service_role";


--
-- Name: TABLE "newsletter_subscribers"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "anon";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "authenticated";
GRANT ALL ON TABLE "public"."newsletter_subscribers" TO "service_role";


--
-- Name: TABLE "orders"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."orders" TO "anon";
GRANT ALL ON TABLE "public"."orders" TO "authenticated";
GRANT ALL ON TABLE "public"."orders" TO "service_role";


--
-- Name: SEQUENCE "orders_order_number_seq"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON SEQUENCE "public"."orders_order_number_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."orders_order_number_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."orders_order_number_seq" TO "service_role";


--
-- Name: TABLE "password_recovery_tokens"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."password_recovery_tokens" TO "anon";
GRANT ALL ON TABLE "public"."password_recovery_tokens" TO "authenticated";
GRANT ALL ON TABLE "public"."password_recovery_tokens" TO "service_role";


--
-- Name: TABLE "product_variants"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."product_variants" TO "anon";
GRANT ALL ON TABLE "public"."product_variants" TO "authenticated";
GRANT ALL ON TABLE "public"."product_variants" TO "service_role";


--
-- Name: TABLE "products"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";


--
-- Name: TABLE "returns"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."returns" TO "anon";
GRANT ALL ON TABLE "public"."returns" TO "authenticated";
GRANT ALL ON TABLE "public"."returns" TO "service_role";


--
-- Name: TABLE "shipment_events"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."shipment_events" TO "anon";
GRANT ALL ON TABLE "public"."shipment_events" TO "authenticated";
GRANT ALL ON TABLE "public"."shipment_events" TO "service_role";


--
-- Name: TABLE "stock_reservations"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."stock_reservations" TO "anon";
GRANT ALL ON TABLE "public"."stock_reservations" TO "authenticated";
GRANT ALL ON TABLE "public"."stock_reservations" TO "service_role";


--
-- Name: TABLE "user_addresses"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_addresses" TO "anon";
GRANT ALL ON TABLE "public"."user_addresses" TO "authenticated";
GRANT ALL ON TABLE "public"."user_addresses" TO "service_role";


--
-- Name: TABLE "user_profiles"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."user_profiles" TO "anon";
GRANT ALL ON TABLE "public"."user_profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."user_profiles" TO "service_role";


--
-- Name: TABLE "wishlists"; Type: ACL; Schema: public; Owner: postgres
--

GRANT ALL ON TABLE "public"."wishlists" TO "anon";
GRANT ALL ON TABLE "public"."wishlists" TO "authenticated";
GRANT ALL ON TABLE "public"."wishlists" TO "service_role";


--
-- Name: TABLE "secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."secrets" TO "postgres" WITH GRANT OPTION;
-- GRANT SELECT,DELETE ON TABLE "vault"."secrets" TO "service_role";


--
-- Name: TABLE "decrypted_secrets"; Type: ACL; Schema: vault; Owner: supabase_admin
--

-- GRANT SELECT,REFERENCES,DELETE,TRUNCATE ON TABLE "vault"."decrypted_secrets" TO "postgres" WITH GRANT OPTION;
-- GRANT SELECT,DELETE ON TABLE "vault"."decrypted_secrets" TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR SEQUENCES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR FUNCTIONS; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: postgres
--

ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: DEFAULT PRIVILEGES FOR TABLES; Type: DEFAULT ACL; Schema: public; Owner: supabase_admin
--

-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
-- ALTER DEFAULT PRIVILEGES FOR ROLE "supabase_admin" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_graphql_placeholder" ON "sql_drop"
--          WHEN TAG IN ('DROP EXTENSION')
--    EXECUTE FUNCTION "extensions"."set_graphql_placeholder"();


-- ALTER EVENT TRIGGER "issue_graphql_placeholder" OWNER TO "supabase_admin";

--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_cron_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE EXTENSION')
--    EXECUTE FUNCTION "extensions"."grant_pg_cron_access"();


-- ALTER EVENT TRIGGER "issue_pg_cron_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_graphql_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE FUNCTION')
--    EXECUTE FUNCTION "extensions"."grant_pg_graphql_access"();


-- ALTER EVENT TRIGGER "issue_pg_graphql_access" OWNER TO "supabase_admin";

--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "issue_pg_net_access" ON "ddl_command_end"
--          WHEN TAG IN ('CREATE EXTENSION')
--    EXECUTE FUNCTION "extensions"."grant_pg_net_access"();


-- ALTER EVENT TRIGGER "issue_pg_net_access" OWNER TO "supabase_admin";

--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "pgrst_ddl_watch" ON "ddl_command_end"
--    EXECUTE FUNCTION "extensions"."pgrst_ddl_watch"();


-- ALTER EVENT TRIGGER "pgrst_ddl_watch" OWNER TO "supabase_admin";

--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: supabase_admin
--

-- CREATE EVENT TRIGGER "pgrst_drop_watch" ON "sql_drop"
--    EXECUTE FUNCTION "extensions"."pgrst_drop_watch"();


-- ALTER EVENT TRIGGER "pgrst_drop_watch" OWNER TO "supabase_admin";

--
-- PostgreSQL database dump complete
--

-- \unrestrict YpyAyC7Vh0cRriLwB1Iqc9qZsPqkrfGFH12PZ4IVUg25004zcWlnGFEBunTcJv0

