// TripSync PWA Service Worker - Enhanced for iOS, Android, and Web
const CACHE_NAME = "tripsync-v4-enhanced";
const RUNTIME_CACHE = "tripsync-runtime-v4";
const IMAGE_CACHE = "tripsync-images-v4";

// Assets to cache immediately on install
const PRECACHE_ASSETS = [
  "/",
  "/index.html",
  "/favicon.png",
  "/icon-192x192.png",
  "/icon-512x512.png"
];

// Cache strategies
const CACHE_STRATEGIES = {
  CACHE_FIRST: "cache-first",
  NETWORK_FIRST: "network-first",
  STALE_WHILE_REVALIDATE: "stale-while-revalidate",
  NETWORK_ONLY: "network-only"
};

// Install event - precache essential assets
self.addEventListener("install", (event) => {
  console.log("[SW] Installing service worker...");
  self.skipWaiting(); // Activate immediately

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("[SW] Precaching app shell");
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
});

// Activate event - clean up old caches
self.addEventListener("activate", (event) => {
  console.log("[SW] Activating service worker...");

  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => {
            // Delete old caches
            return name.startsWith("tripsync-") &&
                   name !== CACHE_NAME &&
                   name !== RUNTIME_CACHE &&
                   name !== IMAGE_CACHE;
          })
          .map((name) => {
            console.log("[SW] Deleting old cache:", name);
            return caches.delete(name);
          })
      );
    })
  );

  self.clients.claim(); // Take control of all pages
});

// Fetch event - handle requests with different strategies
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== "GET") return;

  // Skip chrome extensions
  if (url.protocol === "chrome-extension:") return;

  // Determine strategy based on request type
  const strategy = getStrategyForRequest(request);

  event.respondWith(handleRequest(request, strategy));
});

// Get appropriate caching strategy for request
function getStrategyForRequest(request) {
  const url = new URL(request.url);

  // API requests - network first with fallback
  if (url.pathname.startsWith("/api/")) {
    // Trips data can be cached for offline
    if (url.pathname.includes("/api/trips/")) {
      return CACHE_STRATEGIES.NETWORK_FIRST;
    }
    // Auth, payments - always network
    return CACHE_STRATEGIES.NETWORK_ONLY;
  }

  // Images - cache first
  if (request.destination === "image") {
    return CACHE_STRATEGIES.CACHE_FIRST;
  }

  // Scripts, styles - stale while revalidate
  if (
    request.destination === "script" ||
    request.destination === "style" ||
    request.destination === "font"
  ) {
    return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
  }

  // HTML documents - network first
  if (request.destination === "document") {
    return CACHE_STRATEGIES.NETWORK_FIRST;
  }

  // Default - stale while revalidate
  return CACHE_STRATEGIES.STALE_WHILE_REVALIDATE;
}

// Handle request with appropriate strategy
async function handleRequest(request, strategy) {
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return cacheFirst(request);

    case CACHE_STRATEGIES.NETWORK_FIRST:
      return networkFirst(request);

    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return staleWhileRevalidate(request);

    case CACHE_STRATEGIES.NETWORK_ONLY:
      return networkOnly(request);

    default:
      return fetch(request);
  }
}

// Cache First Strategy
async function cacheFirst(request) {
  const cacheName = request.destination === "image" ? IMAGE_CACHE : RUNTIME_CACHE;
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  if (cached) {
    console.log("[SW] Cache hit:", request.url);
    return cached;
  }

  try {
    console.log("[SW] Cache miss, fetching:", request.url);
    const response = await fetch(request);

    if (response.ok) {
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.error("[SW] Fetch failed:", error);

    // Return offline page for documents
    if (request.destination === "document") {
      return caches.match("/");
    }

    throw error;
  }
}

// Network First Strategy
async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);

  try {
    const response = await fetch(request);

    if (response.ok) {
      // Clone and cache successful responses
      cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    console.log("[SW] Network failed, trying cache:", request.url);

    const cached = await cache.match(request);
    if (cached) {
      return cached;
    }

    // Fallback for documents
    if (request.destination === "document") {
      return caches.match("/");
    }

    throw error;
  }
}

// Stale While Revalidate Strategy
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  const cached = await cache.match(request);

  // Fetch in background to update cache
  const fetchPromise = fetch(request).then((response) => {
    if (response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  }).catch(() => null);

  // Return cached version immediately, or wait for network
  return cached || fetchPromise;
}

// Network Only Strategy
async function networkOnly(request) {
  return fetch(request);
}

// Background Sync for offline actions
self.addEventListener("sync", (event) => {
  console.log("[SW] Background sync:", event.tag);

  if (event.tag === "sync-offline-changes") {
    event.waitUntil(syncOfflineChanges());
  }
});

async function syncOfflineChanges() {
  console.log("[SW] Syncing offline changes...");

  try {
    // Get pending changes from IndexedDB or message clients
    const clients = await self.clients.matchAll();

    for (const client of clients) {
      client.postMessage({
        type: "SYNC_OFFLINE_CHANGES"
      });
    }
  } catch (error) {
    console.error("[SW] Sync failed:", error);
    throw error; // Retry sync
  }
}

// Push Notifications
self.addEventListener("push", (event) => {
  console.log("[SW] Push notification received");

  const data = event.data ? event.data.json() : {};
  const title = data.title || "TripSync";
  const options = {
    body: data.body || "You have a new notification",
    icon: data.icon || "/icon-192x192.png",
    badge: data.badge || "/icon-72x72.png",
    tag: data.tag || "tripsync-notification",
    data: data.url ? { url: data.url } : {},
    requireInteraction: data.requireInteraction || false,
    vibrate: [200, 100, 200], // Vibration pattern
    actions: data.actions || [
      {
        action: "view",
        title: "View",
        icon: "/icon-72x72.png"
      },
      {
        action: "dismiss",
        title: "Dismiss"
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification Click
self.addEventListener("notificationclick", (event) => {
  console.log("[SW] Notification clicked:", event.action);

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const urlToOpen = event.notification.data?.url || "/dashboard";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }

      // Open new window
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Message handling from clients
self.addEventListener("message", (event) => {
  console.log("[SW] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  if (event.data && event.data.type === "CLAIM_CLIENTS") {
    self.clients.claim();
  }

  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});

// Periodic Background Sync (for checking trip updates)
self.addEventListener("periodicsync", (event) => {
  console.log("[SW] Periodic sync:", event.tag);

  if (event.tag === "check-trip-updates") {
    event.waitUntil(checkTripUpdates());
  }
});

async function checkTripUpdates() {
  console.log("[SW] Checking for trip updates...");

  try {
    // Notify clients to refresh trip data
    const clients = await self.clients.matchAll();

    for (const client of clients) {
      client.postMessage({
        type: "CHECK_UPDATES"
      });
    }
  } catch (error) {
    console.error("[SW] Update check failed:", error);
  }
}

console.log("[SW] Service worker loaded");
