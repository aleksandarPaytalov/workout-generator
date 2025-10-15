/**
 * Main Application Entry Point
 *
 * Initializes all modules and handles application startup.
 * Provides basic error handling and dependency management.
 */

// Main application namespace
const WorkoutApp = (() => {
  "use strict";

  let isInitialized = false;

  /**
   * Initialize the application
   * @private
   */
  const init = () => {
    if (isInitialized) {
      Logger.warn("WorkoutApp", "Application already initialized");
      return;
    }

    try {
      // Check that all required modules are loaded (except UIController which needs DOM)
      const requiredModules = [
        "ExerciseDatabase",
        "Validators",
        "ExerciseGenerator",
      ];

      // Optional modules that enhance functionality
      const optionalModules = [
        "StorageManager",
        "WorkoutHistory",
        "HistoryController",
        "FooterController",
        "PDFExport",
        "DragDrop",
        "TimerSettings",
        "WorkoutTimer",
        "TimerUI",
        "TimerController",
        "AudioManager",
      ];

      for (const moduleName of requiredModules) {
        if (typeof window[moduleName] === "undefined") {
          throw new Error(`Required module "${moduleName}" not found`);
        }

        if (
          typeof window[moduleName].isReady === "function" &&
          !window[moduleName].isReady()
        ) {
          throw new Error(`Module "${moduleName}" is not ready`);
        }
      }

      // Check optional modules and warn if missing
      for (const moduleName of optionalModules) {
        if (typeof window[moduleName] === "undefined") {
          Logger.warn(
            "WorkoutApp",
            `Optional module "${moduleName}" not found - some features may be limited`
          );
        } else if (
          typeof window[moduleName].isReady === "function" &&
          !window[moduleName].isReady()
        ) {
          Logger.warn(
            "WorkoutApp",
            `Optional module "${moduleName}" is not ready - some features may be limited`
          );
        }
      }

      // Initialize ThemeController first to apply theme before UI renders
      if (typeof ThemeController !== "undefined") {
        ThemeController.init();
        if (!ThemeController.isReady()) {
          Logger.warn("WorkoutApp", "ThemeController failed to initialize");
        }
      }

      // Initialize StorageManager for workout history (manual operations only)
      if (typeof StorageManager !== "undefined") {
        StorageManager.init();
        if (!StorageManager.isReady()) {
          Logger.warn("WorkoutApp", "StorageManager failed to initialize");
        } else {
          Logger.debug("StorageManager", "Ready for manual user operations");
        }
      }

      // Initialize WorkoutHistory for workout history management (manual operations only)
      if (typeof WorkoutHistory !== "undefined") {
        WorkoutHistory.init();
        if (!WorkoutHistory.isReady()) {
          Logger.warn("WorkoutApp", "WorkoutHistory failed to initialize");
        } else {
          Logger.debug("WorkoutHistory", "Ready for manual user operations");
        }
      }

      // Initialize HistoryController if available
      if (typeof HistoryController !== "undefined") {
        HistoryController.init();
        if (!HistoryController.isReady()) {
          Logger.warn("WorkoutApp", "HistoryController failed to initialize");
        } else {
          Logger.debug("HistoryController", "Ready for manual user operations");
        }
      }

      // Initialize UIController now that DOM is ready
      if (typeof UIController === "undefined") {
        throw new Error("UIController module not found");
      }

      UIController.init();

      if (!UIController.isReady()) {
        throw new Error("UIController failed to initialize");
      }

      // Initialize FooterController if available
      if (typeof FooterController !== "undefined") {
        FooterController.init();
        if (!FooterController.isReady()) {
          Logger.warn(
            "WorkoutApp",
            "FooterController failed to initialize - footer functionality will be limited"
          );
        }
      }

      // Initialize Timer modules if available
      if (typeof TimerSettings !== "undefined") {
        TimerSettings.init();
        if (!TimerSettings.isReady()) {
          Logger.warn("WorkoutApp", "TimerSettings failed to initialize");
        } else {
          Logger.debug("TimerSettings", "Ready for manual user operations");
        }
      }

      // Initialize AudioManager after TimerSettings (to respect soundEnabled setting)
      if (typeof AudioManager !== "undefined") {
        AudioManager.init();
        if (!AudioManager.isReady()) {
          Logger.warn(
            "WorkoutApp",
            "AudioManager failed to initialize - sound effects will be disabled"
          );
        } else {
          Logger.debug("AudioManager", "Ready for manual user operations");
          // Sync with TimerSettings if available
          if (typeof TimerSettings !== "undefined" && TimerSettings.isReady()) {
            const settings = TimerSettings.getSettings();
            AudioManager.setEnabled(settings.soundEnabled);
            Logger.info(
              "AudioManager",
              `Sound ${
                settings.soundEnabled ? "ENABLED" : "DISABLED"
              } (from TimerSettings)`
            );
          }
        }
      }

      if (typeof WorkoutTimer !== "undefined") {
        WorkoutTimer.init();
        if (!WorkoutTimer.isReady()) {
          Logger.warn("WorkoutApp", "WorkoutTimer failed to initialize");
        } else {
          Logger.debug("WorkoutTimer", "Ready for manual user operations");
        }
      }

      if (typeof TimerUI !== "undefined") {
        TimerUI.init();
        if (!TimerUI.isReady()) {
          Logger.warn("WorkoutApp", "TimerUI failed to initialize");
        } else {
          Logger.debug("TimerUI", "Ready for manual user operations");
        }
      }

      if (typeof TimerController !== "undefined") {
        TimerController.init();
        if (!TimerController.isReady()) {
          Logger.warn("WorkoutApp", "TimerController failed to initialize");
        } else {
          Logger.debug("TimerController", "Ready for manual user operations");
        }
      }

      // Set up theme toggle button
      const themeToggleBtn = document.getElementById("themeToggleBtn");
      if (themeToggleBtn && ThemeController.isReady()) {
        themeToggleBtn.addEventListener("click", () => {
          ThemeController.toggleTheme();
        });
        Logger.debug("ThemeController", "Toggle button connected");
      }

      Logger.info("WorkoutApp", "All modules initialized successfully");
      Logger.info("WorkoutApp", "Application ready to use");

      isInitialized = true;
    } catch (error) {
      Logger.error("WorkoutApp", "Initialization failed:", error);
      showInitializationError(error.message);
    }
  };

  /**
   * Show initialization error to user
   * @param {string} message - Error message
   * @private
   */
  const showInitializationError = (message) => {
    // Try to show error in UI if UIController is available
    if (typeof UIController !== "undefined" && UIController.isReady()) {
      UIController.showErrorState(
        `Application failed to initialize: ${message}`
      );
    } else {
      // Fallback: show alert
      alert(`Application failed to initialize: ${message}`);
    }
  };

  /**
   * Check if application is ready
   * @returns {boolean} True if initialized
   * @public
   */
  const isReady = () => {
    return isInitialized;
  };

  // Public API
  return {
    init,
    isReady,
  };
})();

// Initialize when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  Logger.info("WorkoutApp", "DOM ready, initializing application...");
  WorkoutApp.init();
});

// Fallback initialization for case where DOM is already loaded
if (document.readyState === "loading") {
  // DOM is still loading, event listener above will handle it
} else {
  // DOM is already loaded
  Logger.info("WorkoutApp", "DOM already ready, initializing application...");
  WorkoutApp.init();
}
