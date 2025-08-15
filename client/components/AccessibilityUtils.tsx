import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Volume2,
  VolumeX,
  Type,
  Contrast,
  Eye,
  EyeOff,
  RotateCcw,
  Accessibility,
  ZoomIn,
  ZoomOut,
  Pause,
  Play
} from "lucide-react";

// Skip to content link
export function SkipToContent() {
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-50 bg-primary text-primary-foreground px-4 py-2 rounded-md text-arabic"
    >
      الانتقال إلى المحتوى الرئيسي
    </a>
  );
}

// Screen reader announcements
export function ScreenReaderAnnouncement({ 
  message, 
  priority = "polite" 
}: { 
  message: string; 
  priority?: "polite" | "assertive" 
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
    >
      {message}
    </div>
  );
}

// Focus trap for modals
export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement?.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement?.focus();
          e.preventDefault();
        }
      }
    };

    document.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      document.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

// Accessibility settings panel
interface AccessibilitySettings {
  fontSize: number;
  highContrast: boolean;
  reduceMotion: boolean;
  soundEnabled: boolean;
}

export function AccessibilityPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>({
    fontSize: 16,
    highContrast: false,
    reduceMotion: false,
    soundEnabled: true
  });

  useEffect(() => {
    // Load settings from localStorage
    const saved = localStorage.getItem('accessibility-settings');
    if (saved) {
      setSettings(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Apply settings to document
    document.documentElement.style.fontSize = `${settings.fontSize}px`;
    
    if (settings.highContrast) {
      document.documentElement.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
    }

    if (settings.reduceMotion) {
      document.documentElement.classList.add('reduce-motion');
    } else {
      document.documentElement.classList.remove('reduce-motion');
    }

    // Save to localStorage
    localStorage.setItem('accessibility-settings', JSON.stringify(settings));
  }, [settings]);

  const updateSetting = <K extends keyof AccessibilitySettings>(
    key: K,
    value: AccessibilitySettings[K]
  ) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const resetSettings = () => {
    setSettings({
      fontSize: 16,
      highContrast: false,
      reduceMotion: false,
      soundEnabled: true
    });
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed top-1/2 left-0 z-50 rounded-l-none rounded-r-lg bg-primary hover:bg-primary/90 text-primary-foreground p-2 transform -translate-y-1/2"
        aria-label="فتح إعدادات الوصول"
      >
        <Accessibility className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />
      <Card className="fixed top-4 left-4 z-50 w-80 glass-card shadow-xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-primary text-arabic">
              إعدادات الوصول
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              aria-label="إغلاق إعدادات الوصول"
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-4">
            {/* Font Size */}
            <div>
              <label className="text-sm font-medium text-arabic mb-2 block">
                حجم الخط
              </label>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSetting('fontSize', Math.max(12, settings.fontSize - 2))}
                  disabled={settings.fontSize <= 12}
                >
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <span className="flex-1 text-center text-sm">
                  {settings.fontSize}px
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateSetting('fontSize', Math.min(24, settings.fontSize + 2))}
                  disabled={settings.fontSize >= 24}
                >
                  <ZoomIn className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* High Contrast */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-arabic">
                التباين العالي
              </label>
              <Button
                variant={settings.highContrast ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('highContrast', !settings.highContrast)}
              >
                <Contrast className="h-4 w-4" />
              </Button>
            </div>

            {/* Reduce Motion */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-arabic">
                تقليل الحركة
              </label>
              <Button
                variant={settings.reduceMotion ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('reduceMotion', !settings.reduceMotion)}
              >
                {settings.reduceMotion ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
            </div>

            {/* Sound */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-arabic">
                الأصوات
              </label>
              <Button
                variant={settings.soundEnabled ? "default" : "outline"}
                size="sm"
                onClick={() => updateSetting('soundEnabled', !settings.soundEnabled)}
              >
                {settings.soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
              </Button>
            </div>

            {/* Reset */}
            <Button
              variant="outline"
              className="w-full text-arabic"
              onClick={resetSettings}
            >
              <RotateCcw className="ml-2 h-4 w-4" />
              إعادة تعيين
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

// Keyboard navigation helper
export function useKeyboardNavigation(
  items: Array<{ id: string; element?: HTMLElement }>,
  isActive: boolean = true
) {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          items[activeIndex]?.element?.click();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, activeIndex, isActive]);

  return { activeIndex, setActiveIndex };
}

// ARIA live region for dynamic updates
export function AriaLiveRegion({ 
  children, 
  priority = "polite" 
}: { 
  children: React.ReactNode; 
  priority?: "polite" | "assertive" 
}) {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className="sr-only"
      role="status"
    >
      {children}
    </div>
  );
}

// Progress indicator with ARIA
export function AccessibleProgress({ 
  value, 
  max = 100, 
  label 
}: { 
  value: number; 
  max?: number; 
  label: string 
}) {
  const percentage = Math.round((value / max) * 100);

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span className="text-arabic">{label}</span>
        <span>{percentage}%</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        className="w-full bg-muted rounded-full h-2"
      >
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Error boundary with accessibility
export function AccessibleErrorBoundary({ 
  children, 
  fallback 
}: { 
  children: React.ReactNode; 
  fallback?: React.ReactNode 
}) {
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  if (hasError) {
    return (
      <div role="alert" className="p-6 text-center">
        {fallback || (
          <div>
            <h2 className="text-lg font-semibold text-destructive mb-2 text-arabic">
              حدث خطأ
            </h2>
            <p className="text-muted-foreground text-arabic mb-4">
              عذراً، حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.
            </p>
            <Button onClick={() => setHasError(false)} className="text-arabic">
              المحاولة مرة أخرى
            </Button>
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
