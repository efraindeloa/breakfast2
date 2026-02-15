-- RPC: Cerrar orden (status = entregada, completed_at = now())
-- Schema orders: PK id, status CHECK (pending, orden_enviada, ..., entregada, cancelada, ...)

CREATE OR REPLACE FUNCTION close_order(p_order_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updated_row orders%ROWTYPE;
BEGIN
  UPDATE orders
  SET status = 'entregada',
      updated_at = now(),
      completed_at = now()
  WHERE id = p_order_id
  RETURNING * INTO updated_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Orden no encontrada: %', p_order_id;
  END IF;

  RETURN row_to_json(updated_row);
END;
$$;

COMMENT ON FUNCTION close_order IS 'Cierra una orden: status = entregada, completed_at = now().';

GRANT EXECUTE ON FUNCTION close_order(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION close_order(UUID) TO anon;
