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

/**
 * Iniciar sesión verificando contraseña directamente
 */
export async function simpleSignIn(
  identifier: string, // email, phone o name
  password: string
): Promise<{ success: boolean; error?: string; user?: any }> {
  try {
    // Buscar usuario por email, phone o name
    let query = supabase
      .from('users')
      .select('id, email, name, phone, password_hash, is_active')
      .eq('is_active', true);

    // Intentar por email primero
    let { data: user, error } = await query.eq('email', identifier).maybeSingle();

    // Si no se encuentra, buscar por phone
    if (!user && !error) {
      const phoneQuery = supabase
        .from('users')
        .select('id, email, name, phone, password_hash, is_active')
        .eq('is_active', true)
        .eq('phone', identifier);
      const result = await phoneQuery.maybeSingle();
      user = result.data;
      error = result.error;
    }

    // Si no se encuentra, buscar por name
    if (!user && !error) {
      const nameQuery = supabase
        .from('users')
        .select('id, email, name, phone, password_hash, is_active')
        .eq('is_active', true)
        .eq('name', identifier);
      const result = await nameQuery.maybeSingle();
      user = result.data;
      error = result.error;
    }

    if (error || !user) {
      return { success: false, error: 'El usuario no existe' };
    }

    if (!user.password_hash) {
      return { success: false, error: 'Usuario sin contraseña configurada' };
    }

    // Verificar contraseña
    const isValid = await verifyPassword(password, user.password_hash);

    if (!isValid) {
      return { success: false, error: 'La contraseña es incorrecta' };
    }

    // Actualizar last_login_at
    await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', user.id);

    // Retornar usuario sin password_hash
    const { password_hash, ...userWithoutPassword } = user;
    return { success: true, user: userWithoutPassword };
  } catch (error: any) {
    return { success: false, error: error.message || 'Error al iniciar sesión' };
  }
}
