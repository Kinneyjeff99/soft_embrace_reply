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

  /* unfilled data shows as a bracketed word in the preview ([size]); a message that still contains one cannot be copied (design-v6 5.4) */
  var TOKW = { item: 'món', size: 'size', sizeA: 'size 1', sizeB: 'size 2', trackingCode: 'mã vận đơn', imageLinks: 'link hình', otherItem: 'mẫu thay thế', fitStyle: 'kiểu dáng', price: 'giá', total: 'tổng' };
  var TOKRE = /\[(món|size|size 1|size 2|mã vận đơn|link hình|mẫu thay thế|kiểu dáng|giá|tổng)\]/g;
  /* GENERAL net (round 7): any other [word] / {{word}} left in a message is an unfilled blank, whatever its name. The app's own blanks above are
     handled with a precise prompt ("Chọn size"); everything else lands here as pending 'blank'. Square brackets cannot be told apart reliably from a
     placeholder, so a bracket in a generated message always stops the copy until she has looked at the text. */
  var UNKRE = /\[[^\[\]\n]{1,40}\]|\{\{[^{}\n]{1,40}\}\}/g, KNOWNRE = new RegExp('^' + TOKRE.source + '$');
  function blanks(text) { var o = []; String(text == null ? '' : text).replace(UNKRE, function (m) { if (!KNOWNRE.test(m) && o.indexOf(m) < 0) o.push(m); return m; }); return o; }
  function tok(k) { return '[' + TOKW[k] + ']'; }
  function tokKeys(text) { var out = []; String(text).replace(TOKRE, function (m, w) { Object.keys(TOKW).forEach(function (k) { if (TOKW[k] === w && out.indexOf(k) < 0) out.push(k); }); return m; }); return out; }
  /* greeting-only replies drop the product slot and the dangling colon */
  function greetOnly(tpl) { return tpl.replace(/\s*for \{\{item\}\}/g, '').replace(/\{\{itemInfo\}\}/g, '').replace(/\{\{item\}\}/g, '').replace(/[:：]\s*$/, ''); }

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
  /* lines that have a size are "ordered"; a line without one is still "being asked about" (badge counts the first kind) */
  function readyCount() { var n = 0; st.draft.lines.forEach(function (L) { if (PM[L.pid] && L.size) n += L.qty; }); return n; }
  function sizelessCount() { var n = 0; st.draft.lines.forEach(function (L) { if (PM[L.pid] && !L.size) n++; }); return n; }
  function hasLines() { return st.draft.lines.some(function (L) { return PM[L.pid]; }); }
  function totalStr(l) { if (!hasLines()) return tok('total'); return l === 'en' ? nfE.format(calc().total) : money(calc().total, 'vi'); }
  function linesText(l) {
    if (!hasLines()) return '• ' + tok('item') + ' – size ' + tok('size') + ': ' + tok('price');
    return st.draft.lines.map(function (L) {
      var p = PM[L.pid]; if (!p) return '';
      var nm = pv(p, 'name') + (p.variant ? ' – ' + VAR[p.variant][l] : '');
      return '• ' + nm + ' – size ' + (L.size || tok('size')) + (L.qty > 1 ? ' x' + L.qty : '') + ': ' + money(pv(p, 'price') * L.qty, l);
    }).filter(Boolean).join('\n');
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
    /* the shipping line is ALWAYS in the message (round 7): a total that leaves shipping out must be visible as such, even if her saved template has no Shipping line */
    var hadShip = /^\s*•\s*Shipping.*$/m.test(t);
    t = t.replace(/^\s*•\s*Shipping.*$/m, function () { return shipLine(l); });
    t = t.replace('{{orderLines}}', function () { return linesText(l) + (hadShip ? '' : '\n' + shipLine(l)); }).replace('{{total}}', function () { return totalStr(l); });
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
    var out = { text: '', lead: '', parts: [], fellBack: null, trunc: false, missing: null, partial: null, leadIds: {}, pending: [], blanks: [], bubbles: null };
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
      out.blanks = blanks(out.text);
      if (out.blanks.length && out.pending.indexOf('blank') < 0) out.pending.push('blank');
      return out;
    }
    var p = ref.pid ? PM[ref.pid] : null, t, t2;
    function pidsOf() { return (ref.pids || []).filter(function (id, i, a) { return PM[id] && a.indexOf(id) === i; }); }
    /* greeting: three variants over 0..4 products. new/back keep the greeting template; info is the product blocks only (optional "Câu trước thông tin") */
    if (action === 'greet') {
      var gp = pidsOf(), blocks = [], lost = [], other1 = false, v = ref.v || 'new';
      gp.forEach(function (id) {
        var q = PM[id], tx = ptext(q, 'desc', l).trim();
        if (!tx) { lost.push(id); if (ptext(q, 'desc', other(l)).trim()) other1 = true; return; }
        blocks.push(tx); if (ptrunc(q, 'desc', l)) out.trunc = true;
      });
      if (gp.length && !blocks.length) { if (other1) out.missing = l; return finish(); }
      out.partial = lost.length ? lost : null;
      var info = blocks.join('\n\n');
      if (v === 'info') {
        if (!blocks.length) { out.pending = ['item']; return finish(); }
        pushLead(lead('info')); pushBody(info); return finish();
      }
      var ge = entryText(FM[v === 'back' ? 'open-returning' : 'open-first'], l);
      if (ge.fell) { out.missing = l; return finish(); }
      var gt = ge.text;
      if (blocks.length) {
        if (!/\{\{itemInfo\}\}/.test(gt)) gt += '\n\n{{itemInfo}}';
        gt = gt.replace(/[ \t]*\{\{itemInfo\}\}/g, function () { return '\n\n' + info; }).replace(/\{\{item\}\}/g, function () { return gp.map(function (id) { return pitem(PM[id], l); }).join(' + '); });
      } else gt = greetOnly(gt);
      pushBody(gt);
      /* EXTENSION POINT (not implemented on purpose): design-v6 7.1 proposes splitting a message longer than ~1,000 characters into one bubble per
         product ("Gửi 2 tin"). The Instagram DM limit is an UNVERIFIED assumption, so nothing is split: out.bubbles stays null and the whole text is one message.
         When the limit is confirmed on a real phone, fill out.bubbles = [{text}] here (split between product blocks, never inside one) and let the card render a sequence. */
      return finish();
    }
    /* size charts of 1..4 products in ONE message; with two or more every chart is labelled by its product (same shape as set bubble b) */
    if (action === 'sizes') {
      var sp = pidsOf(), sb = [], slost = [], sother = false;
      if (!sp.length) { out.pending = ['item']; return finish(); }
      sp.forEach(function (id) {
        var q = PM[id], tx = ptext(q, 'size', l).trim();
        if (!tx) { slost.push(id); if (ptext(q, 'size', other(l)).trim()) sother = true; return; }
        sb.push(sp.length > 1 ? pname(q, l) + '\n' + tx : tx); if (ptrunc(q, 'size', l)) out.trunc = true;
      });
      if (!sb.length) { if (sother) out.missing = l; return finish(); }
      out.partial = slost.length ? slost : null;
      pushLead(lead('size')); pushBody(sb.join('\n\n'));
      if (ref.ask) { var ae = entryText(FM['ask-measurements'], l); if (!ae.fell) pushBody(ae.text); }
      return finish();
    }
    /* any flow message with its blanks filled from the context: unfilled data stays visible as [size], [món], [mã vận đơn] and is listed in out.pending */
    if (action === 'entry') {
      var ent = entryText(FM[ref.tid], l), fl = ref.fills || {};
      if (ent.fell) { out.missing = l; return finish(); }
      var tp = ref.pid ? PM[ref.pid] : null;
      var body = ent.text.replace(/\{\{(\w+)\}\}/g, function (m, k) {
        var val = null, key = k;
        if (k === 'itemInfo') { key = 'item'; val = tp && ptext(tp, 'desc', l).trim(); if (tp && ptrunc(tp, 'desc', l)) out.trunc = true; }
        else if (k === 'sizeChart') { key = 'item'; val = tp && ptext(tp, 'size', l).trim(); if (tp && ptrunc(tp, 'size', l)) out.trunc = true; }
        else if (k === 'item') val = tp && pitem(tp, l);
        else if (k === 'otherItem') val = fl.otherItem && PM[fl.otherItem] ? pitem(PM[fl.otherItem], l) : null;
        else val = fl[k];
        if (val == null || val === '') { if (out.pending.indexOf(key) < 0) out.pending.push(key); return TOKW[key] ? tok(key) : '[' + key + ']'; }
        return String(val);
      });
      pushBody(body); return finish();
    }
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
      if (!hasLines()) out.pending.push('item'); else if (sizelessCount()) out.pending.push('size');
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
    { id: 'greet', lab: [['Chào hỏi']], desc: 'Chọn mẫu khách hỏi, rồi chép lời chào.', cards: [{ id: 'greet', kind: 'greet', t: 'Chào khách', ids: ['open-first', 'open-returning'] }], more: [], nav: [{ id: 'extra-photos', t: 'Gửi thêm hình / link' }] },
    { id: 'size', lab: [['Tư vấn', 'size']], desc: 'Gửi bảng size hoặc xin số đo khách nhé.', cards: [{ id: 'sizes', kind: 'sizes', t: 'Gửi bảng size' }, { id: 'fit-size', kind: 'entry', t: 'Vừa size', inputs: ['item', 'size'] }, { id: 'between-sizes', kind: 'entry', t: 'Giữa 2 size', inputs: ['sizeA', 'sizeB'] }, { id: 'ask-measurements', kind: 'entry', t: 'Xin số đo', compact: true }],
      more: [{ id: 'will-think', kind: 'entry', compact: true, t: 'Khách cần cân nhắc' }, { id: 'over-size-has-option', kind: 'entry', compact: true, t: 'Quá size · có mẫu khác' }, { id: 'over-size-no-option', kind: 'entry', compact: true, t: 'Quá size · không có mẫu khác' }, { id: 'too-small-size', kind: 'entry', compact: true, t: 'Quá nhỏ' }] },
    { id: 'info', lab: [['Xin', 'thông tin']], desc: 'Xin tên, SĐT, địa chỉ để lên đơn nhé.', cards: [{ id: 'shipping-info', kind: 'entry', compact: true, t: 'Xin thông tin giao hàng' }, { id: 'shipping-fee', kind: 'entry', compact: true, t: 'Hỏi địa chỉ để báo phí ship' }], more: [{ id: 'extra-photos', kind: 'entry', compact: true, t: 'Gửi thêm hình / link', inputs: ['imageLinks'] }], nav: [{ kind: 'paste', t: 'Khách gửi địa chỉ rồi? Dán vào đơn' }] },
    { id: 'order', lab: [['Tạo đơn']], desc: 'Chọn món và ship, rồi chép tin chốt đơn.', cards: [{ id: 'order', kind: 'composer', t: 'Tin chốt đơn', ids: ['order-recap'] }], more: [] },
    { id: 'out', lab: [['Check out']], desc: 'Cảm ơn khách, rồi gửi mã vận đơn nhé.', cards: [{ id: 'pay', kind: 'seq', t: 'Xác nhận thanh toán', items: ['paid-ack', ['paid-thanks', 'thanks-custom']] }, { id: 'track', kind: 'seq', t: 'Gửi mã vận đơn', items: ['tracking-note', 'tracking-code'], field: 'trackingCode' }, { id: 'ask-feedback', kind: 'entry', compact: true, t: 'Xin hình feedback' }],
      more: [{ id: 'thanks-generic', kind: 'entry', compact: true, t: 'Lời chúc kèm (tuỳ chọn)' }, { id: 'return-policy', kind: 'entry', compact: true, t: 'Nhắc chính sách đổi trả' }, { id: 'order-confirm', kind: 'entry', compact: true, t: 'Đã nhận (ngắn)' }, { id: 'thanks-rtw', kind: 'entry', compact: true, t: 'Cảm ơn gộp 1 tin' }] }
  ];
  /* every flow message id a stage card stands for */
  function cardIds(c) { var o = [].concat(c.ids || [], c.id && c.kind === 'entry' ? [c.id] : []); (c.items || []).forEach(function (x) { o = o.concat(x); }); return o; }
  function stageOf(id) {
    var r = '';
    STAGES.forEach(function (g) { g.cards.concat(g.more, g.nav || []).forEach(function (c) { if (cardIds(c).indexOf(id) > -1 || c.id === id) r = r || g.id; }); });
    return r;
  }
  /* ---------- product list: newest first, category filter, collection sections, photos (round 4) ----------
     `released` is the sheet order (one number per product, higher = newer); `collection` is a label that is INFERRED from the Instagram posts. */
  var CATS = ['top', 'skirt', 'dress', 'pants'], CATL = { top: 'Áo', skirt: 'Váy', dress: 'Đầm', pants: 'Quần' };
  function newest(list) { return list.map(function (p, i) { return [p, i]; }).sort(function (a, b) { return (b[0].released || 0) - (a[0].released || 0) || a[1] - b[1]; }).map(function (x) { return x[0]; }); }
  function byCat(list, c) { return c && c !== 'all' ? list.filter(function (p) { return p.category === c; }) : list; }
  function catCounts(list) { var o = { all: list.length }; CATS.forEach(function (c) { o[c] = list.filter(function (p) { return p.category === c; }).length; }); return o; }
  function collections(list) { var out = [], by = {}; list.forEach(function (p) { var n = p.collection || ''; if (!by[n]) { by[n] = { name: n, items: [] }; out.push(by[n]); } by[n].items.push(p); }); return out; }
  function imgOf(p, big) { return p && p.img ? 'img/' + p.img + (big ? '-320' : '-168') + '.webp' : ''; }
  var PS = newest(PL);

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
    PS: PS, CATS: CATS, CATL: CATL, newest: newest, byCat: byCat, catCounts: catCounts, collections: collections, imgOf: imgOf,
    STAGES: STAGES, stageOf: stageOf, cardIds: cardIds, TOKW: TOKW, TOKRE: TOKRE, tok: tok, tokKeys: tokKeys, blanks: blanks, greetOnly: greetOnly, readyCount: readyCount, sizelessCount: sizelessCount, hasLines: hasLines, isEdited: isEdited, stripLead: stripLead, stripEnd: stripEnd, untemplate: untemplate,
    VAR: VAR, PL: PL, PM: PM, FL: FL, FM: FM, nfV: nfV, nfE: nfE,
    pv: pv, clean: clean, other: other, money: money, moneyP: moneyP, colorOf: colorOf, colorEn: colorEn, pname: pname, pitem: pitem, psizes: psizes,
    ptext: ptext, ptrunc: ptrunc, normEn: normEn, entryText: entryText, calc: calc, totalStr: totalStr, linesText: linesText, shipLine: shipLine, orderText: orderText,
    leadStore: leadStore, leadList: leadList, leadSel: leadSel, setItems: setItems, setSum: setSum, setPrice: setPrice, setLabel: setLabel, setBubble: setBubble, setLinks: setLinks, SETB: SETB, composeCopy: composeCopy
  };
});
