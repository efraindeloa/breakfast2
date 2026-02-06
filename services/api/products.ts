/**
 * API para operaciones CRUD de Productos
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { handleSupabaseError, requireAuth } from './base';
import { ApiResponse } from './types';
import { Product, ProductComplement } from '../database';
import { getImageUrl, uploadImage, deleteImage } from '../database';

export interface CreateProductRequest {
  restaurant_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  image_urls?: string[];
  badges?: string[];
  category: string;
  origin?: string;
  complements?: ProductComplement[];
  allow_custom_complements?: boolean;
  allow_special_instructions?: boolean;
}

export interface UpdateProductRequest {
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  image_urls?: string[];
  badges?: string[];
  category?: string;
  origin?: string;
  complements?: ProductComplement[];
  allow_custom_complements?: boolean;
  allow_special_instructions?: boolean;
}

/**
 * Obtener todos los productos
 */
export async function getProducts(
  restaurantId?: string,
  filters?: {
    category?: string;
    origin?: string;
    isActive?: boolean;
  }
): Promise<ApiResponse<Product[]>> {
  return handleSupabaseError(async () => {
    let query = supabase
      .from('products')
      .select('*');

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    if (filters?.isActive !== undefined) {
      query = query.eq('is_active', filters.isActive);
    } else {
      query = query.eq('is_active', true);
    }

    if (filters?.category) {
      query = query.eq('category', filters.category);
    }

    if (filters?.origin) {
      query = query.eq('origin', filters.origin);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as Product[];
  }, 'Error al obtener productos');
}

/**
 * Obtener un producto por ID
 */
export async function getProductById(
  productId: number,
  restaurantId?: string
): Promise<ApiResponse<Product | null>> {
  return handleSupabaseError(async () => {
    let query = supabase
      .from('products')
      .select('*')
      .eq('id', productId)
      .eq('is_active', true);

    if (restaurantId) {
      query = query.eq('restaurant_id', restaurantId);
    }

    const { data, error } = await query.single();

    if (error && error.code !== 'PGRST116') throw error;
    return (data || null) as Product | null;
  }, 'Error al obtener producto');
}

/**
 * Crear un nuevo producto
 */
export async function createProduct(
  product: CreateProductRequest
): Promise<ApiResponse<Product>> {
  return handleSupabaseError(async () => {
    const userId = await requireAuth(); // Validar autenticación

    // Establecer la variable de sesión para RLS (compatible con autenticación simple)
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.user_id',
        setting_value: userId
      });
    } catch (error) {
      console.warn('[createProduct] No se pudo establecer app.user_id, continuando...', error);
    }

    const productData: any = {
      restaurant_id: product.restaurant_id,
      name: product.name.trim(),
      description: product.description?.trim() || '', // NOT NULL, usar cadena vacía en lugar de null
      price: product.price,
      category: product.category,
      origin: product.origin || '', // NOT NULL DEFAULT '', usar cadena vacía en lugar de null
      badges: product.badges || [],
      // complements, allow_custom_complements y allow_special_instructions removidos - columnas no existen en la BD
      is_active: true,
    };

    // Manejar imágenes (solo image_url, image_urls no existe en la BD)
    if (product.image_url) {
      productData.image_url = product.image_url;
    }

    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }, 'Error al crear producto');
}

/**
 * Actualizar un producto existente
 */
export async function updateProduct(
  productId: number,
  updates: UpdateProductRequest
): Promise<ApiResponse<Product>> {
  return handleSupabaseError(async () => {
    const userId = await requireAuth(); // Validar autenticación

    // Establecer la variable de sesión para RLS (compatible con autenticación simple)
    try {
      await supabase.rpc('set_config', {
        setting_name: 'app.user_id',
        setting_value: userId
      });
    } catch (error) {
      console.warn('[updateProduct] No se pudo establecer app.user_id, continuando...', error);
    }

    const updateData: any = {};

    if (updates.name !== undefined) {
      updateData.name = updates.name.trim();
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description?.trim() || ''; // Usar cadena vacía en lugar de null
    }
    if (updates.price !== undefined) {
      updateData.price = updates.price;
    }
    if (updates.category !== undefined) {
      updateData.category = updates.category;
    }
    if (updates.origin !== undefined) {
      updateData.origin = updates.origin || ''; // NOT NULL DEFAULT '', usar cadena vacía en lugar de null
    }
    if (updates.badges !== undefined) {
      updateData.badges = updates.badges;
    }
    // complements, allow_custom_complements y allow_special_instructions removidos - columnas no existen en la BD

    // Manejar imágenes (solo image_url, image_urls no existe en la BD)
    if (updates.image_url) {
      updateData.image_url = updates.image_url;
    }

    const { data, error } = await supabase
      .from('products')
      .update(updateData)
      .eq('id', productId)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  }, 'Error al actualizar producto');
}

/**
 * Eliminar un producto (soft delete)
 */
export async function deleteProduct(productId: number): Promise<ApiResponse<boolean>> {
  return handleSupabaseError(async () => {
    await requireAuth(); // Validar autenticación

    // Soft delete: marcar como inactivo
    const { error: updateError } = await supabase
      .from('products')
      .update({ is_active: false })
      .eq('id', productId);

    if (updateError) throw updateError;

    // Remover de restaurant_menu_sections
    const { data: sections, error: sectionsError } = await supabase
      .from('restaurant_menu_sections')
      .select('*')
      .contains('product_ids', [productId]);

    if (sectionsError) throw sectionsError;

    if (sections && sections.length > 0) {
      for (const section of sections) {
        const updatedProductIds = (section.product_ids || []).filter(
          (id: number) => id !== productId
        );

        if (updatedProductIds.length === 0) {
          // Si no quedan productos, eliminar la sección
          await supabase
            .from('restaurant_menu_sections')
            .delete()
            .eq('id', section.id);
        } else {
          // Actualizar la sección con los IDs restantes
          await supabase
            .from('restaurant_menu_sections')
            .update({ product_ids: updatedProductIds })
            .eq('id', section.id);
        }
      }
    }

    return true;
  }, 'Error al eliminar producto');
}

/**
 * Subir imagen de producto
 */
export async function uploadProductImage(
  file: File | Blob,
  fileName?: string
): Promise<ApiResponse<string>> {
  return handleSupabaseError(async () => {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 9);
    const filePath = fileName 
      ? `product-${timestamp}-${randomStr}-${fileName.replace(/[^a-zA-Z0-9.-]/g, '_')}`
      : `product-${timestamp}-${randomStr}`;

    const url = await uploadImage('product-images', filePath, file);
    if (!url) {
      throw new Error('Error al subir la imagen');
    }
    return url;
  }, 'Error al subir imagen de producto');
}
