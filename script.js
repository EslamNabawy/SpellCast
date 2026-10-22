/* ==========================================================================
   SPELLSPRINT — SCRIPT.JS
   Vanilla JS spelling trainer. No frameworks, no build step, no backend.
   ========================================================================== */

// ================================
// WORD DATABASE
// ================================

const WORDS = {
  nouns: {
    easy: [
      "apple", "window", "garden", "school", "river", "planet", "pencil",
      "bottle", "forest", "bridge", "island", "market", "engine", "castle"
    ],
    medium: [
      "mountain", "computer", "library", "keyboard", "umbrella", "calendar",
      "backpack", "telescope", "sandwich", "notebook", "elephant", "orchestra"
    ],
    hard: [
      "restaurant", "architecture", "phenomenon", "questionnaire", "laboratory",
      "atmosphere", "infrastructure", "parliament", "bureaucracy", "chronology"
    ]
  },
  verbs: {
    easy: [
      "accept", "believe", "explain", "manage", "suggest", "arrive", "borrow",
      "listen", "travel", "answer", "happen", "follow"
    ],
    medium: [
      "achieve", "calculate", "discover", "imagine", "improve", "remember",
      "understand", "recognize", "encourage", "establish", "negotiate", "demonstrate"
    ],
    hard: [
      "differentiate", "hypothesize", "accommodate", "substantiate", "reconcile",
      "exacerbate", "perpetuate", "circumvent", "corroborate", "extrapolate"
    ]
  },
  adjectives: {
    easy: [
      "careful", "different", "excellent", "familiar", "possible", "terrible",
      "honest", "curious", "gentle", "narrow", "recent", "simple"
    ],
    medium: [
      "beautiful", "difficult", "important", "necessary", "successful",
      "valuable", "reliable", "generous", "peculiar", "ambitious", "efficient", "sensible"
    ],
    hard: [
      "conscientious", "miscellaneous", "indispensable", "unprecedented",
      "quintessential", "incomprehensible", "idiosyncratic", "unequivocal",
      "irrevocable", "ubiquitous"
    ]
  },
  adverbs: {
    easy: [
      "actually", "finally", "quickly", "usually", "easily", "openly",
      "safely", "loudly", "gently", "nearly"
    ],
    medium: [
      "carefully", "completely", "especially", "generally", "immediately",
      "probably", "recently", "naturally", "obviously", "frequently", "eventually", "seriously"
    ],
    hard: [
      "unquestionably", "simultaneously", "disproportionately", "indiscriminately",
      "unequivocally", "conscientiously", "unprecedentedly", "inadvertently"
    ]
  },
  commonlyMisspelled: {
    easy: [
      "separate", "definitely", "receive", "believe", "friend", "weird",
      "until", "beginning", "writing", "argument"
    ],
    medium: [
      "necessary", "embarrass", "occurrence", "privilege", "restaurant",
      "environment", "government", "maintenance", "recommend", "existence",
      "occasion", "similar"
    ],
    hard: [
      "accommodate", "conscientious", "unnecessarily", "questionnaire",
      "millennium", "supersede", "liaison", "inoculate", "consensus", "minuscule"
    ]
  },
  advanced: {
    easy: [
      "hierarchy", "independent", "fluorescent", "pronunciation", "vacuum",
      "rhythm", "pseudonym", "synonym"
    ],
    medium: [
      "entrepreneur", "questionnaire", "perseverance", "occasionally",
      "disappointment", "recommendation", "acknowledgment", "phenomenon",
      "extraordinary", "sophisticated"
    ],
    hard: [
      "miscellaneous", "conscientious", "onomatopoeia", "idiosyncrasy",
      "chiaroscuro", "bureaucratic", "unparalleled", "inextricable",
      "pharmaceutical", "counterintuitive"
    ]
  },
  animals: {
    easy: [
      "lion", "tiger", "zebra", "panda", "koala", "camel", "turtle",
      "rabbit", "monkey", "parrot", "dolphin", "penguin", "giraffe", "jaguar"
    ],
    medium: [
      "cheetah", "gorilla", "leopard", "squirrel", "crocodile", "flamingo",
      "kangaroo", "octopus", "pelican", "chimpanzee", "hedgehog", "armadillo"
    ],
    hard: [
      "rhinoceros", "hippopotamus", "platypus", "orangutan", "chameleon",
      "caterpillar", "nightingale", "albatross", "chrysalis", "axolotl"
    ]
  },
  food: {
    easy: [
      "pizza", "pasta", "banana", "orange", "tomato", "cheese", "cookie",
      "burger", "salad", "sushi", "bagel", "donut", "waffle", "pancake"
    ],
    medium: [
      "spaghetti", "chocolate", "cinnamon", "broccoli", "strawberry",
      "pineapple", "sandwich", "casserole", "guacamole", "croissant",
      "lasagna", "margarine"
    ],
    hard: [
      "mayonnaise", "mozzarella", "prosciutto", "cauliflower", "pomegranate",
      "asparagus", "bouillabaisse", "charcuterie", "pumpernickel", "connoisseur"
    ]
  },
  science: {
    easy: [
      "atom", "cell", "gravity", "energy", "magnet", "planet", "orbit",
      "fossil", "climate", "oxygen", "protein", "virus"
    ],
    medium: [
      "molecule", "electron", "neutron", "galaxy", "ecosystem", "evolution",
      "photosynthesis", "chromosome", "laboratory", "hypothesis", "quantum", "isotope"
    ],
    hard: [
      "electromagnetic", "photosynthesis", "thermodynamics", "crystallography",
      "astrophysics", "bioluminescence", "paleontology", "spectroscopy",
      "neurotransmitter", "deoxyribonucleic"
    ]
  },
  technology: {
    easy: [
      "keyboard", "monitor", "battery", "router", "browser", "network",
      "printer", "software", "hardware", "sensor"
    ],
    medium: [
      "algorithm", "database", "encryption", "interface", "protocol",
      "bandwidth", "firewall", "malware", "pixel", "bluetooth", "satellite", "semiconductor"
    ],
    hard: [
      "cryptocurrency", "virtualization", "microprocessor", "asynchronous",
      "authentication", "infrastructure", "blockchain", "interoperability",
      "cybersecurity", "telecommunications"
    ]
  },
  nature: {
    easy: [
      "forest", "desert", "river", "meadow", "valley", "canyon", "island",
      "glacier", "volcano", "waterfall"
    ],
    medium: [
      "wilderness", "ecosystem", "peninsula", "archipelago", "tundra",
      "savanna", "wetland", "aurora", "estuary", "geyser", "lagoon", "mangrove"
    ],
    hard: [
      "archipelago", "biodiversity", "precipitation", "photosynthesis",
      "topography", "cataclysmic", "equinox", "solstice", "biodegradable", "deforestation"
    ]
  },
  sports: {
    easy: [
      "soccer", "tennis", "hockey", "cricket", "rugby", "boxing",
      "archery", "bowling", "cycling", "karate"
    ],
    medium: [
      "tournament", "championship", "athlete", "gymnastics", "marathon",
      "badminton", "volleyball", "handball", "fencing", "triathlon", "sprint", "defense"
    ],
    hard: [
      "decathlon", "steeplechase", "sportsmanship", "ambidextrous",
      "physiotherapy", "tactician", "quarterback", "interception",
      "recreational", "professionalism"
    ]
  }
};

const CATEGORY_LABELS = {
  nouns: "Nouns",
  verbs: "Verbs",
  adjectives: "Adjectives",
  adverbs: "Adverbs",
  commonlyMisspelled: "Commonly Misspelled",
  advanced: "Advanced",
  animals: "Animals",
  food: "Food",
  science: "Science",
  technology: "Technology",
  nature: "Nature",
  sports: "Sports"
};

const CATEGORY_KEYS = Object.keys(WORDS);

// Pristine snapshot of the built-in word list.
// Custom words and custom categories are injected into WORDS at runtime, so we
// keep an untouched copy to rebuild from when the user wipes their data.
const BUILTIN_WORDS = JSON.parse(JSON.stringify(WORDS));
const BUILTIN_CATEGORY_KEYS = Object.keys(BUILTIN_WORDS);

// Find the real category + difficulty a word belongs to (used for SRS cards).
function findWordMeta(word) {
  for (const cat of Object.keys(WORDS)) {
    for (const diff of ["easy", "medium", "hard"]) {
      const arr = WORDS[cat][diff];
      if (arr && arr.indexOf(word) !== -1) return { category: cat, difficulty: diff };
    }
  }
  return null;
}

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

// ================================
// STORAGE KEYS
// ================================

const LS_KEYS = {
  highScore: "spellsprint.highScore",
  bestStreak: "spellsprint.bestStreak",
  totalLifetimeWords: "spellsprint.totalLifetimeWords",
  lifetimeCorrect: "spellsprint.lifetimeCorrect",
  preferredCategory: "spellsprint.preferredCategory",
  preferredDifficulty: "spellsprint.preferredDifficulty",
  preferredDuration: "spellsprint.preferredDuration",
  soundEnabled: "spellsprint.soundEnabled",
  soundVolume: "spellsprint.soundVolume",
  bucket: "spellsprint.bucket",
  customWords: "spellsprint.customWords",
  srsCards: "spellsprint.srsCards",
  reviewMode: "spellsprint.reviewMode",
  darkMode: "spellsprint.darkMode"
};

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

  currentWord: null,     // { word, category, fromBucket }
  currentThemeKey: "normal",

  bucket: [],             // [{ word, category, mistakes }]

  category: "all",
  difficulty: "medium",
  duration: 2000,
  soundEnabled: false,

  sessionWords: 0,
  sessionBucketAdds: 0,
  sessionRecordAtStart: 0, // the all-time record this session is trying to beat
  recordCelebrated: false,  // ensures the "new high score" toast fires once

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
  sessionTimerHandle: null,
  wordsSeen: [] // words shown in this session, for the "Word N of M" chip
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
  headerBest: document.getElementById("headerBest"),
  headerScore: document.getElementById("headerScore"),
  headerAccuracy: document.getElementById("headerAccuracy"),
  headerTimerPill: document.getElementById("headerTimerPill"),
  stateBanner: document.getElementById("stateBanner"),
  stateBannerText: document.getElementById("stateBannerText"),

  settingsToggle: document.getElementById("settingsToggle"),
  settingsPanel: document.getElementById("settingsPanel"),
  settingsForm: document.getElementById("settingsForm"),
  categorySelect: document.getElementById("categorySelect"),
  difficultySelect: document.getElementById("difficultySelect"),
  durationSelect: document.getElementById("durationSelect"),
  soundToggle: document.getElementById("soundToggle"),
  resetSessionBtn: document.getElementById("resetSessionBtn"),
  resetAllBtn: document.getElementById("resetAllBtn"),
  themeToggle: document.getElementById("themeToggle"),
  themeIcon: document.getElementById("themeIcon"),
  themeLabel: document.getElementById("themeLabel"),

  customWordInput: document.getElementById("customWordInput"),
  customWordCategory: document.getElementById("customWordCategory"),
  customWordDifficulty: document.getElementById("customWordDifficulty"),
  addWordForm: document.getElementById("addWordForm"),
  addWordBtn: document.getElementById("addWordBtn"),
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

  statScore: document.getElementById("statScore"),
  statStreak: document.getElementById("statStreak"),
  statBest: document.getElementById("statBest"),
  statAccuracy: document.getElementById("statAccuracy"),

  sessionWordCount: document.getElementById("sessionWordCount"),
  sessionCorrectCount: document.getElementById("sessionCorrectCount"),
  sessionIncorrectCount: document.getElementById("sessionIncorrectCount"),
  phaseProgress: document.getElementById("phaseProgress"),

  gameCard: document.getElementById("gameCard"),
  scoreFloat: document.getElementById("scoreFloat"),
  categoryTag: document.getElementById("categoryTag"),
  sessionTimer: document.getElementById("sessionTimer"),

  phaseReady: document.getElementById("phaseReady"),
  startBtn: document.getElementById("startBtn"),
  readyHint: document.getElementById("readyHint"),

  phaseSee: document.getElementById("phaseSee"),
  wordDisplay: document.getElementById("wordDisplay"),
  seeHint: document.getElementById("seeHint"),
  timerFill: document.getElementById("timerFill"),
  timerCaption: document.getElementById("timerCaption"),

  phaseType: document.getElementById("phaseType"),
  typeInstruction: document.getElementById("typeInstruction"),
  answerForm: document.getElementById("answerForm"),
  answerInput: document.getElementById("answerInput"),
  skipBtn: document.getElementById("skipBtn"),
  checkBtn: document.getElementById("checkBtn"),
  typeHint: document.getElementById("typeHint"),

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

  resetAllOverlay: document.getElementById("resetAllOverlay"),
  resetAllCancelBtn: document.getElementById("resetAllCancelBtn"),
  resetAllConfirmBtn: document.getElementById("resetAllConfirmBtn"),

  resetSessionOverlay: document.getElementById("resetSessionOverlay"),
  resetSessionCancelBtn: document.getElementById("resetSessionCancelBtn"),
  resetSessionConfirmBtn: document.getElementById("resetSessionConfirmBtn"),

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

function buildPool() {
  const pool = [];
  const cats = state.category === "all" ? CATEGORY_KEYS : [state.category];
  cats.forEach((cat) => {
    const list = (WORDS[cat] && WORDS[cat][state.difficulty]) || [];
    list.forEach((w) => pool.push({ word: w, category: cat }));
  });
  shuffleArray(pool);
  state.wordPool = pool;
  state.poolIndex = 0;
}

function pickCategory() {
  if (state.category !== "all") return state.category;
  return CATEGORY_KEYS[Math.floor(Math.random() * CATEGORY_KEYS.length)];
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
  state.recentQueue.push(candidate.word);
  if (state.recentQueue.length > state.maxRecent) state.recentQueue.shift();
  return candidate;
}

// Returns { word, category, fromBucket, isSrs } or null when there is
// nothing to serve (empty pool / nothing due in "due only" mode).
function selectNextWord() {
  // 1) SRS due cards — highest priority (Anki-like)
  const dueAll = getDueCards();
  if (dueAll.length) {
    let filtered = dueAll;
    if (state.category !== "all") {
      const catFiltered = dueAll.filter(c => c.category === state.category);
      if (catFiltered.length) filtered = catFiltered;
    }
    // respect reviewMode
    const useDue = state.reviewMode === "dueOnly" ? true : (Math.random() < 0.75);
    if (useDue && filtered.length) {
      const weighted = [];
      filtered.forEach(c => {
        const w = Math.min(c.lapses + (c.interval===0?2:0), 5) + 1;
        for (let i=0;i<w;i++) weighted.push(c);
      });
      let chosen = weighted[Math.floor(Math.random()*weighted.length)];
      // avoid immediate repeat if possible
      if (state.recentQueue.includes(chosen.word) && filtered.length > 1) {
        // pick alternative not recent
        const alt = filtered.find(c => !state.recentQueue.includes(c.word));
        if (alt) chosen = alt;
      }
      state.recentQueue.push(chosen.word);
      if (state.recentQueue.length > state.maxRecent) state.recentQueue.shift();
      return { word: chosen.word, category: chosen.category, fromBucket: true, isSrs: true };
    }
    // "Due only" means exactly that — never fall through to fresh words.
    if (state.reviewMode === "dueOnly") return null;
  } else if (state.reviewMode === "dueOnly") {
    return null;
  }

  // 2) legacy bucket (kept for compatibility) — also maps to SRS but keep weight
  const bucketEligible = state.bucket.length > 0;
  const useBucket = bucketEligible && Math.random() < BUCKET_MIX_RATIO;
  if (useBucket) {
    const weighted = [];
    state.bucket.forEach((entry) => {
      const weight = Math.min(entry.mistakes, 5) + 1;
      for (let i = 0; i < weight; i++) weighted.push(entry);
    });
    const chosen = weighted[Math.floor(Math.random() * weighted.length)];
    if (!state.recentQueue.includes(chosen.word) || state.bucket.length === 1) {
      state.recentQueue.push(chosen.word);
      if (state.recentQueue.length > state.maxRecent) state.recentQueue.shift();
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
  if (state.reviewMode === "dueOnly" && getDueCards().length === 0) {
    setReadyHint(READY_HINT_NOTHING_DUE, true);
    return;
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
  dom.phaseType.hidden = phase !== "type";
  dom.phaseCorrect.hidden = phase !== "correct";
  dom.phaseIncorrect.hidden = phase !== "incorrect";
  if (phase === "ready") {
    requestAnimationFrame(() => dom.startBtn.focus());
  } else if (phase === "see") {
    // don't steal focus to div — keep announce only
  } else if (phase === "type") {
    requestAnimationFrame(() => dom.answerInput.focus());
  } else if (phase === "correct") {
    requestAnimationFrame(() => dom.nextAfterCorrectBtn.focus());
  } else if (phase === "incorrect") {
    requestAnimationFrame(() => dom.nextAfterIncorrectBtn.focus());
  }
}

function beginRound() {
  clearSeeTimer();
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
  dom.wordDisplay.textContent = picked.word;
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
  if (state.currentWord) state.wordsSeen.push(state.currentWord.word);
  if (dom.phaseProgress) dom.phaseProgress.textContent = `Word ${state.wordsSeen.length} of ${poolSize()}`;
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
      state.srsCards[e.word] = { word:e.word, category:e.category, difficulty:"medium", interval:0, ease:2.3 - Math.min(0.5, e.mistakes*0.1), due:Date.now(), reps:0, lapses:e.mistakes, lastReviewed:0 };
    });
    saveSrsCards();
  }
  state.category = loadLocal(LS_KEYS.preferredCategory, "all");
  state.difficulty = loadLocal(LS_KEYS.preferredDifficulty, "medium");
  state.duration = loadLocal(LS_KEYS.preferredDuration, 2000);
  state.soundEnabled = loadLocal(LS_KEYS.soundEnabled, false);
  state.soundVolume = loadLocal(LS_KEYS.soundVolume, 0.5);
  state.reviewMode = loadLocal(LS_KEYS.reviewMode, "mixed");
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

function initSrsCard(word, category, difficulty) {
  if (state.srsCards[word]) return state.srsCards[word];
  const c = { word, category, difficulty, interval:0, ease:2.3, due:Date.now(), reps:0, lapses:0, lastReviewed:0 };
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
    c.ease = Math.min(2.8, c.ease + 0.12);
    if (c.reps === 1) c.interval = 1;
    else if (c.reps === 2) c.interval = 3;
    else c.interval = Math.round(c.interval * c.ease);
    // long-term vs short-term: <7 days = learning, >=21 = mature
    c.due = now + c.interval * 86400000;
  } else {
    c.lapses += 1;
    c.reps = 0;
    c.ease = Math.max(1.3, c.ease - 0.2);
    // short-term re-review in 10 min, then again soon
    c.interval = 0;
    c.due = now + 10 * 60 * 1000; // 10 min
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
  const mature = all.filter(c => c.interval >= 21).length;
  const fresh = all.filter(c => c.reps===0 && c.interval===0).length;
  return { total: all.length, due, learning, mature, fresh };
}

function renderCustomWordsList() {
  if (!dom.customWordsList) return;
  if (dom.customCountBadge) dom.customCountBadge.textContent = state.customWords.length;
  dom.customWordsList.innerHTML = "";
  if (!state.customWords.length) {
    const li = document.createElement("li");
    li.style.cssText = "justify-content:center;color:var(--ink-soft);font-size:12px;border-style:dashed";
    li.textContent = "No custom words yet";
    dom.customWordsList.appendChild(li);
    return;
  }
  const sorted = [...state.customWords].sort((a,b) => a.word.localeCompare(b.word));
  sorted.forEach(entry => {
    const li = document.createElement("li");
    li.innerHTML = `<span style="font-weight:700;font-family:var(--font-display)">${escapeHtml(entry.word)}</span><span style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--ink-faint)">${escapeHtml(CATEGORY_LABELS[entry.category]||entry.category)} · ${entry.difficulty} <button data-del="${escapeHtml(entry.word)}" class="btn btn-quiet" style="padding:4px 8px;font-size:11px">✕</button></span>`;
    dom.customWordsList.appendChild(li);
  });
  dom.customWordsList.querySelectorAll("[data-del]").forEach(btn => {
    btn.addEventListener("click", () => {
      const w = btn.getAttribute("data-del");
      if (confirm(`Delete "${w}"?`)) deleteCustomWord(w);
    });
  });
}

function renderSrsStats() {
  if (!dom.srsStats) return;
  const s = srsStats();
  if (!s.total) { dom.srsStats.innerHTML = '<span style="color:var(--ink-faint);font-size:12px">No SRS cards yet</span>'; return; }
  dom.srsStats.innerHTML = `<span class="pill" style="padding:3px 8px;font-size:11px"><span class="pill-value">${s.due} due</span></span><span>${s.total} cards</span><span>· learning ${s.learning}</span><span>· mature ${s.mature}</span>`;
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
          state.srsCards[w] = {
            word: w,
            category: catKey,
            difficulty: diff,
            interval: Number(incoming.interval) || 0,
            ease: Number(incoming.ease) || 2.3,
            due: Number(incoming.due) || Date.now(),
            reps: Number(incoming.reps) || 0,
            lapses: Number(incoming.lapses) || 0,
            lastReviewed: Number(incoming.lastReviewed) || 0
          };
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

function renderStats() {
  dom.headerStreak.textContent = state.streak;
  dom.headerBest.textContent = state.bestStreak;
  if (dom.headerScore) dom.headerScore.textContent = state.score;

  dom.statScore.textContent = state.score;
  dom.statStreak.textContent = state.streak;
  dom.statBest.textContent = state.bestStreak;

  const attempted = state.correct + state.incorrect;
  const accuracy = attempted === 0 ? null : Math.round((state.correct / attempted) * 100);
  dom.statAccuracy.textContent = accuracy === null ? "—" : accuracy + "%";
  if (dom.headerAccuracy) dom.headerAccuracy.textContent = accuracy === null ? "—" : accuracy + "%";

  dom.sessionWordCount.textContent = `Word ${state.sessionWords}`;
  dom.sessionCorrectCount.textContent = `${state.correct} correct`;
  dom.sessionIncorrectCount.textContent = `${state.incorrect} incorrect`;

  dom.bucketCount.textContent = state.bucket.length;
  if (dom.bucketCount2) dom.bucketCount2.textContent = state.bucket.length;

  // update phase progress if in type phase
  if (state.phase === "type" && dom.phaseProgress) {
    dom.phaseProgress.textContent = `Word ${state.wordsSeen.length} of ${poolSize()}`;
  }
}

function renderBucketPanel() {
  dom.bucketList.innerHTML = "";
  if (state.bucket.length === 0) {
    dom.bucketEmptyHint.hidden = false;
    return;
  }
  dom.bucketEmptyHint.hidden = true;

  const sorted = [...state.bucket].sort((a, b) => b.mistakes - a.mistakes);
  sorted.forEach((entry) => {
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
  dom.summaryOverlay.hidden = false;
  dom.summaryCloseBtn.focus();
}

// Close the recap without throwing the session away — "Keep playing" resumes
// the current session, "New session" is the explicit way to start over.
function closeSummary() {
  dom.summaryOverlay.hidden = true;
  state.sessionStartTime = null;
  refreshReadyState();
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

  dom.nextAfterCorrectBtn.focus();
}

function handleIncorrectAnswer(word, category, rawInput, isSrs) {
  state.incorrect += 1;
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

  dom.nextAfterIncorrectBtn.focus();
}

// ================================
// SETTINGS
// ================================

function applySettingsToForm() {
  dom.categorySelect.value = state.category;
  dom.difficultySelect.value = state.difficulty;
  dom.durationSelect.value = String(state.duration);
  setSoundToggleUI(state.soundEnabled);
  dom.volumeSlider.value = Math.round(state.soundVolume * 100);
}

function setSoundToggleUI(enabled) {
  dom.soundToggle.setAttribute("aria-checked", String(enabled));
  dom.soundToggle.querySelector(".toggle-state").textContent = enabled ? "On" : "Off";
  if (dom.volumeField) {
    dom.volumeField.hidden = !enabled;
  }
}

function toggleSettingsPanel() {
  const isHidden = dom.settingsPanel.hidden;
  dom.settingsPanel.hidden = !isHidden;
  dom.settingsToggle.setAttribute("aria-expanded", String(isHidden));
  document.body.classList.toggle("settings-open", isHidden);
}

function toggleExpandPanel(panelEl, toggleBtn) {
  const isHidden = panelEl.hidden;
  panelEl.hidden = !isHidden;
  toggleBtn.setAttribute("aria-expanded", String(isHidden));
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
  state.sessionWords = 0;
  state.sessionBucketAdds = 0;
  state.categoryStats = {};
  state.bucket = [];
  state.wordsSeen = [];
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
  state.wordsSeen = [];

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

function anyModalOpen() {
  return !dom.summaryOverlay.hidden || !dom.resetAllOverlay.hidden || !dom.resetSessionOverlay.hidden;
}

function attachEventListeners() {
  dom.startBtn.addEventListener("click", () => {
    beginRound();
  });

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
    if (isTextEntryTarget(e.target)) return;
    if (anyModalOpen()) return;
    if (state.phase === "correct" || state.phase === "incorrect") {
      e.preventDefault();
      beginRound();
    } else if (state.phase === "ready" && document.activeElement !== dom.answerInput) {
      // allow starting with Enter when focus isn't inside a form control
      const tag = document.activeElement.tagName;
      if (tag !== "SELECT" && tag !== "BUTTON") {
        beginRound();
      }
    }
  });

  dom.settingsToggle.addEventListener("click", toggleSettingsPanel);

  dom.categorySelect.addEventListener("change", () => {
    state.category = dom.categorySelect.value;
    saveLocal(LS_KEYS.preferredCategory, state.category);
    resetWordPool();
  });

  dom.difficultySelect.addEventListener("change", () => {
    state.difficulty = dom.difficultySelect.value;
    saveLocal(LS_KEYS.preferredDifficulty, state.difficulty);
    resetWordPool();
  });

  dom.durationSelect.addEventListener("change", () => {
    state.duration = Number(dom.durationSelect.value);
    saveLocal(LS_KEYS.preferredDuration, state.duration);
  });

  dom.soundToggle.addEventListener("click", () => {
    state.soundEnabled = !state.soundEnabled;
    setSoundToggleUI(state.soundEnabled);
    saveLocal(LS_KEYS.soundEnabled, state.soundEnabled);
    if (state.soundEnabled) {
      getAudioCtx();
      playTone("correct");
      dom.volumeField.hidden = false;
    } else {
      dom.volumeField.hidden = true;
    }
  });

  dom.volumeSlider.addEventListener("input", () => {
    state.soundVolume = parseInt(dom.volumeSlider.value) / 100;
    saveLocal(LS_KEYS.soundVolume, state.soundVolume);
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
  if (dom.reviewModeSelect) {
    dom.reviewModeSelect.value = state.reviewMode;
    dom.reviewModeSelect.addEventListener("change", () => {
      state.reviewMode = dom.reviewModeSelect.value;
      saveLocal(LS_KEYS.reviewMode, state.reviewMode);
      refreshReadyState();
    });
  }

  // dark mode toggle
  dom.themeToggle.addEventListener("click", () => {
    state.darkMode = !state.darkMode;
    if (state.darkMode) {
      document.documentElement.setAttribute("data-theme", "dark");
      dom.themeIcon.textContent = "☀️";
      dom.themeLabel.textContent = "Dark mode on";
      announce("Dark mode enabled");
    } else {
      document.documentElement.removeAttribute("data-theme");
      dom.themeIcon.textContent = "🌙";
      dom.themeLabel.textContent = "Dark mode off";
      announce("Dark mode disabled");
    }
    saveLocal(LS_KEYS.darkMode, state.darkMode);
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
      requestAnimationFrame(() => dom.answerInput.focus());
    }
  });

  // reset session confirmation
  dom.resetSessionBtn.addEventListener("click", () => {
    dom.resetSessionOverlay.hidden = false;
    dom.resetSessionCancelBtn.focus();
  });

  dom.resetSessionCancelBtn.addEventListener("click", () => {
    dom.resetSessionOverlay.hidden = true;
    dom.resetSessionBtn.focus();
  });

  dom.resetSessionConfirmBtn.addEventListener("click", () => {
    dom.resetSessionOverlay.hidden = true;
    resetSession();
  });

  dom.resetAllBtn.addEventListener("click", () => {
    dom.resetAllOverlay.hidden = false;
    dom.resetAllCancelBtn.focus();
  });

  dom.resetAllCancelBtn.addEventListener("click", () => {
    dom.resetAllOverlay.hidden = true;
    dom.resetAllBtn.focus();
  });

  dom.resetAllConfirmBtn.addEventListener("click", () => {
    dom.resetAllOverlay.hidden = true;
    resetAllData();
  });

  dom.bucketToggle.addEventListener("click", () => {
    toggleExpandPanel(dom.bucketPanel, dom.bucketToggle);
  });

  dom.categoryStatsToggle.addEventListener("click", () => {
    toggleExpandPanel(dom.categoryStatsPanel, dom.categoryStatsToggle);
    renderCategoryStats();
  });

  // session timer
  dom.finishSessionBtn.addEventListener("click", () => {
    showSessionSummary();
  });

  // keyboard shortcuts — a single Escape handler for the whole app.
  // Modals take priority over the game.
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!dom.resetAllOverlay.hidden) {
      dom.resetAllOverlay.hidden = true;
      dom.resetAllBtn.focus();
      return;
    }
    if (!dom.resetSessionOverlay.hidden) {
      dom.resetSessionOverlay.hidden = true;
      dom.resetSessionBtn.focus();
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

  // close modals on backdrop click
  dom.summaryOverlay.addEventListener("click", (e) => {
    if (e.target === dom.summaryOverlay) {
      closeSummary();
    }
  });
  dom.resetAllOverlay.addEventListener("click", (e) => {
    if (e.target === dom.resetAllOverlay) {
      dom.resetAllOverlay.hidden = true;
    }
  });
  dom.resetSessionOverlay.addEventListener("click", (e) => {
    if (e.target === dom.resetSessionOverlay) dom.resetSessionOverlay.hidden = true;
  });
}

// ================================
// INITIALIZATION
// ================================

function init() {
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
  // restore dark mode
  if (state.darkMode) {
    document.documentElement.setAttribute("data-theme", "dark");
    dom.themeIcon.textContent = "☀️";
    dom.themeLabel.textContent = "Dark mode on";
  }
  // restore volume — the slider only makes sense while sound is on
  dom.volumeSlider.value = Math.round(state.soundVolume * 100);
  dom.volumeField.hidden = !state.soundEnabled;
  state.sessionRecordAtStart = state.highScore;
  // mobile takes the settings sheet compact — start with "My words" collapsed
  const myWordsDetails = document.querySelector("#settingsPanel details");
  if (myWordsDetails && window.matchMedia("(max-width: 999px)").matches) myWordsDetails.removeAttribute("open");
  refreshReadyState();
  setPhase("ready");
  attachEventListeners();
}

document.addEventListener("DOMContentLoaded", init);

