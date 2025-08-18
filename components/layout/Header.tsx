'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { 
  Menu, X, ShoppingCart, User, Globe, 
  Search, Heart, Bell, LogOut 
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  
  // Mock user state - replace with actual auth
  const isLoggedIn = false;
  const cartItemsCount = 0;

  const navigation = [
    { name: t('common.products'), href: '/products' },
    { name: t('common.services'), href: '/services' },
    { name: t('common.about'), href: '/about' },
    { name: t('common.contact'), href: '/contact' },
  ];

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-bold text-primary">MedMarket</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-6">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={`text-sm font-medium transition-colors hover:text-primary ${
                  pathname === item.href
                    ? 'text-primary'
                    : 'text-muted-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Search Icon */}
            <Button variant="ghost" size="icon" className="hidden sm:flex">
              <Search className="h-5 w-5" />
            </Button>

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              aria-label="Toggle language"
            >
              <Globe className="h-5 w-5" />
            </Button>

            {/* Wishlist */}
            {isLoggedIn && (
              <Button variant="ghost" size="icon">
                <Heart className="h-5 w-5" />
              </Button>
            )}

            {/* Cart */}
            <Button variant="ghost" size="icon" className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-primary text-xs text-primary-foreground flex items-center justify-center">
                  {cartItemsCount}
                </span>
              )}
            </Button>

            {/* User Menu */}
            {isLoggedIn ? (
              <div className="relative">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                >
                  <User className="h-5 w-5" />
                </Button>
                
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-background border">
                    <div className="py-1">
                      <Link
                        href="/dashboard"
                        className="block px-4 py-2 text-sm hover:bg-accent"
                      >
                        {t('common.dashboard')}
                      </Link>
                      <Link
                        href="/profile"
                        className="block px-4 py-2 text-sm hover:bg-accent"
                      >
                        {t('common.profile')}
                      </Link>
                      <Link
                        href="/settings"
                        className="block px-4 py-2 text-sm hover:bg-accent"
                      >
                        {t('common.settings')}
                      </Link>
                      <hr className="my-1" />
                      <button
                        className="block w-full text-left px-4 py-2 text-sm hover:bg-accent"
                      >
                        <LogOut className="inline h-4 w-4 mr-2" />
                        {t('common.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex sm:items-center sm:space-x-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    {t('common.login')}
                  </Button>
                </Link>
                <Link href="/register">
                  <Button size="sm">
                    {t('common.register')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t py-4">
            <div className="space-y-1">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`block py-2 text-base font-medium ${
                    pathname === item.href
                      ? 'text-primary'
                      : 'text-muted-foreground'
                  }`}
                  onClick={() => setIsMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
              {!isLoggedIn && (
                <>
                  <hr className="my-2" />
                  <Link
                    href="/login"
                    className="block py-2 text-base font-medium text-muted-foreground"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('common.login')}
                  </Link>
                  <Link
                    href="/register"
                    className="block py-2 text-base font-medium text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('common.register')}
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}