import React from 'react';
import { cn } from '@/lib/utils';

// Light Blue Glassmorphic Design System Components

// Enhanced Glass Container
interface GlassContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'card' | 'nav' | 'modal' | 'intense';
  blur?: 'sm' | 'md' | 'lg' | 'xl';
  opacity?: 'light' | 'medium' | 'heavy';
  border?: boolean;
  glow?: boolean;
  children: React.ReactNode;
}

export function GlassContainer({ 
  variant = 'default',
  blur = 'md',
  opacity = 'medium',
  border = true,
  glow = false,
  className,
  children,
  ...props 
}: GlassContainerProps) {
  const baseClasses = "relative overflow-hidden";
  
  const variantClasses = {
    default: "glass",
    card: "glass-card",
    nav: "glass-nav",
    modal: "glass-intense",
    intense: "glass-intense"
  };

  const blurClasses = {
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl"
  };

  const opacityClasses = {
    light: "bg-white/10",
    medium: "bg-white/20",
    heavy: "bg-white/30"
  };

  const borderClasses = border ? "border border-white/25" : "";
  const glowClasses = glow ? "shadow-2xl shadow-primary/20" : "";

  return (
    <div 
      className={cn(
        baseClasses,
        variantClasses[variant],
        blurClasses[blur],
        opacityClasses[opacity],
        borderClasses,
        glowClasses,
        className
      )}
      {...props}
    >
      {children}
      {/* Light blue glassmorphic gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-400/5 via-cyan-300/3 to-sky-500/5 pointer-events-none rounded-inherit" />
    </div>
  );
}

// Enhanced Button with glassmorphic effects
interface GlassButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'glass';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  glow?: boolean;
  ripple?: boolean;
  children: React.ReactNode;
}

export function GlassButton({ 
  variant = 'primary',
  size = 'md',
  glow = false,
  ripple = true,
  className,
  children,
  ...props 
}: GlassButtonProps) {
  const baseClasses = "relative inline-flex items-center justify-center font-medium rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 active:scale-95";

  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:shadow-xl hover:from-blue-600 hover:to-cyan-600",
    secondary: "glass-card text-primary hover:bg-white/10",
    ghost: "hover:bg-white/10 text-primary",
    outline: "border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50",
    glass: "glass text-primary hover:bg-white/5"
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
    xl: "px-8 py-4 text-xl"
  };

  const glowClasses = glow ? "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35" : "";

  return (
    <button 
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        glowClasses,
        className
      )}
      {...props}
    >
      {children}
      {/* Ripple effect overlay */}
      {ripple && (
        <div className="absolute inset-0 rounded-inherit overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        </div>
      )}
    </button>
  );
}

// Enhanced Card with light blue glassmorphic design
interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
}

export function GlassCard({ 
  hover = true,
  glow = false,
  padding = 'md',
  className,
  children,
  ...props 
}: GlassCardProps) {
  const baseClasses = "glass-card rounded-2xl transition-all duration-300";
  
  const hoverClasses = hover ? "hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/10" : "";
  const glowClasses = glow ? "shadow-xl shadow-primary/15" : "";
  
  const paddingClasses = {
    none: "",
    sm: "p-3",
    md: "p-6",
    lg: "p-8",
    xl: "p-12"
  };

  return (
    <div 
      className={cn(
        baseClasses,
        hoverClasses,
        glowClasses,
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

// Light blue gradient text
interface GradientTextProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'secondary' | 'accent';
  children: React.ReactNode;
}

export function GradientText({ 
  variant = 'primary',
  className,
  children,
  ...props 
}: GradientTextProps) {
  const variantClasses = {
    primary: "bg-gradient-to-r from-blue-600 via-cyan-500 to-sky-500",
    secondary: "bg-gradient-to-r from-cyan-500 via-blue-400 to-indigo-500",
    accent: "bg-gradient-to-r from-sky-400 via-cyan-400 to-blue-500"
  };

  return (
    <span 
      className={cn(
        "bg-clip-text text-transparent font-bold",
        variantClasses[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Status indicator with glassmorphic design
interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
}

export function StatusIndicator({ 
  status,
  size = 'md',
  pulse = false 
}: StatusIndicatorProps) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  };

  const statusClasses = {
    online: "bg-gradient-to-r from-green-400 to-emerald-500",
    offline: "bg-gradient-to-r from-gray-400 to-gray-500",
    busy: "bg-gradient-to-r from-red-400 to-red-500",
    away: "bg-gradient-to-r from-yellow-400 to-orange-500"
  };

  const pulseClasses = pulse ? "animate-pulse" : "";

  return (
    <div 
      className={cn(
        "rounded-full ring-2 ring-white/30 shadow-lg",
        sizeClasses[size],
        statusClasses[status],
        pulseClasses
      )}
    />
  );
}

// Enhanced Badge with glassmorphic styling
interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  glow?: boolean;
  children: React.ReactNode;
}

export function GlassBadge({ 
  variant = 'default',
  size = 'md',
  glow = false,
  className,
  children,
  ...props 
}: GlassBadgeProps) {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-full glass border";

  const variantClasses = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-green-500/10 text-green-600 border-green-500/20",
    warning: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
    error: "bg-red-500/10 text-red-600 border-red-500/20",
    info: "bg-blue-500/10 text-blue-600 border-blue-500/20"
  };

  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base"
  };

  const glowClasses = glow ? "shadow-lg shadow-current/25" : "";

  return (
    <span 
      className={cn(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        glowClasses,
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

// Progress bar with glassmorphic design
interface GlassProgressProps {
  value: number;
  max?: number;
  variant?: 'primary' | 'success' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  label?: string;
}

export function GlassProgress({ 
  value,
  max = 100,
  variant = 'primary',
  size = 'md',
  animated = false,
  label
}: GlassProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);

  const sizeClasses = {
    sm: "h-2",
    md: "h-3",
    lg: "h-4"
  };

  const variantClasses = {
    primary: "from-blue-500 to-cyan-500",
    success: "from-green-500 to-emerald-500",
    warning: "from-yellow-500 to-orange-500",
    error: "from-red-500 to-red-600"
  };

  const animatedClasses = animated ? "animate-pulse" : "";

  return (
    <div className="space-y-2">
      {label && (
        <div className="flex justify-between text-sm font-medium text-primary">
          <span>{label}</span>
          <span>{Math.round(percentage)}%</span>
        </div>
      )}
      <div className={cn("glass rounded-full overflow-hidden", sizeClasses[size])}>
        <div 
          className={cn(
            "h-full bg-gradient-to-r transition-all duration-500 ease-out",
            variantClasses[variant],
            animatedClasses
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Floating notification with glassmorphic design
interface FloatingNotificationProps {
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  onClose?: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function FloatingNotification({ 
  type,
  title,
  message,
  onClose,
  autoClose = true,
  duration = 5000
}: FloatingNotificationProps) {
  const [isVisible, setIsVisible] = React.useState(true);

  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose?.();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [autoClose, duration, onClose]);

  if (!isVisible) return null;

  const typeClasses = {
    info: "border-blue-500/30 bg-blue-500/10 text-blue-700",
    success: "border-green-500/30 bg-green-500/10 text-green-700",
    warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-700",
    error: "border-red-500/30 bg-red-500/10 text-red-700"
  };

  return (
    <div className={cn(
      "glass-card p-4 max-w-sm border rounded-xl shadow-xl",
      typeClasses[type]
    )}>
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-semibold text-arabic mb-1">{title}</h4>
          <p className="text-sm opacity-90 text-arabic">{message}</p>
        </div>
        {onClose && (
          <button 
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className="text-current hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

// Export all design system components
export const DesignSystem = {
  GlassContainer,
  GlassButton,
  GlassCard,
  GradientText,
  StatusIndicator,
  GlassBadge,
  GlassProgress,
  FloatingNotification
};

export default DesignSystem;