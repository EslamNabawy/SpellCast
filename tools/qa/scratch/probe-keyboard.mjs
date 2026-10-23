// v=34 probe: when the keyboard squeezes the visual viewport while typing,
// the answer field must be scrolled back into the visible band.
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const results = [];
const check = (name, pass, extra) => {
  results.push({ name, pass: !!pass, extra: extra ?? null });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${extra != null ? ` (${JSON.stringify(extra)})` : ""}`);
};

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 800, height: 600 });
const page = await context.newPage();
await gotoApp(page, origin);
await page.click("#startBtn");
await page.waitForFunction(() => state.phase === "type", null, { timeout: 8000 });
await page.waitForTimeout(200);

// shrink the window like a phone, guarantee scroll overflow, and refocus
await page.setViewportSize({ width: 800, height: 400 });
await page.evaluate(() => {
  const pad = document.createElement("div");
  pad.style.height = "400px";
  document.body.appendChild(pad);
  document.getElementById("answerInput").focus();
});
await page.waitForTimeout(120);

const before = await page.evaluate(() => {
  const r = document.getElementById("answerInput").getBoundingClientRect();
  const vv = window.visualViewport;
  // pick a fake keyboard height that puts the focused input below the band
  const h = Math.max(80, Math.min(320, Math.floor(r.top - 20)));
  Object.defineProperty(vv, "height", { configurable: true, value: h });
  vv.dispatchEvent(new Event("resize"));
  return { h, rectTop: r.top, rectBottom: r.bottom, vvH: vv.height, active: document.activeElement.id, scrollable: document.documentElement.scrollHeight > window.innerHeight };
});
check("arranged: input focused and below fake keyboard band", before.active === "answerInput" && before.rectTop > before.vvH - 8 && before.scrollable, before);

try {
  await page.waitForFunction(() => {
    const vv = window.visualViewport;
    const r = document.getElementById("answerInput").getBoundingClientRect();
    return r.bottom <= vv.height + 2 && r.top > 0;
  }, null, { timeout: 4000 });
  check("rescue scroll moved the input into the band", true);
} catch (e) {
  const diag = await page.evaluate(() => {
    const vv = window.visualViewport;
    return { rect: document.getElementById("answerInput").getBoundingClientRect().toJSON(), vvH: vv.height };
  });
  check("rescue scroll moved the input into the band", false, diag);
}

// band correct, a second event must not oscillate
const y1 = await page.evaluate(() => {
  window.visualViewport.dispatchEvent(new Event("resize"));
  return window.scrollY;
});
await page.waitForTimeout(120);
const y2 = await page.evaluate(() => {
  window.visualViewport.dispatchEvent(new Event("resize"));
  return window.scrollY;
});
check("stable: no oscillation on repeated resizes", Math.abs(y1 - y2) < 2, { y1, y2 });

// phasing out of "type" must disable the anchor
await page.evaluate(() => {
  document.activeElement.blur();
  setPhase("see");
  window.visualViewport.dispatchEvent(new Event("resize"));
});
const y3 = await page.evaluate(() => window.scrollY);
await page.waitForTimeout(120);
const y4 = await page.evaluate(() => window.scrollY);
check("neutral outside the type phase", y3 === y4, { y3, y4 });

console.log(`\n${results.filter(r => r.pass).length}/${results.length} pass`);
await browser.close();
server.close();
if (results.some(r => !r.pass)) process.exit(1);
