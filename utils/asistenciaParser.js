const XLSX = require('xlsx');

// Parser para archivos CSV de asistencia con separador pipe (|)
function parseAsistencia(buffer) {
  // Leer el CSV con separador pipe
  const wb = XLSX.read(buffer, { 
    type: 'buffer',
    raw: true,
    FS: '|' // Field separator
  });
  
  const sheet = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  
  const registros = [];
  
  for (const r of rows) {
    // Limpiar y estructurar el registro
    const registro = {
      dni: String(r['DNI'] || '').trim(),
      fecha: parseFecha(r['Fecha']),
      regAsistencia: String(r['Reg Asistencia'] || '').trim(),
      huella1: String(r['Huella1'] || '').trim(),
      huella2: String(r['Huella2'] || '').trim(),
      jornada: String(r['Jornada'] || '').trim(),
      tardanza: String(r['Tardanza'] || '').trim(),
      entrada: String(r['Entrada'] || '').trim(),
      salida: String(r['Salida'] || '').trim(),
      asiste: String(r['Asiste'] || '').trim(),
      primeraConexion: String(r['Primera Conexión'] || r['Primera Conexion'] || '').trim(),
      permiso: String(r['Permiso'] || '').trim(),
      tipoPermiso: String(r['Tipo Permiso'] || '').trim(),
      tiempoPermiso: String(r['Tiempo Permiso'] || '').trim(),
      motivo: String(r['Motivo'] || '').trim(),
      fModificacion: parseFecha(r['F. Modificación'] || r['F. Modificacion']),
      estado: String(r['Estado'] || '').trim(),
      ipHuella1: String(r['IP Huella1'] || '').trim(),
      ipHuella2: String(r['IP Huella2'] || '').trim()
    };
    
    // Solo agregar registros con DNI válido
    if (registro.dni) {
      registros.push(registro);
    }
  }
  
  return registros;
}

// Helper para parsear fechas en formato "YYYY-MM-DD HH:MM:SS"
function parseFecha(fechaStr) {
  if (!fechaStr) return null;
  
  const str = String(fechaStr).trim();
  if (!str) return null;
  
  // Intentar parsear como fecha
  const fecha = new Date(str);
  if (!isNaN(fecha.getTime())) {
    return fecha;
  }
  
  return null;
}

module.exports = { parseAsistencia };
