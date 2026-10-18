import { serve, launch, newPage } from './lib.mjs';
const { srv, url } = await serve();
const b = await launch();
const R = []; const ok = (n, c, d = '') => { R.push([n, !!c, d]); console.log((c ? 'PASS ' : 'FAIL ') + n + (d ? '  ' + d : '')); };
const clip = p => p.evaluate(() => window.__clip.slice());
const clicks = p => p.evaluate(() => window.__clicks);
const norm = s => s.replace(/\s+/g, ' ').trim();
const prev = p => p.evaluate(() => document.querySelector('#prev').textContent);
async function fresh(opts = {}) { const o = await newPage(b, opts); await o.page.goto(url); await o.page.waitForTimeout(300); return o; }
const closeSheet = async p => { await p.tap('.sheet [data-act=shclose]'); await p.waitForTimeout(450); };

for (const [w, h] of [[393, 852], [430, 932]]) {
  const tag = w + 'x' + h;
  // --- first screen
  for (const dark of [false, true]) {
    const { page, errors } = await fresh({ w, h, dark });
    const n = await page.evaluate(() => [...document.querySelectorAll('#home button, #home a, #home input, #nav button, [role=button]')].filter(e => e.offsetParent && e.getBoundingClientRect().bottom > 0 && e.getBoundingClientRect().top < innerHeight && !e.closest('.grp') ).length);
    ok(`${tag} ${dark ? 'dark' : 'light'} first-viewport controls outside list <=6`, n <= 6, 'n=' + n);
    const ov = await page.evaluate(() => document.documentElement.scrollWidth - innerWidth + (document.getElementById('home').scrollWidth - document.getElementById('home').clientWidth));
    ok(`${tag} ${dark ? 'dark' : 'light'} no horizontal overflow (home)`, ov <= 0, 'ov=' + ov);
    const iconOnly = await page.evaluate(() => [...document.querySelectorAll('#home button, #nav button')].filter(e => e.offsetParent && !e.textContent.trim() && !e.getAttribute('aria-label')).length);
    ok(`${tag} no unlabeled icon buttons`, iconOnly === 0);
    const small = await page.evaluate(() => [...document.querySelectorAll('#home button, #nav button, #home input')].filter(e => e.offsetParent).filter(e => { const r = e.getBoundingClientRect(); return r.height < 43.5 || r.width < 43.5; }).map(e => e.className + e.textContent.slice(0, 10)));
    ok(`${tag} 44pt targets on home`, small.length === 0, small.join('|'));
    ok(`${tag} no tabbar/tab text`, !(await page.$('#tabbar')) );
    // overflow in sheets
    await page.tap('[data-open="p:lace-top"]'); await page.waitForTimeout(500);
    const so = await page.evaluate(() => { const s = document.querySelector('.sheet'); return [...s.querySelectorAll('*')].filter(e => e.getBoundingClientRect().right > innerWidth + 1 && !e.closest('.lead') && !e.closest('.chips')).length + (document.documentElement.scrollWidth - innerWidth); });
    ok(`${tag} ${dark ? 'dark' : 'light'} no horizontal overflow (product sheet)`, so <= 0, 'so=' + so);
    ok(`${tag} ${dark ? 'dark' : 'light'} zero console errors`, errors.length === 0, errors.join(';'));
    await page.context().close();
  }
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
    const start = await clicks(page);
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    await page.tap('[data-act=pcopy][data-a=info]'); await page.waitForTimeout(100);
    ok(`${tag} product info = 2 taps`, (await clicks(page)) - start === 2 && (await clip(page)).length === 1);
    await closeSheet(page);
    const s2 = await clicks(page);
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    await page.tap('.arow [data-act=pcopy][data-a=size]'); await page.waitForTimeout(100);
    const cl = await clip(page);
    ok(`${tag} size chart = 2 taps`, (await clicks(page)) - s2 === 2 && cl.length === 2, cl[1] && cl[1].slice(0, 20));
    const s3 = await clicks(page);
    await page.tap('.arow [data-act=pcopy][data-a=both]'); await page.waitForTimeout(100);
    const cl2 = await clip(page);
    ok(`${tag} info+size copy works (1 tap once sheet open => 2 from home)`, cl2.length === 3 && cl2[2].includes('\n\n') && (await clicks(page)) - s3 === 1);
    await closeSheet(page);
    const s4 = await clicks(page);
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    await page.tap('[data-act=addline][data-v=M]'); await page.waitForTimeout(100);
    ok(`${tag} add to order = 2 taps; bar visible`, (await clicks(page)) - s4 === 2 && await page.isVisible('#obar') && /1 món/.test(await page.textContent('#obar')));
    await closeSheet(page);
    const s5 = await clicks(page);
    await page.tap('[data-act=openorder]'); await page.waitForTimeout(500);
    await page.tap('[data-act=copyorder]'); await page.waitForTimeout(100);
    const cl3 = await clip(page);
    ok(`${tag} copy order = 2 taps from home (bar -> Chép đơn)`, (await clicks(page)) - s5 === 2 && /Dạ vậy đơn của bạn/.test(cl3[cl3.length - 1]));
    ok(`${tag} thank card appears after order copy`, await page.isVisible('.ocard'));
    await page.context().close();
  }
  {
    const { page } = await fresh({ w, h });
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    const s = await clicks(page);
    await page.tap('[data-act=setpick]'); await page.waitForTimeout(450);
    const first = await page.$eval('#plist [data-act=pickone] .t', e => e.textContent);
    await page.tap('#plist [data-act=pickone]'); await page.waitForTimeout(600);
    await page.tap('.bub[data-b=a] [data-act=bcopy]'); await page.waitForTimeout(100);
    const c = await clip(page);
    ok(`${tag} set create+copy bubble 1 = 3 taps from product sheet; first suggestion is the pair from her posts`, (await clicks(page)) - s === 3 && /Soft Halter Top/.test(first) && c.length === 1 && /Giá set/.test(c[0]), first);
    
    await page.context().close();
  }
  {
    // set bubbles: exact clipboard strings, next-bubble highlight, custom price
    const { page } = await fresh({ w, h, storage: { sets: [{ id: 'set-t', items: ['lace-top', 'lace-skirt-cream'], price: null, name: '', postUrl: '', checked: true, ov: { vi: null, en: null } }] } });
    await page.tap('[data-open="p:lace-top"]'); await page.waitForTimeout(450);
    ok(`${tag} product sheet shows existing set row`, /Set với Lace Skirt.*850\.000đ/.test(await page.textContent('.arow:has([data-act=pcopyset])')));
    await page.tap('[data-open="s:set-t"]'); await page.waitForTimeout(600);
    await page.fill('[data-sprice]', '800000'); await page.waitForTimeout(100);
    ok(`${tag} custom price line shown`, /Giá lẻ 380\.000đ \+ 470\.000đ = 850\.000đ → Giá set 800\.000đ/.test(await page.textContent('#pline')));
    const nxt0 = await page.$eval('.bub.next', e => e.dataset.b);
    const out = [];
    for (const bb of ['a', 'b', 'c', 'd']) {
      await page.tap(`.bub[data-b=${bb}] [data-act=bcopy]`); await page.waitForTimeout(80);
      if (bb === 'a') { await page.waitForTimeout(500); await page.tap(`.bub[data-b=a] [data-act=bcopy]`); await page.waitForTimeout(80); }   // truncated text: guard
      const cl = await clip(page); out.push(cl[cl.length - 1]);
      const pvx = await page.$eval(`.bub[data-b=${bb}] .bp`, e => e.textContent);
      if (pvx !== out[out.length - 1]) ok(`${tag} bubble ${bb} preview==clipboard`, false, pvx.slice(0, 40));
    }
    const nxt = await page.$eval('.bub.next', e => e.dataset.b);
    ok(`${tag} set bubbles: next highlight moves (a -> ... d)`, nxt0 === 'a' && nxt === 'd', nxt0 + '>' + nxt);
    ok(`${tag} set bubble 1 = info A + info B + custom price 800.000đ (tiết kiệm 50.000đ)`, /^Lace Top 🦢/.test(out[0]) && out[0].includes('\n\nLace Skirt ✨') && out[0].endsWith('• Giá set: 800.000đ (tiết kiệm 50.000đ)'), out[0].slice(-60));
    ok(`${tag} set bubble 2 = both size charts labelled`, /^Lace Top\n• S/.test(out[1]) && out[1].includes('\n\nLace Skirt · Kem\n• S'), out[1].slice(0, 30));
    ok(`${tag} set bubble 3 = IG02 measurement request, bubble 4 = post link`, out[2] === 'Nếu bạn cần tư vấn thêm về size, cho Soft xin số đo 3 vòng, chiều cao và cân nặng nhen 💕' && out[3] === 'https://instagram.com/softembrace.made/p/DUQkDk6kTDg/');
    ok(`${tag} set: all 4 clipboard writes happened`, out.length === 4 && (await clip(page)).length === 4);
    await page.context().close();
  }
  {
    // suggested pair: price check guard; preview==clipboard across leads for bubbles a/b, VI + EN
    const { page } = await fresh({ w, h });
    await page.tap('[data-act=replies]'); await page.waitForTimeout(450);
    ok(`${tag} replies lists suggested pairs (only existing products)`, (await page.$$('[data-act=setsugg]')).length === 9);
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
          const pvx = await page.$eval(`.bub[data-b=${bb}] .bp`, e => e.textContent);
          await page.tap(`.bub[data-b=${bb}] [data-act=bcopy]`); await page.waitForTimeout(40);
          const c = await clip(page); n++; if (c[c.length - 1] !== pvx) bad++;
        }
      }
    }
    ok(`${tag} set bubbles a/b: preview == clipboard across leads VI/EN`, bad === 0 && n >= 10, `n=${n} bad=${bad}`);
    await page.context().close();
  }
  {
    const { page } = await fresh({ w, h });
    await page.tap('[data-act=replies]'); await page.waitForTimeout(450);
    const labels = await page.$$eval('[data-open^="f:"] .t', e => e.map(x => x.textContent));
    ok(`${tag} replies include IG paid-ack, paid-thanks, tracking(2 bubbles), feedback`, ['Đã nhận (tin 1)', 'Cảm ơn (tin 2)', 'Gửi mã vận đơn (tin 1)', 'Mã vận đơn (tin 2)', 'Xin hình feedback'].every(x => labels.includes(x)), labels.join('|'));
    await page.tap('[data-open="f:tracking-code"]'); await page.waitForTimeout(450);
    ok(`${tag} tracking code bubble blocked until code typed`, await page.$eval('#mcopy', e => e.disabled));
    await page.fill('[data-fill=trackingCode]', 'GHN123456'); await page.waitForTimeout(100);
    await page.tap('#mcopy'); await page.waitForTimeout(100);
    ok(`${tag} tracking code bubble = just the code`, (await clip(page))[0] === 'GHN123456');
    await page.context().close();
  }
  {
    const { page } = await fresh({ w, h });
    await page.tap('[data-open="p:lace-top"]'); await page.waitForTimeout(450);
    const url = 'https://instagram.com/softembrace.made/p/DUQkDk6kTDg/';
    ok(`${tag} link chip off by default (preview has no link)`, !(await prev(page)).includes(url) && await page.$eval('[data-act=linktoggle]', e => e.getAttribute('aria-pressed') === 'false'));
    await page.tap('[data-act=linktoggle]');
    ok(`${tag} link chip on: preview ends with link`, (await prev(page)).endsWith('\n\n' + url));
    await page.tap('[data-act=pcopy][data-a=info]'); await page.waitForTimeout(500); await page.tap('[data-act=pcopy][data-a=info]'); await page.waitForTimeout(100);
    const c = await clip(page); ok(`${tag} link chip: clipboard == preview`, c[0] === (await prev(page)) && c[0].endsWith(url));
    await page.context().close();
    const o = await fresh({ w, h, storage: { draft: { lines: [{ pid: 'lace-top', size: 'M', qty: 1 }], ship: 'fee', custom: 0, info: '', bank: false, copiedAt: 0 }, set: { lang: 'vi', fee: 24000, bank: { name: '', no: '', holder: '' } }, ov: { 'lace-top': { price: 420000 } } } });
    await o.page.tap('[data-act=openorder]'); await o.page.waitForTimeout(500); await o.page.tap('[data-act=copyorder]'); await o.page.waitForTimeout(100);
    const oc = (await clip(o.page))[0]; ok(`${tag} order recap total 420.000đ + 24.000đ = 444.000đ`, /Tổng cộng là 444\.000đ/.test(oc) && /Shipping: 24\.000đ/.test(oc), oc.split('\n').slice(-4).join('|'));
    await o.page.context().close();
  }
  {
    const ctx = { itemId: 'lace-top', size: 'M', at: Date.now() };
    const { page } = await fresh({ w, h, storage: { ctx } });
    const s = await clicks(page);
    await page.tap('[data-act=replies]'); await page.waitForTimeout(450);
    await page.tap('[data-open="f:fit-size"]'); await page.waitForTimeout(450);
    await page.tap('#mcopy'); await page.waitForTimeout(100);
    const c = await clip(page);
    ok(`${tag} size-advice script = 3 taps with ctx pre-fill`, (await clicks(page)) - s === 3 && c.length === 1 && /M/.test(c[0]) && !/\{\{/.test(c[0]));
    await page.context().close();
  }
  // --- preview == clipboard for each lead combo
  for (const lang of ['vi', 'en']) {
    const { page } = await fresh({ w, h, storage: { set: { lang, fee: 25000, bank: { name: '', no: '', holder: '' } } } });
    let bad = [], n = 0;
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
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
        await page.tap(`.acard [data-act=pcopy]`); await page.waitForTimeout(40);
        const c = await clip(page); n++;
        if (norm(c[c.length - 1]) !== norm(pv) || c[c.length - 1] !== pv) bad.push(a + combo.join(','));
      }
    }
    ok(`${tag} preview == clipboard, every lead combo, ${lang} (${n} combos)`, bad.length === 0 && n > 20, bad.slice(0, 3).join('|'));
    // order & set & thanks
    await page.context().close();
  }
  {
    const { page } = await fresh({ w, h });
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    await page.tap('[data-act=addline][data-v=M]'); await closeSheet(page);
    await page.tap('[data-act=openorder]'); await page.waitForTimeout(500);
    await page.tap('[data-act=prevtoggle]'); await page.waitForTimeout(100);
    let bad = 0, n = 0;
    for (const lang of ['vi', 'en']) {
      if (lang === 'en') { await page.tap('.sheet [data-act=lang][data-v=en]'); await page.waitForTimeout(150); }
      const ids = await page.$$eval('.ofoot [data-lead=order] .lchip[data-act=lead]', e => e.map(x => x.dataset.id));
      for (const id of ids) {
        const cur = await page.$eval('.ofoot [data-lead=order] .lchip[aria-pressed=true]', e => e.dataset.id);
        if (cur !== id) await page.tap(`.ofoot [data-lead=order] .lchip[data-id="${id}"]`);
        const pv = await page.$eval('#ordprev', e => e.textContent);
        await page.tap('[data-act=copyorder]'); await page.waitForTimeout(40);
        const c = await clip(page); n++; if (c[c.length - 1] !== pv) bad++;
      }
      // thanks
      const tids = await page.$$eval('.ocard [data-lead=thanks] .lchip[data-act=lead]', e => e.map(x => x.dataset.id));
      for (const id of tids) {
        const cur = await page.$eval('.ocard [data-lead=thanks] .lchip[aria-pressed=true]', e => e.dataset.id);
        if (cur !== id) await page.tap(`.ocard [data-lead=thanks] .lchip[data-id="${id}"]`);
        await page.tap('[data-act=thank]'); await page.waitForTimeout(40);
        const c = await clip(page); const exp = await page.evaluate(([l]) => window.__SE.composeCopy('thanks', { sel: {} }, l).text, [lang]);
        n++; const leadTxt = await page.$eval(`.ocard [data-lead=thanks] .lchip[data-id="${id}"]`, e => e.getAttribute('title') || '');
        if (id && !c[c.length - 1].startsWith(leadTxt)) bad++;
      }
    }
    ok(`${tag} order+thanks: preview == clipboard across leads VI/EN`, bad === 0 && n >= 14, `n=${n} bad=${bad}`);
    await page.context().close();
  }
  // --- memory
  {
    const { page } = await fresh({ w, h });
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    await page.tap('[data-lead=info] .lchip[data-id="li-info-3"]');
    await page.tap('[data-act=pcopy][data-a=info]'); await page.waitForTimeout(300);
    await closeSheet(page);
    await page.tap('[data-open="p:shimmer-top"]'); await page.waitForTimeout(450);
    ok(`${tag} lead memory after successful copy`, await page.$eval('[data-lead=info] .lchip[aria-pressed=true]', e => e.dataset.id) === 'li-info-3');
    await page.tap('[data-lead=info] .lchip[data-id="li-info-4"]'); await closeSheet(page);
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    ok(`${tag} lead NOT remembered without copy`, await page.$eval('[data-lead=info] .lchip[aria-pressed=true]', e => e.dataset.id) === 'li-info-3');
    // add lead
    await page.tap('[data-lead=info] [data-act=leadadd]'); await page.fill('[data-lfi]', 'Câu thử của mình 🌷'); await page.tap('[data-act=leadsave]'); await page.waitForTimeout(100);
    const first = await page.$eval('[data-lead=info] .lchip[data-act=lead][data-id^="lu-"]', e => [e.getAttribute('aria-pressed'), e.previousElementSibling.textContent]);
    ok(`${tag} add lead: chip first-after-Không kèm & selected, preview starts with it`, first[0] === 'true' && (await prev(page)).startsWith('Câu thử của mình 🌷'));
    await page.tap('[data-act=pcopy][data-a=info]'); await page.waitForTimeout(300);
    await page.reload(); await page.waitForTimeout(400);
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    ok(`${tag} added lead survives reload (selected after copy)`, await page.$eval('[data-lead=info] .lchip[aria-pressed=true]', e => e.textContent.includes('Câu thử')));
    ok(`${tag} custom VI lead hidden in EN`, await (async () => { await page.tap('.sheet [data-act=lang][data-v=en]'); await page.waitForTimeout(100); return !(await page.$$eval('[data-lead=info] .lchip', e => e.map(x => x.textContent).join('|'))).includes('Câu thử'); })());
    await page.tap('.sheet [data-act=lang][data-v=vi]'); await page.waitForTimeout(100);
    // long-press edit/delete
    const chip = await page.$('[data-lead=info] .lchip[data-id^="lu-"]'); const bb = await chip.boundingBox();
    await page.evaluate(([x, y]) => { const el = document.elementFromPoint(x, y); const mk = t => new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, pointerId: 1, pointerType: 'touch' }); el.dispatchEvent(mk('pointerdown')); }, [bb.x + 20, bb.y + 10]);
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
    await page.tap('[data-open="p:lace-top"]'); await page.waitForTimeout(450);
    ok(`${tag} quiet truncated line present, no modal`, await page.isVisible('.qwarn') && !(await page.$('.dlg')));
    await page.tap('[data-act=pcopy][data-a=info]'); await page.waitForTimeout(100);
    ok(`${tag} trunc: 1st tap no clipboard + guard text`, (await clip(page)).length === 0 && /chạm lần nữa/.test(await page.textContent('.acard .btn')));
    await page.tap('[data-act=pcopy][data-a=info]'); await page.waitForTimeout(100);
    ok(`${tag} trunc: 2nd tap <400ms ignored`, (await clip(page)).length === 0);
    await page.waitForTimeout(500);
    await page.tap('[data-act=pcopy][data-a=info]'); await page.waitForTimeout(100);
    ok(`${tag} trunc: 2nd tap in window copies`, (await clip(page)).length === 1);
    await page.waitForTimeout(1500);
    await page.tap('[data-act=pcopy][data-a=info]'); await page.waitForTimeout(3300);
    await page.tap('[data-act=pcopy][data-a=info]'); await page.waitForTimeout(100);
    ok(`${tag} trunc: guard expires after 3s (re-arms, no copy)`, (await clip(page)).length === 1);
    await page.context().close();
  }
  // --- missing EN
  {
    const { page } = await fresh({ w, h, storage: { ov: { 'noir-midi-skirt': { descEn: '' } }, set: { lang: 'en', fee: 25000, bank: { name: '', no: '', holder: '' } } } });
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    ok(`${tag} missing EN: disabled button, no copy`, /Chưa có bản EN/.test(await page.textContent('.acard .btn')));
    await page.tap('[data-act=pcopyalt]'); await page.waitForTimeout(100);
    const c = await clip(page); const t = await page.textContent('.toast');
    ok(`${tag} missing EN: Chép bản VI copies VI + toast · VI`, c.length === 1 && /Màu|Dáng|Chân váy/.test(c[0]) && /VI/.test(t), t);
    await page.context().close();
  }
  // --- hint
  {
    const { page } = await fresh({ w, h });
    ok(`${tag} hint visible on first run`, await page.isVisible('#hint'));
    await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(450);
    await page.tap('[data-act=pcopy][data-a=info]'); await page.waitForTimeout(500);
    ok(`${tag} hint gone after first copy`, !(await page.isVisible('#hint')));
    await page.waitForTimeout(400); await page.reload(); await page.waitForTimeout(300);
    ok(`${tag} hint stays gone after reload`, !(await page.isVisible('#hint')));
    await page.context().close();
    const o2 = await fresh({ w, h }); await o2.page.tap('[data-act=hintx]'); ok(`${tag} hint ✕ dismisses`, !(await o2.page.isVisible('#hint'))); await o2.page.context().close();
  }
}
// --- perf at 4x CPU
{
  const { page, ctx } = await fresh();
  const cdp = await ctx.newCDPSession(page); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.tap('[data-open="p:noir-midi-skirt"]'); await page.waitForTimeout(800);
  const m = await page.evaluate(async () => {
    const out = [];
    const btn = document.querySelector('[data-act=pcopy][data-a=info]');
    for (let i = 0; i < 12; i++) { const t0 = performance.now(); btn.click(); const t1 = performance.now(); out.push(t1 - t0); await new Promise(r => setTimeout(r, 200)); }
    const seal = btn.classList.contains('copied');
    return { out, seal };
  });
  const sorted = m.out.slice().sort((a, b) => a - b);
  console.log('copy handler 4x CPU ms:', m.out.map(x => x.toFixed(1)).join(' '), 'median', sorted[6].toFixed(1));
  ok('copy handler median <16ms at 4x CPU', sorted[6] < 16, 'median ' + sorted[6].toFixed(1) + ' max ' + sorted[11].toFixed(1) + ' first ' + m.out[0].toFixed(1));
  const so = await page.evaluate(() => { const t0 = performance.now(); document.querySelector('#home'); return 0; });
  // open sheet time
  await page.tap('.sheet [data-act=shclose]'); await page.waitForTimeout(500);
  const ot = await page.evaluate(async () => { const r = document.querySelector('[data-open="p:lace-top"]'); const t0 = performance.now(); r.click(); const t1 = performance.now(); await new Promise(rr => requestAnimationFrame(() => requestAnimationFrame(rr))); return [t1 - t0, performance.now() - t0]; });
  console.log('open product sheet handler / to 2nd frame (4x):', ot.map(x => x.toFixed(1)).join(' / '));
  await ctx.close();
}
await b.close(); srv.close();
const f = R.filter(r => !r[1]); console.log(`\n${R.length - f.length}/${R.length} passed`); if (f.length) console.log(f.map(x => x.join(' ')).join('\n'));
