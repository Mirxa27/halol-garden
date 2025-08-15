import Navigation from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Construction } from "lucide-react";
import { Link } from "react-router-dom";

interface PlaceholderPageProps {
  title: string;
  arabicTitle: string;
  description: string;
  arabicDescription: string;
}

export default function PlaceholderPage({ 
  title, 
  arabicTitle, 
  description, 
  arabicDescription 
}: PlaceholderPageProps) {
  return (
    <div className="min-h-screen medical-bg" dir="rtl">
      <Navigation />
      
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="glass-card rounded-3xl p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Construction className="h-8 w-8 text-primary" />
            </div>
            
            <h1 className="text-4xl font-bold text-primary mb-4 text-arabic">
              {arabicTitle}
            </h1>
            <h2 className="text-2xl text-muted-foreground mb-6">
              {title}
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8 text-arabic leading-relaxed">
              {arabicDescription}
            </p>
            <p className="text-muted-foreground mb-8">
              {description}
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
                هذه الصفحة قيد التطوير. سيتم إضافة المحتوى قريباً.
              </p>
              <p className="text-xs text-muted-foreground mt-2">
                This page is under development. Content will be added soon.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}