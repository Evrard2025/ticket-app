import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrder } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency, generateQRCodeUrl } from '@/lib/utils';
import Layout from '@/components/layout/Layout';

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById } = useOrder();
  const { user } = useAuth();
  const [order, setOrder] = useState(id ? getOrderById(id) : undefined);
  
  // Redirect if not authenticated or order not found
  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    
    if (!order) {
      navigate('/account');
      return;
    }
  }, [user, order, navigate]);

  if (!order) return null;

  // Generate QR code for each ticket
  const qrCodeData = `
    Order ID: ${order.id}
    Customer: ${user?.name}
    Date: ${order.date.toLocaleDateString()}
    Total: ${formatCurrency(order.total)}
  `;
  
  const qrCodeUrl = generateQRCodeUrl(qrCodeData);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold">Commande confirmée!</h1>
            <p className="text-gray-400 mt-2">
              Votre commande #{order.id} a été traitée avec succès.
            </p>
          </div>
          
          <Card className="bg-gray-900 border-gray-800 mb-8">
            <CardHeader>
              <CardTitle>Récapitulatif de la commande</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Numéro de commande</p>
                    <p className="font-medium">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Date</p>
                    <p className="font-medium">{order.date.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Client</p>
                    <p className="font-medium">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Email</p>
                    <p className="font-medium">{user?.email}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-800 pt-4 mt-4">
                  <h3 className="font-medium mb-3">Billets</h3>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex flex-col sm:flex-row justify-between p-3 bg-gray-800 rounded-md"
                      >
                        <div>
                          <p className="font-medium">{item.eventTitle}</p>
                          <p className="text-sm text-gray-400">
                            {item.categoryName} - {item.quantity} {item.quantity > 1 ? 'billets' : 'billet'} 
                            x {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="text-right font-medium mt-2 sm:mt-0">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-800 my-4 pt-4">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gray-900 border-gray-800 mb-8">
            <CardHeader>
              <CardTitle>Vos billets électroniques</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mx-auto w-48 h-48 mb-4">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-full h-full" 
                />
              </div>
              <p className="text-sm text-gray-400 mb-6">
                Présentez ce QR code à l'entrée de l'événement pour valider votre billet.
                Une copie de vos billets a également été envoyée à votre adresse email.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button>
                  Télécharger le PDF
                </Button>
                <Button variant="outline">
                  Imprimer les billets
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button onClick={() => navigate('/account')} variant="outline">
              Voir mes commandes
            </Button>
            <Button onClick={() => navigate('/')} variant="default">
              Retour à l'accueil
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OrderConfirmationPage;