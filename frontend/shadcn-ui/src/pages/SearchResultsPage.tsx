import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockEvents, searchEvents, eventCategories } from '@/lib/mock-data';
import EventCard from '@/components/EventCard';
import Layout from '@/components/layout/Layout';

const SearchResultsPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const initialQuery = queryParams.get('q') || '';
  
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [results, setResults] = useState(initialQuery ? searchEvents(initialQuery) : mockEvents);
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  useEffect(() => {
    if (initialQuery) {
      setResults(searchEvents(initialQuery));
    }
  }, [initialQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update URL without reloading the page
    const newUrl = `/search?q=${encodeURIComponent(searchQuery)}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
    
    // Filter results
    setResults(searchQuery ? searchEvents(searchQuery) : mockEvents);
    setSelectedCategory('all');
  };

  const filterResultsByCategory = (category: string) => {
    setSelectedCategory(category);
    
    if (category === 'all') {
      setResults(searchQuery ? searchEvents(searchQuery) : mockEvents);
    } else {
      const filtered = (searchQuery ? searchEvents(searchQuery) : mockEvents)
        .filter(event => event.category === category);
      setResults(filtered);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100">
          {initialQuery 
            ? `Résultats pour "${initialQuery}"`
            : 'Tous les événements'}
        </h1>
        
        {/* Search Form */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 mb-8">
          <CardContent className="pt-6">
            <form onSubmit={handleSearch} className="flex gap-2">
              <Input 
                type="text" 
                placeholder="Rechercher des événements, artistes, lieux..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
              <Button type="submit" className="bg-red-600 hover:bg-red-700 text-white">
                <Search className="mr-2 h-4 w-4" /> Rechercher
              </Button>
            </form>
          </CardContent>
        </Card>
        
        {/* Category Tabs */}
        <Tabs 
          defaultValue="all" 
          value={selectedCategory} 
          onValueChange={filterResultsByCategory}
          className="mb-8"
        >
          <TabsList className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <TabsTrigger value="all" className="text-gray-900 dark:text-gray-100 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700">Tous</TabsTrigger>
            {eventCategories.map((category, index) => (
              <TabsTrigger key={index} value={category} className="text-gray-900 dark:text-gray-100 data-[state=active]:bg-gray-100 dark:data-[state=active]:bg-gray-700">
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
        
        {/* Results */}
        {results.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 dark:text-gray-400 mb-4">Aucun événement trouvé pour votre recherche</p>
            <Button onClick={() => navigate('/events')} className="bg-red-600 hover:bg-red-700 text-white">
              Voir tous les événements
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {results.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SearchResultsPage;