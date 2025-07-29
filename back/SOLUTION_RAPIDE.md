# Solution Rapide - Génération de Tickets

## Problème Identifié
Le webhook YengaPay n'arrive pas à votre serveur local, donc les tickets ne sont pas générés.

## Solution Immédiate

### 1. Corriger le port ngrok
Votre serveur tourne sur le port **5000** mais ngrok est configuré pour le port **3000**.

**Solution :**
```bash
# Arrêter ngrok (Ctrl+C)
# Relancer avec le bon port
ngrok http 5000
```

### 2. Tester manuellement le système
```bash
# Dans le dossier back
node manualWebhook.js
```

Ce script va :
- Récupérer le paiement ID 6
- Mettre à jour son statut à 'completed'
- Mettre à jour la commande à 'confirmed'
- Envoyer les notifications
- Générer le ticket

### 3. Vérifier la configuration email
Ajouter dans votre fichier `.env` :
```
EMAIL_USER=votre_email@gmail.com
EMAIL_PASS=votre_mot_de_passe_app_gmail
EMAIL_SERVICE=gmail
```

### 4. Configurer l'URL webhook dans YengaPay
Utiliser l'URL ngrok pour le webhook :
```
https://bb0cee39cf60.ngrok-free.app/api/payment/yengapay/webhook
```

## Tests à Effectuer

### Test 1: Debug de la base de données
```bash
node debugTicket.js
```

### Test 2: Webhook manuel
```bash
node manualWebhook.js
```

### Test 3: Test complet
```bash
node quickTest.js
```

## Vérification des Résultats

Après avoir lancé `manualWebhook.js`, vous devriez voir :
- ✅ Paiement trouvé
- ✅ Statut paiement mis à jour
- ✅ Statut commande mis à jour
- ✅ Notifications envoyées
- ✅ Ticket généré

## Prochaines Étapes

1. **Configurer ngrok sur le bon port (5000)**
2. **Lancer le webhook manuel pour tester**
3. **Configurer l'URL webhook dans YengaPay**
4. **Tester un nouveau paiement**

## En Cas de Problème

Si `manualWebhook.js` échoue, vérifiez :
1. Les variables d'environnement email
2. La connexion à la base de données
3. Les logs d'erreur détaillés