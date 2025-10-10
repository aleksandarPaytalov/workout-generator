/**
 * Timer Controller Module
 * Manages timer UI visibility, state, and user interactions
 * All controller actions are manual user-initiated only
 */

const TimerController = (() => {
  "use strict";

  // Module state
  let isInitialized = false;

  // Module references (will be set during initialization)
  let workoutTimerModule = null;
  let timerUIModule = null;

  // Timer event names (matching WorkoutTimer module)
  const TIMER_EVENTS = {
    STARTED: "timer:started",
    PAUSED: "timer:paused",
    RESUMED: "timer:resumed",
    STOPPED: "timer:stopped",
    TICK: "timer:tick",
    PHASE_CHANGED: "timer:phaseChanged",
    CYCLE_COMPLETED: "timer:cycleCompleted",
    SET_COMPLETED: "timer:setCompleted",
    EXERCISE_COMPLETED: "timer:exerciseCompleted",
    WORKOUT_COMPLETED: "timer:workoutCompleted",
  };

  // DOM element references (populated from TimerUI module)
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
   * Handle timer tick event
   * @private
   * @param {CustomEvent} event - Timer tick event
   */
  const handleTimerTick = (event) => {
    if (!isInitialized) {
      return;
    }

    const state = event.detail;
    console.log(
      "TimerController: Timer tick - Remaining time:",
      state.remainingTime
    );

    // Update timer display with current state
    // This will call the updateDisplay function which will be fully implemented in step 3
    updateDisplay(state);
  };

  /**
   * Handle phase changed event
   * @private
   * @param {CustomEvent} event - Phase changed event
   */
  const handlePhaseChanged = (event) => {
    if (!isInitialized) {
      return;
    }

    const state = event.detail;
    console.log(
      "TimerController: Phase changed to:",
      state.phase,
      "| Set:",
      state.currentSet,
      "| Cycle:",
      state.currentCycle
    );

    // Update phase indicator in UI
    if (elements.phaseIndicator) {
      const phaseText = state.phase.toUpperCase();
      elements.phaseIndicator.textContent = phaseText;

      // Update phase indicator styling based on phase
      elements.phaseIndicator.className = "timer-phase-indicator";
      elements.phaseIndicator.classList.add(`phase-${state.phase}`);
    }

    // Update full display with new state
    updateDisplay(state);
  };

  /**
   * Handle exercise completed event
   * @private
   * @param {CustomEvent} event - Exercise completed event
   */
  const handleExerciseCompleted = (event) => {
    if (!isInitialized) {
      return;
    }

    const state = event.detail;
    console.log(
      "TimerController: Exercise completed!",
      "Exercise:",
      state.exercise?.name || "Unknown"
    );

    // Update phase indicator to show completion
    if (elements.phaseIndicator) {
      elements.phaseIndicator.textContent = "COMPLETED";
      elements.phaseIndicator.className =
        "timer-phase-indicator phase-completed";
    }

    // Show completion message
    console.log("TimerController: Exercise timer completed successfully!");

    // Update display with final state
    updateDisplay(state);

    // Optional: Auto-advance to next exercise if configured
    // This will be implemented when we add workout navigation
  };

  /**
   * Set up event listeners for timer events
   * @private
   */
  const setupEventListeners = () => {
    console.log("TimerController: Setting up event listeners...");

    // Listen to timer:tick for display updates
    document.addEventListener(TIMER_EVENTS.TICK, handleTimerTick);

    // Listen to timer:phaseChanged for phase transitions
    document.addEventListener(TIMER_EVENTS.PHASE_CHANGED, handlePhaseChanged);

    // Listen to timer:exerciseCompleted for completion
    document.addEventListener(
      TIMER_EVENTS.EXERCISE_COMPLETED,
      handleExerciseCompleted
    );

    console.log("TimerController: Event listeners set up successfully");
  };

  /**
   * Initialize the Timer Controller module
   * @public
   * @returns {boolean} True if initialization successful
   */
  const init = () => {
    if (isInitialized) {
      console.warn("TimerController: Already initialized");
      return false;
    }

    try {
      console.log("TimerController: Initializing...");

      // Check if required modules are available
      if (typeof WorkoutTimer === "undefined") {
        throw new Error("WorkoutTimer module not found");
      }

      if (typeof TimerUI === "undefined") {
        throw new Error("TimerUI module not found");
      }

      // Check if required modules are initialized
      if (!WorkoutTimer.isReady()) {
        throw new Error("WorkoutTimer module not initialized");
      }

      if (!TimerUI.isReady()) {
        throw new Error("TimerUI module not initialized");
      }

      // Store module references
      workoutTimerModule = WorkoutTimer;
      timerUIModule = TimerUI;
      console.log("TimerController: Module references stored successfully");

      // Get DOM element references from TimerUI
      const uiElements = TimerUI.getElements();
      if (!uiElements) {
        throw new Error("Failed to get UI elements from TimerUI");
      }

      // Populate elements object
      Object.assign(elements, uiElements);

      // Verify critical elements exist
      if (!elements.modal || !elements.timeDisplay || !elements.startBtn) {
        throw new Error("Critical UI elements missing");
      }

      console.log("TimerController: DOM elements populated successfully");

      // Set up event listeners for timer events
      setupEventListeners();

      isInitialized = true;
      console.log("TimerController: Initialized successfully");
      return true;
    } catch (error) {
      console.error("TimerController: Initialization failed", error);
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
   * Show timer for an exercise
   * @public
   * @param {Object} exercise - Exercise object to start timer for
   * @returns {boolean} True if timer shown successfully
   */
  const showTimer = (exercise) => {
    if (!isInitialized) {
      console.error("TimerController: Not initialized");
      return false;
    }

    console.log("TimerController: Showing timer for exercise:", exercise);
    return TimerUI.show();
  };

  /**
   * Hide timer
   * @public
   * @returns {boolean} True if timer hidden successfully
   */
  const hideTimer = () => {
    if (!isInitialized) {
      console.error("TimerController: Not initialized");
      return false;
    }

    console.log("TimerController: Hiding timer");
    return TimerUI.hide();
  };

  /**
   * Update timer display with current state
   * @public
   * @param {Object} state - Timer state object
   */
  const updateDisplay = (state) => {
    if (!isInitialized) {
      console.error("TimerController: Not initialized");
      return;
    }

    // This function will be implemented in step 3
    console.log("TimerController: Update display called with state:", state);
  };

  // Public API
  return {
    init,
    isReady,
    showTimer,
    hideTimer,
    updateDisplay,
  };
})();
