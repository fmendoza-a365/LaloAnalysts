/**
 * Tenant Model Factory
 * Genera modelos dinámicos de Mongoose por tenant (campaña)
 *
 * Cada tenant tiene sus propias colecciones con prefijo: tenant_<campaignId>_<modelName>
 */

const mongoose = require('mongoose');

// Cache de modelos por tenant para evitar recompilaciones
const tenantModelsCache = new Map();

/**
 * Schemas base de los modelos (sin compilar)
 * Estos son los schemas que ya tienes en /models
 */
const schemas = {};

/**
 * Registrar un schema base para ser usado por tenants
 * @param {string} modelName - Nombre del modelo (ej: 'ProvisionRecord')
 * @param {mongoose.Schema} schema - Schema de Mongoose
 */
function registerSchema(modelName, schema) {
  schemas[modelName] = schema;
}

/**
 * Obtener modelo de Mongoose para un tenant específico
 * @param {string} modelName - Nombre del modelo (ej: 'ProvisionRecord')
 * @param {string} tenantId - ID del tenant/campaña
 * @returns {mongoose.Model} Modelo de Mongoose para ese tenant
 */
function getTenantModel(modelName, tenantId) {
  // Validar parámetros
  if (!modelName) {
    throw new Error('modelName es requerido');
  }

  if (!tenantId) {
    throw new Error('tenantId es requerido para obtener modelo de tenant');
  }

  // Verificar que el schema esté registrado
  if (!schemas[modelName]) {
    throw new Error(`Schema "${modelName}" no está registrado. Usa registerSchema() primero.`);
  }

  // Clave única para el cache: tenant_campaignId_ModelName
  const cacheKey = `tenant_${tenantId}_${modelName}`;

  // Si ya existe en cache, retornarlo
  if (tenantModelsCache.has(cacheKey)) {
    return tenantModelsCache.get(cacheKey);
  }

  // Nombre de la colección: tenant_<campaignId>_<collectionName>
  const collectionName = `tenant_${tenantId}_${modelName.toLowerCase()}s`;

  // Crear nuevo modelo con el schema registrado
  try {
    // Clonar el schema para evitar conflictos
    const clonedSchema = schemas[modelName].clone();

    // Compilar el modelo para este tenant
    const TenantModel = mongoose.model(cacheKey, clonedSchema, collectionName);

    // Guardar en cache
    tenantModelsCache.set(cacheKey, TenantModel);

    console.log(`[TENANT] Modelo creado: ${cacheKey} -> colección: ${collectionName}`);

    return TenantModel;
  } catch (error) {
    console.error(`[TENANT] Error creando modelo ${modelName} para tenant ${tenantId}:`, error);
    throw error;
  }
}

/**
 * Limpiar cache de modelos (útil para testing o hot reload)
 * @param {string} tenantId - Opcional: limpiar solo modelos de un tenant específico
 */
function clearCache(tenantId = null) {
  if (tenantId) {
    // Limpiar solo modelos de un tenant
    const keysToDelete = [];
    for (const key of tenantModelsCache.keys()) {
      if (key.startsWith(`tenant_${tenantId}_`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => {
      mongoose.deleteModel(key);
      tenantModelsCache.delete(key);
    });
    console.log(`[TENANT] Cache limpiado para tenant: ${tenantId} (${keysToDelete.length} modelos)`);
  } else {
    // Limpiar todo el cache
    tenantModelsCache.forEach((model, key) => {
      mongoose.deleteModel(key);
    });
    tenantModelsCache.clear();
    console.log('[TENANT] Cache de modelos completamente limpiado');
  }
}

/**
 * Obtener estadísticas del cache
 */
function getCacheStats() {
  const stats = {
    totalModels: tenantModelsCache.size,
    registeredSchemas: Object.keys(schemas).length,
    modelsByTenant: {}
  };

  // Agrupar por tenant
  for (const key of tenantModelsCache.keys()) {
    const match = key.match(/^tenant_([^_]+)_/);
    if (match) {
      const tenantId = match[1];
      if (!stats.modelsByTenant[tenantId]) {
        stats.modelsByTenant[tenantId] = 0;
      }
      stats.modelsByTenant[tenantId]++;
    }
  }

  return stats;
}

/**
 * Verificar si un modelo está registrado
 * @param {string} modelName - Nombre del modelo
 * @returns {boolean}
 */
function isSchemaRegistered(modelName) {
  return schemas.hasOwnProperty(modelName);
}

/**
 * Listar todos los schemas registrados
 * @returns {string[]} Array con nombres de modelos registrados
 */
function getRegisteredSchemas() {
  return Object.keys(schemas);
}

module.exports = {
  registerSchema,
  getTenantModel,
  clearCache,
  getCacheStats,
  isSchemaRegistered,
  getRegisteredSchemas
};
