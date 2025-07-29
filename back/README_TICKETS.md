# Système de Tickets Électroniques

## Vue d'ensemble

Le système de tickets électroniques génère automatiquement des tickets personnalisés avec un design moderne et les envoie par email après validation d'un paiement YengaPay. Les tickets incluent toutes les informations de l'événement, un QR code unique, et sont adaptés visuellement selon la catégorie d'événement.

## Fonctionnalités

### 🎨 Design Personnalisé
- **Couleurs variables** selon la catégorie d'événement :
  - Festival : Orange/Orange vif
  - Concert : Violet/Violet clair
  - Théâtre : Vert/Vert clair
  - Sport : Rouge/Rouge clair
  - Conférence : Bleu/Bleu clair
  - Exposition : Violet/Violet foncé

### 📧 Envoi Automatique
- Email envoyé automatiquement après validation du paiement
- Ticket HTML joint en pièce jointe
- QR code séparé en image PNG
- Notifications WhatsApp/SMS optionnelles

### 🔐 Sécurité
- QR code unique contenant les informations de la commande
- Vérification du statut de paiement avant génération
- Tickets nominatifs et non transférables

## Architecture

### Services

#### `TicketGenerator` (`services/ticketGenerator.js`)
- Génère le HTML et CSS du ticket
- Applique les couleurs selon la catégorie d'événement
- Crée le QR code avec les données de la commande

#### `NotificationService` (`services/notifications.js`)
- Envoie les emails avec tickets personnalisés
- Gère les notifications SMS/WhatsApp
- Intègre le générateur de tickets

### Endpoints API

#### `GET /api/payment/ticket/:orderId`
- Génère et télécharge le ticket HTML
- Vérifie que la commande est payée
- Retourne le fichier HTML du ticket

#### `GET /api/payment/ticket/:orderId/info`
- Retourne les informations du ticket (sans HTML)
- Inclut le QR code en base64
- Utilisé par le frontend pour affichage

## Flux de Paiement

1. **Paiement YengaPay** → Webhook reçu
2. **Validation** → Statut mis à jour en base
3. **Génération ticket** → HTML + QR code créés
4. **Envoi email** → Ticket joint automatiquement
5. **Notification SMS** → Confirmation WhatsApp

## Structure du Ticket

### Informations Incluses
- Logo et nom de l'application
- Titre et image de l'événement
- Date, heure et lieu
- Nom de l'acheteur
- Catégorie et quantité de tickets
- Prix unitaire et total
- QR code unique
- Code-barres
- Informations importantes

### Design Responsive
- Optimisé pour mobile et desktop
- Impression compatible
- Couleurs adaptatives selon l'événement

## Configuration

### Variables d'Environnement
```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_SERVICE=gmail
FRONTEND_URL=http://localhost:5173
```

### Base de Données
Le système utilise les tables existantes :
- `orders` : Commandes des utilisateurs
- `payments` : Paiements YengaPay
- `events` : Informations des événements
- `tickets` : Catégories de tickets
- `users` : Données utilisateurs

## Frontend

### Composants React
- `TicketDisplay` : Affichage détaillé d'un ticket
- `TicketsPage` : Liste de tous les tickets utilisateur
- Navigation ajoutée dans la navbar

### Fonctionnalités
- Visualisation des tickets
- Téléchargement en HTML
- Filtrage par statut (à venir/passés)
- Modal de détail du ticket

## Utilisation

### Pour les Utilisateurs
1. Effectuer un achat via YengaPay
2. Recevoir automatiquement le ticket par email
3. Accéder à "Mes Tickets" dans l'application
4. Télécharger ou visualiser les tickets

### Pour les Développeurs
```javascript
// Générer un ticket manuellement
const ticketData = await TicketGenerator.generateTicket(orderId);

// Envoyer une notification
await NotificationService.sendPaymentSuccessNotification(orderId);

// Récupérer les infos d'un ticket
const ticketInfo = await api.get(`/payment/ticket/${orderId}/info`);
```

## Sécurité et Validation

- Vérification du statut de paiement avant génération
- QR codes uniques avec données cryptées
- Validation des permissions utilisateur
- Protection contre les accès non autorisés

## Maintenance

### Logs
- Génération de tickets : `🎫 Génération de ticket pour la commande:`
- Envoi d'emails : `📧 Email avec ticket personnalisé envoyé à`
- Erreurs : `❌ Erreur lors de la génération du ticket:`

### Monitoring
- Surveiller les échecs d'envoi d'emails
- Vérifier la génération des QR codes
- Contrôler les téléchargements de tickets

## Évolutions Futures

- Génération PDF avec Puppeteer
- Tickets avec animations CSS
- Intégration blockchain pour vérification
- Système de transfert de tickets
- Analytics sur l'utilisation des tickets