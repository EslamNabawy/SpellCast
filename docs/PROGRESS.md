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

AUDITOR ran read-only; findings in `docs/AUDIT-PHASE1.md`. Execution is blocked until `APPROVE G1`.

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
c2fb1da  0.1 branch levelup + .gitignore
a145e2a  0.2 QA harness (Playwright matrix, session, fixture, axe+contrast, Lighthouse)
2dbb97f  0.3 baseline artifacts + runtime corrections
```

`main` history (already live): `8b91a76` docs → `f240113` 26.6 → `af2363b` 26.5 → `2f603e1` 26.3 → `42d0fd7` 26.2 → `7bf3288` 26.1 → `8db0db1` handover doc
