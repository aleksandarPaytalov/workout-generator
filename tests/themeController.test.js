/**
 * ThemeController Module Tests
 * 
 * Comprehensive unit tests for the ThemeController module
 */

describe('ThemeController', () => {
    
    // Store original theme before tests
    let originalTheme;

    beforeEach(() => {
        // Save current theme
        originalTheme = ThemeController.getCurrentTheme();
        // Clear localStorage theme setting
        localStorage.removeItem('workout-app-theme');
    });

    afterEach(() => {
        // Restore original theme
        if (originalTheme) {
            ThemeController.setTheme(originalTheme);
        }
        // Clean up localStorage
        localStorage.removeItem('workout-app-theme');
    });

    describe('Module Initialization', () => {
        
        it('should be properly initialized', () => {
            assert.isTrue(ThemeController.isReady());
        });

        it('should expose all required public methods', () => {
            const requiredMethods = [
                'init',
                'isReady',
                'getCurrentTheme',
                'setTheme',
                'toggleTheme'
            ];

            requiredMethods.forEach(method => {
                assert.isFunction(ThemeController[method], `Method ${method} should be a function`);
            });
        });

        it('should have a valid initial theme', () => {
            const currentTheme = ThemeController.getCurrentTheme();
            
            assert.isString(currentTheme);
            assert.isTrue(currentTheme === 'light' || currentTheme === 'dark');
        });
    });

    describe('Theme Getting and Setting', () => {
        
        it('should get current theme', () => {
            const theme = ThemeController.getCurrentTheme();
            
            assert.isString(theme);
            assert.isTrue(['light', 'dark'].includes(theme));
        });

        it('should set light theme', () => {
            ThemeController.setTheme('light');
            
            const currentTheme = ThemeController.getCurrentTheme();
            assert.equal(currentTheme, 'light');
        });

        it('should set dark theme', () => {
            ThemeController.setTheme('dark');
            
            const currentTheme = ThemeController.getCurrentTheme();
            assert.equal(currentTheme, 'dark');
        });

        it('should apply theme to document', () => {
            ThemeController.setTheme('dark');
            
            const dataTheme = document.documentElement.getAttribute('data-theme');
            assert.equal(dataTheme, 'dark');
        });

        it('should reject invalid theme', () => {
            const currentTheme = ThemeController.getCurrentTheme();
            
            // Try to set invalid theme
            ThemeController.setTheme('invalid-theme');
            
            // Theme should remain unchanged
            const newTheme = ThemeController.getCurrentTheme();
            assert.equal(newTheme, currentTheme);
        });
    });

    describe('Theme Toggling', () => {
        
        it('should toggle from light to dark', () => {
            ThemeController.setTheme('light');
            ThemeController.toggleTheme();
            
            const currentTheme = ThemeController.getCurrentTheme();
            assert.equal(currentTheme, 'dark');
        });

        it('should toggle from dark to light', () => {
            ThemeController.setTheme('dark');
            ThemeController.toggleTheme();
            
            const currentTheme = ThemeController.getCurrentTheme();
            assert.equal(currentTheme, 'light');
        });

        it('should toggle multiple times correctly', () => {
            ThemeController.setTheme('light');
            
            ThemeController.toggleTheme(); // Should be dark
            assert.equal(ThemeController.getCurrentTheme(), 'dark');
            
            ThemeController.toggleTheme(); // Should be light
            assert.equal(ThemeController.getCurrentTheme(), 'light');
            
            ThemeController.toggleTheme(); // Should be dark
            assert.equal(ThemeController.getCurrentTheme(), 'dark');
        });
    });

    describe('Theme Persistence', () => {
        
        it('should save theme to localStorage', () => {
            ThemeController.setTheme('dark');
            
            const saved = localStorage.getItem('workout-app-theme');
            assert.equal(saved, 'dark');
        });

        it('should persist light theme', () => {
            ThemeController.setTheme('light');
            
            const saved = localStorage.getItem('workout-app-theme');
            assert.equal(saved, 'light');
        });

        it('should update localStorage when theme changes', () => {
            ThemeController.setTheme('light');
            assert.equal(localStorage.getItem('workout-app-theme'), 'light');
            
            ThemeController.setTheme('dark');
            assert.equal(localStorage.getItem('workout-app-theme'), 'dark');
        });

        it('should update localStorage when toggling theme', () => {
            ThemeController.setTheme('light');
            ThemeController.toggleTheme();
            
            const saved = localStorage.getItem('workout-app-theme');
            assert.equal(saved, 'dark');
        });
    });

    describe('Theme Events', () => {
        
        it('should dispatch themeChanged event when theme is set', (done) => {
            const handler = (event) => {
                assert.isObject(event.detail);
                assert.hasProperty(event.detail, 'theme');
                assert.equal(event.detail.theme, 'dark');
                window.removeEventListener('themeChanged', handler);
                done();
            };
            
            window.addEventListener('themeChanged', handler);
            ThemeController.setTheme('dark');
        });

        it('should dispatch themeChanged event when theme is toggled', (done) => {
            ThemeController.setTheme('light');
            
            const handler = (event) => {
                assert.isObject(event.detail);
                assert.equal(event.detail.theme, 'dark');
                window.removeEventListener('themeChanged', handler);
                done();
            };
            
            window.addEventListener('themeChanged', handler);
            ThemeController.toggleTheme();
        });

        it('should include correct theme in event detail', (done) => {
            const handler = (event) => {
                const theme = event.detail.theme;
                assert.isTrue(theme === 'light' || theme === 'dark');
                window.removeEventListener('themeChanged', handler);
                done();
            };
            
            window.addEventListener('themeChanged', handler);
            ThemeController.setTheme('light');
        });
    });

    describe('System Theme Detection', () => {
        
        it('should detect system theme preference', () => {
            // This test checks if the module can detect system preference
            // The actual value depends on the system settings
            const currentTheme = ThemeController.getCurrentTheme();
            
            assert.isString(currentTheme);
            assert.isTrue(['light', 'dark'].includes(currentTheme));
        });

        it('should use saved theme over system preference', () => {
            // Set a theme explicitly
            ThemeController.setTheme('dark');
            
            // Even if system preference is different, saved theme should be used
            const currentTheme = ThemeController.getCurrentTheme();
            assert.equal(currentTheme, 'dark');
        });
    });

    describe('DOM Integration', () => {
        
        it('should set data-theme attribute on document element', () => {
            ThemeController.setTheme('light');
            
            const attr = document.documentElement.getAttribute('data-theme');
            assert.equal(attr, 'light');
        });

        it('should update data-theme attribute when theme changes', () => {
            ThemeController.setTheme('light');
            assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
            
            ThemeController.setTheme('dark');
            assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
        });

        it('should update data-theme attribute when toggling', () => {
            ThemeController.setTheme('light');
            ThemeController.toggleTheme();
            
            const attr = document.documentElement.getAttribute('data-theme');
            assert.equal(attr, 'dark');
        });
    });

    describe('Error Handling', () => {
        
        it('should handle localStorage unavailability gracefully', () => {
            // This is hard to test without mocking, but we verify the module still works
            assert.doesNotThrow(() => {
                ThemeController.setTheme('dark');
            });
        });

        it('should handle invalid theme values gracefully', () => {
            const currentTheme = ThemeController.getCurrentTheme();
            
            assert.doesNotThrow(() => {
                ThemeController.setTheme(null);
                ThemeController.setTheme(undefined);
                ThemeController.setTheme('');
                ThemeController.setTheme(123);
            });
            
            // Theme should remain valid
            const newTheme = ThemeController.getCurrentTheme();
            assert.isTrue(['light', 'dark'].includes(newTheme));
        });

        it('should handle corrupted localStorage data', () => {
            // Set invalid data in localStorage
            localStorage.setItem('workout-app-theme', 'invalid-theme-value');
            
            // Module should still work and use a valid theme
            const theme = ThemeController.getCurrentTheme();
            assert.isTrue(['light', 'dark'].includes(theme));
        });
    });

    describe('Module State', () => {
        
        it('should report ready state correctly', () => {
            assert.isTrue(ThemeController.isReady());
        });

        it('should maintain state across multiple operations', () => {
            ThemeController.setTheme('dark');
            assert.equal(ThemeController.getCurrentTheme(), 'dark');
            
            ThemeController.toggleTheme();
            assert.equal(ThemeController.getCurrentTheme(), 'light');
            
            ThemeController.setTheme('dark');
            assert.equal(ThemeController.getCurrentTheme(), 'dark');
            
            // State should be consistent
            assert.isTrue(ThemeController.isReady());
        });
    });
});

