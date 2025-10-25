const express = require('express');
const router = express.Router();
const { procesarIndicadores } = require('../controllers/indicadoresController');
const multer = require('multer');
const path = require('path');

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') return cb(null, true);
    cb(new Error('Formato de archivo no soportado'));
  },
  limits: { fileSize: 15 * 1024 * 1024 }
});

router.post('/procesar', upload.single('asistencias'), procesarIndicadores);

module.exports = router;
