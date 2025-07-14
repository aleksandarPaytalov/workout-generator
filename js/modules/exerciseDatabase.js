/**
 * Exercise Database Module
 * Manages exercise data and provides access methods with validation
 */

const ExerciseDatabase = (() => {
  'use strict';

  // Define the muscle groups we support
  const MUSCLE_GROUPS = {
    CHEST: 'chest',
    BACK: 'back', 
    LEGS: 'legs',
    SHOULDERS: 'shoulders',
    ARMS: 'arms',
    CORE: 'core'
  };

  /**
   * Exercise data structure:
   * {
   *   id: string (unique identifier: 'muscleGroup_###')
   *   name: string (display name)
   *   muscleGroup: string (one of MUSCLE_GROUPS values)
   * }
   */
  
  // Main exercise database - organized by muscle group for fast lookups
  const EXERCISES = {
    [MUSCLE_GROUPS.CHEST]: [
      { id: 'chest_001', name: 'Push-ups', muscleGroup: 'chest' },
      { id: 'chest_002', name: 'Bench Press', muscleGroup: 'chest' },
      { id: 'chest_003', name: 'Incline Push-ups', muscleGroup: 'chest' },
      { id: 'chest_004', name: 'Dips', muscleGroup: 'chest' },
      { id: 'chest_005', name: 'Incline Bench Press', muscleGroup: 'chest' },
      { id: 'chest_006', name: 'Decline Push-ups', muscleGroup: 'chest' },
      { id: 'chest_007', name: 'Chest Flyes', muscleGroup: 'chest' },
      { id: 'chest_008', name: 'Diamond Push-ups', muscleGroup: 'chest' },
      { id: 'chest_009', name: 'Wide-Grip Push-ups', muscleGroup: 'chest' },
      { id: 'chest_010', name: 'Chest Press Machine', muscleGroup: 'chest' }
    ],
    [MUSCLE_GROUPS.BACK]: [
      { id: 'back_001', name: 'Pull-ups', muscleGroup: 'back' },
      { id: 'back_002', name: 'Bent-over Rows', muscleGroup: 'back' },
      { id: 'back_003', name: 'Lat Pulldowns', muscleGroup: 'back' },
      { id: 'back_004', name: 'Deadlifts', muscleGroup: 'back' },
      { id: 'back_005', name: 'T-Bar Rows', muscleGroup: 'back' },
      { id: 'back_006', name: 'Seated Cable Rows', muscleGroup: 'back' },
      { id: 'back_007', name: 'Chin-ups', muscleGroup: 'back' },
      { id: 'back_008', name: 'One-Arm Dumbbell Rows', muscleGroup: 'back' },
      { id: 'back_009', name: 'Inverted Rows', muscleGroup: 'back' },
      { id: 'back_010', name: 'Romanian Deadlifts', muscleGroup: 'back' },
      { id: 'back_011', name: 'Reverse Flyes', muscleGroup: 'back' }
    ],
    [MUSCLE_GROUPS.LEGS]: [
      { id: 'legs_001', name: 'Squats', muscleGroup: 'legs' },
      { id: 'legs_002', name: 'Lunges', muscleGroup: 'legs' },
      { id: 'legs_003', name: 'Leg Press', muscleGroup: 'legs' },
      { id: 'legs_004', name: 'Calf Raises', muscleGroup: 'legs' },
      { id: 'legs_005', name: 'Bulgarian Split Squats', muscleGroup: 'legs' },
      { id: 'legs_006', name: 'Leg Curls', muscleGroup: 'legs' },
      { id: 'legs_007', name: 'Leg Extensions', muscleGroup: 'legs' },
      { id: 'legs_008', name: 'Step-ups', muscleGroup: 'legs' },
      { id: 'legs_009', name: 'Wall Sits', muscleGroup: 'legs' },
      { id: 'legs_010', name: 'Jump Squats', muscleGroup: 'legs' },
      { id: 'legs_011', name: 'Single-Leg Glute Bridges', muscleGroup: 'legs' },
      { id: 'legs_012', name: 'Walking Lunges', muscleGroup: 'legs' }
    ],
    [MUSCLE_GROUPS.SHOULDERS]: [
      { id: 'shoulders_001', name: 'Overhead Press', muscleGroup: 'shoulders' },
      { id: 'shoulders_002', name: 'Lateral Raises', muscleGroup: 'shoulders' },
      { id: 'shoulders_003', name: 'Front Raises', muscleGroup: 'shoulders' },
      { id: 'shoulders_004', name: 'Rear Delt Flyes', muscleGroup: 'shoulders' },
      { id: 'shoulders_005', name: 'Arnold Press', muscleGroup: 'shoulders' },
      { id: 'shoulders_006', name: 'Pike Push-ups', muscleGroup: 'shoulders' },
      { id: 'shoulders_007', name: 'Upright Rows', muscleGroup: 'shoulders' },
      { id: 'shoulders_008', name: 'Handstand Push-ups', muscleGroup: 'shoulders' },
      { id: 'shoulders_009', name: 'Shoulder Shrugs', muscleGroup: 'shoulders' },
      { id: 'shoulders_010', name: 'Face Pulls', muscleGroup: 'shoulders' }
    ],
    [MUSCLE_GROUPS.ARMS]: [
      { id: 'arms_001', name: 'Bicep Curls', muscleGroup: 'arms' },
      { id: 'arms_002', name: 'Tricep Dips', muscleGroup: 'arms' },
      { id: 'arms_003', name: 'Hammer Curls', muscleGroup: 'arms' },
      { id: 'arms_004', name: 'Tricep Extensions', muscleGroup: 'arms' },
      { id: 'arms_005', name: 'Close-Grip Push-ups', muscleGroup: 'arms' },
      { id: 'arms_006', name: 'Concentration Curls', muscleGroup: 'arms' },
      { id: 'arms_007', name: 'Tricep Kickbacks', muscleGroup: 'arms' },
      { id: 'arms_008', name: 'Preacher Curls', muscleGroup: 'arms' },
      { id: 'arms_009', name: 'Overhead Tricep Extension', muscleGroup: 'arms' },
      { id: 'arms_010', name: 'Cable Curls', muscleGroup: 'arms' },
      { id: 'arms_011', name: 'Tricep Pushdowns', muscleGroup: 'arms' }
    ],
    [MUSCLE_GROUPS.CORE]: [
      { id: 'core_001', name: 'Planks', muscleGroup: 'core' },
      { id: 'core_002', name: 'Crunches', muscleGroup: 'core' },
      { id: 'core_003', name: 'Mountain Climbers', muscleGroup: 'core' },
      { id: 'core_004', name: 'Russian Twists', muscleGroup: 'core' },
      { id: 'core_005', name: 'Bicycle Crunches', muscleGroup: 'core' },
      { id: 'core_006', name: 'Dead Bug', muscleGroup: 'core' },
      { id: 'core_007', name: 'Leg Raises', muscleGroup: 'core' },
      { id: 'core_008', name: 'Side Planks', muscleGroup: 'core' },
      { id: 'core_009', name: 'Flutter Kicks', muscleGroup: 'core' },
      { id: 'core_010', name: 'Hollow Body Hold', muscleGroup: 'core' },
      { id: 'core_011', name: 'V-ups', muscleGroup: 'core' },
      { id: 'core_012', name: 'Bear Crawl', muscleGroup: 'core' }
    ]
  };

  /**
   * Validates exercise object structure
   * @param {Object} exercise - Exercise object to validate
   * @returns {boolean} - True if valid, false otherwise
   */
  function isValidExercise(exercise) {
    if (!exercise || typeof exercise !== 'object') {
      return false;
    }

    // Required fields check
    if (!exercise.id || typeof exercise.id !== 'string') {
      return false;
    }
    
    if (!exercise.name || typeof exercise.name !== 'string') {
      return false;
    }
    
    if (!exercise.muscleGroup || typeof exercise.muscleGroup !== 'string') {
      return false;
    }

    // Muscle group must be valid
    if (!Object.values(MUSCLE_GROUPS).includes(exercise.muscleGroup)) {
      return false;
    }

    return true;
  }

  /**
   * Validates that exercise ID follows naming convention
   * @param {string} id - Exercise ID to validate
   * @param {string} expectedMuscleGroup - Expected muscle group
   * @returns {boolean} - True if valid format
   */
  function isValidExerciseId(id, expectedMuscleGroup) {
    // Expected format: muscleGroup_### (e.g., 'chest_001')
    const pattern = new RegExp(`^${expectedMuscleGroup}_\\d{3}$`);
    return pattern.test(id);
  }

  /**
   * Get all exercises for a specific muscle group
   * @param {string} muscleGroup - Muscle group to filter by
   * @returns {Array} - Array of exercise objects, or empty array if invalid group
   */
  function getExercisesByMuscleGroup(muscleGroup) {
    // Validate input
    if (!muscleGroup || typeof muscleGroup !== 'string') {
      console.warn('ExerciseDatabase: Invalid muscle group provided:', muscleGroup);
      return [];
    }

    // Check if muscle group exists
    if (!Object.values(MUSCLE_GROUPS).includes(muscleGroup)) {
      console.warn('ExerciseDatabase: Unknown muscle group:', muscleGroup);
      return [];
    }

    // Return copy to prevent external mutation
    return [...EXERCISES[muscleGroup]];
  }

  /**
   * Get all available muscle groups
   * @returns {Array} - Array of muscle group strings
   */
  function getAllMuscleGroups() {
    return Object.values(MUSCLE_GROUPS);
  }

  /**
   * Get all exercises from all muscle groups
   * @returns {Array} - Flattened array of all exercise objects
   */
  function getAllExercises() {
    const allExercises = [];
    
    for (const muscleGroup of Object.keys(EXERCISES)) {
      allExercises.push(...EXERCISES[muscleGroup]);
    }
    
    return allExercises;
  }

  /**
   * Get exercise by ID
   * @param {string} exerciseId - Exercise ID to find
   * @returns {Object|null} - Exercise object or null if not found
   */
  function getExerciseById(exerciseId) {
    if (!exerciseId || typeof exerciseId !== 'string') {
      return null;
    }

    // Extract muscle group from ID (format: muscleGroup_###)
    const muscleGroup = exerciseId.split('_')[0];
    
    if (!EXERCISES[muscleGroup]) {
      return null;
    }

    return EXERCISES[muscleGroup].find(exercise => exercise.id === exerciseId) || null;
  }

  /**
   * Get count of exercises per muscle group
   * @returns {Object} - Object with muscle group counts
   */
  function getExerciseCounts() {
    const counts = {};
    
    for (const [muscleGroup, exercises] of Object.entries(EXERCISES)) {
      counts[muscleGroup] = exercises.length;
    }
    
    return counts;
  }

  /**
   * Custom error types for better error handling
   */
  class ExerciseDatabaseError extends Error {
    constructor(message, code = 'DB_ERROR') {
      super(message);
      this.name = 'ExerciseDatabaseError';
      this.code = code;
    }
  }

  /**
   * Database state tracking
   */
  let _isInitialized = false;
  let _initializationErrors = [];

  /**
   * Initialize and validate the database
   * Automatically called on first access, but can be called manually
   * @returns {Object} - Initialization result
   */
  function initializeDatabase() {
    if (_isInitialized) {
      return { success: true, errors: [] };
    }

    console.log('ExerciseDatabase: Initializing and validating database...');
    
    const validation = validateDatabase();
    _initializationErrors = validation.errors;

    if (validation.isValid) {
      _isInitialized = true;
      console.log(`ExerciseDatabase: Successfully initialized with ${validation.totalExercises} exercises`);
      console.log('Exercise counts:', validation.muscleGroupCounts);
    } else {
      console.error('ExerciseDatabase: Database validation failed:');
      validation.errors.forEach(error => console.error(`  - ${error}`));
      
      // Try to recover if possible
      const recovered = attemptDataRecovery();
      if (recovered) {
        _isInitialized = true;
        console.warn('ExerciseDatabase: Partial recovery successful, continuing with available data');
      } else {
        throw new ExerciseDatabaseError(
          `Database initialization failed: ${validation.errors.join(', ')}`,
          'INIT_FAILED'
        );
      }
    }

    return {
      success: _isInitialized,
      errors: _initializationErrors,
      totalExercises: validation.totalExercises,
      muscleGroupCounts: validation.muscleGroupCounts
    };
  }

  /**
   * Attempt to recover from database corruption
   * Removes invalid exercises and reports what was recovered
   * @returns {boolean} - True if recovery successful
   */
  function attemptDataRecovery() {
    let recoveredGroups = 0;
    let removedExercises = 0;

    for (const [muscleGroup, exercises] of Object.entries(EXERCISES)) {
      if (!exercises || !Array.isArray(exercises)) {
        console.error(`Cannot recover ${muscleGroup}: not an array`);
        continue;
      }

      // Filter out invalid exercises
      const validExercises = exercises.filter(exercise => {
        const isValid = isValidExercise(exercise) && 
                       isValidExerciseId(exercise.id, muscleGroup) &&
                       exercise.muscleGroup === muscleGroup;
        
        if (!isValid) {
          removedExercises++;
          console.warn(`Removed invalid exercise: ${JSON.stringify(exercise)}`);
        }
        
        return isValid;
      });

      // Update the exercises array
      EXERCISES[muscleGroup] = validExercises;

      // Check if muscle group still has minimum exercises
      if (validExercises.length >= 8) {
        recoveredGroups++;
      } else {
        console.error(`${muscleGroup} has only ${validExercises.length} valid exercises (minimum 8 required)`);
      }
    }

    const hasMinimumData = recoveredGroups >= 3; // Need at least 3 muscle groups to be useful
    
    if (hasMinimumData) {
      console.log(`Recovery completed: ${recoveredGroups} muscle groups recovered, ${removedExercises} invalid exercises removed`);
    }
    
    return hasMinimumData;
  }

  /**
   * Enhanced validation that checks current database state
   */
  function ensureDatabaseReady() {
    if (!_isInitialized) {
      initializeDatabase();
    }
    
    if (_initializationErrors.length > 0) {
      console.warn('ExerciseDatabase: Operating with validation warnings:', _initializationErrors);
    }
  }

  /**
   * Get all exercises for a specific muscle group (Enhanced with validation)
   */
  function getExercisesByMuscleGroup(muscleGroup) {
    ensureDatabaseReady();
    
    // Validate input
    if (!muscleGroup || typeof muscleGroup !== 'string') {
      throw new ExerciseDatabaseError(
        `Invalid muscle group parameter: expected string, got ${typeof muscleGroup}`,
        'INVALID_PARAM'
      );
    }

    // Normalize muscle group (trim whitespace, lowercase)
    const normalizedGroup = muscleGroup.trim().toLowerCase();

    // Check if muscle group exists
    if (!Object.values(MUSCLE_GROUPS).includes(normalizedGroup)) {
      const availableGroups = Object.values(MUSCLE_GROUPS).join(', ');
      throw new ExerciseDatabaseError(
        `Unknown muscle group: '${muscleGroup}'. Available groups: ${availableGroups}`,
        'UNKNOWN_MUSCLE_GROUP'
      );
    }

    const exercises = EXERCISES[normalizedGroup];
    
    // Validate muscle group has exercises
    if (!exercises || exercises.length === 0) {
      throw new ExerciseDatabaseError(
        `No exercises available for muscle group: ${muscleGroup}`,
        'EMPTY_MUSCLE_GROUP'
      );
    }

    // Return defensive copy
    return exercises.map(exercise => ({ ...exercise }));
  }

  /**
   * Get all available muscle groups (Enhanced)
   */
  function getAllMuscleGroups() {
    ensureDatabaseReady();
    
    // Only return muscle groups that have exercises
    return Object.keys(EXERCISES).filter(group => 
      EXERCISES[group] && EXERCISES[group].length > 0
    );
  }

  /**
   * Get all exercises from all muscle groups (Enhanced)
   */
  function getAllExercises() {
    ensureDatabaseReady();
    
    const allExercises = [];
    
    for (const muscleGroup of getAllMuscleGroups()) {
      try {
        const exercises = getExercisesByMuscleGroup(muscleGroup);
        allExercises.push(...exercises);
      } catch (error) {
        console.warn(`Skipping muscle group ${muscleGroup} due to error:`, error.message);
      }
    }
    
    if (allExercises.length === 0) {
      throw new ExerciseDatabaseError(
        'No valid exercises found in database',
        'EMPTY_DATABASE'
      );
    }
    
    return allExercises;
  }

  /**
   * Get exercise by ID (Enhanced)
   */
  function getExerciseById(exerciseId) {
    ensureDatabaseReady();
    
    if (!exerciseId || typeof exerciseId !== 'string') {
      throw new ExerciseDatabaseError(
        `Invalid exercise ID: expected string, got ${typeof exerciseId}`,
        'INVALID_EXERCISE_ID'
      );
    }

    // Extract muscle group from ID (format: muscleGroup_###)
    const parts = exerciseId.split('_');
    if (parts.length !== 2) {
      throw new ExerciseDatabaseError(
        `Invalid exercise ID format: '${exerciseId}' (expected: muscleGroup_###)`,
        'INVALID_ID_FORMAT'
      );
    }

    const muscleGroup = parts[0];
    
    try {
      const exercises = getExercisesByMuscleGroup(muscleGroup);
      const exercise = exercises.find(ex => ex.id === exerciseId);
      
      if (!exercise) {
        throw new ExerciseDatabaseError(
          `Exercise not found: ${exerciseId}`,
          'EXERCISE_NOT_FOUND'
        );
      }
      
      return { ...exercise }; // Return copy
    } catch (error) {
      if (error instanceof ExerciseDatabaseError) {
        throw error;
      }
      throw new ExerciseDatabaseError(
        `Failed to retrieve exercise ${exerciseId}: ${error.message}`,
        'RETRIEVAL_ERROR'
      );
    }
  }

  /**
   * Get database health status
   * @returns {Object} - Health information
   */
  function getDatabaseHealth() {
    ensureDatabaseReady();
    
    const health = {
      isHealthy: _initializationErrors.length === 0,
      totalExercises: 0,
      muscleGroupCounts: {},
      warnings: [..._initializationErrors],
      availableMuscleGroups: getAllMuscleGroups()
    };

    try {
      health.totalExercises = getAllExercises().length;
      health.muscleGroupCounts = getExerciseCounts();
    } catch (error) {
      health.warnings.push(`Health check error: ${error.message}`);
    }

    return health;
  }

  /**
   * Validate database integrity - check for missing data, duplicate IDs, etc.
   * @returns {Object} - Validation result with isValid flag and errors array
   */
  function validateDatabase() {
    const errors = [];
    const allIds = new Set();

    // Check each muscle group
    for (const [muscleGroup, exercises] of Object.entries(EXERCISES)) {
      if (!exercises || !Array.isArray(exercises)) {
        errors.push(`Missing or invalid exercise array for ${muscleGroup}`);
        continue;
      }

      if (exercises.length < 8) {
        errors.push(`${muscleGroup} has only ${exercises.length} exercises (minimum 8 required)`);
      }

      // Check each exercise
      exercises.forEach((exercise, index) => {
        // Validate exercise structure
        if (!isValidExercise(exercise)) {
          errors.push(`Invalid exercise at ${muscleGroup}[${index}]: ${JSON.stringify(exercise)}`);
          return;
        }

        // Check for duplicate IDs
        if (allIds.has(exercise.id)) {
          errors.push(`Duplicate exercise ID: ${exercise.id}`);
        } else {
          allIds.add(exercise.id);
        }

        // Validate ID format
        if (!isValidExerciseId(exercise.id, muscleGroup)) {
          errors.push(`Invalid ID format: ${exercise.id} (expected: ${muscleGroup}_###)`);
        }

        // Validate muscle group consistency
        if (exercise.muscleGroup !== muscleGroup) {
          errors.push(`Muscle group mismatch: ${exercise.id} has muscleGroup '${exercise.muscleGroup}' but is in '${muscleGroup}' array`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      totalExercises: allIds.size,
      muscleGroupCounts: getExerciseCounts()
    };
  }

  // Auto-initialize database when module loads
  // This ensures any critical errors are caught immediately
  try {
    // Delay initialization to allow for any setup
    setTimeout(() => {
      try {
        initializeDatabase();
      } catch (error) {
        console.error('ExerciseDatabase: Critical initialization failure:', error);
      }
    }, 0);
  } catch (error) {
    console.error('ExerciseDatabase: Failed to schedule initialization:', error);
  }

  // Public API
  return {
    // Constants
    MUSCLE_GROUPS,
    
    // Data access methods (enhanced with validation)
    getExercisesByMuscleGroup,
    getAllMuscleGroups,
    getAllExercises,
    getExerciseById,
    getExerciseCounts,
    
    // Validation and health methods
    isValidExercise,
    isValidExerciseId,
    validateDatabase,
    getDatabaseHealth,
    
    // Database management
    initializeDatabase,
    
    // Error types
    ExerciseDatabaseError,
    
    // Internal data (exposed for development/debugging only)
    _exercises: EXERCISES,
    _isInitialized: () => _isInitialized,
    _initializationErrors: () => [..._initializationErrors]
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExerciseDatabase;
} else {
  // Browser global
  window.ExerciseDatabase = ExerciseDatabase;
}
