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
    WORKOUT_ADDED: "workout-added",
    WORKOUT_REMOVED: "workout-removed",
    HISTORY_CLEARED: "history-cleared",
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
   * Helper function to get relative time display
   * @param {Date} date - Date to compare
   * @returns {string} Relative time string
   * @private
   */
  const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${
        Math.floor(diffDays / 7) !== 1 ? "s" : ""
      } ago`;
    return date.toLocaleDateString();
  };

  /**
   * Calculate workout balance score
   * @param {Array} exercises - Exercise array
   * @returns {Object} Balance analysis
   * @private
   */
  const calculateWorkoutBalance = (exercises) => {
    const muscleGroupCounts = {};
    exercises.forEach((exercise) => {
      muscleGroupCounts[exercise.muscleGroup] =
        (muscleGroupCounts[exercise.muscleGroup] || 0) + 1;
    });

    const counts = Object.values(muscleGroupCounts);
    const maxCount = Math.max(...counts);
    const minCount = Math.min(...counts);
    const balanceScore = minCount / maxCount; // 1.0 = perfectly balanced

    return {
      score: Math.round(balanceScore * 100) / 100,
      isBalanced: balanceScore >= 0.7,
      muscleGroupDistribution: muscleGroupCounts,
      recommendation:
        balanceScore < 0.5 ? "Consider adding more variety" : "Well balanced",
    };
  };

  /**
   * Get difficulty distribution
   * @param {Array} exercises - Exercise array
   * @returns {Object} Difficulty analysis
   * @private
   */
  const getDifficultyDistribution = (exercises) => {
    const difficulties = { beginner: 0, intermediate: 0, advanced: 0 };
    exercises.forEach((exercise) => {
      difficulties[exercise.difficulty] =
        (difficulties[exercise.difficulty] || 0) + 1;
    });

    const total = exercises.length;
    return {
      counts: difficulties,
      percentages: {
        beginner: Math.round((difficulties.beginner / total) * 100),
        intermediate: Math.round((difficulties.intermediate / total) * 100),
        advanced: Math.round((difficulties.advanced / total) * 100),
      },
      primaryLevel: Object.entries(difficulties).reduce((a, b) =>
        difficulties[a[0]] > difficulties[b[0]] ? a : b
      )[0],
    };
  };

  /**
   * Generate workout title
   * @param {Object} settings - Workout settings
   * @param {Array} exercises - Exercise array
   * @returns {string} Generated title
   * @private
   */
  const generateWorkoutTitle = (settings) => {
    const { focus, difficulty, exerciseCount } = settings;

    if (focus && focus !== "full-body") {
      return `${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)} ${
        focus.charAt(0).toUpperCase() + focus.slice(1)
      } Workout`;
    }

    if (exerciseCount <= 5)
      return `Quick ${
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
      } Workout`;
    if (exerciseCount >= 10)
      return `Comprehensive ${
        difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
      } Workout`;

    return `${
      difficulty.charAt(0).toUpperCase() + difficulty.slice(1)
    } Full-Body Workout`;
  };

  /**
   * Generate workout description
   * @param {Object} settings - Workout settings
   * @param {Object} stats - Workout statistics
   * @returns {string} Generated description
   * @private
   */
  const generateWorkoutDescription = (settings, stats) => {
    const { muscleGroups, difficulty, timeLimit } = settings;
    const { totalVolume, uniqueMuscleGroups } = stats;

    let description = `A ${difficulty} workout targeting ${uniqueMuscleGroups} muscle group${
      uniqueMuscleGroups !== 1 ? "s" : ""
    }`;

    if (muscleGroups.length > 0) {
      description += ` (${muscleGroups.join(", ")})`;
    }

    description += `. Total volume: ${totalVolume} reps in approximately ${timeLimit} minutes.`;

    return description;
  };

  /**
   * Enhanced workout session data structure
   * @param {Object} workoutData - Raw workout data
   * @param {Object} settings - Workout generation settings
   * @returns {Object} Formatted workout session
   * @private
   */
  const createWorkoutSession = (workoutData, settings = {}) => {
    const timestamp = new Date().toISOString();
    const workoutId = `workout_${Date.now()}_${Math.random()
      .toString(36)
      .substring(2, 11)}`;
    const dateObj = new Date(timestamp);

    // Extract and validate muscle groups from exercises
    const muscleGroups = [
      ...new Set(
        workoutData.exercises
          .map((exercise) => exercise.muscleGroup)
          .filter((group) => group && group !== "unknown")
      ),
    ];

    // Calculate enhanced duration estimates
    const baseTimePerExercise = 2.5; // minutes
    const restTimeBetweenExercises = 0.5; // minutes
    const estimatedDuration =
      workoutData.exercises.length * baseTimePerExercise +
      (workoutData.exercises.length - 1) * restTimeBetweenExercises;

    // Enhanced exercise data with additional fields
    const enhancedExercises = workoutData.exercises.map((exercise, index) => {
      const muscleGroup = exercise.muscleGroup || "unknown";
      const sets = exercise.sets || 3;
      const reps = exercise.reps || 12;

      return {
        position: index + 1,
        name: exercise.name || exercise.exercise || "Unknown Exercise",
        muscleGroup: muscleGroup,
        sets: sets,
        reps: reps,
        equipment: exercise.equipment || "bodyweight",
        // Enhanced fields
        estimatedTime: Math.round(baseTimePerExercise), // minutes per exercise
        totalVolume: sets * reps, // total repetitions
        difficulty:
          exercise.difficulty || settings.difficulty || "intermediate",
        instructions: exercise.instructions || "",
        targetMuscles: exercise.targetMuscles || [muscleGroup],
        isCompound: exercise.isCompound || false,
      };
    });

    // Enhanced settings with validation
    const enhancedSettings = {
      exerciseCount: workoutData.exercises.length,
      muscleGroups: muscleGroups,
      equipment: Array.isArray(settings.equipment)
        ? settings.equipment
        : ["bodyweight"],
      timeLimit: settings.timeLimit || Math.round(estimatedDuration),
      difficulty: settings.difficulty || "intermediate",
      workoutType: settings.workoutType || "general",
      restTime: settings.restTime || 60, // seconds between sets
      intensity: settings.intensity || "moderate",
      focus: muscleGroups.length === 1 ? muscleGroups[0] : "full-body",
    };

    // Enhanced metadata with user-friendly formatting
    const enhancedMetadata = {
      completed: false,
      rating: null,
      notes: "",
      tags: settings.tags || [],
      estimatedDuration: Math.round(estimatedDuration),
      actualDuration: null,
      createdAt: timestamp,
      lastModified: timestamp,
      // User-friendly display fields
      displayDate: dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
      displayTime: dateObj.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      relativeTime: getRelativeTime(dateObj),
      sessionNumber: null, // Will be set when saving
      isRecent: Date.now() - dateObj.getTime() < 24 * 60 * 60 * 1000, // within 24 hours
    };

    // Enhanced statistics with detailed analysis
    const enhancedStats = {
      totalExercises: workoutData.exercises.length,
      uniqueMuscleGroups: muscleGroups.length,
      totalVolume: enhancedExercises.reduce(
        (sum, ex) => sum + ex.totalVolume,
        0
      ),
      averageVolume: Math.round(
        enhancedExercises.reduce((sum, ex) => sum + ex.totalVolume, 0) /
          enhancedExercises.length
      ),
      exercisesByMuscleGroup: muscleGroups.reduce((acc, group) => {
        const exercises = enhancedExercises.filter(
          (ex) => ex.muscleGroup === group
        );
        acc[group] = {
          count: exercises.length,
          totalVolume: exercises.reduce((sum, ex) => sum + ex.totalVolume, 0),
          exercises: exercises.map((ex) => ex.name),
        };
        return acc;
      }, {}),
      equipmentUsed: [...new Set(enhancedExercises.map((ex) => ex.equipment))],
      compoundExercises: enhancedExercises.filter((ex) => ex.isCompound).length,
      isolationExercises: enhancedExercises.filter((ex) => !ex.isCompound)
        .length,
      workoutBalance: calculateWorkoutBalance(enhancedExercises),
      difficultyDistribution: getDifficultyDistribution(enhancedExercises),
    };

    return {
      id: workoutId,
      timestamp: timestamp,
      date: dateObj.toLocaleDateString(),
      time: dateObj.toLocaleTimeString(),
      exercises: enhancedExercises,
      settings: enhancedSettings,
      metadata: enhancedMetadata,
      stats: enhancedStats,
      // Additional top-level fields for easy access
      version: "2.0", // Data structure version
      type: "workout-session",
      summary: {
        title: generateWorkoutTitle(enhancedSettings),
        description: generateWorkoutDescription(
          enhancedSettings,
          enhancedStats
        ),
        quickStats: `${
          enhancedExercises.length
        } exercises • ${muscleGroups.join(", ")} • ${Math.round(
          estimatedDuration
        )}min`,
      },
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

    if (
      !workoutData ||
      !workoutData.exercises ||
      !Array.isArray(workoutData.exercises)
    ) {
      throw new Error(
        "WorkoutHistory: Invalid workout data - exercises array required"
      );
    }

    if (workoutData.exercises.length === 0) {
      throw new Error("WorkoutHistory: Cannot save empty workout");
    }

    try {
      // Create formatted workout session
      const workoutSession = createWorkoutSession(workoutData, settings);

      // Save to storage using StorageManager
      storageManager.saveWorkout(workoutSession);

      console.log(
        `WorkoutHistory: Workout added to history - ${workoutSession.id}`
      );

      // Dispatch event for UI updates (if needed)
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent(HISTORY_EVENTS.WORKOUT_ADDED, {
            detail: { workout: workoutSession },
          })
        );
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
      return workouts.sort(
        (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
      );
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
      return workouts.find((workout) => workout.id === workoutId) || null;
    } catch (error) {
      console.error(
        "WorkoutHistory: Failed to get workout by ID:",
        error.message
      );
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
      const workoutIndex = workouts.findIndex(
        (workout) => workout.id === workoutId
      );

      if (workoutIndex === -1) {
        console.warn(`WorkoutHistory: Workout ${workoutId} not found`);
        return false;
      }

      // Remove workout from array
      workouts.splice(workoutIndex, 1);

      // Clear storage and re-save remaining workouts
      storageManager.clearHistory();
      workouts.forEach((workout) => storageManager.saveWorkout(workout));

      console.log(
        `WorkoutHistory: Workout removed from history - ${workoutId}`
      );

      // Dispatch event for UI updates
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(
          new CustomEvent(HISTORY_EVENTS.WORKOUT_REMOVED, {
            detail: { workoutId: workoutId },
          })
        );
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
      if (typeof window !== "undefined" && window.dispatchEvent) {
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
          completionRate: 0,
        };
      }

      // Calculate statistics
      const totalExercises = workouts.reduce(
        (sum, workout) => sum + workout.exercises.length,
        0
      );
      const muscleGroupCounts = {};
      let completedCount = 0;

      workouts.forEach((workout) => {
        if (workout.metadata.completed) {
          completedCount++;
        }

        workout.exercises.forEach((exercise) => {
          muscleGroupCounts[exercise.muscleGroup] =
            (muscleGroupCounts[exercise.muscleGroup] || 0) + 1;
        });
      });

      // Sort muscle groups by usage
      const mostUsedMuscleGroups = Object.entries(muscleGroupCounts)
        .sort(([, a], [, b]) => b - a)
        .map(([group, count]) => ({ group, count }));

      return {
        totalWorkouts: workouts.length,
        totalExercises: totalExercises,
        averageExercisesPerWorkout:
          Math.round((totalExercises / workouts.length) * 10) / 10,
        mostUsedMuscleGroups: mostUsedMuscleGroups,
        oldestWorkout: workouts[workouts.length - 1],
        newestWorkout: workouts[0],
        completedWorkouts: completedCount,
        completionRate: Math.round((completedCount / workouts.length) * 100),
      };
    } catch (error) {
      console.error(
        "WorkoutHistory: Failed to get history stats:",
        error.message
      );
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
    EVENTS: HISTORY_EVENTS,
  };
})();

// Make available globally
window.WorkoutHistory = WorkoutHistory;
