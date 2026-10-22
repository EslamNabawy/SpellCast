# SpellCast QA harness

Dev-only. **Nothing in this folder is loaded by the app** — `index.html` only
references `style.css`, `script.js`, `words.js` and the icon files at the repo
root. The harness exists to catch regressions before they reach GitHub Pages.

## Setup

```bash
cd tools/qa
npm install          # playwright, @axe-core/playwright, lighthouse, chrome-launcher
npm run all          # session → fixture → a11y → layout → matrix → lighthouse
```

The harness drives the **installed system Chrome** (Playwright `channel: "chrome"`)
so no browser download is needed. Set `PLAYWRIGHT_CHANNEL=chromium` to use
Playwright's own pinned build instead.

## Scripts

| Script | What it does | Output |
|---|---|---|
| `npm run session` | Scripted full session: start → correct → incorrect → Back → Esc-skip → Bucket → Categories → every setting → sound/volume → theme → Finish+confirm → summary → delete-all dialog. Fails on any console error, warning or failed request. | `test-results/session-report.json` |
| `npm run fixture` | Captures a localStorage fixture from a live session, reloads it in a clean context and asserts that no progress key is lost or rewritten. | `test-results/fixture.json`, `fixture-report.json` |
| `npm run a11y` | axe-core (WCAG 2.1 AA + best-practice) on idle and result phases, both themes, 3 viewports; 138 explicit contrast probes (text 4.5:1, non-text 3:1, alpha-composited); reduced-motion verification. | `test-results/a11y-report.json` |
| `npm run layout` | No page scroll at 1280×720 / 1440×900 / 1920×1080, no horizontal scrollbars, mobile settings sheet reachable. | `test-results/layout-report.json` |
| `npm run matrix` | 3 viewports × 2 themes × 11 states = 66 screenshots. | `test-results/shots/*.png` |
| `npm run lighthouse` | Lighthouse desktop + mobile presets. | `test-results/lighthouse.json` |

Run a single step: `node session.mjs`, or `npm run all -- session a11y`.

## Where output goes

By default **into `tools/qa/test-results/` (git-ignored)** — a harness run never
dirties the tracked tree. To refresh the committed reference snapshot in
`docs/baseline/` on purpose:

```bash
QA_BASELINE=1 npm run all       # bash
$env:QA_BASELINE=1; npm run all # PowerShell
```

The committed snapshot in `docs/baseline/` is the *baseline of record* for the
current release; `docs/baseline/BASELINE.md` explains every number in it.

## Scratch

`tools/qa/scratch/` holds one-off diagnostic probes kept for future triage
(cascade/contrast tracing via CDP, custom-property chain dumps). They are not
part of `npm run all` and are not maintained.
