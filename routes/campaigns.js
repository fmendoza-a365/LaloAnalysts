const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const ctrl = require('../controllers/campaignsController');

// Vista principal de selección de campañas
router.get('/', ensureAuthenticated, ctrl.list);

// Seleccionar una campaña
router.get('/select/:id', ensureAuthenticated, ctrl.select);

// Vista de edición de campaña
router.get('/edit/:id', ensureAuthenticated, ctrl.editView);

// Actualizar campaña
router.post('/edit/:id', ensureAuthenticated, ctrl.editPost);

// Crear nueva campaña
router.post('/create', ensureAuthenticated, ctrl.create);

// Eliminar campaña
router.post('/delete/:id', ensureAuthenticated, ctrl.remove);

module.exports = router;
