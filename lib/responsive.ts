/**
 * Mobile-First Responsive Design Utilities
 * Ensuring perfect responsiveness across all devices
 */

import { useEffect, useState } from 'react';

// Breakpoint definitions (mobile-first)
export const breakpoints = {
  xs: 0,     // Extra small devices (phones < 576px)
  sm: 576,   // Small devices (landscape phones >= 576px)
  md: 768,   // Medium devices (tablets >= 768px)
  lg: 992,   // Large devices (desktops >= 992px)
  xl: 1200,  // Extra large devices (large desktops >= 1200px)
  xxl: 1400, // Extra extra large devices (larger desktops >= 1400px)
} as const;

// Device type detection
export const getDeviceType = (): 'mobile' | 'tablet' | 'desktop' => {
  if (typeof window === 'undefined') return 'desktop';
  
  const width = window.innerWidth;
  if (width < breakpoints.sm) return 'mobile';
  if (width < breakpoints.lg) return 'tablet';
  return 'desktop';
};

// Check if device is touch-enabled
export const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    (navigator as any).msMaxTouchPoints > 0
  );
};

// Custom hook for responsive breakpoints
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = useState<keyof typeof breakpoints>('lg');
  const [deviceType, setDeviceType] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      
      // Determine current breakpoint
      if (width < breakpoints.sm) {
        setBreakpoint('xs');
        setDeviceType('mobile');
      } else if (width < breakpoints.md) {
        setBreakpoint('sm');
        setDeviceType('mobile');
      } else if (width < breakpoints.lg) {
        setBreakpoint('md');
        setDeviceType('tablet');
      } else if (width < breakpoints.xl) {
        setBreakpoint('lg');
        setDeviceType('desktop');
      } else if (width < breakpoints.xxl) {
        setBreakpoint('xl');
        setDeviceType('desktop');
      } else {
        setBreakpoint('xxl');
        setDeviceType('desktop');
      }
    };

    // Initial check
    handleResize();

    // Add event listener with debounce
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedResize);
    };
  }, []);

  return {
    breakpoint,
    deviceType,
    isMobile: deviceType === 'mobile',
    isTablet: deviceType === 'tablet',
    isDesktop: deviceType === 'desktop',
    isTouch: isTouchDevice(),
  };
};

// Custom hook for media queries
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // Initial check
    setMatches(mediaQuery.matches);

    // Listen for changes
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    // Legacy browsers
    else {
      mediaQuery.addListener(handler);
      return () => mediaQuery.removeListener(handler);
    }
  }, [query]);

  return matches;
};

// Responsive utility classes
export const responsiveClasses = {
  // Container classes
  container: 'w-full mx-auto px-4 sm:px-6 lg:px-8 max-w-7xl',
  containerFluid: 'w-full px-4 sm:px-6 lg:px-8',
  
  // Grid classes
  grid: {
    cols1: 'grid grid-cols-1',
    cols2: 'grid grid-cols-1 sm:grid-cols-2',
    cols3: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    cols4: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
    cols5: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    cols6: 'grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6',
  },
  
  // Spacing classes
  spacing: {
    section: 'py-8 sm:py-12 lg:py-16',
    card: 'p-4 sm:p-6 lg:p-8',
    gap: 'gap-4 sm:gap-6 lg:gap-8',
  },
  
  // Text classes
  text: {
    h1: 'text-2xl sm:text-3xl lg:text-4xl xl:text-5xl font-bold',
    h2: 'text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-semibold',
    h3: 'text-lg sm:text-xl lg:text-2xl font-semibold',
    body: 'text-sm sm:text-base lg:text-lg',
    small: 'text-xs sm:text-sm',
  },
  
  // Button classes
  button: {
    base: 'px-4 py-2 sm:px-6 sm:py-3 text-sm sm:text-base touch-manipulation',
    icon: 'p-2 sm:p-3',
  },
  
  // Display classes
  display: {
    hiddenMobile: 'hidden sm:block',
    hiddenTablet: 'hidden lg:block',
    mobileOnly: 'block sm:hidden',
    tabletOnly: 'hidden sm:block lg:hidden',
    desktopOnly: 'hidden lg:block',
  },
  
  // Flex classes
  flex: {
    responsive: 'flex flex-col sm:flex-row',
    reverseResponsive: 'flex flex-col-reverse sm:flex-row',
    center: 'flex items-center justify-center',
    between: 'flex items-center justify-between',
  },
};

// Touch-friendly sizes
export const touchSizes = {
  minTarget: 44, // Minimum touch target size (44x44 px as per guidelines)
  spacing: 8,     // Minimum spacing between touch targets
};

// Responsive image component props
export interface ResponsiveImageProps {
  src: string;
  alt: string;
  sizes?: {
    mobile?: string;
    tablet?: string;
    desktop?: string;
  };
  className?: string;
}

// Get responsive image src
export const getResponsiveImageSrc = (
  baseSrc: string,
  deviceType: 'mobile' | 'tablet' | 'desktop'
): string => {
  // You can implement CDN-based image resizing here
  const widths = {
    mobile: 640,
    tablet: 1024,
    desktop: 1920,
  };
  
  // Example with Cloudinary or similar service
  // return `${baseSrc}?w=${widths[deviceType]}&q=auto&f=auto`;
  
  return baseSrc;
};

// Viewport utilities
export const viewport = {
  // Get viewport dimensions
  getDimensions: () => {
    if (typeof window === 'undefined') {
      return { width: 1920, height: 1080 };
    }
    return {
      width: window.innerWidth,
      height: window.innerHeight,
    };
  },
  
  // Check if element is in viewport
  isInViewport: (element: HTMLElement): boolean => {
    const rect = element.getBoundingClientRect();
    return (
      rect.top >= 0 &&
      rect.left >= 0 &&
      rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
      rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
  },
  
  // Get safe area insets (for devices with notches)
  getSafeAreaInsets: () => {
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
  },
};

// Performance utilities for mobile
export const mobilePerformance = {
  // Defer non-critical resources
  deferLoad: (callback: () => void) => {
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(callback);
    } else {
      setTimeout(callback, 1);
    }
  },
  
  // Lazy load images
  lazyLoadImage: (imageSrc: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageSrc;
    });
  },
  
  // Reduce motion for accessibility
  prefersReducedMotion: (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },
};

// Export all utilities
export default {
  breakpoints,
  getDeviceType,
  isTouchDevice,
  useBreakpoint,
  useMediaQuery,
  responsiveClasses,
  touchSizes,
  getResponsiveImageSrc,
  viewport,
  mobilePerformance,
};