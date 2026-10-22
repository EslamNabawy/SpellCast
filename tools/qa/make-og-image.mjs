// Generates the social share image (og-image.png, 1200x630) by rendering a
// small card in the browser and screenshotting it. Run after branding changes:
//   node tools/qa/make-og-image.mjs
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import { launchBrowser } from "./helpers.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..", "..");

const card = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  @font-face { font-family: serif; src: local("Georgia"); }
  *{box-sizing:border-box}
  body{margin:0;width:1200px;height:630px;background:#FAF8F3;color:#1F2421;
       font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
       display:flex;flex-direction:column;justify-content:center;padding:84px;position:relative;overflow:hidden}
  .grain{position:absolute;inset:0;background:
      radial-gradient(circle at 12% 18%, rgba(45,106,79,.10), transparent 42%),
      radial-gradient(circle at 88% 78%, rgba(192,138,46,.12), transparent 45%)}
  .brand{display:flex;align-items:center;gap:16px;position:relative}
  .mark{width:60px;height:60px;border-radius:18px;background:#2D6A4F;color:#fff;
        display:grid;place-items:center;font-size:34px}
  .name{font-family:Georgia,"Iowan Old Style",Palatino,serif;font-weight:800;font-size:44px;letter-spacing:-.02em}
  .word{position:relative;margin:44px 0 10px;font-family:Georgia,"Iowan Old Style",Palatino,serif;
        font-size:104px;font-weight:800;letter-spacing:-.03em;line-height:1;
        background:#fff;border:1px solid #E7E2D6;border-radius:28px;padding:38px 54px;display:inline-block;
        box-shadow:0 18px 44px rgba(0,0,0,.07)}
  .tag{position:relative;font-size:31px;color:#5B6560;margin-top:18px}
  .foot{position:absolute;left:84px;bottom:64px;right:84px;display:flex;justify-content:space-between;
        align-items:center;font-size:24px;color:#676E68}
  .pill{background:#E7F0EA;color:#1B4332;border-radius:999px;padding:10px 22px;font-weight:700;font-size:23px}
</style></head><body>
  <div class="grain"></div>
  <div class="brand"><div class="mark">&#9998;</div><div class="name">SpellCast</div></div>
  <div class="word">necessary</div>
  <div class="tag">See it. Type it. Never miss it twice.</div>
  <div class="foot"><span class="pill">457 words &#183; 12 categories</span><span>eslamnabawy.github.io/SpellCast</span></div>
</body></html>`;

const browser = await launchBrowser();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(card, { waitUntil: "load" });
const out = path.join(REPO, "og-image.png");
await page.screenshot({ path: out, type: "png" });
await browser.close();
const kb = Math.round(fs.statSync(out).size / 1024);
console.log(`wrote ${out} (1200x630, ${kb} KB)`);
