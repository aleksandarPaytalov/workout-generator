/**
 * Drag Drop Tests
 * 
 * Comprehensive unit tests for the DragDrop module
 */

describe('DragDrop', () => {
    
    // Sample workout and DOM elements for testing
    let sampleWorkout;
    let mockContainer;
    let mockUIController;
    
    before(() => {
        // Ensure dependencies are ready
        if (!DragDrop.isReady()) {
            throw new Error('DragDrop module is not ready for testing');
        }
        
        if (!Validators.isReady()) {
            throw new Error('Validators dependency is not ready');
        }
        
        // Create sample workout for testing
        sampleWorkout = [
            { id: 'chest_001', name: 'Push-ups', muscleGroup: 'chest' },
            { id: 'back_001', name: 'Pull-ups', muscleGroup: 'back' },
            { id: 'legs_001', name: 'Squats', muscleGroup: 'legs' },
            { id: 'arms_001', name: 'Bicep Curls', muscleGroup: 'arms' },
            { id: 'core_001', name: 'Plank', muscleGroup: 'core' }
        ];
    });

    beforeEach(() => {
        // Set up mock container and elements for each test
        setupMockDOM();
        setupMockUIController();
    });

    afterEach(() => {
        // Clean up mocks
        cleanupMocks();
    });

    describe('Module Initialization', () => {
        
        it('should be properly initialized', () => {
            assert.isTrue(DragDrop.isReady());
        });

        it('should expose all required public methods', () => {
            const requiredMethods = [
                'isReady',
                'makeDraggable',
                'isTouchEnabled'
            ];

            requiredMethods.forEach(method => {
                assert.isFunction(DragDrop[method], `Method ${method} should be a function`);
            });
        });

        it('should detect touch capability', () => {
            const isTouchEnabled = DragDrop.isTouchEnabled();
            assert.isNotUndefined(isTouchEnabled, 'Should return touch capability status');
            assert.isFunction(DragDrop.isTouchEnabled, 'isTouchEnabled should be a function');
        });
    });

    describe('makeDraggable', () => {
        
        it('should validate container parameter', () => {
            assert.throws(() => {
                DragDrop.makeDraggable(null);
            }, 'Invalid container element');

            assert.throws(() => {
                DragDrop.makeDraggable(undefined);
            }, 'Invalid container element');

            assert.throws(() => {
                DragDrop.makeDraggable('not an element');
            }, 'Invalid container element');
        });

        it('should make exercise items draggable', () => {
            DragDrop.makeDraggable(mockContainer);
            
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            
            exerciseItems.forEach((item, index) => {
                assert.strictEqual(item.getAttribute('draggable'), 'true', 
                    `Exercise ${index} should be draggable`);
                assert.strictEqual(item.dataset.index, index.toString(), 
                    `Exercise ${index} should have correct index`);
            });
        });

        it('should add drag event listeners to exercise items', () => {
            DragDrop.makeDraggable(mockContainer);
            
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            
            exerciseItems.forEach((item, index) => {
                const listeners = item.eventListeners || {};
                
                // Check that event listeners were added
                assert.isTrue(item.addEventListener.callCount >= 6, 
                    `Exercise ${index} should have drag event listeners added`);
                
                // Verify specific event types were registered
                const eventTypes = item.addEventListener.calls.map(call => call[0]);
                const expectedEvents = ['dragstart', 'dragover', 'dragenter', 'dragleave', 'drop', 'dragend'];
                
                expectedEvents.forEach(eventType => {
                    assert.contains(eventTypes, eventType, 
                        `Should add ${eventType} listener to exercise ${index}`);
                });
            });
        });

        it('should add touch reorder buttons when touch is enabled', () => {
            // Mock touch environment
            const originalTouchEnabled = DragDrop.isTouchEnabled;
            DragDrop.isTouchEnabled = () => true;

            try {
                DragDrop.makeDraggable(mockContainer);
                
                const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
                
                exerciseItems.forEach((item, index) => {
                    const reorderContainer = item.querySelector('.reorder-buttons');
                    
                    if (index === 0) {
                        // First item should not have up button
                        const upButton = reorderContainer?.querySelector('.reorder-up');
                        assert.isNull(upButton, 'First item should not have up button');
                    } else {
                        // Other items should have up button
                        const upButton = reorderContainer?.querySelector('.reorder-up');
                        assert.isNotNull(upButton, `Item ${index} should have up button`);
                    }
                    
                    if (index === exerciseItems.length - 1) {
                        // Last item should not have down button
                        const downButton = reorderContainer?.querySelector('.reorder-down');
                        assert.isNull(downButton, 'Last item should not have down button');
                    } else {
                        // Other items should have down button
                        const downButton = reorderContainer?.querySelector('.reorder-down');
                        assert.isNotNull(downButton, `Item ${index} should have down button`);
                    }
                });
                
            } finally {
                DragDrop.isTouchEnabled = originalTouchEnabled;
            }
        });

        it('should not add touch buttons when touch is disabled', () => {
            // Mock non-touch environment
            const originalTouchEnabled = DragDrop.isTouchEnabled;
            DragDrop.isTouchEnabled = () => false;

            try {
                DragDrop.makeDraggable(mockContainer);
                
                const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
                
                exerciseItems.forEach((item, index) => {
                    const reorderContainer = item.querySelector('.reorder-buttons');
                    assert.isNull(reorderContainer, `Item ${index} should not have reorder buttons in non-touch mode`);
                });
                
            } finally {
                DragDrop.isTouchEnabled = originalTouchEnabled;
            }
        });
    });

    describe('Drag Event Handling', () => {
        
        beforeEach(() => {
            DragDrop.makeDraggable(mockContainer);
        });

        it('should handle dragstart event correctly', () => {
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            const firstItem = exerciseItems[0];
            
            // Create mock drag event
            const dragEvent = createMockDragEvent('dragstart');
            dragEvent.target = firstItem;
            dragEvent.dataTransfer = createMockDataTransfer();
            
            // Trigger dragstart
            const dragStartHandler = findEventHandler(firstItem, 'dragstart');
            dragStartHandler(dragEvent);
            
            // Verify drag data was set
            assert.strictEqual(dragEvent.dataTransfer.effectAllowed, 'move', 
                'Should set effectAllowed to move');
            assert.isTrue(dragEvent.dataTransfer.setData.callCount > 0, 
                'Should set drag data');
            assert.isTrue(firstItem.classList.add.callCount > 0, 
                'Should add dragging class');
        });

        it('should handle dragover event correctly', () => {
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            const secondItem = exerciseItems[1];
            
            const dragEvent = createMockDragEvent('dragover');
            dragEvent.target = secondItem;
            dragEvent.dataTransfer = createMockDataTransfer();
            
            // Trigger dragover
            const dragOverHandler = findEventHandler(secondItem, 'dragover');
            dragOverHandler(dragEvent);
            
            // Verify preventDefault was called
            assert.isTrue(dragEvent.preventDefault.callCount > 0, 
                'Should prevent default dragover behavior');
            assert.strictEqual(dragEvent.dataTransfer.dropEffect, 'move', 
                'Should set dropEffect to move');
        });

        it('should handle dragenter event correctly', () => {
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            const targetItem = exerciseItems[1];
            
            const dragEvent = createMockDragEvent('dragenter');
            dragEvent.target = targetItem;
            
            // Trigger dragenter
            const dragEnterHandler = findEventHandler(targetItem, 'dragenter');
            dragEnterHandler(dragEvent);
            
            // Should add drop-target class
            assert.isTrue(targetItem.classList.add.callCount > 0, 
                'Should add drop-target class');
        });

        it('should handle dragleave event correctly', () => {
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            const targetItem = exerciseItems[1];
            
            const dragEvent = createMockDragEvent('dragleave');
            dragEvent.target = targetItem;
            
            // Trigger dragleave
            const dragLeaveHandler = findEventHandler(targetItem, 'dragleave');
            dragLeaveHandler(dragEvent);
            
            // Should remove drop-target class
            assert.isTrue(targetItem.classList.remove.callCount > 0, 
                'Should remove drop-target class');
        });

        it('should handle dragend event correctly', () => {
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            const draggedItem = exerciseItems[0];
            
            // First trigger dragstart to set up dragged element
            const dragStartEvent = createMockDragEvent('dragstart');
            dragStartEvent.target = draggedItem;
            dragStartEvent.dataTransfer = createMockDataTransfer();
            
            const dragStartHandler = findEventHandler(draggedItem, 'dragstart');
            dragStartHandler(dragStartEvent);
            
            // Then trigger dragend
            const dragEndEvent = createMockDragEvent('dragend');
            dragEndEvent.target = draggedItem;
            
            const dragEndHandler = findEventHandler(draggedItem, 'dragend');
            dragEndHandler(dragEndEvent);
            
            // Should clean up drag state
            assert.isTrue(draggedItem.classList.remove.callCount > 0, 
                'Should remove dragging class');
        });
    });

    describe('Drop Event Handling and Constraint Validation', () => {
        
        beforeEach(() => {
            DragDrop.makeDraggable(mockContainer);
        });

        it('should handle valid drop and update workout', () => {
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            const sourceItem = exerciseItems[0]; // chest
            const targetItem = exerciseItems[2]; // legs
            
            // Mock a valid workout reordering (chest->legs should be valid)
            mockUIController.getCurrentWorkout.returnValue = [...sampleWorkout];
            Validators.isValidWorkout = mock.fn(() => true);
            
            // Simulate drag start
            const dragStartEvent = createMockDragEvent('dragstart');
            dragStartEvent.target = sourceItem;
            dragStartEvent.dataTransfer = createMockDataTransfer();
            
            const dragStartHandler = findEventHandler(sourceItem, 'dragstart');
            dragStartHandler(dragStartEvent);
            
            // Simulate drop
            const dropEvent = createMockDragEvent('drop');
            dropEvent.target = targetItem;
            dropEvent.dataTransfer = createMockDataTransfer();
            
            const dropHandler = findEventHandler(targetItem, 'drop');
            dropHandler(dropEvent);
            
            // Verify preventDefault and stopPropagation were called
            assert.isTrue(dropEvent.preventDefault.callCount > 0, 
                'Should prevent default drop behavior');
            assert.isTrue(dropEvent.stopPropagation.callCount > 0, 
                'Should stop event propagation');
            
            // Verify UI was updated
            assert.isTrue(mockUIController.renderWorkoutList.callCount > 0, 
                'Should update UI with new workout order');
        });

        it('should prevent invalid drops that violate constraints', () => {
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            const sourceItem = exerciseItems[0];
            const targetItem = exerciseItems[1];
            
            // Mock invalid workout reordering
            mockUIController.getCurrentWorkout.returnValue = [...sampleWorkout];
            Validators.isValidWorkout = mock.fn(() => false);
            
            // Simulate drag and drop
            const dragStartEvent = createMockDragEvent('dragstart');
            dragStartEvent.target = sourceItem;
            dragStartEvent.dataTransfer = createMockDataTransfer();
            
            const dragStartHandler = findEventHandler(sourceItem, 'dragstart');
            dragStartHandler(dragStartEvent);
            
            const dropEvent = createMockDragEvent('drop');
            dropEvent.target = targetItem;
            dropEvent.dataTransfer = createMockDataTransfer();
            
            const dropHandler = findEventHandler(targetItem, 'drop');
            dropHandler(dropEvent);
            
            // Should not update UI for invalid drop
            assert.strictEqual(mockUIController.renderWorkoutList.callCount, 0, 
                'Should not update UI for invalid drop');
        });

        it('should handle drop on same element gracefully', () => {
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            const sameItem = exerciseItems[0];
            
            mockUIController.getCurrentWorkout.returnValue = [...sampleWorkout];
            
            // Simulate drag start and drop on same element
            const dragStartEvent = createMockDragEvent('dragstart');
            dragStartEvent.target = sameItem;
            dragStartEvent.dataTransfer = createMockDataTransfer();
            
            const dragStartHandler = findEventHandler(sameItem, 'dragstart');
            dragStartHandler(dragStartEvent);
            
            const dropEvent = createMockDragEvent('drop');
            dropEvent.target = sameItem;
            dropEvent.dataTransfer = createMockDataTransfer();
            
            const dropHandler = findEventHandler(sameItem, 'drop');
            dropHandler(dropEvent);
            
            // Should not update UI when dropping on same element
            assert.strictEqual(mockUIController.renderWorkoutList.callCount, 0, 
                'Should not update UI when dropping on same element');
        });
    });

    describe('Touch Device Support', () => {
        
        it('should handle reorder button clicks', () => {
            // Mock touch environment
            const originalTouchEnabled = DragDrop.isTouchEnabled;
            DragDrop.isTouchEnabled = () => true;

            try {
                DragDrop.makeDraggable(mockContainer);
                
                const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
                const secondItem = exerciseItems[1]; // Has both up and down buttons
                
                const upButton = secondItem.querySelector('.reorder-up');
                
                // Mock valid reordering
                mockUIController.getCurrentWorkout.returnValue = [...sampleWorkout];
                Validators.isValidWorkout = mock.fn(() => true);
                
                // Simulate click on up button
                const clickEvent = createMockEvent('click');
                clickEvent.target = upButton;
                
                // Find and trigger click handler
                const clickHandler = upButton.addEventListener.calls.find(call => call[0] === 'click');
                if (clickHandler) {
                    clickHandler[1](clickEvent);
                    
                    // Should update UI
                    assert.isTrue(mockUIController.renderWorkoutList.callCount > 0, 
                        'Should update UI after valid reorder');
                }
                
            } finally {
                DragDrop.isTouchEnabled = originalTouchEnabled;
            }
        });

        it('should prevent invalid reorder button operations', () => {
            const originalTouchEnabled = DragDrop.isTouchEnabled;
            DragDrop.isTouchEnabled = () => true;

            try {
                DragDrop.makeDraggable(mockContainer);
                
                const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
                const secondItem = exerciseItems[1];
                
                const upButton = secondItem.querySelector('.reorder-up');
                
                // Mock invalid reordering
                mockUIController.getCurrentWorkout.returnValue = [...sampleWorkout];
                Validators.isValidWorkout = mock.fn(() => false);
                
                const clickEvent = createMockEvent('click');
                clickEvent.target = upButton;
                
                const clickHandler = upButton.addEventListener.calls.find(call => call[0] === 'click');
                if (clickHandler) {
                    clickHandler[1](clickEvent);
                    
                    // Should not update UI for invalid reorder
                    assert.strictEqual(mockUIController.renderWorkoutList.callCount, 0, 
                        'Should not update UI for invalid reorder');
                }
                
            } finally {
                DragDrop.isTouchEnabled = originalTouchEnabled;
            }
        });
    });

    describe('Error Handling', () => {
        
        it('should handle missing UIController gracefully', () => {
            // Remove UIController mock
            window.UIController = undefined;
            
            DragDrop.makeDraggable(mockContainer);
            
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            const sourceItem = exerciseItems[0];
            const targetItem = exerciseItems[1];
            
            // Simulate drag and drop
            const dragStartEvent = createMockDragEvent('dragstart');
            dragStartEvent.target = sourceItem;
            dragStartEvent.dataTransfer = createMockDataTransfer();
            
            const dragStartHandler = findEventHandler(sourceItem, 'dragstart');
            dragStartHandler(dragStartEvent);
            
            const dropEvent = createMockDragEvent('drop');
            dropEvent.target = targetItem;
            dropEvent.dataTransfer = createMockDataTransfer();
            
            const dropHandler = findEventHandler(targetItem, 'drop');
            
            // Should not throw error even if UIController is missing
            assert.doesNotThrow(() => {
                dropHandler(dropEvent);
            }, 'Should handle missing UIController gracefully');
            
            // Restore UIController
            window.UIController = mockUIController;
        });

        it('should handle malformed DOM structure', () => {
            // Create container with no exercise items
            const emptyContainer = mock.domElement('div');
            emptyContainer.querySelectorAll = mock.fn(() => []);
            
            assert.doesNotThrow(() => {
                DragDrop.makeDraggable(emptyContainer);
            }, 'Should handle empty container gracefully');
        });

        it('should handle workout data corruption gracefully', () => {
            DragDrop.makeDraggable(mockContainer);
            
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            const sourceItem = exerciseItems[0];
            const targetItem = exerciseItems[1];
            
            // Mock corrupted workout data
            mockUIController.getCurrentWorkout.returnValue = null;
            
            const dragStartEvent = createMockDragEvent('dragstart');
            dragStartEvent.target = sourceItem;
            dragStartEvent.dataTransfer = createMockDataTransfer();
            
            const dragStartHandler = findEventHandler(sourceItem, 'dragstart');
            dragStartHandler(dragStartEvent);
            
            const dropEvent = createMockDragEvent('drop');
            dropEvent.target = targetItem;
            dropEvent.dataTransfer = createMockDataTransfer();
            
            const dropHandler = findEventHandler(targetItem, 'drop');
            
            assert.doesNotThrow(() => {
                dropHandler(dropEvent);
            }, 'Should handle corrupted workout data gracefully');
        });
    });

    describe('Performance and Edge Cases', () => {
        
        it('should handle large workout lists efficiently', () => {
            // Create container with many exercise items
            const largeContainer = createLargeContainer(50);
            
            const startTime = performance.now();
            DragDrop.makeDraggable(largeContainer);
            const endTime = performance.now();
            
            assert.isTrue(endTime - startTime < 100, 
                'Should make large workout list draggable quickly');
            
            // Verify all items are draggable
            const exerciseItems = largeContainer.querySelectorAll('.workout-exercise');
            assert.strictEqual(exerciseItems.length, 50, 'Should have 50 exercise items');
            
            exerciseItems.forEach((item, index) => {
                assert.strictEqual(item.getAttribute('draggable'), 'true', 
                    `Item ${index} should be draggable`);
            });
        });

        it('should handle rapid successive drag operations', () => {
            DragDrop.makeDraggable(mockContainer);
            
            const exerciseItems = mockContainer.querySelectorAll('.workout-exercise');
            mockUIController.getCurrentWorkout.returnValue = [...sampleWorkout];
            Validators.isValidWorkout = mock.fn(() => true);
            
            // Simulate multiple rapid drag operations
            for (let i = 0; i < 10; i++) {
                const sourceItem = exerciseItems[0];
                const targetItem = exerciseItems[1];
                
                const dragStartEvent = createMockDragEvent('dragstart');
                dragStartEvent.target = sourceItem;
                dragStartEvent.dataTransfer = createMockDataTransfer();
                
                const dragStartHandler = findEventHandler(sourceItem, 'dragstart');
                dragStartHandler(dragStartEvent);
                
                const dropEvent = createMockDragEvent('drop');
                dropEvent.target = targetItem;
                dropEvent.dataTransfer = createMockDataTransfer();
                
                const dropHandler = findEventHandler(targetItem, 'drop');
                dropHandler(dropEvent);
            }
            
            // Should handle all operations without errors
            assert.strictEqual(mockUIController.renderWorkoutList.callCount, 10, 
                'Should handle all drag operations');
        });
    });

    // Helper functions for test setup and mocking

    function setupMockDOM() {
        // Create mock container with exercise items
        mockContainer = mock.domElement('ol', { class: 'workout-list' });
        
        const exerciseItems = sampleWorkout.map((exercise, index) => {
            const item = mock.domElement('li', { 
                class: 'workout-exercise',
                'data-exercise-id': exercise.id,
                'data-muscle-group': exercise.muscleGroup
            });
            
            item.dataset = {
                exerciseId: exercise.id,
                muscleGroup: exercise.muscleGroup,
                index: index.toString()
            };
            
            return item;
        });
        
        mockContainer.querySelectorAll = mock.fn((selector) => {
            if (selector === '.workout-exercise') {
                return exerciseItems;
            }
            return [];
        });
        
        mockContainer.querySelector = mock.fn((selector) => {
            if (selector === '.workout-exercise') {
                return exerciseItems[0];
            }
            return null;
        });
        
        // Set up exercise items with proper mocking
        exerciseItems.forEach(item => {
            item.querySelector = mock.fn((selector) => {
                if (selector === '.reorder-buttons') {
                    return null; // Will be created by makeDraggable
                }
                if (selector === '.reorder-up' || selector === '.reorder-down') {
                    const button = mock.domElement('button', { class: selector.slice(1) });
                    return button;
                }
                return null;
            });
            
            item.appendChild = mock.fn((child) => {
                // Simulate adding reorder buttons
                if (child.className === 'reorder-buttons') {
                    item.querySelector = mock.fn((selector) => {
                        if (selector === '.reorder-buttons') return child;
                        if (selector === '.reorder-up') return child.children[0];
                        if (selector === '.reorder-down') return child.children[1];
                        return null;
                    });
                }
            });
        });
    }

    function setupMockUIController() {
        mockUIController = {
            getCurrentWorkout: mock.fn(() => [...sampleWorkout]),
            renderWorkoutList: mock.fn()
        };
        
        window.UIController = mockUIController;
    }

    function cleanupMocks() {
        // Reset mocks if needed
        if (mockUIController) {
            mockUIController.getCurrentWorkout.reset();
            mockUIController.renderWorkoutList.reset();
        }
    }

    function createMockDragEvent(type) {
        return {
            type: type,
            target: null,
            preventDefault: mock.fn(),
            stopPropagation: mock.fn(),
            dataTransfer: null
        };
    }

    function createMockDataTransfer() {
        return {
            effectAllowed: '',
            dropEffect: '',
            setData: mock.fn(),
            getData: mock.fn()
        };
    }

    function createMockEvent(type) {
        return {
            type: type,
            target: null,
            preventDefault: mock.fn(),
            stopPropagation: mock.fn()
        };
    }

    function findEventHandler(element, eventType) {
        const call = element.addEventListener.calls.find(call => call[0] === eventType);
        return call ? call[1] : null;
    }

    function createLargeContainer(itemCount) {
        const container = mock.domElement('ol', { class: 'workout-list' });
        const items = [];
        
        for (let i = 0; i < itemCount; i++) {
            const item = mock.domElement('li', { 
                class: 'workout-exercise',
                'data-exercise-id': `exercise_${i}`,
                'data-muscle-group': 'chest'
            });
            
            item.dataset = {
                exerciseId: `exercise_${i}`,
                muscleGroup: 'chest',
                index: i.toString()
            };
            
            items.push(item);
        }
        
        container.querySelectorAll = mock.fn((selector) => {
            if (selector === '.workout-exercise') {
                return items;
            }
            return [];
        });
        
        return container;
    }
});
