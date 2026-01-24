import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../config/supabase';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, phone?: string) => Promise<{ error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
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
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
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
        },
      });

      if (error) {
        return { error };
      }

      // Si el usuario se registró correctamente, crear registro en la tabla users
      if (data.user) {
        try {
          await supabase.from('users').upsert({
            id: data.user.id,
            email: data.user.email,
            phone: data.user.phone || phone,
            name: data.user.email?.split('@')[0] || 'Usuario',
            is_active: true,
          }, { onConflict: 'id' });
        } catch (dbError) {
          console.warn('Error creating user in database:', dbError);
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

      // Si el login fue exitoso, migrar datos pendientes del localStorage al usuario autenticado
      if (data.user) {
        try {
          const pendingCart = localStorage.getItem('pending_cart_migration');
          const pendingOrders = localStorage.getItem('pending_orders_migration');
          
          if (pendingCart) {
            const cartItems = JSON.parse(pendingCart);
            // Migrar carrito al usuario autenticado
            for (const item of cartItems) {
              await supabase.from('cart_items').upsert({
                user_id: data.user.id,
                product_id: item.product_id,
                restaurant_id: item.restaurant_id,
                quantity: item.quantity,
                notes: item.notes,
              }, { onConflict: 'user_id,product_id,notes' });
            }
            localStorage.removeItem('pending_cart_migration');
          }
          
          if (pendingOrders) {
            const orders = JSON.parse(pendingOrders);
            // Migrar órdenes al usuario autenticado
            for (const order of orders) {
              await supabase.from('orders').upsert({
                id: order.id,
                user_id: data.user.id,
                restaurant_id: order.restaurant_id,
                order_number: order.order_number,
                status: order.status,
                total: order.total,
                subtotal: order.subtotal,
                tax: order.tax,
                tip: order.tip,
                items: order.items,
                notes: order.notes,
                payment_method: order.payment_method,
                payment_status: order.payment_status,
                table_number: order.table_number,
                delivery_address: order.delivery_address,
                estimated_ready_time: order.estimated_ready_time,
                created_at: order.created_at,
                updated_at: order.updated_at,
              }, { onConflict: 'id' });
            }
            localStorage.removeItem('pending_orders_migration');
          }
        } catch (migrationError) {
          console.warn('Error migrating data after login:', migrationError);
          // No fallar el login si la migración falla
        }
      }

      return { error: null };
    } catch (error) {
      return { error: error as AuthError };
    }
  };

  const signOut = async (): Promise<void> => {
    if (!isSupabaseConfigured()) return;

    try {
      // Antes de cerrar sesión, guardar el carrito y órdenes activas del usuario autenticado
      const currentUserId = user?.id;
      if (currentUserId && isSupabaseConfigured()) {
        try {
          // Obtener carrito del usuario autenticado
          const { data: cartItems } = await supabase
            .from('cart_items')
            .select('*')
            .eq('user_id', currentUserId);
          
          // Obtener órdenes activas del usuario autenticado
          const { data: activeOrders } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', currentUserId)
            .in('status', ['pending', 'orden_enviada', 'orden_recibida', 'en_preparacion', 'lista_para_entregar', 'en_entrega', 'con_incidencias']);
          
          // Guardar en localStorage para restaurar después
          if (cartItems && cartItems.length > 0) {
            localStorage.setItem('pending_cart_migration', JSON.stringify(cartItems));
          }
          if (activeOrders && activeOrders.length > 0) {
            localStorage.setItem('pending_orders_migration', JSON.stringify(activeOrders));
          }
        } catch (migrationError) {
          console.warn('Error migrating data before logout:', migrationError);
        }
      }
      
      await supabase.auth.signOut();
      
      // Después de cerrar sesión, restaurar el carrito y órdenes al user_id anónimo actual
      // Esto se hará automáticamente cuando se llame a getCart() o getOrders() la próxima vez
      // porque getUserId() ahora devolverá el user_id de localStorage
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
