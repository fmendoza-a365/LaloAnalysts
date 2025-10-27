const mongoose = require('mongoose');
require('dotenv').config();

const Tarifa = require('./models/Tarifa');

async function verificar() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB\n');
    
    // Obtener todas las tarifas únicas por mesa
    const tarifas = await Tarifa.find({ activo: true }).distinct('mesa');
    
    console.log('=== TARIFAS ACTIVAS EN LA BASE DE DATOS ===');
    console.log(`Total: ${tarifas.length}\n`);
    
    tarifas.sort().forEach((mesa, idx) => {
      console.log(`${idx + 1}. "${mesa}"`);
    });
    
    console.log('\n=== MAPEO ESPERADO ===');
    console.log('Prevención del Fraude → Monitoreo Prevención y Tratamiento de Fraude Inbound');
    console.log('Redes Sociales → Redes Sociales - Costo del Servicio por Rango (Agente)');
    
    // Verificar si existen exactamente
    const fraude = tarifas.find(t => t.includes('Fraude'));
    const redes = tarifas.find(t => t.includes('Redes Sociales') && t.includes('Agente'));
    
    console.log('\n=== VERIFICACIÓN ===');
    console.log('Fraude:', fraude || '❌ NO ENCONTRADA');
    console.log('Redes Sociales (Agente):', redes || '❌ NO ENCONTRADA');
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verificar();
