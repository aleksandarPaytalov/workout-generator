/**
 * WorkoutTimer Module Tests
 *
 * Comprehensive unit tests for the WorkoutTimer module
 */

describe("WorkoutTimer", () => {
  // Sample exercise for testing
  const sampleExercise = {
    id: "ex1",
    name: "Push-ups",
    muscleGroup: "chest",
    sets: 3,
    reps: 10,
  };

  beforeEach(() => {
    // Initialize the module
    WorkoutTimer.init();
    // Stop any running timer
    if (WorkoutTimer.isRunning()) {
      WorkoutTimer.stopTimer();
    }
  });

  afterEach(() => {
    // Clean up - stop timer if running
    if (WorkoutTimer.isRunning()) {
      WorkoutTimer.stopTimer();
    }
  });

  describe("Module Initialization", () => {
    it("should be properly initialized", () => {
      assert.isTrue(WorkoutTimer.isReady());
    });

    it("should expose all required public methods", () => {
      const requiredMethods = [
        "init",
        "isReady",
        "getTimerConfig",
        "getDefaultConfig",
        "setTimerConfig",
        "getCurrentPhase",
        "getRemainingTime",
        "getCurrentCycle",
        "getCurrentSet",
        "getProgress",
        "isRunning",
        "isPaused",
        "getTimerState",
        "startTimer",
        "stopTimer",
        "pauseTimer",
        "resumeTimer",
        "skipPhase",
        "resetExercise",
      ];

      requiredMethods.forEach((method) => {
        assert.isFunction(
          WorkoutTimer[method],
          `Method ${method} should be a function`
        );
      });
    });

    it("should expose TIMER_EVENTS constant", () => {
      assert.isObject(WorkoutTimer.TIMER_EVENTS);
      assert.hasProperty(WorkoutTimer.TIMER_EVENTS, "STARTED");
      assert.hasProperty(WorkoutTimer.TIMER_EVENTS, "PAUSED");
      assert.hasProperty(WorkoutTimer.TIMER_EVENTS, "STOPPED");
      assert.hasProperty(WorkoutTimer.TIMER_EVENTS, "TICK");
      assert.hasProperty(WorkoutTimer.TIMER_EVENTS, "PHASE_CHANGED");
    });
  });

  describe("Timer Configuration", () => {
    it("should get default timer configuration", () => {
      const config = WorkoutTimer.getDefaultConfig();

      assert.isObject(config);
      assert.hasProperty(config, "prepare");
      assert.hasProperty(config, "work");
      assert.hasProperty(config, "rest");
      assert.hasProperty(config, "cyclesPerSet");
      assert.hasProperty(config, "sets");
      assert.hasProperty(config, "restBetweenSets");
    });

    it("should get current timer configuration", () => {
      const config = WorkoutTimer.getTimerConfig();

      assert.isObject(config);
      assert.hasProperty(config, "prepare");
      assert.hasProperty(config, "work");
      assert.hasProperty(config, "rest");
    });

    it("should set timer configuration", () => {
      const newConfig = {
        prepare: 15,
        work: 50,
        rest: 20,
        cyclesPerSet: 4,
        sets: 4,
        restBetweenSets: 90,
      };

      WorkoutTimer.setTimerConfig(newConfig);

      const config = WorkoutTimer.getTimerConfig();
      assert.equal(config.prepare, 15);
      assert.equal(config.work, 50);
      assert.equal(config.rest, 20);
    });

    it("should merge partial configuration updates", () => {
      const originalConfig = WorkoutTimer.getTimerConfig();

      WorkoutTimer.setTimerConfig({ prepare: 25 });

      const updatedConfig = WorkoutTimer.getTimerConfig();
      assert.equal(updatedConfig.prepare, 25);
      assert.equal(updatedConfig.work, originalConfig.work);
    });
  });

  describe("Timer State", () => {
    it("should not be running initially", () => {
      assert.isFalse(WorkoutTimer.isRunning());
    });

    it("should not be paused initially", () => {
      assert.isFalse(WorkoutTimer.isPaused());
    });

    it("should get timer state", () => {
      const state = WorkoutTimer.getTimerState();

      assert.isObject(state);
      // Note: isRunning is a computed value, not stored in state
      // The state object contains isPaused and phase
      assert.hasProperty(state, "isPaused");
      assert.hasProperty(state, "phase");
      assert.hasProperty(state, "exercise");
      assert.hasProperty(state, "currentSet");
      assert.hasProperty(state, "currentCycle");
    });

    it("should get current phase", () => {
      const phase = WorkoutTimer.getCurrentPhase();

      assert.isString(phase);
    });

    it("should get remaining time", () => {
      const remaining = WorkoutTimer.getRemainingTime();

      assert.isNumber(remaining);
      assert.isTrue(remaining >= 0);
    });

    it("should get current cycle", () => {
      const cycle = WorkoutTimer.getCurrentCycle();

      assert.isNumber(cycle);
      assert.isTrue(cycle >= 0);
    });

    it("should get current set", () => {
      const set = WorkoutTimer.getCurrentSet();

      assert.isNumber(set);
      assert.isTrue(set >= 0);
    });

    it("should get progress information", () => {
      const progress = WorkoutTimer.getProgress();

      assert.isNumber(progress);
      assert.isTrue(progress >= 0);
      assert.isTrue(progress <= 100);
    });
  });

  describe("Timer Control", () => {
    it("should start timer with exercise", () => {
      const result = WorkoutTimer.startTimer(sampleExercise, 0, 1);

      assert.isTrue(result);
      assert.isTrue(WorkoutTimer.isRunning());
    });

    it("should stop running timer", () => {
      WorkoutTimer.startTimer(sampleExercise, 0, 1);

      const result = WorkoutTimer.stopTimer();

      assert.isTrue(result);
      assert.isFalse(WorkoutTimer.isRunning());
    });

    it("should pause running timer", () => {
      WorkoutTimer.startTimer(sampleExercise, 0, 1);

      const result = WorkoutTimer.pauseTimer();

      assert.isTrue(result);
      assert.isTrue(WorkoutTimer.isPaused());
    });

    it("should resume paused timer", () => {
      WorkoutTimer.startTimer(sampleExercise, 0, 1);
      WorkoutTimer.pauseTimer();

      const result = WorkoutTimer.resumeTimer();

      assert.isTrue(result);
      assert.isFalse(WorkoutTimer.isPaused());
      assert.isTrue(WorkoutTimer.isRunning());
    });

    it("should not pause when not running", () => {
      const result = WorkoutTimer.pauseTimer();

      assert.isFalse(result);
    });

    it("should not resume when not paused", () => {
      const result = WorkoutTimer.resumeTimer();

      assert.isFalse(result);
    });

    it("should skip to next phase", () => {
      WorkoutTimer.startTimer(sampleExercise, 0, 1);

      const result = WorkoutTimer.skipPhase();

      assert.isTrue(result);
    });

    it("should reset exercise", () => {
      WorkoutTimer.startTimer(sampleExercise, 0, 1);

      const result = WorkoutTimer.resetExercise();

      assert.isTrue(result);
    });
  });

  describe("Timer Events", () => {
    it("should emit STARTED event when timer starts", (done) => {
      const handler = (event) => {
        assert.isObject(event.detail);
        assert.hasProperty(event.detail, "exercise");
        document.removeEventListener(
          WorkoutTimer.TIMER_EVENTS.STARTED,
          handler
        );
        WorkoutTimer.stopTimer();
        done();
      };

      document.addEventListener(WorkoutTimer.TIMER_EVENTS.STARTED, handler);
      WorkoutTimer.startTimer(sampleExercise, 0, 1);
    });

    it("should emit STOPPED event when timer stops", (done) => {
      const handler = (event) => {
        assert.isObject(event.detail);
        document.removeEventListener(
          WorkoutTimer.TIMER_EVENTS.STOPPED,
          handler
        );
        done();
      };

      document.addEventListener(WorkoutTimer.TIMER_EVENTS.STOPPED, handler);
      WorkoutTimer.startTimer(sampleExercise, 0, 1);
      WorkoutTimer.stopTimer();
    });

    it("should emit PAUSED event when timer pauses", (done) => {
      const handler = (event) => {
        assert.isObject(event.detail);
        document.removeEventListener(WorkoutTimer.TIMER_EVENTS.PAUSED, handler);
        WorkoutTimer.stopTimer();
        done();
      };

      document.addEventListener(WorkoutTimer.TIMER_EVENTS.PAUSED, handler);
      WorkoutTimer.startTimer(sampleExercise, 0, 1);
      WorkoutTimer.pauseTimer();
    });

    it("should emit RESUMED event when timer resumes", (done) => {
      const handler = (event) => {
        assert.isObject(event.detail);
        document.removeEventListener(
          WorkoutTimer.TIMER_EVENTS.RESUMED,
          handler
        );
        WorkoutTimer.stopTimer();
        done();
      };

      WorkoutTimer.startTimer(sampleExercise, 0, 1);
      WorkoutTimer.pauseTimer();

      document.addEventListener(WorkoutTimer.TIMER_EVENTS.RESUMED, handler);
      WorkoutTimer.resumeTimer();
    });
  });

  describe("Error Handling", () => {
    it("should handle starting timer without exercise", () => {
      const result = WorkoutTimer.startTimer(null, 0, 1);

      assert.isFalse(result);
    });

    it("should handle invalid exercise data", () => {
      const result = WorkoutTimer.startTimer({}, 0, 1);

      assert.isFalse(result);
    });

    it("should handle stopping when not running", () => {
      const result = WorkoutTimer.stopTimer();

      // Should handle gracefully
      assert.isFalse(WorkoutTimer.isRunning());
    });

    it("should handle invalid configuration", () => {
      assert.doesNotThrow(() => {
        WorkoutTimer.setTimerConfig(null);
        WorkoutTimer.setTimerConfig(undefined);
        WorkoutTimer.setTimerConfig({});
      });
    });
  });
});
