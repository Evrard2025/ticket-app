import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, User, Clock, Star, Plus, Minus, CreditCard, RefreshCw, Smartphone, Wallet, Lock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import EventCard from '@/components/EventCard';
import { Event, TicketCategory } from '@/lib/mock-data';
import { OrderResponse, YengaPayResponse } from '@/types/api';

interface StockInfo {
  id: number;
  category: string;
  price: number;
  totalStock: number;
  availableStock: number;
}

interface StockCheckResponse {
  ticketId: number;
  totalStock: number;
  soldQuantity: number;
  availableStock: number;
  requestedQuantity: number;
  canPurchase: boolean;
  remainingAfterPurchase: number;
}

const EventDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  const eventId = parseInt(id || '1');
  const [event, setEvent] = useState<Event | null>(null);
  const [relatedEvents, setRelatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [processingPayment, setProcessingPayment] = useState(false);
  
  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<Event>(`/events/${eventId}`),
      api.get<Event[]>('/events')
    ])
      .then(([eventData, allEventsData]) => {
        setEvent(eventData);
        
        // Filtrer les événements similaires (même catégorie, exclure l'événement actuel)
        const similar = allEventsData
          .filter((e: Event) => e.id !== eventId && e.category === eventData.category)
          .slice(0, 4); // Limiter à 4 événements similaires
        setRelatedEvents(similar);
        
        setError('');
      })
      .catch(() => setError('Erreur lors du chargement de l\'événement.'))
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (event && Array.isArray(event.categories) && event.categories.length > 0) {
      setSelectedCategory(event.categories[0]);
    } else {
      setSelectedCategory(null);
    }
  }, [event]);

  // Fonction pour récupérer le stock en temps réel
  const refreshStock = async () => {
    if (!event) return;
    
    try {
      const stockResponse = await api.get<StockInfo[]>(`/events/${event.id}/stock`);
      const stockData = stockResponse;
      
      // Mettre à jour le stock dans l'événement
      setEvent(prevEvent => {
        if (!prevEvent) return prevEvent;
        
        return {
          ...prevEvent,
          categories: prevEvent.categories?.map(category => {
            const stockInfo = stockData.find((s: StockInfo) => s.id === category.id);
            return stockInfo ? {
              ...category,
              availableCount: stockInfo.availableStock,
              totalStock: stockInfo.totalStock
            } : category;
          })
        };
      });
    } catch (error) {
      console.error('Erreur lors de la récupération du stock:', error);
    }
  };

  // Vérifier le stock avant d'ajouter au panier
  const checkStockBeforePurchase = async (ticketId: number, quantity: number) => {
    try {
      const response = await api.get<StockCheckResponse>(`/orders/check-stock/${ticketId}?quantity=${quantity}`);
      return response.canPurchase;
    } catch (error) {
      console.error('Erreur lors de la vérification du stock:', error);
      return false;
    }
  };

  if (loading) return <Layout><div className="text-center text-white py-10">Chargement...</div></Layout>;
  if (error) return <Layout><div className="text-center text-red-500 py-10">{error}</div></Layout>;
  if (!event) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <h1 className="text-3xl font-bold">Événement non trouvé</h1>
          <Button className="mt-4" onClick={() => navigate('/events')}>
            Retour aux événements
          </Button>
        </div>
      </Layout>
    );
  }

  const handleAddToCart = async () => {
    if (!selectedCategory || !event) return;
    
    if (!isAuthenticated) {
      navigate('/login', { state: { redirect: `/event/${event.id}` } });
      return;
    }

    // Vérifier le stock avant l'ajout au panier
    const canPurchase = await checkStockBeforePurchase(selectedCategory.id, quantity);
    if (!canPurchase) {
      alert('Stock insuffisant. Veuillez réduire la quantité ou choisir une autre catégorie.');
      await refreshStock();
      return;
    }
    
    addToCart(event, selectedCategory, quantity);
    navigate('/cart');
  };

  // Nouvelle fonction pour le paiement YengaPay
  const handleYengaPayPayment = async () => {
    console.log('🔍 handleYengaPayPayment appelé');
    console.log('📊 État actuel:', {
      selectedCategory,
      event,
      user,
      isAuthenticated,
      quantity
    });
    
    if (!selectedCategory || !event || !user) {
      console.error('❌ Données manquantes:', {
        hasSelectedCategory: !!selectedCategory,
        hasEvent: !!event,
        hasUser: !!user
      });
      
      if (!user) {
        console.log('🔀 Redirection vers la page de connexion...');
        alert('Vous devez être connecté pour effectuer un paiement. Redirection vers la page de connexion.');
        navigate('/login', { state: { redirect: `/event/${event?.id || 'unknown'}` } });
        return;
      }
      
      alert('Erreur: Données manquantes pour le paiement');
      return;
    }

    console.log('🔍 Début paiement YengaPay');
    console.log('👤 Utilisateur:', user);
    console.log('🎫 Catégorie sélectionnée:', selectedCategory);
    console.log('📅 Événement:', event);
    
    if (!isAuthenticated) {
      console.log('❌ Utilisateur non authentifié, redirection vers login');
      navigate('/login', { state: { redirect: `/event/${event.id}` } });
      return;
    }

    // Vérifier le stock avant le paiement
    console.log('🔍 Vérification du stock...');
    const canPurchase = await checkStockBeforePurchase(selectedCategory.id, quantity);
    if (!canPurchase) {
      console.log('❌ Stock insuffisant');
      alert('Stock insuffisant. Veuillez réduire la quantité ou choisir une autre catégorie.');
      await refreshStock();
      return;
    }

    console.log('✅ Stock vérifié, début du traitement du paiement');
    setProcessingPayment(true);
    
    try {
      // Créer une commande
      const orderData = {
        utilisateur_id: user.id,
        ticket_id: selectedCategory.id,
        quantite: quantity,
        total: selectedCategory.price * quantity,
        statut: 'pending'
      };
      
      console.log('📋 Données de commande:', orderData);
      
      const orderResponse = await api.post('/orders', orderData);
      console.log('✅ Réponse création commande:', orderResponse);

      const order = orderResponse as OrderResponse;
      console.log('📋 Commande créée:', order);

      // Créer un paiement YengaPay
      const yengaPayData = { order_id: order.id };
      console.log('💳 Données YengaPay:', yengaPayData);
      
      const yengaPayResponse = await api.post('/payment/yengapay', yengaPayData);
      console.log('✅ Réponse YengaPay:', yengaPayResponse);

      const yengaPayment = yengaPayResponse as YengaPayResponse;

      // Rediriger vers l'URL de paiement YengaPay
      if (yengaPayment.yengapayData?.checkoutPageUrlWithPaymentToken) {
        console.log('🔗 Redirection vers:', yengaPayment.yengapayData.checkoutPageUrlWithPaymentToken);
        window.location.href = yengaPayment.yengapayData.checkoutPageUrlWithPaymentToken;
      } else if (yengaPayment.yengapayData?.paymentUrl) {
        // Fallback pour l'ancien format
        console.log('🔗 Redirection vers (fallback):', yengaPayment.yengapayData.paymentUrl);
        window.location.href = yengaPayment.yengapayData.paymentUrl;
      } else {
        console.error('❌ URL de paiement manquante:', yengaPayment);
        alert('Erreur lors de la création du paiement YengaPay. Veuillez réessayer.');
      }

    } catch (error: unknown) {
      console.error('❌ Erreur lors du paiement YengaPay:', error);
      
      // Afficher plus de détails sur l'erreur
      if (error instanceof Error) {
        console.error('📋 Message d\'erreur:', error.message);
        console.error('📋 Stack trace:', error.stack);
      }
      
      // Si c'est une erreur de réponse API
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { status?: number; data?: unknown; headers?: unknown } };
        console.error('📋 Status:', apiError.response?.status);
        console.error('📋 Data:', apiError.response?.data);
        console.error('📋 Headers:', apiError.response?.headers);
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du paiement. Veuillez réessayer.';
      alert(`Erreur YengaPay: ${errorMessage}\n\nVérifiez la console pour plus de détails.`);
    } finally {
      setProcessingPayment(false);
    }
  };
  
  const incrementQuantity = () => {
    const max = selectedCategory?.availableCount || 10;
    if (quantity < max) setQuantity(quantity + 1);
  };
  
  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="relative h-[40vh] sm:h-[50vh] lg:h-[70vh]">
        <img 
          src={event.imageUrl} 
          alt={event.title}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent opacity-90"></div>
      </div>
      
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-8 -mt-16 lg:-mt-32 relative z-10">
          {/* Event Info */}
          <div className="lg:col-span-2">
            <div className="bg-gray-900 rounded-lg p-4 sm:p-6 shadow-xl">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <h1 className="text-2xl sm:text-3xl font-bold text-white">{event.title}</h1>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-3 text-gray-300 text-sm">
                    <Badge variant="secondary" className="bg-red-600 text-white border-red-600">
                      {event.category}
                    </Badge>
                    <div className="flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-1" />
                      <span>{event.rating}</span>
                    </div>
                    <span>{event.year}</span>
                    <span>{event.duration}</span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-4 text-gray-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span>{formatDate(event.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span>{event.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5 text-gray-400 flex-shrink-0" />
                  <span>Organisé par {event.organizer}</span>
                </div>
              </div>
              
              <Tabs defaultValue="description" className="mt-6">
                <TabsList className="grid grid-cols-3 bg-gray-800 w-full">
                  <TabsTrigger value="description" className="text-xs sm:text-sm">Description</TabsTrigger>
                  <TabsTrigger value="details" className="text-xs sm:text-sm">Détails</TabsTrigger>
                  <TabsTrigger value="organizer" className="text-xs sm:text-sm">Organisateur</TabsTrigger>
                </TabsList>
                <TabsContent value="description" className="p-4 bg-gray-800 rounded-b-lg mt-1">
                  <p className="text-gray-300 text-sm sm:text-base">{event.description}</p>
                </TabsContent>
                <TabsContent value="details" className="p-4 bg-gray-800 rounded-b-lg mt-1">
                  <div className="space-y-2 text-gray-300 text-sm sm:text-base">
                    <p><strong>Date:</strong> {formatDate(event.date)}</p>
                    <p><strong>Lieu:</strong> {event.venue}</p>
                    <p><strong>Durée:</strong> {event.duration}</p>
                    <p><strong>Catégorie:</strong> {event.category}</p>
                  </div>
                </TabsContent>
                <TabsContent value="organizer" className="p-4 bg-gray-800 rounded-b-lg mt-1">
                  <div className="space-y-2 text-gray-300 text-sm sm:text-base">
                    <p><strong>Organisateur:</strong> {event.organizer}</p>
                    <p>Informations supplémentaires sur l'organisateur de l'événement.</p>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          
          {/* Ticket Selection and Purchase */}
          <div className="order-first lg:order-last">
            <Card className="bg-gray-900 shadow-xl border-0 sticky top-4">
              <CardContent className="p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold text-white mb-4">Réserver des billets</h2>
                
                <div className="space-y-4">
                  {/* Si pas de catégories de tickets, afficher un message et des boutons d'action */}
                  {(!event.categories || event.categories.length === 0) ? (
                    <div className="space-y-4">
                      <div className="text-center py-4">
                        <p className="text-gray-400 text-sm mb-4">Les billets ne sont pas encore disponibles</p>
                        <div className="space-y-2">
                          <Button 
                            className="w-full bg-red-600 hover:bg-red-700"
                            onClick={() => navigate('/events')}
                          >
                            Voir d'autres événements
                          </Button>
                          
                          <Button 
                            className="w-full bg-blue-600 hover:bg-blue-700"
                            onClick={() => window.history.back()}
                          >
                            Retour
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <label className="text-sm text-gray-400">Catégorie de billet</label>
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          {(event.categories || []).map((category: TicketCategory) => (
                            <Button
                              key={category.id}
                              variant={selectedCategory?.id === category.id ? "default" : "outline"}
                              className="justify-between font-normal text-sm"
                              onClick={() => {
                                setSelectedCategory(category);
                                setQuantity(1);
                              }}
                            >
                              <span className="truncate">{category.name}</span>
                              <span className="ml-2">{formatCurrency(category.price)}</span>
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {selectedCategory && (
                        <>
                          <div>
                            <label className="text-sm text-gray-400">Description</label>
                            <p className="text-white mt-1 text-sm">{selectedCategory.description}</p>
                          </div>
                          
                          <div>
                            <label className="text-sm text-gray-400">Quantité</label>
                            <div className="flex items-center gap-3 mt-2">
                              <Button 
                                size="icon" 
                                variant="outline"
                                onClick={decrementQuantity}
                                disabled={quantity <= 1}
                                className="h-8 w-8"
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="text-white w-8 text-center">{quantity}</span>
                              <Button 
                                size="icon" 
                                variant="outline"
                                onClick={incrementQuantity}
                                disabled={quantity >= selectedCategory.availableCount}
                                className="h-8 w-8"
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <p className="text-sm text-gray-400">
                                {selectedCategory.availableCount} billets disponibles
                              </p>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                onClick={refreshStock}
                                className="text-blue-400 hover:text-blue-300 p-1 h-auto"
                              >
                                <RefreshCw className="h-3 w-3" />
                              </Button>
                            </div>
                            {/* Indicateur de stock */}
                            <div className="mt-2">
                              <div className="flex justify-between text-xs text-gray-400 mb-1">
                                <span>Stock</span>
                                <span>{selectedCategory.availableCount} disponibles</span>
                              </div>
                              <div className="w-full bg-gray-700 rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full transition-all duration-300 ${
                                    selectedCategory.availableCount === 0 
                                      ? 'bg-red-500' 
                                      : selectedCategory.availableCount < 10 
                                        ? 'bg-orange-500' 
                                        : 'bg-green-500'
                                  }`}
                                  style={{ 
                                    width: `${Math.max(0, Math.min(100, (selectedCategory.availableCount / 50) * 100))}%` 
                                  }}
                                ></div>
                              </div>
                              {selectedCategory.availableCount === 0 && (
                                <p className="text-xs text-red-400 mt-1">Rupture de stock</p>
                              )}
                              {selectedCategory.availableCount > 0 && selectedCategory.availableCount < 10 && (
                                <p className="text-xs text-orange-400 mt-1">Plus que quelques places</p>
                              )}
                            </div>
                          </div>
                          
                          <div className="pt-4 border-t border-gray-800">
                            <div className="flex justify-between items-center bg-gray-800 rounded-lg p-4 mb-4">
                              <span className="text-xl font-bold text-white">Total:</span>
                              <span className="text-2xl font-bold text-green-400">{formatCurrency(selectedCategory.price * quantity)}</span>
                            </div>
                            
                            <div className="space-y-2">
                              <Button 
                                className="w-full bg-red-600 hover:bg-red-700 text-sm"
                                onClick={handleAddToCart}
                              >
                                Ajouter au panier
                              </Button>

                              <Button 
                                className="w-full bg-blue-600 hover:bg-blue-700 text-sm"
                                onClick={handleYengaPayPayment}
                                disabled={processingPayment || !isAuthenticated}
                              >
                                {processingPayment ? (
                                  <span className="flex items-center">
                                    <svg className="animate-spin h-4 w-4 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Traitement...
                                  </span>
                                ) : !isAuthenticated ? (
                                  <>
                                    <Lock className="h-4 w-4 mr-2" />
                                    Connectez-vous pour payer
                                  </>
                                ) : (
                                  <>
                                    <Wallet className="h-4 w-4 mr-2" />
                                    Payer avec YengaPay
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <div className="mt-8 lg:mt-16">
            <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Événements similaires</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {relatedEvents.map((relatedEvent: Event) => (
                <EventCard key={relatedEvent.id} event={relatedEvent} />
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EventDetailPage;