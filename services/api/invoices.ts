/**
 * API para facturación (Edge Function)
 */

import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { handleSupabaseError } from './base';
import { ApiResponse } from './types';

export interface GenerateInvoiceParams {
  order_id: string;
  restaurant_id: string;
  [key: string]: unknown;
}

export interface GenerateInvoiceResult {
  success: boolean;
  message?: string;
  order_id?: string;
  restaurant_id?: string;
  invoice_url?: string | null;
}

/**
 * Generar factura (Edge Function)
 */
export async function generateInvoice(
  params: GenerateInvoiceParams
): Promise<ApiResponse<GenerateInvoiceResult>> {
  return handleSupabaseError(async () => {
    if (!isSupabaseConfigured()) {
      throw new Error('Supabase no está configurado');
    }
    const { data, error } = await supabase.functions.invoke('generate-invoice', {
      body: params,
    });
    if (error) throw error;
    return (data ?? { success: false }) as GenerateInvoiceResult;
  }, 'Error al generar factura');
}
