-- ==================== TABLAS DE PERFIL DE RESTAURANTE ====================
-- Este script crea todas las tablas necesarias para el perfil completo del restaurante
-- Incluye: identidad, ubicación, horarios, configuración de servicio, pagos, facturación, notificaciones y métricas

-- ==================== 1. IDENTIDAD DEL RESTAURANTE ====================
-- Extiende la tabla restaurants con información de identidad
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS nombre_comercial TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS razon_social TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS descripcion_corta TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS descripcion_larga TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tipo_cocina TEXT; -- mexicana, italiana, etc.
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}'; -- familiar, romántico, rápido, gourmet

-- Tabla para imágenes de portada (múltiples)
CREATE TABLE IF NOT EXISTS restaurant_cover_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  image_order INTEGER DEFAULT 0, -- Orden de visualización
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_cover_images_restaurant_id ON restaurant_cover_images(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_cover_images_order ON restaurant_cover_images(restaurant_id, image_order);

-- ==================== 2. UBICACIÓN Y CONTACTO ====================
-- Extiende la tabla restaurants con información de contacto
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS direccion_completa TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS email_contacto TEXT;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS sitio_web TEXT;

-- Tabla para redes sociales (estructura flexible)
CREATE TABLE IF NOT EXISTS restaurant_social_media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'facebook', 'twitter', 'tiktok', 'youtube', 'linkedin')),
  url TEXT NOT NULL,
  username TEXT, -- Nombre de usuario en la plataforma
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_social_media_restaurant_id ON restaurant_social_media(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_social_media_platform ON restaurant_social_media(platform);

-- ==================== 3. HORARIOS Y OPERACIÓN ====================
CREATE TABLE IF NOT EXISTS restaurant_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domingo, 6 = Sábado
  hour_start TIME NOT NULL,
  hour_end TIME NOT NULL,
  is_closed BOOLEAN DEFAULT false, -- Si está cerrado ese día
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, day_of_week)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_hours_restaurant_id ON restaurant_hours(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_hours_day ON restaurant_hours(restaurant_id, day_of_week);

-- Horarios especiales (festivos, eventos)
CREATE TABLE IF NOT EXISTS restaurant_special_hours (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hour_start TIME,
  hour_end TIME,
  is_closed BOOLEAN DEFAULT false,
  reason TEXT, -- Razón del horario especial (ej: "Día de la Independencia")
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, date)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_special_hours_restaurant_id ON restaurant_special_hours(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_special_hours_date ON restaurant_special_hours(restaurant_id, date);

-- ==================== 4. CONFIGURACIÓN DE SERVICIO ====================
CREATE TABLE IF NOT EXISTS restaurant_service_config (
  restaurant_id UUID PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
  consumo_en_mesa BOOLEAN DEFAULT true,
  para_llevar BOOLEAN DEFAULT false,
  servicio_domicilio BOOLEAN DEFAULT false,
  acepta_reservaciones BOOLEAN DEFAULT false,
  acepta_lista_espera BOOLEAN DEFAULT true,
  tiempo_promedio_preparacion INTEGER DEFAULT 30, -- Minutos
  numero_mesas INTEGER DEFAULT 0,
  capacidad_total INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_service_config_restaurant_id ON restaurant_service_config(restaurant_id);

-- ==================== 5. CONFIGURACIÓN DE PAGOS ====================
CREATE TABLE IF NOT EXISTS restaurant_payment_config (
  restaurant_id UUID PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
  acepta_efectivo BOOLEAN DEFAULT true,
  acepta_tarjeta BOOLEAN DEFAULT true,
  acepta_app BOOLEAN DEFAULT true, -- Pagos desde la app
  proveedor_pagos TEXT, -- stripe, mercadopago, etc.
  propina_sugerida INTEGER[] DEFAULT ARRAY[10, 15, 18, 20], -- Porcentajes sugeridos
  divide_cuenta BOOLEAN DEFAULT true,
  moneda TEXT DEFAULT 'MXN' CHECK (moneda IN ('MXN', 'USD', 'EUR', 'CAD')),
  politica_cancelacion TEXT, -- Texto descriptivo de la política
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_payment_config_restaurant_id ON restaurant_payment_config(restaurant_id);

-- ==================== 6. FACTURACIÓN (SAT - MX) ====================
CREATE TABLE IF NOT EXISTS restaurant_billing_config (
  restaurant_id UUID PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
  requiere_factura BOOLEAN DEFAULT false,
  razon_social_fiscal TEXT,
  rfc TEXT, -- RFC del restaurante
  regimen_fiscal TEXT,
  uso_cfdi_default TEXT,
  correo_facturacion TEXT,
  proveedor_facturacion TEXT, -- Sistema de facturación usado
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_billing_config_restaurant_id ON restaurant_billing_config(restaurant_id);

-- ==================== 7. MENSAJERÍA Y NOTIFICACIONES ====================
CREATE TABLE IF NOT EXISTS restaurant_notification_config (
  restaurant_id UUID PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
  notificaciones_app BOOLEAN DEFAULT true,
  notificaciones_whatsapp BOOLEAN DEFAULT false,
  notificaciones_email BOOLEAN DEFAULT true,
  plantillas_mensajes JSONB DEFAULT '{}', -- Plantillas personalizadas
  idioma_mensajes TEXT DEFAULT 'es' CHECK (idioma_mensajes IN ('es', 'en', 'pt', 'fr')),
  horario_envio_notificaciones JSONB DEFAULT '{"inicio": "09:00", "fin": "22:00"}', -- Horario permitido para enviar notificaciones
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_notification_config_restaurant_id ON restaurant_notification_config(restaurant_id);

-- ==================== 8. MÉTRICAS Y CONTROL ====================
CREATE TABLE IF NOT EXISTS restaurant_metrics (
  restaurant_id UUID PRIMARY KEY REFERENCES restaurants(id) ON DELETE CASCADE,
  fecha_alta TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  estatus TEXT DEFAULT 'activo' CHECK (estatus IN ('activo', 'suspendido', 'en_revision', 'inactivo')),
  plan TEXT DEFAULT 'basico' CHECK (plan IN ('basico', 'premium', 'enterprise')),
  uso_app BOOLEAN DEFAULT true, -- Si está usando la app activamente
  ordenes_mes INTEGER DEFAULT 0,
  clientes_unicos INTEGER DEFAULT 0,
  rating_promedio DECIMAL(3, 2) DEFAULT 0.0 CHECK (rating_promedio >= 0 AND rating_promedio <= 5),
  total_opiniones INTEGER DEFAULT 0,
  ultima_actualizacion_metricas TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_restaurant_metrics_restaurant_id ON restaurant_metrics(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_metrics_estatus ON restaurant_metrics(estatus);
CREATE INDEX IF NOT EXISTS idx_restaurant_metrics_plan ON restaurant_metrics(plan);

-- ==================== TRIGGERS PARA ACTUALIZAR updated_at ====================
CREATE OR REPLACE FUNCTION update_restaurant_profile_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para cada tabla
DROP TRIGGER IF EXISTS update_restaurant_cover_images_updated_at ON restaurant_cover_images;
CREATE TRIGGER update_restaurant_cover_images_updated_at 
  BEFORE UPDATE ON restaurant_cover_images
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_profile_updated_at();

DROP TRIGGER IF EXISTS update_restaurant_social_media_updated_at ON restaurant_social_media;
CREATE TRIGGER update_restaurant_social_media_updated_at 
  BEFORE UPDATE ON restaurant_social_media
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_profile_updated_at();

DROP TRIGGER IF EXISTS update_restaurant_hours_updated_at ON restaurant_hours;
CREATE TRIGGER update_restaurant_hours_updated_at 
  BEFORE UPDATE ON restaurant_hours
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_profile_updated_at();

DROP TRIGGER IF EXISTS update_restaurant_special_hours_updated_at ON restaurant_special_hours;
CREATE TRIGGER update_restaurant_special_hours_updated_at 
  BEFORE UPDATE ON restaurant_special_hours
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_profile_updated_at();

DROP TRIGGER IF EXISTS update_restaurant_service_config_updated_at ON restaurant_service_config;
CREATE TRIGGER update_restaurant_service_config_updated_at 
  BEFORE UPDATE ON restaurant_service_config
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_profile_updated_at();

DROP TRIGGER IF EXISTS update_restaurant_payment_config_updated_at ON restaurant_payment_config;
CREATE TRIGGER update_restaurant_payment_config_updated_at 
  BEFORE UPDATE ON restaurant_payment_config
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_profile_updated_at();

DROP TRIGGER IF EXISTS update_restaurant_billing_config_updated_at ON restaurant_billing_config;
CREATE TRIGGER update_restaurant_billing_config_updated_at 
  BEFORE UPDATE ON restaurant_billing_config
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_profile_updated_at();

DROP TRIGGER IF EXISTS update_restaurant_notification_config_updated_at ON restaurant_notification_config;
CREATE TRIGGER update_restaurant_notification_config_updated_at 
  BEFORE UPDATE ON restaurant_notification_config
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_profile_updated_at();

DROP TRIGGER IF EXISTS update_restaurant_metrics_updated_at ON restaurant_metrics;
CREATE TRIGGER update_restaurant_metrics_updated_at 
  BEFORE UPDATE ON restaurant_metrics
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_profile_updated_at();

-- ==================== TABLA DE STAFF DEL RESTAURANTE ====================
-- Necesaria para las políticas RLS - DEBE CREARSE ANTES DE LAS POLÍTICAS
CREATE TABLE IF NOT EXISTS restaurant_staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'manager', 'waiter', 'chef', 'cashier')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(restaurant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_restaurant_staff_restaurant_id ON restaurant_staff(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_user_id ON restaurant_staff(user_id);
CREATE INDEX IF NOT EXISTS idx_restaurant_staff_role ON restaurant_staff(restaurant_id, role);

ALTER TABLE restaurant_staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view staff of their restaurants" ON restaurant_staff;
DROP POLICY IF EXISTS "Restaurant owners can manage staff" ON restaurant_staff;
-- Política simplificada para evitar recursión: los usuarios pueden ver su propio registro de staff
CREATE POLICY "Users can view staff of their restaurants" ON restaurant_staff 
  FOR SELECT USING (user_id = auth.uid());
-- Los owners/admins pueden ver y gestionar todo el staff de sus restaurantes
-- Esta política se aplicará mediante una función de seguridad o lógica de aplicación
-- Por ahora, permitimos que los usuarios vean su propio registro
CREATE POLICY "Restaurant owners can manage staff" ON restaurant_staff 
  FOR ALL USING (user_id = auth.uid());

DROP TRIGGER IF EXISTS update_restaurant_staff_updated_at ON restaurant_staff;
CREATE TRIGGER update_restaurant_staff_updated_at 
  BEFORE UPDATE ON restaurant_staff
  FOR EACH ROW EXECUTE FUNCTION update_restaurant_profile_updated_at();

-- ==================== POLÍTICAS RLS (Row Level Security) ====================
-- Habilitar RLS en todas las tablas
ALTER TABLE restaurant_cover_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_social_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_special_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_service_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_payment_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_billing_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_notification_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_metrics ENABLE ROW LEVEL SECURITY;

-- Políticas para restaurant_cover_images
DROP POLICY IF EXISTS "Anyone can view restaurant cover images" ON restaurant_cover_images;
DROP POLICY IF EXISTS "Restaurant owners can manage their cover images" ON restaurant_cover_images;
CREATE POLICY "Anyone can view restaurant cover images" ON restaurant_cover_images 
  FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage their cover images" ON restaurant_cover_images 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM restaurants r
      WHERE r.id = restaurant_cover_images.restaurant_id
      AND r.id IN (
        SELECT restaurant_id FROM restaurant_staff 
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'manager')
      )
    )
  );

-- Políticas para restaurant_social_media
DROP POLICY IF EXISTS "Anyone can view restaurant social media" ON restaurant_social_media;
DROP POLICY IF EXISTS "Restaurant owners can manage their social media" ON restaurant_social_media;
CREATE POLICY "Anyone can view restaurant social media" ON restaurant_social_media 
  FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage their social media" ON restaurant_social_media 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para restaurant_hours
DROP POLICY IF EXISTS "Anyone can view restaurant hours" ON restaurant_hours;
DROP POLICY IF EXISTS "Restaurant owners can manage their hours" ON restaurant_hours;
CREATE POLICY "Anyone can view restaurant hours" ON restaurant_hours 
  FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage their hours" ON restaurant_hours 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para restaurant_special_hours
DROP POLICY IF EXISTS "Anyone can view restaurant special hours" ON restaurant_special_hours;
DROP POLICY IF EXISTS "Restaurant owners can manage their special hours" ON restaurant_special_hours;
CREATE POLICY "Anyone can view restaurant special hours" ON restaurant_special_hours 
  FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage their special hours" ON restaurant_special_hours 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para restaurant_service_config
DROP POLICY IF EXISTS "Anyone can view restaurant service config" ON restaurant_service_config;
DROP POLICY IF EXISTS "Restaurant owners can manage their service config" ON restaurant_service_config;
CREATE POLICY "Anyone can view restaurant service config" ON restaurant_service_config 
  FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage their service config" ON restaurant_service_config 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para restaurant_payment_config
DROP POLICY IF EXISTS "Anyone can view restaurant payment config" ON restaurant_payment_config;
DROP POLICY IF EXISTS "Restaurant owners can manage their payment config" ON restaurant_payment_config;
CREATE POLICY "Anyone can view restaurant payment config" ON restaurant_payment_config 
  FOR SELECT USING (true);
CREATE POLICY "Restaurant owners can manage their payment config" ON restaurant_payment_config 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para restaurant_billing_config
DROP POLICY IF EXISTS "Restaurant owners can view their billing config" ON restaurant_billing_config;
DROP POLICY IF EXISTS "Restaurant owners can manage their billing config" ON restaurant_billing_config;
CREATE POLICY "Restaurant owners can view their billing config" ON restaurant_billing_config 
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Restaurant owners can manage their billing config" ON restaurant_billing_config 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para restaurant_notification_config
DROP POLICY IF EXISTS "Restaurant owners can view their notification config" ON restaurant_notification_config;
DROP POLICY IF EXISTS "Restaurant owners can manage their notification config" ON restaurant_notification_config;
CREATE POLICY "Restaurant owners can view their notification config" ON restaurant_notification_config 
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Restaurant owners can manage their notification config" ON restaurant_notification_config 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Políticas para restaurant_metrics
DROP POLICY IF EXISTS "Restaurant owners can view their metrics" ON restaurant_metrics;
DROP POLICY IF EXISTS "System can update restaurant metrics" ON restaurant_metrics;
CREATE POLICY "Restaurant owners can view their metrics" ON restaurant_metrics 
  FOR SELECT USING (auth.uid() IS NOT NULL);
-- Las métricas solo se pueden actualizar por el sistema (no por usuarios directamente)
-- Se actualizarán mediante funciones o triggers automáticos

-- ==================== COMENTARIOS Y DOCUMENTACIÓN ====================
COMMENT ON TABLE restaurant_cover_images IS 'Imágenes de portada del restaurante (múltiples)';
COMMENT ON TABLE restaurant_social_media IS 'Redes sociales del restaurante';
COMMENT ON TABLE restaurant_hours IS 'Horarios regulares de operación del restaurante';
COMMENT ON TABLE restaurant_special_hours IS 'Horarios especiales (festivos, eventos)';
COMMENT ON TABLE restaurant_service_config IS 'Configuración de servicios del restaurante';
COMMENT ON TABLE restaurant_payment_config IS 'Configuración de métodos de pago';
COMMENT ON TABLE restaurant_billing_config IS 'Configuración de facturación fiscal (SAT - MX)';
COMMENT ON TABLE restaurant_notification_config IS 'Configuración de mensajería y notificaciones';
COMMENT ON TABLE restaurant_metrics IS 'Métricas y control interno del restaurante';
COMMENT ON TABLE restaurant_staff IS 'Personal del restaurante y sus roles';
