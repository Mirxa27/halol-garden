import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '../../../server/config/database';

// Search validation schema
const searchQuerySchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  type: z.enum(['products', 'suppliers', 'users', 'orders', 'all']).optional().default('all'),
  category: z.string().optional(),
  priceMin: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  priceMax: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  condition: z.enum(['NEW', 'REFURBISHED', 'USED']).optional(),
  location: z.string().optional(),
  sortBy: z.enum(['relevance', 'price', 'date', 'rating']).optional().default('relevance'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  page: z.string().optional().transform(val => parseInt(val || '1')),
  limit: z.string().optional().transform(val => parseInt(val || '20')),
});

const autocompleteSchema = z.object({
  q: z.string().min(1),
  limit: z.string().optional().transform(val => parseInt(val || '10')),
});

// GET /api/search - Global search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = Object.fromEntries(searchParams.entries());
    
    const validatedQuery = searchQuerySchema.parse(query);

    let results: any = {};

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit;
    const take = validatedQuery.limit;

    switch (validatedQuery.type) {
      case 'products':
        results = await searchProducts(validatedQuery, skip, take);
        break;
      case 'suppliers':
        results = await searchSuppliers(validatedQuery, skip, take);
        break;
      case 'users':
        results = await searchUsers(validatedQuery, skip, take);
        break;
      case 'orders':
        results = await searchOrders(validatedQuery, skip, take);
        break;
      case 'all':
        results = await searchAll(validatedQuery, skip, take);
        break;
    }

    return NextResponse.json({
      success: true,
      query: validatedQuery.q,
      type: validatedQuery.type,
      pagination: {
        page: validatedQuery.page,
        limit: validatedQuery.limit,
      },
      ...results,
    });

  } catch (error) {
    console.error('Search error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid search parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Search failed' },
      { status: 500 }
    );
  }
}

// POST /api/search/autocomplete - Autocomplete suggestions
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = autocompleteSchema.parse(body);

    const searchTerm = validatedData.q.toLowerCase();

    // Get suggestions from multiple sources
    const [productSuggestions, supplierSuggestions, categorySuggestions] = await Promise.all([
      // Product name suggestions
      prisma.product.findMany({
        where: {
          OR: [
            { name: { contains: searchTerm, mode: 'insensitive' } },
            { nameAr: { contains: searchTerm, mode: 'insensitive' } },
          ],
          status: 'ACTIVE',
          isPublished: true,
        },
        select: {
          id: true,
          name: true,
          nameAr: true,
          category: true,
          images: true,
        },
        take: Math.ceil(validatedData.limit * 0.6), // 60% products
      }),

      // Supplier suggestions
      prisma.equipmentSupplier.findMany({
        where: {
          companyName: { contains: searchTerm, mode: 'insensitive' },
          verified: true,
        },
        select: {
          id: true,
          companyName: true,
          productCategories: true,
        },
        take: Math.ceil(validatedData.limit * 0.3), // 30% suppliers
      }),

      // Category suggestions
      prisma.product.groupBy({
        by: ['category'],
        where: {
          OR: [
            { category: { contains: searchTerm, mode: 'insensitive' } },
            { subcategory: { contains: searchTerm, mode: 'insensitive' } },
          ],
          status: 'ACTIVE',
          isPublished: true,
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: Math.ceil(validatedData.limit * 0.1), // 10% categories
      }),
    ]);

    // Format suggestions
    const suggestions = [
      ...productSuggestions.map(product => ({
        type: 'product',
        id: product.id,
        title: product.name,
        titleAr: product.nameAr,
        category: product.category,
        image: Array.isArray(product.images) && product.images.length > 0 
          ? (product.images as string[])[0] 
          : null,
      })),
      ...supplierSuggestions.map(supplier => ({
        type: 'supplier',
        id: supplier.id,
        title: supplier.companyName,
        categories: supplier.productCategories,
      })),
      ...categorySuggestions.map(cat => ({
        type: 'category',
        title: cat.category,
        count: cat._count.id,
      })),
    ];

    return NextResponse.json({
      success: true,
      suggestions: suggestions.slice(0, validatedData.limit),
    });

  } catch (error) {
    console.error('Autocomplete error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid autocomplete parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Autocomplete failed' },
      { status: 500 }
    );
  }
}

async function searchProducts(query: any, skip: number, take: number) {
  const where: any = {
    status: 'ACTIVE',
    isPublished: true,
    OR: [
      { name: { contains: query.q, mode: 'insensitive' } },
      { nameAr: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
      { descriptionAr: { contains: query.q, mode: 'insensitive' } },
    ],
  };

  if (query.category) {
    where.category = query.category;
  }

  if (query.condition) {
    where.condition = query.condition;
  }

  if (query.priceMin || query.priceMax) {
    where.price = {};
    if (query.priceMin) where.price.gte = query.priceMin;
    if (query.priceMax) where.price.lte = query.priceMax;
  }

  // Build order by
  let orderBy: any = {};
  switch (query.sortBy) {
    case 'price':
      orderBy = { price: query.sortOrder };
      break;
    case 'date':
      orderBy = { createdAt: query.sortOrder };
      break;
    case 'rating':
      orderBy = { rating: query.sortOrder };
      break;
    default:
      // Relevance - order by name similarity
      orderBy = { name: 'asc' };
  }

  const [products, totalCount] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        supplier: {
          select: {
            id: true,
            companyName: true,
            rating: true,
          },
        },
        reviews: {
          select: {
            rating: true,
          },
        },
      },
      orderBy,
      skip,
      take,
    }),
    prisma.product.count({ where }),
  ]);

  // Format products
  const formattedProducts = products.map(product => ({
    id: product.id,
    name: product.name,
    nameAr: product.nameAr,
    description: product.description?.substring(0, 200) + '...',
    category: product.category,
    condition: product.condition,
    price: product.price,
    currency: product.currency,
    images: product.images,
    rating: product.rating,
    reviewCount: product.reviews.length,
    supplier: {
      id: product.supplier.id,
      name: product.supplier.companyName,
      rating: product.supplier.rating,
    },
  }));

  return {
    products: formattedProducts,
    totalCount,
    totalPages: Math.ceil(totalCount / take),
  };
}

async function searchSuppliers(query: any, skip: number, take: number) {
  const where: any = {
    verified: true,
    OR: [
      { companyName: { contains: query.q, mode: 'insensitive' } },
    ],
  };

  const [suppliers, totalCount] = await Promise.all([
    prisma.equipmentSupplier.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phoneNumber: true,
          },
        },
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: { rating: 'desc' },
      skip,
      take,
    }),
    prisma.equipmentSupplier.count({ where }),
  ]);

  const formattedSuppliers = suppliers.map(supplier => ({
    id: supplier.id,
    companyName: supplier.companyName,
    businessRegistrationNumber: supplier.businessRegistrationNumber,
    rating: supplier.rating,
    verified: supplier.verified,
    productCount: supplier._count.products,
    productCategories: supplier.productCategories,
    contact: {
      name: `${supplier.user.firstName} ${supplier.user.lastName}`,
      email: supplier.user.email,
      phone: supplier.user.phoneNumber,
    },
  }));

  return {
    suppliers: formattedSuppliers,
    totalCount,
    totalPages: Math.ceil(totalCount / take),
  };
}

async function searchUsers(query: any, skip: number, take: number) {
  // Only admin can search users
  const where: any = {
    OR: [
      { firstName: { contains: query.q, mode: 'insensitive' } },
      { lastName: { contains: query.q, mode: 'insensitive' } },
      { email: { contains: query.q, mode: 'insensitive' } },
    ],
  };

  const [users, totalCount] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        userType: true,
        status: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    totalCount,
    totalPages: Math.ceil(totalCount / take),
  };
}

async function searchOrders(query: any, skip: number, take: number) {
  const where: any = {
    OR: [
      { orderNumber: { contains: query.q, mode: 'insensitive' } },
      { user: {
        OR: [
          { firstName: { contains: query.q, mode: 'insensitive' } },
          { lastName: { contains: query.q, mode: 'insensitive' } },
          { email: { contains: query.q, mode: 'insensitive' } },
        ],
      }},
    ],
  };

  const [orders, totalCount] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        items: {
          select: {
            quantity: true,
            product: {
              select: {
                name: true,
                nameAr: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.order.count({ where }),
  ]);

  const formattedOrders = orders.map(order => ({
    id: order.id,
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    total: order.total,
    currency: order.currency,
    itemCount: order.items.length,
    customer: {
      name: `${order.user.firstName} ${order.user.lastName}`,
      email: order.user.email,
    },
    createdAt: order.createdAt,
  }));

  return {
    orders: formattedOrders,
    totalCount,
    totalPages: Math.ceil(totalCount / take),
  };
}

async function searchAll(query: any, skip: number, take: number) {
  // Limit each category for the "all" search
  const categoryLimit = Math.ceil(take / 3);

  const [products, suppliers, orders] = await Promise.all([
    searchProducts(query, 0, categoryLimit),
    searchSuppliers(query, 0, categoryLimit),
    searchOrders(query, 0, categoryLimit),
  ]);

  return {
    products: products.products,
    suppliers: suppliers.suppliers,
    orders: orders.orders,
    counts: {
      products: products.totalCount,
      suppliers: suppliers.totalCount,
      orders: orders.totalCount,
    },
  };
}