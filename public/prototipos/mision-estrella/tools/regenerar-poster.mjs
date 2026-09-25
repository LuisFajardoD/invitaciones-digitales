// Regenerar póster y OG — ejecutar cada vez que cambie la portada (escena, modelos, encuadre o textos):
//   node public/prototipos/mision-estrella/tools/regenerar-poster.mjs
// Abre la invitación real (Playwright + Chromium con la GPU), espera a que el 3D esté listo (astronauta GLB, foto,
// shaders) y captura la portada con el MISMO encuadre que se ve en cada proporción de pantalla. Escribe:
//   assets/poster/poster-{9x19.5,9x16,3x4,16x9}.webp  y  assets/og-image.png (1200×630)
// y actualiza en index.html la lista de variantes con su punto focal (entre /*POSTERS*/ … /*/POSTERS*/).
import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const PROTO = path.resolve(HERE, ".."), PUB = path.resolve(PROTO, "..", ".."), ROOT = path.resolve(PUB, "..");
const require = createRequire(path.join(ROOT, "package.json"));
const { chromium } = require("playwright");

// [nombre, ancho CSS, alto CSS, escala, modo]: el póster sólo se usa en la vitrina (?showcase=1, sin textos), así que
// todas las variantes se capturan con el encuadre de la vitrina
const VARIANTS = [["9x19.5", 390, 845, 2, "&showcase=1"], ["9x16", 360, 640, 2, "&showcase=1"], ["3x4", 430, 573, 2, "&showcase=1"], ["16x9", 1280, 720, 1, "&showcase=1"]];
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".svg": "image/svg+xml", ".png": "image/png", ".webp": "image/webp", ".glb": "model/gltf-binary", ".json": "application/json" };
const srv = http.createServer((req, res) => {
  const p = path.join(PUB, decodeURIComponent(req.url.split("?")[0]));
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); res.end(); return; } res.writeHead(200, { "content-type": MIME[path.extname(p)] || "application/octet-stream" }); res.end(b); });
}).listen(0);
const base = `http://localhost:${srv.address().port}/prototipos/mision-estrella/index.html?demo=1&debug=1&q=medium`;
const browser = await chromium.launch({ args: ["--use-angle=d3d11", "--ignore-gpu-blocklist"] });
const outDir = path.join(PROTO, "assets", "poster");
fs.mkdirSync(outDir, { recursive: true });

async function open(w, h, extra) {
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  page.on("pageerror", (e) => console.log("  error en la página:", e.message));
  await page.goto(base + extra);
  await page.waitForFunction(() => window.__ready && window.__exportPoster && window.__film?.astro.kind !== "procedural", null, { timeout: 60000 });
  await page.waitForTimeout(1600); // (la entrada acerca la cámara ~1.2 s: capturar ya en el encuadre final)
  return page;
}
const list = [];
for (const [name, w, h, scale, extra] of VARIANTS) {
  const page = await open(w, h, extra);
  const r = await page.evaluate((s) => { const { canvas, focus } = window.__exportPoster.capture(s); return { url: canvas.toDataURL("image/webp", 0.82), focus }; }, scale);
  const file = path.join(outDir, `poster-${name}.webp`);
  fs.writeFileSync(file, Buffer.from(r.url.split(",")[1], "base64"));
  const fx = Math.round(r.focus.x * 1000) / 10, fy = Math.round(r.focus.y * 1000) / 10;
  list.push(`["${name}", ${(w / h).toFixed(4)}, ${fx}, ${fy}]`);
  console.log(`póster ${name}: ${w * scale}×${h * scale}, ${(fs.statSync(file).size / 1024).toFixed(0)} KB, foco ${fx}% ${fy}%`);
  await page.close();
}
{ // OG 1200×630: vitrina con espacio para el título
  const page = await open(1200, 630, "&showcase=1&title=1");
  const url = await page.evaluate(() => window.__exportPoster.og().toDataURL("image/png"));
  fs.writeFileSync(path.join(PROTO, "assets", "og-image.png"), Buffer.from(url.split(",")[1], "base64"));
  console.log(`og-image.png: ${(fs.statSync(path.join(PROTO, "assets", "og-image.png")).size / 1024).toFixed(0)} KB`);
  await page.close();
}
const idx = path.join(PROTO, "index.html");
const html = fs.readFileSync(idx, "utf8").replace(/\/\*POSTERS\*\/[\s\S]*?\/\*\/POSTERS\*\//, `/*POSTERS*/[${list.join(", ")}]/*/POSTERS*/`);
fs.writeFileSync(idx, html);
const old = path.join(PROTO, "assets", "poster.webp");
if (fs.existsSync(old)) fs.unlinkSync(old); // póster único anterior (reemplazado por las variantes)
console.log("index.html actualizado con", list.length, "variantes");
await browser.close(); srv.close();
