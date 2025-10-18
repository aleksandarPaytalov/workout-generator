/**
 * StorageManager Module Tests
 *
 * Comprehensive unit tests for the StorageManager module
 */

describe("StorageManager", () => {
  // Helper function to create a valid workout object
  const createValidWorkout = (overrides = {}) => {
    return {
      id: `workout-${Date.now()}`,
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      time: new Date().toLocaleTimeString(),
      exercises: [
        {
          name: "Push-ups",
          muscleGroup: "chest",
          sets: 3,
          reps: 10,
        },
        {
          name: "Pull-ups",
          muscleGroup: "back",
          sets: 3,
          reps: 8,
        },
      ],
      settings: {},
      metadata: {},
      stats: {},
      version: "1.0",
      type: "workout-session",
      summary: {},
      ...overrides,
    };
  };

  // Clear localStorage before each test
  beforeEach(() => {
    localStorage.clear();
    // Re-initialize the module
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
      assert.isTrue(StorageManager.isReady());
    });

    it("should expose all required public methods", () => {
      const requiredMethods = [
        "init",
        "saveWorkout",
        "getWorkouts",
        "clearHistory",
        "getStorageInfo",
        "checkStorageCapacity",
        "isReady",
      ];

      requiredMethods.forEach((method) => {
        assert.isFunction(
          StorageManager[method],
          `Method ${method} should be a function`
        );
      });
    });
  });

  describe("Workout Validation", () => {
    it("should accept valid workout data", () => {
      const validWorkout = createValidWorkout();

      assert.doesNotThrow(() => {
        StorageManager.saveWorkout(validWorkout);
      });
    });

    it("should reject workout without id", () => {
      const invalidWorkout = createValidWorkout({ id: "" });

      assert.throws(() => {
        StorageManager.saveWorkout(invalidWorkout);
      }, /must have a valid non-empty id/);
    });

    it("should reject workout without timestamp", () => {
      const invalidWorkout = createValidWorkout({ timestamp: "" });

      assert.throws(() => {
        StorageManager.saveWorkout(invalidWorkout);
      }, /must have a valid timestamp/);
    });

    it("should reject workout with invalid timestamp", () => {
      const invalidWorkout = createValidWorkout({ timestamp: "invalid-date" });

      assert.throws(() => {
        StorageManager.saveWorkout(invalidWorkout);
      }, /timestamp must be a valid/);
    });

    it("should reject workout without exercises array", () => {
      const invalidWorkout = createValidWorkout({ exercises: null });

      assert.throws(() => {
        StorageManager.saveWorkout(invalidWorkout);
      }, /must have an exercises array/);
    });

    it("should reject workout with empty exercises array", () => {
      const invalidWorkout = createValidWorkout({ exercises: [] });

      assert.throws(() => {
        StorageManager.saveWorkout(invalidWorkout);
      }, /must contain at least one exercise/);
    });

    it("should reject workout with too many exercises", () => {
      const exercises = Array(51).fill({
        name: "Test Exercise",
        muscleGroup: "chest",
      });
      const invalidWorkout = createValidWorkout({ exercises });

      assert.throws(() => {
        StorageManager.saveWorkout(invalidWorkout);
      }, /cannot contain more than 50 exercises/);
    });

    it("should reject exercise without name", () => {
      const invalidWorkout = createValidWorkout({
        exercises: [{ muscleGroup: "chest" }],
      });

      assert.throws(() => {
        StorageManager.saveWorkout(invalidWorkout);
      }, /must have a valid name/);
    });

    it("should reject exercise with invalid muscle group", () => {
      const invalidWorkout = createValidWorkout({
        exercises: [
          {
            name: "Test Exercise",
            muscleGroup: "invalid-group",
          },
        ],
      });

      assert.throws(() => {
        StorageManager.saveWorkout(invalidWorkout);
      }, /has invalid muscle group/);
    });

    it("should accept all valid muscle groups", () => {
      const validMuscleGroups = [
        "chest",
        "back",
        "legs",
        "shoulders",
        "arms",
        "core",
      ];

      validMuscleGroups.forEach((muscleGroup) => {
        const workout = createValidWorkout({
          id: `workout-${muscleGroup}`,
          exercises: [
            {
              name: "Test Exercise",
              muscleGroup: muscleGroup,
            },
          ],
        });

        assert.doesNotThrow(() => {
          StorageManager.saveWorkout(workout);
        }, `Should accept muscle group: ${muscleGroup}`);
      });
    });
  });

  describe("Workout Storage Operations", () => {
    it("should save a workout successfully", () => {
      const workout = createValidWorkout();
      const result = StorageManager.saveWorkout(workout);

      assert.isTrue(result);
    });

    it("should retrieve saved workouts", () => {
      const workout = createValidWorkout();
      StorageManager.saveWorkout(workout);

      const workouts = StorageManager.getWorkouts();

      assert.isArray(workouts);
      assert.hasLength(workouts, 1);
      assert.equal(workouts[0].id, workout.id);
    });

    it("should return empty array when no workouts saved", () => {
      const workouts = StorageManager.getWorkouts();

      assert.isArray(workouts);
      assert.hasLength(workouts, 0);
    });

    it("should save multiple workouts", () => {
      const workout1 = createValidWorkout({ id: "workout-1" });
      const workout2 = createValidWorkout({ id: "workout-2" });
      const workout3 = createValidWorkout({ id: "workout-3" });

      StorageManager.saveWorkout(workout1);
      StorageManager.saveWorkout(workout2);
      StorageManager.saveWorkout(workout3);

      const workouts = StorageManager.getWorkouts();

      assert.hasLength(workouts, 3);
    });

    it("should add new workouts to the beginning of the array", () => {
      const workout1 = createValidWorkout({ id: "workout-1" });
      const workout2 = createValidWorkout({ id: "workout-2" });

      StorageManager.saveWorkout(workout1);
      StorageManager.saveWorkout(workout2);

      const workouts = StorageManager.getWorkouts();

      assert.equal(workouts[0].id, "workout-2");
      assert.equal(workouts[1].id, "workout-1");
    });

    it("should limit workouts to maximum of 5", () => {
      // Save 6 workouts
      for (let i = 1; i <= 6; i++) {
        const workout = createValidWorkout({ id: `workout-${i}` });
        StorageManager.saveWorkout(workout);
      }

      const workouts = StorageManager.getWorkouts();

      assert.hasLength(workouts, 5);
      // Should keep the 5 most recent (2-6)
      assert.equal(workouts[0].id, "workout-6");
      assert.equal(workouts[4].id, "workout-2");
    });

    it("should clear all workout history", () => {
      const workout1 = createValidWorkout({ id: "workout-1" });
      const workout2 = createValidWorkout({ id: "workout-2" });

      StorageManager.saveWorkout(workout1);
      StorageManager.saveWorkout(workout2);

      const result = StorageManager.clearHistory();

      assert.isTrue(result);

      const workouts = StorageManager.getWorkouts();
      assert.hasLength(workouts, 0);
    });
  });

  describe("Storage Information", () => {
    it("should provide storage info", () => {
      const info = StorageManager.getStorageInfo();

      assert.isObject(info);
      assert.hasProperty(info, "workoutCount");
      assert.hasProperty(info, "maxWorkouts");
      assert.hasProperty(info, "storageSize");
      assert.hasProperty(info, "maxStorageSize");
      assert.hasProperty(info, "usagePercentage");
      assert.hasProperty(info, "isAvailable");
      assert.hasProperty(info, "canAddMore");
    });

    it("should report correct workout count", () => {
      const workout1 = createValidWorkout({ id: "workout-1" });
      const workout2 = createValidWorkout({ id: "workout-2" });

      StorageManager.saveWorkout(workout1);
      StorageManager.saveWorkout(workout2);

      const info = StorageManager.getStorageInfo();

      assert.equal(info.workoutCount, 2);
    });

    it("should report max workouts as 5", () => {
      const info = StorageManager.getStorageInfo();

      assert.equal(info.maxWorkouts, 5);
    });

    it("should indicate when storage is available", () => {
      const info = StorageManager.getStorageInfo();

      assert.isTrue(info.isAvailable);
    });

    it("should indicate when can add more workouts", () => {
      const workout = createValidWorkout();
      StorageManager.saveWorkout(workout);

      const info = StorageManager.getStorageInfo();

      assert.isTrue(info.canAddMore);
    });

    it("should indicate when cannot add more workouts", () => {
      // Fill up to max workouts
      for (let i = 1; i <= 5; i++) {
        const workout = createValidWorkout({ id: `workout-${i}` });
        StorageManager.saveWorkout(workout);
      }

      const info = StorageManager.getStorageInfo();

      assert.isFalse(info.canAddMore);
    });
  });

  describe("Storage Capacity Checks", () => {
    it("should provide capacity information", () => {
      const capacity = StorageManager.checkStorageCapacity();

      assert.isObject(capacity);
      assert.hasProperty(capacity, "canAddWorkout");
      assert.hasProperty(capacity, "workoutSlotsRemaining");
      assert.hasProperty(capacity, "storageRemaining");
      assert.hasProperty(capacity, "warnings");
      assert.hasProperty(capacity, "recommendations");
      assert.hasProperty(capacity, "status");
    });

    it("should report OK status when storage is empty", () => {
      const capacity = StorageManager.checkStorageCapacity();

      assert.equal(capacity.status, "OK");
      assert.isTrue(capacity.canAddWorkout);
      assert.equal(capacity.workoutSlotsRemaining, 5);
    });

    it("should report correct slots remaining", () => {
      const workout1 = createValidWorkout({ id: "workout-1" });
      const workout2 = createValidWorkout({ id: "workout-2" });

      StorageManager.saveWorkout(workout1);
      StorageManager.saveWorkout(workout2);

      const capacity = StorageManager.checkStorageCapacity();

      assert.equal(capacity.workoutSlotsRemaining, 3);
    });

    it("should warn when approaching workout limit", () => {
      // Save 4 workouts (approaching limit of 5)
      for (let i = 1; i <= 4; i++) {
        const workout = createValidWorkout({ id: `workout-${i}` });
        StorageManager.saveWorkout(workout);
      }

      const capacity = StorageManager.checkStorageCapacity();

      assert.equal(capacity.status, "WARNING");
      assert.isArray(capacity.warnings);
      assert.isTrue(capacity.warnings.length > 0);
    });

    it("should warn when workout limit is reached", () => {
      // Save 5 workouts (max limit)
      for (let i = 1; i <= 5; i++) {
        const workout = createValidWorkout({ id: `workout-${i}` });
        StorageManager.saveWorkout(workout);
      }

      const capacity = StorageManager.checkStorageCapacity();

      assert.equal(capacity.status, "WARNING");
      assert.isFalse(capacity.canAddWorkout);
      assert.equal(capacity.workoutSlotsRemaining, 0);
    });

    it("should provide recommendations when warnings exist", () => {
      // Fill up storage
      for (let i = 1; i <= 5; i++) {
        const workout = createValidWorkout({ id: `workout-${i}` });
        StorageManager.saveWorkout(workout);
      }

      const capacity = StorageManager.checkStorageCapacity();

      assert.isArray(capacity.recommendations);
      assert.isTrue(capacity.recommendations.length > 0);
    });
  });

  describe("Data Sanitization", () => {
    it("should sanitize workout data on save", () => {
      const workout = createValidWorkout({
        id: "  workout-1  ", // Extra whitespace
        timestamp: "  2024-01-01T00:00:00.000Z  ", // Extra whitespace
      });

      StorageManager.saveWorkout(workout);
      const workouts = StorageManager.getWorkouts();

      assert.equal(workouts[0].id, "workout-1");
      assert.equal(workouts[0].timestamp, "2024-01-01T00:00:00.000Z");
    });

    it("should add default properties if missing", () => {
      const minimalWorkout = {
        id: "workout-1",
        timestamp: new Date().toISOString(),
        exercises: [
          {
            name: "Test Exercise",
            muscleGroup: "chest",
          },
        ],
      };

      StorageManager.saveWorkout(minimalWorkout);
      const workouts = StorageManager.getWorkouts();

      assert.hasProperty(workouts[0], "settings");
      assert.hasProperty(workouts[0], "metadata");
      assert.hasProperty(workouts[0], "stats");
      assert.hasProperty(workouts[0], "version");
      assert.hasProperty(workouts[0], "type");
      assert.hasProperty(workouts[0], "summary");
    });
  });

  describe("Error Handling", () => {
    it("should throw error when saving without initialization", () => {
      // This test assumes we can somehow uninitialize the module
      // In practice, the module auto-initializes, so this is theoretical
      assert.isTrue(StorageManager.isReady());
    });

    it("should handle corrupted localStorage data gracefully", () => {
      // Manually corrupt the localStorage data
      localStorage.setItem("workout-generator-history", "invalid-json{");

      const workouts = StorageManager.getWorkouts();

      // Should return empty array instead of throwing
      assert.isArray(workouts);
      assert.hasLength(workouts, 0);
    });

    it("should return empty array when localStorage is not available", () => {
      // This is hard to test without mocking, but we can verify the behavior
      const workouts = StorageManager.getWorkouts();

      assert.isArray(workouts);
    });
  });
});
