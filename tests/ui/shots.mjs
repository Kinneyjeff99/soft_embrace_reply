// Regenerates shots/ (current screens only): 393x852 and 430x932, light and dark, as a home-screen app (59/34 insets).
// The 20-screenshot QA list of design-v6 section 16 (shots/{w}-{mode}-v6-NN-*.png) + the screens v6 did not change (home, Sản phẩm, product sheet, set sheet, settings) + the safe-area wrapper simulations.
import { serve, launch, newPage } from './lib.mjs';
import fs from 'node:fs';
process.env.NO_SYNTH = '1';
const OUT = '/home/user/soft_embrace_reply/shots';
for (const f of fs.readdirSync(OUT)) if (f !== 'icon-preview.png') fs.unlinkSync(OUT + '/' + f);
const { srv, url } = await serve(); const b = await launch();
const INS = { top: 59, bottom: 34 };
const REC = (...ids) => ids.map((p, i) => ({ p, at: Date.now() - i * 1000 }));
for (const [w, h] of [[393, 852], [430, 932]]) for (const dark of [false, true]) {
  const cnt = {}; const mode = dark ? 'dark' : 'light';
  const { page: p, ctx, errors } = await newPage(b, { w, h, dark, insets: INS, standalone: true, storage: { rp: REC('lace-top', 'lace-skirt-cream', 'butter-top', 'fleur-slip-dress-blue'), set: { lang: 'vi', fee: 25000, bank: { name: 'Vietcombank', no: '0123456789', holder: 'SOFT EMBRACE' } } } });
  await p.goto(url); await p.waitForTimeout(450);
  const sh = async (name, tag = 'v6-') => { if (name !== 'new-customer-toast' && name !== 'greet-empty') await p.evaluate(() => { document.querySelector('#toast').innerHTML = ''; }); await p.waitForTimeout(550); await p.screenshot({ path: `${OUT}/${w}-${mode}-${tag}${String(cnt[tag] = (cnt[tag] || 0) + 1).padStart(2, '0')}-${name}.png` }); };
  const tap = async (s, ms = 250) => { await p.tap(s); await p.waitForTimeout(ms); };
  const stage = id => tap(`#stseg [data-v=${id}]`, 300);
  const close = async () => { await p.tap('.sheet >> nth=-1 >> [data-act=shclose]'); await p.waitForTimeout(450); };
  const top = () => p.evaluate(() => { document.querySelector('#qr').scrollTop = 0; });
  await tap('#home [data-v=greet]');
  await sh('greet-empty');
  await tap('[data-card=greet] .sc[data-pid] >> nth=0'); await sh('greet-one');
  await tap('[data-card=greet] .sc[data-pid] >> nth=1'); await tap('[data-card=greet] .sc[data-pid] >> nth=2'); await top(); await sh('greet-two-long');
  await tap('#ctxbar .ctxbar', 800); await tap('.sheet .trow [data-act=pksize][data-v=M] >> nth=0'); await sh('picker-context'); await close();
  await tap('[data-act=newcust]', 500); await stage('order'); await tap('[data-act=oadd2]', 800); await tap('.sheet .pcell[data-pid="lace-top"] >> nth=0'); await sh('picker-order-tray');
  await p.fill('.sheet [data-pkq]', 'zzzz'); await sh('picker-search-empty'); await close();
  await stage('size'); await top(); await sh('size-empty');
  await tap('[data-card=sizes] .sc[data-pid="lace-top"]'); await tap('[data-card=sizes] .sc[data-pid="lace-skirt-cream"]'); await top(); await sh('size-two');
  await tap('[data-card=sizes] input[data-in=sizeask]', 200).catch(() => {}); await p.evaluate(() => document.querySelector('[data-card=fit-size]').scrollIntoView({ block: 'start' })); await tap('[data-card=fit-size] [data-act=fitsize][data-v=M]', 400); await sh('size-fit');
  await stage('info'); await top(); await sh('info');
  await tap('[data-act=newcust]', 500); await stage('order'); await top(); await sh('order-empty');
  await stage('greet'); await tap('[data-card=greet] .sc[data-pid="lace-top"]'); await tap('[data-card=greet] .sc[data-pid="lace-skirt-cream"]'); await stage('order'); await top();
  await tap('#stage [data-line="lace-top:"] [data-act=lnsize][data-v=M]'); await top(); await sh('order-sizeless');
  await tap('#stage [data-line="lace-skirt-cream:"] [data-act=lnsize][data-v=S]'); await top(); await sh('order-ready');
  await p.evaluate(() => { document.querySelector('#qr').scrollTop = 99999; }); await sh('order-scrolled-end');
  await tap('[data-act=shipopen]', 600); await tap('.sheet [data-act=shippick][data-v=custom]', 400); await p.fill('.sheet [data-in=custom]', '30000'); await sh('order-ship-sheet'); await tap('.sheet [data-act=shipdone]', 550);
  await p.evaluate(() => { navigator.clipboard.readText = () => Promise.resolve('Nguyễn Thị Ngọc Anh\n0900 000 000\n12 Lê Lợi, Q1, TP.HCM'); });
  await tap('.recvrow [data-act=pasteinfo]', 400); await p.evaluate(() => { document.querySelector('#qr').scrollTop = 99999; }); await sh('order-receiver-open');
  await tap('#obtn', 400); await tap('[data-act=toastact]', 500);
  await tap('[data-card=pay] .mb[data-b="1"] [data-act=cardcopy]', 400); await top(); await sh('checkout');
  await stage('size'); await tap('[data-card=fit-size] .mact [data-act=cardedit]', 700); await p.fill('.sheet [data-eta]', 'Dạ bạn mặc size M mẫu Lace Top sẽ vừa vặn nhen 🌷'); await sh('edit-sheet'); await close();
  await tap('[data-card=sizes] [data-act=cardcopy]', 700); await sh('stage-done-marks');
  await tap('[data-act=newcust]', 500); await sh('new-customer-toast');
  // screens v6 did not change
  await tap('[data-act=toastact]', 400); await tap('#fbar [data-v=home]'); await sh('home-resume', '');
  await p.evaluate(() => { window.__SE.st.draft.lines.length = 0; window.__SE.st.draft.done = {}; }); await p.reload(); await p.waitForTimeout(500); await sh('home', '');
  await tap('#fbar [data-v=pi]'); await sh('san-pham-theo-mau', '');
  await tap('[data-open="p:lace-top"]', 700); await sh('product-sheet-thong-tin', ''); await tap('.sheet #pseg [data-v=size]'); await sh('product-sheet-bang-size', ''); await close();
  await tap('[data-act=pview][data-v=s]'); await tap('[data-act=setsugg] >> nth=0', 700); await sh('set-sheet', ''); await close();
  await tap('#nav [data-act=settings]', 600); await sh('settings', ''); await close();
  if (errors.length) console.log('ERRORS', w, mode, errors.join(';'));
  await ctx.close();
}
// ---- safe-area wrapper simulations + SE + keyboard (design-v5 4.3 / design-v6 7.4)
{
  const base = { dark: true, standalone: true };
  let o = await newPage(b, { w: 430, h: 932, ...base, insets: INS });
  await o.page.route('**/host.html', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><html style="padding:59px 0 34px;background:#1C1D1C"><body style="margin:0;background:#1C1D1C"><iframe src="index.html" style="position:fixed;left:0;right:0;top:59px;bottom:34px;width:100%;height:calc(100% - 93px);border:0"></iframe></body></html>' }));
  await o.page.goto(url + 'host.html'); await o.page.waitForTimeout(800); await o.page.screenshot({ path: OUT + '/430-host-frame-dark.png' }); await o.ctx.close();
  o = await newPage(b, { w: 393, h: 852, dark: false, standalone: true, insets: INS }); await o.page.route('**/host.html', r => r.fulfill({ contentType: 'text/html', body: '<!doctype html><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><html style="padding:59px 0 34px;background:#F6F4EE"><body style="margin:0;background:#F6F4EE"><iframe src="index.html" style="position:fixed;left:0;right:0;top:59px;bottom:34px;width:100%;height:calc(100% - 93px);border:0"></iframe></body></html>' }));
  await o.page.goto(url + 'host.html'); await o.page.waitForTimeout(800); await o.page.screenshot({ path: OUT + '/393-host-frame-light.png' }); await o.ctx.close();
  o = await newPage(b, { w: 375, h: 667, standalone: true, insets: { top: 20, bottom: 0 }, storage: { rp: REC('lace-top') } }); await o.page.goto(url); await o.page.waitForTimeout(500);
  await o.page.evaluate(() => document.querySelector('#home [data-v=order]').click()); await o.page.waitForTimeout(500); await o.page.screenshot({ path: OUT + '/375-se-order-empty.png' }); await o.ctx.close();
  o = await newPage(b, { w: 430, h: 932, dark: true, standalone: true, insets: INS }); await o.page.goto(url + '#debug=insets'); await o.page.waitForTimeout(500); await o.page.screenshot({ path: OUT + '/430-debug-insets-overlay-dark.png' }); await o.ctx.close();
  o = await newPage(b, { w: 430, h: 932, dark: true, fakeVV: true, standalone: true, insets: INS, storage: { draft: { lines: [{ pid: 'lace-top', size: 'M', qty: 1 }, { pid: 'lace-skirt-cream', size: 'S', qty: 1 }], ship: 'courier', custom: 0, info: '', bank: true, copiedAt: 0, done: {}, at: Date.now() } } }); await o.page.goto(url); await o.page.waitForTimeout(400);
  await o.page.evaluate(() => document.querySelector('#home [data-v=order]').click()); await o.page.waitForTimeout(300); await o.page.tap('[data-act=recvtoggle]'); await o.page.waitForTimeout(200);
  await o.page.focus('[data-in=info]'); await o.page.evaluate(() => window.__setKb(336)); await o.page.waitForTimeout(500); await o.page.screenshot({ path: OUT + '/430-order-receiver-keyboard-dark.png' }); await o.ctx.close();
}
await b.close(); srv.close();
console.log(fs.readdirSync(OUT).length + ' files in shots/');
