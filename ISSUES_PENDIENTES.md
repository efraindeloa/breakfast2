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

### 3. Página se queda cargando permanentemente después de hacer refresh (F5) cuando el usuario está autenticado
**Fecha:** 2026-01-30  
**Estado:** Pendiente  
**Prioridad:** Alta

**Descripción:**
Cuando un usuario está autenticado y hace refresh (F5) en la página, la aplicación se queda permanentemente en estado de carga. Después de esto, el usuario no puede continuar y tiene que borrar el cache del navegador para poder usar la aplicación nuevamente.

**Comportamiento actual:**
- Usuario está autenticado
- Usuario hace refresh (F5)
- La página muestra la animación de carga indefinidamente
- El usuario no puede interactuar con la aplicación
- Solo funciona después de borrar el cache del navegador

**Causa identificada:**
El problema parece estar relacionado con:
1. El `safetyTimeout` que fuerza `setLoading(false)` después de 5 segundos puede estar interfiriendo con el proceso de autenticación
2. El `onAuthStateChange` con eventos `INITIAL_SESSION` o `TOKEN_REFRESHED` puede estar bloqueándose en verificaciones de la base de datos
3. Posible condición de carrera entre `getSession()` inicial y `onAuthStateChange`
4. El flag `isAuthenticating` puede no estar funcionando correctamente para prevenir que el `safetyTimeout` interfiera

**Archivos afectados:**
- `contexts/AuthContext.tsx` - Función `useEffect` de carga inicial y `onAuthStateChange`
- `App.tsx` - Manejo del estado `loading` del AuthContext

**Intentos de solución:**
1. ✅ Agregado timeout de seguridad de 5 segundos
2. ✅ Simplificado el manejo de `INITIAL_SESSION` y `TOKEN_REFRESHED` para evitar verificaciones estrictas
3. ✅ Agregado flag `isAuthenticating` para evitar que el `safetyTimeout` interfiera durante el inicio de sesión
4. ✅ Agregado timeout en `refreshAccountType` para evitar bloqueos
5. ❌ El problema persiste

**Solución propuesta:**
1. **Investigación adicional:** Revisar si hay problemas de RLS en las tablas `users` o `restaurant_staff` que estén bloqueando las consultas
2. **Mejorar el manejo de eventos:** Separar completamente la lógica de carga inicial de la lógica de autenticación activa
3. **Agregar más logging:** Para identificar exactamente dónde se está bloqueando el proceso
4. **Considerar deshabilitar temporalmente el `safetyTimeout`** durante el proceso de autenticación activa
5. **Revisar el orden de ejecución:** Asegurar que `getSession()` y `onAuthStateChange` no compitan entre sí

**Notas:**
- El problema también afecta el inicio de sesión: cuando el `safetyTimeout` se activa, el botón de "Iniciando sesión..." se queda atascado
- Se ha intentado usar el flag `isAuthenticating` pero el problema persiste

---

---

## 🟢 Menores

### 4. Efecto fade-in no se muestra en los botones del HomeScreen
**Fecha:** 2026-01-30  
**Estado:** Pendiente  
**Prioridad:** Baja

**Descripción:**
Los botones del HomeScreen no muestran el efecto de fade-in (aparición gradual) al cargar la página. A pesar de que se ha implementado la lógica con estados de opacidad y transiciones CSS, el efecto no es visible.

**Comportamiento actual:**
- Los botones se muestran inmediatamente con opacidad 1
- No se observa la transición de opacidad 0 a 1
- El efecto debería ser similar al del botón "Seleccionar idioma" en WelcomeScreen

**Archivos afectados:**
- `screens/HomeScreen.tsx` - Estados `buttonOpacities` y `useEffect` para fade-in

**Intentos de solución:**
1. ✅ Implementado estados de opacidad inicial en 0
2. ✅ Agregado `useEffect` con delay de 50ms
3. ✅ Aumentado delay a 100ms y luego a 200ms
4. ✅ Usado `requestAnimationFrame` doble para asegurar renderizado inicial
5. ✅ Aplicado transiciones CSS `duration-500 ease-out`
6. ❌ El problema persiste - los botones aparecen inmediatamente

**Causa posible:**
- El navegador puede estar renderizando los botones con opacidad 1 antes de que el estado inicial (opacidad 0) se procese
- React puede estar batching los updates de estado de manera que la transición no se vea
- El componente puede estar re-renderizándose antes de que la transición CSS se active

**Solución propuesta:**
1. **Investigar:** Revisar si hay algún CSS global que esté sobrescribiendo la opacidad
2. **Alternativa:** Usar animaciones CSS con `@keyframes` en lugar de transiciones de opacidad
3. **Alternativa:** Usar una librería de animaciones como Framer Motion
4. **Alternativa:** Aplicar el efecto solo después de que la página esté completamente cargada usando eventos del DOM

**Notas:**
- El mismo patrón funciona correctamente en WelcomeScreen para el botón "Seleccionar idioma"
- El problema afecta a todos los botones del HomeScreen (QR, Menú, Asistencia, Lista de Espera, Unirse a Mesa, Invitar, Descubrir, Reservaciones, Perfil del Restaurante)

---

---

## 📝 Notas

- Este archivo se actualiza manualmente cuando se identifican nuevos issues
- Los issues se mueven entre secciones según su prioridad
- Cuando un issue se resuelve, se debe mover a una sección "Resueltos" o eliminarse
