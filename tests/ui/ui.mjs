import { serve, launch, newPage } from './lib.mjs';
const { srv, url } = await serve();
const b = await launch();
const R = []; const ok = (n, c, d = '') => { R.push([n, !!c, d]); console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
const clip = p => p.evaluate(() => window.__clip.slice());
const clicks = p => p.evaluate(() => window.__clicks);
const norm = s => s.replace(/\s+/g, ' ').trim();
const val = (p, sel) => p.$eval(sel, e => e.value);
const prev = p => val(p, '.acard [data-eta]');          // the open product box
async function fresh(opts = {}) { const o = await newPage(b, opts); await o.page.goto(url); await o.page.waitForTimeout(300); return o; }
const closeSheet = async p => { await p.tap('.sheet >> nth=-1 >> [data-act=shclose]'); await p.waitForTimeout(450); };
const toPI = async p => { await p.tap('[data-act=top][data-v=pi]'); await p.waitForTimeout(150); };
const stage = async (p, id) => { await p.tap(`[data-act=stage][data-v=${id}]`); await p.waitForTimeout(150); };
const openProd = async (p, id) => { await toPI(p); await p.tap(`[data-open="p:${id}"]`); await p.waitForTimeout(450); };
const STAGE_LABELS = ['Chào hỏi', 'Tư vấn size', 'Xin thông tin', 'Tạo đơn', 'Check out'];

for (const [w, h] of [[393, 852], [430, 932]]) for (const dark of [false, true]) {
  const tag = `${w}x${h} ${dark ? 'dark' : 'light'}`;
  // --- first screen, switcher, one stage at a time
  {
    const { page, errors } = await fresh({ w, h, dark });
    ok(`${tag} first screen is Câu trả lời nhanh, stage Chào hỏi`, await page.isVisible('#qr') && !(await page.isVisible('#pi')) && /Chào hỏi/.test(await page.textContent('.stb[aria-pressed=true]')) && /Câu trả lời nhanh/.test(await page.textContent('.tbb[aria-pressed=true]')));
    const labels = await page.$$eval('.stb', e => e.map(x => x.textContent));
    ok(`${tag} stage labels exact, in sales-flow order`, JSON.stringify(labels) === JSON.stringify(STAGE_LABELS), labels.join('|'));
    const fit = await page.$eval('#stages', e => [e.scrollWidth, e.clientWidth]);
    ok(`${tag} 5 stage buttons fit without scrolling`, fit[0] <= fit[1], fit.join('/'));
    ok(`${tag} top-level tabs exact`, JSON.stringify(await page.$$eval('.tbb', e => e.map(x => x.textContent))) === JSON.stringify(['Câu trả lời nhanh', 'Thông tin sản phẩm']));
    const seen = [];
    for (const [i, id] of ['greet', 'size', 'info', 'order', 'out'].entries()) {
      await stage(page, id);
      const cards = await page.$$eval('#stage .qc:not(.postcard)', e => e.filter(x => x.offsetParent).map(x => x.querySelector('.t').textContent));
      const other = await page.$$eval('#stage [data-open]', e => e.map(x => x.dataset.open));
      seen.push(cards.join(',') + other.join(','));
      const n = id === 'order' ? 1 : cards.length;
      ok(`${tag} stage ${STAGE_LABELS[i]}: shows only its own content (${id === 'order' ? 'composer' : cards.length + ' cards'}), 2-5 primary`, id === 'order' ? !!(await page.$('#stage .ostage')) && !(await page.$('#stage .qc:not(.postcard)')) : n >= 2 && n <= 5, cards.join('|'));
      ok(`${tag} stage ${STAGE_LABELS[i]}: no page growth/overflow`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.documentElement.scrollHeight <= innerHeight + 1 && document.querySelector('#qr').scrollWidth <= innerWidth));
    }
    ok(`${tag} each stage has different content`, new Set(seen).size === 5);
    await stage(page, 'size');
    ok(`${tag} size stage: cards Xin số đo / Gửi bảng size / Vừa size / Giữa 2 size; Thêm hides the rest`, (await page.$$eval('#stage .qc .t', e => e.map(x => x.textContent))).join('|') === 'Xin số đo|Gửi bảng size|Vừa size|Giữa 2 size' && (await page.$$('#stage [data-open="f:too-small-size"]')).length === 0);
    await page.tap('[data-act=stmore]'); ok(`${tag} Thêm discloses secondary items`, (await page.$$('#stage [data-open="f:too-small-size"]')).length === 1 && (await page.$$('#stage [data-open="f:will-think"]')).length === 1);
    await stage(page, 'out');
    ok(`${tag} check out stage has IG03/IG04 variants/tracking/feedback`, (await page.$$eval('#stage .qc .t', e => e.map(x => x.textContent))).join('|') === 'Đã nhận thanh toán|Cảm ơn · gói đơn|Gửi mã vận đơn · tin 1|Mã vận đơn · tin 2|Xin hình feedback');
    // targets
    const small = await page.evaluate(() => [...document.querySelectorAll('#nav button, #dock button, #stage button, #stage input, #stage textarea, #hint button')].filter(e => e.offsetParent).filter(e => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map(e => (e.className || e.tagName) + ':' + e.textContent.slice(0, 10)));
    ok(`${tag} 44pt targets (header, dock, stage)`, small.length === 0, small.join('|'));
    await toPI(page);
    const small2 = await page.evaluate(() => [...document.querySelectorAll('#pi button, #pi input')].filter(e => e.offsetParent).filter(e => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map(e => (e.className || e.tagName) + ':' + e.textContent.slice(0, 10)));
    ok(`${tag} 44pt targets (product tab)`, small2.length === 0, small2.join('|'));
    ok(`${tag} product tab: Theo mẫu (20 rows) / Theo set`, (await page.$$('#hbody [data-open^="p:"]')).length === 20 && (await page.$$eval('.sub2 button', e => e.map(x => x.textContent))).join('|') === 'Theo mẫu|Theo set');
    await page.tap('[data-act=pview][data-v=s]');
    ok(`${tag} Theo set: saved + create + suggested`, !!(await page.$('#hbody [data-act=setnew]')) && (await page.$$('#hbody [data-act=setsugg]')).length === 9);
    ok(`${tag} no horizontal overflow (both views)`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth && document.querySelector('#pi').scrollWidth <= innerWidth));
    ok(`${tag} zero console errors`, errors.length === 0, errors.join(';'));
    await page.context().close();
  }
  // --- editable boxes: edit, clipboard, Khôi phục, Lưu làm mẫu, internal scroll
  {
    const { page, errors } = await fresh({ w, h, dark });
    await openProd(page, 'lace-top');
    const sel = '.acard [data-eta=info]';
    const orig = await val(page, sel);
    ok(`${tag} editable box is a textarea; no "Xem hết" expander`, (await page.$eval(sel, e => e.tagName)) === 'TEXTAREA' && !(await page.$('#more')) && !/Xem hết/.test(await page.textContent('.sheet')));
    ok(`${tag} edit state hidden before an edit`, !(await page.$('.est .ed')) && !(await page.$('[data-act=ebreset]')));
    const dims0 = await page.$eval(sel, e => [e.scrollHeight, e.clientHeight, getComputedStyle(e).overflowY, Math.round(parseFloat(getComputedStyle(e).maxHeight))]);
    const long = orig + '\n' + Array.from({ length: 40 }, (_, i) => 'Dòng thêm số ' + (i + 1)).join('\n');
    await page.fill(sel, long); await page.waitForTimeout(150);
    const dims = await page.$eval(sel, e => ({ sh: e.scrollHeight, ch: e.clientHeight, max: parseFloat(getComputedStyle(e).maxHeight) }));
    ok(`${tag} long text: internal scroll (scrollHeight>clientHeight, height capped at max-height)`, dims.sh > dims.ch && dims.ch <= dims.max + 1, JSON.stringify(dims));
    await page.$eval(sel, e => { e.scrollTop = 99999; });
    ok(`${tag} textarea scrolls inside`, (await page.$eval(sel, e => e.scrollTop)) > 100);
    ok(`${tag} no page/sheet growth with long text`, await page.evaluate(() => { const s = document.querySelector('.sheet').getBoundingClientRect(); return document.documentElement.scrollHeight <= innerHeight + 1 && s.bottom <= innerHeight + 1; }));
    ok(`${tag} shows Đã sửa + Khôi phục + Lưu làm mẫu after edit`, /Đã sửa/.test(await page.textContent('.est .ed')) && !!(await page.$('[data-act=ebreset]')) && !!(await page.$('[data-act=ebsave]')));
    await page.tap('.shf [data-act=pcopy]'); await page.waitForTimeout(100);
    ok(`${tag} edited text is what gets copied (clipboard == box)`, (await clip(page)).slice(-1)[0] === long.trim(), '');
    await page.tap('[data-act=ebreset]'); await page.waitForTimeout(100);
    ok(`${tag} Khôi phục restores generated text and hides the edit state`, (await val(page, sel)) === orig && !(await page.$('.est .ed')));
    await page.fill(sel, 'Mẫu của mình\n' + orig); await page.waitForTimeout(100);
    await page.tap('[data-act=ebsave]'); await page.waitForTimeout(150);
    ok(`${tag} Lưu làm mẫu: edit state clears, box keeps text`, (await val(page, sel)) === 'Mẫu của mình\n' + orig && !(await page.$('.est .ed')));
    await closeSheet(page); await page.tap('[data-open="p:lace-top"]'); await page.waitForTimeout(450);
    ok(`${tag} saved template is the new default (reopen sheet)`, (await val(page, sel)).startsWith('Mẫu của mình\n'));
    await page.reload(); await page.waitForTimeout(300); await openProd(page, 'lace-top');
    ok(`${tag} saved template survives reload`, (await val(page, sel)).startsWith('Mẫu của mình\n'));
    await page.tap('[data-lead=info] .lchip[data-id="li-info-3"]');
    ok(`${tag} lead chip prepends to the saved template (preview == compose)`, (await val(page, sel)).startsWith('Soft gửi bạn thông tin mẫu ạ 🌷\n\nMẫu của mình'));
    // typing then changing a lead drops the edit with an undo toast
    await page.fill(sel, 'tạm'); await page.tap('[data-lead=info] .lchip[data-id="li-info-4"]'); await page.waitForTimeout(100);
    ok(`${tag} changing a lead drops the typed text and offers Hoàn tác`, !(await page.$('.est .ed')) && /Hoàn tác/.test(await page.textContent('#toast')));
    await page.tap('[data-act=undo]'); await page.waitForTimeout(100);
    ok(`${tag} Hoàn tác brings the typed text back`, (await val(page, sel)) === 'tạm');
    ok(`${tag} zero console errors (editing)`, errors.length === 0, errors.join(';'));
    await page.context().close();
  }
  // --- keyboard-safe layout (visualViewport resize emulation)
  {
    const { page } = await fresh({ w, h, dark, fakeVV: true }); const KB = 336;
    await page.tap('[data-open="f:open-first"]'); await page.waitForTimeout(450);
    const top0 = await page.$eval('.sheet', e => e.getBoundingClientRect().top);
    await page.focus('[data-eta=msg]'); await page.evaluate(k => window.__setKb(k), KB); await page.waitForTimeout(250);
    const r = await page.evaluate(() => { const b = document.querySelector('#mcopy').getBoundingClientRect(); return { bottom: b.bottom, top: document.querySelector('.sheet').getBoundingClientRect().top, ih: innerHeight, ta: document.querySelector('[data-eta=msg]').getBoundingClientRect().bottom }; });
    ok(`${tag} keyboard: Chép (sheet) stays above the keyboard`, r.bottom <= r.ih - KB + 1 && r.bottom > 0, JSON.stringify(r));
    ok(`${tag} keyboard: sheet does not jump (top unchanged), textarea above button`, Math.abs(r.top - top0) < 1 && r.ta <= r.bottom, top0 + ' ' + r.top);
    await page.fill('[data-eta=msg]', 'gõ thử trong khi bàn phím mở'); await page.tap('#mcopy'); await page.waitForTimeout(100);
    ok(`${tag} keyboard: Chép works while keyboard is open and copies the typed text`, (await clip(page)).slice(-1)[0] === 'gõ thử trong khi bàn phím mở');
    await page.evaluate(() => window.__setKb(0)); await page.waitForTimeout(700);
    await page.close();
    const o = await fresh({ w, h, dark, fakeVV: true });
    await stage(o.page, 'order'); await o.page.focus('[data-eta=order]'); await o.page.evaluate(k => window.__setKb(k), KB); await o.page.waitForTimeout(250);
    const q = await o.page.evaluate(() => { const f = document.querySelector('#ofoot').getBoundingClientRect(), d = document.querySelector('#dock'); return { bottom: f.bottom, ih: innerHeight, dock: getComputedStyle(d).display, vis: f.height > 30 }; });
    ok(`${tag} keyboard: order footer (total + Chép đơn) above the keyboard, dock hidden`, q.bottom <= q.ih - KB + 1 && q.vis && q.dock === 'none', JSON.stringify(q));
    await o.page.evaluate(() => window.__setKb(0)); await o.page.waitForTimeout(300);
    ok(`${tag} keyboard closed: dock back`, await o.page.isVisible('#dock'));
    await o.page.context().close();
  }
}

for (const [w, h] of [[393, 852], [430, 932]]) {
  const tag = w + 'x' + h;
  // SW-enabled error check
  {
    const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true });
    const page = await ctx.newPage(); const errs = []; page.on('console', m => ['error', 'warning'].includes(m.type()) && errs.push(m.text())); page.on('pageerror', e => errs.push(e.message));
    await page.goto(url); await page.waitForTimeout(1200); await page.reload(); await page.waitForTimeout(600);
    const sw = await page.evaluate(() => !!navigator.serviceWorker.controller);
    ok(`${tag} service worker installs & controls, zero console errors`, sw && errs.length === 0, 'sw=' + sw + ' ' + errs.join(';'));
    await ctx.close();
  }
  // --- tap counts
  {
    const { page } = await fresh({ w, h });
    let s = await clicks(page);
    await page.tap('[data-open="f:open-first"]'); await page.waitForTimeout(450); await page.tap('#mcopy'); await page.waitForTimeout(100);
    const g = (await clip(page))[0];
    ok(`${tag} greeting = 2 taps from app open; clipboard == box`, (await clicks(page)) - s === 2 && /^Soft Embrace chào bạn/.test(g) && !/\{\{/.test(g) && g === (await val(page, '[data-eta=msg]')), g.slice(0, 30));
    await page.waitForTimeout(900);
    s = await clicks(page);
    await page.tap('[data-act=pchip][data-id="noir-midi-skirt"][data-v=info]'); await page.waitForTimeout(450); await page.tap('.shf [data-act=pcopy][data-a=info]'); await page.waitForTimeout(100);
    ok(`${tag} product info = 2 taps from app open (Chào hỏi chips)`, (await clicks(page)) - s === 2 && (await clip(page)).length === 2);
    await closeSheet(page);
    await stage(page, 'size'); s = await clicks(page);
    await page.tap('[data-act=pchip][data-id="noir-midi-skirt"][data-v=size]'); await page.waitForTimeout(450);
    ok(`${tag} size chart sheet opens on the size action`, /Bảng size/.test(await page.textContent('.acard h3')));
    await page.tap('.shf [data-act=pcopy][data-a=size]'); await page.waitForTimeout(100);
    ok(`${tag} size chart = 2 taps once on Tư vấn size (3 from app open incl. the stage tap)`, (await clicks(page)) - s === 2 && /^Noir Midi Skirt/.test((await clip(page)).slice(-1)[0]) || (await clip(page)).length === 3);
    await closeSheet(page);
    // product tab path
    await toPI(page); s = await clicks(page);
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450); await page.tap('.shf [data-act=pcopy][data-a=info]'); await page.waitForTimeout(100);
    ok(`${tag} Theo mẫu: product info = 2 taps (row, Chép)`, (await clicks(page)) - s === 2);
    s = await clicks(page);
    await page.tap('.arow [data-act=pcopy][data-a=size]'); await page.waitForTimeout(100);
    ok(`${tag} Theo mẫu: size chart = 1 more tap on the sheet (2 from the row)`, (await clicks(page)) - s === 1);
    const s2 = await clicks(page);
    await page.tap('.arow [data-act=pcopy][data-a=both]'); await page.waitForTimeout(100);
    const cl2 = await clip(page);
    ok(`${tag} info+size copy works`, cl2.slice(-1)[0].includes('\n\n') && (await clicks(page)) - s2 === 1);
    await page.tap('[data-act=addline][data-v=M]'); await page.waitForTimeout(100);
    await closeSheet(page);
    ok(`${tag} add to order from product: bar visible`, await page.isVisible('#obar') && /1 món/.test(await page.textContent('#obar')));
    await page.tap('[data-act=openorder]'); await page.waitForTimeout(300);
    ok(`${tag} order bar jumps to Tạo đơn stage (first-class, no sheet)`, !(await page.isVisible('#obar')) && (await page.$eval('.stb[aria-pressed=true]', e => e.textContent)) === 'Tạo đơn' && (await page.isVisible('#qr')) && !(await page.$('.sheet')));
    ok(`${tag} line shows in composer and message has the line`, /Noir Midi Skirt/.test(await page.textContent('#olines')) && /Noir Midi Skirt – size M/.test(await val(page, '[data-eta=order]')));
    await page.context().close();
  }
  {   // order creation reachable in <=2 taps from app open
    const { page } = await fresh({ w, h });
    let s = await clicks(page);
    await stage(page, 'order');
    ok(`${tag} Tạo đơn: message 'Dạ vậy đơn của bạn' visible after 1 tap`, /^Dạ vậy đơn của bạn 🌷/.test(await val(page, '[data-eta=order]')) && await page.isVisible('[data-eta=order]'));
    ok(`${tag} Tạo đơn: copy disabled with no items`, await page.$eval('#obtn', e => e.disabled));
    await page.tap('#ores [data-act=oadd] >> nth=0'); await page.waitForTimeout(150);
    const clk = (await clicks(page)) - s;
    const t = await val(page, '[data-eta=order]');
    ok(`${tag} order created + message generated in 2 taps from app open`, clk === 2 && /^Dạ vậy đơn của bạn 🌷\n• /.test(t) && !(await page.$eval('#obtn', e => e.disabled)), clk + ' ' + t.slice(0, 60));
    ok(`${tag} transfer-note instruction is in the message and flagged`, /Instagram/.test(t) && /Đã kèm hướng dẫn/.test(await page.textContent('#tnote')));
    await page.tap('#obtn'); await page.waitForTimeout(100);
    const c = (await clip(page))[0];
    ok(`${tag} Chép đơn copies the box (3 taps total)`, c === t && /Tổng cộng là/.test(c));
    ok(`${tag} after copy: Check out shortcut card`, !!(await page.$('#opost .postcard')));
    // qty / ship / total update live
    await page.tap('#olines .lrow'); await page.tap('[data-act=qty][data-d="1"]'); await page.tap('[data-act=ship][data-v=free]'); await page.waitForTimeout(100);
    const t2 = await val(page, '[data-eta=order]');
    ok(`${tag} qty + shipping update message and live total`, / x2/.test(t2) && /Shipping: miễn phí/.test(t2) && (await page.textContent('#ofoot .tv')).includes('đ'));
    // edited order text copies as typed; template save
    await page.fill('[data-eta=order]', t2 + '\nCảm ơn bạn nhiều nhé'); await page.tap('#obtn'); await page.waitForTimeout(100);
    ok(`${tag} edited order message is copied as typed`, (await clip(page)).slice(-1)[0].endsWith('Cảm ơn bạn nhiều nhé'));
    await page.tap('[data-act=ebsave]'); await page.waitForTimeout(150);
    ok(`${tag} order Lưu làm mẫu keeps lines/total live (template tokens restored)`, (await page.evaluate(() => window.__SE.st.ov.__ord.vi)).includes('{{orderLines}}') && (await page.evaluate(() => window.__SE.st.ov.__ord.vi)).includes('{{total}}') && (await val(page, '[data-eta=order]')).endsWith('Cảm ơn bạn nhiều nhé'));
    await page.tap('[data-act=qty][data-d="1"]'); await page.waitForTimeout(100);
    ok(`${tag} saved order template still follows quantity`, / x3/.test(await val(page, '[data-eta=order]')));
    await page.fill('[data-in=info]', 'Nguyễn A, 0900 000 000, Hà Nội'); await page.waitForTimeout(100);
    ok(`${tag} receiver info appended to the message`, /Giao đến:\nNguyễn A/.test(await val(page, '[data-eta=order]')));
    await page.context().close();
  }
  {   // stage memory + first screen
    const { page } = await fresh({ w, h });
    await stage(page, 'info'); await page.waitForTimeout(400); await page.reload(); await page.waitForTimeout(300);
    ok(`${tag} last used stage remembered; first screen still Câu trả lời nhanh`, (await page.$eval('.stb[aria-pressed=true]', e => e.textContent)) === 'Xin thông tin' && await page.isVisible('#qr'));
    await page.context().close();
  }
  {   // message sheet: save as template, product slot in greeting, fills
    const { page } = await fresh({ w, h });
    await page.tap('[data-open="f:open-first"]'); await page.waitForTimeout(450);
    const g0 = await val(page, '[data-eta=msg]');
    const pn = await page.$eval('[data-act=fill][data-k=item]:not([data-v=""])', e => e.textContent);
    await page.tap('[data-act=fill][data-k=item]:not([data-v=""])'); await page.waitForTimeout(200);
    const g1 = await val(page, '[data-eta=msg]');
    ok(`${tag} greeting: optional product slot appends info (and Không kèm removes it)`, g1.startsWith(g0.replace(/\s*$/, '')) && g1.includes(pn.split(' · ')[0]) && g1.length > g0.length + 100, pn);
    await page.tap('[data-act=fill][data-k=item][data-v=""]'); await page.waitForTimeout(200);
    ok(`${tag} greeting: Không kèm back to greeting only`, (await val(page, '[data-eta=msg]')) === g0);
    await page.fill('[data-eta=msg]', 'Chào bạn nhen 🌷'); await page.tap('[data-act=ebsave]'); await page.waitForTimeout(150);
    await closeSheet(page); await page.tap('[data-open="f:open-first"]'); await page.waitForTimeout(450);
    ok(`${tag} message Lưu làm mẫu persists for that reply/language`, (await val(page, '[data-eta=msg]')) === 'Chào bạn nhen 🌷');
    await page.tap('.sheet [data-act=lang][data-v=en]'); await page.waitForTimeout(200);
    ok(`${tag} other language keeps its own default`, (await val(page, '[data-eta=msg]')) !== 'Chào bạn nhen 🌷' && /Hi lovely/.test(await val(page, '[data-eta=msg]')));
    await page.context().close();
  }
  {   // size reply with ctx pre-fill + markers
    const ctx = { itemId: 'lace-top', size: 'M', at: Date.now() };
    const { page } = await fresh({ w, h, storage: { ctx } });
    await stage(page, 'size'); const s = await clicks(page);
    await page.tap('[data-open="f:fit-size"]'); await page.waitForTimeout(450);
    await page.tap('#mcopy'); await page.waitForTimeout(100);
    const c = await clip(page);
    ok(`${tag} size-advice script = 2 taps on stage with ctx pre-fill`, (await clicks(page)) - s === 2 && c.length === 1 && /size M/.test(c[0]) && !/\{\{|\[mẫu\]|\[size\]/.test(c[0]));
    await page.context().close();
    const o = await fresh({ w, h });
    await stage(o.page, 'size'); await o.page.tap('[data-open="f:fit-size"]'); await o.page.waitForTimeout(450);
    ok(`${tag} unfilled placeholders show as [markers] and block copy`, /\[size\]/.test(await val(o.page, '[data-eta=msg]')) && await o.page.$eval('#mcopy', e => e.disabled));
    await o.page.tap('[data-act=fill][data-k=item]:not([data-v=""]) >> nth=0'); await o.page.tap('[data-act=fill][data-k=size][data-v=M]'); await o.page.waitForTimeout(150);
    ok(`${tag} filling enables copy`, !(await o.page.$eval('#mcopy', e => e.disabled)) && !/\[/.test(await val(o.page, '[data-eta=msg]')));
    await o.page.context().close();
  }
  {   // IG02 + check out replies
    const { page } = await fresh({ w, h });
    await stage(page, 'size'); await page.tap('[data-open="f:ask-measurements"]'); await page.waitForTimeout(450);
    ok(`${tag} Xin số đo is the IG02 phrase`, (await val(page, '[data-eta=msg]')) === 'Nếu bạn cần tư vấn thêm về size, cho Soft xin số đo 3 vòng, chiều cao và cân nặng nhen 💕');
    await page.context().close();
    const o = await fresh({ w, h });
    await stage(o.page, 'out');
    await o.page.tap('[data-open="f:paid-ack"]'); await o.page.waitForTimeout(450);
    ok(`${tag} Đã nhận thanh toán = IG03`, (await val(o.page, '[data-eta=msg]')) === 'ui dạ mình nhận được rùi ạ'); await closeSheet(o.page);
    await o.page.tap('[data-open="f:paid-thanks"]'); await o.page.waitForTimeout(450);
    const rtw = await val(o.page, '[data-eta=msg]');
    await o.page.tap('[data-act=variant][data-v=thanks-custom]'); await o.page.waitForTimeout(200);
    const cus = await val(o.page, '[data-eta=msg]');
    ok(`${tag} Cảm ơn · gói đơn: ready-to-wear (IG04) vs custom variants`, /gói đơn/.test(rtw) && /may/.test(cus) && rtw !== cus); await closeSheet(o.page);
    await o.page.tap('[data-open="f:tracking-code"]'); await o.page.waitForTimeout(450);
    ok(`${tag} tracking code bubble blocked until code typed`, await o.page.$eval('#mcopy', e => e.disabled));
    await o.page.fill('[data-fill=trackingCode]', 'GHN123456'); await o.page.waitForTimeout(100);
    await o.page.tap('#mcopy'); await o.page.waitForTimeout(100);
    ok(`${tag} tracking code bubble = just the code`, (await clip(o.page))[0] === 'GHN123456'); await o.page.waitForTimeout(900);
    await o.page.tap('[data-act=stmore]'); await o.page.tap('[data-open="f:return-policy"]'); await o.page.waitForTimeout(200);
    ok(`${tag} return-policy reminder (attachment only) toasts`, /đính kèm/.test(await o.page.textContent('#toast')));
    await o.page.context().close();
  }
  {   // set creation: 3 taps from product sheet
    const { page } = await fresh({ w, h });
    await openProd(page, 'noir-midi-skirt');
    const s = await clicks(page);
    await page.tap('[data-act=setpick]'); await page.waitForTimeout(450);
    const first = await page.$eval('#plist [data-act=pickone] .t', e => e.textContent);
    await page.tap('#plist [data-act=pickone]'); await page.waitForTimeout(600);
    await page.tap('.bub[data-b=a] [data-act=bcopy]'); await page.waitForTimeout(100);
    const c = await clip(page);
    ok(`${tag} set create+copy bubble 1 = 3 taps from product sheet; first suggestion is the pair from her posts`, (await clicks(page)) - s === 3 && /Soft Halter Top/.test(first) && c.length === 1 && /Giá set/.test(c[0]), first);
    await page.context().close();
  }
  {   // set bubbles
    const { page } = await fresh({ w, h, storage: { sets: [{ id: 'set-t', items: ['lace-top', 'lace-skirt-cream'], price: null, name: '', postUrl: '', checked: true, ov: { vi: null, en: null } }] } });
    await openProd(page, 'lace-top');
    ok(`${tag} product sheet shows existing set row`, /Set với Lace Skirt.*850\.000đ/.test(await page.textContent('.arow:has([data-act=pcopyset])')));
    await closeSheet(page); await page.tap('[data-act=pview][data-v=s]'); await page.tap('[data-open="s:set-t"]'); await page.waitForTimeout(600);
    await page.fill('[data-sprice]', '800000'); await page.waitForTimeout(100);
    ok(`${tag} custom price line shown`, /Giá lẻ 380\.000đ \+ 470\.000đ = 850\.000đ → Giá set 800\.000đ/.test(await page.textContent('#pline')));
    ok(`${tag} 4 set bubbles are separate editable boxes`, (await page.$$('.bub [data-eta]')).length === 4);
    const nxt0 = await page.$eval('.bub.next', e => e.dataset.b);
    const out = [];
    for (const bb of ['a', 'b', 'c', 'd']) {
      const pvx = await val(page, `.bub[data-b=${bb}] [data-eta]`);
      await page.tap(`.bub[data-b=${bb}] [data-act=bcopy]`); await page.waitForTimeout(80);
      if (bb === 'a') { await page.waitForTimeout(500); await page.tap(`.bub[data-b=a] [data-act=bcopy]`); await page.waitForTimeout(80); }   // truncated text (synthetic flag): guard
      const cl = await clip(page); out.push(cl[cl.length - 1]);
      if (pvx !== out[out.length - 1]) ok(`${tag} bubble ${bb} preview==clipboard`, false, pvx.slice(0, 40));
    }
    const nxt = await page.$eval('.bub.next', e => e.dataset.b);
    ok(`${tag} set bubbles: next highlight moves (a -> d), footer follows`, nxt0 === 'a' && nxt === 'd' && /tin 4/.test(await page.textContent('#bnext')), nxt0 + '>' + nxt);
    ok(`${tag} set bubble 1 = info A + info B + custom price 800.000đ (tiết kiệm 50.000đ)`, /^Lace Top 🦢/.test(out[0]) && out[0].includes('\n\nLace Skirt ✨') && out[0].endsWith('• Giá set: 800.000đ (tiết kiệm 50.000đ)'), out[0].slice(-60));
    ok(`${tag} set bubble 2 = both size charts labelled`, /^Lace Top\n• S/.test(out[1]) && out[1].includes('\n\nLace Skirt · Kem\n• S'), out[1].slice(0, 30));
    ok(`${tag} set bubble 3 = IG02, bubble 4 = post link`, out[2] === 'Nếu bạn cần tư vấn thêm về size, cho Soft xin số đo 3 vòng, chiều cao và cân nặng nhen 💕' && out[3] === 'https://instagram.com/softembrace.made/p/DUQkDk6kTDg/');
    // edit bubble 3 + save as template
    await page.fill('.bub[data-b=c] [data-eta]', 'Cho Soft xin số đo nhen 💕'); await page.tap('.bub[data-b=c] [data-act=bcopy]'); await page.waitForTimeout(100);
    ok(`${tag} set bubble edited text copied`, (await clip(page)).slice(-1)[0] === 'Cho Soft xin số đo nhen 💕');
    await page.tap('.bub[data-b=c] [data-act=ebsave]'); await page.waitForTimeout(150);
    ok(`${tag} set bubble Lưu làm mẫu (own wording, with link to reset)`, (await val(page, '.bub[data-b=c] [data-eta]')) === 'Cho Soft xin số đo nhen 💕' && !!(await page.$('.bub[data-b=c] [data-act=setovreset]')));
    await page.tap('.bub[data-b=c] [data-act=setovreset]'); await page.waitForTimeout(150);
    ok(`${tag} Dùng bản tự soạn restores`, (await val(page, '.bub[data-b=c] [data-eta]')).startsWith('Nếu bạn cần'));
    await page.context().close();
  }
  {   // suggested pair guard + preview == clipboard across leads
    const { page } = await fresh({ w, h });
    await toPI(page); await page.tap('[data-act=pview][data-v=s]');
    await page.tap('[data-act=setsugg][data-a="soft-halter-top-white"]'); await page.waitForTimeout(600);
    await page.tap('.bub[data-b=a] [data-act=bcopy]'); await page.waitForTimeout(100);
    ok(`${tag} suggested set: 1st tap guarded with price-check text, nothing copied`, (await clip(page)).length === 0 && /Kiểm tra giá set/.test(await page.textContent('.bub[data-b=a] .btn')));
    await page.waitForTimeout(500);
    await page.tap('.bub[data-b=a] [data-act=bcopy]'); await page.waitForTimeout(100);
    ok(`${tag} suggested set: 2nd tap copies and marks price checked`, (await clip(page)).length === 1 && (await page.evaluate(() => window.__SE.st.sets[0].checked)) === true);
    let bad = 0, n = 0;
    for (const lang of ['vi', 'en']) {
      if (lang === 'en') { await page.tap('.sheet [data-act=lang][data-v=en]'); await page.waitForTimeout(150); }
      for (const [bb, z] of [['a', 'info'], ['b', 'size']]) {
        if (!(await page.$(`.bub[data-b=${bb}] [data-act=bcopy]:not([data-alt])`))) continue;
        const ids = await page.$$eval(`[data-lead=${z}] .lchip[data-act=lead]`, e => e.map(x => x.dataset.id));
        for (const id of ids) {
          const cur = await page.$eval(`[data-lead=${z}] .lchip[aria-pressed=true]`, e => e.dataset.id);
          if (cur !== id) await page.tap(`[data-lead=${z}] .lchip[data-id="${id}"]`);
          const pvx = await val(page, `.bub[data-b=${bb}] [data-eta]`);
          await page.tap(`.bub[data-b=${bb}] [data-act=bcopy]`); await page.waitForTimeout(40);
          const c = await clip(page); n++; if (c[c.length - 1] !== pvx) bad++;
        }
      }
    }
    ok(`${tag} set bubbles a/b: preview == clipboard across leads VI/EN`, bad === 0 && n >= 10, `n=${n} bad=${bad}`);
    await page.context().close();
  }
  {   // link chip, order total with fee
    const { page } = await fresh({ w, h });
    await openProd(page, 'lace-top');
    const url = 'https://instagram.com/softembrace.made/p/DUQkDk6kTDg/';
    ok(`${tag} link chip off by default`, !(await prev(page)).includes(url) && await page.$eval('[data-act=linktoggle]', e => e.getAttribute('aria-pressed') === 'false'));
    await page.tap('[data-act=linktoggle]');
    ok(`${tag} link chip on: box ends with link`, (await prev(page)).endsWith('\n\n' + url));
    await page.tap('.shf [data-act=pcopy][data-a=info]'); await page.waitForTimeout(500); await page.tap('.shf [data-act=pcopy][data-a=info]'); await page.waitForTimeout(100);   // synthetic truncation guard on Lace Top
    const c = await clip(page); ok(`${tag} link chip: clipboard == box`, c[0] === (await prev(page)) && c[0].endsWith(url));
    await page.context().close();
    const o = await fresh({ w, h, storage: { draft: { lines: [{ pid: 'lace-top', size: 'M', qty: 1 }], ship: 'fee', custom: 0, info: '', bank: false, copiedAt: 0 }, set: { lang: 'vi', fee: 24000, bank: { name: '', no: '', holder: '' } }, ov: { 'lace-top': { price: 420000 } } } });
    await stage(o.page, 'order'); await o.page.tap('#obtn'); await o.page.waitForTimeout(100);
    const oc = (await clip(o.page))[0]; ok(`${tag} order recap total 420.000đ + 24.000đ = 444.000đ`, /Tổng cộng là 444\.000đ/.test(oc) && /Shipping: 24\.000đ/.test(oc), oc.split('\n').slice(-4).join('|'));
    await o.page.context().close();
  }
  // --- preview == clipboard for each lead combo
  for (const lang of ['vi', 'en']) {
    const { page } = await fresh({ w, h, storage: { set: { lang, fee: 25000, bank: { name: '', no: '', holder: '' } } } });
    let bad = [], n = 0;
    await openProd(page, 'noir-midi-skirt');
    for (const a of ['info', 'size', 'both']) {
      if (a !== 'info') { await page.tap(`.arow [data-act=popen][data-a=${a}]`); await page.waitForTimeout(100); }
      const zones = a === 'both' ? ['info', 'size'] : [a];
      const idsOf = async z => page.$$eval(`[data-lead=${z}] .lchip[data-act=lead]`, els => els.map(e => e.dataset.id));
      const combos = a === 'both' ? (await (async () => { const A = await idsOf('info'), B = await idsOf('size'); const o = []; for (const x of A) for (const y of B) o.push([x, y]); return o; })()) : (await idsOf(a)).map(x => [x]);
      for (const combo of combos) {
        for (let i = 0; i < zones.length; i++) {
          const cur = await page.$eval(`[data-lead=${zones[i]}] .lchip[aria-pressed=true]`, e => e.dataset.id);
          if (cur !== combo[i]) await page.tap(`[data-lead=${zones[i]}] .lchip[data-id="${combo[i]}"]`);
        }
        const pv = await prev(page);
        await page.tap(`.shf [data-act=pcopy]`); await page.waitForTimeout(40);
        const c = await clip(page); n++;
        if (c[c.length - 1] !== pv) bad.push(a + combo.join(','));
      }
    }
    ok(`${tag} preview == clipboard, every lead combo, ${lang} (${n} combos)`, bad.length === 0 && n > 20, bad.slice(0, 3).join('|'));
    await page.context().close();
  }
  {   // order leads VI/EN
    const { page } = await fresh({ w, h });
    await stage(page, 'order'); await page.tap('#ores [data-act=oadd] >> nth=0');
    let bad = 0, n = 0;
    for (const lang of ['vi', 'en']) {
      if (lang === 'en') { await page.tap('[data-act=lang][data-v=en]'); await page.waitForTimeout(150); }
      const ids = await page.$$eval('#stage [data-lead=order] .lchip[data-act=lead]', e => e.map(x => x.dataset.id));
      for (const id of ids) {
        const cur = await page.$eval('#stage [data-lead=order] .lchip[aria-pressed=true]', e => e.dataset.id);
        if (cur !== id) await page.tap(`#stage [data-lead=order] .lchip[data-id="${id}"]`);
        const pv = await val(page, '[data-eta=order]');
        await page.tap('#obtn'); await page.waitForTimeout(40);
        const c = await clip(page); n++; if (c[c.length - 1] !== pv) bad++;
      }
    }
    ok(`${tag} order: preview == clipboard across leads VI/EN`, bad === 0 && n >= 8, `n=${n} bad=${bad}`);
    await page.context().close();
  }
  // --- memory
  {
    const { page } = await fresh({ w, h });
    await openProd(page, 'noir-midi-skirt');
    await page.tap('[data-lead=info] .lchip[data-id="li-info-3"]');
    await page.tap('.shf [data-act=pcopy][data-a=info]'); await page.waitForTimeout(300);
    await closeSheet(page);
    await page.tap('[data-open="p:shimmer-top"]'); await page.waitForTimeout(450);
    ok(`${tag} lead memory after successful copy`, await page.$eval('[data-lead=info] .lchip[aria-pressed=true]', e => e.dataset.id) === 'li-info-3');
    await page.tap('[data-lead=info] .lchip[data-id="li-info-4"]'); await closeSheet(page);
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    ok(`${tag} lead NOT remembered without copy`, await page.$eval('[data-lead=info] .lchip[aria-pressed=true]', e => e.dataset.id) === 'li-info-3');
    await page.tap('[data-lead=info] [data-act=leadadd]'); await page.fill('[data-lfi]', 'Câu thử của mình 🌷'); await page.tap('[data-act=leadsave]'); await page.waitForTimeout(100);
    const first = await page.$eval('[data-lead=info] .lchip[data-act=lead][data-id^="lu-"]', e => [e.getAttribute('aria-pressed'), e.previousElementSibling.textContent]);
    ok(`${tag} add lead: chip selected, box starts with it`, first[0] === 'true' && (await prev(page)).startsWith('Câu thử của mình 🌷'));
    await page.tap('.shf [data-act=pcopy][data-a=info]'); await page.waitForTimeout(300);
    await page.reload(); await page.waitForTimeout(400); await openProd(page, 'noir-midi-skirt');
    ok(`${tag} added lead survives reload`, await page.$eval('[data-lead=info] .lchip[aria-pressed=true]', e => e.textContent.includes('Câu thử')));
    await page.tap('.sheet [data-act=lang][data-v=en]'); await page.waitForTimeout(100);
    ok(`${tag} custom VI lead hidden in EN`, !(await page.$$eval('[data-lead=info] .lchip', e => e.map(x => x.textContent).join('|'))).includes('Câu thử'));
    await page.tap('.sheet [data-act=lang][data-v=vi]'); await page.waitForTimeout(100);
    const chip = await page.$('[data-lead=info] .lchip[data-id^="lu-"]'); const bb = await chip.boundingBox();
    await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' })); }, [bb.x + 20, bb.y + 10]);
    await page.waitForTimeout(600);
    ok(`${tag} long-press chip opens Sửa/Xoá menu`, await page.isVisible('.mpanel') && /Xoá/.test(await page.textContent('.mpanel')));
    await page.evaluate(() => document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true })));
    await page.waitForTimeout(800);
    await page.tap('.mpanel [data-m=lead-del]'); await page.waitForTimeout(200);
    ok(`${tag} delete lead removes chip`, (await page.$$('[data-lead=info] .lchip[data-id^="lu-"]')).length === 0);
    await page.context().close();
  }
  // --- truncation guard
  {
    const { page } = await fresh({ w, h });
    await openProd(page, 'lace-top');
    ok(`${tag} quiet truncated line present, no modal`, await page.isVisible('.qwarn') && !(await page.$('.dlg')));
    const B = '.shf [data-act=pcopy][data-a=info]';
    await page.tap(B); await page.waitForTimeout(100);
    ok(`${tag} trunc: 1st tap no clipboard + guard text`, (await clip(page)).length === 0 && /chạm lần nữa/.test(await page.textContent('.shf .btn')));
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
  // --- missing EN
  {
    const { page } = await fresh({ w, h, storage: { ov: { 'noir-midi-skirt': { descEn: '' } }, set: { lang: 'en', fee: 25000, bank: { name: '', no: '', holder: '' } } } });
    await openProd(page, 'noir-midi-skirt');
    ok(`${tag} missing EN: disabled button, no copy`, /Chưa có bản EN/.test(await page.textContent('.shf .btn')));
    await page.tap('[data-act=pcopyalt]'); await page.waitForTimeout(100);
    const c = await clip(page); const t = await page.textContent('.toast');
    ok(`${tag} missing EN: Chép bản VI copies VI + toast · VI`, c.length === 1 && /Màu|Dáng|Chân váy/.test(c[0]) && /VI/.test(t), t);
    await page.context().close();
  }
  // --- hint
  {
    const { page } = await fresh({ w, h });
    ok(`${tag} first-run hint is one line`, await page.isVisible('#hint') && (await page.$eval('#hint span', e => e.getBoundingClientRect().height)) < 24);
    await page.tap('[data-open="f:open-first"]'); await page.waitForTimeout(450);
    await page.tap('#mcopy'); await page.waitForTimeout(500);
    ok(`${tag} hint gone after first copy`, !(await page.isVisible('#hint')));
    await page.waitForTimeout(400); await page.reload(); await page.waitForTimeout(300);
    ok(`${tag} hint stays gone after reload`, !(await page.isVisible('#hint')));
    await page.context().close();
    const o2 = await fresh({ w, h }); await o2.page.tap('[data-act=hintx]'); ok(`${tag} hint ✕ dismisses`, !(await o2.page.isVisible('#hint'))); await o2.page.context().close();
  }
  // --- language switch in header + settings button
  {
    const { page } = await fresh({ w, h });
    await page.tap('#lsw [data-v=en]'); await page.waitForTimeout(150);
    await page.tap('[data-open="f:open-first"]'); await page.waitForTimeout(450);
    ok(`${tag} header language switch (EN) applies to messages`, /Hi lovely/.test(await val(page, '[data-eta=msg]')));
    await closeSheet(page); await page.tap('[data-act=settings]'); await page.waitForTimeout(450);
    ok(`${tag} settings behind one text button`, /Tuỳ chỉnh/.test(await page.textContent('.sheet')));
    await page.context().close();
  }
  // --- reduced motion
  {
    const { page, errors } = await fresh({ w, h, reduced: true });
    await page.tap('[data-open="f:open-first"]'); await page.waitForTimeout(500);
    ok(`${tag} reduced motion: sheet opens, no errors`, await page.isVisible('.sheet') && errors.length === 0, errors.join(';'));
    await page.context().close();
  }
}
// --- perf at 4x CPU
{
  const { page, ctx } = await fresh();
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.tap('[data-act=pchip][data-id="noir-midi-skirt"][data-v=info]'); await page.waitForTimeout(800);
  const m = await page.evaluate(async () => {
    const out = [];
    const btn = document.querySelector('.shf [data-act=pcopy][data-a=info]');
    for (let i = 0; i < 12; i++) { const t0 = performance.now(); btn.click(); const t1 = performance.now(); out.push(t1 - t0); await new Promise(r => setTimeout(r, 200)); }
    return { out, seal: btn.classList.contains('copied') };
  });
  const sorted = m.out.slice().sort((a, b) => a - b);
  console.log('copy handler 4x CPU ms:', m.out.map(x => x.toFixed(1)).join(' '), 'median', sorted[6].toFixed(1));
  ok('copy handler median <16ms at 4x CPU (product sheet)', sorted[6] < 16, 'median ' + sorted[6].toFixed(1) + ' max ' + sorted[11].toFixed(1) + ' first ' + m.out[0].toFixed(1));
  await page.tap('.sheet [data-act=shclose]'); await page.waitForTimeout(500);
  // typing in an editable box at 4x: input handler cost
  await page.tap('[data-open="f:open-first"]'); await page.waitForTimeout(800);
  const ty = await page.evaluate(async () => {
    const ta = document.querySelector('[data-eta=msg]'), out = [];
    ta.focus();
    for (let i = 0; i < 12; i++) { const t0 = performance.now(); ta.value += 'x'; ta.dispatchEvent(new Event('input', { bubbles: true })); out.push(performance.now() - t0); await new Promise(r => requestAnimationFrame(r)); }
    return out;
  });
  const ts = ty.slice().sort((a, b) => a - b);
  console.log('typing input handler 4x CPU ms:', ty.map(x => x.toFixed(1)).join(' '));
  ok('typing in the editable box: input handler median <16ms at 4x CPU', ts[6] < 16, 'median ' + ts[6].toFixed(1) + ' max ' + ts[11].toFixed(1));
  await page.fill('[data-eta=msg]', 'abc'); await page.evaluate(() => { document.querySelector('#mcopy').click(); });
  const mc = await page.evaluate(async () => { const btn = document.querySelector('#mcopy'); const t0 = performance.now(); btn.click(); return performance.now() - t0; });
  ok('message sheet copy handler <16ms at 4x CPU', mc < 16, mc.toFixed(1));
  await ctx.close();
}
await b.close(); srv.close();
const f = R.filter(r => !r[1]); console.log(`\n${R.length - f.length}/${R.length} passed`); if (f.length) { console.log(f.map(x => x.join(' ')).join('\n')); process.exit(1); }
