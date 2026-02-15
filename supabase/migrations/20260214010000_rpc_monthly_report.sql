-- RPC: Calcular reporte mensual por restaurante
-- Uso: supabase.rpc('calculate_monthly_report', { p_restaurant_id: 'uuid', p_year: 2025, p_month: 2 })

CREATE OR REPLACE FUNCTION calculate_monthly_report(
  p_restaurant_id UUID,
  p_year INT,
  p_month INT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'restaurant_id', p_restaurant_id,
    'year', p_year,
    'month', p_month,
    'total_orders', COALESCE((
      SELECT COUNT(*)::INT
      FROM orders
      WHERE restaurant_id = p_restaurant_id
        AND EXTRACT(YEAR FROM created_at) = p_year
        AND EXTRACT(MONTH FROM created_at) = p_month
    ), 0),
    'total_revenue', COALESCE((
      SELECT SUM(COALESCE(total, 0))::NUMERIC(12,2)
      FROM orders
      WHERE restaurant_id = p_restaurant_id
        AND status NOT IN ('cancelled')
        AND EXTRACT(YEAR FROM created_at) = p_year
        AND EXTRACT(MONTH FROM created_at) = p_month
    ), 0)
  ) INTO result;

  RETURN result;
END;
$$;

COMMENT ON FUNCTION calculate_monthly_report IS 'Reporte mensual: total órdenes y revenue por restaurante.';

GRANT EXECUTE ON FUNCTION calculate_monthly_report(UUID, INT, INT) TO authenticated;
