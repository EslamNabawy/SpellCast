// One-off probe: finds which elements inside the mobile settings drawer
// overflow horizontally (and the drawer's own scroll metrics) at phone widths.
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 390, height: 844 });
const page = await context.newPage();
await gotoApp(page, origin);
await page.evaluate(() => document.getElementById("settingsToggle").click());
await page.waitForTimeout(400);
// worst case: sound on (volume row shown) + My words open (extra section)
await page.evaluate(() => {
  document.getElementById("soundToggle").click();
  const d = document.getElementById("customWordInput")?.closest("details");
  if (d) d.open = true;
});
await page.waitForTimeout(300);

const report = await page.evaluate(() => {
  const panel = document.querySelector(".deck-left .settings-panel");
  const out = {
    panel: {
      scrollW: panel.scrollWidth, clientW: panel.clientWidth,
      scrollH: panel.scrollHeight, clientH: panel.clientHeight,
      maxH: getComputedStyle(panel).maxHeight,
      scrollbarWidth: getComputedStyle(panel).scrollbarWidth,
      rect: panel.getBoundingClientRect().toJSON(),
    },
    offenders: [],
  };
  panel.querySelectorAll("*").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0) {
      out.offenders.push({
        tag: el.tagName, cls: String(el.className), id: el.id,
        scrollW: el.scrollWidth, clientW: el.clientWidth, w: Math.round(r.width),
        right: Math.round(r.right),
      });
    }
  });
  out.bodyScrollW = document.documentElement.scrollWidth;
  out.bodyClientW = document.documentElement.clientWidth;
  return out;
});
console.log(JSON.stringify(report, null, 2));
await browser.close();
server.close();
process.exit(0);
