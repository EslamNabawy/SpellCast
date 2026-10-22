// Runs the whole QA harness in order and prints one summary.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const steps = [
  ["session", "session.mjs"],
  ["fixture", "fixture.mjs"],
  ["a11y", "a11y.mjs"],`n  ["layout", "layout.mjs"],
  ["matrix", "capture-matrix.mjs"],
  ["lighthouse", "lighthouse.mjs"]
];

const only = process.argv.slice(2);
const runStep = (name, file) =>
  new Promise((resolve) => {
    console.log(`\n=== ${name} ===`);
    const child = spawn(process.execPath, [path.join(here, file)], { stdio: "inherit" });
    child.on("exit", (code) => resolve({ name, code }));
  });

const results = [];
for (const [name, file] of steps) {
  if (only.length && !only.includes(name)) continue;
  results.push(await runStep(name, file));
}

console.log("\n=== SUMMARY ===");
results.forEach((r) => console.log(`${r.code === 0 ? "PASS" : "FAIL"}  ${r.name}`));
process.exitCode = results.some((r) => r.code !== 0) ? 1 : 0;
