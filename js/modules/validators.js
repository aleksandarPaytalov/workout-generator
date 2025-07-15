/**
 * Validators Module
 * 
 * Handles constraint validation for workout generation.
 * Core constraint: No two consecutive exercises can target the same muscle group.
 * 
 * @namespace Validators
 */

// Use IIFE (Immediately Invoked Function Expression) to create module namespace
// This prevents global pollution while allowing controlled access
const Validators = (() => {
    'use strict';
    
    // Private module state - only accessible within this closure
    let isInitialized = false;
    
    /**
     * Validate exercise object structure
     * Internal utility for consistent exercise validation
     * @param {*} exercise - Object to validate as exercise
     * @param {string} context - Context description for error messages
     * @throws {Error} If exercise is invalid
     * @private
     */
    const validateExerciseObject = (exercise, context = 'exercise') => {
        if (!exercise || typeof exercise !== 'object') {
            throw new Error(`Validators: ${context} must be a valid object`);
        }
        
        if (!exercise.muscleGroup || typeof exercise.muscleGroup !== 'string') {
            throw new Error(`Validators: ${context} must have a muscleGroup property (string)`);
        }
        
        if (!exercise.id || typeof exercise.id !== 'string') {
            throw new Error(`Validators: ${context} must have an id property (string)`);
        }
        
        if (!exercise.name || typeof exercise.name !== 'string') {
            throw new Error(`Validators: ${context} must have a name property (string)`);
        }
        
        // Validate muscle group is recognized by ExerciseDatabase
        if (!ExerciseDatabase.isValidMuscleGroup(exercise.muscleGroup)) {
            throw new Error(`Validators: Invalid muscle group "${exercise.muscleGroup}" in ${context}`);
        }
    };
    
    /**
     * Validate workout array structure
     * Internal utility for consistent workout validation
     * @param {*} workout - Array to validate as workout
     * @param {string} context - Context description for error messages
     * @throws {Error} If workout array is invalid
     * @private
     */
    const validateWorkoutArray = (workout, context = 'workout') => {
        if (!Array.isArray(workout)) {
            throw new Error(`Validators: ${context} must be an array`);
        }
        
        // Validate each exercise in the workout
        for (let i = 0; i < workout.length; i++) {
            try {
                validateExerciseObject(workout[i], `exercise at index ${i} in ${context}`);
            } catch (error) {
                // Re-throw with enhanced context
                throw new Error(`Validators: ${error.message}`);
            }
        }
    };
    
    /**
     * Safe wrapper for catching and re-throwing validation errors
     * Ensures consistent error formatting across the module
     * @param {Function} validationFunction - Function to execute
     * @param {string} functionName - Name of calling function for context
     * @returns {*} Result of validation function
     * @throws {Error} Enhanced error with function context
     * @private
     */
    const safeValidation = (validationFunction, functionName) => {
        try {
            return validationFunction();
        } catch (error) {
            // Add function context to error message if not already present
            const errorMessage = error.message.includes('Validators:') 
                ? error.message 
                : `Validators: ${functionName} - ${error.message}`;
            throw new Error(errorMessage);
        }
    };
    
    /**
     * Initialize the module
     * Called automatically when module loads
     * @private
     */
    const init = () => {
        if (isInitialized) {
            console.warn('Validators: Module already initialized');
            return;
        }
        
        // Check that ExerciseDatabase dependency is available
        if (typeof ExerciseDatabase === 'undefined') {
            throw new Error('Validators: ExerciseDatabase dependency not found');
        }
        
        if (!ExerciseDatabase.isReady()) {
            throw new Error('Validators: ExerciseDatabase dependency not ready');
        }
        
        console.log('Validators: Module initialized successfully');
        isInitialized = true;
        
        // Run edge case tests to verify module integrity
        const testResults = verifyEdgeCases();
        const totalTests = Object.keys(testResults).length;
        const passedTests = Object.values(testResults).filter(result => result === true).length;
        
        if (passedTests === totalTests) {
            console.log(`Validators: All ${totalTests} edge case tests passed ✅`);
        } else {
            console.warn(`Validators: ${passedTests}/${totalTests} edge case tests passed ⚠️`);
        }
    };
    
    /**
     * Check if module is properly initialized
     * @returns {boolean} True if module is ready to use
     * @public
     */
    const isReady = () => {
        return isInitialized;
    };
    
    /**
     * Check if a new exercise can be added to the current workout without violating constraints
     * Core constraint: No two consecutive exercises can target the same muscle group
     * 
     * @param {Array} currentWorkout - Array of exercise objects currently in the workout
     * @param {Object} newExercise - Exercise object to potentially add
     * @returns {boolean} True if exercise can be added, false if it violates constraints
     * @throws {Error} If module not initialized or invalid inputs
     * @public
     */
    const canAddExercise = (currentWorkout, newExercise) => {
        if (!isInitialized) {
            throw new Error('Validators: Module not initialized');
        }
        
        return safeValidation(() => {
            // Validate inputs using utility functions
            validateWorkoutArray(currentWorkout, 'currentWorkout');
            validateExerciseObject(newExercise, 'newExercise');
            
            // If workout is empty, any exercise can be added
            if (currentWorkout.length === 0) {
                return true;
            }
            
            // Get the last exercise in the current workout
            const lastExercise = currentWorkout[currentWorkout.length - 1];
            
            // Check constraint: new exercise muscle group must be different from last exercise
            const lastMuscleGroup = lastExercise.muscleGroup.toLowerCase();
            const newMuscleGroup = newExercise.muscleGroup.toLowerCase();
            
            return lastMuscleGroup !== newMuscleGroup;
        }, 'canAddExercise');
    };
    
    /**
     * Validate that an entire workout follows the muscle group constraint
     * Checks that no two consecutive exercises target the same muscle group
     * 
     * @param {Array} exerciseList - Array of exercise objects to validate
     * @returns {boolean} True if workout is valid, false if constraint violations exist
     * @throws {Error} If module not initialized or invalid inputs
     * @public
     */
    const isValidWorkout = (exerciseList) => {
        if (!isInitialized) {
            throw new Error('Validators: Module not initialized');
        }
        
        return safeValidation(() => {
            // Validate input using utility function
            validateWorkoutArray(exerciseList, 'exerciseList');
            
            // Empty or single-exercise workouts are always valid
            if (exerciseList.length <= 1) {
                return true;
            }
            
            // Check each consecutive pair of exercises
            for (let i = 0; i < exerciseList.length - 1; i++) {
                const currentExercise = exerciseList[i];
                const nextExercise = exerciseList[i + 1];
                
                // Check constraint: consecutive exercises must have different muscle groups
                const currentMuscleGroup = currentExercise.muscleGroup.toLowerCase();
                const nextMuscleGroup = nextExercise.muscleGroup.toLowerCase();
                
                if (currentMuscleGroup === nextMuscleGroup) {
                    // Constraint violation found - return false immediately
                    return false;
                }
            }
            
            // All consecutive pairs checked - workout is valid
            return true;
        }, 'isValidWorkout');
    };
    
    /**
     * Get the muscle group of the last exercise in a workout list
     * Utility function for determining what muscle groups are valid for next exercise
     * 
     * @param {Array} exerciseList - Array of exercise objects
     * @returns {string|null} Muscle group of last exercise, or null if list is empty
     * @throws {Error} If module not initialized or invalid inputs
     * @public
     */
    const getLastMuscleGroup = (exerciseList) => {
        if (!isInitialized) {
            throw new Error('Validators: Module not initialized');
        }
        
        return safeValidation(() => {
            // Validate input type
            if (!Array.isArray(exerciseList)) {
                throw new Error('exerciseList must be an array');
            }
            
            // Return null for empty workout
            if (exerciseList.length === 0) {
                return null;
            }
            
            // Get and validate the last exercise using utility function
            const lastExercise = exerciseList[exerciseList.length - 1];
            validateExerciseObject(lastExercise, 'last exercise in list');
            
            // Return normalized muscle group
            return lastExercise.muscleGroup.toLowerCase();
        }, 'getLastMuscleGroup');
    };
    
    /**
     * Filter available exercises to only include those that can be added to current workout
     * Uses the constraint validation to determine which exercises are valid
     * 
     * @param {Array} currentWorkout - Array of exercise objects currently in the workout
     * @param {Array} availableExercises - Array of exercise objects to filter from
     * @returns {Array} Filtered array of exercises that can be added without constraint violations
     * @throws {Error} If module not initialized or invalid inputs
     * @public
     */
    const getValidExerciseOptions = (currentWorkout, availableExercises) => {
        if (!isInitialized) {
            throw new Error('Validators: Module not initialized');
        }
        
        return safeValidation(() => {
            // Validate inputs using utility functions
            validateWorkoutArray(currentWorkout, 'currentWorkout');
            
            if (!Array.isArray(availableExercises)) {
                throw new Error('availableExercises must be an array');
            }
            
            // If no available exercises, return empty array
            if (availableExercises.length === 0) {
                return [];
            }
            
            // If workout is empty, all exercises are valid (but validate structure first)
            if (currentWorkout.length === 0) {
                const validExercises = [];
                for (const exercise of availableExercises) {
                    try {
                        validateExerciseObject(exercise, 'available exercise');
                        validExercises.push({ ...exercise });
                    } catch (error) {
                        console.warn(`Validators: Skipping invalid exercise: ${error.message}`);
                    }
                }
                return validExercises;
            }
            
            // Filter exercises using the canAddExercise validation function
            const validExercises = [];
            
            for (const exercise of availableExercises) {
                try {
                    // Validate exercise structure first
                    validateExerciseObject(exercise, 'available exercise');
                    
                    // Check if this exercise can be added to the current workout
                    if (canAddExercise(currentWorkout, exercise)) {
                        // Add defensive copy to prevent external modification
                        validExercises.push({ ...exercise });
                    }
                } catch (error) {
                    // Log validation errors but continue filtering
                    console.warn(`Validators: Skipping invalid exercise during filtering: ${error.message}`);
                    continue;
                }
            }
            
            return validExercises;
        }, 'getValidExerciseOptions');
    };
    
    // Public API - these functions will be exposed to other modules
    const publicAPI = {
        isReady,
        canAddExercise,
        isValidWorkout,
        getLastMuscleGroup,
        getValidExerciseOptions,
        runEdgeCaseTests
    };
    
    // Auto-initialize when module loads
    init();
    
    // Return public interface
    return publicAPI;
    
})();

// Verify module loaded correctly
if (typeof Validators === 'undefined') {
    throw new Error('Validators module failed to load');
}

// Optional: Add to global scope for debugging (remove in production)
if (typeof window !== 'undefined') {
    window.Validators = Validators;
}
