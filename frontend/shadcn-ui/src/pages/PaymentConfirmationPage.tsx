import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { useCart } from '@/contexts/CartContext';
import Layout from '@/components/layout/Layout';

interface PaymentStatus {
  reference: string;
  status: 'completed' | 'pending' | 'failed' | 'cancelled';
  amount: number;
  transactionId?: string;
  orderId: number;
}

const PaymentConfirmationPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshOrders } = useOrder();
  const { clearCart } = useCart();
  
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Rediriger si pas connecté
  if (!user) {
    navigate('/login', { state: { redirect: '/payment/confirmation' } });
    return null;
  }

  useEffect(() => {
    const reference = searchParams.get('reference');
    const status = searchParams.get('status');
    
    if (!reference) {
      setError('Référence de paiement manquante');
      setLoading(false);
      return;
    }

    // Vérifier le statut du paiement côté serveur
    checkPaymentStatus(reference);
  }, [searchParams]);

  const checkPaymentStatus = async (reference: string) => {
    try {
      // Récupérer les paiements par référence
      const payments = await api.get(`/payment?reference=${reference}`);
      
      if (payments && payments.length > 0) {
        const payment = payments[0];
        setPaymentStatus({
          reference: payment.paymentReference,
          status: payment.status,
          amount: payment.amount,
          transactionId: payment.transactionId,
          orderId: payment.orderId
        });
        
        // Si le paiement est réussi, rafraîchir les commandes et vider le panier
        if (payment.status === 'completed' && user?.id) {
          await refreshOrders(user.id.toString());
          
          // Vider le panier en utilisant les données stockées
          const pendingCartItems = sessionStorage.getItem('pendingCartItems');
          if (pendingCartItems) {
            console.log('🧹 Vidage du panier après paiement réussi');
            clearCart();
            sessionStorage.removeItem('pendingCartItems');
            sessionStorage.removeItem('pendingOrders');
          } else {
            // Fallback : vider le panier normalement
            clearCart();
          }
        }
      } else {
        setError('Paiement non trouvé');
      }
    } catch (err) {
      setError('Erreur lors de la vérification du paiement');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'pending':
        return <Clock className="h-12 w-12 text-yellow-500" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-12 w-12 text-red-500" />;
      default:
        return <Clock className="h-12 w-12 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed':
        return 'Paiement réussi';
      case 'pending':
        return 'Paiement en cours de traitement';
      case 'failed':
        return 'Paiement échoué';
      case 'cancelled':
        return 'Paiement annulé';
      default:
        return 'Statut inconnu';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-900/20 text-green-400 border-green-800';
      case 'pending':
        return 'bg-yellow-900/20 text-yellow-400 border-yellow-800';
      case 'failed':
      case 'cancelled':
        return 'bg-red-900/20 text-red-400 border-red-800';
      default:
        return 'bg-gray-900/20 text-gray-400 border-gray-800';
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-400">Vérification du paiement...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <Card className="bg-gray-900 border-gray-800">
              <CardContent className="pt-6 text-center">
                <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h2 className="text-xl font-bold text-white mb-2">Erreur</h2>
                <p className="text-gray-400 mb-6">{error}</p>
                <Button onClick={() => navigate('/')}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour à l'accueil
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-md mx-auto">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {paymentStatus && getStatusIcon(paymentStatus.status)}
              </div>
              <CardTitle className="text-white">
                {paymentStatus && getStatusText(paymentStatus.status)}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {paymentStatus && (
                <>
                  <div className="text-center">
                    <Badge className={getStatusColor(paymentStatus.status)}>
                      {paymentStatus.status.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Référence:</span>
                      <span className="text-white font-mono">{paymentStatus.reference}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Montant:</span>
                      <span className="text-white font-bold">
                        {new Intl.NumberFormat('fr-FR', {
                          style: 'currency',
                          currency: 'XOF'
                        }).format(paymentStatus.amount)}
                      </span>
                    </div>
                    {paymentStatus.transactionId && (
                      <div className="flex justify-between">
                        <span className="text-gray-400">Transaction ID:</span>
                        <span className="text-white font-mono text-xs">{paymentStatus.transactionId}</span>
                      </div>
                    )}
                  </div>

                  {paymentStatus.status === 'completed' && (
                    <div className="bg-green-900/20 border border-green-800 rounded-lg p-4">
                      <p className="text-green-400 text-sm">
                        Votre paiement a été traité avec succès. Vous recevrez bientôt un email de confirmation avec vos tickets.
                      </p>
                    </div>
                  )}

                  {paymentStatus.status === 'pending' && (
                    <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-4">
                      <p className="text-yellow-400 text-sm">
                        Votre paiement est en cours de traitement. Vous recevrez une notification une fois le traitement terminé.
                      </p>
                    </div>
                  )}

                  {(paymentStatus.status === 'failed' || paymentStatus.status === 'cancelled') && (
                    <div className="bg-red-900/20 border border-red-800 rounded-lg p-4">
                      <p className="text-red-400 text-sm">
                        Le paiement n'a pas pu être traité. Veuillez réessayer ou contacter le support.
                      </p>
                    </div>
                  )}
                </>
              )}

              <div className="flex flex-col gap-2 pt-4">
                {paymentStatus?.status === 'completed' && (
                  <Button 
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => navigate(`/confirmation/${paymentStatus.orderId}`)}
                  >
                    Voir mes tickets
                  </Button>
                )}
                
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => navigate('/events')}
                >
                  Parcourir d'autres événements
                </Button>
                
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate('/account')}
                >
                  Mon compte
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentConfirmationPage; 