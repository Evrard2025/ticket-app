const { exec } = require('child_process');

console.log('🔄 Redémarrage du serveur...');

// Arrêter tous les processus Node.js
exec('taskkill /F /IM node.exe', (error) => {
  if (error) {
    console.log('⚠️ Aucun processus Node.js à arrêter');
  } else {
    console.log('✅ Processus Node.js arrêtés');
  }
  
  // Attendre 2 secondes puis redémarrer
  setTimeout(() => {
    console.log('🚀 Démarrage du serveur...');
    exec('npm start', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erreur lors du démarrage:', error);
        return;
      }
      console.log('✅ Serveur redémarré avec succès');
    });
  }, 2000);
});