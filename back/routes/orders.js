const express = require('express');
const pool = require('../db');
const router = express.Router();

// Liste des commandes avec détails complets (pour les tickets)
router.get('/user-tickets/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Récupérer les commandes confirmées avec les détails des tickets et événements
    const result = await pool.query(`
      SELECT 
        o.id as order_id,
        o.quantite,
        o.total,
        o.statut as order_status,
        o.created_at as order_date,
        t.id as ticket_id,
        t.categorie as ticket_category,
        t.prix as ticket_price,
        e.id as event_id,
        e.titre as event_title,
        e.description as event_description,
        e.date as event_date,
        e.lieu as event_venue,
        e.image_url as event_image
      FROM orders o
      JOIN tickets t ON o.ticket_id = t.id
      JOIN events e ON t.event_id = e.id
      WHERE o.utilisateur_id = $1 
      AND o.statut IN ('confirmed', 'completed', 'paid')
      ORDER BY o.created_at DESC
    `, [userId]);

    // Grouper par commande
    const ordersMap = new Map();
    
    result.rows.forEach(row => {
      const orderId = row.order_id;
      
      if (!ordersMap.has(orderId)) {
        ordersMap.set(orderId, {
          id: orderId,
          date: row.order_date,
          total: parseFloat(row.total),
          status: row.order_status,
          items: []
        });
      }
      
      const order = ordersMap.get(orderId);
      order.items.push({
        ticketId: row.ticket_id,
        eventId: row.event_id,
        eventTitle: row.event_title,
        eventDescription: row.event_description,
        eventDate: row.event_date,
        eventVenue: row.event_venue,
        eventImage: row.event_image,
        categoryName: row.ticket_category,
        price: parseFloat(row.ticket_price),
        quantity: row.quantite
      });
    });

    const orders = Array.from(ordersMap.values());
    
    res.json(orders);
  } catch (err) {
    console.error('Erreur lors de la récupération des tickets:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liste des commandes (optionnel: filtrer par utilisateur_id)
router.get('/', async (req, res) => {
  const { utilisateur_id } = req.query;
  let result;
  if (utilisateur_id) {
    result = await pool.query('SELECT * FROM orders WHERE utilisateur_id = $1', [utilisateur_id]);
  } else {
    result = await pool.query('SELECT * FROM orders');
  }
  // Adapter les noms de colonnes pour le frontend
  const orders = result.rows.map(o => ({
    id: o.id,
    userId: o.utilisateur_id,
    ticketId: o.ticket_id,
    quantity: o.quantite,
    total: o.total,
    status: o.statut
  }));
  res.json(orders);
});

// Détail d'une commande
router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM orders WHERE id = $1', [req.params.id]);
  const o = result.rows[0];
  if (!o) return res.status(404).json({ error: 'Commande non trouvée' });
  const order = {
    id: o.id,
    userId: o.utilisateur_id,
    ticketId: o.ticket_id,
    quantity: o.quantite,
    total: o.total,
    status: o.statut
  };
  res.json(order);
});

// Vérifier le stock disponible pour un ticket
router.get('/check-stock/:ticketId', async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { quantity } = req.query;
    
    // Récupérer le stock total et les commandes confirmées
    const result = await pool.query(`
      SELECT t.stock,
             COALESCE(SUM(o.quantite), 0) as sold_quantity
      FROM tickets t
      LEFT JOIN orders o ON t.id = o.ticket_id AND o.statut IN ('confirmed', 'paid', 'completed')
      WHERE t.id = $1
      GROUP BY t.stock
    `, [ticketId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    const { stock, sold_quantity } = result.rows[0];
    const availableStock = Math.max(0, stock - sold_quantity);
    const requestedQuantity = parseInt(quantity) || 1;
    const canPurchase = availableStock >= requestedQuantity;

    res.json({
      ticketId: parseInt(ticketId),
      totalStock: stock,
      soldQuantity: parseInt(sold_quantity),
      availableStock,
      requestedQuantity,
      canPurchase,
      remainingAfterPurchase: canPurchase ? availableStock - requestedQuantity : availableStock
    });
  } catch (err) {
    console.error('Erreur lors de la vérification du stock:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Création d'une commande avec vérification du stock
router.post('/', async (req, res) => {
  const { utilisateur_id, ticket_id, quantite, total, statut } = req.body;
  
  try {
    // Vérifier le stock disponible
    const stockResult = await pool.query(`
      SELECT t.stock,
             COALESCE(SUM(o.quantite), 0) as sold_quantity
      FROM tickets t
      LEFT JOIN orders o ON t.id = o.ticket_id AND o.statut IN ('confirmed', 'paid', 'completed')
      WHERE t.id = $1
      GROUP BY t.stock
    `, [ticket_id]);

    if (stockResult.rows.length === 0) {
      return res.status(404).json({ error: 'Ticket non trouvé' });
    }

    const { stock, sold_quantity } = stockResult.rows[0];
    const availableStock = Math.max(0, stock - sold_quantity);

    if (availableStock < quantite) {
      return res.status(400).json({ 
        error: 'Stock insuffisant', 
        availableStock, 
        requestedQuantity: quantite 
      });
    }

    // Créer la commande
    const result = await pool.query(
      'INSERT INTO orders (utilisateur_id, ticket_id, quantite, total, statut) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [utilisateur_id, ticket_id, quantite, total, statut || 'pending']
    );
    
    const o = result.rows[0];
    const order = {
      id: o.id,
      userId: o.utilisateur_id,
      ticketId: o.ticket_id,
      quantity: o.quantite,
      total: o.total,
      status: o.statut
    };
    
    res.status(201).json(order);
  } catch (err) {
    console.error('Erreur lors de la création de la commande:', err);
    res.status(400).json({ error: err.message });
  }
});

// Modification d'une commande
router.put('/:id', async (req, res) => {
  const { statut } = req.body;
  try {
    const result = await pool.query(
      'UPDATE orders SET statut=$1::VARCHAR(50), updated_at=NOW() WHERE id=$2 RETURNING *',
      [String(statut), req.params.id]
    );
    const o = result.rows[0];
    const order = {
      id: o.id,
      userId: o.utilisateur_id,
      ticketId: o.ticket_id,
      quantity: o.quantite,
      total: o.total,
      status: o.statut
    };
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Suppression d'une commande
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 