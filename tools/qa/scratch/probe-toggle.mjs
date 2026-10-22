// v=32 a11y fail triage: what pair does the dark-mode .toggle-track probe
// actually see? Mirrors a11y.mjs non-text probe (own bg vs parent chain).
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1440, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);
await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));

const rows = await page.evaluate(() => {
  const effectiveBg = (el) => {
    let node = el.parentElement;
    while (node && node !== document.documentElement) {
      const c = getComputedStyle(node).backgroundColor;
      const m = c.match(/rgba?\(([^)]+)\)/);
      if (m) {
        const p = m[1].split(",").map(parseFloat);
        if (p.length < 4 || p[3] > 0) return c + " @ " + (node.className || node.id || node.tagName);
      }
      node = node.parentElement;
    }
    return getComputedStyle(document.body).backgroundColor + " @ body";
  };
  const parse = (s) => (s.match(/rgba?\(([^)]+)\)/) || [])[1].split(",").map(parseFloat);
  const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
  const L = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);

  return [...document.querySelectorAll(".toggle-track")].map((track, i) => {
    const own = getComputedStyle(track).backgroundColor;
    const bgStr = effectiveBg(track);
    const bg = parse(bgStr);
    const fg = parse(own);
    const ratio = (Math.max(L(fg), L(bg)) + 0.05) / (Math.min(L(fg), L(bg)) + 0.05);
    const toggle = track.closest(".toggle");
    const field = track.closest(".field");
    return {
      i,
      toggleId: toggle && toggle.id,
      ariaChecked: toggle && toggle.getAttribute("aria-checked"),
      own,
      parentBg: bgStr,
      fieldVisible: field ? field.offsetParent !== null : null,
      ratio: Math.round(ratio * 100) / 100,
    };
  });
});
console.log(JSON.stringify(rows, null, 1));
await browser.close();
server.close();
