/**
 * History UI Components
 * Modern, eye-catching UI components for workout history display
 * All interactions are manual user-initiated only
 */

const HistoryUI = (() => {
  "use strict";

  // Module state
  let isInitialized = false;
  let historyContainer = null;
  let workoutHistory = null;

  // Constants for modern design
  const UI_CLASSES = {
    container: "history-container",
    header: "history-header",
    emptyState: "history-empty-state",
    workoutCard: "workout-card",
    workoutHeader: "workout-header",
    workoutDate: "workout-date",
    workoutType: "workout-type",
    workoutStats: "workout-stats",
    exerciseList: "exercise-list",
    exerciseItem: "exercise-item",
    actionButtons: "action-buttons",
    primaryBtn: "btn-primary",
    secondaryBtn: "btn-secondary",
    dangerBtn: "btn-danger",
    fadeIn: "fade-in",
    slideUp: "slide-up"
  };

  // Modern color scheme (avoiding basic blue)
  const WORKOUT_COLORS = {
    strength: "#8B5CF6", // Purple
    cardio: "#EF4444",   // Red
    flexibility: "#10B981", // Green
    mixed: "#F59E0B",    // Amber
    default: "#6366F1"   // Indigo
  };

  /**
   * Initialize the History UI module
   * @param {HTMLElement} container - Container element for history display
   * @param {Object} historyManager - WorkoutHistory instance
   * @public
   */
  const init = (container, historyManager) => {
    if (isInitialized) {
      console.warn("HistoryUI: Already initialized");
      return;
    }

    if (!container) {
      throw new Error("HistoryUI: Container element required");
    }

    if (!historyManager) {
      throw new Error("HistoryUI: WorkoutHistory manager required");
    }

    historyContainer = container;
    workoutHistory = historyManager;
    isInitialized = true;

    console.log("HistoryUI: Initialized with modern design");
  };

  /**
   * Create modern, eye-catching workout history display
   * @public
   */
  const renderHistory = () => {
    if (!isInitialized) {
      throw new Error("HistoryUI: Module not initialized");
    }

    try {
      const workouts = workoutHistory.getHistory();
      
      // Clear container
      historyContainer.innerHTML = "";
      
      // Create header
      const header = createHistoryHeader(workouts.length);
      historyContainer.appendChild(header);

      if (workouts.length === 0) {
        // Show modern empty state
        const emptyState = createEmptyState();
        historyContainer.appendChild(emptyState);
      } else {
        // Create workout cards with modern design
        const cardsContainer = document.createElement("div");
        cardsContainer.className = "workout-cards-container";
        
        workouts.forEach((workout, index) => {
          const card = createWorkoutCard(workout, index);
          cardsContainer.appendChild(card);
        });
        
        historyContainer.appendChild(cardsContainer);
      }

      // Add fade-in animation
      historyContainer.classList.add(UI_CLASSES.fadeIn);

    } catch (error) {
      console.error("HistoryUI: Failed to render history:", error.message);
      showErrorState(error.message);
    }
  };

  /**
   * Create modern history header with contemporary styling
   * @private
   */
  const createHistoryHeader = (workoutCount) => {
    const header = document.createElement("div");
    header.className = UI_CLASSES.header;
    
    header.innerHTML = `
      <h2 class="history-title">
        <span class="title-icon">📊</span>
        Workout History
        <span class="workout-count">${workoutCount}/5</span>
      </h2>
      <div class="header-actions">
        <button class="btn-clear-history ${UI_CLASSES.dangerBtn}" 
                onclick="HistoryUI.clearAllHistory()" 
                title="Clear all workout history">
          <span class="btn-icon">🗑️</span>
          Clear All
        </button>
      </div>
    `;
    
    return header;
  };

  /**
   * Create visually appealing empty state
   * @private
   */
  const createEmptyState = () => {
    const emptyState = document.createElement("div");
    emptyState.className = UI_CLASSES.emptyState;
    
    emptyState.innerHTML = `
      <div class="empty-icon">💪</div>
      <h3 class="empty-title">No Workout History Yet</h3>
      <p class="empty-description">
        Generate your first workout to start tracking your fitness journey!
      </p>
      <div class="empty-features">
        <div class="feature-item">
          <span class="feature-icon">📈</span>
          <span>Track Progress</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">🔄</span>
          <span>Repeat Workouts</span>
        </div>
        <div class="feature-item">
          <span class="feature-icon">📊</span>
          <span>Compare Sessions</span>
        </div>
      </div>
    `;
    
    return emptyState;
  };

  /**
   * Create modern workout card with eye-catching design
   * @private
   */
  const createWorkoutCard = (workout, index) => {
    const card = document.createElement("div");
    card.className = `${UI_CLASSES.workoutCard} ${UI_CLASSES.slideUp}`;
    card.style.animationDelay = `${index * 100}ms`;
    
    const workoutColor = WORKOUT_COLORS[workout.type] || WORKOUT_COLORS.default;
    const formattedDate = formatWorkoutDate(workout.timestamp);
    const relativeDate = getRelativeDate(workout.timestamp);
    
    card.innerHTML = `
      <div class="workout-header" style="border-left: 4px solid ${workoutColor}">
        <div class="workout-date-info">
          <div class="workout-date">${formattedDate}</div>
          <div class="workout-relative-date">${relativeDate}</div>
        </div>
        <div class="workout-type-badge" style="background-color: ${workoutColor}">
          ${workout.type.charAt(0).toUpperCase() + workout.type.slice(1)}
        </div>
      </div>
      
      <div class="workout-stats">
        <div class="stat-item">
          <span class="stat-icon">🏋️</span>
          <span class="stat-value">${workout.exercises.length}</span>
          <span class="stat-label">Exercises</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">⏱️</span>
          <span class="stat-value">${workout.duration || 'N/A'}</span>
          <span class="stat-label">Minutes</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">🎯</span>
          <span class="stat-value">${workout.difficulty || 'Mixed'}</span>
          <span class="stat-label">Level</span>
        </div>
      </div>
      
      <div class="exercise-preview">
        <h4 class="preview-title">Exercises:</h4>
        <div class="exercise-list">
          ${workout.exercises.slice(0, 3).map(exercise => `
            <div class="exercise-item">
              <span class="exercise-name">${exercise.name}</span>
              <span class="exercise-details">${formatExerciseDetails(exercise)}</span>
            </div>
          `).join('')}
          ${workout.exercises.length > 3 ? `
            <div class="exercise-item more-exercises">
              <span class="more-text">+${workout.exercises.length - 3} more exercises</span>
            </div>
          ` : ''}
        </div>
      </div>
      
      <div class="action-buttons">
        <button class="btn-repeat ${UI_CLASSES.primaryBtn}" 
                onclick="HistoryUI.repeatWorkout('${workout.id}')"
                title="Repeat this workout">
          <span class="btn-icon">🔄</span>
          Repeat
        </button>
        <button class="btn-view ${UI_CLASSES.secondaryBtn}" 
                onclick="HistoryUI.viewWorkoutDetails('${workout.id}')"
                title="View full workout details">
          <span class="btn-icon">👁️</span>
          View
        </button>
        <button class="btn-delete ${UI_CLASSES.dangerBtn}" 
                onclick="HistoryUI.deleteWorkout('${workout.id}')"
                title="Delete this workout">
          <span class="btn-icon">🗑️</span>
          Delete
        </button>
      </div>
    `;
    
    return card;
  };

  /**
   * Format workout date for display
   * @private
   */
  const formatWorkoutDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Get relative date (e.g., "2 days ago")
   * @private
   */
  const getRelativeDate = (timestamp) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks === 1) return "1 week ago";
    return `${diffInWeeks} weeks ago`;
  };

  /**
   * Format exercise details for display
   * @private
   */
  const formatExerciseDetails = (exercise) => {
    if (exercise.sets && exercise.reps) {
      return `${exercise.sets} × ${exercise.reps}`;
    }
    if (exercise.duration) {
      return `${exercise.duration} min`;
    }
    return "";
  };

  /**
   * Show error state with modern styling
   * @private
   */
  const showErrorState = (message) => {
    historyContainer.innerHTML = `
      <div class="error-state">
        <div class="error-icon">⚠️</div>
        <h3 class="error-title">Unable to Load History</h3>
        <p class="error-message">${message}</p>
        <button class="btn-retry ${UI_CLASSES.primaryBtn}" onclick="HistoryUI.renderHistory()">
          <span class="btn-icon">🔄</span>
          Try Again
        </button>
      </div>
    `;
  };

  // Public API for manual user actions
  return {
    init,
    renderHistory,
    
    // Manual user action handlers (to be implemented)
    repeatWorkout: (workoutId) => {
      console.log(`HistoryUI: User requested to repeat workout ${workoutId}`);
      // Implementation will be added in integration step
    },
    
    viewWorkoutDetails: (workoutId) => {
      console.log(`HistoryUI: User requested to view workout ${workoutId}`);
      // Implementation will be added in integration step
    },
    
    deleteWorkout: (workoutId) => {
      console.log(`HistoryUI: User requested to delete workout ${workoutId}`);
      // Implementation will be added in integration step
    },
    
    clearAllHistory: () => {
      console.log("HistoryUI: User requested to clear all history");
      // Implementation will be added in integration step
    }
  };
})();

// Make available globally
window.HistoryUI = HistoryUI;
