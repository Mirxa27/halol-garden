import React from 'react';

// Medical device illustrations as SVG components
export function MedicalDeviceIllustration({ type, className = "w-32 h-32" }: { type: 'xray' | 'ventilator' | 'monitor' | 'stethoscope', className?: string }) {
  const illustrations = {
    xray: (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="xrayGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* X-Ray Machine */}
        <rect x="40" y="60" width="120" height="80" rx="12" fill="url(#xrayGrad)" />
        <rect x="50" y="70" width="100" height="60" rx="8" fill="rgba(255,255,255,0.1)" />
        <circle cx="170" cy="90" r="15" fill="hsl(var(--accent))" fillOpacity="0.7" />
        <rect x="160" y="105" width="20" height="40" rx="4" fill="hsl(var(--primary))" fillOpacity="0.8" />
        {/* Base */}
        <rect x="30" y="140" width="140" height="20" rx="10" fill="hsl(var(--muted))" fillOpacity="0.6" />
        {/* Light rays */}
        <path d="M85 70 L85 55 M100 70 L100 55 M115 70 L115 55" stroke="hsl(var(--success))" strokeWidth="2" strokeOpacity="0.4" />
      </svg>
    ),
    ventilator: (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="ventGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Main unit */}
        <rect x="50" y="70" width="100" height="80" rx="16" fill="url(#ventGrad)" />
        <rect x="60" y="80" width="80" height="25" rx="8" fill="rgba(255,255,255,0.15)" />
        {/* Screen */}
        <rect x="70" y="85" width="60" height="15" rx="4" fill="hsl(var(--primary))" fillOpacity="0.3" />
        {/* Tubes */}
        <path d="M40 90 Q20 90 20 110 Q20 130 40 130" stroke="hsl(var(--accent))" strokeWidth="4" fill="none" />
        <path d="M160 90 Q180 90 180 110 Q180 130 160 130" stroke="hsl(var(--accent))" strokeWidth="4" fill="none" />
        {/* Wheels */}
        <circle cx="70" cy="160" r="8" fill="hsl(var(--muted))" fillOpacity="0.7" />
        <circle cx="130" cy="160" r="8" fill="hsl(var(--muted))" fillOpacity="0.7" />
        {/* Breathing indicator */}
        <circle cx="100" cy="95" r="3" fill="hsl(var(--success))" className="animate-pulse" />
      </svg>
    ),
    monitor: (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="monitorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Monitor body */}
        <rect x="30" y="50" width="140" height="100" rx="12" fill="url(#monitorGrad)" />
        {/* Screen */}
        <rect x="40" y="60" width="120" height="70" rx="8" fill="rgba(0,0,0,0.3)" />
        {/* Heart rate line */}
        <path d="M50 95 L70 95 L75 75 L80 115 L85 65 L90 95 L150 95" 
              stroke="hsl(var(--success))" strokeWidth="2" fill="none" className="animate-pulse" />
        {/* Control panel */}
        <rect x="40" y="135" width="120" height="10" rx="2" fill="rgba(255,255,255,0.1)" />
        {/* LEDs */}
        <circle cx="50" cy="140" r="2" fill="hsl(var(--success))" className="animate-pulse" />
        <circle cx="60" cy="140" r="2" fill="hsl(var(--destructive))" />
        <circle cx="70" cy="140" r="2" fill="hsl(var(--accent))" />
        {/* Stand */}
        <rect x="90" y="150" width="20" height="30" rx="4" fill="hsl(var(--muted))" fillOpacity="0.6" />
        <rect x="70" y="175" width="60" height="10" rx="5" fill="hsl(var(--muted))" fillOpacity="0.6" />
      </svg>
    ),
    stethoscope: (
      <svg viewBox="0 0 200 200" className={className} fill="none" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="stethoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Earpieces */}
        <circle cx="60" cy="40" r="8" fill="url(#stethoGrad)" />
        <circle cx="140" cy="40" r="8" fill="url(#stethoGrad)" />
        {/* Tubing */}
        <path d="M60 48 Q60 80 80 100" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeOpacity="0.8" />
        <path d="M140 48 Q140 80 120 100" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeOpacity="0.8" />
        <path d="M80 100 Q100 110 120 100" stroke="hsl(var(--primary))" strokeWidth="4" fill="none" strokeOpacity="0.8" />
        <path d="M100 105 L100 140" stroke="hsl(var(--primary))" strokeWidth="4" strokeOpacity="0.8" />
        {/* Chest piece */}
        <circle cx="100" cy="150" r="15" fill="url(#stethoGrad)" />
        <circle cx="100" cy="150" r="10" fill="rgba(255,255,255,0.2)" />
        <circle cx="100" cy="150" r="5" fill="hsl(var(--primary))" fillOpacity="0.6" />
        {/* Sound waves */}
        <circle cx="100" cy="150" r="20" stroke="hsl(var(--success))" strokeWidth="1" fill="none" strokeOpacity="0.3" className="animate-ping" />
        <circle cx="100" cy="150" r="25" stroke="hsl(var(--success))" strokeWidth="1" fill="none" strokeOpacity="0.2" className="animate-ping" style={{animationDelay: '0.5s'}} />
      </svg>
    )
  };

  return illustrations[type];
}

// Floating medical particles
export function MedicalParticles() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
         style={{ backgroundColor: 'rgba(255, 255, 255, 1)' }}>
      {/* Medical cross particles */}
      <div className="absolute w-4 h-4 text-success/20" 
           style={{ 
             top: '15%', 
             left: '8%', 
             animation: 'float 6s ease-in-out infinite'
           }}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </div>
      
      <div className="absolute w-3 h-3 text-primary/15" 
           style={{ 
             top: '70%', 
             left: '85%', 
             animation: 'float 4s ease-in-out infinite reverse',
             animationDelay: '1s'
           }}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/>
        </svg>
      </div>

      {/* Heart pulse particles */}
      <div className="absolute w-5 h-5 text-destructive/15" 
           style={{ 
             top: '45%', 
             left: '12%', 
             animation: 'pulse 2s ease-in-out infinite'
           }}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>

      {/* DNA helix particles */}
      <div className="absolute w-6 h-6 text-accent/12" 
           style={{ 
             top: '25%', 
             left: '75%', 
             animation: 'float 8s ease-in-out infinite',
             animationDelay: '2s'
           }}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M4 2h16v2H4V2zm0 18h16v2H4v-2zM2 6h2v12H2V6zm18 0h2v12h-2V6zM6 8h12v2H6V8zm0 6h12v2H6v-2z"/>
        </svg>
      </div>

      {/* Microscope particles */}
      <div className="absolute w-4 h-4 text-primary/10" 
           style={{ 
             top: '60%', 
             left: '25%', 
             animation: 'float 5s ease-in-out infinite',
             animationDelay: '3s'
           }}>
        <svg viewBox="0 0 24 24" fill="currentColor">
          <circle cx="12" cy="12" r="3"/>
          <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="2"/>
        </svg>
      </div>
    </div>
  );
}

// Enhanced service card with medical illustrations
export function EnhancedServiceCard({ 
  icon, 
  title, 
  description, 
  medicalDevice, 
  className = "" 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string; 
  medicalDevice: 'xray' | 'ventilator' | 'monitor' | 'stethoscope';
  className?: string;
}) {
  return (
    <div className={`service-card group cursor-pointer relative overflow-hidden ${className}`}>
      {/* Background medical device illustration */}
      <div className="absolute top-4 right-4 opacity-10 group-hover:opacity-20 transition-opacity duration-500">
        <MedicalDeviceIllustration type={medicalDevice} className="w-24 h-24" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
          {icon}
        </div>
        
        <h3 className="text-2xl font-bold text-primary mb-4 text-arabic group-hover:text-accent transition-colors duration-300">
          {title}
        </h3>
        
        <p className="text-muted-foreground text-arabic leading-relaxed group-hover:text-foreground transition-colors duration-300">
          {description}
        </p>
      </div>
      
      {/* Hover overlay effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl" />
      
      {/* Corner accent */}
      <div className="absolute bottom-0 right-0 w-12 h-12 bg-gradient-to-tl from-accent/20 to-transparent rounded-tl-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
    </div>
  );
}

// Medical statistics visualization
export function MedicalStats() {
  const stats = [
    { value: "500+", label: "أجهزة طبية", icon: "🏥" },
    { value: "24/7", label: "دعم فني", icon: "🔧" },
    { value: "99%", label: "رضا العملاء", icon: "⭐" },
    { value: "50+", label: "مقدم خدمة", icon: "👥" }
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="glass-card rounded-2xl p-6 text-center group hover:scale-105 transition-all duration-300">
          <div className="text-3xl mb-2">{stat.icon}</div>
          <div className="text-3xl font-bold text-primary mb-2 group-hover:text-accent transition-colors">
            {stat.value}
          </div>
          <div className="text-sm text-muted-foreground text-arabic">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
