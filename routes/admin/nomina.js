const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensureAuthenticated, checkRole } = require('../../middleware/auth');
const NominaDataset = require('../../models/NominaDataset');
const NominaRecord = require('../../models/NominaRecord');
const { parseNomina } = require('../../utils/nominaParser');

// Middleware - Solo admins pueden gestionar nóminas
router.use(ensureAuthenticated);
router.use(checkRole(['admin']));

// Configurar multer para archivos en memoria
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Listar datasets de nómina
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = parseInt(req.query.perPage) || 12;
    const skip = (page - 1) * perPage;
    
    const total = await NominaDataset.countDocuments();
    const datasets = await NominaDataset.find()
      .sort({ anio: -1, mes: -1 })
      .skip(skip)
      .limit(perPage)
      .populate('creadoPor', 'username');
    
    const totalPages = Math.ceil(total / perPage);
    
    res.render('admin/nomina', {
      title: 'Administración · Nómina',
      user: req.user,
      datasets,
      pagination: {
        page,
        perPage,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('[ADMIN NOMINA] Error:', error);
    req.flash('error_msg', 'Error cargando nóminas');
    res.redirect('/admin');
  }
});

// Cargar archivo de nómina
router.post('/upload', upload.single('archivo'), async (req, res) => {
  try {
    const { anio, mes, reemplazar } = req.body;
    
    if (!req.file) {
      req.flash('error_msg', 'Debe seleccionar un archivo CSV');
      return res.redirect('/admin/nomina');
    }
    
    if (!anio || !mes) {
      req.flash('error_msg', 'Debe especificar el año y mes');
      return res.redirect('/admin/nomina');
    }
    
    const y = parseInt(anio, 10);
    const m = parseInt(mes, 10);
    
    if (!y || !m || m < 1 || m > 12) {
      req.flash('error_msg', 'Año o mes inválido');
      return res.redirect('/admin/nomina');
    }
    
    // Buscar dataset existente
    let dataset = await NominaDataset.findOne({ anio: y, mes: m });
    if (dataset && !reemplazar) {
      req.flash('error_msg', 'Ya existe una nómina para ese periodo. Marque "Reemplazar" para actualizar.');
      return res.redirect('/admin/nomina');
    }
    
    // Parsear archivo
    console.log('[ADMIN NOMINA] Parseando archivo, tamaño:', req.file.buffer.length, 'bytes');
    const registros = parseNomina(req.file.buffer);
    console.log('[ADMIN NOMINA] Registros parseados:', registros.length);
    
    if (registros.length === 0) {
      throw new Error('No se pudieron parsear registros del archivo CSV');
    }
    
    // Guardar archivo original
    const uploadsDir = path.join(__dirname, '../../uploads/nomina');
    try { fs.mkdirSync(uploadsDir, { recursive: true }); } catch {}
    const ext = path.extname(req.file.originalname) || '.csv';
    const filename = `nomina_${y}-${String(m).padStart(2,'0')}_${Date.now()}${ext}`;
    const fullPath = path.join(uploadsDir, filename);
    fs.writeFileSync(fullPath, req.file.buffer);
    
    // Calcular totales
    const totales = registros.reduce((acc, reg) => {
      acc.totalSueldoBruto += reg.sueldoBruto || 0;
      acc.totalNetoAPagar += reg.netoAPagar || 0;
      acc.totalCostoEmpleador += reg.costoTotalEmpleador || 0;
      acc.totalBonos += (reg.bonoIncentivos || 0) + (reg.bonoCumplimientos || 0) + (reg.bonoNocturno || 0);
      acc.totalComisiones += reg.comisiones || 0;
      return acc;
    }, {
      totalSueldoBruto: 0,
      totalNetoAPagar: 0,
      totalCostoEmpleador: 0,
      totalBonos: 0,
      totalComisiones: 0
    });
    
    if (!dataset) {
      dataset = new NominaDataset({ 
        anio: y, 
        mes: m, 
        nombreArchivo: filename,
        creadoPor: req.user._id,
        totalRegistros: 0,
        totalEmpleados: 0,
        ...totales
      });
      await dataset.save();
    } else {
      // Reemplazo: borrar registros previos
      await NominaRecord.deleteMany({ datasetId: dataset._id });
      dataset.nombreArchivo = filename;
      dataset.creadoPor = req.user._id;
      dataset.creadoEn = new Date();
      Object.assign(dataset, totales);
    }
    
    // Insertar registros
    const bulk = registros.map(r => ({ 
      insertOne: { 
        document: { 
          datasetId: dataset._id, 
          ...r 
        } 
      } 
    }));
    
    console.log('[ADMIN NOMINA] Insertando', bulk.length, 'registros en la BD');
    
    if (bulk.length) {
      const resultado = await NominaRecord.bulkWrite(bulk);
      console.log('[ADMIN NOMINA] Resultado bulkWrite:', resultado.insertedCount);
    }
    
    dataset.totalRegistros = bulk.length;
    dataset.totalEmpleados = bulk.length;
    await dataset.save();
    
    console.log('[ADMIN NOMINA] Dataset guardado con ID:', dataset._id);
    
    req.flash('success_msg', `Cargados ${bulk.length} empleado(s) de nómina para ${y}-${String(m).padStart(2,'0')}`);
    res.redirect('/admin/nomina');
  } catch (error) {
    console.error('[ADMIN NOMINA] Error cargando archivo:', error);
    req.flash('error_msg', 'Error procesando archivo: ' + error.message);
    res.redirect('/admin/nomina');
  }
});

// Verificar datos de nómina (DEBUG)
router.get('/verificar/:id', async (req, res) => {
  try {
    const dataset = await NominaDataset.findById(req.params.id);
    if (!dataset) {
      return res.status(404).json({ error: 'Dataset no encontrado' });
    }
    
    const registros = await NominaRecord.find({ datasetId: req.params.id }).limit(10);
    
    // Agrupar por campaña
    const campanasAgrupadas = await NominaRecord.aggregate([
      { $match: { datasetId: dataset._id } },
      { 
        $group: {
          _id: '$campana',
          empleados: { $sum: 1 },
          costoTotal: { $sum: '$costoTotalEmpleador' },
          sueldoBrutoTotal: { $sum: '$sueldoBruto' }
        }
      },
      { $sort: { costoTotal: -1 } }
    ]);
    
    res.json({
      dataset: {
        id: dataset._id,
        periodo: `${dataset.anio}-${String(dataset.mes).padStart(2, '0')}`,
        totalEmpleados: dataset.totalEmpleados,
        totalCostoEmpleador: dataset.totalCostoEmpleador,
        totalSueldoBruto: dataset.totalSueldoBruto
      },
      muestraRegistros: registros.map(r => ({
        nombre: r.nombreCompleto,
        dni: r.dni,
        campana: r.campana,
        sueldoBasico: r.sueldoBasico,
        sueldoBruto: r.sueldoBruto,
        costoTotalEmpleador: r.costoTotalEmpleador,
        netoAPagar: r.netoAPagar
      })),
      resumenPorCampana: campanasAgrupadas
    });
  } catch (error) {
    console.error('[ADMIN NOMINA] Error verificando:', error);
    res.status(500).json({ error: error.message });
  }
});

// Eliminar dataset de nómina
router.post('/delete/:id', async (req, res) => {
  try {
    const dataset = await NominaDataset.findById(req.params.id);
    if (!dataset) {
      req.flash('error_msg', 'Dataset no encontrado');
      return res.redirect('/admin/nomina');
    }
    
    // Eliminar registros asociados
    const registrosEliminados = await NominaRecord.deleteMany({ datasetId: req.params.id });
    console.log('[ADMIN NOMINA] Registros eliminados:', registrosEliminados.deletedCount);
    
    // Eliminar dataset
    await NominaDataset.findByIdAndDelete(req.params.id);
    
    req.flash('success_msg', `Nómina eliminada (${dataset.anio}-${String(dataset.mes).padStart(2,'0')})`);
    res.redirect('/admin/nomina');
  } catch (error) {
    console.error('[ADMIN NOMINA] Error eliminando:', error);
    req.flash('error_msg', 'Error eliminando nómina');
    res.redirect('/admin/nomina');
  }
});

module.exports = router;
