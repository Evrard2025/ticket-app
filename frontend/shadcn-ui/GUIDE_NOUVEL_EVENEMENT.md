# Guide d'utilisation - Page de nouvel événement

## Vue d'ensemble

La page de nouvel événement permet aux administrateurs de créer de nouveaux événements sur la plateforme TicketFlix avec une interface intuitive et complète.

## Accès à la page

1. **Connexion en tant qu'administrateur** : Assurez-vous d'être connecté avec un compte ayant le rôle "admin"
2. **Navigation** : Cliquez sur "Dashboard" dans la barre de navigation
3. **Accès direct** : Cliquez sur "Gestion des événements" puis sur le bouton "Nouvel événement"
4. **URL directe** : `/dashboard/events/new`

## Fonctionnalités principales

### 1. Informations de base de l'événement

#### Champs obligatoires (*)
- **Titre de l'événement** : Nom de l'événement (ex: "Concert de Jazz en plein air")
- **Catégorie** : Type d'événement (Concert, Théâtre, Cinéma, Sport, etc.)
- **Date et heure** : Date et heure précises de l'événement
- **Lieu** : Adresse ou nom du lieu de l'événement
- **Organisateur** : Nom de l'organisation responsable
- **Description** : Description détaillée de l'événement

#### Champs optionnels
- **Durée** : Durée estimée de l'événement (ex: "2 heures")
- **Note** : Note de l'événement (ex: "4.5")
- **URL de l'image** : Lien vers l'image de l'événement

### 2. Configuration des tickets

#### Types de tickets disponibles
- VIP
- Premium
- Standard
- Économique
- Étudiant
- Senior
- Enfant

#### Pour chaque type de ticket
- **Catégorie** : Type de ticket (obligatoire)
- **Prix (FCFA)** : Prix en francs CFA (obligatoire, > 0)
- **Stock disponible** : Nombre de tickets disponibles (obligatoire, > 0)

#### Gestion des tickets
- **Ajouter un ticket** : Bouton "Ajouter un type de ticket" pour créer plusieurs catégories
- **Supprimer un ticket** : Bouton "X" rouge pour supprimer un type de ticket (minimum 1 ticket requis)

## Processus de création

### 1. Remplissage du formulaire
1. Remplissez toutes les informations de base de l'événement
2. Configurez au moins un type de ticket avec prix et stock
3. Vérifiez que tous les champs obligatoires sont remplis

### 2. Validation
Le système vérifie automatiquement :
- Tous les champs obligatoires sont remplis
- Les prix des tickets sont supérieurs à 0
- Les stocks des tickets sont supérieurs à 0
- Au moins un type de ticket est configuré

### 3. Création
1. Cliquez sur "Créer l'événement"
2. Le système crée d'abord l'événement
3. Puis crée tous les types de tickets associés
4. Redirection automatique vers la liste des événements

## Messages d'erreur et validation

### Erreurs de validation
- **Champs obligatoires** : "Le titre est requis", "La description est requise", etc.
- **Prix invalide** : "Le prix du ticket X doit être supérieur à 0"
- **Stock invalide** : "Le stock du ticket X doit être supérieur à 0"

### Erreurs de création
- **Erreur serveur** : "Erreur lors de la création de l'événement"
- **Succès** : "Événement créé avec succès !"

## Interface utilisateur

### Design responsive
- **Desktop** : Formulaire en 2 colonnes pour les informations de base
- **Mobile** : Formulaire en 1 colonne adapté aux petits écrans

### Composants utilisés
- **Cards** : Organisation claire des sections
- **Input fields** : Champs de saisie avec validation
- **Select dropdowns** : Sélection de catégories
- **Buttons** : Actions principales et secondaires
- **Icons** : Icônes Lucide pour une meilleure UX

### Navigation
- **Bouton retour** : Flèche vers la gauche pour revenir à la liste
- **Bouton annuler** : Annule la création et retourne à la liste
- **Breadcrumb** : Navigation claire dans le dashboard

## Bonnes pratiques

### Pour les organisateurs
1. **Titre descriptif** : Utilisez un titre clair et attractif
2. **Description complète** : Décrivez l'événement en détail
3. **Image de qualité** : Utilisez une image de bonne qualité
4. **Prix cohérents** : Fixez des prix réalistes selon le marché
5. **Stock approprié** : Estimez correctement la demande

### Pour les administrateurs
1. **Validation des données** : Vérifiez les informations avant création
2. **Gestion des stocks** : Surveillez les stocks après création
3. **Suivi des ventes** : Utilisez le dashboard pour suivre les performances

## Intégration avec le système

### Base de données
- **Table events** : Stockage des informations de base
- **Table tickets** : Stockage des types de tickets avec prix et stock

### API endpoints utilisés
- `POST /api/events` : Création de l'événement
- `POST /api/tickets` : Création des tickets (appelé pour chaque type)

### Sécurité
- **Authentification requise** : Seuls les admins peuvent accéder
- **Validation côté client et serveur** : Double validation des données
- **Gestion des erreurs** : Messages d'erreur informatifs

## Dépannage

### Problèmes courants
1. **Erreur de validation** : Vérifiez tous les champs obligatoires
2. **Erreur de création** : Vérifiez la connexion internet et réessayez
3. **Problème d'image** : Vérifiez que l'URL de l'image est accessible

### Support
- **Logs** : Vérifiez la console du navigateur pour les erreurs
- **API** : Vérifiez les logs du serveur backend
- **Base de données** : Vérifiez la connexion PostgreSQL

## Évolutions futures

### Fonctionnalités prévues
- **Upload d'images** : Upload direct d'images depuis l'interface
- **Modèles d'événements** : Templates prédéfinis pour différents types
- **Validation avancée** : Validation des dates, prix, etc.
- **Aperçu** : Prévisualisation de l'événement avant création
- **Brouillons** : Sauvegarde automatique des brouillons

### Améliorations UX
- **Wizard** : Assistant de création en étapes
- **Auto-complétion** : Suggestions pour les lieux et organisateurs
- **Validation en temps réel** : Feedback immédiat sur les erreurs
- **Historique** : Sauvegarde des derniers événements créés 