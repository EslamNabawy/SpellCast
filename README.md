# SpellSprint — Spelling Trainer

A polished, gamified spelling practice website. See a word, watch it disappear, and type it from memory. Build streaks, earn points, and let the app quietly track which words trip you up so you can master them.

Built with plain HTML, CSS, and JavaScript — no frameworks, no build step, no backend, no external dependencies. Everything runs entirely in your browser.

---

## Project purpose

The goal is spelling improvement, not arcade gameplay. Gamification (streaks, points, milestones, a practice bucket) exists to keep practice sessions engaging without turning the app into a distraction from the actual learning.

---

## How it works

```
SEE → MEMORIZE → HIDE → TYPE → CHECK → CORRECT / WRONG → STREAK / BUCKET → REWARD / RETRAIN
```

1. Click **Show word** and a word appears for a set duration (adjustable in Settings).
2. The word disappears and you type what you remember.
3. Submit with the **Check** button or press **Enter**.
4. Correct answers build your streak and score. Incorrect answers reset your streak and add the word to your **practice bucket** for extra repetition later.

---

## Features

- **Six word categories**: Nouns, Verbs, Adjectives, Adverbs, Commonly Misspelled, and Advanced — each with easy/medium/hard word lists.
- **Category & difficulty selectors**, independent of each other.
- **Adjustable display time** (1–4 seconds).
- **Score system** with streak-based bonuses.
- **Streak system** with a persistent best-streak record and milestone celebrations at 3, 5, 10, 15, 20, 30, and 50 in a row.
- **Dynamic visual themes** — the interface subtly shifts its accent color and energy as your streak grows (calm → warm → fire → electric → rocket → legendary), always staying readable and accessible.
- **Practice bucket** — missed words come back for review, weighted by how many times you've missed them, mixed in at roughly 60% bucket / 40% new words whenever the bucket has entries.
- **Session dashboard** — score, streak, best, and accuracy at a glance.
- **Category performance breakdown** — a compact expandable panel showing your accuracy per category this session.
- **Session summary** — a "Finish session" button shows a recap: score, accuracy, best streak, words practiced, words added to the bucket, and your strongest / most-in-need-of-practice categories.
- **Optional sound effects** (Web Audio API, off by default, no autoplay).
- **Keyboard support** — Enter submits an answer and advances to the next word.
- **Accessible by design** — semantic HTML, visible focus states, ARIA live regions for feedback, and full `prefers-reduced-motion` support (including disabling the confetti effect).
- **Persistent progress** — high score and best streak survive refreshes and browser restarts via `localStorage`.
- **Two separate reset options** — Reset Session (clears the current session only) and Reset All Data (wipes everything, with a confirmation step).

---

## The streak system

Every correct answer increases your streak by one; every incorrect answer resets it to zero — without penalty language. Wrong answers are framed as "streak ended, word added to your practice bucket," never "you failed."

**Score bonuses scale with your streak:**

| Streak      | Points per correct word |
|-------------|--------------------------|
| 1–4         | +10                      |
| 5–9         | +15                      |
| 10–19       | +20                      |
| 20+         | +25                      |

Words recovered from the practice bucket always award a flat **+15** "mastered" bonus, regardless of streak, to reward fixing a known weak spot.

**Milestones** (3, 5, 10, 15, 20, 30, 50) trigger a small celebration banner — never a blocking modal — and the biggest ones (10, 20, 30, 50) add a brief, lightweight confetti burst.

**Visual themes** shift automatically with your streak:

| Streak | Theme        |
|--------|--------------|
| 0–2    | Calm/normal  |
| 3–4    | Warming up   |
| 5–9    | On fire      |
| 10–19  | Unstoppable  |
| 20–29  | Spelling machine |
| 30+    | Legendary    |

The theme only changes color, accents, and small animations — text stays readable, inputs stay obvious, and buttons stay accessible at every level.

---

## Practice bucket

- Any word you misspell is added to your bucket (no duplicates — repeat misses just increase that word's mistake count).
- While the bucket has words in it, roughly 60% of new rounds pull from the bucket (weighted toward words you've missed more) and 40% are fresh words.
- When you finally spell a bucket word correctly, it's marked **Mastered**, removed from the bucket, and awards a bonus.
- You can expand the **Practice bucket** panel at any time to see exactly which words are in it and how many times you've missed each one.

---

## Persistence

Stored in `localStorage` (nothing sensitive):

- `highScore` — your all-time best session score
- `bestStreak` — your all-time longest streak
- `totalLifetimeWords` / `lifetimeCorrect` — lifetime practice counts
- `bucket` — your current practice bucket, so it survives a refresh
- Your preferred category, difficulty, display duration, and sound setting

**Reset Session** clears your current score, streak, session stats, and bucket, but keeps your high score and best streak intact.

**Reset All Data** (in Settings) permanently deletes your high score, best streak, and lifetime statistics. It requires an explicit confirmation step before deleting anything.

---

## File structure

```
spelling-trainer/
│
├── index.html      — page structure and markup
├── style.css        — all styling, including the streak-theme system
├── script.js         — game logic, state, storage, rendering
└── README.md        — this file
```

---

## Running locally

No installation or server required. Just open `index.html` directly in any modern browser:

```
open index.html        # macOS
start index.html        # Windows
xdg-open index.html     # Linux
```

Or double-click the file in your file explorer.

The app works completely offline once loaded — there are no external API calls, fonts, or scripts.

---

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, go to **Settings → Pages**.
3. Under **Source**, choose the branch (e.g. `main`) and the root folder.
4. Save. Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

No build step is needed — GitHub Pages will serve `index.html` as-is.

---

## Adding your own words

Open `script.js` and find the `WORDS` object near the top. Each category has `easy`, `medium`, and `hard` arrays of lowercase words:

```javascript
const WORDS = {
  nouns: {
    easy: ["apple", "window", /* ... */],
    medium: ["mountain", "computer", /* ... */],
    hard: ["restaurant", "architecture", /* ... */]
  },
  // verbs, adjectives, adverbs, commonlyMisspelled, advanced …
};
```

To add a word, just append it to the relevant category/difficulty array as a plain lowercase string. No other code changes are needed — the word selection, category display, and category-label mapping all read from this same object automatically.

If you want to add a brand-new category, you'll also need to:
1. Add the category key to the `WORDS` object with `easy` / `medium` / `hard` arrays.
2. Add a matching entry to `CATEGORY_LABELS` (the human-readable display name).
3. Add an `<option>` for it in the category `<select>` in `index.html`.

---

## Accessibility notes

- All interactive controls are real `<button>`, `<input>`, `<select>`, `<label>`, and `<form>` elements.
- Focus states are visible throughout.
- Feedback (correct/incorrect, milestones, high scores) is announced via an `aria-live` region for screen readers.
- Animations respect `prefers-reduced-motion: reduce` — motion is minimized and the confetti effect is disabled entirely.
- Color is never the only signal: bucket-word priority, for example, pairs a colored dot with text ("3 mistakes"), not color alone.

---

## Credits

Built as a self-contained, dependency-free educational tool. No tracking, no ads, no external calls — your practice data stays in your own browser.
