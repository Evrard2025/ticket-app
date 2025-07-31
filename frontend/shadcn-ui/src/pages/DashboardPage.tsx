import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Calendar, 
  ShoppingCart, 
  CreditCard, 
  TrendingUp, 
  BarChart3,
  Eye,
  Edit,
  Trash2,
  Plus
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface DashboardStats {
  events: {
    total_events: number;
    upcoming_events: number;
    past_events: number;
  };
  orders: {
    total_orders: number;
    completed_orders: number;
    pending_orders: number;
    cancelled_orders: number;
    total_revenue: number;
  };
  users: {
    total_users: number;
    admin_users: number;
    regular_users: number;
  };
  tickets: {
    total_tickets: number;
    total_stock: number;
    total_value: number;
  };
  payments: {
    total_payments: number;
    successful_payments: number;
    pending_payments: number;
    failed_payments: number;
    total_amount: number;
  };
}

const DashboardPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      toast.error('Accès refusé - Admin requis');
      return;
    }

    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/stats');
      setStats(response);
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
      toast.error('Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600">Erreur de chargement</h2>
          <Button onClick={fetchStats} className="mt-4">Réessayer</Button>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground">
            Bienvenue, {user?.name}. Voici un aperçu de votre plateforme.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/dashboard/events/new')}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel événement
          </Button>
        </div>
      </div>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Événements</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.events.total_events}</div>
            <p className="text-xs text-muted-foreground">
              {stats.events.upcoming_events} à venir, {stats.events.past_events} passés
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commandes</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.orders.total_orders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.orders.completed_orders} complétées, {stats.orders.pending_orders} en attente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Utilisateurs</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.users.total_users}</div>
            <p className="text-xs text-muted-foreground">
              {stats.users.regular_users} utilisateurs, {stats.users.admin_users} admins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenus</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XAF'
              }).format(stats.orders.total_revenue)}
            </div>
            <p className="text-xs text-muted-foreground">
              Total des ventes complétées
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Onglets pour les différentes sections */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="events">Événements</TabsTrigger>
          <TabsTrigger value="orders">Commandes</TabsTrigger>
          <TabsTrigger value="users">Utilisateurs</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Statistiques des tickets */}
            <Card>
              <CardHeader>
                <CardTitle>Gestion des tickets</CardTitle>
                <CardDescription>État du stock et des ventes</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Types de tickets</span>
                  <Badge variant="secondary">{stats.tickets.total_tickets}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Stock total</span>
                  <Badge variant="outline">{stats.tickets.total_stock}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Valeur du stock</span>
                  <Badge variant="default">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XAF'
                    }).format(stats.tickets.total_value)}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Statistiques des paiements */}
            <Card>
              <CardHeader>
                <CardTitle>Paiements</CardTitle>
                <CardDescription>État des transactions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Total transactions</span>
                  <Badge variant="secondary">{stats.payments.total_payments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Réussies</span>
                  <Badge variant="default">{stats.payments.successful_payments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>En attente</span>
                  <Badge variant="outline">{stats.payments.pending_payments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Échouées</span>
                  <Badge variant="destructive">{stats.payments.failed_payments}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Montant total</span>
                  <Badge variant="default">
                    {new Intl.NumberFormat('fr-FR', {
                      style: 'currency',
                      currency: 'XAF'
                    }).format(stats.payments.total_amount)}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="events" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des événements</h3>
            <Button onClick={() => navigate('/dashboard/events')}>
              <Eye className="w-4 h-4 mr-2" />
              Voir tous les événements
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Gérez vos événements, modifiez les détails et suivez les performances.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Suivi des commandes</h3>
            <Button onClick={() => navigate('/dashboard/orders')}>
              <Eye className="w-4 h-4 mr-2" />
              Voir toutes les commandes
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Suivez l'état des commandes, gérez les statuts et analysez les ventes.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Gestion des utilisateurs</h3>
            <Button onClick={() => navigate('/dashboard/users')}>
              <Eye className="w-4 h-4 mr-2" />
              Voir tous les utilisateurs
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Gérez les comptes utilisateurs, les rôles et les permissions.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Analytics et rapports</h3>
            <Button onClick={() => navigate('/dashboard/analytics')}>
              <BarChart3 className="w-4 h-4 mr-2" />
              Voir les rapports détaillés
            </Button>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">
                Analysez les tendances de vente, les performances et générez des rapports.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default DashboardPage; 