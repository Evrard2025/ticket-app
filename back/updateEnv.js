const fs = require('fs');
const path = require('path');

// Nouvelles valeurs YengaPay
const newEnvValues = {
  'YENGA_API_KEY': 'vRFH0eRawW702LisWcECWQOOIciMwrwj',
  'YENGA_GROUP_ID': '10823582',
  'YENGA_PAYMENT_INTENT_ID': '45842',
  'YENGA_WEBHOOK_SECRET': '78276155-1600-45ce-b161-8cc5a8194d9a',
  'EMAIL_USER': 'eburtiseburtistest@gmail.com',
  'EMAIL_PASS': 'rjyh ezao sdge uobf'
};

async function updateEnvFile() {
  try {
    const envPath = path.join(__dirname, '.env');
    
    console.log('🔧 Mise à jour du fichier .env');
    console.log('==============================');
    
    // Vérifier si le fichier .env existe
    if (!fs.existsSync(envPath)) {
      console.log('❌ Fichier .env non trouvé');
      console.log('📝 Création du fichier .env...');
      
      // Créer le fichier .env avec toutes les variables
      const envContent = `# Configuration de la base de données
DATABASE_URL=postgresql://postgres:2023@localhost:5432/ticketdb

# Configuration JWT
JWT_SECRET=Supersecretjwtkey

# Configuration YengaPay
YENGA_API_KEY=${newEnvValues.YENGA_API_KEY}
YENGA_GROUP_ID=${newEnvValues.YENGA_GROUP_ID}
YENGA_PAYMENT_INTENT_ID=${newEnvValues.YENGA_PAYMENT_INTENT_ID}
YENGA_WEBHOOK_SECRET=${newEnvValues.YENGA_WEBHOOK_SECRET}

# Configuration Email
EMAIL_SERVICE=gmail
EMAIL_USER=${newEnvValues.EMAIL_USER}
EMAIL_PASS=${newEnvValues.EMAIL_PASS}

# Configuration Frontend
FRONTEND_URL=http://localhost:5173

# Configuration du serveur
PORT=5000
NODE_ENV=development
`;
      
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Fichier .env créé avec succès');
      
    } else {
      console.log('📋 Fichier .env trouvé, mise à jour...');
      
      // Lire le fichier .env existant
      let envContent = fs.readFileSync(envPath, 'utf8');
      
      // Mettre à jour chaque variable
      Object.entries(newEnvValues).forEach(([key, value]) => {
        const regex = new RegExp(`^${key}=.*`, 'm');
        const newLine = `${key}=${value}`;
        
        if (regex.test(envContent)) {
          // Variable existe, la mettre à jour
          envContent = envContent.replace(regex, newLine);
          console.log(`✅ ${key} mise à jour`);
        } else {
          // Variable n'existe pas, l'ajouter
          envContent += `\n${newLine}`;
          console.log(`➕ ${key} ajoutée`);
        }
      });
      
      // Écrire le fichier mis à jour
      fs.writeFileSync(envPath, envContent);
      console.log('✅ Fichier .env mis à jour avec succès');
    }
    
    // Vérifier le résultat
    console.log('\n🔍 Vérification du fichier .env mis à jour:');
    const updatedContent = fs.readFileSync(envPath, 'utf8');
    
    Object.entries(newEnvValues).forEach(([key, expectedValue]) => {
      const regex = new RegExp(`^${key}=(.+)$`, 'm');
      const match = updatedContent.match(regex);
      
      if (match && match[1] === expectedValue) {
        console.log(`✅ ${key}: ${expectedValue}`);
      } else {
        console.log(`❌ ${key}: ${match ? match[1] : 'Manquant'}`);
      }
    });
    
    console.log('\n🎉 Mise à jour terminée !');
    console.log('🔄 Redémarrez le serveur pour appliquer les changements');
    
  } catch (error) {
    console.error('❌ Erreur lors de la mise à jour:', error);
  }
}

updateEnvFile();