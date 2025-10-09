/**
 * Workout Timer Module
 * Manages workout timer with manual user operations only
 * Tracks time during exercises with Prepare, Work, Rest phases, Cycles, and Sets
 */

const WorkoutTimer = (() => {
  "use strict";

  // Module state
  let isInitialized = false;
  let timerInterval = null;
  let currentWorkout = null;

  // Timer configuration with default values
  const defaultConfig = {
    prepare: 10, // Prepare time in seconds
    work: 45, // Work time in seconds
    rest: 15, // Rest time in seconds
    cyclesPerSet: 3, // Number of cycles per set
    sets: 3, // Number of sets per exercise
    restBetweenSets: 60, // Rest between sets in seconds
    autoAdvance: true, // Auto-advance to next exercise
    soundEnabled: true, // Enable sound notifications
    voiceEnabled: false, // Enable voice announcements
  };

  // Current timer configuration (can be modified)
  let timerConfig = { ...defaultConfig };

  // Timer state object
  let timerState = {
    phase: "idle", // Current phase: idle, preparing, working, resting, paused, completed
    exercise: null, // Current exercise object
    exerciseIndex: 0, // Index in workout array
    currentSet: 1, // Current set number
    currentCycle: 1, // Current cycle number
    remainingTime: 0, // Remaining time in seconds
    totalTime: 0, // Total time for current phase
    isPaused: false, // Pause state
    startTime: null, // Timestamp when started
    pausedTime: 0, // Total paused time in milliseconds
    pauseStartTime: null, // Timestamp when paused
  };

  // Timer events constants
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

  /**
   * Initialize the WorkoutTimer module
   * @public
   */
  const init = () => {
    try {
      console.log("WorkoutTimer: Initializing module...");

      // Reset state
      isInitialized = true;

      console.log("WorkoutTimer: Module initialized successfully");
      console.log("WorkoutTimer: Default config:", timerConfig);

      return true;
    } catch (error) {
      console.error("WorkoutTimer: Initialization failed:", error.message);
      throw error;
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
   * Get current timer configuration
   * @public
   * @returns {Object} Current timer configuration
   */
  const getTimerConfig = () => {
    return { ...timerConfig };
  };

  /**
   * Get default timer configuration
   * @public
   * @returns {Object} Default timer configuration
   */
  const getDefaultConfig = () => {
    return { ...defaultConfig };
  };

  /**
   * Set timer configuration
   * @public
   * @param {Object} config - New configuration object
   * @returns {boolean} True if configuration was set successfully
   */
  const setTimerConfig = (config) => {
    try {
      if (!config || typeof config !== "object") {
        throw new Error("Invalid configuration object");
      }

      // Merge with existing config
      timerConfig = { ...timerConfig, ...config };

      console.log("WorkoutTimer: Configuration updated:", timerConfig);
      return true;
    } catch (error) {
      console.error(
        "WorkoutTimer: Failed to set configuration:",
        error.message
      );
      return false;
    }
  };

  /**
   * Get current timer phase
   * @public
   * @returns {string} Current phase (idle, preparing, working, resting, paused, completed)
   */
  const getCurrentPhase = () => {
    return timerState.phase;
  };

  /**
   * Get remaining time in current phase
   * @public
   * @returns {number} Remaining time in seconds
   */
  const getRemainingTime = () => {
    return timerState.remainingTime;
  };

  /**
   * Get current cycle number
   * @public
   * @returns {number} Current cycle number
   */
  const getCurrentCycle = () => {
    return timerState.currentCycle;
  };

  /**
   * Get current set number
   * @public
   * @returns {number} Current set number
   */
  const getCurrentSet = () => {
    return timerState.currentSet;
  };

  /**
   * Get overall progress percentage
   * @public
   * @returns {number} Progress percentage (0-100)
   */
  const getProgress = () => {
    if (!timerState.exercise) return 0;

    const totalCycles = timerConfig.cyclesPerSet * timerConfig.sets;
    const completedCycles =
      (timerState.currentSet - 1) * timerConfig.cyclesPerSet +
      (timerState.currentCycle - 1);

    return Math.round((completedCycles / totalCycles) * 100);
  };

  /**
   * Check if timer is running
   * @public
   * @returns {boolean} True if timer is running
   */
  const isRunning = () => {
    return timerInterval !== null && !timerState.isPaused;
  };

  /**
   * Check if timer is paused
   * @public
   * @returns {boolean} True if timer is paused
   */
  const isPaused = () => {
    return timerState.isPaused;
  };

  /**
   * Get current timer state (for debugging)
   * @public
   * @returns {Object} Current timer state
   */
  const getTimerState = () => {
    return { ...timerState };
  };

  /**
   * Reset timer state to initial values
   * @private
   */
  const resetTimerState = () => {
    timerState = {
      phase: "idle",
      exercise: null,
      exerciseIndex: 0,
      currentSet: 1,
      currentCycle: 1,
      remainingTime: 0,
      totalTime: 0,
      isPaused: false,
      startTime: null,
      pausedTime: 0,
      pauseStartTime: null,
    };
    console.log("WorkoutTimer: State reset to idle");
  };

  /**
   * Update timer state
   * @private
   * @param {Object} updates - Object with state properties to update
   */
  const updateTimerState = (updates) => {
    timerState = { ...timerState, ...updates };
    console.log("WorkoutTimer: State updated:", updates);
  };

  /**
   * Set current exercise
   * @private
   * @param {Object} exercise - Exercise object
   * @param {number} index - Exercise index in workout
   */
  const setCurrentExercise = (exercise, index = 0) => {
    if (!exercise) {
      console.error("WorkoutTimer: Invalid exercise object");
      return false;
    }

    updateTimerState({
      exercise: exercise,
      exerciseIndex: index,
      currentSet: 1,
      currentCycle: 1,
    });

    console.log(`WorkoutTimer: Exercise set - ${exercise.name} (${index})`);
    return true;
  };

  /**
   * Advance to next cycle
   * @private
   * @returns {boolean} True if advanced to next cycle, false if set completed
   */
  const advanceToNextCycle = () => {
    if (timerState.currentCycle < timerConfig.cyclesPerSet) {
      updateTimerState({
        currentCycle: timerState.currentCycle + 1,
      });
      console.log(`WorkoutTimer: Advanced to cycle ${timerState.currentCycle}`);
      return true;
    }
    return false; // Set completed
  };

  /**
   * Advance to next set
   * @private
   * @returns {boolean} True if advanced to next set, false if exercise completed
   */
  const advanceToNextSet = () => {
    if (timerState.currentSet < timerConfig.sets) {
      updateTimerState({
        currentSet: timerState.currentSet + 1,
        currentCycle: 1, // Reset cycle counter for new set
      });
      console.log(`WorkoutTimer: Advanced to set ${timerState.currentSet}`);
      return true;
    }
    return false; // Exercise completed
  };

  /**
   * Set timer phase
   * @private
   * @param {string} phase - New phase (idle, preparing, working, resting, paused, completed)
   * @param {number} duration - Duration in seconds for this phase
   */
  const setPhase = (phase, duration = 0) => {
    const validPhases = [
      "idle",
      "preparing",
      "working",
      "resting",
      "paused",
      "completed",
    ];

    if (!validPhases.includes(phase)) {
      console.error(`WorkoutTimer: Invalid phase "${phase}"`);
      return false;
    }

    updateTimerState({
      phase: phase,
      remainingTime: duration,
      totalTime: duration,
      startTime: Date.now(),
    });

    console.log(`WorkoutTimer: Phase changed to "${phase}" (${duration}s)`);
    emitEvent(TIMER_EVENTS.PHASE_CHANGED, {
      phase: phase,
      duration: duration,
      exercise: timerState.exercise,
      set: timerState.currentSet,
      cycle: timerState.currentCycle,
    });

    return true;
  };

  /**
   * Start the timer countdown
   * @private
   */
  const startCountdown = () => {
    // Clear any existing interval
    if (timerInterval) {
      clearInterval(timerInterval);
    }

    // Start interval with 100ms precision for accuracy
    timerInterval = setInterval(() => {
      if (timerState.isPaused) {
        return; // Don't update if paused
      }

      // Calculate elapsed time accounting for paused time
      const now = Date.now();
      const elapsed = Math.floor(
        (now - timerState.startTime - timerState.pausedTime) / 1000
      );
      const remaining = Math.max(0, timerState.totalTime - elapsed);

      // Update remaining time
      updateTimerState({ remainingTime: remaining });

      // Emit tick event every second
      emitEvent(TIMER_EVENTS.TICK, {
        phase: timerState.phase,
        remainingTime: remaining,
        totalTime: timerState.totalTime,
        exercise: timerState.exercise,
        set: timerState.currentSet,
        cycle: timerState.currentCycle,
      });

      // Check if phase is complete
      if (remaining <= 0) {
        handlePhaseComplete();
      }
    }, 100); // 100ms interval for smooth updates
  };

  /**
   * Handle phase completion and transition to next phase
   * @private
   */
  const handlePhaseComplete = () => {
    const currentPhase = timerState.phase;

    console.log(`WorkoutTimer: Phase "${currentPhase}" completed`);

    // Determine next phase based on current phase
    if (currentPhase === "preparing") {
      // Prepare -> Work
      setPhase("working", timerConfig.work);
      startCountdown();
    } else if (currentPhase === "working") {
      // Work -> Rest or next cycle/set
      const hasMoreCycles = advanceToNextCycle();

      if (hasMoreCycles) {
        // More cycles in this set -> Rest
        setPhase("resting", timerConfig.rest);
        startCountdown();
      } else {
        // Cycle completed, emit event
        emitEvent(TIMER_EVENTS.CYCLE_COMPLETED, {
          exercise: timerState.exercise,
          set: timerState.currentSet,
          cycle: timerConfig.cyclesPerSet,
        });

        const hasMoreSets = advanceToNextSet();

        if (hasMoreSets) {
          // More sets -> Rest between sets
          setPhase("resting", timerConfig.restBetweenSets);
          emitEvent(TIMER_EVENTS.SET_COMPLETED, {
            exercise: timerState.exercise,
            set: timerState.currentSet - 1,
          });
          startCountdown();
        } else {
          // Exercise completed
          stopTimer();
          setPhase("completed", 0);
          emitEvent(TIMER_EVENTS.EXERCISE_COMPLETED, {
            exercise: timerState.exercise,
          });
        }
      }
    } else if (currentPhase === "resting") {
      // Rest -> Work (next cycle)
      setPhase("working", timerConfig.work);
      startCountdown();
    }
  };

  /**
   * Start timer for an exercise
   * @public
   * @param {Object} exercise - Exercise object to time
   * @param {number} index - Exercise index in workout (optional)
   * @returns {boolean} True if timer started successfully
   */
  const startTimer = (exercise, index = 0) => {
    try {
      if (!isInitialized) {
        throw new Error("WorkoutTimer not initialized");
      }

      if (!exercise) {
        throw new Error("Invalid exercise object");
      }

      // Set current exercise
      if (!setCurrentExercise(exercise, index)) {
        throw new Error("Failed to set exercise");
      }

      // Start with prepare phase
      setPhase("preparing", timerConfig.prepare);

      // Emit started event
      emitEvent(TIMER_EVENTS.STARTED, {
        exercise: exercise,
        config: timerConfig,
      });

      // Start countdown
      startCountdown();

      console.log(`WorkoutTimer: Timer started for "${exercise.name}"`);
      return true;
    } catch (error) {
      console.error("WorkoutTimer: Failed to start timer:", error.message);
      return false;
    }
  };

  /**
   * Stop timer and reset to idle
   * @public
   * @returns {boolean} True if timer stopped successfully
   */
  const stopTimer = () => {
    try {
      // Clear interval
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      // Emit stopped event
      emitEvent(TIMER_EVENTS.STOPPED, {
        exercise: timerState.exercise,
        phase: timerState.phase,
      });

      // Reset state
      resetTimerState();

      console.log("WorkoutTimer: Timer stopped");
      return true;
    } catch (error) {
      console.error("WorkoutTimer: Failed to stop timer:", error.message);
      return false;
    }
  };

  /**
   * Pause the timer
   * @public
   * @returns {boolean} True if timer paused successfully
   */
  const pauseTimer = () => {
    try {
      if (!isRunning()) {
        console.warn("WorkoutTimer: Cannot pause - timer not running");
        return false;
      }

      if (timerState.isPaused) {
        console.warn("WorkoutTimer: Timer already paused");
        return false;
      }

      // Mark as paused and record pause start time
      updateTimerState({
        isPaused: true,
        pauseStartTime: Date.now(),
      });

      // Emit paused event
      emitEvent(TIMER_EVENTS.PAUSED, {
        exercise: timerState.exercise,
        phase: timerState.phase,
        remainingTime: timerState.remainingTime,
      });

      console.log("WorkoutTimer: Timer paused");
      return true;
    } catch (error) {
      console.error("WorkoutTimer: Failed to pause timer:", error.message);
      return false;
    }
  };

  /**
   * Resume the timer from paused state
   * @public
   * @returns {boolean} True if timer resumed successfully
   */
  const resumeTimer = () => {
    try {
      if (!timerState.isPaused) {
        console.warn("WorkoutTimer: Cannot resume - timer not paused");
        return false;
      }

      // Calculate total paused time
      const pauseDuration = Date.now() - timerState.pauseStartTime;
      const totalPausedTime = timerState.pausedTime + pauseDuration;

      // Update state
      updateTimerState({
        isPaused: false,
        pausedTime: totalPausedTime,
        pauseStartTime: null,
      });

      // Emit resumed event
      emitEvent(TIMER_EVENTS.RESUMED, {
        exercise: timerState.exercise,
        phase: timerState.phase,
        remainingTime: timerState.remainingTime,
        pauseDuration: Math.floor(pauseDuration / 1000),
      });

      console.log(
        `WorkoutTimer: Timer resumed (paused for ${Math.floor(
          pauseDuration / 1000
        )}s)`
      );
      return true;
    } catch (error) {
      console.error("WorkoutTimer: Failed to resume timer:", error.message);
      return false;
    }
  };

  /**
   * Skip current phase and move to next
   * @public
   * @returns {boolean} True if phase skipped successfully
   */
  const skipPhase = () => {
    try {
      if (!isRunning() && !timerState.isPaused) {
        console.warn("WorkoutTimer: Cannot skip - timer not running");
        return false;
      }

      const currentPhase = timerState.phase;
      console.log(`WorkoutTimer: Skipping phase "${currentPhase}"`);

      // Force phase completion
      handlePhaseComplete();

      console.log("WorkoutTimer: Phase skipped successfully");
      return true;
    } catch (error) {
      console.error("WorkoutTimer: Failed to skip phase:", error.message);
      return false;
    }
  };

  /**
   * Reset current exercise timer to beginning
   * @public
   * @returns {boolean} True if timer reset successfully
   */
  const resetExercise = () => {
    try {
      if (!timerState.exercise) {
        console.warn("WorkoutTimer: No exercise to reset");
        return false;
      }

      const exercise = timerState.exercise;
      const index = timerState.exerciseIndex;

      console.log(`WorkoutTimer: Resetting exercise "${exercise.name}"`);

      // Stop current timer
      if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
      }

      // Restart timer with same exercise
      startTimer(exercise, index);

      console.log("WorkoutTimer: Exercise reset successfully");
      return true;
    } catch (error) {
      console.error("WorkoutTimer: Failed to reset exercise:", error.message);
      return false;
    }
  };

  /**
   * Emit custom event
   * @private
   * @param {string} eventName - Name of the event
   * @param {Object} detail - Event detail data
   */
  const emitEvent = (eventName, detail = {}) => {
    const event = new CustomEvent(eventName, {
      detail: {
        ...detail,
        timestamp: Date.now(),
      },
    });
    document.dispatchEvent(event);
    console.log(`WorkoutTimer: Event emitted - ${eventName}`, detail);
  };

  // Public API
  return {
    init,
    isReady,
    getTimerConfig,
    getDefaultConfig,
    setTimerConfig,
    getCurrentPhase,
    getRemainingTime,
    getCurrentCycle,
    getCurrentSet,
    getProgress,
    isRunning,
    isPaused,
    getTimerState,
    startTimer,
    stopTimer,
    pauseTimer,
    resumeTimer,
    skipPhase,
    resetExercise,
    TIMER_EVENTS,
  };
})();
