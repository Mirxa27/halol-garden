import { Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeToggle({ variant = 'default' }: { variant?: 'default' | 'compact' }) {
  const { theme, setTheme } = useTheme();

  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-4 w-4" />;
      case 'dark':
        return <Moon className="h-4 w-4" />;
      case 'system':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const getThemeLabel = () => {
    switch (theme) {
      case 'light':
        return 'فاتح';
      case 'dark':
        return 'داكن';
      case 'system':
        return 'تلقائي';
      default:
        return 'تلقائي';
    }
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            {getThemeIcon()}
            <span className="sr-only">تبديل المظهر</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="glass-card border-0">
          <DropdownMenuItem
            onClick={() => setTheme('light')}
            className="flex items-center gap-2 text-arabic cursor-pointer"
          >
            <Sun className="h-4 w-4" />
            فاتح
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme('dark')}
            className="flex items-center gap-2 text-arabic cursor-pointer"
          >
            <Moon className="h-4 w-4" />
            داكن
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme('system')}
            className="flex items-center gap-2 text-arabic cursor-pointer"
          >
            <Monitor className="h-4 w-4" />
            تلقائي
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className="glass-hover border-primary/30 text-arabic gap-2"
        >
          {getThemeIcon()}
          {getThemeLabel()}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="glass-card border-0">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className="flex items-center gap-2 text-arabic cursor-pointer"
        >
          <Sun className="h-4 w-4" />
          المظهر الفاتح
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className="flex items-center gap-2 text-arabic cursor-pointer"
        >
          <Moon className="h-4 w-4" />
          المظهر الداكن
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className="flex items-center gap-2 text-arabic cursor-pointer"
        >
          <Monitor className="h-4 w-4" />
          تبعاً للنظام
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}