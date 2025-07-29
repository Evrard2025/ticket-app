const express = require('express');
const pool = require('../db');
const router = express.Router();

// Liste des tickets (optionnel: filtrer par event_id)
router.get('/', async (req, res) => {
  const { event_id } = req.query;
  let result;
  if (event_id) {
    result = await pool.query('SELECT * FROM tickets WHERE event_id = $1', [event_id]);
  } else {
    result = await pool.query('SELECT * FROM tickets');
  }
  // Adapter les noms de colonnes pour le frontend
  const tickets = result.rows.map(t => ({
    id: t.id,
    eventId: t.event_id,
    category: t.categorie,
    price: t.prix,
    stock: t.stock
  }));
  res.json(tickets);
});

// Détail d'un ticket
router.get('/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM tickets WHERE id = $1', [req.params.id]);
  const t = result.rows[0];
  if (!t) return res.status(404).json({ error: 'Ticket non trouvé' });
  const ticket = {
    id: t.id,
    eventId: t.event_id,
    category: t.categorie,
    price: t.prix,
    stock: t.stock
  };
  res.json(ticket);
});

// Création d'un ticket
router.post('/', async (req, res) => {
  const { event_id, categorie, prix, stock } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO tickets (event_id, categorie, prix, stock) VALUES ($1, $2, $3, $4) RETURNING *',
      [event_id, categorie, prix, stock]
    );
    const t = result.rows[0];
    const ticket = {
      id: t.id,
      eventId: t.event_id,
      category: t.categorie,
      price: t.prix,
      stock: t.stock
    };
    res.status(201).json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Modification d'un ticket
router.put('/:id', async (req, res) => {
  const { categorie, prix, stock } = req.body;
  try {
    const result = await pool.query(
      'UPDATE tickets SET categorie=$1, prix=$2, stock=$3, updated_at=NOW() WHERE id=$4 RETURNING *',
      [categorie, prix, stock, req.params.id]
    );
    const t = result.rows[0];
    const ticket = {
      id: t.id,
      eventId: t.event_id,
      category: t.categorie,
      price: t.prix,
      stock: t.stock
    };
    res.json(ticket);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Suppression d'un ticket
router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM tickets WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router; 