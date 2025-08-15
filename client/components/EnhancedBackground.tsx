import React from "react";

export function EnhancedBackground() {
  return (
    <>
      {/* Main enhanced background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Sophisticated base gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: `
              linear-gradient(150deg,
                hsl(0 0 100) 0%,
                hsl(0 0 99) 25%,
                hsl(0 0 98) 50%,
                hsl(0 0 99) 75%,
                hsl(0 0 100) 100%)
            `,
          }}
        />

        {/* Sophisticated animated floating elements */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            background: `
              radial-gradient(ellipse 800px 600px at 18% 12%, hsla(0, 0%, 95%, 0.02) 0%, transparent 45%),
              radial-gradient(ellipse 700px 500px at 82% 28%, hsla(0, 0%, 96%, 0.015) 0%, transparent 42%),
              radial-gradient(ellipse 600px 800px at 42% 88%, hsla(0, 0%, 97%, 0.01) 0%, transparent 38%),
              radial-gradient(ellipse 500px 400px at 75% 65%, hsla(0, 0%, 98%, 0.005) 0%, transparent 35%)
            `,
            animation: "float 35s ease-in-out infinite",
          }}
        />

        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `
              linear-gradient(hsla(255, 255, 255, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, hsla(255, 255, 255, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Sophisticated floating particles */}
      <div
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
        style={{
          color: "rgba(0, 0, 0, 0.1)",
          backgroundColor: "rgba(255, 255, 255, 1)",
        }}
      >
        <div
          className="absolute w-1.5 h-1.5 rounded-full animate-pulse opacity-60"
          style={{
            top: "18%",
            left: "12%",
            background: "hsla(0, 0%, 85%, 0.1)",
            animationDelay: "0s",
            animationDuration: "6s",
            filter: "blur(0.5px)",
          }}
        />
        <div
          className="absolute w-1 h-1 rounded-full animate-pulse opacity-50"
          style={{
            top: "65%",
            left: "78%",
            background: "hsla(0, 0%, 90%, 0.08)",
            animationDelay: "1.5s",
            animationDuration: "4s",
            filter: "blur(0.3px)",
          }}
        />
        <div
          className="absolute w-2 h-2 rounded-full animate-pulse opacity-40"
          style={{
            top: "42%",
            left: "68%",
            background: "hsla(0, 0%, 92%, 0.06)",
            animationDelay: "3s",
            animationDuration: "7s",
            filter: "blur(0.4px)",
          }}
        />
        <div
          className="absolute w-1.5 h-1.5 rounded-full animate-pulse opacity-45"
          style={{
            top: "82%",
            left: "22%",
            background: "hsla(0, 0%, 88%, 0.07)",
            animationDelay: "0.8s",
            animationDuration: "5s",
            filter: "blur(0.3px)",
          }}
        />
        <div
          className="absolute w-1 h-1 rounded-full animate-pulse opacity-35"
          style={{
            top: "28%",
            left: "52%",
            background: "hsla(0, 0%, 94%, 0.05)",
            animationDelay: "2.2s",
            animationDuration: "5.5s",
            filter: "blur(0.2px)",
          }}
        />
        <div
          className="absolute w-1.5 h-1.5 rounded-full animate-pulse opacity-38"
          style={{
            top: "55%",
            left: "35%",
            background: "hsla(0, 0%, 86%, 0.06)",
            animationDelay: "1.8s",
            animationDuration: "6.5s",
            filter: "blur(0.4px)",
          }}
        />
      </div>
    </>
  );
}
