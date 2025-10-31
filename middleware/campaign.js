/**
 * Campaign Middleware (DEPRECATED - Usa tenant.js en su lugar)
 * Mantenido por compatibilidad hacia atrás
 *
 * MIGRACIÓN:
 * - Reemplaza requireCampaign por requireTenant de tenant.js
 * - El nuevo middleware usa req.tenantId en lugar de req.session.selectedCampaign
 */

const { requireTenant } = require('./tenant');

module.exports = {
  // DEPRECATED: Usa requireTenant de tenant.js
  // Mantenido por compatibilidad - delega al nuevo middleware
  requireCampaign: requireTenant,

  // NUEVO: Exportar el middleware de tenant directamente
  requireTenant
};
