const { exec } = require('child_process');

console.log('🔄 FORCE RESTART - Arrêt et redémarrage du serveur');
console.log('==================================================');

// Fonction pour arrêter tous les processus Node.js
function killNodeProcesses() {
  return new Promise((resolve) => {
    exec('taskkill /F /IM node.exe', (error) => {
      if (error) {
        console.log('⚠️ Aucun processus Node.js à arrêter ou déjà arrêté');
      } else {
        console.log('✅ Tous les processus Node.js arrêtés');
      }
      resolve();
    });
  });
}

// Fonction pour démarrer le serveur
function startServer() {
  return new Promise((resolve, reject) => {
    console.log('🚀 Démarrage du serveur...');
    const serverProcess = exec('npm start', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erreur lors du démarrage:', error);
        reject(error);
      } else {
        console.log('✅ Serveur démarré avec succès');
        resolve();
      }
    });
    
    // Afficher la sortie du serveur
    serverProcess.stdout.on('data', (data) => {
      console.log(data.toString());
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(data.toString());
    });
  });
}

// Séquence d'arrêt et redémarrage
async function forceRestart() {
  try {
    await killNodeProcesses();
    
    // Attendre 3 secondes
    console.log('⏳ Attente de 3 secondes...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    await startServer();
    
  } catch (error) {
    console.error('❌ Erreur lors du redémarrage:', error);
  }
}

forceRestart();