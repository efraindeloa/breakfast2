/**
 * API para operaciones de Secciones de Menú
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { handleSupabaseError, requireAuth } from './base';
import { ApiResponse } from './types';

export interface RestaurantMenuSection {
  id: string;
  restaurant_id: string;
  section_type: 'chef_suggestions' | 'highlights' | 'menu_items';
  category: string;
  product_ids: number[];
  created_at: string;
  updated_at: string;
}

export type PicksByCategory = Record<string, number[]>;

/**
 * Obtener secciones de menú de un restaurante
 */
export async function getMenuSections(
  restaurantId: string
): Promise<ApiResponse<[PicksByCategory, PicksByCategory, PicksByCategory]>> {
  return handleSupabaseError(async () => {
    const { data, error } = await supabase
      .from('restaurant_menu_sections')
      .select('*')
      .eq('restaurant_id', restaurantId)
      .order('category', { ascending: true });

    if (error) throw error;

    // Convertir a formato PicksByCategory
    const chefSuggestions: PicksByCategory = {};
    const highlights: PicksByCategory = {};
    const menuItems: PicksByCategory = {};

    (data || []).forEach((section: RestaurantMenuSection) => {
      const category = section.category;
      const productIds = section.product_ids || [];

      if (section.section_type === 'chef_suggestions') {
        chefSuggestions[category] = productIds;
      } else if (section.section_type === 'highlights') {
        highlights[category] = productIds;
      } else if (section.section_type === 'menu_items') {
        menuItems[category] = productIds;
      }
    });

    return [chefSuggestions, highlights, menuItems];
  }, 'Error al obtener secciones de menú');
}

/**
 * Guardar secciones de menú de un restaurante
 */
export async function saveMenuSections(
  restaurantId: string,
  chefSuggestions: PicksByCategory,
  highlights: PicksByCategory,
  menuItems: PicksByCategory
): Promise<ApiResponse<boolean>> {
  return handleSupabaseError(async () => {
    await requireAuth(); // Validar autenticación

    // Obtener todas las categorías únicas
    const allCategories = new Set<string>();
    Object.keys(chefSuggestions).forEach(cat => allCategories.add(cat));
    Object.keys(highlights).forEach(cat => allCategories.add(cat));
    Object.keys(menuItems).forEach(cat => allCategories.add(cat));

    // Preparar todos los registros para upsert
    const records: Omit<RestaurantMenuSection, 'id' | 'created_at' | 'updated_at'>[] = [];

    allCategories.forEach(category => {
      // Chef suggestions
      if (chefSuggestions[category] && chefSuggestions[category].length > 0) {
        records.push({
          restaurant_id: restaurantId,
          section_type: 'chef_suggestions',
          category,
          product_ids: chefSuggestions[category],
        });
      }

      // Highlights
      if (highlights[category] && highlights[category].length > 0) {
        records.push({
          restaurant_id: restaurantId,
          section_type: 'highlights',
          category,
          product_ids: highlights[category],
        });
      }

      // Menu items
      if (menuItems[category] && menuItems[category].length > 0) {
        records.push({
          restaurant_id: restaurantId,
          section_type: 'menu_items',
          category,
          product_ids: menuItems[category],
        });
      }
    });

    // Obtener todas las secciones existentes
    const { data: existingSections } = await supabase
      .from('restaurant_menu_sections')
      .select('id, restaurant_id, section_type, category, product_ids')
      .eq('restaurant_id', restaurantId);

    const existingMap = new Map<string, RestaurantMenuSection>();
    (existingSections || []).forEach((section: RestaurantMenuSection) => {
      const key = `${section.section_type}_${section.category}`;
      existingMap.set(key, section);
    });

    // Preparar upserts y deletes
    const toUpsert: any[] = [];
    const toDelete: string[] = [];

    records.forEach(record => {
      const key = `${record.section_type}_${record.category}`;
      const existing = existingMap.get(key);

      if (existing) {
        // Actualizar si los product_ids cambiaron
        if (JSON.stringify(existing.product_ids) !== JSON.stringify(record.product_ids)) {
          toUpsert.push({
            id: existing.id,
            ...record,
          });
        }
        existingMap.delete(key); // Marcar como procesado
      } else {
        // Nuevo registro
        toUpsert.push(record);
      }
    });

    // Los que quedan en existingMap deben eliminarse
    existingMap.forEach(section => {
      toDelete.push(section.id);
    });

    // Ejecutar upserts
    if (toUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('restaurant_menu_sections')
        .upsert(toUpsert, {
          onConflict: 'restaurant_id,section_type,category',
        });

      if (upsertError) throw upsertError;
    }

    // Ejecutar deletes
    if (toDelete.length > 0) {
      const { error: deleteError } = await supabase
        .from('restaurant_menu_sections')
        .delete()
        .in('id', toDelete);

      if (deleteError) throw deleteError;
    }

    return true;
  }, 'Error al guardar secciones de menú');
}
