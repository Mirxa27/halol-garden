import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET, POST } from '@/app/api/products/route';
import prisma from '@/lib/prisma';
import { getCurrentUser, isSupplier } from '@/lib/auth';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  default: {
    product: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
    equipmentSupplier: {
      findUnique: vi.fn(),
    },
    salesDetails: {
      create: vi.fn(),
    },
    rentalDetails: {
      create: vi.fn(),
    },
  },
}));

vi.mock('@/lib/auth', () => ({
  getCurrentUser: vi.fn(),
  isSupplier: vi.fn(),
}));

describe('Products API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/products', () => {
    it('should return products with pagination', async () => {
      const mockProducts = [
        {
          id: '1',
          name: 'Product 1',
          price: 100,
          supplier: { companyName: 'Supplier 1' },
        },
        {
          id: '2',
          name: 'Product 2',
          price: 200,
          supplier: { companyName: 'Supplier 2' },
        },
      ];

      prisma.product.findMany.mockResolvedValue(mockProducts);
      prisma.product.count.mockResolvedValue(10);

      const request = new NextRequest('http://localhost/api/products?page=1&limit=2');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.products).toHaveLength(2);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 2,
        total: 10,
        totalPages: 5,
      });
    });

    it('should filter products by category', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost/api/products?category=DIAGNOSTIC'
      );
      await GET(request);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            category: 'DIAGNOSTIC',
          }),
        })
      );
    });

    it('should search products by query', async () => {
      prisma.product.findMany.mockResolvedValue([]);
      prisma.product.count.mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost/api/products?search=ultrasound'
      );
      await GET(request);

      expect(prisma.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: expect.arrayContaining([
              { name: { contains: 'ultrasound', mode: 'insensitive' } },
              { description: { contains: 'ultrasound', mode: 'insensitive' } },
            ]),
          }),
        })
      );
    });

    it('should handle errors gracefully', async () => {
      prisma.product.findMany.mockRejectedValue(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/products');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBeDefined();
    });
  });

  describe('POST /api/products', () => {
    const mockUser = {
      id: 'user-123',
      email: 'supplier@example.com',
      role: 'EQUIPMENT_SUPPLIER',
    };

    const mockSupplier = {
      id: 'supplier-123',
      companyName: 'Medical Supplies Co',
      verified: true,
    };

    const validProductData = {
      name: 'New Medical Device',
      nameAr: 'جهاز طبي جديد',
      description: 'High-quality medical device',
      descriptionAr: 'جهاز طبي عالي الجودة',
      category: 'DIAGNOSTIC',
      price: 1000,
      quantity: 50,
      images: ['https://example.com/image1.jpg'],
      specifications: {
        weight: '5kg',
        dimensions: '30x20x15cm',
      },
    };

    it('should create product for authenticated supplier', async () => {
      getCurrentUser.mockResolvedValue(mockUser);
      isSupplier.mockResolvedValue(true);
      prisma.equipmentSupplier.findUnique.mockResolvedValue(mockSupplier);
      prisma.product.create.mockResolvedValue({
        id: 'product-123',
        ...validProductData,
        supplierId: mockSupplier.id,
      });

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify(validProductData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.product).toBeDefined();
      expect(prisma.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            supplierId: mockSupplier.id,
          }),
        })
      );
    });

    it('should reject unauthenticated requests', async () => {
      getCurrentUser.mockResolvedValue(null);

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify(validProductData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Authentication required');
    });

    it('should reject non-supplier users', async () => {
      getCurrentUser.mockResolvedValue({
        ...mockUser,
        role: 'INDIVIDUAL_CUSTOMER',
      });
      isSupplier.mockResolvedValue(false);

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify(validProductData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Only suppliers can add products');
    });

    it('should validate product data', async () => {
      getCurrentUser.mockResolvedValue(mockUser);
      isSupplier.mockResolvedValue(true);
      prisma.equipmentSupplier.findUnique.mockResolvedValue(mockSupplier);

      const invalidData = {
        name: '', // Invalid: empty name
        price: -100, // Invalid: negative price
      };

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify(invalidData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Validation');
    });

    it('should handle database errors', async () => {
      getCurrentUser.mockResolvedValue(mockUser);
      isSupplier.mockResolvedValue(true);
      prisma.equipmentSupplier.findUnique.mockResolvedValue(mockSupplier);
      prisma.product.create.mockRejectedValue(new Error('Database connection lost'));

      const request = new NextRequest('http://localhost/api/products', {
        method: 'POST',
        body: JSON.stringify(validProductData),
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
    });
  });
});