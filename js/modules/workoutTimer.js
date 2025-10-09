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
    prepare: 10,              // Prepare time in seconds
    work: 45,                 // Work time in seconds
    rest: 15,                 // Rest time in seconds
    cyclesPerSet: 3,          // Number of cycles per set
    sets: 3,                  // Number of sets per exercise
    restBetweenSets: 60,      // Rest between sets in seconds
    autoAdvance: true,        // Auto-advance to next exercise
    soundEnabled: true,       // Enable sound notifications
    voiceEnabled: false       // Enable voice announcements
  };

  // Current timer configuration (can be modified)
  let timerConfig = { ...defaultConfig };

  // Timer state object
  let timerState = {
    phase: 'idle',            // Current phase: idle, preparing, working, resting, paused, completed
    exercise: null,           // Current exercise object
    exerciseIndex: 0,         // Index in workout array
    currentSet: 1,            // Current set number
    currentCycle: 1,          // Current cycle number
    remainingTime: 0,         // Remaining time in seconds
    totalTime: 0,             // Total time for current phase
    isPaused: false,          // Pause state
    startTime: null,          // Timestamp when started
    pausedTime: 0,            // Total paused time in milliseconds
    pauseStartTime: null      // Timestamp when paused
  };

  // Timer events constants
  const TIMER_EVENTS = {
    STARTED: 'timer:started',
    PAUSED: 'timer:paused',
    RESUMED: 'timer:resumed',
    STOPPED: 'timer:stopped',
    TICK: 'timer:tick',
    PHASE_CHANGED: 'timer:phaseChanged',
    CYCLE_COMPLETED: 'timer:cycleCompleted',
    SET_COMPLETED: 'timer:setCompleted',
    EXERCISE_COMPLETED: 'timer:exerciseCompleted',
    WORKOUT_COMPLETED: 'timer:workoutCompleted'
  };

  /**
   * Initialize the WorkoutTimer module
   * @public
   */
  const init = () => {
    try {
      console.log('WorkoutTimer: Initializing module...');

      // Reset state
      isInitialized = true;
      
      console.log('WorkoutTimer: Module initialized successfully');
      console.log('WorkoutTimer: Default config:', timerConfig);
      
      return true;
    } catch (error) {
      console.error('WorkoutTimer: Initialization failed:', error.message);
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
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid configuration object');
      }

      // Merge with existing config
      timerConfig = { ...timerConfig, ...config };
      
      console.log('WorkoutTimer: Configuration updated:', timerConfig);
      return true;
    } catch (error) {
      console.error('WorkoutTimer: Failed to set configuration:', error.message);
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
    const completedCycles = (timerState.currentSet - 1) * timerConfig.cyclesPerSet + (timerState.currentCycle - 1);
    
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
   * Emit custom event
   * @private
   * @param {string} eventName - Name of the event
   * @param {Object} detail - Event detail data
   */
  const emitEvent = (eventName, detail = {}) => {
    const event = new CustomEvent(eventName, { 
      detail: {
        ...detail,
        timestamp: Date.now()
      }
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
    TIMER_EVENTS
  };
})();

