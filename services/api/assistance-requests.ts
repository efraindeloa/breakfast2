/**
 * API para solicitudes de asistencia (comensal → mesero)
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { handleSupabaseError, requireAuth, getAuthenticatedOrGuestUserId } from './base';
import { ApiResponse } from './types';

export type AssistanceRequestStatus = 'pending' | 'attended' | 'cancelled';

export interface AssistanceRequest {
  id: string;
  restaurant_id: string;
  user_id: string | null;
  table_number: string | null;
  request_type: string;
  message: string | null;
  status: AssistanceRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface CreateAssistanceRequestParams {
  restaurant_id: string;
  user_id?: string | null;
  order_id?: string | null;
  table_number?: string | null;
  request_type: string;
  message?: string | null;
}

/**
 * Crear una solicitud de asistencia (comensal)
 */
export async function createAssistanceRequest(
  params: CreateAssistanceRequestParams,
  userId?: string | null
): Promise<ApiResponse<AssistanceRequest>> {
  return handleSupabaseError(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    let targetUserId = userId;
    if (targetUserId === undefined) {
      const guestSession = localStorage.getItem('guestSession');
      if (guestSession) {
        try {
          const guest = JSON.parse(guestSession);
          targetUserId = guest.id || null;
        } catch {
          targetUserId = null;
        }
      } else {
        try {
          targetUserId = await requireAuth();
        } catch {
          targetUserId = null;
        }
      }
    }

    const { data, error } = await supabase.rpc('create_assistance_request', {
      p_restaurant_id: params.restaurant_id,
      p_user_id: targetUserId ?? params.user_id ?? null,
      p_request_type: params.request_type,
      p_message: params.message ?? null,
      p_table_number: params.table_number ?? null,
      p_order_id: params.order_id ?? null,
    });

    if (error) throw error;
    return data as AssistanceRequest;
  }, 'Error al crear solicitud de asistencia');
}

/**
 * Obtener solicitudes de asistencia de un restaurante (mesero/staff)
 */
export async function getAssistanceRequestsByRestaurant(
  restaurantId: string,
  options?: { status?: AssistanceRequestStatus; limit?: number }
): Promise<ApiResponse<AssistanceRequest[]>> {
  return handleSupabaseError(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    let query = supabase
      .from('assistance_requests')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('created_at', { ascending: false });

    if (options?.status) {
      query = query.eq('status', options.status);
    }
    if (options?.limit) {
      query = query.limit(options.limit);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as AssistanceRequest[];
  }, 'Error al obtener solicitudes de asistencia');
}

/**
 * Actualizar estado de una solicitud (mesero: marcar como atendida)
 */
export async function updateAssistanceRequest(
  id: string,
  updates: { status: AssistanceRequestStatus }
): Promise<ApiResponse<AssistanceRequest>> {
  return handleSupabaseError(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }

    const { data, error } = await supabase
      .from('assistance_requests')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as AssistanceRequest;
  }, 'Error al actualizar solicitud de asistencia');
}

/**
 * Suscribirse a nuevas solicitudes de asistencia (Realtime) para un restaurante
 */
export function subscribeToAssistanceRequests(
  restaurantId: string,
  onInsert: (payload: { new: AssistanceRequest }) => void
) {
  if (!isSupabaseConfigured()) return () => {};

  const channel = supabase
    .channel(`assistance_requests:${restaurantId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'assistance_requests',
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      (payload) => {
        onInsert({ new: payload.new as AssistanceRequest });
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
