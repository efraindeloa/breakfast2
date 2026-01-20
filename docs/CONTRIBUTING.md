# 🤝 Guía de Contribución

## Visión General

¡Gracias por tu interés en contribuir a **Breakfast App**! Esta guía te ayudará a entender cómo contribuir al proyecto de manera efectiva.

---

## 📋 Tabla de Contenidos

1. [Código de Conducta](#código-de-conducta)
2. [Cómo Contribuir](#cómo-contribuir)
3. [Configuración del Entorno](#configuración-del-entorno)
4. [Estándares de Código](#estándares-de-código)
5. [Proceso de Pull Request](#proceso-de-pull-request)
6. [Reportar Bugs](#reportar-bugs)
7. [Sugerir Funcionalidades](#sugerir-funcionalidades)

---

## 📜 Código de Conducta

### Nuestro Compromiso

- Ser respetuoso y amable
- Aceptar críticas constructivas
- Enfocarse en lo que es mejor para la comunidad
- Mostrar empatía hacia otros miembros

### Comportamiento Inaceptable

- Uso de lenguaje o imágenes sexualizadas
- Comentarios despectivos, insultantes o ataques personales
- Acoso público o privado
- Publicar información privada de otros sin permiso

---

## 🚀 Cómo Contribuir

### Tipos de Contribuciones

#### 🐛 Reportar Bugs
Ver sección [Reportar Bugs](#reportar-bugs)

#### 💡 Sugerir Funcionalidades
Ver sección [Sugerir Funcionalidades](#sugerir-funcionalidades)

#### 📝 Mejorar Documentación
- Corregir errores ortográficos
- Mejorar claridad
- Agregar ejemplos
- Traducir documentación

#### 💻 Contribuir Código
- Agregar nuevas funcionalidades
- Corregir bugs
- Mejorar rendimiento
- Refactorizar código

---

## ⚙️ Configuración del Entorno

### Requisitos Previos

- **Node.js**: 18.x o superior
- **npm**: 9.x o superior
- **Git**: Última versión
- **Editor**: VS Code recomendado (con extensiones)

### Configuración Inicial

#### 1. Fork del Repositorio
1. Haz fork del repositorio en GitHub
2. Clona tu fork:
   ```bash
   git clone https://github.com/tu-usuario/breakfast2.git
   cd breakfast2
   ```

#### 2. Instalar Dependencias
```bash
npm install
```

#### 3. Crear Rama de Desarrollo
```bash
git checkout -b develop
```

#### 4. Configurar Remoto
```bash
git remote add upstream https://github.com/original-repo/breakfast2.git
```

### Desarrollo Local

#### Servidor de Desarrollo
```bash
npm run dev
```
- Inicia servidor en `http://localhost:5173`
- Hot Module Replacement (HMR) activado

#### Build de Producción
```bash
npm run build
```

#### Preview de Build
```bash
npm run preview
```

---

## 📐 Estándares de Código

### TypeScript

#### Convenciones
- Usar TypeScript estricto
- Definir tipos explícitos
- Evitar `any` cuando sea posible
- Usar interfaces para objetos

#### Ejemplo
```typescript
interface User {
  id: number;
  name: string;
  email: string;
}

const getUser = async (id: number): Promise<User> => {
  // ...
};
```

### React

#### Componentes Funcionales
- Preferir componentes funcionales
- Usar hooks en lugar de clases
- Nombres de componentes en PascalCase

#### Ejemplo
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ label, onClick, disabled = false }) => {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
};
```

### Nomenclatura

#### Archivos
- **Componentes**: PascalCase (`Button.tsx`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Types**: camelCase (`order.ts`)
- **Screens**: PascalCase (`HomeScreen.tsx`)

#### Variables y Funciones
- **Variables**: camelCase (`userName`)
- **Funciones**: camelCase (`getUserData`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`)
- **Tipos/Interfaces**: PascalCase (`UserData`)

### Formato de Código

#### Usar Prettier
```bash
npx prettier --write .
```

#### Configuración (`.prettierrc`)
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 100,
  "tabWidth": 2
}
```

### Linting

#### ESLint
- Usar reglas estándar de React
- Corregir warnings antes de commit

#### Verificar
```bash
npm run lint
```

---

## 🔀 Proceso de Pull Request

### Antes de Crear un PR

#### 1. Actualizar Tu Fork
```bash
git checkout main
git pull upstream main
git push origin main
```

#### 2. Crear Rama
```bash
git checkout -b feature/mi-funcionalidad
# o
git checkout -b fix/mi-correccion
```

#### 3. Hacer Cambios
- Código claro y legible
- Comentarios donde sea necesario
- Tests si aplica
- Documentación actualizada

#### 4. Commit
```bash
git add .
git commit -m "feat: agregar funcionalidad X"
```

#### Convenciones de Commit
- **feat**: Nueva funcionalidad
- **fix**: Corrección de bug
- **docs**: Cambios en documentación
- **style**: Cambios de formato (sin afectar código)
- **refactor**: Refactorización de código
- **test**: Agregar o corregir tests
- **chore**: Tareas de mantenimiento

#### Ejemplos
```
feat: agregar sistema de opiniones
fix: corregir error en escáner QR
docs: actualizar guía del usuario
refactor: mejorar gestión de estado del carrito
```

### Crear Pull Request

#### 1. Push a Tu Fork
```bash
git push origin feature/mi-funcionalidad
```

#### 2. Crear PR en GitHub
- Título claro y descriptivo
- Descripción detallada de cambios
- Referenciar issues relacionados
- Screenshots si aplica

#### 3. Template de PR
```markdown
## Descripción
Breve descripción de los cambios

## Tipo de Cambio
- [ ] Bug fix
- [ ] Nueva funcionalidad
- [ ] Breaking change
- [ ] Mejora de documentación

## Cómo Probarlo
Pasos para probar los cambios

## Screenshots (si aplica)
[Screenshots aquí]

## Checklist
- [ ] Código sigue estándares del proyecto
- [ ] Self-review completado
- [ ] Comentarios agregados donde sea necesario
- [ ] Documentación actualizada
- [ ] No hay warnings nuevos
- [ ] Tests agregados/actualizados (si aplica)
```

### Revisión de PR

#### Para el Autor
- Responder a comentarios
- Hacer cambios solicitados
- Actualizar PR según feedback

#### Para los Revisores
- Revisar código con cuidado
- Ser constructivo en comentarios
- Aprobar cuando esté listo

---

## 🐛 Reportar Bugs

### Antes de Reportar

1. Verificar que el bug no haya sido reportado ya
2. Verificar que el bug sigue ocurriendo en la última versión
3. Intentar reproducir el bug

### Formato de Bug Report

#### Título
```
[BREVE DESCRIPCIÓN DEL PROBLEMA]
```

#### Cuerpo
```markdown
## Descripción
Descripción clara del bug

## Pasos para Reproducir
1. Paso 1
2. Paso 2
3. ...

## Comportamiento Esperado
Qué debería pasar

## Comportamiento Actual
Qué pasa realmente

## Screenshots/Videos
[Si aplica]

## Ambiente
- OS: [Android 10, Windows 10, etc.]
- Versión de la app: [1.0.0]
- Navegador: [Chrome 120, etc.] (si aplica)
- Dispositivo: [Samsung Galaxy S20, etc.]

## Información Adicional
Cualquier otra información relevante
```

### Etiquetas
- `bug`: Error en código
- `high-priority`: Bugs críticos
- `android`: Específico de Android
- `web`: Específico de web

---

## 💡 Sugerir Funcionalidades

### Antes de Sugerir

1. Verificar que la funcionalidad no exista ya
2. Verificar que no haya sido sugerida antes
3. Considerar el alcance y esfuerzo

### Formato de Sugerencia

#### Título
```
[FEATURE REQUEST]: [BREVE DESCRIPCIÓN]
```

#### Cuerpo
```markdown
## Problema que Resuelve
¿Qué problema soluciona esta funcionalidad?

## Solución Propuesta
Descripción detallada de la funcionalidad propuesta

## Alternativas Consideradas
Otras soluciones que consideraste

## Impacto
- Usuarios afectados: [Todos / Algunos / Específicos]
- Esfuerzo estimado: [Bajo / Medio / Alto]

## Información Adicional
Mockups, referencias, etc.
```

---

## 📚 Recursos Adicionales

### Documentación
- [Arquitectura del Sistema](./docs/03-tecnica/01-arquitectura.md)
- [Especificaciones Funcionales](./docs/01-producto/02-especificaciones-funcionales.md)
- [Modelo de Datos](./docs/03-tecnica/02-modelo-datos.md)

### Comunidad
- GitHub Discussions: Para preguntas y discusiones
- GitHub Issues: Para bugs y sugerencias

---

## ❓ Preguntas

Si tienes preguntas sobre cómo contribuir:
1. Revisa la documentación
2. Busca en issues cerrados
3. Abre una discusión en GitHub

---

**Gracias por contribuir a Breakfast App!** 🎉

---

**Última actualización**: Diciembre 2024  
**Versión del documento**: 1.0
