/**
 * Cleanup Cron Job
 * Runs daily to clean up old data, logs, and temporary files
 */

import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import Redis from 'ioredis';
import { monitoring } from '../../../client/lib/monitoring';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

interface CleanupResult {
  deletedSessions: number;
  deletedLogs: number;
  deletedTempFiles: number;
  deletedNotifications: number;
  deletedCacheKeys: number;
  freedSpace: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify cron secret
  const cronSecret = req.headers['x-cron-secret'];
  if (cronSecret !== process.env.CRON_SECRET && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Only allow Vercel Cron or manual trigger in development
  if (process.env.NODE_ENV === 'production' && !req.headers['x-vercel-cron']) {
    return res.status(401).json({ error: 'Only Vercel Cron can trigger this endpoint' });
  }

  try {
    monitoring.info('Starting cleanup job');

    const result: CleanupResult = {
      deletedSessions: 0,
      deletedLogs: 0,
      deletedTempFiles: 0,
      deletedNotifications: 0,
      deletedCacheKeys: 0,
      freedSpace: 0,
    };

    // 1. Clean up old sessions (older than 30 days)
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const deletedSessions = await prisma.session.deleteMany({
        where: {
          expires: {
            lt: thirtyDaysAgo,
          },
        },
      });
      result.deletedSessions = deletedSessions.count;
    } catch (error) {
      monitoring.error('Failed to clean sessions', error as Error);
    }

    // 2. Clean up old logs (older than 7 days)
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deletedLogs = await prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: sevenDaysAgo,
          },
        },
      });
      result.deletedLogs = deletedLogs.count;
    } catch (error) {
      monitoring.error('Failed to clean logs', error as Error);
    }

    // 3. Clean up old notifications (read and older than 60 days)
    try {
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

      const deletedNotifications = await prisma.notification.deleteMany({
        where: {
          isRead: true,
          createdAt: {
            lt: sixtyDaysAgo,
          },
        },
      });
      result.deletedNotifications = deletedNotifications.count;
    } catch (error) {
      monitoring.error('Failed to clean notifications', error as Error);
    }

    // 4. Clean up temporary files
    try {
      const tempDir = path.join(process.cwd(), 'tmp');
      const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'temp');
      
      result.deletedTempFiles += await cleanDirectory(tempDir, 24); // 24 hours old
      result.deletedTempFiles += await cleanDirectory(uploadsDir, 48); // 48 hours old
    } catch (error) {
      monitoring.error('Failed to clean temp files', error as Error);
    }

    // 5. Clean up Redis cache
    try {
      // Clean expired keys
      const keys = await redis.keys('*');
      let expiredCount = 0;

      for (const key of keys) {
        const ttl = await redis.ttl(key);
        if (ttl === -2) {
          // Key doesn't exist (already expired)
          expiredCount++;
        } else if (ttl === -1) {
          // Key exists but has no TTL - check if it's old cache
          if (key.startsWith('cache:') || key.startsWith('session:')) {
            await redis.del(key);
            expiredCount++;
          }
        }
      }

      result.deletedCacheKeys = expiredCount;

      // Clean up old rate limit keys
      const rateLimitKeys = await redis.keys('rate_limit:*');
      for (const key of rateLimitKeys) {
        const ttl = await redis.ttl(key);
        if (ttl < 0) {
          await redis.del(key);
          result.deletedCacheKeys++;
        }
      }
    } catch (error) {
      monitoring.error('Failed to clean Redis cache', error as Error);
    }

    // 6. Clean up abandoned carts (older than 7 days)
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      await prisma.cart.deleteMany({
        where: {
          updatedAt: {
            lt: sevenDaysAgo,
          },
        },
      });
    } catch (error) {
      monitoring.error('Failed to clean abandoned carts', error as Error);
    }

    // 7. Archive old orders (completed and older than 1 year)
    try {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      // In production, you would move these to an archive table
      const oldOrders = await prisma.order.findMany({
        where: {
          status: 'DELIVERED',
          createdAt: {
            lt: oneYearAgo,
          },
        },
        take: 100, // Process in batches
      });

      // Archive logic would go here
      monitoring.info(`Found ${oldOrders.length} orders to archive`);
    } catch (error) {
      monitoring.error('Failed to archive old orders', error as Error);
    }

    // 8. Optimize database
    try {
      // Run VACUUM on PostgreSQL
      await prisma.$executeRawUnsafe('VACUUM ANALYZE');
    } catch (error) {
      monitoring.error('Failed to optimize database', error as Error);
    }

    // Calculate freed space (approximate)
    result.freedSpace = 
      (result.deletedSessions * 1) + // KB per session
      (result.deletedLogs * 0.5) + // KB per log
      (result.deletedNotifications * 0.2) + // KB per notification
      (result.deletedTempFiles * 100) + // KB per temp file (average)
      (result.deletedCacheKeys * 1); // KB per cache key

    monitoring.info('Cleanup job completed', result);

    res.status(200).json({
      success: true,
      message: 'Cleanup completed successfully',
      result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    monitoring.error('Cleanup job failed', error as Error);

    res.status(500).json({
      success: false,
      error: 'Cleanup failed',
      message: (error as Error).message,
    });
  } finally {
    await prisma.$disconnect();
    await redis.quit();
  }
}

async function cleanDirectory(dirPath: string, maxAgeHours: number): Promise<number> {
  let deletedCount = 0;
  
  try {
    const files = await fs.readdir(dirPath);
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = await fs.stat(filePath);

      if (now - stats.mtimeMs > maxAge) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
  } catch (error) {
    // Directory might not exist
    monitoring.debug(`Failed to clean directory ${dirPath}`, error as Error);
  }

  return deletedCount;
}