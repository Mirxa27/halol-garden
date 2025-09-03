'use client';

import { useState, useEffect, useRef } from 'react';
import Image, { ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

interface OptimizedImageProps extends Omit<ImageProps, 'onLoad' | 'onError'> {
  fallbackSrc?: string;
  lowQualitySrc?: string;
  aspectRatio?: number;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  lazy?: boolean;
  onLoad?: () => void;
  onError?: () => void;
  containerClassName?: string;
}

export function OptimizedImage({
  src,
  alt,
  fallbackSrc = '/images/placeholder.svg',
  lowQualitySrc,
  aspectRatio,
  objectFit = 'cover',
  lazy = true,
  onLoad,
  onError,
  className,
  containerClassName,
  priority = false,
  ...props
}: OptimizedImageProps) {
  const [imageSrc, setImageSrc] = useState(lowQualitySrc || src);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const containerRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !containerRef.current) {
      setIsInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: 0.01,
      }
    );

    observer.observe(containerRef.current);

    return () => observer.disconnect();
  }, [lazy]);

  // Load high quality image when in view
  useEffect(() => {
    if (isInView && lowQualitySrc && imageSrc === lowQualitySrc) {
      const img = new window.Image();
      img.src = src as string;
      img.onload = () => {
        setImageSrc(src);
        setIsLoading(false);
      };
      img.onerror = () => {
        setHasError(true);
        setImageSrc(fallbackSrc);
        setIsLoading(false);
      };
    }
  }, [isInView, src, lowQualitySrc, imageSrc, fallbackSrc]);

  const handleLoad = () => {
    setIsLoading(false);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    setImageSrc(fallbackSrc);
    setIsLoading(false);
    onError?.();
  };

  // Generate responsive sizes based on container
  const generateSizes = () => {
    if (props.sizes) return props.sizes;
    
    // Default responsive sizes
    return '(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw';
  };

  // Calculate dimensions for aspect ratio
  const containerStyle = aspectRatio
    ? { paddingBottom: `${(1 / aspectRatio) * 100}%` }
    : undefined;

  if (!isInView && lazy) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'relative overflow-hidden bg-gray-100 dark:bg-gray-800',
          containerClassName
        )}
        style={containerStyle}
      >
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'relative overflow-hidden',
        isLoading && 'bg-gray-100 dark:bg-gray-800',
        containerClassName
      )}
      style={containerStyle}
    >
      <Image
        {...props}
        src={imageSrc}
        alt={alt}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        style={{
          objectFit: objectFit,
          ...props.style,
        }}
        sizes={generateSizes()}
        priority={priority}
        onLoad={handleLoad}
        onError={handleError}
        quality={props.quality || 85}
      />
      
      {/* Loading skeleton */}
      {isLoading && (
        <div className="absolute inset-0 animate-pulse bg-gray-200 dark:bg-gray-700" />
      )}
      
      {/* Low quality placeholder blur */}
      {isLoading && lowQualitySrc && (
        <Image
          src={lowQualitySrc}
          alt=""
          fill
          className="absolute inset-0 scale-110 blur-xl"
          style={{ objectFit: objectFit }}
          quality={20}
          priority
        />
      )}
    </div>
  );
}

/**
 * Optimized background image component
 */
interface OptimizedBackgroundImageProps {
  src: string;
  alt?: string;
  className?: string;
  children?: React.ReactNode;
  overlay?: boolean;
  overlayOpacity?: number;
  parallax?: boolean;
}

export function OptimizedBackgroundImage({
  src,
  alt = '',
  className,
  children,
  overlay = false,
  overlayOpacity = 0.5,
  parallax = false,
}: OptimizedBackgroundImageProps) {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (!parallax) return;

    const handleScroll = () => {
      const scrolled = window.scrollY;
      setOffset(scrolled * 0.5);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [parallax]);

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className="absolute inset-0"
        style={{
          transform: parallax ? `translateY(${offset}px)` : undefined,
        }}
      >
        <OptimizedImage
          src={src}
          alt={alt}
          fill
          priority
          objectFit="cover"
          quality={90}
        />
      </div>
      
      {overlay && (
        <div
          className="absolute inset-0 bg-black"
          style={{ opacity: overlayOpacity }}
        />
      )}
      
      {children && (
        <div className="relative z-10">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * Generate optimized image URLs with transformations
 */
export function getOptimizedImageUrl(
  src: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'auto';
  }
): string {
  // If using a CDN that supports transformations (e.g., Cloudinary, Imgix)
  // implement URL transformations here
  
  // For Next.js Image Optimization API
  if (src.startsWith('/') || src.startsWith('http')) {
    const params = new URLSearchParams();
    
    if (options?.width) params.set('w', options.width.toString());
    if (options?.height) params.set('h', options.height.toString());
    if (options?.quality) params.set('q', options.quality.toString());
    
    const queryString = params.toString();
    return queryString ? `${src}?${queryString}` : src;
  }
  
  return src;
}

/**
 * Preload critical images
 */
export function preloadImage(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Batch preload images
 */
export async function preloadImages(srcs: string[]): Promise<void> {
  await Promise.all(srcs.map(src => preloadImage(src).catch(() => {})));
}