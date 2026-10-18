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

/* ---------- round 3: stages, edit helpers, set bubble overrides ---------- */
test('STAGES: exactly the 5 stages in sales-flow order with the founder labels', () => {
  const { C } = mk();
  assert.deepEqual(C.STAGES.map(g => g.id), ['greet', 'size', 'info', 'order', 'out']);
  assert.deepEqual(C.STAGES.map(g => g.lab[0].join(' ')), ['Chào hỏi', 'Tư vấn size', 'Xin thông tin', 'Tạo đơn', 'Check out']);
});
test('STAGES (v6): one hero per Chào hỏi / Tư vấn size, composer on Tạo đơn, two sequence cards on Check out, every referenced message exists', () => {
  const { C } = mk(); const seen = {};
  const g = id => C.STAGES.find(x => x.id === id);
  assert.deepEqual(g('greet').cards.map(c => c.kind), ['greet']);
  assert.deepEqual(g('size').cards.map(c => c.id), ['sizes', 'fit-size', 'between-sizes', 'ask-measurements']);
  assert.deepEqual(g('size').more.map(c => c.id), ['will-think', 'over-size-has-option', 'over-size-no-option', 'too-small-size']);
  assert.deepEqual(g('info').cards.map(c => c.id), ['shipping-info', 'shipping-fee']);
  assert.deepEqual(g('order').cards.map(c => c.kind), ['composer']);
  assert.deepEqual(g('out').cards.map(c => c.id), ['pay', 'track', 'ask-feedback']);
  assert.deepEqual(g('out').cards[0].items, ['paid-ack', ['paid-thanks', 'thanks-custom']]);
  assert.deepEqual(g('out').cards[1].items, ['tracking-note', 'tracking-code']);
  for (const st of C.STAGES) for (const c of st.cards.concat(st.more, st.nav || [])) for (const id of C.cardIds(c)) { assert.ok(C.FM[id], 'missing ' + id); if (!(c.id === 'extra-photos')) { assert.ok(!seen[id] || seen[id] === st.id, 'dup ' + id); seen[id] = st.id; } }
  assert.ok(!C.cardIds({ id: 'x', kind: 'info' }).length, 'the old product chip cards are gone');
});
test('STAGES: required items sit in the right stage', () => {
  const { C } = mk();
  const at = { 'open-first': 'greet', 'open-returning': 'greet', 'ask-measurements': 'size', 'fit-size': 'size', 'between-sizes': 'size', 'over-size-has-option': 'size', 'over-size-no-option': 'size', 'too-small-size': 'size', 'will-think': 'size',
    'shipping-info': 'info', 'shipping-fee': 'info', 'paid-ack': 'out', 'paid-thanks': 'out', 'thanks-custom': 'out', 'tracking-note': 'out', 'tracking-code': 'out', 'ask-feedback': 'out', 'return-policy': 'out', 'thanks-generic': 'out' };
  for (const [id, g] of Object.entries(at)) assert.equal(C.stageOf(id), g, id);
});
test('ask-measurements is the IG02 sentence verbatim', () => {
  assert.equal(SEED.flow.find(e => e.id === 'ask-measurements').vi, 'Nếu bạn cần tư vấn thêm về size, cho Soft xin số đo 3 vòng, chiều cao và cân nặng nhen 💕');
});
test('isEdited ignores whitespace-only differences', () => {
  const { C } = mk();
  assert.equal(C.isEdited('abc', 'abc  \n'), false); assert.equal(C.isEdited('abc', undefined), false); assert.equal(C.isEdited('abc', 'abd'), true);
});
test('stripLead / stripEnd', () => {
  const { C } = mk();
  assert.equal(C.stripLead('Xin chào\n\nNội dung', 'Xin chào'), 'Nội dung'); assert.equal(C.stripLead('Nội dung', 'Xin chào'), 'Nội dung');
  assert.equal(C.stripEnd('Nội dung\n\nhttps://x', 'https://x'), 'Nội dung'); assert.equal(C.stripEnd('abc', ''), 'abc');
});
test('untemplate turns values back into tokens, longest first, and reports lost tokens', () => {
  const { C } = mk();
  const r = C.untemplate('Mẫu Lace Top: Lace Top 🦢\nGiá 1', [['item', 'Lace Top'], ['itemInfo', 'Lace Top 🦢\nGiá 1']]);
  assert.equal(r.tpl, 'Mẫu {{item}}: {{itemInfo}}'); assert.deepEqual(r.lost, []);
  const r2 = C.untemplate('chỉ lời chào', [['itemInfo', 'dài']]); assert.deepEqual(r2.lost, ['itemInfo']); assert.equal(r2.tpl, 'chỉ lời chào');
});
test('order template round trip: edit -> untemplate -> composeCopy gives the edited text again', () => {
  const { st, C } = mk(); st.draft.lines = [{ pid: 'lace-top', size: 'M', qty: 2 }];
  const t = C.composeCopy('order', {}, 'vi').text + '\nCảm ơn nhé';
  const u = C.untemplate(t, [['orderLines', C.linesText('vi')], ['total', C.totalStr('vi')]]);
  assert.ok(u.tpl.includes('{{orderLines}}') && u.tpl.includes('{{total}}'));
  st.ov.__ord = { vi: u.tpl };
  assert.equal(C.composeCopy('order', {}, 'vi').text, C.clean(t));
  st.draft.lines[0].qty = 3; assert.ok(/ x3/.test(C.composeCopy('order', {}, 'vi').text));
});
test('set bubble override (bov) replaces b/c/d text per language; a uses set.ov; others untouched', () => {
  const { st, C } = mk(); const set = { id: 's', items: ['lace-top', 'lace-skirt-cream'], price: null, name: '', postUrl: '', checked: true, ov: { vi: null, en: null }, bov: { c: { vi: 'Xin số đo nhen' } } };
  assert.equal(C.composeCopy('set', { set, bubble: 'c' }, 'vi').text, 'Xin số đo nhen');
  assert.equal(C.setBubble(set, 'c', 'vi').auto, false);
  assert.equal(C.composeCopy('set', { set, bubble: 'c' }, 'en').missing, 'en', 'EN has no bubble c text, the VI override is not used');
  assert.ok(C.composeCopy('set', { set, bubble: 'b' }, 'vi').text.startsWith('Lace Top'));
  set.bov.d = { vi: 'https://x.y/z' }; assert.equal(C.composeCopy('set', { set, bubble: 'd' }, 'vi').text, 'https://x.y/z');
});
test('no brown token left in the sources (Liver #5F3E31 and its tints)', () => {
  const css = readFileSync(new URL('../src/app.css', import.meta.url), 'utf8') + readFileSync(new URL('../src/index.src.html', import.meta.url), 'utf8') + readFileSync(new URL('../build.py', import.meta.url), 'utf8');
  assert.ok(!/5F3E31|95,\s*62,\s*49|#5E5048|#6F635B|#4A3E37|20,\s*14,\s*10|#181716/i.test(css));
});

// ---------- Round 4: newest-first order, collections, category filter, product photos, icons ----------
import { existsSync, statSync, readdirSync } from 'node:fs';
const DIST = new URL('../dist/', import.meta.url);
test('every product has released, collection and a photo slug; released is shared by the variants of one product', () => {
  const byName = {};
  for (const p of SEED.products) {
    assert.ok(Number.isInteger(p.released) && p.released > 0, p.id + ' released');
    assert.ok(['Fall 25', 'Spring 26', 'Summer 26'].includes(p.collection), p.id + ' collection');
    assert.ok(p.img && /^[a-z0-9-]+$/.test(p.img), p.id + ' img');
    assert.ok(/^#[0-9A-F]{6}$/.test(p.tint), p.id + ' tint');
    (byName[p.name] = byName[p.name] || new Set()).add(p.released);
  }
  for (const [n, set] of Object.entries(byName)) assert.equal(set.size, 1, n + ' variants share one release');
});
test('default sort is newest first: Summer 26 (Butter, Fleur, Embroidery, Lace Trim, Flowy, Still Cami), then Spring 26, then Fall 25', () => {
  const { C } = mk(); const names = [], seen = new Set();
  C.PS.forEach(p => { if (!seen.has(p.name)) { seen.add(p.name); names.push(p.name); } });
  assert.equal(names[0], 'Butter Top'); assert.equal(names[names.length - 1], 'Soft Halter Top');
  assert.deepEqual(names, ['Butter Top', 'Fleur Slip Dress', 'Embroidery Pants', 'Lace Trim Blouse', 'Flowy Skirt', 'Still Cami Top', 'Lace Skirt', 'Lace Top', 'Shimmer Top', 'Noir Midi Skirt', 'Ivory Dot Midi Skirt', 'Ivory Dot Blouse', 'Noir Dotty Top', 'Soft Halter Top']);
  const colls = C.collections(C.PS).map(g => g.name + ':' + g.items.length);
  assert.deepEqual(colls, ['Summer 26:10', 'Spring 26:4', 'Fall 25:6']);
  const ids = C.PS.map(p => p.id); assert.equal(ids.indexOf('fleur-slip-dress-blue') < ids.indexOf('fleur-slip-dress-yellow'), true, 'variants keep their sheet order');
  assert.equal(new Set(ids).size, 20);
});
test('category filter + counts: Tất cả 20 · Áo 11 · Váy 6 · Đầm 2 · Quần 1', () => {
  const { C } = mk(); const cc = C.catCounts(C.PS);
  assert.deepEqual(cc, { all: 20, top: 11, skirt: 6, dress: 2, pants: 1 });
  assert.deepEqual(C.CATL, { top: 'Áo', skirt: 'Váy', dress: 'Đầm', pants: 'Quần' });
  assert.deepEqual(C.byCat(C.PS, 'dress').map(p => p.id).sort(), ['fleur-slip-dress-blue', 'fleur-slip-dress-yellow']);
  assert.deepEqual(C.byCat(C.PS, 'pants').map(p => p.id), ['embroidery-pants']);
  for (const id of ['lace-trim-blouse-cream', 'butter-top', 'shimmer-top']) assert.equal(C.PM[id].category, 'top');
  assert.equal(C.byCat(C.PS, 'skirt').every(p => /Skirt/.test(p.name)), true);
  assert.equal(C.byCat(C.PS, 'all').length, 20);
});
test('image mapping covers all 20 products, one photo each, files exist at 168 and 320, thumbnails stay small', () => {
  const { C } = mk(); const slugs = new Set(); let total = 0;
  for (const p of SEED.products) {
    assert.ok(!slugs.has(p.img), 'duplicate ' + p.img); slugs.add(p.img);
    assert.ok(existsSync(new URL('../assets/product-images/' + p.img + '.webp', import.meta.url)), 'source photo for ' + p.id);
    for (const big of [false, true]) { const u = C.imgOf(p, big); assert.match(u, /^img\/[a-z0-9-]+-(168|320)\.webp$/); const f = new URL(u, DIST); assert.ok(existsSync(f), u); const n = statSync(f).size; total += n; assert.ok(n < (big ? 24000 : 10000), u + ' ' + n); }
  }
  assert.equal(slugs.size, 20); assert.ok(total < 250 * 1024, 'thumbnails total ' + total);
  const mapping = { 'soft-halter-white': 'soft-halter-top-white', 'still-cami-taupe': 'still-cami-top-taupe', 'fleur-slip-blue': 'fleur-slip-dress-blue' };
  for (const [s, id] of Object.entries(mapping)) assert.equal(C.PM[id].img, s);
});
test('thumbnails are never inlined and the app has no emoji disc images', () => {
  const html = readFileSync(new URL('index.html', DIST), 'utf8');
  assert.ok(!/data:image\/(webp|jpeg|png)/.test(html.replace(/mask:url\(data:image\/png[^)]*\)/g, '')), 'no inlined bitmap');
});
test('logo wordmark <= 8 KB; service worker precaches every photo and the logo; manifest and icons are light', () => {
  assert.ok(statSync(new URL('img/logo.webp', DIST)).size <= 8 * 1024);
  const sw = readFileSync(new URL('sw.js', DIST), 'utf8');
  const files = readdirSync(new URL('img/', DIST));
  assert.equal(files.length, 41);
  for (const f of files) assert.ok(sw.includes('img/' + f), f);
  const man = JSON.parse(readFileSync(new URL('manifest.webmanifest', DIST), 'utf8'));
  const lum = h => { const [r, g, b] = [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16) / 255); return .2126 * r + .7152 * g + .0722 * b; };
  assert.ok(lum(man.background_color) > .35 && lum(man.theme_color) > .8, man.background_color + ' ' + man.theme_color);
  assert.notEqual(man.background_color.toUpperCase(), '#2A2B2A');
});

// ---------- Round 5: colours, icon, insets, contrast ----------
import { inflateSync } from 'node:zlib';
const SRCF = f => readFileSync(new URL('../src/' + f, import.meta.url), 'utf8');
const UISRC = () => SRCF('app.css') + '\n' + SRCF('app.js') + '\n' + SRCF('index.src.html') + '\n' + SRCF('compose.js') + '\n' + readFileSync(new URL('../build.py', import.meta.url), 'utf8');
test('Old Rose and brown are gone from src css/js/html and build.py (hex, rgb and the name)', () => {
  const all = UISRC();
  assert.ok(!/CC8C87|A84E47|93443E|DDA39E|F4E9E3|E3B0AB|5F3E31/i.test(all), 'rose / brown hex');
  assert.ok(!/204,\s*140,\s*135|168,\s*78,\s*71|95,\s*62,\s*49/.test(all), 'rose / brown rgb');
  assert.ok(!/old\s*rose/i.test(all), 'the name Old Rose');
  // hue scan: any hex colour in the UI sources that is a dark, saturated brown/red-orange is rejected
  const bad = [];
  for (const m of all.matchAll(/#([0-9a-f]{6})\b/gi)) {
    const [r, g, b] = [0, 2, 4].map(i => parseInt(m[1].slice(i, i + 2), 16) / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (!d) continue;
    const s = d / (1 - Math.abs(2 * l - 1)); let hh = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; hh = (hh * 60 + 360) % 360;
    if ((hh >= 0 && hh <= 50 || hh >= 345) && s > 0.2 && l < 0.5) bad.push(m[0] + ' h' + Math.round(hh) + ' s' + s.toFixed(2) + ' l' + l.toFixed(2));
  }
  // #B3261E / #FF8A80 are the red of Xoá and errors (hue 3 / 5), allowed explicitly
  const rest = bad.filter(x => !/^#(B3261E|FF8A80)/i.test(x));
  assert.deepEqual(rest, [], 'brown-ish hexes: ' + rest.join(', '));
});
test('red (#B3261E / #FF8A80) is only used through --destructive / --toast-bad', () => {
  const css = SRCF('app.css');
  for (const m of css.matchAll(/#(B3261E|FF8A80)/gi)) { const line = css.slice(css.lastIndexOf('\n', m.index) + 1, css.indexOf('\n', m.index)); assert.ok(/--destructive|--toast-bad/.test(line.slice(0, line.indexOf(m[0]) + 1).split(';').pop() || '') || /--destructive:|--toast-bad:/.test(line), line.slice(0, 120)); }
  assert.ok(!/#B3261E|#FF8A80/i.test(SRCF('app.js') + SRCF('index.src.html')));
});
test('no 100vh/100dvh anywhere; env(safe-area-inset) is read only by the JS probe', () => {
  assert.ok(!/100d?vh|100svh|100lvh/.test(SRCF('app.css') + SRCF('app.js')));
  assert.ok(!/env\(/.test(SRCF('app.css')), 'no env() in css');
  const html = readFileSync(new URL('index.html', DIST), 'utf8');
  assert.equal((html.match(/env\(safe-area/g) || []).length, 2, 'the probe string names top and bottom once each (one probe)');
  assert.ok((html.match(/padding-top:env\(safe-area-inset-top,0px\);padding-bottom:env\(safe-area-inset-bottom,0px\)/g) || []).length === 1, 'exactly one probe');
  assert.ok(!/--safe-top|--safe-bottom/.test(SRCF('app.css') + SRCF('app.js')));
});
test('manifest background is Vanilla; apple-touch-icon is a Vanilla tile with a Jet logomark', () => {
  const man = JSON.parse(readFileSync(new URL('manifest.webmanifest', DIST), 'utf8'));
  assert.equal(man.background_color, '#F2E7AB'); assert.equal(man.theme_color, '#FCFBF5');
  const png = readFileSync(new URL('icons/apple-touch-icon.png', DIST));
  let off = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (off < png.length) { const len = png.readUInt32BE(off), type = png.toString('ascii', off + 4, off + 8); if (type === 'IHDR') { w = png.readUInt32BE(off + 8); h = png.readUInt32BE(off + 12); ct = png[off + 17]; } if (type === 'IDAT') idat.push(png.subarray(off + 8, off + 8 + len)); off += 12 + len; }
  assert.equal(ct, 2, 'RGB'); const raw = inflateSync(Buffer.concat(idat)), bpp = 3, stride = w * bpp, px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) { const f = raw[y * (stride + 1)]; for (let x = 0; x < stride; x++) { const a = x >= bpp ? px[y * stride + x - bpp] : 0, up = y ? px[(y - 1) * stride + x] : 0, c = x >= bpp && y ? px[(y - 1) * stride + x - bpp] : 0; let v = raw[y * (stride + 1) + 1 + x]; v = f === 0 ? v : f === 1 ? v + a : f === 2 ? v + up : f === 3 ? v + ((a + up) >> 1) : v + (() => { const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); return pa <= pb && pa <= pc ? a : pb <= pc ? up : c; })(); px[y * stride + x] = v & 255; } }
  const at = (x, y) => [...px.subarray(y * stride + x * 3, y * stride + x * 3 + 3)];
  assert.deepEqual(at(0, 0), [242, 231, 171], 'corner pixel is Vanilla #F2E7AB');
  assert.deepEqual(at(12, 90), [242, 231, 171]);
  let dark = 0; for (let i = 0; i < px.length; i += 3) if (px[i] < 70 && px[i + 1] < 70) dark++;
  assert.ok(dark > 600, 'Jet logomark pixels present: ' + dark);
});
// ---- contrast of the token pairs (WCAG), read from the real CSS ----
function tokens(block) { const o = {}; for (const m of block.matchAll(/--([a-z0-9-]+):\s*(#[0-9a-fA-F]{6})\b/g)) o[m[1]] = m[2]; return o; }
const cssSrc = SRCF('app.css'), lightT = tokens(cssSrc.slice(cssSrc.indexOf(':root{'), cssSrc.indexOf('@supports'))), darkT = tokens(cssSrc.slice(cssSrc.indexOf('@media(prefers-color-scheme:dark){:root{')));
const lumHex = h => { const f = c => c <= .03928 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; const [r, g, b] = [1, 3, 5].map(i => f(parseInt(h.slice(i, i + 2), 16) / 255)); return .2126 * r + .7152 * g + .0722 * b; };
const CR = (a, b) => { const x = lumHex(a), y = lumHex(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
export const CONTRAST = [];
for (const [mode, T, text, surfaces] of [['light', lightT, 4.5, ['bg', 'bg-grouped', 'bg-cell', 'bg-sheet', 'bg-paper']], ['dark', darkT, 4.5, ['bg', 'bg-cell', 'bg-sheet', 'bg-paper']]]) {
  test(`contrast ${mode}: text tokens on their surfaces, on-primary, accent-ui, badges, notices`, () => {
    const t = { ...lightT, ...(mode === 'dark' ? darkT : {}) };
    for (const fg of ['label', 'label-2', 'label-3']) for (const s of surfaces) { const c = CR(t[fg], t[s]); CONTRAST.push([mode, fg + ' on ' + s, c]); assert.ok(c >= 4.5, `${mode} ${fg} on ${s} = ${c.toFixed(2)}`); }
    for (const [fg, bg, min] of [['on-primary', 'primary', 7], ['on-primary', 'primary-pressed', 7], ['accent-ui', 'bg-sheet', 4.5], ['accent-ui', 'bg-cell', 4.5], ['accent-ui', 'bg-paper', 4.5], ['label', 'sel-fill', 4.5], ['label', 'tonal', 4.5], ['label-2', 'tonal', 4.5], ['label', 'insert', 4.5], ['label', 'insert-rest', 4.5], ['badge-fg', 'badge-bg', 7], ['destructive', 'bg-sheet', 4.5], ['destructive', 'bg-cell', 4.5], ['success', 'bg-sheet', 4.5], ['icon', 'bg-grouped', 4.5], ['label', 'thumb', 4.5], ['accent-ui', 'sel-fill', 4.5]]) { const c = CR(t[fg], t[bg]); CONTRAST.push([mode, fg + ' on ' + bg, c]); assert.ok(c >= min, `${mode} ${fg} on ${bg} = ${c.toFixed(2)} (< ${min})`); }
    for (const [fg, bg] of [['edge', 'bg-sheet'], ['primary', 'bg']]) { const c = CR(t[fg], t[bg]); CONTRAST.push([mode, fg + ' vs ' + bg + ' (non-text)', c]); assert.ok(c >= 3, `${mode} ${fg} vs ${bg} = ${c.toFixed(2)}`); }
  });
}
test('spec numbers: on-primary 7.59 (light, Davy) and 11.37 (dark, Vanilla); Jet on Vanilla icon 11.37', () => {
  assert.ok(Math.abs(CR(lightT['on-primary'], lightT.primary) - 7.59) < .02);
  assert.ok(Math.abs(CR(darkT['on-primary'], darkT.primary) - 11.37) < .02);
  assert.ok(Math.abs(CR('#2A2B2A', '#F2E7AB') - 11.37) < .02);
  assert.equal(lightT.primary, '#4D5162'); assert.equal(darkT.primary, '#F2E7AB'); assert.equal(darkT.bg, '#1C1D1C');
});
test('service worker cache name carries the v6 bump', () => {
  assert.ok(/const CACHE = 'se-v6-[0-9a-f]{10}'/.test(readFileSync(new URL('sw.js', DIST), 'utf8')));
});

// ---------- Round 6 (design-v6): greet, sizes, entry, order tokens, paired messages, context totals ----------
const mk6 = lines => mk({ draft: { lines: lines || [], ship: 'courier', custom: 0, info: '', bank: false, copiedAt: 0, done: {}, at: 0 } });
const T = (C, a, ref, l = 'vi') => C.composeCopy(a, ref, l);
test('greet: 3 variants x 0/1/2 products x VI/EN (preview == clipboard source, no tokens left, no triple newline)', () => {
  const { C } = mk6(); let n = 0;
  for (const v of ['new', 'back', 'info']) for (const pids of [[], ['lace-top'], ['lace-top', 'lace-skirt-cream']]) for (const l of ['vi', 'en']) {
    const r = T(C, 'greet', { v, pids, sel: { 'info:vi': null, 'info:en': null } }, l); n++;
    assert.ok(!/\{\{/.test(r.text) && !/\n{3,}/.test(r.text) && !/^\s|\s$/.test(r.text), v + pids + l);
    if (v === 'info' && !pids.length) { assert.equal(r.text, ''); assert.deepEqual(r.pending, ['item']); continue; }
    for (const id of pids) assert.ok(r.text.includes(C.clean(P(id)[l === 'vi' ? 'descVi' : 'descEn'])), 'info of ' + id);
    if (v === 'new' && l === 'vi') assert.ok(r.text.startsWith('Soft Embrace chào bạn,'));
    if (v === 'back' && l === 'vi') assert.ok(r.text.startsWith('Dạ chào bạn,'));
    if (v === 'info') assert.ok(!/chào bạn|Hi /i.test(r.text.split('\n')[0]));
    assert.equal(r.bubbles, null, 'never auto-split');
  }
  assert.equal(n, 18);
});
test('greet without a product is the greeting only: slot and dangling colon removed (vi and en)', () => {
  const { C } = mk6();
  assert.equal(T(C, 'greet', { v: 'new', pids: [] }).text, 'Soft Embrace chào bạn,\n\nCảm ơn bạn đã quan tâm đến sản phẩm của chúng mình, Soft xin gửi bạn thông tin sản phẩm ạ');
  assert.ok(!/\{\{|for \{\{/.test(T(C, 'greet', { v: 'back', pids: [] }, 'en').text));
});
test('greet with two products: both infos, joined by a blank line, in context order; info variant takes the opening line', () => {
  const { C } = mk6(); const r = T(C, 'greet', { v: 'new', pids: ['lace-top', 'lace-skirt-cream'] });
  assert.ok(r.text.indexOf('Lace Top 🦢') < r.text.indexOf('Lace Skirt'));
  assert.ok(r.text.includes(C.clean(P('lace-top').descVi) + '\n\n' + C.clean(P('lace-skirt-cream').descVi)));
  const i = T(C, 'greet', { v: 'info', pids: ['lace-top', 'lace-skirt-cream'], sel: { 'info:vi': 'li-info-3' } });
  assert.ok(i.text.startsWith('Soft gửi bạn thông tin mẫu ạ 🌷\n\nLace Top 🦢') && i.lead === 'Soft gửi bạn thông tin mẫu ạ 🌷');
});
test('greet: a product with no EN info is left out and listed in partial; all missing -> missing', () => {
  const { st, C } = mk6(); st.ov['lace-skirt-cream'] = { descEn: '' };
  const r = T(C, 'greet', { v: 'new', pids: ['lace-top', 'lace-skirt-cream'] }, 'en');
  assert.deepEqual(r.partial, ['lace-skirt-cream']); assert.ok(r.text.includes('Lace Top') && !r.text.includes('Lace Skirt'));
  st.ov['lace-top'] = { descEn: '' };
  assert.equal(T(C, 'greet', { v: 'new', pids: ['lace-top', 'lace-skirt-cream'] }, 'en').missing, 'en');
});
test('sizes: one product = the chart exactly as before; two products = labelled blocks in context order (acceptance 6)', () => {
  const { C } = mk6();
  assert.equal(T(C, 'sizes', { pids: ['lace-top'], sel: { 'size:vi': null } }).text, C.clean(P('lace-top').sizeVi));
  const r = T(C, 'sizes', { pids: ['lace-top', 'lace-skirt-cream'], sel: { 'size:vi': null } });
  assert.equal(r.text, 'Lace Top\n' + C.clean(P('lace-top').sizeVi) + '\n\nLace Skirt · Kem\n' + C.clean(P('lace-skirt-cream').sizeVi));
  assert.ok(r.text.startsWith('Lace Top\n') && r.text.includes('\n\nLace Skirt · Kem\n'));
  assert.equal(T(C, 'sizes', { pids: ['lace-skirt-cream', 'lace-top'], sel: { 'size:vi': null } }).text.indexOf('Lace Skirt · Kem\n'), 0, 'order follows the context');
});
test('sizes: opening line + measurement request; EN partial and missing; empty context is a pending item', () => {
  const { st, C } = mk6();
  const r = T(C, 'sizes', { pids: ['lace-top'], ask: true, sel: { 'size:vi': 'li-size-1' } });
  assert.equal(r.text, 'Dạ mình gửi bảng size để bạn tiện tham khảo nhen:\n\n' + C.clean(P('lace-top').sizeVi) + '\n\nNếu bạn cần tư vấn thêm về size, cho Soft xin số đo 3 vòng, chiều cao và cân nặng nhen 💕');
  assert.deepEqual(T(C, 'sizes', { pids: [] }).pending, ['item']); assert.equal(T(C, 'sizes', { pids: [] }).text, '');
  st.ov['lace-skirt-cream'] = { sizeEn: '' };
  const e = T(C, 'sizes', { pids: ['lace-top', 'lace-skirt-cream'], sel: { 'size:en': null } }, 'en');
  assert.deepEqual(e.partial, ['lace-skirt-cream']); assert.ok(e.text.startsWith('Lace Top\n'));
  st.ov['lace-top'] = { sizeEn: '' }; assert.equal(T(C, 'sizes', { pids: ['lace-top', 'lace-skirt-cream'] }, 'en').missing, 'en');
});
test('sizes with 4 charts and the greeting with 4 infos are NOT split (the 1,000 character Instagram limit is unverified): bubbles stays null', () => {
  const { C } = mk6(); const four = ['embroidery-pants', 'lace-skirt-cream', 'lace-top', 'fleur-slip-dress-blue'];
  const g = T(C, 'greet', { v: 'new', pids: four }); const z = T(C, 'sizes', { pids: four });
  assert.ok(g.text.length > 1000, 'long: ' + g.text.length); assert.equal(g.bubbles, null); assert.equal(z.bubbles, null);
  assert.ok(!/EXTENSION POINT/.test(g.text));
  assert.ok(/EXTENSION POINT \(not implemented on purpose\)/.test(readFileSync(new URL('../src/compose.js', import.meta.url), 'utf8')), 'the extension point is commented');
});
test('entry: fit-size fills size + chart of the chosen product; unfilled data stays visible as [size] / [món] and is listed in pending', () => {
  const { C } = mk6();
  const a = T(C, 'entry', { tid: 'fit-size', pid: 'lace-top', fills: { size: 'M' } });
  assert.ok(a.text.startsWith('Dạ vậy bạn mặc size M mẫu này') && a.text.includes(C.clean(P('lace-top').sizeVi)) && !/\[/.test(a.text) && a.pending.length === 0);
  const b = T(C, 'entry', { tid: 'fit-size', pid: 'lace-top', fills: {} }); assert.ok(b.text.includes('size [size] mẫu') && !b.text.includes('[món]')); assert.deepEqual(b.pending, ['size']);
  const c = T(C, 'entry', { tid: 'fit-size', pid: null, fills: {} }); assert.deepEqual(c.pending.sort(), ['item', 'size']); assert.ok(c.text.includes('[món]') && c.text.includes('[size]'));
  const d = T(C, 'entry', { tid: 'between-sizes', pid: 'lace-top', fills: { sizeA: 'M', sizeB: 'L' } });
  assert.ok(d.text.includes('size M mẫu này sẽ vừa vặn') && d.text.includes('chọn size L'));
  const e = T(C, 'entry', { tid: 'tracking-code', pid: null, fills: {} }); assert.equal(e.text, '[mã vận đơn]'); assert.deepEqual(e.pending, ['trackingCode']);
  assert.equal(T(C, 'entry', { tid: 'tracking-code', fills: { trackingCode: 'GHN123' } }).text, 'GHN123');
  assert.equal(T(C, 'entry', { tid: 'extra-photos', fills: {} }).text.includes('[link hình]'), true);
  assert.equal(T(C, 'entry', { tid: 'paid-ack' }, 'en').missing, 'en');
});
test('paired messages (Check out): pay = tin 1 + tin 2 (variant by made-to-order), track = note + code, all one message each', () => {
  const { C } = mk6();
  assert.equal(T(C, 'entry', { tid: 'paid-ack' }).text, 'ui dạ mình nhận được rùi ạ');
  assert.equal(T(C, 'entry', { tid: 'paid-thanks' }).text, 'cảm ơn bạn nhìu, Soft sẽ tranh thủ gói đơn gửi đến bạn ạ 💗');
  assert.ok(/may/.test(T(C, 'entry', { tid: 'thanks-custom' }).text));
  assert.equal(T(C, 'entry', { tid: 'tracking-note' }).text, 'dạ mình gửi mvđ của Giao Hàng Nhanh để bạn tiện theo dõi nhen');
  assert.equal(T(C, 'entry', { tid: 'tracking-code', fills: { trackingCode: ' GHN9 ' } }).text, 'GHN9');
});
test('order: totals count sizeless lines, tokens for what is missing, readyCount counts only lines with a size (badge)', () => {
  const { st, C } = mk6([{ pid: 'lace-top', size: 'M', qty: 1 }, { pid: 'lace-skirt-cream', size: null, qty: 1 }]);
  assert.equal(C.calc().total, 850000); assert.equal(C.calc().count, 2); assert.equal(C.readyCount(), 1); assert.equal(C.sizelessCount(), 1);
  const r = T(C, 'order', {}); assert.ok(r.text.includes('• Lace Top – size M: 380.000đ\n• Lace Skirt – Kem – size [size]: 470.000đ') && r.text.includes('Tổng cộng là 850.000đ'));
  assert.deepEqual(r.pending, ['size']);
  st.draft.lines[1].size = 'S'; assert.deepEqual(T(C, 'order', {}).pending, []); assert.equal(C.readyCount(), 2);
  st.draft.lines[0].qty = 2; assert.equal(C.readyCount(), 3); assert.equal(C.calc().total, 1230000); assert.ok(/ x2: 760\.000đ/.test(T(C, 'order', {}).text));
  st.draft.lines = []; const e = T(C, 'order', {}); assert.ok(e.text.includes('• [món] – size [size]: [giá]') && e.text.includes('Tổng cộng là [tổng]')); assert.deepEqual(e.pending, ['item']);
  assert.equal(C.readyCount(), 0);
});
test('order shipping line and receiver info still compose with sizeless lines; EN has tokens too', () => {
  const { st, C } = mk6([{ pid: 'lace-top', size: null, qty: 1 }]); st.set.fee = 25000; st.draft.ship = 'fee'; st.draft.info = 'A, 090';
  const t = T(C, 'order', {}).text; assert.ok(t.includes('Shipping: 25.000đ') && t.includes('Giao đến:\nA, 090') && t.includes('size [size]') && t.includes('Tổng cộng là 405.000đ'));
  assert.ok(T(C, 'order', {}, 'en').text.includes('size [size]'));
});
test('tokKeys finds only the known bracket words (the EN "[bust / waist / hip]" is not a blank)', () => {
  const { C } = mk6();
  assert.deepEqual(C.tokKeys('x [size] y [món] [mã vận đơn] [bust / waist / hip]').sort(), ['item', 'size', 'trackingCode']);
  assert.deepEqual(C.tokKeys(SEED.flow.find(e => e.id === 'ask-measurements').en), []);
});
test('STAGES.stageOf maps every message of the new cards (greet hero, sequence bubbles, entries)', () => {
  const { C } = mk6();
  for (const [id, g] of Object.entries({ 'open-first': 'greet', 'open-returning': 'greet', 'ask-measurements': 'size', 'fit-size': 'size', 'paid-ack': 'out', 'thanks-custom': 'out', 'tracking-code': 'out', 'order-recap': 'order', 'shipping-info': 'info', 'ask-feedback': 'out' })) assert.equal(C.stageOf(id), g, id);
});
test('v6 sources: no pushSheet without the re-entry guard, no += / insertAdjacentHTML into live regions, dupes assertion present', () => {
  const js = SRCF('app.js');
  assert.ok(/top0\.k === k0 \|\| now0 - lastPush < 350/.test(js), 'sheet guard');
  assert.ok(!/insertAdjacentHTML|\.innerHTML \+=/.test(js), 'idempotent render: no appending into live regions');
  assert.ok(/function assertUnique/.test(js) && /console\.error\('dupe'/.test(js));
  assert.ok(!/function ctx\(|setCtx|hintDone\(|candidates\(|oresHtml|renderMsg/.test(js), 'old context code is gone');
});
