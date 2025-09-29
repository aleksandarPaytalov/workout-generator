/**
 * Footer Controller Module
 * 
 * Manages footer interactions, statistics tracking, and quick actions.
 * Provides enhanced user experience through footer functionality.
 * 
 * @namespace FooterController
 */

// Use IIFE to create module namespace and prevent global pollution
const FooterController = (() => {
    'use strict';

    // Private module state
    let isInitialized = false;
    let sessionStats = {
        workoutsGenerated: 0,
        exercisesCreated: 0
    };

    // Cached DOM elements
    const elements = {
        // Footer links
        footerGenerateLink: null,
        footerClearLink: null,
        footerShuffleLink: null,
        footerExportLink: null,
        
        // Stats elements
        workoutsGenerated: null,
        exercisesCreated: null
    };

    /**
     * Initialize the footer controller
     * @public
     */
    const init = () => {
        if (isInitialized) {
            console.warn('FooterController: Module already initialized');
            return;
        }

        try {
            // Cache DOM elements
            cacheElements();
            
            // Set up event listeners
            setupEventListeners();
            
            // Initialize stats display
            updateStatsDisplay();
            
            console.log('FooterController: Module initialized successfully');
            isInitialized = true;
            
        } catch (error) {
            console.error('FooterController: Initialization failed:', error);
            throw error;
        }
    };

    /**
     * Cache all required DOM elements
     * @private
     */
    const cacheElements = () => {
        // Footer action links
        elements.footerGenerateLink = document.getElementById('footerGenerateLink');
        elements.footerClearLink = document.getElementById('footerClearLink');
        elements.footerShuffleLink = document.getElementById('footerShuffleLink');
        elements.footerExportLink = document.getElementById('footerExportLink');
        
        // Stats elements
        elements.workoutsGenerated = document.getElementById('workoutsGenerated');
        elements.exercisesCreated = document.getElementById('exercisesCreated');

        // Verify critical elements exist
        if (!elements.workoutsGenerated || !elements.exercisesCreated) {
            throw new Error('FooterController: Required stats elements not found');
        }
    };

    /**
     * Set up all event listeners
     * @private
     */
    const setupEventListeners = () => {
        // Footer action links
        if (elements.footerGenerateLink) {
            elements.footerGenerateLink.addEventListener('click', handleGenerateClick);
        }
        
        if (elements.footerClearLink) {
            elements.footerClearLink.addEventListener('click', handleClearClick);
        }
        
        if (elements.footerShuffleLink) {
            elements.footerShuffleLink.addEventListener('click', handleShuffleClick);
        }
        
        if (elements.footerExportLink) {
            elements.footerExportLink.addEventListener('click', handleExportClick);
        }
    };

    /**
     * Handle generate workout click from footer
     * @param {Event} e - Click event
     * @private
     */
    const handleGenerateClick = (e) => {
        e.preventDefault();
        
        // Trigger the main generate button
        const generateBtn = document.getElementById('generateBtn');
        if (generateBtn) {
            generateBtn.click();
        }
    };

    /**
     * Handle clear workout click from footer
     * @param {Event} e - Click event
     * @private
     */
    const handleClearClick = (e) => {
        e.preventDefault();
        
        // Trigger the main clear button
        const clearBtn = document.getElementById('clearBtn');
        if (clearBtn) {
            clearBtn.click();
        }
    };

    /**
     * Handle shuffle workout click from footer
     * @param {Event} e - Click event
     * @private
     */
    const handleShuffleClick = (e) => {
        e.preventDefault();
        
        // Trigger the main shuffle button
        const shuffleBtn = document.getElementById('shuffleBtn');
        if (shuffleBtn && !shuffleBtn.disabled) {
            shuffleBtn.click();
        }
    };

    /**
     * Handle export PDF click from footer
     * @param {Event} e - Click event
     * @private
     */
    const handleExportClick = (e) => {
        e.preventDefault();
        
        // Trigger the main export button
        const exportBtn = document.getElementById('exportPdfBtn');
        if (exportBtn && !exportBtn.disabled) {
            exportBtn.click();
        }
    };

    /**
     * Update workout generated count
     * @public
     */
    const incrementWorkoutCount = () => {
        sessionStats.workoutsGenerated++;
        updateStatsDisplay();
        animateStatUpdate(elements.workoutsGenerated);
    };

    /**
     * Update exercises created count
     * @param {number} count - Number of exercises to add
     * @public
     */
    const addExerciseCount = (count = 1) => {
        sessionStats.exercisesCreated += count;
        updateStatsDisplay();
        animateStatUpdate(elements.exercisesCreated);
    };

    /**
     * Reset session statistics
     * @public
     */
    const resetStats = () => {
        sessionStats.workoutsGenerated = 0;
        sessionStats.exercisesCreated = 0;
        updateStatsDisplay();
    };

    /**
     * Update the stats display
     * @private
     */
    const updateStatsDisplay = () => {
        if (elements.workoutsGenerated) {
            elements.workoutsGenerated.textContent = sessionStats.workoutsGenerated;
        }
        
        if (elements.exercisesCreated) {
            elements.exercisesCreated.textContent = sessionStats.exercisesCreated;
        }
    };

    /**
     * Animate stat number update
     * @param {HTMLElement} element - Element to animate
     * @private
     */
    const animateStatUpdate = (element) => {
        if (!element) return;
        
        // Remove existing animation class
        element.classList.remove('updated');
        
        // Force reflow
        element.offsetHeight;
        
        // Add animation class
        element.classList.add('updated');
        
        // Remove class after animation
        setTimeout(() => {
            element.classList.remove('updated');
        }, 600);
    };

    /**
     * Get current session statistics
     * @returns {Object} Current stats
     * @public
     */
    const getStats = () => {
        return { ...sessionStats };
    };

    /**
     * Check if module is properly initialized
     * @returns {boolean} True if module is ready to use
     * @public
     */
    const isReady = () => {
        return isInitialized;
    };

    // Public API
    return {
        init,
        isReady,
        incrementWorkoutCount,
        addExerciseCount,
        resetStats,
        getStats
    };
})();

// Make module available globally
window.FooterController = FooterController;
