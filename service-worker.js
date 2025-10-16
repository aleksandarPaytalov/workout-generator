/**
 * Service Worker for Workout Generator PWA
 * Handles caching and offline functionality
 */

// Cache version - increment this when you want to force cache update
const CACHE_VERSION = "v1.0.0";
const CACHE_NAME = `workout-generator-${CACHE_VERSION}`;

// Cache configuration
const CACHE_CONFIG = {
  maxSize: 50 * 1024 * 1024, // 50MB maximum cache size
  maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days in milliseconds
  maxEntries: 100, // Maximum number of cached entries
};

// Files to cache for offline functionality
const ASSETS_TO_CACHE = [
  // Core HTML
  "/",
  "/index.html",

  // Manifest
  "/manifest.json",

  // CSS Files
  "/css/all-styles.css",
  "/css/animations.css",
  "/css/components.css",
  "/css/history-animations.css",
  "/css/history-base.css",
  "/css/history-card-actions.css",
  "/css/history-card-base.css",
  "/css/history-card-exercises.css",
  "/css/history-card-header.css",
  "/css/history-card-rating-notes.css",
  "/css/history-card-responsive.css",
  "/css/history-card-stats.css",
  "/css/history-pagination.css",
  "/css/history-search.css",
  "/css/history-states.css",
  "/css/history.css",
  "/css/main.css",
  "/css/mobile.css",
  "/css/reset.css",
  "/css/stats.css",
  "/css/theme-toggle.css",
  "/css/theme.css",
  "/css/timer.css",
  "/css/typography.css",
  "/css/utilities.css",
  "/css/variables.css",
  "/css/components/timer-settings.css",

  // JavaScript Files
  "/js/all-scripts.js",
  "/js/app.js",
  "/js/components/historyUI.js",
  "/js/components/timerUI.js",
  "/js/config/loggerConfig.js",
  "/js/config/version.js",
  "/js/modules/audioManager.js",
  "/js/modules/dragDrop.js",
  "/js/modules/exerciseDatabase.js",
  "/js/modules/exerciseGenerator.js",
  "/js/modules/footerController.js",
  "/js/modules/historyController.js",
  "/js/modules/pdfExport.js",
  "/js/modules/storageManager.js",
  "/js/modules/themeController.js",
  "/js/modules/timerController.js",
  "/js/modules/timerSettings.js",
  "/js/modules/uiController.js",
  "/js/modules/validators.js",
  "/js/modules/workoutHistory.js",
  "/js/modules/workoutTimer.js",
  "/js/utils/logger.js",

  // PWA Icons
  "/assets/icons/icon-72x72.png",
  "/assets/icons/icon-96x96.png",
  "/assets/icons/icon-128x128.png",
  "/assets/icons/icon-144x144.png",
  "/assets/icons/icon-152x152.png",
  "/assets/icons/icon-192x192.png",
  "/assets/icons/icon-384x384.png",
  "/assets/icons/icon-512x512.png",
  "/assets/icons/icon-maskable-192x192.png",
  "/assets/icons/icon-maskable-512x512.png",
];

/**
 * Cache Management Functions
 */

/**
 * Clean up old cache entries based on age
 * @param {Cache} cache - The cache to clean
 */
async function cleanupOldEntries(cache) {
  const requests = await cache.keys();
  const now = Date.now();

  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const cachedDate = new Date(response.headers.get("date")).getTime();
      const age = now - cachedDate;

      if (age > CACHE_CONFIG.maxAge) {
        console.log("[Service Worker] Removing old cache entry:", request.url);
        await cache.delete(request);
      }
    }
  }
}

/**
 * Limit cache size by removing oldest entries
 * @param {Cache} cache - The cache to limit
 */
async function limitCacheSize(cache) {
  const requests = await cache.keys();

  if (requests.length > CACHE_CONFIG.maxEntries) {
    const entriesToRemove = requests.length - CACHE_CONFIG.maxEntries;
    console.log(
      `[Service Worker] Cache has ${requests.length} entries, removing ${entriesToRemove} oldest`
    );

    // Remove oldest entries (first in the array)
    for (let i = 0; i < entriesToRemove; i++) {
      await cache.delete(requests[i]);
    }
  }
}

/**
 * Get total cache size
 * @param {Cache} cache - The cache to measure
 * @returns {Promise<number>} Size in bytes
 */
async function getCacheSize(cache) {
  const requests = await cache.keys();
  let totalSize = 0;

  for (const request of requests) {
    const response = await cache.match(request);
    if (response) {
      const blob = await response.blob();
      totalSize += blob.size;
    }
  }

  return totalSize;
}

/**
 * Install Event
 * Fired when the service worker is first installed
 * Caches all necessary assets for offline use
 */
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing service worker...", CACHE_VERSION);

  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        console.log("[Service Worker] Caching app shell and assets");
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log("[Service Worker] All assets cached successfully");
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error("[Service Worker] Failed to cache assets:", error);
      })
  );
});

/**
 * Activate Event
 * Fired when the service worker becomes active
 * Cleans up old caches from previous versions
 */
self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating service worker...", CACHE_VERSION);

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            // Delete old caches that don't match current version
            if (cacheName !== CACHE_NAME) {
              console.log("[Service Worker] Deleting old cache:", cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(async () => {
        console.log("[Service Worker] Old caches cleaned up");

        // Clean up old entries in current cache
        const cache = await caches.open(CACHE_NAME);
        await cleanupOldEntries(cache);

        // Limit cache size
        await limitCacheSize(cache);

        // Log cache size
        const cacheSize = await getCacheSize(cache);
        const cacheSizeMB = (cacheSize / (1024 * 1024)).toFixed(2);
        console.log(`[Service Worker] Current cache size: ${cacheSizeMB} MB`);

        // Take control of all pages immediately
        return self.clients.claim();
      })
      .catch((error) => {
        console.error("[Service Worker] Failed to clean up old caches:", error);
      })
  );
});

/**
 * Fetch Event
 * Intercepts all network requests
 * Implements caching strategy for offline functionality
 *
 * Strategy: Cache First (with Network Fallback)
 * - Try to serve from cache first
 * - If not in cache, fetch from network
 * - Cache the network response for future use
 */
self.addEventListener("fetch", (event) => {
  // Skip non-GET requests
  if (event.request.method !== "GET") {
    return;
  }

  // Skip external requests (CDN, external APIs)
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response if found
      if (cachedResponse) {
        console.log("[Service Worker] Serving from cache:", event.request.url);
        return cachedResponse;
      }

      // Not in cache, fetch from network
      console.log("[Service Worker] Fetching from network:", event.request.url);
      return fetch(event.request)
        .then((networkResponse) => {
          // Check if valid response
          if (
            !networkResponse ||
            networkResponse.status !== 200 ||
            networkResponse.type === "error"
          ) {
            return networkResponse;
          }

          // Clone the response (can only be consumed once)
          const responseToCache = networkResponse.clone();

          // Cache the fetched response for future use
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
            console.log(
              "[Service Worker] Cached new resource:",
              event.request.url
            );
          });

          return networkResponse;
        })
        .catch((error) => {
          console.error("[Service Worker] Fetch failed:", error);
          // Could return offline fallback page here
          throw error;
        });
    })
  );
});

/**
 * Message Event
 * Handles messages from the main application
 * Allows communication between app and service worker
 */
self.addEventListener("message", (event) => {
  console.log("[Service Worker] Received message:", event.data);

  // Handle skip waiting message
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }

  // Handle cache clear message
  if (event.data && event.data.type === "CLEAR_CACHE") {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log("[Service Worker] Service worker script loaded");
