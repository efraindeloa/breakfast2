/**
 * Funciones base y helpers para las APIs
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { ApiResponse, ApiError } from './types';

/**
 * Wrapper para manejar errores de Supabase de forma consistente
 */
export async function handleSupabaseError<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Error en la operación'
): Promise<ApiResponse<T>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase no está configurado',
    };
  }

  try {
    const data = await operation();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error(`[API Error] ${errorMessage}:`, error);
    
    const apiError: ApiError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || errorMessage,
      details: error,
    };

    return {
      success: false,
      error: apiError.message,
    };
  }
}

/**
 * Obtener el ID del usuario autenticado (compatible con autenticación simple)
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  // Primero intentar autenticación simple
  const simpleAuthUser = localStorage.getItem('simpleAuthUser');
  console.log('[getAuthenticatedUserId] simpleAuthUser raw:', simpleAuthUser);
  if (simpleAuthUser) {
    try {
      const userData = JSON.parse(simpleAuthUser);
      console.log('[getAuthenticatedUserId] userData parsed:', userData);
      const userId = userData.id || null;
      console.log('[getAuthenticatedUserId] userId extracted:', userId);
      if (userId) {
        console.log('[getAuthenticatedUserId] Usuario encontrado (simple auth):', userId);
      } else {
        console.warn('[getAuthenticatedUserId] userData.id es null o undefined:', userData);
      }
      return userId;
    } catch (error) {
      console.error('[API] Error parsing simple auth user:', error, 'Raw value:', simpleAuthUser);
      localStorage.removeItem('simpleAuthUser');
      return null;
    }
  } else {
    console.log('[getAuthenticatedUserId] No hay simpleAuthUser en localStorage');
  }

  // Si no hay autenticación simple, intentar Supabase Auth
  if (!isSupabaseConfigured()) {
    console.log('[getAuthenticatedUserId] Supabase no configurado');
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;
    if (userId) {
      console.log('[getAuthenticatedUserId] Usuario encontrado (Supabase Auth):', userId);
    } else {
      console.log('[getAuthenticatedUserId] No se encontró usuario autenticado');
    }
    return userId;
  } catch (error) {
    console.error('[API] Error getting authenticated user:', error);
    return null;
  }
}

/**
 * Validar que el usuario esté autenticado
 */
export async function requireAuth(): Promise<string> {
  const userId = await getAuthenticatedUserId();
  if (!userId) {
    throw new Error('Usuario no autenticado');
  }
  return userId;
}

export async function getAuthenticatedOrGuestUserId(): Promise<string | null> {
  // Verificar si es un usuario invitado
  const guestSession = localStorage.getItem('guestSession');
  if (guestSession) {
    const guestUser = JSON.parse(guestSession);
    return guestUser.id;
  }
  
  // Si no es invitado, usar autenticación normal
  return await getAuthenticatedUserId();
}
