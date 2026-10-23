// v=42 probe — spoken words (Web Speech API): auto-speak on reveal, the Say /
// Spell buttons, the Spoken words toggle, and cancel-on-phase-change.
// speechSynthesis is stubbed in an init script, so `window.__spoken` records
// every utterance; cancel markers ({cancelled:true}) are filtered everywhere
// because a new speak() always cancels the previous audio first.
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

// longer reveal so the letter-by-letter run never races the auto-advance
await page.evaluate(() => setSetting("duration", 4000));

// 1) auto-speak fires on the first reveal
await page.click("#startBtn");
await page.waitForFunction(() => window.__spoken && window.__spoken.some(s => typeof s.text === "string"), null, { timeout: 8000 });
const auto = await page.evaluate(() => {
  const hit = window.__spoken.filter(s => typeof s.text === "string")[0];
  return { said: hit.text, word: state.currentWord.word, phase: state.phase, rate: hit.rate };
});
check("auto-speak: word spoken on reveal", auto.phase === "see" && auto.said.toLowerCase() === auto.word.toLowerCase(), auto);
check("auto-speak: slowed rate", auto.rate <= 1, auto.rate);

// 2) Say button re-speaks the whole word
const say = await page.evaluate(() => {
  window.__spoken.length = 0;
  document.getElementById("sayBtn").click();
  const texts = window.__spoken.filter(s => typeof s.text === "string");
  return { said: texts.length ? texts[texts.length - 1].text : null, word: state.currentWord.word };
});
check("Say button: speaks the whole word", say.said && say.said.toLowerCase() === say.word.toLowerCase(), say);

// 3) Spell button speaks letter-by-letter
const spell = await page.evaluate(() => {
  window.__spoken.length = 0;
  document.getElementById("spellBtn").click();
  return null;
});
await page.waitForFunction(() => {
  const texts = window.__spoken.filter(s => typeof s.text === "string");
  return texts.length >= state.currentWord.word.length;
}, null, { timeout: 8000, polling: 100 });
const spellData = await page.evaluate(() => {
  const texts = window.__spoken.filter(s => typeof s.text === "string");
  return {
    joined: texts.map(s => s.text).join("").toLowerCase(),
    count: texts.length,
    singleLetters: texts.every(s => s.text.length === 1),
    word: state.currentWord.word
  };
});
check("Spell button: letter-by-letter sequence",
  spellData.singleLetters === true && spellData.count === spellData.word.length && spellData.joined === spellData.word.toLowerCase(),
  spellData);

// 4) auto-speak OFF via the Spoken words toggle — new words stay silent
await page.evaluate(() => {
  document.getElementById("ttsToggle").click();
  resetSession();
});
const off = await page.evaluate(() => ({ auto: state.ttsAuto, stored: localStorage.getItem("spellcast.ttsAuto") }));
check("toggle: ttsAuto off + persisted", off.auto === false && off.stored !== null, off);
await page.evaluate(() => {
  window.__spoken.length = 0;
  document.getElementById("startBtn").click();
});
await page.waitForFunction(() => state.phase === "see", null, { timeout: 8000 });
const silent = await page.evaluate(() => ({ spoken: window.__spoken.filter(s => typeof s.text === "string").length }));
check("auto-speak off: new word not spoken", silent.spoken === 0, silent);

// 5) the Say button still works with auto-speak off
const sayOff = await page.evaluate(() => {
  window.__spoken.length = 0;
  document.getElementById("sayBtn").click();
  const texts = window.__spoken.filter(s => typeof s.text === "string");
  return { said: texts.length ? texts[texts.length - 1].text : null, word: state.currentWord.word };
});
check("Say button works with auto-speak off", sayOff.said && sayOff.said.toLowerCase() === sayOff.word.toLowerCase(), sayOff);

// 6) phase change cancels a running spell-out
const cancel = await page.evaluate(() => {
  window.__spoken.length = 0;
  document.getElementById("spellBtn").click();
  setPhase("type");
  return { cancelled: window.__spoken.some(s => s.cancelled), phase: state.phase };
});
check("phase change cancels speech", cancel.cancelled === true && cancel.phase === "type", cancel);

console.log(`\n${results.filter(r => r.pass).length}/${results.length} pass`);
await browser.close();
try { server.close(); } catch (e) { /* ignore */ }
process.exitCode = results.every(r => r.pass) ? 0 : 1;
