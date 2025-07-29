const pool = require('./db');

async function migrateTicketsTable() {
  // Ajoute ou renomme les colonnes pour la compatibilité française
  // Renomme 'category' en 'categorie' si elle existe
  await pool.query(`
    DO $$
    BEGIN
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='category') THEN
        EXECUTE 'ALTER TABLE tickets RENAME COLUMN category TO categorie';
      END IF;
      IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='price') THEN
        EXECUTE 'ALTER TABLE tickets RENAME COLUMN price TO prix';
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='categorie') THEN
        ALTER TABLE tickets ADD COLUMN categorie VARCHAR(100);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='prix') THEN
        ALTER TABLE tickets ADD COLUMN prix NUMERIC(10,2);
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='tickets' AND column_name='stock') THEN
        ALTER TABLE tickets ADD COLUMN stock INTEGER;
      END IF;
    END
    $$;
  `);
}

async function createTables() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      password VARCHAR(255) NOT NULL,
      name VARCHAR(255),
      email VARCHAR(255),
      telephone VARCHAR(255),
      role VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      titre VARCHAR(255) NOT NULL,
      description TEXT,
      date TIMESTAMP NOT NULL,
      image_url TEXT,
      lieu VARCHAR(255),
      categorie VARCHAR(100),
      organisateur VARCHAR(255),
      note VARCHAR(10),
      duree VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id SERIAL PRIMARY KEY,
      event_id INTEGER REFERENCES events(id),
      categorie VARCHAR(100),
      prix NUMERIC(10,2),
      stock INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      utilisateur_id INTEGER REFERENCES users(id),
      ticket_id INTEGER REFERENCES tickets(id),
      quantite INTEGER,
      total NUMERIC(10,2),
      statut VARCHAR(50),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS payments (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id),
      montant NUMERIC(10,2) NOT NULL,
      methode_paiement VARCHAR(50) NOT NULL,
      statut VARCHAR(50) DEFAULT 'pending',
      reference_paiement VARCHAR(255),
      transaction_id VARCHAR(255),
      donnees_paiement JSONB,
      date_paiement TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS payment_retries (
      id SERIAL PRIMARY KEY,
      payment_id INTEGER REFERENCES payments(id) UNIQUE,
      attempt_count INTEGER DEFAULT 0,
      max_attempts INTEGER DEFAULT 3,
      next_retry_at TIMESTAMP,
      last_attempt_at TIMESTAMP,
      completed_at TIMESTAMP,
      reason TEXT,
      status VARCHAR(50) DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
  await migrateTicketsTable();
}

module.exports = { createTables }; 