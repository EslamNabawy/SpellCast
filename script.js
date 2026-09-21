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
  wordsSeen: [], // track words shown in session for "X of Y"
  skippedWords: new Set()
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
  summaryWordsPracticed: document.getElementById("summaryWordsPracticed"),
  summaryBucketAdds: document.getElementById("summaryBucketAdds"),
  summaryStrongest: document.getElementById("summaryStrongest"),
  summaryWeakest: document.getElementById("summaryWeakest"),
  summaryCloseBtn: document.getElementById("summaryCloseBtn"),

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
    const list = WORDS[cat][state.difficulty] || [];
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
  // try to avoid recent queue repeats
  let attempts = 0;
  let candidate = null;
  const recentSet = new Set(state.recentQueue);
  while (attempts < state.wordPool.length) {
    if (state.poolIndex >= state.wordPool.length) buildPool();
    candidate = state.wordPool[state.poolIndex++];
    if (!recentSet.has(candidate.word) || state.wordPool.length <= state.maxRecent) break;
    // if candidate is recent, push it to end and try next
    attempts++;
    // rotate: move candidate to end so we don't lose it
    state.wordPool.push(candidate);
    candidate = null;
  }
  if (!candidate) {
    candidate = state.wordPool[state.poolIndex++ % state.wordPool.length];
  }
  // track recent
  state.recentQueue.push(candidate.word);
  if (state.recentQueue.length > state.maxRecent) state.recentQueue.shift();
  return candidate;
}

// Returns { word, category, fromBucket, isSrs }
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
    return { word: chosen.word, category: chosen.category, fromBucket: true, isSrs: false };
  }

  const picked = getNextFreshWord();
  return { word: picked.word, category: picked.category, fromBucket: false, isSrs: false };
}

function resetWordPool() {
  buildPool();
  state.recentQueue = [];
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
  if (dom.phaseProgress) dom.phaseProgress.textContent = `Word ${state.wordsSeen.length + 1} of ${poolSize()}`;
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
  if (theme.key === state.currentThemeKey) return;
  state.currentThemeKey = theme.key;

  dom.body.classList.remove(
    "theme-normal", "theme-warm", "theme-fire",
    "theme-electric", "theme-rocket", "theme-legendary"
  );
  dom.body.classList.add(`theme-${theme.key}`);

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
  if (state.score > state.highScore) {
    const wasNewHigh = true;
    state.highScore = state.score;
    saveLocal(LS_KEYS.highScore, state.highScore);
    return { points, newHighScore: wasNewHigh };
  }
  return { points, newHighScore: false };
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

function ensureCategory(catKey, label) {
  if (WORDS[catKey]) return;
  WORDS[catKey] = { easy: [], medium: [], hard: [] };
  CATEGORY_LABELS[catKey] = label || catKey.charAt(0).toUpperCase() + catKey.slice(1);
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

function exportJSON() {
  const payload = { version: 1, exportedAt: new Date().toISOString(), customWords: state.customWords, srsCards: state.srsCards, categories: Object.keys(WORDS) };
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
        if (!e.word || !e.category || !e.difficulty) { skipped++; return; }
        const w = normalizeWordRaw(e.word);
        if (!isValidWord(w)) { skipped++; return; }
        if (wordExistsAnywhere(w) && !state.customWords.find(x=>x.word===w)) { skipped++; return; }
        const existing = state.customWords.find(x=>x.word===w);
        if (!existing) { ensureCategory(e.category, CATEGORY_LABELS[e.category]||e.category); state.customWords.push({ word:w, category:e.category, difficulty:e.difficulty, addedAt:e.addedAt||Date.now() }); if (!WORDS[e.category][e.difficulty].includes(w)) WORDS[e.category][e.difficulty].push(w); added++; } else updated++;
      });
      Object.keys(sc).forEach(k => {
        const incoming = sc[k]; const existing = state.srsCards[k];
        if (!incoming || !incoming.word) return;
        if (!existing || (incoming.lastReviewed||0) > (existing.lastReviewed||0)) { state.srsCards[k] = incoming; ensureCategory(incoming.category, CATEGORY_LABELS[incoming.category]||incoming.category); if (!wordExistsAnywhere(k)) { const diff = incoming.difficulty||"medium"; if (!WORDS[incoming.category][diff].includes(k)) WORDS[incoming.category][diff].push(k); } }
      });
      saveCustomWords(); saveSrsCards(); rebuildCustomWordsIntoWORDS(); renderCustomWordsList(); renderSrsStats(); resetWordPool(); announce(`Import: ${added} added, ${updated} updated, ${skipped} skipped`);
      const toast = document.createElement("div"); toast.className="toast"; toast.innerHTML=`<span class="toast-text"><span class="toast-title">Import done</span><span class="toast-sub">${added} added · ${updated} updated · ${skipped} skipped</span></span>`; dom.toastRegion.appendChild(toast); setTimeout(()=>toast.remove(),3200);
    } catch(err){ alert("Import failed: "+err.message); }
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
  dom.headerBest.textContent = state.highScore;
  if (dom.headerScore) dom.headerScore.textContent = state.score;

  dom.statScore.textContent = state.score;
  dom.statStreak.textContent = state.streak;
  dom.statBest.textContent = state.highScore;

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
    dom.phaseProgress.textContent = `Word ${state.wordsSeen.length + 1} of ${poolSize()}`;
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
        <span class="category-stat-name">${CATEGORY_LABELS[key]}</span>
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
  dom.summaryWordsPracticed.textContent = summary.wordsPracticed;
  dom.summaryBucketAdds.textContent = summary.bucketAdds;
  dom.summaryStrongest.textContent = summary.strongest;
  dom.summaryWeakest.textContent = summary.weakest;
  dom.summaryOverlay.hidden = false;
  dom.summaryCloseBtn.focus();
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
}

function handleCorrectAnswer(word, category, fromBucket, isSrs) {
  state.correct += 1;
  const newStreak = incrementStreak();
  // SRS update — long/short memory
  const srs = updateSrsCard(word, true);

  let points = streakBonus(newStreak);
  let mastered = false;
  if (fromBucket) {
    points = BUCKET_MASTER_BONUS;
    mastered = removeFromBucket(word);
    // for SRS, mastered means reaching learning -> mature transition
    if (isSrs && srs.interval >= 3) mastered = true;
  }

  const result = awardPoints(points);

  dom.correctHeadline.textContent = mastered ? "Mastered" : "Correct";
  dom.correctWordEcho.textContent = word;
  dom.correctPoints.textContent = "+" + points;
  dom.masteredNote.hidden = !mastered;

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
  state.skippedWords.clear();
  saveBucket();
  resetWordPool();

  applyStreakTheme(0);
  renderStats();
  renderBucketPanel();
  renderCategoryStats();
  setPhase("ready");
  announce("Session reset. High score and best streak are preserved.");
}

function resetAllData() {
  Object.values(LS_KEYS).forEach((key) => {
    try { localStorage.removeItem(key); } catch (e) { /* ignore */ }
  });
  state.highScore = 0;
  state.bestStreak = 0;
  state.bucket = [];
  state.category = "all";
  state.difficulty = "medium";
  state.duration = 2000;
  state.soundEnabled = false;
  state.soundVolume = 0.5;
  state.darkMode = false;
  state.wordsSeen = [];
  state.skippedWords.clear();

  document.documentElement.removeAttribute("data-theme");
  dom.themeIcon.textContent = "🌙";
  dom.themeLabel.textContent = "Dark mode off";

  resetSession();
  applySettingsToForm();
  announce("All saved progress has been deleted.");
}

// ================================
// EVENT LISTENERS
// ================================

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

  // Enter-to-advance on result screens (without hijacking the type input, which uses its own form submit)
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    if (state.phase === "correct") {
      e.preventDefault();
      beginRound();
    } else if (state.phase === "incorrect") {
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
      if (!res.ok) { dom.customWordError.textContent = res.error; dom.customWordError.hidden = false; }
      else { dom.customWordError.hidden = true; dom.customWordInput.value = ""; dom.customWordInput.focus(); }
    });
  }
  if (dom.createCategoryBtn) {
    dom.createCategoryBtn.addEventListener("click", () => {
      const name = dom.newCategoryInput.value.trim();
      if (!name) { alert("Enter category name"); return; }
      const key = name.toLowerCase().replace(/[^a-z0-9]+/g, "").replace(/^[0-9]+/, "");
      if (!key) { alert("Invalid name"); return; }
      if (WORDS[key]) { alert("Category exists"); return; }
      ensureCategory(key, name); saveCustomWords(); dom.newCategoryInput.value = ""; dom.customWordCategory.value = key; renderCustomWordsList(); announce(`Category ${name} created`);
    });
  }
  if (dom.exportBtn) dom.exportBtn.addEventListener("click", exportJSON);
  if (dom.importBtn && dom.importFile) {
    dom.importBtn.addEventListener("click", () => dom.importFile.click());
    dom.importFile.addEventListener("change", () => { const f = dom.importFile.files[0]; if (f) importJSONFile(f); dom.importFile.value = ""; });
  }
  if (dom.reviewModeSelect) {
    dom.reviewModeSelect.value = state.reviewMode;
    dom.reviewModeSelect.addEventListener("change", () => { state.reviewMode = dom.reviewModeSelect.value; });
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
    if (state.phase === "type") {
      const word = state.currentWord?.word;
      state.skippedWords.add(word);
      clearSeeTimer();
      addToBucket(word, state.currentWord?.category);
      // don't count as incorrect for streak
      announce(`Skipped ${word}. Added to practice bucket.`);
      beginRound();
    }
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

  // keyboard shortcuts
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (state.phase === "type") {
        e.preventDefault();
        dom.skipBtn.click();
      } else if (!dom.resetAllOverlay.hidden) {
        dom.resetAllOverlay.hidden = true;
      } else if (!dom.summaryOverlay.hidden) {
        dom.summaryOverlay.hidden = true;
        resetSession();
      } else if (!dom.resetSessionOverlay.hidden) {
        dom.resetSessionOverlay.hidden = true;
      }
    }
  });

  dom.summaryCloseBtn.addEventListener("click", () => {
    dom.summaryOverlay.hidden = true;
    resetSession();
  });

  // close modals on backdrop click
  dom.summaryOverlay.addEventListener("click", (e) => {
    if (e.target === dom.summaryOverlay) {
      dom.summaryOverlay.hidden = true;
      resetSession();
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

  // Escape closes any open modal
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!dom.resetAllOverlay.hidden) {
      dom.resetAllOverlay.hidden = true;
    } else if (!dom.summaryOverlay.hidden) {
      dom.summaryOverlay.hidden = true;
      resetSession();
    }
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
  // restore volume
  if (state.soundVolume > 0) {
    dom.volumeSlider.value = Math.round(state.soundVolume * 100);
    dom.volumeField.hidden = false;
  }
  setPhase("ready");
  attachEventListeners();
}

document.addEventListener("DOMContentLoaded", init);

