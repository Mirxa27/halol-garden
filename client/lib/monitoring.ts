/**
 * Comprehensive Monitoring and Logging Service
 * Integrates with multiple monitoring providers and provides unified interface
 */

import { EventEmitter } from 'events';

// Types
export interface MonitoringConfig {
  enableLogging: boolean;
  enablePerformance: boolean;
  enableErrorTracking: boolean;
  enableAnalytics: boolean;
  sampleRate: number;
  environment: string;
  userId?: string;
  sessionId?: string;
}

export interface LogLevel {
  DEBUG: 'debug';
  INFO: 'info';
  WARN: 'warn';
  ERROR: 'error';
  FATAL: 'fatal';
}

export interface LogEntry {
  level: keyof LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
  url?: string;
  userAgent?: string;
}

export interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: string;
  tags?: Record<string, string>;
}

export interface UserAction {
  action: string;
  category: string;
  label?: string;
  value?: number;
  timestamp: string;
  metadata?: Record<string, any>;
}

class MonitoringService extends EventEmitter {
  private static instance: MonitoringService;
  private config: MonitoringConfig;
  private buffer: LogEntry[] = [];
  private metricsBuffer: PerformanceMetric[] = [];
  private flushInterval: NodeJS.Timeout | null = null;
  private sessionStartTime: number;
  private pageLoadTime: number = 0;

  private constructor() {
    super();
    this.config = this.getDefaultConfig();
    this.sessionStartTime = Date.now();
    this.initializeProviders();
    this.setupPerformanceObserver();
    this.setupErrorHandlers();
    this.startFlushInterval();
  }

  public static getInstance(): MonitoringService {
    if (!MonitoringService.instance) {
      MonitoringService.instance = new MonitoringService();
    }
    return MonitoringService.instance;
  }

  private getDefaultConfig(): MonitoringConfig {
    return {
      enableLogging: true,
      enablePerformance: true,
      enableErrorTracking: true,
      enableAnalytics: true,
      sampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      environment: process.env.NODE_ENV || 'development',
      sessionId: this.generateSessionId(),
    };
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public configure(config: Partial<MonitoringConfig>): void {
    this.config = { ...this.config, ...config };
    this.emit('config-changed', this.config);
  }

  // ============ Logging ============

  public log(level: keyof LogLevel, message: string, context?: Record<string, any>): void {
    if (!this.config.enableLogging) return;
    if (!this.shouldSample()) return;

    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      context,
      userId: this.config.userId,
      sessionId: this.config.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.buffer.push(entry);
    this.emit('log', entry);

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      this.consoleLog(entry);
    }

    // Immediate flush for errors
    if (level === 'ERROR' || level === 'FATAL') {
      this.flush();
    }
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log('DEBUG', message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log('INFO', message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log('WARN', message, context);
  }

  public error(message: string, error?: Error, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level: 'ERROR',
      message,
      timestamp: new Date().toISOString(),
      error,
      context: {
        ...context,
        errorName: error?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
      },
      userId: this.config.userId,
      sessionId: this.config.sessionId,
      url: typeof window !== 'undefined' ? window.location.href : undefined,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
    };

    this.buffer.push(entry);
    this.emit('error', entry);
    this.sendToErrorTracking(error, context);
    this.flush();
  }

  public fatal(message: string, error?: Error, context?: Record<string, any>): void {
    this.log('FATAL', message, { ...context, error });
    // Force immediate flush
    this.flush(true);
  }

  private consoleLog(entry: LogEntry): void {
    // Only log to console in development environment
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const style = this.getConsoleStyle(entry.level);
    const prefix = `[${entry.level}] [${new Date(entry.timestamp).toLocaleTimeString()}]`;
    
    console.log(`%c${prefix}`, style, entry.message, entry.context || '');
    
    if (entry.error) {
      console.error(entry.error);
    }
  }

  private getConsoleStyle(level: keyof LogLevel): string {
    const styles = {
      DEBUG: 'color: #888; font-weight: normal;',
      INFO: 'color: #2196F3; font-weight: normal;',
      WARN: 'color: #FF9800; font-weight: bold;',
      ERROR: 'color: #F44336; font-weight: bold;',
      FATAL: 'color: #D32F2F; font-weight: bold; font-size: 1.2em;',
    };
    return styles[level] || styles.INFO;
  }

  // ============ Performance Monitoring ============

  public trackPerformance(name: string, value: number, unit: string = 'ms', tags?: Record<string, string>): void {
    if (!this.config.enablePerformance) return;
    if (!this.shouldSample()) return;

    const metric: PerformanceMetric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      tags,
    };

    this.metricsBuffer.push(metric);
    this.emit('metric', metric);
  }

  public startTimer(name: string): () => void {
    const startTime = performance.now();
    
    return () => {
      const duration = performance.now() - startTime;
      this.trackPerformance(name, duration, 'ms');
      return duration;
    };
  }

  public async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const endTimer = this.startTimer(name);
    try {
      const result = await fn();
      endTimer();
      return result;
    } catch (error) {
      endTimer();
      throw error;
    }
  }

  private setupPerformanceObserver(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return;

    // Track page load performance
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      if (loadTime > 0) {
        this.pageLoadTime = loadTime;
        this.trackPerformance('page_load', loadTime, 'ms');
      }
    }

    // Track Core Web Vitals
    this.trackWebVitals();

    // Track long tasks
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.duration > 50) {
              this.trackPerformance('long_task', entry.duration, 'ms', {
                name: entry.name,
                startTime: entry.startTime.toString(),
              });
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      } catch (e) {
        // Some browsers don't support longtask
      }
    }
  }

  private trackWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Largest Contentful Paint (LCP)
    new PerformanceObserver((entryList) => {
      const entries = entryList.getEntries();
      const lastEntry = entries[entries.length - 1];
      this.trackPerformance('lcp', lastEntry.startTime, 'ms');
    }).observe({ type: 'largest-contentful-paint', buffered: true });

    // First Input Delay (FID)
    new PerformanceObserver((entryList) => {
      const firstInput = entryList.getEntries()[0];
      if (firstInput) {
        const fid = firstInput.processingStart - firstInput.startTime;
        this.trackPerformance('fid', fid, 'ms');
      }
    }).observe({ type: 'first-input', buffered: true });

    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
        }
      }
      this.trackPerformance('cls', clsValue, 'score');
    }).observe({ type: 'layout-shift', buffered: true });
  }

  // ============ User Action Tracking ============

  public trackAction(action: string, category: string, label?: string, value?: number, metadata?: Record<string, any>): void {
    if (!this.config.enableAnalytics) return;
    if (!this.shouldSample()) return;

    const userAction: UserAction = {
      action,
      category,
      label,
      value,
      timestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        userId: this.config.userId,
        sessionId: this.config.sessionId,
      },
    };

    this.emit('action', userAction);
    this.sendToAnalytics(userAction);
  }

  public trackPageView(pageName: string, metadata?: Record<string, any>): void {
    this.trackAction('page_view', 'navigation', pageName, undefined, metadata);
  }

  public trackEvent(eventName: string, metadata?: Record<string, any>): void {
    this.trackAction('event', 'custom', eventName, undefined, metadata);
  }

  // ============ Error Tracking ============

  private setupErrorHandlers(): void {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.error('Uncaught error', event.error, {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      });
    });

    // Unhandled promise rejection
    window.addEventListener('unhandledrejection', (event) => {
      this.error('Unhandled promise rejection', new Error(event.reason), {
        reason: event.reason,
        promise: event.promise,
      });
    });
  }

  private sendToErrorTracking(error?: Error, context?: Record<string, any>): void {
    if (!this.config.enableErrorTracking) return;

    // Sentry integration
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.captureException(error, {
        extra: context,
        tags: {
          environment: this.config.environment,
        },
        user: {
          id: this.config.userId,
        },
      });
    }

    // Custom error tracking endpoint
    this.sendToEndpoint('/api/errors', {
      error: {
        name: error?.name,
        message: error?.message,
        stack: error?.stack,
      },
      context,
      timestamp: new Date().toISOString(),
      userId: this.config.userId,
      sessionId: this.config.sessionId,
    });
  }

  // ============ Analytics Integration ============

  private sendToAnalytics(action: UserAction): void {
    // Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', action.action, {
        event_category: action.category,
        event_label: action.label,
        value: action.value,
        ...action.metadata,
      });
    }

    // Custom analytics endpoint
    this.sendToEndpoint('/api/analytics', action);
  }

  // ============ Provider Integration ============

  private initializeProviders(): void {
    // Initialize Sentry
    if (process.env.NEXT_PUBLIC_SENTRY_DSN && typeof window !== 'undefined') {
      import('@sentry/nextjs').then((Sentry) => {
        Sentry.init({
          dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
          environment: this.config.environment,
          sampleRate: this.config.sampleRate,
          tracesSampleRate: this.config.sampleRate,
        });
      });
    }

    // Initialize Google Analytics
    if (process.env.NEXT_PUBLIC_GA_ID && typeof window !== 'undefined') {
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`;
      script.async = true;
      document.head.appendChild(script);

      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).gtag = function() {
        (window as any).dataLayer.push(arguments);
      };
      (window as any).gtag('js', new Date());
      (window as any).gtag('config', process.env.NEXT_PUBLIC_GA_ID);
    }
  }

  // ============ Data Management ============

  private shouldSample(): boolean {
    return Math.random() < this.config.sampleRate;
  }

  private startFlushInterval(): void {
    this.flushInterval = setInterval(() => {
      this.flush();
    }, 30000); // Flush every 30 seconds
  }

  private async flush(force: boolean = false): Promise<void> {
    if (!force && this.buffer.length === 0 && this.metricsBuffer.length === 0) {
      return;
    }

    // Send logs
    if (this.buffer.length > 0) {
      const logs = [...this.buffer];
      this.buffer = [];
      await this.sendToEndpoint('/api/logs', { logs });
    }

    // Send metrics
    if (this.metricsBuffer.length > 0) {
      const metrics = [...this.metricsBuffer];
      this.metricsBuffer = [];
      await this.sendToEndpoint('/api/metrics', { metrics });
    }
  }

  private async sendToEndpoint(endpoint: string, data: any): Promise<void> {
    try {
      await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
    } catch (error) {
      // Silently fail to avoid infinite loop
      if (process.env.NODE_ENV === 'development') {
        console.error(`Failed to send data to ${endpoint}:`, error);
      }
    }
  }

  public destroy(): void {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }
    this.flush(true);
    this.removeAllListeners();
  }

  // ============ Session Management ============

  public setUser(userId: string, metadata?: Record<string, any>): void {
    this.config.userId = userId;
    this.info('User identified', { userId, ...metadata });
    
    // Update Sentry user context
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.setUser({ id: userId, ...metadata });
    }
  }

  public clearUser(): void {
    this.config.userId = undefined;
    this.info('User cleared');
    
    // Clear Sentry user context
    if (typeof window !== 'undefined' && (window as any).Sentry) {
      (window as any).Sentry.setUser(null);
    }
  }

  public getSessionDuration(): number {
    return Date.now() - this.sessionStartTime;
  }

  public getSessionMetrics(): Record<string, any> {
    return {
      sessionId: this.config.sessionId,
      duration: this.getSessionDuration(),
      pageLoadTime: this.pageLoadTime,
      logCount: this.buffer.length,
      metricCount: this.metricsBuffer.length,
    };
  }
}

// Export singleton instance
export const monitoring = MonitoringService.getInstance();

// Export convenience functions
export const log = monitoring.log.bind(monitoring);
export const debug = monitoring.debug.bind(monitoring);
export const info = monitoring.info.bind(monitoring);
export const warn = monitoring.warn.bind(monitoring);
export const error = monitoring.error.bind(monitoring);
export const fatal = monitoring.fatal.bind(monitoring);
export const trackPerformance = monitoring.trackPerformance.bind(monitoring);
export const trackAction = monitoring.trackAction.bind(monitoring);
export const trackPageView = monitoring.trackPageView.bind(monitoring);
export const trackEvent = monitoring.trackEvent.bind(monitoring);
export const startTimer = monitoring.startTimer.bind(monitoring);
export const measureAsync = monitoring.measureAsync.bind(monitoring);
export const setUser = monitoring.setUser.bind(monitoring);
export const clearUser = monitoring.clearUser.bind(monitoring);

export default monitoring;