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

  // Workout data storage
  let currentWorkout = [];
  let currentExerciseIndex = 0;
  let currentExercise = null;

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
   * Handle keyboard shortcuts
   * @private
   * @param {KeyboardEvent} event - Keyboard event
   */
  const handleKeyboardShortcuts = (event) => {
    if (!isInitialized) {
      return;
    }

    // Only handle shortcuts when timer modal is visible
    if (!elements.modal || elements.modal.style.display === "none") {
      return;
    }

    // Escape key - close timer
    if (event.key === "Escape") {
      event.preventDefault();
      console.log("TimerController: Escape key pressed - closing timer");
      hideTimer();
    }

    // Space key - pause/resume timer
    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      console.log("TimerController: Space key pressed - toggling pause");
      handlePause();
    }
  };

  /**
   * Handle modal backdrop click
   * @private
   * @param {MouseEvent} event - Click event
   */
  const handleBackdropClick = (event) => {
    if (!isInitialized) {
      return;
    }

    // Only close if clicking directly on the overlay (not on modal content)
    if (event.target === elements.overlay) {
      console.log("TimerController: Backdrop clicked - closing timer");
      hideTimer();
    }
  };

  /**
   * Handle close button click
   * @private
   */
  const handleCloseButton = () => {
    if (!isInitialized) {
      return;
    }

    console.log("TimerController: Close button clicked");
    hideTimer();
  };

  /**
   * Set up button event listeners
   * @private
   */
  const setupButtonListeners = () => {
    console.log("TimerController: Setting up button listeners...");

    // Start button
    if (elements.startBtn) {
      elements.startBtn.addEventListener("click", handleStart);
      console.log("TimerController: Start button listener added");
    }

    // Pause/Resume button
    if (elements.pauseBtn) {
      elements.pauseBtn.addEventListener("click", handlePause);
      console.log("TimerController: Pause button listener added");
    }

    // Skip button
    if (elements.skipBtn) {
      elements.skipBtn.addEventListener("click", handleSkip);
      console.log("TimerController: Skip button listener added");
    }

    // Reset button
    if (elements.resetBtn) {
      elements.resetBtn.addEventListener("click", handleReset);
      console.log("TimerController: Reset button listener added");
    }

    // Next exercise button
    if (elements.nextBtn) {
      elements.nextBtn.addEventListener("click", handleNext);
      console.log("TimerController: Next button listener added");
    }

    // Previous exercise button
    if (elements.prevBtn) {
      elements.prevBtn.addEventListener("click", handlePrevious);
      console.log("TimerController: Previous button listener added");
    }

    // Settings button
    if (elements.settingsBtn) {
      elements.settingsBtn.addEventListener("click", handleSettings);
      console.log("TimerController: Settings button listener added");
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", handleKeyboardShortcuts);
    console.log("TimerController: Keyboard shortcuts listener added");

    // Modal backdrop click
    if (elements.overlay) {
      elements.overlay.addEventListener("click", handleBackdropClick);
      console.log("TimerController: Backdrop click listener added");
    }

    // Close button
    if (elements.closeBtn) {
      elements.closeBtn.addEventListener("click", handleCloseButton);
      console.log("TimerController: Close button listener added");
    }

    console.log("TimerController: Button listeners set up successfully");
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

      // Set up button event listeners
      setupButtonListeners();

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
   * Handle start button click
   * @private
   */
  const handleStart = () => {
    if (!isInitialized) {
      console.error("TimerController: Not initialized");
      return;
    }

    console.log("TimerController: Start button clicked");

    // Get current exercise (will be passed when timer is shown)
    // For now, create a test exercise
    const testExercise = {
      name: "Test Exercise",
      muscleGroup: "chest",
      sets: 3,
      reps: 10,
    };

    // Start the timer with the exercise
    const started = workoutTimerModule.startTimer(testExercise);

    if (started) {
      console.log("TimerController: Timer started successfully");

      // Update button states
      if (elements.startBtn) {
        elements.startBtn.style.display = "none";
      }
      if (elements.pauseBtn) {
        elements.pauseBtn.style.display = "inline-block";
        elements.pauseBtn.textContent = "Pause";
      }
    } else {
      console.error("TimerController: Failed to start timer");
    }
  };

  /**
   * Handle pause button click
   * @private
   */
  const handlePause = () => {
    if (!isInitialized) {
      console.error("TimerController: Not initialized");
      return;
    }

    console.log("TimerController: Pause button clicked");

    // Check if timer is currently paused
    const isPaused = workoutTimerModule.isPaused();

    if (isPaused) {
      // Resume the timer
      const resumed = workoutTimerModule.resumeTimer();

      if (resumed) {
        console.log("TimerController: Timer resumed successfully");

        // Update button text to "Pause"
        if (elements.pauseBtn) {
          elements.pauseBtn.textContent = "Pause";
        }
      } else {
        console.error("TimerController: Failed to resume timer");
      }
    } else {
      // Pause the timer
      const paused = workoutTimerModule.pauseTimer();

      if (paused) {
        console.log("TimerController: Timer paused successfully");

        // Update button text to "Resume"
        if (elements.pauseBtn) {
          elements.pauseBtn.textContent = "Resume";
        }
      } else {
        console.error("TimerController: Failed to pause timer");
      }
    }
  };

  /**
   * Handle skip button click
   * @private
   */
  const handleSkip = () => {
    if (!isInitialized) {
      console.error("TimerController: Not initialized");
      return;
    }

    console.log("TimerController: Skip button clicked");

    // Skip to next phase
    const skipped = workoutTimerModule.skipPhase();

    if (skipped) {
      console.log("TimerController: Phase skipped successfully");
    } else {
      console.error("TimerController: Failed to skip phase");
    }
  };

  /**
   * Handle reset button click
   * @private
   */
  const handleReset = () => {
    if (!isInitialized) {
      console.error("TimerController: Not initialized");
      return;
    }

    console.log("TimerController: Reset button clicked");

    // Reset the current exercise timer
    const reset = workoutTimerModule.resetExercise();

    if (reset) {
      console.log("TimerController: Exercise timer reset successfully");

      // Update button states back to initial
      if (elements.startBtn) {
        elements.startBtn.style.display = "inline-block";
      }
      if (elements.pauseBtn) {
        elements.pauseBtn.style.display = "none";
        elements.pauseBtn.textContent = "Pause";
      }

      // Update phase indicator
      if (elements.phaseIndicator) {
        elements.phaseIndicator.textContent = "IDLE";
        elements.phaseIndicator.className = "timer-phase-indicator phase-idle";
      }
    } else {
      console.error("TimerController: Failed to reset exercise timer");
    }
  };

  /**
   * Handle next exercise button click
   * @private
   */
  const handleNext = () => {
    if (!isInitialized) {
      console.error("TimerController: Not initialized");
      return;
    }

    console.log("TimerController: Next exercise button clicked");

    // Check if we have workout data
    if (currentWorkout.length === 0) {
      console.warn("TimerController: No workout data available");
      return;
    }

    // Check if we can move to next exercise
    if (currentExerciseIndex >= currentWorkout.length - 1) {
      console.log("TimerController: Already at last exercise");
      return;
    }

    // Stop current timer
    if (workoutTimerModule && workoutTimerModule.isRunning()) {
      workoutTimerModule.stopTimer();
    }

    // Move to next exercise
    currentExerciseIndex++;
    const nextExercise = currentWorkout[currentExerciseIndex];

    console.log(
      `TimerController: Moving to exercise ${currentExerciseIndex + 1}:`,
      nextExercise.name
    );

    // Show timer for next exercise
    showTimer(nextExercise, currentExerciseIndex, currentWorkout.length);
  };

  /**
   * Handle previous exercise button click
   * @private
   */
  const handlePrevious = () => {
    if (!isInitialized) {
      console.error("TimerController: Not initialized");
      return;
    }

    console.log("TimerController: Previous exercise button clicked");

    // Check if we have workout data
    if (currentWorkout.length === 0) {
      console.warn("TimerController: No workout data available");
      return;
    }

    // Check if we can move to previous exercise
    if (currentExerciseIndex === 0) {
      console.log("TimerController: Already at first exercise");
      return;
    }

    // Stop current timer
    if (workoutTimerModule && workoutTimerModule.isRunning()) {
      workoutTimerModule.stopTimer();
    }

    // Move to previous exercise
    currentExerciseIndex--;
    const prevExercise = currentWorkout[currentExerciseIndex];

    console.log(
      `TimerController: Moving to exercise ${currentExerciseIndex + 1}:`,
      prevExercise.name
    );

    // Show timer for previous exercise
    showTimer(prevExercise, currentExerciseIndex, currentWorkout.length);
  };

  /**
   * Handle settings button click
   * @private
   */
  const handleSettings = () => {
    if (!isInitialized) {
      console.error("TimerController: Not initialized");
      return;
    }

    console.log("TimerController: Settings button clicked");

    // This will open the timer settings modal
    // For now, just log the action
    console.log("TimerController: Opening settings modal (to be implemented)");

    // TODO: Create and show settings modal
    // TODO: Load current settings from TimerSettings module
    // TODO: Allow user to modify settings
    // TODO: Save settings when user confirms
  };

  /**
   * Set workout data for navigation
   * @public
   * @param {Array} workout - Array of exercise objects
   */
  const setWorkout = (workout) => {
    if (!Array.isArray(workout)) {
      console.error("TimerController: Workout must be an array");
      return;
    }

    currentWorkout = workout;
    console.log(
      `TimerController: Workout data set (${workout.length} exercises)`
    );
  };

  /**
   * Update navigation button states based on current position
   * @private
   */
  const updateNavigationButtons = () => {
    if (!elements.prevBtn || !elements.nextBtn) {
      return;
    }

    // Disable previous button if at first exercise
    elements.prevBtn.disabled = currentExerciseIndex === 0;

    // Disable next button if at last exercise or no workout data
    elements.nextBtn.disabled =
      currentWorkout.length === 0 ||
      currentExerciseIndex >= currentWorkout.length - 1;
  };

  /**
   * Show timer for an exercise
   * @public
   * @param {Object} exercise - Exercise object to start timer for
   * @param {number} exerciseIndex - Index of exercise in workout (optional)
   * @param {number} totalExercises - Total number of exercises in workout (optional)
   * @returns {boolean} True if timer shown successfully
   */
  const showTimer = (exercise, exerciseIndex, totalExercises) => {
    if (!isInitialized) {
      console.error("TimerController: Not initialized");
      return false;
    }

    if (!exercise) {
      console.error("TimerController: No exercise provided");
      return false;
    }

    console.log("TimerController: Showing timer for exercise:", exercise);

    // Store current exercise data
    currentExercise = exercise;
    currentExerciseIndex =
      exerciseIndex !== undefined ? exerciseIndex : exercise.index || 0;

    // Update exercise information in UI
    if (elements.exerciseName) {
      elements.exerciseName.textContent = exercise.name || "Exercise";
    }

    if (elements.exerciseNumber) {
      const total =
        totalExercises ||
        exercise.totalExercises ||
        currentWorkout.length ||
        "?";
      elements.exerciseNumber.textContent = `Exercise ${
        currentExerciseIndex + 1
      } of ${total}`;
    }

    // Reset button states to initial
    if (elements.startBtn) {
      elements.startBtn.style.display = "inline-block";
    }
    if (elements.pauseBtn) {
      elements.pauseBtn.style.display = "none";
      elements.pauseBtn.textContent = "Pause";
    }

    // Set phase indicator to idle
    if (elements.phaseIndicator) {
      elements.phaseIndicator.textContent = "READY";
      elements.phaseIndicator.className = "timer-phase-indicator phase-idle";
    }

    // Update next/previous button states
    updateNavigationButtons();

    // Show the timer modal
    TimerUI.showTimer();
    console.log("TimerController: Timer modal shown successfully");

    return true;
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

    // Stop the timer if it's running
    const isRunning = workoutTimerModule.isRunning();
    if (isRunning) {
      console.log("TimerController: Stopping timer before hiding");
      workoutTimerModule.stopTimer();
    }

    // Hide the timer modal
    TimerUI.hideTimer();
    console.log("TimerController: Timer modal hidden successfully");
    return true;
  };

  /**
   * Format time in MM:SS format
   * @private
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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

    if (!state) {
      console.warn("TimerController: No state provided to updateDisplay");
      return;
    }

    console.log("TimerController: Updating display with state:", state);

    // Update time display (MM:SS format)
    if (elements.timeDisplay) {
      const formattedTime = formatTime(state.remainingTime || 0);
      elements.timeDisplay.textContent = formattedTime;
    }

    // Update phase indicator
    if (elements.phaseIndicator && state.phase) {
      const phaseText = state.phase.toUpperCase();
      elements.phaseIndicator.textContent = phaseText;
      elements.phaseIndicator.className = "timer-phase-indicator";
      elements.phaseIndicator.classList.add(`phase-${state.phase}`);
    }

    // Update set/cycle information
    if (elements.setInfo) {
      const setText = `Set ${state.currentSet || 1} of ${state.totalSets || 3}`;
      elements.setInfo.textContent = setText;
    }

    if (elements.cycleInfo) {
      const cycleText = `Cycle ${state.currentCycle || 1} of ${
        state.totalCycles || 3
      }`;
      elements.cycleInfo.textContent = cycleText;
    }

    // Update exercise name if available
    if (elements.exerciseName && state.exercise) {
      elements.exerciseName.textContent = state.exercise.name || "Exercise";
    }

    // Update exercise number if available
    if (elements.exerciseNumber && state.exerciseIndex !== undefined) {
      const exerciseNum = state.exerciseIndex + 1;
      elements.exerciseNumber.textContent = `Exercise ${exerciseNum}`;
    }

    // Update progress ring percentage
    if (elements.progressCircle && state.totalTime > 0) {
      const progress =
        ((state.totalTime - state.remainingTime) / state.totalTime) * 100;
      const circumference = 2 * Math.PI * 54; // radius = 54 (from SVG)
      const offset = circumference - (progress / 100) * circumference;

      elements.progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
      elements.progressCircle.style.strokeDashoffset = offset;

      console.log(
        `TimerController: Progress ring updated - ${progress.toFixed(1)}%`
      );
    }

    // Update overall progress bar
    if (elements.progressFill) {
      // Calculate overall progress based on sets and cycles
      const totalSets = state.totalSets || 3;
      const totalCycles = state.totalCycles || 3;
      const currentSet = state.currentSet || 1;
      const currentCycle = state.currentCycle || 1;

      // Calculate completed sets and cycles
      const completedSets = currentSet - 1;
      const completedCycles = currentCycle - 1;

      // Calculate overall progress percentage
      const totalUnits = totalSets * totalCycles;
      const completedUnits = completedSets * totalCycles + completedCycles;
      const overallProgress = (completedUnits / totalUnits) * 100;

      // Update progress bar width
      elements.progressFill.style.width = `${overallProgress}%`;

      console.log(
        `TimerController: Overall progress bar updated - ${overallProgress.toFixed(
          1
        )}%`
      );
    }
  };

  // Public API
  return {
    init,
    isReady,
    showTimer,
    hideTimer,
    updateDisplay,
    setWorkout,
  };
})();
