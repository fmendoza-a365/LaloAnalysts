const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const ProvisionDataset = require('../models/ProvisionDataset');
const ProvisionRecord = require('../models/ProvisionRecord');
const Tarifa = require('../models/Tarifa');

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

    // Obtener registros del mes (ahora cada registro es una cola individual por día)
    const registros = await ProvisionRecord.find({ datasetId: dataset._id }).sort({ fecha: 1, cola: 1 });
    console.log('[PROVISION] Total de registros encontrados:', registros.length);

    // Calcular métricas agregadas por día y por mesa
    const datosPorDia = {};
    const mesasResumen = {};
    
    registros.forEach(reg => {
      // Validar que tenga fecha y mesa
      if (!reg.fecha || !reg.mesa || !reg.cola) {
        console.warn('[PROVISION] Registro incompleto:', reg._id);
        return;
      }
      
      const dia = reg.fecha.getDate();
      
      // Inicializar día si no existe
      if (!datosPorDia[dia]) {
        datosPorDia[dia] = {
          dia,
          ofrecidas: 0,
          contestadas: 0,
          umbral: 0,
          tmoSegs: [],
          mesas: {}
        };
      }
      
      // Acumular totales del día
      datosPorDia[dia].ofrecidas += reg.ofrecidas || 0;
      datosPorDia[dia].contestadas += reg.contestadas || 0;
      datosPorDia[dia].umbral += reg.umbral || 0;
      
      // Acumular TMO en segundos
      if (reg.tmoSegundos > 0) {
        datosPorDia[dia].tmoSegs.push(reg.tmoSegundos);
      }
      
      const mesa = reg.mesa;
      
      // Inicializar mesa si no existe
      if (!mesasResumen[mesa]) {
        mesasResumen[mesa] = {
          ofrecidas: 0,
          contestadas: 0,
          umbral: 0,
          tmoSegs: [],
          colas: new Set(),
          datosPorDia: {},
          colasPorDia: {}
        };
      }
      
      // Acumular totales de la mesa
      mesasResumen[mesa].ofrecidas += reg.ofrecidas || 0;
      mesasResumen[mesa].contestadas += reg.contestadas || 0;
      mesasResumen[mesa].umbral += reg.umbral || 0;
      mesasResumen[mesa].colas.add(reg.cola);
      
      if (reg.tmoSegundos > 0) {
        mesasResumen[mesa].tmoSegs.push(reg.tmoSegundos);
      }
      
      // Datos por día de la mesa
      if (!mesasResumen[mesa].datosPorDia[dia]) {
        mesasResumen[mesa].datosPorDia[dia] = {
          ofrecidas: 0,
          contestadas: 0,
          umbral: 0,
          tmoSegs: []
        };
      }
      
      mesasResumen[mesa].datosPorDia[dia].ofrecidas += reg.ofrecidas || 0;
      mesasResumen[mesa].datosPorDia[dia].contestadas += reg.contestadas || 0;
      mesasResumen[mesa].datosPorDia[dia].umbral += reg.umbral || 0;
      
      if (reg.tmoSegundos > 0) {
        mesasResumen[mesa].datosPorDia[dia].tmoSegs.push(reg.tmoSegundos);
      }
      
      // Datos por cola por día
      if (!mesasResumen[mesa].colasPorDia[reg.cola]) {
        mesasResumen[mesa].colasPorDia[reg.cola] = {};
      }
      
      mesasResumen[mesa].colasPorDia[reg.cola][dia] = {
        ofrecidas: reg.ofrecidas || 0,
        contestadas: reg.contestadas || 0,
        umbral: reg.umbral || 0,
        tmo: reg.tmo || '00:00:00',
        tmoSegundos: reg.tmoSegundos || 0
      };
      
      // Datos por mesa del día
      if (!datosPorDia[dia].mesas[mesa]) {
        datosPorDia[dia].mesas[mesa] = {
          ofrecidas: 0,
          contestadas: 0,
          umbral: 0
        };
      }
      
      datosPorDia[dia].mesas[mesa].ofrecidas += reg.ofrecidas || 0;
      datosPorDia[dia].mesas[mesa].contestadas += reg.contestadas || 0;
      datosPorDia[dia].mesas[mesa].umbral += reg.umbral || 0;
    });

    // Calcular promedios y totales
    const diasDelMes = Object.keys(datosPorDia).sort((a, b) => a - b);
    let totales = {
      ofrecidas: 0,
      contestadas: 0,
      umbral: 0,
      tmoSegs: []
    };

    diasDelMes.forEach(dia => {
      const dato = datosPorDia[dia];
      
      // Calcular porcentajes del día
      dato.nivelAtencion = dato.ofrecidas > 0 ? ((dato.contestadas / dato.ofrecidas) * 100).toFixed(2) : 0;
      dato.nivelServicio = dato.ofrecidas > 0 ? ((dato.umbral / dato.ofrecidas) * 100).toFixed(2) : 0;
      
      // TMO promedio del día
      if (dato.tmoSegs.length > 0) {
        const suma = dato.tmoSegs.reduce((a, b) => a + b, 0);
        dato.tmoSegundos = Math.round(suma / dato.tmoSegs.length);
        dato.tmoFormato = secondsToHMS(dato.tmoSegundos);
      } else {
        dato.tmoSegundos = 0;
        dato.tmoFormato = '00:00:00';
      }
      
      // Acumular totales
      totales.ofrecidas += dato.ofrecidas;
      totales.contestadas += dato.contestadas;
      totales.umbral += dato.umbral;
      if (dato.tmoSegundos > 0) totales.tmoSegs.push(dato.tmoSegundos);
    });

    // Calcular totales finales
    totales.nivelAtencion = totales.ofrecidas > 0 ? ((totales.contestadas / totales.ofrecidas) * 100).toFixed(2) : 0;
    totales.nivelServicio = totales.ofrecidas > 0 ? ((totales.umbral / totales.ofrecidas) * 100).toFixed(2) : 0;
    
    if (totales.tmoSegs.length > 0) {
      const suma = totales.tmoSegs.reduce((a, b) => a + b, 0);
      totales.tmoSegundos = Math.round(suma / totales.tmoSegs.length);
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
      
      // TMO promedio de la mesa
      if (data.tmoSegs.length > 0) {
        const suma = data.tmoSegs.reduce((a, b) => a + b, 0);
        data.tmoSegundos = Math.round(suma / data.tmoSegs.length);
        data.tmoFormato = secondsToHMS(data.tmoSegundos);
      } else {
        data.tmoSegundos = 0;
        data.tmoFormato = '00:00:00';
      }
      
      // Calcular TMO promedio por día de la mesa
      Object.keys(data.datosPorDia).forEach(dia => {
        const datosDia = data.datosPorDia[dia];
        if (datosDia.tmoSegs && datosDia.tmoSegs.length > 0) {
          const suma = datosDia.tmoSegs.reduce((a, b) => a + b, 0);
          datosDia.tmoSegundos = Math.round(suma / datosDia.tmoSegs.length);
          datosDia.tmo = secondsToHMS(datosDia.tmoSegundos);
        } else {
          datosDia.tmoSegundos = 0;
          datosDia.tmo = '00:00:00';
        }
        delete datosDia.tmoSegs; // Limpiar array temporal
      });
    });

    // Calcular costos por mesa usando tarifas
    const fechaPeriodo = new Date(anio, mes - 1, 15); // Mitad del mes para buscar tarifa vigente
    const costosPorMesa = {};
    
    for (const mesa of Object.keys(mesasResumen)) {
      const mesaData = mesasResumen[mesa];
      
      // Buscar tarifa vigente para esta mesa
      const tarifa = await Tarifa.obtenerTarifaVigente(mesa, fechaPeriodo);
      
      if (tarifa) {
        const cantidadLlamadas = mesaData.contestadas; // Usar llamadas contestadas
        const costoUnitario = tarifa.obtenerCostoUnitario(cantidadLlamadas, false); // Sin IGV
        const costoTotal = cantidadLlamadas * costoUnitario;
        
        costosPorMesa[mesa] = {
          costoUnitario: costoUnitario.toFixed(2),
          costoTotal: costoTotal.toFixed(2),
          cantidadLlamadas,
          tieneONR: tarifa.onrSinIGV ? true : false,
          onrCosto: tarifa.onrSinIGV || 0
        };
      } else {
        costosPorMesa[mesa] = {
          costoUnitario: 0,
          costoTotal: 0,
          cantidadLlamadas: mesaData.contestadas,
          tieneONR: false,
          onrCosto: 0
        };
      }
    }

    res.render('provision/index', {
      title: 'KPIs · Dashboard',
      user: req.user,
      periodo: { anio, mes },
      dataset,
      datosPorDia,
      diasDelMes,
      totales,
      mesasResumen,
      costosPorMesa,
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
