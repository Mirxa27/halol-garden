// Comprehensive Logging System
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
  stack?: string;
}

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  enableStorage: boolean;
  remoteEndpoint?: string;
  maxStorageEntries: number;
  includeUserContext: boolean;
}

class Logger {
  private config: LoggerConfig;
  private sessionId: string;
  private userId?: string;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: 'info',
      enableConsole: true,
      enableRemote: false,
      enableStorage: true,
      maxStorageEntries: 1000,
      includeUserContext: true,
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.initializeUserContext();
  }

  private generateSessionId(): string {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  private initializeUserContext(): void {
    if (this.config.includeUserContext) {
      try {
        const authData = localStorage.getItem('auth-storage');
        if (authData) {
          const parsed = JSON.parse(authData);
          this.userId = parsed.state?.user?.id;
        }
      } catch (error) {
        // Ignore auth parsing errors
      }
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.config.level];
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    error?: Error
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      sessionId: this.sessionId,
      url: window.location.href,
      userAgent: navigator.userAgent,
    };

    if (this.userId) {
      entry.userId = this.userId;
    }

    if (context) {
      entry.context = context;
    }

    if (error && error.stack) {
      entry.stack = error.stack;
    }

    return entry;
  }

  private logToConsole(entry: LogEntry): void {
    const style = this.getConsoleStyle(entry.level);
    const prefix = `[${entry.level.toUpperCase()}] ${entry.timestamp}`;
    
    if (entry.level === 'error') {
      console.error(prefix, entry.message, entry.context || '', entry.stack || '');
    } else if (entry.level === 'warn') {
      console.warn(prefix, entry.message, entry.context || '');
    } else {
      console.log(`%c${prefix}`, style, entry.message, entry.context || '');
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6B7280;',
      info: 'color: #3B82F6;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
    };
    return styles[level];
  }

  private logToStorage(entry: LogEntry): void {
    try {
      const storageKey = 'app-logs';
      const existingLogs = JSON.parse(localStorage.getItem(storageKey) || '[]');
      
      existingLogs.push(entry);
      
      // Maintain max entries limit
      if (existingLogs.length > this.config.maxStorageEntries) {
        existingLogs.splice(0, existingLogs.length - this.config.maxStorageEntries);
      }
      
      localStorage.setItem(storageKey, JSON.stringify(existingLogs));
    } catch (error) {
      // Ignore storage errors
      console.warn('Failed to store log entry:', error);
    }
  }

  private async logToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      console.warn('Failed to send log to remote endpoint:', error);
    }
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): void {
    if (!this.shouldLog(level)) return;

    const entry = this.createLogEntry(level, message, context, error);

    if (this.config.enableConsole) {
      this.logToConsole(entry);
    }

    if (this.config.enableStorage) {
      this.logToStorage(entry);
    }

    if (this.config.enableRemote) {
      this.logToRemote(entry).catch(() => {
        // Ignore remote logging failures
      });
    }
  }

  // Public API
  debug(message: string, context?: Record<string, any>): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: Record<string, any>): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: Record<string, any>): void {
    this.log('warn', message, context);
  }

  error(message: string, contextOrError?: Record<string, any> | Error, error?: Error): void {
    if (contextOrError instanceof Error) {
      this.log('error', message, undefined, contextOrError);
    } else {
      this.log('error', message, contextOrError, error);
    }
  }

  // User context management
  setUserId(userId: string): void {
    this.userId = userId;
  }

  clearUserId(): void {
    this.userId = undefined;
  }

  // Performance logging
  startTimer(label: string): () => void {
    const start = performance.now();
    return () => {
      const duration = performance.now() - start;
      this.info(`Timer: ${label}`, { duration: `${duration.toFixed(2)}ms` });
    };
  }

  // API request logging
  logApiRequest(method: string, url: string, status: number, duration: number, error?: string): void {
    const level = status >= 400 ? 'error' : 'info';
    const message = `API ${method} ${url}`;
    const context = {
      method,
      url,
      status,
      duration: `${duration}ms`,
      ...(error && { error }),
    };

    this.log(level, message, context);
  }

  // User action logging
  logUserAction(action: string, details?: Record<string, any>): void {
    this.info(`User Action: ${action}`, {
      action,
      ...details,
      userId: this.userId,
    });
  }

  // Get stored logs
  getLogs(): LogEntry[] {
    try {
      const logs = localStorage.getItem('app-logs');
      return logs ? JSON.parse(logs) : [];
    } catch {
      return [];
    }
  }

  // Clear stored logs
  clearLogs(): void {
    localStorage.removeItem('app-logs');
  }

  // Export logs for debugging
  exportLogs(): string {
    const logs = this.getLogs();
    return JSON.stringify(logs, null, 2);
  }
}

// Error boundary integration
export class ErrorReporter {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.setupGlobalErrorHandling();
    this.setupUnhandledRejectionHandling();
  }

  private setupGlobalErrorHandling(): void {
    window.addEventListener('error', (event) => {
      this.logger.error('Global Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack,
      });
    });
  }

  private setupUnhandledRejectionHandling(): void {
    window.addEventListener('unhandledrejection', (event) => {
      this.logger.error('Unhandled Promise Rejection', {
        reason: event.reason,
        stack: (event.reason as Error)?.stack, // Cast to Error to access stack
      });
    });
  }

  reportError(error: Error, context?: Record<string, any>): void {
    this.logger.error('Reported Error', context, error);
  }

  reportUserError(message: string, context?: Record<string, any>): void {
    this.logger.error('User Error', {
      userReported: true,
      ...context,
    });
  }
}

// Performance monitoring
export class PerformanceMonitor {
  private logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
    this.setupPerformanceObserver();
  }

  private setupPerformanceObserver(): void {
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.logNavigationTiming(entry as PerformanceNavigationTiming);
            } else if (entry.entryType === 'resource') {
              this.logResourceTiming(entry as PerformanceResourceTiming);
            }
          });
        });

        observer.observe({ type: 'navigation', buffered: true });
        observer.observe({ type: 'resource', buffered: true });
      } catch (error) {
        this.logger.warn('Performance Observer not supported', { error });
      }
    }
  }

  private logNavigationTiming(entry: PerformanceNavigationTiming): void {
    this.logger.info('Page Load Performance', {
      url: entry.name,
      loadTime: entry.loadEventEnd - entry.loadEventStart,
      domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
      totalTime: entry.loadEventEnd - entry.fetchStart,
    });
  }

  private logResourceTiming(entry: PerformanceResourceTiming): void {
    if (entry.duration > 1000) { // Log slow resources (>1s)
      this.logger.warn('Slow Resource Load', {
        url: entry.name,
        duration: entry.duration,
        size: entry.transferSize,
        type: entry.initiatorType,
      });
    }
  }

  markPerformance(name: string): void {
    if ('performance' in window && 'mark' in performance) {
      performance.mark(name);
    }
  }

  measurePerformance(name: string, startMark: string, endMark?: string): void {
    if ('performance' in window && 'measure' in performance) {
      try {
        performance.measure(name, startMark, endMark);
        const measure = performance.getEntriesByName(name, 'measure')[0];
        this.logger.info('Performance Measure', {
          name,
          duration: measure.duration,
          startTime: measure.startTime,
        });
      } catch (error) {
        this.logger.warn('Performance measurement failed', { name, error });
      }
    }
  }
}

// Create singleton instances
const defaultConfig: Partial<LoggerConfig> = {
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  enableConsole: true,
  enableRemote: process.env.NODE_ENV === 'production',
  enableStorage: true,
  remoteEndpoint: '/api/logs',
  maxStorageEntries: 1000,
  includeUserContext: true,
};

export const logger = new Logger(defaultConfig);
export const errorReporter = new ErrorReporter(logger);
export const performanceMonitor = new PerformanceMonitor(logger);

// React hook for logging
export const useLogger = () => {
  return {
    logger,
    logUserAction: logger.logUserAction.bind(logger),
    reportError: errorReporter.reportError.bind(errorReporter),
    startTimer: logger.startTimer.bind(logger),
  };
};

export default logger;