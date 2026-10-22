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
| `01-idle-light.png` (captured from live session) | ready screen, light | ✅ captured |
| `02-idle-dark` | dark ready screen | ⏳ capture pending — pane visibility constraint |
| `03-reveal` | word shown, linear countdown | ⏳ pending |
| `04-typing` | type phase, input focused | ⏳ pending |
| `05-correct` / `06-incorrect` | result phases | ⏳ pending |
| `07-summary` | session recap modal | ⏳ pending |
| `08-bucket` / `09-categories` / `10-my-words` | footer + drawer panels | ⏳ pending |

The pending shots are the only Phase 0 items not verifiable without a screen-visible browser. In the interim all six state machines were exercised/verified programmatically via DOM (`state.phase` transitions all reached).
