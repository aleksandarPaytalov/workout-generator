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
    const setInfo = document.createElement("div");
    setInfo.className = "timer-set-info";
    setInfo.innerHTML = "<strong>Set:</strong> <span>1 of 3</span>";
    elements.setInfo = setInfo;

    section.appendChild(setInfo);

    console.log("TimerUI: Set progress display added (Set X of Y)");

    // Cycle progress display (Cycle X of Y)
    const cycleInfo = document.createElement("div");
    cycleInfo.className = "timer-cycle-info";
    cycleInfo.innerHTML = "<strong>Cycle:</strong> <span>1 of 3</span>";
    elements.cycleInfo = cycleInfo;

    section.appendChild(cycleInfo);

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
    // Circumference = 2 * PI * radius = 2 * 3.14159 * 120 = 754
    progressCircle.setAttribute("stroke-dasharray", "754");
    progressCircle.setAttribute("stroke-dashoffset", "0");
    progressCircle.setAttribute("transform", "rotate(-90 140 140)");
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
    console.log("TimerUI: Creating main timer display");

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

    console.log("TimerUI: Large timer display added in center (MM:SS format)");

    // Current set/cycle info display
    const setInfo = document.createElement("div");
    setInfo.className = "timer-set-cycle-info";
    setInfo.innerHTML = "<span>Set 1 of 3</span> • <span>Cycle 1 of 3</span>";
    elements.setInfo = setInfo;

    display.appendChild(setInfo);

    console.log("TimerUI: Current set/cycle info display added");
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
    const display = createTimerDisplay();
    const phaseIndicator = createPhaseIndicator();
    const progressRing = createProgressRing();
    const progressSection = createProgressSection();
    const controls = createControlButtons();

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(phaseIndicator);
    modal.appendChild(display);
    modal.appendChild(progressRing);
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

  // Public API
  return {
    init,
    isReady,
    showTimer,
    hideTimer,
    getElements: () => elements,
  };
})();
