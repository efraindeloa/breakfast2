-- ==================== ARREGLAR RECURSIÓN INFINITA EN POLÍTICAS RLS ====================
-- Este script corrige las políticas RLS que causan recursión infinita

-- ==================== 1. ELIMINAR POLÍTICAS PROBLEMÁTICAS ====================

-- Eliminar todas las políticas de restaurant_staff que causan recursión
DROP POLICY IF EXISTS "Users can insert own staff record" ON public.restaurant_staff;
DROP POLICY IF EXISTS "Users can view staff records" ON public.restaurant_staff;
DROP POLICY IF EXISTS "Users can update own staff record" ON public.restaurant_staff;
DROP POLICY IF EXISTS "Restaurant owners can update restaurants" ON public.restaurants;

-- ==================== 2. CREAR POLÍTICAS SIMPLES Y SEGURAS ====================

-- RESTAURANT_STAFF: Políticas más simples sin recursión
CREATE POLICY "Enable insert for authenticated users" ON public.restaurant_staff
  FOR INSERT 
  TO authenticated 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Enable select for authenticated users" ON public.restaurant_staff
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id);

CREATE POLICY "Enable update for own records" ON public.restaurant_staff
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RESTAURANTS: Política más simple para updates
CREATE POLICY "Enable update for restaurant owners" ON public.restaurants
  FOR UPDATE 
  TO authenticated 
  USING (
    auth.uid() IN (
      SELECT user_id 
      FROM public.restaurant_staff 
      WHERE restaurant_id = restaurants.id 
      AND role = 'owner' 
      AND is_active = true
    )
  );

-- ==================== 3. POLÍTICAS ADICIONALES PARA OTRAS TABLAS ====================

-- PRODUCTS: Permitir acceso a productos
CREATE POLICY "Enable select for all users" ON public.products
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Enable all for restaurant staff" ON public.products
  FOR ALL 
  TO authenticated 
  USING (
    restaurant_id IN (
      SELECT restaurant_id 
      FROM public.restaurant_staff 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

-- ORDERS: Políticas básicas
CREATE POLICY "Enable select for own orders" ON public.orders
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Enable insert for authenticated users" ON public.orders
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for own orders" ON public.orders
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ORDER_HISTORY: Políticas básicas
CREATE POLICY "Enable select for own order history" ON public.order_history
  FOR SELECT 
  TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Enable insert for authenticated users" ON public.order_history
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- CART_ITEMS: Políticas básicas
CREATE POLICY "Enable all for own cart" ON public.cart_items
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- FAVORITE_DISHES: Políticas básicas
CREATE POLICY "Enable all for own favorites" ON public.favorite_dishes
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- USER_PROFILES: Políticas básicas
CREATE POLICY "Enable all for own profile" ON public.user_profiles
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- CONTACTS: Políticas básicas
CREATE POLICY "Enable all for own contacts" ON public.contacts
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- WAITLIST_ENTRIES: Políticas básicas
CREATE POLICY "Enable all for own waitlist entries" ON public.waitlist_entries
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- ASSISTANCE_REQUESTS: Políticas básicas
CREATE POLICY "Enable all for own assistance requests" ON public.assistance_requests
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- REVIEWS: Políticas básicas
CREATE POLICY "Enable select for all users" ON public.reviews
  FOR SELECT 
  USING (true);

CREATE POLICY "Enable insert for authenticated users" ON public.reviews
  FOR INSERT 
  TO authenticated 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Enable update for own reviews" ON public.reviews
  FOR UPDATE 
  TO authenticated 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- USER_PAYMENT_METHODS: Políticas básicas
CREATE POLICY "Enable all for own payment methods" ON public.user_payment_methods
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- USER_TRANSACTIONS: Políticas básicas
CREATE POLICY "Enable all for own transactions" ON public.user_transactions
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- LOYALTY_DATA: Políticas básicas
CREATE POLICY "Enable all for own loyalty data" ON public.loyalty_data
  FOR ALL 
  TO authenticated 
  USING (user_id = auth.uid());

-- ==================== 4. VERIFICAR POLÍTICAS ====================

-- Verificar que las políticas se crearon correctamente
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('restaurant_staff', 'restaurants', 'products', 'orders')
ORDER BY tablename, policyname;

-- ==================== NOTAS IMPORTANTES ====================
-- 
-- 1. Estas políticas son más simples y evitan la recursión
-- 2. Mantienen la seguridad básica: usuarios solo ven sus datos
-- 3. Los dueños de restaurantes pueden actualizar sus restaurantes
-- 4. Los productos son visibles para todos (is_active = true)
-- 5. El staff de restaurantes puede gestionar productos de su restaurante
-- 
-- Si necesitas políticas más complejas, agrégalas gradualmente
-- y prueba cada una para evitar recursión.