const pool = require('./db');

async function debugTicket() {
  try {
    console.log('🔍 Debug génération de tickets');
    
    // Vérifier la structure de la base
    console.log('\n1. Vérification de la structure...');
    
    const tables = ['users', 'events', 'tickets', 'orders', 'payments'];
    for (const table of tables) {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`📊 ${table}: ${result.rows[0].count} enregistrements`);
    }
    
    // Vérifier le paiement ID 6
    console.log('\n2. Vérification du paiement 6...');
    const payment = await pool.query(`
      SELECT p.*, o.*, u.name, u.email
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      JOIN users u ON o.utilisateur_id = u.id
      WHERE p.id = 6
    `);
    
    if (payment.rows.length > 0) {
      const p = payment.rows[0];
      console.log('✅ Paiement trouvé:', {
        payment_id: p.id,
        order_id: p.order_id,
        user: p.name,
        email: p.email,
        payment_status: p.statut,
        order_status: p.statut
      });
    } else {
      console.log('❌ Paiement 6 non trouvé');
    }
    
    // Vérifier les colonnes de la table orders
    console.log('\n3. Vérification des colonnes orders...');
    const columns = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    
    console.log('📋 Colonnes orders:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // Tester une requête simple
    console.log('\n4. Test requête simple...');
    const testQuery = await pool.query(`
      SELECT o.id, o.utilisateur_id, u.name, u.email
      FROM orders o
      JOIN users u ON o.utilisateur_id = u.id
      LIMIT 1
    `);
    
    if (testQuery.rows.length > 0) {
      console.log('✅ Requête simple réussie:', testQuery.rows[0]);
    } else {
      console.log('❌ Aucune commande trouvée');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

debugTicket();