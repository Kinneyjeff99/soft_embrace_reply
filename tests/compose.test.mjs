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
test('STAGES: every referenced message exists, primary cards 2-5 (composer stage has one), no id in two stages', () => {
  const { C } = mk(); const seen = {};
  for (const g of C.STAGES) {
    assert.ok(g.id === 'order' ? g.cards.length === 1 && g.cards[0].kind === 'composer' : g.cards.length >= 2 && g.cards.length <= 5, g.id);
    for (const c of g.cards.concat(g.more)) {
      for (const id of [c.id, ...(c.alts || []).map(a => a[0])].filter(Boolean)) { assert.ok(C.FM[id], 'missing ' + id); assert.ok(!seen[id] || seen[id] === g.id, 'dup ' + id); seen[id] = g.id; }
    }
  }
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
