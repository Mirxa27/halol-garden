import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, AlertTriangle } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <Layout>
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
            <h2 className="text-3xl font-bold text-primary mb-4 text-arabic">
              الصفحة غير موجودة
            </h2>
            <h3 className="text-xl text-muted-foreground mb-6">
              Page Not Found
            </h3>
            
            <p className="text-lg text-muted-foreground mb-8 text-arabic leading-relaxed">
              عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها إلى موقع آخر.
            </p>
            <p className="text-muted-foreground mb-8">
              Sorry, the page you are looking for does not exist or has been moved.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/">
                <Button className="bg-primary hover:bg-primary/90 rounded-full text-arabic">
                  <ArrowRight className="ml-2 h-4 w-4" />
                  العودة للرئيسية
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="glass-hover border-primary/30 rounded-full text-arabic"
                onClick={() => window.history.back()}
              >
                الصفحة السابقة
              </Button>
            </div>
            
            <div className="mt-8 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground text-arabic">
                إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع فريق الدعم.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                If you believe this is an error, please contact our support team.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
