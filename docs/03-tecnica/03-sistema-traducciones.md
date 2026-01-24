# Sistema de Traducciones Multiidioma

## Arquitectura

El sistema de traducciones utiliza una **tabla separada** (`product_translations`) para almacenar traducciones de productos. Esta arquitectura es escalable y permite:

- ✅ Agregar nuevos idiomas sin modificar el esquema
- ✅ Traducciones parciales (si falta una traducción, se usa fallback)
- ✅ Personalización por restaurante
- ✅ Actualizaciones sin deploy de código

## Estructura de Base de Datos

### Tabla `product_translations`

```sql
CREATE TABLE product_translations (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL CHECK (language_code IN ('es', 'en', 'pt', 'fr')),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT product_translations_unique UNIQUE (product_id, language_code)
);
```

## Flujo de Datos

1. **Usuario cambia idioma** → Se guarda en `localStorage` (`appLanguage`)
2. **Carga de productos** → `getProducts()` detecta el idioma actual
3. **Query con JOIN** → Se hace JOIN con `product_translations` filtrando por `language_code`
4. **Fallback automático** → Si no hay traducción en el idioma solicitado:
   - Primero intenta español
   - Si tampoco hay español, usa el nombre/descripción original de `products`

## Uso en el Código

### Obtener productos con traducciones

```typescript
// Automático: detecta el idioma desde localStorage
const products = await getProducts({ category: 'Postres' });

// Manual: especificar idioma
const products = await getProducts({ 
  category: 'Postres',
  language: 'en' 
});
```

### Agregar traducciones

```sql
-- Insertar traducción en inglés para un producto
INSERT INTO product_translations (product_id, language_code, name, description)
VALUES (1, 'en', 'Chocolate Cake', 'Delicious chocolate cake with cream')
ON CONFLICT (product_id, language_code) 
DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description;
```

## Ventajas sobre otras opciones

### vs. Columnas por idioma (name_es, name_en, etc.)
- ✅ No requiere cambios de esquema para nuevos idiomas
- ✅ Más normalizado y mantenible
- ✅ Permite traducciones parciales

### vs. Archivos JSON locales
- ✅ Actualizable sin deploy
- ✅ Permite personalización por restaurante
- ✅ Centralizado en la base de datos

## Migración de Datos Existentes

Para migrar productos existentes:

```bash
# Ejecutar el script de migración
psql -h [host] -U [user] -d [database] -f supabase/migrate_existing_products_to_translations.sql
```

Este script:
1. Toma todos los productos activos
2. Crea traducciones en español con sus nombres/descripciones actuales
3. Verifica que se insertaron correctamente

## Agregar Nuevos Idiomas

Para agregar un nuevo idioma (ej: italiano):

1. **Actualizar constraint en la tabla:**
```sql
ALTER TABLE product_translations 
DROP CONSTRAINT IF EXISTS product_translations_language_code_check;

ALTER TABLE product_translations 
ADD CONSTRAINT product_translations_language_code_check 
CHECK (language_code IN ('es', 'en', 'pt', 'fr', 'it'));
```

2. **Actualizar el código TypeScript:**
```typescript
// En contexts/LanguageContext.tsx
export type Language = 'es' | 'en' | 'pt' | 'fr' | 'it';

// En services/database.ts
const getCurrentLanguage = (): string => {
  // ... agregar caso para 'it'
  return 'it';
};
```

3. **Agregar archivo de traducciones:**
- Crear `locales/it.json`

## Rendimiento

- **Índices:** La tabla tiene índices en `product_id`, `language_code` y compuesto `(product_id, language_code)`
- **JOIN optimizado:** El JOIN se hace con `LEFT JOIN` para permitir productos sin traducciones
- **Fallback eficiente:** Se hace en memoria después de obtener los datos

## Próximos Pasos

- [ ] Agregar traducciones para inglés, portugués y francés
- [ ] Panel de administración para editar traducciones
- [ ] Traducciones para categorías y otros textos dinámicos
- [ ] Cache de traducciones en el cliente
