import { Link, useLocation } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { 
  Home, 
  Wrench, 
  Calendar, 
  ShoppingCart, 
  User,
  Search,
  MessageCircle,
  Phone
} from "lucide-react";

export default function MobileFooterNav() {
  const location = useLocation();
  const cartCount = 3; // Mock cart count

  const footerNavItems = [
    { href: "/", label: "الرئيسية", icon: Home },
    { href: "/search", label: "البحث", icon: Search },
    { href: "/maintenance", label: "الصيانة", icon: Wrench },
    { href: "/cart", label: "السلة", icon: ShoppingCart, badge: cartCount },
    { href: "/profile", label: "حسابي", icon: User }
  ];

  const isActiveRoute = (href: string) => {
    if (href === "/search") {
      return location.pathname.includes("/maintenance") || 
             location.pathname.includes("/rental") || 
             location.pathname.includes("/sales");
    }
    return location.pathname === href;
  };

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-nav border-t border-white/20 backdrop-blur-xl">
      <div className="flex items-center justify-around py-2 px-4">
        {footerNavItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={`relative flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-300 ${
              isActiveRoute(item.href)
                ? 'text-primary bg-primary/10'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <div className="relative">
              <item.icon className={`h-5 w-5 transition-transform duration-300 ${
                isActiveRoute(item.href) ? 'scale-110' : ''
              }`} />
              {item.badge && item.badge > 0 && (
                <Badge className="absolute -top-2 -right-2 h-4 w-4 p-0 bg-success text-success-foreground text-xs flex items-center justify-center">
                  {item.badge}
                </Badge>
              )}
            </div>
            <span className="text-xs text-arabic font-medium">{item.label}</span>
            {isActiveRoute(item.href) && (
              <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full"></div>
            )}
          </Link>
        ))}
      </div>
    </div>
  );
}
