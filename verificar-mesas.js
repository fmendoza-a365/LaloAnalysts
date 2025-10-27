const mongoose = require('mongoose');
require('dotenv').config();

const ProvisionDataset = require('./models/ProvisionDataset');
const ProvisionRecord = require('./models/ProvisionRecord');

async function verificar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
    
    // Buscar dataset de octubre 2025
    const dataset = await ProvisionDataset.findOne({ anio: 2025, mes: 10 });
    
    if (!dataset) {
      console.log('❌ No se encontró dataset de Octubre 2025');
      process.exit(1);
    }
    
    console.log('✅ Dataset encontrado:', dataset._id);
    
    // Obtener todas las mesas únicas
    const mesas = await ProvisionRecord.distinct('mesa', { datasetId: dataset._id });
    
    console.log('\n=== MESAS EN PROVISIÓN ===');
    mesas.sort().forEach((mesa, idx) => {
      console.log(`${idx + 1}. "${mesa}"`);
    });
    
    // Buscar específicamente Fraude
    const fraudeMesas = mesas.filter(m => m.toLowerCase().includes('fraud'));
    console.log('\n=== MESAS CON "FRAUD" ===');
    fraudeMesas.forEach(mesa => {
      console.log(`- "${mesa}"`);
    });
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verificar();
