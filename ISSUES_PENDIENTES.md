# Issues Pendientes

## 🔴 Críticos

### 1. Error al actualizar producto cuando solo cambia la capitalización del nombre
**Fecha:** 2026-01-30  
**Estado:** Pendiente  
**Prioridad:** Alta

**Descripción:**
Al intentar editar un producto y cambiar solo la capitalización del nombre (ej: "Sopa azteca" → "Sopa Azteca"), se produce un error porque ya existe otro producto con ese nombre exacto en la base de datos.

**Comportamiento actual:**
- El sistema detecta que solo cambió la capitalización
- Intenta usar una actualización en dos pasos (nombre temporal → nombre final)
- El paso 1 se completa correctamente (cambia a nombre temporal)
- El paso 2 detecta que ya existe otro producto con el nombre "Sopa Azteca" (ID: 1)
- Se restaura el nombre original y se muestra un error

**Logs relevantes:**
```
[updateProduct] Solo cambió capitalización, se usará actualización en dos pasos
[updateProduct] Paso 1: Cambiando a nombre temporal: Sopa Azteca_temp_1769790440656_ep6ckh
[updateProduct] Paso 1 completado
[updateProduct] Ya existe otro producto con el nombre: Sopa Azteca ID: 1
Error: Ya existe otro producto con el nombre "Sopa Azteca" en este restaurante (ID: 1)
```

**Causa identificada:**
Ya existe un producto duplicado en la base de datos:
- Producto ID 1: nombre "Sopa Azteca" (con mayúscula)
- Producto ID 10: nombre "Sopa azteca" (con minúscula)

**Archivos afectados:**
- `services/database.ts` - Función `updateProduct`

**Solución propuesta:**
1. **Corto plazo:** Mostrar un mensaje más claro al usuario indicando que existe un producto duplicado y sugerir eliminar o renombrar el duplicado
2. **Mediano plazo:** Implementar una función de limpieza para detectar y consolidar productos duplicados (mismo nombre, ignorando capitalización)
3. **Largo plazo:** Considerar cambiar la restricción única para que sea case-insensitive o implementar una lógica de normalización de nombres

---

### 2. Error de restricción única en restaurant_menu_sections al guardar
**Fecha:** 2026-01-30  
**Estado:** Pendiente  
**Prioridad:** Media

**Descripción:**
Al guardar las secciones del menú del restaurante, se produce un error de restricción única:

```
duplicate key value violates unique constraint "re..._sections_restaurant_id_section_type_categor_key"
```

**Comportamiento actual:**
- El sistema intenta guardar las secciones del menú
- Se produce un error 409 (Conflict) al intentar insertar
- El mensaje indica que ya existe una entrada con la misma combinación de `restaurant_id`, `section_type` y `category`

**Logs relevantes:**
```
[saveRestaurantMenuSections] Insert error: {code: '23505', details: null, hint: null, message: 'duplicate key value violates unique constraint "re..._sections_restaurant_id_section_type_categor_key"'}
[MenuRestaurantScreen] Failed to save menu sections
```

**Archivos afectados:**
- `services/database.ts` - Función `saveRestaurantMenuSections`
- `screens/MenuRestaurantScreen.tsx` - Función `saveMenuSections`

**Solución propuesta:**
- Verificar que la función `saveRestaurantMenuSections` use `UPSERT` correctamente
- Asegurar que se actualicen las secciones existentes en lugar de intentar insertar duplicados
- Agregar mejor manejo de errores y logging para identificar qué sección está causando el conflicto

---

## 🟡 Importantes

_(Agregar otros issues importantes aquí cuando surjan)_

---

## 🟢 Menores

_(Agregar issues menores aquí cuando surjan)_

---

## 📝 Notas

- Este archivo se actualiza manualmente cuando se identifican nuevos issues
- Los issues se mueven entre secciones según su prioridad
- Cuando un issue se resuelve, se debe mover a una sección "Resueltos" o eliminarse
