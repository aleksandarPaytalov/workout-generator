/**
 * Storage Manager Module
 *
 * Simple localStorage wrapper for workout history management.
 * All operations are user-initiated (manual type) - no automatic saving.
 *
 * @namespace StorageManager
 */

const StorageManager = (() => {
  "use strict";

  // Module state
  let isInitialized = false;

  // Constants
  const STORAGE_KEY = "workout-generator-history";
  const MAX_WORKOUTS = 5; // Keep only last 5 workouts

  /**
   * Check if localStorage is available
   * @private
   */
  const isStorageAvailable = () => {
    try {
      const test = "__storage_test__";
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch (e) {
      return false;
    }
  };

  /**
   * Validate workout data structure with comprehensive checks
   * @private
   */
  const validateWorkout = (workout) => {
    // Basic structure validation
    if (!workout || typeof workout !== "object") {
      throw new Error(
        "StorageManager: Invalid workout data - must be an object"
      );
    }

    // ID validation
    if (
      !workout.id ||
      typeof workout.id !== "string" ||
      workout.id.trim().length === 0
    ) {
      throw new Error("StorageManager: Workout must have a valid non-empty id");
    }

    // Timestamp validation
    if (!workout.timestamp || typeof workout.timestamp !== "string") {
      throw new Error("StorageManager: Workout must have a valid timestamp");
    }

    // Validate timestamp format (ISO string)
    try {
      const date = new Date(workout.timestamp);
      if (isNaN(date.getTime())) {
        throw new Error(
          "StorageManager: Workout timestamp must be a valid date"
        );
      }
    } catch (e) {
      throw new Error(
        "StorageManager: Workout timestamp must be a valid ISO date string"
      );
    }

    // Exercises validation
    if (!Array.isArray(workout.exercises)) {
      throw new Error("StorageManager: Workout must have an exercises array");
    }

    if (workout.exercises.length === 0) {
      throw new Error(
        "StorageManager: Workout must contain at least one exercise"
      );
    }

    if (workout.exercises.length > 50) {
      throw new Error(
        "StorageManager: Workout cannot contain more than 50 exercises"
      );
    }

    // Validate each exercise
    workout.exercises.forEach((exercise, index) => {
      validateExercise(exercise, index);
    });

    return true;
  };

  /**
   * Validate individual exercise data
   * @private
   */
  const validateExercise = (exercise, index) => {
    if (!exercise || typeof exercise !== "object") {
      throw new Error(
        `StorageManager: Exercise ${index + 1} must be an object`
      );
    }

    if (
      !exercise.name ||
      typeof exercise.name !== "string" ||
      exercise.name.trim().length === 0
    ) {
      throw new Error(
        `StorageManager: Exercise ${index + 1} must have a valid name`
      );
    }

    if (exercise.name.length > 100) {
      throw new Error(
        `StorageManager: Exercise ${
          index + 1
        } name cannot exceed 100 characters`
      );
    }

    if (!exercise.muscleGroup || typeof exercise.muscleGroup !== "string") {
      throw new Error(
        `StorageManager: Exercise ${index + 1} must have a valid muscle group`
      );
    }

    // Validate muscle group is one of the expected values
    const validMuscleGroups = [
      "chest",
      "back",
      "legs",
      "shoulders",
      "arms",
      "core",
    ];
    if (!validMuscleGroups.includes(exercise.muscleGroup.toLowerCase())) {
      throw new Error(
        `StorageManager: Exercise ${
          index + 1
        } has invalid muscle group. Must be one of: ${validMuscleGroups.join(
          ", "
        )}`
      );
    }
  };

  /**
   * Check storage size limits
   * @private
   */
  const checkStorageSize = (data) => {
    const dataString = JSON.stringify(data);
    const sizeInBytes = new Blob([dataString]).size;
    const maxSize = 1024 * 1024; // 1MB limit for safety

    if (sizeInBytes > maxSize) {
      throw new Error(
        "StorageManager: Workout data exceeds storage size limit (1MB)"
      );
    }

    return sizeInBytes;
  };

  /**
   * Sanitize workout data for storage
   * @private
   */
  const sanitizeWorkout = (workout) => {
    return {
      id: String(workout.id).trim(),
      timestamp: String(workout.timestamp).trim(),
      exercises: Array.isArray(workout.exercises) ? workout.exercises : [],
      settings: workout.settings || {},
      metadata: workout.metadata || {},
    };
  };

  /**
   * Initialize the storage manager
   * @public
   */
  const init = () => {
    if (isInitialized) {
      console.warn("StorageManager: Already initialized");
      return;
    }

    if (!isStorageAvailable()) {
      console.warn("StorageManager: localStorage not available");
      return;
    }

    isInitialized = true;
    console.log("StorageManager: Initialized successfully");
  };

  /**
   * Save a workout to localStorage (user-initiated only)
   * @param {Object} workout - Workout object to save
   * @public
   */
  const saveWorkout = (workout) => {
    if (!isInitialized) {
      throw new Error("StorageManager: Module not initialized");
    }

    if (!isStorageAvailable()) {
      throw new Error("StorageManager: localStorage not available");
    }

    try {
      // Validate and sanitize workout data
      validateWorkout(workout);
      const sanitizedWorkout = sanitizeWorkout(workout);

      // Get existing workouts
      const existingWorkouts = getWorkouts();

      // Add new workout to the beginning
      existingWorkouts.unshift(sanitizedWorkout);

      // Keep only the last MAX_WORKOUTS
      const limitedWorkouts = existingWorkouts.slice(0, MAX_WORKOUTS);

      // Check storage size before saving
      const dataSize = checkStorageSize(limitedWorkouts);

      // Save to localStorage with enhanced error handling
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedWorkouts));
      } catch (storageError) {
        if (storageError.name === "QuotaExceededError") {
          throw new Error(
            "StorageManager: Storage quota exceeded. Please clear some workout history."
          );
        }
        throw new Error(
          `StorageManager: Failed to save to localStorage: ${storageError.message}`
        );
      }

      console.log(
        "StorageManager: Workout saved successfully",
        sanitizedWorkout.id,
        `(${dataSize} bytes)`
      );
      return true;
    } catch (error) {
      console.error("StorageManager: Failed to save workout:", error.message);
      throw error;
    }
  };

  /**
   * Get all saved workouts from localStorage
   * @returns {Array} Array of workout objects
   * @public
   */
  const getWorkouts = () => {
    if (!isInitialized) {
      throw new Error("StorageManager: Module not initialized");
    }

    if (!isStorageAvailable()) {
      console.warn(
        "StorageManager: localStorage not available, returning empty array"
      );
      return [];
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        return [];
      }

      const workouts = JSON.parse(stored);
      return Array.isArray(workouts) ? workouts : [];
    } catch (error) {
      console.error(
        "StorageManager: Failed to retrieve workouts:",
        error.message
      );
      return [];
    }
  };

  /**
   * Clear all workout history (user-initiated only)
   * @public
   */
  const clearHistory = () => {
    if (!isInitialized) {
      throw new Error("StorageManager: Module not initialized");
    }

    if (!isStorageAvailable()) {
      throw new Error("StorageManager: localStorage not available");
    }

    try {
      localStorage.removeItem(STORAGE_KEY);
      console.log("StorageManager: History cleared successfully");
      return true;
    } catch (error) {
      console.error("StorageManager: Failed to clear history:", error.message);
      throw error;
    }
  };

  /**
   * Get storage usage information
   * @returns {Object} Storage info
   * @public
   */
  const getStorageInfo = () => {
    if (!isInitialized) {
      throw new Error("StorageManager: Module not initialized");
    }

    const workouts = getWorkouts();
    const storageData = localStorage.getItem(STORAGE_KEY) || "";

    return {
      workoutCount: workouts.length,
      maxWorkouts: MAX_WORKOUTS,
      storageSize: storageData.length,
      isAvailable: isStorageAvailable(),
    };
  };

  /**
   * Check if module is ready
   * @public
   */
  const isReady = () => isInitialized;

  // Public API
  return {
    init,
    saveWorkout,
    getWorkouts,
    clearHistory,
    getStorageInfo,
    isReady,
  };
})();

// Make available globally
window.StorageManager = StorageManager;
