#!/bin/bash
echo "Fixing Vercel deployment..."

# Create app/layout.tsx
cat > app/layout.tsx << 'EOF'
export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
EOF

# Create app/globals.css
cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;
EOF

# Remove conflicting pages
rm -f pages/index.tsx pages/_app.tsx pages/_document.tsx

# Test build
npm run build
