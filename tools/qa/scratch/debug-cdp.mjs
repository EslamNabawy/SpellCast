// Definitive answer: asks Chrome which CSS rules match the element and which
// one wins for background-color (CDP CSS.getMatchedStylesForNode).
import { startServer } from "./server.mjs";
import { launchBrowser, newContext, gotoApp, setTheme } from "./helpers.mjs";

const theme = process.argv[2] || "dark";
const selector = process.argv[3] || "#headerTimerPill";
const prop = process.argv[4] || "background-color";

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1440, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);
await setTheme(page, theme);

const client = await context.newCDPSession(page);
await client.send("DOM.enable");
await client.send("CSS.enable");
const { root } = await client.send("DOM.getDocument", { depth: -1 });
const { nodeId } = await client.send("DOM.querySelector", { nodeId: root.nodeId, selector });
const matched = await client.send("CSS.getMatchedStylesForNode", { nodeId });

const relevant = [];
for (const entry of matched.matchedCSSRules) {
  const rule = entry.rule;
  for (const p of rule.style.cssProperties) {
    if (p.name === prop) {
      relevant.push({
        selector: rule.selectorList.text,
        value: p.value,
        important: p.important,
        origin: rule.origin
      });
    }
  }
}
console.log(JSON.stringify({ matchedRules: relevant, inline: matched.inlineStyle?.cssProperties || [] }, null, 2));
await browser.close();
server.close();
