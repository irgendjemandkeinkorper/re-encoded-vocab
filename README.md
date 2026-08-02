# Re-Encoded Vocabulary

An interactive multi-subject glossary that re-encodes core concepts through 8 interchangeable lenses—allowing you to learn complex terms translated into analogies you already understand (Medical, Sports, Pop Fantasy, Tabletop Games, Culinary, Pop Culture, Motorsport, and Video Games).

The application is completely self-contained within a single file (`index.html`) with no build steps required. It has a single external CDN dependency—Supabase—which is used only for the shared leaderboard; if offline or unavailable, the site degrades gracefully and continues to work perfectly.

The Supabase UMD bundle is deliberately pinned to `@supabase/supabase-js@2.111.0`
and protected with a SHA-384 integrity hash. Re-hash the exact asset whenever
upgrading that dependency. See [the Supabase setup guide](docs/supabase-setup.md)
for schema, RLS, and fork configuration details.

You can view the live site at [https://irgendjemandkeinkorper.github.io/re-encoded-vocab/](https://irgendjemandkeinkorper.github.io/re-encoded-vocab/).

---

## Features & Modes

The application features five interactive modes designed for deep learning, active recall, and inspection:

1. **Glossary Mode (The Grid):** Browse cards by subject and category, search for terms, filter by starred items, and tap any card to flip it and view its analogy translations.
2. **Study Mode (Flip-Cards):** A focused study deck experience. Star terms in the glossary to build a custom study stack, then flip through them front-to-back to master them.
3. **Quiz Mode (Active Recall):** Test your knowledge with typed answers. Track your score and maintain a streak—hitting a streak of 5 or more activates a 2x point multiplier.
4. **Leaderboard:** View high scores and submit your quiz results to a persistent leaderboard backed by Supabase (grouped by subject).
5. **Code Lab:** A segment-by-segment guided walkthrough of the site's own core javascript functions, re-narrated through the lens system to show how the app itself works.

---

## Hosting on GitHub Pages (Free, ~5 minutes)

Since the entire application is in `index.html`, hosting is incredibly simple.

### 1. Create a repository
- Go to [github.com/new](https://github.com/new).
- Name it anything (e.g. `re-encoded-vocab`).
- Set it to **Public** (required for free GitHub Pages).
- Click **Create repository**.

### 2. Upload the file
- On your new repository page, click **Add file → Upload files**.
- Drag in `index.html` from your local machine.
- Scroll down and click **Commit changes**.
*(Or via Git: `git add index.html && git commit -m "Add site" && git push`)*

### 3. Enable GitHub Pages
- In your repository, go to **Settings → Pages** (in the left sidebar).
- Under **Build and deployment → Source**, select **Deploy from a branch**.
- Under **Branch**, select `main` and `/ (root)`, then click **Save**.
- Wait about a minute—GitHub will provide a live URL, usually:
    `https://yourusername.github.io/re-encoded-vocab/`

### Setting up your own leaderboard

The public demo's Supabase project is not a reusable backend for forks. Create
your own project, run the SQL in [docs/supabase-setup.md](docs/supabase-setup.md),
then replace `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `index.html`. Keep Row
Level Security enabled: the browser is an untrusted client and can submit
arbitrary requests directly. The documented policies allow public reads and
plausible inserts, but no anonymous updates or deletes.

---

## Customizing and Editing Content

All data and configuration are housed directly in `<script>` tags inside `index.html`. You do not need any build tools or package managers—simply edit the file and refresh your browser.

### Top-level Structure & Subjects
The top-level tabs and subjects are defined by the `SUBJECTS` array:
```js
const SUBJECTS = [
  {key:'coding', label:'💻 Coding & QA'},
  {key:'philosophy', label:'🏛️ Philosophy'},
  {key:'school', label:'🎓 School Subjects'},
];
```

The filter categories shown for each subject are controlled by `CATS_BY_SUBJECT`:
```js
const CATS_BY_SUBJECT = {
  coding: [
    {key:'all', label:'All'},
    {key:'python', label:'Python'},
    {key:'qa', label:'QA / SDLC'},
    // ...
  ],
  // ...
};
```

Card accent colors are mapped using `COLOR_MAP`:
```js
const COLOR_MAP = {
  python: 'python',
  qa: 'qa',
  // ...
};
```

---

### Adding or Editing Terms
Glossary entries live in the `DATA` array. To add a new term, append an object to `DATA` following this schema:

```js
{
  subject: "coding",          // The subject key matching a key in the SUBJECTS array
  term: "Try / Except",       // The term name
  cat: "python",              // The category key matching an entry in CATS_BY_SUBJECT
  sub: "Structure",           // Subgroup label shown as a tag on the card
  def: "Attempt an action, and have a fallback plan ready if it fails, instead of the whole program crashing.",
  analogy: "A contingency protocol — you hope you don't need it, but if the standard approach hits a complication, there's a planned fallback instead of the whole case falling apart.", // Serves as the default/Medical analogy
  ex: "try:\n    dose = weight / 0\nexcept ZeroDivisionError:\n    dose = 0", // Optional code/text example (omit if none)
  lenses: {                   // Analogies for the other 7 interchangeable lenses
    sports: "Attempting a risky play, with a backup formation ready in case it doesn't work.",
    fandom: "Casting a spell with a counter-curse ready, in case the first one backfires.",
    ttrpg: "Attempting a risky action with a fallback plan the party's already agreed on if it fails.",
    cooking: "Trying a new technique with a backup dish ready in case it doesn't turn out.",
    millennial: "Sending a risky text with a 'jk' follow-up ready in case it lands wrong.",
    f1: "Attempting an overtake with a fallback line planned in case it doesn't stick.",
    gaming: "Attempting a risky boss strategy with a revive item ready in case it goes wrong."
  }
}
```

#### Supported Lens Keys
The site supports the following lens keys from the `LENS_OPTIONS` array:
- `medical` (Medical - 🩺) — *Falls back to the `analogy` property of the term*
- `sports` (Sports - 🏀)
- `fandom` (Pop Fantasy - 🪄)
- `ttrpg` (Tabletop Games - 🎲)
- `cooking` (Culinary - 🍳)
- `millennial` (Pop Culture - 📼)
- `f1` (Motorsport - 🏎️)
- `gaming` (Video Games - 🎮)

*Note: If any optional lens is omitted from a term's `lenses` object, the UI will fall back to displaying the default Medical analogy (`analogy` property).*

---

### Adding or Editing Code Lab Walkthroughs
The interactive walkthroughs inside the Code Lab are configured within the `CODE_WALKS` array. Each walkthrough is structured as an object containing segments of code mapped to plain explanations and lens-specific analogies.

To add a new walkthrough, append an object to `CODE_WALKS` matching this shape:

```js
{
  id: 'get-lens-text',
  title: 'getLensText(d, key)',
  summary: 'The heart of the whole site: turn one idea into whichever world you picked.',
  segments: [
    {
      code: 'function getLensText(d, key){',
      plain: 'Take a term (d) and a lens key like "f1", and hand back the right retelling of it.',
      lenses: {
        f1: 'The strategy call: given the car and the tyre compound you\'ve chosen, decide which race plan to run.',
        fandom: 'A spell that takes a subject and a House, and returns the version taught in that House.',
        gaming: 'A skin-swapper: feed it a character and a cosmetic, get back that character wearing it.',
        cooking: 'A recipe adapter: give it a dish and a cuisine, get the version cooked that way.',
        sports: 'The commentator: hand them a play and a sport, they call it in that sport\'s language.',
        medical: 'Intake: given a patient and a specialty, route them to the right specialist\'s notes.'
      }
    },
    {
      code: '  if (key === \'medical\') return d.analogy;',
      plain: 'If the chosen lens is the default one, just return the original analogy unchanged.',
      lenses: {
        f1: 'No aero package selected — send the car out in base setup, exactly as it was built.',
        fandom: 'The plain incantation, before you Transfigure it into any other form.',
        gaming: 'Default skin requested — return the character with no cosmetic applied.',
        cooking: 'House style ordered — serve the dish the original way, no cuisine swap.',
        sports: 'The neutral call, before any sport-specific slang gets layered on.'
      }
    }
  ]
}
```

#### Code Lab Analogy Guidelines:
- Each segment has a `plain` explanation (the standard technical/literal meaning).
- Under `lenses`, specify translations corresponding to the 8 lens keys (`medical`, `sports`, `fandom`, `ttrpg`, `cooking`, `millennial`, `f1`, `gaming`).
- **Rule:** Any lens key omitted from a segment's `lenses` object will display a "translation coming soon" message in the Code Lab interface. To ensure a polished user experience, please attempt to provide analogy mappings for all 8 keys in every segment.
