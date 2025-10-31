/**
 * Mapeos de campañas y mesas
 * Centraliza todos los mapeos hardcodeados de nombres
 */

/**
 * Mapeo de nombres de campaña a nombres de mesa
 * Usado en SRR y otros reportes
 */
const MAPEO_CAMPANA_MESA = {
  'BN - Mesa de Gestion Comercial': 'Gestion Comercial',
  'BN- GESTIÓN DE RECLAMOS DE PRIMER NIVEL Y REQ': 'Mesa de Reclamos',
  'BN- PREVENCIÓN DE FRAUDE PRIMER NIVEL': 'Prevencion de Fraude',
  'BN - Mesa de Soporte': 'Mesa de Soporte',
  'BN - Operaciones': 'Operaciones',
  'BN - Administracion': 'Administracion',
  'BN - Tecnologia': 'Tecnologia',
  'BN - Call Center': 'Call Center',
  'BN - Ventas': 'Ventas',
  'BN - Cobranzas': 'Cobranzas',
  'BN - Atencion al Cliente': 'Atencion al Cliente',
  'BN - BackOffice': 'BackOffice',
  'BN - Calidad': 'Calidad',
  'BN - Capacitacion': 'Capacitacion',
  'BN - Recursos Humanos': 'Recursos Humanos'
};

/**
 * Normalización de nombres de campaña
 * Para unificar nombres con variaciones
 */
const NORMALIZE_CAMPAIGN_NAME = {
  'bn - mesa de gestion comercial': 'Gestion Comercial',
  'mesa de gestion comercial': 'Gestion Comercial',
  'gestion comercial': 'Gestion Comercial',
  'bn- gestión de reclamos de primer nivel y req': 'Mesa de Reclamos',
  'mesa de reclamos': 'Mesa de Reclamos',
  'reclamos': 'Mesa de Reclamos',
  'bn- prevención de fraude primer nivel': 'Prevencion de Fraude',
  'prevencion de fraude': 'Prevencion de Fraude',
  'fraude': 'Prevencion de Fraude'
};

/**
 * Obtiene el nombre de mesa normalizado
 * @param {string} campanaNombre - Nombre original de la campaña
 * @returns {string} Nombre normalizado de la mesa
 */
function obtenerNombreMesa(campanaNombre) {
  if (!campanaNombre) return 'Sin Mesa';

  // Buscar mapeo exacto
  if (MAPEO_CAMPANA_MESA[campanaNombre]) {
    return MAPEO_CAMPANA_MESA[campanaNombre];
  }

  // Buscar mapeo normalizado (case-insensitive)
  const normalizedKey = campanaNombre.toLowerCase().trim();
  if (NORMALIZE_CAMPAIGN_NAME[normalizedKey]) {
    return NORMALIZE_CAMPAIGN_NAME[normalizedKey];
  }

  // Si no hay mapeo, retornar el nombre original limpio
  return campanaNombre.trim();
}

/**
 * Lista de todas las mesas únicas
 */
const MESAS_DISPONIBLES = [...new Set(Object.values(MAPEO_CAMPANA_MESA))].sort();

module.exports = {
  MAPEO_CAMPANA_MESA,
  NORMALIZE_CAMPAIGN_NAME,
  obtenerNombreMesa,
  MESAS_DISPONIBLES
};
