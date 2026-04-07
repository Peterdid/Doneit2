const cacheName = 'bible-dev-cache-v4';

const assetsToCache = [
  '/Doneit2/',
  '/Doneit2/index.html',
  '/Doneit2/manifest.json',
  '/Doneit2/icons/icon-192.png',
  '/Doneit2/icons/icon-512.png'
];

const bgImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1470&q=80'
];

// INSTALL: Pre-cache app assets & backgrounds
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll([...assetsToCache, ...bgImages]);
    })
  );
  self.skipWaiting();
});

// ACTIVATE: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys
          .filter(key => key !== cacheName)
          .map(key => caches.delete(key))
      );
    }).then(() => clients.claim())
  );
});

// FETCH: Serve cached first, then network, then update cache dynamically
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Special caching for Bible API daily verse
  if(requestUrl.origin === 'https://bible-api.com') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        if(cached) return cached;

        return fetch(event.request).then(networkResponse => {
          return caches.open(cacheName).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }).catch(() => {
          return new Response(JSON.stringify({
            verses: [{ text: 'Could not load verse.', verse: 0, book_name: '', chapter: 0 }]
          }), { headers: { 'Content-Type': 'application/json' }});
        });
      })
    );
    return;
  }

  // General caching for assets & backgrounds
  event.respondWith(
    caches.match(event.request).then(response => {
      if(response) return response;

      return fetch(event.request).then(networkResponse => {
        // Update cache dynamically
        return caches.open(cacheName).then(cache => {
          cache.put(event.request, networkResponse.clone());
          return networkResponse;
        });
      }).catch(() => {
        // Optional: fallback offline page or image
        // return caches.match('/Doneit2/offline.html');
      });
    })
  );
});

// NOTIFICATION CLICK: Focus app window
self.addEventListener('notificationclick', event => {
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      for (const client of windowClients) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/Doneit2/');
    })
  );
});
