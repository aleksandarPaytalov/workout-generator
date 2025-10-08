/**
 * History Controller Module
 * Manages workout history display, interactions, and UI state
 * Separated from uiController for better maintainability
 */

const HistoryController = (() => {
  "use strict";

  // Module state
  let isInitialized = false;
  let elements = {};
  let currentPage = 0; // Current page index (0-based)
  let totalPages = 0; // Total number of pages
  let allWorkouts = []; // Store all workouts for pagination

  /**
   * Initialize the History Controller module
   * @returns {boolean} Success status
   */
  const init = () => {
    try {
      console.log("HistoryController: Initialization attempt 1");

      if (isInitialized) {
        console.log("HistoryController: Already initialized");
        return true;
      }

      // Cache DOM elements
      if (!cacheElements()) {
        console.error("HistoryController: Failed to cache DOM elements");
        return false;
      }

      // Setup event listeners
      setupEventListeners();

      isInitialized = true;
      console.log("HistoryController: Module initialized successfully");
      return true;
    } catch (error) {
      console.error("HistoryController: Initialization failed:", error.message);
      return false;
    }
  };

  /**
   * Check if module is ready
   * @returns {boolean} Ready status
   */
  const isReady = () => {
    return isInitialized && Object.keys(elements).length > 0;
  };

  /**
   * Cache DOM elements for history functionality
   * @returns {boolean} Success status
   * @private
   */
  const cacheElements = () => {
    try {
      elements = {
        historyToggleBtn: document.getElementById("historyToggleBtn"),
        historySection: document.getElementById("workoutHistorySection"),
        historyContent: document.getElementById("historyContent"),
        historyEmptyState: document.getElementById("historyEmptyState"),
        historyLoadingState: document.getElementById("historyLoadingState"),
        workoutCardsContainer: document.getElementById("workoutCardsContainer"),
        workoutCount: document.getElementById("workoutCount"),
        clearHistoryBtn: document.getElementById("clearHistoryBtn"),
        // Pagination elements
        historyPagination: document.getElementById("historyPagination"),
        paginationPrevBtn: document.getElementById("paginationPrevBtn"),
        paginationNextBtn: document.getElementById("paginationNextBtn"),
        currentPageDisplay: document.getElementById("currentPageDisplay"),
        totalPagesDisplay: document.getElementById("totalPagesDisplay"),
        // Main sections to hide/show
        workoutControls: document.querySelector(".workout-controls"),
        workoutDisplay: document.querySelector(".workout-display"),
      };

      // Verify all required elements exist
      const missingElements = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

      if (missingElements.length > 0) {
        console.warn(
          "HistoryController: Missing DOM elements:",
          missingElements
        );
        return false;
      }

      console.log("HistoryController: DOM elements cached successfully");
      return true;
    } catch (error) {
      console.error(
        "HistoryController: Failed to cache elements:",
        error.message
      );
      return false;
    }
  };

  /**
   * Setup event listeners for history functionality
   * @private
   */
  const setupEventListeners = () => {
    try {
      // History toggle button
      if (elements.historyToggleBtn) {
        elements.historyToggleBtn.addEventListener(
          "click",
          handleHistoryToggle
        );
      }

      // Clear history button
      if (elements.clearHistoryBtn) {
        elements.clearHistoryBtn.addEventListener("click", handleClearHistory);
      }

      // Pagination buttons
      if (elements.paginationPrevBtn) {
        elements.paginationPrevBtn.addEventListener(
          "click",
          handlePreviousPage
        );
      }

      if (elements.paginationNextBtn) {
        elements.paginationNextBtn.addEventListener("click", handleNextPage);
      }

      console.log("HistoryController: Event listeners setup successfully");
    } catch (error) {
      console.error(
        "HistoryController: Failed to setup event listeners:",
        error.message
      );
    }
  };

  /**
   * Handle history toggle button click
   * @private
   */
  const handleHistoryToggle = () => {
    try {
      const isVisible = !elements.historySection.hidden;

      if (isVisible) {
        // Hide history section and show main sections
        elements.historySection.hidden = true;
        elements.historyToggleBtn.classList.remove("active");

        // Show main workout sections
        if (elements.workoutControls) {
          elements.workoutControls.hidden = false;
        }
        if (elements.workoutDisplay) {
          elements.workoutDisplay.hidden = false;
        }

        console.log(
          "HistoryController: History section hidden, main sections shown"
        );
      } else {
        // Hide main sections and show history section
        if (elements.workoutControls) {
          elements.workoutControls.hidden = true;
        }
        if (elements.workoutDisplay) {
          elements.workoutDisplay.hidden = true;
        }

        // Show history section and load workouts
        elements.historySection.hidden = false;
        elements.historyToggleBtn.classList.add("active");
        loadWorkoutHistory();

        console.log(
          "HistoryController: Main sections hidden, history section shown"
        );
      }
    } catch (error) {
      console.error(
        "HistoryController: Failed to toggle history:",
        error.message
      );
    }
  };

  /**
   * Load and display workout history with pagination
   * @private
   */
  const loadWorkoutHistory = () => {
    try {
      // Show loading state
      showHistoryLoadingState();

      // Get workouts from WorkoutHistory module
      if (typeof WorkoutHistory !== "undefined" && WorkoutHistory.isReady()) {
        const workouts = WorkoutHistory.getHistory();

        // Store all workouts for pagination
        allWorkouts = workouts;
        totalPages = workouts.length;

        // Update workout count
        updateWorkoutCount(workouts.length);

        if (workouts.length === 0) {
          showHistoryEmptyState();
          hidePagination();
        } else {
          // Reset to first page
          currentPage = 0;
          displayCurrentPage();
        }

        console.log(`HistoryController: Loaded ${workouts.length} workouts`);
      } else {
        console.warn("HistoryController: WorkoutHistory module not available");
        showHistoryEmptyState();
        hidePagination();
      }
    } catch (error) {
      console.error(
        "HistoryController: Failed to load workout history:",
        error.message
      );
      showHistoryEmptyState();
      hidePagination();
    }
  };

  /**
   * Handle clear history button click
   * @private
   */
  const handleClearHistory = () => {
    try {
      if (typeof WorkoutHistory !== "undefined" && WorkoutHistory.isReady()) {
        // Confirm with user
        if (
          confirm(
            "Are you sure you want to clear all workout history? This action cannot be undone."
          )
        ) {
          WorkoutHistory.clearHistory();

          // Reset pagination state
          allWorkouts = [];
          currentPage = 0;
          totalPages = 0;

          // Update display
          updateWorkoutCount(0);
          showHistoryEmptyState();
          hidePagination();
          showClearHistoryFeedback();

          console.log("HistoryController: History cleared successfully");
        }
      }
    } catch (error) {
      console.error(
        "HistoryController: Failed to clear history:",
        error.message
      );
    }
  };

  /**
   * Show loading state for history
   * @private
   */
  const showHistoryLoadingState = () => {
    elements.historyLoadingState.hidden = false;
    elements.historyEmptyState.hidden = true;
    elements.workoutCardsContainer.hidden = true;
    hidePagination();
  };

  /**
   * Show empty state for history
   * @private
   */
  const showHistoryEmptyState = () => {
    elements.historyLoadingState.hidden = true;
    elements.historyEmptyState.hidden = false;
    elements.workoutCardsContainer.hidden = true;
    hidePagination();
  };

  /**
   * Update workout count display
   * @param {number} count - Number of workouts
   * @private
   */
  const updateWorkoutCount = (count) => {
    if (elements.workoutCount) {
      const text = count === 1 ? "1 workout" : `${count} workouts`;
      elements.workoutCount.textContent = text;
    }
  };

  /**
   * Display the current page of workouts (1 workout per page)
   * @private
   */
  const displayCurrentPage = () => {
    try {
      if (allWorkouts.length === 0) {
        showHistoryEmptyState();
        hidePagination();
        return;
      }

      // Get the workout for the current page
      const workout = allWorkouts[currentPage];

      if (!workout) {
        console.error("HistoryController: Invalid page index");
        return;
      }

      // Display single workout card
      displayWorkoutCards([workout]);

      // Update pagination controls
      updatePaginationControls();

      // Show pagination
      showPagination();
    } catch (error) {
      console.error(
        "HistoryController: Failed to display current page:",
        error.message
      );
    }
  };

  /**
   * Handle previous page button click
   * @private
   */
  const handlePreviousPage = () => {
    if (currentPage > 0) {
      currentPage--;
      displayCurrentPage();
    }
  };

  /**
   * Handle next page button click
   * @private
   */
  const handleNextPage = () => {
    if (currentPage < totalPages - 1) {
      currentPage++;
      displayCurrentPage();
    }
  };

  /**
   * Update pagination controls (buttons and page display)
   * @private
   */
  const updatePaginationControls = () => {
    // Update page display
    if (elements.currentPageDisplay) {
      elements.currentPageDisplay.textContent = currentPage + 1;
    }
    if (elements.totalPagesDisplay) {
      elements.totalPagesDisplay.textContent = totalPages;
    }

    // Update button states
    if (elements.paginationPrevBtn) {
      elements.paginationPrevBtn.disabled = currentPage === 0;
    }
    if (elements.paginationNextBtn) {
      elements.paginationNextBtn.disabled = currentPage === totalPages - 1;
    }
  };

  /**
   * Show pagination controls
   * @private
   */
  const showPagination = () => {
    if (elements.historyPagination && totalPages > 1) {
      elements.historyPagination.hidden = false;
    }
  };

  /**
   * Hide pagination controls
   * @private
   */
  const hidePagination = () => {
    if (elements.historyPagination) {
      elements.historyPagination.hidden = true;
    }
  };

  /**
   * Display workout cards with modern, eye-catching design
   * @param {Array} workouts - Array of workout objects
   * @private
   */
  const displayWorkoutCards = (workouts) => {
    try {
      // Hide other states and show cards container
      elements.historyLoadingState.hidden = true;
      elements.historyEmptyState.hidden = true;
      elements.workoutCardsContainer.hidden = false;

      // Clear existing cards
      elements.workoutCardsContainer.innerHTML = "";

      // Create cards for each workout
      workouts.forEach((workout, index) => {
        const card = createWorkoutCard(workout, index);
        elements.workoutCardsContainer.appendChild(card);
      });

      console.log(
        `HistoryController: Displayed ${workouts.length} workout cards`
      );
    } catch (error) {
      console.error(
        "HistoryController: Failed to display workout cards:",
        error.message
      );
      showHistoryEmptyState();
    }
  };

  /**
   * Create a modern workout card element
   * @param {Object} workout - Workout object
   * @param {number} index - Card index
   * @returns {HTMLElement} Workout card element
   * @private
   */
  const createWorkoutCard = (workout, index) => {
    const card = document.createElement("div");
    card.className = "workout-card";
    card.setAttribute("data-workout-id", workout.id);

    // Create card content with modern styling
    card.innerHTML = `
      <div class="workout-card-header">
        <div class="workout-card-title">
          <span class="workout-icon">💪</span>
          <span class="workout-name">${
            workout.summary?.title || "Workout"
          }</span>
          <span class="workout-badge">#${index + 1}</span>
        </div>
        <div class="workout-card-date">
          <span class="date-text">${
            workout.metadata?.displayDate || "Unknown date"
          }</span>
          <span class="time-text">${workout.metadata?.displayTime || ""}</span>
        </div>
      </div>
      
      <div class="workout-card-stats">
        <div class="stat-item">
          <span class="stat-icon">🏃</span>
          <span class="stat-value">${workout.exercises?.length || 0}</span>
          <span class="stat-label">exercises</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⏱️</span>
          <span class="stat-value">${
            workout.metadata?.estimatedDuration || 30
          }</span>
          <span class="stat-label">min</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🎯</span>
          <span class="stat-value">${
            workout.settings?.muscleGroups?.length || 0
          }</span>
          <span class="stat-label">groups</span>
        </div>
      </div>
      
      <div class="workout-card-preview">
        <div class="muscle-groups">
          ${(workout.settings?.muscleGroups || [])
            .map((group) => `<span class="muscle-group-tag">${group}</span>`)
            .join("")}
        </div>
        <div class="exercise-list-full">
          ${(workout.exercises || [])
            .map(
              (exercise, idx) =>
                `<div class="exercise-item-full">
                  <span class="exercise-number">${idx + 1}</span>
                  <span class="exercise-name-full">${exercise.name}</span>
                  <span class="exercise-muscle-tag">${
                    exercise.muscleGroup || ""
                  }</span>
                </div>`
            )
            .join("")}
        </div>
      </div>
      
      <div class="workout-card-actions">
        <button class="btn-repeat-workout" data-workout-id="${workout.id}">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">Repeat Workout</span>
        </button>
        <button class="btn-delete-workout" data-workout-id="${workout.id}">
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">Delete</span>
        </button>
      </div>
    `;

    // Add event listeners to action buttons
    const repeatBtn = card.querySelector(".btn-repeat-workout");
    const deleteBtn = card.querySelector(".btn-delete-workout");

    if (repeatBtn) {
      repeatBtn.addEventListener("click", () =>
        handleRepeatWorkout(workout.id)
      );
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () =>
        handleDeleteWorkout(workout.id)
      );
    }

    return card;
  };

  /**
   * Handle repeat workout button click
   * @param {string} workoutId - ID of workout to repeat
   * @private
   */
  const handleRepeatWorkout = (workoutId) => {
    try {
      if (typeof WorkoutHistory !== "undefined" && WorkoutHistory.isReady()) {
        const workout = WorkoutHistory.getWorkoutById(workoutId);

        if (workout && workout.exercises) {
          // Hide history section and show main sections
          elements.historySection.hidden = true;
          elements.historyToggleBtn.classList.remove("active");

          // Show main workout sections
          if (elements.workoutControls) {
            elements.workoutControls.hidden = false;
          }
          if (elements.workoutDisplay) {
            elements.workoutDisplay.hidden = false;
          }

          // Convert workout exercises to the format expected by UIController
          const exercises = workout.exercises.map((exercise) => ({
            id: exercise.id,
            name: exercise.name,
            muscleGroup: exercise.muscleGroup,
            sets: exercise.sets,
            reps: exercise.reps,
            equipment: exercise.equipment,
          }));

          // Dispatch custom event to UIController to render the workout
          const event = new CustomEvent("historyWorkoutRepeat", {
            detail: { exercises, workoutId },
          });
          document.dispatchEvent(event);

          console.log(`HistoryController: Repeated workout ${workoutId}`);
          showRepeatWorkoutFeedback();
        } else {
          console.error("HistoryController: Workout not found:", workoutId);
          showErrorFeedback("Workout not found");
        }
      }
    } catch (error) {
      console.error(
        "HistoryController: Failed to repeat workout:",
        error.message
      );
      showErrorFeedback("Failed to repeat workout");
    }
  };

  /**
   * Handle delete workout button click
   * @param {string} workoutId - ID of workout to delete
   * @private
   */
  const handleDeleteWorkout = (workoutId) => {
    try {
      if (typeof WorkoutHistory !== "undefined" && WorkoutHistory.isReady()) {
        if (confirm("Are you sure you want to delete this workout?")) {
          WorkoutHistory.removeWorkout(workoutId);

          // Get updated workouts
          const workouts = WorkoutHistory.getHistory();

          // Update pagination state
          allWorkouts = workouts;
          totalPages = workouts.length;

          // Adjust current page if needed
          // If we deleted the last workout on the current page, go to previous page
          if (currentPage >= totalPages && totalPages > 0) {
            currentPage = totalPages - 1;
          }

          // Update workout count
          updateWorkoutCount(workouts.length);

          // Update display
          if (workouts.length === 0) {
            // No workouts left
            showHistoryEmptyState();
            hidePagination();
            currentPage = 0;
          } else {
            // Show the current page (or adjusted page)
            displayCurrentPage();
          }

          console.log(`HistoryController: Deleted workout ${workoutId}`);
          showDeleteWorkoutFeedback();
        }
      }
    } catch (error) {
      console.error(
        "HistoryController: Failed to delete workout:",
        error.message
      );
      showErrorFeedback("Failed to delete workout");
    }
  };

  /**
   * Show feedback when history is cleared
   * @private
   */
  const showClearHistoryFeedback = () => {
    showFeedback("🗑️", "History cleared", "#ef4444", "#dc2626");
  };

  /**
   * Show feedback when workout is repeated
   * @private
   */
  const showRepeatWorkoutFeedback = () => {
    showFeedback("🔄", "Workout repeated", "#3b82f6", "#2563eb");
  };

  /**
   * Show feedback when workout is deleted
   * @private
   */
  const showDeleteWorkoutFeedback = () => {
    showFeedback("🗑️", "Workout deleted", "#f59e0b", "#d97706");
  };

  /**
   * Show error feedback
   * @param {string} message - Error message
   * @private
   */
  const showErrorFeedback = (message) => {
    showFeedback("⚠️", message, "#ef4444", "#dc2626");
  };

  /**
   * Generic feedback display function
   * @param {string} icon - Feedback icon
   * @param {string} text - Feedback text
   * @param {string} color1 - Primary gradient color
   * @param {string} color2 - Secondary gradient color
   * @private
   */
  const showFeedback = (icon, text, color1, color2) => {
    // Create a unique ID for this feedback
    const feedbackId = `history-feedback-${Date.now()}`;
    let feedbackElement = document.getElementById(feedbackId);

    if (!feedbackElement) {
      feedbackElement = document.createElement("div");
      feedbackElement.id = feedbackId;
      feedbackElement.className = "history-feedback";
      feedbackElement.innerHTML = `
        <span class="feedback-icon">${icon}</span>
        <span class="feedback-text">${text}</span>
      `;

      // Add modern styling
      feedbackElement.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: linear-gradient(135deg, ${color1}, ${color2});
        color: white;
        padding: 12px 20px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(${hexToRgb(color1)}, 0.3);
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        font-size: 14px;
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease-in-out;
      `;

      document.body.appendChild(feedbackElement);
    }

    // Show the feedback with animation
    setTimeout(() => {
      feedbackElement.style.transform = "translateX(0)";
    }, 100);

    // Hide after 3 seconds
    setTimeout(() => {
      feedbackElement.style.transform = "translateX(100%)";

      // Remove from DOM after animation
      setTimeout(() => {
        if (feedbackElement.parentNode) {
          feedbackElement.parentNode.removeChild(feedbackElement);
        }
      }, 300);
    }, 3000);
  };

  /**
   * Convert hex color to RGB values
   * @param {string} hex - Hex color code
   * @returns {string} RGB values
   * @private
   */
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(
          result[3],
          16
        )}`
      : "0, 0, 0";
  };

  // Public API - expose these functions to other modules
  const publicAPI = {
    init,
    isReady,
    loadWorkoutHistory,
    handleHistoryToggle,
    handleRepeatWorkout,
    handleDeleteWorkout,
  };

  return publicAPI;
})();

// Make module available globally
if (typeof window !== "undefined") {
  window.HistoryController = HistoryController;
}
