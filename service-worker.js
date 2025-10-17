/**
 * Service Worker for Workout Generator PWA
 * Handles caching and offline functionality
 */

// Cache version - increment this when you want to force cache update
const CACHE_VERSION = "v1.2.1";
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
  "/offline.html",

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
  "/js/modules/serviceWorkerManager.js",
  "/js/modules/offlineIndicator.js",
  "/js/modules/installGuide.js",
  "/js/modules/dropdownMenu.js",
  "/js/utils/logger.js",
  "/js/utils/sanitizer.js",

  // CSS for PWA features
  "/css/install-guide.css",

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
 * Verify cache integrity
 * Checks if cache is healthy and contains expected assets
 * @param {Cache} cache - The cache to verify
 * @returns {Promise<boolean>} True if cache is healthy
 */
async function verifyCacheIntegrity(cache) {
  try {
    // Check if critical assets are cached
    const criticalAssets = ["/", "/index.html", "/offline.html"];

    for (const asset of criticalAssets) {
      const response = await cache.match(asset);
      if (!response) {
        console.warn(`[Service Worker] Cache missing critical asset: ${asset}`);
        return false;
      }
    }

    console.log("[Service Worker] Cache integrity verified");
    return true;
  } catch (error) {
    console.error("[Service Worker] Cache integrity check failed:", error);
    return false;
  }
}

/**
 * Rebuild cache if corrupted
 * Clears and rebuilds the cache with fresh assets
 * @returns {Promise<void>}
 */
async function rebuildCache() {
  try {
    console.log("[Service Worker] Rebuilding cache...");

    // Delete corrupted cache
    await caches.delete(CACHE_NAME);

    // Create fresh cache
    const cache = await caches.open(CACHE_NAME);
    await cache.addAll(ASSETS_TO_CACHE);

    console.log("[Service Worker] Cache rebuilt successfully");
  } catch (error) {
    console.error("[Service Worker] Cache rebuild failed:", error);
  }
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

        // Open current cache
        const cache = await caches.open(CACHE_NAME);

        // Verify cache integrity
        const isHealthy = await verifyCacheIntegrity(cache);
        if (!isHealthy) {
          console.warn("[Service Worker] Cache corrupted, rebuilding...");
          await rebuildCache();
        }

        // Clean up old entries in current cache
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
 * Check if request should use Stale While Revalidate strategy
 * @param {Request} request - The request to check
 * @returns {boolean} True if should use SWR
 */
function shouldUseStaleWhileRevalidate(request) {
  const url = new URL(request.url);
  const pathname = url.pathname;

  // Use SWR for HTML, CSS, and JS files (dynamic content)
  return (
    pathname.endsWith(".html") ||
    pathname.endsWith(".css") ||
    pathname.endsWith(".js") ||
    pathname === "/" ||
    pathname === "/index.html"
  );
}

/**
 * Stale While Revalidate Strategy
 * Serves cached content immediately, then updates cache in background
 * @param {Request} request - The request to handle
 * @returns {Promise<Response>}
 */
async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE_NAME);
  const cachedResponse = await cache.match(request);

  // Fetch from network in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      // Check if valid response
      if (
        networkResponse &&
        networkResponse.status === 200 &&
        networkResponse.type !== "error"
      ) {
        // Update cache with fresh content
        cache.put(request, networkResponse.clone());
        console.log("[Service Worker] Cache updated (SWR):", request.url);
      }
      return networkResponse;
    })
    .catch((error) => {
      console.log(
        "[Service Worker] Network fetch failed (SWR):",
        error.message
      );
      return null;
    });

  // Return cached response immediately if available
  if (cachedResponse) {
    console.log("[Service Worker] Serving from cache (SWR):", request.url);
    return cachedResponse;
  }

  // If no cache, wait for network
  console.log(
    "[Service Worker] No cache, waiting for network (SWR):",
    request.url
  );
  return fetchPromise;
}

/**
 * Cache First Strategy
 * Tries cache first, falls back to network
 * @param {Request} request - The request to handle
 * @returns {Promise<Response>}
 */
async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  // Return cached response if found
  if (cachedResponse) {
    console.log("[Service Worker] Serving from cache:", request.url);
    return cachedResponse;
  }

  // Not in cache, fetch from network
  console.log("[Service Worker] Fetching from network:", request.url);
  try {
    const networkResponse = await fetch(request);

    // Check if valid response
    if (
      networkResponse &&
      networkResponse.status === 200 &&
      networkResponse.type !== "error"
    ) {
      // Cache the fetched response for future use
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      console.log("[Service Worker] Cached new resource:", request.url);
    }

    return networkResponse;
  } catch (error) {
    console.error("[Service Worker] Fetch failed:", error);

    // Return offline page for navigation requests
    if (request.mode === "navigate") {
      const offlineResponse = await caches.match("/offline.html");
      if (offlineResponse) {
        console.log("[Service Worker] Serving offline page");
        return offlineResponse;
      }
    }

    throw error;
  }
}

/**
 * Fetch Event
 * Intercepts all network requests
 * Implements caching strategy for offline functionality
 *
 * Strategy:
 * - Stale While Revalidate for HTML/CSS/JS (dynamic content)
 * - Cache First for images/fonts/other assets (static content)
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

  // Choose strategy based on request type
  if (shouldUseStaleWhileRevalidate(event.request)) {
    event.respondWith(staleWhileRevalidate(event.request));
  } else {
    event.respondWith(cacheFirst(event.request));
  }
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

/**
 * Background Sync Event
 * Handles background sync when connection is restored
 * Simple implementation - ready for future backend integration
 */
self.addEventListener("sync", (event) => {
  console.log("[Service Worker] Background sync event:", event.tag);

  if (event.tag === "sync-workout-data") {
    event.waitUntil(syncWorkoutData());
  }
});

/**
 * Sync workout data (placeholder for future backend integration)
 * Currently just logs the sync event
 * @returns {Promise}
 */
async function syncWorkoutData() {
  console.log("[Service Worker] Syncing workout data...");

  try {
    // In the future, this would:
    // 1. Get pending sync data from IndexedDB
    // 2. Send to backend API
    // 3. Clear sync queue on success

    // For now, just notify the app that sync completed
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETE",
        success: true,
        message: "Workout data synced successfully",
      });
    });

    console.log("[Service Worker] Sync completed successfully");
    return Promise.resolve();
  } catch (error) {
    console.error("[Service Worker] Sync failed:", error);

    // Notify app of sync failure
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({
        type: "SYNC_COMPLETE",
        success: false,
        message: "Sync failed - will retry later",
      });
    });

    return Promise.reject(error);
  }
}

console.log("[Service Worker] Service worker script loaded");
