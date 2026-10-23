// v=41 probe: corrupted localStorage values (wrong types) must not crash boot —
// every saved value is type-guarded, so the app falls back to defaults and runs.
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const results = [];
const check = (name, pass, extra) => {
  results.push({ name, pass: !!pass, extra: extra ?? null });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${extra != null ? ` (${JSON.stringify(extra)})` : ""}`);
};

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context, problems } = await newContext(browser, { width: 900, height: 700 });
await context.addInitScript(() => {
  // init scripts also run on the provisional about:blank document, where
  // localStorage is denied (opaque origin) — guard so the poison itself
  // never throws there and pollutes the console-error check
  try {
    if (!location.protocol.startsWith("http")) return;
    const poison = {
      "spellcast.bucket": { wrong: true },
      "spellcast.customWords": 42,
      "spellcast.srsCards": "x",
      "spellcast.preferredDuration": "abc",
      "spellcast.highScore": "nope",
      "spellcast.preferredDifficulty": "ultra",
      "spellcast.soundVolume": "loud",
      "spellcast.darkMode": "yes?!"
    };
    Object.entries(poison).forEach(([k, v]) => localStorage.setItem(k, JSON.stringify(v)));
  } catch (e) { /* storage denied on a provisional document — ignore */ }
});
const page = await context.newPage();
await gotoApp(page, origin);

const boot = await page.evaluate(() => ({
  header: !!document.querySelector(".header"),
  readyVisible: !!document.getElementById("startBtn") && !document.getElementById("phaseReady").hidden,
  bucketOk: Array.isArray(state.bucket) && state.bucket.length === 0,
  duration: state.duration,
  highScore: state.highScore,
  difficulty: state.difficulty,
  volumeIsNumber: typeof state.soundVolume === "number" && state.soundVolume >= 0 && state.soundVolume <= 1,
  customWordsOk: Array.isArray(state.customWords) && state.customWords.length === 0
}));
check("app boots with corrupted storage", boot.header && boot.readyVisible, boot);
check("bucket falls back to []", boot.bucketOk === true, boot.bucketOk);
check("duration falls back to 2000", boot.duration === 2000, boot.duration);
check("highScore falls back to 0", boot.highScore === 0, boot.highScore);
check("difficulty falls back to medium", boot.difficulty === "medium", boot.difficulty);
check("soundVolume is a number in [0,1]", boot.volumeIsNumber === true, boot.volumeIsNumber);
check("customWords falls back to []", boot.customWordsOk === true, boot.customWordsOk);

// and a real round still plays end to end
await page.click("#startBtn");
await page.waitForFunction(() => state.phase === "see", null, { timeout: 8000 });
await page.waitForFunction(() => state.phase === "type", null, { timeout: 8000 });
check("a round still starts and reaches the type phase", true);

check("no console errors during poisoned boot", problems.length === 0, problems.map(p => String(p).slice(0, 140)));

console.log(`\n${results.filter(r => r.pass).length}/${results.length} pass`);
await browser.close();
try { server.close(); } catch (e) { /* ignore */ }
process.exitCode = results.every(r => r.pass) ? 0 : 1;
