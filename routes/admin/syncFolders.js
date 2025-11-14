/**
 * Rutas de administración para Carpetas Sincronizadas
 */

const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkRole } = require('../../middleware/auth');
const { requireTenant } = require('../../middleware/tenant');
const SyncFolder = require('../../models/SyncFolder');
const { syncFolder } = require('../../services/autoSyncService');
const { detectDatasetType, canProcessFile } = require('../../services/datasetDetector');
const multer = require('multer');

// Middleware - Solo admins
router.use(ensureAuthenticated, requireTenant, checkRole(['admin']));

// Configurar multer para pruebas de archivos
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

/**
 * GET / - Listar carpetas sincronizadas
 */
router.get('/', async (req, res) => {
  try {
    const syncFolders = await SyncFolder.find({ campaignId: req.tenantId })
      .populate('creadoPor', 'username')
      .sort({ createdAt: -1 });

    res.render('admin/syncFolders/index', {
      title: 'Carpetas Sincronizadas',
      user: req.user,
      syncFolders
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
  res.render('admin/syncFolders/form', {
    title: 'Nueva Carpeta Sincronizada',
    user: req.user,
    syncFolder: null,
    action: 'create'
  });
});

/**
 * POST / - Crear carpeta sincronizada
 */
router.post('/', async (req, res) => {
  try {
    const {
      nombre,
      descripcion,
      tipo,
      folderId,
      folderUrl,
      siteUrl,
      libraryName,
      folderPath,
      autoSync,
      frequencyMinutes,
      autoDetect,
      fixedType,
      processOnlyNew,
      deleteAfterProcess,
      moveAfterProcess,
      moveToFolder
    } = req.body;

    const syncFolder = new SyncFolder({
      nombre,
      descripcion,
      tipo,
      config: {
        folderId,
        folderUrl,
        siteUrl,
        libraryName,
        folderPath
      },
      syncConfig: {
        autoSync: autoSync === 'true',
        frequencyMinutes: parseInt(frequencyMinutes) || 30,
        autoDetect: autoDetect === 'true',
        fixedType: autoDetect === 'true' ? null : fixedType,
        processOnlyNew: processOnlyNew === 'true',
        deleteAfterProcess: deleteAfterProcess === 'true',
        moveAfterProcess: moveAfterProcess === 'true',
        moveToFolder
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
    const syncFolder = await SyncFolder.findOne({
      _id: req.params.id,
      campaignId: req.tenantId
    });

    if (!syncFolder) {
      req.flash('error_msg', 'Carpeta no encontrada');
      return res.redirect('/admin/sync-folders');
    }

    res.render('admin/syncFolders/form', {
      title: 'Editar Carpeta Sincronizada',
      user: req.user,
      syncFolder,
      action: 'edit'
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
    const syncFolder = await SyncFolder.findOne({
      _id: req.params.id,
      campaignId: req.tenantId
    });

    if (!syncFolder) {
      req.flash('error_msg', 'Carpeta no encontrada');
      return res.redirect('/admin/sync-folders');
    }

    // Actualizar campos
    Object.assign(syncFolder, {
      nombre: req.body.nombre,
      descripcion: req.body.descripcion,
      tipo: req.body.tipo
    });

    Object.assign(syncFolder.config, {
      folderId: req.body.folderId,
      folderUrl: req.body.folderUrl,
      siteUrl: req.body.siteUrl,
      libraryName: req.body.libraryName,
      folderPath: req.body.folderPath
    });

    Object.assign(syncFolder.syncConfig, {
      autoSync: req.body.autoSync === 'true',
      frequencyMinutes: parseInt(req.body.frequencyMinutes) || 30,
      autoDetect: req.body.autoDetect === 'true',
      fixedType: req.body.autoDetect === 'true' ? null : req.body.fixedType,
      processOnlyNew: req.body.processOnlyNew === 'true',
      deleteAfterProcess: req.body.deleteAfterProcess === 'true',
      moveAfterProcess: req.body.moveAfterProcess === 'true',
      moveToFolder: req.body.moveToFolder
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
