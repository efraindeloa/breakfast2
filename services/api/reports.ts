/**
 * API para reportes (RPC)
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { handleSupabaseError } from './base';
import { ApiResponse } from './types';

export interface MonthlyReport {
  restaurant_id: string;
  year: number;
  month: number;
  total_orders: number;
  total_revenue: number;
}

/**
 * Calcular reporte mensual por restaurante (RPC)
 */
export async function getMonthlyReport(
  restaurantId: string,
  year: number,
  month: number
): Promise<ApiResponse<MonthlyReport>> {
  return handleSupabaseError(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }
    const { data, error } = await supabase.rpc('calculate_monthly_report', {
      p_restaurant_id: restaurantId,
      p_year: year,
      p_month: month,
    });
    if (error) throw error;
    return data as MonthlyReport;
  }, 'Error al calcular reporte mensual');
}
