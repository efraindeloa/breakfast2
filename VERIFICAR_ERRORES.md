# Proceso de Verificación de Errores

## Instrucciones para el Asistente

Cuando el usuario te pida verificar errores o cuando hagas cambios, SIEMPRE sigue este proceso completo:

### 1. Verificar Linter en Archivos Modificados
```bash
read_lints(['ruta/archivo1.ts', 'ruta/archivo2.ts'])
```

### 2. Verificar Linter en TODO el Proyecto
```bash
read_lints([])  # Sin parámetros = todo el proyecto
```

### 3. Verificar Compilación TypeScript
```bash
npx tsc --noEmit 2>&1 | Select-String -Pattern "error TS" | Select-Object -First 20
```

### 4. Verificar Build de Producción
```bash
npm run build 2>&1 | Select-String -Pattern "error|Error|ERROR" | Select-Object -First 20
```

### 5. Verificar Archivos Específicos Modificados
- Leer las líneas exactas que modifiqué
- Verificar que la sintaxis es correcta
- Verificar que los tipos son correctos

## Checklist OBLIGATORIO

Antes de decir "no hay errores", verifica:

- [ ] `read_lints([])` - Sin errores en TODO el proyecto
- [ ] `read_lints(['archivos/modificados'])` - Sin errores en archivos modificados
- [ ] `npx tsc --noEmit` - Sin errores de TypeScript
- [ ] `npm run build` - Build exitoso (o errores documentados si son preexistentes)
- [ ] Revisar las líneas específicas modificadas

## Respuesta Estándar

Si encuentras errores:
1. **Lista TODOS los errores encontrados**
2. **Indica cuáles son preexistentes y cuáles son nuevos**
3. **Corrige los errores nuevos**
4. **Vuelve a verificar siguiendo el checklist completo**

Si NO encuentras errores:
1. **Muestra la salida de cada comando de verificación**
2. **Confirma que los archivos modificados no tienen errores**
3. **Indica si hay errores preexistentes en otros archivos (no relacionados)**

## Comando Rápido para el Usuario

Cuando quieras que verifique errores, di:
- "Verifica errores siguiendo VERIFICAR_ERRORES.md"
- "Asegúrate de que no hay errores usando el proceso completo"
- "Sigue el checklist de verificación de errores"
