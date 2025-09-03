'use client';

import { forwardRef, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { ariaProps } from '@/lib/accessibility';
import { Loader2 } from 'lucide-react';

interface AccessibleButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  ariaCurrent?: boolean | string;
}

export const AccessibleButton = forwardRef<HTMLButtonElement, AccessibleButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText = 'Loading...',
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      ariaLabel,
      ariaDescribedBy,
      ariaExpanded,
      ariaControls,
      ariaCurrent,
      type = 'button',
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = [
      'inline-flex items-center justify-center',
      'font-medium rounded-md transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-60 disabled:cursor-not-allowed',
      'select-none',
    ];

    // Variant styles
    const variantStyles = {
      primary: [
        'bg-blue-600 text-white',
        'hover:bg-blue-700 active:bg-blue-800',
        'focus:ring-blue-500',
        'dark:bg-blue-500 dark:hover:bg-blue-600',
      ],
      secondary: [
        'bg-gray-600 text-white',
        'hover:bg-gray-700 active:bg-gray-800',
        'focus:ring-gray-500',
        'dark:bg-gray-500 dark:hover:bg-gray-600',
      ],
      outline: [
        'border-2 border-gray-300 text-gray-700 bg-transparent',
        'hover:bg-gray-50 active:bg-gray-100',
        'focus:ring-gray-500',
        'dark:border-gray-600 dark:text-gray-300',
        'dark:hover:bg-gray-800 dark:active:bg-gray-700',
      ],
      ghost: [
        'text-gray-700 bg-transparent',
        'hover:bg-gray-100 active:bg-gray-200',
        'focus:ring-gray-500',
        'dark:text-gray-300 dark:hover:bg-gray-800',
      ],
      danger: [
        'bg-red-600 text-white',
        'hover:bg-red-700 active:bg-red-800',
        'focus:ring-red-500',
        'dark:bg-red-500 dark:hover:bg-red-600',
      ],
    };

    // Size styles with touch-friendly sizes
    const sizeStyles = {
      xs: 'px-2.5 py-1.5 text-xs min-h-[32px]',
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-2.5 text-base min-h-[44px]', // Meets touch target guidelines
      lg: 'px-6 py-3 text-lg min-h-[48px]',
      xl: 'px-8 py-4 text-xl min-h-[56px]',
    };

    // Icon size based on button size
    const iconSizes = {
      xs: 'h-3 w-3',
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
      xl: 'h-7 w-7',
    };

    // Build ARIA props
    const aria = ariaProps({
      label: ariaLabel,
      describedBy: ariaDescribedBy,
      expanded: ariaExpanded,
      controls: ariaControls,
      current: ariaCurrent,
      busy: isLoading,
      disabled: disabled || isLoading,
    });

    // Render loading state
    const loadingIcon = (
      <Loader2 
        className={cn(iconSizes[size], 'animate-spin')}
        aria-hidden="true"
      />
    );

    // Render icon
    const renderIcon = icon || (isLoading && loadingIcon);

    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || isLoading}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && 'w-full',
          className
        )}
        {...aria}
        {...props}
      >
        {/* Loading/Icon on left */}
        {renderIcon && iconPosition === 'left' && (
          <span className={cn(iconSizes[size], 'mr-2 flex-shrink-0')}>
            {isLoading ? loadingIcon : icon}
          </span>
        )}

        {/* Button text */}
        <span className="truncate">
          {isLoading && loadingText ? loadingText : children}
        </span>

        {/* Loading/Icon on right */}
        {renderIcon && iconPosition === 'right' && (
          <span className={cn(iconSizes[size], 'ml-2 flex-shrink-0')}>
            {isLoading ? loadingIcon : icon}
          </span>
        )}

        {/* Screen reader only loading announcement */}
        {isLoading && (
          <span className="sr-only" aria-live="polite">
            {loadingText}
          </span>
        )}
      </button>
    );
  }
);

AccessibleButton.displayName = 'AccessibleButton';

/**
 * Button Group for related actions
 */
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  ariaLabel: string;
}

export function ButtonGroup({
  children,
  className,
  orientation = 'horizontal',
  ariaLabel,
}: ButtonGroupProps) {
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        className
      )}
    >
      {children}
    </div>
  );
}