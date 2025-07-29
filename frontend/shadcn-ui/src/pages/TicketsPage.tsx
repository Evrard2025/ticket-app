import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar, MapPin, Download, Eye } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import TicketDisplay from '@/components/TicketDisplay';

const TicketsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders, loading, error, refreshOrders } = useOrder();
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [lastUserId, setLastUserId] = useState<string | null>(null);

  // Rediriger si pas connecté
  if (!user) {
    navigate('/login', { state: { redirect: '/tickets' } });
    return null;
  }

  // Fonction stable pour charger les tickets
  const loadTickets = useCallback((userId: string) => {
    if (userId && userId !== lastUserId) {
      console.log(`🔄 TicketsPage: Chargement des tickets pour l'utilisateur ${userId}`);
      setLastUserId(userId);
      refreshOrders(userId);
    }
  }, [refreshOrders, lastUserId]);

  // Charger les tickets une seule fois quand l'utilisateur change
  useEffect(() => {
    if (user?.id) {
      loadTickets(user.id.toString());
    } else {
      console.log('❌ TicketsPage: Aucun utilisateur connecté');
    }
  }, [user?.id, loadTickets]);

  const downloadTicket = async (orderId: number) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/payment/ticket/${orderId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ticket-${orderId}.html`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
      case 'completed':
        return 'bg-green-500 dark:bg-green-600';
      case 'pending':
        return 'bg-yellow-500 dark:bg-yellow-600';
      case 'failed':
      case 'cancelled':
        return 'bg-red-500 dark:bg-red-600';
      default:
        return 'bg-gray-500 dark:bg-gray-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
      case 'completed':
        return 'CONFIRMÉ';
      case 'pending':
        return 'EN ATTENTE';
      case 'failed':
        return 'ÉCHOUÉ';
      case 'cancelled':
        return 'ANNULÉ';
      default:
        return status.toUpperCase();
    }
  };

  const formatDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Connexion requise</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Veuillez vous connecter pour accéder à vos tickets.</p>
            <Button onClick={() => navigate('/login')} className="bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f] text-white">
              Se connecter
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen bg-white dark:bg-black">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 dark:border-[#e50914] mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Chargement de vos tickets...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-md mx-auto bg-white dark:bg-[#181818] border-gray-200 dark:border-gray-800">
            <CardContent className="p-6">
              <div className="text-center text-red-600 dark:text-[#e50914]">
                <p className="text-gray-900 dark:text-white">{error}</p>
                <Button 
                  onClick={() => loadTickets(user.id.toString())} 
                  variant="outline" 
                  className="mt-4 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#181818] hover:border-red-500 dark:hover:border-[#e50914]"
                >
                  Réessayer
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Layout>
    );
  }

  // Convertir les commandes en tickets pour l'affichage
  const allTickets = orders.flatMap(order => 
    order.items.map(item => ({
      id: `${order.id}-${item.ticketId}`,
      orderId: order.id,
      eventTitle: item.eventTitle,
      eventDate: item.eventDate,
      eventLocation: item.eventVenue,
      ticketCategory: item.categoryName,
      ticketPrice: item.price,
      quantity: item.quantity,
      total: order.total,
      orderStatus: order.status,
      paymentStatus: order.status,
      eventDescription: item.eventDescription,
      eventImage: item.eventImage
    }))
  );

  const upcomingTickets = allTickets.filter(ticket => new Date(ticket.eventDate) > new Date());
  const pastTickets = allTickets.filter(ticket => new Date(ticket.eventDate) <= new Date());

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 bg-white dark:bg-black">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mes Tickets</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez et téléchargez vos tickets électroniques
          </p>
        </div>

        {allTickets.length === 0 ? (
          <Card className="max-w-md mx-auto bg-white dark:bg-[#181818] border-gray-200 dark:border-gray-800">
            <CardContent className="p-8 text-center">
              <div className="text-6xl mb-4">🎫</div>
              <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">Aucun ticket trouvé</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Vous n'avez pas encore de tickets confirmés.
              </p>
              <Button onClick={() => navigate('/events')} className="bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f] text-white">
                Découvrir des événements
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="upcoming" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 bg-gray-100 dark:bg-[#222] border-gray-200 dark:border-gray-700">
              <TabsTrigger value="upcoming" className="text-gray-700 dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-[#181818] data-[state=active]:text-red-600 dark:data-[state=active]:text-[#e50914]">
                À venir ({upcomingTickets.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="text-gray-700 dark:text-white data-[state=active]:bg-white dark:data-[state=active]:bg-[#181818] data-[state=active]:text-red-600 dark:data-[state=active]:text-[#e50914]">
                Passés ({pastTickets.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming" className="space-y-6">
              {upcomingTickets.length === 0 ? (
                <Card className="bg-white dark:bg-[#181818] border-gray-200 dark:border-gray-800">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">Aucun événement à venir</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {upcomingTickets.map((ticket) => (
                    <Card key={ticket.id} className="hover:shadow-lg dark:hover:shadow-2xl transition-shadow bg-white dark:bg-[#181818] border-gray-200 dark:border-gray-800">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge className={getStatusColor(ticket.paymentStatus)}>
                            {getStatusText(ticket.paymentStatus)}
                          </Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            #{ticket.orderId.toString().padStart(6, '0')}
                          </span>
                        </div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">{ticket.eventTitle}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-blue-500 dark:text-blue-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {formatDate(ticket.eventDate)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-red-500 dark:text-red-400" />
                          <span className="text-sm text-gray-700 dark:text-gray-300">{ticket.eventLocation}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#222] p-3 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Catégorie:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{ticket.ticketCategory}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Quantité:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{ticket.quantity}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Prix:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{ticket.ticketPrice} FCFA</p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Total:</span>
                              <p className="font-medium text-blue-600 dark:text-blue-400">{ticket.total} FCFA</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => setSelectedTicket(ticket)}
                            variant="outline" 
                            size="sm"
                            className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#222] hover:border-red-500 dark:hover:border-[#e50914]"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button 
                            onClick={() => downloadTicket(ticket.orderId)}
                            size="sm"
                            className="flex-1 bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f] text-white"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past" className="space-y-6">
              {pastTickets.length === 0 ? (
                <Card className="bg-white dark:bg-[#181818] border-gray-200 dark:border-gray-800">
                  <CardContent className="p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">Aucun événement passé</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {pastTickets.map((ticket) => (
                    <Card key={ticket.id} className="opacity-75 hover:opacity-100 transition-opacity bg-white dark:bg-[#181818] border-gray-200 dark:border-gray-800">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className="bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white">TERMINÉ</Badge>
                          <span className="text-sm text-gray-500 dark:text-gray-400">
                            #{ticket.orderId.toString().padStart(6, '0')}
                          </span>
                        </div>
                        <CardTitle className="text-lg text-gray-900 dark:text-white">{ticket.eventTitle}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDate(ticket.eventDate)}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{ticket.eventLocation}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-[#222] p-3 rounded-lg">
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Catégorie:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{ticket.ticketCategory}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Quantité:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{ticket.quantity}</p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Prix:</span>
                              <p className="font-medium text-gray-900 dark:text-white">{ticket.ticketPrice} FCFA</p>
                            </div>
                            <div>
                              <span className="text-gray-600 dark:text-gray-400">Total:</span>
                              <p className="font-medium text-gray-600 dark:text-gray-400">{ticket.total} FCFA</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button 
                            onClick={() => setSelectedTicket(ticket)}
                            variant="outline" 
                            size="sm"
                            className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#222] hover:border-red-500 dark:hover:border-[#e50914]"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            Voir
                          </Button>
                          <Button 
                            onClick={() => downloadTicket(ticket.orderId)}
                            variant="outline"
                            size="sm"
                            className="flex-1 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#222] hover:border-red-500 dark:hover:border-[#e50914]"
                          >
                            <Download className="h-4 w-4 mr-1" />
                            Télécharger
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}

        {/* Modal pour afficher le ticket détaillé */}
        {selectedTicket && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-[#181818] rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-800">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">Détails du ticket</h2>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedTicket(null)}
                    className="border-gray-300 dark:border-gray-700 text-gray-700 dark:text-white hover:bg-gray-50 dark:hover:bg-[#222] hover:border-red-500 dark:hover:border-[#e50914]"
                  >
                    ✕
                  </Button>
                </div>
                <TicketDisplay orderId={selectedTicket.orderId} />
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TicketsPage;