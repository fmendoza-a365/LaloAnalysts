const fs = require('fs');
const { parse } = require('csv-parse/sync');

const contenido = fs.readFileSync('./public/ejemplos/Nomina.csv', 'utf8');
const lineas = contenido.split(/\r?\n/);

console.log('Total de líneas:', lineas.length);
console.log('\n=== HEADERS (Líneas 1-7) ===');
for (let i = 0; i < 7; i++) {
  console.log(`Línea ${i+1}: ${lineas[i].substring(0, 150)}...`);
}

console.log('\n=== PRIMERA LÍNEA DE DATOS (Línea 8) ===');

// Usar csv-parse para manejar comillas correctamente
const records = parse(contenido, {
  delimiter: ';',
  relax_column_count: true,
  skip_empty_lines: true,
  from_line: 8
});

const campos = records[0];

console.log('Total de campos:', campos.length);
console.log('\n=== MAPEO DE COLUMNAS COMPLETO ===');
for (let i = 0; i < campos.length; i++) {
  const valor = campos[i].trim();
  console.log(`[${i}] = "${valor.substring(0, 50)}${valor.length > 50 ? '...' : ''}"`);
}

// Columnas clave
console.log('\n=== COLUMNAS ALREDEDOR DE CARGO (15-25) ===');
console.log('[15] Fecha Nacimiento:', campos[15]);
console.log('[16] Estado:', campos[16]);
console.log('[17] Tipo Planilla:', campos[17]);
console.log('[18] Cargo?:', campos[18]);
console.log('[19] Cliente/Banco:', campos[19]);
console.log('[20] Campaña:', campos[20]);
console.log('[21] Departamento/Tipo:', campos[21]);
console.log('[22] Grupo:', campos[22]);
console.log('[23] Campo23:', campos[23]);
console.log('[24] Fecha Ingreso:', campos[24]);

console.log('\n=== COLUMNAS CLAVE ===');
console.log('[26] Sueldo basico:', campos[26]);
console.log('[48] Sub Total Ingresos:', campos[48]);
console.log('[56] Total Sueldo:', campos[56]);
console.log('[89] Neto a Pagar:', campos[89]);
console.log('[112] SUELDO BRUTO:', campos[112]);
console.log('[113] COSTO EMPLEADOR:', campos[113]);
console.log('[115] COSTO TOTAL EMPLEADOR:', campos[115]);
