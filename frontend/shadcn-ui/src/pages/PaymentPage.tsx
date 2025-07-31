import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Smartphone, Wallet, ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import Layout from '@/components/layout/Layout';
import { Event, TicketCategory } from '@/lib/mock-data';

interface OrderResponse {
  id: number;
  utilisateur_id: number;
  ticket_id: number;
  quantite: number;
  total: number;
  statut: string;
  created_at: string;
  updated_at: string;
}

interface PaymentMethod {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  color: string;
}

interface YengaPayResponse {
  id: number;
  orderId: number;
  amount: number;
  paymentMethod: string;
  status: string;
  paymentReference: string;
  transactionId: string | null;
  paymentData: Record<string, unknown>;
  yengapayData: {
    paymentUrl?: string;
    transactionId?: string;
    status?: string;
    checkoutPageUrlWithPaymentToken?: string; // Added for new format
  };
  createdAt: string;
  updatedAt: string;
}

const PaymentPage = () => {
  const navigate = useNavigate();
  const { cartItems, clearCart } = useCart();
  const { isAuthenticated, user } = useAuth();
  
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');

  // Rediriger si pas connecté ou panier vide
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login', { state: { redirect: '/payment' } });
      return;
    }
    
    if (!cartItems || cartItems.length === 0) {
      navigate('/');
      return;
    }
  }, [isAuthenticated, cartItems, navigate]);

  const paymentMethods: PaymentMethod[] = [
    {
      id: 'yengapay',
      name: 'YengaPay',
      icon: <Wallet className="h-6 w-6" />,
      description: 'Mobile Money, Cartes bancaires, Virements',
      color: 'bg-blue-600 hover:bg-blue-700'
    },
    {
      id: 'card',
      name: 'Carte bancaire',
      icon: <CreditCard className="h-6 w-6" />,
      description: 'Visa, Mastercard, American Express',
      color: 'bg-green-600 hover:bg-green-700'
    },
    {
      id: 'mobile',
      name: 'Mobile Money',
      icon: <Smartphone className="h-6 w-6" />,
      description: 'Orange Money, MTN Mobile Money, Moov Money',
      color: 'bg-purple-600 hover:bg-purple-700'
    }
  ];

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const handleYengaPayPayment = async () => {
    if (!user || !cartItems || cartItems.length === 0) return;

    setProcessingPayment(true);
    setPaymentStatus('processing');

    try {
      // Créer toutes les commandes du panier en une fois
      const orderItems = cartItems.map(item => ({
        ticket_id: item.ticketCategoryId,
        quantite: item.quantity,
        total: item.price * item.quantity
      }));

      const orders = await api.post<{
        utilisateur_id: number;
        items: Array<{
          ticket_id: number;
          quantite: number;
          total: number;
        }>;
      }, OrderResponse[]>('/orders/bulk', {
        utilisateur_id: user.id,
        items: orderItems
      });

      // Créer le paiement YengaPay pour la première commande (YengaPay ne gère qu'une commande à la fois)
      const firstOrder = orders[0];
      const yengaPayResponse = await api.post<{
        order_id: number;
      }, YengaPayResponse>('/payment/yengapay', {
        order_id: firstOrder.id
      });

      const yengaPayment = yengaPayResponse as YengaPayResponse;

      // Stocker les IDs des commandes dans sessionStorage pour les récupérer après paiement
      sessionStorage.setItem('pendingOrders', JSON.stringify(orders.map(o => o.id)));
      
      // Stocker aussi les données complètes du panier pour le traitement post-paiement
      sessionStorage.setItem('pendingCartItems', JSON.stringify(cartItems));

      // Rediriger vers l'URL de paiement YengaPay
      if (yengaPayment.yengapayData?.checkoutPageUrlWithPaymentToken) {
        window.location.href = yengaPayment.yengapayData.checkoutPageUrlWithPaymentToken;
      } else if (yengaPayment.yengapayData?.paymentUrl) {
        // Fallback pour l'ancien format
        window.location.href = yengaPayment.yengapayData.paymentUrl;
      } else {
        throw new Error('URL de paiement non disponible');
      }

    } catch (error: unknown) {
      console.error('Erreur lors du paiement YengaPay:', error);
      setPaymentStatus('error');
      const errorMessage = error instanceof Error ? error.message : 'Erreur lors du paiement. Veuillez réessayer.';
      alert(errorMessage);
    } finally {
      setProcessingPayment(false);
    }
  };

  const handleCardPayment = async () => {
    // Implémentation du paiement par carte
    alert('Paiement par carte à implémenter');
  };

  const handleMobilePayment = async () => {
    // Implémentation du paiement mobile
    alert('Paiement mobile à implémenter');
  };

  const handlePayment = async () => {
    switch (selectedMethod) {
      case 'yengapay':
        await handleYengaPayPayment();
        break;
      case 'card':
        await handleCardPayment();
        break;
      case 'mobile':
        await handleMobilePayment();
        break;
      default:
        alert('Veuillez sélectionner une méthode de paiement');
    }
  };

  if (!cartItems || cartItems.length === 0) {
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate(-1)}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
            <h1 className="text-2xl font-bold text-white">Paiement</h1>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Méthodes de paiement */}
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Choisir une méthode de paiement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedMethod === method.id
                          ? 'border-blue-500 bg-blue-900/20'
                          : 'border-gray-700 bg-gray-800 hover:border-gray-600'
                      }`}
                      onClick={() => setSelectedMethod(method.id)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-2 rounded-lg ${method.color} text-white`}>
                          {method.icon}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-white">{method.name}</h3>
                          <p className="text-sm text-gray-400">{method.description}</p>
                        </div>
                        {selectedMethod === method.id && (
                          <CheckCircle className="h-5 w-5 text-blue-500" />
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Bouton de paiement */}
              {selectedMethod && (
                <div className="mt-6">
                  <Button
                    className="w-full h-12 text-lg"
                    onClick={handlePayment}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <span className="flex items-center">
                        <svg className="animate-spin h-5 w-5 text-white mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Traitement du paiement...
                      </span>
                    ) : (
                      `Payer ${formatCurrency(calculateTotal())}`
                    )}
                  </Button>
                </div>
              )}
            </div>

            {/* Résumé de la commande */}
            <div>
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white">Résumé de la commande</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cartItems.map((item, index) => (
                      <div key={index} className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-medium text-white">{item.eventTitle}</h4>
                          <p className="text-sm text-gray-400">{item.categoryName}</p>
                          <p className="text-sm text-gray-400">Quantité: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-white">
                            {formatCurrency(item.price * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                    
                    <div className="border-t border-gray-700 pt-4">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-bold text-white">Total</span>
                        <span className="text-lg font-bold text-white">
                          {formatCurrency(calculateTotal())}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PaymentPage; 