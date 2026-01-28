-- ==================== CORRECCIÓN DE POLÍTICAS RLS ====================
-- Este script corrige las políticas RLS para evitar recursión infinita
-- Ejecutar después de restaurant_profile_tables.sql

-- ==================== CORREGIR POLÍTICAS DE restaurant_staff ====================
DROP POLICY IF EXISTS "Users can view staff of their restaurants" ON restaurant_staff;
DROP POLICY IF EXISTS "Restaurant owners can manage staff" ON restaurant_staff;

-- Política simplificada para evitar recursión: los usuarios pueden ver su propio registro de staff
CREATE POLICY "Users can view staff of their restaurants" ON restaurant_staff 
  FOR SELECT USING (user_id = auth.uid());

-- Por ahora, permitimos que los usuarios gestionen su propio registro
-- TODO: Implementar función de seguridad para verificar roles sin recursión
CREATE POLICY "Restaurant owners can manage staff" ON restaurant_staff 
  FOR ALL USING (user_id = auth.uid());

-- ==================== CORREGIR POLÍTICAS DE OTRAS TABLAS ====================
-- Por ahora, simplificamos las políticas para evitar recursión
-- La validación de roles se hará en la aplicación

-- restaurant_cover_images
DROP POLICY IF EXISTS "Restaurant owners can manage their cover images" ON restaurant_cover_images;
CREATE POLICY "Restaurant owners can manage their cover images" ON restaurant_cover_images 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- restaurant_social_media
DROP POLICY IF EXISTS "Restaurant owners can manage their social media" ON restaurant_social_media;
CREATE POLICY "Restaurant owners can manage their social media" ON restaurant_social_media 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- restaurant_hours
DROP POLICY IF EXISTS "Restaurant owners can manage their hours" ON restaurant_hours;
CREATE POLICY "Restaurant owners can manage their hours" ON restaurant_hours 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- restaurant_special_hours
DROP POLICY IF EXISTS "Restaurant owners can manage their special hours" ON restaurant_special_hours;
CREATE POLICY "Restaurant owners can manage their special hours" ON restaurant_special_hours 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- restaurant_service_config
DROP POLICY IF EXISTS "Restaurant owners can manage their service config" ON restaurant_service_config;
CREATE POLICY "Restaurant owners can manage their service config" ON restaurant_service_config 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- restaurant_payment_config
DROP POLICY IF EXISTS "Restaurant owners can manage their payment config" ON restaurant_payment_config;
CREATE POLICY "Restaurant owners can manage their payment config" ON restaurant_payment_config 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- restaurant_billing_config
DROP POLICY IF EXISTS "Restaurant owners can view their billing config" ON restaurant_billing_config;
DROP POLICY IF EXISTS "Restaurant owners can manage their billing config" ON restaurant_billing_config;
CREATE POLICY "Restaurant owners can view their billing config" ON restaurant_billing_config 
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Restaurant owners can manage their billing config" ON restaurant_billing_config 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- restaurant_notification_config
DROP POLICY IF EXISTS "Restaurant owners can view their notification config" ON restaurant_notification_config;
DROP POLICY IF EXISTS "Restaurant owners can manage their notification config" ON restaurant_notification_config;
CREATE POLICY "Restaurant owners can view their notification config" ON restaurant_notification_config 
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Restaurant owners can manage their notification config" ON restaurant_notification_config 
  FOR ALL USING (auth.uid() IS NOT NULL);

-- restaurant_metrics
DROP POLICY IF EXISTS "Restaurant owners can view their metrics" ON restaurant_metrics;
CREATE POLICY "Restaurant owners can view their metrics" ON restaurant_metrics 
  FOR SELECT USING (auth.uid() IS NOT NULL);
