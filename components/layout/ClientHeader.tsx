'use client';

import dynamic from 'next/dynamic';

const Header = dynamic(() => import('./Header').then(mod => mod.Header), {
  ssr: false,
  loading: () => (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center">
            <span className="text-2xl font-bold text-primary">Halol Garden</span>
          </div>
        </div>
      </nav>
    </header>
  ),
});

export { Header as ClientHeader };