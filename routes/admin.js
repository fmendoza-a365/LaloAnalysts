const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkRole, checkPermission } = require('../middleware/auth');
const PowerBILink = require('../models/PowerBILink');
const User = require('../models/User');
const Role = require('../models/Role');

// Todas las rutas de admin requieren autenticación. Acceso: admin y analista
router.use(ensureAuthenticated, checkRole(['admin', 'analista']));

router.get('/', (req, res) => {
  res.render('admin/index', { title: 'Panel de Administración', user: req.user });
});

// Asignación de roles a usuarios (ver y aplicar)
router.get('/roles/asignacion', checkRole(['admin']), async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const perPage = parseInt(req.query.perPage, 10) || 10;
    const search = (req.query.search || '').trim();
    const roleFilter = (req.query.role || '').trim();

    const query = {};
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    if (roleFilter) {
      query.role = roleFilter;
    }

    const [total, users, roles] = await Promise.all([
      User.countDocuments(query),
      User.find(query).sort({ createdAt: -1 }).skip((page - 1) * perPage).limit(perPage),
      Role.find({}).sort({ nombre: 1 })
    ]);

    res.render('admin/roles_asignacion', {
      title: 'Admin · Asignación de Roles',
      user: req.user,
      users,
      roles,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage)),
        search,
        role: roleFilter
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando asignación de roles');
    res.redirect('/admin/roles');
  }
});

router.post('/roles/asignacion/:userId', checkRole(['admin']), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin','analista','supervisor','asesor'].includes(role)) {
      req.flash('error_msg', 'Rol inválido');
      return res.redirect('/admin/roles/asignacion');
    }
    await User.findByIdAndUpdate(req.params.userId, { role });
    req.flash('success_msg', 'Rol asignado correctamente');
    res.redirect('back');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error asignando el rol');
    res.redirect('/admin/roles/asignacion');
  }
});

// Activar/Desactivar enlace (admin y analista)
router.post('/dashbords/:id/toggle', checkPermission('dashbords','activar_desactivar'), async (req, res) => {
  try {
    const link = await PowerBILink.findById(req.params.id);
    if (!link) {
      req.flash('error_msg', 'Enlace no encontrado');
      return res.redirect('/admin/dashbords');
    }
    link.activo = !link.activo;
    await link.save();
    req.flash('success_msg', `Enlace ${link.activo ? 'activado' : 'desactivado'}`);
    res.redirect('/admin/dashbords');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cambiando el estado');
    res.redirect('/admin/dashbords');
  }
});

// Formulario de nuevo usuario (solo admin)
router.get('/usuarios/nuevo', checkRole(['admin']), (req, res) => {
  res.render('admin/usuarios_nuevo', { title: 'Admin · Nuevo Usuario', user: req.user });
});

// Crear usuario (solo admin)
router.post('/usuarios', checkRole(['admin']), async (req, res) => {
  try {
    const { username, email, role, password } = req.body;
    if (!username || !email || !role) {
      req.flash('error_msg', 'Completa usuario, email y rol');
      return res.redirect('/admin/usuarios/nuevo');
    }
    if (!['admin','analista','supervisor','asesor'].includes(role)) {
      req.flash('error_msg', 'Rol inválido');
      return res.redirect('/admin/usuarios/nuevo');
    }
    const UserModel = User; // evitar sombras
    const exists = await UserModel.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      req.flash('error_msg', 'El usuario o email ya existe');
      return res.redirect('/admin/usuarios/nuevo');
    }
    const u = new UserModel({
      username,
      email,
      role,
      password: password && password.length >= 6 ? password : 'temporal123'
    });
    await u.save();
    req.flash('success_msg', 'Usuario creado correctamente');
    res.redirect('/admin/usuarios');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creando el usuario');
    res.redirect('/admin/usuarios/nuevo');
  }
});

// Actualizar rolesPermitidos (admin y analista)
router.post('/dashbords/:id/roles', checkPermission('dashbords','editar'), async (req, res) => {
  try {
    const { rolesPermitidos } = req.body;
    const value = Array.isArray(rolesPermitidos)
      ? rolesPermitidos
      : (rolesPermitidos ? [rolesPermitidos] : []);
    await PowerBILink.findByIdAndUpdate(req.params.id, { rolesPermitidos: value });
    req.flash('success_msg', 'Roles actualizados');
    res.redirect('/admin/dashbords');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error actualizando roles');
    res.redirect('/admin/dashbords');
  }
});

// Eliminar enlace (solo admin)
router.post('/dashbords/:id/eliminar', checkPermission('dashbords','eliminar'), async (req, res) => {
  try {
    await PowerBILink.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Enlace eliminado');
    res.redirect('/admin/dashbords');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error eliminando el enlace');
    res.redirect('/admin/dashbords');
  }
});

router.get('/dashbords', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const perPage = Math.min(Math.max(parseInt(req.query.perPage || '12', 10), 5), 50);
    const search = (req.query.search || '').trim();
    const modulo = (req.query.modulo || '').trim();
    const estado = (req.query.estado || '').trim(); // 'activo'|'inactivo'|''

    const searchFilter = search
      ? { $or: [
            { nombreMesa: { $regex: search, $options: 'i' } },
            { descripcion: { $regex: search, $options: 'i' } },
            { modulo: { $regex: search, $options: 'i' } }
          ] }
      : {};

    const moduloFilter = modulo && modulo !== 'todos' ? { modulo } : {};
    const estadoFilter = estado === 'activo' ? { activo: true } : (estado === 'inactivo' ? { activo: false } : {});

    const baseFilter = { $and: [searchFilter, moduloFilter, estadoFilter] };

    const total = await PowerBILink.countDocuments(baseFilter);
    const links = await PowerBILink.find(baseFilter)
      .sort({ creadoEn: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render('admin/dashbords', {
      title: 'Admin · Dashbords',
      user: req.user,
      links,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.max(Math.ceil(total / perPage), 1),
        search,
        modulo,
        estado
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando los Dashbords');
    res.redirect('/admin');
  }
});

router.get('/finanzas/tarifas', (req, res) => {
  res.render('admin/finanzas_tarifas', { title: 'Admin · Finanzas · Tarifas PxQ', user: req.user });
});

router.get('/finanzas/volumenes', (req, res) => {
  res.render('admin/finanzas_volumenes', { title: 'Admin · Finanzas · Volúmenes', user: req.user });
});

router.get('/usuarios', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const perPage = Math.min(Math.max(parseInt(req.query.perPage || '12', 10), 5), 50);
    const search = (req.query.search || '').trim();

    const searchFilter = search
      ? { $or: [
            { username: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } },
            { role: { $regex: search, $options: 'i' } }
          ] }
      : {};

    const total = await User.countDocuments(searchFilter);
    const users = await User.find(searchFilter)
      .select('username email role createdAt')
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render('admin/usuarios', {
      title: 'Admin · Usuarios',
      user: req.user,
      users,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.max(Math.ceil(total / perPage), 1),
        search
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando usuarios');
    res.redirect('/admin');
  }
});

// Cambiar rol de usuario (solo admin)
router.post('/usuarios/:id/rol', checkPermission('usuarios','cambiar_rol'), async (req, res) => {
  try {
    const { role } = req.body;
    if (!['admin','analista','supervisor','asesor'].includes(role)) {
      req.flash('error_msg', 'Rol inválido');
      return res.redirect('/admin/usuarios');
    }
    await User.findByIdAndUpdate(req.params.id, { role });
    req.flash('success_msg', 'Rol actualizado');
    res.redirect('/admin/usuarios');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error actualizando el rol');
    res.redirect('/admin/usuarios');
  }
});

// Reset de contraseña (solo admin)
router.post('/usuarios/:id/reset', checkPermission('usuarios','reset_password'), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      req.flash('error_msg', 'Usuario no encontrado');
      return res.redirect('/admin/usuarios');
    }
    user.password = 'temporal123';
    await user.save();
    req.flash('success_msg', 'Contraseña reseteada a "temporal123". Pida al usuario cambiarla.');
    res.redirect('/admin/usuarios');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error reseteando la contraseña');
    res.redirect('/admin/usuarios');
  }
});

router.get('/permisos', (req, res) => {
  res.render('admin/permisos', { title: 'Admin · Permisos', user: req.user });
});

router.get('/catalogo', (req, res) => {
  res.render('admin/catalogo', { title: 'Admin · Catálogo', user: req.user });
});

router.get('/auditoria', (req, res) => {
  res.render('admin/auditoria', { title: 'Admin · Auditoría', user: req.user });
});

router.get('/integraciones', (req, res) => {
  res.render('admin/integraciones', { title: 'Admin · Integraciones', user: req.user });
});

router.get('/calidad', (req, res) => {
  res.render('admin/calidad', { title: 'Admin · Calidad de Datos', user: req.user });
});

router.get('/config', (req, res) => {
  res.render('admin/config', { title: 'Admin · Configuración', user: req.user });
});

// ==== Gestión de Roles ====
// Listado
router.get('/roles', async (req, res) => {
  try {
    const roles = await Role.find({}).sort({ nombre: 1 });
    res.render('admin/roles', { title: 'Admin · Gestión de Roles', user: req.user, roles });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando roles');
    res.redirect('/admin');
  }
});

// Nuevo rol (solo admin)
router.get('/roles/nuevo', checkRole(['admin']), (req, res) => {
  res.render('admin/roles_nuevo', { title: 'Admin · Nuevo Rol', user: req.user });
});

router.post('/roles', checkRole(['admin']), async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body;
    const permisos = req.body.permisos || {};
    if (!nombre) {
      req.flash('error_msg', 'El nombre del rol es obligatorio');
      return res.redirect('/admin/roles/nuevo');
    }
    const role = new Role({ nombre: nombre.trim(), descripcion, activo: !!activo, permisos });
    await role.save();
    req.flash('success_msg', 'Rol creado');
    res.redirect('/admin/roles');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creando el rol');
    res.redirect('/admin/roles/nuevo');
  }
});

// Editar rol
router.get('/roles/:id/editar', checkRole(['admin']), async (req, res) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) {
      req.flash('error_msg', 'Rol no encontrado');
      return res.redirect('/admin/roles');
    }
    res.render('admin/roles_editar', { title: 'Admin · Editar Rol', user: req.user, role });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando el rol');
    res.redirect('/admin/roles');
  }
});

router.post('/roles/:id', checkRole(['admin']), async (req, res) => {
  try {
    const { nombre, descripcion, activo } = req.body;
    const permisos = req.body.permisos || {};
    await Role.findByIdAndUpdate(req.params.id, { nombre, descripcion, activo: !!activo, permisos });
    req.flash('success_msg', 'Rol actualizado');
    res.redirect('/admin/roles');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error actualizando el rol');
    res.redirect('/admin/roles');
  }
});

module.exports = router;
