import { PrismaClient } from '@prisma/client';

// Extend PrismaClient with logging in development
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error']
      : ['error'],
    errorFormat: 'pretty',
  });
};

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>;
}

export const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

// Database connection health check
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('Database connection successful');
    return true;
  } catch (error) {
    console.error('Database connection failed:', error);
    return false;
  }
}

// Graceful shutdown
export async function closeDatabaseConnection(): Promise<void> {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: PrismaClient) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(async (tx) => {
    return await callback(tx as PrismaClient);
  });
}

// Pagination helper
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
  hasPrevious: boolean;
}

export function getPaginationParams(params: PaginationParams) {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(100, Math.max(1, params.limit || 20));
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
    hasPrevious: page > 1,
  };
}

// Soft delete helper
export interface SoftDeletable {
  deletedAt: Date | null;
}

export function excludeDeleted<T extends SoftDeletable>() {
  return {
    where: {
      deletedAt: null,
    },
  };
}

// Search helper
export function buildSearchQuery(searchTerm: string, fields: string[]) {
  if (!searchTerm || fields.length === 0) {
    return {};
  }
  
  const searchConditions = fields.map(field => ({
    [field]: {
      contains: searchTerm,
      mode: 'insensitive' as const,
    },
  }));
  
  return {
    OR: searchConditions,
  };
}

// Date range helper
export interface DateRangeParams {
  startDate?: Date | string;
  endDate?: Date | string;
}

export function buildDateRangeQuery(field: string, params: DateRangeParams) {
  const query: any = {};
  
  if (params.startDate) {
    query[field] = {
      ...query[field],
      gte: new Date(params.startDate),
    };
  }
  
  if (params.endDate) {
    query[field] = {
      ...query[field],
      lte: new Date(params.endDate),
    };
  }
  
  return query;
}

// Batch operation helper
export async function batchOperation<T, R>(
  items: T[],
  operation: (batch: T[]) => Promise<R>,
  batchSize: number = 100
): Promise<R[]> {
  const results: R[] = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const result = await operation(batch);
    results.push(result);
  }
  
  return results;
}

// JSON field helper
export function jsonArrayContains(field: string, value: any) {
  return {
    [field]: {
      path: '$[*]',
      array_contains: value,
    },
  };
}

// Retry helper for database operations
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

// Export all database utilities
export default {
  prisma,
  checkDatabaseConnection,
  closeDatabaseConnection,
  withTransaction,
  getPaginationParams,
  createPaginatedResult,
  excludeDeleted,
  buildSearchQuery,
  buildDateRangeQuery,
  batchOperation,
  jsonArrayContains,
  retryOperation,
};