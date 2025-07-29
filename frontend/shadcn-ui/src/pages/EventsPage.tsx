import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import EventCard from '@/components/EventCard';
import Layout from '@/components/layout/Layout';
import { api } from '@/lib/api';
import { Event } from '@/lib/mock-data';

const EventsPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const categoryParam = queryParams.get('category');
  
  const [events, setEvents] = useState<Event[]>([]);
  const [allEvents, setAllEvents] = useState<Event[]>([]); // Garder tous les événements pour le filtrage
  const [categories, setCategories] = useState<string[]>([]); // Catégories dynamiques
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  
  useEffect(() => {
    setLoading(true);
    api.get<Event[]>('/events')
      .then((data) => {
        setAllEvents(data);
        setEvents(data);
        
        // Récupérer les catégories uniques depuis les événements
        const uniqueCategories = [...new Set(data.map(event => event.category))];
        setCategories(uniqueCategories);
        
        setError('');
      })
      .catch(() => setError('Erreur lors du chargement des événements.'))
      .finally(() => setLoading(false));
  }, []);
  
  useEffect(() => {
    filterAndSortEvents();
  }, [selectedCategory, sortBy, searchQuery, allEvents]);
  
  const filterAndSortEvents = () => {
    let filteredEvents = [...allEvents];
    
    // Filter by category
    if (selectedCategory) {
      filteredEvents = filteredEvents.filter(event => event.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filteredEvents = filteredEvents.filter(
        event => 
          event.title.toLowerCase().includes(query) || 
          event.description.toLowerCase().includes(query) ||
          event.venue.toLowerCase().includes(query)
      );
    }
    
    // Sort events
    switch (sortBy) {
      case 'date':
        filteredEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        break;
      case 'price-low':
        filteredEvents.sort((a, b) => {
          const aMinPrice = Math.min(...(a.categories || []).map(cat => cat.price));
          const bMinPrice = Math.min(...(b.categories || []).map(cat => cat.price));
          return aMinPrice - bMinPrice;
        });
        break;
      case 'price-high':
        filteredEvents.sort((a, b) => {
          const aMaxPrice = Math.max(...(a.categories || []).map(cat => cat.price));
          const bMaxPrice = Math.max(...(b.categories || []).map(cat => cat.price));
          return bMaxPrice - aMaxPrice;
        });
        break;
      case 'rating':
        filteredEvents.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        break;
      default:
        break;
    }
    
    setEvents(filteredEvents);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value === 'all' ? '' : value);
    // Update URL
    const newUrl = value === 'all' 
      ? '/events'
      : `/events?category=${encodeURIComponent(value)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  if (loading) return (
    <Layout>
      <div className="text-center text-gray-900 dark:text-gray-100 py-10">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-gray-100 mx-auto mb-4"></div>
        Chargement...
      </div>
    </Layout>
  );
  
  if (error) return (
    <Layout>
      <div className="text-center text-red-600 dark:text-red-400 py-10">{error}</div>
    </Layout>
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-gray-100">
          {selectedCategory ? `Événements : ${selectedCategory}` : 'Tous les événements'}
        </h1>
        
        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Select value={selectedCategory || 'all'} onValueChange={handleCategoryChange}>
            <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
              <SelectValue placeholder="Toutes les catégories" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectItem value="all" className="text-gray-900 dark:text-gray-100">Toutes les catégories</SelectItem>
              {categories.map((category, index) => (
                <SelectItem key={index} value={category} className="text-gray-900 dark:text-gray-100">
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectItem value="date" className="text-gray-900 dark:text-gray-100">Date (croissant)</SelectItem>
              <SelectItem value="price-low" className="text-gray-900 dark:text-gray-100">Prix (croissant)</SelectItem>
              <SelectItem value="price-high" className="text-gray-900 dark:text-gray-100">Prix (décroissant)</SelectItem>
              <SelectItem value="rating" className="text-gray-900 dark:text-gray-100">Note</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="relative">
            <Input
              type="text"
              placeholder="Rechercher dans les résultats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
        </div>
        
        {/* Events Grid */}
        {events.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun événement ne correspond à vos critères</p>
            <Button 
              onClick={() => {
                setSelectedCategory('');
                setSearchQuery('');
                setSortBy('date');
              }}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Réinitialiser les filtres
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {events.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventsPage;