/**
 * Offline Indicator Module
 * Manages online/offline status indicator in the UI
 */

const OfflineIndicator = (() => {
  "use strict";

  // Module state
  let isInitialized = false;
  let indicatorElement = null;
  let isOnline = navigator.onLine;

  /**
   * Check if browser is online
   * @returns {boolean} Online status
   * @private
   */
  const checkOnlineStatus = () => {
    return navigator.onLine;
  };

  /**
   * Create offline indicator element
   * @returns {HTMLElement} Indicator element
   * @private
   */
  const createIndicator = () => {
    const indicator = document.createElement("div");
    indicator.className = "offline-indicator";
    indicator.id = "offline-indicator";

    // Create dot element
    const dot = document.createElement("span");
    dot.className = "offline-indicator-dot";

    // Create text element
    const text = document.createElement("span");
    text.className = "offline-indicator-text";

    indicator.appendChild(dot);
    indicator.appendChild(text);

    return indicator;
  };

  /**
   * Update indicator UI based on online status
   * @param {boolean} online - Online status
   * @private
   */
  const updateIndicatorUI = (online) => {
    if (!indicatorElement) return;

    const text = indicatorElement.querySelector(".offline-indicator-text");

    if (online) {
      indicatorElement.classList.remove("offline");
      indicatorElement.classList.add("online");
      indicatorElement.setAttribute("data-tooltip", "You're online");
      if (text) text.textContent = "Online";
    } else {
      indicatorElement.classList.remove("online");
      indicatorElement.classList.add("offline");
      indicatorElement.setAttribute(
        "data-tooltip",
        "You're offline - All features still work!"
      );
      if (text) text.textContent = "Offline";
    }

    // Add status change animation
    indicatorElement.classList.add("status-changed");
    setTimeout(() => {
      indicatorElement.classList.remove("status-changed");
    }, 600);
  };

  /**
   * Handle online event
   * @private
   */
  const handleOnline = () => {
    console.log("[OfflineIndicator] Connection restored - now online");
    isOnline = true;
    updateIndicatorUI(true);

    // Dispatch custom event for other modules
    window.dispatchEvent(
      new CustomEvent("connectionStatusChanged", {
        detail: { online: true },
      })
    );

    // Trigger background sync if available
    if (
      typeof ServiceWorkerManager !== "undefined" &&
      ServiceWorkerManager.isBackgroundSyncSupported &&
      ServiceWorkerManager.isBackgroundSyncSupported()
    ) {
      console.log(
        "[OfflineIndicator] Triggering background sync after reconnection"
      );
      ServiceWorkerManager.registerBackgroundSync("sync-workout-data");
    }
  };

  /**
   * Handle offline event
   * @private
   */
  const handleOffline = () => {
    console.log("[OfflineIndicator] Connection lost - now offline");
    isOnline = false;
    updateIndicatorUI(false);

    // Dispatch custom event for other modules
    window.dispatchEvent(
      new CustomEvent("connectionStatusChanged", {
        detail: { online: false },
      })
    );
  };

  /**
   * Add indicator to header
   * @private
   */
  const addToHeader = () => {
    const header = document.querySelector("header");
    const headerControls = header?.querySelector(".header-controls");

    if (!headerControls) {
      console.warn("[OfflineIndicator] Header controls not found");
      return false;
    }

    // Create indicator
    indicatorElement = createIndicator();

    // Insert before the first button (History button)
    const firstButton = headerControls.querySelector("button");
    if (firstButton) {
      headerControls.insertBefore(indicatorElement, firstButton);
    } else {
      headerControls.appendChild(indicatorElement);
    }

    // Set initial state
    updateIndicatorUI(isOnline);

    console.log("[OfflineIndicator] Indicator added to header");
    return true;
  };

  /**
   * Setup event listeners for online/offline events
   * @private
   */
  const setupEventListeners = () => {
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    console.log("[OfflineIndicator] Event listeners registered");
  };

  /**
   * Remove event listeners
   * @private
   */
  const removeEventListeners = () => {
    window.removeEventListener("online", handleOnline);
    window.removeEventListener("offline", handleOffline);
  };

  /**
   * Initialize the offline indicator
   * @public
   */
  const init = () => {
    if (isInitialized) {
      console.warn("[OfflineIndicator] Already initialized");
      return;
    }

    try {
      console.log("[OfflineIndicator] Initializing...");

      // Check initial online status
      isOnline = checkOnlineStatus();
      console.log(
        "[OfflineIndicator] Initial status:",
        isOnline ? "online" : "offline"
      );

      // Add indicator to header
      if (!addToHeader()) {
        console.warn("[OfflineIndicator] Failed to add indicator to header");
        return;
      }

      // Setup event listeners
      setupEventListeners();

      isInitialized = true;
      console.log("[OfflineIndicator] Initialized successfully");
    } catch (error) {
      console.error("[OfflineIndicator] Initialization failed:", error);
    }
  };

  /**
   * Get current online status
   * @returns {boolean} Online status
   * @public
   */
  const getOnlineStatus = () => {
    return isOnline;
  };

  /**
   * Check if module is ready
   * @returns {boolean} Ready status
   * @public
   */
  const isReady = () => {
    return isInitialized && indicatorElement !== null;
  };

  /**
   * Destroy the module and clean up
   * @public
   */
  const destroy = () => {
    if (!isInitialized) return;

    removeEventListeners();

    if (indicatorElement && indicatorElement.parentNode) {
      indicatorElement.parentNode.removeChild(indicatorElement);
    }

    indicatorElement = null;
    isInitialized = false;

    console.log("[OfflineIndicator] Module destroyed");
  };

  /**
   * Manually trigger status check (for testing)
   * @public
   */
  const checkStatus = () => {
    const currentStatus = checkOnlineStatus();
    if (currentStatus !== isOnline) {
      isOnline = currentStatus;
      updateIndicatorUI(isOnline);
    }
    return isOnline;
  };

  // Public API
  return {
    init,
    isReady,
    getOnlineStatus,
    checkStatus,
    destroy,
  };
})();

// Make available globally
window.OfflineIndicator = OfflineIndicator;
