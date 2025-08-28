import { PrismaClient } from '@prisma/client';

// PrismaClient singleton for serverless environments
// This prevents connection pool exhaustion in serverless functions

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL,
      },
    },
  });
};

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;

// Export a function to disconnect (useful for cleanup)
export async function disconnect() {
  await prisma.$disconnect();
}