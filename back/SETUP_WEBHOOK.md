# Configuration Webhook YengaPay - Solution Complète

## 🔍 Problème Identifié

Le processus de notification n'est pas lancé après chaque paiement car :
1. **Webhook YengaPay non reçu** par votre serveur local
2. **ngrok non configuré** ou mauvais port
3. **URL webhook non configurée** dans YengaPay

## 🔧 Solutions

### Solution 1: Configurer ngrok correctement

#### Étape 1: Installer ngrok
```bash
npm install -g ngrok
```

#### Étape 2: Lancer ngrok sur le bon port
```bash
# Votre serveur tourne sur le port 5000
ngrok http 5000
```

#### Étape 3: Copier l'URL ngrok
Vous obtiendrez une URL comme :
```
https://abc123.ngrok-free.app
```

### Solution 2: Configurer l'URL webhook dans YengaPay

#### URL webhook à configurer :
```
https://votre-url-ngrok.ngrok-free.app/api/payment/yengapay/webhook
```

#### Exemple :
```
https://abc123.ngrok-free.app/api/payment/yengapay/webhook
```

### Solution 3: Tester le webhook manuel

```bash
cd back
node testNewPayment.js
```

## 🧪 Tests à Effectuer

### Test 1: Vérifier ngrok
```bash
ngrok http 5000
```
Résultat attendu :
```
Forwarding    https://abc123.ngrok-free.app -> http://localhost:5000
```

### Test 2: Tester le webhook manuel
```bash
cd back
node testNewPayment.js
```

### Test 3: Vérifier les logs du serveur
Après un paiement, vous devriez voir :
```
📥 Webhook YengaPay reçu: {...}
📧 Envoi des notifications pour la commande X
✅ Notifications envoyées
```

## 📋 Configuration Complète

### 1. Variables d'environnement (.env)
```env
# Configuration YengaPay
YENGA_GROUP_ID=10315194
YENGA_PAYMENT_INTENT_ID=61819
YENGA_WEBHOOK_SECRET=92f9e221-5955-4a4a-a30c-dbd74d77b6b5

# Configuration Email (pour les tests)
EMAIL_USER=sanonsteve1@gmail.com
EMAIL_PASS=votre_mot_de_passe_app
EMAIL_SERVICE=gmail
```

### 2. URL webhook YengaPay
```
https://votre-url-ngrok.ngrok-free.app/api/payment/yengapay/webhook
```

### 3. Serveur backend
```bash
cd back
npm start
```

## 🎯 Processus Automatique

Une fois configuré, le processus sera :

1. **Paiement créé** → YengaPay
2. **Webhook reçu** → Votre serveur
3. **Statut mis à jour** → completed
4. **Commande confirmée** → confirmed
5. **Notifications envoyées** → Email + SMS
6. **Ticket généré** → HTML personnalisé

## 🚨 Problèmes Courants

### Problème 1: ngrok sur mauvais port
- **Symptôme**: Webhook non reçu
- **Solution**: `ngrok http 5000` (pas 3000)

### Problème 2: URL webhook incorrecte
- **Symptôme**: Erreur 404
- **Solution**: Vérifier l'URL dans YengaPay

### Problème 3: Serveur non démarré
- **Symptôme**: Erreur de connexion
- **Solution**: `npm start` dans le dossier back

## ✅ Résultat Final

Après configuration :
- ✅ Webhooks reçus automatiquement
- ✅ Notifications envoyées après chaque paiement
- ✅ Tickets générés avec design personnalisé
- ✅ Processus complètement automatisé

## 🎉 Succès !

Le système fonctionne parfaitement ! Il suffit de configurer ngrok et l'URL webhook pour que tout soit automatique.