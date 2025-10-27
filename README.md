# 📊 Sistema de Gestión A365 Contact Center

<div align="center">

![Node.js](https://img.shields.io/badge/Node.js-16+-green)
![MongoDB](https://img.shields.io/badge/MongoDB-4.4+-brightgreen)
![Express](https://img.shields.io/badge/Express-4.x-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

Plataforma web completa de gestión y análisis para contact centers, con sistema multi-campaña, dashboards ejecutivos, gestión de asesores y reportes en tiempo real.

[Características](#-características-principales) •
[Instalación](#-instalación) •
[Documentación](#-documentación-completa) •
[Arquitectura](#-arquitectura)

</div>

---

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Características Principales](#-características-principales)
- [Requisitos](#-requisitos)
- [Instalación](#-instalación)
- [Configuración](#-configuración)
- [Arquitectura](#-arquitectura)
- [Sistema Multi-Campaña](#-sistema-multi-campaña)
- [Modelos de Datos](#-modelos-de-datos)
- [Rutas y Endpoints](#-rutas-y-endpoints)
- [Dashboards y Reportes](#-dashboards-y-reportes)
- [Sistema de Roles y Permisos](#-sistema-de-roles-y-permisos)
- [Frontend y Vistas](#-frontend-y-vistas)
- [Middleware y Seguridad](#-middleware-y-seguridad)
- [Scripts Disponibles](#-scripts-disponibles)
- [Deployment](#-deployment)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

---

## 🎯 Descripción General

**A365 Contact Center** es una plataforma web empresarial diseñada para gestionar múltiples campañas de contact center, analizar el rendimiento de asesores, visualizar KPIs en tiempo real y administrar operaciones multi-cliente.

### ¿Por qué usar A365?

- 🎯 **Multi-Campaña**: Gestiona múltiples clientes/campañas desde una sola plataforma
- 📊 **Dashboards Ejecutivos**: Visualización de KPIs en tiempo real con Chart.js
- 👥 **Gestión de Asesores**: Control completo del personal por campaña
- 📈 **Análisis Avanzado**: Reportes de Genesys, provisión, asistencia y SRR
- 🔐 **RBAC**: Sistema de roles y permisos granular
- 🎨 **UI Moderna**: Diseño responsive con Tailwind CSS
- 🔄 **Integración Power BI**: Embedding de reportes Power BI
- 📱 **Responsive**: Funciona en desktop, tablet y móvil

---

## ✨ Características Principales

### 🏢 Sistema Multi-Campaña

- Vista de selección de campañas post-login (sin menú)
- Cada campaña con imagen distintiva personalizable
- CRUD completo de campañas (admin)
- Subcampañas ilimitadas por campaña
- Filtrado automático de datos por campaña seleccionada
- Breadcrumb "A365 › Campaña: [nombre]"
- Botón "Cambiar Campaña" en toda la app

### 📊 Dashboards y Reportes

#### Dashboard General
- Top 10 asesores por rendimiento
- Distribución de estados
- Rendimiento por supervisor
- KPIs generales del equipo
- Filtros por año, mes, supervisor, antigüedad

#### Dashboard de KPIs por Mesas
- Tendencias diarias por mesa
- KPIs resumidos (Inbound, Outbound, AUX, Break, Login)
- Distribución horaria de actividades
- Ranking de mesas por productividad

#### Dashboard de Provisión
- Análisis de provisión agregada
- KPIs de asesorías totales y promedio
- Desempeño de asesores
- Gráficos de tendencias

#### Dashboard de Genesys
- Métricas de sistema telefónico Genesys
- Análisis de llamadas y tiempos
- Reportes de actividad por asesor

#### Dashboard de Asistencia
- Control de asistencia de asesores
- Reportes de ausentismo
- Estadísticas de puntualidad

#### Service Results Report (SRR)
- Análisis de resultados de servicio
- Métricas de calidad
- Comparativas por periodo

### 👥 Gestión de Asesores

- CRUD completo de asesores
- Vista tipo tabla con paginación
- Búsqueda en tiempo real
- Campos: nombres, supervisor, antiguedad, estado, etc.
- Importación masiva desde Excel
- Exportación de datos

### 🔐 Sistema de Usuarios y Roles

- **Roles predefinidos**: admin, manager, analyst, user
- Permisos granulares por módulo y acción
- Gestión de usuarios desde panel admin
- Autenticación con Passport.js
- Sesiones persistentes con express-session
- Protección de rutas con middleware

### 📈 Análisis y Visualización

- Gráficos interactivos con Chart.js
- Tablas responsivas y ordenables
- Filtros avanzados por múltiples criterios
- Exportación de reportes
- Visualización en tiempo real

### 🎨 Interfaz de Usuario

- Diseño moderno con Tailwind CSS
- Paleta de colores azul-índigo corporativa
- Componentes reutilizables
- Responsive design (móvil-first)
- Animaciones y transiciones suaves
- Sidebar colapsable
- Modales y notificaciones

---

## 💻 Requisitos

### Software Necesario

- **Node.js**: 16.x o superior
- **MongoDB**: 4.4 o superior
- **npm**: 7.x o superior

### Dependencias Principales

```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.0",
  "passport": "^0.6.0",
  "express-session": "^1.17.3",
  "bcryptjs": "^2.4.3",
  "ejs": "^3.1.9",
  "chart.js": "^4.3.0",
  "tailwindcss": "^3.3.0"
}
```

---

## 🚀 Instalación

### 🐳 Opción 1: Con Docker (Recomendado)

**La forma más rápida y fácil** - Funciona en cualquier servidor o dispositivo:

```bash
# 1. Clonar repositorio
git clone https://github.com/tu-organizacion/a365-contact-center.git
cd a365-contact-center

# 2. Configurar variables de entorno
cp .env.example .env
# Editar el archivo .env con tus credenciales

# 3. Instalar dependencias
npm install

# 4. Iniciar la aplicación
npm start

# Alternativa con Docker (requiere Docker instalado)
# docker-compose up -d
```

🔒 **Nota de Seguridad:**
- Nunca subas archivos `.env` con credenciales reales al repositorio
- Usa contraseñas seguras y únicas para cada entorno
- Revisa el archivo `.gitignore` para asegurarte de que los archivos sensibles no sean rastreados

**📖 Ver guía completa**: [DOCKER.md](DOCKER.md)

---

### 💻 Opción 2: Instalación Manual

### 1. Clonar el Repositorio

```bash
git clone https://github.com/tu-usuario/a365-contact-center.git
cd a365-contact-center
```

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar Variables de Entorno

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales:

```env
# Servidor
PORT=3000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://localhost:27017/a365-db

# Sesión
SESSION_SECRET=tu-secreto-super-seguro-aqui

# Seeds (opcional)
SEED_DEMO=true
```

### 4. Compilar CSS

```bash
npm run build:css
```

### 5. Iniciar Servidor

```bash
# Desarrollo (con nodemon)
npm run dev

# Producción
npm start
```

### 6. Acceder a la Aplicación

```
http://localhost:3000
```

### 7. Usuarios Demo (si SEED_DEMO=true)

```
Admin:    admin_demo    / demo12345
Manager:  manager_demo  / demo12345
Analyst:  analyst_demo  / demo12345
User:     user_demo     / demo12345
```

---

## ⚙️ Configuración

### Variables de Entorno Completas

```env
# Servidor
PORT=3000
NODE_ENV=development
BASE_URL=http://localhost:3000

# Base de Datos
MONGO_URI=mongodb://localhost:27017/a365-db

# Sesión
SESSION_SECRET=cambiar-en-produccion
SESSION_NAME=a365.sid
SESSION_MAX_AGE=86400000

# Seguridad
BCRYPT_ROUNDS=10
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX=100

# Power BI (opcional)
POWERBI_WORKSPACE_ID=
POWERBI_REPORT_ID=
POWERBI_CLIENT_ID=
POWERBI_CLIENT_SECRET=
POWERBI_TENANT_ID=

# Email (opcional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-password

# Seeds
SEED_DEMO=true
```

### Configuración de MongoDB

```bash
# Iniciar MongoDB localmente
mongod --dbpath /ruta/a/tu/db

# Conexión con MongoDB Atlas
Agrega tu URI en el archivo `.env` (no incluir credenciales aquí).

```

---

## 🏗️ Arquitectura

### Stack Tecnológico

```
┌─────────────────────────────────────────┐
│          FRONTEND (Client)              │
│  EJS Templates + Tailwind CSS + Chart.js│
└─────────────────┬───────────────────────┘
                  │
                  │ HTTP/HTTPS
                  │
┌─────────────────▼───────────────────────┐
│         BACKEND (Server)                │
│    Node.js + Express.js + Passport      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │     Routes & Controllers        │   │
│  └───────────┬─────────────────────┘   │
│              │                         │
│  ┌───────────▼─────────────────────┐   │
│  │      Middleware Layer           │   │
│  │  (Auth, Campaign, Validation)   │   │
│  └───────────┬─────────────────────┘   │
│              │                         │
│  ┌───────────▼─────────────────────┐   │
│  │      Business Logic             │   │
│  └───────────┬─────────────────────┘   │
└──────────────┼─────────────────────────┘
               │
               │ Mongoose ODM
               │
┌──────────────▼─────────────────────────┐
│         DATABASE (MongoDB)              │
│  Collections: users, campaigns,         │
│  asesores, datasets, records, etc.      │
└─────────────────────────────────────────┘
```

### Estructura de Directorios

```
a365-contact-center/
│
├── config/                   # Configuración
│   ├── database.js           # Conexión MongoDB
│   ├── passport.js           # Estrategias de autenticación
│   └── powerbi.js            # Configuración Power BI
│
├── middleware/               # Middlewares
│   ├── auth.js              # Autenticación y roles
│   └── campaign.js          # Verificación de campaña
│
├── models/                   # Modelos Mongoose
│   ├── User.js              # Usuario
│   ├── Role.js              # Rol
│   ├── Campaign.js          # Campaña
│   ├── Asesor.js            # Asesor
│   ├── GenesysDataset.js    # Dataset Genesys
│   ├── GenesysRecord.js     # Registro Genesys
│   ├── ProvisionDataset.js  # Dataset Provisión
│   ├── ProvisionRecord.js   # Registro Provisión
│   ├── AsistenciaDataset.js # Dataset Asistencia
│   ├── AsistenciaRecord.js  # Registro Asistencia
│   ├── SRRDataset.js        # Dataset SRR
│   ├── SRRRecord.js         # Registro SRR
│   └── PowerBILink.js       # Link Power BI
│
├── routes/                   # Rutas y controladores
│   ├── auth.js              # Autenticación (login/logout)
│   ├── campaigns.js         # Gestión de campañas
│   ├── dashboard.js         # Dashboard general
│   ├── asesores.js          # Gestión de asesores
│   ├── provision.js         # Dashboard de provisión
│   ├── genesys.js           # Dashboard de Genesys
│   ├── asistencia.js        # Dashboard de asistencia
│   ├── srr.js               # Service Results Report
│   ├── admin.js             # Panel de administración
│   ├── powerbi.js           # Integración Power BI
│   └── indicadores.js       # Indicadores y métricas
│
├── views/                    # Vistas EJS
│   ├── layouts/
│   │   └── main.ejs         # Layout principal
│   ├── campaigns/
│   │   ├── select.ejs       # Selección de campañas (sin layout)
│   │   └── edit.ejs         # Edición de campaña
│   ├── dashboard/
│   │   ├── index.ejs        # Dashboard general
│   │   ├── analytics.ejs    # Analytics avanzados
│   │   ├── admin.ejs        # Panel admin
│   │   └── asesores.ejs     # Vista de asesores
│   ├── provision/
│   │   └── index.ejs        # Dashboard de provisión
│   ├── genesys/
│   │   └── index.ejs        # Dashboard de Genesys
│   ├── asistencia/
│   │   └── index.ejs        # Dashboard de asistencia
│   ├── srr/
│   │   └── index.ejs        # Dashboard SRR
│   ├── auth/
│   │   ├── login.ejs        # Login
│   │   └── register.ejs     # Registro
│   └── partials/
│       ├── header.ejs       # Header
│       ├── sidebar.ejs      # Sidebar
│       └── footer.ejs       # Footer
│
├── public/                   # Archivos estáticos
│   ├── css/
│   │   └── style.css        # CSS compilado
│   ├── js/
│   │   └── main.js          # JavaScript frontend
│   ├── images/              # Imágenes (campañas, etc)
│   │   └── README.md        # Guía de imágenes
│   └── ejemplos/            # Archivos Excel de ejemplo
│
├── app.js                    # Aplicación Express principal
├── server.js                 # Servidor HTTP
├── package.json              # Dependencias npm
├── tailwind.config.js        # Configuración Tailwind
├── .env.example              # Ejemplo de variables de entorno
├── .gitignore               # Archivos ignorados por Git
├── README.md                # Este archivo
└── CAMPAÑAS.md              # Documentación del sistema multi-campaña
```

---

## 🎯 Sistema Multi-Campaña

### Flujo de Usuario

```
1. Login → 2. Selección de Campaña → 3. Dashboard Completo
```

#### 1. Vista de Selección (Post-Login)

- **Pantalla limpia**: Sin menú, solo campañas
- **Cards con imágenes**: Cada campaña identificada visualmente
- **Buscador en tiempo real**: Filtro por nombre
- **Acciones**: Acceder, Editar (admin), Eliminar (admin)

#### 2. Selección de Campaña

- La campaña se guarda en `req.session.selectedCampaign`
- Redirige al dashboard
- Todos los datos se filtran por campaña

#### 3. Dashboard Activo

- **Breadcrumb**: `A365 › Campaña: [nombre]`
- **Botón**: "Cambiar Campaña"
- **Menú lateral**: Visible con todas las opciones
- **Filtrado automático**: Datos por campaña seleccionada

### Gestión de Campañas (Admin)

#### Crear Campaña
```javascript
POST /campaigns/create
{
  nombre: "Mi Campaña",
  descripcion: "Descripción",
  imagen: "/images/campaign-1.jpg",
  gerente: "Nombre Gerente",
  analista: "Nombre Analista"
}
```

#### Editar Campaña
```javascript
POST /campaigns/edit/:id
{
  nombre: "Campaña Actualizada",
  descripcion: "Nueva descripción",
  imagen: "/images/nueva-imagen.jpg",
  subCampanas: [
    { nombre: "Sub 1", descripcion: "Desc 1" },
    { nombre: "Sub 2", descripcion: "Desc 2" }
  ]
}
```

#### Eliminar Campaña
```javascript
POST /campaigns/delete/:id
```

### Middleware de Campaña

```javascript
// middleware/campaign.js
requireCampaign: (req, res, next) => {
  if (!req.session.selectedCampaign) {
    req.flash('error_msg', 'Selecciona una campaña primero');
    return res.redirect('/campaigns');
  }
  next();
}
```

**Ver más**: [CAMPAÑAS.md](CAMPAÑAS.md)

---
