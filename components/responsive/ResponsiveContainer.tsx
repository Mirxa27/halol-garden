'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { containers } from '@/lib/responsive';

interface ResponsiveContainerProps {
  children: ReactNode;
  className?: string;
  maxWidth?: keyof typeof containers;
  padding?: boolean;
  fullWidth?: boolean;
}

export function ResponsiveContainer({
  children,
  className,
  maxWidth = 'xl',
  padding = true,
  fullWidth = false,
}: ResponsiveContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full',
        padding && 'px-4 sm:px-6 lg:px-8',
        !fullWidth && 'max-w-screen-2xl',
        className
      )}
      style={{
        maxWidth: fullWidth ? '100%' : containers[maxWidth],
      }}
    >
      {children}
    </div>
  );
}