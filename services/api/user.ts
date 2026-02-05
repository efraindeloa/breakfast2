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
 * Obtener datos básicos del usuario (name, email, phone)
 * El email viene de Supabase Auth, name y phone pueden venir de user_profiles o users
 */
export async function getUserData(
  userId?: string
): Promise<ApiResponse<{ name: string; email: string; phone: string }>> {
  return handleSupabaseError(async () => {
    const targetUserId = userId || await requireAuth();
    
    // Obtener email de Supabase Auth
    const { data: { user: authUser } } = await supabase.auth.getUser();
    const email = authUser?.email || '';

    // Intentar obtener name y phone de user_profiles primero
    const profileResult = await getUserProfile(targetUserId);
    let name = '';
    let phone = '';

    if (profileResult.success && profileResult.data) {
      name = profileResult.data.name || '';
      phone = profileResult.data.phone || '';
    }

    // Si no hay datos en user_profiles, intentar obtener de la tabla users
    if (!name && !phone) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('name, phone')
        .eq('id', targetUserId)
        .maybeSingle();

      if (!userError && userData) {
        name = userData.name || '';
        phone = userData.phone || '';
      }
    }

    // Fallback a metadata de Auth si no hay datos
    if (!name) {
      name = authUser?.user_metadata?.full_name || 
             authUser?.user_metadata?.name || 
             email?.split('@')[0] || 
             '';
    }
    if (!phone) {
      phone = authUser?.phone || authUser?.user_metadata?.phone || '';
    }

    return { name, email, phone };
  }, 'Error al obtener datos del usuario');
}

/**
 * Actualizar datos básicos del usuario (name, phone)
 * El email no se puede actualizar aquí, debe hacerse a través de Supabase Auth
 */
export async function updateUserData(
  updates: { name?: string; phone?: string },
  userId?: string
): Promise<ApiResponse<{ name: string; email: string; phone: string }>> {
  return handleSupabaseError(async () => {
    const targetUserId = userId || await requireAuth();

    // Actualizar en user_profiles (preferido)
    if (updates.name !== undefined || updates.phone !== undefined) {
      await updateUserProfile({
        name: updates.name,
        phone: updates.phone,
      }, targetUserId);
    }

    // También actualizar en la tabla users si existe (para compatibilidad)
    if (updates.name !== undefined || updates.phone !== undefined) {
      const updateData: { name?: string; phone?: string } = {};
      if (updates.name !== undefined) updateData.name = updates.name;
      if (updates.phone !== undefined) updateData.phone = updates.phone;

      const { error: userError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', targetUserId);

      // No lanzar error si la tabla users no existe o no tiene esos campos
      if (userError && userError.code !== 'PGRST116' && !userError.message?.includes('No rows')) {
        console.warn('[updateUserData] Error updating users table (non-critical):', userError);
      }
    }

    // Obtener datos actualizados
    return await getUserData(targetUserId);
  }, 'Error al actualizar datos del usuario');
}

/**
 * Obtener perfil de usuario
 */
export async function getUserProfile(
  userId?: string
): Promise<ApiResponse<UserProfile | null>> {
  return handleSupabaseError(async () => {
    const targetUserId = userId || await requireAuth();

    // Establecer la variable de sesión para RLS
    await supabase.rpc('set_config', {
      setting_name: 'app.user_id',
      setting_value: targetUserId
    });

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

    // Establecer la variable de sesión para RLS
    await supabase.rpc('set_config', {
      setting_name: 'app.user_id',
      setting_value: targetUserId
    });

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
      .select('user_id')
      .eq('user_id', targetUserId)
      .maybeSingle();
    
    // Si hay un error que no sea "no rows found", lanzarlo
    if (checkError && checkError.code !== 'PGRST116' && !checkError.message?.includes('No rows')) {
      throw checkError;
    }

    let result;
    // Si existe un registro (incluso si es solo un objeto con user_id), actualizar
    if (existing && existing.user_id) {
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

export interface UserBillingProfile {
  id: string;
  user_id: string;
  tax_id: string; // RFC
  business_name: string; // Razón social
  email?: string;
  regimen_fiscal?: string;
  uso_cfdi?: string;
  certificate_pdf_url?: string; // URL del PDF de la constancia fiscal
  street?: string;
  external_number?: string;
  internal_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
}

export interface UpsertUserBillingProfileRequest {
  tax_id: string;
  business_name: string;
  email?: string; // Opcional, se puede configurar después
  regimen_fiscal?: string;
  uso_cfdi?: string;
  certificate_pdf_url?: string; // URL del PDF de la constancia fiscal
  street?: string;
  external_number?: string;
  internal_number?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
  is_default?: boolean;
}

/**
 * Obtener perfil de facturación del usuario
 */
export async function getUserBillingProfile(
  userId?: string
): Promise<ApiResponse<UserBillingProfile | null>> {
  return handleSupabaseError(async () => {
    const targetUserId = userId || await requireAuth();

    // Obtener todos los perfiles del usuario
    const { data: allProfiles, error: fetchError } = await supabase
      .from('user_billing_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .order('updated_at', { ascending: false });

    if (fetchError) {
      if (fetchError.code === 'PGRST116' || fetchError.message?.includes('No rows')) {
        return null;
      }
      throw fetchError;
    }

    if (!allProfiles || allProfiles.length === 0) {
      return null;
    }

    // Priorizar: 1) Perfil con PDF, 2) Perfil default, 3) Más reciente
    let selectedProfile = allProfiles[0]; // Por defecto el más reciente
    
    // Buscar perfil con PDF
    const profileWithPdf = allProfiles.find(p => p.certificate_pdf_url && p.certificate_pdf_url.trim());
    if (profileWithPdf) {
      selectedProfile = profileWithPdf;
    } else {
      // Si no hay PDF, buscar perfil default
      const defaultProfile = allProfiles.find(p => p.is_default === true);
      if (defaultProfile) {
        selectedProfile = defaultProfile;
      }
    }

    return selectedProfile as UserBillingProfile;

    if (error) {
      if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
        return null;
      }
      throw error;
    }
    return (data || null) as UserBillingProfile | null;
  }, 'Error al obtener perfil de facturación');
}

/**
 * Guardar o actualizar perfil de facturación del usuario
 */
export async function upsertUserBillingProfile(
  profile: UpsertUserBillingProfileRequest,
  userId?: string
): Promise<ApiResponse<UserBillingProfile>> {
  return handleSupabaseError(async () => {
    const targetUserId = userId || await requireAuth();

    // PRIMERO: Buscar si ya existe un perfil para este usuario (cualquiera, no solo default)
    // Esto evita crear múltiples perfiles
    const { data: existing } = await supabase
      .from('user_billing_profiles')
      .select('id, is_default')
      .eq('user_id', targetUserId)
      .order('is_default', { ascending: false }) // Priorizar el default si existe
      .order('created_at', { ascending: false }) // Si hay varios, tomar el más reciente
      .limit(1)
      .maybeSingle();

    // Construir profileData, incluyendo todos los campos del perfil
    // Si un campo está presente (incluso si es null), se incluirá en la actualización
    const profileData: any = {
      user_id: targetUserId,
      is_default: profile.is_default !== false, // Por defecto es true
    };

    // Incluir todos los campos del perfil que estén presentes
    // Si están presentes pero son null/undefined, se guardarán como null
    Object.keys(profile).forEach(key => {
      if (key !== 'is_default') {
        const value = (profile as any)[key];
        // Incluir el campo incluso si es null, undefined, o string vacío
        // Convertir strings vacíos a null para consistencia
        if (value === undefined) {
          // No incluir si es undefined (no se pasó)
        } else if (typeof value === 'string' && value.trim() === '') {
          profileData[key] = null;
        } else {
          profileData[key] = value || null;
        }
      }
    });

    let result;
    if (existing && existing.id) {
      // Si se marca como default, desmarcar otros perfiles del usuario ANTES de actualizar
      if (profile.is_default !== false) {
        await supabase
          .from('user_billing_profiles')
          .update({ is_default: false })
          .eq('user_id', targetUserId)
          .eq('is_default', true)
          .neq('id', existing.id); // No desmarcar el que vamos a actualizar
      }

      // Actualizar perfil existente
      const { data, error } = await supabase
        .from('user_billing_profiles')
        .update(profileData)
        .eq('id', existing.id)
        .select()
        .single();

      if (error) {
        console.error('[upsertUserBillingProfile] Error updating profile:', error);
        throw error;
      }
      
      result = data;
    } else {
      // Si se marca como default, desmarcar otros perfiles del usuario ANTES de crear
      if (profile.is_default !== false) {
        await supabase
          .from('user_billing_profiles')
          .update({ is_default: false })
          .eq('user_id', targetUserId)
          .eq('is_default', true);
      }

      // Crear nuevo perfil
      const { data, error } = await supabase
        .from('user_billing_profiles')
        .insert(profileData)
        .select()
        .single();

      if (error) {
        console.error('[upsertUserBillingProfile] Error creating profile:', error);
        throw error;
      }
      
      result = data;
    }

    return result as UserBillingProfile;
  }, 'Error al guardar perfil de facturación');
}

// ==================== EMAILS DE RECEPCIÓN DE FACTURAS ====================

// Variable para rastrear si ya mostramos el mensaje informativo sobre la tabla no existente
let hasShownTableMissingMessage = false;

export interface BillingReceptionEmail {
  id: string;
  user_id: string;
  billing_profile_id?: string;
  email: string;
  label?: string;
  is_primary: boolean;
  is_active: boolean;
  auto_send_on_payment: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateBillingReceptionEmailRequest {
  billing_profile_id?: string;
  email: string;
  label?: string;
  is_primary?: boolean;
  auto_send_on_payment?: boolean;
}

export interface UpdateBillingReceptionEmailRequest {
  email?: string;
  label?: string;
  is_primary?: boolean;
  is_active?: boolean;
  auto_send_on_payment?: boolean;
}

/**
 * Obtener emails de recepción del usuario
 */
export async function getBillingReceptionEmails(
  billingProfileId?: string,
  userId?: string
): Promise<ApiResponse<BillingReceptionEmail[]>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase no está configurado',
    };
  }

  try {
    const targetUserId = userId || await requireAuth();

    let query = supabase
      .from('user_billing_reception_emails')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('is_active', true)
      .order('is_primary', { ascending: false })
      .order('created_at', { ascending: true });

    if (billingProfileId) {
      query = query.eq('billing_profile_id', billingProfileId);
    }

    const { data, error } = await query;

    // Si la tabla no existe (PGRST205), retornar array vacío sin error
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        // Solo mostrar el mensaje informativo una vez por sesión
        if (!hasShownTableMissingMessage) {
          console.info(
            '%c[API Info] La tabla user_billing_reception_emails aún no existe.\n' +
            'Los errores 404 en la consola son esperados hasta que ejecutes el script SQL.\n' +
            'Ejecuta: supabase/create-billing-reception-emails-table.sql',
            'color: #3b82f6; font-weight: bold;'
          );
          hasShownTableMissingMessage = true;
        }
        return {
          success: true,
          data: [],
        };
      }
      throw error;
    }
    
    return {
      success: true,
      data: (data || []) as BillingReceptionEmail[],
    };
  } catch (error: any) {
    // Solo mostrar error si no es el caso de tabla no existente
    if (error.code !== 'PGRST205' && !error.message?.includes('Could not find the table')) {
      console.error('[API Error] Error al obtener emails de recepción:', error);
    }
    
    return {
      success: false,
      error: error.message || 'Error al obtener emails de recepción',
    };
  }
}

/**
 * Crear un email de recepción
 */
export async function createBillingReceptionEmail(
  email: CreateBillingReceptionEmailRequest,
  userId?: string
): Promise<ApiResponse<BillingReceptionEmail>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase no está configurado',
    };
  }

  try {
    const targetUserId = userId || await requireAuth();

    // Si se marca como primary, desmarcar otros emails del mismo perfil
    if (email.is_primary && email.billing_profile_id) {
      const { error: updateError } = await supabase
        .from('user_billing_reception_emails')
        .update({ is_primary: false })
        .eq('user_id', targetUserId)
        .eq('billing_profile_id', email.billing_profile_id)
        .eq('is_active', true);
      
      // Ignorar error si la tabla no existe
      if (updateError && updateError.code !== 'PGRST205' && !updateError.message?.includes('Could not find the table')) {
        console.warn('[API Warning] Error al actualizar emails primarios:', updateError);
      }
    }

    const emailData = {
      user_id: targetUserId,
      billing_profile_id: email.billing_profile_id || null,
      email: email.email,
      label: email.label || null,
      is_primary: email.is_primary || false,
      auto_send_on_payment: email.auto_send_on_payment !== false, // Por defecto true
      is_active: true
    };

    const { data, error } = await supabase
      .from('user_billing_reception_emails')
      .insert(emailData)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return {
          success: false,
          error: 'La tabla de emails de recepción no existe. Por favor, ejecuta el script SQL para crearla.',
        };
      }
      throw error;
    }
    
    return {
      success: true,
      data: data as BillingReceptionEmail,
    };
  } catch (error: any) {
    console.error('[API Error] Error al crear email de recepción:', error);
    return {
      success: false,
      error: error.message || 'Error al crear email de recepción',
    };
  }
}

/**
 * Actualizar un email de recepción
 */
export async function updateBillingReceptionEmail(
  emailId: string,
  updates: UpdateBillingReceptionEmailRequest,
  userId?: string
): Promise<ApiResponse<BillingReceptionEmail>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase no está configurado',
    };
  }

  try {
    const targetUserId = userId || await requireAuth();

    // Si se marca como primary, obtener el billing_profile_id y desmarcar otros
    if (updates.is_primary) {
      const { data: currentEmail, error: selectError } = await supabase
        .from('user_billing_reception_emails')
        .select('billing_profile_id')
        .eq('id', emailId)
        .eq('user_id', targetUserId)
        .single();

      // Si la tabla no existe, retornar error informativo
      if (selectError) {
        if (selectError.code === 'PGRST205' || selectError.message?.includes('Could not find the table')) {
          return {
            success: false,
            error: 'La tabla de emails de recepción no existe. Por favor, ejecuta el script SQL para crearla.',
          };
        }
        throw selectError;
      }

      if (currentEmail?.billing_profile_id) {
        const { error: updateError } = await supabase
          .from('user_billing_reception_emails')
          .update({ is_primary: false })
          .eq('user_id', targetUserId)
          .eq('billing_profile_id', currentEmail.billing_profile_id)
          .eq('is_active', true)
          .neq('id', emailId);
        
        if (updateError && updateError.code !== 'PGRST205' && !updateError.message?.includes('Could not find the table')) {
          console.warn('[API Warning] Error al actualizar emails primarios:', updateError);
        }
      }
    }

    const { data, error } = await supabase
      .from('user_billing_reception_emails')
      .update(updates)
      .eq('id', emailId)
      .eq('user_id', targetUserId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        return {
          success: false,
          error: 'La tabla de emails de recepción no existe. Por favor, ejecuta el script SQL para crearla.',
        };
      }
      throw error;
    }
    
    return {
      success: true,
      data: data as BillingReceptionEmail,
    };
  } catch (error: any) {
    console.error('[API Error] Error al actualizar email de recepción:', error);
    return {
      success: false,
      error: error.message || 'Error al actualizar email de recepción',
    };
  }
}

/**
 * Eliminar (soft delete) un email de recepción
 */
export async function deleteBillingReceptionEmail(
  emailId: string,
  userId?: string
): Promise<ApiResponse<boolean>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase no está configurado',
    };
  }

  try {
    const targetUserId = userId || await requireAuth();

    const { error } = await supabase
      .from('user_billing_reception_emails')
      .update({ is_active: false })
      .eq('id', emailId)
      .eq('user_id', targetUserId);

    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        // Si la tabla no existe, considerar que la operación fue exitosa (no hay nada que eliminar)
        // No mostrar mensaje adicional, ya se mostró en getBillingReceptionEmails
        return {
          success: true,
          data: true,
        };
      }
      throw error;
    }
    
    return {
      success: true,
      data: true,
    };
  } catch (error: any) {
    if (error.code !== 'PGRST205' && !error.message?.includes('Could not find the table')) {
      console.error('[API Error] Error al eliminar email de recepción:', error);
    }
    return {
      success: false,
      error: error.message || 'Error al eliminar email de recepción',
    };
  }
}

/**
 * Actualizar configuración de envío automático para todos los emails del usuario
 */
export async function updateBillingAutoSendConfig(
  autoSend: boolean,
  billingProfileId?: string,
  userId?: string
): Promise<ApiResponse<boolean>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase no está configurado',
    };
  }

  try {
    const targetUserId = userId || await requireAuth();

    let query = supabase
      .from('user_billing_reception_emails')
      .update({ auto_send_on_payment: autoSend })
      .eq('user_id', targetUserId)
      .eq('is_active', true);

    if (billingProfileId) {
      query = query.eq('billing_profile_id', billingProfileId);
    }

    const { error } = await query;

    // Si la tabla no existe, no es un error crítico, solo informar
    if (error) {
      if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
        // No mostrar mensaje adicional, ya se mostró en getBillingReceptionEmails
        return {
          success: true,
          data: true,
        };
      }
      throw error;
    }
    
    return {
      success: true,
      data: true,
    };
  } catch (error: any) {
    if (error.code !== 'PGRST205' && !error.message?.includes('Could not find the table')) {
      console.error('[API Error] Error al actualizar configuración de envío automático:', error);
    }
    return {
      success: false,
      error: error.message || 'Error al actualizar configuración de envío automático',
    };
  }
}
