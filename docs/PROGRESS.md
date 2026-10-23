# SpellCast — Progress Log

Master plan: `docs/SPELLCAST-MASTER-PROMPT.md` · Feature plan: `docs/SPELLCAST-LEVELUP-PLAN.md` · Handover: `DESIGN-HANDOVER.md`
Branch policy: work on `levelup`, merge to `main` only at release boundaries after QA.

**Current phase:** v=37 shipped — practice "My words" only + background redesign (v=36: ambient drifting background; v=35: import categories in Practice + import format examples; v=34: mobile keyboard viewport fix; v=33: Data Management page + bulk word import (CSV/JSON/paste); v=32: keyboard stays open at check + Word chunks switch; v=31: hidden scrollbars; v=30: accordion right deck; v=29: mockup visual redesign)
**Live site:** https://eslamnabawy.github.io/SpellCast/ (currently `main` @ `1725180`, serving `v=37`)

---

## Version numbering note

The master prompt assumed the next cache-bust was `v=26`. **`v=26` already shipped** (the "quick wins" release: single-home stats, single progress bar, overflow guards, ghost Finish + confirm, danger zone, microcopy). The next release is therefore **`v=27`**, which matches the master prompt's Phase 5 ("release v=27"). No renumbering needed.

---

## Phase 0 — Safety net and harness ✅

| ID | Task | State | Commit |
|---|---|---|---|
| 0.1 | Branch `levelup` + `.gitignore` | ✅ | `c2fb1da` |
| 0.2 | QA harness in `tools/qa/` (Playwright/axe/Lighthouse, dev-only) | ✅ | `a145e2a` |
| 0.3 | Run harness, save baseline artifacts, list unverified runtime details, correct the handover | ✅ | `2dbb97f` |
| — | Plan documents copied into `docs/` for the record | ✅ | `2dbb97f` |

### Harness capability (all reproducible via `cd tools/qa && npm install && npm run all`)

- `capture-matrix.mjs` — 3 viewports (375/768/1440) × 2 themes × 11 states = **66 screenshots** in `docs/baseline/shots/`
- `session.mjs` — scripted full session, **24/24 checks pass**, fails on any console error/warning/failed request
- `fixture.mjs` — captures a live localStorage fixture, reloads it clean, asserts **no progress key lost or rewritten** (8/8 checks)
- `a11y.mjs` — axe-core on idle + result phases, both themes, 3 viewports; **138 explicit contrast probes** (text 4.5:1, non-text 3:1, alpha-composited); reduced-motion verification
- `lighthouse.mjs` — desktop + mobile presets
- `repro-category-bug.mjs` — repro for the Phase 2 category bug (see below)

### Evidence

- Lighthouse: desktop `1/1/1/1` (LCP 0.1 s, TBT 0 ms, CLS 0) · mobile `0.99/1/1/1` (LCP 1.7 s, CLS 0.009)
- axe: 12 runs, 14 violations — 12 × `page-has-heading-one` (best-practice), 2 × dark-mode contrast (below)
- Text contrast: all probes pass except the two dark-mode defects below
- Reduced motion: transitions/animations < 10 ms and the confetti layer hidden under `prefers-reduced-motion: reduce`
- Reports: `docs/baseline/{session,fixture,a11y,lighthouse,screenshot-matrix}.json` + `docs/baseline/shots/`

### Defects the harness found (Lighthouse missed them — it only audits the light theme)

| ID | Element | Measured | Required | Severity | Plan |
|---|---|---|---|---|---|
| BUG-1 | `#resetAllBtn` "Delete all data" | 2.81:1 dark | 4.5:1 | serious | fix in v=27 (dark-mode danger colour) |
| BUG-2 | My Words category/difficulty selects | 1.25:1 dark | 4.5:1 | serious | fix in v=27 (they escape the `.field select` rule → native white selects) |
| BUG-3 | no `<h1>` on the page | — | — | moderate | fix in v=27 (brand name becomes the h1) |
| BUG-4 | deck progress segments | 1.21:1 light / 1.31:1 dark | 3:1 | moderate | fix in v=27 (the primary progress indicator is nearly invisible) |
| BUG-5 | sound toggle track (off) | 1.29:1 / 1.15:1 | 3:1 | low | state also carried by thumb + "Off" label; optional |

---

## Phase 1 — Repo audit and cleanup ✅ (approved: "do the most recommended in all of them")

AUDITOR ran read-only; full report in `docs/AUDIT-PHASE1.md` (569 lines, every claim grep-verified).

**PART 1 (docs/tooling) — done:** MIT `LICENSE` · README rewritten (points at `words.js` with the real `{e,m,h}` schema, 457 words, file structure, `?v=27` rule, QA-harness section) · historical banners on `FIX-PLAN.md` / `DESIGN-HANDOVER.md` · `.gitignore` gaps closed · `tools/qa/README.md` · scratch probes moved to `tools/qa/scratch/` · **Pages switched from legacy branch deploy to `.github/workflows/pages.yml`**, which publishes **only** the 8 served files — so `docs/`, `tools/qa/`, the 3 MB baseline PNGs and the README are no longer publicly fetchable (verified: they now return 404).

**PART 2 (served paths) — done, in the auditor's risk order:**

| id | what shipped |
|---|---|
| B1 | `.pill.pill-timer` / `.pill.pill-timer.lit` — the resting timer state and the "session running" indicator now actually exist |
| B2/B3 | Real rules for `.game-card.correct/.incorrect/.new-high-score` and `.toast.milestone` (the result frame is cleared on the next round) |
| B4–B8 | Deleted `findWordMeta`, `pickCategory`, 7 dead `dom` keys, write-only `state.wordsSeen`, the unused `srsStats().fresh`; `answerMirror` registered in `dom` |
| B9/B10/B11 | Chip border now matches `--incorrect`; 4 hardcoded colours tokenised (`--danger-strong`, `--warn`, `--on-accent`); storage keys renamed `spellsprint.*` → `spellcast.*` **with a one-shot legacy migration** and `spellcast.schemaVersion = 2` |
| B12 | Dead selectors removed; duplicate `footer-actions` class removed (semantic `phase-*`/`pill-icon` hooks kept — documented deviation) |
| B13/B14 | Full OG/Twitter/canonical metadata + generated `og-image.png`; the "Works offline" claim reworded (there is still no service worker) |
| B16/B17 | `pushRecent()`, `makeSrsCard()` helpers; named constants (`REVIEW_DUE_WEIGHT`, `MS_PER_DAY`, `SRS_EASE_*`, `SRS_MATURE_DAYS`, …) |
| B18 | One global `[hidden]{display:none!important}` idiom |
| B19 | Summary modal returns focus to its opener |
| B20 | `#deckProgress` ships with `aria-valuemin/max/now` in the static HTML |

**Plus the 5 defects the harness found** (all dark-mode, all invisible to a light-theme Lighthouse): danger-button contrast 2.81 → 7.8:1 · My Words selects now styled (were native white boxes, 1.25:1) · `<h1>` added · progress segments and switch track now ≥3:1 · heading order fixed (deck headings stay in the a11y tree, visually hidden).

**Result:** axe **0 violations** across 12 runs, **138/138** contrast probes pass, reduced-motion verified, Lighthouse desktop `1/1/1/1` and mobile `0.99/1/1/1`.

## Phase 2 — Settings integrity + confirm-before-disrupting ✅ (shipped as v=27)

- **P2.1/P2.2 — the reported bug, reproduced and root-caused:** `tools/qa/repro-category-bug.mjs` showed 16 of 25 draws were nouns while "verbs" was selected. Cause: the category filter only constrained the *fresh* pool; SRS cards fell back to other categories and the bucket had no filter at all.
- **P2.3 — one source of truth:** `setSetting(key, value)` validates → persists → rebuilds what depends on it → re-renders every view; controls are rendered *from* stored state. `SETTING_DEFS` names the label, storage key, allowed values and whether a setting affects the session.
- **P2.4 — one reusable dialog:** `confirmAction({title, body, actions, requireText})` returns a promise; it traps focus, returns focus to the opener, suspends the game key handlers, pauses the session clock, becomes a bottom sheet on phones, and supports a typed confirmation. It replaced the three bespoke modals (finish / reset session / delete all) — delete-all now requires typing **DELETE** (case-sensitive) and lists exactly what is removed.
- **Strict category scope:** every source (fresh deck, bucket, due cards) now honours the selected category, so the card label can never disagree with the control. "Due only" + a category with nothing due says so by name.
- **Mid-session change:** *Keep current session* / *Switch & start fresh* (two buttons, because answers are recorded per word immediately and cannot be un-recorded).

## Release v=27 — shipped

`main` @ `900a685` (merge of `levelup`), deployed via the new Pages workflow, **verified live**: v=27 assets, 457 words, 12 categories, `spellcast.*` keys + schemaVersion 2, action dialog present, old modals gone, **Lighthouse 1/1/1**, zero console errors, and the three behavioural checks (idle change applies instantly, only the selected category is served, mid-session change asks first and applies nothing until confirmed).

## Decisions taken (owner: "do the most recommended in all of them")

1. **Category vs SRS words** → strict filtering in every source (the label can never lie).
2. **Confirm dialog** → two buttons (Keep current session / Switch & start fresh) + typed `DELETE` for wiping data.
3. **Baseline PNGs / harness exposure** → kept in git, removed from the published site by the Pages workflow.
4. **Naming** → SpellCast everywhere, including storage keys (`spellcast.*`), with a legacy migration; the owner authorised wiping any old data.
5. **Daily goal unit** (v=28) → **words** (matches the loop; minutes reward idling). Default 20.
6. **"Show again"** (v=28) → **include it**, costs 5 points and does not break the streak.

## Release v=28 — session strip redesign

The game-card top bar was rebuilt from scratch (the "skeleton bar + loud pills + floating tag" strip):

- **Left**: an accent dot (which now carries the streak theme) + the category name in sentence case — no uppercase, no tracking, no pill.
- **Right**: a 4px continuous track that fills as words are answered, the word count ("4 words"), and bare tallies next to a ✓/✗ mark. The marks carry the meaning, so the state is never colour-only; screen readers get "N correct / N incorrect" from the visually-hidden labels.
- The progress is now **session-based** (words answered, target 20) instead of a deck crawl that moved 1% per word with a 163-word pool.
- The card's gradient edge is gone (the accent dot does that job) and the beige band is now a hairline rule on the card surface.
- **Toasts moved to the bottom** — they were fixed at `top:76px` and covered the new strip.

Two real bugs the redesign surfaced and fixed: in dark mode `--progress-fill` resolved against the **root** value (custom properties substitute where they are declared), so the fill was nearly invisible; the floating "+10" score popup failed contrast mid-fade in dark mode (now uses a dedicated `--score-float` token).

Live: **v=28** — Lighthouse 1/1/1, 0 axe violations, 150/150 contrast probes, 0 console errors.

## Next

Phase 4 (visual redesign spec + `docs/mock.html`) and Phase 5 (implement it) are the remaining large pieces, then v=28 (progress/motivation), v=29 (data safety) and v=30 (polish/PWA).

---

## Phase 2 — Settings integrity + confirm-before-disrupting (release v=27, part 1)

### P2.1 — the reported bug, REPRODUCED and root-caused

Report: *"changing Category doesn't change the session — the select said 'Commonly misspelled' while the card label said 'NOUNS'."*

`tools/qa/repro-category-bug.mjs` reproduces it deterministically:

```
select Category = verbs   -> fresh pool = ["verbs"]        (correct)
25 draws with one noun in the bucket:
   nouns(srs): 16   verbs: 9                              (WRONG)
```

**Root cause:** the category filter only constrains the *fresh* pool. In `selectNextWord()`:
- the SRS branch filters due cards by category **only if the filtered list is non-empty** — otherwise it serves cards from other categories (75 % chance in "Mixed" review mode);
- the legacy-bucket branch has **no category filter at all**.

The card label shows the *drawn word's* category, so the label and the control legitimately disagree. **Not a stale-pool bug — a mixed-source bug.** Fix options for P2.3: (a) filter every source by the selected category, (b) label SRS/bucket words explicitly ("Review") instead of by category, or (c) make the category control a *preference* that the UI states plainly. Decision needed at G1 — this changes what the label means.

---

## Open questions (need the user's call)

1. **Category vs SRS words (above).** Should the category control be strict (all words filtered) or advisory (with the label naming the real source)?
2. **Confirm-before-disrupting scope.** The master prompt asks for a 3-button dialog (Keep current / Finish & switch / Discard & switch). It also says *"if answers are already recorded per word, simplify to two buttons."* Answers **are** recorded per word immediately (score, streak, category stats, SRS card) — so "discard" cannot undo them, only the *session totals* can be reset. Recommendation: **two buttons** (Keep current session / Switch & start fresh), with honest copy. Needs approval.
3. **"Delete all data" strength.** The master prompt asks it to require typing DELETE. Recommendation: keep the itemized confirm dialog and add the typed confirmation — low cost, real protection.
4. **`tools/qa/` is publicly fetchable.** GitHub Pages serves the whole repo, so the harness scripts are reachable at `https://eslamnabawy.github.io/SpellCast/tools/qa/...`. Options: (a) accept (harmless dev scripts), (b) add a deploy workflow that publishes only the 6 served files, (c) rename to a `_`-prefixed folder (only works with Jekyll on). Recommendation: (b) at the v=30 platform phase, (a) for now.
5. **Daily goal unit** (words vs minutes) — needed before v=28.
6. **"Show again"** — in or out of the game, and what does it cost? Needed before v=28.

---

## Risks

| Risk | Likelihood | Mitigation |
|---|---|---|
| Refactoring `style.css` / `script.js` breaks the live site | med | Section-reorganisation only, no rendering change; QA harness must show identical screenshots before/after |
| Moving `DESIGN-HANDOVER.md` / `FIX-PLAN.md` breaks someone's link | low | Not served by the page; keep a copy at the old path or redirect note |
| `?v=N` cache-bust missed on a shipped change | med | Bump once per release; verify the live HTML after deploy (90 s) |
| localStorage schema drift | low | Fixture test asserts byte-identical progress keys after every change |
| Contrast regressions from dark-mode work | med | 138 contrast probes + axe in both themes now run in CI-style |

---

## Commit history

`main` (live):

```
900a685  merge levelup -> main: release v=27 (audit cleanup, SpellCast rename, a11y fixes, settings integrity, strict category scope)
eb40e95  P2 settings integrity: one source of truth, shared confirm dialog, strict category scope (bump v=27)
067d65d  B4-B10, B12-B14, B16-B18: dead code, tokens, hidden idiom, constants, OG metadata
7acb474  B1-B3 + BUG-1..5: timer pill cascade, card-flash rules, dark-mode tokens, selects, h1
160a6ce  B11 rename: SpellCast everywhere, spellsprint.* -> spellcast.* + legacy migration
ec6e2f3  A1-A10 part 1: LICENSE, README, banners, gitignore, Pages workflow
b350723  0.4 phase 1 audit + gate G1 writeup
```

`levelup` (kept for the next release) holds the same work plus the phase 0 harness commits.

Earlier `main` history (live before v=27): `8b91a76` docs, `f240113` 26.6, `af2363b` 26.5, `2f603e1` 26.3, `42d0fd7` 26.2, `7bf3288` 26.1, `8db0db1` handover doc

---

## v=29 — Visual redesign (mockup adoption) ✅ · commits `e40334a` + `7a57b30` · 2026-10-22

Scope (user-approved via question): adopt the supplied mockup''s layout & look plus only the features that map onto what exists — real game logic, SRS, categories, themes, a11y and the QA harness all kept. Explicitly not ported: 4 game modes, confetti-every-3rd, WebAudio redesign, fullscreen, custom-deck modal, TTS.

**Design**
- Header restyled as the mockup bar: gradient brand tile with an inlined Lucide-style SVG sprite (no CDN), sun/moon theme icons switched by CSS, streak/timer pills, icon settings/theme buttons.
- Warm light palette (`#EAE7E0` page, `#F7F5F0` cards, `#D9D4C8` borders, `#2D3748` ink, muted darkened to `#5C6674` for 4.5:1), slate dark (`#020617`/`#0F172A`), dot-grid page background, 12/18/24 px radii, uppercase micro-labels.
- Self-hosted type: Plus Jakarta Sans + Outfit variable woff2 (latin subset, 60 KB total, `font-display: swap`, preloaded) — no Google Fonts dependency.
- Phase frames: icon tiles, `<kbd>` chips, result icon tiles (SVG check/x), mockup headline "Ready to cast?", transparent footer action band.

**Behaviour**
- Strip v29: 12-segment rolling outcome window (`#segmentRow` `role="img"` with dynamic aria-label; `.seg.is-correct/is-incorrect/is-empty`) plus the ✓/✗ tally chips, category + difficulty badges. The v=28 track and word-count label are gone (words = correct + incorrect).
- Syllable chunk chips always on for words > 4 chars that reassemble exactly; chunk spans hold no whitespace so `#wordDisplay.textContent === word`; bullet separators are pseudo-content.
- Space-to-skip during the memorise phase + "Skip ahead" button (`#seeAdvanceBtn`); Enter/Esc unchanged; guards keep Space from firing in modals or text entry.
- Memory queue tiles (Due/Learning/Mastered + total) in the right deck; difficulty badge mirrors the stored difficulty.

**Harness / QA** (probes updated for the new markup: `.badge-*` text probes, `.seg.is-correct` vs `.seg.is-empty` non-text probe, sprite check in check-files)
- Full run 6/6 PASS — session, fixture, a11y (150 probes, 0 failures; axe 12 runs, 0 violations), layout, matrix (66 screenshots), Lighthouse: desktop perf 1 / a11y 1 (LCP 0.4 s), mobile perf 0.96 / a11y 1 (LCP 2.5 s — self-hosted fonts cost ~0.8 s LCP vs v=28).
- **Rollout:** `e40334a` pushed to `main` (Pages run `39814510857`, 16 m incl. queue wait); `7a57b30` fixed the Pages staging allowlist in `pages.yml`, which never copied `fonts/` — run `39817142909` (1 m 50 s).
- **Verified live:** `index.html?v=29` 23,633 B · CSS 31,215 B · script 83,248 B · both woff2 200 · reloaded live page reports **0 console errors**, `document.fonts` loaded (Jakarta + Outfit = true), body background `rgb(234, 231, 224)` = `#EAE7E0`.

---

## v=30 — Accordion decks & panel polish ✅ · 2026-10-22

Scope (user review of v=29): kill the scrollable panels in the right deck, move Bucket + Categories out of the centre column into the right deck, and neat the left control panel + status row.

**Layout**
- Right deck rebuilt as a 4-section **exclusive accordion** — `<details class="deck-group session-group" name="rightDeck">`: Performance (open by default) · Memory queue · Bucket · Categories. Opening one closes the others, so the deck keeps a near-constant height and **no scrollbar anywhere** (`.deck`/`.deck-right` scrollbars hidden; mobile deck-right is `flex:1 1 auto; min-height:0; overflow-y:auto` as an invisible safety valve only).
- Centre column loses both expand-panels; bucket list + category stats render inside the right-deck sections. Ids preserved (`bucketToggle`/`bucketPanel`/`bucketCount`/`bucketList`, `categoryStatsToggle`/`categoryStatsPanel`); the Memory-queue summary gained `id="reviewModeToggle"`.
- Game footer slims to a single right-aligned Finish button; counts stay visible as badges in the section heads.

**Behaviour**
- `renderBucketPanel` clamps at 8 visible items + a "+N more in bucket" dashed row (`.bucket-item-more`) — the bucket can never force a scroll.
- Opening the Categories section triggers `renderCategoryStats`; accordion is exclusive at every width.

**Polish**
- Left panel: Practice + My words share one `.section-head` treatment (icon + chevron, hairline divider between groups); My words closes by default. Status row: tally chips + badges share a uniform 26 px height; `.section-head`/`.section-body` carry the spacing rhythm.

**Harness / QA** (session.mjs + capture-matrix.mjs wait on `#bucketPanel[open]`/`#categoryStatsPanel[open]`; session.mjs/fixture.mjs open the containing `<details>` before driving `#reviewModeSelect`/`#customWordInput`; layout.mjs opens the tallest (bucket) section during overflow measurement)
- Full run 6/6 PASS — session 29/29, fixture 8/8, a11y (12 axe runs, 0 violations; 150 probes, 0 failures; reduced-motion neutralised), layout 21 checks (incl. 375 px sheet), matrix 66 screenshots, Lighthouse desktop perf 1 / a11y 1 (LCP 0.1 s), mobile perf 0.96 / a11y 1 (LCP 2.5 s, CLS 0).
- **Rollout:** single commit on `main` (`b120851`, 8 files, +144/−77); Pages run `39828809004` success (~2 m). **Verified live:** `index.html?v=30` 24,770 B · CSS 32,105 B · script 84,003 B; reloaded page reports **0 console errors**, 4 deck sections with exactly one open, bucket click retracts Performance (exclusive accordion confirmed live), fonts loaded, footer = single Finish.

---

## v=31 — Hidden scrollbars + keyboard persistence ✅ · commit `107582c` · 2026-10-22

Scope (user review of v=30): the drawer/decks still showed ugly scrollbar tracks in Chrome, and the mobile keyboard kept collapsing between reveal → type swaps.

**Polish**
- All intentional overflow regions now hide scrollbars: `.settings-panel` / `.deck` / `.deck-right` / `.bucket-list` / `.category-stats` / drawer details get `scrollbar-width:none` + WebKit `::-webkit-scrollbar{display:none}`; the drawer keeps its `overflow-y:auto` as an invisible safety valve.
- `overflow-x:hidden` replaced by `overflow-x:clip` where clipping without creating a scrollable ancestor was intended.

**Behaviour**
- The answer input is **phase-parked instead of removed**: `#phaseType` no longer carries the `hidden` attribute in markup; `setPhase` toggles `.phase-parked` (`position:fixed; left:-10000px; opacity:0; pointer-events:none; visibility:hidden`). Focus is retained across reveal→type swaps, so the on-screen keyboard stays open for the whole session; closing the summary blurs, `goToTypePhase` clears value + mirror as before.
- Note for future work: per-phase visibility is driven by the `hidden` attribute — the parked class is the single exception; the initial `hidden` on `#phaseType` had to be removed from the markup or it stayed stuck (first v=31 harness run failed on 0×0 input rects until fixed).

**Harness / QA** (evidence probes committed as `tools/qa/scratch/probe-drawer.mjs` + `probe-park.mjs`)
- Full run 6/6 PASS — session 29/29, fixture 8/8, a11y (0 axe violations; 150 probes, 0 failures), layout 21 checks, matrix 66 screenshots, Lighthouse desktop perf 1 / a11y 1 (LCP 0.1 s), mobile 0.96 / a11y 1 (LCP 2.5 s).
- **Rollout:** code commit `107582c` on `main` (+110/−9, incl. both probes); docs commit follows; Pages verified after push (see header line).

---

## v=32 — Keyboard stays open at check + Word chunks ✅ · commit `e5803ff` · 2026-10-23

Scope (user review of v=31): the keyboard still closed when the answer was checked, and long words needed an on/off switch to un-cut on mobile.

**Behaviour — keyboard**
- Focus steal removed at all four sites: the `setPhase("correct"/"incorrect")` branches no longer rAF-focus `#nextBtn`, and both `handleCorrectAnswer`/`handleIncorrectAnswer` dropped their `.focus()` calls — focus rides on the parked `#answerInput` through check → reveal → type (proven across a full cycle by the probe).
- Enter now advances from the parked answer input too (modal guard kept; other text fields unaffected); the session-end blur in `showSessionSummary` stays, guarded from refocusing the parked input.
- `.phase-parked` no longer sets `visibility:hidden` — off-canvas + `tabindex=-1` while parked is enough and keeps focus-ability.

**Behaviour — Word chunks**
- New `state.chunkWords` (optional `spellcast.chunkWords` key, default on; the 7 fixed progress keys watched byte-for-byte by fixture.mjs are untouched — no migration). `SETTING_DEFS` entry "Word chunks" (`affectsSession:false`) toggles immediately and re-renders the current word; `renderWordDisplay` gates on it; field-toggle in index.html after Duration.

**Colour fix**
- Dark `--accent-on` was substituted at `html` where theme classes (on `body`) don't reach → ON-toggle track rendered `#1B4332` = 1.61:1 vs the dark card. Declared at `body` level (`style.css` lines 41/42, html line 54 as fallback) → dark track = `#86D6AE` ≈ 10:1.

**Harness / QA** (evidence probes `probe-v32.mjs` — focus across type→check→reveal→type + chunks 0/4 chips with stable textContent — plus `probe-toggle.mjs` and `probe-cascade.mjs`)
- Full run 6/6 PASS — session 29/29, fixture 8/8, a11y 12 axe runs 0 violations + 150 probes 0 failures + reduced-motion neutralised, layout 21 checks, matrix 66 screenshots, Lighthouse desktop perf 1 / a11y 1 (LCP 0.1 s), mobile 0.96 / a11y 1 (LCP 2.5 s).
- **Rollout:** code commit `e5803ff` on `main` (6 files, +220/−17, incl. three probes); docs commit follows; Pages verified after push (see header line).

## v=33 — Data Management page + bulk word import ✅ · commit `e651776` · 2026-10-23

Scope (user): "add that people can add there words using csv or jason file … or can add there words manualy in the webiste" + "and make a dedictaed page for this data mangment".

**New in-app page** (`#data`, hash-routed full-screen section `#dataPage` — not a second .html file, so state/scope are untouched):
- **My words** card: search box (`#wordSearch`, filters by word + category label), the manual add form (word/category/difficulty, moved verbatim from the drawer with all ids kept), category creator, searchable word list with delete (confirm'd).
- **Import words** card: file picker (`#importPick`, `.csv/.json/.txt`) or paste textarea → `Parse & preview`.
- **Categories** card: per-category word counts, built-in vs custom marking (create stays in My words).
- **Backup** card: Export data + the former "Import" relabeled **"Restore backup"** (full-backup `.json` restore, unchanged `importJSONFile`).
- **Danger zone**: Reset session + Delete all data moved here from the drawer.
- Drawer shrinks: `Manage data` button + `Add & import words` entry; `customCountBadge` stays as the live count. Esc / Back clear `#data`; deep-linking `/#data` lands on the page.

**Import pipeline** (`parseImportText` → preview `confirmAction` → `applyImport`):
- JSON: array of strings or `{words:[…]}`; object keys aliased (`word/text/term/title`, `category/cat/list/topic`, `difficulty/diff/level/tier`); difficulty aliases 1/low→easy, 2/normal→medium, 3/high→hard (default: current difficulty).
- CSV/TXT: delimiter sniffing (`;`/`,`/tab + quoted-cell state machine with `""` escapes), header-row detection (word/category/difficulty columns, skipped), bare word-per-line lists; `-/-v`-bare lists honour the current category; rows with no category fall back to the selected category (`custom` under All).
- Validation: 2–30 chars, letters/hyphen/apostrophe (`isValidWord`), 5000-row / 2 MB caps; BOM/quote/whitespace normalisation.
- Dedupe case-insensitively, three tiers (this list → library via `wordExistsAnywhere` → My words), each with its reason shown in the result line.
- Preview dialog: counts + new categories + first 12 words + first problem; cancel-first, never an accidental add.
- Apply: new categories created via `ensureCategory` **before** any word lands; then per-row `addCustomWord` (so SRS cards/pool/save behave exactly like a manual add); paste + result line + screen-reader announcement reflect `Imported N · skipped · rejected`.
- A `{customWords|srsCards|version}`-shaped `.json` file picked here is routed to the restore path automatically.

**Harness / QA** (new probe `tools/qa/scratch/probe-import.mjs` — 13/13: hash routing + deep-link + Esc, CSV header/alias parsing, JSON aliases, three-tier dedupe, 5000-row cap, preview dialog, apply side-effects, Restore-backup relabel + picker accepts, progress-key containment, dark-mode open):
- `fixture.mjs` updated for the moved manager (opens `#data` via `#dataOpen2` instead of the old details toggle); full run **6/6 PASS** — session 29/29, fixture byte-for-byte, a11y 12 axe runs 0 violations + 150 contrast probes 0 failures + reduced-motion neutralised, layout 21 checks, matrix 66 screenshots, Lighthouse desktop perf 1 / a11y 1 (LCP 0.1 s), mobile 0.96 / a11y 1 (LCP 2.5 s, TBT ≈ 40 ms).
- One contrast regression caught and fixed during QA: the new `.data-count-pill` was initially styled as `.count-pill`, which out-spec'd `.bucket-count`'s accent badge (4.34:1) — renamed; badges back at full accent contrast.
- **Rollout:** code commit `e651776` on `main` (5 files, +635/−57, incl. the probe); docs commit follows; Pages verified after push: live index serves `v=33` with 0 stale refs, `script.js?v=33` contains pipeline + page logic, `style.css?v=33` contains the data page styles.

**Deferred to a future release:** category rename/delete (counts-only card for now; `deleteCustomCategory` was dropped from scope).

---

## v=34 — Mobile keyboard viewport fix ✅ · commit `546ac51` · 2026-10-23

**Problem (user-reported on a vivo Android):** with the keyboard open during the type phase the card kept its full height — the word row, answer box and Check/Skip stayed hidden behind the keyboard. The layout viewport never shrank and the browser never scrolled to the focused input.

**Fix (two layers):**
- `index.html` viewport meta now reads `width=device-width, initial-scale=1.0, viewport-fit=cover, interactive-widget=resizes-content` — Android Chrome (108+) shrinks the layout viewport when the keyboard opens, so the page reflows and scrolls to the input automatically.
- `script.js` fallback for browsers that ignore that meta (older Chrome, Samsung/vivo browsers): `keepAnswerInputVisible()` + rAF-throttled `scheduleAnswerVisibilityCheck()` — on `visualViewport` resize/scroll and on answer-input focus, while `state.phase === "type"` and the input is the active element, `window.scrollBy` moves the input into the visible band between the keyboard top and the URL-bar bottom. Inert outside the typing phase, so desktop/harness behavior is untouched.

**QA:** full gate **6/6 PASS** (session 29/29, fixture byte-for-byte, a11y 12 axe runs 0 violations + 150 contrast probes 0 failures, layout 21 checks, matrix 66 screenshots, Lighthouse desktop perf 1 / mobile 0.96). New probe `tools/qa/scratch/probe-keyboard.mjs` **4/4**: synthetic 311px visual band with the input at top 331 → rescue scroll lands it in the band (scrollY 123), repeated resizes don't oscillate, anchor neutral outside the type phase.

**Rollout:** `?v=34` bumped (3 refs: style/words/script); code commit `546ac51` on `main` pushed with the v=33/34 docs record (`c40abc0`); Pages verified after push: index serves `v=34`, 0 stale refs, meta + `visualViewport` anchor live.

---

## v=35 — Import categories in Practice + format examples ✅ · commit `2f90870` · 2026-10-23

**User-reported gaps:** (1) a category that arrives through bulk import had to be picked blind — it wasn't obvious it shows up in the Practice select; (2) there was no sample of what a parsable CSV/JSON/TXT looks like; (3) the redundant "Practice" banner cluttered the controls drawer.

**Changes:**
- Import card: an optional **category claim** input (`.import-target-row`) — words in a parsed batch that carry no category of their own go to whatever is typed here (falls back to the current Practice category). `parseImportText(rawText, forcedCategory)` fallback chain: row category → forced category → state category → `custom`.
- Format chips **CSV / JSON / TXT** (aria-pressed toggles) drive an example block (`pre#importExample`) right above the import controls so users see exactly what to provide: CSV `word,category,difficulty`, JSON array of strings/objects, TXT one word per line.
- Removed the static "Practice" heading banner from the settings drawer (labels on each field remain; a11y unaffected).
- Verified end-to-end with `tools/qa/scratch/probe-category.mjs` **6/6**: imported "Galaxy" category appears in both selects immediately after import (no reload), commits without a dialog at idle, word served from the imported set, JSON chip swap works, forced category lands a category-less row in `galaxy`.

**QA:** full gate **6/6 PASS** — session 29/29, fixture byte-for-byte, a11y 12 axe runs 0 violations + 150 contrast probes 0 failures, layout 21 checks, matrix 66 screenshots, Lighthouse desktop perf 1 / mobile 0.96.

**Rollout:** `?v=35` bumped (3 refs: style/words/script); code commit `2f90870` on `main`; docs commit follows; Pages verified after push.

---

## v=36 — Ambient drifting background ✅ · commit `7785e1f` · 2026-10-23

**Request:** the moving-pattern background "unnoticeable" — make the ambient layer actually visible.

**Change (CSS-only):** two decorative fixed layers sit behind the app (`.app` gained `position:relative;z-index:1` to paint above them):
- `body::before` — large accent-tint radial glow blobs (`color-mix` on each theme's accent) drifting + scale-breathing, 26 s alternate ease-in-out;
- `body::after` — the 24 px dot texture panning the opposite way, 38 s alternate-reverse, for a parallax feel.

Both layers are compositor-only (`translate3d`, `will-change:transform`), `pointer-events:none`, ignore input entirely, and are removed under `prefers-reduced-motion`. Colors derive from the theme `--accent`, so the drift re-tints itself per theme; modal (z-100) and data page (z-40) still stack above. Glow alpha tuned up until the layers read alongside the grid.

**QA:** probe `tools/qa/scratch/probe-motion.mjs` **5/5** (both layers animating + pointer-inert, app paints above, reduced-motion → both animations gone). Full gate **6/6 PASS** — session 29/29, fixture byte-for-byte, a11y 12 axe runs 0 violations + 150 contrast probes 0 failures, layout 21 checks, matrix 66 screenshots, Lighthouse desktop perf 1 (LCP 0.2 s) / mobile 0.96 (LCP 2.5 s, TBT 50 ms).

**Rollout:** `?v=36` bumped (3 refs: style/words/script); code commit `7785e1f` on `main`; docs commit follows; Pages verified after push.

---

## v=37 — "My words" practice mode + background redesign ✅ · commit `1725180` · 2026-10-23

**User feedback (two items):** (1) "make me choose from category that i use only my words" — a practice option that serves exclusively the words they added/imported; (2) the v=36 moving pattern was "sooo bad" — full redesign to a tasteful ambient layer.

**Practice "My words" only:**
- Pinned **"My words"** option in the Practice category select (value `__mine__`, double underscore = can never collide with an imported category slug — no migration needed).
- `buildCustomPool()` + a `buildPool()` branch: the pool is built purely from `state.customWords` (difficulty filter applies); `getDueCards` filters by custom-word membership under this mode; zero-words state falls through to the existing `READY_HINT_NO_WORDS` hint.
- The `SETTING_DEFS.category` values gate now includes `MINE_KEY` (first fix attempt silently missed line 2029 — the probe's diag caught it, second edit grep-proofed).
- Verified with `tools/qa/scratch/probe-mine.mjs` **3/3**: commits at idle with no dialog, pool of exactly the custom words, a served round picks a custom word.

**Background redesign (Option A — aurora + grain):**
- **One** moving layer only: `body::before` with three large accent-tint radial light pools (`color-mix` 7–11%) + `blur(48px)`, drifting on a 52 s alternate `bg-breathe` path (translate-only, no scale → no shimmer).
- **Static** `body::after`: SVG `feTurbulence` film-grain tile at 5% — kills banding and makes the soft motion read as light, not smudge; nothing crisp ever moves.
- `prefers-reduced-motion` kills only the mover; grain stays. Colors follow each theme's `--accent`; `.app` paints above via `z-index:1`; modal + data page still stack above. Verified by `probe-motion` 5/5.

**QA:** full gate **6/6 PASS** — session 29/29, fixture byte-for-byte, a11y 12 axe runs 0 violations + 150 contrast probes 0 failures, layout 20 checks, matrix 66 screenshots, Lighthouse desktop perf 1 (LCP 0.2 s) / mobile 0.96 (LCP 2.5 s, TBT 0, CLS 0).

**Rollout:** `?v=37` bumped (3 refs: style/words/script); code commit `1725180` on `main`; docs commit follows; Pages verified after push.
