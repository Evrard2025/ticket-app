# Système de Paiement - Documentation

## Vue d'ensemble

Le système de paiement permet de suivre et gérer les paiements pour les commandes de tickets. Il inclut la création, le traitement et le suivi des paiements avec différentes méthodes de paiement, y compris l'intégration avec **YengaPay**.

## Structure de la base de données

### Table `payments`

```sql
CREATE TABLE payments (
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
```

### Champs

- `id` : Identifiant unique du paiement
- `order_id` : Référence vers la commande
- `montant` : Montant du paiement
- `methode_paiement` : Méthode utilisée (carte_credit, yengapay, etc.)
- `statut` : Statut du paiement (pending, completed, failed, cancelled)
- `reference_paiement` : Référence interne du paiement
- `transaction_id` : ID de transaction externe
- `donnees_paiement` : Données JSON du paiement (carte, YengaPay, etc.)
- `date_paiement` : Date de traitement du paiement

## Routes API

### 1. Liste des paiements

**GET** `/api/payment`

**Paramètres de requête :**
- `order_id` (optionnel) : Filtrer par commande

**Réponse :**
```json
[
  {
    "id": 1,
    "orderId": 1,
    "amount": 150.00,
    "paymentMethod": "yengapay",
    "status": "completed",
    "paymentReference": "PAY-1705123456789-1",
    "transactionId": "TXN-789",
    "paymentData": {...},
    "paymentDate": "2025-01-15T10:30:00Z",
    "orderTotal": 150.00,
    "orderStatus": "confirmed",
    "userName": "John Doe",
    "userEmail": "john@example.com",
    "ticketCategory": "VIP",
    "ticketPrice": 75.00,
    "eventTitle": "Concert Rock",
    "createdAt": "2025-01-15T10:25:00Z",
    "updatedAt": "2025-01-15T10:30:00Z"
  }
]
```

### 2. Détail d'un paiement

**GET** `/api/payment/:id`

**Réponse :** Même structure que ci-dessus pour un seul paiement

### 3. Création d'un paiement standard

**POST** `/api/payment`

**Corps de la requête :**
```json
{
  "order_id": 1,
  "montant": 150.00,
  "methode_paiement": "carte_credit",
  "reference_paiement": "PAY-123456",
  "transaction_id": null,
  "donnees_paiement": {
    "cardType": "visa",
    "last4": "1234",
    "expiryMonth": "12",
    "expiryYear": "2025"
  }
}
```

### 4. Création d'un paiement YengaPay

**POST** `/api/payment/yengapay`

**Corps de la requête :**
```json
{
  "order_id": 1
}
```

**Réponse :**
```json
{
  "id": 1,
  "orderId": 1,
  "amount": 150.00,
  "paymentMethod": "yengapay",
  "status": "pending",
  "paymentReference": "PAY-1705123456789-1",
  "transactionId": null,
  "paymentData": {
    "yengapayResponse": {
      "paymentUrl": "https://yengapay.com/pay/...",
      "transactionId": "TXN-123",
      "status": "pending"
    },
    "paymentIntent": "61819",
    "groupId": "10315194"
  },
  "yengapayData": {
    "paymentUrl": "https://yengapay.com/pay/...",
    "transactionId": "TXN-123",
    "status": "pending"
  },
  "createdAt": "2025-01-15T10:25:00Z",
  "updatedAt": "2025-01-15T10:25:00Z"
}
```

### 5. Webhook YengaPay

**POST** `/api/payment/yengapay/webhook`

**Corps de la requête (exemple) :**
```json
{
  "reference": "PAY-1705123456789-1",
  "status": "completed",
  "transactionId": "TXN-123",
  "amount": 150.00,
  "paymentMethod": "mobile_money"
}
```

**Actions automatiques :**
- Met à jour le statut du paiement
- Si `status = "completed"`, `"paid"` ou `"success"` : Met à jour la commande en `"confirmed"`
- Si `status = "failed"`, `"cancelled"` ou `"error"` : Le stock reste disponible

### 6. Traitement d'un paiement

**POST** `/api/payment/process/:id`

**Corps de la requête :**
```json
{
  "status": "completed",
  "transaction_id": "TXN-789"
}
```

### 7. Mise à jour du statut

**PUT** `/api/payment/:id/status`

**Corps de la requête :**
```json
{
  "status": "completed"
}
```

### 8. Suppression d'un paiement

**DELETE** `/api/payment/:id`

## Configuration YengaPay

### Variables d'environnement

```bash
YENGA_API_KEY=FY2JesSN7qENbWoKfERlIcIvtfoBCjFl
YENGA_GROUP_ID=10315194
YENGA_PAYMENT_INTENT_ID=61819
YENGA_WEBHOOK_SECRET=your-webhook-secret
```

### Configuration par défaut

```javascript
const YENGA_CONFIG = {
  API_KEY: 'FY2JesSN7qENbWoKfERlIcIvtfoBCjFl',
  GROUP_ID: '10315194',
  PAYMENT_INTENT_ID: '61819',
  BASE_URL: 'https://api.yengapay.com/api/v1'
};
```

## Statuts de paiement

- `pending` : En attente de traitement
- `completed` : Paiement réussi
- `paid` : Paiement réussi (synonyme)
- `failed` : Paiement échoué
- `cancelled` : Paiement annulé

## Méthodes de paiement

- `carte_credit` : Carte de crédit
- `carte_debit` : Carte de débit
- `paypal` : PayPal
- `yengapay` : YengaPay (Mobile Money, Cartes, etc.)
- `mobile_money` : Paiement mobile
- `especes` : Paiement en espèces
- `virement` : Virement bancaire

## Intégration YengaPay

### Flux de paiement

1. **Création de commande** : L'utilisateur crée une commande
2. **Initiation YengaPay** : Appel à `/api/payment/yengapay` avec l'ID de commande
3. **Redirection** : L'utilisateur est redirigé vers l'URL de paiement YengaPay
4. **Paiement** : L'utilisateur effectue le paiement sur YengaPay
5. **Webhook** : YengaPay notifie le système via le webhook
6. **Confirmation** : La commande est confirmée et le stock mis à jour

### Payload YengaPay

```javascript
{
  paymentAmount: 150.00,
  reference: "PAY-1705123456789-1",
  articles: [{
    title: "Concert Rock",
    description: "Paiement pour VIP - Concert Rock (2 ticket(s))",
    pictures: ["https://example.com/image.jpg"],
    price: 150.00
  }]
}
```

### Webhook YengaPay

Le webhook reçoit les notifications de statut de paiement et met automatiquement à jour :
- Le statut du paiement
- Le statut de la commande (si réussi)
- Le stock disponible

## Intégration avec le stock

Le système de paiement est intégré avec la gestion du stock :

1. **Création de commande** : Vérifie le stock disponible
2. **Paiement réussi** : Met à jour le statut de la commande en `"confirmed"`
3. **Calcul du stock** : Se base sur les commandes avec statut `"confirmed"`, `"paid"`, `"completed"`
4. **Paiement échoué** : Le stock reste disponible

## Exemple d'utilisation

### Paiement standard

```javascript
// 1. Créer une commande
const order = await axios.post('/api/orders', {
  utilisateur_id: 1,
  ticket_id: 1,
  quantite: 2,
  total: 150.00,
  statut: 'pending'
});

// 2. Créer un paiement
const payment = await axios.post('/api/payment', {
  order_id: order.data.id,
  montant: 150.00,
  methode_paiement: 'carte_credit',
  reference_paiement: 'PAY-123456',
  donnees_paiement: {
    cardType: 'visa',
    last4: '1234'
  }
});

// 3. Traiter le paiement
const processedPayment = await axios.post(`/api/payment/process/${payment.data.id}`, {
  status: 'completed',
  transaction_id: 'TXN-789'
});
```

### Paiement YengaPay

```javascript
// 1. Créer une commande
const order = await axios.post('/api/orders', {
  utilisateur_id: 1,
  ticket_id: 1,
  quantite: 2,
  total: 150.00,
  statut: 'pending'
});

// 2. Créer un paiement YengaPay
const yengaPayment = await axios.post('/api/payment/yengapay', {
  order_id: order.data.id
});

// 3. Rediriger l'utilisateur vers l'URL de paiement
const paymentUrl = yengaPayment.data.yengapayData.paymentUrl;
window.location.href = paymentUrl;

// 4. Le webhook sera appelé automatiquement par YengaPay
```

## Sécurité

- Validation du montant avec la commande
- Vérification de l'existence de la commande
- Gestion des erreurs de transaction
- Logs des opérations de paiement
- Validation des webhooks YengaPay (à implémenter selon leurs spécifications)

## Tests

Utilisez le script `apiTest.js` pour tester le système complet :

```bash
node apiTest.js
```

Cela créera des événements, tickets, commandes et paiements de test, y compris des tests YengaPay.

### Test YengaPay spécifique

```bash
# Le test YengaPay inclut :
# 1. Création d'un utilisateur de test
# 2. Création d'une commande
# 3. Initiation d'un paiement YengaPay
# 4. Simulation d'un webhook de succès
# 5. Vérification de la mise à jour de la commande et du stock
``` 