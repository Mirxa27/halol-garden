import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cors from 'cors';

// Enhanced CORS configuration
export const corsOptions = {
  origin: function (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) {
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:8080',
      // Add production domains here
      process.env.FRONTEND_URL,
    ].filter(Boolean);

    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'X-CSRF-Token',
    'X-API-Key',
  ],
  maxAge: 86400, // 24 hours
};

// Rate limiting configurations
export const createRateLimit = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      error: message,
      retryAfter: Math.ceil(windowMs / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req: Request, res: Response) => {
      res.status(429).json({
        error: message,
        retryAfter: Math.ceil(windowMs / 1000),
      });
    },
    skip: (req: Request) => {
      // Skip rate limiting for health checks
      return req.path === '/health' || req.path === '/api/health';
    },
  });
};

// Different rate limits for different endpoints
export const rateLimiters = {
  // General API rate limit
  general: createRateLimit(15 * 60 * 1000, 100, 'Too many requests, please try again later'),
  
  // Strict rate limit for authentication endpoints
  auth: createRateLimit(15 * 60 * 1000, 10, 'Too many authentication attempts, please try again later'),
  
  // Very strict rate limit for password reset
  passwordReset: createRateLimit(60 * 60 * 1000, 3, 'Too many password reset attempts, please try again in an hour'),
  
  // Moderate rate limit for search
  search: createRateLimit(1 * 60 * 1000, 30, 'Too many search requests, please slow down'),
  
  // Strict rate limit for file uploads
  upload: createRateLimit(60 * 60 * 1000, 20, 'Too many file uploads, please try again later'),
};

// Enhanced helmet configuration
export const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: [
        "'self'",
        "'unsafe-inline'", // Required for styled-components
        "https://fonts.googleapis.com",
      ],
      scriptSrc: [
        "'self'",
        "'unsafe-inline'", // Only in development
        process.env.NODE_ENV === 'development' ? "'unsafe-eval'" : '',
      ].filter(Boolean),
      fontSrc: [
        "'self'",
        "https://fonts.gstatic.com",
        "data:",
      ],
      imgSrc: [
        "'self'",
        "data:",
        "https:",
        "blob:",
      ],
      connectSrc: [
        "'self'",
        "https:",
        "wss:",
      ],
      mediaSrc: ["'self'", "https:"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
    },
  },
  crossOriginEmbedderPolicy: false, // Disabled for compatibility
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true,
  },
  noSniff: true,
  frameguard: { action: 'deny' },
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// Request validation middleware
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  // Check for common attack patterns
  const suspiciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /vbscript:/gi,
    /data:text\/html/gi,
  ];

  const checkString = (str: string): boolean => {
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };

  const checkObject = (obj: any): boolean => {
    if (typeof obj === 'string') {
      return checkString(obj);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      for (const key in obj) {
        if (checkObject(obj[key])) {
          return true;
        }
      }
    }
    
    return false;
  };

  // Check request body for suspicious content
  if (req.body && checkObject(req.body)) {
    return res.status(400).json({
      error: 'Invalid request content detected',
    });
  }

  // Check query parameters
  if (req.query && checkObject(req.query)) {
    return res.status(400).json({
      error: 'Invalid query parameters detected',
    });
  }

  // Check headers for injection attempts
  const userAgent = req.get('User-Agent');
  if (userAgent && checkString(userAgent)) {
    return res.status(400).json({
      error: 'Invalid user agent detected',
    });
  }

  next();
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString(),
    };

    // Log errors and slow requests
    if (res.statusCode >= 400 || duration > 1000) {
      console.error('Request issue:', logData);
    } else {
      console.log('Request completed:', logData);
    }
  });

  next();
};

// Error handling middleware
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Server error:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    timestamp: new Date().toISOString(),
  });

  // Don't leak error details in production
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  res.status(500).json({
    error: 'Internal server error',
    message: isDevelopment ? err.message : 'Something went wrong',
    ...(isDevelopment && { stack: err.stack }),
  });
};

// Health check middleware
export const healthCheck = (req: Request, res: Response) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version || '1.0.0',
  };

  res.status(200).json(health);
};

// Security headers middleware
export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove server information
  res.removeHeader('X-Powered-By');
  
  // Add custom security headers
  res.setHeader('X-API-Version', '1.0');
  res.setHeader('X-Response-Time', Date.now());
  
  // Prevent caching of sensitive endpoints
  if (req.path.includes('/api/auth') || req.path.includes('/api/user')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.setHeader('Surrogate-Control', 'no-store');
  }

  next();
};

// Compression configuration
export const compressionConfig = compression({
  level: 6,
  threshold: 1024, // Only compress responses > 1KB
  filter: (req: Request, res: Response) => {
    // Don't compress images or videos
    const contentType = res.getHeader('content-type') as string;
    if (contentType && (contentType.includes('image/') || contentType.includes('video/'))) {
      return false;
    }
    
    return compression.filter(req, res);
  },
});

// CSRF token generation
export const generateCSRFToken = (req: Request, res: Response) => {
  const token = require('crypto').randomBytes(32).toString('hex');
  
  // Store token in session or memory store
  // For this example, we'll just return it
  res.json({ token });
};

// Apply all security middleware
export const applySecurityMiddleware = (app: any) => {
  // Basic security
  app.use(helmetConfig);
  app.use(cors(corsOptions));
  app.use(compressionConfig);
  
  // Request processing
  app.use(requestLogger);
  app.use(securityHeaders);
  app.use(validateRequest);
  
  // Rate limiting
  app.use('/api/', rateLimiters.general);
  app.use('/api/auth/', rateLimiters.auth);
  app.use('/api/auth/reset-password', rateLimiters.passwordReset);
  app.use('/api/search/', rateLimiters.search);
  app.use('/api/upload/', rateLimiters.upload);
  
  // Health check
  app.get('/health', healthCheck);
  app.get('/api/health', healthCheck);
  
  // CSRF token endpoint
  app.get('/api/csrf-token', generateCSRFToken);
  
  // Error handling (should be last)
  app.use(errorHandler);
};

export default {
  corsOptions,
  rateLimiters,
  helmetConfig,
  validateRequest,
  requestLogger,
  errorHandler,
  healthCheck,
  securityHeaders,
  compressionConfig,
  applySecurityMiddleware,
};