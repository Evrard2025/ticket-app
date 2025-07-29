# 🎫 Plateforme de Vente de Tickets Évènementiels

Une application web complète pour la gestion et la vente de tickets en ligne pour divers types d’événements : concerts, festivals, conférences, formations, spectacles, etc.

## 🧩 Fonctionnalités principales

- Création et gestion de différents types d’événements
- Support pour plusieurs catégories de tickets (VIP, Standard, Étudiant, etc.)
- Paiement en ligne et génération automatique de tickets électroniques (PDF/QR Code)
- Tableau de bord pour organisateurs d'événements
- Recherche, filtrage et réservation de tickets côté client
- E-mails de confirmation avec billets
- Scan QR code à l’entrée des événements


## ⚙️ Technologies utilisées

- **Frontend** : React + TailwindCSS
- **Backend** : Node.js (Express) 
- **Base de données** : PostgreSQL
- **Paiement** : Yenga pay
- **Authentification** : JWT
- **QR Code** : Bibliothèque QR (ex: `qrcode` en Node.js)


## YENGA PAY API
// Configurer la requête pour YengaPay selon la documentation exacte
    const payload = {
      paymentAmount: montant,
      reference: reference,
      articles: [{
        title: formation.titre || 'Formation KEC',
        description: `Paiement pour la formation ${formation.titre || 'KEC'} (${formation.ticketsDisponibles} tickets restants)`,
        pictures: [formation.imageUrl || 'https://quixy.com/wp-content/uploads/2020/05/Solutions_Finance_Theme-1.png'],
        price: montant
      }]
    };

    // Utiliser l'API key depuis les variables d'environnement
    const apiKey = process.env.YENGA_API_KEY || 'FY2JesSN7qENbWoKfERlIcIvtfoBCjFl';

    console.log('Payload YengaPay:', JSON.stringify(payload, null, 2));

    const response = await axios.post(
      'https://api.yengapay.com/api/v1/groups/10315194/payment-intent/61819',
      payload,
      {
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey
        }
      }
    );


Page détail événement + affichage des tickets par catégorie
Authentification (connexion/inscription)
Réservation/paiement + affichage QR code
Dashboard organisateur
Recherche/filtrage
Scan QR code