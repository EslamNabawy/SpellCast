// Focused probe: does a mid-session setting change open the confirm dialog?
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context, problems } = await newContext(browser, { width: 1440, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);

const out = await page.evaluate(() => {
  const log = [];
  state.sessionWords = 3;
  state.phase = "ready";
  log.push({ step: "before", inProgress: sessionInProgress(), dialogHidden: document.getElementById("actionDialog").hidden });
  const sel = document.getElementById("categorySelect");
  sel.value = "verbs";
  sel.dispatchEvent(new Event("change"));
  log.push({ step: "after dispatch", dialogHidden: document.getElementById("actionDialog").hidden, title: document.getElementById("actionDialogTitle").textContent });
  return log;
});
await page.waitForTimeout(400);
const after = await page.evaluate(() => ({
  dialogHidden: document.getElementById("actionDialog").hidden,
  title: document.getElementById("actionDialogTitle").textContent,
  buttons: [...document.querySelectorAll("#actionDialogActions button")].map((b) => b.textContent),
  category: state.category
}));
console.log(JSON.stringify({ out, after, problems }, null, 2));
await browser.close();
server.close();
