/**
 * Timer Settings Module
 * Manages timer configuration with localStorage persistence and validation
 */

const TimerSettings = (function () {
  "use strict";

  // Module state
  let isInitialized = false;

  // LocalStorage key
  const STORAGE_KEY = "workout-timer-settings";

  // Default settings object
  const defaultSettings = {
    prepare: 10, // Prepare time in seconds
    work: 45, // Work time in seconds
    rest: 15, // Rest time in seconds
    cyclesPerSet: 3, // Number of cycles per set
    sets: 3, // Number of sets per exercise
    restBetweenSets: 60, // Rest between sets in seconds
    autoAdvance: true, // Auto-advance to next exercise
    soundEnabled: true, // Enable sound notifications
    voiceEnabled: false, // Enable voice announcements
    theme: "auto", // Timer theme (auto/light/dark)
  };

  // Current settings (will be loaded from localStorage or use defaults)
  let currentSettings = { ...defaultSettings };

  // Validation rules for each setting
  const validationRules = {
    prepare: { min: 0, max: 60, name: "Prepare time", unit: "seconds" },
    work: { min: 5, max: 600, name: "Work time", unit: "seconds" },
    rest: { min: 0, max: 300, name: "Rest time", unit: "seconds" },
    cyclesPerSet: { min: 1, max: 20, name: "Cycles per set", unit: "cycles" },
    sets: { min: 1, max: 20, name: "Sets", unit: "sets" },
    restBetweenSets: {
      min: 0,
      max: 600,
      name: "Rest between sets",
      unit: "seconds",
    },
  };

  /**
   * Initialize the module
   * @public
   * @returns {boolean} True if initialization successful
   */
  const init = () => {
    try {
      console.log("TimerSettings: Initializing module...");

      // Load settings from localStorage
      loadSettings();

      isInitialized = true;
      console.log("TimerSettings: Module initialized successfully");
      console.log("TimerSettings: Current settings:", currentSettings);
      return true;
    } catch (error) {
      console.error("TimerSettings: Initialization failed:", error.message);
      return false;
    }
  };

  /**
   * Check if module is ready
   * @public
   * @returns {boolean} True if module is initialized
   */
  const isReady = () => {
    return isInitialized;
  };

  /**
   * Get current settings
   * @public
   * @returns {Object} Current settings object
   */
  const getSettings = () => {
    return { ...currentSettings };
  };

  /**
   * Get default settings
   * @public
   * @returns {Object} Default settings object
   */
  const getDefaultSettings = () => {
    return { ...defaultSettings };
  };

  /**
   * Validate configuration object
   * @private
   * @param {Object} config - Configuration to validate
   * @returns {Object} { valid: boolean, errors: string[] }
   */
  const validateConfig = (config) => {
    const errors = [];

    for (const [key, value] of Object.entries(config)) {
      const rule = validationRules[key];

      if (rule) {
        // Check if value is a valid number
        if (typeof value !== "number" || isNaN(value)) {
          errors.push(`${rule.name} must be a valid number`);
          continue;
        }

        // Check if value is within range
        if (value < rule.min || value > rule.max) {
          errors.push(
            `${rule.name} must be between ${rule.min} and ${rule.max} ${rule.unit}`
          );
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors: errors,
    };
  };

  /**
   * Update settings
   * @public
   * @param {Object} config - Settings to update
   * @returns {Object} { success: boolean, errors: string[] }
   */
  const updateSettings = (config) => {
    try {
      if (!config || typeof config !== "object") {
        return {
          success: false,
          errors: ["Invalid configuration object"],
        };
      }

      // Validate configuration
      const validation = validateConfig(config);
      if (!validation.valid) {
        console.error(
          "TimerSettings: Validation failed:",
          validation.errors.join(", ")
        );
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Merge with current settings
      currentSettings = { ...currentSettings, ...config };

      // Save to localStorage
      const saved = saveSettings();
      if (!saved) {
        return {
          success: false,
          errors: ["Failed to save settings to localStorage"],
        };
      }

      console.log("TimerSettings: Settings updated:", currentSettings);
      return {
        success: true,
        errors: [],
      };
    } catch (error) {
      console.error("TimerSettings: Failed to update settings:", error.message);
      return {
        success: false,
        errors: [error.message],
      };
    }
  };

  /**
   * Reset settings to defaults
   * @public
   * @returns {boolean} True if reset successful
   */
  const resetToDefaults = () => {
    try {
      currentSettings = { ...defaultSettings };
      const saved = saveSettings();

      if (saved) {
        console.log("TimerSettings: Settings reset to defaults");
        return true;
      }
      return false;
    } catch (error) {
      console.error(
        "TimerSettings: Failed to reset to defaults:",
        error.message
      );
      return false;
    }
  };

  /**
   * Save settings to localStorage
   * @private
   * @returns {boolean} True if save successful
   */
  const saveSettings = () => {
    try {
      const settingsJson = JSON.stringify(currentSettings);
      localStorage.setItem(STORAGE_KEY, settingsJson);
      console.log("TimerSettings: Settings saved to localStorage");
      return true;
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        console.error("TimerSettings: localStorage quota exceeded");
      } else {
        console.error("TimerSettings: Failed to save settings:", error.message);
      }
      return false;
    }
  };

  /**
   * Load settings from localStorage
   * @private
   * @returns {boolean} True if load successful
   */
  const loadSettings = () => {
    try {
      const settingsJson = localStorage.getItem(STORAGE_KEY);

      if (!settingsJson) {
        console.log(
          "TimerSettings: No saved settings found, using defaults"
        );
        currentSettings = { ...defaultSettings };
        return true;
      }

      const loadedSettings = JSON.parse(settingsJson);

      // Validate loaded settings
      const validation = validateConfig(loadedSettings);
      if (!validation.valid) {
        console.warn(
          "TimerSettings: Loaded settings invalid, using defaults:",
          validation.errors.join(", ")
        );
        currentSettings = { ...defaultSettings };
        return false;
      }

      // Merge with defaults to ensure all properties exist
      currentSettings = { ...defaultSettings, ...loadedSettings };
      console.log("TimerSettings: Settings loaded from localStorage");
      return true;
    } catch (error) {
      console.error("TimerSettings: Failed to load settings:", error.message);
      currentSettings = { ...defaultSettings };
      return false;
    }
  };

  /**
   * Get validation rules
   * @public
   * @returns {Object} Validation rules object
   */
  const getValidationRules = () => {
    return { ...validationRules };
  };

  // Public API
  return {
    init,
    isReady,
    getSettings,
    getDefaultSettings,
    updateSettings,
    resetToDefaults,
    getValidationRules,
  };
})();

