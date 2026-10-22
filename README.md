# SpellCast — Spelling Trainer

A fast, gamified English spelling trainer that runs entirely in your browser. See a word, watch it disappear, type it from memory, and let spaced repetition resurface the words you keep missing until you've mastered them.

**Live:** <https://eslamnabawy.github.io/SpellCast/>

Built with plain HTML, CSS, and JavaScript — no frameworks, no build step, no backend, no runtime dependencies, no tracking. Your progress lives in your own browser's `localStorage`.

---

## How it works

1. Press **Show word** (or Enter). The word appears for the time you chose (1–4 s).
2. The word disappears — type what you saw.
3. Press **Check** (or Enter).
4. Correct answers build your streak and score. Misses reset the streak and put the word in your **Bucket** for a short review, then a longer one later.

```
SEE → MEMORIZE → HIDE → TYPE → CHECK → CORRECT / WRONG → STREAK / BUCKET → NEXT
```

## Features

- **457 built-in words** across 12 categories (Nouns, Verbs, Adjectives, Adverbs, Commonly Misspelled, Advanced, Animals, Food, Science, Technology, Nature, Sports) × easy / medium / hard.
- **Your own words and categories** — add them in Settings; they merge with the built-in lists and are scheduled like everything else.
- **Spaced repetition** — every word you answer gets a card with its own interval and ease. A miss comes back in ~10 minutes; a word you know comes back in days. "Mastered" means it survived a 21-day interval.
- **Review modes** — *Mixed* blends due reviews with fresh words (75 % / 60 % weights), *Due only* serves nothing but due cards and tells you when you are all caught up.
- **Session recap** — score, accuracy, best streak, high score, words practised, bucket additions, and your strongest / weakest categories. "Keep playing" resumes; "New session" starts over.
- **Category performance** — per-category accuracy bars for the current session.
- **Streak themes** — the accent shifts as your streak grows (calm → warming up → on fire → unstoppable → spelling machine → legendary), with an AA-contrast dark mode for every band.
- **Import / export** — back up your custom words and review deck as JSON and restore it anywhere.
- **Optional sound** — Web Audio tones for correct / wrong / milestones, off by default.
- **Anti-cheat** — pasting a word is blocked, and the field suppresses autofill and keyboard suggestions on every platform.
- **Accessible by design** — AA contrast in light and dark, visible focus, `aria-live` feedback, full `prefers-reduced-motion` support.

## Running locally

No install needed for the app itself — open `index.html` in a browser. To serve it over HTTP instead (recommended: `localStorage` is per-origin, so `file://` and `http://` keep separate saves):

```bash
npx serve .            # Node
python -m http.server 8000
```

## Deploying

Push to `main`. A GitHub Actions workflow (`.github/workflows/pages.yml`) publishes **only** the files the page needs — `index.html`, `style.css`, `script.js`, `words.js` and the icons — so the docs, tools and baseline artifacts in this repo are never exposed on the live site.

**Cache busting:** asset URLs carry `?v=N` (currently `?v=27`). Bump `N` in `index.html` for every shipped change, otherwise returning visitors keep the old CSS/JS.

## Adding your own words

**In the app (recommended):** Settings → *My words* → type a word, pick a category and difficulty, press **Add**. Use **New category** for a custom list. **Import** accepts the JSON produced by **Export**.

**In the source:** edit `words.js` — it is the single source of truth for the built-in library:

```javascript
const WORD_LIBRARY = {
  meta: { version: 2, updated: "2026-10" },
  categories: {
    nouns: {
      label: "Nouns",                 // shown in the UI
      e: ["apple", "window"],         // easy
      m: ["mountain", "computer"],    // medium
      h: ["restaurant", "phenomenon"] // hard
    }
    // … one entry per category
  }
};
```

Rules the loader enforces for you (it validates, lowercases, dedupes per tier and drops malformed entries, logging what it skipped):

- words are lowercase, letters only (`a-z`), 2–30 characters;
- no word repeated inside the same tier (the same word may appear in another tier or category);
- categories are keyed by a slug (`nouns`) and labelled separately (`label`);
- a new category is picked up automatically — the category dropdown is generated from this file, so you do **not** edit `index.html`.

## Storage

Everything is stored locally under the `spellcast.*` keys (`highScore`, `bestStreak`, `bucket`, `customWords`, `srsCards`, `reviewMode`, `darkMode`, `soundEnabled`, `soundVolume`, `preferredCategory`, `preferredDifficulty`, `preferredDuration`, `lifetimeCorrect`, `totalLifetimeWords`, `schemaVersion`). There is no account, no sync and no server call. Clearing site data in your browser clears your progress — use **Export** if you want a backup.

## Development

```bash
cd tools/qa
npm install
npm run all        # session → fixture → a11y → layout → screenshot matrix → Lighthouse
```

The QA harness (Playwright + axe-core + Lighthouse) lives in `tools/qa/` and is dev-only — the live page never loads it. It scripts a full session, round-trips a `localStorage` fixture, audits WCAG AA in both themes, and captures a screenshot matrix. See `tools/qa/README.md`.

## Repository layout

```
SpellCast/
├── index.html              # the app (only file with structure)
├── style.css               # all styling: tokens, themes, layout, components
├── script.js               # game logic, state, storage, SRS scheduler
├── words.js                # the word library (457 built-in words)
├── favicon.svg/.png/.ico   # icons
├── apple-touch-icon.png
├── .nojekyll
├── .github/workflows/      # Pages deployment (publishes the served files only)
├── docs/                   # handover, plans, audits, baseline evidence
├── tools/qa/               # dev-only QA harness
├── LICENSE
└── README.md
```

## Credits

Self-contained, dependency-free educational tool. No tracking, no ads, no external calls — your practice data stays in your browser.

Licensed under the [MIT License](LICENSE).
