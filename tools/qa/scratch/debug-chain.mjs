// Walks the ancestor chain of an element and prints the resolved
// --accent-tint / --paper at each level plus the final computed background.
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
  const el = document.getElementById("headerTimerPill");
  const chain = [];
  let node = el;
  while (node) {
    const cs = getComputedStyle(node);
    chain.push({
      tag: node.tagName,
      id: node.id || null,
      cls: node.className || null,
      accentTint: cs.getPropertyValue("--accent-tint").trim(),
      paper: cs.getPropertyValue("--paper").trim(),
      bg: cs.backgroundColor
    });
    node = node.parentElement;
  }
  return {
    chain,
    pillBg: getComputedStyle(el).backgroundColor,
    pillAccentTint: getComputedStyle(el).getPropertyValue("--accent-tint").trim()
  };
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
server.close();
