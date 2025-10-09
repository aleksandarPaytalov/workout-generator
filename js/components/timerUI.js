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

  // Public API
  return {
    init,
    isReady,
    getElements: () => elements,
  };
})();
