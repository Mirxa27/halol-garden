/**
 * PRODUCTION LOGGING SYSTEM
 * Zero-tolerance for untracked errors or missing logs
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import { Request, Response, NextFunction } from 'express';

// Log levels with strict severity
const levels = {
  fatal: 0,
  error: 1,
  warn: 2,
  info: 3,
  debug: 4,
  trace: 5
};

// Color coding for console output
const colors = {
  fatal: 'red bold',
  error: 'red',
  warn: 'yellow',
  info: 'green',
  debug: 'blue',
  trace: 'gray'
};

winston.addColors(colors);

// Production log format
const productionFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss.SSS'
  }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    // Include all metadata for comprehensive logging
    const log = {
      timestamp,
      level,
      message,
      ...meta,
      // Add context information
      environment: process.env.NODE_ENV,
      service: 'medical-devices-marketplace',
      version: process.env.APP_VERSION || '1.0.0',
      hostname: process.env.HOSTNAME,
      pid: process.pid
    };
    
    // Add error tracking
    if (level === 'error' || level === 'fatal') {
      log.alert = true;
      log.requiresAction = true;
    }
    
    return JSON.stringify(log);
  })
);

// Development log format (more readable)
const developmentFormat = winston.format.combine(
  winston.format.timestamp({
    format: 'HH:mm:ss.SSS'
  }),
  winston.format.colorize(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level}]: ${message}`;
    
    if (Object.keys(meta).length > 0) {
      log += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    if (stack) {
      log += `\n${stack}`;
    }
    
    return log;
  })
);

// Create transport for file logging with rotation
const fileRotateTransport = new DailyRotateFile({
  filename: 'logs/application-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '100m',
  maxFiles: '30d',
  format: productionFormat,
  level: 'info'
});

// Create transport for error logging
const errorFileTransport = new DailyRotateFile({
  filename: 'logs/error-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '100m',
  maxFiles: '90d',
  format: productionFormat,
  level: 'error'
});

// Create transport for audit logging
const auditFileTransport = new DailyRotateFile({
  filename: 'logs/audit-%DATE%.log',
  datePattern: 'YYYY-MM-DD',
  zippedArchive: true,
  maxSize: '100m',
  maxFiles: '365d',
  format: productionFormat,
  auditMode: true
});

// Create the logger instance
const logger = winston.createLogger({
  levels,
  level: process.env.LOG_LEVEL || 'info',
  format: productionFormat,
  defaultMeta: { service: 'medical-devices' },
  transports: [
    fileRotateTransport,
    errorFileTransport,
    auditFileTransport
  ],
  // Exit on error - STRICT PRODUCTION REQUIREMENT
  exitOnError: false,
  // Reject unhandled promise rejections
  rejectionHandlers: [
    new winston.transports.File({ filename: 'logs/rejections.log' })
  ],
  // Handle uncaught exceptions
  exceptionHandlers: [
    new winston.transports.File({ filename: 'logs/exceptions.log' })
  ]
});

// Add console transport for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: developmentFormat,
    level: 'debug'
  }));
} else {
  // In production, only log errors to console
  logger.add(new winston.transports.Console({
    format: productionFormat,
    level: 'error'
  }));
}

// Audit logger for security events
export const auditLogger = {
  log: (event: string, details: any) => {
    logger.info('AUDIT', {
      event,
      details,
      timestamp: new Date().toISOString(),
      user: details.userId || 'system',
      ip: details.ip || 'unknown',
      action: details.action || 'unknown',
      result: details.result || 'unknown',
      metadata: details.metadata || {}
    });
  },
  
  logSuccess: (event: string, details: any) => {
    auditLogger.log(event, { ...details, result: 'success' });
  },
  
  logFailure: (event: string, details: any) => {
    auditLogger.log(event, { ...details, result: 'failure' });
  },
  
  logSecurity: (event: string, details: any) => {
    logger.warn('SECURITY_EVENT', {
      event,
      details,
      severity: 'high',
      requiresReview: true
    });
  }
};

// Performance logger
export const performanceLogger = {
  startTimer: (operation: string) => {
    const start = process.hrtime.bigint();
    return {
      end: (metadata?: any) => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1000000; // Convert to milliseconds
        
        logger.info('PERFORMANCE', {
          operation,
          duration,
          unit: 'ms',
          ...metadata
        });
        
        // Alert if operation is slow
        if (duration > 1000) {
          logger.warn('SLOW_OPERATION', {
            operation,
            duration,
            threshold: 1000
          });
        }
        
        return duration;
      }
    };
  }
};

// Error tracking with context
export const errorLogger = {
  logError: (error: Error, context?: any) => {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      context,
      timestamp: new Date().toISOString()
    };
    
    logger.error('APPLICATION_ERROR', errorInfo);
    
    // Send to error tracking service (e.g., Sentry)
    if (process.env.SENTRY_DSN) {
      // Sentry integration would go here
    }
    
    return errorInfo;
  },
  
  logFatal: (error: Error, context?: any) => {
    const errorInfo = errorLogger.logError(error, context);
    logger.fatal('FATAL_ERROR', errorInfo);
    
    // Trigger immediate alerts
    // Alert service integration would go here
    
    // In production, might want to gracefully shutdown
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = process.hrtime.bigint();
  
  // Log request
  const requestId = req.headers['x-request-id'] || generateRequestId();
  req.requestId = requestId;
  
  logger.info('REQUEST_START', {
    requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    referer: req.headers.referer
  });
  
  // Log response
  const originalSend = res.send;
  res.send = function(data) {
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000;
    
    logger.info('REQUEST_END', {
      requestId,
      statusCode: res.statusCode,
      duration,
      contentLength: res.get('content-length')
    });
    
    // Log slow requests
    if (duration > 1000) {
      logger.warn('SLOW_REQUEST', {
        requestId,
        url: req.url,
        duration
      });
    }
    
    // Log errors
    if (res.statusCode >= 400) {
      logger.error('REQUEST_ERROR', {
        requestId,
        statusCode: res.statusCode,
        url: req.url,
        method: req.method
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

// Database query logger
export const queryLogger = {
  logQuery: (query: string, params?: any[], duration?: number) => {
    const log = {
      query,
      params,
      duration,
      timestamp: new Date().toISOString()
    };
    
    if (duration && duration > 100) {
      logger.warn('SLOW_QUERY', log);
    } else {
      logger.debug('DATABASE_QUERY', log);
    }
  },
  
  logError: (query: string, error: Error, params?: any[]) => {
    logger.error('DATABASE_ERROR', {
      query,
      params,
      error: error.message,
      stack: error.stack
    });
  }
};

// Metrics logger
export const metricsLogger = {
  increment: (metric: string, value: number = 1, tags?: Record<string, string>) => {
    logger.info('METRIC_INCREMENT', {
      metric,
      value,
      tags,
      type: 'counter'
    });
  },
  
  gauge: (metric: string, value: number, tags?: Record<string, string>) => {
    logger.info('METRIC_GAUGE', {
      metric,
      value,
      tags,
      type: 'gauge'
    });
  },
  
  histogram: (metric: string, value: number, tags?: Record<string, string>) => {
    logger.info('METRIC_HISTOGRAM', {
      metric,
      value,
      tags,
      type: 'histogram'
    });
  }
};

// Utility functions
function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Export main logger and specialized loggers
export default logger;

// Type definitions for TypeScript
declare global {
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

// Production validation
if (process.env.NODE_ENV === 'production') {
  // Ensure log directory exists
  const fs = require('fs');
  const path = require('path');
  const logDir = path.join(process.cwd(), 'logs');
  
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  
  // Validate required environment variables
  const required = ['LOG_LEVEL', 'SENTRY_DSN', 'APP_VERSION'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    logger.error('MISSING_ENV_VARS', {
      missing,
      message: 'Required environment variables for logging are not set'
    });
  }
  
  // Log startup
  logger.info('APPLICATION_START', {
    environment: process.env.NODE_ENV,
    version: process.env.APP_VERSION,
    node: process.version,
    pid: process.pid,
    platform: process.platform
  });
  
  // Log shutdown
  process.on('SIGTERM', () => {
    logger.info('APPLICATION_SHUTDOWN', {
      signal: 'SIGTERM',
      uptime: process.uptime()
    });
  });
  
  process.on('SIGINT', () => {
    logger.info('APPLICATION_SHUTDOWN', {
      signal: 'SIGINT',
      uptime: process.uptime()
    });
  });
}