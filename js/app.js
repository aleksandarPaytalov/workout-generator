/**
 * Main Application Entry Point
 * 
 * Initializes all modules and handles application startup.
 * Provides basic error handling and dependency management.
 */

// Main application namespace
const WorkoutApp = (() => {
    'use strict';
    
    let isInitialized = false;
    
    /**
     * Initialize the application
     * @private
     */
    const init = () => {
        if (isInitialized) {
            console.warn('WorkoutApp: Application already initialized');
            return;
        }
        
        try {
            // Check that all required modules are loaded (except UIController which needs DOM)
            const requiredModules = [
                'ExerciseDatabase',
                'Validators', 
                'ExerciseGenerator'
            ];

            // Optional modules that enhance functionality
            const optionalModules = [
                'PDFExport',
                'DragDrop'
            ];
            
            for (const moduleName of requiredModules) {
                if (typeof window[moduleName] === 'undefined') {
                    throw new Error(`Required module "${moduleName}" not found`);
                }
                
                if (typeof window[moduleName].isReady === 'function' && !window[moduleName].isReady()) {
                    throw new Error(`Module "${moduleName}" is not ready`);
                }
            }

            // Check optional modules and warn if missing
            for (const moduleName of optionalModules) {
                if (typeof window[moduleName] === 'undefined') {
                    console.warn(`Optional module "${moduleName}" not found - some features may be limited`);
                } else if (typeof window[moduleName].isReady === 'function' && !window[moduleName].isReady()) {
                    console.warn(`Optional module "${moduleName}" is not ready - some features may be limited`);
                }
            }
            
            // Initialize UIController now that DOM is ready
            if (typeof UIController === 'undefined') {
                throw new Error('UIController module not found');
            }
            
            UIController.init();
            
            if (!UIController.isReady()) {
                throw new Error('UIController failed to initialize');
            }
            
            console.log('WorkoutApp: All modules initialized successfully');
            console.log('WorkoutApp: Application ready to use');
            
            isInitialized = true;
            
        } catch (error) {
            console.error('WorkoutApp: Initialization failed:', error);
            showInitializationError(error.message);
        }
    };
    
    /**
     * Show initialization error to user
     * @param {string} message - Error message
     * @private
     */
    const showInitializationError = (message) => {
        // Try to show error in UI if UIController is available
        if (typeof UIController !== 'undefined' && UIController.isReady()) {
            UIController.showErrorState(`Application failed to initialize: ${message}`);
        } else {
            // Fallback: show alert
            alert(`Application failed to initialize: ${message}`);
        }
    };
    
    /**
     * Check if application is ready
     * @returns {boolean} True if initialized
     * @public
     */
    const isReady = () => {
        return isInitialized;
    };
    
    // Public API
    return {
        init,
        isReady
    };
})();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('WorkoutApp: DOM ready, initializing application...');
    WorkoutApp.init();
});

// Fallback initialization for case where DOM is already loaded
if (document.readyState === 'loading') {
    // DOM is still loading, event listener above will handle it
} else {
    // DOM is already loaded
    console.log('WorkoutApp: DOM already ready, initializing application...');
    WorkoutApp.init();
}
