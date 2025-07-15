/**
 * Exercise Database Module
 * 
 * Provides access to exercise data organized by muscle groups.
 * Implements constraint validation for workout generation.
 * 
 * @namespace ExerciseDatabase
 */

// Use IIFE (Immediately Invoked Function Expression) to create module namespace
// This prevents global pollution while allowing controlled access
const ExerciseDatabase = (() => {
    'use strict';
    
    // Private module state - only accessible within this closure
    let isInitialized = false;
    
    /**
     * Muscle group constants
     * These define the six primary muscle categories for exercise classification
     * @constant {Object}
     * @private
     */
    const MUSCLE_GROUPS = Object.freeze({
        CHEST: 'chest',
        BACK: 'back', 
        LEGS: 'legs',
        SHOULDERS: 'shoulders',
        ARMS: 'arms',
        CORE: 'core'
    });
    
    /**
     * Array of all valid muscle group values
     * Used for validation and iteration
     * @constant {string[]}
     * @private
     */
    const MUSCLE_GROUP_LIST = Object.freeze([
        MUSCLE_GROUPS.CHEST,
        MUSCLE_GROUPS.BACK,
        MUSCLE_GROUPS.LEGS,
        MUSCLE_GROUPS.SHOULDERS,
        MUSCLE_GROUPS.ARMS,
        MUSCLE_GROUPS.CORE
    ]);
    
    /**
     * Human-readable muscle group labels
     * Used for UI display and user-facing text
     * @constant {Object}
     * @private
     */
    const MUSCLE_GROUP_LABELS = Object.freeze({
        [MUSCLE_GROUPS.CHEST]: 'Chest',
        [MUSCLE_GROUPS.BACK]: 'Back',
        [MUSCLE_GROUPS.LEGS]: 'Legs', 
        [MUSCLE_GROUPS.SHOULDERS]: 'Shoulders',
        [MUSCLE_GROUPS.ARMS]: 'Arms',
        [MUSCLE_GROUPS.CORE]: 'Core'
    });
    
    /**
     * Complete exercise database organized by muscle groups
     * Each exercise includes name and unique identifier
     * @constant {Object}
     * @private
     */
    const EXERCISE_DATABASE = Object.freeze({
        [MUSCLE_GROUPS.CHEST]: Object.freeze([
            { id: 'chest_001', name: 'Push-ups' },
            { id: 'chest_002', name: 'Bench Press' },
            { id: 'chest_003', name: 'Incline Bench Press' },
            { id: 'chest_004', name: 'Decline Bench Press' },
            { id: 'chest_005', name: 'Dumbbell Flyes' },
            { id: 'chest_006', name: 'Incline Dumbbell Press' },
            { id: 'chest_007', name: 'Decline Dumbbell Press' },
            { id: 'chest_008', name: 'Cable Crossovers' },
            { id: 'chest_009', name: 'Dips' },
            { id: 'chest_010', name: 'Diamond Push-ups' },
            { id: 'chest_011', name: 'Wide Grip Push-ups' },
            { id: 'chest_012', name: 'Incline Push-ups' },
            { id: 'chest_013', name: 'Decline Push-ups' },
            { id: 'chest_014', name: 'Chest Press Machine' },
            { id: 'chest_015', name: 'Pec Deck Machine' },
            { id: 'chest_016', name: 'Cable Chest Press' },
            { id: 'chest_017', name: 'Dumbbell Pullovers' },
            { id: 'chest_018', name: 'Landmine Press' },
            { id: 'chest_019', name: 'Single Arm Dumbbell Press' },
            { id: 'chest_020', name: 'Resistance Band Chest Press' },
            { id: 'chest_021', name: 'Wall Push-ups' },
            { id: 'chest_022', name: 'Archer Push-ups' }
        ]),
        
        [MUSCLE_GROUPS.BACK]: Object.freeze([
            { id: 'back_001', name: 'Pull-ups' },
            { id: 'back_002', name: 'Chin-ups' },
            { id: 'back_003', name: 'Lat Pulldowns' },
            { id: 'back_004', name: 'Barbell Rows' },
            { id: 'back_005', name: 'Dumbbell Rows' },
            { id: 'back_006', name: 'T-Bar Rows' },
            { id: 'back_007', name: 'Cable Rows' },
            { id: 'back_008', name: 'Deadlifts' },
            { id: 'back_009', name: 'Romanian Deadlifts' },
            { id: 'back_010', name: 'Sumo Deadlifts' },
            { id: 'back_011', name: 'Single Arm Dumbbell Rows' },
            { id: 'back_012', name: 'Inverted Rows' },
            { id: 'back_013', name: 'Face Pulls' },
            { id: 'back_014', name: 'Reverse Flyes' },
            { id: 'back_015', name: 'Shrugs' },
            { id: 'back_016', name: 'Wide Grip Pull-ups' },
            { id: 'back_017', name: 'Neutral Grip Pull-ups' },
            { id: 'back_018', name: 'Hyperextensions' },
            { id: 'back_019', name: 'Good Mornings' },
            { id: 'back_020', name: 'Rack Pulls' },
            { id: 'back_021', name: 'Superman' },
            { id: 'back_022', name: 'Resistance Band Rows' }
        ]),
        
        [MUSCLE_GROUPS.LEGS]: Object.freeze([
            { id: 'legs_001', name: 'Squats' },
            { id: 'legs_002', name: 'Lunges' },
            { id: 'legs_003', name: 'Bulgarian Split Squats' },
            { id: 'legs_004', name: 'Leg Press' },
            { id: 'legs_005', name: 'Leg Curls' },
            { id: 'legs_006', name: 'Leg Extensions' },
            { id: 'legs_007', name: 'Calf Raises' },
            { id: 'legs_008', name: 'Jump Squats' },
            { id: 'legs_009', name: 'Step-ups' },
            { id: 'legs_010', name: 'Wall Sits' },
            { id: 'legs_011', name: 'Goblet Squats' },
            { id: 'legs_012', name: 'Sumo Squats' },
            { id: 'legs_013', name: 'Single Leg Deadlifts' },
            { id: 'legs_014', name: 'Walking Lunges' },
            { id: 'legs_015', name: 'Reverse Lunges' },
            { id: 'legs_016', name: 'Side Lunges' },
            { id: 'legs_017', name: 'Pistol Squats' },
            { id: 'legs_018', name: 'Box Jumps' },
            { id: 'legs_019', name: 'Glute Bridges' },
            { id: 'legs_020', name: 'Hip Thrusts' },
            { id: 'legs_021', name: 'Seated Calf Raises' },
            { id: 'legs_022', name: 'Donkey Calf Raises' }
        ]),
        
        [MUSCLE_GROUPS.SHOULDERS]: Object.freeze([
            { id: 'shoulders_001', name: 'Shoulder Press' },
            { id: 'shoulders_002', name: 'Dumbbell Shoulder Press' },
            { id: 'shoulders_003', name: 'Military Press' },
            { id: 'shoulders_004', name: 'Lateral Raises' },
            { id: 'shoulders_005', name: 'Front Raises' },
            { id: 'shoulders_006', name: 'Rear Delt Flyes' },
            { id: 'shoulders_007', name: 'Arnold Press' },
            { id: 'shoulders_008', name: 'Pike Push-ups' },
            { id: 'shoulders_009', name: 'Handstand Push-ups' },
            { id: 'shoulders_010', name: 'Upright Rows' },
            { id: 'shoulders_011', name: 'Cable Lateral Raises' },
            { id: 'shoulders_012', name: 'Cable Front Raises' },
            { id: 'shoulders_013', name: 'Cable Rear Delt Flyes' },
            { id: 'shoulders_014', name: 'Seated Shoulder Press' },
            { id: 'shoulders_015', name: 'Single Arm Shoulder Press' },
            { id: 'shoulders_016', name: 'Reverse Flyes' },
            { id: 'shoulders_017', name: 'Face Pulls' },
            { id: 'shoulders_018', name: 'Overhead Carry' },
            { id: 'shoulders_019', name: 'Y-Raises' },
            { id: 'shoulders_020', name: 'T-Raises' },
            { id: 'shoulders_021', name: 'Cuban Press' },
            { id: 'shoulders_022', name: 'Band Pull-Aparts' }
        ]),
        
        [MUSCLE_GROUPS.ARMS]: Object.freeze([
            { id: 'arms_001', name: 'Bicep Curls' },
            { id: 'arms_002', name: 'Hammer Curls' },
            { id: 'arms_003', name: 'Tricep Dips' },
            { id: 'arms_004', name: 'Tricep Extensions' },
            { id: 'arms_005', name: 'Close-Grip Push-ups' },
            { id: 'arms_006', name: 'Preacher Curls' },
            { id: 'arms_007', name: 'Cable Curls' },
            { id: 'arms_008', name: 'Cable Tricep Pushdowns' },
            { id: 'arms_009', name: 'Overhead Tricep Extension' },
            { id: 'arms_010', name: 'Concentration Curls' },
            { id: 'arms_011', name: 'Zottman Curls' },
            { id: 'arms_012', name: 'Diamond Push-ups' },
            { id: 'arms_013', name: '21s Bicep Curls' },
            { id: 'arms_014', name: 'Skull Crushers' },
            { id: 'arms_015', name: 'Incline Bicep Curls' },
            { id: 'arms_016', name: 'Decline Tricep Extensions' },
            { id: 'arms_017', name: 'Cable Hammer Curls' },
            { id: 'arms_018', name: 'Single Arm Tricep Extension' },
            { id: 'arms_019', name: 'Resistance Band Curls' },
            { id: 'arms_020', name: 'Tricep Kickbacks' },
            { id: 'arms_021', name: 'Cross Body Hammer Curls' },
            { id: 'arms_022', name: 'JM Press' }
        ]),
        
        [MUSCLE_GROUPS.CORE]: Object.freeze([
            { id: 'core_001', name: 'Plank' },
            { id: 'core_002', name: 'Crunches' },
            { id: 'core_003', name: 'Russian Twists' },
            { id: 'core_004', name: 'Mountain Climbers' },
            { id: 'core_005', name: 'Bicycle Crunches' },
            { id: 'core_006', name: 'Dead Bug' },
            { id: 'core_007', name: 'Bird Dog' },
            { id: 'core_008', name: 'Side Plank' },
            { id: 'core_009', name: 'Leg Raises' },
            { id: 'core_010', name: 'Hanging Knee Raises' },
            { id: 'core_011', name: 'Ab Wheel Rollouts' },
            { id: 'core_012', name: 'Hollow Body Hold' },
            { id: 'core_013', name: 'V-Ups' },
            { id: 'core_014', name: 'Reverse Crunches' },
            { id: 'core_015', name: 'Flutter Kicks' },
            { id: 'core_016', name: 'Scissor Kicks' },
            { id: 'core_017', name: 'Woodchoppers' },
            { id: 'core_018', name: 'Cable Crunches' },
            { id: 'core_019', name: 'Medicine Ball Slams' },
            { id: 'core_020', name: 'Pallof Press' },
            { id: 'core_021', name: 'Bear Crawl' },
            { id: 'core_022', name: 'Turkish Get-Ups' }
        ])
    });
    
    /**
     * Initialize the module
     * Called automatically when module loads
     * @private
     */
    const init = () => {
        if (isInitialized) {
            console.warn('ExerciseDatabase: Module already initialized');
            return;
        }
        
        // Validate muscle group constants are properly defined
        if (MUSCLE_GROUP_LIST.length !== 6) {
            throw new Error('ExerciseDatabase: Invalid muscle group configuration');
        }
        
        // Validate exercise database structure
        let totalExercises = 0;
        for (const muscleGroup of MUSCLE_GROUP_LIST) {
            const exercises = EXERCISE_DATABASE[muscleGroup];
            if (!Array.isArray(exercises)) {
                throw new Error(`ExerciseDatabase: Missing exercises for muscle group "${muscleGroup}"`);
            }
            if (exercises.length < 20) {
                throw new Error(`ExerciseDatabase: Insufficient exercises for muscle group "${muscleGroup}" (${exercises.length} < 20)`);
            }
            
            // Validate exercise structure
            for (const exercise of exercises) {
                if (!exercise.id || !exercise.name) {
                    throw new Error(`ExerciseDatabase: Invalid exercise structure in "${muscleGroup}"`);
                }
                if (typeof exercise.id !== 'string' || typeof exercise.name !== 'string') {
                    throw new Error(`ExerciseDatabase: Exercise properties must be strings in "${muscleGroup}"`);
                }
            }
            
            totalExercises += exercises.length;
        }
        
        console.log(`ExerciseDatabase: Module initialized with ${MUSCLE_GROUP_LIST.length} muscle groups and ${totalExercises} total exercises`);
        isInitialized = true;
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
     * Validate if a string is a valid muscle group
     * @param {string} muscleGroup - The muscle group to validate
     * @returns {boolean} True if valid muscle group
     * @public
     */
    const isValidMuscleGroup = (muscleGroup) => {
        if (typeof muscleGroup !== 'string') {
            return false;
        }
        return MUSCLE_GROUP_LIST.includes(muscleGroup.toLowerCase());
    };
    
    /**
     * Get all available muscle groups
     * @returns {string[]} Array of muscle group identifiers
     * @public
     */
    const getAllMuscleGroups = () => {
        if (!isInitialized) {
            throw new Error('ExerciseDatabase: Module not initialized');
        }
        // Return a copy to prevent external modification
        return [...MUSCLE_GROUP_LIST];
    };
    
    /**
     * Get human-readable label for a muscle group
     * @param {string} muscleGroup - The muscle group identifier
     * @returns {string} Human-readable label
     * @throws {Error} If muscle group is invalid
     * @public
     */
    const getMuscleGroupLabel = (muscleGroup) => {
        if (!isValidMuscleGroup(muscleGroup)) {
            throw new Error(`ExerciseDatabase: Invalid muscle group "${muscleGroup}"`);
        }
        return MUSCLE_GROUP_LABELS[muscleGroup.toLowerCase()];
    };
    
    /**
     * Get all exercises for a specific muscle group
     * @param {string} muscleGroup - The muscle group identifier
     * @returns {Array} Array of exercise objects {id, name}
     * @throws {Error} If muscle group is invalid or module not initialized
     * @public
     */
    const getExercisesByMuscleGroup = (muscleGroup) => {
        if (!isInitialized) {
            throw new Error('ExerciseDatabase: Module not initialized');
        }
        
        if (!isValidMuscleGroup(muscleGroup)) {
            throw new Error(`ExerciseDatabase: Invalid muscle group "${muscleGroup}"`);
        }
        
        const normalizedGroup = muscleGroup.toLowerCase();
        // Return defensive copy to prevent external modification
        return EXERCISE_DATABASE[normalizedGroup].map(exercise => ({ ...exercise }));
    };
    
    /**
     * Get all exercises from all muscle groups
     * @returns {Array} Array of exercise objects with muscleGroup property added
     * @throws {Error} If module not initialized
     * @public
     */
    const getAllExercises = () => {
        if (!isInitialized) {
            throw new Error('ExerciseDatabase: Module not initialized');
        }
        
        const allExercises = [];
        for (const muscleGroup of MUSCLE_GROUP_LIST) {
            const exercises = EXERCISE_DATABASE[muscleGroup];
            for (const exercise of exercises) {
                allExercises.push({
                    ...exercise,
                    muscleGroup: muscleGroup
                });
            }
        }
        
        return allExercises;
    };
    
    /**
     * Find an exercise by its unique ID
     * @param {string} exerciseId - The exercise ID to search for
     * @returns {Object|null} Exercise object with muscleGroup property, or null if not found
     * @public
     */
    const getExerciseById = (exerciseId) => {
        if (!isInitialized) {
            throw new Error('ExerciseDatabase: Module not initialized');
        }
        
        if (typeof exerciseId !== 'string') {
            return null;
        }
        
        for (const muscleGroup of MUSCLE_GROUP_LIST) {
            const exercise = EXERCISE_DATABASE[muscleGroup].find(ex => ex.id === exerciseId);
            if (exercise) {
                return {
                    ...exercise,
                    muscleGroup: muscleGroup
                };
            }
        }
        
        return null;
    };
    
    /**
     * Get the count of exercises for a specific muscle group
     * @param {string} muscleGroup - The muscle group identifier
     * @returns {number} Number of exercises in the muscle group
     * @throws {Error} If muscle group is invalid or module not initialized
     * @public
     */
    const getExerciseCount = (muscleGroup) => {
        if (!isInitialized) {
            throw new Error('ExerciseDatabase: Module not initialized');
        }
        
        if (!isValidMuscleGroup(muscleGroup)) {
            throw new Error(`ExerciseDatabase: Invalid muscle group "${muscleGroup}"`);
        }
        
        const normalizedGroup = muscleGroup.toLowerCase();
        return EXERCISE_DATABASE[normalizedGroup].length;
    };
    
    /**
     * Get statistics about the exercise database
     * @returns {Object} Database statistics
     * @public
     */
    const getDatabaseStats = () => {
        if (!isInitialized) {
            throw new Error('ExerciseDatabase: Module not initialized');
        }
        
        const stats = {
            muscleGroupCount: MUSCLE_GROUP_LIST.length,
            totalExercises: 0,
            exercisesByGroup: {}
        };
        
        for (const muscleGroup of MUSCLE_GROUP_LIST) {
            const count = EXERCISE_DATABASE[muscleGroup].length;
            stats.exercisesByGroup[muscleGroup] = count;
            stats.totalExercises += count;
        }
        
        return stats;
    };
    
    // Public API - these functions will be exposed to other modules
    const publicAPI = {
        isReady,
        isValidMuscleGroup,
        getAllMuscleGroups,
        getMuscleGroupLabel,
        getExercisesByMuscleGroup,
        getAllExercises,
        getExerciseById,
        getExerciseCount,
        getDatabaseStats
        // Additional public methods will be added in subsequent steps
    };
    
    // Auto-initialize when module loads
    init();
    
    // Return public interface
    return publicAPI;
    
})();

// Verify module loaded correctly
if (typeof ExerciseDatabase === 'undefined') {
    throw new Error('ExerciseDatabase module failed to load');
}

// Optional: Add to global scope for debugging (remove in production)
if (typeof window !== 'undefined') {
    window.ExerciseDatabase = ExerciseDatabase;
}
