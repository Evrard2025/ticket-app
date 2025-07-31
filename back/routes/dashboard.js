const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

// Middleware d'authentification
const authMiddleware = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token manquant' });
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token invalide' });
    }
    req.user = user;
    next();
  });
};

// Middleware pour vérifier si l'utilisateur est admin
const requireAdmin = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Non autorisé' });
    }

    const result = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    
    if (result.rows.length === 0 || result.rows[0].role !== 'admin') {
      return res.status(403).json({ error: 'Accès refusé - Admin requis' });
    }

    next();
  } catch (error) {
    console.error('Erreur vérification admin:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
};

// Statistiques générales
router.get('/stats', authMiddleware, requireAdmin, async (req, res) => {
  try {
    // Statistiques des événements
    const eventsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_events,
        COUNT(CASE WHEN date > NOW() THEN 1 END) as upcoming_events,
        COUNT(CASE WHEN date < NOW() THEN 1 END) as past_events
      FROM events
    `);

    // Statistiques des commandes
    const ordersStats = await pool.query(`
      SELECT 
        COUNT(*) as total_orders,
        COUNT(CASE WHEN statut = 'completed' THEN 1 END) as completed_orders,
        COUNT(CASE WHEN statut = 'pending' THEN 1 END) as pending_orders,
        COUNT(CASE WHEN statut = 'cancelled' THEN 1 END) as cancelled_orders,
        COALESCE(SUM(CASE WHEN statut = 'completed' THEN total ELSE 0 END), 0) as total_revenue
      FROM orders
    `);

    // Statistiques des utilisateurs
    const usersStats = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_users,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users
      FROM users
    `);

    // Statistiques des tickets
    const ticketsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_tickets,
        COALESCE(SUM(stock), 0) as total_stock,
        COALESCE(SUM(prix * stock), 0) as total_value
      FROM tickets
    `);

    // Statistiques des paiements
    const paymentsStats = await pool.query(`
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN statut = 'success' THEN 1 END) as successful_payments,
        COUNT(CASE WHEN statut = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN statut = 'failed' THEN 1 END) as failed_payments,
        COALESCE(SUM(CASE WHEN statut = 'success' THEN montant ELSE 0 END), 0) as total_amount
      FROM payments
    `);

    res.json({
      events: eventsStats.rows[0],
      orders: ordersStats.rows[0],
      users: usersStats.rows[0],
      tickets: ticketsStats.rows[0],
      payments: paymentsStats.rows[0]
    });
  } catch (error) {
    console.error('Erreur récupération statistiques:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liste des événements avec statistiques
router.get('/events', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        e.*,
        COUNT(t.id) as ticket_types,
        COALESCE(SUM(t.stock), 0) as total_stock,
        COALESCE(SUM(o.quantite), 0) as tickets_sold,
        COALESCE(SUM(CASE WHEN o.statut = 'completed' THEN o.total ELSE 0 END), 0) as revenue
      FROM events e
      LEFT JOIN tickets t ON e.id = t.event_id
      LEFT JOIN orders o ON t.id = o.ticket_id
    `;

    if (search) {
      query += ` WHERE e.titre ILIKE $1 OR e.description ILIKE $1 OR e.lieu ILIKE $1`;
    }

    query += ` GROUP BY e.id ORDER BY e.created_at DESC LIMIT $${search ? 2 : 1} OFFSET $${search ? 3 : 2}`;

    const params = search ? [`%${search}%`, limit, offset] : [limit, offset];
    const result = await pool.query(query, params);

    // Compter le total pour la pagination
    let countQuery = 'SELECT COUNT(*) FROM events';
    if (search) {
      countQuery += ' WHERE titre ILIKE $1 OR description ILIKE $1 OR lieu ILIKE $1';
    }
    const countResult = await pool.query(countQuery, search ? [`%${search}%`] : []);

    res.json({
      events: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération événements:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liste des commandes avec détails
router.get('/orders', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        o.*,
        u.name as user_name,
        u.email as user_email,
        t.categorie as ticket_category,
        t.prix as ticket_price,
        e.titre as event_title,
        e.date as event_date,
        p.statut as payment_status,
        p.methode_paiement
      FROM orders o
      LEFT JOIN users u ON o.utilisateur_id = u.id
      LEFT JOIN tickets t ON o.ticket_id = t.id
      LEFT JOIN events e ON t.event_id = e.id
      LEFT JOIN payments p ON o.id = p.order_id
    `;

    const conditions = [];
    const params = [];

    if (status) {
      conditions.push(`o.statut = $${params.length + 1}`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1} OR e.titre ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Compter le total pour la pagination
    let countQuery = `
      SELECT COUNT(*) FROM orders o
      LEFT JOIN users u ON o.utilisateur_id = u.id
      LEFT JOIN tickets t ON o.ticket_id = t.id
      LEFT JOIN events e ON t.event_id = e.id
    `;

    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }

    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      orders: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération commandes:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Liste des utilisateurs
router.get('/users', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role = '', search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT 
        u.*,
        COUNT(o.id) as total_orders,
        COALESCE(SUM(CASE WHEN o.statut = 'completed' THEN o.total ELSE 0 END), 0) as total_spent
      FROM users u
      LEFT JOIN orders o ON u.id = o.utilisateur_id
    `;

    const conditions = [];
    const params = [];

    if (role) {
      conditions.push(`u.role = $${params.length + 1}`);
      params.push(role);
    }

    if (search) {
      conditions.push(`(u.name ILIKE $${params.length + 1} OR u.email ILIKE $${params.length + 1})`);
      params.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Compter le total pour la pagination
    let countQuery = 'SELECT COUNT(*) FROM users';
    if (conditions.length > 0) {
      countQuery += ` WHERE ${conditions.join(' AND ')}`;
    }
    const countResult = await pool.query(countQuery, params.slice(0, -2));

    res.json({
      users: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(countResult.rows[0].count / limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération utilisateurs:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Statistiques des ventes par période
router.get('/sales-analytics', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    let dateFormat, groupBy;
    switch (period) {
      case 'day':
        dateFormat = 'YYYY-MM-DD';
        groupBy = 'DATE(o.created_at)';
        break;
      case 'week':
        dateFormat = 'YYYY-WW';
        groupBy = 'DATE_TRUNC(\'week\', o.created_at)';
        break;
      case 'month':
      default:
        dateFormat = 'YYYY-MM';
        groupBy = 'DATE_TRUNC(\'month\', o.created_at)';
        break;
    }

    const query = `
      SELECT 
        ${groupBy} as period,
        COUNT(o.id) as orders_count,
        COALESCE(SUM(CASE WHEN o.statut = 'completed' THEN o.total ELSE 0 END), 0) as revenue,
        COALESCE(SUM(CASE WHEN o.statut = 'completed' THEN o.quantite ELSE 0 END), 0) as tickets_sold
      FROM orders o
      WHERE o.created_at >= NOW() - INTERVAL '12 months'
      GROUP BY ${groupBy}
      ORDER BY period DESC
    `;

    const result = await pool.query(query);

    res.json({
      analytics: result.rows,
      period: period
    });
  } catch (error) {
    console.error('Erreur récupération analytics:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Mettre à jour le statut d'une commande
router.put('/orders/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'completed', 'cancelled', 'refunded'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Statut invalide' });
    }

    const result = await pool.query(
      'UPDATE orders SET statut = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Commande non trouvée' });
    }

    res.json({ order: result.rows[0] });
  } catch (error) {
    console.error('Erreur mise à jour commande:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Supprimer un événement
router.delete('/events/:id', authMiddleware, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Vérifier s'il y a des commandes liées
    const ordersCheck = await pool.query(
      'SELECT COUNT(*) FROM orders o JOIN tickets t ON o.ticket_id = t.id WHERE t.event_id = $1',
      [id]
    );

    if (parseInt(ordersCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        error: 'Impossible de supprimer cet événement car il y a des commandes associées' 
      });
    }

    // Supprimer les tickets d'abord
    await pool.query('DELETE FROM tickets WHERE event_id = $1', [id]);
    
    // Puis supprimer l'événement
    const result = await pool.query('DELETE FROM events WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Événement non trouvé' });
    }

    res.json({ message: 'Événement supprimé avec succès' });
  } catch (error) {
    console.error('Erreur suppression événement:', error);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

module.exports = router; 