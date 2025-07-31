# Guide d'utilisation du Dashboard Administrateur

## Vue d'ensemble

Le dashboard administrateur de TicketFlix est un outil complet de gestion et de suivi pour votre plateforme de vente de tickets. Il offre une interface intuitive pour gérer les événements, suivre les commandes, analyser les performances et gérer les utilisateurs.

## Accès au Dashboard

### Prérequis
- Être connecté avec un compte utilisateur
- Avoir le rôle "admin" dans la base de données

### Accès
1. Connectez-vous à votre compte administrateur
2. Cliquez sur le lien "Dashboard" dans la barre de navigation (icône graphique)
3. Vous serez redirigé vers `/dashboard`

## Fonctionnalités principales

### 1. Vue d'ensemble (`/dashboard`)

**Statistiques principales :**
- Nombre total d'événements (passés et à venir)
- Nombre total de commandes (avec statuts)
- Nombre d'utilisateurs (admins et utilisateurs)
- Revenus totaux

**Onglets disponibles :**
- **Vue d'ensemble** : Statistiques détaillées des tickets et paiements
- **Événements** : Accès rapide à la gestion des événements
- **Commandes** : Accès rapide au suivi des commandes
- **Utilisateurs** : Accès rapide à la gestion des utilisateurs
- **Analytics** : Accès rapide aux rapports détaillés

### 2. Gestion des événements (`/dashboard/events`)

**Fonctionnalités :**
- Liste complète de tous les événements
- Recherche par titre, description ou lieu
- Statistiques par événement (tickets vendus, revenus)
- Actions disponibles :
  - Voir l'événement (lien vers la page publique)
  - Modifier l'événement
  - Supprimer l'événement (si aucune commande associée)

**Informations affichées :**
- Image et détails de l'événement
- Date et lieu
- Catégorie
- Nombre de types de tickets
- Stock disponible
- Tickets vendus
- Revenus générés

### 3. Suivi des commandes (`/dashboard/orders`)

**Fonctionnalités :**
- Liste de toutes les commandes
- Filtrage par statut (en attente, complétée, annulée, remboursée)
- Recherche par nom client, email ou événement
- Mise à jour du statut des commandes

**Informations affichées :**
- Numéro de commande et date
- Informations client (nom, email)
- Détails de l'événement
- Type de ticket et quantité
- Montant total
- Statut de la commande
- Statut du paiement et méthode

**Actions disponibles :**
- Voir les détails de la commande
- Modifier le statut (pour les commandes en attente)

### 4. Gestion des utilisateurs (`/dashboard/users`)

**Fonctionnalités :**
- Liste de tous les utilisateurs
- Filtrage par rôle (admin, utilisateur)
- Recherche par nom ou email
- Statistiques par utilisateur

**Informations affichées :**
- Nom et avatar
- Email et téléphone
- Rôle (admin/utilisateur)
- Nombre de commandes
- Montant total dépensé
- Date d'inscription

**Statistiques :**
- Total utilisateurs
- Utilisateurs actifs (avec commandes)
- Valeur moyenne par utilisateur

### 5. Analytics et rapports (`/dashboard/analytics`)

**Fonctionnalités :**
- Graphiques d'évolution des ventes
- Filtrage par période (jour, semaine, mois)
- Statistiques détaillées des paiements
- Analyse des performances

**Données disponibles :**
- Évolution des revenus dans le temps
- Nombre de commandes par période
- Tickets vendus par période
- Taux de croissance
- Statistiques des paiements (réussis, en attente, échoués)
- Gestion des tickets (stock, valeur)

## Navigation

### Barre de navigation du dashboard
- **Retour au site** : Retour à la page d'accueil publique
- **Vue d'ensemble** : Page principale du dashboard
- **Événements** : Gestion des événements
- **Commandes** : Suivi des commandes
- **Utilisateurs** : Gestion des utilisateurs
- **Analytics** : Rapports et analyses

### Navigation mobile
Sur mobile, la navigation s'adapte avec des boutons empilés pour une meilleure lisibilité.

## Sécurité

### Contrôle d'accès
- Seuls les utilisateurs avec le rôle "admin" peuvent accéder au dashboard
- Vérification automatique à chaque page
- Redirection vers la page d'accueil si accès non autorisé

### Protection des routes
- Middleware de vérification côté serveur
- Vérification côté client pour l'interface utilisateur

## API Endpoints

### Statistiques
- `GET /api/dashboard/stats` - Statistiques générales

### Événements
- `GET /api/dashboard/events` - Liste des événements avec statistiques
- `DELETE /api/dashboard/events/:id` - Supprimer un événement

### Commandes
- `GET /api/dashboard/orders` - Liste des commandes
- `PUT /api/dashboard/orders/:id/status` - Mettre à jour le statut

### Utilisateurs
- `GET /api/dashboard/users` - Liste des utilisateurs

### Analytics
- `GET /api/dashboard/sales-analytics` - Données d'analyse des ventes

## Utilisation recommandée

### Gestion quotidienne
1. **Vérifier les nouvelles commandes** dans la section Commandes
2. **Mettre à jour les statuts** des commandes en attente
3. **Consulter les analytics** pour suivre les performances

### Gestion hebdomadaire
1. **Analyser les tendances** dans la section Analytics
2. **Vérifier les événements** et leur performance
3. **Suivre l'évolution des utilisateurs**

### Gestion mensuelle
1. **Générer des rapports** complets
2. **Analyser les performances** globales
3. **Planifier les améliorations** basées sur les données

## Support

Pour toute question ou problème avec le dashboard :
1. Vérifiez que vous avez bien le rôle "admin"
2. Consultez les logs du serveur pour les erreurs
3. Contactez l'équipe de développement si nécessaire

## Mise à jour

Le dashboard est conçu pour être évolutif. De nouvelles fonctionnalités peuvent être ajoutées :
- Export de données
- Rapports personnalisés
- Notifications en temps réel
- Intégrations avec d'autres outils 