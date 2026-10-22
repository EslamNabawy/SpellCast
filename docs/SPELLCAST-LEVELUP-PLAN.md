# SpellCast — Level-Up Plan (UI/UX + Product)

**Audience:** the coding agent and/or designer working on the app.
**Inputs:** a screenshot audit of the live app plus `DESIGN-HANDOVER.md`.
**Goal:** make the answer → check → next loop faster and more satisfying, make progress legible, and make the app trustworthy with a user's data. Do not make it merely prettier.

---

## 0. Ground rules (apply to every release)

**Non-negotiables (from the handover)**
- WCAG AA contrast in both light and dark themes.
- No page scroll on desktop.
- Keyboard-first flow stays intact (Enter to check, Esc to skip, no-paste guard, autofill tricks).
- Existing `spellsprint.*` localStorage keys keep working. Any schema change ships with a version key and a migration, and old progress must never reset.
- Class-driven game states remain the mechanism for state changes.
- Bump the `?v=N` cache-bust on every shipped change (next is **v=26**).
- Lighthouse stays at 1/1/1.

**Naming**
- The UI shows **SpellCast**. The handover and storage keys say SpellSprint.
- Decide on one product name, update `DESIGN-HANDOVER.md` to match, and keep the `spellsprint.*` keys unchanged (rename only with a migration).

**Definition of done for each release**
1. All tasks in the release meet their acceptance criteria.
2. The QA checklist in section 9 passes.
3. `DESIGN-HANDOVER.md` is updated for anything that changed.
4. It is committed, pushed to `main`, and verified on GitHub Pages after about 60–90 seconds.

---

## 1. Phase 0 — Baseline (do first, about half a day)

The handover was written from static code reading, so validate it against the running page.

- [ ] Use Playwright to capture screenshots at **375, 768 and 1440 px**, in **light and dark**, for each state: idle, word reveal, typing, correct, incorrect, session summary, Bucket tab, Categories tab, My Words.
- [ ] Record Lighthouse scores (Performance / Accessibility / Best Practices / SEO).
- [ ] Time one full answer → check → next loop and note it as the baseline.
- [ ] List runtime details the handover did not verify (exact event names, import/export edge cases) and correct the handover where it is wrong.
- [ ] Save the screenshots and notes in `docs/baseline/`.

---

## 2. Findings → fixes map

| ID | Finding (from the screenshot) | Fix | Release |
|----|------------------------------|-----|---------|
| F1 | Score, streak, best and accuracy appear in both the header pills and the right Stats panel | Single home per metric; reuse the freed panel for mastery and due-review | v=26 |
| F2 | "Bucket 4", "13 cards · learning 9 · mature 0" and "12 due" don't reconcile, and the vocabulary is Anki jargon | One vocabulary and one source of truth for counts | v=26 (copy), v=27 (model) |
| F3 | Idle state says "YOUR TURN / Type what you saw" before a word is shown; "Word 0" and "Word 1 of 12" disagree; two progress readouts | Explicit Start state, reveal countdown ring, single 12-segment progress bar | v=26 |
| F4 | Left sidebar has both a vertical and a horizontal scrollbar; My Words is cut off | Fix overflow bug; later move setup out of play | v=26 / v=27 |
| F5 | **Finish** is the heaviest button and competes with Check; **Reset all** sits next to Reset session | Demote Finish with a confirm; move Reset all into settings with a confirm | v=26 |
| F6 | Review "Mode" dropdown sits in the Stats panel and overlaps Category/Difficulty | One "What to practice" control | v=27 |
| F7 | Inconsistent icons, unlabeled `31:33` clock, borderline-contrast grey helper text, flat visual hierarchy, heavy scrollbars | Polish pass | v=26 / v=30 |
| F8 | Handover weaknesses: no onboarding, opaque mastery, dead-end summary, utilitarian My Words, blunt difficulty switch, binary timer, color-only feedback | See releases below | v=26–v=29 |

---

## 3. Release v=26 — Quick wins (no new features)

**26.1 One home for each stat (F1)**
- Header keeps only **streak** and the **clock**. Score and accuracy live in the right panel (best too, as a secondary line).
- *Accept:* no metric is displayed in two places at the same viewport.

**26.2 Clear start state and single progress indicator (F3)**
- Before the first word: show a primary **Start** (or "Show word") button. Hide "YOUR TURN" and the input until a word has been revealed, or clearly disable them.
- During the reveal: a countdown ring around the "?" matching the **Show for** setting.
- Replace "Word N · X correct · Y incorrect" and the "Word 1 of 12" pill with **one** 12-segment progress bar plus small correct/incorrect counts.
- *Accept:* a new user can tell what to do within 2 seconds; numbering is consistent everywhere.
- *Note:* first check how the current code triggers the reveal, because an auto-start may need a short "ready" beat instead of a button.

**26.3 Fix sidebar overflow (F4)**
- Find the child that forces horizontal overflow (likely a fixed width, or flex/grid children missing `min-width: 0`). Remove the horizontal scrollbar entirely.
- Restyle the remaining vertical scrollbar thin and subtle.
- *Accept:* no horizontal scrollbar at 1280, 1440 or 1920 px; My Words is reachable.

**26.4 Sound controls**
- Disable or hide **Volume** while **Sound** is Off.

**26.5 Button hierarchy and destructive actions (F5)**
- **Finish** becomes an outline/ghost button. If words are still pending, show "Finish session?" with confirm and cancel.
- Move **Reset all** out of the primary controls into a settings area and require a confirmation step.
- *Accept:* Check is the single most prominent button in the game card.

**26.6 Microcopy**
- Replace "Add words. Forgotten → 10 min. Remembered → days." with: *"Missed words come back in 10 minutes. Words you know come back in days."*
- Label the header clock (for example "Session 31:33"), and add a tooltip.

**26.7 Feedback beyond color**
- Add an icon and a short text ("Correct" / "Not quite") to the feedback state, in addition to color.
- *Accept:* feedback is understandable in grayscale and with a screen reader (`aria-live`).

---

## 4. Release v=27 — Clarity of progress and learning

**27.1 One vocabulary (F2)**
- Define and use consistently: **New → Learning → Mastered**, plus **Due**.
- Map these from the existing SRS state in the UI layer; do **not** change stored data in this release.
- Decide what "Bucket" means (the user's review list) and use that single word everywhere, or rename it. Remove "cards" and "mature" from the UI.
- Show the criteria in a short help popover (for example "Mastered = remembered across N reviews spanning M days").
- *Accept:* the Bucket count, Due count and status counts are derived from the same function and always reconcile.

**27.2 Merge "what to practice" (F6)**
- Combine Category, Difficulty and Review mode into one **Session setup** (a panel or popover) with: *What to practice* (New / Due / Mixed), *Category*, *Difficulty*, *Show for*.
- During play the sidebar collapses to essentials (Sound, Volume, Pause/Reset).
- *Accept:* no setup scrolling during play; the setup step shows counts per option ("Medium · 120 words · 18 learned").

**27.3 Spelling diff on incorrect answers**
- Show the correct word with the differing letters highlighted, next to what the user typed.
- *Accept:* the diff is also conveyed without color (underline or bracket), and respects reduced motion.

**27.4 Actionable session summary**
- Replace the dead end with: words missed, words moved into the Bucket, accuracy compared with the previous session, and buttons **Review missed now**, **Next category**, **Back to setup**.

**27.5 First-run onboarding**
- Three steps: drill → Bucket → mastery. Skippable, shown once, re-openable from a "?" icon.
- Give the Bucket and stats panels useful empty states.

**27.6 Timers**
- Replace the binary timer with stages (calm → warning → urgent) where a per-word limit exists.
- Add a **relaxed (no timer)** option.
- *Accept:* nothing relies on color alone; warnings respect `prefers-reduced-motion`.

**27.7 Difficulty switch**
- Preview word counts and the user's progress per level before switching, and remember the choice per category.

---

## 5. Release v=28 — Progress and motivation

**28.1 Mastery dashboard (right panel)**
- A progress ring per category, a "**N due → Review now**" call-to-action, and totals by status (New / Learning / Mastered).

**28.2 One gamification element (not three)**
- A **daily goal ring plus streak**, stored locally.
- Open decision (section 7): the goal unit, either words or minutes.

**28.3 Session modes**
- **Quick 5**, **Review due**, **Weak words** (lowest accuracy).

**28.4 Optional: replay**
- A "Show again" button for the reveal, with a small score cost.
- Decide in section 7 whether this fits the game.

---

## 6. Release v=29 — Data safety and My Words

**29.1 Schema versioning**
- Add `spellsprint.schemaVersion` and a migration runner. Test migrations from every previous shape.

**29.2 My Words manager**
- Add-word form, bulk paste, and CSV/JSON import with a **preview and a per-row error list** before commit.
- Show duplicates and invalid rows clearly. Provide an edit and delete list.

**29.3 Export and backup**
- One-click export of all progress (JSON). Show a "**last backup**" date and a gentle reminder when it is stale, because localStorage can be cleared by the browser.
- Import restores with a confirm and a summary of what will change.

---

## 7. Release v=30 — Polish and platform

- **Dark mode identity:** make it a designed theme, not an inverted light theme (surface layering, accent tuning). Re-verify AA.
- **Motion budget:** define durations and easings as tokens; honor `prefers-reduced-motion` everywhere.
- **Accessibility:** `aria-live` for feedback and progress, visible focus rings, correct labels on all controls, tested with a screen reader.
- **Icons:** one consistent inline-SVG icon set replacing emoji and mixed glyphs.
- **Visual hierarchy:** lighten sidebar and Stats card borders and shadows so the game card is clearly dominant.
- **Pronunciation:** add speech synthesis for the word after answering, if not present. Include a feature check and a fallback.
- **PWA:** manifest and service worker for install and offline. Handle cache-busting deliberately (the service worker will replace the manual `?v=N` approach, so plan the update flow).
- **Sharing:** Open Graph tags and a share image.
- **Fonts:** if adding a webfont, subset one family and respect the performance budget.

---

## 8. Open design questions (resolve before v=28)

1. Where should the daily goal and streak live (header vs right panel)?
2. Game column width, and how much room the sidebars should take at 1280 px.
3. Daily goal unit: words or minutes?
4. Should "Show again" exist, and what should it cost?
5. Dark mode identity: what accent and surface treatment?
6. What does "Mastered" require (reviews and days)?
7. Final product name and logo treatment (SpellCast vs SpellSprint).

---

## 9. QA checklist (every release)

- [ ] Lighthouse 1/1/1 on desktop and mobile.
- [ ] Contrast AA in both themes, including helper text and disabled states.
- [ ] No desktop page scroll at 1280×720, 1440×900 and 1920×1080.
- [ ] No horizontal scrollbars anywhere.
- [ ] Keyboard-only run through a full session (Enter, Esc, Tab order, focus visible).
- [ ] Mobile 375 px: drawers and setup usable one-handed; nothing clipped.
- [ ] Existing localStorage data from the previous version loads and progress is intact.
- [ ] Reduced-motion setting disables non-essential animation.
- [ ] Screen reader announces correct/incorrect and progress changes.
- [ ] `?v=N` bumped and the deployed page confirmed on GitHub Pages.

---

## 10. Success metrics (tracked locally, no analytics)

- Median time per word (answer → check → next).
- Share of started sessions that finish.
- Return visits within 7 days (streak days).
- Words reaching Mastered per week.
- Lighthouse and AA status unchanged or better.

---

## 11. Working rules for the agent

- Small commits, one task per commit, with the task ID in the message (for example `26.3 fix sidebar overflow`).
- Do not change anything outside the current release scope.
- Update `DESIGN-HANDOVER.md` when behavior, DOM ids, tokens or constraints change.
- Keep DOM ids referenced by `script.js` stable unless the task explicitly changes them, and update the references in the same commit.
- After pushing, confirm the ref updated (`git push` may exit 1 on cosmetic stderr noise, so check the output) and verify the Pages build.
- If a task's assumption doesn't match the code (for example the reveal flow in 26.2), stop and report rather than guessing.
