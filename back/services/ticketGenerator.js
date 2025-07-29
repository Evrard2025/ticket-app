const QRCode = require('qrcode');
const { createCanvas, loadImage } = require('canvas');
const pool = require('../db');

// Couleurs par catégorie d'événement - Style carte de visite professionnel
const EVENT_COLORS = {
  'Festival': {
    primary: '#FF6B35',
    secondary: '#E55A2B',
    accent: '#FF8A5C',
    background: '#FFFFFF',
    text: '#2C3E50'
  },
  'Concert': {
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    accent: '#A78BFA',
    background: '#FFFFFF',
    text: '#2C3E50'
  },
  'Théâtre': {
    primary: '#10B981',
    secondary: '#059669',
    accent: '#34D399',
    background: '#FFFFFF',
    text: '#2C3E50'
  },
  'Sport': {
    primary: '#EF4444',
    secondary: '#DC2626',
    accent: '#F87171',
    background: '#FFFFFF',
    text: '#2C3E50'
  },
  'Conférence': {
    primary: '#3B82F6',
    secondary: '#2563EB',
    accent: '#60A5FA',
    background: '#FFFFFF',
    text: '#2C3E50'
  },
  'Exposition': {
    primary: '#F59E0B',
    secondary: '#D97706',
    accent: '#FBBF24',
    background: '#FFFFFF',
    text: '#2C3E50'
  },
  'Formation': {
    primary: '#06B6D4',
    secondary: '#0891B2',
    accent: '#22D3EE',
    background: '#FFFFFF',
    text: '#2C3E50'
  },
  'Spectacle': {
    primary: '#EC4899',
    secondary: '#DB2777',
    accent: '#F472B6',
    background: '#FFFFFF',
    text: '#2C3E50'
  },
  'default': {
    primary: '#667eea',
    secondary: '#5A67D8',
    accent: '#818CF8',
    background: '#FFFFFF',
    text: '#2C3E50'
  }
};

// Service de génération de tickets
const TicketGenerator = {
  // Générer un ticket avec design personnalisé
  async generateTicket(orderId) {
    try {
      console.log(`🎫 Début génération ticket pour commande ${orderId}`);
      
      // Récupérer les informations complètes de la commande
      const orderResult = await pool.query(`
        SELECT o.*, u.name as user_name, u.email, u.telephone,
               t.categorie as ticket_category, t.prix as ticket_price,
               e.titre as event_title, e.date as event_date, e.lieu as event_location,
               e.description as event_description, e.image_url as event_image,
               e.categorie as event_category
        FROM orders o
        JOIN users u ON o.utilisateur_id = u.id
        JOIN tickets t ON o.ticket_id = t.id
        JOIN events e ON t.event_id = e.id
        WHERE o.id = $1
      `, [orderId]);

      if (orderResult.rows.length === 0) {
        console.error(`❌ Commande ${orderId} non trouvée pour génération de ticket`);
        throw new Error('Commande non trouvée');
      }

      const order = orderResult.rows[0];
      console.log(`📋 Données commande récupérées:`, {
        id: order.id,
        user: order.user_name,
        event: order.event_title,
        category: order.event_category,
        ticket: order.ticket_category,
        quantity: order.quantite
      });
      
      // Déterminer les couleurs selon la catégorie d'événement
      const colors = EVENT_COLORS[order.event_category] || EVENT_COLORS.default;
      console.log(`🎨 Couleurs utilisées pour ${order.event_category}:`, colors);
      
      // Générer plusieurs tickets selon la quantité
      const tickets = [];
      const qrCodeUrl = await QRCode.toDataURL(`order:${order.id}|user:${order.utilisateur_id}|ticket:${order.ticket_id}|event:${order.event_title}|date:${order.event_date}`, {
        width: 200,
        margin: 2,
        color: {
          dark: colors.primary,
          light: '#000000'
        }
      });
      
      console.log(`✅ QR code généré`);
      console.log(`🎫 Génération de ${order.quantite} tickets...`);
      
      // Générer un ticket pour chaque billet acheté
      for (let i = 1; i <= order.quantite; i++) {
        console.log(`📄 Génération du ticket ${i}/${order.quantite}`);
        
        // Créer une copie de l'ordre avec un numéro de ticket unique
        const ticketOrder = {
          ...order,
          ticket_number: i,
          total_tickets: order.quantite
        };
        
        const ticketImageBuffer = await this.generateTicketImage(ticketOrder, qrCodeUrl, colors);
        
        tickets.push({
          number: i,
          imageBuffer: ticketImageBuffer,
          filename: `ticket-${order.id}-${i}.png`
        });
      }
      
      console.log(`✅ ${tickets.length} tickets générés avec succès pour la commande ${orderId}`);
      
      return {
        qrCodeUrl,
        tickets: tickets,
        html: this.generateTicketHTML(order, qrCodeUrl, colors) // Garder HTML comme fallback
      };
      
    } catch (error) {
      console.error(`❌ Erreur lors de la génération du ticket:`, error);
      throw error;
    }
  },

  // Générer le HTML du ticket
  generateTicketHTML(order, qrCodeUrl, colors) {
    const eventDate = new Date(order.event_date);
    const formattedDate = eventDate.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = eventDate.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    return `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ticket - ${order.event_title}</title>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
        <style>
          ${this.generateTicketCSS(colors)}
        </style>
      </head>
      <body>
        <div class="ticket-container">
          <!-- En-tête du ticket -->
          <div class="ticket-header">
            <div class="ticket-logo">
              <div class="logo-icon">🎫</div>
              <div class="logo-text">TicketFlix</div>
            </div>
            <div class="ticket-status">
              <div class="status-badge">CONFIRMÉ</div>
            </div>
          </div>

          <!-- Informations de l'événement -->
          <div class="event-section">
            <div class="event-image">
              <img src="${order.event_image || 'https://via.placeholder.com/300x200/667eea/ffffff?text=Event'}" alt="${order.event_title}">
            </div>
            <div class="event-info">
              <h1 class="event-title">${order.event_title}</h1>
              <div class="event-details">
                <div class="detail-item">
                  <span class="detail-icon">📅</span>
                  <span class="detail-text">${formattedDate} à ${formattedTime}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">📍</span>
                  <span class="detail-text">${order.event_location}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-icon">🎭</span>
                  <span class="detail-text">${order.ticket_category}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Lignes décoratives -->
          <div class="decorative-lines">
            <div class="line"></div>
            <div class="line"></div>
            <div class="line"></div>
          </div>

          <!-- Informations du ticket -->
          <div class="ticket-details">
            <div class="detail-row">
              <span class="detail-label">Numéro de commande:</span>
              <span class="detail-value">#${order.id.toString().padStart(6, '0')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Nom:</span>
              <span class="detail-value">${order.user_name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Quantité:</span>
              <span class="detail-value">${order.quantity}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Prix unitaire:</span>
              <span class="detail-value">${order.ticket_price}€</span>
            </div>
            <div class="detail-row total-row">
              <span class="detail-label">Total:</span>
              <span class="detail-value">${order.total}€</span>
            </div>
          </div>

          <!-- QR Code -->
          <div class="qr-section">
            <div class="qr-container">
              <img src="${qrCodeUrl}" alt="QR Code" class="qr-code">
              <div class="qr-text">Présentez ce QR code à l'entrée</div>
            </div>
          </div>

          <!-- Informations importantes -->
          <div class="important-info">
            <h3>📋 Informations importantes</h3>
            <ul>
              <li>Arrivez 30 minutes avant le début de l'événement</li>
              <li>Présentez ce ticket sur votre téléphone ou en impression</li>
              <li>Une pièce d'identité peut être demandée</li>
              <li>Ce ticket est nominatif et non transférable</li>
            </ul>
          </div>

          <!-- Pied de page -->
          <div class="ticket-footer">
            <div class="footer-text">
              <p>Merci de votre confiance !</p>
              <p>Pour toute question: support@ticketflix.com</p>
            </div>
            <div class="footer-barcode">
              <div class="barcode"></div>
              <div class="barcode-text">${order.id.toString().padStart(12, '0')}</div>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;
  },

  // Générer l'image du ticket avec Canvas - Style carte de visite
  async generateTicketImage(order, qrCodeUrl, colors) {
    const canvas = createCanvas(800, 500);
    const ctx = canvas.getContext('2d');
    
    // Fond blanc avec coins arrondis
    ctx.fillStyle = colors.background;
    this.drawRoundedRect(ctx, 0, 0, 800, 500, 20);
    ctx.fill();
    
    // Bordure colorée
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 3;
    this.drawRoundedRect(ctx, 2, 2, 796, 496, 20);
    ctx.stroke();
    
    // Éléments décoratifs subtils
    this.drawDecorativeElements(ctx, colors);
    
    // QR Code à gauche (plus grand)
    const qrImage = await loadImage(qrCodeUrl);
    ctx.drawImage(qrImage, 50, 80, 250, 250);
    
    // Zone d'informations à droite
    const infoX = 350;
    const infoY = 80;
    
    // Logo/Titre principal
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 28px Arial';
    ctx.textAlign = 'left';
    ctx.fillText('TICKETFLIX', infoX, infoY);
    
    // Tagline
    ctx.fillStyle = colors.text;
    ctx.font = 'italic 14px Arial';
    ctx.fillText('Votre billet électronique', infoX, infoY + 25);
    
    // Numéro du ticket (si plusieurs tickets)
    if (order.ticket_number && order.total_tickets > 1) {
      ctx.fillStyle = colors.accent;
      ctx.font = 'bold 16px Arial';
      ctx.fillText(`Ticket ${order.ticket_number} sur ${order.total_tickets}`, infoX, infoY + 45);
    }
    
    // Ligne de séparation
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 1;
    const separatorY = order.ticket_number && order.total_tickets > 1 ? infoY + 55 : infoY + 40;
    ctx.beginPath();
    ctx.moveTo(infoX, separatorY);
    ctx.lineTo(infoX + 400, separatorY);
    ctx.stroke();
    
    // Informations de l'événement
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 20px Arial';
    const eventY = separatorY + 30;
    ctx.fillText(order.event_title, infoX, eventY);
    
    // Catégorie avec badge
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 16px Arial';
    ctx.fillText(order.event_category, infoX, eventY + 30);
    
    // Informations détaillées avec icônes
    const detailsY = eventY + 70;
    const lineHeight = 25;
    
    // Date
    ctx.fillStyle = colors.primary;
    ctx.font = '16px Arial';
    ctx.fillText('📅', infoX, detailsY);
    ctx.fillStyle = colors.text;
    ctx.fillText(this.formatDate(order.event_date), infoX + 25, detailsY);
    
    // Lieu
    ctx.fillStyle = colors.primary;
    ctx.fillText('📍', infoX, detailsY + lineHeight);
    ctx.fillStyle = colors.text;
    ctx.fillText(order.event_location, infoX + 25, detailsY + lineHeight);
    
    // Utilisateur
    ctx.fillStyle = colors.primary;
    ctx.fillText('👤', infoX, detailsY + lineHeight * 2);
    ctx.fillStyle = colors.text;
    ctx.fillText(order.user_name, infoX + 25, detailsY + lineHeight * 2);
    
    // Catégorie de ticket
    ctx.fillStyle = colors.primary;
    ctx.fillText('🎫', infoX, detailsY + lineHeight * 3);
    ctx.fillStyle = colors.text;
    ctx.fillText(order.ticket_category, infoX + 25, detailsY + lineHeight * 3);
    
    // Prix par ticket
    ctx.fillStyle = colors.primary;
    ctx.fillText('💰', infoX, detailsY + lineHeight * 4);
    ctx.fillStyle = colors.text;
    ctx.fillText(`${order.ticket_price} FCFA par ticket`, infoX + 25, detailsY + lineHeight * 4);
    
    // Total en bas à droite
    ctx.fillStyle = colors.primary;
    ctx.font = 'bold 18px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`TOTAL: ${order.total} FCFA`, infoX + 400, detailsY + lineHeight * 5);
    
    // Code de référence en bas
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`Référence: ${order.id}`, 400, 450);
    
    // Instructions de scan
    ctx.fillStyle = colors.text;
    ctx.font = '12px Arial';
    ctx.fillText('Scannez le QR Code à l\'entrée', 400, 470);
    
    return canvas.toBuffer('image/png');
  },

  // Dessiner un rectangle avec coins arrondis
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  },

  // Dessiner des éléments décoratifs subtils
  drawDecorativeElements(ctx, colors) {
    // Formes ondulées subtiles
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    
    // Forme ondulée en haut à gauche
    ctx.beginPath();
    ctx.moveTo(0, 50);
    ctx.quadraticCurveTo(100, 30, 200, 50);
    ctx.quadraticCurveTo(300, 70, 400, 50);
    ctx.stroke();
    
    // Forme ondulée en bas à droite
    ctx.beginPath();
    ctx.moveTo(400, 450);
    ctx.quadraticCurveTo(500, 430, 600, 450);
    ctx.quadraticCurveTo(700, 470, 800, 450);
    ctx.stroke();
    
    ctx.globalAlpha = 1;
  },

  // Formater la date
  formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  // Générer le CSS du ticket
  generateTicketCSS(colors) {
    return `
      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter', sans-serif;
        background: ${colors.background};
        color: white;
        min-height: 100vh;
        display: flex;
        justify-content: center;
        align-items: center;
        padding: 20px;
      }

      .ticket-container {
        width: 100%;
        max-width: 400px;
        background: linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%);
        border-radius: 20px;
        overflow: hidden;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        position: relative;
      }

      .ticket-container::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.1) 50%, transparent 70%);
        pointer-events: none;
      }

      .ticket-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.2);
      }

      .ticket-logo {
        display: flex;
        align-items: center;
        gap: 10px;
      }

      .logo-icon {
        font-size: 24px;
      }

      .logo-text {
        font-weight: 700;
        font-size: 18px;
        letter-spacing: 1px;
      }

      .status-badge {
        background: ${colors.accent};
        color: ${colors.background};
        padding: 8px 16px;
        border-radius: 20px;
        font-weight: 600;
        font-size: 12px;
        letter-spacing: 0.5px;
      }

      .event-section {
        padding: 20px;
      }

      .event-image {
        width: 100%;
        height: 150px;
        border-radius: 12px;
        overflow: hidden;
        margin-bottom: 15px;
      }

      .event-image img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .event-title {
        font-size: 24px;
        font-weight: 700;
        margin-bottom: 15px;
        line-height: 1.2;
      }

      .event-details {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .detail-item {
        display: flex;
        align-items: center;
        gap: 10px;
        font-size: 14px;
      }

      .detail-icon {
        font-size: 16px;
        width: 20px;
        text-align: center;
      }

      .decorative-lines {
        display: flex;
        justify-content: center;
        gap: 8px;
        padding: 15px 20px;
        background: rgba(0, 0, 0, 0.1);
      }

      .line {
        width: 40px;
        height: 3px;
        background: ${colors.accent};
        border-radius: 2px;
      }

      .ticket-details {
        padding: 20px;
        background: rgba(0, 0, 0, 0.1);
      }

      .detail-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }

      .detail-row:last-child {
        border-bottom: none;
      }

      .detail-label {
        font-size: 14px;
        opacity: 0.8;
      }

      .detail-value {
        font-weight: 600;
        font-size: 14px;
      }

      .total-row {
        margin-top: 10px;
        padding-top: 15px;
        border-top: 2px solid ${colors.accent};
        font-size: 16px;
        font-weight: 700;
      }

      .qr-section {
        padding: 20px;
        text-align: center;
        background: rgba(0, 0, 0, 0.2);
      }

      .qr-container {
        display: inline-block;
        padding: 20px;
        background: white;
        border-radius: 12px;
        box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
      }

      .qr-code {
        width: 120px;
        height: 120px;
        margin-bottom: 10px;
      }

      .qr-text {
        color: ${colors.background};
        font-size: 12px;
        font-weight: 500;
      }

      .important-info {
        padding: 20px;
        background: rgba(0, 0, 0, 0.1);
      }

      .important-info h3 {
        margin-bottom: 10px;
        font-size: 16px;
        color: ${colors.accent};
      }

      .important-info ul {
        list-style: none;
        padding-left: 0;
      }

      .important-info li {
        padding: 5px 0;
        font-size: 13px;
        opacity: 0.9;
        position: relative;
        padding-left: 20px;
      }

      .important-info li::before {
        content: '•';
        position: absolute;
        left: 0;
        color: ${colors.accent};
        font-weight: bold;
      }

      .ticket-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px;
        background: rgba(0, 0, 0, 0.3);
      }

      .footer-text {
        font-size: 12px;
        opacity: 0.8;
        line-height: 1.4;
      }

      .footer-barcode {
        text-align: center;
      }

      .barcode {
        width: 80px;
        height: 40px;
        background: repeating-linear-gradient(
          90deg,
          white 0px,
          white 2px,
          transparent 2px,
          transparent 4px
        );
        margin-bottom: 5px;
      }

      .barcode-text {
        font-size: 10px;
        opacity: 0.7;
        font-family: monospace;
      }

      @media print {
        body {
          background: white;
          color: black;
        }
        
        .ticket-container {
          box-shadow: none;
          border: 2px solid #ccc;
        }
      }
    `;
  },

  // Générer un ticket en PDF (optionnel)
  async generateTicketPDF(orderId) {
    // Cette fonction peut être implémentée plus tard avec une librairie comme puppeteer
    // pour convertir le HTML en PDF
    throw new Error('Génération PDF non implémentée');
  }
};

module.exports = TicketGenerator;