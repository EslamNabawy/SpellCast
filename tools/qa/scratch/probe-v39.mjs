// v=39 probe: on a page that CANNOT scroll (app card is 100dvh + overflow hidden),
// opening the keyboard must shift the phase content so the answer field and the
// Check button stay inside the visual band — and the shift must reset cleanly.
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const results = [];
const check = (name, pass, extra) => {
  results.push({ name, pass: !!pass, extra: extra ?? null });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${extra != null ? ` (${JSON.stringify(extra)})` : ""}`);
};

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 800, height: 400 });
const page = await context.newPage();
await gotoApp(page, origin);
await page.click("#startBtn");
await page.waitForFunction(() => state.phase === "type", null, { timeout: 8000 });

// arrange: the page must NOT be scrollable, and the input must be focused
const arranged = await page.evaluate(() => {
  document.getElementById("answerInput").focus();
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  return { maxScroll, active: document.activeElement.id, phase: state.phase };
});
check("arranged: input focused, page not scrollable", arranged.maxScroll <= 2 && arranged.active === "answerInput" && arranged.phase === "type", arranged);

// fake a keyboard band that leaves the input below it, then fire the anchor
const band = await page.evaluate(() => {
  const vv = window.visualViewport;
  const r = document.getElementById("answerInput").getBoundingClientRect();
  const h = Math.max(80, Math.min(320, Math.floor(r.top - 20)));
  Object.defineProperty(vv, "height", { configurable: true, value: h });
  vv.dispatchEvent(new Event("resize"));
  return { h, top: r.top, bottom: r.bottom };
});
check("arranged: input starts below the band", band.top > band.h - 8 && band.bottom > band.h, band);

// the anchor must move the phase content (no document scroll possible)
let ok = false, diag = null;
try {
  await page.waitForFunction(() => {
    const vv = window.visualViewport;
    const r = document.getElementById("answerInput").getBoundingClientRect();
    const c = document.getElementById("checkBtn").getBoundingClientRect();
    return r.bottom <= vv.height + 2 && r.top > 0 && c.bottom <= vv.height + 2; // eslint-disable-line
  }, null, { timeout: 5000, polling: 120 });
  ok = true;
  diag = null;
} catch (e) {
  diag = await page.evaluate(() => {
    const vv = window.visualViewport;
    const phase = document.getElementById("answerInput").closest(".phase");
    return {
      transform: phase ? phase.style.transform : "(no phase)",
      input: document.getElementById("answerInput").getBoundingClientRect().toJSON(),
      check: document.getElementById("checkBtn").getBoundingClientRect().toJSON(),
      vvH: vv.height
    };
  });
}
check("anchor shifted answer+Check into the band (translateY, no scroll)", ok, diag);

// repeated events must not oscillate or drift
const y1 = await page.evaluate(() => {
  const phase = document.getElementById("answerInput").closest(".phase");
  window.visualViewport.dispatchEvent(new Event("resize"));
  return { y: window.scrollY, t: phase ? phase.style.transform : "" };
});
await page.waitForTimeout(140);
const y2 = await page.evaluate(() => {
  const phase = document.getElementById("answerInput").closest(".phase");
  window.visualViewport.dispatchEvent(new Event("resize"));
  return { y: window.scrollY, t: phase ? phase.style.transform : "" };
});
check("stable: no oscillation on repeated resizes", y1.y === y2.y && y1.t === y2.t, { y1, y2 });

// leaving the type phase must clear the shift on the next anchor tick
await page.evaluate(() => {
  setPhase("see");
  window.visualViewport.dispatchEvent(new Event("resize"));
});
await page.waitForTimeout(250);
const cleared = await page.evaluate(() => {
  const phase = document.getElementById("answerInput").closest(".phase") || document.querySelector(".phase");
  return phase ? (phase.style.transform || "(none)") : "(none)";
});
check("shift resets outside the type phase", cleared === "(none)" || cleared === "", { cleared });

console.log(`\n${results.filter(r => r.pass).length}/${results.length} pass`);
await browser.close();
try { server.close(); } catch (e) { /* ignore */ }
process.exitCode = results.every(r => r.pass) ? 0 : 1;
