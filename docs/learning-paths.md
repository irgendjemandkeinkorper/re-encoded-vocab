# Vocab Glossary - Learning Paths Curriculum Foundation

This document defines the product design, data schema, content model, and architectural roadmap for adding **Structured Learning Paths** to the Vocab Glossary application.

---

## 1. Objectives & Overview

To transition from passive search and retrieval to active, structured learning, the application supports curated educational paths. This foundation enables:
- **Curated Instruction**: Linear learning modules composed of incremental lessons.
- **Vocabulary Centricity**: Every lesson is mapped directly to actual terminology in the vocabulary glossary.
- **Progress Tracking & Checkpoints**: Each module includes formal or reflective checkpoints to lock in learning progress.
- **Lens-Neutrality**: The underlying curriculum data contains no perspective-specific content. The viewer's chosen lens (e.g., medical, sports, gaming) can be dynamically overlaid onto the term references by future rendering systems.

---

## 2. Content Schema & Validation

The curriculum data is governed by a strict JSON schema located at `schemas/learning-paths.schema.json`.

### Schema Validation & Commands
The JSON dataset can be validated locally using any Draft-07 compliant JSON schema validator. For example, using Node.js:
```bash
# Validate schemas and datasets
node -e "
const fs = require('fs');
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true });
const schema = JSON.parse(fs.readFileSync('schemas/learning-paths.schema.json', 'utf8'));
const data = JSON.parse(fs.readFileSync('data/learning-paths.json', 'utf8'));
const validate = ajv.compile(schema);
if (validate(data)) {
  console.log('Validation Succeeded: All learning paths conform perfectly to schema!');
} else {
  console.error('Validation Failed:', validate.errors);
  process.exit(1);
}
"
```

---

## 3. Core Architectural Rules

### A. Stable, URL-Safe IDs
- All identifiers (`id` at the path, module, lesson, and checkpoint levels) must be stable, lowercase, alphanumeric, and hyphenated (e.g., `python-fundamentals`, `variables-and-types`).
- They must remain unchanged when title displays are translated or edited.
- These IDs are used directly for deep linking, indexing state in `localStorage`, and progress analytics.

### B. Unambiguous Term References
Since terms do not have a separate database primary key, they are referenced via a composite key of `{ "term": "<exact term string>", "cat": "<category code>" }`.
- This guarantees flawless matching even when the same name exists across multiple domains (e.g., `Variable` under category `python` vs. `Variable ($)` under category `php`).

### C. Graceful Missing-Term Fallbacks
If a term reference is deleted from `index.html` or fails to resolve during rendering, the rendering engine must handle it gracefully:
1. **Fallback Rendering**: Render the text literal specified in the lesson's `"term"` property with a small warning badge indicating the definition is offline.
2. **Developer Warning**: Trigger a non-blocking `console.warn()` or report telemetry to highlight broken references.
3. **No Crash Guarantee**: Never crash the page, layout, or user study environment if a single entry is omitted or misspelled.

### D. Extensibility & Schema Resilience
The content model is designed to accept any number of new learning paths, modules, or lessons without requiring updates to the JSON Schema or database migrations. Developers or educators can compose new pathways by simply writing a compliant JSON fragment.

### E. Future Localization (L10n)
To support multiple languages without duplicating structure:
- Language keys can be added alongside structural components (e.g., `"title_es"`, `"description_es"`) or isolated into translation map layers keyed by the stable, URL-safe component IDs (e.g., `lessons["variables-and-types"].title = "Variables y Tipos de Datos"`).

---

## 4. Minimal Example Code Block

A complete mock definition illustrating a single-lesson module with a checkpoint:

```json
{
  "$schema": "../schemas/learning-paths.schema.json",
  "version": "1.0.0",
  "paths": [
    {
      "id": "quick-start-python",
      "title": "Quick Python Start",
      "description": "A rapid introduction to Python variables.",
      "estimatedEffort": "30 minutes",
      "outcome": "Ability to declare and read Python variables.",
      "prerequisites": ["None"],
      "modules": [
        {
          "id": "intro-module",
          "title": "Welcome to Python",
          "description": "Your very first steps with Python core concepts.",
          "estimatedEffort": "30 minutes",
          "lessons": [
            {
              "id": "declaring-variables",
              "title": "Declaring Variables",
              "description": "How to name and modify values in memory.",
              "terms": [
                { "term": "Variable", "cat": "python" }
              ]
            }
          ],
          "checkpoint": {
            "id": "chk-intro",
            "title": "First Step Checkpoint",
            "description": "A quick quiz on declarations.",
            "completionRequirements": {
              "type": "quiz",
              "description": "Pass the Python Core Quiz.",
              "minScore": 100
            }
          }
        }
      ],
      "finalCheckpoint": {
        "id": "final-quick",
        "title": "Course Complete",
        "description": "Confirm you understand basic variable initialization.",
        "completionRequirements": {
          "type": "self_assessment",
          "description": "Acknowledge that you have run variable assignments in your local console."
        }
      }
    }
  ]
}
```

---

## 5. Authoring Rules for Contributors

1. **Category Mapping**: Ensure that the `"cat"` code matches the vocabulary catalog perfectly. Common values: `"python"`, `"qa"`, `"philosophers"`, `"ancient"`, `"stoicism"`, `"logic_rhetoric"`, `"fallacies"`.
2. **Keep Out of UI**: Do not reference UI layout styles, button configurations, or CSS classes within descriptions. Keep text focused purely on learning.
3. **Avoid Gendered / Perspective Bias**: Keep descriptions simple, gender-neutral, and easily understandable.
4. **Deterministic Paths**: Always design modules so that lessons flow sequentially from basic primitives to complex arrangements.

---

## 6. Integration Roadmap (UI Wiring)

Future UI modifications can implement the structured curriculum by applying the following design:

```
                  ┌──────────────────────────────┐
                  │      data/learning-paths.json │
                  └──────────────┬───────────────┘
                                 │
                        (Load via fetch())
                                 │
                                 ▼
                  ┌──────────────────────────────┐
                  │    UI Path Selection Panel   │
                  └──────────────┬───────────────┘
                                 │
                    (User selects Python Path)
                                 │
                                 ▼
         ┌────────────────────────────────────────────────┐
         │              Module & Lesson List              │
         │  (Render linear steps & prerequisite flags)     │
         └───────────────────────┬────────────────────────┘
                                 │
                        (User opens Lesson)
                                 │
                                 ▼
         ┌────────────────────────────────────────────────┐
         │             Dynamic Term Resolver             │
         │                                                │
         │  For each { term, cat } in lesson:             │
         │    1. Lookup inside static global DATA array   │
         │    2. Retrieve definition & examples           │
         │    3. If resolved:                             │
         │         Overlay user's current selected lens  │
         │       Else:                                    │
         │         Gracefully display text with alert     │
         └───────────────────────┬────────────────────────┘
                                 │
                      (User studies flashcards)
                                 │
                                 ▼
         ┌────────────────────────────────────────────────┐
         │               Module Checkpoint                │
         │                                                │
         │  1. Check requirements (e.g. "quiz", score)   │
         │  2. If completed, save module ID to:           │
         │     localStorage.vocab_progress_paths          │
         │  3. Unlock next module sequentially            │
         └────────────────────────────────────────────────┘
```

### UI Loading & State Logic
- **Progress Storage**: State should be tracked using a simple JSON mapping in browser local storage, e.g., `vocab_learning_progress` of shape:
  ```json
  {
    "paths": {
      "python-fundamentals": {
        "completedModules": ["python-core-data"],
        "completedLessons": ["variables-and-types", "strings-and-booleans"],
        "completed": false
      }
    }
  }
  ```
- **Prerequisite Validation**: Before unlocking a module or path, the UI can evaluate whether the `completedModules` list includes the necessary prerequisites or simply perform sequential linear unlocks.
- **Reference Resolution**:
  ```javascript
  // Match dynamic data safely
  function resolveTermReference(ref) {
    const entry = DATA.find(item => item.term === ref.term && item.cat === ref.cat);
    if (!entry) {
      console.warn(`Term reference not found: ${ref.term} (${ref.cat})`);
      return {
        term: ref.term,
        cat: ref.cat,
        def: "[Definition temporarily offline]",
        analogy: "This reference is currently not available.",
        lenses: {}
      };
    }
    return entry;
  }
  ```
