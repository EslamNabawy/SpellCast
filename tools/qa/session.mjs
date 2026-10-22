// Scripted full session: start, correct, incorrect, skip, finish, bucket,
// categories, theme toggle, every setting changed. Fails on any console error.
import fs from "node:fs";
import path from "node:path";
import { startServer } from "./server.mjs";
import { launchBrowser, newContext, gotoApp, setTheme, playOneWord, ensureDirs, ARTIFACTS } from "./helpers.mjs";

const checks = [];
function check(name, ok, detail = "") {
  checks.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

async function run() {
  ensureDirs();
  const { server, origin } = await startServer();
  const browser = await launchBrowser();
  const { context, problems } = await newContext(browser, { width: 1440, height: 900 });
  const page = await context.newPage();
  await gotoApp(page, origin);

  // --- start ---
  await page.click("#startBtn");
  await page.waitForFunction(() => state.phase === "see", null, { timeout: 5000 });
  check("start shows the reveal phase", true);

  // --- correct answer ---
  await page.waitForFunction(() => state.phase === "type", null, { timeout: 8000 });
  const word = await page.evaluate(() => state.currentWord.word);
  await page.fill("#answerInput", word);
  await page.press("#answerInput", "Enter");
  await page.waitForFunction(() => state.phase === "correct", null, { timeout: 6000 });
  const afterCorrect = await page.evaluate(() => ({
    streak: state.streak,
    correct: state.correct,
    score: state.score
  }));
  check("correct answer scores", afterCorrect.correct === 1 && afterCorrect.score > 0, JSON.stringify(afterCorrect));

  // --- enter advances to the next word ---
  await page.press("body", "Enter");
  await page.waitForFunction(() => state.phase === "see" || state.phase === "type", null, { timeout: 5000 });
  check("Enter advances to the next word", true);

  // --- incorrect answer ---
  await page.waitForFunction(() => state.phase === "type", null, { timeout: 8000 });
  const word2 = await page.evaluate(() => state.currentWord.word);
  await page.fill("#answerInput", word2.slice(0, -1) + "z");
  await page.press("#answerInput", "Enter");
  await page.waitForFunction(() => state.phase === "incorrect", null, { timeout: 6000 });
  const afterWrong = await page.evaluate(() => ({
    incorrect: state.incorrect,
    bucket: state.bucket.length,
    srs: Object.keys(state.srsCards).length
  }));
  check("incorrect answer records a miss", afterWrong.incorrect === 1, JSON.stringify(afterWrong));
  check("missed word lands in the bucket", afterWrong.bucket === 1);
  check("missed word gets an SRS card", afterWrong.srs >= 1);

  // --- back button re-arms the same word ---
  await page.click("#backAfterIncorrectBtn");
  await page.waitForFunction(() => state.phase === "type", null, { timeout: 5000 });
  check("Back re-arms the same word", true);

  // --- skip (Esc) ---
  // The word may already be in the bucket (it was just missed, then re-armed
  // with Back), so a skip can either add a new entry or raise the mistake
  // count of the existing one. Both are correct bucket behaviour.
  const bucketBefore = await page.evaluate(() => ({
    len: state.bucket.length,
    mistakes: state.bucket.reduce((n, e) => n + e.mistakes, 0),
    words: state.sessionWords
  }));
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => state.phase === "see" || state.phase === "type", null, { timeout: 6000 });
  const afterSkip = await page.evaluate(() => ({
    len: state.bucket.length,
    mistakes: state.bucket.reduce((n, e) => n + e.mistakes, 0),
    words: state.sessionWords
  }));
  check(
    "Esc skips the word and buckets it",
    afterSkip.words === bucketBefore.words + 1 &&
      (afterSkip.len > bucketBefore.len || afterSkip.mistakes > bucketBefore.mistakes),
    JSON.stringify({ before: bucketBefore, after: afterSkip })
  );

  // --- bucket + categories panels ---
  await page.evaluate(() => document.getElementById("bucketToggle").click());
  await page.waitForSelector("#bucketPanel:not([hidden])");
  const bucketItems = await page.locator("#bucketList li").count();
  check("bucket panel lists the missed words", bucketItems >= 1, `${bucketItems} items`);
  await page.evaluate(() => document.getElementById("categoryStatsToggle").click());
  await page.waitForSelector("#categoryStatsPanel:not([hidden])");
  const catRows = await page.locator("#categoryStatsList li").count();
  check("category stats panel renders rows", catRows >= 1, `${catRows} rows`);

  // --- every setting ---
  const settings = [
    ["#categorySelect", "commonlyMisspelled"],
    ["#difficultySelect", "hard"],
    ["#durationSelect", "1500"],
    ["#reviewModeSelect", "dueOnly"]
  ];
  for (const [sel, value] of settings) {
    await page.selectOption(sel, value);
    await page.waitForTimeout(80);
  }
  const persisted = await page.evaluate(() => ({
    category: state.category,
    difficulty: state.difficulty,
    duration: state.duration,
    reviewMode: state.reviewMode,
    lsCategory: localStorage.getItem("spellsprint.preferredCategory"),
    lsDifficulty: localStorage.getItem("spellsprint.preferredDifficulty"),
    lsDuration: localStorage.getItem("spellsprint.preferredDuration")
  }));
  check("category setting persists", persisted.category === "commonlyMisspelled" && persisted.lsCategory === '"commonlyMisspelled"', JSON.stringify(persisted.lsCategory));
  check("difficulty setting persists", persisted.difficulty === "hard" && persisted.lsDifficulty === '"hard"');
  check("duration setting persists", persisted.duration === 1500 && persisted.lsDuration === "1500");
  check("review mode setting persists", persisted.reviewMode === "dueOnly");

  // the pool must follow the category/difficulty change
  const poolState = await page.evaluate(() => {
    const cats = new Set(state.wordPool.map((w) => w.category));
    return { categories: [...cats], size: state.wordPool.length };
  });
  check("pool follows the selected category", poolState.categories.length === 1 && poolState.categories[0] === "commonlyMisspelled", JSON.stringify(poolState.categories));

  // --- sound + volume ---
  await page.click("#soundToggle");
  await page.waitForTimeout(80);
  const soundOn = await page.evaluate(() => ({
    enabled: state.soundEnabled,
    volumeVisible: !document.getElementById("volumeField").hidden
  }));
  check("volume control appears when sound is on", soundOn.enabled && soundOn.volumeVisible, JSON.stringify(soundOn));
  await page.click("#soundToggle");
  await page.waitForTimeout(80);
  const soundOff = await page.evaluate(() => !document.getElementById("volumeField").hidden);
  check("volume control hides when sound is off", soundOff === false);

  // --- theme toggle ---
  await setTheme(page, "dark");
  const dark = await page.evaluate(() => document.documentElement.getAttribute("data-theme") === "dark");
  check("theme toggle switches to dark", dark);
  await setTheme(page, "light");

  // --- finish -> confirm -> summary ---
  await page.click("#finishSessionBtn");
  await page.waitForSelector("#finishOverlay:not([hidden])", { timeout: 4000 });
  check("finishing mid-deck asks for confirmation", true);
  await page.click("#finishCancelBtn");
  check("cancelling the finish confirm closes it", await page.evaluate(() => document.getElementById("finishOverlay").hidden));
  await page.click("#finishSessionBtn");
  await page.click("#finishConfirmBtn");
  await page.waitForSelector("#summaryOverlay:not([hidden])", { timeout: 4000 });
  const summary = await page.evaluate(() => ({
    words: document.getElementById("summaryWordsPracticed").textContent,
    accuracy: document.getElementById("summaryAccuracy").textContent,
    bucketAdds: document.getElementById("summaryBucketAdds").textContent
  }));
  check("summary shows session results", Number(summary.words) >= 2, JSON.stringify(summary));

  // --- reset all data dialog ---
  await page.evaluate(() => {
    document.getElementById("summaryOverlay").hidden = true;
    document.getElementById("resetAllBtn").click();
  });
  await page.waitForSelector("#resetAllOverlay:not([hidden])", { timeout: 4000 });
  check("delete-all dialog opens", true);
  await page.click("#resetAllCancelBtn");
  check("delete-all cancel closes it", await page.evaluate(() => document.getElementById("resetAllOverlay").hidden));

  // --- keyboard-only path: Esc closes dialogs, Enter starts from ready ---
  await page.evaluate(() => state.phase = "ready");
  await page.keyboard.press("Escape");
  check("no console errors during the whole session", problems.length === 0, problems.join(" | "));

  const result = {
    generatedAt: new Date().toISOString(),
    origin,
    checks,
    consoleProblems: problems,
    passed: checks.every((c) => c.ok) && problems.length === 0
  };
  fs.writeFileSync(path.join(ARTIFACTS, "session-report.json"), JSON.stringify(result, null, 2));
  await browser.close();
  server.close();
  console.log(result.passed ? "\nSESSION: PASS" : "\nSESSION: FAIL");
  if (!result.passed) process.exitCode = 1;
}

run();
