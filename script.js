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
  }
};

const CATEGORY_LABELS = {
  nouns: "Nouns",
  verbs: "Verbs",
  adjectives: "Adjectives",
  adverbs: "Adverbs",
  commonlyMisspelled: "Commonly Misspelled",
  advanced: "Advanced"
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
  bucket: "spellsprint.bucket"
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

  categoryStats: {} // { nouns: { correct: n, total: n }, ... }

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

  statScore: document.getElementById("statScore"),
  statStreak: document.getElementById("statStreak"),
  statBest: document.getElementById("statBest"),
  statAccuracy: document.getElementById("statAccuracy"),

  sessionWordCount: document.getElementById("sessionWordCount"),
  sessionCorrectCount: document.getElementById("sessionCorrectCount"),
  sessionIncorrectCount: document.getElementById("sessionIncorrectCount"),

  gameCard: document.getElementById("gameCard"),
  scoreFloat: document.getElementById("scoreFloat"),
  categoryTag: document.getElementById("categoryTag"),

  phaseReady: document.getElementById("phaseReady"),
  startBtn: document.getElementById("startBtn"),

  phaseSee: document.getElementById("phaseSee"),
  wordDisplay: document.getElementById("wordDisplay"),
  timerFill: document.getElementById("timerFill"),
  timerCaption: document.getElementById("timerCaption"),

  phaseType: document.getElementById("phaseType"),
  answerForm: document.getElementById("answerForm"),
  answerInput: document.getElementById("answerInput"),

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

  toastRegion: document.getElementById("toastRegion"),

  bucketToggle: document.getElementById("bucketToggle"),
  bucketPanel: document.getElementById("bucketPanel"),
  bucketCount: document.getElementById("bucketCount"),
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

  srAnnouncer: document.getElementById("srAnnouncer"),
  confettiLayer: document.getElementById("confettiLayer")
};

// ================================
// WORD SELECTION
// ================================

function pickCategory() {
  if (state.category !== "all") return state.category;
  return CATEGORY_KEYS[Math.floor(Math.random() * CATEGORY_KEYS.length)];
}

function randomWordFromCategory(categoryKey, difficulty) {
  const pool = WORDS[categoryKey][difficulty];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Returns { word, category, fromBucket }
function selectNextWord() {
  const bucketEligible = state.bucket.length > 0;
  const useBucket = bucketEligible && Math.random() < BUCKET_MIX_RATIO;

  if (useBucket) {
    // weight by mistakes: higher mistakes = higher chance of being picked
    const weighted = [];
    state.bucket.forEach((entry) => {
      const weight = Math.min(entry.mistakes, 5) + 1;
      for (let i = 0; i < weight; i++) weighted.push(entry);
    });
    const chosen = weighted[Math.floor(Math.random() * weighted.length)];
    return { word: chosen.word, category: chosen.category, fromBucket: true };
  }

  const categoryKey = pickCategory();
  const word = randomWordFromCategory(categoryKey, state.difficulty);
  return { word, category: categoryKey, fromBucket: false };
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
}

function beginRound() {
  clearSeeTimer();
  const picked = selectNextWord();
  state.currentWord = picked;

  dom.categoryTag.textContent = CATEGORY_LABELS[picked.category];
  dom.wordDisplay.textContent = picked.word;
  dom.timerCaption.textContent = (state.duration / 1000).toFixed(1) + " seconds";

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
  // defer focus slightly so hidden->visible transition doesn't fight it
  requestAnimationFrame(() => dom.answerInput.focus());
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

function loadAllPersisted() {
  state.highScore = loadLocal(LS_KEYS.highScore, 0);
  state.bestStreak = loadLocal(LS_KEYS.bestStreak, 0);
  state.bucket = loadLocal(LS_KEYS.bucket, []);
  state.category = loadLocal(LS_KEYS.preferredCategory, "all");
  state.difficulty = loadLocal(LS_KEYS.preferredDifficulty, "medium");
  state.duration = loadLocal(LS_KEYS.preferredDuration, 2000);
  state.soundEnabled = loadLocal(LS_KEYS.soundEnabled, false);
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

  dom.statScore.textContent = state.score;
  dom.statStreak.textContent = state.streak;
  dom.statBest.textContent = state.highScore;

  const attempted = state.correct + state.incorrect;
  const accuracy = attempted === 0 ? null : Math.round((state.correct / attempted) * 100);
  dom.statAccuracy.textContent = accuracy === null ? "—" : accuracy + "%";

  dom.sessionWordCount.textContent = `Word ${state.sessionWords}`;
  dom.sessionCorrectCount.textContent = `${state.correct} correct`;
  dom.sessionIncorrectCount.textContent = `${state.incorrect} incorrect`;

  dom.bucketCount.textContent = state.bucket.length;
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
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.06, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  osc.start(now);
  osc.stop(now + duration + 0.02);

  if (kind === "milestone") {
    // quick second note for a tiny "achievement" flourish
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1108, now + 0.1);
    gain2.gain.setValueAtTime(0.0001, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.05, now + 0.11);
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
  const { word, category, fromBucket } = state.currentWord;

  state.sessionWords += 1;
  recordCategoryStat(category, isCorrect);
  recordLifetimeWord(isCorrect);

  if (isCorrect) {
    handleCorrectAnswer(word, category, fromBucket);
  } else {
    handleIncorrectAnswer(word, category, rawInput);
  }

  renderStats();
}

function handleCorrectAnswer(word, category, fromBucket) {
  state.correct += 1;
  const newStreak = incrementStreak();

  let points = streakBonus(newStreak);
  let mastered = false;
  if (fromBucket) {
    points = BUCKET_MASTER_BONUS;
    mastered = removeFromBucket(word);
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

function handleIncorrectAnswer(word, category, rawInput) {
  state.incorrect += 1;
  const previousStreak = resetStreak();

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
}

function setSoundToggleUI(enabled) {
  dom.soundToggle.setAttribute("aria-checked", String(enabled));
  dom.soundToggle.querySelector(".toggle-state").textContent = enabled ? "On" : "Off";
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
  state.score = 0;
  state.streak = 0;
  state.correct = 0;
  state.incorrect = 0;
  state.sessionWords = 0;
  state.sessionBucketAdds = 0;
  state.categoryStats = {};
  state.bucket = [];
  saveBucket();

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
  });

  dom.difficultySelect.addEventListener("change", () => {
    state.difficulty = dom.difficultySelect.value;
    saveLocal(LS_KEYS.preferredDifficulty, state.difficulty);
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
      // resume/create audio context on this user gesture
      getAudioCtx();
      playTone("correct");
    }
  });

  dom.resetSessionBtn.addEventListener("click", resetSession);

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

  dom.finishSessionBtn.addEventListener("click", () => {
    showSessionSummary();
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
  applyStreakTheme(0);
  renderStats();
  renderBucketPanel();
  renderCategoryStats();
  setPhase("ready");
  attachEventListeners();
}

document.addEventListener("DOMContentLoaded", init);

