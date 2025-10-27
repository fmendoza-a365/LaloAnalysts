# Sistema Multi-Campaña A365

## 📋 Descripción General

El sistema ahora funciona como una **plataforma multi-campaña** para A365 Contact Center. Después del login, los usuarios acceden a una vista de selección de campañas completamente limpia (sin menú, sin navegación), donde pueden elegir la campaña con la que desean trabajar. Solo después de seleccionar una campaña, se muestra toda la aplicación con el dashboard, menús y funcionalidades.

---

## 🔄 Flujo de Usuario

```
Login → Selección de Campaña → Dashboard y Sistema Completo
```

### 1. **Login**
- El usuario inicia sesión con sus credenciales
- Es redirigido automáticamente a `/campaigns`

### 2. **Vista de Selección de Campañas**
- **Pantalla limpia**: Solo muestra el logo "A365 Contact Center" y las campañas disponibles
- **Sin menú lateral ni navegación**: Es una vista aislada
- **Buscador en tiempo real**: Filtrar campañas por nombre
- **Cards de campañas**: Cada una muestra:
  - Imagen distintiva (principal diferenciador visual)
  - Nombre de la campaña
  - Descripción
  - Gerente y analista asignados
  - Número de subcampañas
  - Botones: Acceder, Editar (admin), Eliminar (admin)

### 3. **Selección de Campaña**
- Al hacer clic en **"Acceder"**, la campaña se guarda en la sesión
- El usuario es redirigido al dashboard
- **Ahora sí aparece**: Menú lateral, breadcrumb, todas las funcionalidades

### 4. **Dashboard con Campaña Activa**
- **Breadcrumb superior**: `A365 › Campaña: [Nombre]` con botón "Cambiar Campaña"
- Todo el sistema filtra la información según la campaña seleccionada
- El usuario puede trabajar normalmente con toda la aplicación

### 5. **Cambiar de Campaña**
- Click en "Cambiar Campaña" en el breadcrumb
- Regresa a la vista de selección de campañas
- El sistema se oculta nuevamente hasta seleccionar otra campaña

---

## 🎨 Diseño Visual

### Paleta de Colores
- **Primario**: Azul-Índigo (`from-blue-600 to-indigo-700`)
- **Secundario**: Blanco con sombras
- **Acentos**: 
  - Verde para crear (`green-600`)
  - Gris para editar (`gray-200`)
  - Rojo para eliminar (`red-100`)

### Elementos Distintivos
- **Imagen de campaña**: Principal diferenciador visual en cada card
- **Gradientes**: Fondos con degradados azul-índigo
- **Sombras**: Elevación en hover para cards
- **Responsive**: Diseño adaptable móvil, tablet, desktop

---

## 👥 Roles y Permisos

### Usuario Regular
- ✅ Ver todas las campañas activas
- ✅ Seleccionar y acceder a campañas
- ✅ Usar todas las funcionalidades del dashboard
- ❌ No puede crear, editar o eliminar campañas

### Administrador
- ✅ Todo lo que puede hacer un usuario regular
- ✅ Crear nuevas campañas
- ✅ Editar campañas existentes
- ✅ Eliminar campañas
- ✅ Gestionar subcampañas

---

## 🛠️ Gestión de Campañas (Solo Admin)

### Crear Campaña
1. En la vista de selección, click en **"Nueva Campaña"**
2. Completar el formulario:
   - **Nombre** (requerido)
   - **Descripción**
   - **URL de Imagen** (ej: `/images/campaign-telecom.jpg`)
   - **Gerente**
   - **Analista**
3. Click en "Crear Campaña"

### Editar Campaña
1. Click en el ícono de edición (lápiz) en la card de la campaña
2. Modificar campos:
   - Nombre
   - Descripción
   - Imagen
   - Gerente
   - Analista
   - **Subcampañas**: Agregar, editar, eliminar dinámicamente
3. Click en "Guardar Cambios"

### Eliminar Campaña
1. Click en el ícono de eliminar (papelera) en la card
2. Confirmar eliminación en el modal
3. La campaña se elimina permanentemente
4. Si era la campaña activa, la sesión se limpia

---

## 📸 Sistema de Imágenes

### Agregar Imágenes
1. Guarda tu imagen en: `public/images/`
2. Formatos: JPG, PNG
3. Tamaño recomendado: 800x600px
4. Al crear/editar campaña, usar: `/images/nombre-imagen.jpg`

### Imágenes de Ejemplo
```
/images/campaign-telecom.jpg
/images/campaign-banking.jpg
/images/campaign-ecommerce.jpg
/images/campaign-seguros.jpg
/images/default-campaign.jpg
```

### Imagen por Defecto
Si no se especifica imagen, se usa: `/images/default-campaign.jpg`

**Ver más detalles en**: `public/images/README.md`

---

## 🗂️ Estructura de Datos

### Modelo Campaign
```javascript
{
  nombre: String (requerido),
  descripcion: String,
  imagen: String (default: '/images/default-campaign.jpg'),
  gerente: String,
  analista: String,
  subCampanas: [{
    nombre: String,
    descripcion: String
  }],
  activa: Boolean (default: true),
  fechaCreacion: Date,
  fechaActualizacion: Date
}
```

### Sesión de Usuario
```javascript
req.session.selectedCampaign = {
  id: '...',
  nombre: 'Nombre de la Campaña'
}
```

---

## 🔒 Middleware de Protección

### `requireCampaign`
- Verifica que el usuario haya seleccionado una campaña
- Si no hay campaña en sesión, redirige a `/campaigns`
- Aplicado a rutas protegidas como `/dashboard`

```javascript
router.get('/dashboard', ensureAuthenticated, requireCampaign, async (req, res) => {
  // ...
});
```

---

## 📦 Campañas Demo (Seeds)

Al iniciar la aplicación por primera vez, se crean 3 campañas de ejemplo:

1. **Telecomunicaciones Premium**
   - Soporte Técnico, Retención, Ventas Cruzadas

2. **Banca Digital**
   - Onboarding Digital, Soporte App, Seguridad

3. **E-commerce Retail**
   - Seguimiento de Pedidos, Devoluciones, Reclamos

---

## 🚀 Cómo Usar el Sistema

### Para Usuarios
1. Inicia sesión
2. Selecciona la campaña que trabajarás
3. Usa el dashboard y herramientas normalmente
4. Cambia de campaña cuando necesites

### Para Administradores
1. Todo lo anterior, más:
2. Crear nuevas campañas según clientes de A365
3. Agregar imágenes representativas
4. Configurar gerentes, analistas y subcampañas
5. Editar o eliminar campañas según sea necesario

---

## 📁 Archivos Principales

### Modelos
- `models/Campaign.js` - Esquema de campaña en MongoDB

### Rutas
- `routes/campaigns.js` - CRUD de campañas y selección

### Vistas
- `views/campaigns/select.ejs` - Vista limpia de selección (sin layout)
- `views/campaigns/edit.ejs` - Edición de campaña (con layout)

### Middleware
- `middleware/campaign.js` - Protección de rutas

### Layouts
- `views/layouts/main.ejs` - Breadcrumb de campaña activa

---

## ⚡ Características Clave

- ✅ **Vista limpia inicial**: Sin menú hasta seleccionar campaña
- ✅ **Imágenes distintivas**: Cada campaña tiene su propia identidad visual
- ✅ **Buscador en tiempo real**: Filtrado instantáneo
- ✅ **CRUD completo**: Crear, leer, actualizar, eliminar (admin)
- ✅ **Subcampañas dinámicas**: Agregar/quitar sin recargar
- ✅ **Persistencia en sesión**: La campaña se mantiene entre páginas
- ✅ **Protección de rutas**: No se accede al dashboard sin campaña
- ✅ **Responsive**: Funciona en todos los dispositivos
- ✅ **Paleta consistente**: Colores azul-índigo del sistema

---

## 🎯 Próximos Pasos Recomendados

1. **Agregar imágenes reales** de cada cliente/campaña en `public/images/`
2. **Crear más campañas** según los clientes actuales de A365
3. **Personalizar campos** si se necesitan datos adicionales por campaña
4. **Filtrado por campaña**: Asegurar que todos los dashboards filtren por campaña seleccionada

---

## 📞 Soporte

Para preguntas o problemas con el sistema de campañas, contactar al administrador del sistema.
