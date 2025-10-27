const express = require('express');
const router = express.Router();

// Ruta de documentación
router.get('/', (req, res) => {
  res.render('docs/index', {
    title: 'Documentación',
    user: req.user
  });
});

module.exports = router;
