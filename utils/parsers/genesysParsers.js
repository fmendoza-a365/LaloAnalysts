const XLSX = require('xlsx');

// Normalizar caracteres mal codificados (tildes)
function fixEncoding(str) {
  if (!str) return str;
  let s = String(str);
  // Corregir tildes mal codificadas
  s = s.replace(/aÃ³/g, 'aó').replace(/AÃ³/g, 'Aó');
  s = s.replace(/eÃ³/g, 'eó').replace(/EÃ³/g, 'Eó');
  s = s.replace(/iÃ³/g, 'ió').replace(/IÃ³/g, 'Ió');
  s = s.replace(/oÃ³/g, 'oó').replace(/OÃ³/g, 'Oó');
  s = s.replace(/uÃ³/g, 'uó').replace(/UÃ³/g, 'Uó');
  s = s.replace(/Ã³/g, 'ó');
  // Otras tildes comunes mal codificadas
  s = s.replace(/Ã¡/g, 'á').replace(/Ã©/g, 'é').replace(/Ã­/g, 'í').replace(/Ãº/g, 'ú');
  s = s.replace(/Ã/g, 'Á').replace(/Ã‰/g, 'É').replace(/Ã/g, 'Í').replace(/Ã"/g, 'Ó').replace(/Ãš/g, 'Ú');
  s = s.replace(/Ã±/g, 'ñ').replace(/Ã'/g, 'Ñ');
  return s;
}

function normalizeAgAndName(name) {
  if (!name) return { ag: '', nombreGenesys: '' };
  let s = String(name);
  s = s.replace(/A365_/g, 'AG');
  s = s.replace(/A365\s/g, 'AG');
  s = s.replace(/_/g, ' ');
  s = s.toUpperCase().trim();
  const parts = s.split(/\s+/);
  const ag = parts[0] || '';
  const nombreGenesys = parts.slice(1).join(' ');
  return { ag, nombreGenesys };
}

function sheetToJson(buf) {
  const wb = XLSX.read(buf, { type: 'buffer' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  // Normalizar nombres de columnas con tildes mal codificadas
  return rawRows.map(row => {
    const cleanedRow = {};
    for (const key in row) {
      const cleanKey = fixEncoding(key);
      cleanedRow[cleanKey] = row[key];
    }
    return cleanedRow;
  });
}

function dropColumns(row, colsToDrop) {
  const out = { ...row };
  colsToDrop.forEach(c => { if (c in out) delete out[c]; });
  return out;
}

function parseRendimiento(buffer) {
  const rows = sheetToJson(buffer);
  const cleaned = [];
  for (const r of rows) {
    const rr = dropColumns(r, [
      'Source.Name','Inicio del intervalo','Fin del intervalo','Intervalo completo','Filtros','Tipo de medios','ID del agente','ID de división','Nombre de división'
    ]);
    const nn = normalizeAgAndName(rr['Nombre del agente'] || rr['Nombre del agente.1'] || rr['Nombre del agente 1']);
    delete rr['Nombre del agente'];
    delete rr['Nombre del agente.1'];
    delete rr['Nombre del agente 1'];
    cleaned.push({ ag: nn.ag, nombreGenesys: nn.nombreGenesys, data: rr });
  }
  return cleaned;
}

function parseEstados(buffer) {
  const rows = sheetToJson(buffer);
  const cleaned = [];
  for (const r of rows) {
    const rr = dropColumns(r, [
      'Source.Name','Inicio del intervalo','Fin del intervalo','Intervalo completo','Filtros','ID del agente','ID de división','Nombre de división'
    ]);
    const nn = normalizeAgAndName(rr['Nombre del agente'] || rr['Nombre del agente.1'] || rr['Nombre del agente 1']);
    delete rr['Nombre del agente'];
    delete rr['Nombre del agente.1'];
    delete rr['Nombre del agente 1'];
    cleaned.push({ ag: nn.ag, nombreGenesys: nn.nombreGenesys, data: rr });
  }
  return cleaned;
}

// Parser genérico para otros tipos de archivos
function parseGenerico(buffer) {
  const rows = sheetToJson(buffer);
  const cleaned = [];
  for (const r of rows) {
    const rr = dropColumns(r, [
      'Source.Name','Inicio del intervalo','Fin del intervalo','Intervalo completo','Filtros','ID de división','Nombre de división'
    ]);
    // Intentar extraer ag y nombre del agente (puede variar según el tipo de reporte)
    const nombreCol = rr['Nombre del agente'] || rr['Nombre del agente.1'] || rr['Nombre del agente 1'] || rr['Agente'] || rr['Usuario'] || '';
    const nn = normalizeAgAndName(nombreCol);
    delete rr['Nombre del agente'];
    delete rr['Nombre del agente.1'];
    delete rr['Nombre del agente 1'];
    delete rr['Agente'];
    delete rr['Usuario'];
    delete rr['ID del agente'];
    cleaned.push({ ag: nn.ag, nombreGenesys: nn.nombreGenesys, data: rr });
  }
  return cleaned;
}

function parseProvision(buffer) {
  return parseGenerico(buffer);
}

function parseCalidad(buffer) {
  return parseGenerico(buffer);
}

module.exports = { 
  parseRendimiento, 
  parseEstados, 
  parseProvision,
  parseCalidad
};
