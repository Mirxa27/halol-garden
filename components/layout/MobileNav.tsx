'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Home,
  Search,
  ShoppingCart,
  Heart,
  User,
  Menu,
  X,
  Package,
  MessageSquare,
  Settings,
  LogOut,
  ChevronRight,
  Grid3X3,
  Truck,
  Shield,
  Phone,
  Mail,
  MapPin,
  Clock,
  Bell,
  CreditCard,
  FileText,
  HelpCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { useNotifications } from '@/hooks/useNotifications';

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { itemCount } = useCart();
  const { unreadCount } = useNotifications();

  // Close menu on route change
  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  const navItems = [
    { href: '/', icon: Home, label: 'Home' },
    { href: '/products', icon: Grid3X3, label: 'Products' },
    { href: '/cart', icon: ShoppingCart, label: 'Cart', badge: itemCount },
    { href: '/wishlist', icon: Heart, label: 'Wishlist' },
    { href: '/account', icon: User, label: 'Account' },
  ];

  const menuCategories = [
    {
      title: 'Shop',
      items: [
        { href: '/products', icon: Package, label: 'All Products' },
        { href: '/products?category=diagnostic', icon: Shield, label: 'Diagnostic Equipment' },
        { href: '/products?category=surgical', icon: Package, label: 'Surgical Instruments' },
        { href: '/products?category=monitoring', icon: Clock, label: 'Patient Monitoring' },
        { href: '/rentals', icon: Truck, label: 'Equipment Rentals' },
      ],
    },
    {
      title: 'Account',
      items: isAuthenticated
        ? [
            { href: '/account/orders', icon: FileText, label: 'My Orders' },
            { href: '/account/messages', icon: MessageSquare, label: 'Messages' },
            { href: '/account/notifications', icon: Bell, label: 'Notifications', badge: unreadCount },
            { href: '/account/payments', icon: CreditCard, label: 'Payment Methods' },
            { href: '/account/settings', icon: Settings, label: 'Settings' },
          ]
        : [
            { href: '/login', icon: User, label: 'Sign In' },
            { href: '/register', icon: User, label: 'Create Account' },
          ],
    },
    {
      title: 'Support',
      items: [
        { href: '/help', icon: HelpCircle, label: 'Help Center' },
        { href: '/contact', icon: Phone, label: 'Contact Us' },
        { href: '/track-order', icon: Truck, label: 'Track Order' },
        { href: '/returns', icon: Package, label: 'Returns & Refunds' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background border-t md:hidden",
        className
      )}>
        <div className="grid grid-cols-5 h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 relative",
                  "hover:bg-accent transition-colors",
                  isActive && "text-primary"
                )}
              >
                <div className="relative">
                  <item.icon className="w-5 h-5" />
                  {item.badge && item.badge > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
                    >
                      {item.badge}
                    </Badge>
                  )}
                </div>
                <span className="text-[10px]">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="bottomNav"
                    className="absolute top-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Mobile Top Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-background border-b md:hidden">
        <div className="flex items-center justify-between p-4 h-16">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMenuOpen(true)}
            className="relative"
          >
            <Menu className="w-6 h-6" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 p-0 flex items-center justify-center text-[10px]"
              >
                {unreadCount}
              </Badge>
            )}
          </Button>

          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.svg" alt="Logo" className="h-8 w-auto" />
            <span className="font-bold text-lg">MedEquip</span>
          </Link>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(true)}
          >
            <Search className="w-6 h-6" />
          </Button>
        </div>
      </header>

      {/* Mobile Menu Sheet */}
      <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
        <SheetContent side="left" className="w-[85%] sm:w-[400px] p-0 overflow-y-auto">
          {/* User Profile Section */}
          {isAuthenticated && user ? (
            <div className="bg-primary text-primary-foreground p-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border-2 border-primary-foreground/20">
                  <AvatarImage src={user.profileImage} />
                  <AvatarFallback>
                    {user.firstName?.[0]}{user.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">
                    {user.firstName} {user.lastName}
                  </h3>
                  <p className="text-sm opacity-90">{user.email}</p>
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {user.userType}
                  </Badge>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-primary text-primary-foreground p-6">
              <h3 className="font-semibold text-lg mb-3">Welcome to MedEquip</h3>
              <div className="flex gap-2">
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  <Link href="/login">Sign In</Link>
                </Button>
                <Button
                  asChild
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                >
                  <Link href="/register">Register</Link>
                </Button>
              </div>
            </div>
          )}

          {/* Menu Categories */}
          <div className="p-4">
            {menuCategories.map((category, index) => (
              <div key={category.title}>
                {index > 0 && <Separator className="my-4" />}
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  {category.title}
                </h4>
                <div className="space-y-1">
                  {category.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        "hover:bg-accent transition-colors",
                        pathname === item.href && "bg-accent"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="w-5 h-5 text-muted-foreground" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge && item.badge > 0 && (
                          <Badge variant="destructive" className="h-5 px-1.5 text-xs">
                            {item.badge}
                          </Badge>
                        )}
                        <ChevronRight className="w-4 h-4 text-muted-foreground" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}

            {/* Logout Button */}
            {isAuthenticated && (
              <>
                <Separator className="my-4" />
                <Button
                  variant="ghost"
                  className="w-full justify-start gap-3 text-destructive hover:text-destructive"
                  onClick={() => {
                    logout();
                    setIsMenuOpen(false);
                  }}
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </Button>
              </>
            )}
          </div>

          {/* Footer Info */}
          <div className="p-4 mt-auto border-t">
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>+1 234 567 8900</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>support@medequip.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                <span>Mon-Fri: 9AM-6PM</span>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Search Sheet */}
      <Sheet open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <SheetContent side="top" className="h-auto">
          <SheetHeader>
            <SheetTitle>Search Products</SheetTitle>
          </SheetHeader>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="search"
                placeholder="Search for medical equipment..."
                className="w-full pl-10 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Diagnostic
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Surgical
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Monitoring
              </Badge>
              <Badge variant="secondary" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                Laboratory
              </Badge>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Spacer for fixed navigation */}
      <div className="h-16 md:hidden" />
    </>
  );
}