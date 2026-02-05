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
  group_order_id?: string;
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
    return (data || []) as Order[];
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
        group_order_id: orderData.group_order_id || null,
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

    const targetUserId = userId || await requireAuth();

    const insertData: any = {
      user_id: targetUserId,
      restaurant_id: orderData.restaurant_id,
      status: orderData.status || 'pending',
      items: orderData.items || [],
      total: orderData.total || 0,
      special_instructions: orderData.special_instructions || null,
      table_number: orderData.table_number || null,
      group_order_id: orderData.group_order_id || null,
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
