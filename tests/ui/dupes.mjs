// The idempotent-render contract (design-v6 section 9) as tests. Everything runs with #debug=dupes (lib.mjs appends it):
// a repeated keyed group, a second .mcard/.ctxbar/.pstrip, or two stacked sheets of the same kind+key is a console.error('dupe') and fails the test.
import { serve, launch, newPage } from './lib.mjs';
process.env.NO_SYNTH = '1';
const R = []; const ok = (n, c, d = '') => { R.push([n, !!c]); console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
const { srv, url } = await serve(); const b = await launch();
const W = (p, ms = 150) => p.waitForTimeout(ms);
const INS = { top: 59, bottom: 34 };
const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
const ACTS = ['stage', 'stmore', 'stripset', 'stripall', 'greetv', 'cardcopy', 'cardedit', 'cardmore', 'cardneed', 'fititem', 'fitsize', 'fillseg', 'thanksv', 'pastefill', 'pastego', 'ctxpick', 'pkcell', 'pkpair', 'pksize', 'pkrm', 'pkdone', 'pkcat', 'oadd2', 'lnrm', 'lnqty', 'lnsize', 'shipopen', 'shippick', 'shipdone', 'recvtoggle', 'pasteinfo', 'copyorder', 'newcust', 'shclose', 'shdim', 'toastact', 'lang', 'top', 'ebedit', 'ebreset', 'leadopen', 'leadpick', 'tok', 'dockneed', 'attach', 'pview', 'pcopy', 'pseg', 'addline', 'setpick', 'pickone', 'linktoggle'];
async function invariants(page) {
  return page.evaluate(() => {
    const out = [], sheets = [...document.querySelectorAll('#sheets .sh.in')];
    out.push(...window.__SE.assertUnique());
    if (document.querySelectorAll('.ctxbar[data-ctx=bar]').length > 1) out.push('2 context bars');
    if (document.querySelectorAll('#stage .mcard[data-card]').length !== new Set([...document.querySelectorAll('#stage .mcard[data-card]')].map(e => e.dataset.card)).size) out.push('duplicate card');
    if (document.querySelectorAll('#stage .pstrip').length > 3) out.push('too many strips');
    sheets.forEach(s => { if (s.querySelectorAll('[data-row=item]').length > 1) out.push('2 item rows in a sheet'); });
    const keys = [...document.querySelectorAll('#sheets .sh.in .sheet h2')].map(h => h.textContent);
    for (let i = 1; i < keys.length; i++) if (keys[i] === keys[i - 1]) out.push('stacked duplicate sheet ' + keys[i]);
    document.querySelectorAll('.pcell[data-pid]').forEach(c => { if (c.parentNode.querySelectorAll('.pcell[data-pid="' + c.dataset.pid + '"]').length > 1) out.push('dup cell ' + c.dataset.pid); });
    const lines = window.__SE.st.draft.lines; if (new Set(lines.map(l => l.pid + ':' + l.size)).size !== lines.length) out.push('two lines with the same product and size');
    if (lines.some(l => l.qty < 1 || l.qty > 9)) out.push('qty out of range');
    if (new Set(lines.map(l => l.pid)).size > 4) out.push('more than 4 products');
    return out;
  });
}
async function step(page, rnd, log) {
  const pick = await page.evaluate(([acts, r]) => {
    const top = [...document.querySelectorAll('#sheets .sh.in .sheet')].pop();
    const els = [...document.querySelectorAll('[data-act], [data-open^="p:"]')].filter(e => {
      if (!e.offsetParent && !(e.type === 'checkbox')) return false;
      const act = e.dataset.act || 'open'; if (act !== 'open' && !acts.includes(act)) return false;
      const bb = e.getBoundingClientRect(); if (bb.width < 4 || bb.height < 4 || bb.bottom < 0 || bb.top > innerHeight) return false;
      const inSheet = !!e.closest('.sheet'); if (top ? e.closest('.sheet') !== top && !e.closest('#toast') : inSheet) return false;
      const hit = document.elementFromPoint(bb.left + bb.width / 2, bb.top + bb.height / 2); return hit && (e === hit || e.contains(hit) || hit.contains(e));
    });
    if (!els.length) return null;
    els.forEach((e, i) => e.setAttribute('data-fz', i));
    const i = Math.floor(r * els.length); return { i, act: els[i].dataset.act || 'open', txt: (els[i].getAttribute('aria-label') || els[i].textContent || '').trim().slice(0, 24) };
  }, [ACTS, rnd()]);
  if (!pick) { await page.evaluate(() => document.querySelector('#fbar [data-v=qr]').click()); return 'none'; }
  const dbl = rnd() < 0.18;
  await page.evaluate(([i, dbl]) => { const e = document.querySelector('[data-fz="' + i + '"]'); e.click(); if (dbl) setTimeout(() => e.isConnected && e.click(), 30); document.querySelectorAll('[data-fz]').forEach(x => x.removeAttribute('data-fz')); }, [pick.i, dbl]);
  log.push(pick.act + (dbl ? '×2' : '') + ':' + pick.txt);
  await W(page, 55 + Math.floor(rnd() * 90));
  return pick.act;
}
for (const [w, h, dark] of [[393, 852, false], [430, 932, true]]) {
  const tag = `${w}x${h} ${dark ? 'dark' : 'light'}`;
  {   // her 6.webp sequence on the v6 surfaces: no product chip group exists in any sheet; double taps never stack
    const { page, errors } = await newPage(b, { w, h, dark, insets: INS, standalone: true }); await page.goto(url); await W(page, 350);
    await page.tap('#home [data-v=greet]'); await W(page);
    for (const k of [0, 1, 2]) { await page.tap(`[data-card=greet] .sc[data-pid] >> nth=${k}`); await W(page, 120); }
    await page.tap('[data-card=greet] .mact [data-act=cardedit]'); await W(page, 500);
    ok(`${tag} Sửa tin sheet has exactly one [data-row=item]-free layout (no product chip group) and one context row`, (await page.$$('.sheet [data-row=item]')).length === 0 && (await page.$$('.sheet [data-row=ctx]')).length === 1 && (await page.$$('.sheet .chip, .sheet .lchip')).length === 0);
    await page.tap('.sheet [data-act=shclose]'); await W(page, 450);
    await page.dispatchEvent('[data-card=greet] .pv', 'click'); await W(page, 40); await page.dispatchEvent('[data-card=greet] .pv', 'click'); await W(page, 500);
    ok(`${tag} double tap on a card preview opens ONE sheet`, (await page.$$('#sheets .sh')).length === 1);
    await page.tap('.sheet [data-act=shclose]'); await W(page, 450);
    await page.dispatchEvent('#ctxbar .ctxbar', 'click'); await W(page, 30); await page.dispatchEvent('#ctxbar .ctxbar', 'click'); await W(page, 500);
    ok(`${tag} double tap on the context bar opens ONE picker`, (await page.$$('#sheets .sh')).length === 1);
    const n0 = await page.$$eval('.sheet .trow', e => e.length);
    await page.dispatchEvent('.sheet .pcell[data-pid="lace-top"] >> nth=0', 'click'); await W(page, 30); await page.dispatchEvent('.sheet .pcell[data-pid="lace-top"] >> nth=0', 'click'); await W(page, 150);
    ok(`${tag} picker cell double tap = toggled twice (idempotent), never two tray rows`, (await page.$$eval('.sheet .trow', e => e.length)) === n0 && (await page.$$eval('.sheet .trow', e => new Set(e.map(x => x.dataset.pid)).size === e.length)));
    await page.dispatchEvent('.sheet [data-act=pkdone]', 'click'); await W(page, 20); await page.dispatchEvent('.sheet [data-act=pkdone]', 'click'); await W(page, 600);
    ok(`${tag} double tap on "Xong" commits once`, (await page.evaluate(() => window.__SE.st.draft.lines.length)) === n0 && (await page.$$('#sheets .sh')).length === 0);
    await page.evaluate(() => document.querySelector('#stseg [data-v=order]').click()); await W(page, 250);
    await page.evaluate(() => window.__SE.st.draft.lines.forEach(l => { l.size = null; })); await page.evaluate(() => document.querySelector('#stseg [data-v=greet]').click()); await W(page, 150); await page.evaluate(() => document.querySelector('#stseg [data-v=order]').click()); await W(page, 250);
    await page.dispatchEvent('#stage [data-act=lnsize][data-v=M] >> nth=0', 'click'); await W(page, 20); await page.dispatchEvent('#stage [data-act=lnsize][data-v=M] >> nth=0', 'click'); await W(page, 20); await page.dispatchEvent('#stage [data-act=lnsize][data-v=M] >> nth=0', 'click'); await W(page, 200);
    ok(`${tag} repeated taps on a size segmented never stack quantity (no "pills +1")`, await page.evaluate(() => window.__SE.st.draft.lines.every(l => l.qty === 1)));
    await page.dispatchEvent('#stage [data-act=oadd2]', 'click'); await W(page, 20); await page.dispatchEvent('#stage [data-act=oadd2]', 'click'); await W(page, 500);
    ok(`${tag} double tap on "＋ Thêm món" opens ONE picker`, (await page.$$('#sheets .sh')).length === 1);
    ok(`${tag} assertUnique finds nothing and zero console errors`, (await invariants(page)).length === 0 && errors.length === 0, errors.join(';'));
    await page.context().close();
  }
  {   // canary: the check really fails the test when a group is duplicated
    const { page, errors } = await newPage(b, { w, h, dark, insets: INS, standalone: true }); await page.goto(url); await W(page, 350);
    await page.tap('#home [data-v=greet]'); await W(page, 200);
    await page.evaluate(() => { const c = document.querySelector('#stage [data-card=greet]'); c.parentNode.appendChild(c.cloneNode(true)); }); await W(page, 200);
    ok(`${tag} canary: a duplicated .mcard is reported as console.error('dupe') (so every UI test would fail)`, errors.some(e => /dupe/.test(e)), errors.join(';'));
    await page.context().close();
    const o = await newPage(b, { w, h, dark, insets: INS, standalone: true }); await o.page.goto(url); await W(o.page, 350);
    await o.page.tap('#home [data-v=greet]'); await W(o.page, 200);
    await o.page.tap('[data-card=greet] .mact [data-act=cardedit]'); await W(o.page, 500);
    await o.page.evaluate(() => { const r = document.querySelector('.sheet [data-row=ctx]'); r.parentNode.appendChild(r.cloneNode(true)); }); await W(o.page, 200);
    ok(`${tag} canary: a second keyed row inside a sheet is reported`, o.errors.some(e => /dupe/.test(e)), o.errors.join(';'));
    await o.page.context().close();
  }
  for (const seed of (process.env.SEEDS ? process.env.SEEDS.split(',').map(Number) : [7, 1234, 99991])) {   // fuzz: 200 random taps over cards, chips, pickers, sheets, stages, languages
    const { page, errors } = await newPage(b, { w, h, dark, insets: INS, standalone: true, storage: { rp: [{ p: 'lace-top', at: Date.now() }, { p: 'lace-skirt-cream', at: Date.now() - 1 }] } });
    await page.goto(url); await W(page, 350);
    await page.evaluate(() => document.querySelector('#home [data-v=greet]').click()); await W(page, 200);
    const rnd = mulberry(seed), log = []; let bad = [], at = -1;
    for (let i = 0; i < 200; i++) {
      await step(page, rnd, log);
      const inv = await invariants(page);
      if (inv.length) { bad = inv; at = i; break; }
    }
    ok(`${tag} fuzz seed ${seed}: 200 random taps (incl. double taps) — no duplicated group, no stacked duplicate sheet, qty in 1..9, ≤ 4 products`, bad.length === 0 && errors.length === 0, `step ${at}: ${bad.join(',')} ${errors.slice(0, 2).join(';')} last: ${log.slice(-4).join(' > ')}`);
    const acts = new Set(log.map(l => l.split(':')[0].replace('×2', ''))); ok(`${tag} fuzz seed ${seed}: exercised ${acts.size} different controls`, acts.size >= 12, [...acts].join(','));
    await page.context().close();
  }
}
await b.close(); srv.close();
const f = R.filter(r => !r[1]); console.log(`\n${R.length - f.length}/${R.length} passed`); process.exit(f.length ? 1 : 0);
