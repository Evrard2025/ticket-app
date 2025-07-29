const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');

const client = new Client({
  authStrategy: new LocalAuth(),
  puppeteer: { headless: true }
});

client.on('qr', (qr) => {
  console.log('Scanne ce QR code avec WhatsApp pour connecter le bot :');
  qrcode.generate(qr, { small: true });
});

client.on('ready', () => {
  console.log('Client WhatsApp prêt !');
});

client.initialize();

async function sendWhatsAppMessage(phone, message) {
  // phone doit être au format international, ex: 2250700000000@c.us
  try {
    await client.sendMessage(phone, message);
    return true;
  } catch (err) {
    console.error('Erreur envoi WhatsApp :', err);
    return false;
  }
}

module.exports = { sendWhatsAppMessage }; 