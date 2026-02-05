# Instalar Supabase CLI

## Instalación

### Windows (PowerShell)
```powershell
# Opción 1: Usando npm (recomendado)
npm install -g supabase

# Opción 2: Usando Scoop
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### macOS
```bash
# Opción 1: Usando Homebrew (recomendado)
brew install supabase/tap/supabase

# Opción 2: Usando npm
npm install -g supabase
```

### Linux
```bash
# Usando npm
npm install -g supabase
```

## Verificar instalación
```bash
supabase --version
```

## Vincular proyecto

Después de instalar, vincula tu proyecto:

```bash
# Iniciar sesión
supabase login

# Vincular proyecto
supabase link --project-ref tkwackqrnsqlmxtalvuw
```

## Ejecutar scripts SQL

Una vez instalado y vinculado, puedes ejecutar scripts SQL:

```bash
# Ejecutar un script SQL
supabase db execute -f supabase/rls-simple-permissive.sql

# O usando el script helper
node scripts/execute-sql-supabase-cli.js supabase/rls-simple-permissive.sql
```

## Ventajas

✅ Puedo ejecutar scripts SQL automáticamente  
✅ No necesitas copiar/pegar en el dashboard  
✅ Puedo verificar errores antes de ejecutar  
✅ Más rápido y automatizado  

## Notas

- Necesitas estar autenticado: `supabase login`
- Necesitas estar vinculado al proyecto: `supabase link`
- Los scripts se ejecutan directamente en tu base de datos
