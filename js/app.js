/**
 * Main Application Entry Point
 * Initializes and coordinates all modules
 */

const WorkoutApp = (() => {
  'use strict';

  // Application state
  let isInitialized = false;
  let initializationErrors = [];
  
  // Module dependencies
  const REQUIRED_MODULES = [
    'ExerciseDatabase',
    'ConstraintValidator', 
    'ExerciseGenerator',
    'UIController'
  ];
  
  const OPTIONAL_MODULES = [
    'DragDropHandler',
    'PDFExporter'
  ];

  /**
   * Check if all required modules are available
   */
  function checkModuleDependencies() {
    const missing = [];
    const available = [];
    
    REQUIRED_MODULES.forEach(moduleName => {
      if (typeof window[moduleName] !== 'undefined') {
        available.push(moduleName);
      } else {
        missing.push(moduleName);
      }
    });
    
    console.log(`Available modules: ${available.join(', ')}`);
    
    if (missing.length > 0) {
      console.error(`Missing required modules: ${missing.join(', ')}`);
      return { success: false, missing };
    }
    
    // Check optional modules
    const optionalAvailable = [];
    const optionalMissing = [];
    
    OPTIONAL_MODULES.forEach(moduleName => {
      if (typeof window[moduleName] !== 'undefined') {
        optionalAvailable.push(moduleName);
      } else {
        optionalMissing.push(moduleName);
      }
    });
    
    if (optionalMissing.length > 0) {
      console.warn(`Optional modules not available: ${optionalMissing.join(', ')}`);
    }
    
    return { 
      success: true, 
      available, 
      optionalAvailable, 
      optionalMissing 
    };
  }

  /**
   * Initialize the exercise database
   */
  function initializeDatabase() {
    try {
      console.log('Initializing Exercise Database...');
      
      if (typeof ExerciseDatabase.initializeDatabase === 'function') {
        const result = ExerciseDatabase.initializeDatabase();
        
        if (!result.success) {
          throw new Error(`Database initialization failed: ${result.errors.join(', ')}`);
        }
        
        console.log(`✓ Exercise Database initialized: ${result.totalExercises} exercises loaded`);
        return { success: true, result };
      } else {
        console.log('✓ Exercise Database already initialized');
        return { success: true };
      }
      
    } catch (error) {
      const errorMsg = `Exercise Database initialization failed: ${error.message}`;
      console.error(errorMsg);
      initializationErrors.push(errorMsg);
      return { success: false, error: error.message };
    }
  }

  /**
   * Test core functionality
   */
  function testCoreFunctionality() {
    const tests = [];
    
    try {
      // Test database access
      console.log('Testing database access...');
      const allGroups = ExerciseDatabase.getAllMuscleGroups();
      const allExercises = ExerciseDatabase.getAllExercises();
      
      if (allGroups.length < 6) {
        throw new Error(`Expected at least 6 muscle groups, got ${allGroups.length}`);
      }
      
      if (allExercises.length < 48) {
        throw new Error(`Expected at least 48 exercises, got ${allExercises.length}`);
      }
      
      tests.push('✓ Database access test passed');
      
      // Test constraint validation
      console.log('Testing constraint validation...');
      const testWorkout = [
        { id: 'chest_001', name: 'Push-ups', muscleGroup: 'chest' },
        { id: 'back_001', name: 'Pull-ups', muscleGroup: 'back' },
        { id: 'legs_001', name: 'Squats', muscleGroup: 'legs' }
      ];
      
      const isValid = ConstraintValidator.isValidWorkout(testWorkout);
      if (!isValid) {
        throw new Error('Valid test workout failed validation');
      }
      
      const invalidWorkout = [
        { id: 'chest_001', name: 'Push-ups', muscleGroup: 'chest' },
        { id: 'chest_002', name: 'Bench Press', muscleGroup: 'chest' }
      ];
      
      const isInvalid = ConstraintValidator.isValidWorkout(invalidWorkout);
      if (isInvalid) {
        throw new Error('Invalid test workout passed validation');
      }
      
      tests.push('✓ Constraint validation test passed');
      
      // Test workout generation
      console.log('Testing workout generation...');
      const workout = ExerciseGenerator.generateQuickWorkout(5);
      
      if (!Array.isArray(workout) || workout.length !== 5) {
        throw new Error(`Expected 5 exercises, got ${workout?.length || 'undefined'}`);
      }
      
      const generatedIsValid = ConstraintValidator.isValidWorkout(workout);
      if (!generatedIsValid) {
        throw new Error('Generated workout failed constraint validation');
      }
      
      tests.push('✓ Workout generation test passed');
      
      console.log('Core functionality tests completed successfully');
      return { success: true, tests };
      
    } catch (error) {
      const errorMsg = `Core functionality test failed: ${error.message}`;
      console.error(errorMsg);
      initializationErrors.push(errorMsg);
      return { success: false, error: error.message, tests };
    }
  }

  /**
   * Initialize the UI Controller
   */
  function initializeUI() {
    try {
      console.log('Initializing UI Controller...');
      
      UIController.init();
      
      console.log('✓ UI Controller initialized');
      return { success: true };
      
    } catch (error) {
      const errorMsg = `UI Controller initialization failed: ${error.message}`;
      console.error(errorMsg);
      initializationErrors.push(errorMsg);
      return { success: false, error: error.message };
    }
  }

  /**
   * Initialize optional modules
   */
  function initializeOptionalModules() {
    const results = {};
    
    // Initialize drag & drop if available
    if (typeof DragDropHandler !== 'undefined') {
      try {
        console.log('Initializing Drag & Drop Handler...');
        DragDropHandler.init();
        results.dragDrop = { success: true };
        console.log('✓ Drag & Drop Handler initialized');
      } catch (error) {
        console.warn(`Drag & Drop Handler initialization failed: ${error.message}`);
        results.dragDrop = { success: false, error: error.message };
      }
    } else {
      console.log('Drag & Drop Handler not available - skipping');
      results.dragDrop = { success: false, error: 'Module not available' };
    }
    
    // Initialize PDF export if available
    if (typeof PDFExporter !== 'undefined') {
      try {
        console.log('Initializing PDF Exporter...');
        PDFExporter.init();
        results.pdfExport = { success: true };
        console.log('✓ PDF Exporter initialized');
      } catch (error) {
        console.warn(`PDF Exporter initialization failed: ${error.message}`);
        results.pdfExport = { success: false, error: error.message };
      }
    } else {
      console.log('PDF Exporter not available - skipping');
      results.pdfExport = { success: false, error: 'Module not available' };
    }
    
    return results;
  }

  /**
   * Show initialization error to user
   */
  function showInitializationError(errors) {
    const errorContainer = document.createElement('div');
    errorContainer.style.cssText = `
      position: fixed;
      top: 20px;
      left: 20px;
      right: 20px;
      background: #f8d7da;
      border: 1px solid #f5c6cb;
      color: #721c24;
      padding: 20px;
      border-radius: 8px;
      z-index: 9999;
      font-family: system-ui, sans-serif;
      max-width: 600px;
      margin: 0 auto;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    errorContainer.innerHTML = `
      <h3 style="margin: 0 0 10px 0; color: #721c24;">Application Initialization Failed</h3>
      <p style="margin: 0 0 10px 0;">The Workout Generator failed to start properly. Please refresh the page to try again.</p>
      <details style="margin-top: 10px;">
        <summary style="cursor: pointer; font-weight: bold;">Technical Details</summary>
        <ul style="margin: 10px 0 0 20px; padding: 0;">
          ${errors.map(error => `<li>${error}</li>`).join('')}
        </ul>
      </details>
      <button onclick="location.reload()" style="
        margin-top: 15px;
        padding: 8px 16px;
        background: #721c24;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">Refresh Page</button>
    `;
    
    document.body.insertBefore(errorContainer, document.body.firstChild);
  }

  /**
   * Show initialization success message (optional)
   */
  function showInitializationSuccess(stats) {
    // Only show in development/debug mode
    if (new URLSearchParams(window.location.search).has('debug')) {
      console.log(`
🎯 Workout Generator Initialized Successfully!

📊 Database Stats:
   • Total Exercises: ${stats.totalExercises}
   • Muscle Groups: ${stats.muscleGroups}
   • Exercises per Group: ${Object.entries(stats.exercisesByGroup).map(([group, count]) => `${group}: ${count}`).join(', ')}

🧪 Tests: All core functionality tests passed
🎨 UI: Ready for user interaction
${stats.optionalModules ? `🔧 Optional: ${Object.entries(stats.optionalModules).map(([module, result]) => `${module}: ${result.success ? '✓' : '✗'}`).join(', ')}` : ''}

Ready to generate some amazing workouts! 💪
      `);
    }
  }

  /**
   * Main application initialization
   */
  function init() {
    if (isInitialized) {
      console.warn('WorkoutApp: Already initialized');
      return { success: true, message: 'Already initialized' };
    }
    
    console.log('🚀 Starting Workout Generator...');
    initializationErrors = [];
    
    try {
      // Step 1: Check module dependencies
      console.log('Step 1: Checking module dependencies...');
      const dependencyCheck = checkModuleDependencies();
      if (!dependencyCheck.success) {
        throw new Error(`Missing required modules: ${dependencyCheck.missing.join(', ')}`);
      }
      
      // Step 2: Initialize database
      console.log('Step 2: Initializing database...');
      const dbResult = initializeDatabase();
      if (!dbResult.success) {
        throw new Error('Database initialization failed');
      }
      
      // Step 3: Test core functionality
      console.log('Step 3: Testing core functionality...');
      const testResult = testCoreFunctionality();
      if (!testResult.success) {
        throw new Error('Core functionality tests failed');
      }
      
      // Step 4: Initialize UI
      console.log('Step 4: Initializing user interface...');
      const uiResult = initializeUI();
      if (!uiResult.success) {
        throw new Error('UI initialization failed');
      }
      
      // Step 5: Initialize optional modules
      console.log('Step 5: Initializing optional modules...');
      const optionalResults = initializeOptionalModules();
      
      // Mark as initialized
      isInitialized = true;
      
      // Gather stats for success message
      const stats = {
        totalExercises: ExerciseDatabase.getAllExercises().length,
        muscleGroups: ExerciseDatabase.getAllMuscleGroups().length,
        exercisesByGroup: ExerciseDatabase.getExerciseCounts(),
        optionalModules: optionalResults
      };
      
      showInitializationSuccess(stats);
      
      console.log('✅ Workout Generator initialized successfully!');
      
      return {
        success: true,
        message: 'Application initialized successfully',
        stats,
        optionalModules: optionalResults
      };
      
    } catch (error) {
      console.error('❌ Workout Generator initialization failed:', error);
      initializationErrors.push(error.message);
      
      // Show error to user
      showInitializationError(initializationErrors);
      
      return {
        success: false,
        error: error.message,
        errors: initializationErrors
      };
    }
  }

  /**
   * Get application information
   */
  function getInfo() {
    const info = {
      name: 'Workout Generator',
      version: '1.0.0',
      initialized: isInitialized,
      errors: [...initializationErrors]
    };
    
    if (isInitialized) {
      try {
        info.stats = {
          totalExercises: ExerciseDatabase.getAllExercises().length,
          muscleGroups: ExerciseDatabase.getAllMuscleGroups().length,
          exercisesByGroup: ExerciseDatabase.getExerciseCounts()
        };
        
        if (typeof UIController !== 'undefined') {
          info.uiState = UIController.getState();
        }
      } catch (error) {
        console.warn('Failed to gather application stats:', error);
      }
    }
    
    return info;
  }

  /**
   * Restart the application (for error recovery)
   */
  function restart() {
    console.log('Restarting Workout Generator...');
    
    isInitialized = false;
    initializationErrors = [];
    
    // Clear any error messages
    const existingErrors = document.querySelectorAll('[style*="position: fixed"][style*="background: #f8d7da"]');
    existingErrors.forEach(el => el.remove());
    
    // Re-initialize
    return init();
  }

  /**
   * Emergency fallback function
   */
  function emergencyMode() {
    console.warn('Entering emergency mode - basic functionality only');
    
    try {
      // Try to at least show the form
      const form = document.getElementById('workoutForm');
      const errorStates = document.querySelectorAll('#loadingState, #errorState');
      const emptyState = document.getElementById('emptyState');
      
      errorStates.forEach(el => el.hidden = true);
      if (emptyState) emptyState.hidden = false;
      
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          alert('Workout Generator is experiencing technical difficulties. Please refresh the page to try again.');
        });
      }
      
      return { success: true, mode: 'emergency' };
    } catch (error) {
      console.error('Emergency mode failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    // DOM already loaded, initialize immediately
    setTimeout(init, 0);
  }

  // Public API
  return {
    init,
    restart,
    getInfo,
    emergencyMode,
    
    // State checking
    isInitialized: () => isInitialized,
    hasErrors: () => initializationErrors.length > 0,
    getErrors: () => [...initializationErrors]
  };
})();

// Global error handling
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
  
  if (!WorkoutApp.isInitialized()) {
    console.log('Error during initialization - attempting emergency mode');
    WorkoutApp.emergencyMode();
  }
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
  
  if (!WorkoutApp.isInitialized()) {
    console.log('Promise rejection during initialization - attempting emergency mode');
    WorkoutApp.emergencyMode();
  }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WorkoutApp;
} else {
  // Browser global
  window.WorkoutApp = WorkoutApp;
}
