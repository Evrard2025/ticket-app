# Guide de Dépannage - Génération de Tickets et Notifications

## Problème Identifié

Le ticket n'est pas généré et la notification n'est pas envoyée après une réponse YengaPay validée.

## Causes Possibles

### 1. Webhook YengaPay non reçu
- **Problème**: Le webhook YengaPay n'atteint pas votre serveur local
- **Solution**: Utiliser un service de tunneling comme ngrok
- **Commande**: `ngrok http 3000`

### 2. Incohérence des noms de colonnes
- **Problème**: Utilisation de `user_id` au lieu de `utilisateur_id` dans certaines requêtes
- **Solution**: ✅ **CORRIGÉ** - Toutes les requêtes utilisent maintenant `utilisateur_id`

### 3. Configuration email manquante
- **Problème**: Variables d'environnement email non configurées
- **Solution**: Ajouter dans `.env`:
```
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
EMAIL_SERVICE=gmail
```

## Tests et Diagnostics

### 1. Test du webhook simulé
```bash
# Tester avec un paiement existant
curl -X POST http://localhost:3000/api/payment/test-webhook/PAYMENT_ID
```

### 2. Script de test automatique
```bash
node testTicketGeneration.js
```

### 3. Vérification des logs
Les logs détaillés ont été ajoutés pour diagnostiquer :
- Réception du webhook
- Génération du ticket
- Envoi des notifications

## Étapes de Résolution

### Étape 1: Vérifier la configuration
1. Vérifier que les variables d'environnement email sont configurées
2. Vérifier que la base de données est accessible
3. Vérifier que le serveur écoute sur le bon port

### Étape 2: Tester avec ngrok
1. Installer ngrok: `npm install -g ngrok`
2. Lancer le tunnel: `ngrok http 3000`
3. Configurer l'URL webhook dans YengaPay avec l'URL ngrok
4. Tester un paiement

### Étape 3: Utiliser le webhook simulé
Si le webhook YengaPay ne fonctionne pas, utiliser l'endpoint de test :
```bash
POST /api/payment/test-webhook/:paymentId
```

### Étape 4: Vérifier les notifications
1. Vérifier les logs du serveur
2. Vérifier la boîte email
3. Vérifier les SMS/WhatsApp

## Endpoints de Test

### 1. Informations du ticket
```
GET /api/payment/ticket/:orderId/info
```

### 2. Téléchargement du ticket
```
GET /api/payment/ticket/:orderId
```

### 3. Webhook simulé
```
POST /api/payment/test-webhook/:paymentId
```

## Logs à Surveiller

### Webhook reçu
```
📥 Webhook YengaPay reçu: {...}
📥 Headers reçus: {...}
```

### Génération de ticket
```
🎫 Début génération ticket pour commande X
📋 Données commande récupérées: {...}
✅ Ticket généré avec succès
```

### Notifications
```
📧 Début envoi notification succès pour commande X
📧 Envoi de l'email à user@example.com
📱 Envoi du SMS à +1234567890
✅ Notifications envoyées
```

## Problèmes Courants

### 1. "Commande non trouvée"
- Vérifier que la commande existe dans la base
- Vérifier les jointures SQL (utilisateur_id vs user_id)

### 2. "Erreur email"
- Vérifier les variables d'environnement EMAIL_*
- Vérifier les paramètres SMTP

### 3. "QR code non généré"
- Vérifier que la librairie qrcode est installée
- Vérifier les données de la commande

## Solutions d'Urgence

### 1. Génération manuelle de ticket
```javascript
const TicketGenerator = require('./services/ticketGenerator');
const ticket = await TicketGenerator.generateTicket(orderId);
```

### 2. Envoi manuel de notification
```javascript
const NotificationService = require('./services/notifications');
await NotificationService.sendPaymentSuccessNotification(orderId);
```

### 3. Mise à jour manuelle des statuts
```sql
UPDATE payments SET statut = 'completed' WHERE id = ?;
UPDATE orders SET statut = 'confirmed' WHERE id = ?;
```

## Contact Support

En cas de problème persistant :
- Vérifier les logs du serveur
- Tester avec le script `testTicketGeneration.js`
- Utiliser l'endpoint de test webhook
- Vérifier la configuration ngrok