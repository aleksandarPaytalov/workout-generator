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
      Logger.info("AudioManager", "Initialized successfully");
      Logger.debug("AudioManager", "AudioContext state:", audioContext.state);
      return true;
    } catch (error) {
      Logger.error("AudioManager", "Failed to initialize", error);
      Logger.warn("AudioManager", "Audio features will be disabled");
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
      Logger.debug(
        "AudioManager",
        "Sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === "suspended") {
        Logger.debug("AudioManager", "Resuming suspended AudioContext");
        audioContext.resume().then(() => {
          Logger.debug("AudioManager", "AudioContext resumed successfully");
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

      Logger.debug(
        "AudioManager",
        `Playing beep - ${frequency}Hz, ${duration}s, volume ${volume}`
      );
    } catch (error) {
      Logger.error("AudioManager", "Error playing beep", error);
    }
  };

  /**
   * Play start sound based on selected sound ID
   * Master function that calls the appropriate sound function
   * @param {string} soundId - ID of the sound to play (default: "whistle")
   * @public
   */
  const playStartSound = (soundId = "whistle") => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      Logger.debug(
        "AudioManager",
        "Start sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    // Resume context if suspended
    if (audioContext.state === "suspended") {
      Logger.debug("AudioManager", "Resuming suspended AudioContext");
      audioContext.resume().then(() => {
        Logger.debug("AudioManager", "AudioContext resumed successfully");
      });
    }

    // Call appropriate sound function based on soundId
    switch (soundId) {
      case "whistle":
        playRefereeWhistle();
        break;
      case "boxingBell":
        playBoxingBell();
        break;
      case "airHorn":
        playAirHorn();
        break;
      case "beepSequence":
        playBeepSequence();
        break;
      case "countdownVoice":
        playCountdownVoice();
        break;
      case "siren":
        playSiren();
        break;
      case "chime":
        playChime();
        break;
      case "buzzer":
        playBuzzer();
        break;
      case "gong":
        playGong();
        break;
      case "electronicBeep":
        playElectronicBeep();
        break;
      default:
        Logger.warn(
          "AudioManager",
          `Unknown sound ID "${soundId}", using default whistle`
        );
        playRefereeWhistle();
    }
  };

  /**
   * Play end sound
   * Plays when timer/phase ends
   * Sound: 600Hz, 300ms, slightly louder
   * @public
   */
  const playEndSound = () => {
    Logger.debug("AudioManager", "Playing END sound");
    playBeep(600, 0.3, 0.4); // 600Hz, 300ms, slightly louder
  };

  /**
   * Play countdown beep
   * Plays during last 5 seconds (5, 4, 3, 2, 1)
   * Sound: 1000Hz, 150ms, high pitch for urgency
   * @public
   */
  const playCountdownBeep = () => {
    Logger.debug("AudioManager", "Playing COUNTDOWN beep");
    playBeep(1000, 0.15, 0.35); // 1000Hz, 150ms, high pitch
  };

  /**
   * Play realistic referee whistle sound
   * Plays when work phase starts (long, continuous whistle blow like a football referee)
   * Sound: Multi-layered whistle with harmonics and vibrato for realistic, warm tone
   * @public
   */
  const playRefereeWhistle = () => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      Logger.debug(
        "AudioManager",
        "Whistle sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      // Resume context if suspended (browser autoplay policy)
      if (audioContext.state === "suspended") {
        Logger.debug("AudioManager", "Resuming suspended AudioContext");
        audioContext.resume().then(() => {
          Logger.debug("AudioManager", "AudioContext resumed successfully");
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

      Logger.debug(
        "AudioManager",
        "Playing WARM REFEREE WHISTLE sound (2200Hz + harmonics, 1.5s)"
      );
    } catch (error) {
      Logger.error("AudioManager", "Error playing whistle sound", error);
    }
  };

  /**
   * Play boxing bell sound (DING DING DING)
   * Three quick bell strikes
   * Sound: 1200Hz sine wave, 3 strikes × 150ms each with 100ms gaps
   * @public
   */
  const playBoxingBell = () => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      Logger.debug(
        "AudioManager",
        "Boxing bell sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      const frequency = 1200; // Bell frequency
      const strikeDuration = 0.15; // 150ms per strike
      const gapDuration = 0.1; // 100ms gap between strikes
      const volume = 0.4;

      // Play 3 bell strikes
      for (let i = 0; i < 3; i++) {
        const startTime = currentTime + i * (strikeDuration + gapDuration);

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(frequency, startTime);

        // Sharp attack, quick decay for bell-like sound
        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(volume, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          startTime + strikeDuration
        );

        oscillator.start(startTime);
        oscillator.stop(startTime + strikeDuration);
      }

      Logger.debug(
        "AudioManager",
        "Playing BOXING BELL sound (DING DING DING)"
      );
    } catch (error) {
      Logger.error("AudioManager", "Error playing boxing bell sound", error);
    }
  };

  /**
   * Play air horn sound
   * Powerful blast sound
   * Sound: 400Hz square wave, 800ms duration with slight frequency wobble
   * @public
   */
  const playAirHorn = () => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      Logger.debug(
        "AudioManager",
        "Air horn sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      const baseFrequency = 400;
      const duration = 0.8; // 800ms
      const volume = 0.5; // Louder than whistle

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "square"; // Harsh, loud sound
      oscillator.frequency.setValueAtTime(baseFrequency, currentTime);

      // Add slight frequency wobble for realism
      oscillator.frequency.linearRampToValueAtTime(
        baseFrequency * 0.98,
        currentTime + duration / 2
      );
      oscillator.frequency.linearRampToValueAtTime(
        baseFrequency,
        currentTime + duration
      );

      // Volume envelope
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.05);
      gainNode.gain.setValueAtTime(volume, currentTime + duration - 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      Logger.debug("AudioManager", "Playing AIR HORN sound (400Hz, 800ms)");
    } catch (error) {
      Logger.error("AudioManager", "Error playing air horn sound", error);
    }
  };

  /**
   * Play beep sequence sound
   * Three ascending beeps
   * Sound: 800Hz → 1000Hz → 1200Hz, 200ms each with 150ms gaps
   * @public
   */
  const playBeepSequence = () => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      Logger.debug(
        "AudioManager",
        "Beep sequence sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      const frequencies = [800, 1000, 1200]; // Ascending frequencies
      const beepDuration = 0.2; // 200ms per beep
      const gapDuration = 0.15; // 150ms gap
      const volume = 0.35;

      frequencies.forEach((frequency, index) => {
        const startTime = currentTime + index * (beepDuration + gapDuration);

        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.type = "sine"; // Clean tones
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(volume, startTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          startTime + beepDuration
        );

        oscillator.start(startTime);
        oscillator.stop(startTime + beepDuration);
      });

      Logger.debug(
        "AudioManager",
        "Playing BEEP SEQUENCE sound (800Hz → 1000Hz → 1200Hz)"
      );
    } catch (error) {
      Logger.error("AudioManager", "Error playing beep sequence sound", error);
    }
  };

  /**
   * Play countdown voice sound
   * Synthesized "3, 2, 1, GO!" effect using frequency modulation
   * Sound: Four segments with varying frequencies to simulate speech
   * @public
   */
  const playCountdownVoice = () => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      Logger.debug(
        "AudioManager",
        "Countdown voice sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      const volume = 0.3;

      // "3" - 300ms
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.type = "sawtooth";
      osc1.frequency.setValueAtTime(200, currentTime);
      osc1.frequency.linearRampToValueAtTime(180, currentTime + 0.3);
      gain1.gain.setValueAtTime(volume, currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.3);
      osc1.start(currentTime);
      osc1.stop(currentTime + 0.3);

      // "2" - 300ms
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.type = "sawtooth";
      osc2.frequency.setValueAtTime(220, currentTime + 0.4);
      osc2.frequency.linearRampToValueAtTime(200, currentTime + 0.7);
      gain2.gain.setValueAtTime(volume, currentTime + 0.4);
      gain2.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.7);
      osc2.start(currentTime + 0.4);
      osc2.stop(currentTime + 0.7);

      // "1" - 300ms
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.connect(gain3);
      gain3.connect(audioContext.destination);
      osc3.type = "sawtooth";
      osc3.frequency.setValueAtTime(240, currentTime + 0.8);
      osc3.frequency.linearRampToValueAtTime(220, currentTime + 1.1);
      gain3.gain.setValueAtTime(volume, currentTime + 0.8);
      gain3.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.1);
      osc3.start(currentTime + 0.8);
      osc3.stop(currentTime + 1.1);

      // "GO!" - 500ms (higher pitch, more energetic)
      const osc4 = audioContext.createOscillator();
      const gain4 = audioContext.createGain();
      osc4.connect(gain4);
      gain4.connect(audioContext.destination);
      osc4.type = "sawtooth";
      osc4.frequency.setValueAtTime(300, currentTime + 1.2);
      osc4.frequency.linearRampToValueAtTime(280, currentTime + 1.7);
      gain4.gain.setValueAtTime(volume * 1.2, currentTime + 1.2);
      gain4.gain.exponentialRampToValueAtTime(0.01, currentTime + 1.7);
      osc4.start(currentTime + 1.2);
      osc4.stop(currentTime + 1.7);

      Logger.debug(
        "AudioManager",
        "Playing COUNTDOWN VOICE sound (3, 2, 1, GO!)"
      );
    } catch (error) {
      Logger.error(
        "AudioManager",
        "Error playing countdown voice sound",
        error
      );
    }
  };

  /**
   * Play siren sound
   * Rising alarm sound
   * Sound: Frequency sweep 600Hz → 1200Hz over 1 second, sawtooth wave
   * @public
   */
  const playSiren = () => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      Logger.debug(
        "AudioManager",
        "Siren sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      const duration = 1.0; // 1 second
      const volume = 0.4;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sawtooth"; // Harsh alarm sound

      // Frequency sweep: 600Hz → 1200Hz
      oscillator.frequency.setValueAtTime(600, currentTime);
      oscillator.frequency.linearRampToValueAtTime(
        1200,
        currentTime + duration
      );

      // Volume envelope
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.05);
      gainNode.gain.setValueAtTime(volume, currentTime + duration - 0.15);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      Logger.debug("AudioManager", "Playing SIREN sound (600Hz → 1200Hz, 1s)");
    } catch (error) {
      Logger.error("AudioManager", "Error playing siren sound", error);
    }
  };

  /**
   * Play chime sound
   * Pleasant bell chime
   * Sound: 800Hz with harmonics, triangle wave, long decay (2 seconds)
   * @public
   */
  const playChime = () => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      Logger.debug(
        "AudioManager",
        "Chime sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      const baseFrequency = 800;
      const duration = 2.0; // Long decay for bell-like resonance
      const volume = 0.3;

      // Base frequency
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.type = "triangle"; // Softer tone
      osc1.frequency.setValueAtTime(baseFrequency, currentTime);
      gain1.gain.setValueAtTime(volume, currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
      osc1.start(currentTime);
      osc1.stop(currentTime + duration);

      // First harmonic (1600Hz)
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.type = "triangle";
      osc2.frequency.setValueAtTime(baseFrequency * 2, currentTime);
      gain2.gain.setValueAtTime(volume * 0.5, currentTime);
      gain2.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
      osc2.start(currentTime);
      osc2.stop(currentTime + duration);

      // Second harmonic (2400Hz)
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.connect(gain3);
      gain3.connect(audioContext.destination);
      osc3.type = "triangle";
      osc3.frequency.setValueAtTime(baseFrequency * 3, currentTime);
      gain3.gain.setValueAtTime(volume * 0.25, currentTime);
      gain3.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
      osc3.start(currentTime);
      osc3.stop(currentTime + duration);

      Logger.debug(
        "AudioManager",
        "Playing CHIME sound (800Hz + harmonics, 2s)"
      );
    } catch (error) {
      Logger.error("AudioManager", "Error playing chime sound", error);
    }
  };

  /**
   * Play buzzer sound
   * Game show style buzzer
   * Sound: 200Hz square wave, 600ms, sharp attack, no fade
   * @public
   */
  const playBuzzer = () => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      Logger.debug(
        "AudioManager",
        "Buzzer sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      const frequency = 200; // Low, harsh frequency
      const duration = 0.6; // 600ms
      const volume = 0.4;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "square"; // Harsh sound
      oscillator.frequency.setValueAtTime(frequency, currentTime);

      // Sharp attack, no fade (abrupt end)
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01);
      gainNode.gain.setValueAtTime(volume, currentTime + duration - 0.01);
      gainNode.gain.linearRampToValueAtTime(0, currentTime + duration);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      Logger.debug("AudioManager", "Playing BUZZER sound (200Hz, 600ms)");
    } catch (error) {
      Logger.error("AudioManager", "Error playing buzzer sound", error);
    }
  };

  /**
   * Play gong sound
   * Deep resonant gong
   * Sound: 150Hz with rich harmonics, multiple oscillators, long decay (3 seconds) with vibrato
   * @public
   */
  const playGong = () => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      Logger.debug(
        "AudioManager",
        "Gong sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      const baseFrequency = 150; // Deep, low frequency
      const duration = 3.0; // Long decay
      const volume = 0.35;

      // Base frequency
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(baseFrequency, currentTime);

      // Add vibrato for realism
      const vibrato = audioContext.createOscillator();
      const vibratoGain = audioContext.createGain();
      vibrato.frequency.setValueAtTime(3, currentTime); // 3Hz vibrato
      vibratoGain.gain.setValueAtTime(5, currentTime);
      vibrato.connect(vibratoGain);
      vibratoGain.connect(osc1.frequency);
      vibrato.start(currentTime);
      vibrato.stop(currentTime + duration);

      gain1.gain.setValueAtTime(volume, currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
      osc1.start(currentTime);
      osc1.stop(currentTime + duration);

      // Harmonics for complex tone
      const harmonics = [2, 3, 4, 5];
      harmonics.forEach((harmonic) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.connect(gain);
        gain.connect(audioContext.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(baseFrequency * harmonic, currentTime);
        gain.gain.setValueAtTime(volume / (harmonic * 2), currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);
        osc.start(currentTime);
        osc.stop(currentTime + duration);
      });

      Logger.debug(
        "AudioManager",
        "Playing GONG sound (150Hz + harmonics, 3s)"
      );
    } catch (error) {
      Logger.error("AudioManager", "Error playing gong sound", error);
    }
  };

  /**
   * Play electronic beep sound
   * Futuristic sci-fi beep
   * Sound: 1500Hz sine wave, 400ms, frequency sweep at end (1500Hz → 1200Hz)
   * @public
   */
  const playElectronicBeep = () => {
    if (!isInitialized || !soundEnabled || !audioContext) {
      Logger.debug(
        "AudioManager",
        "Electronic beep sound playback skipped (disabled or not initialized)"
      );
      return;
    }

    try {
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const currentTime = audioContext.currentTime;
      const startFrequency = 1500;
      const endFrequency = 1200;
      const duration = 0.4; // 400ms
      const volume = 0.35;

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sine"; // Clean, modern sound
      oscillator.frequency.setValueAtTime(startFrequency, currentTime);
      oscillator.frequency.linearRampToValueAtTime(
        endFrequency,
        currentTime + duration
      );

      // Volume envelope
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.02);
      gainNode.gain.setValueAtTime(volume, currentTime + duration - 0.1);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + duration);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + duration);

      Logger.debug(
        "AudioManager",
        "Playing ELECTRONIC BEEP sound (1500Hz → 1200Hz, 400ms)"
      );
    } catch (error) {
      Logger.error(
        "AudioManager",
        "Error playing electronic beep sound",
        error
      );
    }
  };

  /**
   * Enable or disable sound playback
   * @param {boolean} enabled - True to enable sounds, false to disable
   * @public
   */
  const setEnabled = (enabled) => {
    Logger.debug(
      "AudioManager",
      `setEnabled called with: ${enabled} (type: ${typeof enabled})`
    );
    Logger.debug("AudioManager", `soundEnabled BEFORE: ${soundEnabled}`);
    soundEnabled = enabled;
    Logger.debug("AudioManager", `soundEnabled AFTER: ${soundEnabled}`);
    Logger.info("AudioManager", `Sound ${enabled ? "ENABLED" : "DISABLED"}`);
  };

  /**
   * Check if sounds are enabled
   * @returns {boolean} True if sounds are enabled
   * @public
   */
  const isEnabled = () => {
    Logger.debug(
      "AudioManager",
      `isEnabled() called - returning: ${soundEnabled}`
    );
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
    playStartSound, // Master function - accepts soundId parameter
    playRefereeWhistle, // Individual sound functions (renamed from playWhistleSound)
    playBoxingBell,
    playAirHorn,
    playBeepSequence,
    playCountdownVoice,
    playSiren,
    playChime,
    playBuzzer,
    playGong,
    playElectronicBeep,
    playEndSound,
    playCountdownBeep,
    setEnabled,
    isEnabled,
    getContextState,
  };
})();

// Make AudioManager available globally (if not using module system)
if (typeof window !== "undefined") {
  window.AudioManager = AudioManager;
}
