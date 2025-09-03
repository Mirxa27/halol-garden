/**
 * Performance Monitoring and Optimization Service
 */

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

interface PerformanceReport {
  metrics: PerformanceMetric[];
  warnings: string[];
  suggestions: string[];
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private observers: PerformanceObserver[] = [];
  private resourceTimings: Map<string, number> = new Map();

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
      this.monitorVitals();
    }
  }

  /**
   * Initialize performance observers
   */
  private initializeObservers() {
    // Observe Long Tasks
    if ('PerformanceObserver' in window) {
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordMetric('long-task', entry.duration, 'ms');
            if (entry.duration > 100) {
              console.warn(`Long task detected: ${entry.duration}ms`);
            }
          }
        });
        longTaskObserver.observe({ entryTypes: ['longtask'] });
        this.observers.push(longTaskObserver);
      } catch (e) {
        // Long task observer not supported
      }

      // Observe Resource Timings
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'resource') {
            const resource = entry as PerformanceResourceTiming;
            this.resourceTimings.set(resource.name, resource.duration);
            
            // Warn about slow resources
            if (resource.duration > 1000) {
              console.warn(`Slow resource: ${resource.name} took ${resource.duration}ms`);
            }
          }
        }
      });
      
      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        // Resource timing not supported
      }

      // Observe Layout Shifts
      try {
        const layoutShiftObserver = new PerformanceObserver((list) => {
          let cls = 0;
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              cls += (entry as any).value;
            }
          }
          this.recordMetric('cumulative-layout-shift', cls, 'score');
        });
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
        this.observers.push(layoutShiftObserver);
      } catch (e) {
        // Layout shift observer not supported
      }
    }
  }

  /**
   * Monitor Core Web Vitals
   */
  private monitorVitals() {
    // First Contentful Paint (FCP)
    this.observePaint('first-contentful-paint', 'FCP');
    
    // Largest Contentful Paint (LCP)
    this.observePaint('largest-contentful-paint', 'LCP');

    // Time to Interactive (TTI)
    if ('PerformanceObserver' in window) {
      this.measureTTI();
    }

    // First Input Delay (FID)
    this.measureFID();
  }

  /**
   * Observe paint metrics
   */
  private observePaint(entryName: string, metricName: string) {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.name === entryName) {
              this.recordMetric(metricName, entry.startTime, 'ms');
            }
          }
        });
        observer.observe({ entryTypes: ['paint'] });
        this.observers.push(observer);
      } catch (e) {
        // Paint observer not supported
      }
    }
  }

  /**
   * Measure Time to Interactive
   */
  private measureTTI() {
    if ('PerformanceLongTaskTiming' in window) {
      let tti = 0;
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        // Simple TTI: 5 seconds after last long task
        if (entries.length > 0) {
          const lastLongTask = entries[entries.length - 1];
          tti = lastLongTask.startTime + lastLongTask.duration + 5000;
          this.recordMetric('TTI', tti, 'ms');
        }
      });
      
      try {
        observer.observe({ entryTypes: ['longtask'] });
        this.observers.push(observer);
      } catch (e) {
        // Long task timing not supported
      }
    }
  }

  /**
   * Measure First Input Delay
   */
  private measureFID() {
    let fidMeasured = false;
    
    const measureFirstInput = (event: Event) => {
      if (fidMeasured) return;
      
      const delay = Date.now() - event.timeStamp;
      this.recordMetric('FID', delay, 'ms');
      fidMeasured = true;
      
      // Remove listeners after measuring
      ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(type => {
        window.removeEventListener(type, measureFirstInput);
      });
    };

    // Add listeners for first input
    ['mousedown', 'keydown', 'touchstart', 'pointerdown'].forEach(type => {
      window.addEventListener(type, measureFirstInput, { once: true });
    });
  }

  /**
   * Record a performance metric
   */
  recordMetric(name: string, value: number, unit: string = 'ms') {
    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: Date.now(),
    };

    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name)!.push(metric);
    
    // Keep only last 100 entries per metric
    const metrics = this.metrics.get(name)!;
    if (metrics.length > 100) {
      metrics.shift();
    }
  }

  /**
   * Get performance report
   */
  getReport(): PerformanceReport {
    const warnings: string[] = [];
    const suggestions: string[] = [];
    const metricsArray: PerformanceMetric[] = [];

    // Analyze metrics
    for (const [name, metrics] of this.metrics.entries()) {
      if (metrics.length === 0) continue;
      
      const latest = metrics[metrics.length - 1];
      metricsArray.push(latest);
      
      // Add warnings based on thresholds
      switch (name) {
        case 'FCP':
          if (latest.value > 1800) {
            warnings.push('First Contentful Paint is slow (>1.8s)');
            suggestions.push('Optimize server response time and reduce render-blocking resources');
          }
          break;
          
        case 'LCP':
          if (latest.value > 2500) {
            warnings.push('Largest Contentful Paint is slow (>2.5s)');
            suggestions.push('Optimize images, preload critical resources, and improve server response time');
          }
          break;
          
        case 'FID':
          if (latest.value > 100) {
            warnings.push('First Input Delay is high (>100ms)');
            suggestions.push('Break up long tasks and optimize JavaScript execution');
          }
          break;
          
        case 'cumulative-layout-shift':
          if (latest.value > 0.1) {
            warnings.push('High Cumulative Layout Shift detected');
            suggestions.push('Add size attributes to images and avoid inserting content above existing content');
          }
          break;
          
        case 'long-task':
          if (latest.value > 50) {
            warnings.push(`Long JavaScript task detected (${latest.value}ms)`);
            suggestions.push('Break up long-running JavaScript into smaller chunks');
          }
          break;
      }
    }

    // Check resource loading
    const slowResources = Array.from(this.resourceTimings.entries())
      .filter(([_, duration]) => duration > 1000)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
    
    if (slowResources.length > 0) {
      warnings.push(`${slowResources.length} slow resources detected`);
      suggestions.push('Consider lazy loading, compression, or CDN for slow resources');
    }

    return {
      metrics: metricsArray,
      warnings,
      suggestions,
    };
  }

  /**
   * Start measuring a custom operation
   */
  startMeasure(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms');
    };
  }

  /**
   * Measure async operation
   */
  async measureAsync<T>(name: string, operation: () => Promise<T>): Promise<T> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      this.recordMetric(name, duration, 'ms');
      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      this.recordMetric(`${name}-error`, duration, 'ms');
      throw error;
    }
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage() {
    if ('memory' in performance) {
      const memory = (performance as any).memory;
      return {
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      };
    }
    return null;
  }

  /**
   * Clean up observers
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
    this.resourceTimings.clear();
  }
}

// Singleton instance
export const performanceMonitor = typeof window !== 'undefined' 
  ? new PerformanceMonitor() 
  : null;

/**
 * React hook for performance monitoring
 */
export function usePerformance(componentName: string) {
  useEffect(() => {
    const endMeasure = performanceMonitor?.startMeasure(`${componentName}-render`);
    
    return () => {
      endMeasure?.();
    };
  }, [componentName]);
  
  return {
    measureAsync: (name: string, operation: () => Promise<any>) => 
      performanceMonitor?.measureAsync(`${componentName}-${name}`, operation) || operation(),
    recordMetric: (name: string, value: number, unit?: string) =>
      performanceMonitor?.recordMetric(`${componentName}-${name}`, value, unit),
  };
}

/**
 * Performance optimization utilities
 */
export const performanceUtils = {
  /**
   * Debounce function for performance
   */
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function for performance
   */
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  /**
   * Request idle callback polyfill
   */
  requestIdleCallback(
    callback: IdleRequestCallback,
    options?: IdleRequestOptions
  ): number {
    if ('requestIdleCallback' in window) {
      return window.requestIdleCallback(callback, options);
    }
    
    // Fallback
    const start = Date.now();
    return window.setTimeout(() => {
      callback({
        didTimeout: false,
        timeRemaining: () => Math.max(0, 50 - (Date.now() - start)),
      });
    }, 1) as unknown as number;
  },

  /**
   * Lazy load images with intersection observer
   */
  lazyLoadImages(selector: string = 'img[data-src]') {
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target as HTMLImageElement;
            img.src = img.dataset.src!;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });

      document.querySelectorAll(selector).forEach(img => {
        imageObserver.observe(img);
      });
    }
  },

  /**
   * Preload critical resources
   */
  preloadResources(resources: Array<{ href: string; as: string }>) {
    resources.forEach(({ href, as }) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = as;
      link.href = href;
      document.head.appendChild(link);
    });
  },
};

// Import React hooks
import { useEffect } from 'react';