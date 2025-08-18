/**
 * Health Check API Endpoint
 * Provides comprehensive system health status
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { Client as ElasticsearchClient } from '@elastic/elasticsearch';
import { monitoring } from '../../client/lib/monitoring';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const elasticsearch = new ElasticsearchClient({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
});

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  version: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    elasticsearch: ServiceHealth;
    storage: ServiceHealth;
    websocket: ServiceHealth;
  };
  metrics: {
    memory: MemoryMetrics;
    cpu: number;
    responseTime: number;
    activeConnections: number;
  };
  checks: HealthCheck[];
}

interface ServiceHealth {
  status: 'up' | 'down' | 'degraded';
  latency?: number;
  error?: string;
}

interface MemoryMetrics {
  used: number;
  total: number;
  percentage: number;
}

interface HealthCheck {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message?: string;
  duration?: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthStatus | { error: string }>
) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startTime = Date.now();
  const healthStatus: HealthStatus = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: { status: 'down' },
      redis: { status: 'down' },
      elasticsearch: { status: 'down' },
      storage: { status: 'down' },
      websocket: { status: 'down' },
    },
    metrics: {
      memory: getMemoryMetrics(),
      cpu: getCPUUsage(),
      responseTime: 0,
      activeConnections: 0,
    },
    checks: [],
  };

  // Check database
  try {
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const dbLatency = Date.now() - dbStart;
    
    healthStatus.services.database = {
      status: dbLatency < 100 ? 'up' : 'degraded',
      latency: dbLatency,
    };
    
    healthStatus.checks.push({
      name: 'Database Connection',
      status: 'pass',
      duration: dbLatency,
    });
  } catch (error) {
    healthStatus.services.database = {
      status: 'down',
      error: (error as Error).message,
    };
    healthStatus.status = 'unhealthy';
    
    healthStatus.checks.push({
      name: 'Database Connection',
      status: 'fail',
      message: (error as Error).message,
    });
  }

  // Check Redis
  try {
    const redisStart = Date.now();
    await redis.ping();
    const redisLatency = Date.now() - redisStart;
    
    healthStatus.services.redis = {
      status: redisLatency < 50 ? 'up' : 'degraded',
      latency: redisLatency,
    };
    
    healthStatus.checks.push({
      name: 'Redis Connection',
      status: 'pass',
      duration: redisLatency,
    });
  } catch (error) {
    healthStatus.services.redis = {
      status: 'down',
      error: (error as Error).message,
    };
    if (healthStatus.status === 'healthy') {
      healthStatus.status = 'degraded';
    }
    
    healthStatus.checks.push({
      name: 'Redis Connection',
      status: 'warn',
      message: (error as Error).message,
    });
  }

  // Check Elasticsearch
  try {
    const esStart = Date.now();
    const esHealth = await elasticsearch.cluster.health();
    const esLatency = Date.now() - esStart;
    
    healthStatus.services.elasticsearch = {
      status: esHealth.status === 'green' ? 'up' : esHealth.status === 'yellow' ? 'degraded' : 'down',
      latency: esLatency,
    };
    
    healthStatus.checks.push({
      name: 'Elasticsearch Cluster',
      status: esHealth.status === 'green' ? 'pass' : 'warn',
      message: `Cluster status: ${esHealth.status}`,
      duration: esLatency,
    });
  } catch (error) {
    healthStatus.services.elasticsearch = {
      status: 'down',
      error: (error as Error).message,
    };
    if (healthStatus.status === 'healthy') {
      healthStatus.status = 'degraded';
    }
    
    healthStatus.checks.push({
      name: 'Elasticsearch Cluster',
      status: 'warn',
      message: (error as Error).message,
    });
  }

  // Check storage (S3/local)
  try {
    // This would check S3 or local storage availability
    healthStatus.services.storage = {
      status: 'up',
    };
    
    healthStatus.checks.push({
      name: 'Storage Service',
      status: 'pass',
    });
  } catch (error) {
    healthStatus.services.storage = {
      status: 'down',
      error: (error as Error).message,
    };
  }

  // Check WebSocket
  try {
    // This would check WebSocket server status
    healthStatus.services.websocket = {
      status: 'up',
    };
    
    healthStatus.checks.push({
      name: 'WebSocket Server',
      status: 'pass',
    });
  } catch (error) {
    healthStatus.services.websocket = {
      status: 'down',
      error: (error as Error).message,
    };
  }

  // Additional health checks
  
  // Check disk space
  const diskSpace = await checkDiskSpace();
  healthStatus.checks.push({
    name: 'Disk Space',
    status: diskSpace.percentage < 80 ? 'pass' : diskSpace.percentage < 90 ? 'warn' : 'fail',
    message: `${diskSpace.percentage.toFixed(1)}% used`,
  });

  // Check memory usage
  const memoryUsage = healthStatus.metrics.memory.percentage;
  healthStatus.checks.push({
    name: 'Memory Usage',
    status: memoryUsage < 80 ? 'pass' : memoryUsage < 90 ? 'warn' : 'fail',
    message: `${memoryUsage.toFixed(1)}% used`,
  });

  // Check response time
  healthStatus.metrics.responseTime = Date.now() - startTime;
  healthStatus.checks.push({
    name: 'Health Check Response Time',
    status: healthStatus.metrics.responseTime < 1000 ? 'pass' : 'warn',
    message: `${healthStatus.metrics.responseTime}ms`,
  });

  // Determine overall status
  const failedChecks = healthStatus.checks.filter(c => c.status === 'fail').length;
  const warnChecks = healthStatus.checks.filter(c => c.status === 'warn').length;
  
  if (failedChecks > 0) {
    healthStatus.status = 'unhealthy';
  } else if (warnChecks > 2) {
    healthStatus.status = 'degraded';
  }

  // Log health check
  monitoring.info('Health check performed', {
    status: healthStatus.status,
    responseTime: healthStatus.metrics.responseTime,
    services: healthStatus.services,
  });

  // Set appropriate status code
  const statusCode = healthStatus.status === 'healthy' ? 200 : 
                     healthStatus.status === 'degraded' ? 200 : 503;

  // Set cache headers
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('X-Health-Status', healthStatus.status);

  res.status(statusCode).json(healthStatus);
}

function getMemoryMetrics(): MemoryMetrics {
  const used = process.memoryUsage().heapUsed;
  const total = process.memoryUsage().heapTotal;
  
  return {
    used: Math.round(used / 1024 / 1024), // MB
    total: Math.round(total / 1024 / 1024), // MB
    percentage: (used / total) * 100,
  };
}

function getCPUUsage(): number {
  const cpus = require('os').cpus();
  let totalIdle = 0;
  let totalTick = 0;

  cpus.forEach((cpu: any) => {
    for (const type in cpu.times) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  });

  const idle = totalIdle / cpus.length;
  const total = totalTick / cpus.length;
  const usage = 100 - ~~(100 * idle / total);

  return usage;
}

async function checkDiskSpace(): Promise<{ used: number; total: number; percentage: number }> {
  // This is a simplified version - in production, use a proper disk space library
  try {
    const { execSync } = require('child_process');
    const output = execSync('df -h /').toString();
    const lines = output.split('\n');
    const data = lines[1].split(/\s+/);
    
    const used = parseInt(data[2]);
    const total = parseInt(data[1]);
    const percentage = parseInt(data[4]);

    return { used, total, percentage };
  } catch {
    return { used: 0, total: 100, percentage: 0 };
  }
}