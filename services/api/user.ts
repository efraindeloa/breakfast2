/**
 * API para operaciones de Perfil de Usuario/Comensal
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { handleSupabaseError, requireAuth } from './base';
import { ApiResponse } from './types';

export interface UserProfile {
  id: string;
  user_id: string;
  name?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  preferences?: any;
  created_at: string;
  updated_at: string;
}

export interface UpdateUserProfileRequest {
  name?: string;
  phone?: string;
  avatar_url?: string;
  date_of_birth?: string;
  gender?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  preferences?: any;
}

/**
 * Obtener perfil de usuario
 */
export async function getUserProfile(
  userId?: string
): Promise<ApiResponse<UserProfile | null>> {
  return handleSupabaseError(async () => {
    const targetUserId = userId || await requireAuth();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle();

    // PGRST116 significa "no rows found", lo cual es válido (el perfil no existe todavía)
    // 406 significa que RLS está bloqueando el acceso, lo cual es un error real
    if (error) {
      // Si es 406, el problema es de RLS, no que no exista el registro
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        // No existe el perfil, retornar null (esto es válido)
        return null;
      }
      // Cualquier otro error, lanzarlo
      throw error;
    }
    return (data || null) as UserProfile | null;
  }, 'Error al obtener perfil de usuario');
}

/**
 * Actualizar perfil de usuario
 */
export async function updateUserProfile(
  updates: UpdateUserProfileRequest,
  userId?: string
): Promise<ApiResponse<UserProfile>> {
  return handleSupabaseError(async () => {
    const targetUserId = userId || await requireAuth();

    const updateData: any = {};
    
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.avatar_url !== undefined) updateData.avatar_url = updates.avatar_url;
    if (updates.date_of_birth !== undefined) updateData.date_of_birth = updates.date_of_birth;
    if (updates.gender !== undefined) updateData.gender = updates.gender;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.country !== undefined) updateData.country = updates.country;
    if (updates.postal_code !== undefined) updateData.postal_code = updates.postal_code;
    if (updates.preferences !== undefined) updateData.preferences = updates.preferences;

    // Intentar actualizar, si no existe, crear
    const { data: existing, error: checkError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', targetUserId)
      .maybeSingle();
    
    // Si hay un error que no sea "no rows found", lanzarlo
    if (checkError && checkError.code !== 'PGRST116' && !checkError.message?.includes('No rows')) {
      throw checkError;
    }

    let result;
    // Si existe un registro (incluso si es solo un objeto con id), actualizar
    if (existing && existing.id) {
      // Actualizar
      const { data, error } = await supabase
        .from('user_profiles')
        .update(updateData)
        .eq('user_id', targetUserId)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Crear
      const { data, error } = await supabase
        .from('user_profiles')
        .insert({
          user_id: targetUserId,
          ...updateData,
        })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return result as UserProfile;
  }, 'Error al actualizar perfil de usuario');
}
