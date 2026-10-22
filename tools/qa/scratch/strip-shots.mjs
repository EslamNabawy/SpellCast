// Focused visual check of the redesigned session strip: light + dark, at
// desktop and phone widths, in the idle and mid-session states.
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp, setTheme, playOneWord, ensureDirs } from "../helpers.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(here, "..", "test-results", "strip");
fs.mkdirSync(OUT, { recursive: true });

const { server, origin } = await startServer();
const browser = await launchBrowser();

for (const vp of [{ n: "1440", w: 1440, h: 900 }, { n: "375", w: 375, h: 812 }]) {
  for (const theme of ["light", "dark"]) {
    const { context } = await newContext(browser, { width: vp.w, height: vp.h });
    const page = await context.newPage();
    await gotoApp(page, origin);
    await setTheme(page, theme);
    // idle
    await page.locator(".game-top-bar").screenshot({ path: path.join(OUT, `${vp.n}-${theme}-idle.png`) });
    // mid-session: a few answers so the strip has content
    for (let i = 0; i < 4; i++) await playOneWord(page, i % 2 ? "incorrect" : "correct");
    await page.locator(".game-top-bar").screenshot({ path: path.join(OUT, `${vp.n}-${theme}-mid.png`) });
    await context.close();
  }
}
await browser.close();
server.close();
console.log("strip shots ->", OUT);
