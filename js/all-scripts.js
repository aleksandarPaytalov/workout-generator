/*
 * Consolidated JavaScript Module Loader
 * This file loads all JavaScript modules in the correct dependency order
 * Load order: Theme Controller → Storage → Database → Validators → Generator → UI → Features → App
 */

// Function to dynamically load scripts in sequence
function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

// Load all scripts in the correct order
async function loadAllScripts() {
  try {
    // Theme Controller - Load first to prevent flash
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
