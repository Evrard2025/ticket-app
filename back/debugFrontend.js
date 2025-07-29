require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Middleware de logging pour voir tous les appels API
app.use((req, res, next) => {
  console.log(`🔍 [${new Date().toISOString()}] ${req.method} ${req.path}`);
  console.log(`   Headers:`, req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    console.log(`   Body:`, req.body);
  }
  if (req.query && Object.keys(req.query).length > 0) {
    console.log(`   Query:`, req.query);
  }
  if (req.params && Object.keys(req.params).length > 0) {
    console.log(`   Params:`, req.params);
  }
  next();
});

// Simuler l'API user-tickets
app.get('/api/orders/user-tickets/:userId', (req, res) => {
  const { userId } = req.params;
  console.log(`🎯 API appelée avec userId: ${userId}`);
  
  // Simuler un délai pour voir le chargement
  setTimeout(() => {
    if (userId === '4') {
      console.log(`✅ Retourne des données pour l'utilisateur ${userId}`);
      res.json([
        {
          id: 4,
          date: new Date().toISOString(),
          total: 150,
          status: 'confirmed',
          items: [
            {
              ticketId: 1,
              eventId: 1,
              eventTitle: 'Événement Test 1',
              eventDescription: 'Description de l\'événement test',
              eventDate: '2025-01-15T19:00:00.000Z',
              eventVenue: 'Lieu 1',
              eventImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=800',
              categoryName: 'VIP',
              price: 150,
              quantity: 1
            }
          ]
        }
      ]);
    } else {
      console.log(`❌ Aucune donnée pour l'utilisateur ${userId}`);
      res.json([]);
    }
  }, 1000); // Délai de 1 seconde pour simuler le chargement
});

// Simuler l'API auth/me
app.get('/api/auth/me', (req, res) => {
  console.log('🔐 API auth/me appelée');
  res.json({
    id: 4,
    name: 'sanon',
    email: 'evrardk0197@gmail.com',
    telephone: '123456789',
    role: 'user'
  });
});

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`🚀 Serveur de débogage démarré sur le port ${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🎯 Testez l'API: http://localhost:${PORT}/api/orders/user-tickets/4`);
});