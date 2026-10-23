/* ==========================================================================
   SPELLCAST — SCRIPT.JS
   Vanilla JS spelling trainer. No frameworks, no build step, no backend.
   ========================================================================== */

// ================================
// WORD LIBRARY LOADER
// ================================
// words.js is the single source of truth:
//   WORD_LIBRARY = { meta: { version }, categories: { key: { label, e, m, h } } }
// Normalized here into the app's shape:
//   WORDS[key] = { easy: [...], medium: [...], hard: [...] }
// Loader guarantees: trimmed lowercase words, letters only, no duplicate
// within a tier, categories without words are dropped, malformed entries
// are logged and skipped instead of breaking the game.
const TIER_ALIASES = { e: "easy", m: "medium", h: "hard" };
const WORDS = {};
const CATEGORY_LABELS = {};

function loadWordLibrary() {
  const raw = typeof WORD_LIBRARY === "object" && WORD_LIBRARY ? WORD_LIBRARY.categories : null;
  if (!raw) { console.error("SpellCast: words.js not loaded — no words available."); return; }
  Object.keys(raw).forEach((catKey) => {
    const src = raw[catKey];
    if (!src || typeof src !== "object") { console.warn("SpellCast: skipped malformed category", catKey); return; }
    const tiers = { easy: [], medium: [], hard: [] };
    let count = 0;
    Object.keys(TIER_ALIASES).forEach((alias) => {
      const tier = TIER_ALIASES[alias];
      (Array.isArray(src[alias]) ? src[alias] : []).forEach((raw0) => {
        const w = typeof raw0 === "string" ? raw0.trim().toLowerCase() : "";
        if (!/^[a-z]{2,30}$/.test(w)) { console.warn("SpellCast: dropped invalid word", JSON.stringify(raw0), "in", catKey); return; }
        if (tiers[tier].includes(w)) { console.warn("SpellCast: duplicate tier word skipped", w, catKey); return; }
        tiers[tier].push(w);
        count++;
      });
    });
    if (!count) { console.warn("SpellCast: skipped empty category", catKey); return; }
    WORDS[catKey] = tiers;
    CATEGORY_LABELS[catKey] = typeof src.label === "string" && src.label.trim() ? src.label.trim() : catKey;
  });
}
loadWordLibrary();

const CATEGORY_KEYS = Object.keys(WORDS);

// Pristine snapshot of the built-in word list.
// Custom words and custom categories are injected into WORDS at runtime, so we
// keep an untouched copy to rebuild from when the user wipes their data.
const BUILTIN_WORDS = JSON.parse(JSON.stringify(WORDS));
const BUILTIN_CATEGORY_KEYS = Object.keys(BUILTIN_WORDS);

// ================================
// STREAK MILESTONES & THEME BANDS
// ================================

const MILESTONES = [
  { at: 3, icon: "🔥", title: "Warming up", sub: "3 correct in a row" },
  { at: 5, icon: "🔥", title: "On fire", sub: "5 word streak!" },
  { at: 10, icon: "⚡", title: "Unstoppable", sub: "10 correct in a row!" },
  { at: 15, icon: "⚡", title: "Still unstoppable", sub: "15 correct in a row!" },
  { at: 20, icon: "🚀", title: "Spelling machine", sub: "20 correct in a row!" },
  { at: 30, icon: "👑", title: "Spelling master", sub: "30 correct in a row!" },
  { at: 50, icon: "🏆", title: "Legendary", sub: "50 correct in a row!" }
];

const CONFETTI_MILESTONES = new Set([10, 20, 30, 50]);

function themeForStreak(streak) {
  if (streak >= 30) return { key: "legendary", label: "Legendary" };
  if (streak >= 20) return { key: "rocket", label: "Spelling machine" };
  if (streak >= 10) return { key: "electric", label: "Unstoppable" };
  if (streak >= 5) return { key: "fire", label: "On fire" };
  if (streak >= 3) return { key: "warm", label: "Warming up" };
  return { key: "normal", label: "" };
}

function streakBonus(streak) {
  // streak here is the streak value AFTER incrementing for this correct answer
  if (streak >= 20) return 25;
  if (streak >= 10) return 20;
  if (streak >= 5) return 15;
  return 10;
}

const BUCKET_MASTER_BONUS = 15;
const BUCKET_MIX_RATIO = 0.6; // 60% bucket words when bucket has entries
const REVIEW_DUE_WEIGHT = 0.75; // 75% of "Mixed" rounds prefer a due review card
const MS_PER_DAY = 86400000;
const MS_PER_SHORT_REVIEW = 10 * 60 * 1000; // a miss comes back in 10 minutes
const SRS_EASE_START = 2.3;
const SRS_EASE_MAX = 2.8;
const SRS_EASE_MIN = 1.3;
const SRS_MATURE_DAYS = 21; // a card with a >= 21 day interval counts as mastered
const SRS_LEARNING_DAYS = 7; // below this, a card counts as "learning"

// ================================
// STORAGE KEYS
// ================================

const LS_KEYS = {
  schemaVersion: "spellcast.schemaVersion",
  highScore: "spellcast.highScore",
  bestStreak: "spellcast.bestStreak",
  totalLifetimeWords: "spellcast.totalLifetimeWords",
  lifetimeCorrect: "spellcast.lifetimeCorrect",
  preferredCategory: "spellcast.preferredCategory",
  preferredDifficulty: "spellcast.preferredDifficulty",
  preferredDuration: "spellcast.preferredDuration",
  soundEnabled: "spellcast.soundEnabled",
  soundVolume: "spellcast.soundVolume",
  bucket: "spellcast.bucket",
  customWords: "spellcast.customWords",
  srsCards: "spellcast.srsCards",
  reviewMode: "spellcast.reviewMode",
  chunkWords: "spellcast.chunkWords",
  darkMode: "spellcast.darkMode"
};

// Current storage schema. Bump when the SHAPE of a stored value changes and
// add a migration step in migrateLegacyStorage() below.
const SCHEMA_VERSION = 2;

// One-shot migration: the pre-rename build stored everything under
// "spellsprint.*". If a browser still holds those keys, move them to their
// "spellcast.*" equivalent instead of starting over.
function migrateLegacyStorage() {
  const legacy = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.indexOf("spellsprint.") === 0) legacy.push(key);
  }
  if (!legacy.length) return 0;
  let moved = 0;
  legacy.forEach((oldKey) => {
    const newKey = "spellcast." + oldKey.slice("spellsprint.".length);
    const value = localStorage.getItem(oldKey);
    if (value !== null && localStorage.getItem(newKey) === null) {
      localStorage.setItem(newKey, value);
      moved++;
    }
    localStorage.removeItem(oldKey);
  });
  if (moved) console.info(`SpellCast: migrated ${moved} legacy spellsprint.* key(s) to spellcast.*`);
  return moved;
}

// ================================
// APPLICATION STATE
// ================================

const state = {
  phase: "ready", // ready | see | type | correct | incorrect

  score: 0,
  highScore: 0,

  streak: 0,
  bestStreak: 0,

  correct: 0,
  incorrect: 0,
  answerHistory: [], // last answers as booleans — drives the segment strip

  currentWord: null,     // { word, category, fromBucket }
  currentThemeKey: "normal",

  bucket: [],             // [{ word, category, mistakes }]

  category: "all",
  difficulty: "medium",
  duration: 2000,
  soundEnabled: false,
  chunkWords: true, // render long words as syllable chips (user option)

  sessionWords: 0,
  sessionBucketAdds: 0,
  sessionRecordAtStart: 0, // the all-time record this session is trying to beat
  recordCelebrated: false,  // ensures the "new high score" toast fires once
  deckRevealed: 0, // words revealed from the current full-deck pass — drives the progress bar

  categoryStats: {}, // { nouns: { correct: n, total: n }, ... }

  // no-repeat pool
  wordPool: [],
  poolIndex: 0,
  recentQueue: [], // last 30 words to avoid immediate repeats
  maxRecent: 30,
  // custom + SRS
  customWords: [], // [{word, category, difficulty, addedAt}]
  srsCards: {}, // word -> {word, category, difficulty, interval, ease, due, reps, lapses, lastReviewed}
  reviewMode: "mixed", // mixed | dueOnly

  // UX enhancements
  darkMode: false,
  soundVolume: 0.5,
  sessionStartTime: null,
  sessionTimerHandle: null
};

let seeTimerHandle = null;
let seeTimerStart = null;
let seeTimerRaf = null;

// ================================
// DOM REFERENCES
// ================================

const dom = {
  body: document.body,

  headerStreak: document.getElementById("headerStreak"),
  headerStreakPill: document.getElementById("headerStreakPill"),
  headerTimerPill: document.getElementById("headerTimerPill"),
  stateBannerText: document.getElementById("stateBannerText"),

  settingsToggle: document.getElementById("settingsToggle"),
  settingsPanel: document.getElementById("settingsPanel"),
  categorySelect: document.getElementById("categorySelect"),
  difficultySelect: document.getElementById("difficultySelect"),
  durationSelect: document.getElementById("durationSelect"),
  soundToggle: document.getElementById("soundToggle"),
  chunkToggle: document.getElementById("chunkToggle"),
  resetSessionBtn: document.getElementById("resetSessionBtn"),
  resetAllBtn: document.getElementById("resetAllBtn"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  themeLabel: document.getElementById("themeLabel"),

  customWordInput: document.getElementById("customWordInput"),
  customWordCategory: document.getElementById("customWordCategory"),
  customWordDifficulty: document.getElementById("customWordDifficulty"),
  addWordForm: document.getElementById("addWordForm"),
  customCountBadge: document.getElementById("customCountBadge"),
  newCategoryInput: document.getElementById("newCategoryInput"),
  createCategoryBtn: document.getElementById("createCategoryBtn"),
  customWordsList: document.getElementById("customWordsList"),
  customWordError: document.getElementById("customWordError"),
  exportBtn: document.getElementById("exportBtn"),
  importBtn: document.getElementById("importBtn"),
  importFile: document.getElementById("importFile"),
  reviewModeSelect: document.getElementById("reviewModeSelect"),
  srsStats: document.getElementById("srsStats"),
  dataPage: document.getElementById("dataPage"),
  dataClose: document.getElementById("dataClose"),
  dataOpen: document.getElementById("dataOpen"),
  dataOpen2: document.getElementById("dataOpen2"),
  dataStats: document.getElementById("dataStats"),
  wordSearch: document.getElementById("wordSearch"),
  dataWordCount: document.getElementById("dataWordCount"),
  dataCategoryList: document.getElementById("dataCategoryList"),
  importPick: document.getElementById("importPick"),
  importPickBtn: document.getElementById("importPickBtn"),
  importPaste: document.getElementById("importPaste"),
  importParseBtn: document.getElementById("importParseBtn"),
  importResult: document.getElementById("importResult"),
  drawerWordsHint: document.getElementById("drawerWordsHint"),

  statScore: document.getElementById("statScore"),
  statStreak: document.getElementById("statStreak"),
  statBest: document.getElementById("statBest"),
  statAccuracy: document.getElementById("statAccuracy"),

  sessionCorrectCount: document.getElementById("sessionCorrectCount"),
  sessionIncorrectCount: document.getElementById("sessionIncorrectCount"),
  segmentRow: document.getElementById("segmentRow"),

  gameCard: document.getElementById("gameCard"),
  scoreFloat: document.getElementById("scoreFloat"),
  categoryTag: document.getElementById("categoryTag"),
  difficultyTag: document.getElementById("difficultyTag"),
  sessionTimer: document.getElementById("sessionTimer"),

  phaseReady: document.getElementById("phaseReady"),
  startBtn: document.getElementById("startBtn"),
  readyHint: document.getElementById("readyHint"),

  phaseSee: document.getElementById("phaseSee"),
  wordDisplay: document.getElementById("wordDisplay"),
  timerFill: document.getElementById("timerFill"),
  timerCaption: document.getElementById("timerCaption"),
  seeAdvanceBtn: document.getElementById("seeAdvanceBtn"),

  phaseType: document.getElementById("phaseType"),
  answerForm: document.getElementById("answerForm"),
  answerInput: document.getElementById("answerInput"),
  answerMirror: document.getElementById("answerMirror"),
  skipBtn: document.getElementById("skipBtn"),

  phaseCorrect: document.getElementById("phaseCorrect"),
  correctHeadline: document.getElementById("correctHeadline"),
  correctWordEcho: document.getElementById("correctWordEcho"),
  correctPoints: document.getElementById("correctPoints"),
  masteredNote: document.getElementById("masteredNote"),
  nextAfterCorrectBtn: document.getElementById("nextAfterCorrectBtn"),

  phaseIncorrect: document.getElementById("phaseIncorrect"),
  incorrectCorrectWord: document.getElementById("incorrectCorrectWord"),
  incorrectYourAnswer: document.getElementById("incorrectYourAnswer"),
  streakTransitionNote: document.getElementById("streakTransitionNote"),
  nextAfterIncorrectBtn: document.getElementById("nextAfterIncorrectBtn"),
  backAfterIncorrectBtn: document.getElementById("backAfterIncorrectBtn"),

  toastRegion: document.getElementById("toastRegion"),

  bucketToggle: document.getElementById("bucketToggle"),
  bucketPanel: document.getElementById("bucketPanel"),
  bucketCount: document.getElementById("bucketCount"),
  bucketCount2: document.getElementById("bucketCount2"),
  bucketList: document.getElementById("bucketList"),
  bucketEmptyHint: document.getElementById("bucketEmptyHint"),

  categoryStatsToggle: document.getElementById("categoryStatsToggle"),
  categoryStatsPanel: document.getElementById("categoryStatsPanel"),
  categoryStatsList: document.getElementById("categoryStatsList"),
  categoryStatsEmptyHint: document.getElementById("categoryStatsEmptyHint"),

  finishSessionBtn: document.getElementById("finishSessionBtn"),

  actionDialog: document.getElementById("actionDialog"),
  actionDialogTitle: document.getElementById("actionDialogTitle"),
  actionDialogBody: document.getElementById("actionDialogBody"),
  actionDialogActions: document.getElementById("actionDialogActions"),
  actionDialogRequire: document.getElementById("actionDialogRequire"),
  actionDialogRequireLabel: document.getElementById("actionDialogRequireLabel"),
  actionDialogInput: document.getElementById("actionDialogInput"),

  summaryOverlay: document.getElementById("summaryOverlay"),
  summaryScore: document.getElementById("summaryScore"),
  summaryAccuracy: document.getElementById("summaryAccuracy"),
  summaryBestStreak: document.getElementById("summaryBestStreak"),
  summaryHighScore: document.getElementById("summaryHighScore"),
  summaryWordsPracticed: document.getElementById("summaryWordsPracticed"),
  summaryBucketAdds: document.getElementById("summaryBucketAdds"),
  summaryStrongest: document.getElementById("summaryStrongest"),
  summaryWeakest: document.getElementById("summaryWeakest"),
  summaryCloseBtn: document.getElementById("summaryCloseBtn"),
  summaryNewSessionBtn: document.getElementById("summaryNewSessionBtn"),

  srAnnouncer: document.getElementById("srAnnouncer"),
  confettiLayer: document.getElementById("confettiLayer"),

  volumeField: document.getElementById("volumeField"),
  volumeSlider: document.getElementById("volumeSlider")
};

// ================================
// WORD SELECTION — no repeat until pool exhausted
// ================================

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// === Word selection algorithm ===
// 1) Decks, not concatenation: every category contributes one word per sweep
//    (round-robin), so a 20-word list can never crowd out another distinct
//    category in "All categories" mode — each category is surfaced evenly.
// 2) Each category tier is Fisher-Yates shuffled before the sweep, so runs
//    feel random while every word appears exactly once per full deck pass.
// 3) No deck mutation tricks: the built pool is immutable; getNextFreshWord
//    walks it with an index and the recent-queue guarantees nothing repeats
//    within a window even after decks are reshuffled.
function buildPool() {
  const cats = state.category === "all" ? CATEGORY_KEYS.slice() : [state.category];
  const decks = [];
  cats.forEach((cat) => {
    const list = (WORDS[cat] && WORDS[cat][state.difficulty]) || [];
    if (list.length) {
      const deck = list.slice();
      shuffleArray(deck);
      decks.push({ cat, deck });
    }
  });
  const pool = [];
  let i = 0;
  while (decks.length) {
    const d = decks[i % decks.length];
    if (d.deck.length) pool.push({ word: d.deck.shift(), category: d.cat });
    if (!d.deck.length) { decks.splice(i % decks.length, 1); continue; }
    i++;
  }
  state.wordPool = pool;
  state.poolIndex = 0;
  state.deckRevealed = 0;
}

// Remember a word so it is not served again within the recent window.
function pushRecent(word) {
  state.recentQueue.push(word);
  if (state.recentQueue.length > state.maxRecent) state.recentQueue.shift();
}

function getNextFreshWord() {
  // rebuild if empty or exhausted
  if (!state.wordPool.length || state.poolIndex >= state.wordPool.length) {
    buildPool();
  }
  const pool = state.wordPool;
  if (!pool.length) return null; // nothing to draw from — caller must handle it

  // Prefer a word that was not shown recently, but never stall on a small pool.
  // The pool is scanned with an index only — it is never mutated, so it can not
  // grow duplicates and "Word N of M" stays accurate.
  const recentSet = new Set(state.recentQueue);
  const n = pool.length;
  const canAvoidRecent = n > state.maxRecent;
  let candidate = null;
  for (let i = 0; i < n; i++) {
    const c = pool[(state.poolIndex + i) % n];
    if (!recentSet.has(c.word) || !canAvoidRecent) {
      candidate = c;
      state.poolIndex = (state.poolIndex + i + 1) % n;
      break;
    }
  }
  if (!candidate) {
    candidate = pool[state.poolIndex % n];
    state.poolIndex = (state.poolIndex + 1) % n;
  }
  // track recent
  pushRecent(candidate.word);
  return candidate;
}

// Returns { word, category, fromBucket, isSrs } or null when there is
// nothing to serve (empty pool / nothing due in "due only" mode).
// The selected category is honoured by EVERY source — a session set to
// "verbs" never serves a noun, no matter whether the word comes from the
// fresh deck, the practice bucket or a due review card.
function selectNextWord() {
  const categoryFilter = state.category; // "all" or a category key
  const inCategory = (cat) => categoryFilter === "all" || cat === categoryFilter;

  // 1) SRS due cards — highest priority (Anki-like)
  const dueAll = getDueCards();
  if (dueAll.length) {
    const filtered = dueAll.filter(c => inCategory(c.category));
    const useDue = state.reviewMode === "dueOnly" ? true : (Math.random() < REVIEW_DUE_WEIGHT);
    if (useDue && filtered.length) {
      const weighted = [];
      filtered.forEach(c => {
        const w = Math.min(c.lapses + (c.interval === 0 ? 2 : 0), 5) + 1;
        for (let i = 0; i < w; i++) weighted.push(c);
      });
      let chosen = weighted[Math.floor(Math.random() * weighted.length)];
      // avoid immediate repeat if possible
      if (state.recentQueue.includes(chosen.word) && filtered.length > 1) {
        const alt = filtered.find(c => !state.recentQueue.includes(c.word));
        if (alt) chosen = alt;
      }
      pushRecent(chosen.word);
      return { word: chosen.word, category: chosen.category, fromBucket: true, isSrs: true };
    }
    // "Due only" means exactly that — never fall through to fresh words.
    if (state.reviewMode === "dueOnly") return null;
  } else if (state.reviewMode === "dueOnly") {
    return null;
  }

  // 2) practice bucket — also filtered by the selected category
  const bucketWords = state.bucket.filter(entry => inCategory(entry.category));
  if (bucketWords.length && Math.random() < BUCKET_MIX_RATIO) {
    const weighted = [];
    bucketWords.forEach((entry) => {
      const weight = Math.min(entry.mistakes, 5) + 1;
      for (let i = 0; i < weight; i++) weighted.push(entry);
    });
    const chosen = weighted[Math.floor(Math.random() * weighted.length)];
    if (!state.recentQueue.includes(chosen.word) || bucketWords.length === 1) {
      pushRecent(chosen.word);
    }
    return { word: chosen.word, category: chosen.category, fromBucket: true, isSrs: !!state.srsCards[chosen.word] };
  }

  // 3) fresh word from the pool
  const picked = getNextFreshWord();
  if (!picked) return null;
  return { word: picked.word, category: picked.category, fromBucket: false, isSrs: false };
}

function resetWordPool() {
  buildPool();
  state.recentQueue = [];
  refreshReadyState();
}

// ---- ready-screen messaging (empty word list / nothing due for review) ----

const READY_HINT_DEFAULT = "Memorize, then type from memory.";
const READY_HINT_NO_WORDS = "No words for this category and difficulty yet — add one below or pick another difficulty.";
const READY_HINT_NOTHING_DUE = "Nothing is due for review right now — switch Review mode to Mixed to keep practising.";

function setReadyHint(text, disableStart) {
  if (dom.readyHint) dom.readyHint.textContent = text;
  if (dom.startBtn) dom.startBtn.disabled = !!disableStart;
}

function refreshReadyState() {
  if (!state.wordPool.length) {
    setReadyHint(READY_HINT_NO_WORDS, true);
    return;
  }
  if (state.reviewMode === "dueOnly") {
    const due = getDueCards().filter(c => state.category === "all" || c.category === state.category);
    if (!due.length) {
      setReadyHint(
        state.category === "all"
          ? READY_HINT_NOTHING_DUE
          : `Nothing is due for ${CATEGORY_LABELS[state.category] || state.category} right now — switch Review mode to Mixed to keep practising.`,
        true
      );
      return;
    }
  }
  setReadyHint(READY_HINT_DEFAULT, false);
}

// ================================
// GAME STATE (phase transitions)
// ================================

function setPhase(phase) {
  state.phase = phase;
  dom.phaseReady.hidden = phase !== "ready";
  dom.phaseSee.hidden = phase !== "see";
  // The answer input is parked off-canvas between words instead of hidden:
  // display:none force-blurs the focused field, which slams the mobile
  // keyboard shut after every answer. Parked, it keeps focus and the keyboard
  // stays up; only the session summary (which blurs it on purpose) closes it.
  dom.phaseType.classList.toggle("phase-parked", phase !== "type");
  // parked, the field stays focusable (the keyboard must survive) but must not
  // sit in the tab order — only the type phase exposes it
  if (phase === "type") dom.answerInput.removeAttribute("tabindex");
  else dom.answerInput.tabIndex = -1;
  dom.phaseCorrect.hidden = phase !== "correct";
  dom.phaseIncorrect.hidden = phase !== "incorrect";
  if (phase === "ready") {
    requestAnimationFrame(() => dom.startBtn.focus());
  } else if (phase === "see") {
    // don't steal focus to div — keep announce only
  } else if (phase === "type") {
    requestAnimationFrame(() => dom.answerInput.focus());
  }
  // correct/incorrect deliberately take no focus: stealing it to the Next
  // button would blur the parked answer input and close the keyboard the
  // moment you check the word (Enter advances via the global handler)
}

// ---- syllable chunking: long words render as chunk chips so the spelling can
// be memorised in pieces (the mockup's chunk chips — switchable via "Word
// chunks" in Practice). The spans hold
// no whitespace between them, so #wordDisplay.textContent is still exactly the
// word — for tests and for screen readers. Anything that does not reassemble
// to the exact word falls back to plain display.
function splitIntoSyllables(word) {
  return word
    .replace(/([^aeiouy]*)/g, "-$1")
    .replace(/((?:^|[^aeiouy])th|^m)n-/g, "$1n-")
    .replace(/-/g, "")
    .match(/[^aeiouy]*[aeiouy]+(?:[^aeiouy]+|$)/gi) || [word];
}

function renderWordDisplay(word) {
  if (state.chunkWords && word.length > 4) {
    const chunks = splitIntoSyllables(word);
    if (chunks.length > 1 && chunks.join("") === word) {
      dom.wordDisplay.innerHTML = chunks.map((c) => `<span class="chunk">${c}</span>`).join("");
      return;
    }
  }
  dom.wordDisplay.textContent = word;
}

function beginRound() {
  clearSeeTimer();
  // clear the previous result frame (correct / incorrect / high score)
  dom.gameCard.classList.remove("correct", "incorrect", "new-high-score");
  const picked = selectNextWord();
  if (!picked) {
    // Nothing to serve (empty pool, or nothing due in "due only" mode).
    refreshReadyState();
    setPhase("ready");
    announce("Nothing to practise right now.");
    return;
  }
  state.currentWord = picked;

  dom.categoryTag.textContent = CATEGORY_LABELS[picked.category];
  renderWordDisplay(picked.word);
  dom.timerCaption.textContent = (state.duration / 1000).toFixed(1) + " seconds";

  announce(`Word: ${picked.word}. Category: ${CATEGORY_LABELS[picked.category]}.`);

  dom.categoryTag.classList.remove("bump");
  void dom.categoryTag.offsetWidth;
  dom.categoryTag.classList.add("bump");

  startSessionTimer();
  setPhase("see");
  runSeeTimer(state.duration);
}

function runSeeTimer(durationMs) {
  dom.timerFill.style.transition = "none";
  dom.timerFill.style.width = "100%";
  // force reflow so the transition below actually animates
  void dom.timerFill.offsetWidth;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) {
    dom.timerFill.style.width = "0%";
  } else {
    dom.timerFill.style.transition = `width ${durationMs}ms linear`;
    dom.timerFill.style.width = "0%";
  }

  seeTimerStart = performance.now();
  const tickCaption = () => {
    const elapsed = performance.now() - seeTimerStart;
    const remaining = Math.max(0, durationMs - elapsed);
    dom.timerCaption.textContent = (remaining / 1000).toFixed(1) + " seconds";
    if (remaining > 0 && state.phase === "see") {
      seeTimerRaf = requestAnimationFrame(tickCaption);
    }
  };
  seeTimerRaf = requestAnimationFrame(tickCaption);

  seeTimerHandle = setTimeout(() => {
    goToTypePhase();
  }, durationMs);
}

function clearSeeTimer() {
  if (seeTimerHandle) {
    clearTimeout(seeTimerHandle);
    seeTimerHandle = null;
  }
  if (seeTimerRaf) {
    cancelAnimationFrame(seeTimerRaf);
    seeTimerRaf = null;
  }
}

function goToTypePhase() {
  clearSeeTimer();
  setPhase("type");
  dom.answerInput.value = "";
  syncAnswerMirror();
  if (state.currentWord) {
    state.deckRevealed += 1;
  }
  renderSessionProgress();
}

function poolSize() {
  if (state.wordPool.length) return state.wordPool.length;
  const cats = state.category === "all" ? CATEGORY_KEYS : [state.category];
  let total = 0;
  cats.forEach(cat => {
    const list = WORDS[cat][state.difficulty] || [];
    total += list.length;
  });
  return Math.max(1, total);
}

function startSessionTimer() {
  if (state.sessionTimerHandle) cancelAnimationFrame(state.sessionTimerHandle);
  if (!state.sessionStartTime) state.sessionStartTime = Date.now();
  dom.sessionTimer.classList.add("is-running");
  if (dom.headerTimerPill) dom.headerTimerPill.classList.add("lit");
  dom.sessionTimer.textContent = "0:00";
  function tick() {
    if (!state.sessionStartTime) return;
    const elapsed = Math.floor((Date.now() - state.sessionStartTime) / 1000);
    const m = Math.floor(elapsed / 60);
    const s = elapsed % 60;
    dom.sessionTimer.textContent = `${m}:${s.toString().padStart(2, "0")}`;
    state.sessionTimerHandle = requestAnimationFrame(tick);
  }
  state.sessionTimerHandle = requestAnimationFrame(tick);
}

function stopSessionTimer() {
  if (state.sessionTimerHandle) {
    cancelAnimationFrame(state.sessionTimerHandle);
    state.sessionTimerHandle = null;
  }
  if (dom.sessionTimer) dom.sessionTimer.classList.remove("is-running");
  if (dom.headerTimerPill) dom.headerTimerPill.classList.remove("lit");
}

// ================================
// ANSWER VALIDATION
// ================================

function normalize(str) {
  return str.trim().toLowerCase();
}

function checkAnswer(rawInput) {
  const given = normalize(rawInput);
  const target = normalize(state.currentWord.word);
  return given === target;
}

// ================================
// STREAK SYSTEM
// ================================

function incrementStreak() {
  state.streak += 1;
  if (state.streak > state.bestStreak) {
    state.bestStreak = state.streak;
    saveLocal(LS_KEYS.bestStreak, state.bestStreak);
  }
  applyStreakTheme(state.streak);
  checkMilestone(state.streak);
  return state.streak;
}

function resetStreak() {
  const previous = state.streak;
  state.streak = 0;
  applyStreakTheme(0);
  return previous;
}

function applyStreakTheme(streak) {
  const theme = themeForStreak(streak);
  if (theme.key !== state.currentThemeKey) {
    state.currentThemeKey = theme.key;

    dom.body.classList.remove(
      "theme-normal", "theme-warm", "theme-fire",
      "theme-electric", "theme-rocket", "theme-legendary"
    );
    dom.body.classList.add(`theme-${theme.key}`);
  }

  // Always refresh the banner text — it carries the live streak count, so it
  // must not go stale while the theme band stays the same.
  dom.stateBannerText.textContent = theme.label
    ? `${theme.label.toUpperCase()} · ${streak} STREAK`
    : "";
}

function checkMilestone(streak) {
  const milestone = MILESTONES.find((m) => m.at === streak);
  if (!milestone) return;
  showMilestoneToast(milestone);
  if (CONFETTI_MILESTONES.has(streak)) {
    launchConfetti();
  }
  playTone("milestone");
}

// ================================
// SCORE SYSTEM
// ================================

function awardPoints(points) {
  state.score += points;
  let newHighScore = false;
  if (state.score > state.highScore) {
    state.highScore = state.score;
    saveLocal(LS_KEYS.highScore, state.highScore);
    // Celebrate only the first time this session passes the record that was
    // standing when the session started — not on every answer after that.
    if (!state.recordCelebrated && state.sessionRecordAtStart > 0 && state.score > state.sessionRecordAtStart) {
      state.recordCelebrated = true;
      newHighScore = true;
    }
  }
  return { points, newHighScore };
}

// ================================
// PRACTICE BUCKET
// ================================

function addToBucket(word, category) {
  const existing = state.bucket.find((e) => e.word === word);
  if (existing) {
    existing.mistakes += 1;
  } else {
    state.bucket.push({ word, category, mistakes: 1 });
    state.sessionBucketAdds += 1;
  }
  saveBucket();
  renderBucketPanel();
}

function removeFromBucket(word) {
  const idx = state.bucket.findIndex((e) => e.word === word);
  if (idx !== -1) {
    state.bucket.splice(idx, 1);
    saveBucket();
    renderBucketPanel();
    return true;
  }
  return false;
}

function priorityLevel(mistakes) {
  if (mistakes >= 3) return "high";
  if (mistakes === 2) return "medium";
  return "normal";
}

// ================================
// LOCAL STORAGE
// ================================

function saveLocal(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // storage unavailable (private mode, quota) — fail silently, game still works in-session
  }
}

function loadLocal(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw);
  } catch (e) {
    return fallback;
  }
}

function saveBucket() {
  saveLocal(LS_KEYS.bucket, state.bucket);
}

function saveCustomWords() {
  saveLocal(LS_KEYS.customWords, state.customWords);
}

function saveSrsCards() {
  saveLocal(LS_KEYS.srsCards, state.srsCards);
}

function normalizeWordRaw(s) {
  return s.trim().toLowerCase();
}

function isValidWord(s) {
  const t = s.trim();
  if (t.length < 2 || t.length > 30) return false;
  return /^[a-z][a-z\-']*[a-z]$|^[a-z]{2}$/.test(t.toLowerCase());
}

function wordExistsAnywhere(word) {
  const w = normalizeWordRaw(word);
  // check built-ins + custom
  for (const cat of Object.keys(WORDS)) {
    for (const diff of ["easy","medium","hard"]) {
      const arr = WORDS[cat][diff] || [];
      if (arr.includes(w)) return true;
    }
  }
  return false;
}

// Strip anything that could be injected as markup from a user supplied label.
function sanitizeLabel(label, fallback) {
  const clean = String(label == null ? "" : label)
    .replace(/[<>&"']/g, "")
    .trim()
    .slice(0, 40);
  return clean || fallback;
}

function showFieldError(message) {
  if (!dom.customWordError) return;
  dom.customWordError.textContent = message || "";
  dom.customWordError.hidden = !message;
}

function ensureCategory(catKey, label) {
  if (WORDS[catKey]) return;
  WORDS[catKey] = { easy: [], medium: [], hard: [] };
  CATEGORY_LABELS[catKey] = sanitizeLabel(label, catKey.charAt(0).toUpperCase() + catKey.slice(1));
  if (!CATEGORY_KEYS.includes(catKey)) CATEGORY_KEYS.push(catKey);
  [dom.categorySelect, dom.customWordCategory].forEach(sel => {
    if (!sel) return;
    if ([...sel.options].some(o => o.value === catKey)) return;
    const opt = document.createElement("option");
    opt.value = catKey;
    opt.textContent = CATEGORY_LABELS[catKey];
    sel.appendChild(opt);
  });
}

function rebuildCustomWordsIntoWORDS() {
  // clear previous custom injections? we keep built-ins intact, re-add custom
  // ensure custom categories exist
  state.customWords.forEach(({ word, category, difficulty }) => {
    ensureCategory(category, CATEGORY_LABELS[category] || category);
    const arr = WORDS[category][difficulty];
    if (!arr.includes(word)) arr.push(word);
  });
}

function addCustomWord(rawWord, category, difficulty) {
  const word = normalizeWordRaw(rawWord);
  if (!isValidWord(word)) return { ok:false, error:"Word must be 2-30 letters, a-z, hyphen/apostrophe allowed" };
  if (wordExistsAnywhere(word)) return { ok:false, error:"Word already exists" };
  // if new category name provided as free text, sanitize
  let catKey = category;
  if (catKey === "__new") return { ok:false, error:"Create category first" };
  ensureCategory(catKey, CATEGORY_LABELS[catKey] || catKey);
  const entry = { word, category: catKey, difficulty, addedAt: Date.now() };
  state.customWords.push(entry);
  WORDS[catKey][difficulty].push(word);
  saveCustomWords();
  // init SRS card
  initSrsCard(word, catKey, difficulty);
  saveSrsCards();
  renderCustomWordsList();
  renderSrsStats();
  resetWordPool();
  return { ok:true };
}

function deleteCustomWord(word) {
  const w = normalizeWordRaw(word);
  state.customWords = state.customWords.filter(e => e.word !== w);
  // remove from WORDS
  for (const cat of Object.keys(WORDS)) {
    for (const diff of ["easy","medium","hard"]) {
      WORDS[cat][diff] = WORDS[cat][diff].filter(x => x !== w);
    }
  }
  delete state.srsCards[w];
  saveCustomWords();
  saveSrsCards();
  renderCustomWordsList();
  renderSrsStats();
  resetWordPool();
}

function loadAllPersisted() {
  state.highScore = loadLocal(LS_KEYS.highScore, 0);
  state.bestStreak = loadLocal(LS_KEYS.bestStreak, 0);
  state.bucket = loadLocal(LS_KEYS.bucket, []);
  state.customWords = loadLocal(LS_KEYS.customWords, []);
  state.srsCards = loadLocal(LS_KEYS.srsCards, {});
  // migrate bucket -> SRS if srs empty but bucket has data
  if (Object.keys(state.srsCards).length === 0 && state.bucket.length) {
    state.bucket.forEach(e => {
      state.srsCards[e.word] = makeSrsCard(e.word, e.category, "medium", {
        ease: SRS_EASE_START - Math.min(0.5, e.mistakes * 0.1),
        due: Date.now(),
        lapses: e.mistakes
      });
    });
    saveSrsCards();
  }
  state.category = loadLocal(LS_KEYS.preferredCategory, "all");
  state.difficulty = loadLocal(LS_KEYS.preferredDifficulty, "medium");
  state.duration = loadLocal(LS_KEYS.preferredDuration, 2000);
  state.soundEnabled = loadLocal(LS_KEYS.soundEnabled, false);
  state.soundVolume = loadLocal(LS_KEYS.soundVolume, 0.5);
  state.reviewMode = loadLocal(LS_KEYS.reviewMode, "mixed");
  state.chunkWords = loadLocal(LS_KEYS.chunkWords, true);
  state.darkMode = loadLocal(LS_KEYS.darkMode, false);
  // inject customs into WORDS
  rebuildCustomWordsIntoWORDS();
  // ensure SRS cards for all customs
  state.customWords.forEach(({word, category, difficulty}) => {
    if (!state.srsCards[word]) initSrsCard(word, category, difficulty);
  });
}

function recordLifetimeWord(wasCorrect) {
  const totalWords = loadLocal(LS_KEYS.totalLifetimeWords, 0) + 1;
  saveLocal(LS_KEYS.totalLifetimeWords, totalWords);
  if (wasCorrect) {
    const totalCorrect = loadLocal(LS_KEYS.lifetimeCorrect, 0) + 1;
    saveLocal(LS_KEYS.lifetimeCorrect, totalCorrect);
  }
}

// ================================
// SRS (Anki-like, SM-2 simplified) — short/long term
// ================================

// Build an SRS card record. Every card has the same shape — one factory keeps
// the stored format in a single place.
function makeSrsCard(word, category, difficulty, overrides) {
  const card = {
    word,
    category,
    difficulty,
    interval: 0,
    ease: SRS_EASE_START,
    due: Date.now(),
    reps: 0,
    lapses: 0,
    lastReviewed: 0
  };
  return Object.assign(card, overrides || {});
}

function initSrsCard(word, category, difficulty) {
  if (state.srsCards[word]) return state.srsCards[word];
  const c = makeSrsCard(word, category, difficulty);
  state.srsCards[word] = c;
  return c;
}

function getDueCards() {
  const now = Date.now();
  return Object.values(state.srsCards).filter(c => c.due <= now).sort((a,b) => a.due - b.due || b.lapses - a.lapses);
}

function updateSrsCard(word, wasCorrect) {
  const c = state.srsCards[word] || initSrsCard(word, state.currentWord?.category || "custom", state.difficulty);
  const now = Date.now();
  c.lastReviewed = now;
  if (wasCorrect) {
    c.reps += 1;
    c.ease = Math.min(SRS_EASE_MAX, c.ease + 0.12);
    if (c.reps === 1) c.interval = 1;
    else if (c.reps === 2) c.interval = 3;
    else c.interval = Math.round(c.interval * c.ease);
    // long-term vs short-term: <7 days = learning, >=21 = mature
    c.due = now + c.interval * MS_PER_DAY;
  } else {
    c.lapses += 1;
    c.reps = 0;
    c.ease = Math.max(SRS_EASE_MIN, c.ease - 0.2);
    // short-term re-review in 10 min, then again soon
    c.interval = 0;
    c.due = now + MS_PER_SHORT_REVIEW;
    // also keep in bucket for backward compat
  }
  saveSrsCards();
  renderSrsStats();
  return c;
}

function srsStats() {
  const now = Date.now();
  const all = Object.values(state.srsCards);
  const due = all.filter(c => c.due <= now).length;
  const learning = all.filter(c => c.interval > 0 && c.interval < 7).length;
  const mature = all.filter(c => c.interval >= SRS_MATURE_DAYS).length;
  return { total: all.length, due, learning, mature };
}

function renderCustomWordsList() {
  if (dom.customCountBadge) dom.customCountBadge.textContent = state.customWords.length;
  if (dom.dataWordCount) dom.dataWordCount.textContent = state.customWords.length;
  const list = dom.customWordsList;
  if (!list) return;
  const q = (dom.wordSearch && dom.wordSearch.value || "").trim().toLowerCase();
  const entries = state.customWords
    .filter(e => {
      if (!q) return true;
      const label = String(CATEGORY_LABELS[e.category] || e.category || "").toLowerCase();
      return e.word.includes(q) || label.includes(q);
    })
    .sort((a, b) => a.word.localeCompare(b.word));
  list.innerHTML = "";
  if (!entries.length) {
    const li = document.createElement("li");
    li.style.cssText = "justify-content:center;color:var(--ink-soft);font-size:12px;border-style:dashed";
    li.textContent = q ? "Nothing matches that search" : "No custom words yet";
    list.appendChild(li);
    return;
  }
  entries.forEach(entry => {
    const li = document.createElement("li");
    li.innerHTML = `<span style="font-weight:700;font-family:var(--font-display)">${escapeHtml(entry.word)}</span><span style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--ink-faint)">${escapeHtml(CATEGORY_LABELS[entry.category]||entry.category)} · ${entry.difficulty} <button data-del="${escapeHtml(entry.word)}" class="btn btn-quiet" style="padding:4px 8px;font-size:11px">✕</button></span>`;
    list.appendChild(li);
  });
  list.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const w = btn.getAttribute("data-del");
      if (confirm(`Delete "${w}"?`)) deleteCustomWord(w);
    });
  });
}

function renderSrsStats() {
  if (!dom.srsStats) return;
  const s = srsStats();
  if (!s.total) { dom.srsStats.innerHTML = '<span class="srs-empty">No SRS cards yet</span>'; return; }
  dom.srsStats.innerHTML =
    `<div class="queue-tiles">` +
    `<div class="queue-tile queue-due"><span class="queue-count">${s.due}</span><span class="queue-label">Due</span></div>` +
    `<div class="queue-tile queue-learning"><span class="queue-count">${s.learning}</span><span class="queue-label">Learning</span></div>` +
    `<div class="queue-tile queue-mastered"><span class="queue-count">${s.mature}</span><span class="queue-label">Mastered</span></div>` +
    `</div><p class="queue-total">${s.total} cards tracked</p>`;
}

const VALID_DIFFICULTIES = ["easy", "medium", "hard"];

// Categories are keyed by a slug; the human label is stored separately.
function sanitizeCategoryKey(name) {
  return String(name == null ? "" : name)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "")
    .replace(/^[0-9]+/, "")
    .slice(0, 24);
}

// ================================
// DATA MANAGEMENT PAGE + BULK IMPORT
// ================================

const IMPORT_MAX_ROWS = 5000;
const DIFFICULTY_ALIASES = {
  easy: "easy", "1": "easy", low: "easy",
  medium: "medium", normal: "medium", "2": "medium",
  hard: "hard", "3": "hard", high: "hard"
};

let dataOpener = null;
let dataHashSuppress = false;

function openDataPage(opener) {
  if (!dom.dataPage || !dom.dataPage.hidden) return;
  dataOpener = opener instanceof Element ? opener : null;
  dom.dataPage.hidden = false;
  if (location.hash !== "#data") {
    dataHashSuppress = true;
    location.hash = "data";
    dataHashSuppress = false;
  }
  renderCustomWordsList();
  renderDataCategories();
  renderDataStats();
  try { dom.dataClose.focus(); } catch (e) { /* ignore */ }
  announce("Data management open");
}

function closeDataPage() {
  if (!dom.dataPage || dom.dataPage.hidden) return;
  dom.dataPage.hidden = true;
  if (location.hash === "#data") {
    dataHashSuppress = true;
    try { history.replaceState(null, "", location.pathname + location.search); } catch (e) { location.hash = ""; }
    dataHashSuppress = false;
  }
  const backTo = dataOpener && document.contains(dataOpener) ? dataOpener : (dom.dataOpen || dom.dataOpen2);
  try { backTo.focus(); } catch (e) { /* ignore */ }
  dataOpener = null;
  announce("Back to the game");
}

function renderDataStats() {
  if (!dom.dataStats) return;
  const s = srsStats();
  dom.dataStats.textContent = `${state.customWords.length} custom · ${CATEGORY_KEYS.length} categories · ${s.due} due`;
}

function renderDataCategories() {
  const list = dom.dataCategoryList;
  if (!list) return;
  list.innerHTML = "";
  CATEGORY_KEYS.forEach(key => {
    const d = WORDS[key];
    if (!d) return;
    const count = VALID_DIFFICULTIES.reduce((n, level) => n + (d[level] ? d[level].length : 0), 0);
    const custom = !BUILTIN_CATEGORY_KEYS.includes(key);
    const li = document.createElement("li");
    li.className = "data-cat-row";
    li.innerHTML = `<span class="data-cat-name">${escapeHtml(CATEGORY_LABELS[key] || key)}</span>` +
      `<span class="data-cat-meta">${count} words${custom ? " · custom" : ""}${state.category === key || state.category === "all" ? "" : ""}</span>`;
    list.appendChild(li);
  });
}

// ---- bulk import: parse -> validate -> dedupe -> preview -> apply ----

function cleanImportCell(s) {
  return String(s == null ? "" : s)
    .replace(/\uFEFF/g, "")
    .replace(/^['"]+|['"]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeImportWord(word) {
  const cleaned = cleanImportCell(word);
  // strip edge punctuation that is not part of a word (keep ' and - inside)
  return cleaned.replace(/^[^A-Za-z0-9'-]+|[^A-Za-z0-9'-]+$/g, "");
}

function normalizeImportCategory(raw) {
  const key = sanitizeCategoryKey(raw || "");
  return key || "";
}

function importDifficulty(raw) {
  const k = cleanImportCell(raw).toLowerCase();
  if (DIFFICULTY_ALIASES[k]) return DIFFICULTY_ALIASES[k];
  return VALID_DIFFICULTIES.includes(state.difficulty) ? state.difficulty : "medium";
}

function splitCsvLine(line, delim) {
  const out = [];
  let cur = "";
  let inQuotes = false;
  const d = delim || ",";
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') { cur += '"'; i++; }
        else inQuotes = false;
      } else cur += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === d) { out.push(cur.trim()); cur = ""; }
    else cur += ch;
  }
  out.push(cur.trim());
  return out;
}

function sniffDelimiter(lines) {
  const sample = lines.slice(0, Math.min(10, lines.length)).join("\n");
  const counts = [
    ["\t", (sample.match(/\t/g) || []).length],
    [";", (sample.match(/;/g) || []).length],
    [",", (sample.match(/,/g) || []).length]
  ].sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : null;
}

const IMPORT_WORD_ALIASES = ["word", "text", "term", "title"];
const IMPORT_CATEGORY_ALIASES = ["category", "cat", "list", "topic"];
const IMPORT_DIFFICULTY_ALIASES = ["difficulty", "diff", "level", "tier"];

function importPickKey(obj, aliases) {
  for (const k of Object.keys(obj)) {
    const lk = k.toLowerCase().trim();
    if (aliases.includes(lk) && obj[k] != null && String(obj[k]).trim()) return obj[k];
  }
  return "";
}

function jsonImportRows(text) {
  const data = JSON.parse(text);
  const list = Array.isArray(data) ? data : (data && Array.isArray(data.words)) ? data.words : null;
  if (!list) throw new Error("JSON must be an array of words or {words: [...]}");
  return list.map(item => {
    if (typeof item === "string") return { word: item, category: "", difficulty: "" };
    if (item && typeof item === "object") {
      return {
        word: importPickKey(item, IMPORT_WORD_ALIASES),
        category: importPickKey(item, IMPORT_CATEGORY_ALIASES),
        difficulty: importPickKey(item, IMPORT_DIFFICULTY_ALIASES)
      };
    }
    return { word: "", category: "", difficulty: "", note: "not a word or object" };
  });
}

function csvImportRows(lines) {
  const delim = sniffDelimiter(lines);
  let colWord = 0, colCat = -1, colDiff = -1;
  let body = lines;
  if (delim) {
    const headCells = splitCsvLine(lines[0], delim).map(c => c.toLowerCase().replace(/[^a-z]/g, ""));
    if (IMPORT_WORD_ALIASES.includes(headCells[0])) {
      headCells.forEach((c, i) => {
        if (IMPORT_CATEGORY_ALIASES.includes(c)) colCat = i;
        if (IMPORT_DIFFICULTY_ALIASES.includes(c)) colDiff = i;
      });
      body = lines.slice(1);
    }
  }
  return body.map(line => {
    if (!delim) return { word: line, category: "", difficulty: "" };
    const cells = splitCsvLine(line, delim);
    if (colWord >= cells.length) return { word: "", category: "", difficulty: "", note: "empty row" };
    return {
      word: cells[colWord],
      category: colCat >= 0 ? (cells[colCat] || "") : (cells.length >= 2 ? cells[1] : ""),
      difficulty: colDiff >= 0 ? (cells[colDiff] || "") : (cells.length >= 3 ? cells[2] : "")
    };
  });
}

function parseImportText(rawText) {
  const report = { valid: [], duplicates: [], invalid: [], newCategories: new Set(), source: "" };
  const text = String(rawText == null ? "" : rawText.trim());
  if (!text) { report.source = "empty"; return report; }

  let rows;
  if (text.startsWith("[") || text.startsWith("{")) {
    try {
      rows = jsonImportRows(text);
      report.source = "json";
    } catch (err) {
      report.invalid.push({ raw: text.slice(0, 40), reason: err.message || "invalid JSON" });
      report.source = "json-broken";
      return report;
    }
  } else {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("#") && !l.startsWith("//"));
    if (!lines.length) { report.source = "empty"; return report; }
    if (lines.length > IMPORT_MAX_ROWS) {
      report.invalid.push({ raw: "(file)", reason: `too many rows (${lines.length} > ${IMPORT_MAX_ROWS})` });
      report.source = "too-large";
      return report;
    }
    rows = csvImportRows(lines);
    report.source = "csv";
  }

  // words may share letters but not casing — dedupe case-insensitively
  const seenInBatch = new Set();
  rows.forEach(r => {
    const word = normalizeImportWord(r.word).toLowerCase();
    if (!word) { report.invalid.push({ raw: r.note ? "(row)" : "(row)", reason: "no word found" }); return; }
    if (!isValidWord(word)) { report.invalid.push({ raw: word, reason: "2-30 chars, letters with hyphen/apostrophe" }); return; }
    if (seenInBatch.has(word)) { report.duplicates.push({ raw: word, reason: "duplicate in this list" }); return; }
    seenInBatch.add(word);
    if (wordExistsAnywhere(word)) { report.duplicates.push({ raw: word, reason: "already in the library" }); return; }
    if (state.customWords.some(e => e.word === word)) {
      report.duplicates.push({ raw: word, reason: "already in my words" });
      return;
    }
    const category = normalizeImportCategory(r.category) || (state.category !== "all" ? state.category : "custom");
    if (!WORDS[category]) report.newCategories.add(category);
    report.valid.push({ word, category, difficulty: importDifficulty(r.difficulty) });
  });
  return report;
}

function renderImportResult(report) {
  const el = dom.importResult;
  if (!el) return;
  if (report.source === "empty") { el.textContent = "Nothing to import yet."; return; }
  if (report.source === "too-large" || report.source === "json-broken") {
    el.textContent = report.invalid[0] ? `Problem: ${report.invalid[0].reason}` : "Could not read that.";
    return;
  }
  const bits = [`${report.valid.length} ready to add`, `${report.duplicates.length} skipped`, `${report.invalid.length} invalid`];
  el.textContent = bits.join(" · ");
}

function openImportPreview(report) {
  const lines = [];
  lines.push(`${report.valid.length} valid · ${report.duplicates.length} duplicates skipped · ${report.invalid.length} invalid.`);
  if (report.newCategories.size) lines.push(`New categories: ${[...report.newCategories].join(", ")}`);
  if (report.valid.length) {
    const sample = report.valid.slice(0, 12).map(r => {
      const cat = r.category !== state.category ? ` (${CATEGORY_LABELS[r.category] || r.category})` : "";
      return r.word + cat;
    }).join(", ");
    lines.push(`Preview: ${sample}`);
    if (report.valid.length > 12) lines.push(`and ${report.valid.length - 12} more`);
  }
  if (report.invalid.length) lines.push(`First problem: "${report.invalid[0].raw}" — ${report.invalid[0].reason}`);
  if (!report.valid.length) {
    return confirmAction({
      title: "Nothing to import",
      body: lines.join("\n"),
      actions: [{ id: "ok", label: "OK", variant: "primary" }]
    });
  }
  return confirmAction({
    title: "Import words",
    body: lines.join("\n"),
    actions: [
      { id: "cancel", label: "Cancel", variant: "quiet" },
      { id: "import", label: `Add ${report.valid.length} words`, variant: "primary" }
    ]
  });
}

function applyImport(report) {
  if (!report || !report.valid.length) return;
  // create new categories first so words never land in a broken state
  report.newCategories.forEach(key => ensureCategory(key, key));
  let added = 0, failed = 0;
  report.valid.forEach(r => {
    const res = addCustomWord(r.word, r.category, r.difficulty);
    if (res.ok) added += 1; else failed += 1;
  });
  refreshReadyState();
  const tail = report.duplicates.length ? `, ${report.duplicates.length} skipped` : "";
  if (dom.importPaste) dom.importPaste.value = "";
  if (dom.importResult) dom.importResult.textContent = `Imported ${added} words${failed ? ` (${failed} rejected)` : ""}${tail}`;
  if (dom.drawerWordsHint) dom.drawerWordsHint.textContent = `${state.customWords.length} custom words ready to practise.`;
  announce(`Imported ${added} words${tail}`);
}

function runImportPipeline(text) {
  const report = parseImportText(text);
  renderImportResult(report);
  openImportPreview(report).then(choice => {
    if (choice === "import") applyImport(report);
  });
}

function importPickFile(file) {
  if (!file || !dom.importResult) return;
  if (file.size > 2 * 1024 * 1024) {
    dom.importResult.textContent = `${file.name} is over the 2 MB limit — use a smaller file.`;
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => { if (dom.importResult) dom.importResult.textContent = `Could not read ${file.name}.`; };
  reader.onload = () => {
    const text = String(reader.result || "");
    // a trimmed  JSON object with customWords/srsCards is a full backup — restore instead
    if (/\.json$/i.test(file.name) && text.trim().startsWith("{")) {
      let probe = null;
      try { probe = JSON.parse(text); } catch (e) { probe = null; }
      if (probe && !Array.isArray(probe) && (probe.customWords || probe.srsCards || probe.version)) {
        importJSONFile(file);
        return;
      }
    }
    runImportPipeline(text);
  };
  reader.readAsText(file);
}

function exportJSON() {
  const payload = { version: 2, exportedAt: new Date().toISOString(), customWords: state.customWords, srsCards: state.srsCards, categories: Object.keys(WORDS) };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = `spellcast-export-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 1000); announce("Exported JSON");
}
function importJSONFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      const cw = Array.isArray(data.customWords) ? data.customWords : [];
      const sc = data.srsCards && typeof data.srsCards === "object" ? data.srsCards : {};
      let added=0, updated=0, skipped=0;
      cw.forEach(e => {
        if (!e || !e.word || !e.category) { skipped++; return; }
        const w = normalizeWordRaw(e.word);
        if (!isValidWord(w)) { skipped++; return; }
        const catKey = sanitizeCategoryKey(e.category);
        if (!catKey) { skipped++; return; }
        const diff = VALID_DIFFICULTIES.includes(e.difficulty) ? e.difficulty : "medium";
        const existing = state.customWords.find(x=>x.word===w);
        if (!existing) {
          if (wordExistsAnywhere(w)) { skipped++; return; }
          ensureCategory(catKey, CATEGORY_LABELS[catKey] || e.category);
          state.customWords.push({ word:w, category:catKey, difficulty:diff, addedAt:e.addedAt||Date.now() });
          if (!WORDS[catKey][diff].includes(w)) WORDS[catKey][diff].push(w);
          initSrsCard(w, catKey, diff);
          added++;
        } else updated++;
      });
      Object.keys(sc).forEach(k => {
        const incoming = sc[k];
        if (!incoming || !incoming.word) return;
        const w = normalizeWordRaw(incoming.word);
        if (!isValidWord(w)) return;
        const catKey = sanitizeCategoryKey(incoming.category) || "custom";
        const diff = VALID_DIFFICULTIES.includes(incoming.difficulty) ? incoming.difficulty : "medium";
        const existing = state.srsCards[w];
        if (!existing || (incoming.lastReviewed||0) > (existing.lastReviewed||0)) {
          ensureCategory(catKey, CATEGORY_LABELS[catKey] || incoming.category);
          state.srsCards[w] = makeSrsCard(w, catKey, diff, {
            interval: Number(incoming.interval) || 0,
            ease: Number(incoming.ease) || SRS_EASE_START,
            due: Number(incoming.due) || Date.now(),
            reps: Number(incoming.reps) || 0,
            lapses: Number(incoming.lapses) || 0,
            lastReviewed: Number(incoming.lastReviewed) || 0
          });
          const arr = WORDS[catKey][diff];
          if (arr && arr.indexOf(w) === -1) arr.push(w);
        }
      });
      saveCustomWords(); saveSrsCards(); rebuildCustomWordsIntoWORDS(); renderCustomWordsList(); renderSrsStats(); resetWordPool(); announce(`Import: ${added} added, ${updated} updated, ${skipped} skipped`);
      const toast = document.createElement("div"); toast.className="toast"; toast.innerHTML=`<span class="toast-text"><span class="toast-title">Import done</span><span class="toast-sub">${added} added · ${updated} updated · ${skipped} skipped</span></span>`; dom.toastRegion.appendChild(toast); setTimeout(()=>toast.remove(),3200);
    } catch(err){ const toast = document.createElement("div"); toast.className="toast"; toast.innerHTML=`<span class="toast-text"><span class="toast-title">Import failed</span><span class="toast-sub">${escapeHtml(err.message || "Invalid file")}</span></span>`; dom.toastRegion.appendChild(toast); setTimeout(()=>toast.remove(),4200); }
  }; reader.readAsText(file);
}

// ================================
// UI / ANIMATIONS
// ================================

function bump(el) {
  el.classList.remove("bump");
  void el.offsetWidth;
  el.classList.add("bump");
}

function flashCard(className) {
  dom.gameCard.classList.remove("correct", "incorrect");
  void dom.gameCard.offsetWidth;
  dom.gameCard.classList.add(className);
}

function showScoreFloat(points) {
  dom.scoreFloat.textContent = (points > 0 ? "+" : "") + points;
  dom.scoreFloat.classList.remove("play");
  void dom.scoreFloat.offsetWidth;
  dom.scoreFloat.classList.add("play");
}

function showMilestoneToast(milestone) {
  const toast = document.createElement("div");
  toast.className = "toast milestone";
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">${milestone.icon}</span>
    <span class="toast-text">
      <span class="toast-title">${milestone.title}</span>
      <span class="toast-sub">${milestone.sub}</span>
    </span>
  `;
  dom.toastRegion.appendChild(toast);
  announce(`${milestone.title}. ${milestone.sub}`);
  setTimeout(() => toast.remove(), 3200);
}

function showHighScoreToast() {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">🏆</span>
    <span class="toast-text">
      <span class="toast-title">New high score!</span>
      <span class="toast-sub">${state.score} points</span>
    </span>
  `;
  dom.toastRegion.appendChild(toast);
  announce(`New high score: ${state.score} points`);
  setTimeout(() => toast.remove(), 3200);
  dom.gameCard.classList.remove("new-high-score");
  void dom.gameCard.offsetWidth;
  dom.gameCard.classList.add("new-high-score");
}

function showMasteredToast(word) {
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.innerHTML = `
    <span class="toast-icon" aria-hidden="true">✓</span>
    <span class="toast-text">
      <span class="toast-title">Mastered</span>
      <span class="toast-sub">${escapeHtml(word)} — removed from bucket</span>
    </span>
  `;
  dom.toastRegion.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

function announce(text) {
  dom.srAnnouncer.textContent = text;
}

function launchConfetti() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion) return;

  const colors = ["#2D6A4F", "#C08A2E", "#C1572A", "#A6459A", "#5B4FCF"];
  const count = 18;
  const rect = dom.gameCard.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + 20;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece";
    const color = colors[Math.floor(Math.random() * colors.length)];
    piece.style.background = color;
    piece.style.left = (originX + (Math.random() - 0.5) * 220) + "px";
    piece.style.top = originY + "px";
    piece.style.animationDuration = (700 + Math.random() * 500) + "ms";
    piece.style.transform = `rotate(${Math.random() * 360}deg)`;
    dom.confettiLayer.appendChild(piece);
    setTimeout(() => piece.remove(), 1300);
  }
}

// ---- rendering: dashboard + header ----

// The strip shows the last answers as outcome-coloured segments, left to
// right, so the shape of the session is readable at a glance; the numeric
// correct/incorrect chips beside it carry the exact totals.
const SESSION_WINDOW = 12; // answers visible in the segment strip

function renderSessionProgress() {
  if (!dom.segmentRow) return;
  const history = state.answerHistory.slice(-SESSION_WINDOW);
  const segments = dom.segmentRow.querySelectorAll(".seg");
  segments.forEach((seg, i) => {
    seg.classList.toggle("is-correct", history[i] === true);
    seg.classList.toggle("is-incorrect", history[i] === false);
    // is-empty doubles as the contrast-probe anchor for "filled vs empty slot"
    seg.classList.toggle("is-empty", history[i] === undefined);
  });
  const total = state.correct + state.incorrect;
  const correctInWindow = history.filter(Boolean).length;
  dom.segmentRow.setAttribute(
    "aria-label",
    total === 0
      ? "No answers yet this session"
      : `Last ${history.length} of ${total} answer${total === 1 ? "" : "s"}: ${correctInWindow} correct, ${history.length - correctInWindow} incorrect`
  );
}

function renderStats() {
  dom.headerStreak.textContent = state.streak;

  dom.statScore.textContent = state.score;
  dom.statStreak.textContent = state.streak;
  dom.statBest.textContent = state.bestStreak;

  const attempted = state.correct + state.incorrect;
  const accuracy = attempted === 0 ? null : Math.round((state.correct / attempted) * 100);
  dom.statAccuracy.textContent = accuracy === null ? "—" : accuracy + "%";

  // the strip shows bare numbers next to a ✓/✗ mark; the words live in the
  // screen-reader-only spans
  dom.sessionCorrectCount.textContent = String(state.correct);
  dom.sessionIncorrectCount.textContent = String(state.incorrect);
  renderSessionProgress();

  dom.bucketCount.textContent = state.bucket.length;
  if (dom.bucketCount2) dom.bucketCount2.textContent = state.bucket.length;
}

function renderBucketPanel() {
  dom.bucketList.innerHTML = "";
  if (state.bucket.length === 0) {
    dom.bucketEmptyHint.hidden = false;
    return;
  }
  dom.bucketEmptyHint.hidden = true;

  // the list stays clamp-short so the accordion never needs a scrollbar —
  // the "+N more" row signals the rest without scrolling
  const VISIBLE_LIMIT = 8;
  const sorted = [...state.bucket].sort((a, b) => b.mistakes - a.mistakes);
  sorted.slice(0, VISIBLE_LIMIT).forEach((entry) => {
    const li = document.createElement("li");
    li.className = "bucket-item";
    const level = priorityLevel(entry.mistakes);
    li.innerHTML = `
      <span class="bucket-item-word">${escapeHtml(entry.word)}</span>
      <span class="bucket-item-meta">
        <span class="priority-dot priority-${level}" aria-hidden="true"></span>
        ${entry.mistakes} mistake${entry.mistakes === 1 ? "" : "s"}
      </span>
    `;
    dom.bucketList.appendChild(li);
  });
  if (sorted.length > VISIBLE_LIMIT) {
    const more = document.createElement("li");
    more.className = "bucket-item bucket-item-more";
    more.textContent = `+${sorted.length - VISIBLE_LIMIT} more in bucket`;
    dom.bucketList.appendChild(more);
  }
}

function renderCategoryStats() {
  const keys = Object.keys(state.categoryStats);
  dom.categoryStatsList.innerHTML = "";
  if (keys.length === 0) {
    dom.categoryStatsEmptyHint.hidden = false;
    return;
  }
  dom.categoryStatsEmptyHint.hidden = true;

  keys.forEach((key) => {
    const s = state.categoryStats[key];
    const pct = s.total === 0 ? 0 : Math.round((s.correct / s.total) * 100);
    const li = document.createElement("li");
    li.className = "category-stat-row";
    li.innerHTML = `
      <div class="category-stat-top">
        <span class="category-stat-name">${escapeHtml(CATEGORY_LABELS[key] || key)}</span>
        <span class="category-stat-pct">${pct}%</span>
      </div>
      <div class="category-stat-bar-track">
        <div class="category-stat-bar-fill" style="width:${pct}%"></div>
      </div>
    `;
    dom.categoryStatsList.appendChild(li);
  });
}

function recordCategoryStat(category, wasCorrect) {
  if (!state.categoryStats[category]) {
    state.categoryStats[category] = { correct: 0, total: 0 };
  }
  state.categoryStats[category].total += 1;
  if (wasCorrect) state.categoryStats[category].correct += 1;
}

// ================================
// SOUND (Web Audio API, optional, off by default)
// ================================

let audioCtx = null;

function getAudioCtx() {
  if (!audioCtx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    audioCtx = new AC();
  }
  return audioCtx;
}

function playTone(kind) {
  if (!state.soundEnabled) return;
  const ctx = getAudioCtx();
  if (!ctx) return;
  const vol = state.soundVolume || 0.5;

  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain);
  gain.connect(ctx.destination);

  let freq = 440, duration = 0.12, type = "sine";
  if (kind === "correct") { freq = 660; duration = 0.1; }
  else if (kind === "incorrect") { freq = 220; duration = 0.14; type = "sine"; }
  else if (kind === "milestone") { freq = 880; duration = 0.18; }

  osc.type = type;
  osc.frequency.setValueAtTime(freq, now);
  const safeVol = Math.max(0.0001, vol * 0.06);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(safeVol, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.start(now);
  osc.stop(now + duration + 0.02);

  if (kind === "milestone") {
    const vol2 = state.soundVolume || 0.5;
    const safeVol2 = Math.max(0.0001, vol2 * 0.06);
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1108, now + 0.1);
    gain2.gain.setValueAtTime(0.0001, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(safeVol2, now + 0.11);
    gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.28);
  }
}

// ================================
// SESSION SUMMARY
// ================================

function computeSessionSummary() {
  const attempted = state.correct + state.incorrect;
  const accuracy = attempted === 0 ? 0 : Math.round((state.correct / attempted) * 100);

  let strongest = null, weakest = null;
  let strongestPct = -1, weakestPct = 101;

  Object.keys(state.categoryStats).forEach((key) => {
    const s = state.categoryStats[key];
    if (s.total === 0) return;
    const pct = (s.correct / s.total) * 100;
    if (pct > strongestPct) { strongestPct = pct; strongest = key; }
    if (pct < weakestPct) { weakestPct = pct; weakest = key; }
  });

  return {
    score: state.score,
    accuracy,
    bestStreak: state.bestStreak,
    highScore: state.highScore,
    wordsPracticed: state.sessionWords,
    bucketAdds: state.sessionBucketAdds,
    strongest: strongest ? CATEGORY_LABELS[strongest] : "—",
    weakest: weakest ? CATEGORY_LABELS[weakest] : "—"
  };
}

function showSessionSummary() {
  stopSessionTimer();
  const summary = computeSessionSummary();
  dom.summaryScore.textContent = summary.score;
  dom.summaryAccuracy.textContent = summary.accuracy + "%";
  dom.summaryBestStreak.textContent = summary.bestStreak;
  dom.summaryHighScore.textContent = summary.highScore;
  dom.summaryWordsPracticed.textContent = summary.wordsPracticed;
  dom.summaryBucketAdds.textContent = summary.bucketAdds;
  dom.summaryStrongest.textContent = summary.strongest;
  dom.summaryWeakest.textContent = summary.weakest;
  summaryOpener = document.activeElement;
  // closing the keyboard on purpose: the overlay takes over and the parked
  // answer input must not keep a software keyboard up underneath it
  dom.answerInput.blur();
  dom.summaryOverlay.hidden = false;
  dom.summaryCloseBtn.focus();
}

// Close the recap without throwing the session away — "Keep playing" resumes
// the current session, "New session" is the explicit way to start over.
let summaryOpener = null;

function closeSummary() {
  dom.summaryOverlay.hidden = true;
  state.sessionStartTime = null;
  refreshReadyState();
  // never hand focus back to the parked answer input — that would pop a
  // software keyboard open with no visible field under it
  if (summaryOpener && summaryOpener !== dom.answerInput && document.contains(summaryOpener)) {
    try { summaryOpener.focus(); } catch (e) { /* ignore */ }
  }
  summaryOpener = null;
  announce("Recap closed. Session continues.");
}

// ================================
// CORE ANSWER HANDLING
// ================================

function handleSubmitAnswer(rawInput) {
  if (state.phase !== "type") return;
  clearSeeTimer();

  const isCorrect = checkAnswer(rawInput);
  const { word, category, fromBucket, isSrs } = state.currentWord;

  state.sessionWords += 1;
  recordCategoryStat(category, isCorrect);
  recordLifetimeWord(isCorrect);
  // ensure SRS card exists
  if (!state.srsCards[word]) initSrsCard(word, category, state.difficulty);

  if (isCorrect) {
    handleCorrectAnswer(word, category, fromBucket, isSrs);
  } else {
    handleIncorrectAnswer(word, category, rawInput, isSrs);
  }

  renderStats();
  renderSrsStats();
  refreshReadyState();
}

function handleCorrectAnswer(word, category, fromBucket, isSrs) {
  state.correct += 1;
  state.answerHistory.push(true);
  const newStreak = incrementStreak();
  // SRS update — long/short memory
  const srs = updateSrsCard(word, true);

  // The word leaves the practice bucket whenever it is answered correctly —
  // no matter which path served it (bucket pick, SRS review or fresh draw).
  const wasInBucket = removeFromBucket(word);
  // A word you got wrong before is a known weak spot: it pays the flat
  // recovery bonus instead of the streak bonus.
  const wasWeak = wasInBucket || fromBucket || srs.lapses > 0;

  let points = wasWeak ? BUCKET_MASTER_BONUS : streakBonus(newStreak);
  const graduated = !!(isSrs && srs.interval >= 21);
  const mastered = wasInBucket || graduated;

  const result = awardPoints(points);

  dom.correctHeadline.textContent = mastered ? "Mastered" : "Correct";
  dom.correctWordEcho.textContent = word;
  dom.correctPoints.textContent = "+" + points;
  dom.masteredNote.hidden = !mastered;
  dom.masteredNote.textContent = wasInBucket
    ? "Removed from practice bucket."
    : "Card graduated to mature.";

  setPhase("correct");
  flashCard("correct");
  showScoreFloat(points);
  bump(dom.statScore);
  bump(dom.statStreak);
  dom.headerStreakPill.classList.remove("streak-active");
  void dom.headerStreakPill.offsetWidth;
  dom.headerStreakPill.classList.add("streak-active");

  playTone("correct");
  announce(`Correct. ${word}. ${mastered ? "Mastered, removed from bucket." : ""} Plus ${points} points.`);

  if (mastered) {
    showMasteredToast(word);
  }
  if (result.newHighScore && state.score > 0) {
    setTimeout(() => showHighScoreToast(), 250);
  }
}

function handleIncorrectAnswer(word, category, rawInput, isSrs) {
  state.incorrect += 1;
  state.answerHistory.push(false);
  const previousStreak = resetStreak();
  updateSrsCard(word, false);
  addToBucket(word, category);

  dom.incorrectCorrectWord.textContent = word;
  dom.incorrectYourAnswer.textContent = rawInput.trim()
    ? `You wrote: ${rawInput.trim()}`
    : "You left this blank.";

  if (previousStreak > 0) {
    dom.streakTransitionNote.hidden = false;
    dom.streakTransitionNote.textContent = `Your streak: ${previousStreak} → 0`;
  } else {
    dom.streakTransitionNote.hidden = true;
  }

  setPhase("incorrect");
  flashCard("incorrect");
  playTone("incorrect");
  announce(`Not quite. The correct spelling is ${word}. Added to your practice bucket.`);
}

// ================================
// SETTINGS
// ================================

// ================================
// SETTINGS — one source of truth
// ================================
// Controls never own state: they call setSetting(), which validates, stores,
// rebuilds what depends on the value and re-renders every place the setting
// is shown. On load the controls are rendered FROM the stored state.
const SETTING_DEFS = {
  category: { label: "Category", storageKey: "preferredCategory", affectsSession: true, values: () => ["all"].concat(CATEGORY_KEYS) },
  difficulty: { label: "Difficulty", storageKey: "preferredDifficulty", affectsSession: true, values: () => ["easy", "medium", "hard"] },
  duration: { label: "Show for", storageKey: "preferredDuration", affectsSession: true, values: () => [1000, 1500, 2000, 3000, 4000] },
  reviewMode: { label: "Review mode", storageKey: "reviewMode", affectsSession: true, values: () => ["mixed", "dueOnly"] },
  soundEnabled: { label: "Sound", storageKey: "soundEnabled", affectsSession: false, values: () => [true, false] },
  soundVolume: { label: "Volume", storageKey: "soundVolume", affectsSession: false, values: () => [0, 0.25, 0.5, 0.75, 1] },
  chunkWords: { label: "Word chunks", storageKey: "chunkWords", affectsSession: false, values: () => [true, false] },
  darkMode: { label: "Dark mode", storageKey: "darkMode", affectsSession: false, values: () => [true, false] }
};

function settingLabel(key, value) {
  if (key === "category") return value === "all" ? "All categories" : (CATEGORY_LABELS[value] || value);
  if (key === "difficulty") return value.charAt(0).toUpperCase() + value.slice(1);
  if (key === "duration") return (value / 1000) + "s";
  if (key === "reviewMode") return value === "dueOnly" ? "Due only" : "Mixed";
  if (key === "soundVolume") return Math.round(value * 100) + "%";
  if (typeof value === "boolean") return value ? "On" : "Off";
  return String(value);
}

function setSetting(key, value, options) {
  const def = SETTING_DEFS[key];
  if (!def) return false;
  const opts = options || {};
  if (!def.values().includes(value)) return false;
  state[key] = value;
  saveLocal(LS_KEYS[def.storageKey], value);
  if (key === "category" || key === "difficulty") resetWordPool();
  if (key === "soundEnabled") {
    setSoundToggleUI(value);
    if (value) { getAudioCtx(); playTone("correct"); }
  }
  if (key === "darkMode") applyTheme();
  if (key === "chunkWords" && state.currentWord && (state.phase === "see" || state.phase === "type")) {
    renderWordDisplay(state.currentWord.word); // take effect on the word on screen
  }
  applySettingsToForm();
  if (opts.announce !== false) announce(`${def.label}: ${settingLabel(key, value)}`);
  return true;
}

// A session is "in progress" once a word has been answered or is on screen.
function sessionInProgress() {
  return state.sessionWords > 0 || state.phase === "see" || state.phase === "type" || state.phase === "correct" || state.phase === "incorrect";
}

function sessionAccuracyText() {
  const attempted = state.correct + state.incorrect;
  if (!attempted) return "0% correct";
  return Math.round((state.correct / attempted) * 100) + "% correct";
}

// Settings that change what you practise ask first when a session is running.
async function requestSettingChange(key, value) {
  const def = SETTING_DEFS[key];
  if (!def) return;
  if (!def.affectsSession || !sessionInProgress()) {
    setSetting(key, value);
    return;
  }
  const choice = await confirmAction({
    title: `Change ${def.label.toLowerCase()} to ${settingLabel(key, value)}?`,
    body: `This ends your current session (${state.sessionWords} answered, ${sessionAccuracyText()}). Every answer you have given is already saved in the review deck — only the session score and streak start over.`,
    actions: [
      { id: "keep", label: "Keep current session", variant: "quiet" },
      { id: "switch", label: "Switch & start fresh", variant: "primary" }
    ]
  });
  if (choice === "switch") {
    resetSession();
    setSetting(key, value);
  } else {
    // revert the control to the stored value
    applySettingsToForm();
  }
}

function applyTheme() {
  const on = !!state.darkMode;
  if (on) {
    document.documentElement.setAttribute("data-theme", "dark");
    dom.themeLabel.textContent = "Dark mode on";
  } else {
    document.documentElement.removeAttribute("data-theme");
    dom.themeLabel.textContent = "Dark mode off";
  }
}

function applySettingsToForm() {
  // Controls are rendered FROM the stored state, never the other way round.
  dom.categorySelect.value = state.category;
  dom.difficultySelect.value = state.difficulty;
  if (dom.difficultyTag) {
    dom.difficultyTag.textContent = state.difficulty.charAt(0).toUpperCase() + state.difficulty.slice(1);
  }
  dom.durationSelect.value = String(state.duration);
  if (dom.reviewModeSelect) dom.reviewModeSelect.value = state.reviewMode;
  setSoundToggleUI(state.soundEnabled);
  setChunkToggleUI(state.chunkWords);
  dom.volumeSlider.value = Math.round(state.soundVolume * 100);
  if (dom.volumeField) dom.volumeField.hidden = !state.soundEnabled;
  applyTheme();
}

function setSoundToggleUI(enabled) {
  dom.soundToggle.setAttribute("aria-checked", String(enabled));
  dom.soundToggle.querySelector(".toggle-state").textContent = enabled ? "On" : "Off";
  if (dom.volumeField) {
    dom.volumeField.hidden = !enabled;
  }
}

function setChunkToggleUI(enabled) {
  dom.chunkToggle.setAttribute("aria-checked", String(enabled));
  dom.chunkToggle.querySelector(".toggle-state").textContent = enabled ? "On" : "Off";
}

// Virtual keyboards refuse the suggestion strip (and the clipboard chip) for
// password fields — so on touch devices the answer input is a password field
// and `-webkit-text-security: none` renders the typed letters as plain text.
// Fine-pointers (desktop mouse/trackpad) never see keyboard bars, so the field
// stays a regular text input there, managed by `autocomplete="new-password"`.
// The answer mirror shows what was typed while the underlying field is a
// password field (phone keyboards) — see applyAnswerFieldMode.
function syncAnswerMirror() {
  if (dom.answerMirror) dom.answerMirror.textContent = dom.answerInput.value;
}

function applyAnswerFieldMode() {
  const input = dom.answerInput;
  if (!input) return;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  const plainPassword = typeof CSS !== "undefined" && CSS.supports && CSS.supports("-webkit-text-security", "none");
  if (coarse && plainPassword) {
    input.setAttribute("type", "password");
    input.style.setProperty("-webkit-text-security", "none");
    // "new-password" on a password field invites generate-password popups;
    // a plain off clears autofill without that side effect
    input.setAttribute("autocomplete", "off");
    input.removeAttribute("data-1p-ignore");
    input.form.classList.add("password-mode");
  } else {
    input.setAttribute("type", "text");
    input.style.removeProperty("-webkit-text-security");
    input.setAttribute("autocomplete", "new-password");
    input.setAttribute("data-1p-ignore", "true");
    input.form.classList.remove("password-mode");
  }
  input.setAttribute("data-lpignore", "true");
  input.setAttribute("data-form-type", "other");
}

function toggleSettingsPanel() {
  const isHidden = dom.settingsPanel.hidden;
  dom.settingsPanel.hidden = !isHidden;
  dom.settingsToggle.setAttribute("aria-expanded", String(isHidden));
  document.body.classList.toggle("settings-open", isHidden);
}

// ================================
// RESETS
// ================================

function resetSession() {
  clearSeeTimer();
  stopSessionTimer();
  state.sessionStartTime = null;
  state.score = 0;
  state.streak = 0;
  state.correct = 0;
  state.incorrect = 0;
  state.answerHistory = [];
  state.sessionWords = 0;
  state.sessionBucketAdds = 0;
  state.categoryStats = {};
  state.bucket = [];
  state.sessionRecordAtStart = state.highScore;
  state.recordCelebrated = false;
  saveBucket();
  resetWordPool();

  applyStreakTheme(0);
  renderStats();
  renderBucketPanel();
  renderCategoryStats();
  setPhase("ready");
  announce("Session reset. High score and best streak are preserved.");
}

// Rebuild the word list from the pristine built-in snapshot and remove every
// custom category (options, labels and key list included).
function restoreBuiltinCategories() {
  Object.keys(WORDS).forEach((k) => delete WORDS[k]);
  Object.assign(WORDS, JSON.parse(JSON.stringify(BUILTIN_WORDS)));
  Object.keys(CATEGORY_LABELS).forEach((k) => {
    if (!BUILTIN_WORDS[k]) delete CATEGORY_LABELS[k];
  });
  CATEGORY_KEYS.length = 0;
  CATEGORY_KEYS.push(...BUILTIN_CATEGORY_KEYS);
  [dom.categorySelect, dom.customWordCategory].forEach((sel) => {
    if (!sel) return;
    [...sel.options].forEach((opt) => {
      if (!BUILTIN_CATEGORY_KEYS.includes(opt.value)) opt.remove();
    });
  });
}

function resetAllData() {
  Object.values(LS_KEYS).forEach((key) => {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  });

  // The in-memory state must go too — otherwise the next save writes the
  // "deleted" data straight back into localStorage.
  state.highScore = 0;
  state.bestStreak = 0;
  state.bucket = [];
  state.customWords = [];
  state.srsCards = {};
  state.reviewMode = "mixed";
  state.category = "all";
  state.difficulty = "medium";
  state.duration = 2000;
  state.soundEnabled = false;
  state.soundVolume = 0.5;
  state.darkMode = false;

  restoreBuiltinCategories();

  document.documentElement.removeAttribute("data-theme");
  dom.themeIcon.textContent = "🌙";
  dom.themeLabel.textContent = "Dark mode off";

  resetSession();
  applySettingsToForm();
  renderCustomWordsList();
  renderSrsStats();
  if (dom.reviewModeSelect) dom.reviewModeSelect.value = state.reviewMode;
  announce("All saved progress has been deleted.");
}

// ================================
// EVENT LISTENERS
// ================================

// True when the event came from a control the user is typing into.
function isTextEntryTarget(el) {
  if (!el) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || !!el.isContentEditable;
}

// ================================
// CONFIRM DIALOG
// ================================
// One reusable promise-based dialog for every "are you sure?" in the app:
// changing a setting mid-session, finishing early, resetting the session and
// deleting all data. It traps focus, suspends the game key handlers, pauses
// the session clock and returns focus to whatever opened it.
let actionDialogResolver = null;
let actionDialogOpener = null;
let actionDialogWasRunning = false;

function confirmAction({ title, body, actions, requireText, requireLabel }) {
  return new Promise((resolve) => {
    dom.actionDialogTitle.textContent = title;
    dom.actionDialogBody.textContent = body || "";
    dom.actionDialogBody.hidden = !body;

    // optional "type DELETE to confirm" gate
    if (requireText) {
      dom.actionDialogRequire.hidden = false;
      dom.actionDialogRequireLabel.textContent = requireLabel || `Type ${requireText} to confirm`;
      dom.actionDialogInput.value = "";
      dom.actionDialogInput.dataset.expect = requireText;
    } else {
      dom.actionDialogRequire.hidden = true;
      dom.actionDialogInput.value = "";
      delete dom.actionDialogInput.dataset.expect;
    }

    // buttons
    dom.actionDialogActions.innerHTML = "";
    actions.forEach((action) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "btn btn-" + (action.variant || "quiet");
      btn.textContent = action.label;
      btn.dataset.actionId = action.id;
      btn.addEventListener("click", () => {
        // a required confirmation word gates the action buttons (case-sensitive:
        // the label says exactly what to type)
        const expect = dom.actionDialogInput.dataset.expect;
        if (expect && dom.actionDialogInput.value.trim() !== expect) {
          dom.actionDialogInput.focus();
          announce("Type the confirmation word to continue.");
          return;
        }
        closeActionDialog(action.id);
      });
      dom.actionDialogActions.appendChild(btn);
    });

    actionDialogResolver = resolve;
    actionDialogOpener = document.activeElement;
    actionDialogWasRunning = !!state.sessionStartTime;
    if (actionDialogWasRunning) stopSessionTimer(); // pause the session clock
    dom.actionDialog.hidden = false;
    document.body.classList.add("dialog-open");

    // focus: the confirmation input, else the primary action, else the first button
    const first = dom.actionDialogActions.querySelector(".btn-primary") || dom.actionDialogActions.querySelector("button");
    if (requireText) dom.actionDialogInput.focus();
    else if (first) first.focus();
  });
}

function closeActionDialog(actionId) {
  if (!actionDialogResolver) return;
  const resolve = actionDialogResolver;
  actionDialogResolver = null;
  dom.actionDialog.hidden = true;
  document.body.classList.remove("dialog-open");
  // resume the session clock where it left off
  if (actionDialogWasRunning) {
    actionDialogWasRunning = false;
    startSessionTimer();
  }
  // return focus to the opener
  if (actionDialogOpener && document.contains(actionDialogOpener)) {
    try { actionDialogOpener.focus(); } catch (e) { /* ignore */ }
  }
  actionDialogOpener = null;
  resolve(actionId);
}

// Keep Tab inside the open dialog.
function trapDialogFocus(e) {
  if (e.key !== "Tab" || dom.actionDialog.hidden) return;
  const focusables = dom.actionDialog.querySelectorAll("button, input, [href], select, textarea");
  if (!focusables.length) return;
  const first = focusables[0];
  const last = focusables[focusables.length - 1];
  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}

function anyModalOpen() {
  return !dom.actionDialog.hidden || !dom.summaryOverlay.hidden;
}

function attachEventListeners() {
  dom.startBtn.addEventListener("click", () => {
    beginRound();
  });

  // Pasting into the answer field: allowed in general (password managers,
  // natural text entry), but the target word itself may not arrive via the
  // clipboard — desktop, drag-and-drop, or a mobile keyboard all count.
  dom.answerInput.addEventListener("paste", (e) => {
    if (state.phase !== "type") return;
    const text = e.clipboardData ? (e.clipboardData.getData("text") || "").trim().toLowerCase() : "";
    const word = state.currentWord ? state.currentWord.word.toLowerCase() : "";
    if (!word || !text.includes(word)) return;
    e.preventDefault();
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `<span class="toast-text"><span class="toast-title">No pasting</span><span class="toast-sub">Type it from memory — that's the practice.</span></span>`;
    dom.toastRegion.appendChild(toast);
    setTimeout(() => toast.remove(), 2600);
  });
  dom.answerInput.addEventListener("drop", (e) => {
    e.preventDefault();
    if (state.phase !== "type") return;
    dom.answerInput.focus();
  });

  dom.answerInput.addEventListener("input", syncAnswerMirror);

  dom.answerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    handleSubmitAnswer(dom.answerInput.value);
  });

  dom.nextAfterCorrectBtn.addEventListener("click", beginRound);
  dom.nextAfterIncorrectBtn.addEventListener("click", beginRound);

  // Enter-to-advance on result screens (without hijacking the type input, which uses its own form submit).
  // Enter is never hijacked while the user is typing into a field, and never
  // while a modal is open.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (anyModalOpen()) return;
    if (state.phase === "correct" || state.phase === "incorrect") {
      // the parked answer input keeps focus (keyboard stays up) — Enter on it
      // must still advance; every other text field keeps its Enter behaviour
      if (isTextEntryTarget(e.target) && e.target !== dom.answerInput) return;
      e.preventDefault();
      beginRound();
    } else if (state.phase === "ready" && !isTextEntryTarget(e.target) && document.activeElement !== dom.answerInput) {
      // allow starting with Enter when focus isn't inside a form control
      const tag = document.activeElement.tagName;
      if (tag !== "SELECT" && tag !== "BUTTON") {
        beginRound();
      }
    }
  });

  // Space jumps straight to typing during the memorise phase — the "skip
  // ahead" button does the same for touch. Enter and Esc keep their existing
  // jobs, and Space is never hijacked while typing or while a modal is open.
  if (dom.seeAdvanceBtn) dom.seeAdvanceBtn.addEventListener("click", goToTypePhase);
  document.addEventListener("keydown", (e) => {
    if (e.key !== " " || state.phase !== "see" || anyModalOpen()) return;
    const tag = e.target && e.target.tagName;
    if (tag === "BUTTON" || tag === "SELECT" || tag === "TEXTAREA") return;
    if (isTextEntryTarget(e.target)) return;
    e.preventDefault();
    goToTypePhase();
  });

  dom.settingsToggle.addEventListener("click", toggleSettingsPanel);

  dom.categorySelect.addEventListener("change", () => {
    requestSettingChange("category", dom.categorySelect.value);
  });

  dom.difficultySelect.addEventListener("change", () => {
    requestSettingChange("difficulty", dom.difficultySelect.value);
  });

  dom.durationSelect.addEventListener("change", () => {
    requestSettingChange("duration", Number(dom.durationSelect.value));
  });

  dom.soundToggle.addEventListener("click", () => {
    setSetting("soundEnabled", !state.soundEnabled);
  });

  dom.chunkToggle.addEventListener("click", () => {
    setSetting("chunkWords", !state.chunkWords);
  });

  dom.volumeSlider.addEventListener("input", () => {
    setSetting("soundVolume", parseInt(dom.volumeSlider.value) / 100, { announce: false });
  });

  if (dom.addWordForm) {
    dom.addWordForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const raw = dom.customWordInput.value;
      const cat = dom.customWordCategory.value;
      const diff = dom.customWordDifficulty.value;
      const res = addCustomWord(raw, cat, diff);
      if (!res.ok) {
        showFieldError(res.error);
      } else {
        showFieldError("");
        dom.customWordInput.value = "";
        dom.customWordInput.focus();
      }
    });
  }
  if (dom.createCategoryBtn) {
    dom.createCategoryBtn.addEventListener("click", () => {
      const name = dom.newCategoryInput.value.trim();
      const key = sanitizeCategoryKey(name);
      if (!name) { showFieldError("Enter a category name."); return; }
      if (!key) { showFieldError("Use letters or numbers only."); return; }
      if (WORDS[key]) { showFieldError(`"${name}" already exists.`); return; }
      ensureCategory(key, name);
      dom.newCategoryInput.value = "";
      dom.customWordCategory.value = key;
      renderCustomWordsList();
      refreshReadyState();
      announce(`Category ${name} created`);
    });
  }
  if (dom.exportBtn) dom.exportBtn.addEventListener("click", exportJSON);
  if (dom.importBtn && dom.importFile) {
    dom.importBtn.addEventListener("click", () => dom.importFile.click());
    dom.importFile.addEventListener("change", () => { const f = dom.importFile.files[0]; if (f) importJSONFile(f); dom.importFile.value = ""; });
  }
  // Data management page + bulk import
  document.querySelectorAll("[data-open-data]").forEach(btn => {
    btn.addEventListener("click", () => openDataPage(btn));
  });
  if (dom.dataClose) dom.dataClose.addEventListener("click", () => closeDataPage());
  window.addEventListener("hashchange", () => {
    if (dataHashSuppress) return;
    if (location.hash === "#data") openDataPage(document.activeElement);
    else closeDataPage();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dom.dataPage && !dom.dataPage.hidden && dom.actionDialog.hidden) closeDataPage();
  });
  if (location.hash === "#data") openDataPage(null);
  if (dom.wordSearch) dom.wordSearch.addEventListener("input", () => renderCustomWordsList());
  if (dom.importPickBtn && dom.importPick) {
    dom.importPickBtn.addEventListener("click", () => dom.importPick.click());
    dom.importPick.addEventListener("change", () => { const f = dom.importPick.files[0]; if (f) importPickFile(f); dom.importPick.value = ""; });
  }
  if (dom.importParseBtn) {
    dom.importParseBtn.addEventListener("click", () => { if (dom.importPaste) runImportPipeline(dom.importPaste.value); });
  }
  if (dom.reviewModeSelect) {
    dom.reviewModeSelect.value = state.reviewMode;
    dom.reviewModeSelect.addEventListener("change", () => {
      requestSettingChange("reviewMode", dom.reviewModeSelect.value);
    });
  }

  // dark mode toggle
  dom.themeToggle.addEventListener("click", () => {
    setSetting("darkMode", !state.darkMode);
  });

  // skip button during type phase
  dom.skipBtn.addEventListener("click", () => {
    if (state.phase !== "type") return;
    const word = state.currentWord?.word;
    const category = state.currentWord?.category;
    clearSeeTimer();
    state.sessionWords += 1;    // a skipped word still happened
    updateSrsCard(word, false); // and comes back for a short review
    addToBucket(word, category);
    // don't count as incorrect for streak
    announce(`Skipped ${word}. Added to practice bucket.`);
    renderStats();
    beginRound();
  });

  // back button after incorrect
  dom.backAfterIncorrectBtn.addEventListener("click", () => {
    if (state.phase === "incorrect") {
      setPhase("type");
      dom.answerInput.value = "";
      syncAnswerMirror();
      requestAnimationFrame(() => dom.answerInput.focus());
    }
  });

  // reset session confirmation
  dom.resetSessionBtn.addEventListener("click", async () => {
    const choice = await confirmAction({
      title: "Reset this session?",
      body: `${state.sessionWords} answered ${state.sessionWords === 1 ? "word" : "words"} will be discarded. Your high score, best streak and review deck stay.`,
      actions: [
        { id: "cancel", label: "Cancel", variant: "quiet" },
        { id: "reset", label: "Reset session", variant: "primary" }
      ]
    });
    if (choice === "reset") resetSession();
  });

  dom.resetAllBtn.addEventListener("click", async () => {
    const choice = await confirmAction({
      title: "Delete all data?",
      body: "This removes everything SpellCast has stored in this browser: high score, best streak, lifetime stats, your custom words and categories, the whole review deck, and your settings. It cannot be undone.",
      requireText: "DELETE",
      requireLabel: "Type DELETE to confirm",
      actions: [
        { id: "cancel", label: "Cancel", variant: "quiet" },
        { id: "delete", label: "Delete everything", variant: "danger" }
      ]
    });
    if (choice === "delete") resetAllData();
  });

  // The right deck is an accordion: opening one section closes the others, so
  // the deck never grows past a single panel — no scrollbars anywhere. The
  // `name` attribute gives this natively in modern browsers; the toggle
  // listener is the fallback that keeps the promise in older ones. The panels
  // are plain <summary> toggles now, so aria-expanded tracks itself.
  const deckSections = Array.from(document.querySelectorAll(".deck-right .session-group"));
  deckSections.forEach((section) => {
    section.addEventListener("toggle", () => {
      if (!section.open) return;
      deckSections.forEach((other) => {
        if (other !== section) other.open = false;
      });
      if (section.id === "categoryStatsPanel") renderCategoryStats();
    });
  });

  // session timer
  // Finish is the low-key way out: if words are still unrevealed in the
  // current deck pass it asks once before opening the recap.
  dom.finishSessionBtn.addEventListener("click", async () => {
    const pending = state.deckRevealed < poolSize();
    if (!pending || !state.sessionWords) {
      showSessionSummary();
      return;
    }
    const choice = await confirmAction({
      title: "Finish session?",
      body: "You still have words left in this deck. Finishing shows your recap now, and you can always start a new session after.",
      actions: [
        { id: "cancel", label: "Keep going", variant: "quiet" },
        { id: "finish", label: "Finish", variant: "primary" }
      ]
    });
    if (choice === "finish") showSessionSummary();
  });

  // the shared confirm dialog: Esc cancels, backdrop cancels, Tab is trapped
  document.addEventListener("keydown", (e) => {
    if (dom.actionDialog.hidden) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeActionDialog("cancel");
      return;
    }
    if (e.key === "Enter" && dom.actionDialogInput.dataset.expect && document.activeElement === dom.actionDialogInput) {
      e.preventDefault();
      const btn = dom.actionDialogActions.querySelector(".btn-danger") || dom.actionDialogActions.querySelector(".btn-primary");
      if (btn) btn.click();
      return;
    }
    trapDialogFocus(e);
  });

  dom.actionDialog.addEventListener("click", (e) => {
    if (e.target === dom.actionDialog) closeActionDialog("cancel");
  });

  // keyboard shortcuts — a single Escape handler for the whole app.
  // Modals take priority over the game.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!dom.actionDialog.hidden) {
      closeActionDialog("cancel");
      return;
    }
    if (!dom.summaryOverlay.hidden) {
      closeSummary();
      return;
    }
    if (state.phase === "type") {
      e.preventDefault();
      dom.skipBtn.click();
    }
  });

  dom.summaryCloseBtn.addEventListener("click", closeSummary);
  if (dom.summaryNewSessionBtn) {
    dom.summaryNewSessionBtn.addEventListener("click", () => {
      dom.summaryOverlay.hidden = true;
      resetSession();
    });
  }

  // close the recap on backdrop click
  dom.summaryOverlay.addEventListener("click", (e) => {
    if (e.target === dom.summaryOverlay) {
      closeSummary();
    }
  });
}

// ================================
// INITIALIZATION
// ================================

function init() {
  migrateLegacyStorage();
  saveLocal(LS_KEYS.schemaVersion, SCHEMA_VERSION);
  loadAllPersisted();
  applySettingsToForm();
  buildPool();
  applyStreakTheme(0);
  renderStats();
  renderBucketPanel();
  renderCategoryStats();
  renderCustomWordsList();
  renderSrsStats();
  if (dom.reviewModeSelect) dom.reviewModeSelect.value = state.reviewMode;
  // restore dark mode + volume through the single settings renderer
  state.sessionRecordAtStart = state.highScore;
  // belt-and-braces in case of stale cached HTML: keep autofill and virtual
  // keyboard suggestions off the answer field (Chrome ignores autocomplete=off)
  dom.answerInput.setAttribute("autocapitalize", "none");
  dom.answerInput.setAttribute("autocorrect", "off");
  dom.answerInput.setAttribute("spellcheck", "false");
  applyAnswerFieldMode();
  // mobile takes the settings sheet compact — start with "My words" collapsed
  const myWordsDetails = document.querySelector("#settingsPanel details");
  if (myWordsDetails && window.matchMedia("(max-width: 999px)").matches) myWordsDetails.removeAttribute("open");
  refreshReadyState();
  setPhase("ready");
  attachEventListeners();
}

document.addEventListener("DOMContentLoaded", init);

