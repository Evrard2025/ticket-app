const fs = require('fs');
const path = require('path');

// Configuration YengaPay qui fonctionnait
const WORKING_CONFIG = {
  'YENGA_API_KEY': 'FY2JesSN7qENbWoKfERlIcIvtfoBCjFl',
  'YENGA_GROUP_ID': '10315194',
  'YENGA_PAYMENT_INTENT_ID': '61819',
  'YENGA_WEBHOOK_SECRET': '92f9e221-5955-4a4a-a30c-dbd74d77b6b5'
};

async function fixYengaPay() {
  try {
    const envPath = path.join(__dirname, '.env');
    
    console.log('🔧 Correction rapide YengaPay');
    console.log('=============================');
    
    if (!fs.existsSync(envPath)) {
      console.log('❌ Fichier .env non trouvé');
      return;
    }
    
    // Lire le fichier .env existant
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Restaurer la configuration qui fonctionne
    Object.entries(WORKING_CONFIG).forEach(([key, value]) => {
      const regex = new RegExp(`^${key}=.*`, 'm');
      const newLine = `${key}=${value}`;
      
      if (regex.test(envContent)) {
        envContent = envContent.replace(regex, newLine);
        console.log(`✅ ${key} restaurée`);
      } else {
        envContent += `\n${newLine}`;
        console.log(`➕ ${key} ajoutée`);
      }
    });
    
    // Écrire le fichier mis à jour
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Configuration YengaPay corrigée');
    
    console.log('\n🎯 Configuration restaurée:');
    console.log('API_KEY:', WORKING_CONFIG.YENGA_API_KEY);
    console.log('GROUP_ID:', WORKING_CONFIG.YENGA_GROUP_ID);
    console.log('PAYMENT_INTENT_ID:', WORKING_CONFIG.YENGA_PAYMENT_INTENT_ID);
    
    console.log('\n🔄 Redémarrez le serveur maintenant !');
    console.log('npm start');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  }
}

fixYengaPay();