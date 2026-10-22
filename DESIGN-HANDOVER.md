# SpellCast — UI/UX Design Handover

**Product:** SpellCast — a fast, single-purpose English spelling trainer
**Live:** https://eslamnabawy.github.io/SpellCast/
**Repo:** https://github.com/EslamNabawy/SpellCast (branch `main`)
**Stack:** Plain HTML + CSS + vanilla JS. No frameworks, no build step, no backend. All state is `localStorage`.
**Prepared:** October 2026 · v2 word library (457 words in `words.js`)

---

## 1. What the product is

A spelling practice game with three loops:

1. **Apprentice drill** — a pool of fresh words shuffled per session. See a definition/hint, type the word, check, get corrected inline.
2. **SRS weak-word loop (the "bucket")** — words the user got wrong or skipped enter a spaced-repetition bucket (SM-2-like intervals; words reappear due shortly after a miss, and any correct answer removes them from the immediate rotation; a word graduates to "Mastered" at an interval ≥ 21 days or when the bucket is clear).
3. **Stats/mastery dashboard** — per-category accuracy chips, personal records (streak, time), a Weak Words review list, Mastered counter.

The user picks **one category + one difficulty** before starting (defaults: All categories / Medium). There are 12 built-in categories (Nouns, Verbs, Adjectives, Adverbs, Commonly Misspelled, Advanced, Animals, Food, Science, Technology, Nature, Sports) × 3 difficulties, ~457 words in `words.js`, plus custom words imported/created by the user.

Everything runs in one page. No routes, no pages.

## 2. Current layout (recording of structure, not a design brief)

One column, max-width `--max: 640px`, centered:

| Region | Element (`id`) | Role |
|---|---|---|
| Header | `header.header`, `themeToggle`, `settingsToggle` | App wordmark (Georgia serif "SpellCast" + sparkle), dark-mode toggle (🌙/☀), settings gear |
| Left deck | `aside.deck.deck-left` > `section.settings-panel#settingsPanel` | Settings drawer: category select, difficulty select, timer select (2s default), sound toggle, My Words manager (add word / create category / export / import / reset), SRS management (bucket, category stats toggles) |
| Center | `main.game-card#gameCard` | The actual game: category tag pill + timer pill, definition/hint text, answer input, Check/Skip buttons, keyboard shortcuts (Enter = check/next, Esc = inline modals only) |
| Expanders | `section.expand-panel#bucketPanel`, `#categoryStatsPanel` | Weak-word review list; per-category accuracy chips |
| Right deck | `aside.deck.deck-right` > `section.dashboard` | Session stats: streak, best streak, time, input accuracy chips, categories |
| Session end | Summary modal (via `#summaryCloseBtn`, `#summaryNewSessionBtn`) | Words seen, correct, mastered, records |
| Feedback | Toast system (bottom), `aria-live` announcements | Correct/incorrect flashes, "No pasting" warning |

Mobile (≤ 720px): left/right decks become one stacked column; the settings drawer opens as a **full-height sheet** (`body.settings-open` slides the game card aside). Desktop shows decks on the sides.

## 3. Design system as it exists today (tokens in `style.css`)

```
--paper #FAF8F3 (warm cream bg)   --paper-raised #FFFFFF   --paper-soft #F2EFE8
--ink #1F2421   --ink-soft #5B6560   --ink-faint #676E68
--line #E7E2D6   --line-soft #EDE9DE
--accent #2D6A4F (forest green)  --accent-strong #1B4332  --accent-tint #E7F0EA
--correct #2D6A4F / tint #E7F0EA --incorrect #A84620 (burnt sienna) / tint #F7EBE6
Fonts: display = Georgia/Iowan serif; ui = system stack
Radius 10/16/22 · shadows soft · motion 140ms/280ms cubic-bezier(.22,1,.36,1)
```

Mood: "boutique stationery" — warm paper, ink-colored text, one green accent, serif display type. Dark mode flips to deep charcoal with the same accent. All color pairs in use were verified ≥ WCAG AA (4.5:1 body, 3:1 large/UI), including focus rings and the timer pill states (resting = transparent + inset line; lit = green tint).

## 4. Non-negotiable constraints for any redesign

1. **Accessibility is already at AA and must stay there.** Lighthouse is 1/1/1 clean. Any new component must preserve: visible focus order, `aria-live` announcements for word changes/results, labeled controls, Esc/Enter guarded in modals, and AA contrast in **both** themes. Playwright-style test harnesses that inject iframes can false-fail `frame-title` — audit a clean tab.
2. **No page scroll on desktop** — the whole app fits in the viewport; internal scroll regions only (documented drawer behavior). On mobile the settings sheet is the exception.
3. **Keyboard-first game feel.** Enter checks/advances, input auto-focuses, answer field suppresses autofill/suggestions (`autocomplete=new-password` on fine pointers — intentional, keeps a Lighthouse audit green) and blocks pasting the current word (shows "No pasting" toast). Don't redesign away these behaviors without replacing their affordances.
4. **Zero-backend reality.** All persistence is `localStorage` keys named `spellsprint.*` (historical name — keep it). Import/export is a JSON blob. Redesign can't assume sync/auth.
5. **Vanilla CSS variables drive theming.** Restyle by editing tokens/components in `style.css`; JS touches `class`/`hidden` only. There is no CSS-in-JS, no Tailwind.
6. **Game states are class-driven:** `.lit` (timer pill), `body.settings-open`, `.correct/.incorrect` flashes on the game card, `[hidden]` panels. Screen readers get text through `announce()`; new UI must not bury it.

Bulk import today accepts a JSON list; a friendlier paste-list import ("comma or line separated") is a design opportunity, not a current capability.

## 5. Where UX is genuinely weak (the actual design brief)

Ranked by user impact:

1. **First-run discovery.** No onboarding. A first-time visitor sees selects + "Show word" and a gear icon; the Bucket/SRS concept is invisible until they fail words. No empty-state education, no "what is this app" moment. *Need: lightweight onboarding (3 steps max) or a self-explanatory hero state.*
2. **Progress feels opaque.** Mastery (21-day SRS graduation) is measured but only surfaced as a number in the right deck. No progress visualization across days, no sense of "collection" (e.g., words mastered per category constellation, streak calendar). *Need: one visual system for progress that rewards return visits.*
3. **Session summary is a dead end.** After a session: plain stats list. No sharing/export image, no personalized next-step ("Your -ible/able-suffixed miss rate is 40% — practice those?"), no celebration moment. This is the largest emotional-peak opportunity.
4. **My Words manager is utilitarian.** Table-ish rows, small buttons, modal-based add. Import is a JSON-only workflow with no preview or error recovery. *Need: human paste-import (one word per line or comma separated), inline editing, per-word difficulty preview, and count badges.*
5. **Difficulty is a blunt switch.** easy/medium/hard applies to the whole pool. Users can't feel the difference; no adaptive mode suggestion ("You're 90% on medium — try hard?").
6. **Timer is binary.** A pill lights up while the word is on screen, but the 2s default makes most users fail by reflex; there's no visible countdown arc or "slow mode" framing. Consider an optional read mode (show word longer, hide on typing) instead of a strict timer.
7. **Feedback colorblindness subtlety.** Correct/incorrect states rely on color + text ("Correct!"/"Again"). Consider iconography or border treatment differentiation, though current tint pair is distinguishable.
8. **Sound toggle is just on/off.** No per-event balance, no mute-all moment; icon-only toggles could carry a settings surface.

## 6. Open questions for the designer to decide

- Should stats live in the header row as compact chips on desktop? Or an explicit dashboard tab?
- Keep "one column ≤640px" intimacy, or go wider (840–1040px) with side-by-side stats? Wider is a real option now that stats are richer, not essential to change.
- Dark mode: same paper metaphor flipped, or a separate "midnight" theme identity?
- Motion budget: entrance reveals (200ms max), card flip on correct (currently: none). Game feel benefits from tactile motion more than decoration. Prioritize the reveal of a new word + check feedback.
- Gamification depth: badges vs. collection vs. pure streak calendar — one system, not three.

## 7. Practical notes for implementation

- `index.html` is one file; the game DOM lives inside `#gameCard` (`id`s used by JS — keep ids stable or update `script.js` refs: `dom.answerInput`, `dom.startBtn`, `dom.checkBtn`, etc., all wired in one block at the top).
- `style.css` is 216 lines of plain CSS organized by region (header/decks/game/panels/dark). Media queries: 720px (stack), plus pointer handling for the settings sheet.
- **Cache busting:** every asset URL carries `?v=N`. Current: `style.css?v=25`, `words.js?v=25`, `script.js?v=25`. Any CSS change needs a `v=26` bump in `index.html` or GitHub Pages will serve stale CSS (rebuild is ~60–90s).
- Deploy is just `git push` to `main`. No CI. Keeping Lighthouse clean requires re-auditing after major visual changes.
- Fonts: currently system + Georgia by choice (fast, no webfont request). If adding a display webfont, subset it and keep total transfer < 60KB to preserve the 1/1/1 scores.

## 8. Suggested design deliverables

1. **Theme audit + tokens refresh** — keep the stationery soul, tighten hierarchy; produce revised `:root` token sheet.
2. **Game screen hero states** — home (pre-session), in-play, correct flash, incorrect reveal, summary modal. Desktop + 390px mobile frames.3. **Progress/mastery visualization** concept in the stats deck (collections per category, streak calendar, weakest-words callout).
4. **Onboarding 3-screens** (what/app uses/how mastery works) as one-time-intrusive, skippable.
5. **My Words + import redesign** comp (editable list, paste-import, count badges).
6. **Motion spec** — durations/easings per state change, using existing `--dur-fast/med` and `--ease` tokens.
7. **Dark mode polish pass** verifying AA contrast tokens survive.

**Do not lose:** the one-glance "answer, check, next" loop is the entire product. Any redesign must make that loop **faster or more satisfying**, not merely prettier. When in doubt, leave it.
