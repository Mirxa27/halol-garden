import React from 'react';
import { useAuthGuard } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ShieldX, LogIn } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'user' | 'provider' | 'admin';
  fallback?: React.ReactNode;
}

export function ProtectedRoute({ 
  children, 
  requiredRole, 
  fallback 
}: ProtectedRouteProps) {
  const { hasAccess, isAuthenticated, user } = useAuthGuard(requiredRole);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="glass-card max-w-md w-full">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 mx-auto mb-6 bg-destructive/10 rounded-full flex items-center justify-center">
              <ShieldX className="h-8 w-8 text-destructive" />
            </div>
            
            <h2 className="text-2xl font-bold text-primary mb-4 text-arabic">
              {!isAuthenticated ? 'يجب تسجيل الدخول' : 'غير مصرح لك بالدخول'}
            </h2>
            
            <p className="text-muted-foreground mb-6 text-arabic">
              {!isAuthenticated 
                ? 'يجب تسجيل الدخول للوصول إلى هذه الصفحة'
                : `هذه الصفحة مخصصة لـ ${getRoleDisplayName(requiredRole)} فقط`
              }
            </p>

            {!isAuthenticated ? (
              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.href = '/login'}
                  className="w-full text-arabic"
                >
                  <LogIn className="ml-2 h-4 w-4" />
                  تسجيل الدخول
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/signup'}
                  className="w-full text-arabic"
                >
                  إنشاء حساب جديد
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground text-arabic">
                  أنت مسجل الدخول كـ: {getRoleDisplayName(user?.role)}
                </p>
                <Button 
                  variant="outline"
                  onClick={() => window.location.href = '/'}
                  className="w-full text-arabic"
                >
                  العودة للرئيسية
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}

function getRoleDisplayName(role?: 'user' | 'provider' | 'admin'): string {
  switch (role) {
    case 'admin':
      return 'المدراء';
    case 'provider':
      return 'مقدمي الخدمات';
    case 'user':
      return 'المستخدمين';
    default:
      return 'المستخدمين المصرح لهم';
  }
}

export default ProtectedRoute;
