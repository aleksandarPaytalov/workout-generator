/**
 * TimerSettings Module Tests
 * 
 * Comprehensive unit tests for the TimerSettings module
 */

describe('TimerSettings', () => {
    
    beforeEach(() => {
        // Clear localStorage before each test
        localStorage.removeItem('workout-timer-settings');
        // Reset to defaults
        if (TimerSettings.isReady()) {
            TimerSettings.resetToDefaults();
        }
    });

    afterEach(() => {
        // Clean up localStorage
        localStorage.removeItem('workout-timer-settings');
    });

    describe('Module Initialization', () => {
        
        it('should be properly initialized', () => {
            assert.isTrue(TimerSettings.isReady());
        });

        it('should expose all required public methods', () => {
            const requiredMethods = [
                'init',
                'isReady',
                'getSettings',
                'getDefaultSettings',
                'updateSettings',
                'resetToDefaults',
                'getValidationRules',
                'getAvailableStartSounds'
            ];

            requiredMethods.forEach(method => {
                assert.isFunction(TimerSettings[method], `Method ${method} should be a function`);
            });
        });
    });

    describe('Default Settings', () => {
        
        it('should provide default settings', () => {
            const defaults = TimerSettings.getDefaultSettings();
            
            assert.isObject(defaults);
            assert.hasProperty(defaults, 'prepare');
            assert.hasProperty(defaults, 'work');
            assert.hasProperty(defaults, 'rest');
            assert.hasProperty(defaults, 'cyclesPerSet');
            assert.hasProperty(defaults, 'sets');
            assert.hasProperty(defaults, 'restBetweenSets');
            assert.hasProperty(defaults, 'autoAdvance');
            assert.hasProperty(defaults, 'soundEnabled');
            assert.hasProperty(defaults, 'startSound');
        });

        it('should have valid default values', () => {
            const defaults = TimerSettings.getDefaultSettings();
            
            assert.equal(defaults.prepare, 10);
            assert.equal(defaults.work, 45);
            assert.equal(defaults.rest, 15);
            assert.equal(defaults.cyclesPerSet, 3);
            assert.equal(defaults.sets, 3);
            assert.equal(defaults.restBetweenSets, 60);
            assert.isTrue(defaults.autoAdvance);
            assert.isTrue(defaults.soundEnabled);
            assert.equal(defaults.startSound, 'whistle');
        });

        it('should return a defensive copy of defaults', () => {
            const defaults1 = TimerSettings.getDefaultSettings();
            const defaults2 = TimerSettings.getDefaultSettings();
            
            assert.deepEqual(defaults1, defaults2);
            assert.isFalse(defaults1 === defaults2);
        });
    });

    describe('Getting Settings', () => {
        
        it('should get current settings', () => {
            const settings = TimerSettings.getSettings();
            
            assert.isObject(settings);
            assert.hasProperty(settings, 'prepare');
            assert.hasProperty(settings, 'work');
            assert.hasProperty(settings, 'rest');
        });

        it('should return default settings initially', () => {
            const settings = TimerSettings.getSettings();
            const defaults = TimerSettings.getDefaultSettings();
            
            assert.deepEqual(settings, defaults);
        });

        it('should return a defensive copy of settings', () => {
            const settings1 = TimerSettings.getSettings();
            const settings2 = TimerSettings.getSettings();
            
            assert.deepEqual(settings1, settings2);
            assert.isFalse(settings1 === settings2);
        });
    });

    describe('Updating Settings', () => {
        
        it('should update single setting', () => {
            const result = TimerSettings.updateSettings({ prepare: 15 });
            
            assert.isTrue(result.success);
            
            const settings = TimerSettings.getSettings();
            assert.equal(settings.prepare, 15);
        });

        it('should update multiple settings', () => {
            const updates = {
                prepare: 20,
                work: 60,
                rest: 30
            };
            
            const result = TimerSettings.updateSettings(updates);
            
            assert.isTrue(result.success);
            
            const settings = TimerSettings.getSettings();
            assert.equal(settings.prepare, 20);
            assert.equal(settings.work, 60);
            assert.equal(settings.rest, 30);
        });

        it('should preserve unchanged settings', () => {
            const result = TimerSettings.updateSettings({ prepare: 15 });
            
            assert.isTrue(result.success);
            
            const settings = TimerSettings.getSettings();
            const defaults = TimerSettings.getDefaultSettings();
            
            // Other settings should remain at defaults
            assert.equal(settings.work, defaults.work);
            assert.equal(settings.rest, defaults.rest);
        });

        it('should validate numeric settings', () => {
            const result = TimerSettings.updateSettings({ prepare: -5 });
            
            assert.isFalse(result.success);
            assert.isArray(result.errors);
            assert.isTrue(result.errors.length > 0);
        });

        it('should reject values below minimum', () => {
            const result = TimerSettings.updateSettings({ work: 2 }); // Min is 5
            
            assert.isFalse(result.success);
        });

        it('should reject values above maximum', () => {
            const result = TimerSettings.updateSettings({ prepare: 100 }); // Max is 60
            
            assert.isFalse(result.success);
        });

        it('should accept values within valid range', () => {
            const result = TimerSettings.updateSettings({ 
                prepare: 30,  // 0-60
                work: 45,     // 5-600
                rest: 20,     // 0-300
                cyclesPerSet: 5,  // 1-20
                sets: 4,      // 1-20
                restBetweenSets: 90  // 0-600
            });
            
            assert.isTrue(result.success);
        });

        it('should update boolean settings', () => {
            const result = TimerSettings.updateSettings({ 
                autoAdvance: false,
                soundEnabled: false
            });
            
            assert.isTrue(result.success);
            
            const settings = TimerSettings.getSettings();
            assert.isFalse(settings.autoAdvance);
            assert.isFalse(settings.soundEnabled);
        });

        it('should update start sound setting', () => {
            const result = TimerSettings.updateSettings({ startSound: 'boxing-bell' });
            
            assert.isTrue(result.success);
            
            const settings = TimerSettings.getSettings();
            assert.equal(settings.startSound, 'boxing-bell');
        });
    });

    describe('Settings Persistence', () => {
        
        it('should save settings to localStorage', () => {
            TimerSettings.updateSettings({ prepare: 25 });
            
            const saved = localStorage.getItem('workout-timer-settings');
            assert.isNotNull(saved);
            
            const parsed = JSON.parse(saved);
            assert.equal(parsed.prepare, 25);
        });

        it('should persist settings across module reloads', () => {
            TimerSettings.updateSettings({ work: 50 });
            
            // Simulate reload by getting settings again
            const settings = TimerSettings.getSettings();
            assert.equal(settings.work, 50);
        });

        it('should load saved settings on initialization', () => {
            // Manually set localStorage
            const customSettings = TimerSettings.getDefaultSettings();
            customSettings.prepare = 35;
            localStorage.setItem('workout-timer-settings', JSON.stringify(customSettings));
            
            // Re-initialize
            TimerSettings.init();
            
            const settings = TimerSettings.getSettings();
            assert.equal(settings.prepare, 35);
        });
    });

    describe('Resetting Settings', () => {
        
        it('should reset to default settings', () => {
            // Change some settings
            TimerSettings.updateSettings({ 
                prepare: 20,
                work: 60,
                rest: 30
            });
            
            // Reset
            const result = TimerSettings.resetToDefaults();
            
            assert.isTrue(result);
            
            const settings = TimerSettings.getSettings();
            const defaults = TimerSettings.getDefaultSettings();
            
            assert.deepEqual(settings, defaults);
        });

        it('should clear custom settings from localStorage', () => {
            TimerSettings.updateSettings({ prepare: 20 });
            TimerSettings.resetToDefaults();
            
            const saved = localStorage.getItem('workout-timer-settings');
            const parsed = JSON.parse(saved);
            const defaults = TimerSettings.getDefaultSettings();
            
            assert.deepEqual(parsed, defaults);
        });
    });

    describe('Validation Rules', () => {
        
        it('should provide validation rules', () => {
            const rules = TimerSettings.getValidationRules();
            
            assert.isObject(rules);
            assert.hasProperty(rules, 'prepare');
            assert.hasProperty(rules, 'work');
            assert.hasProperty(rules, 'rest');
            assert.hasProperty(rules, 'cyclesPerSet');
            assert.hasProperty(rules, 'sets');
            assert.hasProperty(rules, 'restBetweenSets');
        });

        it('should include min and max values in rules', () => {
            const rules = TimerSettings.getValidationRules();
            
            assert.hasProperty(rules.prepare, 'min');
            assert.hasProperty(rules.prepare, 'max');
            assert.hasProperty(rules.work, 'min');
            assert.hasProperty(rules.work, 'max');
        });

        it('should return a defensive copy of rules', () => {
            const rules1 = TimerSettings.getValidationRules();
            const rules2 = TimerSettings.getValidationRules();
            
            assert.deepEqual(rules1, rules2);
            assert.isFalse(rules1 === rules2);
        });
    });

    describe('Available Start Sounds', () => {
        
        it('should provide list of available start sounds', () => {
            const sounds = TimerSettings.getAvailableStartSounds();
            
            assert.isArray(sounds);
            assert.isTrue(sounds.length > 0);
        });

        it('should include whistle as default sound', () => {
            const sounds = TimerSettings.getAvailableStartSounds();
            
            const whistleSound = sounds.find(s => s.id === 'whistle');
            assert.isObject(whistleSound);
        });

        it('should have proper structure for each sound', () => {
            const sounds = TimerSettings.getAvailableStartSounds();
            
            sounds.forEach(sound => {
                assert.hasProperty(sound, 'id');
                assert.hasProperty(sound, 'name');
                assert.isString(sound.id);
                assert.isString(sound.name);
            });
        });

        it('should return a defensive copy of sounds array', () => {
            const sounds1 = TimerSettings.getAvailableStartSounds();
            const sounds2 = TimerSettings.getAvailableStartSounds();
            
            assert.deepEqual(sounds1, sounds2);
            assert.isFalse(sounds1 === sounds2);
        });
    });

    describe('Error Handling', () => {
        
        it('should handle invalid setting names gracefully', () => {
            const result = TimerSettings.updateSettings({ invalidSetting: 100 });
            
            // Should succeed but ignore invalid settings
            assert.isTrue(result.success);
        });

        it('should handle non-numeric values for numeric settings', () => {
            const result = TimerSettings.updateSettings({ prepare: 'invalid' });
            
            assert.isFalse(result.success);
        });

        it('should handle null or undefined updates', () => {
            assert.doesNotThrow(() => {
                TimerSettings.updateSettings(null);
                TimerSettings.updateSettings(undefined);
            });
        });

        it('should handle corrupted localStorage data', () => {
            // Set invalid JSON in localStorage
            localStorage.setItem('workout-timer-settings', 'invalid-json{');
            
            // Should fall back to defaults
            TimerSettings.init();
            const settings = TimerSettings.getSettings();
            const defaults = TimerSettings.getDefaultSettings();
            
            assert.deepEqual(settings, defaults);
        });
    });
});

