/* Pure text composition for Soft Embrace Reply (design-v2 section D/E/G).
   No DOM, no storage writes. Inlined into dist/index.html by build.py and also require()-able from Node tests.
   SECompose(SEED, st) -> API. `st` is the live state object (read only here). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory;
  else root.SECompose = factory;
})(this, function (SEED, st) {
  'use strict';
  var VAR = { white: { vi: 'Trắng', en: 'White', hex: '#F7F4EE' }, blue: { vi: 'Xanh', en: 'Blue', hex: '#A9BCD0' }, cream: { vi: 'Kem', en: 'Cream', hex: '#EDE3CF' }, black: { vi: 'Đen', en: 'Black', hex: '#1E1B1A' }, taupe: { vi: 'Taupe', en: 'Taupe', hex: '#A8968A' }, yellow: { vi: 'Vàng', en: 'Yellow', hex: '#EBD88C' } };
  var PL = SEED.products, PM = {};
  PL.forEach(function (p) { PM[p.id] = p; });
  var FL = SEED.flow.map(function (e) { var o = Object.assign({}, e); o.n = parseInt(e.stage, 10) || 1; return o; }), FM = {};
  FL.forEach(function (e) { FM[e.id] = e; });
  var nfV = new Intl.NumberFormat('vi-VN'), nfE = new Intl.NumberFormat('en-US');

  function ovs() { return st.ov || {}; }
  function pv(o, f) { var x = ovs()[o.id]; return x && x[f] !== undefined ? x[f] : o[f]; }
  function clean(t) { return String(t == null ? '' : t).replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim(); }
  function other(l) { return l === 'vi' ? 'en' : 'vi'; }
  function money(n, l) { return l === 'en' ? nfE.format(n) + ' VND' : nfV.format(n) + 'đ'; }
  function moneyP(n, l) { return l === 'en' ? 'VND ' + nfE.format(n) : nfV.format(n) + 'đ'; }
  function colorOf(p) { if (p.variant) return VAR[p.variant].vi; var m = /Màu:\s*([^\n]+)/.exec(pv(p, 'descVi') || ''); return m ? m[1].replace(/\.+$/, '').trim() : ''; }
  function colorEn(p) { if (p.variant) return VAR[p.variant].en; var m = /Colou?r:\s*([^\n]+)/i.exec(pv(p, 'descEn') || ''); return m ? m[1].replace(/\.+$/, '').trim() : ''; }
  function pname(p, l) { var n = pv(p, 'name'); return p.variant ? n + ' · ' + VAR[p.variant][l || 'vi'] : n; }
  function pitem(p, l) { var n = pv(p, 'name'); return p.variant ? n + ' (' + VAR[p.variant][l || 'vi'] + ')' : n; }
  function psizes(p) { var s = pv(p, 'sizes'); return Array.isArray(s) ? s : ['S', 'M']; }
  function ptext(p, w, l) { return pv(p, w + (l === 'en' ? 'En' : 'Vi')) || ''; }
  function ptrunc(p, w, l) { var k = w + (l === 'en' ? 'En' : 'Vi'); return (p.truncated || []).indexOf(k) > -1 && !(ovs()[p.id] || {})[k]; }
  function normEn(t) { if (/\n/.test(t)) return t; return t.replace(/\s*\{\{orderLines\}\}\s*/, '\n{{orderLines}}\n').replace(/\s+Total:/, '\nTotal:').replace(/\s+Please use/, '\n\nPlease use'); }

  /* entry (flow) text per language, with fallbacks */
  function entryText(e, l) {
    var vi = pv(e, 'vi') || '', en = pv(e, 'en') || '';
    if (e.id === 'order-recap') en = normEn(en);
    if (/\{\{itemInfo\}\}/.test(vi) && en && !/\{\{itemInfo\}\}/.test(en)) en += '\n\n{{itemInfo}}';
    var t = l === 'en' ? en : vi, fell = false;
    if (!t.trim()) { var o = l === 'en' ? vi : en; if (o.trim()) { t = o; fell = true; } }
    return { text: t, fell: fell, empty: !t.trim() };
  }

  /* ---------- order maths + text ---------- */
  function calc() {
    var d = st.draft, sub = 0, n = 0;
    d.lines.forEach(function (L) { var p = PM[L.pid]; if (p) { sub += pv(p, 'price') * L.qty; n += L.qty; } });
    var ship = d.ship === 'fee' ? st.set.fee : d.ship === 'custom' ? (d.custom || 0) : 0;
    return { sub: sub, ship: ship, total: sub + ship, count: d.lines.length, qty: n };
  }
  function totalStr(l) { return l === 'en' ? nfE.format(calc().total) : money(calc().total, 'vi'); }
  function linesText(l) {
    return st.draft.lines.map(function (L) {
      var p = PM[L.pid]; if (!p) return '';
      var nm = pv(p, 'name') + (p.variant ? ' – ' + VAR[p.variant][l] : '');
      return '• ' + nm + ' – size ' + L.size + (L.qty > 1 ? ' x' + L.qty : '') + ': ' + money(pv(p, 'price') * L.qty, l);
    }).join('\n');
  }
  function shipLine(l) {
    var d = st.draft, vi = l === 'vi';
    if (d.ship === 'courier') return vi ? '• Shipping: khách trả shipper' : '• Shipping — paid directly to the courier';
    if (d.ship === 'free') return vi ? '• Shipping: miễn phí' : '• Shipping — free';
    return '• Shipping: ' + money(d.ship === 'fee' ? st.set.fee : d.custom || 0, l);
  }
  function orderText(l) {
    var o = ovs().__ord || {};
    var t = o[l] !== undefined ? o[l] : SEED.orderTemplate[l];
    if (l === 'en') t = normEn(t);
    t = t.replace(/^\s*•\s*Shipping.*$/m, function () { return shipLine(l); });
    t = t.replace('{{orderLines}}', function () { return linesText(l); }).replace('{{total}}', function () { return totalStr(l); });
    var d = st.draft;
    if (d.info.trim()) t += '\n\n' + (l === 'en' ? 'Ship to:' : 'Giao đến:') + '\n' + d.info.trim();
    var b = st.set.bank;
    if (d.bank && b.no) t += '\n\n' + (l === 'en' ? 'Bank transfer: ' : 'Chuyển khoản: ') + [b.name, b.no, b.holder].filter(Boolean).join(' · ');
    return clean(t);
  }

  /* ---------- lead-ins (câu đệm) ---------- */
  function leadStore() { var s = st.lead; if (!s) s = st.lead = { sel: {}, custom: [], edits: {}, hidden: [] }; return s; }
  /* effective list for an action in a language: her own lines first (newest first), then seeds minus hidden, edits applied */
  function leadList(a, l) {
    var s = leadStore(), out = [];
    s.custom.forEach(function (c) { if (c.action === a) { var t = (c[l] || '').trim(); if (t) out.push({ id: c.id, text: t, seed: false, def: false }); } });
    ((SEED.leadIns && SEED.leadIns[a]) || []).forEach(function (x) {
      if (s.hidden.indexOf(x.id) > -1) return;
      var e = s.edits[x.id] || {}, t = ((e[l] !== undefined ? e[l] : x[l]) || '').trim();
      if (t) out.push({ id: x.id, text: t, seed: true, def: !!x['default'] });
    });
    return out;
  }
  /* remembered selection: null = "Không kèm". A fresh install has no entry, so only an explicit default seed can pre-select. */
  function leadSel(a, l) {
    var k = a + ':' + l, s = leadStore();
    if (Object.prototype.hasOwnProperty.call(s.sel, k)) return s.sel[k];
    var d = leadList(a, l).filter(function (x) { return x.def; })[0];
    return d ? d.id : null;
  }

  /* ---------- sets ----------
     A set copies as separate Instagram bubbles: a = info of every member + the set price, b = every size chart labelled by product,
     c = the measurement request, d = the post link(s). Only product fields and her own wording are used. */
  function setItems(set) { return (set.items || []).map(function (id) { return PM[id]; }).filter(Boolean); }
  function setSum(set) { var s = 0; setItems(set).forEach(function (p) { s += pv(p, 'price'); }); return s; }
  /* "giá set": her override, or the sum of the retail prices when empty */
  function setPrice(set) { var o = set.price; return o === null || o === undefined || o === '' || isNaN(+o) ? setSum(set) : +o; }
  function setLabel(set) {
    if (set.name) return set.name;
    var ps = setItems(set), nm = ps.map(function (p) { return pv(p, 'name'); }), dup = nm.some(function (n, i) { return nm.indexOf(n) !== i; });
    return ps.map(function (p) { return dup ? pname(p, 'vi') : pv(p, 'name'); }).join(' + ');
  }
  function setLinks(set) {
    var out = [], u = String(set.postUrl || '').trim();
    if (u) return [u];
    setItems(set).forEach(function (p) { var x = String(pv(p, 'postUrl') || '').trim(); if (x && out.indexOf(x) < 0) out.push(x); });
    return out;
  }
  /* -> {id, text, missing, trunc, leadKey, auto} or null when the bubble does not apply */
  function setBubble(set, b, l) {
    var ps = setItems(set), vi = l === 'vi', o = { id: b, text: '', missing: null, trunc: false, leadKey: b === 'a' ? 'info' : b === 'b' ? 'size' : null, auto: true }, parts = [], miss = false;
    var bo = b !== 'a' && set.bov && set.bov[b] && set.bov[b][l];   /* a text she saved as this bubble's own wording (Lưu làm mẫu) */
    if (bo && String(bo).trim()) { o.text = clean(bo); o.auto = false; return o; }
    if (b === 'a') {
      var ov = set.ov && set.ov[l];
      if (ov && String(ov).trim()) { o.text = clean(ov); o.auto = false; return o; }
      ps.forEach(function (p) {
        var t = ptext(p, 'desc', l).trim();
        if (!t) { if (ptext(p, 'desc', other(l)).trim()) miss = true; return; }
        parts.push(t); if (ptrunc(p, 'desc', l)) o.trunc = true;
      });
      if (miss || !parts.length) { o.missing = miss ? l : null; return o; }
      var sum = setSum(set), price = setPrice(set), save = sum - price;
      parts.push('• ' + (vi ? 'Giá set: ' : 'Set price: ') + moneyP(price, l) + (save > 0 ? (vi ? ' (tiết kiệm ' : ' (you save ') + moneyP(save, l) + ')' : ''));
      o.text = clean(parts.join('\n\n')); return o;
    }
    if (b === 'b') {
      ps.forEach(function (p) {
        var t = ptext(p, 'size', l).trim();
        if (!t) { if (ptext(p, 'size', other(l)).trim()) miss = true; return; }
        parts.push(pname(p, l) + '\n' + t); if (ptrunc(p, 'size', l)) o.trunc = true;
      });
      if (miss || !parts.length) { o.missing = miss ? l : null; return o; }
      o.text = clean(parts.join('\n\n')); return o;
    }
    if (b === 'c') {
      var m = (SEED.setMeasure || {})[l] || '';
      if (!m.trim()) { if (((SEED.setMeasure || {})[other(l)] || '').trim()) o.missing = l; return o; }
      o.text = clean(m); return o;
    }
    var links = setLinks(set);
    if (!links.length) return null;
    o.text = links.join('\n'); return o;
  }
  var SETB = ['a', 'b', 'c', 'd'];

  /* ---------- the single source of truth for preview and clipboard ----------
     action: info | size | both | set | order | thanks
     ref:    { pid, set, bubble, tid, sel, link }  sel = session lead selection {'info:vi': id|null}; absent keys fall back to the remembered selection
     returns { text, lead, parts, fellBack, trunc, missing, partial, leadIds }
       missing  = requested language has no content (text is '' and must not be copied in l)
       partial  = a part left out because it has no text in l ('size' for action both)
       leadIds  = the lead-in chosen per "<action>:<lang>" key, committed only after a successful copy */
  function composeCopy(action, ref, l) {
    ref = ref || {};
    var out = { text: '', lead: '', parts: [], fellBack: null, trunc: false, missing: null, partial: null, leadIds: {} };
    function lead(a) {
      var k = a + ':' + l, id = ref.sel && Object.prototype.hasOwnProperty.call(ref.sel, k) ? ref.sel[k] : leadSel(a, l);
      var hit = id ? leadList(a, l).filter(function (x) { return x.id === id; })[0] : null;
      out.leadIds[k] = hit ? hit.id : null;
      return hit ? clean(hit.text) : '';
    }
    function pushLead(t) { if (t) { out.parts.push({ lead: true, text: t }); if (!out.lead) out.lead = t; } }
    function pushBody(t) { t = clean(t); if (t) out.parts.push({ lead: false, text: t }); }
    function finish() {
      if (out.missing) { out.text = ''; out.parts = []; out.lead = ''; return out; }
      out.text = clean(out.parts.map(function (x) { return x.text; }).join('\n\n'));
      return out;
    }
    var p = ref.pid ? PM[ref.pid] : null, t, t2;
    if (action === 'info' || action === 'size' || action === 'both') {
      if (!p) return finish();
      var w = action === 'size' ? 'size' : 'desc';
      t = ptext(p, w, l).trim();
      if (!t) { if (ptext(p, w, other(l)).trim()) out.missing = l; return finish(); }
      pushLead(lead(action === 'size' ? 'size' : 'info')); pushBody(t);
      if (ref.link && action !== 'size' && String(pv(p, 'postUrl') || '').trim()) pushBody(String(pv(p, 'postUrl')).trim());
      out.trunc = ptrunc(p, w, l);
      if (action === 'both') {
        t2 = ptext(p, 'size', l).trim();
        if (t2) { pushLead(lead('size')); pushBody(t2); out.trunc = out.trunc || ptrunc(p, 'size', l); }
        else if (ptext(p, 'size', other(l)).trim()) out.partial = 'size';
      }
      return finish();
    }
    if (action === 'set') {
      var sb = setBubble(ref.set, ref.bubble || 'a', l);
      if (!sb) return finish();
      if (sb.missing) { out.missing = sb.missing; return finish(); }
      out.trunc = sb.trunc;
      if (sb.leadKey) pushLead(lead(sb.leadKey));
      pushBody(sb.text);
      return finish();
    }
    if (action === 'order') {
      pushLead(lead('order')); pushBody(orderText(l));
      return finish();
    }
    if (action === 'thanks') {
      var tid = ref.tid || (st.draft.lines.some(function (L) { return PM[L.pid] && PM[L.pid].madeToOrder; }) ? 'thanks-custom' : 'thanks-rtw');
      var et = entryText(FM[tid], l);
      if (et.fell) { out.missing = l; return finish(); }
      pushLead(lead('thanks')); pushBody(et.text);
      return finish();
    }
    return finish();
  }

  /* ---------- stages of the sales flow (round 3): what each stage shows ----------
     cards: {id} = a message from SEED.flow, {kind:'info'|'size'} = product chooser, {kind:'composer'} = the order composer.
     more = secondary items behind "Thêm". alts = variants of one card (greeting after payment: ready-to-wear vs custom). */
  var STAGES = [
    { id: 'greet', lab: [['Chào hỏi']], desc: 'Khách vừa nhắn lần đầu hoặc quay lại.', cards: [{ id: 'open-first', t: 'Khách mới' }, { id: 'open-returning', t: 'Khách cũ' }, { kind: 'info', t: 'Gửi thông tin mẫu', s: 'Chạm một mẫu rồi chạm Chép' }], more: [] },
    { id: 'size', lab: [['Tư vấn', 'size']], desc: 'Khách hỏi về size, form dáng, số đo.', cards: [{ id: 'ask-measurements', t: 'Xin số đo' }, { kind: 'size', t: 'Gửi bảng size', s: 'Chạm một mẫu rồi chạm Chép' }, { id: 'fit-size', t: 'Vừa size' }, { id: 'between-sizes', t: 'Giữa 2 size' }],
      more: [{ id: 'will-think', t: 'Khách cần cân nhắc' }, { id: 'over-size-has-option', t: 'Quá size · có mẫu khác' }, { id: 'over-size-no-option', t: 'Quá size · không có mẫu khác' }, { id: 'too-small-size', t: 'Quá nhỏ' }] },
    { id: 'info', lab: [['Xin', 'thông tin']], desc: 'Xin tên, số điện thoại, địa chỉ để lên đơn.', cards: [{ id: 'shipping-info', t: 'Xin thông tin giao hàng' }, { id: 'shipping-fee', t: 'Hỏi địa chỉ để báo phí ship' }], more: [{ id: 'extra-photos', t: 'Gửi thêm hình / link' }] },
    { id: 'order', lab: [['Tạo đơn']], desc: 'Chọn món, phí ship, rồi chép tin chốt đơn.', cards: [{ kind: 'composer' }], more: [] },
    { id: 'out', lab: [['Check out']], desc: 'Sau khi khách chuyển khoản.', cards: [{ id: 'paid-ack', t: 'Đã nhận thanh toán' }, { id: 'paid-thanks', t: 'Cảm ơn · gói đơn', alts: [['paid-thanks', 'Có sẵn'], ['thanks-custom', 'May đo']] }, { id: 'tracking-note', t: 'Gửi mã vận đơn · tin 1' }, { id: 'tracking-code', t: 'Mã vận đơn · tin 2' }, { id: 'ask-feedback', t: 'Xin hình feedback' }],
      more: [{ id: 'thanks-generic', t: 'Lời chúc kèm (tuỳ chọn)' }, { id: 'return-policy', t: 'Nhắc chính sách đổi trả' }, { id: 'order-confirm', t: 'Đã nhận (ngắn)' }, { id: 'thanks-rtw', t: 'Cảm ơn · gộp 1 tin' }] }
  ];
  function stageOf(id) {
    var r = '';
    STAGES.forEach(function (g) { g.cards.concat(g.more).forEach(function (c) { if (c.id === id || (c.alts && c.alts.some(function (a) { return a[0] === id; }))) r = g.id; }); });
    return r;
  }
  /* editable boxes: text she typed over the generated text */
  function isEdited(gen, cur) { return cur !== undefined && cur !== null && clean(cur) !== clean(gen); }
  function stripLead(text, lead) { text = String(text); lead = clean(lead || ''); if (lead && text.indexOf(lead) === 0) return text.slice(lead.length).replace(/^\s+/, ''); return text; }
  function stripEnd(text, tail) { text = String(text).replace(/\s+$/, ''); tail = clean(tail || ''); if (tail && text.length >= tail.length && text.slice(-tail.length) === tail) return text.slice(0, -tail.length).replace(/\s+$/, ''); return text; }
  /* turn a filled-in text back into a template: pairs = [[token, value]]; returns {tpl, lost:[tokens whose value is no longer in the text]} */
  function untemplate(text, pairs) {
    var lost = [], out = String(text);
    pairs.filter(function (x) { return x[1]; }).sort(function (a, b) { return b[1].length - a[1].length; }).forEach(function (x) {
      var i = out.indexOf(x[1]);
      if (i < 0) lost.push(x[0]); else out = out.slice(0, i) + '{{' + x[0] + '}}' + out.slice(i + x[1].length);
    });
    return { tpl: out, lost: lost };
  }

  return {
    STAGES: STAGES, stageOf: stageOf, isEdited: isEdited, stripLead: stripLead, stripEnd: stripEnd, untemplate: untemplate,
    VAR: VAR, PL: PL, PM: PM, FL: FL, FM: FM, nfV: nfV, nfE: nfE,
    pv: pv, clean: clean, other: other, money: money, moneyP: moneyP, colorOf: colorOf, colorEn: colorEn, pname: pname, pitem: pitem, psizes: psizes,
    ptext: ptext, ptrunc: ptrunc, normEn: normEn, entryText: entryText, calc: calc, totalStr: totalStr, linesText: linesText, shipLine: shipLine, orderText: orderText,
    leadStore: leadStore, leadList: leadList, leadSel: leadSel, setItems: setItems, setSum: setSum, setPrice: setPrice, setLabel: setLabel, setBubble: setBubble, setLinks: setLinks, SETB: SETB, composeCopy: composeCopy
  };
});
