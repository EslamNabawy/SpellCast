// v=35 probe: a category that arrives through bulk import must be choosable
// in the Practice category select and serve its own words.
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

// import three words with a brand-new category via paste
await page.evaluate(() => {
  const btn = document.getElementById("dataOpen2") || document.getElementById("dataOpen") || document.querySelector("[data-open-data]");
  btn.click();
});
await page.waitForSelector("#dataPage:not([hidden])", { timeout: 5000 });
await page.fill("#importPaste", "proxima,Galaxy,easy\norion,Galaxy,medium\nandromeda,Galaxy,hard");
await page.click("#importParseBtn");
await page.waitForSelector("#actionDialog:not([hidden])", { timeout: 5000 });
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("#actionDialog button")].find(b => /Add \d+ words/.test(b.textContent));
  if (btn) btn.click();
});
await page.waitForTimeout(400);

const after = await page.evaluate(() => ({
  options: [...document.getElementById("categorySelect").options].map(o => o.value),
  customWordCategoryOptions: [...document.getElementById("customWordCategory").options].map(o => o.value),
  galaxyEasy: (WORDS.galaxy && WORDS.galaxy.easy ? WORDS.galaxy.easy : []).length,
  galaxyMedium: (WORDS.galaxy && WORDS.galaxy.medium ? WORDS.galaxy.medium : []).length,
  customCount: state.customWords.length
}));
check("imported category appears in the Practice select", after.options.includes("galaxy"), after);
check("imported words land in the right buckets", after.galaxyEasy === 1 && after.galaxyMedium === 1, after);

// choose it via the real change handler (idle change applies directly, no dialog)
await page.evaluate(() => {
  const sel = document.getElementById("categorySelect");
  sel.value = "galaxy";
  sel.dispatchEvent(new Event("change"));
});
await page.waitForTimeout(300);
const chosen = await page.evaluate(() => ({
  value: document.getElementById("categorySelect").value,
  dialogOpen: !document.getElementById("actionDialog").hidden
}));
check("select commits the imported category directly", chosen.value === "galaxy" && !chosen.dialogOpen, chosen);

// v=35: format chips drive the example block
await page.click("[data-fmt=\"json\"]");
const ex = await page.evaluate(() => ({
  text: document.getElementById("importExample").textContent,
  jsonPressed: document.querySelector("[data-fmt=\"json\"]").getAttribute("aria-pressed"),
  csvPressed: document.querySelector("[data-fmt=\"csv\"]").getAttribute("aria-pressed")
}));
check("JSON chip swaps the example", ex.jsonPressed === "true" && ex.csvPressed === "false" && ex.text.trim().startsWith("["), ex);
await page.click("[data-fmt=\"csv\"]");

// v=35: forced category input claims category-less rows
await page.fill("#importPaste", "silverwind");
await page.fill("#importCategory", "galaxy");
await page.click("#importParseBtn");
await page.waitForSelector("#actionDialog:not([hidden])", { timeout: 5000 });
await page.evaluate(() => {
  const btn = [...document.querySelectorAll("#actionDialog button")].find(b => /Add \d+ words/.test(b.textContent));
  if (btn) btn.click();
});
await page.waitForTimeout(300);
const forced = await page.evaluate(() => ({
  medium: (WORDS.galaxy.medium || []).includes("silverwind"),
  easy: (WORDS.galaxy.easy || []).includes("silverwind"),
  hard: (WORDS.galaxy.hard || []).includes("silverwind")
}));
check("forced category imports the row into galaxy", forced.medium, forced);

// leave the data page before touching game controls
await page.evaluate(() => closeDataPage());
await page.waitForTimeout(200);

// start a session and confirm a Galaxy word is served
await page.click("#startBtn");
await page.waitForFunction(() => state.phase === "see", null, { timeout: 8000 });
const served = await page.evaluate(() => document.getElementById("wordDisplay").textContent.trim());
check("serves a word from the imported category", ["proxima", "orion", "andromeda"].includes(served.toLowerCase()), { served });

const passing = results.filter(r => r.pass).length;
console.log(`\n${passing}/${results.length} pass`);
await browser.close();
try { server.close(); } catch (e) { /* ignore */ }
process.exitCode = passing === results.length ? 0 : 1;
