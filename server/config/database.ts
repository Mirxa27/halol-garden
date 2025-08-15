import { PrismaClient } from '@prisma/client';

// Declare global type for PrismaClient instance
declare global {
  var prisma: PrismaClient | undefined;
}

// Create PrismaClient instance with proper configuration
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    errorFormat: 'pretty',
  });
};

// Use singleton pattern to prevent multiple instances in development
export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Database helper functions
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    if (!process.env.DATABASE_URL) {
      console.warn('DATABASE_URL not configured');
      return false;
    }
    await prisma.$connect();
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error disconnecting from database:', error);
  }
}

// Transaction helper
export async function withTransaction<T>(
  fn: (tx: any) => Promise<T>
): Promise<T> {
  return prisma.$transaction(fn);
}

// Pagination helpers
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 10));
  const skip = (page - 1) * limit;

  return { page, limit, skip };
}

export function createPaginatedResult<T>(
  data: T[],
  total: number,
  params: PaginationParams
): PaginatedResult<T> {
  const { page, limit } = getPaginationParams(params);
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    total,
    page,
    limit,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
}

// Soft delete helper
export async function softDelete(
  model: any,
  id: string
): Promise<void> {
  await model.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
}

// Search query builder
export function buildSearchQuery(
  searchTerm: string,
  fields: string[]
): any {
  if (!searchTerm) return {};

  return {
    OR: fields.map(field => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    })),
  };
}

// Date range query builder
export function buildDateRangeQuery(
  field: string,
  startDate?: Date,
  endDate?: Date
): any {
  if (!startDate && !endDate) return {};

  const query: any = {};
  if (startDate) query.gte = startDate;
  if (endDate) query.lte = endDate;

  return { [field]: query };
}

// Batch operations helper
export async function batchOperation<T>(
  items: T[],
  batchSize: number,
  operation: (batch: T[]) => Promise<void>
): Promise<void> {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    await operation(batch);
  }
}

// JSON field query helper
export function jsonFieldQuery(
  field: string,
  path: string,
  value: any
): any {
  return {
    [field]: {
      path: [path],
      equals: value,
    },
  };
}

// Retry mechanism for database operations
export async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delay * Math.pow(2, i)));
      }
    }
  }
  
  throw lastError;
}

export default prisma;