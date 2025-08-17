/**
 * Swagger/OpenAPI Documentation Configuration
 * Provides interactive API documentation for the Medical Devices Marketplace
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { version } from '../package.json';

const swaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Medical Devices Marketplace API',
    version,
    description: 'Comprehensive API documentation for the Medical Devices Marketplace platform',
    termsOfService: 'https://medical-devices.com/terms',
    contact: {
      name: 'API Support',
      email: 'api@medical-devices.com',
      url: 'https://medical-devices.com/support',
    },
    license: {
      name: 'Proprietary',
      url: 'https://medical-devices.com/license',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Development server',
    },
    {
      url: 'https://staging.medical-devices.com/api',
      description: 'Staging server',
    },
    {
      url: 'https://api.medical-devices.com',
      description: 'Production server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT authentication token',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
        description: 'API key for service-to-service communication',
      },
    },
    schemas: {
      // User Schemas
      User: {
        type: 'object',
        required: ['id', 'email', 'firstName', 'lastName', 'userType'],
        properties: {
          id: {
            type: 'string',
            format: 'cuid',
            example: 'clh1234567890abcdef',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          firstName: {
            type: 'string',
            example: 'John',
          },
          lastName: {
            type: 'string',
            example: 'Doe',
          },
          phoneNumber: {
            type: 'string',
            example: '+1234567890',
          },
          userType: {
            type: 'string',
            enum: ['HEALTHCARE_PROVIDER', 'EQUIPMENT_SUPPLIER', 'MAINTENANCE_ENGINEER', 'CUSTOMER_SERVICE', 'ADMIN', 'INDIVIDUAL_CUSTOMER'],
          },
          status: {
            type: 'string',
            enum: ['PENDING_VERIFICATION', 'ACTIVE', 'SUSPENDED', 'INACTIVE'],
          },
          verificationStatus: {
            type: 'string',
            enum: ['UNVERIFIED', 'EMAIL_VERIFIED', 'DOCUMENTS_VERIFIED', 'FULLY_VERIFIED'],
          },
          profileImage: {
            type: 'string',
            format: 'uri',
            nullable: true,
          },
          preferredLanguage: {
            type: 'string',
            enum: ['en', 'ar'],
            default: 'en',
          },
          twoFactorEnabled: {
            type: 'boolean',
            default: false,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      // Product Schemas
      Product: {
        type: 'object',
        required: ['id', 'name', 'category', 'price', 'supplierId'],
        properties: {
          id: {
            type: 'string',
            format: 'cuid',
          },
          name: {
            type: 'string',
            example: 'MRI Scanner Model X',
          },
          nameAr: {
            type: 'string',
            example: 'جهاز الرنين المغناطيسي موديل X',
          },
          description: {
            type: 'string',
          },
          descriptionAr: {
            type: 'string',
          },
          category: {
            type: 'string',
            enum: ['DIAGNOSTIC', 'SURGICAL', 'MONITORING', 'THERAPEUTIC', 'LABORATORY', 'DENTAL', 'EMERGENCY', 'REHABILITATION'],
          },
          subcategory: {
            type: 'string',
          },
          brand: {
            type: 'string',
          },
          model: {
            type: 'string',
          },
          sku: {
            type: 'string',
          },
          price: {
            type: 'number',
            format: 'decimal',
            minimum: 0,
          },
          currency: {
            type: 'string',
            default: 'USD',
          },
          images: {
            type: 'array',
            items: {
              type: 'string',
              format: 'uri',
            },
          },
          specifications: {
            type: 'object',
            additionalProperties: true,
          },
          certifications: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          warrantyPeriod: {
            type: 'integer',
            description: 'Warranty period in months',
          },
          stockQuantity: {
            type: 'integer',
            minimum: 0,
          },
          isActive: {
            type: 'boolean',
            default: true,
          },
          supplierId: {
            type: 'string',
            format: 'cuid',
          },
        },
      },
      
      // Order Schemas
      Order: {
        type: 'object',
        required: ['id', 'orderNumber', 'userId', 'totalAmount', 'status'],
        properties: {
          id: {
            type: 'string',
            format: 'cuid',
          },
          orderNumber: {
            type: 'string',
            example: 'ORD-2024-001234',
          },
          userId: {
            type: 'string',
            format: 'cuid',
          },
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/OrderItem',
            },
          },
          subtotal: {
            type: 'number',
            format: 'decimal',
          },
          tax: {
            type: 'number',
            format: 'decimal',
          },
          shipping: {
            type: 'number',
            format: 'decimal',
          },
          discount: {
            type: 'number',
            format: 'decimal',
          },
          totalAmount: {
            type: 'number',
            format: 'decimal',
          },
          currency: {
            type: 'string',
            default: 'USD',
          },
          status: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
          },
          paymentStatus: {
            type: 'string',
            enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
          },
          paymentMethod: {
            type: 'string',
            enum: ['CREDIT_CARD', 'PAYPAL', 'MYFATOORAH', 'BANK_TRANSFER', 'CASH_ON_DELIVERY'],
          },
          shippingAddress: {
            type: 'object',
            properties: {
              street: { type: 'string' },
              city: { type: 'string' },
              state: { type: 'string' },
              country: { type: 'string' },
              postalCode: { type: 'string' },
            },
          },
          notes: {
            type: 'string',
            nullable: true,
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      OrderItem: {
        type: 'object',
        required: ['productId', 'quantity', 'price'],
        properties: {
          productId: {
            type: 'string',
            format: 'cuid',
          },
          productName: {
            type: 'string',
          },
          quantity: {
            type: 'integer',
            minimum: 1,
          },
          price: {
            type: 'number',
            format: 'decimal',
          },
          total: {
            type: 'number',
            format: 'decimal',
          },
        },
      },
      
      // Common Schemas
      Error: {
        type: 'object',
        required: ['error', 'message'],
        properties: {
          error: {
            type: 'string',
            example: 'VALIDATION_ERROR',
          },
          message: {
            type: 'string',
            example: 'Invalid input data',
          },
          details: {
            type: 'object',
            additionalProperties: true,
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
      
      Pagination: {
        type: 'object',
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            default: 1,
          },
          limit: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 20,
          },
          total: {
            type: 'integer',
          },
          totalPages: {
            type: 'integer',
          },
        },
      },
      
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          message: {
            type: 'string',
            example: 'Operation completed successfully',
          },
          data: {
            type: 'object',
            additionalProperties: true,
          },
        },
      },
    },
    
    parameters: {
      idParam: {
        name: 'id',
        in: 'path',
        required: true,
        description: 'Resource ID',
        schema: {
          type: 'string',
          format: 'cuid',
        },
      },
      pageParam: {
        name: 'page',
        in: 'query',
        description: 'Page number',
        schema: {
          type: 'integer',
          minimum: 1,
          default: 1,
        },
      },
      limitParam: {
        name: 'limit',
        in: 'query',
        description: 'Items per page',
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
          default: 20,
        },
      },
      sortParam: {
        name: 'sort',
        in: 'query',
        description: 'Sort field and order (e.g., "createdAt:desc")',
        schema: {
          type: 'string',
        },
      },
      searchParam: {
        name: 'search',
        in: 'query',
        description: 'Search query',
        schema: {
          type: 'string',
        },
      },
    },
    
    responses: {
      UnauthorizedError: {
        description: 'Authentication required',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'UNAUTHORIZED',
              message: 'Authentication required',
            },
          },
        },
      },
      ForbiddenError: {
        description: 'Insufficient permissions',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'FORBIDDEN',
              message: 'Insufficient permissions',
            },
          },
        },
      },
      NotFoundError: {
        description: 'Resource not found',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'NOT_FOUND',
              message: 'Resource not found',
            },
          },
        },
      },
      ValidationError: {
        description: 'Validation error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'VALIDATION_ERROR',
              message: 'Invalid input data',
              details: {
                field: 'email',
                message: 'Invalid email format',
              },
            },
          },
        },
      },
      ServerError: {
        description: 'Internal server error',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Error',
            },
            example: {
              error: 'INTERNAL_SERVER_ERROR',
              message: 'An unexpected error occurred',
            },
          },
        },
      },
    },
  },
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Users',
      description: 'User management endpoints',
    },
    {
      name: 'Products',
      description: 'Product catalog management',
    },
    {
      name: 'Orders',
      description: 'Order processing and management',
    },
    {
      name: 'Rentals',
      description: 'Equipment rental management',
    },
    {
      name: 'Maintenance',
      description: 'Maintenance request management',
    },
    {
      name: 'Chat',
      description: 'Real-time messaging endpoints',
    },
    {
      name: 'Analytics',
      description: 'Analytics and reporting endpoints',
    },
    {
      name: 'Admin',
      description: 'Administrative endpoints',
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: [
    './pages/api/**/*.ts',
    './server/routes/**/*.ts',
    './server/controllers/**/*.ts',
  ],
};

export const swaggerSpec = swaggerJsdoc(options);

// API Documentation Routes
export const apiDocs = {
  '/api/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register a new user',
      description: 'Create a new user account with email verification',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password', 'firstName', 'lastName', 'userType'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                },
                password: {
                  type: 'string',
                  minLength: 8,
                },
                firstName: {
                  type: 'string',
                },
                lastName: {
                  type: 'string',
                },
                phoneNumber: {
                  type: 'string',
                },
                userType: {
                  type: 'string',
                  enum: ['HEALTHCARE_PROVIDER', 'EQUIPMENT_SUPPLIER', 'INDIVIDUAL_CUSTOMER'],
                },
                organizationName: {
                  type: 'string',
                },
                licenseNumber: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'User created successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user: {
                    $ref: '#/components/schemas/User',
                  },
                  token: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        400: {
          $ref: '#/components/responses/ValidationError',
        },
        409: {
          description: 'Email already exists',
        },
      },
    },
  },
  
  '/api/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'User login',
      description: 'Authenticate user and receive JWT token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                },
                password: {
                  type: 'string',
                },
                rememberMe: {
                  type: 'boolean',
                  default: false,
                },
              },
            },
          },
        },
      },
      responses: {
        200: {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  user: {
                    $ref: '#/components/schemas/User',
                  },
                  token: {
                    type: 'string',
                  },
                  refreshToken: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        401: {
          description: 'Invalid credentials',
        },
      },
    },
  },
  
  '/api/products': {
    get: {
      tags: ['Products'],
      summary: 'List products',
      description: 'Get paginated list of products with filters',
      parameters: [
        { $ref: '#/components/parameters/pageParam' },
        { $ref: '#/components/parameters/limitParam' },
        { $ref: '#/components/parameters/sortParam' },
        { $ref: '#/components/parameters/searchParam' },
        {
          name: 'category',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['DIAGNOSTIC', 'SURGICAL', 'MONITORING', 'THERAPEUTIC', 'LABORATORY', 'DENTAL', 'EMERGENCY', 'REHABILITATION'],
          },
        },
        {
          name: 'minPrice',
          in: 'query',
          schema: {
            type: 'number',
          },
        },
        {
          name: 'maxPrice',
          in: 'query',
          schema: {
            type: 'number',
          },
        },
      ],
      responses: {
        200: {
          description: 'Products retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Product',
                    },
                  },
                  pagination: {
                    $ref: '#/components/schemas/Pagination',
                  },
                },
              },
            },
          },
        },
      },
    },
    post: {
      tags: ['Products'],
      summary: 'Create product',
      description: 'Create a new product (Supplier only)',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/Product',
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Product created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Product',
              },
            },
          },
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError',
        },
        403: {
          $ref: '#/components/responses/ForbiddenError',
        },
      },
    },
  },
  
  '/api/orders': {
    get: {
      tags: ['Orders'],
      summary: 'List user orders',
      description: 'Get paginated list of orders for authenticated user',
      security: [{ bearerAuth: [] }],
      parameters: [
        { $ref: '#/components/parameters/pageParam' },
        { $ref: '#/components/parameters/limitParam' },
        {
          name: 'status',
          in: 'query',
          schema: {
            type: 'string',
            enum: ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'],
          },
        },
      ],
      responses: {
        200: {
          description: 'Orders retrieved successfully',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  data: {
                    type: 'array',
                    items: {
                      $ref: '#/components/schemas/Order',
                    },
                  },
                  pagination: {
                    $ref: '#/components/schemas/Pagination',
                  },
                },
              },
            },
          },
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError',
        },
      },
    },
    post: {
      tags: ['Orders'],
      summary: 'Create order',
      description: 'Create a new order from cart',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['items', 'shippingAddress', 'paymentMethod'],
              properties: {
                items: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      productId: { type: 'string' },
                      quantity: { type: 'integer' },
                    },
                  },
                },
                shippingAddress: {
                  type: 'object',
                  properties: {
                    street: { type: 'string' },
                    city: { type: 'string' },
                    state: { type: 'string' },
                    country: { type: 'string' },
                    postalCode: { type: 'string' },
                  },
                },
                paymentMethod: {
                  type: 'string',
                  enum: ['CREDIT_CARD', 'PAYPAL', 'MYFATOORAH', 'BANK_TRANSFER'],
                },
                notes: {
                  type: 'string',
                },
              },
            },
          },
        },
      },
      responses: {
        201: {
          description: 'Order created successfully',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Order',
              },
            },
          },
        },
        401: {
          $ref: '#/components/responses/UnauthorizedError',
        },
        400: {
          $ref: '#/components/responses/ValidationError',
        },
      },
    },
  },
};

export default swaggerSpec;