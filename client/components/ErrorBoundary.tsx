import { Component, ErrorInfo, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  errorMessage: string;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    errorMessage: ""
  };

  public static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      errorMessage: error.message
    };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  private handleReload = () => {
    this.setState({ hasError: false, errorMessage: "" });
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ hasError: false, errorMessage: "" });
    window.location.href = "/";
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen medical-bg flex items-center justify-center px-4" dir="rtl">
          <div className="glass-card rounded-3xl p-12 text-center max-w-md w-full">
            <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
              <AlertTriangle className="h-8 w-8 text-destructive" />
            </div>
            
            <h1 className="text-2xl font-bold text-primary mb-4 text-arabic">
              حدث خطأ غير متوقع
            </h1>
            <h2 className="text-lg text-muted-foreground mb-6">
              Something went wrong
            </h2>
            
            <p className="text-muted-foreground mb-8 text-arabic leading-relaxed">
              نعتذر عن هذا الخطأ. يرجى إعادة المحاولة أو العودة إلى الصفحة الرئيسية.
            </p>
            
            {/* Error details for development */}
            {process.env.NODE_ENV === 'development' && this.state.errorMessage && (
              <div className="bg-destructive/10 rounded-lg p-4 mb-6 text-left">
                <p className="text-sm text-destructive font-mono break-all">
                  {this.state.errorMessage}
                </p>
              </div>
            )}
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={this.handleReload}
                className="bg-primary hover:bg-primary/90 text-arabic"
              >
                <RefreshCw className="ml-2 h-4 w-4" />
                إعادة المحاولة
              </Button>
              <Button 
                onClick={this.handleGoHome}
                variant="outline" 
                className="glass-hover border-primary/30 text-arabic"
              >
                <Home className="ml-2 h-4 w-4" />
                العودة للرئيسية
              </Button>
            </div>
            
            <div className="mt-8 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground text-arabic">
                إذا استمر الخطأ، يرجى التواصل مع فريق الدعم
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;