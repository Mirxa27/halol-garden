/**
 * Accessibility (a11y) Utilities
 * WCAG 2.1 AA/AAA Compliance Helpers
 */

import { useEffect, useState, useRef, useCallback } from 'react';

/**
 * ARIA live region announcer
 */
class AriaAnnouncer {
  private container: HTMLElement | null = null;

  constructor() {
    if (typeof document !== 'undefined') {
      this.createContainer();
    }
  }

  private createContainer() {
    this.container = document.createElement('div');
    this.container.setAttribute('aria-live', 'polite');
    this.container.setAttribute('aria-atomic', 'true');
    this.container.style.position = 'absolute';
    this.container.style.left = '-10000px';
    this.container.style.width = '1px';
    this.container.style.height = '1px';
    this.container.style.overflow = 'hidden';
    document.body.appendChild(this.container);
  }

  announce(message: string, priority: 'polite' | 'assertive' = 'polite') {
    if (!this.container) return;
    
    this.container.setAttribute('aria-live', priority);
    this.container.textContent = message;
    
    // Clear after announcement
    setTimeout(() => {
      if (this.container) {
        this.container.textContent = '';
      }
    }, 1000);
  }

  destroy() {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container);
      this.container = null;
    }
  }
}

export const announcer = typeof document !== 'undefined' ? new AriaAnnouncer() : null;

/**
 * Focus management utilities
 */
export const focusManager = {
  /**
   * Trap focus within an element
   */
  trapFocus(element: HTMLElement) {
    const focusableElements = element.querySelectorAll(
      'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[focusableElements.length - 1] as HTMLElement;
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault();
          lastFocusable?.focus();
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault();
          firstFocusable?.focus();
        }
      }
    };
    
    element.addEventListener('keydown', handleKeyDown);
    
    return () => element.removeEventListener('keydown', handleKeyDown);
  },

  /**
   * Return focus to previous element
   */
  returnFocus(previousElement: HTMLElement | null) {
    if (previousElement && typeof previousElement.focus === 'function') {
      previousElement.focus();
    }
  },

  /**
   * Skip to main content
   */
  skipToMain() {
    const main = document.querySelector('main') || document.querySelector('[role="main"]');
    if (main) {
      (main as HTMLElement).focus();
      main.scrollIntoView();
    }
  },
};

/**
 * Keyboard navigation hook
 */
export function useKeyboardNavigation(options?: {
  onEscape?: () => void;
  onEnter?: () => void;
  onArrowUp?: () => void;
  onArrowDown?: () => void;
  onArrowLeft?: () => void;
  onArrowRight?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'Escape':
          options?.onEscape?.();
          break;
        case 'Enter':
          options?.onEnter?.();
          break;
        case 'ArrowUp':
          e.preventDefault();
          options?.onArrowUp?.();
          break;
        case 'ArrowDown':
          e.preventDefault();
          options?.onArrowDown?.();
          break;
        case 'ArrowLeft':
          options?.onArrowLeft?.();
          break;
        case 'ArrowRight':
          options?.onArrowRight?.();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}

/**
 * Focus trap hook
 */
export function useFocusTrap(isActive: boolean = true) {
  const ref = useRef<HTMLElement>(null);
  
  useEffect(() => {
    if (!isActive || !ref.current) return;
    
    const cleanup = focusManager.trapFocus(ref.current);
    return cleanup;
  }, [isActive]);
  
  return ref;
}

/**
 * ARIA live region hook
 */
export function useAriaAnnounce() {
  return useCallback((message: string, priority?: 'polite' | 'assertive') => {
    announcer?.announce(message, priority);
  }, []);
}

/**
 * Color contrast utilities
 */
export const colorContrast = {
  /**
   * Calculate relative luminance
   */
  getLuminance(color: string): number {
    // Convert hex to RGB
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    
    // Apply gamma correction
    const [rs, gs, bs] = [r, g, b].map(c => 
      c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    );
    
    // Calculate relative luminance
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  },

  /**
   * Calculate contrast ratio between two colors
   */
  getContrastRatio(color1: string, color2: string): number {
    const lum1 = this.getLuminance(color1);
    const lum2 = this.getLuminance(color2);
    
    const lighter = Math.max(lum1, lum2);
    const darker = Math.min(lum1, lum2);
    
    return (lighter + 0.05) / (darker + 0.05);
  },

  /**
   * Check if contrast meets WCAG standards
   */
  meetsWCAG(color1: string, color2: string, level: 'AA' | 'AAA' = 'AA'): boolean {
    const ratio = this.getContrastRatio(color1, color2);
    
    // WCAG 2.1 standards
    const standards = {
      AA: { normal: 4.5, large: 3 },
      AAA: { normal: 7, large: 4.5 },
    };
    
    return ratio >= standards[level].normal;
  },
};

/**
 * Screen reader utilities
 */
export const screenReader = {
  /**
   * Hide element from screen readers
   */
  hide(element: HTMLElement) {
    element.setAttribute('aria-hidden', 'true');
  },

  /**
   * Show element to screen readers
   */
  show(element: HTMLElement) {
    element.removeAttribute('aria-hidden');
  },

  /**
   * Make element screen reader only
   */
  srOnly(element: HTMLElement) {
    element.style.position = 'absolute';
    element.style.left = '-10000px';
    element.style.top = 'auto';
    element.style.width = '1px';
    element.style.height = '1px';
    element.style.overflow = 'hidden';
  },
};

/**
 * Semantic HTML helpers
 */
export const semantic = {
  /**
   * Generate heading hierarchy
   */
  getHeadingLevel(parentLevel: number = 1): string {
    const level = Math.min(parentLevel + 1, 6);
    return `h${level}`;
  },

  /**
   * Create landmark roles
   */
  landmarks: {
    main: { role: 'main', 'aria-label': 'Main content' },
    nav: { role: 'navigation', 'aria-label': 'Main navigation' },
    search: { role: 'search', 'aria-label': 'Search' },
    banner: { role: 'banner', 'aria-label': 'Site header' },
    contentinfo: { role: 'contentinfo', 'aria-label': 'Site footer' },
    complementary: { role: 'complementary', 'aria-label': 'Sidebar' },
  },
};

/**
 * Reduced motion hook
 */
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersReducedMotion;
}

/**
 * High contrast mode hook
 */
export function useHighContrast() {
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  return prefersHighContrast;
}

/**
 * Create accessible ID
 */
export function useId(prefix: string = 'id'): string {
  const [id] = useState(() => `${prefix}-${Math.random().toString(36).substr(2, 9)}`);
  return id;
}

/**
 * ARIA attributes helper
 */
export function ariaProps(props: {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  controls?: string;
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  busy?: boolean;
  live?: 'polite' | 'assertive' | 'off';
  atomic?: boolean;
  relevant?: string;
  invalid?: boolean;
  required?: boolean;
  current?: boolean | string;
}) {
  const aria: Record<string, any> = {};
  
  if (props.label) aria['aria-label'] = props.label;
  if (props.labelledBy) aria['aria-labelledby'] = props.labelledBy;
  if (props.describedBy) aria['aria-describedby'] = props.describedBy;
  if (props.controls) aria['aria-controls'] = props.controls;
  if (props.expanded !== undefined) aria['aria-expanded'] = props.expanded;
  if (props.selected !== undefined) aria['aria-selected'] = props.selected;
  if (props.checked !== undefined) aria['aria-checked'] = props.checked;
  if (props.disabled !== undefined) aria['aria-disabled'] = props.disabled;
  if (props.hidden !== undefined) aria['aria-hidden'] = props.hidden;
  if (props.busy !== undefined) aria['aria-busy'] = props.busy;
  if (props.live) aria['aria-live'] = props.live;
  if (props.atomic !== undefined) aria['aria-atomic'] = props.atomic;
  if (props.relevant) aria['aria-relevant'] = props.relevant;
  if (props.invalid !== undefined) aria['aria-invalid'] = props.invalid;
  if (props.required !== undefined) aria['aria-required'] = props.required;
  if (props.current !== undefined) aria['aria-current'] = props.current;
  
  return aria;
}

/**
 * Accessible form validation
 */
export function useFormValidation() {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const errorIdPrefix = useId('error');
  
  const setFieldError = (field: string, error: string | null) => {
    setErrors(prev => {
      if (error) {
        return { ...prev, [field]: error };
      } else {
        const { [field]: _, ...rest } = prev;
        return rest;
      }
    });
    
    // Announce error to screen readers
    if (error) {
      announcer?.announce(`Error: ${error}`, 'assertive');
    }
  };
  
  const getFieldProps = (field: string) => ({
    'aria-invalid': !!errors[field],
    'aria-describedby': errors[field] ? `${errorIdPrefix}-${field}` : undefined,
  });
  
  const getErrorProps = (field: string) => ({
    id: `${errorIdPrefix}-${field}`,
    role: 'alert',
    'aria-live': 'polite' as const,
  });
  
  return {
    errors,
    setFieldError,
    getFieldProps,
    getErrorProps,
  };
}