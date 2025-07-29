const nodemailer = require('nodemailer');
const QRCode = require('qrcode');
const pool = require('../db');
const TicketGenerator = require('./ticketGenerator');

// Configuration du transporteur email
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Service de notifications
const NotificationService = {
  // Envoyer une notification de paiement réussi
  async sendPaymentSuccessNotification(orderId) {
    try {
      console.log(`📧 Début envoi notification succès pour commande ${orderId}`);
      
      // Récupérer les informations de la commande
      const orderResult = await pool.query(`
        SELECT o.*, u.email, u.name, u.telephone, e.titre as event_title, e.date as event_date, e.lieu as event_location,
               t.categorie as ticket_category, t.prix as ticket_price
        FROM orders o
        JOIN users u ON o.utilisateur_id = u.id
        JOIN tickets t ON o.ticket_id = t.id
        JOIN events e ON t.event_id = e.id
        WHERE o.id = $1
      `, [orderId]);

      if (orderResult.rows.length === 0) {
        console.error(`❌ Commande ${orderId} non trouvée dans la base de données`);
        throw new Error('Commande non trouvée');
      }

      const order = orderResult.rows[0];
      console.log(`📋 Commande trouvée:`, {
        id: order.id,
        user: order.name,
        email: order.email,
        event: order.event_title,
        total: order.total
      });
      
      // Générer le ticket avec design personnalisé
      console.log(`🎫 Génération du ticket pour la commande ${orderId}`);
      const ticketData = await TicketGenerator.generateTicket(orderId);
      console.log(`✅ Ticket généré avec succès`);
      
      // Envoyer l'email de confirmation avec le ticket
      console.log(`📧 Envoi de l'email à ${order.email}`);
      await this.sendPaymentSuccessEmail(order, ticketData);
      
      // Envoyer le SMS de confirmation
      console.log(`📱 Envoi du SMS à ${order.telephone}`);
      await this.sendPaymentSuccessSMS(order);
      
      console.log(`✅ Notifications envoyées pour la commande ${orderId}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi des notifications de succès:', error);
      throw error;
    }
  },

  // Envoyer une notification de paiement échoué
  async sendPaymentFailedNotification(orderId) {
    try {
      // Récupérer les informations de la commande
      const orderResult = await pool.query(`
        SELECT o.*, u.email, u.name, u.telephone, e.titre as event_title
        FROM orders o
        JOIN users u ON o.utilisateur_id = u.id
        JOIN tickets t ON o.ticket_id = t.id
        JOIN events e ON t.event_id = e.id
        WHERE o.id = $1
      `, [orderId]);

      if (orderResult.rows.length === 0) {
        throw new Error('Commande non trouvée');
      }

      const order = orderResult.rows[0];
      
      // Envoyer l'email d'échec
      await this.sendPaymentFailedEmail(order);
      
      // Envoyer le SMS d'échec
      await this.sendPaymentFailedSMS(order);
      
      console.log(`✅ Notifications d'échec envoyées pour la commande ${orderId}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi des notifications d\'échec:', error);
      throw error;
    }
  },

  // Envoyer un email de paiement réussi avec ticket personnalisé
  async sendPaymentSuccessEmail(order, ticketData) {
    if (!order.email) {
      console.log('⚠️ Aucune adresse email pour la commande:', order.id);
      return;
    }

    const transporter = createTransporter();
    
    // Préparer les pièces jointes pour tous les tickets
    const attachments = [];
    
    // Ajouter tous les tickets
    if (ticketData.tickets && ticketData.tickets.length > 0) {
      ticketData.tickets.forEach((ticket, index) => {
        attachments.push({
          filename: ticket.filename,
          content: ticket.imageBuffer,
          contentType: 'image/png'
        });
      });
    }
    
    // Ajouter le QR code
    if (ticketData.qrCodeUrl) {
      attachments.push({
        filename: `qr-code-${order.id}.png`,
        content: ticketData.qrCodeUrl.split(",")[1],
        encoding: 'base64'
      });
    }
    
    // Texte du message selon le nombre de tickets
    const ticketCount = ticketData.tickets ? ticketData.tickets.length : 1;
    const ticketText = ticketCount > 1 ? `Vos ${ticketCount} tickets personnalisés` : 'Votre ticket personnalisé';
    const downloadText = ticketCount > 1 ? `Télécharger les ${ticketCount} Tickets` : 'Télécharger le Ticket';
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: order.email,
      subject: `🎫 Vos tickets - ${order.event_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">🎉 Paiement Confirmé !</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">${ticketText} ont été réservés avec succès</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Vos tickets électroniques</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <p style="color: #666; font-size: 14px; margin-bottom: 15px;">
                ${ticketText} sont joints à cet email. Vous pouvez également les télécharger ci-dessous.
              </p>
              
              <div style="text-align: center; margin: 20px 0;">
                <a href="data:image/png;base64,${ticketData.tickets && ticketData.tickets[0] ? ticketData.tickets[0].imageBuffer.toString('base64') : ''}" 
                   download="ticket-${order.id}.png"
                   style="background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                  📥 ${downloadText}
                </a>
              </div>
              
              ${ticketCount > 1 ? `
              <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; border-left: 4px solid #2196f3; margin-top: 15px;">
                <h4 style="margin: 0; color: #1976d2;">📋 Informations importantes</h4>
                <p style="margin: 10px 0; color: #1976d2;">
                  Vous avez acheté <strong>${ticketCount} tickets</strong>. Chaque ticket est numéroté et doit être présenté séparément à l'entrée.
                </p>
              </div>
              ` : ''}
            </div>
            
            <div style="background: #e8f5e8; padding: 15px; border-radius: 8px; border-left: 4px solid #4caf50;">
              <h4 style="margin: 0; color: #2e7d32;">📱 Informations importantes</h4>
              <ul style="margin: 10px 0; padding-left: 20px; color: #2e7d32;">
                <li>Arrivez 30 minutes avant le début de l'événement</li>
                <li>Présentez ${ticketCount > 1 ? 'vos tickets' : 'votre ticket'} sur votre téléphone ou en impression</li>
                <li>Une pièce d'identité peut être demandée</li>
                <li>Ces tickets sont nominatifs et non transférables</li>
                ${ticketCount > 1 ? '<li>Chaque personne doit présenter son propre ticket</li>' : ''}
              </ul>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">
              Merci de votre confiance !<br>
              Pour toute question, contactez-nous à support@ticketflix.com
            </p>
          </div>
        </div>
      `,
      attachments: attachments
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email avec ${ticketCount} ticket(s) personnalisé(s) envoyé à ${order.email}`);
  },

  // Envoyer un email de paiement échoué
  async sendPaymentFailedEmail(order) {
    if (!order.email) {
      console.log('⚠️ Aucune adresse email pour la commande:', order.id);
      return;
    }

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: order.email,
      subject: `❌ Paiement échoué - ${order.event_title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); color: white; padding: 30px; text-align: center;">
            <h1 style="margin: 0; font-size: 28px;">❌ Paiement Échoué</h1>
            <p style="margin: 10px 0 0 0; font-size: 16px;">Votre paiement n'a pas pu être traité</p>
          </div>
          
          <div style="padding: 30px; background: #f8f9fa;">
            <h2 style="color: #333; margin-top: 0;">Détails de la commande</h2>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <h3 style="color: #ff6b6b; margin-top: 0;">${order.event_title}</h3>
              <p><strong>Total:</strong> ${order.total}€</p>
            </div>
            
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107;">
              <h4 style="margin: 0; color: #856404;">🔄 Que faire maintenant ?</h4>
              <ul style="margin: 10px 0; padding-left: 20px; color: #856404;">
                <li>Vérifiez que votre carte bancaire est valide</li>
                <li>Assurez-vous d'avoir suffisamment de fonds</li>
                <li>Réessayez le paiement depuis votre compte</li>
                <li>Contactez votre banque si le problème persiste</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:5173'}/payment" 
                 style="background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Réessayer le paiement
              </a>
            </div>
          </div>
          
          <div style="background: #333; color: white; padding: 20px; text-align: center;">
            <p style="margin: 0; font-size: 14px;">
              Besoin d'aide ? Contactez-nous à support@ticketflix.com
            </p>
          </div>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    console.log(`📧 Email d'échec envoyé à ${order.email}`);
  },

  // Envoyer un SMS de paiement réussi
  async sendPaymentSuccessSMS(order) {
    if (!order.telephone) {
      console.log('⚠️ Aucun numéro de téléphone pour la commande:', order.id);
      return;
    }

    try {
      // Utiliser WhatsApp Web.js si configuré
      const { sendWhatsAppMessage } = require('../whatsappClient');
      
      const message = `🎉 Paiement confirmé !

Événement: ${order.event_title}
Date: ${new Date(order.event_date).toLocaleDateString('fr-FR')}
Lieu: ${order.event_location}
Catégorie: ${order.ticket_category}
Quantité: ${order.quantity}
Total: ${order.total}€

Votre ticket personnalisé a été envoyé par email.
Présentez-le à l'entrée de l'événement.

Merci de votre confiance ! 🎫`;

      await sendWhatsAppMessage(order.telephone, message);
      console.log(`📱 SMS de confirmation envoyé à ${order.telephone}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du SMS:', error);
      // Fallback: utiliser Twilio ou autre service SMS
    }
  },

  // Envoyer un SMS de paiement échoué
  async sendPaymentFailedSMS(order) {
    if (!order.telephone) {
      console.log('⚠️ Aucun numéro de téléphone pour la commande:', order.id);
      return;
    }

    try {
      // Utiliser WhatsApp Web.js si configuré
      const { sendWhatsAppMessage } = require('../whatsappClient');
      
      const message = `❌ Paiement échoué

Événement: ${order.event_title}
Total: ${order.total}€

Votre paiement n'a pas pu être traité.
Vérifiez votre carte bancaire et réessayez.

Besoin d'aide ? Contactez-nous.`;

      await sendWhatsAppMessage(order.telephone, message);
      console.log(`📱 SMS d'échec envoyé à ${order.telephone}`);
      
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi du SMS:', error);
      // Fallback: utiliser Twilio ou autre service SMS
    }
  }
};

module.exports = NotificationService;