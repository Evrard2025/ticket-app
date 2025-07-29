require('dotenv').config();
const pool = require('./db');

async function debugRealAPI() {
  try {
    console.log('🔧 Débogage de l\'API réelle pour l\'utilisateur 4');
    
    const userId = 4;
    
    // 1. Vérifier la requête SQL
    console.log('\n1. Requête SQL directe:');
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
    
    console.log(`📊 ${result.rows.length} lignes trouvées`);
    
    // 2. Simuler exactement le traitement de l'API
    console.log('\n2. Traitement de l\'API (comme dans routes/orders.js):');
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
    
    console.log(`📦 ${orders.length} commandes groupées:`);
    console.log('📋 Données finales:', JSON.stringify(orders, null, 2));
    
    // 3. Vérifier si les données sont valides
    console.log('\n3. Validation des données:');
    orders.forEach((order, index) => {
      console.log(`\n   Commande ${index + 1}:`);
      console.log(`   - ID: ${order.id}`);
      console.log(`   - Date: ${order.date}`);
      console.log(`   - Total: ${order.total}`);
      console.log(`   - Status: ${order.status}`);
      console.log(`   - Items: ${order.items.length}`);
      
      order.items.forEach((item, itemIndex) => {
        console.log(`     Item ${itemIndex + 1}:`);
        console.log(`       - Event: ${item.eventTitle}`);
        console.log(`       - Category: ${item.categoryName}`);
        console.log(`       - Price: ${item.price}`);
        console.log(`       - Quantity: ${item.quantity}`);
      });
    });
    
    // 4. Test de sérialisation JSON
    console.log('\n4. Test de sérialisation JSON:');
    try {
      const jsonString = JSON.stringify(orders);
      console.log(`✅ JSON valide - Taille: ${jsonString.length} caractères`);
      console.log('📋 JSON:', jsonString);
      
      // Test de désérialisation
      const parsed = JSON.parse(jsonString);
      console.log(`✅ Désérialisation réussie - ${parsed.length} commandes`);
    } catch (error) {
      console.error('❌ Erreur JSON:', error);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

debugRealAPI();