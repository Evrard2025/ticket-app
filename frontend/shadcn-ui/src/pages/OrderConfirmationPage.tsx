import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useOrder } from '@/contexts/OrderContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCart } from '@/contexts/CartContext';
import { formatCurrency, generateQRCodeUrl } from '@/lib/utils';
import Layout from '@/components/layout/Layout';
import { toast } from 'sonner';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const OrderConfirmationPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getOrderById } = useOrder();
  const { user } = useAuth();
  const { clearCart } = useCart();
  const [order, setOrder] = useState(id ? getOrderById(id) : undefined);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const ticketRef = useRef<HTMLDivElement>(null);
  
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
    
    // Vider le panier quand on arrive sur la page de confirmation
    const pendingCartItems = sessionStorage.getItem('pendingCartItems');
    if (pendingCartItems) {
      console.log('🧹 Vidage du panier depuis la page de confirmation');
      clearCart();
      sessionStorage.removeItem('pendingCartItems');
      sessionStorage.removeItem('pendingOrders');
    } else {
      // Fallback : vider le panier normalement
      clearCart();
    }
  }, [user, order, navigate, clearCart]);

  const handleDownloadPDF = async () => {
    if (!order || !user) {
      toast.error('Données de commande manquantes');
      return;
    }
    
    setIsGeneratingPDF(true);
    try {
      console.log('Début de la génération PDF...');
      
      // Créer un élément temporaire pour le ticket
      const ticketElement = document.createElement('div');
      ticketElement.style.position = 'absolute';
      ticketElement.style.left = '-9999px';
      ticketElement.style.top = '0';
      ticketElement.style.width = '800px';
      ticketElement.style.backgroundColor = 'white';
      ticketElement.style.padding = '40px';
      ticketElement.style.fontFamily = 'Arial, sans-serif';
      ticketElement.style.color = 'black';
      ticketElement.style.border = '2px solid #000';
      ticketElement.style.borderRadius = '8px';
      
      // Contenu du ticket
      ticketElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e50914; font-size: 32px; margin: 0;">TicketFlix</h1>
          <h2 style="color: #333; font-size: 24px; margin: 10px 0;">Billet électronique</h2>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; font-size: 20px; margin: 0 0 15px 0;">${order.eventTitle}</h3>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <p style="margin: 5px 0;"><strong>Numéro de commande:</strong></p>
            <p style="margin: 5px 0; color: #666;">${order.id}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Date:</strong></p>
            <p style="margin: 5px 0; color: #666;">${order.date.toLocaleDateString()}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Client:</strong></p>
            <p style="margin: 5px 0; color: #666;">${user.name}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Email:</strong></p>
            <p style="margin: 5px 0; color: #666;">${user.email}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: #333; margin: 0 0 10px 0;">Détails des billets:</h4>
          ${order.items.map(item => `
            <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 4px;">
              <p style="margin: 5px 0; font-weight: bold;">${item.categoryName}</p>
              <p style="margin: 5px 0; color: #666;">${item.quantity} ${item.quantity > 1 ? 'billets' : 'billet'} x ${formatCurrency(item.price)}</p>
              <p style="margin: 5px 0; font-weight: bold;">Sous-total: ${formatCurrency(item.price * item.quantity)}</p>
            </div>
          `).join('')}
        </div>
        
        <div style="border-top: 2px solid #000; padding-top: 15px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
            <span>Total:</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; font-weight: bold;">QR Code de validation:</p>
          <img src="${qrCodeUrl}" alt="QR Code" style="width: 150px; height: 150px; border: 1px solid #ddd;" />
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
          <p style="margin: 0;">Présentez ce QR code à l'entrée de l'événement pour valider votre billet.</p>
          <p style="margin: 5px 0;">Une copie de vos billets a également été envoyée à votre adresse email.</p>
        </div>
      `;
      
      document.body.appendChild(ticketElement);
      
      console.log('Élément créé, conversion en canvas...');
      
      // Convertir en canvas
      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Supprimer l'élément temporaire
      document.body.removeChild(ticketElement);
      
      console.log('Canvas créé, génération PDF...');
      
      // Créer le PDF
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // Marge de 10mm de chaque côté
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      // Centrer l'image dans le PDF
      const x = 10;
      const y = (pdfHeight - imgHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', x, y, imgWidth, imgHeight);
      pdf.save(`ticket-${order.id}.pdf`);
      
      console.log('PDF généré avec succès');
      toast.success('PDF généré avec succès !');
    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      toast.error('Erreur lors de la génération du PDF: ' + error.message);
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handlePrint = async () => {
    if (!order || !user) {
      toast.error('Données de commande manquantes');
      return;
    }
    
    try {
      console.log('Début de l\'impression...');
      
      // Créer un élément temporaire pour l'impression
      const ticketElement = document.createElement('div');
      ticketElement.style.position = 'absolute';
      ticketElement.style.left = '-9999px';
      ticketElement.style.top = '0';
      ticketElement.style.width = '800px';
      ticketElement.style.backgroundColor = 'white';
      ticketElement.style.padding = '40px';
      ticketElement.style.fontFamily = 'Arial, sans-serif';
      ticketElement.style.color = 'black';
      ticketElement.style.border = '2px solid #000';
      ticketElement.style.borderRadius = '8px';
      
      // Contenu du ticket (même que pour le PDF)
      ticketElement.innerHTML = `
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: #e50914; font-size: 32px; margin: 0;">TicketFlix</h1>
          <h2 style="color: #333; font-size: 24px; margin: 10px 0;">Billet électronique</h2>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h3 style="color: #333; font-size: 20px; margin: 0 0 15px 0;">${order.eventTitle}</h3>
        </div>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
          <div>
            <p style="margin: 5px 0;"><strong>Numéro de commande:</strong></p>
            <p style="margin: 5px 0; color: #666;">${order.id}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Date:</strong></p>
            <p style="margin: 5px 0; color: #666;">${order.date.toLocaleDateString()}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Client:</strong></p>
            <p style="margin: 5px 0; color: #666;">${user.name}</p>
          </div>
          <div>
            <p style="margin: 5px 0;"><strong>Email:</strong></p>
            <p style="margin: 5px 0; color: #666;">${user.email}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 20px;">
          <h4 style="color: #333; margin: 0 0 10px 0;">Détails des billets:</h4>
          ${order.items.map(item => `
            <div style="border: 1px solid #ddd; padding: 10px; margin: 5px 0; border-radius: 4px;">
              <p style="margin: 5px 0; font-weight: bold;">${item.categoryName}</p>
              <p style="margin: 5px 0; color: #666;">${item.quantity} ${item.quantity > 1 ? 'billets' : 'billet'} x ${formatCurrency(item.price)}</p>
              <p style="margin: 5px 0; font-weight: bold;">Sous-total: ${formatCurrency(item.price * item.quantity)}</p>
            </div>
          `).join('')}
        </div>
        
        <div style="border-top: 2px solid #000; padding-top: 15px; margin-bottom: 20px;">
          <div style="display: flex; justify-content: space-between; font-size: 18px; font-weight: bold;">
            <span>Total:</span>
            <span>${formatCurrency(order.total)}</span>
          </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 20px;">
          <p style="margin: 0 0 10px 0; font-weight: bold;">QR Code de validation:</p>
          <img src="${qrCodeUrl}" alt="QR Code" style="width: 150px; height: 150px; border: 1px solid #ddd;" />
        </div>
        
        <div style="text-align: center; font-size: 12px; color: #666; border-top: 1px solid #ddd; padding-top: 15px;">
          <p style="margin: 0;">Présentez ce QR code à l'entrée de l'événement pour valider votre billet.</p>
          <p style="margin: 5px 0;">Une copie de vos billets a également été envoyée à votre adresse email.</p>
        </div>
      `;
      
      document.body.appendChild(ticketElement);
      
      console.log('Élément créé, conversion en canvas...');
      
      // Convertir en canvas
      const canvas = await html2canvas(ticketElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });
      
      // Supprimer l'élément temporaire
      document.body.removeChild(ticketElement);
      
      console.log('Canvas créé, ouverture fenêtre d\'impression...');
      
      // Créer une nouvelle fenêtre pour l'impression
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        toast.error('Veuillez autoriser les popups pour imprimer');
        return;
      }

      const imgData = canvas.toDataURL('image/png');
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Ticket - ${order.eventTitle}</title>
          <style>
            body { 
              margin: 0; 
              padding: 20px; 
              font-family: Arial, sans-serif; 
              background: white;
            }
            .ticket-container {
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            .ticket-image {
              max-width: 100%;
              height: auto;
              border: 1px solid #ddd;
            }
            @media print {
              body { margin: 0; padding: 10px; }
              .ticket-container { min-height: auto; }
            }
          </style>
        </head>
        <body>
          <div class="ticket-container">
            <img src="${imgData}" alt="Ticket" class="ticket-image" />
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(printContent);
      printWindow.document.close();
      
      // Attendre que l'image soit chargée avant d'imprimer
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
      
      console.log('Fenêtre d\'impression ouverte');
      toast.success('Fenêtre d\'impression ouverte !');
    } catch (error) {
      console.error('Erreur lors de l\'impression:', error);
      toast.error('Erreur lors de l\'impression: ' + error.message);
    }
  };

  if (!order) return null;

  // Generate QR code for each ticket
  const qrCodeData = `
    Order ID: ${order.id}
    Customer: ${user?.name}
    Date: ${order.date.toLocaleDateString()}
    Total: ${formatCurrency(order.total)}
  `;
  
  const qrCodeUrl = generateQRCodeUrl(qrCodeData);
  
  // Vérification que toutes les données nécessaires sont présentes
  if (!qrCodeUrl) {
    console.error('QR Code URL non généré');
    return null;
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-500/20 mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Commande confirmée!</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Votre commande #{order.id} a été traitée avec succès.
            </p>
          </div>
          
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 mb-8">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Récapitulatif de la commande</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Numéro de commande</p>
                    <p className="font-medium text-gray-900 dark:text-white">{order.id}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Date</p>
                    <p className="font-medium text-gray-900 dark:text-white">{order.date.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Client</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user?.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Email</p>
                    <p className="font-medium text-gray-900 dark:text-white">{user?.email}</p>
                  </div>
                </div>
                
                <div className="border-t border-gray-200 dark:border-gray-800 pt-4 mt-4">
                  <h3 className="font-medium mb-3 text-gray-900 dark:text-white">Billets</h3>
                  <div className="space-y-4">
                    {order.items.map((item, index) => (
                      <div 
                        key={index} 
                        className="flex flex-col sm:flex-row justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md"
                      >
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{item.eventTitle}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {item.categoryName} - {item.quantity} {item.quantity > 1 ? 'billets' : 'billet'} 
                            x {formatCurrency(item.price)}
                          </p>
                        </div>
                        <div className="text-right font-medium mt-2 sm:mt-0 text-gray-900 dark:text-white">
                          {formatCurrency(item.price * item.quantity)}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  <div className="border-t border-gray-200 dark:border-gray-800 my-4 pt-4">
                    <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white">
                      <span>Total</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 mb-8">
            <CardHeader>
              <CardTitle className="text-gray-900 dark:text-white">Vos billets électroniques</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <div className="mx-auto w-48 h-48 mb-4">
                <img 
                  src={qrCodeUrl} 
                  alt="QR Code" 
                  className="w-full h-full" 
                />
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                Présentez ce QR code à l'entrée de l'événement pour valider votre billet.
                Une copie de vos billets a également été envoyée à votre adresse email.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => {
                    console.log('Bouton PDF cliqué');
                    handleDownloadPDF();
                  }}
                  disabled={isGeneratingPDF}
                  className="bg-red-600 hover:bg-red-700 dark:bg-[#e50914] dark:hover:bg-[#b0060f]"
                >
                  {isGeneratingPDF ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Génération...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Télécharger le PDF
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => {
                    console.log('Bouton Imprimer cliqué');
                    handlePrint();
                  }}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <Printer className="h-4 w-4 mr-2" />
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