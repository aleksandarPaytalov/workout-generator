/**
 * Drag and Drop Module
 * 
 * Handles drag and drop functionality for workout exercises.
 * Maintains constraint validation during reordering.
 * 
 * @namespace DragDrop
 */

// Use IIFE to create module namespace and prevent global pollution
const DragDrop = (() => {
    'use strict';
    
    // Private module state
    let isInitialized = false;
    let draggedElement = null;
    let draggedIndex = -1;
    let touchEnabled = false;
    
    /**
     * Initialize the module
     * @private
     */
    const init = () => {
        if (isInitialized) {
            console.warn('DragDrop: Module already initialized');
            return;
        }
        
        // Verify required dependencies
        if (typeof Validators === 'undefined' || !Validators.isReady()) {
            throw new Error('DragDrop: Validators module is required and must be ready');
        }
        
        // Detect touch devices
        touchEnabled = ('ontouchstart' in window) || 
                      (navigator.maxTouchPoints > 0) || 
                      (navigator.msMaxTouchPoints > 0);
        
        console.log(`DragDrop: Module initialized successfully. Touch enabled: ${touchEnabled}`);
        isInitialized = true;
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
     * Make exercise list items draggable
     * @param {HTMLElement} container - Workout list container element
     * @public
     */
    const makeDraggable = (container) => {
        if (!isInitialized) {
            throw new Error('DragDrop: Module not initialized');
        }
        
        if (!container || !(container instanceof HTMLElement)) {
            throw new Error('DragDrop: Invalid container element');
        }
        
        // Get all exercise list items
        const exerciseItems = container.querySelectorAll('.workout-exercise');
        
        exerciseItems.forEach((item, index) => {
            // Make item draggable (desktop)
            item.setAttribute('draggable', 'true');
            item.dataset.index = index;
            
            // Add drag event listeners
            item.addEventListener('dragstart', handleDragStart);
            item.addEventListener('dragover', handleDragOver);
            item.addEventListener('dragenter', handleDragEnter);
            item.addEventListener('dragleave', handleDragLeave);
            item.addEventListener('drop', handleDrop);
            item.addEventListener('dragend', handleDragEnd);
            
            // If touch is enabled, add reorder buttons
            if (touchEnabled) {
                addTouchReorderButtons(item, index);
            }
        });
    };
    
    /**
     * Add touch-friendly reorder buttons
     * @param {HTMLElement} item - Exercise list item
     * @param {number} index - Item index
     * @private
     */
    const addTouchReorderButtons = (item, index) => {
        // Create reorder buttons container
        const reorderContainer = document.createElement('div');
        reorderContainer.className = 'reorder-buttons';
        
        // Only add up button if not first item
        if (index > 0) {
            const upButton = document.createElement('button');
            upButton.type = 'button';
            upButton.className = 'reorder-btn reorder-up';
            upButton.innerHTML = '&uarr;';
            upButton.setAttribute('aria-label', 'Move exercise up');
            upButton.addEventListener('click', () => handleReorderClick(item, 'up'));
            reorderContainer.appendChild(upButton);
        }
        
        // Only add down button if not last item
        const exerciseCount = document.querySelectorAll('.workout-exercise').length;
        if (index < exerciseCount - 1) {
            const downButton = document.createElement('button');
            downButton.type = 'button';
            downButton.className = 'reorder-btn reorder-down';
            downButton.innerHTML = '&darr;';
            downButton.setAttribute('aria-label', 'Move exercise down');
            downButton.addEventListener('click', () => handleReorderClick(item, 'down'));
            reorderContainer.appendChild(downButton);
        }
        
        // Add buttons to item if we have any
        if (reorderContainer.children.length > 0) {
            item.appendChild(reorderContainer);
        }
    };
    
    /**
     * Handle dragstart event
     * @param {DragEvent} event - Drag start event
     * @private
     */
    const handleDragStart = (event) => {
        // Store reference to dragged element
        draggedElement = event.target;
        draggedIndex = parseInt(draggedElement.dataset.index, 10);
        
        // Set drag data
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', draggedIndex);
        
        // Add dragging class for visual feedback
        draggedElement.classList.add('dragging');
    };
    
    /**
     * Handle dragover event
     * @param {DragEvent} event - Drag over event
     * @private
     */
    const handleDragOver = (event) => {
        // Prevent default to allow drop
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    };
    
    /**
     * Handle dragenter event
     * @param {DragEvent} event - Drag enter event
     * @private
     */
    const handleDragEnter = (event) => {
        // Add highlight class to drop target
        const dropTarget = getDropTarget(event);
        if (dropTarget && dropTarget !== draggedElement) {
            dropTarget.classList.add('drop-target');
        }
    };
    
    /**
     * Handle dragleave event
     * @param {DragEvent} event - Drag leave event
     * @private
     */
    const handleDragLeave = (event) => {
        // Remove highlight class from drop target
        const dropTarget = getDropTarget(event);
        if (dropTarget) {
            dropTarget.classList.remove('drop-target');
        }
    };
    
    /**
     * Handle drop event
     * @param {DragEvent} event - Drop event
     * @private
     */
    const handleDrop = (event) => {
        // Prevent default actions
        event.preventDefault();
        event.stopPropagation();
        
        // Get drop target
        const dropTarget = getDropTarget(event);
        if (!dropTarget || dropTarget === draggedElement) {
            return;
        }
        
        // Remove highlight class
        dropTarget.classList.remove('drop-target');
        
        // Get current workout from UIController
        const currentWorkout = UIController.getCurrentWorkout();
        if (!currentWorkout || !Array.isArray(currentWorkout) || currentWorkout.length === 0) {
            console.error('DragDrop: No workout available for reordering');
            return;
        }
        
        // Get target index
        const targetIndex = parseInt(dropTarget.dataset.index, 10);
        
        // Create a new workout with the reordered exercises
        const newWorkout = [...currentWorkout];
        const [movedExercise] = newWorkout.splice(draggedIndex, 1);
        newWorkout.splice(targetIndex, 0, movedExercise);
        
        // Validate constraint
        if (!Validators.isValidWorkout(newWorkout)) {
            console.warn('DragDrop: Reordering would violate muscle group constraint');
            
            // Visual feedback for invalid drop
            showConstraintViolation(dropTarget);
            return;
        }
        
        // Update UI with the new workout
        UIController.renderWorkoutList(newWorkout);
    };
    
    /**
     * Handle dragend event
     * @param {DragEvent} event - Drag end event
     * @private
     */
    const handleDragEnd = (event) => {
        // Remove dragging class
        if (draggedElement) {
            draggedElement.classList.remove('dragging');
        }
        
        // Reset dragged element
        draggedElement = null;
        draggedIndex = -1;
        
        // Remove drop-target class from all elements
        document.querySelectorAll('.drop-target').forEach(element => {
            element.classList.remove('drop-target');
        });
    };
    
    /**
     * Handle click on reorder buttons (touch fallback)
     * @param {HTMLElement} item - Exercise list item
     * @param {string} direction - Direction to move ('up' or 'down')
     * @private
     */
    const handleReorderClick = (item, direction) => {
        // Get current workout from UIController
        const currentWorkout = UIController.getCurrentWorkout();
        if (!currentWorkout || !Array.isArray(currentWorkout) || currentWorkout.length === 0) {
            console.error('DragDrop: No workout available for reordering');
            return;
        }
        
        // Get current index
        const currentIndex = parseInt(item.dataset.index, 10);
        
        // Calculate target index
        let targetIndex = currentIndex;
        if (direction === 'up' && currentIndex > 0) {
            targetIndex = currentIndex - 1;
        } else if (direction === 'down' && currentIndex < currentWorkout.length - 1) {
            targetIndex = currentIndex + 1;
        } else {
            return; // Invalid move
        }
        
        // Create a new workout with the reordered exercises
        const newWorkout = [...currentWorkout];
        const [movedExercise] = newWorkout.splice(currentIndex, 1);
        newWorkout.splice(targetIndex, 0, movedExercise);
        
        // Validate constraint
        if (!Validators.isValidWorkout(newWorkout)) {
            console.warn('DragDrop: Reordering would violate muscle group constraint');
            
            // Visual feedback for invalid move
            showConstraintViolation(item);
            return;
        }
        
        // Update UI with the new workout
        UIController.renderWorkoutList(newWorkout);
    };
    
    /**
     * Get the drop target element from an event
     * @param {Event} event - The event
     * @returns {HTMLElement|null} The drop target
     * @private
     */
    const getDropTarget = (event) => {
        // Get the actual drop target (might be a child element)
        let target = event.target;
        
        // Traverse up to find the workout exercise item
        while (target && !target.classList.contains('workout-exercise')) {
            target = target.parentElement;
        }
        
        return target;
    };
    
    /**
     * Show visual feedback for constraint violation
     * @param {HTMLElement} element - Element to show feedback on
     * @private
     */
    const showConstraintViolation = (element) => {
        // Add violation class
        element.classList.add('constraint-violation');
        
        // Remove class after animation
        setTimeout(() => {
            element.classList.remove('constraint-violation');
        }, 800);
    };
    
    /**
     * Check if touch is enabled
     * @returns {boolean} True if touch is enabled
     * @public
     */
    const isTouchEnabled = () => {
        return touchEnabled;
    };
    
    // Public API
    const publicAPI = {
        isReady,
        makeDraggable,
        isTouchEnabled
    };
    
    // Auto-initialize when module loads
    init();
    
    // Return public interface
    return publicAPI;
    
})();

// Verify module loaded correctly
if (typeof DragDrop === 'undefined') {
    throw new Error('DragDrop module failed to load');
}

// Optional: Add to global scope for debugging (remove in production)
if (typeof window !== 'undefined') {
    window.DragDrop = DragDrop;
}
