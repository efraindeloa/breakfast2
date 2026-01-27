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
  // Track users currently being created to avoid race conditions with onAuthStateChange
  const usersBeingCreated = React.useRef<Set<string>>(new Set());

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
      console.log('========================================');
      console.log('[AuthContext] ===== onAuthStateChange TRIGGERED =====');
      console.log('[AuthContext] Event:', event);
      console.log('[AuthContext] Session:', {
        hasSession: !!session,
        userId: session?.user?.id || 'none',
        email: session?.user?.email || 'none',
        hasAccessToken: !!session?.access_token,
        tokenLength: session?.access_token?.length || 0
      });
      
      // Si el usuario se autenticó, verificar que existe en la tabla users ANTES de actualizar el estado
      // NO crear usuarios automáticamente - deben pasar por el registro
      if (session?.user && (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED')) {
        console.log('[AuthContext] ===== PROCESSING SIGNED_IN EVENT =====');
        try {
          const user = session.user;
          console.log(`[AuthContext] Processing user:`, {
            event,
            userId: user.id,
            email: user.email,
            phone: user.phone || 'none',
            emailConfirmed: user.email_confirmed_at ? 'yes' : 'no'
          });
          
          // Verificar si el usuario existe en la tabla users ANTES de establecer la sesión
          // Intentar varias veces por si hay problemas de timing o RLS (especialmente después del registro)
          // IMPORTANTE: onAuthStateChange puede dispararse ANTES de que signUp termine de crear el usuario en la BD
          console.log('[AuthContext] ===== CHECKING USER IN DATABASE =====');
          console.log('[AuthContext] NOTE: This may fire before signUp finishes creating user in database');
          let existingUser = null;
          let checkError = null;
          let retries = 10; // Aumentado significativamente para dar tiempo a que signUp termine
          
          while (retries >= 0) {
            console.log(`[AuthContext] ===== DATABASE CHECK ATTEMPT ${11 - retries}/11 =====`);
            console.log(`[AuthContext] Checking user existence in database...`);
            console.log(`[AuthContext] User to check:`, {
              userId: user.id,
              email: user.email
            });
            
            // Verificar la sesión actual antes de hacer la consulta
            const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
            console.log(`[AuthContext] Current session check:`, {
              hasSession: !!currentSession,
              sessionUserId: currentSession?.user?.id || 'none',
              sessionEmail: currentSession?.user?.email || 'none',
              hasAccessToken: !!currentSession?.access_token,
              tokenLength: currentSession?.access_token?.length || 0,
              tokenPrefix: currentSession?.access_token?.substring(0, 20) || 'none',
              sessionError: sessionError ? {
                message: sessionError.message
              } : 'none'
            });
            
            // Verificar el token de acceso para debugging
            if (currentSession?.access_token) {
              console.log(`[AuthContext] Access token details:`, {
                exists: true,
                length: currentSession.access_token.length,
                prefix: currentSession.access_token.substring(0, 30) + '...'
              });
            } else {
              console.log(`[AuthContext] ✗ No access token in session!`);
            }
            
            // Hacer la consulta con más información de debugging
            console.log(`[AuthContext] Executing database query: SELECT id FROM users WHERE id = '${user.id}'`);
            const startTime = Date.now();
            const result = await supabase
              .from('users')
              .select('id, email, name')
              .eq('id', user.id)
              .maybeSingle();
            const queryTime = Date.now() - startTime;
            
            // Log adicional para ver la respuesta completa
            console.log(`[AuthContext] Query response:`, {
              status: result.status,
              statusText: result.statusText,
              count: result.count,
              queryTime: `${queryTime}ms`,
              data: result.data ? {
                id: result.data.id,
                email: result.data.email,
                name: result.data.name
              } : 'null',
              error: result.error ? {
                code: result.error.code,
                message: result.error.message,
                details: result.error.details,
                hint: result.error.hint
              } : 'none'
            });
            
            existingUser = result.data;
            checkError = result.error;
            
            console.log(`[AuthContext] Query result summary:`, {
              userFound: !!existingUser,
              userId: existingUser?.id || 'none',
              email: existingUser?.email || 'none',
              hasError: !!checkError,
              errorCode: checkError?.code || 'none',
              errorMessage: checkError?.message || 'none'
            });
            
            // Si encontramos el usuario, salir del loop
            if (existingUser) {
              console.log(`[AuthContext] ✓ User found in database: ${existingUser.id}`);
              break;
            }
            
            // Si no encontramos al usuario, puede ser un problema de timing (especialmente después del registro)
            // Esperar más tiempo y reintentar - onAuthStateChange puede dispararse antes de que signUp termine
            if (retries > 0) {
              // Esperar más tiempo en los primeros intentos (el usuario puede estar creándose)
              // Los primeros intentos esperan más porque es más probable que el usuario se esté creando
              const waitTime = retries > 7 ? 1500 : retries > 4 ? 1000 : 500;
              console.log(`[AuthContext] User not found yet, waiting ${waitTime}ms before retry (${retries} retries remaining)...`);
              console.log(`[AuthContext] This might be a timing issue - user may still be creating in database`);
              console.log(`[AuthContext] onAuthStateChange may have fired before signUp finished creating user`);
              await new Promise(resolve => setTimeout(resolve, waitTime));
              retries--;
            } else {
              console.warn(`[AuthContext] User not found after all retries`);
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
            console.log(`[AuthContext] User not found in database. Is being created: ${isBeingCreated}`);
            
            if (isBeingCreated) {
              console.log(`[AuthContext] User is currently being created, waiting 3 seconds before final check...`);
              // Esperar más tiempo para que signUp termine de crear el usuario
              await new Promise(resolve => setTimeout(resolve, 3000));
              
              // Verificar una vez más después de esperar
              const { data: finalCheck, error: finalError } = await supabase
                .from('users')
                .select('id, email, name')
                .eq('id', user.id)
                .maybeSingle();
              
              console.log(`[AuthContext] Final check after waiting:`, {
                found: !!finalCheck,
                userId: finalCheck?.id || 'none',
                error: finalError ? {
                  code: finalError.code,
                  message: finalError.message
                } : 'none'
              });
              
              if (finalCheck) {
                console.log(`[AuthContext] ✓ User found after waiting! User ID: ${finalCheck.id}`);
                existingUser = finalCheck;
                // Remover de la lista de usuarios siendo creados
                usersBeingCreated.current.delete(user.id);
              } else {
                console.error(`[AuthContext] ✗ User still not found after waiting. User ID: ${user.id}`);
                // Remover de la lista de usuarios siendo creados
                usersBeingCreated.current.delete(user.id);
              }
            }
            
            if (!existingUser) {
              // Si no existe y no se está creando, cerrar sesión y NO actualizar el estado
              console.error(`[AuthContext] User authenticated but not registered in database. Signing out. User ID: ${user.id}, Email: ${user.email}`);
              console.error(`[AuthContext] Final check - existingUser: ${existingUser}, checkError:`, checkError);
              await supabase.auth.signOut();
              setSession(null);
              setUser(null);
              setLoading(false);
              return;
            }
          } else {
            // Si encontramos al usuario, remover de la lista de usuarios siendo creados (por si acaso)
            usersBeingCreated.current.delete(user.id);
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
        } catch (dbError: any) {
          console.warn('[AuthContext] Error checking user registration:', dbError);
          // Si hay error verificando, cerrar sesión por seguridad y NO actualizar el estado
          await supabase.auth.signOut();
          setSession(null);
          setUser(null);
          setLoading(false);
          return;
        }
      } else {
        // Para otros eventos (SIGNED_OUT, etc.), actualizar el estado normalmente
        setSession(session);
        setUser(session?.user ?? null);
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
    console.log('========================================');
    console.log('[AuthContext] ===== SIGNUP START =====');
    console.log('[AuthContext] signUp called with email:', email, 'phone:', phone || 'none');
    console.log('[AuthContext] Supabase configured:', isSupabaseConfigured());
    
    if (!isSupabaseConfigured()) {
      console.error('[AuthContext] Supabase not configured!');
      return { error: { name: 'AuthError', message: 'Supabase no está configurado' } as AuthError };
    }

    // Verificar sesión actual antes de signUp
    const { data: { session: sessionBefore } } = await supabase.auth.getSession();
    console.log('[AuthContext] Session before signUp:', {
      hasSession: !!sessionBefore,
      userId: sessionBefore?.user?.id || 'none',
      email: sessionBefore?.user?.email || 'none'
    });

    try {
      console.log('[AuthContext] Calling supabase.auth.signUp...');
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

      console.log('[AuthContext] signUp response received');
      console.log('[AuthContext] signUp error:', error ? {
        name: error.name,
        message: error.message,
        status: error.status
      } : 'none');
      console.log('[AuthContext] signUp data:', {
        hasUser: !!data.user,
        userId: data.user?.id || 'none',
        userEmail: data.user?.email || 'none',
        hasSession: !!data.session,
        sessionUserId: data.session?.user?.id || 'none'
      });

      if (error) {
        console.error('[AuthContext] signUp error details:', error);
        return { error };
      }

      if (!data.user) {
        console.error('[AuthContext] signUp returned no user!');
        return { error: { name: 'AuthError', message: 'Error al crear el usuario' } as AuthError };
      }

      console.log('[AuthContext] ===== SIGNUP AUTH SUCCESS =====');
      console.log('[AuthContext] New user created in Supabase Auth:', {
        userId: data.user.id,
        email: data.user.email,
        phone: data.user.phone || 'none',
        emailConfirmed: data.user.email_confirmed_at ? 'yes' : 'no',
        hasSession: !!data.session
      });

      // Marcar que este usuario se está creando para evitar que onAuthStateChange lo rechace
      usersBeingCreated.current.add(data.user.id);
      console.log('[AuthContext] Marked user as being created:', data.user.id);

      // Si el usuario se registró correctamente, crear registro en la tabla users
      // Nota: En versiones recientes de Supabase, la confirmación de email puede estar
      // desactivada por defecto. El código ya incluye email_verified: true en los metadatos.
      if (data.user) {
        console.log('[AuthContext] ===== CREATING USER IN DATABASE =====');
        console.log('[AuthContext] User ID to create:', data.user.id);
        
        try {
          // Verificar sesión antes de consultar la BD
          const { data: { session: sessionBeforeCheck } } = await supabase.auth.getSession();
          console.log('[AuthContext] Session before database check:', {
            hasSession: !!sessionBeforeCheck,
            userId: sessionBeforeCheck?.user?.id || 'none'
          });
          
          // Verificar si el usuario ya existe antes de insertar
          console.log('[AuthContext] Checking if user exists in database...');
          const { data: existingUser, error: checkError } = await supabase
            .from('users')
            .select('id, email, name')
            .eq('id', data.user.id)
            .maybeSingle();
          
          console.log('[AuthContext] Database check result:', {
            found: !!existingUser,
            userId: existingUser?.id || 'none',
            email: existingUser?.email || 'none',
            error: checkError ? {
              code: checkError.code,
              message: checkError.message,
              details: checkError.details,
              hint: checkError.hint
            } : 'none'
          });
          
          // Si hay error al verificar, intentar crear el usuario de todas formas
          if (checkError && checkError.code !== 'PGRST116') {
            console.warn('[AuthContext] Error checking user existence during registration, attempting to create:', checkError);
          }
          
          if (!existingUser) {
            // Crear el usuario en la tabla users - esto es REQUERIDO para el registro
            console.log('[AuthContext] User does not exist in database, creating...');
            const userData = {
              id: data.user.id,
              email: data.user.email,
              phone: data.user.phone || phone,
              name: data.user.email?.split('@')[0] || 'Usuario',
              is_active: true,
            };
            console.log('[AuthContext] User data to insert:', userData);
            
            // Verificar sesión antes de insertar
            const { data: { session: sessionBeforeInsert } } = await supabase.auth.getSession();
            console.log('[AuthContext] Session before insert:', {
              hasSession: !!sessionBeforeInsert,
              userId: sessionBeforeInsert?.user?.id || 'none',
              accessToken: sessionBeforeInsert?.access_token ? 'exists' : 'none'
            });
            
            const { data: insertData, error: insertError } = await supabase.from('users').insert(userData).select();
            
            console.log('[AuthContext] Insert result:', {
              success: !insertError,
              insertedData: insertData || 'none',
              error: insertError ? {
                code: insertError.code,
                message: insertError.message,
                details: insertError.details,
                hint: insertError.hint
              } : 'none'
            });
            
            if (insertError) {
              // Si es un error de duplicado, el usuario ya existe (race condition) - esto está bien
              if (insertError.code === '23505' || insertError.code === 'PGRST204') {
                console.log('[AuthContext] User was created by another process during registration (duplicate key)');
              } else {
                // Cualquier otro error es crítico - el usuario no se puede registrar sin estar en la BD
                console.error('[AuthContext] CRITICAL: Error creating user during registration:', insertError);
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
              console.log('[AuthContext] User successfully inserted into database!');
              // Verificar que el usuario se creó correctamente antes de continuar
              // Esto asegura que el usuario existe antes de que onAuthStateChange se dispare
              console.log('[AuthContext] ===== VERIFYING USER CREATION =====');
              console.log(`[AuthContext] Verifying user creation in database. User ID: ${data.user.id}`);
              
              // Verificar sesión antes de verificar
              const { data: { session: sessionBeforeVerify } } = await supabase.auth.getSession();
              console.log('[AuthContext] Session before verification:', {
                hasSession: !!sessionBeforeVerify,
                userId: sessionBeforeVerify?.user?.id || 'none',
                email: sessionBeforeVerify?.user?.email || 'none'
              });
              
              let retries = 5;
              let userCreated = false;
              
              while (retries > 0 && !userCreated) {
                console.log(`[AuthContext] Verification attempt ${6 - retries}/5...`);
                
                const { data: verifyUser, error: verifyError, status, statusText } = await supabase
                  .from('users')
                  .select('id, email, name')
                  .eq('id', data.user.id)
                  .maybeSingle();
                
                console.log(`[AuthContext] Verification query result:`, {
                  status,
                  statusText,
                  found: !!verifyUser,
                  userId: verifyUser?.id || 'none',
                  email: verifyUser?.email || 'none',
                  error: verifyError ? {
                    code: verifyError.code,
                    message: verifyError.message,
                    details: verifyError.details,
                    hint: verifyError.hint
                  } : 'none'
                });
                
                if (verifyUser && !verifyError) {
                  userCreated = true;
                  console.log(`[AuthContext] ✓ User verified in database after registration. User ID: ${verifyUser.id}`);
                } else {
                  retries--;
                  if (retries > 0) {
                    // Esperar un poco más antes de reintentar (aumentado para dar tiempo a la BD)
                    console.log(`[AuthContext] User not found yet, waiting 500ms before retry (${retries} retries remaining)...`);
                    await new Promise(resolve => setTimeout(resolve, 500));
                  } else {
                    console.error(`[AuthContext] ✗ User verification failed after all retries. User ID: ${data.user.id}`);
                  }
                }
              }
              
              if (!userCreated) {
                console.error('[AuthContext] ✗ CRITICAL: User was not found in database after creation. User ID:', data.user.id);
                await supabase.auth.signOut();
                return { 
                  error: { 
                    message: 'Error al verificar el registro. Por favor, intenta nuevamente.',
                    status: 500
                  } as AuthError 
                };
              }
              
              console.log('[AuthContext] ===== USER VERIFICATION SUCCESS =====');
              
              // Remover el usuario de la lista de usuarios siendo creados
              usersBeingCreated.current.delete(data.user.id);
              console.log('[AuthContext] Removed user from being created list:', data.user.id);
            }
          }
          // Si ya existe, el usuario ya está registrado correctamente
          // Remover de la lista de usuarios siendo creados
          if (usersBeingCreated.current.has(data.user.id)) {
            usersBeingCreated.current.delete(data.user.id);
            console.log('[AuthContext] Removed user from being created list (already existed):', data.user.id);
          }
        } catch (dbError: any) {
          // Error crítico - el registro no se completó
          console.error('[AuthContext] Error during user registration:', dbError);
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
        console.log('[AuthContext] ===== CHECKING SESSION AFTER SIGNUP =====');
        console.log('[AuthContext] Session check:', {
          hasSession: !!data.session,
          sessionUserId: data.session?.user?.id || 'none',
          sessionEmail: data.session?.user?.email || 'none',
          signUpUserId: data.user.id,
          signUpEmail: data.user.email
        });
        
        if (!data.session && data.user) {
          console.log('[AuthContext] ===== NO SESSION, ATTEMPTING AUTO SIGNIN =====');
          console.log('[AuthContext] Will attempt signIn and verify it authenticates the correct user');
          
          // Cerrar cualquier sesión previa
          await supabase.auth.signOut();
          await new Promise(resolve => setTimeout(resolve, 200));
          
          // Intentar signIn automático
          console.log('[AuthContext] Attempting signIn with email:', data.user.email);
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
              console.log('[AuthContext] Email confirmation required - user must confirm email before signing in');
              console.log('[AuthContext] User created successfully, but email confirmation is required');
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
            } else {
              // Para otros errores, el usuario deberá iniciar sesión manualmente
              console.log('[AuthContext] Other error - user must sign in manually');
              // No retornar error aquí - permitir que el registro se complete
              // El usuario puede intentar iniciar sesión manualmente después
            }
          } else if (signInData.user) {
            console.log('[AuthContext] SignIn successful, verifying user ID...');
            console.log('[AuthContext] SignIn user ID:', signInData.user.id);
            console.log('[AuthContext] Expected user ID:', data.user.id);
            
            // Verificar que el signIn autenticó al usuario correcto
            if (signInData.user.id === data.user.id) {
              console.log('[AuthContext] ✓ SignIn authenticated the correct user!');
              // La sesión se establecerá automáticamente a través de onAuthStateChange
            } else {
              console.error('[AuthContext] ✗ CRITICAL: signIn authenticated wrong user!');
              console.error('[AuthContext] Expected:', data.user.id);
              console.error('[AuthContext] Got:', signInData.user.id);
              console.error('[AuthContext] This means the email already exists in Supabase Auth');
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
          console.log('[AuthContext] ===== SESSION ALREADY ESTABLISHED =====');
          console.log('[AuthContext] Session details:', {
            userId: data.session.user.id,
            email: data.session.user.email
          });
          
          // Verificar que la sesión es del usuario correcto
          if (data.session.user.id !== data.user.id) {
            console.error('[AuthContext] ✗ CRITICAL: Session user ID does not match signUp user ID!');
            console.error('[AuthContext] SignUp user ID:', data.user.id);
            console.error('[AuthContext] Session user ID:', data.session.user.id);
            // Cerrar sesión si no coincide
            await supabase.auth.signOut();
          } else {
            console.log('[AuthContext] ✓ Session user ID matches signUp user ID!');
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Usuario autenticado exitosamente - verificar que existe en la tabla users
      if (data.user) {
        console.log(`[AuthContext] signIn - User authenticated: ${data.user.email}, ID: ${data.user.id}`);
        
        // Verificar si el usuario existe en la tabla users
        // Intentar varias veces por si hay problemas de timing o RLS
        let existingUser = null;
        let checkError = null;
        let retries = 5; // Aumentado para dar más tiempo
        
        while (retries >= 0) {
          console.log(`[AuthContext] signIn - Checking user existence (attempt ${6 - retries}/6)...`);
          const result = await supabase
            .from('users')
            .select('id')
            .eq('id', data.user.id)
            .maybeSingle();
          
          existingUser = result.data;
          checkError = result.error;
          
          console.log(`[AuthContext] signIn - Query result - User found: ${!!existingUser}, Error:`, checkError ? {
            code: checkError.code,
            message: checkError.message,
            details: checkError.details,
            hint: checkError.hint
          } : 'none');
          
          // Si encontramos el usuario, salir del loop
          if (existingUser) {
            console.log(`[AuthContext] signIn - User found in database: ${existingUser.id}`);
            break;
          }
          
          // Si es un error esperado (no encontrado), reintentar si hay oportunidades
          if (checkError && checkError.code === 'PGRST116') {
            if (retries > 0) {
              console.log(`[AuthContext] signIn - User not found yet (PGRST116), retrying (${6 - retries}/5 remaining)...`);
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
          console.error('[AuthContext] signIn - Error checking user registration after retries:', {
            code: checkError.code,
            message: checkError.message,
            details: checkError.details,
            hint: checkError.hint
          });
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
