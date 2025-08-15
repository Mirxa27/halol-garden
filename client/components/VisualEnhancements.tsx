import React from 'react';

// Floating particles component for enhanced visual appeal
export function FloatingParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Animated background particles */}
      <div className="absolute w-2 h-2 bg-primary/10 rounded-full animate-pulse" 
           style={{ 
             top: '20%', 
             left: '10%', 
             animationDelay: '0s',
             animationDuration: '4s' 
           }} />
      <div className="absolute w-1 h-1 bg-accent/15 rounded-full animate-pulse" 
           style={{ 
             top: '60%', 
             left: '80%', 
             animationDelay: '1s',
             animationDuration: '3s' 
           }} />
      <div className="absolute w-3 h-3 bg-success/8 rounded-full animate-pulse" 
           style={{ 
             top: '40%', 
             left: '70%', 
             animationDelay: '2s',
             animationDuration: '5s' 
           }} />
      <div className="absolute w-1.5 h-1.5 bg-primary/12 rounded-full animate-pulse" 
           style={{ 
             top: '80%', 
             left: '20%', 
             animationDelay: '0.5s',
             animationDuration: '3.5s' 
           }} />
      <div className="absolute w-2 h-2 bg-accent/10 rounded-full animate-pulse" 
           style={{ 
             top: '30%', 
             left: '50%', 
             animationDelay: '1.5s',
             animationDuration: '4.5s' 
           }} />
    </div>
  );
}

// Enhanced glass card with premium styling
interface EnhancedGlassCardProps {
  children: React.ReactNode;
  className?: string;
  intensity?: 'light' | 'medium' | 'intense';
  hover?: boolean;
}

export function EnhancedGlassCard({ 
  children, 
  className = '', 
  intensity = 'medium',
  hover = true 
}: EnhancedGlassCardProps) {
  const intensityClass = {
    light: 'glass',
    medium: 'glass-card',
    intense: 'glass-intense'
  }[intensity];

  const hoverClass = hover ? 'glass-hover' : '';

  return (
    <div className={`${intensityClass} ${hoverClass} ${className}`}>
      {children}
    </div>
  );
}

// Animated background gradient
export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `
            radial-gradient(circle at 20% 20%, hsla(173, 80%, 60%, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 80% 40%, hsla(203, 96%, 40%, 0.12) 0%, transparent 50%),
            radial-gradient(circle at 40% 80%, hsla(142, 86%, 60%, 0.1) 0%, transparent 50%)
          `,
          animation: 'float 20s ease-in-out infinite'
        }}
      />
    </div>
  );
}

// Premium button with enhanced glassmorphic effect
interface PremiumButtonProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'accent';
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}

export function PremiumButton({ 
  children, 
  className = '', 
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false
}: PremiumButtonProps) {
  const variantStyles = {
    primary: 'bg-primary/80 hover:bg-primary/90 text-primary-foreground',
    secondary: 'glass-card hover:glass-intense text-foreground',
    accent: 'bg-accent/80 hover:bg-accent/90 text-accent-foreground'
  }[variant];

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        ${variantStyles}
        glass-hover
        backdrop-blur-xl
        border border-white/20
        rounded-xl px-6 py-3
        font-semibold
        transition-all duration-300
        shadow-xl
        relative overflow-hidden
        disabled:opacity-50 disabled:cursor-not-allowed
        ${className}
      `}
    >
      <div className="relative z-10">
        {children}
      </div>
      {/* Shine effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full hover:translate-x-full transition-transform duration-700" />
    </button>
  );
}

// Status indicator with glassmorphic design
interface StatusIndicatorProps {
  status: 'success' | 'warning' | 'error' | 'info';
  label: string;
  pulse?: boolean;
}

export function StatusIndicator({ status, label, pulse = false }: StatusIndicatorProps) {
  const statusStyles = {
    success: 'bg-success/20 text-success border-success/30',
    warning: 'bg-yellow-500/20 text-yellow-600 border-yellow-500/30',
    error: 'bg-destructive/20 text-destructive border-destructive/30',
    info: 'bg-primary/20 text-primary border-primary/30'
  }[status];

  const pulseClass = pulse ? 'pulse-glow' : '';

  return (
    <div className={`
      glass
      ${statusStyles}
      ${pulseClass}
      inline-flex items-center px-3 py-1.5
      rounded-full text-sm font-medium
      border backdrop-blur-xl
    `}>
      <div className={`w-2 h-2 rounded-full mr-2 ${statusStyles.split(' ')[1]?.replace('text-', 'bg-')}`} />
      {label}
    </div>
  );
}

// Enhanced hero section background
export function HeroBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {/* Main gradient */}
      <div className="absolute inset-0 hero-gradient opacity-80" />
      
      {/* Animated overlays */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          background: `
            radial-gradient(circle at 30% 20%, hsla(255, 255, 255, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 70% 80%, hsla(255, 255, 255, 0.05) 0%, transparent 50%)
          `,
          animation: 'float 15s ease-in-out infinite reverse'
        }}
      />
      
      {/* Geometric patterns */}
      <div className="absolute top-20 right-20 w-32 h-32 opacity-5">
        <div className="w-full h-full bg-white rounded-full animate-pulse" style={{ animationDuration: '3s' }} />
      </div>
      <div className="absolute bottom-32 left-16 w-24 h-24 opacity-5">
        <div className="w-full h-full bg-white rounded-full animate-pulse" style={{ animationDuration: '4s' }} />
      </div>
    </div>
  );
}

// Grid overlay for sections
export function GridOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none opacity-5">
      <div 
        className="w-full h-full"
        style={{
          backgroundImage: `
            linear-gradient(hsla(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, hsla(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px'
        }}
      />
    </div>
  );
}
