import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Home,
  Wrench,
  Calendar,
  ShoppingCart,
  User,
  MessageCircle,
  Bell,
  Search,
} from "lucide-react";
import { useState, useEffect } from "react";

export default function MobileNavFooter() {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [cartCount] = useState(3);
  const [notificationCount] = useState(5);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // Hide on scroll down, show on scroll up
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  const navigationItems = [
    {
      href: "/",
      label: "الرئيسية",
      icon: Home,
      isActive: location.pathname === "/",
    },
    {
      href: "/maintenance",
      label: "الصيانة",
      icon: Wrench,
      isActive: location.pathname === "/maintenance",
    },
    {
      href: "/rental",
      label: "الإيجار",
      icon: Calendar,
      isActive: location.pathname === "/rental",
    },
    {
      href: "/sales",
      label: "المبيعات",
      icon: ShoppingCart,
      isActive: location.pathname === "/sales",
      badge: cartCount,
    },
    {
      href: "/profile",
      label: "الحساب",
      icon: User,
      isActive: location.pathname === "/profile",
    },
  ];

  return (
    <>
      {/* Floating Mobile Navigation Footer */}
      <div
        className={cn(
          "fixed bottom-4 left-4 right-4 z-50 md:hidden transition-all duration-500 ease-out",
          isVisible ? "translate-y-0 opacity-100" : "translate-y-20 opacity-0",
        )}
      >
        {/* Glassmorphic Navigation Capsule */}
        <div className="glass-intense rounded-[2rem] border border-white/30 shadow-2xl overflow-hidden">
          {/* Gradient overlay for premium look */}
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 pointer-events-none"></div>

          {/* Navigation Items Grid */}
          <div className="relative z-10 flex items-center justify-between px-3 py-3">
            {navigationItems.map((item, index) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  "relative flex flex-col items-center justify-center min-w-[60px] py-2 px-2 rounded-2xl transition-all duration-300 group",
                  item.isActive
                    ? "bg-primary/20 shadow-lg scale-110"
                    : "hover:bg-white/10 hover:scale-105",
                )}
                style={{
                  animationDelay: `${index * 0.1}s`,
                }}
              >
                {/* Icon Container */}
                <div
                  className={cn(
                    "relative flex items-center justify-center w-8 h-8 rounded-xl transition-all duration-300",
                    item.isActive
                      ? "bg-primary text-white shadow-lg"
                      : "text-foreground/80 group-hover:text-primary group-hover:bg-primary/10",
                  )}
                >
                  <item.icon className="h-5 w-5" />

                  {/* Badge for cart */}
                  {item.badge && item.badge > 0 && (
                    <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 bg-destructive text-destructive-foreground text-xs flex items-center justify-center animate-pulse">
                      {item.badge}
                    </Badge>
                  )}
                </div>

                {/* Label */}
                <span
                  className={cn(
                    "text-xs font-medium mt-1 text-arabic transition-all duration-300",
                    item.isActive
                      ? "text-primary font-bold"
                      : "text-foreground/70 group-hover:text-primary",
                  )}
                >
                  {item.label}
                </span>

                {/* Active Indicator */}
                {item.isActive && (
                  <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                )}

                {/* Hover Effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </Link>
            ))}
          </div>

          {/* Floating Action Buttons */}
          <div className="absolute -top-3 right-6 flex gap-2">
            {/* Search FAB */}
            <Button
              size="icon"
              className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
            >
              <Search className="h-5 w-5 text-white group-hover:rotate-12 transition-transform duration-300" />
            </Button>

            {/* Notifications FAB */}
            <Button
              size="icon"
              className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-success shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group relative"
            >
              <Bell className="h-5 w-5 text-white group-hover:rotate-12 transition-transform duration-300" />
              {notificationCount > 0 && (
                <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 bg-destructive text-destructive-foreground text-xs flex items-center justify-center animate-pulse">
                  {notificationCount}
                </Badge>
              )}
            </Button>
          </div>
        </div>

        {/* Subtle Shadow Underneath */}
        <div className="absolute inset-0 bg-black/5 rounded-[2rem] blur-lg scale-105 -z-10"></div>
      </div>

      {/* Bottom Spacer for Content */}
      <div className="h-24 md:hidden"></div>
    </>
  );
}
