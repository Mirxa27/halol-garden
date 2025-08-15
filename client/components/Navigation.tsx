import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SearchComponent } from "@/components/SearchComponent";
import {
  Bell,
  Menu,
  User,
  MessageCircle,
  ShoppingCart,
  X,
  Home,
  Wrench,
  Calendar,
  Phone,
  LogIn,
  UserPlus,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Navigation() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [cartCount] = useState(3); // Mock cart count
  const [notificationCount] = useState(5); // Mock notification count
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navigationLinks = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/maintenance", label: "الصيانة", icon: Wrench },
    { href: "/rental", label: "الإيجار", icon: Calendar },
    { href: "/sales", label: "المبيعات", icon: ShoppingCart },
    { href: "/support", label: "الدعم", icon: Phone },
  ];

  const isActiveRoute = (href: string) => {
    return location.pathname === href;
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "glass-nav backdrop-blur-xl border-b border-white/20"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Logo and Brand */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex items-center gap-3 group">
                <div className="relative">
                  <img
                    src="https://cdn.builder.io/api/v1/image/assets%2Fed5085bde9354d7da29f92af0d8cb7ba%2F8a485dfebdda41709e5fcd664ff20611"
                    alt="حلول الأجهزة الطبية - Holool Medical Devices"
                    className="h-12 w-auto transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-8">
              {navigationLinks.map((link) => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`relative flex items-center gap-2 text-sm font-medium transition-all duration-300 px-3 py-2 rounded-full ${
                    isActiveRoute(link.href)
                      ? "text-primary bg-primary/10 shadow-lg"
                      : "text-foreground hover:text-primary hover:bg-white/10"
                  }`}
                >
                  <link.icon className="h-4 w-4" />
                  <span className="text-arabic">{link.label}</span>
                  {isActiveRoute(link.href) && (
                    <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
                  )}
                </Link>
              ))}
            </div>

            {/* Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-md mx-8">
              <SearchComponent className="w-full" />
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-3">
              {/* Notifications */}
              <Button
                variant="ghost"
                size="icon"
                className="relative glass-hover rounded-full transition-all duration-300 hover:shadow-lg"
              >
                <Bell className="h-5 w-5" />
                {notificationCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-destructive text-destructive-foreground text-xs flex items-center justify-center animate-pulse">
                    {notificationCount}
                  </Badge>
                )}
              </Button>

              {/* Messages */}
              <Button
                variant="ghost"
                size="icon"
                className="glass-hover rounded-full transition-all duration-300 hover:shadow-lg"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>

              {/* Cart */}
              <Link to="/cart">
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative glass-hover rounded-full transition-all duration-300 hover:shadow-lg"
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 bg-success text-success-foreground text-xs flex items-center justify-center">
                      {cartCount}
                    </Badge>
                  )}
                </Button>
              </Link>

              {/* Theme Toggle */}
              <ThemeToggle variant="compact" />

              {/* User Profile */}
              <div className="hidden md:flex items-center gap-2">
                <Link to="/profile">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="glass-hover rounded-full transition-all duration-300 hover:shadow-lg"
                  >
                    <User className="h-5 w-5" />
                  </Button>
                </Link>
                <div className="flex gap-2">
                  <Link to="/login">
                    <Button
                      variant="outline"
                      size="sm"
                      className="glass-hover border-primary/30 text-arabic transition-all duration-300 hover:shadow-lg"
                    >
                      <LogIn className="ml-2 h-4 w-4" />
                      دخول
                    </Button>
                  </Link>
                  <Link to="/signup">
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-arabic transition-all duration-300 hover:shadow-lg"
                    >
                      <UserPlus className="ml-2 h-4 w-4" />
                      تسجيل
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Mobile Menu Toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden glass-hover rounded-full transition-all duration-300"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              >
                {isMobileMenuOpen ? (
                  <X className="h-5 w-5" />
                ) : (
                  <Menu className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Search Bar */}
          <div className="md:hidden mt-3">
            <SearchComponent className="w-full" />
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 top-[80px] bg-black/50 backdrop-blur-sm z-40">
            <div className="glass-card rounded-t-3xl mt-4 mx-4 p-6 space-y-4">
              {/* Mobile Navigation Links */}
              <div className="space-y-3">
                {navigationLinks.map((link) => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center gap-3 text-lg font-medium transition-all duration-300 p-3 rounded-xl ${
                      isActiveRoute(link.href)
                        ? "text-primary bg-primary/10"
                        : "text-foreground hover:text-primary hover:bg-white/10"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <link.icon className="h-5 w-5" />
                    <span className="text-arabic">{link.label}</span>
                  </Link>
                ))}
              </div>

              {/* Mobile Auth Actions */}
              <div className="border-t border-border pt-4 space-y-3">
                <Link to="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-start glass-hover border-primary/30 text-arabic"
                  >
                    <User className="ml-2 h-4 w-4" />
                    الملف الشخصي
                  </Button>
                </Link>
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full justify-start glass-hover border-primary/30 text-arabic"
                  >
                    <LogIn className="ml-2 h-4 w-4" />
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link to="/signup" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full justify-start bg-primary hover:bg-primary/90 text-arabic">
                    <UserPlus className="ml-2 h-4 w-4" />
                    إنشاء حساب جديد
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20"></div>
    </>
  );
}