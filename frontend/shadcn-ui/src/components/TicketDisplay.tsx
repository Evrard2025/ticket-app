import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, QrCode, Calendar, MapPin, User, CreditCard } from 'lucide-react';
import { api } from '@/lib/api';

interface TicketInfo {
  orderId: number;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  eventCategory: string;
  ticketCategory: string;
  ticketPrice: number;
  quantity: number;
  total: number;
  userName: string;
  userEmail: string;
  orderStatus: string;
  paymentStatus: string;
  qrCodeUrl: string;
  downloadUrl: string;
}

interface TicketItem {
  number: number;
  filename: string;
  downloadUrl: string;
  size: number;
}

interface TicketList {
  orderId: number;
  eventTitle: string;
  totalTickets: number;
  tickets: TicketItem[];
}

interface TicketDisplayProps {
  orderId: number;
}

const TicketDisplay: React.FC<TicketDisplayProps> = ({ orderId }) => {
  const [ticketInfo, setTicketInfo] = useState<TicketInfo | null>(null);
  const [ticketList, setTicketList] = useState<TicketList | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTicketInfo();
    fetchTicketList();
  }, [orderId]);

  const fetchTicketInfo = async () => {
    try {
      setLoading(true);
      const data = await api.get<TicketInfo>(`/payment/ticket/${orderId}/info`);
      setTicketInfo(data);
      setError('');
    } catch (err) {
      setError('Erreur lors du chargement du ticket');
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTicketList = async () => {
    try {
      const data = await api.get<TicketList>(`/payment/ticket/${orderId}/list`);
      setTicketList(data);
    } catch (err) {
      console.error('Erreur lors du chargement de la liste des tickets:', err);
    }
  };

  const downloadTicket = async (ticketNumber?: number) => {
    try {
      // Utiliser fetch directement pour télécharger le fichier
      const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const url = ticketNumber 
        ? `${API_BASE_URL}/api/payment/ticket/${orderId}/download?ticketNumber=${ticketNumber}`
        : `${API_BASE_URL}/api/payment/ticket/${orderId}/download`;
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'image/png',
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors du téléchargement');
      }

      const blob = await response.blob();
      const url2 = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url2;
      a.download = ticketNumber ? `ticket-${orderId}-${ticketNumber}.png` : `ticket-${orderId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url2);
      document.body.removeChild(a);
      
      console.log(`✅ Ticket ${ticketNumber ? `${orderId}-${ticketNumber}` : orderId} téléchargé avec succès`);
    } catch (err) {
      console.error('Erreur lors du téléchargement:', err);
      setError('Erreur lors du téléchargement du ticket. Veuillez vérifier votre connexion.');
    }
  };

  const downloadAllTickets = async () => {
    if (!ticketList) return;
    
    for (const ticket of ticketList.tickets) {
      try {
        await downloadTicket(ticket.number);
        // Petit délai entre les téléchargements pour éviter les conflits
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        console.error(`Erreur lors du téléchargement du ticket ${ticket.number}:`, err);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du ticket...</p>
        </div>
      </div>
    );
  }

  if (error || !ticketInfo) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="p-6">
          <div className="text-center text-red-500">
            <p>{error || 'Ticket non trouvé'}</p>
            <Button 
              onClick={fetchTicketInfo} 
              variant="outline" 
              className="mt-4"
            >
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const eventDate = new Date(ticketInfo.eventDate);
  const formattedDate = eventDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  const formattedTime = eventDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* En-tête du ticket */}
      <Card className="bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="text-2xl">🎫</div>
              <div>
                <CardTitle className="text-lg">TicketFlix</CardTitle>
                <p className="text-sm opacity-90">Votre ticket électronique</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-500 text-white">
              CONFIRMÉ
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Informations de l'événement */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-800">
            {ticketInfo.eventTitle}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-3">
            <Calendar className="h-5 w-5 text-blue-500" />
            <div>
              <p className="font-medium">{formattedDate}</p>
              <p className="text-sm text-gray-600">à {formattedTime}</p>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <MapPin className="h-5 w-5 text-red-500" />
            <p className="font-medium">{ticketInfo.eventLocation}</p>
          </div>

          <div className="flex items-center space-x-3">
            <User className="h-5 w-5 text-green-500" />
            <div>
              <p className="font-medium">{ticketInfo.userName}</p>
              <p className="text-sm text-gray-600">{ticketInfo.userEmail}</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600">Catégorie</p>
                <p className="font-medium">{ticketInfo.ticketCategory}</p>
              </div>
              <div>
                <p className="text-gray-600">Quantité</p>
                <p className="font-medium">{ticketInfo.quantity}</p>
              </div>
              <div>
                <p className="text-gray-600">Prix unitaire</p>
                <p className="font-medium">{ticketInfo.ticketPrice}€</p>
              </div>
              <div>
                <p className="text-gray-600">Total</p>
                <p className="font-medium text-lg text-blue-600">{ticketInfo.total}€</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code */}
      <Card>
        <CardContent className="p-6 text-center">
          <div className="bg-white p-4 rounded-lg inline-block">
            <img 
              src={ticketInfo.qrCodeUrl} 
              alt="QR Code" 
              className="w-32 h-32 mx-auto"
            />
          </div>
          <p className="text-sm text-gray-600 mt-3">
            Présentez ce QR code à l'entrée
          </p>
        </CardContent>
      </Card>

      {/* Boutons d'action */}
      <div className="space-y-3">
        {/* Section des tickets disponibles */}
        {ticketList && ticketList.tickets.length > 1 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg font-bold text-gray-800">
                📋 Vos {ticketList.totalTickets} tickets
              </CardTitle>
              <p className="text-sm text-gray-600">
                Téléchargez chaque ticket individuellement ou tous en une fois
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Bouton pour télécharger tous les tickets */}
              <Button 
                onClick={downloadAllTickets}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Download className="h-4 w-4 mr-2" />
                Télécharger tous les tickets ({ticketList.totalTickets})
              </Button>
              
              {/* Liste des tickets individuels */}
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Ou téléchargez individuellement :</p>
                {ticketList.tickets.map((ticket) => (
                  <div key={ticket.number} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-bold text-blue-600">{ticket.number}</span>
                      </div>
                      <div>
                        <p className="font-medium">Ticket {ticket.number}</p>
                        <p className="text-xs text-gray-500">
                          {(ticket.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => downloadTicket(ticket.number)}
                      variant="outline"
                      size="sm"
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Télécharger
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Bouton de téléchargement simple pour un seul ticket */}
        {(!ticketList || ticketList.tickets.length <= 1) && (
          <Button 
            onClick={() => downloadTicket()}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-4 w-4 mr-2" />
            Télécharger le ticket
          </Button>
        )}

        {/* Bouton pour voir le QR Code */}
        <Button 
          variant="outline" 
          className="w-full"
          onClick={() => {
            const newWindow = window.open();
            if (newWindow) {
              newWindow.document.write(`
                <html>
                  <head>
                    <title>QR Code - ${ticketInfo.eventTitle}</title>
                    <style>
                      body { 
                        font-family: Arial, sans-serif; 
                        text-align: center; 
                        padding: 20px;
                        background: #f5f5f5;
                      }
                      .qr-container {
                        background: white;
                        padding: 20px;
                        border-radius: 10px;
                        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        display: inline-block;
                        margin: 20px;
                      }
                      h1 { color: #333; }
                      p { color: #666; }
                    </style>
                  </head>
                  <body>
                    <h1>QR Code - ${ticketInfo.eventTitle}</h1>
                    <div class="qr-container">
                      <img src="${ticketInfo.qrCodeUrl}" alt="QR Code" style="width: 200px; height: 200px;">
                      <p>Présentez ce QR code à l'entrée</p>
                    </div>
                  </body>
                </html>
              `);
            }
          }}
        >
          <QrCode className="h-4 w-4 mr-2" />
          Voir le QR Code en grand
        </Button>
      </div>

      {/* Informations importantes */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardContent className="p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">📱 Informations importantes</h3>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Arrivez 30 minutes avant le début de l'événement</li>
            <li>• Présentez votre ticket sur votre téléphone ou en impression</li>
            <li>• Une pièce d'identité peut être demandée</li>
            <li>• Ce ticket est nominatif et non transférable</li>
            {ticketList && ticketList.tickets.length > 1 && (
              <li>• Chaque personne doit présenter son propre ticket</li>
            )}
          </ul>
        </CardContent>
      </Card>

      {/* Statut du paiement */}
      <Card className="bg-green-50 border-green-200">
        <CardContent className="p-4">
          <div className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">Paiement confirmé</p>
              <p className="text-sm text-green-600">
                Commande #{ticketInfo.orderId.toString().padStart(6, '0')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TicketDisplay;