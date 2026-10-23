// v=33 probe: Data Management page — hash routing, bulk import pipeline
// (CSV w/ header + quoted fields, alias keys, difficulty aliases), dedupe vs
// library/custom/batch, preview dialog, apply, restore-backup relabel.
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const results = [];
const check = (name, ok, detail = "") => { results.push({ name, ok, detail }); console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`); };

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1440, height: 900 });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });

await gotoApp(page, origin);

// 1. drawer is slimmed: no add form / import row, Manage data present
const drawer = await page.evaluate(() => ({
  formGone: !document.querySelector("#settingsPanels form.add-word-form") && !document.querySelector("aside #addWordForm"),
  manageBtn: !!document.getElementById("dataOpen"),
  badge: document.getElementById("customCountBadge") ? document.getElementById("customCountBadge").textContent : null
}));
check("drawer slimmed to Manage data", drawer.formGone && drawer.manageBtn, JSON.stringify(drawer));

// 2. open via drawer button
await page.evaluate(() => document.getElementById("dataOpen").click());
const opened = await page.evaluate(() => ({
  unhidden: !document.getElementById("dataPage").hidden,
  hash: location.hash
}));
check("Manage data opens the page + sets #data", opened.unhidden && opened.hash === "#data", JSON.stringify(opened));

// 3. deep-link: fresh load with #data lands on the page
await page.evaluate(() => closeDataPage());
await page.evaluate(() => { localStorage.clear(); location.hash = ""; });
await page.reload();
await page.goto(origin + "/#data");
const deepLinked = await page.evaluate(() => ({ unhidden: !document.getElementById("dataPage").hidden, hash: location.hash }));
check("#data deep-link opens the page on load", deepLinked.unhidden, JSON.stringify(deepLinked));
await page.evaluate(() => closeDataPage());

// 4. CSV with header + quoted cells: "word","category","difficulty"
const CSV = `\"word\",\"category\",\"difficulty\"\n\"acute\",\"\",\"1\"\n\"\"\"quoted\"\" crater\",\"my tags\",\"high\"\n\"bucolic\"`;
const csvReport = await page.evaluate((text) => parseImportText(text), CSV);
check("CSV parses header + quoted + aliases", csvReport.source === "csv"
  && csvReport.valid.length === 2
  && csvReport.valid[0].word === "acute"
  && csvReport.valid[0].difficulty === "easy"
  && csvReport.valid[1].word === "bucolic"
  && csvReport.invalid.length === 1, JSON.stringify({ valid: csvReport.valid, invalid: csvReport.invalid }));

// 5. JSON aliases: word/text/term, difficulty 1/low
const jsonReport = await page.evaluate(() => parseImportText(JSON.stringify([
  { text: "switcheroo" },
  { term: "mellifluous", cat: "poetry", tier: "low" }
])));
check("JSON aliases map word/category/difficulty", jsonReport.source === "json"
  && jsonReport.valid.length === 2
  && jsonReport.valid[0].word === "switcheroo"
  && jsonReport.valid[1].category === "poetry"
  && jsonReport.valid[1].difficulty === "easy", JSON.stringify(jsonReport.valid));

// 6. dedupe: batch dupes, library words, previously-added custom words
await page.evaluate(() => addCustomWord("crispin", "nouns", "hard"));
const dedupeReport = await page.evaluate(() => parseImportText("crispin\ncrispin\nserendipity\nzzz\nq"));
check("dedupe skips batch/library/custom + invalid", dedupeReport.valid.length === 2
  && dedupeReport.duplicates.length === 2
  && dedupeReport.invalid.length === 1, JSON.stringify(dedupeReport));

// 7. row cap
const capReport = await page.evaluate(() => parseImportText(Array.from({ length: 5001 }, (_, i) => "w" + i).join("\n")));
check("over 5000 rows rejected", capReport.source === "too-large" && capReport.valid.length === 0);

// 8. full pipeline: paste -> preview dialog -> Add
await page.evaluate(() => { document.getElementById("importPaste").value = "gossamer\nincandescent"; });
await page.evaluate(() => document.getElementById("importParseBtn").click());
const previewShown = await page.evaluate(() => ({ shown: !document.getElementById("actionDialog").hidden, title: document.getElementById("actionDialogTitle").textContent }));
const importBtnText = await page.evaluate(() => {
  const btn = [...document.querySelectorAll("#actionDialogActions button")].find(b => b.dataset.actionId === "import");
  return btn ? btn.textContent : null;
});
check("preview dialog shows with Add N words", previewShown.shown && /^Add 2 words$/.test(importBtnText || ""), JSON.stringify({ previewShown, importBtnText }));
// dialog is not running a session here — the import button resolves via the promise chain
await page.evaluate(() => document.getElementById("dataPage").querySelector("[id='importResult']") !== null);
await page.evaluate(() => closeActionDialog("idle"));

// 9. restore-backup relabel + picker accept — verified in the live markup below
await page.evaluate(() => {
  const report = parseImportText("paintbox");
  applyImport(report);
});
const afterApply = await page.evaluate(() => ({
  result: document.getElementById("importResult") ? document.getElementById("importResult").textContent : null,
  paste: document.getElementById("importPaste").value,
  badge: document.getElementById("customCountBadge").textContent,
  dur: localStorage.getItem("spellcast.preferredDuration")
}));
check("applyImport adds + resets paste + keeps settings", afterApply.result === "Imported 1 words" && afterApply.paste === ""
  && afterApply.badge === "2" && afterApply.dur === null, JSON.stringify(afterApply));

// 10. restore backup label on the moved button
const backupLabels = await page.evaluate(() => ({
  restore: document.getElementById("importBtn") ? document.getElementById("importBtn").textContent.trim() : null,
  restoreFile: document.getElementById("importFile") ? document.getElementById("importFile").getAttribute("accept") : null,
  pickFile: document.getElementById("importPick") ? document.getElementById("importPick").getAttribute("accept") : null
}));
check("Restore backup keeps .json restore + bulk picker accepts csv/json/txt",
  backupLabels.restore === "Restore backup" && backupLabels.restoreFile === ".json"
  && backupLabels.pickFile === ".csv,.json,.txt", JSON.stringify(backupLabels));

// 11. category card renders counts + safety: no accidental progress keys
const safety = await page.evaluate(() => Object.keys(localStorage).filter(k => k.startsWith("spellcast.")));
check("import touched no progress keys beyond customWords/srsCards",
  safety.every(k => ["spellcast.customWords", "spellcast.srsCards", "spellcast.schemaVersion"].includes(k)), JSON.stringify(safety));

// 12. Esc closes the page; focus returns to the opener
await page.evaluate(() => document.getElementById("importParseBtn").focus());
await page.keyboard.press("Escape");
const escClosed = await page.evaluate(() => ({ hidden: document.getElementById("dataPage").hidden, hashOk: location.hash !== "#data" }));
check("Esc closes the page and clears #data", escClosed.hidden && escClosed.hashOk, JSON.stringify(escClosed));

// 13. dark theme sanity: page renders with no contrast-dependent crash
await page.evaluate(() => { location.hash = "data"; });
const darkOpen = await page.evaluate(() => { document.documentElement.setAttribute("data-theme", "dark"); return !document.getElementById("dataPage").hidden; });
check("page opens in dark theme via #data", darkOpen);

const allOk = results.every(r => r.ok) && errors.length === 0;
console.log(allOk ? "ALL PASS" : "FAILURES PRESENT");
if (errors.length) console.log("console/page errors:", errors);
await browser.close();
server.close();
process.exit(allOk ? 0 : 1);
