/**
 * Validators Tests
 * 
 * Comprehensive unit tests for the Validators module
 */

describe('Validators', () => {
    
    // Sample exercises for testing
    let sampleExercises;
    
    before(() => {
        // Ensure dependencies are ready
        if (!Validators.isReady()) {
            throw new Error('Validators module is not ready for testing');
        }
        
        if (!ExerciseDatabase.isReady()) {
            throw new Error('ExerciseDatabase dependency is not ready for testing');
        }
        
        // Create sample exercises for testing
        sampleExercises = {
            chest1: { id: 'chest_001', name: 'Push-ups', muscleGroup: 'chest' },
            chest2: { id: 'chest_002', name: 'Bench Press', muscleGroup: 'chest' },
            back1: { id: 'back_001', name: 'Pull-ups', muscleGroup: 'back' },
            back2: { id: 'back_002', name: 'Rows', muscleGroup: 'back' },
            legs1: { id: 'legs_001', name: 'Squats', muscleGroup: 'legs' },
            arms1: { id: 'arms_001', name: 'Bicep Curls', muscleGroup: 'arms' },
            core1: { id: 'core_001', name: 'Plank', muscleGroup: 'core' }
        };
    });

    describe('Module Initialization', () => {
        
        it('should be properly initialized', () => {
            assert.isTrue(Validators.isReady());
        });

        it('should expose all required public methods', () => {
            const requiredMethods = [
                'isReady',
                'canAddExercise',
                'isValidWorkout',
                'getLastMuscleGroup',
                'getValidExerciseOptions',
                'getConstraintStats'
            ];

            requiredMethods.forEach(method => {
                assert.isFunction(Validators[method], `Method ${method} should be a function`);
            });
        });
    });

    describe('canAddExercise', () => {
        
        it('should allow adding first exercise to empty workout', () => {
            const emptyWorkout = [];
            const result = Validators.canAddExercise(emptyWorkout, sampleExercises.chest1);
            
            assert.isTrue(result, 'Should allow adding first exercise to empty workout');
        });

        it('should allow adding exercise with different muscle group', () => {
            const workout = [sampleExercises.chest1];
            const result = Validators.canAddExercise(workout, sampleExercises.back1);
            
            assert.isTrue(result, 'Should allow adding exercise with different muscle group');
        });

        it('should prevent adding exercise with same muscle group as last', () => {
            const workout = [sampleExercises.chest1];
            const result = Validators.canAddExercise(workout, sampleExercises.chest2);
            
            assert.isFalse(result, 'Should prevent adding exercise with same muscle group as last');
        });

        it('should work with longer workout sequences', () => {
            const workout = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.legs1
            ];
            
            // Should allow different muscle group
            assert.isTrue(Validators.canAddExercise(workout, sampleExercises.arms1), 
                'Should allow adding different muscle group');
            
            // Should prevent same muscle group as last
            assert.isFalse(Validators.canAddExercise(workout, sampleExercises.chest1), 
                'Should prevent adding same muscle group as last');
        });

        it('should throw error for invalid inputs', () => {
            assert.throws(() => {
                Validators.canAddExercise('not an array', sampleExercises.chest1);
            }, 'currentWorkout must be an array');

            assert.throws(() => {
                Validators.canAddExercise([], null);
            }, 'newExercise must be a valid object');

            assert.throws(() => {
                Validators.canAddExercise([], {});
            }, 'newExercise must have a muscleGroup property');

            assert.throws(() => {
                Validators.canAddExercise([], { name: 'Test' });
            }, 'newExercise must have a muscleGroup property');
        });
    });

    describe('isValidWorkout', () => {
        
        it('should validate empty workout as valid', () => {
            assert.isTrue(Validators.isValidWorkout([]), 'Empty workout should be valid');
        });

        it('should validate single exercise workout as valid', () => {
            const workout = [sampleExercises.chest1];
            assert.isTrue(Validators.isValidWorkout(workout), 'Single exercise workout should be valid');
        });

        it('should validate workout with no consecutive same muscle groups', () => {
            const validWorkout = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.legs1,
                sampleExercises.arms1,
                sampleExercises.core1
            ];
            
            assert.isTrue(Validators.isValidWorkout(validWorkout), 
                'Workout with no consecutive same muscle groups should be valid');
        });

        it('should reject workout with consecutive same muscle groups', () => {
            const invalidWorkout = [
                sampleExercises.chest1,
                sampleExercises.chest2,  // Same as previous
                sampleExercises.back1
            ];
            
            assert.isFalse(Validators.isValidWorkout(invalidWorkout), 
                'Workout with consecutive same muscle groups should be invalid');
        });

        it('should detect violation at any position', () => {
            // Violation at beginning
            const invalidAtStart = [
                sampleExercises.chest1,
                sampleExercises.chest2
            ];
            assert.isFalse(Validators.isValidWorkout(invalidAtStart), 
                'Should detect violation at start');

            // Violation in middle
            const invalidInMiddle = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.back2,  // Same as previous
                sampleExercises.legs1
            ];
            assert.isFalse(Validators.isValidWorkout(invalidInMiddle), 
                'Should detect violation in middle');

            // Violation at end
            const invalidAtEnd = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.legs1,
                sampleExercises.chest2,
                sampleExercises.chest1   // Same as previous
            ];
            assert.isFalse(Validators.isValidWorkout(invalidAtEnd), 
                'Should detect violation at end');
        });

        it('should throw error for invalid inputs', () => {
            assert.throws(() => {
                Validators.isValidWorkout('not an array');
            }, 'exerciseList must be an array');

            assert.throws(() => {
                Validators.isValidWorkout([null]);
            }, 'Invalid exercise at position');

            assert.throws(() => {
                Validators.isValidWorkout([{}]);
            }, 'Invalid exercise at position');

            assert.throws(() => {
                Validators.isValidWorkout([{ name: 'Test' }]);
            }, 'Invalid exercise at position');
        });
    });

    describe('getLastMuscleGroup', () => {
        
        it('should return null for empty workout', () => {
            const result = Validators.getLastMuscleGroup([]);
            assert.isNull(result, 'Should return null for empty workout');
        });

        it('should return muscle group of last exercise', () => {
            const workout = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.legs1
            ];
            
            const result = Validators.getLastMuscleGroup(workout);
            assert.strictEqual(result, 'legs', 'Should return muscle group of last exercise');
        });

        it('should work with single exercise workout', () => {
            const workout = [sampleExercises.arms1];
            const result = Validators.getLastMuscleGroup(workout);
            assert.strictEqual(result, 'arms', 'Should return muscle group of single exercise');
        });

        it('should throw error for invalid inputs', () => {
            assert.throws(() => {
                Validators.getLastMuscleGroup('not an array');
            }, 'exerciseList must be an array');

            assert.throws(() => {
                Validators.getLastMuscleGroup([null]);
            }, 'Invalid last exercise');

            assert.throws(() => {
                Validators.getLastMuscleGroup([{}]);
            }, 'Invalid last exercise');
        });
    });

    describe('getValidExerciseOptions', () => {
        
        it('should return all exercises for empty workout', () => {
            const allExercises = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.legs1
            ];
            
            const validOptions = Validators.getValidExerciseOptions([], allExercises);
            
            assert.deepEqual(validOptions, allExercises, 
                'Should return all exercises for empty workout');
        });

        it('should filter out exercises with same muscle group as last', () => {
            const workout = [sampleExercises.chest1];
            const availableExercises = [
                sampleExercises.chest2,  // Should be filtered out
                sampleExercises.back1,   // Should be included
                sampleExercises.legs1    // Should be included
            ];
            
            const validOptions = Validators.getValidExerciseOptions(workout, availableExercises);
            
            assert.hasLength(validOptions, 2, 'Should filter out chest exercise');
            assert.contains(validOptions, sampleExercises.back1);
            assert.contains(validOptions, sampleExercises.legs1);
            
            // Ensure chest exercise is not included
            const hasChestExercise = validOptions.some(ex => ex.muscleGroup === 'chest');
            assert.isFalse(hasChestExercise, 'Should not include chest exercises');
        });

        it('should handle complex workout sequences', () => {
            const workout = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.legs1
            ];
            
            const availableExercises = [
                sampleExercises.chest2,  // Should be included (different from last)
                sampleExercises.back2,   // Should be included (different from last)
                sampleExercises.legs1,   // Should be filtered out (same as last)
                sampleExercises.arms1    // Should be included (different from last)
            ];
            
            const validOptions = Validators.getValidExerciseOptions(workout, availableExercises);
            
            // Should exclude legs exercises
            const hasLegsExercise = validOptions.some(ex => ex.muscleGroup === 'legs');
            assert.isFalse(hasLegsExercise, 'Should not include legs exercises');
            
            // Should include others
            assert.isTrue(validOptions.some(ex => ex.muscleGroup === 'chest'), 'Should include chest');
            assert.isTrue(validOptions.some(ex => ex.muscleGroup === 'back'), 'Should include back');
            assert.isTrue(validOptions.some(ex => ex.muscleGroup === 'arms'), 'Should include arms');
        });

        it('should handle invalid exercises gracefully', () => {
            const workout = [sampleExercises.chest1];
            const availableExercises = [
                sampleExercises.back1,
                null,  // Invalid exercise
                { name: 'Invalid' },  // Missing muscleGroup
                sampleExercises.legs1
            ];
            
            const validOptions = Validators.getValidExerciseOptions(workout, availableExercises);
            
            // Should only include valid exercises
            assert.hasLength(validOptions, 2);
            assert.contains(validOptions, sampleExercises.back1);
            assert.contains(validOptions, sampleExercises.legs1);
        });

        it('should throw error for invalid inputs', () => {
            assert.throws(() => {
                Validators.getValidExerciseOptions('not an array', []);
            }, 'currentWorkout must be an array');

            assert.throws(() => {
                Validators.getValidExerciseOptions([], 'not an array');
            }, 'availableExercises must be an array');
        });
    });

    describe('getConstraintStats', () => {
        
        it('should provide stats for empty workout', () => {
            const stats = Validators.getConstraintStats([]);
            
            assert.strictEqual(stats.totalExercises, 0);
            assert.strictEqual(stats.violations, 0);
            assert.hasLength(stats.violationPositions, 0);
            assert.isTrue(stats.isValid);
            assert.deepEqual(stats.muscleGroupDistribution, {});
        });

        it('should provide stats for valid workout', () => {
            const validWorkout = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.legs1,
                sampleExercises.arms1
            ];
            
            const stats = Validators.getConstraintStats(validWorkout);
            
            assert.strictEqual(stats.totalExercises, 4);
            assert.strictEqual(stats.violations, 0);
            assert.hasLength(stats.violationPositions, 0);
            assert.isTrue(stats.isValid);
            
            // Check muscle group distribution
            assert.strictEqual(stats.muscleGroupDistribution.chest, 1);
            assert.strictEqual(stats.muscleGroupDistribution.back, 1);
            assert.strictEqual(stats.muscleGroupDistribution.legs, 1);
            assert.strictEqual(stats.muscleGroupDistribution.arms, 1);
        });

        it('should detect violations and provide detailed stats', () => {
            const invalidWorkout = [
                sampleExercises.chest1,
                sampleExercises.chest2,  // Violation at position 1
                sampleExercises.back1,
                sampleExercises.back2,   // Violation at position 3
                sampleExercises.legs1
            ];
            
            const stats = Validators.getConstraintStats(invalidWorkout);
            
            assert.strictEqual(stats.totalExercises, 5);
            assert.strictEqual(stats.violations, 2);
            assert.deepEqual(stats.violationPositions, [1, 3]);
            assert.isFalse(stats.isValid);
            
            // Check muscle group distribution
            assert.strictEqual(stats.muscleGroupDistribution.chest, 2);
            assert.strictEqual(stats.muscleGroupDistribution.back, 2);
            assert.strictEqual(stats.muscleGroupDistribution.legs, 1);
        });

        it('should handle workout with multiple same muscle groups correctly', () => {
            const workout = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.chest2,  // Valid - not consecutive
                sampleExercises.legs1,
                sampleExercises.back2    // Valid - not consecutive
            ];
            
            const stats = Validators.getConstraintStats(workout);
            
            assert.strictEqual(stats.totalExercises, 5);
            assert.strictEqual(stats.violations, 0);
            assert.hasLength(stats.violationPositions, 0);
            assert.isTrue(stats.isValid);
            
            // Check distribution
            assert.strictEqual(stats.muscleGroupDistribution.chest, 2);
            assert.strictEqual(stats.muscleGroupDistribution.back, 2);
            assert.strictEqual(stats.muscleGroupDistribution.legs, 1);
        });

        it('should throw error for invalid input', () => {
            assert.throws(() => {
                Validators.getConstraintStats('not an array');
            }, 'exerciseList must be an array');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        
        it('should handle workouts with missing exercise properties', () => {
            const workoutWithInvalidExercise = [
                sampleExercises.chest1,
                { id: 'test', name: 'Test' }, // Missing muscleGroup
                sampleExercises.back1
            ];
            
            assert.throws(() => {
                Validators.isValidWorkout(workoutWithInvalidExercise);
            }, 'Invalid exercise');
        });

        it('should be consistent across multiple calls', () => {
            const workout = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.legs1
            ];
            
            // Call multiple times and ensure consistent results
            const results = [];
            for (let i = 0; i < 10; i++) {
                results.push(Validators.isValidWorkout(workout));
            }
            
            // All results should be the same
            results.forEach(result => {
                assert.strictEqual(result, results[0], 'Results should be consistent');
            });
        });

        it('should handle large workout arrays efficiently', () => {
            // Create a large valid workout
            const largeWorkout = [];
            const exercises = [sampleExercises.chest1, sampleExercises.back1];
            
            for (let i = 0; i < 1000; i++) {
                largeWorkout.push(exercises[i % 2]);
            }
            
            const startTime = performance.now();
            const isValid = Validators.isValidWorkout(largeWorkout);
            const endTime = performance.now();
            
            assert.isTrue(isValid, 'Large workout should be valid');
            assert.isTrue(endTime - startTime < 100, 'Should process large workout quickly');
        });

        it('should maintain immutability of input arrays', () => {
            const originalWorkout = [sampleExercises.chest1, sampleExercises.back1];
            const workoutCopy = [...originalWorkout];
            
            // Call validators methods
            Validators.isValidWorkout(originalWorkout);
            Validators.getLastMuscleGroup(originalWorkout);
            Validators.canAddExercise(originalWorkout, sampleExercises.legs1);
            
            // Original array should be unchanged
            assert.deepEqual(originalWorkout, workoutCopy, 
                'Input workout should not be modified');
        });
    });
});
