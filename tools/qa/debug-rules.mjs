// CSSOM probe: which rules set the background of a given selector, in order,
// and which one the browser actually applies.
import { startServer } from "./server.mjs";
import { launchBrowser, newContext, gotoApp, setTheme } from "./helpers.mjs";

const theme = process.argv[2] || "dark";
const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1440, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);
await setTheme(page, theme);

const out = await page.evaluate(() => {
  function matchingRules(selector) {
    const hits = [];
    for (const sheet of Array.from(document.styleSheets)) {
      let rules;
      try { rules = sheet.cssRules; } catch (e) { continue; }
      const walk = (list, media) => {
        for (const rule of Array.from(list)) {
          if (rule.cssRules && rule.conditionText !== undefined) { walk(rule.cssRules, rule.conditionText); continue; }
          if (rule.selectorText) {
            try {
              if (document.querySelector(selector).matches(rule.selectorText)) {
                hits.push({
                  media: media || null,
                  selector: rule.selectorText,
                  background: rule.style.background || rule.style.backgroundColor || null,
                  accentTint: rule.style.getPropertyValue("--accent-tint") || null,
                  paper: rule.style.getPropertyValue("--paper") || null
                });
              }
            } catch (e) { /* ignore */ }
          }
        }
      };
      walk(rules, null);
    }
    return hits;
  }
  return {
    pill: matchingRules("#headerTimerPill"),
    select: matchingRules("#customWordCategory"),
    body: matchingRules("body")
  };
});
console.log(JSON.stringify(out, null, 2).slice(0, 4000));
await browser.close();
server.close();
