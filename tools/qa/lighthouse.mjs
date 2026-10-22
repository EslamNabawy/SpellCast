// Lighthouse run against the local server (desktop + mobile presets).
// Writes docs/baseline/lighthouse.json and prints the four category scores.
import fs from "node:fs";
import path from "node:path";
import { startServer } from "./server.mjs";
import { ensureDirs, ARTIFACTS } from "./helpers.mjs";

async function run() {
  ensureDirs();
  const { server, origin } = await startServer();
  const lighthouse = (await import("lighthouse")).default;
  const { launch: launchChrome } = await import("chrome-launcher");

  const results = [];
  for (const preset of ["desktop", "mobile"]) {
    const chrome = await launchChrome({
      chromeFlags: ["--headless=new", "--disable-gpu", "--no-sandbox"]
    });
    const config = {
      extends: "lighthouse:default",
      settings: { onlyCategories: ["performance", "accessibility", "best-practices", "seo"], formFactor: preset, screenEmulation: preset === "mobile" ? { mobile: true, width: 412, height: 823, deviceScaleFactor: 1.75, disabled: false } : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }, throttlingMethod: preset === "mobile" ? "simulate" : "provided" }
    };
    const runnerResult = await lighthouse(`${origin}/index.html`, { port: chrome.port, output: "json", logLevel: "error" }, config);
    const lhr = runnerResult.lhr;
    results.push({
      preset,
      scores: Object.fromEntries(Object.entries(lhr.categories).map(([k, v]) => [k, v.score])),
      metrics: {
        fcp: lhr.audits["first-contentful-paint"].displayValue,
        lcp: lhr.audits["largest-contentful-paint"].displayValue,
        tbt: lhr.audits["total-blocking-time"].displayValue,
        cls: lhr.audits["cumulative-layout-shift"].displayValue,
        speedIndex: lhr.audits["speed-index"].displayValue
      },
      failedAudits: Object.values(lhr.audits)
        .filter((a) => a.score !== null && a.score < 1 && a.scoreDisplayMode !== "informative" && a.scoreDisplayMode !== "notApplicable" && a.scoreDisplayMode !== "manual")
        .map((a) => ({ id: a.id, score: a.score, title: a.title }))
        .slice(0, 25)
    });
    await chrome.kill();
  }

  server.close();
  fs.writeFileSync(path.join(ARTIFACTS, "lighthouse.json"), JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
  results.forEach((r) => {
    console.log(`${r.preset}: perf=${r.scores.performance} a11y=${r.scores.accessibility} bp=${r.scores["best-practices"]} seo=${r.scores.seo} | LCP ${r.metrics.lcp} TBT ${r.metrics.tbt} CLS ${r.metrics.cls}`);
  });
  const bad = results.filter((r) => Object.values(r.scores).some((s) => s < 1));
  if (bad.length) {
    console.log("categories below 1.0 — see docs/baseline/lighthouse.json");
    process.exitCode = 1;
  }
}

run();
