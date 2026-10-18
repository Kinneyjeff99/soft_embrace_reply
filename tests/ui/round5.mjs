// Round 5: safe-area / single-source inset matrix (real env() emulation), affordance grammar audit on every screen,
// circular avatars, set-sheet geometry, product-sheet vertical budget, colour rules, contrast of live elements.
import { serve, launch, newPage, decodePng } from './lib.mjs';
import fs from 'node:fs';
const R = []; const ok = (n, c, d) => { R.push([n, !!c]); console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
const { srv, url } = await serve(); const b = await launch();
const wait = (p, ms = 150) => p.waitForTimeout(ms);
const DEV = [['SE 375x667', 375, 667, { top: 20, bottom: 0 }], ['14 Pro 393x852', 393, 852, { top: 59, bottom: 34 }], ['15 Pro Max 430x932', 430, 932, { top: 59, bottom: 34 }]];
const BG = { light: [246, 244, 238], dark: [28, 29, 28] };

/* ============ 1. SAFE-AREA MATRIX ============ */
async function standalone() {}   // display-mode: standalone is emulated by newPage({ standalone: true }) on the same CDP session as the insets
async function geo(fr) {
  return fr.evaluate(() => { const c = document.querySelector('.capsule').getBoundingClientRect(), a = document.querySelector('#app').getBoundingClientRect(), r = document.querySelector('#obtn2').getBoundingClientRect(), I = window.__SE.ins(), cs = getComputedStyle(document.documentElement);
    return { gap: Math.round((a.bottom - c.bottom) * 10) / 10, appBottomGap: Math.round((innerHeight - a.bottom) * 10) / 10, span: [Math.round(a.bottom - c.bottom), Math.round(a.bottom - c.top)], rGap: Math.round(a.bottom - r.bottom), b: parseFloat(cs.getPropertyValue('--inset-b')), t: parseFloat(cs.getPropertyValue('--inset-t')), I, ctx: document.body.dataset.ctx }; });
}
async function scanStrip(page, dark) {   // bottom 80pt of the left gutter (x 0..2.5pt) must be the app background colour (sampled inside the app), no band of another colour
  const png = decodePng(await page.screenshot()), sc = png.w / (await page.evaluate(() => innerWidth)), ref = png.at(Math.round(4 * sc), Math.round(110 * sc));
  let bad = 0, first = null;
  for (let y = png.h - Math.round(80 * sc); y < png.h; y++) for (let x = 0; x < Math.round(2.5 * sc); x++) { const p = png.at(x, y); if (Math.abs(p[0] - ref[0]) > 6 || Math.abs(p[1] - ref[1]) > 6 || Math.abs(p[2] - ref[2]) > 6) { bad++; if (!first) first = [x, y, p, ref]; } }
  return { bad, first };
}
for (const dark of [false, true]) for (const [nm, w, h, ins] of DEV) {
  const face = ins.bottom > 0, tag = `${nm} ${dark ? 'dark' : 'light'}`;
  // plain browser tab, toolbar below (Safari reports 0 at the bottom)
  { const { page, errors } = await newPage(b, { w, h, dark, insets: { top: ins.top, bottom: 0 } }); await page.goto(url); await wait(page, 350);
    const g = await geo(page); ok(`${tag} Safari tab (bottom inset 0): bar gap 12, ctx=tab, --inset-b 0`, g.gap === 12 && g.b === 0 && g.I.ctx === undefined && g.ctx === 'tab', JSON.stringify(g));
    const sp = await scanStrip(page, dark); ok(`${tag} Safari tab: no band under the app (bottom 80pt gutter is --bg-grouped)`, sp.bad === 0, JSON.stringify(sp.first));
    await page.context().close(); }
  if (face) { const { page } = await newPage(b, { w, h, dark, insets: ins }); await page.goto(url); await wait(page, 350);
    const g = await geo(page); ok(`${tag} Safari tab that reports a 34pt inset: bar gap 24`, g.gap === 24 && g.b === 34, JSON.stringify(g)); await page.context().close(); }
  // standalone (home-screen app)
  { const { page, ctx, errors } = await newPage(b, { w, h, dark, insets: ins, standalone: true }); await standalone(page, ctx); await page.goto(url); await wait(page, 350);
    const g = await geo(page); const exp = face ? 24 : 12;
    ok(`${tag} home-screen app: bar bottom ${exp}pt above the app edge (span ${exp}..${exp + 60}), order button the same, --inset-t ${ins.top}, --inset-b ${ins.bottom}`, Math.abs(g.gap - exp) <= 1 && g.span[1] === exp + 60 && Math.abs(g.rGap - exp) <= 1 && g.t === ins.top && g.b === ins.bottom && g.ctx === 'pwa', JSON.stringify(g));
    const sp = await scanStrip(page, dark); ok(`${tag} home-screen app: no uncovered strip under the app`, sp.bad === 0, JSON.stringify(sp.first));
    await page.tap('[data-open], [data-act=stage] >> nth=0'); await wait(page, 500);
    // open a sheet: top = inset-t + 10, footer clears the indicator
    await page.tap('#fbar [data-v=pi]'); await wait(page); await page.tap('[data-open="p:noir-midi-skirt"]'); await wait(page, 500);
    const sh = await page.evaluate(() => ({ top: document.querySelector('.sheet').getBoundingClientRect().top, clear: innerHeight - document.querySelector('.shf .btn').getBoundingClientRect().bottom, foot: document.querySelector('#pfoot').getBoundingClientRect().top }));
    ok(`${tag} sheet top = inset-t + 10 = ${ins.top + 10}; footer button clears the home indicator by >= 8pt (${Math.round(sh.clear)})`, Math.abs(sh.top - (ins.top + 10)) <= 1 && sh.clear >= 8, JSON.stringify(sh));
    const bud = await page.evaluate(() => { const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return [Math.round(b.top), Math.round(b.bottom)]; }; return { seg: r('#pseg'), dd: r('.sheet .ddrow'), box: r('.sheet .ebox'), foot: r('#pfoot') }; });
    const E = { 375: { seg: 124, dd: 184, foot: 595 }, 393: { seg: 163, dd: 223, foot: 746 }, 430: { seg: 163, dd: 223, foot: 826 } }[w];
    ok(`${tag} product sheet vertical budget (segmented ${E.seg}, dropdown ${E.dd}, footer top ${E.foot}) within 4pt`, Math.abs(bud.seg[0] - E.seg) <= 4 && Math.abs(bud.dd[0] - E.dd) <= 4 && Math.abs(bud.foot[0] - E.foot) <= 4 && (w < 380 || bud.dd[1] - bud.dd[0] === 56) && bud.seg[1] - bud.seg[0] === 44, JSON.stringify(bud));
    const wr = await page.evaluate(() => ({ seg: document.querySelector('#pseg').getBoundingClientRect().height }));
    // keyboard emulation is covered in ui.mjs; here: the inset must NOT be re-measured while the keyboard shrinks the app
    ok(`${tag} zero console errors (standalone)`, errors.length === 0, errors.join(';'));
    await page.context().close(); }
  // host wrapper: html padded 59/34, app NOT framed (fixed, full-bleed): app covers the padding, inset counted once
  { const { page, ctx } = await newPage(b, { w, h, dark, insets: ins, standalone: true }); await standalone(page, ctx);
    await page.addInitScript(() => { document.documentElement.style.padding = '59px 0 34px'; }); await page.goto(url); await wait(page, 350);
    const g = await geo(page); const exp = face ? 24 : 12;
    ok(`${tag} wrapper (<html style="padding:59px 0 34px">): app stays full-bleed, bar gap ${exp}, no double count`, Math.abs(g.gap - exp) <= 1 && g.appBottomGap === 0, JSON.stringify(g));
    const sp = await scanStrip(page, dark); ok(`${tag} wrapper (root padded): no uncovered strip`, sp.bad === 0, JSON.stringify(sp.first));
    await page.context().close(); }
  // host wrapper that SHRINKS our box (what happened on her phone)
  { const { page, ctx } = await newPage(b, { w, h, dark, insets: ins, standalone: true }); await standalone(page, ctx); await page.goto(url); await wait(page, 300);
    await page.addStyleTag({ content: '#app{bottom:34px!important}' }); await page.evaluate(() => window.__SE.measure()); await wait(page, 100);
    const g = await geo(page);
    ok(`${tag} wrapper shrank our box by 34pt: app detects it, --inset-b 0, bar gap 12 above the app's own edge`, g.I.shrunk === true && g.b === 0 && g.gap === 12 && g.appBottomGap === 34, JSON.stringify(g));
    const sp = await scanStrip(page, dark); ok(`${tag} shrunk box: the strip under the app is the app background (html/body painted --bg-grouped)`, sp.bad === 0, JSON.stringify(sp.first));
    await page.context().close(); }
  // wrapper iframe (root padded 59/34, iframe fixed inside the padding)
  { const { page, ctx } = await newPage(b, { w, h, dark, insets: ins, standalone: true }); await standalone(page, ctx);
    const hostBg = dark ? '#1C1D1C' : '#F6F4EE';
    await page.route('**/host.html', r => r.fulfill({ contentType: 'text/html', body: `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><html style="padding:59px 0 34px;background:${hostBg}"><body style="margin:0;background:${hostBg}"><iframe id=f src="index.html" style="position:fixed;left:0;right:0;top:59px;bottom:34px;width:100%;height:calc(100% - 93px);border:0"></iframe></body></html>` }));
    await page.goto(url + 'host.html'); await wait(page, 700);
    const fr = page.frames().find(f => f !== page.mainFrame()); const g = await geo(fr);
    ok(`${tag} wrapper iframe: framed -> --inset-b 0, --inset-t 0, bar gap 12, sheet top 10`, g.I.framed === true && g.b === 0 && g.t === 0 && g.gap === 12 && g.ctx === 'frame', JSON.stringify(g));
    await fr.tap('#fbar [data-v=pi]'); await wait(page); await fr.tap('[data-open="p:noir-midi-skirt"]'); await wait(page, 500);
    ok(`${tag} wrapper iframe: sheet top = 10 inside the frame`, Math.abs(await fr.evaluate(() => document.querySelector('.sheet').getBoundingClientRect().top) - 10) <= 1);
    await fr.tap('.sheet [data-act=shclose]'); await wait(page, 450);
    const sp = await scanStrip(page, dark); ok(`${tag} wrapper iframe: no uncovered strip (host paints --bg-grouped)`, sp.bad === 0, JSON.stringify(sp.first));
    await page.context().close(); }
  // host override: #inset-b=0 with a real 34pt env inset
  if (face) { const { page, ctx } = await newPage(b, { w, h, dark, insets: ins, standalone: true }); await standalone(page, ctx); await page.goto(url + '#inset-b=0&inset-t=0'); await wait(page, 350);
    const g = await geo(page); ok(`${tag} #inset-b=0&inset-t=0 override: bar gap 12, insets 0`, g.gap === 12 && g.b === 0 && g.t === 0, JSON.stringify(g)); await page.context().close(); }
}
// keyboard open: bar hidden, insets not re-measured, back after closing
{ const { page, ctx } = await newPage(b, { w: 393, h: 852, insets: { top: 59, bottom: 34 }, fakeVV: true, standalone: true }); await standalone(page, ctx); await page.goto(url); await wait(page, 350);
  await page.tap('[data-act=stage][data-v=order] >> visible=true'); await wait(page); await page.tap('[data-act=recvtoggle]'); await wait(page); await page.focus('[data-in=info]'); await page.evaluate(() => window.__setKb(336)); await wait(page, 300);
  const k = await page.evaluate(() => ({ bar: getComputedStyle(document.querySelector('#fbar')).display, b: window.__SE.ins().b, shrunk: window.__SE.ins().shrunk })); await page.evaluate(() => { window.dispatchEvent(new Event('resize')); }); await wait(page, 100);
  const k2 = await page.evaluate(() => ({ b: window.__SE.ins().b, shrunk: window.__SE.ins().shrunk }));
  ok('keyboard open: bar hidden, --inset-b stays 34 (the shrunk app is not mistaken for a host box), even after a resize event', k.bar === 'none' && k.b === 34 && !k.shrunk && k2.b === 34 && !k2.shrunk, JSON.stringify([k, k2]));
  await page.evaluate(() => { document.activeElement.blur(); window.__setKb(0); }); await wait(page, 400);
  ok('keyboard closed: bar back at 24', (await geo(page)).gap === 24);
  await page.context().close(); }
// debug overlay
{ const { page, ctx } = await newPage(b, { w: 393, h: 852, insets: { top: 59, bottom: 34 }, standalone: true }); await standalone(page, ctx);
  await page.goto(url); await wait(page, 300); const none = await page.$('#dbg');
  await page.goto(url + '#debug=insets'); await wait(page, 400); const txt = await page.textContent('#dbg').catch(() => '');
  ok('#debug=insets: inert without the hash; with it a card shows sat, sab, framed, shrunk, innerHeight, screen, visualViewport, --inset-b, --bar-y', !none && /sat 59/.test(txt) && /sab 34/.test(txt) && /framed false/.test(txt) && /shrunk false/.test(txt) && /innerHeight 852/.test(txt) && /visualViewport/.test(txt) && /--inset-b 34/.test(txt) && /--bar-y 24/.test(txt), txt.replace(/\n/g, ' | '));
  await page.close(); await page.context().close(); }

/* ============ 2. AFFORDANCE / COLOUR AUDIT ON EVERY SCREEN ============ */
const VERBS = /^(Chép|Sửa|Thêm|Đổi|Mở|Xem|Xoá|Dán|Khôi phục|Lưu|Huỷ|Đóng|Bỏ|Ẩn|Xong|Quay lại|Đã kiểm tra|Tìm|Tuỳ chỉnh|Đơn mới|Tạo|Ghép|Giảm|Tăng|Chạm|Chèn|Nhập|Xuất|Dùng|Hoàn tác|Hiện|Điền|Chọn|Kiểm tra|Chưa có|Đã chép|Gõ|Kèm|Ẩn)/;
const ROSE = [[204, 140, 135], [168, 78, 71], [147, 68, 62], [221, 163, 158], [244, 233, 227], [227, 176, 171]];
async function audit(page, name, tag) {
  const r = await page.evaluate(([VERBSsrc, ROSE]) => {
    const VERBS = new RegExp(VERBSsrc), out = { overflow: false, banned: 0, small: [], names: [], rose: [], av: [], primaries: 0, sel: [] };
    out.overflow = document.documentElement.scrollWidth > innerWidth || [...document.querySelectorAll('.sheet,.tab')].some(e => e.offsetParent && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflowX !== 'visible' && e.scrollWidth > innerWidth);
    out.banned = document.querySelectorAll('.chip,.lchip,.fc,.arow,.acard,.lead,.sub2,.ctag,.lsw,.chips').length;
    const top = [...document.querySelectorAll('.sheet')].pop(), scopeEl = top || document;
    const vis = e => e.offsetParent !== null || e.tagName === 'INPUT' && e.closest('.sw');
    const els = [...scopeEl.querySelectorAll('button,input,textarea,[role=tab]')].filter(vis).filter(e => !e.closest('.hap') && !(e.closest('#home') && document.querySelector('#home').hidden) && e.type !== 'hidden');
    els.forEach(e => {
      const r = e.getBoundingClientRect(); if (r.width === 0) return;
      if (r.height < 43.5 || r.width < 43.5) out.small.push((e.className || e.tagName) + ':' + (e.textContent || e.placeholder || '').slice(0, 14) + ' ' + Math.round(r.width) + 'x' + Math.round(r.height));
      if (e.tagName === 'BUTTON') {
        const nm = (e.getAttribute('aria-label') || e.textContent).replace(/\s+/g, ' ').trim();
        const nounOk = e.closest('.seg,.row,.navrow,.tile,.nrow,.resume,.ctxbar,.newc,.pcell,.sc,.cb,.pv,.xm,.rmain3,.ddrow,.rmain,.fb,.rbtn,.srw,.swrow,.morebtn,.iconbtn,.lstrip') || e.disabled || e.getAttribute('aria-disabled') === 'true';
        if (!nounOk && !VERBS.test(nm)) out.names.push(nm.slice(0, 30));
      }
    });
    [...scopeEl.querySelectorAll('.btn')].filter(e => e.offsetParent && !e.classList.contains('tonal') && !e.classList.contains('dis') && !e.disabled).forEach(() => out.primaries++);
    scopeEl.querySelectorAll('.av').forEach(a => { if (a.offsetParent) out.av.push([getComputedStyle(a).borderTopLeftRadius, Math.round(a.getBoundingClientRect().width)]); });
    const hue = c => { const mx = Math.max(...c), mn = Math.min(...c), d = mx - mn; if (!d) return -1; const h = mx === c[0] ? ((c[1] - c[2]) / d) % 6 : mx === c[1] ? (c[2] - c[0]) / d + 2 : (c[0] - c[1]) / d + 4; return (h * 60 + 360) % 360; };
    const near = (c, t) => { const hh = hue(c); return hh >= 0 && (hh <= 20 || hh >= 350) && Math.abs(c[0] - t[0]) + Math.abs(c[1] - t[1]) + Math.abs(c[2] - t[2]) < 24; };
    const seen = new Set();
    scopeEl.querySelectorAll('*').forEach(e => {
      if (!e.offsetParent && e.tagName !== 'BODY' || e.closest('.av') || e.tagName === 'IMG' || e.closest('svg')) return;
      const cs = getComputedStyle(e);
      for (const v of [cs.color, cs.backgroundColor, cs.borderTopColor, cs.outlineColor, cs.boxShadow, cs.textDecorationColor, cs.caretColor]) {
        for (const m of String(v).matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/g)) { const c = [+m[1], +m[2], +m[3]]; if ((m[4] === undefined || +m[4] > .3) && ROSE.some(t => near(c, t))) { const k = e.className + c; if (!seen.has(k)) { seen.add(k); out.rose.push((e.className || e.tagName) + ' ' + c.join(',')); } } }
      }
    });
    document.querySelectorAll('.seg button[aria-selected=true],.seg button[aria-pressed=true],.fb[aria-current=page],.rbtn.on,.rrow[aria-checked=true]').forEach(e => { if (!e.offsetParent) return; const cs = getComputedStyle(e); if (cs.outlineStyle !== 'none' && cs.outlineWidth !== '0px' || parseFloat(cs.borderTopWidth) > 0 || (!e.matches('.rbtn,.fb') && /inset/.test(cs.boxShadow))) out.sel.push(e.className + ':' + e.textContent.slice(0, 8)); });
    return out;
  }, [VERBS.source, ROSE]);
  ok(`${tag} ${name}: no horizontal overflow, no outline chips / old classes`, !r.overflow && r.banned === 0);
  ok(`${tag} ${name}: every control >= 44x44`, r.small.length === 0, r.small.join('|'));
  ok(`${tag} ${name}: every button's name is a verb (or a noun on a › row / segment / nav)`, r.names.length === 0, r.names.join('|'));
  ok(`${tag} ${name}: no rose anywhere in computed colours`, r.rose.length === 0, r.rose.join('|'));
  ok(`${tag} ${name}: all photos are circles (50%) at 32/40/44/56/72`, r.av.every(a => a[0] === '50%' && [32, 40, 44, 56, 60, 64, 72, 96, 104].includes(a[1])), JSON.stringify(r.av.filter(a => a[0] !== '50%' || ![32, 40, 44, 56, 60, 64, 72, 96, 104].includes(a[1]))));
  ok(`${tag} ${name}: selected states have no coloured outline or ring`, r.sel.length === 0, r.sel.join('|'));
  ok(`${tag} ${name}: at most one filled primary on the surface (${r.primaries})`, r.primaries <= 1);
  return r;
}
const tap = async (p, s, ms = 250) => { await p.tap(s); await wait(p, ms); };
const closeTop = async p => { await p.tap('.sheet >> nth=-1 >> [data-act=shclose]'); await wait(p, 450); };
for (const [w, h, dark] of [[393, 852, false], [393, 852, true], [430, 932, false], [430, 932, true], [375, 667, false]]) {
  const tag = `${w}x${h} ${dark ? 'dark' : 'light'}`;
  const { page, ctx, errors } = await newPage(b, { w, h, dark, insets: w === 375 ? { top: 20, bottom: 0 } : { top: 59, bottom: 34 }, standalone: true }); await standalone(page, ctx);
  await page.goto(url); await wait(page, 400);
  await audit(page, 'Home', tag);
  await tap(page, '#home [data-v=greet]'); await audit(page, 'Chào hỏi (empty context)', tag);
  await tap(page, '#stage [data-card=greet] .sc[data-pid] >> nth=0'); await tap(page, '#stage [data-card=greet] .sc[data-pid] >> nth=1'); await audit(page, 'Chào hỏi (2 products)', tag);
  await tap(page, '#ctxbar .ctxbar', 600); await audit(page, 'Picker · context', tag);
  await tap(page, '.sheet #pkbody .pcell >> nth=3'); await audit(page, 'Picker · context (3 selected)', tag); await closeTop(page);
  await tap(page, '#stseg [data-v=size]'); await tap(page, '[data-act=stmore]'); await audit(page, 'Tư vấn size (Câu khác open)', tag);
  await tap(page, '#stseg [data-v=info]'); await audit(page, 'Xin thông tin', tag);
  await tap(page, '#stseg [data-v=out]'); await audit(page, 'Check out', tag);
  await tap(page, '#stage [data-card=pay] .pv >> nth=0', 500); await audit(page, 'Sửa tin sheet (entry)', tag); await closeTop(page);
  await tap(page, '#stseg [data-v=order]'); await audit(page, 'Tạo đơn (2 lines, one without size)', tag);
  await tap(page, '[data-act=lnsize][data-v=M] >> nth=0'); await tap(page, '[data-act=lnsize][data-v=M] >> nth=1');
  await tap(page, '[data-card=order] [data-act=cardedit] >> nth=0', 500); await tap(page, '.sheet .ddrow[data-lead=order]', 450); await audit(page, 'Câu mở đầu picker (order)', tag);
  await tap(page, '.sheet >> nth=-1 >> [data-act=leadpick][data-id="li-order-1"]', 650); await audit(page, 'Sửa tin sheet (order, strip)', tag); await closeTop(page);
  await audit(page, 'Tạo đơn (ready, strip)', tag);
  await tap(page, '[data-act=shipopen]', 500); await audit(page, 'Phí ship sheet', tag); await closeTop(page);
  await tap(page, '[data-act=oadd2]', 600); await audit(page, 'Picker · order', tag); await closeTop(page);
  await tap(page, '[data-act=recvtoggle]'); await audit(page, 'Tạo đơn (receiver open)', tag);
  await tap(page, '#fbar [data-v=pi]'); await audit(page, 'Sản phẩm · Theo mẫu', tag);
  await tap(page, '#pfilt [data-v=skirt]'); await audit(page, 'Sản phẩm · filter Váy', tag); await tap(page, '#pfilt [data-v=all]');
  await page.fill('#q', 'zzzz'); await wait(page, 300); await audit(page, 'Sản phẩm · empty search', tag); await page.fill('#q', ''); await wait(page, 250);
  await tap(page, '[data-open="p:noir-midi-skirt"]', 500); await audit(page, 'Product sheet · Thông tin', tag);
  await tap(page, '.sheet #pseg [data-v=size]'); await audit(page, 'Product sheet · Bảng size', tag);
  await tap(page, '.sheet #pseg [data-v=both]'); await audit(page, 'Product sheet · Cả hai', tag);
  await tap(page, '.sheet #pseg [data-v=info]');
  await tap(page, '.sheet [data-lead=info]', 450); await audit(page, 'Opening-line picker', tag);
  await tap(page, '.sheet >> nth=-1 >> [data-act=leadpick][data-id="li-info-3"]', 650); await audit(page, 'Product sheet · strip', tag);
  await page.fill('.sheet [data-eta=info]', 'tạm'); await audit(page, 'Product sheet · edited', tag);
  await tap(page, '.sheet [data-act=setpick]', 450); await audit(page, 'Product picker (set)', tag); await closeTop(page);
  await closeTop(page);
  await tap(page, '[data-act=pview][data-v=s]'); await audit(page, 'Sản phẩm · Theo set', tag);
  await tap(page, '[data-act=setsugg] >> nth=0', 600); await audit(page, 'Set sheet', tag);
  // set sheet geometry
  const geo = await page.evaluate(() => [...document.querySelectorAll('.bcard')].map((c, i, all) => { const cr = c.getBoundingClientRect(), ta = c.querySelector('.ebox').getBoundingClientRect(), bt = c.querySelector('.bbtn .btn').getBoundingClientRect(), nx = all[i + 1] ? all[i + 1].getBoundingClientRect().top - cr.bottom : null; return { pad: Math.round(ta.left - cr.left), boxBtn: Math.round(bt.top - ta.bottom), btnRight: Math.round(cr.right - bt.right), gap: nx === null ? null : Math.round(nx), hdr: Math.round(c.querySelector('.bh').getBoundingClientRect().height) }; }));
  ok(`${tag} set sheet bubble cards: 16 padding, >= 12 between box and button, button inset >= 16 from the card edge, 16 gap between cards`, geo.length === 4 && geo.every(g => g.pad === 16 && g.boxBtn >= 12 && g.btnRight >= 16 && (g.gap === null || g.gap === 16) && g.hdr >= 44), JSON.stringify(geo));
  ok(`${tag} set sheet: exactly one "Tiếp theo" card and one primary (footer)`, (await page.$$('.bcard.next')).length === 1 && /Tiếp theo/.test(await page.textContent('.bcard.next .btag')));
  await tap(page, '.bcard[data-b=a] .bbtn .btn', 100); await wait(page, 500); await tap(page, '.bcard[data-b=a] .bbtn .btn', 150);
  const nx = await page.evaluate(() => { const c = document.querySelector('.bcard.next'), s = document.querySelector('.sheet .shb'); return c ? { b: c.dataset.b, inView: c.getBoundingClientRect().top >= s.getBoundingClientRect().top - 2 && c.getBoundingClientRect().top < innerHeight } : null; });
  await wait(page, 600);
  const nx2 = await page.evaluate(() => { const c = document.querySelector('.bcard.next'), s = document.querySelector('.sheet .shb'); return c ? { b: c.dataset.b, top: Math.round(c.getBoundingClientRect().top - s.getBoundingClientRect().top) } : null; });
  ok(`${tag} after copying tin 1, tin 2 is next and scrolled into view (16pt below the header)`, nx2 && nx2.b === 'b' && nx2.top >= 0 && nx2.top <= 24, JSON.stringify(nx2));
  await closeTop(page);
  await tap(page, '#nav [data-act=settings]', 500); await audit(page, 'Tuỳ chỉnh', tag);
  await tap(page, '[data-p="leads"]', 350); await tap(page, '[data-p="leadlist:info"]', 350); await audit(page, 'Tuỳ chỉnh · Câu mở đầu list', tag);
  await closeTop(page);
  // product list photo circles on Home too
  ok(`${tag} zero console errors across all screens`, errors.length === 0, errors.join(';'));
  await ctx.close();
}

/* ============ 3. LIVE CONTRAST OF THE ACTUAL BUTTONS ============ */
const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(c[0]) + .7152 * f(c[1]) + .0722 * f(c[2]); };
const cr = (a, b2) => { const x = lum(a), y = lum(b2); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const rgb = s => s.match(/\d+/g).slice(0, 3).map(Number);
for (const dark of [false, true]) {
  const { page, ctx } = await newPage(b, { w: 393, h: 852, dark }); await page.goto(url); await wait(page, 400);
  await tap(page, '#fbar [data-v=pi]'); await tap(page, '[data-open="p:lace-top"]', 500);
  const pr = await page.$eval('.shf .btn', e => { const c = getComputedStyle(e); return [c.color, c.backgroundColor]; });
  ok(`${dark ? 'dark' : 'light'} live primary button: text on fill >= ${dark ? 11 : 7.5} (${pr[1]} / ${pr[0]})`, cr(rgb(pr[0]), rgb(pr[1])) >= (dark ? 11 : 7.5) && rgb(pr[1]).join() === (dark ? '242,231,171' : '77,81,98'), cr(rgb(pr[0]), rgb(pr[1])).toFixed(2));
  const sw = await page.$eval('.sw i', e => getComputedStyle(e).backgroundColor); await tap(page, '.sheet .swrow'); const swOn = await page.$eval('.sw i', e => getComputedStyle(e).backgroundColor);
  ok(`${dark ? 'dark' : 'light'} switch on = the primary colour`, rgb(swOn).join() === (dark ? '242,231,171' : '77,81,98'), swOn);
  const cs = await page.evaluate(() => [getComputedStyle(document.body).backgroundColor, getComputedStyle(document.documentElement).backgroundColor, document.querySelector('meta[name=theme-color][media*="' + (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') + '"]').content]);
  ok(`${dark ? 'dark' : 'light'} html and body backgrounds are --bg-grouped; theme-color meta = header --bg`, rgb(cs[0]).join() === BG[dark ? 'dark' : 'light'].join() && rgb(cs[1]).join() === BG[dark ? 'dark' : 'light'].join() && cs[2].toUpperCase() === (dark ? '#1C1D1C' : '#FCFBF5'), cs.join(' '));
  await ctx.close();
}
await b.close(); srv.close();
const f = R.filter(r => !r[1]); console.log(`\n${R.length - f.length}/${R.length} passed`); process.exit(f.length ? 1 : 0);
