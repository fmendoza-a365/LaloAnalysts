const ExcelJS = require('exceljs');

function buildCsv(rows) {
  if (!Array.isArray(rows) || rows.length === 0) return Buffer.from('','utf8').toString('base64');
  const headers = Object.keys(rows[0]);
  const csvLines = [];
  csvLines.push(headers.join(','));
  for (const r of rows) {
    const line = headers.map(h => {
      const v = r[h] == null ? '' : String(r[h]);
      if (v.includes(',') || v.includes('"') || v.includes('\n')) {
        return '"' + v.replace(/"/g, '""') + '"';
      }
      return v;
    }).join(',');
    csvLines.push(line);
  }
  const csv = csvLines.join('\n');
  return Buffer.from(csv, 'utf8').toString('base64');
}

async function buildWorkbookBase64(rows) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Indicadores');
  if (!Array.isArray(rows) || rows.length === 0) {
    const empty = await workbook.xlsx.writeBuffer();
    return Buffer.from(empty).toString('base64');
  }
  const headers = Object.keys(rows[0]);
  sheet.addRow(headers);
  rows.forEach(r => sheet.addRow(headers.map(h => r[h])));
  headers.forEach((h, idx) => {
    const col = sheet.getColumn(idx + 1);
    col.width = Math.min(40, Math.max(10, String(h).length + 2));
  });
  const buf = await workbook.xlsx.writeBuffer();
  return Buffer.from(buf).toString('base64');
}

module.exports = { buildCsv, buildWorkbookBase64 };
