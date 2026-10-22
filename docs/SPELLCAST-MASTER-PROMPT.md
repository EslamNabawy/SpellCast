# MASTER ORCHESTRATION PROMPT — SpellCast (a.k.a. SpellSprint): cleanup, fixes, redesign, level-up

You are the **ORCHESTRATOR** for this repo (a static spelling web app deployed on GitHub Pages from `main`; files like `index.html`, `style.css`, `script.js`). If you can spawn sub-agents, use four roles: **AUDITOR** (read-only analysis), **ENGINEER** (implements), **DESIGNER** (specs, mocks, tokens), **QA** (verifies). If you can't, play the roles sequentially. Only the ORCHESTRATOR commits and pushes.

**Inputs:** `DESIGN-HANDOVER.md` and `SPELLCAST-LEVELUP-PLAN.md` (read both first; if missing, ask me for them). The plan file is the source of truth for the v=28–v=30 details. This prompt adds sequencing, bug fixes and gates.

---

## 0. GLOBAL RULES (apply to every phase)

**Non-negotiable**
- The live site must keep working at every push. GitHub Pages serves from `main`. Do NOT move or rename files the page loads without updating every reference and verifying the deploy.
- Keep every `spellsprint.*` localStorage key and its stored shape working. Any schema change needs `spellsprint.schemaVersion` plus a tested migration. Never reset user progress.
- Keep DOM ids referenced by `script.js`, and the keyboard flow (Enter to check, Esc to skip, no-paste guard, autofill tricks), unless a task explicitly changes them. If it does, update every reference in the same commit.
- WCAG AA in light AND dark; no page scroll on desktop; Lighthouse stays 1/1/1; no framework, no build step, no new runtime dependencies; one webfont family max (subset woff2, `font-display: swap`) or the system serif.
- Respect `prefers-reduced-motion` for every animation. Never convey state by color alone.
- Bump the `?v=N` cache-bust ONCE per shipped release (next is **v=26**).

**Process**
- Work on branch `levelup`; merge to `main` only at release boundaries, after QA passes.
- One task = one commit, with the task ID as a prefix (for example `P2.3 single settings source of truth`).
- Maintain `docs/PROGRESS.md`: phase, task checklist, decisions, open questions, commit hashes, risks. Update it after every task.
- After pushing, `git push` may exit 1 from cosmetic stderr noise. Check the output for the updated ref, wait about 90 seconds, then verify the live Pages site.
- If any assumption doesn't match the code, or a task is riskier than described, **STOP and ask**. Never guess.
- **GATES:** at every gate, post a short summary (what changed, evidence, risks, what's next), write it to `PROGRESS.md`, then STOP and wait for me to reply `APPROVE <gate>`. Do not continue without it.

---

## PHASE 0 — Safety net and harness (no product changes)

- **0.1** Create branch `levelup`. Add `.gitignore` if missing.
- **0.2** Build a repeatable QA harness in `tools/qa/` (Playwright, dev-only, NOT served):
  - a) Screenshot matrix: 375 / 768 / 1440 px × light / dark × states (idle "Ready?", word reveal, typing, correct, incorrect, session summary, Bucket, Categories, My Words, any dialogs).
  - b) Scripted full session (start, correct, incorrect, skip, finish, open Bucket/Categories, toggle theme, change every setting) that fails on any console error.
  - c) A localStorage fixture captured from the CURRENT app (progress, bucket, custom words, settings), plus a test that loads it and asserts nothing is lost or reset.
  - d) A Lighthouse run and an AA contrast check (axe) in both themes.
- **0.3** Run it and save baseline artifacts in `docs/baseline/`. List runtime details the handover didn't verify (event names, import/export edge cases) and correct the handover.
- Report. No gate needed unless something alarming is found.

---

## PHASE 1 — Repo audit and cleanup (GATE G1 before executing)

**AUDITOR (read-only):**
- Print the tree and file sizes.
- Find unused, orphaned, duplicate, backup, scratch and large files, and anything that shouldn't be committed.
- In `script.js` and `style.css`, find dead code, unused selectors/functions, commented-out blocks, duplicated logic, magic numbers and inconsistent naming.
- Check `index.html` for leftover tags, inline styles/scripts, missing meta/OG tags, and the SpellCast vs SpellSprint naming.
- Check `.gitignore`, README and LICENSE.
- Output a prioritized proposal with a risk rating (low/med/high) per item. Mark anything touching served paths as high risk.

**→ GATE G1: stop for approval.**

**After approval, ENGINEER executes, lowest risk first, one commit per change:**
1. `.gitignore` and junk removal.
2. Delete confirmed-unused files and dead code.
3. Move non-served material to `docs/` and `tools/`.
4. Section-organize `style.css` (tokens, base, layout, components, states, themes, responsive). Keep the cascade order so rendering doesn't change.
5. Section-organize `script.js` (config, storage, state, SRS, rendering, handlers, init). No module conversion and no load-order change.
6. `README.md`: what it is, run locally, deploy by push to `main`, cache-bust rule, localStorage keys, folder layout.
7. `docs/ARCHITECTURE.md`: files, data flow (pool → bucket → mastery), storage schema.

**QA:** before/after screenshots must be visually identical; scripted session clean; fixture loads; Lighthouse 1/1/1. Release as `v=26-cleanup` only if any served asset changed.

---

## PHASE 2 — Settings integrity + confirm-before-disrupting (release v=26, part 1)

**Known bug (from my screenshots):** changing Category doesn't change the session. The Category select said "Commonly misspelled" while the card label said "NOUNS", so the control, the label and the word pool are out of sync. Verify Difficulty, Review mode and Show for too.

- **P2.1** Reproduce with Playwright and record, per setting, in idle and mid-session states: control value, card label, the pool actually used for the next word, and localStorage contents. Report disagreements.
- **P2.2** Find the root cause. Candidates: the handler updates only the label; the pool is built once and cached; a stale value is restored from localStorage over the control (or vice versa); two sources of truth; a wrong or duplicated id; the change event not firing.
- **P2.3** Fix it structurally. ONE `settings` object is the single source of truth. Controls only call `setSetting(key, value)`, which validates, updates state, persists, rebuilds the pool, and re-renders every place the setting is shown. On load, render controls FROM persisted state.
- **P2.4** Confirm flow.
  - Settings that affect a session: Category, Difficulty, Review mode, Show for. Sound, Volume and theme never prompt.
  - If idle (nothing answered, no word on screen), apply instantly.
  - If a session is in progress, intercept BEFORE applying and show a dialog:
    - Title: "Change {setting} to {value}?"
    - Body: "This will end your current session ({n} answered, {x}% correct). {Your progress so far is saved / will be lost}."
    - Buttons: **[Keep current session]** (default focus, cancel) · **[Finish session & switch]** (same as Finish, then apply) · **[Discard & switch]** (same as Reset session, then apply).
  - First inspect what Finish and Reset actually do to stats, streak and SRS so the copy is accurate. If answers are already recorded per word, simplify to two buttons.
  - Cancel / Esc / backdrop REVERT the control to its previous value with no flicker or state change.
  - Dialog requirements: `<dialog>` or `role="alertdialog"` with `aria-labelledby` / `aria-describedby`; focus trapped and returned; game key handlers suspended (Enter/Esc must not check or skip); session clock paused; bottom sheet on mobile; reduced-motion respected.
  - Also confirm "Reset session" ("Reset this session? {n} answers will be discarded.") and "Delete all data" (strong: require typing DELETE and list exactly what is removed).
  - Build one reusable `confirmAction({title, body, actions})` returning a promise, and reuse it later for import, restore and early finish.
- **P2.5** Playwright regression tests:
  - For each setting, the control, label, next word's pool and localStorage agree, including after reload.
  - An idle change applies instantly; a mid-session change shows the dialog.
  - Each button does exactly what it says; cancel reverts.
  - Enter inside the dialog never submits an answer; the clock pauses; the fixture still loads.

---

## PHASE 3 — Quick wins (release v=26, part 2)

First VERIFY which of these are already done (my latest screenshot shows a "Show word" start state, the header reduced to streak + time, 12 progress pips, and "Delete all data" separated), then do only what's left.

- **P3.1** One home per stat. Header: streak + session clock. Right panel: score, best, accuracy. No metric appears twice. Label the clock ("Session 0:00").
- **P3.2** Start state + reveal: explicit "Show word" (Enter to start); a countdown ring/line during the reveal matching Show for; one progress indicator (12 pips) and no duplicate word counters; consistent "Word N of 12".
- **P3.3** Fix sidebar horizontal overflow (missing `min-width: 0` / fixed width); thin, subtle scrollbars; My Words reachable.
- **P3.4** Disable and dim Volume when Sound is Off.
- **P3.5** Button hierarchy: Check is the single most prominent button; Finish becomes a quiet outline/text button with a "Finish session?" confirm when words are pending (reuse `confirmAction`).
- **P3.6** Microcopy: "Missed words come back in 10 minutes. Words you know come back in days."
- **P3.7** Feedback beyond color: icon + short text ("Correct" / "Not quite") + `aria-live`.

**→ QA, then ship v=26 to `main` and verify the Pages deploy. (GATE G2: my sign-off on v=26 before Phase 4.)**

---

## PHASE 4 — Visual redesign: spec and mock only (GATE G3)

**Diagnosis to fix:**
- No focal point (the sidebars outweigh the stage).
- Three identical bordered cards (dashboard-template look).
- Native `<select>` controls.
- Too many uppercase letter-spaced labels.
- Empty bordered stat boxes.
- The beige strip and wide bottom buttons look like debug chrome.
- A flat single palette with no accent, depth or motion.

**DESIGNER produces** `docs/VISUAL-REDESIGN.md` plus a static mock `docs/mock.html` (idle, reveal, typing, correct, incorrect with spelling diff, session summary, Session setup sheet, Bucket; light + dark at 1440 and 375). The spec must define:

- **Layout:** a centered stage (~720 px) as the ONLY elevated "paper" surface. Setup moves into a Session setup sheet/popover (What to practice: New/Due/Mixed · Category · Difficulty · Show for). No side cards. Stats as one borderless row of large numerals (score · best · accuracy) plus Due with a "Review now" action.
- **Type scale:** reveal word 72–96 px serif; "Ready?" ~44 px; body 16–18 px; input ~28 px underline-style; sentence-case 12–13 px muted labels (remove most uppercase tracking).
- **Controls:** custom segmented controls and a category chips/popover with word counts; no native selects; all states defined.
- **Color:** keep forest-green primary; add ONE warm accent (amber/terracotta) for streak and highlights; correct = green, incorrect = terracotta, always with icon + text; dark theme designed as its own theme.
- **Materials:** layered soft shadows, 8 px spacing scale, radius scale (controls 12 / stage 24); optional subtle paper grain only if under 2 KB and it passes performance.
- **Motion tokens (150–250 ms):** reveal fade/scale with a shrinking countdown, correct tick, gentle shake on incorrect, score count-up; all off under reduced-motion.
- **Header:** simplified, inline-SVG mark replacing the pen glyph; streak + session time.
- **Bottom bar:** Bucket and Categories as lightweight tabs/chips; Finish as a quiet text button.
- **Vocabulary:** New → Learning → Mastered + Due, one word for the review list, and one function that derives all counts.

**→ GATE G3: stop for my approval of the mock and spec.**

---

## PHASE 5 — Implement redesign + clarity features (release v=27)

Small commits, one component each: tokens → layout → controls (custom, wired through `setSetting` / `confirmAction`) → stage + pips → feedback states → stats row → dark theme → motion → logo. Then:

- **P5.1** Unified vocabulary and a single source of truth for counts. Bucket count, Due and status counts must always reconcile (known bug: Bucket 3 vs "13 cards · learning 10" vs "10 due"). Map from the existing SRS state in the UI layer; do NOT change stored data this release. A help popover explains the criteria.
- **P5.2** Spelling diff on incorrect answers (differing letters highlighted AND underlined, not color-only).
- **P5.3** Actionable session summary: missed words, words moved into the Bucket, accuracy vs the last session; buttons **Review missed now** · **Next category** · **Back to setup**.
- **P5.4** First-run onboarding: 3 skippable steps (drill → Bucket → mastery), re-openable from a "?", with useful empty states.
- **P5.5** Timer stages (calm → warning → urgent) where a per-word limit exists, plus a relaxed no-timer mode.
- **P5.6** Difficulty switch preview (word counts and your progress per level; remember per category).

**QA:** full matrix vs baseline (expected diffs only), AA in both themes, keyboard-only run, screen-reader check of feedback/progress, fixture still loads, Lighthouse 1/1/1. Ship v=27.

**(GATE G4: my sign-off.)**

---

## PHASE 6 — Remaining releases (per `SPELLCAST-LEVELUP-PLAN.md`), each starting with its own gate

- **v=28 Progress and motivation:** mastery dashboard (ring per category, "N due → Review now", totals by status); ONE gamification element (daily goal ring + streak; I'll confirm the unit, words vs minutes, at the gate); session modes (Quick 5, Review due, Weak words); optional "Show again" with a score cost (ask me).
- **v=29 Data safety:** `schemaVersion` + migration runner tested from every previous shape; My Words manager (add form, bulk paste, CSV/JSON import with preview and per-row errors, edit/delete); export with a "last backup" date and a stale reminder; import restore with confirm and a change summary (use `confirmAction`).
- **v=30 Polish/platform:** dark-mode refinement, motion budget, `aria-live` and focus audit, consistent inline-SVG icons, pronunciation via speech synthesis with a feature check and fallback, PWA (manifest + service worker with a deliberate update flow replacing the manual `?v=N`), Open Graph tags and share image, font budget.

Before each of these, post the task list and any open questions, and wait for `APPROVE v=NN`.

---

## QA CHECKLIST (every release)

- [ ] Lighthouse 1/1/1.
- [ ] AA in both themes, including muted and disabled text.
- [ ] No desktop page scroll at 1280×720, 1440×900 and 1920×1080.
- [ ] No horizontal scrollbars anywhere.
- [ ] Keyboard-only full session and dialogs.
- [ ] 375 px mobile usable one-handed; nothing clipped.
- [ ] Previous-version localStorage fixture loads intact.
- [ ] Reduced-motion respected.
- [ ] Screen reader announces correct/incorrect and progress.
- [ ] `?v=N` bumped.
- [ ] Live Pages site verified.

---

## FINAL REPORT (end of each release)

Final tree; everything added, changed, deleted or moved; what you chose NOT to touch and why; test evidence (links to screenshots/logs); metrics vs baseline (time per word, Lighthouse); risks and follow-ups.

---

**START NOW:** do Phase 0, then Phase 1's audit, then stop at GATE G1.
