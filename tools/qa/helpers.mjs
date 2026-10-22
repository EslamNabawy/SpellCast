// Shared helpers for the SpellCast QA harness.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
export const REPO = path.resolve(here, "..", "..");
export const ARTIFACTS = path.join(REPO, "docs", "baseline");
export const SHOTS = path.join(ARTIFACTS, "shots");

export const VIEWPORTS = [
  { name: "375", width: 375, height: 812 },
  { name: "768", width: 768, height: 1024 },
  { name: "1440", width: 1440, height: 900 }
];

export const THEMES = ["light", "dark"];

export function ensureDirs() {
  fs.mkdirSync(ARTIFACTS, { recursive: true });
  fs.mkdirSync(SHOTS, { recursive: true });
}

// Uses the installed system Chrome by default so no browser download is needed.
// Set PLAYWRIGHT_CHANNEL=chromium to use Playwright's pinned build instead.
export async function launchBrowser() {
  const channel = process.env.PLAYWRIGHT_CHANNEL || "chrome";
  return chromium.launch({ channel });
}

export async function newContext(browser, { width, height }, options = {}) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: 1,
    reducedMotion: options.reducedMotion || "no-preference"
  });
  const problems = [];
  context.on("console", (msg) => {
    if (msg.type() === "error" || msg.type() === "warning") {
      problems.push(`[${msg.type()}] ${msg.text()}`);
    }
  });
  context.on("weberror", (err) => problems.push(`[pageerror] ${err.error().message}`));
  context.on("requestfailed", (req) => {
    const url = req.url();
    if (!url.startsWith("data:")) problems.push(`[requestfailed] ${url} ${req.failure()?.errorText || ""}`);
  });
  return { context, problems };
}

export async function gotoApp(page, origin, { query = "" } = {}) {
  await page.goto(`${origin}/index.html${query}`, { waitUntil: "load" });
  await page.waitForSelector("#startBtn", { state: "attached" });
  await page.waitForFunction(() => typeof state !== "undefined" && state.phase === "ready");
}

export async function setTheme(page, theme) {
  await page.evaluate((t) => {
    const dark = t === "dark";
    if (document.documentElement.getAttribute("data-theme") === (dark ? "dark" : null)) return;
    document.getElementById("themeToggle").click();
  }, theme);
  // The theme toggle animates colours (--dur-fast = 140ms). Auditing during the
  // transition samples interpolated colours and produces false contrast
  // failures, so always let the transition settle before measuring.
  await page.waitForTimeout(450);
}

// Drives one word through reveal -> type -> result.
// mode: "correct" | "incorrect" | "skip"
export async function playOneWord(page, mode = "correct") {
  await page.evaluate(() => {
    const sel = document.getElementById("durationSelect");
    if (sel.value !== "1000") {
      sel.value = "1000";
      sel.dispatchEvent(new Event("change"));
    }
    document.getElementById("startBtn").click();
  });
  await page.waitForFunction(() => state.phase === "type", null, { timeout: 8000 });
  if (mode === "skip") {
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => state.phase !== "type", null, { timeout: 4000 });
    return;
  }
  const word = await page.evaluate(() => state.currentWord.word);
  const answer = mode === "correct" ? word : word.slice(0, -1) + (word.endsWith("a") ? "b" : "a");
  await page.fill("#answerInput", answer);
  await page.press("#answerInput", "Enter");
  await page.waitForFunction(
    (m) => state.phase === (m === "correct" ? "correct" : "incorrect"),
    mode,
    { timeout: 6000 }
  );
}

export function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
  return file;
}

export function slug(text) {
  return String(text).replace(/[^a-z0-9]+/gi, "-").toLowerCase();
}
