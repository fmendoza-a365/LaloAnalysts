const express = require('express');
const router = express.Router();
const multer = require('multer');
const { ensureAuthenticated, checkRole } = require('../../middleware/auth');
const { requireTenant, getTenantModelFromReq } = require('../../middleware/tenant');
const { parseTarifasCSV } = require('../../utils/parsers/tarifasParser');

// ❌ NO importar modelos multi-tenant directamente
// Modelos multi-tenant: Tarifa

// Middleware - Solo admins pueden gestionar tarifas
router.use(ensureAuthenticated, requireTenant, checkRole(['admin']));

// Configurar multer para archivos en memoria
const upload = multer({ storage: multer.memoryStorage() });
const path = require('path');
const fs = require('fs');

// Descargar archivo de ejemplo
router.get('/ejemplo', (req, res) => {
  const filePath = path.join(__dirname, '../../public/ejemplos/Tarifas del 2021 al 19 de octubre 2025.csv');
  
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'ejemplo-de-tarifas.csv', (err) => {
      if (err) {
        console.error('Error descargando archivo:', err);
        req.flash('error_msg', 'Error al descargar el archivo de ejemplo');
        res.redirect('/admin/tarifas');
      }
    });
  } else {
    req.flash('error_msg', 'Archivo de ejemplo no encontrado');
    res.redirect('/admin/tarifas');
  }
});

// Listar tarifas
router.get('/', async (req, res) => {
  try {
    // Obtener modelo dinámico del tenant actual
    const Tarifa = getTenantModelFromReq(req, 'Tarifa');

    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 20;
    const skip = (page - 1) * perPage;

    // ✅ Contar y obtener tarifas (solo del tenant actual)
    const total = await Tarifa.countDocuments();
    const tarifas = await Tarifa.find()
      .sort({ vigenciaDesde: -1, mesa: 1 })
      .skip(skip)
      .limit(perPage);
    
    const totalPages = Math.ceil(total / perPage);
    
    res.render('admin/tarifas', {
      title: 'Administración · Tarifas',
      user: req.user,
      tarifas,
      pagination: {
        page,
        perPage,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('[ADMIN TARIFAS] Error:', error);
    req.flash('error_msg', 'Error cargando tarifas');
    res.redirect('/admin');
  }
});

// Cargar archivo de tarifas
router.post('/upload', upload.single('archivo'), async (req, res) => {
  try {
    const { vigenciaDesde, vigenciaHasta } = req.body;

    if (!req.file) {
      req.flash('error_msg', 'Debe seleccionar un archivo CSV');
      return res.redirect('/admin/tarifas');
    }

    if (!vigenciaDesde) {
      req.flash('error_msg', 'Debe especificar la fecha de vigencia');
      return res.redirect('/admin/tarifas');
    }

    // Obtener modelo dinámico del tenant actual
    const Tarifa = getTenantModelFromReq(req, 'Tarifa');

    // Parsear archivo
    const fechaDesde = new Date(vigenciaDesde);
    const fechaHasta = vigenciaHasta ? new Date(vigenciaHasta) : null;

    const tarifasParsed = parseTarifasCSV(req.file.buffer, fechaDesde, fechaHasta);

    if (tarifasParsed.length === 0) {
      req.flash('error_msg', 'No se encontraron tarifas en el archivo');
      return res.redirect('/admin/tarifas');
    }

    // Guardar tarifas en la base de datos
    let insertadas = 0;
    let actualizadas = 0;

    for (const tarifaData of tarifasParsed) {
      // Buscar si ya existe una tarifa para esta mesa y vigencia
      const existente = await Tarifa.findOne({
        mesa: tarifaData.mesa,
        vigenciaDesde: fechaDesde
      });

      if (existente) {
        // Actualizar
        existente.rangos = tarifaData.rangos;
        existente.onrConIGV = tarifaData.onrConIGV;
        existente.onrSinIGV = tarifaData.onrSinIGV;
        existente.vigenciaHasta = fechaHasta;
        existente.actualizadoEn = new Date();
        await existente.save();
        actualizadas++;
      } else {
        // Insertar nueva
        await Tarifa.create(tarifaData);
        insertadas++;
      }
    }

    req.flash('success_msg', `Tarifas cargadas: ${insertadas} nuevas, ${actualizadas} actualizadas`);
    res.redirect('/admin/tarifas');
  } catch (error) {
    console.error('[ADMIN TARIFAS] Error cargando archivo:', error);
    req.flash('error_msg', 'Error procesando archivo: ' + error.message);
    res.redirect('/admin/tarifas');
  }
});

// Activar/Desactivar tarifa
router.post('/:id/toggle', async (req, res) => {
  try {
    const Tarifa = getTenantModelFromReq(req, 'Tarifa');

    const tarifa = await Tarifa.findById(req.params.id);
    if (!tarifa) {
      req.flash('error_msg', 'Tarifa no encontrada');
      return res.redirect('/admin/tarifas');
    }

    tarifa.activo = !tarifa.activo;
    tarifa.actualizadoEn = new Date();
    await tarifa.save();

    req.flash('success_msg', `Tarifa ${tarifa.activo ? 'activada' : 'desactivada'}`);
    res.redirect('/admin/tarifas');
  } catch (error) {
    console.error('[ADMIN TARIFAS] Error toggle:', error);
    req.flash('error_msg', 'Error actualizando tarifa');
    res.redirect('/admin/tarifas');
  }
});

// Eliminar tarifa
router.post('/:id/delete', async (req, res) => {
  try {
    const Tarifa = getTenantModelFromReq(req, 'Tarifa');

    await Tarifa.findByIdAndDelete(req.params.id);
    req.flash('success_msg', 'Tarifa eliminada');
    res.redirect('/admin/tarifas');
  } catch (error) {
    console.error('[ADMIN TARIFAS] Error eliminando:', error);
    req.flash('error_msg', 'Error eliminando tarifa');
    res.redirect('/admin/tarifas');
  }
});

module.exports = router;
