// Accessibility: axe-core audit + explicit contrast checks, in light and dark,
// across the three viewports. Fails on any serious/critical axe violation.
import fs from "node:fs";
import path from "node:path";
import { AxeBuilder } from "@axe-core/playwright";
import { startServer } from "./server.mjs";
import { launchBrowser, newContext, gotoApp, setTheme, playOneWord, ensureDirs, ARTIFACTS, VIEWPORTS } from "./helpers.mjs";

// WCAG AA: 4.5:1 body text, 3:1 large text (>=18.66px bold or >=24px).
const CONTRAST_RULES = [
  { selector: ".ready-copy", min: 3, label: "ready headline" },
  { selector: ".ready-hint", min: 4.5, label: "ready hint" },
  { selector: ".kbd-hint", min: 4.5, label: "keyboard hint" },
  { selector: ".type-hint", min: 4.5, label: "type hint" },
  { selector: ".panel-hint", min: 4.5, label: "panel hint" },
  { selector: ".pill-label", min: 4.5, label: "pill label" },
  { selector: ".stat-label", min: 4.5, label: "stat label" },
  { selector: ".settings-heading", min: 4.5, label: "settings heading" },
  { selector: ".deck-title", min: 4.5, label: "deck title" },
  { selector: ".field label", min: 4.5, label: "field label" },
  { selector: ".type-instruction", min: 4.5, label: "type instruction" },
  { selector: ".result-headline", min: 4.5, label: "result headline" },
  { selector: ".session-category", min: 4.5, label: "session category" },
  { selector: ".bucket-count", min: 4.5, label: "bucket count badge" },
  { selector: ".summary-badge", min: 4.5, label: "summary badge" },
  { selector: ".tally-value", min: 4.5, label: "tally value" },
  { selector: ".result-sub", min: 4.5, label: "result sub" },
  { selector: ".modal-body-text", min: 4.5, label: "modal body" },
  { selector: ".danger-zone-note", min: 4.5, label: "danger zone note" },
  { selector: ".mini-list li", min: 4.5, label: "my words list item" },
  { selector: ".btn-danger-quiet", min: 4.5, label: "danger button" },
  { selector: ".add-word-row select", min: 4.5, label: "my words category select" }
];

// Non-text UI components that carry information (WCAG 1.4.11): 3:1 against
// their adjacent background. These are the pieces a colour-only reading of
// the UI depends on (progress segments, toggles, bars).
const NONTEXT_RULES = [
  // the track is only the background of the indicator — what matters is the
  // filled part against the track it sits on
  { selector: ".session-track-fill", against: ".session-track", min: 3, label: "session track fill vs track" },
  { selector: ".session-accent-dot", min: 3, label: "accent dot" },
  { selector: ".toggle-track", min: 3, label: "toggle track" },
  { selector: ".category-stat-bar-track", min: 3, label: "category bar track" },
  { selector: ".category-stat-bar-fill", min: 3, label: "category bar fill" }
];

function srgb(c) {
  c /= 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}
function luminance(rgb) {
  const [r, g, b] = rgb;
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}
function contrast(fg, bg) {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}
function parseRgb(str) {
  const m = String(str).match(/rgba?\(([^)]+)\)/);
  if (!m) return null;
  const parts = m[1].split(",").map((x) => parseFloat(x));
  if (parts.length >= 4 && parts[3] === 0) return null; // fully transparent
  return [parts[0], parts[1], parts[2], parts.length >= 4 ? parts[3] : 1];
}

// Composite a possibly translucent colour over an opaque backdrop.
function over(fg, bg) {
  if (!fg || !bg) return null;
  const a = fg.length > 3 ? fg[3] : 1;
  if (a >= 1) return fg;
  return [
    fg[0] * a + bg[0] * (1 - a),
    fg[1] * a + bg[1] * (1 - a),
    fg[2] * a + bg[2] * (1 - a),
    1
  ];
}

async function run() {
  ensureDirs();
  const { server, origin } = await startServer();
  const browser = await launchBrowser();
  const report = { generatedAt: new Date().toISOString(), axe: [], contrast: [], problems: [] };

  for (const vp of VIEWPORTS) {
    for (const theme of ["light", "dark"]) {
      const { context, problems } = await newContext(browser, vp);
      const page = await context.newPage();
      await gotoApp(page, origin);
      await setTheme(page, theme);

      // axe on the idle screen
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
        .analyze();
      report.axe.push({
        viewport: vp.name,
        theme,
        violations: results.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
          targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
          messages: v.nodes.slice(0, 5).map((n) => (n.any || []).map((c) => c.message).join("; "))
        }))
      });

      // axe on the type phase (input, buttons, live region)
      await playOneWord(page, "correct");
      // let transient animations (the floating score popup) finish before the
      // scan, otherwise axe measures a half-faded colour
      await page.waitForTimeout(1200);
      const results2 = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"])
        .analyze();
      report.axe.push({
        viewport: vp.name,
        theme,
        phase: "correct",
        violations: results2.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          help: v.help,
          nodes: v.nodes.length,
          targets: v.nodes.slice(0, 5).map((n) => n.target.join(" ")),
          messages: v.nodes.slice(0, 5).map((n) => (n.any || []).map((c) => c.message).join("; "))
        }))
      });

      // explicit contrast probes
      const probes = await page.evaluate((rules) => {
        // Effective background: the element's own background if opaque,
        // otherwise the nearest ancestor that has one.
        const effectiveBg = (el) => {
          let node = el;
          while (node && node !== document.documentElement) {
            const c = getComputedStyle(node).backgroundColor;
            const m = c.match(/rgba?\(([^)]+)\)/);
            if (m) {
              const p = m[1].split(",").map(parseFloat);
              if (p.length < 4 || p[3] > 0) return c;
            }
            node = node.parentElement;
          }
          return getComputedStyle(document.body).backgroundColor;
        };
        const out = [];
        for (const rule of rules) {
          const el = document.querySelector(rule.selector);
          if (!el) continue;
          const cs = getComputedStyle(el);
          out.push({
            selector: rule.selector,
            label: rule.label,
            min: rule.min,
            color: cs.color,
            background: effectiveBg(el),
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight
          });
        }
        return out;
      }, CONTRAST_RULES);

      probes.forEach((p) => {
        const fg = parseRgb(p.color);
        const bg = parseRgb(p.background);
        const fg2 = over(fg, bg); const ratio = fg2 && bg ? Math.round(contrast(fg2, bg) * 100) / 100 : null;
        const size = parseFloat(p.fontSize);
        const bold = Number(p.fontWeight) >= 700;
        const large = size >= 24 || (bold && size >= 18.66);
        const required = large ? Math.max(3, p.min === 4.5 ? 4.5 : p.min) : p.min;
        const ok = ratio !== null && ratio >= required;
        report.contrast.push({ viewport: vp.name, theme, ...p, ratio, required, ok });
        if (!ok) report.problems.push(`contrast ${vp.name}/${theme} ${p.label}: ${ratio} (needs ${required})`);
      });

      // non-text UI contrast (3:1) — the graphic itself against the surface it
      // sits on (nearest opaque ancestor background).
      const nonText = await page.evaluate((rules) => {
        const effectiveBg = (el) => {
          let node = el.parentElement;
          while (node && node !== document.documentElement) {
            const c = getComputedStyle(node).backgroundColor;
            const m = c.match(/rgba?\(([^)]+)\)/);
            if (m) {
              const p = m[1].split(",").map(parseFloat);
              if (p.length < 4 || p[3] > 0) return c;
            }
            node = node.parentElement;
          }
          return getComputedStyle(document.body).backgroundColor;
        };
        const out = [];
        for (const rule of rules) {
          const el = document.querySelector(rule.selector);
          if (!el) continue;
          const cs = getComputedStyle(el);
          const own = cs.backgroundColor;
          const m = own.match(/rgba?\(([^)]+)\)/);
          const opaque = m && (m[1].split(",").length < 4 || parseFloat(m[1].split(",")[3]) > 0);
          if (!opaque) continue; // nothing to measure (transparent graphic)
          // an explicit "against" element wins; otherwise use the nearest
          // opaque ancestor surface
          let bg;
          if (rule.against) {
            const other = document.querySelector(rule.against);
            bg = other ? getComputedStyle(other).backgroundColor : effectiveBg(el);
          } else {
            bg = effectiveBg(el);
          }
          out.push({
            selector: rule.selector,
            label: rule.label,
            min: rule.min,
            color: own,
            background: bg,
            fontSize: cs.fontSize,
            fontWeight: cs.fontWeight
          });
        }
        return out;
      }, NONTEXT_RULES);

      nonText.forEach((p) => {
        const fg = parseRgb(p.color);
        const bg = parseRgb(p.background);
        const fg2 = over(fg, bg); const ratio = fg2 && bg ? Math.round(contrast(fg2, bg) * 100) / 100 : null;
        const ok = ratio !== null && ratio >= p.min;
        report.contrast.push({ viewport: vp.name, theme, nonText: true, ...p, ratio, required: p.min, ok });
        if (!ok) report.problems.push(`non-text ${vp.name}/${theme} ${p.label}: ${ratio} (needs ${p.min})`);
      });

      if (problems.length) report.problems.push(`${vp.name}/${theme} console: ${problems.join(" | ")}`);
      await context.close();
    }
  }

  // ---- reduced-motion pass: animations must be neutralised ----
  {
    const { context, problems } = await newContext(browser, { width: 1440, height: 900 }, { reducedMotion: "reduce" });
    const page = await context.newPage();
    await gotoApp(page, origin);
    const motion = await page.evaluate(() => {
      const el = document.querySelector(".word-display") || document.querySelector(".btn");
      const cs = getComputedStyle(el);
      const card = getComputedStyle(document.getElementById("gameCard"));
      return {
        transitionDuration: cs.transitionDuration,
        animationDuration: cs.animationDuration,
        confettiDisplay: getComputedStyle(document.getElementById("confettiLayer")).display,
        cardAnimationDuration: card.animationDuration
      };
    });
    const durations = `${motion.transitionDuration} ${motion.animationDuration} ${motion.cardAnimationDuration}`;
    // Chrome reports .001ms as 1e-06s — anything below 10ms counts as neutralised
    const ms = (v) => parseFloat(v) * (String(v).includes("ms") ? 1 : 1000);
    const neutralised =
      ms(motion.transitionDuration) < 10 &&
      ms(motion.animationDuration) < 10 &&
      ms(motion.cardAnimationDuration) < 10 &&
      motion.confettiDisplay === "none";
    report.reducedMotion = { ...motion, neutralised };
    if (!neutralised) report.problems.push(`reduced-motion not honoured: ${durations} confetti=${motion.confettiDisplay}`);
    const rmAxe = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]).analyze();
    report.reducedMotionAxeViolations = rmAxe.violations.map((v) => v.id);
    if (problems.length) report.problems.push(`reduced-motion console: ${problems.join(" | ")}`);
    await context.close();
  }

  await browser.close();
  server.close();
  fs.writeFileSync(path.join(ARTIFACTS, "a11y-report.json"), JSON.stringify(report, null, 2));

  const serious = report.axe.flatMap((a) => a.violations.filter((v) => v.impact === "serious" || v.impact === "critical"));
  console.log(`axe runs: ${report.axe.length}, violations: ${report.axe.reduce((n, a) => n + a.violations.length, 0)} (serious/critical: ${serious.length})`);
  console.log(`contrast probes: ${report.contrast.length}, failures: ${report.contrast.filter((c) => !c.ok).length}`);
  console.log(`reduced-motion neutralised: ${report.reducedMotion.neutralised}`);
  if (report.problems.length) {
    report.problems.forEach((p) => console.log(" - " + p));
    process.exitCode = 1;
  }
}

run();
