(function () {
'use strict';
var T0 = performance.now();
var SEED = JSON.parse(document.getElementById('seed').textContent);
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- strings ---------- */
var STR = {
  stage: { 1: 'Mở đầu', 2: 'Tư vấn size', 3: 'Giao hàng', 4: 'Chốt đơn', 5: 'Set', 6: 'Cảm ơn' },
  tokl: { item: 'mẫu', size: 'size', sizeA: 'size 1', sizeB: 'size 2', otherItem: 'mẫu thay thế', fitStyle: 'kiểu dáng', imageLinks: 'link hình', orderLines: 'đơn hàng', total: 'tổng tiền' },
  toks: ['item', 'size', 'sizeA', 'sizeB', 'otherItem', 'fitStyle', 'imageLinks', 'orderLines', 'total'],
  ph: 'Chưa xác nhận — thay bằng câu thật',
  fail: 'Chưa chép được. Chạm giữ đoạn văn để chép tay nhé.'
};
var VAR = { white: { vi: 'Trắng', en: 'White', hex: '#F7F4EE' }, blue: { vi: 'Xanh', en: 'Blue', hex: '#A9BCD0' }, cream: { vi: 'Kem', en: 'Cream', hex: '#EDE3CF' }, black: { vi: 'Đen', en: 'Black', hex: '#1E1B1A' }, taupe: { vi: 'Taupe', en: 'Taupe', hex: '#A8968A' } };
var SW = { 'noir-dotty-top': '#1E1B1A', 'ivory-dot-blouse': '#EFE7D6', 'ivory-dot-midi-skirt': '#EFE7D6', 'noir-midi-skirt': '#1E1B1A', 'shimmer-top': '#D9CBB5', 'lace-top': '#EDE3CF' };

/* ---------- persistence (never required) ---------- */
var LS = 'se.v1';
function load() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
var st = load();
st.favs = st.favs || []; st.recents = st.recents || []; st.ov = st.ov || {};
st.draft = Object.assign({ lines: [], ship: 'courier', custom: 0, info: '', bank: true, copiedAt: 0 }, st.draft || {});
st.set = Object.assign({ lang: 'vi', fee: 25000, bank: { name: '', no: '', holder: '' } }, st.set || {});
var saveT;
function save() { clearTimeout(saveT); saveT = setTimeout(flush, 300); }
function flush() { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (e) { /* storage blocked: stay in memory */ } }
document.addEventListener('visibilitychange', function () { if (document.hidden) { st.active = Date.now(); flush(); } });
addEventListener('pagehide', function () { st.active = Date.now(); flush(); });

var lang = st.set.lang === 'en' ? 'en' : 'vi';
var tab = 'mau';
if (st.tab && st.active && Date.now() - st.active < 30 * 60000) tab = st.tab;

/* ---------- data ---------- */
var PL = SEED.products, PM = {};
PL.forEach(function (p) { PM[p.id] = p; });
var FL = SEED.flow.map(function (e) { var o = Object.assign({}, e); o.n = parseInt(e.stage, 10) || 1; return o; });
[1, 2, 3].forEach(function (n) { FL.push({ id: 'set-' + n, n: 5, stage: '5 Set', titleVi: 'Set ' + n, labelVi: 'Set ' + n, vi: STR.ph, en: STR.ph, attach: null, ph: true }); });
var FM = {};
FL.forEach(function (e) { FM[e.id] = e; });
function afterPaint(fn) { requestAnimationFrame(function () { setTimeout(fn, 0); }); }
function idle(fn) { if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 600 }); else setTimeout(fn, 60); }
function ov(id) { return st.ov[id] || {}; }
function pv(o, f) { var x = st.ov[o.id]; return x && x[f] !== undefined ? x[f] : o[f]; }
function isPh(e) { return e.ph && !st.ov[e.id]; }
/* recents are stored as references (never as stale text); drop old-format and placeholder entries */
st.recents = st.recents.filter(function (r) { return r && r.ref && !(r.ref.t === 'f' && FM[r.ref.id] && isPh(FM[r.ref.id])); });
function colorOf(p) { if (p.variant) return VAR[p.variant].vi; var m = /Màu:\s*([^\n]+)/.exec(p.descVi || ''); return m ? m[1].replace(/\.+$/, '').trim() : ''; }
function swatch(p) { return p.variant ? VAR[p.variant].hex : (SW[p.id] || ''); }
function pname(p, l) { var n = pv(p, 'name'); return p.variant ? n + ' · ' + VAR[p.variant][l || 'vi'] : n; }
function pitem(p, l) { var n = pv(p, 'name'); return p.variant ? n + ' (' + VAR[p.variant][l || 'vi'] + ')' : n; }
function psizes(p) { var s = pv(p, 'sizes'); return Array.isArray(s) ? s : ['S', 'M']; }
function ptext(p, w, l) { return pv(p, w + (l === 'en' ? 'En' : 'Vi')) || ''; }
function ptrunc(p, w, l) { return (p.truncated || []).indexOf(w + (l === 'en' ? 'En' : 'Vi')) > -1 && !ov(p.id)[w + (l === 'en' ? 'En' : 'Vi')]; }
var nfV = new Intl.NumberFormat('vi-VN'), nfE = new Intl.NumberFormat('en-US');
function money(n, l) { return l === 'en' ? nfE.format(n) + ' VND' : nfV.format(n) + 'đ'; }
function eLabel(e) { return pv(e, 'labelVi') || e.id; }
function normEn(t) { if (/\n/.test(t)) return t; return t.replace(/\s*\{\{orderLines\}\}\s*/, '\n{{orderLines}}\n').replace(/\s+Total:/, '\nTotal:').replace(/\s+Please use/, '\n\nPlease use'); }
function clean(t) { return String(t).replace(/\r\n?/g, '\n').replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n').trim(); }
function norm(s) { return String(s).normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase(); }
function ic(n, c) { return '<svg class="i ' + (c || '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
function other(l) { return l === 'vi' ? 'en' : 'vi'; }

/* entry text per language, with fallbacks */
function entryText(e, l) {
  var vi = pv(e, 'vi') || '', en = pv(e, 'en') || '';
  if (e.id === 'order-recap') { en = normEn(en); }
  if (/\{\{itemInfo\}\}/.test(vi) && en && !/\{\{itemInfo\}\}/.test(en)) en += '\n\n{{itemInfo}}';
  var t = l === 'en' ? en : vi, fell = false;
  if (!t.trim()) { var o = l === 'en' ? vi : en; if (o.trim()) { t = o; fell = true; } }
  return { text: t, fell: fell, empty: !t.trim() };
}

/* ---------- context (Đang tư vấn) ---------- */
function ctx() { var c = st.ctx; if (!c || Date.now() - c.at > 20 * 60000) return null; if (!c.itemId && !c.size) return null; return c; }
/* greetings only attach a product that was touched in the last 5 minutes */
function greetCtx() { var c = ctx(); return c && c.itemId && PM[c.itemId] && Date.now() - c.at < 5 * 60000 ? c : null; }
function setCtx(pid, size) {
  var c = ctx() || {};
  var n = { itemId: pid != null ? pid : c.itemId, size: size !== undefined ? size : c.size, at: Date.now() };
  if (pid != null && c.itemId !== pid && size === undefined) n.size = null;
  var same = c.itemId === n.itemId && c.size === n.size;
  st.ctx = n; save();
  if (!same) renderCtxBits(); else syncGreet();
}
function clearCtx() { st.ctx = null; save(); renderCtxBits(); }
function ctxLabel() { var c = ctx(); if (!c) return ''; var p = PM[c.itemId]; return [p ? pname(p, lang) : null, c.size].filter(Boolean).join(' · '); }

/* ---------- placeholders ---------- */
function tkey(t) { return (t === 'itemInfo' || t === 'sizeChart') ? 'item' : t; }
function keysOf(tpl) { var ks = []; (tpl.match(/\{\{(\w+)\}\}/g) || []).forEach(function (m) { var k = tkey(m.slice(2, -2)); if (ks.indexOf(k) < 0) ks.push(k); }); return ks; }
function fillVal(k, fills) {
  if (fills[k] != null && fills[k] !== '') return fills[k];
  var c = ctx();
  if (k === 'item') return c && c.itemId ? c.itemId : null;
  if (k === 'size') return c && c.size ? c.size : null;
  return null;
}
/* returns {text, missing[]} ; html=true wraps tokens for the preview */
function resolve(tpl, l, fills, html) {
  var missing = [], out = '';
  var parts = tpl.split(/(\{\{\w+\}\})/);
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i], m = /^\{\{(\w+)\}\}$/.exec(part);
    if (!m) { out += html ? esc(part) : part; continue; }
    var t = m[1], k = tkey(t), v = null, p;
    if (t === 'orderLines' || t === 'total') {
      if (st.draft.lines.length) v = t === 'total' ? (l === 'en' ? nfE.format(calc().total) : money(calc().total, 'vi')) : linesText(l);
      else v = fills[t] || null;
    } else if (k === 'item') {
      p = PM[fillVal('item', fills)];
      if (p) v = t === 'itemInfo' ? ptext(p, 'desc', l) : t === 'sizeChart' ? ptext(p, 'size', l) : pitem(p, l);
    } else if (k === 'otherItem') {
      p = PM[fills.otherItem]; if (p) v = pitem(p, l);
    } else v = fillVal(k, fills);
    if (v == null || v === '') { if (missing.indexOf(k) < 0) missing.push(k); }
    if (html) out += '<span class="tok' + (v == null || v === '' ? '' : ' ok') + '" data-act="tok" data-k="' + k + '">' + (v == null || v === '' ? esc(STR.tokl[k] || k) : esc(v)) + '</span>';
    else out += v == null ? '' : v;
  }
  return { text: html ? out : clean(out), missing: missing };
}

/* ---------- order maths ---------- */
function calc() {
  var d = st.draft, sub = 0;
  d.lines.forEach(function (L) { var p = PM[L.pid]; if (p) sub += pv(p, 'price') * L.qty; });
  var ship = d.ship === 'fee' ? st.set.fee : d.ship === 'custom' ? (d.custom || 0) : 0;
  return { sub: sub, ship: ship, total: sub + ship, count: d.lines.length };
}
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
  var o = st.ov.__ord || {};
  var t = o[l] !== undefined ? o[l] : SEED.orderTemplate[l];
  if (l === 'en') t = normEn(t);
  t = t.replace(/^\s*•\s*Shipping.*$/m, function () { return shipLine(l); });
  t = t.replace('{{orderLines}}', function () { return linesText(l); }).replace('{{total}}', function () { return l === 'en' ? nfE.format(calc().total) : money(calc().total, 'vi'); });
  var d = st.draft;
  if (d.info.trim()) t += '\n\n' + (l === 'en' ? 'Ship to:' : 'Giao đến:') + '\n' + d.info.trim();
  var b = st.set.bank;
  if (d.bank && b.no) t += '\n\n' + (l === 'en' ? 'Bank transfer: ' : 'Chuyển khoản: ') + [b.name, b.no, b.holder].filter(Boolean).join(' · ');
  return clean(t);
}

/* ---------- toast ---------- */
var toastEl = $('#toast'), toastT, toastAt = 0;
function dismissToast() { if (toastEl.firstChild && performance.now() - toastAt > 300) { clearTimeout(toastT); toastEl.innerHTML = ''; } }
function toast(msg, o) {
  o = o || {};
  clearTimeout(toastT); toastAt = performance.now();
  var el = document.createElement('div');
  el.className = 'toast' + (o.bad ? ' bad' : '');
  el.innerHTML = ic(o.icon || (o.bad ? 'warn' : 'checkc')) + '<span class="tx">' + esc(msg) + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</span>' + (o.undo ? '<button class="undo" data-act="undo">Hoàn tác</button>' : '');
  if (o.bad) el.setAttribute('role', 'alert');
  toastEl.innerHTML = ''; toastEl.appendChild(el);
  if (o.undo) toast.undoFn = o.undo;
  requestAnimationFrame(function () { el.classList.add('in'); });
  toastT = setTimeout(function () { el.classList.remove('in'); el.classList.add('out'); setTimeout(function () { if (el.parentNode) el.remove(); }, 260); }, o.ms || (o.undo ? 5000 : 1700));
}

/* ---------- haptics + clipboard ---------- */
function hap() { try { var h = document.getElementById('hap'); if (h) h.parentNode.click(); else if (navigator.vibrate) navigator.vibrate(8); } catch (e) { /* ignore */ } }
function seal(btn) {
  if (!btn) return;
  clearTimeout(btn._t); btn.classList.remove('err'); btn.classList.add('copied');
  if (!reduce) {
    var s = btn.querySelector('.seal'), r = btn.querySelector('.ring');
    if (s && s.animate) s.animate([{ transform: 'scale(.6)' }, { transform: 'scale(1.12)', offset: .55 }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.25,.1,.25,1)' });
    if (r && r.animate) r.animate([{ transform: 'scale(1)', opacity: .4 }, { transform: 'scale(1.4)', opacity: 0 }], { duration: 450, easing: 'ease-out' });
  }
  btn._t = setTimeout(function () { btn.classList.remove('copied'); }, 1400);
}
function legacyCopy(text) {
  var ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;-webkit-user-select:text;user-select:text';
  document.body.appendChild(ta);
  ta.focus({ preventScroll: true }); ta.setSelectionRange(0, text.length);
  var ok = false; try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
  ta.remove(); return ok;
}
function rollback(btn, text) {
  if (btn) { btn.classList.remove('copied'); btn.classList.add('err'); setTimeout(function () { btn.classList.remove('err'); }, 1400); }
  toast(STR.fail, { bad: true, ms: 3000 });
  openFallback(text);
}
/* o: {btn,label,lang,rec,warn,sub,done(ok)} — called synchronously from a click handler.
   The seal is optimistic (instant); the success toast waits for the clipboard write to resolve. */
function copy(text, o) {
  text = clean(text);
  o = o || {};
  var l = o.lang || lang;
  seal(o.btn);
  var ok = function () {
    toast(o.msg || ('Đã chép · ' + short(o.label || 'Văn bản') + ' · ' + l.toUpperCase()), { sub: o.warn || o.sub, icon: o.icon });
    if (o.rec) afterPaint(function () { commitRecent(o.rec, l); });
    if (o.done) o.done(true);
  };
  var bad = function () { if (o.done) o.done(false); rollback(o.btn, text); };
  try {
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, function () { if (legacyCopy(text)) ok(); else bad(); });
      hap();
      return;
    }
  } catch (e) { /* fall through */ }
  if (legacyCopy(text)) { hap(); ok(); } else bad();
}
function short(s) { return s.length > 22 ? s.slice(0, 21) + '…' : s; }
function commitRecent(key, l) {
  st.recents = st.recents.filter(function (r) { return r.k !== key.k + l; });
  st.recents.unshift({ k: key.k + l, label: key.label, lang: l, ref: key.ref });
  st.recents = st.recents.slice(0, 8);
  save(); renderRecents();
}

/* ---------- rendering: rows ---------- */
function cbtn(act, attrs, label, icon) {
  return '<button class="cbtn' + (icon ? '' : ' c-copy') + '" data-act="' + act + '" ' + attrs + ' aria-label="' + esc(label) + '"><span class="cb">' + ic(icon || 'copy', 'g') + '<span class="seal">' + ic('check') + '</span><i class="ring"></i></span></button>';
}
function pRow(p) {
  var c = p.variant ? '' : colorOf(p), sw = swatch(p);
  var chk = p.truncated && p.truncated.some(function (f) { return !ov(p.id)[f]; }) ? '<em class="chk">Cần kiểm tra</em>' : '';
  return '<div class="row" role="button" tabindex="0" data-open="p:' + p.id + '" data-menu="p:' + p.id + '" aria-label="' + esc(pname(p) + ', ' + money(pv(p, 'price'), 'vi') + ', mở chi tiết') + '">' +
    '<span class="disc">' + esc(pv(p, 'emoji')) + '</span><span class="rtxt"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub fx">' +
    (sw ? '<i class="dot" style="background:' + sw + ';flex:none"></i>' : '') + '<span class="num" style="flex:none">' + money(pv(p, 'price'), 'vi') + '</span>' + (c ? '<span class="st2">&nbsp;· ' + esc(c) + '</span>' : '') + chk + '</span></span>' +
    cbtn('cp', 'data-id="' + p.id + '"', 'Chép ' + pname(p)) +
    '<span class="swact"><button data-act="swsize" data-id="' + p.id + '" tabindex="-1">Size</button><button data-act="swadd" data-id="' + p.id + '" tabindex="-1">Đơn</button></span></div>';
}
function fPreview(e) {
  var et = entryText(e, lang);
  if (et.empty) return { sub: 'Chỉ gửi đính kèm: ' + (e.attach || '—'), kind: 'att' };
  if (et.fell) return { sub: 'Chưa có bản ' + lang.toUpperCase() + ' — chạm để chọn', kind: 'need' };
  var r = resolve(et.text, lang, {}, false);
  if (r.missing.length) return { sub: 'Cần điền: ' + r.missing.map(function (k) { return STR.tokl[k] || k; }).join(', '), kind: 'need', missing: r.missing };
  return { sub: r.text.replace(/\s+/g, ' '), kind: 'ok' };
}
function fRow(e) {
  if (isPh(e)) {
    return '<div class="row srow plain compact" role="button" tabindex="0" data-act="editf" data-id="' + e.id + '"><span class="rtxt"><span class="t">' + esc(eLabel(e)) + '</span><span class="sub need">Chưa có câu — bấm để thêm</span></span><span class="cbtn"><span class="cb">' + ic('pencil', 'g') + '</span></span></div>';
  }
  var pr = fPreview(e), nav = e.id === 'order-recap', btn;
  if (nav) btn = '<span class="cbtn" style="color:var(--label-3)">' + ic('chev', 's13') + '</span>';
  else if (pr.kind === 'att') btn = '<button class="cbtn" data-act="att" data-id="' + e.id + '" aria-label="Nhắc đính kèm"><span class="cb">' + ic('clip', 'g') + '</span></button>';
  else if (pr.kind === 'need') btn = '<button class="cbtn" data-act="cf" data-id="' + e.id + '" aria-label="Điền ' + esc(eLabel(e)) + '"><span class="cb">' + ic('pencil', 'g') + '</span></button>';
  else btn = cbtn('cf', 'data-id="' + e.id + '"', 'Chép ' + eLabel(e));
  return '<div class="row srow plain" role="button" tabindex="0" data-open="f:' + e.id + '" data-menu="f:' + e.id + '"><span class="rtxt"><span class="t">' + esc(eLabel(e)) +
    (e.attach && pr.kind !== 'att' ? '<span class="clipi" title="' + esc(e.attach) + '">' + ic('clip', 's13') + '<span class="vh">Đính kèm: ' + esc(e.attach) + '</span></span>' : '') + '</span>' +
    '<span class="sub ' + (pr.kind === 'need' || pr.kind === 'att' ? 'need' : '') + '">' + esc(pr.sub) + '</span></span>' + btn + '</div>';
}
function sec(h, body, foot, cls) { return '<div class="sec ' + (cls || '') + '">' + (h ? '<h2 class="sh-h">' + h + '</h2>' : '') + body + (foot || '') + '</div>'; }
/* long lists are cut into content-visibility chunks (a section is far too coarse a unit) */
function grp(items, fn) {
  if (items.length <= 20) return '<div class="grp">' + items.map(fn).join('') + '</div>';
  var out = '<div class="grp">';
  for (var i = 0; i < items.length; i += 20) out += '<div class="chunk">' + items.slice(i, i + 20).map(fn).join('') + '</div>';
  return out + '</div>';
}
function greeting() {
  var h = new Date().getHours();
  return h >= 5 && h < 11 ? 'Chào buổi sáng, Embrace' : h >= 11 && h < 14 ? 'Buổi trưa an yên nhé' : h >= 14 && h < 18 ? 'Chiều dịu dàng, Embrace' : h >= 18 && h < 22 ? 'Tối êm, Embrace' : 'Khuya rồi, nghỉ ngơi sớm nhé';
}
/* the Gần đây block always exists, so the first copy never moves the rows under the finger */
function recentChipsInner() {
  if (!st.recents.length) return '<span class="chip ghost" aria-disabled="true">Bản đã chép sẽ hiện ở đây</span>';
  return st.recents.map(function (r, i) {
    return '<button class="chip" data-act="rcopy" data-i="' + i + '">' + ic('copy', 's13') + esc(short(r.label) + (r.lang === 'en' ? ' · EN' : '')) + '</button>';
  }).join('');
}
function recentChips() { return '<div class="sec" id="recents"><h2 class="sh-h" style="padding-top:8px">Gần đây</h2><div class="chips">' + recentChipsInner() + '</div></div>'; }
function renderRecents() { var r = $('#recents .chips'); if (r) r.innerHTML = recentChipsInner(); }
function tile(id) {
  var e = FM[id];
  return '<div class="tile" role="button" tabindex="0" data-act="greet" data-id="' + id + '" data-open="f:' + id + '" data-menu="f:' + id + '"><span class="rtxt"><span class="t">' + esc(id === 'open-first' ? 'Khách mới' : 'Khách quen') + '</span><span class="sub" data-gs></span></span>' + cbtn('greet', 'data-id="' + id + '" tabindex="-1"', 'Chép lời chào ' + eLabel(e)) + '</div>';
}
/* greeting context line: which product the greeting will carry (or none) */
var gT;
function syncGreet() {
  var g = greetCtx(), p = g ? PM[g.itemId] : null, nm = p ? pname(p, lang) : '';
  $$('#tab-mau [data-gs]').forEach(function (el) { el.textContent = p ? 'kèm ' + nm : 'Chỉ lời chào'; });
  var chip = $('#gchip'), add = $('#gadd');
  if (chip) { chip.hidden = !p; var b = chip.querySelector('.tx'); if (b) b.textContent = 'Lời chào kèm: ' + nm + (g && g.size ? ' · ' + g.size : ''); }
  if (add) add.hidden = !!p;
  clearTimeout(gT); if (g) gT = setTimeout(syncGreet, Math.max(1000, g.at + 5 * 60000 - Date.now() + 300));
}
function renderMau() {
  var t = $('#tab-mau'), b = $('#mau-body');
  if (!b) { t.innerHTML = '<p class="greet"></p><h1 class="lt">Mẫu</h1><div class="sent" data-tab="mau"></div><div id="mau-body"></div>'; b = $('#mau-body'); observe(); }
  $('.greet', t).textContent = greeting();
  var favs = st.favs.filter(function (id) { return PM[id]; });
  var sets = FL.filter(function (e) { return e.n === 5; });
  var h = recentChips();
  h += sec('Lời chào', '<div class="tiles">' + tile('open-first') + tile('open-returning') + '</div>' +
    '<div class="gline"><div class="ctx" id="gchip" hidden><span class="d"></span><button class="tx" data-act="ctxedit"></button><button class="x" data-act="ctxclear" aria-label="Bỏ mẫu kèm lời chào">' + ic('x', 's13') + '</button></div><button class="txtbtn gadd" id="gadd" data-act="gadd">Thêm thông tin mẫu ›</button></div>');
  if (favs.length) h += sec('Yêu thích', grp(favs, function (id) { return pRow(PM[id]); }));
  h += sec('Set', '<div class="grp">' + sets.map(fRow).join('') + '</div>');
  h += sec('Tất cả mẫu · ' + PL.length, grp(PL, pRow), favs.length ? '' : '<p class="sh-f">Chạm giữ một mẫu để thêm vào Yêu thích nhé.</p>');
  b.innerHTML = h;
  syncGreet();
}
function ctxChipHtml() {
  var c = ctx();
  return '<div class="ctx" id="ctxchip"' + (c ? '' : ' hidden') + '><span class="d"></span><button class="tx" data-act="ctxedit">Đang tư vấn: ' + esc(ctxLabel()) + '</button><button class="x" data-act="ctxclear" aria-label="Xoá ngữ cảnh">' + ic('x', 's13') + '</button></div>';
}
var dirty = { flow: false, order: false };
function renderFlow() {
  tabsReady.flow = true; dirty.flow = false;
  var t = $('#tab-flow'), b = $('#flow-body');
  if (!b) { t.innerHTML = '<h1 class="lt">Kịch bản</h1><div class="sent" data-tab="flow"></div><div id="flow-body"></div>'; b = $('#flow-body'); observe(); }
  var h = ctxChipHtml();
  for (var n = 1; n <= 6; n++) {
    var es = FL.filter(function (e) { return e.n === n; });
    if (!es.length) continue;
    h += sec('<span><span class="n num">' + n + '</span> · ' + STR.stage[n] + '</span>', grp(es, fRow));
  }
  b.innerHTML = h;
}
/* render a secondary tab now if it is on screen, otherwise just mark it stale */
function refreshTab(t) {
  if (t === 'mau') { renderMau(); return; }
  if (!tabsReady[t]) return;
  if (tab === t) (t === 'flow' ? renderFlow : renderOrder)(); else dirty[t] = true;
}
function renderCtxBits() {
  var c = $('#ctxchip'); if (c) { c.hidden = !ctx(); var b = c.querySelector('.tx'); if (b) b.textContent = 'Đang tư vấn: ' + ctxLabel(); }
  syncGreet();
  refreshTab('flow'); refreshTab('order');
}

/* ---------- order tab ---------- */
var ordUI = { open: -1, prev: false }, tabsReady = { mau: true };
function updateBadge() { var c = calc(), b = $('#bdg'); b.hidden = !c.count; b.textContent = c.count; }
function renderOrder() {
  tabsReady.order = true; dirty.order = false;
  var t = $('#tab-order'), body = $('#order-body');
  if (!body) { t.innerHTML = '<h1 class="lt">Đơn hàng</h1><div class="sent" data-tab="order"></div><div id="order-body"></div>'; body = $('#order-body'); observe(); }
  var d = st.draft, c = calc(), h = '';
  if (d.copiedAt && Date.now() - d.copiedAt < 864e5) {
    h += '<div class="ocard"><h3>' + ic('sparkle') + 'Khách đã chuyển khoản?</h3><p>Gửi lời cảm ơn thật ấm nhé.</p><div class="acts"><button class="btn sm" data-act="thank">' + ic('copy', 's20') + 'Chép lời cảm ơn</button><button class="btn sm sec2" data-act="neworder">Đơn mới</button></div></div>';
  }
  var cx = ctx(), rows = '';
  if (cx && cx.itemId && cx.size && PM[cx.itemId] && !d.lines.some(function (L) { return L.pid === cx.itemId && L.size === cx.size; })) {
    rows += '<div class="row plain sugg" role="button" tabindex="0" data-act="sugg"><span class="rtxt"><span class="t">Thêm ' + esc(pname(PM[cx.itemId], 'vi') + ' · ' + cx.size) + '</span></span><span class="hint">gợi ý</span></div>';
  }
  d.lines.forEach(function (L, i) {
    var p = PM[L.pid]; if (!p) return;
    rows += '<div class="row lrow' + (ordUI.open === i ? ' open' : '') + '" data-act="lineopen" data-i="' + i + '"><div class="lm"><span class="disc">' + esc(pv(p, 'emoji')) + '</span><span class="rtxt"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub">Size ' + L.size + ' · SL ' + L.qty + '</span></span><span class="pr">' + money(pv(p, 'price') * L.qty, 'vi') + '</span></div>' +
      '<div class="lexp"><div class="chips wrapc">' + psizes(p).map(function (s) { return '<button class="chip" data-act="linesize" data-i="' + i + '" data-v="' + s + '" aria-pressed="' + (s === L.size) + '">' + s + '</button>'; }).join('') + '</div>' +
      '<span class="step"><button data-act="qty" data-i="' + i + '" data-d="-1" aria-label="Giảm">' + ic('minus') + '</button><span class="v num">' + L.qty + '</span><button data-act="qty" data-i="' + i + '" data-d="1" aria-label="Tăng">' + ic('plus') + '</button></span>' +
      '<button class="txtbtn dest" data-act="linedel" data-i="' + i + '">Xoá</button></div><span class="swact"><button class="dest" data-act="linedel" data-i="' + i + '" tabindex="-1">Xoá</button></span></div>';
  });
  rows += '<button class="row plain srow addrow" style="width:100%;min-height:44px;text-align:left" data-act="addpick">' + ic('plus', 's20') + '<span>Thêm món</span></button>';
  h += sec('Món', '<div class="grp">' + rows + '</div>');
  if (!d.lines.length) h += '<div class="empty">' + ic('bag', 's34') + '<div class="tt">Đơn còn trống</div><p>Thêm món đầu tiên để bắt đầu nhé.</p></div>';
  var labels = [['courier', 'Trả shipper'], ['fee', money(st.set.fee, 'vi')], ['free', 'Freeship'], ['custom', 'Khác']];
  var idx = labels.findIndex(function (x) { return x[0] === d.ship; });
  h += sec('Phí ship', '<div style="margin:0 var(--margin)"><div class="seg full" role="group" aria-label="Phí ship" style="--n:4"><span class="th" style="--n:4;width:calc((100% - 4px)/4);transform:translateX(' + (idx * 100) + '%)"></span>' + labels.map(function (x) { return '<button data-act="ship" data-v="' + x[0] + '" aria-pressed="' + (d.ship === x[0]) + '" style="min-width:0;padding:0 4px">' + esc(x[1]) + '</button>'; }).join('') + '</div>' +
    (d.ship === 'custom' ? '<input class="fld" style="margin-top:8px" inputmode="numeric" data-in="custom" placeholder="Nhập phí ship (đ)" value="' + (d.custom ? nfV.format(d.custom) : '') + '" aria-label="Phí ship khác">' : '') + '</div>');
  h += sec('Thông tin nhận (tuỳ chọn)', '<div style="position:relative;margin:0 var(--margin)"><textarea class="ta sel" data-in="info" placeholder="Dán tên, SĐT, địa chỉ khách gửi…" aria-label="Thông tin nhận" style="padding-right:48px">' + esc(d.info) + '</textarea><button class="iconbtn" data-act="pasteinfo" aria-label="Dán" style="position:absolute;right:2px;top:2px"><span class="c" style="background:none">' + ic('paste', 's20') + '</span></button></div>');
  if (st.set.bank.no) h += '<div class="swrow"><span>Kèm thông tin chuyển khoản</span><label class="sw"><input type="checkbox" switch data-in="bank" aria-label="Kèm thông tin chuyển khoản"' + (d.bank ? ' checked' : '') + '><i></i></label></div>';
  else h += '<button class="swrow swlink" data-act="bankset"><span>Thêm STK để kèm vào đơn</span>' + ic('chev', 's13') + '</button>';
  h += '<button class="prevb" data-act="prevtoggle" style="margin:12px var(--margin) 0;width:calc(100% - 2*var(--margin))"><span>Xem trước</span>' + ic('chev', 's13') + '</button>';
  if (ordUI.prev) h += '<div style="margin:4px var(--margin) 0"><div class="paper sel" id="ordprev">' + esc(d.lines.length ? orderText(lang) : 'Chưa có món') + '</div></div>';
  body.innerHTML = h;
  var tb = $('#totbar');
  tb.innerHTML = '<div><div class="tl">' + (c.count ? 'Tổng · ' + c.count + ' món' : 'Chưa có món') + '</div><div class="tv num">' + money(c.total, lang) + '</div></div>' +
    '<button class="btn" id="obtn" data-act="copyorder"' + (c.count ? '' : ' disabled') + '><span class="l1">' + ic('copy', 's20') + 'Chép đơn</span><span class="l2">' + ic('check', 's20') + 'Đã chép</span></button>';
  updateBadge();
}
function addLine(pid, size, qty) {
  var d = st.draft, f = d.lines.find(function (L) { return L.pid === pid && L.size === size; });
  if (f) f.qty = Math.min(9, f.qty + (qty || 1)); else d.lines.push({ pid: pid, size: size, qty: qty || 1 });
  setCtxQuiet(pid, size); save(); updateBadge(); refreshTab('order'); bump();
}
function setCtxQuiet(pid, size) { st.ctx = { itemId: pid, size: size, at: Date.now() }; save(); var c = $('#ctxchip'); if (c) { c.hidden = false; c.querySelector('.tx').textContent = 'Đang tư vấn: ' + ctxLabel(); } syncGreet(); refreshTab('flow'); }
function bump() { var b = $('#bdg'); if (b.animate && !reduce) b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }], { duration: 300 }); }

/* ---------- tabs / nav ---------- */
var TABS = ['mau', 'flow', 'order'], TITLES = { mau: 'Mẫu', flow: 'Kịch bản', order: 'Đơn hàng' };
var scrolled = { mau: false, flow: false, order: false };
var nav = $('#nav');
function go(t, noScroll) {
  if (t === tab && !noScroll) { var el = $('#tab-' + t); el.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); return; }
  if (t === 'flow' && (!tabsReady.flow || dirty.flow)) renderFlow();
  if (t === 'order' && (!tabsReady.order || dirty.order)) renderOrder();
  if (t === 'mau') syncGreet();
  tab = t; st.tab = t; st.active = Date.now(); save();
  TABS.forEach(function (x, i) {
    $('#tab-' + x).classList.toggle('on', x === t);
    var b = $('#tabbar [data-v=' + x + ']'); b.setAttribute('aria-selected', x === t);
    if (x === t) { $('#tabbar .loz').style.transform = 'translateX(' + (i * 100) + '%)'; if (!reduce && b.firstElementChild.animate) b.firstElementChild.animate([{ transform: 'scale(.88)' }, { transform: 'scale(1)' }], { duration: 300, easing: 'cubic-bezier(.25,.1,.25,1)' }); }
  });
  nav.classList.toggle('scrolled', !!scrolled[t]);
  $('#nttl').textContent = TITLES[t];
  var nl = $('#nl');
  if (t === 'mau') { nl.hidden = false; nl.setAttribute('data-act', 'settings'); nl.setAttribute('aria-label', 'Cài đặt'); nl.innerHTML = ic('sliders', 's22'); }
  else if (t === 'order') { nl.hidden = false; nl.setAttribute('data-act', 'neworder'); nl.removeAttribute('aria-label'); nl.innerHTML = 'Đơn mới'; }
  else nl.hidden = true;
  $('#totbar').classList.toggle('on', t === 'order');
  document.body.classList.toggle('on-order', t === 'order');
}
document.addEventListener('visibilitychange', function () { if (!document.hidden && tab === 'order' && dirty.order) renderOrder(); });
var io, navH = 44;
function observe() {
  if (!window.IntersectionObserver) return;
  if (!io) {
    navH = nav.offsetHeight || 44;
    io = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        var t = en.target.getAttribute('data-tab');
        if (t !== tab) return;   /* hidden tabs (content-visibility) report bogus geometry */
        scrolled[t] = !en.isIntersecting && en.boundingClientRect.top < navH;
        nav.classList.toggle('scrolled', scrolled[t]);
      });
    }, { rootMargin: '-' + navH + 'px 0px 0px 0px', threshold: 0 });
  }
  $$('.sent').forEach(function (s) { io.observe(s); });
}

/* ---------- language ---------- */
function segThumb(seg) {
  var bs = $$('button', seg), i = bs.findIndex(function (b) { return b.getAttribute('aria-pressed') === 'true'; });
  var th = $('.th', seg); if (th) th.style.transform = 'translateX(' + (Math.max(i, 0) * 100) + '%)';
}
function langSeg() { return '<div class="seg lang" role="group" aria-label="Ngôn ngữ"><span class="th" style="--n:2;width:calc((100% - 4px)/2);transform:translateX(' + (lang === 'en' ? 100 : 0) + '%)"></span><button data-act="lang" data-v="vi" aria-pressed="' + (lang === 'vi') + '">VI</button><button data-act="lang" data-v="en" aria-pressed="' + (lang === 'en') + '">EN</button></div>'; }
function syncLangNav() {
  var seg = $('#lang'); $$('button', seg).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === lang); }); segThumb(seg);
  document.body.classList.toggle('lang-en', lang === 'en');
}
function setLang(l) {
  if (l === lang) return;
  lang = l; hap();
  syncLangNav();
  document.documentElement.lang = 'vi';
  refreshTab('flow'); refreshTab('order'); syncGreet();
  SH.forEach(function (s) { if (s.kind === 'product' || s.kind === 'msg') rerender(s); });
  if (document.body.classList.contains('searching')) doSearch();
}

/* ---------- sheets ---------- */
var SH = [], sheetsEl = $('#sheets'), appEl = $('#app'), SAFE_TOP = null;
/* the sheet's height is viewport minus safe-top minus 10: measure the safe inset once, never the sheet */
function measureSafe() { var d = document.createElement('div'); d.style.cssText = 'position:absolute;visibility:hidden;width:0;height:var(--safe-top)'; document.body.appendChild(d); SAFE_TOP = d.getBoundingClientRect().height; d.remove(); }
addEventListener('resize', function () { SAFE_TOP = null; });
function syncSheetBody() {
  var top = SH[SH.length - 1];
  document.body.classList.toggle('sheet-open', !!top);
  document.body.classList.toggle('sheet-prod', !!top && top.kind === 'product');
}
function pushSheet(o) {
  dismissToast();
  var wrap = document.createElement('div'); wrap.className = 'sh';
  wrap.innerHTML = '<div class="dim" data-act="shdim"></div><section class="sheet" role="dialog" aria-modal="true" tabindex="-1"></section>';
  sheetsEl.appendChild(wrap);
  var s = { wrap: wrap, el: wrap.lastChild, det: o.det || 'm', fixed: !!o.fixed, render: o.render, state: o.state || {}, kind: o.kind, opener: document.activeElement, onClose: o.onClose };
  s.el.innerHTML = o.render(s);
  SH.push(s);
  if (SAFE_TOP == null) measureSafe();
  s.H = innerHeight - SAFE_TOP - 10;
  s.offMed = s.fixed ? 0 : Math.max(0, Math.round(s.H - 0.6 * innerHeight));
  s.off = s.det === 'l' ? 0 : s.offMed;
  s.el.style.setProperty('--off', s.off + 'px');
  syncSheetBody();
  /* final state is applied immediately; the slide runs as a WAAPI animation, so no forced style/layout and no extra frames */
  wrap.classList.add('in'); s.el.style.transform = 'translateY(' + s.off + 'px)';
  if (s.el.animate) {
    var dur = reduce ? 250 : 380, ez = 'cubic-bezier(.32,.72,0,1)';
    s.anim = s.el.animate([{ transform: 'translateY(' + (s.H + 4) + 'px)' }, { transform: 'translateY(' + s.off + 'px)' }], { duration: dur, easing: ez });
    wrap.firstChild.animate([{ opacity: 0 }, { opacity: 1 }], { duration: dur, easing: ez });
  }
  behind();
  var ttl = s.el.querySelector('h2'); if (ttl) { ttl.tabIndex = -1; s.el.setAttribute('aria-label', ttl.textContent); }
  setTimeout(function () { try { s.el.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }, 0);
  return s;
}
function rerender(s) {
  var b = s.el.querySelector('.shb'), keep = b ? b.scrollTop : 0;
  s.el.innerHTML = s.render(s);
  b = s.el.querySelector('.shb'); if (b) b.scrollTop = keep;
}
function behind() { appEl.classList.toggle('behind', SH.some(function (s) { return s.det === 'l' && !s.fixedBehind; })); }
function setDetent(s, d) {
  if (s.fixed || s.det === d) return;
  s.det = d; s.off = d === 'l' ? 0 : s.offMed;
  s.el.style.setProperty('--off', s.off + 'px');
  s.el.style.transform = 'translateY(' + s.off + 'px)';
  var g = s.el.querySelector('.grab'); if (g && !reduce) g.animate([{ opacity: .2 }, { opacity: .5 }], { duration: 120 });
  behind();
}
function closeSheet(s, keepToast) {
  if (!s || s.closing) return;
  s.closing = true;
  if (s.anim) { s.anim.cancel(); s.anim = null; }
  var i = SH.indexOf(s); if (i > -1) SH.splice(i, 1);
  s.el.style.transform = 'translateY(' + (s.H + 4) + 'px)'; s.wrap.classList.remove('in');
  s.wrap.style.pointerEvents = 'none';
  syncSheetBody();
  if (!keepToast) dismissToast();
  behind();
  setTimeout(function () {
    s.wrap.remove();
    var op = s.opener;   /* focus restore reads layout: do it after the slide-out, not in the tap */
    if (op && document.contains(op) && (!SH.length || topS().el.contains(op))) { try { op.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }, reduce ? 280 : 340);
  if (s.onClose) s.onClose();
}
function closeTop() { closeSheet(SH[SH.length - 1]); }
function topS(kind) { var s = SH[SH.length - 1]; return s && (!kind || s.kind === kind) ? s : null; }
/* drag handling */
(function () {
  var d = null;
  document.addEventListener('pointerdown', function (e) {
    var h = e.target.closest('.sheet .drag'); if (!h || e.target.closest('button,input,a')) return;
    var s = SH.find(function (x) { return x.el === h.parentNode; }); if (!s || s.closing) return;
    if (s.anim) { s.anim.cancel(); s.anim = null; }
    d = { s: s, y0: e.clientY, off0: s.off, smp: [[performance.now(), e.clientY]], pid: e.pointerId, h: h };
    try { h.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ }
    s.el.classList.add('drag');
  });
  document.addEventListener('pointermove', function (e) {
    if (!d || e.pointerId !== d.pid) return;
    var o = d.off0 + (e.clientY - d.y0), s = d.s;
    if (o < 0) { var H = s.H; o = -((1 - 1 / ((-o) * 0.55 / H + 1)) * H); if (reduce) o = Math.max(o, -8); }
    s.el.style.transform = 'translateY(' + o + 'px)'; d.o = o;
    var t = performance.now(); d.smp.push([t, e.clientY]); while (d.smp.length > 2 && t - d.smp[0][0] > 100) d.smp.shift();
  });
  function end(e) {
    if (!d || e.pointerId !== d.pid) return;
    var s = d.s, o = d.o == null ? s.off : d.o, a = d.smp[0], b = d.smp[d.smp.length - 1];
    var v = b[0] > a[0] ? (b[1] - a[1]) / (b[0] - a[0]) * 1000 : 0;
    s.el.classList.remove('drag'); d = null;
    var vis = s.H - s.off;
    if (o - s.off > vis * 0.35 || v > 800) { closeSheet(s); return; }
    var target = o + v * 0.15, best = 'l', dets = s.fixed ? [0] : [0, s.offMed];
    var bo = dets.reduce(function (p, c) { return Math.abs(c - target) < Math.abs(p - target) ? c : p; }, dets[0]);
    best = bo === 0 ? 'l' : 'm';
    if (s.fixed) { s.el.style.transform = 'translateY(0px)'; return; }
    if (s.det === best) { s.el.style.transform = 'translateY(' + s.off + 'px)'; var g = s.el.querySelector('.grab'); if (g) g.animate([{ opacity: .2 }, { opacity: .5 }], { duration: 120 }); }
    else { setDetent(s, best); hap(); }
  }
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
})();
document.addEventListener('pointerdown', function (e) {
  var s = topS(); if (s && e.target.matches && e.target.matches('input,textarea') && s.el.contains(e.target)) setDetent(s, 'l');
}, { passive: true });
document.addEventListener('focusin', function (e) {
  var s = topS(); if (s && e.target.matches('input,textarea') && s.el.contains(e.target)) setDetent(s, 'l');
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { if ($('.dlg')) $('.dlg').remove(); else if ($('#menu.on')) closeMenu(); else if (SH.length) closeTop(); else if (document.body.classList.contains('searching')) exitSearch(); }
  if (e.key === 'Tab' && SH.length) {
    var s = topS(), f = $$('button,input,textarea,[tabindex="0"]', s.el).filter(function (x) { return !x.disabled && x.offsetParent; });
    if (!f.length) return; var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); }
  }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role=button][data-open]')) { e.preventDefault(); e.target.click(); }
});
function shHead(title, sub, extra, closeAct) {
  return '<div class="drag"><i class="grab"></i><div class="shh"><div class="tw"><h2>' + esc(title) + '</h2>' + (sub ? '<div class="st">' + sub + '</div>' : '') + '</div>' + (extra || '') +
    '<button class="iconbtn" data-act="' + (closeAct || 'shclose') + '" aria-label="Đóng"><span class="c">' + ic('x', 's15') + '</span></button></div></div>';
}
function segHtml(items, cur, act, cls) {
  var i = Math.max(0, items.findIndex(function (x) { return x[0] === cur; })), n = items.length;
  return '<div class="seg ' + (cls || '') + '" role="group"><span class="th" style="width:calc((100% - 4px)/' + n + ');transform:translateX(' + (i * 100) + '%)"></span>' + items.map(function (x) { return '<button data-act="' + act + '" data-v="' + x[0] + '" aria-pressed="' + (x[0] === cur) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>';
}

/* ----- product sheet ----- */
function openProduct(id) {
  openOnly('product', id);
  pushSheet({
    kind: 'product', det: 'm', state: { id: id, view: 'desc' },
    render: function (s) {
      var p = PM[id], v = s.state.view, fav = st.favs.indexOf(id) > -1;
      var txt = ptext(p, v, lang), trunc = ptrunc(p, v, lang);
      var pri = v === 'desc' ? ['desc', 'Chép thông tin', 'copy'] : ['size', 'Chép bảng size', 'ruler'], sec2 = v === 'desc' ? ['size', 'Bảng size', 'ruler'] : ['desc', 'Thông tin', 'copy'];
      var c = colorOf(p), note = pv(p, 'noteVi');
      return shHead(pv(p, 'emoji') + ' ' + pname(p, 'vi'), money(pv(p, 'price'), 'vi') + (c ? ' · ' + esc(c) : ''), '<button class="iconbtn" data-act="fav" data-id="' + id + '" aria-pressed="' + fav + '" aria-label="Yêu thích"><span class="c">' + ic('heart', 's15') + '</span></button>') +
        '<div class="shb"><div class="row2" style="margin-top:0;justify-content:space-between"><div style="flex:1">' + segHtml([['desc', 'Thông tin'], ['size', 'Bảng size']], v, 'pview', 'full') + '</div><span style="flex:none">' + langSeg() + '</span></div>' +
        '<div class="paper sel lang-' + lang + '" style="margin-top:12px" lang="' + lang + '">' + esc(txt.trim() || '(chưa có nội dung)') + '</div>' +
        (trunc ? '<div class="note">' + ic('warn', 's15') + '<span><b style="color:var(--destructive)">Cần kiểm tra:</b> Đoạn này bị cắt ở sheet gốc — sửa trước khi gửi nhé.<br><button class="txtbtn lnk" data-act="editp" data-id="' + id + '">Sửa nội dung</button></span></div>' : '') +
        (note ? '<div class="note">' + ic('sparkle', 's15') + '<span><span class="vh">Ghi chú nội bộ: </span>' + esc(note) + '</span></div>' : '') +
        '</div>' +
        '<div class="shf col"><div class="row2"><span class="lb">Thêm vào đơn</span><div class="chips" style="padding:0">' + psizes(p).map(function (z) { return '<button class="chip" data-act="addline" data-id="' + id + '" data-v="' + z + '">' + z + '</button>'; }).join('') + '</div></div>' +
        '<div class="btns"><button class="btn sec2" data-act="pcopy" data-id="' + id + '" data-w="' + sec2[0] + '">' + lblBtn(sec2[2], sec2[1]) + '</button><button class="btn main" data-act="pcopy" data-id="' + id + '" data-w="' + pri[0] + '">' + lblBtn(pri[2], pri[1]) + '</button></div></div>';
    }
  });
}
function openOnly(kind, id) { /* allow replace */ }
function lblBtn(icon, text) { return '<span class="l1">' + ic(icon, 's20') + text + '</span><span class="l2">' + ic('check', 's20') + 'Đã chép</span>'; }
function editEntry(id) { openSettings(['main', 'list:' + (FM[id].n === 5 ? 's' : 'f'), 'edit:f:' + id]); }
function editProduct(id) { openSettings(['main', 'list:p', 'edit:p:' + id]); }
function liveBtn(btn) { return btn && document.contains(btn) ? btn : null; }
/* tokens in a template that would pull in a product text flagged as truncated */
function truncIn(tpl, l, fills) {
  var p = PM[fillVal('item', fills)], ws = [];
  if (!p) return null;
  if (/\{\{itemInfo\}\}/.test(tpl) && ptrunc(p, 'desc', l)) ws.push('desc');
  if (/\{\{sizeChart\}\}/.test(tpl) && ptrunc(p, 'size', l)) ws.push('size');
  return ws.length ? { p: p, ws: ws } : null;
}
function truncBox(p, ws, proceed) {
  dlgBox('Đoạn ' + (ws[0] === 'size' ? 'bảng size' : 'thông tin') + ' của ' + pname(p, 'vi') + ' bị cắt ở sheet gốc — sửa trước khi gửi nhé.',
    [['Sửa nội dung', function () { editProduct(p.id); }, 'pri'], ['Vẫn chép', proceed, ''], ['Huỷ', null, '']]);
}
function missingLangBox(name, l, onOther, onEdit) {
  dlgBox('Chưa có bản ' + l.toUpperCase() + ' của ' + name + '.', [['Thêm bản ' + l.toUpperCase(), onEdit, 'pri'], ['Chép bản ' + other(l).toUpperCase(), onOther, ''], ['Huỷ', null, '']]);
}
function copyProduct(id, w, btn, withGreet, l, force) {
  var p = PM[id]; l = l || lang;
  if (withGreet) { copyGreeting('open-first', btn, id, l, force); return; }
  var body = ptext(p, w, l).trim();
  if (!body) {
    var ol = other(l);
    if (ptext(p, w, ol).trim()) missingLangBox(pname(p, 'vi'), l, function () { copyProduct(id, w, null, false, ol); }, function () { editProduct(id); });
    else toast('Chưa có nội dung ' + l.toUpperCase(), { bad: true });
    return;
  }
  if (!force && ptrunc(p, w, l)) { truncBox(p, [w], function () { copyProduct(id, w, liveBtn(btn), false, l, true); }); return; }
  var label = w === 'size' ? 'Bảng size ' + pname(p, 'vi') : pname(p, 'vi');
  copy(body, { btn: btn, label: label, lang: l, rec: { k: 'p:' + id + ':' + w, label: label, ref: { t: 'p', id: id, w: w } } });
  afterPaint(function () { setCtx(id); });   /* context (and the tabs it feeds) updates after the seal has painted */
}
/* greeting: always says which product it carries; with none, copies the greeting alone */
function greetOnly(tpl) { return tpl.replace(/\s*for \{\{item\}\}/g, '').replace(/\{\{itemInfo\}\}/g, '').replace(/\{\{item\}\}/g, '').replace(/[:：]\s*$/, ''); }
function copyGreeting(gid, btn, pid, l, force) {
  var e = FM[gid]; l = l || lang;
  if (isPh(e)) { editEntry(gid); return; }
  var et = entryText(e, l);
  if (et.empty || et.fell) { openMessage(gid); return; }
  if (pid === undefined) { var g = greetCtx(); pid = g ? g.itemId : null; }
  var p = pid ? PM[pid] : null, tpl = et.text, uses = /\{\{(itemInfo|item)\}\}/.test(tpl);
  if (p && uses) {
    if (!ptext(p, 'desc', l).trim()) {
      var ol = other(l);
      if (ptext(p, 'desc', ol).trim()) missingLangBox(pname(p, 'vi'), l, function () { copyGreeting(gid, null, pid, ol, true); }, function () { editProduct(pid); });
      else toast('Chưa có nội dung ' + l.toUpperCase(), { bad: true });
      return;
    }
    if (!force && ptrunc(p, 'desc', l)) { truncBox(p, ['desc'], function () { copyGreeting(gid, liveBtn(btn), pid, l, true); }); return; }
  } else if (uses) tpl = greetOnly(tpl);
  var r = resolve(tpl, l, p ? { item: pid } : {}, false);
  if (r.missing.length) { openMessage(gid); return; }
  var withP = !!(p && uses), label = withP ? 'Lời chào + ' + pname(p, 'vi') : eLabel(e);
  copy(r.text, { btn: btn, label: label, lang: l, sub: uses && !p ? 'Chưa chọn mẫu — chỉ chép lời chào' : '', rec: { k: 'g:' + gid + ':' + (withP ? pid : ''), label: label, ref: { t: 'g', id: gid, pid: withP ? pid : null } } });
  if (withP) afterPaint(function () { setCtx(pid); });
}

/* ----- message sheet (flow entry with fill) ----- */
function openMessage(id) {
  pushSheet({
    kind: 'msg', det: keysOf(entryText(FM[id], lang).text).length ? 'l' : 'm', state: { id: id, fills: {} },
    render: function (s) {
      var e = FM[id], et = entryText(e, lang), fills = s.state.fills, r = resolve(et.text, lang, fills, true), keys = keysOf(et.text);
      var rp = resolve(et.text, lang, fills, false), n = rp.missing.length;
      var fr = keys.map(function (k) { return fillRow(k, fills, s); }).join('');
      var fromCtx = keys.some(function (k) { return (k === 'item' || k === 'size') && !fills[k] && fillVal(k, fills); });
      return shHead(eLabel(e), '<span class="num">' + e.n + '</span> · ' + STR.stage[e.n], langSeg()) +
        '<div class="shb">' +
        (et.fell ? '<div class="note" style="margin:0 0 10px">' + ic('warn', 's15') + '<span><b style="color:var(--destructive)">Chưa có bản ' + lang.toUpperCase() + '.</b> Bên dưới là bản ' + other(lang).toUpperCase() + ' — chỉ chép khi bạn muốn gửi tiếng ' + (other(lang) === 'vi' ? 'Việt' : 'Anh') + '.<br><button class="txtbtn lnk" data-act="editf" data-id="' + id + '">Thêm bản ' + lang.toUpperCase() + '</button></span></div>' : '') +
        '<div class="paper sel" id="mprev" lang="' + (et.fell ? other(lang) : lang) + '">' + r.text + '</div>' +
        (e.attach ? '<div class="att">' + ic('clip', 's15') + 'Nhớ đính kèm: ' + esc(e.attach) + '</div>' : '') +
        (keys.length ? '<h3 class="h2">Điền nhanh</h3>' + fr + (fromCtx ? '<p class="foot">Lấy từ Đang tư vấn</p>' : '') : '') + '</div>' +
        '<div class="shf"><button class="btn" id="mcopy" data-act="msgcopy"' + (n ? ' disabled' : '') + '>' + (n ? 'Điền ' + n + ' chỗ nữa' : lblBtn('copy', msgCopyLabel(et))) + '</button></div>';
    }
  });
}
function candidates() {
  var out = [], c = ctx();
  if (c && c.itemId) out.push(c.itemId);
  st.recents.forEach(function (r) { var m = /^p:([^:]+):/.exec(r.k); if (m && PM[m[1]] && out.indexOf(m[1]) < 0) out.push(m[1]); });
  PL.forEach(function (p) { if (out.indexOf(p.id) < 0) out.push(p.id); });
  return out;
}
function fillRow(k, fills, s) {
  var lb = '<span class="lb">' + esc((STR.tokl[k] || k).replace(/^./, function (x) { return x.toUpperCase(); })) + '</span>', cur = fillVal(k, fills), c = '';
  if (k === 'item' || k === 'otherItem') {
    var cur2 = k === 'item' ? cur : fills.otherItem, cands = candidates().slice(0, 4);
    if (cur2 && cands.indexOf(cur2) < 0) cands.unshift(cur2);
    c = '<div class="chips">' + cands.map(function (id) { return '<button class="chip" data-act="fill" data-k="' + k + '" data-v="' + id + '" aria-pressed="' + (id === cur2) + '">' + esc(pname(PM[id], 'vi')) + '</button>'; }).join('') + '<button class="chip ghost" data-act="pickfill" data-k="' + k + '">Chọn…</button></div>';
  } else if (/^size/.test(k)) {
    var pid = fillVal('item', fills), sizes = pid ? psizes(PM[pid]) : ['S', 'M', 'L', 'XL'];
    c = '<div class="chips">' + sizes.map(function (z) { return '<button class="chip" data-act="fill" data-k="' + k + '" data-v="' + z + '" aria-pressed="' + (z === cur) + '">' + z + '</button>'; }).join('') + '</div>';
  } else c = '<input class="fld" data-fill="' + k + '" enterkeyhint="done" value="' + esc(fills[k] || '') + '" placeholder="' + esc(STR.tokl[k] || k) + '" aria-label="' + esc(STR.tokl[k] || k) + '">';
  return '<div class="frow">' + lb + c + '</div>';
}
function msgCopyLabel(et) { return et.fell ? 'Chép bản ' + other(lang).toUpperCase() : 'Chép'; }
function refreshMsg(s) {
  var e = FM[s.state.id], et = entryText(e, lang), r = resolve(et.text, lang, s.state.fills, true), rp = resolve(et.text, lang, s.state.fills, false), n = rp.missing.length;
  var pv_ = s.el.querySelector('#mprev'); if (pv_) pv_.innerHTML = r.text;
  var b = s.el.querySelector('#mcopy'); if (b) { b.disabled = !!n; b.innerHTML = n ? 'Điền ' + n + ' chỗ nữa' : lblBtn('copy', msgCopyLabel(et)); }
}

/* ----- picker (item chooser / add to order) ----- */
function openPicker(mode, cb) {
  pushSheet({
    kind: 'picker', det: 'l', fixed: true, state: { q: '', mode: mode, cb: cb },
    render: function (s) {
      return shHead(mode === 'order' ? 'Thêm món' : 'Chọn mẫu') +
        '<div style="padding:0 20px 8px"><div class="sfield" style="height:36px;border-radius:10px;background:var(--fill-4);box-shadow:none;padding:0 4px 0 10px">' + ic('search') + '<input data-pq type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Tìm mẫu" style="height:36px" aria-label="Tìm mẫu"></div></div>' +
        '<div class="shb" id="plist" style="padding-bottom:calc(var(--safe-bottom) + 16px)">' + pickerList(s) + '</div>';
    }
  });
}
function pickerList(s) {
  var q = norm(s.state.q || '');
  var ps = PL.filter(function (p) { return !q || norm(pname(p, 'vi') + ' ' + colorOf(p)).indexOf(q) > -1; });
  if (!ps.length) return '<div class="empty"><div class="tt">Chưa tìm thấy</div><p>Thử một tên ngắn hơn nhé.</p></div>';
  return '<div class="grp" style="margin:0">' + ps.map(function (p) {
    if (s.state.mode === 'order') return '<div class="row"><span class="rtxt"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub num">' + money(pv(p, 'price'), 'vi') + '</span></span><span class="chips" style="padding:0">' + psizes(p).map(function (z) { return '<button class="chip tall" data-act="pickadd" data-id="' + p.id + '" data-v="' + z + '">' + z + '</button>'; }).join('') + '</span></div>';
    return '<div class="row" role="button" tabindex="0" data-act="pickone" data-id="' + p.id + '"><span class="disc">' + esc(pv(p, 'emoji')) + '</span><span class="rtxt"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub num">' + money(pv(p, 'price'), 'vi') + '</span></span></div>';
  }).join('') + '</div>';
}

/* ----- context editor ----- */
function openCtxEdit() {
  pushSheet({
    kind: 'ctx', det: 'm', fixed: false, state: {},
    render: function () {
      var c = ctx() || {}, pid = c.itemId, sizes = pid ? psizes(PM[pid]) : [];
      return shHead('Đang tư vấn', 'Tự điền mẫu và size vào tin nhắn') + '<div class="shb"><h3 class="h2" style="margin-top:0">Mẫu</h3><div class="chips wrapc">' + candidates().slice(0, 8).map(function (id) { return '<button class="chip" data-act="ctxitem" data-v="' + id + '" aria-pressed="' + (id === pid) + '">' + esc(pname(PM[id], 'vi')) + '</button>'; }).join('') + '<button class="chip ghost" data-act="ctxpick">Chọn…</button></div>' +
        (pid ? '<h3 class="h2">Size</h3><div class="chips wrapc">' + sizes.map(function (z) { return '<button class="chip" data-act="ctxsize" data-v="' + z + '" aria-pressed="' + (z === c.size) + '">' + z + '</button>'; }).join('') + '</div>' : '') + '</div>' +
        '<div class="shf"><button class="btn sec2" data-act="ctxclear2">Xoá</button><button class="btn main" data-act="shclose">Xong</button></div>';
    }
  });
}

/* ----- fallback (manual copy) ----- */
function openFallback(text) {
  var s = pushSheet({ kind: 'fb', det: 'm', render: function () { return shHead('Chép tay', 'Chạm giữ đoạn văn để chọn và chép') + '<div class="shb"><div class="paper sel" id="fbtxt">' + esc(text) + '</div></div>'; } });
  setTimeout(function () { var el = s.el.querySelector('#fbtxt'); if (el) { var r = document.createRange(); r.selectNodeContents(el); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } }, 50);
}

/* ---------- long-press menu ---------- */
var menuEl = $('#menu'), suppress = 0;
function closeMenu() {
  if (!menuEl.classList.contains('on')) return;
  menuEl.classList.remove('in'); setTimeout(function () { menuEl.classList.remove('on'); menuEl.innerHTML = ''; }, 200);
  $$('.row.lifted').forEach(function (r) { r.classList.remove('lifted'); });
}
function openMenu(key, row) {
  var rect = row.getBoundingClientRect(), isP = key.charAt(0) === 'p', id = key.slice(2), items = [];
  if (isP) {
    var p = PM[id], fav = st.favs.indexOf(id) > -1, ol = other(lang);
    items = [['Chép thông tin', 'copy', 'm-desc'], ['Chép bảng size', 'ruler', 'm-size'], ['Chép kèm lời chào', 'bubble', 'm-greet'], [ol === 'en' ? 'Chép bản English' : 'Chép bản Tiếng Việt', 'globe', 'm-lang'], ['Thêm vào đơn', 'bag', 'm-add', 1], [fav ? 'Bỏ yêu thích' : 'Yêu thích', 'heart', 'm-fav'], ['Sửa nội dung', 'pencil', 'm-edit']];
  } else {
    var e = FM[id], et = entryText(e, other(lang));
    items = [['Chép bản ' + (other(lang) === 'en' ? 'English' : 'Tiếng Việt'), 'globe', 'm-lang']].filter(function () { return !et.empty && !et.fell && e.id !== 'order-recap'; }).concat([['Mở', 'search', 'm-open'], ['Sửa nội dung', 'pencil', 'm-edit']]);
  }
  var html = '<div class="mdim" data-act="mclose"></div><div class="mprev" style="left:' + rect.left + 'px;top:' + rect.top + 'px;width:' + rect.width + 'px;height:' + rect.height + 'px">' + row.outerHTML + '</div>';
  var below = innerHeight - rect.bottom, mh = items.length * 44 + 8, top = below > mh + 24 ? rect.bottom + 8 : Math.max(8, rect.top - mh - 8);
  var left = Math.min(Math.max(12, rect.left + 16), innerWidth - 262);
  html += '<div class="mpanel" role="menu" style="left:' + left + 'px;top:' + top + 'px;transform-origin:' + (top > rect.top ? 'top' : 'bottom') + ' left" data-k="' + key + '">' + items.map(function (it) {
    return '<button class="mi' + (it[3] ? ' dv' : '') + '" role="menuitem" data-act="mi" data-m="' + it[2] + '"><span>' + it[0] + '</span>' + ic(it[1]) + '</button>';
  }).join('') + '</div>';
  menuEl.innerHTML = html; menuEl.classList.add('on');
  var pv_ = menuEl.querySelector('.mprev .row'); if (pv_) pv_.style.cssText += ';min-height:' + rect.height + 'px';
  requestAnimationFrame(function () { menuEl.classList.add('in'); });
  hap(); suppress = Date.now() + 700;
}
function menuAct(m, key) {
  var id = key.slice(2), isP = key.charAt(0) === 'p';
  if (m === 'm-add') { var panel = $('.mpanel', menuEl), row = $('[data-m=m-add]', menuEl); row.outerHTML = '<div class="mi"><div class="chips">' + psizes(PM[id]).map(function (z) { return '<button class="chip" data-act="mi" data-m="m-addsz" data-v="' + z + '">' + z + '</button>'; }).join('') + '</div></div>'; return; }
  var q = menuEl.querySelector('.mpanel');
  if (m === 'm-addsz') { addLine(id, event_v); toast('Đã thêm ' + pname(PM[id], 'vi') + ' · ' + event_v + ' vào đơn'); closeMenu(); return; }
  closeMenu();
  if (isP) {
    if (m === 'm-desc') copyProduct(id, 'desc', null);
    else if (m === 'm-size') copyProduct(id, 'size', null);
    else if (m === 'm-greet') copyProduct(id, 'desc', null, true);
    else if (m === 'm-lang') copyProduct(id, 'desc', null, false, other(lang));
    else if (m === 'm-fav') toggleFav(id);
    else if (m === 'm-edit') openSettings(['main', 'list:p', 'edit:p:' + id]);
  } else {
    if (m === 'm-lang') copyEntry(id, null, other(lang));
    else if (m === 'm-open') openMessage(id);
    else if (m === 'm-edit') openSettings(['main', 'list:f', 'edit:f:' + id]);
  }
}
var event_v = '';
function toggleFav(id) {
  var i = st.favs.indexOf(id); if (i > -1) st.favs.splice(i, 1); else st.favs.unshift(id);
  save(); renderMau();
  var s = topS('product'); if (s) rerender(s);
  toast(i > -1 ? 'Đã bỏ yêu thích' : 'Đã thêm vào Yêu thích');
}

/* long-press + press state */
(function () {
  var timer, sx, sy, row, pressRow, pressT;
  document.addEventListener('pointerdown', function (e) {
    var r = e.target.closest('.row,.tile');
    clearTimeout(pressT);
    if (r && !e.target.closest('button')) { pressRow = r; pressT = setTimeout(function () { if (pressRow) pressRow.classList.add('press'); }, 70); }
    var m = e.target.closest('[data-menu]');
    if (!m || e.target.closest('.sheet,#menu')) return;
    sx = e.clientX; sy = e.clientY; row = m;
    clearTimeout(timer);
    timer = setTimeout(function () { clearTimeout(pressT); if (pressRow) pressRow.classList.remove('press'); openMenu(row.getAttribute('data-menu'), row); }, 450);
  }, { passive: true });
  document.addEventListener('pointermove', function (e) {
    if (timer && (Math.abs(e.clientX - sx) > 8 || Math.abs(e.clientY - sy) > 8)) { clearTimeout(timer); timer = 0; }
    if (pressRow && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) { clearTimeout(pressT); pressRow.classList.remove('press'); pressRow = null; }
  }, { passive: true });
  function up() { clearTimeout(timer); clearTimeout(pressT); timer = 0; if (pressRow) { pressRow.classList.remove('press'); pressRow = null; } }
  document.addEventListener('pointerup', up, { passive: true });
  document.addEventListener('pointercancel', up, { passive: true });
  document.addEventListener('touchstart', function () { }, { passive: true });
  document.addEventListener('contextmenu', function (e) { if (e.target.closest('[data-menu],.tile')) e.preventDefault(); });
})();


/* swipe actions (spec 5.14): product rows reveal Size / Đơn, order lines reveal Xoá */
var swOpen = null;
function closeSw() { if (!swOpen) return; var r = swOpen; swOpen = null; r.classList.add('swanim'); r.style.setProperty('--sx', '0px'); setTimeout(function () { r.classList.remove('swd', 'swanim'); }, 280); }
(function () {
  var g = null;
  document.addEventListener('pointerdown', function (e) {
    var r = e.target.closest('.row[data-menu^="p:"],.lrow');
    if (swOpen && swOpen !== r && !e.target.closest('.swact')) closeSw();
    if (!r || e.target.closest('.lexp,.swact') || e.pointerType === 'mouse' && e.button) return;
    g = { r: r, x0: e.clientX, y0: e.clientY, W: r.classList.contains('lrow') ? 80 : 144, base: swOpen === r ? -(r.classList.contains('lrow') ? 80 : 144) : 0, lock: 0, x: 0, t: performance.now(), pid: e.pointerId };
  }, { passive: true });
  document.addEventListener('pointermove', function (e) {
    if (!g || e.pointerId !== g.pid) return;
    var dx = e.clientX - g.x0, dy = e.clientY - g.y0;
    if (!g.lock) {
      if (Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy) * 1.2) { g.lock = 1; g.r.classList.add('swd'); g.r.classList.remove('swanim'); try { g.r.setPointerCapture(e.pointerId); } catch (x) { /* ignore */ } if (swOpen && swOpen !== g.r) closeSw(); }
      else if (Math.abs(dy) > 10) g = null;
      return;
    }
    g.x = Math.max(-g.W * 1.08, Math.min(0, g.base + dx)); g.r.style.setProperty('--sx', g.x + 'px');
    g.v = (e.clientX - (g.lx != null ? g.lx : g.x0)) / Math.max(1, e.timeStamp - (g.lt || g.t)); g.lx = e.clientX; g.lt = e.timeStamp;
  }, { passive: true });
  function end() {
    if (!g) return; var o = g; g = null;
    if (!o.lock) return;
    suppress = Date.now() + 400;
    var open = o.x < -o.W / 2 || (o.v || 0) < -0.5;
    o.r.classList.add('swanim'); o.r.style.setProperty('--sx', (open ? -o.W : 0) + 'px');
    if (open) swOpen = o.r; else { if (swOpen === o.r) swOpen = null; setTimeout(function () { o.r.classList.remove('swd', 'swanim'); }, 280); }
  }
  document.addEventListener('pointerup', end, { passive: true }); document.addEventListener('pointercancel', end, { passive: true });
})();

/* ---------- copy entry ---------- */
function copyEntry(id, btn, forceLang, force) {
  var e = FM[id], l = forceLang || lang;
  if (isPh(e)) { editEntry(id); return; }   /* placeholder sets are never copyable */
  if (id === 'open-first' || id === 'open-returning') { copyGreeting(id, btn, undefined, l, force); return; }
  var et = entryText(e, l);
  if (et.empty) { toast('Nhớ gửi đính kèm', { sub: e.attach || eLabel(e), icon: 'clip' }); return; }
  if (et.fell) { openMessage(id); return; }   /* missing language: blocking choice instead of a silent fallback */
  var r = resolve(et.text, l, {}, false);
  if (r.missing.length) { openMessage(id); return; }
  var tr = !force && truncIn(et.text, l, {});
  if (tr) { truncBox(tr.p, tr.ws, function () { copyEntry(id, liveBtn(btn), forceLang, true); }); return; }
  copy(r.text, { btn: btn, label: eLabel(e), lang: l, rec: { k: 'f:' + id, label: eLabel(e), ref: { t: 'f', id: id } } });
}

/* ---------- dialogs ---------- */
function dlgBox(msg, buttons) {
  var d = document.createElement('div'); d.className = 'dlg'; d.setAttribute('role', 'alertdialog');
  d.innerHTML = '<div><p>' + esc(msg) + '</p><div class="bs">' + buttons.map(function (b, i) { return '<button class="' + (b[2] || '') + '" data-act="dbtn" data-i="' + i + '">' + esc(b[0]) + '</button>'; }).join('') + '</div></div>';
  d._fns = buttons.map(function (b) { return b[1]; }); $('#app').parentNode.appendChild(d);
}
function confirmBox(msg, okLabel, fn) { dlgBox(msg, [[okLabel, fn, 'dest'], ['Huỷ', null, '']]); }

/* ---------- settings sheet ---------- */
var CHIPTOK = ['{{item}}', '{{size}}', '{{itemInfo}}', '{{sizeChart}}', '{{sizeA}}', '{{sizeB}}'];
function openSettings(path) {
  pushSheet({
    kind: 'settings', det: 'l', fixed: true, state: { path: path || ['main'] },
    render: function (s) { return settingsPage(s); }
  });
}
function sNav(s, title, back) {
  return '<div class="drag"><i class="grab"></i><div class="sbar" style="position:relative">' + (back ? '<button class="txtbtn" data-act="sback" style="display:flex;align-items:center;gap:2px;padding-left:0">' + ic('back', 's20') + 'Quay lại</button>' : '<span style="width:44px"></span>') + '<span class="tt" style="pointer-events:none">' + esc(title) + '</span><button class="txtbtn" data-act="shclose" style="font-weight:600">Xong</button></div></div>';
}
function srow(act, data, label, val, chev) { return '<button class="srw" data-act="' + act + '" ' + data + '><span class="l">' + label + '</span>' + (val != null ? '<span class="v">' + esc(val) + '</span>' : '') + (chev === false ? '' : ic('chev', 's13')) + '</button>'; }
function field(label, id, f, val, kind, tokens) {
  var isTa = kind === 'ta';
  return '<h3 class="h2">' + esc(label) + '</h3>' + (isTa ? '<textarea class="fld sel" data-ov="' + id + '" data-f="' + f + '" aria-label="' + esc(label) + '" rows="5">' + esc(val) + '</textarea>' + (tokens ? '<div class="chips" style="padding:0;margin-top:8px">' + CHIPTOK.map(function (t) { return '<button class="chip" data-act="ins" data-t="' + t + '" style="height:32px;font-weight:500;font-size:13px">' + t + '</button>'; }).join('') + '</div>' : '') :
    '<input class="fld sel" data-ov="' + id + '" data-f="' + f + '" ' + (kind === 'num' ? 'inputmode="numeric"' : '') + ' value="' + esc(val) + '" aria-label="' + esc(label) + '">');
}
function settingsPage(s) {
  var path = s.state.path, pg = path[path.length - 1], back = path.length > 1, h = '', body = '';
  var parts = pg.split(':');
  if (pg === 'main') {
    body = '<h3 class="h2" style="margin-top:8px">Ngôn ngữ mặc định</h3>' + segHtml([['vi', 'Tiếng Việt'], ['en', 'English']], st.set.lang, 'setlang', 'full') + '<p class="foot">Mỗi lần mở app sẽ bắt đầu bằng ngôn ngữ này.</p>' +
      '<h3 class="h2">Đơn hàng</h3><div class="slist">' + srow('spage', 'data-p="ship"', 'Phí ship', money(st.set.fee, 'vi')) + srow('spage', 'data-p="bank"', 'Chuyển khoản', st.set.bank.no ? st.set.bank.no : 'Chưa có') + '</div>' +
      '<h3 class="h2">Nội dung</h3><div class="slist">' + srow('spage', 'data-p="list:p"', 'Mẫu', PL.length) + srow('spage', 'data-p="list:s"', 'Set', 3) + srow('spage', 'data-p="list:f"', 'Kịch bản', FL.filter(function (e) { return e.n !== 5; }).length) + srow('spage', 'data-p="ord"', 'Mẫu tóm tắt đơn') + '</div>' +
      '<h3 class="h2">Yêu thích &amp; Gần đây</h3><div class="slist">' + srow('clrrec', '', 'Xoá danh sách Gần đây', null, false).replace('class="srw"', 'class="srw acc"') + '</div>' +
      '<h3 class="h2">Dữ liệu</h3><div class="slist">' + srow('export', '', 'Xuất bản sao lưu (.json)', null, false) + srow('import', '', 'Nhập bản sao lưu', null, false) + srow('resetall', '', 'Khôi phục nội dung gốc', null, false).replace('class="srw"', 'class="srw dest"') + '</div>' +
      '<p class="foot" style="text-align:center;margin-top:24px">Soft Embrace · 1.0<br>Làm bằng sự dịu dàng.</p>';
    return sNav(s, 'Cài đặt', false) + '<div class="shb" style="padding-bottom:calc(var(--safe-bottom) + 24px)">' + body + '</div>';
  }
  if (pg === 'ship') body = field('Phí ship (đ)', '__set', 'fee', st.set.fee, 'num') + '<p class="foot">Dùng khi chọn mức phí cố định ở tab Đơn.</p>';
  else if (pg === 'bank') body = field('Ngân hàng', '__bank', 'name', st.set.bank.name) + field('Số tài khoản', '__bank', 'no', st.set.bank.no, 'num') + field('Chủ tài khoản', '__bank', 'holder', st.set.bank.holder) + '<p class="foot">Được thêm cuối tin nhắn chốt đơn khi bật “Kèm thông tin chuyển khoản”.</p>';
  else if (pg === 'ord') {
    var o = st.ov.__ord || {};
    body = field('Tóm tắt đơn · VI', '__ord', 'vi', o.vi !== undefined ? o.vi : SEED.orderTemplate.vi, 'ta') + field('Order recap · EN', '__ord', 'en', o.en !== undefined ? o.en : normEn(SEED.orderTemplate.en), 'ta') + '<p class="foot">Dùng {{orderLines}} và {{total}}. Dòng “• Shipping…” được thay theo mức phí đã chọn.</p><button class="txtbtn" data-act="resetitem" data-id="__ord">Khôi phục bản gốc</button>';
  } else if (parts[0] === 'list') {
    var list = parts[1] === 'p' ? PL.map(function (p) { return srow('spage', 'data-p="edit:p:' + p.id + '"', esc(pv(p, 'emoji') + ' ' + pname(p, 'vi')), p.truncated ? 'Cần kiểm tra' : null); }) :
      FL.filter(function (e) { return parts[1] === 's' ? e.n === 5 : e.n !== 5; }).map(function (e) { return srow('spage', 'data-p="edit:f:' + e.id + '"', esc(eLabel(e)), isPh(e) ? 'Chưa xác nhận' : st.ov[e.id] ? 'Đã sửa' : null); });
    body = '<div class="slist" style="margin-top:8px">' + list.join('') + '</div>';
  } else if (parts[0] === 'edit') {
    if (parts[1] === 'p') {
      var p = PM[parts[2]];
      body = field('Tên', p.id, 'name', pv(p, 'name')) + field('Emoji', p.id, 'emoji', pv(p, 'emoji')) + field('Giá (đ)', p.id, 'price', pv(p, 'price'), 'num') + field('Size (cách nhau dấu phẩy)', p.id, 'sizes', psizes(p).join(', ')) +
        field('Thông tin · VI', p.id, 'descVi', pv(p, 'descVi'), 'ta') + field('Thông tin · EN', p.id, 'descEn', pv(p, 'descEn'), 'ta') + field('Bảng size · VI', p.id, 'sizeVi', pv(p, 'sizeVi'), 'ta') + field('Bảng size · EN', p.id, 'sizeEn', pv(p, 'sizeEn'), 'ta') + field('Ghi chú nội bộ (không chép)', p.id, 'noteVi', pv(p, 'noteVi') || '', 'ta') +
        (p.truncated ? '<p class="foot" style="color:var(--destructive)">Cần kiểm tra: ' + p.truncated.join(', ') + ' trong sheet bị cắt.</p>' : '') + '<button class="txtbtn" data-act="resetitem" data-id="' + p.id + '">Khôi phục bản gốc</button>';
    } else {
      var e2 = FM[parts[2]];
      body = (isPh(e2) ? '<div class="note" style="margin-top:8px">' + ic('warn', 's15') + '<span>' + STR.ph + '</span></div>' : '') + field('Tên hiển thị', e2.id, 'labelVi', pv(e2, 'labelVi')) + field('Tin nhắn · VI', e2.id, 'vi', pv(e2, 'vi'), 'ta', 1) + field('Tin nhắn · EN', e2.id, 'en', pv(e2, 'en'), 'ta', 1) +
        '<p class="foot">Chèn {{item}}, {{size}}… để app tự điền. Để trống = chỉ nhắc đính kèm.</p><button class="txtbtn" data-act="resetitem" data-id="' + e2.id + '">Khôi phục bản gốc</button>';
    }
  }
  var titles = { ship: 'Phí ship', bank: 'Chuyển khoản', ord: 'Tóm tắt đơn' }, title = titles[pg] || (parts[0] === 'list' ? { p: 'Mẫu', s: 'Set', f: 'Kịch bản' }[parts[1]] : (parts[1] === 'p' ? short(pname(PM[parts[2]], 'vi')) : short(eLabel(FM[parts[2]]))));
  return sNav(s, title, true) + '<div class="shb" style="padding-bottom:calc(var(--safe-bottom) + 24px)">' + body + (parts[0] === 'edit' || pg === 'ord' || pg === 'bank' || pg === 'ship' ? '<p class="saved" id="saved" style="text-align:right">Đã lưu</p>' : '') + '</div>';
}
function settingsGo(s, path, dir) {
  s.state.path = path; var old = s.el.firstElementChild;
  s.el.innerHTML = settingsPage(s);
  if (!reduce && s.el.animate) s.el.animate([{ opacity: 0, transform: 'translateX(' + (dir > 0 ? 30 : -30) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.32,.72,0,1)' });
  s.el.style.transform = 'translateY(0px)';
}
var saveFlash, ovT;
function onOvInput(el) {
  var id = el.dataset.ov, f = el.dataset.f, v = el.value;
  if (id === '__set') { st.set.fee = parseInt(v.replace(/\D/g, ''), 10) || 0; }
  else if (id === '__bank') st.set.bank[f] = v;
  else {
    if (f === 'price') v = parseInt(v.replace(/\D/g, ''), 10) || 0;
    else if (f === 'sizes') v = v.split(/[,\s]+/).map(function (x) { return x.trim().toUpperCase(); }).filter(Boolean);
    st.ov[id] = st.ov[id] || {}; st.ov[id][f] = v;
  }
  save(); clearTimeout(ovT);
  ovT = setTimeout(function () {
    IDX = null; renderMau(); refreshTab('flow'); refreshTab('order');
    var sv = $('#saved'); if (sv) { sv.classList.add('on'); clearTimeout(saveFlash); saveFlash = setTimeout(function () { sv.classList.remove('on'); }, 1200); }
  }, 400);
}

/* ---------- search ---------- */
var IDX = null, expanded = {};
function buildIndex() {
  IDX = [];
  PL.forEach(function (p) { IDX.push({ k: 'p', id: p.id, name: norm(pname(p, 'vi') + ' ' + pname(p, 'en')), title: norm(colorOf(p)), text: norm(ptext(p, 'desc', 'vi') + ' ' + ptext(p, 'desc', 'en')) }); });
  FL.forEach(function (e) { IDX.push({ k: 'f', id: e.id, name: norm(eLabel(e)), title: norm(pv(e, 'titleVi') || ''), text: norm((pv(e, 'vi') || '') + ' ' + (pv(e, 'en') || '')) }); });
}
function enterSearch() {
  if (!IDX) buildIndex();
  document.body.classList.add('searching');
  var q = $('#q'); q.focus({ preventScroll: true }); doSearch();
}
function exitSearch() { document.body.classList.remove('searching'); var q = $('#q'); q.blur(); window.scrollTo(0, 0); q.value = ''; lastRaw = null; expanded = {}; $('#dock').style.setProperty('--kb', '0px'); $('#search').style.setProperty('--kb', '0px'); }
var lastRaw = null;
function doSearch(soft) {
  var raw = $('#q').value, q = norm(raw.trim()), box = $('#search'), h = '<h1 class="lt">Tìm kiếm</h1>';
  if (soft && raw === lastRaw) return;   /* IME composition fires several input events for one visible state */
  lastRaw = raw;
  if (!q) {
    if (!st.recents.length) h += '<div class="empty">' + ic('clock', 's34') + '<div class="tt">Tìm gì cũng nhanh</div><p>Tìm theo tên mẫu, kịch bản, hay từ trong tin nhắn.</p></div>';
    else h += sec('Gần đây', '<div class="grp">' + st.recents.map(function (r, i) { return '<div class="row plain srow"><span class="rtxt"><span class="t">' + esc(r.label) + (r.lang === 'en' ? ' · EN' : '') + '</span><span class="sub">' + (r.lang === 'en' ? 'English' : 'Tiếng Việt') + '</span></span>' + cbtn('rcopy', 'data-i="' + i + '"', 'Chép ' + r.label) + '</div>'; }).join('') + '</div>');
  } else {
    var hits = { p: [], f: [] };
    IDX.forEach(function (x) { if (x.k === 'f' && isPh(FM[x.id])) return; var r = x.name.indexOf(q) === 0 ? 0 : x.name.indexOf(q) > -1 ? 1 : x.title.indexOf(q) > -1 ? 2 : x.text.indexOf(q) > -1 ? 3 : -1; if (r > -1) hits[x.k].push([r, x]); });
    var groups = [['p', 'Mẫu', function (x) { return pRow(PM[x.id]); }], ['f', 'Kịch bản', function (x) { return fRow(FM[x.id]); }]], any = false;
    groups.forEach(function (g) {
      var a = hits[g[0]].sort(function (x, y) { return x[0] - y[0]; }); if (!a.length) return; any = true;
      var shown = expanded[g[0]] ? a : a.slice(0, 5);
      h += sec(g[1], '<div class="grp">' + shown.map(function (x) { return g[2](x[1]); }).join('') + '</div>' + (a.length > 5 && !expanded[g[0]] ? '<button class="txtbtn" data-act="more" data-g="' + g[0] + '" style="margin:4px calc(var(--margin) + 8px)">Xem tất cả ' + a.length + '</button>' : ''));
    });
    if (!any) h += '<div class="empty">' + ic('search', 's34') + '<div class="tt">Chưa tìm thấy “' + esc(raw.trim()) + '”</div><p>Thử một tên ngắn hơn nhé.</p></div>';
  }
  box.innerHTML = h;
}
(function () {
  var vv = window.visualViewport, dock = $('#dock'), box = $('#search'), t, pend = 0;
  if (!vv) return;
  function upd() {
    if (pend) return; pend = 1;
    requestAnimationFrame(function () {
      pend = 0;
      var kb = Math.max(0, innerHeight - vv.height - vv.offsetTop);
      dock.classList.add('kbm'); dock.style.setProperty('--kb', kb + 'px'); box.style.setProperty('--kb', kb + 'px');
      clearTimeout(t); t = setTimeout(function () { dock.classList.remove('kbm'); }, 120);
    });
  }
  vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd);
})();
var sq = 0;
function queueSearch() { if (!sq) sq = requestAnimationFrame(function () { sq = 0; doSearch(true); }); }
$('#q').addEventListener('input', queueSearch);
$('#q').addEventListener('compositionend', queueSearch);
$('#search').addEventListener('touchstart', function () { }, { passive: true });
var sy0 = 0;
$('#search').addEventListener('touchmove', function (e) { if (document.activeElement === $('#q') && Math.abs(e.touches[0].clientY - (sy0 || e.touches[0].clientY)) > 10) $('#q').blur(); }, { passive: true });
$('#search').addEventListener('touchstart', function (e) { sy0 = e.touches[0].clientY; }, { passive: true });

/* ---------- main click delegation ---------- */
document.addEventListener('click', function (e) {
  if (Date.now() < suppress && !e.target.closest('#menu')) { e.preventDefault(); return; }
  var t = e.target.closest('[data-act],[data-open]'); if (!t) return;
  var a = t.getAttribute('data-act'), id = t.getAttribute('data-id'), v = t.getAttribute('data-v');
  if (!a && t.hasAttribute('data-open')) { var o = t.getAttribute('data-open'); if (o.charAt(0) === 'p') openProduct(o.slice(2)); else { var en = FM[o.slice(2)]; if (isPh(en)) editEntry(en.id); else if (en.id === 'order-recap') { closeAllSheets(); exitIfSearch(); go('order'); } else openMessage(en.id); } return; }
  var s = topS();
  switch (a) {
    case 'tab': go(v); break;
    case 'lang': setLang(v); break;
    case 'search': enterSearch(); break;
    case 'sx': exitSearch(); break;
    case 'qclear': $('#q').value = ''; $('#q').focus(); doSearch(); break;
    case 'more': expanded[t.dataset.g] = 1; lastRaw = null; doSearch(); break;
    case 'settings': openSettings(); break;
    case 'cp': e.stopPropagation(); copyProduct(id, 'desc', t); break;
    case 'cf': e.stopPropagation(); copyEntry(id, t); break;
    case 'greet': e.stopPropagation(); copyEntry(id, t.matches('.cbtn') ? t : t.querySelector('.cbtn')); break;
    case 'gadd': openPicker('pick', function (pid) { setCtx(pid, null); }); break;
    case 'editf': e.stopPropagation(); editEntry(id); break;
    case 'editp': editProduct(id); break;
    case 'bankset': openSettings(['main', 'bank']); break;
    case 'swsize': closeSw(); copyProduct(id, 'size', null); break;
    case 'swadd': { var swr = t.closest('.row'); closeSw(); openMenu('p:' + id, swr); menuAct('m-add', 'p:' + id); break; }
    case 'att': e.stopPropagation(); var ee = FM[id]; toast('Nhớ gửi đính kèm', { sub: ee.attach || eLabel(ee), icon: 'clip' }); break;
    case 'rcopy': {
      var r = st.recents[+t.dataset.i], rf = r && r.ref; if (!rf) break;
      if (rf.t === 'p') copyProduct(rf.id, rf.w, t, false, r.lang);
      else if (rf.t === 'g') copyGreeting(rf.id, t, rf.pid || null, r.lang);
      else copyEntry(rf.id, t, r.lang);
      break;
    }
    case 'shclose': closeTop(); break;
    case 'shdim': closeTop(); break;
    case 'mclose': closeMenu(); break;
    case 'mi': event_v = v || ''; menuAct(t.dataset.m, $('.mpanel', menuEl).dataset.k); break;
    case 'pview': s.state.view = v; rerender(s); break;
    case 'pcopy': copyProduct(id, t.dataset.w, t); break;
    case 'fav': toggleFav(id); break;
    case 'addline': addLine(id, v); toast('Đã thêm ' + pname(PM[id], 'vi') + ' · ' + v + ' vào đơn'); break;
    case 'fill': {
      s.state.fills[t.dataset.k] = v;
      if (t.dataset.k === 'item') { setCtxQuiet(v, ctx() && ctx().itemId === v ? ctx().size : null); var sz = psizes(PM[v]); if (s.state.fills.size && sz.indexOf(s.state.fills.size) < 0) delete s.state.fills.size; }
      else if (t.dataset.k === 'size') { setCtxQuiet(ctx() ? ctx().itemId : null, v); }
      rerender(s); break;
    }
    case 'pickfill': {
      var k = t.dataset.k, ms = s;
      openPicker('pick', function (pid) { ms.state.fills[k] = pid; if (k === 'item') setCtxQuiet(pid, ctx() && ctx().itemId === pid ? ctx().size : null); rerender(ms); });
      break;
    }
    case 'pickone': { var cb = s.state.cb; closeSheet(s); cb(id); break; }
    case 'pickadd': addLine(id, v); toast('Đã thêm ' + pname(PM[id], 'vi') + ' · ' + v + ' vào đơn'); t.classList.add('sealed'); setTimeout(function () { closeSheet(s); }, 250); break;
    case 'tok': { var row = s.el.querySelector('[data-k="' + t.dataset.k + '"]:not(.tok)') || s.el.querySelector('[data-fill="' + t.dataset.k + '"]'); var fr = (row || t).closest('.frow'); if (fr) { fr.scrollIntoView({ block: 'nearest' }); if (!reduce && fr.animate) fr.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 240 }); var inp = fr.querySelector('input'); if (inp) inp.focus(); } break; }
    case 'msgcopy': msgCopy(s, t, false); break;
    case 'ctxedit': openCtxEdit(); break;
    case 'ctxclear': clearCtx(); break;
    case 'ctxclear2': clearCtx(); rerender(s); break;
    case 'ctxitem': setCtx(v, ctx() && ctx().itemId === v ? undefined : null); rerender(s); break;
    case 'ctxsize': setCtx(null, v); rerender(s); break;
    case 'ctxpick': { var cs = s; openPicker('pick', function (pid) { setCtx(pid, null); rerender(cs); }); break; }
    case 'sugg': { var c = ctx(); addLine(c.itemId, c.size); toast('Đã thêm ' + pname(PM[c.itemId], 'vi') + ' · ' + c.size + ' vào đơn'); break; }
    case 'addpick': openPicker('order'); break;
    case 'lineopen': if (e.target.closest('.lexp')) { if (!e.target.closest('[data-act=linesize],[data-act=qty],[data-act=linedel]')) break; } if (!e.target.closest('[data-act=linesize],[data-act=qty],[data-act=linedel]')) { ordUI.open = ordUI.open === +t.dataset.i ? -1 : +t.dataset.i; renderOrder(); } break;
    case 'linesize': { var L = st.draft.lines[+t.dataset.i], dup = st.draft.lines.find(function (x, j) { return j !== +t.dataset.i && x.pid === L.pid && x.size === v; }); if (dup) { dup.qty = Math.min(9, dup.qty + L.qty); st.draft.lines.splice(+t.dataset.i, 1); ordUI.open = -1; } else L.size = v; save(); renderOrder(); e.stopPropagation(); break; }
    case 'qty': { var L2 = st.draft.lines[+t.dataset.i]; L2.qty = Math.max(1, Math.min(9, L2.qty + (+t.dataset.d))); save(); renderOrder(); e.stopPropagation(); break; }
    case 'linedel': { var i2 = +t.dataset.i, snap = JSON.stringify(st.draft); var nm = PM[st.draft.lines[i2].pid]; st.draft.lines.splice(i2, 1); ordUI.open = -1; save(); renderOrder(); toast('Đã xoá ' + pname(nm, 'vi'), { undo: function () { st.draft = JSON.parse(snap); save(); renderOrder(); } }); e.stopPropagation(); break; }
    case 'ship': st.draft.ship = v; save(); renderOrder(); break;
    case 'pasteinfo': try { navigator.clipboard.readText().then(function (x) { st.draft.info = x; save(); renderOrder(); }, function () { var ta = $('[data-in=info]'); if (ta) ta.focus(); }); } catch (x) { var ta2 = $('[data-in=info]'); if (ta2) ta2.focus(); } break;
    case 'prevtoggle': ordUI.prev = !ordUI.prev; renderOrder(); break;
    case 'copyorder': {
      if (!st.draft.lines.length) break;
      var txt = orderText(lang), total = calc().total;
      /* not recorded in Gần đây (a stale order must never be one tap from the next customer); the thank-you card appears on the next visit, never under the reader */
      copy(txt, { btn: t, msg: 'Đã chép đơn · ' + money(total, lang) + ' · ' + lang.toUpperCase(), sub: 'Nhớ gửi mã QR nhé', icon: 'clip', label: 'Đơn', lang: lang, done: function (ok) { if (ok) { st.draft.copiedAt = Date.now(); save(); dirty.order = true; } } });
      break;
    }
    case 'thank': { var tid = st.draft.lines.some(function (L3) { return PM[L3.pid] && PM[L3.pid].madeToOrder; }) ? 'thanks-custom' : 'thanks-rtw'; copyEntry(tid, t); break; }
    case 'neworder': { var sn = JSON.stringify(st.draft); st.draft = { lines: [], ship: 'courier', custom: 0, info: '', bank: true, copiedAt: 0 }; ordUI.open = -1; save(); renderOrder(); toast('Đã làm mới đơn', { undo: function () { st.draft = JSON.parse(sn); save(); renderOrder(); } }); break; }
    case 'undo': if (toast.undoFn) { toast.undoFn(); toast.undoFn = null; $('.toast', toastEl) && $('.toast', toastEl).remove(); } break;
    case 'spage': settingsGo(s, s.state.path.concat([t.dataset.p]), 1); break;
    case 'sback': settingsGo(s, s.state.path.slice(0, -1), -1); break;
    case 'setlang': st.set.lang = v; save(); rerender(s); break;
    case 'ins': { var ta = s.state.lastTa; if (ta) { ta.setRangeText(t.dataset.t, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus(); } break; }
    case 'resetitem': delete st.ov[id]; save(); IDX = null; settingsGo(s, s.state.path, 0); renderMau(); refreshTab('flow'); refreshTab('order'); toast('Đã khôi phục bản gốc'); break;
    case 'clrrec': st.recents = []; save(); renderRecents(); toast('Đã xoá danh sách Gần đây'); break;
    case 'resetall': confirmBox('Khôi phục toàn bộ nội dung gốc? Các chỉnh sửa của bạn sẽ mất.', 'Khôi phục', function () { st.ov = {}; save(); IDX = null; renderMau(); refreshTab('flow'); refreshTab('order'); toast('Nội dung gốc đã được khôi phục'); }); break;
    case 'export': {
      var blob = new Blob([JSON.stringify({ v: 1, ov: st.ov, favs: st.favs, set: st.set }, null, 1)], { type: 'application/json' }), a2 = document.createElement('a');
      a2.href = URL.createObjectURL(blob); a2.download = 'softembrace-backup.json'; document.body.appendChild(a2); a2.click(); a2.remove(); setTimeout(function () { URL.revokeObjectURL(a2.href); }, 2000); break;
    }
    case 'import': $('#imp').click(); break;
    case 'dbtn': { var dd = t.closest('.dlg'), fn = dd._fns[+t.dataset.i]; dd.remove(); if (fn) fn(); break; }
  }
});
function msgCopy(s, t, force) {
  var ent = FM[s.state.id];
  if (isPh(ent)) { editEntry(ent.id); return; }
  var et = entryText(ent, lang), rr = resolve(et.text, lang, s.state.fills, false);
  if (rr.missing.length) return;
  var tr = !force && truncIn(et.text, lang, s.state.fills);
  if (tr) { truncBox(tr.p, tr.ws, function () { msgCopy(s, t, true); }); return; }
  var cl = et.fell ? other(lang) : lang;
  copy(rr.text, { btn: t, label: eLabel(ent), lang: cl, rec: { k: 'f:' + ent.id, label: eLabel(ent), ref: { t: 'f', id: ent.id } }, done: function (ok) { if (ok) setTimeout(function () { closeSheet(s, true); }, 600); } });
}
function closeAllSheets() { SH.slice().forEach(closeSheet); }
function exitIfSearch() { if (document.body.classList.contains('searching')) exitSearch(); }
$('#imp').addEventListener('change', function (e) {
  var f = e.target.files[0]; if (!f) return;
  var rd = new FileReader();
  rd.onload = function () {
    try {
      var j = JSON.parse(rd.result); if (!j || typeof j.ov !== 'object') throw 0;
      confirmBox('Thay nội dung hiện tại bằng bản sao lưu?', 'Thay thế', function () { st.ov = j.ov; st.favs = j.favs || []; if (j.set) st.set = Object.assign(st.set, j.set); save(); IDX = null; renderMau(); refreshTab('flow'); refreshTab('order'); toast('Đã nhập bản sao lưu'); });
    } catch (x) { toast('File sao lưu không hợp lệ', { bad: true }); }
  };
  rd.readAsText(f); e.target.value = '';
});
/* inputs (delegated) */
document.addEventListener('input', function (e) {
  var t = e.target, s = topS();
  if (t.matches('[data-fill]') && s) { s.state.fills[t.dataset.fill] = t.value; refreshMsg(s); }
  else if (t.matches('[data-pq]') && s) { s.state.q = t.value; $('#plist', s.el).innerHTML = pickerList(s); }
  else if (t.matches('[data-ov]')) onOvInput(t);
  else if (t.matches('[data-in=info]')) { st.draft.info = t.value; save(); var pr = $('#ordprev'); if (pr) pr.textContent = orderText(lang); }
  else if (t.matches('[data-in=custom]')) { st.draft.custom = parseInt(t.value.replace(/\D/g, ''), 10) || 0; t.value = st.draft.custom ? nfV.format(st.draft.custom) : ''; save(); softTotals(); }
});
document.addEventListener('change', function (e) {
  var t = e.target;
  if (t.matches('[data-in=bank]')) { st.draft.bank = t.checked; save(); var pr = $('#ordprev'); if (pr) pr.textContent = orderText(lang); }
});
document.addEventListener('focusin', function (e) { var s = topS('settings'); if (s && e.target.matches('textarea')) s.state.lastTa = e.target; });
function softTotals() { var c = calc(); var tv = $('#totbar .tv'); if (tv) tv.textContent = money(c.total, lang); }
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('[data-fill],[data-pq],#q,[data-in=custom]')) e.target.blur(); });

/* ---------- boot ---------- */
renderMau();
go(tab, true);
$('#tabbar .loz').style.transition = 'none';
$('#tabbar .loz').style.transform = 'translateX(' + (TABS.indexOf(tab) * 100) + '%)';
$('#lang .th').style.transition = 'none';
syncLangNav();   /* the nav VI/EN control always shows the language the app will actually copy */
requestAnimationFrame(function () { $('#tabbar .loz').style.transition = ''; $('#lang .th').style.transition = ''; });
/* warm the other tabs one small idle task at a time, so no single long task follows first paint */
idle(function () { if (!tabsReady.flow) renderFlow(); idle(function () { if (!tabsReady.order) renderOrder(); idle(function () { if (!IDX) buildIndex(); idle(measureSafe); }); }); });
/* offline / instant Home Screen launch */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', function () {
    var had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(function () { /* no worker: the app still runs online */ });
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (had) toast('Có bản mới — đóng và mở lại app nhé', { icon: 'sparkle', ms: 4000 }); had = true; });
  });
}
window.__SE = { boot: performance.now() - T0, st: st, calc: calc, orderText: orderText, resolve: resolve };
})();
