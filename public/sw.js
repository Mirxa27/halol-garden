// Service Worker for Advanced Caching
const CACHE_VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;
const IMAGE_CACHE = `images-${CACHE_VERSION}`;

// Cache time-to-live settings (in milliseconds)
const CACHE_TTL = {
  static: 7 * 24 * 60 * 60 * 1000,    // 7 days
  api: 5 * 60 * 1000,                  // 5 minutes
  images: 24 * 60 * 60 * 1000,         // 24 hours
  pages: 60 * 60 * 1000,               // 1 hour
};

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/logo.png',
  '/favicon.ico',
  // Add critical CSS and JS files
];

// API endpoints that should be cached
const CACHEABLE_APIS = [
  '/api/services',
  '/api/categories',
  '/api/providers',
  '/api/config',
];

// Install event - cache static assets
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    Promise.all([
      // Cache static assets
      caches.open(STATIC_CACHE).then((cache) => {
        return cache.addAll(STATIC_ASSETS.map(url => new Request(url, {
          cache: 'reload'
        })));
      }),
      
      // Skip waiting to activate immediately
      self.skipWaiting()
    ])
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    Promise.all(
      [
        // Clean up old caches
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName.includes('static-') && cacheName !== STATIC_CACHE) {
                console.log('Deleting old static cache:', cacheName);
                return caches.delete(cacheName);
              }
              if (cacheName.includes('dynamic-') && cacheName !== DYNAMIC_CACHE) {
                console.log('Deleting old dynamic cache:', cacheName);
                return caches.delete(cacheName);
              }
              if (cacheName.includes('api-') && cacheName !== API_CACHE) {
                console.log('Deleting old API cache:', cacheName);
                return caches.delete(cacheName);
              }
              if (cacheName.includes('images-') && cacheName !== IMAGE_CACHE) {
                console.log('Deleting old image cache:', cacheName);
                return caches.delete(cacheName);
              }
              return Promise.resolve(); // Ensure a Promise is returned for all cases
            })
          );
        }),
        
        // Take control of all pages
        self.clients.claim()
      ]
    )
  );
});

// Fetch event - handle all network requests
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }
  
  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }
  
  // Handle different types of requests
  if (isAPIRequest(url)) {
    event.respondWith(handleAPIRequest(request));
  } else if (isImageRequest(url)) {
    event.respondWith(handleImageRequest(request));
  } else if (isStaticAsset(url)) {
    event.respondWith(handleStaticRequest(request));
  } else {
    event.respondWith(handlePageRequest(request));
  }
});

// Handle API requests with network-first strategy
async function handleAPIRequest(request: Request) {
  const url = new URL(request.url);
  
  // Check if this API should be cached
  const shouldCache = CACHEABLE_APIS.some(pattern => 
    url.pathname.startsWith(pattern)
  );
  
  if (!shouldCache) {
    return fetch(request);
  }
  
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful responses
      const cache = await caches.open(API_CACHE);
      const responseClone = networkResponse.clone();
      
      // Add timestamp for TTL
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const modifiedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('Network failed for API request, trying cache:', request.url);
    
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      // Check if cached response is still valid
      const cachedAt = cachedResponse.headers.get('sw-cached-at');
      const isExpired = cachedAt && 
        (Date.now() - parseInt(cachedAt)) > CACHE_TTL.api;
      
      if (!isExpired) {
        return cachedResponse;
      }
    }
    
    // Return error response
    return new Response(
      JSON.stringify({ error: 'Network unavailable' }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Handle image requests with cache-first strategy
async function handleImageRequest(request: Request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    // Check TTL
    const cachedAt = cachedResponse.headers.get('sw-cached-at');
    const isExpired = cachedAt && 
      (Date.now() - parseInt(cachedAt)) > CACHE_TTL.images;
    
    if (!isExpired) {
      return cachedResponse;
    }
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(IMAGE_CACHE);
      const responseClone = networkResponse.clone();
      
      // Add timestamp
      const headers = new Headers(responseClone.headers);
      headers.set('sw-cached-at', Date.now().toString());
      
      const modifiedResponse = new Response(responseClone.body, {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers: headers
      });
      
      cache.put(request, modifiedResponse);
    }
    
    return networkResponse;
  } catch (error) {
    // Return cached version if available
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return placeholder image
    return new Response(
      '<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f0f0f0"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#999">Image Unavailable</text></svg>',
      {
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request: Request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Failed to fetch static asset:', request.url);
    throw error;
  }
}

// Handle page requests with network-first strategy
async function handlePageRequest(request: Request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Try cache
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline.html');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Last resort - basic offline message
    return new Response(
      `
      <!DOCTYPE html>
      <html dir="rtl">
      <head>
        <meta charset="utf-8">
        <title>غير متصل - Offline</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            text-align: center; 
            padding: 50px;
            background: linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%);
          }
          .container {
            max-width: 500px;
            margin: 0 auto;
            background: white;
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
          }
          h1 { color: #1976d2; margin-bottom: 20px; }
          p { color: #666; line-height: 1.6; }
          .retry-btn {
            background: #1976d2;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            cursor: pointer;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>غير متصل بالإنترنت</h1>
          <p>يبدو أنك غير متصل بالإنترنت. يرجى التحقق من اتصالك والمحاولة مرة أخرى.</p>
          <button class="retry-btn" onclick="window.location.reload()">
            المحاولة مرة أخرى
          </button>
        </div>
      </body>
      </html>
      `,
      {
        headers: {
          'Content-Type': 'text/html',
          'Cache-Control': 'no-cache'
        }
      }
    );
  }
}

// Utility functions
function isAPIRequest(url: URL) {
  return url.pathname.startsWith('/api/');
}

function isImageRequest(url: URL) {
  return /\.(jpg|jpeg|png|gif|webp|svg|ico)$/i.test(url.pathname);
}

function isStaticAsset(url: URL) {
  return /\.(js|css|woff|woff2|ttf|eot)$/i.test(url.pathname) ||
         url.pathname === '/manifest.json' ||
         url.pathname === '/favicon.ico';
}

// Message handling for cache management
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { data } = event;
  
  switch (data.type) {
    case 'UPDATE_CACHE':
      updateSpecificCaches(data.cacheNames);
      break;
      
    case 'CLEAR_OLD_CACHES':
      clearOldCaches();
      break;
      
    case 'GET_CACHE_STATS':
      getCacheStats().then(stats => {
        if (event.source) {
          event.source.postMessage({ type: 'CACHE_STATS', stats });
        }
      });
      break;
      
    case 'PRELOAD_URLS':
      preloadUrls(data.urls);
      break;
  }
});

// Update specific caches
async function updateSpecificCaches(cacheNames: string[]) {
  for (const cacheName of cacheNames) {
    try {
      await caches.delete(cacheName);
      console.log('Cache updated:', cacheName);
    } catch (error) {
      console.error('Failed to update cache:', cacheName, error);
    }
  }
}

// Clear old caches
async function clearOldCaches() {
  const cacheNames = await caches.keys();
  
  await Promise.all(
    cacheNames.map(cacheName => {
      if (!cacheName.includes(CACHE_VERSION)) {
        console.log('Clearing old cache:', cacheName);
        return caches.delete(cacheName);
      }
      return Promise.resolve(); // Ensure a Promise is returned for all cases
    })
  );
}

// Get cache statistics
async function getCacheStats() {
  const cacheNames = await caches.keys();
  const stats: { [key: string]: { count: number; urls: string[] } } = {};
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    stats[cacheName] = {
      count: keys.length,
      urls: keys.map(req => req.url)
    };
  }
  
  return stats;
}

// Preload URLs
async function preloadUrls(urls: string[]) {
  const cache = await caches.open(DYNAMIC_CACHE);
  
  await Promise.all(
    urls.map(async (url) => {
      try {
        const response = await fetch(url);
        if (response.ok) {
          await cache.put(url, response);
          console.log('Preloaded:', url);
        }
      } catch (error) {
        console.warn('Failed to preload:', url, error);
      }
    })
  );
}

// Background sync for offline actions
self.addEventListener('sync', (event: SyncEvent) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync());
  }
});

async function handleBackgroundSync() {
  // Handle offline actions when connection is restored
  console.log('Background sync triggered');
  
  // You can implement offline action queuing here
  // For example, sync form submissions, API calls, etc.
}

console.log('Service Worker loaded successfully');