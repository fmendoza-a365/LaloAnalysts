const mongoose = require('mongoose');
const NominaDataset = require('./models/NominaDataset');
const NominaRecord = require('./models/NominaRecord');

async function verificar() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/a365-analytics';
    console.log('Conectando a:', uri);
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Conectado a MongoDB\n');
    
    // Buscar el dataset más reciente
    const dataset = await NominaDataset.findOne().sort({ creadoEn: -1 });
    
    if (!dataset) {
      console.log('❌ No hay datasets de nómina');
      process.exit(0);
    }
    
    console.log('📊 DATASET ENCONTRADO:');
    console.log('ID:', dataset._id);
    console.log('Periodo:', dataset.anio, '-', dataset.mes);
    console.log('Total Empleados:', dataset.totalEmpleados);
    console.log('Total Costo Empleador:', dataset.totalCostoEmpleador);
    console.log('Total Sueldo Bruto:', dataset.totalSueldoBruto);
    console.log('Total Neto a Pagar:', dataset.totalNetoAPagar);
    console.log('');
    
    // Buscar registros
    const registros = await NominaRecord.find({ datasetId: dataset._id }).limit(5);
    console.log('📋 PRIMEROS 5 REGISTROS:');
    registros.forEach((r, i) => {
      console.log(`\n[${i+1}] ${r.nombreCompleto}`);
      console.log('  DNI:', r.dni);
      console.log('  Campaña:', r.campana);
      console.log('  Sueldo Básico:', r.sueldoBasico);
      console.log('  Sueldo Bruto:', r.sueldoBruto);
      console.log('  Costo Total Empleador:', r.costoTotalEmpleador);
      console.log('  Neto a Pagar:', r.netoAPagar);
    });
    
    // Agrupar por campaña
    console.log('\n📊 RESUMEN POR CAMPAÑA:');
    const campanasAgrupadas = await NominaRecord.aggregate([
      { $match: { datasetId: dataset._id } },
      { 
        $group: {
          _id: '$campana',
          empleados: { $sum: 1 },
          costoTotal: { $sum: '$costoTotalEmpleador' },
          sueldoBrutoTotal: { $sum: '$sueldoBruto' }
        }
      },
      { $sort: { costoTotal: -1 } }
    ]);
    
    campanasAgrupadas.forEach(c => {
      console.log(`\n${c._id || 'Sin campaña'}`);
      console.log('  Empleados:', c.empleados);
      console.log('  Costo Total:', c.costoTotal.toFixed(2));
      console.log('  Sueldo Bruto:', c.sueldoBrutoTotal.toFixed(2));
    });
    
    await mongoose.disconnect();
    console.log('\n✅ Verificación completada');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

verificar();
