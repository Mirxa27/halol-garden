import React from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon, Monitor, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ThemeVisualTester() {
  const { theme, actualTheme, setTheme } = useTheme();

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="glass-card border-0 w-80">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Theme Tester
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current Theme Display */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Selected:</span>
              <div className="font-semibold text-primary">{theme}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Active:</span>
              <div className="font-semibold text-accent">{actualTheme}</div>
            </div>
          </div>

          {/* Theme Toggle Buttons */}
          <div className="grid grid-cols-3 gap-1">
            <Button
              size="sm"
              variant={theme === 'light' ? 'default' : 'outline'}
              onClick={() => setTheme('light')}
              className="flex flex-col h-12 px-2"
            >
              <Sun className="h-3 w-3 mb-1" />
              <span className="text-xs">Light</span>
            </Button>
            <Button
              size="sm"
              variant={theme === 'dark' ? 'default' : 'outline'}
              onClick={() => setTheme('dark')}
              className="flex flex-col h-12 px-2"
            >
              <Moon className="h-3 w-3 mb-1" />
              <span className="text-xs">Dark</span>
            </Button>
            <Button
              size="sm"
              variant={theme === 'system' ? 'default' : 'outline'}
              onClick={() => setTheme('system')}
              className="flex flex-col h-12 px-2"
            >
              <Monitor className="h-3 w-3 mb-1" />
              <span className="text-xs">Auto</span>
            </Button>
          </div>

          {/* Visual Theme Preview */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Color Preview:</div>
            <div className="grid grid-cols-6 gap-1">
              <div className="h-6 w-full bg-background border rounded" title="Background" />
              <div className="h-6 w-full bg-primary rounded" title="Primary" />
              <div className="h-6 w-full bg-accent rounded" title="Accent" />
              <div className="h-6 w-full bg-success rounded" title="Success" />
              <div className="h-6 w-full bg-muted rounded" title="Muted" />
              <div className="h-6 w-full bg-destructive rounded" title="Destructive" />
            </div>
          </div>

          {/* Glass Effect Preview */}
          <div className="space-y-2">
            <div className="text-xs text-muted-foreground">Glass Effects:</div>
            <div className="grid grid-cols-3 gap-1">
              <div className="glass h-8 rounded border flex items-center justify-center text-xs">
                Light
              </div>
              <div className="glass-card h-8 rounded border flex items-center justify-center text-xs">
                Medium
              </div>
              <div className="glass-intense h-8 rounded border flex items-center justify-center text-xs">
                Intense
              </div>
            </div>
          </div>

          {/* CSS Variables Display */}
          <div className="text-xs space-y-1">
            <div className="text-muted-foreground">CSS Variables:</div>
            <div className="space-y-1 font-mono text-[10px]">
              <div>--background: <span className="text-primary">hsl(var(--background))</span></div>
              <div>--glass-bg: <span className="text-accent">hsl(var(--glass-bg))</span></div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Hook to programmatically test theme functionality
export function useThemeValidator() {
  const { theme, actualTheme, setTheme } = useTheme();

  const validateTheme = () => {
    const root = document.documentElement;
    const hasLightClass = root.classList.contains('light');
    const hasDarkClass = root.classList.contains('dark');
    
    console.log('🎨 Theme Validation:', {
      selectedTheme: theme,
      actualTheme: actualTheme,
      htmlClasses: {
        light: hasLightClass,
        dark: hasDarkClass
      },
      cssVariables: {
        background: getComputedStyle(root).getPropertyValue('--background'),
        primary: getComputedStyle(root).getPropertyValue('--primary'),
        glassBackground: getComputedStyle(root).getPropertyValue('--glass-bg')
      }
    });

    return {
      isValid: (actualTheme === 'light' && hasLightClass) || (actualTheme === 'dark' && hasDarkClass),
      theme,
      actualTheme,
      classes: { light: hasLightClass, dark: hasDarkClass }
    };
  };

  const testThemeSwitch = async () => {
    console.log('🧪 Testing theme switching...');
    
    // Test light theme
    setTheme('light');
    await new Promise(resolve => setTimeout(resolve, 100));
    const lightTest = validateTheme();
    
    // Test dark theme
    setTheme('dark');
    await new Promise(resolve => setTimeout(resolve, 100));
    const darkTest = validateTheme();
    
    // Test system theme
    setTheme('system');
    await new Promise(resolve => setTimeout(resolve, 100));
    const systemTest = validateTheme();

    console.log('🧪 Theme Switch Test Results:', {
      light: lightTest,
      dark: darkTest,
      system: systemTest
    });

    return { lightTest, darkTest, systemTest };
  };

  return { validateTheme, testThemeSwitch };
}