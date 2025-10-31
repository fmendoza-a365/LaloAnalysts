const Joi = require('joi');
const { parseAsistenciasBuffer } = require('../utils/parsers/parseAsistencias');
const { calcularIndicadores } = require('../services/indicadoresService');
const { buildWorkbookBase64, buildCsv } = require('../utils/reportBuilders');

const schema = Joi.object({
  rendimiento: Joi.array().items(Joi.object({
    DNI: Joi.alternatives(Joi.string(), Joi.number()).required(),
    llamadasAtendidas: Joi.number().min(0).optional(),
    TMO: Joi.number().min(0).optional(),
    reclamos: Joi.number().min(0).optional(),
    reclamosRate: Joi.number().min(0).max(1).optional()
  })).optional(),
  calidad: Joi.array().items(Joi.object({
    DNI: Joi.alternatives(Joi.string(), Joi.number()).required(),
    calidad: Joi.number().min(0).max(100).required(),
    satisfaccion: Joi.number().min(0).max(100).optional()
  })).optional(),
  esquema: Joi.object({}).unknown(true).optional(),
  metaLlamadasBase: Joi.number().min(0).default(0)
});

exports.procesarIndicadores = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Debe adjuntar el archivo de asistencias (.csv o .xlsx) como campo "asistencias"' });
    }

    const { error, value } = schema.validate(req.body && typeof req.body === 'object' ? req.body : {} , { convert: true });
    if (error) {
      return res.status(400).json({ ok: false, error: error.message });
    }

    // Parsear asistencias desde buffer
    const { registros, diasDelMes } = await parseAsistenciasBuffer(req.file);

    // Construir mapas de datos externos (rendimiento/calidad)
    const mapRend = new Map();
    (value.rendimiento || []).forEach(r => {
      mapRend.set(String(r.DNI), r);
    });
    const mapCal = new Map();
    (value.calidad || []).forEach(c => {
      mapCal.set(String(c.DNI), c);
    });

    // Calcular métricas y bonos
    const resultado = calcularIndicadores({
      registros,
      diasDelMes,
      rendimiento: mapRend,
      calidad: mapCal,
      esquema: value.esquema || {},
      metaLlamadasBase: value.metaLlamadasBase || 0
    });

    // Construir reportes en CSV y XLSX (base64)
    const csv = buildCsv(resultado.detalle);
    const xlsx = await buildWorkbookBase64(resultado.detalle);

    return res.json({ ok: true, diasDelMes, resumen: resultado.resumen, detalle: resultado.detalle, reportes: { csvBase64: csv, xlsxBase64: xlsx } });
  } catch (err) {
    console.error('Error procesando indicadores', err);
    return res.status(500).json({ ok: false, error: 'Error interno procesando indicadores' });
  }
};
