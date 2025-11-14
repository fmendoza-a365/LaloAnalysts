# 🤖 CLAUDE.md - AI Assistant Guide

> **Purpose**: This document provides AI assistants (like Claude) with essential context, conventions, and workflows for working effectively on the A365 Analytics codebase.

**Last Updated**: 2025-11-14
**Project Version**: 1.0.0

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack & Dependencies](#-tech-stack--dependencies)
3. [Codebase Structure](#-codebase-structure)
4. [Architecture Patterns](#-architecture-patterns)
5. [Development Workflows](#-development-workflows)
6. [Key Conventions](#-key-conventions)
7. [Database & Models](#-database--models)
8. [Frontend Guidelines](#-frontend-guidelines)
9. [API & Routes](#-api--routes)
10. [Testing Strategy](#-testing-strategy)
11. [Common Tasks](#-common-tasks)
12. [Critical Do's and Don'ts](#-critical-dos-and-donts)
13. [Troubleshooting](#-troubleshooting)

---

## 🎯 Project Overview

### What is A365 Analytics?

A365 Analytics is a **full-stack multi-tenant contact center management and analytics platform** designed for managing multiple client campaigns, tracking advisor performance, and visualizing KPIs in real-time.

**Key Characteristics:**
- **Multi-tenant architecture**: Campaign-based data isolation
- **Role-based access control**: 4 roles with granular permissions
- **Server-side rendering**: EJS templates (not SPA)
- **Enterprise-scale**: Handles multiple campaigns with isolated data
- **Analytics-focused**: Heavy use of data aggregation and visualization

### Project Type
- **Business Domain**: Contact Center Operations & Analytics
- **Application Type**: Internal enterprise web application
- **User Base**: Admins, analysts, supervisors, advisors (asesores)
- **Language**: Spanish (UI, variables, documentation)

### Current State
- **Status**: Production-ready, actively maintained
- **Docker Support**: ✅ Full Docker Compose setup
- **Testing**: ⚠️ Manual testing only (no automated tests yet)
- **Documentation**: ✅ Comprehensive documentation in `/docs` and root `*.md` files

---

## 🛠️ Tech Stack & Dependencies

### Backend
- **Runtime**: Node.js 16+
- **Framework**: Express.js 4.18.2
- **Database**: MongoDB 4.4+ with Mongoose 7.0.3 ODM
- **Authentication**: Passport.js (Local Strategy) + bcryptjs
- **Session Management**: express-session + connect-mongo (14-day TTL)
- **File Processing**: multer, xlsx, exceljs, csv-parse
- **Validation**: Joi 17.x

### Frontend
- **Template Engine**: EJS 3.1.8 with express-ejs-layouts
- **CSS Framework**: Tailwind CSS 3.2.4
- **JavaScript**: Vanilla JS (no React/Vue/Angular)
- **Charts**: Chart.js 4.x
- **Build Tool**: Tailwind CLI (no Webpack/Vite)

### Development Tools
- **Process Manager**: nodemon (development)
- **Logging**: morgan
- **Containerization**: Docker + Docker Compose

### Key Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.0.3",
  "passport": "^0.6.0",
  "ejs": "^3.1.8",
  "tailwindcss": "^3.2.4",
  "bcryptjs": "^2.4.3",
  "express-session": "^1.17.3",
  "connect-mongo": "^5.0.0"
}
```

---

## 📁 Codebase Structure

### High-Level Organization

```
/home/user/LaloAnalysts/
├── app.js                      # 🚀 Main entry point (324 lines)
├── package.json                # Dependencies & scripts
├── tailwind.config.js          # Tailwind configuration
├── docker-compose.yml          # Docker orchestration
├── Dockerfile                  # Multi-stage build
│
├── config/                     # Configuration files
│   └── config.js              # Environment-based config
│
├── middleware/                 # Express middleware (3 files)
│   ├── auth.js                # Authentication & RBAC
│   ├── campaign.js            # Campaign verification
│   └── tenant.js              # Multi-tenant detection
│
├── models/                     # Mongoose schemas (18 models)
│   ├── User.js                # User authentication
│   ├── Role.js                # RBAC roles
│   ├── Campaign.js            # Campaign/tenant model
│   ├── Asesor.js              # Advisor model
│   ├── CustomDashboard.js     # Dashboard builder configs
│   ├── tenantModels.js        # Multi-tenant model registry
│   └── [Dataset/Record models]
│
├── routes/                     # API routes (13 files, 5461+ lines)
│   ├── auth.js                # Login/logout
│   ├── campaigns.js           # Campaign management
│   ├── dashboard.js           # Main dashboard (903 lines)
│   ├── customDashboard.js     # Custom dashboards (1347 lines)
│   ├── admin.js               # Admin panel (1051 lines)
│   ├── asesores.js            # Advisor management
│   ├── provision.js           # Provision analytics
│   ├── srr.js                 # Service Results Report (865 lines)
│   └── [Other specialized routes]
│
├── controllers/                # Business logic controllers
│   └── indicadoresController.js
│
├── services/                   # Business services
│   └── indicadoresService.js  # KPI calculations
│
├── utils/                      # Utility functions
│   ├── helpers.js             # Global helpers
│   ├── tenantModelFactory.js  # Multi-tenant model factory
│   ├── reportBuilders.js      # Report generation
│   └── [formatters, parsers]
│
├── views/                      # EJS templates (50 files)
│   ├── layouts/main.ejs       # Main layout wrapper
│   ├── partials/              # Reusable components
│   ├── auth/                  # Login/register pages
│   ├── campaigns/             # Campaign selection
│   ├── dashboard/             # Dashboard views
│   ├── customDashboard/       # Custom dashboard editor
│   ├── admin/                 # Admin panel views
│   └── [Other view directories]
│
├── public/                     # Static assets
│   ├── css/
│   │   ├── input.css          # Tailwind input
│   │   └── styles.css         # Compiled output
│   ├── js/
│   │   ├── main.js            # Main client-side JS
│   │   └── components/        # UI components
│   ├── images/                # Campaign images, logos
│   └── ejemplos/              # Example Excel files
│
├── constants/                  # Application constants
│   ├── campaignMappings.js
│   ├── csvColumns.js
│   └── dashboardConstants.js
│
├── uploads/                    # File upload storage
│   ├── provision/
│   ├── genesys/
│   ├── asistencia/
│   ├── nomina/
│   └── srr/
│
└── Documentation (*.md files)
    ├── README.md              # Main documentation
    ├── CLAUDE.md              # This file
    ├── DOCKER.md              # Docker deployment
    ├── CAMPAÑAS.md            # Campaign system
    ├── DESIGN_STANDARDS.md    # UI/UX standards
    └── UPDATE_HEADERS.md      # Header update guide
```

### Project Statistics
- **Total JavaScript Files**: 67
- **Total EJS Templates**: 50
- **Total Routes Files**: 13 (5,461+ lines)
- **Total Models**: 18
- **Project Size**: 413 MB

### Key Files to Know

| File | Lines | Purpose |
|------|-------|---------|
| `app.js` | 324 | Main application entry, Express setup, MongoDB connection, seeding |
| `routes/customDashboard.js` | 1347 | Most complex route - custom dashboard builder (Power BI-like) |
| `routes/admin.js` | 1051 | Admin panel - user/role/campaign management |
| `routes/dashboard.js` | 903 | Main analytics dashboard with KPI calculations |
| `routes/srr.js` | 865 | Service Results Report with complex aggregations |
| `middleware/tenant.js` | - | Multi-tenant detection and model factory integration |
| `utils/tenantModelFactory.js` | - | Dynamic model creation per tenant |

---

## 🏗️ Architecture Patterns

### 1. Multi-Tenant Architecture (Campaign-Based)

**Pattern**: Discriminator pattern with collection-level isolation

**How It Works:**
```javascript
// Step 1: Tenant detection (middleware/tenant.js)
app.use(detectTenant);  // Sets req.tenantId from session/params

// Step 2: Model retrieval with tenant isolation
const { getTenantModel } = require('./utils/tenantModelFactory');
const ProvisionRecord = getTenantModel('ProvisionRecord', campaignId);

// Step 3: Data operations are automatically isolated
const records = await ProvisionRecord.find({ fecha: '2024-01-01' });
// Queries only tenant_<campaignId>_provisionrecords collection
```

**Collection Naming Convention:**
- **Global collections**: `users`, `roles`, `campaigns` (shared across all tenants)
- **Tenant collections**: `tenant_<campaignId>_<modelName>s` (isolated per campaign)

**Example:**
- Campaign ID: `670d123456789abc12345678`
- Provision records: `tenant_670d123456789abc12345678_provisionrecords`
- Nomina records: `tenant_670d123456789abc12345678_nominarecords`

**Critical Files:**
- `middleware/tenant.js:1` - Tenant detection middleware
- `utils/tenantModelFactory.js:1` - Model factory implementation
- `models/tenantModels.js:1` - Registry of tenant-aware models

### 2. MVC Pattern

**Model-View-Controller** separation:
- **Models** (`/models`): Mongoose schemas and data logic
- **Views** (`/views`): EJS templates for rendering
- **Controllers** (`/routes` + `/controllers`): Request handling and business logic

**Flow:**
```
Request → Route Handler → Business Logic → Model Query → Response/Render
```

### 3. Role-Based Access Control (RBAC)

**4 Predefined Roles:**
1. **admin** - Full system access, manages users/roles/campaigns
2. **analista** - Analytics access, can view all dashboards
3. **supervisor** - Team oversight, limited to assigned campaigns
4. **asesor** - Basic access, own data only

**Permission Structure:**
```javascript
// Role model stores permissions as:
permisos: {
  dashboards: { ver: true, crear: false, editar: true, eliminar: false },
  usuarios: { ver: false, crear: false, editar: false, eliminar: false },
  reportes: { ver: true, exportar: true }
}
```

**Usage in Routes:**
```javascript
const { ensureAuthenticated, checkPermission, checkRole } = require('../middleware/auth');

// Require authentication
router.use(ensureAuthenticated);

// Check specific permission
router.post('/create', checkPermission('dashboards', 'crear'), handler);

// Check role
router.get('/admin', checkRole(['admin']), handler);
```

**Key Files:**
- `middleware/auth.js:1` - Authentication and authorization middleware
- `models/Role.js:1` - Role schema with permissions
- `models/User.js:1` - User schema with role reference

### 4. Repository/Service Pattern

**Separation of Concerns:**
- **Routes**: Handle HTTP requests/responses
- **Services**: Complex business logic and calculations
- **Models**: Data access and validation

**Example:**
```javascript
// routes/dashboard.js
const indicadoresService = require('../services/indicadoresService');

router.get('/kpis', async (req, res) => {
  const kpis = await indicadoresService.calculateKPIs(campaignId, filters);
  res.json(kpis);
});

// services/indicadoresService.js
exports.calculateKPIs = async (campaignId, filters) => {
  // Complex aggregation logic here
};
```

### 5. Middleware Chain Pattern

**Standard Request Flow:**
```
Request
  → morgan (logging)
  → express.json/urlencoded (body parsing)
  → method-override (HTTP verb override)
  → express-session (session management)
  → passport.initialize/session (authentication)
  → flash (flash messages)
  → detectTenant (tenant detection) ← Multi-tenant
  → ensureAuthenticated (auth check) ← Security
  → requireTenant (campaign check) ← Multi-tenant
  → checkPermission (authorization) ← Security
  → Route Handler
  → Response
```

### 6. Server-Side Rendering (SSR)

**NOT a Single Page Application (SPA)**
- All pages rendered server-side with EJS
- Data passed via `res.render()`
- Minimal client-side JavaScript
- Full page reloads on navigation (no client-side routing)

**Example:**
```javascript
// Server-side rendering
res.render('dashboard/index', {
  title: 'Dashboard',
  campaign: campaignData,
  kpis: calculatedKPIs,
  user: req.user
});
```

---

## 💻 Development Workflows

### Initial Setup

```bash
# 1. Clone repository
git clone <repository-url>
cd LaloAnalysts

# 2. Install dependencies
npm install

# 3. Setup environment
cp .env.example .env
# Edit .env with your configuration

# 4. Build CSS (important!)
npm run build:css

# 5. Start MongoDB (if not using Docker)
mongod --dbpath /path/to/data

# 6. Start development server
npm run dev  # Uses nodemon for auto-reload

# 7. Access application
# http://localhost:3000
```

### Docker Setup (Recommended)

```bash
# 1. Setup environment
cp .env.docker.example .env.docker

# 2. Start services
docker-compose --env-file .env.docker up -d

# 3. View logs
docker-compose logs -f app

# 4. Stop services
docker-compose down
```

### Development Commands

```bash
# Development with auto-reload
npm run dev

# Production start
npm start

# Build Tailwind CSS (one-time)
npm run build:css

# Watch Tailwind CSS (auto-rebuild)
npm run watch:css
```

### Working with the Codebase

#### Adding a New Route

```javascript
// 1. Create route file: routes/myNewFeature.js
const express = require('express');
const router = express.Router();
const { ensureAuthenticated, requireTenant } = require('../middleware/auth');

// Apply middleware
router.use(ensureAuthenticated);
router.use(requireTenant);

router.get('/', async (req, res) => {
  const campaignId = req.tenantId;
  const campaign = req.tenant;

  res.render('myNewFeature/index', {
    title: 'My Feature',
    campaign,
    user: req.user
  });
});

module.exports = router;

// 2. Register in app.js
const myNewFeatureRouter = require('./routes/myNewFeature');
app.use('/my-feature', myNewFeatureRouter);
```

#### Adding a New Model

**For Global Models (shared across all campaigns):**
```javascript
// models/MyModel.js
const mongoose = require('mongoose');

const myModelSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  descripcion: String,
  activo: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('MyModel', myModelSchema);
```

**For Tenant-Specific Models (isolated per campaign):**
```javascript
// 1. Create schema: models/MyTenantRecord.js
const mongoose = require('mongoose');

const myTenantRecordSchema = new mongoose.Schema({
  datasetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  fecha: { type: Date, required: true },
  valor: Number
}, { timestamps: true });

// Add indexes
myTenantRecordSchema.index({ datasetId: 1, fecha: 1 });

module.exports = myTenantRecordSchema;

// 2. Register in models/tenantModels.js
const tenantModels = {
  ProvisionRecord: require('./ProvisionRecord'),
  MyTenantRecord: require('./MyTenantRecord'),  // Add this
  // ... other models
};

// 3. Use in routes
const { getTenantModel } = require('../utils/tenantModelFactory');
const MyTenantRecord = getTenantModel('MyTenantRecord', campaignId);
```

#### Adding a New View

```ejs
<!-- views/myFeature/index.ejs -->
<!-- Page Header (SOBRIO style - required!) -->
<div class="bg-white border-b border-gray-200 mb-6">
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-5">
    <div class="flex-1">
      <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
        My Feature
      </h1>
      <p class="text-sm text-gray-600">Feature description</p>
    </div>
  </div>
</div>

<!-- Content -->
<div class="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
  <div class="bg-white shadow-lg rounded-lg overflow-hidden">
    <!-- Section Header -->
    <div class="bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-4">
      <h2 class="text-lg lg:text-xl font-bold text-white">Section Title</h2>
    </div>

    <!-- Content -->
    <div class="p-6">
      <!-- Your content here -->
    </div>
  </div>
</div>
```

### Git Workflow

**Branch Naming:**
- Feature branches: `claude/claude-md-<session-id>`
- Always develop on the designated branch
- Never push to `main` or `master` without permission

**Commit Workflow:**
```bash
# 1. Stage changes
git add .

# 2. Commit with descriptive message
git commit -m "feat: Add custom dashboard widget support

- Implement widget configuration UI
- Add backend API for widget data queries
- Update database schema for widget storage"

# 3. Push to remote (with retry logic)
git push -u origin <branch-name>
```

**Commit Message Format:**
```
<type>: <short description>

<optional longer description>

<optional bullet points>
- Point 1
- Point 2
```

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting)
- `refactor:` - Code refactoring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

---

## 📝 Key Conventions

### Naming Conventions

#### Variables & Functions
```javascript
// Use Spanish for domain-specific terms
const asesores = await Asesor.find({ campaignId });
const nombreCompleto = `${asesor.nombres} ${asesor.apellidos}`;

// Use camelCase
const campaignId = req.session.selectedCampaign;
const provisionData = await fetchProvisionData();

// Boolean variables start with "is", "has", "can"
const isAdmin = req.user.role.nombre === 'admin';
const hasPermission = checkUserPermission(user, 'dashboards', 'ver');
```

#### Models & Schemas
```javascript
// PascalCase for model names
const User = require('./models/User');
const ProvisionRecord = require('./models/ProvisionRecord');

// Spanish for collection names
// Mongoose automatically pluralizes: Campaign → campaigns
```

#### Routes & Endpoints
```javascript
// Use kebab-case for URLs
app.use('/custom-dashboard', customDashboardRouter);
router.get('/provision-data', handler);

// Use descriptive, RESTful naming
GET    /campaigns           // List all
GET    /campaigns/:id       // Get one
POST   /campaigns/create    // Create
POST   /campaigns/edit/:id  // Update
POST   /campaigns/delete/:id // Delete
```

#### Files & Directories
```javascript
// camelCase for JavaScript files
routes/customDashboard.js
utils/tenantModelFactory.js

// lowercase for directories
views/dashboard/
public/js/components/
```

### Code Style

#### Async/Await (Preferred)
```javascript
// ✅ Good - Use async/await
router.get('/data', async (req, res) => {
  try {
    const data = await Model.find({});
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error fetching data' });
  }
});

// ❌ Avoid - Promise chains
router.get('/data', (req, res) => {
  Model.find({})
    .then(data => res.json(data))
    .catch(error => res.status(500).json({ error }));
});
```

#### Error Handling
```javascript
// ✅ Good - Comprehensive error handling
try {
  const result = await someOperation();
  req.flash('success_msg', 'Operation successful');
  res.redirect('/target');
} catch (error) {
  console.error('Error in operation:', error);
  req.flash('error_msg', 'Operation failed: ' + error.message);
  res.redirect('/previous');
}

// ❌ Bad - Unhandled errors
const result = await someOperation(); // Will crash server on error
```

#### Flash Messages
```javascript
// Always use flash messages for user feedback
req.flash('success_msg', 'Campaña creada exitosamente');
req.flash('error_msg', 'Error al crear la campaña');
req.flash('info_msg', 'No se encontraron registros');
req.flash('warning_msg', 'Esta acción no se puede deshacer');

// Then redirect
res.redirect('/target');
```

### Design Standards (SOBRIO Style)

See `DESIGN_STANDARDS.md` for complete guide. Key points:

#### Page Headers (Mandatory)
```html
<!-- ALL pages must use this exact structure -->
<div class="bg-white border-b border-gray-200 mb-6">
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-5">
    <div class="flex-1">
      <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
        Page Title
      </h1>
      <p class="text-sm text-gray-600">Page description</p>
    </div>
  </div>
</div>
```

**Characteristics:**
- ✅ White background (no gradients on page headers)
- ✅ Subtle gray border
- ✅ Gray text (not colored)
- ✅ Professional, minimalist design

#### Section Headers
```html
<div class="bg-gradient-to-r from-blue-700 to-blue-800 px-6 py-4">
  <h2 class="text-lg lg:text-xl font-bold text-white">Section Title</h2>
</div>
```

#### Color Palette (Sobrio)
- **Primary**: `blue-600` (#2563eb)
- **Text Titles**: `gray-900` (#111827)
- **Text Body**: `gray-600` (#4b5563)
- **Borders**: `gray-200`, `gray-300`
- **Background**: `white`, `gray-50`

#### Typography Scale
- **H1**: `text-2xl lg:text-3xl` (page titles)
- **H2**: `text-lg lg:text-xl` (section titles)
- **Body**: `text-sm` (14px)
- **Small**: `text-xs` (12px, tables)

---

## 🗄️ Database & Models

### MongoDB Structure

**Database Name**: `a365-analytics` (or from `MONGODB_URI`)

**Collections:**

#### Global Collections (Shared)
- `users` - User accounts with authentication
- `roles` - RBAC role definitions
- `campaigns` - Campaign/tenant definitions
- `asesores` - Advisor master data
- `customdashboards` - Custom dashboard configurations

#### Tenant-Specific Collections (Isolated per Campaign)
Format: `tenant_<campaignId>_<modelName>s`

- `tenant_XXX_provisiondatasets` - Provision data containers
- `tenant_XXX_provisionrecords` - Provision metrics by queue/date
- `tenant_XXX_nominadatasets` - Payroll data containers
- `tenant_XXX_nominarecords` - Employee payroll records
- `tenant_XXX_asistenciadatasets` - Attendance containers
- `tenant_XXX_asistenciarecords` - Daily attendance records
- `tenant_XXX_genesysdatasets` - Call center data containers
- `tenant_XXX_genesysrecords` - Call metrics
- `tenant_XXX_srrdatasets` - Service results containers
- `tenant_XXX_srrrecords` - Service quality metrics
- `tenant_XXX_tarifas` - Pricing/rates

### Model Patterns

#### Standard Schema Pattern
```javascript
const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
  // Fields
  nombre: { type: String, required: true },
  descripcion: String,
  activo: { type: Boolean, default: true },

  // References
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  }
}, {
  timestamps: true  // Adds createdAt, updatedAt
});

// Indexes
modelSchema.index({ campaignId: 1, nombre: 1 });

module.exports = mongoose.model('Model', modelSchema);
```

#### Tenant Model Pattern
```javascript
// Schema definition (no direct model export)
const tenantRecordSchema = new mongoose.Schema({
  datasetId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    index: true
  },
  fecha: { type: Date, required: true, index: true },
  // ... other fields
}, { timestamps: true });

// Strategic indexes
tenantRecordSchema.index({ datasetId: 1, fecha: 1 });
tenantRecordSchema.index({ datasetId: 1, cola: 1 });

// Export schema (not model)
module.exports = tenantRecordSchema;

// Register in tenantModels.js
// Use via getTenantModel() in routes
```

### Common Queries

#### Query with Tenant Isolation
```javascript
const { getTenantModel } = require('../utils/tenantModelFactory');

router.get('/data', async (req, res) => {
  const campaignId = req.tenantId;  // From middleware

  // Get tenant-specific model
  const ProvisionRecord = getTenantModel('ProvisionRecord', campaignId);

  // Query (automatically isolated to tenant collection)
  const records = await ProvisionRecord.find({ fecha: '2024-01-01' })
    .populate('datasetId')
    .sort({ fecha: -1 })
    .limit(100);

  res.json(records);
});
```

#### Aggregation Pipeline
```javascript
const pipeline = [
  { $match: { campaignId: mongoose.Types.ObjectId(campaignId) } },
  { $group: {
    _id: '$mesa',
    totalLlamadas: { $sum: '$llamadas' },
    promedioTiempo: { $avg: '$tiempoPromedio' }
  }},
  { $sort: { totalLlamadas: -1 } },
  { $limit: 10 }
];

const results = await Model.aggregate(pipeline);
```

### Seeding

**Default Seeds** (run on first start):
```javascript
// app.js lines 260-300
seedDefaultRoles();    // Creates 4 roles: admin, analista, supervisor, asesor
seedDemoUsers();       // Creates demo users for each role
// seedDemoCampaigns(); // Disabled (campaigns created via UI)
```

**Demo Users** (if `SEED_DEMO=true`):
- `admin_demo` / `demo12345`
- `analista_demo` / `demo12345`
- `supervisor_demo` / `demo12345`
- `asesor_demo` / `demo12345`

---

## 🎨 Frontend Guidelines

### EJS Template System

#### Layout Structure
```ejs
<!-- views/layouts/main.ejs -->
<!DOCTYPE html>
<html>
<head>
  <title><%= title %> - A365 Analytics</title>
  <link rel="stylesheet" href="/css/styles.css">
</head>
<body>
  <%- include('../partials/header') %>
  <%- include('../partials/sidebar') %>

  <main>
    <%- body %> <!-- Page content injected here -->
  </main>

  <%- include('../partials/footer') %>
  <script src="/js/main.js"></script>
</body>
</html>
```

#### Page Template Pattern
```ejs
<!-- views/myPage/index.ejs -->

<!-- Page Header (Sobrio style) -->
<div class="bg-white border-b border-gray-200 mb-6">
  <div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 px-6 py-5">
    <div class="flex-1">
      <h1 class="text-2xl lg:text-3xl font-bold text-gray-900 mb-1">
        <%= title %>
      </h1>
      <p class="text-sm text-gray-600"><%= subtitle %></p>
    </div>
    <div class="flex gap-2">
      <button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700">
        Action
      </button>
    </div>
  </div>
</div>

<!-- Content Container -->
<div class="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">
  <!-- Your content -->
</div>
```

#### Partials Usage
```ejs
<!-- Include partial with data -->
<%- include('partials/card', {
  title: 'Card Title',
  content: 'Card content here',
  color: 'blue'
}) %>
```

### Tailwind CSS

#### Compilation
```bash
# Build CSS (production)
npm run build:css

# Watch mode (development)
npm run watch:css
```

**Input**: `/public/css/input.css`
**Output**: `/public/css/styles.css`

#### Custom Configuration
```javascript
// tailwind.config.js
module.exports = {
  content: [
    "./views/**/*.ejs",
    "./public/js/**/*.js"
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors if needed
      }
    }
  }
}
```

#### Common Patterns
```html
<!-- Responsive Container -->
<div class="max-w-full mx-auto px-4 sm:px-6 py-4 sm:py-6">

<!-- Card -->
<div class="bg-white shadow-lg rounded-lg overflow-hidden">

<!-- Button Primary -->
<button class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm font-medium transition">

<!-- Button Secondary -->
<button class="border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md text-sm font-medium transition">

<!-- Input -->
<input class="border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">

<!-- Select -->
<select class="border border-gray-300 bg-white text-gray-900 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
```

### Chart.js

#### Chart Creation Pattern
```javascript
// In EJS template or separate JS file
const ctx = document.getElementById('myChart').getContext('2d');
const myChart = new Chart(ctx, {
  type: 'line', // bar, pie, doughnut, etc.
  data: {
    labels: <%= JSON.stringify(labels) %>,
    datasets: [{
      label: 'Dataset',
      data: <%= JSON.stringify(data) %>,
      backgroundColor: 'rgba(37, 99, 235, 0.5)',
      borderColor: 'rgba(37, 99, 235, 1)',
      borderWidth: 2
    }]
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom'
      }
    }
  }
});
```

#### Color Scheme
```javascript
// Standard chart colors (blue theme)
const colors = {
  primary: 'rgba(37, 99, 235, 1)',    // blue-600
  primaryLight: 'rgba(37, 99, 235, 0.5)',
  secondary: 'rgba(75, 85, 99, 1)',   // gray-600
  success: 'rgba(34, 197, 94, 1)',    // green-500
  warning: 'rgba(234, 179, 8, 1)',    // yellow-500
  error: 'rgba(239, 68, 68, 1)'       // red-500
};
```

### Client-Side JavaScript

**Location**: `/public/js/main.js`

**Common Patterns:**
```javascript
// Flash message auto-dismiss
document.addEventListener('DOMContentLoaded', () => {
  const alerts = document.querySelectorAll('.alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      alert.style.display = 'none';
    }, 5000);
  });
});

// Mobile menu toggle
const menuToggle = document.getElementById('mobile-menu-toggle');
const sidebar = document.getElementById('sidebar');

menuToggle?.addEventListener('click', () => {
  sidebar.classList.toggle('hidden');
});

// Form validation
const form = document.querySelector('form');
form?.addEventListener('submit', (e) => {
  // Validation logic
  if (!isValid) {
    e.preventDefault();
    alert('Please fill all required fields');
  }
});
```

---

## 🚀 API & Routes

### Route Organization

#### Standard Route Structure
```javascript
const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkPermission, requireTenant } = require('../middleware/auth');

// Apply authentication globally
router.use(ensureAuthenticated);

// Apply tenant requirement for campaign-specific routes
router.use(requireTenant);

// Routes
router.get('/', async (req, res) => {
  // List/index
});

router.get('/:id', async (req, res) => {
  // Show single
});

router.post('/create', checkPermission('module', 'crear'), async (req, res) => {
  // Create
});

router.post('/edit/:id', checkPermission('module', 'editar'), async (req, res) => {
  // Update
});

router.post('/delete/:id', checkPermission('module', 'eliminar'), async (req, res) => {
  // Delete
});

module.exports = router;
```

### Response Patterns

#### HTML Response (Render)
```javascript
res.render('view-path', {
  title: 'Page Title',
  campaign: req.tenant,
  data: fetchedData,
  user: req.user,
  // Flash messages automatically available
});
```

#### JSON Response (API)
```javascript
// Success
res.json({
  success: true,
  data: results,
  message: 'Operation completed'
});

// Error
res.status(400).json({
  success: false,
  message: 'Error description',
  error: error.message
});
```

#### Redirect with Flash
```javascript
req.flash('success_msg', 'Operation successful');
res.redirect('/target-path');
```

### Middleware Usage

#### Authentication
```javascript
// Require login
router.use(ensureAuthenticated);

// Check specific role
router.get('/admin', checkRole(['admin']), handler);

// Check permission
router.post('/create', checkPermission('dashboards', 'crear'), handler);
```

#### Tenant Detection
```javascript
// Require campaign selection
router.use(requireTenant);

// Access tenant data
const campaignId = req.tenantId;      // ObjectId
const campaign = req.tenant;           // Campaign document
```

### File Upload Handling

```javascript
const multer = require('multer');
const path = require('path');

// Configure multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/provision/');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    if (ext !== '.xlsx' && ext !== '.xls') {
      return cb(new Error('Only Excel files allowed'));
    }
    cb(null, true);
  }
});

// Route
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    const filePath = req.file.path;
    // Process file
    req.flash('success_msg', 'File uploaded successfully');
    res.redirect('/dashboard');
  } catch (error) {
    req.flash('error_msg', 'Upload failed');
    res.redirect('/upload');
  }
});
```

---

## 🧪 Testing Strategy

### Current Status

⚠️ **No automated testing infrastructure exists**

**What's Missing:**
- No test files (`*.test.js`, `*.spec.js`)
- No testing framework (Jest, Mocha, Chai)
- No CI/CD pipeline
- No test coverage reporting

### Manual Testing Approach

**Available Tools:**
1. **Demo Users**: `admin_demo`, `analista_demo`, etc.
2. **Example Excel Files**: `/public/ejemplos/`
3. **Verification Scripts**:
   - `verificar-nomina.js`
   - `verificar-mesas.js`
   - `validar-nomina-completo.js`

### Recommended Testing Setup (Future)

```json
// Add to package.json devDependencies
{
  "jest": "^29.x",
  "supertest": "^6.x",
  "mongodb-memory-server": "^9.x" // Already included
}
```

```javascript
// Example test structure
// tests/routes/campaigns.test.js
const request = require('supertest');
const app = require('../app');

describe('Campaign Routes', () => {
  test('GET /campaigns requires authentication', async () => {
    const response = await request(app).get('/campaigns');
    expect(response.status).toBe(302); // Redirect to login
  });

  test('POST /campaigns/create with admin role', async () => {
    const agent = request.agent(app);
    await agent.post('/auth/login').send({ username: 'admin_demo', password: 'demo12345' });

    const response = await agent.post('/campaigns/create').send({
      nombre: 'Test Campaign',
      descripcion: 'Test description'
    });

    expect(response.status).toBe(302);
  });
});
```

### Testing Guidelines for AI Assistants

When making changes:
1. **Manual verification**: Test the feature in browser
2. **Check authentication**: Verify login/logout works
3. **Check permissions**: Test with different user roles
4. **Check tenant isolation**: Verify data doesn't leak between campaigns
5. **Check error handling**: Try invalid inputs
6. **Check responsive design**: Test on mobile viewport

---

## 🎯 Common Tasks

### Task 1: Add a New Dashboard View

```javascript
// 1. Create route (routes/myDashboard.js)
const express = require('express');
const router = express.Router();
const { ensureAuthenticated, requireTenant } = require('../middleware/auth');

router.use(ensureAuthenticated);
router.use(requireTenant);

router.get('/', async (req, res) => {
  const campaignId = req.tenantId;
  // Fetch data
  res.render('myDashboard/index', {
    title: 'My Dashboard',
    campaign: req.tenant,
    user: req.user
  });
});

module.exports = router;

// 2. Register in app.js
app.use('/my-dashboard', require('./routes/myDashboard'));

// 3. Create view (views/myDashboard/index.ejs)
// Follow SOBRIO design standards

// 4. Add to sidebar (views/partials/sidebar.ejs)
<a href="/my-dashboard">My Dashboard</a>
```

### Task 2: Add File Upload Feature

```javascript
// 1. Setup multer in route
const multer = require('multer');
const xlsx = require('xlsx');

const upload = multer({ dest: 'uploads/mydata/' });

router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    // Read Excel file
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    // Process data (with tenant isolation)
    const MyModel = getTenantModel('MyModel', req.tenantId);
    await MyModel.insertMany(data);

    req.flash('success_msg', 'Data uploaded successfully');
    res.redirect('/dashboard');
  } catch (error) {
    req.flash('error_msg', 'Upload failed: ' + error.message);
    res.redirect('/upload');
  }
});
```

### Task 3: Add Custom Permission

```javascript
// 1. Update Role model permissions structure
// Example: Add 'exportar' permission to 'reportes' module

// 2. Update role seeds in app.js
const analistaPermissions = {
  reportes: {
    ver: true,
    exportar: true,  // Add this
    crear: false
  }
};

// 3. Protect route with permission
router.get('/export',
  checkPermission('reportes', 'exportar'),
  async (req, res) => {
    // Export logic
  }
);
```

### Task 4: Add Chart to Dashboard

```ejs
<!-- In view template -->
<div class="bg-white shadow-lg rounded-lg p-6">
  <h3 class="text-lg font-bold mb-4">Chart Title</h3>
  <div style="height: 300px;">
    <canvas id="myChart"></canvas>
  </div>
</div>

<script>
  const ctx = document.getElementById('myChart').getContext('2d');
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: <%- JSON.stringify(labels) %>,
      datasets: [{
        label: 'Data',
        data: <%- JSON.stringify(values) %>,
        backgroundColor: 'rgba(37, 99, 235, 0.5)',
        borderColor: 'rgba(37, 99, 235, 1)',
        borderWidth: 2
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false
    }
  });
</script>
```

### Task 5: Update Existing Model Schema

```javascript
// Adding a new field to existing model

// 1. Update model schema (models/MyModel.js)
const myModelSchema = new mongoose.Schema({
  // ... existing fields
  newField: {
    type: String,
    default: 'default value'
  }
}, { timestamps: true });

// 2. No migration needed (MongoDB is schemaless)
// Existing documents will have undefined for newField
// New documents will have the default value

// 3. Update forms/views to include new field

// 4. Update validation if needed
```

---

## ⚠️ Critical Do's and Don'ts

### ✅ DO

1. **Always apply tenant middleware** to campaign-specific routes
   ```javascript
   router.use(requireTenant);
   ```

2. **Always use getTenantModel()** for tenant-specific data
   ```javascript
   const Model = getTenantModel('ModelName', campaignId);
   ```

3. **Always check authentication** before accessing protected routes
   ```javascript
   router.use(ensureAuthenticated);
   ```

4. **Always use try-catch** for async operations
   ```javascript
   try {
     await operation();
   } catch (error) {
     console.error(error);
     req.flash('error_msg', 'Error occurred');
   }
   ```

5. **Always provide flash messages** for user feedback
   ```javascript
   req.flash('success_msg', 'Success!');
   ```

6. **Always follow SOBRIO design standards** for UI consistency

7. **Always compile Tailwind CSS** after changing templates
   ```bash
   npm run build:css
   ```

8. **Always test with different user roles** (admin, analista, supervisor, asesor)

9. **Always check campaign selection** before accessing campaign data
   ```javascript
   if (!req.session.selectedCampaign) {
     return res.redirect('/campaigns');
   }
   ```

10. **Always use descriptive commit messages**
    ```bash
    git commit -m "feat: Add dashboard export feature"
    ```

### ❌ DON'T

1. **Never query tenant data without tenant isolation**
   ```javascript
   // ❌ Bad
   const records = await ProvisionRecord.find({});

   // ✅ Good
   const ProvisionRecord = getTenantModel('ProvisionRecord', campaignId);
   const records = await ProvisionRecord.find({});
   ```

2. **Never skip authentication middleware** on protected routes
   ```javascript
   // ❌ Bad - Anyone can access
   router.get('/admin', handler);

   // ✅ Good
   router.get('/admin', ensureAuthenticated, checkRole(['admin']), handler);
   ```

3. **Never use plain passwords** - Always hash with bcrypt
   ```javascript
   // ✅ User model has pre-save hook for hashing
   ```

4. **Never expose sensitive data** in client-side code
   ```javascript
   // ❌ Bad
   res.render('view', { sessionSecret: process.env.SESSION_SECRET });

   // ✅ Good - Keep secrets server-side only
   ```

5. **Never use Promise chains** - Use async/await
   ```javascript
   // ❌ Bad
   Model.find({}).then(data => ...).catch(err => ...);

   // ✅ Good
   try {
     const data = await Model.find({});
   } catch (err) { ... }
   ```

6. **Never create React/Vue/Angular components** - This is server-side rendered

7. **Never push directly to main/master** without permission

8. **Never commit `.env` files** or secrets

9. **Never skip error handling** in async routes

10. **Never use inline styles** in EJS - Use Tailwind classes

11. **Never modify tenant collection names manually** - Use factory

12. **Never skip req.tenantId validation** when using tenant models
    ```javascript
    // ✅ Good
    if (!req.tenantId) {
      return res.status(400).json({ error: 'No campaign selected' });
    }
    ```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: "Cannot find module"
```bash
# Solution: Install dependencies
npm install
```

#### Issue: CSS not updating
```bash
# Solution: Rebuild Tailwind
npm run build:css
# Or use watch mode
npm run watch:css
```

#### Issue: MongoDB connection error
```bash
# Check MongoDB is running
mongod --dbpath /path/to/data

# Or use Docker
docker-compose up -d mongodb
```

#### Issue: Session not persisting
```javascript
// Check SESSION_SECRET is set in .env
SESSION_SECRET=your-secret-here

// Check connect-mongo configuration in app.js
```

#### Issue: "Campaign not selected" error
```javascript
// User must select campaign after login
// Redirect to /campaigns if req.session.selectedCampaign is undefined
```

#### Issue: Tenant data showing wrong campaign
```javascript
// Verify req.tenantId matches expected campaign
console.log('Current tenant:', req.tenantId);
console.log('Selected campaign:', req.session.selectedCampaign);

// Check middleware order in app.js
// detectTenant must run before route handlers
```

#### Issue: Permission denied errors
```javascript
// Check user role and permissions
console.log('User role:', req.user.role);
console.log('Permissions:', req.user.role.permisos);

// Verify permission check in middleware
```

#### Issue: File upload failing
```bash
# Check uploads directory exists and has write permissions
mkdir -p uploads/provision uploads/genesys uploads/asistencia uploads/nomina uploads/srr
chmod 755 uploads/
```

### Debug Tips

```javascript
// Enable verbose logging
const morgan = require('morgan');
app.use(morgan('dev')); // Already enabled in app.js

// Log tenant context
router.use((req, res, next) => {
  console.log('Tenant ID:', req.tenantId);
  console.log('Campaign:', req.tenant?.nombre);
  console.log('User:', req.user?.username);
  next();
});

// Log MongoDB queries
mongoose.set('debug', true);
```

### Health Check

```bash
# Check application health
curl http://localhost:3000/health

# Check MongoDB connection
docker-compose exec mongodb mongosh --eval "db.adminCommand('ping')"

# Check logs
docker-compose logs -f app
```

---

## 📚 Additional Resources

### Documentation Files
- **README.md** - Main project documentation
- **DOCKER.md** - Docker deployment guide
- **CAMPAÑAS.md** - Multi-campaign system details
- **DESIGN_STANDARDS.md** - UI/UX design standards
- **UPDATE_HEADERS.md** - Header update guide

### Key External Documentation
- [Express.js Docs](https://expressjs.com/)
- [Mongoose Docs](https://mongoosejs.com/)
- [Passport.js Docs](http://www.passportjs.org/)
- [EJS Docs](https://ejs.co/)
- [Tailwind CSS Docs](https://tailwindcss.com/)
- [Chart.js Docs](https://www.chartjs.org/)

### MongoDB Compass
- **Connection String**: `mongodb://localhost:27017/a365-analytics`
- **Collections to explore**: `users`, `roles`, `campaigns`, `tenant_*`

---

## 🎓 For AI Assistants: Best Practices

### When Working on This Codebase

1. **Start by understanding context**
   - What campaign is selected?
   - What user role is involved?
   - Is this global or tenant-specific data?

2. **Follow the established patterns**
   - Use existing routes as templates
   - Maintain consistent code style
   - Follow SOBRIO design standards

3. **Always consider multi-tenancy**
   - Will this feature need tenant isolation?
   - Should this use getTenantModel()?
   - How does this affect different campaigns?

4. **Test thoroughly**
   - Test with different user roles
   - Test with multiple campaigns
   - Test error cases

5. **Document your changes**
   - Add clear comments for complex logic
   - Update this file if adding new patterns
   - Write descriptive commit messages

6. **Ask questions when uncertain**
   - Clarify requirements before implementing
   - Verify assumptions about data flow
   - Confirm design decisions

### Code Review Checklist

Before committing:
- [ ] Authentication middleware applied?
- [ ] Tenant isolation working correctly?
- [ ] Error handling comprehensive?
- [ ] Flash messages for user feedback?
- [ ] SOBRIO design standards followed?
- [ ] Tailwind CSS compiled?
- [ ] No sensitive data exposed?
- [ ] Code follows existing patterns?
- [ ] Tested with different roles?
- [ ] Tested with multiple campaigns?

---

**Remember**: This is a production application serving real users. Quality, security, and consistency are paramount. When in doubt, follow existing patterns and ask for clarification.

---

*Generated: 2025-11-14 | For AI Assistant Use*
