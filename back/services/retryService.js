const pool = require('../db');
const { YENGA_CONFIG, YengaPayUtils } = require('../config/yengapay');
const axios = require('axios');

// Configuration du système de retry
const RETRY_CONFIG = {
  MAX_ATTEMPTS: 3,
  INITIAL_DELAY: 5000, // 5 secondes
  MAX_DELAY: 300000, // 5 minutes
  BACKOFF_MULTIPLIER: 2,
  JITTER_FACTOR: 0.1
};

// Service de retry pour les paiements
const RetryService = {
  // Ajouter un paiement à la file de retry
  async addToRetryQueue(paymentId, reason = 'unknown') {
    try {
      const result = await pool.query(`
        INSERT INTO payment_retries (payment_id, attempt_count, max_attempts, next_retry_at, reason, status)
        VALUES ($1, 0, $2, NOW() + INTERVAL '5 minutes', $3, 'pending')
        ON CONFLICT (payment_id) DO UPDATE SET
          attempt_count = payment_retries.attempt_count + 1,
          next_retry_at = NOW() + INTERVAL '5 minutes',
          reason = $3,
          status = 'pending'
        RETURNING *
      `, [paymentId, RETRY_CONFIG.MAX_ATTEMPTS, reason]);

      console.log(`🔄 Paiement ${paymentId} ajouté à la file de retry (tentative ${result.rows[0].attempt_count})`);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout à la file de retry:', error);
      throw error;
    }
  },

  // Traiter les paiements en attente de retry
  async processRetryQueue() {
    try {
      // Récupérer les paiements prêts pour un retry
      const retryResult = await pool.query(`
        SELECT pr.*, p.*, o.*
        FROM payment_retries pr
        JOIN payments p ON pr.payment_id = p.id
        JOIN orders o ON p.order_id = o.id
        WHERE pr.status = 'pending' 
        AND pr.next_retry_at <= NOW()
        AND pr.attempt_count < pr.max_attempts
        ORDER BY pr.next_retry_at ASC
        LIMIT 10
      `);

      console.log(`🔄 Traitement de ${retryResult.rows.length} paiements en retry`);

      for (const retry of retryResult.rows) {
        await this.processRetry(retry);
      }
    } catch (error) {
      console.error('❌ Erreur lors du traitement de la file de retry:', error);
    }
  },

  // Traiter un retry spécifique
  async processRetry(retry) {
    try {
      console.log(`🔄 Tentative de retry pour le paiement ${retry.payment_id} (tentative ${retry.attempt_count + 1}/${retry.max_attempts})`);

      // Marquer le retry comme en cours
      await pool.query(`
        UPDATE payment_retries 
        SET status = 'processing', last_attempt_at = NOW()
        WHERE payment_id = $1
      `, [retry.payment_id]);

      // Vérifier si le paiement existe toujours
      const paymentResult = await pool.query(`
        SELECT p.*, o.*, t.categorie as ticket_category, e.titre as event_title
        FROM payments p
        JOIN orders o ON p.order_id = o.id
        JOIN tickets t ON o.ticket_id = t.id
        JOIN events e ON t.event_id = e.id
        WHERE p.id = $1
      `, [retry.payment_id]);

      if (paymentResult.rows.length === 0) {
        await this.markRetryAsFailed(retry.payment_id, 'Paiement non trouvé');
        return;
      }

      const payment = paymentResult.rows[0];
      const order = paymentResult.rows[0];
      const event = { titre: payment.event_title };
      const ticket = { categorie: payment.ticket_category };

      // Construire le payload YengaPay
      const payload = YengaPayUtils.buildPaymentPayload(order, event, ticket);
      const apiUrl = YengaPayUtils.buildApiUrl(YENGA_CONFIG.PAYMENT_INTENT_ENDPOINT);

      // Appel à l'API YengaPay
      const response = await axios.post(apiUrl, payload, {
        headers: YengaPayUtils.buildHeaders(),
        timeout: 30000 // 30 secondes de timeout
      });

      // Valider la réponse
      const yengaPayData = YengaPayUtils.validateResponse(response);

      // Mettre à jour le paiement avec la nouvelle réponse
      await pool.query(`
        UPDATE payments 
        SET transaction_id = $1,
            donnees_paiement = jsonb_set(
              donnees_paiement, 
              '{retryData}', 
              $2::jsonb
            ),
            updated_at = NOW()
        WHERE id = $3
      `, [yengaPayData.id, JSON.stringify({
        attempt: retry.attempt_count + 1,
        timestamp: new Date().toISOString(),
        response: yengaPayData
      }), retry.payment_id]);

      // Marquer le retry comme réussi
      await this.markRetryAsSuccess(retry.payment_id);

      console.log(`✅ Retry réussi pour le paiement ${retry.payment_id}`);

    } catch (error) {
      console.error(`❌ Retry échoué pour le paiement ${retry.payment_id}:`, error.message);

      // Calculer le délai pour le prochain retry
      const delay = this.calculateRetryDelay(retry.attempt_count + 1);
      const nextRetryAt = new Date(Date.now() + delay);

      // Marquer le retry comme échoué et programmer le prochain
      await this.markRetryAsFailed(retry.payment_id, error.message, nextRetryAt);
    }
  },

  // Marquer un retry comme réussi
  async markRetryAsSuccess(paymentId) {
    await pool.query(`
      UPDATE payment_retries 
      SET status = 'success', completed_at = NOW()
      WHERE payment_id = $1
    `, [paymentId]);
  },

  // Marquer un retry comme échoué
  async markRetryAsFailed(paymentId, reason, nextRetryAt = null) {
    const updateQuery = nextRetryAt 
      ? `UPDATE payment_retries SET status = 'failed', reason = $2, next_retry_at = $3 WHERE payment_id = $1`
      : `UPDATE payment_retries SET status = 'failed', reason = $2 WHERE payment_id = $1`;
    
    const params = nextRetryAt 
      ? [paymentId, reason, nextRetryAt]
      : [paymentId, reason];

    await pool.query(updateQuery, params);
  },

  // Calculer le délai de retry avec backoff exponentiel et jitter
  calculateRetryDelay(attempt) {
    const baseDelay = RETRY_CONFIG.INITIAL_DELAY * Math.pow(RETRY_CONFIG.BACKOFF_MULTIPLIER, attempt - 1);
    const maxDelay = Math.min(baseDelay, RETRY_CONFIG.MAX_DELAY);
    
    // Ajouter du jitter pour éviter les thundering herds
    const jitter = maxDelay * RETRY_CONFIG.JITTER_FACTOR * Math.random();
    
    return maxDelay + jitter;
  },

  // Obtenir les statistiques de retry
  async getRetryStats() {
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_retries,
        COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_retries,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_retries,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_retries,
        AVG(attempt_count) as avg_attempts
      FROM payment_retries
    `);

    return statsResult.rows[0];
  },

  // Nettoyer les anciens retries
  async cleanupOldRetries(daysToKeep = 30) {
    const result = await pool.query(`
      DELETE FROM payment_retries 
      WHERE created_at < NOW() - INTERVAL '${daysToKeep} days'
      AND status IN ('success', 'failed')
    `);

    console.log(`🧹 ${result.rowCount} anciens retries supprimés`);
    return result.rowCount;
  }
};

module.exports = RetryService;