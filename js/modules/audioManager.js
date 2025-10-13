/**
 * Audio Manager Module
 * Handles all audio playback for the workout timer using Web Audio API
 *
 * Features:
 * - Generate beep sounds programmatically (no external files needed)
 * - Three sound types: Start, End, Countdown
 * - Respects soundEnabled setting from TimerSettings
 * - Handles browser autoplay policies
 *
 * @module AudioManager
 */

const AudioManager = (() => {
  // Private state
  let audioContext = null;
  let isInitialized = false;
  let soundEnabled = true;

  /**
   * Initialize the Audio Manager
   * Creates Web Audio Context
   * @returns {boolean} True if initialization successful
   */
  const init = () => {
    try {
      // Create AudioContext (with vendor prefix support)
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
      isInitialized = true;
      console.log("AudioManager: Initialized successfully");
      console.log("AudioManager: AudioContext state:", audioContext.state);
      return true;
    } catch (error) {
      console.error("AudioManager: Failed to initialize", error);
      console.warn("AudioManager: Audio features will be disabled");
      return false;
    }
  };

  /**
   * Check if module is ready
   * @returns {boolean} True if initialized
   */
  const isReady = () => {
    return isInitialized;
  };

  /**
   * Play a beep sound with specified characteristics
   * @private
   * @param {number} frequency - Frequency in Hz
   * @param {number} duration - Duration in seconds
   * @param {number} volume - Volume (0.0 to 1.0)
   */
  const playBeep = (frequency, duration, volume = 0.3) => {
    // Check if audio is enabled and initialized
    if (!isInitialized || !soundEnabled || !audioContext) {
      console.log(
        "AudioManager: Sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === "suspended") {
        console.log("AudioManager: Resuming suspended AudioContext");
        audioContext.resume().then(() => {
          console.log("AudioManager: AudioContext resumed successfully");
        });
      }

      // Create oscillator (generates the tone)
      const oscillator = audioContext.createOscillator();

      // Create gain node (controls volume)
      const gainNode = audioContext.createGain();

      // Connect nodes: oscillator -> gain -> destination (speakers)
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Set oscillator properties
      oscillator.frequency.value = frequency; // Pitch
      oscillator.type = "sine"; // Waveform type (sine = smooth tone)

      // Set volume with fade out to avoid clicking sound
      const currentTime = audioContext.currentTime;
      gainNode.gain.setValueAtTime(volume, currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

      // Start and stop the oscillator
      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      console.log(
        `AudioManager: Playing beep - ${frequency}Hz, ${duration}s, volume ${volume}`
      );
    } catch (error) {
      console.error("AudioManager: Error playing beep", error);
    }
  };

  /**
   * Play start sound
   * Plays when timer/phase starts
   * Sound: 800Hz, 200ms, medium volume
   * @public
   */
  const playStartSound = () => {
    console.log("AudioManager: Playing START sound");
    playBeep(800, 0.2, 0.3); // 800Hz, 200ms, medium volume
  };

  /**
   * Play end sound
   * Plays when timer/phase ends
   * Sound: 600Hz, 300ms, slightly louder
   * @public
   */
  const playEndSound = () => {
    console.log("AudioManager: Playing END sound");
    playBeep(600, 0.3, 0.4); // 600Hz, 300ms, slightly louder
  };

  /**
   * Play countdown beep
   * Plays during last 5 seconds (5, 4, 3, 2, 1)
   * Sound: 1000Hz, 150ms, high pitch for urgency
   * @public
   */
  const playCountdownBeep = () => {
    console.log("AudioManager: Playing COUNTDOWN beep");
    playBeep(1000, 0.15, 0.35); // 1000Hz, 150ms, high pitch
  };

  /**
   * Play realistic referee whistle sound
   * Plays when work phase starts (long, continuous whistle blow like a football referee)
   * Sound: Multi-layered whistle with harmonics and vibrato for realistic, warm tone
   * @public
   */
  const playWhistleSound = () => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      console.log(
        "AudioManager: Whistle sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === "suspended") {
        console.log("AudioManager: Resuming suspended AudioContext");
        audioContext.resume().then(() => {
          console.log("AudioManager: AudioContext resumed successfully");
        });
      }

      const currentTime = audioContext.currentTime;
      const baseFrequency = 2200; // Lower frequency for warmer, less sharp sound
      const duration = 1.5; // 1.5 seconds - long continuous blow
      const volume = 0.3; // Lower volume for softer sound

      // Create main oscillator (fundamental frequency)
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();

      osc1.connect(gain1);
      gain1.connect(audioContext.destination);

      osc1.type = "triangle"; // Triangle wave for softer, more realistic tone
      osc1.frequency.setValueAtTime(baseFrequency, currentTime);

      // Add slight vibrato (frequency modulation) for realism
      const vibrato = audioContext.createOscillator();
      const vibratoGain = audioContext.createGain();

      vibrato.frequency.setValueAtTime(5, currentTime); // 5Hz vibrato
      vibratoGain.gain.setValueAtTime(12, currentTime); // Slightly more pitch variation for warmth

      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc1.frequency);

      vibrato.start(currentTime);
      vibrato.stop(currentTime + duration);

      // Create second harmonic (adds richness)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();

      osc2.connect(gain2);
      gain2.connect(audioContext.destination);

      osc2.type = "sine";
      osc2.frequency.setValueAtTime(baseFrequency * 1.5, currentTime); // 1.5x harmonic

      // Second harmonic is quieter
      gain2.gain.setValueAtTime(0, currentTime);
      gain2.gain.linearRampToValueAtTime(volume * 0.25, currentTime + 0.05);
      gain2.gain.setValueAtTime(volume * 0.25, currentTime + duration - 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

      // Create third harmonic (adds subtle brightness)
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();

      osc3.connect(gain3);
      gain3.connect(audioContext.destination);

      osc3.type = "sine";
      osc3.frequency.setValueAtTime(baseFrequency * 2, currentTime); // 2x harmonic

      // Third harmonic is even quieter
      gain3.gain.setValueAtTime(0, currentTime);
      gain3.gain.linearRampToValueAtTime(volume * 0.1, currentTime + 0.05);
      gain3.gain.setValueAtTime(volume * 0.1, currentTime + duration - 0.2);
      gain3.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

      // Main oscillator volume envelope
      gain1.gain.setValueAtTime(0, currentTime);
      gain1.gain.linearRampToValueAtTime(volume, currentTime + 0.08); // Slower attack (80ms) for softer start
      gain1.gain.setValueAtTime(volume, currentTime + duration - 0.25); // Sustain
      gain1.gain.exponentialRampToValueAtTime(0.01, currentTime + duration); // Fade out (250ms)

      // Start all oscillators
      osc1.start(currentTime);
      osc1.stop(currentTime + duration);

      osc2.start(currentTime);
      osc2.stop(currentTime + duration);

      osc3.start(currentTime);
      osc3.stop(currentTime + duration);

      console.log(
        "AudioManager: Playing WARM REFEREE WHISTLE sound (2200Hz + harmonics, 1.5s)"
      );
    } catch (error) {
      console.error("AudioManager: Error playing whistle sound", error);
    }
  };

  /**
   * Enable or disable sound playback
   * @param {boolean} enabled - True to enable sounds, false to disable
   * @public
   */
  const setEnabled = (enabled) => {
    soundEnabled = enabled;
    console.log(`AudioManager: Sound ${enabled ? "ENABLED" : "DISABLED"}`);
  };

  /**
   * Check if sounds are enabled
   * @returns {boolean} True if sounds are enabled
   * @public
   */
  const isEnabled = () => {
    return soundEnabled;
  };

  /**
   * Get current AudioContext state
   * Useful for debugging
   * @returns {string} AudioContext state (running, suspended, closed)
   * @public
   */
  const getContextState = () => {
    if (!audioContext) return "not initialized";
    return audioContext.state;
  };

  // Public API
  return {
    init,
    isReady,
    playStartSound,
    playEndSound,
    playCountdownBeep,
    playWhistleSound,
    setEnabled,
    isEnabled,
    getContextState,
  };
})();

// Make AudioManager available globally (if not using module system)
if (typeof window !== "undefined") {
  window.AudioManager = AudioManager;
}
