/**
 * Autenticación simple: solo tabla users con password_hash
 * Sin Supabase Auth, sin complicaciones
 */

import { supabase } from '../config/supabase';
import { hashPassword, verifyPassword } from '../utils/password';

/**
 * Registrar usuario directamente en la tabla users
 */
export async function simpleSignUp(params: {
  email: string;
  password: string;
  name: string;
  phone?: string;
  account_type?: 'owner' | 'manager' | 'hostess' | 'waiter' | 'cashier' | 'kitchen' | 'delivery_driver' | 'delivery_manager' | 'accountant' | 'support' | 'customer' | 'valet_parking';
}): Promise<{ success: boolean; error?: string; userId?: string }> {
  try {
    // Verificar si el usuario ya existe
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', params.email)
      .maybeSingle();

    if (existing) {
      return { success: false, error: 'El usuario ya existe' };
    }

    // Hashear contraseña
    const passwordHash = await hashPassword(params.password);

    // Insertar usuario
    const { data, error } = await supabase
      .from('users')
      .insert({
        email: params.email,
        name: params.name,
        phone: params.phone || null,
        password_hash: passwordHash,
        account_type: params.account_type || 'customer',
        is_active: true,
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, userId: data.id };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al registrar usuario' };
  }
}

export async function simpleSignIn(
  identifier: string,
  password: string
): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    const normalizedIdentifier = identifier.trim();
    const lowerIdentifier = normalizedIdentifier.toLowerCase();

    let query = supabase
      .from('users')
      .select('id, email, name, phone, password_hash, is_active')
      .eq('is_active', true);

    // Buscar por email (case-insensitive)
    let { data: user, error } = await query
      .ilike('email', lowerIdentifier)
      .maybeSingle();

    // Buscar por phone
    if (!user && !error) {
      const { data, error: phoneError } = await supabase
        .from('users')
        .select('id, email, name, phone, password_hash, is_active')
        .eq('is_active', true)
        .eq('phone', normalizedIdentifier)
        .maybeSingle();

      user = data;
      error = phoneError;
    }

    // Buscar por name (case-insensitive)
    if (!user && !error) {
      const { data, error: nameError } = await supabase
        .from('users')
        .select('id, email, name, phone, password_hash, is_active')
        .ilike('name', lowerIdentifier)
        .maybeSingle();

      user = data;
      error = nameError;
    }

    if (error || !user) {
      return { success: false, error: 'El usuario no existe' };
    }

    if (!user.password_hash) {
      return { success: false, error: 'Usuario sin contraseña configurada' };
    }

    const isValid = await verifyPassword(password, user.password_hash);
    if (!isValid) {
      return { success: false, error: 'La contraseña es incorrecta' };
    }

    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    const { password_hash, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al iniciar sesión' };
  }
}
