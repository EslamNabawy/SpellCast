// Controlled experiment inside the page: does a fresh element with class
// "pill" resolve the same? Does an inline var() resolve differently?
import { startServer } from "./server.mjs";
import { launchBrowser, newContext, gotoApp, setTheme } from "./helpers.mjs";

const theme = process.argv[2] || "dark";
const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1440, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);
await setTheme(page, theme);

const out = await page.evaluate(() => {
  const res = {};
  const live = document.getElementById("headerTimerPill");
  res.live = {
    bg: getComputedStyle(live).backgroundColor,
    accentTint: getComputedStyle(live).getPropertyValue("--accent-tint").trim(),
    backgroundShorthand: getComputedStyle(live).background
  };

  // 1) fresh element with the same classes
  const fresh = document.createElement("div");
  fresh.className = "pill pill-timer";
  document.body.appendChild(fresh);
  res.fresh = { bg: getComputedStyle(fresh).backgroundColor, accentTint: getComputedStyle(fresh).getPropertyValue("--accent-tint").trim() };

  // 2) fresh element with only .pill
  const fresh2 = document.createElement("div");
  fresh2.className = "pill";
  document.body.appendChild(fresh2);
  res.freshPillOnly = { bg: getComputedStyle(fresh2).backgroundColor };

  // 3) inline var() on the live element
  live.style.setProperty("background", "var(--accent-tint)");
  res.liveAfterInline = { bg: getComputedStyle(live).backgroundColor };

  // 4) element inside the header
  const inHeader = document.createElement("div");
  inHeader.className = "pill";
  document.querySelector(".status-group").appendChild(inHeader);
  res.inHeader = { bg: getComputedStyle(inHeader).backgroundColor };

  // 5) which theme classes does body actually carry?
  res.bodyClass = document.body.className;
  res.htmlAttr = document.documentElement.getAttribute("data-theme");
  res.bodyAccentTint = getComputedStyle(document.body).getPropertyValue("--accent-tint").trim();
  return res;
});
console.log(JSON.stringify(out, null, 2));
await browser.close();
server.close();
