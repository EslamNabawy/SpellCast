// v=43 probe — spell tray: the letters light up one by one under the word in
// lockstep with the Spell button's letter-by-letter speech, then reset on the
// next reveal. speechSynthesis is stubbed with the same protocol guard as
// probe-v42 (about:blank init documents skip the stub).
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const results = [];
const check = (name, pass, extra) => {
  results.push({ name, pass: !!pass, extra: extra ?? null });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${extra != null ? ` (${JSON.stringify(extra)})` : ""}`);
};

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1280, height: 720 });
await context.addInitScript(() => {
  if (!location.protocol.startsWith("http")) return; // provisional about:blank guard
  window.__spoken = [];
  window.__speechActive = false;
  window.SpeechSynthesisUtterance = function (text) { this.text = text; };
  Object.defineProperty(window, "speechSynthesis", {
    configurable: true,
    value: {
      get speaking() { return window.__speechActive; },
      speak: (u) => {
        window.__spoken.push({ text: String(u.text), volume: u.volume, rate: u.rate });
        window.__speechActive = true;
      },
      cancel: () => {
        if (window.__speechActive) { window.__spoken.push({ cancelled: true }); window.__speechActive = false; }
      }
    }
  });
});
const page = await context.newPage();
await gotoApp(page, origin);

// long reveal so the letter run never races the auto-advance
await page.evaluate(() => setSetting("duration", 6000));
await page.click("#startBtn");
await page.waitForFunction(() => state.phase === "see", null, { timeout: 8000 });

// 1) the tray starts empty on a fresh reveal
const t0 = await page.evaluate(() => {
  const tray = document.getElementById("spellTray");
  return { children: tray.children.length, text: tray.textContent };
});
check("tray starts empty on reveal", t0.children === 0 && t0.text === "", t0);

// 2) the spell run reveals letters progressively (not all at once)
const word = await page.evaluate(() => {
  document.getElementById("spellBtn").click();
  return state.currentWord.word;
});
const mid = await page.waitForFunction(() => {
  const spans = document.getElementById("spellTray").children;
  const shown = [...spans].filter(s => s.textContent).length;
  return shown >= 1 ? shown : null;
}, null, { timeout: 3000, polling: 80 }).catch(() => 0);
check("letters reveal progressively mid-run", mid >= 1 && word.length >= 2 && mid < word.length, { shown: mid, len: word.length });

// 3) the run completes in order with every span carrying its letter
await page.waitForFunction((w) => {
  const tray = document.getElementById("spellTray");
  return [...tray.children].map(s => s.textContent).join("") === w;
}, word, { timeout: word.length * 300 + 6000, polling: 100 });
const full = await page.evaluate((w) => {
  const spans = [...document.getElementById("spellTray").children];
  return { n: spans.length, joined: spans.map(s => s.textContent).join("") };
}, word);
check("full sequence spelled in order", full.n === word.length && full.joined === word, full);

// 4) the current-letter marker lands on the last letter
const cur = await page.evaluate(() => {
  const spans = [...document.getElementById("spellTray").children];
  return { cur: spans.findIndex(s => s.classList.contains("cur")), n: spans.length };
});
check("current-letter highlight on the last letter", cur.cur === cur.n - 1, cur);

// 5) the tray resets on the next reveal (let the see phase auto-advance, then
//    skip the word with Esc — the typed phase is where Esc is documented to skip)
await page.waitForFunction(() => state.phase === "type", null, { timeout: 10000 });
await page.evaluate(() => {
  document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
});
await page.waitForFunction(() => state.phase === "see", null, { timeout: 8000 });
const t5 = await page.evaluate(() => {
  const tray = document.getElementById("spellTray");
  return { children: tray.children.length, text: tray.textContent, phase: state.phase };
});
check("tray resets on the next word reveal", t5.children === 0 && t5.text === "" && t5.phase === "see", t5);

// 6) a second spell run re-renders cleanly on the new word
const word2 = await page.evaluate(() => {
  document.getElementById("spellBtn").click();
  return state.currentWord.word;
});
let ok6 = true, diag6 = null;
try {
  await page.waitForFunction((w) => {
    const tray = document.getElementById("spellTray");
    return [...tray.children].map(s => s.textContent).join("") === w;
  }, word2, { timeout: 12000, polling: 100 });
} catch (e) {
  ok6 = false;
  diag6 = await page.evaluate(() => ({
    phase: state.phase,
    tray: [...document.getElementById("spellTray").children].map(s => s.textContent).join("|"),
    spoken: window.__spoken.slice(-4),
    steps: spellSteps ? spellSteps.i : null,
    current: state.currentWord.word
  }));
}
const t6 = await page.evaluate((w) => {
  const spans = [...document.getElementById("spellTray").children];
  return { n: spans.length, joined: spans.map(s => s.textContent).join("") };
}, word2);
check("second spell re-renders the new word", ok6 && t6.n === word2.length && t6.joined === word2, { word2, t6, diag6 });

console.log(`\n${results.filter(r => r.pass).length}/${results.length} pass`);
await browser.close();
try { server.close(); } catch (e) { /* ignore */ }
process.exitCode = results.every(r => r.pass) ? 0 : 1;
