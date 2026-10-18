// Independent expected-text builders for the UAT.
// They read ONLY src/data.json (the CS Flow sheet verbatim) and docs/ig-reference/instagram-message-references.md (the founder's real IG messages).
// They never load src/compose.js or call the app's composeCopy.
import fs from 'node:fs';
const ROOT = '/home/user/soft_embrace_reply';
export const D = JSON.parse(fs.readFileSync(ROOT + '/src/data.json', 'utf8'));
const md = fs.readFileSync(ROOT + '/docs/ig-reference/instagram-message-references.md', 'utf8');

// IG01..IG07: the first ```text block after each "### IGnn" heading
export const IG = {};
for (const m of md.matchAll(/### (IG\d\d)[^\n]*\n[\s\S]*?```text\n([\s\S]*?)\n```/g)) IG[m[1]] = m[2];

// whitespace rule of the product: no trailing spaces, no 3+ newlines, trimmed
export const norm = t => String(t).replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim();

export const P = id => { const p = D.products.find(x => x.id === id); if (!p) throw new Error('no product ' + id); return p; };
export const FLOW = id => { const e = D.flow.find(x => x.id === id); if (!e) throw new Error('no flow ' + id); return e; };
const VAR = { white: ['Trắng', 'White'], blue: ['Xanh', 'Blue'], cream: ['Kem', 'Cream'], black: ['Đen', 'Black'], taupe: ['Taupe', 'Taupe'], yellow: ['Vàng', 'Yellow'] };
// label used for a product in a multi-product message: "Lace Skirt · Kem"
export const label = (id, l = 'vi') => { const p = P(id); return p.variant ? p.name + ' · ' + VAR[p.variant][l === 'en' ? 1 : 0] : p.name; };
// "Lace Skirt (Kem)" inside a sentence
export const inline = (id, l = 'vi') => { const p = P(id); return p.variant ? p.name + ' (' + VAR[p.variant][l === 'en' ? 1 : 0] + ')' : p.name; };
// label used on an order line: "Lace Trim Blouse – Kem"
export const orderName = (id, l = 'vi') => { const p = P(id); return p.variant ? p.name + ' – ' + VAR[p.variant][l === 'en' ? 1 : 0] : p.name; };
export const vnd = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.') + 'đ';
export const vndEn = n => 'VND ' + String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
export const desc = (id, l = 'vi') => norm(P(id)[l === 'en' ? 'descEn' : 'descVi']);
export const size = (id, l = 'vi') => norm(P(id)[l === 'en' ? 'sizeEn' : 'sizeVi']);

// 1 bubble of info blocks, one blank line between products
export const infoBlocks = (ids, l = 'vi') => ids.map(i => desc(i, l)).join('\n\n');

// greeting: new / back / info (only product blocks)
export function greeting(v, ids, l = 'vi') {
  if (v === 'info') return infoBlocks(ids, l);
  const e = FLOW(v === 'back' ? 'open-returning' : 'open-first')[l];
  if (!ids.length) {   // greeting-only: no product slot, no dangling colon
    return norm(e.replace(/\s*for \{\{item\}\}/g, '').replace(/\{\{itemInfo\}\}/g, '').replace(/\{\{item\}\}/g, '').replace(/[:：]\s*$/, ''));
  }
  const [head, tail] = e.split('{{itemInfo}}');
  const item = ids.map(i => inline(i, l)).join(' + ');
  if (tail === undefined) return norm(e.replace('{{item}}', item) + '\n\n' + infoBlocks(ids, l));   // template without a slot: info appended
  return norm(head.replace('{{item}}', item).replace(/[ \t]+$/, '') + '\n\n' + infoBlocks(ids, l) + tail);
}
// size charts, one or many (labelled by product when many), optional lead-in and measurement ask
export function sizes(ids, l = 'vi', { lead = '', ask = false } = {}) {
  const body = ids.length > 1 ? ids.map(i => label(i, l) + '\n' + size(i, l)).join('\n\n') : size(ids[0], l);
  return norm([lead, body, ask ? FLOW('ask-measurements')[l] : ''].filter(Boolean).join('\n\n'));
}
export function fitSize(id, sz, l = 'vi') {
  return norm(FLOW('fit-size')[l].replace(/\{\{size\}\}/g, sz).replace('{{sizeChart}}', size(id, l)));
}
// set bubbles
export function setBubble(b, ids, { price = null, link = null } = {}, l = 'vi') {
  const sum = ids.reduce((s, i) => s + P(i).price, 0), pr = price == null ? sum : price, save = sum - pr;
  if (b === 'a') return norm(ids.map(i => desc(i, l)).join('\n\n') + '\n\n• Giá set: ' + vnd(pr) + (save > 0 ? ' (tiết kiệm ' + vnd(save) + ')' : ''));
  if (b === 'b') return norm(ids.map(i => label(i, l) + '\n' + size(i, l)).join('\n\n'));
  if (b === 'c') return norm(D.setMeasure[l]);
  const links = link ? [link] : [...new Set(ids.map(i => (P(i).postUrl || '').trim()).filter(Boolean))];
  return links.join('\n');
}
// order message (Vietnamese): lines = [{id, size, qty}], ship = {kind:'free'|'courier'|'custom'|'fee', amount}
export function order(lines, ship, { info = '' } = {}) {
  const sub = lines.reduce((s, L) => s + P(L.id).price * L.qty, 0);
  const shipAmt = ship.kind === 'custom' || ship.kind === 'fee' ? ship.amount : 0;
  const shipLine = ship.kind === 'courier' ? '• Shipping: khách trả shipper' : ship.kind === 'free' ? '• Shipping: miễn phí' : '• Shipping: ' + vnd(shipAmt);
  const ls = lines.map(L => '• ' + orderName(L.id) + ' – size ' + L.size + (L.qty > 1 ? ' x' + L.qty : '') + ': ' + vnd(P(L.id).price * L.qty)).join('\n');
  const tpl = D.orderTemplate.vi;   // "Dạ vậy đơn của bạn 🌷\n{{orderLines}}\n• Shipping: …\nTổng cộng là {{total}}\n\nNội dung chuyển khoản …"
  const [a, rest] = tpl.split('{{orderLines}}');
  const tail = rest.slice(rest.indexOf('Tổng cộng là'));   // from the total sentence on, verbatim
  const out = a + ls + '\n' + shipLine + '\n' + tail.replace('{{total}}', vnd(sub + shipAmt));
  return norm(out + (info ? '\n\nGiao đến:\n' + info.trim() : ''));
}
export const money = { vnd, vndEn };
