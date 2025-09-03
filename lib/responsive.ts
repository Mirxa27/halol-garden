/**
 * Responsive Design Utilities
 * Mobile-first responsive system with comprehensive breakpoints
 */

export const breakpoints = {
  xs: 320,    // Small phones
  sm: 640,    // Large phones
  md: 768,    // Tablets
  lg: 1024,   // Small laptops
  xl: 1280,   // Desktops
  '2xl': 1536 // Large screens
} as const;

export const mediaQueries = {
  xs: `(min-width: ${breakpoints.xs}px)`,
  sm: `(min-width: ${breakpoints.sm}px)`,
  md: `(min-width: ${breakpoints.md}px)`,
  lg: `(min-width: ${breakpoints.lg}px)`,
  xl: `(min-width: ${breakpoints.xl}px)`,
  '2xl': `(min-width: ${breakpoints['2xl']}px)`,
  
  // Range queries
  mobile: `(max-width: ${breakpoints.md - 1}px)`,
  tablet: `(min-width: ${breakpoints.md}px) and (max-width: ${breakpoints.lg - 1}px)`,
  desktop: `(min-width: ${breakpoints.lg}px)`,
  
  // Orientation
  portrait: '(orientation: portrait)',
  landscape: '(orientation: landscape)',
  
  // High DPI
  retina: '(-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi)',
  
  // Accessibility
  reducedMotion: '(prefers-reduced-motion: reduce)',
  highContrast: '(prefers-contrast: high)',
  darkMode: '(prefers-color-scheme: dark)'
} as const;

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
} as const;

export const typography = {
  // Font sizes with line heights for optimal readability
  xs: { fontSize: '0.75rem', lineHeight: '1rem' },       // 12px/16px
  sm: { fontSize: '0.875rem', lineHeight: '1.25rem' },   // 14px/20px
  base: { fontSize: '1rem', lineHeight: '1.5rem' },      // 16px/24px
  lg: { fontSize: '1.125rem', lineHeight: '1.75rem' },   // 18px/28px
  xl: { fontSize: '1.25rem', lineHeight: '1.75rem' },    // 20px/28px
  '2xl': { fontSize: '1.5rem', lineHeight: '2rem' },     // 24px/32px
  '3xl': { fontSize: '1.875rem', lineHeight: '2.25rem' },// 30px/36px
  '4xl': { fontSize: '2.25rem', lineHeight: '2.5rem' },  // 36px/40px
  '5xl': { fontSize: '3rem', lineHeight: '1' },          // 48px
  '6xl': { fontSize: '3.75rem', lineHeight: '1' },       // 60px
} as const;

// Touch target sizes following accessibility guidelines
export const touchTargets = {
  minimum: '44px', // iOS Human Interface Guidelines
  recommended: '48px', // Material Design
  comfortable: '56px', // Larger for better UX
} as const;

// Container widths
export const containers = {
  xs: '100%',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
  full: '100%',
} as const;

// Aspect ratios for responsive media
export const aspectRatios = {
  square: '1 / 1',
  video: '16 / 9',
  ultrawide: '21 / 9',
  portrait: '3 / 4',
  landscape: '4 / 3',
} as const;

/**
 * Hook to detect current breakpoint
 */
export function useBreakpoint() {
  if (typeof window === 'undefined') return 'xs';
  
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>('xs');
  
  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      
      if (width >= breakpoints['2xl']) setBreakpoint('2xl');
      else if (width >= breakpoints.xl) setBreakpoint('xl');
      else if (width >= breakpoints.lg) setBreakpoint('lg');
      else if (width >= breakpoints.md) setBreakpoint('md');
      else if (width >= breakpoints.sm) setBreakpoint('sm');
      else setBreakpoint('xs');
    };
    
    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);
  
  return breakpoint;
}

/**
 * Hook to check if device is mobile
 */
export function useIsMobile() {
  const breakpoint = useBreakpoint();
  return ['xs', 'sm'].includes(breakpoint);
}

/**
 * Hook to check if device is tablet
 */
export function useIsTablet() {
  const breakpoint = useBreakpoint();
  return breakpoint === 'md';
}

/**
 * Hook to check media query
 */
export function useMediaQuery(query: string) {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener('change', listener);
    
    return () => media.removeEventListener('change', listener);
  }, [query]);
  
  return matches;
}

/**
 * Responsive image sizes
 */
export function getResponsiveImageSizes(type: 'hero' | 'product' | 'thumbnail' | 'avatar') {
  const sizes = {
    hero: {
      xs: { width: 320, height: 180 },
      sm: { width: 640, height: 360 },
      md: { width: 768, height: 432 },
      lg: { width: 1024, height: 576 },
      xl: { width: 1280, height: 720 },
    },
    product: {
      xs: { width: 280, height: 280 },
      sm: { width: 340, height: 340 },
      md: { width: 400, height: 400 },
      lg: { width: 500, height: 500 },
      xl: { width: 600, height: 600 },
    },
    thumbnail: {
      xs: { width: 80, height: 80 },
      sm: { width: 120, height: 120 },
      md: { width: 150, height: 150 },
      lg: { width: 200, height: 200 },
      xl: { width: 250, height: 250 },
    },
    avatar: {
      xs: { width: 32, height: 32 },
      sm: { width: 40, height: 40 },
      md: { width: 48, height: 48 },
      lg: { width: 64, height: 64 },
      xl: { width: 80, height: 80 },
    },
  };
  
  return sizes[type];
}

/**
 * Get responsive grid columns
 */
export function getResponsiveColumns(breakpoint: keyof typeof breakpoints, type: 'products' | 'categories' | 'features') {
  const columns = {
    products: {
      xs: 1,
      sm: 2,
      md: 3,
      lg: 4,
      xl: 5,
      '2xl': 6,
    },
    categories: {
      xs: 2,
      sm: 3,
      md: 4,
      lg: 6,
      xl: 6,
      '2xl': 8,
    },
    features: {
      xs: 1,
      sm: 1,
      md: 2,
      lg: 3,
      xl: 3,
      '2xl': 4,
    },
  };
  
  return columns[type][breakpoint];
}

/**
 * Responsive font scale
 */
export function getResponsiveFontSize(base: number, scale: 'mobile' | 'tablet' | 'desktop') {
  const scales = {
    mobile: 0.875,  // 87.5% of base
    tablet: 0.9375, // 93.75% of base
    desktop: 1,     // 100% of base
  };
  
  return Math.round(base * scales[scale]);
}

/**
 * Get safe area insets for mobile devices
 */
export function getSafeAreaInsets() {
  if (typeof window === 'undefined') {
    return { top: 0, right: 0, bottom: 0, left: 0 };
  }
  
  const styles = getComputedStyle(document.documentElement);
  
  return {
    top: parseInt(styles.getPropertyValue('--sat') || '0'),
    right: parseInt(styles.getPropertyValue('--sar') || '0'),
    bottom: parseInt(styles.getPropertyValue('--sab') || '0'),
    left: parseInt(styles.getPropertyValue('--sal') || '0'),
  };
}

// Import React hooks
import { useState, useEffect } from 'react';