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
   * Register the service worker
   * @returns {Promise<ServiceWorkerRegistration>}
   */
  async function register() {
    if (!isSupported()) {
      console.warn("[ServiceWorkerManager] Service workers are not supported");
      return null;
    }

    try {
      console.log("[ServiceWorkerManager] Registering service worker...");

      registration = await navigator.serviceWorker.register(
        "/service-worker.js",
        {
          scope: "/",
        }
      );

      console.log(
        "[ServiceWorkerManager] Service worker registered successfully"
      );
      console.log("[ServiceWorkerManager] Scope:", registration.scope);

      // Set up update listeners
      setupUpdateListeners(registration);

      // Check for updates
      checkForUpdates(registration);

      return registration;
    } catch (error) {
      console.error("[ServiceWorkerManager] Registration failed:", error);
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
      console.log("[ServiceWorkerManager] Update found!");
      const newWorker = reg.installing;

      newWorker.addEventListener("statechange", () => {
        console.log(
          "[ServiceWorkerManager] Service worker state:",
          newWorker.state
        );

        if (
          newWorker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          // New service worker available
          updateAvailable = true;
          console.log("[ServiceWorkerManager] New version available!");
          showUpdateNotification();
        }

        if (newWorker.state === "activated") {
          console.log("[ServiceWorkerManager] Service worker activated");
        }
      });
    });

    // Listen for controller change (new service worker took over)
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      console.log(
        "[ServiceWorkerManager] Controller changed, reloading page..."
      );
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
      console.log("[ServiceWorkerManager] Checking for updates...");
      reg.update().catch((error) => {
        console.error("[ServiceWorkerManager] Update check failed:", error);
      });
    }, 60 * 60 * 1000); // 1 hour

    // Also check on page visibility change
    document.addEventListener("visibilitychange", () => {
      if (!document.hidden) {
        console.log(
          "[ServiceWorkerManager] Page visible, checking for updates..."
        );
        reg.update().catch((error) => {
          console.error("[ServiceWorkerManager] Update check failed:", error);
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
      console.warn(
        "[ServiceWorkerManager] No waiting service worker to activate"
      );
      return;
    }

    console.log("[ServiceWorkerManager] Activating new service worker...");

    // Send message to waiting service worker to skip waiting
    registration.waiting.postMessage({ type: "SKIP_WAITING" });
  }

  /**
   * Listen for install prompt event
   */
  function setupInstallPrompt() {
    window.addEventListener("beforeinstallprompt", (e) => {
      console.log("[ServiceWorkerManager] Install prompt available");

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
      console.log("[ServiceWorkerManager] App installed successfully!");
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
      console.log("[ServiceWorkerManager] App is running in standalone mode");
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
    const headerButtons = header.querySelector(".header-buttons");

    if (headerButtons) {
      // Insert before theme toggle button
      const themeBtn = document.getElementById("theme-toggle");
      if (themeBtn) {
        headerButtons.insertBefore(installBtn, themeBtn);
      } else {
        headerButtons.appendChild(installBtn);
      }
    }

    console.log("[ServiceWorkerManager] Install button added to header");
  }

  /**
   * Hide install button
   */
  function hideInstallButton() {
    const installBtn = document.getElementById("pwa-install-btn");
    if (installBtn) {
      installBtn.remove();
      console.log("[ServiceWorkerManager] Install button removed");
    }
  }

  /**
   * Prompt user to install the app
   */
  async function promptInstall() {
    if (!deferredPrompt) {
      console.warn("[ServiceWorkerManager] No install prompt available");
      return;
    }

    console.log("[ServiceWorkerManager] Showing install prompt...");

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for user response
    const { outcome } = await deferredPrompt.userChoice;
    console.log("[ServiceWorkerManager] User choice:", outcome);

    if (outcome === "accepted") {
      console.log("[ServiceWorkerManager] User accepted the install prompt");
    } else {
      console.log("[ServiceWorkerManager] User dismissed the install prompt");
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
      console.log("[ServiceWorkerManager] Visit count:", newCount);
      return newCount;
    } catch (error) {
      console.error("[ServiceWorkerManager] Failed to track visit:", error);
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
      console.error(
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
      console.log("[ServiceWorkerManager] Banner dismissed permanently");
    } catch (error) {
      console.error(
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
      console.log(
        "[ServiceWorkerManager] App already installed, not showing banner"
      );
      return;
    }

    // Don't show if previously dismissed
    if (isBannerDismissed()) {
      console.log("[ServiceWorkerManager] Banner was dismissed, not showing");
      return;
    }

    // Don't show if no install prompt available
    if (!deferredPrompt) {
      console.log(
        "[ServiceWorkerManager] No install prompt available, not showing banner"
      );
      return;
    }

    console.log("[ServiceWorkerManager] Showing install banner");

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
    console.log("[ServiceWorkerManager] Banner interaction:", action);
    // You can add analytics tracking here if needed
  }

  /**
   * Initialize the service worker manager
   */
  async function init() {
    console.log("[ServiceWorkerManager] Initializing...");

    if (!isSupported()) {
      console.warn(
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

      console.log("[ServiceWorkerManager] Initialized successfully");
    } catch (error) {
      console.error("[ServiceWorkerManager] Initialization failed:", error);
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
