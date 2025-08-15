import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import LoadingSpinner from "./components/LoadingSpinner";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";

// Import Index directly since it's the main page
import Index from "./pages/Index";
const NotFound = lazy(() => import("./pages/NotFound"));
const Maintenance = lazy(() => import("./pages/Maintenance"));
const Rental = lazy(() => import("./pages/Rental"));
const Sales = lazy(() => import("./pages/Sales"));
const Support = lazy(() => import("./pages/Support"));
const Profile = lazy(() => import("./pages/Profile"));
const ProviderSignup = lazy(() => import("./pages/ProviderSignup"));
const Login = lazy(() => import("./pages/Login"));
const Signup = lazy(() => import("./pages/Signup"));
const Cart = lazy(() => import("./pages/Cart"));
const ProviderDashboard = lazy(() => import("./pages/ProviderDashboard"));
const OrderTracking = lazy(() => import("./pages/OrderTracking"));
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const Messages = lazy(() => import("./pages/Messages"));
const HelpCenter = lazy(() => import("./pages/HelpCenter"));
const Payment = lazy(() => import("./pages/Payment"));

// Dynamic route components
const ServiceDetails = lazy(() => import("./pages/ServiceDetails"));
const ProviderProfile = lazy(() => import("./pages/ProviderProfile"));
const ProductDetails = lazy(() => import("./pages/ProductDetails"));
const CategoryPage = lazy(() => import("./pages/CategoryPage"));
const SearchResults = lazy(() => import("./pages/SearchResults"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// SEO Component for dynamic meta tags
function SEOHead({ title, description, keywords }: { 
  title?: string; 
  description?: string; 
  keywords?: string; 
}) {
  useEffect(() => {
    // Update document title
    if (title) {
      document.title = `${title} | حلول الأجهزة الطبية - Holool Medical Devices`;
    } else {
      document.title = "حلول الأجهزة الطبية - Holool Medical Devices | منصة الأجهزة الطبية الرائدة";
    }

    // Update meta description
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description);
    }

    // Update meta keywords
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords && keywords) {
      metaKeywords.setAttribute('content', keywords);
    }
  }, [title, description, keywords]);

  return null;
}

// Route wrapper with SEO
function RouteWrapper({ 
  children, 
  title, 
  description, 
  keywords 
}: { 
  children: React.ReactNode;
  title?: string;
  description?: string;
  keywords?: string;
}) {
  return (
    <ErrorBoundary>
      <SEOHead title={title} description={description} keywords={keywords} />
      <Suspense fallback={<LoadingSpinner />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
        <Routes>
          {/* Home Route */}
          <Route
            path="/"
            element={
              <>
                <SEOHead
                  title="الرئيسية"
                  description="منصة حلول الأجهزة الطبية الرائدة - خدمات الصيانة والإيجار والمبيعات للأجهزة الطبية"
                  keywords="أجهزة طبية، صيانة، إيجار، مبيعات، مستشفيات، عيادات"
                />
                <Index />
              </>
            }
          />

          {/* Authentication Routes */}
          <Route 
            path="/login" 
            element={
              <RouteWrapper 
                title="تسجيل الدخول"
                description="تسجيل الدخول إلى منصة حلول ا��أجهزة الطبية"
                keywords="تسجيل دخول، حسا��، أمان"
              >
                <Login />
              </RouteWrapper>
            } 
          />
          <Route 
            path="/signup" 
            element={
              <RouteWrapper 
                title="إنشاء حساب جديد"
                description="انضم إلى منصة حلول الأجهزة الطبية وابدأ في الاستفادة من خدماتنا"
                keywords="تسجيل، حساب جديد، انضمام"
              >
                <Signup />
              </RouteWrapper>
            } 
          />

          {/* Service Routes */}
          <Route 
            path="/maintenance" 
            element={
              <RouteWrapper 
                title="خدمات الصيانة"
                description="خدمات صيانة شاملة واحترافية لجميع أنواع الأجهزة الطبية"
                keywords="صيانة أجهزة طبية، إصلاح، فنيين، صيانة دورية"
              >
                <Maintenance />
              </RouteWrapper>
            } 
          />
          <Route 
            path="/rental" 
            element={
              <RouteWrapper 
                title="إيجار الأجهزة الطبية"
                description="استأجر أحدث الأجهزة الطبية بأسعار مناسبة ومرونة في فترات الإيجار"
                keywords="إيجار أجهزة طبية، استئجار، تأجير معدات"
              >
                <Rental />
              </RouteWrapper>
            } 
          />
          <Route 
            path="/sales" 
            element={
              <RouteWrapper 
                title="متجر الأجهزة الطبية"
                description="اشتري أجهزة طبية عالية الجودة بأفضل الأسعار مع ضمان شامل"
                keywords="شراء أجهزة طبية، متجر، معدات طبية، بيع"
              >
                <Sales />
              </RouteWrapper>
            } 
          />

          {/* Dynamic Service Routes */}
          <Route 
            path="/services/:serviceId" 
            element={
              <RouteWrapper title="تفاصيل الخدمة">
                <ServiceDetails />
              </RouteWrapper>
            } 
          />

          {/* Category Routes */}
          <Route 
            path="/category/:categorySlug" 
            element={
              <RouteWrapper>
                <CategoryPage />
              </RouteWrapper>
            } 
          />

          {/* Product Routes */}
          <Route 
            path="/product/:productId" 
            element={
              <RouteWrapper>
                <ProductDetails />
              </RouteWrapper>
            } 
          />

          {/* Provider Routes */}
          <Route 
            path="/provider/:providerId" 
            element={
              <RouteWrapper>
                <ProviderProfile />
              </RouteWrapper>
            } 
          />
          <Route 
            path="/provider-signup" 
            element={
              <RouteWrapper 
                title="تسجيل مقدم خدمة"
                description="انضم إلى شبكتنا من مقدمي الخدمات المعتمدين"
                keywords="مقدم خدمة، تسجيل، شراكة، أعمال"
              >
                <ProviderSignup />
              </RouteWrapper>
            } 
          />
          <Route 
            path="/provider-dashboard" 
            element={
              <RouteWrapper title="لوحة مقدم الخدمة">
                <ProviderDashboard />
              </RouteWrapper>
            } 
          />

          {/* User Routes */}
          <Route 
            path="/profile" 
            element={
              <RouteWrapper title="الملف الشخصي">
                <Profile />
              </RouteWrapper>
            } 
          />
          <Route 
            path="/cart" 
            element={
              <RouteWrapper title="سلة التسوق">
                <Cart />
              </RouteWrapper>
            } 
          />

          {/* Support Routes */}
          <Route 
            path="/support" 
            element={
              <RouteWrapper 
                title="مركز الدعم والمساعدة"
                description="فريق دعم متخصص متاح 24/7 لمساعدتك"
                keywords="دعم، مساعدة، خدمة عملاء، مساندة"
              >
                <Support />
              </RouteWrapper>
            } 
          />

          {/* Order Routes */}
          <Route 
            path="/order/:orderId" 
            element={
              <RouteWrapper title="تتبع الطلب">
                <OrderTracking />
              </RouteWrapper>
            } 
          />
          <Route
            path="/order-tracking"
            element={
              <RouteWrapper title="تتبع الطلبات">
                <OrderTracking />
              </RouteWrapper>
            }
          />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <RouteWrapper title="لوحة الإدارة">
                <AdminDashboard />
              </RouteWrapper>
            }
          />

          {/* Messages Route */}
          <Route
            path="/messages"
            element={
              <RouteWrapper title="الرسائل">
                <Messages />
              </RouteWrapper>
            }
          />

          {/* Help Center Route */}
          <Route
            path="/help"
            element={
              <RouteWrapper
                title="مركز المساعدة"
                description="مركز شامل للمساعدة والدعم الفني"
                keywords="مساعدة، دعم، أسئلة، حلول"
              >
                <HelpCenter />
              </RouteWrapper>
            }
          />

          {/* Payment Route */}
          <Route
            path="/payment"
            element={
              <RouteWrapper title="الدفع">
                <Payment />
              </RouteWrapper>
            }
          />

          {/* Search Routes */}
          <Route 
            path="/search" 
            element={
              <RouteWrapper title="نتائج البحث">
                <SearchResults />
              </RouteWrapper>
            } 
          />

          {/* Redirect old URLs for SEO */}
          <Route path="/home" element={<Navigate to="/" replace />} />
          <Route path="/shop" element={<Navigate to="/sales" replace />} />
          <Route path="/rent" element={<Navigate to="/rental" replace />} />
          <Route path="/repair" element={<Navigate to="/maintenance" replace />} />

          {/* 404 Route - Must be last */}
          <Route 
            path="*" 
            element={
              <RouteWrapper title="الصفحة غير موجودة">
                <NotFound />
              </RouteWrapper>
            } 
          />
        </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
