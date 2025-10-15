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
  let allWorkouts = []; // Store all workouts (original, unfiltered)
  let displayedWorkouts = []; // Store workouts to display (filtered or all)
  let searchTerm = ""; // Current search term
  let selectedMuscleGroup = ""; // Current muscle group filter

  /**
   * Initialize the History Controller module
   * @returns {boolean} Success status
   */
  const init = () => {
    try {
      Logger.debug("HistoryController", "Initialization attempt 1");

      if (isInitialized) {
        Logger.debug("HistoryController", "Already initialized");
        return true;
      }

      // Cache DOM elements
      if (!cacheElements()) {
        Logger.error("HistoryController", "Failed to cache DOM elements");
        return false;
      }

      // Setup event listeners
      setupEventListeners();

      isInitialized = true;
      Logger.info("HistoryController", "Module initialized successfully");
      return true;
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Initialization failed:",
        error.message
      );
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
        exportDataBtn: document.getElementById("exportDataBtn"),
        // Stats elements
        viewStatsBtn: document.getElementById("viewStatsBtn"),
        statsSection: document.getElementById("statsSection"),
        statsContent: document.getElementById("statsContent"),
        // Pagination elements
        historyPagination: document.getElementById("historyPagination"),
        paginationPrevBtn: document.getElementById("paginationPrevBtn"),
        paginationNextBtn: document.getElementById("paginationNextBtn"),
        currentPageDisplay: document.getElementById("currentPageDisplay"),
        totalPagesDisplay: document.getElementById("totalPagesDisplay"),
        // Search and Filter elements
        searchFilterSection: document.getElementById("historySearchFilter"),
        searchInput: document.getElementById("workoutSearchInput"),
        muscleGroupFilter: document.getElementById("muscleGroupFilter"),
        clearFiltersBtn: document.getElementById("clearFiltersBtn"),
        // Main sections to hide/show
        workoutControls: document.querySelector(".workout-controls"),
        workoutDisplay: document.querySelector(".workout-display"),
      };

      // Verify all required elements exist
      const missingElements = Object.entries(elements)
        .filter(([key, element]) => !element)
        .map(([key]) => key);

      if (missingElements.length > 0) {
        Logger.warn(
          "HistoryController",
          "Missing DOM elements:",
          missingElements
        );
        return false;
      }

      Logger.debug("HistoryController", "DOM elements cached successfully");
      return true;
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to cache elements:",
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

      // Export data button
      if (elements.exportDataBtn) {
        elements.exportDataBtn.addEventListener("click", handleExportData);
      }

      // View stats button
      if (elements.viewStatsBtn) {
        elements.viewStatsBtn.addEventListener("click", handleViewStats);
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

      // Search and Filter event listeners
      if (elements.searchInput) {
        elements.searchInput.addEventListener("input", handleSearch);
      }

      if (elements.muscleGroupFilter) {
        elements.muscleGroupFilter.addEventListener("change", handleFilter);
      }

      if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.addEventListener("click", handleClearFilters);
      }

      Logger.debug("HistoryController", "Event listeners setup successfully");
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to setup event listeners:",
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

        Logger.debug(
          "HistoryController",
          "History section hidden, main sections shown"
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

        Logger.debug(
          "HistoryController",
          "Main sections hidden, history section shown"
        );
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to toggle history:",
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
        displayedWorkouts = [...workouts]; // Initialize displayed workouts
        totalPages = workouts.length;

        // Update workout count
        updateWorkoutCount(workouts.length);

        if (workouts.length === 0) {
          showHistoryEmptyState();
          hidePagination();
          hideSearchFilter();
        } else {
          // Reset to first page
          currentPage = 0;
          displayCurrentPage();
          showSearchFilter();
        }

        Logger.debug("HistoryController", `Loaded ${workouts.length} workouts`);
      } else {
        Logger.warn("HistoryController", "WorkoutHistory module not available");
        showHistoryEmptyState();
        hidePagination();
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to load workout history:",
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

          Logger.info("HistoryController", "History cleared successfully");
        }
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to clear history:",
        error.message
      );
    }
  };

  /**
   * Handle export data button click
   * Exports workout history as JSON file (user-initiated download)
   * @private
   */
  const handleExportData = () => {
    try {
      if (typeof WorkoutHistory !== "undefined" && WorkoutHistory.isReady()) {
        // Get workouts to export (use filtered workouts if filters are active)
        const workoutsToExport =
          displayedWorkouts.length > 0 ? displayedWorkouts : allWorkouts;

        if (workoutsToExport.length === 0) {
          showFeedback("⚠️", "No workouts to export", "#f59e0b", "#d97706");
          return;
        }

        // Create export data object
        const exportData = {
          exportDate: new Date().toISOString(),
          exportTimestamp: Date.now(),
          appVersion: window.APP_VERSION || "1.0.0",
          totalWorkouts: workoutsToExport.length,
          workouts: workoutsToExport,
        };

        // Convert to JSON string with pretty formatting
        const jsonString = JSON.stringify(exportData, null, 2);

        // Create blob and download link
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);

        // Create temporary download link
        const downloadLink = document.createElement("a");
        downloadLink.href = url;

        // Generate filename with current date
        const dateStr = new Date()
          .toISOString()
          .split("T")[0]
          .replace(/-/g, "-");
        downloadLink.download = `workout-history-${dateStr}.json`;

        // Trigger download
        document.body.appendChild(downloadLink);
        downloadLink.click();

        // Cleanup
        document.body.removeChild(downloadLink);
        URL.revokeObjectURL(url);

        // Show success feedback
        showExportDataFeedback(workoutsToExport.length);

        Logger.info(
          "HistoryController",
          `Exported ${workoutsToExport.length} workouts`
        );
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to export data:",
        error.message
      );
      showFeedback("❌", "Export failed", "#ef4444", "#dc2626");
    }
  };

  /**
   * Handle view stats button click
   * Toggles between history view and stats view
   * @private
   */
  const handleViewStats = () => {
    try {
      const isStatsVisible = !elements.statsSection.hidden;

      if (isStatsVisible) {
        // Hide stats, show history
        elements.statsSection.hidden = true;
        elements.historyContent.hidden = false;
        elements.viewStatsBtn.classList.remove("active");
        Logger.debug("HistoryController", "Stats hidden, history shown");
      } else {
        // Show stats, hide history
        elements.historyContent.hidden = true;
        elements.statsSection.hidden = false;
        elements.viewStatsBtn.classList.add("active");

        // Render stats
        renderStats();
        Logger.debug("HistoryController", "Stats shown, history hidden");
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to toggle stats:",
        error.message
      );
    }
  };

  /**
   * Render workout statistics
   * @private
   */
  const renderStats = () => {
    try {
      if (typeof WorkoutHistory !== "undefined" && WorkoutHistory.isReady()) {
        const stats = WorkoutHistory.getHistoryStats();

        if (stats.totalWorkouts === 0) {
          // Show empty state
          elements.statsContent.innerHTML = `
            <div class="stats-empty">
              <div class="stats-empty-icon">📊</div>
              <h3 class="stats-empty-title">No Statistics Yet</h3>
              <p class="stats-empty-message">Generate some workouts to see your statistics!</p>
            </div>
          `;
          return;
        }

        // Get last workout info
        const lastWorkout = stats.newestWorkout;
        const lastWorkoutDate = lastWorkout
          ? new Date(lastWorkout.timestamp)
          : null;
        const lastWorkoutRelative = lastWorkout
          ? getRelativeTime(lastWorkoutDate)
          : "No workouts yet";

        // Build stats HTML with redesigned compact cards
        let html = `
          <!-- Workout Stats Grid -->
          <div class="workout-stats-grid">
            <!-- Workout Variety Score -->
            <div class="stat-card stat-card-variety">
              <div class="stat-card-icon">✨</div>
              <div class="stat-card-content">
                <div class="stat-card-value">${stats.uniqueExercises}</div>
                <div class="stat-card-title">Workout Variety</div>
                <div class="stat-card-label">Unique exercises</div>
              </div>
            </div>

            <!-- Average Exercises Per Workout -->
            <div class="stat-card stat-card-average">
              <div class="stat-card-icon">📊</div>
              <div class="stat-card-content">
                <div class="stat-card-value">${
                  stats.averageExercisesPerWorkout
                }</div>
                <div class="stat-card-title">Average Size</div>
                <div class="stat-card-label">Exercises per workout</div>
              </div>
            </div>

            <!-- Total Exercises -->
            <div class="stat-card stat-card-total">
              <div class="stat-card-icon">🏃</div>
              <div class="stat-card-content">
                <div class="stat-card-value">${stats.totalExercises}</div>
                <div class="stat-card-title">Total Exercises</div>
                <div class="stat-card-label">Across all workouts</div>
              </div>
            </div>

            <!-- Last Workout -->
            <div class="stat-card stat-card-recent">
              <div class="stat-card-icon">⏰</div>
              <div class="stat-card-content">
                <div class="stat-card-value stat-card-value-time">${lastWorkoutRelative}</div>
                <div class="stat-card-title">Last Workout</div>
                <div class="stat-card-label">${
                  lastWorkoutDate ? lastWorkoutDate.toLocaleDateString() : ""
                }</div>
              </div>
            </div>
          </div>
        `;

        // Add most trained muscle groups
        if (
          stats.mostUsedMuscleGroups &&
          stats.mostUsedMuscleGroups.length > 0
        ) {
          const topGroups = stats.mostUsedMuscleGroups.slice(0, 3);
          html += `
            <div class="stats-list-container">
              <h3>🎯 Most Trained Muscle Groups</h3>
              <ul class="stats-list">
          `;

          topGroups.forEach((item, index) => {
            html += `
              <li class="stats-list-item">
                <span class="stats-list-rank">#${index + 1}</span>
                <span class="stats-list-name">${item.group}</span>
                <span class="stats-list-count">${item.count} exercise${
              item.count !== 1 ? "s" : ""
            }</span>
              </li>
            `;
          });

          html += `
              </ul>
            </div>
          `;
        }

        elements.statsContent.innerHTML = html;
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to render stats:",
        error.message
      );
      elements.statsContent.innerHTML = `
        <div class="stats-empty">
          <div class="stats-empty-icon">⚠️</div>
          <h3 class="stats-empty-title">Error Loading Statistics</h3>
          <p class="stats-empty-message">Failed to load workout statistics. Please try again.</p>
        </div>
      `;
    }
  };

  /**
   * Get relative time display
   * @param {Date} date - Date to compare
   * @returns {string} Relative time string
   * @private
   */
  const getRelativeTime = (date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return "Just now";
    if (diffMins < 60)
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    if (diffDays < 30)
      return `${Math.floor(diffDays / 7)} week${
        Math.floor(diffDays / 7) !== 1 ? "s" : ""
      } ago`;
    return date.toLocaleDateString();
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
   * Show search and filter section
   * @private
   */
  const showSearchFilter = () => {
    if (elements.searchFilterSection) {
      elements.searchFilterSection.hidden = false;
    }
  };

  /**
   * Hide search and filter section
   * @private
   */
  const hideSearchFilter = () => {
    if (elements.searchFilterSection) {
      elements.searchFilterSection.hidden = true;
    }
  };

  /**
   * Display the current page of workouts (1 workout per page)
   * @private
   */
  const displayCurrentPage = () => {
    try {
      // Use displayedWorkouts if filters are active, otherwise use allWorkouts
      const workoutsToShow =
        displayedWorkouts.length > 0 ? displayedWorkouts : allWorkouts;

      if (workoutsToShow.length === 0) {
        showHistoryEmptyState();
        hidePagination();
        return;
      }

      // Get the workout for the current page
      const workout = workoutsToShow[currentPage];

      if (!workout) {
        Logger.error("HistoryController", "Invalid page index");
        return;
      }

      // Display single workout card
      displayWorkoutCards([workout]);

      // Update pagination controls
      updatePaginationControls();

      // Show pagination
      showPagination();
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to display current page:",
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
   * Handle search input
   * @private
   */
  const handleSearch = (event) => {
    searchTerm = event.target.value.toLowerCase().trim();
    applyFilters();
  };

  /**
   * Handle muscle group filter change
   * @private
   */
  const handleFilter = (event) => {
    selectedMuscleGroup = event.target.value.toLowerCase();
    applyFilters();
  };

  /**
   * Handle clear filters button click
   * @private
   */
  const handleClearFilters = () => {
    // Reset filter values
    searchTerm = "";
    selectedMuscleGroup = "";

    // Reset UI elements
    if (elements.searchInput) {
      elements.searchInput.value = "";
    }
    if (elements.muscleGroupFilter) {
      elements.muscleGroupFilter.value = "";
    }

    // Apply filters (will show all workouts)
    applyFilters();
  };

  /**
   * Apply search and filter to workouts
   * @private
   */
  const applyFilters = () => {
    try {
      // Start with all workouts
      let filtered = [...allWorkouts];

      // Apply search filter
      if (searchTerm) {
        filtered = filtered.filter((workout) => {
          return workout.exercises.some((exercise) =>
            exercise.name.toLowerCase().includes(searchTerm)
          );
        });
      }

      // Apply muscle group filter
      if (selectedMuscleGroup) {
        filtered = filtered.filter((workout) => {
          return workout.exercises.some(
            (exercise) =>
              exercise.muscleGroup.toLowerCase() === selectedMuscleGroup
          );
        });
      }

      // Update displayed workouts
      displayedWorkouts = filtered;
      currentPage = 0; // Reset to first page
      totalPages = Math.max(1, displayedWorkouts.length);

      // Show/hide clear filters button
      const hasActiveFilters = searchTerm || selectedMuscleGroup;
      if (elements.clearFiltersBtn) {
        elements.clearFiltersBtn.hidden = !hasActiveFilters;
      }

      // Display filtered results
      displayCurrentPage();

      Logger.debug(
        "HistoryController",
        `Filters applied - ${displayedWorkouts.length} workouts found`
      );
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to apply filters:",
        error.message
      );
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

      Logger.debug(
        "HistoryController",
        `Displayed ${workouts.length} workout cards`
      );
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to display workout cards:",
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

      <div class="workout-card-rating-notes">
        <div class="rating-section">
          <span class="rating-label">Rate this workout:</span>
          <div class="rating-stars" data-workout-id="${workout.id}">
            ${[1, 2, 3, 4, 5]
              .map(
                (star) =>
                  `<span class="star ${
                    (workout.metadata?.rating || 0) >= star ? "filled" : ""
                  }" data-rating="${star}">⭐</span>`
              )
              .join("")}
          </div>
        </div>
        <div class="notes-section">
          <label class="notes-label" for="notes-${workout.id}">Notes:</label>
          <textarea
            class="notes-input"
            id="notes-${workout.id}"
            data-workout-id="${workout.id}"
            placeholder="Add your notes about this workout..."
            rows="2"
          >${workout.metadata?.notes || ""}</textarea>
          <button class="btn-save-notes" data-workout-id="${workout.id}">
            <span class="btn-icon">💾</span>
            <span class="btn-text">Save Notes</span>
          </button>
        </div>
      </div>

      <div class="workout-card-actions">
        <button class="btn-repeat-workout" data-workout-id="${workout.id}">
          <span class="btn-icon">🔄</span>
          <span class="btn-text">Repeat Workout</span>
        </button>
        <button class="btn-generate-similar" data-workout-id="${workout.id}">
          <span class="btn-icon">✨</span>
          <span class="btn-text">Generate Similar</span>
        </button>
        <button class="btn-delete-workout" data-workout-id="${workout.id}">
          <span class="btn-icon">🗑️</span>
          <span class="btn-text">Delete</span>
        </button>
        <button class="btn-share-workout" data-workout-id="${workout.id}">
          <span class="btn-icon">📤</span>
          <span class="btn-text">Share</span>
        </button>
      </div>
    `;

    // Add event listeners to action buttons
    const repeatBtn = card.querySelector(".btn-repeat-workout");
    const generateSimilarBtn = card.querySelector(".btn-generate-similar");
    const shareBtn = card.querySelector(".btn-share-workout");
    const deleteBtn = card.querySelector(".btn-delete-workout");

    if (repeatBtn) {
      repeatBtn.addEventListener("click", () =>
        handleRepeatWorkout(workout.id)
      );
    }

    if (generateSimilarBtn) {
      generateSimilarBtn.addEventListener("click", () =>
        handleGenerateSimilar(workout.id)
      );
    }

    if (shareBtn) {
      shareBtn.addEventListener("click", () => handleShareWorkout(workout.id));
    }

    if (deleteBtn) {
      deleteBtn.addEventListener("click", () =>
        handleDeleteWorkout(workout.id)
      );
    }

    // Add event listeners for rating stars
    const ratingStars = card.querySelectorAll(".rating-stars .star");
    ratingStars.forEach((star) => {
      star.addEventListener("click", () => {
        const rating = parseInt(star.getAttribute("data-rating"));
        handleRatingChange(workout.id, rating);
      });
    });

    // Add event listener for save notes button
    const saveNotesBtn = card.querySelector(".btn-save-notes");
    if (saveNotesBtn) {
      saveNotesBtn.addEventListener("click", () => {
        const notesInput = card.querySelector(".notes-input");
        if (notesInput) {
          handleSaveNotes(workout.id, notesInput.value);
        }
      });
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

          Logger.debug("HistoryController", `Repeated workout ${workoutId}`);
          showRepeatWorkoutFeedback();
        } else {
          Logger.error("HistoryController", "Workout not found:", workoutId);
          showErrorFeedback("Workout not found");
        }
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to repeat workout:",
        error.message
      );
      showErrorFeedback("Failed to repeat workout");
    }
  };

  /**
   * Handle generate similar workout button click
   * Generates a new workout based on the settings of a previous workout
   * @param {string} workoutId - ID of workout to use as template
   * @private
   */
  const handleGenerateSimilar = (workoutId) => {
    try {
      if (typeof WorkoutHistory !== "undefined" && WorkoutHistory.isReady()) {
        const workout = WorkoutHistory.getWorkoutById(workoutId);

        if (workout && workout.settings) {
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

          // Extract settings from the previous workout
          const settings = {
            exerciseCount: workout.exercises?.length || 8,
            muscleGroups: workout.settings.muscleGroups || [],
          };

          // Dispatch custom event to UIController to generate similar workout
          const event = new CustomEvent("historyGenerateSimilar", {
            detail: { settings, workoutId },
          });
          document.dispatchEvent(event);

          Logger.debug(
            "HistoryController",
            `Generating similar workout based on ${workoutId}`
          );
          showGenerateSimilarFeedback();
        } else {
          Logger.error("HistoryController", "Workout not found:", workoutId);
          showErrorFeedback("Workout not found");
        }
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to generate similar workout:",
        error.message
      );
      showErrorFeedback("Failed to generate similar workout");
    }
  };

  /**
   * Handle share workout button click
   * @param {string} workoutId - ID of workout to share
   * @private
   */
  const handleShareWorkout = (workoutId) => {
    try {
      if (typeof WorkoutHistory !== "undefined" && WorkoutHistory.isReady()) {
        const workout = WorkoutHistory.getWorkoutById(workoutId);

        if (workout) {
          // Format workout as text
          const workoutText = formatWorkoutAsText(workout);

          // Copy to clipboard
          copyToClipboard(workoutText)
            .then(() => {
              showShareSuccessFeedback();
              Logger.debug("HistoryController", "Workout copied to clipboard");
            })
            .catch((error) => {
              Logger.error(
                "HistoryController",
                "Failed to copy to clipboard:",
                error.message
              );
              showErrorFeedback("Failed to copy to clipboard");
            });
        } else {
          Logger.error("HistoryController", "Workout not found:", workoutId);
          showErrorFeedback("Workout not found");
        }
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to share workout:",
        error.message
      );
      showErrorFeedback("Failed to share workout");
    }
  };

  /**
   * Handle rating change
   * @param {string} workoutId - ID of workout to rate
   * @param {number} rating - Rating value (1-5)
   * @private
   */
  const handleRatingChange = (workoutId, rating) => {
    try {
      if (typeof WorkoutHistory !== "undefined" && WorkoutHistory.isReady()) {
        const workout = WorkoutHistory.getWorkoutById(workoutId);

        if (workout) {
          // Update rating in metadata
          workout.metadata.rating = rating;

          // Save updated workout
          WorkoutHistory.updateWorkout(workoutId, workout);

          // Refresh the workout data in memory arrays
          refreshWorkoutInMemory(workoutId);

          // Update the UI to show the new rating
          updateRatingDisplay(workoutId, rating);

          // Show success feedback
          showFeedback("⭐", `Rated ${rating} stars!`, "#f59e0b", "#d97706");

          Logger.debug(
            "HistoryController",
            `Updated rating for workout ${workoutId} to ${rating}`
          );
        } else {
          Logger.error("HistoryController", "Workout not found:", workoutId);
          showErrorFeedback("Workout not found");
        }
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to update rating:",
        error.message
      );
      showErrorFeedback("Failed to update rating");
    }
  };

  /**
   * Handle save notes
   * @param {string} workoutId - ID of workout
   * @param {string} notes - Notes text
   * @private
   */
  const handleSaveNotes = (workoutId, notes) => {
    try {
      if (typeof WorkoutHistory !== "undefined" && WorkoutHistory.isReady()) {
        const workout = WorkoutHistory.getWorkoutById(workoutId);

        if (workout) {
          // Update notes in metadata
          workout.metadata.notes = notes.trim();

          // Save updated workout
          WorkoutHistory.updateWorkout(workoutId, workout);

          // Refresh the workout data in memory arrays
          refreshWorkoutInMemory(workoutId);

          // Show success feedback
          showFeedback("💾", "Notes saved!", "#10b981", "#059669");

          Logger.debug(
            "HistoryController",
            `Saved notes for workout ${workoutId}`
          );
        } else {
          Logger.error("HistoryController", "Workout not found:", workoutId);
          showErrorFeedback("Workout not found");
        }
      }
    } catch (error) {
      Logger.error("HistoryController", "Failed to save notes:", error.message);
      showErrorFeedback("Failed to save notes");
    }
  };

  /**
   * Update rating display in the UI
   * @param {string} workoutId - ID of workout
   * @param {number} rating - Rating value (1-5)
   * @private
   */
  const updateRatingDisplay = (workoutId, rating) => {
    try {
      const card = document.querySelector(
        `.workout-card[data-workout-id="${workoutId}"]`
      );
      if (card) {
        const stars = card.querySelectorAll(".rating-stars .star");
        stars.forEach((star, index) => {
          if (index < rating) {
            star.classList.add("filled");
          } else {
            star.classList.remove("filled");
          }
        });
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to update rating display:",
        error.message
      );
    }
  };

  /**
   * Refresh workout data in memory arrays after updates
   * This ensures pagination shows the latest data without reloading the entire history
   * @param {string} workoutId - ID of workout to refresh
   * @private
   */
  const refreshWorkoutInMemory = (workoutId) => {
    try {
      if (typeof WorkoutHistory !== "undefined" && WorkoutHistory.isReady()) {
        // Get the updated workout from storage
        const updatedWorkout = WorkoutHistory.getWorkoutById(workoutId);

        if (updatedWorkout) {
          // Update in allWorkouts array
          const allIndex = allWorkouts.findIndex((w) => w.id === workoutId);
          if (allIndex !== -1) {
            allWorkouts[allIndex] = updatedWorkout;
          }

          // Update in displayedWorkouts array
          const displayedIndex = displayedWorkouts.findIndex(
            (w) => w.id === workoutId
          );
          if (displayedIndex !== -1) {
            displayedWorkouts[displayedIndex] = updatedWorkout;
          }

          Logger.debug(
            "HistoryController",
            `Refreshed workout ${workoutId} in memory`
          );
        }
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to refresh workout in memory:",
        error.message
      );
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

          Logger.info("HistoryController", `Deleted workout ${workoutId}`);
          showDeleteWorkoutFeedback();
        }
      }
    } catch (error) {
      Logger.error(
        "HistoryController",
        "Failed to delete workout:",
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
   * Show feedback when data is exported
   * @param {number} count - Number of workouts exported
   * @private
   */
  const showExportDataFeedback = (count) => {
    const message = `${count} workout${count !== 1 ? "s" : ""} exported!`;
    showFeedback("📥", message, "#10b981", "#059669");
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
   * Show feedback when generating similar workout
   * @private
   */
  const showGenerateSimilarFeedback = () => {
    showFeedback("✨", "Generating similar workout", "#8b5cf6", "#7c3aed");
  };

  /**
   * Show feedback when workout is shared
   * @private
   */
  const showShareSuccessFeedback = () => {
    showFeedback("📤", "Copied to clipboard!", "#10b981", "#059669");
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
   * Format workout as text for sharing
   * @param {Object} workout - Workout object
   * @returns {string} Formatted workout text
   * @private
   */
  const formatWorkoutAsText = (workout) => {
    const title = workout.summary?.title || "Workout";
    const date = workout.metadata?.displayDate || "Unknown date";
    const time = workout.metadata?.displayTime || "";
    const duration = workout.metadata?.estimatedDuration || 30;
    const exercises = workout.exercises || [];

    let text = `💪 ${title}\n`;
    text += `📅 ${date} ${time}\n`;
    text += `⏱️ Duration: ${duration} minutes\n`;
    text += `🏃 Exercises: ${exercises.length}\n\n`;

    exercises.forEach((exercise, index) => {
      text += `${index + 1}. ${exercise.name}`;
      if (exercise.sets && exercise.reps) {
        text += ` - ${exercise.sets} sets × ${exercise.reps} reps`;
      }
      text += ` (${exercise.muscleGroup})\n`;
    });

    text += `\n🏋️ Generated by Workout Generator`;

    return text;
  };

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @returns {Promise} Promise that resolves when text is copied
   * @private
   */
  const copyToClipboard = async (text) => {
    // Try modern clipboard API first
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }

    // Fallback for older browsers
    return new Promise((resolve, reject) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.position = "fixed";
      textArea.style.left = "-999999px";
      textArea.style.top = "-999999px";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      try {
        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);
        if (successful) {
          resolve();
        } else {
          reject(new Error("Copy command failed"));
        }
      } catch (error) {
        document.body.removeChild(textArea);
        reject(error);
      }
    });
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
    handleGenerateSimilar,
    handleDeleteWorkout,
  };

  return publicAPI;
})();

// Make module available globally
if (typeof window !== "undefined") {
  window.HistoryController = HistoryController;
}
