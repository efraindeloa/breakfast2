/**
 * API para operaciones de Reservaciones
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { handleSupabaseError, requireAuth } from './base';
import { ApiResponse } from './types';

export interface ReservationItem {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Reservation {
  id: string;
  user_id: string;
  restaurant_id: string;
  reservation_date: string;
  reservation_time: string;
  number_of_people: number;
  zone: string;
  special_occasion?: string | null;
  table_preferences?: string | null;
  advance_order_items: ReservationItem[];
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateReservationRequest {
  restaurant_id: string;
  reservation_date: string; // Formato: YYYY-MM-DD
  reservation_time: string; // Formato: HH:MM (24h)
  number_of_people: number;
  zone: string;
  special_occasion?: string | null;
  table_preferences?: string | null;
  advance_order_items?: ReservationItem[];
  notes?: string;
}

export interface UpdateReservationRequest {
  reservation_date?: string;
  reservation_time?: string;
  number_of_people?: number;
  zone?: string;
  special_occasion?: string | null;
  table_preferences?: string | null;
  advance_order_items?: ReservationItem[];
  status?: Reservation['status'];
  notes?: string;
}

/**
 * Crear una nueva reservación
 */
export async function createReservation(
  request: CreateReservationRequest
): Promise<ApiResponse<Reservation>> {
  return handleSupabaseError(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('reservations')
      .insert({
        user_id: userId,
        restaurant_id: request.restaurant_id,
        reservation_date: request.reservation_date,
        reservation_time: request.reservation_time,
        number_of_people: request.number_of_people,
        zone: request.zone,
        special_occasion: request.special_occasion || null,
        table_preferences: request.table_preferences || null,
        advance_order_items: request.advance_order_items || [],
        notes: request.notes || null,
        status: 'pending'
      })
      .select()
      .single();

    if (error) throw error;

    return data as Reservation;
  });
}

/**
 * Obtener reservaciones del usuario actual
 */
export async function getUserReservations(
  status?: Reservation['status']
): Promise<ApiResponse<Reservation[]>> {
  return handleSupabaseError(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    const userId = await requireAuth();

    let query = supabase
      .from('reservations')
      .select('*')
      .eq('user_id', userId)
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as Reservation[];
  });
}

/**
 * Obtener una reservación por ID
 */
export async function getReservation(
  reservationId: string
): Promise<ApiResponse<Reservation | null>> {
  return handleSupabaseError(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    const userId = await requireAuth();

    const { data, error } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No se encontró la reservación
        return null;
      }
      throw error;
    }

    return data as Reservation;
  });
}

/**
 * Actualizar una reservación
 */
export async function updateReservation(
  reservationId: string,
  request: UpdateReservationRequest
): Promise<ApiResponse<Reservation>> {
  return handleSupabaseError(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    const userId = await requireAuth();

    const updateData: any = {};
    if (request.reservation_date !== undefined) updateData.reservation_date = request.reservation_date;
    if (request.reservation_time !== undefined) updateData.reservation_time = request.reservation_time;
    if (request.number_of_people !== undefined) updateData.number_of_people = request.number_of_people;
    if (request.zone !== undefined) updateData.zone = request.zone;
    if (request.special_occasion !== undefined) updateData.special_occasion = request.special_occasion;
    if (request.table_preferences !== undefined) updateData.table_preferences = request.table_preferences;
    if (request.advance_order_items !== undefined) updateData.advance_order_items = request.advance_order_items;
    if (request.status !== undefined) updateData.status = request.status;
    if (request.notes !== undefined) updateData.notes = request.notes;

    const { data, error } = await supabase
      .from('reservations')
      .update(updateData)
      .eq('id', reservationId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    return data as Reservation;
  });
}

/**
 * Cancelar una reservación
 */
export async function cancelReservation(
  reservationId: string
): Promise<ApiResponse<Reservation>> {
  return updateReservation(reservationId, { status: 'cancelled' });
}

/**
 * Obtener reservaciones de un restaurante (para restaurantes)
 */
export async function getRestaurantReservations(
  restaurantId: string,
  date?: string,
  status?: Reservation['status']
): Promise<ApiResponse<Reservation[]>> {
  return handleSupabaseError(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    await requireAuth();

    let query = supabase
      .from('reservations')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('reservation_date', { ascending: true })
      .order('reservation_time', { ascending: true });

    if (date) {
      query = query.eq('reservation_date', date);
    }

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) throw error;

    return (data || []) as Reservation[];
  });
}
