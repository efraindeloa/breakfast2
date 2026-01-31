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
 * Obtener el ID del usuario autenticado
 */
export async function getAuthenticatedUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
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
