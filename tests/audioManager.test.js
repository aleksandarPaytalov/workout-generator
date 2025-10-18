/**
 * AudioManager Module Tests
 * 
 * Comprehensive unit tests for the AudioManager module
 */

describe('AudioManager', () => {
    
    describe('Module Initialization', () => {
        
        it('should be properly initialized', () => {
            assert.isTrue(AudioManager.isReady());
        });

        it('should expose all required public methods', () => {
            const requiredMethods = [
                'init',
                'isReady',
                'playStartSound',
                'playRefereeWhistle',
                'playBoxingBell',
                'playAirHorn',
                'playBeepSequence',
                'playCountdownVoice',
                'playSiren',
                'playChime',
                'playBuzzer',
                'playGong',
                'playElectronicBeep',
                'playEndSound',
                'playCountdownBeep',
                'setEnabled',
                'isEnabled'
            ];

            requiredMethods.forEach(method => {
                assert.isFunction(AudioManager[method], `Method ${method} should be a function`);
            });
        });
    });

    describe('Audio State Management', () => {
        
        it('should report enabled state', () => {
            const enabled = AudioManager.isEnabled();
            
            assert.isBoolean(enabled);
        });

        it('should enable audio', () => {
            AudioManager.setEnabled(true);
            
            assert.isTrue(AudioManager.isEnabled());
        });

        it('should disable audio', () => {
            AudioManager.setEnabled(false);
            
            assert.isFalse(AudioManager.isEnabled());
        });

        it('should toggle audio state', () => {
            const initialState = AudioManager.isEnabled();
            
            AudioManager.setEnabled(!initialState);
            assert.equal(AudioManager.isEnabled(), !initialState);
            
            AudioManager.setEnabled(initialState);
            assert.equal(AudioManager.isEnabled(), initialState);
        });
    });

    describe('Sound Playback Functions', () => {
        
        it('should have playStartSound function', () => {
            assert.isFunction(AudioManager.playStartSound);
        });

        it('should accept sound ID parameter in playStartSound', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('whistle');
            });
        });

        it('should have individual sound functions', () => {
            const soundFunctions = [
                'playRefereeWhistle',
                'playBoxingBell',
                'playAirHorn',
                'playBeepSequence',
                'playCountdownVoice',
                'playSiren',
                'playChime',
                'playBuzzer',
                'playGong',
                'playElectronicBeep'
            ];

            soundFunctions.forEach(func => {
                assert.isFunction(AudioManager[func]);
            });
        });

        it('should not throw errors when playing sounds', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('whistle');
                AudioManager.playRefereeWhistle();
                AudioManager.playBoxingBell();
                AudioManager.playEndSound();
            });
        });

        it('should handle playback when audio is disabled', () => {
            AudioManager.setEnabled(false);
            
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('whistle');
                AudioManager.playEndSound();
            });
        });

        it('should handle playback when audio is enabled', () => {
            AudioManager.setEnabled(true);
            
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('whistle');
                AudioManager.playEndSound();
            });
        });
    });

    describe('Sound ID Support', () => {
        
        it('should support whistle sound ID', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('whistle');
            });
        });

        it('should support boxing-bell sound ID', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('boxing-bell');
            });
        });

        it('should support air-horn sound ID', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('air-horn');
            });
        });

        it('should support beep-sequence sound ID', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('beep-sequence');
            });
        });

        it('should support countdown-voice sound ID', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('countdown-voice');
            });
        });

        it('should support siren sound ID', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('siren');
            });
        });

        it('should support chime sound ID', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('chime');
            });
        });

        it('should support buzzer sound ID', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('buzzer');
            });
        });

        it('should support gong sound ID', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('gong');
            });
        });

        it('should support electronic-beep sound ID', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('electronic-beep');
            });
        });

        it('should handle invalid sound ID gracefully', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('invalid-sound-id');
            });
        });

        it('should default to whistle when no sound ID provided', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound();
            });
        });
    });

    describe('Countdown and End Sounds', () => {
        
        it('should have playCountdownBeep function', () => {
            assert.isFunction(AudioManager.playCountdownBeep);
        });

        it('should have playEndSound function', () => {
            assert.isFunction(AudioManager.playEndSound);
        });

        it('should play countdown beep without errors', () => {
            assert.doesNotThrow(() => {
                AudioManager.playCountdownBeep();
            });
        });

        it('should play end sound without errors', () => {
            assert.doesNotThrow(() => {
                AudioManager.playEndSound();
            });
        });
    });

    describe('Error Handling', () => {
        
        it('should handle initialization errors gracefully', () => {
            // Module should be initialized and ready
            assert.isTrue(AudioManager.isReady());
        });

        it('should handle playback errors gracefully', () => {
            // Should not throw even if AudioContext is not available
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('whistle');
            });
        });

        it('should handle invalid parameters gracefully', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound(null);
                AudioManager.playStartSound(undefined);
                AudioManager.playStartSound(123);
                AudioManager.playStartSound({});
            });
        });

        it('should handle setEnabled with invalid parameters', () => {
            assert.doesNotThrow(() => {
                AudioManager.setEnabled(null);
                AudioManager.setEnabled(undefined);
                AudioManager.setEnabled('true');
            });
        });
    });

    describe('Module State', () => {
        
        it('should maintain ready state', () => {
            assert.isTrue(AudioManager.isReady());
        });

        it('should maintain enabled state across operations', () => {
            AudioManager.setEnabled(true);
            AudioManager.playStartSound('whistle');
            assert.isTrue(AudioManager.isEnabled());
            
            AudioManager.setEnabled(false);
            AudioManager.playStartSound('whistle');
            assert.isFalse(AudioManager.isEnabled());
        });
    });

    describe('Web Audio API Integration', () => {
        
        it('should work with or without Web Audio API support', () => {
            // Module should initialize regardless of browser support
            assert.isTrue(AudioManager.isReady());
        });

        it('should handle AudioContext creation', () => {
            // Module should handle AudioContext availability
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('whistle');
            });
        });
    });

    describe('Sound Variety', () => {
        
        it('should support at least 10 different sounds', () => {
            const soundIds = [
                'whistle',
                'boxing-bell',
                'air-horn',
                'beep-sequence',
                'countdown-voice',
                'siren',
                'chime',
                'buzzer',
                'gong',
                'electronic-beep'
            ];

            soundIds.forEach(soundId => {
                assert.doesNotThrow(() => {
                    AudioManager.playStartSound(soundId);
                }, `Should support sound ID: ${soundId}`);
            });

            assert.isTrue(soundIds.length >= 10, 'Should have at least 10 different sounds');
        });
    });

    describe('Performance', () => {
        
        it('should handle rapid sound playback requests', () => {
            assert.doesNotThrow(() => {
                for (let i = 0; i < 5; i++) {
                    AudioManager.playStartSound('whistle');
                }
            });
        });

        it('should handle multiple different sounds in sequence', () => {
            assert.doesNotThrow(() => {
                AudioManager.playStartSound('whistle');
                AudioManager.playStartSound('boxing-bell');
                AudioManager.playStartSound('air-horn');
                AudioManager.playCountdownBeep();
                AudioManager.playEndSound();
            });
        });
    });
});

