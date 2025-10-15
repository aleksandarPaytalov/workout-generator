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

  // Countdown beep tracking
  let lastCountdownBeep = -1; // Track last beep second to avoid duplicates

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
    Logger.debug(
      "TimerController",
      "Timer tick - Remaining time:",
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
    Logger.info(
      "TimerController",
      `Phase changed to: ${state.phase} | Set: ${state.currentSet} | Cycle: ${state.currentCycle}`
    );

    // Play selected start sound when WORKING phase starts (each repetition)
    if (
      state.phase === "working" &&
      typeof AudioManager !== "undefined" &&
      AudioManager.isReady() &&
      AudioManager.isEnabled()
    ) {
      // Get selected start sound from settings
      let selectedSound = "whistle"; // default
      if (typeof TimerSettings !== "undefined" && TimerSettings.isReady()) {
        const settings = TimerSettings.getSettings();
        selectedSound = settings.startSound || "whistle";
      }

      AudioManager.playStartSound(selectedSound);
      Logger.info(
        "TimerController",
        `Playing start sound "${selectedSound}" for WORKING phase`
      );
    }

    // Play end sound when transitioning to a new phase (except when starting PREPARE or WORKING phase)
    if (
      state.phase !== "preparing" &&
      state.phase !== "working" &&
      typeof AudioManager !== "undefined" &&
      AudioManager.isReady() &&
      AudioManager.isEnabled()
    ) {
      AudioManager.playEndSound();
    }

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
    Logger.info(
      "TimerController",
      `Exercise completed! Exercise: ${state.exercise?.name || "Unknown"} (${
        state.exerciseIndex + 1
      } of ${state.totalExercises})`
    );

    // Check if we have workout data and can move to next exercise
    if (currentWorkout.length === 0) {
      Logger.warn(
        "TimerController",
        "No workout data available for auto-advance"
      );
      return;
    }

    // Check if we can move to next exercise
    if (currentExerciseIndex >= currentWorkout.length - 1) {
      Logger.info(
        "TimerController",
        "Already at last exercise - no auto-advance"
      );
      return;
    }

    // Auto-advance to next exercise
    Logger.info("TimerController", "Auto-advancing to next exercise...");

    // Move to next exercise
    currentExerciseIndex++;
    const nextExercise = currentWorkout[currentExerciseIndex];

    Logger.info(
      "TimerController",
      `Auto-starting exercise ${currentExerciseIndex + 1}: ${nextExercise.name}`
    );

    // Start timer for next exercise automatically
    const totalExercises = currentWorkout.length;
    workoutTimerModule.startTimer(
      nextExercise,
      currentExerciseIndex,
      totalExercises
    );

    // Update exercise info display
    if (elements.exerciseNumber) {
      elements.exerciseNumber.textContent = `Exercise ${
        currentExerciseIndex + 1
      } of ${totalExercises}`;
    }

    // Update exercise name in header
    if (elements.exerciseName) {
      elements.exerciseName.textContent = nextExercise.name;
    }

    // Update navigation buttons
    updateNavigationButtons();
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
    Logger.info(
      "TimerController",
      `🎉 WORKOUT COMPLETED! 🎉 Total exercises: ${state.totalExercises}`
    );

    // Play end sound for workout completion
    if (
      typeof AudioManager !== "undefined" &&
      AudioManager.isReady() &&
      AudioManager.isEnabled()
    ) {
      AudioManager.playEndSound();
    }

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

    Logger.info("TimerController", "Workout completed successfully!");

    // Update display with final state
    updateDisplay(state);
  };

  /**
   * Set up event listeners for timer events
   * @private
   */
  const setupEventListeners = () => {
    Logger.debug("TimerController", "Setting up event listeners...");

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

    Logger.debug("TimerController", "Event listeners set up successfully");
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
      Logger.debug("TimerController", "Escape key pressed - closing timer");
      hideTimer();
    }

    // Space key - pause/resume timer
    if (event.key === " " || event.code === "Space") {
      event.preventDefault();
      Logger.debug("TimerController", "Space key pressed - toggling pause");
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
      Logger.debug("TimerController", "Backdrop clicked - closing timer");
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

    Logger.debug("TimerController", "Close button clicked");
    hideTimer();
  };

  /**
   * Set up button event listeners
   * @private
   */
  const setupButtonListeners = () => {
    Logger.debug("TimerController", "Setting up button listeners...");

    // Start button
    if (elements.startBtn) {
      elements.startBtn.addEventListener("click", handleStart);
      Logger.debug("TimerController", "Start button listener added");
    }

    // Pause/Resume button
    if (elements.pauseBtn) {
      elements.pauseBtn.addEventListener("click", handlePause);
      Logger.debug("TimerController", "Pause button listener added");
    }

    // Skip button
    if (elements.skipBtn) {
      elements.skipBtn.addEventListener("click", handleSkip);
      Logger.debug("TimerController", "Skip button listener added");
    }

    // Reset button
    if (elements.resetBtn) {
      elements.resetBtn.addEventListener("click", handleReset);
      Logger.debug("TimerController", "Reset button listener added");
    }

    // Next exercise button
    if (elements.nextBtn) {
      elements.nextBtn.addEventListener("click", handleNext);
      Logger.debug("TimerController", "Next button listener added");
    }

    // Previous exercise button
    if (elements.prevBtn) {
      elements.prevBtn.addEventListener("click", handlePrevious);
      Logger.debug("TimerController", "Previous button listener added");
    }

    // Settings button
    if (elements.settingsBtn) {
      elements.settingsBtn.addEventListener("click", handleSettings);
      Logger.debug("TimerController", "Settings button listener added");
    }

    // Keyboard shortcuts
    document.addEventListener("keydown", handleKeyboardShortcuts);
    Logger.debug("TimerController", "Keyboard shortcuts listener added");

    // Modal backdrop click
    if (elements.overlay) {
      elements.overlay.addEventListener("click", handleBackdropClick);
      Logger.debug("TimerController", "Backdrop click listener added");
    }

    // Close button
    if (elements.closeBtn) {
      elements.closeBtn.addEventListener("click", handleCloseButton);
      Logger.debug("TimerController", "Close button listener added");
    }

    Logger.debug("TimerController", "Button listeners set up successfully");
  };

  /**
   * Initialize the Timer Controller module
   * @public
   * @returns {boolean} True if initialization successful
   */
  const init = () => {
    if (isInitialized) {
      Logger.warn("TimerController", "Already initialized");
      return false;
    }

    try {
      Logger.info("TimerController", "Initializing...");

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
      Logger.debug("TimerController", "Module references stored successfully");

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

      Logger.debug("TimerController", "DOM elements populated successfully");

      // Set up event listeners for timer events
      setupEventListeners();

      // Set up button event listeners
      setupButtonListeners();

      // Initialize AudioManager with soundEnabled setting
      if (typeof AudioManager !== "undefined" && AudioManager.isReady()) {
        if (typeof TimerSettings !== "undefined" && TimerSettings.isReady()) {
          const settings = TimerSettings.getSettings();
          AudioManager.setEnabled(settings.soundEnabled);
          Logger.debug(
            "TimerController",
            `AudioManager initialized with soundEnabled: ${settings.soundEnabled}`
          );
        }
      }

      isInitialized = true;
      Logger.info("TimerController", "Initialized successfully");
      return true;
    } catch (error) {
      Logger.error("TimerController", "Initialization failed", error);
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
      Logger.error("TimerController", "Not initialized");
      return;
    }

    Logger.info("TimerController", "Start button clicked");

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
      Logger.info("TimerController", "Timer started successfully");

      // Note: Whistle sound will play automatically when WORKING phase starts
      // (handled in handlePhaseChanged function)

      // Update button states
      if (elements.startBtn) {
        elements.startBtn.style.display = "none";
      }
      if (elements.pauseBtn) {
        elements.pauseBtn.style.display = "inline-block";
        elements.pauseBtn.textContent = "Pause";
      }
    } else {
      Logger.error("TimerController", "Failed to start timer");
    }
  };

  /**
   * Handle pause button click
   * @private
   */
  const handlePause = () => {
    if (!isInitialized) {
      Logger.error("TimerController", "Not initialized");
      return;
    }

    Logger.info("TimerController", "Pause button clicked");

    // Check if timer is currently paused
    const isPaused = workoutTimerModule.isPaused();

    if (isPaused) {
      // Resume the timer
      const resumed = workoutTimerModule.resumeTimer();

      if (resumed) {
        Logger.info("TimerController", "Timer resumed successfully");

        // Update button text to "Pause"
        if (elements.pauseBtn) {
          elements.pauseBtn.textContent = "Pause";
        }
      } else {
        Logger.error("TimerController", "Failed to resume timer");
      }
    } else {
      // Pause the timer
      const paused = workoutTimerModule.pauseTimer();

      if (paused) {
        Logger.info("TimerController", "Timer paused successfully");

        // Update button text to "Resume"
        if (elements.pauseBtn) {
          elements.pauseBtn.textContent = "Resume";
        }
      } else {
        Logger.error("TimerController", "Failed to pause timer");
      }
    }
  };

  /**
   * Handle skip button click
   * @private
   */
  const handleSkip = () => {
    if (!isInitialized) {
      Logger.error("TimerController", "Not initialized");
      return;
    }

    Logger.info("TimerController", "Skip button clicked");

    // Skip to next phase
    const skipped = workoutTimerModule.skipPhase();

    if (skipped) {
      Logger.info("TimerController", "Phase skipped successfully");
    } else {
      Logger.error("TimerController", "Failed to skip phase");
    }
  };

  /**
   * Handle reset button click
   * @private
   */
  const handleReset = () => {
    if (!isInitialized) {
      Logger.error("TimerController", "Not initialized");
      return;
    }

    Logger.info("TimerController", "Reset button clicked");

    // Reset the current exercise timer
    const reset = workoutTimerModule.resetExercise();

    if (reset) {
      Logger.info("TimerController", "Exercise timer reset successfully");

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
      Logger.error("TimerController", "Failed to reset exercise timer");
    }
  };

  /**
   * Handle next exercise button click
   * @private
   */
  const handleNext = () => {
    if (!isInitialized) {
      Logger.error("TimerController", "Not initialized");
      return;
    }

    Logger.info("TimerController", "Next exercise button clicked");

    // Check if we have workout data
    if (currentWorkout.length === 0) {
      Logger.warn("TimerController", "No workout data available");
      return;
    }

    // Check if we can move to next exercise
    if (currentExerciseIndex >= currentWorkout.length - 1) {
      Logger.info("TimerController", "Already at last exercise");
      return;
    }

    // Stop current timer
    if (workoutTimerModule && workoutTimerModule.isRunning()) {
      workoutTimerModule.stopTimer();
    }

    // Move to next exercise
    currentExerciseIndex++;
    const nextExercise = currentWorkout[currentExerciseIndex];

    Logger.info(
      "TimerController",
      `Moving to exercise ${currentExerciseIndex + 1}: ${nextExercise.name}`
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
      Logger.error("TimerController", "Not initialized");
      return;
    }

    Logger.info("TimerController", "Previous exercise button clicked");

    // Check if we have workout data
    if (currentWorkout.length === 0) {
      Logger.warn("TimerController", "No workout data available");
      return;
    }

    // Check if we can move to previous exercise
    if (currentExerciseIndex === 0) {
      Logger.info("TimerController", "Already at first exercise");
      return;
    }

    // Stop current timer
    if (workoutTimerModule && workoutTimerModule.isRunning()) {
      workoutTimerModule.stopTimer();
    }

    // Move to previous exercise
    currentExerciseIndex--;
    const prevExercise = currentWorkout[currentExerciseIndex];

    Logger.info(
      "TimerController",
      `Moving to exercise ${currentExerciseIndex + 1}: ${prevExercise.name}`
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
      Logger.error("TimerController", "Not initialized");
      return;
    }

    Logger.info("TimerController", "Settings button clicked");

    // Create settings modal if not already created
    if (!elements.settingsOverlay) {
      timerUIModule.createSettingsModal();
      setupSettingsListeners();
    }

    // Load current settings from TimerSettings module
    loadSettingsIntoForm();

    // Show settings modal
    timerUIModule.showSettingsModal();
    Logger.info("TimerController", "Settings modal opened");
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

    // Preview sound button
    const previewBtn =
      elements.settingsModal?.querySelector(".btn-preview-sound");
    if (previewBtn) {
      previewBtn.addEventListener("click", () => {
        const soundSelect =
          elements.settingsModal?.querySelector("#startSoundSelect");
        const selectedSound = soundSelect?.value || "whistle";

        if (typeof AudioManager !== "undefined" && AudioManager.isReady()) {
          Logger.debug("TimerController", `Previewing sound: ${selectedSound}`);
          AudioManager.playStartSound(selectedSound);
        } else {
          Logger.warn(
            "TimerController",
            "AudioManager not available for preview"
          );
        }
      });
    }

    Logger.debug("TimerController", "Settings modal listeners setup");
  };

  /**
   * Load current settings into form
   * @private
   */
  const loadSettingsIntoForm = () => {
    Logger.debug("TimerController", "loadSettingsIntoForm called");
    Logger.debug(
      "TimerController",
      "typeof TimerSettings:",
      typeof TimerSettings
    );
    Logger.debug(
      "TimerController",
      "TimerSettings.isReady():",
      typeof TimerSettings !== "undefined"
        ? TimerSettings.isReady()
        : "undefined"
    );

    if (typeof TimerSettings === "undefined" || !TimerSettings.isReady()) {
      Logger.error("TimerController", "TimerSettings module not ready");
      return;
    }

    const settings = TimerSettings.getSettings();
    Logger.debug(
      "TimerController",
      "Current settings from TimerSettings:",
      settings
    );
    const elements = timerUIModule.getElements();

    if (!elements.settingsForm) {
      Logger.error("TimerController", "Settings form not found");
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
        // Set the checked property
        input.checked = settings[field];

        Logger.debug(
          "TimerController",
          `Loaded checkbox "${field}" = ${settings[field]} (input.checked = ${input.checked})`
        );
      } else {
        Logger.warn(
          "TimerController",
          `Checkbox "${field}" not found or setting undefined`
        );
      }
    });

    // Load start sound selection
    const soundSelect =
      elements.settingsModal?.querySelector("#startSoundSelect");
    if (soundSelect && settings.startSound) {
      soundSelect.value = settings.startSound;
      Logger.debug(
        "TimerController",
        `Loaded start sound: ${settings.startSound}`
      );
    }

    Logger.debug("TimerController", "Settings loaded into form");
  };

  /**
   * Handle save settings button click
   * @private
   */
  const handleSaveSettings = () => {
    if (typeof TimerSettings === "undefined" || !TimerSettings.isReady()) {
      Logger.error("TimerController", "TimerSettings module not ready");
      return;
    }

    const elements = timerUIModule.getElements();

    if (!elements.settingsForm) {
      Logger.error("TimerController", "Settings form not found");
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

    // Parse checkbox fields - IMPORTANT: Unchecked checkboxes don't appear in FormData
    // We need to check the actual checkbox element's checked property
    const soundEnabledCheckbox = elements.settingsForm.querySelector(
      "#timer-setting-soundEnabled"
    );
    const voiceEnabledCheckbox = elements.settingsForm.querySelector(
      "#timer-setting-voiceEnabled"
    );

    newSettings.soundEnabled = soundEnabledCheckbox
      ? soundEnabledCheckbox.checked
      : false;
    newSettings.voiceEnabled = voiceEnabledCheckbox
      ? voiceEnabledCheckbox.checked
      : false;

    Logger.debug(
      "TimerController",
      `Checkbox values - soundEnabled: ${newSettings.soundEnabled}, voiceEnabled: ${newSettings.voiceEnabled}`
    );

    // Get selected start sound
    const soundSelect =
      elements.settingsModal?.querySelector("#startSoundSelect");
    const startSound = soundSelect?.value || "whistle";
    newSettings.startSound = startSound;

    Logger.debug("TimerController", "New settings collected:", newSettings);

    // Update settings
    const result = TimerSettings.updateSettings(newSettings);

    if (result.success) {
      Logger.info("TimerController", "Settings saved successfully");

      // Update timer configuration if timer module is ready
      if (workoutTimerModule && workoutTimerModule.isReady()) {
        const updatedSettings = TimerSettings.getSettings();
        workoutTimerModule.setTimerConfig(updatedSettings);
        Logger.debug("TimerController", "Timer configuration updated");
      }

      // Update AudioManager sound enabled state
      if (typeof AudioManager !== "undefined" && AudioManager.isReady()) {
        Logger.debug(
          "TimerController",
          `Updating AudioManager - soundEnabled: ${newSettings.soundEnabled}`
        );
        AudioManager.setEnabled(newSettings.soundEnabled);
        Logger.debug(
          "TimerController",
          `AudioManager sound ${
            newSettings.soundEnabled ? "ENABLED" : "DISABLED"
          }`
        );
        Logger.debug(
          "TimerController",
          `AudioManager.isEnabled() = ${AudioManager.isEnabled()}`
        );
      } else {
        Logger.warn(
          "TimerController",
          "AudioManager not available or not ready"
        );
      }

      // Hide modal
      timerUIModule.hideSettingsModal();

      // Show success toast notification
      showToast(
        `Settings saved! Sound notifications ${
          newSettings.soundEnabled ? "enabled" : "disabled"
        }`,
        "success"
      );
      Logger.info("TimerController", "Settings saved and applied");
    } else {
      Logger.error(
        "TimerController",
        "Failed to save settings:",
        result.errors
      );
      showToast(
        "Failed to save settings: " + result.errors.join(", "),
        "error"
      );
    }
  };

  /**
   * Show toast notification
   * @private
   * @param {string} message - Message to display
   * @param {string} type - Type of toast (success, error, info)
   */
  const showToast = (message, type = "info") => {
    // Create toast container if it doesn't exist
    let toastContainer = document.querySelector(".toast-container");
    if (!toastContainer) {
      toastContainer = document.createElement("div");
      toastContainer.className = "toast-container";
      document.body.appendChild(toastContainer);
    }

    // Create toast element
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;

    // Add icon based on type
    const icon = type === "success" ? "✓" : type === "error" ? "✕" : "ℹ";
    toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-message">${message}</span>`;

    // Add to container
    toastContainer.appendChild(toast);

    // Trigger animation
    setTimeout(() => {
      toast.classList.add("toast-show");
    }, 10);

    // Remove after 3 seconds
    setTimeout(() => {
      toast.classList.remove("toast-show");
      setTimeout(() => {
        toast.remove();
        // Remove container if empty
        if (toastContainer.children.length === 0) {
          toastContainer.remove();
        }
      }, 300);
    }, 3000);
  };

  /**
   * Handle reset settings button click
   * @private
   */
  const handleResetSettings = () => {
    if (typeof TimerSettings === "undefined" || !TimerSettings.isReady()) {
      Logger.error("TimerController", "TimerSettings module not ready");
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
    Logger.info("TimerController", "Settings reset to defaults");

    // Reload form with default values
    loadSettingsIntoForm();

    Logger.debug("TimerController", "Settings form reloaded with defaults");
  };

  /**
   * Set workout data for navigation
   * @public
   * @param {Array} workout - Array of exercise objects
   */
  const setWorkout = (workout) => {
    if (!Array.isArray(workout)) {
      Logger.error("TimerController", "Workout must be an array");
      return;
    }

    currentWorkout = workout;
    Logger.debug(
      "TimerController",
      `Workout data set (${workout.length} exercises)`
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
      Logger.error("TimerController", "Not initialized");
      return false;
    }

    if (!exercise) {
      Logger.error("TimerController", "No exercise provided");
      return false;
    }

    Logger.info("TimerController", "Showing timer for exercise:", exercise);

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
    Logger.info("TimerController", "Timer modal shown successfully");

    return true;
  };

  /**
   * Hide timer
   * @public
   * @returns {boolean} True if timer hidden successfully
   */
  const hideTimer = () => {
    if (!isInitialized) {
      Logger.error("TimerController", "Not initialized");
      return false;
    }

    Logger.info("TimerController", "Hiding timer");

    // Stop the timer if it's running
    const isRunning = workoutTimerModule.isRunning();
    if (isRunning) {
      Logger.debug("TimerController", "Stopping timer before hiding");
      workoutTimerModule.stopTimer();
    }

    // Hide the timer modal
    TimerUI.hideTimer();
    Logger.info("TimerController", "Timer modal hidden successfully");
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
      Logger.error("TimerController", "Not initialized");
      return;
    }

    if (!state) {
      Logger.warn("TimerController", "No state provided to updateDisplay");
      return;
    }

    Logger.debug("TimerController", "Updating display with state:", state);

    // Update time display (MM:SS format)
    if (elements.timeDisplay) {
      const formattedTime = formatTime(state.remainingTime || 0);
      elements.timeDisplay.textContent = formattedTime;
    }

    // Play countdown beeps for last 5 seconds
    if (state.remainingTime <= 5 && state.remainingTime > 0) {
      if (state.remainingTime !== lastCountdownBeep) {
        lastCountdownBeep = state.remainingTime;
        if (
          typeof AudioManager !== "undefined" &&
          AudioManager.isReady() &&
          AudioManager.isEnabled()
        ) {
          AudioManager.playCountdownBeep();
        }
      }
    } else {
      lastCountdownBeep = -1; // Reset when not in countdown range
    }

    // Update phase indicator
    if (elements.phaseIndicator && state.phase) {
      const phaseText = state.phase.toUpperCase();
      elements.phaseIndicator.textContent = phaseText;
      elements.phaseIndicator.className = "timer-phase-indicator";
      elements.phaseIndicator.classList.add(`phase-${state.phase}`);
    }

    // Update set/cycle information (progress section only - removed from main display)
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
      const total = state.totalExercises || currentWorkout.length || "?";
      elements.exerciseNumber.textContent = `Exercise ${exerciseNum} of ${total}`;
    }

    // Update progress ring percentage (fills clockwise from 0% to 100%)
    if (elements.progressCircle && state.totalTime > 0) {
      const progress =
        ((state.totalTime - state.remainingTime) / state.totalTime) * 100;
      const radius = 120; // Match the SVG circle radius
      const circumference = 2 * Math.PI * radius; // ≈ 754
      // Calculate offset: starts at full circumference (0%) and decreases to 0 (100%)
      const offset = circumference - (progress / 100) * circumference;

      elements.progressCircle.style.strokeDashoffset = offset;

      Logger.debug(
        "TimerController",
        `Progress ring updated - ${progress.toFixed(1)}%`
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

      Logger.debug(
        "TimerController",
        `Overall progress bar updated - ${overallProgress.toFixed(1)}%`
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
