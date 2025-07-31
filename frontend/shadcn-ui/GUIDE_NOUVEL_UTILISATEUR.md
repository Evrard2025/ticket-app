# Guide d'utilisation - Ajout d'utilisateurs par l'administrateur

## Vue d'ensemble

La fonctionnalité d'ajout d'utilisateurs permet aux administrateurs de créer de nouveaux comptes utilisateurs directement depuis le dashboard, sans que les utilisateurs aient besoin de s'inscrire eux-mêmes.

## Accès à la fonctionnalité

1. **Connexion en tant qu'administrateur** : Assurez-vous d'être connecté avec un compte ayant le rôle "admin"
2. **Navigation** : Allez dans le Dashboard → Gestion des utilisateurs
3. **Bouton d'ajout** : Cliquez sur le bouton "Nouvel utilisateur" en haut à droite
4. **URL directe** : `/dashboard/users/new`

## Fonctionnalités principales

### 1. Formulaire de création d'utilisateur

#### Champs obligatoires (*)
- **Nom complet** : Nom et prénom de l'utilisateur
- **Adresse email** : Email valide pour la communication
- **Numéro de téléphone** : Numéro de contact principal
- **Mot de passe** : Mot de passe sécurisé (minimum 6 caractères)
- **Rôle** : Niveau d'accès de l'utilisateur

#### Champs optionnels
- Aucun champ optionnel - tous les champs sont requis

### 2. Gestion des rôles

#### Rôles disponibles
- **Utilisateur** : Accès standard à la plateforme
  - Peut consulter les événements
  - Peut acheter des tickets
  - Peut voir ses commandes et tickets
  - Accès limité aux fonctionnalités publiques

- **Administrateur** : Accès complet au dashboard
  - Toutes les fonctionnalités utilisateur
  - Accès au dashboard administrateur
  - Gestion des événements, commandes, utilisateurs
  - Création et modification de contenu
  - Accès aux analytics et statistiques

### 3. Validation des données

#### Validation côté client
- **Nom** : Champ requis, non vide
- **Email** : Format email valide, contient "@"
- **Téléphone** : Champ requis, non vide
- **Mot de passe** : Minimum 6 caractères
- **Rôle** : Sélection obligatoire

#### Validation côté serveur
- **Email unique** : Vérification que l'email n'existe pas déjà
- **Téléphone unique** : Vérification que le numéro n'existe pas déjà
- **Hachage du mot de passe** : Sécurisation automatique
- **Validation des données** : Vérification de l'intégrité

## Processus de création

### 1. Remplissage du formulaire
1. Remplissez le nom complet de l'utilisateur
2. Saisissez une adresse email valide
3. Entrez le numéro de téléphone
4. Choisissez un mot de passe sécurisé
5. Sélectionnez le rôle approprié

### 2. Validation
Le système vérifie automatiquement :
- Tous les champs obligatoires sont remplis
- L'email a un format valide
- Le mot de passe respecte les critères de sécurité
- Le rôle est sélectionné

### 3. Création
1. Cliquez sur "Créer l'utilisateur"
2. Le système crée le compte avec le mot de passe haché
3. L'utilisateur peut immédiatement se connecter
4. Redirection automatique vers la liste des utilisateurs

## Messages d'erreur et validation

### Erreurs de validation
- **Champs obligatoires** : "Le nom est requis", "L'email est requis", etc.
- **Email invalide** : "L'email doit être valide"
- **Mot de passe faible** : "Le mot de passe doit contenir au moins 6 caractères"

### Erreurs de création
- **Email existant** : "Cet email est déjà utilisé"
- **Téléphone existant** : "Ce numéro de téléphone est déjà utilisé"
- **Erreur serveur** : "Erreur lors de la création de l'utilisateur"

### Succès
- **Création réussie** : "Utilisateur créé avec succès !"

## Interface utilisateur

### Design responsive
- **Desktop** : Formulaire en 2 colonnes pour les informations de base
- **Mobile** : Formulaire en 1 colonne adapté aux petits écrans

### Composants utilisés
- **Cards** : Organisation claire des sections
- **Input fields** : Champs de saisie avec validation
- **Select dropdown** : Sélection du rôle avec descriptions
- **Password field** : Champ mot de passe avec toggle visibilité
- **Icons** : Icônes Lucide pour une meilleure UX

### Navigation
- **Bouton retour** : Flèche vers la gauche pour revenir à la liste
- **Bouton annuler** : Annule la création et retourne à la liste
- **Breadcrumb** : Navigation claire dans le dashboard

## Sécurité et bonnes pratiques

### Pour les administrateurs
1. **Vérification des données** : Vérifiez les informations avant création
2. **Choix du rôle** : Attribuez le rôle "admin" avec précaution
3. **Mot de passe temporaire** : Utilisez un mot de passe temporaire que l'utilisateur changera
4. **Communication** : Informez l'utilisateur de la création de son compte

### Pour les utilisateurs créés
1. **Première connexion** : L'utilisateur doit se connecter avec les identifiants fournis
2. **Changement de mot de passe** : Recommandé lors de la première connexion
3. **Vérification des informations** : L'utilisateur peut vérifier et modifier ses informations

### Sécurité
- **Hachage automatique** : Les mots de passe sont automatiquement hachés
- **Validation stricte** : Double validation côté client et serveur
- **Gestion des erreurs** : Messages d'erreur informatifs sans exposer de données sensibles
- **Authentification requise** : Seuls les admins peuvent accéder à cette fonctionnalité

## Intégration avec le système

### Base de données
- **Table users** : Stockage des informations utilisateur
- **Hachage bcrypt** : Sécurisation automatique des mots de passe
- **Contraintes d'unicité** : Email et téléphone uniques

### API endpoints utilisés
- `POST /api/auth/register` : Création de l'utilisateur avec validation

### Flux de données
1. **Formulaire frontend** → Validation côté client
2. **API backend** → Validation côté serveur
3. **Base de données** → Hachage et stockage
4. **Réponse** → Confirmation et redirection

## Cas d'usage

### Création d'un utilisateur standard
1. Remplir le formulaire avec les informations de base
2. Sélectionner le rôle "Utilisateur"
3. Créer le compte
4. L'utilisateur peut immédiatement se connecter

### Création d'un administrateur
1. Remplir le formulaire avec les informations de base
2. Sélectionner le rôle "Administrateur"
3. Créer le compte
4. L'administrateur a accès au dashboard

### Création en masse
- Cette fonctionnalité permet de créer des comptes un par un
- Pour la création en masse, envisager une fonctionnalité d'import CSV

## Dépannage

### Problèmes courants
1. **Email déjà utilisé** : Vérifiez que l'email n'existe pas déjà
2. **Téléphone déjà utilisé** : Vérifiez que le numéro n'existe pas déjà
3. **Erreur de validation** : Vérifiez tous les champs obligatoires
4. **Erreur de création** : Vérifiez la connexion internet et réessayez

### Support
- **Logs** : Vérifiez la console du navigateur pour les erreurs
- **API** : Vérifiez les logs du serveur backend
- **Base de données** : Vérifiez la connexion PostgreSQL

## Évolutions futures

### Fonctionnalités prévues
- **Import CSV** : Création en masse d'utilisateurs
- **Modèles d'utilisateurs** : Templates prédéfinis pour différents types
- **Validation avancée** : Validation des numéros de téléphone, emails
- **Notifications** : Envoi automatique d'email de bienvenue
- **Gestion des permissions** : Permissions granulaires par fonctionnalité

### Améliorations UX
- **Auto-complétion** : Suggestions pour les noms et emails
- **Validation en temps réel** : Feedback immédiat sur les erreurs
- **Générateur de mot de passe** : Génération automatique de mots de passe sécurisés
- **Prévisualisation** : Aperçu des informations avant création 