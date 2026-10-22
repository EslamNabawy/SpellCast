// Quick integrity check for the served files (encoding + expected markup).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const html = fs.readFileSync(path.join(REPO, "index.html"), "utf8");
const checks = {
  "action dialog present": html.includes('id="actionDialog"'),
  "bespoke modals removed": !html.includes("finishOverlay") && !html.includes("resetAllOverlay") && !html.includes("resetSessionOverlay"),
  "h1 brand": html.includes('<h1 class="brand-name"'),
  "og tags": html.includes("og:image") && html.includes("twitter:card"),
  "v=27 x3": (html.match(/\?v=27/g) || []).length === 3,
  "no mojibake": !html.includes("â€") && !html.includes("\uFFFD"),
  "icons intact": html.includes("✎") && html.includes("⏱") && html.includes("×") && html.includes("✓"),
  "em dash intact": html.includes("—")
};
Object.entries(checks).forEach(([k, v]) => console.log(`${v ? "ok  " : "FAIL"} ${k}`));
process.exitCode = Object.values(checks).every(Boolean) ? 0 : 1;
