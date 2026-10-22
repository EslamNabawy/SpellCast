# SpellSprint — Fix Plan

> **Status: historical.** This plan drove the 2026-10 rebuild that shipped as Release v=26
> (`v=26` in `index.html`). It is kept for context only — the live source of truth is the code,
> `docs/PROGRESS.md` and `docs/AUDIT-PHASE1.md`. Several statements below no longer match the
> running app (the app is now "SpellCast", the breakpoint is 999 px, the toast region is at the
> top, and the asset cache-buster is `?v=27`).

## Status (post-implementation)

All Phase 0, 1, and 2 items below are **implemented and verified** in a real browser against the local server:

- Root-cause CSS brace closed; all 8 media queries parse at top level (was: all responsive rules nested inside the broken `@media(prefers-reduced-motion)`).
- Empty pool → friendly hint + disabled start, no crash ("No words for this category and difficulty yet…").
- Reset All Data wipes `customWords`, `srsCards`, review mode, and restores the built-in word list.
- Header/step "Best" now shows the best streak; high score lives in the summary modal and a once-per-session "New high score" toast (1 toast, not 3).
- Enter no longer hijacks text fields or modals (`isTextEntryTarget` + `anyModalOpen` guards); Escape handling merged into one listener; summary modal "Keep playing" resumes, "New session" resets.
- Word selection rewritten (index rotation, no pool self-duplication — pool stays stable after 400 picks); "Word N of M" off-by-one fixed.
- `?v=7` → `?v=8` cache-busters; meta description added; brand renamed SpellSprint → SpellCast (title, header brand; `spellsprint.*` storage keys intentionally untouched to preserve user data).
- Contrast: `--ink-faint` raised to ≥4.5:1 in both palettes; new `--accent-btn` token fixes warm/legendary primary buttons (were 3.0:1); dark-mode per-theme tints + light `--accent-strong`; dark legendary `--paper` fixed (was light-on-light).
- Responsive: 3-column layout now at ≥1000px (was 900px), center column `minmax(0,1fr)` up to max-width 1360px, wider column caps at ≥1400px; below 1000px deck titles and the duplicate dashboard hide so mobile has no dead space.
- Category labels sanitized (`sanitizeLabel`) and escaped in stats (`escapeHtml`) — XSS label renders as text; import hardened with `sanitizeCategoryKey`, difficulty allow-list, and normalized SRS cards; errors shown via toasts/inline (no `alert()`).
- Skipped words now count in session progress and are scheduled for review.
- Bucket/SRS unified: a word leaves the bucket on any correct answer (fresh draw, bucket pick, or SRS review); weak words (lapses > 0) pay the flat +15 recovery bonus; "Mastered" = removed from bucket or card graduated (interval ≥ 21d).
- Review Mode choice persists across reloads (`spellsprint.reviewMode`); "Due only" is strict — no fresh words fall through when nothing is due.
- README rewritten for SpellCast, 12 categories, SRS review deck, import/export, dark mode.

Remaining Phase 3 (optional, not implemented): near-miss letter-diff feedback, automated test infra, fresh Lighthouse run on the deployed site.

## App-shell layout (post-deploy follow-up)

The page is now a fixed app shell on every breakpoint: `body` overflow is hidden, `.app` is exactly `100dvh` tall, and nothing ever scrolls the page. Panels size themselves to the viewport instead:

- Desktop (>=1000px): header row + one content row (`auto minmax(0,1fr)`); side decks fill the column height and scroll internally if their lists grow; the game card stretches the full remaining height.
- Mobile (<1000px): header / game (flex-fills) / review deck; the "My words" settings drawer is capped at 56dvh and scrolls internally; the review deck is capped at 36dvh; the game card gains `overflow-y:auto` so it degrades to internal scrolling if squeezed.
- Verified at 1440x900, 1280x700, 390x844 and 580x750 (settings open and closed): zero page scroll, zero horizontal overflow, nothing clipped.

Status: **plan only, nothing changed yet** (working tree is clean).
Method: read all 4 source files, then drove the running app in a real browser
(local static server + headless Chrome) to confirm every claim below.

Stack: plain HTML/CSS/JS, no build step, no deps. Keep it that way — every fix
below is a surgical patch to `index.html`, `style.css`, `script.js`.

---

## 0. TL;DR — what is actually broken

| # | Severity | Issue | Where |
|---|----------|-------|-------|
| 1 | **Critical** | One missing `}` in `style.css` kills **every** responsive/layout rule. Desktop layout, mobile breakpoints, deck styling — all dead on normal systems. | `style.css:153` |
| 2 | **Critical** | Empty word pool → uncaught `TypeError`, game crashes mid-round | `script.js:479-505` |
| 3 | **High** | "Delete all" does **not** delete custom words / SRS cards — they stay in memory and get re-saved to `localStorage` | `script.js:1530-1553` |
| 4 | **High** | "Best" in the header and dashboard shows the **high score**; the best streak is never displayed | `script.js:1183-1208` |
| 5 | **High** | "New high score!" toast fires on **every** correct answer after you beat your record | `script.js:760-769`, `1436` |
| 6 | **Medium** | Pressing **Enter** in the "Add word" field also starts a round | `script.js:1573-1588` |
| 7 | Medium | Streak banner shows a stale streak number (`ON FIRE · 6 STREAK` while streak is 7) | `script.js:730-744` |
| 8 | Medium | Category label is injected as raw HTML (stored XSS via imported JSON) | `script.js:1249` |
| 9 | Medium | `--ink-faint` text is 2.6:1 contrast — fails WCAG AA (Lighthouse a11y 0.95) | `style.css:4` |
| 10 | Low | Volume slider is visible while Sound is Off | `script.js:1813-1817` |
| 11 | Low | Skipped words count for nothing (not in session stats, not in the summary) | `script.js:1676-1686` |
| 12 | Low | Word pool self-duplicates → "Word X of Y" inflates, repeats sneak in | `script.js:479-505` |
| 13 | Low | SRS + legacy bucket double-schedule the same word; SRS reviews always pay a flat +15 | `script.js:508-557`, `1405-1412` |
| 14 | Low | Esc / backdrop click on the summary modal silently wipes the session | `script.js:1759-1789` |

Plus content/design debt: README is ~50% out of date, folder is `SpellCast` but
the app is `SpellSprint`, no `<meta name="description">`, desktop breakpoint at
900px squeezes the play column to ~245px.

---

## 1. Phase 0 — Critical (fix first, ~30 min, 1 commit)

### 1.1 The CSS brace — root cause of the broken layout
`style.css:153` ends with `.confetti-layer{display:none}` — the `@media
(prefers-reduced-motion)` block is never closed. Every rule after it (lines
154-180: `@media(max-width:560px)`, `(max-width:760px)`, `(max-width:380px)`,
`.deck-title`, `.deck-group`, `@media(min-width:900px)`, `@media(min-width:1180px)`)
gets **nested inside the reduced-motion query** and therefore only applies when
the OS has "reduce motion" enabled.

Verified in Chrome via CSSOM:

```
outer rules: 182        last outer rule: @media (prefers-reduced-motion: reduce)
inner rules of that media query: 9   ← the 3-column desktop layout lives here
matchMedia('(min-width:900px)').matches === true   // but layout is NOT applied
```

Result today: on a normal machine the app renders as one narrow column with
giant "Controls" / "Stats" headings and no side decks (that is what the first
screenshot shows). On a reduced-motion machine the layout suddenly appears —
inverted behaviour.

**Fix** — add the closing brace at `style.css:153`:

```css
@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;transition-duration:.001ms!important}.confetti-layer{display:none}}
```

**Verify**: after the fix, `getComputedStyle('.app').gridTemplateColumns` must
return three tracks at ≥900px, `.deck-title` font-size must be `11px`, and
`document.styleSheets[0].cssRules` must list the media queries at top level.

### 1.2 Empty pool crash
`getNextFreshWord()` (`script.js:479`) falls through to
`state.wordPool[state.poolIndex++ % state.wordPool.length]` when the pool is
empty → `0 % 0 = NaN` → `pool[NaN] === undefined` → `TypeError: Cannot read
properties of undefined (reading 'word')`.

Reproduced: create a category, add a word at *easy*, switch difficulty to
*medium* → pool is empty → crash on the next round.

**Fix** — bail out safely and surface a real message instead of throwing:

```js
function getNextFreshWord() {
  if (!state.wordPool.length || state.poolIndex >= state.wordPool.length) buildPool();
  if (!state.wordPool.length) return null;          // <-- new guard
  ...
  if (!candidate) {
    candidate = state.wordPool[state.poolIndex++ % state.wordPool.length];
    if (!candidate) return null;
  }
```

and in `selectNextWord()` / `beginRound()` handle `null` by showing
"This category has no words at this difficulty — change difficulty or category."

Also fix the duplication in the same function: the `while` loop does
`state.wordPool.push(candidate)` when it hits a recent word, which grows the
pool instead of rotating it (pool 142 → 143 → … and `poolSize()` inflates, so
"Word 5 of 143" drifts). Replace the rotate-with-push with an index-only
scan:

```js
const n = state.wordPool.length;
for (let i = 0; i < n; i++) {
  const c = state.wordPool[(state.poolIndex + i) % n];
  if (!recentSet.has(c.word) || n <= state.maxRecent) { state.poolIndex = (state.poolIndex + i + 1) % n; candidate = c; break; }
}
```

### 1.3 "Delete all" doesn't delete
`resetAllData()` (`script.js:1530`) clears `localStorage` but never clears
`state.customWords`, `state.srsCards`, `state.srsStats`, or the words it
injected into `WORDS`. Verified: after `resetAllData()` → `customWords` still
holds 1 entry, `srsCards` still holds 8 cards, `WORDS.nouns.medium` still
contains the custom word. The next `saveCustomWords()` / `saveSrsCards()` call
writes them back — the wipe silently undoes itself.

**Fix** — clear memory too, and rebuild the built-in word list:

```js
state.customWords = [];
state.srsCards = {};
state.bucket = [];
state.skippedWords.clear();
WORDS[cat].easy = WORDS[cat].easy.filter(w => !customSet.has(w));  // or rebuild from a pristine copy
```

Cleanest: keep a frozen `BUILTIN_WORDS` snapshot taken at load time and
rebuild `WORDS` from it on reset (`WORDS = deepCopy(BUILTIN_WORDS)`), instead
of mutating the source of truth in place.

### 1.4 "Best" shows the high score
`renderStats()` (`script.js:1185`, `1190`) writes `state.highScore` into
`#headerBest` (the 🏆 "best" pill) and `#statBest` (the "Best" card).
`state.bestStreak` is updated in `incrementStreak()` but **never rendered**.
Verified: after 4 correct answers → streak 4, best streak 4, score 40,
`#headerBest` = "40".

**Fix** — show the best streak in "best" slots, and add a distinct high-score
readout (either a new card or the summary modal). Lowest-risk change:

```js
dom.headerBest.textContent = state.bestStreak;
dom.statBest.textContent  = state.bestStreak;
```

and surface `state.highScore` separately (e.g. a "High score" card in the
Stats deck, or in the summary modal next to "Best streak").

### 1.5 "New high score!" on every answer
`awardPoints()` (`script.js:760`) sets `highScore = score` and returns
`newHighScore: true` whenever `score > highScore` — which is true on *every*
subsequent correct answer. Verified: 3 correct answers → 3 × "New high
score!" toasts stacked in the toast region.

**Fix** — only celebrate the first time the record is crossed:

```js
function awardPoints(points) {
  state.score += points;
  const wasBest = state.highScore > 0 && state.score > state.highScore;
  const firstRecord = state.score > state.highScore;
  if (firstRecord) { state.highScore = state.score; saveLocal(LS_KEYS.highScore, state.highScore); }
  return { points, newHighScore: wasBest && !state.celebratedRecord };
}
```
Simplest correct version: add a session flag `state.celebratedHigh` and only
fire the toast the first time `state.score > state.highScore` (where
`highScore` is the *previous* record captured at session start).

### 1.6 Enter in "Add word" starts a round
The document-level Enter handler (`script.js:1573`) starts a round whenever the
phase is `ready` and the focused element is not a `<select>` / `<button>` — an
`<input>` passes that check. Verified: focus the "Add word" field, press Enter →
`state.phase` goes `ready → see` and a word is shown, *on top of* the form
submitting.

**Fix** — ignore Enter when the event originates inside a form field:

```js
const t = e.target;
const isFormControl = t && (t.tagName === 'INPUT' || t.tagName === 'SELECT' || t.tagName === 'TEXTAREA');
if (state.phase === 'ready' && !isFormControl && t !== dom.startBtn) { ... }
```
(same guard needed for the `correct` / `incorrect` branches if a modal is open).

---

## 2. Phase 1 — Correctness & UX (1-2 h)

### 2.1 Stale streak banner
`applyStreakTheme()` (`script.js:730`) returns early when the theme *key* is
unchanged, so the banner text (`ON FIRE · 6 STREAK`) never updates inside a
theme band. Verified: streak 6 → banner 6; streak 7 → banner still 6.

**Fix** — always refresh the banner text; only skip the class swap:

```js
if (theme.key !== state.currentThemeKey) { ...swap classes... }
dom.stateBannerText.textContent = theme.label ? `${theme.label.toUpperCase()} · ${streak} STREAK` : "";
```

### 2.2 Raw HTML in category labels (XSS)
`renderCategoryStats()` (`script.js:1249`) interpolates `CATEGORY_LABELS[key]`
into `innerHTML` **without** escaping. Category labels are user-supplied
(`ensureCategory(key, name)` stores the raw text, `script.js:863`) and can also
arrive from an imported JSON file (`importJSONFile` → `ensureCategory(cat,
CATEGORY_LABELS[cat]||cat)`).

Verified: a category labelled `<b id="xssprobe">pwned</b>` renders as live HTML
(`htmlInjection: true`). A shared export file could carry a real payload.

**Fix** — escape everywhere (there is already an `escapeHtml()` helper) and
sanitise on entry:

```js
<span class="category-stat-name">${escapeHtml(CATEGORY_LABELS[key] || key)}</span>
```
```js
function ensureCategory(catKey, label) {
  ...
  CATEGORY_LABELS[catKey] = String(label || catKey).slice(0, 40).replace(/[<>&"]/g, "");
}
```
Also apply `escapeHtml` to `renderCustomWordsList` (already done) and to the
`importJSONFile` category labels.

### 2.3 Summary modal wipes the session
`#summaryCloseBtn`, the backdrop click, and Esc all call `resetSession()`
(`script.js:1759-1789`) while the button says "Continue". Esc is also bound
twice (two separate `keydown` listeners at `1573` and `1781`).

**Fix** — "Continue" should just close the modal and let the user keep playing;
only the explicit "Reset session" button should clear. Delete the duplicate
Escape listener and merge the two into one.

### 2.4 Screen readers get the answer for free
`announce()` at `script.js:597` announces `"Word: apple. Category: Nouns."` and
`#wordDisplay` is itself `aria-live="polite"` (`index.html:189`) → the word is
announced twice, and the whole exercise is pointless for a screen-reader user.
The README sells "accessible by design"; this is a real design decision to
make: either announce the word once and accept it, or switch to a
"press space to reveal" flow where the word is only spoken on demand.

**Fix (minimal)** — announce the category only, not the word, and drop the
`aria-live` from `#wordDisplay`; then the SR user must see it visually (which
they can't) → so instead: keep the announcement but make it a deliberate,
documented choice, and remove the duplicate `aria-live` on the display so it is
spoken exactly once.

### 2.5 Desktop breakpoint is too low
`@media(min-width:900px)` (`style.css:159`) lays out `290px | 660px | 290px`,
but at a 912px viewport the middle column collapses to **245px** (verified:
`gridTemplateColumns: "290px 244.8px 290px"`) — the game card becomes a narrow
strip.

**Fix** — raise the 3-column breakpoint to ~1180px, and give 900-1180px a
2-column layout (game + one collapsed side rail), or `grid-template-columns:
minmax(240px,290px) minmax(0,1fr) minmax(240px,290px)` with the app max-width
raised to 1320px.

### 2.6 Dark mode is only half-implemented
`html[data-theme="dark"]` (`style.css:20`) overrides paper/ink but the
`.theme-*` classes keep the **light** accent tints, so in dark mode you get
light peach pills on a near-black header (verified: pill bg `rgb(251,231,218)`
on body `rgb(17,20,22)`), and `.btn-primary` = `#C1572A` + white ≈ 3.9:1
(fails AA for 14px text).

**Fix** — add dark variants of `--accent-tint` / `--accent-glow` per theme
(≈15% accent on a dark base) and darken the accent used for solid buttons, or
use a `color-mix()` tint derived from the theme accent.

### 2.7 Session-scoped vs. lifetime data
`state.skippedWords` is a `Set` that grows forever and is never read
(`script.js:310`). `state.wordsSeen` and `state.sessionWords` are two counters
for the same thing (`sessionWords` counts answered words, `wordsSeen` counts
shown words) — the progress chip uses `wordsSeen.length + 1` vs `poolSize()`,
so it disagrees with the "Word N" chip in the top bar.

**Fix** — one counter, one meaning; drop `skippedWords`.

### 2.8 SRS vs. the legacy practice bucket
Two schedulers fight over the same words:
* `selectNextWord()` (`script.js:508`) prefers **SRS due cards at 75%**, then
  falls back to the **legacy bucket at 60%**, then fresh words.
* A missed word is added to the bucket *and* gets an SRS card due in 10 min.
* A card for a **built-in** word is created on every answer
  (`script.js:1387`), so `srsCards` grows to ~142 entries and `getDueCards()`
  re-sorts the whole map every round.
* Any SRS pick is treated as a bucket pick → it always pays a flat
  `BUCKET_MASTER_BONUS = 15` instead of the streak bonus (`script.js:1405`),
  even for a card that was never in the bucket.

**Fix** — collapse to one system: keep the SRS cards as the single source of
truth, make the "practice bucket" a *view* over `srsCards` (due + lapses > 0),
and pay `streakBonus` for normal reviews with the +15 flat bonus only when a
card graduates (interval ≥ 21 days / "mastered" flag).

---

## 3. Phase 2 — Design, a11y, content (1-2 h)

### 3.1 Contrast
`--ink-faint:#9AA0A6` on `--paper-raised:#FFFFFF` = **2.6:1** — fails WCAG AA
(needs 4.5:1) for every 10-12px label (stat labels, hints, deck titles, timer
caption, pill labels). Dark mode `--ink-faint:#6E7580` on `#1B1F23` = 3.6:1 —
also fails. Lighthouse reports the colour-contrast failure (a11y 0.95).

**Fix** — darken `--ink-faint` to `#6E756F` (≈4.7:1 on white) and lighten the
dark-mode value to `#9AA1AB` (≈5.9:1 on `#1B1F23`).

### 3.2 Mobile layout
Below 900px the left deck is just a "Controls" heading with a hidden panel, and
the right deck's 4 stat cards duplicate the header pills — dead space above
and below the game. Consider: drop the duplicate dashboard on mobile, and make
the "Controls" heading itself the disclosure button that opens Settings.

### 3.3 SEO / meta
No `<meta name="description">` (Lighthouse SEO 0.75). `theme-color` is a fixed
light green — it should follow the active streak theme and dark mode.

### 3.4 Naming
Folder = `SpellCast`, app = `SpellSprint`, export file = `spellcast-export-*.json`.
Pick one (recommend **SpellCast**, since the folder + export already use it) and
make the title, README, export filename and `<meta>` consistent.

### 3.5 README rewrite
The README documents **6 categories** (there are 12) and omits: SRS/Anki
review, custom words, custom categories, JSON import/export, dark mode,
volume, skip/back, session timer, review mode, and the fact that the
"practice bucket" is now an SRS view. The file-structure block is also wrong
(`spelling-trainer/`, misaligned `style.css`).

### 3.6 Word list is thin
142 words at the default `medium` difficulty across 12 categories (≈12 each).
The pool exhausts every ~142 words and reshuffles; combined with the
duplication bug, repeats appear. Adding 10-20 more per category would make
"no repeat until exhausted" meaningful.

---

## 4. Phase 3 — Optional product wins

* **Near-miss feedback** — currently only exact match counts (`checkAnswer`).
  A letter-level diff ("you wrote `necesary`, correct is `necessary`") is the
  single most valuable teaching addition for a *spelling* trainer.
* **Persist review mode** (`state.reviewMode` is not saved).
* **Keyboard map in the UI** — `Enter` start/check, `Esc` skip, `Space` reveal
  (currently undocumented outside the hint line).
* **Session length / target** — pick "10 words" and finish automatically.
* **Per-word mastery view** — the SRS data already supports it; just needs a
  surface.

---

## 5. Verification checklist (after each phase)

Reusable browser-driven smoke test (no framework needed):

1. `style.css` parses with **all** media queries at top level:
   `[...document.styleSheets[0].cssRules].filter(r => r.media)` must contain
   `(min-width: 900px)`, `(max-width: 560px)`, `(max-width: 760px)`.
2. At ≥900px: `.app` `display:grid` with 3 tracks; at ≥1180px the middle track
   ≥ 560px; the game card ≥ 560px wide.
3. Empty-pool case: custom category with no words at the selected difficulty →
   shows a friendly message, **no console error**.
4. 3 correct answers in a row → streak 3, best streak 3, exactly **one**
   "New high score!" toast, `#headerBest` = 3.
5. Enter inside the "Add word" field → adds the word, does **not** start a round.
6. "Delete all" → `localStorage` empty **and** `state.customWords.length === 0`
   **and** `state.srsCards` empty **and** a reload shows no custom words.
7. Esc on the summary modal → closes without wiping the score.
8. Lighthouse: accessibility ≥ 1.0, SEO ≥ 0.9 (after adding the description).
9. `node --check script.js` passes.

---

## 6. Deployment

* The page is cache-busted with `?v=7` in `index.html:12` and `index.html:328`.
  **Bump to `?v=8`** (or a hash) in the same commit as any CSS/JS change, or
  returning users keep the broken stylesheet.
* No build step; GitHub Pages serves `index.html` as-is. Push to `main`,
  enable Pages → root folder.
* After shipping, delete the stale `localStorage` keys if the storage schema
  changes (e.g. splitting `srsCards` / `bucket`) — add a `version` field to the
  persisted payload and migrate.

---

## 7. Suggested commit sequence

```
fix(css): close the reduced-motion media query  -> restores desktop + responsive layout
fix(game): guard empty word pools, stop pool self-duplication
fix(data): reset-all must clear custom words + SRS in memory
fix(ui): show best streak (not high score) in the best slots
fix(ui): fire the new-high-score toast only when the record is first crossed
fix(input): Enter in a form field must not start a round
fix(a11y): escape category labels, raise --ink-faint contrast to WCAG AA
refactor(srs): one scheduler — SRS cards as source of truth, bucket as a view
docs: rewrite README for the 12 categories, SRS, custom words, dark mode
chore: bump asset cache-buster to v=8
```
