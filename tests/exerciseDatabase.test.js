/**
 * Exercise Database Tests
 * 
 * Comprehensive unit tests for the ExerciseDatabase module
 */

describe('ExerciseDatabase', () => {
    
    before(() => {
        // Ensure the module is ready before running tests
        if (!ExerciseDatabase.isReady()) {
            throw new Error('ExerciseDatabase module is not ready for testing');
        }
    });

    describe('Module Initialization', () => {
        
        it('should be properly initialized', () => {
            assert.isTrue(ExerciseDatabase.isReady());
        });

        it('should expose all required public methods', () => {
            const requiredMethods = [
                'isReady',
                'isValidMuscleGroup', 
                'getAllMuscleGroups',
                'getMuscleGroupLabel',
                'getExercisesByMuscleGroup',
                'getAllExercises',
                'getExerciseById',
                'getExerciseCount',
                'getDatabaseStats'
            ];

            requiredMethods.forEach(method => {
                assert.isFunction(ExerciseDatabase[method], `Method ${method} should be a function`);
            });
        });
    });

    describe('Muscle Group Validation', () => {
        
        it('should validate correct muscle groups', () => {
            const validGroups = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
            
            validGroups.forEach(group => {
                assert.isTrue(ExerciseDatabase.isValidMuscleGroup(group), 
                    `${group} should be a valid muscle group`);
            });
        });

        it('should reject invalid muscle groups', () => {
            const invalidGroups = ['invalid', 'muscle', 'group', '', null, undefined, 123];
            
            invalidGroups.forEach(group => {
                assert.isFalse(ExerciseDatabase.isValidMuscleGroup(group), 
                    `${group} should not be a valid muscle group`);
            });
        });

        it('should handle case insensitive validation', () => {
            const variations = ['CHEST', 'Chest', 'ChEsT', 'BACK', 'Back'];
            
            variations.forEach(variation => {
                assert.isTrue(ExerciseDatabase.isValidMuscleGroup(variation), 
                    `${variation} should be valid (case insensitive)`);
            });
        });
    });

    describe('Muscle Group Retrieval', () => {
        
        it('should return all muscle groups', () => {
            const muscleGroups = ExerciseDatabase.getAllMuscleGroups();
            
            assert.isArray(muscleGroups);
            assert.hasLength(muscleGroups, 6);
            
            const expectedGroups = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'];
            expectedGroups.forEach(group => {
                assert.contains(muscleGroups, group);
            });
        });

        it('should return a defensive copy of muscle groups', () => {
            const muscleGroups1 = ExerciseDatabase.getAllMuscleGroups();
            const muscleGroups2 = ExerciseDatabase.getAllMuscleGroups();
            
            // Should be equal but not the same reference
            assert.deepEqual(muscleGroups1, muscleGroups2);
            assert.isFalse(muscleGroups1 === muscleGroups2, 
                'Should return a new array each time');
        });

        it('should get correct muscle group labels', () => {
            const expectedLabels = {
                'chest': 'Chest',
                'back': 'Back', 
                'legs': 'Legs',
                'shoulders': 'Shoulders',
                'arms': 'Arms',
                'core': 'Core'
            };

            Object.entries(expectedLabels).forEach(([group, expectedLabel]) => {
                const label = ExerciseDatabase.getMuscleGroupLabel(group);
                assert.strictEqual(label, expectedLabel, 
                    `Label for ${group} should be ${expectedLabel}`);
            });
        });

        it('should throw error for invalid muscle group labels', () => {
            assert.throws(() => {
                ExerciseDatabase.getMuscleGroupLabel('invalid');
            }, 'Invalid muscle group');
        });
    });

    describe('Exercise Retrieval by Muscle Group', () => {
        
        it('should return exercises for each muscle group', () => {
            const muscleGroups = ExerciseDatabase.getAllMuscleGroups();
            
            muscleGroups.forEach(group => {
                const exercises = ExerciseDatabase.getExercisesByMuscleGroup(group);
                
                assert.isArray(exercises, `Exercises for ${group} should be an array`);
                assert.isTrue(exercises.length >= 20, 
                    `${group} should have at least 20 exercises, got ${exercises.length}`);
                
                exercises.forEach((exercise, index) => {
                    assert.isNotNull(exercise, `Exercise ${index} in ${group} should not be null`);
                    assert.isString(exercise.id, `Exercise ${index} in ${group} should have string id`);
                    assert.isString(exercise.name, `Exercise ${index} in ${group} should have string name`);
                    assert.isTrue(exercise.id.length > 0, `Exercise ${index} in ${group} should have non-empty id`);
                    assert.isTrue(exercise.name.length > 0, `Exercise ${index} in ${group} should have non-empty name`);
                });
            });
        });

        it('should return defensive copies of exercises', () => {
            const exercises1 = ExerciseDatabase.getExercisesByMuscleGroup('chest');
            const exercises2 = ExerciseDatabase.getExercisesByMuscleGroup('chest');
            
            // Should be equal but not the same reference
            assert.deepEqual(exercises1, exercises2);
            assert.isFalse(exercises1 === exercises2, 
                'Should return new arrays each time');
            
            // Individual exercise objects should also be copies
            if (exercises1.length > 0) {
                assert.isFalse(exercises1[0] === exercises2[0], 
                    'Individual exercise objects should be copies');
            }
        });

        it('should throw error for invalid muscle groups', () => {
            assert.throws(() => {
                ExerciseDatabase.getExercisesByMuscleGroup('invalid');
            }, 'Invalid muscle group');

            assert.throws(() => {
                ExerciseDatabase.getExercisesByMuscleGroup(null);
            }, 'Invalid muscle group');
        });

        it('should handle case insensitive muscle group names', () => {
            const lowerCase = ExerciseDatabase.getExercisesByMuscleGroup('chest');
            const upperCase = ExerciseDatabase.getExercisesByMuscleGroup('CHEST');
            const mixedCase = ExerciseDatabase.getExercisesByMuscleGroup('ChEsT');
            
            assert.deepEqual(lowerCase, upperCase);
            assert.deepEqual(lowerCase, mixedCase);
        });
    });

    describe('All Exercises Retrieval', () => {
        
        it('should return all exercises with muscle group property', () => {
            const allExercises = ExerciseDatabase.getAllExercises();
            
            assert.isArray(allExercises);
            assert.isTrue(allExercises.length >= 120, 
                'Should have at least 120 total exercises (20 per group × 6 groups)');
            
            allExercises.forEach((exercise, index) => {
                assert.isString(exercise.id, `Exercise ${index} should have string id`);
                assert.isString(exercise.name, `Exercise ${index} should have string name`);
                assert.isString(exercise.muscleGroup, `Exercise ${index} should have muscle group`);
                assert.isTrue(ExerciseDatabase.isValidMuscleGroup(exercise.muscleGroup), 
                    `Exercise ${index} should have valid muscle group`);
            });
        });

        it('should include exercises from all muscle groups', () => {
            const allExercises = ExerciseDatabase.getAllExercises();
            const muscleGroups = ExerciseDatabase.getAllMuscleGroups();
            
            muscleGroups.forEach(group => {
                const exercisesFromGroup = allExercises.filter(ex => ex.muscleGroup === group);
                assert.isTrue(exercisesFromGroup.length >= 20, 
                    `Should have at least 20 exercises from ${group}`);
            });
        });

        it('should have unique exercise IDs', () => {
            const allExercises = ExerciseDatabase.getAllExercises();
            const ids = allExercises.map(ex => ex.id);
            const uniqueIds = [...new Set(ids)];
            
            assert.strictEqual(ids.length, uniqueIds.length, 
                'All exercise IDs should be unique');
        });
    });

    describe('Exercise Lookup by ID', () => {
        
        it('should find exercises by valid IDs', () => {
            const allExercises = ExerciseDatabase.getAllExercises();
            
            // Test with first exercise from each muscle group
            const muscleGroups = ExerciseDatabase.getAllMuscleGroups();
            muscleGroups.forEach(group => {
                const groupExercises = ExerciseDatabase.getExercisesByMuscleGroup(group);
                if (groupExercises.length > 0) {
                    const firstExercise = groupExercises[0];
                    const foundExercise = ExerciseDatabase.getExerciseById(firstExercise.id);
                    
                    assert.isNotNull(foundExercise, `Should find exercise with ID ${firstExercise.id}`);
                    assert.strictEqual(foundExercise.id, firstExercise.id);
                    assert.strictEqual(foundExercise.name, firstExercise.name);
                    assert.strictEqual(foundExercise.muscleGroup, group);
                }
            });
        });

        it('should return null for invalid IDs', () => {
            const invalidIds = ['nonexistent', '', null, undefined, 123];
            
            invalidIds.forEach(id => {
                const result = ExerciseDatabase.getExerciseById(id);
                assert.isNull(result, `Should return null for invalid ID: ${id}`);
            });
        });

        it('should return exercise with muscle group property', () => {
            const allExercises = ExerciseDatabase.getAllExercises();
            
            if (allExercises.length > 0) {
                const randomExercise = allExercises[Math.floor(Math.random() * allExercises.length)];
                const foundExercise = ExerciseDatabase.getExerciseById(randomExercise.id);
                
                assert.isNotNull(foundExercise);
                assert.isString(foundExercise.muscleGroup, 
                    'Retrieved exercise should have muscle group property');
            }
        });
    });

    describe('Exercise Count Methods', () => {
        
        it('should return correct exercise count for each muscle group', () => {
            const muscleGroups = ExerciseDatabase.getAllMuscleGroups();
            
            muscleGroups.forEach(group => {
                const exercises = ExerciseDatabase.getExercisesByMuscleGroup(group);
                const count = ExerciseDatabase.getExerciseCount(group);
                
                assert.strictEqual(count, exercises.length, 
                    `Count for ${group} should match array length`);
                assert.isTrue(count >= 20, 
                    `${group} should have at least 20 exercises`);
            });
        });

        it('should throw error for invalid muscle group in count', () => {
            assert.throws(() => {
                ExerciseDatabase.getExerciseCount('invalid');
            }, 'Invalid muscle group');
        });
    });

    describe('Database Statistics', () => {
        
        it('should return comprehensive database statistics', () => {
            const stats = ExerciseDatabase.getDatabaseStats();
            
            assert.isNotNull(stats);
            assert.isNumber(stats.muscleGroupCount, 'Should have muscle group count');
            assert.isNumber(stats.totalExercises, 'Should have total exercises count');
            assert.isNotNull(stats.exercisesByGroup, 'Should have exercises by group');
            
            assert.strictEqual(stats.muscleGroupCount, 6, 'Should have 6 muscle groups');
            assert.isTrue(stats.totalExercises >= 120, 'Should have at least 120 total exercises');
        });

        it('should have consistent statistics', () => {
            const stats = ExerciseDatabase.getDatabaseStats();
            const muscleGroups = ExerciseDatabase.getAllMuscleGroups();
            
            // Check that exercisesByGroup contains all muscle groups
            muscleGroups.forEach(group => {
                assert.isNumber(stats.exercisesByGroup[group], 
                    `Should have count for ${group}`);
                assert.isTrue(stats.exercisesByGroup[group] >= 20, 
                    `${group} should have at least 20 exercises in stats`);
            });
            
            // Check that total matches sum of individual groups
            const sumFromGroups = Object.values(stats.exercisesByGroup)
                .reduce((sum, count) => sum + count, 0);
            assert.strictEqual(stats.totalExercises, sumFromGroups, 
                'Total should equal sum of individual group counts');
        });
    });

    describe('Data Integrity', () => {
        
        it('should have proper exercise ID format', () => {
            const allExercises = ExerciseDatabase.getAllExercises();
            
            allExercises.forEach(exercise => {
                // Check ID format: should be like 'chest_001', 'back_015', etc.
                const idPattern = /^(chest|back|legs|shoulders|arms|core)_\d{3}$/;
                assert.isTrue(idPattern.test(exercise.id), 
                    `Exercise ID "${exercise.id}" should match pattern group_###`);
                
                // Check that muscle group in ID matches muscleGroup property
                const idMuscleGroup = exercise.id.split('_')[0];
                assert.strictEqual(exercise.muscleGroup, idMuscleGroup, 
                    `Muscle group in ID should match muscleGroup property for ${exercise.id}`);
            });
        });

        it('should have non-empty exercise names', () => {
            const allExercises = ExerciseDatabase.getAllExercises();
            
            allExercises.forEach(exercise => {
                assert.isString(exercise.name, 'Exercise name should be string');
                assert.isTrue(exercise.name.trim().length > 0, 
                    `Exercise name should not be empty for ${exercise.id}`);
                assert.isFalse(exercise.name.includes('  '), 
                    `Exercise name should not have double spaces for ${exercise.id}`);
            });
        });

        it('should not modify returned data when external code mutates it', () => {
            const exercises = ExerciseDatabase.getExercisesByMuscleGroup('chest');
            const originalLength = exercises.length;
            
            // Try to modify the returned array
            exercises.push({ id: 'test', name: 'Test Exercise' });
            exercises[0].name = 'Modified Name';
            
            // Get fresh copy and verify it's unchanged
            const freshExercises = ExerciseDatabase.getExercisesByMuscleGroup('chest');
            assert.strictEqual(freshExercises.length, originalLength, 
                'Original data should not be modified');
            assert.isFalse(freshExercises[0].name === 'Modified Name', 
                'Original exercise names should not be modified');
        });
    });

    describe('Edge Cases and Error Handling', () => {
        
        it('should handle rapid successive calls', () => {
            // Test that module can handle many rapid calls without issues
            const results = [];
            for (let i = 0; i < 100; i++) {
                results.push(ExerciseDatabase.getAllMuscleGroups());
            }
            
            // All results should be identical
            results.forEach((result, index) => {
                assert.deepEqual(result, results[0], 
                    `Result ${index} should be identical to first result`);
            });
        });

        it('should maintain state across method calls', () => {
            // Ensure module state is consistent across different method calls
            const groups1 = ExerciseDatabase.getAllMuscleGroups();
            const allExercises = ExerciseDatabase.getAllExercises();
            const groups2 = ExerciseDatabase.getAllMuscleGroups();
            
            assert.deepEqual(groups1, groups2, 
                'Module state should be consistent');
            assert.isTrue(allExercises.length > 0, 
                'Should still return exercises after getting muscle groups');
        });
    });
});
