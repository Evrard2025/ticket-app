const express = require('express');
const axios = require('axios');
const QRCode = require('qrcode');
const pool = require('../db');
const router = express.Router();
const nodemailer = require('nodemailer');
const { YENGA_CONFIG, YengaPayUtils } = require('../config/yengapay');
const NotificationService = require('../services/notifications');
const RetryService = require('../services/retryService');
const TicketGenerator = require('../services/ticketGenerator');

// Pour WhatsApp via Twilio (exemple)
// const twilio = require('twilio');
// const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);

// Configuration YengaPay
const YENGA_API_KEY = process.env.YENGA_API_KEY || 'FY2JesSN7qENbWoKfERlIcIvtfoBCjFl';
const YENGA_GROUP_ID = process.env.YENGA_GROUP_ID || '10315194';
const YENGA_PAYMENT_INTENT_ID = process.env.YENGA_PAYMENT_INTENT_ID || '61819';

// Fonction pour envoyer les notifications de paiement
async function sendPaymentNotifications(orderId, status) {
  try {
    if (status === 'success') {
      await NotificationService.sendPaymentSuccessNotification(orderId);
    } else if (status === 'failed') {
      await NotificationService.sendPaymentFailedNotification(orderId);
    }
  } catch (error) {
    console.error('❌ Erreur lors de l\'envoi des notifications:', error);
    // Ne pas faire échouer le webhook à cause des notifications
  }
}

// Paiement et génération de ticket électronique
router.post('/', async (req, res) => {
  const { user_id, ticket_id, quantity } = req.body;
  try {
    // Récupérer les infos du ticket et de l'utilisateur
    const ticketRes = await pool.query('SELECT * FROM tickets WHERE id = $1', [ticket_id]);
    const userRes = await pool.query('SELECT * FROM users WHERE id = $1', [user_id]);
    const ticket = ticketRes.rows[0];
    const user = userRes.rows[0];
    if (!ticket || !user) return res.status(404).json({ error: 'Ticket ou utilisateur introuvable' });
    if (ticket.stock < quantity) return res.status(400).json({ error: 'Stock insuffisant' });
    const montant = Number(ticket.price) * Number(quantity);
    const reference = `ORDER-${Date.now()}-${user_id}`;
    // Préparer le payload YengaPay
    const payload = {
      paymentAmount: montant,
      reference,
      articles: [{
        title: ticket.category + ' - ' + ticket.id,
        description: `Paiement pour le ticket ${ticket.category} de l'événement ${ticket.event_id}`,
        pictures: [],
        price: montant
      }]
    };
    const apiKey = process.env.YENGA_API_KEY;
    // Appel à YengaPay
    const response = await axios.post(
      'https://api.yengapay.com/api/v1/groups/10315194/payment-intent/61819',
      payload,
      { headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey } }
    );
    // Générer le QR code du ticket (contenant l'ID de commande ou un hash)
    const orderRes = await pool.query(
      'INSERT INTO orders (user_id, ticket_id, quantity, total, status) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [user_id, ticket_id, quantity, montant, 'paid']
    );
    const order = orderRes.rows[0];
    const qrData = `order:${order.id}|user:${user_id}|ticket:${ticket_id}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    // Décrémenter le stock du ticket
    await pool.query('UPDATE tickets SET stock = stock - $1 WHERE id = $2', [quantity, ticket_id]);

    // ENVOI EMAIL avec le QR code en pièce jointe
    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || 'gmail', // ✅ Utiliser la variable d'environnement
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Votre ticket électronique',
      text: `Merci pour votre achat ! Voici votre ticket pour l'événement ${ticket.event_id}.`,
      attachments: [{
        filename: `ticket-${order.id}.png`,
        content: qrCodeUrl.split(",")[1],
        encoding: 'base64'
      }]
    };
    await transporter.sendMail(mailOptions);

    // ENVOI WHATSAPP via whatsapp-web.js
    if (user.telephone) {
      // Format international sans +, ex: 2250700000000@c.us
      let phone = user.telephone.replace(/\D/g, '');
      if (!phone.endsWith('@c.us')) phone = phone + '@c.us';
      const whatsappMsg = `Merci pour votre achat ! Voici votre ticket pour l'événement ${ticket.event_id}.\nLien QR code : ${qrCodeUrl}`;
      // await sendWhatsAppMessage(phone, whatsappMsg);
    }

    res.json({ payment: response.data, order, qrCodeUrl, email: user.email, whatsapp: user.telephone });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Liste des paiements (optionnel: filtrer par order_id)
router.get('/', async (req, res) => {
  const { order_id } = req.query;
  let result;
  if (order_id) {
    result = await pool.query(`
      SELECT p.*, o.total as order_total, o.statut as order_status, 
             u.name as user_name, u.email as user_email,
             t.categorie as ticket_category, t.prix as ticket_price,
             e.titre as event_title
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.utilisateur_id = u.id
      JOIN tickets t ON o.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE p.order_id = $1
      ORDER BY p.created_at DESC
    `, [order_id]);
  } else {
    result = await pool.query(`
      SELECT p.*, o.total as order_total, o.statut as order_status, 
             u.name as user_name, u.email as user_email,
             t.categorie as ticket_category, t.prix as ticket_price,
             e.titre as event_title
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.utilisateur_id = u.id
      JOIN tickets t ON o.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      ORDER BY p.created_at DESC
    `);
  }
  
  const payments = result.rows.map(p => ({
    id: p.id,
    orderId: p.order_id,
    amount: p.montant,
    paymentMethod: p.methode_paiement,
    status: p.statut,
    paymentReference: p.reference_paiement,
    transactionId: p.transaction_id,
    paymentData: p.donnees_paiement,
    paymentDate: p.date_paiement,
    orderTotal: p.order_total,
    orderStatus: p.order_status,
    userName: p.user_name,
    userEmail: p.user_email,
    ticketCategory: p.ticket_category,
    ticketPrice: p.ticket_price,
    eventTitle: p.event_title,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  }));
  
  res.json(payments);
});

// Détail d'un paiement
router.get('/:id', async (req, res) => {
  const result = await pool.query(`
    SELECT p.*, o.total as order_total, o.statut as order_status, 
           u.name as user_name, u.email as user_email,
           t.categorie as ticket_category, t.prix as ticket_price,
           e.titre as event_title
    FROM payments p
    JOIN orders o ON p.order_id = o.id
    JOIN users u ON o.utilisateur_id = u.id
    JOIN tickets t ON o.ticket_id = t.id
    JOIN events e ON t.event_id = e.id
    WHERE p.id = $1
  `, [req.params.id]);
  
  const p = result.rows[0];
  if (!p) return res.status(404).json({ error: 'Paiement non trouvé' });
  
  const payment = {
    id: p.id,
    orderId: p.order_id,
    amount: p.montant,
    paymentMethod: p.methode_paiement,
    status: p.statut,
    paymentReference: p.reference_paiement,
    transactionId: p.transaction_id,
    paymentData: p.donnees_paiement,
    paymentDate: p.date_paiement,
    orderTotal: p.order_total,
    orderStatus: p.order_status,
    userName: p.user_name,
    userEmail: p.user_email,
    ticketCategory: p.ticket_category,
    ticketPrice: p.ticket_price,
    eventTitle: p.event_title,
    createdAt: p.created_at,
    updatedAt: p.updated_at
  };
  
  res.json(payment);
});

// Création d'un paiement
router.post('/', async (req, res) => {
  const { 
    order_id, 
    montant, 
    methode_paiement, 
    reference_paiement, 
    transaction_id, 
    donnees_paiement 
  } = req.body;
  
  try {
    // Vérifier que la commande existe
    const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [order_id]);
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    const order = orderResult.rows[0];
    
    // Vérifier que le montant correspond au total de la commande
    if (parseFloat(montant) !== parseFloat(order.total)) {
      return res.status(400).json({ 
        error: 'Le montant du paiement ne correspond pas au total de la commande',
        orderTotal: order.total,
        paymentAmount: montant
      });
    }
    
    // Créer le paiement
    const result = await pool.query(`
      INSERT INTO payments (order_id, montant, methode_paiement, reference_paiement, transaction_id, donnees_paiement)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [order_id, montant, methode_paiement, reference_paiement, transaction_id, donnees_paiement]);
    
    const p = result.rows[0];
    const payment = {
      id: p.id,
      orderId: p.order_id,
      amount: p.montant,
      paymentMethod: p.methode_paiement,
      status: p.statut,
      paymentReference: p.reference_paiement,
      transactionId: p.transaction_id,
      paymentData: p.donnees_paiement,
      paymentDate: p.date_paiement,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    };
    
    res.status(201).json(payment);
  } catch (err) {
    console.error('Erreur lors de la création du paiement:', err);
    res.status(400).json({ error: err.message });
  }
});

// Création d'un paiement YengaPay avec gestion des erreurs et retry
router.post('/yengapay', async (req, res) => {
  const { order_id } = req.body;
  
  console.log('🔍 Début création paiement YengaPay');
  console.log('📋 Order ID reçu:', order_id);
  console.log('📋 Body complet:', req.body);
  
  try {
    // Récupérer les informations de la commande avec jointures
    const orderResult = await pool.query(`
      SELECT o.*, t.categorie as ticket_category, t.prix as ticket_price,
             e.titre as event_title, e.image_url as event_image, e.lieu as event_location
      FROM orders o
      JOIN tickets t ON o.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE o.id = $1
    `, [order_id]);
    
    console.log('📊 Résultat requête commande:', orderResult.rows.length, 'lignes trouvées');
    
    if (orderResult.rows.length === 0) {
      console.error('❌ Commande non trouvée pour ID:', order_id);
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    const order = orderResult.rows[0];
    const event = {
      titre: order.event_title,
      image_url: order.event_image,
      lieu: order.event_location
    };
    const ticket = {
      categorie: order.ticket_category,
      prix: order.ticket_price
    };
    
    console.log('📋 Commande trouvée:', {
      id: order.id,
      total: order.total,
      ticket_category: order.ticket_category,
      event_title: order.event_title
    });

    // Construire le payload selon la documentation YengaPay
    const payload = YengaPayUtils.buildPaymentPayload(order, event, ticket);
    console.log('📋 Payload YengaPay:', JSON.stringify(payload, null, 2));

    // Construire l'URL de l'API YengaPay
    const apiUrl = YengaPayUtils.buildApiUrl(YENGA_CONFIG.PAYMENT_INTENT_ENDPOINT);
    console.log('🔗 URL API YengaPay:', apiUrl);

    // Appel à l'API YengaPay
    const response = await axios.post(apiUrl, payload, {
      headers: YengaPayUtils.buildHeaders(),
      timeout: 30000 // 30 secondes de timeout
    });

    // Valider la réponse YengaPay
    const yengaPayData = YengaPayUtils.validateResponse(response);
    console.log('✅ Réponse YengaPay validée:', {
      id: yengaPayData.id,
      reference: yengaPayData.reference,
      checkoutUrl: yengaPayData.checkoutPageUrlWithPaymentToken
    });

    // Créer le paiement en base avec les données YengaPay
    const paymentResult = await pool.query(`
      INSERT INTO payments (order_id, montant, methode_paiement, reference_paiement, transaction_id, donnees_paiement)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      order_id, 
      payload.paymentAmount, // Montant en XOF
      'yengapay', 
      payload.reference, 
      yengaPayData.id, // Transaction ID de YengaPay
      {
        yengapayResponse: yengaPayData,
        paymentIntent: YENGA_CONFIG.PAYMENT_INTENT_ID,
        groupId: YENGA_CONFIG.GROUP_ID,
        currency: YENGA_CONFIG.CURRENCY,
        originalAmountEUR: parseFloat(order.total),
        convertedAmountXOF: payload.paymentAmount
      }
    ]);

    const payment = paymentResult.rows[0];
    
    // Construire la réponse pour le frontend
    const paymentResponse = {
      id: payment.id,
      orderId: payment.order_id,
      amount: payment.montant,
      paymentMethod: payment.methode_paiement,
      status: payment.statut,
      paymentReference: payment.reference_paiement,
      transactionId: payment.transaction_id,
      paymentData: payment.donnees_paiement,
      yengapayData: {
        id: yengaPayData.id,
        reference: yengaPayData.reference,
        checkoutPageUrlWithPaymentToken: yengaPayData.checkoutPageUrlWithPaymentToken,
        paymentAmount: yengaPayData.paymentAmount,
        currency: yengaPayData.currency,
        transactionStatus: yengaPayData.transactionStatus,
        token: yengaPayData.token
      },
      createdAt: payment.created_at,
      updatedAt: payment.updated_at
    };

    console.log('✅ Paiement YengaPay créé avec succès:', paymentResponse.id);
    res.status(201).json(paymentResponse);
    
  } catch (err) {
    console.error('❌ Erreur lors de la création du paiement YengaPay:', err);
    
    // Gestion spécifique des erreurs YengaPay
    if (err.response) {
      console.error('📋 Réponse YengaPay:', err.response.data);
      console.error('📋 Status YengaPay:', err.response.status);
      
      // Ajouter le paiement échoué à la file de retry
      try {
        // Récupérer les informations de la commande pour le montant
        const orderResult = await pool.query(`
          SELECT o.*, t.categorie as ticket_category, t.prix as ticket_price,
                 e.titre as event_title, e.image_url as event_image, e.lieu as event_location
          FROM orders o
          JOIN tickets t ON o.ticket_id = t.id
          JOIN events e ON t.event_id = e.id
          WHERE o.id = $1
        `, [order_id]);
        
        const order = orderResult.rows[0];
        
        const failedPaymentResult = await pool.query(`
          INSERT INTO payments (order_id, montant, methode_paiement, reference_paiement, statut, donnees_paiement)
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `, [
          order_id,
          order ? YengaPayUtils.convertToXOF(parseFloat(order.total)) : 0,
          'yengapay',
          `FAILED-${Date.now()}-${order_id}`,
          'failed',
          {
            error: err.response.data,
            statusCode: err.response.status,
            timestamp: new Date().toISOString()
          }
        ]);

        const failedPayment = failedPaymentResult.rows[0];
        await RetryService.addToRetryQueue(failedPayment.id, `API Error: ${err.response.status}`);
        
        console.log('🔄 Paiement échoué ajouté à la file de retry');
      } catch (retryError) {
        console.error('❌ Erreur lors de l\'ajout à la file de retry:', retryError);
      }
      
      return res.status(400).json({ 
        error: 'Erreur de communication avec YengaPay',
        details: {
          message: err.response.data?.message || err.message,
          error: err.response.data?.error || 'Bad Request',
          statusCode: err.response.status,
          yengaPayError: err.response.data
        }
      });
    }
    
    res.status(400).json({ 
      error: err.message,
      details: 'Erreur interne du serveur'
    });
  }
});

// Webhook YengaPay pour recevoir les notifications de paiement
router.post('/yengapay/webhook', async (req, res) => {
  try {
    console.log('📥 Webhook YengaPay reçu:', JSON.stringify(req.body, null, 2));
    console.log('📥 Headers reçus:', JSON.stringify(req.headers, null, 2));

    // Validation de base du webhook
    if (!req.body || typeof req.body !== 'object') {
      console.error('❌ Webhook invalide: body manquant ou invalide');
      return res.status(400).json({ error: 'Webhook invalide' });
    }

    // Récupérer les headers de signature
    const signature = req.headers['x-yenga-signature'];
    const timestamp = req.headers['x-yenga-timestamp'];
    
    console.log('🔐 Headers de signature:', { signature, timestamp });

    // Valider la signature si disponible
    if (signature && timestamp) {
      const payload = JSON.stringify(req.body);
      const isValidSignature = YengaPayUtils.validateWebhookSignature(payload, signature, timestamp);
      
      if (!isValidSignature) {
        console.error('❌ Signature webhook invalide');
        return res.status(401).json({ error: 'Signature invalide' });
      }
      
      console.log('✅ Signature webhook validée');
    } else {
      console.warn('⚠️ Signature webhook non disponible, validation ignorée');
    }

    // Traiter le webhook selon la documentation YengaPay
    const webhookData = req.body; // Utiliser directement les données reçues
    console.log('✅ Webhook reçu:', webhookData);

    // Trouver le paiement par référence
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE reference_paiement = $1',
      [webhookData.reference]
    );

    if (paymentResult.rows.length === 0) {
      console.error('❌ Paiement non trouvé pour la référence:', webhookData.reference);
      console.log('🔍 Recherche dans tous les paiements récents...');
      
      // Afficher les paiements récents pour debug
      const recentPayments = await pool.query(
        'SELECT id, reference_paiement, order_id, statut, created_at FROM payments ORDER BY created_at DESC LIMIT 10'
      );
      console.log('📋 Paiements récents:', recentPayments.rows);
      
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }

    const payment = paymentResult.rows[0];
    console.log('📋 Paiement trouvé:', payment.id);
    console.log('🔍 Webhook data reçu:', JSON.stringify(webhookData, null, 2));
    console.log('🔍 PaymentStatus:', webhookData.paymentStatus);
    console.log('🔍 Status:', webhookData.status);
    
    // Vérifier que le paiement n'a pas déjà été traité
    if (payment.statut === 'completed' && webhookData.paymentStatus && webhookData.paymentStatus.toUpperCase() === 'DONE') {
      console.log('⚠️ Paiement déjà traité:', payment.id);
      return res.json({ 
        success: true, 
        paymentId: payment.id,
        status: payment.statut,
        message: 'Paiement déjà traité'
      });
    }

    // Mapper le statut YengaPay vers notre statut interne
    let internalStatus = 'pending';
    const paymentStatus = webhookData.paymentStatus || webhookData.status || 'PENDING';
    
    switch (paymentStatus.toUpperCase()) {
      case 'COMPLETED':
      case 'SUCCESS':
      case 'PAID':
      case 'DONE':
        internalStatus = 'completed';
        break;
      case 'FAILED':
      case 'ERROR':
        internalStatus = 'failed';
        break;
      case 'CANCELLED':
        internalStatus = 'cancelled';
        break;
      default:
        internalStatus = 'pending';
    }

    console.log(`🔄 Mise à jour du statut: ${payment.statut} -> ${internalStatus}`);

    // Mettre à jour le statut du paiement (version simplifiée)
    // S'assurer que internalStatus est bien une chaîne VARCHAR
    const statusToUpdate = String(internalStatus);
    const transactionId = webhookData.transId ? String(webhookData.transId) : null;
    
    const updateResult = await pool.query(`
      UPDATE payments 
      SET statut = $1::VARCHAR(50), 
          transaction_id = $2, 
          date_paiement = CASE WHEN $1 = 'completed' THEN NOW() ELSE date_paiement END,
          updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [statusToUpdate, transactionId, payment.id]);

    const updatedPayment = updateResult.rows[0];
    console.log('✅ Paiement mis à jour:', updatedPayment.statut);

    // Si le paiement est réussi, traiter toutes les commandes du panier
    if (internalStatus === 'completed') {
      console.log(`🔄 Traitement de toutes les commandes du panier pour le paiement ${payment.id}`);
      
      // Récupérer toutes les commandes associées à ce paiement
      const ordersResult = await pool.query(`
        SELECT o.id, o.utilisateur_id, o.ticket_id, o.quantite, o.total
        FROM orders o
        WHERE o.utilisateur_id = (
          SELECT o2.utilisateur_id 
          FROM orders o2 
          WHERE o2.id = $1
        )
        AND o.statut = 'pending'
        AND o.created_at >= NOW() - INTERVAL '1 hour'
      `, [payment.order_id]);
      
      const pendingOrders = ordersResult.rows;
      console.log(`📋 ${pendingOrders.length} commandes en attente trouvées pour l'utilisateur`);
      
      // Confirmer toutes les commandes
      for (const order of pendingOrders) {
        console.log(`🔄 Mise à jour de la commande ${order.id} -> confirmed`);
        
        await pool.query(`
          UPDATE orders 
          SET statut = 'confirmed', updated_at = NOW()
          WHERE id = $1
        `, [order.id]);
        
        console.log(`✅ Commande ${order.id} confirmée`);
        
        // Envoyer les notifications pour chaque commande
        console.log(`📧 Envoi des notifications pour la commande ${order.id}`);
        await sendPaymentNotifications(order.id, 'success');
        console.log(`✅ Notifications envoyées pour la commande ${order.id}`);
      }
      
      console.log(`🎉 Toutes les commandes du panier ont été traitées avec succès`);
    }

    // Si le paiement a échoué, traiter toutes les commandes du panier
    if (internalStatus === 'failed' || internalStatus === 'cancelled') {
      console.log(`⚠️ Paiement ${payment.id} échoué, annulation de toutes les commandes`);
      
      // Récupérer toutes les commandes associées à ce paiement
      const ordersResult = await pool.query(`
        SELECT o.id, o.utilisateur_id, o.ticket_id, o.quantite, o.total
        FROM orders o
        WHERE o.utilisateur_id = (
          SELECT o2.utilisateur_id 
          FROM orders o2 
          WHERE o2.id = $1
        )
        AND o.statut = 'pending'
        AND o.created_at >= NOW() - INTERVAL '1 hour'
      `, [payment.order_id]);
      
      const pendingOrders = ordersResult.rows;
      console.log(`📋 ${pendingOrders.length} commandes en attente à annuler`);
      
      // Annuler toutes les commandes
      for (const order of pendingOrders) {
        console.log(`🔄 Annulation de la commande ${order.id}`);
        
        await pool.query(`
          UPDATE orders 
          SET statut = 'cancelled', updated_at = NOW()
          WHERE id = $1
        `, [order.id]);
        
        console.log(`✅ Commande ${order.id} annulée`);
        
        // Envoyer les notifications d'échec pour chaque commande
        console.log(`📧 Envoi des notifications d'échec pour la commande ${order.id}`);
        await sendPaymentNotifications(order.id, 'failed');
        console.log(`✅ Notifications d'échec envoyées pour la commande ${order.id}`);
      }
      
      console.log(`❌ Toutes les commandes du panier ont été annulées`);
    }

    // Réponse de succès au webhook
    res.json({ 
      success: true, 
      paymentId: updatedPayment.id,
      status: updatedPayment.statut,
      message: `Paiement ${internalStatus}`
    });

  } catch (err) {
    console.error('❌ Erreur lors du traitement du webhook YengaPay:', err);
    res.status(500).json({ 
      error: err.message,
      success: false
    });
  }
});

// Traitement d'un paiement (simulation de paiement)
router.post('/process/:id', async (req, res) => {
  const { id } = req.params;
  const { status, transaction_id } = req.body;
  
  try {
    // Récupérer le paiement
    const paymentResult = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }
    
    const payment = paymentResult.rows[0];
    
    // Mettre à jour le statut du paiement
    const updateResult = await pool.query(`
      UPDATE payments 
      SET statut = $1::VARCHAR(50), transaction_id = $2, date_paiement = NOW(), updated_at = NOW()
      WHERE id = $3
      RETURNING *
    `, [String(status), transaction_id, id]);
    
    const updatedPayment = updateResult.rows[0];
    
    // Si le paiement est confirmé, mettre à jour le statut de la commande
    if (status === 'completed' || status === 'paid') {
      await pool.query(`
        UPDATE orders 
        SET statut = 'confirmed', updated_at = NOW()
        WHERE id = $1
      `, [payment.order_id]);
    }
    
    // Si le paiement est échoué, remettre le stock disponible
    if (status === 'failed' || status === 'cancelled') {
      const orderResult = await pool.query('SELECT * FROM orders WHERE id = $1', [payment.order_id]);
      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];
        // Note: Le stock sera automatiquement recalculé lors de la prochaine requête
        // car il se base sur les commandes avec statut 'confirmed', 'paid', 'completed'
      }
    }
    
    const response = {
      id: updatedPayment.id,
      orderId: updatedPayment.order_id,
      amount: updatedPayment.montant,
      paymentMethod: updatedPayment.methode_paiement,
      status: updatedPayment.statut,
      paymentReference: updatedPayment.reference_paiement,
      transactionId: updatedPayment.transaction_id,
      paymentData: updatedPayment.donnees_paiement,
      paymentDate: updatedPayment.date_paiement,
      createdAt: updatedPayment.created_at,
      updatedAt: updatedPayment.updated_at
    };
    
    res.json(response);
  } catch (err) {
    console.error('Erreur lors du traitement du paiement:', err);
    res.status(400).json({ error: err.message });
  }
});

// Mise à jour du statut d'un paiement
router.put('/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  try {
    const result = await pool.query(`
      UPDATE payments 
      SET statut = $1::VARCHAR(50), updated_at = NOW()
      WHERE id = $2
      RETURNING *
    `, [String(status), id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }
    
    const p = result.rows[0];
    const payment = {
      id: p.id,
      orderId: p.order_id,
      amount: p.montant,
      paymentMethod: p.methode_paiement,
      status: p.statut,
      paymentReference: p.reference_paiement,
      transactionId: p.transaction_id,
      paymentData: p.donnees_paiement,
      paymentDate: p.date_paiement,
      createdAt: p.created_at,
      updatedAt: p.updated_at
    };
    
    res.json(payment);
  } catch (err) {
    console.error('Erreur lors de la mise à jour du statut:', err);
    res.status(400).json({ error: err.message });
  }
});

// Suppression d'un paiement
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM payments WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Endpoint pour traiter manuellement la file de retry
router.post('/retry/process', async (req, res) => {
  try {
    await RetryService.processRetryQueue();
    const stats = await RetryService.getRetryStats();
    
    res.json({
      success: true,
      message: 'File de retry traitée',
      stats
    });
  } catch (error) {
    console.error('❌ Erreur lors du traitement de la file de retry:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Endpoint pour obtenir les statistiques de retry
router.get('/retry/stats', async (req, res) => {
  try {
    const stats = await RetryService.getRetryStats();
    res.json(stats);
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des stats:', error);
    res.status(500).json({
      error: error.message
    });
  }
});

// Endpoint pour générer et télécharger un ticket
router.get('/ticket/:orderId', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log('🎫 Génération de ticket pour la commande:', orderId);
    
    // Vérifier que la commande existe et est payée
    const orderResult = await pool.query(`
      SELECT o.*, p.statut as payment_status
      FROM orders o
      LEFT JOIN payments p ON o.id = p.order_id
      WHERE o.id = $1
    `, [orderId]);
    
    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }
    
    const order = orderResult.rows[0];
    
    // Vérifier que le paiement est confirmé
    if (order.payment_status !== 'completed' && order.statut !== 'confirmed') {
      return res.status(400).json({ 
        error: 'Le ticket ne peut être généré que pour une commande payée',
        orderStatus: order.statut,
        paymentStatus: order.payment_status
      });
    }
    
    // Générer le ticket
    const ticketData = await TicketGenerator.generateTicket(orderId);
    
    // Envoyer le HTML du ticket
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${orderId}.html"`);
    res.send(ticketData.html);
    
    console.log(`✅ Ticket généré et envoyé pour la commande ${orderId}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la génération du ticket:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint pour télécharger les tickets d'une commande
router.get('/ticket/:orderId/download', async (req, res) => {
  try {
    const { orderId } = req.params;
    const { ticketNumber } = req.query; // Paramètre optionnel pour télécharger un ticket spécifique
    
    console.log(`📥 Demande de téléchargement pour la commande ${orderId}${ticketNumber ? `, ticket ${ticketNumber}` : ''}`);
    
    // Vérifier que la commande existe et appartient à l'utilisateur connecté
    const orderResult = await pool.query(`
      SELECT o.*, u.name as user_name, u.email, u.telephone,
             t.categorie as ticket_category, t.prix as ticket_price,
             e.titre as event_title, e.date as event_date, e.lieu as event_location,
             e.categorie as event_category
      FROM orders o
      JOIN users u ON o.utilisateur_id = u.id
      JOIN tickets t ON o.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const order = orderResult.rows[0];
    
    // Générer les tickets
    const ticketData = await TicketGenerator.generateTicket(orderId);
    
    if (!ticketData.tickets || ticketData.tickets.length === 0) {
      return res.status(500).json({ error: 'Erreur lors de la génération des tickets' });
    }
    
    // Si un numéro de ticket spécifique est demandé
    if (ticketNumber) {
      const ticketIndex = parseInt(ticketNumber) - 1;
      if (ticketIndex >= 0 && ticketIndex < ticketData.tickets.length) {
        const specificTicket = ticketData.tickets[ticketIndex];
        res.setHeader('Content-Type', 'image/png');
        res.setHeader('Content-Disposition', `attachment; filename="ticket-${orderId}-${ticketNumber}.png"`);
        res.send(specificTicket.imageBuffer);
        console.log(`✅ Ticket ${orderId}-${ticketNumber} téléchargé avec succès`);
        return;
      } else {
        return res.status(400).json({ error: 'Numéro de ticket invalide' });
      }
    }
    
    // Si aucun numéro spécifique, retourner le premier ticket par défaut
    const firstTicket = ticketData.tickets[0];
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Disposition', `attachment; filename="ticket-${orderId}.png"`);
    res.send(firstTicket.imageBuffer);
    
    console.log(`✅ Ticket ${orderId} téléchargé avec succès`);
    
  } catch (error) {
    console.error('❌ Erreur lors du téléchargement du ticket:', error);
    res.status(500).json({ error: 'Erreur lors du téléchargement du ticket' });
  }
});

// Endpoint pour obtenir la liste de tous les tickets d'une commande
router.get('/ticket/:orderId/list', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`📋 Demande de liste des tickets pour la commande ${orderId}`);
    
    // Vérifier que la commande existe
    const orderResult = await pool.query(`
      SELECT o.*, u.name as user_name, u.email, u.telephone,
             t.categorie as ticket_category, t.prix as ticket_price,
             e.titre as event_title, e.date as event_date, e.lieu as event_location,
             e.categorie as event_category
      FROM orders o
      JOIN users u ON o.utilisateur_id = u.id
      JOIN tickets t ON o.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const order = orderResult.rows[0];
    
    // Générer les tickets pour obtenir la liste
    const ticketData = await TicketGenerator.generateTicket(orderId);
    
    if (!ticketData.tickets || ticketData.tickets.length === 0) {
      return res.status(500).json({ error: 'Erreur lors de la génération des tickets' });
    }
    
    // Retourner la liste des tickets disponibles
    const ticketsList = ticketData.tickets.map((ticket, index) => ({
      number: index + 1,
      filename: ticket.filename,
      downloadUrl: `/api/payment/ticket/${orderId}/download?ticketNumber=${index + 1}`,
      size: ticket.imageBuffer.length
    }));
    
    res.json({
      orderId: order.id,
      eventTitle: order.event_title,
      totalTickets: order.quantite,
      tickets: ticketsList
    });
    
    console.log(`✅ Liste des ${ticketsList.length} tickets récupérée pour la commande ${orderId}`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération de la liste des tickets:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération de la liste des tickets' });
  }
});

// Endpoint pour obtenir les informations d'un ticket
router.get('/ticket/:orderId/info', async (req, res) => {
  try {
    const { orderId } = req.params;
    
    console.log(`📋 Demande d'informations pour la commande ${orderId}`);
    
    // Récupérer les informations de la commande
    const orderResult = await pool.query(`
      SELECT o.*, u.name as user_name, u.email, u.telephone,
             t.categorie as ticket_category, t.prix as ticket_price,
             e.titre as event_title, e.date as event_date, e.lieu as event_location,
             e.categorie as event_category
      FROM orders o
      JOIN users u ON o.utilisateur_id = u.id
      JOIN tickets t ON o.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE o.id = $1
    `, [orderId]);

    if (orderResult.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    const order = orderResult.rows[0];
    
    // Générer le QR code
    const qrData = `order:${order.id}|user:${order.utilisateur_id}|ticket:${order.ticket_id}|event:${order.event_title}|date:${order.event_date}`;
    const qrCodeUrl = await QRCode.toDataURL(qrData, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    const ticketInfo = {
      orderId: order.id,
      eventTitle: order.event_title,
      eventDate: order.event_date,
      eventLocation: order.event_location,
      eventCategory: order.event_category,
      ticketCategory: order.ticket_category,
      ticketPrice: order.ticket_price,
      quantity: order.quantite,
      total: order.total,
      userName: order.user_name,
      userEmail: order.email,
      orderStatus: order.statut,
      paymentStatus: order.statut === 'confirmed' ? 'paid' : 'pending',
      qrCodeUrl: qrCodeUrl,
      downloadUrl: `/api/payment/ticket/${orderId}/download`
    };
    
    res.json(ticketInfo);
    console.log(`✅ Informations du ticket ${orderId} récupérées`);
    
  } catch (error) {
    console.error('❌ Erreur lors de la récupération des informations du ticket:', error);
    res.status(500).json({ error: 'Erreur lors de la récupération des informations du ticket' });
  }
});

// Endpoint de test pour simuler un webhook YengaPay
router.post('/test-webhook/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    
    console.log(`🧪 Test webhook pour le paiement ${paymentId}`);
    
    // Récupérer le paiement
    const paymentResult = await pool.query(
      'SELECT * FROM payments WHERE id = $1',
      [paymentId]
    );
    
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paiement non trouvé' });
    }
    
    const payment = paymentResult.rows[0];
    console.log(`📋 Paiement trouvé:`, payment);
    
    // Simuler un webhook YengaPay réussi
    const mockWebhookData = {
      reference: payment.reference_paiement,
      status: 'COMPLETED',
      transactionId: `TEST-${Date.now()}`,
      paymentAmount: payment.montant,
      currency: 'XOF'
    };
    
    console.log(`📥 Simulation webhook:`, mockWebhookData);
    
    // Mettre à jour le statut du paiement
    const updateResult = await pool.query(`
      UPDATE payments 
      SET statut = 'completed', 
          transaction_id = $1, 
          date_paiement = NOW(),
          updated_at = NOW(),
          donnees_paiement = jsonb_set(
            donnees_paiement, 
            '{testWebhook}', 
            $2::jsonb
          )
      WHERE id = $3
      RETURNING *
    `, [mockWebhookData.transactionId, JSON.stringify(mockWebhookData), payment.id]);
    
    const updatedPayment = updateResult.rows[0];
    console.log(`✅ Paiement mis à jour:`, updatedPayment.statut);
    
    // Mettre à jour la commande
    await pool.query(`
      UPDATE orders 
      SET statut = 'confirmed', updated_at = NOW()
      WHERE id = $1
    `, [payment.order_id]);
    
    console.log(`✅ Commande ${payment.order_id} confirmée`);
    
    // Envoyer les notifications
    console.log(`📧 Envoi des notifications pour la commande ${payment.order_id}`);
    await sendPaymentNotifications(payment.order_id, 'success');
    console.log(`✅ Notifications envoyées`);
    
    res.json({
      success: true,
      message: 'Test webhook réussi',
      paymentId: updatedPayment.id,
      orderId: payment.order_id,
      status: updatedPayment.statut
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du test webhook:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

// Endpoint de test pour le nouveau paiement
router.post('/test-new-payment', async (req, res) => {
  try {
    console.log('🧪 Test du nouveau paiement ID 7');
    
    // Récupérer le paiement ID 7
    const paymentResult = await pool.query(`
      SELECT p.*, o.statut as order_status
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.id = 7
    `);
    
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Paiement 7 non trouvé' });
    }
    
    const payment = paymentResult.rows[0];
    console.log('✅ Paiement trouvé:', payment.id);
    
    // Mettre à jour le statut du paiement
    await pool.query(`
      UPDATE payments 
      SET statut = 'completed', 
          date_paiement = NOW(),
          updated_at = NOW()
      WHERE id = 7
    `);
    console.log('✅ Statut paiement mis à jour');
    
    // Mettre à jour le statut de la commande
    await pool.query(`
      UPDATE orders 
      SET statut = 'confirmed', 
          updated_at = NOW()
      WHERE id = $1
    `, [payment.order_id]);
    console.log('✅ Statut commande mis à jour');
    
    // Envoyer les notifications
    console.log('📧 Envoi des notifications...');
    await sendPaymentNotifications(payment.order_id, 'success');
    console.log('✅ Notifications envoyées');
    
    res.json({
      success: true,
      message: 'Nouveau paiement traité avec succès',
      paymentId: payment.id,
      orderId: payment.order_id,
      status: 'completed'
    });
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
    res.status(500).json({
      error: error.message,
      success: false
    });
  }
});

module.exports = router; 