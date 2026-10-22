// v=32: focus (and therefore the mobile keyboard) must survive
// check -> next reveal -> next type, and the "Word chunks" switch must
// render a word both cut and un-cut with identical textContent.
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1440, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);

const out = [];
const grab = (label) => page.evaluate((l) => {
  const el = document.getElementById("answerInput");
  const pt = document.getElementById("phaseType");
  const cs = getComputedStyle(el);
  return {
    label: l,
    phase: state.phase,
    parked: pt.classList.contains("phase-parked"),
    vis: cs.visibility,
    tab: el.tabIndex,
    rect: Math.round(el.getBoundingClientRect().width) + "x" + Math.round(el.getBoundingClientRect().height),
    focus: document.activeElement && (document.activeElement.id || document.activeElement.tagName),
  };
}, label);

await page.click("#startBtn");
await page.waitForFunction(() => state.phase === "type", null, { timeout: 8000 });
out.push(await grab("type"));

await page.fill("#answerInput", "zzzz-wrong");
await page.keyboard.press("Enter");
await page.waitForFunction(() => state.phase === "correct" || state.phase === "incorrect", null, { timeout: 4000 });
out.push(await grab("at-check"));

// advance must work straight from the parked answer input (no Next-button
// focus steal) — this is exactly what keeps the keyboard up
await page.keyboard.press("Enter");
await page.waitForFunction(() => state.phase === "see", null, { timeout: 8000 });
out.push(await grab("next-reveal"));

await page.waitForFunction(() => state.phase === "type", null, { timeout: 8000 });
out.push(await grab("next-type"));

// Word chunks: off = whole word, on = chips; textContent always the word.
const chunk = await page.evaluate(() => {
  const wd = document.getElementById("wordDisplay");
  const tgl = document.getElementById("chunkToggle");
  tgl.click();
  renderWordDisplay("chocolate");
  const off = { text: wd.textContent, chunks: wd.querySelectorAll(".chunk").length, aria: tgl.getAttribute("aria-checked") };
  tgl.click();
  renderWordDisplay("chocolate");
  const on = { text: wd.textContent, chunks: wd.querySelectorAll(".chunk").length, aria: tgl.getAttribute("aria-checked") };
  return { off, on };
});

const fails = [];
const c = (label, cond, why) => { if (!cond) fails.push(label + ": " + why); };
c("focus@type", out[0].focus === "answerInput", out[0].focus);
c("focus@check", out[1].focus === "answerInput", out[1].focus);
c("focus@reveal", out[2].focus === "answerInput", out[2].focus);
c("focus@next-type", out[3].focus === "answerInput", out[3].focus);
c("visible@check", out[1].vis === "visible", out[1].vis);
c("rect@check", out[1].rect !== "0x0", out[1].rect);
c("tabindex parked", out[1].tab === -1, out[1].tab);
c("tabindex type", out[3].tab !== -1, out[3].tab);
c("chunks off", chunk.off.chunks === 0 && chunk.off.aria === "false", JSON.stringify(chunk.off));
c("chunks on", chunk.on.chunks > 1 && chunk.on.aria === "true", JSON.stringify(chunk.on));
c("text always word", chunk.off.text === "chocolate" && chunk.on.text === "chocolate", JSON.stringify(chunk));

console.log(JSON.stringify({ phases: out, chunk }, null, 1));
console.log(fails.length ? "PROBE-FAIL:\n" + fails.join("\n") : "PROBE-ALL-PASS");
await browser.close();
server.close();
process.exit(fails.length ? 1 : 0);
