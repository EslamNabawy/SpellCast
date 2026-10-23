// v=36 probe: the ambient drifting background must exist, animate, stay
// pointer-inert, sit under the app layer, and disappear under reduced motion.
import { startServer } from "../server.mjs";
import { launchBrowser, newContext, gotoApp } from "../helpers.mjs";

const results = [];
const check = (name, pass, extra) => {
  results.push({ name, pass: !!pass, extra: extra ?? null });
  console.log(`${pass ? "PASS" : "FAIL"} — ${name}${extra != null ? ` (${JSON.stringify(extra)})` : ""}`);
};

const { server, origin } = await startServer();
const browser = await launchBrowser();
const { context } = await newContext(browser, { width: 1280, height: 900 });
const page = await context.newPage();
await gotoApp(page, origin);

const live = await page.evaluate(() => {
  const before = getComputedStyle(document.body, "::before");
  const after = getComputedStyle(document.body, "::after");
  const app = getComputedStyle(document.getElementById("app") || document.querySelector(".app"));
  return {
    beforeAnim: before.animationName,
    afterAnim: after.animationName,
    beforePlay: before.animationPlayState,
    beforePE: before.pointerEvents,
    afterPE: after.pointerEvents,
    appZ: app.zIndex,
    appPos: app.position
  };
});
check("glow layer drifts", live.beforeAnim === "bg-drift" && live.beforePlay === "running", live);
check("dot layer pans", live.afterAnim === "bg-drift-slow", live);
check("layers are pointer-inert", live.beforePE === "none" && live.afterPE === "none", live);
check("app paints above the layers", live.appZ === "1" && live.appPos === "relative", live);

// reduced motion must switch the layers off
const { context: rContext } = await newContext(browser, { width: 1280, height: 900 }, { reducedMotion: "reduce" });
const rPage = await rContext.newPage();
await gotoApp(rPage, origin);
const reduced = await rPage.evaluate(() => ({
  beforeAnim: getComputedStyle(document.body, "::before").animationName,
  afterAnim: getComputedStyle(document.body, "::after").animationName
}));
check("reduced motion disables both layers", reduced.beforeAnim === "none" && reduced.afterAnim === "none", reduced);

const passing = results.filter(r => r.pass).length;
console.log(`\n${passing}/${results.length} pass`);
await browser.close();
try { server.close(); } catch (e) { /* ignore */ }
process.exitCode = passing === results.length ? 0 : 1;
