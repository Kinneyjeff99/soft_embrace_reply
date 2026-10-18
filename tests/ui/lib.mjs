import { createRequire } from 'node:module';
const require = createRequire('/opt/node-tools/node_modules/');
export const { chromium, devices } = require('playwright');
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
export const DIST = '/home/user/soft_embrace_reply/dist';
export function serve(port = 0) {
  const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
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
export async function newPage(browser, { w = 393, h = 852, dark = false, reduced = false, storage = null, stubClip = true, fakeVV = false } = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: dark ? 'dark' : 'light', reducedMotion: reduced ? 'reduce' : 'no-preference', locale: 'vi-VN', serviceWorkers: 'block',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1' });
  const page = await ctx.newPage();
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
