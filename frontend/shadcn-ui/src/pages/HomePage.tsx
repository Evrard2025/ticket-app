import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '@/components/layout/Layout';
import EventCard from '@/components/EventCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Calendar, MapPin, Music, Film, Users, Gamepad2, GraduationCap, Theater, Palette } from 'lucide-react';
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

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        const [featuredResponse, recentResponse] = await Promise.all([
          api.get('/events?featured=true&limit=6'),
          api.get('/events?sort=date&limit=6')
        ]);

        // S'assurer que les données sont des tableaux
        setFeaturedEvents(Array.isArray(featuredResponse.data) ? featuredResponse.data : []);
        setRecentEvents(Array.isArray(recentResponse.data) ? recentResponse.data : []);
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

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
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
      {/* Hero Section */}
      <section className="relative bg-gradient-to-r from-red-600 to-red-800 dark:from-[#e50914] dark:to-[#b0060f] text-white py-20">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Découvrez des événements incroyables
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-red-100 dark:text-red-200">
              Réservez vos billets pour les meilleurs concerts, films, sports et plus encore
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
              <div className="relative flex items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5 z-10" />
                  <Input
                    type="text"
                    placeholder="Rechercher des événements..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 pr-32 py-4 text-lg bg-white dark:bg-[#181818] border-0 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:ring-2 focus:ring-white dark:focus:ring-[#e50914] rounded-lg"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="absolute right-2 bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f] text-white px-6 py-2 rounded-md h-[calc(100%-16px)] top-2"
                >
                  Rechercher
                </Button>
              </div>
            </form>
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

      {/* Featured Events */}
      <section className="py-16 bg-white dark:bg-black">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Événements en vedette
            </h2>
            <Link to="/events">
              <Button variant="outline" className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#181818] hover:border-red-500 dark:hover:border-[#e50914]">
                Voir tous les événements
              </Button>
            </Link>
          </div>
          
          {featuredEvents && featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Aucun événement en vedette pour le moment
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Recent Events */}
      <section className="py-16 bg-gray-50 dark:bg-[#141414]">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              Événements récents
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
                Aucun événement récent pour le moment
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