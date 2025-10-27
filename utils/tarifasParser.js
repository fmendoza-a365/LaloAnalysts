const iconv = require('iconv-lite');

/**
 * Parsear archivo CSV de tarifas
 * @param {Buffer} buffer - Buffer del archivo CSV
 * @param {Date} vigenciaDesde - Fecha desde la cual es vigente
 * @param {Date} vigenciaHasta - Fecha hasta la cual es vigente (opcional)
 * @returns {Array} - Array de tarifas parseadas
 */
function parseTarifasCSV(buffer, vigenciaDesde, vigenciaHasta = null) {
  try {
    // Detectar encoding
    let content = buffer.toString('utf8');
    if (content.includes('�')) {
      content = iconv.decode(buffer, 'win1252');
    }
    
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    const tarifas = [];
    
    let mesaActual = null;
    let enBloque = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Detectar inicio de bloque de mesa
      if (line.includes('Mesa de Ayuda')) {
        mesaActual = 'Mesa de Ayuda';
        enBloque = false;
        continue;
      } else if (line.includes('Central Telefónica y Servicios')) {
        mesaActual = 'Central Telefónica y Servicios Generales';
        enBloque = false;
        continue;
      } else if (line.includes('Monitoreo Prevención y Tratamiento de Fraude Inbound')) {
        mesaActual = 'Fraude - Inbound';
        enBloque = false;
        continue;
      } else if (line.includes('Monitoreo Prevención y Tratamiento de Fraude Outbound')) {
        mesaActual = 'Fraude - Outbound';
        enBloque = false;
        continue;
      } else if (line.includes('Redes Sociales') && line.includes('Chatbot')) {
        mesaActual = 'Redes Sociales - Chatbot';
        enBloque = false;
        continue;
      } else if (line.includes('Redes Sociales') && line.includes('Agente')) {
        mesaActual = 'Redes Sociales - Agente';
        enBloque = false;
        continue;
      } else if (line.includes('Gestión de Reclamos')) {
        mesaActual = 'Reclamos';
        enBloque = false;
        continue;
      } else if (line.includes('Envio de Comunicaciones')) {
        mesaActual = 'Comunicaciones Masivas';
        enBloque = false;
        continue;
      }
      
      // Detectar header de tabla
      if (line.startsWith('Rango;Min;Max')) {
        enBloque = true;
        continue;
      }
      
      // Si no estamos en un bloque o no hay mesa, saltar
      if (!enBloque || !mesaActual) continue;
      
      // Parsear línea de rango
      const campos = line.split(';').map(c => c.trim());
      
      // Validar que sea una línea de datos válida
      if (campos.length < 6 || !campos[0] || campos[0] === '') continue;
      
      const rango = parseInt(campos[0], 10);
      if (isNaN(rango)) continue;
      
      // Buscar o crear tarifa para esta mesa
      let tarifa = tarifas.find(t => t.mesa === mesaActual);
      if (!tarifa) {
        tarifa = {
          mesa: mesaActual,
          vigenciaDesde,
          vigenciaHasta,
          rangos: [],
          activo: true
        };
        tarifas.push(tarifa);
      }
      
      // Parsear valores
      const min = parsearNumero(campos[1]);
      const max = campos[2] === '>>>>>' || campos[2] === '>>>>>>' ? null : parsearNumero(campos[2]);
      const rangoReferencial = parsearNumero(campos[3]);
      const costoConIGV = parsearMoneda(campos[4]);
      const costoSinIGV = parsearMoneda(campos[5]);
      
      // Agregar rango
      tarifa.rangos.push({
        rango,
        min,
        max,
        rangoReferencial,
        costoConIGV,
        costoSinIGV
      });
      
      // Si tiene ONR (columnas 6 y 7 para Reclamos)
      if (campos.length >= 8 && campos[6] && campos[6].startsWith('S/')) {
        tarifa.onrConIGV = parsearMoneda(campos[6]);
        tarifa.onrSinIGV = parsearMoneda(campos[7]);
      }
    }
    
    console.log('[TARIFAS PARSER] Tarifas parseadas:', tarifas.length);
    tarifas.forEach(t => {
      console.log(`  - ${t.mesa}: ${t.rangos.length} rangos`);
    });
    
    return tarifas;
  } catch (error) {
    console.error('[TARIFAS PARSER] Error:', error);
    throw new Error('Error al parsear archivo de tarifas: ' + error.message);
  }
}

/**
 * Parsear número con comas
 */
function parsearNumero(str) {
  if (!str || str === '') return 0;
  return parseInt(str.replace(/,/g, ''), 10) || 0;
}

/**
 * Parsear moneda en formato S/X.XX
 */
function parsearMoneda(str) {
  if (!str || str === '') return 0;
  
  // Remover 'S/' y espacios
  let valor = str.replace('S/', '').replace('S/ ', '').trim();
  
  // Reemplazar coma por punto si es separador decimal
  if (valor.includes(',') && !valor.includes('.')) {
    valor = valor.replace(',', '.');
  } else if (valor.includes(',') && valor.includes('.')) {
    // Si tiene ambos, la coma es separador de miles
    valor = valor.replace(',', '');
  }
  
  return parseFloat(valor) || 0;
}

module.exports = {
  parseTarifasCSV,
  parsearNumero,
  parsearMoneda
};
