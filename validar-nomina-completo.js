const fs = require('fs');
const { parse } = require('csv-parse/sync');

const archivo = './public/ejemplos/Nomina.csv';
const contenido = fs.readFileSync(archivo, 'utf8');

console.log('=== ANÁLISIS COMPLETO DE NOMINA.CSV ===\n');

// Parsear con csv-parse
const records = parse(contenido, {
  delimiter: ';',
  relax_column_count: true,
  skip_empty_lines: true,
  from_line: 8 // Saltar headers
});

console.log('Total de registros:', records.length);

// Analizar primer registro para ver estructura
console.log('\n=== PRIMER REGISTRO (MAPEO DE COLUMNAS) ===');
const primer = records[0];
console.log('Total campos:', primer.length);
console.log('[0] Nro:', primer[0]);
console.log('[1] Codigo SCIRE:', primer[1]);
console.log('[13] Full Nombre:', primer[13]);
console.log('[14] Fecha Nacimiento:', primer[14]);
console.log('[19] Grupo:', primer[19]);
console.log('[20] CAMPAÑA:', primer[20]);
console.log('[26] Sueldo Basico:', primer[26]);
console.log('[89] Neto a Pagar:', primer[89]);
console.log('[112] Sueldo Bruto:', primer[112]);
console.log('[113] Costo Empleador:', primer[113]);
console.log('[115] COSTO TOTAL EMPLEADOR:', primer[115]);

console.log('\n=== COLUMNAS 105-125 (buscando costos) ===');
for (let i = 105; i <= 125; i++) {
  console.log(`[${i}] = "${primer[i]}"`);
}

// Función para parsear moneda
function parsearMoneda(str) {
  if (!str || str === '' || str === '-') return 0;
  const valor = String(str).replace('S/', '').replace(/\s/g, '').replace(/,/g, '').trim();
  const numero = parseFloat(valor);
  return isNaN(numero) ? 0 : numero;
}

// Calcular suma total de COSTO TOTAL EMPLEADOR
let sumaTotalCostos = 0;
let sumaNetoAPagar = 0;
let sumaSueldoBruto = 0;
let empleadosConCosto = 0;
let empleadosSinCosto = 0;

const muestrasConCosto = [];
const muestrasSinCosto = [];

records.forEach((campos, idx) => {
  const costoTotal = parsearMoneda(campos[114]); // COLUMNA CORRECTA!
  const neto = parsearMoneda(campos[89]);
  const bruto = parsearMoneda(campos[111]); // Sueldo bruto está en [111]
  const nombre = campos[13];
  const campana = campos[19]; // CAMPAÑA REAL está en [19]
  
  sumaTotalCostos += costoTotal;
  sumaNetoAPagar += neto;
  sumaSueldoBruto += bruto;
  
  if (costoTotal > 0) {
    empleadosConCosto++;
    if (muestrasConCosto.length < 5) {
      muestrasConCosto.push({ idx: idx + 8, nombre, campana, costoTotal });
    }
  } else {
    empleadosSinCosto++;
    if (muestrasSinCosto.length < 5) {
      muestrasSinCosto.push({ idx: idx + 8, nombre, campana, campo114: campos[114] });
    }
  }
});

console.log('\n=== TOTALES CALCULADOS ===');
console.log('Total Empleados:', records.length);
console.log('Total Costo Empleador: S/', sumaTotalCostos.toLocaleString('es-PE', {minimumFractionDigits: 2}));
console.log('Total Neto a Pagar: S/', sumaNetoAPagar.toLocaleString('es-PE', {minimumFractionDigits: 2}));
console.log('Total Sueldo Bruto: S/', sumaSueldoBruto.toLocaleString('es-PE', {minimumFractionDigits: 2}));

console.log('\n=== DISTRIBUCIÓN ===');
console.log('Empleados CON costo:', empleadosConCosto);
console.log('Empleados SIN costo:', empleadosSinCosto);

console.log('\n=== MUESTRA - EMPLEADOS CON COSTO ===');
muestrasConCosto.forEach(m => {
  console.log(`Línea ${m.idx}: ${m.nombre}`);
  console.log(`  Campaña: ${m.campana}`);
  console.log(`  Costo: S/ ${m.costoTotal.toLocaleString('es-PE', {minimumFractionDigits: 2})}`);
});

console.log('\n=== MUESTRA - EMPLEADOS SIN COSTO ===');
muestrasSinCosto.forEach(m => {
  console.log(`Línea ${m.idx}: ${m.nombre}`);
  console.log(`  Campaña: ${m.campana}`);
  console.log(`  Campo[114]: "${m.campo114}"`);
});

// Agrupar por campaña
const porCampana = {};
records.forEach(campos => {
  const campana = campos[19] || 'Sin Campaña'; // COLUMNA CORRECTA!
  const costo = parsearMoneda(campos[114]); // COLUMNA CORRECTA!
  
  if (!porCampana[campana]) {
    porCampana[campana] = { empleados: 0, costoTotal: 0 };
  }
  
  porCampana[campana].empleados++;
  porCampana[campana].costoTotal += costo;
});

console.log('\n=== RESUMEN POR CAMPAÑA ===');
Object.keys(porCampana).sort((a, b) => porCampana[b].costoTotal - porCampana[a].costoTotal).forEach(campana => {
  const data = porCampana[campana];
  console.log(`\n${campana}`);
  console.log(`  Empleados: ${data.empleados}`);
  console.log(`  Costo Total: S/ ${data.costoTotal.toLocaleString('es-PE', {minimumFractionDigits: 2})}`);
});
