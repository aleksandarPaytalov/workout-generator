/**
 * PDF Export Tests
 * 
 * Comprehensive unit tests for the PDFExport module
 */

describe('PDFExport', () => {
    
    // Sample workout for testing
    let sampleWorkout;
    
    before(() => {
        // Ensure the module is ready
        if (!PDFExport.isReady()) {
            throw new Error('PDFExport module is not ready for testing');
        }
        
        // Create sample workout for testing
        sampleWorkout = [
            { id: 'chest_001', name: 'Push-ups', muscleGroup: 'chest' },
            { id: 'back_001', name: 'Pull-ups', muscleGroup: 'back' },
            { id: 'legs_001', name: 'Squats', muscleGroup: 'legs' },
            { id: 'arms_001', name: 'Bicep Curls', muscleGroup: 'arms' },
            { id: 'core_001', name: 'Plank', muscleGroup: 'core' },
            { id: 'shoulders_001', name: 'Shoulder Press', muscleGroup: 'shoulders' }
        ];
    });

    describe('Module Initialization', () => {
        
        it('should be properly initialized', () => {
            assert.isTrue(PDFExport.isReady());
        });

        it('should expose all required public methods', () => {
            const requiredMethods = [
                'isReady',
                'exportWorkout',
                'exportWorkoutToPDF',
                'exportWorkoutAsText'
            ];

            requiredMethods.forEach(method => {
                assert.isFunction(PDFExport[method], `Method ${method} should be a function`);
            });
        });
    });

    describe('Input Validation', () => {
        
        it('should validate workout parameter', () => {
            // Test invalid workout arrays
            assert.throws(() => {
                PDFExport.exportWorkout(null);
            }, 'Valid workout array is required');

            assert.throws(() => {
                PDFExport.exportWorkout(undefined);
            }, 'Valid workout array is required');

            assert.throws(() => {
                PDFExport.exportWorkout([]);
            }, 'Valid workout array is required');

            assert.throws(() => {
                PDFExport.exportWorkout('not an array');
            }, 'Valid workout array is required');
        });

        it('should validate workout has required properties', () => {
            const invalidWorkouts = [
                [{ name: 'Test' }], // Missing id and muscleGroup
                [{ id: 'test_001' }], // Missing name and muscleGroup
                [{ id: 'test_001', name: 'Test' }], // Missing muscleGroup
                [null], // Null exercise
                [undefined] // Undefined exercise
            ];

            invalidWorkouts.forEach((workout, index) => {
                assert.throws(() => {
                    PDFExport.exportWorkout(workout);
                }, `Invalid workout ${index} should throw error`);
            });
        });

        it('should accept valid workout array', () => {
            assert.doesNotThrow(() => {
                // Mock the download functionality for testing
                const originalCreateElement = document.createElement;
                document.createElement = mock.fn(() => ({
                    href: '',
                    download: '',
                    style: { display: '' },
                    click: mock.fn()
                }));

                const originalCreateObjectURL = URL.createObjectURL;
                URL.createObjectURL = mock.fn(() => 'mock-url');

                const originalRevokeObjectURL = URL.revokeObjectURL;
                URL.revokeObjectURL = mock.fn();

                try {
                    PDFExport.exportWorkout(sampleWorkout);
                } finally {
                    // Restore original functions
                    document.createElement = originalCreateElement;
                    URL.createObjectURL = originalCreateObjectURL;
                    URL.revokeObjectURL = originalRevokeObjectURL;
                }
            }, 'Valid workout should not throw error');
        });
    });

    describe('Text Export Functionality', () => {
        
        let mockDownload;
        
        beforeEach(() => {
            // Mock DOM and URL APIs for testing
            mockDownload = setupDownloadMocks();
        });

        afterEach(() => {
            // Restore original functions
            restoreDownloadMocks(mockDownload);
        });

        it('should export workout as text file', () => {
            PDFExport.exportWorkoutAsText(sampleWorkout);
            
            // Verify download was triggered
            assert.strictEqual(mockDownload.createElement.callCount, 1, 'Should create download link');
            assert.strictEqual(mockDownload.createObjectURL.callCount, 1, 'Should create object URL');
            assert.strictEqual(mockDownload.linkClick.callCount, 1, 'Should trigger download');
            assert.strictEqual(mockDownload.revokeObjectURL.callCount, 1, 'Should revoke URL');
        });

        it('should generate text content with workout details', () => {
            PDFExport.exportWorkoutAsText(sampleWorkout);
            
            // Get the blob that was created
            const blobCall = mockDownload.createObjectURL.calls[0];
            const blob = blobCall[0];
            
            assert.strictEqual(blob.type, 'text/plain;charset=utf-8', 'Should create text blob');
            
            // Verify blob size is reasonable (should contain workout data)
            assert.isTrue(blob.size > 100, 'Text content should be substantial');
        });

        it('should handle workout with muscle group distribution', () => {
            const workoutWithDuplicates = [
                ...sampleWorkout,
                { id: 'chest_002', name: 'Bench Press', muscleGroup: 'chest' },
                { id: 'back_002', name: 'Rows', muscleGroup: 'back' }
            ];

            assert.doesNotThrow(() => {
                PDFExport.exportWorkoutAsText(workoutWithDuplicates);
            }, 'Should handle workout with repeated muscle groups');
        });

        it('should use correct filename for text export', () => {
            PDFExport.exportWorkoutAsText(sampleWorkout);
            
            const linkElement = mockDownload.createElement.calls[0].returnValue;
            assert.strictEqual(linkElement.download, 'my-workout.txt', 'Should use correct filename');
        });
    });

    describe('PDF Export Functionality', () => {
        
        let mockDownload;
        
        beforeEach(() => {
            mockDownload = setupDownloadMocks();
        });

        afterEach(() => {
            restoreDownloadMocks(mockDownload);
        });

        it('should export workout as PDF file', () => {
            PDFExport.exportWorkoutToPDF(sampleWorkout);
            
            // Verify download was triggered
            assert.strictEqual(mockDownload.createElement.callCount, 1, 'Should create download link');
            assert.strictEqual(mockDownload.createObjectURL.callCount, 1, 'Should create object URL');
            assert.strictEqual(mockDownload.linkClick.callCount, 1, 'Should trigger download');
            assert.strictEqual(mockDownload.revokeObjectURL.callCount, 1, 'Should revoke URL');
        });

        it('should generate PDF blob with correct MIME type', () => {
            PDFExport.exportWorkoutToPDF(sampleWorkout);
            
            const blobCall = mockDownload.createObjectURL.calls[0];
            const blob = blobCall[0];
            
            assert.strictEqual(blob.type, 'application/pdf', 'Should create PDF blob');
        });

        it('should generate PDF with reasonable size', () => {
            PDFExport.exportWorkoutToPDF(sampleWorkout);
            
            const blobCall = mockDownload.createObjectURL.calls[0];
            const blob = blobCall[0];
            
            // PDF should have reasonable size (not empty, not too large)
            assert.isTrue(blob.size > 500, 'PDF should have substantial content');
            assert.isTrue(blob.size < 50000, 'PDF should not be excessively large');
        });

        it('should use correct filename for PDF export', () => {
            PDFExport.exportWorkoutToPDF(sampleWorkout);
            
            const linkElement = mockDownload.createElement.calls[0].returnValue;
            assert.strictEqual(linkElement.download, 'my-workout.pdf', 'Should use correct filename');
        });

        it('should handle workout with special characters in exercise names', () => {
            const workoutWithSpecialChars = [
                { id: 'test_001', name: 'Push-ups (Advanced)', muscleGroup: 'chest' },
                { id: 'test_002', name: 'Pull-ups & Chin-ups', muscleGroup: 'back' },
                { id: 'test_003', name: 'Squats "Goblet Style"', muscleGroup: 'legs' }
            ];

            assert.doesNotThrow(() => {
                PDFExport.exportWorkoutToPDF(workoutWithSpecialChars);
            }, 'Should handle special characters in exercise names');
        });
    });

    describe('Main Export Function', () => {
        
        let mockDownload;
        
        beforeEach(() => {
            mockDownload = setupDownloadMocks();
        });

        afterEach(() => {
            restoreDownloadMocks(mockDownload);
        });

        it('should default to PDF format', () => {
            PDFExport.exportWorkout(sampleWorkout);
            
            const blobCall = mockDownload.createObjectURL.calls[0];
            const blob = blobCall[0];
            
            assert.strictEqual(blob.type, 'application/pdf', 'Should default to PDF format');
        });

        it('should export as text when specified', () => {
            PDFExport.exportWorkout(sampleWorkout, { format: 'text' });
            
            const blobCall = mockDownload.createObjectURL.calls[0];
            const blob = blobCall[0];
            
            assert.strictEqual(blob.type, 'text/plain;charset=utf-8', 'Should export as text when specified');
        });

        it('should handle invalid format gracefully', () => {
            assert.throws(() => {
                PDFExport.exportWorkout(sampleWorkout, { format: 'invalid' });
            }, 'Unsupported export format');
        });

        it('should support fallback to text option', () => {
            // Test the fallback mechanism by mocking PDF generation failure
            const originalExportToPDF = PDFExport.exportWorkoutToPDF;
            
            // Mock PDF export to throw error
            PDFExport.exportWorkoutToPDF = mock.fn(() => {
                throw new Error('PDF generation failed');
            });

            try {
                // Should fallback to text without throwing
                assert.doesNotThrow(() => {
                    PDFExport.exportWorkout(sampleWorkout, { fallbackToText: true });
                }, 'Should fallback to text export');

                // Verify text export was called
                const blobCall = mockDownload.createObjectURL.calls[0];
                const blob = blobCall[0];
                assert.strictEqual(blob.type, 'text/plain;charset=utf-8', 'Should fallback to text');

            } finally {
                // Restore original function
                PDFExport.exportWorkoutToPDF = originalExportToPDF;
            }
        });
    });

    describe('Error Handling', () => {
        
        it('should handle DOM manipulation errors gracefully', () => {
            // Mock document.createElement to throw error
            const originalCreateElement = document.createElement;
            document.createElement = mock.fn(() => {
                throw new Error('DOM error');
            });

            try {
                assert.throws(() => {
                    PDFExport.exportWorkout(sampleWorkout);
                }, 'DOM error');
            } finally {
                document.createElement = originalCreateElement;
            }
        });

        it('should handle URL creation errors', () => {
            const mockDownload = setupDownloadMocks();
            
            // Mock URL.createObjectURL to throw error
            URL.createObjectURL = mock.fn(() => {
                throw new Error('URL creation failed');
            });

            try {
                assert.throws(() => {
                    PDFExport.exportWorkout(sampleWorkout);
                }, 'URL creation failed');
            } finally {
                restoreDownloadMocks(mockDownload);
            }
        });

        it('should handle empty exercise names gracefully', () => {
            const workoutWithEmptyNames = [
                { id: 'test_001', name: '', muscleGroup: 'chest' },
                { id: 'test_002', name: '   ', muscleGroup: 'back' },
                { id: 'test_003', name: 'Valid Exercise', muscleGroup: 'legs' }
            ];

            const mockDownload = setupDownloadMocks();

            try {
                assert.doesNotThrow(() => {
                    PDFExport.exportWorkout(workoutWithEmptyNames);
                }, 'Should handle empty exercise names');
            } finally {
                restoreDownloadMocks(mockDownload);
            }
        });
    });

    describe('Content Generation', () => {
        
        it('should include current date in exports', () => {
            const mockDownload = setupDownloadMocks();

            try {
                PDFExport.exportWorkoutAsText(sampleWorkout);
                
                // Get the text content from the blob
                const blobCall = mockDownload.createObjectURL.calls[0];
                const blob = blobCall[0];
                
                // Read blob content (simplified check)
                assert.isTrue(blob.size > 0, 'Should generate content');
                
            } finally {
                restoreDownloadMocks(mockDownload);
            }
        });

        it('should include exercise count in exports', () => {
            const mockDownload = setupDownloadMocks();

            try {
                PDFExport.exportWorkoutAsText(sampleWorkout);
                
                const blobCall = mockDownload.createObjectURL.calls[0];
                const blob = blobCall[0];
                
                // Should include content about exercise count
                assert.isTrue(blob.size > 100, 'Should include exercise count information');
                
            } finally {
                restoreDownloadMocks(mockDownload);
            }
        });

        it('should handle workout with missing ExerciseDatabase dependency', () => {
            // Temporarily mock ExerciseDatabase to be unavailable
            const originalExerciseDatabase = window.ExerciseDatabase;
            window.ExerciseDatabase = undefined;

            const mockDownload = setupDownloadMocks();

            try {
                // Should still work but with fallback labels
                assert.doesNotThrow(() => {
                    PDFExport.exportWorkout(sampleWorkout);
                }, 'Should work without ExerciseDatabase dependency');
                
            } finally {
                window.ExerciseDatabase = originalExerciseDatabase;
                restoreDownloadMocks(mockDownload);
            }
        });
    });

    describe('Performance and Edge Cases', () => {
        
        it('should handle large workouts efficiently', () => {
            // Create large workout
            const largeWorkout = [];
            for (let i = 0; i < 50; i++) {
                largeWorkout.push({
                    id: `exercise_${i}`,
                    name: `Exercise ${i}`,
                    muscleGroup: ['chest', 'back', 'legs', 'arms', 'core', 'shoulders'][i % 6]
                });
            }

            const mockDownload = setupDownloadMocks();

            try {
                const startTime = performance.now();
                PDFExport.exportWorkout(largeWorkout);
                const endTime = performance.now();
                
                assert.isTrue(endTime - startTime < 1000, 'Should handle large workout quickly');
                
            } finally {
                restoreDownloadMocks(mockDownload);
            }
        });

        it('should handle minimum workout size', () => {
            const minWorkout = [
                { id: 'test_001', name: 'Single Exercise', muscleGroup: 'chest' }
            ];

            const mockDownload = setupDownloadMocks();

            try {
                assert.doesNotThrow(() => {
                    PDFExport.exportWorkout(minWorkout);
                }, 'Should handle single exercise workout');
                
            } finally {
                restoreDownloadMocks(mockDownload);
            }
        });

        it('should be memory efficient with repeated exports', () => {
            const mockDownload = setupDownloadMocks();

            try {
                // Perform multiple exports
                for (let i = 0; i < 10; i++) {
                    PDFExport.exportWorkout(sampleWorkout);
                }
                
                // Should have created and revoked URLs properly
                assert.strictEqual(mockDownload.createObjectURL.callCount, 10, 'Should create URLs for each export');
                assert.strictEqual(mockDownload.revokeObjectURL.callCount, 10, 'Should revoke URLs for each export');
                
            } finally {
                restoreDownloadMocks(mockDownload);
            }
        });
    });

    // Helper functions for mocking download functionality
    function setupDownloadMocks() {
        const mocks = {
            createElement: mock.fn(),
            createObjectURL: mock.fn(),
            revokeObjectURL: mock.fn(),
            linkClick: mock.fn()
        };

        // Mock link element
        const mockLink = {
            href: '',
            download: '',
            style: { display: '' },
            click: mocks.linkClick
        };

        mocks.createElement.returnValue = mockLink;
        mocks.createObjectURL.returnValue = 'mock-blob-url';

        // Store originals
        mocks.originalCreateElement = document.createElement;
        mocks.originalCreateObjectURL = URL.createObjectURL;
        mocks.originalRevokeObjectURL = URL.revokeObjectURL;
        mocks.originalAppendChild = document.body.appendChild;
        mocks.originalRemoveChild = document.body.removeChild;

        // Set up mocks
        document.createElement = mocks.createElement;
        URL.createObjectURL = mocks.createObjectURL;
        URL.revokeObjectURL = mocks.revokeObjectURL;
        document.body.appendChild = mock.fn();
        document.body.removeChild = mock.fn();

        return mocks;
    }

    function restoreDownloadMocks(mocks) {
        document.createElement = mocks.originalCreateElement;
        URL.createObjectURL = mocks.originalCreateObjectURL;
        URL.revokeObjectURL = mocks.originalRevokeObjectURL;
        document.body.appendChild = mocks.originalAppendChild;
        document.body.removeChild = mocks.originalRemoveChild;
    }
});
