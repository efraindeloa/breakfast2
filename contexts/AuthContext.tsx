import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { registerRestaurant } from '../services/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accountType: 'restaurant' | 'diner';
  signUp: (params: { 
    email?: string; 
    phone?: string; 
    password: string;
    restaurantName?: string;
    rfc?: string;
  }) => Promise<{ error: AuthError | null }>;
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
  const [accountType, setAccountType] = useState<'restaurant' | 'diner'>('diner');
  // Track users currently being created to avoid race conditions with onAuthStateChange
  const usersBeingCreated = React.useRef<Set<string>>(new Set());
  // Track emails being registered to mark them before signUp completes
  const emailsBeingRegistered = React.useRef<Set<string>>(new Set());
  // Track if we're in the middle of a sign-in/sign-up operation
  const isAuthenticating = React.useRef<boolean>(false);

  // Cargar sesión al iniciar
  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

    const refreshAccountType = async (userId?: string | null) => {
      if (!userId) {
        setAccountType('diner');
        return;
      }
      try {
        // Usar timeout para evitar que se quede bloqueado
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 3000)
        );
        
        const queryPromise = supabase
          .from('restaurant_staff')
          .select('id')
          .eq('user_id', userId)
          .eq('is_active', true)
          .limit(1)
          .maybeSingle();
        
        const { data: staffRow } = await Promise.race([queryPromise, timeoutPromise]) as any;
        setAccountType(staffRow ? 'restaurant' : 'diner');
      } catch {
        // Si hay error o timeout, usar 'diner' por defecto
        setAccountType('diner');
      }
    };

    // Timeout de seguridad: si después de 5 segundos no se ha resuelto, forzar loading = false
    // PERO solo si no estamos en medio de una operación de autenticación
    const safetyTimeout = setTimeout(() => {
      // Solo forzar loading = false si no estamos autenticando
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
      // Actualizar accountType de forma no bloqueante
      refreshAccountType(session?.user?.id ?? null).catch(() => {
        setAccountType('diner');
      });
      setLoading(false);
    }).catch((error) => {
      clearTimeout(safetyTimeout);
      // Si hay error obteniendo la sesión, continuar de todas formas
      console.warn('[AuthContext] Error getting initial session:', error);
      setLoading(false);
    });

    // Escuchar cambios en la autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      
      // Para INITIAL_SESSION o TOKEN_REFRESHED, no hacer verificaciones estrictas
      // Solo actualizar el estado y continuar - no bloquear por verificaciones
      if (session?.user && (event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED')) {
        // Para refresh/initial session, actualizar estado normalmente
        setSession(session);
        setUser(session.user);
        
        // Actualizar accountType de forma no bloqueante
        refreshAccountType(session.user.id).catch(() => {
          // Si falla, usar 'diner' por defecto
          setAccountType('diner');
        });
        
        // Marcar que ya no estamos autenticando
        isAuthenticating.current = false;
        setLoading(false);
        return;
      }
      
      // Si el usuario se autenticó exitosamente (SIGNED_IN), marcar que ya no estamos autenticando
      if (event === 'SIGNED_IN' && session?.user) {
        isAuthenticating.current = false;
      }
      
      // Si el usuario cerró sesión, también marcar que ya no estamos autenticando
      if (event === 'SIGNED_OUT') {
        isAuthenticating.current = false;
      }
      
      // Si el usuario se autenticó (SIGNED_IN), verificar que existe en la tabla users ANTES de actualizar el estado
      // NO crear usuarios automáticamente - deben pasar por el registro
      if (session?.user && event === 'SIGNED_IN') {
        try {
          const user = session.user;
          
          // Verificar si el usuario existe en la tabla users ANTES de establecer la sesión
          // Intentar varias veces por si hay problemas de timing o RLS (especialmente después del registro)
          // IMPORTANTE: onAuthStateChange puede dispararse ANTES de que signUp termine de crear el usuario en la BD
          let existingUser = null;
          let checkError = null;
          let retries = 10; // Aumentado significativamente para dar tiempo a que signUp termine
          
          while (retries >= 0) {
            // Verificar la sesión actual antes de hacer la consulta
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
            
            const result = await supabase
              .from('users')
              .select('id, email, name')
              .eq('id', user.id)
              .maybeSingle();
            
            existingUser = result.data;
            checkError = result.error;
            
            // Si encontramos el usuario, salir del loop
            if (existingUser) {
              break;
            }
            
            // Si no encontramos al usuario, puede ser un problema de timing (especialmente después del registro)
            // Esperar más tiempo y reintentar - onAuthStateChange puede dispararse antes de que signUp termine
            if (retries > 0) {
              // Esperar más tiempo en los primeros intentos (el usuario puede estar creándose)
              // Los primeros intentos esperan más porque es más probable que el usuario se esté creando
              const waitTime = retries > 7 ? 1500 : retries > 4 ? 1000 : 500;
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries--;
            } else {
              break;
            }
          }
          
          if (checkError && checkError.code !== 'PGRST116') {
            console.error('[AuthContext] Error checking user existence after retries:', {
              code: checkError.code,
              message: checkError.message,
              details: checkError.details,
              hint: checkError.hint
            });
            // Si hay error verificando, cerrar sesión por seguridad y NO actualizar el estado
            await supabase.auth.signOut();
            setSession(null);
            setUser(null);
            setLoading(false);
            return;
          }
          
          if (!existingUser) {
            // Verificar si el usuario se está creando actualmente (evitar race condition)
            const isBeingCreated = usersBeingCreated.current.has(user.id);
            // También verificar si el email/phone está siendo registrado
            const isEmailBeingRegistered = user.email ? emailsBeingRegistered.current.has(user.email) : false;
            const isPhoneBeingRegistered = user.phone ? emailsBeingRegistered.current.has(user.phone) : false;
            const isBeingRegistered = isBeingCreated || isEmailBeingRegistered || isPhoneBeingRegistered;
            
            if (isBeingRegistered) {
              // Esperar más tiempo para que signUp termine de crear el usuario
              // Intentar varias veces con esperas más largas
              let foundAfterWait = false;
              for (let waitAttempt = 0; waitAttempt < 5; waitAttempt++) {
                await new Promise(resolve => setTimeout(resolve, 2000)); // Esperar 2 segundos cada vez
                
                // Verificar si el usuario ya existe
                const { data: finalCheck, error: finalError } = await supabase
                  .from('users')
                  .select('id, email, name')
                  .eq('id', user.id)
                  .maybeSingle();
                
                if (finalCheck) {
                  existingUser = finalCheck;
                  foundAfterWait = true;
                  // Remover de la lista de usuarios siendo creados
                  usersBeingCreated.current.delete(user.id);
                  break;
                }
              }
              
              if (!foundAfterWait) {
                console.error(`[AuthContext] ✗ User still not found after waiting 10 seconds. User ID: ${user.id}`);
                console.error(`[AuthContext] This might indicate a problem with user creation in signUp`);
                console.warn(`[AuthContext] However, email is still being registered, so NOT signing out - will wait for signUp to complete`);
                // NO desloguear si el email todavía está siendo registrado
                // El signUp puede estar todavía en proceso
                // Remover de la lista de usuarios siendo creados pero mantener el email en el Set
                usersBeingCreated.current.delete(user.id);
                // NO remover del Set de emails siendo registrados todavía
                // Esto permitirá que onAuthStateChange sepa que debe esperar más
              } else {
                // Remover del Set de emails siendo registrados cuando se encuentra el usuario
                if (user.email) emailsBeingRegistered.current.delete(user.email);
                if (user.phone) emailsBeingRegistered.current.delete(user.phone);
              }
            }
            
            if (!existingUser) {
              // Verificar una vez más si el email todavía está siendo registrado
              const stillBeingRegistered = (user.email && emailsBeingRegistered.current.has(user.email)) || 
                                          (user.phone && emailsBeingRegistered.current.has(user.phone));
              
              if (stillBeingRegistered) {
                // NO desloguear - el signUp puede estar todavía en proceso
                // Simplemente no actualizar el estado y esperar
                setLoading(false);
                return;
              }
              
              // Si no existe y no se está creando, cerrar sesión y NO actualizar el estado
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setLoading(false);
              return;
            }
          } else {
            // Si encontramos al usuario, remover de la lista de usuarios siendo creados (por si acaso)
            usersBeingCreated.current.delete(user.id);
            // Remover del Set de emails siendo registrados
            if (user.email) emailsBeingRegistered.current.delete(user.email);
            if (user.phone) emailsBeingRegistered.current.delete(user.phone);
          }
          
          // Solo si el usuario existe, actualizar el estado y permitir el acceso
          // Actualizar los campos que pueden haber cambiado
          const fullName = user.user_metadata?.full_name || 
                          user.user_metadata?.name || 
                          user.email?.split('@')[0] || 
                          'Usuario';
          
          const { error: updateError } = await supabase
            .from('users')
            .update({
              email: user.email,
              phone: user.phone || user.user_metadata?.phone || null,
              name: fullName,
              avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
              is_active: true,
            })
            .eq('id', user.id);
          
          if (updateError) {
            console.warn('[AuthContext] Error updating user:', updateError);
          }
          
          // Ahora sí actualizar el estado - el usuario está verificado
          setSession(session);
          setUser(session.user);

          // Determinar tipo de cuenta (restaurant vs diner) por relación en restaurant_staff
          // No bloquear si falla
          refreshAccountType(user.id).catch(() => {
            setAccountType('diner');
          });
        } catch (dbError: any) {
          // Si hay error verificando, cerrar sesión por seguridad y NO actualizar el estado
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
        } finally {
          // Asegurar que loading siempre se desactive
          setLoading(false);
        }
        return;
      } else {
        // Para otros eventos (SIGNED_OUT, etc.), actualizar el estado normalmente
        setSession(session);
        setUser(session?.user ?? null);
        refreshAccountType(session?.user?.id ?? null).catch(() => {
          setAccountType('diner');
        });
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

  const signUp = async ({ email, phone, password, restaurantName, rfc }: { 
    email?: string; 
    phone?: string; 
    password: string;
    restaurantName?: string;
    rfc?: string;
  }): Promise<{ error: AuthError | null }> => {
    
    if (!isSupabaseConfigured()) {
      console.error('[AuthContext] Supabase not configured!');
      return { error: { name: 'AuthError', message: 'Supabase no está configurado' } as AuthError };
    }
    
    if (!email && !phone) {
      return { error: { name: 'AuthError', message: 'Debes proporcionar email o teléfono' } as AuthError };
    }

    // Verificar sesión actual antes de signUp
    const { data: { session: sessionBefore } } = await supabase.auth.getSession();

    try {
      // Marcar el email como siendo registrado ANTES de llamar a signUp
      // Esto permite que onAuthStateChange sepa que debe esperar más tiempo
      const identifier = email || phone;
      if (identifier) {
        emailsBeingRegistered.current.add(identifier);
      }
      const baseOptions = {
        emailRedirectTo: `${window.location.origin}/home`,
        data: {
          email_verified: true,
        },
        captchaToken: undefined,
      } as any;

      const { data, error } = await supabase.auth.signUp(
        email
          ? { email, password, options: baseOptions }
          : { phone: phone!, password, options: baseOptions }
      );


      if (error) {
        console.error('[AuthContext] signUp error details:', error);
        // Limpiar el email del Set si hay error
        if (identifier) {
          emailsBeingRegistered.current.delete(identifier);
        }
        return { error };
      }

      if (!data.user) {
        console.error('[AuthContext] signUp returned no user!');
        // Limpiar el email del Set si no hay usuario
        if (identifier) {
          emailsBeingRegistered.current.delete(identifier);
        }
        return { error: { name: 'AuthError', message: 'Error al crear el usuario' } as AuthError };
      }

      // Marcar que este usuario se está creando para evitar que onAuthStateChange lo rechace
      usersBeingCreated.current.add(data.user.id);

      // Si el usuario se registró correctamente, crear registro en la tabla users
      // Nota: En versiones recientes de Supabase, la confirmación de email puede estar
      // desactivada por defecto. El código ya incluye email_verified: true en los metadatos.
      if (data.user) {
        try {
          // Verificar sesión antes de consultar la BD
          const { data: { session: sessionBeforeCheck } } = await supabase.auth.getSession();
          
          // Verificar si el usuario ya existe antes de insertar
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('id', data.user.id)
            .maybeSingle();
          
          // Si hay error al verificar, intentar crear el usuario de todas formas
          if (checkError && checkError.code !== 'PGRST116') {
            console.warn('[AuthContext] Error checking user existence during registration, attempting to create:', checkError);
          }
          
          if (!existingUser) {
            // Crear el usuario en la tabla users - esto es REQUERIDO para el registro
            const userData = {
              id: data.user.id,
              email: data.user.email,
              phone: data.user.phone || phone,
              name: data.user.email?.split('@')[0] || 'Usuario',
              is_active: true,
            };
            
            // Verificar sesión antes de insertar
            const { data: { session: sessionBeforeInsert } } = await supabase.auth.getSession();
            
            const { data: insertData, error: insertError } = await supabase.from('users').insert(userData).select();
            
            if (insertError) {
              // Si es un error de duplicado, el usuario ya existe (race condition) - esto está bien
              if (insertError.code === '23505' || insertError.code === 'PGRST204') {
                // Usuario creado por otro proceso durante el registro
              } else {
                // Cualquier otro error es crítico - el usuario no se puede registrar sin estar en la BD
                console.error('[AuthContext] CRITICAL: Error creating user during registration:', insertError);
                // Limpiar el email del Set
                if (identifier) {
                  emailsBeingRegistered.current.delete(identifier);
                }
                if (data.user.id) {
                  usersBeingCreated.current.delete(data.user.id);
                }
                // Cerrar sesión porque el registro no se completó correctamente
                await supabase.auth.signOut();
                return { 
                  error: { 
                    message: 'Error al crear el perfil de usuario. Por favor, intenta nuevamente.',
                    status: 500
                  } as AuthError 
                };
              }
            } else {
              // Verificar que el usuario se creó correctamente antes de continuar
              // Esto asegura que el usuario existe antes de que onAuthStateChange se dispare
              
              // Verificar sesión antes de verificar
              const { data: { session: sessionBeforeVerify } } = await supabase.auth.getSession();
              
              let retries = 5;
              let userCreated = false;
              
              while (retries > 0 && !userCreated) {
                const { data: verifyUser, error: verifyError } = await supabase
                  .from('users')
                  .select('id, email, name')
                  .eq('id', data.user.id)
                  .maybeSingle();
                
                if (verifyUser && !verifyError) {
                  userCreated = true;
                } else {
                  retries--;
                  if (retries > 0) {
                    // Esperar un poco más antes de reintentar (aumentado para dar tiempo a la BD)
                    await new Promise(resolve => setTimeout(resolve, 500));
                  }
                }
              }
              
              if (!userCreated) {
                // Limpiar el email del Set
                if (identifier) {
                  emailsBeingRegistered.current.delete(identifier);
                }
                if (data.user.id) {
                  usersBeingCreated.current.delete(data.user.id);
                }
                await supabase.auth.signOut();
                return { 
                  error: { 
                    message: 'Error al verificar el registro. Por favor, intenta nuevamente.',
                    status: 500
                  } as AuthError 
                };
              }
              
              // Si se proporcionó restaurantName, crear el restaurante
              if (restaurantName && restaurantName.trim() !== '') {
                
                // Verificar y refrescar la sesión antes de crear el restaurante
                let sessionForRestaurant = data.session;
                if (!sessionForRestaurant) {
                  const { data: { session: currentSession } } = await supabase.auth.getSession();
                  sessionForRestaurant = currentSession;
                }
                
                if (!sessionForRestaurant) {
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  const { data: { session: retrySession } } = await supabase.auth.getSession();
                  sessionForRestaurant = retrySession;
                }
                
                if (!sessionForRestaurant) {
                  // Intentar refrescar la sesión
                  const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                  if (!refreshError && refreshData.session) {
                    sessionForRestaurant = refreshData.session;
                  }
                }
                
                if (sessionForRestaurant) {
                  try {
                    await registerRestaurant(
                      data.user.id,
                      restaurantName.trim(),
                      rfc?.trim() || undefined
                    );
                  } catch (restaurantError: any) {
                    // No fallar el registro completo si falla la creación del restaurante
                  }
                }
              }
              
              // Remover el usuario de la lista de usuarios siendo creados
              usersBeingCreated.current.delete(data.user.id);
              // Remover del Set de emails siendo registrados
              if (data.user.email) emailsBeingRegistered.current.delete(data.user.email);
              if (data.user.phone) emailsBeingRegistered.current.delete(data.user.phone);
            }
          }
          // Si ya existe, el usuario ya está registrado correctamente
          // Remover de la lista de usuarios siendo creados
          if (usersBeingCreated.current.has(data.user.id)) {
            usersBeingCreated.current.delete(data.user.id);
          }
          // Remover del Set de emails siendo registrados
          if (data.user.email) emailsBeingRegistered.current.delete(data.user.email);
          if (data.user.phone) emailsBeingRegistered.current.delete(data.user.phone);
        } catch (dbError: any) {
          // Error crítico - el registro no se completó
          console.error('[AuthContext] Error during user registration:', dbError);
          // Limpiar el email del Set
          if (identifier) {
            emailsBeingRegistered.current.delete(identifier);
          }
          if (data.user.id) {
            usersBeingCreated.current.delete(data.user.id);
          }
          // Cerrar sesión porque el registro no se completó correctamente
          await supabase.auth.signOut();
          return { 
            error: { 
              message: 'Error al completar el registro. Por favor, intenta nuevamente.',
              status: 500
            } as AuthError 
          };
        }

        // Verificar si hay una sesión después del registro
        // Intentar hacer signIn automático, pero verificar que autentique al usuario correcto
        // Verificar sesión después del registro
        if (!data.session && data.user) {
          // Cerrar cualquier sesión previa
          await supabase.auth.signOut();
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Intentar signIn automático
          // Auto sign-in solo aplica si hay email disponible (phone signup puede requerir OTP / no tener email)
          if (!data.user.email) {
            return { error: null };
          }
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: data.user.email,
            password,
          });
          
          if (signInError) {
            console.error('[AuthContext] ✗ Error during automatic signIn:', signInError);
            console.error('[AuthContext] Error details:', {
              message: signInError.message,
              status: signInError.status,
              name: signInError.name
            });
            
            // Si el error es "Email not confirmed", el usuario necesita confirmar su email
            // En este caso, permitimos que continúe (el usuario ya está creado en la BD)
            // y el usuario deberá confirmar su email antes de poder iniciar sesión
            if (signInError.message?.includes('Email not confirmed') || 
                signInError.message?.includes('email_not_confirmed') ||
                signInError.message?.includes('Email rate limit exceeded')) {
              // No retornar error - el usuario está creado, solo necesita confirmar email
              // El usuario deberá iniciar sesión manualmente después de confirmar
              // Retornar un error especial para que RegisterScreen lo maneje
              return {
                error: {
                  name: 'AuthError',
                  message: 'Por favor, confirma tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada.',
                  status: 403
                } as AuthError
              };
            }
          } else if (signInData.user) {
            // Verificar que el signIn autenticó al usuario correcto
            if (signInData.user.id !== data.user.id) {
              // Cerrar sesión del usuario incorrecto
              await supabase.auth.signOut();
              // Retornar error para que el usuario inicie sesión manualmente
              return {
                error: {
                  name: 'AuthError',
                  message: 'Este correo ya está registrado. Por favor, inicia sesión con tu contraseña.',
                  status: 409
                } as AuthError
              };
            }
          }
        } else if (data.session) {
          // Verificar que la sesión es del usuario correcto
          if (data.session.user.id !== data.user.id) {
            // Cerrar sesión si no coincide
            await supabase.auth.signOut();
          }
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

    // Marcar que estamos autenticando para evitar que el safetyTimeout interfiera
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

      // Usuario autenticado exitosamente - verificar que existe en la tabla users
      if (data.user) {
        // Verificar si el usuario existe en la tabla users
        // Intentar varias veces por si hay problemas de timing o RLS
        let existingUser = null;
        let checkError = null;
        let retries = 5; // Aumentado para dar más tiempo
        
        while (retries >= 0) {
          const result = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();
          
          existingUser = result.data;
          checkError = result.error;
          
          // Si encontramos el usuario, salir del loop
          if (existingUser) {
            break;
          }
          
          // Si es un error esperado (no encontrado), reintentar si hay oportunidades
          if (checkError && checkError.code === 'PGRST116') {
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 500));
              retries--;
            } else {
              console.warn(`[AuthContext] signIn - User not found after all retries (PGRST116)`);
              break;
            }
          } else if (checkError && checkError.code !== 'PGRST116' && retries > 0) {
            // Si hay un error diferente a "no encontrado", esperar un poco y reintentar
            console.warn(`[AuthContext] signIn - Error checking user (retry ${6 - retries}/5):`, {
              code: checkError.code,
              message: checkError.message,
              details: checkError.details,
              hint: checkError.hint
            });
            await new Promise(resolve => setTimeout(resolve, 500));
            retries--;
          } else {
            break;
          }
        }
        
        if (checkError && checkError.code !== 'PGRST116') {
          // Error al verificar - cerrar sesión por seguridad
          isAuthenticating.current = false;
          await supabase.auth.signOut();
          return { 
            error: { 
              name: 'AuthError', 
              message: 'Error al verificar la cuenta. Por favor, intenta nuevamente.',
              status: 500
            } as AuthError 
          };
        }
        
        if (!existingUser) {
          // Usuario no existe en la tabla users - cerrar sesión y mostrar error
          console.error(`[AuthContext] signIn - User authenticated but not registered in database. User ID: ${data.user.id}, Email: ${data.user.email}`);
          console.error(`[AuthContext] signIn - Final check - existingUser: ${existingUser}, checkError:`, checkError);
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

      // El onAuthStateChange se encargará de marcar isAuthenticating.current = false cuando se complete
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
        accountType,
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
    // En dev/HMR puede ocurrir un render intermedio sin provider. Evitar crashear toda la app.
    console.error('[AuthContext] useAuth called outside AuthProvider');
    return {
      user: null,
      session: null,
      loading: true,
      accountType: 'diner',
      signUp: async () => ({ error: { name: 'AuthError', message: 'AuthProvider no está montado' } as AuthError }),
      signIn: async () => ({ error: { name: 'AuthError', message: 'AuthProvider no está montado' } as AuthError }),
      signInWithGoogle: async () => ({ error: { name: 'AuthError', message: 'AuthProvider no está montado' } as AuthError }),
      signOut: async () => {},
      resetPassword: async () => ({ error: { name: 'AuthError', message: 'AuthProvider no está montado' } as AuthError }),
      updatePassword: async () => ({ error: { name: 'AuthError', message: 'AuthProvider no está montado' } as AuthError }),
    };
  }
  return context;
};
