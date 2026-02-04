-- Agregar campos de régimen fiscal y uso CFDI a user_billing_profiles
ALTER TABLE user_billing_profiles 
ADD COLUMN IF NOT EXISTS regimen_fiscal TEXT,
ADD COLUMN IF NOT EXISTS uso_cfdi TEXT;

-- Hacer el campo email opcional (ya que se configura en el paso 3)
ALTER TABLE user_billing_profiles 
ALTER COLUMN email DROP NOT NULL;

-- Comentarios para documentación
COMMENT ON COLUMN user_billing_profiles.regimen_fiscal IS 'Régimen fiscal del SAT (ej: 601, 605, 612, 616, 626)';
COMMENT ON COLUMN user_billing_profiles.uso_cfdi IS 'Uso de CFDI (ej: G03, S01, P01)';
