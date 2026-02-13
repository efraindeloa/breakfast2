/**
 * API para operaciones CRUD de Promociones
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { handleSupabaseError, requireAuth } from './base';
import { ApiResponse } from './types';
import { Promotion } from '../database';

// Re-exportar el tipo Promotion para uso en componentes
export type { Promotion };
import { uploadImage } from '../database';

export interface CreatePromotionRequest {
  restaurant_id: string;
  title: string;
  description?: string;
  image_url?: string;
  category: string;
  discount_type: 'percentage' | 'fixed' | '2x1' | 'combo' | 'final';
  discount_value?: number;
  original_price?: number;
  final_price?: number;
  valid_from: string;
  valid_until: string;
  is_featured?: boolean;
  badges?: string[];
  applicable_hours?: { start: string; end: string };
  applicable_days?: string[];
  client_segmentation?: 'all' | 'new' | 'vip';
  flash_counter?: boolean;
}

export interface UpdatePromotionRequest {
  title?: string;
  description?: string;
  image_url?: string;
  category?: string;
  discount_type?: 'percentage' | 'fixed' | '2x1' | 'combo' | 'final';
  discount_value?: number;
  original_price?: number;
  final_price?: number;
  valid_from?: string;
  valid_until?: string;
  is_featured?: boolean;
  badges?: string[];
  applicable_hours?: { start: string; end: string } | null;
  applicable_days?: string[] | null;
  client_segmentation?: 'all' | 'new' | 'vip';
  flash_counter?: boolean;
  is_active?: boolean;
}

/**
 * Obtener todas las promociones
 */
export async function getPromotions(
  restaurantId?: string,
  filters?: {
    isActive?: boolean;
    isFeatured?: boolean;
    category?: string;
  }
): Promise<ApiResponse<Promotion[]>> {
  return handleSupabaseError(async () => {
    let query = supabase
      .from('promotions')
      .select('*');

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    } else {
      // Por defecto, solo activas y válidas para consumidores
      if (!restaurantId) {
        query = query.eq('is_active', true);
        query = query.gte('valid_until', new Date().toISOString());
        query = query.lte('valid_from', new Date().toISOString());
      }
    }

    if (filters?.isFeatured !== undefined) {
      query = query.eq('is_featured', filters.isFeatured);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map((promo: any) => ({
      ...promo,
      badges: [],
    })) as Promotion[];
  }, 'Error al obtener promociones');
}

/**
 * Obtener una promoción por ID
 */
export async function getPromotionById(
  promotionId: string
): Promise<ApiResponse<Promotion | null>> {
  return handleSupabaseError(async () => {
    const { data, error } = await supabase
      .from('promotions')
      .select('*')
      .eq('id', promotionId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    
    if (!data) return null;
    
    return {
      ...data,
      badges: [],
    } as Promotion;
  }, 'Error al obtener promoción');
}

/**
 * Crear una nueva promoción
 */
export async function createPromotion(
  promotion: CreatePromotionRequest
): Promise<ApiResponse<Promotion>> {
  return handleSupabaseError(async () => {
    await requireAuth(); // Validar autenticación

    const promotionData: any = {
      restaurant_id: promotion.restaurant_id,
      title: promotion.title.trim(),
      description: promotion.description?.trim() || null,
      image_url: promotion.image_url || null,
      category: promotion.category,
      discount_type: promotion.discount_type,
      discount_value: promotion.discount_value || null,
      original_price: promotion.original_price || null,
      final_price: promotion.final_price || null,
      valid_from: promotion.valid_from,
      valid_until: promotion.valid_until,
      is_featured: promotion.is_featured || false,
      is_active: true,
      total_uses: 0,
      applicable_hours: promotion.applicable_hours || null,
      applicable_days: promotion.applicable_days || null,
    };

    const { data, error } = await supabase
      .from('promotions')
      .insert(promotionData)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      badges: [],
    } as Promotion;
  }, 'Error al crear promoción');
}

/**
 * Actualizar una promoción existente
 */
export async function updatePromotion(
  promotionId: string,
  updates: UpdatePromotionRequest
): Promise<ApiResponse<Promotion>> {
  return handleSupabaseError(async () => {
    await requireAuth(); // Validar autenticación

    const updateData: any = {};

    if (updates.title !== undefined) {
      updateData.title = updates.title.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || null;
    }
    if (updates.image_url !== undefined) {
      updateData.image_url = updates.image_url || null;
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category;
    }
    if (updates.discount_type !== undefined) {
      updateData.discount_type = updates.discount_type;
    }
    if (updates.discount_value !== undefined) {
      updateData.discount_value = updates.discount_value || null;
    }
    if (updates.original_price !== undefined) {
      updateData.original_price = updates.original_price || null;
    }
    if (updates.final_price !== undefined) {
      updateData.final_price = updates.final_price || null;
    }
    if (updates.valid_from !== undefined) {
      updateData.valid_from = updates.valid_from;
    }
    if (updates.valid_until !== undefined) {
      updateData.valid_until = updates.valid_until;
    }
    if (updates.is_featured !== undefined) {
      updateData.is_featured = updates.is_featured;
    }
    if (updates.applicable_hours !== undefined) {
      updateData.applicable_hours = updates.applicable_hours;
    }
    if (updates.applicable_days !== undefined) {
      updateData.applicable_days = updates.applicable_days;
    }
    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active;
    }

    const { data, error } = await supabase
      .from('promotions')
      .update(updateData)
      .eq('id', promotionId)
      .select()
      .single();

    if (error) throw error;
    
    return {
      ...data,
      badges: [],
    } as Promotion;
  }, 'Error al actualizar promoción');
}

/**
 * Eliminar una promoción (soft delete)
 */
export async function deletePromotion(
  promotionId: string
): Promise<ApiResponse<boolean>> {
  return handleSupabaseError(async () => {
    await requireAuth(); // Validar autenticación

    // Soft delete: marcar como inactivo
    const { error } = await supabase
      .from('promotions')
      .update({ is_active: false })
      .eq('id', promotionId);

    if (error) throw error;
    return true;
  }, 'Error al eliminar promoción');
}

/**
 * Subir imagen de promoción
 */
export async function uploadPromotionImage(
  file: File | Blob,
  fileName?: string
): Promise<ApiResponse<string>> {
  return handleSupabaseError(async () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const filePath = fileName
      ? `promotion-${timestamp}-${randomStr}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      : `promotion-${timestamp}-${randomStr}`;

    const url = await uploadImage('promotion-images', filePath, file);
    if (!url) {
      throw new Error('Error al subir la imagen');
    }
    return url;
  }, 'Error al subir imagen de promoción');
}
