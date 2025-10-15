/**
 * Theme Controller Module
 *
 * Manages application theme (light/dark mode) with persistence
 * and system preference detection.
 *
 * @namespace ThemeController
 */

const ThemeController = (() => {
  "use strict";

  // Module state
  let isInitialized = false;
  let currentTheme = "light";

  // Constants
  const STORAGE_KEY = "workout-app-theme";
  const THEMES = {
    LIGHT: "light",
    DARK: "dark",
  };

  /**
   * Detect system theme preference
   * @private
   */
  const detectSystemTheme = () => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      return THEMES.DARK;
    }
    return THEMES.LIGHT;
  };

  /**
   * Get saved theme from localStorage
   * @private
   */
  const getSavedTheme = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === THEMES.LIGHT || saved === THEMES.DARK) {
        return saved;
      }
    } catch (e) {
      Logger.warn("ThemeController", "localStorage not available");
    }
    return null;
  };

  /**
   * Apply theme to document
   * @private
   */
  const applyTheme = (theme) => {
    if (theme !== THEMES.LIGHT && theme !== THEMES.DARK) {
      Logger.error("ThemeController", "Invalid theme:", theme);
      return;
    }

    document.documentElement.setAttribute("data-theme", theme);
    currentTheme = theme;

    // Save to localStorage
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {
      Logger.warn("ThemeController", "Could not save theme preference");
    }

    // Dispatch event for other modules
    window.dispatchEvent(
      new CustomEvent("themeChanged", {
        detail: { theme },
      })
    );

    Logger.debug("ThemeController", "Theme applied:", theme);
  };

  // Public API
  return {
    /**
     * Initialize the theme controller
     * @public
     */
    init: () => {
      if (isInitialized) {
        Logger.warn("ThemeController", "Already initialized");
        return;
      }

      // Determine initial theme: saved > system > default
      const initialTheme = getSavedTheme() || detectSystemTheme();
      applyTheme(initialTheme);

      // Listen for system theme changes
      if (window.matchMedia) {
        window
          .matchMedia("(prefers-color-scheme: dark)")
          .addEventListener("change", (e) => {
            // Only auto-switch if user hasn't set a preference
            if (!getSavedTheme()) {
              applyTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
            }
          });
      }

      isInitialized = true;
      Logger.info("ThemeController", "Initialized with theme:", initialTheme);
    },

    /**
     * Toggle between light and dark themes
     * @public
     */
    toggleTheme: () => {
      const newTheme =
        currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
      applyTheme(newTheme);
      return newTheme;
    },

    /**
     * Set specific theme
     * @public
     */
    setTheme: (theme) => {
      applyTheme(theme);
    },

    /**
     * Get current theme
     * @public
     */
    getCurrentTheme: () => currentTheme,

    /**
     * Check if dark mode is active
     * @public
     */
    isDarkMode: () => currentTheme === THEMES.DARK,

    /**
     * Check if module is ready
     * @public
     */
    isReady: () => isInitialized,
  };
})();

// Make module available globally
window.ThemeController = ThemeController;
