/**
 * Spaced Repetition Scheduling Engine (SM-2 Inspired)
 *
 * This module is completely pure, deterministic, and free of browser/network/storage coupling.
 * It schedules reviews, manages states, and heals malformed or old state formats.
 *
 * All dates are returned as standard ISO 8601 strings (YYYY-MM-DDTHH:mm:ss.sssZ).
 */

export function createInitialState() {
  return {
    version: 1,
    state: "new",
    dueDate: null,
    interval: 0,
    repetitions: 0,
    lapses: 0,
    mastery: 2.5,
    lastReviewed: null
  };
}

export function validateAndMigrateState(state) {
  if (!state || typeof state !== "object") {
    return createInitialState();
  }

  const healed = {};

  // Version: always default to 1
  healed.version = typeof state.version === "number" ? state.version : 1;

  // State state machine check: 'new', 'learning', 'review', 'relearning'
  const VALID_STATES = ["new", "learning", "review", "relearning"];
  healed.state = VALID_STATES.includes(state.state) ? state.state : "new";

  // Due Date validation
  if (state.dueDate) {
    try {
      const d = new Date(state.dueDate);
      healed.dueDate = isNaN(d.getTime()) ? null : d.toISOString();
    } catch {
      healed.dueDate = null;
    }
  } else {
    healed.dueDate = null;
  }

  // Interval in minutes validation (must be non-negative integer)
  if (typeof state.interval === "number" && !isNaN(state.interval) && state.interval >= 0) {
    healed.interval = Math.round(state.interval);
  } else {
    healed.interval = 0;
  }

  // Repetitions validation
  if (typeof state.repetitions === "number" && !isNaN(state.repetitions) && state.repetitions >= 0) {
    healed.repetitions = Math.round(state.repetitions);
  } else {
    healed.repetitions = 0;
  }

  // Lapses validation
  if (typeof state.lapses === "number" && !isNaN(state.lapses) && state.lapses >= 0) {
    healed.lapses = Math.round(state.lapses);
  } else {
    healed.lapses = 0;
  }

  // Mastery factor (minimum 1.3 as per standard SM-2)
  if (typeof state.mastery === "number" && !isNaN(state.mastery)) {
    healed.mastery = Math.max(1.3, state.mastery);
  } else {
    healed.mastery = 2.5;
  }

  // Last Reviewed validation
  if (state.lastReviewed) {
    try {
      const d = new Date(state.lastReviewed);
      healed.lastReviewed = isNaN(d.getTime()) ? null : d.toISOString();
    } catch {
      healed.lastReviewed = null;
    }
  } else {
    healed.lastReviewed = null;
  }

  return healed;
}

export function schedule(state, rating, currentTimestamp) {
  const VALID_RATINGS = ["again", "hard", "good", "easy"];
  if (!VALID_RATINGS.includes(rating)) {
    throw new Error(`Invalid rating: "${rating}". Must be one of: again, hard, good, easy.`);
  }

  const current = new Date(currentTimestamp);
  if (isNaN(current.getTime())) {
    throw new Error(`Invalid currentTimestamp: "${currentTimestamp}". Must be a valid Date constructor parameter.`);
  }

  const cleanState = validateAndMigrateState(state);
  const currentISO = current.toISOString();

  // Create a deep copy to ensure no caller-owned mutations
  const result = {
    version: cleanState.version,
    state: cleanState.state,
    dueDate: cleanState.dueDate,
    interval: cleanState.interval,
    repetitions: cleanState.repetitions,
    lapses: cleanState.lapses,
    mastery: cleanState.mastery,
    lastReviewed: currentISO
  };

  // State transitions and scheduling logic
  if (cleanState.state === "new") {
    if (rating === "again") {
      result.state = "learning";
      result.interval = 1; // 1 minute
    } else if (rating === "hard") {
      result.state = "learning";
      result.interval = 5; // 5 minutes
    } else if (rating === "good") {
      result.state = "learning";
      result.interval = 10; // 10 minutes
    } else if (rating === "easy") {
      result.state = "review";
      result.interval = 5760; // 4 days (4 * 1440)
      result.repetitions = 1;
    }
  } else if (cleanState.state === "learning" || cleanState.state === "relearning") {
    if (rating === "again") {
      result.interval = 1;
      // stays in learning/relearning
    } else if (rating === "hard") {
      result.interval = 5;
      // stays in learning/relearning
    } else if (rating === "good") {
      if (cleanState.interval < 10) {
        result.interval = 10;
        // stays in learning/relearning
      } else {
        // graduate to review
        result.state = "review";
        result.interval = 1440; // 1 day
        result.repetitions = 1;
      }
    } else if (rating === "easy") {
      // graduate immediately
      result.state = "review";
      result.interval = 5760; // 4 days
      result.repetitions = 1;
    }
  } else if (cleanState.state === "review") {
    if (rating === "again") {
      result.state = "relearning";
      result.interval = 1;
      result.repetitions = 0;
      result.lapses = cleanState.lapses + 1;
      result.mastery = Math.max(1.3, cleanState.mastery - 0.2);
    } else {
      // For hard, good, easy ratings, calculate next review interval
      result.repetitions = cleanState.repetitions + 1;

      // Find actual elapsed minutes since the last review
      const lastReviewedTimestamp = cleanState.lastReviewed
        ? Date.parse(cleanState.lastReviewed)
        : (cleanState.dueDate ? Date.parse(cleanState.dueDate) - (cleanState.interval * 60 * 1000) : current.getTime());

      const elapsedMinutes = Math.max(0, (current.getTime() - lastReviewedTimestamp) / (60 * 1000));
      const isOverdue = current.getTime() > (cleanState.dueDate ? Date.parse(cleanState.dueDate) : 0);

      if (rating === "hard") {
        result.mastery = Math.max(1.3, cleanState.mastery - 0.15);
        // Hard is conservative: grow interval by 1.2x with no overdue bonus
        result.interval = Math.max(1440, Math.round(cleanState.interval * 1.2));
      } else if (rating === "good") {
        // If overdue, reward the user by adding half of the overdue delay to the scheduled interval
        const basisInterval = isOverdue
          ? Math.max(cleanState.interval, (cleanState.interval + elapsedMinutes) / 2)
          : cleanState.interval;
        result.interval = Math.max(1440, Math.round(basisInterval * cleanState.mastery));
        // Mastery is unchanged for "good"
      } else if (rating === "easy") {
        // If overdue, reward full elapsed time as basis
        const basisInterval = isOverdue
          ? Math.max(cleanState.interval, elapsedMinutes)
          : cleanState.interval;
        result.interval = Math.max(1440, Math.round(basisInterval * cleanState.mastery * 1.3));
        result.mastery = Math.min(5.0, cleanState.mastery + 0.15);
      }
    }
  }

  // Calculate next due date
  result.dueDate = new Date(current.getTime() + result.interval * 60 * 1000).toISOString();

  return result;
}

export default {
  createInitialState,
  validateAndMigrateState,
  schedule
};
