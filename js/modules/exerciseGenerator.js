/**
 * Exercise Generator Module
 * 
 * Handles workout generation with constraint validation.
 * Ensures no consecutive exercises target the same muscle group.
 * 
 * @namespace ExerciseGenerator
 */

// Use IIFE to create module namespace and prevent global pollution
const ExerciseGenerator = (() => {
    'use strict';
    
    // Private module state
    let isInitialized = false;
    let initAttempts = 0;
    
    /**
     * Check if dependencies are ready
     * @private
     */
    const checkDependencies = () => {
        // Check ExerciseDatabase
        if (typeof ExerciseDatabase === 'undefined') {
            console.log('ExerciseGenerator: ExerciseDatabase not yet available');
            return false;
        }
        
        if (typeof ExerciseDatabase.isReady !== 'function' || !ExerciseDatabase.isReady()) {
            console.log('ExerciseGenerator: ExerciseDatabase not ready');
            return false;
        }
        
        // Check Validators
        if (typeof Validators === 'undefined') {
            console.log('ExerciseGenerator: Validators not yet available');
            return false;
        }
        
        if (typeof Validators.isReady !== 'function' || !Validators.isReady()) {
            console.log('ExerciseGenerator: Validators not ready');
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
        console.log(`ExerciseGenerator: Initialization attempt ${initAttempts}`);
        
        if (!checkDependencies()) {
            if (initAttempts < 10) {
                // Retry after a short delay
                setTimeout(init, 150);
            } else {
                console.error('ExerciseGenerator: Failed to initialize after 10 attempts');
            }
            return;
        }
        
        console.log('ExerciseGenerator: Module initialized successfully');
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
     * Shuffle an array using Fisher-Yates algorithm
     * Creates a new array and does not modify the original
     * @param {Array} array - The array to shuffle
     * @returns {Array} A new shuffled array
     * @throws {Error} If input is not an array
     * @public
     */
    const shuffleArray = (array) => {
        if (!Array.isArray(array)) {
            throw new Error('ExerciseGenerator: shuffleArray requires an array input');
        }
        
        // Handle empty arrays
        if (array.length <= 1) {
            return [...array];
        }
        
        // Create a copy to avoid mutating the original
        const shuffled = [...array];
        
        // Fisher-Yates shuffle algorithm
        // Start from the last element and swap with random element before it
        for (let i = shuffled.length - 1; i > 0; i--) {
            // Generate random index from 0 to i (inclusive)
            const randomIndex = Math.floor(Math.random() * (i + 1));
            
            // Swap elements at i and randomIndex
            [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
        }
        
        return shuffled;
    };
    
    /**
     * Generate a random workout with constraint validation
     * Ensures no consecutive exercises target the same muscle group
     * @param {number} length - Number of exercises to generate (4-20)
     * @param {string[]} enabledGroups - Array of enabled muscle group identifiers
     * @returns {Array} Array of exercise objects with muscleGroup property
     * @throws {Error} If parameters are invalid or generation fails
     * @public
     */
    const generateRandomWorkout = (length, enabledGroups) => {
        if (!isInitialized) {
            throw new Error('ExerciseGenerator: Module not initialized');
        }
        
        // Validate inputs
        if (!Number.isInteger(length) || length < 4 || length > 20) {
            throw new Error('ExerciseGenerator: Workout length must be an integer between 4 and 20');
        }
        
        if (!Array.isArray(enabledGroups) || enabledGroups.length === 0) {
            throw new Error('ExerciseGenerator: Must provide at least one enabled muscle group');
        }
        
        // Validate that all enabled groups are valid muscle groups
        const validGroups = ExerciseDatabase.getAllMuscleGroups();
        for (const group of enabledGroups) {
            if (!validGroups.includes(group)) {
                throw new Error(`ExerciseGenerator: Invalid muscle group "${group}"`);
            }
        }
        
        // Check if generation is possible with current constraints
        if (enabledGroups.length === 1 && length > 1) {
            throw new Error('ExerciseGenerator: Cannot generate workout with single muscle group and multiple exercises (violates constraint)');
        }
        
        // Get all exercises from enabled muscle groups
        const exercisesByGroup = {};
        let totalAvailableExercises = 0;
        
        for (const group of enabledGroups) {
            const exercises = ExerciseDatabase.getExercisesByMuscleGroup(group);
            exercisesByGroup[group] = shuffleArray(exercises);
            totalAvailableExercises += exercises.length;
        }
        
        // Check if we have enough exercises
        if (totalAvailableExercises < length) {
            throw new Error(`ExerciseGenerator: Not enough exercises available (${totalAvailableExercises}) for requested length (${length})`);
        }
        
        // Generate workout using constraint-aware algorithm
        const workout = [];
        const usedExercises = new Set(); // Track used exercise IDs to avoid duplicates
        let attempts = 0;
        const maxAttempts = 100; // Prevent infinite loops
        
        while (workout.length < length && attempts < maxAttempts) {
            attempts++;
            
            // Get the last muscle group used (null if workout is empty)
            const lastMuscleGroup = workout.length > 0 ? workout[workout.length - 1].muscleGroup : null;
            
            // Find available muscle groups (excluding the last one used)
            const availableGroups = enabledGroups.filter(group => group !== lastMuscleGroup);
            
            // If no available groups, we have a constraint violation
            if (availableGroups.length === 0) {
                throw new Error('ExerciseGenerator: Cannot satisfy muscle group constraint with current selection');
            }
            
            // Try to find an unused exercise from available groups
            let exerciseFound = false;
            
            for (const group of shuffleArray(availableGroups)) {
                const groupExercises = exercisesByGroup[group];
                
                for (const exercise of groupExercises) {
                    if (!usedExercises.has(exercise.id)) {
                        // Found a valid exercise
                        workout.push({
                            ...exercise,
                            muscleGroup: group
                        });
                        usedExercises.add(exercise.id);
                        exerciseFound = true;
                        break;
                    }
                }
                
                if (exerciseFound) {
                    break;
                }
            }
            
            // If no exercise found, we're stuck
            if (!exerciseFound) {
                throw new Error('ExerciseGenerator: Unable to generate workout - insufficient exercise variety');
            }
        }
        
        // Final validation
        if (workout.length !== length) {
            throw new Error(`ExerciseGenerator: Generation failed - got ${workout.length} exercises, expected ${length}`);
        }
        
        // Verify constraint is satisfied
        for (let i = 1; i < workout.length; i++) {
            if (workout[i].muscleGroup === workout[i - 1].muscleGroup) {
                throw new Error('ExerciseGenerator: Constraint violation - consecutive exercises target same muscle group');
            }
        }
        
        return workout;
    };
    
    /**
     * Get valid replacement options for an exercise at a specific position
     * Returns exercises from the same muscle group that won't violate constraints
     * @param {number} workoutPosition - Index of exercise to replace (0-based)
     * @param {Array} workout - Current workout array
     * @returns {Array} Array of valid replacement exercise objects
     * @throws {Error} If position is invalid or workout is malformed
     * @public
     */
    const getReplacementOptions = (workoutPosition, workout) => {
        if (!isInitialized) {
            throw new Error('ExerciseGenerator: Module not initialized');
        }
        
        // Validate inputs
        if (!Number.isInteger(workoutPosition) || workoutPosition < 0) {
            throw new Error('ExerciseGenerator: Workout position must be a non-negative integer');
        }
        
        if (!Array.isArray(workout) || workout.length === 0) {
            throw new Error('ExerciseGenerator: Workout must be a non-empty array');
        }
        
        if (workoutPosition >= workout.length) {
            throw new Error(`ExerciseGenerator: Position ${workoutPosition} is out of bounds for workout of length ${workout.length}`);
        }
        
        // Get the current exercise at the position
        const currentExercise = workout[workoutPosition];
        if (!currentExercise || !currentExercise.muscleGroup) {
            throw new Error(`ExerciseGenerator: Invalid exercise at position ${workoutPosition}`);
        }
        
        // Get all exercises from the same muscle group
        const sameGroupExercises = ExerciseDatabase.getExercisesByMuscleGroup(currentExercise.muscleGroup);
        
        // Determine constraint restrictions
        const previousExercise = workoutPosition > 0 ? workout[workoutPosition - 1] : null;
        const nextExercise = workoutPosition < workout.length - 1 ? workout[workoutPosition + 1] : null;
        
        // Filter valid replacement options
        const validOptions = sameGroupExercises.filter(exercise => {
            // Don't include the current exercise as an option
            if (exercise.id === currentExercise.id) {
                return false;
            }
            
            // Check constraint with previous exercise
            if (previousExercise && exercise.muscleGroup === previousExercise.muscleGroup) {
                return false;
            }
            
            // Check constraint with next exercise
            if (nextExercise && exercise.muscleGroup === nextExercise.muscleGroup) {
                return false;
            }
            
            // Check if this exercise is already used elsewhere in the workout
            const exerciseAlreadyUsed = workout.some((workoutExercise, index) => 
                index !== workoutPosition && workoutExercise.id === exercise.id
            );
            
            if (exerciseAlreadyUsed) {
                return false;
            }
            
            return true;
        });
        
        // Add muscle group property to maintain consistency
        const optionsWithMuscleGroup = validOptions.map(exercise => ({
            ...exercise,
            muscleGroup: currentExercise.muscleGroup
        }));
        
        return optionsWithMuscleGroup;
    };
    
    /**
     * Replace an exercise at a specific position in the workout
     * Creates a new workout array with the exercise replaced
     * @param {Array} workout - Current workout array
     * @param {number} index - Index of exercise to replace (0-based)
     * @param {Object} newExercise - New exercise object to insert
     * @returns {Array} New workout array with exercise replaced
     * @throws {Error} If replacement would violate constraints or inputs are invalid
     * @public
     */
    const replaceExercise = (workout, index, newExercise) => {
        if (!isInitialized) {
            throw new Error('ExerciseGenerator: Module not initialized');
        }
        
        // Validate inputs
        if (!Array.isArray(workout) || workout.length === 0) {
            throw new Error('ExerciseGenerator: Workout must be a non-empty array');
        }
        
        if (!Number.isInteger(index) || index < 0 || index >= workout.length) {
            throw new Error(`ExerciseGenerator: Index ${index} is out of bounds for workout of length ${workout.length}`);
        }
        
        if (!newExercise || typeof newExercise !== 'object') {
            throw new Error('ExerciseGenerator: New exercise must be a valid object');
        }
        
        if (!newExercise.id || !newExercise.name || !newExercise.muscleGroup) {
            throw new Error('ExerciseGenerator: New exercise must have id, name, and muscleGroup properties');
        }
        
        // Validate that the new exercise is a valid exercise from the database
        const exerciseFromDatabase = ExerciseDatabase.getExerciseById(newExercise.id);
        if (!exerciseFromDatabase) {
            throw new Error(`ExerciseGenerator: Exercise with id "${newExercise.id}" not found in database`);
        }
        
        // Get the current exercise at the position
        const currentExercise = workout[index];
        if (!currentExercise || !currentExercise.muscleGroup) {
            throw new Error(`ExerciseGenerator: Invalid exercise at position ${index}`);
        }
        
        // Check if the new exercise is from the same muscle group
        if (newExercise.muscleGroup !== currentExercise.muscleGroup) {
            throw new Error(`ExerciseGenerator: New exercise muscle group "${newExercise.muscleGroup}" does not match current exercise muscle group "${currentExercise.muscleGroup}"`);
        }
        
        // Check if the new exercise is already used elsewhere in the workout
        const exerciseAlreadyUsed = workout.some((workoutExercise, workoutIndex) => 
            workoutIndex !== index && workoutExercise.id === newExercise.id
        );
        
        if (exerciseAlreadyUsed) {
            throw new Error(`ExerciseGenerator: Exercise "${newExercise.name}" is already used in the workout`);
        }
        
        // Create new workout array with the exercise replaced
        const newWorkout = [...workout];
        newWorkout[index] = { ...newExercise };
        
        // Validate constraints are maintained
        // Check constraint with previous exercise
        if (index > 0) {
            const previousExercise = newWorkout[index - 1];
            if (previousExercise.muscleGroup === newExercise.muscleGroup) {
                throw new Error(`ExerciseGenerator: Replacement would create consecutive exercises targeting "${newExercise.muscleGroup}"`);
            }
        }
        
        // Check constraint with next exercise
        if (index < newWorkout.length - 1) {
            const nextExercise = newWorkout[index + 1];
            if (nextExercise.muscleGroup === newExercise.muscleGroup) {
                throw new Error(`ExerciseGenerator: Replacement would create consecutive exercises targeting "${newExercise.muscleGroup}"`);
            }
        }
        
        // Final validation - check entire workout for constraint violations
        for (let i = 1; i < newWorkout.length; i++) {
            if (newWorkout[i].muscleGroup === newWorkout[i - 1].muscleGroup) {
                throw new Error('ExerciseGenerator: Replacement resulted in constraint violation');
            }
        }
        
        return newWorkout;
    };
    
    // Public API - All core functions are now implemented with comprehensive validation
    const publicAPI = {
        isReady,
        shuffleArray,
        generateRandomWorkout,
        getReplacementOptions,
        replaceExercise
    };
    
    // Auto-initialize when module loads
    init();
    
    // Return public interface
    return publicAPI;
    
})();

// Verify module loaded correctly
if (typeof ExerciseGenerator === 'undefined') {
    throw new Error('ExerciseGenerator module failed to load');
}

// Optional: Add to global scope for debugging (remove in production)
if (typeof window !== 'undefined') {
    window.ExerciseGenerator = ExerciseGenerator;
}
