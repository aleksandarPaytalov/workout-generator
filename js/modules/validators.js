/**
 * Constraint Validation System
 * Handles workout validation and muscle group constraint enforcement
 */

const ConstraintValidator = (() => {
  'use strict';

  /**
   * Custom error class for constraint violations
   */
  class ConstraintViolationError extends Error {
    constructor(message, violationType = 'CONSTRAINT_VIOLATION', exerciseIndex = null) {
      super(message);
      this.name = 'ConstraintViolationError';
      this.violationType = violationType;
      this.exerciseIndex = exerciseIndex;
    }
  }

  /**
   * Validation result structure for detailed feedback
   */
  class ValidationResult {
    constructor(isValid = true, errors = [], warnings = []) {
      this.isValid = isValid;
      this.errors = errors;
      this.warnings = warnings;
      this.violationCount = errors.length;
    }

    addError(message, exerciseIndex = null, violationType = 'CONSTRAINT_VIOLATION') {
      this.errors.push({
        message,
        exerciseIndex,
        violationType,
        severity: 'error'
      });
      this.isValid = false;
      this.violationCount++;
    }

    addWarning(message, exerciseIndex = null) {
      this.warnings.push({
        message,
        exerciseIndex,
        severity: 'warning'
      });
    }
  }

  /**
   * Get the muscle group of the last exercise in a workout list
   * @param {Array} exerciseList - Array of exercise objects
   * @returns {string|null} - Muscle group string or null if empty
   */
  function getLastMuscleGroup(exerciseList) {
    if (!Array.isArray(exerciseList) || exerciseList.length === 0) {
      return null;
    }

    const lastExercise = exerciseList[exerciseList.length - 1];
    
    if (!lastExercise || !lastExercise.muscleGroup) {
      throw new ConstraintViolationError(
        'Last exercise in list has invalid or missing muscle group',
        'INVALID_EXERCISE_DATA'
      );
    }

    return lastExercise.muscleGroup;
  }

  /**
   * Check if adding a new exercise would violate constraints
   * Core constraint: No two consecutive exercises can target the same muscle group
   * @param {Array} currentWorkout - Current workout list
   * @param {Object} newExercise - Exercise to potentially add
   * @returns {boolean} - True if exercise can be added safely
   */
  function canAddExercise(currentWorkout, newExercise) {
    // Validate inputs
    if (!Array.isArray(currentWorkout)) {
      throw new ConstraintViolationError(
        'Current workout must be an array',
        'INVALID_WORKOUT_DATA'
      );
    }

    if (!newExercise || typeof newExercise !== 'object' || !newExercise.muscleGroup) {
      throw new ConstraintViolationError(
        'New exercise must be a valid exercise object with muscleGroup',
        'INVALID_EXERCISE_DATA'
      );
    }

    // Empty workout - any exercise is valid
    if (currentWorkout.length === 0) {
      return true;
    }

    // Get last muscle group
    const lastMuscleGroup = getLastMuscleGroup(currentWorkout);
    
    // Check constraint: different muscle group required
    return lastMuscleGroup !== newExercise.muscleGroup;
  }

  /**
   * Validate an entire workout list for constraint violations
   * @param {Array} exerciseList - Complete workout to validate
   * @returns {ValidationResult} - Detailed validation result
   */
  function validateWorkout(exerciseList) {
    const result = new ValidationResult();

    // Input validation
    if (!Array.isArray(exerciseList)) {
      result.addError('Workout must be an array', null, 'INVALID_INPUT');
      return result;
    }

    if (exerciseList.length === 0) {
      result.addWarning('Workout is empty');
      return result;
    }

    // Validate each exercise and check constraints
    for (let i = 0; i < exerciseList.length; i++) {
      const exercise = exerciseList[i];

      // Validate exercise structure
      if (!exercise || typeof exercise !== 'object') {
        result.addError(`Exercise at position ${i + 1} is not a valid object`, i, 'INVALID_EXERCISE');
        continue;
      }

      if (!exercise.muscleGroup || typeof exercise.muscleGroup !== 'string') {
        result.addError(`Exercise at position ${i + 1} missing or invalid muscle group`, i, 'MISSING_MUSCLE_GROUP');
        continue;
      }

      if (!exercise.name || typeof exercise.name !== 'string') {
        result.addError(`Exercise at position ${i + 1} missing or invalid name`, i, 'MISSING_NAME');
        continue;
      }

      // Check consecutive muscle group constraint (starting from second exercise)
      if (i > 0) {
        const previousExercise = exerciseList[i - 1];
        
        if (previousExercise && previousExercise.muscleGroup === exercise.muscleGroup) {
          result.addError(
            `Consecutive exercises targeting same muscle group: "${previousExercise.name}" and "${exercise.name}" both target ${exercise.muscleGroup}`,
            i,
            'CONSECUTIVE_MUSCLE_GROUP'
          );
        }
      }
    }

    // Add summary warnings for workout quality
    if (exerciseList.length < 5) {
      result.addWarning(`Workout is quite short (${exerciseList.length} exercises)`);
    }

    if (exerciseList.length > 25) {
      result.addWarning(`Workout is very long (${exerciseList.length} exercises)`);
    }

    return result;
  }

  /**
   * Check if a workout is valid (simple boolean check)
   * @param {Array} exerciseList - Workout to validate
   * @returns {boolean} - True if valid, false if any violations
   */
  function isValidWorkout(exerciseList) {
    try {
      const result = validateWorkout(exerciseList);
      return result.isValid;
    } catch (error) {
      console.error('Validation error:', error);
      return false;
    }
  }

  /**
   * Get valid exercise options that can be added to current workout
   * Filters out exercises that would violate constraints
   * @param {Array} currentWorkout - Current workout state
   * @param {Array} availableExercises - All available exercises to choose from
   * @returns {Array} - Filtered array of valid exercise options
   */
  function getValidExerciseOptions(currentWorkout, availableExercises) {
    if (!Array.isArray(currentWorkout)) {
      throw new ConstraintViolationError('Current workout must be an array', 'INVALID_INPUT');
    }

    if (!Array.isArray(availableExercises)) {
      throw new ConstraintViolationError('Available exercises must be an array', 'INVALID_INPUT');
    }

    // If workout is empty, all exercises are valid
    if (currentWorkout.length === 0) {
      return [...availableExercises];
    }

    const lastMuscleGroup = getLastMuscleGroup(currentWorkout);
    
    // Filter out exercises from the same muscle group as the last exercise
    return availableExercises.filter(exercise => {
      try {
        return canAddExercise(currentWorkout, exercise);
      } catch (error) {
        console.warn(`Skipping invalid exercise during filtering:`, exercise, error.message);
        return false;
      }
    });
  }

  /**
   * Validate if an exercise can be inserted at a specific position
   * Checks constraints with both previous and next exercises
   * @param {Array} workout - Current workout
   * @param {number} position - Position to insert (0-based index)
   * @param {Object} exercise - Exercise to insert
   * @returns {ValidationResult} - Validation result with detailed feedback
   */
  function validateExerciseInsertion(workout, position, exercise) {
    const result = new ValidationResult();

    // Input validation
    if (!Array.isArray(workout)) {
      result.addError('Workout must be an array', null, 'INVALID_INPUT');
      return result;
    }

    if (position < 0 || position > workout.length) {
      result.addError(`Invalid position ${position} (must be 0-${workout.length})`, position, 'INVALID_POSITION');
      return result;
    }

    if (!exercise || !exercise.muscleGroup) {
      result.addError('Exercise must have a valid muscle group', position, 'INVALID_EXERCISE');
      return result;
    }

    // Check constraint with previous exercise
    if (position > 0) {
      const previousExercise = workout[position - 1];
      if (previousExercise && previousExercise.muscleGroup === exercise.muscleGroup) {
        result.addError(
          `Would violate constraint with previous exercise: "${previousExercise.name}" (${previousExercise.muscleGroup})`,
          position,
          'VIOLATES_PREVIOUS'
        );
      }
    }

    // Check constraint with next exercise
    if (position < workout.length) {
      const nextExercise = workout[position];
      if (nextExercise && nextExercise.muscleGroup === exercise.muscleGroup) {
        result.addError(
          `Would violate constraint with next exercise: "${nextExercise.name}" (${nextExercise.muscleGroup})`,
          position,
          'VIOLATES_NEXT'
        );
      }
    }

    return result;
  }

  /**
   * Get constraint violation summary for user feedback
   * @param {ValidationResult} validationResult - Result from validateWorkout
   * @returns {Object} - Summary with user-friendly messages
   */
  function getViolationSummary(validationResult) {
    if (!(validationResult instanceof ValidationResult)) {
      return { hasViolations: false, message: 'Invalid validation result' };
    }

    if (validationResult.isValid) {
      return {
        hasViolations: false,
        message: 'Workout meets all constraints',
        exerciseCount: validationResult.warnings.length === 0 ? 'optimal' : 'needs attention'
      };
    }

    const consecutiveViolations = validationResult.errors.filter(e => e.violationType === 'CONSECUTIVE_MUSCLE_GROUP');
    const otherViolations = validationResult.errors.filter(e => e.violationType !== 'CONSECUTIVE_MUSCLE_GROUP');

    let message = '';
    
    if (consecutiveViolations.length > 0) {
      message += `Found ${consecutiveViolations.length} consecutive muscle group violation(s). `;
    }
    
    if (otherViolations.length > 0) {
      message += `Found ${otherViolations.length} other issue(s). `;
    }

    return {
      hasViolations: true,
      message: message.trim(),
      consecutiveViolations: consecutiveViolations.length,
      totalErrors: validationResult.errors.length,
      details: validationResult.errors.map(e => e.message)
    };
  }

  // Public API
  return {
    // Core validation functions
    canAddExercise,
    isValidWorkout,
    validateWorkout,
    
    // Utility functions
    getLastMuscleGroup,
    getValidExerciseOptions,
    validateExerciseInsertion,
    
    // User feedback
    getViolationSummary,
    
    // Classes for external use
    ConstraintViolationError,
    ValidationResult
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ConstraintValidator;
} else {
  // Browser global
  window.ConstraintValidator = ConstraintValidator;
}
