/**
 * Timer UI Components
 * Modern, eye-catching UI components for workout timer display
 * All interactions are manual user-initiated only
 */

const TimerUI = (() => {
  "use strict";

  // Module state
  let isInitialized = false;

  // DOM element references (will be populated when modal is created)
  const elements = {
    modal: null,
    overlay: null,
    header: null,
    exerciseName: null,
    exerciseNumber: null,
    closeBtn: null,
    phaseIndicator: null,
    timeDisplay: null,
    progressRing: null,
    progressCircle: null,
    setInfo: null,
    cycleInfo: null,
    progressBar: null,
    progressFill: null,
    startBtn: null,
    pauseBtn: null,
    skipBtn: null,
    resetBtn: null,
    prevBtn: null,
    nextBtn: null,
    settingsBtn: null,
  };

  /**
   * Initialize the Timer UI module
   * @public
   * @returns {boolean} True if initialization successful
   */
  const init = () => {
    if (isInitialized) {
      console.warn("TimerUI: Already initialized");
      return false;
    }

    try {
      createTimerModal();
      isInitialized = true;
      console.log("TimerUI: Initialized successfully");
      return true;
    } catch (error) {
      console.error("TimerUI: Initialization failed:", error);
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
   * Show timer modal
   * @public
   */
  const showTimer = () => {
    if (!isInitialized) {
      console.error("TimerUI: Module not initialized");
      return;
    }

    elements.overlay.style.display = "flex";
    console.log("TimerUI: Timer modal shown");
  };

  /**
   * Hide timer modal
   * @public
   */
  const hideTimer = () => {
    if (!isInitialized) {
      console.error("TimerUI: Module not initialized");
      return;
    }

    elements.overlay.style.display = "none";
    console.log("TimerUI: Timer modal hidden");
  };

  /**
   * Create the main timer modal structure
   * @private
   */
  const createTimerModal = () => {
    console.log("TimerUI: Creating timer modal structure");

    // Create overlay with backdrop
    const overlay = document.createElement("div");
    overlay.className = "timer-overlay";
    overlay.style.display = "none";
    elements.overlay = overlay;

    console.log("TimerUI: Modal overlay created with backdrop");

    // Create modal container with modern styling
    const modal = document.createElement("div");
    modal.className = "timer-modal";
    elements.modal = modal;

    console.log("TimerUI: Modal container created with modern styling");

    // Add close button functionality - click overlay to close
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        hideTimer();
      }
    });

    console.log("TimerUI: Close button functionality added");
  };

  // Public API
  return {
    init,
    isReady,
    showTimer,
    hideTimer,
    getElements: () => elements,
  };
})();
