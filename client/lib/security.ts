// Security Utilities Module
import { logger } from './logger';

// Input sanitization utilities
export class InputSanitizer {
  // Sanitize HTML to prevent XSS
  static sanitizeHtml(input: string): string {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Validate and sanitize email
  static sanitizeEmail(email: string): string {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const sanitized = email.trim().toLowerCase();
    
    if (!emailRegex.test(sanitized)) {
      throw new Error('Invalid email format');
    }
    
    return sanitized;
  }

  // Sanitize phone number
  static sanitizePhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length < 10 || cleaned.length > 15) {
      throw new Error('Invalid phone number');
    }
    
    return cleaned;
  }

  // Sanitize Arabic text
  static sanitizeArabicText(text: string): string {
    // Remove potentially dangerous characters while preserving Arabic
    const arabicRegex = /^[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\s\d\u0020-\u007E]*$/;
    
    if (!arabicRegex.test(text)) {
      throw new Error('Text contains invalid characters');
    }
    
    return text.trim();
  }

  // General text sanitization
  static sanitizeText(text: string, maxLength: number = 1000): string {
    if (text.length > maxLength) {
      throw new Error(`Text exceeds maximum length of ${maxLength} characters`);
    }
    
    // Remove HTML tags and normalize whitespace
    return text
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Sanitize URL
  static sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url);
      
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        throw new Error('Invalid URL protocol');
      }
      
      return urlObj.toString();
    } catch {
      throw new Error('Invalid URL format');
    }
  }
}

// Content Security Policy helper
export class CSPHelper {
  static generateNonce(): string {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }

  static createCSPHeader(): string {
    const nonce = this.generateNonce();
    
    return [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https: wss:",
      "media-src 'self' https:",
      "object-src 'none'",
      "frame-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests"
    ].join('; ');
  }
}

// Rate limiting for client-side
export class RateLimit {
  private static attempts: Map<string, { count: number; resetTime: number }> = new Map();

  static isAllowed(key: string, maxAttempts: number, windowMs: number): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (attempt.count >= maxAttempts) {
      logger.warn('Rate limit exceeded', { key, attempts: attempt.count });
      return false;
    }

    attempt.count++;
    return true;
  }

  static reset(key: string): void {
    this.attempts.delete(key);
  }

  static getAttempts(key: string): number {
    const attempt = this.attempts.get(key);
    return attempt ? attempt.count : 0;
  }
}

// Secure storage utilities
export class SecureStorage {
  private static readonly PREFIX = 'secure_';
  
  // Encrypt data before storing (basic implementation)
  static setItem(key: string, value: any): void {
    try {
      const serialized = JSON.stringify(value);
      const encrypted = btoa(serialized); // Basic encoding (not secure for sensitive data)
      localStorage.setItem(this.PREFIX + key, encrypted);
    } catch (error) {
      logger.error('Failed to store secure item', { key, error });
      throw error;
    }
  }

  // Decrypt data after retrieving
  static getItem<T>(key: string): T | null {
    try {
      const encrypted = localStorage.getItem(this.PREFIX + key);
      if (!encrypted) return null;
      
      const serialized = atob(encrypted);
      return JSON.parse(serialized);
    } catch (error) {
      logger.error('Failed to retrieve secure item', { key, error });
      return null;
    }
  }

  static removeItem(key: string): void {
    localStorage.removeItem(this.PREFIX + key);
  }

  static clear(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// Password strength validator
export class PasswordValidator {
  static readonly MIN_LENGTH = 8;
  static readonly MAX_LENGTH = 128;

  static validate(password: string): { isValid: boolean; errors: string[]; strength: number } {
    const errors: string[] = [];
    let strength = 0;

    // Length check
    if (password.length < this.MIN_LENGTH) {
      errors.push(`كلمة المرور يجب أن تحتوي على ${this.MIN_LENGTH} أحرف على الأقل`);
    } else {
      strength += 20;
    }

    if (password.length > this.MAX_LENGTH) {
      errors.push(`كلمة المرور لا يجب أن تتجاوز ${this.MAX_LENGTH} حرف`);
    }

    // Character variety checks
    if (!/[a-z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل');
    } else {
      strength += 20;
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل');
    } else {
      strength += 20;
    }

    if (!/\d/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل');
    } else {
      strength += 20;
    }

    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>?]/.test(password)) {
      errors.push('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل');
    } else {
      strength += 20;
    }

    // Common password checks
    const commonPasswords = [
      'password', '123456', '123456789', 'qwerty', 'abc123', 
      'password123', 'admin', 'letmein', 'welcome', 'monkey'
    ];

    if (commonPasswords.includes(password.toLowerCase())) {
      errors.push('كلمة المرور ضعيفة جداً، يرجى اختيار كلمة مرور أقوى');
      strength = 0;
    }

    return {
      isValid: errors.length === 0,
      errors,
      strength: Math.min(strength, 100)
    };
  }

  static getStrengthText(strength: number): string {
    if (strength < 40) return 'ضعيف';
    if (strength < 60) return 'متوسط';
    if (strength < 80) return 'قوي';
    return 'قوي جداً';
  }

  static getStrengthColor(strength: number): string {
    if (strength < 40) return 'text-red-500';
    if (strength < 60) return 'text-yellow-500';
    if (strength < 80) return 'text-blue-500';
    return 'text-green-500';
  }
}

// CSRF protection
export class CSRFProtection {
  private static token: string | null = null;

  static async getToken(): Promise<string> {
    if (this.token) return this.token;

    try {
      const response = await fetch('/api/csrf-token');
      const data = await response.json();
      this.token = data.token;
      return this.token;
    } catch (error) {
      logger.error('Failed to get CSRF token', error);
      throw error;
    }
  }

  static async addTokenToHeaders(headers: HeadersInit = {}): Promise<HeadersInit> {
    const token = await this.getToken();
    return {
      ...headers,
      'X-CSRF-Token': token,
    };
  }

  static reset(): void {
    this.token = null;
  }
}

// Security monitoring
export class SecurityMonitor {
  private static suspiciousActivities: Array<{
    type: string;
    timestamp: number;
    details: any;
  }> = [];

  static reportSuspiciousActivity(type: string, details: any): void {
    const activity = {
      type,
      timestamp: Date.now(),
      details,
    };

    this.suspiciousActivities.push(activity);
    
    // Keep only last 100 activities
    if (this.suspiciousActivities.length > 100) {
      this.suspiciousActivities.shift();
    }

    logger.warn('Suspicious activity detected', activity);

    // Alert if too many suspicious activities
    const recentActivities = this.suspiciousActivities.filter(
      a => Date.now() - a.timestamp < 60000 // Last minute
    );

    if (recentActivities.length > 5) {
      this.triggerSecurityAlert();
    }
  }

  private static triggerSecurityAlert(): void {
    logger.error('Multiple suspicious activities detected', {
      activities: this.suspiciousActivities.slice(-10),
    });

    // Could trigger additional security measures here
    // such as temporary account lockout, additional verification, etc.
  }

  static getRecentActivities(): Array<{ type: string; timestamp: number; details: any }> {
    return this.suspiciousActivities.slice(-20);
  }
}

// Environment validation
export class EnvironmentValidator {
  static validateSecureContext(): boolean {
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost';
    
    if (!isSecure) {
      logger.warn('Application running in insecure context');
      SecurityMonitor.reportSuspiciousActivity('insecure_context', {
        protocol: window.location.protocol,
        hostname: window.location.hostname,
      });
    }

    return isSecure;
  }

  static checkBrowserSecurity(): {
    cookiesEnabled: boolean;
    localStorageEnabled: boolean;
    cryptoAvailable: boolean;
    webAuthNAvailable: boolean;
  } {
    const cookiesEnabled = navigator.cookieEnabled;
    
    let localStorageEnabled = false;
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      localStorageEnabled = true;
    } catch {
      // localStorage not available
    }

    const cryptoAvailable = 'crypto' in window && 'getRandomValues' in crypto;
    const webAuthNAvailable = 'credentials' in navigator;

    return {
      cookiesEnabled,
      localStorageEnabled,
      cryptoAvailable,
      webAuthNAvailable,
    };
  }
}

// Security headers check
export class SecurityHeaders {
  static async checkHeaders(): Promise<{
    csp: boolean;
    hsts: boolean;
    frameOptions: boolean;
    contentTypeOptions: boolean;
  }> {
    try {
      const response = await fetch(window.location.href, { method: 'HEAD' });
      
      return {
        csp: response.headers.has('content-security-policy'),
        hsts: response.headers.has('strict-transport-security'),
        frameOptions: response.headers.has('x-frame-options'),
        contentTypeOptions: response.headers.has('x-content-type-options'),
      };
    } catch {
      return {
        csp: false,
        hsts: false,
        frameOptions: false,
        contentTypeOptions: false,
      };
    }
  }
}

// Export all security utilities
export const Security = {
  InputSanitizer,
  CSPHelper,
  RateLimit,
  SecureStorage,
  PasswordValidator,
  CSRFProtection,
  SecurityMonitor,
  EnvironmentValidator,
  SecurityHeaders,
};

export default Security;
