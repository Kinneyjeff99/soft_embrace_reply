// Round 7 (fix round after QC + acceptance audit): in-place message boxes, keyboard, bracket net, shipping memory, subtitle, stale order,
// drafts that survive a restart, reset with undo, strips, tap budget, text scale 1.3 / 1.41. Always with #debug=dupes (lib.mjs).
import { serve, launch, newPage } from './lib.mjs';
process.env.NO_SYNTH = '1';
const R = []; const ok = (n, c, d = '') => { R.push([n, !!c]); console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
const { srv, url } = await serve(); const b = await launch();
const W = (p, ms = 150) => p.waitForTimeout(ms);
const clip = p => p.evaluate(() => window.__clip.slice());
const INS = { top: 59, bottom: 34 };
const NOW = () => Date.now();
const REC = (...ids) => ids.map((p, i) => ({ p, at: NOW() - i * 1000 }));
async function open(o = {}) {
  const x = await newPage(b, { insets: INS, standalone: true, ...o });
  await x.page.goto(url + (o.hash || '')); await W(x.page, 350);
  if (o.stage) { await x.page.evaluate(id => document.querySelector(`#home [data-v=${id}]`).click(), o.stage); await W(x.page, 250); }
  return x;
}
const tap = async (p, s, ms = 150) => { await p.tap(s); await W(p, ms); };
const stage = (p, id) => tap(p, `#stseg [data-v=${id}]`, 220);
const seed = (lines, extra = {}) => ({ draft: { lines, ship: 'courier', custom: 0, info: '', bank: true, copiedAt: 0, done: {}, at: NOW() }, rp: REC('lace-top', 'lace-skirt-cream', 'butter-top', 'fleur-slip-dress-blue'), ...extra });
const LT = { pid: 'lace-top', size: 'M', qty: 1 };
const val = (p, id) => p.inputValue(`#stage [data-card="${id}"] textarea.pv`);
const lastClip = async p => (await clip(p)).slice(-1)[0];
const goStage = async (p, id) => { await p.evaluate(i => document.querySelector(`#home [data-v=${i}]`).click(), id); await W(p, 250); };

for (const [w, h] of [[393, 852], [430, 932]]) for (const dark of [false, true]) {
  const tag = `${w}x${h} ${dark ? 'dark' : 'light'}`;

  {   // ===== R30: message boxes edited in place, fixed max height, scroll inside =====
    const { page, errors } = await open({ w, h, dark, stage: 'greet', storage: seed([LT, { pid: 'butter-top', size: 'S', qty: 1 }, { pid: 'lace-skirt-cream', size: 'M', qty: 1 }, { pid: 'embroidery-pants', size: 'S', qty: 1 }]) });
    const g = await page.evaluate(() => { const t = document.querySelector('[data-card=greet] textarea.pv'), cs = getComputedStyle(t); return { sh: t.scrollHeight, ch: t.clientHeight, max: parseFloat(cs.maxHeight), fs: parseFloat(cs.fontSize), hasMore: !!document.querySelector('[data-card=greet] .pvbox.more'), btn: [...document.querySelectorAll('button')].some(x => /Xem hết/.test(x.textContent)), exp: !!document.querySelector('.xm,[data-act=cardmore]') }; });
    ok(`${tag} greeting with 4 products: the box is capped (6 lines), its text scrolls INSIDE, no "Xem hết" anywhere, text is 16px (no iOS zoom)`, g.sh > g.ch && g.ch <= g.max + 1 && g.max < 170 && g.fs >= 16 && g.hasMore && !g.btn && !g.exp, JSON.stringify(g));
    await page.$eval('[data-card=greet] textarea.pv', e => { e.scrollTop = 99999; e.dispatchEvent(new Event('scroll')); }); await W(page, 150);
    ok(`${tag} the end of the full text is reachable by scrolling the box (last product)`, await page.evaluate(() => { const t = document.querySelector('[data-card=greet] textarea.pv'); return Math.abs(t.scrollHeight - t.scrollTop - t.clientHeight) < 2 && /Embroidery/.test(t.value); }));
    const before = (await clip(page)).length; await tap(page, '[data-card=greet] textarea.pv', 200);
    ok(`${tag} tapping the box focuses it (no sheet, no copy)`, (await page.$$('#sheets .sh')).length === 0 && (await clip(page)).length === before && await page.evaluate(() => document.activeElement.matches('textarea.pv')));
    await page.keyboard.press('Control+End'); await page.keyboard.type(' ✏️'); await W(page, 150);
    const est = await page.textContent('[data-card=greet] .est');
    ok(`${tag} typing marks the card "Đã sửa" with Khôi phục (the greeting has no "Lưu làm mẫu")`, /Đã sửa/.test(est) && /Khôi phục/.test(est) && !/Lưu làm mẫu/.test(est));
    await page.evaluate(() => document.activeElement.blur());
    await tap(page, '[data-card=greet] [data-act=cardcopy]', 100);
    ok(`${tag} one Chép: the clipboard is exactly the box (typed text included)`, (await lastClip(page)) === (await val(page, 'greet')).trim() && (await lastClip(page)).endsWith('✏️'));
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';')); await page.context().close();
  }

  {   // entry card: Đã sửa · Khôi phục · Lưu làm mẫu, undo of Khôi phục
    const { page, errors } = await open({ w, h, dark, stage: 'info', storage: seed([LT]) });
    const gen = await val(page, 'shipping-info');
    await page.fill('[data-card=shipping-info] textarea.pv', 'Bạn cho Soft xin tên, SĐT, địa chỉ nha 💗'); await W(page, 150);
    const est = await page.textContent('[data-card=shipping-info] .est');
    ok(`${tag} entry card edited: "Đã sửa", "Khôi phục" and "Lưu làm mẫu" are all there`, ['Đã sửa', 'Khôi phục', 'Lưu làm mẫu'].every(t => est.includes(t)), est);
    await tap(page, '[data-card=shipping-info] [data-act=cardreset]', 200);
    ok(`${tag} Khôi phục restores the generated text and offers Hoàn tác`, (await val(page, 'shipping-info')) === gen && /Hoàn tác/.test(await page.textContent('#toast')));
    await tap(page, '[data-act=toastact]', 200);
    ok(`${tag} Hoàn tác brings the typed text back`, (await val(page, 'shipping-info')) === 'Bạn cho Soft xin tên, SĐT, địa chỉ nha 💗');
    await tap(page, '[data-card=shipping-info] [data-act=cardsave]', 300);
    ok(`${tag} Lưu làm mẫu: the typed text becomes the message and the edited state clears`, (await val(page, 'shipping-info')) === 'Bạn cho Soft xin tên, SĐT, địa chỉ nha 💗' && !(await page.$('[data-card=shipping-info] .est .ed')) && /Đã lưu làm mẫu/.test(await page.textContent('#toast')));
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';')); await page.context().close();
  }

  {   // Tạo đơn: bank line is in the box; box scrolls
    const { page, errors } = await open({ w, h, dark, stage: 'order', storage: seed([LT, { pid: 'butter-top', size: 'S', qty: 1 }, { pid: 'lace-skirt-cream', size: 'M', qty: 2 }], { set: { lang: 'vi', fee: 25000, bank: { name: 'VCB', no: '0123456789', holder: 'NGUYEN A' } } }) });
    const o = await page.evaluate(() => { const t = document.querySelector('[data-card=order] textarea.pv'); t.scrollTop = 99999; return { v: t.value, sc: t.scrollTop, sh: t.scrollHeight, ch: t.clientHeight, end: Math.abs(t.scrollHeight - t.scrollTop - t.clientHeight) < 2 }; });
    ok(`${tag} Tạo đơn: the bank-transfer line is in the box and reachable by scrolling it (${o.sh}/${o.ch})`, /Chuyển khoản: VCB · 0123456789/.test(o.v) && o.end && (o.sh <= o.ch + 1 || o.sc > 0));
    ok(`${tag} Tạo đơn: the shipping line is in the message`, /• Shipping: khách trả shipper/.test(o.v));
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';')); await page.context().close();
  }

  {   // ===== R23 helper line on all five stages =====
    const { page, errors } = await open({ w, h, dark, stage: 'greet' });
    const res = [];
    for (const id of ['greet', 'size', 'info', 'order', 'out']) {
      await stage(page, id);
      const r = await page.evaluate(() => { const e = document.querySelector('#qrsub'), d = window.__SE.STAGES.find(g => g.id === document.body.dataset.stage); return { t: e.textContent, d: d.desc, h: e.getBoundingClientRect().height, lh: parseFloat(getComputedStyle(e).lineHeight) }; });
      res.push([id, r.t === r.d && r.t.length > 20 && r.h <= r.lh + 1, r.t + ' h' + r.h]);
    }
    ok(`${tag} every Trả lời nhanh screen has its one-line warm helper (STAGES[].desc), on ONE line`, res.every(x => x[1]), JSON.stringify(res.filter(x => !x[1])));
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';')); await page.context().close();
  }

  {   // ===== P1-2 / R40: bracket net =====
    const { page, errors } = await open({ w, h, dark, stage: 'size', storage: seed([LT], { set: { lang: 'en', fee: 25000, bank: { name: '', no: '', holder: '' } } }) });
    await page.evaluate(() => { document.querySelector('[data-card=sizes] input[data-in=sizeask]').click(); }); await W(page, 200);
    const t = await val(page, 'sizes');
    ok(`${tag} EN measurement request: clean sentence "bust, waist and hip measurements and your height", no [bust / waist / hip]`, /bust, waist and hip measurements and your height/.test(t) && !/\[|\]/.test(t));
    await page.evaluate(() => { window.__SE.st.ov['will-think'] = { vi: 'Bạn xem thử nhé [chọn câu phù hợp]', en: 'Take your time [pick a sentence]' }; });
    await goStageBack(page);
    await page.tap('[data-act=stmore]'); await W(page, 200);
    ok(`${tag} a leftover [word] (not one of the app's own blanks) blocks Chép: capsule "Kiểm tra chỗ [ ]" + notice naming it`, /Kiểm tra chỗ \[ \]/.test(await page.textContent('[data-card=will-think] .ccap')) && /pick a sentence/.test(await page.textContent('[data-card=will-think] .mn')) && !(await page.$('[data-card=will-think] [data-act=cardcopy]')));
    const c0 = (await clip(page)).length; await tap(page, '[data-card=will-think] .ccap', 250);
    ok(`${tag} tapping it copies nothing and selects the bracket in the box`, (await clip(page)).length === c0 && await page.evaluate(() => { const t = document.querySelector('[data-card=will-think] textarea.pv'); return document.activeElement === t && t.value.slice(t.selectionStart, t.selectionEnd) === '[pick a sentence]'; }));
    await page.keyboard.press('ArrowRight'); await page.keyboard.type(' (ok)'); await W(page, 200);
    ok(`${tag} after she edits the text the bracket needs a second, deliberate tap (confirm)`, !!(await page.$('[data-card=will-think] [data-act=cardcopy]')) && /hai lần/.test(await page.textContent('[data-card=will-think] .mn')));
    await page.evaluate(() => document.activeElement.blur());
    await tap(page, '[data-card=will-think] [data-act=cardcopy]', 100);
    ok(`${tag} first tap arms ("Chạm lại để chép"), nothing copied`, (await clip(page)).length === c0 && /Chạm lại/.test(await page.textContent('[data-card=will-think] [data-act=cardcopy]')));
    await W(page, 500); await tap(page, '[data-card=will-think] [data-act=cardcopy]', 150);
    ok(`${tag} second tap copies`, (await clip(page)).length === c0 + 1 && /pick a sentence/.test(await lastClip(page)));
    await page.fill('[data-card=fit-size] textarea.pv', 'Size [size] nhé'); await W(page, 150);
    ok(`${tag} a typed [size] is never sent: card blocked ("Còn chỗ trống")`, /Còn chỗ trống/.test(await page.textContent('[data-card=fit-size] .ccap')));
    await page.evaluate(() => { window.__SE.st.ov['will-think'] = undefined; });
    await tap(page, '#fbar [data-v=pi]', 300); await tap(page, '[data-open="p:lace-top"]', 800);
    await page.fill('.sheet textarea[data-eta=info]', 'Lace Top size [size] nhé'); await W(page, 150);
    const c1 = (await clip(page)).length; await tap(page, '.sheet [data-act=pcopy]', 200);
    ok(`${tag} F-03: product sheet with a typed [size] copies nothing (toast "Còn chỗ trống")`, (await clip(page)).length === c1 && /Còn chỗ trống/.test(await page.textContent('#toast')));
    await page.fill('.sheet textarea[data-eta=info]', 'Lace Top [giá bao nhiêu] nhé'); await W(page, 150);
    await tap(page, '.sheet [data-act=pcopy]', 150);
    ok(`${tag} an unknown bracket typed in the product sheet needs a second tap`, (await clip(page)).length === c1 && /Chạm lại/.test(await page.textContent('.sheet [data-act=pcopy]')));
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';')); await page.context().close();
  }

  {   // ===== P1-3 shipping memory + explicit shipping line =====
    const { page, errors } = await open({ w, h, dark, stage: 'order', storage: seed([LT], { set: { lang: 'vi', fee: 25000, bank: { name: '', no: '', holder: '' } } }) });
    ok(`${tag} first run: default is "Khách trả shipper" and the dock says the total leaves shipping out ("chưa gồm ship")`, /Khách trả shipper/.test(await page.textContent('[data-row=ship] .dv')) && /chưa gồm ship/.test(await page.textContent('#odock .dl2')));
    await tap(page, '[data-act=shipopen]', 800); await tap(page, '.sheet [data-act=shippick][data-v=custom]', 200); await page.fill('.sheet [data-in=custom]', '24000'); await W(page, 150); await tap(page, '.sheet [data-act=shipdone]', 700);
    ok(`${tag} custom fee 24.000đ: the message states the shipping line and the total includes it`, /• Shipping: 24\.000đ/.test(await val(page, 'order')) && /404\.000đ/.test(await page.textContent('#odock .tv')) && !/chưa gồm ship/.test(await page.textContent('#odock .dl2')));
    await page.evaluate(() => document.querySelector('[data-act=newcust]').click()); await W(page, 300);
    await page.evaluate(() => document.querySelector('#stseg [data-v=order]').click()); await W(page, 250);
    await tap(page, '#stage .sc[data-pid] >> nth=0', 250); await tap(page, '#stage [data-act=lnsize][data-v=M]', 250);
    ok(`${tag} a NEW customer keeps her last choice (custom 24.000đ): ship row and message`, /24\.000đ/.test(await page.textContent('[data-row=ship] .dv')) && /• Shipping: 24\.000đ/.test(await val(page, 'order')));
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await W(page, 100);
    ok(`${tag} the choice is persisted in settings (survives a restart)`, await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('se.v1')); return s.set.lastShip === 'custom' && s.set.lastCustom === 24000; }));
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';')); await page.context().close();
  }

  {   // ===== R40: stale order on Tạo đơn =====
    const { page, errors } = await open({ w, h, dark, stage: 'order', storage: seed([LT], { draft: { lines: [LT], ship: 'courier', custom: 0, info: '', bank: true, copiedAt: 0, done: {}, at: NOW() - 3 * 36e5 } }) });
    ok(`${tag} Tạo đơn with a context older than 2 h shows "Đơn này từ 3 giờ trước. Vẫn là khách này?" with a way out`, /Đơn này từ 3 giờ trước/.test(await page.textContent('.notice.stale')) && !!(await page.$('.notice.stale [data-act=newcust]')));
    await tap(page, '.notice.stale [data-act=newcust]', 400);
    ok(`${tag} "Sang khách khác" clears the order (and the notice)`, (await page.evaluate(() => window.__SE.st.draft.lines.length)) === 0 && !(await page.$('.notice.stale')));
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';')); await page.context().close();
  }

  {   // ===== P1-8 tap budget + strip labels =====
    const x = await open({ w, h, dark });
    await x.page.evaluate(() => { window.__clicks = 0; });
    await tap(x.page, '#home [data-v=greet]'); await tap(x.page, '#stage [data-card=greet] [data-pid="lace-top"]', 300); await tap(x.page, '[data-card=greet] [data-act=cardcopy]');
    ok(`${tag} S1 with no recents: Home > Chào hỏi > Lace Top (strip) > Chép = 3 taps, and the greeting really has Lace Top`, (await x.page.evaluate(() => window.__clicks)) === 3 && /Lace Top/.test(await lastClip(x.page)));
    await x.page.context().close();
    const y = await open({ w, h, dark });
    await y.page.evaluate(() => { window.__clicks = 0; });
    await tap(y.page, '#home [data-v=size]'); await tap(y.page, '#stage [data-card=sizes] [data-pid="lace-skirt-cream"]', 300); await tap(y.page, '[data-card=sizes] [data-act=cardcopy]');
    ok(`${tag} S3 with no recents: Home > Tư vấn size > Lace Skirt Kem (strip) > Chép = 3 taps`, (await y.page.evaluate(() => window.__clicks)) === 3 && /^• S:.*\n• M:/.test(await lastClip(y.page)));
    await y.page.context().close();
    const z = await open({ w, h, dark, stage: 'greet' });
    await tap(z.page, '[data-card=greet] [data-act=stripall]', 800); await tap(z.page, '.sheet .pcell[data-pid="noir-midi-skirt"] >> nth=0', 900);
    ok(`${tag} picker with an empty context: one tap on a photo selects AND finishes (no Xong)`, (await z.page.$$('#sheets .sh')).length === 0 && (await z.page.evaluate(() => window.__SE.st.draft.lines.map(l => l.pid).join())) === 'noir-midi-skirt');
    await stage(z.page, 'size');
    ok(`${tag} the product she is discussing stays in the strip (checked) when the stage is opened again`, (await z.page.$$('[data-card=sizes] .sc[aria-pressed=true][data-pid="noir-midi-skirt"]')).length === 1);
    await z.page.context().close();
    const v = await open({ w, h, dark, stage: 'greet', storage: { rp: REC('fleur-slip-dress-blue', 'fleur-slip-dress-yellow', 'embroidery-pants', 'lace-trim-blouse-cream') } });
    const lab = await v.page.$$eval('[data-card=greet] .pstrip .sc[data-pid]', e => e.map(x => ({ t: x.querySelector('.nm').innerText.replace(/\n/g, ' / '), clip: [...x.querySelectorAll('.nm .n,.nm .cl')].some(y => y.scrollWidth > y.clientWidth + 1), cl: !!x.querySelector('.cl .dot') })));
    ok(`${tag} strip: Fleur Slip Dress Xanh and Vàng read differently (colour line + dot), no label is clipped sideways`, new Set(lab.map(l => l.t)).size === 4 && lab[0].cl && lab[1].cl && lab.every(l => !l.clip), JSON.stringify(lab));
    await v.page.context().close();
  }

  {   // ===== P1-9 drafts survive an app kill; reset with confirm + undo =====
    const { page, ctx, errors } = await open({ w, h, dark, stage: 'greet', storage: seed([LT]) });
    await page.fill('[data-card=greet] textarea.pv', 'Bản nháp dở dang 🌷'); await W(page, 700);
    await page.evaluate(() => { window.dispatchEvent(new Event('pagehide')); });
    await page.reload(); await W(page, 500); await goStage(page, 'greet');
    ok(`${tag} typed card edit is restored after a restart (draft keyed by card + language + generated text)`, (await val(page, 'greet')) === 'Bản nháp dở dang 🌷' && /Đã sửa/.test(await page.textContent('[data-card=greet] .est')));
    await tap(page, '[data-card=greet] [data-act=cardcopy]', 400);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await page.reload(); await W(page, 500); await goStage(page, 'greet');
    ok(`${tag} after a successful copy the draft is not restored again`, (await val(page, 'greet')) !== 'Bản nháp dở dang 🌷');
    await page.fill('[data-card=greet] textarea.pv', 'Bản nháp thứ hai'); await W(page, 500); await tap(page, '[data-card=greet] [data-act=cardreset]', 300);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await page.reload(); await W(page, 500); await goStage(page, 'greet');
    ok(`${tag} after Khôi phục the draft is gone`, (await val(page, 'greet')) !== 'Bản nháp thứ hai');
    await page.fill('[data-card=greet] textarea.pv', 'Bản nháp thứ ba'); await W(page, 500); await tap(page, '[data-act=newcust]', 300);
    await page.evaluate(() => window.dispatchEvent(new Event('pagehide'))); await page.reload(); await W(page, 500); await goStage(page, 'greet');
    ok(`${tag} after "Khách khác" the draft is gone`, (await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('se.v1')).draft.eds || {}).length)) === 0);
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';')); await ctx.close();
  }

  {   // reset all content: confirm + undo (and st.bak)
    const { page, errors } = await open({ w, h, dark, storage: { ov: { 'lace-top': { price: 399000 } }, lead: { sel: {}, custom: [{ id: 'lu-x', action: 'info', vi: 'Câu của mình', en: '' }], edits: {}, hidden: [] } } });
    await tap(page, '[data-act=settings]', 800); await tap(page, '.sheet [data-act=resetall]', 700);
    ok(`${tag} Khôi phục nội dung gốc asks first (dialog with Huỷ) and says it can be undone`, !!(await page.$('.dlg')) && /Hoàn tác/.test(await page.textContent('.dlg')));
    await tap(page, '.dlg [data-i="1"]', 300);
    ok(`${tag} Huỷ changes nothing`, await page.evaluate(() => window.__SE.st.ov['lace-top'].price === 399000));
    await tap(page, '.sheet [data-act=resetall]', 700); await tap(page, '.dlg [data-i="0"]', 400);
    ok(`${tag} confirmed: content is back to the original and a toast offers Hoàn tác`, await page.evaluate(() => !window.__SE.st.ov['lace-top']) && /Hoàn tác/.test(await page.textContent('#toast')));
    await tap(page, '[data-act=toastact]', 400);
    ok(`${tag} Hoàn tác restores her edits and her opening line`, await page.evaluate(() => window.__SE.st.ov['lace-top'].price === 399000 && window.__SE.st.lead.custom.length === 1));
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';')); await page.context().close();
  }
}

async function goStageBack(page) { await page.evaluate(() => document.querySelector('#stseg [data-v=greet]').click()); await W(page, 150); await stage(page, 'size'); }

{   // ===== Dynamic Type: scale 1.3 and 1.41 (#ts=...) =====
  for (const ts of [1.3, 1.41]) for (const dark of [false, true]) {
    const tag = `text x${ts} ${dark ? 'dark' : 'light'}`;
    const { page, errors } = await open({ w: 393, h: 852, dark, hash: '#ts=' + ts, storage: seed([LT, { pid: 'lace-skirt-cream', size: 'M', qty: 1 }], { set: { lang: 'vi', fee: 25000, bank: { name: 'VCB', no: '0123456789', holder: 'A' } } }) });
    const audit = () => page.evaluate(() => {
      const bad = [], vw = innerWidth;
      document.querySelectorAll('.tab:not([hidden]) *, #fbar *, #odock *').forEach(e => {
        if (!e.offsetParent && getComputedStyle(e).position !== 'fixed') return;
        const r = e.getBoundingClientRect(); if (!r.width) return;
        if (r.right > vw + 1 || r.left < -1) bad.push('outside ' + (e.className || e.tagName) + ' ' + Math.round(r.left) + '..' + Math.round(r.right));
        if (e.matches('.btn, .seg button, .txtbtn, .fb, .rbtn, .sg, .tile, .ctxbar') && e.scrollWidth > e.clientWidth + 2) bad.push('clipped ' + (e.className || e.tagName) + ' ' + e.textContent.trim().slice(0, 24) + ' ' + e.scrollWidth + '>' + e.clientWidth);
      });
      return { bad: bad.slice(0, 6), ow: document.documentElement.scrollWidth > vw };
    });
    const sc = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ts').trim());
    ok(`${tag} --ts is ${ts}`, +sc === ts, sc);
    let r = await audit(); ok(`${tag} Home: no overflow, no clipped control`, !r.ow && !r.bad.length, JSON.stringify(r));
    await page.evaluate(() => document.querySelector('#fbar [data-v=qr]').click()); await W(page, 250);
    for (const id of ['greet', 'size', 'info', 'order', 'out']) {
      await stage(page, id); await W(page, 200);
      r = await audit();
      if (id === 'order') {
        const d = await page.evaluate(() => { const dk = document.querySelector('#odock').getBoundingClientRect(), cp = document.querySelector('.capsule').getBoundingClientRect(), bt = document.querySelector('#odock .btn').getBoundingClientRect(), tv = document.querySelector('#odock .tv').getBoundingClientRect(); document.querySelector('#qr').scrollTop = 99999; const last = [...document.querySelectorAll('#stage .ostage > *')].filter(x => x.offsetHeight > 0).pop(); return { dockBottom: dk.bottom, capTop: cp.top, noOverlap: (() => { const l = document.querySelector('#odock .dl2').getBoundingClientRect(); return l.bottom <= bt.top + 1 || l.right <= bt.left + 1; })(), btnInside: bt.left >= dk.left - 1 && bt.right <= dk.right + 1 && bt.bottom <= dk.bottom + 1, tvInside: tv.right <= dk.right + 1 && tv.left >= dk.left - 1, lastBottom: last.getBoundingClientRect().bottom, dockTop: dk.top }; });
        ok(`${tag} Tạo đơn: dock never overflows (button and total inside it), dock above the capsule, last element above the dock at max scroll`, d.noOverlap && d.btnInside && d.tvInside && d.dockBottom <= d.capTop + 1 && d.lastBottom <= d.dockTop + 1, JSON.stringify(d));
        await page.screenshot({ path: `/tmp/se-r7-ts${ts}-${dark ? 'dark' : 'light'}-order.png` }).catch(() => {});
      }
      ok(`${tag} ${id}: no horizontal overflow, no clipped control or label`, !r.ow && !r.bad.length, JSON.stringify(r));
      if (id === 'greet') await page.screenshot({ path: `/tmp/se-r7-ts${ts}-${dark ? 'dark' : 'light'}-greet.png` }).catch(() => {});
    }
    await stage(page, 'size');
    const tabs = await page.evaluate(() => [...document.querySelectorAll('.sg')].map(b => { const br = b.getBoundingClientRect(); return [...b.querySelectorAll('span')].every(s => { const r = s.getBoundingClientRect(); return r.left >= br.left - 1 && r.right <= br.right + 1; }) && b.scrollHeight <= b.clientHeight + 1; }));
    const nav = await page.evaluate(() => [...document.querySelectorAll('.fb')].map(b => { const br = b.getBoundingClientRect(), s = b.querySelector('span'), r = s.getBoundingClientRect(); return r.left >= br.left - 1 && r.right <= br.right + 1; }));
    ok(`${tag} step tabs wrap/shrink inside their cells and the nav labels stay inside the capsule`, tabs.every(Boolean) && nav.every(Boolean), JSON.stringify({ tabs, nav }));
    const ov = await page.evaluate(() => { const bad = []; document.querySelectorAll('#stage .mcard').forEach(c => { const kids = [...c.children].filter(k => k.offsetHeight > 0).map(k => k.getBoundingClientRect()); for (let i = 1; i < kids.length; i++) if (kids[i].top < kids[i - 1].bottom - 1) bad.push(c.dataset.card + ' ' + i); }); return bad; });
    ok(`${tag} cards: stacked parts never overlap (no colliding lines)`, !ov.length, JSON.stringify(ov));
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';')); await page.context().close();
  }
}

await b.close(); srv.close();
const f = R.filter(r => !r[1]); console.log(`\n${R.length - f.length}/${R.length} passed`); process.exit(f.length ? 1 : 0);
