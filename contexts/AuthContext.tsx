import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../config/supabase';
import { registerRestaurant } from '../services/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  accountType: 'restaurant' | 'diner';
  userType: 'registered' | 'guest';
  signUp: (params: { 
    email?: string; 
    phone?: string; 
    password: string;
    restaurantName?: string;
    rfc?: string;
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
  const [userType, setUserType] = useState<'registered' | 'guest'>('registered');
  // Track users currently being created to avoid race conditions with onAuthStateChange
  const usersBeingCreated = React.useRef<Set<string>>(new Set());
  // Track emails being registered to mark them before signUp completes
  const emailsBeingRegistered = React.useRef<Set<string>>(new Set());
  // Track if we're in the middle of a sign-in/sign-up operation
  const isAuthenticating = React.useRef<boolean>(false);

  // Función para refrescar accountType (compartida)
  const refreshAccountType = async (userId?: string | null) => {
    if (!userId) {
      setAccountType('diner');
      return;
    }
    try {
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
      setAccountType('diner');
    }
  };

  // Función para verificar accountType en autenticación simple (sin sesión Supabase Auth)
  const checkSimpleAccountType = async (userId: string) => {
    try {
      console.log('[AuthContext] Verificando accountType para usuario:', userId);
      
      // Query directa sin depender de RLS/Auth
      const { data: staffRow, error } = await supabase
        .from('restaurant_staff')
        .select('id, role')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      
      console.log('[AuthContext] Resultado staff query:', { staffRow, error });
      
      if (error) {
        console.error('[AuthContext] Error en query staff:', error);
        setAccountType('diner');
        return;
      }
      
      const newAccountType = staffRow ? 'restaurant' : 'diner';
      console.log('[AuthContext] AccountType determinado:', newAccountType);
      setAccountType(newAccountType);
    } catch (err) {
      console.error('[AuthContext] Error verificando accountType:', err);
      setAccountType('diner');
    }
  };

  // Función para cargar sesión simple
  const loadSimpleAuthSession = () => {
    const simpleAuthUser = localStorage.getItem('simpleAuthUser');
    const guestSession = localStorage.getItem('guestSession');
    
    if (simpleAuthUser) {
      try {
        const userData = JSON.parse(simpleAuthUser);
        // Crear un objeto User compatible con Supabase
        const simpleUser = {
          id: userData.id,
          email: userData.email,
          phone: userData.phone || null,
          user_metadata: {
            full_name: userData.name,
            name: userData.name
          }
        } as unknown as User;
        setUser(simpleUser);
        setSession({
          user: simpleUser,
          access_token: 'simple-auth-token',
          refresh_token: 'simple-auth-refresh',
          expires_in: 3600,
          expires_at: Math.floor(Date.now() / 1000) + 3600,
          token_type: 'bearer'
        } as Session);
        setUserType('registered');
        setLoading(false);
        console.log('[AuthContext] Sesión simple cargada:', userData);
        // Actualizar accountType usando query directa (sin depender de sesión Supabase Auth)
        checkSimpleAccountType(userData.id).catch(() => setAccountType('diner'));
        return true;
      } catch (error) {
        console.error('[AuthContext] Error al cargar sesión simple:', error);
        localStorage.removeItem('simpleAuthUser');
        return false;
      }
    } else if (guestSession) {
      try {
        const guestData = JSON.parse(guestSession);
        // Crear un usuario invitado temporal
        const guestUser = {
          id: guestData.id,
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
        setLoading(false);
        console.log('[AuthContext] Sesión de invitado cargada:', guestData);
        return true;
      } catch (error) {
        console.error('[AuthContext] Error al cargar sesión de invitado:', error);
        localStorage.removeItem('guestSession');
        return false;
      }
    }
    return false;
  };

  // Función para iniciar sesión como invitado
  const signInAsGuest = () => {
    const guestId = crypto.randomUUID();
    const guestData = {
      id: guestId,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('guestSession', JSON.stringify(guestData));
    loadSimpleAuthSession();
    console.log('[AuthContext] Sesión de invitado iniciada:', guestId);
  };

  // Cargar sesión simple al iniciar (si existe)
  useEffect(() => {
    loadSimpleAuthSession();
    
    // Escuchar eventos de login simple
    const handleSimpleAuthLogin = () => {
      loadSimpleAuthSession();
    };
    
    window.addEventListener('simpleAuthLogin', handleSimpleAuthLogin);
    
    return () => {
      window.removeEventListener('simpleAuthLogin', handleSimpleAuthLogin);
    };
  }, []);

  // Cargar sesión al iniciar
  useEffect(() => {
    // Si ya hay sesión simple o de invitado, no cargar Supabase Auth
    if (localStorage.getItem('simpleAuthUser') || localStorage.getItem('guestSession')) {
      return;
    }
    
    if (!isSupabaseConfigured()) {
      setLoading(false);
      return;
    }

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

  const signUp = async ({ email, phone, password, restaurantName, rfc, username }: { 
    email?: string; 
    phone?: string; 
    password: string;
    restaurantName?: string;
    rfc?: string;
    username?: string; // Username original (puede tener espacios)
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
            // Si se proporcionó restaurantName, crear el restaurante PRIMERO (antes de crear usuario en tabla users)
            // Esto hace el proceso más atómico: si falla el restaurante, el usuario nunca se crea en la BD
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
              
              if (!sessionForRestaurant) {
                // Si no hay sesión, no se puede crear el restaurante - revertir todo
                console.error('[AuthContext] No se pudo obtener sesión para crear restaurante, revirtiendo registro');
                // Limpiar el email del Set
                if (identifier) {
                  emailsBeingRegistered.current.delete(identifier);
                }
                if (data.user.id) {
                  usersBeingCreated.current.delete(data.user.id);
                }
                // Cerrar sesión (el usuario aún no está en la tabla users, solo en auth)
                await supabase.auth.signOut();
                return { 
                  error: { 
                    name: 'AuthError', 
                    message: 'Error al crear el restaurante. Por favor, intenta nuevamente.' 
                  } as AuthError 
                };
              }
              
              try {
                await registerRestaurant(
                  data.user.id,
                  restaurantName.trim(),
                  rfc?.trim() || undefined
                );
              } catch (restaurantError: any) {
                // Si falla la creación del restaurante, revertir todo el registro
                console.error('[AuthContext] Error al crear restaurante, revirtiendo registro:', restaurantError);
                
                // Limpiar el email del Set
                if (identifier) {
                  emailsBeingRegistered.current.delete(identifier);
                }
                if (data.user.id) {
                  usersBeingCreated.current.delete(data.user.id);
                }
                
                // Cerrar sesión (el usuario aún no está en la tabla users, solo en auth)
                await supabase.auth.signOut();
                
                return { 
                  error: { 
                    name: 'AuthError', 
                    message: restaurantError?.message || 'Error al crear el restaurante. Por favor, intenta nuevamente.' 
                  } as AuthError 
                };
              }
            }
            
            // Crear el usuario en la tabla users - esto es REQUERIDO para el registro
            // Ahora se hace DESPUÉS de crear el restaurante (si se proporcionó) para hacer el proceso atómico
            // Si se proporcionó username, usarlo; si no, usar el email sin dominio
            const userName = username || data.user.email?.split('@')[0] || 'Usuario';
            const userData = {
              id: data.user.id,
              email: data.user.email,
              phone: data.user.phone || phone,
              name: userName,
              is_active: true,
            };
            
            // Verificar sesión antes de insertar
            let sessionBeforeInsert = data.session;
            if (!sessionBeforeInsert) {
              const { data: { session: currentSession } } = await supabase.auth.getSession();
              sessionBeforeInsert = currentSession;
            }
            
            // Si aún no hay sesión, esperar un poco más
            if (!sessionBeforeInsert) {
              console.warn('[AuthContext] No hay sesión después de signup, esperando...');
              await new Promise(resolve => setTimeout(resolve, 1000));
              const { data: { session: retrySession } } = await supabase.auth.getSession();
              sessionBeforeInsert = retrySession;
            }
            
            console.log('[AuthContext] Sesión antes de insertar usuario:', sessionBeforeInsert ? `Disponible (user: ${sessionBeforeInsert.user.id})` : 'NO disponible');
            console.log('[AuthContext] Intentando insertar usuario:', { id: userData.id, email: userData.email, name: userData.name });
            
            const { data: insertData, error: insertError } = await supabase.from('users').insert(userData).select();
            
            console.log('[AuthContext] Resultado de inserción:', { 
              success: !insertError, 
              error: insertError ? { code: insertError.code, message: insertError.message } : null,
              data: insertData 
            });
            
            if (insertError) {
              // Si es un error de duplicado, el usuario ya existe (race condition) - esto está bien
              if (insertError.code === '23505' || insertError.code === 'PGRST204') {
                // Usuario creado por otro proceso durante el registro
              } else {
                // Cualquier otro error es crítico - el usuario no se puede registrar sin estar en la BD
                console.error('[AuthContext] CRITICAL: Error creating user during registration:', insertError);
                
                // Si se creó el restaurante pero falló crear el usuario, eliminar el restaurante
                if (restaurantName && restaurantName.trim() !== '') {
                  try {
                    // Obtener el restaurante creado para eliminarlo
                    const { data: staffData } = await supabase
                      .from('restaurant_staff')
                      .select('restaurant_id')
                      .eq('user_id', data.user.id)
                      .eq('is_active', true)
                      .maybeSingle();
                    
                    if (staffData?.restaurant_id) {
                      // Eliminar el restaurante y su staff
                      await supabase.from('restaurant_staff').delete().eq('restaurant_id', staffData.restaurant_id);
                      await supabase.from('restaurants').delete().eq('id', staffData.restaurant_id);
                    }
                  } catch (cleanupError) {
                    console.error('[AuthContext] Error al limpiar restaurante después de fallo en creación de usuario:', cleanupError);
                  }
                }
                
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
                // Si se creó el restaurante pero falló verificar el usuario, eliminar el restaurante
                if (restaurantName && restaurantName.trim() !== '') {
                  try {
                    const { data: staffData } = await supabase
                      .from('restaurant_staff')
                      .select('restaurant_id')
                      .eq('user_id', data.user.id)
                      .eq('is_active', true)
                      .maybeSingle();
                    
                    if (staffData?.restaurant_id) {
                      await supabase.from('restaurant_staff').delete().eq('restaurant_id', staffData.restaurant_id);
                      await supabase.from('restaurants').delete().eq('id', staffData.restaurant_id);
                    }
                  } catch (cleanupError) {
                    console.error('[AuthContext] Error al limpiar restaurante después de fallo en verificación:', cleanupError);
                  }
                }
                
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
        // Si no hay sesión, esperar un momento y verificar de nuevo (el signup puede crear la sesión asíncronamente)
        console.log('[AuthContext] Verificando sesión después del registro...');
        console.log('[AuthContext] Sesión del signup:', data.session ? 'Disponible' : 'No disponible');
        
        // Esperar un momento para que Supabase procese el signup
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar sesión de nuevo después de esperar
        const { data: { session: finalSession } } = await supabase.auth.getSession();
        console.log('[AuthContext] Sesión después de esperar:', finalSession ? 'Disponible' : 'No disponible');
        
        if (!finalSession && data.user) {
          // Si aún no hay sesión, intentar signIn automático
          // Auto sign-in solo aplica si hay email disponible (phone signup puede requerir OTP / no tener email)
          if (!data.user.email) {
            console.log('[AuthContext] No hay email, no se puede hacer signIn automático');
            return { error: null };
          }
          
          console.log('[AuthContext] Intentando signIn automático con:', data.user.email);
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
            
            // Si el error es "Email not confirmed" o "Invalid credentials", el usuario necesita confirmar su email
            // En este caso, permitimos que continúe (el usuario ya está creado en la BD)
            if (signInError.message?.includes('Email not confirmed') || 
                signInError.message?.includes('email_not_confirmed') ||
                signInError.message?.includes('Email rate limit exceeded') ||
                signInError.message?.includes('Invalid login credentials') ||
                signInError.message?.includes('invalid_credentials')) {
              // No retornar error - el usuario está creado, solo necesita confirmar email o esperar
              // El usuario deberá iniciar sesión manualmente después de confirmar
              console.warn('[AuthContext] SignIn falló pero el usuario está creado. Debe confirmar email o esperar.');
              return { error: null }; // Retornar éxito - el usuario está creado
            }
          } else if (signInData.user) {
            console.log('[AuthContext] ✓ SignIn automático exitoso');
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
        } else if (finalSession) {
          console.log('[AuthContext] ✓ Sesión disponible después del registro');
          // Verificar que la sesión es del usuario correcto
          if (finalSession.user.id !== data.user.id) {
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
    // Limpiar sesión simple
    localStorage.removeItem('simpleAuthUser');
    
    // Limpiar sesión de Supabase si está configurado
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
    setAccountType('diner');
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
    // En dev/HMR puede ocurrir un render intermedio sin provider. Evitar crashear toda la app.
    console.error('[AuthContext] useAuth called outside AuthProvider');
    return {
      user: null,
      session: null,
      loading: true,
      accountType: 'diner',
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
