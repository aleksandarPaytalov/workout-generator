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
      Logger.debug("WorkoutHistory", "Initialization attempt 1");

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

      Logger.info("WorkoutHistory", "Module initialized successfully");
    } catch (error) {
      Logger.error("WorkoutHistory", "Initialization failed:", error.message);
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

      Logger.debug(
        "WorkoutHistory",
        `Workout added to history - ${workoutSession.id}`
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
      Logger.error("WorkoutHistory", "Failed to add workout:", error.message);
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
      Logger.error("WorkoutHistory", "Failed to get history:", error.message);
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
      Logger.error(
        "WorkoutHistory",
        "Failed to get workout by ID:",
        error.message
      );
      throw error;
    }
  };

  /**
   * Update workout in history (manual user action only)
   * @param {string} workoutId - Workout ID to update
   * @param {Object} updatedWorkout - Updated workout object
   * @returns {boolean} True if updated successfully
   * @public
   */
  const updateWorkout = (workoutId, updatedWorkout) => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    if (!workoutId) {
      throw new Error("WorkoutHistory: Workout ID required");
    }

    if (!updatedWorkout) {
      throw new Error("WorkoutHistory: Updated workout object required");
    }

    try {
      const workouts = storageManager.getWorkouts();
      const index = workouts.findIndex((workout) => workout.id === workoutId);

      if (index === -1) {
        Logger.error("WorkoutHistory", "Workout not found:", workoutId);
        return false;
      }

      // Update the workout in the array
      workouts[index] = updatedWorkout;

      // Save the entire updated array back to localStorage
      // We need to clear and re-save all workouts to avoid duplicates
      storageManager.clearHistory();
      workouts.forEach((workout) => storageManager.saveWorkout(workout));

      Logger.debug(
        "WorkoutHistory",
        "Workout updated successfully:",
        workoutId
      );
      return true;
    } catch (error) {
      Logger.error(
        "WorkoutHistory",
        "Failed to update workout:",
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
        Logger.warn("WorkoutHistory", `Workout ${workoutId} not found`);
        return false;
      }

      // Remove workout from array
      workouts.splice(workoutIndex, 1);

      // Clear storage and re-save remaining workouts
      storageManager.clearHistory();
      workouts.forEach((workout) => storageManager.saveWorkout(workout));

      Logger.debug(
        "WorkoutHistory",
        `Workout removed from history - ${workoutId}`
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
      Logger.error(
        "WorkoutHistory",
        "Failed to remove workout:",
        error.message
      );
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

      Logger.info("WorkoutHistory", "All history cleared");

      // Dispatch event for UI updates
      if (typeof window !== "undefined" && window.dispatchEvent) {
        window.dispatchEvent(new CustomEvent(HISTORY_EVENTS.HISTORY_CLEARED));
      }

      return true;
    } catch (error) {
      Logger.error("WorkoutHistory", "Failed to clear history:", error.message);
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
          uniqueExercises: 0,
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
      const uniqueExerciseNames = new Set();
      let completedCount = 0;

      workouts.forEach((workout) => {
        if (workout.metadata.completed) {
          completedCount++;
        }

        workout.exercises.forEach((exercise) => {
          muscleGroupCounts[exercise.muscleGroup] =
            (muscleGroupCounts[exercise.muscleGroup] || 0) + 1;

          // Track unique exercise names for variety score
          uniqueExerciseNames.add(exercise.name);
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
        uniqueExercises: uniqueExerciseNames.size,
        mostUsedMuscleGroups: mostUsedMuscleGroups,
        oldestWorkout: workouts[workouts.length - 1],
        newestWorkout: workouts[0],
        completedWorkouts: completedCount,
        completionRate: Math.round((completedCount / workouts.length) * 100),
      };
    } catch (error) {
      Logger.error(
        "WorkoutHistory",
        "Failed to get history stats:",
        error.message
      );
      throw error;
    }
  };

  /**
   * Check workout limit status (manual user request only)
   * @returns {Object} Limit status information
   * @public
   */
  const checkWorkoutLimit = () => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    try {
      const storageInfo = storageManager.getStorageInfo();
      const workouts = getHistory();
      const maxWorkouts = storageInfo.maxWorkouts;
      const currentCount = workouts.length;
      const slotsRemaining = Math.max(0, maxWorkouts - currentCount);

      const status = {
        currentCount: currentCount,
        maxWorkouts: maxWorkouts,
        slotsRemaining: slotsRemaining,
        isAtLimit: currentCount >= maxWorkouts,
        isNearLimit: currentCount >= maxWorkouts - 1,
        canAddMore: currentCount < maxWorkouts,
        percentageFull: Math.round((currentCount / maxWorkouts) * 100),
        oldestWorkout:
          workouts.length > 0 ? workouts[workouts.length - 1] : null,
        newestWorkout: workouts.length > 0 ? workouts[0] : null,
      };

      // Add recommendations based on status
      if (status.isAtLimit) {
        status.recommendation =
          "Storage limit reached. Remove old workouts to add new ones.";
        status.action = "cleanup-required";
      } else if (status.isNearLimit) {
        status.recommendation =
          "Approaching storage limit. Consider removing old workouts.";
        status.action = "cleanup-suggested";
      } else {
        status.recommendation = `You can add ${slotsRemaining} more workout${
          slotsRemaining !== 1 ? "s" : ""
        }.`;
        status.action = "none";
      }

      return status;
    } catch (error) {
      Logger.error(
        "WorkoutHistory",
        "Failed to check workout limit:",
        error.message
      );
      throw error;
    }
  };

  /**
   * Get workouts that can be removed (manual user request only)
   * @param {number} count - Number of workouts to suggest for removal
   * @returns {Array} Array of workouts suggested for removal
   * @public
   */
  const getSuggestedForRemoval = (count = 1) => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    if (count < 1) {
      throw new Error("WorkoutHistory: Count must be at least 1");
    }

    try {
      const workouts = getHistory();

      if (workouts.length === 0) {
        return [];
      }

      // Sort by timestamp (oldest first) and take the requested count
      const sortedByAge = [...workouts].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
      );
      const suggested = sortedByAge.slice(0, Math.min(count, workouts.length));

      return suggested.map((workout) => ({
        id: workout.id,
        date: workout.metadata.displayDate,
        relativeTime: workout.metadata.relativeTime,
        title: workout.summary.title,
        exerciseCount: workout.exercises.length,
        muscleGroups: workout.settings.muscleGroups,
        isCompleted: workout.metadata.completed,
        reason: "oldest",
      }));
    } catch (error) {
      Logger.error(
        "WorkoutHistory",
        "Failed to get suggested removals:",
        error.message
      );
      throw error;
    }
  };

  /**
   * Remove oldest workouts to make space (manual user action only)
   * @param {number} count - Number of oldest workouts to remove
   * @returns {Object} Removal result
   * @public
   */
  const removeOldestWorkouts = (count = 1) => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    if (count < 1) {
      throw new Error("WorkoutHistory: Count must be at least 1");
    }

    try {
      const workouts = getHistory();

      if (workouts.length === 0) {
        return {
          removed: [],
          count: 0,
          message: "No workouts to remove",
        };
      }

      // Get oldest workouts
      const toRemove = getSuggestedForRemoval(count);
      const removedIds = [];
      let successCount = 0;

      // Remove each workout
      toRemove.forEach((workout) => {
        try {
          if (removeWorkout(workout.id)) {
            removedIds.push(workout.id);
            successCount++;
          }
        } catch (error) {
          Logger.warn(
            "WorkoutHistory",
            `Failed to remove workout ${workout.id}:`,
            error.message
          );
        }
      });

      const result = {
        removed: removedIds,
        count: successCount,
        message: `Removed ${successCount} oldest workout${
          successCount !== 1 ? "s" : ""
        }`,
      };

      Logger.info("WorkoutHistory", result.message);
      return result;
    } catch (error) {
      Logger.error(
        "WorkoutHistory",
        "Failed to remove oldest workouts:",
        error.message
      );
      throw error;
    }
  };

  /**
   * Make space for new workout by removing oldest if needed (manual user action only)
   * @returns {Object} Space management result
   * @public
   */
  const makeSpaceForNewWorkout = () => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    try {
      const limitStatus = checkWorkoutLimit();

      if (!limitStatus.isAtLimit) {
        return {
          spaceAvailable: true,
          action: "none",
          message: `Space available: ${limitStatus.slotsRemaining} slot${
            limitStatus.slotsRemaining !== 1 ? "s" : ""
          } remaining`,
          removed: [],
        };
      }

      // At limit - need to remove oldest workout
      const removalResult = removeOldestWorkouts(1);

      return {
        spaceAvailable: true,
        action: "removed-oldest",
        message: `Made space by removing oldest workout`,
        removed: removalResult.removed,
      };
    } catch (error) {
      Logger.error(
        "WorkoutHistory",
        "Failed to make space for new workout:",
        error.message
      );
      throw error;
    }
  };

  /**
   * Get storage management recommendations (manual user request only)
   * @returns {Object} Storage management recommendations
   * @public
   */
  const getStorageRecommendations = () => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    try {
      const limitStatus = checkWorkoutLimit();
      const workouts = getHistory();
      const recommendations = [];

      // Check workout limit status
      if (limitStatus.isAtLimit) {
        recommendations.push({
          type: "warning",
          priority: "high",
          title: "Storage Limit Reached",
          message: "You have reached the maximum of 5 stored workouts.",
          action: "Remove old workouts to add new ones",
          actionType: "cleanup",
        });
      } else if (limitStatus.isNearLimit) {
        recommendations.push({
          type: "info",
          priority: "medium",
          title: "Approaching Storage Limit",
          message: `You have ${limitStatus.slotsRemaining} slot${
            limitStatus.slotsRemaining !== 1 ? "s" : ""
          } remaining.`,
          action: "Consider removing old workouts",
          actionType: "cleanup-optional",
        });
      }

      // Check for incomplete workouts
      const incompleteWorkouts = workouts.filter((w) => !w.metadata.completed);
      if (incompleteWorkouts.length > 0) {
        recommendations.push({
          type: "info",
          priority: "low",
          title: "Incomplete Workouts",
          message: `You have ${incompleteWorkouts.length} incomplete workout${
            incompleteWorkouts.length !== 1 ? "s" : ""
          }.`,
          action: "Mark workouts as completed when finished",
          actionType: "update",
        });
      }

      // Check for old workouts
      const oldWorkouts = workouts.filter((w) => !w.metadata.isRecent);
      if (oldWorkouts.length >= 3) {
        recommendations.push({
          type: "info",
          priority: "low",
          title: "Old Workouts",
          message: `You have ${oldWorkouts.length} workouts older than 24 hours.`,
          action: "Consider removing old workouts to keep history fresh",
          actionType: "cleanup-optional",
        });
      }

      return {
        limitStatus: limitStatus,
        recommendations: recommendations,
        hasHighPriority: recommendations.some((r) => r.priority === "high"),
        hasMediumPriority: recommendations.some((r) => r.priority === "medium"),
        suggestedActions: recommendations
          .map((r) => r.actionType)
          .filter((v, i, a) => a.indexOf(v) === i),
      };
    } catch (error) {
      Logger.error(
        "WorkoutHistory",
        "Failed to get storage recommendations:",
        error.message
      );
      throw error;
    }
  };

  /**
   * Compare two workouts and find similarities (manual user request only)
   * @param {string} workoutId1 - First workout ID
   * @param {string} workoutId2 - Second workout ID
   * @returns {Object} Comparison result
   * @public
   */
  const compareWorkouts = (workoutId1, workoutId2) => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    if (!workoutId1 || !workoutId2) {
      throw new Error("WorkoutHistory: Both workout IDs are required");
    }

    try {
      const workout1 = getWorkoutById(workoutId1);
      const workout2 = getWorkoutById(workoutId2);

      if (!workout1) {
        throw new Error(`WorkoutHistory: Workout ${workoutId1} not found`);
      }
      if (!workout2) {
        throw new Error(`WorkoutHistory: Workout ${workoutId2} not found`);
      }

      // Compare exercises
      const exercises1 = workout1.exercises.map((e) => e.name.toLowerCase());
      const exercises2 = workout2.exercises.map((e) => e.name.toLowerCase());
      const commonExercises = exercises1.filter((e) => exercises2.includes(e));
      const uniqueToFirst = exercises1.filter((e) => !exercises2.includes(e));
      const uniqueToSecond = exercises2.filter((e) => !exercises1.includes(e));

      // Compare muscle groups
      const muscles1 =
        (workout1.settings && workout1.settings.muscleGroups) || [];
      const muscles2 =
        (workout2.settings && workout2.settings.muscleGroups) || [];
      const commonMuscles = muscles1.filter((m) => muscles2.includes(m));
      const uniqueMuscles1 = muscles1.filter((m) => !muscles2.includes(m));
      const uniqueMuscles2 = muscles2.filter((m) => !muscles1.includes(m));

      // Calculate similarity scores
      const exerciseSimilarity =
        exercises1.length > 0 && exercises2.length > 0
          ? (commonExercises.length /
              Math.max(exercises1.length, exercises2.length)) *
            100
          : 0;

      const muscleSimilarity =
        muscles1.length > 0 && muscles2.length > 0
          ? (commonMuscles.length /
              Math.max(muscles1.length, muscles2.length)) *
            100
          : 0;

      // Compare volume
      const volume1 = (workout1.stats && workout1.stats.totalVolume) || 0;
      const volume2 = (workout2.stats && workout2.stats.totalVolume) || 0;
      const volumeDifference = Math.abs(volume1 - volume2);
      const volumePercentDiff =
        Math.max(volume1, volume2) > 0
          ? (volumeDifference / Math.max(volume1, volume2)) * 100
          : 0;

      // Compare difficulty
      const difficulty1 =
        (workout1.settings && workout1.settings.difficulty) || "unknown";
      const difficulty2 =
        (workout2.settings && workout2.settings.difficulty) || "unknown";
      const sameDifficulty = difficulty1 === difficulty2;

      // Overall similarity score
      const overallSimilarity = Math.round(
        (exerciseSimilarity + muscleSimilarity) / 2
      );

      return {
        workout1: {
          id: workout1.id,
          title:
            (workout1.summary && workout1.summary.title) || "Untitled Workout",
          date:
            (workout1.metadata && workout1.metadata.displayDate) ||
            "Unknown Date",
          exercises: exercises1.length,
          muscleGroups: muscles1,
          volume: volume1,
          difficulty: difficulty1,
        },
        workout2: {
          id: workout2.id,
          title:
            (workout2.summary && workout2.summary.title) || "Untitled Workout",
          date:
            (workout2.metadata && workout2.metadata.displayDate) ||
            "Unknown Date",
          exercises: exercises2.length,
          muscleGroups: muscles2,
          volume: volume2,
          difficulty: difficulty2,
        },
        similarities: {
          commonExercises: commonExercises,
          commonMuscleGroups: commonMuscles,
          exerciseSimilarity: Math.round(exerciseSimilarity),
          muscleSimilarity: Math.round(muscleSimilarity),
          overallSimilarity: overallSimilarity,
          sameDifficulty: sameDifficulty,
          volumeDifference: volumeDifference,
          volumePercentDiff: Math.round(volumePercentDiff),
        },
        differences: {
          uniqueToFirst: uniqueToFirst,
          uniqueToSecond: uniqueToSecond,
          uniqueMuscles1: uniqueMuscles1,
          uniqueMuscles2: uniqueMuscles2,
          volumeHigher:
            volume1 > volume2
              ? "first"
              : volume2 > volume1
              ? "second"
              : "equal",
        },
        recommendation:
          overallSimilarity >= 70
            ? "Very similar workouts"
            : overallSimilarity >= 50
            ? "Moderately similar workouts"
            : overallSimilarity >= 30
            ? "Somewhat similar workouts"
            : "Different workout styles",
      };
    } catch (error) {
      Logger.error(
        "WorkoutHistory",
        "Failed to compare workouts:",
        error.message
      );
      throw error;
    }
  };

  /**
   * Find similar workouts to a given workout (manual user request only)
   * @param {string} workoutId - Reference workout ID
   * @param {number} maxResults - Maximum number of similar workouts to return
   * @returns {Array} Array of similar workouts with similarity scores
   * @public
   */
  const findSimilarWorkouts = (workoutId, maxResults = 3) => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    if (!workoutId) {
      throw new Error("WorkoutHistory: Workout ID is required");
    }

    if (maxResults < 1) {
      throw new Error("WorkoutHistory: maxResults must be at least 1");
    }

    try {
      const referenceWorkout = getWorkoutById(workoutId);
      if (!referenceWorkout) {
        throw new Error(`WorkoutHistory: Workout ${workoutId} not found`);
      }

      const allWorkouts = getHistory();
      const otherWorkouts = allWorkouts.filter((w) => w.id !== workoutId);

      if (otherWorkouts.length === 0) {
        return [];
      }

      // Calculate similarity for each workout
      const similarities = otherWorkouts.map((workout) => {
        const comparison = compareWorkouts(workoutId, workout.id);
        return {
          workout: {
            id: workout.id,
            title:
              (workout.summary && workout.summary.title) || "Untitled Workout",
            date:
              (workout.metadata && workout.metadata.displayDate) ||
              "Unknown Date",
            relativeTime:
              (workout.metadata && workout.metadata.relativeTime) ||
              "Unknown Time",
            exercises: workout.exercises.length,
            muscleGroups:
              (workout.settings && workout.settings.muscleGroups) || [],
            difficulty:
              (workout.settings && workout.settings.difficulty) || "unknown",
            volume: (workout.stats && workout.stats.totalVolume) || 0,
          },
          similarity: comparison.similarities.overallSimilarity,
          commonExercises: comparison.similarities.commonExercises.length,
          commonMuscleGroups: comparison.similarities.commonMuscleGroups.length,
          recommendation: comparison.recommendation,
        };
      });

      // Sort by similarity score (highest first) and limit results
      return similarities
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, maxResults);
    } catch (error) {
      Logger.error(
        "WorkoutHistory",
        "Failed to find similar workouts:",
        error.message
      );
      throw error;
    }
  };

  /**
   * Get workout progression analysis (manual user request only)
   * @param {Array} workoutIds - Array of workout IDs in chronological order
   * @returns {Object} Progression analysis
   * @public
   */
  const analyzeWorkoutProgression = (workoutIds = []) => {
    if (!isReady()) {
      throw new Error("WorkoutHistory: Module not ready");
    }

    try {
      // If no IDs provided, use all workouts in chronological order
      if (workoutIds.length === 0) {
        const allWorkouts = getHistory();
        workoutIds = allWorkouts
          .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
          .map((w) => w.id);
      }

      if (workoutIds.length < 2) {
        return {
          workoutCount: workoutIds.length,
          progression: "insufficient-data",
          message: "Need at least 2 workouts for progression analysis",
        };
      }

      const workouts = workoutIds
        .map((id) => getWorkoutById(id))
        .filter((w) => w !== null);

      if (workouts.length < 2) {
        return {
          workoutCount: workouts.length,
          progression: "insufficient-data",
          message: "Some workouts not found",
        };
      }

      // Analyze volume progression
      const volumes = workouts.map(
        (w) => (w.stats && w.stats.totalVolume) || 0
      );
      const volumeProgression = volumes.map((vol, index) => {
        if (index === 0) return { change: 0, percentage: 0 };
        const prev = volumes[index - 1];
        const change = vol - prev;
        const percentage = prev > 0 ? (change / prev) * 100 : 0;
        return { change, percentage: Math.round(percentage) };
      });

      // Analyze exercise count progression
      const exerciseCounts = workouts.map((w) => w.exercises.length);
      const exerciseProgression = exerciseCounts.map((count, index) => {
        if (index === 0) return { change: 0 };
        return { change: count - exerciseCounts[index - 1] };
      });

      // Analyze muscle group diversity
      const muscleGroupCounts = workouts.map(
        (w) =>
          (w.settings &&
            w.settings.muscleGroups &&
            w.settings.muscleGroups.length) ||
          0
      );
      const diversityProgression = muscleGroupCounts.map((count, index) => {
        if (index === 0) return { change: 0 };
        return { change: count - muscleGroupCounts[index - 1] };
      });

      // Calculate trends
      const volumeTrend =
        volumes.length > 1
          ? (volumes[volumes.length - 1] - volumes[0]) / volumes.length
          : 0;

      const exerciseTrend =
        exerciseCounts.length > 1
          ? (exerciseCounts[exerciseCounts.length - 1] - exerciseCounts[0]) /
            exerciseCounts.length
          : 0;

      // Determine overall progression
      let progressionType = "stable";
      if (volumeTrend > 5) progressionType = "increasing";
      else if (volumeTrend < -5) progressionType = "decreasing";

      return {
        workoutCount: workouts.length,
        timespan: {
          start:
            (workouts[0].metadata && workouts[0].metadata.displayDate) ||
            "Unknown Date",
          end:
            (workouts[workouts.length - 1].metadata &&
              workouts[workouts.length - 1].metadata.displayDate) ||
            "Unknown Date",
          days: Math.ceil(
            (new Date(workouts[workouts.length - 1].timestamp) -
              new Date(workouts[0].timestamp)) /
              (1000 * 60 * 60 * 24)
          ),
        },
        volume: {
          progression: volumeProgression,
          trend: volumeTrend,
          total: volumes.reduce((sum, vol) => sum + vol, 0),
          average: Math.round(
            volumes.reduce((sum, vol) => sum + vol, 0) / volumes.length
          ),
          highest: Math.max(...volumes),
          lowest: Math.min(...volumes),
        },
        exercises: {
          progression: exerciseProgression,
          trend: exerciseTrend,
          average: Math.round(
            exerciseCounts.reduce((sum, count) => sum + count, 0) /
              exerciseCounts.length
          ),
          highest: Math.max(...exerciseCounts),
          lowest: Math.min(...exerciseCounts),
        },
        diversity: {
          progression: diversityProgression,
          average: Math.round(
            muscleGroupCounts.reduce((sum, count) => sum + count, 0) /
              muscleGroupCounts.length
          ),
          highest: Math.max(...muscleGroupCounts),
          lowest: Math.min(...muscleGroupCounts),
        },
        progression: progressionType,
        recommendation:
          progressionType === "increasing"
            ? "Great progress! Keep challenging yourself."
            : progressionType === "decreasing"
            ? "Consider increasing workout intensity."
            : "Consistent workouts. Try varying intensity or exercises.",
      };
    } catch (error) {
      Logger.error(
        "WorkoutHistory",
        "Failed to analyze progression:",
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
    updateWorkout,
    removeWorkout,
    clearHistory,
    getHistoryStats,
    checkWorkoutLimit,
    getSuggestedForRemoval,
    removeOldestWorkouts,
    makeSpaceForNewWorkout,
    getStorageRecommendations,
    compareWorkouts,
    findSimilarWorkouts,
    analyzeWorkoutProgression,
    EVENTS: HISTORY_EVENTS,
  };
})();

// Make available globally
window.WorkoutHistory = WorkoutHistory;
