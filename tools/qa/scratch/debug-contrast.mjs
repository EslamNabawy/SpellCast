// Debug probe: dump resolved custom properties and computed colors for the
// elements axe flagged, in a given viewport/theme.
import { startServer } from "./server.mjs";
import { launchBrowser, newContext, gotoApp, setTheme } from "./helpers.mjs";

const width = Number(process.argv[2] || 1440);
const theme = process.argv[3] || "dark";

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);
await setTheme(page, theme);

const out = await page.evaluate(() => {
  const cs = (el) => (el ? getComputedStyle(el) : null);
  const body = document.body;
  const pill = document.getElementById("headerTimerPill");
  const label = pill && pill.querySelector(".pill-label");
  const resetBtn = document.getElementById("resetAllBtn");
  const sel = document.getElementById("customWordCategory");
  return {
    htmlDataTheme: document.documentElement.getAttribute("data-theme"),
    bodyClass: body.className,
    bodyAccentTint: cs(body).getPropertyValue("--accent-tint").trim(),
    bodyInkSoft: cs(body).getPropertyValue("--ink-soft").trim(),
    bodyPaper: cs(body).getPropertyValue("--paper").trim(),
    pillBg: pill ? cs(pill).backgroundColor : null,
    pillLabelColor: label ? cs(label).color : null,
    resetColor: resetBtn ? cs(resetBtn).color : null,
    resetBg: resetBtn ? cs(resetBtn).backgroundColor : null,
    selectColor: sel ? cs(sel).color : null,
    selectBg: sel ? cs(sel).backgroundColor : null,
    selectBgVar: sel ? cs(sel).getPropertyValue("background").trim() : null,
    matchesDarkRule: body.matches("html[data-theme='dark'] .theme-normal")
  };
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
server.close();
