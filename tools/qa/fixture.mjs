// Captures a localStorage fixture from the CURRENT app, then reloads it in a
// fresh context and asserts that nothing was lost or reset.
import fs from "node:fs";
import path from "node:path";
import { startServer } from "./server.mjs";
import { launchBrowser, newContext, gotoApp, setTheme, playOneWord, ensureDirs, ARTIFACTS } from "./helpers.mjs";

const FIXTURE = path.join(ARTIFACTS, "fixture.json");

const checks = [];
function check(name, ok, detail = "") {
  checks.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

async function run() {
  ensureDirs();
  const { server, origin } = await startServer();
  const browser = await launchBrowser();

  // ---------- capture ----------
  const { context } = await newContext(browser, { width: 1440, height: 900 });
  const page = await context.newPage();
  await gotoApp(page, origin);

  // build a realistic state: correct word, wrong word, custom word, settings
  await playOneWord(page, "correct");
  await playOneWord(page, "incorrect");
  // back to idle so the settings below apply without a confirmation dialog
  await page.evaluate(() => resetSession());
  await page.fill("#customWordInput", "zephyrine");
  await page.selectOption("#customWordCategory", "nouns");
  await page.selectOption("#customWordDifficulty", "hard");
  await page.click("#addWordBtn");
  await page.selectOption("#categorySelect", "verbs");
  await page.selectOption("#difficultySelect", "hard");
  await page.selectOption("#durationSelect", "3000");
  await page.click("#soundToggle");
  await page.evaluate(() => document.getElementById("themeToggle").click());

  const storage = await page.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = localStorage.getItem(k);
    }
    return out;
  });
  await context.close();

  const keys = Object.keys(storage).sort();
  check("fixture captured with progress keys", keys.includes("spellcast.srsCards"), keys.join(", "));
  check("fixture contains the custom word", (storage["spellcast.customWords"] || "").includes("zephyrine"));
  fs.writeFileSync(FIXTURE, JSON.stringify({ capturedAt: new Date().toISOString(), storage }, null, 2));

  // ---------- reload the fixture in a clean context ----------
  const { context: ctx2, problems } = await newContext(browser, { width: 1440, height: 900 });
  await ctx2.addInitScript((data) => {
    try {
      Object.keys(data).forEach((k) => localStorage.setItem(k, data[k]));
    } catch (e) { /* ignore */ }
  }, storage);
  const page2 = await ctx2.newPage();
  await gotoApp(page2, origin);
  await page2.waitForTimeout(300);

  const after = await page2.evaluate(() => {
    const out = {};
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      out[k] = localStorage.getItem(k);
    }
    return {
      storage: out,
      state: {
        customWords: state.customWords.map((w) => w.word),
        srsCards: Object.keys(state.srsCards).length,
        bucket: state.bucket.length,
        category: state.category,
        difficulty: state.difficulty,
        duration: state.duration,
        soundEnabled: state.soundEnabled,
        darkMode: state.darkMode,
        highScore: state.highScore,
        bestStreak: state.bestStreak
      }
    };
  });

  // progress keys must survive byte-for-byte
  const progressKeys = keys.filter((k) => ["spellcast.srsCards", "spellcast.customWords", "spellcast.bucket", "spellcast.highScore", "spellcast.bestStreak", "spellcast.lifetimeCorrect", "spellcast.totalLifetimeWords"].includes(k));
  const lost = progressKeys.filter((k) => after.storage[k] !== storage[k]);
  check("no progress key lost or rewritten on load", lost.length === 0, lost.join(", "));
  check("custom words restored", after.state.customWords.includes("zephyrine"), after.state.customWords.join(", "));
  check("SRS cards restored", after.state.srsCards > 0, String(after.state.srsCards));
  check("settings restored from storage", after.state.category === "verbs" && after.state.difficulty === "hard" && after.state.duration === 3000, JSON.stringify(after.state));
  check("theme preference restored", after.state.darkMode === true);
  check("no console errors while loading the fixture", problems.length === 0, problems.join(" | "));

  await ctx2.close();
  await browser.close();
  server.close();

  const result = { generatedAt: new Date().toISOString(), fixture: path.relative(process.cwd(), FIXTURE), checks, passed: checks.every((c) => c.ok) };
  fs.writeFileSync(path.join(ARTIFACTS, "fixture-report.json"), JSON.stringify(result, null, 2));
  console.log(result.passed ? "\nFIXTURE: PASS" : "\nFIXTURE: FAIL");
  if (!result.passed) process.exitCode = 1;
}

run();
