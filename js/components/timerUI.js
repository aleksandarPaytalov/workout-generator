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
   * Create main timer display
   * @private
   * @returns {HTMLElement} Timer display element
   */
  const createTimerDisplay = () => {
    console.log("TimerUI: Creating main timer display");

    const display = document.createElement("div");
    display.className = "timer-display";

    // Large timer display (MM:SS format)
    const timeDisplay = document.createElement("div");
    timeDisplay.className = "timer-time-display";
    timeDisplay.textContent = "00:45";
    elements.timeDisplay = timeDisplay;

    display.appendChild(timeDisplay);

    console.log("TimerUI: Large timer display added (MM:SS format)");

    // Current set/cycle info display
    const setInfo = document.createElement("div");
    setInfo.className = "timer-set-cycle-info";
    setInfo.innerHTML = "<span>Set 1 of 3</span> • <span>Cycle 1 of 3</span>";
    elements.setInfo = setInfo;

    display.appendChild(setInfo);

    console.log("TimerUI: Current set/cycle info display added");
    return display;
  };

  /**
   * Create timer header component
   * @private
   * @returns {HTMLElement} Header element
   */
  const createTimerHeader = () => {
    console.log("TimerUI: Creating timer header component");

    const header = document.createElement("div");
    header.className = "timer-header";
    elements.header = header;

    // Exercise name display
    const exerciseName = document.createElement("h2");
    exerciseName.className = "timer-exercise-name";
    exerciseName.textContent = "Exercise Name";
    elements.exerciseName = exerciseName;

    header.appendChild(exerciseName);

    console.log("TimerUI: Exercise name display added");

    // Exercise number indicator (X of Y)
    const exerciseNumber = document.createElement("div");
    exerciseNumber.className = "timer-exercise-number";
    exerciseNumber.textContent = "Exercise 1 of 8";
    elements.exerciseNumber = exerciseNumber;

    header.appendChild(exerciseNumber);

    console.log("TimerUI: Exercise number indicator added");

    // Close button with icon
    const closeBtn = document.createElement("button");
    closeBtn.className = "timer-close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.setAttribute("aria-label", "Close timer");
    closeBtn.addEventListener("click", hideTimer);
    elements.closeBtn = closeBtn;

    header.appendChild(closeBtn);

    console.log("TimerUI: Close button with icon added");
    return header;
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
