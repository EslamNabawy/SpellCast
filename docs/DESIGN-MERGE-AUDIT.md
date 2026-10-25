# DESIGN-MERGE-AUDIT — ui/merge-new-design

Step 0 deliverable of the merge task ("Merge the new SpellCast UI/UX into the ORIGINAL app, then enhance it").

* Golden rule: behavior/data → original repo wins; look/layout/interaction patterns → reference wins.
* Reference = `C:\Users\eslam\Downloads\spellcast-dashboard (5).html` (standalone demo, 331 lines).
* Original = this repo (`index.html` + `style.css` + `words.js` + `script.js`), hosting via GitHub Pages, cache-bust `?v=N` ×3 refs, no service worker.

## 1. Original audit (facts every merge edit must respect)

### 1.1 Storage (all real keys — note: `spellcast.*`, not `spellsprint.*` as the task text/handover say)
`spellcast.schemaVersion, highScore, bestStreak, totalLifetimeWords, lifetimeCorrect, preferredCategory, preferredDifficulty, preferredDuration, soundEnabled, soundVolume, ttsAuto, bucket, customWords, srsCards, reviewMode, chunkWords, darkMode` (LS_KEYS, script.js L101-118). All access is type-guarded (`loadBoolSafe/loadNumberSafe/loadTextSafe/loadBucketSafe/loadCustomSafe/loadSrsSafe/loadChoiceSafe` — v=41 boot guard). **Deviation note:** the task says `spellsprint.*` — the real namespace is `spellcast.*`; no migration needed, keys stay as-is.

### 1.2 DOM ids JS queries (never rename; grep'd)
Header/banners: headerStreak, headerStreakPill, headerTimerPill, stateBannerText.
Controls: settingsToggle, settingsPanel, categorySelect, difficultySelect, durationSelect, reviewModeSelect, soundToggle, ttsToggle, chunkToggle, volumeField, volumeSlider, themeToggle, themeIcon, themeLabel.
Center: gameCard, segmentRow, sessionCorrectCount, sessionIncorrectCount, categoryTag, difficultyTag, sessionTimer, scoreFloat, phaseReady, startBtn, readyHint, phaseSee, wordDisplay, spellTray (v=43), timerFill, timerCaption, seeAdvanceBtn, sayBtn, spellBtn, phaseType, answerForm, answerInput, answerMirror, checkBtn, skipBtn, phaseCorrect, correctHeadline, correctWordEcho, correctPoints, masteredNote, nextAfterCorrectBtn, phaseIncorrect, incorrectCorrectWord, incorrectYourAnswer, streakTransitionNote, nextAfterIncorrectBtn, backAfterIncorrectBtn, finishSessionBtn, toastRegion.
Right deck: statScore, statStreak, statBest, statAccuracy, reviewModeToggle, srsStats, bucketToggle, bucketPanel, bucketCount, bucketList, bucketEmptyHint, categoryStatsToggle, categoryStatsPanel, categoryStatsList, categoryStatsEmptyHint.
Data page: dataPage, dataClose, dataOpen, dataOpen2, dataStats, dataTitle, wordSearch, dataWordCount, dataCategoryList, addWordForm, addWordBtn, customCountBadge, customWordInput, customWordCategory, customWordDifficulty, customWordError, newCategoryInput, createCategoryBtn, practiceMineBtn, customWordsList, importPick, importPickBtn, importPaste, importParseBtn, importResult, importCategory, importCopyBtn, importExample, import-fmt-chip (class), exportBtn, importBtn, importFile, resetSessionBtn, resetAllBtn, drawerWordsHint.
Modals/system: actionDialog (+DialogTitle/Body/Require/RequireLabel/Input/Actions), summaryOverlay (+Score/Accuracy/BestStreak/HighScore/WordsPracticed/BucketAdds/Strongest/Weakest/CloseBtn/NewSessionBtn), srAnnouncer, confettiLayer.

### 1.3 JS class/attribute mechanisms
- `body.theme-(normal|warm|fire|electric|rocket|legendary)` — applyStreakTheme (L887-904) driven by `themeForStreak()`; `#stateBannerText` shows "LABEL · N STREAK". Dark mode toggles via `html[data-theme]`-style mechanism through themeToggle/themeIcon/themeLabel (keep; the reference's `[data-theme="dark"]` maps onto it).
- phase-parked (phaseType), kb-compact (phase), gameCard correct/incorrect/new-high-score, is-running (sessionTimer), lit (headerTimerPill), streak-active (headerStreakPill), bump() micro-bounce, play (scoreFloat), .seg ×12 with is-correct/is-incorrect/is-empty, .cur on spellTray spans, password-mode, body.settings-open, body.dialog-open, data-del, .import-fmt-chip aria-pressed + dataset.fmt, import-copy-ok, [data-open-data], .deck-right .session-group re-order (L2910), actionDialogInput.dataset.expect, btn.dataset.actionId.
- Segment sync: renderSegments/updateSegments read `answerHistory` into `.seg` classes + set `aria-label` on `#segmentRow` (~L1869-1884). Session length = real `state.answerHistory` (12 segments).
- Key fns: buildPool 389, buildCustomPool 382, MINE_KEY `__mine__` 379, setPhase 553, keepAnswerInputVisible ~580, checkAnswer 859, startSessionTimer 825, openDataPage 1320, closeDataPage 1337, announce 1835, renderSegments ~1869, renderBucketPanel 1911, renderCategoryStats 1944, recordCategoryStat 1971, speakWord/spellWordOut/cancelSpeech ~1988-2033, resetSession 2469, setSetting 2315, applySettingsToForm 2388, confirmAction 2570.
- Session loop: reveal (startBtn/startSession) → see phase (timer = `preferredDuration`, rAF-driven `runSeeTimer` with overlay hold) → type phase (Enter submit / Esc skip-bucket) → checkAnswer → correct/incorrect result phase → next. Scoring/SRS untouched by the merge.

### 1.4 Fonts
Local preloads already ship **Plus Jakarta Sans var + Outfit var** — the reference's font (PJS) is already in place; no font work needed.

## 2. Mapping table (reference → original)

| Reference (demo) | Original element / function | Note |
|---|---|---|
| `#app`, `.top`, `.main` grid | `.app`, `header.header`, `.deck ×2 + .center` | regrid proportions `minmax(300px,356px) 1fr minmax(300px,358px)` |
| bg layer (blobs b1-b5, waves, dots, orbs) | none — NEW `.bg` fixed layer insert as first child of body | aria-hidden, contain strict |
| `#logo` svg (white S + sparkle tile) | `.brand-mark` (currently wand icon) | same fa via sprite |
| tagline, streak pill, time pill, `#th` theme btn | `.brand` + tagline NEW copy; `.status-group` pills (#headerStreak/#headerTimerPill), themeToggle | copy additions allowed |
| `.card` glass system | `.deck`s, `#gameCard`, `#dataPage` cards; `.card` class added via wrappers | prefer ADD classes |
| `.hd` panel headers | `.deck-title` h2 (left/right) + subtitles "Customize your session"/"Track your progress" NEW | allowed copy |
| `.fld` wrap + leading icon + chevron | `.field` → same `<select>` (category/difficulty/duration/reviewMode) | wrap, don't rename |
| `.sw` switches (no On/Off text) | chunkToggle/soundToggle/ttsToggle rows (`.toggle` role switch, `.toggle-track`/`.toggle-thumb`, visible state text removed visually, aria keeps) | accessible text via sr-only |
| `#vol` + `#vo` readout | volumeSlider (+ NEW live % readout) | keep existing input handler |
| `.btn` rows (Manage data / My words) | `#dataOpen`, custom-words group | same pattern |
| `.bar`: chips ✓/✗ + `.seg` + tags | `.game-top-bar`: +sessionCorrectCount/−sessionIncorrectCount chips styled as tok-bg/bad-bg, 12 `.seg`, `#categoryTag`/`#difficultyTag` | keep JS update logic |
| `.hero-art` (ring/core/sparkles) + `.word` | NEW wrapper above `#wordDisplay` + stage the word display | aria-hidden decoration |
| `.cta` "Show word" | `#startBtn` (+play icon styling) | text unchanged |
| `.hint` kbd | `#readyHint` Enter hint (kbd exists) | |
| `.fin` Finish | `#finishSessionBtn` | |
| `.art` in-card waves/blob/dots/orbs | NEW decorative layer inside `#gameCard` (position:relative, overflow hidden) | |
| `.word` show / `.tb` countdown | phaseSee `#wordDisplay` + `#timerFill` (already a bar) | |
| `#ans` centered input | `#answerInput` (mirror/feedback unchanged) | |
| `.fb` calm feedback | correctHeadline/incorrect result copy (classes ok/no) | |
| summary modal | `#summaryOverlay` + real fields (score/accuracy/best/high/words/bucketAdds) + Play again = summaryNewSessionBtn | "+ New best" binds to real highScore beat |
| `.stat` rows | statScore/statStreak/statBest/statAccuracy pill styling | |
| `.acc`/`.pn` expandables ×6 | Performance (custom js state), Memory queue (#reviewModeToggle+srsStats), Bucket (#bucketToggle+bucketList), Categories (#categoryStatsToggle+categoryStatsList), Manage data (dataPage opener), My words (custom-words group) | one shared pattern, aria-expanded/controls |
| My words `.add` input + chips + × | customWordInput + customWordsList items (data-del buttons already exist) | same storage |
| Manage data panel copy/reset | #exportBtn / #resetAllBtn (confirmAction flow with DELETE-type guard) |原图 confirm kept |
| theme via `[data-theme=dark]` | html[data-theme] same token names | map .th → themeToggle |
| ENTER/Esc handlers, ld/sv helpers, SEED/C inputs, sc.* keys, beep, fake data | original logic ONLY (scoring, buckets, SRS, storage) | demo-only code never ported |

No-reference-equivalent original features (must keep UI): spell tray (v=43 visual letters), Say/Spell spoken-words buttons + tts toggle (v=42), review-mode select (Memory queue panel), practiceMineBtn (My words practice), category create flow, import pipeline (pick/paste/parse/importCopyBtn/import-fmt-chips), word search filter, reset-session, summary categories (strongest/weakest), delete-all confirm with typed DELETE, toasts (toastRegion), confetti, streak theme milestones + state banner.
Reference-only fake data (never fabricated): "Categories accuracy" percentages → bind to real `state.categoryStats` (correct/total per category — exists!); "Bucket = mastered" → original bucket = missed words (keep original semantics, restyle only); "Memory queue" → original SRS due list (real data exists).

## 3. Deviations already known
1. `spellsprint.*` in the task text → real `spellcast.*` (no migration, report).
2. Reference `--err` referenced but undefined → define (light `#d64535`, dark `#ff8a7a`).
3. Font already local (PJS + Outfit) — no change beyond confirming face order.
4. Reference timer bar animates `width` — original `timerFill` is the real timer; keep width binding (it's JS-driven per remaining ms), no new animation of width.
5. Reference demo's Enter "starts/submits/restarts" + Esc "finishes" → original already maps Enter to check/advance and Esc to skip/finish flows; align new UI with original (behavior wins), surface hints unchanged.

## 4. Plan recap (one commit each): 2 tokens → 3 sprite → 4 bg → 5 glass → 6 header/logo/favicon → 7 controls → 8 center/phases → 9 stats → 10 unified expandables ×6 → 11 persistence → 12 enhancements → 13 responsive/a11y/perf → 14 handover + ?v bump. Acceptance: regressions stay green incl. fixture byte-for-byte; side-by-side screenshots at 1869×842, 1280×720, 390×844 in light+dark; Lighthouse ≥95; no console errors; no h-scroll ≥360px.
