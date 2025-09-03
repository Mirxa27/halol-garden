import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cache } from '@/lib/cache';
import { getCurrentUser, isAdmin } from '@/lib/auth';

interface HealthCheckResult {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  checks: {
    database: {
      status: 'connected' | 'error';
      latency?: number;
      error?: string;
    };
    cache: {
      status: 'connected' | 'error';
      latency?: number;
      error?: string;
    };
    authentication: {
      status: 'configured' | 'error';
      error?: string;
    };
    storage: {
      status: 'available' | 'error';
      usage?: {
        used: number;
        total: number;
        percentage: number;
      };
      error?: string;
    };
    email: {
      status: 'configured' | 'error';
      error?: string;
    };
    payment: {
      status: 'configured' | 'error';
      providers: string[];
      error?: string;
    };
  };
  version: {
    app: string;
    node: string;
    dependencies: {
      next: string;
      prisma: string;
      react: string;
    };
  };
  environment: string;
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Public health check - basic info only
    const isPublic = request.nextUrl.searchParams.get('public') === 'true';
    
    if (!isPublic) {
      // Require admin access for detailed health check
      const user = await getCurrentUser();
      if (!user || !(await isAdmin())) {
        return NextResponse.json(
          { success: false, error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    const startTime = Date.now();
    const healthCheck: HealthCheckResult = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      checks: {
        database: { status: 'error' },
        cache: { status: 'error' },
        authentication: { status: 'error' },
        storage: { status: 'error' },
        email: { status: 'error' },
        payment: { status: 'error', providers: [] },
      },
      version: {
        app: process.env.npm_package_version || '1.0.0',
        node: process.version,
        dependencies: {
          next: require('next/package.json').version,
          prisma: require('@prisma/client/package.json').version,
          react: require('react/package.json').version,
        },
      },
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      memory: {
        used: 0,
        total: 0,
        percentage: 0,
      },
    };

    // Check database connection
    try {
      const dbStart = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      healthCheck.checks.database = {
        status: 'connected',
        latency: Date.now() - dbStart,
      };
    } catch (error) {
      healthCheck.checks.database = {
        status: 'error',
        error: isPublic ? 'Connection failed' : (error as Error).message,
      };
      healthCheck.status = 'unhealthy';
    }

    // Check cache connection
    try {
      const cacheStart = Date.now();
      await cache.set('health-check', 'ok', 10);
      const result = await cache.get('health-check');
      if (result === 'ok') {
        healthCheck.checks.cache = {
          status: 'connected',
          latency: Date.now() - cacheStart,
        };
      } else {
        throw new Error('Cache read/write failed');
      }
    } catch (error) {
      healthCheck.checks.cache = {
        status: 'error',
        error: isPublic ? 'Cache unavailable' : (error as Error).message,
      };
      // Cache errors only degrade health, don't make it unhealthy
      if (healthCheck.status === 'healthy') {
        healthCheck.status = 'degraded';
      }
    }

    // Check authentication configuration
    if (process.env.NEXTAUTH_SECRET && process.env.NEXTAUTH_URL) {
      healthCheck.checks.authentication = {
        status: 'configured',
      };
    } else {
      healthCheck.checks.authentication = {
        status: 'error',
        error: 'Missing configuration',
      };
      healthCheck.status = 'unhealthy';
    }

    // Check storage (uploads directory)
    try {
      const fs = require('fs');
      const path = require('path');
      const uploadDir = path.join(process.cwd(), 'uploads');
      
      if (fs.existsSync(uploadDir)) {
        const stats = fs.statfsSync(uploadDir);
        const used = stats.blocks * stats.bsize;
        const total = stats.blocks * stats.bsize + stats.bavail * stats.bsize;
        
        healthCheck.checks.storage = {
          status: 'available',
          usage: {
            used,
            total,
            percentage: Math.round((used / total) * 100),
          },
        };
      } else {
        healthCheck.checks.storage = {
          status: 'error',
          error: 'Upload directory not found',
        };
      }
    } catch (error) {
      healthCheck.checks.storage = {
        status: 'error',
        error: isPublic ? 'Storage check failed' : (error as Error).message,
      };
    }

    // Check email configuration
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
      healthCheck.checks.email = {
        status: 'configured',
      };
    } else {
      healthCheck.checks.email = {
        status: 'error',
        error: 'Missing SMTP configuration',
      };
      if (healthCheck.status === 'healthy') {
        healthCheck.status = 'degraded';
      }
    }

    // Check payment configuration
    const paymentProviders = [];
    if (process.env.STRIPE_SECRET_KEY) paymentProviders.push('Stripe');
    if (process.env.PAYPAL_CLIENT_ID) paymentProviders.push('PayPal');
    if (process.env.MYFATOORAH_API_KEY) paymentProviders.push('MyFatoorah');
    
    if (paymentProviders.length > 0) {
      healthCheck.checks.payment = {
        status: 'configured',
        providers: paymentProviders,
      };
    } else {
      healthCheck.checks.payment = {
        status: 'error',
        providers: [],
        error: 'No payment providers configured',
      };
      if (healthCheck.status === 'healthy') {
        healthCheck.status = 'degraded';
      }
    }

    // Check memory usage
    const memUsage = process.memoryUsage();
    healthCheck.memory = {
      used: memUsage.heapUsed,
      total: memUsage.heapTotal,
      percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
    };

    // If public, remove sensitive information
    if (isPublic) {
      return NextResponse.json({
        status: healthCheck.status,
        timestamp: healthCheck.timestamp,
        environment: healthCheck.environment,
      });
    }

    // Add response time
    const responseTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      data: healthCheck,
      responseTime,
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Health check failed',
        status: 'unhealthy',
      },
      { status: 500 }
    );
  }
}

// System metrics endpoint for monitoring
export async function POST(request: NextRequest) {
  try {
    // Require admin access
    const user = await getCurrentUser();
    if (!user || !(await isAdmin())) {
      return NextResponse.json(
        { success: false, error: 'Admin access required' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { action } = body;

    switch (action) {
      case 'clear-cache':
        await cache.clear();
        return NextResponse.json({
          success: true,
          message: 'Cache cleared successfully',
        });

      case 'database-stats':
        const [userCount, productCount, orderCount] = await Promise.all([
          prisma.user.count(),
          prisma.product.count(),
          prisma.order.count(),
        ]);

        return NextResponse.json({
          success: true,
          data: {
            users: userCount,
            products: productCount,
            orders: orderCount,
          },
        });

      case 'system-info':
        const os = require('os');
        
        return NextResponse.json({
          success: true,
          data: {
            platform: os.platform(),
            arch: os.arch(),
            cpus: os.cpus().length,
            totalMemory: os.totalmem(),
            freeMemory: os.freemem(),
            loadAverage: os.loadavg(),
            uptime: os.uptime(),
            hostname: os.hostname(),
          },
        });

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('System action error:', error);
    
    return NextResponse.json(
      { success: false, error: 'System action failed' },
      { status: 500 }
    );
  }
}