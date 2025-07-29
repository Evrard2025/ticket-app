const crypto = require('crypto');

// Configuration YengaPay selon la documentation officielle
// https://kreezus.notion.site/DOCUMENTATION-API-YENGAPAY-KREEZUS-e9de95e48d504110aa048261a200292a

const YENGA_CONFIG = {
  // Configuration de base
  API_KEY: process.env.YENGA_API_KEY || 'vRFH0eRawW702LisWcECWQOOIciMwrwj',
  GROUP_ID: process.env.YENGA_GROUP_ID || '10823582',
  PAYMENT_INTENT_ID: process.env.YENGA_PAYMENT_INTENT_ID || '45842',
  
  // URLs de l'API
  BASE_URL: 'https://api.yengapay.com',
  API_VERSION: 'v1',
  
  // Endpoints
  PAYMENT_INTENT_ENDPOINT: '/payment-intent',
  WEBHOOK_ENDPOINT: '/webhook',
  
  // Configuration des paiements
  CURRENCY: 'XOF', // Franc CFA
  MIN_AMOUNT: 200, // Montant minimum en XOF
  EUR_TO_XOF_RATE: 655, // Taux de conversion EUR vers XOF
  
  // Configuration des articles
  DEFAULT_IMAGE: 'https://quixy.com/wp-content/uploads/2020/05/Solutions_Finance_Theme-1.png',
  
  // Configuration webhook
  WEBHOOK_SECRET: process.env.YENGA_WEBHOOK_SECRET || '78276155-1600-45ce-b161-8cc5a8194d9a',
  
  // Statuts de transaction
  STATUS: {
    PENDING: 'PENDING',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
    CANCELLED: 'CANCELLED'
  }
};

// Fonctions utilitaires pour YengaPay
const YengaPayUtils = {
  // Construire l'URL complète de l'API
  buildApiUrl: (endpoint) => {
    return `${YENGA_CONFIG.BASE_URL}/api/${YENGA_CONFIG.API_VERSION}/groups/${YENGA_CONFIG.GROUP_ID}${endpoint}/${YENGA_CONFIG.PAYMENT_INTENT_ID}`;
  },
  
  // Convertir EUR en XOF avec montant minimum
  convertToXOF: (amountEUR) => {
    const amountXOF = Math.round(amountEUR * YENGA_CONFIG.EUR_TO_XOF_RATE);
    return Math.max(YENGA_CONFIG.MIN_AMOUNT, amountXOF);
  },
  
  // Générer une référence unique
  generateReference: (orderId) => {
    return `PAY-${Date.now()}-${orderId}`;
  },
  
  // Construire le payload selon la documentation
  buildPaymentPayload: (order, event, ticket) => {
    const amountXOF = YengaPayUtils.convertToXOF(parseFloat(order.total));
    const reference = YengaPayUtils.generateReference(order.id);
    
    return {
      paymentAmount: amountXOF,
      reference: reference,
      articles: [{
        title: event.titre || 'Ticket Event',
        description: `Paiement pour ${ticket.categorie} - ${event.titre} (${order.quantite} ticket(s))`,
        pictures: [event.image_url || YENGA_CONFIG.DEFAULT_IMAGE],
        price: amountXOF
      }]
    };
  },
  
  // Construire les headers pour l'API
  buildHeaders: () => {
    return {
      'Content-Type': 'application/json',
      'x-api-key': YENGA_CONFIG.API_KEY
    };
  },
  
  // Valider la réponse YengaPay
  validateResponse: (response) => {
    if (!response.data) {
      throw new Error('Réponse YengaPay invalide');
    }
    
    const requiredFields = ['id', 'reference', 'checkoutPageUrlWithPaymentToken'];
    for (const field of requiredFields) {
      if (!response.data[field]) {
        throw new Error(`Champ requis manquant dans la réponse YengaPay: ${field}`);
      }
    }
    
    return response.data;
  },
  
  // Valider la signature du webhook
  validateWebhookSignature: (payload, signature, timestamp) => {
    try {
      // Construire la chaîne à signer selon la documentation YengaPay
      const dataToSign = `${payload}${timestamp}${YENGA_CONFIG.WEBHOOK_SECRET}`;
      
      // Calculer la signature HMAC-SHA256
      const expectedSignature = crypto
        .createHmac('sha256', YENGA_CONFIG.WEBHOOK_SECRET)
        .update(dataToSign)
        .digest('hex');
      
      // Comparer les signatures
      return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );
    } catch (error) {
      console.error('❌ Erreur lors de la validation de signature:', error);
      return false;
    }
  },
  
  // Traiter le webhook YengaPay
  processWebhook: (webhookData) => {
    const { reference, status, transactionId, amount } = webhookData;
    
    if (!reference) {
      throw new Error('Référence manquante dans le webhook');
    }
    
    return {
      reference,
      status: status || 'PENDING',
      transactionId: transactionId || null,
      amount: amount || 0,
      processedAt: new Date().toISOString()
    };
  }
};

module.exports = {
  YENGA_CONFIG,
  YengaPayUtils
}; 