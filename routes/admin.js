const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');
const ExcelJS = require('exceljs');
const Asesor = require('../models/Asesor');
const Config = require('../models/Config');
const { ensureAuthenticated, checkRole, checkPermission } = require('../middleware/auth');
const PowerBILink = require('../models/PowerBILink');
const User = require('../models/User');
const Role = require('../models/Role');
const GenesysDataset = require('../models/GenesysDataset');
const GenesysRecord = require('../models/GenesysRecord');
const { parseRendimiento, parseEstados, parseProvision, parseCalidad, parseSIOP } = require('../utils/genesysParsers');

// Storage en memoria para todas las cargas
const memoryStorage = multer.memoryStorage();

// Todas las rutas de admin requieren autenticación. Acceso: admin y analista
router.use(ensureAuthenticated, checkRole(['admin', 'analista']));

router.get('/', (req, res) => {
  res.render('admin/index', { title: 'Panel de Administración', user: req.user });
});

// ===== Genesys Cloud: Carga de archivos (solo admin) =====
const uploadGenesys = multer({ storage: memoryStorage, limits: { fileSize: 25 * 1024 * 1024 } });

router.get('/genesys', checkRole(['admin']), async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const perPage = Math.min(Math.max(parseInt(req.query.perPage || '12', 10), 5), 50);
    const filtroTipo = (req.query.tipo || '').trim();
    const query = filtroTipo ? { tipo: filtroTipo } : {};
    const total = await GenesysDataset.countDocuments(query);
    const datasets = await GenesysDataset.find(query)
      .sort({ anio: -1, mes: -1, tipo: 1 })
      .skip((page - 1) * perPage)
      .limit(perPage);
    res.render('admin/genesys', {
      title: 'Admin · Genesys Cloud',
      user: req.user,
      datasets,
      pagination: { page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) },
      filtroTipo
    });
  } catch (e) {
    console.error(e);
    req.flash('error_msg', 'Error cargando Genesys Cloud');
    res.redirect('/admin');
  }
});

router.post('/genesys/upload', checkRole(['admin']), uploadGenesys.single('archivo'), async (req, res) => {
  try {
    const { tipo, anio, mes, reemplazar } = req.body;
    if (!req.file) {
      req.flash('error_msg', 'Adjunte un archivo Excel o CSV exportado de Genesys Cloud');
      return res.redirect('/admin/genesys');
    }
    const tiposValidos = ['rendimiento', 'estados', 'provision', 'calidad', 'siop'];
    if (!tiposValidos.includes(String(tipo))) {
      req.flash('error_msg', 'Tipo inválido. Tipos soportados: ' + tiposValidos.join(', '));
      return res.redirect('/admin/genesys');
    }
    const y = parseInt(anio, 10); const m = parseInt(mes, 10);
    if (!y || !m || m < 1 || m > 12) {
      req.flash('error_msg', 'Año o mes inválido');
      return res.redirect('/admin/genesys');
    }

    // Buscar dataset existente
    let dataset = await GenesysDataset.findOne({ tipo, anio: y, mes: m });
    if (dataset && !reemplazar) {
      req.flash('error_msg', 'Ya existe un dataset para ese periodo. Marque "Reemplazar" para actualizar.');
      return res.redirect('/admin/genesys');
    }

    // Parsear según tipo
    let registros;
    switch(tipo) {
      case 'rendimiento':
        registros = parseRendimiento(req.file.buffer);
        break;
      case 'estados':
        registros = parseEstados(req.file.buffer);
        break;
      case 'provision':
        registros = parseProvision(req.file.buffer);
        break;
      case 'calidad':
        registros = parseCalidad(req.file.buffer);
        break;
      case 'siop':
        registros = parseSIOP(req.file.buffer);
        break;
      default:
        req.flash('error_msg', 'Tipo no implementado');
        return res.redirect('/admin/genesys');
    }

    // Guardar archivo original en disco
    const uploadsDir = path.join(__dirname, '..', 'uploads', 'genesys');
    try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
    const ext = path.extname(req.file.originalname) || '.xlsx';
    const filename = `${tipo}_${y}-${String(m).padStart(2,'0')}_${Date.now()}${ext}`;
    const fullPath = path.join(uploadsDir, filename);
    fs.writeFileSync(fullPath, req.file.buffer);

    if (!dataset) {
      dataset = new GenesysDataset({ tipo, anio: y, mes: m, originalFilename: filename, totalRegistros: 0 });
      await dataset.save();
    } else {
      // Reemplazo: borrar registros previos
      await GenesysRecord.deleteMany({ datasetId: dataset._id });
      dataset.originalFilename = filename;
    }

    // Insertar registros normalizados
    const bulk = registros.map(r => ({ insertOne: { document: { datasetId: dataset._id, tipo, ag: r.ag, nombreGenesys: r.nombreGenesys, data: r.data } } }));
    if (bulk.length) {
      await GenesysRecord.bulkWrite(bulk);
    }
    dataset.totalRegistros = bulk.length;
    await dataset.save();

    req.flash('success_msg', `Cargado ${bulk.length} registro(s) para ${tipo} ${y}-${String(m).padStart(2,'0')}`);
    res.redirect('/admin/genesys');
  } catch (e) {
    console.error(e);
    req.flash('error_msg', 'Error procesando el archivo de Genesys Cloud');
    res.redirect('/admin/genesys');
  }
});

// Descargar plantilla Excel de Asesores (solo admin)
router.get('/asesores/plantilla', checkRole(['admin']), async (req, res) => {
  try {
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Asesores');
    const headers = await getAsesoresHeaders();
    ws.addRow(headers);
    headers.forEach((h, i) => {
      const col = ws.getColumn(i + 1);
      col.width = Math.min(40, Math.max(12, String(h).length + 2));
    });
    const buffer = await wb.xlsx.writeBuffer();
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="plantilla_asesores.xlsx"');
    res.send(Buffer.from(buffer));
  } catch (e) {
    console.error(e);
    req.flash('error_msg', 'No se pudo generar la plantilla');
    res.redirect('/admin/asesores');
  }
});

// ===== Asesores: carga de datos (solo admin) =====
const uploadExcel = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.xlsx' || ext === '.xls') return cb(null, true);
    cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'));
  },
  limits: { fileSize: 10 * 1024 * 1024 }
});

const DEFAULT_HEADERS_ASESOR = [
  'DNI',
  'NOMBRE DE GENESYS',
  'APELLIDOS Y NOMBRES',
  'SUPERVISOR',
  'ESTADO',
  'FECHA ALTA',
  'FECHA DE CESE',
  'MOTIVO DE CESE',
  'EDAD',
  'TURNO',
  'MODALIDAD',
  'HORARIO L-V',
  'HORARIO FDS - FER',
  'DESCANSO',
  'POOL',
  'AG'
];

async function getAsesoresHeaders() {
  const cfg = await Config.findOne({ key: 'asesores_headers' });
  const arr = Array.isArray(cfg && cfg.value) ? cfg.value : DEFAULT_HEADERS_ASESOR;
  // Normalizamos a strings no vacías
  return arr.map(s => String(s).trim()).filter(Boolean);
}

router.get('/asesores', checkRole(['admin']), async (req, res) => {
  try {
    const headers = await getAsesoresHeaders();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const perPage = Math.min(Math.max(parseInt(req.query.perPage || '20', 10), 5), 100);
    const total = await Asesor.countDocuments();
    const asesores = await Asesor.find({})
      .sort({ createdAt: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render('admin/asesores', {
      title: 'Admin · Asesores',
      user: req.user,
      asesores,
      headers,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage))
      }
    });
  } catch (e) {
    console.error(e);
    req.flash('error_msg', 'Error cargando asesores');
    res.redirect('/admin');
  }
});

// Actualizar cabeceras requeridas de Asesores (solo admin)
router.post('/asesores/cabeceras', checkRole(['admin']), async (req, res) => {
  try {
    const raw = req.body && req.body.headersRaw ? String(req.body.headersRaw) : '';
    const list = raw.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
    if (!list.length) {
      req.flash('error_msg', 'Debe ingresar al menos una cabecera');
      return res.redirect('/admin/asesores');
    }
    const hasDni = list.some(h => h.toUpperCase() === 'DNI');
    if (!hasDni) {
      req.flash('error_msg', 'Las cabeceras deben incluir obligatoriamente la columna DNI');
      return res.redirect('/admin/asesores');
    }
    await Config.updateOne(
      { key: 'asesores_headers' },
      { $set: { value: list } },
      { upsert: true }
    );
    req.flash('success_msg', 'Cabeceras actualizadas');
    res.redirect('/admin/asesores');
  } catch (e) {
    console.error(e);
    req.flash('error_msg', 'Error actualizando cabeceras');
    res.redirect('/admin/asesores');
  }
});

router.post('/asesores/carga', checkRole(['admin']), uploadExcel.single('archivo'), async (req, res) => {
  try {
    if (!req.file) {
      req.flash('error_msg', 'Adjunte un archivo Excel (.xlsx/.xls)');
      return res.redirect('/admin/asesores');
    }
    const tipoDoc = (req.body.tipoDoc || '').toUpperCase();
    if (!['DNI','CE'].includes(tipoDoc)) {
      req.flash('error_msg', 'Seleccione un tipo de documento válido (DNI o Carné de Extranjería)');
      return res.redirect('/admin/asesores');
    }
    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
    if (!rows.length) {
      req.flash('error_msg', 'El archivo está vacío');
      return res.redirect('/admin/asesores');
    }
    // Validar cabeceras exactas
    const range = XLSX.utils.decode_range(sheet['!ref']);
    const firstRow = [];
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cell = sheet[XLSX.utils.encode_cell({ r: range.s.r, c })];
      firstRow.push(cell ? String(cell.v).trim() : '');
    }
    const normalized = firstRow.filter(Boolean).map(s => s.toUpperCase());
    const expected = (await getAsesoresHeaders()).map(s => s.toUpperCase());
    const missing = expected.filter(h => !normalized.includes(h));
    if (missing.length) {
      req.flash('error_msg', `Cabeceras faltantes o inválidas: ${missing.join(', ')}`);
      return res.redirect('/admin/asesores');
    }

    // Validar filas primero (DNI/CE) sin modificar BD
    const errores = [];
    const registros = [];
    const reNumerico = /^\d+$/;
    const longitudEsperada = tipoDoc === 'DNI' ? 8 : 10;
    rows.forEach((r, idx) => {
      const rec = {
        DNI: String(r['DNI'] || '').trim(),
        nombreGenesys: String(r['NOMBRE DE GENESYS'] || '').trim(),
        apellidosNombres: String(r['APELLIDOS Y NOMBRES'] || '').trim(),
        supervisor: String(r['SUPERVISOR'] || '').trim(),
        estado: String(r['ESTADO'] || '').trim(),
        fechaAlta: r['FECHA ALTA'] ? new Date(r['FECHA ALTA']) : null,
        fechaCese: r['FECHA DE CESE'] ? new Date(r['FECHA DE CESE']) : null,
        motivoCese: String(r['MOTIVO DE CESE'] || '').trim(),
        edad: r['EDAD'] ? Number(r['EDAD']) : undefined,
        turno: String(r['TURNO'] || '').trim(),
        modalidad: String(r['MODALIDAD'] || '').trim(),
        horarioLV: String(r['HORARIO L-V'] || '').trim(),
        horarioFdsFer: String(r['HORARIO FDS - FER'] || '').trim(),
        descanso: String(r['DESCANSO'] || '').trim(),
        pool: String(r['POOL'] || '').trim(),
        ag: String(r['AG'] || '').trim(),
      };
      const fila = idx + 2; // asumiendo cabeceras en fila 1
      if (!rec.DNI) {
        errores.push(`Fila ${fila}: DNI vacío`);
      } else if (!reNumerico.test(rec.DNI)) {
        errores.push(`Fila ${fila}: DNI debe ser numérico`);
      } else if (rec.DNI.length !== longitudEsperada) {
        errores.push(`Fila ${fila}: longitud ${rec.DNI.length} inválida; se espera ${longitudEsperada}`);
      }
      registros.push(rec);
    });

    if (errores.length) {
      const preview = errores.slice(0, 10).join(' | ');
      req.flash('error_msg', `Se encontraron ${errores.length} error(es). Ejemplos: ${preview}`);
      return res.redirect('/admin/asesores');
    }

    // Procesar filas (upsert por DNI) si no hubo errores
    let insertados = 0; let actualizados = 0;
    for (const rec of registros) {
      const resUp = await Asesor.updateOne(
        { DNI: rec.DNI },
        { $set: rec },
        { upsert: true }
      );
      if (resUp.upsertedCount && resUp.upsertedCount > 0) insertados++; else actualizados++;
    }
    req.flash('success_msg', `Carga completada. Insertados: ${insertados}, Actualizados: ${actualizados}.`);
    res.redirect('/admin/asesores');
  } catch (e) {
    console.error(e);
    req.flash('error_msg', 'Error procesando el archivo');
    res.redirect('/admin/asesores');
  }
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
