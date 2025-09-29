/**
 * UI Controller Module
 *
 * Manages all DOM interactions, event handling, and UI state management.
 * Connects form interactions with workout generation logic.
 *
 * @namespace UIController
 */

// Use IIFE to create module namespace and prevent global pollution
const UIController = (() => {
  "use strict";

  // Private module state
  let isInitialized = false;
  let currentWorkout = [];
  let currentOperationMode = "regenerate";

  // Cached DOM elements - populated during initialization
  const elements = {
    // Form elements
    workoutForm: null,
    exerciseCount: null,
    exerciseCountValue: null,
    operationModeInputs: null,
    muscleGroupCheckboxes: null,
    generateBtn: null,
    clearBtn: null,

    // State containers
    emptyState: null,
    loadingState: null,
    errorState: null,
    errorMessage: null,
    workoutListContainer: null,

    // Workout display elements
    workoutList: null,
    currentExerciseCount: null,
    modeIndicator: null,
    workoutActions: null,
    exportPdfBtn: null,
    shuffleBtn: null,
  };

  /**
   * Initialize the module
   * Step 1: Set up module namespace and ES6 pattern
   * Step 2: Cache all DOM elements in init function
   * @private
   */
  const init = () => {
    if (isInitialized) {
      console.warn("UIController: Module already initialized");
      return;
    }

    // Verify required dependencies
    if (
      typeof ExerciseDatabase === "undefined" ||
      !ExerciseDatabase.isReady()
    ) {
      throw new Error(
        "UIController: ExerciseDatabase module is required and must be ready"
      );
    }

    if (typeof Validators === "undefined" || !Validators.isReady()) {
      throw new Error(
        "UIController: Validators module is required and must be ready"
      );
    }

    if (
      typeof ExerciseGenerator === "undefined" ||
      !ExerciseGenerator.isReady()
    ) {
      throw new Error(
        "UIController: ExerciseGenerator module is required and must be ready"
      );
    }

    // PDFExport is optional for core functionality, but log warning if missing
    if (typeof PDFExport === "undefined" || !PDFExport.isReady()) {
      console.warn(
        "UIController: PDFExport module not available - export functionality will be limited"
      );
    }

    // Cache all DOM elements
    cacheElements();

    // Step 3: Set up event listeners for form submission and input changes
    setupEventListeners();

    // Initialize UI state
    showEmptyState();
    updateModeIndicator();
    updateExerciseCountDisplay();

    console.log("UIController: Module initialized successfully");
    isInitialized = true;
  };

  /**
   * Cache all required DOM elements
   * @private
   */
  const cacheElements = () => {
    // Form elements
    elements.workoutForm = document.getElementById("workoutForm");
    elements.exerciseCount = document.getElementById("exerciseCount");
    elements.exerciseCountValue = document.getElementById("exerciseCountValue");
    elements.operationModeInputs = document.querySelectorAll(
      'input[name="operationMode"]'
    );
    elements.muscleGroupCheckboxes = document.querySelectorAll(
      'input[name="muscleGroups"]'
    );
    elements.generateBtn = document.getElementById("generateBtn");
    elements.clearBtn = document.getElementById("clearBtn");

    // State containers
    elements.emptyState = document.getElementById("emptyState");
    elements.loadingState = document.getElementById("loadingState");
    elements.errorState = document.getElementById("errorState");
    elements.errorMessage = document.getElementById("errorMessage");
    elements.workoutListContainer = document.getElementById(
      "workoutListContainer"
    );

    // Workout display elements
    elements.workoutList = document.getElementById("workoutList");
    elements.currentExerciseCount = document.getElementById(
      "currentExerciseCount"
    );
    elements.modeIndicator = document.getElementById("modeIndicator");
    elements.workoutActions = document.getElementById("workoutActions");
    elements.exportPdfBtn = document.getElementById("exportPdfBtn");
    elements.shuffleBtn = document.getElementById("shuffleBtn");

    // Validate that critical elements exist
    const requiredElements = [
      "workoutForm",
      "exerciseCount",
      "exerciseCountValue",
      "generateBtn",
      "emptyState",
      "loadingState",
      "errorState",
      "workoutList",
    ];

    for (const elementName of requiredElements) {
      if (!elements[elementName]) {
        throw new Error(
          `UIController: Required element "${elementName}" not found in DOM`
        );
      }
    }
  };

  /**
   * Set up all event listeners
   * @private
   */
  const setupEventListeners = () => {
    // Form submission
    elements.workoutForm.addEventListener("submit", handleFormSubmit);

    // Exercise count slider
    elements.exerciseCount.addEventListener(
      "input",
      updateExerciseCountDisplay
    );

    // Operation mode change
    elements.operationModeInputs.forEach((input) => {
      input.addEventListener("change", handleOperationModeChange);
    });

    // Clear button
    elements.clearBtn.addEventListener("click", handleClearWorkout);

    // Export and shuffle buttons (will be implemented in later tasks)
    if (elements.exportPdfBtn) {
      elements.exportPdfBtn.addEventListener("click", handleExportPdf);
    }

    if (elements.shuffleBtn) {
      elements.shuffleBtn.addEventListener("click", handleShuffleWorkout);
    }
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
   * Step 4: Show loading state
   * @public
   */
  const showLoadingState = () => {
    console.log("UIController: Showing loading state");
    hideAllStates();
    elements.loadingState.hidden = false;
    elements.loadingState.style.display = "flex";
    elements.generateBtn.disabled = true;
    elements.generateBtn.textContent = "Generating...";
  };

  /**
   * Step 4: Show error state with message
   * @param {string} message - Error message to display
   * @public
   */
  const showErrorState = (
    message = "An error occurred while generating the workout."
  ) => {
    console.log("UIController: Showing error state");
    hideAllStates();
    elements.errorState.hidden = false;
    elements.errorState.style.display = "flex";
    if (elements.errorMessage) {
      elements.errorMessage.textContent = message;
    }
    resetGenerateButton();
  };

  /**
   * Step 4: Show empty state
   * @public
   */
  const showEmptyState = () => {
    console.log("UIController: Showing empty state");
    hideAllStates();
    elements.emptyState.hidden = false;
    elements.emptyState.style.display = "flex";
    resetGenerateButton();
    currentWorkout = [];
    updateWorkoutActions();
  };

  /**
   * Show populated state with workout list
   * @private
   */
  const showPopulatedState = () => {
    console.log("UIController: Showing populated state");
    hideAllStates();
    elements.workoutListContainer.hidden = false;
    elements.workoutListContainer.style.display = "block";
    resetGenerateButton();
    updateWorkoutActions();
  };

  /**
   * Hide all state containers
   * @private
   */
  const hideAllStates = () => {
    // Hide all states and ensure they're not displayed
    elements.emptyState.hidden = true;
    elements.emptyState.style.display = "none";

    elements.loadingState.hidden = true;
    elements.loadingState.style.display = "none";

    elements.errorState.hidden = true;
    elements.errorState.style.display = "none";

    elements.workoutListContainer.hidden = true;
    elements.workoutListContainer.style.display = "none";
  };

  /**
   * Reset generate button to default state
   * @private
   */
  const resetGenerateButton = () => {
    elements.generateBtn.disabled = false;
    elements.generateBtn.textContent = "Generate Workout";
  };

  /**
   * Update exercise count display
   * @private
   */
  const updateExerciseCountDisplay = () => {
    const count = elements.exerciseCount.value;
    elements.exerciseCountValue.textContent = count;
  };

  /**
   * Update mode indicator text
   * @private
   */
  const updateModeIndicator = () => {
    if (elements.modeIndicator) {
      const modeText =
        currentOperationMode === "regenerate"
          ? "Regenerate Mode"
          : "Replace Mode";
      elements.modeIndicator.textContent = `• ${modeText}`;
    }
  };

  /**
   * Update workout actions (enable/disable buttons)
   * @private
   */
  const updateWorkoutActions = () => {
    const hasWorkout = currentWorkout.length > 0;

    if (elements.exportPdfBtn) {
      elements.exportPdfBtn.disabled = !hasWorkout;
    }

    if (elements.shuffleBtn) {
      elements.shuffleBtn.disabled = !hasWorkout;
    }
  };

  /**
   * Step 5: Render workout list with exercises
   * @param {Array} exercises - Array of exercise objects to display
   * @param {boolean} isNewWorkout - Whether this is a new workout (for stats tracking)
   * @public
   */
  const renderWorkoutList = (exercises, isNewWorkout = false) => {
    if (!Array.isArray(exercises)) {
      throw new Error(
        "UIController: renderWorkoutList expects an array of exercises"
      );
    }

    // Clear existing list
    elements.workoutList.innerHTML = "";

    // Update exercise count display
    if (elements.currentExerciseCount) {
      elements.currentExerciseCount.textContent = exercises.length;
    }

    // Create list items for each exercise
    exercises.forEach((exercise, index) => {
      const listItem = createExerciseListItem(exercise, index);
      elements.workoutList.appendChild(listItem);
    });

    // Store current workout
    currentWorkout = [...exercises];

    // Make exercises draggable if DragDrop module is available
    if (typeof DragDrop !== "undefined" && DragDrop.isReady()) {
      try {
        DragDrop.makeDraggable(elements.workoutList);
        console.log("UIController: Drag and drop functionality enabled");
      } catch (error) {
        console.warn(
          "UIController: Could not enable drag and drop:",
          error.message
        );
      }
    }

    // Update footer stats if this is a new workout
    if (
      isNewWorkout &&
      typeof FooterController !== "undefined" &&
      FooterController.isReady()
    ) {
      FooterController.incrementWorkoutCount();
      FooterController.addExerciseCount(exercises.length);
    }

    // Show populated state
    showPopulatedState();
  };

  /**
   * Create individual exercise list item
   * @param {Object} exercise - Exercise object with id, name, muscleGroup
   * @param {number} index - Position in workout (0-based)
   * @returns {HTMLElement} List item element
   * @private
   */
  const createExerciseListItem = (exercise, index) => {
    const li = document.createElement("li");
    li.className = "workout-exercise";
    li.setAttribute("data-exercise-id", exercise.id);
    li.setAttribute("data-muscle-group", exercise.muscleGroup);

    // Exercise number and name
    const exerciseNumber = document.createElement("span");
    exerciseNumber.className = "exercise-number";
    exerciseNumber.textContent = `${index + 1}.`;

    const exerciseName = document.createElement("span");
    exerciseName.className = "exercise-name";
    exerciseName.textContent = exercise.name;

    const muscleGroup = document.createElement("span");
    muscleGroup.className = "exercise-muscle-group";
    muscleGroup.textContent = ExerciseDatabase.getMuscleGroupLabel(
      exercise.muscleGroup
    );

    // Container for exercise info
    const exerciseInfo = document.createElement("div");
    exerciseInfo.className = "exercise-info";
    exerciseInfo.appendChild(exerciseNumber);
    exerciseInfo.appendChild(exerciseName);
    exerciseInfo.appendChild(muscleGroup);

    li.appendChild(exerciseInfo);

    // Add replacement dropdown for replace mode (will be enhanced in later tasks)
    if (currentOperationMode === "replace") {
      const replaceContainer = createReplaceDropdown(exercise, index);
      li.appendChild(replaceContainer);
    }

    return li;
  };

  /**
   * Create replacement dropdown for replace mode
   * @param {Object} exercise - Current exercise
   * @param {number} index - Exercise position
   * @returns {HTMLElement} Dropdown container
   * @private
   */
  const createReplaceDropdown = (exercise, index) => {
    const container = document.createElement("div");
    container.className = "replace-dropdown-container";

    const select = document.createElement("select");
    select.className = "replace-dropdown";
    select.setAttribute("data-exercise-index", index);

    // Default option
    const defaultOption = document.createElement("option");
    defaultOption.value = "";
    defaultOption.textContent = "Replace with...";
    select.appendChild(defaultOption);

    // Get replacement options
    try {
      const replacementOptions = ExerciseGenerator.getReplacementOptions(
        index,
        currentWorkout
      );

      replacementOptions.forEach((option) => {
        const optionElement = document.createElement("option");
        optionElement.value = option.id;
        optionElement.textContent = option.name;
        select.appendChild(optionElement);
      });

      // Add change event listener
      select.addEventListener("change", (e) =>
        handleExerciseReplacement(e, index)
      );
    } catch (error) {
      console.warn(
        `UIController: Could not generate replacement options for exercise at index ${index}:`,
        error.message
      );
    }

    container.appendChild(select);
    return container;
  };

  /**
   * Step 6: Collect and validate form data
   * @returns {Object} Form data object
   * @private
   */
  const collectFormData = () => {
    // Get exercise count
    const exerciseCount = parseInt(elements.exerciseCount.value, 10);

    // Get operation mode
    const operationMode =
      Array.from(elements.operationModeInputs).find((input) => input.checked)
        ?.value || "regenerate";

    // Get enabled muscle groups
    const enabledMuscleGroups = Array.from(elements.muscleGroupCheckboxes)
      .filter((checkbox) => checkbox.checked)
      .map((checkbox) => checkbox.value);

    return {
      exerciseCount,
      operationMode,
      enabledMuscleGroups,
    };
  };

  /**
   * Validate form data
   * @param {Object} formData - Form data to validate
   * @returns {Object} Validation result with isValid and errors
   * @private
   */
  const validateFormData = (formData) => {
    const errors = [];

    // Validate exercise count
    if (
      !Number.isInteger(formData.exerciseCount) ||
      formData.exerciseCount < 4 ||
      formData.exerciseCount > 20
    ) {
      errors.push("Exercise count must be between 4 and 20");
    }

    // Validate muscle groups
    if (formData.enabledMuscleGroups.length === 0) {
      errors.push("At least one muscle group must be selected");
    }

    // Check constraint feasibility
    if (
      formData.enabledMuscleGroups.length === 1 &&
      formData.exerciseCount > 1
    ) {
      errors.push(
        "Cannot generate workout with single muscle group and multiple exercises (violates constraint)"
      );
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  };

  /**
   * Step 7: Handle form submission and connect to workout generation
   * @param {Event} event - Form submit event
   * @private
   */
  const handleFormSubmit = (event) => {
    event.preventDefault();

    try {
      // Step 6: Collect and validate form data
      const formData = collectFormData();
      const validation = validateFormData(formData);

      if (!validation.isValid) {
        showErrorState(validation.errors.join(". "));
        return;
      }

      // Update current operation mode
      currentOperationMode = formData.operationMode;
      updateModeIndicator();

      // Show loading state
      showLoadingState();

      // Generate workout using ExerciseGenerator
      setTimeout(() => {
        try {
          const workout = ExerciseGenerator.generateRandomWorkout(
            formData.exerciseCount,
            formData.enabledMuscleGroups
          );

          // Render the generated workout
          renderWorkoutList(workout, true); // true = new workout for stats
        } catch (error) {
          console.error("UIController: Workout generation failed:", error);
          showErrorState(error.message);
        }
      }, 500); // Slightly longer delay so user can see loading state
    } catch (error) {
      console.error("UIController: Form submission failed:", error);
      showErrorState("Failed to process form data. Please try again.");
    }
  };

  /**
   * Handle operation mode change
   * @param {Event} event - Radio button change event
   * @private
   */
  const handleOperationModeChange = (event) => {
    currentOperationMode = event.target.value;
    updateModeIndicator();

    // Re-render current workout if it exists to show/hide dropdowns
    if (currentWorkout.length > 0) {
      renderWorkoutList(currentWorkout);
    }
  };

  /**
   * Handle exercise replacement in replace mode
   * @param {Event} event - Select change event
   * @param {number} index - Exercise index to replace
   * @private
   */
  const handleExerciseReplacement = (event, index) => {
    const newExerciseId = event.target.value;

    if (!newExerciseId) {
      return; // No selection made
    }

    try {
      // Get the new exercise from database
      const newExercise = ExerciseDatabase.getExerciseById(newExerciseId);

      if (!newExercise) {
        throw new Error("Selected exercise not found in database");
      }

      // Replace exercise using ExerciseGenerator
      const updatedWorkout = ExerciseGenerator.replaceExercise(
        currentWorkout,
        index,
        newExercise
      );

      // Re-render workout with updated exercise
      renderWorkoutList(updatedWorkout);
    } catch (error) {
      console.error("UIController: Exercise replacement failed:", error);
      showErrorState(`Failed to replace exercise: ${error.message}`);

      // Reset dropdown to default
      event.target.selectedIndex = 0;
    }
  };

  /**
   * Handle clear workout button
   * @private
   */
  const handleClearWorkout = () => {
    showEmptyState();

    // Reset footer stats
    if (typeof FooterController !== "undefined" && FooterController.isReady()) {
      FooterController.resetStats();
    }
  };

  /**
   * Handle PDF export
   * @private
   */
  const handleExportPdf = () => {
    if (currentWorkout.length === 0) {
      console.warn("UIController: No workout to export");
      return;
    }

    try {
      // Check if PDFExport module is available
      if (typeof PDFExport === "undefined" || !PDFExport.isReady()) {
        throw new Error("PDF export module is not available");
      }

      // Show brief loading state on button
      const originalText = elements.exportPdfBtn.textContent;
      elements.exportPdfBtn.disabled = true;
      elements.exportPdfBtn.textContent = "Exporting...";

      // Export workout (with fallback to text if PDF fails)
      PDFExport.exportWorkout(currentWorkout, {
        format: "pdf",
        fallbackToText: true,
      });

      // Reset button after a brief delay
      setTimeout(() => {
        elements.exportPdfBtn.disabled = false;
        elements.exportPdfBtn.textContent = originalText;
      }, 1000);
    } catch (error) {
      console.error("UIController: PDF export failed:", error);

      // Reset button
      elements.exportPdfBtn.disabled = false;
      elements.exportPdfBtn.textContent = "Export PDF";

      // Show error to user
      showErrorState(`Export failed: ${error.message}`);
    }
  };

  /**
   * Handle shuffle workout - generates only valid orderings
   * @private
   */
  const handleShuffleWorkout = () => {
    if (currentWorkout.length === 0) {
      return;
    }

    try {
      // Try to find a valid shuffle with multiple attempts
      const maxAttempts = 50;
      let validShuffle = null;

      for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const shuffled = ExerciseGenerator.shuffleArray(currentWorkout);

        // Check if this shuffle maintains constraints
        if (Validators.isValidWorkout(shuffled)) {
          validShuffle = shuffled;
          break;
        }
      }

      // If no valid shuffle found, try to create one using constraint-aware reordering
      if (!validShuffle) {
        validShuffle = generateValidReordering(currentWorkout);
      }

      // If still no valid shuffle, keep current order
      if (!validShuffle) {
        console.warn(
          "UIController: Could not generate valid shuffle, keeping current order"
        );
        return;
      }

      renderWorkoutList(validShuffle);
    } catch (error) {
      console.error("UIController: Shuffle failed:", error);
      showErrorState(`Failed to shuffle workout: ${error.message}`);
    }
  };

  /**
   * Generate a valid reordering using constraint-aware algorithm
   * @param {Array} workout - Current workout to reorder
   * @returns {Array|null} Valid reordering or null if impossible
   * @private
   */
  const generateValidReordering = (workout) => {
    try {
      // Group exercises by muscle group
      const exercisesByGroup = {};
      workout.forEach((exercise) => {
        if (!exercisesByGroup[exercise.muscleGroup]) {
          exercisesByGroup[exercise.muscleGroup] = [];
        }
        exercisesByGroup[exercise.muscleGroup].push(exercise);
      });

      // Get muscle groups and shuffle them
      const muscleGroups = Object.keys(exercisesByGroup);
      const shuffledGroups = ExerciseGenerator.shuffleArray(muscleGroups);

      // Create valid ordering by alternating between different muscle groups
      const validOrdering = [];
      const groupCounters = {};

      // Initialize counters
      shuffledGroups.forEach((group) => {
        groupCounters[group] = 0;
      });

      // Build workout ensuring no consecutive same muscle groups
      for (let i = 0; i < workout.length; i++) {
        let exerciseAdded = false;

        // Try each muscle group in shuffled order
        for (const group of shuffledGroups) {
          // Skip if this group was used in previous exercise
          if (i > 0 && validOrdering[i - 1].muscleGroup === group) {
            continue;
          }

          // Check if this group has remaining exercises
          if (groupCounters[group] < exercisesByGroup[group].length) {
            validOrdering.push(exercisesByGroup[group][groupCounters[group]]);
            groupCounters[group]++;
            exerciseAdded = true;
            break;
          }
        }

        // If no exercise could be added, ordering is impossible
        if (!exerciseAdded) {
          return null;
        }
      }

      return validOrdering;
    } catch (error) {
      console.error("UIController: Valid reordering generation failed:", error);
      return null;
    }
  };

  /**
   * Get current workout (for external access)
   * @returns {Array} Current workout array
   * @public
   */
  const getCurrentWorkout = () => {
    return [...currentWorkout];
  };

  /**
   * Get current operation mode (for external access)
   * @returns {string} Current operation mode
   * @public
   */
  const getCurrentOperationMode = () => {
    return currentOperationMode;
  };

  // Public API - expose these functions to other modules
  const publicAPI = {
    init,
    isReady,
    showLoadingState,
    showErrorState,
    showEmptyState,
    renderWorkoutList,
    getCurrentWorkout,
    getCurrentOperationMode,
  };

  // Don't auto-initialize - wait for DOM ready
  // init() will be called from app.js

  // Return public interface
  return publicAPI;
})();

// Verify module loaded correctly
if (typeof UIController === "undefined") {
  throw new Error("UIController module failed to load");
}

// Optional: Add to global scope for debugging (remove in production)
if (typeof window !== "undefined") {
  window.UIController = UIController;
}
