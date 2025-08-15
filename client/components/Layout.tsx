import { ReactNode } from "react";
import { useLocation, Link } from "react-router-dom";
import Navigation from "./Navigation";
import MobileNavFooter from "./MobileNavFooter";
import { EnhancedBackground } from "./EnhancedBackground";
import { SkipToContent, AccessibilityPanel } from "./AccessibilityUtils";
import { ScrollToTop } from "./MobileEnhancements";
import { ChevronLeft, Home } from "lucide-react";

interface LayoutProps {
  children: ReactNode;
  title?: string;
  showBreadcrumbs?: boolean;
  className?: string;
}

export default function Layout({
  children,
  title,
  showBreadcrumbs = true,
  className = "",
}: LayoutProps) {
  const location = useLocation();

  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split("/").filter((x) => x);

    const breadcrumbMap: Record<string, string> = {
      maintenance: "الصيانة",
      rental: "الإيجار",
      sales: "المبيعات",
      support: "الدعم",
      profile: "الملف الشخصي",
      cart: "سلة التسوق",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
      "provider-dashboard": "لوحة مقدم الخدمة",
      "provider-signup": "تسجيل مقدم خدمة",
      "order-tracking": "تتبع الطلب",
    };

    const breadcrumbs: { href: string; label: string; icon?: any }[] = [{ href: "/", label: "الرئيسية", icon: Home }];

    let currentPath = "";
    pathnames.forEach((pathname) => {
      currentPath += `/${pathname}`;
      if (breadcrumbMap[pathname]) {
        breadcrumbs.push({
          href: currentPath,
          label: breadcrumbMap[pathname],
        });
      }
    });

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="min-h-screen medical-bg relative" dir="rtl">
      <SkipToContent />
      <AccessibilityPanel />
      <EnhancedBackground />
      <Navigation />

      {/* Breadcrumbs */}
      {showBreadcrumbs && breadcrumbs.length > 1 && (
        <div className="max-w-7xl mx-auto px-4 py-4">
          <nav className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronLeft className="h-4 w-4 text-muted-foreground rotate-180" />
                )}
                <Link
                  to={crumb.href}
                  className={`flex items-center gap-1 transition-colors duration-200 ${
                    index === breadcrumbs.length - 1
                      ? "text-primary font-medium"
                      : "text-muted-foreground hover:text-primary"
                  }`}
                >
                  {crumb.icon && <crumb.icon className="h-4 w-4" />}
                  <span className="text-arabic">{crumb.label}</span>
                </Link>
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Page Title */}
      {title && (
        <div className="max-w-7xl mx-auto px-4 pb-6">
          <h1 className="text-3xl font-bold text-primary text-arabic">
            {title}
          </h1>
        </div>
      )}

      {/* Main Content */}
      <main id="main-content" className={`pb-20 md:pb-8 ${className}`}>
        {children}
      </main>

      {/* Glassmorphic Mobile Footer Navigation */}
      <MobileNavFooter />

      {/* Scroll to Top */}
      <ScrollToTop />
    </div>
  );
}