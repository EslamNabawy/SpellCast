// One-off: regenerate favicon.png (32), apple-touch-icon.png (180), favicon.ico
// (ICO container wrapping the 32px PNG) from favicon.svg — the step-6 brand tile.
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(here, "..", "..", "..");
const svg = fs.readFileSync(path.join(REPO, "favicon.svg"), "utf8");

async function render(size) {
  const browser = await chromium.launch({ channel: process.env.PLAYWRIGHT_CHANNEL || "chrome" });
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  const html = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}img{display:block;width:${size}px;height:${size}px}</style></head><body><img id="t" src="data:image/svg+xml;utf8,${encodeURIComponent(svg)}"></body></html>`;
  await page.setContent(html);
  const buf = await page.locator("#t").screenshot({ omitBackground: true });
  await browser.close();
  return buf;
}

const p32 = await render(32);
const p180 = await render(180);
fs.writeFileSync(path.join(REPO, "favicon.png"), p32);
fs.writeFileSync(path.join(REPO, "apple-touch-icon.png"), p180);

// favicon.ico: 6-byte header + 16-byte dir entry + the 32px PNG bytes
const header = Buffer.from([0, 0, 1, 0, 1, 0]);
const entry = Buffer.alloc(16);
entry[0] = 32; entry[1] = 32; // width/height
entry[2] = 0; entry[3] = 0;   // colors, reserved
entry.writeUInt16LE(1, 4);    // planes
entry.writeUInt16LE(32, 6);   // bpp
entry.writeUInt32LE(p32.length, 8);
entry.writeUInt32LE(22, 12);  // 6 + 16
fs.writeFileSync(path.join(REPO, "favicon.ico"), Buffer.concat([header, entry, p32]));
console.log(`favicon rebuilt: png32=${p32.length}B touch180=${p180.length}B ico=${p32.length + 22}B`);
