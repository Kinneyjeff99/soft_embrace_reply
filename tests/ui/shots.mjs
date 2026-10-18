// Regenerates shots/ (current screens only): 393x852 and 430x932, light and dark, as a home-screen app (59/34 insets), plus the
// safe-area wrapper simulations. icon-preview.png comes from tools/make_icons.py and is kept.
import { serve, launch, newPage } from './lib.mjs';
import fs from 'node:fs';
const OUT = '/home/user/soft_embrace_reply/shots';
for (const f of fs.readdirSync(OUT)) if (f !== 'icon-preview.png') fs.unlinkSync(OUT + '/' + f);
const { srv, url } = await serve(); const b = await launch();
const INS = { top: 59, bottom: 34 };
for (const [w, h] of [[393, 852], [430, 932]]) for (const dark of [false, true]) {
  let n = 0; const mode = dark ? 'dark' : 'light';
  const sh = async (p, name) => { await p.waitForTimeout(550); await p.screenshot({ path: `${OUT}/${w}-${mode}-${String(++n).padStart(2, '0')}-${name}.png` }); };
  const { page: p, ctx } = await newPage(b, { w, h, dark, insets: INS, standalone: true }); await p.goto(url); await p.waitForTimeout(450);
  const tap = async (s, ms = 250) => { await p.tap(s); await p.waitForTimeout(ms); };
  const close = async () => { await p.tap('.sheet >> nth=-1 >> [data-act=shclose]'); await p.waitForTimeout(450); };
  await sh(p, 'home');
  await tap('#home [data-v=size]'); await sh(p, 'stage-tu-van-size');
  await tap('[data-open="f:ask-measurements"]', 500); await sh(p, 'message-sheet'); await close();
  await tap('#stseg [data-v=greet]'); await tap('[data-act=pchoose]', 500); await sh(p, 'product-picker-filters'); await close();
  await tap('#stseg [data-v=order]'); await sh(p, 'tao-don-empty');
  await tap('#ores [data-act=oadd] >> nth=0'); await tap('#ores [data-act=oadd] >> nth=1');
  await p.fill('[data-in=info]', 'Nguyễn Thị A, 0900 000 000, 12 Lê Lợi, Q1, TP.HCM'); await p.waitForTimeout(150);
  await tap('#stage .ddrow[data-lead=order]', 500); await tap('.sheet >> nth=-1 >> [data-act=leadpick][data-id="li-order-2"]', 700);
  await p.evaluate(() => { document.querySelector('#qr').scrollTop = 0; }); await sh(p, 'tao-don-order-stage');
  await p.evaluate(() => { document.querySelector('#qr').scrollTop = 520; }); await sh(p, 'tao-don-message-box');
  await p.evaluate(() => { document.querySelector('#qr').scrollTop = 0; });
  await tap('#olines .lrow', 500); await sh(p, 'line-editor-sheet'); await close();
  await tap('#fbar [data-v=pi]'); await sh(p, 'san-pham-theo-mau');
  await p.evaluate(() => { document.querySelector('#pi').scrollTop = 1250; }); await sh(p, 'san-pham-scrolled'); await p.evaluate(() => { document.querySelector('#pi').scrollTop = 0; });
  await tap('#pfilt [data-v=skirt]'); await sh(p, 'san-pham-filter-vay'); await tap('#pfilt [data-v=all]');
  await tap('[data-open="p:lace-top"]', 600); await sh(p, 'product-sheet-thong-tin');
  await tap('.sheet #pseg [data-v=size]'); await sh(p, 'product-sheet-bang-size');
  await tap('.sheet #pseg [data-v=both]'); await sh(p, 'product-sheet-ca-hai'); await tap('.sheet #pseg [data-v=info]');
  await tap('.sheet [data-lead=info]', 600); await sh(p, 'opening-line-picker');
  await tap('.sheet >> nth=-1 >> [data-act=leadpick][data-id="li-info-3"]', 150); await sh(p, 'strip-arrival');
  await p.waitForTimeout(900); await p.fill('.sheet [data-eta=info]', 'Bản sửa tay của mình 🌷\n' + await p.$eval('.sheet [data-eta=info]', e => e.value)); await sh(p, 'product-sheet-edited-strip');
  await p.evaluate(() => { document.querySelector('.sheet .shb').scrollTop = 9999; }); await sh(p, 'product-sheet-sections');
  await close();
  await tap('[data-act=pview][data-v=s]'); await sh(p, 'theo-set');
  await tap('[data-act=setsugg] >> nth=0', 600); await sh(p, 'set-sheet-fresh');
  await tap('.bcard[data-b=a] .bbtn .btn'); await p.waitForTimeout(500); await tap('.bcard[data-b=a] .bbtn .btn', 900); await sh(p, 'set-sheet-after-tin-1');
  await p.evaluate(() => { document.querySelector('.sheet .shb').scrollTop = 99999; }); await sh(p, 'set-sheet-cards');
  for (const bb of ['b', 'c', 'd']) { await tap(`.bcard[data-b=${bb}] .bbtn .btn`, 120); }
  await sh(p, 'set-sheet-done'); await close();
  await tap('#nav [data-act=settings]', 500); await sh(p, 'settings');
  await tap('[data-p="leads"]', 350); await tap('[data-p="leadlist:info"]', 350); await sh(p, 'settings-cau-mo-dau'); await close();
  await tap('#fbar [data-v=home]'); await sh(p, 'home-with-order-badge');
  await ctx.close();
  { // English
    const o = await newPage(b, { w, h, dark, insets: INS, standalone: true, storage: { set: { lang: 'en', fee: 25000, bank: { name: '', no: '', holder: '' } } } }); await o.page.goto(url); await o.page.waitForTimeout(450);
    await o.page.tap('#home [data-v=greet]'); await o.page.waitForTimeout(250); await o.page.tap('[data-open="f:open-first"]'); await sh(o.page, 'english-message-sheet'); await o.ctx.close();
  }
}
// ---- safe-area wrapper simulations (spec 4.3)
{
  const base = { dark: true, standalone: true };
  let o = await newPage(b, { w: 430, h: 932, ...base, insets: INS });
  await o.page.route('**/host.html', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><html style="padding:59px 0 34px;background:#1C1D1C"><body style="margin:0;background:#1C1D1C"><iframe src="index.html" style="position:fixed;left:0;right:0;top:59px;bottom:34px;width:100%;height:calc(100% - 93px);border:0"></iframe></body></html>' }));
  await o.page.goto(url + 'host.html'); await o.page.waitForTimeout(800); await o.page.screenshot({ path: OUT + '/430-host-frame-dark.png' }); await o.ctx.close();
  o = await newPage(b, { w: 430, h: 932, ...base, insets: INS }); await o.page.addInitScript(() => { document.documentElement.style.padding = '59px 0 34px'; }); await o.page.goto(url); await o.page.waitForTimeout(600); await o.page.screenshot({ path: OUT + '/430-host-root-padded-dark.png' }); await o.ctx.close();
  o = await newPage(b, { w: 430, h: 932, ...base, insets: INS }); await o.page.goto(url); await o.page.waitForTimeout(300);
  await o.page.addStyleTag({ content: '#app{bottom:34px!important}' }); await o.page.evaluate(() => window.__SE.measure()); await o.page.waitForTimeout(300); await o.page.screenshot({ path: OUT + '/430-host-shrunk-box-dark.png' }); await o.ctx.close();
  o = await newPage(b, { w: 393, h: 852, dark: false, standalone: true, insets: INS }); await o.page.route('**/host.html', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><html style="padding:59px 0 34px;background:#F6F4EE"><body style="margin:0;background:#F6F4EE"><iframe src="index.html" style="position:fixed;left:0;right:0;top:59px;bottom:34px;width:100%;height:calc(100% - 93px);border:0"></iframe></body></html>' }));
  await o.page.goto(url + 'host.html'); await o.page.waitForTimeout(800); await o.page.screenshot({ path: OUT + '/393-host-frame-light.png' }); await o.ctx.close();
  o = await newPage(b, { w: 375, h: 667, standalone: true, insets: { top: 20, bottom: 0 } }); await o.page.goto(url); await o.page.waitForTimeout(500); await o.page.screenshot({ path: OUT + '/375-se-pwa.png' });
  await o.page.tap('#fbar [data-v=pi]'); await o.page.waitForTimeout(250); await o.page.tap('[data-open="p:lace-top"]'); await o.page.waitForTimeout(700); await o.page.screenshot({ path: OUT + '/375-se-product-sheet.png' }); await o.ctx.close();
  o = await newPage(b, { w: 430, h: 932, dark: true, standalone: true, insets: INS }); await o.page.goto(url + '#debug=insets'); await o.page.waitForTimeout(500); await o.page.screenshot({ path: OUT + '/430-debug-insets-overlay-dark.png' }); await o.ctx.close();
  o = await newPage(b, { w: 430, h: 932, dark: true, fakeVV: true, standalone: true, insets: INS }); await o.page.goto(url); await o.page.waitForTimeout(400);
  await o.page.tap('#home [data-v=order]'); await o.page.waitForTimeout(250); await o.page.tap('#ores [data-act=oadd] >> nth=0'); await o.page.focus('[data-eta=order]'); await o.page.evaluate(() => window.__setKb(336)); await o.page.waitForTimeout(500); await o.page.screenshot({ path: OUT + '/430-keyboard-open-dark.png' }); await o.ctx.close();
}
await b.close(); srv.close();
console.log(fs.readdirSync(OUT).length + ' files in shots/');
