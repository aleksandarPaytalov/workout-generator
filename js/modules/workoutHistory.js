/**
 * Workout History Manager
 * Manages workout history with manual user operations only
 * Provides simple history management with essential features
 */

const WorkoutHistory = (() => {
  "use strict";

  // Module state
  let isInitialized = false;
  let storageManager = null;

  // Constants
  const HISTORY_EVENTS = {
    WORKOUT_ADDED: 'workout-added',
    WORKOUT_REMOVED: 'workout-removed',
    HISTORY_CLEARED: 'history-cleared'
  };

  /**
   * Initialize the WorkoutHistory module
   * @public
   */
  const init = () => {
    try {
      console.log("WorkoutHistory: Initialization attempt 1");

      // Check if StorageManager is available
      if (typeof StorageManager === "undefined") {
        throw new Error("WorkoutHistory: StorageManager dependency not found");
      }

      if (!StorageManager.isReady()) {
        throw new Error("WorkoutHistory: StorageManager not ready");
      }

      // Store reference to StorageManager
      storageManager = StorageManager;
      isInitialized = true;

      console.log("WorkoutHistory: Module initialized successfully");
    } catch (error) {
      console.error("WorkoutHistory: Initialization failed:", error.message);
      throw error;
    }
  };

  /**
   * Check if module is ready
   * @returns {boolean}
   * @public
   */
  const isReady = () => {
    return isInitialized && storageManager && storageManager.isReady();
  };

  /**
   * Create workout session data structure
   * @param {Object} workoutData - Raw workout data
   * @param {Object} settings - Workout generation settings
   * @returns {Object} Formatted workout session
   * @private
   */
  const createWorkoutSession = (workoutData, settings = {}) => {
    const timestamp = new Date().toISOString();
    const workoutId = `workout_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Extract muscle groups from exercises
    const muscleGroups = [...new Set(
      workoutData.exercises.map(exercise => exercise.muscleGroup)
    )];

    // Calculate estimated duration (2-3 minutes per exercise)
    const estimatedDuration = workoutData.exercises.length * 2.5;

    return {
      id: workoutId,
      timestamp: timestamp,
      date: new Date(timestamp).toLocaleDateString(),
      time: new Date(timestamp).toLocaleTimeString(),
      exercises: workoutData.exercises.map((exercise, index) => ({
        position: index + 1,
        name: exercise.name || exercise.exercise || 'Unknown Exercise',
        muscleGroup: exercise.muscleGroup || 'unknown',
        sets: exercise.sets || 3,
        reps: exercise.reps || 12,
        equipment: exercise.equipment || 'bodyweight'
      })),
      settings: {
        exerciseCount: workoutData.exercises.length,
        muscleGroups: muscleGroups,
        equipment: settings.equipment || ['bodyweight'],
        timeLimit: settings.timeLimit || estimatedDuration,
        difficulty: settings.difficulty || 'intermediate'
      },
      metadata: {
        completed: false,
        rating: null,
        notes: '',
        estimatedDuration: Math.round(estimatedDuration),
        actualDuration: null,
        createdAt: timestamp,
        lastModified: timestamp
      },
      stats: {
        totalExercises: workoutData.exercises.length,
        uniqueMuscleGroups: muscleGroups.length,
        exercisesByMuscleGroup: muscleGroups.reduce((acc, group) => {
          acc[group] = workoutData.exercises.filter(ex => ex.muscleGroup === group).length;
          return acc;
        }, {})
      }
    };
  };

  /**
   * Add workout to history (manual user action only)
   * @param {Object} workoutData - Workout data to save
   * @param {Object} settings - Optional workout settings
   * @returns {Object} Created workout session
   * @public
   */
  const addWorkout = (workoutData, settings = {}) => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    if (!workoutData || !workoutData.exercises || !Array.isArray(workoutData.exercises)) {
      throw new Error("WorkoutHistory: Invalid workout data - exercises array required");
    }

    if (workoutData.exercises.length === 0) {
      throw new Error("WorkoutHistory: Cannot save empty workout");
    }

    try {
      // Create formatted workout session
      const workoutSession = createWorkoutSession(workoutData, settings);

      // Save to storage using StorageManager
      storageManager.saveWorkout(workoutSession);

      console.log(`WorkoutHistory: Workout added to history - ${workoutSession.id}`);
      
      // Dispatch event for UI updates (if needed)
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(HISTORY_EVENTS.WORKOUT_ADDED, {
          detail: { workout: workoutSession }
        }));
      }

      return workoutSession;
    } catch (error) {
      console.error("WorkoutHistory: Failed to add workout:", error.message);
      throw error;
    }
  };

  /**
   * Get all workout history (manual user request only)
   * @returns {Array} Array of workout sessions
   * @public
   */
  const getHistory = () => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    try {
      const workouts = storageManager.getWorkouts();
      
      // Sort by timestamp (newest first)
      return workouts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } catch (error) {
      console.error("WorkoutHistory: Failed to get history:", error.message);
      throw error;
    }
  };

  /**
   * Get workout by ID (manual user request only)
   * @param {string} workoutId - Workout ID to find
   * @returns {Object|null} Workout session or null if not found
   * @public
   */
  const getWorkoutById = (workoutId) => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    if (!workoutId) {
      throw new Error("WorkoutHistory: Workout ID required");
    }

    try {
      const workouts = getHistory();
      return workouts.find(workout => workout.id === workoutId) || null;
    } catch (error) {
      console.error("WorkoutHistory: Failed to get workout by ID:", error.message);
      throw error;
    }
  };

  /**
   * Remove workout from history (manual user action only)
   * @param {string} workoutId - Workout ID to remove
   * @returns {boolean} True if removed, false if not found
   * @public
   */
  const removeWorkout = (workoutId) => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    if (!workoutId) {
      throw new Error("WorkoutHistory: Workout ID required");
    }

    try {
      const workouts = getHistory();
      const workoutIndex = workouts.findIndex(workout => workout.id === workoutId);
      
      if (workoutIndex === -1) {
        console.warn(`WorkoutHistory: Workout ${workoutId} not found`);
        return false;
      }

      // Remove workout from array
      workouts.splice(workoutIndex, 1);
      
      // Clear storage and re-save remaining workouts
      storageManager.clearHistory();
      workouts.forEach(workout => storageManager.saveWorkout(workout));

      console.log(`WorkoutHistory: Workout removed from history - ${workoutId}`);
      
      // Dispatch event for UI updates
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(HISTORY_EVENTS.WORKOUT_REMOVED, {
          detail: { workoutId: workoutId }
        }));
      }

      return true;
    } catch (error) {
      console.error("WorkoutHistory: Failed to remove workout:", error.message);
      throw error;
    }
  };

  /**
   * Clear all workout history (manual user action only)
   * @returns {boolean} True if cleared successfully
   * @public
   */
  const clearHistory = () => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    try {
      storageManager.clearHistory();
      
      console.log("WorkoutHistory: All history cleared");
      
      // Dispatch event for UI updates
      if (typeof window !== 'undefined' && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(HISTORY_EVENTS.HISTORY_CLEARED));
      }

      return true;
    } catch (error) {
      console.error("WorkoutHistory: Failed to clear history:", error.message);
      throw error;
    }
  };

  /**
   * Get history statistics (manual user request only)
   * @returns {Object} History statistics
   * @public
   */
  const getHistoryStats = () => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    try {
      const workouts = getHistory();
      
      if (workouts.length === 0) {
        return {
          totalWorkouts: 0,
          totalExercises: 0,
          averageExercisesPerWorkout: 0,
          mostUsedMuscleGroups: [],
          oldestWorkout: null,
          newestWorkout: null,
          completedWorkouts: 0,
          completionRate: 0
        };
      }

      // Calculate statistics
      const totalExercises = workouts.reduce((sum, workout) => sum + workout.exercises.length, 0);
      const muscleGroupCounts = {};
      let completedCount = 0;

      workouts.forEach(workout => {
        if (workout.metadata.completed) {
          completedCount++;
        }
        
        workout.exercises.forEach(exercise => {
          muscleGroupCounts[exercise.muscleGroup] = (muscleGroupCounts[exercise.muscleGroup] || 0) + 1;
        });
      });

      // Sort muscle groups by usage
      const mostUsedMuscleGroups = Object.entries(muscleGroupCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([group, count]) => ({ group, count }));

      return {
        totalWorkouts: workouts.length,
        totalExercises: totalExercises,
        averageExercisesPerWorkout: Math.round(totalExercises / workouts.length * 10) / 10,
        mostUsedMuscleGroups: mostUsedMuscleGroups,
        oldestWorkout: workouts[workouts.length - 1],
        newestWorkout: workouts[0],
        completedWorkouts: completedCount,
        completionRate: Math.round((completedCount / workouts.length) * 100)
      };
    } catch (error) {
      console.error("WorkoutHistory: Failed to get history stats:", error.message);
      throw error;
    }
  };

  // Public API
  return {
    init,
    isReady,
    addWorkout,
    getHistory,
    getWorkoutById,
    removeWorkout,
    clearHistory,
    getHistoryStats,
    EVENTS: HISTORY_EVENTS
  };
})();

// Make available globally
window.WorkoutHistory = WorkoutHistory;
