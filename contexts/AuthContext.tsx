import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../config/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, phone?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInWithGoogle: () => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  // Cargar sesión al iniciar
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Si el usuario se autenticó (con OAuth o registro normal), asegurar que existe en la tabla users
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        try {
          const user = session.user;
          // Obtener nombre del perfil de OAuth si está disponible
          const fullName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          'Usuario';
          
          // Verificar si el usuario ya existe antes de hacer upsert
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', user.id)
            .single();
          
          if (existingUser) {
            // Si existe, solo actualizar los campos que pueden haber cambiado
            await supabase
              .from('users')
              .update({
                email: user.email,
                phone: user.phone || user.user_metadata?.phone || null,
                name: fullName,
                avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
                is_active: true,
              })
              .eq('id', user.id);
          } else {
            // Si no existe, insertar
            await supabase.from('users').insert({
              id: user.id,
              email: user.email,
              phone: user.phone || user.user_metadata?.phone || null,
              name: fullName,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              is_active: true,
            });
          }
        } catch (dbError: any) {
          // Solo loggear errores que no sean conflictos esperados
          if (dbError?.code !== '23505' && dbError?.status !== 409) {
            console.warn('[AuthContext] Error syncing user data:', dbError);
          }
        }
      }
      
      setLoading(false);
    });

    // Renovar sesión periódicamente para evitar expiración (cada 30 minutos)
    const refreshInterval = setInterval(async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            // Refrescar el token si la sesión existe
            const { data, error } = await supabase.auth.refreshSession();
            if (error) {
              console.warn('[AuthContext] Error refreshing session:', error);
            } else if (data.session) {
              console.log('[AuthContext] Session refreshed successfully');
            }
          }
        } catch (error) {
          console.warn('[AuthContext] Error in refresh interval:', error);
        }
      }
    }, 30 * 60 * 1000); // 30 minutos

    return () => {
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signUp = async (email: string, password: string, phone?: string): Promise<{ error: AuthError | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: { name: 'AuthError', message: 'Supabase no está configurado' } as AuthError };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        phone,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
          // Desactivar confirmación de email - el usuario puede iniciar sesión inmediatamente
          data: {
            email_verified: true,
          },
          // Desactivar envío de email de confirmación
          captchaToken: undefined,
        },
      });

      if (error) {
        return { error };
      }

      // Si el usuario se registró correctamente, crear registro en la tabla users
      // Nota: En versiones recientes de Supabase, la confirmación de email puede estar
      // desactivada por defecto. El código ya incluye email_verified: true en los metadatos.
      if (data.user) {
        try {
          // Verificar si el usuario ya existe antes de insertar
          const { data: existingUser } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .single();
          
          if (!existingUser) {
            // Solo insertar si no existe
            await supabase.from('users').insert({
              id: data.user.id,
              email: data.user.email,
              phone: data.user.phone || phone,
              name: data.user.email?.split('@')[0] || 'Usuario',
              is_active: true,
            });
          }
          // Si ya existe, no hacer nada (el onAuthStateChange lo actualizará si es necesario)
        } catch (dbError: any) {
          // Solo loggear errores que no sean conflictos esperados
          if (dbError?.code !== '23505' && dbError?.status !== 409) {
            console.warn('Error creating user in database:', dbError);
          }
          // No fallar el registro si hay error en la BD
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ error: AuthError | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: { name: 'AuthError', message: 'Supabase no está configurado' } as AuthError };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Usuario autenticado exitosamente
      if (data.user) {
        console.log('[AuthContext] User authenticated:', data.user.email);
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signInWithGoogle = async (): Promise<{ error: AuthError | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: { name: 'AuthError', message: 'Supabase no está configurado' } as AuthError };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/home`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });

      if (error) {
        return { error };
      }

      // Si el usuario se autentica con Google, los datos se obtendrán automáticamente
      // y se guardarán en user_metadata (full_name, avatar_url, etc.)
      // Esto se manejará en el listener onAuthStateChange

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured()) return;

    try {
      await supabase.auth.signOut();
      console.log('[AuthContext] User signed out');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const resetPassword = async (email: string): Promise<{ error: AuthError | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: { name: 'AuthError', message: 'Supabase no está configurado' } as AuthError };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const updatePassword = async (newPassword: string): Promise<{ error: AuthError | null }> => {
    if (!isSupabaseConfigured()) {
      return { error: { name: 'AuthError', message: 'Supabase no está configurado' } as AuthError };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      return { error };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        signUp,
        signIn,
        signInWithGoogle,
        signOut,
        resetPassword,
        updatePassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
