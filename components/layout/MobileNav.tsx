'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  Search, 
  ShoppingCart, 
  User, 
  Menu,
  Package,
  Heart,
  Bell
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  badge?: number;
}

export function MobileNav() {
  const pathname = usePathname();
  const [cartCount, setCartCount] = useState(0);
  const [notificationCount, setNotificationCount] = useState(0);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Fetch cart and notification counts
  useEffect(() => {
    fetchCounts();
  }, []);

  const fetchCounts = async () => {
    try {
      // Fetch cart count
      const cartRes = await fetch('/api/cart/count');
      if (cartRes.ok) {
        const cartData = await cartRes.json();
        setCartCount(cartData.count || 0);
      }

      // Fetch notification count
      const notifRes = await fetch('/api/notifications/unread-count');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        setNotificationCount(notifData.count || 0);
      }
    } catch (error) {
      console.error('Error fetching counts:', error);
    }
  };

  const navItems: NavItem[] = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/products', icon: Package, label: 'Products' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: cartCount },
    { href: '/account', icon: User, label: 'Account' }
  ];

  const menuItems = [
    { href: '/wishlist', icon: Heart, label: 'Wishlist' },
    { href: '/notifications', icon: Bell, label: 'Notifications', badge: notificationCount },
    { href: '/orders', icon: Package, label: 'My Orders' },
    { href: '/support', icon: User, label: 'Support' }
  ];

  return (
    <>
      {/* Bottom Navigation Bar - Mobile Only */}
      <nav className="mobile-nav flex items-center justify-around bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
                          (item.href !== '/' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center flex-1 py-2 px-1 relative group",
                "transition-all duration-200 touch-feedback",
                "hover:bg-accent/50 active:bg-accent",
                isActive && "text-primary"
              )}
            >
              <div className="relative">
                <item.icon 
                  className={cn(
                    "h-5 w-5 transition-transform duration-200",
                    isActive && "scale-110"
                  )}
                />
                {item.badge && item.badge > 0 && (
                  <Badge 
                    className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                    variant="destructive"
                  >
                    {item.badge > 99 ? '99+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                "text-[10px] mt-1 transition-all duration-200",
                isActive ? "font-semibold" : "font-normal"
              )}>
                {item.label}
              </span>
              {isActive && (
                <span className="absolute top-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </Link>
          );
        })}
        
        {/* Menu Button */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <button
              className="flex flex-col items-center justify-center flex-1 py-2 px-1 touch-feedback"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] mt-1">Menu</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
            <div className="py-4">
              <h3 className="font-semibold mb-4">More Options</h3>
              <div className="space-y-1">
                {menuItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-accent transition-colors touch-feedback"
                  >
                    <div className="flex items-center gap-3">
                      <item.icon className="h-5 w-5" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && item.badge > 0 && (
                      <Badge variant="secondary">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </nav>

      {/* Top Search Bar - Mobile Only */}
      <div className="mobile-only fixed top-0 left-0 right-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center gap-2 p-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search medical devices..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-full bg-accent/50 focus:bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="relative"
            onClick={() => setIsMenuOpen(true)}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge 
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                variant="destructive"
              >
                {notificationCount}
              </Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Add padding to main content to account for fixed nav */}
      <style jsx global>{`
        @media (max-width: 640px) {
          body {
            padding-top: 60px;
            padding-bottom: calc(var(--mobile-bottom-nav) + env(safe-area-inset-bottom));
          }
        }
      `}</style>
    </>
  );
}