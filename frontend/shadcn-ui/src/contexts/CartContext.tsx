import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Event, TicketCategory } from '@/lib/mock-data';

type CartItem = {
  eventId: number;
  eventTitle: string;
  imageUrl: string;
  ticketCategoryId: number;
  categoryName: string;
  price: number;
  quantity: number;
};

type CartContextType = {
  cartItems: CartItem[];
  addToCart: (event: Event, ticketCategory: TicketCategory, quantity: number) => void;
  removeFromCart: (eventId: number, ticketCategoryId: number) => void;
  updateQuantity: (eventId: number, ticketCategoryId: number, quantity: number) => void;
  clearCart: () => void;
  getTotal: () => number;
  getItemCount: () => number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

type CartProviderProps = {
  children: ReactNode;
};

export const CartProvider = ({ children }: CartProviderProps) => {
  // Charger le panier depuis localStorage au démarrage
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  // Fonction pour sauvegarder le panier dans localStorage
  const saveCartToStorage = (items: CartItem[]) => {
    localStorage.setItem('cart', JSON.stringify(items));
  };

  // Add item to cart
  const addToCart = (event: Event, ticketCategory: TicketCategory, quantity: number) => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        item => item.eventId === event.id && item.ticketCategoryId === ticketCategory.id
      );

      let updatedItems;
      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
      } else {
        // Add new item
        updatedItems = [...prevItems, {
          eventId: event.id,
          eventTitle: event.title,
          imageUrl: event.imageUrl,
          ticketCategoryId: ticketCategory.id,
          categoryName: ticketCategory.name,
          price: ticketCategory.price,
          quantity
        }];
      }
      
      // Sauvegarder dans localStorage
      saveCartToStorage(updatedItems);
      return updatedItems;
    });
  };

  // Remove item from cart
  const removeFromCart = (eventId: number, ticketCategoryId: number) => {
    setCartItems(prevItems => {
      const updatedItems = prevItems.filter(item => 
        !(item.eventId === eventId && item.ticketCategoryId === ticketCategoryId)
      );
      saveCartToStorage(updatedItems);
      return updatedItems;
    });
  };

  // Update quantity of an item
  const updateQuantity = (eventId: number, ticketCategoryId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(eventId, ticketCategoryId);
      return;
    }

    setCartItems(prevItems => {
      const updatedItems = prevItems.map(item => 
        item.eventId === eventId && item.ticketCategoryId === ticketCategoryId
          ? { ...item, quantity }
          : item
      );
      saveCartToStorage(updatedItems);
      return updatedItems;
    });
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
    saveCartToStorage([]);
  };

  // Calculate total price
  const getTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // Calculate total number of items
  const getItemCount = () => {
    return cartItems.reduce((count, item) => count + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getTotal,
    getItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};