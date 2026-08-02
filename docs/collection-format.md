# Re-Encoded Vocabulary Collection Format Specification (v1)

This document defines a safe, portable, and git-friendly JSON schema and API format for user-created vocabulary collections. This allows users to import, export, share, and remix vocabulary sets across different learning environments.

---

## 1. Overview & Philosophy

The Re-Encoded Vocabulary collection format is designed with four core tenets:
1. **Zero External Dependencies:** No compilation or heavy packages; fully runnable inside vanilla web browsers.
2. **Git-Friendliness:** Natural-order and alphabetically sorted serialization so that files have clean, stable diffs when tracked in Git.
3. **Defense-in-Depth Security:** Strict structural boundaries, size limits, and robust HTML entity escaping to neutralize cross-site scripting (XSS) vectors.
4. **Graceful Backward & Forward Compatibility:** Future-proof parsing that preserves unknown metadata/future properties while enforcing strict limits on known fields.

---

## 2. Technical Specifications & Safety Limits

To prevent Denial of Service (DoS), memory exhaustion, and database pollution, the parsing engine strictly enforces the following resource boundaries:

| Resource / Field | Absolute Maximum Limit | Validation Behavior |
| :--- | :--- | :--- |
| **Total JSON File Size** | 1,048,576 bytes (1MB) | Rejected immediately upon parsing |
| **Total Categories** | 100 array items | Validation failure |
| **Total Terms** | 1,000 array items | Validation failure |
| **Collection Title** | 100 characters | Validation failure |
| **Collection Description**| 500 characters | Validation failure |
| **Author Name** | 100 characters | Validation failure |
| **Created / Modified Time** | 50 characters (ISO-8601) | Validation failure |
| **License String** | 100 characters | Validation failure |
| **Category Key** | 40 characters (`^[a-z0-9_-]+$`) | Validation failure |
| **Category Label** | 100 characters | Validation failure |
| **Term ID** | 100 characters (`^[a-zA-Z0-9_.-]+$`) | Validation failure |
| **Term Name** | 100 characters | Validation failure |
| **Term Def / Analogy** | 1,000 characters | Validation failure |
| **Term Example Code** | 2,000 characters | Validation failure |
| **Lens Translation** | 1,000 characters per lens | Validation failure |

---

## 3. Envelope Structure & Fields

Every collection file is packaged in a self-describing JSON envelope with the following keys:

- **`version`** (String, required): The major version of the schema. Must be `1.0.0` (or `1.x.y` semver compatible).
- **`id`** (String, required): Alphanumeric identifier used for synchronization, storage keys, and update tracking.
- **`title`** (String, required): Short, human-readable title of the collection.
- **`description`** (String, optional): Detailed explanation of the scope/subject.
- **`author`** (String, optional): Username or identifier of the collection compiler.
- **`created`** (String, required): ISO-8601 UTC timestamp of creation.
- **`modified`** (String, required): ISO-8601 UTC timestamp of last modification.
- **`license`** (String, optional): Copyright or licensing model (e.g. `CC-BY-4.0`, `MIT`, `CC0-1.0`).
- **`provenance`** (Object, optional): Tracks origin of the content:
  - `sourceUrl` (String, max 200 chars): Direct link to the source repository or website.
  - `originalAuthor` (String, max 100 chars): Credit to original author if this is a remix.
- **`categories`** (Array, required): Definitions of subject subdivisions containing `key` and `label`.
- **`terms`** (Array, required): List of vocabulary objects. Each term requires `id`, `term`, `cat`, `def`, and `analogy`. Optional properties include `sub`, `ex`, and `lenses`.

---

## 4. Example Collection (Valid v1.0.0 Format)

Below is a complete, minimal example collection containing one category and two terms translated into standard and custom lenses:

```json
{
  "version": "1.0.0",
  "id": "js-basics",
  "title": "JavaScript Core Concepts",
  "description": "Fundamental execution models and APIs of JavaScript.",
  "author": "Alice Dev",
  "created": "2026-07-31T10:00:00Z",
  "modified": "2026-07-31T11:45:00Z",
  "license": "MIT",
  "provenance": {
    "sourceUrl": "https://github.com/alice/js-basics",
    "originalAuthor": "Alice Dev"
  },
  "categories": [
    {
      "key": "async",
      "label": "Asynchronous Operations"
    }
  ],
  "terms": [
    {
      "id": "promise",
      "term": "Promise",
      "cat": "async",
      "sub": "Control Flow",
      "def": "An object representing the eventual completion or failure of an asynchronous operation.",
      "analogy": "An order receipt at a busy diner — you do not have the food immediately, but the slip guarantees you will eventually get your plate or an explanation why it is missing.",
      "ex": "fetch('/data').then(res => res.json())",
      "lenses": {
        "sports": "A draft pick certificate — guarantees a player selection during the upcoming event, or a trade compensation if it falls through.",
        "cooking": "A table buzzer at a restaurant — vibrates when your meal is ready, or blinks red if the kitchen runs out of ingredients.",
        "gaming": "A pre-order receipt for a game — you do not have the game disc yet, but you have a voucher to redeem it immediately on release day."
      }
    }
  ]
}
```

---

## 5. Security & Privacy Expectations

### HTML Sanitization (Stored XSS Mitigation)
Any text imported from a user-created file must be treated as **untrusted data**.
- The format parser recursive normalizer applies HTML entity escaping to **all string values** (including unknown future fields).
- Any `<script>`, `<iframe>`, or HTML tags (e.g. `<b>`, `<img>` with `onerror` payloads) are safely translated into plaintext equivalents (e.g., `&lt;script&gt;`). This guarantees that even if a UI displays terms via `.innerHTML`, execution of foreign scripts is strictly blocked.

### Privacy Guidelines
- **Local Isolation:** Collections are meant to be imported and processed client-side in volatile memory or local sandbox partitions.
- **No Automatic Telemetry:** Imported collections must not be automatically sent to global leaderboards or central databases without explicit opt-in confirmation by the user.

---

## 6. Integration Follow-Up & Future UI Boundary

Although the user interface layer is outside the scope of this core task, the API defined in `src/collection-format.js` is built to slide directly into the future vocabulary workspace.

### UI Boundaries & Data Flow

```
                      +-----------------------------+
                      |   User Drop Zone / Picker   |
                      +--------------+--------------+
                                     |
                                     | JSON String (Unparsed)
                                     v
                      +--------------+--------------+
                      |       Format API Parser     |  <-- Enforces 1MB Limit
                      +--------------+--------------+
                                     |
                                     +-----------------------+
                                     |                       |
                             Success |                       | Parsing/Validation Error
                                     v                       v
                      +--------------+--------------+ +------+----------------------+
                      |  Recursive HTML Escaping    | |    Error UI Modal           |
                      |  & Unknown Field Guard      | |  - Actionable Field-by-Field|
                      +--------------+--------------+ |  - Context-Aware Path-List  |
                                     |                +-----------------------------+
                                     v
                      +--------------+--------------+
                      |     State Store / Local     |
                      |     Storage Integration     |
                      +-----------------------------+
```

### presenting Validation Errors to Users
When a user uploads a malformed or invalid collection file, the validation errors array must be translated into actionable steps within a clear user interface modal.

1. **Top-Level Notice:** Clear message stating how many validation errors were found (e.g., *"Import failed with 3 structural errors. Please fix these issues in your JSON file and try again."*).
2. **Path Mapping:** Map developer-facing field paths to human-friendly terms:
   - `terms[4].cat` $\rightarrow$ **"Term #5: Category Mapping"**
   - `categories[2].key` $\rightarrow$ **"Category #3: System Slug"**
   - `title` $\rightarrow$ **"Collection Title"**
3. **Specific Solutions:** Avoid vague "Invalid field" errors. Provide strict reasons:
   - **Instead of:** `"categories[1].key: invalid value"`
   - **Show:** `Category "web-dev": Slug must contain only lowercase alphanumeric characters (a-z, 0-9) and hyphens. Got "Web Dev".`
   - **Instead of:** `"terms[0].def: exceeded length"`
   - **Show:** `Term "Promise": Definition is too long. Limit is 1,000 characters. Current length: 1,420 characters.`
