# SpellCast — Spelling Trainer

A polished, gamified spelling practice website. See a word, watch it disappear, and type it from memory. Build streaks, earn points, and let spaced repetition quietly resurface the words that trip you up until you've mastered them.

Built with plain HTML, CSS, and JavaScript — no frameworks, no build step, no backend, no external dependencies. Everything runs entirely in your browser.

**Play it:** https://eslamnabawy.github.io/SpellCast/

---

## Project purpose

The goal is spelling improvement, not arcade gameplay. Gamification (streaks, points, milestones, a review deck) exists to keep practice sessions engaging without turning the app into a distraction from the actual learning.

---

## How it works

```
SEE → MEMORIZE → HIDE → TYPE → CHECK → CORRECT / WRONG → STREAK / REVIEW DECK → REWARD / RETRAIN
```

1. Click **Show word** and a word appears for a set duration (adjustable in Settings).
2. The word disappears and you type what you remember.
3. Submit with the **Check** button or press **Enter**.
4. Correct answers build your streak and score. Incorrect answers reset your streak and schedule the word for review.

---

## Features

- **Twelve word categories** — Nouns, Verbs, Adjectives, Adverbs, Commonly Misspelled, Advanced, Animals, Food, Science, Technology, Nature, and Sports — each with easy/medium/hard word lists (142 built-in words).
- **Category & difficulty selectors**, independent of each other.
- **Adjustable display time** (1–4 seconds).
- **Spaced-repetition review deck** — every word you answer becomes an SRS card with its own schedule (Anki-style intervals). Missed words come back within minutes; mastered words go quiet for weeks.
- **Review mode setting** — *Mixed* blends due reviews with fresh words; *Due only* turns SpellCast into a strict review-only session and tells you when you're all caught up.
- **Score system** with streak-based bonuses and an all-time high score.
- **Streak system** with a persistent best-streak record and milestone celebrations at 3, 5, 10, 15, 20, 30, and 50 in a row.
- **Dynamic visual themes** — the interface shifts its accent color and energy as your streak grows (calm → warm → fire → electric → rocket → legendary), readable in both light and dark mode.
- **Add your own words and categories** in Settings, complete with custom banks and a per-word difficulty.
- **Import / export** — back up your custom words and review deck as JSON, and restore them on any device.
- **Session dashboard** — score, streak, best streak, and accuracy at a glance.
- **Category performance breakdown** — a compact expandable panel showing your accuracy per category this session.
- **Session summary** — a "Finish session" button shows a recap: score, accuracy, best streak, high score, words practiced, and your strongest / most-in-need-of-practice categories. "Keep playing" closes the recap and continues the session; "New session" starts over.
- **Optional sound effects** (Web Audio API, off by default, no autoplay).
- **Keyboard support** — Enter submits an answer and advances to the next word; it never hijacks fields you're typing into or modals.
- **Accessible by design** — semantic HTML, visible focus states, ARIA live regions for feedback, and full `prefers-reduced-motion` support (including disabling the confetti effect).
- **Persistent progress** — high score, best streak, custom words, and the review deck survive refreshes and browser restarts via `localStorage` (`spellsprint.*` keys).
- **Two separate reset options** — Reset Session (clears the current session only) and Reset All Data (wipes everything, including custom words and the review deck, with a confirmation step).

---

## The streak system

Every correct answer increases your streak by one; every incorrect answer resets it to zero — without penalty language. Wrong answers are framed as "streak ended, word scheduled for review," never "you failed."

**Score bonuses scale with your streak:**

| Streak      | Points per correct word |
|-------------|--------------------------|
| 1–4         | +10                      |
| 5–9         | +15                      |
| 10–19       | +20                      |
| 20+         | +25                      |

A word you previously got wrong always awards a flat **+15** recovery bonus, regardless of streak, to reward fixing a known weak spot. When such a word finally leaves the practice bucket, the headline says **Mastered**.

**Milestones** (3, 5, 10, 15, 20, 30, 50) trigger a small celebration banner — never a blocking modal — and the biggest ones (10, 20, 30, 50) add a brief, lightweight confetti burst. Crossing your all-time high score mid-session triggers a single "New high score" toast, once per session.

**Visual themes** shift automatically with your streak:

| Streak | Theme        |
|--------|--------------|
| 0–2    | Calm/normal  |
| 3–4    | Warming up   |
| 5–9    | On fire      |
| 10–19  | Unstoppable  |
| 20–29  | Spelling machine |
| 30+    | Legendary    |

The theme only changes color, accents, and small animations — text stays readable, inputs stay obvious, and buttons stay accessible at every level, in both the light and dark palettes.

---

## Review deck (spaced repetition + practice bucket)

- Every word you type gets an SRS card recording its interval, ease, and review count. Correct answers push the card further into the future; a miss drops it back to a few minutes.
- Any word you misspell is also added to the **practice bucket** visible in the side panel. The bucket clears the moment you spell the word correctly.
- **Mixed mode** (default) serves due SRS reviews roughly 75% of the time, pulls bucket words ~60% of the time, and fills the rest with fresh words — weighted toward words you've missed most.
- **Due only** mode serves nothing but due cards; when none are left you get an honest "nothing is due" state instead of being served new words.
- A word needs an interval of 21+ days to be shown as *mature* in the deck stats.
- Review progress (due today, deck size, mastered count) is summarized in the Review panel.

---

## Persistence

Stored in `localStorage` (nothing sensitive):

- `spellsprint.highScore` — your all-time best session score
- `spellsprint.bestStreak` — your all-time longest streak
- `spellsprint.totalLifetimeWords` / `spellsprint.lifetimeCorrect` — lifetime practice counts
- `spellsprint.bucket` — your current practice bucket, so it survives a refresh
- `spellsprint.customWords` / `spellsprint.srsCards` — your added words and review deck
- `spellsprint.reviewMode`, `spellsprint.darkMode`, `spellsprint.soundEnabled`, `spellsprint.soundVolume` — preferences
- Your preferred category, difficulty, and display duration

**Reset Session** clears your current score, streak, session stats, and bucket, but keeps your high score, best streak, custom words, and review deck intact.

**Reset All Data** (in Settings) permanently deletes everything above and restores the built-in word list, removing custom categories. It requires an explicit confirmation step before deleting anything.

---

## File structure

```
SpellCast/
│
├── index.html      — page structure and markup
├── style.css       — all styling, including the streak-theme system and responsive layout
├── script.js       — game logic, state, storage, SRS scheduler, rendering
└── README.md       — this file
```

---

## Running locally

No installation or server required. Just open `index.html` directly in any modern browser (double-click it), or serve the folder with any static server, e.g.:

```
npx serve .                # Node
python -m http.server 8000 # Python
```

The app works completely offline once loaded — there are no external API calls, fonts, or scripts. Note that opening via `file://` still works, but serving over HTTP keeps localStorage isolated per origin, which is safer if you also use the GitHub Pages version.

---

## Deploying to GitHub Pages

1. Push this folder to a GitHub repository.
2. In the repository, go to **Settings → Pages**.
3. Under **Source**, choose the branch (e.g. `main`) and the root folder.
4. Save. Your site will be live at `https://<your-username>.github.io/<repo-name>/` within a minute or two.

No build step is needed — GitHub Pages will serve `index.html` as-is. When shipping a new version of `style.css` or `script.js`, bump the `?v=N` cache-busters in `index.html` so returning visitors get the fresh files.

---

## Adding your own words

You can do this in the app itself — open **Settings → My words**, choose a category and difficulty, and add as many words as you like. They persist in `localStorage` and merge seamlessly with the built-in lists. You can also create brand-new categories (e.g. "Medical terms" or "French loanwords") and export them as JSON to move them between devices.

If you'd rather edit the source: open `script.js` and find the `WORDS` object near the top. Each category has `easy`, `medium`, and `hard` arrays of lowercase words:

```javascript
const WORDS = {
  nouns: {
    easy: ["apple", "window", /* ... */],
    medium: ["mountain", "computer", /* ... */],
    hard: ["restaurant", "architecture", /* ... */]
  },
  // … other categories
};
```

To add a word, just append it to the relevant category/difficulty array as a plain lowercase string. No other code changes are needed — the word selection, category display, and category-label mapping all read from this same object automatically.

If you want to add a brand-new category in source, you'll also need to:
1. Add the category key to the `WORDS` object with `easy` / `medium` / `hard` arrays.
2. Add a matching entry to `CATEGORY_LABELS` (the human-readable display name).
3. Add an `<option>` for it in the category `<select>` in `index.html`.

---

## Accessibility notes

- All interactive controls are real `<button>`, `<input>`, `<select>`, `<label>`, and `<form>` elements.
- Focus states are visible throughout, and modals return focus to the control that opened them.
- Feedback (correct/incorrect, milestones, high scores) is announced via an `aria-live` region for screen readers.
- Text contrast meets WCAG AA in both light and dark mode, across all six streak themes.
- Animations respect `prefers-reduced-motion: reduce` — motion is minimized and the confetti effect is disabled entirely.
- Color is never the only signal: bucket-word priority, for example, pairs a colored dot with text ("3 mistakes"), not color alone.

---

## Credits

Built as a self-contained, dependency-free educational tool. No tracking, no ads, no external calls — your practice data stays in your own browser.
