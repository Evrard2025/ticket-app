import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { api } from '@/lib/api';

export type Order = {
  id: string | number;
  date: Date | string;
  items: {
    ticketId: number;
    eventId: number;
    eventTitle: string;
    eventDescription: string;
    eventDate: string;
    eventVenue: string;
    eventImage: string;
    categoryName: string;
    price: number;
    quantity: number;
  }[];
  total: number;
  status: 'pending' | 'completed' | 'cancelled' | 'confirmed' | 'paid';
  userId: string;
};

type OrderContextType = {
  orders: Order[];
  loading: boolean;
  error: string | null;
  createOrder: (items: any[], total: number, userId: string) => Promise<Order>;
  getOrderById: (id: string) => Order | undefined;
  getUserOrders: (userId: string) => Order[];
  refreshOrders: (userId: string) => Promise<void>;
};

const OrderContext = createContext<OrderContextType | undefined>(undefined);

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within an OrderProvider');
  }
  return context;
};

type OrderProviderProps = {
  children: ReactNode;
};

export const OrderProvider = ({ children }: OrderProviderProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Récupérer les commandes d'un utilisateur depuis l'API avec protection contre les appels multiples
  const refreshOrders = useCallback(async (userId: string) => {
    if (!userId) {
      console.log('❌ refreshOrders: userId manquant');
      return;
    }

    // Si on charge déjà pour le même utilisateur, ne rien faire
    if (loading && currentUserId === userId) {
      console.log(`⏳ refreshOrders: Déjà en cours pour l'utilisateur ${userId}`);
      return;
    }

    // Annuler la requête précédente si elle existe
    if (abortControllerRef.current) {
      console.log('🛑 Annulation de la requête précédente');
      abortControllerRef.current.abort();
    }

    // Créer un nouveau contrôleur pour cette requête
    abortControllerRef.current = new AbortController();
    
    console.log(`🔄 refreshOrders: Début pour l'utilisateur ${userId}`);
    setLoading(true);
    setError(null);
    setCurrentUserId(userId);
    
    try {
      console.log(`📡 Appel API: /orders/user-tickets/${userId}`);
      const userOrders = await api.get<Order[]>(`/orders/user-tickets/${userId}`);
      console.log(`✅ API réponse:`, userOrders);
      
      // Vérifier si la requête n'a pas été annulée
      if (abortControllerRef.current?.signal.aborted) {
        console.log('🛑 Requête annulée, arrêt du traitement');
        return;
      }
      
      // Convertir les dates string en objets Date
      const ordersWithDates = userOrders.map(order => ({
        ...order,
        date: new Date(order.date)
      }));
      
      console.log(`📋 Commandes traitées:`, ordersWithDates);
      setOrders(ordersWithDates);
    } catch (err) {
      // Ne pas afficher l'erreur si c'est une annulation
      if (err.name === 'AbortError') {
        console.log('🛑 Requête annulée');
        return;
      }
      
      console.error('❌ Erreur lors de la récupération des commandes:', err);
      setError('Erreur lors du chargement des commandes');
      setOrders([]); // Réinitialiser les commandes en cas d'erreur
    } finally {
      console.log('🏁 refreshOrders: Fin');
      setLoading(false);
      setCurrentUserId(null);
      abortControllerRef.current = null;
    }
  }, [loading, currentUserId]);

  // Create a new order (maintenu pour compatibilité)
  const createOrder = async (items: any[], total: number, userId: string): Promise<Order> => {
    // Cette fonction peut être utilisée pour créer une commande temporaire
    // avant la confirmation du paiement
    const newOrder: Order = {
      id: `temp-${Date.now()}`,
      date: new Date(),
      items,
      total,
      status: 'pending',
      userId
    };

    setOrders(prevOrders => [...prevOrders, newOrder]);
    return newOrder;
  };

  // Get an order by ID
  const getOrderById = (id: string): Order | undefined => {
    return orders.find(order => order.id.toString() === id);
  };

  // Get all orders for a specific user
  const getUserOrders = (userId: string): Order[] => {
    return orders.filter(order => order.userId === userId);
  };

  // Nettoyer le contrôleur lors du démontage
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const value = {
    orders,
    loading,
    error,
    createOrder,
    getOrderById,
    getUserOrders,
    refreshOrders
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};