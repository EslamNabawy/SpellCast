// Reproduces the reported bug: "changing Category doesn't change the session —
// the select said 'Commonly misspelled' while the card label said 'NOUNS'".
// Hypothesis: SRS/bucket words bypass the category filter that fresh words obey.
import { startServer } from "./server.mjs";
import { launchBrowser, newContext, gotoApp } from "./helpers.mjs";

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1440, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);

const out = await page.evaluate(() => {
  const log = [];

  // 1) pure fresh-pool behaviour: does the pool follow the category?
  document.getElementById("categorySelect").value = "verbs";
  document.getElementById("categorySelect").dispatchEvent(new Event("change"));
  log.push({ step: "select verbs", poolCats: [...new Set(state.wordPool.map((w) => w.category))] });

  // 2) put a NOUN word into the bucket (as if missed earlier)
  state.bucket = [{ word: "cathedral", category: "nouns", mistakes: 3 }];
  saveBucket();

  // 3) now pick words repeatedly and see which categories come out
  const seen = [];
  for (let i = 0; i < 25; i++) {
    const picked = selectNextWord();
    if (picked) seen.push(picked.category + (picked.fromBucket ? "(srs)" : ""));
  }
  const counts = seen.reduce((m, c) => ((m[c] = (m[c] || 0) + 1), m), {});
  log.push({ step: "25 draws with a noun in the bucket", counts });

  // 4) what does the card label show vs the select?
  log.push({
    step: "mismatch check",
    selectValue: document.getElementById("categorySelect").value,
    poolCategories: [...new Set(state.wordPool.map((w) => w.category))]
  });
  return log;
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
server.close();
