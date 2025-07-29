import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calendar, MapPin, CreditCard, Ticket, User, LogOut } from 'lucide-react';
import Layout from '@/components/layout/Layout';

const AccountPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { orders, loading, error, refreshOrders } = useOrder();
  const [activeTab, setActiveTab] = useState('profile');

  // Charger les commandes au montage du composant
  useEffect(() => {
    console.log('🔄 AccountPage useEffect: user?.id =', user?.id);
    if (user?.id) {
      console.log('📞 Appel refreshOrders avec userId:', user.id.toString());
      refreshOrders(user.id.toString());
    } else {
      console.log('❌ AccountPage: user.id manquant');
    }
  }, [user?.id, refreshOrders]);

  const handleLogout = () => {
    logout();
    navigate('/');
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
      case 'completed':
      case 'paid':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  if (!user) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Connexion requise</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Veuillez vous connecter pour accéder à votre compte.</p>
            <Button onClick={() => navigate('/login')}>Se connecter</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Mon Compte</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez votre profil et consultez vos commandes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
              <CardContent className="p-6">
                {/* Profile Info */}
                <div className="text-center mb-6">
                  <div className="w-20 h-20 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white text-2xl font-bold">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user.name}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{user.email}</p>
                </div>

                <Separator className="my-4 bg-gray-200 dark:bg-gray-700" />

                {/* Navigation */}
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === 'profile'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span>Profil</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('orders')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === 'orders'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <CreditCard className="w-5 h-5" />
                    <span>Commandes</span>
                  </button>
                  <button
                    onClick={() => setActiveTab('tickets')}
                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                      activeTab === 'tickets'
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-700'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Ticket className="w-5 h-5" />
                    <span>Mes billets</span>
                  </button>
                </nav>

                <Separator className="my-4 bg-gray-200 dark:bg-gray-700" />

                {/* Logout */}
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full flex items-center space-x-2 text-red-600 dark:text-red-400 border-red-200 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Se déconnecter</span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <Card className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Informations du profil</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Gérez vos informations personnelles</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom</label>
                      <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">{user.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                      <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">{user.email}</p>
                    </div>
                    {user.telephone && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone</label>
                        <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md">{user.telephone}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Rôle</label>
                      <p className="text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-700 px-3 py-2 rounded-md capitalize">{user.role || 'utilisateur'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Orders Tab */}
            {activeTab === 'orders' && (
              <Card className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Historique des commandes</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Consultez toutes vos commandes passées</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                      <p className="text-gray-700 dark:text-gray-300 font-medium">Chargement des commandes...</p>
                    </div>
                  ) : error ? (
                    <div className="text-center py-8">
                      <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                      <Button 
                        onClick={() => refreshOrders(user.id.toString())} 
                        variant="outline" 
                        className="mt-4"
                      >
                        Réessayer
                      </Button>
                    </div>
                  ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-600 dark:text-gray-400">Aucune commande trouvée.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Commande #{order.id}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(order.date)}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900 dark:text-gray-100">{order.total} FCFA</p>
                              <Badge className={getStatusColor(order.status)}>
                                {order.status}
                              </Badge>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {order.items.map((item, index) => (
                              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.eventTitle}</p>
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.categoryName}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm text-gray-600 dark:text-gray-400">{item.quantity}x</p>
                                  <p className="font-medium text-gray-900 dark:text-gray-100">{item.price} FCFA</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Tickets Tab */}
            {activeTab === 'tickets' && (
              <Card className="bg-white dark:bg-gray-800 shadow-sm border-gray-200 dark:border-gray-700">
                <CardHeader>
                  <CardTitle className="text-gray-900 dark:text-gray-100">Mes billets</CardTitle>
                  <CardDescription className="text-gray-600 dark:text-gray-400">Accédez à tous vos billets d'événements</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Consultez vos billets dans la section dédiée.
                    </p>
                    <Button onClick={() => navigate('/tickets')}>
                      Voir mes tickets
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AccountPage;