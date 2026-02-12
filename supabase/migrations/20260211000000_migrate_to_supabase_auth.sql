-- ==================== MIGRACIÓN A SUPABASE AUTH ====================
-- Esta migración adapta el sistema de autenticación simple a Supabase Auth
-- Ejecutar en Supabase SQL Editor

-- ==================== 1. MODIFICAR TABLA USERS ====================

-- Agregar columnas necesarias para compatibilidad con Supabase Auth
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Crear índice para auth_user_id
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- Hacer auth_user_id único (un usuario de auth solo puede tener un registro en users)
ALTER TABLE public.users 
ADD CONSTRAINT unique_auth_user_id UNIQUE (auth_user_id);

-- Remover la restricción UNIQUE de email temporalmente para permitir migración
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_email_key;

-- ==================== 2. CREAR FUNCIÓN DE MANEJO DE NUEVOS USUARIOS ====================

-- Función que se ejecuta cuando un nuevo usuario se registra en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar en public.users cuando se crea un usuario en auth.users
  INSERT INTO public.users (
    id,
    auth_user_id,
    email,
    name,
    phone,
    preferred_language,
    is_active,
    email_verified,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,  -- Usar el mismo UUID de auth.users
    NEW.id,  -- Referencia a auth.users
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email), -- Nombre desde metadata o email
    NEW.phone,
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'es'),
    true,
    NEW.email_confirmed_at IS NOT NULL,
    NEW.created_at,
    NEW.updated_at
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== 3. CREAR TRIGGER PARA NUEVOS USUARIOS ====================

-- Trigger que ejecuta la función cuando se inserta un usuario en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==================== 4. ACTUALIZAR POLÍTICAS RLS ====================

-- Deshabilitar RLS temporalmente para hacer cambios
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_staff DISABLE ROW LEVEL SECURITY;

-- Eliminar todas las políticas existentes
DROP POLICY IF EXISTS "Authenticated users can view users" ON public.users;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

DROP POLICY IF EXISTS "Authenticated users can insert restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Anyone can view active restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Authenticated users can view all restaurants" ON public.restaurants;
DROP POLICY IF EXISTS "Authenticated users can update restaurants" ON public.restaurants;

DROP POLICY IF EXISTS "Authenticated users can insert staff records" ON public.restaurant_staff;
DROP POLICY IF EXISTS "Authenticated users can view staff records" ON public.restaurant_staff;
DROP POLICY IF EXISTS "Authenticated users can update staff records" ON public.restaurant_staff;

-- ==================== 5. NUEVAS POLÍTICAS RLS CON auth.uid() ====================

-- Habilitar RLS nuevamente
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA USERS
CREATE POLICY "Users can view all users" ON public.users
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can insert own profile" ON public.users
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- POLÍTICAS PARA RESTAURANTS
CREATE POLICY "Anyone can view active restaurants" ON public.restaurants
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can view all restaurants" ON public.restaurants
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert restaurants" ON public.restaurants
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Restaurant owners can update restaurants" ON public.restaurants
  FOR UPDATE USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.restaurant_staff 
      WHERE restaurant_id = restaurants.id 
      AND user_id = auth.uid() 
      AND role = 'owner' 
      AND is_active = true
    )
  );

-- POLÍTICAS PARA RESTAURANT_STAFF
CREATE POLICY "Users can insert own staff record" ON public.restaurant_staff
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view staff records" ON public.restaurant_staff
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      user_id = auth.uid() OR  -- Pueden ver su propio registro
      EXISTS (  -- O si son staff del mismo restaurante
        SELECT 1 FROM public.restaurant_staff rs2 
        WHERE rs2.restaurant_id = restaurant_staff.restaurant_id 
        AND rs2.user_id = auth.uid() 
        AND rs2.is_active = true
      )
    )
  );

CREATE POLICY "Users can update own staff record" ON public.restaurant_staff
  FOR UPDATE USING (auth.uid() = user_id);

-- ==================== 6. ACTUALIZAR OTRAS TABLAS PARA USAR auth.uid() ====================

-- Habilitar RLS en tablas que lo necesiten
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite_dishes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para orders
CREATE POLICY "Users can view own orders" ON public.orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own orders" ON public.orders
  FOR UPDATE USING (auth.uid() = user_id);

-- Políticas para cart_items
CREATE POLICY "Users can manage own cart" ON public.cart_items
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para favorite_dishes
CREATE POLICY "Users can manage own favorites" ON public.favorite_dishes
  FOR ALL USING (auth.uid() = user_id);

-- Políticas para user_profiles
CREATE POLICY "Users can manage own profile" ON public.user_profiles
  FOR ALL USING (auth.uid() = user_id);

-- ==================== 7. FUNCIÓN PARA MIGRAR DATOS EXISTENTES ====================

-- Esta función debe ejecutarse DESPUÉS de que los usuarios existentes 
-- se hayan registrado nuevamente con Supabase Auth
CREATE OR REPLACE FUNCTION public.migrate_existing_user_data(
  old_user_id UUID,
  new_auth_user_id UUID
) RETURNS BOOLEAN AS $$
BEGIN
  -- Actualizar el registro en users para vincularlo con auth.users
  UPDATE public.users 
  SET auth_user_id = new_auth_user_id
  WHERE id = old_user_id;

  -- Actualizar todas las referencias en otras tablas
  UPDATE public.restaurant_staff SET user_id = new_auth_user_id WHERE user_id = old_user_id;
  UPDATE public.orders SET user_id = new_auth_user_id WHERE user_id = old_user_id;
  UPDATE public.cart_items SET user_id = new_auth_user_id WHERE user_id = old_user_id;
  UPDATE public.favorite_dishes SET user_id = new_auth_user_id WHERE user_id = old_user_id;
  UPDATE public.user_profiles SET user_id = new_auth_user_id WHERE user_id = old_user_id;
  UPDATE public.contacts SET user_id = new_auth_user_id WHERE user_id = old_user_id;
  UPDATE public.waitlist_entries SET user_id = new_auth_user_id WHERE user_id = old_user_id;
  UPDATE public.assistance_requests SET user_id = new_auth_user_id WHERE user_id = old_user_id;
  UPDATE public.reviews SET user_id = new_auth_user_id WHERE user_id = old_user_id;
  UPDATE public.user_payment_methods SET user_id = new_auth_user_id WHERE user_id = old_user_id;
  UPDATE public.user_transactions SET user_id = new_auth_user_id WHERE user_id = old_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== 8. CONFIGURACIÓN DE SUPABASE AUTH ====================

-- Habilitar registro por email
-- (Esto se hace en el dashboard de Supabase, no por SQL)

-- ==================== NOTAS IMPORTANTES ====================
-- 
-- 1. ANTES de ejecutar esta migración:
--    - Haz backup de la base de datos
--    - Asegúrate de que Supabase Auth esté habilitado
--    - Configura las URLs de redirección en Supabase
-- 
-- 2. DESPUÉS de ejecutar esta migración:
--    - Los usuarios existentes necesitarán registrarse nuevamente
--    - O usar la función migrate_existing_user_data() para cada usuario
--    - Actualizar el código de la aplicación para usar Supabase Auth
-- 
-- 3. CONFIGURACIÓN EN SUPABASE DASHBOARD:
--    - Authentication > Settings > Enable email confirmations
--    - Authentication > URL Configuration > Site URL y Redirect URLs
--    - Authentication > Providers > Habilitar Email
-- 
-- 4. VARIABLES DE ENTORNO NECESARIAS:
--    - REACT_APP_SUPABASE_URL (ya existe)
--    - REACT_APP_SUPABASE_ANON_KEY (ya existe)
--    - No se necesitan variables adicionales para auth