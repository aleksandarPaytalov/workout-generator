/**
 * Exercise Generator Tests
 * 
 * Comprehensive unit tests for the ExerciseGenerator module
 */

describe('ExerciseGenerator', () => {
    
    // Sample exercises for testing
    let sampleExercises;
    
    before(() => {
        // Ensure dependencies are ready
        if (!ExerciseGenerator.isReady()) {
            throw new Error('ExerciseGenerator module is not ready for testing');
        }
        
        if (!ExerciseDatabase.isReady()) {
            throw new Error('ExerciseDatabase dependency is not ready');
        }
        
        if (!Validators.isReady()) {
            throw new Error('Validators dependency is not ready');
        }
        
        // Create sample exercises for testing
        sampleExercises = {
            chest1: { id: 'chest_001', name: 'Push-ups', muscleGroup: 'chest' },
            chest2: { id: 'chest_002', name: 'Bench Press', muscleGroup: 'chest' },
            chest3: { id: 'chest_003', name: 'Dips', muscleGroup: 'chest' },
            back1: { id: 'back_001', name: 'Pull-ups', muscleGroup: 'back' },
            back2: { id: 'back_002', name: 'Rows', muscleGroup: 'back' },
            back3: { id: 'back_003', name: 'Lat Pulldowns', muscleGroup: 'back' },
            legs1: { id: 'legs_001', name: 'Squats', muscleGroup: 'legs' },
            legs2: { id: 'legs_002', name: 'Lunges', muscleGroup: 'legs' },
            arms1: { id: 'arms_001', name: 'Bicep Curls', muscleGroup: 'arms' },
            arms2: { id: 'arms_002', name: 'Tricep Dips', muscleGroup: 'arms' },
            core1: { id: 'core_001', name: 'Plank', muscleGroup: 'core' },
            shoulders1: { id: 'shoulders_001', name: 'Shoulder Press', muscleGroup: 'shoulders' }
        };
    });

    describe('Module Initialization', () => {
        
        it('should be properly initialized', () => {
            assert.isTrue(ExerciseGenerator.isReady());
        });

        it('should expose all required public methods', () => {
            const requiredMethods = [
                'isReady',
                'shuffleArray',
                'generateRandomWorkout',
                'getReplacementOptions',
                'replaceExercise'
            ];

            requiredMethods.forEach(method => {
                assert.isFunction(ExerciseGenerator[method], `Method ${method} should be a function`);
            });
        });
    });

    describe('shuffleArray', () => {
        
        it('should return shuffled array with same elements', () => {
            const originalArray = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const shuffled = ExerciseGenerator.shuffleArray(originalArray);
            
            assert.isArray(shuffled, 'Should return an array');
            assert.hasLength(shuffled, originalArray.length, 'Should have same length');
            
            // Should contain all original elements
            originalArray.forEach(element => {
                assert.contains(shuffled, element, `Should contain element ${element}`);
            });
        });

        it('should not modify the original array', () => {
            const originalArray = [1, 2, 3, 4, 5];
            const originalCopy = [...originalArray];
            
            const shuffled = ExerciseGenerator.shuffleArray(originalArray);
            
            assert.deepEqual(originalArray, originalCopy, 'Original array should not be modified');
            assert.isFalse(shuffled === originalArray, 'Should return a new array');
        });

        it('should handle empty array', () => {
            const emptyArray = [];
            const shuffled = ExerciseGenerator.shuffleArray(emptyArray);
            
            assert.isArray(shuffled);
            assert.hasLength(shuffled, 0);
        });

        it('should handle single element array', () => {
            const singleElement = [42];
            const shuffled = ExerciseGenerator.shuffleArray(singleElement);
            
            assert.deepEqual(shuffled, singleElement);
        });

        it('should produce different results on multiple calls', () => {
            const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
            const results = [];
            
            // Generate multiple shuffles
            for (let i = 0; i < 20; i++) {
                results.push(ExerciseGenerator.shuffleArray(array));
            }
            
            // At least some results should be different (extremely unlikely to all be the same)
            const uniqueResults = results.filter((result, index) => 
                !results.slice(0, index).some(prev => JSON.stringify(prev) === JSON.stringify(result))
            );
            
            assert.isTrue(uniqueResults.length > 1, 'Should produce different shuffles');
        });

        it('should throw error for non-array input', () => {
            assert.throws(() => {
                ExerciseGenerator.shuffleArray('not an array');
            }, 'shuffleArray requires an array input');

            assert.throws(() => {
                ExerciseGenerator.shuffleArray(null);
            }, 'shuffleArray requires an array input');

            assert.throws(() => {
                ExerciseGenerator.shuffleArray(undefined);
            }, 'shuffleArray requires an array input');
        });

        it('should handle arrays with complex objects', () => {
            const exercises = [sampleExercises.chest1, sampleExercises.back1, sampleExercises.legs1];
            const shuffled = ExerciseGenerator.shuffleArray(exercises);
            
            assert.hasLength(shuffled, 3);
            exercises.forEach(exercise => {
                const found = shuffled.find(ex => ex.id === exercise.id);
                assert.isNotNull(found, `Should contain exercise ${exercise.id}`);
            });
        });
    });

    describe('generateRandomWorkout', () => {
        
        it('should generate workout with correct length', () => {
            const lengths = [4, 6, 8, 10, 12, 15, 20];
            const enabledGroups = ['chest', 'back', 'legs'];
            
            lengths.forEach(length => {
                const workout = ExerciseGenerator.generateRandomWorkout(length, enabledGroups);
                assert.hasLength(workout, length, `Should generate ${length} exercises`);
            });
        });

        it('should generate workout with valid constraint', () => {
            const workout = ExerciseGenerator.generateRandomWorkout(10, ['chest', 'back', 'legs', 'arms']);
            
            assert.isTrue(Validators.isValidWorkout(workout), 'Generated workout should be valid');
            
            // Check that no consecutive exercises have same muscle group
            for (let i = 1; i < workout.length; i++) {
                assert.isFalse(workout[i].muscleGroup === workout[i-1].muscleGroup, 
                    `Exercises at positions ${i-1} and ${i} should not have same muscle group`);
            }
        });

        it('should only use exercises from enabled muscle groups', () => {
            const enabledGroups = ['chest', 'back'];
            const workout = ExerciseGenerator.generateRandomWorkout(8, enabledGroups);
            
            workout.forEach((exercise, index) => {
                assert.contains(enabledGroups, exercise.muscleGroup, 
                    `Exercise ${index} should be from enabled muscle groups`);
            });
        });

        it('should generate different workouts on multiple calls', () => {
            const enabledGroups = ['chest', 'back', 'legs', 'arms'];
            const workouts = [];
            
            for (let i = 0; i < 10; i++) {
                workouts.push(ExerciseGenerator.generateRandomWorkout(6, enabledGroups));
            }
            
            // At least some workouts should be different
            const uniqueWorkouts = workouts.filter((workout, index) => 
                !workouts.slice(0, index).some(prev => 
                    JSON.stringify(prev) === JSON.stringify(workout)
                )
            );
            
            assert.isTrue(uniqueWorkouts.length > 1, 'Should generate different workouts');
        });

        it('should use unique exercises (no duplicates)', () => {
            const workout = ExerciseGenerator.generateRandomWorkout(10, ['chest', 'back', 'legs', 'arms']);
            
            const exerciseIds = workout.map(ex => ex.id);
            const uniqueIds = [...new Set(exerciseIds)];
            
            assert.strictEqual(exerciseIds.length, uniqueIds.length, 
                'All exercises should be unique');
        });

        it('should validate input parameters', () => {
            const validGroups = ['chest', 'back'];
            
            // Invalid length
            assert.throws(() => {
                ExerciseGenerator.generateRandomWorkout(3, validGroups);
            }, 'Workout length must be an integer between 4 and 20');

            assert.throws(() => {
                ExerciseGenerator.generateRandomWorkout(21, validGroups);
            }, 'Workout length must be an integer between 4 and 20');

            assert.throws(() => {
                ExerciseGenerator.generateRandomWorkout(5.5, validGroups);
            }, 'Workout length must be an integer between 4 and 20');

            // Invalid muscle groups
            assert.throws(() => {
                ExerciseGenerator.generateRandomWorkout(5, []);
            }, 'Must provide at least one enabled muscle group');

            assert.throws(() => {
                ExerciseGenerator.generateRandomWorkout(5, null);
            }, 'Must provide at least one enabled muscle group');

            assert.throws(() => {
                ExerciseGenerator.generateRandomWorkout(5, ['invalid']);
            }, 'Invalid muscle group');
        });

        it('should handle constraint impossible scenarios', () => {
            // Single muscle group with multiple exercises should fail
            assert.throws(() => {
                ExerciseGenerator.generateRandomWorkout(5, ['chest']);
            }, 'Cannot generate workout with single muscle group and multiple exercises');
        });

        it('should work with all available muscle groups', () => {
            const allGroups = ExerciseDatabase.getAllMuscleGroups();
            const workout = ExerciseGenerator.generateRandomWorkout(12, allGroups);
            
            assert.hasLength(workout, 12);
            assert.isTrue(Validators.isValidWorkout(workout));
            
            // Should use exercises from multiple groups
            const usedGroups = [...new Set(workout.map(ex => ex.muscleGroup))];
            assert.isTrue(usedGroups.length > 1, 'Should use exercises from multiple groups');
        });
    });

    describe('getReplacementOptions', () => {
        
        it('should return exercises from same muscle group', () => {
            const workout = [sampleExercises.chest1, sampleExercises.back1, sampleExercises.legs1];
            const options = ExerciseGenerator.getReplacementOptions(0, workout);
            
            // All options should be chest exercises (same as position 0)
            options.forEach(option => {
                assert.strictEqual(option.muscleGroup, 'chest', 
                    'All replacement options should be from same muscle group');
            });
        });

        it('should exclude current exercise from options', () => {
            const workout = [sampleExercises.chest1, sampleExercises.back1];
            const options = ExerciseGenerator.getReplacementOptions(0, workout);
            
            // Should not include the current exercise
            const hasCurrentExercise = options.some(option => option.id === sampleExercises.chest1.id);
            assert.isFalse(hasCurrentExercise, 'Should not include current exercise');
        });

        it('should exclude exercises that would violate constraints', () => {
            // Workout: chest -> back -> legs
            // Replacing middle (back) with another back exercise should be fine
            // But if previous or next were also back, options would be limited
            const workout = [
                sampleExercises.chest1,
                sampleExercises.back1,  // Position 1 - replacing this
                sampleExercises.chest2  // Next is chest, so back replacements are OK
            ];
            
            const options = ExerciseGenerator.getReplacementOptions(1, workout);
            
            // All options should be back exercises
            options.forEach(option => {
                assert.strictEqual(option.muscleGroup, 'back');
            });
        });

        it('should handle constraint violations with adjacent exercises', () => {
            // Create scenario where replacement would create constraint violation
            const workout = [
                sampleExercises.back1,   // Previous is back
                sampleExercises.chest1,  // Position 1 - replacing this
                sampleExercises.back2    // Next is back
            ];
            
            // Replacing chest exercise should return chest options
            // because back would violate constraint with adjacent back exercises
            const options = ExerciseGenerator.getReplacementOptions(1, workout);
            
            options.forEach(option => {
                assert.strictEqual(option.muscleGroup, 'chest', 
                    'Should only return chest exercises to avoid constraint violation');
            });
        });

        it('should exclude already used exercises', () => {
            const workout = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.chest2,  // Already using chest2
                sampleExercises.legs1
            ];
            
            // Get replacement options for position 0 (chest1)
            const options = ExerciseGenerator.getReplacementOptions(0, workout);
            
            // Should not include chest2 since it's already used at position 2
            const hasChest2 = options.some(option => option.id === sampleExercises.chest2.id);
            assert.isFalse(hasChest2, 'Should not include already used exercises');
            
            // Should not include chest1 (current exercise)
            const hasChest1 = options.some(option => option.id === sampleExercises.chest1.id);
            assert.isFalse(hasChest1, 'Should not include current exercise');
        });

        it('should validate input parameters', () => {
            const workout = [sampleExercises.chest1, sampleExercises.back1];
            
            // Invalid position
            assert.throws(() => {
                ExerciseGenerator.getReplacementOptions(-1, workout);
            }, 'Workout position must be a non-negative integer');

            assert.throws(() => {
                ExerciseGenerator.getReplacementOptions(2, workout);
            }, 'Position 2 is out of bounds');

            assert.throws(() => {
                ExerciseGenerator.getReplacementOptions(1.5, workout);
            }, 'Workout position must be a non-negative integer');

            // Invalid workout
            assert.throws(() => {
                ExerciseGenerator.getReplacementOptions(0, []);
            }, 'Workout must be a non-empty array');

            assert.throws(() => {
                ExerciseGenerator.getReplacementOptions(0, null);
            }, 'Workout must be a non-empty array');

            assert.throws(() => {
                ExerciseGenerator.getReplacementOptions(0, [null]);
            }, 'Invalid exercise at position');
        });

        it('should work at different positions', () => {
            const workout = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.legs1,
                sampleExercises.arms1
            ];
            
            // Test replacement options for each position
            for (let i = 0; i < workout.length; i++) {
                const options = ExerciseGenerator.getReplacementOptions(i, workout);
                const expectedMuscleGroup = workout[i].muscleGroup;
                
                assert.isArray(options, `Position ${i} should return array`);
                options.forEach(option => {
                    assert.strictEqual(option.muscleGroup, expectedMuscleGroup, 
                        `Position ${i} options should match muscle group`);
                });
            }
        });
    });

    describe('replaceExercise', () => {
        
        it('should replace exercise at specified position', () => {
            const originalWorkout = [sampleExercises.chest1, sampleExercises.back1, sampleExercises.legs1];
            const newExercise = sampleExercises.chest2;
            
            const newWorkout = ExerciseGenerator.replaceExercise(originalWorkout, 0, newExercise);
            
            assert.hasLength(newWorkout, 3, 'Should maintain workout length');
            assert.strictEqual(newWorkout[0].id, newExercise.id, 'Should replace exercise at position 0');
            assert.strictEqual(newWorkout[1].id, sampleExercises.back1.id, 'Should keep other exercises unchanged');
            assert.strictEqual(newWorkout[2].id, sampleExercises.legs1.id, 'Should keep other exercises unchanged');
        });

        it('should not modify original workout', () => {
            const originalWorkout = [sampleExercises.chest1, sampleExercises.back1];
            const originalCopy = [...originalWorkout];
            
            const newWorkout = ExerciseGenerator.replaceExercise(originalWorkout, 0, sampleExercises.chest2);
            
            assert.deepEqual(originalWorkout, originalCopy, 'Original workout should not be modified');
            assert.isFalse(newWorkout === originalWorkout, 'Should return new array');
        });

        it('should maintain constraint validity', () => {
            const workout = [sampleExercises.chest1, sampleExercises.back1, sampleExercises.legs1];
            const newExercise = sampleExercises.chest3;
            
            const newWorkout = ExerciseGenerator.replaceExercise(workout, 0, newExercise);
            
            assert.isTrue(Validators.isValidWorkout(newWorkout), 'Replaced workout should be valid');
        });

        it('should prevent constraint violations', () => {
            const workout = [sampleExercises.chest1, sampleExercises.back1, sampleExercises.legs1];
            
            // Try to replace back exercise with chest (would violate constraint with adjacent chest)
            assert.throws(() => {
                ExerciseGenerator.replaceExercise(workout, 1, sampleExercises.chest2);
            }, 'Replacement would create consecutive exercises');
        });

        it('should prevent duplicate exercises', () => {
            const workout = [sampleExercises.chest1, sampleExercises.back1, sampleExercises.legs1];
            
            // Try to replace with exercise already in workout
            assert.throws(() => {
                ExerciseGenerator.replaceExercise(workout, 0, sampleExercises.back1);
            }, 'is already used in the workout');
        });

        it('should validate muscle group matching', () => {
            const workout = [sampleExercises.chest1, sampleExercises.back1];
            
            // Try to replace chest exercise with back exercise
            assert.throws(() => {
                ExerciseGenerator.replaceExercise(workout, 0, sampleExercises.back2);
            }, 'does not match current exercise muscle group');
        });

        it('should validate exercise exists in database', () => {
            const workout = [sampleExercises.chest1, sampleExercises.back1];
            const fakeExercise = { id: 'fake_001', name: 'Fake Exercise', muscleGroup: 'chest' };
            
            assert.throws(() => {
                ExerciseGenerator.replaceExercise(workout, 0, fakeExercise);
            }, 'not found in database');
        });

        it('should validate input parameters', () => {
            const workout = [sampleExercises.chest1, sampleExercises.back1];
            
            // Invalid workout
            assert.throws(() => {
                ExerciseGenerator.replaceExercise([], 0, sampleExercises.chest2);
            }, 'Workout must be a non-empty array');

            assert.throws(() => {
                ExerciseGenerator.replaceExercise(null, 0, sampleExercises.chest2);
            }, 'Workout must be a non-empty array');

            // Invalid index
            assert.throws(() => {
                ExerciseGenerator.replaceExercise(workout, -1, sampleExercises.chest2);
            }, 'out of bounds');

            assert.throws(() => {
                ExerciseGenerator.replaceExercise(workout, 2, sampleExercises.chest2);
            }, 'out of bounds');

            assert.throws(() => {
                ExerciseGenerator.replaceExercise(workout, 1.5, sampleExercises.chest2);
            }, 'out of bounds');

            // Invalid new exercise
            assert.throws(() => {
                ExerciseGenerator.replaceExercise(workout, 0, null);
            }, 'New exercise must be a valid object');

            assert.throws(() => {
                ExerciseGenerator.replaceExercise(workout, 0, {});
            }, 'must have id, name, and muscleGroup properties');

            assert.throws(() => {
                ExerciseGenerator.replaceExercise(workout, 0, { id: 'test', name: 'Test' });
            }, 'must have id, name, and muscleGroup properties');
        });

        it('should work at different positions', () => {
            const workout = [
                sampleExercises.chest1,
                sampleExercises.back1,
                sampleExercises.legs1,
                sampleExercises.arms1
            ];
            
            // Replace at each position
            const replacements = [
                sampleExercises.chest2,
                sampleExercises.back2,
                sampleExercises.legs2,
                sampleExercises.arms2
            ];
            
            for (let i = 0; i < workout.length; i++) {
                const newWorkout = ExerciseGenerator.replaceExercise(workout, i, replacements[i]);
                
                assert.hasLength(newWorkout, workout.length);
                assert.strictEqual(newWorkout[i].id, replacements[i].id, 
                    `Should replace exercise at position ${i}`);
                assert.isTrue(Validators.isValidWorkout(newWorkout), 
                    `Workout should be valid after replacing position ${i}`);
            }
        });
    });

    describe('Edge Cases and Performance', () => {
        
        it('should handle minimum workout length', () => {
            const workout = ExerciseGenerator.generateRandomWorkout(4, ['chest', 'back', 'legs']);
            
            assert.hasLength(workout, 4);
            assert.isTrue(Validators.isValidWorkout(workout));
        });

        it('should handle maximum workout length', () => {
            const allGroups = ExerciseDatabase.getAllMuscleGroups();
            const workout = ExerciseGenerator.generateRandomWorkout(20, allGroups);
            
            assert.hasLength(workout, 20);
            assert.isTrue(Validators.isValidWorkout(workout));
        });

        it('should generate workout efficiently for large requests', () => {
            const startTime = performance.now();
            const workout = ExerciseGenerator.generateRandomWorkout(20, ['chest', 'back', 'legs', 'arms']);
            const endTime = performance.now();
            
            assert.isTrue(endTime - startTime < 500, 'Should generate large workout quickly');
            assert.hasLength(workout, 20);
            assert.isTrue(Validators.isValidWorkout(workout));
        });

        it('should handle repeated operations without memory leaks', () => {
            // Generate many workouts to test for memory leaks
            for (let i = 0; i < 100; i++) {
                const workout = ExerciseGenerator.generateRandomWorkout(8, ['chest', 'back', 'legs']);
                assert.hasLength(workout, 8);
                assert.isTrue(Validators.isValidWorkout(workout));
            }
        });

        it('should maintain randomness across sessions', () => {
            // Generate workouts and check they use different exercises
            const workouts = [];
            for (let i = 0; i < 5; i++) {
                workouts.push(ExerciseGenerator.generateRandomWorkout(6, ['chest', 'back', 'legs', 'arms']));
            }
            
            // Check that not all workouts start with the same exercise
            const firstExercises = workouts.map(w => w[0].id);
            const uniqueFirstExercises = [...new Set(firstExercises)];
            
            assert.isTrue(uniqueFirstExercises.length > 1, 
                'Should produce different starting exercises');
        });
    });
});
