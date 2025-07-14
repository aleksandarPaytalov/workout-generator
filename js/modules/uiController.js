/**
 * UI Controller Module
 * Manages DOM manipulation, event handling, and user interface state
 */

const UIController = (() => {
  'use strict';

  // DOM element cache for performance
  let elements = {};
  let isInitialized = false;
  let currentWorkout = [];
  let currentMode = 'regenerate';

  /**
   * Cache DOM elements for efficient access
   */
  function cacheElements() {
    elements = {
      // Form elements
      workoutForm: document.getElementById('workoutForm'),
      exerciseCount: document.getElementById('exerciseCount'),
      exerciseCountDisplay: document.getElementById('exerciseCountDisplay'),
      operationModeInputs: document.querySelectorAll('input[name="operationMode"]'),
      muscleGroupInputs: document.querySelectorAll('input[name="muscleGroups"]'),
      
      // Action buttons
      generateBtn: document.getElementById('generateBtn'),
      clearBtn: document.getElementById('clearBtn'),
      retryBtn: document.getElementById('retryBtn'),
      exportPdfBtn: document.getElementById('exportPdfBtn'),
      undoBtn: document.getElementById('undoBtn'),
      redoBtn: document.getElementById('redoBtn'),
      
      // Display areas
      workoutHeader: document.getElementById('workoutHeader'),
      workoutCount: document.getElementById('workoutCount'),
      workoutGroups: document.getElementById('workoutGroups'),
      
      // State containers
      loadingState: document.getElementById('loadingState'),
      errorState: document.getElementById('errorState'),
      emptyState: document.getElementById('emptyState'),
      workoutList: document.getElementById('workoutList'),
      exerciseList: document.getElementById('exerciseList'),
      workoutActions: document.getElementById('workoutActions'),
      
      // Feedback areas
      validationFeedback: document.getElementById('validationFeedback'),
      validationMessage: document.getElementById('validationMessage'),
      errorMessage: document.getElementById('errorMessage'),
      workoutAnnouncements: document.getElementById('workoutAnnouncements')
    };

    // Validate that all critical elements exist
    const criticalElements = [
      'workoutForm', 'exerciseCount', 'generateBtn', 'exerciseList',
      'loadingState', 'errorState', 'emptyState', 'workoutList'
    ];

    const missingElements = criticalElements.filter(id => !elements[id]);
    if (missingElements.length > 0) {
      throw new Error(`Missing critical DOM elements: ${missingElements.join(', ')}`);
    }

    console.log('UIController: DOM elements cached successfully');
  }

  /**
   * Set up all event listeners with proper delegation
   */
  function setupEventListeners() {
    // Form submission for workout generation
    elements.workoutForm.addEventListener('submit', handleWorkoutGeneration);
    
    // Exercise count slider updates
    elements.exerciseCount.addEventListener('input', handleExerciseCountChange);
    
    // Operation mode changes
    elements.operationModeInputs.forEach(input => {
      input.addEventListener('change', handleOperationModeChange);
    });
    
    // Muscle group filter changes
    elements.muscleGroupInputs.forEach(input => {
      input.addEventListener('change', handleMuscleGroupChange);
    });
    
    // Action button handlers
    if (elements.clearBtn) {
      elements.clearBtn.addEventListener('click', handleClearWorkout);
    }
    
    if (elements.retryBtn) {
      elements.retryBtn.addEventListener('click', handleRetryGeneration);
    }
    
    if (elements.exportPdfBtn) {
      elements.exportPdfBtn.addEventListener('click', handlePdfExport);
    }
    
    if (elements.undoBtn) {
      elements.undoBtn.addEventListener('click', handleUndo);
    }
    
    if (elements.redoBtn) {
      elements.redoBtn.addEventListener('click', handleRedo);
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Event delegation for dynamic exercise list content
    if (elements.exerciseList) {
      elements.exerciseList.addEventListener('click', handleExerciseListClick);
      elements.exerciseList.addEventListener('change', handleExerciseListChange);
    }

    console.log('UIController: Event listeners set up successfully');
  }

  /**
   * Handle workout form submission
   */
  function handleWorkoutGeneration(event) {
    event.preventDefault();
    
    try {
      // Get form data
      const formData = getFormData();
      
      // Validate form data
      const validation = validateFormData(formData);
      if (!validation.isValid) {
        showValidationError(validation.errors.join('; '));
        return;
      }
      
      // Clear any existing validation messages
      hideValidationFeedback();
      
      // Show loading state
      showLoadingState();
      
      // Generate workout with slight delay to show loading state
      setTimeout(() => {
        try {
          const result = ExerciseGenerator.generateRandomWorkout(
            formData.exerciseCount,
            formData.enabledGroups,
            { evenDistribution: true }
          );
          
          if (result.success) {
            displayWorkout(result.workout, result.metadata);
            announceToScreenReader(`Workout generated successfully with ${result.workout.length} exercises`);
          } else {
            showErrorState('Failed to generate workout. Please try different settings.');
          }
        } catch (error) {
          console.error('Workout generation failed:', error);
          showErrorState(error.message || 'Failed to generate workout. Please try again.');
        }
      }, 300); // Brief delay to show loading state
      
    } catch (error) {
      console.error('Form handling error:', error);
      showErrorState('An error occurred while processing your request.');
    }
  }

  /**
   * Get current form data
   */
  function getFormData() {
    const exerciseCount = parseInt(elements.exerciseCount.value, 10);
    
    const operationMode = Array.from(elements.operationModeInputs)
      .find(input => input.checked)?.value || 'regenerate';
    
    const enabledGroups = Array.from(elements.muscleGroupInputs)
      .filter(input => input.checked)
      .map(input => input.value);
    
    return {
      exerciseCount,
      operationMode,
      enabledGroups
    };
  }

  /**
   * Validate form data before submission
   */
  function validateFormData(formData) {
    const errors = [];
    
    // Exercise count validation
    if (!Number.isInteger(formData.exerciseCount) || 
        formData.exerciseCount < 5 || 
        formData.exerciseCount > 20) {
      errors.push('Exercise count must be between 5 and 20');
    }
    
    // Muscle groups validation
    if (formData.enabledGroups.length === 0) {
      errors.push('At least one muscle group must be selected');
    }
    
    if (formData.enabledGroups.length === 1 && formData.exerciseCount > 1) {
      errors.push('Multiple exercises require at least two muscle groups to avoid consecutive targeting');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Handle exercise count slider changes
   */
  function handleExerciseCountChange(event) {
    const value = event.target.value;
    elements.exerciseCountDisplay.textContent = value;
    
    // Update ARIA value text for screen readers
    event.target.setAttribute('aria-valuetext', `${value} exercises`);
  }

  /**
   * Handle operation mode changes
   */
  function handleOperationModeChange(event) {
    currentMode = event.target.value;
    console.log(`Operation mode changed to: ${currentMode}`);
    
    // Update UI based on mode
    updateUIForMode(currentMode);
  }

  /**
   * Handle muscle group filter changes
   */
  function handleMuscleGroupChange(event) {
    const checkedGroups = Array.from(elements.muscleGroupInputs)
      .filter(input => input.checked);
    
    // Prevent unchecking all groups
    if (checkedGroups.length === 0) {
      event.target.checked = true;
      showValidationFeedback('At least one muscle group must be selected');
      return;
    }
    
    // Show warning if only one group selected
    if (checkedGroups.length === 1) {
      const exerciseCount = parseInt(elements.exerciseCount.value, 10);
      if (exerciseCount > 1) {
        showValidationFeedback(
          'Warning: Single muscle group with multiple exercises may not generate valid workouts'
        );
      }
    } else {
      hideValidationFeedback();
    }
  }

  /**
   * Handle clear workout action
   */
  function handleClearWorkout() {
    currentWorkout = [];
    showEmptyState();
    elements.clearBtn.disabled = true;
    announceToScreenReader('Workout cleared');
    
    // Clear replacement history
    if (typeof ExerciseGenerator !== 'undefined') {
      ExerciseGenerator.clearReplacementHistory();
    }
    
    updateHistoryButtons();
  }

  /**
   * Handle retry generation
   */
  function handleRetryGeneration() {
    // Re-trigger form submission
    elements.generateBtn.click();
  }

  /**
   * Handle PDF export
   */
  function handlePdfExport() {
    if (currentWorkout.length === 0) {
      showValidationFeedback('No workout to export. Generate a workout first.');
      return;
    }
    
    try {
      // This will be implemented in pdfExport.js module
      if (typeof PDFExporter !== 'undefined') {
        PDFExporter.exportWorkout(currentWorkout);
        announceToScreenReader('Workout exported as PDF');
      } else {
        throw new Error('PDF export module not available');
      }
    } catch (error) {
      console.error('PDF export failed:', error);
      showValidationFeedback('PDF export failed. Please try again.');
    }
  }

  /**
   * Handle undo action
   */
  function handleUndo() {
    try {
      if (typeof ExerciseGenerator !== 'undefined') {
        const result = ExerciseGenerator.undoReplacement(currentWorkout);
        if (result.success) {
          updateWorkoutDisplay();
          announceToScreenReader(result.message);
        } else {
          showValidationFeedback(result.message);
        }
        updateHistoryButtons();
      }
    } catch (error) {
      console.error('Undo failed:', error);
      showValidationFeedback('Undo failed. Please try again.');
    }
  }

  /**
   * Handle redo action
   */
  function handleRedo() {
    try {
      if (typeof ExerciseGenerator !== 'undefined') {
        const result = ExerciseGenerator.redoReplacement(currentWorkout);
        if (result.success) {
          updateWorkoutDisplay();
          announceToScreenReader(result.message);
        } else {
          showValidationFeedback(result.message);
        }
        updateHistoryButtons();
      }
    } catch (error) {
      console.error('Redo failed:', error);
      showValidationFeedback('Redo failed. Please try again.');
    }
  }

  /**
   * Handle keyboard shortcuts
   */
  function handleKeyboardShortcuts(event) {
    // Only handle shortcuts when not typing in form fields
    if (event.target.tagName === 'INPUT' || event.target.tagName === 'SELECT') {
      return;
    }
    
    switch (event.key) {
      case 'Enter':
        if (!event.ctrlKey && !event.shiftKey) {
          event.preventDefault();
          elements.generateBtn.click();
        }
        break;
        
      case 'Delete':
      case 'Backspace':
        if (event.ctrlKey) {
          event.preventDefault();
          handleClearWorkout();
        }
        break;
        
      case 'z':
        if (event.ctrlKey && !event.shiftKey) {
          event.preventDefault();
          handleUndo();
        }
        break;
        
      case 'y':
        if (event.ctrlKey) {
          event.preventDefault();
          handleRedo();
        }
        break;
        
      case 'p':
        if (event.ctrlKey) {
          event.preventDefault();
          handlePdfExport();
        }
        break;
    }
  }

  /**
   * Handle clicks within the exercise list (event delegation)
   */
  function handleExerciseListClick(event) {
    const exerciseCard = event.target.closest('.exercise-card');
    if (!exerciseCard) return;
    
    const exerciseIndex = parseInt(exerciseCard.dataset.index, 10);
    
    // Handle different click targets
    if (event.target.matches('.exercise-dropdown__trigger')) {
      handleDropdownToggle(event, exerciseIndex);
    } else if (event.target.matches('.exercise-dropdown__option')) {
      handleExerciseReplacement(event, exerciseIndex);
    }
  }

  /**
   * Handle changes within the exercise list (event delegation)
   */
  function handleExerciseListChange(event) {
    // Handle dropdown selection changes
    if (event.target.matches('.exercise-dropdown select')) {
      const exerciseCard = event.target.closest('.exercise-card');
      const exerciseIndex = parseInt(exerciseCard.dataset.index, 10);
      handleExerciseReplacement(event, exerciseIndex);
    }
  }

  /**
   * Handle exercise replacement dropdown toggle
   */
  function handleDropdownToggle(event, exerciseIndex) {
    // Implementation will depend on dropdown component structure
    console.log(`Toggle dropdown for exercise ${exerciseIndex}`);
  }

  /**
   * Handle individual exercise replacement
   */
  function handleExerciseReplacement(event, exerciseIndex) {
    const newExerciseId = event.target.value || event.target.dataset.exerciseId;
    
    if (!newExerciseId) return;
    
    try {
      // Get the new exercise from database
      const newExercise = ExerciseDatabase.getExerciseById(newExerciseId);
      
      // Perform replacement
      const result = ExerciseGenerator.replaceExercise(
        currentWorkout,
        exerciseIndex,
        newExercise
      );
      
      if (result.success) {
        updateWorkoutDisplay();
        announceToScreenReader(result.message);
        updateHistoryButtons();
      } else {
        showValidationFeedback(result.message || 'Replacement failed');
      }
      
    } catch (error) {
      console.error('Exercise replacement failed:', error);
      showValidationFeedback('Failed to replace exercise. Please try again.');
    }
  }

  /**
   * Display generated workout
   */
  function displayWorkout(workout, metadata = {}) {
    currentWorkout = [...workout]; // Store copy
    
    hideAllStates();
    renderWorkoutList(workout);
    updateWorkoutMetadata(workout, metadata);
    
    // Show workout elements
    elements.workoutHeader.hidden = false;
    elements.workoutList.hidden = false;
    elements.workoutActions.hidden = false;
    
    // Update UI for current mode
    updateUIForMode(currentMode);
    
    // Enable clear button
    elements.clearBtn.disabled = false;
    
    // Update history buttons
    updateHistoryButtons();
  }

  /**
   * Render the workout list with exercise cards
   */
  function renderWorkoutList(workout) {
    if (!elements.exerciseList) return;
    
    // Clear existing content
    elements.exerciseList.innerHTML = '';
    
    // Create document fragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();
    
    workout.forEach((exercise, index) => {
      const listItem = createExerciseListItem(exercise, index);
      fragment.appendChild(listItem);
    });
    
    elements.exerciseList.appendChild(fragment);
  }

  /**
   * Create a single exercise list item
   */
  function createExerciseListItem(exercise, index) {
    const li = document.createElement('li');
    li.className = 'exercise-list__item';
    
    const exerciseCard = document.createElement('div');
    exerciseCard.className = 'exercise-card';
    exerciseCard.draggable = true;
    exerciseCard.dataset.index = index;
    exerciseCard.dataset.exerciseId = exercise.id;
    exerciseCard.dataset.muscleGroup = exercise.muscleGroup;
    
    // Exercise number
    const number = document.createElement('div');
    number.className = 'exercise-card__number';
    number.textContent = index + 1;
    number.setAttribute('aria-label', `Exercise ${index + 1}`);
    
    // Exercise content
    const content = document.createElement('div');
    content.className = 'exercise-card__content';
    
    const name = document.createElement('h4');
    name.className = 'exercise-card__name';
    name.textContent = exercise.name;
    
    const muscleGroup = document.createElement('span');
    muscleGroup.className = 'exercise-card__muscle-group';
    muscleGroup.textContent = exercise.muscleGroup;
    
    content.appendChild(name);
    content.appendChild(muscleGroup);
    
    // Actions container
    const actions = document.createElement('div');
    actions.className = 'exercise-card__actions';
    
    // Replacement dropdown (if in replace mode)
    if (currentMode === 'replace') {
      const dropdown = createReplacementDropdown(exercise, index);
      actions.appendChild(dropdown);
    }
    
    // Drag handle
    const dragHandle = document.createElement('div');
    dragHandle.className = 'exercise-card__drag-handle';
    dragHandle.setAttribute('aria-label', 'Drag to reorder');
    dragHandle.setAttribute('title', 'Drag to reorder this exercise');
    actions.appendChild(dragHandle);
    
    // Assemble the card
    exerciseCard.appendChild(number);
    exerciseCard.appendChild(content);
    exerciseCard.appendChild(actions);
    
    li.appendChild(exerciseCard);
    return li;
  }

  /**
   * Create replacement dropdown for exercise
   */
  function createReplacementDropdown(currentExercise, index) {
    const dropdownContainer = document.createElement('div');
    dropdownContainer.className = 'exercise-dropdown';
    
    // Simple select for now - can be enhanced later
    const select = document.createElement('select');
    select.className = 'exercise-dropdown__trigger';
    select.setAttribute('aria-label', `Replace ${currentExercise.name}`);
    
    try {
      // Get replacement options
      const options = ExerciseGenerator.getReplacementOptions(index, currentWorkout);
      
      // Add current exercise as default
      const currentOption = document.createElement('option');
      currentOption.value = currentExercise.id;
      currentOption.textContent = currentExercise.name;
      currentOption.selected = true;
      select.appendChild(currentOption);
      
      // Add replacement options
      options.forEach(exercise => {
        const option = document.createElement('option');
        option.value = exercise.id;
        option.textContent = exercise.name;
        select.appendChild(option);
      });
      
      if (options.length === 0) {
        const noOptions = document.createElement('option');
        noOptions.textContent = 'No alternatives available';
        noOptions.disabled = true;
        select.appendChild(noOptions);
        select.disabled = true;
      }
      
    } catch (error) {
      console.error('Failed to get replacement options:', error);
      select.disabled = true;
      
      const errorOption = document.createElement('option');
      errorOption.textContent = 'Error loading options';
      select.appendChild(errorOption);
    }
    
    dropdownContainer.appendChild(select);
    return dropdownContainer;
  }

  /**
   * Update workout metadata display
   */
  function updateWorkoutMetadata(workout, metadata) {
    if (elements.workoutCount) {
      const count = workout.length;
      elements.workoutCount.textContent = `${count} exercise${count !== 1 ? 's' : ''}`;
    }
    
    if (elements.workoutGroups && metadata.muscleGroupsUsed) {
      const groups = metadata.muscleGroupsUsed.join(', ');
      elements.workoutGroups.textContent = `Muscle groups: ${groups}`;
    }
  }

  /**
   * Update UI based on operation mode
   */
  function updateUIForMode(mode) {
    // Re-render workout list if workout exists
    if (currentWorkout.length > 0) {
      renderWorkoutList(currentWorkout);
    }
    
    // Update instructions or help text based on mode
    const instructions = document.querySelector('.workout-list__instructions');
    if (instructions) {
      const modeText = mode === 'replace' 
        ? 'Use dropdowns to replace individual exercises. Drag to reorder.'
        : 'Generate new workouts to replace the entire list. Drag to reorder.';
      
      const modeP = instructions.querySelector('p');
      if (modeP) {
        modeP.innerHTML = `<strong>Current mode: ${mode === 'replace' ? 'Replace Individual' : 'Regenerate All'}</strong><br>${modeText}`;
      }
    }
  }

  /**
   * Update history button states
   */
  function updateHistoryButtons() {
    if (typeof ExerciseGenerator !== 'undefined') {
      const status = ExerciseGenerator.getReplacementHistoryStatus();
      
      if (elements.undoBtn) {
        elements.undoBtn.disabled = !status.canUndo;
      }
      
      if (elements.redoBtn) {
        elements.redoBtn.disabled = !status.canRedo;
      }
    }
  }

  /**
   * Update workout display after modifications
   */
  function updateWorkoutDisplay() {
    if (currentWorkout.length > 0) {
      renderWorkoutList(currentWorkout);
      updateWorkoutMetadata(currentWorkout);
    }
  }

  /**
   * Show loading state
   */
  function showLoadingState() {
    hideAllStates();
    elements.loadingState.hidden = false;
    elements.generateBtn.disabled = true;
  }

  /**
   * Show error state
   */
  function showErrorState(message) {
    hideAllStates();
    elements.errorState.hidden = false;
    if (elements.errorMessage) {
      elements.errorMessage.textContent = message;
    }
    elements.generateBtn.disabled = false;
    announceToScreenReader(`Error: ${message}`);
  }

  /**
   * Show empty state
   */
  function showEmptyState() {
    hideAllStates();
    elements.emptyState.hidden = false;
    elements.generateBtn.disabled = false;
  }

  /**
   * Hide all display states
   */
  function hideAllStates() {
    const states = [
      'loadingState', 'errorState', 'emptyState', 
      'workoutHeader', 'workoutList', 'workoutActions'
    ];
    
    states.forEach(state => {
      if (elements[state]) {
        elements[state].hidden = true;
      }
    });
    
    elements.generateBtn.disabled = false;
  }

  /**
   * Show validation feedback
   */
  function showValidationFeedback(message, type = 'info') {
    if (!elements.validationFeedback || !elements.validationMessage) return;
    
    elements.validationMessage.textContent = message;
    elements.validationFeedback.hidden = false;
    elements.validationFeedback.className = `validation-feedback validation-feedback--${type}`;
    
    // Auto-hide after 5 seconds
    setTimeout(hideValidationFeedback, 5000);
  }

  /**
   * Show validation error (alias for feedback with error type)
   */
  function showValidationError(message) {
    showValidationFeedback(message, 'error');
  }

  /**
   * Hide validation feedback
   */
  function hideValidationFeedback() {
    if (elements.validationFeedback) {
      elements.validationFeedback.hidden = true;
    }
  }

  /**
   * Announce message to screen readers
   */
  function announceToScreenReader(message) {
    if (elements.workoutAnnouncements) {
      elements.workoutAnnouncements.textContent = message;
      
      // Clear announcement after screen readers have had time to read it
      setTimeout(() => {
        elements.workoutAnnouncements.textContent = '';
      }, 1000);
    }
  }

  /**
   * Initialize the UI Controller
   */
  function init() {
    if (isInitialized) {
      console.warn('UIController: Already initialized');
      return;
    }
    
    try {
      cacheElements();
      setupEventListeners();
      
      // Set initial state
      showEmptyState();
      updateHistoryButtons();
      
      // Set initial exercise count display
      handleExerciseCountChange({ target: elements.exerciseCount });
      
      isInitialized = true;
      console.log('UIController: Initialized successfully');
      
    } catch (error) {
      console.error('UIController: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Get current application state (for debugging/testing)
   */
  function getState() {
    return {
      isInitialized,
      currentWorkout: [...currentWorkout],
      currentMode,
      formData: isInitialized ? getFormData() : null
    };
  }

  /**
   * Public API
   */
  return {
    // Initialization
    init,
    
    // State management
    getState,
    
    // Workout management
    displayWorkout,
    updateWorkoutDisplay,
    clearWorkout: handleClearWorkout,
    
    // UI state management
    showLoadingState,
    showErrorState,
    showEmptyState,
    showValidationFeedback,
    hideValidationFeedback,
    
    // Utility functions
    announceToScreenReader,
    updateHistoryButtons,
    
    // Internal access for testing
    _elements: () => elements,
    _isInitialized: () => isInitialized
  };
})();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = UIController;
} else {
  // Browser global
  window.UIController = UIController;
}
