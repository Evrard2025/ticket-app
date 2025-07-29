const pool = require('./db');
const NotificationService = require('./services/notifications');

async function manualWebhook() {
  try {
    console.log('🔧 Déclenchement manuel du webhook');
    
    // 1. Récupérer le paiement ID 6
    console.log('\n1. Récupération du paiement 6...');
    const paymentResult = await pool.query(`
      SELECT p.*, o.statut as order_status
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.id = 6
    `);
    
    if (paymentResult.rows.length === 0) {
      console.log('❌ Paiement 6 non trouvé');
      return;
    }
    
    const payment = paymentResult.rows[0];
    console.log('✅ Paiement trouvé:', {
      id: payment.id,
      order_id: payment.order_id,
      reference: payment.reference_paiement,
      status: payment.statut
    });
    
    // 2. Mettre à jour le statut du paiement
    console.log('\n2. Mise à jour du statut paiement...');
    await pool.query(`
      UPDATE payments 
      SET statut = 'completed', 
          date_paiement = NOW(),
          updated_at = NOW()
      WHERE id = 6
    `);
    console.log('✅ Statut paiement mis à jour -> completed');
    
    // 3. Mettre à jour le statut de la commande
    console.log('\n3. Mise à jour du statut commande...');
    await pool.query(`
      UPDATE orders 
      SET statut = 'confirmed', 
          updated_at = NOW()
      WHERE id = $1
    `, [payment.order_id]);
    console.log('✅ Statut commande mis à jour -> confirmed');
    
    // 4. Envoyer les notifications
    console.log('\n4. Envoi des notifications...');
    try {
      await NotificationService.sendPaymentSuccessNotification(payment.order_id);
      console.log('✅ Notifications envoyées avec succès');
    } catch (error) {
      console.log('❌ Erreur notifications:', error.message);
    }
    
    // 5. Vérifier les statuts finaux
    console.log('\n5. Vérification des statuts finaux...');
    const finalResult = await pool.query(`
      SELECT p.statut as payment_status, o.statut as order_status
      FROM payments p
      JOIN orders o ON p.order_id = o.id
      WHERE p.id = 6
    `);
    
    const final = finalResult.rows[0];
    console.log('📋 Statuts finaux:', {
      payment: final.payment_status,
      order: final.order_status
    });
    
    console.log('\n✅ Webhook manuel terminé !');
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await pool.end();
  }
}

manualWebhook();