import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  InputSanitizer, 
  PasswordValidator, 
  RateLimit, 
  SecureStorage,
  CSRFProtection,
  SecurityMonitor,
  EnvironmentValidator 
} from '../lib/security';

describe('Security Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  describe('InputSanitizer', () => {
    it('should sanitize HTML input', () => {
      const maliciousInput = '<script>alert("xss")</script>Hello';
      const sanitized = InputSanitizer.sanitizeHtml(maliciousInput);
      expect(sanitized).toBe('&lt;script&gt;alert("xss")&lt;/script&gt;Hello');
    });

    it('should validate and sanitize email', () => {
      expect(InputSanitizer.sanitizeEmail('  TEST@EXAMPLE.COM  ')).toBe('test@example.com');
      expect(() => InputSanitizer.sanitizeEmail('invalid-email')).toThrow('Invalid email format');
      expect(() => InputSanitizer.sanitizeEmail('')).toThrow('Invalid email format');
    });

    it('should sanitize phone numbers', () => {
      expect(InputSanitizer.sanitizePhone('+1 (555) 123-4567')).toBe('15551234567');
      expect(InputSanitizer.sanitizePhone('555.123.4567')).toBe('5551234567');
      expect(() => InputSanitizer.sanitizePhone('123')).toThrow('Invalid phone number');
      expect(() => InputSanitizer.sanitizePhone('123456789012345678')).toThrow('Invalid phone number');
    });

    it('should sanitize Arabic text', () => {
      const validArabic = 'مرحبا بكم في الموقع';
      expect(InputSanitizer.sanitizeArabicText(validArabic)).toBe(validArabic);
      
      const arabicWithNumbers = 'النص العربي 123 مع أرقام';
      expect(InputSanitizer.sanitizeArabicText(arabicWithNumbers)).toBe(arabicWithNumbers);
      
      expect(() => InputSanitizer.sanitizeArabicText('Invalid <script>')).toThrow('Text contains invalid characters');
    });

    it('should sanitize general text', () => {
      const longText = 'a'.repeat(1001);
      expect(() => InputSanitizer.sanitizeText(longText)).toThrow('Text exceeds maximum length');
      
      const htmlText = 'Hello <b>world</b>   with   spaces';
      expect(InputSanitizer.sanitizeText(htmlText)).toBe('Hello world with spaces');
    });

    it('should sanitize URLs', () => {
      expect(InputSanitizer.sanitizeUrl('https://example.com')).toBe('https://example.com/');
      expect(InputSanitizer.sanitizeUrl('http://example.com/path')).toBe('http://example.com/path');
      
      expect(() => InputSanitizer.sanitizeUrl('javascript:alert(1)')).toThrow('Invalid URL protocol');
      expect(() => InputSanitizer.sanitizeUrl('ftp://example.com')).toThrow('Invalid URL protocol');
      expect(() => InputSanitizer.sanitizeUrl('invalid-url')).toThrow('Invalid URL format');
    });
  });

  describe('PasswordValidator', () => {
    it('should validate strong password', () => {
      const result = PasswordValidator.validate('StrongP@ssw0rd');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.strength).toBe(100);
    });

    it('should reject weak passwords', () => {
      const result = PasswordValidator.validate('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.strength).toBeLessThan(40);
    });

    it('should reject common passwords', () => {
      const result = PasswordValidator.validate('password');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('كلمة المرور ضعيفة جداً، يرجى اختيار كلمة مرور أقوى');
      expect(result.strength).toBe(0);
    });

    it('should reject too long passwords', () => {
      const longPassword = 'a'.repeat(129);
      const result = PasswordValidator.validate(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('كلمة المرور لا يجب أن تتجاوز 128 حرف');
    });

    it('should provide correct strength text', () => {
      expect(PasswordValidator.getStrengthText(30)).toBe('ضعيف');
      expect(PasswordValidator.getStrengthText(50)).toBe('متوسط');
      expect(PasswordValidator.getStrengthText(70)).toBe('قوي');
      expect(PasswordValidator.getStrengthText(90)).toBe('قوي جداً');
    });

    it('should provide correct strength colors', () => {
      expect(PasswordValidator.getStrengthColor(30)).toBe('text-red-500');
      expect(PasswordValidator.getStrengthColor(50)).toBe('text-yellow-500');
      expect(PasswordValidator.getStrengthColor(70)).toBe('text-blue-500');
      expect(PasswordValidator.getStrengthColor(90)).toBe('text-green-500');
    });
  });

  describe('RateLimit', () => {
    beforeEach(() => {
      // Clear internal rate limit state
      (RateLimit as any).attempts.clear();
    });

    it('should allow requests within limit', () => {
      expect(RateLimit.isAllowed('test-key', 5, 60000)).toBe(true);
      expect(RateLimit.isAllowed('test-key', 5, 60000)).toBe(true);
      expect(RateLimit.getAttempts('test-key')).toBe(2);
    });

    it('should block requests exceeding limit', () => {
      // Make 5 requests (should all be allowed)
      for (let i = 0; i < 5; i++) {
        expect(RateLimit.isAllowed('test-key', 5, 60000)).toBe(true);
      }
      
      // 6th request should be blocked
      expect(RateLimit.isAllowed('test-key', 5, 60000)).toBe(false);
      expect(RateLimit.getAttempts('test-key')).toBe(5);
    });

    it('should reset attempts after time window', async () => {
      // Use very short window for testing
      expect(RateLimit.isAllowed('test-key', 1, 1)).toBe(true);
      expect(RateLimit.isAllowed('test-key', 1, 1)).toBe(false);
      
      // Wait for window to pass
      await new Promise(resolve => setTimeout(resolve, 2));
      expect(RateLimit.isAllowed('test-key', 1, 1)).toBe(true);
    });

    it('should manually reset attempts', () => {
      RateLimit.isAllowed('test-key', 5, 60000);
      expect(RateLimit.getAttempts('test-key')).toBe(1);
      
      RateLimit.reset('test-key');
      expect(RateLimit.getAttempts('test-key')).toBe(0);
    });
  });

  describe('SecureStorage', () => {
    it('should store and retrieve items securely', () => {
      const testData = { username: 'test', preferences: { theme: 'dark' } };
      
      SecureStorage.setItem('test-key', testData);
      const retrieved = SecureStorage.getItem('test-key');
      
      expect(retrieved).toEqual(testData);
    });

    it('should return null for non-existent items', () => {
      expect(SecureStorage.getItem('non-existent')).toBeNull();
    });

    it('should remove items', () => {
      SecureStorage.setItem('test-key', 'test-value');
      expect(SecureStorage.getItem('test-key')).toBe('test-value');
      
      SecureStorage.removeItem('test-key');
      expect(SecureStorage.getItem('test-key')).toBeNull();
    });

    it('should clear all secure items', () => {
      SecureStorage.setItem('key1', 'value1');
      SecureStorage.setItem('key2', 'value2');
      localStorage.setItem('regular-key', 'regular-value');
      
      SecureStorage.clear();
      
      expect(SecureStorage.getItem('key1')).toBeNull();
      expect(SecureStorage.getItem('key2')).toBeNull();
      expect(localStorage.getItem('regular-key')).toBe('regular-value');
    });

    it('should handle storage errors gracefully', () => {
      // Mock localStorage to throw error
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = vi.fn(() => {
        throw new Error('Storage full');
      });

      expect(() => SecureStorage.setItem('test', 'value')).toThrow('Storage full');
      
      localStorage.setItem = originalSetItem;
    });
  });

  describe('CSRFProtection', () => {
    beforeEach(() => {
      CSRFProtection.reset();
      global.fetch = vi.fn();
    });

    it('should get CSRF token', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({ token: 'csrf-token-123' }),
      });

      const token = await CSRFProtection.getToken();
      expect(token).toBe('csrf-token-123');
      
      // Should cache the token
      const cachedToken = await CSRFProtection.getToken();
      expect(cachedToken).toBe('csrf-token-123');
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should add token to headers', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        json: () => Promise.resolve({ token: 'csrf-token-123' }),
      });

      const headers = await CSRFProtection.addTokenToHeaders({ 'Content-Type': 'application/json' });
      
      expect(headers).toEqual({
        'Content-Type': 'application/json',
        'X-CSRF-Token': 'csrf-token-123',
      });
    });

    it('should handle token fetch failure', async () => {
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      await expect(CSRFProtection.getToken()).rejects.toThrow('Network error');
    });
  });

  describe('SecurityMonitor', () => {
    beforeEach(() => {
      // Clear internal state
      (SecurityMonitor as any).suspiciousActivities = [];
    });

    it('should report suspicious activity', () => {
      SecurityMonitor.reportSuspiciousActivity('failed_login', { ip: '192.168.1.1' });
      
      const activities = SecurityMonitor.getRecentActivities();
      expect(activities).toHaveLength(1);
      expect(activities[0].type).toBe('failed_login');
      expect(activities[0].details.ip).toBe('192.168.1.1');
    });

    it('should limit stored activities', () => {
      // Add more than 100 activities
      for (let i = 0; i < 150; i++) {
        SecurityMonitor.reportSuspiciousActivity('test_activity', { index: i });
      }
      
      const activities = SecurityMonitor.getRecentActivities();
      expect(activities.length).toBeLessThanOrEqual(20); // Only returns last 20
    });

    it('should trigger security alert on multiple activities', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      
      // Trigger multiple activities quickly
      for (let i = 0; i < 6; i++) {
        SecurityMonitor.reportSuspiciousActivity('rapid_activity', { index: i });
      }
      
      // Should have triggered security alert
      expect(consoleSpy).toHaveBeenCalled();
      
      consoleSpy.mockRestore();
    });
  });

  describe('EnvironmentValidator', () => {
    it('should validate secure context', () => {
      // Mock HTTPS context
      Object.defineProperty(window, 'location', {
        value: { protocol: 'https:', hostname: 'example.com' },
        writable: true,
      });

      expect(EnvironmentValidator.validateSecureContext()).toBe(true);
    });

    it('should detect insecure context', () => {
      // Mock HTTP context
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'example.com' },
        writable: true,
      });

      expect(EnvironmentValidator.validateSecureContext()).toBe(false);
    });

    it('should allow localhost in insecure context', () => {
      Object.defineProperty(window, 'location', {
        value: { protocol: 'http:', hostname: 'localhost' },
        writable: true,
      });

      expect(EnvironmentValidator.validateSecureContext()).toBe(true);
    });

    it('should check browser security features', () => {
      const security = EnvironmentValidator.checkBrowserSecurity();
      
      expect(security).toHaveProperty('cookiesEnabled');
      expect(security).toHaveProperty('localStorageEnabled');
      expect(security).toHaveProperty('cryptoAvailable');
      expect(security).toHaveProperty('webAuthNAvailable');
    });
  });
});