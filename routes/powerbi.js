const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkRole } = require('../middleware/auth');
const PowerBILink = require('../models/PowerBILink');

// Validación simple de URL embed de Power BI
function isValidPowerBIUrl(url) {
  try {
    const u = new URL(url);
    // Acepta:
    // - Embed interno: .../reportEmbed?... o .../report?...
    // - Publicado en la web: .../view?r=...
    if (!u.hostname.includes('powerbi.com')) return false;
    const path = u.pathname.toLowerCase();
    const search = u.search.toLowerCase();
    const isEmbed = path.includes('reportembed') || path.includes('/report');
    const isPublicView = path.includes('/view') && /[?&]r=/.test(search);
    return isEmbed || isPublicView;
  } catch {
    return false;
  }
}

// Listado de enlaces Power BI (visible para usuarios autenticados) con búsqueda y paginación
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const search = (req.query.search || '').trim();
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const perPage = Math.min(Math.max(parseInt(req.query.perPage || '10', 10), 5), 50);

    // Si el usuario es analista, ve todo sin restricciones
    const baseActivoFilter = (req.user && (req.user.role === 'admin' || req.user.role === 'analista')) ? {} : { activo: true };
    const visibilityFilter = (req.user && req.user.role === 'analista')
      ? baseActivoFilter
      : {
          $and: [
            baseActivoFilter,
            {
              $or: [
                { rolesPermitidos: { $size: 0 } },
                { rolesPermitidos: { $exists: false } },
                { rolesPermitidos: req.user ? req.user.role : undefined }
              ]
            }
          ]
        };

    const searchFilter = search
      ? { $or: [
            { nombreMesa: { $regex: search, $options: 'i' } },
            { descripcion: { $regex: search, $options: 'i' } },
            { modulo: { $regex: search, $options: 'i' } }
          ] }
      : {};

    const filter = { $and: [visibilityFilter, searchFilter] };

    const total = await PowerBILink.countDocuments(filter);
    const links = await PowerBILink.find(filter)
      .sort({ creadoEn: -1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    res.render('powerbi/index', {
      title: 'Dashbords',
      user: req.user,
      links,
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
    req.flash('error_msg', 'Error cargando enlaces de Power BI');
    res.redirect('/');
  }
});

// Formulario para crear un nuevo enlace (admin o analista)
router.get('/nuevo', ensureAuthenticated, checkRole(['admin', 'analista']), (req, res) => {
  res.render('powerbi/nuevo', {
    title: 'Nuevo Dashbord',
    user: req.user
  });
});

// Crear enlace
router.post('/', ensureAuthenticated, checkRole(['admin', 'analista']), async (req, res) => {
  try {
    const { nombreMesa, descripcion, url, modulo, rolesPermitidos, imageUrl } = req.body;

    if (!isValidPowerBIUrl(url)) {
      req.flash('error_msg', 'La URL no parece ser una URL de incrustación válida de Power BI');
      return res.redirect('/powerbi/nuevo');
    }

    const link = new PowerBILink({
      nombreMesa,
      descripcion,
      url,
      imageUrl,
      modulo: modulo || 'general',
      rolesPermitidos: Array.isArray(rolesPermitidos)
        ? rolesPermitidos
        : (rolesPermitidos ? [rolesPermitidos] : []),
      creadoPor: req.user._id
    });

    await link.save();
    req.flash('success_msg', 'Enlace de Power BI creado correctamente');
    res.redirect('/powerbi');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error creando el enlace');
    res.redirect('/powerbi/nuevo');
  }
});

// Editar: formulario
router.get('/:id/editar', ensureAuthenticated, checkRole(['admin', 'analista']), async (req, res) => {
  try {
    const link = await PowerBILink.findById(req.params.id);
    if (!link) {
      req.flash('error_msg', 'Enlace no encontrado');
      return res.redirect('/powerbi');
    }
    res.render('powerbi/editar', { title: 'Editar Dashbord', user: req.user, link });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando el enlace');
    res.redirect('/powerbi');
  }
});

// Editar: actualización
router.put('/:id', ensureAuthenticated, checkRole(['admin', 'analista']), async (req, res) => {
  try {
    const { nombreMesa, descripcion, url, modulo, rolesPermitidos, imageUrl } = req.body;
    if (!isValidPowerBIUrl(url)) {
      req.flash('error_msg', 'La URL no parece ser una URL de incrustación válida de Power BI');
      return res.redirect(`/powerbi/${req.params.id}/editar`);
    }

    const update = {
      nombreMesa,
      descripcion,
      url,
      imageUrl,
      modulo: modulo || 'general',
      rolesPermitidos: Array.isArray(rolesPermitidos)
        ? rolesPermitidos
        : (rolesPermitidos ? [rolesPermitidos] : [])
    };

    await PowerBILink.findByIdAndUpdate(req.params.id, update);
    req.flash('success_msg', 'Enlace actualizado');
    res.redirect('/powerbi');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error actualizando el enlace');
    res.redirect('/powerbi');
  }
});

// Eliminar
router.delete('/:id', ensureAuthenticated, checkRole(['admin', 'analista']), async (req, res) => {
  try {
    await PowerBILink.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Enlace eliminado');
    res.redirect('/powerbi');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error eliminando el enlace');
    res.redirect('/powerbi');
  }
});

// Detalle/visualización embebida de un enlace
router.get('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const link = await PowerBILink.findById(req.params.id);
    if (!link) {
      req.flash('error_msg', 'Enlace no encontrado');
      return res.redirect('/powerbi');
    }

    // Bloqueo por inactivo: solo admin/analista pueden ver inactivos
    if (!link.activo && (!req.user || (req.user.role !== 'admin' && req.user.role !== 'analista'))) {
      req.flash('error_msg', 'Este enlace no está activo');
      return res.redirect('/powerbi');
    }

    // Verificación de roles (si se configuraron) - analista ve todo
    if ((req.user && req.user.role !== 'analista') && Array.isArray(link.rolesPermitidos) && link.rolesPermitidos.length) {
      const userRole = req.user ? req.user.role : undefined;
      if (!userRole || !link.rolesPermitidos.includes(userRole)) {
        req.flash('error_msg', 'No autorizado para ver este enlace');
        return res.redirect('/powerbi');
      }
    }

    res.render('powerbi/ver', {
      title: link.nombreMesa || 'Dashbords',
      user: req.user,
      link
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando el enlace');
    res.redirect('/powerbi');
  }
});

module.exports = router;
