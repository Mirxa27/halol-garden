import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#000000" />
        <meta name="description" content="Medical Devices Marketplace - Your trusted platform for medical equipment sales, rentals, and maintenance services in the Arabic-speaking healthcare market." />
        <meta name="keywords" content="medical devices, healthcare equipment, medical supplies, equipment rental, maintenance services, Arabic, healthcare marketplace" />
        
        {/* Favicon */}
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Open Graph */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Medical Devices Marketplace" />
        <meta property="og:title" content="Medical Devices Marketplace" />
        <meta property="og:description" content="Your trusted platform for medical equipment sales, rentals, and maintenance services." />
        <meta property="og:image" content="/og-image.png" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Medical Devices Marketplace" />
        <meta name="twitter:description" content="Your trusted platform for medical equipment sales, rentals, and maintenance services." />
        <meta name="twitter:image" content="/twitter-image.png" />
        
        {/* Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Cairo:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}