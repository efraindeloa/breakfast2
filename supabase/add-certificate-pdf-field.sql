-- Agregar campo para URL del PDF de la constancia fiscal
ALTER TABLE user_billing_profiles 
ADD COLUMN IF NOT EXISTS certificate_pdf_url TEXT;

COMMENT ON COLUMN user_billing_profiles.certificate_pdf_url IS 'URL del PDF de la Constancia de Situación Fiscal subido por el usuario';
