export default function LoadingSpinner() {
  return (
    <div className="min-h-screen medical-bg flex items-center justify-center" dir="rtl">
      <div className="glass-card rounded-3xl p-12 text-center">
        <div className="relative w-16 h-16 mx-auto mb-6">
          {/* Medical cross icon with spinning animation */}
          <div className="absolute inset-0 animate-spin">
            <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full"></div>
          </div>
          <div className="absolute inset-4 bg-primary/10 rounded-lg flex items-center justify-center">
            <div className="w-4 h-6 bg-primary rounded-sm"></div>
            <div className="w-6 h-4 bg-primary rounded-sm absolute"></div>
          </div>
        </div>
        
        <h2 className="text-xl font-semibold text-primary mb-2 text-arabic">
          جاري التحميل...
        </h2>
        <p className="text-muted-foreground text-arabic">
          يرجى الانتظار بينما نحضر المحتوى لك
        </p>
        
        {/* Progress dots */}
        <div className="flex justify-center gap-1 mt-6">
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
      </div>
    </div>
  );
}
