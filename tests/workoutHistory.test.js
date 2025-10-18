/**
 * WorkoutHistory Module Tests
 *
 * Comprehensive unit tests for the WorkoutHistory module
 */

describe("WorkoutHistory", () => {
  // Helper function to create valid workout data
  const createWorkoutData = (overrides = {}) => {
    return {
      exercises: [
        {
          id: "ex1",
          name: "Push-ups",
          muscleGroup: "chest",
          sets: 3,
          reps: 10,
        },
        {
          id: "ex2",
          name: "Pull-ups",
          muscleGroup: "back",
          sets: 3,
          reps: 8,
        },
        {
          id: "ex3",
          name: "Squats",
          muscleGroup: "legs",
          sets: 3,
          reps: 12,
        },
      ],
      ...overrides,
    };
  };

  // Clear storage before each test
  beforeEach(() => {
    localStorage.clear();
    if (StorageManager.isReady()) {
      StorageManager.clearHistory();
    }
  });

  // Clean up after each test
  afterEach(() => {
    localStorage.clear();
  });

  describe("Module Initialization", () => {
    it("should be properly initialized", () => {
      assert.isTrue(WorkoutHistory.isReady());
    });

    it("should expose all required public methods", () => {
      const requiredMethods = [
        "init",
        "isReady",
        "addWorkout",
        "getHistory",
        "getWorkoutById",
        "updateWorkout",
        "removeWorkout",
        "clearHistory",
        "getHistoryStats",
        "checkWorkoutLimit",
        "getSuggestedForRemoval",
        "removeOldestWorkouts",
        "makeSpaceForNewWorkout",
        "getStorageRecommendations",
        "compareWorkouts",
        "findSimilarWorkouts",
        "analyzeWorkoutProgression",
      ];

      requiredMethods.forEach((method) => {
        assert.isFunction(
          WorkoutHistory[method],
          `Method ${method} should be a function`
        );
      });
    });

    it("should expose EVENTS constant", () => {
      assert.isObject(WorkoutHistory.EVENTS);
      assert.hasProperty(WorkoutHistory.EVENTS, "WORKOUT_ADDED");
      assert.hasProperty(WorkoutHistory.EVENTS, "WORKOUT_REMOVED");
      assert.hasProperty(WorkoutHistory.EVENTS, "HISTORY_CLEARED");
    });
  });

  describe("Adding Workouts", () => {
    it("should add a workout successfully", () => {
      const workoutData = createWorkoutData();

      assert.doesNotThrow(() => {
        WorkoutHistory.addWorkout(workoutData);
      });
    });

    it("should reject workout without exercises", () => {
      const invalidData = { exercises: null };

      assert.throws(() => {
        WorkoutHistory.addWorkout(invalidData);
      }, /exercises array required/);
    });

    it("should reject workout with empty exercises array", () => {
      const invalidData = { exercises: [] };

      assert.throws(() => {
        WorkoutHistory.addWorkout(invalidData);
      }, /Cannot save empty workout/);
    });

    it("should add workout with settings", () => {
      const workoutData = createWorkoutData();
      const settings = {
        muscleGroups: ["chest", "back", "legs"],
        exerciseCount: 3,
      };

      assert.doesNotThrow(() => {
        WorkoutHistory.addWorkout(workoutData, settings);
      });
    });

    it("should generate unique ID for each workout", () => {
      const workoutData1 = createWorkoutData();
      const workoutData2 = createWorkoutData();

      WorkoutHistory.addWorkout(workoutData1);
      WorkoutHistory.addWorkout(workoutData2);

      const history = WorkoutHistory.getHistory();

      assert.hasLength(history, 2);
      assert.notEqual(history[0].id, history[1].id);
    });
  });

  describe("Retrieving Workouts", () => {
    it("should return empty array when no workouts exist", () => {
      const history = WorkoutHistory.getHistory();

      assert.isArray(history);
      assert.hasLength(history, 0);
    });

    it("should retrieve all saved workouts", () => {
      const workout1 = createWorkoutData();
      const workout2 = createWorkoutData();

      WorkoutHistory.addWorkout(workout1);
      WorkoutHistory.addWorkout(workout2);

      const history = WorkoutHistory.getHistory();

      assert.hasLength(history, 2);
    });

    it("should return workouts sorted by newest first", () => {
      const workout1 = createWorkoutData();
      const workout2 = createWorkoutData();

      WorkoutHistory.addWorkout(workout1);
      // Small delay to ensure different timestamps
      setTimeout(() => {
        WorkoutHistory.addWorkout(workout2);

        const history = WorkoutHistory.getHistory();

        // Second workout should be first (newest)
        const timestamp1 = new Date(history[0].timestamp);
        const timestamp2 = new Date(history[1].timestamp);
        assert.isTrue(timestamp1 >= timestamp2);
      }, 10);
    });

    it("should retrieve workout by ID", () => {
      const workoutData = createWorkoutData();
      WorkoutHistory.addWorkout(workoutData);

      const history = WorkoutHistory.getHistory();
      const workoutId = history[0].id;

      const retrieved = WorkoutHistory.getWorkoutById(workoutId);

      assert.isObject(retrieved);
      assert.equal(retrieved.id, workoutId);
    });

    it("should return null for non-existent workout ID", () => {
      const retrieved = WorkoutHistory.getWorkoutById("non-existent-id");

      assert.isNull(retrieved);
    });

    it("should throw error when getting workout by ID without ID parameter", () => {
      assert.throws(() => {
        WorkoutHistory.getWorkoutById();
      }, /Workout ID required/);
    });
  });

  describe("Updating Workouts", () => {
    it("should update workout successfully", () => {
      const workoutData = createWorkoutData();
      WorkoutHistory.addWorkout(workoutData);

      const history = WorkoutHistory.getHistory();
      const workoutId = history[0].id;

      const updates = {
        rating: 5,
        notes: "Great workout!",
      };

      const result = WorkoutHistory.updateWorkout(workoutId, updates);

      assert.isTrue(result);
    });

    it("should preserve existing data when updating", () => {
      const workoutData = createWorkoutData();
      WorkoutHistory.addWorkout(workoutData);

      const history = WorkoutHistory.getHistory();
      const workoutId = history[0].id;
      const originalExerciseCount = history[0].exercises.length;

      WorkoutHistory.updateWorkout(workoutId, { rating: 4 });

      const updated = WorkoutHistory.getWorkoutById(workoutId);

      assert.equal(updated.exercises.length, originalExerciseCount);
      assert.equal(updated.rating, 4);
    });

    it("should throw error when updating non-existent workout", () => {
      assert.throws(() => {
        WorkoutHistory.updateWorkout("non-existent-id", { rating: 5 });
      }, /Workout .* not found/);
    });

    it("should throw error when updating without ID", () => {
      assert.throws(() => {
        WorkoutHistory.updateWorkout(null, { rating: 5 });
      }, /Workout ID required/);
    });
  });

  describe("Removing Workouts", () => {
    it("should remove workout successfully", () => {
      const workoutData = createWorkoutData();
      WorkoutHistory.addWorkout(workoutData);

      const history = WorkoutHistory.getHistory();
      const workoutId = history[0].id;

      const result = WorkoutHistory.removeWorkout(workoutId);

      assert.isTrue(result);

      const updatedHistory = WorkoutHistory.getHistory();
      assert.hasLength(updatedHistory, 0);
    });

    it("should throw error when removing non-existent workout", () => {
      assert.throws(() => {
        WorkoutHistory.removeWorkout("non-existent-id");
      }, /Workout .* not found/);
    });

    it("should throw error when removing without ID", () => {
      assert.throws(() => {
        WorkoutHistory.removeWorkout();
      }, /Workout ID required/);
    });
  });

  describe("Clearing History", () => {
    it("should clear all workout history", () => {
      const workout1 = createWorkoutData();
      const workout2 = createWorkoutData();

      WorkoutHistory.addWorkout(workout1);
      WorkoutHistory.addWorkout(workout2);

      const result = WorkoutHistory.clearHistory();

      assert.isTrue(result);

      const history = WorkoutHistory.getHistory();
      assert.hasLength(history, 0);
    });

    it("should not throw error when clearing empty history", () => {
      assert.doesNotThrow(() => {
        WorkoutHistory.clearHistory();
      });
    });
  });

  describe("History Statistics", () => {
    it("should return empty stats when no workouts exist", () => {
      const stats = WorkoutHistory.getHistoryStats();

      assert.isObject(stats);
      assert.equal(stats.totalWorkouts, 0);
      assert.equal(stats.totalExercises, 0);
      assert.equal(stats.averageExercisesPerWorkout, 0);
    });

    it("should calculate total workouts correctly", () => {
      const workout1 = createWorkoutData();
      const workout2 = createWorkoutData();

      WorkoutHistory.addWorkout(workout1);
      WorkoutHistory.addWorkout(workout2);

      const stats = WorkoutHistory.getHistoryStats();

      assert.equal(stats.totalWorkouts, 2);
    });

    it("should calculate total exercises correctly", () => {
      const workoutData = createWorkoutData(); // Has 3 exercises

      WorkoutHistory.addWorkout(workoutData);

      const stats = WorkoutHistory.getHistoryStats();

      assert.equal(stats.totalExercises, 3);
    });

    it("should calculate average exercises per workout", () => {
      const workout1 = createWorkoutData(); // 3 exercises
      const workout2 = createWorkoutData({
        exercises: [
          { name: "Push-ups", muscleGroup: "chest" },
          { name: "Pull-ups", muscleGroup: "back" },
        ],
      }); // 2 exercises

      WorkoutHistory.addWorkout(workout1);
      WorkoutHistory.addWorkout(workout2);

      const stats = WorkoutHistory.getHistoryStats();

      assert.equal(stats.averageExercisesPerWorkout, 2.5);
    });

    it("should track unique exercises", () => {
      const workout1 = createWorkoutData();
      const workout2 = createWorkoutData(); // Same exercises

      WorkoutHistory.addWorkout(workout1);
      WorkoutHistory.addWorkout(workout2);

      const stats = WorkoutHistory.getHistoryStats();

      // Should count unique exercise names
      assert.equal(stats.uniqueExercises, 3);
    });

    it("should identify most used muscle groups", () => {
      const workoutData = createWorkoutData(); // chest, back, legs

      WorkoutHistory.addWorkout(workoutData);

      const stats = WorkoutHistory.getHistoryStats();

      assert.isArray(stats.mostUsedMuscleGroups);
      assert.isTrue(stats.mostUsedMuscleGroups.length > 0);
    });
  });

  describe("Workout Limit Management", () => {
    it("should check workout limit", () => {
      const limitInfo = WorkoutHistory.checkWorkoutLimit();

      assert.isObject(limitInfo);
      assert.hasProperty(limitInfo, "currentCount");
      assert.hasProperty(limitInfo, "maxLimit");
      assert.hasProperty(limitInfo, "hasSpace");
    });

    it("should indicate when space is available", () => {
      const limitInfo = WorkoutHistory.checkWorkoutLimit();

      assert.isTrue(limitInfo.hasSpace);
    });

    it("should indicate when limit is reached", () => {
      // Add 5 workouts (max limit)
      for (let i = 0; i < 5; i++) {
        WorkoutHistory.addWorkout(createWorkoutData());
      }

      const limitInfo = WorkoutHistory.checkWorkoutLimit();

      assert.isFalse(limitInfo.hasSpace);
      assert.equal(limitInfo.currentCount, 5);
    });

    it("should suggest workouts for removal when limit reached", () => {
      // Add 5 workouts
      for (let i = 0; i < 5; i++) {
        WorkoutHistory.addWorkout(createWorkoutData());
      }

      const suggestions = WorkoutHistory.getSuggestedForRemoval();

      assert.isArray(suggestions);
      assert.isTrue(suggestions.length > 0);
    });

    it("should remove oldest workouts", () => {
      // Add 5 workouts
      for (let i = 0; i < 5; i++) {
        WorkoutHistory.addWorkout(createWorkoutData());
      }

      const result = WorkoutHistory.removeOldestWorkouts(2);

      assert.isTrue(result);

      const history = WorkoutHistory.getHistory();
      assert.equal(history.length, 3);
    });

    it("should make space for new workout", () => {
      // Add 5 workouts (max limit)
      for (let i = 0; i < 5; i++) {
        WorkoutHistory.addWorkout(createWorkoutData());
      }

      const result = WorkoutHistory.makeSpaceForNewWorkout();

      assert.isTrue(result);

      const limitInfo = WorkoutHistory.checkWorkoutLimit();
      assert.isTrue(limitInfo.hasSpace);
    });

    it("should provide storage recommendations", () => {
      const recommendations = WorkoutHistory.getStorageRecommendations();

      assert.isObject(recommendations);
      assert.hasProperty(recommendations, "status");
      assert.hasProperty(recommendations, "recommendations");
    });
  });

  describe("Workout Comparison", () => {
    it("should compare two workouts", () => {
      const workout1 = createWorkoutData();
      const workout2 = createWorkoutData();

      WorkoutHistory.addWorkout(workout1);
      WorkoutHistory.addWorkout(workout2);

      const history = WorkoutHistory.getHistory();
      const id1 = history[0].id;
      const id2 = history[1].id;

      const comparison = WorkoutHistory.compareWorkouts(id1, id2);

      assert.isObject(comparison);
      assert.hasProperty(comparison, "similarity");
      assert.hasProperty(comparison, "commonExercises");
    });

    it("should throw error when comparing without both IDs", () => {
      assert.throws(() => {
        WorkoutHistory.compareWorkouts("id1");
      }, /Both workout IDs are required/);
    });

    it("should throw error when comparing non-existent workouts", () => {
      assert.throws(() => {
        WorkoutHistory.compareWorkouts("non-existent-1", "non-existent-2");
      }, /Workout .* not found/);
    });

    it("should find similar workouts", () => {
      const workout1 = createWorkoutData();
      const workout2 = createWorkoutData(); // Same exercises

      WorkoutHistory.addWorkout(workout1);
      WorkoutHistory.addWorkout(workout2);

      const history = WorkoutHistory.getHistory();
      const workoutId = history[0].id;

      const similar = WorkoutHistory.findSimilarWorkouts(workoutId);

      assert.isArray(similar);
    });
  });

  describe("Workout Progression Analysis", () => {
    it("should analyze workout progression", () => {
      const workout1 = createWorkoutData();
      const workout2 = createWorkoutData();

      WorkoutHistory.addWorkout(workout1);
      WorkoutHistory.addWorkout(workout2);

      const progression = WorkoutHistory.analyzeWorkoutProgression();

      assert.isObject(progression);
      assert.hasProperty(progression, "totalWorkouts");
    });

    it("should handle progression analysis with no workouts", () => {
      const progression = WorkoutHistory.analyzeWorkoutProgression();

      assert.isObject(progression);
      assert.equal(progression.totalWorkouts, 0);
    });
  });
});
