/**
 * Servicio de Sincronización Automática
 * Monitorea carpetas de Drive/SharePoint y procesa archivos automáticamente
 */

const axios = require('axios');
const { google } = require('googleapis');
const SyncFolder = require('../models/SyncFolder');
const { detectDatasetType, getProcessingConfig, canProcessFile } = require('./datasetDetector');

/**
 * Cliente de Google Drive
 */
class GoogleDriveClient {
  constructor(accessToken) {
    this.accessToken = accessToken;
    this.drive = google.drive({
      version: 'v3',
      auth: this.getOAuth2Client()
    });
  }

  getOAuth2Client() {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    if (this.accessToken) {
      oauth2Client.setCredentials({
        access_token: this.accessToken
      });
    }

    return oauth2Client;
  }

  /**
   * Lista archivos en una carpeta
   */
  async listFiles(folderId, modifiedAfter = null) {
    try {
      const query = [`'${folderId}' in parents`, 'trashed = false'];

      if (modifiedAfter) {
        query.push(`modifiedTime > '${modifiedAfter.toISOString()}'`);
      }

      const response = await this.drive.files.list({
        q: query.join(' and '),
        fields: 'files(id, name, mimeType, size, modifiedTime, createdTime)',
        orderBy: 'createdTime desc'
      });

      return response.data.files || [];
    } catch (error) {
      console.error('[GOOGLE DRIVE] Error listando archivos:', error);
      throw error;
    }
  }

  /**
   * Descarga un archivo
   */
  async downloadFile(fileId) {
    try {
      const response = await this.drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'arraybuffer' }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('[GOOGLE DRIVE] Error descargando archivo:', error);
      throw error;
    }
  }

  /**
   * Mueve un archivo a otra carpeta
   */
  async moveFile(fileId, newFolderId) {
    try {
      // Obtener padres actuales
      const file = await this.drive.files.get({
        fileId,
        fields: 'parents'
      });

      const previousParents = file.data.parents ? file.data.parents.join(',') : '';

      // Mover a nueva carpeta
      await this.drive.files.update({
        fileId,
        addParents: newFolderId,
        removeParents: previousParents,
        fields: 'id, parents'
      });

      return true;
    } catch (error) {
      console.error('[GOOGLE DRIVE] Error moviendo archivo:', error);
      return false;
    }
  }

  /**
   * Elimina un archivo
   */
  async deleteFile(fileId) {
    try {
      await this.drive.files.delete({ fileId });
      return true;
    } catch (error) {
      console.error('[GOOGLE DRIVE] Error eliminando archivo:', error);
      return false;
    }
  }
}

/**
 * Cliente de SharePoint (simplificado)
 */
class SharePointClient {
  constructor(accessToken, siteUrl) {
    this.accessToken = accessToken;
    this.siteUrl = siteUrl;
  }

  /**
   * Lista archivos en una carpeta
   */
  async listFiles(libraryName, folderPath) {
    try {
      const url = `${this.siteUrl}/_api/web/GetFolderByServerRelativeUrl('${libraryName}/${folderPath}')/Files`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Accept': 'application/json;odata=verbose'
        }
      });

      return response.data.d.results || [];
    } catch (error) {
      console.error('[SHAREPOINT] Error listando archivos:', error);
      throw error;
    }
  }

  /**
   * Descarga un archivo
   */
  async downloadFile(fileServerRelativeUrl) {
    try {
      const url = `${this.siteUrl}/_api/web/GetFileByServerRelativeUrl('${fileServerRelativeUrl}')/$value`;

      const response = await axios.get(url, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        responseType: 'arraybuffer'
      });

      return Buffer.from(response.data);
    } catch (error) {
      console.error('[SHAREPOINT] Error descargando archivo:', error);
      throw error;
    }
  }
}

/**
 * Procesa un archivo detectado
 */
async function processFile(fileBuffer, filename, syncFolder, tenantId) {
  try {
    console.log(`[AUTO SYNC] Procesando archivo: ${filename}`);

    // 1. Detectar tipo de dataset
    let detectedType = null;
    let confidence = 0;

    if (syncFolder.syncConfig.autoDetect) {
      const detection = detectDatasetType(fileBuffer, filename);
      detectedType = detection.type;
      confidence = detection.confidence;

      console.log(`[AUTO SYNC] Tipo detectado: ${detectedType} (confianza: ${(confidence * 100).toFixed(1)}%)`);

      if (!detectedType || confidence < 0.6) {
        return {
          success: false,
          error: `No se pudo detectar el tipo de dataset. Confianza: ${(confidence * 100).toFixed(1)}%`
        };
      }
    } else {
      detectedType = syncFolder.syncConfig.fixedType;
      console.log(`[AUTO SYNC] Tipo fijo configurado: ${detectedType}`);
    }

    // 2. Obtener configuración de procesamiento
    const processingConfig = getProcessingConfig(detectedType);

    if (!processingConfig) {
      return {
        success: false,
        error: `No hay configuración de procesamiento para tipo: ${detectedType}`
      };
    }

    // 3. Cargar el parser correspondiente
    const parser = await loadParser(processingConfig.parser);

    if (!parser) {
      return {
        success: false,
        error: `Parser no encontrado: ${processingConfig.parser}`
      };
    }

    // 4. Parsear el archivo
    const parsedData = await parser(fileBuffer, filename);

    if (!parsedData || !parsedData.records || parsedData.records.length === 0) {
      return {
        success: false,
        error: 'No se pudieron extraer registros del archivo'
      };
    }

    // 5. Guardar en base de datos
    const result = await saveToDatabase(
      parsedData,
      processingConfig,
      tenantId,
      syncFolder.creadoPor
    );

    return {
      success: true,
      detectedType,
      confidence,
      recordsImported: result.recordsImported,
      datasetId: result.datasetId
    };

  } catch (error) {
    console.error('[AUTO SYNC] Error procesando archivo:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Carga dinámicamente el parser apropiado
 */
async function loadParser(parserName) {
  try {
    // Mapeo de parsers
    const parserMap = {
      'parseRendimiento': require('../utils/parsers/genesysParsers').parseRendimiento,
      'parseEstados': require('../utils/parsers/genesysParsers').parseEstados,
      'parseProvisionAgregada': require('../utils/parsers/proviParser').parseProvisionAgregada,
      'parseAsistencia': require('../utils/parsers/asistenciaParser').parseAsistencia,
      'parseNomina': require('../utils/parsers/nominaParser').parseNomina,
      'parseTarifasCSV': require('../utils/parsers/tarifasParser').parseTarifasCSV
    };

    return parserMap[parserName] || null;
  } catch (error) {
    console.error('[AUTO SYNC] Error cargando parser:', error);
    return null;
  }
}

/**
 * Guarda datos parseados en la base de datos (IMPLEMENTACIÓN COMPLETA)
 */
async function saveToDatabase(parsedData, processingConfig, tenantId, userId) {
  const { getTenantModel } = require('../utils/tenantModelFactory');

  try {
    console.log(`[AUTO SYNC] Guardando ${parsedData.records.length} registros para tipo: ${processingConfig.modelType}`);

    // Determinar modelos según el tipo
    const { DatasetModel, RecordModel } = await getModels(processingConfig.modelType, tenantId);

    if (!DatasetModel || !RecordModel) {
      throw new Error(`Modelos no encontrados para tipo: ${processingConfig.modelType}`);
    }

    // Extraer año y mes de los datos parseados
    const { anio, mes } = extractPeriod(parsedData);

    // Buscar o crear dataset
    let dataset = await DatasetModel.findOne({ anio, mes, tipo: processingConfig.datasetTipo });

    if (!dataset) {
      // Crear nuevo dataset
      dataset = new DatasetModel({
        anio,
        mes,
        tipo: processingConfig.datasetTipo,
        nombreArchivo: parsedData.filename || `auto_sync_${Date.now()}.csv`,
        creadoPor: userId,
        totalRegistros: 0
      });
      await dataset.save();
      console.log(`[AUTO SYNC] Dataset creado: ${dataset._id}`);
    } else {
      // Limpiar registros existentes
      await RecordModel.deleteMany({ datasetId: dataset._id });
      console.log(`[AUTO SYNC] Dataset existente actualizado: ${dataset._id}`);
    }

    // Insertar nuevos registros con bulkWrite (más eficiente)
    const bulk = parsedData.records.map(record => ({
      insertOne: {
        document: {
          datasetId: dataset._id,
          ...record
        }
      }
    }));

    if (bulk.length > 0) {
      await RecordModel.bulkWrite(bulk);
      console.log(`[AUTO SYNC] ${bulk.length} registros insertados`);
    }

    // Actualizar total de registros en el dataset
    dataset.totalRegistros = bulk.length;
    dataset.updatedAt = new Date();
    await dataset.save();

    return {
      recordsImported: bulk.length,
      datasetId: dataset._id.toString()
    };

  } catch (error) {
    console.error('[AUTO SYNC] Error guardando en base de datos:', error);
    throw error;
  }
}

/**
 * Obtiene los modelos apropiados según el tipo de dataset
 */
async function getModels(modelType, tenantId) {
  const { getTenantModel } = require('../utils/tenantModelFactory');

  const modelMap = {
    'genesys-rendimiento': {
      DatasetModel: getTenantModel('GenesysDataset', tenantId),
      RecordModel: getTenantModel('GenesysRecord', tenantId)
    },
    'genesys-estados': {
      DatasetModel: getTenantModel('GenesysDataset', tenantId),
      RecordModel: getTenantModel('GenesysRecord', tenantId)
    },
    'genesys-provision-agregada': {
      DatasetModel: getTenantModel('ProvisionDataset', tenantId),
      RecordModel: getTenantModel('ProvisionRecord', tenantId)
    },
    'asistencia': {
      DatasetModel: getTenantModel('AsistenciaDataset', tenantId),
      RecordModel: getTenantModel('AsistenciaRecord', tenantId)
    },
    'nomina': {
      DatasetModel: getTenantModel('NominaDataset', tenantId),
      RecordModel: getTenantModel('NominaRecord', tenantId)
    },
    'tarifas': {
      DatasetModel: getTenantModel('Tarifa', tenantId),
      RecordModel: null // Tarifas no usa RecordModel separado
    },
    'asesores': {
      DatasetModel: getTenantModel('Asesor', tenantId),
      RecordModel: null // Asesores son registros directos
    }
  };

  return modelMap[modelType] || {};
}

/**
 * Extrae el período (año/mes) de los datos parseados
 */
function extractPeriod(parsedData) {
  // Intentar obtener de metadatos
  if (parsedData.metadata && parsedData.metadata.anio && parsedData.metadata.mes) {
    return {
      anio: parseInt(parsedData.metadata.anio, 10),
      mes: parseInt(parsedData.metadata.mes, 10)
    };
  }

  // Intentar obtener del primer registro
  if (parsedData.records && parsedData.records.length > 0) {
    const firstRecord = parsedData.records[0];

    // Buscar campo de fecha
    const dateField = firstRecord.fecha || firstRecord.fechaInteraccion || firstRecord.date;

    if (dateField) {
      const date = new Date(dateField);
      if (!isNaN(date.getTime())) {
        return {
          anio: date.getFullYear(),
          mes: date.getMonth() + 1
        };
      }
    }
  }

  // Por defecto, usar mes/año actuales
  const now = new Date();
  return {
    anio: now.getFullYear(),
    mes: now.getMonth() + 1
  };
}

/**
 * Sincroniza una carpeta configurada
 */
async function syncFolder(syncFolderId) {
  try {
    const syncFolder = await SyncFolder.findById(syncFolderId)
      .populate('campaignId')
      .populate('creadoPor');

    if (!syncFolder || !syncFolder.syncStatus.activo) {
      console.log(`[AUTO SYNC] Carpeta ${syncFolderId} no activa o no encontrada`);
      return;
    }

    console.log(`[AUTO SYNC] Sincronizando carpeta: ${syncFolder.nombre}`);

    let client;
    let files = [];

    // Crear cliente según el tipo
    if (syncFolder.tipo === 'google-drive') {
      client = new GoogleDriveClient(syncFolder.config.accessToken);
      files = await client.listFiles(
        syncFolder.config.folderId,
        syncFolder.fileFilters.processAfterDate
      );
    } else if (syncFolder.tipo === 'sharepoint') {
      client = new SharePointClient(
        syncFolder.config.accessToken,
        syncFolder.config.siteUrl
      );
      files = await client.listFiles(
        syncFolder.config.libraryName,
        syncFolder.config.folderPath
      );
    }

    console.log(`[AUTO SYNC] ${files.length} archivos encontrados`);

    let processed = 0;
    let errors = 0;

    for (const file of files) {
      const fileId = file.id || file.UniqueId;
      const filename = file.name || file.Name;

      // Verificar si ya fue procesado
      if (syncFolder.syncConfig.processOnlyNew && syncFolder.wasFileProcessed(fileId)) {
        console.log(`[AUTO SYNC] Archivo ya procesado: ${filename}`);
        continue;
      }

      // Verificar extensión
      if (!canProcessFile(filename)) {
        console.log(`[AUTO SYNC] Extensión no permitida: ${filename}`);
        continue;
      }

      try {
        // Descargar archivo
        let fileBuffer;
        if (syncFolder.tipo === 'google-drive') {
          fileBuffer = await client.downloadFile(fileId);
        } else {
          fileBuffer = await client.downloadFile(file.ServerRelativeUrl);
        }

        // Procesar archivo
        const result = await processFile(
          fileBuffer,
          filename,
          syncFolder,
          syncFolder.campaignId._id
        );

        // Registrar resultado
        await syncFolder.addProcessedFile({
          filename,
          fileId,
          detectedType: result.detectedType,
          status: result.success ? 'success' : 'error',
          error: result.error,
          recordsImported: result.recordsImported
        });

        if (result.success) {
          processed++;

          // Mover o eliminar archivo si está configurado
          if (syncFolder.syncConfig.deleteAfterProcess) {
            await client.deleteFile(fileId);
          } else if (syncFolder.syncConfig.moveAfterProcess && syncFolder.syncConfig.moveToFolder) {
            await client.moveFile(fileId, syncFolder.syncConfig.moveToFolder);
          }
        } else {
          errors++;
        }

      } catch (error) {
        console.error(`[AUTO SYNC] Error procesando ${filename}:`, error);
        errors++;

        await syncFolder.addProcessedFile({
          filename,
          fileId,
          status: 'error',
          error: error.message
        });
      }
    }

    // Actualizar estado de sincronización
    await syncFolder.updateSyncStatus(files.length, processed, errors);

    console.log(`[AUTO SYNC] Sincronización completa: ${processed} procesados, ${errors} errores`);

    return { processed, errors, total: files.length };

  } catch (error) {
    console.error('[AUTO SYNC] Error en sincronización:', error);
    throw error;
  }
}

/**
 * Sincroniza todas las carpetas activas
 */
async function syncAllFolders() {
  try {
    const now = new Date();

    // Buscar carpetas que necesitan sincronización
    const folders = await SyncFolder.find({
      'syncStatus.activo': true,
      'syncConfig.autoSync': true,
      $or: [
        { 'syncStatus.proximaSync': { $lte: now } },
        { 'syncStatus.proximaSync': null }
      ]
    });

    console.log(`[AUTO SYNC] Sincronizando ${folders.length} carpetas`);

    for (const folder of folders) {
      try {
        await syncFolder(folder._id);
      } catch (error) {
        console.error(`[AUTO SYNC] Error sincronizando carpeta ${folder._id}:`, error);
      }
    }

  } catch (error) {
    console.error('[AUTO SYNC] Error en sincronización masiva:', error);
  }
}

module.exports = {
  syncFolder,
  syncAllFolders,
  processFile,
  GoogleDriveClient,
  SharePointClient
};
