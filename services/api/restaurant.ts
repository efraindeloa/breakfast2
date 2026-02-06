/**
 * API para operaciones de Perfil de Restaurante
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { handleSupabaseError, requireAuth } from './base';
import { ApiResponse } from './types';
import { Restaurant } from '../database';
import { getRestaurantImageUrl } from '../database';

export interface UpdateRestaurantRequest {
  name?: string;
  description?: string;
  nombre_comercial?: string;
  razon_social?: string;
  descripcion_corta?: string;
  descripcion_larga?: string;
  tipo_cocina?: string;
  tags?: string[];
  address?: string;
  direccion_completa?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  latitude?: number;
  longitude?: number;
  phone?: string;
  telefono?: string;
  email?: string;
  email_contacto?: string;
  website?: string;
  sitio_web?: string;
  timezone?: string;
  logo_url?: string;
}

/**
 * Obtener restaurante por ID
 */
export async function getRestaurantById(
  restaurantId: string
): Promise<ApiResponse<Restaurant | null>> {
  return handleSupabaseError(async () => {
    if (restaurantId === '00000000-0000-0000-0000-000000000001' || !restaurantId) {
      return null;
    }

    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('id', restaurantId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      ...data,
      image: data.logo_url ? getRestaurantImageUrl(data.logo_url, 'logo') : undefined,
    } as Restaurant;
  }, 'Error al obtener restaurante');
}

/**
 * Obtener restaurante por slug
 */
export async function getRestaurantBySlug(
  slug: string
): Promise<ApiResponse<Restaurant | null>> {
  return handleSupabaseError(async () => {
    const { data, error } = await supabase
      .from('restaurants')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    if (!data) return null;

    return {
      ...data,
      image: data.logo_url ? getRestaurantImageUrl(data.logo_url, 'logo') : undefined,
    } as Restaurant;
  }, 'Error al obtener restaurante');
}

/**
 * Obtener el ID del restaurante del usuario actual
 */
export async function getCurrentUserRestaurantId(): Promise<ApiResponse<string | null>> {
  return handleSupabaseError(async () => {
    const userId = await requireAuth();

    // Establecer la variable de sesión para RLS (compatible con autenticación simple)
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.user_id',
        setting_value: userId
      });
    } catch (error) {
      console.warn('[getCurrentUserRestaurantId] No se pudo establecer app.user_id, continuando...', error);
    }

    const { data, error } = await supabase
      .from('restaurant_staff')
      .select('restaurant_id')
      .eq('user_id', userId)
      .eq('role', 'owner')
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data?.restaurant_id || null;
  }, 'Error al obtener ID del restaurante');
}

/**
 * Actualizar restaurante
 */
export async function updateRestaurant(
  restaurantId: string,
  updates: UpdateRestaurantRequest
): Promise<ApiResponse<Restaurant>> {
  return handleSupabaseError(async () => {
    await requireAuth(); // Validar autenticación

    if (restaurantId === '00000000-0000-0000-0000-000000000001' || !restaurantId) {
      throw new Error('ID de restaurante inválido');
    }

    const updateData: any = {};

    // Mapear campos
    if (updates.name !== undefined) updateData.name = updates.name;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.nombre_comercial !== undefined) updateData.nombre_comercial = updates.nombre_comercial;
    if (updates.razon_social !== undefined) updateData.razon_social = updates.razon_social;
    if (updates.descripcion_corta !== undefined) updateData.descripcion_corta = updates.descripcion_corta;
    if (updates.descripcion_larga !== undefined) updateData.descripcion_larga = updates.descripcion_larga;
    if (updates.tipo_cocina !== undefined) updateData.tipo_cocina = updates.tipo_cocina;
    if (updates.tags !== undefined) updateData.tags = updates.tags;
    if (updates.address !== undefined) updateData.address = updates.address;
    if (updates.direccion_completa !== undefined) updateData.direccion_completa = updates.direccion_completa;
    if (updates.city !== undefined) updateData.city = updates.city;
    if (updates.state !== undefined) updateData.state = updates.state;
    if (updates.country !== undefined) updateData.country = updates.country;
    if (updates.postal_code !== undefined) updateData.postal_code = updates.postal_code;
    if (updates.latitude !== undefined) updateData.latitude = updates.latitude;
    if (updates.longitude !== undefined) updateData.longitude = updates.longitude;
    if (updates.phone !== undefined) updateData.phone = updates.phone;
    if (updates.telefono !== undefined) updateData.telefono = updates.telefono;
    if (updates.email !== undefined) updateData.email = updates.email;
    if (updates.email_contacto !== undefined) updateData.email_contacto = updates.email_contacto;
    if (updates.website !== undefined) updateData.website = updates.website;
    if (updates.sitio_web !== undefined) updateData.sitio_web = updates.sitio_web;
    if (updates.timezone !== undefined) updateData.timezone = updates.timezone;
    if (updates.logo_url !== undefined) updateData.logo_url = updates.logo_url;

    const { data, error } = await supabase
      .from('restaurants')
      .update(updateData)
      .eq('id', restaurantId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      image: data.logo_url ? getRestaurantImageUrl(data.logo_url, 'logo') : undefined,
    } as Restaurant;
  }, 'Error al actualizar restaurante');
}
