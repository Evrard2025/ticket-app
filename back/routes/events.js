const express = require('express');
const pool = require('../db');
const router = express.Router();

// Liste des événements
router.get('/', async (req, res) => {
  try {
    const { minRating, startDate, endDate, sort, limit, category } = req.query;
    
    // Construire la requête SQL de base
    let query = 'SELECT * FROM events WHERE 1=1';
    const params = [];
    let paramIndex = 1;

    // Filtre par note minimale
    if (minRating) {
      query += ` AND (note IS NOT NULL AND CAST(note AS DECIMAL) >= $${paramIndex})`;
      params.push(parseFloat(minRating));
      paramIndex++;
    }

    // Filtre par date de début
    if (startDate) {
      query += ` AND date >= $${paramIndex}`;
      params.push(startDate);
      paramIndex++;
    }

    // Filtre par date de fin
    if (endDate) {
      query += ` AND date <= $${paramIndex}`;
      params.push(endDate);
      paramIndex++;
    }

    // Filtre par catégorie
    if (category) {
      query += ` AND categorie = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Tri
    if (sort === 'date') {
      query += ' ORDER BY date ASC';
    } else if (sort === 'rating') {
      query += ' ORDER BY CAST(note AS DECIMAL) DESC';
    } else {
      query += ' ORDER BY date DESC';
    }

    // Limite
    if (limit) {
      query += ` LIMIT $${paramIndex}`;
      params.push(parseInt(limit));
    }

    const result = await pool.query(query, params);
    
    // Adapter les noms de colonnes pour le frontend et ajouter les catégories
    const events = await Promise.all(result.rows.map(async (e) => {
      // Récupérer les tickets pour cet événement
      const ticketsResult = await pool.query(`
        SELECT t.*, 
               COALESCE(t.stock - COALESCE(SUM(o.quantite), 0), t.stock) as available_stock
        FROM tickets t
        LEFT JOIN orders o ON t.id = o.ticket_id AND o.statut IN ('confirmed', 'paid', 'completed')
        WHERE t.event_id = $1
        GROUP BY t.id, t.stock
      `, [e.id]);

      return {
        id: e.id,
        title: e.titre,
        description: e.description,
        imageUrl: e.image_url,
        date: e.date,
        venue: e.lieu,
        category: e.categorie,
        organizer: e.organisateur,
        year: e.date ? new Date(e.date).getFullYear() : null,
        rating: e.note || '4.0',
        duration: e.duree || '2 heures',
        categories: ticketsResult.rows.map(t => ({
          id: t.id,
          name: t.categorie,
          price: t.prix,
          description: `${t.categorie} - ${t.prix} FCFA`,
          availableCount: Math.max(0, parseInt(t.available_stock) || 0)
        }))
      };
    }));

    res.json(events);
  } catch (err) {
    console.error('Erreur lors de la récupération des événements:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Détail d'un événement avec ses tickets et stock
router.get('/:id', async (req, res) => {
  try {
    // Récupérer l'événement
    const eventResult = await pool.query('SELECT * FROM events WHERE id = $1', [req.params.id]);
    const e = eventResult.rows[0];
    if (!e) return res.status(404).json({ error: 'Événement non trouvé' });

    // Récupérer les tickets avec leur stock disponible
    const ticketsResult = await pool.query(`
      SELECT t.*, 
             COALESCE(t.stock - COALESCE(SUM(o.quantite), 0), t.stock) as available_stock
      FROM tickets t
      LEFT JOIN orders o ON t.id = o.ticket_id AND o.statut IN ('confirmed', 'paid', 'completed')
      WHERE t.event_id = $1
      GROUP BY t.id, t.stock
    `, [req.params.id]);

    const event = {
      id: e.id,
      title: e.titre,
      description: e.description,
      imageUrl: e.image_url,
      date: e.date,
      venue: e.lieu,
      category: e.categorie,
      organizer: e.organisateur,
      year: e.date ? new Date(e.date).getFullYear() : null,
      rating: e.note,
      duration: e.duree,
      categories: ticketsResult.rows.map(t => ({
        id: t.id,
        name: t.categorie,
        price: t.prix,
        description: `${t.categorie} - ${t.prix} FCFA`,
        availableCount: Math.max(0, parseInt(t.available_stock) || 0),
        totalStock: t.stock
      }))
    };
    res.json(event);
  } catch (err) {
    console.error('Erreur lors de la récupération de l\'événement:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Route pour récupérer le stock en temps réel d'un événement
router.get('/:id/stock', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.id, t.categorie, t.prix, t.stock,
             COALESCE(t.stock - COALESCE(SUM(o.quantite), 0), t.stock) as available_stock
      FROM tickets t
      LEFT JOIN orders o ON t.id = o.ticket_id AND o.statut IN ('confirmed', 'paid', 'completed')
      WHERE t.event_id = $1
      GROUP BY t.id, t.stock
    `, [req.params.id]);

    const stock = result.rows.map(t => ({
      id: t.id,
      category: t.categorie,
      price: t.prix,
      totalStock: t.stock,
      availableStock: Math.max(0, parseInt(t.available_stock) || 0)
    }));

    res.json(stock);
  } catch (err) {
    console.error('Erreur lors de la récupération du stock:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});

// Création d'un événement
router.post('/', async (req, res) => {
  const { titre, description, date, image_url, lieu, categorie, organisateur, note, duree } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO events (titre, description, date, image_url, lieu, categorie, organisateur, note, duree) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [titre, description, date, image_url, lieu, categorie, organisateur, note, duree]
    );
    const e = result.rows[0];
    const event = {
      id: e.id,
      title: e.titre,
      description: e.description,
      imageUrl: e.image_url,
      date: e.date,
      venue: e.lieu,
      category: e.categorie,
      organizer: e.organisateur,
      year: e.date ? new Date(e.date).getFullYear() : null,
      rating: e.note,
      duration: e.duree
    };
    res.status(201).json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Modification d'un événement
router.put('/:id', async (req, res) => {
  const { titre, description, date, image_url, lieu, categorie, organisateur, note, duree } = req.body;
  try {
    const result = await pool.query(
      'UPDATE events SET titre=$1, description=$2, date=$3, image_url=$4, lieu=$5, categorie=$6, organisateur=$7, note=$8, duree=$9, updated_at=NOW() WHERE id=$10 RETURNING *',
      [titre, description, date, image_url, lieu, categorie, organisateur, note, duree, req.params.id]
    );
    const e = result.rows[0];
    const event = {
      id: e.id,
      title: e.titre,
      description: e.description,
      imageUrl: e.image_url,
      date: e.date,
      venue: e.lieu,
      category: e.categorie,
      organizer: e.organisateur,
      year: e.date ? new Date(e.date).getFullYear() : null,
      rating: e.note,
      duration: e.duree
    };
    res.json(event);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Suppression d'un événement
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM events WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 