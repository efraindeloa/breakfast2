/**
 * API para operaciones CRUD de Órdenes
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { handleSupabaseError, requireAuth, getAuthenticatedOrGuestUserId } from './base';
import { ApiResponse } from './types';
import { Order, OrderStatus } from '../../types/order';

export interface CreateOrderRequest {
  restaurant_id: string;
  status?: OrderStatus;
  items?: any[];
  total?: number;
  special_instructions?: string;
  table_number?: string;
}

export interface UpdateOrderRequest {
  status?: OrderStatus;
  items?: any[];
  total?: number;
  special_instructions?: string;
  table_number?: string;
}

/**
 * Obtener todas las órdenes del usuario autenticado
 */
export async function getOrders(userId?: string): Promise<ApiResponse<Order[]>> {
  return handleSupabaseError(async () => {
    // Verificar si es un usuario invitado
    const guestSession = localStorage.getItem('guestSession');
    if (guestSession) {
      const guestOrders = localStorage.getItem('guest_orders');
      return guestOrders ? JSON.parse(guestOrders) : [];
    }

    const targetUserId = userId || await requireAuth();

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Ordenar las órdenes por fecha de creación ascendente para asignar números secuenciales
    const sortedData = [...(data || [])].sort((a: any, b: any) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateA - dateB;
    });
    
    // Mapear los datos de Supabase al formato Order esperado
    const mappedOrders: Order[] = sortedData.map((order: any, index: number) => {
      // Calcular orderNumber basado en el orden de creación
      // La primera orden es 1, las siguientes son incrementales
      let orderNumber = index + 1;
      
      if (order.order_number) {
        // Si existe order_number en la BD, intentar extraer el número
        if (typeof order.order_number === 'string') {
          // Extraer números del formato "ORD-2024-000001" o similar
          const match = order.order_number.match(/\d+$/);
          if (match) {
            const parsedNumber = parseInt(match[0]);
            // Solo usar el número parseado si es válido y razonable
            if (!isNaN(parsedNumber) && parsedNumber > 0) {
              orderNumber = parsedNumber;
            }
          }
        } else if (typeof order.order_number === 'number' && order.order_number > 0) {
          orderNumber = order.order_number;
        }
      }
      
      return {
        orderId: order.id, // Mapear id a orderId
        orderNumber: orderNumber,
        items: order.items || [],
        status: order.status as OrderStatus,
        timestamp: order.created_at || new Date().toISOString(),
      };
    });
    
    // Volver a ordenar por fecha descendente para mostrar las más recientes primero
    mappedOrders.sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return dateB - dateA;
    });
    
    return mappedOrders;
  }, 'Error al obtener órdenes');
}

/**
 * Obtener una orden por ID
 */
export async function getOrderById(orderId: string, userId?: string): Promise<ApiResponse<Order>> {
  return handleSupabaseError(async () => {
    const targetUserId = userId || await requireAuth();

    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('order_id', orderId)
      .eq('user_id', targetUserId)
      .single();

    if (error) throw error;
    return data as Order;
  }, `Error al obtener orden con ID ${orderId}`);
}

/**
 * Crear una nueva orden
 */
export async function createOrder(orderData: CreateOrderRequest, userId?: string): Promise<ApiResponse<Order>> {
  return handleSupabaseError(async () => {
    // Verificar si es un usuario invitado
    const guestSession = localStorage.getItem('guestSession');
    if (guestSession) {
      const guestUser = JSON.parse(guestSession);
      const orderId = `guest-${Date.now()}`;
      const newOrder: Order = {
        id: orderId,
        orderId: orderId, // Para compatibilidad con la definición antigua
        user_id: guestUser.id,
        restaurant_id: orderData.restaurant_id,
        status: orderData.status || 'pending',
        items: orderData.items || [],
        total: orderData.total || 0,
        special_instructions: orderData.special_instructions || null,
        table_number: orderData.table_number || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      
      // Guardar en localStorage
      const guestOrders = localStorage.getItem('guest_orders');
      const orders = guestOrders ? JSON.parse(guestOrders) : [];
      orders.push(newOrder);
      localStorage.setItem('guest_orders', JSON.stringify(orders));
      
      return newOrder;
    }

    let targetUserId = userId;
    if (!targetUserId) {
      // Fallback: obtener userId directamente desde localStorage si requireAuth() falla
      const simpleAuthUser = localStorage.getItem('simpleAuthUser');
      if (simpleAuthUser) {
        try {
          const userData = JSON.parse(simpleAuthUser);
          targetUserId = userData.id || null;
          if (targetUserId) {
            console.log('[createOrder] Usuario encontrado directamente desde localStorage:', targetUserId);
          }
        } catch (error) {
          console.error('[createOrder] Error parsing simpleAuthUser:', error);
        }
      }
      
      if (!targetUserId) {
        targetUserId = await requireAuth();
      }
    }

    // Establecer la variable de sesión para RLS (compatible con autenticación simple)
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.user_id',
        setting_value: targetUserId
      });
    } catch (error) {
      console.warn('[createOrder] No se pudo establecer app.user_id, continuando...', error);
    }

    // Verificar que el restaurant_id existe, si no, obtener el primer restaurante disponible
    let restaurantId = orderData.restaurant_id;
    if (restaurantId === '00000000-0000-0000-0000-000000000001' || !restaurantId) {
      // Intentar obtener el primer restaurante disponible
      const { data: restaurants, error: restaurantError } = await supabase
        .from('restaurants')
        .select('id')
        .limit(1)
        .maybeSingle();
      
      if (restaurantError || !restaurants) {
        console.warn('[createOrder] No se pudo obtener restaurante, usando ID por defecto');
        // Si no hay restaurantes, el error se mostrará al intentar insertar
      } else {
        restaurantId = restaurants.id;
        console.log('[createOrder] Usando restaurante encontrado:', restaurantId);
      }
    }

    const insertData: any = {
      user_id: targetUserId,
      restaurant_id: restaurantId,
      status: orderData.status || 'pending',
      items: orderData.items || [],
      total: orderData.total || 0,
      subtotal: orderData.total || 0, // Si no se proporciona subtotal, usar total
      notes: orderData.special_instructions || null, // La columna se llama 'notes', no 'special_instructions'
      table_number: orderData.table_number || null,
    };

    const { data, error } = await supabase
      .from('orders')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  }, 'Error al crear orden');
}

/**
 * Actualizar una orden existente
 */
export async function updateOrder(
  orderId: string,
  updates: UpdateOrderRequest,
  userId?: string
): Promise<ApiResponse<Order>> {
  return handleSupabaseError(async () => {
    const targetUserId = userId || await requireAuth();

    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.items !== undefined) updateData.items = updates.items;
    if (updates.total !== undefined) updateData.total = updates.total;
    if (updates.special_instructions !== undefined) updateData.special_instructions = updates.special_instructions;
    if (updates.table_number !== undefined) updateData.table_number = updates.table_number;

    const { data, error } = await supabase
      .from('orders')
      .update(updateData)
      .eq('order_id', orderId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) throw error;
    return data as Order;
  }, `Error al actualizar orden con ID ${orderId}`);
}

/**
 * Eliminar una orden (soft delete)
 */
export async function deleteOrder(orderId: string, userId?: string): Promise<ApiResponse<boolean>> {
  return handleSupabaseError(async () => {
    const targetUserId = userId || await requireAuth();

    const { error } = await supabase
      .from('orders')
      .update({ 
        status: 'cancelled' as OrderStatus,
        updated_at: new Date().toISOString()
      })
      .eq('order_id', orderId)
      .eq('user_id', targetUserId);

    if (error) throw error;
    return true;
  }, `Error al eliminar orden con ID ${orderId}`);
}
