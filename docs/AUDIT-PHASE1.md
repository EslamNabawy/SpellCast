# SpellCast — Phase 1 Repository Audit

**Auditor:** subagent (read-only)
**Date:** 2026-10-22
**Branch:** `levelup` (not modified, not committed, not pushed)
**Scope:** whole repo except `.git` and `tools/qa/node_modules`
**Method:** static read of every source file + targeted greps + two headless-Chrome
verification runs (repo's own `tools/qa/server.mjs` + `playwright`, `channel: "chrome"`).
Every claim below was re-verified by grep or by computed-style/DOM inspection; where a
claim could not be confirmed, it says so explicitly.

**Severity key:** `RISK` = risk of breaking the live site if the change is applied
wrongly. `PATH` = `SERVED` (`index.html`, `style.css`, `script.js`, `words.js`) or
`DOC` (documentation / tooling only).

---

## 1. Inventory

### 1.1 File tree (`.git` and `node_modules` excluded)

```
                                       bytes   lines
ROOT
  .gitignore                             220       14
  .nojekyll                                0        0
  DESIGN-HANDOVER.md                  12,083      108
  FIX-PLAN.md                          22,703      432
  README.md                           10,796      190
  apple-touch-icon.png                 4,371
  favicon.ico                            836
  favicon.png                          3,251
  favicon.svg                            316
  index.html                          17,651      330
  script.js                           74,854     2019
  style.css                           26,126      236
  words.js                             9,029      256
                                       ──────
  root total (13 files)               178,014

docs/
  SPELLCAST-LEVELUP-PLAN.md           12,698      221
  SPELLCAST-MASTER-PROMPT.md          15,383      186
  baseline/BASELINE.md                10,829      106
  baseline/a11y-report.json           59,710
  baseline/fixture-report.json         1,451
  baseline/fixture.json                1,282
  baseline/lighthouse.json             3,424
  baseline/screenshot-matrix.json     12,901
  baseline/session-report.json         2,867
  baseline/shots/*.png   66 files    3,049,196   (25–79 KB each)
                                       ──────
  docs total (76 files)            3,174,213

tools/qa/
  a11y.mjs                           12,189
  axe-detail.mjs                      1,156
  capture-matrix.mjs                  5,336
  debug-cdp.mjs                       1,532
  debug-chain.mjs                     1,294
  debug-contrast.mjs                  1,829
  debug-experiment.mjs                2,218
  debug-rules.mjs                     1,892
  fixture.mjs                         4,867
  helpers.mjs                         3,888
  lighthouse.mjs                      2,767
  package.json                          632
  package-lock.json                  96,612
  run-all.mjs                         1,038
  server.mjs                          1,819
  session.mjs                         9,103
  repro-category-bug.mjs              (untracked — created during this audit window)
```

`tools/qa/node_modules/` exists on disk (~166 MB) and is correctly gitignored.

### 1.2 What the live page actually loads

`index.html` references exactly 8 files:

| referenced from index.html | line | served? |
|---|---|---|
| `favicon.svg` | 8 | yes |
| `favicon.png` | 9 | yes |
| `favicon.ico` | 10 | yes |
| `apple-touch-icon.png` | 11 | yes |
| `style.css?v=26` | 13 | yes |
| `words.js?v=26` | 327 | yes |
| `script.js?v=26` | 328 | yes |
| `index.html` | — | yes |

Total shipped payload = **133.2 KB**. Cache-buster is consistently `v=26` on all three
assets. `words.js` is loaded **before** `script.js` (correct — `script.js` reads the
global `WORD_LIBRARY` at line 21 and calls `loadWordLibrary()` at line 43).

**Not** loaded by the page but **published** by GitHub Pages (they sit in the repo
root, so they are reachable at e.g. `/docs/baseline/a11y-report.json` and
`/tools/qa/package-lock.json`): all of `docs/` (3.17 MB, 76 files) and all of
`tools/qa/` (17 files). No secrets found in them, but it is 3.17 MB of dead weight in
the published site and in `git clone`.

---

## 2. Junk, orphans, stale files

### 2.1 Definite leftovers

| file | why it is junk |
|---|---|
| `FIX-PLAN.md` (22.7 KB, 432 lines) | Historical fix plan, presented in the present tense as if current. Contains **provably false** statements: line 13 "cache-busters `?v=7` → `?v=8`" (code is at `v=26`); line 32 "Status: **plan only, nothing changed yet** (working tree is clean)"; line 29 "settings drawer is capped at **56dvh**" (actual: `style.css:183` `max-height:calc(100dvh - 150px)`); line 363 "**142 words** at the default medium difficulty across 12 categories (~12 each)" (actual: **163** medium words, 457 total). |
| `DESIGN-HANDOVER.md` (12.1 KB, 108 lines) | Describes a layout that no longer exists. Verifiable drift: line 39 "Mobile (≤ 720px)" and line 92 "Media queries: 720px (stack)" (actual breakpoints: 380/420/560/760/999/1000/1400 px); line 92 "`style.css` is 216 lines" (actual 236); line 33 "category tag pill + **timer pill**, **definition/hint text**" in the game card — there is no timer pill in the game card and no definitions anywhere; line 37 "Toast system (**bottom**)" (`style.css:145` `.toast-region{position:fixed;top:76px;...}` — it is at the **top**); line 31 brand mark "**sparkle**" (actual glyph is `✎`, `index.html:22`); line 55 "timer pill states (resting = transparent + inset line; lit = green tint)" — **this is exactly the broken rule**, see B1; line 64 "`.correct/.incorrect` flashes on the game card" — **there is no such CSS**, see B2. |
| `docs/SPELLCAST-LEVELUP-PLAN.md` (12.7 KB) | Planning doc for a v=28→v=30 pass. Line ~16 says "Bump the `?v=N` cache-bust on every shipped change (next is **v=26**)" — v=26 already shipped (commit `8b91a76`). Its "Naming" section explicitly asks for the SpellCast/SpellSprint decision this audit answers. |
| `docs/SPELLCAST-MASTER-PROMPT.md` (15.4 KB) | The orchestration prompt that spawned this audit. Same "next is **v=26**" drift. Useful as a runbook — keep, but date-stamp it. |
| `tools/qa/debug-cdp.mjs`, `debug-chain.mjs`, `debug-contrast.mjs`, `debug-experiment.mjs`, `debug-rules.mjs`, `axe-detail.mjs` | One-off scratch/debug scripts (6 files, 9.9 KB). Not referenced by `package.json` scripts or by `run-all.mjs`. |
| `docs/baseline/shots/` (66 PNGs, **3.05 MB**) | Regenerable QA output. `tools/qa/helpers.mjs:22` + `capture-matrix.mjs:124` rewrite them on every run. 3 MB of binaries committed to a repo whose root is the Pages site. |

### 2.2 Not junk — keep, but verify intent

- `.nojekyll` — required so GitHub Pages does not run Jekyll over the tree. Correct.
- `favicon.svg` + `favicon.png` + `favicon.ico` — all three are referenced
  (`index.html:8-10`). Redundant-looking but intentional.
- `docs/baseline/*.json` — QA baselines, regenerated by the harness. Useful as a
  regression reference; keep.
- `tools/qa/package-lock.json` — keep (reproducible installs).
- `tools/qa/repro-category-bug.mjs` — **untracked**, appeared during this audit
  window (the parent session is mid-investigation). Not part of the baseline; do not
  commit until the bug it describes is fixed.

### 2.3 Missing

- **No `LICENSE` file.** Confirmed: `git ls-files` contains no licence of any name.
  A public GitHub repo with no licence is "all rights reserved" by default, and
  `README.md:190` markets the project as reusable.

---

## 3. `script.js` — dead code

All claims verified with the greps shown.

### 3.1 Functions defined but never called (2)

```
$ Select-String -Path index.html,script.js,style.css,words.js,README.md,... -Pattern "findWordMeta"
script.js:54                       # definition only, 0 call sites
$ ... -Pattern "pickCategory"
script.js:357                      # definition only, 0 call sites
```

- `findWordMeta(word)` — `script.js:54-62`. Scans all categories/tiers to find a
  word's category+difficulty. Its own comment says "(used for SRS cards)" — it is not:
  SRS cards carry their own `category`/`difficulty` fields.
- `pickCategory()` — `script.js:357-360`. Random category picker, superseded by the
  round-robin deck builder `buildPool()` (`script.js:333-355`), whose own comment
  explains why per-category crowding must be avoided.

### 3.2 Dead `dom` registry entries (7)

Extracted every key of `const dom = {…}` (`script.js:182-310`) and counted
`dom.<key>` references outside the literal. Zero-reference keys:

| key | line | element | note |
|---|---|---|---|
| `dom.addWordBtn` | 208 | `#addWordBtn` | submit button; the form's own `submit` handler does the work |
| `dom.checkBtn` | 249 | `#checkBtn` | submit button; same |
| `dom.seeHint` | 240 | `#seeHint` | static text "Memorize it" |
| `dom.settingsForm` | 193 | `#settingsForm` | form never read/submitted as a unit |
| `dom.stateBanner` | 188 | `#stateBanner` | only `dom.stateBannerText` is used |
| `dom.typeHint` | 250 | `#typeHint` | static text |
| `dom.typeInstruction` | 245 | `#typeInstruction` | static text |

(The other 100 `dom` keys each have ≥1 use.)

### 3.3 Dead state

- `state.wordsSeen` — `script.js:171` declared with the comment
  *"words shown in this session, for the 'Word N of Y' chip"*. The chip was deleted in
  v=26 (commit `42d0fd7`, "single progress indicator: 12-segment deck bar replaces
  Word N chip + Word X of Y pill"). Grep result: written at `script.js:581`, reset at
  `1591` and `1642`, **read nowhere**. Verified in-browser: `state.wordsSeen.length === 0`.
- `srsStats().fresh` — `script.js:961` computes `fresh` and returns it at `962`;
  `renderSrsStats()` (`script.js:990-995`) renders only `due`, `total`, `learning`,
  `mature`. Dead field.

### 3.4 Registry inconsistency

- `#answerMirror` (`index.html:191`) is fetched with a raw
  `document.getElementById("answerMirror")` at `script.js:1534`, bypassing the `dom`
  registry. Verified in-browser: `typeof dom.answerMirror === "undefined"`.
  Every other element goes through `dom`.

### 3.5 Duplicated logic

- The "recent queue" push/trim is copy-pasted **3 times**:
  `script.js:390-391`, `421-422`, `442-444` — identical
  `push(word); if (length > state.maxRecent) shift();`. Should be one
  `pushRecent(word)` helper.
- `dom.volumeField.hidden` is written in two places that must agree:
  `setSoundToggleUI()` (`script.js:1521-1523`) and the sound-toggle click handler
  (`script.js:1754-1756`). They currently do agree, but they are two sources of truth
  for one boolean.
- The SRS card record shape is constructed in 3 places: `initSrsCard`
  (`script.js:919`), the bucket→SRS migration (`script.js:885`) and the JSON import
  (`script.js:1050-1060`). Three field lists to keep in sync.
- `dom.summaryOverlay.hidden = false/true` is manipulated directly at
  `script.js:1390`, `1958` and inside `closeSummary()` at `1397`, bypassing the
  `closeSummary()` helper in one case.

### 3.6 Magic numbers

| value | line | meaning |
|---|---|---|
| `0.75` | `script.js:407` | probability an SRS-due card is served in Mixed mode |
| `5` | `script.js:411`, `437` | weight cap in the due/bucket weighting |
| `2` | `script.js:411` | weight bump for `interval === 0` cards |
| `86400000` | `script.js:940` | ms per day |
| `10 * 60 * 1000` | `script.js:947` | 10-minute re-review delay |
| `2.3`, `1.3`, `2.8`, `0.12`, `0.2` | `script.js:919, 935, 944` | SM-2 ease constants |
| `21` | `script.js:1445` | days for "mature" |
| `30` | `script.js:159` (`state.maxRecent`) | recent-window size — the only one that is named |
| `0.06` | `script.js:1323, 1333` | volume → gain scale |
| `440/660/220/880/1108` | `script.js:1316-1339` | tone frequencies |
| `3200 / 2600 / 4200 / 1300` | `script.js:1106, 1121, 1138, 1691, 1066-1067` | toast/particle lifetimes (ms) |
| `900` | `script.js:133` | score-float animation ms (mirrored in CSS `.score-float.play`) |

Named constants already exist and are used: `BUCKET_MASTER_BONUS` (97),
`BUCKET_MIX_RATIO` (98), `PROGRESS_SEGMENTS` (1181), `CONFETTI_MILESTONES` (78),
`TIER_ALIASES` (16), `VALID_DIFFICULTIES` (997), `READY_HINT_*` (462-464).

### 3.7 Commented-out code

**None.** Every `//` comment in `script.js` is prose; no dead code blocks were found.
(Checked with a regex for comment lines containing `const |let |var |function |if |for |
dom.|addEventListener|return |await ` — all 18 hits are explanatory text.)

### 3.8 Naming inconsistency (see also §5.3)

- `script.js:2` — header comment reads `SPELLSPRINT — SCRIPT.JS`.
- `script.js:105-118` — all 14 `localStorage` keys use the `spellsprint.*` prefix.
  **These must NOT be renamed**: `DESIGN-HANDOVER.md` and
  `docs/SPELLCAST-LEVELUP-PLAN.md` both record that the prefix was intentionally kept
  so existing users keep their progress. Renaming without a migration silently wipes
  every user's high score, streak, custom words and SRS deck.

### 3.9 Data-driven gap worth flagging (not dead code)

`loadWordLibrary()` (`script.js:20-42`) populates `WORDS` and `CATEGORY_LABELS` but
**never touches the `<select>` elements**. The only code that appends `<option>`
elements is `ensureCategory()` (`script.js:813-826`), which early-returns
`if (WORDS[catKey]) return;` — i.e. it only adds **custom** categories.

Consequence: adding a 13th built-in category to `words.js` makes its words appear in
"All categories" (`CATEGORY_KEYS` includes it) but the category is **not selectable**
in `#categorySelect`, because the options are hardcoded in `index.html:60-72`.
Verified in-browser: `CATEGORY_KEYS.length === 12`, `#categorySelect` has 13 options
(`all` + 12), `#customWordCategory` has 12 — all three lists must be maintained by
hand in two different files. `words.js` is documented as "the single source of truth"
(`script.js:9`), and it isn't.

---

## 4. `style.css` — dead code

### 4.1 Selectors that match nothing (3, all verified)

Method: extracted every class selector from `style.css`, extracted every class token
from `index.html` **and** from `script.js` (including `className=`, `class="…"`,
`classList.add/remove/toggle`), then diffed.

| selector | line | grep result |
|---|---|---|
| `.header-stats` | `style.css:40` | **0 hits** in index.html, script.js, words.js |
| `.btn-secondary` | `style.css:141` | **0 hits** anywhere |
| `.btn-lg` | `style.css:143` | **0 hits** anywhere |

(Classes that look dead but are **not**, because `script.js` creates them at runtime:
`theme-normal|warm|fire|electric|rocket|legendary` (`script.js:669`),
`priority-high|medium|normal` (`script.js:1246`), `filled` / `current`
(`script.js:1203-1204`), `pulse-min` (`script.js:1208`), `streak-active`
(`script.js:1465`), `lit` (`script.js:602`), `bump` (`script.js:1078`), `play`
(`script.js:1091`), `settings-open` (`script.js:1566`), `password-mode`
(`script.js:1550`), `toast`/`toast-icon`/`toast-text`/`toast-title`/`toast-sub`
(`script.js:1096-1134`), `bucket-item*`/`category-stat-*`/`confetti-piece`
(`script.js:1163, 1241-1276`).)

### 4.2 Classes added by JS with no CSS rule (4 — dead hooks)

| class | added at | effect |
|---|---|---|
| `correct` / `incorrect` on `#gameCard` | `script.js:1081-1085` (`flashCard`), called at `1459` and `1499` | **none** — no `.game-card.correct` / `.game-card.incorrect` rule exists in `style.css` |
| `new-high-score` on `#gameCard` | `script.js:1122-1124` | **none** — no rule exists |
| `milestone` on toast | `script.js:1096` | **none** — no `.toast.milestone` rule exists |

Verified in Chrome on the real page: `getComputedStyle(#gameCard).backgroundColor` is
`rgb(255, 255, 255)` before **and** after `classList.add("correct")`. `flashCard()` is
a no-op; the "correct/incorrect flash" promised in `DESIGN-HANDOVER.md:37,64` does not
exist.

### 4.3 Classes in `index.html` with no CSS rule (9)

| class | index.html line |
|---|---|
| `phase-ready` | 171 |
| `phase-see` | 178 |
| `phase-type` | 185 |
| `phase-result` | 201, 210 |
| `custom-words-group` | 114 |
| `footer-actions` | 224 (only `.game-footer-actions` is styled) |
| `pill-icon` | 27, 32 |
| `modal-danger` | 317 |

### 4.4 Custom properties

**All 28 defined properties are used via `var()`, and every `var()` reference is
defined.** Verified by regex diffing `--token:` declarations against `var(--token)`
uses — both directions empty. Token discipline in `style.css` is good.

### 4.5 Duplicate / conflicting declarations

- **`.app` declares `height` twice** — `style.css:36`
  `height:100vh;height:100dvh;`. This is a deliberate `dvh` progressive fallback, not
  a bug, but it reads as a duplicate.
- **`.pill-timer` is silently overridden by `.pill`** — `style.css:43` vs `style.css:45`.
  Both are single-class selectors (specificity 0-1-0), so the later one wins:
  ```
  43: .pill-timer{background:transparent;box-shadow:inset 0 0 0 1px var(--line);color:var(--ink-faint);…}
  44: .pill-timer.lit{background:var(--accent-tint);box-shadow:none;color:var(--accent-strong)}
  45: .pill{display:flex;…;background:var(--accent-tint);…;color:var(--accent-strong)}
  ```
  Verified in Chrome on the real page:
  ```
  resting #headerTimerPill → bg rgb(231,240,234)  color rgb(27,67,50)  shadow inset 1px
  .lit   #headerTimerPill → bg rgb(231,240,234)  color rgb(27,67,50)  shadow none
  ```
  Expected per the code's intent: resting = `transparent` + `--ink-faint`; lit =
  `--accent-tint` + `--accent-strong`. Actual: resting is already accent-tinted, and
  `.lit` changes **nothing except removing a 1px hairline**. So (a) the resting timer
  pill is not dimmed, and (b) the "session running" `.lit` state is invisible. This
  regressed the intent of commit `221495d` ("fix(a11y): dim the resting timer pill").
  Fix: raise specificity to `.pill.pill-timer` / `.pill.pill-timer.lit`, or move the
  `.pill-timer` block below `.pill`.

### 4.6 Hardcoded colours that bypass the token system

| line | code | problem |
|---|---|---|
| `style.css:101` | `.session-chip-incorrect{…border-color:rgba(180,83,42,.1)}` | **mismatch**: `rgba(180,83,42)` = `#B4532A`, but `--incorrect` = `#A84620` = `rgb(168,70,32)`. Leftover from commit `029dbc5` ("darken `--incorrect` to #A84620"). The chip's border is a different colour from its own text. |
| `style.css:142` | `.btn-danger:hover{background:#963F1A}` | hardcoded; should derive from `--incorrect` |
| `style.css:157` | `.priority-medium{background:#C08A2E}` | hardcoded; happens to equal the `.theme-warm` accent |
| `style.css:69,136,142` | `background:#fff` / `color:#fff` | hardcoded white (no dark-mode variant) |
| `style.css:100` | `border-color:rgba(45,106,79,.1)` | duplicates `--accent` = `#2D6A4F` in raw rgba |

### 4.7 Inconsistent `hidden` handling

- `style.css:105` — `.phase[hidden]{display:none!important}` (needs `!important`)
- `style.css:160` — `.modal-overlay[hidden]{display:none}` (no `!important`)

Two different idioms for the same job. Also `.expand-panel` relies on the UA default
for `[hidden]` with no rule at all.

### 4.8 Commented-out CSS blocks

**None.** All 8 comments in `style.css` are explanatory prose.

---

## 5. `index.html`

### 5.1 Structure

- **No inline `style=` attributes** (grep: 0 hits).
- **No inline `<script>` blocks** (both script tags have `src`).
- 330 lines, well-formed, no duplicated blocks of the same id.
- All 111 `id`s are unique.

### 5.2 Missing metadata / PWA

Present: `charset`, `viewport`, `title`, `description`, `theme-color`, 4 icon links,
stylesheet link.

Missing (grep for `og:|twitter:|manifest|canonical|apple-mobile` → **0 hits**):

- No Open Graph tags (`og:title`, `og:description`, `og:image`, `og:url`, `og:type`)
  — the link will render as a bare URL in Slack/Discord/X/iMessage.
- No Twitter card tags.
- No `<link rel="manifest">` and no `manifest.webmanifest` file.
- No `<link rel="canonical">`.
- No `apple-mobile-web-app-title` / `apple-mobile-web-app-capable`.
- No `<meta name="color-scheme" content="light dark">`.
- No `og:image` asset at all (no share image in the repo).

**Meta-description accuracy:** `index.html:7` says "Works offline". There is **no
service worker** and no Cache Storage usage anywhere in the repo (grep: no `sw.js`,
no `navigator.serviceWorker`, no `caches.`). The app makes no network calls once
loaded, so it keeps working after load, but a *cold* offline visit fails. Either soften
the claim or add a service worker.

### 5.3 Product-name inconsistency

| place | text |
|---|---|
| `index.html:6,7,23` | `SpellCast` (title, description, brand) |
| `words.js:2` | `SPELLCAST — WORDS.JS` |
| `script.js:2` | `SPELLSPRINT — SCRIPT.JS` ← stale |
| `style.css:1` | `/* SpellSprint - clean rebuild */` ← stale |
| `script.js:105-118` | 14 × `spellsprint.*` localStorage keys |
| `script.js:1012` | `spellcast-export-*.json` (download filename — already migrated) |

Fix the two comment headers. **Do not touch the `spellsprint.*` keys** without a
versioned migration — see §3.8.

### 5.4 Duplicated markup

- **12 category `<option>` elements are written twice** — `index.html:60-72`
  (`#categorySelect`) and `index.html:121-132` (`#customWordCategory`). Same 12 keys,
  same order, same labels, two hand-maintained copies.
- **3 difficulty `<option>` elements are written twice** — `index.html:78-80`
  (`#difficultySelect`, with `medium` selected) and `index.html:135-137`
  (`#customWordDifficulty`, `medium` selected). The two use *different* labels
  ("Medium" vs "Med"), so they are also inconsistent.
- The `<select>` option lists, `words.js` `categories` keys and
  `script.js` `CATEGORY_LABELS` are a third copy of the same 12-item taxonomy across
  three files (§3.9).

### 5.5 Minor markup / a11y notes

- `index.html:48` — `#stateBanner` carries `aria-hidden="true"` while displaying
  visible text ("WARMING UP · 3 STREAK"). Acceptable (the streak pill is the AT
  source of truth and `announce()` covers SR users), but it means the visible text is
  invisible to assistive tech by design, not by accident — worth a comment.
- `index.html:162` — `#deckProgress` ships `aria-valuemin="0"` but no
  `aria-valuemax`; the max is injected by `script.js:1197` at runtime. Fine, but the
  HTML alone is an incomplete progressbar.
- `index.html:315` and `index.html:321` — the reset-all modal's own `aria-labelledby`
  (`#resetAllTitle`) and button are fine, but the four modal overlays do not move
  focus into the dialog on open for `summaryOverlay`/`finishOverlay` (only
  `resetSession`/`resetAll` call `.focus()`), and the three backdrop-click handlers
  (`script.js:1920, 1969, 1974`) close the dialog without restoring focus, while the
  explicit Cancel buttons do.

---

## 6. `.gitignore` / README / LICENSE

### 6.1 `.gitignore` — adequate but thin

Current contents cover `node_modules/`, `tools/qa/test-results/`,
`tools/qa/screenshots/`, `tools/qa/.playwright/`, OS/editor noise, `*.log`,
`npm-debug.log*`.

Gaps:
- No `playwright-report/`, `lighthouse-report/`, `coverage/`, `.env`, `*.tmp`,
  `.eslintcache`, `Thumbs.db` is there but `desktop.ini` is not.
- **Not obvious but important:** the QA harness writes its artifacts *directly into
  the tracked tree* — `tools/qa/helpers.mjs:21-22` creates `docs/baseline/` and
  `docs/baseline/shots/`, and `capture-matrix.mjs:124` / `a11y.mjs:266` /
  `session.mjs:187` / `fixture.mjs:55,106` / `lighthouse.mjs:44` write
  `docs/baseline/*.json`. Running the harness therefore always dirties the repo.
  That is intentional (baselines are committed) but should be documented in
  `tools/qa/README.md`, which does not exist.

### 6.2 `README.md` — several claims are wrong

| line | claim | reality |
|---|---|---|
| 32 | "**142** built-in words" | **457** words in `words.js` (166 easy + 163 medium + 128 hard, verified in-browser via `poolSize()` = 163 for the default medium pool). Also `FIX-PLAN.md:363` repeats the stale "142". |
| 92 | "Review progress (due today, deck size, **mastered count**)" | `renderSrsStats()` (`script.js:994`) renders `due`, `cards`, `learning`, `mature` — there is **no** mastered count. |
| 116-123 | file structure = `index.html`, `style.css`, `script.js`, `README.md` | omits `words.js`, `favicon.svg/.png/.ico`, `apple-touch-icon.png`, `.nojekyll`, `.gitignore`, `docs/`, `tools/qa/`. |
| 147 | "bump the `?v=N` cache-busters" (generic) | correct advice, but the current value is `v=26` and the README never says so. |
| — | no mention of `tools/qa` | the repo ships a 15-file QA harness and a committed baseline; the README doesn't mention it at all. |
| **155-173** | **"open `script.js` and find the `WORDS` object near the top. Each category has `easy`, `medium`, and `hard` arrays"** + a code block showing `const WORDS = { nouns: { easy: [...] } }` + "you'll also need to add a matching entry to `CATEGORY_LABELS`" + "add an `<option>` … in `index.html`" | **Actively wrong.** `script.js:17` is `const WORDS = {};` — an empty container filled at runtime by `loadWordLibrary()` from `words.js`. `CATEGORY_LABELS` is likewise runtime-populated from each `words.js` `label` field (`script.js:40`). The library schema is `{ e, m, h }` in `words.js`, **not** `{ easy, medium, hard }`. Following this section makes a contributor edit the wrong file with the wrong key names and the change silently does nothing. |

The README is otherwise accurate: the streak-bonus table, milestone list, theme
table, `spellsprint.*` key list, Mixed/Due-only behaviour (75% / 60%),
"mature at interval ≥ 21 days", "Reset Session keeps high score / best streak /
custom words / review deck", the `+15` recovery bonus, and the a11y notes all match
the code.

### 6.3 `LICENSE` — missing

No licence file exists. The project is deployed publicly and the README invites
reuse ("Built as a self-contained, dependency-free educational tool"). Add `LICENSE`
(MIT is the conventional fit and matches the "no attribution required, do anything"
framing of the README) and reference it from the README.

---

## 7. Prioritised proposal

Ordered lowest-risk first. **PART 1 = do now (documentation / tooling only).**
**PART 2 = needs care (touches a served path).**

### PART 1 — do now (low risk, PATH = DOC)

| id | change | why it matters | RISK | PATH |
|---|---|---|---|---|
| **A1** | Add `LICENSE` (MIT) at the repo root; add a "License" line to `README.md`. | No licence = all rights reserved by default, on a repo that is publicly deployed and advertised as reusable. One new file, zero runtime impact. | low | DOC |
| **A2** | Rewrite `README.md` §"Adding your own words" (lines 151-173) to point at `words.js` with the real `{ e, m, h }` schema, and delete the `const WORDS` code block and the "add a `CATEGORY_LABELS` entry" / "add an `<option>`" steps. | The current instructions make a contributor edit the wrong file with the wrong key names; the change silently does nothing. Highest-value doc fix in the repo. | low | DOC |
| **A3** | Correct the other README drifts: "142 built-in words" → **457** (line 32); "mastered count" → drop it from the Review-panel sentence (line 92); expand the file-structure block to list `words.js`, the 4 icon files, `.nojekyll`, `docs/`, `tools/qa/` (lines 116-123); state the current cache-buster is `?v=26` (line 147); add a short "Development / QA harness" section pointing at `tools/qa/package.json` (`npm --prefix tools/qa run all`). | The README is the front door; five specific claims are now false. | low | DOC |
| **A4** | Mark `FIX-PLAN.md` and `DESIGN-HANDOVER.md` as historical: add a banner at the top of each — "Status: superseded as of Release v=26 (2026-10). Kept for context; the live source of truth is the code." Then fix the actively-wrong lines: `FIX-PLAN.md:13,32,29,363,408-409` and `DESIGN-HANDOVER.md:31,33,37,39,55,64,92`. | Both docs are currently written in the present tense and contradict the running app on layout, breakpoints, toast position and the timer-pill / card-flash states. | low | DOC |
| **A5** | Add `tools/qa/README.md` (one page): what each script does, that it writes into `docs/baseline/`, and that re-running it dirties the tree. | The harness is undocumented and its side effects (writing into the tracked tree) surprise anyone who runs it. | low | DOC |
| **A6** | Delete or relocate the 6 scratch scripts `tools/qa/debug-cdp.mjs`, `debug-chain.mjs`, `debug-contrast.mjs`, `debug-experiment.mjs`, `debug-rules.mjs`, `axe-detail.mjs` (9.9 KB) to `tools/qa/scratch/`. | Not referenced by any `package.json` script or by `run-all.mjs`; they are one-off debugging leftovers. | low | DOC |
| **A7** | Extend `.gitignore`: `playwright-report/`, `lighthouse-report/`, `coverage/`, `.env`, `.env.*`, `*.tmp`, `desktop.ini`, `*.tsbuildinfo`. | Closes the realistic leak paths; current file only covers the three Playwright output dirs. | low | DOC |
| **A8** | Decide the fate of `docs/baseline/shots/` (66 PNGs, 3.05 MB): either keep and add a `docs/baseline/README.md` explaining they are regenerable baselines, or move them to a release/artifact location and drop them from the Pages tree. | 3 MB of regenerable binaries committed to the repo whose root *is* the published site. Low blast radius either way — it is repo-only, not a served path. | low | DOC |
| **A9** | Do **not** commit `tools/qa/repro-category-bug.mjs` (currently untracked) until the category bug it reproduces is fixed and the file is renamed to something stable. | It is a scratch reproducer created mid-investigation; committing it invites it to rot. | low | DOC |
| **A10** | Update `docs/SPELLCAST-LEVELUP-PLAN.md` + `docs/SPELLCAST-MASTER-PROMPT.md`: "next is **v=26**" → **v=27**, and record the SpellCast/SpellSprint naming decision (UI = SpellCast; `spellsprint.*` storage keys frozen without a migration). | Both are the runbooks for the next phase; both carry a stale version pointer and the naming question is now answered by this audit. | low | DOC |

### PART 2 — needs care (touches a served path)

| id | change | why it matters | RISK | PATH |
|---|---|---|---|---|
| **B1** | **Fix the `.pill-timer` cascade bug** — `style.css:43-45`. Raise specificity to `.pill.pill-timer` / `.pill.pill-timer.lit`, or move the `.pill-timer` block *below* `.pill`. | Verified in Chrome: the resting timer pill computes to `bg rgb(231,240,234)` / `color rgb(27,67,50)` instead of `transparent` / `--ink-faint`, and `.lit` is visually identical to resting except for a hairline border. The a11y dimming from commit `221495d` and the "session running" indicator are both dead. | **med** | SERVED (`style.css`) |
| **B2** | **Make `flashCard()` do something or delete it** — `script.js:1081-1085` + calls at `1459`, `1499`. Either add `.game-card.correct` / `.game-card.incorrect` rules to `style.css` (e.g. a coloured top border / ring, respecting `prefers-reduced-motion`), or remove the function and its two call sites. | Verified in Chrome: adding `.correct` to `#gameCard` leaves `backgroundColor` at `rgb(255,255,255)`. The "correct/incorrect flash" advertised in `DESIGN-HANDOVER.md:37,64` does not exist. Also removes a dead class hook. | **med** | SERVED (`script.js` + `style.css`) |
| **B3** | Remove the other two dead JS class hooks, or give them rules: `.new-high-score` (`script.js:1122-1124`) and `.toast.milestone` (`script.js:1096`). | Two more "style hooks" that do nothing; every one of them is a trap for the next person who reads the JS and assumes CSS exists. | **med** | SERVED (`script.js` + `style.css`) |
| **B4** | Delete the two never-called functions: `findWordMeta` (`script.js:54-62`) and `pickCategory` (`script.js:357-360`). | Verified 0 call sites repo-wide. `findWordMeta` also carries a comment that misdescribes its purpose. | **low-med** | SERVED (`script.js`) |
| **B5** | Delete the 7 zero-use `dom` keys: `addWordBtn` (208), `checkBtn` (249), `seeHint` (240), `settingsForm` (193), `stateBanner` (188), `typeHint` (250), `typeInstruction` (245). | They are re-resolved on every page load for nothing and hide the fact that the corresponding elements are purely decorative. | **low-med** | SERVED (`script.js`) |
| **B6** | Delete `state.wordsSeen` (declaration `script.js:171`, pushes at `581`, resets at `1591`/`1642`). | Write-only state; the comment still refers to the "Word N of M" chip that v=26 removed. | **low-med** | SERVED (`script.js`) |
| **B7** | Register `#answerMirror` in the `dom` object and use `dom.answerMirror` at `script.js:1534` instead of a raw `document.getElementById`. | The `dom` registry exists precisely so nothing reaches for the DOM directly; this is the only breach (`typeof dom.answerMirror === "undefined"`). | **low** | SERVED (`script.js`) |
| **B8** | Drop `fresh` from `srsStats()` (`script.js:961-962`) — it is never rendered. | Dead computation on every render of the review panel. | **low** | SERVED (`script.js`) |
| **B9** | Fix `.session-chip-incorrect` border: `style.css:101` `rgba(180,83,42,.1)` → derive from `--incorrect` (`#A84620` = `rgb(168,70,32)`), e.g. `rgba(168,70,32,.1)`. | The chip's border colour is a different hue from its own text — a leftover from commit `029dbc5` that darkened `--incorrect`. | **low** | SERVED (`style.css`) |
| **B10** | Replace hardcoded colours with tokens: `.btn-danger:hover{background:#963F1A}` (142), `.priority-medium{background:#C08A2E}` (157), `background:#fff` (69) / `color:#fff` (136, 142). | These are the only colour literals left outside the token system and they have no dark-mode variant, which is exactly how the `--incorrect` drift happened. | **low-med** | SERVED (`style.css`) |
| **B11** | Fix the two stale product-name headers: `style.css:1` and `script.js:2` → "SpellCast". **Do not rename the 14 `spellsprint.*` localStorage keys.** | Cosmetic-only for the two comments. The keys are load-bearing: renaming them without a migration resets every existing user's high score, best streak, custom words and SRS deck. | **low** (comments) / **high** (if the keys were touched — they must not be) | SERVED (`style.css`, `script.js`) |
| **B12** | Remove the 3 dead CSS selectors (`.header-stats` 40, `.btn-secondary` 141, `.btn-lg` 143) and the 8 dead HTML classes (`phase-ready` 171, `phase-see` 178, `phase-type` 185, `phase-result` 201/210, `custom-words-group` 114, `footer-actions` 224, `pill-icon` 27/32, `modal-danger` 317). | Verified: 0 matches / 0 rules. Removing them shrinks both served files and removes the false impression that these states are styled. | **med** (index.html + style.css must move together) | SERVED (`index.html`, `style.css`) |
| **B13** | Add the missing `<head>` metadata to `index.html`: `og:title`/`og:description`/`og:type`/`og:url`/`og:image`, `twitter:card`, `<link rel="canonical">`, `apple-mobile-web-app-title`, `<meta name="color-scheme" content="light dark">`. Create `og-image.png` (1200×630) for `og:image`. | Shared links currently render as a bare URL. Zero runtime risk; pure additive `<head>` markup. | **low-med** | SERVED (`index.html`) |
| **B14** | Resolve the "Works offline" claim in `index.html:7`: either add a minimal service worker (`sw.js` + registration) or reword the meta description to "No sign-up, no server calls". | The description is the first thing search engines and link previews show, and it currently promises something the repo does not implement — there is no service worker anywhere. | **med** (a broken SW can break the site) | SERVED (`index.html`, + new `sw.js`) |
| **B15** | Make `words.js` the single source of truth for the category list: have `loadWordLibrary()` (`script.js:20-42`) populate `#categorySelect` and `#customWordCategory` from `CATEGORY_KEYS`/`CATEGORY_LABELS`, then delete the 24 hand-written `<option>` elements from `index.html:60-72` and `121-132` (and the 3 duplicated difficulty `<option>`s at `78-80`/`135-137`, unifying "Medium"/"Med"). | Removes 27 duplicated `<option>` elements, kills a real drift trap (a 13th category in `words.js` is currently unselectable), and fixes the "Medium" vs "Med" label mismatch. **This is the largest single win in the audit but also the largest diff — do it in its own commit with a manual category-change smoke test.** | **med-high** | SERVED (`index.html`, `script.js`) |
| **B16** | Extract the 3 copies of the recent-queue push/trim into one helper `pushRecent(word)` (`script.js:390-391`, `421-422`, `442-444`); do the same for the SRS-card record literal (3 copies at `919`, `885`, `1050-1060`). | Four duplicated blocks, each a future divergence point. Pure refactor — no behaviour change intended. | **med** | SERVED (`script.js`) |
| **B17** | Name the remaining magic numbers: `0.75` (407), `86400000` (940), `10*60*1000` (947), the SM-2 ease constants (919/935/944), `21` days (1445), the tone frequencies and toast lifetimes. The file already has the pattern (`BUCKET_MIX_RATIO`, `PROGRESS_SEGMENTS`, `TIER_ALIASES`, `VALID_DIFFICULTIES`). | The scoring/SRS numbers are load-bearing for the product and currently unreviewable without reading arithmetic inline. | **low-med** | SERVED (`script.js`) |
| **B18** | Unify the `[hidden]` idiom: use one approach (e.g. `[hidden]{display:none!important}` once, globally) and delete `.phase[hidden]` (105) and `.modal-overlay[hidden]` (160). | Two idioms for the same job today; the global rule removes the `!important` from `.phase`. | **med** (a global `display:none` rule is the classic way to break a static site) | SERVED (`style.css`) |
| **B19** | Modal focus hygiene: on `summaryOverlay` / `finishOverlay` open, move focus into the dialog and restore it to the opener on close — including the backdrop-click paths (`script.js:1920, 1969, 1974`), which currently close without restoring focus, unlike the Cancel buttons. | The README claims "modals return focus to the control that opened them" (`README.md:180`); that is true for `resetSession`/`resetAll` and false for the other four close paths. | **med** | SERVED (`script.js`) |
| **B20** | Add `aria-valuemax`/`aria-valuenow` defaults to `#deckProgress` in `index.html:162` (currently only `aria-valuemin="0"`, the rest injected at runtime by `script.js:1197-1199`), and add a comment on `#stateBanner`'s `aria-hidden="true"` (`index.html:48`). | The progressbar is incomplete in the static HTML; a comment stops a future reader from "fixing" the `aria-hidden`. | **low** | SERVED (`index.html`) |

### Sequencing recommendation

1. **A1-A10** — no risk, no deploy ordering constraints. Do them in one docs commit.
2. **B9, B10, B11, B7, B8** — single-line / single-identifier changes, each independently
   revertible. Bump `?v=27` once at the end of the batch.
3. **B1, B2, B3** — the three verified *visual* bugs. Each needs a before/after
   screenshot at 375/768/1440 in light and dark; `tools/qa/capture-matrix.mjs` already
   does this. Do them before the cosmetic pass so the diffs are readable.
4. **B4, B5, B6** — pure deletions in `script.js`; grep-verify after.
5. **B12** — `index.html` + `style.css` in lockstep.
6. **B14, B15, B16, B17, B18, B19, B20** — one commit each, with a manual smoke test
   (change category → change difficulty → answer a word → skip → finish → reset session
   → reset all → export → import) before the cache-buster bump.

---

## 8. Things I could NOT verify — flagged honestly

- **Whether `spellsprint.*` should be renamed.** I did not attempt it and recommend
  against it without a migration; the repo's own plan documents make the intent
  explicit. Needs the owner's decision.
- **Whether the 66 committed baseline PNGs are wanted in the published tree.** I have
  no evidence of intent either way; A8 proposes the decision, not the answer.
- **Whether `tools/qa/debug-*.mjs` are someone's in-flight scratch work.** They are
  not referenced by any script and have no git history I inspected (the repo's history
  was not walked per-file), so A6 is proposed as "delete or move", not "delete".
- **The reported category-mismatch bug** (`tools/qa/repro-category-bug.mjs`, untracked,
  created during this audit) was **not** diagnosed — it is out of scope for a dead-code
  audit and belongs to the parent session. My §3.9 finding (a built-in category added
  to `words.js` is not selectable) is a *different* issue and is independently verified.
- **Real-device behaviour** (iOS Safari keyboard bar suppression, `-webkit-text-security`)
  was not tested — only headless Chrome at 375/768/1440 was used.

---

*Audit produced read-only. No repository file was modified, added, committed or
pushed. The only file created by this audit is `docs/AUDIT-PHASE1.md`.*
