'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useIsMobile } from '@/lib/responsive';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ResponsiveFormFieldProps {
  label: string;
  error?: string;
  success?: boolean;
  required?: boolean;
  children: ReactNode;
  className?: string;
  description?: string;
}

export function ResponsiveFormField({
  label,
  error,
  success,
  required,
  children,
  className,
  description,
}: ResponsiveFormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className="text-sm font-medium flex items-center gap-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {description && !error && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <div className="flex items-center gap-1 text-xs text-red-600">
          <AlertCircle className="h-3 w-3" />
          <span>{error}</span>
        </div>
      )}
      {success && !error && (
        <div className="flex items-center gap-1 text-xs text-green-600">
          <CheckCircle className="h-3 w-3" />
          <span>Valid</span>
        </div>
      )}
    </div>
  );
}

interface ResponsiveInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  description?: string;
}

export function ResponsiveInput({
  label,
  error,
  success,
  description,
  required,
  className,
  ...props
}: ResponsiveInputProps) {
  const isMobile = useIsMobile();
  
  const input = (
    <Input
      className={cn(
        'w-full',
        error && 'border-red-500 focus:ring-red-500',
        success && 'border-green-500 focus:ring-green-500',
        isMobile && 'text-base', // Prevent zoom on iOS
        className
      )}
      {...props}
    />
  );

  if (label) {
    return (
      <ResponsiveFormField
        label={label}
        error={error}
        success={success}
        required={required}
        description={description}
      >
        {input}
      </ResponsiveFormField>
    );
  }

  return input;
}

interface ResponsiveTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: boolean;
  description?: string;
}

export function ResponsiveTextarea({
  label,
  error,
  success,
  description,
  required,
  className,
  ...props
}: ResponsiveTextareaProps) {
  const isMobile = useIsMobile();
  
  const textarea = (
    <Textarea
      className={cn(
        'w-full min-h-[100px] resize-y',
        error && 'border-red-500 focus:ring-red-500',
        success && 'border-green-500 focus:ring-green-500',
        isMobile && 'text-base', // Prevent zoom on iOS
        className
      )}
      {...props}
    />
  );

  if (label) {
    return (
      <ResponsiveFormField
        label={label}
        error={error}
        success={success}
        required={required}
        description={description}
      >
        {textarea}
      </ResponsiveFormField>
    );
  }

  return textarea;
}

interface ResponsiveFormGridProps {
  children: ReactNode;
  columns?: {
    mobile?: number;
    tablet?: number;
    desktop?: number;
  };
  className?: string;
}

export function ResponsiveFormGrid({
  children,
  columns = {
    mobile: 1,
    tablet: 2,
    desktop: 2,
  },
  className,
}: ResponsiveFormGridProps) {
  return (
    <div
      className={cn(
        'grid gap-4',
        columns.mobile === 1 && 'grid-cols-1',
        columns.mobile === 2 && 'grid-cols-2',
        columns.tablet === 2 && 'sm:grid-cols-2',
        columns.tablet === 3 && 'sm:grid-cols-3',
        columns.desktop === 2 && 'lg:grid-cols-2',
        columns.desktop === 3 && 'lg:grid-cols-3',
        columns.desktop === 4 && 'lg:grid-cols-4',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveFormActionsProps {
  children: ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right' | 'between';
  stack?: boolean;
}

export function ResponsiveFormActions({
  children,
  className,
  align = 'right',
  stack = false,
}: ResponsiveFormActionsProps) {
  const isMobile = useIsMobile();
  
  return (
    <div
      className={cn(
        'flex gap-3 mt-6',
        stack || isMobile ? 'flex-col' : 'flex-row',
        align === 'left' && 'justify-start',
        align === 'center' && 'justify-center',
        align === 'right' && 'justify-end',
        align === 'between' && 'justify-between',
        className
      )}
    >
      {children}
    </div>
  );
}

interface ResponsiveButtonProps extends React.ComponentProps<typeof Button> {
  fullWidthOnMobile?: boolean;
}

export function ResponsiveButton({
  fullWidthOnMobile = true,
  className,
  size,
  ...props
}: ResponsiveButtonProps) {
  const isMobile = useIsMobile();
  
  return (
    <Button
      size={size || (isMobile ? 'default' : 'default')}
      className={cn(
        fullWidthOnMobile && isMobile && 'w-full',
        className
      )}
      {...props}
    />
  );
}