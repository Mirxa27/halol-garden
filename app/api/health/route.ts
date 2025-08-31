import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    // Test database connectivity
    const dbCheck = await prisma.$queryRaw`SELECT 1 as health`;
    
    // Test Prisma Client
    const userCount = await prisma.user.count();
    
    // Test environment variables
    const requiredEnvVars = {
      DATABASE_URL: !!process.env['DATABASE_URL'],
      JWT_SECRET: !!process.env['JWT_SECRET'],
      NEXTAUTH_SECRET: !!process.env['NEXTAUTH_SECRET'],
      NODE_ENV: process.env['NODE_ENV'],
    };

    const response = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env['NODE_ENV'],
      database: {
        connected: !!dbCheck,
        userCount,
      },
      environment_variables: requiredEnvVars,
      version: process.env['VERCEL_GIT_COMMIT_SHA'] || 'unknown',
    };

    return NextResponse.json(response, { 
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });

  } catch (error) {
    console.error('Health check failed:', error);
    
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      environment: process.env['NODE_ENV'],
    }, { 
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      }
    });
  }
}