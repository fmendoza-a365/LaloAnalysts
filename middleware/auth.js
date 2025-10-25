const Role = require('../models/Role');

// Middleware para asegurar que el usuario esté autenticado
exports.ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated()) {
    return next();
  }
  req.flash('error_msg', 'Por favor inicia sesión para ver este recurso');
  res.redirect('/auth/login');
};

// Middleware para redirigir usuarios autenticados
exports.forwardAuthenticated = (req, res, next) => {
  if (!req.isAuthenticated()) {
    return next();
  }
  res.redirect('/dashboard');
};

// Middleware para verificar el rol del usuario
exports.checkRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'No autenticado' });
    }
    
    if (typeof roles === 'string') {
      roles = [roles];
    }
    
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'No autorizado' });
    }
    
    next();
  };
};

// Middleware de permisos finos por módulo/acción respaldado por el modelo Role
exports.checkPermission = (modulo, accion) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: 'No autenticado' });
      }

      // Admin clásico siempre permitido
      if (req.user.role === 'admin') {
        return next();
      }

      // Buscar definición de rol en la colección Role
      const role = await Role.findOne({ nombre: req.user.role, activo: true });
      if (!role) {
        return res.status(403).json({ message: 'No autorizado' });
      }

      const permisosModulo = (role.permisos && role.permisos[modulo]) || {};
      if (permisosModulo[accion]) {
        return next();
      }

      // Permiso específico no otorgado
      if (req.accepts('html')) {
        req.flash('error_msg', 'No tienes permisos para realizar esta acción');
        return res.redirect('back');
      }
      return res.status(403).json({ message: 'Permiso denegado' });
    } catch (e) {
      console.error(e);
      if (req.accepts('html')) {
        req.flash('error_msg', 'Error verificando permisos');
        return res.redirect('back');
      }
      return res.status(500).json({ message: 'Error de permisos' });
    }
  };
};
