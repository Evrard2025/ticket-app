require('dotenv').config();

console.log('🔍 Vérification des variables d\'environnement');
console.log('============================================');

// Variables critiques
const criticalVars = {
  'YENGA_API_KEY': process.env.YENGA_API_KEY,
  'YENGA_GROUP_ID': process.env.YENGA_GROUP_ID,
  'YENGA_PAYMENT_INTENT_ID': process.env.YENGA_PAYMENT_INTENT_ID,
  'YENGA_WEBHOOK_SECRET': process.env.YENGA_WEBHOOK_SECRET,
  'EMAIL_USER': process.env.EMAIL_USER,
  'EMAIL_PASS': process.env.EMAIL_PASS,
  'DATABASE_URL': process.env.DATABASE_URL
};

console.log('\n📋 Variables d\'environnement:');
Object.entries(criticalVars).forEach(([key, value]) => {
  const status = value ? '✅' : '❌';
  const displayValue = value ? `${value.substring(0, 10)}...` : 'Manquant';
  console.log(`${status} ${key}: ${displayValue}`);
});

// Vérifier les nouvelles valeurs
console.log('\n🎯 Vérification des nouvelles valeurs:');
console.log('YENGA_API_KEY attendue:', 'vRFH0eRawW702LisWcECWQOOIciMwrwj');
console.log('YENGA_API_KEY actuelle:', process.env.YENGA_API_KEY);
console.log('Correspondance:', process.env.YENGA_API_KEY === 'vRFH0eRawW702LisWcECWQOOIciMwrwj' ? '✅' : '❌');

console.log('\nYENGA_GROUP_ID attendu:', '10823582');
console.log('YENGA_GROUP_ID actuel:', process.env.YENGA_GROUP_ID);
console.log('Correspondance:', process.env.YENGA_GROUP_ID === '10823582' ? '✅' : '❌');

console.log('\nYENGA_PAYMENT_INTENT_ID attendu:', '45842');
console.log('YENGA_PAYMENT_INTENT_ID actuel:', process.env.YENGA_PAYMENT_INTENT_ID);
console.log('Correspondance:', process.env.YENGA_PAYMENT_INTENT_ID === '45842' ? '✅' : '❌');

// Test de la configuration YengaPay
console.log('\n🔧 Test de la configuration YengaPay:');
const { YENGA_CONFIG } = require('./config/yengapay');

console.log('API_KEY configurée:', YENGA_CONFIG.API_KEY);
console.log('GROUP_ID configuré:', YENGA_CONFIG.GROUP_ID);
console.log('PAYMENT_INTENT_ID configuré:', YENGA_CONFIG.PAYMENT_INTENT_ID);

console.log('\n🎉 Vérification terminée !');