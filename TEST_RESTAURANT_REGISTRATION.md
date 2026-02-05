# Guía de Prueba: Registro de Restaurante

## Prueba Automatizada

Ejecuta este script en la consola del navegador (F12) después de cargar la aplicación:

```javascript
// Copia y pega el contenido completo de scripts/test-restaurant-registration.js
```

## Prueba Manual Completa

### Paso 1: Preparación
1. Abre la aplicación en el navegador
2. Abre la consola del navegador (F12)
3. Asegúrate de que no hay sesión activa (cierra sesión si es necesario)

### Paso 2: Ir al Formulario de Registro
1. Navega a la pantalla de registro
2. Selecciona el tipo de cuenta: **"Restaurante"**

### Paso 3: Completar el Formulario

**Datos de prueba:**
- **Email/Usuario:** `test.restaurant.${Date.now()}@test.com` (o cualquier email único)
- **Contraseña:** `Test1234!@#$` (debe cumplir todas las reglas)
- **Confirmar contraseña:** `Test1234!@#$`
- **Nombre del restaurante:** `Mi Restaurante Test ${Date.now()}` (mínimo 3 caracteres)
- **RFC (opcional):** `TEST123456ABC`

### Paso 4: Verificar Validaciones

Mientras escribes el nombre del restaurante, deberías ver:

1. **Indicador de carga** (spinner) mientras verifica
2. **Mensaje "✓ Nombre disponible"** si el nombre no existe
3. **Mensaje de error** si el nombre ya existe: "Este nombre de restaurante no está disponible"

### Paso 5: Enviar el Formulario

1. Haz clic en **"Registrarse"** o **"Crear cuenta"**
2. Observa la consola del navegador para ver los logs

### Paso 6: Verificar Resultado

**✅ Éxito esperado:**
- No hay errores en la consola
- No aparece el error de "recursión infinita"
- El usuario se registra correctamente
- El restaurante se crea en la base de datos
- El usuario queda asociado como owner del restaurante
- Se redirige a la pantalla de inicio o dashboard

**❌ Si hay errores:**
- Revisa la consola para ver el error específico
- Verifica que las políticas RLS estén aplicadas

## Verificación en Supabase

Después del registro, verifica en Supabase Dashboard:

1. **Tabla `users`:**
   - Debe existir un nuevo usuario con el email usado

2. **Tabla `restaurants`:**
   - Debe existir un nuevo restaurante con el nombre proporcionado
   - El `slug` debe ser único

3. **Tabla `restaurant_staff`:**
   - Debe existir un registro asociando el usuario al restaurante
   - El `role` debe ser `'owner'`
   - `is_active` debe ser `true`

## Pruebas de Casos Especiales

### Test 1: Nombre duplicado
1. Intenta registrar con un nombre que ya existe
2. Debería mostrar error: "Este nombre de restaurante no está disponible"

### Test 2: Nombre muy corto
1. Intenta escribir un nombre de menos de 3 caracteres
2. Debería mostrar error: "El nombre del restaurante debe tener al menos 3 caracteres"

### Test 3: Nombre vacío
1. Intenta registrar sin nombre
2. Debería mostrar error: "Por favor, ingresa el nombre del restaurante"

### Test 4: Verificación en tiempo real
1. Escribe un nombre válido (mínimo 3 caracteres)
2. Espera 500ms (debounce)
3. Debería aparecer el indicador de carga
4. Debería mostrar si el nombre está disponible o no

## Solución de Problemas

### Error: "403 Forbidden" al crear restaurante
- **Causa:** Las políticas RLS no permiten la inserción
- **Solución:** Ejecuta el script `supabase/fix-restaurants-rls-signup-consolidated.sql` en Supabase SQL Editor

## Checklist de Verificación

Antes de probar, asegúrate de que:

- [ ] Las políticas RLS están aplicadas (script SQL ejecutado)
- [ ] No hay errores de compilación en el código
- [ ] La aplicación está corriendo y Supabase está configurado
- [ ] Tienes acceso a la consola del navegador para ver logs
