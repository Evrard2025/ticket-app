const RetryService = require('../services/retryService');

// Script pour traiter la file de retry
async function processRetryQueue() {
  console.log('🔄 Début du traitement de la file de retry...');
  
  try {
    await RetryService.processRetryQueue();
    
    // Nettoyer les anciens retries (optionnel)
    await RetryService.cleanupOldRetries(30);
    
    // Afficher les statistiques
    const stats = await RetryService.getRetryStats();
    console.log('📊 Statistiques de retry:', stats);
    
    console.log('✅ Traitement de la file de retry terminé');
  } catch (error) {
    console.error('❌ Erreur lors du traitement de la file de retry:', error);
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  processRetryQueue()
    .then(() => {
      console.log('✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script terminé avec erreur:', error);
      process.exit(1);
    });
}

module.exports = { processRetryQueue };