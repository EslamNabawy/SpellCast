# SpellCast — Progress Log

Master plan: `docs/SPELLCAST-MASTER-PROMPT.md` · Feature plan: `docs/SPELLCAST-LEVELUP-PLAN.md` · Handover: `DESIGN-HANDOVER.md`
Branch policy: work on `levelup`, merge to `main` only at release boundaries after QA.

**Current phase:** Phase 0 complete → Phase 1 audit running → **stopped at GATE G1**
**Live site:** https://eslamnabawy.github.io/SpellCast/ (currently `main` @ `8b91a76`, serving `v=26`)

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

## Phase 1 — Repo audit and cleanup (GATE G1)

AUDITOR ran read-only; full report in `docs/AUDIT-PHASE1.md` (569 lines, every claim grep-verified).

### Verified bugs the audit found in the shipped code (none of these were visible in the light-theme Lighthouse run)

| id | Finding | Risk | Path |
|---|---|---|---|
| **B15** | `loadWordLibrary()` never populates the category `<select>`s — the 12 options are hand-maintained twice in `index.html`, and **a category added to `words.js` is unselectable**. "Medium" vs "Med" labels disagree. | med-high | index.html + script.js |
| **B1** | `.pill-timer` is overridden by `.pill` (equal specificity, later wins) → the resting timer pill is *not* transparent/inset as designed and `.lit` looks identical to resting. The a11y dimming and the "session running" indicator are dead. | med | style.css |
| **B2** | `flashCard()` adds `.correct`/`.incorrect` to `#gameCard`, but no such CSS exists — the "card flash" advertised in the handover does not exist. | med | script.js + style.css |
| **B3** | Two more dead class hooks: `.new-high-score`, `.toast.milestone`. | med | script.js + style.css |
| **B4–B6** | Dead code: `findWordMeta()` and `pickCategory()` (0 call sites), 7 zero-use `dom` keys, write-only `state.wordsSeen`. | low-med | script.js |
| **B9–B10** | `.session-chip-incorrect` border is a different hue from its own text; 4 hardcoded colours outside the token system, none with a dark-mode variant. | low-med | style.css |
| **B12** | 3 CSS selectors match nothing (`.header-stats`, `.btn-secondary`, `.btn-lg`); 9 HTML classes have no rule. | med | index.html + style.css |
| **B14** | The meta description promises "Works offline" — there is no service worker anywhere in the repo. | med | index.html |
| **B19** | Modals do not restore focus to the opener on the backdrop-click paths, although the README claims they do. | med | script.js |
| **B18** | Two different `[hidden]` idioms (`.phase[hidden]`, `.modal-overlay[hidden]`) instead of one global rule. | med | style.css |
| **B16–B17** | 4 duplicated blocks (recent-queue push/trim, SRS record literal) and ~10 unnamed magic numbers in the scoring/SRS logic. | med / low-med | script.js |
| **B13, B20** | Missing OG/Twitter/canonical metadata and no `og-image`; `#deckProgress` is missing `aria-valuemax`/`aria-valuenow` in the static HTML. | low-med | index.html |

### Documentation drift (no runtime risk)

- **README is actively wrong:** it tells contributors to edit `const WORDS` in `script.js` with `{easy,medium,hard}` keys — the real source is `words.js` with `{e,m,h}`, so following the README is a silent no-op. It also claims "142 built-in words" (actual **457**), lists no `words.js`/icons/`docs/`/`tools/qa`, and never states the `?v=26` cache-bust.
- **No `LICENSE`** at all → a public repo is "all rights reserved" by default.
- **`FIX-PLAN.md` / `DESIGN-HANDOVER.md`** are written in the present tense and contradict the running app (720px vs 999px breakpoint, "toast system (bottom)" vs `top:76px`, a "definition/hint" that does not exist, `?v=7→v=8`).
- `.gitignore` misses `playwright-report/`, `lighthouse-report/`, `coverage/`, `.env`, `*.tmp`.
- **The harness dirtied the tracked tree** by writing reports straight into `docs/baseline/` — fixed in this pass: artifacts now land in the git-ignored `tools/qa/test-results/`, and `docs/baseline/` is only rewritten when `QA_BASELINE=1` is set explicitly.

### Phase 1 proposal (awaiting approval)

**PART 1 — do now, zero runtime risk (documentation + tooling):** add LICENSE (MIT) · rewrite the README's word-library section to point at `words.js` and fix its false numbers · refresh the file-structure block and state the `?v=26` rule · add a QA-harness section to the README · mark `FIX-PLAN.md` and `DESIGN-HANDOVER.md` as historical with a banner + fix the actively-wrong lines · add `tools/qa/README.md` (done) · extend `.gitignore` · decide the fate of the 66 committed baseline PNGs (3 MB in the published tree) · update the two plan docs to say **v=27** and record the naming decision.

**PART 2 — touches a served path, needs care:** in the auditor's recommended order —
1. single-line/low-risk fixes: B9, B10, B11, B7, B8 (one `?v=27` bump at the end of the batch)
2. the three verified visual bugs: B1, B2, B3 (with before/after screenshots from the matrix)
3. pure deletions: B4, B5, B6
4. B12 (index.html + style.css in lockstep)
5. one commit each with a manual smoke test: B14, **B15** (largest diff — the audit's biggest single win), B16, B17, B18, B19, B20

### Gate G1 — status: **STOPPED, awaiting `APPROVE G1`**

Nothing in PART 1 or PART 2 has been executed. The only changes on `levelup` are Phase 0 (harness, baseline, this log) and the audit document itself. `main` is untouched and still serving `v=26` from `8b91a76`.

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

## Commit history (branch `levelup`)

```
bdda222  0.2b layout checks (no page scroll, no horizontal scrollbars, mobile sheet)
12c6eb3  0.3b progress log: harness evidence, 5 defects, P2 category-bug root cause
2dbb97f  0.3 baseline artifacts + runtime corrections
a145e2a  0.2 QA harness (Playwright matrix, session, fixture, axe+contrast, Lighthouse)
c2fb1da  0.1 branch levelup + .gitignore
```

`main` history (already live): `8b91a76` docs → `f240113` 26.6 → `af2363b` 26.5 → `2f603e1` 26.3 → `42d0fd7` 26.2 → `7bf3288` 26.1 → `8db0db1` handover doc
