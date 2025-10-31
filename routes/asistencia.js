const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { requireTenant, getTenantModelFromReq } = require('../middleware/tenant');

// ❌ NO importar modelos multi-tenant directamente
// Modelos multi-tenant: Asesor, AsistenciaDataset, AsistenciaRecord

router.use(ensureAuthenticated, requireTenant);

router.get('/', async (req, res) => {
  try {
    // Obtener modelos dinámicos del tenant actual
    const Asesor = getTenantModelFromReq(req, 'Asesor');
    const AsistenciaDataset = getTenantModelFromReq(req, 'AsistenciaDataset');
    const AsistenciaRecord = getTenantModelFromReq(req, 'AsistenciaRecord');

    const anio = parseInt(req.query.anio || new Date().getFullYear(), 10);
    const mes = parseInt(req.query.mes || (new Date().getMonth() + 1), 10);
    const supervisorFiltro = req.query.supervisor || '';

    // ✅ Buscar dataset del periodo (solo del tenant actual)
    const dataset = await AsistenciaDataset.findOne({ anio, mes }).sort({ creadoEn: -1 });
    
    if (!dataset) {
      return res.render('asistencia/index', {
        title: 'Asistencia',
        user: req.user,
        periodo: { anio, mes },
        filtros: { supervisor: supervisorFiltro },
        todosLosSupervisores: [],
        noData: true,
        kpis: {},
        asistenciaPorAsesor: [],
        estadisticasPorEstado: []
      });
    }

    // Obtener registros de asistencia
    const registros = await AsistenciaRecord.find({ datasetId: dataset._id });

    // Obtener asesores
    const asesores = await Asesor.find({}).sort({ apellidosNombres: 1 });
    const asesoresMap = new Map(asesores.map(a => [a.DNI, a]));

    // Mapear registros con asesores
    const registrosConAsesor = registros.filter(r => asesoresMap.has(r.dni));

    // Aplicar filtro por supervisor
    let registrosFiltrados = registrosConAsesor;
    if (supervisorFiltro) {
      registrosFiltrados = registrosConAsesor.filter(r => {
        const asesor = asesoresMap.get(r.dni);
        return asesor && asesor.supervisor === supervisorFiltro;
      });
    }

    // Calcular días efectivos (registros con P y tardanza numérica)
    const diasEfectivos = registrosFiltrados.filter(r => {
      // Día efectivo: debe ser "P" (Presente) y tener tardanza registrada (número)
      return r.regAsistencia === 'P' && r.tardanza !== undefined && r.tardanza !== null && r.tardanza !== '';
    }).length;
    
    // Calcular total de horas programadas (días efectivos × 8 horas)
    const horasProgramadas = diasEfectivos * 8;
    
    // Calcular KPIs generales
    const totalRegistros = registrosFiltrados.length;
    const asistenciasPuntuales = registrosFiltrados.filter(r => r.asiste === 'Puntual').length;
    const faltasInjustificadas = registrosFiltrados.filter(r => r.regAsistencia === 'FI').length;
    const tardanzas = registrosFiltrados.filter(r => r.tardanza && parseFloat(r.tardanza) > 0).length;
    
    const porcentajeAsistencia = totalRegistros > 0 ? ((asistenciasPuntuales / totalRegistros) * 100).toFixed(2) : 0;
    const porcentajeFaltas = totalRegistros > 0 ? ((faltasInjustificadas / totalRegistros) * 100).toFixed(2) : 0;

    // Agrupar por DNI para obtener resumen por asesor
    const asesorMap = new Map();
    for (const r of registrosFiltrados) {
      const dni = r.dni;
      if (!asesorMap.has(dni)) {
        const asesor = asesoresMap.get(dni);
        asesorMap.set(dni, {
          dni,
          nombre: asesor ? asesor.apellidosNombres : dni,
          supervisor: asesor ? asesor.supervisor : '',
          totalDias: 0,
          puntuales: 0,
          faltas: 0,
          tardanzas: 0,
          permisos: 0
        });
      }
      const entry = asesorMap.get(dni);
      entry.totalDias++;
      if (r.asiste === 'Puntual') entry.puntuales++;
      if (r.regAsistencia === 'FI') entry.faltas++;
      if (r.tardanza && parseFloat(r.tardanza) > 0) entry.tardanzas++;
      if (r.permiso) entry.permisos++;
    }

    // Convertir a array y calcular porcentajes
    const asistenciaPorAsesor = Array.from(asesorMap.values())
      .map(a => ({
        ...a,
        porcentajeAsistencia: a.totalDias > 0 ? ((a.puntuales / a.totalDias) * 100).toFixed(2) : 0
      }))
      .sort((a, b) => b.porcentajeAsistencia - a.porcentajeAsistencia)
      .slice(0, 20); // Top 20

    // Estadísticas por tipo de registro
    const estadisticasPorEstado = [
      { estado: 'Puntual', count: registrosFiltrados.filter(r => r.asiste === 'Puntual').length },
      { estado: 'Falta Injustificada', count: registrosFiltrados.filter(r => r.regAsistencia === 'FI').length },
      { estado: 'Descanso Semanal', count: registrosFiltrados.filter(r => r.regAsistencia === 'DS').length },
      { estado: 'Feriado', count: registrosFiltrados.filter(r => r.regAsistencia === 'FER').length },
      { estado: 'Con Tardanza', count: tardanzas }
    ].filter(e => e.count > 0);

    // Lista de supervisores
    const todosLosSupervisores = [...new Set(asesores.map(a => a.supervisor))].filter(Boolean).sort();

    res.render('asistencia/index', {
      title: 'Asistencia',
      user: req.user,
      periodo: { anio, mes },
      filtros: { supervisor: supervisorFiltro },
      todosLosSupervisores,
      noData: false,
      kpis: {
        totalRegistros,
        asistenciasPuntuales,
        faltasInjustificadas,
        tardanzas,
        porcentajeAsistencia,
        porcentajeFaltas
      },
      asistenciaPorAsesor,
      estadisticasPorEstado
    });
  } catch (e) {
    console.error(e);
    req.flash('error_msg', 'Error cargando datos de asistencia');
    res.redirect('/dashboard');
  }
});

module.exports = router;
