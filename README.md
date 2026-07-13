# Field Chart — Python & QA Vocabulary

An interactive glossary for learning Python, QA/SDLC, and core programming concepts, translated through analogies — medical, sports, Harry Potter/LOTR/Hunger Games, D&D/MTG, cooking, millennial pop culture, F1, and video games.

Single self-contained file (`index.html`) — no build step, no dependencies. Just needs to be hosted somewhere.

---

## Host it on GitHub Pages (free, ~5 minutes)

### 1. Create a repository
- Go to [github.com/new](https://github.com/new)
- Name it anything, e.g. `vocab-chart`
- Set it to **Public** (required for free GitHub Pages)
- Click **Create repository**

### 2. Upload the file
Easiest way, no command line needed:
- On your new repo's page, click **Add file → Upload files**
- Drag in `index.html` from this folder
- Scroll down, click **Commit changes**

*(Or, if you use git locally: `git add index.html && git commit -m "add site" && git push`)*

### 3. Turn on GitHub Pages
- In your repo, go to **Settings → Pages** (left sidebar)
- Under **Build and deployment → Source**, select **Deploy from a branch**
- Under **Branch**, select `main` and `/ (root)`, then click **Save**
- Wait about a minute — GitHub will give you a live URL, usually:
  `https://yourusername.github.io/vocab-chart/`

That's it — it's live, and free, and updates automatically anytime you edit `index.html` and push a new commit.

---

## Editing the content

All the glossary content lives in one place inside `index.html`: the `DATA` array near the top of the `<script>` tag, plus the `LENSES` mapping used for the analogy translations.

**To add a new term**, add an object to the `DATA` array following this shape:
```js
{
  term: "New Term",
  cat: "python",       // category key — see CATS array for existing options
  sub: "Core",         // subgroup label shown as the small tag on the card
  def: "Plain-English definition.",
  analogy: "The medical/default analogy.",
  ex: "optional_code_example()"   // omit this line if there's no code example
}
```

**To add analogy translations** (sports, fandom, D&D, cooking, etc.) for a term, add a `lenses` object to it:
```js
lenses: {
  sports: "...",
  fandom: "...",
  ttrpg: "...",
  cooking: "...",
  millennial: "...",
  f1: "...",
  gaming: "..."
}
```
Any lens left out just falls back to showing the medical analogy with a small "translation coming soon" note.

**To add a new category**, add it to the `CATS` array (controls the filter tabs) and optionally to `COLOR_MAP` (controls which accent color the cards use).

No build tools, no npm install — just edit the file and refresh the browser to preview locally, then commit and push when you're happy with it.
