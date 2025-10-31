const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/auth');
const { requireTenant, getTenantModelFromReq } = require('../middleware/tenant');
const ExcelJS = require('exceljs');

// ❌ NO importar modelos multi-tenant directamente
// Modelos multi-tenant: ProvisionDataset, ProvisionRecord, Tarifa, NominaDataset, NominaRecord

router.use(ensureAuthenticated, requireTenant);

// Mapeo de nombres de campaña (nómina) a nombres de mesa (provisión)
const MAPEO_CAMPANA_MESA = {
  'BN - Mesa de Gestion Comercial': 'Gestion Comercial',
  'BN- GESTIÓN DE RECLAMOS DE PRIMER NIVEL Y REQ': 'Mesa de Reclamos',
  'BN- MESAS DE AYUDA': 'Mesa de Ayuda',
  'BN- Mesas de Telefonía y de Servicios': 'Central Telefónica y Servicios Generales',
  'BN- MONITOREO PREVENCIÓN Y TRATAMIENTO DEL FRAUDE': 'Prevención del Fraude',
  'BN- Monitoreo Prevención y tratamiento del Fraude': 'Prevención del Fraude',
  'BN- REDES SOCIALES': 'Redes Sociales',
  'SAC THE BODY SHOP': 'The Body Shop',
  // Mapeo inverso (de provisión a nómina) para asociaciones
  'Fraude - INBOUND': 'Prevención del Fraude',
  'Prevención del Fraude': 'BN- MONITOREO PREVENCIÓN Y TRATAMIENTO DEL FRAUDE'
};

// Mapeo de nombres de mesa a nombres de tarifa (para búsqueda en BD)
const MAPEO_MESA_TARIFA = {
  'Prevención del Fraude': 'Fraude - Inbound',
  'Redes Sociales': 'Redes Sociales - Agente'
};

// Función para normalizar nombres de mesa (provisión)
function normalizarNombreMesa(nombreMesa) {
  // Normalizar nombres de mesas de provisión a nombres más amigables
  if (nombreMesa === 'Fraude - INBOUND' || nombreMesa === 'Fraude - Inbound') {
    return 'Prevención del Fraude';
  }
  // Si tiene mapeo directo, usarlo
  if (MAPEO_CAMPANA_MESA[nombreMesa]) {
    return MAPEO_CAMPANA_MESA[nombreMesa];
  }
  return nombreMesa;
}

// Función para obtener el nombre de tarifa correcto
function obtenerNombreTarifa(nombreMesa) {
  // Si hay un mapeo específico de mesa a tarifa, usarlo
  if (MAPEO_MESA_TARIFA[nombreMesa]) {
    return MAPEO_MESA_TARIFA[nombreMesa];
  }
  // Si no, usar el nombre de mesa directamente
  return nombreMesa;
}

// Función para normalizar nombres de campaña a nombres de mesa
function mapearCampanaAMesa(campanaNomina) {
  // Primero intentar mapeo directo
  if (MAPEO_CAMPANA_MESA[campanaNomina]) {
    return MAPEO_CAMPANA_MESA[campanaNomina];
  }
  
  // Si no hay mapeo directo, intentar match parcial
  const campanaUpper = campanaNomina.toUpperCase();
  
  if (campanaUpper.includes('GESTION COMERCIAL') || campanaUpper.includes('GESTION COM')) {
    return 'Gestion Comercial';
  }
  if (campanaUpper.includes('RECLAMOS')) {
    return 'Mesa de Reclamos';
  }
  if (campanaUpper.includes('MESAS DE AYUDA') || campanaUpper.includes('AYUDA')) {
    return 'Mesa de Ayuda';
  }
  if (campanaUpper.includes('TELEFON')) {
    return 'Central Telefónica y Servicios Generales';
  }
  if (campanaUpper.includes('FRAUD') || campanaUpper.includes('MONITOREO') || campanaUpper.includes('FRAUDE')) {
    return 'Prevención del Fraude';
  }
  if (campanaUpper.includes('REDES SOCIALES')) {
    return 'Redes Sociales';
  }
  if (campanaUpper.includes('BODY SHOP')) {
    return 'The Body Shop';
  }
  
  // Si no hay match, retornar el nombre original
  return campanaNomina;
}

// Vista Anual del SRR - Reporte mensual con acumulado
router.get('/anual', async (req, res) => {
  try {
    // Obtener modelos dinámicos del tenant actual
    const ProvisionDataset = getTenantModelFromReq(req, 'ProvisionDataset');
    const ProvisionRecord = getTenantModelFromReq(req, 'ProvisionRecord');
    const NominaDataset = getTenantModelFromReq(req, 'NominaDataset');
    const NominaRecord = getTenantModelFromReq(req, 'NominaRecord');
    const Tarifa = getTenantModelFromReq(req, 'Tarifa');

    const hoy = new Date();
    const anio = parseInt(req.query.anio || hoy.getFullYear(), 10);
    const mesaFiltro = req.query.mesa || 'todas'; // Filtro por mesa

    console.log(`[SRR ANUAL] [Tenant: ${req.tenantId}] Procesando año ${anio}, Mesa: ${mesaFiltro}`);

    // ✅ Obtener todos los datasets de provisión del año (solo del tenant actual)
    const datasets = await ProvisionDataset.find({ anio: anio }).sort({ mes: 1 });

    // ✅ Obtener todos los datasets de nómina del año (solo del tenant actual)
    const nominasDatasets = await NominaDataset.find({ anio: anio }).sort({ mes: 1 });
    
    console.log(`[SRR ANUAL] Datasets provisión: ${datasets.length}, Nóminas: ${nominasDatasets.length}`);
    
    // Obtener todas las mesas únicas del año para el filtro
    const mesasUnicas = new Set();
    for (const dataset of datasets) {
      const registros = await ProvisionRecord.find({ datasetId: dataset._id });
      registros.forEach(reg => {
        if (reg.mesa) {
          const mesaNormalizada = normalizarNombreMesa(reg.mesa);
          mesasUnicas.add(mesaNormalizada);
        }
      });
    }
    const mesasDisponibles = Array.from(mesasUnicas).sort();
    
    console.log(`[SRR ANUAL] Mesas disponibles: ${mesasDisponibles.join(', ')}`);
    
    // Estructura de datos mensuales
    const meses = {};
    for (let m = 1; m <= 12; m++) {
      meses[m] = {
        mes: m,
        sales: 0,
        provision: 0,
        penal: 0,
        payroll: 0,
        eftCount: 0,
        estructuraSupervisor: 0,
        estructuraOtros: 0,
        margenBruto: 0,
        porcentajeMargen: 0,
        rotacion: 0,
        // Detalle participación
        payrollEFT: 0,
        payrollEstructura: 0,
        nominaOmega: 0,
        ratioEFT: 0,
        ratioEstructura: 0,
        ratioAgentesSuper: 0,
        ingresoPorEFT: 0,
        comisionesVariable: 0,
        porcentajeComisiones: 0
      };
    }
    
    // Procesar provisión (Sales/Ingresos) por mes
    for (const dataset of datasets) {
      const mes = dataset.mes;
      const registros = await ProvisionRecord.find({ datasetId: dataset._id });
      
      let ingresosMes = 0;
      const fechaPeriodo = new Date(anio, mes - 1, 15);
      
      // Calcular ingresos por mesa
      const mesasResumen = {};
      registros.forEach(reg => {
        const mesaOriginal = reg.mesa;
        const mesa = normalizarNombreMesa(mesaOriginal);
        
        // Aplicar filtro por mesa si no es "todas"
        if (mesaFiltro !== 'todas' && mesa !== mesaFiltro) {
          return; // Saltar esta mesa
        }
        
        if (!mesasResumen[mesa]) {
          mesasResumen[mesa] = { contestadas: 0 };
        }
        mesasResumen[mesa].contestadas += reg.contestadas || 0;
      });
      
      // Calcular costos con tarifas
      for (const [mesaOriginal, data] of Object.entries(mesasResumen)) {
        const mesa = normalizarNombreMesa(mesaOriginal); // Primero normalizar
        const nombreTarifa = obtenerNombreTarifa(mesa); // Luego obtener nombre de tarifa
        const tarifa = await Tarifa.obtenerTarifaVigente(nombreTarifa, fechaPeriodo);
        if (tarifa) {
          const costoUnitario = tarifa.obtenerCostoUnitario(data.contestadas, false);
          ingresosMes += data.contestadas * costoUnitario;
        }
      }
      
      meses[mes].sales = Math.round(ingresosMes * 100) / 100;
      meses[mes].provision = Math.round(ingresosMes * 100) / 100; // Provisión = Sales
      
      console.log(`[SRR ANUAL] Mes ${mes}: Sales = S/ ${ingresosMes.toFixed(2)}`);
    }
    
    // Procesar nómina (Payroll) por mes
    for (const nominaDataset of nominasDatasets) {
      const mes = nominaDataset.mes;
      
      const nominaRecords = await NominaRecord.find({ datasetId: nominaDataset._id });
      
      let payrollTotal = 0;
      let payrollEFT = 0;
      let payrollEstructura = 0;
      let comisionesTotal = 0;
      let countEFT = 0;
      let countSupervisor = 0;
      let countOtros = 0;
      
      nominaRecords.forEach(record => {
        const cargo = record.cargo || '';
        const campana = record.campana || '';
        const campanaUpper = campana.toUpperCase();
        const costo = record.costoTotalEmpleador || 0;
        const comisiones = (record.bonoIncentivos || 0) + (record.bonoCumplimientos || 0) + (record.comisiones || 0);
        const agentesEfectivos = record.agentesEfectivos || 0;
        
        // Mapear campaña a mesa
        const mesaNomina = mapearCampanaAMesa(campana);
        
        // Aplicar filtro por mesa si no es "todas"
        if (mesaFiltro !== 'todas' && mesaNomina !== mesaFiltro) {
          return; // Saltar este registro
        }
        
        // Filtrar "SAC THE BODY SHOP" de los conteos de EFT
        const esSACBodyShop = campanaUpper.includes('BODY SHOP') || campanaUpper.includes('SAC THE BODY SHOP');
        
        payrollTotal += costo;
        comisionesTotal += comisiones;
        
        // Clasificar por tipo según reglas exactas de la imagen
        let tipoAgrupacion = 'OTROS';
        
        if (cargo.match(/^Agente\s+(de\s+ventas|telefónico|telefonico)/i) ||
            cargo.match(/^Asesor\s+De\s+Monitoreo/i) ||
            cargo.match(/^Back\s+Office$/i)) {
          tipoAgrupacion = 'EFT';
          payrollEFT += costo;
          if (!esSACBodyShop) {
            countEFT += agentesEfectivos; // Sumar agentes efectivos, no solo count
          }
        } else if (cargo.match(/^Supervisor\s+de\s+Operaciones$/i)) {
          tipoAgrupacion = 'SUPERVISOR';
          payrollEstructura += costo;
          countSupervisor++;
        } else {
          tipoAgrupacion = 'OTROS';
          payrollEstructura += costo;
          countOtros++;
        }
      });
      
      meses[mes].payroll = Math.round(payrollTotal * 100) / 100;
      meses[mes].eftCount = Math.round(countEFT * 100) / 100;
      meses[mes].estructuraSupervisor = Math.round(countSupervisor);
      meses[mes].estructuraOtros = Math.round(countOtros);
      meses[mes].payrollEFT = Math.round(payrollEFT * 100) / 100;
      meses[mes].payrollEstructura = Math.round(payrollEstructura * 100) / 100;
      meses[mes].nominaOmega = Math.round(payrollTotal * 100) / 100;
      meses[mes].comisionesVariable = Math.round(comisionesTotal * 100) / 100;
      
      // Calcular margen bruto
      meses[mes].margenBruto = Math.round((meses[mes].sales - payrollTotal) * 100) / 100;
      meses[mes].porcentajeMargen = meses[mes].sales > 0
        ? Math.round(((meses[mes].margenBruto / meses[mes].sales) * 100) * 100) / 100
        : 0;

      // Ratios
      meses[mes].ratioEFT = payrollTotal > 0 ? Math.round((payrollEFT / payrollTotal * 100) * 100) / 100 : 0;
      meses[mes].ratioEstructura = payrollTotal > 0 ? Math.round((payrollEstructura / payrollTotal * 100) * 100) / 100 : 0;
      meses[mes].ratioAgentesSuper = countSupervisor > 0 ? Math.round((countEFT / countSupervisor) * 100) / 100 : 0;
      meses[mes].ingresoPorEFT = countEFT > 0 ? Math.round((meses[mes].sales / countEFT) * 100) / 100 : 0;
      meses[mes].porcentajeComisiones = payrollTotal > 0 ? Math.round((comisionesTotal / payrollTotal * 100) * 100) / 100 : 0;
      
      console.log(`[SRR ANUAL] Mes ${mes}: Payroll = S/ ${payrollTotal.toFixed(2)}, EFT = ${countEFT}`);
    }
    
    // Calcular acumulados
    let acumulado = {
      mes: 'ACUM',
      sales: 0,
      provision: 0,
      penal: 0,
      payroll: 0,
      eftCount: 0,
      estructuraSupervisor: 0,
      estructuraOtros: 0,
      margenBruto: 0,
      porcentajeMargen: 0,
      rotacion: 0,
      payrollEFT: 0,
      payrollEstructura: 0,
      nominaOmega: 0,
      comisionesVariable: 0,
      ratioEFT: 0,
      ratioEstructura: 0,
      ratioAgentesSuper: 0,
      ingresoPorEFT: 0,
      porcentajeComisiones: 0
    };
    
    for (let m = 1; m <= 12; m++) {
      acumulado.sales += meses[m].sales;
      acumulado.provision += meses[m].provision;
      acumulado.payroll += meses[m].payroll;
      acumulado.eftCount += meses[m].eftCount;
      acumulado.estructuraSupervisor += meses[m].estructuraSupervisor;
      acumulado.estructuraOtros += meses[m].estructuraOtros;
      acumulado.payrollEFT += meses[m].payrollEFT;
      acumulado.payrollEstructura += meses[m].payrollEstructura;
      acumulado.comisionesVariable += meses[m].comisionesVariable;
    }

    // Redondear acumulados a 2 decimales
    acumulado.sales = Math.round(acumulado.sales * 100) / 100;
    acumulado.provision = Math.round(acumulado.provision * 100) / 100;
    acumulado.payroll = Math.round(acumulado.payroll * 100) / 100;
    acumulado.eftCount = Math.round(acumulado.eftCount * 100) / 100;
    acumulado.estructuraSupervisor = Math.round(acumulado.estructuraSupervisor);
    acumulado.estructuraOtros = Math.round(acumulado.estructuraOtros);
    acumulado.payrollEFT = Math.round(acumulado.payrollEFT * 100) / 100;
    acumulado.payrollEstructura = Math.round(acumulado.payrollEstructura * 100) / 100;
    acumulado.comisionesVariable = Math.round(acumulado.comisionesVariable * 100) / 100;

    acumulado.margenBruto = Math.round((acumulado.sales - acumulado.payroll) * 100) / 100;
    acumulado.porcentajeMargen = acumulado.sales > 0 ? Math.round(((acumulado.margenBruto / acumulado.sales) * 100) * 100) / 100 : 0;
    acumulado.nominaOmega = acumulado.payroll;
    acumulado.ratioEFT = acumulado.payroll > 0 ? Math.round((acumulado.payrollEFT / acumulado.payroll * 100) * 100) / 100 : 0;
    acumulado.ratioEstructura = acumulado.payroll > 0 ? Math.round((acumulado.payrollEstructura / acumulado.payroll * 100) * 100) / 100 : 0;
    acumulado.ratioAgentesSuper = acumulado.estructuraSupervisor > 0 ? Math.round((acumulado.eftCount / acumulado.estructuraSupervisor) * 100) / 100 : 0;
    acumulado.ingresoPorEFT = acumulado.eftCount > 0 ? Math.round((acumulado.sales / acumulado.eftCount) * 100) / 100 : 0;
    acumulado.porcentajeComisiones = acumulado.payroll > 0 ? Math.round((acumulado.comisionesVariable / acumulado.payroll * 100) * 100) / 100 : 0;
    
    console.log('[SRR ANUAL] Renderizando vista con', Object.keys(meses).length, 'meses');
    console.log('[SRR ANUAL] Acumulado sales:', acumulado.sales);
    console.log('[SRR ANUAL] Filtro aplicado: Mesa =', mesaFiltro);
    
    res.render('srr/anual', {
      title: 'SRR Anual · Service Results Report',
      user: req.user,
      anio,
      meses,
      acumulado,
      mesasDisponibles,
      mesaFiltro
    });
  } catch (e) {
    console.error('[SRR ANUAL] ==================== ERROR ====================');
    console.error('[SRR ANUAL] Error:', e);
    console.error('[SRR ANUAL] Message:', e.message);
    console.error('[SRR ANUAL] Stack:', e.stack);
    console.error('[SRR ANUAL] ================================================');
    req.flash('error_msg', 'Error cargando reporte anual: ' + e.message);
    res.status(500).send(`
      <h1>Error en Vista Anual</h1>
      <p><strong>Mensaje:</strong> ${e.message}</p>
      <pre>${e.stack}</pre>
    `);
  }
});

// Dashboard SRR - Service Results Report
router.get('/', async (req, res) => {
  try {
    const ProvisionDataset = getTenantModelFromReq(req, 'ProvisionDataset');
    const ProvisionRecord = getTenantModelFromReq(req, 'ProvisionRecord');
    const NominaDataset = getTenantModelFromReq(req, 'NominaDataset');
    const NominaRecord = getTenantModelFromReq(req, 'NominaRecord');
    const Tarifa = getTenantModelFromReq(req, 'Tarifa');

    console.log('[SRR] Acceso a Service Results Report');
    const hoy = new Date();
    const anio = parseInt(req.query.anio || hoy.getFullYear(), 10);
    const mes = parseInt(req.query.mes || (hoy.getMonth() + 1), 10);

    // Buscar dataset del periodo
    const dataset = await ProvisionDataset.findOne({ anio: anio, mes });
    
    if (!dataset) {
      return res.render('srr/index', {
        title: 'SRR · Service Results Report',
        user: req.user,
        periodo: { anio, mes },
        noData: true,
        mesasData: [],
        totales: {},
        detalleNomina: []
      });
    }
    
    // Obtener registros del mes
    const registros = await ProvisionRecord.find({ datasetId: dataset._id }).sort({ fecha: 1, cola: 1 });
    console.log('[SRR] Total de registros encontrados:', registros.length);
    
    // Agregar por mesa
    const mesasResumen = {};
    
    registros.forEach(reg => {
      if (!reg.fecha || !reg.mesa || !reg.cola) return;
      
      const mesa = reg.mesa;
      
      if (!mesasResumen[mesa]) {
        mesasResumen[mesa] = {
          mesa,
          ofrecidas: 0,
          contestadas: 0,
          umbral: 0,
          tmoSegs: [],
          colas: new Set()
        };
      }
      
      mesasResumen[mesa].ofrecidas += reg.ofrecidas || 0;
      mesasResumen[mesa].contestadas += reg.contestadas || 0;
      mesasResumen[mesa].umbral += reg.umbral || 0;
      mesasResumen[mesa].colas.add(reg.cola);
      
      if (reg.tmoSegundos > 0) {
        mesasResumen[mesa].tmoSegs.push(reg.tmoSegundos);
      }
    });
    
    // Calcular KPIs y costos por mesa
    const fechaPeriodo = new Date(anio, mes - 1, 15);
    const mesasData = [];
    let totales = {
      ofrecidas: 0,
      contestadas: 0,
      umbral: 0,
      costoTotal: 0,
      costoConIGV: 0
    };
    
    for (const mesaOriginal of Object.keys(mesasResumen).sort()) {
      const mesaData = mesasResumen[mesaOriginal];
      const mesa = normalizarNombreMesa(mesaOriginal); // Normalizar nombre de mesa
      mesaData.mesa = mesa; // Actualizar con nombre normalizado
      
      // Calcular KPIs
      mesaData.nivelAtencion = mesaData.ofrecidas > 0 
        ? ((mesaData.contestadas / mesaData.ofrecidas) * 100).toFixed(2) 
        : 0;
      mesaData.nivelServicio = mesaData.ofrecidas > 0 
        ? ((mesaData.umbral / mesaData.ofrecidas) * 100).toFixed(2) 
        : 0;
      
      // TMO promedio
      if (mesaData.tmoSegs.length > 0) {
        const suma = mesaData.tmoSegs.reduce((a, b) => a + b, 0);
        mesaData.tmoSegundos = Math.round(suma / mesaData.tmoSegs.length);
        mesaData.tmo = secondsToHMS(mesaData.tmoSegundos);
      } else {
        mesaData.tmoSegundos = 0;
        mesaData.tmo = '00:00:00';
      }
      
      mesaData.cantidadColas = mesaData.colas.size;
      delete mesaData.tmoSegs;
      delete mesaData.colas;
      
      // Buscar tarifa vigente
      const nombreTarifa = obtenerNombreTarifa(mesa);
      const tarifa = await Tarifa.obtenerTarifaVigente(nombreTarifa, fechaPeriodo);
      
      console.log(`[SRR] Buscando tarifa para mesa: "${mesa}" → tarifa: "${nombreTarifa}" → ${tarifa ? '✅ ENCONTRADA' : '❌ NO ENCONTRADA'}`);
      
      if (tarifa) {
        const cantidadLlamadas = mesaData.contestadas;
        const costoUnitarioSinIGV = tarifa.obtenerCostoUnitario(cantidadLlamadas, false);
        const costoUnitarioConIGV = tarifa.obtenerCostoUnitario(cantidadLlamadas, true);
        const costoTotalSinIGV = cantidadLlamadas * costoUnitarioSinIGV;
        const costoTotalConIGV = cantidadLlamadas * costoUnitarioConIGV;
        
        mesaData.costoUnitarioSinIGV = costoUnitarioSinIGV;
        mesaData.costoUnitarioConIGV = costoUnitarioConIGV;
        mesaData.costoTotalSinIGV = costoTotalSinIGV;
        mesaData.costoTotalConIGV = costoTotalConIGV;
        mesaData.tieneONR = tarifa.onrSinIGV ? true : false;
        mesaData.onrCostoSinIGV = tarifa.onrSinIGV || 0;
        mesaData.onrCostoConIGV = tarifa.onrConIGV || 0;
        mesaData.tieneTarifa = true;
        
        totales.costoTotal += costoTotalSinIGV;
        totales.costoConIGV += costoTotalConIGV;
      } else {
        mesaData.costoUnitarioSinIGV = 0;
        mesaData.costoUnitarioConIGV = 0;
        mesaData.costoTotalSinIGV = 0;
        mesaData.costoTotalConIGV = 0;
        mesaData.tieneONR = false;
        mesaData.onrCostoSinIGV = 0;
        mesaData.onrCostoConIGV = 0;
        mesaData.tieneTarifa = false;
      }
      
      totales.ofrecidas += mesaData.ofrecidas;
      totales.contestadas += mesaData.contestadas;
      totales.umbral += mesaData.umbral;
      
      mesasData.push(mesaData);
    }
    
    // Buscar nómina del periodo para calcular costos reales
    const nominaDataset = await NominaDataset.findOne({ anio, mes });
    let nominaData = {};
    let costosTotalesNomina = 0;
    let detalleNomina = [];
    
    console.log('[SRR] Buscando nómina para', anio, '-', mes, ':', nominaDataset ? 'ENCONTRADA' : 'NO ENCONTRADA');
    
    if (nominaDataset) {
      // Obtener registros de nómina
      const nominaRecords = await NominaRecord.find({ datasetId: nominaDataset._id });
      console.log('[SRR] Registros de nómina encontrados:', nominaRecords.length);
      
      // Crear mapa de campañas únicas para debugging
      const campanasUnicas = new Set();
      
      // Agrupar costos por campaña (con mapeo a nombres de mesa)
      nominaRecords.forEach(record => {
        const campanaNomina = record.campana || 'Sin Campaña';
        const mesaMapeada = mapearCampanaAMesa(campanaNomina);
        
        campanasUnicas.add(`${campanaNomina} => ${mesaMapeada}`);
        
        if (!nominaData[mesaMapeada]) {
          nominaData[mesaMapeada] = {
            costoTotal: 0,
            empleados: 0,
            sueldoBruto: 0,
            bonos: 0
          };
        }
        
        nominaData[mesaMapeada].costoTotal += record.costoTotalEmpleador || 0;
        nominaData[mesaMapeada].sueldoBruto += record.sueldoBruto || 0;
        nominaData[mesaMapeada].bonos += (record.bonoIncentivos || 0) + (record.bonoCumplimientos || 0);
        nominaData[mesaMapeada].empleados += 1;
        
        costosTotalesNomina += record.costoTotalEmpleador || 0;
      });
      
      console.log('[SRR] Campañas en nómina:', Array.from(campanasUnicas));
      console.log('[SRR] Mesas en provisión:', mesasData.map(m => m.mesa));
      console.log('[SRR] Costo total nómina:', costosTotalesNomina);
      console.log('[SRR] nominaData mapeado:', Object.keys(nominaData).map(k => `${k}: S/ ${nominaData[k].costoTotal.toFixed(2)}`));
      
      // Obtener detalle de nómina por campaña, cargo y agrupación
      detalleNomina = await NominaRecord.aggregate([
        { $match: { datasetId: nominaDataset._id } },
        {
          $group: {
            _id: {
              campana: '$campana',
              cargo: '$cargo'
            },
            agentesEfectivos: { $sum: '$agentesEfectivos' },
            empleados: { $sum: 1 }
          }
        },
        {
          $project: {
            _id: 0,
            campana: '$_id.campana',
            cargo: '$_id.cargo',
            agentesEfectivos: { $ifNull: ['$agentesEfectivos', 0] },
            empleados: '$empleados',
            // Clasificar agrupación según el cargo (exacto según imagen)
            agrupacion: {
              $switch: {
                branches: [
                  // EFT: Agentes, Asesores, Back Office
                  {
                    case: { 
                      $regexMatch: { 
                        input: { $ifNull: ['$_id.cargo', ''] }, 
                        regex: /^Agente\s+(de\s+ventas|telefónico|telefonico)/i 
                      } 
                    },
                    then: 'EFT'
                  },
                  {
                    case: { 
                      $regexMatch: { 
                        input: { $ifNull: ['$_id.cargo', ''] }, 
                        regex: /^Asesor\s+De\s+Monitoreo/i 
                      } 
                    },
                    then: 'EFT'
                  },
                  {
                    case: { 
                      $regexMatch: { 
                        input: { $ifNull: ['$_id.cargo', ''] }, 
                        regex: /^Back\s+Office$/i 
                      } 
                    },
                    then: 'EFT'
                  },
                  // SUPERVISOR: Solo "Supervisor de Operaciones" exacto
                  {
                    case: { 
                      $regexMatch: { 
                        input: { $ifNull: ['$_id.cargo', ''] }, 
                        regex: /^Supervisor\s+de\s+Operaciones$/i 
                      } 
                    },
                    then: 'SUPERVISOR'
                  }
                ],
                default: 'OTROS'
              }
            }
          }
        },
        { $sort: { campana: 1, agrupacion: 1, cargo: 1 } }
      ]);
      
      console.log('[SRR] Detalle nómina registros:', detalleNomina.length);
      console.log('[SRR] Muestra detalle nómina:', detalleNomina.slice(0, 5).map(d => ({
        campana: d.campana,
        cargo: d.cargo,
        agentesEfectivos: d.agentesEfectivos,
        agrupacion: d.agrupacion
      })));
      
      // Asignar costos de nómina a cada mesa (ya mapeados)
      for (const mesa of mesasData) {
        const nombreMesa = mesa.mesa;
        
        // Los datos ya están mapeados correctamente en nominaData
        const costoNomina = nominaData[nombreMesa] ? nominaData[nombreMesa].costoTotal : 0;
        const empleados = nominaData[nombreMesa] ? nominaData[nombreMesa].empleados : 0;
        
        mesa.costoNomina = costoNomina;
        mesa.empleados = empleados;
        
        // Calcular Ingresos (Sales) = Llamadas × Tarifa
        mesa.ingresos = mesa.costoTotalSinIGV || 0;
        
        // Calcular Margen Bruto = Ingresos - Costos Nómina
        mesa.margenBruto = mesa.ingresos - costoNomina;
        mesa.porcentajeMargen = mesa.ingresos > 0 
          ? ((mesa.margenBruto / mesa.ingresos) * 100).toFixed(2) 
          : 0;
        
        if (costoNomina > 0) {
          console.log(`[SRR] ✅ ${nombreMesa}: ${empleados} empleados, S/ ${costoNomina.toFixed(2)}`);
        } else {
          console.log(`[SRR] ⚠️ ${nombreMesa}: Sin costos de nómina`);
        }
      }
    } else {
      console.log('[SRR] No hay nómina cargada, todos los costos serán 0');
      // Sin nómina, solo mostrar ingresos sin costos
      for (const mesa of mesasData) {
        mesa.costoNomina = 0;
        mesa.empleados = 0;
        mesa.ingresos = mesa.costoTotalSinIGV || 0;
        mesa.margenBruto = mesa.ingresos;
        mesa.porcentajeMargen = 100;
      }
    }
    
    // Calcular totales de ingresos y márgenes
    totales.ingresosTotales = mesasData.reduce((sum, m) => sum + (m.ingresos || 0), 0);
    totales.costosNomina = costosTotalesNomina;
    totales.margenBrutoTotal = totales.ingresosTotales - totales.costosNomina;
    totales.porcentajeMargenTotal = totales.ingresosTotales > 0 
      ? ((totales.margenBrutoTotal / totales.ingresosTotales) * 100).toFixed(2) 
      : 0;
    
    // Calcular KPIs totales
    totales.nivelAtencion = totales.ofrecidas > 0 
      ? ((totales.contestadas / totales.ofrecidas) * 100).toFixed(2) 
      : 0;
    totales.nivelServicio = totales.ofrecidas > 0 
      ? ((totales.umbral / totales.ofrecidas) * 100).toFixed(2) 
      : 0;
    
    res.render('srr/index', {
      title: 'SRR · Service Results Report',
      user: req.user,
      periodo: { anio, mes },
      dataset,
      mesasData,
      totales,
      detalleNomina,
      noData: false
    });
  } catch (e) {
    console.error('[SRR] Error:', e);
    console.error('[SRR] Stack:', e.stack);

    // En lugar de redirigir, mostrar la vista con el error
    const hoy = new Date();
    const anio = parseInt(req.query.anio || hoy.getFullYear(), 10);
    const mes = parseInt(req.query.mes || (hoy.getMonth() + 1), 10);

    res.render('srr/index', {
      title: 'SRR · Service Results Report',
      user: req.user,
      periodo: { anio, mes },
      noData: true,
      mesasData: [],
      totales: {},
      detalleNomina: [],
      error: e.message
    });
  }
});

// Exportar a Excel
router.get('/export/excel', async (req, res) => {
  try {
    const ProvisionDataset = getTenantModelFromReq(req, 'ProvisionDataset');
    const ProvisionRecord = getTenantModelFromReq(req, 'ProvisionRecord');
    const Tarifa = getTenantModelFromReq(req, 'Tarifa');

    const anio = parseInt(req.query.anio, 10);
    const mes = parseInt(req.query.mes, 10);

    const dataset = await ProvisionDataset.findOne({ anio: anio, mes });
    if (!dataset) {
      req.flash('error_msg', 'No hay datos para este periodo');
      return res.redirect('/srr');
    }

    // Obtener datos (mismo proceso que arriba pero simplificado)
    const registros = await ProvisionRecord.find({ datasetId: dataset._id });
    const mesasResumen = {};
    
    registros.forEach(reg => {
      if (!reg.fecha || !reg.mesa || !reg.cola) return;
      const mesa = reg.mesa;
      
      if (!mesasResumen[mesa]) {
        mesasResumen[mesa] = {
          mesa,
          ofrecidas: 0,
          contestadas: 0,
          umbral: 0,
          tmoSegs: []
        };
      }
      
      mesasResumen[mesa].ofrecidas += reg.ofrecidas || 0;
      mesasResumen[mesa].contestadas += reg.contestadas || 0;
      mesasResumen[mesa].umbral += reg.umbral || 0;
      
      if (reg.tmoSegundos > 0) {
        mesasResumen[mesa].tmoSegs.push(reg.tmoSegundos);
      }
    });
    
    // Crear workbook
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('SRR - Service Results');
    
    // Headers
    worksheet.columns = [
      { header: 'Mesa', key: 'mesa', width: 35 },
      { header: 'Llamadas Ofrecidas', key: 'ofrecidas', width: 18 },
      { header: 'Llamadas Contestadas', key: 'contestadas', width: 20 },
      { header: 'Llamadas en Umbral', key: 'umbral', width: 18 },
      { header: '% Nivel Atención', key: 'nivelAtencion', width: 16 },
      { header: '% Nivel Servicio', key: 'nivelServicio', width: 16 },
      { header: 'TMO Promedio', key: 'tmo', width: 14 },
      { header: 'Costo Unitario (S/)', key: 'costoUnitario', width: 18 },
      { header: 'Costo Total (S/)', key: 'costoTotal', width: 18 }
    ];
    
    // Estilo del header
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    
    const fechaPeriodo = new Date(anio, mes - 1, 15);
    
    // Agregar datos
    for (const mesaOriginal of Object.keys(mesasResumen).sort()) {
      const mesaData = mesasResumen[mesaOriginal];
      const mesa = normalizarNombreMesa(mesaOriginal); // Normalizar nombre de mesa
      
      const nivelAtencion = mesaData.ofrecidas > 0 
        ? ((mesaData.contestadas / mesaData.ofrecidas) * 100).toFixed(2) 
        : 0;
      const nivelServicio = mesaData.ofrecidas > 0 
        ? ((mesaData.umbral / mesaData.ofrecidas) * 100).toFixed(2) 
        : 0;
      
      let tmo = '00:00:00';
      if (mesaData.tmoSegs.length > 0) {
        const suma = mesaData.tmoSegs.reduce((a, b) => a + b, 0);
        const tmoSegundos = Math.round(suma / mesaData.tmoSegs.length);
        tmo = secondsToHMS(tmoSegundos);
      }
      
      const nombreTarifa = obtenerNombreTarifa(mesa);
      const tarifa = await Tarifa.obtenerTarifaVigente(nombreTarifa, fechaPeriodo);
      let costoUnitario = 0;
      let costoTotal = 0;
      
      if (tarifa) {
        costoUnitario = tarifa.obtenerCostoUnitario(mesaData.contestadas, false);
        costoTotal = mesaData.contestadas * costoUnitario;
      }
      
      worksheet.addRow({
        mesa,
        ofrecidas: mesaData.ofrecidas,
        contestadas: mesaData.contestadas,
        umbral: mesaData.umbral,
        nivelAtencion: `${nivelAtencion}%`,
        nivelServicio: `${nivelServicio}%`,
        tmo,
        costoUnitario: costoUnitario.toFixed(2),
        costoTotal: costoTotal.toFixed(2)
      });
    }
    
    // Formato de números
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1) {
        row.getCell(2).numFmt = '#,##0';
        row.getCell(3).numFmt = '#,##0';
        row.getCell(4).numFmt = '#,##0';
        row.getCell(8).numFmt = '#,##0.00';
        row.getCell(9).numFmt = '#,##0.00';
      }
    });
    
    // Enviar archivo
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=SRR_${anio}-${String(mes).padStart(2, '0')}.xlsx`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error('[SRR] Error exportando:', e);
    req.flash('error_msg', 'Error exportando a Excel');
    res.redirect('/srr');
  }
});

// Helper para convertir segundos a HH:MM:SS
function secondsToHMS(seconds) {
  if (!seconds || seconds === 0) return '00:00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

module.exports = router;
