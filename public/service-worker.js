// Digital Grandpa Service Worker
// Version 1.0.0

const CACHE_NAME = 'digital-grandpa-v1';
const CACHE_VERSION = '1.0.0';

// Files to cache for offline functionality
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',
  '/script.js',
  '/manifest.json',
  '/favicon.ico',
  '/icon-192.png',
  '/icon-512.png',
  '/profile-photo.jpg'
];

// Optional files that may not exist but we'll cache if available
const optionalFiles = [
  '/bob-photo.jpg',
  '/digital-grandpa-logo.png'
];

// Install event - cache files
self.addEventListener('install', (event) => {
  console.log('Digital Grandpa Service Worker installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        
        // Cache required files first
        return cache.addAll(urlsToCache)
          .then(() => {
            // Try to cache optional files without failing if they don't exist
            return Promise.allSettled(
              optionalFiles.map(url => 
                fetch(url)
                  .then(response => {
                    if (response.ok) {
                      return cache.put(url, response);
                    }
                  })
                  .catch(() => {
                    // Silently ignore missing optional files
                    console.log(`Optional file ${url} not found, skipping`);
                  })
              )
            );
          });
      })
      .then(() => {
        console.log('Digital Grandpa files cached successfully');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Digital Grandpa Service Worker activating...');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete old caches that don't match current version
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          console.log('Serving from cache:', event.request.url);
          return response;
        }

        // Otherwise fetch from network
        console.log('Fetching from network:', event.request.url);
        return fetch(event.request)
          .then((response) => {
            // Don't cache if not a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response since it's a stream
            const responseToCache = response.clone();

            // Add to cache for future use
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(() => {
            // Network failed, check if we have an offline fallback
            if (event.request.destination === 'document') {
              return caches.match('/index.html');
            }
            
            // For other resources, return a simple offline message
            return new Response(
              'Offline - Please check your internet connection',
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/plain'
                })
              }
            );
          });
      })
  );
});

// Handle background sync for form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'email-submission') {
    event.waitUntil(
      // Handle offline form submissions when back online
      handleOfflineSubmissions()
    );
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  console.log('Push message received:', event);
  
  const options = {
    body: 'New content available from Digital Grandpa!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Content',
        icon: '/icon-192.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icon-192.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Digital Grandpa', options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);
  
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app when notification is clicked
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Function to handle offline form submissions
async function handleOfflineSubmissions() {
  try {
    // Check if we have any pending email submissions stored in IndexedDB
    // This would be implemented based on your offline storage strategy
    console.log('Checking for offline form submissions...');
    
    // Implementation would go here to sync offline data
    // For now, just log that we're handling it
    console.log('Offline submissions handled');
  } catch (error) {
    console.error('Error handling offline submissions:', error);
  }
}

// Handle service worker updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Log service worker status
console.log('Digital Grandpa Service Worker loaded successfully');

// Send analytics about service worker usage
self.addEventListener('fetch', (event) => {
  // Track offline usage for analytics
  if (!navigator.onLine) {
    // Could send analytics data when back online
    console.log('App accessed while offline');
  }
});