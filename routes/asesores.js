const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { requireTenant, getTenantModelFromReq } = require('../middleware/tenant');

// ❌ NO importar modelos multi-tenant directamente
// Modelos multi-tenant: Asesor, GenesysDataset, GenesysRecord, AsistenciaDataset, AsistenciaRecord

router.use(ensureAuthenticated, requireTenant);

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
    // Obtener modelos dinámicos del tenant actual
    const Asesor = getTenantModelFromReq(req, 'Asesor');
    const GenesysDataset = getTenantModelFromReq(req, 'GenesysDataset');
    const GenesysRecord = getTenantModelFromReq(req, 'GenesysRecord');
    const AsistenciaDataset = getTenantModelFromReq(req, 'AsistenciaDataset');
    const AsistenciaRecord = getTenantModelFromReq(req, 'AsistenciaRecord');

    const page = Math.max(parseInt(req.query.page || '1', 10), 1);
    const perPage = Math.min(Math.max(parseInt(req.query.perPage || '20', 10), 5), 100);
    const anio = parseInt(req.query.anio || new Date().getFullYear(), 10);
    const mes = parseInt(req.query.mes || (new Date().getMonth() + 1), 10);

    // ✅ Contar asesores (solo del tenant actual)
    const total = await Asesor.countDocuments();

    // ✅ Obtener TODOS los asesores para cálculos de supervisores (solo del tenant actual)
    const todosLosAsesores = await Asesor.find({}).sort({ apellidosNombres: 1 });

    // Obtener asesores paginados solo para mostrar en la tabla
    const asesores = todosLosAsesores.slice((page - 1) * perPage, page * perPage);

    // ✅ Indicadores Genesys por periodo (solo del tenant actual)
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

    // Calcular horas programadas, % adherencia y estadísticas de asistencia
    const asistenciaDataset = await AsistenciaDataset.findOne({ anio, mes }).sort({ creadoEn: -1 });
    const horasProgramadasMap = new Map();
    const adherenciaMap = new Map();
    const asistenciaStatsMap = new Map(); // Estadísticas detalladas de asistencia
    
    if (asistenciaDataset) {
      const registrosAsistencia = await AsistenciaRecord.find({ datasetId: asistenciaDataset._id });
      
      // Agrupar por DNI
      const asistenciaPorDni = new Map();
      for (const reg of registrosAsistencia) {
        if (!asistenciaPorDni.has(reg.dni)) {
          asistenciaPorDni.set(reg.dni, []);
        }
        asistenciaPorDni.get(reg.dni).push(reg);
      }
      
      // Calcular días efectivos, horas programadas y estadísticas de asistencia por asesor
      for (const [dni, registros] of asistenciaPorDni) {
        // Calcular estadísticas detalladas
        let diasPuntuales = 0;
        let cantidadTardanzas = 0;
        let minutosTardanzaTotal = 0;
        let faltas = 0;
        let descansos = 0;
        
        registros.forEach(r => {
          // Días puntuales (P sin tardanza)
          if (r.regAsistencia === 'P' && (!r.tardanza || parseFloat(r.tardanza) === 0)) {
            diasPuntuales++;
          }
          
          // Tardanzas
          if (r.tardanza) {
            const tardanzaNum = parseFloat(r.tardanza);
            if (!isNaN(tardanzaNum) && tardanzaNum > 0) {
              cantidadTardanzas++;
              minutosTardanzaTotal += tardanzaNum;
            }
          }
          
          // Faltas injustificadas
          if (r.regAsistencia === 'FI') {
            faltas++;
          }
          
          // Descansos
          if (r.regAsistencia === 'DS') {
            descansos++;
          }
        });
        
        // Guardar estadísticas
        asistenciaStatsMap.set(dni, {
          diasPuntuales,
          cantidadTardanzas,
          minutosTardanzaTotal,
          faltas,
          descansos,
          totalRegistros: registros.length
        });
        
        // Días efectivos: regAsistencia = 'P' (Presente) O con tardanza O faltas (FI)
        const diasEfectivos = registros.filter(r => {
          // Incluir si es 'P' (Presente)
          if (r.regAsistencia === 'P') return true;
          
          // Incluir si tiene tardanza (número mayor a 0)
          if (r.tardanza) {
            const tardanzaNum = parseFloat(r.tardanza);
            if (!isNaN(tardanzaNum) && tardanzaNum > 0) return true;
          }
          
          // Incluir faltas injustificadas (también son días programados)
          if (r.regAsistencia === 'FI') return true;
          
          return false;
        }).length;
        
        // Buscar el asesor por DNI para obtener su modalidad
        const asesor = todosLosAsesores.find(a => a.DNI === dni);
        
        // Determinar horas por día según modalidad
        // Full Time = 8 horas/día, Part Time = 4 horas/día
        let horasPorDia = 8; // Default: Full Time
        if (asesor && asesor.modalidad) {
          const modalidad = String(asesor.modalidad).toLowerCase();
          if (modalidad.includes('part') || modalidad.includes('medio') || modalidad.includes('4')) {
            horasPorDia = 4;
          }
        }
        
        // Horas programadas = días efectivos × horas por día
        const horasProgramadas = diasEfectivos * horasPorDia;
        horasProgramadasMap.set(dni, horasProgramadas);
        
        // Calcular % adherencia si tiene datos en Genesys
        if (asesor && asesor.ag && indicadoresRaw[asesor.ag]) {
          const ind = indicadoresRaw[asesor.ag];
          // "En Cola" está en segundos
          const enColaSegundos = Number(ind['En Cola']) || 0;
          const horasProgramadasSegundos = horasProgramadas * 3600; // convertir horas a segundos
          
          // % Adherencia = (Tiempo En Cola / Horas Programadas) × 100
          const adherencia = horasProgramadasSegundos > 0 
            ? ((enColaSegundos / horasProgramadasSegundos) * 100).toFixed(2)
            : 0;
          
          adherenciaMap.set(asesor.ag, adherencia);
        }
      }
    }

    // Agregar por Supervisor (con valores sin formatear) - USAR TODOS LOS ASESORES
    const supMap = new Map();
    // Todas las métricas de rendimiento se promedian
    const metricasRendimientoPromedio = ['Tiempo Medio Operativo', 'Tiempo Medio Conversación', 'Tiempo Medio ACW', 'Tiempo Medio Retención', 'Ofrecidas', 'Contestadas', 'No Contestadas'];
    for (const a of todosLosAsesores) {
      const sup = a.supervisor || 'Sin supervisor';
      if (!supMap.has(sup)) supMap.set(sup, { supervisor: sup, count: 0, totales: {}, contadores: {}, asesores: [] });
      const entry = supMap.get(sup);
      
      // Solo contar asesores que tienen datos en el período consultado
      if (a.ag && indicadoresRaw[a.ag]) {
        entry.count++;
        entry.asesores.push(a);
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
      horasProgramadasMap,
      adherenciaMap,
      asistenciaStatsMap,
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
