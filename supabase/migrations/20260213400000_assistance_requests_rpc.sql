-- Función RPC para crear solicitudes de asistencia sin depender de RLS.
-- Schema: user_id NOT NULL, restaurant_id NOT NULL, type NOT NULL, order_id opcional.
CREATE OR REPLACE FUNCTION create_assistance_request(
  p_restaurant_id UUID,
  p_user_id UUID,
  p_request_type TEXT DEFAULT 'custom',
  p_message TEXT DEFAULT NULL,
  p_table_number TEXT DEFAULT NULL,
  p_order_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_row assistance_requests%ROWTYPE;
  v_type TEXT;
BEGIN
  v_type := COALESCE(NULLIF(trim(p_request_type), ''), 'custom');

  INSERT INTO assistance_requests (
    restaurant_id,
    user_id,
    order_id,
    request_type,
    "type",
    message,
    table_number,
    status
  ) VALUES (
    p_restaurant_id,
    p_user_id,
    p_order_id,
    v_type,
    v_type,
    p_message,
    p_table_number,
    'pending'
  )
  RETURNING * INTO new_row;

  RETURN row_to_json(new_row);
END;
$$;

COMMENT ON FUNCTION create_assistance_request IS 'Crea una solicitud de asistencia. user_id requerido (schema NOT NULL). order_id opcional.';

-- Permitir que anon y authenticated ejecuten la función
GRANT EXECUTE ON FUNCTION create_assistance_request(UUID, UUID, TEXT, TEXT, TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION create_assistance_request(UUID, UUID, TEXT, TEXT, TEXT, UUID) TO authenticated;
