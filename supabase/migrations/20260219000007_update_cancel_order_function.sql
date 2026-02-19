-- Update cancel_order function to automatically create a return request
-- when a user cancels an order

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

-- Grant permissions
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_order"("p_order_id" "uuid") TO "service_role";

COMMENT ON FUNCTION "public"."cancel_order"("p_order_id" "uuid") IS 'Cancels an order, restores stock, and creates a return request entry for admin review';
