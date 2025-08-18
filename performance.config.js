/**
 * PERFORMANCE MONITORING CONFIGURATION
 * Enforces strict performance standards for production
 */

module.exports = {
  // Performance budgets - STRICT LIMITS
  budgets: {
    // Bundle size limits (in bytes)
    bundles: {
      main: {
        maxSize: 250000, // 250KB
        warning: 200000  // 200KB
      },
      vendor: {
        maxSize: 500000, // 500KB
        warning: 400000  // 400KB
      },
      total: {
        maxSize: 1000000, // 1MB total
        warning: 800000   // 800KB warning
      }
    },
    
    // Asset size limits
    assets: {
      scripts: {
        maxSize: 150000, // 150KB per script
        warning: 100000  // 100KB warning
      },
      styles: {
        maxSize: 100000, // 100KB per stylesheet
        warning: 75000   // 75KB warning
      },
      images: {
        maxSize: 500000, // 500KB per image
        warning: 300000  // 300KB warning
      },
      fonts: {
        maxSize: 200000, // 200KB per font
        warning: 150000  // 150KB warning
      }
    },
    
    // Performance metrics (in milliseconds)
    metrics: {
      // Core Web Vitals
      LCP: {
        max: 2500,    // Largest Contentful Paint
        warning: 2000
      },
      FID: {
        max: 100,     // First Input Delay
        warning: 75
      },
      CLS: {
        max: 0.1,     // Cumulative Layout Shift
        warning: 0.05
      },
      FCP: {
        max: 1800,    // First Contentful Paint
        warning: 1500
      },
      TTFB: {
        max: 800,     // Time to First Byte
        warning: 600
      },
      TTI: {
        max: 5000,    // Time to Interactive
        warning: 3500
      },
      TBT: {
        max: 300,     // Total Blocking Time
        warning: 200
      }
    },
    
    // API response times
    api: {
      GET: {
        max: 200,     // 200ms for GET requests
        warning: 150
      },
      POST: {
        max: 500,     // 500ms for POST requests
        warning: 300
      },
      PUT: {
        max: 500,     // 500ms for PUT requests
        warning: 300
      },
      DELETE: {
        max: 300,     // 300ms for DELETE requests
        warning: 200
      }
    },
    
    // Database query times
    database: {
      simple: {
        max: 50,      // 50ms for simple queries
        warning: 30
      },
      complex: {
        max: 200,     // 200ms for complex queries
        warning: 150
      },
      aggregate: {
        max: 500,     // 500ms for aggregations
        warning: 300
      }
    }
  },
  
  // Lighthouse configuration
  lighthouse: {
    // Minimum scores required (0-100)
    scores: {
      performance: 90,
      accessibility: 95,
      bestPractices: 95,
      seo: 90,
      pwa: 80
    },
    
    // Lighthouse settings
    settings: {
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
      formFactor: 'desktop',
      throttling: {
        rttMs: 40,
        throughputKbps: 10240,
        cpuSlowdownMultiplier: 1,
        requestLatencyMs: 0,
        downloadThroughputKbps: 0,
        uploadThroughputKbps: 0
      },
      screenEmulation: {
        mobile: false,
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
        disabled: false
      },
      emulatedUserAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  },
  
  // Monitoring configuration
  monitoring: {
    // Real User Monitoring (RUM)
    rum: {
      enabled: true,
      sampleRate: 1.0, // 100% sampling in production
      trackWebVitals: true,
      trackErrors: true,
      trackResources: true,
      trackLongTasks: true
    },
    
    // Application Performance Monitoring (APM)
    apm: {
      enabled: true,
      serviceName: 'medical-devices-marketplace',
      serverUrl: process.env.APM_SERVER_URL,
      secretToken: process.env.APM_SECRET_TOKEN,
      environment: process.env.NODE_ENV,
      transactionSampleRate: 1.0,
      captureBody: 'all',
      captureHeaders: true,
      captureErrorLogStackTraces: 'always',
      logLevel: 'error'
    },
    
    // Custom metrics
    customMetrics: {
      // Track business metrics
      businessMetrics: [
        'user.registration.time',
        'product.search.time',
        'checkout.completion.time',
        'api.availability',
        'database.connection.pool.usage'
      ],
      
      // Track technical metrics
      technicalMetrics: [
        'memory.usage',
        'cpu.usage',
        'disk.io',
        'network.latency',
        'cache.hit.rate',
        'error.rate'
      ]
    }
  },
  
  // Performance testing
  testing: {
    // Load testing configuration
    loadTesting: {
      scenarios: {
        baseline: {
          duration: '5m',
          vus: 10,
          thresholds: {
            http_req_duration: ['p(95)<200'],
            http_req_failed: ['rate<0.01']
          }
        },
        stress: {
          duration: '10m',
          vus: 100,
          thresholds: {
            http_req_duration: ['p(95)<500'],
            http_req_failed: ['rate<0.05']
          }
        },
        spike: {
          duration: '2m',
          vus: 1000,
          thresholds: {
            http_req_duration: ['p(95)<1000'],
            http_req_failed: ['rate<0.1']
          }
        }
      }
    },
    
    // Synthetic monitoring
    synthetic: {
      enabled: true,
      frequency: '5m',
      locations: ['us-east-1', 'eu-west-1', 'ap-southeast-1'],
      tests: [
        {
          name: 'Homepage Load',
          url: '/',
          assertions: {
            statusCode: 200,
            responseTime: 1000,
            contentType: 'text/html'
          }
        },
        {
          name: 'API Health',
          url: '/api/health',
          assertions: {
            statusCode: 200,
            responseTime: 100,
            body: { status: 'healthy' }
          }
        }
      ]
    }
  },
  
  // Optimization settings
  optimization: {
    // Image optimization
    images: {
      formats: ['webp', 'avif'],
      sizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      quality: 85,
      lazy: true,
      placeholder: 'blur'
    },
    
    // Code splitting
    splitting: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 244000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      automaticNameDelimiter: '~',
      cacheGroups: {
        vendor: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendor',
          priority: 10
        },
        common: {
          minChunks: 2,
          priority: 5,
          reuseExistingChunk: true
        }
      }
    },
    
    // Caching strategy
    caching: {
      html: {
        maxAge: 0,
        sMaxAge: 3600,
        staleWhileRevalidate: 86400
      },
      static: {
        maxAge: 31536000, // 1 year
        immutable: true
      },
      api: {
        maxAge: 0,
        sMaxAge: 60,
        staleWhileRevalidate: 300
      }
    },
    
    // Compression
    compression: {
      enabled: true,
      threshold: 1024,
      algorithms: ['gzip', 'brotli']
    },
    
    // Minification
    minification: {
      html: true,
      css: true,
      js: true,
      removeComments: true,
      removeEmptyAttributes: true,
      removeRedundantAttributes: true,
      collapseWhitespace: true
    }
  },
  
  // Alerting thresholds
  alerts: {
    // Page load alerts
    pageLoad: {
      critical: 5000,  // 5 seconds
      warning: 3000    // 3 seconds
    },
    
    // API response alerts
    apiResponse: {
      critical: 1000,  // 1 second
      warning: 500     // 500ms
    },
    
    // Error rate alerts
    errorRate: {
      critical: 0.05,  // 5% error rate
      warning: 0.01    // 1% error rate
    },
    
    // Availability alerts
    availability: {
      critical: 0.99,  // 99% uptime
      warning: 0.995   // 99.5% uptime
    }
  },
  
  // Reporting
  reporting: {
    // Generate performance reports
    schedule: 'daily',
    recipients: ['team@example.com'],
    format: 'html',
    includeMetrics: [
      'webVitals',
      'bundleSize',
      'apiPerformance',
      'errorRate',
      'availability'
    ]
  }
};

// Export performance monitoring functions
module.exports.measurePerformance = async (fn, name) => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    
    // Log performance metric
    console.log(`Performance: ${name} took ${duration}ms`);
    
    // Check against budgets
    if (module.exports.budgets.metrics[name]) {
      const budget = module.exports.budgets.metrics[name];
      if (duration > budget.max) {
        throw new Error(`Performance budget exceeded: ${name} took ${duration}ms (max: ${budget.max}ms)`);
      } else if (duration > budget.warning) {
        console.warn(`Performance warning: ${name} took ${duration}ms (warning: ${budget.warning}ms)`);
      }
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`Performance error: ${name} failed after ${duration}ms`, error);
    throw error;
  }
};

// Bundle size checker
module.exports.checkBundleSize = (stats) => {
  const budgets = module.exports.budgets.bundles;
  const violations = [];
  
  Object.entries(stats.assets).forEach(([name, size]) => {
    const budget = budgets[name] || budgets.total;
    if (size > budget.maxSize) {
      violations.push({
        asset: name,
        size,
        limit: budget.maxSize,
        severity: 'error'
      });
    } else if (size > budget.warning) {
      violations.push({
        asset: name,
        size,
        limit: budget.warning,
        severity: 'warning'
      });
    }
  });
  
  return violations;
};