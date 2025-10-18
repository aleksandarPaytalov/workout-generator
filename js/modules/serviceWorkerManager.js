/**
 * Service Worker Manager Module
 * Handles service worker registration, updates, and lifecycle management
 */

const ServiceWorkerManager = (() => {
  "use strict";

  // Module state
  let registration = null;
  let deferredPrompt = null;
  let isInstalled = false;
  let updateAvailable = false;

  // Install banner state
  const BANNER_STORAGE_KEY = "pwa-install-banner";
  const VISIT_COUNT_KEY = "pwa-visit-count";
  const BANNER_DISMISSED_KEY = "pwa-banner-dismissed";
  const MIN_VISITS_FOR_BANNER = 3;

  /**
   * Check if we're in development mode
   * @returns {boolean}
   */
  function isDevMode() {
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "" ||
      window.location.port !== ""
    );
  }

  /**
   * Development-only console.log
   */
  function devLog(...args) {
    if (isDevMode()) {
      console.log(...args);
    }
  }

  /**
   * Development-only console.warn
   */
  function devWarn(...args) {
    if (isDevMode()) {
      console.warn(...args);
    }
  }

  /**
   * Always log errors (even in production)
   */
  function logError(...args) {
    console.error(...args);
  }

  /**
   * Check if service workers are supported
   * @returns {boolean} True if supported
   */
  function isSupported() {
    return "serviceWorker" in navigator;
  }

  /**
   * Check if app is running in standalone mode (installed)
   * @returns {boolean} True if installed
   */
  function isRunningStandalone() {
    return (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    );
  }

  /**
   * Get the base path for the application
   * Handles both root deployment and subdirectory deployment (e.g., GitHub Pages)
   * @returns {string} Base path with trailing slash
   */
  function getBasePath() {
    // Get the base path from the current location
    const path = window.location.pathname;

    // If we're at root or index.html, return root
    if (path === "/" || path === "/index.html") {
      return "/";
    }

    // Extract base path (everything before index.html or the last segment)
    const basePath = path.substring(0, path.lastIndexOf("/") + 1);
    return basePath || "/";
  }

  /**
   * Register the service worker
   * @returns {Promise<ServiceWorkerRegistration>}
   */
  async function register() {
    if (!isSupported()) {
      devWarn("[ServiceWorkerManager] Service workers are not supported");
      return null;
    }

    try {
      devLog("[ServiceWorkerManager] Registering service worker...");

      const basePath = getBasePath();
      const swPath = `${basePath}service-worker.js`;

      devLog("[ServiceWorkerManager] Base path:", basePath);
      devLog("[ServiceWorkerManager] Service worker path:", swPath);

      registration = await navigator.serviceWorker.register(swPath, {
        scope: basePath,
      });

      devLog("[ServiceWorkerManager] Service worker registered successfully");
      devLog("[ServiceWorkerManager] Scope:", registration.scope);

      // Set up update listeners
      setupUpdateListeners(registration);

      // Check for updates
      checkForUpdates(registration);

      return registration;
    } catch (error) {
      logError("[ServiceWorkerManager] Registration failed:", error);
      throw error;
    }
  }

  /**
   * Set up listeners for service worker updates
   * @param {ServiceWorkerRegistration} reg
   */
  function setupUpdateListeners(reg) {
    // Listen for new service worker installing
    reg.addEventListener("updatefound", () => {
      devLog("[ServiceWorkerManager] Update found!");
      const newWorker = reg.installing;

      newWorker.addEventListener("statechange", () => {
        devLog("[ServiceWorkerManager] Service worker state:", newWorker.state);

        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          // New service worker available
          updateAvailable = true;
          devLog("[ServiceWorkerManager] New version available!");
          showUpdateNotification();
        }

        if (newWorker.state === "activated") {
          devLog("[ServiceWorkerManager] Service worker activated");
        }
      });
    });

    // Listen for controller change (new service worker took over)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      devLog("[ServiceWorkerManager] Controller changed, reloading page...");
      window.location.reload();
    });
  }

  /**
   * Check for service worker updates
   * @param {ServiceWorkerRegistration} reg
   */
  function checkForUpdates(reg) {
    if (!reg) return;

    // Check for updates every hour
    setInterval(() => {
      devLog("[ServiceWorkerManager] Checking for updates...");
      reg.update().catch((error) => {
        logError("[ServiceWorkerManager] Update check failed:", error);
      });
    }, 60 * 60 * 1000); // 1 hour

    // Also check on page visibility change
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        devLog("[ServiceWorkerManager] Page visible, checking for updates...");
        reg.update().catch((error) => {
          logError("[ServiceWorkerManager] Update check failed:", error);
        });
      }
    });
  }

  /**
   * Show update notification to user
   */
  function showUpdateNotification() {
    // Create update notification banner
    const banner = document.createElement("div");
    banner.id = "sw-update-banner";
    banner.className = "sw-update-banner";
    banner.innerHTML = `
      <div class="sw-update-content">
        <span class="sw-update-icon">🔄</span>
        <div class="sw-update-text">
          <strong>Update Available!</strong>
          <p>A new version of the app is ready.</p>
        </div>
        <button class="sw-update-btn" id="sw-update-reload-btn">
          Reload
        </button>
        <button class="sw-update-dismiss" id="sw-update-dismiss-btn">
          ✕
        </button>
      </div>
    `;

    // Add to page
    document.body.appendChild(banner);

    // Add event listeners
    document
      .getElementById("sw-update-reload-btn")
      .addEventListener("click", () => {
        activateUpdate();
      });

    document
      .getElementById("sw-update-dismiss-btn")
      .addEventListener("click", () => {
        banner.remove();
      });

    // Show banner with animation
    setTimeout(() => {
      banner.classList.add("show");
    }, 100);
  }

  /**
   * Activate the waiting service worker
   */
  function activateUpdate() {
    if (!registration || !registration.waiting) {
      devWarn("[ServiceWorkerManager] No waiting service worker to activate");
      return;
    }

    devLog("[ServiceWorkerManager] Activating new service worker...");

    // Send message to waiting service worker to skip waiting
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  /**
   * Listen for install prompt event
   */
  function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      devLog("[ServiceWorkerManager] Install prompt available");

      // Prevent the default prompt
      e.preventDefault();

      // Store the event for later use
      deferredPrompt = e;

      // Show install button if not already installed
      if (!isRunningStandalone()) {
        showInstallButton();

        // Check if we should show the banner
        const visitCount = parseInt(
          localStorage.getItem(VISIT_COUNT_KEY) || "0",
          10
        );
        if (visitCount >= MIN_VISITS_FOR_BANNER) {
          // Wait a bit before showing banner
          setTimeout(() => {
            showInstallBanner();
          }, 2000);
        }
      }
    });

    // Listen for app installed event
    window.addEventListener("appinstalled", () => {
      devLog("[ServiceWorkerManager] App installed successfully!");
      isInstalled = true;
      deferredPrompt = null;

      // Hide install button
      hideInstallButton();

      // Hide install banner
      hideBanner();

      // Show success notification
      showInstallSuccessNotification();
    });

    // Check if already installed
    if (isRunningStandalone()) {
      isInstalled = true;
      devLog("[ServiceWorkerManager] App is running in standalone mode");
    }
  }

  /**
   * Show install button in header
   */
  function showInstallButton() {
    // Check if button already exists
    if (document.getElementById("pwa-install-btn")) {
      return;
    }

    // Create install button
    const installBtn = document.createElement("button");
    installBtn.id = "pwa-install-btn";
    installBtn.className = "pwa-install-btn";
    installBtn.innerHTML = `
      <span class="pwa-install-icon">📥</span>
      <span class="pwa-install-text">Install App</span>
    `;

    // Add click handler
    installBtn.addEventListener("click", promptInstall);

    // Add to header (next to History and Theme buttons)
    const header = document.querySelector("header");
    const headerControls = header.querySelector(".header-controls");

    if (headerControls) {
      // Insert before theme toggle button
      const themeBtn = document.getElementById("themeToggleBtn");
      if (themeBtn) {
        headerControls.insertBefore(installBtn, themeBtn);
      } else {
        headerControls.appendChild(installBtn);
      }
    }

    devLog("[ServiceWorkerManager] Install button added to header");
  }

  /**
   * Hide install button
   */
  function hideInstallButton() {
    const installBtn = document.getElementById("pwa-install-btn");
    if (installBtn) {
      installBtn.remove();
      devLog("[ServiceWorkerManager] Install button removed");
    }
  }

  /**
   * Detect if user is on iOS/Safari
   */
  function isIOSorSafari() {
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome/.test(userAgent);
    return isIOS || isSafari;
  }

  /**
   * Show iOS installation instructions
   */
  function showIOSInstallMessage() {
    const message = `
      <div class="ios-install-message">
        <h3>📱 Installation Not Available on iOS/Safari</h3>
        <p>This PWA is currently optimized for installation on:</p>
        <ul>
          <li>✅ Windows PC (Chrome, Edge)</li>
          <li>✅ Mac (Chrome, Edge)</li>
          <li>✅ Android (Chrome)</li>
        </ul>
        <p><strong>iOS/Safari installation is not supported in this version.</strong></p>
        <p>Please use the app in your browser, or access it from a PC for the full installable experience.</p>
        <button id="ios-message-close" class="ios-message-close-btn">Got it</button>
      </div>
    `;

    // Create overlay
    const overlay = document.createElement("div");
    overlay.id = "ios-install-overlay";
    overlay.className = "ios-install-overlay";
    overlay.innerHTML = message;
    document.body.appendChild(overlay);

    // Add close handler
    const closeBtn = document.getElementById("ios-message-close");
    closeBtn.addEventListener("click", () => {
      overlay.remove();
    });

    // Close on overlay click
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        overlay.remove();
      }
    });
  }

  /**
   * Prompt user to install the app
   */
  async function promptInstall() {
    // Check if user is on iOS/Safari
    if (isIOSorSafari()) {
      devLog("[ServiceWorkerManager] iOS/Safari detected - showing message");
      showIOSInstallMessage();
      return;
    }

    if (!deferredPrompt) {
      devWarn("[ServiceWorkerManager] No install prompt available");
      return;
    }

    devLog("[ServiceWorkerManager] Showing install prompt...");

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    devLog("[ServiceWorkerManager] User choice:", outcome);

    if (outcome === "accepted") {
      devLog("[ServiceWorkerManager] User accepted the install prompt");
    } else {
      devLog("[ServiceWorkerManager] User dismissed the install prompt");
    }

    // Clear the deferred prompt
    deferredPrompt = null;
  }

  /**
   * Show install success notification
   */
  function showInstallSuccessNotification() {
    // Create success notification
    const notification = document.createElement("div");
    notification.className = "pwa-install-success";
    notification.innerHTML = `
      <div class="pwa-install-success-content">
        <span class="pwa-install-success-icon">✓</span>
        <span class="pwa-install-success-text">App Installed Successfully!</span>
      </div>
    `;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => {
      notification.classList.add("show");
    }, 100);

    // Auto-dismiss after 3 seconds
    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => {
        notification.remove();
      }, 300);
    }, 3000);
  }

  /**
   * Track page visits for install banner
   */
  function trackVisit() {
    try {
      const visitCount = parseInt(
        localStorage.getItem(VISIT_COUNT_KEY) || "0",
        10
      );
      const newCount = visitCount + 1;
      localStorage.setItem(VISIT_COUNT_KEY, newCount.toString());
      devLog("[ServiceWorkerManager] Visit count:", newCount);
      return newCount;
    } catch (error) {
      logError("[ServiceWorkerManager] Failed to track visit:", error);
      return 0;
    }
  }

  /**
   * Check if banner was dismissed
   */
  function isBannerDismissed() {
    try {
      return localStorage.getItem(BANNER_DISMISSED_KEY) === "true";
    } catch (error) {
      logError(
        "[ServiceWorkerManager] Failed to check banner dismissal:",
        error
      );
      return false;
    }
  }

  /**
   * Mark banner as dismissed
   */
  function dismissBanner() {
    try {
      localStorage.setItem(BANNER_DISMISSED_KEY, "true");
      devLog("[ServiceWorkerManager] Banner dismissed permanently");
    } catch (error) {
      logError(
        "[ServiceWorkerManager] Failed to save banner dismissal:",
        error
      );
    }
  }

  /**
   * Show install banner
   */
  function showInstallBanner() {
    // Check if banner already exists
    if (document.getElementById("pwa-install-banner")) {
      return;
    }

    // Don't show if already installed
    if (isRunningStandalone() || isInstalled) {
      devLog(
        "[ServiceWorkerManager] App already installed, not showing banner"
      );
      return;
    }

    // Don't show if previously dismissed
    if (isBannerDismissed()) {
      devLog("[ServiceWorkerManager] Banner was dismissed, not showing");
      return;
    }

    // Don't show if no install prompt available
    if (!deferredPrompt) {
      devLog(
        "[ServiceWorkerManager] No install prompt available, not showing banner"
      );
      return;
    }

    devLog("[ServiceWorkerManager] Showing install banner");

    // Create banner
    const banner = document.createElement("div");
    banner.id = "pwa-install-banner";
    banner.className = "pwa-install-banner";
    banner.innerHTML = `
      <div class="pwa-install-banner-content">
        <div class="pwa-install-banner-icon">📱</div>
        <div class="pwa-install-banner-text">
          <strong class="pwa-install-banner-title">Install Workout Generator</strong>
          <p class="pwa-install-banner-description">Get the best experience with our app!</p>
          <div class="pwa-install-banner-benefits">
            <span class="pwa-install-banner-benefit">Works offline</span>
            <span class="pwa-install-banner-benefit">Faster loading</span>
            <span class="pwa-install-banner-benefit">Home screen access</span>
          </div>
        </div>
        <div class="pwa-install-banner-actions">
          <button class="pwa-install-banner-btn" id="pwa-banner-install-btn">
            Install Now
          </button>
          <button class="pwa-install-banner-dismiss" id="pwa-banner-dismiss-btn">
            ✕
          </button>
        </div>
      </div>
    `;

    // Add to page
    document.body.appendChild(banner);

    // Add event listeners
    document
      .getElementById("pwa-banner-install-btn")
      .addEventListener("click", () => {
        trackBannerInteraction("install");
        promptInstall();
        hideBanner();
      });

    document
      .getElementById("pwa-banner-dismiss-btn")
      .addEventListener("click", () => {
        trackBannerInteraction("dismiss");
        dismissBanner();
        hideBanner();
      });

    // Show banner with animation
    setTimeout(() => {
      banner.classList.add("show");
    }, 500);
  }

  /**
   * Hide install banner
   */
  function hideBanner() {
    const banner = document.getElementById("pwa-install-banner");
    if (banner) {
      banner.classList.remove("show");
      banner.classList.add("hide");
      setTimeout(() => {
        banner.remove();
      }, 400);
    }
  }

  /**
   * Track banner interactions
   */
  function trackBannerInteraction(action) {
    devLog("[ServiceWorkerManager] Banner interaction:", action);
    // You can add analytics tracking here if needed
  }

  /**
   * Check if Background Sync API is supported
   * @returns {boolean} True if supported
   */
  function isBackgroundSyncSupported() {
    return (
      "sync" in registration || "sync" in ServiceWorkerRegistration.prototype
    );
  }

  /**
   * Register a background sync
   * @param {string} tag - Sync tag name
   * @returns {Promise<void>}
   */
  async function registerBackgroundSync(tag = "sync-workout-data") {
    if (!registration) {
      devWarn(
        "[ServiceWorkerManager] No service worker registration available"
      );
      return;
    }

    if (!isBackgroundSyncSupported()) {
      devLog("[ServiceWorkerManager] Background Sync not supported");
      return;
    }

    try {
      await registration.sync.register(tag);
      devLog(`[ServiceWorkerManager] Background sync registered: ${tag}`);
    } catch (error) {
      logError(
        "[ServiceWorkerManager] Background sync registration failed:",
        error
      );
    }
  }

  /**
   * Listen for sync messages from service worker
   */
  function setupSyncListener() {
    if (!navigator.serviceWorker) return;

    navigator.serviceWorker.addEventListener("message", (event) => {
      if (event.data && event.data.type === "SYNC_COMPLETE") {
        devLog("[ServiceWorkerManager] Sync completed:", event.data);

        // Show notification to user
        if (event.data.success) {
          showSyncNotification("✓ Data synced successfully", "success");
        } else {
          showSyncNotification("⚠ Sync failed - will retry later", "warning");
        }
      }
    });
  }

  /**
   * Show sync notification
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, warning, error)
   */
  function showSyncNotification(message, type = "info") {
    // Simple console log for now - can be enhanced with UI notification
    devLog(`[ServiceWorkerManager] Sync notification (${type}):`, message);

    // Dispatch custom event for other modules to listen to
    window.dispatchEvent(
      new CustomEvent("syncStatusChanged", {
        detail: { message, type },
      })
    );
  }

  /**
   * Initialize the service worker manager
   */
  async function init() {
    devLog("[ServiceWorkerManager] Initializing...");

    if (!isSupported()) {
      devWarn(
        "[ServiceWorkerManager] Service workers not supported, skipping initialization"
      );
      return;
    }

    try {
      // Register service worker
      await register();

      // Set up install prompt handling
      setupInstallPrompt();

      // Track visit for banner logic
      trackVisit();

      // Set up background sync listener
      setupSyncListener();

      // Check if Background Sync is supported
      if (isBackgroundSyncSupported()) {
        devLog("[ServiceWorkerManager] Background Sync API is supported");
      } else {
        devLog("[ServiceWorkerManager] Background Sync API not supported");
      }

      devLog("[ServiceWorkerManager] Initialized successfully");
    } catch (error) {
      logError("[ServiceWorkerManager] Initialization failed:", error);
    }
  }

  // Public API
  return {
    init,
    isSupported,
    isInstalled: () => isInstalled,
    isRunningStandalone,
    promptInstall,
    getRegistration: () => registration,
    hasUpdate: () => updateAvailable,
    registerBackgroundSync,
    isBackgroundSyncSupported,
  };
})();

// Auto-initialize when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    ServiceWorkerManager.init();
  });
} else {
  ServiceWorkerManager.init();
}
