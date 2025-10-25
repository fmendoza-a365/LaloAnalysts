function toStr(v){ return v == null ? '' : String(v).trim(); }
function toNum(v){ const n = Number(v); return isNaN(n) ? 0 : n; }

const EFECTIVOS = new Set(['P','LCG','LSG','FP','FCF','DM','V','PF','DSO']);
const NO_EFECTIVOS = new Set(['FI','FER','DS','LM','']);

function esEfectivo(valor){
  const s = toStr(valor).toUpperCase();
  if (!s) return false;
  if (/^\d+$/.test(s)) return true;
  return EFECTIVOS.has(s);
}

function esFalta(valor){
  const s = toStr(valor).toUpperCase();
  if (!s) return true;
  return NO_EFECTIVOS.has(s);
}

function calcularIndicadores({ registros, diasDelMes, rendimiento, calidad, esquema, metaLlamadasBase }){
  const detalle = [];
  const resumen = { total: 0, bonosTotales: 0 };

  registros.forEach(r => {
    const dni = toStr(r.DNI);
    const modalidad = toStr(r.Modalidad).toUpperCase();
    const turno = toStr(r.Turno).toUpperCase();
    const pool = toStr(r.Pool).toUpperCase();

    let diasAsistidos = 0;
    let faltas = 0;
    for (const d of diasDelMes) {
      const v = r[d] ?? '';
      if (esEfectivo(v)) diasAsistidos += 1;
      if (esFalta(v)) faltas += 1;
    }

    const horasPorDia = modalidad.includes('FULL') ? 8 : modalidad.includes('PART') ? 4 : 8;
    const horasTrabajadas = diasAsistidos * horasPorDia;
    const horasMes = diasDelMes.length * horasPorDia;
    const adherencia = horasMes > 0 ? (horasTrabajadas / horasMes) * 100 : 0;

    const rend = rendimiento.get(dni) || {};
    const cal = calidad.get(dni) || {};

    const llamadasAtendidas = toNum(rend.llamadasAtendidas);
    const tmo = toNum(rend.TMO || rend.tmo || r.TMO);
    const reclamos = toNum(rend.reclamos);
    const reclamosRate = rend.reclamosRate != null ? Number(rend.reclamosRate) : null;
    const calidadPct = cal.calidad != null ? Number(cal.calidad) : 0;

    const factorModalidad = horasPorDia >= 8 ? 1 : 0.5;
    const metaPorDia = Number(metaLlamadasBase || 0) * factorModalidad;
    const metaLlamadas = metaPorDia * diasAsistidos;
    const productividad = metaLlamadas > 0 ? (llamadasAtendidas / metaLlamadas) * 100 : 0;

    let bonoReclamos = 0;
    if (turno === 'MADRUGADA') {
      if (reclamos >= 1000) bonoReclamos = 80;
      else if (reclamos >= 770 && reclamos <= 999) bonoReclamos = 40;
    } else {
      const rate = reclamosRate != null ? reclamosRate : 0;
      if (rate > 0.9995) bonoReclamos = 60;
    }

    let bonoCalidad = 0;
    if (calidadPct >= 90) {
      if (pool === 'CLIENTE INTERNO') bonoCalidad = 70;
      else if (turno === 'MADRUGADA') bonoCalidad = 75;
      else bonoCalidad = 65;
    }

    let bonoTmo = 0;
    if (tmo <= 290) {
      if (pool === 'CLIENTE INTERNO') bonoTmo = 55;
      else if (turno === 'MADRUGADA') bonoTmo = 50;
      else bonoTmo = 60;
    } else if (tmo >= 291 && tmo <= 320) {
      bonoTmo = 30;
    }

    let bonoProd = 0;
    if (horasPorDia >= 8) {
      if (llamadasAtendidas > 1710) bonoProd = 90;
      else if (llamadasAtendidas >= 1695 && llamadasAtendidas <= 1710) bonoProd = 45;
    } else {
      if (llamadasAtendidas > 855) bonoProd = 90;
      else if (llamadasAtendidas >= 846 && llamadasAtendidas <= 855) bonoProd = 45;
    }

    let bonoAdh = 0;
    if (adherencia >= 95) {
      if (turno === 'MADRUGADA') bonoAdh = 85;
      else if (pool === 'POOL QUECHUA') bonoAdh = 80;
    } else if (adherencia >= 91 && adherencia <= 94) {
      if (turno === 'MADRUGADA') bonoAdh = 42.5;
      else if (pool === 'POOL QUECHUA') bonoAdh = 40;
    }

    const bonosBrutos = bonoReclamos + bonoCalidad + bonoTmo + bonoProd + bonoAdh;

    let factorAus = 1;
    if (faltas === 0) factorAus = 1;
    else if (faltas <= 2) factorAus = 0.75;
    else if (faltas <= 4) factorAus = 0.5;
    else factorAus = 0;

    const bonosNetos = bonosBrutos * factorAus;

    const item = {
      DNI: dni,
      Asesor: toStr(r.Asesor),
      Supervisor: toStr(r.Supervisor),
      Pool: toStr(r.Pool),
      Modalidad: toStr(r.Modalidad),
      Turno: toStr(r.Turno),
      diasAsistidos,
      faltas,
      horasTrabajadas,
      horasMes,
      adherencia: Number(adherencia.toFixed(2)),
      llamadasAtendidas,
      metaLlamadas: Math.round(metaLlamadas),
      productividad: Number(productividad.toFixed(2)),
      calidad: calidadPct,
      TMO: tmo,
      bonoReclamos,
      bonoCalidad,
      bonoTmo,
      bonoProductividad: bonoProd,
      bonoAdherencia: bonoAdh,
      bonoTotalBruto: Number(bonosBrutos.toFixed(2)),
      ajusteAusentismo: factorAus,
      bonoTotalNeto: Number(bonosNetos.toFixed(2))
    };

    detalle.push(item);
    resumen.total += 1;
    resumen.bonosTotales += item.bonoTotalNeto;
  });

  resumen.bonosTotales = Number(resumen.bonosTotales.toFixed(2));
  return { detalle, resumen };
}

module.exports = { calcularIndicadores };
