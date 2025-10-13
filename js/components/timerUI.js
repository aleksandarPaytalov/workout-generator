/**
 * Timer UI Components
 * Modern, eye-catching UI components for workout timer display
 * All interactions are manual user-initiated only
 */

const TimerUI = (() => {
  "use strict";

  // Module state
  let isInitialized = false;

  // DOM element references (will be populated when modal is created)
  const elements = {
    modal: null,
    overlay: null,
    header: null,
    exerciseName: null,
    exerciseNumber: null,
    closeBtn: null,
    phaseIndicator: null,
    timeDisplay: null,
    progressRing: null,
    progressCircle: null,
    setInfo: null,
    cycleInfo: null,
    progressBar: null,
    progressFill: null,
    startBtn: null,
    pauseBtn: null,
    skipBtn: null,
    resetBtn: null,
    prevBtn: null,
    nextBtn: null,
    settingsBtn: null,
  };

  /**
   * Initialize the Timer UI module
   * @public
   * @returns {boolean} True if initialization successful
   */
  const init = () => {
    if (isInitialized) {
      console.warn("TimerUI: Already initialized");
      return false;
    }

    try {
      createTimerModal();
      isInitialized = true;
      console.log("TimerUI: Initialized successfully");
      return true;
    } catch (error) {
      console.error("TimerUI: Initialization failed:", error);
      return false;
    }
  };

  /**
   * Check if module is ready
   * @public
   * @returns {boolean} True if module is initialized
   */
  const isReady = () => {
    return isInitialized;
  };

  /**
   * Show timer modal
   * @public
   */
  const showTimer = () => {
    if (!isInitialized) {
      console.error("TimerUI: Module not initialized");
      return;
    }

    elements.overlay.style.display = "flex";
    console.log("TimerUI: Timer modal shown");
  };

  /**
   * Hide timer modal
   * @public
   */
  const hideTimer = () => {
    if (!isInitialized) {
      console.error("TimerUI: Module not initialized");
      return;
    }

    elements.overlay.style.display = "none";
    console.log("TimerUI: Timer modal hidden");
  };

  /**
   * Create control buttons
   * @private
   * @returns {HTMLElement} Controls element
   */
  const createControlButtons = () => {
    console.log("TimerUI: Creating control buttons");

    const controls = document.createElement("div");
    controls.className = "timer-controls";

    // Start button (primary, large)
    const startBtn = document.createElement("button");
    startBtn.className = "timer-btn-primary";
    startBtn.textContent = "Start";
    startBtn.setAttribute("data-action", "start");
    elements.startBtn = startBtn;

    controls.appendChild(startBtn);

    console.log("TimerUI: Start button added (primary, large)");

    // Pause button (primary, large) - initially hidden
    const pauseBtn = document.createElement("button");
    pauseBtn.className = "timer-btn-primary";
    pauseBtn.textContent = "Pause";
    pauseBtn.setAttribute("data-action", "pause");
    pauseBtn.style.display = "none";
    elements.pauseBtn = pauseBtn;

    controls.appendChild(pauseBtn);

    console.log("TimerUI: Pause button added (primary, large)");

    // Skip button (secondary)
    const skipBtn = document.createElement("button");
    skipBtn.className = "timer-btn-skip";
    skipBtn.textContent = "Skip Phase";
    skipBtn.setAttribute("data-action", "skip");
    elements.skipBtn = skipBtn;

    controls.appendChild(skipBtn);

    console.log("TimerUI: Skip button added (secondary)");

    // Reset button (secondary)
    const resetBtn = document.createElement("button");
    resetBtn.className = "timer-btn-secondary";
    resetBtn.textContent = "Reset";
    resetBtn.setAttribute("data-action", "reset");
    elements.resetBtn = resetBtn;

    controls.appendChild(resetBtn);

    console.log("TimerUI: Reset button added (secondary)");

    // Previous Exercise button
    const prevBtn = document.createElement("button");
    prevBtn.className = "timer-btn-secondary";
    prevBtn.textContent = "← Previous";
    prevBtn.setAttribute("data-action", "previous");
    elements.prevBtn = prevBtn;

    controls.appendChild(prevBtn);

    console.log("TimerUI: Previous Exercise button added");

    // Next Exercise button
    const nextBtn = document.createElement("button");
    nextBtn.className = "timer-btn-secondary";
    nextBtn.textContent = "Next →";
    nextBtn.setAttribute("data-action", "next");
    elements.nextBtn = nextBtn;

    controls.appendChild(nextBtn);

    console.log("TimerUI: Next Exercise button added");

    // Settings button
    const settingsBtn = document.createElement("button");
    settingsBtn.className = "timer-btn-secondary";
    settingsBtn.textContent = "⚙️ Settings";
    settingsBtn.setAttribute("data-action", "settings");
    elements.settingsBtn = settingsBtn;

    controls.appendChild(settingsBtn);

    console.log("TimerUI: Settings button added");
    return controls;
  };

  /**
   * Create progress section (sets, cycles, progress bar)
   * @private
   * @returns {HTMLElement} Progress section element
   */
  const createProgressSection = () => {
    console.log("TimerUI: Creating progress section");

    const section = document.createElement("div");
    section.className = "timer-progress-section";

    // Set progress display (Set X of Y)
    const setInfoContainer = document.createElement("div");
    setInfoContainer.className = "timer-progress-set";

    const setLabel = document.createElement("strong");
    setLabel.textContent = "Set:";

    const setValueSpan = document.createElement("span");
    setValueSpan.className = "timer-set-value";
    setValueSpan.textContent = " 1 of 3";

    setInfoContainer.appendChild(setLabel);
    setInfoContainer.appendChild(setValueSpan);

    // Store reference to the value span for updates
    elements.setInfoProgress = setValueSpan;

    section.appendChild(setInfoContainer);

    console.log("TimerUI: Set progress display added (Set X of Y)");

    // Cycle progress display (Cycle X of Y)
    const cycleInfoContainer = document.createElement("div");
    cycleInfoContainer.className = "timer-progress-cycle";

    const cycleLabel = document.createElement("strong");
    cycleLabel.textContent = "Cycle:";

    const cycleValueSpan = document.createElement("span");
    cycleValueSpan.className = "timer-cycle-value";
    cycleValueSpan.textContent = " 1 of 3";

    cycleInfoContainer.appendChild(cycleLabel);
    cycleInfoContainer.appendChild(cycleValueSpan);

    // Store reference to the value span for updates
    elements.cycleInfoProgress = cycleValueSpan;

    section.appendChild(cycleInfoContainer);

    console.log("TimerUI: Cycle progress display added (Cycle X of Y)");

    // Overall progress bar
    const progressBar = document.createElement("div");
    progressBar.className = "timer-progress-bar";

    const progressFill = document.createElement("div");
    progressFill.className = "timer-progress-fill";
    progressFill.style.width = "0%";
    elements.progressFill = progressFill;

    progressBar.appendChild(progressFill);
    section.appendChild(progressBar);

    console.log("TimerUI: Overall progress bar added");
    return section;
  };

  /**
   * Create circular progress ring using SVG
   * @private
   * @returns {HTMLElement} Progress ring element
   */
  const createProgressRing = () => {
    console.log("TimerUI: Creating circular progress ring using SVG");

    const container = document.createElement("div");
    container.className = "timer-progress-ring";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "280");
    svg.setAttribute("height", "280");
    svg.setAttribute("viewBox", "0 0 280 280");

    // Background circle
    const bgCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    bgCircle.setAttribute("cx", "140");
    bgCircle.setAttribute("cy", "140");
    bgCircle.setAttribute("r", "120");
    bgCircle.setAttribute("fill", "none");
    bgCircle.setAttribute("stroke", "#e5e7eb");
    bgCircle.setAttribute("stroke-width", "12");

    // Progress circle - circular progress calculation
    const progressCircle = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "circle"
    );
    progressCircle.setAttribute("cx", "140");
    progressCircle.setAttribute("cy", "140");
    progressCircle.setAttribute("r", "120");
    progressCircle.setAttribute("fill", "none");
    progressCircle.setAttribute("stroke", "#3b82f6");
    progressCircle.setAttribute("stroke-width", "12");
    progressCircle.setAttribute("stroke-linecap", "round");
    // Circumference = 2 * PI * radius = 2 * 3.14159 * 120 ≈ 754
    const circumference = 2 * Math.PI * 120;
    progressCircle.setAttribute("stroke-dasharray", `${circumference}`);
    progressCircle.setAttribute("stroke-dashoffset", `${circumference}`); // Start at 0% (full offset)
    progressCircle.setAttribute("transform", "rotate(-90 140 140)"); // Start from top
    elements.progressCircle = progressCircle;

    svg.appendChild(bgCircle);
    svg.appendChild(progressCircle);
    container.appendChild(svg);

    elements.progressRing = container;

    console.log("TimerUI: Circular progress calculation implemented");
    return container;
  };

  /**
   * Create phase indicator component
   * @private
   * @returns {HTMLElement} Phase indicator element
   */
  const createPhaseIndicator = () => {
    console.log("TimerUI: Creating phase indicator component");

    const indicator = document.createElement("div");
    indicator.className = "timer-phase-indicator";
    indicator.textContent = "PREPARE";
    indicator.setAttribute("data-phase", "prepare");
    elements.phaseIndicator = indicator;

    console.log("TimerUI: Phase indicator created with PREPARE state");
    return indicator;
  };

  /**
   * Create main timer display
   * @private
   * @returns {HTMLElement} Timer display element
   */
  const createTimerDisplay = () => {
    console.log(
      "TimerUI: Creating main timer display with integrated progress ring"
    );

    const display = document.createElement("div");
    display.className = "timer-display";

    // Create progress ring
    const progressRing = createProgressRing();
    display.appendChild(progressRing);

    // Large timer display (MM:SS format) - positioned in center of ring
    const timeDisplay = document.createElement("div");
    timeDisplay.className = "timer-time-display";
    timeDisplay.textContent = "00:45";
    elements.timeDisplay = timeDisplay;

    display.appendChild(timeDisplay);

    console.log(
      "TimerUI: Timer display created with integrated progress ring (set/cycle info removed)"
    );
    return display;
  };

  /**
   * Create timer header component
   * @private
   * @returns {HTMLElement} Header element
   */
  const createTimerHeader = () => {
    console.log("TimerUI: Creating timer header component");

    const header = document.createElement("div");
    header.className = "timer-header";
    elements.header = header;

    // Exercise name display
    const exerciseName = document.createElement("h2");
    exerciseName.className = "timer-exercise-name";
    exerciseName.textContent = "Exercise Name";
    elements.exerciseName = exerciseName;

    header.appendChild(exerciseName);

    console.log("TimerUI: Exercise name display added");

    // Exercise number indicator (X of Y)
    const exerciseNumber = document.createElement("div");
    exerciseNumber.className = "timer-exercise-number";
    exerciseNumber.textContent = "Exercise 1 of 8";
    elements.exerciseNumber = exerciseNumber;

    header.appendChild(exerciseNumber);

    console.log("TimerUI: Exercise number indicator added");

    // Close button with icon
    const closeBtn = document.createElement("button");
    closeBtn.className = "timer-close-btn";
    closeBtn.innerHTML = "&times;";
    closeBtn.setAttribute("aria-label", "Close timer");
    closeBtn.addEventListener("click", hideTimer);
    elements.closeBtn = closeBtn;

    header.appendChild(closeBtn);

    console.log("TimerUI: Close button with icon added");
    return header;
  };

  /**
   * Create the main timer modal structure
   * @private
   */
  const createTimerModal = () => {
    console.log("TimerUI: Creating timer modal structure");

    // Create overlay with backdrop
    const overlay = document.createElement("div");
    overlay.className = "timer-overlay";
    overlay.style.display = "none";
    elements.overlay = overlay;

    console.log("TimerUI: Modal overlay created with backdrop");

    // Create modal container with modern styling
    const modal = document.createElement("div");
    modal.className = "timer-modal";
    elements.modal = modal;

    console.log("TimerUI: Modal container created with modern styling");

    // Build modal content
    const header = createTimerHeader();
    const display = createTimerDisplay(); // Now includes integrated progress ring
    const phaseIndicator = createPhaseIndicator();
    const progressSection = createProgressSection();
    const controls = createControlButtons();

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(phaseIndicator);
    modal.appendChild(display); // Display now contains the progress ring
    modal.appendChild(progressSection);
    modal.appendChild(controls);

    // Append modal to overlay
    overlay.appendChild(modal);

    // Append overlay to body
    document.body.appendChild(overlay);

    // Add close button functionality - click overlay to close
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) {
        hideTimer();
      }
    });

    console.log("TimerUI: Timer modal fully assembled and added to DOM");
  };

  /**
   * Create settings modal
   * @public
   * @returns {HTMLElement} Settings modal element
   */
  const createSettingsModal = () => {
    console.log("TimerUI: Creating settings modal");

    // Create modal overlay
    const overlay = document.createElement("div");
    overlay.className = "timer-settings-overlay";
    overlay.style.display = "none";

    // Create modal container
    const modal = document.createElement("div");
    modal.className = "timer-settings-modal";

    // Create modal header
    const header = document.createElement("div");
    header.className = "timer-settings-header";

    const title = document.createElement("h2");
    title.textContent = "Timer Settings";

    const closeBtn = document.createElement("button");
    closeBtn.className = "timer-settings-close";
    closeBtn.textContent = "×";
    closeBtn.setAttribute("aria-label", "Close settings");

    header.appendChild(title);
    header.appendChild(closeBtn);

    // Create modal body
    const body = document.createElement("div");
    body.className = "timer-settings-body";

    // Create form
    const form = document.createElement("form");
    form.className = "timer-settings-form";

    // Prepare time input
    const prepareGroup = createSettingInput(
      "prepare",
      "Prepare Time",
      "seconds",
      0,
      60,
      10
    );
    form.appendChild(prepareGroup);

    // Work time input
    const workGroup = createSettingInput(
      "work",
      "Work Time",
      "seconds",
      5,
      600,
      45
    );
    form.appendChild(workGroup);

    // Rest time input
    const restGroup = createSettingInput(
      "rest",
      "Rest Time",
      "seconds",
      0,
      300,
      15
    );
    form.appendChild(restGroup);

    // Cycles per set input
    const cyclesGroup = createSettingInput(
      "cyclesPerSet",
      "Cycles per Set",
      "cycles",
      1,
      20,
      3
    );
    form.appendChild(cyclesGroup);

    // Sets input
    const setsGroup = createSettingInput("sets", "Sets", "sets", 1, 20, 3);
    form.appendChild(setsGroup);

    // Rest between sets input
    const restBetweenSetsGroup = createSettingInput(
      "restBetweenSets",
      "Rest Between Sets",
      "seconds",
      0,
      600,
      60
    );
    form.appendChild(restBetweenSetsGroup);

    // Sound selector section
    const soundSection = document.createElement("div");
    soundSection.className = "timer-setting-group";

    const soundLabel = document.createElement("label");
    soundLabel.className = "timer-setting-label";
    soundLabel.textContent = "Start Sound";

    const soundDescription = document.createElement("p");
    soundDescription.className = "timer-setting-description";
    soundDescription.textContent =
      "Choose the sound that plays when each work phase starts";

    soundSection.appendChild(soundLabel);
    soundSection.appendChild(soundDescription);

    // Sound selector container
    const soundSelectorContainer = document.createElement("div");
    soundSelectorContainer.className = "sound-selector-container";

    // Dropdown select
    const soundSelect = document.createElement("select");
    soundSelect.id = "startSoundSelect";
    soundSelect.className = "timer-setting-select";

    // Populate dropdown with available sounds
    if (typeof TimerSettings !== "undefined" && TimerSettings.isReady()) {
      const availableSounds = TimerSettings.getAvailableStartSounds();
      availableSounds.forEach((sound) => {
        const option = document.createElement("option");
        option.value = sound.id;
        option.textContent = `${sound.name} - ${sound.description}`;
        soundSelect.appendChild(option);
      });
    } else {
      // Fallback if TimerSettings not available
      const defaultOption = document.createElement("option");
      defaultOption.value = "whistle";
      defaultOption.textContent = "Referee Whistle - Classic sports whistle";
      soundSelect.appendChild(defaultOption);
    }

    soundSelectorContainer.appendChild(soundSelect);

    // Preview button
    const previewBtn = document.createElement("button");
    previewBtn.type = "button";
    previewBtn.className = "btn-preview-sound";
    previewBtn.innerHTML = "🔊 Preview";
    previewBtn.title = "Preview selected sound";
    soundSelectorContainer.appendChild(previewBtn);

    soundSection.appendChild(soundSelectorContainer);
    form.appendChild(soundSection);

    // Sound enabled checkbox
    const soundGroup = createSettingCheckbox(
      "soundEnabled",
      "Enable Sound Notifications",
      true
    );
    form.appendChild(soundGroup);

    // Voice enabled checkbox
    const voiceGroup = createSettingCheckbox(
      "voiceEnabled",
      "Enable Voice Announcements",
      false
    );
    form.appendChild(voiceGroup);

    body.appendChild(form);

    // Create modal footer
    const footer = document.createElement("div");
    footer.className = "timer-settings-footer";

    const resetBtn = document.createElement("button");
    resetBtn.type = "button";
    resetBtn.className = "timer-settings-btn timer-settings-btn-secondary";
    resetBtn.textContent = "Reset to Defaults";

    const cancelBtn = document.createElement("button");
    cancelBtn.type = "button";
    cancelBtn.className = "timer-settings-btn timer-settings-btn-secondary";
    cancelBtn.textContent = "Cancel";

    const saveBtn = document.createElement("button");
    saveBtn.type = "button";
    saveBtn.className = "timer-settings-btn timer-settings-btn-primary";
    saveBtn.textContent = "Save Settings";

    footer.appendChild(resetBtn);
    footer.appendChild(cancelBtn);
    footer.appendChild(saveBtn);

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(body);
    modal.appendChild(footer);
    overlay.appendChild(modal);

    // Append to body
    document.body.appendChild(overlay);

    // Store references
    elements.settingsOverlay = overlay;
    elements.settingsModal = modal;
    elements.settingsCloseBtn = closeBtn;
    elements.settingsForm = form;
    elements.settingsResetBtn = resetBtn;
    elements.settingsCancelBtn = cancelBtn;
    elements.settingsSaveBtn = saveBtn;

    console.log("TimerUI: Settings modal created successfully");

    return overlay;
  };

  /**
   * Create setting input field
   * @private
   */
  const createSettingInput = (name, label, unit, min, max, defaultValue) => {
    const group = document.createElement("div");
    group.className = "timer-setting-group";

    const labelEl = document.createElement("label");
    labelEl.className = "timer-setting-label";
    labelEl.setAttribute("for", `timer-setting-${name}`);
    labelEl.textContent = label;

    const inputContainer = document.createElement("div");
    inputContainer.className = "timer-setting-input-container";

    const input = document.createElement("input");
    input.type = "number";
    input.id = `timer-setting-${name}`;
    input.name = name;
    input.className = "timer-setting-input";
    input.min = min;
    input.max = max;
    input.value = defaultValue;

    const unitLabel = document.createElement("span");
    unitLabel.className = "timer-setting-unit";
    unitLabel.textContent = unit;

    inputContainer.appendChild(input);
    inputContainer.appendChild(unitLabel);
    group.appendChild(labelEl);
    group.appendChild(inputContainer);

    return group;
  };

  /**
   * Create setting checkbox field
   * @private
   */
  const createSettingCheckbox = (name, label, defaultValue) => {
    const group = document.createElement("div");
    group.className = "timer-setting-group timer-setting-checkbox-group";

    const checkboxContainer = document.createElement("div");
    checkboxContainer.className = "timer-setting-checkbox-container";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.id = `timer-setting-${name}`;
    input.name = name;
    input.className = "timer-setting-checkbox";
    input.checked = defaultValue;

    const labelEl = document.createElement("label");
    labelEl.className = "timer-setting-checkbox-label";
    labelEl.setAttribute("for", `timer-setting-${name}`);
    labelEl.textContent = label;

    checkboxContainer.appendChild(input);
    checkboxContainer.appendChild(labelEl);
    group.appendChild(checkboxContainer);

    return group;
  };

  /**
   * Show settings modal
   * @public
   */
  const showSettingsModal = () => {
    if (!elements.settingsOverlay) {
      console.error("TimerUI: Settings modal not created");
      return;
    }

    elements.settingsOverlay.style.display = "flex";
    console.log("TimerUI: Settings modal shown");
  };

  /**
   * Hide settings modal
   * @public
   */
  const hideSettingsModal = () => {
    if (!elements.settingsOverlay) {
      console.error("TimerUI: Settings modal not created");
      return;
    }

    elements.settingsOverlay.style.display = "none";
    console.log("TimerUI: Settings modal hidden");
  };

  // Public API
  return {
    init,
    isReady,
    showTimer,
    hideTimer,
    getElements: () => elements,
    createSettingsModal,
    showSettingsModal,
    hideSettingsModal,
  };
})();
