# SpellCast — Phase 0 Baseline (pre-v=26)

**Date:** 2026-10-22
**Commit captured:** `8db0db1` (v=25)
**Environment notes:** built-in desktop browser, CSS viewport ≈ 480–600 px wide (pane-constrained; `window.innerWidth` reports 1000 at DPR 1.25 — trust layout media queries, not innerWidth). Designed 375/768/1440 px capture pass is still pending; at 1440 px the desktop three-column grid (`min-width:1000px` rules in `style.css`) has NOT been visually verified this session.
**Screenshots:** captured opportunistically below; capture blocked at times because `browser.screenshot` requires the visible Review pane. Files kept in this folder when obtainable.

## Lighthouse (tab: live local copy of v=25)

| Category | Score |
|---|---|
| Accessibility | 1 |
| Best Practices | 1 |
| SEO | 1 |

Console during a full reveal → type → submit round: **0 errors, 0 warnings**.

## Answer → check → next loop (baseline timing)

Measured from interaction handlers in `script.js` (code path): after `answerForm.submit`, the transition to result phase is synchronous (no timers); the result → next round is one click/Enter, then reveal lasts exactly `state.duration` (default 2000 ms) before the input opens. Net floor, user-observable:** 2s wait + 1 Enter + typing + 1 Enter per word. The 2s reveal is the dominant loop cost and is user-configurable (1–4s). No animation-induced delay beyond `--dur-fast/med` micro-transitions.

## Runtime facts verified (handover corrections)

1. **Idle behavior differs from the plan's screenshot.** Pre-game state is a dedicated `#phaseReady` screen ("Ready? / Memorize, then type from memory / Show word button"). The claimed "YOUR TURN before a word is shown" and click-to-reveal confusion do not exist in v=25 code.
2. **Reset all already requires confirmation** (`#resetAllOverlay` modal with itemized list, Cancel/Delete, Esc + backdrop close). F5's confirmation half is already shipped.
3. **Volume already hides while Sound is Off** (`#volumeField[hidden]`, driven by `setSoundToggleUI` + the toggle listener). 26.4 is already satisfied.
4. **Feedback already has icon + text + `aria-live`:** correct state shows ✓ icon + "Correct" headline + word + points; incorrect shows × icon + "Not quite" + word + your-entry. 26.7 is already satisfied; only grayscale differentiation remains as an optional polish.
5. **F1 stat duplication confirmed:** `#headerBest`, `#headerScore`, `#headerAccuracy` pills exist in the header AND the right-panel stat cards (`#statBest`/`#statScore`/`#statAccuracy`) show the same numbers. Streak also duplicated (`#headerStreak` vs `#statStreak`).
6. **F3 partial:** "Word 0" chip (`#sessionWordCount`, counts *attempted* words) coexists with "Word X of 12" (`#phaseProgress`, counts *revealed* words in pool). The disagreeing numbering is confirmed; the segmented-progress-bar replacement was not yet built.
7. **F4 sidebar overflow:** at ≈480–600 px the settings drawer is hidden until opened, opens as a full-height sheet and shows **no horizontal scrollbar** (overflow probe found only expected 1px `sr-only` spans; `document.body`/`html` never overflow). The finding did not reproduce in v=25; desktop-width replication still required before closing.
8. **Storage:** `spellsprint.*` keys unchanged; bucket→SRS migration runs automatically when `srsCards` is empty but legacy bucket has entries.
9. **Import/export:** JSON v2 contains `customWords`, `srsCards`, `categories`; rows missing word/category are skipped with a count toast (`X added · Y updated · Z skipped`). There is no preview screen (v=29 scope).
10. **Timer audio:** only "correct / incorrect / milestone" tones through WebAudio; skip has no tone.

## Screenshot inventory

| File | State | Status |
|---|---|---|
| `shots/01-idle-light.png` (captured from live session) | ready screen, light | ✅ captured |
| `shots/02-idle-dark` | dark ready screen | ⏳ capture pending — pane visibility constraint |
| `shots/03-reveal` | word shown, linear countdown | ⏳ pending |
| `shots/04-typing` | type phase, input focused | ⏳ pending |
| `shots/05-correct` / `06-incorrect` | result phases | ⏳ pending |
| `shots/07-summary` | session recap modal | ⏳ pending |
| `shots/08-bucket` / `09-categories` / `10-my-words` | footer + drawer panels | ⏳ pending |

The pending shots are the only Phase 0 items not verifiable without a screen-visible browser. In the interim all six state machines were exercised/verified programmatically via DOM (`state.phase` transitions all reached).

---

# Phase 0 rebuild (2026-10-22, branch `levelup`)

The original baseline above was written by hand from static code reading. It has been replaced by a **repeatable harness** in `tools/qa/` (Playwright + axe-core + Lighthouse, dev-only). Run it with `cd tools/qa && npm install && npm run all`.

## Harness

| Script | What it does |
|---|---|
| `capture-matrix.mjs` | 3 viewports (375/768/1440) × 2 themes × 11 states = **66 screenshots** into `docs/baseline/shots/` |
| `session.mjs` | Scripted full session (start → correct → incorrect → back → Esc-skip → bucket → categories → every setting → sound/volume → theme → finish+confirm → summary → delete-all dialog). **24 checks, all passing**, fails on any console error/warning/failed request |
| `fixture.mjs` | Captures a localStorage fixture from a live session, reloads it in a clean context, asserts **no progress key is lost or rewritten** (`docs/baseline/fixture.json`) |
| `a11y.mjs` | axe-core (WCAG 2.1 AA + best-practice) on idle and result phases in both themes at 3 viewports, **138 explicit contrast probes** (text 4.5:1 / non-text 3:1) with alpha compositing, plus a reduced-motion verification pass |
| `lighthouse.mjs` | Lighthouse desktop **and** mobile presets |
| `axe-detail.mjs`, `debug-*.mjs` | One-off diagnostic probes kept for future triage |

## Results (current `main`, v=26)

- **Lighthouse:** desktop `1 / 1 / 1 / 1` (LCP 0.1 s, TBT 0 ms, CLS 0); mobile `0.99 / 1 / 1 / 1` (LCP 1.7 s, TBT 0 ms, CLS 0.009).
- **Session script:** 24/24 checks pass, 0 console issues.
- **Fixture round-trip:** 8/8 checks pass — progress, bucket, SRS cards, custom words, settings and theme survive a reload byte-for-byte.
- **axe:** 12 runs, 14 violations — 12 are the same `page-has-heading-one` (best-practice, all viewports), 2 are the dark-mode contrast failures below.
- **Reduced motion:** animations and transitions neutralised (<10 ms) and the confetti layer hidden under `prefers-reduced-motion: reduce`.
- **Text contrast:** all probes pass **except** the two dark-mode defects below.

## Defects found by the harness (all dark mode only — Lighthouse missed them because it audits the light theme)

| ID | Element | Measured | Required | Cause |
|---|---|---|---|---|
| BUG-1 | `#resetAllBtn` ("Delete all data") | 2.81:1 | 4.5:1 | `--incorrect` (#A84620) on the dark surface (#1B1F23) |
| BUG-2 | `#customWordCategory`, `#customWordDifficulty` (My Words selects) | 1.25:1 | 4.5:1 | the selects live in `.add-word-row`, which the `.field select,.input` rule does not cover → they render as native white selects with light text |
| BUG-3 | page structure | — | — | no `<h1>` anywhere (axe `page-has-heading-one`, best-practice) |
| BUG-4 | `.deck-progress span` (empty + current segment) | 1.21:1 light / 1.31:1 dark | 3:1 | progress segments use `--line-soft` on `--paper-soft`; the primary progress indicator is nearly invisible in both themes |
| BUG-5 | `.toggle-track` (sound switch, off state) | 1.29:1 light / 1.15:1 dark | 3:1 | track uses `--line`; the state is still conveyed by the thumb position and the "Off" label, so severity is low |

BUG-1, BUG-2 and BUG-4 are queued for the v=27 branch work (see `docs/PROGRESS.md`).

## Runtime details verified (handover corrections)

1. **The reveal is triggered by the Start button**, not automatically: `#phaseReady` → click "Show word" (or Enter) → `see` phase (word + countdown) → after `state.duration` → `type` phase.
2. **The "Word N of 12" pill is gone** (v=26) and the "Word 0" chip with it; the deck bar replaced both. `state.deckRevealed` counts words revealed in the current deck pass and resets on every `buildPool()`.
3. **Progress bar semantics:** 12 segments always represent one full pass over the active deck; `aria-valuemax` = pool size, `aria-valuenow` = words revealed.
4. **Bucket vs SRS:** the legacy `spellsprint.bucket` and `spellsprint.srsCards` both exist; a bucket entry is only *added* when the word is not already present — a repeated miss increments `mistakes` instead. A word is removed from the bucket by any correct answer, regardless of which path served it.
5. **Skip (Esc) counts as a session word**, adds the word to the bucket and resets its SRS card to a 10-minute interval, but does **not** break the streak.
6. **Settings that rebuild the pool:** Category, Difficulty (both call `resetWordPool()`); Review mode and Show for do not. Every setting persists to `spellsprint.preferred*` / `spellsprint.reviewMode` immediately on change.
7. **"Due only" review mode** returns no word at all when nothing is due — the ready state then says so and disables the Start button.
8. **Import/export:** export writes `{version:2, exportedAt, customWords, srsCards, categories}`; import adds new custom words, updates SRS cards only when the incoming `lastReviewed` is newer, and reports `added / updated / skipped` in a toast. There is no preview screen (v=29 scope).
9. **`resetAllData()`** removes every key in `LS_KEYS` (including the two lifetime counters) and restores the built-in word list. Note the lifetime counters (`spellsprint.totalLifetimeWords`, `spellsprint.lifetimeCorrect`) are written on every answer but **never displayed anywhere in the UI** — dead data today, and a natural seed for the v=28 lifetime-progress view.
10. **Tone playback:** `correct`, `incorrect`, `milestone` only — skipping and bucket events are silent.
11. **Answer field mode:** on coarse pointers it becomes `type=password` with `-webkit-text-security:none` plus a mirror element; on fine pointers it stays `type=text` with `autocomplete=new-password` and 1Password/lastpass ignore attributes.
12. **The paste guard** blocks only pastes whose text *contains the current target word*; any other paste is allowed (changed in commit `6798338`).

## Known gaps in this baseline

- No automated check for "no page scroll at 1280×720 / 1440×900 / 1920×1080" — the harness can measure `scrollHeight > clientHeight` and should grow that check in a later phase.
- No automated check for the *visual* result of a screen-reader pass; only `aria-live` presence and focus order are exercised.
- The harness drives Chromium only (system Chrome channel); no Firefox/WebKit coverage.
