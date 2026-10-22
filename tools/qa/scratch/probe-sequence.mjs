// Probe the exact sequence from session.mjs: delete-all (typed DELETE) then a
// mid-session category change.
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context, problems } = await newContext(browser, { width: 1440, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);

const log = [];
// delete all with the typed word
await page.evaluate(() => document.getElementById("resetAllBtn").click());
await page.waitForSelector("#actionDialog:not([hidden])", { timeout: 4000 });
log.push({ step: "delete dialog open", ok: true });
await page.evaluate(() => {
  document.getElementById("actionDialogInput").value = "DELETE";
  document.querySelector("#actionDialogActions .btn-danger").click();
});
await page.waitForTimeout(300);
log.push({
  step: "after delete",
  dialogHidden: await page.evaluate(() => document.getElementById("actionDialog").hidden),
  category: await page.evaluate(() => state.category),
  sessionWords: await page.evaluate(() => state.sessionWords),
  phase: await page.evaluate(() => state.phase)
});

// now the mid-session change
const res = await page.evaluate(() => {
  document.getElementById("actionDialog").hidden = true;
  state.sessionWords = 3;
  const sel = document.getElementById("categorySelect");
  const hadVerbs = [...sel.options].some((o) => o.value === "verbs");
  sel.value = "verbs";
  sel.dispatchEvent(new Event("change"));
  return { hadVerbs, selValue: sel.value, inProgress: sessionInProgress() };
});
log.push({ step: "dispatched change", ...res });
await page.waitForTimeout(400);
log.push({
  step: "final",
  dialogHidden: await page.evaluate(() => document.getElementById("actionDialog").hidden),
  title: await page.evaluate(() => document.getElementById("actionDialogTitle").textContent)
});
console.log(JSON.stringify({ log, problems }, null, 2));
await browser.close();
server.close();
