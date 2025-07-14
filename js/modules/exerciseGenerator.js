/**
 * Exercise Generator Module
 * Handles workout generation algorithms with constraint validation
 */

const ExerciseGenerator = (() => {
  'use strict';

  // Configuration constants
  const CONFIG = {
    MIN_WORKOUT_LENGTH: 5,
    MAX_WORKOUT_LENGTH: 20,
    MAX_RETRY_ATTEMPTS: 100,
    MIN_MUSCLE_GROUPS_REQUIRED: 2
  };

  /**
   * Custom error class for generation failures
   */
  class GenerationError extends Error {
    constructor(message, code = 'GENERATION_FAILED', details = {}) {
      super(message);
      this.name = 'GenerationError';
      this.code = code;
      this.details = details;
    }
  }

  /**
   * Generation result structure for detailed feedback
   */
  class GenerationResult {
    constructor(success = false, workout = [], metadata = {}) {
      this.success = success;
      this.workout = workout;
      this.metadata = {
        generationTime: 0,
        retryCount: 0,
        muscleGroupsUsed: [],
        exerciseCount: workout.length,
        ...metadata
      };
    }
  }

  /**
   * Shuffle array using Fisher-Yates algorithm
   * @param {Array} array - Array to shuffle
   * @returns {Array} - New shuffled array (doesn't mutate original)
   */
  function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Get random element from array
   * @param {Array} array - Array to select from
   * @returns {*} - Random element
   */
  function getRandomElement(array) {
    if (!Array.isArray(array) || array.length === 0) {
      return null;
    }
    return array[Math.floor(Math.random() * array.length)];
  }

  /**
   * Filter exercises by enabled muscle groups
   * @param {Array} exercises - All available exercises
   * @param {Array} enabledGroups - Muscle groups to include
   * @returns {Array} - Filtered exercises
   */
  function filterByEnabledGroups(exercises, enabledGroups) {
    if (!Array.isArray(enabledGroups) || enabledGroups.length === 0) {
      return [...exercises]; // Return all if no filter
    }

    return exercises.filter(exercise => 
      enabledGroups.includes(exercise.muscleGroup)
    );
  }

  /**
   * Get unique muscle groups from exercise list
   * @param {Array} exercises - Exercise list
   * @returns {Array} - Unique muscle groups
   */
  function getUniqueMuscleGroups(exercises) {
    const groups = exercises.map(ex => ex.muscleGroup);
    return [...new Set(groups)];
  }

  /**
   * Validate generation parameters
   * @param {number} length - Desired workout length
   * @param {Array} enabledGroups - Enabled muscle groups
   * @returns {Object} - Validation result
   */
  function validateGenerationParams(length, enabledGroups) {
    const errors = [];

    // Validate workout length
    if (!Number.isInteger(length) || length < CONFIG.MIN_WORKOUT_LENGTH || length > CONFIG.MAX_WORKOUT_LENGTH) {
      errors.push(`Workout length must be between ${CONFIG.MIN_WORKOUT_LENGTH} and ${CONFIG.MAX_WORKOUT_LENGTH}`);
    }

    // Validate enabled groups
    if (!Array.isArray(enabledGroups)) {
      errors.push('Enabled groups must be an array');
    } else if (enabledGroups.length === 0) {
      errors.push('At least one muscle group must be enabled');
    } else if (enabledGroups.length === 1 && length > 1) {
      errors.push('Cannot create multi-exercise workout with only one muscle group (constraint violation)');
    }

    // Check if we have enough exercises in enabled groups
    try {
      const allExercises = ExerciseDatabase.getAllExercises();
      const filteredExercises = filterByEnabledGroups(allExercises, enabledGroups);
      
      if (filteredExercises.length === 0) {
        errors.push('No exercises available for selected muscle groups');
      }

      // Check if we have enough muscle groups for the desired length
      const availableGroups = getUniqueMuscleGroups(filteredExercises);
      if (availableGroups.length < CONFIG.MIN_MUSCLE_GROUPS_REQUIRED && length > 1) {
        errors.push(`Need at least ${CONFIG.MIN_MUSCLE_GROUPS_REQUIRED} muscle groups for multi-exercise workouts`);
      }
    } catch (error) {
      errors.push(`Database error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Select random exercise that doesn't violate constraints
   * @param {Array} currentWorkout - Current workout state
   * @param {Array} availableExercises - Pool of exercises to choose from
   * @returns {Object|null} - Selected exercise or null if none available
   */
  function selectRandomExercise(currentWorkout, availableExercises) {
    try {
      // Get valid options that don't violate constraints
      const validOptions = ConstraintValidator.getValidExerciseOptions(currentWorkout, availableExercises);
      
      if (validOptions.length === 0) {
        return null;
      }

      // Return random valid exercise
      return getRandomElement(validOptions);
    } catch (error) {
      console.error('Error selecting random exercise:', error);
      return null;
    }
  }

  /**
   * Generate workout with backtracking for constraint resolution
   * @param {number} targetLength - Desired number of exercises
   * @param {Array} availableExercises - Pool of exercises
   * @param {number} maxRetries - Maximum retry attempts
   * @returns {Array|null} - Generated workout or null if impossible
   */
  function generateWithBacktracking(targetLength, availableExercises, maxRetries = CONFIG.MAX_RETRY_ATTEMPTS) {
    let attempts = 0;
    
    while (attempts < maxRetries) {
      attempts++;
      const workout = [];
      let failed = false;

      // Try to build workout exercise by exercise
      for (let position = 0; position < targetLength; position++) {
        const selectedExercise = selectRandomExercise(workout, availableExercises);
        
        if (!selectedExercise) {
          // Can't find valid exercise - backtrack
          failed = true;
          break;
        }
        
        workout.push(selectedExercise);
      }

      // Check if we successfully built a complete workout
      if (!failed && workout.length === targetLength) {
        // Final validation
        if (ConstraintValidator.isValidWorkout(workout)) {
          return { workout, attempts };
        }
      }

      // If we've used more than half our retries, try shuffling the exercise pool
      if (attempts > maxRetries / 2) {
        availableExercises = shuffleArray(availableExercises);
      }
    }

    return null; // Failed to generate valid workout
  }

  /**
   * Distribute muscle groups evenly across workout
   * @param {Array} availableExercises - Pool of exercises
   * @param {number} targetLength - Desired workout length
   * @returns {Array} - Exercises distributed for even muscle group usage
   */
  function distributeExercisesEvenly(availableExercises, targetLength) {
    const muscleGroups = getUniqueMuscleGroups(availableExercises);
    const exercisesByGroup = {};

    // Group exercises by muscle group
    muscleGroups.forEach(group => {
      exercisesByGroup[group] = availableExercises.filter(ex => ex.muscleGroup === group);
    });

    // Calculate how many exercises per group (roughly)
    const exercisesPerGroup = Math.ceil(targetLength / muscleGroups.length);
    
    // Build distributed pool
    const distributedPool = [];
    muscleGroups.forEach(group => {
      const groupExercises = shuffleArray(exercisesByGroup[group]);
      // Take up to exercisesPerGroup, but at least 1
      const takeCount = Math.min(exercisesPerGroup, groupExercises.length);
      distributedPool.push(...groupExercises.slice(0, takeCount));
    });

    return shuffleArray(distributedPool);
  }

  /**
   * Main workout generation function
   * @param {number} length - Desired workout length (5-20)
   * @param {Array} enabledGroups - Muscle groups to include (empty = all)
   * @param {Object} options - Additional options
   * @returns {GenerationResult} - Generation result with workout and metadata
   */
  function generateRandomWorkout(length = 10, enabledGroups = [], options = {}) {
    const startTime = performance.now();
    
    try {
      // Set defaults
      const opts = {
        evenDistribution: true,
        maxRetries: CONFIG.MAX_RETRY_ATTEMPTS,
        ...options
      };

      // Input validation
      const validation = validateGenerationParams(length, enabledGroups);
      if (!validation.isValid) {
        throw new GenerationError(
          validation.errors.join('; '),
          'INVALID_PARAMETERS',
          { errors: validation.errors }
        );
      }

      // Get available exercises
      const allExercises = ExerciseDatabase.getAllExercises();
      let availableExercises = filterByEnabledGroups(allExercises, enabledGroups);

      if (availableExercises.length === 0) {
        throw new GenerationError(
          'No exercises available for selected muscle groups',
          'NO_EXERCISES_AVAILABLE'
        );
      }

      // Apply even distribution if requested
      if (opts.evenDistribution && availableExercises.length > length) {
        availableExercises = distributeExercisesEvenly(availableExercises, length);
      } else {
        availableExercises = shuffleArray(availableExercises);
      }

      // Generate workout with backtracking
      const result = generateWithBacktracking(length, availableExercises, opts.maxRetries);
      
      if (!result) {
        throw new GenerationError(
          `Failed to generate valid workout after ${opts.maxRetries} attempts`,
          'GENERATION_TIMEOUT',
          { maxRetries: opts.maxRetries, enabledGroups, targetLength: length }
        );
      }

      const { workout, attempts } = result;
      const generationTime = performance.now() - startTime;

      // Final validation
      const validationResult = ConstraintValidator.validateWorkout(workout);
      if (!validationResult.isValid) {
        throw new GenerationError(
          'Generated workout failed final validation',
          'VALIDATION_FAILED',
          { validationErrors: validationResult.errors }
        );
      }

      // Build success result
      return new GenerationResult(true, workout, {
        generationTime: Math.round(generationTime),
        retryCount: attempts,
        muscleGroupsUsed: getUniqueMuscleGroups(workout),
        evenDistribution: opts.evenDistribution,
        totalAvailableExercises: availableExercises.length,
        constraintViolations: 0
      });

    } catch (error) {
      const generationTime = performance.now() - startTime;
      
      if (error instanceof GenerationError) {
        throw error;
      }
      
      throw new GenerationError(
        `Unexpected error during generation: ${error.message}`,
        'UNEXPECTED_ERROR',
        { originalError: error.message, generationTime: Math.round(generationTime) }
      );
    }
  }

  /**
   * Quick workout generation with sensible defaults
   * @param {number} length - Workout length
   * @returns {Array} - Generated workout (throws on failure)
   */
  function generateQuickWorkout(length = 10) {
    const result = generateRandomWorkout(length, [], { evenDistribution: true });
    
    if (!result.success) {
      throw new GenerationError('Quick generation failed', 'QUICK_GENERATION_FAILED');
    }
    
    return result.workout;
  }

  /**
   * Test generation capabilities with current database
   * @returns {Object} - Test results and capabilities
   */
  function testGenerationCapabilities() {
    try {
      const allGroups = ExerciseDatabase.getAllMuscleGroups();
      const allExercises = ExerciseDatabase.getAllExercises();
      const capabilities = {};

      // Test different workout lengths
      [5, 10, 15, 20].forEach(length => {
        try {
          const result = generateRandomWorkout(length, allGroups, { maxRetries: 50 });
          capabilities[`length_${length}`] = {
            possible: result.success,
            retries: result.metadata.retryCount,
            generationTime: result.metadata.generationTime
          };
        } catch (error) {
          capabilities[`length_${length}`] = {
            possible: false,
            error: error.message
          };
        }
      });

      // Test with limited muscle groups
      const groupCombinations = [
        allGroups.slice(0, 2), // 2 groups
        allGroups.slice(0, 3), // 3 groups
        allGroups.slice(0, 4)  // 4 groups
      ];

      groupCombinations.forEach((groups, index) => {
        try {
          const result = generateRandomWorkout(10, groups, { maxRetries: 30 });
          capabilities[`groups_${groups.length}`] = {
            possible: result.success,
            muscleGroups: groups,
            retries: result.metadata.retryCount
          };
        } catch (error) {
          capabilities[`groups_${groups.length}`] = {
            possible: false,
            muscleGroups: groups,
            error: error.message
          };
        }
      });

      return {
        databaseStats: {
          totalExercises: allExercises.length,
          muscleGroups: allGroups.length,
          exercisesPerGroup: ExerciseDatabase.getExerciseCounts()
        },
        capabilities,
        recommendations: {
          optimalLength: capabilities.length_10?.possible ? 10 : 'Test other lengths',
          minMuscleGroups: CONFIG.MIN_MUSCLE_GROUPS_REQUIRED,
          expectedPerformance: '< 100ms for standard workouts'
        }
      };
    } catch (error) {
      return {
        error: error.message,
        capabilities: {},
        databaseStats: null
      };
    }
  }

  /**
   * Exercise replacement history for undo/redo functionality
   */
  class ReplacementHistory {
    constructor(maxHistory = 50) {
      this.history = [];
      this.currentIndex = -1;
      this.maxHistory = maxHistory;
    }

    addReplacement(workoutIndex, oldExercise, newExercise) {
      // Remove any future history if we're not at the end
      if (this.currentIndex < this.history.length - 1) {
        this.history = this.history.slice(0, this.currentIndex + 1);
      }

      // Add new replacement
      this.history.push({
        workoutIndex,
        oldExercise: { ...oldExercise },
        newExercise: { ...newExercise },
        timestamp: Date.now()
      });

      // Limit history size
      if (this.history.length > this.maxHistory) {
        this.history = this.history.slice(-this.maxHistory);
      }

      this.currentIndex = this.history.length - 1;
    }

    canUndo() {
      return this.currentIndex >= 0;
    }

    canRedo() {
      return this.currentIndex < this.history.length - 1;
    }

    getUndo() {
      if (!this.canUndo()) return null;
      
      const replacement = this.history[this.currentIndex];
      this.currentIndex--;
      
      return {
        workoutIndex: replacement.workoutIndex,
        restoreExercise: replacement.oldExercise
      };
    }

    getRedo() {
      if (!this.canRedo()) return null;
      
      this.currentIndex++;
      const replacement = this.history[this.currentIndex];
      
      return {
        workoutIndex: replacement.workoutIndex,
        restoreExercise: replacement.newExercise
      };
    }

    clear() {
      this.history = [];
      this.currentIndex = -1;
    }

    getHistorySize() {
      return this.history.length;
    }
  }

  // Global replacement history instance
  const replacementHistory = new ReplacementHistory();

  /**
   * Get all valid replacement options for an exercise at a specific position
   * @param {number} workoutPosition - Position in workout (0-based index)
   * @param {Array} workout - Current workout array
   * @param {Array} enabledGroups - Optional: limit to specific muscle groups
   * @returns {Array} - Valid replacement exercises from same muscle group
   */
  function getReplacementOptions(workoutPosition, workout, enabledGroups = []) {
    // Input validation
    if (!Array.isArray(workout)) {
      throw new GenerationError('Workout must be an array', 'INVALID_WORKOUT');
    }

    if (workoutPosition < 0 || workoutPosition >= workout.length) {
      throw new GenerationError(
        `Invalid position ${workoutPosition} (workout length: ${workout.length})`,
        'INVALID_POSITION'
      );
    }

    const currentExercise = workout[workoutPosition];
    if (!currentExercise || !currentExercise.muscleGroup) {
      throw new GenerationError(
        'Current exercise is invalid or missing muscle group',
        'INVALID_CURRENT_EXERCISE'
      );
    }

    try {
      // Get all exercises from the same muscle group
      const sameGroupExercises = ExerciseDatabase.getExercisesByMuscleGroup(currentExercise.muscleGroup);
      
      // Filter by enabled groups if specified
      let candidateExercises = sameGroupExercises;
      if (enabledGroups.length > 0) {
        candidateExercises = filterByEnabledGroups(sameGroupExercises, enabledGroups);
      }

      // Remove current exercise from candidates
      candidateExercises = candidateExercises.filter(ex => ex.id !== currentExercise.id);

      if (candidateExercises.length === 0) {
        return []; // No alternatives available
      }

      // Filter candidates that would violate constraints with neighbors
      const validReplacements = candidateExercises.filter(candidate => {
        // Create test workout with the replacement
        const testWorkout = [...workout];
        testWorkout[workoutPosition] = candidate;
        
        // Check constraints around the replacement position
        const validationResult = ConstraintValidator.validateExerciseInsertion(
          workout, 
          workoutPosition, 
          candidate
        );
        
        return validationResult.isValid;
      });

      return validReplacements;

    } catch (error) {
      if (error instanceof ExerciseDatabase.ExerciseDatabaseError) {
        throw new GenerationError(
          `Database error getting replacement options: ${error.message}`,
          'DATABASE_ERROR'
        );
      }
      throw new GenerationError(
        `Error getting replacement options: ${error.message}`,
        'REPLACEMENT_OPTIONS_ERROR'
      );
    }
  }

  /**
   * Replace an exercise at a specific position with validation
   * @param {Array} workout - Current workout (will be modified)
   * @param {number} workoutIndex - Position to replace (0-based)
   * @param {Object} newExercise - Exercise to replace with
   * @param {Object} options - Additional options
   * @returns {Object} - Replacement result with success status and details
   */
  function replaceExercise(workout, workoutIndex, newExercise, options = {}) {
    const opts = {
      trackHistory: true,
      validateConstraints: true,
      ...options
    };

    try {
      // Input validation
      if (!Array.isArray(workout)) {
        throw new GenerationError('Workout must be an array', 'INVALID_WORKOUT');
      }

      if (workoutIndex < 0 || workoutIndex >= workout.length) {
        throw new GenerationError(
          `Invalid index ${workoutIndex} (workout length: ${workout.length})`,
          'INVALID_INDEX'
        );
      }

      if (!newExercise || !newExercise.muscleGroup || !newExercise.id) {
        throw new GenerationError(
          'New exercise must have valid muscleGroup and id',
          'INVALID_NEW_EXERCISE'
        );
      }

      const oldExercise = workout[workoutIndex];
      if (!oldExercise) {
        throw new GenerationError(
          'No exercise exists at the specified position',
          'NO_EXISTING_EXERCISE'
        );
      }

      // Check if it's actually a replacement (not the same exercise)
      if (oldExercise.id === newExercise.id) {
        return {
          success: true,
          replaced: false,
          message: 'Same exercise selected - no change needed',
          oldExercise,
          newExercise
        };
      }

      // Validate muscle group consistency
      if (oldExercise.muscleGroup !== newExercise.muscleGroup) {
        throw new GenerationError(
          `Muscle group mismatch: cannot replace ${oldExercise.muscleGroup} exercise with ${newExercise.muscleGroup} exercise`,
          'MUSCLE_GROUP_MISMATCH'
        );
      }

      // Validate constraints if requested
      if (opts.validateConstraints) {
        const validationResult = ConstraintValidator.validateExerciseInsertion(
          workout,
          workoutIndex,
          newExercise
        );

        if (!validationResult.isValid) {
          const errorMessages = validationResult.errors.map(e => e.message).join('; ');
          throw new GenerationError(
            `Replacement would violate constraints: ${errorMessages}`,
            'CONSTRAINT_VIOLATION',
            { validationErrors: validationResult.errors }
          );
        }
      }

      // Perform the replacement
      workout[workoutIndex] = { ...newExercise }; // Create copy to prevent external mutation

      // Add to history if tracking enabled
      if (opts.trackHistory) {
        replacementHistory.addReplacement(workoutIndex, oldExercise, newExercise);
      }

      // Final validation of entire workout
      if (opts.validateConstraints) {
        const workoutValidation = ConstraintValidator.validateWorkout(workout);
        if (!workoutValidation.isValid) {
          // Rollback the change
          workout[workoutIndex] = oldExercise;
          
          throw new GenerationError(
            'Replacement caused workout constraint violations - reverted',
            'WORKOUT_VALIDATION_FAILED',
            { workoutErrors: workoutValidation.errors }
          );
        }
      }

      return {
        success: true,
        replaced: true,
        message: `Successfully replaced "${oldExercise.name}" with "${newExercise.name}"`,
        oldExercise,
        newExercise,
        workoutIndex,
        historySize: replacementHistory.getHistorySize()
      };

    } catch (error) {
      if (error instanceof GenerationError) {
        throw error;
      }
      
      throw new GenerationError(
        `Unexpected error during replacement: ${error.message}`,
        'REPLACEMENT_ERROR',
        { originalError: error.message }
      );
    }
  }

  /**
   * Get a random valid replacement for an exercise
   * @param {number} workoutPosition - Position in workout
   * @param {Array} workout - Current workout
   * @param {Array} excludeIds - Exercise IDs to exclude
   * @returns {Object|null} - Random replacement exercise or null
   */
  function getRandomReplacement(workoutPosition, workout, excludeIds = []) {
    try {
      const options = getReplacementOptions(workoutPosition, workout);
      
      // Filter out excluded exercises
      const filteredOptions = options.filter(ex => !excludeIds.includes(ex.id));
      
      if (filteredOptions.length === 0) {
        return null;
      }

      return getRandomElement(filteredOptions);
    } catch (error) {
      console.error('Error getting random replacement:', error);
      return null;
    }
  }

  /**
   * Undo last replacement
   * @param {Array} workout - Current workout (will be modified)
   * @returns {Object} - Undo result
   */
  function undoReplacement(workout) {
    if (!replacementHistory.canUndo()) {
      return {
        success: false,
        message: 'No replacements to undo'
      };
    }

    try {
      const undoData = replacementHistory.getUndo();
      
      if (!undoData) {
        return {
          success: false,
          message: 'Undo data unavailable'
        };
      }

      const { workoutIndex, restoreExercise } = undoData;
      
      // Validate workout bounds
      if (workoutIndex < 0 || workoutIndex >= workout.length) {
        return {
          success: false,
          message: 'Undo position out of bounds - workout may have changed'
        };
      }

      const currentExercise = workout[workoutIndex];
      workout[workoutIndex] = { ...restoreExercise };

      return {
        success: true,
        message: `Undid replacement: restored "${restoreExercise.name}"`,
        restoredExercise: restoreExercise,
        previousExercise: currentExercise,
        workoutIndex
      };

    } catch (error) {
      return {
        success: false,
        message: `Undo failed: ${error.message}`
      };
    }
  }

  /**
   * Redo last undone replacement
   * @param {Array} workout - Current workout (will be modified)
   * @returns {Object} - Redo result
   */
  function redoReplacement(workout) {
    if (!replacementHistory.canRedo()) {
      return {
        success: false,
        message: 'No replacements to redo'
      };
    }

    try {
      const redoData = replacementHistory.getRedo();
      
      if (!redoData) {
        return {
          success: false,
          message: 'Redo data unavailable'
        };
      }

      const { workoutIndex, restoreExercise } = redoData;
      
      // Validate workout bounds
      if (workoutIndex < 0 || workoutIndex >= workout.length) {
        return {
          success: false,
          message: 'Redo position out of bounds - workout may have changed'
        };
      }

      const currentExercise = workout[workoutIndex];
      workout[workoutIndex] = { ...restoreExercise };

      return {
        success: true,
        message: `Redid replacement: restored "${restoreExercise.name}"`,
        restoredExercise: restoreExercise,
        previousExercise: currentExercise,
        workoutIndex
      };

    } catch (error) {
      return {
        success: false,
        message: `Redo failed: ${error.message}`
      };
    }
  }

  /**
   * Clear replacement history
   */
  function clearReplacementHistory() {
    replacementHistory.clear();
  }

  /**
   * Get replacement history status
   * @returns {Object} - History status
   */
  function getReplacementHistoryStatus() {
    return {
      canUndo: replacementHistory.canUndo(),
      canRedo: replacementHistory.canRedo(),
      historySize: replacementHistory.getHistorySize(),
      maxHistory: replacementHistory.maxHistory
    };
  }

  // Public API
  return {
    // Main generation functions
    generateRandomWorkout,
    generateQuickWorkout,
    
    // Replacement functions
    getReplacementOptions,
    replaceExercise,
    getRandomReplacement,
    
    // History functions
    undoReplacement,
    redoReplacement,
    clearReplacementHistory,
    getReplacementHistoryStatus,
    
    // Utility functions
    shuffleArray,
    getRandomElement,
    filterByEnabledGroups,
    getUniqueMuscleGroups,
    
    // Validation and testing
    validateGenerationParams,
    testGenerationCapabilities,
    
    // Configuration
    CONFIG,
    
    // Error types
    GenerationError,
    GenerationResult,
    ReplacementHistory
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExerciseGenerator;
} else {
  // Browser global
  window.ExerciseGenerator = ExerciseGenerator;
}
