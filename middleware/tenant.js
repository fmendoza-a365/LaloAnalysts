/**
 * Tenant Middleware
 * Detecta e inyecta el contexto de tenant (campaignId) en cada request
 *
 * Soporta múltiples formas de detección:
 * 1. URL params: /campaigns/:campaignId/...
 * 2. Session: req.session.selectedCampaign (modo actual - backward compatible)
 * 3. Query param: ?campaignId=xxx (para APIs)
 */

const Campaign = require('../models/Campaign');

/**
 * Middleware principal que inyecta req.tenantId
 * Mantiene compatibilidad con el sistema actual basado en sesión
 */
async function detectTenant(req, res, next) {
  try {
    let tenantId = null;

    // Prioridad 1: URL params (para futuras rutas multi-tenant)
    if (req.params.campaignId) {
      tenantId = req.params.campaignId;
    }
    // Prioridad 2: Session (sistema actual - BACKWARD COMPATIBLE)
    else if (req.session && req.session.selectedCampaign) {
      tenantId = req.session.selectedCampaign;
    }
    // Prioridad 3: Query param (para APIs y requests específicos)
    else if (req.query && req.query.campaignId) {
      tenantId = req.query.campaignId;
    }

    // Inyectar tenantId en el request
    req.tenantId = tenantId;

    // Si hay tenantId, cargar información de la campaña
    if (tenantId) {
      try {
        const campaign = await Campaign.findById(tenantId);
        if (campaign) {
          req.tenant = campaign; // Información completa de la campaña
          req.tenantName = campaign.nombre;
        } else {
          console.warn(`[TENANT] Campaña no encontrada: ${tenantId}`);
          // No bloqueamos, solo advertimos
          req.tenant = null;
        }
      } catch (campaignError) {
        console.error(`[TENANT] Error cargando campaña ${tenantId}:`, campaignError);
        req.tenant = null;
      }
    }

    // Log para debugging (opcional - comentar en producción)
    if (tenantId) {
      console.log(`[TENANT] Request: ${req.method} ${req.path} → Tenant: ${tenantId} (${req.tenantName || 'N/A'})`);
    }

    next();
  } catch (error) {
    console.error('[TENANT] Error en middleware de tenant:', error);
    // No bloqueamos la request, seguimos sin tenant
    req.tenantId = null;
    req.tenant = null;
    next();
  }
}

/**
 * Middleware que REQUIERE un tenant (campaña seleccionada)
 * Reemplaza al middleware campaign.requireCampaign existente
 * Mantiene compatibilidad total con el sistema actual
 */
function requireTenant(req, res, next) {
  if (!req.tenantId) {
    req.flash('error_msg', 'Por favor selecciona una campaña primero');
    // Guardar la URL original para redirigir después de seleccionar campaña
    req.session.returnTo = req.originalUrl;
    return res.redirect('/campaigns');
  }

  // Verificar que la campaña existe y está activa
  if (!req.tenant) {
    req.flash('error_msg', 'La campaña seleccionada no existe o fue eliminada');
    delete req.session.selectedCampaign; // Limpiar sesión
    req.session.returnTo = req.originalUrl;
    return res.redirect('/campaigns');
  }

  if (!req.tenant.activa) {
    req.flash('error_msg', 'La campaña seleccionada está inactiva');
    req.session.returnTo = req.originalUrl;
    return res.redirect('/campaigns');
  }

  next();
}

/**
 * Helper: Obtener modelo multi-tenant desde el request
 * Uso en rutas: const ProvisionRecord = getTenantModelFromReq(req, 'ProvisionRecord');
 */
function getTenantModelFromReq(req, modelName) {
  if (!req.tenantId) {
    throw new Error('No hay tenant seleccionado. Usa requireTenant() middleware primero.');
  }

  const { getTenantModel } = require('../utils/tenantModelFactory');
  return getTenantModel(modelName, req.tenantId);
}

/**
 * Middleware opcional: Log de tenant para debugging
 */
function logTenant(req, res, next) {
  if (req.tenantId) {
    console.log(`[TENANT DEBUG] ${req.method} ${req.originalUrl}`);
    console.log(`  → Tenant ID: ${req.tenantId}`);
    console.log(`  → Tenant Name: ${req.tenantName || 'N/A'}`);
    console.log(`  → User: ${req.user ? req.user.username : 'N/A'}`);
  }
  next();
}

/**
 * Helper: Verificar si el request tiene un tenant válido
 */
function hasTenant(req) {
  return !!(req.tenantId && req.tenant);
}

/**
 * Helper: Obtener tenantId o lanzar error
 */
function getTenantId(req) {
  if (!req.tenantId) {
    throw new Error('No tenant found in request. Use requireTenant() middleware.');
  }
  return req.tenantId;
}

module.exports = {
  detectTenant,          // Middleware principal (usar en app.js globalmente)
  requireTenant,         // Middleware para rutas que requieren campaña
  getTenantModelFromReq, // Helper para obtener modelos
  logTenant,            // Middleware opcional de debugging
  hasTenant,            // Helper de verificación
  getTenantId           // Helper para obtener tenantId con validación
};
