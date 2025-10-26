const iconv = require('iconv-lite');

/**
 * Convertir segundos a formato HH:MM:SS
 * @param {number|string} segundos - Segundos totales
 * @returns {string} - Tiempo en formato HH:MM:SS
 */
function segundosAHHMMSS(segundos) {
  if (!segundos || isNaN(segundos)) return '00:00:00';
  
  const segs = parseInt(segundos, 10);
  const horas = Math.floor(segs / 3600);
  const minutos = Math.floor((segs % 3600) / 60);
  const segundosRestantes = segs % 60;
  
  return `${String(horas).padStart(2, '0')}:${String(minutos).padStart(2, '0')}:${String(segundosRestantes).padStart(2, '0')}`;
}

/**
 * Clasificar cola en su mesa correspondiente
 * @param {string} nombreCola - Nombre de la cola
 * @returns {string|null} - Nombre de la mesa o null si debe descartarse
 */
function clasificarMesa(nombreCola) {
  if (!nombreCola) return 'Sin Clasificar';
  
  const cola = nombreCola.trim();
  
  // DESCARTAR: Cola MA_Total y variaciones deben ser ignoradas completamente
  if (cola === 'MA_Total' || 
      cola === 'A_MA Total' || 
      cola.toLowerCase().includes('ma_total') ||
      cola.toLowerCase().includes('ma total')) {
    console.log('[PARSER] Cola Total descartada:', cola);
    return null;
  }
  
  // Quechua: Colas que terminan en Q
  if (cola.endsWith('Q')) {
    return 'Quechua';
  }
  
  // Mesa de Ayuda: CI_, Cl_, MA_ (pero NO las que terminan en Q)
  if (cola.startsWith('CI_') || cola.startsWith('Cl_') || cola.startsWith('MA_')) {
    return 'Mesa de Ayuda';
  }
  
  // Monitoreo y Prevención del Fraude
  if (cola.includes('Fraude') || cola.includes('fraude')) {
    // Outbound: contiene "Saliente" o "Salida"
    if (cola.includes('Saliente') || cola.includes('Salida') || 
        cola.includes('saliente') || cola.includes('salida')) {
      return 'Fraude - Outbound';
    } else {
      return 'Fraude - Inbound';
    }
  }
  
  // Central Telefónica y Servicios Generales
  if (cola.toLowerCase().includes('central') || 
      cola.toLowerCase().includes('telefonica') || 
      cola.toLowerCase().includes('srv_administrativo') ||
      cola.toLowerCase().includes('administrativo')) {
    return 'Central Telefónica y Servicios Generales';
  }
  
  // Redes Sociales: Facebook, Instagram, Youtube
  const redesSociales = ['facebook', 'instagram', 'youtube', 'rs_'];
  if (redesSociales.some(red => cola.toLowerCase().includes(red))) {
    return 'Redes Sociales';
  }
  
  // DESCARTAR: Colas sin clasificación específica
  console.log('[PARSER] Cola sin mesa específica (descartada):', cola);
  return null;
}

/**
 * Parsear archivo de Provisión agregada (Provi.csv)
 * @param {Buffer} buffer - Buffer del archivo CSV
 * @returns {Array} - Array de registros parseados con clasificación por mesa
 */
function parseProvisionAgregada(buffer) {
  try {
    // Detectar encoding (puede ser UTF-8 o Windows-1252)
    let content = buffer.toString('utf8');
    if (content.includes('�')) {
      content = iconv.decode(buffer, 'win1252');
    }
    
    const lines = content.split(/\r?\n/).filter(l => l.trim());
    if (lines.length < 2) return [];
    
    // Parsear header
    const headerLine = lines[0];
    const headers = headerLine.split(';').map(h => h.replace(/^"|"$/g, '').trim());
    
    const registros = [];
    
    // Parsear cada día
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      // Parsear campos separados por ; considerando comillas
      const campos = [];
      let currentField = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ';' && !inQuotes) {
          campos.push(currentField.trim());
          currentField = '';
        } else {
          currentField += char;
        }
      }
      campos.push(currentField.trim()); // Último campo
      
      // Crear objeto del registro
      const registro = {};
      headers.forEach((header, idx) => {
        registro[header] = campos[idx] || '';
      });
      
      // Parsear fecha
      const fechaInicio = registro['Inicio del intervalo'];
      let fecha = null;
      if (fechaInicio) {
        // Formato: "1/10/25 00:00"
        const partes = fechaInicio.split(' ')[0].split('/');
        if (partes.length === 3) {
          const dia = parseInt(partes[0], 10);
          const mes = parseInt(partes[1], 10);
          const anio = parseInt('20' + partes[2], 10);
          fecha = new Date(anio, mes - 1, dia);
        }
      }
      
      // Parsear métricas numéricas
      const ofrecidas = parseFloat(registro['Oferta']) || 0;
      const contestadas = parseFloat(registro['Contestadas']) || 0;
      const abandonadas = parseFloat(registro['Abandonadas']) || 0;
      const porcentajeContestadas = parseFloat(registro['% de contestadas']) || 0;
      const porcentajeAbandono = parseFloat(registro['% de abandono']) || 0;
      const nivelServicio = parseFloat(registro['% nivel de servicio']) || 0;
      const cumpleSLA = parseFloat(registro['Cumplen el SLA']) || 0;
      
      // Parsear nombres de colas (están separadas por ;)
      const nombresColas = registro['Nombre de cola'] ? 
        registro['Nombre de cola'].split(';').map(c => c.trim()).filter(Boolean) : [];
      
      // DESCARTAR registros anómalos: si el campo "Nombre de cola" contiene demasiadas colas
      // (indica una concatenación errónea de todas las colas en una sola línea)
      if (nombresColas.length > 20) {
        console.warn('[PARSER] Registro anómalo descartado - demasiadas colas concatenadas:', nombresColas.length, 'colas');
        continue; // Saltar este registro completamente
      }
      
      // También descartar si alguna "cola" individual contiene punto y coma interno
      // (indica que es una concatenación dentro de una celda)
      const tieneColaConcatenada = nombresColas.some(c => c.includes(';') || c.split(' ').length > 5);
      if (tieneColaConcatenada) {
        console.warn('[PARSER] Registro anómalo descartado - cola concatenada detectada');
        continue;
      }
      
      // Filtrar colas descartadas (como MA_Total) y clasificar por mesa
      const colasValidas = [];
      const mesasData = {};
      
      // Si tenemos colas, calcular métricas proporcionales por mesa
      if (nombresColas.length > 0) {
        // Agrupar colas por mesa, filtrando las que retornan null
        const colasPorMesa = {};
        nombresColas.forEach(cola => {
          const mesa = clasificarMesa(cola);
          
          // Ignorar colas que retornan null (como MA_Total)
          if (mesa === null) {
            console.log('[PARSER] Cola descartada:', cola);
            return;
          }
          
          colasValidas.push(cola);
          
          if (!colasPorMesa[mesa]) {
            colasPorMesa[mesa] = [];
          }
          colasPorMesa[mesa].push(cola);
        });
        
        // Distribuir métricas proporcionalmente (solo sobre colas válidas)
        Object.keys(colasPorMesa).forEach(mesa => {
          const cantidadColas = colasPorMesa[mesa].length;
          const proporcion = colasValidas.length > 0 ? (cantidadColas / colasValidas.length) : 0;
          
          mesasData[mesa] = {
            colas: colasPorMesa[mesa],
            cantidadColas,
            ofrecidas: Math.round(ofrecidas * proporcion),
            contestadas: Math.round(contestadas * proporcion),
            abandonadas: Math.round(abandonadas * proporcion),
            porcentajeContestadas: porcentajeContestadas, // Se mantiene igual
            porcentajeAbandono: porcentajeAbandono, // Se mantiene igual
            nivelServicio: nivelServicio, // Se mantiene igual
            cumpleSLA: Math.round(cumpleSLA * proporcion)
          };
        });
      }
      
      // Convertir tiempos de segundos a HH:MM:SS
      const manejoMedioSegs = registro['Manejo medio'];
      const conversacionMediaSegs = registro['Conversación media'];
      const retencionMediaSegs = registro['Retención media'];
      const acwMedioSegs = registro['Tiempo medio de trabajo después de llamada (ACW)'];
      const esperaMediaSegs = registro['Espera media'];
      const asaSegs = registro['Velocidad media de respuesta (ASA)'];
      
      registros.push({
        fecha,
        fechaTexto: fechaInicio,
        ofrecidas,
        contestadas,
        abandonadas,
        porcentajeContestadas,
        porcentajeAbandono,
        nivelServicio,
        cumpleSLA,
        nombresColas: colasValidas, // Solo colas válidas (sin MA_Total)
        totalColas: colasValidas.length,
        mesasData, // Datos agrupados por mesa
        // Tiempos convertidos a HH:MM:SS
        manejoMedio: segundosAHHMMSS(manejoMedioSegs),
        conversacionMedia: segundosAHHMMSS(conversacionMediaSegs),
        retencionMedia: segundosAHHMMSS(retencionMediaSegs),
        acwMedio: segundosAHHMMSS(acwMedioSegs),
        esperaMedia: segundosAHHMMSS(esperaMediaSegs),
        asa: segundosAHHMMSS(asaSegs)
      });
    }
    
    return registros;
  } catch (error) {
    console.error('Error parseando provisión agregada:', error);
    throw new Error('Error al parsear archivo de provisión agregada: ' + error.message);
  }
}

module.exports = {
  parseProvisionAgregada,
  clasificarMesa,
  segundosAHHMMSS
};
