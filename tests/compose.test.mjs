// node --test tests/compose.test.mjs   (no dependencies)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
const require = createRequire(import.meta.url);
const SECompose = require('../src/compose.js');
const SEED = JSON.parse(readFileSync(new URL('../src/data.json', import.meta.url), 'utf8'));

function mk(extra) {
  const st = Object.assign({
    ov: {}, lead: { sel: {}, custom: [], edits: {}, hidden: [] }, sets: [],
    draft: { lines: [{ pid: 'lace-top', size: 'M', qty: 1 }], ship: 'courier', custom: 0, info: '', bank: false, copiedAt: 0 },
    set: { lang: 'vi', fee: 25000, bank: { name: '', no: '', holder: '' } }
  }, extra || {});
  return { st, C: SECompose(SEED, st) };
}
// the guard code is generic: it is tested with a synthetic flagged product, because no real product is truncated any more
const SEEDF = JSON.parse(JSON.stringify(SEED));
SEEDF.products.push({ ...JSON.parse(JSON.stringify(SEED.products.find(p => p.id === 'lace-top'))), id: 'zz-flagged', truncated: ['descVi'] });
function mkf() { const st = { ov: {}, lead: { sel: {}, custom: [], edits: {}, hidden: [] }, sets: [], draft: { lines: [], ship: 'courier', custom: 0, info: '', bank: false, copiedAt: 0 }, set: { lang: 'vi', fee: 25000, bank: { name: '', no: '', holder: '' } } }; return { st, C: SECompose(SEEDF, st) }; }
const P = id => SEED.products.find(p => p.id === id);
const sel = (o) => ({ sel: o });
const LI = (a, n) => SEED.leadIns[a][n - 1];

test('info, vi, no lead', () => {
  const { C } = mk(); const r = C.composeCopy('info', { pid: 'lace-top', ...sel({ 'info:vi': null }) }, 'vi');
  assert.equal(r.text, C.clean(P('lace-top').descVi));
});
test('info, vi, lead li-info-3', () => {
  const { C } = mk(); const r = C.composeCopy('info', { pid: 'lace-top', ...sel({ 'info:vi': 'li-info-3' }) }, 'vi');
  assert.equal(r.text, 'Soft gửi bạn thông tin mẫu ạ 🌷\n\n' + C.clean(P('lace-top').descVi));
});
test('info, en, lead li-info-3 uses EN lead and never the VI lead', () => {
  const { C } = mk(); const r = C.composeCopy('info', { pid: 'lace-top', ...sel({ 'info:en': 'li-info-3' }) }, 'en');
  assert.equal(r.text, 'Here are the details for you 🌷\n\n' + C.clean(P('lace-top').descEn));
  assert.ok(!r.text.includes(LI('info', 3).vi));
});
test('info, en, VI-only custom lead is not listed and selection is independent', () => {
  const { st, C } = mk(); st.lead.custom.unshift({ id: 'lu-x', action: 'info', vi: 'Câu riêng', en: '' });
  assert.ok(!C.leadList('info', 'en').some(x => x.id === 'lu-x'));
  assert.ok(C.leadList('info', 'vi').some(x => x.id === 'lu-x'));
  st.lead.sel['info:vi'] = 'lu-x';
  const r = C.composeCopy('info', { pid: 'lace-top' }, 'en');
  assert.equal(r.text, C.clean(P('lace-top').descEn)); assert.equal(r.lead, '');
  const forced = C.composeCopy('info', { pid: 'lace-top', ...sel({ 'info:en': 'lu-x' }) }, 'en');
  assert.equal(forced.lead, '', 'a VI-only line can never be used in EN');
});
test('size, vi, lead li-size-1', () => {
  const { C } = mk(); const r = C.composeCopy('size', { pid: 'lace-top', ...sel({ 'size:vi': 'li-size-1' }) }, 'vi');
  assert.equal(r.text, 'Dạ mình gửi bảng size để bạn tiện tham khảo nhen:\n\n' + C.clean(P('lace-top').sizeVi));
});
test('both, vi, info lead + size lead', () => {
  const { C } = mk(); const r = C.composeCopy('both', { pid: 'lace-top', ...sel({ 'info:vi': 'li-info-3', 'size:vi': 'li-size-1' }) }, 'vi');
  const p = P('lace-top');
  assert.equal(r.text, [LI('info', 3).vi, C.clean(p.descVi), LI('size', 1).vi, C.clean(p.sizeVi)].join('\n\n'));
  assert.ok(!/\n{3,}/.test(r.text));
});
test('both, vi, info lead only', () => {
  const { C } = mk(); const r = C.composeCopy('both', { pid: 'lace-top', ...sel({ 'info:vi': 'li-info-3', 'size:vi': null }) }, 'vi');
  const p = P('lace-top');
  assert.equal(r.text, [LI('info', 3).vi, C.clean(p.descVi), C.clean(p.sizeVi)].join('\n\n'));
});
test('both, vi, size text empty -> info part only, no trailing blank lines', () => {
  const { st, C } = mk(); st.ov['lace-top'] = { sizeVi: '', sizeEn: '' };
  const r = C.composeCopy('both', { pid: 'lace-top', ...sel({ 'info:vi': null, 'size:vi': 'li-size-1' }) }, 'vi');
  assert.equal(r.text, C.clean(P('lace-top').descVi)); assert.ok(!/\s$/.test(r.text));
  assert.equal(r.partial, null);
});
test('both, en, size only in vi -> partial flagged', () => {
  const { st, C } = mk(); st.ov['lace-top'] = { sizeEn: '' };
  const r = C.composeCopy('both', { pid: 'lace-top' }, 'en');
  assert.equal(r.partial, 'size'); assert.equal(r.text, C.clean(P('lace-top').descEn));
});
test('order, vi, lead li-order-1', () => {
  const { C } = mk(); const r = C.composeCopy('order', sel({ 'order:vi': 'li-order-1' }), 'vi');
  assert.ok(r.text.startsWith('Dạ Soft lên đơn cho bạn nha 🌷\n\nDạ vậy đơn của bạn 🌷'));
});
test('thanks, vi, lead li-thanks-1 (rtw and made-to-order)', () => {
  const { st, C } = mk();
  let r = C.composeCopy('thanks', sel({ 'thanks:vi': 'li-thanks-1' }), 'vi');
  assert.equal(r.text, 'ui dạ mình nhận được rùi ạ\n\n' + C.clean(SEED.flow.find(e => e.id === 'thanks-rtw').vi));
  st.draft.lines = [{ pid: 'noir-midi-skirt', size: 'S', qty: 1 }];
  r = C.composeCopy('thanks', sel({ 'thanks:vi': 'li-thanks-1' }), 'vi');
  assert.equal(r.text, 'ui dạ mình nhận được rùi ạ\n\n' + C.clean(SEED.flow.find(e => e.id === 'thanks-custom').vi));
});
const SET = { id: 's1', items: ['lace-top', 'lace-skirt-cream'], price: null, name: '', postUrl: '', checked: true, ov: { vi: null, en: null } };
const clipDesc = (C, id, l) => C.clean(P(id)[l === 'vi' ? 'descVi' : 'descEn']);
test('set bubble a (vi): both descriptions + price line, default price = sum', () => {
  const { C } = mk(); const r = C.composeCopy('set', { set: SET, bubble: 'a', sel: { 'info:vi': null } }, 'vi');
  assert.equal(r.text, [clipDesc(C, 'lace-top', 'vi'), clipDesc(C, 'lace-skirt-cream', 'vi'), '• Giá set: 850.000đ'].join('\n\n'));
  assert.ok(!r.text.includes('{{')); assert.equal(r.trunc, false);
  const f = mkf().C.composeCopy('set', { set: { ...SET, items: ['zz-flagged', 'lace-skirt-cream'] }, bubble: 'a', sel: { 'info:vi': null } }, 'vi');
  assert.equal(f.trunc, true);   // generic guard: a flagged member makes bubble a guarded
});
test('set bubble a: custom set price override + saving note, lead-in', () => {
  const { C } = mk(); const set = { ...SET, price: 800000 };
  const r = C.composeCopy('set', { set, bubble: 'a', sel: { 'info:vi': 'li-info-3' } }, 'vi');
  assert.ok(r.text.startsWith('Soft gửi bạn thông tin mẫu ạ 🌷\n\nLace Top 🦢'));
  assert.ok(r.text.endsWith('• Giá set: 800.000đ (tiết kiệm 50.000đ)'));
  assert.equal(C.setPrice(set), 800000); assert.equal(C.setSum(set), 850000); assert.equal(C.setPrice({ ...SET, price: '' }), 850000);
  assert.equal(C.setPrice({ ...SET, price: 900000 }), 900000);
  assert.ok(!C.composeCopy('set', { set: { ...SET, price: 900000 }, bubble: 'a' }, 'vi').text.includes('tiết kiệm'));
});
test('set bubble b: every size chart labelled by product name', () => {
  const { C } = mk(); const r = C.composeCopy('set', { set: SET, bubble: 'b', sel: { 'size:vi': 'li-size-1' } }, 'vi');
  assert.equal(r.text, ['Dạ mình gửi bảng size để bạn tiện tham khảo nhen:', 'Lace Top\n' + C.clean(P('lace-top').sizeVi), 'Lace Skirt · Kem\n' + C.clean(P('lace-skirt-cream').sizeVi)].join('\n\n'));
});
test('set bubble c: measurement request is her IG02 sentence; EN not invented', () => {
  const { C } = mk();
  assert.equal(C.composeCopy('set', { set: SET, bubble: 'c' }, 'vi').text, 'Nếu bạn cần tư vấn thêm về size, cho Soft xin số đo 3 vòng, chiều cao và cân nặng nhen 💕');
  assert.equal(C.composeCopy('set', { set: SET, bubble: 'c' }, 'en').missing, 'en');
});
test('set bubble d: post link(s); absent when none', () => {
  const { C } = mk();
  assert.equal(C.composeCopy('set', { set: SET, bubble: 'd' }, 'vi').text, 'https://instagram.com/softembrace.made/p/DUQkDk6kTDg/');
  assert.equal(C.composeCopy('set', { set: { ...SET, postUrl: 'https://x.test/p/1' }, bubble: 'd' }, 'vi').text, 'https://x.test/p/1');
  assert.equal(C.setBubble({ ...SET, items: ['noir-midi-skirt', 'soft-halter-top-white'] }, 'd', 'vi'), null);
});
test('set, en, composes with VND prefix; missing EN member -> missing', () => {
  const { st, C } = mk(); const r = C.composeCopy('set', { set: { ...SET, price: 800000 }, bubble: 'a' }, 'en');
  assert.ok(r.text.endsWith('• Set price: VND 800,000 (you save VND 50,000)'));
  st.ov['lace-top'] = { descEn: '' };
  const m = C.composeCopy('set', { set: SET, bubble: 'a' }, 'en'); assert.equal(m.missing, 'en'); assert.equal(m.text, '');
});
test('set bubble a: manual override text is used verbatim', () => {
  const { C } = mk(); const r = C.composeCopy('set', { set: { ...SET, ov: { vi: '  Tự soạn  ', en: null } }, bubble: 'a' }, 'vi');
  assert.equal(r.text, 'Tự soạn');
});
test('post link lead-out: off by default, appended after info when on', () => {
  const { C } = mk(); const url = P('lace-top').postUrl;
  assert.ok(!C.composeCopy('info', { pid: 'lace-top' }, 'vi').text.includes(url));
  const r = C.composeCopy('info', { pid: 'lace-top', link: true, sel: { 'info:vi': null } }, 'vi');
  assert.equal(r.text, C.clean(P('lace-top').descVi) + '\n\n' + url);
  const both = C.composeCopy('both', { pid: 'lace-top', link: true, sel: { 'info:vi': null, 'size:vi': null } }, 'vi');
  assert.equal(both.text, [C.clean(P('lace-top').descVi), url, C.clean(P('lace-top').sizeVi)].join('\n\n'));
  assert.equal(C.composeCopy('info', { pid: 'noir-midi-skirt', link: true }, 'vi').text, C.clean(P('noir-midi-skirt').descVi));
});
test('order total = items + shipping mode (444.000đ example), never the template literal', () => {
  const { st, C } = mk(); st.draft.lines = [{ pid: 'lace-top', size: 'M', qty: 1 }]; st.set.fee = 24000; st.draft.ship = 'fee';
  st.ov['lace-top'] = { price: 420000 };
  assert.equal(C.calc().total, 444000);
  const t = C.composeCopy('order', {}, 'vi').text;
  assert.ok(t.includes('Tổng cộng là 444.000đ') && t.includes('Shipping: 24.000đ') && !t.includes('25.000đ'));
  st.draft.ship = 'free'; assert.equal(C.calc().total, 420000);
  st.draft.ship = 'custom'; st.draft.custom = 30000; assert.equal(C.calc().total, 450000);
});
test('seed lead-ins: her verbatim IG phrases are marked sheet, no invented EN on them', () => {
  const L = SEED.leadIns;
  const sheet = (a, vi) => L[a].find(x => x.vi === vi);
  for (const [a, vi] of [['size', 'Dạ mình gửi bảng size để bạn tiện tham khảo nhen:'], ['size', 'Nếu bạn cần tư vấn thêm về size, cho Soft xin số đo 3 vòng, chiều cao và cân nặng nhen 💕'], ['thanks', 'ui dạ mình nhận được rùi ạ'], ['thanks', 'cảm ơn bạn nhìu, Soft sẽ tranh thủ gói đơn gửi đến bạn ạ 💗']]) {
    const x = sheet(a, vi); assert.ok(x, vi); assert.equal(x.seed, 'sheet'); assert.equal(x.en, '');
  }
  assert.ok(SEED.flow.some(e => e.id === 'tracking-note' && e.vi === 'dạ mình gửi mvđ của Giao Hàng Nhanh để bạn tiện theo dõi nhen'));
  assert.ok(SEED.flow.some(e => e.id === 'tracking-code' && e.vi === '{{trackingCode}}'));
  assert.ok(SEED.flow.some(e => e.id === 'ask-feedback' && e.vi === 'dạ có hình feedback xinh xinh bạn cho Soft ngắm với nhen 💗'));
  for (const a of Object.keys(L)) for (const x of L[a]) assert.ok(['sheet', 'draft'].includes(x.seed));
});
test('set suggestions only reference products that exist', () => {
  const ids = new Set(SEED.products.map(p => p.id)); for (const [a, b] of SEED.setSuggestions) { assert.ok(ids.has(a) && ids.has(b)); }
  assert.equal(SEED.setSuggestions.length, 9);
  assert.equal(new Set(SEED.setSuggestions.map(x => x.slice().sort().join('|'))).size, 9);
});
test('truncated product: trunc true, text still composed', () => {
  const { C, st } = mkf(); const r = C.composeCopy('info', { pid: 'zz-flagged' }, 'vi');
  assert.equal(r.trunc, true); assert.ok(r.text.length > 20);
  assert.equal(C.composeCopy('info', { pid: 'zz-flagged' }, 'en').trunc, false);
  st.ov['zz-flagged'] = { descVi: 'đã sửa' }; assert.equal(C.composeCopy('info', { pid: 'zz-flagged' }, 'vi').trunc, false);   // her edit clears the flag
});
test('full product sheet: 20 products, none truncated, ids unique, price equals the Giá line, sizes present', () => {
  assert.equal(SEED.products.length, 20);
  assert.equal(new Set(SEED.products.map(p => p.id)).size, 20);
  for (const p of SEED.products) {
    assert.ok(!('truncated' in p), p.id);
    assert.ok(!/\.\.\.$/.test(p.descVi) && !/\.\.\.$/.test(p.descEn), p.id + ' ends with an ellipsis');
    const g = p.descVi.match(/Giá:\s*([\d.,]+)đ/); assert.ok(g, p.id); assert.equal(Number(g[1].replace(/[.,]/g, '')), p.price, p.id);
    assert.ok(p.sizes.length >= 2 && p.sizeVi && p.sizeEn && p.descEn, p.id);
    assert.ok(!/ • /.test(p.descEn) && !/ • /.test(p.sizeEn), p.id + ' English bullets are split into lines');
  }
  assert.deepEqual(SEED.products.filter(p => p.madeToOrder).map(p => p.id), ['ivory-dot-midi-skirt', 'noir-midi-skirt']);
  assert.ok(P('fleur-slip-dress-blue').noteVi.startsWith('Chiều dài đầm'));
  assert.equal(P('lace-top').postUrl, 'https://instagram.com/softembrace.made/p/DUQkDk6kTDg/');
});
test('missing language blocks the requested language', () => {
  const { st, C } = mk(); st.ov['lace-top'] = { descEn: '' };
  const r = C.composeCopy('info', { pid: 'lace-top' }, 'en');
  assert.equal(r.missing, 'en'); assert.equal(r.text, '');
});
test('lead with trailing spaces and CRLF is normalised', () => {
  const { st, C } = mk(); st.lead.custom.unshift({ id: 'lu-y', action: 'info', vi: '  Xin chào   \r\n\r\n\r\n\r\nbạn  ', en: '' });
  const r = C.composeCopy('info', { pid: 'noir-midi-skirt', ...sel({ 'info:vi': 'lu-y' }) }, 'vi');
  assert.ok(r.text.startsWith('Xin chào\n\nbạn\n\n')); assert.ok(!/\r/.test(r.text)); assert.ok(!/[ \t]\n/.test(r.text)); assert.ok(!/\n{3,}/.test(r.text));
});
test('fresh install: nothing is pre-selected; explicit default seed is honoured', () => {
  const { st, C } = mk();
  for (const a of ['info', 'size', 'order', 'thanks']) for (const l of ['vi', 'en']) assert.equal(C.leadSel(a, l), null);
  assert.equal(C.composeCopy('info', { pid: 'lace-top' }, 'vi').lead, '');
});
test('hidden / edited seeds', () => {
  const { st, C } = mk(); st.lead.hidden.push('li-info-3'); st.lead.edits['li-info-4'] = { vi: 'Đã sửa' };
  const ids = C.leadList('info', 'vi').map(x => x.id);
  assert.ok(!ids.includes('li-info-3')); assert.equal(C.leadList('info', 'vi').find(x => x.id === 'li-info-4').text, 'Đã sửa');
});
test('every action x lang x {none, each seed}: never starts with newline, never \\n\\n\\n', () => {
  const { st, C } = mk(); let n = 0;
  const acts = { info: 'info', size: 'size', both: 'info', set: 'info', order: 'order', thanks: 'thanks' };
  for (const [action, la] of Object.entries(acts)) for (const l of ['vi', 'en']) {
    const ids = [null, ...SEED.leadIns[la].map(x => x.id)];
    for (const id of ids) for (const pid of SEED.products.map(p => p.id)) {
      const k = (action === 'both' ? ['info', 'size'] : [la]);
      const s = {}; k.forEach(a => { s[a + ':' + l] = a === la || action === 'both' ? id && (id.startsWith('li-' + a) ? id : null) : null; });
      if (action === 'both' && id && id.startsWith('li-size')) { s['size:' + l] = id; s['info:' + l] = null; }
      const r = C.composeCopy(action, { pid, set: { ...SET, items: [pid, pid === 'lace-skirt-cream' ? 'lace-top' : 'lace-skirt-cream'] }, bubble: ['a','b'][n % 2], sel: s }, l);
      n++;
      if (r.missing) continue;
      assert.ok(!/^\s/.test(r.text) && !/\s$/.test(r.text), action + l + id + pid);
      assert.ok(!/\n{3,}/.test(r.text), action + l + id + pid);
      assert.ok(!r.text.includes('{{'), action + l + id + pid);
    }
  }
  assert.ok(n > 500);
});
