const XLSX = require('xlsx');

function normalizeHeader(h){
  if (h == null) return '';
  return String(h).trim();
}

async function parseAsistenciasBuffer(file){
  const buf = file.buffer;
  const name = file.originalname.toLowerCase();
  let workbook;
  if (name.endsWith('.csv')) {
    const content = buf.toString('utf8');
    workbook = XLSX.read(content, { type: 'string' });
  } else {
    workbook = XLSX.read(buf, { type: 'buffer' });
  }
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  if (!json.length) return { registros: [], diasDelMes: [] };

  const headersRange = XLSX.utils.decode_range(sheet['!ref']);
  const firstRow = [];
  for (let C = headersRange.s.c; C <= headersRange.e.c; ++C) {
    const cell = sheet[XLSX.utils.encode_cell({ r: headersRange.s.r, c: C })];
    firstRow.push(normalizeHeader(cell ? cell.v : ''));
  }

  const diasDelMes = [];
  for (let i = 1; i <= 31; i++) {
    if (firstRow.includes(String(i))) diasDelMes.push(String(i));
  }

  const registros = json.map(row => {
    const out = {};
    Object.keys(row).forEach(k => { out[normalizeHeader(k)] = row[k]; });
    return out;
  });

  return { registros, diasDelMes };
}

module.exports = { parseAsistenciasBuffer };
