/*
 * Consolidated JavaScript Module Loader
 * This file loads all JavaScript modules in the correct dependency order
 * Load order: Logger → Logger Config → Theme Controller → Storage → Database → Validators → Generator → UI → Features → App
 */

// Function to dynamically load scripts in sequence
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    // Add cache-busting parameter using app version
    const version = window.APP_VERSION || "1.0.0";
    const cacheBuster = `?v=${version}`;
    script.src = src + cacheBuster;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Load all scripts in the correct order
async function loadAllScripts() {
  try {
    // Logger utility - Load first for debugging support
    await loadScript("./js/utils/logger.js");

    // Logger configuration - Load immediately after logger
    await loadScript("./js/config/loggerConfig.js");

    // Theme Controller - Load third to prevent flash
    await loadScript("./js/modules/themeController.js");

    // Core modules
    await loadScript("./js/modules/storageManager.js");
    await loadScript("./js/modules/workoutHistory.js");
    await loadScript("./js/modules/historyController.js");
    await loadScript("./js/modules/exerciseDatabase.js");
    await loadScript("./js/modules/validators.js");

    // Generator and UI
    await loadScript("./js/modules/exerciseGenerator.js");
    await loadScript("./js/modules/uiController.js");

    // Feature modules
    await loadScript("./js/modules/footerController.js");
    await loadScript("./js/modules/dragDrop.js");
    await loadScript("./js/modules/pdfExport.js");

    // Timer modules
    await loadScript("./js/modules/timerSettings.js");
    await loadScript("./js/modules/audioManager.js");
    await loadScript("./js/modules/workoutTimer.js");
    await loadScript("./js/components/timerUI.js");
    await loadScript("./js/modules/timerController.js");

    // Main Application - Load last to initialize everything
    await loadScript("./js/app.js");

    console.log("All scripts loaded successfully");
  } catch (error) {
    console.error("Error loading scripts:", error);
  }
}

// Start loading scripts when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadAllScripts);
} else {
  loadAllScripts();
}
