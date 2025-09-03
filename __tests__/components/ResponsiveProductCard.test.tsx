import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ResponsiveProductCard } from '@/components/responsive/ResponsiveProductCard';
import { toast } from 'react-hot-toast';

// Mock dependencies
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('@/lib/responsive', () => ({
  useIsMobile: () => false,
}));

// Mock fetch
global.fetch = vi.fn();

describe('ResponsiveProductCard', () => {
  const mockProduct = {
    id: '1',
    name: 'Medical Device',
    nameAr: 'جهاز طبي',
    price: 100,
    compareAtPrice: 120,
    image: '/test-image.jpg',
    category: 'DIAGNOSTIC',
    rating: 4.5,
    reviewCount: 10,
    supplier: 'Medical Supplies Co',
    inStock: true,
    quantity: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    });
  });

  describe('Grid Variant', () => {
    it('renders product information correctly', () => {
      render(<ResponsiveProductCard product={mockProduct} />);

      expect(screen.getByText('Medical Device')).toBeInTheDocument();
      expect(screen.getByText('DIAGNOSTIC')).toBeInTheDocument();
      expect(screen.getByText('by Medical Supplies Co')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByText('$120.00')).toBeInTheDocument();
      expect(screen.getByText('-17%')).toBeInTheDocument();
      expect(screen.getByText('4.5 (10)')).toBeInTheDocument();
      expect(screen.getByText('In Stock')).toBeInTheDocument();
    });

    it('renders Arabic name when language is Arabic', () => {
      render(<ResponsiveProductCard product={mockProduct} language="ar" />);
      
      expect(screen.getByText('جهاز طبي')).toBeInTheDocument();
    });

    it('handles add to cart click', async () => {
      render(<ResponsiveProductCard product={mockProduct} />);
      
      const addButton = screen.getByRole('button', { name: /add to cart/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/cart/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: '1', quantity: 1 }),
        });
        expect(toast.success).toHaveBeenCalledWith('Added to cart!', expect.any(Object));
      });
    });

    it('handles wishlist toggle', async () => {
      render(<ResponsiveProductCard product={mockProduct} />);
      
      const wishlistButton = screen.getAllByRole('button')[0]; // First button is wishlist
      fireEvent.click(wishlistButton);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/wishlist/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ productId: '1' }),
        });
      });
    });

    it('disables add to cart when out of stock', () => {
      const outOfStockProduct = { ...mockProduct, inStock: false };
      render(<ResponsiveProductCard product={outOfStockProduct} />);
      
      const addButton = screen.getByRole('button', { name: /add to cart/i });
      expect(addButton).toBeDisabled();
    });

    it('shows loading state when adding to cart', async () => {
      render(<ResponsiveProductCard product={mockProduct} />);
      
      const addButton = screen.getByRole('button', { name: /add to cart/i });
      fireEvent.click(addButton);

      expect(screen.getByText('Adding...')).toBeInTheDocument();
      
      await waitFor(() => {
        expect(screen.getByText('Add to Cart')).toBeInTheDocument();
      });
    });

    it('handles API errors gracefully', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Server error' }),
      });

      render(<ResponsiveProductCard product={mockProduct} />);
      
      const addButton = screen.getByRole('button', { name: /add to cart/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(toast.error).toHaveBeenCalledWith('Failed to add to cart');
      });
    });
  });

  describe('List Variant', () => {
    it('renders in horizontal layout', () => {
      render(<ResponsiveProductCard product={mockProduct} variant="list" />);
      
      // Check for list-specific layout
      const card = screen.getByText('Medical Device').closest('.flex-col.sm\\:flex-row');
      expect(card).toBeInTheDocument();
    });

    it('displays all product information in list view', () => {
      render(<ResponsiveProductCard product={mockProduct} variant="list" />);
      
      expect(screen.getByText('Medical Device')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });
  });

  describe('Compact Variant', () => {
    it('renders minimal information', () => {
      render(<ResponsiveProductCard product={mockProduct} variant="compact" />);
      
      expect(screen.getByText('Medical Device')).toBeInTheDocument();
      expect(screen.getByText('$100.00')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /add/i })).toBeInTheDocument();
    });

    it('uses smaller image size', () => {
      render(<ResponsiveProductCard product={mockProduct} variant="compact" />);
      
      const image = screen.getByAltText('Medical Device');
      expect(image.parentElement).toHaveClass('w-20', 'h-20');
    });
  });

  describe('Accessibility', () => {
    it('has accessible button labels', () => {
      render(<ResponsiveProductCard product={mockProduct} />);
      
      expect(screen.getByRole('button', { name: /add to cart/i })).toBeInTheDocument();
    });

    it('announces loading state to screen readers', async () => {
      render(<ResponsiveProductCard product={mockProduct} />);
      
      const addButton = screen.getByRole('button', { name: /add to cart/i });
      fireEvent.click(addButton);

      const srOnly = screen.getByText('Loading...', { selector: '.sr-only' });
      expect(srOnly).toHaveAttribute('aria-live', 'polite');
    });

    it('provides alt text for images', () => {
      render(<ResponsiveProductCard product={mockProduct} />);
      
      const image = screen.getByAltText('Medical Device');
      expect(image).toBeInTheDocument();
    });
  });

  describe('Custom Event Handlers', () => {
    it('calls custom onAddToCart handler', async () => {
      const mockAddToCart = vi.fn();
      render(
        <ResponsiveProductCard 
          product={mockProduct} 
          onAddToCart={mockAddToCart}
        />
      );
      
      const addButton = screen.getByRole('button', { name: /add to cart/i });
      fireEvent.click(addButton);

      await waitFor(() => {
        expect(mockAddToCart).toHaveBeenCalledWith(mockProduct);
        expect(global.fetch).not.toHaveBeenCalled();
      });
    });

    it('calls custom onAddToWishlist handler', async () => {
      const mockAddToWishlist = vi.fn();
      render(
        <ResponsiveProductCard 
          product={mockProduct} 
          onAddToWishlist={mockAddToWishlist}
        />
      );
      
      const wishlistButton = screen.getAllByRole('button')[0];
      fireEvent.click(wishlistButton);

      await waitFor(() => {
        expect(mockAddToWishlist).toHaveBeenCalledWith(mockProduct);
      });
    });
  });

  describe('Share Functionality', () => {
    it('uses native share API when available', async () => {
      const mockShare = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'share', {
        value: mockShare,
        configurable: true,
      });

      render(<ResponsiveProductCard product={mockProduct} />);
      
      const shareButton = screen.getAllByRole('button')[1]; // Second button is share
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockShare).toHaveBeenCalledWith({
          title: 'Medical Device',
          text: 'Check out Medical Device on Medical Devices Marketplace',
          url: expect.stringContaining('/products/1'),
        });
      });
    });

    it('falls back to clipboard copy when share API not available', async () => {
      const mockWriteText = vi.fn().mockResolvedValue(undefined);
      Object.defineProperty(navigator, 'clipboard', {
        value: { writeText: mockWriteText },
        configurable: true,
      });
      
      delete (navigator as any).share;

      render(<ResponsiveProductCard product={mockProduct} />);
      
      const shareButton = screen.getAllByRole('button')[1];
      fireEvent.click(shareButton);

      await waitFor(() => {
        expect(mockWriteText).toHaveBeenCalledWith(expect.stringContaining('/products/1'));
        expect(toast.success).toHaveBeenCalledWith('Link copied to clipboard!');
      });
    });
  });
});