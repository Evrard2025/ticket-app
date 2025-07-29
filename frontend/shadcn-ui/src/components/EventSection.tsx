import React from 'react';
import { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import EventCard from './EventCard';
import { Event } from '@/lib/mock-data';

interface EventSectionProps {
  title: string;
  events: Event[];
  showAll?: () => void;
}

const EventSection = ({ title, events, showAll }: EventSectionProps) => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const itemWidth = 240; // Approximate width of each item with margin
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  const scroll = (direction: 'left' | 'right') => {
    const container = containerRef.current;
    if (container) {
      const scrollAmount = direction === 'left' ? -itemWidth * 3 : itemWidth * 3;
      const newPosition = scrollPosition + scrollAmount;
      
      container.scrollTo({
        left: newPosition,
        behavior: 'smooth'
      });
      
      setScrollPosition(newPosition);
    }
  };

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          {showAll && (
            <Button 
              variant="ghost" 
              className="text-gray-400 hover:text-white"
              onClick={showAll}
            >
              Voir tout
            </Button>
          )}
        </div>
        
        <div className="relative">
          <div 
            ref={containerRef}
            className="flex overflow-x-auto gap-4 scrollbar-hide pb-4 scroll-smooth"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {events.map((event) => (
              <div 
                key={event.id} 
                className="flex-shrink-0 w-60"
              >
                <EventCard event={event} />
              </div>
            ))}
          </div>
          
          <Button 
            variant="secondary"
            size="icon"
            className="absolute left-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full h-10 w-10"
            onClick={() => scroll('left')}
          >
            <ChevronLeft className="h-6 w-6" />
          </Button>
          
          <Button 
            variant="secondary"
            size="icon"
            className="absolute right-0 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-70 rounded-full h-10 w-10"
            onClick={() => scroll('right')}
          >
            <ChevronRight className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default EventSection;