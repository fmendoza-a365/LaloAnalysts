const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const Asesor = require('../models/Asesor');
const GenesysDataset = require('../models/GenesysDataset');
const GenesysRecord = require('../models/GenesysRecord');

router.use(ensureAuthenticated);

// Helper para formatear segundos a HH:MM:SS
function formatSeconds(val) {
  if (!val || isNaN(val)) return val;
  const secs = Math.floor(Number(val));
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0') + ':' + String(s).padStart(2,'0');
}

// Helper para formatear porcentajes
function formatPercent(val) {
  if (!val || isNaN(val)) return val;
  const n = Number(val);
  // Si es decimal (0-1), multiplicar por 100
  return (n > 1 ? n.toFixed(2) : (n * 100).toFixed(2)) + '%';
}

const metricasTiempo = ['Conectado', 'En Cola', 'Fuera de Cola', 'Interactuando', 'Inactivo', 'Disponible', 
  'Comida', 'Ocupado', 'Ausente', 'Descanso', 'Sistema Ausente', 'Reunión', 'Capacitación', 'En Comunicación',
  'Tiempo Medio Operativo', 'Tiempo Medio Conversación', 'Tiempo Medio ACW', 'Tiempo Medio Retención'];
const metricasPorcentaje = ['No Responde'];

router.get('/', async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const perPage = Math.min(Math.max(parseInt(req.query.perPage || '20', 10), 5), 100);
    const anio = parseInt(req.query.anio || new Date().getFullYear(), 10);
    const mes = parseInt(req.query.mes || (new Date().getMonth() + 1), 10);
    const total = await Asesor.countDocuments();
    const asesores = await Asesor.find({})
      .sort({ apellidosNombres: 1 })
      .skip((page - 1) * perPage)
      .limit(perPage);

    // Indicadores Genesys por periodo
    const datasets = await GenesysDataset.find({ anio, mes, tipo: { $in: ['rendimiento','estados'] } });
    const dsR = datasets.find(d => d.tipo === 'rendimiento');
    const dsE = datasets.find(d => d.tipo === 'estados');
    const indMap = new Map();
    function setIf(ag, key, val){
      if (!ag) return; const m = indMap.get(ag) || {}; if (val !== undefined && val !== null && val !== '') m[key] = val; indMap.set(ag, m); }
    function pick(row, keys){ for (const k of keys){ if (row[k] !== undefined && row[k] !== null && row[k] !== '') return row[k]; } return undefined; }
    if (dsE) {
      const recE = await GenesysRecord.find({ datasetId: dsE._id }).select('ag data');
      for (const r of recE) {
        const d = r.data || {};
        setIf(r.ag, 'Conectado', pick(d, ['Conectado','Conectado: Conectado']));
        setIf(r.ag, 'En Cola', pick(d, ['En la cola','En la cola: En la cola']));
        setIf(r.ag, 'Fuera de Cola', pick(d, ['Fuera de la cola','Fuera de la cola %']));
        setIf(r.ag, 'Interactuando', pick(d, ['Interactuando','Interactuando %']));
        setIf(r.ag, 'No Responde', pick(d, ['Sin respuesta %','No responde']));
        setIf(r.ag, 'Inactivo', pick(d, ['Inactivo','Inactivo %']));
        setIf(r.ag, 'Disponible', pick(d, ['Disponible','Disponible: Disponible']));
        setIf(r.ag, 'Comida', pick(d, ['Comida','Comida: Comida']));
        setIf(r.ag, 'Ocupado', pick(d, ['Ocupado','Ocupado: Ocupado']));
        setIf(r.ag, 'Ausente', pick(d, ['Ausente','Ausente: Ausente']));
        setIf(r.ag, 'Descanso', pick(d, ['Descanso','Descanso: Descanso']));
        setIf(r.ag, 'Sistema Ausente', pick(d, ['Sistema ausente']));
        setIf(r.ag, 'Reunión', pick(d, ['Reunión','Reunión: Reunión']));
        setIf(r.ag, 'Capacitación', pick(d, ['Capacitación','Capacitación: Capacitación']));
        setIf(r.ag, 'En Comunicación', pick(d, ['En comunicación']));
      }
    }
    if (dsR) {
      const recR = await GenesysRecord.find({ datasetId: dsR._id }).select('ag data');
      for (const r of recR) {
        const d = r.data || {};
        const ofrecidas = pick(d, ['Ofrecidas','Total de alertas','Total que están contactando']);
        const contestadas = pick(d, ['Contestadas','Manejo']);
        const noContestadas = (ofrecidas != null && contestadas != null) ? (Number(ofrecidas) - Number(contestadas)) : pick(d, ['No Contestadas']);
        setIf(r.ag, 'Ofrecidas', ofrecidas);
        setIf(r.ag, 'Contestadas', contestadas);
        setIf(r.ag, 'No Contestadas', noContestadas);
        setIf(r.ag, 'Tiempo Medio Operativo', pick(d, ['Manejo medio']));
        setIf(r.ag, 'Tiempo Medio Conversación', pick(d, ['Conversación media']));
        setIf(r.ag, 'Tiempo Medio ACW', pick(d, ['ACW medio']));
        setIf(r.ag, 'Tiempo Medio Retención', pick(d, ['Retención media','Retención media manejada']));
      }
    }
    const indicadoresRaw = indMap.size ? Object.fromEntries(indMap) : {};

    // Agregar por Supervisor (con valores sin formatear)
    const supMap = new Map();
    // Todas las métricas de rendimiento se promedian
    const metricasRendimientoPromedio = ['Tiempo Medio Operativo', 'Tiempo Medio Conversación', 'Tiempo Medio ACW', 'Tiempo Medio Retención', 'Ofrecidas', 'Contestadas', 'No Contestadas'];
    for (const a of asesores) {
      const sup = a.supervisor || 'Sin supervisor';
      if (!supMap.has(sup)) supMap.set(sup, { supervisor: sup, count: 0, totales: {}, contadores: {}, asesores: [] });
      const entry = supMap.get(sup);
      entry.count++;
      entry.asesores.push(a);
      if (a.ag && indicadoresRaw[a.ag]) {
        const ind = indicadoresRaw[a.ag];
        for (const k in ind) {
          const val = Number(ind[k]);
          if (!isNaN(val)) {
            if (!entry.totales[k]) entry.totales[k] = 0;
            if (!entry.contadores[k]) entry.contadores[k] = 0;
            entry.totales[k] += val;
            entry.contadores[k]++;
          }
        }
      }
    }
    
    // Formatear indicadores individuales
    const indicadores = {};
    for (const ag in indicadoresRaw) {
      const formatted = {};
      for (const k in indicadoresRaw[ag]) {
        const val = indicadoresRaw[ag][k];
        if (metricasTiempo.includes(k)) {
          formatted[k] = formatSeconds(val);
        } else if (metricasPorcentaje.includes(k)) {
          formatted[k] = formatPercent(val);
        } else {
          formatted[k] = val;
        }
      }
      indicadores[ag] = formatted;
    }
    
    // Formatear por Supervisor
    const porSupervisor = Array.from(supMap.values()).map(s => {
      const promedios = {};
      for (const k in s.totales) {
        let val;
        // Promediar métricas de rendimiento
        if (metricasRendimientoPromedio.includes(k) && s.contadores[k] > 0) {
          val = s.totales[k] / s.contadores[k];
        } else {
          val = s.totales[k];
        }
        // Aplicar formato
        if (metricasTiempo.includes(k)) {
          promedios[k] = formatSeconds(val);
        } else if (metricasPorcentaje.includes(k)) {
          promedios[k] = formatPercent(val);
        } else {
          // Redondear a 2 decimales para promedios de cantidades
          promedios[k] = metricasRendimientoPromedio.includes(k) ? Number(val).toFixed(2) : val;
        }
      }
      return { supervisor: s.supervisor, count: s.count, totales: promedios };
    });

    res.render('asesores', {
      title: 'Asesores · Indicadores',
      user: req.user,
      asesores,
      periodo: { anio, mes },
      indicadores,
      porSupervisor,
      pagination: {
        page,
        perPage,
        total,
        totalPages: Math.max(1, Math.ceil(total / perPage))
      }
    });
  } catch (e) {
    console.error(e);
    req.flash('error_msg', 'Error cargando indicadores de asesores');
    res.redirect('/dashboard');
  }
});

module.exports = router;
