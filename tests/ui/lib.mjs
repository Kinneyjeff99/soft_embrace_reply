import { createRequire } from 'node:module';
const require = createRequire('/opt/node-tools/node_modules/');
export const { chromium, devices } = require('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
export const DIST = '/home/user/soft_embrace_reply/dist';
export function serve(port = 0) {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.webp': 'image/webp', '.svg': 'image/svg+xml' };
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(DIST, p);
    if (!f.startsWith(DIST) || !fs.existsSync(f)) { res.writeHead(404); res.end(); return; }
    let body = fs.readFileSync(f);
    // no real product is truncated any more: the UI guard is exercised with a synthetic flag on Lace Top (test-only, dist stays untouched)
    if (f.endsWith('index.html') && !process.env.NO_SYNTH) body = Buffer.from(body.toString('utf8').replace('{"id":"lace-top",', '{"id":"lace-top","truncated":["descVi"],'));
    res.writeHead(200, { 'content-type': types[path.extname(f)] || 'application/octet-stream' }); res.end(body);
  });
  return new Promise(r => srv.listen(port, '127.0.0.1', () => r({ srv, url: 'http://127.0.0.1:' + srv.address().port + '/' })));
}
export async function launch() { return chromium.launch({ executablePath: '/opt/pw-browsers/chromium', args: ['--no-sandbox'] }); }
export async function newPage(browser, { w = 393, h = 852, dark = false, reduced = false, storage = null, stubClip = true, fakeVV = false, insets = null, standalone = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: dark ? 'dark' : 'light', reducedMotion: reduced ? 'reduce' : 'no-preference', locale: 'vi-VN', serviceWorkers: 'block',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
  // real env(safe-area-inset-*) emulation (Chromium CDP): insets = { top, bottom }
  if (insets || standalone) { const cdp = await ctx.newCDPSession(page); ctx.__cdp = cdp; if (insets) await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: insets.top || 0, bottom: insets.bottom || 0, left: 0, right: 0 } }); }
  if (standalone) await page.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { value: true, configurable: true }); });
  const errors = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/Service Worker registration blocked/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  if (storage) await page.addInitScript(s => { try { if (!localStorage.getItem('se.v1')) localStorage.setItem('se.v1', s); } catch (e) {} }, JSON.stringify(storage));
  if (stubClip) await page.addInitScript(() => {
    window.__clip = [];
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: t => { window.__clip.push(t); return Promise.resolve(); }, readText: () => Promise.resolve('') }, configurable: true });
    window.__clicks = 0; document.addEventListener('click', e => { if (e.isTrusted && e.target.id !== 'hap' && !e.target.closest('.hap')) window.__clicks++; }, true);
  });
  if (fakeVV) await page.addInitScript(() => {   // emulate the iOS keyboard: a visualViewport that shrinks, plus a 'resize' event
    const vv = new EventTarget(); vv.width = innerWidth; vv.height = innerHeight; vv.offsetTop = 0; vv.offsetLeft = 0; vv.scale = 1;
    Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });
    window.__setKb = px => { vv.height = innerHeight - px; vv.dispatchEvent(new Event('resize')); };
  });
  return { page, ctx, errors };
}
// minimal PNG decoder (8-bit RGB / RGBA, non-interlaced) for pixel scans of screenshots
import { inflateSync } from 'node:zlib';
export function decodePng(buf) {
  let off = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (off < buf.length) { const len = buf.readUInt32BE(off), type = buf.toString('ascii', off + 4, off + 8); if (type === 'IHDR') { w = buf.readUInt32BE(off + 8); h = buf.readUInt32BE(off + 12); ct = buf[off + 17]; } if (type === 'IDAT') idat.push(buf.subarray(off + 8, off + 8 + len)); off += 12 + len; }
  const bpp = ct === 6 ? 4 : 3, raw = inflateSync(Buffer.concat(idat)), stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)]; for (let x = 0; x < stride; x++) { const a = x >= bpp ? px[y * stride + x - bpp] : 0, up = y ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0; let v = raw[y * (stride + 1) + 1 + x]; v = f === 0 ? v : f === 1 ? v + a : f === 2 ? v + up : f === 3 ? v + ((a + up) >> 1) : v + (() => { const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? up : c; })(); px[y * stride + x] = v & 255; } }
  return { w, h, bpp, at: (x, y) => [px[y * stride + x * bpp], px[y * stride + x * bpp + 1], px[y * stride + x * bpp + 2]] };
}
