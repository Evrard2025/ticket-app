// Données mockées pour les événements et tickets

export type TicketCategory = {
  id: number;
  name: string;
  price: number;
  description: string;
  availableCount: number;
};

export type Event = {
  id: number;
  title: string;
  description: string;
  imageUrl: string;
  date: string;
  venue: string;
  category: string;
  organizer: string;
  year: number;
  rating: string;
  duration: string;
  categories: TicketCategory[];
};

export const eventCategories = [
  "Concert", 
  "Festival",
  "Conférence",
  "Formation",
  "Spectacle",
  "Sport",
  "Théâtre",
  "Exposition"
];

export const mockEvents: Event[] = [
  {
    id: 1,
    title: "Festival de Jazz",
    description: "Le plus grand festival de jazz de l'année avec des artistes internationaux et locaux. Une expérience musicale inoubliable avec des performances live, des ateliers et des rencontres avec les artistes.",
    imageUrl: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8amF6eiUyMGZlc3RpdmFsfGVufDB8fDB8fHww",
    date: "2023-08-15",
    venue: "Parc de la Musique",
    category: "Festival",
    organizer: "Jazz Productions",
    year: 2023,
    rating: "5.0",
    duration: "3 jours",
    categories: [
      { id: 1, name: "VIP", price: 98300, description: "Accès backstage et rencontre avec les artistes", availableCount: 50 },
      { id: 2, name: "Standard", price: 49100, description: "Accès à tous les concerts", availableCount: 500 },
      { id: 3, name: "Étudiant", price: 29500, description: "Sur présentation d'une carte étudiante", availableCount: 200 }
    ]
  },
  {
    id: 2,
    title: "Conférence Tech Innovation",
    description: "Découvrez les dernières innovations technologiques présentées par des experts de l'industrie. Une journée de conférences, de démonstrations et de networking.",
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8dGVjaG5vbG9neSUyMGNvbmZlcmVuY2V8ZW58MHx8MHx8fDA%3D",
    date: "2023-09-20",
    venue: "Centre de Conférences Moderne",
    category: "Conférence",
    organizer: "TechEvents",
    year: 2023,
    rating: "4.8",
    duration: "1 jour",
    categories: [
      { id: 1, name: "Premium", price: 130400, description: "Accès à toutes les conférences et ateliers + déjeuner", availableCount: 100 },
      { id: 2, name: "Standard", price: 64800, description: "Accès à toutes les conférences", availableCount: 300 },
      { id: 3, name: "Virtual", price: 32100, description: "Accès en ligne à toutes les conférences", availableCount: 1000 }
    ]
  },
  {
    id: 3,
    title: "Concert Rock Legends",
    description: "Une soirée exceptionnelle avec les plus grandes légendes du rock. Un spectacle inoubliable avec effets spéciaux et son immersif.",
    imageUrl: "https://images.unsplash.com/photo-1501612780327-45045538702b?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fHJvY2slMjBjb25jZXJ0fGVufDB8fDB8fHww",
    date: "2023-10-10",
    venue: "Stade National",
    category: "Concert",
    organizer: "Live Music Productions",
    year: 2023,
    rating: "4.9",
    duration: "3 heures",
    categories: [
      { id: 1, name: "Golden Circle", price: 163800, description: "Debout devant la scène", availableCount: 200 },
      { id: 2, name: "Tribune", price: 98300, description: "Place assise en tribune", availableCount: 5000 },
      { id: 3, name: "Pelouse", price: 52400, description: "Accès à la pelouse", availableCount: 10000 }
    ]
  },
  {
    id: 4,
    title: "Formation Marketing Digital",
    description: "Apprenez les techniques avancées du marketing digital avec des experts du domaine. Formation certifiante avec ateliers pratiques.",
    imageUrl: "https://images.unsplash.com/photo-1551150441-3f3828204ef0?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8ZGlnaXRhbCUyMG1hcmtldGluZ3xlbnwwfHwwfHx8MA%3D%3D",
    date: "2023-11-05",
    venue: "Campus Numérique",
    category: "Formation",
    organizer: "Digital Academy",
    year: 2023,
    rating: "4.7",
    duration: "2 jours",
    categories: [
      { id: 1, name: "Professionnel", price: 295000, description: "Formation complète + certification", availableCount: 50 },
      { id: 2, name: "Standard", price: 229000, description: "Formation complète", availableCount: 100 },
      { id: 3, name: "Étudiant", price: 131000, description: "Tarif étudiant avec justificatif", availableCount: 30 }
    ]
  },
  {
    id: 5,
    title: "Spectacle de Magie",
    description: "Un spectacle de magie et d'illusion qui défiera votre perception de la réalité. Des tours époustouflants et des moments interactifs.",
    imageUrl: "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8bWFnaWMlMjBzaG93fGVufDB8fDB8fHww",
    date: "2023-12-15",
    venue: "Théâtre Municipal",
    category: "Spectacle",
    organizer: "Illusion Productions",
    year: 2023,
    rating: "4.6",
    duration: "2 heures",
    categories: [
      { id: 1, name: "VIP", price: 65500, description: "Premier rang + rencontre avec le magicien", availableCount: 20 },
      { id: 2, name: "Orchestre", price: 42600, description: "Places orchestre", availableCount: 200 },
      { id: 3, name: "Balcon", price: 29500, description: "Places balcon", availableCount: 150 }
    ]
  },
  {
    id: 6,
    title: "Match de Football - Finale",
    description: "Assistez à la finale du championnat national de football. Un match décisif entre les deux meilleures équipes du pays.",
    imageUrl: "https://images.unsplash.com/photo-1570498839593-e565b39455fc?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8Zm9vdGJhbGwlMjBzdGFkaXVtfGVufDB8fDB8fHww",
    date: "2024-01-20",
    venue: "Grand Stade",
    category: "Sport",
    organizer: "Ligue Nationale",
    year: 2024,
    rating: "4.9",
    duration: "2 heures",
    categories: [
      { id: 1, name: "Loge", price: 196500, description: "Loge privative avec service", availableCount: 10 },
      { id: 2, name: "Tribune Centrale", price: 98300, description: "Place en tribune centrale", availableCount: 2000 },
      { id: 3, name: "Tribune Latérale", price: 52400, description: "Place en tribune latérale", availableCount: 5000 }
    ]
  },
  {
    id: 7,
    title: "Pièce de Théâtre Classique",
    description: "Une interprétation moderne d'un classique du théâtre par une troupe renommée. Une mise en scène innovante et des performances remarquables.",
    imageUrl: "https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8dGhlYXRlciUyMHBlcmZvcm1hbmNlfGVufDB8fDB8fHww",
    date: "2024-02-10",
    venue: "Théâtre National",
    category: "Théâtre",
    organizer: "Compagnie Dramatique",
    year: 2024,
    rating: "4.8",
    duration: "2.5 heures",
    categories: [
      { id: 1, name: "Carré Or", price: 55700, description: "Meilleures places centrales", availableCount: 100 },
      { id: 2, name: "Catégorie 1", price: 42600, description: "Places de catégorie 1", availableCount: 200 },
      { id: 3, name: "Catégorie 2", price: 29500, description: "Places de catégorie 2", availableCount: 300 }
    ]
  },
  {
    id: 8,
    title: "Exposition d'Art Contemporain",
    description: "Découvrez les œuvres avant-gardistes d'artistes contemporains internationaux. Une exposition unique qui repousse les limites de l'art.",
    imageUrl: "https://images.unsplash.com/photo-1501084817091-a4f3d1d19e07?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGFydCUyMGV4aGliaXRpb258ZW58MHx8MHx8fDA%3D",
    date: "2024-03-15",
    venue: "Musée d'Art Moderne",
    category: "Exposition",
    organizer: "Arts & Culture Foundation",
    year: 2024,
    rating: "4.7",
    duration: "Accès journée",
    categories: [
      { id: 1, name: "Premium", price: 16400, description: "Accès à l'exposition + audio guide + catalogue", availableCount: 200 },
      { id: 2, name: "Standard", price: 9830, description: "Accès à l'exposition", availableCount: 500 },
      { id: 3, name: "Réduit", price: 6550, description: "Tarif réduit (étudiants, seniors)", availableCount: 300 }
    ]
  }
];

export const getEventById = (id: number): Event | undefined => {
  return mockEvents.find(event => event.id === id);
};

export const getEventsByCategory = (category: string): Event[] => {
  return mockEvents.filter(event => event.category === category);
};

export const searchEvents = (query: string): Event[] => {
  const lowerQuery = query.toLowerCase();
  return mockEvents.filter(
    event => 
      event.title.toLowerCase().includes(lowerQuery) || 
      event.description.toLowerCase().includes(lowerQuery) ||
      event.category.toLowerCase().includes(lowerQuery) ||
      event.venue.toLowerCase().includes(lowerQuery)
  );
};