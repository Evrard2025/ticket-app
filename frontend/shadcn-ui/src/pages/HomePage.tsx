import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import EventCard from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, MapPin, Music, Film, Users, Gamepad2, GraduationCap, Theater, Palette, ChevronLeft, ChevronRight, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { Event, eventCategories } from '@/lib/mock-data';

const categories = [
  { id: 'Concert', name: 'Concert', icon: Music, color: 'bg-red-500' },
  { id: 'Festival', name: 'Festival', icon: Music, color: 'bg-orange-500' },
  { id: 'Conférence', name: 'Conférence', icon: Users, color: 'bg-blue-500' },
  { id: 'Formation', name: 'Formation', icon: GraduationCap, color: 'bg-green-500' },
  { id: 'Spectacle', name: 'Spectacle', icon: Theater, color: 'bg-purple-500' },
  { id: 'Sport', name: 'Sport', icon: Gamepad2, color: 'bg-indigo-500' },
  { id: 'Théâtre', name: 'Théâtre', icon: Theater, color: 'bg-pink-500' },
  { id: 'Exposition', name: 'Exposition', icon: Palette, color: 'bg-yellow-500' },
];

export default function HomePage() {
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        
        // Calculer les dates pour les événements récents (72h à venir)
        const now = new Date();
        const in72Hours = new Date(now.getTime() + (72 * 60 * 60 * 1000));
        
        const [featuredResponse, recentResponse] = await Promise.all([
          api.get('/events?minRating=3.5&limit=6'), // Événements avec note > 3.5
          api.get(`/events?startDate=${now.toISOString()}&endDate=${in72Hours.toISOString()}&sort=date&limit=6`) // Événements dans les 72h
        ]);

        // S'assurer que les données sont des tableaux
        setFeaturedEvents(Array.isArray(featuredResponse) ? featuredResponse : []);
        setRecentEvents(Array.isArray(recentResponse) ? recentResponse : []);
      } catch (err) {
        setError('Erreur lors du chargement des événements');
        console.error('Error fetching events:', err);
        // En cas d'erreur, initialiser avec des tableaux vides
        setFeaturedEvents([]);
        setRecentEvents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Auto-play du carousel
  useEffect(() => {
    if (featuredEvents.length > 0) {
      const interval = setInterval(() => {
        setCurrentSlide((prev) => (prev + 1) % Math.min(4, featuredEvents.length));
      }, 5000); // Change de slide toutes les 5 secondes

      return () => clearInterval(interval);
    }
  }, [featuredEvents.length]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + featuredEvents.length) % featuredEvents.length);
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 dark:border-[#e50914] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement des événements...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-screen bg-white dark:bg-black flex items-center justify-center">
          <div className="text-center">
            <p className="text-red-600 dark:text-[#e50914] mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f] text-white">
              Réessayer
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Hero Section avec Header moderne */}
      <section className="relative min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        {/* Background Image dynamique avec overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-1000 ease-in-out"
          style={{
            backgroundImage: featuredEvents && featuredEvents.length > 0 
              ? `url('${featuredEvents[currentSlide]?.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80'}')`
              : `url('https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-black/60"></div>
        </div>



        {/* Contenu principal */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pt-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center min-h-[calc(100vh-6rem)]">
            {/* Section gauche - Texte principal */}
            <div className="text-white">
              {/*
              <div className="mb-4">
                <p className="text-orange-400 font-medium">Paris - France</p>
              </div>
              */}
              <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
                DÉCOUVREZ DES<br />
                ÉVÉNEMENTS<br />
                INOUBLIABLES
              </h1>
              <p className="text-lg text-gray-300 mb-8 leading-relaxed">
                Réservez vos billets pour les meilleurs concerts, films, sports et plus encore. 
                Vivez des moments exceptionnels avec TicketFlix.
              </p>
              
              {/* Boutons d'action */}
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 text-lg font-semibold rounded-lg flex items-center space-x-2"
                >
                  <div className="w-4 h-4 border-l-2 border-t-2 border-white transform rotate-45"></div>
                  <span>RÉSERVER MAINTENANT</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-lg"
                >
                  TOUS LES ÉVÉNEMENTS
                </Button>
              </div>
            </div>

            {/* Section droite - Carousel d'événements */}
            <div className="relative">
              {featuredEvents && featuredEvents.length > 0 ? (
                <div className="relative">
                  {/* Carousel principal */}
                  <div className="relative overflow-hidden rounded-2xl">
                    <div 
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                    >
                      {featuredEvents.slice(0, 4).map((event, index) => (
                        <div key={event.id} className="w-full flex-shrink-0">
                          <div className="relative h-[28rem] rounded-2xl overflow-hidden">
                            <img 
                              src={event.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'} 
                              alt={event.title}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                            <div className="absolute bottom-6 left-6 right-6 text-white">
                              <p className="text-orange-400 text-sm font-medium mb-2">
                                {event.venue} - {event.category}
                              </p>
                              <h3 className="text-2xl font-bold mb-2">{event.title}</h3>
                              <p className="text-gray-300 text-sm line-clamp-2">{event.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                                         {/* Navigation du carousel */}
                     <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center space-x-4">
                       <button
                         onClick={prevSlide}
                         className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                       >
                         <ChevronLeft className="h-5 w-5" />
                       </button>
                       
                       {/* Indicateurs de slide */}
                       <div className="flex items-center space-x-2">
                         {Array.from({ length: Math.min(4, featuredEvents.length) }).map((_, index) => (
                           <button
                             key={index}
                             onClick={() => setCurrentSlide(index)}
                             className={`w-2 h-2 rounded-full transition-all duration-300 ${
                               index === currentSlide ? 'bg-orange-500 w-6' : 'bg-white/50 hover:bg-white/70'
                             }`}
                           />
                         ))}
                       </div>
                       
                       <div className="flex items-center space-x-2">
                         <div className="w-16 h-1 bg-white/30 rounded-full">
                           <div 
                             className="h-full bg-orange-500 rounded-full transition-all duration-300"
                             style={{ width: `${((currentSlide + 1) / Math.min(4, featuredEvents.length)) * 100}%` }}
                           ></div>
                         </div>
                         <span className="text-white text-sm font-medium">
                           {String(currentSlide + 1).padStart(2, '0')}
                         </span>
                       </div>
                       
                       <button
                         onClick={nextSlide}
                         className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                       >
                         <ChevronRight className="h-5 w-5" />
                       </button>
                     </div>
                  </div>
                </div>
              ) : (
                <div className="h-[28rem] bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <p className="text-white text-lg">Aucun événement en vedette</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-gray-50 dark:bg-[#141414]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
            Explorez par catégorie
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                to={`/events?category=${category.id}`}
                className="group bg-white dark:bg-[#181818] rounded-lg p-6 text-center hover:shadow-lg dark:hover:shadow-2xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-800"
              >
                <div className={`w-16 h-16 ${category.color} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                  <category.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-[#e50914] transition-colors">
                  {category.name}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>



      {/* Section "Populaire cette semaine" */}
      <section className="py-16 bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-8">POPULAIRE CETTE SEMAINE</h2>
          
          {featuredEvents && featuredEvents.length > 0 ? (
            <div className="relative">
              <div className="flex space-x-4 overflow-x-auto pb-4 scrollbar-hide">
                {featuredEvents.slice(0, 6).map((event) => (
                  <div key={event.id} className="flex-shrink-0 w-64 group">
                    <div className="relative overflow-hidden rounded-lg">
                      <img 
                        src={event.imageUrl || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?ixlib=rb-4.0.3&auto=format&fit=crop&w=2070&q=80'} 
                        alt={event.title}
                        className="w-full h-40 object-cover group-hover:scale-110 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute bottom-3 left-3 right-3 text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-sm font-medium mb-1">{event.title}</p>
                        <p className="text-xs text-gray-300">{event.venue}</p>
                        <p className="text-xs text-orange-400">Note: {event.rating}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Navigation du carousel horizontal */}
              <div className="absolute top-1/2 -translate-y-1/2 left-0 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/20 cursor-pointer">
                <ChevronLeft className="h-6 w-6" />
              </div>
              <div className="absolute top-1/2 -translate-y-1/2 right-0 w-12 h-12 bg-black/50 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-black/70 transition-colors border border-white/20 cursor-pointer">
                <ChevronRight className="h-6 w-6" />
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-white/70 text-lg">Aucun événement populaire pour le moment</p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Events */}
      <section className="py-16 bg-gray-50 dark:bg-[#141414]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Événements à venir
            </h2>
            <Link to="/events">
              <Button variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#181818] hover:border-red-500 dark:hover:border-[#e50914]">
                Voir tous les événements
              </Button>
            </Link>
          </div>
          
          {recentEvents && recentEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {recentEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Aucun événement dans les 72h à venir
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-red-600 to-red-800 dark:from-[#e50914] dark:to-[#b0060f] text-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Prêt à vivre des moments inoubliables ?
          </h2>
          <p className="text-xl mb-8 text-red-100 dark:text-red-200">
            Rejoignez des milliers d'utilisateurs qui font confiance à TicketFlix
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/events">
              <Button className="bg-white dark:bg-[#181818] text-red-600 dark:text-[#e50914] hover:bg-gray-100 dark:hover:bg-[#222] font-semibold px-8 py-3 text-lg">
                Découvrir les événements
              </Button>
            </Link>
            <Link to="/signup">
              <Button variant="outline" className="border-white dark:border-white text-white hover:bg-white hover:text-red-600 dark:hover:bg-white dark:hover:text-[#e50914] font-semibold px-8 py-3 text-lg">
                Créer un compte
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </Layout>
  );
}