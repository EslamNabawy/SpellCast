// Screenshot matrix: 375 / 768 / 1440 px x light / dark x every app state.
// Output: docs/baseline/shots/<viewport>-<theme>-<state>.png
import fs from "node:fs";
import path from "node:path";
import { startServer } from "./server.mjs";
import { launchBrowser, newContext, gotoApp, setTheme, playOneWord, ensureDirs, SHOTS, VIEWPORTS, THEMES, slug } from "./helpers.mjs";

// Each state is a self-contained function: it drives the page from a fresh
// load into the state it wants to photograph and returns a label.
const STATES = {
  idle: async (page) => {
    await page.waitForSelector("#phaseReady:not([hidden])");
    return "ready";
  },
  reveal: async (page) => {
    await page.evaluate(() => {
      const sel = document.getElementById("durationSelect");
      sel.value = "3000";
      sel.dispatchEvent(new Event("change"));
      document.getElementById("startBtn").click();
    });
    await page.waitForFunction(() => state.phase === "see", null, { timeout: 5000 });
    return "word visible with countdown";
  },
  typing: async (page) => {
    await page.evaluate(() => {
      const sel = document.getElementById("durationSelect");
      sel.value = "3000";
      sel.dispatchEvent(new Event("change"));
      document.getElementById("startBtn").click();
    });
    await page.waitForFunction(() => state.phase === "type", null, { timeout: 9000 });
    await page.fill("#answerInput", "sample");
    return "type phase";
  },
  correct: async (page) => {
    await playOneWord(page, "correct");
    return "correct result";
  },
  incorrect: async (page) => {
    await playOneWord(page, "incorrect");
    return "incorrect result";
  },
  summary: async (page) => {
    await playOneWord(page, "correct");
    await page.evaluate(() => document.getElementById("finishSessionBtn").click());
    // v=26+ asks once (shared confirm dialog) when the deck still has words
    const dialog = await page.$("#actionDialog:not([hidden])");
    if (dialog) await page.click("#actionDialog .btn-primary");
    await page.waitForSelector("#summaryOverlay:not([hidden])");
    return "session summary";
  },
  bucket: async (page) => {
    await playOneWord(page, "incorrect");
    await page.evaluate(() => document.getElementById("bucketToggle").click());
    await page.waitForSelector("#bucketPanel[open]");
    return "bucket panel";
  },
  categories: async (page) => {
    await playOneWord(page, "correct");
    await page.evaluate(() => document.getElementById("categoryStatsToggle").click());
    await page.waitForSelector("#categoryStatsPanel[open]");
    return "category stats panel";
  },
  mywords: async (page) => {
    await page.evaluate(() => {
      const t = document.getElementById("settingsToggle");
      if (document.getElementById("settingsPanel").hidden) t.click();
    });
    await page.waitForSelector("#settingsPanel:not([hidden])");
    await page.evaluate(() => {
      const d = document.querySelector("#settingsPanel details");
      if (d && !d.open) d.open = true;
      const el = document.getElementById("customWordsList");
      if (el) el.scrollIntoView({ block: "center" });
    });
    await page.waitForTimeout(200);
    return "my words manager";
  },
  dialog_finish: async (page) => {
    await playOneWord(page, "correct");
    await page.evaluate(() => document.getElementById("finishSessionBtn").click());
    await page.waitForSelector("#actionDialog:not([hidden])");
    await page.waitForTimeout(400); // let the sheet animation settle before the shot
    return "finish confirm";
  },
  dialog_resetall: async (page) => {
    await page.evaluate(() => document.getElementById("resetAllBtn").click());
    await page.waitForSelector("#actionDialog:not([hidden])");
    await page.waitForTimeout(400);
    return "delete all data confirm";
  }
};

async function run() {
  ensureDirs();
  const { server, origin } = await startServer();
  const browser = await launchBrowser();
  const report = { generatedAt: new Date().toISOString(), origin, shots: [], problems: [] };

  for (const vp of VIEWPORTS) {
    for (const theme of THEMES) {
      const { context, problems } = await newContext(browser, vp);
      const page = await context.newPage();
      for (const [stateName, driver] of Object.entries(STATES)) {
        // fresh state per screenshot: reload so every shot starts clean
        await gotoApp(page, origin);
        await setTheme(page, theme);
        let label = stateName;
        try {
          label = await driver(page);
        } catch (err) {
          report.problems.push(`${vp.name}/${theme}/${stateName}: ${err.message.split("\n")[0]}`);
        }
        const file = path.join(SHOTS, `${vp.name}-${theme}-${slug(stateName)}.png`);
        await page.screenshot({ path: file, fullPage: false });
        report.shots.push({ viewport: vp.name, theme, state: stateName, label, file: path.relative(process.cwd(), file) });
      }
      if (problems.length) report.problems.push(`${vp.name}/${theme}: ${problems.join(" | ")}`);
      await context.close();
    }
  }

  await browser.close();
  server.close();
  fs.writeFileSync(path.join(SHOTS, "..", "screenshot-matrix.json"), JSON.stringify(report, null, 2));
  console.log(`captured ${report.shots.length} screenshots -> docs/baseline/shots/`);
  if (report.problems.length) {
    console.log("PROBLEMS:");
    report.problems.forEach((p) => console.log(" - " + p));
    process.exitCode = 1;
  }
}

run();
