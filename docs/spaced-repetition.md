# Standalone Spaced Repetition Scheduling Engine

An elegant, deterministic, dependency-free spaced-repetition scheduling engine inspired by the SuperMemo SM-2 algorithm. This engine is built to run entirely in browser-compatible environments with zero framework or third-party package dependencies.

---

## 1. Algorithm Selection & State Machine

Our algorithm uses a state machine to transition flashcards through four distinct states based on the quality of active recall ratings:

### States
- **New (`new`):** The initial, untouched state of a card.
- **Learning (`learning`):** Active studying phase for new or missed cards before graduation.
- **Review (`review`):** Long-term retention phase where intervals grow exponentially based on mastery.
- **Relearning (`relearning`):** Remedial study phase triggered when a mastered card is forgotten.

### Ratings
Users rate their recall confidence after checking each card:
- **`again`**: Severe recall failure (forgotten).
- **`hard`**: Partial recall with high cognitive effort.
- **`good`**: Correct, prompt recall.
- **`easy`**: Complete mastery with zero hesitation.

---

## 2. State Transition Mechanics

### From `new` State:
- **`again`** &rarr; state: `learning`, interval: 1 minute
- **`hard`** &rarr; state: `learning`, interval: 5 minutes
- **`good`** &rarr; state: `learning`, interval: 10 minutes
- **`easy`** &rarr; state: `review` (graduated), interval: 4 days, repetitions: 1

### From `learning` & `relearning` States:
- **`again`** &rarr; interval: 1 minute (remains in state)
- **`hard`** &rarr; interval: 5 minutes (remains in state)
- **`good`**:
  - If previous interval is less than 10 mins &rarr; interval: 10 minutes
  - Else &rarr; state: `review` (graduated), interval: 1 day, repetitions: 1
- **`easy`** &rarr; state: `review` (graduated), interval: 4 days, repetitions: 1

### From `review` State:
- **`again`** &rarr; state: `relearning`, interval: 1 minute, repetitions: 0, lapses + 1, mastery decreased by `0.2` (clamped to a minimum of `1.3`)
- **`hard`** &rarr; remains in `review`, repetitions + 1, interval increases conservatively by `1.2x`, mastery decreased by `0.15`
- **`good`** &rarr; remains in `review`, repetitions + 1, interval increases by `mastery` factor, mastery unchanged
- **`easy`** &rarr; remains in `review`, repetitions + 1, interval increases by `mastery * 1.3`, mastery increased by `0.15` (clamped to a maximum of `5.0`)

---

## 3. Overdue Reviews & Date Boundaries

Our scheduler gracefully rewards users who review cards overdue:
- For a **`good`** rating: The interval calculation basis is calculated as `max(scheduled_interval, (scheduled_interval + elapsed_minutes) / 2)`. This rewards extra elapsed time safely.
- For an **`easy`** rating: The interval calculation basis uses the full elapsed time, `max(scheduled_interval, elapsed_minutes)`.
- For a **`hard`** rating: No overdue bonus is applied to maintain conservative growth and safety against overestimating long-term retention.

All intervals are converted to minutes, rounded to integers, and returned as future due dates represented in standard ISO 8601 strings (`YYYY-MM-DDTHH:mm:ss.sssZ`).

---

## 4. API Usage Examples

The exported public API does not mutate caller-owned state objects.

```javascript
import { createInitialState, schedule } from './src/spaced-repetition.js';

// 1. Create a default state
const initial = createInitialState();
/*
{
  version: 1,
  state: "new",
  dueDate: null,
  interval: 0,
  repetitions: 0,
  lapses: 0,
  mastery: 2.5,
  lastReviewed: null
}
*/

// 2. Schedule the first study action
const now = new Date().toISOString();
const nextState = schedule(initial, 'good', now);
/*
{
  version: 1,
  state: "learning",
  dueDate: "2026-07-31T12:10:00.000Z", // 10 minutes from now
  interval: 10,
  repetitions: 0,
  lapses: 0,
  mastery: 2.5,
  lastReviewed: "2026-07-31T12:00:00.000Z"
}
*/
```

---

## 5. Integration Follow-Up

To integrate this module later into the vocabulary glossary site (`index.html`), a lightweight adapter is needed to bind UI controls to state persistence.

### Persistence Schema for Cards
The application already has a mechanism for starring terms in localStorage. We can store card-specific scheduling states under a single object inside localStorage, keyed by term:

```json
{
  "vocab_sr_states": {
    "Try / Except": {
      "version": 1,
      "state": "review",
      "dueDate": "2026-08-04T12:00:00.000Z",
      "interval": 5760,
      "repetitions": 1,
      "lapses": 0,
      "mastery": 2.5,
      "lastReviewed": "2026-07-31T12:00:00.000Z"
    }
  }
}
```

### Minimal Persistence Adapter
```javascript
const STORAGE_KEY = "vocab_sr_states";

function getSRStates() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveSRState(term, state) {
  const allStates = getSRStates();
  allStates[term] = state;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(allStates));
}

function getCardState(term) {
  const allStates = getSRStates();
  const existing = allStates[term];
  // Import our module's validateAndMigrateState function to heal on-the-fly
  return validateAndMigrateState(existing);
}
```

### UI Integration Details for Study & Quiz Mode
1. **Study Mode / Flashcard Deck:**
   - Display four buttons when showing the card back: **Again (red)**, **Hard (orange)**, **Good (blue)**, and **Easy (green)**.
   - On clicking a button, call `schedule(getCardState(term), rating, new Date().toISOString())`, save the output using `saveSRState(term, nextState)`, and transition to the next card.
2. **Review Deck Queue:**
   - Modify the deck builder to filter cards by their due date:
     ```javascript
     function getDueCards(vocabData) {
       const now = new Date();
       return vocabData.filter(d => {
         const state = getCardState(d.term);
         // If a card is brand new (dueDate === null) or overdue (dueDate <= now)
         return state.dueDate === null || new Date(state.dueDate) <= now;
       });
     }
     ```
