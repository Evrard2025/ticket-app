import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3,
  Calendar,
  DollarSign,
  ShoppingCart,
  Users,
  Activity
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';

interface AnalyticsData {
  period: string;
  orders_count: number;
  revenue: number;
  tickets_sold: number;
}

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

const DashboardAnalyticsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<AnalyticsData[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/');
      toast.error('Accès refusé - Admin requis');
      return;
    }

    fetchAnalytics();
    fetchStats();
  }, [user, navigate, period]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await api.get('/dashboard/sales-analytics', {
        params: { period }
      });
      setAnalytics(response.analytics);
    } catch (error) {
      console.error('Erreur récupération analytics:', error);
      toast.error('Erreur lors du chargement des analytics');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setStats(response);
    } catch (error) {
      console.error('Erreur récupération statistiques:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF'
    }).format(amount);
  };

  const formatPeriod = (period: string) => {
    if (period.includes('-')) {
      const [year, month] = period.split('-');
      return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'long'
      });
    }
    return period;
  };

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getGrowthIcon = (growth: number) => {
    if (growth > 0) {
      return <TrendingUp className="w-4 h-4 text-green-600" />;
    } else if (growth < 0) {
      return <TrendingDown className="w-4 h-4 text-red-600" />;
    }
    return <Activity className="w-4 h-4 text-gray-600" />;
  };

  const getGrowthColor = (growth: number) => {
    if (growth > 0) return 'text-green-600';
    if (growth < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading && analytics.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
          <h1 className="text-3xl font-bold">Analytics et rapports</h1>
          <p className="text-muted-foreground">
            Analysez les performances et les tendances de votre plateforme
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-sm text-muted-foreground">Période:</span>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Jour</SelectItem>
              <SelectItem value="week">Semaine</SelectItem>
              <SelectItem value="month">Mois</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistiques principales */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenus totaux</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(stats.orders.total_revenue)}
              </div>
              <p className="text-xs text-muted-foreground">
                Toutes les commandes complétées
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
                {stats.orders.completed_orders} complétées
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
                {stats.users.regular_users} utilisateurs actifs
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Événements</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.events.total_events}</div>
              <p className="text-xs text-muted-foreground">
                {stats.events.upcoming_events} à venir
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Graphique des ventes */}
      <Card>
        <CardHeader>
          <CardTitle>Évolution des ventes</CardTitle>
          <CardDescription>
            Analyse des commandes et revenus par {period === 'day' ? 'jour' : period === 'week' ? 'semaine' : 'mois'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.length > 0 ? (
            <div className="space-y-4">
              {analytics.slice(0, 12).map((data, index) => {
                const previousData = analytics[index + 1];
                const revenueGrowth = previousData 
                  ? calculateGrowth(data.revenue, previousData.revenue)
                  : 0;
                const ordersGrowth = previousData 
                  ? calculateGrowth(data.orders_count, previousData.orders_count)
                  : 0;

                return (
                  <div key={data.period} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <div className="font-medium">{formatPeriod(data.period)}</div>
                        <div className="text-sm text-muted-foreground">
                          {data.orders_count} commandes • {data.tickets_sold} tickets vendus
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-lg">
                        {formatCurrency(data.revenue)}
                      </div>
                      <div className="flex items-center space-x-1 text-sm">
                        {getGrowthIcon(revenueGrowth)}
                        <span className={getGrowthColor(revenueGrowth)}>
                          {revenueGrowth > 0 ? '+' : ''}{revenueGrowth.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune donnée disponible pour cette période</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques détaillées */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Statistiques des paiements */}
          <Card>
            <CardHeader>
              <CardTitle>Statistiques des paiements</CardTitle>
              <CardDescription>État des transactions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Total transactions</span>
                <span className="font-medium">{stats.payments.total_payments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Réussies</span>
                <span className="font-medium text-green-600">{stats.payments.successful_payments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>En attente</span>
                <span className="font-medium text-yellow-600">{stats.payments.pending_payments}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Échouées</span>
                <span className="font-medium text-red-600">{stats.payments.failed_payments}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Montant total</span>
                <span className="font-bold text-lg">
                  {formatCurrency(stats.payments.total_amount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Statistiques des tickets */}
          <Card>
            <CardHeader>
              <CardTitle>Gestion des tickets</CardTitle>
              <CardDescription>État du stock et des ventes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span>Types de tickets</span>
                <span className="font-medium">{stats.tickets.total_tickets}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Stock total</span>
                <span className="font-medium">{stats.tickets.total_stock}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Valeur du stock</span>
                <span className="font-medium">{formatCurrency(stats.tickets.total_value)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="font-medium">Taux de conversion</span>
                <span className="font-bold text-lg">
                  {stats.orders.total_orders > 0 
                    ? ((stats.orders.completed_orders / stats.orders.total_orders) * 100).toFixed(1)
                    : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Actions rapides */}
      <Card>
        <CardHeader>
          <CardTitle>Actions rapides</CardTitle>
          <CardDescription>Accès rapide aux fonctionnalités principales</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => navigate('/dashboard/events')}
            >
              <Calendar className="w-6 h-6 mb-2" />
              <span>Gérer les événements</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => navigate('/dashboard/orders')}
            >
              <ShoppingCart className="w-6 h-6 mb-2" />
              <span>Suivre les commandes</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-20 flex flex-col items-center justify-center"
              onClick={() => navigate('/dashboard/users')}
            >
              <Users className="w-6 h-6 mb-2" />
              <span>Gérer les utilisateurs</span>
            </Button>
          </div>
        </CardContent>
      </Card>
      </div>
    </DashboardLayout>
  );
};

export default DashboardAnalyticsPage; 