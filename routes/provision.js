const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const ProvisionDataset = require('../models/ProvisionDataset');
const ProvisionRecord = require('../models/ProvisionRecord');

router.use(ensureAuthenticated);

// Dashboard principal de provisión
router.get('/', async (req, res) => {
  try {
    console.log('[PROVISION] Acceso a dashboard de KPIs');
    const hoy = new Date();
    const anio = parseInt(req.query.anio || hoy.getFullYear(), 10);
    const mes = parseInt(req.query.mes || (hoy.getMonth() + 1), 10);
    const vista = req.query.vista || 'resumen'; // resumen | mesas | cola
    const mesaSeleccionada = req.query.mesa || null;
    
    console.log('[PROVISION] Buscando dataset para:', anio, '-', mes);

    // Buscar dataset del periodo
    const dataset = await ProvisionDataset.findOne({ anio, mes }).sort({ creadoEn: -1 });
    console.log('[PROVISION] Dataset encontrado:', dataset ? dataset._id : 'ninguno');
    
    if (!dataset) {
      return res.render('provision/index', {
        title: 'KPIs · Dashboard',
        user: req.user,
        periodo: { anio, mes },
        noData: true,
        vista,
        mesaSeleccionada
      });
    }

    // Obtener registros del mes
    const registros = await ProvisionRecord.find({ datasetId: dataset._id }).sort({ fecha: 1 });

    // Calcular métricas agregadas por día
    const datosPorDia = {};
    const mesasResumen = {};
    
    registros.forEach(reg => {
      // Validar que tenga fecha
      if (!reg.fecha) {
        console.warn('[PROVISION] Registro sin fecha:', reg._id);
        return;
      }
      
      const dia = reg.fecha.getDate();
      
      // Inicializar día si no existe
      if (!datosPorDia[dia]) {
        datosPorDia[dia] = {
          dia,
          ofrecidas: 0,
          contestadas: 0,
          umbral: 0, // Cumplen SLA
          abandonadas: 0,
          manejoMedioSegs: [],
          mesas: {}
        };
      }
      
      // Acumular totales del día
      datosPorDia[dia].ofrecidas += reg.ofrecidas || 0;
      datosPorDia[dia].contestadas += reg.contestadas || 0;
      datosPorDia[dia].umbral += reg.cumpleSLA || 0;
      datosPorDia[dia].abandonadas += reg.abandonadas || 0;
      
      // Parsear TMO (Manejo Medio) - ya viene en formato HH:MM:SS desde el parser
      if (reg.manejoMedio && reg.manejoMedio !== '00:00:00') {
        const segs = parseTimeToSeconds(reg.manejoMedio);
        if (segs > 0) datosPorDia[dia].manejoMedioSegs.push(segs);
      }
      
      // Agrupar por mesas
      if (reg.mesasData) {
        Object.keys(reg.mesasData).forEach(mesa => {
          const dataMesa = reg.mesasData[mesa];
          
          // Resumen por mesa (acumulado del mes)
          if (!mesasResumen[mesa]) {
            mesasResumen[mesa] = {
              ofrecidas: 0,
              contestadas: 0,
              umbral: 0,
              abandonadas: 0,
              manejoMedioSegs: [],
              colas: new Set(),
              diasConDatos: 0,
              datosPorDia: {}, // Datos por día de la mesa
              colasPorDia: {} // Datos por día de cada cola individual
            };
          }
          
          mesasResumen[mesa].ofrecidas += dataMesa.ofrecidas || 0;
          mesasResumen[mesa].contestadas += dataMesa.contestadas || 0;
          mesasResumen[mesa].umbral += dataMesa.cumpleSLA || 0;
          mesasResumen[mesa].abandonadas += dataMesa.abandonadas || 0;
          mesasResumen[mesa].diasConDatos++;
          
          // Agregar colas únicas y datos por cola por día
          if (dataMesa.colas) {
            dataMesa.colas.forEach(c => {
              mesasResumen[mesa].colas.add(c);
              
              // Inicializar estructura para esta cola si no existe
              if (!mesasResumen[mesa].colasPorDia[c]) {
                mesasResumen[mesa].colasPorDia[c] = {};
              }
              
              // Guardar datos del día para esta cola específica
              if (!mesasResumen[mesa].colasPorDia[c][dia]) {
                mesasResumen[mesa].colasPorDia[c][dia] = {
                  ofrecidas: 0,
                  contestadas: 0,
                  umbral: 0,
                  tmo: reg.manejoMedio || '00:00:00'
                };
              }
              
              // Distribuir proporcionalmente entre las colas de la mesa
              const numColas = dataMesa.colas.length;
              mesasResumen[mesa].colasPorDia[c][dia].ofrecidas += Math.round((dataMesa.ofrecidas || 0) / numColas);
              mesasResumen[mesa].colasPorDia[c][dia].contestadas += Math.round((dataMesa.contestadas || 0) / numColas);
              mesasResumen[mesa].colasPorDia[c][dia].umbral += Math.round((dataMesa.cumpleSLA || 0) / numColas);
            });
          }
          
          // Datos por día de la mesa
          if (!datosPorDia[dia].mesas[mesa]) {
            datosPorDia[dia].mesas[mesa] = {
              ofrecidas: 0,
              contestadas: 0,
              umbral: 0
            };
          }
          
          datosPorDia[dia].mesas[mesa].ofrecidas += dataMesa.ofrecidas || 0;
          datosPorDia[dia].mesas[mesa].contestadas += dataMesa.contestadas || 0;
          datosPorDia[dia].mesas[mesa].umbral += dataMesa.cumpleSLA || 0;
          
          // Guardar datos por día en mesasResumen para el resumen mensual
          if (!mesasResumen[mesa].datosPorDia[dia]) {
            mesasResumen[mesa].datosPorDia[dia] = {
              ofrecidas: 0,
              contestadas: 0,
              umbral: 0,
              tmo: reg.manejoMedio || '00:00:00' // Guardar TMO en formato HH:MM:SS
            };
          }
          mesasResumen[mesa].datosPorDia[dia].ofrecidas += dataMesa.ofrecidas || 0;
          mesasResumen[mesa].datosPorDia[dia].contestadas += dataMesa.contestadas || 0;
          mesasResumen[mesa].datosPorDia[dia].umbral += dataMesa.cumpleSLA || 0;
        });
      }
    });

    // Calcular promedios y totales
    const diasDelMes = Object.keys(datosPorDia).sort((a, b) => a - b);
    let totales = {
      ofrecidas: 0,
      contestadas: 0,
      umbral: 0,
      abandonadas: 0,
      manejoMedioSegs: []
    };

    diasDelMes.forEach(dia => {
      const dato = datosPorDia[dia];
      
      // Calcular porcentajes del día
      dato.nivelAtencion = dato.ofrecidas > 0 ? ((dato.contestadas / dato.ofrecidas) * 100).toFixed(2) : 0;
      dato.nivelServicio = dato.ofrecidas > 0 ? ((dato.umbral / dato.ofrecidas) * 100).toFixed(2) : 0;
      
      // TMO promedio del día
      if (dato.manejoMedioSegs.length > 0) {
        const suma = dato.manejoMedioSegs.reduce((a, b) => a + b, 0);
        dato.tmoSegundos = Math.round(suma / dato.manejoMedioSegs.length);
        dato.tmoFormato = secondsToHMS(dato.tmoSegundos);
      } else {
        dato.tmoSegundos = 0;
        dato.tmoFormato = '00:00:00';
      }
      
      // Acumular totales
      totales.ofrecidas += dato.ofrecidas;
      totales.contestadas += dato.contestadas;
      totales.umbral += dato.umbral;
      totales.abandonadas += dato.abandonadas;
      if (dato.tmoSegundos > 0) totales.manejoMedioSegs.push(dato.tmoSegundos);
    });

    // Calcular totales finales
    totales.nivelAtencion = totales.ofrecidas > 0 ? ((totales.contestadas / totales.ofrecidas) * 100).toFixed(2) : 0;
    totales.nivelServicio = totales.ofrecidas > 0 ? ((totales.umbral / totales.ofrecidas) * 100).toFixed(2) : 0;
    
    if (totales.manejoMedioSegs.length > 0) {
      const suma = totales.manejoMedioSegs.reduce((a, b) => a + b, 0);
      totales.tmoSegundos = Math.round(suma / totales.manejoMedioSegs.length);
      totales.tmoFormato = secondsToHMS(totales.tmoSegundos);
    } else {
      totales.tmoSegundos = 0;
      totales.tmoFormato = '00:00:00';
    }

    // Procesar resumen de mesas
    Object.keys(mesasResumen).forEach(mesa => {
      const data = mesasResumen[mesa];
      data.nivelAtencion = data.ofrecidas > 0 ? ((data.contestadas / data.ofrecidas) * 100).toFixed(2) : 0;
      data.nivelServicio = data.ofrecidas > 0 ? ((data.umbral / data.ofrecidas) * 100).toFixed(2) : 0;
      data.colas = Array.from(data.colas);
      data.cantidadColas = data.colas.length;
    });

    res.render('provision/index', {
      title: 'KPIs · Dashboard',
      user: req.user,
      periodo: { anio, mes },
      dataset,
      datosPorDia,
      diasDelMes,
      totales,
      mesasResumen,
      vista,
      mesaSeleccionada,
      noData: false
    });
  } catch (e) {
    console.error('[PROVISION] Error en dashboard:', e);
    console.error('[PROVISION] Stack:', e.stack);
    req.flash('error_msg', 'Error cargando dashboard de KPIs: ' + e.message);
    res.redirect('/');
  }
});

// Helpers
function parseTimeToSeconds(timeStr) {
  if (!timeStr) return 0;
  
  // Formato puede ser HH:MM:SS o MM:SS
  const parts = String(timeStr).split(':');
  if (parts.length === 3) {
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseInt(parts[2], 10);
  } else if (parts.length === 2) {
    return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
  }
  return 0;
}

function secondsToHMS(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

module.exports = router;
