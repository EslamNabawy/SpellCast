// v=40 probe: emulate the real-device geometry — with interactive-widget=resizes-content
// the 100dvh card shrinks to the visual band when the keyboard opens, and the full
// type phase clipped at both ends. After the fix the phase must switch to kb-compact
// AND fit entirely inside the shrunken card (nothing clipped, nothing behind the band edge).
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const results = [];
const check = (name, pass, extra) => {
  results.push({ name, pass: !!pass, extra: extra ?? null });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${extra != null ? ` (${JSON.stringify(extra)})` : ""}`);
};

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 360, height: 600 });
const page = await context.newPage();
await gotoApp(page, origin);
await page.click("#startBtn");
await page.waitForFunction(() => state.phase === "type", null, { timeout: 8000 });

// arrange: focus the input, then shrink BOTH the fake keyboard band (visualViewport)
// and the app card height — the resizes-content behaviour my headless run can't do natively
const arranged = await page.evaluate(() => {
  document.getElementById("answerInput").focus();
  const app = document.querySelector(".app");
  const vv = window.visualViewport;
  const r = document.getElementById("answerInput").getBoundingClientRect();
  const h = Math.max(140, Math.min(340, Math.floor(r.bottom - 60)));
  Object.defineProperty(vv, "height", { configurable: true, value: h });
  app.style.height = h + "px"; // emulate layout-viewport shrink
  vv.dispatchEvent(new Event("resize"));
  return { h, top: r.top, bottom: r.bottom, active: document.activeElement.id, phase: state.phase };
});
check("arranged: focused, band smaller than phase (clipping setup)", arranged.active === "answerInput" && arranged.phase === "type" && arranged.bottom > arranged.h, arranged);

let ok = false, diag = null;
try {
  await page.waitForFunction(() => {
    const vv = window.visualViewport;
    const type = document.getElementById("phaseType");
    if (!type.classList.contains("kb-compact")) return false;
    const mystery = document.querySelector(".mystery-mark").getBoundingClientRect();
    const input = document.getElementById("answerInput").getBoundingClientRect();
    const check = document.getElementById("checkBtn").getBoundingClientRect();
    const card = document.querySelector(".app").getBoundingClientRect();
    return (
      mystery.top >= card.top - 1 &&            // nothing clipped by the card top
      input.top > 0 &&
      check.bottom <= card.bottom + 1 &&        // Check sits inside the card (above keyboard)
      check.bottom <= vv.height + 2 &&          // ... and inside the visual band
      input.bottom <= card.bottom + 1
    );
  }, null, { timeout: 5000, polling: 120 });
  ok = true;
} catch (e) {
  diag = await page.evaluate(() => {
    const type = document.getElementById("phaseType");
    const card = document.querySelector(".app").getBoundingClientRect();
    return {
      compact: type.classList.contains("kb-compact"),
      transform: type.style.transform,
      mystery: document.querySelector(".mystery-mark").getBoundingClientRect().toJSON(),
      input: document.getElementById("answerInput").getBoundingClientRect().toJSON(),
      check: document.getElementById("checkBtn").getBoundingClientRect().toJSON(),
      cardTop: card.top, cardBottom: card.bottom,
      vvH: window.visualViewport.height,
      scrollH: type.scrollHeight
    };
  });
}
check("compact phase fits the shrunken card, Check inside band", ok, diag);

// keyboard closes: band restored, compact must be removed and the shift reset
await page.evaluate(() => {
  const vv = window.visualViewport;
  document.querySelector(".app").style.height = "";
  Object.defineProperty(vv, "height", { configurable: true, value: 600 });
  vv.dispatchEvent(new Event("resize"));
});
await page.waitForTimeout(260);
const restored = await page.evaluate(() => {
  const type = document.getElementById("phaseType");
  return { compact: type.classList.contains("kb-compact"), transform: type.style.transform };
});
check("band restored: compact removed, transform reset", !restored.compact && (restored.transform === "" || restored.transform === "none"), restored);

console.log(`\n${results.filter(r => r.pass).length}/${results.length} pass`);
await browser.close();
try { server.close(); } catch (e) { /* ignore */ }
process.exitCode = results.every(r => r.pass) ? 0 : 1;
