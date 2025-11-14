/**
 * Rutas de administración para Carpetas Sincronizadas
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkRole } = require('../../middleware/auth');
const SyncFolder = require('../../models/SyncFolder');
const { syncFolder } = require('../../services/autoSyncService');
const { detectDatasetType, canProcessFile } = require('../../services/datasetDetector');
const multer = require('multer');

// Middleware - Solo admins (SIN requireTenant para permitir acceso sin campaña)
router.use(ensureAuthenticated, checkRole(['admin']));

// Configurar multer para pruebas de archivos
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

/**
 * GET / - Listar carpetas sincronizadas
 */
router.get('/', async (req, res) => {
  try {
    // Verificar si hay campaña seleccionada
    if (!req.tenantId) {
      return res.render('admin/syncFolders/index', {
        title: 'Carpetas Sincronizadas',
        user: req.user,
        folders: [],
        noCampaign: true
      });
    }

    const folders = await SyncFolder.find({ campaignId: req.tenantId })
      .populate('creadoPor', 'username')
      .sort({ createdAt: -1 });

    res.render('admin/syncFolders/index', {
      title: 'Carpetas Sincronizadas',
      user: req.user,
      folders,
      campaign: req.tenant,
      noCampaign: false
    });
  } catch (error) {
    console.error('[SYNC FOLDERS] Error:', error);
    req.flash('error_msg', 'Error cargando carpetas sincronizadas');
    res.redirect('/admin');
  }
});

/**
 * GET /new - Formulario para nueva carpeta
 */
router.get('/new', (req, res) => {
  // Verificar si hay campaña seleccionada
  if (!req.tenantId) {
    req.flash('error_msg', 'Por favor selecciona una campaña antes de crear una carpeta sincronizada');
    return res.redirect('/campaigns');
  }

  res.render('admin/syncFolders/form', {
    title: 'Nueva Carpeta Sincronizada',
    user: req.user,
    folder: null,
    isEdit: false,
    campaign: req.tenant
  });
});

/**
 * POST / - Crear carpeta sincronizada
 */
router.post('/', async (req, res) => {
  try {
    // Verificar que hay campaña seleccionada
    if (!req.tenantId) {
      req.flash('error_msg', 'Por favor selecciona una campaña primero');
      return res.redirect('/campaigns');
    }

    // Extraer campos usando notación de punto para objetos anidados
    const publicUrl = req.body['config.publicUrl'] || req.body.config?.publicUrl;
    const folderName = req.body['config.folderName'] || req.body.config?.folderName;

    // Extraer allowedExtensions (viene como string separado por comas)
    const allowedExtensionsStr = req.body['fileFilters.allowedExtensions'] || req.body.fileFilters?.allowedExtensions || 'xlsx,xls,csv';
    const allowedExtensions = allowedExtensionsStr.split(',').map(ext => ext.trim()).filter(ext => ext);

    const syncFolder = new SyncFolder({
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      tipo: req.body.tipo,
      config: {
        publicUrl: publicUrl,
        folderName: folderName
      },
      syncConfig: {
        autoSync: req.body['syncConfig.autoSync'] === 'true',
        frequencyMinutes: parseInt(req.body['syncConfig.frequencyMinutes']) || 30,
        autoDetect: req.body['syncConfig.autoDetect'] === 'true',
        fixedType: req.body['syncConfig.autoDetect'] === 'true' ? null : req.body['syncConfig.fixedType'],
        processOnlyNew: req.body['syncConfig.processOnlyNew'] === 'true'
      },
      fileFilters: {
        allowedExtensions: allowedExtensions,
        namePattern: req.body['fileFilters.namePattern'] || '',
        maxSizeMB: parseInt(req.body['fileFilters.maxSizeMB']) || 25
      },
      campaignId: req.tenantId,
      creadoPor: req.user._id
    });

    await syncFolder.save();

    req.flash('success_msg', 'Carpeta sincronizada creada exitosamente');
    res.redirect('/admin/sync-folders');
  } catch (error) {
    console.error('[SYNC FOLDERS] Error creando:', error);
    req.flash('error_msg', 'Error creando carpeta: ' + error.message);
    res.redirect('/admin/sync-folders/new');
  }
});

/**
 * GET /:id/edit - Formulario de edición
 */
router.get('/:id/edit', async (req, res) => {
  try {
    // Verificar que hay campaña seleccionada
    if (!req.tenantId) {
      req.flash('error_msg', 'Por favor selecciona una campaña primero');
      return res.redirect('/campaigns');
    }

    const folder = await SyncFolder.findOne({
      _id: req.params.id,
      campaignId: req.tenantId
    });

    if (!folder) {
      req.flash('error_msg', 'Carpeta no encontrada');
      return res.redirect('/admin/sync-folders');
    }

    res.render('admin/syncFolders/form', {
      title: 'Editar Carpeta Sincronizada',
      user: req.user,
      folder,
      isEdit: true,
      campaign: req.tenant
    });
  } catch (error) {
    console.error('[SYNC FOLDERS] Error:', error);
    req.flash('error_msg', 'Error cargando carpeta');
    res.redirect('/admin/sync-folders');
  }
});

/**
 * POST /:id - Actualizar carpeta
 */
router.post('/:id', async (req, res) => {
  try {
    // Verificar que hay campaña seleccionada
    if (!req.tenantId) {
      req.flash('error_msg', 'Por favor selecciona una campaña primero');
      return res.redirect('/campaigns');
    }

    const syncFolder = await SyncFolder.findOne({
      _id: req.params.id,
      campaignId: req.tenantId
    });

    if (!syncFolder) {
      req.flash('error_msg', 'Carpeta no encontrada');
      return res.redirect('/admin/sync-folders');
    }

    // Extraer campos usando notación de punto para objetos anidados
    const publicUrl = req.body['config.publicUrl'] || req.body.config?.publicUrl;
    const folderName = req.body['config.folderName'] || req.body.config?.folderName;

    // Extraer allowedExtensions (viene como string separado por comas)
    const allowedExtensionsStr = req.body['fileFilters.allowedExtensions'] || req.body.fileFilters?.allowedExtensions || 'xlsx,xls,csv';
    const allowedExtensions = allowedExtensionsStr.split(',').map(ext => ext.trim()).filter(ext => ext);

    // Actualizar campos
    Object.assign(syncFolder, {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      tipo: req.body.tipo
    });

    Object.assign(syncFolder.config, {
      publicUrl: publicUrl,
      folderName: folderName
    });

    Object.assign(syncFolder.syncConfig, {
      autoSync: req.body['syncConfig.autoSync'] === 'true',
      frequencyMinutes: parseInt(req.body['syncConfig.frequencyMinutes']) || 30,
      autoDetect: req.body['syncConfig.autoDetect'] === 'true',
      fixedType: req.body['syncConfig.autoDetect'] === 'true' ? null : req.body['syncConfig.fixedType'],
      processOnlyNew: req.body['syncConfig.processOnlyNew'] === 'true'
    });

    Object.assign(syncFolder.fileFilters, {
      allowedExtensions: allowedExtensions,
      namePattern: req.body['fileFilters.namePattern'] || '',
      maxSizeMB: parseInt(req.body['fileFilters.maxSizeMB']) || 25
    });

    await syncFolder.save();

    req.flash('success_msg', 'Carpeta actualizada exitosamente');
    res.redirect('/admin/sync-folders');
  } catch (error) {
    console.error('[SYNC FOLDERS] Error actualizando:', error);
    req.flash('error_msg', 'Error actualizando carpeta: ' + error.message);
    res.redirect(`/admin/sync-folders/${req.params.id}/edit`);
  }
});

/**
 * POST /:id/sync - Sincronizar manualmente
 */
router.post('/:id/sync', async (req, res) => {
  try {
    const result = await syncFolder(req.params.id);

    req.flash('success_msg', `Sincronización completada: ${result.processed} procesados, ${result.errors} errores`);
    res.redirect('/admin/sync-folders');
  } catch (error) {
    console.error('[SYNC FOLDERS] Error sincronizando:', error);
    req.flash('error_msg', 'Error en sincronización: ' + error.message);
    res.redirect('/admin/sync-folders');
  }
});

/**
 * POST /:id/toggle - Activar/desactivar carpeta
 */
router.post('/:id/toggle', async (req, res) => {
  try {
    const syncFolder = await SyncFolder.findOne({
      _id: req.params.id,
      campaignId: req.tenantId
    });

    if (!syncFolder) {
      return res.status(404).json({ error: 'Carpeta no encontrada' });
    }

    syncFolder.syncStatus.activo = !syncFolder.syncStatus.activo;
    await syncFolder.save();

    res.json({
      success: true,
      activo: syncFolder.syncStatus.activo
    });
  } catch (error) {
    console.error('[SYNC FOLDERS] Error toggling:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /:id - Eliminar carpeta
 */
router.delete('/:id', async (req, res) => {
  try {
    await SyncFolder.deleteOne({
      _id: req.params.id,
      campaignId: req.tenantId
    });

    res.json({ success: true });
  } catch (error) {
    console.error('[SYNC FOLDERS] Error eliminando:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /test-detection - Probar detección de tipo de archivo
 */
router.post('/test-detection', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió archivo' });
    }

    const detection = detectDatasetType(req.file.buffer, req.file.originalname);

    res.json({
      success: true,
      filename: req.file.originalname,
      detection: {
        type: detection.type,
        confidence: (detection.confidence * 100).toFixed(1) + '%',
        matches: detection.matches,
        headers: detection.headers
      }
    });
  } catch (error) {
    console.error('[SYNC FOLDERS] Error en detección:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
