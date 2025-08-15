import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, useAnimation, useInView } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Star,
  Heart,
  Check,
  X,
  Plus,
  Minus,
  ShoppingCart,
  Eye,
  MessageCircle,
  Share2,
  Zap,
  Sparkles
} from "lucide-react";

// Enhanced card with hover animations
export function AnimatedServiceCard({ 
  children, 
  className = "",
  ...props 
}: any) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileHover={{ 
        scale: 1.02,
        y: -4,
        transition: { duration: 0.2, ease: "easeOut" }
      }}
      whileTap={{ scale: 0.98 }}
      className={className}
      {...props}
    >
      <Card className="glass-card border-0 relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5"
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        />
        <motion.div
          className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: isHovered ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ transformOrigin: "left" }}
        />
        {children}
      </Card>
    </motion.div>
  );
}

// Animated button with ripple effect
export function AnimatedButton({ 
  children, 
  variant = "default",
  className = "",
  onClick,
  ...props 
}: any) {
  const [ripples, setRipples] = useState<Array<{ id: number; x: number; y: number }>>([]);

  const addRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const newRipple = { id: Date.now(), x, y };
    setRipples(prev => [...prev, newRipple]);
    
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id));
    }, 600);

    onClick?.(event);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      className="relative inline-block"
    >
      <Button
        variant={variant}
        className={`relative overflow-hidden ${className}`}
        onClick={addRipple}
        {...props}
      >
        {children}
        <AnimatePresence>
          {ripples.map(ripple => (
            <motion.span
              key={ripple.id}
              className="absolute rounded-full bg-white/30 pointer-events-none"
              style={{
                left: ripple.x - 10,
                top: ripple.y - 10,
                width: 20,
                height: 20,
              }}
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>
      </Button>
    </motion.div>
  );
}

// Floating action button with pulse animation
export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  className = "",
  variant = "default"
}: {
  icon: any;
  label: string;
  onClick: () => void;
  className?: string;
  variant?: "default" | "success" | "destructive" | "outline";
}) {
  const getVariantClasses = () => {
    switch (variant) {
      case "success":
        return "bg-success hover:bg-success/90 text-success-foreground";
      case "destructive":
        return "bg-destructive hover:bg-destructive/90 text-destructive-foreground";
      case "outline":
        return "border border-primary text-primary hover:bg-primary hover:text-primary-foreground";
      default:
        return "bg-primary hover:bg-primary/90 text-primary-foreground";
    }
  };

  return (
    <motion.div
      className={`fixed z-50 ${className}`}
      initial={{ scale: 0 }}
      animate={{ scale: 1 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
    >
      <motion.button
        onClick={onClick}
        className={`
          w-14 h-14 rounded-full shadow-lg flex items-center justify-center
          backdrop-blur-sm transition-all duration-300
          ${getVariantClasses()}
        `}
        animate={{
          boxShadow: [
            "0 4px 20px rgba(0,0,0,0.1)",
            "0 4px 25px rgba(0,0,0,0.15)",
            "0 4px 20px rgba(0,0,0,0.1)"
          ]
        }}
        transition={{
          boxShadow: {
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        aria-label={label}
      >
        <Icon className="h-6 w-6" />
      </motion.button>
    </motion.div>
  );
}

// Animated notification toast
export function AnimatedToast({
  type = "info",
  title,
  message,
  onClose,
  autoClose = true
}: {
  type?: "success" | "error" | "info" | "warning";
  title: string;
  message: string;
  onClose: () => void;
  autoClose?: boolean;
}) {
  useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  const getTypeConfig = () => {
    switch (type) {
      case "success":
        return {
          icon: Check,
          colorClass: "border-success text-success-foreground bg-success/10",
          iconClass: "text-success"
        };
      case "error":
        return {
          icon: X,
          colorClass: "border-destructive text-destructive-foreground bg-destructive/10",
          iconClass: "text-destructive"
        };
      case "warning":
        return {
          icon: Zap,
          colorClass: "border-orange-500 text-orange-700 bg-orange-500/10",
          iconClass: "text-orange-500"
        };
      default:
        return {
          icon: Sparkles,
          colorClass: "border-primary text-primary-foreground bg-primary/10",
          iconClass: "text-primary"
        };
    }
  };

  const { icon: Icon, colorClass, iconClass } = getTypeConfig();

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.8 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -50, scale: 0.8 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`
        fixed top-4 right-4 z-50 max-w-sm
        glass-card border rounded-lg shadow-xl
        ${colorClass}
      `}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className={`flex-shrink-0 ${iconClass}`}
          >
            <Icon className="h-5 w-5" />
          </motion.div>
          <div className="flex-1">
            <h4 className="font-semibold text-arabic mb-1">{title}</h4>
            <p className="text-sm opacity-90 text-arabic">{message}</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="flex-shrink-0 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

// Animated counter
export function AnimatedCounter({ 
  value, 
  duration = 1 
}: { 
  value: number; 
  duration?: number 
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    let startTime: number;
    const startValue = displayValue;
    const endValue = value;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / (duration * 1000), 1);
      
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.floor(startValue + (endValue - startValue) * easeOut);
      
      setDisplayValue(currentValue);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration, displayValue]);

  return <span>{displayValue.toLocaleString()}</span>;
}

// Fade in animation when element comes into view
export function FadeInWhenVisible({ 
  children, 
  className = "",
  delay = 0 
}: { 
  children: React.ReactNode; 
  className?: string;
  delay?: number;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, threshold: 0.1 });
  const controls = useAnimation();

  useEffect(() => {
    if (isInView) {
      controls.start({
        opacity: 1,
        y: 0,
        transition: {
          duration: 0.6,
          delay,
          ease: "easeOut"
        }
      });
    }
  }, [isInView, controls, delay]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={controls}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// Stagger children animation
export function StaggerChildren({ 
  children, 
  className = "",
  staggerDelay = 0.1 
}: { 
  children: React.ReactNode; 
  className?: string;
  staggerDelay?: number;
}) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ 
  children, 
  className = "" 
}: { 
  children: React.ReactNode; 
  className?: string 
}) {
  return (
    <motion.div
      className={className}
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.5,
            ease: "easeOut"
          }
        }
      }}
    >
      {children}
    </motion.div>
  );
}

// Like button with heart animation
export function AnimatedLikeButton({
  isLiked,
  onToggle,
  count
}: {
  isLiked: boolean;
  onToggle: () => void;
  count: number;
}) {
  return (
    <motion.button
      onClick={onToggle}
      className="flex items-center gap-2 text-sm"
      whileTap={{ scale: 0.9 }}
    >
      <motion.div
        animate={{
          scale: isLiked ? [1, 1.3, 1] : 1,
          rotate: isLiked ? [0, 15, -15, 0] : 0
        }}
        transition={{ duration: 0.4 }}
      >
        <Heart 
          className={`h-4 w-4 transition-colors duration-200 ${
            isLiked ? 'fill-red-500 text-red-500' : 'text-muted-foreground'
          }`}
        />
      </motion.div>
      <AnimatedCounter value={count} />
    </motion.button>
  );
}

// Slide up modal animation
export function SlideUpModal({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode 
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={onClose}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 z-50"
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// Loading spinner with custom animation
export function AnimatedSpinner({ 
  size = "md",
  className = "" 
}: { 
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8"
  };

  return (
    <motion.div
      className={`${sizeClasses[size]} ${className}`}
      animate={{ rotate: 360 }}
      transition={{
        duration: 1,
        repeat: Infinity,
        ease: "linear"
      }}
    >
      <div className="w-full h-full border-2 border-primary border-t-transparent rounded-full" />
    </motion.div>
  );
}
