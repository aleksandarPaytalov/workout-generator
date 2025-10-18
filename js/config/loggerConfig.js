/**
 * Logger Configuration
 * Customize logger behavior for the application
 *
 * This file configures the Logger utility with application-specific settings.
 * The Logger automatically detects development vs production environments and
 * adjusts logging behavior accordingly.
 *
 * @module LoggerConfig
 */

(function () {
  "use strict";

  /**
   * Initialize logger configuration on page load
   */
  const initLoggerConfig = () => {
    // Wait for Logger to be available
    if (typeof Logger === "undefined") {
      console.error(
        "LoggerConfig: Logger utility not loaded. Make sure logger.js is loaded before loggerConfig.js"
      );
      return;
    }

    // Configure logger with application-specific settings
    Logger.configure({
      // Master switch - set to false to disable ALL logging (including errors)
      enabled: true,

      // Minimum log level to display
      // Options: 'debug', 'info', 'warn', 'error'
      // - 'debug': Show all logs (most verbose)
      // - 'info': Show info, warn, and error logs
      // - 'warn': Show only warnings and errors
      // - 'error': Show only errors
      level: "info",

      // Show timestamp in log messages
      // Example: [14:30:45] ModuleName: Message
      showTimestamp: false,

      // Show module name in log messages
      // Example: ModuleName: Message
      showModuleName: true,

      // Use color-coded console output (development only)
      // - debug: Gray
      // - info: Blue
      // - warn: Orange
      // - error: Red
      colorize: true,
    });

    // Log configuration status
    const config = Logger.getConfig();
    const isDev = Logger.isDevMode();

    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔧 Logger Configuration Initialized");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(`Environment: ${isDev ? "🛠️  Development" : "🚀 Production"}`);
    console.log(`Enabled: ${config.enabled ? "✅ Yes" : "❌ No"}`);
    console.log(`Log Level: ${config.level.toUpperCase()}`);
    console.log(
      `Show Timestamps: ${config.showTimestamp ? "✅ Yes" : "❌ No"}`
    );
    console.log(
      `Show Module Names: ${config.showModuleName ? "✅ Yes" : "❌ No"}`
    );
    console.log(`Colorize Output: ${config.colorize ? "✅ Yes" : "❌ No"}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    if (isDev) {
      console.log(
        "%c💡 Development Mode Active",
        "color: #3b82f6; font-weight: bold;"
      );
      console.log(
        "%cAll debug and info logs are visible. In production, only warnings and errors will be logged.",
        "color: #6b7280;"
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } else {
      console.log(
        "%c🚀 Production Mode Active",
        "color: #10b981; font-weight: bold;"
      );
      console.log(
        "%cDebug and info logs are hidden. Only warnings and errors will be logged.",
        "color: #6b7280;"
      );
      console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    }

    // Test logger with sample messages (development only)
    // Commented out to avoid console errors in Lighthouse audit
    // if (isDev) {
    //   console.log("\n📝 Logger Test Messages:");
    //   Logger.debug("LoggerConfig", "This is a DEBUG message (hidden in production)");
    //   Logger.info("LoggerConfig", "This is an INFO message (hidden in production)");
    //   Logger.warn("LoggerConfig", "This is a WARNING message (always visible)");
    //   Logger.error("LoggerConfig", "This is an ERROR message (always visible)");
    //   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    // }
  };

  // Initialize configuration when DOM is ready
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initLoggerConfig);
  } else {
    // DOM already loaded
    initLoggerConfig();
  }

  // Make configuration function available globally for runtime changes
  if (typeof window !== "undefined") {
    window.LoggerConfig = {
      /**
       * Reconfigure logger at runtime
       * @param {Object} newConfig - New configuration object
       * @example
       * LoggerConfig.update({ level: 'warn', showTimestamp: true });
       */
      update: (newConfig) => {
        if (typeof Logger !== "undefined") {
          Logger.configure(newConfig);
          console.log("✅ Logger configuration updated:", newConfig);
        } else {
          console.error("❌ Logger not available");
        }
      },

      /**
       * Get current logger configuration
       * @returns {Object} Current configuration
       */
      getConfig: () => {
        if (typeof Logger !== "undefined") {
          return Logger.getConfig();
        } else {
          console.error("❌ Logger not available");
          return null;
        }
      },

      /**
       * Enable all logging
       */
      enable: () => {
        if (typeof Logger !== "undefined") {
          Logger.configure({ enabled: true });
          console.log("✅ Logger enabled");
        }
      },

      /**
       * Disable all logging
       */
      disable: () => {
        if (typeof Logger !== "undefined") {
          Logger.configure({ enabled: false });
          console.log("⚠️ Logger disabled");
        }
      },

      /**
       * Set log level
       * @param {string} level - Log level ('debug', 'info', 'warn', 'error')
       */
      setLevel: (level) => {
        if (typeof Logger !== "undefined") {
          Logger.configure({ level: level });
          console.log(`✅ Log level set to: ${level.toUpperCase()}`);
        }
      },
    };
  }
})();
