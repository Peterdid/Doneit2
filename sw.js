const cacheName = 'bible-dev-cache-v4'; // Incremented version for new caching

// Static assets to cache
const assetsToCache = [
  '/Doneit2/',
  '/Doneit2/index.html',
  '/Doneit2/manifest.json',
  '/Doneit2/icons/icon-192.png',
  '/Doneit2/icons/icon-512.png'
];

// Background images to cache
const bgImages = [
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&w=1470&q=80',
  'https://images.unsplash.com/photo-1521295121783-8a321d551ad2?auto=format&fit=crop&w=1470&q=80'
];

// Install: cache static assets + backgrounds
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(cacheName).then(cache => {
      return cache.addAll([...assetsToCache, ...bgImages]);
    })
  );
  self.skipWaiting();
});

// Activate: take control of clients immediately
self.addEventListener('activate', event => {
  event.waitUntil(clients.claim());
});

// Fetch: cache-first strategy with dynamic caching for API requests
self.addEventListener('fetch', event => {
  const requestUrl = new URL(event.request.url);

  // Dynamic caching for daily verse API
  if (requestUrl.origin === 'https://bible-api.com') {
    event.respondWith(
      caches.open(cacheName).then(cache => {
        return fetch(event.request)
          .then(response => {
            if (response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => caches.match(event.request));
      })
    );
    return;
  }

  // Default cache-first for static assets
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});

// Notification click: focus or open the app
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

// Periodic update: refresh daily verse cache once per day
self.addEventListener('periodicsync', event => {
  if (event.tag === 'update-daily-verse') {
    event.waitUntil(updateDailyVerseCache());
  }
});

// Function to update daily verse in cache
async function updateDailyVerseCache() {
  try {
    // Example: random book + chapter for daily verse
    const books = ['Genesis','Exodus','Leviticus','Numbers','Deuteronomy','Joshua','Judges','Ruth','1 Samuel','2 Samuel','1 Kings','2 Kings','Psalms','Proverbs','Isaiah','Jeremiah','Matthew','Mark','Luke','John','Romans','Philippians','James','1 Peter','Revelation'];
    const bookChapters = {Genesis:50,Exodus:40,Leviticus:27,Numbers:36,Deuteronomy:34,Joshua:24,Judges:21,Ruth:4,'1 Samuel':31,'2 Samuel':24,'1 Kings':22,'2 Kings':25,Psalms:150,Proverbs:31,Isaiah:66,Jeremiah:52,Matthew:28,Mark:16,Luke:24,John:21,Romans:16,Philippians:4,James:5,'1 Peter':5,Revelation:22};
    const book = books[Math.floor(Math.random() * books.length)];
    const chapter = Math.floor(Math.random() * bookChapters[book]) + 1;

    const response = await fetch(`https://bible-api.com/${encodeURIComponent(book + ' ' + chapter)}`);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(`/Doneit2/daily-verse`, response.clone());
    }
  } catch (err) {
    console.log('Failed to update daily verse cache:', err);
  }
    }
