/**
 * Logger Utility
 * Centralized logging system with environment detection
 *
 * Usage:
 *   Logger.debug('ModuleName', 'Debug message', data);
 *   Logger.info('ModuleName', 'Info message', data);
 *   Logger.warn('ModuleName', 'Warning message', data);
 *   Logger.error('ModuleName', 'Error message', error);
 *
 * @module Logger
 */

const Logger = (() => {
  // Private state
  let config = {
    enabled: true, // Master switch
    level: "debug", // Minimum log level: 'debug', 'info', 'warn', 'error'
    showTimestamp: false, // Show timestamp in logs
    showModuleName: true, // Show module name in logs
    colorize: true, // Use colors in console (dev only)
  };

  // Log levels (higher number = more important)
  const LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  // Console colors (for development)
  const COLORS = {
    debug: "#6b7280", // Gray
    info: "#3b82f6", // Blue
    warn: "#f59e0b", // Orange
    error: "#ef4444", // Red
  };

  /**
   * Detect if running in development mode
   * @private
   * @returns {boolean} True if development mode
   */
  const isDevelopment = () => {
    // Check multiple indicators
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.port !== "" ||
      window.location.protocol === "file:"
    );
  };

  /**
   * Check if log level should be displayed
   * @private
   * @param {string} level - Log level to check
   * @returns {boolean} True if should log
   */
  const shouldLog = (level) => {
    if (!config.enabled) return false;
    if (!isDevelopment() && level !== "error" && level !== "warn") return false;
    return LOG_LEVELS[level] >= LOG_LEVELS[config.level];
  };

  /**
   * Format log message
   * @private
   * @param {string} moduleName - Name of the module
   * @param {string} message - Log message
   * @returns {string} Formatted message
   */
  const formatMessage = (moduleName, message) => {
    let formatted = "";

    if (config.showTimestamp) {
      const timestamp = new Date().toLocaleTimeString();
      formatted += `[${timestamp}] `;
    }

    if (config.showModuleName && moduleName) {
      formatted += `${moduleName}: `;
    }

    formatted += message;
    return formatted;
  };

  /**
   * Log debug message (development only)
   * @public
   * @param {string} moduleName - Name of the module
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  const debug = (moduleName, message, ...args) => {
    if (!shouldLog("debug")) return;

    const formatted = formatMessage(moduleName, message);

    if (config.colorize && isDevelopment()) {
      console.log(`%c${formatted}`, `color: ${COLORS.debug}`, ...args);
    } else {
      console.log(formatted, ...args);
    }
  };

  /**
   * Log info message (development only)
   * @public
   * @param {string} moduleName - Name of the module
   * @param {string} message - Log message
   * @param {...any} args - Additional arguments
   */
  const info = (moduleName, message, ...args) => {
    if (!shouldLog("info")) return;

    const formatted = formatMessage(moduleName, message);

    if (config.colorize && isDevelopment()) {
      console.log(`%c${formatted}`, `color: ${COLORS.info}`, ...args);
    } else {
      console.log(formatted, ...args);
    }
  };

  /**
   * Log warning message (always logged)
   * @public
   * @param {string} moduleName - Name of the module
   * @param {string} message - Warning message
   * @param {...any} args - Additional arguments
   */
  const warn = (moduleName, message, ...args) => {
    if (!shouldLog("warn")) return;

    const formatted = formatMessage(moduleName, message);

    if (config.colorize && isDevelopment()) {
      console.warn(`%c${formatted}`, `color: ${COLORS.warn}`, ...args);
    } else {
      console.warn(formatted, ...args);
    }
  };

  /**
   * Log error message (always logged)
   * @public
   * @param {string} moduleName - Name of the module
   * @param {string} message - Error message
   * @param {...any} args - Additional arguments (usually Error object)
   */
  const error = (moduleName, message, ...args) => {
    if (!shouldLog("error")) return;

    const formatted = formatMessage(moduleName, message);

    if (config.colorize && isDevelopment()) {
      console.error(`%c${formatted}`, `color: ${COLORS.error}`, ...args);
    } else {
      console.error(formatted, ...args);
    }
  };

  /**
   * Update logger configuration
   * @public
   * @param {Object} newConfig - Configuration object
   */
  const configure = (newConfig) => {
    config = { ...config, ...newConfig };
  };

  /**
   * Get current configuration
   * @public
   * @returns {Object} Current configuration
   */
  const getConfig = () => {
    return { ...config };
  };

  /**
   * Check if running in development mode
   * @public
   * @returns {boolean} True if development mode
   */
  const isDevMode = () => {
    return isDevelopment();
  };

  // Public API
  return {
    debug,
    info,
    warn,
    error,
    configure,
    getConfig,
    isDevMode,
  };
})();

// Make Logger available globally
if (typeof window !== "undefined") {
  window.Logger = Logger;
}

