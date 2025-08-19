import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '../../app/api/products/route';
import { GET as getProduct, PUT, DELETE } from '../../app/api/products/[id]/route';
import { prisma } from '../../lib/prisma';

describe('Products API', () => {
  let testProductId: string;
  let testSupplierId: string;

  beforeEach(async () => {
    // Create a test supplier
    const supplier = await prisma.equipmentSupplier.create({
      data: {
        userId: 'test-supplier-user-id',
        companyName: 'Test Supplier',
        businessRegistrationNumber: 'TEST001',
        taxRegistrationNumber: 'TAX001',
        yearEstablished: 2020,
        returnPolicy: '30-day return policy',
        warrantyTerms: '2-year warranty',
        address: {
          street: '123 Test Street',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345',
        },
        warehouseLocations: [],
        productCategories: ['DIAGNOSTIC'],
        brands: ['Test Brand'],
        certifications: [],
        bankDetails: {},
        deliveryCapabilities: {},
      },
    });
    testSupplierId = supplier.id;

    // Create a test product
    const product = await prisma.product.create({
      data: {
        supplierId: testSupplierId,
        sku: 'TEST-PROD-001',
        name: 'Test Product',
        nameAr: 'منتج تجريبي',
        description: 'A test product for testing purposes',
        descriptionAr: 'منتج تجريبي لأغراض الاختبار',
        category: 'DIAGNOSTIC',
        subcategory: 'Test',
        brand: 'Test Brand',
        model: 'Test Model',
        condition: 'NEW',
        availabilityType: 'BOTH',
        status: 'ACTIVE',
        images: ['https://example.com/image1.jpg'],
        specifications: { test: 'spec' },
        certifications: [],
        warranty: {},
        dimensions: {},
        weight: 100,
        tags: ['test'],
        salesDetails: {
          create: {
            basePrice: 1000,
            taxRate: 5,
            inventory: { quantity: 10 },
            shipping: {},
            bulkPricing: {},
          },
        },
        rentalDetails: {
          create: {
            dailyRate: 100,
            weeklyRate: 600,
            monthlyRate: 2000,
            securityDeposit: 500,
            deliveryFee: 50,
            setupFee: 100,
            minimumRentalPeriod: 1,
            maximumRentalPeriod: 365,
            inventory: { quantity: 5 },
            rentalTerms: {},
            maintenanceSchedule: {},
          },
        },
      },
    });
    testProductId = product.id;
  });

  afterEach(async () => {
    // Clean up test data
    await prisma.productReview.deleteMany();
    await prisma.productQuestion.deleteMany();
    await prisma.productAnswer.deleteMany();
    await prisma.wishlistItem.deleteMany();
    await prisma.cartItem.deleteMany();
    await prisma.orderItem.deleteMany();
    await prisma.rentalItem.deleteMany();
    await prisma.rentalUnit.deleteMany();
    await prisma.rentalProduct.deleteMany();
    await prisma.salesProduct.deleteMany();
    await prisma.product.deleteMany();
    await prisma.equipmentSupplier.deleteMany();
  });

  describe('GET /api/products', () => {
    it('should return products with pagination', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/products?page=1&limit=10',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeInstanceOf(Array);
      expect(data.pagination).toBeDefined();
      expect(data.pagination.page).toBe(1);
      expect(data.pagination.limit).toBe(10);
    });

    it('should filter products by category', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/products?category=DIAGNOSTIC',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.every((product: any) => product.category === 'DIAGNOSTIC')).toBe(true);
    });

    it('should search products by name', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/products?search=Test Product',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.some((product: any) => product.name.includes('Test Product'))).toBe(true);
    });

    it('should sort products by price', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/products?sortBy=price&sortOrder=asc',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
    });

    it('should handle invalid query parameters', async () => {
      const { req } = createMocks({
        method: 'GET',
        url: '/api/products?page=invalid',
      });

      const response = await GET(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid query parameters');
    });
  });

  describe('POST /api/products', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Test Product',
        nameAr: 'منتج تجريبي جديد',
        description: 'A new test product for testing purposes',
        descriptionAr: 'منتج تجريبي جديد لأغراض الاختبار',
        category: 'DIAGNOSTIC',
        subcategory: 'Test',
        brand: 'Test Brand',
        model: 'Test Model',
        condition: 'NEW',
        availabilityType: 'SALE',
        images: ['https://example.com/image1.jpg'],
        specifications: { test: 'spec' },
        basePrice: 2000,
        taxRate: 5,
      };

      const { req } = createMocks({
        method: 'POST',
        body: productData,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('New Test Product');
      expect(data.data.sku).toBeDefined();
    });

    it('should create a rental product', async () => {
      const productData = {
        name: 'Rental Test Product',
        nameAr: 'منتج إيجار تجريبي',
        description: 'A rental test product for testing purposes',
        descriptionAr: 'منتج إيجار تجريبي لأغراض الاختبار',
        category: 'DIAGNOSTIC',
        subcategory: 'Test',
        brand: 'Test Brand',
        model: 'Test Model',
        condition: 'NEW',
        availabilityType: 'RENT',
        images: ['https://example.com/image1.jpg'],
        specifications: { test: 'spec' },
        dailyRate: 150,
        weeklyRate: 900,
        monthlyRate: 3000,
        securityDeposit: 750,
        minimumRentalPeriod: 1,
      };

      const { req } = createMocks({
        method: 'POST',
        body: productData,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Rental Test Product');
    });

    it('should validate required fields', async () => {
      const invalidProductData = {
        name: '', // Invalid: empty name
        description: 'Short', // Invalid: too short
        category: 'DIAGNOSTIC',
        brand: 'Test Brand',
        model: 'Test Model',
        condition: 'NEW',
        availabilityType: 'SALE',
        images: [], // Invalid: no images
      };

      const { req } = createMocks({
        method: 'POST',
        body: invalidProductData,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
      expect(data.details).toBeDefined();
    });

    it('should handle invalid condition', async () => {
      const productData = {
        name: 'Test Product',
        description: 'A test product for testing purposes',
        category: 'DIAGNOSTIC',
        brand: 'Test Brand',
        model: 'Test Model',
        condition: 'INVALID_CONDITION', // Invalid condition
        availabilityType: 'SALE',
        images: ['https://example.com/image1.jpg'],
        specifications: { test: 'spec' },
        basePrice: 1000,
      };

      const { req } = createMocks({
        method: 'POST',
        body: productData,
      });

      const response = await POST(req);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
    });
  });

  describe('GET /api/products/[id]', () => {
    it('should return a specific product', async () => {
      const { req } = createMocks({
        method: 'GET',
      });

      const response = await getProduct(req, { params: { id: testProductId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(testProductId);
      expect(data.data.name).toBe('Test Product');
      expect(data.data.supplier).toBeDefined();
      expect(data.data.pricing).toBeDefined();
    });

    it('should return 404 for non-existent product', async () => {
      const { req } = createMocks({
        method: 'GET',
      });

      const response = await getProduct(req, { params: { id: 'non-existent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Product not found');
    });

    it('should return 400 for invalid product ID', async () => {
      const { req } = createMocks({
        method: 'GET',
      });

      const response = await getProduct(req, { params: { id: 'undefined' } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Product ID is required');
    });
  });

  describe('PUT /api/products/[id]', () => {
    it('should update a product', async () => {
      const updateData = {
        name: 'Updated Test Product',
        description: 'Updated description for testing purposes',
        basePrice: 1500,
      };

      const { req } = createMocks({
        method: 'PUT',
        body: updateData,
      });

      const response = await PUT(req, { params: { id: testProductId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('Updated Test Product');
    });

    it('should return 404 for non-existent product', async () => {
      const { req } = createMocks({
        method: 'PUT',
        body: { name: 'Updated Product' },
      });

      const response = await PUT(req, { params: { id: 'non-existent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Product not found');
    });

    it('should validate update data', async () => {
      const invalidUpdateData = {
        name: '', // Invalid: empty name
        description: 'Short', // Invalid: too short
      };

      const { req } = createMocks({
        method: 'PUT',
        body: invalidUpdateData,
      });

      const response = await PUT(req, { params: { id: testProductId } });
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid request data');
    });
  });

  describe('DELETE /api/products/[id]', () => {
    it('should soft delete a product', async () => {
      const { req } = createMocks({
        method: 'DELETE',
      });

      const response = await DELETE(req, { params: { id: testProductId } });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Product deleted successfully');

      // Verify the product is soft deleted
      const deletedProduct = await prisma.product.findUnique({
        where: { id: testProductId },
      });
      expect(deletedProduct?.status).toBe('DISCONTINUED');
    });

    it('should return 404 for non-existent product', async () => {
      const { req } = createMocks({
        method: 'DELETE',
      });

      const response = await DELETE(req, { params: { id: 'non-existent-id' } });
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Product not found');
    });
  });
});