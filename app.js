require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcryptjs');
const path = require('path');
const morgan = require('morgan');
const methodOverride = require('method-override');
const flash = require('connect-flash');
const expressLayouts = require('express-ejs-layouts');
let MongoMemoryServer;
try {
  ({ MongoMemoryServer } = require('mongodb-memory-server'));
} catch (e) {
  // optional dependency for dev without MongoDB
}

// Crea roles base con permisos por módulo si no existen
async function seedDefaultRoles() {
  try {
    const baseRoles = [
      {
        nombre: 'admin',
        descripcion: 'Administrador con acceso completo',
        activo: true,
        permisos: {
          dashbords: { ver_listado: true, ver_detalle: true, crear: true, editar: true, eliminar: true, activar_desactivar: true, editar_roles: true, ver_todos: true, ver_inactivos: true },
          usuarios: { ver_listado: true, crear: true, cambiar_rol: true, reset_password: true },
          finanzas_tarifas: { ver: true, crear: true, editar: true, eliminar: true },
          finanzas_volumenes: { cargar: true, previsualizar: true, validar: true, rollback: true }
        }
      },
      {
        nombre: 'analista',
        descripcion: 'Analista con acceso amplio de lectura y operación',
        activo: true,
        permisos: {
          dashbords: { ver_listado: true, ver_detalle: true, crear: false, editar: true, eliminar: false, activar_desactivar: true, editar_roles: true, ver_todos: true, ver_inactivos: true },
          usuarios: { ver_listado: true, crear: false, cambiar_rol: false, reset_password: false },
          finanzas_tarifas: { ver: true, crear: true, editar: true, eliminar: false },
          finanzas_volumenes: { cargar: true, previsualizar: true, validar: true, rollback: false }
        }
      },
      {
        nombre: 'supervisor',
        descripcion: 'Supervisor con foco en operación',
        activo: true,
        permisos: {
          dashbords: { ver_listado: true, ver_detalle: true, crear: false, editar: false, eliminar: false, activar_desactivar: false, editar_roles: false, ver_todos: false, ver_inactivos: false },
          usuarios: { ver_listado: true, crear: false, cambiar_rol: false, reset_password: false },
          finanzas_tarifas: { ver: true, crear: false, editar: false, eliminar: false },
          finanzas_volumenes: { cargar: false, previsualizar: true, validar: false, rollback: false }
        }
      },
      {
        nombre: 'asesor',
        descripcion: 'Asesor/ejecutivo con acceso limitado',
        activo: true,
        permisos: {
          dashbords: { ver_listado: true, ver_detalle: true },
          usuarios: { ver_listado: false },
          finanzas_tarifas: { ver: false },
          finanzas_volumenes: { previsualizar: false }
        }
      }
    ];

    for (const r of baseRoles) {
      const exists = await RoleModel.findOne({ nombre: r.nombre });
      if (!exists) {
        await RoleModel.create(r);
        console.log(`Rol creado: ${r.nombre}`);
      }
    }
  } catch (e) {
    console.warn('No se pudieron crear roles base:', e.message);
  }
}

// Import routes
const indexRouter = require('./routes/index');
const authRouter = require('./routes/auth');
const dashboardRouter = require('./routes/dashboard');
const powerbiRouter = require('./routes/powerbi');
const adminRouter = require('./routes/admin');

// Import models
const User = require('./models/User');
const RoleModel = require('./models/Role');

// Create Express app
const app = express();

// Will connect later in init()

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

// Middleware
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(methodOverride('_method'));
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
const useMongoSessionStore = !!process.env.MONGODB_URI;
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: useMongoSessionStore ? MongoStore.create({
    mongoUrl: process.env.MONGODB_URI,
    ttl: 14 * 24 * 60 * 60 // 14 days
  }) : undefined,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 14 // 14 days
  }
}));

// Flash messages
app.use(flash());

// Passport configuration
app.use(passport.initialize());
app.use(passport.session());

passport.use(new LocalStrategy(
  async (username, password, done) => {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return done(null, false, { message: 'Usuario incorrecto.' });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return done(null, false, { message: 'Contraseña incorrecta.' });
      }
      return done(null, user);
    } catch (err) {
      return done(err);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err);
  }
});

// Make user available to all templates
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.user = req.user;
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  res.locals.error = req.flash('error'); // for passport
  next();
});

// Routes
app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/dashboard', dashboardRouter);
app.use('/powerbi', powerbiRouter);
app.use('/admin', adminRouter);

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('error', { 
    title: 'Error',
    message: '¡Algo salió mal!',
    status: res.statusCode,
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { 
    title: 'No encontrado',
    message: 'Página no encontrada.',
    status: res.statusCode
  });
});

// DB init and start server
const PORT = process.env.PORT || 3000;

async function init() {
  try {
    let uri = process.env.MONGODB_URI;
    if (!uri) {
      if (MongoMemoryServer) {
        const mem = await MongoMemoryServer.create();
        uri = mem.getUri();
        console.log('Using in-memory MongoDB instance');
      } else {
        uri = 'mongodb://127.0.0.1:27017/a365-analytics';
        console.log('Falling back to local MongoDB at', uri);
      }
    }

    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

    // Siembra de usuarios demo (solo si no está deshabilitada)
    if (process.env.SEED_DEMO !== 'false') {
      await seedDemoUsers();
    }

    // Siembra de roles base si no existen
    await seedDefaultRoles();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to initialize application:', err);
    process.exit(1);
  }
}

init();

module.exports = app;

// Crea cuentas demo para cada rol si no existen
async function seedDemoUsers() {
  try {
    const demos = [
      { username: 'admin_demo', email: 'admin_demo@example.com', role: 'admin' },
      { username: 'analista_demo', email: 'analista_demo@example.com', role: 'analista' },
      { username: 'supervisor_demo', email: 'supervisor_demo@example.com', role: 'supervisor' },
      { username: 'asesor_demo', email: 'asesor_demo@example.com', role: 'asesor' },
    ];

    for (const d of demos) {
      const exists = await User.findOne({ username: d.username });
      if (!exists) {
        const u = new User({
          username: d.username,
          email: d.email,
          password: 'demo12345',
          role: d.role,
        });
        await u.save();
        console.log(`Usuario demo creado: ${d.username} (${d.role})`);
      }
    }
  } catch (e) {
    console.warn('No se pudieron crear usuarios demo:', e.message);
  }
}
