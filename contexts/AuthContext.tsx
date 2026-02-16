import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { registerRestaurant } from '../services/database';

/** Rol del usuario en restaurant_staff cuando accountType === 'restaurant'. null si es comensal o no hay staff. */
export type StaffRole = 'owner' | 'admin' | 'manager' | 'waiter' | 'chef' | 'cashier' | string;

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accountType: 'restaurant' | 'diner';
  /** Rol en restaurant_staff cuando accountType === 'restaurant'; null en caso contrario. */
  staffRole: StaffRole | null;
  userType: 'registered' | 'guest';
  signUp: (params: { 
    email?: string; 
    phone?: string; 
    password: string;
    name: string;
    restaurantName?: string;
    rfc?: string;
    restaurantAddress?: { address?: string; website?: string; postal_code?: string; country?: string; state?: string; city?: string };
  }) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signInAsGuest: () => void;
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
  const [accountType, setAccountType] = useState<'restaurant' | 'diner'>('diner');
  const [staffRole, setStaffRole] = useState<StaffRole | null>(null);
  const [userType, setUserType] = useState<'registered' | 'guest'>('registered');

  // Track users currently being created to avoid race conditions with onAuthStateChange
  const usersBeingCreated = React.useRef<Set<string>>(new Set());
  // Track emails being registered to mark them before signUp completes
  const emailsBeingRegistered = React.useRef<Set<string>>(new Set());
  // Track if we're in the middle of a sign-in/sign-up operation
  const isAuthenticating = React.useRef<boolean>(false);

  // Función para refrescar accountType
  const refreshAccountType = async (userId?: string | null, retries = 3) => {
    if (!userId) {
      setAccountType('diner');
      setStaffRole(null);
      return;
    }
    
    try {
      console.log(`[AuthContext] Checking account type for user: ${userId}, retries left: ${retries}`);
      
      const { data: staffRow, error } = await supabase
        .from('restaurant_staff')
        .select('id, role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      if (error) {
        console.warn('[AuthContext] Error checking restaurant_staff:', error);
        if (retries > 0) {
          // Esperar un poco y reintentar
          await new Promise(resolve => setTimeout(resolve, 1000));
          return refreshAccountType(userId, retries - 1);
        }
        setAccountType('diner');
        setStaffRole(null);
        return;
      }
      
      const newAccountType = staffRow ? 'restaurant' : 'diner';
      setStaffRole(staffRow?.role ?? null);
      console.log(`[AuthContext] Account type determined: ${newAccountType}`, staffRow);
      setAccountType(newAccountType);
    } catch (error) {
      console.error('[AuthContext] Exception in refreshAccountType:', error);
      if (retries > 0) {
        // Esperar un poco y reintentar
        await new Promise(resolve => setTimeout(resolve, 1000));
        return refreshAccountType(userId, retries - 1);
      }
      setAccountType('diner');
      setStaffRole(null);
    }
  };

  // Función para iniciar sesión como invitado
  const signInAsGuest = () => {
    const guestId = crypto.randomUUID();
    const guestData = {
      id: guestId,
      createdAt: new Date().toISOString()
    };
    
    // Crear un usuario invitado temporal
    const guestUser = {
      id: guestId,
      email: null,
      phone: null,
      user_metadata: {
        full_name: 'Usuario Invitado',
        name: 'Usuario Invitado'
      }
    } as unknown as User;
    
    setUser(guestUser);
    setSession({
      user: guestUser,
      access_token: 'guest-token',
      refresh_token: 'guest-refresh',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer'
    } as Session);
    setUserType('guest');
    setAccountType('diner'); // Los invitados siempre son comensales
    setStaffRole(null);
    setLoading(false);
    
    localStorage.setItem('guestSession', JSON.stringify(guestData));
    console.log('[AuthContext] Sesión de invitado iniciada:', guestId);
  };

  // Cargar sesión al iniciar
  useEffect(() => {
    // Verificar si hay sesión de invitado
    const guestSession = localStorage.getItem('guestSession');
    if (guestSession) {
      try {
        const guestData = JSON.parse(guestSession);
        signInAsGuest();
        return;
      } catch (error) {
        console.error('[AuthContext] Error al cargar sesión de invitado:', error);
        localStorage.removeItem('guestSession');
      }
    }
    
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    // Timeout de seguridad: si después de 5 segundos no se ha resuelto, forzar loading = false
    const safetyTimeout = setTimeout(() => {
      if (!isAuthenticating.current) {
        console.warn('[AuthContext] Safety timeout: forcing loading to false');
        setLoading(false);
      }
    }, 5000);

    // Obtener sesión inicial
    supabase.auth.getSession().then(({ data: { session } }) => {
      clearTimeout(safetyTimeout);
      setSession(session);
      setUser(session?.user ?? null);
      setUserType(session?.user ? 'registered' : 'guest');
      
      // Actualizar accountType de forma no bloqueante
      refreshAccountType(session?.user?.id ?? null).catch(() => {
        setAccountType('diner');
      });
      setLoading(false);
    }).catch((error) => {
      clearTimeout(safetyTimeout);
      console.warn('[AuthContext] Error getting initial session:', error);
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Solo log si hay sesión o si no es INITIAL_SESSION (para evitar logs innecesarios)
      if (session?.user || event !== 'INITIAL_SESSION') {
        console.log('[AuthContext] Auth state change:', event, session?.user?.id);
      }
      
      // Para INITIAL_SESSION o TOKEN_REFRESHED, actualizar estado normalmente
      if (session?.user && (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        setSession(session);
        setUser(session.user);
        setUserType('registered');
        
        refreshAccountType(session.user.id).catch(() => {
          setAccountType('diner');
        });
        
        isAuthenticating.current = false;
        setLoading(false);
        return;
      }
      
      // Marcar que ya no estamos autenticando
      if (event === 'SIGNED_IN' && session?.user) {
        isAuthenticating.current = false;
      }
      
      if (event === 'SIGNED_OUT') {
        isAuthenticating.current = false;
      }
      
      // Si el usuario se autenticó (SIGNED_IN), verificar que existe en la tabla users
      if (session?.user && event === 'SIGNED_IN') {
        try {
          const user = session.user;
          
          // Verificar si el usuario existe en la tabla users
          let existingUser = null;
          let checkError = null;
          let retries = 10;
          
          while (retries >= 0) {
            const result = await supabase
              .from('users')
              .select('id, email, name')
              .eq('id', user.id)
              .maybeSingle();
            
            existingUser = result.data;
            checkError = result.error;
            
            if (existingUser) {
              break;
            }
            
            if (retries > 0) {
              const waitTime = retries > 7 ? 1500 : retries > 4 ? 1000 : 500;
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries--;
            } else {
              break;
            }
          }
          
          if (checkError && checkError.code !== 'PGRST116') {
            console.error('[AuthContext] Error checking user existence:', checkError);
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setUserType('guest');
            setLoading(false);
            return;
          }
          
          if (!existingUser) {
            // Verificar si el usuario se está creando actualmente
            const isBeingCreated = usersBeingCreated.current.has(user.id);
            const isEmailBeingRegistered = user.email ? emailsBeingRegistered.current.has(user.email) : false;
            const isPhoneBeingRegistered = user.phone ? emailsBeingRegistered.current.has(user.phone) : false;
            const isBeingRegistered = isBeingCreated || isEmailBeingRegistered || isPhoneBeingRegistered;
            
            if (isBeingRegistered) {
              // Esperar más tiempo para que signUp termine
              let foundAfterWait = false;
              for (let waitAttempt = 0; waitAttempt < 5; waitAttempt++) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                const { data: finalCheck } = await supabase
                  .from('users')
                  .select('id, email, name')
                  .eq('id', user.id)
                  .maybeSingle();
                
                if (finalCheck) {
                  existingUser = finalCheck;
                  foundAfterWait = true;
                  usersBeingCreated.current.delete(user.id);
                  break;
                }
              }
              
              if (foundAfterWait) {
                if (user.email) emailsBeingRegistered.current.delete(user.email);
                if (user.phone) emailsBeingRegistered.current.delete(user.phone);
              }
            }
            
            if (!existingUser) {
              const stillBeingRegistered = (user.email && emailsBeingRegistered.current.has(user.email)) || 
                                        (user.phone && emailsBeingRegistered.current.has(user.phone));
              
              if (stillBeingRegistered) {
                setLoading(false);
                return;
              }
              
              // Usuario no existe en la tabla users - cerrar sesión
              console.error('[AuthContext] User authenticated but not in users table:', user.id);
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setUserType('guest');
              setLoading(false);
              return;
            }
          } else {
            usersBeingCreated.current.delete(user.id);
            if (user.email) emailsBeingRegistered.current.delete(user.email);
            if (user.phone) emailsBeingRegistered.current.delete(user.phone);
          }
          
          // Actualizar datos del usuario si es necesario
          const fullName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          'Usuario';
          
          await supabase
            .from('users')
            .update({
              email: user.email,
              phone: user.phone || user.user_metadata?.phone || null,
              name: fullName,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              is_active: true,
              email_verified: user.email_confirmed_at !== null,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id);
          
          // Actualizar estado
          setSession(session);
          setUser(session.user);
          setUserType('registered');

          // Determinar tipo de cuenta con reintentos
          console.log('[AuthContext] Determining account type for user:', user.id);
          refreshAccountType(user.id, 5).catch(() => {
            console.warn('[AuthContext] Failed to determine account type, defaulting to diner');
            setAccountType('diner');
          });
        } catch (dbError: any) {
          console.error('[AuthContext] Database error during auth state change:', dbError);
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setUserType('guest');
        } finally {
          setLoading(false);
        }
        return;
      } else {
        // Para otros eventos (SIGNED_OUT, etc.), actualizar el estado normalmente
        setSession(session);
        setUser(session?.user ?? null);
        setUserType(session?.user ? 'registered' : 'guest');
        refreshAccountType(session?.user?.id ?? null).catch(() => {
          setAccountType('diner');
        });
      }
      
      setLoading(false);
    });

    // Renovar sesión periódicamente
    const refreshInterval = setInterval(async () => {
      if (isSupabaseConfigured()) {
        try {
          const { data: { session: currentSession } } = await supabase.auth.getSession();
          if (currentSession) {
            const { error } = await supabase.auth.refreshSession();
            if (error) {
              console.warn('[AuthContext] Error refreshing session:', error);
            }
          }
        } catch (error) {
          console.warn('[AuthContext] Error in refresh interval:', error);
        }
      }
    }, 30 * 60 * 1000); // 30 minutos

    return () => {
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, []);

  const signUp = async ({ email, phone, password, name, restaurantName, rfc, restaurantAddress }: { 
    email?: string; 
    phone?: string; 
    password: string;
    name: string;
    restaurantName?: string;
    rfc?: string;
    restaurantAddress?: { address?: string; website?: string; postal_code?: string; country?: string; state?: string; city?: string };
  }): Promise<{ error: AuthError | null }> => {
    
    if (!isSupabaseConfigured()) {
      console.error('[AuthContext] Supabase not configured!');
      return { error: { name: 'AuthError', message: 'Supabase no está configurado' } as AuthError };
    }
    
    if (!email && !phone) {
      return { error: { name: 'AuthError', message: 'Debes proporcionar email o teléfono' } as AuthError };
    }

    try {
      // Marcar el email/phone como siendo registrado
      const identifier = email || phone;
      if (identifier) {
        emailsBeingRegistered.current.add(identifier);
      }

      // Preparar metadata del usuario
      const userData = {
        name: name,
        full_name: name,
        preferred_language: 'es',
        account_type: restaurantName ? 'owner' : 'customer'
      };

      const { data, error } = await supabase.auth.signUp({
        email: email || undefined,
        phone: phone || undefined,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/home`,
          data: userData
        }
      });

      if (error) {
        console.error('[AuthContext] signUp error:', error);
        if (identifier) {
          emailsBeingRegistered.current.delete(identifier);
        }
        return { error };
      }

      if (!data.user) {
        console.error('[AuthContext] signUp returned no user!');
        if (identifier) {
          emailsBeingRegistered.current.delete(identifier);
        }
        return { error: { name: 'AuthError', message: 'Error al crear el usuario' } as AuthError };
      }

      // Marcar que este usuario se está creando
      usersBeingCreated.current.add(data.user.id);

      // El trigger handle_new_user() se encargará de crear el registro en public.users
      // Si es restaurante, crear el restaurante después
      if (restaurantName && restaurantName.trim() !== '') {
        try {
          // Esperar un poco para que el trigger cree el usuario
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          console.log('[AuthContext] Creating restaurant for user:', data.user.id);
          await registerRestaurant(
            data.user.id,
            restaurantName.trim(),
            rfc?.trim() || undefined,
            restaurantAddress
          );
          
          console.log('[AuthContext] Restaurant created successfully, updating account type...');
          // Actualizar accountType inmediatamente después de crear el restaurante
          setAccountType('restaurant');
          
          // También refrescar desde la base de datos para confirmar
          setTimeout(() => {
            refreshAccountType(data.user.id);
          }, 2000);
          
        } catch (restaurantError: any) {
          console.error('[AuthContext] Error creating restaurant:', restaurantError);
          
          // Limpiar referencias
          if (identifier) {
            emailsBeingRegistered.current.delete(identifier);
          }
          usersBeingCreated.current.delete(data.user.id);
          
          // Cerrar sesión porque el registro no se completó
          await supabase.auth.signOut();
          
          return { 
            error: { 
              name: 'AuthError', 
              message: restaurantError?.message || 'Error al crear el restaurante. Por favor, intenta nuevamente.' 
            } as AuthError 
          };
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

    // Marcar que estamos autenticando
    isAuthenticating.current = true;
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        isAuthenticating.current = false;
        return { error };
      }

      // Verificar que el usuario existe en la tabla users
      if (data.user) {
        let existingUser = null;
        let retries = 5;
        
        while (retries >= 0) {
          const result = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();
          
          existingUser = result.data;
          
          if (existingUser) {
            break;
          }
          
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, 500));
            retries--;
          } else {
            break;
          }
        }
        
        if (!existingUser) {
          console.error('[AuthContext] User authenticated but not in users table:', data.user.id);
          isAuthenticating.current = false;
          await supabase.auth.signOut();
          return { 
            error: { 
              name: 'AuthError', 
              message: 'Esta cuenta no está registrada. Por favor, regístrate primero.',
              status: 404
            } as AuthError 
          };
        }
      }

      return { error: null };
    } catch (error) {
      isAuthenticating.current = false;
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

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async (): Promise<void> => {
    // Limpiar sesión de invitado
    localStorage.removeItem('guestSession');
    
    // Limpiar sesión de Supabase
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error signing out:', error);
      }
    }
    
    // Limpiar estado
    setUser(null);
    setSession(null);
    setUserType('guest');
    setAccountType('diner');
    setStaffRole(null);
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
        accountType,
        staffRole,
        userType,
        signUp,
        signIn,
        signInAsGuest,
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
    console.error('[AuthContext] useAuth called outside AuthProvider');
    return {
      user: null,
      session: null,
      loading: true,
      accountType: 'diner',
      staffRole: null,
      userType: 'registered',
      signUp: async () => ({ error: { name: 'AuthError', message: 'AuthProvider no está montado' } as AuthError }),
      signIn: async () => ({ error: { name: 'AuthError', message: 'AuthProvider no está montado' } as AuthError }),
      signInAsGuest: () => {},
      signInWithGoogle: async () => ({ error: { name: 'AuthError', message: 'AuthProvider no está montado' } as AuthError }),
      signOut: async () => {},
      resetPassword: async () => ({ error: { name: 'AuthError', message: 'AuthProvider no está montado' } as AuthError }),
      updatePassword: async () => ({ error: { name: 'AuthError', message: 'AuthProvider no está montado' } as AuthError }),
    };
  }
  return context;
};