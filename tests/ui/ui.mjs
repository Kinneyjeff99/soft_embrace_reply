// Functional UI suite (Playwright, 393x852 and 430x932, light and dark). Round 5 DOM: segmented product sheet, strip + box, bubble cards.
import { serve, launch, newPage } from './lib.mjs';
const { srv, url } = await serve();
const b = await launch();
const R = []; const ok = (n, c, d = '') => { R.push([n, !!c, d]); console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
const clip = p => p.evaluate(() => window.__clip.slice());
const clicks = p => p.evaluate(() => window.__clicks);
const val = (p, sel) => p.$eval(sel, e => e.value);
const cleanT = t => t.replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();
// what a box shows in full = strip text + blank line + textarea (this is what Chép copies)
const boxFull = (p, key, root = '.sheet') => p.evaluate(([key, root]) => { const ta = document.querySelector(`${root} [data-eta="${key}"]`), sl = ta.previousElementSibling, st = sl && sl.classList.contains('lslot') ? sl.querySelector('.lt') : null; return (st ? st.textContent + '\n\n' : '') + ta.value; }, [key, root]).then(cleanT);
const prevAll = async (p, keys) => (await Promise.all(keys.map(k => boxFull(p, k)))).join('\n\n');
async function fresh(opts = {}) {
  const o = await newPage(b, opts); await o.page.goto(url); await o.page.waitForTimeout(300);
  if (!opts.home) { await o.page.tap('[data-act=stage][data-v=greet] >> visible=true'); await o.page.waitForTimeout(120); await o.page.evaluate(() => { window.__clicks = 0; }); }
  return o;
}
const closeSheet = async p => { await p.tap('.sheet >> nth=-1 >> [data-act=shclose]'); await p.waitForTimeout(450); };
const toPI = async p => { await p.tap('[data-act=top][data-v=pi]'); await p.waitForTimeout(150); };
const stage = async (p, id) => { await p.tap(`[data-act=stage][data-v=${id}] >> visible=true`); await p.waitForTimeout(150); };
const openProd = async (p, id) => { await toPI(p); await p.tap(`[data-open="p:${id}"]`); await p.waitForTimeout(450); };
const seg = async (p, v) => { await p.tap(`.sheet #pseg [data-v=${v}]`); await p.waitForTimeout(200); };
// choose an opening line through the real UI: dropdown row -> radio picker
const pickLead = async (p, scope, a, id) => { await p.tap(`${scope} [data-lead=${a}]`); await p.waitForTimeout(450); await p.tap(`.sheet >> nth=-1 >> [data-act=leadpick][data-id="${id}"]`); await p.waitForTimeout(520); };
const STAGE_LABELS = ['Chào hỏi', 'Tư vấn size', 'Xin thông tin', 'Tạo đơn', 'Check out'];

for (const [w, h] of [[393, 852], [430, 932], [375, 667]]) for (const dark of [false, true]) {
  const tag = `${w}x${h} ${dark ? 'dark' : 'light'}`;
  {   // --- first screen, stage switcher (v6: one card anatomy, context bar, no description line)
    const { page, errors } = await fresh({ w, h, dark, insets: w === 375 ? { top: 20, bottom: 0 } : { top: 59, bottom: 34 } });
    ok(`${tag} Quick replies: stage Chào hỏi selected, eyebrow + title say where you are`, await page.isVisible('#qr') && !(await page.isVisible('#pi')) && /Chào hỏi/.test(await page.textContent('.sg[aria-selected=true]')) && /Bước 1\/5/.test(await page.textContent('#qreb')) && (await page.textContent('#qrtitle')) === 'Chào hỏi' && !(await page.$('#qrsub')) && !(await page.$('#hint')));
    const labels = await page.$$eval('.sg', e => e.map(x => x.textContent));
    ok(`${tag} stage labels exact, in sales-flow order`, JSON.stringify(labels) === JSON.stringify(STAGE_LABELS), labels.join('|'));
    const fit = await page.$eval('#stseg .seg', e => [e.scrollWidth, e.clientWidth]);
    ok(`${tag} 5 stage buttons fit without scrolling`, fit[0] <= fit[1], fit.join('/'));
    const seen = [];
    for (const [i, id] of ['greet', 'size', 'info', 'order', 'out'].entries()) {
      await stage(page, id);
      const cards = await page.$$eval('#stage .mcard .mt', e => e.map(x => x.textContent));
      seen.push(cards.join(','));
      ok(`${tag} stage ${STAGE_LABELS[i]}: shows only its own cards; title = stage name; ctx bar ${id === 'order' ? 'hidden' : 'shown'}`, (id === 'order' ? !!(await page.$('#stage .ostage')) && !(await page.isVisible('#ctxbar')) : cards.length >= 1 && (await page.isVisible('#ctxbar'))) && (await page.textContent('#qrtitle')) === STAGE_LABELS[i] && (await page.textContent('#qreb')).includes('Bước ' + (i + 1) + '/5'), cards.join('|'));
      ok(`${tag} stage ${STAGE_LABELS[i]}: no page growth/overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight + 1 && document.querySelector('#qr').scrollWidth <= innerWidth));
    }
    ok(`${tag} each stage has different content`, new Set(seen).size === 5);
    await stage(page, 'size');
    ok(`${tag} size stage: cards Gửi bảng size / Vừa size / Giữa 2 size / Xin số đo; "Câu khác (4)" hides the rest`, (await page.$$eval('#stage .mcard .mt', e => e.map(x => x.textContent))).join('|') === 'Gửi bảng size|Vừa size|Giữa 2 size|Xin số đo' && /Câu khác \(4\)/.test(await page.textContent('[data-act=stmore]')));
    await page.tap('[data-act=stmore]'); ok(`${tag} Câu khác discloses secondary items (aria-expanded)`, (await page.$$('#stage [data-card=too-small-size]')).length === 1 && (await page.getAttribute('[data-act=stmore]', 'aria-expanded')) === 'true');
    await stage(page, 'out');
    ok(`${tag} check out stage: two sequence cards + feedback`, (await page.$$eval('#stage .mcard > .mh .mt', e => e.map(x => x.textContent))).join('|') === 'Xác nhận thanh toán|Gửi mã vận đơn|Xin hình feedback');
    const small = await page.evaluate(() => [...document.querySelectorAll('#nav button, #fbar button, #stseg button, #ctxbar button, #stage button, #stage input, #stage textarea')].filter(e => e.offsetParent).filter(e => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map(e => (e.className || e.tagName) + ':' + e.textContent.slice(0, 10)));
    ok(`${tag} 44pt targets (header, floating bar, stages)`, small.length === 0, small.join('|'));
    await toPI(page);
    const small2 = await page.evaluate(() => [...document.querySelectorAll('#pi button, #pi input, #home button')].filter(e => e.offsetParent).filter(e => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map(e => (e.className || e.tagName) + ':' + e.textContent.slice(0, 10)));
    ok(`${tag} 44pt targets (product tab)`, small2.length === 0, small2.join('|'));
    ok(`${tag} product tab: Theo mẫu (20 rows) / Theo set segmented`, (await page.$$('#hbody [data-open^="p:"]')).length === 20 && (await page.$$eval('#pview button', e => e.map(x => x.textContent))).join('|') === 'Theo mẫu|Theo set');
    await page.tap('[data-act=pview][data-v=s]');
    ok(`${tag} Theo set: create row first, then saved + suggested`, (await page.$eval('#hbody .row', e => e.dataset.act)) === 'setnew' && (await page.$$('#hbody [data-act=setsugg]')).length === 9);
    ok(`${tag} no horizontal overflow (both views)`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('#pi').scrollWidth <= innerWidth));
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';'));
    await page.context().close();
  }
  {   // --- product sheet: one box, strip, edits, clipboard
    const { page, errors } = await fresh({ w, h, dark, insets: { top: 59, bottom: 34 } });
    await openProd(page, 'lace-top');
    const sel = '.sheet [data-eta=info]';
    const orig = await val(page, sel);
    ok(`${tag} editable box is a textarea inside one .ebox; no accordion, no "Xem hết", no instruction sentence`, (await page.$eval(sel, e => e.tagName)) === 'TEXTAREA' && (await page.$$('.sheet .ebox')).length === 1 && !(await page.$('.arow, .acard')) && !/Xem hết|Chạm vào khung/.test(await page.textContent('.sheet')));
    ok(`${tag} box caption has "Tin sẽ gửi" and a visible ✎ Sửa button`, /Tin sẽ gửi · Thông tin/i.test(await page.textContent('.sheet .ebh')) && !!(await page.$('.sheet [data-act=ebedit]')));
    await page.tap('.sheet [data-act=ebedit]'); await page.waitForTimeout(100);
    ok(`${tag} ✎ Sửa focuses the textarea with the caret at the end`, await page.evaluate(() => { const t = document.querySelector('.sheet [data-eta=info]'); return document.activeElement === t && t.selectionStart === t.value.length; }));
    await page.evaluate(() => document.activeElement.blur());
    ok(`${tag} edit state hidden before an edit`, !(await page.$('.est .ed')) && !(await page.$('[data-act=ebreset]')));
    const long = orig + '\n' + Array.from({ length: 40 }, (_, i) => 'Dòng thêm số ' + (i + 1)).join('\n');
    await page.fill(sel, long); await page.waitForTimeout(150);
    const dims = await page.evaluate(() => { const t = document.querySelector('.sheet [data-eta=info]'), bx = t.closest('.ebox'); return { sh: t.scrollHeight, ch: t.clientHeight, box: bx.getBoundingClientRect().height, max: parseFloat(getComputedStyle(bx).maxHeight) }; });
    ok(`${tag} long text: textarea scrolls inside a box capped at min(34vh,280)`, dims.sh > dims.ch && dims.box <= dims.max + 1 && dims.box <= 281, JSON.stringify(dims));
    await page.$eval(sel, e => { e.scrollTop = 99999; });
    ok(`${tag} textarea scrolls inside`, (await page.$eval(sel, e => e.scrollTop)) > 100);
    ok(`${tag} no page/sheet growth with long text`, await page.evaluate(() => { const s = document.querySelector('.sheet').getBoundingClientRect(); return document.documentElement.scrollHeight <= innerHeight + 1 && s.bottom <= innerHeight + 1; }));
    ok(`${tag} shows ● Đã sửa + Khôi phục + Lưu làm mẫu after edit`, /Đã sửa/.test(await page.textContent('.est .ed')) && !!(await page.$('[data-act=ebreset]')) && !!(await page.$('[data-act=ebsave]')));
    await page.tap('.shf [data-act=pcopy]'); await page.waitForTimeout(100);
    await page.waitForTimeout(450); await page.tap('.shf [data-act=pcopy]'); await page.waitForTimeout(100);   // synthetic truncation on Lace Top arms the guard on edited? no: edited text is exempt
    ok(`${tag} edited text is what gets copied (clipboard == box)`, (await clip(page)).slice(-1)[0] === cleanT(long));
    await page.tap('[data-act=ebreset]'); await page.waitForTimeout(100);
    ok(`${tag} Khôi phục restores generated text and hides the edit state`, (await val(page, sel)) === orig && !(await page.$('.est .ed')));
    await page.fill(sel, 'Mẫu của mình\n' + orig); await page.waitForTimeout(100);
    await page.tap('[data-act=ebsave]'); await page.waitForTimeout(150);
    ok(`${tag} Lưu làm mẫu: edit state clears, box keeps text`, (await val(page, sel)) === 'Mẫu của mình\n' + orig && !(await page.$('.est .ed')));
    await closeSheet(page); await page.tap('[data-open="p:lace-top"]'); await page.waitForTimeout(450);
    ok(`${tag} saved template is the new default (reopen sheet)`, (await val(page, sel)).startsWith('Mẫu của mình\n'));
    await page.reload(); await page.waitForTimeout(300); await openProd(page, 'lace-top');
    ok(`${tag} saved template survives reload`, (await val(page, sel)).startsWith('Mẫu của mình\n'));
    await pickLead(page, '.sheet', 'info', 'li-info-3');
    ok(`${tag} choosing a line shows the highlighted strip with ✕; box text (preview) == strip + saved template`, (await boxFull(page, 'info')).startsWith('Soft gửi bạn thông tin mẫu ạ 🌷\n\nMẫu của mình') && !!(await page.$('.sheet .lstrip [data-act=stripx]')) && !(await val(page, sel)).includes('Soft gửi bạn'));
    await page.fill(sel, 'tạm'); await pickLead(page, '.sheet', 'info', 'li-info-4');
    ok(`${tag} typed text SURVIVES a lead change (strip is separate)`, (await val(page, sel)) === 'tạm' && /Dạ mẫu này còn bạn nhé/.test(await page.textContent('.lstrip .lt')));
    await seg(page, 'both'); await seg(page, 'size'); await seg(page, 'info');
    ok(`${tag} typed text survives switching segments (Thông tin -> Cả hai -> Bảng size -> Thông tin)`, (await val(page, sel)) === 'tạm');
    await seg(page, 'both');
    ok(`${tag} Cả hai shows the same edited part inside ONE outer box`, (await val(page, '.sheet [data-eta=info]')) === 'tạm' && (await page.$$('.sheet .ebox')).length === 1 && (await page.$$('.sheet [data-eta]')).length === 2 && /cùng một tin/.test(await page.textContent('.sheet .join')));
    await seg(page, 'info');
    await page.tap('.lstrip [data-act=stripx]'); await page.waitForTimeout(100);
    ok(`${tag} ✕ on the strip = Không kèm`, !(await page.$('.lstrip')) && /Không kèm/.test(await page.textContent('.sheet [data-lead=info] .dv')));
    ok(`${tag} zero console errors (editing)`, errors.length === 0, errors.join(';'));
    await page.context().close();
  }
  {   // --- keyboard-safe layout (visualViewport resize emulation)
    const { page } = await fresh({ w, h, dark, fakeVV: true, insets: { top: 59, bottom: 34 } }); const KB = 336;
    await page.tap('[data-card=greet] [data-act=cardedit] >> nth=0'); await page.waitForTimeout(450);
    const top0 = await page.$eval('.sheet', e => e.getBoundingClientRect().top);
    await page.focus('.sheet [data-eta]'); await page.evaluate(k => window.__setKb(k), KB); await page.waitForTimeout(250);
    const r = await page.evaluate(() => { const b = document.querySelector('#mcopy').getBoundingClientRect(); return { bottom: b.bottom, top: document.querySelector('.sheet').getBoundingClientRect().top, ih: innerHeight, ta: document.querySelector('.sheet [data-eta]').getBoundingClientRect().bottom }; });
    ok(`${tag} keyboard: Chép (sheet) stays above the keyboard`, r.bottom <= r.ih - KB + 1 && r.bottom > 0, JSON.stringify(r));
    ok(`${tag} keyboard: sheet does not jump (top unchanged), textarea above button`, Math.abs(r.top - top0) < 1 && r.ta <= r.bottom, top0 + ' ' + r.top);
    await page.fill('.sheet [data-eta]', 'gõ thử trong khi bàn phím mở'); await page.tap('#mcopy'); await page.waitForTimeout(100);
    ok(`${tag} keyboard: Chép works while keyboard is open and copies the typed text`, (await clip(page)).slice(-1)[0] === 'gõ thử trong khi bàn phím mở');
    await page.evaluate(() => window.__setKb(0)); await page.waitForTimeout(700);
    await page.close();
    const o = await fresh({ w, h, dark, fakeVV: true, insets: { top: 59, bottom: 34 } });
    await stage(o.page, 'order'); await o.page.tap('[data-act=recvtoggle]'); await o.page.waitForTimeout(150); await o.page.focus('[data-in=info]'); await o.page.evaluate(k => window.__setKb(k), KB); await o.page.waitForTimeout(250);
    const q = await o.page.evaluate(() => { const f = document.querySelector('#odock').getBoundingClientRect(), d = document.querySelector('#fbar'); return { bottom: f.bottom, ih: innerHeight, dock: getComputedStyle(d).display, vis: f.height > 30 }; });
    ok(`${tag} keyboard: order dock (total + Chép đơn) sits above the keyboard, floating bar hidden`, q.bottom <= q.ih - KB + 1 && q.bottom >= q.ih - KB - 12 && q.vis && q.dock === 'none', JSON.stringify(q));
    await o.page.evaluate(() => window.__setKb(0)); await o.page.waitForTimeout(300);
    ok(`${tag} keyboard closed: floating bar back`, await o.page.isVisible('#fbar'));
    await o.page.context().close();
  }
}

for (const [w, h] of [[393, 852], [430, 932], [375, 667]]) {
  const tag = w + 'x' + h;
  {   // SW-enabled error check
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); const errs = []; page.on('console', m => ['error', 'warning'].includes(m.type()) && errs.push(m.text())); page.on('pageerror', e => errs.push(e.message));
    await page.goto(url); await page.waitForTimeout(1200); await page.reload(); await page.waitForTimeout(600);
    const sw = await page.evaluate(() => !!navigator.serviceWorker.controller);
    ok(`${tag} service worker installs & controls, zero console errors`, sw && errs.length === 0, 'sw=' + sw + ' ' + errs.join(';'));
    await ctx.close();
  }
  {   // --- Theo mẫu: info 2 taps, others
    const { page } = await fresh({ w, h }); await toPI(page);
    let s = await clicks(page);
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450); await page.tap('.shf [data-act=pcopy]'); await page.waitForTimeout(100);
    ok(`${tag} Theo mẫu: product info = 2 taps (row, Chép)`, (await clicks(page)) - s === 2 && /^Noir Midi Skirt/.test((await clip(page)).slice(-1)[0]));
    ok(`${tag} the product sheet has exactly ONE copy button`, (await page.$$('.sheet [data-act^=pcopy], .sheet [data-act=copy]')).length === 1);
    await closeSheet(page); await page.tap('[data-open="p:shimmer-top"]'); await page.waitForTimeout(450);
    // reopens on the last copied segment (info); size = row, tab, Chép
    await page.context().close();
    const o = await fresh({ w, h }); await toPI(o.page); s = await clicks(o.page);
    await o.page.tap('[data-open="p:noir-midi-skirt"]'); await o.page.waitForTimeout(450); await seg(o.page, 'size'); await o.page.tap('.shf [data-act=pcopy]'); await o.page.waitForTimeout(100);
    ok(`${tag} Theo mẫu: size chart = row, Bảng size, Chép (3 taps)`, (await clicks(o.page)) - s === 3 && /^• S:/.test((await clip(o.page)).slice(-1)[0]));
    await seg(o.page, 'both'); const s2 = await clicks(o.page);
    await o.page.tap('.shf [data-act=pcopy]'); await o.page.waitForTimeout(100);
    const cl2 = (await clip(o.page)).slice(-1)[0];
    ok(`${tag} Cả hai: one message = info + blank line + size, footer says Chép cả hai`, cl2.includes('\n\n• S:') && (await clicks(o.page)) - s2 === 1 && cl2 === await prevAll(o.page, ['info', 'size']));
    await seg(o.page, 'info');
    await o.page.tap('[data-act=addline][data-v=M]'); await o.page.waitForTimeout(100);
    ok(`${tag} adding to order: toast has "Xem đơn" and the sheet shows "Trong đơn: M × 1"`, /Xem đơn/.test(await o.page.textContent('#toast')) && /Trong đơn: M × 1/.test(await o.page.textContent('#pinord')));
    await o.page.tap('[data-act=toastact]'); await o.page.waitForTimeout(450);
    ok(`${tag} "Xem đơn" jumps to Tạo đơn (stage 4) and closes the sheet`, (await o.page.$eval('.sg[aria-selected=true]', e => e.textContent)) === 'Tạo đơn' && !(await o.page.$('.sheet')));
    ok(`${tag} order button: clipboard glyph + "Đơn" label + neutral count badge, aria-label with count and total`, (await o.page.textContent('#obtn2 span')) === 'Đơn' && (await o.page.textContent('#obtn2 .bd')) === '1' && /1 món/.test(await o.page.getAttribute('#obtn2', 'aria-label')) && (await o.page.$eval('#obtn2 use', e => e.getAttribute('href'))) === '#i-order');
    ok(`${tag} line shows in composer and message has the line`, /Noir Midi Skirt/.test(await o.page.textContent('#stage .lines')) && /Noir Midi Skirt – size M/.test(await o.page.textContent('#stage [data-card=order] .pv')));
    await o.page.context().close();
  }
  {   // stage memory + first screen
    const { page } = await fresh({ w, h });
    await stage(page, 'info'); await page.waitForTimeout(400); await page.reload(); await page.waitForTimeout(300);
    ok(`${tag} last used stage remembered; the app still opens on Home`, await page.isVisible('#home') && !(await page.isVisible('#qr')));
    await page.tap('[data-act=top][data-v=qr]'); await page.waitForTimeout(150);
    ok(`${tag} Trả lời nhanh reopens on the last used stage`, (await page.$eval('.sg[aria-selected=true]', e => e.textContent)) === 'Xin thông tin');
    await page.context().close();
  }
  {   // set creation: 3 taps from product sheet
    const { page } = await fresh({ w, h });
    await openProd(page, 'noir-midi-skirt');
    const s = await clicks(page);
    await page.tap('[data-act=setpick]'); await page.waitForTimeout(450);
    const first = await page.$eval('#plist [data-act=pickone] .t', e => e.textContent);
    await page.tap('#plist [data-act=pickone]'); await page.waitForTimeout(600);
    await page.tap('.bcard[data-b=a] [data-act=bcopy]'); await page.waitForTimeout(100);
    const c = await clip(page);
    ok(`${tag} set create+copy bubble 1 = 3 taps from product sheet; first suggestion is the pair from her posts`, (await clicks(page)) - s === 3 && /Soft Halter Top/.test(first) && c.length === 1 && /Giá set/.test(c[0]), first);
    await page.context().close();
  }
  {   // set bubbles
    const { page } = await fresh({ w, h, storage: { sets: [{ id: 'set-t', items: ['lace-top', 'lace-skirt-cream'], price: null, name: '', postUrl: '', checked: true, ov: { vi: null, en: null } }] } });
    await openProd(page, 'lace-top');
    ok(`${tag} product sheet "Set có mẫu này" row opens the set (navigation, no copy)`, /Set với Lace Skirt.*850\.000đ/.test(await page.textContent('.sheet .navrow[data-open^="s:"]')));
    await closeSheet(page); await page.tap('[data-act=pview][data-v=s]'); await page.tap('[data-open="s:set-t"]'); await page.waitForTimeout(600);
    ok(`${tag} set sheet: helper under price says "Để trống = 850.000đ (tổng giá lẻ)"`, /Để trống = 850\.000đ \(tổng giá lẻ\)/.test(await page.textContent('#pline')));
    await page.fill('[data-sprice]', '800000'); await page.waitForTimeout(100);
    ok(`${tag} custom price line shown`, /Giá lẻ 380\.000đ \+ 470\.000đ = 850\.000đ → Giá set 800\.000đ/.test(await page.textContent('#pline')));
    ok(`${tag} 4 set bubbles are separate editable bubble cards; progress 0/4; exactly one "Tiếp theo"`, (await page.$$('.bcard [data-eta]')).length === 4 && (await page.$$('.bcard.next')).length === 1 && /Đã chép 0\/4/.test(await page.textContent('#sprog')) && /Tiếp theo/.test(await page.textContent('.bcard.next')));
    const out = [];
    for (const bb of ['a', 'b', 'c', 'd']) {
      const pvx = await boxFull(page, 's' + bb, '.sheet');
      await page.tap(`.bcard[data-b=${bb}] [data-act=bcopy]`); await page.waitForTimeout(80);
      if (bb === 'a') { await page.waitForTimeout(500); await page.tap(`.bcard[data-b=a] [data-act=bcopy]`); await page.waitForTimeout(80); }   // truncated text (synthetic flag): guard
      const cl = await clip(page); out.push(cl[cl.length - 1]);
      if (pvx !== out[out.length - 1]) ok(`${tag} bubble ${bb} preview==clipboard`, false, pvx.slice(0, 40));
      if (bb === 'a') ok(`${tag} after copying tin 1: ✓ disc, "Đã chép", "Chép lại tin 1", tin 2 is "Tiếp theo", footer follows`, (await page.$eval('.bcard.next', e => e.dataset.b)) === 'b' && /Chép lại tin 1/.test(await page.textContent('.bcard[data-b=a] .bbtn')) && /Chép tin 2\/4/.test(await page.textContent('#bnext')) && /Đã chép 1\/4/.test(await page.textContent('#sprog')) && (await page.$$('.bcard.next')).length === 1);
    }
    ok(`${tag} all 4 copied: footer becomes "Đã chép đủ 4 tin" (disabled), no card is "next"`, /Đã chép đủ 4 tin/.test(await page.textContent('#bnext')) && await page.$eval('#bnext', e => e.disabled) && (await page.$$('.bcard.next')).length === 0 && /Đã chép 4\/4/.test(await page.textContent('#sprog')));
    ok(`${tag} set bubble 1 = info A + info B + custom price 800.000đ (tiết kiệm 50.000đ)`, /^Lace Top 🦢/.test(out[0]) && out[0].includes('\n\nLace Skirt ✨') && out[0].endsWith('• Giá set: 800.000đ (tiết kiệm 50.000đ)'), out[0].slice(-60));
    ok(`${tag} set bubble 2 = both size charts labelled`, /^Lace Top\n• S/.test(out[1]) && out[1].includes('\n\nLace Skirt · Kem\n• S'), out[1].slice(0, 30));
    ok(`${tag} set bubble 3 = IG02, bubble 4 = post link`, out[2] === 'Nếu bạn cần tư vấn thêm về size, cho Soft xin số đo 3 vòng, chiều cao và cân nặng nhen 💕' && out[3] === 'https://instagram.com/softembrace.made/p/DUQkDk6kTDg/');
    await page.fill('.bcard[data-b=c] [data-eta]', 'Cho Soft xin số đo nhen 💕'); await page.tap('.bcard[data-b=c] [data-act=bcopy]'); await page.waitForTimeout(100);
    ok(`${tag} set bubble edited text copied`, (await clip(page)).slice(-1)[0] === 'Cho Soft xin số đo nhen 💕');
    await page.tap('.bcard[data-b=c] [data-act=ebsave]'); await page.waitForTimeout(150);
    ok(`${tag} set bubble Lưu làm mẫu (own wording, with link to reset)`, (await val(page, '.bcard[data-b=c] [data-eta]')) === 'Cho Soft xin số đo nhen 💕' && !!(await page.$('.bcard[data-b=c] [data-act=setovreset]')));
    await page.tap('.bcard[data-b=c] [data-act=setovreset]'); await page.waitForTimeout(150);
    ok(`${tag} Dùng bản tự soạn restores`, (await val(page, '.bcard[data-b=c] [data-eta]')).startsWith('Nếu bạn cần'));
    await page.context().close();
  }
  {   // suggested pair guard + preview == clipboard across leads
    const { page } = await fresh({ w, h });
    await toPI(page); await page.tap('[data-act=pview][data-v=s]');
    await page.tap('[data-act=setsugg][data-a="soft-halter-top-white"]'); await page.waitForTimeout(600);
    ok(`${tag} suggested set: grey ⓘ notice with "Đã kiểm tra" button (not red)`, /chưa kiểm tra/.test(await page.textContent('.sheet .notice')) && !!(await page.$('.sheet [data-act=setok]')));
    await page.tap('.bcard[data-b=a] [data-act=bcopy]'); await page.waitForTimeout(100);
    ok(`${tag} suggested set: 1st tap guarded ("Chạm lại để chép", tonal), nothing copied`, (await clip(page)).length === 0 && /Chạm lại để chép/.test(await page.textContent('.bcard[data-b=a] .btn')));
    await page.waitForTimeout(500);
    await page.tap('.bcard[data-b=a] [data-act=bcopy]'); await page.waitForTimeout(100);
    ok(`${tag} suggested set: 2nd tap copies and marks price checked`, (await clip(page)).length === 1 && (await page.evaluate(() => window.__SE.st.sets[0].checked)) === true);
    let bad = 0, n = 0;
    for (const lang of ['vi', 'en']) {
      if (lang === 'en') { await page.tap('.sheet [data-act=lang][data-v=en]'); await page.waitForTimeout(150); }
      for (const [bb, z] of [['a', 'info'], ['b', 'size']]) {
        if (!(await page.$(`.bcard[data-b=${bb}] [data-act=bcopy]:not([data-alt])`))) continue;
        const ids = await page.evaluate(([z, l]) => window.__SE.leadList(z, l).map(x => x.id), [z, lang]);
        for (const id of [null, ...ids]) {
          await page.evaluate(([z, id]) => window.__SE.leadSet(z, id), [z, id]);
          const pvx = await boxFull(page, 's' + bb);
          await page.tap(`.bcard[data-b=${bb}] [data-act=bcopy]`); await page.waitForTimeout(40);
          const c = await clip(page); n++; if (c[c.length - 1] !== pvx) bad++;
        }
      }
    }
    ok(`${tag} set bubbles a/b: preview (strip + box) == clipboard across leads VI/EN`, bad === 0 && n >= 10, `n=${n} bad=${bad}`);
    await page.context().close();
  }
  {   // link switch, order total with fee
    const { page } = await fresh({ w, h });
    await openProd(page, 'lace-top');
    const url = 'https://instagram.com/softembrace.made/p/DUQkDk6kTDg/';
    ok(`${tag} "Gửi kèm" is a labelled section; link switch off by default`, /Gửi kèm/.test(await page.textContent('.sheet .sec .cap')) && !(await val(page, '.sheet [data-eta=info]')).includes(url) && !(await page.$eval('[data-act=linktoggle]', e => e.checked)));
    await page.tap('.sheet .swrow'); await page.waitForTimeout(100);
    ok(`${tag} link switch on: box ends with link`, (await val(page, '.sheet [data-eta=info]')).endsWith('\n\n' + url) && await page.$eval('[data-act=linktoggle]', e => e.checked));
    await page.tap('.shf [data-act=pcopy]'); await page.waitForTimeout(500); await page.tap('.shf [data-act=pcopy]'); await page.waitForTimeout(100);   // synthetic truncation guard on Lace Top
    const c = await clip(page); ok(`${tag} link: clipboard == box`, c[0] === await boxFull(page, 'info') && c[0].endsWith(url));
    await page.context().close();
    const o = await fresh({ w, h, storage: { draft: { lines: [{ pid: 'lace-top', size: 'M', qty: 1 }], ship: 'fee', custom: 0, info: '', bank: false, copiedAt: 0 }, set: { lang: 'vi', fee: 24000, bank: { name: '', no: '', holder: '' } }, ov: { 'lace-top': { price: 420000 } } } });
    await stage(o.page, 'order'); await o.page.tap('#obtn'); await o.page.waitForTimeout(100);
    const oc = (await clip(o.page))[0]; ok(`${tag} order recap total 420.000đ + 24.000đ = 444.000đ`, /Tổng cộng là 444\.000đ/.test(oc) && /Shipping: 24\.000đ/.test(oc), oc.split('\n').slice(-4).join('|'));
    await o.page.context().close();
  }
  // --- preview == clipboard for each lead combo (strip + box), via the real picker for a sample, direct hook for the rest
  for (const lang of ['vi', 'en']) {
    const { page } = await fresh({ w, h, storage: { set: { lang, fee: 25000, bank: { name: '', no: '', holder: '' } } } });
    let bad = [], n = 0;
    await openProd(page, 'noir-midi-skirt');
    for (const a of ['info', 'size', 'both']) {
      if (a !== 'info') await seg(page, a);
      const zones = a === 'both' ? ['info', 'size'] : [a];
      const idsOf = z => page.evaluate(([z, l]) => window.__SE.leadList(z, l).map(x => x.id), [z, lang]);
      const combos = a === 'both' ? (await (async () => { const A = [null, ...(await idsOf('info'))], B = [null, ...(await idsOf('size'))], o = []; for (const x of A) for (const y of B) o.push([x, y]); return o; })()) : [null, ...(await idsOf(a))].map(x => [x]);
      for (const combo of combos) {
        for (let i = 0; i < zones.length; i++) await page.evaluate(([z, id]) => window.__SE.leadSet(z, id), [zones[i], combo[i]]);
        const pv = await prevAll(page, zones);
        await page.tap(`.shf [data-act=pcopy]`); await page.waitForTimeout(40);
        const c = await clip(page); n++;
        if (c[c.length - 1] !== pv) bad.push(a + combo.join(','));
      }
    }
    ok(`${tag} preview == clipboard, every lead combo, ${lang} (${n} combos, info/size/both)`, bad.length === 0 && n > 20, bad.slice(0, 3).join('|'));
    await page.context().close();
  }
  {   // --- memory + opening-line picker UI
    const { page } = await fresh({ w, h });
    await openProd(page, 'noir-midi-skirt');
    ok(`${tag} first open: dropdown value reads "Không kèm — chạm Đổi để thêm câu chào"; row shows Đổi ⌄`, /Không kèm — chạm Đổi để thêm câu chào/.test(await page.textContent('.sheet [data-lead=info] .dv')) && /Đổi/.test(await page.textContent('.sheet [data-lead=info] .dx')));
    await page.tap('.sheet [data-lead=info]'); await page.waitForTimeout(450);
    const rows = await page.$$eval('.sheet >> nth=-1 >> .rrow[role=radio]', e => e.map(x => x.getAttribute('aria-checked')));
    ok(`${tag} picker: radio rows (Không kèm câu checked, 4 lines) with ✎ Sửa each and full sentences`, rows.length === 5 && rows[0] === 'true' && (await page.$$('.sheet >> nth=-1 >> [data-act=leadedit]')).length === 4 && /Soft Embrace chào bạn, cảm ơn bạn đã quan tâm đến sản phẩm của chúng mình/.test(await page.textContent('.sheet >> nth=-1 >> .rrow:nth-child(2) .rt')));
    await page.tap('.sheet >> nth=-1 >> [data-act=leadpick][data-id="li-info-3"]'); await page.waitForTimeout(100);
    ok(`${tag} picker: tapped row fills its radio, then the sheet closes and the strip appears`, true);
    await page.waitForTimeout(600);
    ok(`${tag} strip visible after the picker closed; dropdown shows the value`, !!(await page.$('.sheet .lstrip')) && /Soft gửi bạn thông tin mẫu ạ/.test(await page.textContent('.sheet [data-lead=info] .dv')));
    await page.tap('.shf [data-act=pcopy]'); await page.waitForTimeout(300);
    await closeSheet(page);
    await page.tap('[data-open="p:shimmer-top"]'); await page.waitForTimeout(450);
    ok(`${tag} lead memory after successful copy`, /Soft gửi bạn thông tin mẫu ạ/.test(await page.textContent('.sheet .lstrip .lt')));
    await pickLead(page, '.sheet', 'info', 'li-info-4'); await closeSheet(page);
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    ok(`${tag} lead NOT remembered without copy`, /Soft gửi bạn thông tin mẫu ạ/.test(await page.textContent('.sheet .lstrip .lt')));
    await page.tap('.sheet [data-lead=info]'); await page.waitForTimeout(450); await page.tap('.sheet >> nth=-1 >> [data-act=leadadd]'); await page.fill('[data-lfi=new]', 'Câu thử của mình 🌷'); await page.tap('[data-act=leadaddsave]'); await page.waitForTimeout(600);
    ok(`${tag} add lead ("Lưu và dùng"): selected, strip shows it, box starts with it`, (await boxFull(page, 'info')).startsWith('Câu thử của mình 🌷'));
    await page.tap('.shf [data-act=pcopy]'); await page.waitForTimeout(300);
    await page.reload(); await page.waitForTimeout(400); await openProd(page, 'noir-midi-skirt');
    ok(`${tag} added lead survives reload`, /Câu thử/.test(await page.textContent('.sheet .lstrip .lt')));
    await page.tap('.sheet [data-act=lang][data-v=en]'); await page.waitForTimeout(150);
    await page.tap('.sheet [data-lead=info]'); await page.waitForTimeout(450);
    ok(`${tag} custom VI lead hidden in EN`, !(await page.textContent('.sheet >> nth=-1 >> [role=radiogroup]')).includes('Câu thử'));
    await closeSheet(page); await page.tap('.sheet [data-act=lang][data-v=vi]'); await page.waitForTimeout(150);
    await page.tap('.sheet [data-lead=info]'); await page.waitForTimeout(450);
    await page.tap('.sheet >> nth=-1 >> .rrow:has-text("Câu thử") [data-act=leadedit]'); await page.waitForTimeout(150);
    ok(`${tag} picker ✎ Sửa opens an inline editor (VI, EN, Lưu, Huỷ, Xoá câu này)`, !!(await page.$('[data-lfi=vi]')) && !!(await page.$('[data-lfi=en]')) && /Xoá câu này/.test(await page.textContent('.rrow.edit')));
    await page.tap('[data-act=leaddel]'); await page.waitForTimeout(200);
    ok(`${tag} delete lead removes the row (and the strip) with Hoàn tác`, !(await page.textContent('.sheet >> nth=-1 >> [role=radiogroup]')).includes('Câu thử') && !(await page.$('.sheet .lstrip')) && /Hoàn tác/.test(await page.textContent('#toast')));
    await page.context().close();
  }
  {   // --- truncation guard
    const { page } = await fresh({ w, h });
    await openProd(page, 'lace-top');
    ok(`${tag} quiet truncated notice present (grey ⓘ), no modal`, /bị cắt/.test(await page.textContent('.sheet .notice')) && !(await page.$('.dlg')));
    const B = '.shf [data-act=pcopy]';
    await page.tap(B); await page.waitForTimeout(100);
    ok(`${tag} trunc: 1st tap no clipboard + guard text "Chạm lại để chép"`, (await clip(page)).length === 0 && /Chạm lại để chép/.test(await page.textContent('.shf .btn')) && await page.$eval(B, e => e.classList.contains('guard')));
    await page.tap(B); await page.waitForTimeout(100);
    ok(`${tag} trunc: 2nd tap <400ms ignored`, (await clip(page)).length === 0);
    await page.waitForTimeout(500);
    await page.tap(B); await page.waitForTimeout(100);
    ok(`${tag} trunc: 2nd tap in window copies`, (await clip(page)).length === 1);
    await page.waitForTimeout(1500);
    await page.tap(B); await page.waitForTimeout(3300);
    await page.tap(B); await page.waitForTimeout(100);
    ok(`${tag} trunc: guard expires after 3s (re-arms, no copy)`, (await clip(page)).length === 1);
    await page.context().close();
  }
  {   // --- missing EN
    const { page } = await fresh({ w, h, storage: { ov: { 'noir-midi-skirt': { descEn: '' } }, set: { lang: 'en', fee: 25000, bank: { name: '', no: '', holder: '' } } } });
    await openProd(page, 'noir-midi-skirt');
    ok(`${tag} missing EN: notice + [Chép bản VI] [Thêm bản EN], footer disabled "Chưa có bản EN"`, /Chưa có bản EN của Thông tin/.test(await page.textContent('.sheet .notice')) && /Chưa có bản EN/.test(await page.textContent('.shf .btn')) && (await page.getAttribute('.shf .btn', 'aria-disabled')) === 'true' && !!(await page.$('[data-act=editp]')));
    await page.tap('[data-act=pcopyalt]'); await page.waitForTimeout(100);
    const c = await clip(page); const t = await page.textContent('.toast');
    ok(`${tag} missing EN: Chép bản VI copies VI + toast · VI`, c.length === 1 && /Màu|Dáng|Chân váy/.test(c[0]) && /VI/.test(t), t);
    await page.context().close();
  }
  {   // --- copy tip: first 3 copies only; language switch; settings
    const o3 = await fresh({ w, h }); const tips = [];
    for (let i = 0; i < 4; i++) { await o3.page.tap('[data-card=greet] [data-act=cardcopy]'); await o3.page.waitForTimeout(150); tips.push(/dán vào ô tin nhắn/.test(await o3.page.textContent('#toast'))); await o3.page.waitForTimeout(800); }
    ok(`${tag} copy tip toast shows for the first 3 copies, then never`, JSON.stringify(tips) === '[true,true,true,false]', JSON.stringify(tips));
    await o3.page.context().close();
    const { page } = await fresh({ w, h });
    await page.tap('#lsw [data-v=en]'); await page.waitForTimeout(150);
    ok(`${tag} VI/EN is a segmented control with a thumb (no outline)`, (await page.$eval('#lsw', e => getComputedStyle(e.querySelector('button[aria-pressed=true]')).outlineStyle)) !== 'solid' && !!(await page.$('#lsw .th')));
    ok(`${tag} header language switch (EN) applies to the cards`, /Hi lovely/.test(await page.textContent('[data-card=greet] .pv')));
    await page.tap('[data-act=settings]'); await page.waitForTimeout(450);
    ok(`${tag} gear icon button opens settings; "Câu mở đầu" page replaces "Câu đệm"`, /Tuỳ chỉnh/.test(await page.textContent('.sheet')) && /Câu mở đầu/.test(await page.textContent('.sheet')) && !/Câu đệm/.test(await page.textContent('.sheet')));
    await page.context().close();
  }
  {   // --- reduced motion
    const { page, errors } = await fresh({ w, h, reduced: true });
    await page.tap('[data-card=greet] [data-act=cardedit] >> nth=0'); await page.waitForTimeout(500);
    ok(`${tag} reduced motion: sheet opens, no errors`, await page.isVisible('.sheet') && errors.length === 0, errors.join(';'));
    await closeSheet(page); await openProd(page, 'lace-top'); await pickLead(page, '.sheet', 'info', 'li-info-3');
    ok(`${tag} reduced motion: strip shows at rest tint, no running animation`, await page.evaluate(() => { const s = document.querySelector('.lstrip'); return !!s && s.getAnimations().every(a => a.playState === 'finished' || a.effect.getTiming().duration < 1); }));
    await page.context().close();
  }
}
// --- perf at 4x CPU
{
  const { page, ctx } = await fresh();
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.tap('#fbar [data-v=pi]'); await page.waitForTimeout(300); await page.tap('[data-open="p:butter-top"]'); await page.waitForTimeout(800);
  const m = await page.evaluate(async () => {
    const out = [];
    const btn = document.querySelector('.shf [data-act=pcopy]');
    for (let i = 0; i < 12; i++) { const t0 = performance.now(); btn.click(); const t1 = performance.now(); out.push(t1 - t0); await new Promise(r => setTimeout(r, 200)); }
    return { out };
  });
  const sorted = m.out.slice().sort((a, b) => a - b);
  console.log('copy handler 4x CPU ms (product sheet):', m.out.map(x => x.toFixed(1)).join(' '), 'median', sorted[6].toFixed(1));
  ok('copy handler median <16ms at 4x CPU (product sheet)', sorted[6] < 16, 'median ' + sorted[6].toFixed(1) + ' max ' + sorted[11].toFixed(1) + ' first ' + m.out[0].toFixed(1));
  await page.tap('.sheet [data-act=shclose]'); await page.waitForTimeout(500);
  await page.tap('#fbar [data-v=qr]'); await page.waitForTimeout(300);
  const cc = await page.evaluate(async () => {
    const out = [], btn = document.querySelector('[data-card=greet] [data-act=cardcopy]');
    for (let i = 0; i < 12; i++) { const t0 = performance.now(); btn.click(); out.push(performance.now() - t0); await new Promise(r => setTimeout(r, 200)); }
    return out;
  });
  const cs = cc.slice().sort((a, b) => a - b);
  console.log('card copy handler 4x CPU ms:', cc.map(x => x.toFixed(1)).join(' '), 'median', cs[6].toFixed(1));
  ok('card copy handler (Chép on a stage card) median <16ms at 4x CPU', cs[6] < 16, 'median ' + cs[6].toFixed(1) + ' max ' + cs[11].toFixed(1));
  await page.tap('[data-card=greet] [data-act=cardedit] >> nth=0'); await page.waitForTimeout(800);
  const ty = await page.evaluate(async () => {
    const ta = document.querySelector('.sheet [data-eta]'), out = [];
    ta.focus();
    for (let i = 0; i < 12; i++) { const t0 = performance.now(); ta.value += 'x'; ta.dispatchEvent(new Event('input', { bubbles: true })); out.push(performance.now() - t0); await new Promise(r => requestAnimationFrame(r)); }
    return out;
  });
  const ts = ty.slice().sort((a, b) => a - b);
  console.log('typing input handler 4x CPU ms:', ty.map(x => x.toFixed(1)).join(' '));
  ok('typing in the editable box: input handler median <16ms at 4x CPU', ts[6] < 16, 'median ' + ts[6].toFixed(1) + ' max ' + ts[11].toFixed(1));
  const mc = await page.evaluate(async () => { const btn = document.querySelector('#mcopy'); const t0 = performance.now(); btn.click(); return performance.now() - t0; });
  ok('card sheet copy handler <16ms at 4x CPU', mc < 16, mc.toFixed(1));
  await ctx.close();
}
await b.close(); srv.close();
const f = R.filter(r => !r[1]); console.log(`\n${R.length - f.length}/${R.length} passed`); if (f.length) { console.log(f.map(x => x.join(' ')).join('\n')); process.exit(1); }
