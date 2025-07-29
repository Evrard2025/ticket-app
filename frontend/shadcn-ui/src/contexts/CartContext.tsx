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
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Add item to cart
  const addToCart = (event: Event, ticketCategory: TicketCategory, quantity: number) => {
    setCartItems(prevItems => {
      // Check if item already exists in cart
      const existingItemIndex = prevItems.findIndex(
        item => item.eventId === event.id && item.ticketCategoryId === ticketCategory.id
      );

      if (existingItemIndex !== -1) {
        // Update quantity of existing item
        const updatedItems = [...prevItems];
        updatedItems[existingItemIndex].quantity += quantity;
        return updatedItems;
      } else {
        // Add new item
        return [...prevItems, {
          eventId: event.id,
          eventTitle: event.title,
          imageUrl: event.imageUrl,
          ticketCategoryId: ticketCategory.id,
          categoryName: ticketCategory.name,
          price: ticketCategory.price,
          quantity
        }];
      }
    });
  };

  // Remove item from cart
  const removeFromCart = (eventId: number, ticketCategoryId: number) => {
    setCartItems(prevItems => 
      prevItems.filter(item => 
        !(item.eventId === eventId && item.ticketCategoryId === ticketCategoryId)
      )
    );
  };

  // Update quantity of an item
  const updateQuantity = (eventId: number, ticketCategoryId: number, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(eventId, ticketCategoryId);
      return;
    }

    setCartItems(prevItems => 
      prevItems.map(item => 
        item.eventId === eventId && item.ticketCategoryId === ticketCategoryId
          ? { ...item, quantity }
          : item
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCartItems([]);
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