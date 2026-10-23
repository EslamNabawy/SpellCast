// v=37 probe: the pinned "My words" practice option serves only custom words.
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const results = [];
const check = (name, pass, extra) => {
  results.push({ name, pass: !!pass, extra: extra ?? null });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${extra != null ? ` (${JSON.stringify(extra)})` : ""}`);
};

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1280, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);

// two custom words first
await page.evaluate(() => {
  const btn = document.getElementById("dataOpen2") || document.querySelector("[data-open-data]");
  btn.click();
});
await page.waitForSelector("#dataPage:not([hidden])", { timeout: 5000 });
await page.fill("#importPaste", "quantumquill\nverdantmist");
await page.click("#importParseBtn");
await page.waitForSelector("#actionDialog:not([hidden])", { timeout: 5000 });
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("#actionDialog button")].find(b => /Add \d+ words/.test(b.textContent));
  if (btn) btn.click();
});
await page.waitForTimeout(300);

// choose the pinned My words option via the real handler
await page.evaluate(() => {
  const sel = document.getElementById("categorySelect");
  const opt = [...sel.options].find(o => o.value === "__mine__");
  sel.value = "__mine__";
  sel.dispatchEvent(new Event("change"));
  return opt ? opt.textContent : null;
});
await page.waitForTimeout(200);
const chosen = await page.evaluate(() => ({
  value: document.getElementById("categorySelect").value,
  dialogOpen: !document.getElementById("actionDialog").hidden,
  poolSize: state.wordPool.length
}));
check("My words option commits (no dialog)", chosen.value === "__mine__" && !chosen.dialogOpen, chosen);

const diag = await page.evaluate(() => ({
  cat: state.category,
  defVals: SETTING_DEFS.category.values(),
  mineAllowed: SETTING_DEFS.category.values().includes("__mine__"),
  poolLen: state.wordPool.length,
  customLen: state.customWords.length
}));
console.log("DIAG " + JSON.stringify(diag));
check("pool holds only the two custom words", chosen.poolSize === 2, chosen);

// leave data page, start, served word must be a custom one
await page.evaluate(() => closeDataPage());
await page.click("#startBtn");
await page.waitForFunction(() => state.phase === "see", null, { timeout: 8000 });
const served = await page.evaluate(() => document.getElementById("wordDisplay").textContent.trim());
check("serves a custom word", ["quantumquill", "verdantmist"].includes(served.toLowerCase()), { served });

const passing = results.filter(r => r.pass).length;
console.log(`\n${passing}/${results.length} pass`);
await browser.close();
try { server.close(); } catch (e) { /* ignore */ }
process.exitCode = passing === results.length ? 0 : 1;
