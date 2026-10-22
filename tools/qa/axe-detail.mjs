// Prints full axe details (targets + expected/actual ratios) for a given
// viewport/theme so a contrast failure can be traced to exact selectors.
import { AxeBuilder } from "@axe-core/playwright";
import { startServer } from "./server.mjs";
import { launchBrowser, newContext, gotoApp, setTheme, playOneWord } from "./helpers.mjs";

const width = Number(process.argv[2] || 1440);
const theme = process.argv[3] || "dark";

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);
await setTheme(page, theme);
const res = await new AxeBuilder({ page }).withTags(["wcag2aa"]).analyze();
res.violations.forEach((v) => {
  console.log(`\n[${v.impact}] ${v.id} — ${v.help}`);
  v.nodes.forEach((n) => {
    console.log("  target:", JSON.stringify(n.target));
    console.log("  html:", n.html.slice(0, 160));
    (n.any || []).forEach((c) => console.log("  ", c.message));
    (n.all || []).forEach((c) => console.log("  all:", c.message));
  });
});
await browser.close();
server.close();
