const express = require('express');
const router = express.Router();
const { ensureAuthenticated, checkRole } = require('../middleware/auth');
const User = require('../models/User');
const PowerBILink = require('../models/PowerBILink');
const Asesor = require('../models/Asesor');
const GenesysDataset = require('../models/GenesysDataset');
const GenesysRecord = require('../models/GenesysRecord');

// Dashboard route - protected - Ahora muestra indicadores de asesores
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const anio = parseInt(req.query.anio || new Date().getFullYear(), 10);
    const mes = parseInt(req.query.mes || (new Date().getMonth() + 1), 10);
    
    // Obtener todos los asesores activos
    const asesores = await Asesor.find({}).sort({ apellidosNombres: 1 });
    const totalAsesores = asesores.filter(a => a.estado && a.estado.toLowerCase().includes('activo')).length;
    
    // Obtener datasets del periodo
    const dsE = await GenesysDataset.findOne({ anio, mes, tipo: 'estados' }).sort({ creadoEn: -1 });
    const dsR = await GenesysDataset.findOne({ anio, mes, tipo: 'rendimiento' }).sort({ creadoEn: -1 });
    
    // Helpers
    function pick(obj, keys) {
      for (const k of keys) if (obj[k] != null && obj[k] !== '') return obj[k];
      return null;
    }
    function setIf(ag, metric, val) {
      if (val != null && !indMap.has(ag)) indMap.set(ag, {});
      if (val != null) indMap.get(ag)[metric] = val;
    }
    
    const indMap = new Map();
    
    // Procesar Estados
    if (dsE) {
      const recE = await GenesysRecord.find({ datasetId: dsE._id }).select('ag data');
      for (const r of recE) {
        const d = r.data || {};
        setIf(r.ag, 'Conectado', pick(d, ['Conectado']));
        setIf(r.ag, 'En Cola', pick(d, ['En Cola']));
        setIf(r.ag, 'Fuera de Cola', pick(d, ['Fuera de Cola']));
        setIf(r.ag, 'Interactuando', pick(d, ['Interactuando']));
        setIf(r.ag, 'No Responde', pick(d, ['No Responde']));
        setIf(r.ag, 'Inactivo', pick(d, ['Inactivo']));
        setIf(r.ag, 'Disponible', pick(d, ['Disponible']));
        setIf(r.ag, 'Comida', pick(d, ['Comida']));
        setIf(r.ag, 'Ocupado', pick(d, ['Ocupado']));
        setIf(r.ag, 'Ausente', pick(d, ['Ausente']));
        setIf(r.ag, 'Descanso', pick(d, ['Descanso']));
        setIf(r.ag, 'Sistema Ausente', pick(d, ['Sistema Ausente']));
        setIf(r.ag, 'Reunión', pick(d, ['Reunión']));
        setIf(r.ag, 'Capacitación', pick(d, ['Capacitación']));
        setIf(r.ag, 'En Comunicación', pick(d, ['En Comunicación']));
      }
    }
    
    // Procesar Rendimiento
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
    
    // Calcular KPIs globales
    let totalOfrecidas = 0;
    let totalContestadas = 0;
    let totalNoContestadas = 0;
    let sumaConnectado = 0;
    let sumaEnComunicacion = 0;
    let sumaTMO = 0;
    let contadorTMO = 0;
    
    const estadosDistribucion = {
      'Conectado': 0,
      'En Cola': 0,
      'Fuera de Cola': 0,
      'Interactuando': 0,
      'No Responde': 0,
      'Inactivo': 0,
      'Disponible': 0,
      'Comida': 0,
      'Ocupado': 0,
      'Ausente': 0,
      'Descanso': 0,
      'Sistema Ausente': 0,
      'Reunión': 0,
      'Capacitación': 0,
      'En Comunicación': 0
    };
    
    for (const a of asesores) {
      if (a.ag && indicadoresRaw[a.ag]) {
        const ind = indicadoresRaw[a.ag];
        
        if (ind['Ofrecidas']) totalOfrecidas += Number(ind['Ofrecidas']);
        if (ind['Contestadas']) totalContestadas += Number(ind['Contestadas']);
        if (ind['No Contestadas']) totalNoContestadas += Number(ind['No Contestadas']);
        if (ind['Conectado']) sumaConnectado += Number(ind['Conectado']);
        if (ind['En Comunicación']) sumaEnComunicacion += Number(ind['En Comunicación']);
        
        if (ind['Tiempo Medio Operativo']) {
          sumaTMO += Number(ind['Tiempo Medio Operativo']);
          contadorTMO++;
        }
        
        // Distribución de estados - todos individuales
        if (ind['Conectado']) estadosDistribucion['Conectado'] += Number(ind['Conectado']);
        if (ind['En Cola']) estadosDistribucion['En Cola'] += Number(ind['En Cola']);
        if (ind['Fuera de Cola']) estadosDistribucion['Fuera de Cola'] += Number(ind['Fuera de Cola']);
        if (ind['Interactuando']) estadosDistribucion['Interactuando'] += Number(ind['Interactuando']);
        if (ind['No Responde']) estadosDistribucion['No Responde'] += Number(ind['No Responde']);
        if (ind['Inactivo']) estadosDistribucion['Inactivo'] += Number(ind['Inactivo']);
        if (ind['Disponible']) estadosDistribucion['Disponible'] += Number(ind['Disponible']);
        if (ind['Comida']) estadosDistribucion['Comida'] += Number(ind['Comida']);
        if (ind['Ocupado']) estadosDistribucion['Ocupado'] += Number(ind['Ocupado']);
        if (ind['Ausente']) estadosDistribucion['Ausente'] += Number(ind['Ausente']);
        if (ind['Descanso']) estadosDistribucion['Descanso'] += Number(ind['Descanso']);
        if (ind['Sistema Ausente']) estadosDistribucion['Sistema Ausente'] += Number(ind['Sistema Ausente']);
        if (ind['Reunión']) estadosDistribucion['Reunión'] += Number(ind['Reunión']);
        if (ind['Capacitación']) estadosDistribucion['Capacitación'] += Number(ind['Capacitación']);
        if (ind['En Comunicación']) estadosDistribucion['En Comunicación'] += Number(ind['En Comunicación']);
      }
    }
    
    const nivelServicio = totalOfrecidas > 0 ? ((totalContestadas / totalOfrecidas) * 100).toFixed(2) : 0;
    const tmoPromedio = contadorTMO > 0 ? (sumaTMO / contadorTMO) : 0;
    const adherencia = sumaConnectado > 0 ? ((sumaEnComunicacion / sumaConnectado) * 100).toFixed(2) : 0;
    
    // Top 10 Asesores por llamadas contestadas
    const asesoresConTMO = asesores
      .filter(a => a.ag && indicadoresRaw[a.ag] && indicadoresRaw[a.ag]['Tiempo Medio Operativo'])
      .map(a => ({
        nombre: a.apellidosNombres,
        tmo: Number(indicadoresRaw[a.ag]['Tiempo Medio Operativo']),
        contestadas: Number(indicadoresRaw[a.ag]['Contestadas'] || 0)
      }))
      .sort((a, b) => b.contestadas - a.contestadas)
      .slice(0, 10);
    
    // Agregación por Supervisor (misma lógica que asesores.js para consistencia)
    const supMap = new Map();
    for (const a of asesores) {
      const sup = a.supervisor || 'Sin supervisor';
      if (!supMap.has(sup)) supMap.set(sup, { supervisor: sup, count: 0, totales: {}, contadores: {} });
      const entry = supMap.get(sup);
      entry.count++;
      
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
    
    // Calcular promedios (métricas de rendimiento se promedian)
    const metricasRendimientoPromedio = ['Tiempo Medio Operativo', 'Tiempo Medio Conversación', 'Tiempo Medio ACW', 'Tiempo Medio Retención', 'Ofrecidas', 'Contestadas', 'No Contestadas'];
    const porSupervisor = Array.from(supMap.values())
      .map(s => {
        const promedios = {};
        for (const k in s.totales) {
          if (metricasRendimientoPromedio.includes(k) && s.contadores[k] > 0) {
            promedios[k] = s.totales[k] / s.contadores[k];
          } else {
            promedios[k] = s.totales[k];
          }
        }
        return {
          supervisor: s.supervisor,
          count: s.count,
          tmoPromedio: promedios['Tiempo Medio Operativo'] || 0,
          contestadasPromedio: promedios['Contestadas'] || 0
        };
      })
      .filter(s => s.tmoPromedio > 0)
      .sort((a, b) => b.contestadasPromedio - a.contestadasPromedio)
      .slice(0, 8);
    
    res.render('dashboard/index', {
      title: 'Tablero',
      user: req.user,
      periodo: { anio, mes },
      kpis: {
        totalAsesores,
        nivelServicio,
        tmoPromedio,
        adherencia,
        totalOfrecidas,
        totalContestadas
      },
      estadosDistribucion,
      top10Asesores: asesoresConTMO,
      porSupervisor
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando el tablero');
    res.redirect('/');
  }
});

// Add a new Power BI report (Admin only)
router.post('/reports', ensureAuthenticated, checkRole(['admin']), async (req, res) => {
  const { name, reportId, groupId, embedUrl } = req.body;
  
  try {
    const user = await User.findById(req.user.id);
    
    // Add the new report
    user.powerBIReports.unshift({
      name,
      reportId,
      groupId,
      embedUrl
    });
    
    await user.save();
    
    req.flash('success_msg', 'Reporte agregado correctamente');
    res.redirect('/dashboard');
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error agregando reporte');
    res.redirect('/dashboard');
  }
});

// View a specific report
router.get('/reports/:reportId', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const report = user.powerBIReports.find(
      r => r._id.toString() === req.params.reportId
    );
    
    if (!report) {
      req.flash('error_msg', 'Reporte no encontrado');
      return res.redirect('/dashboard');
    }
    
    // Check if user has access to this report
    // You can implement additional access control here
    
    res.render('dashboard/report', {
      title: report.name,
      report,
      // accessToken placeholder; integrate with Azure AD to obtain a real token
      accessToken: null,
      powerBiConfig: {
        type: 'report',
        embedUrl: report.embedUrl,
        tokenType: 'Aad',
        settings: {
          panes: {
            filters: {
              expanded: false,
              visible: true
            }
          },
          background: 'transparent',
          hideDefaultSlicers: true,
        }
      }
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando el reporte');
    res.redirect('/dashboard');
  }
});

// Admin dashboard (only accessible by admins)
router.get('/admin', ensureAuthenticated, checkRole(['admin']), (req, res) => {
  res.render('dashboard/admin', {
    title: 'Panel de Administración',
    user: req.user
  });
});

// Dashboard de Asesores con KPIs y gráficos
router.get('/asesores', ensureAuthenticated, async (req, res) => {
  try {
    const anio = parseInt(req.query.anio || new Date().getFullYear(), 10);
    const mes = parseInt(req.query.mes || (new Date().getMonth() + 1), 10);
    
    // Obtener todos los asesores activos
    const asesores = await Asesor.find({}).sort({ apellidosNombres: 1 });
    const totalAsesores = asesores.filter(a => a.estado && a.estado.toLowerCase().includes('activo')).length;
    
    // Obtener datasets del periodo
    const dsE = await GenesysDataset.findOne({ anio, mes, tipo: 'estados' }).sort({ creadoEn: -1 });
    const dsR = await GenesysDataset.findOne({ anio, mes, tipo: 'rendimiento' }).sort({ creadoEn: -1 });
    
    // Helpers
    function pick(obj, keys) {
      for (const k of keys) if (obj[k] != null && obj[k] !== '') return obj[k];
      return null;
    }
    function setIf(ag, metric, val) {
      if (val != null && !indMap.has(ag)) indMap.set(ag, {});
      if (val != null) indMap.get(ag)[metric] = val;
    }
    
    const indMap = new Map();
    
    // Procesar Estados
    if (dsE) {
      const recE = await GenesysRecord.find({ datasetId: dsE._id }).select('ag data');
      for (const r of recE) {
        const d = r.data || {};
        setIf(r.ag, 'Conectado', pick(d, ['Conectado']));
        setIf(r.ag, 'En Cola', pick(d, ['En Cola']));
        setIf(r.ag, 'Fuera de Cola', pick(d, ['Fuera de Cola']));
        setIf(r.ag, 'Interactuando', pick(d, ['Interactuando']));
        setIf(r.ag, 'No Responde', pick(d, ['No Responde']));
        setIf(r.ag, 'Inactivo', pick(d, ['Inactivo']));
        setIf(r.ag, 'Disponible', pick(d, ['Disponible']));
        setIf(r.ag, 'Comida', pick(d, ['Comida']));
        setIf(r.ag, 'Ocupado', pick(d, ['Ocupado']));
        setIf(r.ag, 'Ausente', pick(d, ['Ausente']));
        setIf(r.ag, 'Descanso', pick(d, ['Descanso']));
        setIf(r.ag, 'Sistema Ausente', pick(d, ['Sistema Ausente']));
        setIf(r.ag, 'Reunión', pick(d, ['Reunión']));
        setIf(r.ag, 'Capacitación', pick(d, ['Capacitación']));
        setIf(r.ag, 'En Comunicación', pick(d, ['En Comunicación']));
      }
    }
    
    // Procesar Rendimiento
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
    
    // Calcular KPIs globales
    let totalOfrecidas = 0;
    let totalContestadas = 0;
    let totalNoContestadas = 0;
    let sumaConnectado = 0;
    let sumaEnComunicacion = 0;
    let sumaTMO = 0;
    let contadorTMO = 0;
    let asesoresConDatos = 0;
    
    const estadosDistribucion = {
      'Disponible': 0,
      'En Comunicación': 0,
      'Descanso': 0,
      'Comida': 0,
      'Ocupado': 0,
      'Ausente': 0,
      'Capacitación': 0,
      'Reunión': 0,
      'Otros': 0
    };
    
    for (const a of asesores) {
      if (a.ag && indicadoresRaw[a.ag]) {
        asesoresConDatos++;
        const ind = indicadoresRaw[a.ag];
        
        if (ind['Ofrecidas']) totalOfrecidas += Number(ind['Ofrecidas']);
        if (ind['Contestadas']) totalContestadas += Number(ind['Contestadas']);
        if (ind['No Contestadas']) totalNoContestadas += Number(ind['No Contestadas']);
        if (ind['Conectado']) sumaConnectado += Number(ind['Conectado']);
        if (ind['En Comunicación']) sumaEnComunicacion += Number(ind['En Comunicación']);
        
        if (ind['Tiempo Medio Operativo']) {
          sumaTMO += Number(ind['Tiempo Medio Operativo']);
          contadorTMO++;
        }
        
        // Distribución de estados
        if (ind['Disponible']) estadosDistribucion['Disponible'] += Number(ind['Disponible']);
        if (ind['En Comunicación']) estadosDistribucion['En Comunicación'] += Number(ind['En Comunicación']);
        if (ind['Descanso']) estadosDistribucion['Descanso'] += Number(ind['Descanso']);
        if (ind['Comida']) estadosDistribucion['Comida'] += Number(ind['Comida']);
        if (ind['Ocupado']) estadosDistribucion['Ocupado'] += Number(ind['Ocupado']);
        if (ind['Ausente']) estadosDistribucion['Ausente'] += Number(ind['Ausente']);
        if (ind['Capacitación']) estadosDistribucion['Capacitación'] += Number(ind['Capacitación']);
        if (ind['Reunión']) estadosDistribucion['Reunión'] += Number(ind['Reunión']);
        
        const otrosEstados = (ind['Inactivo'] || 0) + (ind['Sistema Ausente'] || 0) + (ind['Fuera de Cola'] || 0);
        estadosDistribucion['Otros'] += Number(otrosEstados);
      }
    }
    
    const nivelServicio = totalOfrecidas > 0 ? ((totalContestadas / totalOfrecidas) * 100).toFixed(2) : 0;
    const tmoPromedio = contadorTMO > 0 ? (sumaTMO / contadorTMO) : 0;
    const adherencia = sumaConnectado > 0 ? ((sumaEnComunicacion / sumaConnectado) * 100).toFixed(2) : 0;
    const tasaAbandono = totalOfrecidas > 0 ? ((totalNoContestadas / totalOfrecidas) * 100).toFixed(2) : 0;
    
    // Top 10 Asesores por TMO (menor es mejor)
    const asesoresConTMO = asesores
      .filter(a => a.ag && indicadoresRaw[a.ag] && indicadoresRaw[a.ag]['Tiempo Medio Operativo'])
      .map(a => ({
        nombre: a.apellidosNombres,
        tmo: Number(indicadoresRaw[a.ag]['Tiempo Medio Operativo']),
        contestadas: Number(indicadoresRaw[a.ag]['Contestadas'] || 0)
      }))
      .sort((a, b) => a.contestadas - b.contestadas) // Ordenar por más llamadas contestadas
      .reverse()
      .slice(0, 10);
    
    // Agregación por Supervisor
    const supMap = new Map();
    for (const a of asesores) {
      const sup = a.supervisor || 'Sin supervisor';
      if (!supMap.has(sup)) supMap.set(sup, { supervisor: sup, count: 0, totalTMO: 0, contadorTMO: 0, totalContestadas: 0 });
      const entry = supMap.get(sup);
      entry.count++;
      
      if (a.ag && indicadoresRaw[a.ag]) {
        const ind = indicadoresRaw[a.ag];
        if (ind['Tiempo Medio Operativo']) {
          entry.totalTMO += Number(ind['Tiempo Medio Operativo']);
          entry.contadorTMO++;
        }
        if (ind['Contestadas']) {
          entry.totalContestadas += Number(ind['Contestadas']);
        }
      }
    }
    
    const porSupervisor = Array.from(supMap.values())
      .filter(s => s.contadorTMO > 0)
      .map(s => ({
        supervisor: s.supervisor,
        count: s.count,
        tmoPromedio: s.totalTMO / s.contadorTMO,
        contestadasPromedio: s.totalContestadas / s.count
      }))
      .sort((a, b) => b.contestadasPromedio - a.contestadasPromedio)
      .slice(0, 8);
    
    res.render('dashboard/asesores', {
      title: 'Dashboard de Asesores',
      user: req.user,
      periodo: { anio, mes },
      kpis: {
        totalAsesores,
        nivelServicio,
        tmoPromedio,
        adherencia,
        totalOfrecidas,
        totalContestadas,
        tasaAbandono
      },
      estadosDistribucion,
      top10Asesores: asesoresConTMO,
      porSupervisor
    });
  } catch (err) {
    console.error(err);
    req.flash('error_msg', 'Error cargando el dashboard de asesores');
    res.redirect('/dashboard');
  }
});

module.exports = router;
