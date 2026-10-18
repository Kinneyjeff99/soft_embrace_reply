// Copy-path latency with and without a 4x CPU throttle (Chromium CDP Emulation.setCPUThrottlingRate), real touch taps, iPhone 393x852 @3x.
// For every tap: clip = ms from the click event's timeStamp to navigator.clipboard.writeText being called,
//                paint = ms from the click timeStamp to the 2nd animation frame after it (the "Đã chép" seal is on screen).
//   node tests/uat/perf-throttle.mjs [--runs 6] [--rate 4]   ->  prints a table and writes docs/qa/perf-throttle.json
process.env.NO_SYNTH = '1';
import fs from 'node:fs';
import { serve, launch } from '../ui/lib.mjs';
const args = process.argv.slice(2), flag = (n, d) => { const i = args.indexOf('--' + n); return i > -1 ? +args[i + 1] : d; };
const RUNS = flag('runs', 6), RATE = flag('rate', 4);
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const { srv, url } = await serve(); const B = await launch();
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor((s.length - 1) / 2)] : null; };
const r1 = x => x == null ? null : Math.round(x * 10) / 10;

async function session(rate) {
  const ctx = await B.newContext({ viewport: { width: 393, height: 852 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: 'light', locale: 'vi-VN', serviceWorkers: 'block', userAgent: UA, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage(); const errors = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/Service Worker/.test(m.text())) errors.push(m.text()); });
  page.on('pageerror', e => errors.push(e.message));
  await page.addInitScript(() => {
    window.__cur = null; window.__log = [];
    document.addEventListener('click', e => { if (!e.isTrusted) return; const rec = { t0: e.timeStamp, clip: null, paint: null, what: (e.target.closest('[data-act]') || e.target).getAttribute('data-act') || '' }; window.__cur = rec; window.__log.push(rec); requestAnimationFrame(() => requestAnimationFrame(() => { rec.paint = performance.now() - rec.t0; })); }, true);
    try { const c = navigator.clipboard, w = c.writeText.bind(c); c.writeText = t => { if (window.__cur && window.__cur.clip == null) window.__cur.clip = performance.now() - window.__cur.t0; return w(t); }; } catch (e) { /* ignore */ }
  });
  const cdp = await ctx.newCDPSession(page);
  if (rate > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  const t0 = Date.now();
  await page.goto(url); await page.waitForTimeout(rate > 1 ? 1500 : 700);
  const boot = await page.evaluate(() => { const n = performance.getEntriesByType('navigation')[0] || {}, fcp = (performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint') || {}).startTime; return { scriptBoot: window.__SE.boot, dcl: n.domContentLoadedEventEnd, load: n.loadEventEnd, fcp }; });
  return { ctx, page, cdp, errors, boot, wall: Date.now() - t0 };
}
async function tapAt(page, sel) {
  const loc = page.locator(sel).first(); await loc.waitFor({ state: 'visible' });
  await loc.evaluate(el => { const r = el.getBoundingClientRect(); if (r.top < 100 || r.bottom > innerHeight - 140) el.scrollIntoView({ block: 'center' }); });
  await page.waitForTimeout(150);
  const b = await loc.boundingBox(); await page.touchscreen.tap(b.x + b.width / 2, b.y + b.height / 2);
}
async function measure(S, name, sel, n = RUNS, wait = 450) {
  const out = { name, clip: [], paint: [], n };
  for (let i = 0; i < n; i++) {
    const before = await S.page.evaluate(() => window.__log.length);
    await tapAt(S.page, sel); await S.page.waitForTimeout(wait);
    const rec = await S.page.evaluate(b => window.__log[b] || null, before);
    if (rec) { if (rec.clip != null) out.clip.push(rec.clip); if (rec.paint != null) out.paint.push(rec.paint); }
  }
  return { name, clipMed: r1(med(out.clip)), clipMax: r1(Math.max(...out.clip, 0)) || null, paintMed: r1(med(out.paint)), paintMax: r1(Math.max(...out.paint, 0)), writes: out.clip.length, n };
}
async function once(S, name, sel, wait = 600) { const r = await measure(S, name, sel, 1, wait); return r; }

async function flow(rate) {
  const S = await session(rate), rows = [];
  const P = S.page;
  rows.push(await once(S, 'Home > Chào hỏi (stage switch)', '#home .tile[data-v=greet]'));
  rows.push(await once(S, 'open "Tất cả mẫu" picker', '#stage [data-card=greet] [data-act=stripall]', 900));
  await P.waitForSelector('.sheet .pcell[data-pid="lace-top"]');
  rows.push(await once(S, 'pick a product (cell; empty context: finishes by itself)', '.sheet .pcell[data-pid="lace-top"]', 900));
  await tapAt(P, '#ctxbar .ctxbar'); await P.waitForTimeout(900); await P.waitForSelector('.sheet .pcell[data-pid="lace-skirt-cream"]');
  await tapAt(P, '.sheet .pcell[data-pid="lace-skirt-cream"]'); await P.waitForTimeout(300);
  rows.push(await once(S, 'picker "Xong" (commit context)', '.sheet [data-act=pkdone]', 900));
  rows.push(await measure(S, 'COPY greeting card (2 products)', '#stage [data-card=greet] [data-act=cardcopy]'));
  rows.push(await once(S, 'stage switch > Tư vấn size', '#stseg [data-v=size]'));
  rows.push(await measure(S, 'COPY size charts (2 products, labelled)', '#stage [data-card=sizes] [data-act=cardcopy]'));
  await once(S, 'size M', '#stage [data-card=fit-size] [data-act=fitsize][data-v=M]');
  rows.push(await measure(S, 'COPY Vừa size card', '#stage [data-card=fit-size] [data-act=cardcopy]'));
  rows.push(await once(S, 'stage switch > Tạo đơn', '#stseg [data-v=order]'));
  await P.waitForSelector('#odock'); await tapAt(P, '#stage .lrow2:nth-of-type(2) [data-act=lnsize][data-v=M]').catch(() => {}); await P.waitForTimeout(400);
  rows.push(await measure(S, 'COPY order (dock "Chép đơn")', '#odock [data-act=copyorder]'));
  rows.push(await once(S, 'stage switch > Check out', '#stseg [data-v=out]'));
  rows.push(await measure(S, 'COPY Check-out bubble 1 (IG03)', '#stage [data-card=pay] .mb[data-b="1"] [data-act=cardcopy]'));
  await P.evaluate(() => document.querySelector('#fbar [data-v=pi]').click()); await P.waitForTimeout(600);
  rows.push(await once(S, 'open product sheet (row tap)', '[data-open="p:butter-top"]', 900));
  rows.push(await measure(S, 'COPY product sheet "Chép thông tin"', '.sheet [data-act=pcopy]'));
  await tapAt(P, '.sheet [data-act=shclose]'); await P.waitForTimeout(600);
  await tapAt(P, '#pview [data-v=s]'); await P.waitForTimeout(300);
  rows.push(await once(S, 'open set sheet (suggestion row)', '#hbody [data-act=setsugg][data-a="lace-top"][data-sb="lace-skirt-cream"]', 900));
  await tapAt(P, '.sheet [data-act=setok]').catch(() => {}); await P.waitForTimeout(300);
  rows.push(await measure(S, 'COPY set bubble 1 (info of both + price)', '.sheet .bcard[data-b="a"] [data-act=bcopy]'));
  const r = { rate, boot: S.boot, wall: S.wall, rows, errors: S.errors }; r.boot = S.boot;
  await S.ctx.close(); return r;
}

const t0 = Date.now(), res = [];
for (const rate of [1, RATE]) res.push(await flow(rate));
await B.close(); srv.close();
const pad = (s, n) => String(s).padEnd(n), fmt = x => x == null ? '-' : x;
console.log(pad('action', 44) + ['1x clip', '1x paint', RATE + 'x clip', RATE + 'x paint'].map(s => pad(s, 12)).join(''));
res[0].rows.forEach((r, i) => { const q = res[1].rows[i]; console.log(pad(r.name, 44) + [r.clipMed, r.paintMed, q.clipMed, q.paintMed].map(x => pad(fmt(x) + (x == null ? '' : ' ms'), 12)).join('') + (q.clipMax ? '  (max ' + q.clipMax + '/' + q.paintMax + ')' : '')); });
res.forEach(r => console.log(`rate ${r.rate}x boot:`, JSON.stringify(r.boot), 'errors:', r.errors.length));
fs.writeFileSync('/home/user/soft_embrace_reply/docs/qa/perf-throttle.json', JSON.stringify({ at: new Date().toISOString(), runs: RUNS, rate: RATE, seconds: Math.round((Date.now() - t0) / 1000), res }, null, 1));
