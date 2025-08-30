'use client';

import React, { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { useBreakpoint, responsiveClasses } from '@/lib/responsive';

interface ResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  container?: boolean;
  fluid?: boolean;
}

export function ResponsiveWrapper({
  children,
  className,
  as: Component = 'div',
  container = false,
  fluid = false,
}: ResponsiveWrapperProps) {
  const { isMobile, isTablet } = useBreakpoint();
  
  const containerClass = container
    ? fluid
      ? responsiveClasses.containerFluid
      : responsiveClasses.container
    : '';

  return React.createElement(
    Component,
    {
      className: cn(
        containerClass,
        className,
        {
          'touch-manipulation': isMobile || isTablet,
        }
      ),
    },
    children
  );
}

interface ResponsiveGridProps {
  children: ReactNode;
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 'auto';
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function ResponsiveGrid({
  children,
  cols = 'auto',
  gap = 'md',
  className,
}: ResponsiveGridProps) {
  const getGridClass = () => {
    if (cols === 'auto') {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
    }
    return responsiveClasses.grid[`cols${cols}` as keyof typeof responsiveClasses.grid];
  };

  const gapClasses = {
    sm: 'gap-2 sm:gap-3 lg:gap-4',
    md: 'gap-4 sm:gap-6 lg:gap-8',
    lg: 'gap-6 sm:gap-8 lg:gap-10',
  };

  return (
    <div className={cn(getGridClass(), gapClasses[gap], className)}>
      {children}
    </div>
  );
}

interface ResponsiveTextProps {
  children: ReactNode;
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'small';
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

export function ResponsiveText({
  children,
  variant = 'body',
  className,
  as,
}: ResponsiveTextProps) {
  const defaultTags = {
    h1: 'h1',
    h2: 'h2',
    h3: 'h3',
    body: 'p',
    small: 'span',
  };

  const Component = as || defaultTags[variant] || 'div';

  return React.createElement(
    Component,
    {
      className: cn(responsiveClasses.text[variant], className),
    },
    children
  );
}

interface ResponsiveButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'icon';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export function ResponsiveButton({
  children,
  onClick,
  variant = 'default',
  className,
  disabled = false,
  type = 'button',
}: ResponsiveButtonProps) {
  const { isMobile } = useBreakpoint();
  
  const buttonClass = variant === 'icon'
    ? responsiveClasses.button.icon
    : responsiveClasses.button.base;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        buttonClass,
        'transition-all duration-200',
        {
          'active:scale-95': isMobile && !disabled,
          'hover:scale-105': !isMobile && !disabled,
          'opacity-50 cursor-not-allowed': disabled,
        },
        className
      )}
    >
      {children}
    </button>
  );
}

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  fill?: boolean;
  sizes?: string;
}

export function ResponsiveImage({
  src,
  alt,
  className,
  priority = false,
  fill = false,
  sizes,
}: ResponsiveImageProps) {
  const { deviceType } = useBreakpoint();
  
  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || 
    '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw';

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      sizes={responsiveSizes}
      className={cn(
        'w-full h-auto object-cover',
        {
          'absolute inset-0': fill,
        },
        className
      )}
    />
  );
}

interface ResponsiveCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  interactive?: boolean;
}

export function ResponsiveCard({
  children,
  className,
  onClick,
  interactive = false,
}: ResponsiveCardProps) {
  const { isMobile } = useBreakpoint();

  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white dark:bg-gray-800 rounded-lg shadow-md',
        responsiveClasses.spacing.card,
        {
          'cursor-pointer transition-all duration-200': interactive,
          'active:scale-98': interactive && isMobile,
          'hover:shadow-lg hover:scale-102': interactive && !isMobile,
        },
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
}

export function ResponsiveModal({
  isOpen,
  onClose,
  children,
  title,
  className,
}: ResponsiveModalProps) {
  const { isMobile } = useBreakpoint();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className={cn(
          'relative bg-white dark:bg-gray-800 w-full',
          {
            'rounded-t-2xl sm:rounded-2xl': true,
            'max-h-[90vh] sm:max-h-[80vh]': true,
            'sm:max-w-lg sm:mx-4': !isMobile,
          },
          className
        )}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b">
            <ResponsiveText variant="h3">{title}</ResponsiveText>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        
        {/* Content */}
        <div className={cn(
          'overflow-y-auto',
          responsiveClasses.spacing.card
        )}>
          {children}
        </div>
      </div>
    </div>
  );
}

interface ResponsiveTableProps {
  headers: string[];
  data: any[][];
  className?: string;
}

export function ResponsiveTable({
  headers,
  data,
  className,
}: ResponsiveTableProps) {
  const { isMobile } = useBreakpoint();

  if (isMobile) {
    // Card view for mobile
    return (
      <div className={cn('space-y-4', className)}>
        {data.map((row, rowIndex) => (
          <ResponsiveCard key={rowIndex}>
            {headers.map((header, colIndex) => (
              <div key={colIndex} className="flex justify-between py-2">
                <span className="font-medium text-gray-600 dark:text-gray-400">
                  {header}:
                </span>
                <span className="text-right">{row[colIndex]}</span>
              </div>
            ))}
          </ResponsiveCard>
        ))}
      </div>
    );
  }

  // Table view for larger screens
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="border-b">
            {headers.map((header, index) => (
              <th key={index} className="text-left p-4">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr key={rowIndex} className="border-b hover:bg-gray-50 dark:hover:bg-gray-800">
              {row.map((cell, colIndex) => (
                <td key={colIndex} className="p-4">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Export all components
export default {
  ResponsiveWrapper,
  ResponsiveGrid,
  ResponsiveText,
  ResponsiveButton,
  ResponsiveImage,
  ResponsiveCard,
  ResponsiveModal,
  ResponsiveTable,
};