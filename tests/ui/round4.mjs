// Round 4 (ported to the Round 5 DOM): Home, floating bar, header, subtitles, photos, newest-first list, filters, set illustrations, no carousels, perf.
import { serve, launch, newPage } from './lib.mjs';
const R = []; const ok = (n, c, d) => { R.push([n, !!c]); console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
const { srv, url } = await serve(); const b = await launch();
const clicks = p => p.evaluate(() => window.__clicks);
const val = (p, sel) => p.$eval(sel, e => e.value);
const wait = (p, ms = 150) => p.waitForTimeout(ms);
const NEWEST = ['butter-top', 'fleur-slip-dress-blue', 'fleur-slip-dress-yellow', 'embroidery-pants', 'lace-trim-blouse-cream', 'lace-trim-blouse-blue', 'flowy-skirt-taupe', 'flowy-skirt-cream', 'still-cami-top-white', 'still-cami-top-taupe', 'lace-skirt-cream', 'lace-skirt-black', 'lace-top', 'shimmer-top', 'noir-midi-skirt', 'ivory-dot-midi-skirt', 'ivory-dot-blouse', 'noir-dotty-top', 'soft-halter-top-white', 'soft-halter-top-blue'];
async function open(opts) {
  const o = await newPage(b, opts);
  await o.page.addInitScript(() => { window.__cls = 0; try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {} });
  o.bad = []; o.page.on('response', r => { if (r.status() >= 400) o.bad.push(r.status() + ' ' + r.url()); });
  await o.page.goto(url); await wait(o.page, 400); return o;
}
const vis = (p, sel) => p.isVisible(sel);
const swipe = async (page, ctx, x, y, dx, dy) => {   // real touch sequence through CDP: start on the element, move in 12 steps, release
  const cdp = await ctx.newCDPSession(page), pt = (i) => [{ x: x + dx * i / 12, y: y + dy * i / 12, id: 1 }];
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(0) });
  for (let i = 1; i <= 12; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(i) }); await page.waitForTimeout(16); }
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await page.waitForTimeout(400); await cdp.detach();
};
const center = async (page, sel) => { const bb = await (await page.$(sel)).boundingBox(); return [bb.x + bb.width / 2, bb.y + bb.height / 2]; };

for (const [w, h] of [[393, 852], [430, 932]]) for (const dark of [false, true]) {
  const tag = `${w}x${h} ${dark ? 'dark' : 'light'}`;
  const { page, ctx, errors, bad } = await open({ w, h, dark });
  // ---- Home
  ok(`${tag} app opens on Home`, await vis(page, '#home') && !(await vis(page, '#qr')) && !(await vis(page, '#pi')));
  const tiles = await page.$$eval('#home .tile', e => e.map(x => [x.dataset.act, x.dataset.v, x.querySelector('.tt').textContent.trim(), x.querySelector('.td').textContent, Math.round(x.getBoundingClientRect().height), !!x.querySelector('.i')]));
  ok(`${tag} Home: 5 stage tiles + 2 product tiles, each with a › and one short description, no lists`, tiles.length === 7 && tiles.every(t => t[3].length > 4 && t[3].length < 32 && t[5]) && !(await page.$('#home .grp, #home li')) && tiles.map(t => t[2]).join('|') === 'Chào hỏi|Tư vấn size|Xin thông tin|Tạo đơn|Check out|Theo mẫu|Theo set', tiles.map(t => t[2]).join('|'));
  ok(`${tag} Home: tiles are large (>=84pt) and spaced`, tiles.every(t => t[4] >= 84));
  ok(`${tag} Home fits one screen (calm, no scrolling) at >=852pt height`, h < 800 || await page.$eval('#home', e => e.scrollHeight <= e.clientHeight + 1));
  // floating bar
  const bar = await page.evaluate(() => {
    const c = document.querySelector('.capsule'), r = c.getBoundingClientRect(), cs = getComputedStyle(c);
    return { navs: document.querySelectorAll('nav').length, items: document.querySelectorAll('#fbar button').length, caps: document.querySelectorAll('.fb').length, old: ['#dock', '#stages', '#tabs', '#obar'].filter(s => document.querySelector(s)), gapBottom: innerHeight - r.bottom, left: r.left, right: innerWidth - r.right, radius: parseFloat(cs.borderTopLeftRadius), h: r.height, blur: cs.backdropFilter || cs.webkitBackdropFilter, bg: cs.backgroundColor };
  });
  ok(`${tag} ONE floating capsule bar, items <=4, no stacked/docked bars`, bar.navs === 1 && bar.items <= 4 && bar.caps === 3 && bar.old.length === 0, JSON.stringify(bar));
  ok(`${tag} capsule floats (gap below, side margins) with rounded ends, 60pt, translucent and blurred`, bar.gapBottom >= 8 && bar.left >= 12 && bar.right >= 12 && bar.radius >= bar.h / 2 - 1 && Math.abs(bar.h - 60) < 1 && /blur/.test(bar.blur) && /rgba/.test(bar.bg), JSON.stringify({ g: bar.gapBottom, r: bar.radius, h: bar.h }));
  const rb = await page.$eval('#obtn2', e => { const r = e.getBoundingClientRect(); return [r.width, r.height, getComputedStyle(e).borderTopLeftRadius]; });
  ok(`${tag} separate round order button`, rb[0] === rb[1] && parseFloat(rb[2]) >= rb[0] / 2 - 1, rb.join(' '));
  // header
  const hd = await page.evaluate(() => { const l = document.querySelector('#nav .logo'); return { tag: l.tagName, ok: l.complete && l.naturalWidth > 100, h: l.getBoundingClientRect().height, alt: l.alt, filter: getComputedStyle(l).filter, txt: document.querySelector('#nav').textContent.replace(/\s+/g, ' ').trim(), gear: !!document.querySelector('#nav .gear svg'), lang: document.querySelectorAll('#lsw button').length }; });
  ok(`${tag} header: real logo image (28pt tall, loaded), gear icon, VI/EN, no "Tuỳ chỉnh" text`, hd.tag === 'IMG' && hd.ok && Math.abs(hd.h - 28) < 1.5 && hd.alt === 'Soft Embrace' && hd.gear && hd.lang === 2 && !/Tuỳ chỉnh|Soft Embrace/.test(hd.txt) && (dark ? /invert/.test(hd.filter) : hd.filter === 'none'), JSON.stringify(hd));
  const logoBytes = await page.evaluate(async () => (await (await fetch('img/logo.webp')).arrayBuffer()).byteLength);
  ok(`${tag} logo wordmark <= 8 KB`, logoBytes <= 8192, String(logoBytes));
  // subtitles
  const subs = {};
  subs.home = await page.$eval('#hsub', e => [e.textContent, e.getBoundingClientRect().height]);
  // every function in ONE tap from Home
  const dest = {};
  for (const id of ['greet', 'size', 'info', 'order', 'out']) {
    const s0 = await clicks(page); await page.tap(`#home [data-act=stage][data-v=${id}]`); await wait(page);
    dest[id] = [(await clicks(page)) - s0, await vis(page, '#qr'), await page.$eval('.sg[aria-selected=true]', e => e.textContent), 0];
    await page.tap('[data-act=top][data-v=home]'); await wait(page);
  }
  ok(`${tag} Home -> each of the 5 stages in 1 tap`, Object.values(dest).every(d => d[0] === 1 && d[1]) && Object.entries(dest).every(([id, d], i) => d[2] === ['Chào hỏi', 'Tư vấn size', 'Xin thông tin', 'Tạo đơn', 'Check out'][i]), JSON.stringify(Object.values(dest).map(d => d.slice(0, 3))));
  for (const v of ['p', 's']) { const s0 = await clicks(page); await page.tap(`#home [data-act=pgo][data-v=${v}]`); await wait(page); const on = await page.$eval(`#pview [data-v=${v}]`, e => e.getAttribute('aria-selected')); subs['pi' + v] = await page.$eval('#pisub', e => [e.textContent, e.getBoundingClientRect().height]); ok(`${tag} Home -> Theo ${v === 'p' ? 'mẫu' : 'set'} in 1 tap`, (await clicks(page)) - s0 === 1 && await vis(page, '#pi') && on === 'true'); await page.tap('[data-act=top][data-v=home]'); await wait(page); }
  ok(`${tag} contextual subtitle on Home and Sản phẩm: non-empty, one line, different`, Object.values(subs).every(s => s[0].length > 8 && s[1] < 26) && new Set(Object.values(subs).map(s => s[0])).size === Object.keys(subs).length, Object.entries(subs).map(([k, v]) => k + '=' + v[0]).join(' | '));
  ok(`${tag} Trả lời nhanh drops the description line (v6): no #qrsub`, !(await page.$('#qrsub')));
  // gear
  await page.tap('#nav [data-act=settings]'); await wait(page, 450);
  ok(`${tag} gear opens settings`, await vis(page, '.sheet') && /Tuỳ chỉnh/.test(await page.textContent('.sheet .sbar')));
  await page.tap('.sheet [data-act=shclose]'); await wait(page, 450);
  // bar navigation
  for (const [v, sec] of [['qr', '#qr'], ['pi', '#pi'], ['home', '#home']]) { await page.tap(`#fbar [data-v=${v}]`); await wait(page, 100); if (!(await vis(page, sec))) ok(`${tag} bar -> ${v}`, false); }
  ok(`${tag} bar switches Home / Trả lời nhanh / Sản phẩm`, true);
  // ---- product list
  await page.tap('#fbar [data-v=pi]'); await wait(page, 300); await page.tap('[data-act=pview][data-v=p]'); await wait(page, 200);
  const ids = await page.$$eval('#hbody [data-open^="p:"]', e => e.map(x => x.dataset.open.slice(2)));
  ok(`${tag} Theo mẫu: 20 rows, newest first`, JSON.stringify(ids) === JSON.stringify(NEWEST), ids.join(','));
  const heads = await page.$$eval('#hbody .cap', e => e.map(x => x.textContent));
  ok(`${tag} collection section headers: Summer 26 · 10, Spring 26 · 4, Fall 25 · 6`, heads.join('|') === 'Summer 26 · 10|Spring 26 · 4|Fall 25 · 6', heads.join('|'));
  const chips = await page.$$eval('#pfilt button', e => e.map(x => x.textContent.replace(/\s+/g, ' ').trim()));
  ok(`${tag} ONE segmented filter (counts at >=414pt)`, chips.join('|') === (w >= 414 ? 'Tất cả20|Áo11|Váy6|Đầm2|Quần1' : 'Tất cả20|Áo11|Váy6|Đầm2|Quần1') && (await page.$$('#pfilt .seg')).length === 1 && (await page.$eval('#pfilt .n', e => getComputedStyle(e).display !== 'none')) === (w >= 414), chips.join('|'));
  const fd = await page.$eval('#pfilt', e => [e.getBoundingClientRect().height, e.scrollWidth, e.clientWidth]);
  ok(`${tag} filter chips on one row (no wrap, no scroll)`, fd[0] < 60 && fd[1] <= fd[2], fd.join('/'));
  const tags = await page.$$eval('#hbody .prow', e => e.map(x => [x.dataset.open.slice(2), x.querySelector('.sub').textContent.split('· ').pop().trim()]));
  const exp = { top: 'Áo', skirt: 'Váy', dress: 'Đầm', pants: 'Quần' }, cat = await page.evaluate(() => Object.fromEntries(window.__SE.PS.map(p => [p.id, p.category])));
  ok(`${tag} each row's grey line ends with its category (Áo/Váy/Đầm/Quần)`, tags.length === 20 && tags.every(([id, t]) => t === exp[cat[id]]) && new Set(tags.map(t => t[1])).size === 4);
  for (const [c, n, label] of [['dress', 2, 'Đầm'], ['pants', 1, 'Quần'], ['skirt', 6, 'Váy'], ['top', 11, 'Áo']]) {
    await page.tap(`#pfilt [data-v=${c}]`); await wait(page, 120);
    const rows = await page.$$eval('#hbody .prow', e => e.map(x => x.querySelector('.sub').textContent.split('· ').pop().trim()));
    ok(`${tag} filter ${label}: ${n} rows, all ${label}`, rows.length === n && rows.every(x => x === label));
  }
  await page.tap('#pfilt [data-v=dress]'); await page.fill('#q', 'fleur'); await wait(page, 250);
  ok(`${tag} search respects the filter`, (await page.$$('#hbody .prow')).length === 2); await page.fill('#q', ''); await wait(page, 200);
  await page.tap('#pfilt [data-v=all]'); await wait(page, 120);
  // row design: avatar 56, bold name, grey subtitle (price · colour), trailing control
  const row = await page.$eval('#hbody .prow', e => { const a = e.querySelector('.av').getBoundingClientRect(), t = e.querySelector('.t'), s = e.querySelector('.sub'); return { a: [a.width, a.height], r: getComputedStyle(e.querySelector('.av')).borderTopLeftRadius, fw: getComputedStyle(t).fontWeight, sub: s.textContent, subc: getComputedStyle(s).color, chev: !!e.querySelector('svg'), img: !!e.querySelector('img') }; });
  ok(`${tag} row = round 56pt photo, bold name, grey "price · colour" line, trailing ›`, row.a[0] === 56 && row.a[1] === 56 && (row.r === '50%' || parseFloat(row.r) >= 28) && +row.fw >= 600 && /\d\.\d{3}đ[\s\u00a0]+·[\s\u00a0]+\S/.test(row.sub) && row.chev && row.img, JSON.stringify(row));
  ok(`${tag} no emoji discs remain in lists`, !(await page.$('#hbody .disc')) && !(await page.$('.disc')));
  // images: dimensions, laziness, all 20 load without 404
  const imgInfo = await page.$$eval('#hbody .prow img', e => e.map(i => [i.getAttribute('width'), i.getAttribute('height'), i.loading, i.decoding, i.getAttribute('src')]));
  ok(`${tag} images have explicit width/height, loading=lazy, decoding=async, local thumbnails`, imgInfo.length === 20 && imgInfo.every(i => i[0] === '56' && i[1] === '56' && i[2] === 'lazy' && i[3] === 'async' && /^img\/.+-168\.webp$/.test(i[4])));
  await page.evaluate(async () => { const sc = document.querySelector('#pi'); for (let y = 0; y <= sc.scrollHeight; y += 300) { sc.scrollTop = y; await new Promise(r => setTimeout(r, 60)); } sc.scrollTop = 0; });
  await wait(page, 600);
  const loaded = await page.$$eval('#hbody .prow img', e => e.filter(i => i.complete && i.naturalWidth === 168).length);
  const all320 = await page.evaluate(async () => { const out = []; for (const p of window.__SE.PS) for (const u of [p.img + '-168', p.img + '-320']) { const r = await fetch('img/' + u + '.webp'); out.push(r.status); } return out; });
  ok(`${tag} all 20 photos load while scrolling (complete, 168px) and every 168/320 file answers 200 (no 404)`, loaded === 20 && all320.length === 40 && all320.every(x => x === 200) && !bad.some(x => /^404/.test(x)), `loaded=${loaded} bad=${bad.join(',')}`);
  const cls = await page.evaluate(() => window.__cls);
  ok(`${tag} layout shift while images load ~ 0`, cls < 0.01, 'CLS ' + cls.toFixed(4));
  ok(`${tag} placeholder colour behind photos (content tint)`, await page.$eval('#hbody .prow .av', e => /rgb\(/.test(getComputedStyle(e).backgroundColor)));
  ok(`${tag} photos are not inlined in index.html`, !(await page.evaluate(async () => /data:image\/webp|data:image\/jpeg/.test(await (await fetch('index.html')).text()))));
  // ---- sets: two photos side by side, names, combined price
  await page.tap('[data-act=pview][data-v=s]'); await wait(page, 300);
  const sets = await page.$$eval('#hbody .setrow', e => e.map(r => [r.querySelectorAll('.av img').length, r.querySelectorAll('.t').length, /\d\.\d{3}đ/.test(r.querySelector('.sub').textContent), r.querySelector('.pair').getBoundingClientRect().width]));
  ok(`${tag} Theo set: every suggested row shows TWO photos, two names and the combined price`, sets.length === 9 && sets.every(s => s[0] === 2 && s[1] === 2 && s[2] && s[3] > 80), JSON.stringify(sets[0]));
  await page.tap('#hbody [data-act=setsugg] >> nth=0'); await wait(page, 600);
  const pic = await page.$$eval('.sheet .setpic .av img', e => e.map(i => [i.getAttribute('src'), i.getAttribute('width')]));
  ok(`${tag} set sheet illustrates the pair with two 320 photos, names and prices`, pic.length === 2 && pic.every(i => /-320\.webp$/.test(i[0])) && (await page.$$('.sheet .setpic .n1')).length === 2 && (await page.$$('.sheet .setpic .n2')).length === 2);
  await page.tap('.sheet [data-act=shclose]'); await wait(page, 450);
  await page.tap('[data-act=pview][data-v=p]'); await wait(page, 200);
  await page.tap('#hbody [data-open="p:lace-top"]'); await wait(page, 500);
  ok(`${tag} product sheet header uses the larger photo`, await page.$eval('.sheet .shh .av img', i => /lace-top-320\.webp$/.test(i.getAttribute('src')) && i.complete && i.naturalWidth === 320));
  await page.tap('[data-act=addline][data-v=M]'); await page.tap('.sheet [data-act=shclose]'); await wait(page, 450);
  await page.tap('#obtn2'); await wait(page, 300);
  ok(`${tag} order lines show the product photo`, await page.$eval('#stage .lrow2 .av img', i => /lace-top-168\.webp$/.test(i.getAttribute('src'))));
  // ---- no carousels, no horizontal overflow, no scroll-fighting
  for (const [sec, nm] of [['home', 'Home'], ['qr', 'Quick replies'], ['pi', 'Products']]) {
    await page.tap(`#fbar [data-v=${sec}]`); await wait(page, 150);
    const hs = await page.evaluate(() => [...document.querySelectorAll('body *')].filter(e => e.offsetParent && !/^(TEXTAREA|INPUT)$/.test(e.tagName)).filter(e => /(auto|scroll)/.test(getComputedStyle(e).overflowX) && e.scrollWidth > e.clientWidth + 1).map(e => e.className || e.tagName));
    ok(`${tag} ${nm}: no horizontally scrolling element, no page overflow`, hs.length === 0 && await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), hs.join('|'));
  }
  await page.tap('#fbar [data-v=pi]'); await wait(page, 200); await page.$eval('#pi', e => { e.scrollTop = 0; }); await wait(page, 100);
  const [cx, cy] = await center(page, '#pfilt button:nth-child(2)');
  const t0 = await page.$eval('#pi', e => e.scrollTop);
  await swipe(page, ctx, cx, cy, 0, -320);
  const t1 = await page.$eval('#pi', e => e.scrollTop);
  ok(`${tag} vertical swipe starting on a chip scrolls the page`, t1 > t0 + 100, t0 + '->' + t1);
  await page.$eval('#pi', e => { e.scrollTop = 0; });
  const [hx, hy] = await center(page, '#pfilt button:nth-child(2)');
  await swipe(page, ctx, hx, hy, -140, 0);
  const t2 = await page.evaluate(() => [document.querySelector('#pi').scrollTop, document.querySelector('#pi').scrollLeft, document.querySelector('#pfilt').scrollLeft, scrollX, scrollY]);
  ok(`${tag} horizontal swipe on the chip row moves nothing (no vertical drift, no sideways scroll)`, t2.every(v => v === 0), t2.join(','));
  await page.tap('#fbar [data-v=qr]'); await wait(page, 150);
  await page.tap('#stseg [data-v=greet]'); await wait(page, 150);
  const strip = await page.$$eval('#stage [data-card=greet] .pstrip .sc', e => e.map(x => [x.querySelector('.av') ? x.querySelector('.av').getBoundingClientRect().width : 0, Math.round(x.getBoundingClientRect().right)]));
  ok(`${tag} greeting strip: 4 product photos (56pt circles) + "Tất cả mẫu", inside the card`, strip.length === 5 && strip.slice(0, 4).every(r => r[0] === 56 && r[1] <= w) && /Tất cả mẫu/.test(await page.textContent('#stage [data-card=greet] .sc.all')));
  await page.tap('#stage [data-card=greet] [data-act=stripall]'); await wait(page, 500);
  ok(`${tag} "Tất cả mẫu" opens the picker: ONE segmented filter, photo grid, no horizontal scrolling`, await vis(page, '.sheet #pkf') && (await page.$$('.sheet #pkbody .pcell .av img')).length >= 20 && (await page.$$eval('.sheet #pkf button', e => e.map(x => x.textContent.replace(/\d+/g, '').trim()))).join('|') === 'Tất cả|Áo|Váy|Đầm|Quần');
  await page.tap('.sheet #pkf [data-v=skirt]'); await wait(page, 150);
  ok(`${tag} picker filter (Váy)`, (await page.$$('.sheet #pkbody .pcell:not(.ppair)')).length === 6);
  await page.tap('.sheet #pkbody .pcell:not(.ppair) >> nth=0'); await wait(page, 150); await page.tap('.sheet [data-act=pkdone]'); await wait(page, 600);
  ok(`${tag} picking a product fills the context bar`, /Skirt|Váy/i.test(await page.textContent('#ctxbar .dv')));
  await page.tap('#stage [data-card=greet] .pv'); await wait(page, 500);
  ok(`${tag} the preview opens the Sửa tin sheet`, await vis(page, '.sheet .ebox'));
  await page.tap('.sheet [data-act=ebedit]'); await page.evaluate(() => document.activeElement.blur());
  // a vertical swipe starting on the dropdown row scrolls the sheet body
  await page.$eval('.sheet .shb', e => { e.scrollTop = 0; }); await wait(page, 100);
  const [lx, ly] = await center(page, '.sheet .ddrow');
  const sb0 = await page.$eval('.sheet .shb', e => e.scrollTop);
  await swipe(page, ctx, lx, ly, 0, -260);
  const sb1 = await page.$eval('.sheet .shb', e => e.scrollTop);
  const sbMax = await page.$eval('.sheet .shb', e => e.scrollHeight - e.clientHeight);
  ok(`${tag} vertical swipe starting on a dropdown row scrolls the sheet`, sb1 > sb0 + Math.min(60, sbMax - 4), sb0 + '->' + sb1 + ' max ' + sbMax);
  ok(`${tag} zero console errors, no failed requests`, errors.length === 0 && bad.length === 0, errors.concat(bad).join(';'));
  await ctx.close();
}

// ---- tap counts, honestly from Home (393), empty context (design-v6 section 10: +1 for the Home tile)
{
  const { page, ctx } = await open({ w: 393, h: 852 });
  const T = async fn => { const s = await clicks(page); await fn(); return (await clicks(page)) - s; };
  let n = await T(async () => { await page.tap('#home [data-act=stage][data-v=greet]'); await wait(page); await page.tap('#stage [data-card=greet] .sc[data-pid] >> nth=0'); await wait(page); await page.tap('#stage [data-card=greet] [data-act=cardcopy]'); await wait(page); });
  ok('tap count: greeting + product info from Home, empty context = 3 (tile, strip photo, Chép); 2 once in Chào hỏi', n === 3, String(n));
  await page.tap('[data-act=newcust]'); await wait(page, 300);
  await page.tap('#fbar [data-v=home]'); await wait(page);
  n = await T(async () => { await page.tap('#home [data-act=pgo][data-v=p]'); await wait(page); await page.tap('#hbody [data-open^="p:"] >> nth=0'); await wait(page, 450); await page.tap('.shf [data-act=pcopy]'); await wait(page); });
  ok('tap count: Theo mẫu info = 2 from the list (row, Chép), 3 from Home', n === 3, String(n));
  await page.tap('.sheet [data-act=shclose]'); await wait(page, 450); await page.tap('#fbar [data-v=home]'); await wait(page);
  await page.tap('[data-act=newcust]').catch(() => {});
  await page.tap('#fbar [data-v=home]'); await wait(page);
  n = await T(async () => { await page.tap('#home [data-act=stage][data-v=size]'); await wait(page); await page.tap('#stage [data-card=sizes] .sc[data-pid] >> nth=0'); await wait(page); await page.tap('#stage [data-card=sizes] [data-act=cardcopy]'); await wait(page); });
  ok('tap count: size chart from Home, empty context = 3 (tile, strip photo, Chép)', n === 3, String(n));
  await ctx.close();
  const o = await open({ w: 393, h: 852 });
  const T2 = async fn => { const s = await clicks(o.page); await fn(); return (await clicks(o.page)) - s; };
  n = await T2(async () => { await o.page.tap('#home [data-act=stage][data-v=order]'); await wait(o.page); await o.page.tap('#stage .sc[data-pid] >> nth=0'); await wait(o.page); await o.page.tap('#stage [data-act=lnsize][data-v=M]'); await wait(o.page); await o.page.tap('#obtn'); await wait(o.page); });
  ok('tap count: order from Home, empty order, 1 product = 4 (tile, strip photo, size, Chép đơn)', n === 4 && /^Dạ vậy đơn của bạn 🌷\n• /.test((await o.page.evaluate(() => window.__clip.slice(-1)[0]))), String(n));
  ok('order dock floats above the capsule (total + Chép đơn visible, not covered)', await o.page.evaluate(() => { const f = document.querySelector('#odock').getBoundingClientRect(), c = document.querySelector('.capsule').getBoundingClientRect(); return f.bottom <= c.top + 1 && f.height > 40; }));
  await o.ctx.close();
}
// ---- perf at 4x CPU
{
  const { page, ctx } = await open({ w: 393, h: 852 });
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.tap('#home [data-act=pgo][data-v=p]'); await wait(page, 500);
  await page.evaluate(() => { window.__fr = []; let last = performance.now(); const f = t => { window.__fr.push(t - last); last = t; if (window.__run) requestAnimationFrame(f); }; window.__run = 1; requestAnimationFrame(f); });
  const [x, y] = await center(page, '#hbody .prow'); const y0 = Math.min(y + 300, 800);
  const gest = async d => {   // real touch drag through CDP (synthesizeScrollGesture is not reliable in this headless build)
    const N = 40, pt = i => [{ x, y: y0 + d * i / N, id: 1 }];
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(0) });
    for (let i = 1; i <= N; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: pt(i) }); await page.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await gest(-700); await wait(page, 300); const reached = await page.$eval('#pi', e => e.scrollTop); await gest(700); await wait(page, 300);
  const fr = await page.evaluate(() => { window.__run = 0; return window.__fr.slice(2); });
  const dropped = fr.filter(d => d > 33.5).length, long = fr.filter(d => d > 50).length, sorted = fr.slice().sort((a, b) => a - b);
  console.log(`list scroll 4x CPU: ${fr.length} frames, >33ms: ${dropped}, >50ms: ${long}, p95 ${sorted[Math.floor(fr.length * .95)].toFixed(1)} ms, max ${Math.max(...fr).toFixed(1)} ms`);
  ok('list scroll at 4x CPU with photos: <=5% of frames >33 ms and none >100 ms ('+reached+')', reached > 400 && fr.length > 20 && dropped / fr.length <= 0.05 && Math.max(...fr) < 100, `${fr.length} frames, ${dropped} dropped, max ${Math.max(...fr).toFixed(1)}`);
  await page.tap('#hbody [data-open^="p:"] >> nth=0'); await wait(page, 800);
  const m = await page.evaluate(async () => { const out = [], btn = document.querySelector('.shf [data-act=pcopy]'); for (let i = 0; i < 12; i++) { const t0 = performance.now(); btn.click(); out.push(performance.now() - t0); await new Promise(r => setTimeout(r, 200)); } return out; });
  const ms = m.slice().sort((a, b) => a - b);
  console.log('copy handler 4x CPU median', ms[6].toFixed(1), 'max', ms[11].toFixed(1));
  ok('copy handler median <16ms at 4x CPU (with photos, Round 4)', ms[6] < 16, ms[6].toFixed(1));
  await ctx.close();
}
// ---- service worker precaches photos, offline start shows photos
{
  const ctx = await b.newContext({ viewport: { width: 393, height: 852 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage(); const errs = []; page.on('console', m => ['error', 'warning'].includes(m.type()) && errs.push(m.text()));
  await page.goto(url); await page.waitForTimeout(1500); await page.reload(); await page.waitForTimeout(500);
  const cached = await page.evaluate(async () => { const ks = await caches.keys(); const c = await caches.open(ks[0]); const reqs = await c.keys(); return reqs.map(r => new URL(r.url).pathname); });
  ok('service worker precaches 20 x 168, 20 x 320 and the logo', cached.filter(u => /-168\.webp$/.test(u)).length === 20 && cached.filter(u => /-320\.webp$/.test(u)).length === 20 && cached.some(u => /logo\.webp$/.test(u)), String(cached.length));
  await ctx.setOffline(true); await page.reload(); await page.waitForTimeout(600);
  await page.tap('#fbar [data-v=pi]'); await page.waitForTimeout(500);
  const ofl = await page.$$eval('#hbody .prow img', e => e.filter(i => i.complete && i.naturalWidth > 0).length);
  ok('offline: app opens and the product photos still show', ofl >= 5 && errs.length === 0, 'visible loaded ' + ofl + ' ' + errs.join(';'));
  await ctx.close();
}
await b.close(); srv.close();
const f = R.filter(r => !r[1]); console.log(`\n${R.length - f.length}/${R.length} passed`); process.exit(f.length ? 1 : 0);
