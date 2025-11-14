/**
 * Scheduler para Sincronización Automática
 * Ejecuta tareas de sincronización periódicamente
 */

const cron = require('node-cron');
const { syncAllFolders } = require('./autoSyncService');

let scheduledTask = null;

/**
 * Inicia el scheduler de sincronización
 */
function startScheduler() {
  if (scheduledTask) {
    console.log('[SYNC SCHEDULER] Ya hay un scheduler en ejecución');
    return;
  }

  // Ejecutar cada 5 minutos
  // Cron format: minuto hora día mes día-semana
  scheduledTask = cron.schedule('*/5 * * * *', async () => {
    console.log('[SYNC SCHEDULER] Ejecutando sincronización programada...');
    try {
      await syncAllFolders();
      console.log('[SYNC SCHEDULER] Sincronización completada');
    } catch (error) {
      console.error('[SYNC SCHEDULER] Error en sincronización:', error);
    }
  });

  console.log('[SYNC SCHEDULER] Scheduler iniciado (cada 5 minutos)');
}

/**
 * Detiene el scheduler
 */
function stopScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log('[SYNC SCHEDULER] Scheduler detenido');
  }
}

/**
 * Reinicia el scheduler
 */
function restartScheduler() {
  stopScheduler();
  startScheduler();
}

/**
 * Estado del scheduler
 */
function getSchedulerStatus() {
  return {
    running: scheduledTask !== null,
    nextExecution: scheduledTask ? 'Cada 5 minutos' : null
  };
}

module.exports = {
  startScheduler,
  stopScheduler,
  restartScheduler,
  getSchedulerStatus
};
