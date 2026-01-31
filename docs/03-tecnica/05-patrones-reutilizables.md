# 🔄 Patrones Reutilizables

> **Propósito**: Código, scripts y plantillas que pueden copiarse y adaptarse para nuevas aplicaciones.

**Última actualización**: 2025-01-30

---

## 📁 Estructura de Carpetas Base

```
proyecto/
├── services/
│   ├── api/
│   │   ├── types.ts          # ApiResponse<T>, ApiError
│   │   ├── base.ts           # handleSupabaseError, requireAuth
│   │   ├── user.ts           # API de usuarios
│   │   ├── products.ts       # API de productos
│   │   └── index.ts          # Exportaciones centralizadas
│   └── database.ts           # Funciones legacy (migrar a api/)
├── contexts/
│   ├── AuthContext.tsx       # Autenticación
│   ├── LanguageContext.tsx   # i18n
│   └── [OtrosContexts].tsx
├── screens/                  # Pantallas completas
├── components/              # Componentes reutilizables
├── locales/                  # Traducciones
│   ├── es.json
│   ├── en.json
│   └── ...
└── supabase/                # Scripts SQL
    ├── MASTER_SETUP.sql
    └── fix-*.sql
```

---

## 🔌 Plantilla de API Service

### `services/api/base.ts`
```typescript
import { supabase, isSupabaseConfigured } from '../../config/supabase';
import { ApiResponse, ApiError } from './types';

export async function handleSupabaseError<T>(
  operation: () => Promise<T>,
  errorMessage: string = 'Error en la operación'
): Promise<ApiResponse<T>> {
  if (!isSupabaseConfigured()) {
    return {
      success: false,
      error: 'Supabase no está configurado',
    };
  }

  try {
    const data = await operation();
    return {
      success: true,
      data,
    };
  } catch (error: any) {
    console.error(`[API Error] ${errorMessage}:`, error);
    
    const apiError: ApiError = {
      code: error.code || 'UNKNOWN_ERROR',
      message: error.message || errorMessage,
      details: error,
    };

    return {
      success: false,
      error: apiError.message,
    };
  }
}

export async function requireAuth(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('Usuario no autenticado');
  }
  return user.id;
}
```

### `services/api/types.ts`
```typescript
export interface ApiResponse<T> {
  success: boolean;
  data?: T | null;
  error?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}
```

### `services/api/user.ts` (Ejemplo)
```typescript
import { supabase } from '../../config/supabase';
import { handleSupabaseError, requireAuth } from './base';
import { ApiResponse } from './types';

export interface UserProfile {
  user_id: string;
  name?: string;
  // ... otros campos
}

export async function getUserProfile(
  userId?: string
): Promise<ApiResponse<UserProfile | null>> {
  return handleSupabaseError(async () => {
    const targetUserId = userId || await requireAuth();

    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', targetUserId)
      .maybeSingle(); // ⚠️ Usar maybeSingle, no single

    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return (data || null) as UserProfile | null;
  }, 'Error al obtener perfil de usuario');
}
```

---

## 🔐 Plantilla de AuthContext

### Patrón de Loading State Seguro
```typescript
useEffect(() => {
  let mounted = true;
  let safetyTimeout: NodeJS.Timeout;

  const loadSession = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    } catch (error) {
      if (!mounted) return;
      console.error('Error loading session:', error);
      setLoading(false);
    }
  };

  loadSession();

  // Safety timeout para evitar loading infinito
  safetyTimeout = setTimeout(() => {
    if (mounted) {
      setLoading(false);
    }
  }, 5000);

  return () => {
    mounted = false;
    clearTimeout(safetyTimeout);
  };
}, []);
```

---

## 🗄️ Plantilla de RLS Policies

### Para Tablas de Perfil de Usuario
```sql
-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;

-- Habilitar RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Política SELECT
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Política INSERT
CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );

-- Política UPDATE
CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND 
    auth.uid() = user_id
  );
```

---

## 🌍 Plantilla de Sistema de Traducciones

### `contexts/LanguageContext.tsx`
```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import es from '../locales/es.json';
import en from '../locales/en.json';

const translations = { es, en };

interface LanguageContextType {
  language: string;
  setLanguage: (lang: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<string>('es');

  const t = (key: string): string => {
    const keys = key.split('.');
    let value: any = translations[language as keyof typeof translations];
    
    for (const k of keys) {
      value = value?.[k];
    }
    
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within LanguageProvider');
  }
  return context;
};
```

---

## ✅ Plantilla de Validación de UUID

```typescript
export const isValidUUID = (str: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
};

// Uso
if (!isValidUUID(id)) {
  console.warn(`ID "${id}" is not a valid UUID`);
  return;
}
```

---

## 🔄 Plantilla de Debouncing

```typescript
import { useState, useEffect, useRef } from 'react';

export const useDebounce = <T,>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Uso
const [searchQuery, setSearchQuery] = useState('');
const debouncedQuery = useDebounce(searchQuery, 300);

useEffect(() => {
  if (debouncedQuery) {
    performSearch(debouncedQuery);
  }
}, [debouncedQuery]);
```

---

## 📝 Plantilla de Script SQL de Migración

```sql
-- ==================== MIGRACIÓN: [Descripción] ====================
-- Este script [describe qué hace]
-- Ejecuta este script directamente en Supabase SQL Editor

-- Paso 1: Verificar y renombrar columna (si existe)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'nombre_tabla' 
    AND column_name = 'columna_vieja'
  ) THEN
    ALTER TABLE nombre_tabla RENAME COLUMN columna_vieja TO columna_nueva;
    RAISE NOTICE 'Columna renombrada';
  END IF;
END $$;

-- Paso 2: Agregar columna nueva (si no existe)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'nombre_tabla' 
    AND column_name = 'columna_nueva'
  ) THEN
    ALTER TABLE nombre_tabla ADD COLUMN columna_nueva TEXT;
    RAISE NOTICE 'Columna agregada';
  END IF;
END $$;

-- Verificar estructura final
SELECT 
    column_name,
    data_type,
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_schema = 'public' 
    AND table_name = 'nombre_tabla'
ORDER BY 
    ordinal_position;
```

---

## 🎨 Plantilla de Componente con Traducciones

```typescript
import React from 'react';
import { useTranslation } from '../contexts/LanguageContext';

interface MyComponentProps {
  // props
}

export const MyComponent: React.FC<MyComponentProps> = () => {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.welcome')}</h1>
      <p>{t('common.description')}</p>
    </div>
  );
};
```

---

## 🔗 Referencias

- [Lecciones Aprendidas](./04-lecciones-aprendidas.md)
- [Arquitectura del Sistema](./01-arquitectura.md)

---

**Nota**: Estos patrones pueden copiarse y adaptarse según las necesidades de cada proyecto.
