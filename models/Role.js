const mongoose = require('mongoose');

// Modelo de Rol con matriz de permisos por módulo/acción
// Ejemplo de "permisos": {
//   dashbords: { ver_listado: true, ver_detalle: true, crear: false, editar: true, eliminar: false, activar_desactivar: true, editar_roles: true, ver_todos: true, ver_inactivos: true },
//   usuarios: { ver_listado: true, crear: true, cambiar_rol: true, reset_password: true, bloquear: true },
//   finanzas_tarifas: { ver: true, crear: true, editar: true, eliminar: false, versionar: false, simular_pxq: true },
//   finanzas_volumenes: { cargar: true, previsualizar: true, validar: true, rollback: false, reproceso: false }
// }
const roleSchema = new mongoose.Schema({
  nombre: { type: String, required: true, unique: true, trim: true },
  descripcion: { type: String, trim: true },
  activo: { type: Boolean, default: true },
  permisos: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true });

module.exports = mongoose.model('Role', roleSchema);
