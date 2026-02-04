import { createClient } from '@supabase/supabase-js';

// Variables de entorno - estas deben configurarse en un archivo .env
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('⚠️ Supabase URL o Anon Key no están configuradas. Usando localStorage como fallback.');
}

// Interceptor para filtrar errores 404 esperados de user_billing_reception_emails en la consola
// Nota: Los errores 404 en la pestaña Network seguirán apareciendo, pero no en la consola
if (typeof window !== 'undefined') {
  // Guardar referencias originales
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Interceptar console.error
  console.error = (...args: any[]) => {
    const message = String(args[0] || '');
    // Filtrar errores 404 relacionados con user_billing_reception_emails
    if (
      message.includes('user_billing_reception_emails') &&
      (message.includes('404') || message.includes('Not Found'))
    ) {
      // No mostrar estos errores en la consola, son esperados hasta que se ejecute el script SQL
      return;
    }
    originalError.apply(console, args);
  };
  
  // Interceptar console.warn
  console.warn = (...args: any[]) => {
    const message = String(args[0] || '');
    if (
      message.includes('user_billing_reception_emails') &&
      (message.includes('404') || message.includes('Not Found'))
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
  
  // Interceptar errores no capturados relacionados con user_billing_reception_emails
  window.addEventListener('error', (event) => {
    const message = event.message || '';
    if (
      message.includes('user_billing_reception_emails') &&
      (message.includes('404') || message.includes('Not Found'))
    ) {
      event.preventDefault();
      event.stopPropagation();
    }
  }, true);
}

// Crear cliente de Supabase con configuración para evitar expiración de sesiones
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Configurar para que los tokens se renueven automáticamente
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token',
    // Refrescar tokens antes de que expiren (cada 30 minutos)
    flowType: 'pkce'
  }
});

// Función helper para verificar si Supabase está configurado
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey);
};

// Exportar la URL de Supabase para uso en otras funciones
export const getSupabaseUrl = (): string => {
  return supabaseUrl;
};
