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
   * Handle workout completed event
   * @private
   * @param {CustomEvent} event - Workout completed event
   */
  const handleWorkoutCompleted = (event) => {
    if (!isInitialized) {
      return;
    }

    const state = event.detail;
    console.log(
      "TimerController: 🎉 WORKOUT COMPLETED! 🎉",
      "Total exercises:",
      state.totalExercises
    );

    // Update phase indicator to show workout completion
    if (elements.phaseIndicator) {
      elements.phaseIndicator.textContent = "🎉 WORKOUT COMPLETE! 🎉";
      elements.phaseIndicator.className =
        "timer-phase-indicator phase-completed";
    }

    // Show congratulatory message
    alert(
      `🎉 Congratulations! 🎉\n\nYou've completed the entire workout!\n\nTotal exercises: ${state.totalExercises}\n\nGreat job! Keep up the excellent work!`
    );

    console.log("TimerController: Workout completed successfully!");

    // Update display with final state
    updateDisplay(state);
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

    // Listen to timer:workoutCompleted for workout completion
    document.addEventListener(
      TIMER_EVENTS.WORKOUT_COMPLETED,
      handleWorkoutCompleted
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

    // Use the current exercise that was set when showTimer was called
    const exercise = currentExercise || {
      name: "Test Exercise",
      muscleGroup: "chest",
      sets: 3,
      reps: 10,
    };

    // Get total exercises from workout
    const totalExercises = currentWorkout.length || 1;

    // Start the timer with the exercise, index, and total count
    const started = workoutTimerModule.startTimer(
      exercise,
      currentExerciseIndex,
      totalExercises
    );

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

    // Create settings modal if not already created
    if (!elements.settingsOverlay) {
      timerUIModule.createSettingsModal();
      setupSettingsListeners();
    }

    // Load current settings from TimerSettings module
    loadSettingsIntoForm();

    // Show settings modal
    timerUIModule.showSettingsModal();
    console.log("TimerController: Settings modal opened");
  };

  /**
   * Setup settings modal event listeners
   * @private
   */
  const setupSettingsListeners = () => {
    const elements = timerUIModule.getElements();

    // Close button
    if (elements.settingsCloseBtn) {
      elements.settingsCloseBtn.addEventListener("click", () => {
        timerUIModule.hideSettingsModal();
      });
    }

    // Cancel button
    if (elements.settingsCancelBtn) {
      elements.settingsCancelBtn.addEventListener("click", () => {
        timerUIModule.hideSettingsModal();
      });
    }

    // Save button
    if (elements.settingsSaveBtn) {
      elements.settingsSaveBtn.addEventListener("click", handleSaveSettings);
    }

    // Reset button
    if (elements.settingsResetBtn) {
      elements.settingsResetBtn.addEventListener("click", handleResetSettings);
    }

    // Backdrop click
    if (elements.settingsOverlay) {
      elements.settingsOverlay.addEventListener("click", (e) => {
        if (e.target === elements.settingsOverlay) {
          timerUIModule.hideSettingsModal();
        }
      });
    }

    console.log("TimerController: Settings modal listeners setup");
  };

  /**
   * Load current settings into form
   * @private
   */
  const loadSettingsIntoForm = () => {
    console.log("TimerController: loadSettingsIntoForm called");
    console.log("TimerController: typeof TimerSettings:", typeof TimerSettings);
    console.log(
      "TimerController: TimerSettings.isReady():",
      typeof TimerSettings !== "undefined"
        ? TimerSettings.isReady()
        : "undefined"
    );

    if (typeof TimerSettings === "undefined" || !TimerSettings.isReady()) {
      console.error("TimerController: TimerSettings module not ready");
      return;
    }

    const settings = TimerSettings.getSettings();
    const elements = timerUIModule.getElements();

    if (!elements.settingsForm) {
      console.error("TimerController: Settings form not found");
      return;
    }

    // Load numeric settings
    const numericFields = [
      "prepare",
      "work",
      "rest",
      "cyclesPerSet",
      "sets",
      "restBetweenSets",
    ];

    numericFields.forEach((field) => {
      const input = elements.settingsForm.querySelector(
        `#timer-setting-${field}`
      );
      if (input && settings[field] !== undefined) {
        input.value = settings[field];
      }
    });

    // Load checkbox settings
    const checkboxFields = ["soundEnabled", "voiceEnabled"];

    checkboxFields.forEach((field) => {
      const input = elements.settingsForm.querySelector(
        `#timer-setting-${field}`
      );
      if (input && settings[field] !== undefined) {
        input.checked = settings[field];
      }
    });

    console.log("TimerController: Settings loaded into form");
  };

  /**
   * Handle save settings button click
   * @private
   */
  const handleSaveSettings = () => {
    if (typeof TimerSettings === "undefined" || !TimerSettings.isReady()) {
      console.error("TimerController: TimerSettings module not ready");
      return;
    }

    const elements = timerUIModule.getElements();

    if (!elements.settingsForm) {
      console.error("TimerController: Settings form not found");
      return;
    }

    // Collect form data
    const formData = new FormData(elements.settingsForm);
    const newSettings = {};

    // Parse numeric fields
    const numericFields = [
      "prepare",
      "work",
      "rest",
      "cyclesPerSet",
      "sets",
      "restBetweenSets",
    ];

    numericFields.forEach((field) => {
      const value = formData.get(field);
      if (value !== null) {
        newSettings[field] = parseInt(value, 10);
      }
    });

    // Parse checkbox fields
    newSettings.soundEnabled = formData.get("soundEnabled") === "on";
    newSettings.voiceEnabled = formData.get("voiceEnabled") === "on";

    console.log("TimerController: New settings collected:", newSettings);

    // Update settings
    const result = TimerSettings.updateSettings(newSettings);

    if (result.success) {
      console.log("TimerController: Settings saved successfully");

      // Update timer configuration if timer module is ready
      if (workoutTimerModule && workoutTimerModule.isReady()) {
        const updatedSettings = TimerSettings.getSettings();
        workoutTimerModule.setTimerConfig(updatedSettings);
        console.log("TimerController: Timer configuration updated");
      }

      // Hide modal
      timerUIModule.hideSettingsModal();

      // Show success message (optional)
      console.log("TimerController: Settings saved and applied");
    } else {
      console.error("TimerController: Failed to save settings:", result.errors);
      alert("Failed to save settings:\n" + result.errors.join("\n"));
    }
  };

  /**
   * Handle reset settings button click
   * @private
   */
  const handleResetSettings = () => {
    if (typeof TimerSettings === "undefined" || !TimerSettings.isReady()) {
      console.error("TimerController: TimerSettings module not ready");
      return;
    }

    // Confirm reset
    const confirmed = confirm(
      "Are you sure you want to reset all settings to defaults?"
    );

    if (!confirmed) {
      return;
    }

    // Reset to defaults
    TimerSettings.resetToDefaults();
    console.log("TimerController: Settings reset to defaults");

    // Reload form with default values
    loadSettingsIntoForm();

    console.log("TimerController: Settings form reloaded with defaults");
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

    // Update set/cycle information (main display)
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

    // Update set/cycle information (progress section)
    if (elements.setInfoProgress) {
      const setText = ` ${state.currentSet || 1} of ${state.totalSets || 3}`;
      elements.setInfoProgress.textContent = setText;
    }

    if (elements.cycleInfoProgress) {
      const cycleText = ` ${state.currentCycle || 1} of ${
        state.totalCycles || 3
      }`;
      elements.cycleInfoProgress.textContent = cycleText;
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
