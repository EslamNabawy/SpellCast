// Diagnose why fill() sees the input as invisible during the "type" phase.
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1440, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);
await page.click("#startBtn");
await page.waitForFunction(() => state.phase === "type", null, { timeout: 8000 });
await page.waitForTimeout(300);
const diag = await page.evaluate(() => {
  const el = document.getElementById("answerInput");
  const pt = document.getElementById("phaseType");
  const cs = getComputedStyle(el);
  return {
    phase: state.phase,
    phaseTypeClass: pt.className,
    phaseTypeHidden: pt.hidden,
    vis: cs.visibility,
    disp: cs.display,
    op: cs.opacity,
    rect: el.getBoundingClientRect().toJSON(),
    active: document.activeElement && document.activeElement.id,
  };
});
console.log(JSON.stringify(diag, null, 1));
let fillOk = "n/a";
try {
  await page.fill("#answerInput", "test", { timeout: 5000 });
  fillOk = "filled";
} catch (e) {
  fillOk = "FAILED: " + e.message.split("\n")[0];
}
console.log("fill:", fillOk);
await browser.close();
server.close();
