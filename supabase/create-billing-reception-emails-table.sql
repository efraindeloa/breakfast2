-- ==================== TABLA DE EMAILS DE RECEPCIÓN DE FACTURAS ====================
-- Esta tabla almacena los múltiples emails donde el usuario desea recibir sus facturas

CREATE TABLE IF NOT EXISTS user_billing_reception_emails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billing_profile_id UUID REFERENCES user_billing_profiles(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  label TEXT, -- Etiqueta opcional (ej: "Principal", "Contabilidad", etc.)
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true, -- Para soft delete
  auto_send_on_payment BOOLEAN DEFAULT true, -- Si se envía automáticamente al pagar
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Validar formato de email
  CONSTRAINT valid_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_billing_reception_emails_user_id ON user_billing_reception_emails(user_id);
CREATE INDEX IF NOT EXISTS idx_billing_reception_emails_billing_profile_id ON user_billing_reception_emails(billing_profile_id);
CREATE INDEX IF NOT EXISTS idx_billing_reception_emails_active ON user_billing_reception_emails(user_id, is_active) WHERE is_active = true;

-- Índice único parcial: Un usuario no puede tener emails duplicados en el mismo perfil de facturación (solo para emails activos)
CREATE UNIQUE INDEX IF NOT EXISTS idx_billing_reception_emails_unique_email_per_profile 
ON user_billing_reception_emails(billing_profile_id, email) 
WHERE is_active = true;

-- Trigger para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_billing_reception_emails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_billing_reception_emails_updated_at ON user_billing_reception_emails;
CREATE TRIGGER update_billing_reception_emails_updated_at
  BEFORE UPDATE ON user_billing_reception_emails
  FOR EACH ROW
  EXECUTE FUNCTION update_billing_reception_emails_updated_at();

-- Habilitar RLS (Row Level Security)
ALTER TABLE user_billing_reception_emails ENABLE ROW LEVEL SECURITY;

-- Políticas RLS: Los usuarios solo pueden ver/modificar sus propios emails
DROP POLICY IF EXISTS "Users can view their own reception emails" ON user_billing_reception_emails;
CREATE POLICY "Users can view their own reception emails"
  ON user_billing_reception_emails FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own reception emails" ON user_billing_reception_emails;
CREATE POLICY "Users can insert their own reception emails"
  ON user_billing_reception_emails FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own reception emails" ON user_billing_reception_emails;
CREATE POLICY "Users can update their own reception emails"
  ON user_billing_reception_emails FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own reception emails" ON user_billing_reception_emails;
CREATE POLICY "Users can delete their own reception emails"
  ON user_billing_reception_emails FOR DELETE
  USING (auth.uid() = user_id);

-- Comentarios para documentación
COMMENT ON TABLE user_billing_reception_emails IS 'Emails de recepción de facturas para cada usuario';
COMMENT ON COLUMN user_billing_reception_emails.billing_profile_id IS 'ID del perfil de facturación asociado (opcional, puede ser NULL si es un email general)';
COMMENT ON COLUMN user_billing_reception_emails.email IS 'Dirección de email donde se recibirán las facturas';
COMMENT ON COLUMN user_billing_reception_emails.label IS 'Etiqueta opcional para identificar el email (ej: "Principal", "Contabilidad")';
COMMENT ON COLUMN user_billing_reception_emails.is_primary IS 'Indica si es el email principal de recepción';
COMMENT ON COLUMN user_billing_reception_emails.is_active IS 'Para soft delete, permite "eliminar" sin borrar físicamente';
COMMENT ON COLUMN user_billing_reception_emails.auto_send_on_payment IS 'Si se envía automáticamente la factura cuando se realiza un pago';
