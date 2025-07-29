const app = require('./app');
const { createTables } = require('./models');

async function startServer() {
  await createTables();
  // Le serveur Express démarre déjà dans app.js
}

startServer(); 