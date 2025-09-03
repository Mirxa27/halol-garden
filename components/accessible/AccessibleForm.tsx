'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { useId, ariaProps, useFormValidation } from '@/lib/accessibility';
import { AlertCircle, CheckCircle, Info } from 'lucide-react';

/**
 * Accessible Form Field Container
 */
interface FormFieldProps {
  children: React.ReactNode;
  className?: string;
}

export function FormField({ children, className }: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {children}
    </div>
  );
}

/**
 * Accessible Label
 */
interface LabelProps {
  htmlFor: string;
  children: React.ReactNode;
  required?: boolean;
  className?: string;
}

export function Label({ htmlFor, children, required, className }: LabelProps) {
  return (
    <label
      htmlFor={htmlFor}
      className={cn(
        'block text-sm font-medium text-gray-700 dark:text-gray-300',
        className
      )}
    >
      {children}
      {required && (
        <span className="ml-1 text-red-500" aria-label="required">
          *
        </span>
      )}
    </label>
  );
}

/**
 * Accessible Input
 */
interface AccessibleInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  success?: boolean;
  hint?: string;
  icon?: React.ReactNode;
  showLabel?: boolean;
}

export const AccessibleInput = forwardRef<HTMLInputElement, AccessibleInputProps>(
  (
    {
      label,
      error,
      success,
      hint,
      icon,
      showLabel = true,
      required,
      className,
      id: providedId,
      type = 'text',
      ...props
    },
    ref
  ) => {
    const id = providedId || useId('input');
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    const inputStyles = cn(
      'block w-full rounded-md border px-3 py-2',
      'text-gray-900 dark:text-white',
      'placeholder-gray-400 dark:placeholder-gray-500',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      // Error state
      error && [
        'border-red-300 dark:border-red-600',
        'focus:border-red-500 focus:ring-red-500',
      ],
      // Success state
      success && !error && [
        'border-green-300 dark:border-green-600',
        'focus:border-green-500 focus:ring-green-500',
      ],
      // Default state
      !error && !success && [
        'border-gray-300 dark:border-gray-600',
        'focus:border-blue-500 focus:ring-blue-500',
      ],
      // With icon
      icon && 'pl-10',
      className
    );

    return (
      <FormField>
        {showLabel && (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        )}
        
        <div className="relative">
          {/* Icon */}
          {icon && (
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-400 dark:text-gray-500">{icon}</span>
            </div>
          )}

          {/* Input */}
          <input
            ref={ref}
            id={id}
            type={type}
            required={required}
            className={inputStyles}
            aria-label={!showLabel ? label : undefined}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          />

          {/* Status icon */}
          {(error || success) && (
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
              {error ? (
                <AlertCircle className="h-5 w-5 text-red-500" aria-hidden="true" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-500" aria-hidden="true" />
              )}
            </div>
          )}
        </div>

        {/* Hint text */}
        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">
            <Info className="inline h-3 w-3 mr-1" aria-hidden="true" />
            {hint}
          </p>
        )}

        {/* Error message */}
        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="inline h-3 w-3 mr-1" aria-hidden="true" />
            {error}
          </p>
        )}
      </FormField>
    );
  }
);

AccessibleInput.displayName = 'AccessibleInput';

/**
 * Accessible Textarea
 */
interface AccessibleTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
  hint?: string;
  showLabel?: boolean;
  resize?: 'none' | 'vertical' | 'horizontal' | 'both';
}

export const AccessibleTextarea = forwardRef<HTMLTextAreaElement, AccessibleTextareaProps>(
  (
    {
      label,
      error,
      hint,
      showLabel = true,
      required,
      className,
      id: providedId,
      resize = 'vertical',
      ...props
    },
    ref
  ) => {
    const id = providedId || useId('textarea');
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    const textareaStyles = cn(
      'block w-full rounded-md border px-3 py-2',
      'text-gray-900 dark:text-white',
      'placeholder-gray-400 dark:placeholder-gray-500',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      resize === 'none' && 'resize-none',
      resize === 'vertical' && 'resize-y',
      resize === 'horizontal' && 'resize-x',
      resize === 'both' && 'resize',
      error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      className
    );

    return (
      <FormField>
        {showLabel && (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        )}
        
        <textarea
          ref={ref}
          id={id}
          required={required}
          className={textareaStyles}
          aria-label={!showLabel ? label : undefined}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...props}
        />

        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </FormField>
    );
  }
);

AccessibleTextarea.displayName = 'AccessibleTextarea';

/**
 * Accessible Select
 */
interface AccessibleSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  error?: string;
  hint?: string;
  showLabel?: boolean;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  placeholder?: string;
}

export const AccessibleSelect = forwardRef<HTMLSelectElement, AccessibleSelectProps>(
  (
    {
      label,
      error,
      hint,
      showLabel = true,
      required,
      className,
      id: providedId,
      options,
      placeholder = 'Select an option',
      ...props
    },
    ref
  ) => {
    const id = providedId || useId('select');
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    const selectStyles = cn(
      'block w-full rounded-md border px-3 py-2',
      'text-gray-900 dark:text-white',
      'bg-white dark:bg-gray-800',
      'transition-colors duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      error
        ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
        : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500',
      className
    );

    return (
      <FormField>
        {showLabel && (
          <Label htmlFor={id} required={required}>
            {label}
          </Label>
        )}
        
        <select
          ref={ref}
          id={id}
          required={required}
          className={selectStyles}
          aria-label={!showLabel ? label : undefined}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>

        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">
            {hint}
          </p>
        )}

        {error && (
          <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}
      </FormField>
    );
  }
);

AccessibleSelect.displayName = 'AccessibleSelect';

/**
 * Accessible Checkbox
 */
interface AccessibleCheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const AccessibleCheckbox = forwardRef<HTMLInputElement, AccessibleCheckboxProps>(
  ({ label, error, hint, className, id: providedId, ...props }, ref) => {
    const id = providedId || useId('checkbox');
    const hintId = hint ? `${id}-hint` : undefined;
    const errorId = error ? `${id}-error` : undefined;
    
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
      <FormField className="flex items-start">
        <div className="flex h-5 items-center">
          <input
            ref={ref}
            id={id}
            type="checkbox"
            className={cn(
              'h-4 w-4 rounded border-gray-300 text-blue-600',
              'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
              'dark:border-gray-600 dark:bg-gray-800',
              error && 'border-red-300',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={describedBy}
            {...props}
          />
        </div>
        <div className="ml-3">
          <label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {label}
          </label>
          {hint && (
            <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400">
              {hint}
            </p>
          )}
          {error && (
            <p id={errorId} role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>
      </FormField>
    );
  }
);

AccessibleCheckbox.displayName = 'AccessibleCheckbox';

/**
 * Form Group for related fields
 */
interface FormGroupProps {
  children: React.ReactNode;
  legend: string;
  className?: string;
  required?: boolean;
}

export function FormGroup({ children, legend, className, required }: FormGroupProps) {
  return (
    <fieldset className={cn('space-y-4', className)}>
      <legend className="text-base font-medium text-gray-900 dark:text-white">
        {legend}
        {required && (
          <span className="ml-1 text-red-500" aria-label="required">
            *
          </span>
        )}
      </legend>
      {children}
    </fieldset>
  );
}