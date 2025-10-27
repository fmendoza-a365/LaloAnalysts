# 📐 Estándares de Diseño - A365 Analytics

## 🎨 Sistema de Headers Estandarizado (SOBRIO)

### Header de Página Único - TODAS LAS PÁGINAS
**Estructura Obligatoria:**
```html
<div class="bg-white border-b border-gray-200 mb-6">
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-5">
    <div class="flex-1">
      <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
        [Título]
      </h1>
      <p class="text-sm text-gray-600">[Descripción]</p>
    </div>
    <!-- Contenido adicional (filtros, botones) -->
  </div>
</div>
```

**Características:**
- ✅ Fondo blanco
- ✅ Borde inferior gris sutil
- ✅ Sin gradientes de color
- ✅ Tipografía gris oscuro (#111827)
- ✅ Diseño minimalista y profesional
- ✅ **MISMO DISEÑO EN TODAS LAS PÁGINAS**

### Headers de Sección (Tablas)
**Estructura:**
```html
<div class="bg-gradient-to-r from-[color]-700 to-[color]-800 px-6 py-4">
  <h2 class="text-lg lg:text-xl font-bold text-white">[Título]</h2>
  <p class="text-sm text-white/80 mt-1">[Descripción opcional]</p>
</div>
```

**Colores Recomendados:**
- Sección principal: `from-blue-700 to-blue-800`
- Sección secundaria: `from-teal-600 to-teal-700`
- Sección genérica: `from-gray-700 to-gray-800`
- Datos de personal: `from-green-600 to-green-700`

## 📝 Escala de Tamaños de Fuente

### Títulos
| Elemento | Clase Tailwind | Tamaño | Uso |
|----------|---------------|--------|-----|
| **H1 Principal** | `text-2xl lg:text-3xl` | 24px / 30px | Headers de página |
| **H2 Sección** | `text-lg lg:text-xl` | 18px / 20px | Headers de tabla/sección |
| **H3 Subsección** | `text-base lg:text-lg` | 16px / 18px | Subsecciones |
| **Descripción** | `text-base` | 16px | Subtítulos y descripciones |

### Texto de Cuerpo
| Elemento | Clase Tailwind | Tamaño | Uso |
|----------|---------------|--------|-----|
| **Texto normal** | `text-sm` | 14px | Contenido general |
| **Texto pequeño** | `text-xs` | 12px | Labels, metadata |
| **Tablas** | `text-xs` | 12px | Contenido de celdas |

### Font Weights
- **Bold**: `font-bold` (700) - Títulos principales
- **Semibold**: `font-semibold` (600) - Subtítulos, labels importantes
- **Medium**: `font-medium` (500) - Texto destacado
- **Normal**: `font-normal` (400) - Texto regular

## 🎯 Controles y Botones (Estilo Sobrio)

### Selectores / Inputs
```html
<select class="border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
```

### Botón Primario
```html
<button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition">
```

### Botón Secundario
```html
<button class="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition">
```

## 🎯 Espaciado y Layout

### Contenedores
```html
<!-- Contenedor principal -->
<div class="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">

<!-- Tarjetas/Secciones -->
<div class="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
```

### Padding Estándar
- **Header de página**: `p-6`
- **Header de sección**: `px-6 py-4`
- **Contenido de tabla**: `px-3 py-2` (celdas pequeñas)
- **Contenido de tabla**: `px-4 py-3` (celdas normales)

### Margins
- **Entre secciones**: `mb-6`
- **Entre elementos**: `mb-4`
- **Dentro de elementos**: `mb-2`

## 🎨 Sistema de Colores (Sobrio)

### Paleta Principal
| Color | Uso | Código |
|-------|-----|--------|
| **Blue-600** | Botones primarios, links activos | `#2563eb` |
| **Gray-900** | Títulos principales | `#111827` |
| **Gray-600** | Subtítulos, descripciones | `#4b5563` |
| **Gray-300** | Bordes de inputs | `#d1d5db` |
| **Gray-200** | Bordes sutiles | `#e5e7eb` |
| **Gray-50** | Fondos de sección | `#f9fafb` |
| **White** | Fondo principal, cards | `#ffffff` |

### Colores de Acción
- **Primario**: `blue-600` (botones, links)
- **Secundario**: `gray-700` (botones secundarios)
- **Hover Primario**: `blue-700`
- **Hover Secundario**: `gray-50`

### Colores Semánticos
- **Success**: `green-600`
- **Warning**: `yellow-500`
- **Error**: `red-600`
- **Info**: `blue-500`

### Headers de Tabla/Sección
Para diferenciar secciones dentro de las páginas, usar gradientes sutiles:
- **Principal**: `from-blue-700 to-blue-800`
- **Secundario**: `from-teal-600 to-teal-700`
- **Neutro**: `from-gray-700 to-gray-800`

## 📱 Responsividad

### Breakpoints
- **Mobile**: < 640px (sm)
- **Tablet**: 640px - 1024px (md, lg)
- **Desktop**: > 1024px (lg, xl)

### Headers Responsivos
```html
<!-- Título -->
<h1 class="text-2xl lg:text-3xl ...">

<!-- Descripción -->
<p class="text-base ...">

<!-- Padding -->
<div class="px-4 sm:px-6 py-4 sm:py-6">
```

## 🧩 Componentes Reutilizables

### Header de Página (Partial)
```ejs
<%- include('partials/page-header', {
  title: 'Título',
  subtitle: 'Descripción',
  icon: '<svg>...</svg>',
  color: 'blue'
}) %>
```

### Header de Sección (Partial)
```ejs
<%- include('partials/section-header', {
  title: 'Sección',
  subtitle: 'Descripción opcional',
  color: 'blue'
}) %>
```

## ✨ Mejores Prácticas

1. **Consistencia**: Usa siempre los mismos tamaños y colores para elementos similares
2. **Jerarquía**: Mantén una clara jerarquía visual (H1 > H2 > H3)
3. **Espaciado**: Usa el espaciado consistente entre elementos
4. **Colores**: Usa los colores asignados por módulo para mantener identidad
5. **Responsividad**: Siempre incluye clases responsive (sm:, lg:)
6. **Accesibilidad**: Mantén contraste adecuado (blanco sobre gradientes oscuros)

## 🔧 Mantenimiento

- **Actualizar**: Si necesitas agregar un nuevo módulo, documenta su color aquí
- **Revisar**: Revisa periódicamente que todas las vistas sigan estos estándares
- **Refactor**: Si encuentras inconsistencias, actualiza usando estos patrones
