/**
 * API para notificaciones push (Edge Function)
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { handleSupabaseError } from './base';
import { ApiResponse } from './types';

export interface SendPushNotificationParams {
  token: string;
  title: string;
  body?: string;
  data?: Record<string, string>;
}

export interface SendPushNotificationResult {
  success: boolean;
  message?: string;
}

/**
 * Enviar notificación push (Edge Function)
 */
export async function sendPushNotification(
  params: SendPushNotificationParams
): Promise<ApiResponse<SendPushNotificationResult>> {
  return handleSupabaseError(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }
    const { data, error } = await supabase.functions.invoke('send-push-notification', {
      body: params,
    });
    if (error) throw error;
    return (data ?? { success: false }) as SendPushNotificationResult;
  }, 'Error al enviar notificación push');
}
