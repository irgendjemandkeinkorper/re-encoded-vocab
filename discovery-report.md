# Discovery Spike: Re-Encoded Vocabulary Learning & Product Roadmap

This document presents an evidence-based product discovery spike and audit for **Re-Encoded Vocabulary**, evaluating end-to-end user experience, technical constraints, candidate opportunities, and our top 3 recommended implementation-ready proposals.

---

## 1. End-to-End Technical Audit & Constraints

### Experience & Navigation Flow Audit
The current application provides an impressive, highly optimized static experience, but relies heavily on localized global state variables (`studyMode`, `quizMode`, `codeLabMode`) to swap visible views.
1. **The Navigation Dilemma:** Switching to Study Mode, Quiz Mode, or Code Lab is achieved by hiding the control toolbar and grid (`.controls`, `#count`, `#grid`, `#empty`) and toggling classes (e.g., adding `.active` to `#studyWrap`, `#quizWrap`, or `#codeWrap`). This approach breaks browser history (the back button exits the page entirely), prevents deep-linking to terms, and isolates the application's states.
2. **"Cold-Start" Study Mode:** In `enterStudy()` (lines 1699-1711), the study deck is shuffled using `getFiltered()`. If a user toggles Study Mode while "Starred only" is active but has zero starred terms, `getFiltered().length` is `0`, and the deck falls back to shuffling the *entire* vocabulary dataset (`DATA`). This silent fallback can cause confusion and cognitive fatigue.
3. **High-Friction Quiz Entry:** To start Quiz Mode, users must input a name (`#quizNameInput`) which is validated and sanitized (lines 1935-1942, 2164-2174). If they submit an empty or invalid name, an `alert()` dialog interrupts them and blocks entrance. There is no option to "Play as Guest" or skip the leaderboard, driving away privacy-conscious users or those seeking quick active recall practice.
4. **State Volatility:** Closing or refreshing the browser tab completely wipes active quiz scores, multipliers, current streaks, and the active card position in Study Mode. Only starred terms and theme preferences persist in `localStorage`.

### Technical Constraints & Architectural Limits
* **Monolithic Structure:** All application code, stylesheets, and term content are packed into a single `index.html` file (~2,700 lines). Scaling the content to include hundreds of additional concepts across philosophy, science, or programming subjects will lead to file bloat, slow down First Contentful Paint (FCP), increase memory footprints on mobile, and trigger complex git merge conflicts for contributors.
* **Content Security Policy (CSP):** The application implements a highly restrictive CSP meta tag (lines 5-6). It permits script execution from `'self'`, `'unsafe-inline'`, and the Supabase CDN, and restricts connection origins. This prevents loading untrusted external scripts, but also means any external analytical tracking or asset hosting must adhere strictly to these defined boundaries.
* **Storage Budgets:** All client-side persistence is limited to `localStorage` (standard 5MB limit). While highly reliable, storing extremely large datasets or detailed user session analytics could theoretically approach this limit if unmanaged, though current structures (starred items as simple arrays of strings) are negligible (<5KB).
* **Graceful Degradation:** The database interaction (Supabase) is decoupled and degrades gracefully if offline. However, the site lacks a service worker or offline manifest, meaning it cannot be installed as a PWA or load without an initial active network connection.

---

## 2. Candidate Opportunities & Evaluation Matrix

Here are 8 candidate opportunities categorized by their primary focus. Each is evaluated on a scale of **1 (Low) to 5 (High)** across three dimensions:
* **Impact:** How much this improves learning retention, user experience, reach, or maintainability.
* **Effort:** The engineering complexity and volume of code changes required.
* **Uncertainty:** The risk of unexpected technical hurdles, design dead-ends, or architectural regressions.

### Group 1: Learning Value
#### 1. Leitner Spaced Repetition Study Engine (Confidence Ratings & Local Scheduling)
* **Description:** Add rating buttons ("Again", "Hard", "Good", "Easy") inside Study Mode. Implement a simplified Leitner 3-box system stored in `localStorage` to schedule cards dynamically.
* **A11y/Privacy/Offline:** Fully local, privacy-preserving, works offline. Requires minor keyboard mapping adjustments for rating.
* **Impact: 5/5** | **Effort: 3/5** | **Uncertainty: 2/5**

#### 2. Adaptive Local Quizzes with Performance Weights
* **Description:** Track user answer accuracy per term locally. Prioritize presenting terms with higher failure rates during Quiz sessions, making testing personalized and adaptive.
* **A11y/Privacy/Offline:** Completely offline and local; does not exfiltrate performance details.
* **Impact: 4/5** | **Effort: 3/5** | **Uncertainty: 3/5**

### Group 2: Usability
#### 3. Zero-Friction "Play as Guest" Quiz Entrance & Local Stats
* **Description:** Add a "Play as Guest (Local-Only)" button to the quiz name screen. Bypass database leaderboard submissions for guests, but record local high scores and stats in `localStorage`.
* **A11y/Privacy/Offline:** High privacy appeal. Bypasses internet requirement for quiz mode entirely.
* **Impact: 5/5** | **Effort: 1/5** | **Uncertainty: 1/5**

#### 4. Hash-Based Deep Routing & Shareable Links
* **Description:** Use URL hashes (e.g., `#term/Closure` or `#mode/study`) to drive navigation. This enables users to share specific terms/analogies directly, preserves browser back/forward buttons, and keeps routing fully client-side.
* **A11y/Privacy/Offline:** Low effort, zero external dependencies, improves user sharing capability.
* **Impact: 5/5** | **Effort: 2/5** | **Uncertainty: 1/5**

### Group 3: Content & Maintainability
#### 5. Decoupled JSON Content Loader
* **Description:** Move vocab data from monolithic inline `DATA` array in `index.html` into separate JSON files (e.g. `/data/coding.json`, `/data/philosophy.json`) and load them dynamically via `fetch`.
* **A11y/Privacy/Offline:** Reduces initial index.html footprint. Requires a robust caching story (PWA) to avoid breaking offline capability.
* **Impact: 4/5** | **Effort: 3/5** | **Uncertainty: 3/5**

#### 6. Code Lab Interactive Expansion (Custom Walkthrough Scribes)
* **Description:** Add an interactive sandbox inside Code Lab where users can write their own JavaScript code and have it "translated" into a selected analogy lens dynamically.
* **A11y/Privacy/Offline:** High educational value but technically challenging to write secure, client-side translation heuristics for arbitrary JS.
* **Impact: 3/5** | **Effort: 5/5** | **Uncertainty: 5/5**

### Group 4: Reach
#### 7. Installable PWA with Service Worker Offline Caching
* **Description:** Add a `manifest.json` and a simple Service Worker script to cache assets. Allows users to "install" the app on desktop/mobile and access the vocabulary offline.
* **A11y/Privacy/Offline:** Excellent offline capability. Zero-privacy risk.
* **Impact: 4/5** | **Effort: 2/5** | **Uncertainty: 2/5**

#### 8. Complete Semantic Accessibility (a11y) & Screen Reader Support
* **Description:** Audit and refactor the DOM markup to use semantic elements, appropriate `aria-live` announcements for card flips, keyboard navigation support (focus outlines, tab-index traps for active modals), and high-contrast styling checks.
* **A11y/Privacy/Offline:** Maximizes inclusion and accessibility.
* **Impact: 4/5** | **Effort: 2/5** | **Uncertainty: 1/5**

---

### Scoring Summary Table

| Candidate Opportunity | Group | Impact | Effort | Uncertainty | Net Score (Impact - Effort) | Priority |
| :--- | :--- | :---: | :---: | :---: | :---: | :---: |
| **#3: Play as Guest Mode** | Usability | 5 | 1 | 1 | **+4** | **P0 (Quick Win)** |
| **#4: Hash-Based Routing** | Usability | 5 | 2 | 1 | **+3** | **P1 (Core Infra)** |
| **#1: Leitner Spaced Repetition**| Learning | 5 | 3 | 2 | **+2** | **P1 (Core Engine)**|
| **#7: Installable PWA** | Reach | 4 | 2 | 2 | **+2** | P2 |
| **#8: Semantic a11y Audit** | Reach | 4 | 2 | 1 | **+2** | P2 |
| **#2: Adaptive Quizzes** | Learning | 4 | 3 | 3 | **+1** | P2 |
| **#5: Decoupled JSON Loader** | Content | 4 | 3 | 3 | **+1** | Architectural |
| **#6: Interactive Code Lab** | Content | 3 | 5 | 5 | **-2** | Speculative |

---

## 3. Top 3 Recommendations (Prioritized Roadmap)

Our top three recommendations focus on eliminating friction, introducing proven learning methodologies, and establishing clean navigation infrastructure.

### Recommendation 1: Zero-Friction "Play as Guest" Mode (P0 Quick Win)
* **Target User Problem:** Privacy-conscious users or busy learners get blocked by a mandatory username dialog when trying to access Quiz Mode. They do not want to register a name or submit data online simply to practice.
* **Proposed Outcome:** Users can bypass the database registration and play anonymously. Local historical stats and guest personal bests are tracked in `localStorage` to give local-only learners a sense of progression.
* **Smallest Testable Version (MVP):**
  Add a "Skip & Play as Guest" button to `#quizNameScreen` (adjacent to `#quizNameStart`). Clicking this bypasses the Supabase registration step and launches `startQuizSession()` directly, marking the session as local-only (`isGuest = true`).
* **Dependencies:** None.
* **Risks:** Bypassing Supabase may confuse users about why their high score does not appear on the main Leaderboard overlay. This can be mitigated with a clear "Local Stats" visual tag.
* **Success Signal:** Zero validation alerts triggered for users trying to start a quiz, and a measured reduction in drop-off rate on the name input screen (mocked or audited locally).
* **Explicit Non-Goals:** Syncing guest scores across devices; building custom multi-user offline profiles.

### Recommendation 2: Hash-Based Deep Routing & Navigation (P1 Infrastructure)
* **Target User Problem:** Users cannot bookmark a specific term, share a direct link to an analogy lens, or use their browser's "back" button to return to the glossary grid from Study, Quiz, or Code Lab.
* **Proposed Outcome:** A lightweight, client-side, hash-based routing engine that updates the URL hash on view shifts and parses hash parameters on page load, keeping the experience fluid and robust.
* **Smallest Testable Version (MVP):**
  Monitor `window.addEventListener('hashchange', router)` and implement routing paths like `#term/:termName`, `#mode/study`, `#mode/quiz`, and `#mode/codelab`. Setting a hash updates the DOM state automatically, and backing out of a mode updates the hash to `#` (glossary grid).
* **Dependencies:** None (fully native JS history/location APIs).
* **Risks:** Edge cases with card flipping or animations causing scroll jumps; resolving conflicts between active search filters and route matching.
* **Success Signal:** Users can copy their address bar URL while viewing "Try / Except" in sports lens and send it to another user, who opens it and is greeted with that specific term card open and centered.
* **Explicit Non-Goals:** Setting up server-side redirects; loading external scripts; using pushState history API which would require backend routing configuration.

### Recommendation 3: Leitner Spaced Repetition Study Engine (P1 Learning Value)
* **Target User Problem:** Passive card-flipping in Study Mode does not support active recall tracking. Users see all starred cards in equal frequency, regardless of whether they have mastered them or are struggling.
* **Proposed Outcome:** Users rate their recall confidence after flipping a card, and the system intelligently schedules the term's reappearance using a 3-box Leitner system stored in `localStorage`.
* **Smallest Testable Version (MVP):**
  When a card is flipped in Study Mode, render four rating buttons (`Again`, `Hard`, `Good`, `Easy`) at the bottom of `#studyBack`. Cards start in Box 1. An "Again/Hard" rating keeps/moves it to Box 1, "Good" moves it to Box 2, "Easy" moves it to Box 3. The study deck queues Box 1 items first, Box 2 next, and Box 3 least frequently.
* **Dependencies:** None (uses native `localStorage` to store the `{ term: String, box: Number, lastReviewed: Timestamp }` records).
* **Risks:** Bloating the card face visually; complicating the UI for users who prefer simple shuffling. This can be mitigated by making Spaced Repetition a toggleable "Study Strategy" (Leitner vs. Classic Shuffle).
* **Success Signal:** Positive engagement with confidence buttons, and an increase in study session completion rates due to higher perceived learning efficiency.
* **Explicit Non-Goals:** Full SuperMemo SM-2 algorithm implementation with exact sub-day interval timers; synchronization of spaced-repetition progress across multiple devices.

---

## 4. Sensible Sequencing & Dependencies

```
[Phase 1: Foundation]
  └── Recommendation 2: Hash-Based Deep Routing (Infra)
        ├── Solves the browser navigation issue.
        └── Lays the groundwork to deep-link straight into Study/Quiz modes.

[Phase 2: Friction Removal]
  └── Recommendation 1: "Play as Guest" Mode (Usability)
        ├── Allows immediate local access to active recall (Quiz).
        └── Establishes standard local storage schemas for user metrics.

[Phase 3: Deep Engagement]
  └── Recommendation 3: Spaced Repetition Engine (Learning Value)
        ├── Leverages local storage infrastructure.
        └── Transforms passive study into active Leitner scheduling.
```

---

## 5. Privacy, Accessibility, & Maintenance Considerations

* **Privacy by Design:** All metrics, spaced repetition scheduling intervals, and local quiz achievements reside strictly in `localStorage` and `sessionStorage`. No personally identifiable information (PII) or device identifiers are collected, transmitted, or stored on Supabase.
* **Accessibility Integrity:** Confidence rating buttons and routing states are designed to be fully focusable. When a route changes or a card is scheduled, programmatic focus is managed, and `aria-live` regions notify screen readers of card updates.
* **Zero Maintenance Overhead:** By keeping recommendations local and native, we preserve the zero-build, single-file deployment model. No Node modules, compiler configurations, or persistent database servers are added to the stack, keeping the codebase clean and agile.
