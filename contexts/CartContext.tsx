'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { toast } from '@/components/ui/use-toast';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  nameAr?: string;
  price: number;
  quantity: number;
  image?: string;
  maxQuantity?: number;
}

interface CartContextType {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  addItem: (item: Omit<CartItem, 'id'>) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { data: session } = useSession();

  // Load cart from localStorage or API
  useEffect(() => {
    const loadCart = async () => {
      if (session?.user) {
        // Load from API for logged-in users
        try {
          const response = await fetch('/api/cart');
          if (response.ok) {
            const data = await response.json();
            setItems(data.items || []);
          }
        } catch (error) {
          console.error('Failed to load cart:', error);
        }
      } else {
        // Load from localStorage for guests
        const savedCart = localStorage.getItem('cart');
        if (savedCart) {
          setItems(JSON.parse(savedCart));
        }
      }
    };

    loadCart();
  }, [session]);

  // Save cart to localStorage for guests
  useEffect(() => {
    if (!session?.user) {
      localStorage.setItem('cart', JSON.stringify(items));
    }
  }, [items, session]);

  const addItem = async (item: Omit<CartItem, 'id'>) => {
    setIsLoading(true);
    try {
      const existingItem = items.find(i => i.productId === item.productId);
      
      if (existingItem) {
        // Update quantity if item exists
        await updateQuantity(existingItem.id, existingItem.quantity + item.quantity);
      } else {
        // Add new item
        const newItem: CartItem = {
          ...item,
          id: `cart-${Date.now()}-${Math.random()}`,
        };

        if (session?.user) {
          // Save to API for logged-in users
          const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem),
          });

          if (!response.ok) throw new Error('Failed to add item');
        }

        setItems(prev => [...prev, newItem]);
        toast({
          title: 'Added to cart',
          description: `${item.name} has been added to your cart.`,
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add item to cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const removeItem = async (itemId: string) => {
    setIsLoading(true);
    try {
      if (session?.user) {
        const response = await fetch(`/api/cart/remove/${itemId}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to remove item');
      }

      setItems(prev => prev.filter(item => item.id !== itemId));
      toast({
        title: 'Removed from cart',
        description: 'Item has been removed from your cart.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to remove item from cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeItem(itemId);
      return;
    }

    setIsLoading(true);
    try {
      if (session?.user) {
        const response = await fetch(`/api/cart/update/${itemId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ quantity }),
        });

        if (!response.ok) throw new Error('Failed to update quantity');
      }

      setItems(prev =>
        prev.map(item =>
          item.id === itemId ? { ...item, quantity } : item
        )
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update quantity',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const clearCart = async () => {
    setIsLoading(true);
    try {
      if (session?.user) {
        const response = await fetch('/api/cart/clear', {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Failed to clear cart');
      }

      setItems([]);
      toast({
        title: 'Cart cleared',
        description: 'All items have been removed from your cart.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to clear cart',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        items,
        totalItems,
        totalPrice,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}