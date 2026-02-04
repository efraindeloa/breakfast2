-- Hacer opcionales todos los campos de user_billing_profiles
-- Esto permite que el usuario guarde datos parciales

-- Hacer tax_id opcional (ya que el usuario puede no tenerlo aún)
ALTER TABLE user_billing_profiles 
ALTER COLUMN tax_id DROP NOT NULL;

-- Hacer business_name opcional (ya que el usuario puede no tenerlo aún)
ALTER TABLE user_billing_profiles 
ALTER COLUMN business_name DROP NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN user_billing_profiles.tax_id IS 'RFC u otro identificador fiscal (opcional)';
COMMENT ON COLUMN user_billing_profiles.business_name IS 'Razón social (opcional)';
