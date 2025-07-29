const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Configuration CORS améliorée
app.use(cors({ 
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173'], 
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());

const routes = require('./routes');
app.use('/api', routes);

// Endpoint de test
app.get('/', (req, res) => {
  res.send('API Ticket - Backend opérationnel');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Serveur backend démarré sur le port ${PORT}`);
}); 