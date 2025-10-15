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
    startSound: "whistle", // Start sound selection (default: referee whistle)
  };

  // Available start sound options
  const availableStartSounds = [
    {
      id: "whistle",
      name: "Referee Whistle",
      description: "Classic sports whistle",
    },
    { id: "boxingBell", name: "Boxing Bell", description: "DING DING DING!" },
    { id: "airHorn", name: "Air Horn", description: "Powerful blast" },
    {
      id: "beepSequence",
      name: "Beep Sequence",
      description: "Three ascending beeps",
    },
    {
      id: "countdownVoice",
      name: "Countdown Voice",
      description: "3, 2, 1, GO!",
    },
    { id: "siren", name: "Siren", description: "Rising alarm sound" },
    { id: "chime", name: "Chime", description: "Pleasant bell chime" },
    { id: "buzzer", name: "Buzzer", description: "Game show buzzer" },
    { id: "gong", name: "Gong", description: "Deep resonant gong" },
    {
      id: "electronicBeep",
      name: "Electronic Beep",
      description: "Futuristic beep",
    },
  ];

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
      Logger.info("TimerSettings", "Initializing module...");

      // Load settings from localStorage
      loadSettings();

      isInitialized = true;
      Logger.info("TimerSettings", "Module initialized successfully");
      Logger.debug("TimerSettings", "Current settings:", currentSettings);
      return true;
    } catch (error) {
      Logger.error("TimerSettings", "Initialization failed:", error.message);
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
        Logger.error(
          "TimerSettings",
          "Validation failed:",
          validation.errors.join(", ")
        );
        return {
          success: false,
          errors: validation.errors,
        };
      }

      // Log what we're about to merge
      Logger.debug("TimerSettings", "Merging config:", config);
      Logger.debug(
        "TimerSettings",
        "Current settings before merge:",
        currentSettings
      );

      // Merge with current settings
      currentSettings = { ...currentSettings, ...config };

      Logger.debug("TimerSettings", "Settings after merge:", currentSettings);

      // Save to localStorage
      const saved = saveSettings();
      if (!saved) {
        return {
          success: false,
          errors: ["Failed to save settings to localStorage"],
        };
      }

      Logger.info(
        "TimerSettings",
        "Settings updated and saved:",
        currentSettings
      );
      return {
        success: true,
        errors: [],
      };
    } catch (error) {
      Logger.error(
        "TimerSettings",
        "Failed to update settings:",
        error.message
      );
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
        Logger.info("TimerSettings", "Settings reset to defaults");
        return true;
      }
      return false;
    } catch (error) {
      Logger.error(
        "TimerSettings",
        "Failed to reset to defaults:",
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
      Logger.debug("TimerSettings", "Settings saved to localStorage");
      return true;
    } catch (error) {
      if (error.name === "QuotaExceededError") {
        Logger.error("TimerSettings", "localStorage quota exceeded");
      } else {
        Logger.error(
          "TimerSettings",
          "Failed to save settings:",
          error.message
        );
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
        Logger.debug(
          "TimerSettings",
          "No saved settings found, using defaults"
        );
        currentSettings = { ...defaultSettings };
        return true;
      }

      const loadedSettings = JSON.parse(settingsJson);

      // Validate loaded settings
      const validation = validateConfig(loadedSettings);
      if (!validation.valid) {
        Logger.warn(
          "TimerSettings",
          "Loaded settings invalid, using defaults:",
          validation.errors.join(", ")
        );
        currentSettings = { ...defaultSettings };
        return false;
      }

      // Merge with defaults to ensure all properties exist
      currentSettings = { ...defaultSettings, ...loadedSettings };
      Logger.debug("TimerSettings", "Settings loaded from localStorage");
      return true;
    } catch (error) {
      Logger.error("TimerSettings", "Failed to load settings:", error.message);
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

  /**
   * Get available start sound options
   * @public
   * @returns {Array} Array of available start sound objects
   */
  const getAvailableStartSounds = () => {
    return [...availableStartSounds];
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
    getAvailableStartSounds,
  };
})();
