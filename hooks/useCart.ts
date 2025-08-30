'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useToast } from './use-toast';
import { useAuth } from './useAuth';

// Types
interface CartItem {
  id: string;
  productId: string;
  product: {
    id: string;
    name: string;
    nameAr?: string;
    price: number;
    originalPrice?: number;
    images: string[];
    supplier?: {
      id: string;
      companyName: string;
    };
  };
  quantity: number;
  available: boolean;
  subtotal: number;
  metadata?: any;
}

interface CartSummary {
  itemCount: number;
  subtotal: number;
  tax: number;
  taxRate: number;
  shipping: number;
  total: number;
  currency: string;
}

interface CartContextType {
  items: CartItem[];
  summary: CartSummary | null;
  isLoading: boolean;
  itemCount: number;
  addToCart: (productId: string, quantity?: number, metadata?: any) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  refreshCart: () => Promise<void>;
  isInCart: (productId: string) => boolean;
  getItemQuantity: (productId: string) => number;
}

// Create context
const CartContext = createContext<CartContextType | undefined>(undefined);

// Provider component
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [summary, setSummary] = useState<CartSummary | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { isAuthenticated } = useAuth();

  // Fetch cart data
  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      // Load from localStorage for guests
      const localCart = localStorage.getItem('guestCart');
      if (localCart) {
        const cartData = JSON.parse(localCart);
        setItems(cartData.items || []);
        setSummary(cartData.summary || null);
      }
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/cart', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setItems(data.data.items);
        setSummary(data.data.summary);
      }
    } catch (error) {
      console.error('Failed to fetch cart:', error);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  // Load cart on mount and auth change
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  // Add item to cart
  const addToCart = useCallback(async (
    productId: string,
    quantity: number = 1,
    metadata?: any
  ) => {
    try {
      setIsLoading(true);

      if (!isAuthenticated) {
        // Handle guest cart
        const existingItem = items.find(item => item.productId === productId);
        
        if (existingItem) {
          // Update quantity
          const updatedItems = items.map(item =>
            item.productId === productId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
          setItems(updatedItems);
          localStorage.setItem('guestCart', JSON.stringify({ items: updatedItems, summary }));
        } else {
          // Fetch product details and add to cart
          const productResponse = await fetch(`/api/products/${productId}`);
          const productData = await productResponse.json();
          
          if (productData.success) {
            const newItem: CartItem = {
              id: `guest-${Date.now()}`,
              productId,
              product: {
                id: productId,
                name: productData.data.name,
                nameAr: productData.data.nameAr,
                price: productData.data.price,
                originalPrice: productData.data.originalPrice,
                images: productData.data.images,
                supplier: productData.data.supplier
              },
              quantity,
              available: true,
              subtotal: productData.data.price * quantity,
              metadata
            };
            
            const updatedItems = [...items, newItem];
            setItems(updatedItems);
            localStorage.setItem('guestCart', JSON.stringify({ items: updatedItems, summary }));
          }
        }
        
        toast({
          title: 'Added to cart',
          description: 'Item has been added to your cart',
        });
        return;
      }

      // Authenticated user
      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ productId, quantity, metadata })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add to cart');
      }

      toast({
        title: 'Added to cart',
        description: data.data.message,
      });

      // Refresh cart
      await fetchCart();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add item to cart',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, items, summary, fetchCart, toast]);

  // Update item quantity
  const updateQuantity = useCallback(async (itemId: string, quantity: number) => {
    try {
      setIsLoading(true);

      if (!isAuthenticated) {
        // Handle guest cart
        const updatedItems = items.map(item =>
          item.id === itemId
            ? { ...item, quantity, subtotal: item.product.price * quantity }
            : item
        );
        setItems(updatedItems);
        localStorage.setItem('guestCart', JSON.stringify({ items: updatedItems, summary }));
        return;
      }

      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/cart?itemId=${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ quantity })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update cart');
      }

      // Refresh cart
      await fetchCart();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update cart',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, items, summary, fetchCart, toast]);

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId: string) => {
    try {
      setIsLoading(true);

      if (!isAuthenticated) {
        // Handle guest cart
        const updatedItems = items.filter(item => item.id !== itemId);
        setItems(updatedItems);
        localStorage.setItem('guestCart', JSON.stringify({ items: updatedItems, summary }));
        
        toast({
          title: 'Removed from cart',
          description: 'Item has been removed from your cart',
        });
        return;
      }

      const token = localStorage.getItem('accessToken');
      
      const response = await fetch(`/api/cart?itemId=${itemId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to remove from cart');
      }

      toast({
        title: 'Removed from cart',
        description: data.message,
      });

      // Refresh cart
      await fetchCart();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove item',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, items, summary, fetchCart, toast]);

  // Clear entire cart
  const clearCart = useCallback(async () => {
    try {
      setIsLoading(true);

      if (!isAuthenticated) {
        // Handle guest cart
        setItems([]);
        setSummary(null);
        localStorage.removeItem('guestCart');
        
        toast({
          title: 'Cart cleared',
          description: 'All items have been removed from your cart',
        });
        return;
      }

      const token = localStorage.getItem('accessToken');
      
      const response = await fetch('/api/cart?clearAll=true', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to clear cart');
      }

      setItems([]);
      setSummary(null);
      
      toast({
        title: 'Cart cleared',
        description: data.message,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to clear cart',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, toast]);

  // Check if product is in cart
  const isInCart = useCallback((productId: string) => {
    return items.some(item => item.productId === productId);
  }, [items]);

  // Get item quantity in cart
  const getItemQuantity = useCallback((productId: string) => {
    const item = items.find(item => item.productId === productId);
    return item?.quantity || 0;
  }, [items]);

  const value = {
    items,
    summary,
    isLoading,
    itemCount: items.reduce((sum, item) => sum + item.quantity, 0),
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    refreshCart: fetchCart,
    isInCart,
    getItemQuantity
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

// Hook to use cart context
export function useCart() {
  const context = useContext(CartContext);
  
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  
  return context;
}