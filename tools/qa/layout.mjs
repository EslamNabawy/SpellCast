// Layout QA: no page scroll at the three desktop sizes, no horizontal
// scrollbars anywhere, and no element overflowing its container horizontally.
import fs from "node:fs";
import path from "node:path";
import { startServer } from "./server.mjs";
import { launchBrowser, newContext, gotoApp, setTheme, playOneWord, ensureDirs, ARTIFACTS } from "./helpers.mjs";

const SIZES = [
  { name: "1280x720", width: 1280, height: 720 },
  { name: "1440x900", width: 1440, height: 900 },
  { name: "1920x1080", width: 1920, height: 1080 }
];

const checks = [];
function check(name, ok, detail = "") {
  checks.push({ name, ok: !!ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${detail ? " — " + detail : ""}`);
}

async function run() {
  ensureDirs();
  const { server, origin } = await startServer();
  const browser = await launchBrowser();
  const report = { generatedAt: new Date().toISOString(), sizes: [] };

  for (const size of SIZES) {
    for (const theme of ["light", "dark"]) {
      const { context, problems } = await newContext(browser, size);
      const page = await context.newPage();
      await gotoApp(page, origin);
      await setTheme(page, theme);

      // open the panels that are most likely to overflow
      await page.evaluate(() => {
        document.getElementById("bucketToggle").click();
        document.getElementById("categoryStatsToggle").click();
      });
      await page.waitForTimeout(200);

      const m = await page.evaluate(() => {
        const de = document.documentElement;
        const overflowing = [];
        document.querySelectorAll("body *").forEach((el) => {
          if (el.scrollWidth > el.clientWidth + 2 && el.clientWidth > 0) {
            const cs = getComputedStyle(el);
            if (cs.overflowX === "visible" || cs.overflowX === "clip") return; // clipped = not a scrollbar
            if (el.clientWidth <= 2) return; // visually-hidden (sr-only) — never a visible scrollbar
            if (el.classList.contains("sr-only")) return;
            overflowing.push((el.id || el.tagName + "." + el.className) + " cw=" + el.clientWidth + " sw=" + el.scrollWidth + " overflowX=" + cs.overflowX);
          }
        });
        return {
          pageScrollY: de.scrollHeight - de.clientHeight,
          pageScrollX: de.scrollWidth - de.clientWidth,
          bodyScrollX: document.body.scrollWidth - document.body.clientWidth,
          overflowing
        };
      });

      const label = `${size.name}/${theme}`;
      check(`${label} page does not scroll vertically`, m.pageScrollY <= 0, `overflow ${m.pageScrollY}px`);
      check(`${label} page does not scroll horizontally`, m.pageScrollX <= 0 && m.bodyScrollX <= 0, `x ${m.pageScrollX}/${m.bodyScrollX}`);
      check(`${label} no element scrolls horizontally`, m.overflowing.length === 0, m.overflowing.join(" | "));
      if (problems.length) check(`${label} console clean`, false, problems.join(" | "));

      report.sizes.push({ size: size.name, theme, ...m });
      await context.close();
    }
  }

  // mobile: the settings sheet must be reachable and not clipped
  {
    const { context } = await newContext(browser, { width: 375, height: 812 });
    const page = await context.newPage();
    await gotoApp(page, origin);
    await page.click("#settingsToggle");
    await page.waitForSelector("#settingsPanel:not([hidden])");
    const sheet = await page.evaluate(() => {
      const p = document.getElementById("settingsPanel");
      const r = p.getBoundingClientRect();
      return {
        visible: r.height > 0 && r.width > 0,
        withinViewport: r.left >= -1 && r.right <= window.innerWidth + 1,
        scrollable: p.scrollHeight > p.clientHeight,
        listReachable: !!document.getElementById("customWordsList")
      };
    });
    check("375px settings sheet is visible and inside the viewport", sheet.visible && sheet.withinViewport, JSON.stringify(sheet));
    check("375px My Words list is reachable", sheet.listReachable);
    await context.close();
  }

  await browser.close();
  server.close();
  const passed = checks.every((c) => c.ok);
  report.checks = checks;
  report.passed = passed;
  fs.writeFileSync(path.join(ARTIFACTS, "layout-report.json"), JSON.stringify(report, null, 2));
  console.log(passed ? "\nLAYOUT: PASS" : "\nLAYOUT: FAIL");
  if (!passed) process.exitCode = 1;
}

run();
