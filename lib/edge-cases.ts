/**
 * Edge Case Handling Utilities
 * Comprehensive handling of boundary conditions and edge cases
 */

/**
 * Safe number operations with boundary checks
 */
export const safeNumber = {
  /**
   * Parse number with fallback
   */
  parse(value: any, fallback: number = 0): number {
    const parsed = Number(value);
    
    if (Number.isNaN(parsed)) return fallback;
    if (!Number.isFinite(parsed)) return fallback;
    if (parsed > Number.MAX_SAFE_INTEGER) return Number.MAX_SAFE_INTEGER;
    if (parsed < Number.MIN_SAFE_INTEGER) return Number.MIN_SAFE_INTEGER;
    
    return parsed;
  },

  /**
   * Safe division with zero check
   */
  divide(numerator: number, denominator: number, fallback: number = 0): number {
    if (denominator === 0) return fallback;
    if (!Number.isFinite(numerator) || !Number.isFinite(denominator)) return fallback;
    
    const result = numerator / denominator;
    return Number.isFinite(result) ? result : fallback;
  },

  /**
   * Safe percentage calculation
   */
  percentage(value: number, total: number, decimals: number = 2): number {
    if (total === 0) return 0;
    const percentage = (value / total) * 100;
    return Number(percentage.toFixed(decimals));
  },

  /**
   * Clamp number within bounds
   */
  clamp(value: number, min: number, max: number): number {
    if (min > max) [min, max] = [max, min]; // Swap if min > max
    return Math.min(Math.max(value, min), max);
  },

  /**
   * Safe rounding with precision
   */
  round(value: number, precision: number = 2): number {
    const factor = Math.pow(10, precision);
    return Math.round(value * factor) / factor;
  },
};

/**
 * Safe string operations
 */
export const safeString = {
  /**
   * Truncate string with ellipsis
   */
  truncate(str: string, maxLength: number, suffix: string = '...'): string {
    if (!str) return '';
    if (maxLength <= 0) return '';
    if (str.length <= maxLength) return str;
    
    const truncateLength = maxLength - suffix.length;
    if (truncateLength <= 0) return suffix.substring(0, maxLength);
    
    return str.substring(0, truncateLength) + suffix;
  },

  /**
   * Safe string comparison (case-insensitive)
   */
  equals(str1: any, str2: any): boolean {
    const s1 = String(str1 || '').toLowerCase().trim();
    const s2 = String(str2 || '').toLowerCase().trim();
    return s1 === s2;
  },

  /**
   * Extract safe filename from path
   */
  getFilename(path: string, fallback: string = 'file'): string {
    if (!path) return fallback;
    
    const cleaned = path.replace(/[^a-zA-Z0-9._-]/g, '_');
    const parts = cleaned.split('/');
    const filename = parts[parts.length - 1];
    
    return filename || fallback;
  },

  /**
   * Sanitize for URL
   */
  toSlug(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  },

  /**
   * Safe JSON parse
   */
  parseJSON<T>(json: string, fallback: T): T {
    try {
      return JSON.parse(json);
    } catch {
      return fallback;
    }
  },
};

/**
 * Safe array operations
 */
export const safeArray = {
  /**
   * Get array element safely
   */
  get<T>(arr: T[], index: number, fallback?: T): T | undefined {
    if (!Array.isArray(arr)) return fallback;
    if (index < 0) index = arr.length + index; // Support negative indexing
    if (index < 0 || index >= arr.length) return fallback;
    return arr[index];
  },

  /**
   * Get first element safely
   */
  first<T>(arr: T[], fallback?: T): T | undefined {
    return this.get(arr, 0, fallback);
  },

  /**
   * Get last element safely
   */
  last<T>(arr: T[], fallback?: T): T | undefined {
    return this.get(arr, -1, fallback);
  },

  /**
   * Chunk array into smaller arrays
   */
  chunk<T>(arr: T[], size: number): T[][] {
    if (!Array.isArray(arr)) return [];
    if (size <= 0) return [arr];
    
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  },

  /**
   * Remove duplicates
   */
  unique<T>(arr: T[], key?: keyof T): T[] {
    if (!Array.isArray(arr)) return [];
    
    if (key) {
      const seen = new Set();
      return arr.filter(item => {
        const value = item[key];
        if (seen.has(value)) return false;
        seen.add(value);
        return true;
      });
    }
    
    return [...new Set(arr)];
  },

  /**
   * Safe array sum
   */
  sum(arr: number[]): number {
    if (!Array.isArray(arr)) return 0;
    return arr.reduce((sum, num) => {
      const safeNum = safeNumber.parse(num, 0);
      return sum + safeNum;
    }, 0);
  },
};

/**
 * Safe date operations
 */
export const safeDate = {
  /**
   * Parse date safely
   */
  parse(date: any, fallback: Date = new Date()): Date {
    if (date instanceof Date && !isNaN(date.getTime())) {
      return date;
    }
    
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? fallback : parsed;
  },

  /**
   * Format date safely
   */
  format(date: any, locale: string = 'en-US', options?: Intl.DateTimeFormatOptions): string {
    const safeDate = this.parse(date);
    
    try {
      return new Intl.DateTimeFormat(locale, options).format(safeDate);
    } catch {
      return safeDate.toLocaleDateString();
    }
  },

  /**
   * Add days safely
   */
  addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  },

  /**
   * Check if date is valid
   */
  isValid(date: any): boolean {
    return date instanceof Date && !isNaN(date.getTime());
  },

  /**
   * Get date range
   */
  getRange(start: any, end: any): { start: Date; end: Date } {
    const startDate = this.parse(start);
    const endDate = this.parse(end);
    
    // Ensure start is before end
    if (startDate > endDate) {
      return { start: endDate, end: startDate };
    }
    
    return { start: startDate, end: endDate };
  },
};

/**
 * Safe object operations
 */
export const safeObject = {
  /**
   * Get nested property safely
   */
  get(obj: any, path: string, fallback: any = undefined): any {
    if (!obj || typeof obj !== 'object') return fallback;
    
    const keys = path.split('.');
    let result = obj;
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key];
      } else {
        return fallback;
      }
    }
    
    return result ?? fallback;
  },

  /**
   * Merge objects safely
   */
  merge<T extends object>(...objects: Partial<T>[]): T {
    const result = {} as T;
    
    for (const obj of objects) {
      if (obj && typeof obj === 'object') {
        Object.assign(result, obj);
      }
    }
    
    return result;
  },

  /**
   * Pick properties safely
   */
  pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    
    if (!obj || typeof obj !== 'object') return result;
    
    for (const key of keys) {
      if (key in obj) {
        result[key] = obj[key];
      }
    }
    
    return result;
  },

  /**
   * Check if object is empty
   */
  isEmpty(obj: any): boolean {
    if (!obj || typeof obj !== 'object') return true;
    return Object.keys(obj).length === 0;
  },
};

/**
 * Safe async operations
 */
export const safeAsync = {
  /**
   * Wrap async function with timeout
   */
  withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number,
    fallback?: T
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => {
          if (fallback !== undefined) {
            reject(fallback);
          } else {
            reject(new Error(`Operation timed out after ${timeoutMs}ms`));
          }
        }, timeoutMs)
      ),
    ]);
  },

  /**
   * Retry async operation
   */
  async retry<T>(
    operation: () => Promise<T>,
    options: {
      maxAttempts?: number;
      delay?: number;
      backoff?: number;
      onError?: (error: Error, attempt: number) => void;
    } = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoff = 2,
      onError,
    } = options;

    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        onError?.(lastError, attempt);

        if (attempt < maxAttempts) {
          const waitTime = delay * Math.pow(backoff, attempt - 1);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    throw lastError!;
  },

  /**
   * Safe promise handler
   */
  async handle<T>(
    promise: Promise<T>
  ): Promise<[T | null, Error | null]> {
    try {
      const result = await promise;
      return [result, null];
    } catch (error) {
      return [null, error as Error];
    }
  },
};

/**
 * Network edge cases
 */
export const safeNetwork = {
  /**
   * Check if online
   */
  isOnline(): boolean {
    if (typeof navigator === 'undefined') return true;
    return navigator.onLine;
  },

  /**
   * Get connection type
   */
  getConnectionType(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const connection = (navigator as any).connection || 
                      (navigator as any).mozConnection || 
                      (navigator as any).webkitConnection;
    
    return connection?.effectiveType || 'unknown';
  },

  /**
   * Detect slow connection
   */
  isSlowConnection(): boolean {
    const type = this.getConnectionType();
    return ['slow-2g', '2g', '3g'].includes(type);
  },
};

/**
 * Browser compatibility checks
 */
export const safeBrowser = {
  /**
   * Check if feature is supported
   */
  supports(feature: string): boolean {
    switch (feature) {
      case 'webp':
        return this.supportsWebP();
      case 'avif':
        return this.supportsAVIF();
      case 'intersection-observer':
        return 'IntersectionObserver' in window;
      case 'web-share':
        return 'share' in navigator;
      case 'clipboard':
        return 'clipboard' in navigator;
      case 'service-worker':
        return 'serviceWorker' in navigator;
      default:
        return false;
    }
  },

  /**
   * Check WebP support
   */
  supportsWebP(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL('image/webp').indexOf('image/webp') === 5;
  },

  /**
   * Check AVIF support
   */
  supportsAVIF(): boolean {
    if (typeof window === 'undefined') return false;
    
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    
    return canvas.toDataURL('image/avif').indexOf('image/avif') === 5;
  },

  /**
   * Get viewport dimensions safely
   */
  getViewport() {
    if (typeof window === 'undefined') {
      return { width: 0, height: 0 };
    }
    
    return {
      width: window.innerWidth || document.documentElement.clientWidth || 0,
      height: window.innerHeight || document.documentElement.clientHeight || 0,
    };
  },
};

/**
 * Form validation edge cases
 */
export const safeForm = {
  /**
   * Validate email with edge cases
   */
  isValidEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    
    // Basic regex that handles most cases
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    // Additional checks
    if (email.length > 320) return false; // Max email length
    if (email.startsWith('.') || email.endsWith('.')) return false;
    if (email.includes('..')) return false;
    
    return regex.test(email);
  },

  /**
   * Validate phone number internationally
   */
  isValidPhone(phone: string): boolean {
    if (!phone || typeof phone !== 'string') return false;
    
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    
    // Check length (international numbers can be 7-15 digits)
    return digits.length >= 7 && digits.length <= 15;
  },

  /**
   * Sanitize form input
   */
  sanitizeInput(input: any): string {
    if (input === null || input === undefined) return '';
    
    return String(input)
      .trim()
      .replace(/[<>]/g, '') // Remove potential HTML
      .substring(0, 1000); // Limit length
  },
};