/**
 * Modelo para Carpetas Sincronizadas
 * Almacena configuración de carpetas de Drive/SharePoint para sync automático
 */

const mongoose = require('mongoose');

const syncFolderSchema = new mongoose.Schema({
  // Información básica
  nombre: {
    type: String,
    required: true,
    trim: true
  },
  descripcion: {
    type: String
  },

  // Tipo de servicio
  tipo: {
    type: String,
    enum: ['google-drive', 'sharepoint', 'onedrive'],
    required: true
  },

  // Configuración del servicio
  config: {
    // URL pública de la carpeta (Google Drive o SharePoint con permisos de lectura pública)
    publicUrl: {
      type: String,
      required: true
    },

    // Metadatos opcionales para mejor gestión
    folderId: String,        // ID de la carpeta (extraído de la URL)
    folderName: String,      // Nombre de la carpeta para referencia

    // Para SharePoint/OneDrive (opcionales, solo si se necesita más contexto)
    siteUrl: String,         // URL del sitio de SharePoint
    libraryName: String,     // Nombre de la biblioteca
    folderPath: String       // Ruta de la carpeta
  },

  // Configuración de sincronización
  syncConfig: {
    // Automático o manual
    autoSync: {
      type: Boolean,
      default: true
    },

    // Frecuencia en minutos (default: 30 min)
    frequencyMinutes: {
      type: Number,
      default: 30,
      min: 5,
      max: 1440 // máximo 24 horas
    },

    // Auto-detectar tipo de dataset
    autoDetect: {
      type: Boolean,
      default: true
    },

    // Si no auto-detecta, tipo fijo
    fixedType: {
      type: String,
      enum: [
        'genesys-rendimiento',
        'genesys-estados',
        'genesys-provision-agregada',
        'asistencia',
        'nomina',
        'tarifas',
        'asesores',
        null
      ]
    },

    // Procesar solo archivos nuevos
    processOnlyNew: {
      type: Boolean,
      default: true
    },

    // Eliminar archivo después de procesar
    deleteAfterProcess: {
      type: Boolean,
      default: false
    },

    // Mover a carpeta de procesados
    moveAfterProcess: {
      type: Boolean,
      default: true
    },
    moveToFolder: String
  },

  // Estado de sincronización
  syncStatus: {
    activo: {
      type: Boolean,
      default: true
    },
    ultimaSync: Date,
    proximaSync: Date,
    archivosEncontrados: {
      type: Number,
      default: 0
    },
    archivosProcesados: {
      type: Number,
      default: 0
    },
    archivosError: {
      type: Number,
      default: 0
    },
    ultimoError: {
      mensaje: String,
      fecha: Date
    }
  },

  // Filtros de archivos
  fileFilters: {
    // Extensiones permitidas
    allowedExtensions: {
      type: [String],
      default: ['xlsx', 'xls', 'csv']
    },

    // Patrón de nombre (regex)
    namePattern: String,

    // Tamaño máximo en MB
    maxSizeMB: {
      type: Number,
      default: 25
    },

    // Solo archivos más nuevos que esta fecha
    processAfterDate: Date
  },

  // Historial de archivos procesados
  processedFiles: [{
    filename: String,
    fileId: String,
    processedAt: Date,
    detectedType: String,
    status: {
      type: String,
      enum: ['success', 'error', 'skipped']
    },
    error: String,
    recordsImported: Number
  }],

  // Campaña asociada (para multi-tenant)
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign',
    required: true,
    index: true
  },

  // Usuario que creó la configuración
  creadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },

  // Metadatos
  activo: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Índices
syncFolderSchema.index({ campaignId: 1, activo: 1 });
syncFolderSchema.index({ tipo: 1, 'syncStatus.activo': 1 });
syncFolderSchema.index({ 'syncStatus.proximaSync': 1, 'syncStatus.activo': 1 });

// Método para actualizar última sincronización
syncFolderSchema.methods.updateSyncStatus = function(found, processed, errors) {
  this.syncStatus.ultimaSync = new Date();
  this.syncStatus.proximaSync = new Date(Date.now() + this.syncConfig.frequencyMinutes * 60000);
  this.syncStatus.archivosEncontrados += found;
  this.syncStatus.archivosProcesados += processed;
  this.syncStatus.archivosError += errors;
  return this.save();
};

// Método para agregar archivo procesado al historial
syncFolderSchema.methods.addProcessedFile = function(fileInfo) {
  this.processedFiles.push({
    filename: fileInfo.filename,
    fileId: fileInfo.fileId,
    processedAt: new Date(),
    detectedType: fileInfo.detectedType,
    status: fileInfo.status,
    error: fileInfo.error,
    recordsImported: fileInfo.recordsImported
  });

  // Mantener solo últimos 100 archivos en historial
  if (this.processedFiles.length > 100) {
    this.processedFiles = this.processedFiles.slice(-100);
  }

  return this.save();
};

// Método para verificar si un archivo ya fue procesado
syncFolderSchema.methods.wasFileProcessed = function(fileId) {
  return this.processedFiles.some(f => f.fileId === fileId && f.status === 'success');
};

module.exports = mongoose.model('SyncFolder', syncFolderSchema);
