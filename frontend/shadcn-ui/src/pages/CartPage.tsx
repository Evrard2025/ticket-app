import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Trash2, Wallet, CreditCard, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrder } from '@/contexts/OrderContext';
import { formatCurrency } from '@/lib/utils';
import Layout from '@/components/layout/Layout';

const CartPage = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, clearCart, getTotal } = useCart();
  const { user } = useAuth();
  const { createOrder } = useOrder();
  const [isProcessing, setIsProcessing] = useState(false);
  
  // Redirect if not authenticated
  if (!user) {
    navigate('/login', { state: { redirect: '/cart' } });
    return null;
  }

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    // Rediriger vers la page de paiement au lieu du checkout direct
    navigate('/payment');
  };

  const handleYengaPayCheckout = async () => {
    if (cartItems.length === 0) return;
    
    // Rediriger vers la page de paiement avec YengaPay présélectionné
    navigate('/payment', { state: { selectedMethod: 'yengapay' } });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <h1 className="text-3xl font-bold mb-8">Votre panier</h1>
        
        {cartItems.length === 0 ? (
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="pt-6 text-center">
              <p className="text-gray-400 mb-4">Votre panier est vide</p>
              <Button 
                className="bg-red-600 hover:bg-red-700"
                onClick={() => navigate('/events')}
              >
                Parcourir les événements
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Card className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle>Billets sélectionnés</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cartItems.map((item) => (
                      <div 
                        key={`${item.eventId}-${item.ticketCategoryId}`} 
                        className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border-b border-gray-800 last:border-b-0"
                      >
                        <div className="w-16 h-16 flex-shrink-0">
                          <img 
                            src={item.imageUrl} 
                            alt={item.eventTitle} 
                            className="w-full h-full object-cover rounded"
                          />
                        </div>
                        <div className="flex-grow">
                          <Link to={`/event/${item.eventId}`} className="font-medium text-white hover:text-red-500">
                            {item.eventTitle}
                          </Link>
                          <div className="text-sm text-gray-400 mt-1">
                            Catégorie: {item.categoryName}
                          </div>
                          <div className="text-sm">
                            {formatCurrency(item.price)} par billet
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            value={item.quantity}
                            onChange={(e) => updateQuantity(item.eventId, item.ticketCategoryId, parseInt(e.target.value))}
                            className="p-1 bg-gray-800 border border-gray-700 rounded text-white w-16"
                          >
                            {Array.from({ length: 10 }, (_, i) => i + 1).map((num) => (
                              <option key={num} value={num}>
                                {num}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeFromCart(item.eventId, item.ticketCategoryId)}
                          >
                            <Trash2 className="h-4 w-4 text-gray-400 hover:text-red-500" />
                          </Button>
                        </div>
                        <div className="font-medium">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <div>
              <Card className="bg-gray-900 border-gray-800 sticky top-24">
                <CardHeader>
                  <CardTitle>Récapitulatif</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cartItems.map((item) => (
                      <div 
                        key={`${item.eventId}-${item.ticketCategoryId}`}
                        className="flex justify-between text-sm"
                      >
                        <span>
                          {item.eventTitle} ({item.categoryName}) x {item.quantity}
                        </span>
                        <span>
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-gray-800 my-4"></div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>{formatCurrency(getTotal())}</span>
                  </div>
                </CardContent>
                <CardFooter className="flex-col gap-3">
                  {/* Bouton YengaPay en premier */}
                  <Button
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    onClick={handleYengaPayCheckout}
                    disabled={isProcessing}
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Payer avec YengaPay
                  </Button>
                  
                  {/* Bouton de paiement général */}
                  <Button
                    className="w-full bg-red-600 hover:bg-red-700"
                    onClick={handleCheckout}
                    disabled={isProcessing}
                  >
                    {isProcessing ? 'Traitement en cours...' : 'Autres méthodes de paiement'}
                  </Button>
                  
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => navigate('/events')}
                  >
                    Continuer les achats
                  </Button>
                </CardFooter>
              </Card>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default CartPage;