/**
 * Validators Module
 * 
 * Handles constraint validation for workout generation.
 * Ensures no consecutive exercises target the same muscle group.
 * 
 * @namespace Validators
 */

// Use IIFE to create module namespace and prevent global pollution
const Validators = (() => {
    'use strict';
    
    // Private module state
    let isInitialized = false;
    let initAttempts = 0;
    
    /**
     * Check if dependencies are ready
     * @private
     */
    const checkDependencies = () => {
        // Check if ExerciseDatabase is available and ready
        if (typeof ExerciseDatabase === 'undefined') {
            console.log('Validators: ExerciseDatabase not yet available');
            return false;
        }
        
        if (typeof ExerciseDatabase.isReady !== 'function') {
            console.log('Validators: ExerciseDatabase missing isReady method');
            return false;
        }
        
        if (!ExerciseDatabase.isReady()) {
            console.log('Validators: ExerciseDatabase not ready');
            return false;
        }
        
        return true;
    };
    
    /**
     * Initialize the module
     * Called automatically when module loads and can be retried
     * @private
     */
    const init = () => {
        if (isInitialized) {
            return;
        }
        
        initAttempts++;
        console.log(`Validators: Initialization attempt ${initAttempts}`);
        
        if (!checkDependencies()) {
            if (initAttempts < 10) {
                // Retry after a short delay
                setTimeout(init, 100);
            } else {
                console.error('Validators: Failed to initialize after 10 attempts');
            }
            return;
        }
        
        console.log('Validators: Module initialized successfully');
        isInitialized = true;
    };
    
    /**
     * Check if module is properly initialized
     * @returns {boolean} True if module is ready to use
     * @public
     */
    const isReady = () => {
        if (!isInitialized && initAttempts < 10) {
            init();
        }
        return isInitialized;
    };
    
    /**
     * Check if an exercise can be added to the current workout without violating constraints
     * @param {Array} currentWorkout - Current workout array
     * @param {Object} newExercise - Exercise to potentially add
     * @returns {boolean} True if exercise can be added safely
     * @public
     */
    const canAddExercise = (currentWorkout, newExercise) => {
        if (!isInitialized) {
            throw new Error('Validators: Module not initialized');
        }
        
        // Validate inputs
        if (!Array.isArray(currentWorkout)) {
            throw new Error('Validators: currentWorkout must be an array');
        }
        
        if (!newExercise || typeof newExercise !== 'object') {
            throw new Error('Validators: newExercise must be a valid object');
        }
        
        if (!newExercise.muscleGroup) {
            throw new Error('Validators: newExercise must have a muscleGroup property');
        }
        
        // If workout is empty, any exercise can be added
        if (currentWorkout.length === 0) {
            return true;
        }
        
        // Get the last exercise in the workout
        const lastExercise = currentWorkout[currentWorkout.length - 1];
        
        // Check if the new exercise targets the same muscle group as the last one
        if (lastExercise.muscleGroup === newExercise.muscleGroup) {
            return false; // Would violate constraint
        }
        
        return true; // Safe to add
    };
    
    /**
     * Validate if an entire workout satisfies the constraint rules
     * @param {Array} exerciseList - Complete workout array to validate
     * @returns {boolean} True if workout is valid
     * @public
     */
    const isValidWorkout = (exerciseList) => {
        if (!isInitialized) {
            throw new Error('Validators: Module not initialized');
        }
        
        // Validate input
        if (!Array.isArray(exerciseList)) {
            throw new Error('Validators: exerciseList must be an array');
        }
        
        // Empty workout is technically valid
        if (exerciseList.length === 0) {
            return true;
        }
        
        // Single exercise workout is always valid
        if (exerciseList.length === 1) {
            return true;
        }
        
        // Check each consecutive pair for constraint violation
        for (let i = 1; i < exerciseList.length; i++) {
            const currentExercise = exerciseList[i];
            const previousExercise = exerciseList[i - 1];
            
            // Validate exercise structure
            if (!currentExercise || !currentExercise.muscleGroup) {
                throw new Error(`Validators: Invalid exercise at position ${i}`);
            }
            
            if (!previousExercise || !previousExercise.muscleGroup) {
                throw new Error(`Validators: Invalid exercise at position ${i - 1}`);
            }
            
            // Check for constraint violation
            if (currentExercise.muscleGroup === previousExercise.muscleGroup) {
                return false; // Constraint violated
            }
        }
        
        return true; // All constraints satisfied
    };
    
    /**
     * Get the muscle group of the last exercise in a workout
     * @param {Array} exerciseList - Workout array
     * @returns {string|null} Muscle group of last exercise, or null if empty
     * @public
     */
    const getLastMuscleGroup = (exerciseList) => {
        if (!isInitialized) {
            throw new Error('Validators: Module not initialized');
        }
        
        // Validate input
        if (!Array.isArray(exerciseList)) {
            throw new Error('Validators: exerciseList must be an array');
        }
        
        // Return null for empty workout
        if (exerciseList.length === 0) {
            return null;
        }
        
        const lastExercise = exerciseList[exerciseList.length - 1];
        
        // Validate last exercise structure
        if (!lastExercise || !lastExercise.muscleGroup) {
            throw new Error('Validators: Invalid last exercise in workout');
        }
        
        return lastExercise.muscleGroup;
    };
    
    /**
     * Filter exercises to only include those that can be safely added to current workout
     * @param {Array} currentWorkout - Current workout array
     * @param {Array} availableExercises - Array of exercises to filter
     * @returns {Array} Filtered array of valid exercise options
     * @public
     */
    const getValidExerciseOptions = (currentWorkout, availableExercises) => {
        if (!isInitialized) {
            throw new Error('Validators: Module not initialized');
        }
        
        // Validate inputs
        if (!Array.isArray(currentWorkout)) {
            throw new Error('Validators: currentWorkout must be an array');
        }
        
        if (!Array.isArray(availableExercises)) {
            throw new Error('Validators: availableExercises must be an array');
        }
        
        // Filter exercises that can be safely added
        const validOptions = availableExercises.filter(exercise => {
            try {
                return canAddExercise(currentWorkout, exercise);
            } catch (error) {
                // If validation fails, exclude this exercise
                console.warn(`Validators: Excluding invalid exercise: ${error.message}`);
                return false;
            }
        });
        
        return validOptions;
    };
    
    /**
     * Get statistics about constraint violations in a workout
     * @param {Array} exerciseList - Workout array to analyze
     * @returns {Object} Statistics object with violation details
     * @public
     */
    const getConstraintStats = (exerciseList) => {
        if (!isInitialized) {
            throw new Error('Validators: Module not initialized');
        }
        
        // Validate input
        if (!Array.isArray(exerciseList)) {
            throw new Error('Validators: exerciseList must be an array');
        }
        
        const stats = {
            totalExercises: exerciseList.length,
            violations: 0,
            violationPositions: [],
            isValid: true,
            muscleGroupDistribution: {}
        };
        
        // Count muscle group distribution
        exerciseList.forEach((exercise, index) => {
            if (exercise && exercise.muscleGroup) {
                const group = exercise.muscleGroup;
                stats.muscleGroupDistribution[group] = (stats.muscleGroupDistribution[group] || 0) + 1;
            }
        });
        
        // Check for violations
        for (let i = 1; i < exerciseList.length; i++) {
            const currentExercise = exerciseList[i];
            const previousExercise = exerciseList[i - 1];
            
            if (currentExercise && previousExercise && 
                currentExercise.muscleGroup === previousExercise.muscleGroup) {
                stats.violations++;
                stats.violationPositions.push(i);
                stats.isValid = false;
            }
        }
        
        return stats;
    };
    
    // Public API - expose these functions to other modules
    const publicAPI = {
        isReady,
        canAddExercise,
        isValidWorkout,
        getLastMuscleGroup,
        getValidExerciseOptions,
        getConstraintStats
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
