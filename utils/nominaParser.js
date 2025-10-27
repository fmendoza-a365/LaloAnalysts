const iconv = require('iconv-lite');
const { parse } = require('csv-parse/sync');

/**
 * Parsear archivo CSV de nómina
 * @param {Buffer} buffer - Buffer del archivo CSV
 * @returns {Array} - Array de registros de nómina parseados
 */
function parseNomina(buffer) {
  try {
    // Detectar encoding (el archivo puede tener caracteres especiales)
    let content = buffer.toString('utf8');
    if (content.includes('�')) {
      content = iconv.decode(buffer, 'win1252');
    }
    
    // Usar csv-parse para manejar correctamente comillas y delimitadores
    const records = parse(content, {
      delimiter: ';',
      relax_column_count: true,
      skip_empty_lines: true,
      from_line: 8 // Saltar las 7 líneas de headers
    });
    
    console.log('[NOMINA PARSER] Total de líneas de datos:', records.length);
    
    const registros = [];
    
    for (let i = 0; i < records.length; i++) {
      const campos = records[i].map(c => (c || '').trim());
      
      // Validar que tenga datos mínimos
      if (campos.length < 50) continue;
      
      try {
        const registro = {
          // Identificación (columnas 0-14)
          nro: parsearNumero(campos[0]),
          codigoScire: campos[1] || '',
          gerente: campos[2] || '',
          responsableUnidad: campos[3] || '',
          supervisor: campos[4] || '',
          dni: limpiarDNI(campos[5]),
          apellidoPaterno: campos[10] || '',
          apellidoMaterno: campos[11] || '',
          nombres: campos[12] || '',
          nombreCompleto: campos[13] || '',
          
          // Información laboral (columnas 15-24)
          estado: campos[15] || '',
          tipoPlanilla: campos[16] || '',
          cargo: campos[17] || '', // CARGO CORRECTO
          campana: campos[19] || '', // CAMPAÑA CORRECTA
          departamento: campos[20] || '',
          grupo: campos[21] || '',
          fechaIngreso: parsearFecha(campos[23]),
          fechaCese: parsearFecha(campos[24]),
          
          // Días trabajados (columnas 25-30)
          sueldoBasico: parsearMoneda(campos[25]),
          diasLaborados: parsearNumero(campos[26]),
          diasDescansoMedico: parsearNumero(campos[28]),
          totalDias: parsearNumero(campos[29]),
          sueldoPorDias: parsearMoneda(campos[30]),
          
          // Vacaciones y subsidios (columnas 31-37)
          diasVacaciones: parsearNumero(campos[31]),
          vacaciones: parsearMoneda(campos[32]),
          diasSubsidiados: parsearNumero(campos[34]),
          subsidio: parsearMoneda(campos[35]),
          diasFeriados: parsearNumero(campos[36]),
          feriados: parsearMoneda(campos[37]),
          
          // Bonos e incentivos (columnas 38-46)
          asignacionFamiliar: parsearMoneda(campos[38]),
          horasExtras: parsearMoneda(campos[39]),
          bonoMayo: parsearMoneda(campos[40]),
          bonoIncentivos: parsearMoneda(campos[41]),
          bonoNocturno: parsearMoneda(campos[42]),
          bonoCumplimientos: parsearMoneda(campos[43]),
          comisiones: parsearMoneda(campos[44]),
          reintegro: parsearMoneda(campos[46]),
          
          // Totales de ingresos (columna 47)
          subTotalIngresos: parsearMoneda(campos[47]),
          
          // Descuentos (columnas 48-54)
          licenciaSinGoce: parsearMoneda(campos[49]),
          inasistenciaMonto: parsearMoneda(campos[50]),
          tardanzaMonto: parsearMoneda(campos[52]),
          totalDescuentos: parsearMoneda(campos[54]),
          
          // Total Sueldo (columna 55)
          totalSueldo: parsearMoneda(campos[55]),
          
          // AFP/ONP (columnas 56-62)
          tipoAFP: campos[56] || '',
          aporteAFP: parsearMoneda(campos[58]),
          seguroAFP: parsearMoneda(campos[59]),
          comisionAFP: parsearMoneda(campos[60]),
          totalAFP: parsearMoneda(campos[62]),
          
          // Renta 5ta (columna 63)
          renta5ta: parsearMoneda(campos[63]),
          
          // Otros descuentos (columnas 64-79)
          cooperativa: parsearMoneda(campos[65]),
          smartCash: parsearMoneda(campos[76]),
          retencionJudicial: parsearMoneda(campos[77]),
          oncosalud: parsearMoneda(campos[77]),
          descuentoEPS: parsearMoneda(campos[78]),
          otrosDescuentos: parsearMoneda(campos[79]),
          
          // Otros ingresos (columnas 81-85)
          movilidad: parsearMoneda(campos[81]),
          subsidioInternet: parsearMoneda(campos[82]),
          capacitacion: parsearMoneda(campos[83]),
          otrosIngresos: parsearMoneda(campos[85]),
          
          // Neto a pagar (columnas 88-91)
          netoAPagar: parsearMoneda(campos[88]),
          pago1aQuincena: parsearMoneda(campos[89]),
          pago2aQuincena: parsearMoneda(campos[90]),
          
          // Información bancaria (columnas 92-93)
          formaPago: campos[92] || '',
          numeroCuenta: campos[93] || '',
          
          // Costo empleador (columnas 95-96, 110-113)
          eps: parsearMoneda(campos[95]),
          essalud: parsearMoneda(campos[96]),
          sueldoBruto: parsearMoneda(campos[111]), // COLUMNA CORRECTA (no cambió)
          costoEmpleador: parsearMoneda(campos[112]), // COLUMNA CORRECTA (no cambió)
          otrosIngresos2: parsearMoneda(campos[113]), // (no cambió)
          costoTotalEmpleador: parsearMoneda(campos[114]), // COLUMNA CORRECTA (no cambió)
          
          // DEBUG: Log primeros 5 registros
          _debug: i < 5 ? {
            fila: i + 8,
            campo114: campos[114],
            costoParseado: parsearMoneda(campos[114])
          } : undefined,
          
          // Variables (columnas 135-137) - sin cambio
          variables: parsearMoneda(campos[135]),
          costoVariables: parsearMoneda(campos[136]),
          costoTotalVariables: parsearMoneda(campos[137]),
          
          // Agentes efectivos (columnas 140-141)
          diasEfectivos: parsearNumero(campos[140]),
          agentesEfectivos: parsearNumero(campos[141]),
          
          // Contacto (columnas 97, 99, 101)
          celular: campos[97] || '',
          email: campos[99] || '',
          direccion: campos[101] || '',
          
          // Información adicional (columnas 124-125)
          turno: campos[124] || '',
          horario: campos[125] || ''
        };
        
        // Log de debug para primeros 5 registros
        if (i < 5 && registro._debug) {
          console.log(`[NOMINA PARSER] Registro ${registro._debug.fila}:`, registro.nombreCompleto);
          console.log(`  Campaña:`, registro.campana);
          console.log(`  Campo [114] raw:`, registro._debug.campo114);
          console.log(`  Costo parseado:`, registro._debug.costoParseado);
        }
        
        registros.push(registro);
      } catch (error) {
        console.error(`[NOMINA PARSER] Error en línea ${i + 7}:`, error.message);
        // Continuar con la siguiente línea
      }
    }
    
    console.log('[NOMINA PARSER] Registros parseados exitosamente:', registros.length);
    return registros;
    
  } catch (error) {
    console.error('[NOMINA PARSER] Error general:', error);
    throw new Error('Error al parsear archivo de nómina: ' + error.message);
  }
}

/**
 * Parsear número con formato
 */
function parsearNumero(str) {
  if (!str || str === '' || str === '-') return 0;
  const limpio = String(str).replace(/,/g, '').trim();
  const numero = parseFloat(limpio);
  return isNaN(numero) ? 0 : numero;
}

/**
 * Parsear moneda (puede incluir S/ y formato con comas)
 */
function parsearMoneda(str) {
  if (!str || str === '' || str === '-') return 0;
  
  let valor = String(str)
    .replace('S/', '')
    .replace('S/ ', '')
    .replace(/\s/g, '')
    .trim();
  
  // Remover comas de miles
  valor = valor.replace(/,/g, '');
  
  const numero = parseFloat(valor);
  return isNaN(numero) ? 0 : numero;
}

/**
 * Limpiar DNI (remover ceros a la izquierda si los hay)
 */
function limpiarDNI(str) {
  if (!str) return '';
  return String(str).trim().replace(/^0+/, '');
}

/**
 * Parsear fecha en formato DD/MM/YYYY o serial de Excel
 */
function parsearFecha(str) {
  if (!str || str === '' || str === '-') return null;
  
  try {
    // Si es formato DD/MM/YYYY
    if (String(str).includes('/')) {
      const partes = String(str).split('/');
      if (partes.length === 3) {
        const dia = parseInt(partes[0], 10);
        const mes = parseInt(partes[1], 10) - 1; // Mes es 0-indexed
        const anio = parseInt(partes[2], 10);
        return new Date(anio, mes, dia);
      }
    }
    
    // Si es número serial de Excel
    const numero = parseFloat(str);
    if (!isNaN(numero) && numero > 0) {
      const excelEpoch = new Date(1899, 11, 30);
      return new Date(excelEpoch.getTime() + numero * 86400000);
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

module.exports = {
  parseNomina,
  parsearNumero,
  parsearMoneda,
  parsearFecha,
  limpiarDNI
};
