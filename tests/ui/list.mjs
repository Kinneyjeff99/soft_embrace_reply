// Home list + search with all 20 products: row count, search hits (accent-insensitive), timing at 4x CPU, content-visibility chunks.
import { serve, launch, newPage } from './lib.mjs';
const R = []; const ok = (n, c, d) => { R.push([n, !!c]); console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
const { srv, url } = await serve(); const b = await launch();
for (const [w, h] of [[393, 852], [430, 932]]) for (const dark of [false, true]) {
  const tag = `${w}x${h} ${dark ? 'dark' : 'light'}`;
  const { page, ctx, errors } = await newPage(b, { w, h, dark }); await page.goto(url); await page.waitForTimeout(400);
  const rows = () => page.evaluate(() => [...document.querySelectorAll('#hbody [data-open^="p:"]')].map(e => e.dataset.open.slice(2)));
  const all = await rows();
  ok(`${tag} home lists all 20 products`, all.length === 20 && new Set(all).size === 20, 'n=' + all.length);
  // 20 products <= the chunk size (20), so grp() renders one plain group; the .chunk rule is still there for bigger catalogues
  const cv = await page.evaluate(() => { const d = document.createElement('div'); d.className = 'chunk'; document.querySelector('#hbody').appendChild(d); const v = getComputedStyle(d).contentVisibility; d.remove(); return [document.querySelectorAll('#hbody .chunk').length, v]; });
  ok(`${tag} 20 rows render as one plain group; .chunk rule keeps content-visibility:auto`, cv[0] === 0 && cv[1] === 'auto', cv.join(' '));
  ok(`${tag} no horizontal overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('#home').scrollWidth <= innerWidth));
  for (const [q, exp] of [['butter', ['butter-top']], ['fleur', ['fleur-slip-dress-blue', 'fleur-slip-dress-yellow']], ['quan', ['embroidery-pants']], ['embroidery', ['embroidery-pants']], ['lace trim', ['lace-trim-blouse-cream', 'lace-trim-blouse-blue']], ['dam', ['fleur-slip-dress-blue', 'fleur-slip-dress-yellow']]]) {
    await page.fill('#q', q); await page.waitForTimeout(250);
    const r = await rows(); const missing = exp.filter(x => !r.includes(x));
    ok(`${tag} search "${q}" finds ${exp.join(', ')}`, missing.length === 0 && r.length <= 12, 'got ' + r.join(','));
  }
  await page.fill('#q', ''); await page.waitForTimeout(250);
  ok(`${tag} clearing search restores 20`, (await rows()).length === 20);
  ok(`${tag} zero console errors`, errors.length === 0, errors.join(';'));
  await ctx.close();
}
{
  const { page, ctx } = await newPage(b, { w: 393, h: 852 }); await page.goto(url); await page.waitForTimeout(500);
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  const t = await page.evaluate(async () => {
    const q = document.querySelector('#q'); const out = {};
    const run = async (txt) => { const t0 = performance.now(); q.value = txt; q.dispatchEvent(new Event('input', { bubbles: true })); const t1 = performance.now(); await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))); return [t1 - t0, performance.now() - t0]; };
    out.warm = await run('l'); out.lace = await run('lace'); out.clear = await run(''); out.fleur = await run('fleur'); out.clear2 = await run('');
    return out;
  });
  const ms = Object.values(t).map(x => x[1]);
  console.log('search 4x CPU (handler / to 2nd frame):', Object.entries(t).map(([k, v]) => k + ' ' + v[0].toFixed(1) + '/' + v[1].toFixed(1)).join('  '));
  ok('search handler <16 ms at 4x CPU with 20 products', Object.values(t).every(x => x[0] < 16), JSON.stringify(Object.values(t).map(x => +x[0].toFixed(1))));
  ok('search to second frame <100 ms at 4x CPU', Math.max(...ms) < 100, 'max ' + Math.max(...ms).toFixed(1));
  const rr = await page.evaluate(async () => { const t0 = performance.now(); const s = JSON.parse(localStorage.getItem('se.v1') || '{}'); location.reload(); return 0; });
  await ctx.close();
}
await b.close(); srv.close();
const f = R.filter(r => !r[1]); console.log(`\n${R.length - f.length}/${R.length} passed`); process.exit(f.length ? 1 : 0);
