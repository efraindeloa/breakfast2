import { supabase, isSupabaseConfigured, getSupabaseUrl } from '../config/supabase';
import { HistoricalOrder, HistoricalOrderItem, Order, OrderStatus } from '../types/order';

// Helper para obtener el idioma actual desde localStorage
const getCurrentLanguage = (): string => {
  const savedCode = localStorage.getItem('appLanguage');
  if (savedCode === 'en' || savedCode === 'pt' || savedCode === 'fr') {
    return savedCode;
  }
  // Fallback al nombre del idioma guardado
  const savedName = localStorage.getItem('selectedLanguage');
  if (savedName === 'English' || savedName === 'Inglés') return 'en';
  if (savedName === 'Português' || savedName === 'Portugués') return 'pt';
  if (savedName === 'Français' || savedName === 'Francés') return 'fr';
  return 'es'; // Por defecto español
};

// ==================== TIPOS ====================

export interface Order {
  id: string;
  user_id: string;
  restaurant_id: string;
  status: string;
  total: number;
  items: OrderItem[];
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image?: string;
}

export interface CartItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  image?: string;
  dish_id?: number; // Para compatibilidad con la base de datos
}

export interface FavoriteDish {
  id: number;
  name: string;
  price: number;
  image?: string;
  category: string;
}

export interface SavedCombination {
  id: string;
  name: string;
  dishes: number[];
  createdAt: Date;
  lastUsed?: Date;
}

export interface LoyaltyData {
  user_id: string;
  total_points: number;
  current_level: 'bronze' | 'silver' | 'gold' | 'platinum';
  monthly_growth: number;
  points_history: Array<{
    date: string;
    points: number;
    reason: string;
  }>;
}

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  phone?: string;
  email?: string;
  avatar?: string;
  created_at: string;
}

export interface WaitlistEntry {
  id: string;
  user_id: string;
  restaurant_id: string;
  zones: string[];
  number_of_people: number;
  position: number;
  estimated_wait_minutes: number;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface AssistanceRequest {
  id: string;
  user_id: string;
  restaurant_id: string;
  type: string;
  status: 'sent' | 'cancelled' | 'completed';
  created_at: string;
}

export interface Review {
  id: string;
  user_id: string;
  dish_id: number;
  rating: number;
  comment?: string;
  created_at: string;
  updated_at?: string;
}

export interface Product {
  id: number;
  restaurant_id: string;
  name: string;
  description: string;
  price: string;
  image_url?: string;
  image?: string; // Para compatibilidad
  badges?: string[];
  category: string;
  origin: string;
  is_active: boolean;
  is_featured?: boolean;
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

// ==================== HELPERS ====================

// Función para generar un UUID v4 válido
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Función para validar si un string es un UUID válido
const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Función para obtener el ID del usuario autenticado (requiere autenticación)
const getAuthenticatedUserId = async (): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.warn('[getAuthenticatedUserId] Error getting session:', error);
      return null;
    }
    
    if (session?.user?.id) {
      return session.user.id;
    }
    
    return null;
  } catch (error) {
    console.warn('[getAuthenticatedUserId] Error:', error);
    return null;
  }
};

// Función para verificar que el usuario autenticado existe en la tabla users
// Si no existe, lanza un error (el usuario debe registrarse primero)
const ensureUserExists = async (userId: string): Promise<void> => {
  if (!isSupabaseConfigured()) return;
  
  try {
    // Verificar si el usuario existe en la tabla users
    const { data: existingUser, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('[ensureUserExists] Error checking user existence:', checkError);
      throw new Error('Error verificando usuario en la base de datos');
    }
    
    // Si el usuario existe, no hacer nada
    if (existingUser) {
      return;
    }
    
    // Si no existe, lanzar error - el usuario debe registrarse primero
    console.error('[ensureUserExists] Authenticated user does not exist in database:', userId);
    throw new Error('Usuario no registrado. Por favor, completa el registro primero.');
  } catch (error) {
    console.error('[ensureUserExists] Error:', error);
    throw error;
  }
};

const fallbackToLocalStorage = <T>(
  key: string,
  defaultValue: T,
  operation: 'get' | 'set',
  value?: T
): T | null => {
  if (operation === 'get') {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } else {
    localStorage.setItem(key, JSON.stringify(value));
    return null;
  }
};

// ==================== ÓRDENES ====================

export const getOrders = async (): Promise<Order[]> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Cannot fetch orders.');
    return [];
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[getOrders] No authenticated user');
      return [];
    }
    
    // Verificar si hay datos pendientes de migración (después de cerrar sesión)
    const pendingOrders = localStorage.getItem('pending_orders_migration');
    if (pendingOrders) {
      try {
        const orders = JSON.parse(pendingOrders);
        // Restaurar las órdenes al user_id actual
        await ensureUserExists(userId);
        for (const order of orders) {
          await supabase.from('orders').upsert({
            id: order.id,
            user_id: userId,
            restaurant_id: order.restaurant_id,
            order_number: order.order_number,
            status: order.status,
            total: order.total,
            subtotal: order.subtotal,
            tax: order.tax,
            tip: order.tip,
            items: order.items,
            notes: order.notes,
            payment_method: order.payment_method,
            payment_status: order.payment_status,
            table_number: order.table_number,
            delivery_address: order.delivery_address,
            estimated_ready_time: order.estimated_ready_time,
            created_at: order.created_at,
            updated_at: order.updated_at,
          }, { onConflict: 'id' });
        }
        localStorage.removeItem('pending_orders_migration');
      } catch (restoreError) {
        console.warn('[getOrders] Error restoring pending orders:', restoreError);
      }
    }
    
    // Primero intentar obtener órdenes con el user_id actual
    let { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[getOrders] Supabase error:', error);
      throw error;
    }
    
    // Si no se encontraron órdenes, buscar órdenes recientes sin user_id o con user_id diferente
    // (solo para desarrollo - ayuda a recuperar órdenes huérfanas)
    if ((data || []).length === 0) {
      
      // Buscar órdenes creadas en las últimas 24 horas que no tengan el user_id actual
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      
      const { data: orphanedOrders, error: orphanedError } = await supabase
        .from('orders')
        .select('*')
        .gte('created_at', yesterday.toISOString())
        .neq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (!orphanedError && orphanedOrders && orphanedOrders.length > 0) {
        console.log('[getOrders] Found orphaned orders:', orphanedOrders);
        console.log('[getOrders] Orphaned order user_ids:', orphanedOrders.map(o => o.user_id));
        console.warn('[getOrders] WARNING: Found orders with different user_id. Consider updating them using fix_order_user_id.sql');
        
        // Opcional: Auto-corregir el user_id de órdenes huérfanas recientes
        // Descomentar si quieres que se actualicen automáticamente
        /*
        for (const order of orphanedOrders) {
          await supabase
            .from('orders')
            .update({ user_id: userId })
            .eq('id', order.id);
        }
        console.log('[getOrders] Auto-updated orphaned orders to current user_id');
        // Recargar después de actualizar
        const { data: updatedData } = await supabase
          .from('orders')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        data = updatedData;
        */
      }
    }
    
    // Mapear los datos de Supabase al formato Order esperado
    const mappedOrders = (data || []).map((order: any) => ({
      orderId: order.id, // Mapear id a orderId
      orderNumber: order.order_number ? parseInt(order.order_number.replace(/\D/g, '')) || 1 : 1,
      items: order.items || [],
      status: order.status as OrderStatus,
      timestamp: order.created_at || new Date().toISOString(),
    }));
    
    return mappedOrders;
  } catch (error) {
    console.error('[getOrders] Error fetching orders:', error);
    return [];
  }
};

export const createOrder = async (order: Omit<Order, 'id' | 'created_at' | 'updated_at'>): Promise<Order | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Cannot create order.');
    return null;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[updateOrderStatus] No authenticated user - login required');
      throw new Error('Authentication required');
    }
    
    // Validar que el status sea de una orden activa (no 'entregada' o 'cancelada')
    const activeStatuses = ['pending', 'orden_enviada', 'orden_recibida', 'en_preparacion', 'lista_para_entregar', 'en_entrega', 'con_incidencias'];
    if (!activeStatuses.includes(order.status)) {
      throw new Error(`Invalid status for active order: ${order.status}. Use moveOrderToHistory() for completed orders.`);
    }
    
    const { data, error } = await supabase
      .from('orders')
      .insert({
        user_id: userId,
        restaurant_id: order.restaurant_id,
        status: order.status,
        total: order.total,
        subtotal: order.total, // Si no se proporciona subtotal, usar total
        items: order.items,
        notes: order.notes,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating order:', error);
    return null;
  }
};

// ==================== HISTORIAL DE ÓRDENES ====================

/**
 * Guarda una orden completada en el historial (Supabase + localStorage)
 */
export const saveOrderHistory = async (historicalOrder: HistoricalOrder): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Cannot save order history.');
    return null;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[moveOrderToHistory] No authenticated user - login required');
      throw new Error('Authentication required');
    }
    
    // Convertir HistoricalOrder a formato de tabla order_history
    const orderData = {
      id: historicalOrder.id.startsWith('historical-') ? undefined : historicalOrder.id, // Generar nuevo UUID si es histórico
      user_id: userId,
      restaurant_id: '00000000-0000-0000-0000-000000000001', // ID del restaurante por defecto
      order_number: historicalOrder.transactionId?.toString() || null,
      status: historicalOrder.status === 'completada' ? 'entregada' : 'cancelada',
      total: historicalOrder.total,
      subtotal: historicalOrder.total,
      tax: 0,
      tip: 0,
      items: historicalOrder.items.map(item => ({
        id: item.id,
        name: item.name,
        price: parseFloat(item.price.replace(/[^0-9.]/g, '')) || 0,
        notes: item.notes || '',
        quantity: item.quantity,
      })),
      notes: null,
      payment_method: null,
      payment_status: 'completed',
      completed_at: historicalOrder.timestamp,
    };

    // Insertar directamente en order_history
    const { data, error } = await supabase
      .from('order_history')
      .insert({
        ...orderData,
        created_at: historicalOrder.timestamp, // Usar timestamp como created_at
      })
      .select()
      .single();

    if (error) throw error;
    return data.id;
  } catch (error) {
    console.error('Error saving order history to Supabase:', error);
    return null;
  }
};

/**
 * Obtiene el historial de órdenes completadas desde Supabase
 */
export const getOrderHistory = async (): Promise<HistoricalOrder[]> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Cannot fetch order history.');
    return [];
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[getOrderHistory] No authenticated user - login required');
      return [];
    }
    
    // Obtener órdenes completadas o canceladas desde order_history
    // Primero intentamos sin el JOIN para evitar errores si la relación no existe
    const { data, error } = await supabase
      .from('order_history')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Convertir a formato HistoricalOrder
    const historicalOrders: HistoricalOrder[] = (data || []).map((order: any) => {
      const completedDate = order.completed_at ? new Date(order.completed_at) : new Date(order.created_at);
      
      // Por ahora usamos valores por defecto para el restaurante
      // TODO: Obtener información del restaurante si es necesario
      return {
        id: order.id,
        restaurantName: 'DONK RESTAURANT', // Valor por defecto
        date: completedDate.toLocaleDateString('es-MX', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        }),
        time: completedDate.toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit'
        }),
        total: parseFloat(order.total) || 0,
        status: order.status === 'entregada' ? 'completada' : 'cancelada',
        items: (order.items || []).map((item: any) => ({
          id: item.id,
          name: item.name || `Item ${item.id}`,
          price: typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : item.price,
          notes: item.notes || '',
          quantity: item.quantity || 1,
        })),
        logo: '/logo-donk-restaurant.png', // Valor por defecto
        transactionId: order.order_number ? parseInt(order.order_number.replace(/\D/g, '')) : undefined,
        timestamp: completedDate.toISOString(),
      };
    });

    return historicalOrders;
  } catch (error) {
    console.error('Error fetching order history from Supabase:', error);
    return [];
  }
};

/**
 * Obtiene una orden histórica específica por ID
 */
export const getOrderHistoryById = async (orderId: string): Promise<HistoricalOrder | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Cannot fetch order history.');
    return null;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[getOrderById] No authenticated user - login required');
      return null;
    }
    
    // Buscar primero en order_history
    const { data, error } = await supabase
      .from('order_history')
      .select(`
        id,
        order_number,
        status,
        total,
        items,
        completed_at,
        created_at,
        restaurant_id,
        restaurants:restaurant_id (
          name,
          logo_url
        )
      `)
      .eq('id', orderId)
      .eq('user_id', userId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // Convertir a formato HistoricalOrder
    const completedDate = data.completed_at ? new Date(data.completed_at) : new Date(data.created_at);
      const restaurant = (data.restaurants as any) || {};
      
      return {
        id: data.id,
        restaurantName: restaurant?.name || 'DONK RESTAURANT',
      date: completedDate.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }),
      time: completedDate.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      total: parseFloat(data.total) || 0,
      status: data.status === 'entregada' ? 'completada' : 'cancelada',
      items: (data.items || []).map((item: any) => ({
        id: item.id,
        name: item.name || `Item ${item.id}`,
        price: typeof item.price === 'number' ? `$${item.price.toFixed(2)}` : item.price,
        notes: item.notes || '',
        quantity: item.quantity || 1,
      })),
        logo: restaurant?.logo_url || '/logo-donk-restaurant.png',
      transactionId: data.order_number ? parseInt(data.order_number.replace(/\D/g, '')) : undefined,
      timestamp: completedDate.toISOString(),
    };
  } catch (error) {
    console.error('Error fetching order from Supabase:', error);
    return null;
  }
};

export const updateOrder = async (orderId: string, updates: Partial<Order>): Promise<Order | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Cannot update order.');
    return null;
  }

  try {
    // Si el status cambia a 'entregada' o 'cancelada', mover a order_history
    if (updates.status && ['entregada', 'cancelada'].includes(updates.status)) {
      return await moveOrderToHistory(orderId, updates.status as 'entregada' | 'cancelada');
    }
    
    // Actualizar orden activa
    const { data, error } = await supabase
      .from('orders')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', orderId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating order:', error);
    return null;
  }
};

/**
 * Mueve una orden activa al historial usando la función de PostgreSQL
 */
export const moveOrderToHistory = async (orderId: string, status: 'entregada' | 'cancelada' = 'entregada'): Promise<Order | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured. Cannot move order to history.');
    return null;
  }

  try {
    // Usar la función de PostgreSQL para mover la orden
    const { data, error } = await supabase.rpc('move_order_to_history', {
      p_order_id: orderId,
      p_new_status: status
    });

    if (error) throw error;
    
    // La función retorna el ID de la orden en el historial
    // Necesitamos obtener la orden completa del historial
    if (data) {
      const historyOrder = await getOrderHistoryById(data);
      return historyOrder as any; // Convertir HistoricalOrder a Order para compatibilidad
    }
    
    return null;
  } catch (error) {
    console.error('Error moving order to history:', error);
    // Si falla, intentar insertar manualmente en order_history
    try {
      const { data: orderData, error: fetchError } = await supabase
        .from('orders')
        .select('*')
        .eq('id', orderId)
        .single();
      
      if (fetchError || !orderData) throw fetchError;
      
      // Insertar en order_history
      const { data: historyData, error: insertError } = await supabase
        .from('order_history')
        .insert({
          order_id: orderData.id,
          user_id: orderData.user_id,
          restaurant_id: orderData.restaurant_id,
          order_number: orderData.order_number,
          status: status,
          total: orderData.total,
          subtotal: orderData.subtotal || orderData.total,
          tax: orderData.tax || 0,
          tip: orderData.tip || 0,
          items: orderData.items,
          notes: orderData.notes,
          payment_method: orderData.payment_method,
          payment_status: 'completed',
          table_number: orderData.table_number,
          delivery_address: orderData.delivery_address,
          completed_at: new Date().toISOString(),
          created_at: orderData.created_at,
        })
        .select()
        .single();
      
      if (insertError) throw insertError;
      
      // Eliminar de orders
      await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);
      
      return historyData as any;
    } catch (manualError) {
      console.error('Error in manual move to history:', manualError);
      return null;
    }
  }
};

// ==================== CARRITO ====================

export const getCart = async (): Promise<CartItem[]> => {
  if (!isSupabaseConfigured()) {
    return fallbackToLocalStorage<CartItem[]>('cart', [], 'get') || [];
  }

  try {
    // Obtener la sesión actual de Supabase de forma asíncrona
    let userId: string | null = null;
    
    // Primero intentar obtener el usuario autenticado desde la sesión de Supabase
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.warn('[getCart] Error getting session:', sessionError);
    }
    
    if (session?.user?.id) {
      userId = session.user.id;
      console.log('[getCart] Using authenticated user ID:', userId);
      console.log('[getCart] Session user email:', session.user.email);
    }
    
    if (!userId) {
      console.warn('[getCart] No authenticated user - login required');
      return [];
    }
    
    // Obtener cart_items primero (sin JOIN para evitar problemas de RLS)
    console.log('[getCart] Fetching cart_items for user_id:', userId);
    const { data: cartItemsData, error: cartError } = await supabase
      .from('cart_items')
      .select('*')
      .eq('user_id', userId);

    if (cartError) {
      console.error('[getCart] Error fetching cart_items:', cartError);
      throw cartError;
    }
    
    console.log('[getCart] Found cart_items:', cartItemsData?.length || 0);
    
    if (!cartItemsData || cartItemsData.length === 0) {
      return [];
    }
    
    // Obtener los productos por separado para evitar problemas de RLS con JOINs
    const productIds = [...new Set(cartItemsData.map((item: any) => item.product_id).filter((id: any) => id != null))];
    console.log('[getCart] Fetching products for IDs:', productIds);
    
    let productsMap: Record<number, any> = {};
    if (productIds.length > 0) {
      const { data: productsData, error: productsError } = await supabase
        .from('products')
        .select('id, name, price, image_url')
        .in('id', productIds);
      
      if (productsError) {
        console.warn('[getCart] Error fetching products:', productsError);
      } else if (productsData) {
        productsData.forEach((p: any) => {
          productsMap[p.id] = p;
        });
        console.log('[getCart] Fetched products:', productsData.length);
      }
    }
    
    // Mapear cart_items con datos de productos
    const mappedCart = cartItemsData.map((item: any) => {
      const product = productsMap[item.product_id] || {};
      return {
        id: item.product_id || item.id,
        name: product.name || 'Producto',
        price: typeof product.price === 'number' ? product.price : parseFloat(product.price || '0'),
        quantity: item.quantity,
        notes: item.notes || '',
        image: product.image_url ? getProductImageUrl(product.image_url) : (product.image || ''),
      };
    });
    
    console.log('[getCart] Mapped cart items:', mappedCart.length);
    return mappedCart;
  } catch (error) {
    console.error('[getCart] Error fetching cart:', error);
    return fallbackToLocalStorage<CartItem[]>('cart', [], 'get') || [];
  }
};

export const setCart = async (items: CartItem[]): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    fallbackToLocalStorage('cart', items, 'set', items);
    return true;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[setCart] No authenticated user - login required');
      return false;
    }
    
    // Agrupar items por (product_id, notes) para evitar duplicados
    const groupedItems = items.reduce((acc: CartItem[], item) => {
      const existing = acc.find(i => i.id === item.id && (i.notes || '') === (item.notes || ''));
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        acc.push({ ...item });
      }
      return acc;
    }, []);

    // Si no hay items en la nueva lista, eliminar todos los items del carrito
    if (groupedItems.length === 0) {
      const { error: deleteError } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', userId);
      
      if (deleteError) {
        console.error('[setCart] Error deleting all cart items:', deleteError);
        throw deleteError;
      }
      
      return true;
    }

    // Obtener items actuales del carrito para identificar cuáles eliminar
    const { data: currentCartItems, error: fetchError } = await supabase
      .from('cart_items')
      .select('product_id, notes')
      .eq('user_id', userId);

    if (fetchError) {
      console.error('[setCart] Error fetching current cart items:', fetchError);
      // Continuar de todas formas, intentar upsert
    }

    // Identificar items que deben eliminarse (están en el carrito actual pero no en la nueva lista)
    if (currentCartItems && currentCartItems.length > 0) {
      const itemsToDelete = currentCartItems.filter(current => {
        const currentNotes = current.notes || '';
        return !groupedItems.some(item => 
          item.id === current.product_id && (item.notes || '') === currentNotes
        );
      });

      // Eliminar items que ya no están en la nueva lista
      for (const itemToDelete of itemsToDelete) {
        let deleteQuery = supabase
          .from('cart_items')
          .delete()
          .eq('user_id', userId)
          .eq('product_id', itemToDelete.product_id);
        
        // Manejar notes: si es null o '', usar is('notes', null)
        if (itemToDelete.notes === null || itemToDelete.notes === '') {
          deleteQuery = deleteQuery.is('notes', null);
        } else {
          deleteQuery = deleteQuery.eq('notes', itemToDelete.notes);
        }
        
        const { error: deleteItemError } = await deleteQuery;
        if (deleteItemError) {
          console.warn('[setCart] Error deleting item:', itemToDelete.product_id, deleteItemError);
        }
      }
    }

    // Usar upsert para cada item (actualiza si existe, inserta si no)
    // Esto evita condiciones de carrera y maneja duplicados automáticamente
    for (const item of groupedItems) {
      // Normalizar notes: usar null en lugar de string vacío para consistencia
      const normalizedNotes = (item.notes && item.notes.trim() !== '') ? item.notes : null;
      
      const { error: upsertError } = await supabase
        .from('cart_items')
        .upsert({
          product_id: item.id,
          restaurant_id: '00000000-0000-0000-0000-000000000001',
          quantity: item.quantity,
          notes: normalizedNotes,
          user_id: userId,
        }, {
          onConflict: 'user_id,product_id,notes'
        });

      if (upsertError) {
        console.error('[setCart] Error upserting item:', item.id, upsertError);
        // Si el upsert falla, intentar eliminar y luego insertar
        try {
          let deleteQuery = supabase
            .from('cart_items')
            .delete()
            .eq('user_id', userId)
            .eq('product_id', item.id);
          
          if (normalizedNotes === null) {
            deleteQuery = deleteQuery.is('notes', null);
          } else {
            deleteQuery = deleteQuery.eq('notes', normalizedNotes);
          }
          
          await deleteQuery;
          
          // Pequeña pausa antes de insertar
          await new Promise(resolve => setTimeout(resolve, 50));
          
          const { error: insertError } = await supabase
            .from('cart_items')
            .insert({
              product_id: item.id,
              restaurant_id: '00000000-0000-0000-0000-000000000001',
              quantity: item.quantity,
              notes: normalizedNotes,
              user_id: userId,
            });

          if (insertError) {
            console.error('[setCart] Error inserting item after delete:', item.id, insertError);
          }
        } catch (fallbackError) {
          console.error('[setCart] Error in fallback delete+insert:', fallbackError);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error setting cart:', error);
    fallbackToLocalStorage('cart', items, 'set', items);
    return false;
  }
};

export const addToCart = async (item: CartItem): Promise<boolean> => {
  // IDs > 10000 son combos/promociones especiales que no existen como productos en la BD
  // Estos se guardan solo en localStorage
  const isCombo = item.id > 10000;
  
  if (!isSupabaseConfigured() || isCombo) {
    const cart = await getCart();
    cart.push(item);
    fallbackToLocalStorage('cart', cart, 'set', cart);
    return true;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[addToCart] No authenticated user - login required');
      throw new Error('Authentication required');
    }
    
    // Asegurar que el usuario existe en la tabla users antes de agregar al carrito
    try {
      await ensureUserExists(userId);
    } catch (userError) {
      console.error('[addToCart] Failed to ensure user exists:', userError);
      // Si falla crear el usuario, usar localStorage como fallback
      const cart = await getCart();
      cart.push(item);
      fallbackToLocalStorage('cart', cart, 'set', cart);
      return false;
    }
    
    // Normalizar notes: usar null en lugar de cadena vacía para consistencia
    const notes = (item.notes && item.notes.trim() !== '') ? item.notes.trim() : null;
    
    // Primero intentar obtener el item existente para sumar la cantidad
    let query = supabase
      .from('cart_items')
      .select('id, quantity')
      .eq('user_id', userId)
      .eq('product_id', item.id);
    
    // Manejar notes: si es null, buscar NULL, si no, buscar el valor exacto
    if (notes === null) {
      query = query.is('notes', null);
    } else {
      query = query.eq('notes', notes);
    }

    const { data: existingItems, error: checkError } = await query.limit(1);

    // Si hay error y no es "no rows found", lanzar el error
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    // Calcular la nueva cantidad
    const existingQuantity = existingItems && existingItems.length > 0 ? existingItems[0].quantity : 0;
    const newQuantity = existingQuantity + (item.quantity || 1);

    // Si existe, actualizar cantidad
    if (existingItems && existingItems.length > 0) {
      const { error: updateError } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existingItems[0].id);

      if (updateError) throw updateError;
    } else {
      // Si no existe, insertar nuevo registro
      // Usar upsert con las columnas de la constraint única: user_id, product_id, notes
      const { error: upsertError } = await supabase
        .from('cart_items')
        .upsert({
          product_id: item.id,
          restaurant_id: '00000000-0000-0000-0000-000000000001', // ID del restaurante por defecto
          quantity: newQuantity,
          notes: notes,
          user_id: userId,
        }, {
          onConflict: 'user_id,product_id,notes'
        });

      if (upsertError) {
        // Si aún hay error, intentar actualizar manualmente (race condition)
        if (upsertError.code === '23505' || upsertError.code === 'PGRST204' || upsertError.code === '42703') {
          // Reintentar la búsqueda y actualización
          const { data: retryData, error: retryError } = await query.limit(1);
          if (!retryError && retryData && retryData.length > 0) {
            const finalQuantity = retryData[0].quantity + (item.quantity || 1);
            const { error: finalUpdateError } = await supabase
              .from('cart_items')
              .update({ quantity: finalQuantity })
              .eq('id', retryData[0].id);
            if (finalUpdateError) throw finalUpdateError;
          } else {
            throw upsertError;
          }
        } else {
          throw upsertError;
        }
      }
    }

    return true;
  } catch (error) {
    console.error('Error adding to cart:', error);
    const cart = await getCart();
    cart.push(item);
    fallbackToLocalStorage('cart', cart, 'set', cart);
    return false;
  }
};

export const removeFromCart = async (itemId: number, notes?: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    const cart = await getCart();
    const filtered = cart.filter(item => 
      item.id !== itemId || (notes !== undefined && item.notes !== notes)
    );
    fallbackToLocalStorage('cart', filtered, 'set', filtered);
    return true;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[removeFromCart] No authenticated user - login required');
      return;
    }
    let query = supabase
      .from('cart_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', itemId);

    if (notes !== undefined) {
      query = query.eq('notes', notes);
    }

    const { error } = await query;
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing from cart:', error);
    return false;
  }
};

export const clearCart = async (): Promise<boolean> => {
  return setCart([]);
};

// ==================== FAVORITOS ====================

export const getFavorites = async (): Promise<FavoriteDish[]> => {
  if (!isSupabaseConfigured()) {
    return fallbackToLocalStorage<FavoriteDish[]>('favorite_dishes', [], 'get') || [];
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[getFavorites] No authenticated user - login required');
      return [];
    }
    const { data, error } = await supabase
      .from('favorite_dishes')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return fallbackToLocalStorage<FavoriteDish[]>('favorite_dishes', [], 'get') || [];
  }
};

export const addFavorite = async (dish: FavoriteDish): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    const favorites = await getFavorites();
    if (!favorites.find(f => f.id === dish.id)) {
      favorites.push(dish);
      fallbackToLocalStorage('favorite_dishes', favorites, 'set', favorites);
    }
    return true;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[addToFavorites] No authenticated user - login required');
      throw new Error('Authentication required');
    }
    const { error } = await supabase
      .from('favorite_dishes')
      .insert({ ...dish, user_id: userId });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding favorite:', error);
    return false;
  }
};

export const removeFavorite = async (dishId: number): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    const favorites = await getFavorites();
    const filtered = favorites.filter(f => f.id !== dishId);
    fallbackToLocalStorage('favorite_dishes', filtered, 'set', filtered);
    return true;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[removeFromFavorites] No authenticated user - login required');
      return;
    }
    const { error } = await supabase
      .from('favorite_dishes')
      .delete()
      .eq('user_id', userId)
      .eq('id', dishId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing favorite:', error);
    return false;
  }
};

// ==================== LEALTAD ====================

export const getLoyaltyData = async (): Promise<LoyaltyData | null> => {
  if (!isSupabaseConfigured()) {
    return fallbackToLocalStorage<LoyaltyData>('loyalty_data', null, 'get');
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[getLoyaltyData] No authenticated user - login required');
      return null;
    }
    const { data, error } = await supabase
      .from('loyalty_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows returned
    return data || null;
  } catch (error) {
    console.error('Error fetching loyalty data:', error);
    return fallbackToLocalStorage<LoyaltyData>('loyalty_data', null, 'get');
  }
};

export const updateLoyaltyData = async (updates: Partial<LoyaltyData>): Promise<LoyaltyData | null> => {
  if (!isSupabaseConfigured()) {
    const current = await getLoyaltyData();
    const updated = { ...current, ...updates } as LoyaltyData;
    fallbackToLocalStorage('loyalty_data', updated, 'set', updated);
    return updated;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[updateLoyaltyData] No authenticated user - login required');
      throw new Error('Authentication required');
    }
    const { data, error } = await supabase
      .from('loyalty_data')
      .upsert({ ...updates, user_id: userId }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating loyalty data:', error);
    return null;
  }
};

// ==================== CONTACTOS ====================

export const getContacts = async (): Promise<Contact[]> => {
  if (!isSupabaseConfigured()) {
    return fallbackToLocalStorage<Contact[]>('user_contacts', [], 'get') || [];
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[getContacts] No authenticated user - login required');
      return [];
    }
    const { data, error } = await supabase
      .from('contacts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return fallbackToLocalStorage<Contact[]>('user_contacts', [], 'get') || [];
  }
};

export const addContact = async (contact: Omit<Contact, 'id' | 'user_id' | 'created_at'>): Promise<Contact | null> => {
  if (!isSupabaseConfigured()) {
    const newContact: Contact = {
      ...contact,
      id: `contact_${Date.now()}`,
      user_id: await getAuthenticatedUserId() || '',
      created_at: new Date().toISOString(),
    };
    const contacts = await getContacts();
    contacts.unshift(newContact);
    fallbackToLocalStorage('user_contacts', contacts, 'set', contacts);
    return newContact;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[addContact] No authenticated user - login required');
      return null;
    }
    const { data, error } = await supabase
      .from('contacts')
      .insert({ ...contact, user_id: userId })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding contact:', error);
    return null;
  }
};

export const updateContact = async (contactId: string, updates: Partial<Contact>): Promise<Contact | null> => {
  if (!isSupabaseConfigured()) {
    const contacts = await getContacts();
    const index = contacts.findIndex(c => c.id === contactId);
    if (index === -1) return null;
    
    contacts[index] = { ...contacts[index], ...updates };
    fallbackToLocalStorage('user_contacts', contacts, 'set', contacts);
    return contacts[index];
  }

  try {
    const { data, error } = await supabase
      .from('contacts')
      .update(updates)
      .eq('id', contactId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating contact:', error);
    return null;
  }
};

export const deleteContact = async (contactId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    const contacts = await getContacts();
    const filtered = contacts.filter(c => c.id !== contactId);
    fallbackToLocalStorage('user_contacts', filtered, 'set', filtered);
    return true;
  }

  try {
    const { error } = await supabase
      .from('contacts')
      .delete()
      .eq('id', contactId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting contact:', error);
    return false;
  }
};

// ==================== LISTA DE ESPERA ====================

export const getWaitlistEntries = async (): Promise<WaitlistEntry[]> => {
  if (!isSupabaseConfigured()) {
    return fallbackToLocalStorage<WaitlistEntry[]>('waitlist_data', [], 'get') || [];
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[getWaitlistEntries] No authenticated user - login required');
      return [];
    }
    const { data, error } = await supabase
      .from('waitlist_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching waitlist entries:', error);
    return fallbackToLocalStorage<WaitlistEntry[]>('waitlist_data', [], 'get') || [];
  }
};

export const createWaitlistEntry = async (
  entry: Omit<WaitlistEntry, 'id' | 'created_at' | 'updated_at'>
): Promise<WaitlistEntry | null> => {
  if (!isSupabaseConfigured()) {
    const newEntry: WaitlistEntry = {
      ...entry,
      id: `waitlist_${Date.now()}`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    const entries = await getWaitlistEntries();
    entries.unshift(newEntry);
    fallbackToLocalStorage('waitlist_data', entries, 'set', entries);
    return newEntry;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[addToWaitlist] No authenticated user - login required');
      throw new Error('Authentication required');
    }
    const { data, error } = await supabase
      .from('waitlist_entries')
      .insert({
        ...entry,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating waitlist entry:', error);
    return null;
  }
};

export const updateWaitlistEntry = async (
  entryId: string,
  updates: Partial<WaitlistEntry>
): Promise<WaitlistEntry | null> => {
  if (!isSupabaseConfigured()) {
    const entries = await getWaitlistEntries();
    const index = entries.findIndex(e => e.id === entryId);
    if (index === -1) return null;
    
    entries[index] = { ...entries[index], ...updates, updated_at: new Date().toISOString() };
    fallbackToLocalStorage('waitlist_data', entries, 'set', entries);
    return entries[index];
  }

  try {
    const { data, error } = await supabase
      .from('waitlist_entries')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', entryId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating waitlist entry:', error);
    return null;
  }
};

// ==================== SOLICITUDES DE ASISTENCIA ====================

export const getAssistanceRequests = async (): Promise<AssistanceRequest[]> => {
  if (!isSupabaseConfigured()) {
    return fallbackToLocalStorage<AssistanceRequest[]>('assistance_history', [], 'get') || [];
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[getAssistanceRequests] No authenticated user - login required');
      return [];
    }
    const { data, error } = await supabase
      .from('assistance_requests')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching assistance requests:', error);
    return fallbackToLocalStorage<AssistanceRequest[]>('assistance_history', [], 'get') || [];
  }
};

export const createAssistanceRequest = async (
  request: Omit<AssistanceRequest, 'id' | 'created_at'>
): Promise<AssistanceRequest | null> => {
  if (!isSupabaseConfigured()) {
    const newRequest: AssistanceRequest = {
      ...request,
      id: `assistance_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const requests = await getAssistanceRequests();
    requests.unshift(newRequest);
    fallbackToLocalStorage('assistance_history', requests, 'set', requests);
    return newRequest;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[requestAssistance] No authenticated user - login required');
      throw new Error('Authentication required');
    }
    const { data, error } = await supabase
      .from('assistance_requests')
      .insert({
        ...request,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating assistance request:', error);
    return null;
  }
};

export const updateAssistanceRequest = async (
  requestId: string,
  updates: Partial<AssistanceRequest>
): Promise<AssistanceRequest | null> => {
  if (!isSupabaseConfigured()) {
    const requests = await getAssistanceRequests();
    const index = requests.findIndex(r => r.id === requestId);
    if (index === -1) return null;
    
    requests[index] = { ...requests[index], ...updates };
    fallbackToLocalStorage('assistance_history', requests, 'set', requests);
    return requests[index];
  }

  try {
    const { data, error } = await supabase
      .from('assistance_requests')
      .update(updates)
      .eq('id', requestId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating assistance request:', error);
    return null;
  }
};

// ==================== RESEÑAS ====================

export const getReviews = async (dishId?: number): Promise<Review[]> => {
  if (!isSupabaseConfigured()) {
    const allReviews = fallbackToLocalStorage<Review[]>('user_reviews', [], 'get') || [];
    return dishId ? allReviews.filter(r => r.dish_id === dishId) : allReviews;
  }

  try {
    let query = supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: false });

    if (dishId) {
      query = query.eq('dish_id', dishId);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching reviews:', error);
    return [];
  }
};

export const createReview = async (
  review: Omit<Review, 'id' | 'created_at' | 'updated_at'>
): Promise<Review | null> => {
  if (!isSupabaseConfigured()) {
    const newReview: Review = {
      ...review,
      id: `review_${Date.now()}`,
      created_at: new Date().toISOString(),
    };
    const reviews = await getReviews();
    reviews.unshift(newReview);
    fallbackToLocalStorage('user_reviews', reviews, 'set', reviews);
    return newReview;
  }

  try {
    const userId = await getAuthenticatedUserId();
    if (!userId) {
      console.warn('[submitReview] No authenticated user - login required');
      throw new Error('Authentication required');
    }
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        ...review,
        user_id: userId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating review:', error);
    return null;
  }
};

export const updateReview = async (
  reviewId: string,
  updates: Partial<Review>
): Promise<Review | null> => {
  if (!isSupabaseConfigured()) {
    const reviews = await getReviews();
    const index = reviews.findIndex(r => r.id === reviewId);
    if (index === -1) return null;
    
    reviews[index] = { ...reviews[index], ...updates, updated_at: new Date().toISOString() };
    fallbackToLocalStorage('user_reviews', reviews, 'set', reviews);
    return reviews[index];
  }

  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating review:', error);
    return null;
  }
};

// ==================== PRODUCTOS ====================

export const getProducts = async (filters?: {
  restaurantId?: string;
  category?: string;
  origin?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
  language?: string; // Idioma para traducciones (opcional, se detecta automáticamente si no se proporciona)
}): Promise<Product[]> => {
  if (!isSupabaseConfigured()) {
    // Fallback: retornar array vacío, los productos vendrán del código hardcodeado
    return [];
  }

  try {
    const language = filters?.language || getCurrentLanguage();
    
    // Query principal sin JOIN a traducciones (la tabla product_translations no existe)
    let query = supabase
      .from('products')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('id', { ascending: true });

    if (filters) {
      if (filters.restaurantId) {
        query = query.eq('restaurant_id', filters.restaurantId);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      if (filters.origin) {
        query = query.eq('origin', filters.origin);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      } else {
        // Por defecto, solo productos activos
        query = query.eq('is_active', true);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }
    } else {
      // Por defecto, solo productos activos
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Mapear productos (sin traducciones, se usan los nombres de la BD directamente)
    return (data || []).map((p: any) => {
      return {
        ...p,
        name: p.name,
        description: p.description || '',
        image: p.image_url ? getProductImageUrl(p.image_url) : (p.image || ''),
      };
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
};

// ==================== STORAGE (IMÁGENES) ====================

/**
 * Obtiene la URL pública de una imagen almacenada en Supabase Storage
 * @param bucketName Nombre del bucket (ej: 'product-images', 'restaurant-images')
 * @param filePath Ruta del archivo dentro del bucket
 * @returns URL pública de la imagen
 */
export const getImageUrl = (bucketName: string, filePath: string, bustCache: boolean = false): string => {
  if (!isSupabaseConfigured()) {
    // Si no está configurado, retornar ruta relativa local
    return filePath.startsWith('/') ? filePath : `/${filePath}`;
  }

  // Si ya es una URL completa, retornarla tal cual
  if (filePath.startsWith('http://') || filePath.startsWith('https://')) {
    return filePath;
  }

  // Construir URL pública de Supabase Storage
  const supabaseUrl = getSupabaseUrl();
  if (!supabaseUrl) {
    // Fallback: usar ruta relativa
    return filePath.startsWith('/') ? filePath : `/${filePath}`;
  }
  
  let url = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${filePath}`;
  
  // Agregar parámetro de cache-busting si se solicita (útil para desarrollo)
  if (bustCache) {
    url += (url.includes('?') ? '&' : '?') + '_t=' + Date.now();
  }
  
  return url;
};

/**
 * Sube una imagen a Supabase Storage
 * @param bucketName Nombre del bucket
 * @param filePath Ruta donde guardar el archivo (ej: 'products/product-123.jpg')
 * @param file Archivo a subir (File o Blob)
 * @returns URL pública de la imagen subida, o null si hay error
 */
export const uploadImage = async (
  bucketName: string,
  filePath: string,
  file: File | Blob
): Promise<string | null> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase no está configurado. No se puede subir la imagen.');
    return null;
  }

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // Si el archivo ya existe, lo reemplaza
      });

    if (error) throw error;

    // Retornar URL pública
    return getImageUrl(bucketName, data.path);
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
};

/**
 * Elimina una imagen de Supabase Storage
 * @param bucketName Nombre del bucket
 * @param filePath Ruta del archivo a eliminar
 * @returns true si se eliminó correctamente, false en caso contrario
 */
export const deleteImage = async (
  bucketName: string,
  filePath: string
): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    console.warn('Supabase no está configurado. No se puede eliminar la imagen.');
    return false;
  }

  try {
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting image:', error);
    return false;
  }
};

/**
 * Helper para obtener URL de imagen de producto
 */
export const getProductImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  // Si es una ruta relativa, intentar desde Supabase Storage primero
  if (isSupabaseConfigured()) {
    return getImageUrl('product-images', imageUrl);
  }
  // Fallback a ruta local
  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
};

/**
 * Helper para obtener URL de imagen de restaurante
 */
export const getRestaurantImageUrl = (imageUrl: string | null | undefined, type: 'logo' | 'cover' = 'logo', bustCache: boolean = false): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (isSupabaseConfigured()) {
    return getImageUrl('restaurant-images', imageUrl, bustCache);
  }
  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
};

/**
 * Helper para obtener URL de avatar de usuario
 */
export const getUserAvatarUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  if (isSupabaseConfigured()) {
    return getImageUrl('user-avatars', imageUrl);
  }
  return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
};

export const getProductById = async (productId: number, restaurantId?: string, language?: string): Promise<Product | null> => {
  if (!isSupabaseConfigured()) {
    // Fallback: retornar null, el producto vendrá del código hardcodeado
    return null;
  }

  try {
    const currentLanguage = language || getCurrentLanguage();
    
    let query = supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true);

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query.single();

    if (error) throw error;
    
    if (!data) return null;
    
    // Retornar producto sin traducciones (se usan los nombres de la BD directamente)
    return {
      ...data,
      name: data.name,
      description: data.description || '',
      image: data.image_url ? getProductImageUrl(data.image_url) : (data.image || ''),
    };
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
};

// ==================== RESTAURANTES ====================

export interface Restaurant {
  id: string;
  name: string;
  slug: string;
  description?: string;
  address?: string;
  city: string;
  state?: string;
  country: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  website?: string;
  logo_url?: string;
  cover_image_url?: string;
  rating: number;
  total_reviews: number;
  is_active: boolean;
  is_verified: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
  // Campo calculado: URL completa de la imagen del logo
  image?: string;
}

export const getRestaurants = async (filters?: {
  city?: string;
  country?: string;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}): Promise<Restaurant[]> => {
  if (!isSupabaseConfigured()) {
    return [];
  }

  try {
    let query = supabase
      .from('restaurants')
      .select('*')
      .order('name', { ascending: true });

    if (filters) {
      if (filters.city) {
        query = query.eq('city', filters.city);
      }
      if (filters.country) {
        query = query.eq('country', filters.country);
      }
      if (filters.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      } else {
        query = query.eq('is_active', true);
      }
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }
    } else {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    
    // Mapear restaurantes y agregar campo image desde logo_url
    return (data || []).map((restaurant: any) => ({
      ...restaurant,
      image: restaurant.logo_url ? getRestaurantImageUrl(restaurant.logo_url, 'logo') : undefined,
    }));
  } catch (error) {
    console.error('Error fetching restaurants:', error);
    return [];
  }
};

export const getRestaurantById = async (restaurantId: string): Promise<Restaurant | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (!data) return null;
    
    // Mapear y agregar campo image desde logo_url
    return {
      ...data,
      image: data.logo_url ? getRestaurantImageUrl(data.logo_url, 'logo') : undefined,
    };
  } catch (error) {
    console.error('Error fetching restaurant:', error);
    return null;
  }
};

export const getRestaurantBySlug = async (slug: string): Promise<Restaurant | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single();

    if (error) throw error;
    if (!data) return null;
    
    // Mapear y agregar campo image desde logo_url
    const restaurant = {
      ...data,
      image: data.logo_url ? getRestaurantImageUrl(data.logo_url, 'logo') : undefined,
    };
    
    // Log para debugging
    console.log(`[getRestaurantBySlug] Restaurant "${slug}" loaded:`, {
      name: restaurant.name,
      logo_url: data.logo_url,
      image_url: restaurant.image,
    });
    
    return restaurant;
  } catch (error) {
    console.error('Error fetching restaurant by slug:', error);
    return null;
  }
};

export const updateRestaurant = async (
  restaurantId: string,
  updates: Partial<Restaurant>
): Promise<Restaurant | null> => {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('restaurants')
      .update(updates)
      .eq('id', restaurantId)
      .select()
      .single();

    if (error) throw error;
    if (!data) return null;
    
    // Mapear y agregar campo image desde logo_url
    return {
      ...data,
      image: data.logo_url ? getRestaurantImageUrl(data.logo_url, 'logo') : undefined,
    };
  } catch (error) {
    console.error('Error updating restaurant:', error);
    return null;
  }
};

/**
 * Crea un nuevo restaurante con imagen de perfil
 * @param restaurantData Datos del restaurante (sin logo_url, se genera automáticamente)
 * @param logoImage Imagen del logo (File o Blob) - opcional
 * @param coverImage Imagen de portada (File o Blob) - opcional
 * @returns Restaurante creado con campo image mapeado, o null si hay error
 */
export const createRestaurant = async (
  restaurantData: {
    name: string;
    slug: string;
    description?: string;
    address?: string;
    city: string;
    state?: string;
    country: string;
    postal_code?: string;
    latitude?: number;
    longitude?: number;
    phone?: string;
    email?: string;
    website?: string;
    timezone?: string;
  },
  logoImage?: File | Blob,
  coverImage?: File | Blob
): Promise<Restaurant | null> => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase no está configurado');
    return null;
  }

  try {
    console.log('🔄 Creando nuevo restaurante...');

    let logoUrl: string | undefined;
    let coverImageUrl: string | undefined;

    // 1. Subir imagen del logo si se proporciona
    if (logoImage) {
      const logoFileName = `logos/${restaurantData.slug}-${Date.now()}.${logoImage instanceof File ? logoImage.name.split('.').pop() : 'png'}`;
      const { data: logoUploadData, error: logoUploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(logoFileName, logoImage, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (logoUploadError) {
        console.warn('⚠️ No se pudo subir el logo:', logoUploadError);
      } else if (logoUploadData) {
        // Guardar solo la ruta relativa (data.path)
        logoUrl = logoUploadData.path;
        console.log(`✅ Logo subido: ${logoUploadData.path}`);
      }
    }

    // 2. Subir imagen de portada si se proporciona
    if (coverImage) {
      const coverFileName = `covers/${restaurantData.slug}-${Date.now()}.${coverImage instanceof File ? coverImage.name.split('.').pop() : 'png'}`;
      const { data: coverUploadData, error: coverUploadError } = await supabase.storage
        .from('restaurant-images')
        .upload(coverFileName, coverImage, {
          cacheControl: '3600',
          upsert: true
        });
      
      if (coverUploadError) {
        console.warn('⚠️ No se pudo subir la imagen de portada:', coverUploadError);
      } else if (coverUploadData) {
        // Guardar solo la ruta relativa (data.path)
        coverImageUrl = coverUploadData.path;
        console.log(`✅ Imagen de portada subida: ${coverUploadData.path}`);
      }
    }

    // 3. Crear el restaurante en la base de datos
    const { data, error } = await supabase
      .from('restaurants')
      .insert({
        ...restaurantData,
        logo_url: logoUrl,
        cover_image_url: coverImageUrl,
        is_active: true,
        is_verified: false,
        rating: 0.0,
        total_reviews: 0,
        timezone: restaurantData.timezone || 'UTC',
      })
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      console.error('❌ No se retornó ningún dato al crear el restaurante');
      return null;
    }

    console.log(`✅ Restaurante creado: ${data.name} (ID: ${data.id})`);

    // 4. Mapear y retornar con campo image
    return {
      ...data,
      image: data.logo_url ? getRestaurantImageUrl(data.logo_url, 'logo') : undefined,
    };
  } catch (error) {
    console.error('❌ Error al crear el restaurante:', error);
    return null;
  }
};

/**
 * Convierte una imagen base64 a Blob
 */
export const base64ToBlob = (base64: string, mimeType: string = 'image/png'): Blob => {
  const base64Data = base64.includes(',') ? base64.split(',')[1] : base64;
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
};

/**
 * Actualiza la imagen del restaurante desde una imagen base64
 * @param restaurantSlug Slug del restaurante (ej: 'donk-restaurant')
 * @param base64Image Imagen en formato base64 (con o sin prefijo data:image/...)
 * @param imageType Tipo de imagen: 'logo' o 'cover'
 * @returns true si se actualizó correctamente, false en caso contrario
 */
/**
 * Actualiza el logo del restaurante usando una imagen existente en Storage
 * @param restaurantSlug Slug del restaurante (ej: 'donk-restaurant')
 * @param imagePath Ruta relativa de la imagen en Storage (ej: 'logos/logo-donk-restaurant.png')
 * @param imageType Tipo de imagen: 'logo' o 'cover'
 * @returns true si se actualizó correctamente, false en caso contrario
 */
export const updateRestaurantImageFromStorage = async (
  restaurantSlug: string,
  imagePath: string,
  imageType: 'logo' | 'cover' = 'logo'
): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase no está configurado');
    return false;
  }

  try {
    console.log(`🔄 Actualizando ${imageType} del restaurante "${restaurantSlug}" con imagen: ${imagePath}`);

    // 1. Obtener el restaurante
    const restaurant = await getRestaurantBySlug(restaurantSlug);
    if (!restaurant) {
      console.error(`❌ No se encontró el restaurante con slug: ${restaurantSlug}`);
      return false;
    }

    console.log(`✅ Restaurante encontrado: ${restaurant.name} (ID: ${restaurant.id})`);

    // 2. Actualizar el restaurante con la ruta de la imagen
    const updateField = imageType === 'logo' ? 'logo_url' : 'cover_image_url';
    const updatedRestaurant = await updateRestaurant(restaurant.id, {
      [updateField]: imagePath
    });

    if (!updatedRestaurant) {
      console.error('❌ Error al actualizar el restaurante');
      return false;
    }

    console.log(`✅ Restaurante actualizado. ${updateField}: ${imagePath}`);
    console.log('🎉 ¡Imagen del restaurante actualizada exitosamente!');

    return true;
  } catch (error) {
    console.error('❌ Error al actualizar la imagen del restaurante:', error);
    return false;
  }
};

/**
 * Actualiza la imagen del restaurante desde una imagen base64
 * @param restaurantSlug Slug del restaurante (ej: 'donk-restaurant')
 * @param base64Image Imagen en formato base64 (con o sin prefijo data:image/...)
 * @param imageType Tipo de imagen: 'logo' o 'cover'
 * @returns true si se actualizó correctamente, false en caso contrario
 */
export const updateRestaurantImageFromBase64 = async (
  restaurantSlug: string,
  base64Image: string,
  imageType: 'logo' | 'cover' = 'logo'
): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    console.error('Supabase no está configurado');
    return false;
  }

  try {
    console.log(`🔄 Actualizando ${imageType} del restaurante "${restaurantSlug}"...`);

    // 1. Obtener el restaurante
    const restaurant = await getRestaurantBySlug(restaurantSlug);
    if (!restaurant) {
      console.error(`❌ No se encontró el restaurante con slug: ${restaurantSlug}`);
      return false;
    }

    console.log(`✅ Restaurante encontrado: ${restaurant.name} (ID: ${restaurant.id})`);

    // 2. Convertir base64 a Blob
    const blob = base64ToBlob(base64Image, 'image/png');
    console.log(`✅ Imagen convertida a Blob (tamaño: ${blob.size} bytes)`);

    // 3. Subir imagen a Supabase Storage
    const folder = imageType === 'logo' ? 'logos' : 'covers';
    const fileName = `${restaurantSlug}-${Date.now()}.png`;
    const filePath = `${folder}/${fileName}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('restaurant-images')
      .upload(filePath, blob, {
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Error al subir la imagen:', uploadError);
      return false;
    }

    console.log(`✅ Imagen subida a: ${filePath}`);

    // 4. Actualizar el restaurante
    const updateField = imageType === 'logo' ? 'logo_url' : 'cover_image_url';
    const updatedRestaurant = await updateRestaurant(restaurant.id, {
      [updateField]: filePath
    });

    if (!updatedRestaurant) {
      console.error('❌ Error al actualizar el restaurante');
      return false;
    }

    console.log(`✅ Restaurante actualizado. ${updateField}: ${filePath}`);
    console.log('🎉 ¡Imagen del restaurante actualizada exitosamente!');

    return true;
  } catch (error) {
    console.error('❌ Error al actualizar la imagen del restaurante:', error);
    return false;
  }
};

// ==================== USUARIOS Y PERFILES ====================

export interface UserProfile {
  user_id: string;
  display_name?: string;
  bio?: string;
  gender?: string;
  country?: string;
  city?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserSettings {
  user_id: string;
  language: string;
  theme: 'light' | 'dark' | 'system';
  notifications_enabled: boolean;
  marketing_emails_enabled: boolean;
  default_payment_method?: string;
  default_tip_percentage: number;
  created_at: string;
  updated_at: string;
}

export interface UserPaymentMethod {
  id: string;
  user_id: string;
  provider: string;
  type: 'card' | 'cash' | 'wallet';
  brand?: string;
  last4?: string;
  exp_month?: number;
  exp_year?: number;
  holder_name?: string;
  token?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserTransaction {
  id: string;
  user_id: string;
  order_id: string;
  payment_id?: string;
  restaurant_id: string;
  restaurant_name: string;
  total: number;
  subtotal: number;
  tip: number;
  tip_percentage?: number;
  tax: number;
  payment_method: string;
  payment_method_last4?: string;
  status: 'completed' | 'pending' | 'failed' | 'refunded';
  invoice_sent: boolean;
  invoice_email?: string;
  created_at: string;
}

// Obtener perfil de usuario
export const getUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

// Crear o actualizar perfil de usuario
export const upsertUserProfile = async (userId: string, profile: Partial<UserProfile>): Promise<UserProfile | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .upsert({ user_id: userId, ...profile }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }
};

// Obtener configuración de usuario
export const getUserSettings = async (userId: string): Promise<UserSettings | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  } catch (error) {
    console.error('Error fetching user settings:', error);
    return null;
  }
};

// Crear o actualizar configuración de usuario
export const upsertUserSettings = async (userId: string, settings: Partial<UserSettings>): Promise<UserSettings | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('user_settings')
      .upsert({ user_id: userId, ...settings }, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting user settings:', error);
    return null;
  }
};

// ==================== MÉTODOS DE PAGO ====================

// Obtener métodos de pago del usuario
export const getUserPaymentMethods = async (userId: string): Promise<UserPaymentMethod[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('user_payment_methods')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return [];
  }
};

// Agregar método de pago
export const addPaymentMethod = async (userId: string, method: Omit<UserPaymentMethod, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<UserPaymentMethod | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    // Si se marca como default, quitar default de otros métodos
    if (method.is_default) {
      await supabase
        .from('user_payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true);
    }

    const { data, error } = await supabase
      .from('user_payment_methods')
      .insert({ user_id: userId, ...method })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error adding payment method:', error);
    return null;
  }
};

// Actualizar método de pago
export const updatePaymentMethod = async (methodId: string, userId: string, updates: Partial<UserPaymentMethod>): Promise<UserPaymentMethod | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    // Si se marca como default, quitar default de otros métodos
    if (updates.is_default) {
      await supabase
        .from('user_payment_methods')
        .update({ is_default: false })
        .eq('user_id', userId)
        .eq('is_default', true)
        .neq('id', methodId);
    }

    const { data, error } = await supabase
      .from('user_payment_methods')
      .update(updates)
      .eq('id', methodId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error updating payment method:', error);
    return null;
  }
};

// Eliminar método de pago (soft delete)
export const deletePaymentMethod = async (methodId: string, userId: string): Promise<boolean> => {
  if (!isSupabaseConfigured()) return false;

  try {
    const { error } = await supabase
      .from('user_payment_methods')
      .update({ is_active: false })
      .eq('id', methodId)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return false;
  }
};

// ==================== TRANSACCIONES ====================

// Obtener transacciones del usuario
export const getUserTransactions = async (userId: string, limit: number = 50): Promise<UserTransaction[]> => {
  if (!isSupabaseConfigured()) return [];

  try {
    const { data, error } = await supabase
      .from('user_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
};

// Crear transacción (se llama cuando se completa un pago)
export const createUserTransaction = async (transaction: Omit<UserTransaction, 'id' | 'created_at'>): Promise<UserTransaction | null> => {
  if (!isSupabaseConfigured()) return null;

  try {
    const { data, error } = await supabase
      .from('user_transactions')
      .insert(transaction)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error creating transaction:', error);
    return null;
  }
};
