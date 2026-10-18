// UAT: plays the founder on an iPhone (touch, DPR 3, clipboard permissions) with a fresh localStorage per scenario.
// Expected clipboard text comes from tests/uat/expect.mjs (src/data.json + docs/ig-reference), never from the app's own compose function.
//   node tests/uat/uat.mjs                       all scenarios, 2 viewports x light/dark
//   node tests/uat/uat.mjs S4 S6 --quick         only these scenarios, 393x852 light only
//   node tests/uat/uat.mjs --vp 430 --theme dark
// Results: docs/qa/uat-results.json, screenshots: docs/qa/shots/
process.env.NO_SYNTH = '1';   // test the real dist: no synthetic "truncated" flag on Lace Top
import fs from 'node:fs';
import { serve, launch } from '../ui/lib.mjs';
import * as X from './expect.mjs';

const ROOT = '/home/user/soft_embrace_reply', SHOTS = ROOT + '/docs/qa/shots';
fs.mkdirSync(SHOTS, { recursive: true });
const args = process.argv.slice(2);
const flag = n => { const i = args.indexOf('--' + n); return i > -1 ? args[i + 1] : null; };
const QUICK = args.includes('--quick');
const WANT = args.filter(a => /^S\d+/.test(a));
const VPS = (flag('vp') ? [[+flag('vp'), flag('vp') === '430' ? 932 : 852]] : QUICK ? [[393, 852]] : [[393, 852], [430, 932]]);
const THEMES = flag('theme') ? [flag('theme') === 'dark'] : QUICK ? [false] : [false, true];
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';

const { srv, url: URL_LOCAL } = await serve();
const URL0 = flag('url') || URL_LOCAL;   // --url to point the UAT at another build (used to prove the checks can fail)
const B = await launch();
const RES = [];
const t0 = Date.now();

// ---- spy installed before the app boots: records every clipboard write, can simulate failures, measures layout shift
const SPY = () => {
  window.__clip = []; window.__fail = false; window.__failWrite = false; window.__exec = 0; window.__cls = 0;
  try {
    const c = navigator.clipboard, w = c.writeText.bind(c);
    window.__w = w;
    c.writeText = function (t) { window.__clip.push(t); if (window.__fail || window.__failWrite) return Promise.reject(new DOMException('denied', 'NotAllowedError')); return w(t); };
  } catch (e) { window.__noclip = String(e); }
  const ex = document.execCommand.bind(document);
  document.execCommand = function (cmd, ...a) { if (cmd === 'copy') { window.__exec++; if (window.__fail) return false; } return ex(cmd, ...a); };
  try { new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); } catch (e) { /* ignore */ }
};

function esc(s) { return JSON.stringify(s).slice(1, -1); }
function diff(a, b) {
  if (a === b) return '';
  let i = 0; while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const ctx = s => esc(s.slice(Math.max(0, i - 12), i + 28));
  return `len got ${a.length} / want ${b.length}; first diff at ${i}: got "${ctx(a)}" want "${ctx(b)}"`;
}
// hygiene every copied message must satisfy
function hygiene(t) {
  const bad = [];
  if (/[ \t]+$/m.test(t)) bad.push('trailing space');
  if (/\n{3,}/.test(t)) bad.push('3+ newlines');
  if (t !== t.trim()) bad.push('leading/trailing whitespace');
  if (/\{\{|\}\}/.test(t)) bad.push('raw {{token}}');
  if (/\[(món|size|size 1|size 2|mã vận đơn|link hình|mẫu thay thế|kiểu dáng|giá|tổng)\]/.test(t)) bad.push('unfilled [token]');
  if (/undefined|null|NaN/.test(t)) bad.push('undefined/null/NaN');
  return bad.join(', ');
}

class Sess {
  constructor(sc, env, ctx, page, errors) { Object.assign(this, { sc, env, ctx, page, errors, taps: 0, scrolls: 0, path: [], n: 0, fails: 0 }); }
  get tag() { return `${this.env.w}x${this.env.h} ${this.env.dark ? 'dark' : 'light'}`; }
  wait(ms = 300) { return this.page.waitForTimeout(ms); }
  clips() { return this.page.evaluate(() => window.__clip.slice()); }
  async shot(name) { const f = `${SHOTS}/uat-${this.sc}-${this.env.w}-${this.env.dark ? 'dark' : 'light'}-${name}.jpg`; try { await this.page.screenshot({ path: f, type: 'jpeg', quality: 72 }); } catch (e) { return null; } return f.replace(ROOT + '/', ''); }
  // one real touch tap (counted). Elements outside the viewport count as a scroll.
  async tap(sel, note, force = false) {
    const loc = this.page.locator(sel).first();
    await loc.waitFor({ state: 'visible', timeout: 6000 });
    const inView = await loc.evaluate(el => { const r = el.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth; });
    if (!inView) this.scrolls++;
    await loc.tap({ timeout: 6000, force });
    this.taps++; this.path.push((note || sel) + (inView ? '' : ' (scroll)'));
    await this.wait(260);
  }
  async check(name, pass, note = '', extra = {}) {
    const r = { sc: this.sc, vp: this.env.w + 'x' + this.env.h, theme: this.env.dark ? 'dark' : 'light', name, pass: !!pass, note: String(note || '').slice(0, 600), ...extra };
    if (!pass) { this.fails++; r.shot = await this.shot('FAIL' + (++this.n)); }
    RES.push(r);
    console.log((pass ? 'PASS ' : 'FAIL ') + this.sc + ' ' + this.tag + ' ' + name + (pass ? '' : '  -> ' + note));
    return !!pass;
  }
  async limit(name, max, extra = '') {
    const r = { sc: this.sc, vp: this.env.w + 'x' + this.env.h, theme: this.env.dark ? 'dark' : 'light', name: name + ' (taps from app open)', pass: this.taps <= max, taps: this.taps, limit: max, scrolls: this.scrolls, note: this.path.join(' > ') + (extra ? ' | ' + extra : '') };
    if (!r.pass) r.shot = await this.shot('TAPS');
    RES.push(r);
    console.log((r.pass ? 'PASS ' : 'FAIL ') + this.sc + ' ' + this.tag + ' ' + r.name + ` actual ${this.taps}/${max}` + (this.scrolls ? ` (+${this.scrolls} scroll)` : ''));
    return r.pass;
  }
  // tap a copy control and assert exactly one clipboard write equal to `exp`, and the real clipboard holds it
  async copy(sel, exp, name, note) {
    const before = (await this.clips()).length;
    await this.tap(sel, note || name);
    await this.wait(350);
    const got = (await this.clips()).slice(before);
    const hy = got.length ? hygiene(got[got.length - 1]) : '';
    let real = null;
    try { real = await this.page.evaluate(() => navigator.clipboard.readText()); } catch (e) { real = 'READ-ERR ' + e.message; }
    const okMain = got.length === 1 && got[0] === exp;
    const okReal = real === exp || /^READ-ERR/.test(real || '');
    await this.check(name, okMain && okReal && !hy, got.length !== 1 ? `${got.length} clipboard writes` : diff(got[0] || '', exp) || (hy && 'hygiene: ' + hy) || (!okReal ? 'real clipboard differs: ' + diff(real, exp) : ''));
    if (/^READ-ERR/.test(real || '')) RES.push({ sc: this.sc, vp: this.env.w + 'x' + this.env.h, theme: this.env.dark ? 'dark' : 'light', name: 'real clipboard readback unavailable (spy log used)', pass: true, note: real });
    return got[0];
  }
  async noCopy(sel, name, note) {   // tapping must not write to the clipboard
    const before = (await this.clips()).length;
    await this.tap(sel, note || name, true); await this.wait(350);
    const n = (await this.clips()).length - before;
    await this.check(name, n === 0, n + ' unexpected clipboard writes');
  }
  async sheets() { return this.page.evaluate(() => document.querySelectorAll('#sheets .sh').length); }
  txt(sel) { return this.page.locator(sel).first().evaluate(e => e.textContent.replace(/\r/g, '')); }
  async pv(card) { return this.page.$eval(`#stage [data-card="${card}"] .pv`, e => e.textContent.replace(/\r/g, '')); }
}

async function open(sc, env, o = {}) {
  const ctx = await B.newContext({ viewport: { width: env.w, height: env.h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: env.dark ? 'dark' : 'light', locale: 'vi-VN', serviceWorkers: 'block', userAgent: UA, permissions: ['clipboard-read', 'clipboard-write'] });
  const page = await ctx.newPage();
  const errors = [];
  page.on('console', m => { if (['error', 'warning'].includes(m.type()) && !/Service Worker registration blocked/.test(m.text())) errors.push(m.type() + ': ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('requestfailed', r => errors.push('requestfailed: ' + r.url()));
  page.on('response', r => { if (r.status() >= 400) errors.push('http ' + r.status() + ': ' + r.url()); });
  await page.addInitScript(SPY);
  if (o.storage) await page.addInitScript(s => { try { if (!localStorage.getItem('se.v1')) localStorage.setItem('se.v1', s); } catch (e) { /* ignore */ } }, JSON.stringify(o.storage));
  await page.goto(URL0 + (o.hash || ''));
  await page.waitForTimeout(500);
  return new Sess(sc, env, ctx, page, errors);
}
const close = async S => { await S.check('zero console errors / failed requests', S.errors.length === 0, S.errors.join(' | ')); await S.ctx.close(); };

// ---------- selectors ----------
const tile = id => `#home .tile[data-v=${id}]`;
const cardCopy = id => `#stage [data-card="${id}"] [data-act=cardcopy]`;
const seqCopy = (id, n) => `#stage [data-card="${id}"] .mb[data-b="${n}"] [data-act=cardcopy]`;
const bub = (b, act = 'bcopy') => `.sheet .bcard[data-b="${b}"] [data-act=${act}]`;
const cell = pid => `.sheet .pcell[data-pid="${pid}"]`;
const PICK_DONE = '.sheet [data-act=pkdone]';
const LANG = l => `#lsw [data-act=lang][data-v=${l}]`;
const NOW = () => Date.now();
const seedDraft = (lines, extra = {}) => ({ draft: { lines, ship: 'courier', custom: 0, info: '', bank: true, copiedAt: 0, done: {}, at: NOW() }, ...extra });

// =====================================================================================================
const SC = {};

// S1 new customer asks about Lace Top: greeting + product info
SC.S1 = async env => {
  const S = await open('S1', env);
  await S.tap(tile('greet'), 'Home > Chào hỏi');
  await S.check('Chào hỏi opens with the greeting card, no product yet ("Chưa kèm mẫu")', /Chưa kèm mẫu/.test(await S.txt('[data-card=greet] .mm')));
  await S.tap('#stage [data-card=greet] [data-act=stripall]', 'Tất cả mẫu');
  await S.tap(cell('lace-top'), 'chọn Lace Top');
  await S.tap(PICK_DONE, 'Xong');
  await S.wait(500);
  const exp = X.greeting('new', ['lace-top']);
  await S.check('preview shows exactly the message that will be copied', (await S.pv('greet')) === exp, diff(await S.pv('greet'), exp));
  await S.shot('before-copy');
  await S.copy(cardCopy('greet'), exp, 'clipboard = Khách mới greeting + Lace Top info (exact)', 'Chép');
  await S.limit('S1 greeting + product info', 3);
  await S.check('Lace Top info block equals the founder\'s real IG07 message minus the link', X.desc('lace-top') === X.norm(X.IG.IG07.replace(/\n+https?:\/\/\S+\s*$/, '')), diff(X.desc('lace-top'), X.IG.IG07));
  await close(S);

  // alternative path through Sản phẩm (what a 3-tap budget would need): info only, then with the greeting lead-in and the post link
  const A = await open('S1b', env);
  await A.tap('#home [data-act=pgo][data-v=p]', 'Home > Theo mẫu');
  await A.tap('[data-open="p:lace-top"]', 'Lace Top row'); await A.wait(500);
  await A.copy('.sheet [data-act=pcopy]', X.desc('lace-top'), 'S1b Theo mẫu > Lace Top > Chép thông tin = info only (no greeting)', 'Chép thông tin');
  await A.limit('S1b info only via Theo mẫu', 3, 'no greeting included');
  await A.tap('.sheet label.swrow', 'Kèm link bài viết'); await A.wait(300);
  await A.copy('.sheet [data-act=pcopy]', X.norm(X.IG.IG07), 'S1b with post link toggled = IG07 verbatim (info + link)', 'Chép');
  await A.tap('.sheet [data-act=leadopen][data-a=info]', 'Câu mở đầu: Đổi'); await A.wait(450);
  await A.tap('.sheet [data-act=leadpick][data-id=li-info-1]', 'chọn câu chào'); await A.wait(500);
  const lead = X.D.leadIns.info[0].vi;
  await A.copy('.sheet [data-act=pcopy]', X.norm(lead + '\n\n' + X.IG.IG07), 'S1b greeting lead-in + IG07 = greeting + info + link', 'Chép');
  RES.push({ sc: 'S1b', vp: env.w + 'x' + env.h, theme: env.dark ? 'dark' : 'light', name: 'S1b greeting + info + link via product sheet (taps from app open, informational)', pass: true, taps: A.taps, limit: null, note: A.path.join(' > ') });
  await close(A);
};

// S2 returning customer, info for Butter Top in EN
SC.S2 = async env => {
  const S = await open('S2', env);
  await S.tap(tile('greet'), 'Home > Chào hỏi');
  await S.tap('#stage [data-act=greetv][data-v=back]', 'Khách cũ');
  await S.tap(LANG('en'), 'EN');
  await S.tap('#stage [data-card=greet] [data-act=stripset][data-pid="butter-top"]', 'Butter Top (strip)');
  await S.wait(300);
  const exp = X.greeting('back', ['butter-top'], 'en');
  await S.check('language is visible on the copy button ("Chép · EN")', /Chép · EN/.test(await S.txt(cardCopy('greet'))), await S.txt(cardCopy('greet')));
  await S.check('preview == expected EN returning greeting', (await S.pv('greet')) === exp, diff(await S.pv('greet'), exp));
  await S.shot('before-copy');
  await S.copy(cardCopy('greet'), exp, 'clipboard = returning-customer EN greeting + Butter Top EN info (exact)', 'Chép');
  await S.limit('S2 returning customer EN info', 5, 'limit not stated; 3 greeting-less would be the floor');
  const t = S.taps;
  await S.tap('#stage [data-act=greetv][data-v=info]', 'Chỉ thông tin');
  await S.copy(cardCopy('greet'), X.greeting('info', ['butter-top'], 'en'), 'S2b "Chỉ thông tin" EN = Butter Top EN info only (exact)', 'Chép');
  RES.push({ sc: 'S2', vp: env.w + 'x' + env.h, theme: env.dark ? 'dark' : 'light', name: 'S2 info-only variant taps (informational)', pass: true, taps: S.taps, limit: null, note: S.path.slice(t - 0).join(' > ') });
  await close(S);
};

// S3 customer sends measurements, asks size M of Lace Skirt: size chart of one product
SC.S3 = async env => {
  const S = await open('S3', env);
  await S.tap(tile('size'), 'Home > Tư vấn size');
  await S.tap('#stage [data-card=sizes] [data-act=stripall]', 'Tất cả mẫu');
  await S.tap(cell('lace-skirt-cream'), 'Lace Skirt Kem');
  await S.tap(PICK_DONE, 'Xong');
  await S.wait(500);
  const exp = X.sizes(['lace-skirt-cream']);
  await S.check('size hero preview == Lace Skirt size chart', (await S.pv('sizes')) === exp, diff(await S.pv('sizes'), exp));
  await S.shot('sizes');
  await S.copy(cardCopy('sizes'), exp, 'clipboard = Lace Skirt (Kem) size chart only (exact)', 'Chép');
  await S.limit('S3 size chart for one product', 3);
  // then the recommendation for M
  const tp = S.taps;
  await S.tap('#stage [data-card=fit-size] [data-act=fitsize][data-v=M]', 'Vừa size: M');
  await S.copy(cardCopy('fit-size'), X.fitSize('lace-skirt-cream', 'M'), 'S3b "Vừa size" M message with Lace Skirt chart (exact)', 'Chép');
  RES.push({ sc: 'S3', vp: env.w + 'x' + env.h, theme: env.dark ? 'dark' : 'light', name: 'S3b extra taps for the "size M" message', pass: true, taps: S.taps - tp, limit: null, note: 'taps after the chart was copied' });
  await close(S);
  const A = await open('S3b', env);   // alternative: Sản phẩm > product > Bảng size
  await A.tap('#home [data-act=pgo][data-v=p]', 'Home > Theo mẫu');
  await A.tap('[data-open="p:lace-skirt-cream"]', 'Lace Skirt row'); await A.wait(500);
  await A.tap('#pseg [data-v=size]', 'Bảng size'); await A.wait(250);
  await A.copy('.sheet [data-act=pcopy]', X.size('lace-skirt-cream'), 'S3-alt Theo mẫu > Lace Skirt > Bảng size > Chép = chart (exact)', 'Chép bảng size');
  await A.limit('S3-alt size chart via Theo mẫu', 3);
  await close(A);
};

// S4 / S5 sets
async function setFlow(sc, env, a, b, { custom = null, label }) {
  const S = await open(sc, env);
  await S.tap('#home [data-act=pgo][data-v=s]', 'Home > Theo set');
  await S.tap(`#hbody [data-act=setsugg][data-a="${a}"][data-sb="${b}"]`, `suggested set ${label}`); await S.wait(500);
  const ids = [a, b];
  if (custom) {
    await S.tap('.sheet [data-sprice]', 'Giá set'); await S.page.keyboard.type(String(custom)); await S.page.keyboard.press('Enter'); await S.wait(400);
    const line = await S.txt('.sheet #pline');
    await S.check('set price line shows retail prices and the set price', [X.vnd(X.P(a).price), X.vnd(X.P(b).price), X.vnd(X.P(a).price + X.P(b).price), X.vnd(custom)].every(s => line.includes(s)), line);
  }
  const hasLink = !!X.setBubble('d', ids);
  const n = hasLink ? 4 : 3;
  const nb = await S.page.$$eval('.sheet .bcard', e => e.map(x => x.dataset.b));
  await S.check(`set sheet has ${n} bubbles (${'abcd'.slice(0, n).split('').join(',')}), each with its own copy button`, nb.join('') === 'abcd'.slice(0, n) && (await S.page.$$('.sheet .bcard [data-act=bcopy]')).length === n, nb.join(','));
  await S.shot('set-sheet');
  const opt = { price: custom };
  // the suggestion's price is unchecked: the first tap arms, the second tap (>=400ms later) copies
  const expA = X.setBubble('a', ids, opt);
  const before = (await S.clips()).length;
  await S.tap(bub('a'), 'Chép tin 1 (arms)'); await S.wait(300);
  await S.check('unchecked set price: first tap does not copy ("Chạm lại để chép")', (await S.clips()).length === before && /Chạm lại/.test(await S.txt(bub('a'))), 'writes ' + ((await S.clips()).length - before) + ' label ' + await S.txt(bub('a')));
  await S.wait(300);
  await S.copy(bub('a'), expA, `bubble 1 = info of both + set price in ONE message (exact)`, 'Chép tin 1 (confirm)');
  await S.copy(bub('b'), X.setBubble('b', ids), 'bubble 2 = both size charts labelled by product (exact)', 'Chép tin 2');
  await S.copy(bub('c'), X.setBubble('c', ids), 'bubble 3 = measurement request IG02 (exact)', 'Chép tin 3');
  await S.check('bubble 3 equals IG02', X.setBubble('c', ids) === X.norm(X.IG.IG02));
  if (hasLink) await S.copy(bub('d'), X.setBubble('d', ids), 'bubble 4 = post link (exact)', 'Chép tin 4');
  await S.check('footer says all copied', /Đã chép đủ/.test(await S.txt('.sheet #sfoot')), await S.txt('.sheet #sfoot'));
  await S.limit(`${sc} set message sequence (${n} bubbles)`, hasLink ? 8 : 7);
  return S;
}
SC.S4 = async env => {
  let S = await setFlow('S4', env, 'lace-top', 'lace-skirt-cream', { label: 'Lace Top + Lace Skirt' });
  const a = X.setBubble('a', ['lace-top', 'lace-skirt-cream']);
  await S.check('S4 default set price = sum 850.000đ and no saving line', a.includes('• Giá set: 850.000đ') && !a.includes('tiết kiệm'));
  await close(S);
  S = await setFlow('S4b', env, 'lace-top', 'lace-skirt-cream', { custom: 800000, label: 'custom 800.000đ' });
  await S.check('S4b custom price 800.000đ shows retail and set lines + saving', X.setBubble('a', ['lace-top', 'lace-skirt-cream'], { price: 800000 }).endsWith('• Giá set: 800.000đ (tiết kiệm 50.000đ)'));
  await close(S);
};
SC.S5 = async env => {
  const ids = ['butter-top', 'embroidery-pants'];
  const S = await setFlow('S5', env, ids[0], ids[1], { label: 'Butter Top + Embroidery Pants' });
  await S.check('S5 source prices are 390.000đ and 520.000đ and the set quote is 910.000đ', X.P(ids[0]).price === 390000 && X.P(ids[1]).price === 520000 && X.setBubble('a', ids).includes('• Giá set: 910.000đ') && X.setBubble('a', ids).includes('Giá: 390.000đ') && X.setBubble('a', ids).includes('Giá: 520.000đ'), X.setBubble('a', ids));
  await close(S);
};

// S6 create an order
SC.S6 = async env => {
  const S = await open('S6', env);
  await S.tap(tile('order'), 'Home > Tạo đơn');
  await S.check('Tạo đơn opens with the message visible first (placeholder [món] for the empty order)', /Dạ vậy đơn của bạn/.test(await S.pv('order')), (await S.pv('order')).slice(0, 80));
  await S.tap('#stage [data-act=oadd2]', 'Thêm món');
  await S.tap(cell('lace-trim-blouse-cream'), 'Lace Trim Blouse Kem');
  await S.tap('.sheet .trow[data-pid="lace-trim-blouse-cream"] [data-act=pksize][data-v=M]', 'size M');
  await S.tap(PICK_DONE, 'Thêm 1 món vào đơn'); await S.wait(500);
  await S.tap('#stage [data-act=shipopen]', 'Phí ship');
  await S.tap('.sheet [data-act=shippick][data-v=custom]', 'Khác…');
  await S.page.keyboard.type('24000'); await S.wait(200);
  await S.tap('.sheet [data-act=shipdone]', 'Xong'); await S.wait(500);
  const lines = [{ id: 'lace-trim-blouse-cream', size: 'M', qty: 1 }], ship = { kind: 'custom', amount: 24000 };
  const exp = X.order(lines, ship);
  await S.check('order preview == expected recap', (await S.pv('order')) === exp, diff(await S.pv('order'), exp));
  await S.check('order button label is "Đơn" with badge 1', (await S.txt('#obtn2 > span')) === 'Đơn' && (await S.txt('#obtn2 .bd')) === '1', await S.txt('#obtn2'));
  await S.check('dock shows total 444.000đ', /444\.000đ/.test(await S.txt('#odock')), await S.txt('#odock'));
  await S.shot('order-dock');
  const got = await S.copy('#odock #obtn[data-act=copyorder]', exp, 'clipboard = OBS03 order recap: Lace Trim Blouse Kem M 420.000đ + ship 24.000đ = 444.000đ + transfer-note instruction (exact)', 'Chép đơn');
  await S.check('message has "Dạ vậy đơn của bạn", total 444.000đ and the Instagram-name transfer note', /^Dạ vậy đơn của bạn/.test(got || '') && (got || '').includes('Tổng cộng là 444.000đ') && /note tên Instagram/.test(got || '') && /ảnh chụp màn hình/.test(got || ''), got);
  await S.limit('S6 one-item order', 99, 'no limit stated');
  await close(S);

  // two items, quantity 2, free ship then custom ship
  const T = await open('S6b', env);
  await T.tap(tile('order'), 'Home > Tạo đơn');
  await T.tap('#stage [data-act=oadd2]', 'Thêm món');
  await T.tap(cell('lace-top'), 'Lace Top'); await T.tap(cell('butter-top'), 'Butter Top');
  await T.tap('.sheet .trow[data-pid="lace-top"] [data-act=pksize][data-v=M]', 'Lace Top M');
  await T.tap('.sheet .trow[data-pid="butter-top"] [data-act=pksize][data-v=S]', 'Butter Top S');
  await T.tap(PICK_DONE, 'Thêm 2 món'); await T.wait(500);
  await T.tap('#stage .lrow2[data-line="lace-top:M"] [data-act=lnqty][data-d="1"]', 'Lace Top x2');
  await T.tap('#stage [data-act=shipopen]', 'Phí ship');
  await T.tap('.sheet [data-act=shippick][data-v=free]', 'Miễn phí'); await T.wait(500);
  const L2 = [{ id: 'lace-top', size: 'M', qty: 2 }, { id: 'butter-top', size: 'S', qty: 1 }];
  await T.check('badge counts 3 pieces', (await T.txt('#obtn2 .bd')) === '3', await T.txt('#obtn2'));
  await T.shot('order-2items');
  await T.copy('#odock #obtn[data-act=copyorder]', X.order(L2, { kind: 'free' }), 'S6b 2 items (Lace Top M x2 + Butter Top S) free ship = 1.150.000đ (exact)', 'Chép đơn');
  await T.tap('#stage [data-act=shipopen]', 'Phí ship'); await T.tap('.sheet [data-act=shippick][data-v=custom]', 'Khác…');
  await T.page.keyboard.type('30000'); await T.wait(200); await T.tap('.sheet [data-act=shipdone]', 'Xong'); await T.wait(500);
  await T.copy('#odock #obtn[data-act=copyorder]', X.order(L2, { kind: 'custom', amount: 30000 }), 'S6c same order, custom ship 30.000đ = 1.180.000đ (exact)', 'Chép đơn');
  await T.tap('#stage [data-act=shipopen]', 'Phí ship'); await T.tap('.sheet [data-act=shippick][data-v=courier]', 'Khách trả shipper'); await T.wait(500);
  await T.copy('#odock #obtn[data-act=copyorder]', X.order(L2, { kind: 'courier' }), 'S6d courier-paid ship (default wording) = 1.150.000đ (exact)', 'Chép đơn');
  await T.check('order preview is still one group (no duplicate cards)', (await T.page.$$('#stage [data-card=order]')).length === 1);
  await close(T);
};

// S7 payment received / S8 tracking / S9 feedback
SC.S7 = async env => {
  const S = await open('S7', env);
  await S.tap(tile('out'), 'Home > Check out');
  await S.copy(seqCopy('pay', 1), X.norm(X.IG.IG03), 'S7 bubble 1 = IG03 "ui dạ mình nhận được rùi ạ" (exact)', 'Chép tin 1');
  await S.copy(seqCopy('pay', 2), X.norm(X.IG.IG04), 'S7 bubble 2 = IG04 thanks, ready-to-wear (exact, separate message)', 'Chép tin 2');
  await S.limit('S7 payment received (IG03 then IG04)', 3);
  await S.check('both bubbles were separate clipboard writes', (await S.clips()).length === 2);
  await S.shot('checkout-pay');
  await S.tap('#stage [data-act=thanksv][data-v=thanks-custom]', 'May đo');
  await S.copy(seqCopy('pay', 2), X.norm(X.FLOW('thanks-custom').vi), 'S7b custom (may đo) thanks (exact)', 'Chép tin 2');
  await S.tap('#stage [data-act=thanksv][data-v=paid-thanks]', 'Có sẵn');
  await S.copy(seqCopy('pay', 2), X.norm(X.IG.IG04), 'S7c switching back to Có sẵn gives IG04 again (exact)', 'Chép tin 2');
  await close(S);
  const T = await open('S7d', env, { storage: seedDraft([{ pid: 'noir-midi-skirt', size: 'S', qty: 1 }]) });
  await T.tap(tile('out'), 'Home > Check out');
  await T.check('made-to-order item in the order defaults the thanks to "May đo"', (await T.page.getAttribute('#stage [data-act=thanksv][data-v=thanks-custom]', 'aria-pressed')) === 'true');
  await T.copy(seqCopy('pay', 2), X.norm(X.FLOW('thanks-custom').vi), 'S7d made-to-order default thanks (exact)', 'Chép tin 2');
  await close(T);
};
SC.S8 = async env => {
  const S = await open('S8', env);
  const code = 'GHNZ5Q7K2M9T';
  await S.tap(tile('out'), 'Home > Check out');
  await S.check('code bubble is blocked while empty ("Dán mã")', /Dán mã/.test(await S.txt(seqCopy('track', 2).replace('[data-act=cardcopy]', '.ccap'))));
  await S.copy(seqCopy('track', 1), X.norm(X.IG.IG05), 'S8 bubble 1 = IG05 Giao Hàng Nhanh note (exact)', 'Chép tin 1');
  await S.page.evaluate(c => window.__w(c), code);   // she copied the code from the courier app
  await S.tap('#stage [data-card=track] [data-act=pastefill]', 'Dán'); await S.wait(400);
  await S.check('pasted code is in the field and bubble 2 shows it', (await S.page.inputValue('#stage [data-card=track] [data-fill=trackingCode]')) === code && (await S.txt('#stage [data-card=track] .mb[data-b="2"] .pv')).trim() === code, await S.txt('#stage [data-card=track] .mb[data-b="2"] .pv'));
  await S.copy(seqCopy('track', 2), code, 'S8 bubble 2 = the pasted tracking code only (exact)', 'Chép tin 2');
  await S.limit('S8 tracking IG05 then code', 4);
  await S.shot('tracking');
  await close(S);
};
SC.S9 = async env => {
  const S = await open('S9', env);
  await S.tap(tile('out'), 'Home > Check out');
  await S.copy(cardCopy('ask-feedback'), X.norm(X.IG.IG06), 'S9 feedback request = IG06 (exact)', 'Chép');
  await S.limit('S9 feedback request', 2);
  await close(S);
};

// S10 edge cases
SC.S10 = async env => {
  // ---- a. language missing -> explicit choice, never a silent copy of the other language
  {
    const S = await open('S10a', env, { storage: { ov: { 'lace-top': { descEn: '' } } } });
    await S.tap('#home [data-act=pgo][data-v=p]', 'Theo mẫu'); await S.tap(LANG('en'), 'EN');
    await S.tap('[data-open="p:lace-top"]', 'Lace Top'); await S.wait(500);
    await S.check('product sheet EN: "Chưa có bản EN" with explicit "Chép bản VI" / "Thêm bản EN" choices', /Chưa có bản EN/.test(await S.txt('.sheet .notice')) && !!(await S.page.$('.sheet [data-act=pcopyalt]')) && !!(await S.page.$('.sheet [data-act=editp]')), await S.txt('.sheet .notice'));
    await S.check('main footer button is disabled ("Chưa có bản EN"), not a copy button', /Chưa có bản EN/.test(await S.txt('.sheet #pfoot')) && (await S.page.getAttribute('.sheet #pfoot .btn', 'aria-disabled')) === 'true', await S.txt('.sheet #pfoot'));
    await S.shot('missing-lang');
    await S.noCopy('.sheet #pfoot .btn', 'tapping the disabled main button copies nothing (no silent VI)');
    await S.copy('.sheet [data-act=pcopyalt]', X.desc('lace-top', 'vi'), 'explicit "Chép bản VI" copies the VI text (exact)', 'Chép bản VI');
    await close(S);
    const T = await open('S10a2', env);
    await T.tap(LANG('en'), 'EN'); await T.tap(tile('out'), 'Check out');
    await T.check('EN card without EN text: notice + button names the language that will be copied ("Chép bản VI")', /Chưa có bản EN/.test(await T.txt('#stage [data-card=pay] .mb[data-b="1"] .mn')) && /Chép bản VI/.test(await T.txt(seqCopy('pay', 1).replace('[data-act=cardcopy]', '.ccap'))), await T.txt('#stage [data-card=pay] .mb[data-b="1"]'));
    await T.check('nothing was copied just by showing the card', (await T.clips()).length === 0);
    await T.copy(seqCopy('pay', 1), X.norm(X.IG.IG03), 'explicit tap copies the VI bubble (IG03, exact)', 'Chép bản VI');
    await close(T);
  }
  // ---- b. unfilled placeholders block copy
  {
    const S = await open('S10b', env);
    await S.tap(tile('out'), 'Check out');
    await S.page.evaluate(() => window.__w('')).catch(() => {});
    await S.noCopy(seqCopy('track', 2).replace('[data-act=cardcopy]', '.ccap'), 'tracking code bubble with no code: "Dán mã" does not copy', 'Dán mã');
    await S.tap('#stseg [data-v=size]', 'Tư vấn size');
    const lbl = await S.txt(cardCopy('fit-size').replace('[data-act=cardcopy]', '.ccap'));
    await S.check('"Vừa size" without product/size shows the missing item on the button, not a copy button', /Chọn/.test(lbl) && !(await S.page.$(cardCopy('fit-size'))), lbl);
    await S.noCopy('#stage [data-card=fit-size] .ccap', 'tapping it does not copy');
    await close(S);
    const T = await open('S10b2', env);
    await T.tap(tile('order'), 'Tạo đơn');
    await T.check('empty order: dock says "Chọn món", no copy button', /Chọn món/.test(await T.txt('#odock')) && !(await T.page.$('#odock [data-act=copyorder]')));
    await T.noCopy('#odock #obtn', 'tapping "Chọn món" copies nothing');
    await close(T);
    const U = await open('S10b3', env, { storage: seedDraft([{ pid: 'lace-top', size: null, qty: 1 }]) });
    await U.tap(tile('order'), 'Tạo đơn');
    await U.check('order with a sizeless line: dock "Chọn size cho 1 món", message shows [size], badge empty', /Chọn size cho 1 món/.test(await U.txt('#odock')) && /\[size\]/.test(await U.pv('order')) && !(await U.page.$('#odock [data-act=copyorder]')));
    await U.noCopy('#odock #obtn', 'tapping "Chọn size" copies nothing');
    await close(U);
    // typed bracket in a card sheet blocks copy; fixing it releases the button
    const V = await open('S10b4', env, { storage: seedDraft([{ pid: 'lace-top', size: 'M', qty: 1 }]) });
    await V.tap(tile('greet'), 'Chào hỏi');
    await V.tap('#stage [data-card=greet] .pv', 'chạm khung tin (Sửa)'); await V.wait(500);
    const ta = V.page.locator('.sheet textarea[data-eta]').first();
    await ta.fill('Chào bạn, size [size] nhé'); await V.wait(300);
    await V.check('card sheet: "[size]" typed in the text disables the copy button ("Điền 1 chỗ nữa")', (await V.page.isDisabled('.sheet #mcopy')) && /Điền 1 chỗ/.test(await V.txt('.sheet #mcopy')), await V.txt('.sheet #mcopy'));
    await V.page.locator('.sheet #mcopy').tap({ force: true, timeout: 2000 }).catch(() => {}); await V.wait(300);
    await V.check('tapping the disabled sheet button copies nothing', (await V.clips()).length === 0);
    await V.tap('.sheet [data-act=shclose]', 'đóng'); await V.wait(500);
    await V.check('stage capsule shows "Còn chỗ trống" (aria-disabled) while the edit has [size]', /Còn chỗ trống/.test(await V.txt('#stage [data-card=greet] .ccap')) && (await V.page.getAttribute('#stage [data-card=greet] .ccap', 'aria-disabled')) === 'true', await V.txt('#stage [data-card=greet] .ccap'));
    await V.noCopy('#stage [data-card=greet] .ccap', 'tapping the blocked capsule copies nothing');
    await close(V);
  }
  // ---- c. edited text is what gets copied; Khôi phục restores
  {
    const S = await open('S10c', env);
    await S.tap('#home [data-act=pgo][data-v=p]', 'Theo mẫu'); await S.tap('[data-open="p:lace-top"]', 'Lace Top'); await S.wait(500);
    const typed = 'Dạ Lace Top còn size M bạn nhé 🌷\nGiá 380.000đ';
    await S.page.locator('.sheet textarea[data-eta=info]').fill(typed); await S.wait(300);
    await S.check('"Đã sửa" marker and "Khôi phục" appear after typing', /Đã sửa/.test(await S.txt('.sheet .est[data-est=info]')) && !!(await S.page.$('.sheet [data-act=ebreset]')), await S.txt('.sheet .est[data-est=info]'));
    await S.copy('.sheet [data-act=pcopy]', X.norm(typed), 'edited text is exactly what is copied', 'Chép');
    await S.tap('.sheet [data-act=ebreset]', 'Khôi phục'); await S.wait(300);
    await S.check('Khôi phục puts the original text back in the box', (await S.page.inputValue('.sheet textarea[data-eta=info]')).trim() === X.desc('lace-top'), diff((await S.page.inputValue('.sheet textarea[data-eta=info]')).trim(), X.desc('lace-top')));
    await S.copy('.sheet [data-act=pcopy]', X.desc('lace-top'), 'after Khôi phục the original info is copied (exact)', 'Chép');
    await close(S);
    const T = await open('S10c2', env, { storage: seedDraft([{ pid: 'lace-top', size: 'M', qty: 1 }]) });
    await T.tap(tile('greet'), 'Chào hỏi');
    await T.tap('#stage [data-card=greet] [data-act=cardedit].txtbtn', 'Sửa'); await T.wait(500);
    const t2 = 'Chào bạn ạ, Soft gửi bạn Lace Top nhé 🤍';
    await T.page.locator('.sheet textarea[data-eta]').fill(t2); await T.wait(300);
    await T.copy('.sheet #mcopy', X.norm(t2), 'card sheet: edited greeting is what is copied (exact)', 'Chép trong sheet');
    await T.wait(900);
    await T.check('stage card shows "Đã sửa" and the edited text', /Đã sửa/.test(await T.txt('#stage [data-card=greet] .mm')) && (await T.pv('greet')) === X.norm(t2), await T.pv('greet'));
    await T.tap('#stage [data-card=greet] [data-act=cardedit].txtbtn', 'Sửa'); await T.wait(500);
    await T.tap('.sheet [data-act=ebreset]', 'Khôi phục'); await T.wait(300);
    await T.tap('.sheet [data-act=shclose]', 'đóng'); await T.wait(500);
    await T.check('after Khôi phục the stage preview is the generated greeting again', (await T.pv('greet')) === X.greeting('new', ['lace-top']), diff(await T.pv('greet'), X.greeting('new', ['lace-top'])));
    await close(T);
  }
  // ---- d. lead-in: shows in preview and clipboard, remembered only after a successful copy
  {
    const S = await open('S10d', env, { hash: '' });
    await S.tap('#home [data-act=pgo][data-v=p]', 'Theo mẫu'); await S.tap('[data-open="p:embroidery-pants"]', 'Embroidery Pants'); await S.wait(500);
    await S.tap('#pseg [data-v=size]', 'Bảng size'); await S.wait(250);
    await S.tap('.sheet [data-act=leadopen][data-a=size]', 'Câu trước bảng size: Đổi'); await S.wait(500);
    await S.tap('.sheet [data-act=leadpick][data-id=li-size-1]', 'IG01 câu dẫn'); await S.wait(600);
    const ig01 = X.norm(X.IG.IG01), body = X.size('embroidery-pants');
    await S.check('IG01 lead-in equals the seed lead-in li-size-1', X.D.leadIns.size[0].vi === ig01);
    await S.check('lead-in strip is shown above the box with the chosen sentence', (await S.txt('.sheet .lstrip .lt')) === ig01, await S.txt('.sheet .lstrip .lt'));
    await S.shot('lead-in');
    // clipboard fails: nothing is remembered
    await S.page.evaluate(() => { window.__fail = true; });
    await S.tap('.sheet [data-act=pcopy]', 'Chép (clipboard bị từ chối)'); await S.wait(500);
    await S.check('failed copy shows the error toast and the manual-copy sheet', !!(await S.page.$('.toast.bad')) && !!(await S.page.$('#fbtxt')), 'toast ' + !!(await S.page.$('.toast.bad')));
    await S.wait(500);
    const rem1 = await S.page.evaluate(() => JSON.stringify(window.__SE.st.lead.sel));
    await S.check('lead-in is NOT remembered after a failed copy', rem1 === '{}' || !/li-size-1/.test(rem1), rem1);
    await S.page.evaluate(() => { window.__fail = false; });
    await S.tap('.sheet >> nth=-1 >> [data-act=shclose]', 'đóng Chép tay'); await S.wait(600);
    await S.copy('.sheet [data-act=pcopy]', X.norm(ig01 + '\n\n' + body), 'clipboard = IG01 lead-in + blank line + Embroidery Pants chart (exact)', 'Chép');
    await S.wait(500);
    const rem2 = await S.page.evaluate(() => JSON.stringify(window.__SE.st.lead.sel));
    await S.check('lead-in is remembered after the successful copy', /li-size-1/.test(rem2), rem2);
    await S.wait(500);
    await S.page.reload(); await S.wait(700);
    await S.tap('#fbar [data-v=pi]', 'Sản phẩm'); await S.tap('[data-open="p:embroidery-pants"]', 'Embroidery Pants'); await S.wait(500);
    await S.tap('#pseg [data-v=size]', 'Bảng size'); await S.wait(250);
    await S.check('after reload the remembered lead-in is already in the preview', (await S.page.$$eval('.sheet .lstrip .lt', e => e.map(x => x.textContent))).includes(ig01));
    await close(S);
  }
  // ---- e. sets: unchecked price guard + typed placeholder in a set bubble
  {
    const S = await open('S10e', env);
    await S.tap('#home [data-act=pgo][data-v=s]', 'Theo set');
    await S.tap('#hbody [data-act=setsugg][data-a="shimmer-top"][data-sb="lace-skirt-black"]', 'Shimmer Top + Lace Skirt Đen'); await S.wait(500);
    const b0 = (await S.clips()).length;
    await S.page.locator(bub('a')).first().scrollIntoViewIfNeeded(); await S.wait(300);
    const bb = await S.page.locator(bub('a')).first().boundingBox();
    await S.page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await S.wait(60); await S.page.touchscreen.tap(bb.x + bb.width / 2, bb.y + bb.height / 2); await S.wait(300);
    S.taps += 2;
    await S.check('unchecked set: a double tap (60ms apart) arms the guard but never copies the unchecked price', (await S.clips()).length === b0, (await S.clips()).length - b0 + ' writes');
    await S.wait(500);
    const taOnA = S.page.locator('.sheet textarea[data-eta=sa]');
    await taOnA.fill('Set này [giá] nhé'); await S.wait(300);
    await S.tap(bub('c'), 'Chép tin 3'); await S.wait(300);
    const b1 = (await S.clips()).length;
    await S.tap(bub('a'), 'Chép tin 1 với [giá] đã gõ'); await S.wait(400);
    const wrote = (await S.clips()).slice(b1);
    await S.check('set bubble containing a typed "[giá]" placeholder must not be copied (R40)', wrote.length === 0 || !/\[giá\]/.test(wrote[0]), wrote.length ? 'COPIED: ' + esc(wrote[0]) : '');
    await S.tap('.sheet [data-act=shclose]', 'đóng'); await S.wait(600);
    // same question for the product sheet: a typed "[size]" is copied or blocked?
    await S.tap('#pview [data-v=p]', 'Theo mẫu'); await S.tap('[data-open="p:lace-top"]', 'Lace Top'); await S.wait(500);
    await S.page.locator('.sheet textarea[data-eta=info]').fill('Lace Top size [size] nhé'); await S.wait(300);
    const b2 = (await S.clips()).length;
    await S.tap('.sheet [data-act=pcopy]', 'Chép'); await S.wait(400);
    const w2 = (await S.clips()).slice(b2);
    await S.check('product sheet text containing a typed "[size]" placeholder must not be copied (R40)', w2.length === 0 || !/\[size\]/.test(w2[0]), w2.length ? 'COPIED: ' + esc(w2[0]) : '');
    await close(S);
  }
  // ---- f. double-tap and rapid-tap sequences
  {
    const S = await open('S10f', env, { hash: '#debug=dupes' });
    // a real double tap: scroll the target into the clear part of the screen, then two touch taps `gap` ms apart on the same point
    const dbl = async (sel, gap = 100) => {
      const loc = S.page.locator(sel).first(); await loc.waitFor({ state: 'visible' });
      await loc.evaluate(el => { const r = el.getBoundingClientRect(); if (r.top < 120 || r.bottom > innerHeight - 140) el.scrollIntoView({ block: 'center' }); }); await S.wait(200);
      const bx = await loc.boundingBox(), x = bx.x + bx.width / 2, y = bx.y + bx.height / 2;
      await S.page.evaluate(() => { window.__hits = []; if (!window.__hitL) { window.__hitL = 1; document.addEventListener('click', e => window.__hits.push((e.target.closest('[data-act]') || e.target).getAttribute('data-act') || String(e.target.className).slice(0, 20)), true); } });
      await S.page.touchscreen.tap(x, y); if (gap) await S.wait(gap); await S.page.touchscreen.tap(x, y); await S.wait(800);
    };
    const state = () => S.page.evaluate(() => ({ sheets: document.querySelectorAll('#sheets .sh').length, cards: [...document.querySelectorAll('#stage [data-card]')].map(x => x.dataset.card), lines: window.__SE.st.draft.lines.length, dupes: window.__SE.assertUnique(), rows: document.querySelectorAll('.lrow2').length, tray: document.querySelectorAll('.sheet .trow').length }));
    await dbl(tile('greet')); let st = await state();
    await S.check('double-tap on Home tile: one stage, one greeting card', new Set(st.cards).size === st.cards.length && st.cards.filter(c => c === 'greet').length === 1 && st.dupes.length === 0, JSON.stringify(st));
    await dbl('#stage [data-card=greet] [data-act=stripall]'); st = await state();
    await S.check('double-tap on "Tất cả mẫu": exactly one picker sheet', st.sheets === 1 && st.dupes.length === 0, JSON.stringify(st));
    await dbl(cell('lace-top')); st = await state();
    await S.check('double-tap on a picker cell toggles (select+deselect) without duplicate tray rows', st.tray <= 1 && st.dupes.length === 0, JSON.stringify(st));
    await S.tap(cell('lace-top'), 'chọn Lace Top'); await S.wait(200);
    await dbl(PICK_DONE); st = await state();
    await S.check('double-tap on "Xong": picker closed, exactly one line in the context', st.lines === 1 && st.dupes.length === 0, JSON.stringify(st));
    await S.wait(400);
    await dbl('#stage [data-card=greet] .txtbtn[data-act=cardedit]'); st = await state();
    await S.check('double-tap (100ms) on "Sửa": one card sheet, kept open', st.sheets === 1 && st.dupes.length === 0, JSON.stringify(st) + ' second tap hit: ' + (await S.page.evaluate(() => window.__hits.join('>'))));
    await S.tap('.sheet [data-act=shclose]', 'đóng'); await S.wait(600);
    await dbl('#ctxbar .ctxbar'); st = await state();
    await S.check('double-tap (100ms) on the context bar: one picker (no duplicate), second tap must not act on picker content', st.sheets === 1 && st.dupes.length === 0 && !/pk(cat|pair|cell)/.test(await S.page.evaluate(() => window.__hits.join('>'))), JSON.stringify(st) + ' hits: ' + (await S.page.evaluate(() => window.__hits.join('>'))));
    await S.tap('.sheet [data-act=shclose]', 'đóng'); await S.wait(600);
    // a fast double tap (30ms): the second tap must not close the sheet that the first one is opening
    for (const [nm, sel] of [['Sửa', '#stage [data-card=greet] .txtbtn[data-act=cardedit]'], ['context bar', '#ctxbar .ctxbar']]) {
      await dbl(sel, 30); st = await state();
      await S.check(`fast double tap (30ms) on "${nm}": no duplicate sheet, and the sheet stays open (second tap must not land on the dim)`, st.sheets === 1 && st.dupes.length === 0, JSON.stringify(st) + ' second tap hit: ' + (await S.page.evaluate(() => window.__hits.join('>'))));
      if (st.sheets) { await S.tap('.sheet [data-act=shclose]', 'đóng'); await S.wait(600); }
    }
    // rapid hopping between all stages, languages and tabs
    for (const v of ['order', 'out', 'size', 'info', 'greet', 'order', 'greet']) { await S.page.touchscreen.tap(...(await (async () => { const b = await S.page.locator(`#stseg [data-v=${v}]`).first().boundingBox(); return [b.x + b.width / 2, b.y + b.height / 2]; })())); }
    await S.page.locator('#lsw [data-v=en]').first().tap(); await S.page.locator('#lsw [data-v=vi]').first().tap(); await S.page.locator('#lsw [data-v=en]').first().tap(); await S.page.locator('#lsw [data-v=vi]').first().tap();
    await S.wait(800); st = await state();
    await S.check('rapid stage/language hopping leaves one card of each kind and no duplicate groups', new Set(st.cards).size === st.cards.length && st.dupes.length === 0, JSON.stringify(st));
    await S.tap('#stseg [data-v=order]', 'Tạo đơn'); await S.wait(300);
    await dbl('#stage [data-act=shipopen]'); st = await state();
    await S.check('double-tap (100ms) on "Phí ship": one sheet, kept open', st.sheets === 1 && st.dupes.length === 0, JSON.stringify(st) + ' hits: ' + (await S.page.evaluate(() => window.__hits.join('>'))));
    if (!st.sheets) { await S.tap('#stage [data-act=shipopen]', 'Phí ship'); await S.wait(500); }
    await dbl('.sheet [data-act=shippick][data-v=free]'); st = await state();
    await S.check('double-tap on a ship option: sheet closes, one odock', st.sheets === 0 && (await S.page.$$('#odock')).length === 1 && st.dupes.length === 0, JSON.stringify(st));
    // product + set rows
    await S.tap('#fbar [data-v=pi]', 'Sản phẩm'); await S.wait(300);
    await dbl('[data-open="p:butter-top"]'); st = await state();
    await S.check('double-tap on a product row: one product sheet', st.sheets === 1 && st.dupes.length === 0, JSON.stringify(st));
    const before = (await S.clips()).length;
    await dbl('.sheet [data-act=pcopy]'); st = await state();
    const nW = (await S.clips()).length - before;
    await S.check('double-tap on Chép: no duplicate UI; clipboard writes are identical texts', st.sheets === 1 && st.dupes.length === 0 && new Set((await S.clips()).slice(before)).size <= 1, `${nW} writes ` + JSON.stringify(st));
    await S.tap('.sheet [data-act=shclose]', 'đóng'); await S.wait(600);
    await S.tap('#pview [data-v=s]', 'Theo set'); await S.wait(300);
    await dbl('#hbody [data-act=setsugg][data-a="butter-top"][data-sb="flowy-skirt-taupe"]'); st = await state();
    await S.check('double-tap on a suggested set: one set sheet, set created once', st.sheets === 1 && st.dupes.length === 0 && (await S.page.evaluate(() => window.__SE.st.sets.length)) === 1, JSON.stringify(st) + ' sets ' + await S.page.evaluate(() => window.__SE.st.sets.length));
    await S.tap('.sheet [data-act=shclose]', 'đóng'); await S.wait(600);
    await S.check('no console errors during all double/rapid-tap sequences (#debug=dupes active)', S.errors.length === 0, S.errors.join(' | '));
    await S.ctx.close();
  }
  // ---- g. clipboard failure -> error + manual copy sheet
  {
    const S = await open('S10g', env, { storage: seedDraft([{ pid: 'butter-top', size: 'M', qty: 1 }]) });
    await S.tap(tile('greet'), 'Chào hỏi');
    const exp = X.greeting('new', ['butter-top']);
    await S.page.evaluate(() => { window.__fail = true; });   // writeText rejects AND execCommand('copy') returns false
    await S.tap(cardCopy('greet'), 'Chép (clipboard + execCommand đều lỗi)'); await S.wait(600);
    await S.check('error toast "Chưa chép được…" is shown', /Chưa chép được/.test(await S.txt('.toast.bad').catch(() => '')), await S.txt('.toast').catch(() => 'no toast'));
    await S.check('manual-copy sheet "Chép tay" opens with exactly the message', (await S.txt('#fbtxt').catch(() => 'none')) === exp, diff(await S.txt('#fbtxt').catch(() => 'none'), exp));
    await S.shot('copy-failed-sheet');
    await S.check('the manual-copy text is pre-selected for long-press copy', (await S.page.evaluate(() => getSelection().toString().length)) > 20, 'selection ' + await S.page.evaluate(() => getSelection().toString().length));
    await S.check('step is NOT marked sent after a failed copy (no ✓ on Chào hỏi)', !(await S.page.$('#stseg [data-v=greet][data-done]')) && (await S.page.evaluate(() => Object.keys(window.__SE.st.draft.done).length)) === 0);
    await S.tap('.sheet >> nth=-1 >> [data-act=shclose]', 'đóng'); await S.wait(600);
    // writeText rejects but the legacy execCommand path works
    await S.page.evaluate(() => { window.__fail = false; window.__failWrite = true; });
    await S.tap(cardCopy('greet'), 'Chép (writeText lỗi, execCommand ok)'); await S.wait(700);
    await S.check('legacy execCommand fallback succeeds silently: success toast, no manual sheet', !!(await S.page.$('.toast:not(.bad)')) && !(await S.page.$('#fbtxt')) && (await S.page.evaluate(() => window.__exec)) >= 1, 'exec ' + await S.page.evaluate(() => window.__exec));
    await S.check('after the fallback success the step is marked sent', !!(await S.page.$('#stseg [data-v=greet][data-done]')) || (await S.page.evaluate(() => Object.keys(window.__SE.st.draft.done).length)) === 1);
    await close(S);
    // order copy failure
    const T = await open('S10g2', env, { storage: seedDraft([{ pid: 'lace-top', size: 'M', qty: 1 }]) });
    await T.tap(tile('order'), 'Tạo đơn');
    await T.page.evaluate(() => { window.__fail = true; });
    await T.tap('#odock #obtn', 'Chép đơn (lỗi)'); await T.wait(600);
    const o = X.order([{ id: 'lace-top', size: 'M', qty: 1 }], { kind: 'courier' });
    await T.check('order copy failure: error + manual sheet with the full order message', /Chưa chép được/.test(await T.txt('.toast.bad').catch(() => '')) && (await T.txt('#fbtxt').catch(() => '')) === o, diff(await T.txt('#fbtxt').catch(() => ''), o));
    await T.check('failed order copy does not mark "copied" (no Check out suggestion)', (await T.page.evaluate(() => window.__SE.st.draft.copiedAt)) === 0);
    await close(T);
  }
};

// S11 navigation
SC.S11 = async env => {
  const S = await open('S11', env);
  const hs = await S.page.evaluate(() => ({ logo: (() => { const i = document.querySelector('#nav .logo'); return i && i.complete && i.naturalWidth > 0; })(), gear: !!document.querySelector('#nav .gear'), sub: (document.querySelector('#hsub') || {}).textContent, items: [...document.querySelectorAll('#fbar button')].filter(b => b.offsetParent).length, lbl: document.querySelector('#obtn2 > span') && document.querySelector('#obtn2 > span').textContent, h1: document.querySelector('#hgreet').textContent }));
  await S.check('logo image is present and loaded', hs.logo);
  await S.check('settings gear is present in the header', hs.gear);
  await S.check('floating bar has at most 4 items', hs.items <= 4 && hs.items >= 3, String(hs.items));
  await S.check('order button label is "Đơn"', hs.lbl === 'Đơn', hs.lbl);
  await S.check('Home has a subtitle', !!(hs.sub || '').trim(), hs.sub);
  // every function one tap from Home
  const targets = [['greet', 'Chào hỏi', '#qrtitle'], ['size', 'Tư vấn size', '#qrtitle'], ['info', 'Xin thông tin', '#qrtitle'], ['order', 'Tạo đơn', '#qrtitle'], ['out', 'Check out', '#qrtitle']];
  for (const [id, title, sel] of targets) {
    const t = S.taps; if (id !== 'greet') { await S.tap('#fbar [data-v=home]', 'Trang chủ'); } S.taps = 0; S.path = [];
    await S.tap(tile(id), 'Home > ' + title);
    await S.check(`Home > ${title} is reachable in 1 tap`, S.taps === 1 && (await S.txt(sel)) === title, await S.txt(sel));
    const sub = await S.page.evaluate(() => { const t = document.querySelector('#qr .ttl'); return t ? [...t.querySelectorAll('.sub,.helper,p')].map(x => x.textContent.trim()).filter(x => x && !/^Trả lời nhanh/.test(x)).join(' | ') : ''; });
    await S.check(`subtitle / helper line is shown on the ${title} screen (R23)`, !!sub, 'no subtitle element under the title on Trả lời nhanh screens');
    await S.shot('stage-' + id);
  }
  for (const [v, title] of [['p', 'Theo mẫu'], ['s', 'Theo set']]) {
    await S.tap('#fbar [data-v=home]', 'Trang chủ'); S.taps = 0;
    await S.tap(`#home [data-act=pgo][data-v=${v}]`, 'Home > ' + title);
    await S.check(`Home > ${title} is reachable in 1 tap`, S.taps === 1 && (await S.txt('#pititle')) === title);
    await S.check(`${title} has a subtitle`, !!(await S.txt('#pisub')).trim(), await S.txt('#pisub'));
  }
  // Theo mẫu: newest first, collection headers, filters
  await S.tap('#pview [data-v=p]', 'Theo mẫu').catch(() => {});
  const ord = X.D.products.map((p, i) => [p, i]).sort((a, b) => (b[0].released || 0) - (a[0].released || 0) || a[1] - b[1]).map(x => x[0]);
  const wantHdr = []; for (const p of ord) { const l = wantHdr[wantHdr.length - 1]; if (l && l.n === p.collection) l.c++; else wantHdr.push({ n: p.collection, c: 1 }); }
  const got = await S.page.evaluate(() => ({ ids: [...document.querySelectorAll('#hbody .prow')].map(r => r.dataset.open.slice(2)), hdr: [...document.querySelectorAll('#hbody h2.cap')].map(h => h.textContent.trim()) }));
  await S.check('Theo mẫu lists all 20 products newest first (released desc)', got.ids.join() === ord.map(p => p.id).join(), got.ids.join());
  await S.check('collection headers in newest-first order with counts', got.hdr.join('|') === wantHdr.map(h => h.n + ' · ' + h.c).join('|'), got.hdr.join('|'));
  await S.shot('theo-mau');
  const want = { top: 11, skirt: 6, dress: 2, pants: 1 };
  const cnt = await S.page.evaluate(() => [...document.querySelectorAll('#pfilt button')].map(b => b.textContent));
  await S.check('filter segments Áo/Váy/Đầm/Quần show counts 11/6/2/1', cnt.join('|') === 'Tất cả20|Áo11|Váy6|Đầm2|Quần1', cnt.join('|'));
  await S.check('counts agree with data.json categories', Object.entries(want).every(([k, v]) => X.D.products.filter(p => p.category === k).length === v));
  for (const [k, n] of Object.entries(want)) { await S.tap(`#pfilt [data-v=${k}]`, 'lọc ' + k); await S.check(`filter ${k} shows ${n} rows`, (await S.page.$$('#hbody .prow')).length === n, String((await S.page.$$('#hbody .prow')).length)); }
  await S.tap('#pfilt [data-v=all]', 'Tất cả');
  // photos: scroll the whole list in steps, then count
  await S.page.evaluate(() => { window.__cls0 = window.__cls; });
  for (let y = 0; y < 4000; y += 500) { await S.page.evaluate(yy => document.querySelector('#pi').scrollTo(0, yy), y); await S.wait(150); }
  await S.wait(600);
  const ph = await S.page.evaluate(() => { const im = [...document.querySelectorAll('#hbody .prow .av img')]; return { n: im.length, ok: im.filter(i => i.complete && i.naturalWidth > 0).length, cls: window.__cls - window.__cls0, rows: document.querySelectorAll('#hbody .prow').length }; });
  await S.check('20 real product photos load (no 404, none broken)', ph.n === 20 && ph.ok === 20 && S.errors.filter(e => /http 4|requestfailed/.test(e)).length === 0, JSON.stringify(ph) + ' ' + S.errors.join(' '));
  await S.check('no layout shift while photos load (CLS < 0.005)', ph.cls < 0.005, 'CLS ' + ph.cls);
  await S.page.evaluate(() => document.querySelector('#pi').scrollTo(0, 0));
  // vertical swipe starting on chips / strip scrolls the page
  const cdp = await S.ctx.newCDPSession(S.page);
  // a real finger drag (touchStart, many touchMoves, touchEnd) starting at (x, y), moving up by d points
  const swipe = async (x, y, d) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 14; i++) { await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - d * i / 14 }] }); await S.page.waitForTimeout(16); }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  { // control: the same swipe on a plain row must scroll (validates the test itself)
    const rb = await S.page.locator('#hbody .prow').nth(3).boundingBox(); const c0 = await S.page.evaluate(() => document.querySelector('#pi').scrollTop);
    await swipe(rb.x + rb.width / 2, rb.y + rb.height / 2, 300); await S.wait(600);
    const c1 = await S.page.evaluate(() => document.querySelector('#pi').scrollTop);
    await S.check('control: swipe on a product row scrolls the list (test validity)', c1 > c0 + 50, `scrollTop ${c0} -> ${c1}`);
    await S.page.evaluate(() => document.querySelector('#pi').scrollTo(0, 0)); await S.wait(200);
  }
  const chip = await S.page.locator('#pfilt .seg button').nth(1).boundingBox();
  const s0 = await S.page.evaluate(() => document.querySelector('#pi').scrollTop);
  await swipe(chip.x + chip.width / 2, chip.y + chip.height / 2, 300); await S.wait(500);
  const s1 = await S.page.evaluate(() => document.querySelector('#pi').scrollTop);
  await S.check('vertical swipe that starts on the Áo/Váy/Đầm/Quần chips scrolls the list', s1 > s0 + 50, `scrollTop ${s0} -> ${s1}`);
  // strip on Chào hỏi (page must be scrollable: give it 4 products so cards are tall)
  await S.page.evaluate(() => document.querySelector('#pi').scrollTo(0, 0));
  await S.tap('#fbar [data-v=home]', 'Trang chủ'); await S.tap(tile('size'), 'Tư vấn size');
  const sc = await S.page.evaluate(() => { const q = document.querySelector('#qr'); return { sh: q.scrollHeight, ch: q.clientHeight }; });
  const strip = await S.page.locator('#stage .pstrip .row5 .sc').first().boundingBox();
  if (sc.sh > sc.ch + 40 && strip && strip.y + strip.height < env.h - 100) {
    const q0 = await S.page.evaluate(() => document.querySelector('#qr').scrollTop);
    await swipe(strip.x + strip.width / 2, strip.y + strip.height / 2, 250); await S.wait(500);
    const q1 = await S.page.evaluate(() => document.querySelector('#qr').scrollTop);
    await S.check('vertical swipe that starts on the photo strip scrolls the page', q1 > q0 + 40, `scrollTop ${q0} -> ${q1}`);
  } else await S.check('vertical swipe on the photo strip (page too short to scroll or strip under the bar: not testable at this size)', true, JSON.stringify({ sc, strip }));
  const strCss = await S.page.evaluate(() => { const r = document.querySelector('#stage .pstrip .row5'); const cs = getComputedStyle(r); return { ox: cs.overflowX, ta: cs.touchAction, sw: r.scrollWidth, cw: r.clientWidth }; });
  await S.check('photo strip is not a horizontal scroller (no carousel fighting the page)', strCss.sw <= strCss.cw + 1 && strCss.ox !== 'scroll', JSON.stringify(strCss));
  // badge on the Đơn button once something is in the order
  await S.tap('#stseg [data-v=greet]', 'Chào hỏi').catch(() => {});
  await S.tap('#stage [data-card=greet] [data-act=stripall]', 'Tất cả mẫu').catch(async () => { await S.tap('#stage .addmore', 'Thêm mẫu'); });
  await S.tap(cell('lace-top'), 'Lace Top'); await S.tap('.sheet .trow[data-pid="lace-top"] [data-act=pksize][data-v=M]', 'M'); await S.tap(PICK_DONE, 'Xong'); await S.wait(500);
  await S.check('Đơn button shows a badge with the item count', (await S.txt('#obtn2 .bd')) === '1' && !(await S.page.$eval('#obtn2 .bd', e => e.hidden)), await S.txt('#obtn2'));
  await S.shot('badge');
  // horizontal overflow on every screen
  const ov = [];
  for (const [nm, act] of [['home', () => S.tap('#fbar [data-v=home]')], ['greet', async () => { await S.tap('#fbar [data-v=qr]'); await S.tap('#stseg [data-v=greet]'); }], ['size', () => S.tap('#stseg [data-v=size]')], ['info', () => S.tap('#stseg [data-v=info]')], ['order', () => S.tap('#stseg [data-v=order]')], ['out', () => S.tap('#stseg [data-v=out]')], ['theo-mau', async () => { await S.tap('#fbar [data-v=pi]'); }], ['theo-set', () => S.tap('#pview [data-v=s]')]]) {
    await act(); await S.wait(300);
    const o = await S.page.evaluate(() => { const w = innerWidth, bad = []; document.querySelectorAll('body *').forEach(e => { const r = e.getBoundingClientRect(); if (r.width && e.offsetParent && (r.right > w + 1 || r.left < -1) && !e.closest('.sheet,.sh,#toast,.hap,#sheets')) bad.push((e.id || e.className || e.tagName).toString().slice(0, 30) + ' ' + Math.round(r.left) + '..' + Math.round(r.right)); }); return { sw: document.scrollingElement.scrollWidth, w, bad: bad.slice(0, 4) }; });
    if (o.sw > o.w || o.bad.length) ov.push(nm + ' ' + JSON.stringify(o));
  }
  await S.check('no horizontal overflow on any screen', ov.length === 0, ov.join(' ; '));
  await close(S);
};

// S12 safe-area geometry
SC.S12 = async env => {
  const mk = async (opts, hash = '') => {
    const ctx = await B.newContext({ viewport: { width: env.w, height: env.h }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, colorScheme: env.dark ? 'dark' : 'light', locale: 'vi-VN', serviceWorkers: 'block', userAgent: UA });
    const page = await ctx.newPage(); const cdp = await ctx.newCDPSession(page);
    await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: opts.top, bottom: opts.bottom, left: 0, right: 0 } });
    if (opts.standalone) await page.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { value: true, configurable: true }); });
    if (opts.rootPad) await page.addInitScript(() => { document.documentElement.style.padding = '59px 0 34px'; });
    const errors = []; page.on('pageerror', e => errors.push(e.message));
    return { ctx, page, errors };
  };
  const geo = fr => fr.evaluate(() => { const c = document.querySelector('.capsule').getBoundingClientRect(), a = document.querySelector('#app').getBoundingClientRect(); return { gap: Math.round((a.bottom - c.bottom) * 10) / 10, appBottom: Math.round((innerHeight - a.bottom) * 10) / 10, capH: Math.round(c.height) }; });
  const strip = async page => { // left gutter of the bottom 80pt must be one colour (the app background)
    const buf = await page.screenshot({ type: 'png' });
    const { decodePng } = await import('../ui/lib.mjs'); const png = decodePng(buf), sc = png.w / env.w, ref = png.at(Math.round(4 * sc), Math.round(110 * sc));
    let bad = 0; for (let y = png.h - Math.round(80 * sc); y < png.h; y++) for (let x = 0; x < Math.round(2.5 * sc); x++) { const p = png.at(x, y); if (Math.abs(p[0] - ref[0]) > 6 || Math.abs(p[1] - ref[1]) > 6 || Math.abs(p[2] - ref[2]) > 6) bad++; }
    return bad;
  };
  const FACE = { top: 59, bottom: 34 };
  const cases = [
    ['plain browser tab (bottom inset 0)', { top: 59, bottom: 0 }, 12, false],
    ['plain browser tab that reports a 34pt inset', FACE, 24, false],
    ['standalone home-screen app (59/34)', { ...FACE, standalone: true }, 24, false],
    ['root-padded host wrapper (html padding 59/34)', { ...FACE, standalone: true, rootPad: true }, 24, false],
  ];
  for (const [nm, o, exp] of cases) {
    const { ctx, page, errors } = await mk(o); await page.goto(URL0); await page.waitForTimeout(500);
    const g = await geo(page);
    const S = new Sess('S12', env, ctx, page, errors);
    await S.check(`${nm}: bar gap ${exp}pt above the app edge`, Math.abs(g.gap - exp) <= 1, JSON.stringify(g));
    if (o.rootPad) await S.check(`${nm}: app stays full-bleed (no double count)`, g.appBottom === 0, JSON.stringify(g));
    const bad = await strip(page); await S.check(`${nm}: no uncovered strip at the bottom edge`, bad === 0, bad + ' px differ');
    await S.shot('safe-' + exp + (o.rootPad ? '-wrap' : o.standalone ? '-sa' : ''));
    await ctx.close();
  }
  // iframe wrapper
  const { ctx, page, errors } = await mk({ ...FACE, standalone: true });
  const hostBg = env.dark ? '#1C1D1C' : '#F6F4EE';
  await page.route('**/host.html', r => r.fulfill({ contentType: 'text/html', body: `<!doctype html><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><html style="padding:59px 0 34px;background:${hostBg}"><body style="margin:0;background:${hostBg}"><iframe id=f src="index.html" style="position:fixed;left:0;right:0;top:59px;bottom:34px;width:100%;height:calc(100% - 93px);border:0"></iframe></body></html>` }));
  await page.goto(URL0 + 'host.html'); await page.waitForTimeout(800);
  const fr = page.frames().find(f => f !== page.mainFrame()), g = await geo(fr), S = new Sess('S12', env, ctx, page, errors);
  await S.check('iframe wrapper: framed app uses a 12pt bar gap (host owns the edge)', Math.abs(g.gap - 12) <= 1, JSON.stringify(g));
  const bad = await strip(page); await S.check('iframe wrapper: no uncovered strip', bad === 0, bad + ' px differ');
  await S.shot('safe-iframe');
  await ctx.close();
};

// S13 contrast (WCAG 4.5:1) of rendered text on its effective background, light and dark
SC.S13 = async env => {
  const S = await open('S13', env, { storage: seedDraft([{ pid: 'lace-top', size: 'M', qty: 1 }, { pid: 'lace-skirt-cream', size: null, qty: 1 }]) });
  const audit = async screen => {
    const r = await S.page.evaluate(() => {
      const parse = c => { const m = c.match(/rgba?\(([^)]+)\)/); if (!m) return null; const p = m[1].split(/[ ,\/]+/).filter(Boolean).map(Number); return { r: p[0], g: p[1], b: p[2], a: p[3] == null ? 1 : p[3] }; };
      const over = (f, b) => ({ r: f.r * f.a + b.r * (1 - f.a), g: f.g * f.a + b.g * (1 - f.a), b: f.b * f.a + b.b * (1 - f.a), a: 1 });
      const lum = c => { const f = v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(c.r) + .7152 * f(c.g) + .0722 * f(c.b); };
      const bgOf = el => { const stack = []; for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c.a > 0) { stack.push(c); if (c.a >= 1) break; } } let base = { r: 255, g: 255, b: 255, a: 1 }; const root = parse(getComputedStyle(document.body).backgroundColor); if (root && root.a > 0) base = root; for (let i = stack.length - 1; i >= 0; i--) base = over(stack[i], base); return base; };
      const out = [];
      const seen = new Set();
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n; while ((n = walker.nextNode())) {
        const t = n.textContent.trim(); if (!t) continue;
        const el = n.parentElement; if (!el || !el.offsetParent && getComputedStyle(el).position !== 'fixed') continue;
        if (el.closest('script,style,svg,#toast:empty,.vh,[hidden]')) continue;
        const cs = getComputedStyle(el); if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
        const r = el.getBoundingClientRect(); if (r.width < 2 || r.height < 2 || r.bottom < 0 || r.top > innerHeight) continue;
        const dis = el.closest('[disabled],[aria-disabled=true]');
        const fg = parse(cs.color), bg = bgOf(el); if (!fg) continue;
        let eff = fg; if (fg.a < 1) eff = over(fg, bg);
        const L1 = lum(eff), L2 = lum(bg), ratio = (Math.max(L1, L2) + .05) / (Math.min(L1, L2) + .05);
        const fs = parseFloat(cs.fontSize), large = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700);
        const key = (el.className || el.tagName) + '|' + t.slice(0, 20); if (seen.has(key)) continue; seen.add(key);
        out.push({ t: t.slice(0, 28), cls: String(el.className || el.tagName).slice(0, 40), ratio: Math.round(ratio * 100) / 100, fs, large, dis: !!dis, color: cs.color, bg: `rgb(${Math.round(bg.r)},${Math.round(bg.g)},${Math.round(bg.b)})` });
      }
      return out;
    });
    const low = r.filter(x => !x.dis && x.ratio < (x.large ? 3 : 4.5));
    const worst = low.sort((a, b) => a.ratio - b.ratio).slice(0, 6).map(x => `${x.cls} "${x.t}" ${x.ratio}:1 (${x.fs}px ${x.color} on ${x.bg})`);
    const mins = r.filter(x => !x.dis).sort((a, b) => a.ratio - b.ratio).slice(0, 3).map(x => `${x.cls.split(' ')[0]} "${x.t}" ${x.ratio}`).join(' ; ');
    await S.check(`${screen}: all ${r.length} sampled text/CTA pairs reach 4.5:1`, low.length === 0, low.length ? `${low.length} below: ` + worst.join(' ; ') : 'lowest: ' + mins, { sampled: r.length, below: low.length, min: Math.min(...r.filter(x => !x.dis).map(x => x.ratio)) });
  };
  await audit('Home');
  for (const [id, nm] of [['greet', 'Chào hỏi'], ['size', 'Tư vấn size'], ['info', 'Xin thông tin'], ['order', 'Tạo đơn'], ['out', 'Check out']]) {
    await S.tap('#fbar [data-v=qr]', 'Trả lời nhanh'); await S.tap(`#stseg [data-v=${id}]`, nm); await S.wait(300); await audit(nm); if (id === 'greet') await S.shot('dark-greet');
  }
  await S.tap('#fbar [data-v=pi]', 'Sản phẩm'); await S.wait(300); await audit('Theo mẫu');
  await S.tap('#pview [data-v=s]', 'Theo set'); await S.wait(300); await audit('Theo set');
  await S.tap('#pview [data-v=p]', 'Theo mẫu'); await S.tap('[data-open="p:lace-top"]', 'Lace Top'); await S.wait(600); await audit('Product sheet');
  await S.shot('product-sheet'); await S.tap('.sheet [data-act=shclose]'); await S.wait(500);
  await S.tap('#pview [data-v=s]'); await S.tap('#hbody [data-act=setsugg][data-a="lace-top"][data-sb="lace-skirt-cream"]'); await S.wait(600); await audit('Set sheet');
  await S.shot('set-sheet'); await S.tap('.sheet [data-act=shclose]'); await S.wait(500);
  await S.tap('#fbar [data-v=qr]'); await S.tap('#stseg [data-v=greet]'); await S.tap('#ctxbar .ctxbar'); await S.wait(700); await audit('Picker sheet');
  await S.shot('picker'); await S.tap('.sheet [data-act=shclose]'); await S.wait(500);
  await S.tap('#nav .gear'); await S.wait(600); await audit('Settings sheet');
  await close(S);
};

// ============================================================ run
const order = Object.keys(SC).filter(k => !WANT.length || WANT.includes(k));
for (const k of order) {
  const crossEnv = ['S12'];
  for (const [w, h] of VPS) for (const dark of THEMES) {
    const env = { w, h, dark };
    try { await SC[k](env); }
    catch (e) {
      RES.push({ sc: k, vp: w + 'x' + h, theme: dark ? 'dark' : 'light', name: 'SCENARIO ABORTED (test or app error)', pass: false, note: String(e.stack || e).split('\n').slice(0, 4).join(' / ').slice(0, 600) });
      console.log('FAIL ' + k + ` ${w}x${h} ${dark ? 'dark' : 'light'} ABORTED ` + String(e.message).split('\n')[0]);
    }
  }
}
await B.close(); srv.close();
const pass = RES.filter(r => r.pass).length, fail = RES.length - pass;
fs.writeFileSync(ROOT + '/docs/qa/uat-results.json', JSON.stringify({ at: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), pass, fail, results: RES }, null, 1));
console.log(`\nUAT ${pass}/${RES.length} passed, ${fail} failed in ${Math.round((Date.now() - t0) / 1000)} s`);
process.exit(fail ? 1 : 0);
