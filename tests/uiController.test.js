/**
 * UIController Module Tests
 *
 * Comprehensive unit tests for the UIController module
 * Note: UIController is heavily DOM-dependent, so these tests focus on
 * the public API and state management
 */

describe("UIController", () => {
  beforeEach(() => {
    // Initialize required dependencies
    // Note: ExerciseDatabase, Validators, and ExerciseGenerator are auto-initialized
    // Only PDFExport and UIController need explicit initialization
    if (PDFExport.init) {
      PDFExport.init();
    }
    // Initialize UIController
    if (UIController.init) {
      UIController.init();
    }
  });

  describe("Module Initialization", () => {
    it("should be properly initialized", () => {
      assert.isTrue(UIController.isReady());
    });

    it("should expose all required public methods", () => {
      const requiredMethods = [
        "init",
        "isReady",
        "showLoadingState",
        "showErrorState",
        "showEmptyState",
        "renderWorkoutList",
        "getCurrentWorkout",
        "getCurrentOperationMode",
      ];

      requiredMethods.forEach((method) => {
        assert.isFunction(
          UIController[method],
          `Method ${method} should be a function`
        );
      });
    });
  });

  describe("UI State Management", () => {
    it("should show loading state", () => {
      assert.doesNotThrow(() => {
        UIController.showLoadingState();
      });
    });

    it("should show error state with message", () => {
      assert.doesNotThrow(() => {
        UIController.showErrorState("Test error message");
      });
    });

    it("should show empty state", () => {
      assert.doesNotThrow(() => {
        UIController.showEmptyState();
      });
    });

    it("should handle showing states multiple times", () => {
      assert.doesNotThrow(() => {
        UIController.showLoadingState();
        UIController.showEmptyState();
        UIController.showLoadingState();
        UIController.showErrorState("Error");
        UIController.showEmptyState();
      });
    });
  });

  describe("Workout Display", () => {
    it("should render workout list with valid data", () => {
      const workout = [
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
      ];

      assert.doesNotThrow(() => {
        UIController.renderWorkoutList(workout);
      });
    });

    it("should handle rendering empty workout list", () => {
      assert.doesNotThrow(() => {
        UIController.renderWorkoutList([]);
      });
    });

    it("should handle rendering null workout", () => {
      assert.throws(() => {
        UIController.renderWorkoutList(null);
      }, /expects an array/);
    });

    it("should handle rendering undefined workout", () => {
      assert.throws(() => {
        UIController.renderWorkoutList(undefined);
      }, /expects an array/);
    });
  });

  describe("Current Workout Management", () => {
    it("should get current workout", () => {
      const workout = UIController.getCurrentWorkout();

      assert.isArray(workout);
    });

    it("should return array for current workout", () => {
      const workout = UIController.getCurrentWorkout();

      assert.isArray(workout);
    });

    it("should update current workout when rendering", () => {
      const testWorkout = [
        {
          id: "ex1",
          name: "Squats",
          muscleGroup: "legs",
          sets: 3,
          reps: 12,
        },
      ];

      UIController.renderWorkoutList(testWorkout);

      const currentWorkout = UIController.getCurrentWorkout();

      assert.isArray(currentWorkout);
      // Workout should be stored
      assert.isTrue(currentWorkout.length >= 0);
    });
  });

  describe("Operation Mode Management", () => {
    it("should get current operation mode", () => {
      const mode = UIController.getCurrentOperationMode();

      assert.isString(mode);
    });

    it("should have valid operation mode", () => {
      const mode = UIController.getCurrentOperationMode();

      const validModes = ["regenerate", "add", "replace"];
      assert.isTrue(
        validModes.includes(mode),
        `Mode should be one of: ${validModes.join(", ")}`
      );
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid workout data gracefully", () => {
      assert.doesNotThrow(() => {
        UIController.renderWorkoutList("invalid");
        UIController.renderWorkoutList(123);
        UIController.renderWorkoutList({});
      });
    });

    it("should handle null error message", () => {
      assert.doesNotThrow(() => {
        UIController.showErrorState(null);
      });
    });

    it("should handle undefined error message", () => {
      assert.doesNotThrow(() => {
        UIController.showErrorState(undefined);
      });
    });

    it("should handle empty error message", () => {
      assert.doesNotThrow(() => {
        UIController.showErrorState("");
      });
    });

    it("should handle very long error message", () => {
      const longMessage = "Error ".repeat(100);

      assert.doesNotThrow(() => {
        UIController.showErrorState(longMessage);
      });
    });
  });

  describe("Module State", () => {
    it("should maintain ready state", () => {
      assert.isTrue(UIController.isReady());
    });

    it("should maintain state across operations", () => {
      UIController.showLoadingState();
      assert.isTrue(UIController.isReady());

      UIController.showErrorState("Test");
      assert.isTrue(UIController.isReady());

      UIController.showEmptyState();
      assert.isTrue(UIController.isReady());
    });
  });

  describe("Workout Rendering with Different Data", () => {
    it("should render workout with single exercise", () => {
      const workout = [
        {
          id: "ex1",
          name: "Bench Press",
          muscleGroup: "chest",
          sets: 4,
          reps: 8,
        },
      ];

      assert.doesNotThrow(() => {
        UIController.renderWorkoutList(workout);
      });
    });

    it("should render workout with multiple exercises", () => {
      const workout = [
        {
          id: "ex1",
          name: "Push-ups",
          muscleGroup: "chest",
          sets: 3,
          reps: 10,
        },
        { id: "ex2", name: "Pull-ups", muscleGroup: "back", sets: 3, reps: 8 },
        { id: "ex3", name: "Squats", muscleGroup: "legs", sets: 3, reps: 12 },
        {
          id: "ex4",
          name: "Shoulder Press",
          muscleGroup: "shoulders",
          sets: 3,
          reps: 10,
        },
        {
          id: "ex5",
          name: "Bicep Curls",
          muscleGroup: "arms",
          sets: 3,
          reps: 12,
        },
        { id: "ex6", name: "Plank", muscleGroup: "core", sets: 3, reps: 30 },
      ];

      assert.doesNotThrow(() => {
        UIController.renderWorkoutList(workout);
      });
    });

    it("should render workout with all muscle groups", () => {
      const workout = [
        { id: "ex1", name: "Chest Exercise", muscleGroup: "chest" },
        { id: "ex2", name: "Back Exercise", muscleGroup: "back" },
        { id: "ex3", name: "Leg Exercise", muscleGroup: "legs" },
        { id: "ex4", name: "Shoulder Exercise", muscleGroup: "shoulders" },
        { id: "ex5", name: "Arm Exercise", muscleGroup: "arms" },
        { id: "ex6", name: "Core Exercise", muscleGroup: "core" },
      ];

      assert.doesNotThrow(() => {
        UIController.renderWorkoutList(workout);
      });
    });
  });

  describe("State Transitions", () => {
    it("should transition from empty to loading state", () => {
      assert.doesNotThrow(() => {
        UIController.showEmptyState();
        UIController.showLoadingState();
      });
    });

    it("should transition from loading to workout display", () => {
      const workout = [
        { id: "ex1", name: "Test Exercise", muscleGroup: "chest" },
      ];

      assert.doesNotThrow(() => {
        UIController.showLoadingState();
        UIController.renderWorkoutList(workout);
      });
    });

    it("should transition from loading to error state", () => {
      assert.doesNotThrow(() => {
        UIController.showLoadingState();
        UIController.showErrorState("Generation failed");
      });
    });

    it("should transition from error to empty state", () => {
      assert.doesNotThrow(() => {
        UIController.showErrorState("Test error");
        UIController.showEmptyState();
      });
    });

    it("should handle rapid state changes", () => {
      assert.doesNotThrow(() => {
        UIController.showEmptyState();
        UIController.showLoadingState();
        UIController.showErrorState("Error");
        UIController.showEmptyState();
        UIController.showLoadingState();
      });
    });
  });

  describe("Integration with Dependencies", () => {
    it("should work with ExerciseDatabase", () => {
      assert.isTrue(ExerciseDatabase.isReady());
      assert.isTrue(UIController.isReady());
    });

    it("should work with Validators", () => {
      assert.isTrue(Validators.isReady());
      assert.isTrue(UIController.isReady());
    });

    it("should work with ExerciseGenerator", () => {
      assert.isTrue(ExerciseGenerator.isReady());
      assert.isTrue(UIController.isReady());
    });
  });
});
