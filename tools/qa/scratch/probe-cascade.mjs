// raw cascade dump: what does body actually compute in dark mode?
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1440, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);

const dump = await page.evaluate(() => {
  document.documentElement.setAttribute("data-theme", "dark");
  const bs = getComputedStyle(document.body);
  const hs = getComputedStyle(document.documentElement);
  const track = document.querySelector("#chunkToggle .toggle-track");
  document.getElementById("chunkToggle").setAttribute("aria-checked", "true");
  const ts = getComputedStyle(track);
  return {
    htmlTheme: document.documentElement.getAttribute("data-theme"),
    bodyClass: document.body.className,
    html_accentOn: hs.getPropertyValue("--accent-on").trim(),
    html_accentStrong: hs.getPropertyValue("--accent-strong").trim(),
    body_accentOn: bs.getPropertyValue("--accent-on").trim(),
    body_accentStrong: bs.getPropertyValue("--accent-strong").trim(),
    track_bg: ts.backgroundColor,
    sheet: Array.from(document.styleSheets).map((s) => ({ href: (s.href || "").split("/").pop(), rules: (() => { try { return s.cssRules.length; } catch (e) { return "ERR"; } })() })),
    hasDarkBodyRule: (() => {
      try {
        return Array.from(document.styleSheets).some((s) => Array.from(s.cssRules || []).some((r) => (r.selectorText || "").includes('data-theme="dark"] body')));
      } catch (e) { return "ERR"; }
    })(),
  };
});
console.log(JSON.stringify(dump, null, 1));
await browser.close();
server.close();
