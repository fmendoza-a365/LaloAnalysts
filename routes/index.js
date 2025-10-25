const express = require('express');
const router = express.Router();
const { forwardAuthenticated } = require('../middleware/auth');

// Página de Inicio
router.get('/', forwardAuthenticated, (req, res) => {
  res.render('index', { 
    title: 'Bienvenido a A365',
    user: req.user
  });
});

// Página Acerca de
router.get('/about', (req, res) => {
  res.render('about', { 
    title: 'Acerca de A365',
    user: req.user
  });
});

module.exports = router;
