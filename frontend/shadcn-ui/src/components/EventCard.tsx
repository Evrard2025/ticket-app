import React from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Ticket } from 'lucide-react';

// Utiliser l'interface Event de mock-data.ts
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

interface EventCardProps {
  event: Event;
  size?: 'small' | 'large';
}

const EventCard = ({ event, size = 'small' }: EventCardProps) => {
  const { id, title, description, date, venue, category, imageUrl, categories } = event;
  
  const formatDate = (dateString: string) => {
    if (!dateString) return 'Date non disponible';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return 'Prix non disponible';
    }
    return `${amount.toLocaleString()} FCFA`;
  };

  // Calculer le prix minimum et maximum
  const prices = categories?.map(cat => cat.price) || [];
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const totalAvailableTickets = categories?.reduce((sum, cat) => sum + cat.availableCount, 0) || 0;

  // Vérifications de sécurité pour les propriétés
  const safeTitle = title || 'Titre non disponible';
  const safeVenue = venue || 'Lieu non disponible';
  const safeCategory = category || 'Catégorie non disponible';
  const safeImageUrl = imageUrl || '/placeholder-event.jpg';

  // Different layout based on size
  if (size === 'large') {
    return (
      <Link to={`/event/${id}`}>
        <Card className="overflow-hidden border-0 bg-transparent hover:scale-105 transition-all duration-300 group cursor-pointer">
          <div className="relative aspect-video">
            <img 
              src={safeImageUrl} 
              alt={safeTitle} 
              className="w-full h-full object-cover rounded-md group-hover:brightness-75 transition-all"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-80"></div>
            <div className="absolute bottom-4 left-4 right-4">
              <h3 className="text-2xl font-bold text-white">{safeTitle}</h3>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-red-600 hover:bg-red-700 text-white">
                  {safeCategory}
                </Badge>
                <span className="text-sm text-gray-300">{totalAvailableTickets} places disponibles</span>
              </div>
              <div className="mt-2 text-sm text-gray-300">
                {formatDate(date)} • {safeVenue}
              </div>
              <div className="mt-2 text-sm font-medium text-white">
                À partir de {formatCurrency(minPrice)}
              </div>
            </div>
          </div>
        </Card>
      </Link>
    );
  }

  // Small card (default)
  return (
    <Link to={`/event/${id}`}>
      <Card className="overflow-hidden border-0 bg-transparent hover:scale-105 transition-all duration-300 group cursor-pointer">
        <div className="relative aspect-[2/3]">
          <img 
            src={safeImageUrl} 
            alt={safeTitle} 
            className="w-full h-full object-cover rounded-md group-hover:brightness-75 transition-all"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent opacity-80"></div>
          <div className="absolute bottom-2 left-2 right-2">
            <h3 className="text-base font-bold text-white line-clamp-2">{safeTitle}</h3>
            <div className="flex items-center gap-1 mt-1">
              <Badge variant="secondary" className="bg-red-600 hover:bg-red-700 text-white text-xs">
                {safeCategory}
              </Badge>
              <span className="text-xs text-gray-300">{totalAvailableTickets} places</span>
            </div>
            <div className="mt-1 text-xs text-gray-300">
              {formatDate(date)}
            </div>
            <div className="mt-1 text-xs font-medium text-white">
              {formatCurrency(minPrice)}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default EventCard;