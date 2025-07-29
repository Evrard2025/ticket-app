# 🚀 Implémentation YengaPay - Documentation Complète

## 📋 Vue d'ensemble

Cette implémentation suit la [documentation officielle YengaPay](https://kreezus.notion.site/DOCUMENTATION-API-YENGAPAY-KREEZUS-e9de95e48d504110aa048261a200292a) pour intégrer le système de paiement dans notre plateforme de vente de tickets.

## ⚙️ Configuration

### Variables d'environnement requises

```env
YENGA_API_KEY=FY2JesSN7qENbWoKfERlIcIvtfoBCjFl
YENGA_GROUP_ID=10315194
YENGA_PAYMENT_INTENT_ID=61819
```

### Configuration centralisée

Toute la configuration YengaPay est centralisée dans `config/yengapay.js` :

```javascript
const YENGA_CONFIG = {
  API_KEY: process.env.YENGA_API_KEY,
  GROUP_ID: process.env.YENGA_GROUP_ID,
  PAYMENT_INTENT_ID: process.env.YENGA_PAYMENT_INTENT_ID,
  CURRENCY: 'XOF',
  MIN_AMOUNT: 200,
  EUR_TO_XOF_RATE: 655
};
```

## 🔄 Flux de paiement

### 1. Création du paiement

**Endpoint :** `POST /api/payment/yengapay`

**Payload :**
```json
{
  "order_id": 123
}
```

**Processus :**
1. Récupération des informations de commande avec jointures
2. Construction du payload YengaPay selon la documentation
3. Conversion EUR → XOF (1 EUR = 655 XOF)
4. Appel à l'API YengaPay
5. Validation de la réponse
6. Enregistrement en base de données
7. Retour de l'URL de paiement

**Réponse :**
```json
{
  "id": 1,
  "orderId": 123,
  "amount": 98250,
  "paymentMethod": "yengapay",
  "status": "pending",
  "paymentReference": "PAY-1753547566483-123",
  "transactionId": "cmdkgy2t80001s601cpnzl9u3",
  "yengapayData": {
    "id": "cmdkgy2t80001s601cpnzl9u3",
    "reference": "PAY-1753547566483-123",
    "checkoutPageUrlWithPaymentToken": "https://checkout.yengapay.com/checkout/...",
    "paymentAmount": 98250,
    "currency": "XOF",
    "transactionStatus": "PENDING"
  }
}
```

### 2. Webhook de notification

**Endpoint :** `POST /api/payment/yengapay/webhook`

**Processus :**
1. Réception du webhook YengaPay
2. Validation des données
3. Recherche du paiement par référence
4. Mise à jour du statut
5. Confirmation de la commande si paiement réussi
6. Envoi d'email de confirmation (optionnel)

## 🛠️ Fonctions utilitaires

### YengaPayUtils

```javascript
// Construction de l'URL API
buildApiUrl(endpoint)

// Conversion EUR → XOF
convertToXOF(amountEUR)

// Génération de référence unique
generateReference(orderId)

// Construction du payload
buildPaymentPayload(order, event, ticket)

// Validation de la réponse
validateResponse(response)

// Traitement du webhook
processWebhook(webhookData)
```

## 📊 Gestion des statuts

### Mapping des statuts YengaPay → Interne

| YengaPay | Interne | Description |
|----------|---------|-------------|
| `COMPLETED` | `completed` | Paiement réussi |
| `SUCCESS` | `completed` | Paiement réussi |
| `PAID` | `completed` | Paiement réussi |
| `FAILED` | `failed` | Paiement échoué |
| `ERROR` | `failed` | Erreur de paiement |
| `CANCELLED` | `cancelled` | Paiement annulé |
| `PENDING` | `pending` | En attente |

## 🔒 Sécurité

### Validation des données
- Vérification de l'existence de la commande
- Validation des montants
- Contrôle des références uniques

### Gestion des erreurs
- Logs détaillés pour le debugging
- Messages d'erreur informatifs
- Fallback en cas d'échec

## 📱 Intégration Frontend

### Redirection vers YengaPay

```javascript
if (yengaPayment.yengapayData?.checkoutPageUrlWithPaymentToken) {
  window.location.href = yengaPayment.yengapayData.checkoutPageUrlWithPaymentToken;
}
```

### Gestion des retours

Après paiement, l'utilisateur est redirigé vers :
- `GET /payment/confirmation?reference=PAY-...&status=completed`

## 🧪 Tests

### Script de test

```bash
cd back
node simpleTest.js
```

### Tests inclus
- ✅ Création d'utilisateur
- ✅ Connexion
- ✅ Création de commande
- ✅ Paiement YengaPay
- ✅ Validation de la réponse

## 📈 Monitoring

### Logs importants

```
🔍 Début création paiement YengaPay
📋 Payload YengaPay: {...}
🔗 URL API YengaPay: https://api.yengapay.com/...
✅ Réponse YengaPay validée: {...}
✅ Paiement YengaPay créé avec succès: 1
📥 Webhook YengaPay reçu: {...}
✅ Paiement mis à jour: completed
```

## 🚨 Gestion des erreurs

### Erreurs courantes

1. **Montant minimum non respecté**
   - Solution : Conversion automatique EUR → XOF

2. **Référence dupliquée**
   - Solution : Génération de référence unique avec timestamp

3. **Commande non trouvée**
   - Solution : Validation de l'existence de la commande

4. **Erreur API YengaPay**
   - Solution : Logs détaillés et gestion d'erreur spécifique

## 🔄 Améliorations futures

- [ ] Validation de signature webhook
- [ ] Retry automatique en cas d'échec
- [ ] Dashboard de monitoring des paiements
- [ ] Notifications push en temps réel
- [ ] Support multi-devises
- [ ] Intégration avec d'autres gateways

## 📞 Support

Pour toute question sur l'implémentation YengaPay :
- Documentation officielle : [YengaPay API](https://kreezus.notion.site/DOCUMENTATION-API-YENGAPAY-KREEZUS-e9de95e48d504110aa048261a200292a)
- Logs détaillés dans la console du serveur
- Tests automatisés dans `simpleTest.js` 