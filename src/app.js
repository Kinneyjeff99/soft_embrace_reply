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
  tokl: { trackingCode: 'mã vận đơn', item: 'mẫu', size: 'size', sizeA: 'size 1', sizeB: 'size 2', otherItem: 'mẫu thay thế', fitStyle: 'kiểu dáng', imageLinks: 'link hình', orderLines: 'đơn hàng', total: 'tổng tiền' },
  fail: 'Chưa chép được. Chạm giữ đoạn văn để chép tay nhé.',
  acts: { info: 'Thông tin', size: 'Bảng size', both: 'Thông tin + bảng size' },
  lacts: { info: 'Thông tin', size: 'Bảng size', order: 'Đơn hàng', thanks: 'Lời cảm ơn' }
};
var SW = { 'noir-dotty-top': '#1E1B1A', 'ivory-dot-blouse': '#EFE7D6', 'ivory-dot-midi-skirt': '#EFE7D6', 'noir-midi-skirt': '#1E1B1A', 'shimmer-top': '#D9CBB5', 'lace-top': '#EDE3CF', 'embroidery-pants': '#F1ECE0', 'butter-top': '#F0DE9A' };

/* ---------- persistence (never required) ---------- */
var LS = 'se.v1';
function load() { try { return JSON.parse(localStorage.getItem(LS)) || {}; } catch (e) { return {}; } }
var st = load();
st.recents = st.recents || []; st.ov = st.ov || {};   /* st.favs from v1 is left untouched and ignored */
st.draft = Object.assign({ lines: [], ship: 'courier', custom: 0, info: '', bank: true, copiedAt: 0 }, st.draft || {});
st.set = Object.assign({ lang: 'vi', fee: 25000, bank: { name: '', no: '', holder: '' } }, st.set || {});
st.lead = Object.assign({ sel: {}, custom: [], edits: {}, hidden: [] }, st.lead || {});
st.sets = st.sets || [];
var saveT;
function save() { clearTimeout(saveT); saveT = setTimeout(flush, 300); }
function flush() { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (e) { /* storage blocked: stay in memory */ } }
document.addEventListener('visibilitychange', function () { if (document.hidden) { st.active = Date.now(); flush(); } else paintGreet(); });
addEventListener('pagehide', function () { st.active = Date.now(); flush(); });
var lang = st.set.lang === 'en' ? 'en' : 'vi';

/* ---------- data + pure composition ---------- */
var C = SECompose(SEED, st);
var PL = C.PL, PM = C.PM, FL = C.FL, FM = C.FM, pv = C.pv, clean = C.clean, other = C.other, money = C.money, nfV = C.nfV;
var colorOf = C.colorOf, pname = C.pname, psizes = C.psizes, ptext = C.ptext, ptrunc = C.ptrunc, entryText = C.entryText, calc = C.calc;
function afterPaint(fn) { requestAnimationFrame(function () { setTimeout(fn, 0); }); }
function idle(fn) { if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 600 }); else setTimeout(fn, 60); }
function ov(id) { return st.ov[id] || {}; }
function swatch(p) { return p.variant ? C.VAR[p.variant].hex : (SW[p.id] || ''); }
function eLabel(e) { return pv(e, 'labelVi') || e.id; }
function norm(s) { return String(s).normalize('NFD').replace(/\p{M}/gu, '').replace(/đ/gi, 'd').toLowerCase(); }
function ic(n, c) { return '<svg class="i ' + (c || '') + '" aria-hidden="true"><use href="#i-' + n + '"/></svg>'; }
function short(s, n) { n = n || 22; return s.length > n ? s.slice(0, n - 1) + '…' : s; }
function uid(p) { return p + Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }
function lu() { return lang.toUpperCase(); }
function SM(id) { return st.sets.filter(function (x) { return x.id === id; })[0]; }
/* greeting-only replies drop the product slot and the dangling colon */
function greetOnly(tpl) { return tpl.replace(/\s*for \{\{item\}\}/g, '').replace(/\{\{itemInfo\}\}/g, '').replace(/\{\{item\}\}/g, '').replace(/[:：]\s*$/, ''); }
var GREET = { 'open-first': 1, 'open-returning': 1 };
function mtext(e, l) { var et = entryText(e, l); if (GREET[e.id]) et.text = clean(greetOnly(et.text)); return et; }

/* ---------- context (the last product and size she handled pre-fill reply templates) ---------- */
function ctx() { var c = st.ctx; if (!c || Date.now() - c.at > 20 * 60000) return null; if (!c.itemId && !c.size) return null; return c; }
function setCtx(pid, size) {
  var c = ctx() || {};
  var n = { itemId: pid != null ? pid : c.itemId, size: size !== undefined ? size : c.size, at: Date.now() };
  if (pid != null && c.itemId !== pid && size === undefined) n.size = null;
  st.ctx = n; save();
}
function setCtxQuiet(pid, size) { st.ctx = { itemId: pid, size: size, at: Date.now() }; save(); }
function ctxLabel() { var c = ctx(); if (!c) return ''; var p = PM[c.itemId]; return [p ? pname(p, lang) : null, c.size].filter(Boolean).join(' · '); }

/* ---------- reply templates: placeholders ---------- */
function tkey(t) { return (t === 'itemInfo' || t === 'sizeChart') ? 'item' : t; }
function keysOf(tpl) { var ks = []; (tpl.match(/\{\{(\w+)\}\}/g) || []).forEach(function (m) { var k = tkey(m.slice(2, -2)); if (ks.indexOf(k) < 0) ks.push(k); }); return ks; }
function fillVal(k, fills) {
  if (fills[k] != null && fills[k] !== '') return fills[k];
  var c = ctx();
  if (k === 'item') return c && c.itemId ? c.itemId : null;
  if (k === 'size') return c && c.size ? c.size : null;
  return null;
}
function resolve(tpl, l, fills, html) {
  var missing = [], out = '';
  var parts = tpl.split(/(\{\{\w+\}\})/);
  for (var i = 0; i < parts.length; i++) {
    var part = parts[i], m = /^\{\{(\w+)\}\}$/.exec(part);
    if (!m) { out += html ? esc(part) : part; continue; }
    var t = m[1], k = tkey(t), v = null, p;
    if (t === 'orderLines' || t === 'total') {
      if (st.draft.lines.length) v = t === 'total' ? C.totalStr(l) : C.linesText(l);
      else v = fills[t] || null;
    } else if (k === 'item') {
      p = PM[fillVal('item', fills)];
      if (p) v = t === 'itemInfo' ? ptext(p, 'desc', l) : t === 'sizeChart' ? ptext(p, 'size', l) : C.pitem(p, l);
    } else if (k === 'otherItem') {
      p = PM[fills.otherItem]; if (p) v = C.pitem(p, l);
    } else v = fillVal(k, fills);
    if (v == null || v === '') { if (missing.indexOf(k) < 0) missing.push(k); }
    if (html) out += '<span class="tok' + (v == null || v === '' ? '' : ' ok') + '" data-act="tok" data-k="' + k + '">' + (v == null || v === '' ? esc(STR.tokl[k] || k) : esc(v)) + '</span>';
    else out += v == null ? '' : v;
  }
  return { text: html ? out : clean(out), missing: missing };
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
/* o: {btn,label,lang,rec,sub,msg,done(ok)} — called synchronously from a click handler.
   The seal is optimistic (instant); the toast and everything persistent wait for the clipboard write to resolve. */
function copy(text, o) {
  text = clean(text);
  o = o || {};
  var l = o.lang || lang;
  seal(o.btn);
  var ok = function () {
    toast(o.msg || ('Đã chép · ' + short(o.label || 'Văn bản') + ' · ' + l.toUpperCase()), { sub: o.sub, icon: o.icon });
    if (o.rec) afterPaint(function () { commitRecent(o.rec, l); });
    if (!st.hintDone) afterPaint(hintDone);
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
function commitRecent(key, l) {
  st.recents = st.recents.filter(function (r) { return r.k !== key.k + l; });
  st.recents.unshift({ k: key.k + l, label: key.label, lang: l, ref: key.ref });
  st.recents = st.recents.slice(0, 8);
  save();
}
function hintDone() { st.hintDone = 1; save(); var h = $('#hint'); if (h) h.hidden = true; }
function commitLeads(ids) { Object.keys(ids).forEach(function (k) { st.lead.sel[k] = ids[k]; }); save(); }

/* tap guard for a truncated text: the first tap only arms the button, a second tap 400 ms..3 s later copies */
function clearGuard(s) {
  var g = s.state.guard; if (!g) return;
  clearTimeout(g.t); s.state.guard = null;
  if (g.btn && document.contains(g.btn)) { g.btn.classList.remove('guard'); g.btn.innerHTML = g.html; }
}
function guardPass(s, key, btn, msg) {
  var g = s.state.guard, now = performance.now();
  if (g && g.key === key && now - g.at < 3000) {
    if (now - g.at < 400) return false;
    clearGuard(s); return true;
  }
  clearGuard(s);
  s.state.guard = { key: key, at: now, btn: btn, html: btn.innerHTML, t: setTimeout(function () { clearGuard(s); }, 3000) };
  btn.classList.add('guard'); btn.textContent = btn.classList.contains('tint') || btn.closest('.arow') ? 'Chạm lại để chép' : (msg || 'Chưa sửa — chạm lần nữa để chép');
  return false;
}

/* ---------- home ---------- */
function greeting() {
  var h = new Date().getHours();
  return h >= 5 && h < 11 ? 'Chào buổi sáng, Embrace' : h >= 11 && h < 14 ? 'Buổi trưa an yên nhé' : h >= 14 && h < 18 ? 'Chiều dịu dàng, Embrace' : h >= 18 && h < 22 ? 'Tối êm, Embrace' : 'Khuya rồi, nghỉ ngơi sớm nhé';
}
function paintGreet() { var g = $('#greet'); if (g) g.textContent = greeting(); }
function pRow(p) {
  var c = p.variant ? '' : colorOf(p), sw = swatch(p);
  return '<button class="row" data-open="p:' + p.id + '" aria-label="' + esc(pname(p) + ', ' + money(pv(p, 'price'), 'vi')) + '">' +
    '<span class="disc">' + esc(pv(p, 'emoji')) + '</span><span class="rtxt"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub">' +
    (sw ? '<i class="dot"' + ' style="background:' + sw + '"></i>' : '') + '<span class="num" style="flex:none">' + money(pv(p, 'price'), 'vi') + '</span>' + (c ? '<span class="st2">&nbsp;· ' + esc(c) + '</span>' : '') + '</span></span>' + ic('chev', 's13') + '</button>';
}
function grp(items, fn) {
  if (items.length <= 20) return '<div class="grp">' + items.map(fn).join('') + '</div>';
  var out = '<div class="grp">';
  for (var i = 0; i < items.length; i += 20) out += '<div class="chunk">' + items.slice(i, i + 20).map(fn).join('') + '</div>';
  return out + '</div>';
}
var homeHtml = '';
function renderHome() {
  homeHtml = '<div class="grp"><button class="row plain" style="min-height:56px" data-act="replies"><span class="rtxt" style="padding:6px 0"><span class="t">Câu trả lời khác</span><span class="sub s13">Chào · tư vấn size · ship · cảm ơn</span></span>' + ic('chev', 's13') + '</button></div>' +
    '<h2 class="cap">Mẫu · ' + PL.length + '</h2>' + grp(PL, pRow);
  if ($('#q').value.trim()) doSearch(); else $('#hbody').innerHTML = homeHtml;
}
var io;
function observe() {
  if (!window.IntersectionObserver) return;
  var nav = $('#nav'), navH = nav.offsetHeight || 44;
  io = new IntersectionObserver(function (es) {
    es.forEach(function (en) { nav.classList.toggle('scrolled', !en.isIntersecting && en.boundingClientRect.top < navH); });
  }, { rootMargin: '-' + navH + 'px 0px 0px 0px', threshold: 0 });
  io.observe($('#home .sent'));
}

/* ---------- order bar ---------- */
function updateOrderBar() {
  var c = calc(), b = $('#obar'), txt = 'Đơn · ' + c.qty + ' món · ' + money(c.total, 'vi');
  document.body.classList.toggle('has-order', c.count > 0);
  if (!c.count) { b.hidden = true; return; }
  if (b.hidden || !b.firstChild) { b.innerHTML = '<span class="ot">' + esc(txt) + '</span><button class="btn sm" data-act="openorder">Xem đơn</button>'; b.hidden = false; }
  else b.firstChild.textContent = txt;
}
function bump() { var b = $('#obar'); if (b.animate && !reduce) b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 300 }); }
function addLine(pid, size, qty) {
  var d = st.draft, f = d.lines.find(function (L) { return L.pid === pid && L.size === size; });
  if (f) f.qty = Math.min(9, f.qty + (qty || 1)); else d.lines.push({ pid: pid, size: size, qty: qty || 1 });
  setCtxQuiet(pid, size); save(); updateOrderBar(); bump();
  var os = SH.filter(function (x) { return x.kind === 'order'; })[0]; if (os) rerender(os);
}
function lineQty(pid, size) { var f = st.draft.lines.filter(function (L) { return L.pid === pid && L.size === size; })[0]; return f ? f.qty : 0; }

/* ---------- sheets ---------- */
var SH = [], sheetsEl = $('#sheets'), appEl = $('#app'), SAFE_TOP = null;
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
  clearGuard(s);
  var b = s.el.querySelector('.shb'), keep = b ? b.scrollTop : 0;
  s.el.innerHTML = s.render(s);
  b = s.el.querySelector('.shb'); if (b) b.scrollTop = keep;
  if (s.after) afterPaint(function () { s.after(s); });
}
function behind() { appEl.classList.toggle('behind', SH.some(function (s) { return s.det === 'l'; })); }
function setDetent(s, d) {
  if (s.fixed || s.det === d) return;
  s.det = d; s.off = d === 'l' ? 0 : s.offMed;
  s.el.style.setProperty('--off', s.off + 'px');
  s.el.style.transform = 'translateY(' + s.off + 'px)';
  behind();
}
function closeSheet(s, keepToast) {
  if (!s || s.closing) return;
  s.closing = true; clearGuard(s);
  if (s.anim) { s.anim.cancel(); s.anim = null; }
  var i = SH.indexOf(s); if (i > -1) SH.splice(i, 1);
  s.el.style.transform = 'translateY(' + (s.H + 4) + 'px)'; s.wrap.classList.remove('in');
  s.wrap.style.pointerEvents = 'none';
  syncSheetBody();
  if (!keepToast) dismissToast();
  behind();
  setTimeout(function () {
    s.wrap.remove();
    var op = s.opener;
    if (op && document.contains(op) && (!SH.length || topS().el.contains(op))) { try { op.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }, reduce ? 280 : 340);
  if (s.onClose) s.onClose();
}
function closeTop() { closeSheet(SH[SH.length - 1]); }
function closeAllSheets() { SH.slice().forEach(closeSheet); }
function topS(kind) { var s = SH[SH.length - 1]; return s && (!kind || s.kind === kind) ? s : null; }
function sheetOf(kind) { return SH.filter(function (x) { return x.kind === kind; })[0]; }
(function () {
  var d = null;
  document.addEventListener('pointerdown', function (e) {
    var h = e.target.closest('.sheet .drag'); if (!h || e.target.closest('button,input,a,textarea')) return;
    var s = SH.find(function (x) { return x.el === h.parentNode; }); if (!s || s.closing) return;
    if (s.anim) { s.anim.cancel(); s.anim = null; }
    d = { s: s, y0: e.clientY, off0: s.off, smp: [[performance.now(), e.clientY]], pid: e.pointerId };
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
    if (s.fixed) { s.el.style.transform = 'translateY(0px)'; return; }
    var target = o + v * 0.15, dets = [0, s.offMed];
    var bo = dets.reduce(function (p, c) { return Math.abs(c - target) < Math.abs(p - target) ? c : p; }, dets[0]);
    var best = bo === 0 ? 'l' : 'm';
    if (s.det === best) s.el.style.transform = 'translateY(' + s.off + 'px)'; else { setDetent(s, best); hap(); }
  }
  document.addEventListener('pointerup', end); document.addEventListener('pointercancel', end);
})();
document.addEventListener('pointerdown', function (e) {
  var s = topS(); if (s && e.target.matches && e.target.matches('input,textarea') && s.el.contains(e.target)) setDetent(s, 'l');
}, { passive: true });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Escape') { if ($('.dlg')) $('.dlg').remove(); else if ($('#menu.on')) closeMenu(); else if (SH.length) closeTop(); else if ($('#q').value) { $('#q').value = ''; doSearch(); } }
  if (e.key === 'Tab' && SH.length) {
    var s = topS(), f = $$('button,input,textarea,[tabindex="0"]', s.el).filter(function (x) { return !x.disabled && x.offsetParent; });
    if (!f.length) return; var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); }
  }
});
function shHead(title, sub, extra) {
  return '<div class="drag"><i class="grab"></i><div class="shh"><div class="tw"><h2>' + esc(title) + '</h2>' + (sub ? '<div class="st">' + sub + '</div>' : '') + '</div>' + (extra || '') +
    '<button class="iconbtn" data-act="shclose" aria-label="Đóng"><span class="c">' + ic('x', 's15') + '</span></button></div></div>';
}
function segHtml(items, cur, act, cls) {
  var i = Math.max(0, items.findIndex(function (x) { return x[0] === cur; })), n = items.length;
  return '<div class="seg ' + (cls || '') + '" role="group"><span class="th" style="width:calc((100% - 4px)/' + n + ');transform:translateX(' + (i * 100) + '%)"></span>' + items.map(function (x) { return '<button data-act="' + act + '" data-v="' + x[0] + '" aria-pressed="' + (x[0] === cur) + '">' + esc(x[1]) + '</button>'; }).join('') + '</div>';
}
function langSeg() { return '<div class="seg lang" role="group" aria-label="Ngôn ngữ"><span class="th" style="--n:2;width:calc((100% - 4px)/2);transform:translateX(' + (lang === 'en' ? 100 : 0) + '%)"></span><button data-act="lang" data-v="vi" aria-pressed="' + (lang === 'vi') + '">VI</button><button data-act="lang" data-v="en" aria-pressed="' + (lang === 'en') + '">EN</button></div>'; }
function setLang(l) {
  if (l === lang) return;
  lang = l; st.set.lang = l; save(); hap();
  SH.forEach(function (s) { if (s.state.edit) s.state.edit = null; if (s.kind === 'product' || s.kind === 'msg' || s.kind === 'set' || s.kind === 'order') rerender(s); });
}
function lblBtn(text, icon) {
  return '<span class="l1">' + (icon === false ? '' : ic('copy', 's20')) + esc(text) + '</span><span class="l2">' + ic('check', 's20') + 'Đã chép</span>';
}

/* ---------- lead-ins (câu đệm): chips, inline add / edit, long-press menu ---------- */
function leadCur(s, a) {
  var key = a + ':' + lang, cur = Object.prototype.hasOwnProperty.call(s.state.sel, key) ? s.state.sel[key] : C.leadSel(a, lang);
  return C.leadList(a, lang).some(function (x) { return x.id === cur; }) ? cur : null;
}
function linkZone(s) {
  var u = String(pv(PM[s.state.id], 'postUrl') || '').trim(), ed = s.state.edit;
  if (ed && ed.a === 'link') return '<div class="lf" data-lead="link"><textarea rows="1" data-lfi="url" placeholder="Link bài viết Instagram…" aria-label="Link bài viết">' + esc(u) + '</textarea><div class="bs"><button class="txtbtn" data-act="leadcancel">Huỷ</button><button class="txtbtn pri" data-act="linksave">Lưu</button></div></div>';
  return '<div class="lead" data-lead="link">' + (u ? '<button class="lchip" data-act="linktoggle" aria-pressed="' + !!s.state.link + '">Kèm link bài viết</button><button class="lchip add" data-act="linkedit">Sửa link</button>' : '<button class="lchip add" data-act="linkedit">+ Link bài viết</button>') + '</div>';
}
function leadZone(s, a, cap) {
  if (a === 'link') return linkZone(s);
  var ed = s.state.edit;
  if (ed && ed.a === a) {
    var l = lang, cur = ed.id ? C.leadStore().custom.filter(function (x) { return x.id === ed.id; })[0] || C.leadStore().edits[ed.id] || {} : {}, seedx = ed.id && !C.leadStore().custom.some(function (x) { return x.id === ed.id; });
    var base = {};
    if (seedx) ((SEED.leadIns[a] || []).filter(function (x) { return x.id === ed.id; })).forEach(function (x) { base = x; });
    var v = function (k) { return cur[k] !== undefined ? cur[k] : (base[k] || ''); };
    return (cap ? '<h3 class="cap sm" style="padding-bottom:0">' + cap + '</h3>' : '') + '<div class="lf" data-lead="' + a + '">' +
      (ed.id ? '<h3 class="cap sm">Tiếng Việt</h3><textarea rows="1" data-lfi="vi" aria-label="Câu đệm tiếng Việt">' + esc(v('vi')) + '</textarea><h3 class="cap sm">Bản tiếng Anh (tuỳ chọn)</h3><textarea rows="1" data-lfi="en" aria-label="Bản tiếng Anh">' + esc(v('en')) + '</textarea>'
        : '<textarea rows="1" data-lfi="' + l + '" placeholder="Câu bạn hay nói trước khi gửi…" aria-label="Câu đệm mới"></textarea>') +
      '<div class="bs"><button class="txtbtn" data-act="leadcancel">Huỷ</button><button class="txtbtn pri" data-act="leadsave" data-a="' + a + '">Lưu</button></div></div>';
  }
  var cur2 = leadCur(s, a), list = C.leadList(a, lang);
  return (cap ? '<h3 class="cap sm" style="padding-bottom:0">' + cap + '</h3>' : '') + '<div class="lead" data-lead="' + a + '"><button class="lchip" data-act="lead" data-a="' + a + '" data-id="" aria-pressed="' + !cur2 + '">Không kèm</button>' +
    list.map(function (x) { return '<button class="lchip" data-act="lead" data-a="' + a + '" data-id="' + x.id + '" data-menu="lead:' + x.id + ':' + a + '" aria-pressed="' + (x.id === cur2) + '" title="' + esc(x.text) + '">' + esc(x.text) + '</button>'; }).join('') +
    '<button class="lchip add" data-act="leadadd" data-a="' + a + '">+ Thêm câu</button></div>';
}
function leadState(s, a) {
  var id = leadCur(s, a), x = id ? C.leadList(a, lang).filter(function (y) { return y.id === id; })[0] : null;
  return x ? '“' + short(x.text, 30) + '”' : '';
}
function refreshLeadZone(s, a) {
  var el = s.el.querySelector('[data-lead="' + a + '"]'); if (!el) return;
  var tmp = document.createElement('div'); tmp.innerHTML = leadZone(s, a, null);
  el.replaceWith(tmp.firstChild);
  var ta = s.el.querySelector('[data-lead="' + a + '"] textarea'); if (ta) { ta.focus(); grow(ta); }
}
function grow(ta) { ta.style.height = 'auto'; ta.style.height = Math.min(120, ta.scrollHeight + 2) + 'px'; }
/* the single compose call for a sheet, used by preview and clipboard alike */
function sheetCompose(s, a) {
  var k = s.kind;
  if (k === 'product') return C.composeCopy(a || s.state.open, { pid: s.state.id, sel: s.state.sel, link: s.state.link }, lang);
  if (k === 'set') return C.composeCopy('set', { set: SM(s.state.id), sel: s.state.sel, bubble: a || 'a' }, lang);
  if (k === 'order') return C.composeCopy('order', { sel: s.state.sel }, lang);
  return null;
}
function prevHtml(r) {
  if (r.missing) return '<span style="color:var(--label-2)">Chưa có bản ' + lu() + ' của phần này.</span>';
  return r.parts.map(function (x) { return x.lead ? '<span class="leadp">' + esc(x.text) + '</span>' : esc(x.text); }).join('\n\n');
}
function checkMore(s) {
  var pp = s.el.querySelector('#prev'), mb = s.el.querySelector('#more'); if (!pp || !mb) return;
  if (s.state.full) { pp.classList.remove('clamp'); mb.hidden = false; mb.firstChild.textContent = 'Thu gọn ⌃'; return; }
  pp.classList.add('clamp'); mb.hidden = pp.scrollHeight <= pp.clientHeight + 1; mb.firstChild.textContent = 'Xem hết ⌄';
}
function refreshPreview(s, flash) {
  if (s.kind === 'set') { refreshSet(s, flash); return; }
  if (s.kind === 'order') { var op = s.el.querySelector('#ordprev'); if (op) op.textContent = sheetCompose(s).text; return; }
  var el = s.el.querySelector('#prev'); if (!el) return;
  el.innerHTML = prevHtml(sheetCompose(s));
  if (flash && !reduce) { var lp = el.querySelector('.leadp'); if (lp && lp.animate) lp.animate([{ backgroundColor: 'rgba(154,86,84,.22)' }, { backgroundColor: 'rgba(154,86,84,0)' }], { duration: 400, easing: 'ease-out' }); }
  checkMore(s);
}
function addLead(a, l, text) {
  var o = { id: uid('lu-'), action: a, vi: '', en: '' }; o[l] = text.trim();
  C.leadStore().custom.unshift(o); save(); return o.id;
}
function saveLeadEdit(id, a, vi, en) {
  var s = C.leadStore(), c = s.custom.filter(function (x) { return x.id === id; })[0];
  if (c) { c.vi = vi.trim(); c.en = en.trim(); } else { s.edits[id] = { vi: vi.trim(), en: en.trim() }; }
  save();
}
function removeLead(id) {
  var s = C.leadStore(), i = -1, item = null;
  s.custom.forEach(function (x, j) { if (x.id === id) { i = j; item = x; } });
  var snapSel = JSON.stringify(s.sel);
  if (item) s.custom.splice(i, 1); else if (s.hidden.indexOf(id) < 0) s.hidden.push(id);
  Object.keys(s.sel).forEach(function (k) { if (s.sel[k] === id) delete s.sel[k]; });
  save();
  return function () { if (item) s.custom.splice(Math.min(i, s.custom.length), 0, item); else s.hidden = s.hidden.filter(function (x) { return x !== id; }); s.sel = JSON.parse(snapSel); save(); };
}
function leadClick(s, t) {
  var a = t.dataset.a, key = a + ':' + lang, id = t.dataset.id || null;
  if (id && leadCur(s, a) === id) id = null;   /* tapping the selected chip goes back to "Không kèm" */
  s.state.sel[key] = id;
  $$('[data-lead="' + a + '"] .lchip[data-act=lead]', s.el).forEach(function (b) { b.setAttribute('aria-pressed', (b.dataset.id || null) === id); });
  refreshPreview(s, true);
}
function leadSave(s, t) {
  var a = t.dataset.a, ed = s.state.edit, key = a + ':' + lang;
  var tas = $$('[data-lead="' + a + '"] textarea', s.el);
  if (ed && ed.id) {
    var vals = {}; tas.forEach(function (x) { vals[x.dataset.lfi] = x.value; });
    saveLeadEdit(ed.id, a, vals.vi || '', vals.en || '');
    s.state.edit = null; toast('Đã lưu câu đệm');
  } else {
    var txt = tas[0] ? tas[0].value.trim() : '';
    s.state.edit = null;
    if (txt) { s.state.sel[key] = addLead(a, lang, txt); toast('Đã thêm câu đệm'); }
  }
  refreshLeadZone(s, a); refreshPreview(s, true);
}

/* ---------- product sheet: the action stack ---------- */
function openProduct(id) {
  var s = pushSheet({ kind: 'product', det: 'l', fixed: true, state: { id: id, open: 'info', sel: {}, edit: null, full: false, guard: null }, render: renderProd });
  s.after = checkMore; afterPaint(function () { checkMore(s); setCtx(id); });
}
function copyLabel(a) { return a === 'info' ? 'Chép thông tin' : a === 'size' ? 'Chép bảng size' : 'Chép cả hai'; }
function altRow(a, id) {
  var ol = other(lang);
  return '<div class="alt"><button class="txtbtn" data-act="pcopyalt" data-a="' + a + '" data-id="' + id + '">Chép bản ' + ol.toUpperCase() + '</button><button class="txtbtn" data-act="editp" data-id="' + id + '">Thêm bản ' + lu() + '</button></div>';
}
function renderProd(s) {
  var id = s.state.id, p = PM[id], l = lang, open = s.state.open, c = colorOf(p), note = pv(p, 'noteVi'), h = '';
  var dt = ptrunc(p, 'desc', l), zt = ptrunc(p, 'size', l);
  h += shHead(pv(p, 'emoji') + ' ' + pname(p, 'vi'), money(pv(p, 'price'), 'vi') + (c ? ' · ' + esc(c) : '') + ' · ' + psizes(p).join(' '), langSeg());
  h += '<div class="shb pad">';
  if (dt || zt) h += '<div class="qwarn">' + (dt && zt ? 'Thông tin và bảng size' : dt ? 'Thông tin' : 'Bảng size') + ' bị cắt ở sheet gốc — <button class="txtbtn" data-act="editp" data-id="' + id + '">Sửa</button></div>';
  ['info', 'size', 'both'].forEach(function (a) {
    var r = sheetCompose(s, a);
    if (a === open) {
      h += '<div class="acard">' + (a === 'info' ? '' : '<div style="border-top:.5px solid var(--separator);margin-bottom:8px"></div>') + '<h3 class="cap sm">' + STR.acts[a] + '</h3>' +
        '<div class="paper sel clamp" id="prev" lang="' + l + '">' + prevHtml(r) + '</div><div class="more" id="more" hidden><button class="txtbtn" data-act="moreprev">Xem hết ⌄</button></div>' +
        (a === 'both' ? leadZone(s, 'info', 'Trước thông tin') + leadZone(s, 'size', 'Trước bảng size') : leadZone(s, a)) + (a === 'size' ? '' : linkZone(s)) +
        (r.partial ? '<div class="foot">Chưa có bảng size ' + lu() + ': chỉ chép thông tin.</div>' : '') +
        (r.missing ? '<button class="btn dis wide" aria-disabled="true">Chưa có bản ' + lu() + '</button>' + altRow(a, id)
          : '<button class="btn wide" data-act="pcopy" data-a="' + a + '">' + lblBtn(copyLabel(a) + ' · ' + lu()) + '</button>') + '</div>';
    } else {
      var sub = a === 'both' ? [leadState(s, 'info'), leadState(s, 'size')].filter(Boolean).join(' · ') : leadState(s, a);
      h += '<div class="arow"><button class="al" data-act="popen" data-a="' + a + '"><span class="t">' + STR.acts[a] + '</span><span class="s">' + (sub ? 'kèm: ' + sub : 'không kèm câu') + '</span></button>' +
        (r.missing ? '<button class="btn tint dis">Chưa có ' + lu() + '</button>' : '<button class="btn tint" data-act="pcopy" data-a="' + a + '">' + lblBtn('Chép · ' + lu(), false) + '</button>') + '</div>';
    }
  });
  st.sets.filter(function (x) { return x.items.indexOf(id) > -1; }).slice(0, 2).forEach(function (x) {
    var others = x.items.filter(function (y) { return y !== id && PM[y]; }).map(function (y) { return pv(PM[y], 'name'); }).join(' + '), r = C.composeCopy('set', { set: x, sel: s.state.sel, bubble: 'a' }, l);
    h += '<div class="arow"><button class="al" data-open="s:' + x.id + '"><span class="t">Set với ' + esc(others) + '</span><span class="s">' + money(C.setPrice(x), 'vi') + '</span></button>' +
      (r.missing ? '<button class="btn tint dis">Chưa có ' + lu() + '</button>' : '<button class="btn tint" data-act="pcopyset" data-id="' + x.id + '">' + lblBtn('Chép · ' + lu(), false) + '</button>') + '</div>';
  });
  h += '<div class="szrow"><span class="lb">Thêm vào đơn</span><div class="chips">' + psizes(p).map(function (z) {
    var q = lineQty(id, z);
    return '<button class="chip tall" data-act="addline" data-id="' + id + '" data-v="' + z + '">' + z + (q ? '<span class="n"> · ' + q + '</span>' : '') + '</button>';
  }).join('') + '</div></div>';
  if (PL.length > 1) h += '<button class="arow link" style="width:100%;text-align:left" data-act="setpick" data-id="' + id + '"><span class="al"><span class="t" style="font-size:15px;color:var(--label-2)">Khách hỏi set? Ghép với mẫu khác</span></span>' + ic('chev', 's13') + '</button>';
  if (note) h += '<div class="note">' + ic('sparkle', 's15') + '<span><span class="vh">Ghi chú nội bộ: </span>' + esc(note) + '</span></div>';
  return h + '</div>';
}
function productCopy(s, a, btn, forceLang) {
  var l = forceLang || lang, id = s.state.id, p = PM[id];
  var r = C.composeCopy(a, { pid: id, sel: s.state.sel, link: s.state.link }, l);
  if (r.missing) { toast('Chưa có bản ' + l.toUpperCase(), { bad: true }); return; }
  if (r.trunc && !guardPass(s, a + l, btn)) return;
  var label = pname(p, 'vi') + (a === 'size' ? ' · size' : '');
  copy(r.text, { btn: btn, label: a === 'size' ? 'Bảng size ' + pname(p, 'vi') : pname(p, 'vi'), lang: l, rec: { k: 'p:' + id + ':' + a, label: label, ref: { t: 'p', id: id, w: a } }, done: function (ok) { if (ok) commitLeads(r.leadIds); } });
}

/* ---------- reply sheets ---------- */
var GROUPS = [
  ['Chào', ['open-first', 'open-returning', 'extra-photos']],
  ['Tư vấn size', ['ask-measurements', 'fit-size', 'between-sizes', 'over-size-has-option', 'over-size-no-option', 'too-small-size', 'will-think']],
  ['Giao hàng', ['shipping-info', 'shipping-fee']],
  ['Sau khi chốt', ['order-confirm', 'paid-ack', 'paid-thanks', 'thanks-rtw', 'thanks-custom', 'thanks-generic', 'tracking-note', 'tracking-code', 'ask-feedback', 'return-policy']]
];
function groupOf(id) { var g = ''; GROUPS.forEach(function (x) { if (x[1].indexOf(id) > -1) g = x[0]; }); return g; }
function entryHidden(e) { return !entryText(e, 'vi').text.trim() && !entryText(e, 'en').text.trim(); }
function openReplies() {
  pushSheet({
    kind: 'replies', det: 'l', fixed: true, state: {},
    render: function () {
      var h = shHead('Câu trả lời khác') + '<div class="shb pad">';
      GROUPS.forEach(function (g) {
        var rows = g[1].map(function (id) { return FM[id]; }).filter(function (e) { return e && !entryHidden(e); });
        if (!rows.length) return;
        h += '<h3 class="cap sm" style="padding-top:18px">' + g[0] + '</h3><div class="grp" style="margin:0">' + rows.map(function (e) {
          return '<button class="row plain" data-open="f:' + e.id + '"><span class="rtxt"><span class="t">' + esc(eLabel(e)) + '</span></span>' + ic('chev', 's13') + '</button>';
        }).join('') + '</div>';
      });
      h += '<h3 class="cap sm" style="padding-top:18px">Set</h3><div class="grp" style="margin:0">' + st.sets.map(function (x) {
        return '<button class="row plain" data-open="s:' + x.id + '"><span class="rtxt"><span class="t">' + esc(C.setLabel(x)) + '</span><span class="sub s13">' + money(C.setPrice(x), 'vi') + '</span></span>' + ic('chev', 's13') + '</button>';
      }).join('') + '<button class="row plain" data-act="setnew"><span class="rtxt"><span class="t">Tạo set</span></span>' + ic('plus', 's15') + '</button></div>';
      var sg = suggestions();
      if (sg.length) h += '<h3 class="cap sm" style="padding-top:18px">Gợi ý ghép từ bài đăng</h3><div class="grp" style="margin:0">' + sg.map(function (x) { return '<button class="row plain" data-act="setsugg" data-a="' + x[0] + '" data-b="' + x[1] + '"><span class="rtxt"><span class="t">' + esc(C.setLabel({ items: x })) + '</span><span class="sub s13">kiểm tra giá trước khi gửi</span></span>' + ic('chev', 's13') + '</button>'; }).join('') + '</div>';
      return h + '</div>';
    }
  });
}
function openMessage(id) {
  var e0 = FM[id];
  pushSheet({
    kind: 'msg', det: keysOf(mtext(e0, lang).text).length ? 'l' : 'm', state: { id: id, fills: {}, guard: null },
    render: function (s) {
      var e = FM[id], et = mtext(e, lang), fills = s.state.fills, r = resolve(et.text, lang, fills, true), keys = keysOf(et.text);
      var rp = resolve(et.text, lang, fills, false), n = rp.missing.length;
      var fr = keys.map(function (k) { return fillRow(k, fills, s); }).join('');
      var fromCtx = keys.some(function (k) { return (k === 'item' || k === 'size') && !fills[k] && fillVal(k, fills); });
      return shHead(eLabel(e), groupOf(id), langSeg()) +
        '<div class="shb">' +
        (et.fell ? '<div class="note" style="margin:0 0 10px">' + ic('warn', 's15') + '<span><b style="color:var(--destructive)">Chưa có bản ' + lu() + '.</b> Bên dưới là bản ' + other(lang).toUpperCase() + ' — chỉ chép khi bạn muốn gửi tiếng ' + (other(lang) === 'vi' ? 'Việt' : 'Anh') + '.<br><button class="txtbtn" data-act="editf" data-id="' + id + '" style="min-height:32px;padding:0">Thêm bản ' + lu() + '</button></span></div>' : '') +
        '<div class="paper sel" id="mprev" lang="' + (et.fell ? other(lang) : lang) + '">' + r.text + '</div>' +
        (e.attach && !GREET[id] ? '<div class="att">' + ic('clip', 's15') + 'Nhớ đính kèm: ' + esc(e.attach) + '</div>' : '') +
        (keys.length ? '<h3 class="h2">Điền nhanh</h3>' + fr + (fromCtx ? '<p class="foot">Lấy từ ' + esc(ctxLabel()) + '</p>' : '') : '') + '</div>' +
        '<div class="shf"><button class="btn" id="mcopy" data-act="msgcopy"' + (n ? ' disabled' : '') + '>' + (n ? 'Điền ' + n + ' chỗ nữa' : lblBtn(msgCopyLabel(et))) + '</button></div>';
    }
  });
}
function msgCopyLabel(et) { return et.fell ? 'Chép bản ' + other(lang).toUpperCase() : 'Chép · ' + lu(); }
function candidates() {
  var out = [], c = ctx();
  if (c && c.itemId) out.push(c.itemId);
  st.recents.forEach(function (r) { var m = /^p:([^:]+):/.exec(r.k); if (m && PM[m[1]] && out.indexOf(m[1]) < 0) out.push(m[1]); });
  PL.forEach(function (p) { if (out.indexOf(p.id) < 0) out.push(p.id); });
  return out;
}
function fillRow(k, fills) {
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
function refreshMsg(s) {
  var e = FM[s.state.id], et = mtext(e, lang), r = resolve(et.text, lang, s.state.fills, true), rp = resolve(et.text, lang, s.state.fills, false), n = rp.missing.length;
  var pv_ = s.el.querySelector('#mprev'); if (pv_) pv_.innerHTML = r.text;
  var b = s.el.querySelector('#mcopy'); if (b) { b.disabled = !!n; b.innerHTML = n ? 'Điền ' + n + ' chỗ nữa' : lblBtn(msgCopyLabel(et)); }
}
function msgCopy(s, t) {
  var ent = FM[s.state.id], et = mtext(ent, lang), rr = resolve(et.text, lang, s.state.fills, false);
  if (rr.missing.length) return;
  var p = PM[fillVal('item', s.state.fills)];
  var tr = p && ((/\{\{itemInfo\}\}/.test(et.text) && ptrunc(p, 'desc', lang)) || (/\{\{sizeChart\}\}/.test(et.text) && ptrunc(p, 'size', lang)));
  if (tr && !guardPass(s, 'm' + lang, t)) return;
  var cl = et.fell ? other(lang) : lang;
  copy(rr.text, { btn: t, label: eLabel(ent), lang: cl, rec: { k: 'f:' + ent.id, label: eLabel(ent), ref: { t: 'f', id: ent.id } }, done: function (ok) { if (ok) setTimeout(function () { closeSheet(s, true); }, 600); } });
}
function openEntry(id) {
  var e = FM[id];
  if (id === 'order-recap') { closeAllSheets(); openOrder(); return; }
  if (entryHidden(e)) { toast('Nhớ gửi đính kèm', { sub: e.attach || eLabel(e), icon: 'clip' }); return; }
  openMessage(id);
}

/* ---------- picker ---------- */
function openPicker(mode, cb, o) {
  o = o || {};
  pushSheet({
    kind: 'picker', det: 'l', fixed: true, state: { q: '', mode: mode, cb: cb, title: o.title, from: o.from, skip: o.skip || [], first: null },
    render: function (s) {
      return shHead(s.state.title || (mode === 'order' ? 'Thêm món' : 'Chọn mẫu')) +
        '<div style="padding:0 20px 8px"><div class="sfield" style="margin:0;height:36px;background:var(--fill-4)">' + ic('search') + '<input data-pq type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Tìm mẫu" style="height:36px" aria-label="Tìm mẫu"></div></div>' +
        '<div class="shb" id="plist" style="padding-bottom:calc(var(--safe-bottom) + 16px)">' + pickerList(s) + '</div>';
    }
  });
}
function pickerList(s) {
  var q = norm(s.state.q || ''), skip = s.state.skip, from = s.state.from && PM[s.state.from];
  var ps = PL.filter(function (p) { return skip.indexOf(p.id) < 0 && (!q || norm(pname(p, 'vi') + ' ' + colorOf(p)).indexOf(q) > -1); });
  if (from) {
    var sg = function (p) { return isSugg(from.id, p.id); };
    ps = ps.filter(sg).concat(ps.filter(function (p) { return !sg(p) && p.category !== from.category; }), ps.filter(function (p) { return !sg(p) && p.category === from.category; }));
  }
  if (!ps.length) return '<div class="empty"><div class="tt">Chưa tìm thấy</div><p>Thử một tên ngắn hơn nhé.</p></div>';
  return '<div class="grp" style="margin:0">' + ps.map(function (p) {
    if (s.state.mode === 'order') return '<div class="row"><span class="rtxt"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub num">' + money(pv(p, 'price'), 'vi') + '</span></span><span class="chips" style="padding:0">' + psizes(p).map(function (z) { return '<button class="chip tall" data-act="pickadd" data-id="' + p.id + '" data-v="' + z + '">' + z + '</button>'; }).join('') + '</span></div>';
    return '<button class="row" data-act="pickone" data-id="' + p.id + '"' + (s.state.first === p.id ? ' style="background:var(--accent-tint)"' : '') + '><span class="disc">' + esc(pv(p, 'emoji')) + '</span><span class="rtxt"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub num">' + money(pv(p, 'price'), 'vi') + (from && isSugg(from.id, p.id) ? ' · hay ghép' : '') + '</span></span></button>';
  }).join('') + '</div>';
}

/* ---------- fallback (manual copy) ---------- */
function openFallback(text) {
  var s = pushSheet({ kind: 'fb', det: 'm', render: function () { return shHead('Chép tay', 'Chạm giữ đoạn văn để chọn và chép') + '<div class="shb"><div class="paper sel" id="fbtxt">' + esc(text) + '</div></div>'; } });
  setTimeout(function () { var el = s.el.querySelector('#fbtxt'); if (el) { var r = document.createRange(); r.selectNodeContents(el); var sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); } }, 50);
}

/* ---------- order sheet ---------- */
var ordUI = { open: -1, prev: false };
function openOrder() {
  if (sheetOf('order')) return;
  pushSheet({ kind: 'order', det: 'l', fixed: true, state: { sel: {}, guard: null }, render: renderOrder });
}
function thankCard(s) {
  return '<div class="ocard"><h3>' + ic('sparkle') + 'Khách đã chuyển khoản?</h3><p>Gửi lời cảm ơn thật ấm nhé.</p>' + leadZone(s, 'thanks') + '<div class="acts"><button class="btn sm" data-act="thank">' + lblBtn('Chép lời cảm ơn · ' + lu()) + '</button></div></div>';
}
function renderOrder(s) {
  var d = st.draft, c = calc(), h = '', cx = ctx(), rows = '';
  h += '<div class="drag"><i class="grab"></i><div class="sbar"><button class="txtbtn" data-act="neworder">Đơn mới</button><span class="tt">Đơn hàng</span><span style="display:flex;align-items:center;gap:4px">' + langSeg() + '<button class="iconbtn" data-act="shclose" aria-label="Đóng"><span class="c">' + ic('x', 's15') + '</span></button></span></div></div><div class="shb pad">';
  if (d.copiedAt && Date.now() - d.copiedAt < 864e5) h += thankCard(s);
  if (cx && cx.itemId && cx.size && PM[cx.itemId] && !d.lines.some(function (L) { return L.pid === cx.itemId && L.size === cx.size; })) {
    rows += '<button class="row plain sugg" data-act="sugg"><span class="rtxt"><span class="t">Thêm ' + esc(pname(PM[cx.itemId], 'vi') + ' · ' + cx.size) + '</span></span><span class="sub s13" style="color:var(--label-2)">gợi ý</span></button>';
  }
  d.lines.forEach(function (L, i) {
    var p = PM[L.pid]; if (!p) return;
    rows += '<div class="row lrow' + (ordUI.open === i ? ' open' : '') + '" data-act="lineopen" data-i="' + i + '"><div class="lm"><span class="disc">' + esc(pv(p, 'emoji')) + '</span><span class="rtxt"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub">Size ' + L.size + ' · SL ' + L.qty + '</span></span><span class="pr">' + money(pv(p, 'price') * L.qty, 'vi') + '</span></div>' +
      '<div class="lexp"><div class="chips wrapc">' + psizes(p).map(function (z) { return '<button class="chip" data-act="linesize" data-i="' + i + '" data-v="' + z + '" aria-pressed="' + (z === L.size) + '">' + z + '</button>'; }).join('') + '</div>' +
      '<span class="step"><button data-act="qty" data-i="' + i + '" data-d="-1" aria-label="Giảm">' + ic('minus') + '</button><span class="v num">' + L.qty + '</span><button data-act="qty" data-i="' + i + '" data-d="1" aria-label="Tăng">' + ic('plus') + '</button></span>' +
      '<button class="txtbtn dest" data-act="linedel" data-i="' + i + '">Xoá</button></div></div>';
  });
  rows += '<button class="row plain addrow" data-act="addpick">' + ic('plus', 's20') + '<span>Thêm món</span></button>';
  h += '<h3 class="h2" style="margin-top:4px">Món</h3><div class="grp" style="margin:0">' + rows + '</div>';
  if (!d.lines.length) h += '<div class="empty">' + ic('bag', 's34') + '<div class="tt">Đơn còn trống</div><p>Thêm món đầu tiên để bắt đầu nhé.</p></div>';
  var labels = [['courier', 'Trả shipper'], ['fee', money(st.set.fee, 'vi')], ['free', 'Freeship'], ['custom', 'Khác']];
  var idx = labels.findIndex(function (x) { return x[0] === d.ship; });
  h += '<h3 class="h2">Phí ship</h3><div class="seg full" role="group" aria-label="Phí ship" style="--n:4"><span class="th" style="--n:4;width:calc((100% - 4px)/4);transform:translateX(' + (idx * 100) + '%)"></span>' + labels.map(function (x) { return '<button data-act="ship" data-v="' + x[0] + '" aria-pressed="' + (d.ship === x[0]) + '" style="min-width:0;padding:0 4px">' + esc(x[1]) + '</button>'; }).join('') + '</div>' +
    (d.ship === 'custom' ? '<input class="fld" style="margin-top:8px" inputmode="numeric" data-in="custom" placeholder="Nhập phí ship (đ)" value="' + (d.custom ? nfV.format(d.custom) : '') + '" aria-label="Phí ship khác">' : '');
  h += '<h3 class="h2">Thông tin nhận (tuỳ chọn)</h3><div style="position:relative"><textarea class="ta sel" data-in="info" placeholder="Dán tên, SĐT, địa chỉ khách gửi…" aria-label="Thông tin nhận" style="padding-right:48px">' + esc(d.info) + '</textarea><button class="iconbtn" data-act="pasteinfo" aria-label="Dán" style="position:absolute;right:2px;top:2px"><span class="c bare">' + ic('paste', 's20') + '</span></button></div>';
  if (st.set.bank.no) h += '<div class="swrow"><span>Kèm thông tin chuyển khoản</span><label class="sw"><input type="checkbox" switch data-in="bank" aria-label="Kèm thông tin chuyển khoản"' + (d.bank ? ' checked' : '') + '><i></i></label></div>';
  else h += '<button class="swrow" data-act="bankset"><span>Thêm STK để kèm vào đơn</span>' + ic('chev', 's13') + '</button>';
  h += '<button class="prevb" data-act="prevtoggle"><span>Xem trước</span>' + ic('chev', 's13') + '</button>';
  if (ordUI.prev) h += '<div class="paper sel" id="ordprev">' + esc(d.lines.length ? sheetCompose(s).text : 'Chưa có món') + '</div>';
  h += '</div><div class="shf col ofoot">' + leadZone(s, 'order') + '<div class="tot"><div><div class="tl">' + (c.count ? 'Tổng · ' + c.qty + ' món' : 'Chưa có món') + '</div><div class="tv num">' + money(c.total, lang) + '</div></div>' +
    '<button class="btn" id="obtn" data-act="copyorder"' + (c.count ? '' : ' disabled') + '>' + lblBtn('Chép đơn · ' + lu()) + '</button></div></div>';
  return h;
}

/* ---------- sets ---------- */
function isSugg(a, b) { return (SEED.setSuggestions || []).some(function (x) { return (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a); }); }
function suggestions() {
  return (SEED.setSuggestions || []).filter(function (x) { return PM[x[0]] && PM[x[1]] && !st.sets.some(function (y) { return y.items.slice().sort().join('|') === x.slice().sort().join('|'); }); });
}
function createSet(items, checked) {
  var key = items.slice().sort().join('|'), ex = st.sets.filter(function (x) { return x.items.slice().sort().join('|') === key; })[0];
  if (ex) return ex;
  var set = { id: uid('set-'), items: items, price: null, name: '', postUrl: '', checked: checked !== false, ov: { vi: null, en: null } };
  st.sets.push(set); IDX = null; save(); return set;
}
function openSetPicker(fromPid) {
  var p = PM[fromPid];
  openPicker('set', function (pid) { var set = createSet([fromPid, pid], true); openSet(set.id); }, { title: 'Ghép ' + pname(p, 'vi') + ' với…', from: fromPid, skip: [fromPid] });
}
function openSet(id) {
  pushSheet({ kind: 'set', det: 'l', fixed: true, state: { id: id, sel: {}, edit: null, ed: null, full: {}, guard: null, next: 'a' }, render: renderSet });
}
var BLBL = { a: 'Thông tin + giá set', b: 'Bảng size từng món', c: 'Xin số đo', d: 'Link bài viết' };
function setLine(set) {
  var ps = C.setItems(set), sum = C.setSum(set), price = C.setPrice(set);
  return price !== sum ? 'Giá lẻ ' + ps.map(function (p) { return money(pv(p, 'price'), 'vi'); }).join(' + ') + ' = ' + money(sum, 'vi') + ' → Giá set ' + money(price, 'vi') : 'Giá set ' + money(price, 'vi') + ' (= tổng giá lẻ)';
}
function bubHtml(r) { return r.missing ? '<span style="color:var(--label-2)">Chưa có bản ' + lu() + ' của tin này.</span>' : prevHtml(r); }
function renderSet(s) {
  var set = SM(s.state.id), l = lang, h = '', ed = s.state.ed, has = set.ov && set.ov[l], i = 0, vis = C.SETB.filter(function (b) { return C.setBubble(set, b, l); });
  var next = vis.indexOf(s.state.next) > -1 ? s.state.next : vis[0];
  h += shHead(C.setLabel(set), 'Set · ' + money(C.setPrice(set), 'vi'), langSeg()) + '<div class="shb pad">';
  if (set.checked === false) h += '<div class="qwarn">Gợi ý từ bài đăng, chưa kiểm tra giá — <button class="txtbtn" data-act="setok">Đã kiểm tra</button></div>';
  h += '<div class="foot" id="pline" style="margin-top:0">' + esc(setLine(set)) + '</div>' +
    '<h3 class="cap sm" style="padding-bottom:0">Giá set (để trống = tổng giá lẻ)</h3><div class="lf" style="margin-top:6px"><textarea rows="1" data-sprice inputmode="numeric" placeholder="' + nfV.format(C.setSum(set)) + '" aria-label="Giá set">' + (set.price != null && set.price !== '' ? set.price : '') + '</textarea></div>' +
    '<h3 class="cap sm" style="padding-bottom:0">Link bài viết (tuỳ chọn)</h3><div class="lf" style="margin-top:6px"><textarea rows="1" data-spurl placeholder="Để trống = link bài của mẫu" aria-label="Link bài viết">' + esc(set.postUrl || '') + '</textarea></div>';
  vis.forEach(function (b) {
    var r = C.composeCopy('set', { set: set, bubble: b, sel: s.state.sel }, l), full = s.state.full[b], long = r.text.split('\n').length > 6 || r.text.length > 300;
    i++;
    h += '<div class="bub' + (b === next ? ' next' : '') + '" data-b="' + b + '"><h3 class="cap sm" style="padding-bottom:0">' + i + ' · ' + BLBL[b] + '</h3>';
    if (b === 'a' && ed === 'ov') h += '<div class="lf" style="margin-top:6px"><textarea data-ovta rows="6" style="max-height:none;overflow:auto" aria-label="Nội dung tin 1">' + esc(has ? set.ov[l] : r.text) + '</textarea><div class="bs"><button class="txtbtn" data-act="setovcancel">Huỷ</button><button class="txtbtn pri" data-act="setovsave">Lưu</button></div></div>';
    else {
      h += '<div class="paper sel bp' + (full ? '' : ' clamp') + '" data-b="' + b + '" lang="' + l + '" style="margin-top:6px">' + bubHtml(r) + '</div>' + (long ? '<div class="more"><button class="txtbtn" data-act="bfull" data-b="' + b + '">' + (full ? 'Thu gọn ⌃' : 'Xem hết ⌄') + '</button></div>' : '');
      if (b === 'a' && has) h += '<div class="foot">Đã sửa tay · <button class="txtbtn" style="min-height:32px;padding:0" data-act="setovreset">Dùng bản tự soạn</button></div>';
      if (b === 'a') h += leadZone(s, 'info'); else if (b === 'b') h += leadZone(s, 'size');
      h += r.missing ? '<button class="btn dis wide" style="margin-top:12px">Chưa có bản ' + lu() + '</button>' + (b === 'c' ? '' : '<div class="alt"><button class="txtbtn" data-act="bcopy" data-b="' + b + '" data-alt="1">Chép bản ' + other(l).toUpperCase() + '</button></div>')
        : '<button class="btn wide" style="margin-top:12px" data-act="bcopy" data-b="' + b + '">' + lblBtn('Chép · ' + lu()) + '</button>';
    }
    h += '</div>';
  });
  h += '<div style="margin-top:16px"><button class="txtbtn" data-act="setadd">+ Thêm mẫu vào set</button> <button class="txtbtn" data-act="setovedit">Sửa câu tin 1</button> <button class="txtbtn dest" data-act="setdel">Xoá set</button></div></div>';
  return h;
}
function refreshSet(s, flash) {
  var set = SM(s.state.id), pl = s.el.querySelector('#pline'); if (pl) pl.textContent = setLine(set);
  $$('.bub .bp', s.el).forEach(function (el) {
    var r = C.composeCopy('set', { set: set, bubble: el.dataset.b, sel: s.state.sel }, lang); el.innerHTML = bubHtml(r);
    if (flash && !reduce) { var lp = el.querySelector('.leadp'); if (lp && lp.animate) lp.animate([{ backgroundColor: 'rgba(154,86,84,.22)' }, { backgroundColor: 'rgba(154,86,84,0)' }], { duration: 400, easing: 'ease-out' }); }
  });
  var sub = s.el.querySelector('.shh .st'); if (sub) sub.textContent = 'Set · ' + money(C.setPrice(set), 'vi');
}
/* one Instagram bubble of a set: synchronous, guarded when the text is truncated or the set price was never checked */
function bubbleCopy(s, t, b, forceLang, set) {
  var l = forceLang || lang; set = set || SM(s.state.id);
  var r = C.composeCopy('set', { set: set, bubble: b, sel: s.state.sel }, l);
  if (r.missing) { toast('Chưa có bản ' + l.toUpperCase(), { bad: true }); return; }
  var unchecked = b === 'a' && set.checked === false;
  if ((r.trunc || unchecked) && !guardPass(s, 'set' + b + l, t, unchecked ? 'Kiểm tra giá set rồi chạm lại để chép' : 0)) return;
  var vis = C.SETB.filter(function (x) { return C.setBubble(set, x, lang); });
  copy(r.text, { btn: t, label: C.setLabel(set), lang: l, done: function (ok) {
    if (!ok) return;
    commitLeads(r.leadIds); if (set.checked === false) { set.checked = true; var qw = s.el.querySelector('.qwarn'); if (qw) qw.remove(); } save();
    if (s.kind === 'set') {
      var nx = vis[vis.indexOf(b) + 1] || b; s.state.next = nx;
      $$('.bub', s.el).forEach(function (x) { x.classList.toggle('next', x.dataset.b === nx); });
    }
  } });
}

/* ---------- long-press menu (lead-in chips) ---------- */
var menuEl = $('#menu'), suppress = 0;
function closeMenu() {
  if (!menuEl.classList.contains('on')) return;
  menuEl.classList.remove('in'); setTimeout(function () { menuEl.classList.remove('on'); menuEl.innerHTML = ''; }, 200);
}
function openMenu(key, el) {
  var parts = key.split(':'), id = parts[1], seed = !C.leadStore().custom.some(function (x) { return x.id === id; });
  var rect = el.getBoundingClientRect(), items = [['Sửa', 'lead-edit'], [seed ? 'Ẩn' : 'Xoá', 'lead-del', 1]];
  var top = innerHeight - rect.bottom > 130 ? rect.bottom + 8 : Math.max(8, rect.top - 96 - 8), left = Math.min(Math.max(12, rect.left), innerWidth - 212);
  menuEl.innerHTML = '<div class="mdim" data-act="mclose"></div><div class="mpanel" role="menu" style="left:' + left + 'px;top:' + top + 'px;transform-origin:' + (top > rect.top ? 'top' : 'bottom') + ' left" data-k="' + key + '">' + items.map(function (it) {
    return '<button class="mi' + (it[2] ? ' dest' : '') + '" role="menuitem" data-act="mi" data-m="' + it[1] + '">' + it[0] + '</button>';
  }).join('') + '</div>';
  menuEl.classList.add('on');
  requestAnimationFrame(function () { menuEl.classList.add('in'); });
  hap(); suppress = Date.now() + 700;
}
function menuAct(m, key) {
  var parts = key.split(':'), id = parts[1], a = parts[2], s = topS();
  closeMenu(); if (!s) return;
  if (m === 'lead-edit') { s.state.edit = { a: a, id: id }; refreshLeadZone(s, a); }
  else if (m === 'lead-del') {
    var undo = removeLead(id);
    if (s.state.sel) Object.keys(s.state.sel).forEach(function (k) { if (s.state.sel[k] === id) delete s.state.sel[k]; });
    refreshLeadZone(s, a); refreshPreview(s);
    toast('Đã bỏ câu đệm', { undo: function () { undo(); refreshLeadZone(s, a); refreshPreview(s); } });
  }
}
(function () {
  var timer, sx, sy, el, pressRow, pressT;
  document.addEventListener('pointerdown', function (e) {
    var r = e.target.closest('.row');
    clearTimeout(pressT);
    if (r && !e.target.closest('button:not(.row)')) { pressRow = r; pressT = setTimeout(function () { if (pressRow) pressRow.classList.add('press'); }, 70); }
    var m = e.target.closest('[data-menu]');
    if (!m || e.target.closest('#menu')) return;
    sx = e.clientX; sy = e.clientY; el = m;
    clearTimeout(timer);
    timer = setTimeout(function () { clearTimeout(pressT); if (pressRow) pressRow.classList.remove('press'); openMenu(el.getAttribute('data-menu'), el); }, 450);
  }, { passive: true });
  document.addEventListener('pointermove', function (e) {
    if (timer && (Math.abs(e.clientX - sx) > 8 || Math.abs(e.clientY - sy) > 8)) { clearTimeout(timer); timer = 0; }
    if (pressRow && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) { clearTimeout(pressT); pressRow.classList.remove('press'); pressRow = null; }
  }, { passive: true });
  function up() { clearTimeout(timer); clearTimeout(pressT); timer = 0; if (pressRow) { pressRow.classList.remove('press'); pressRow = null; } }
  document.addEventListener('pointerup', up, { passive: true });
  document.addEventListener('pointercancel', up, { passive: true });
  document.addEventListener('contextmenu', function (e) { if (e.target.closest('[data-menu]')) e.preventDefault(); });
})();

/* ---------- dialogs ---------- */
function dlgBox(msg, buttons) {
  var d = document.createElement('div'); d.className = 'dlg'; d.setAttribute('role', 'alertdialog');
  d.innerHTML = '<div><p>' + esc(msg) + '</p><div class="bs">' + buttons.map(function (b, i) { return '<button class="' + (b[2] || '') + '" data-act="dbtn" data-i="' + i + '">' + esc(b[0]) + '</button>'; }).join('') + '</div></div>';
  d._fns = buttons.map(function (b) { return b[1]; }); $('#app').parentNode.appendChild(d);
}
function confirmBox(msg, okLabel, fn) { dlgBox(msg, [[okLabel, fn, 'dest'], ['Huỷ', null, '']]); }
function editProduct(id) { openSettings(['main', 'list:p', 'edit:p:' + id]); }
function editEntry(id) { openSettings(['main', 'list:f', 'edit:f:' + id]); }

/* ---------- settings sheet ---------- */
var CHIPTOK = ['{{item}}', '{{size}}', '{{itemInfo}}', '{{sizeChart}}', '{{sizeA}}', '{{sizeB}}'];
function openSettings(path) {
  pushSheet({ kind: 'settings', det: 'l', fixed: true, state: { path: path || ['main'] }, render: function (s) { return settingsPage(s); } });
}
function sNav(title, back) {
  return '<div class="drag"><i class="grab"></i><div class="sbar">' + (back ? '<button class="txtbtn" data-act="sback" style="display:flex;align-items:center;gap:2px;padding-left:0">' + ic('back', 's20') + 'Quay lại</button>' : '<span style="width:44px"></span>') + '<span class="tt">' + esc(title) + '</span><button class="txtbtn" data-act="shclose" style="font-weight:600">Xong</button></div></div>';
}
function srow(act, data, label, val, chev) { return '<button class="srw" data-act="' + act + '" ' + data + '><span class="l">' + label + '</span>' + (val != null ? '<span class="v">' + esc(val) + '</span>' : '') + (chev === false ? '' : ic('chev', 's13')) + '</button>'; }
function field(label, id, f, val, kind, tokens) {
  var isTa = kind === 'ta';
  return '<h3 class="h2">' + esc(label) + '</h3>' + (isTa ? '<textarea class="fld sel" data-ov="' + id + '" data-f="' + f + '" aria-label="' + esc(label) + '" rows="5">' + esc(val) + '</textarea>' + (tokens ? '<div class="chips" style="padding:0;margin-top:8px">' + CHIPTOK.map(function (t) { return '<button class="chip" data-act="ins" data-t="' + t + '" style="height:32px;font-weight:500;font-size:13px">' + t + '</button>'; }).join('') + '</div>' : '') :
    '<input class="fld sel" data-ov="' + id + '" data-f="' + f + '" ' + (kind === 'num' ? 'inputmode="numeric"' : '') + ' value="' + esc(val) + '" aria-label="' + esc(label) + '">');
}
function needCheck() { return PL.filter(function (p) { return p.truncated && p.truncated.some(function (f) { return !ov(p.id)[f]; }); }).length; }
function leadRows(a) {
  var s = C.leadStore(), seeds = SEED.leadIns[a] || [], out = [];
  s.custom.filter(function (x) { return x.action === a; }).forEach(function (x) { out.push(srow('spage', 'data-p="lead:' + a + ':' + x.id + '"', esc(short(x.vi || x.en || '(trống)', 34)), 'Của bạn')); });
  seeds.forEach(function (x) { var e = s.edits[x.id] || {}, hid = s.hidden.indexOf(x.id) > -1; out.push(srow('spage', 'data-p="lead:' + a + ':' + x.id + '"', esc(short((e.vi !== undefined ? e.vi : x.vi) || '(trống)', 34)), hid ? 'Đã ẩn' : e.vi !== undefined || e.en !== undefined ? 'Đã sửa' : x.seed === 'draft' ? 'Nháp' : null)); });
  return out;
}
function settingsPage(s) {
  var path = s.state.path, pg = path[path.length - 1], back = path.length > 1, body = '';
  var parts = pg.split(':');
  if (pg === 'main') {
    body = '<h3 class="h2" style="margin-top:8px">Ngôn ngữ đang dùng</h3>' + segHtml([['vi', 'Tiếng Việt'], ['en', 'English']], lang, 'setlang', 'full') + '<p class="foot">App nhớ ngôn ngữ bạn chọn lần cuối.</p>' +
      '<h3 class="h2">Đơn hàng</h3><div class="slist">' + srow('spage', 'data-p="ship"', 'Phí ship', money(st.set.fee, 'vi')) + srow('spage', 'data-p="bank"', 'Chuyển khoản', st.set.bank.no ? st.set.bank.no : 'Chưa có') + '</div>' +
      '<h3 class="h2">Nội dung</h3><div class="slist">' + srow('spage', 'data-p="list:p"', 'Mẫu', needCheck() ? needCheck() + ' cần kiểm tra' : PL.length) + srow('spage', 'data-p="leads"', 'Câu đệm') + srow('spage', 'data-p="sets"', 'Set', st.sets.length) + srow('spage', 'data-p="list:f"', 'Câu trả lời', FL.filter(function (e) { return !!groupOf(e.id); }).length) + srow('spage', 'data-p="ord"', 'Mẫu tóm tắt đơn') + '</div>' +
      '<h3 class="h2">Dữ liệu</h3><div class="slist">' + srow('export', '', 'Xuất bản sao lưu (.json)', null, false) + srow('import', '', 'Nhập bản sao lưu', null, false) + srow('resetall', '', 'Khôi phục nội dung gốc', null, false).replace('class="srw"', 'class="srw dest"') + '</div>' +
      '<p class="foot" style="text-align:center;margin-top:24px">Soft Embrace · 2.0<br>Làm bằng sự dịu dàng.</p>';
    return sNav('Tuỳ chỉnh', false) + '<div class="shb pad">' + body + '</div>';
  }
  var title;
  if (pg === 'ship') { title = 'Phí ship'; body = field('Phí ship (đ)', '__set', 'fee', st.set.fee, 'num') + '<p class="foot">Dùng khi chọn mức phí cố định trong đơn hàng.</p>'; }
  else if (pg === 'bank') { title = 'Chuyển khoản'; body = field('Ngân hàng', '__bank', 'name', st.set.bank.name) + field('Số tài khoản', '__bank', 'no', st.set.bank.no, 'num') + field('Chủ tài khoản', '__bank', 'holder', st.set.bank.holder) + '<p class="foot">Được thêm cuối tin nhắn chốt đơn khi bật “Kèm thông tin chuyển khoản”.</p>'; }
  else if (pg === 'ord') {
    title = 'Tóm tắt đơn';
    var o = st.ov.__ord || {};
    body = field('Tóm tắt đơn · VI', '__ord', 'vi', o.vi !== undefined ? o.vi : SEED.orderTemplate.vi, 'ta') + field('Order recap · EN', '__ord', 'en', o.en !== undefined ? o.en : C.normEn(SEED.orderTemplate.en), 'ta') + '<p class="foot">Dùng {{orderLines}} và {{total}}. Dòng “• Shipping…” được thay theo mức phí đã chọn.</p><button class="txtbtn" data-act="resetitem" data-id="__ord">Khôi phục bản gốc</button>';
  } else if (pg === 'leads') {
    title = 'Câu đệm';
    body = '<p class="foot" style="margin-top:8px">Câu ngắn gửi trước nội dung. Thêm nhanh ngay trong màn hình chép; ở đây để sửa, ẩn hoặc khôi phục.</p><div class="slist">' + ['info', 'size', 'order', 'thanks'].map(function (a) { return srow('spage', 'data-p="leadlist:' + a + '"', STR.lacts[a], leadRows(a).length); }).join('') + '</div>';
  } else if (parts[0] === 'leadlist') {
    title = STR.lacts[parts[1]];
    body = '<div class="slist" style="margin-top:8px">' + leadRows(parts[1]).join('') + srow('leadnew', 'data-a="' + parts[1] + '"', 'Thêm câu mới', null, false).replace('class="srw"', 'class="srw acc" style="color:var(--accent)"') + '</div><p class="foot">“Nháp” là câu do app soạn tạm, nên thay bằng câu bạn hay nói.</p>';
  } else if (parts[0] === 'lead') {
    var a = parts[1], lid = parts[2], ls = C.leadStore(), cu = ls.custom.filter(function (x) { return x.id === lid; })[0], seedx = (SEED.leadIns[a] || []).filter(function (x) { return x.id === lid; })[0], ee = ls.edits[lid] || {}, hid = ls.hidden.indexOf(lid) > -1;
    title = 'Sửa câu đệm';
    var vi = cu ? cu.vi : ee.vi !== undefined ? ee.vi : seedx.vi, en = cu ? cu.en : ee.en !== undefined ? ee.en : seedx.en;
    body = '<h3 class="h2">Tiếng Việt</h3><textarea class="fld sel" data-lfs="vi" data-id="' + lid + '" data-a="' + a + '" rows="3" aria-label="Tiếng Việt">' + esc(vi) + '</textarea><h3 class="h2">Tiếng Anh (tuỳ chọn)</h3><textarea class="fld sel" data-lfs="en" data-id="' + lid + '" data-a="' + a + '" rows="3" aria-label="Tiếng Anh">' + esc(en) + '</textarea><p class="saved" id="saved" style="text-align:right">Đã lưu</p>' +
      (cu ? '<button class="txtbtn dest" data-act="leadrm" data-id="' + lid + '">Xoá câu này</button>' : hid ? '<button class="txtbtn" data-act="leadshow" data-id="' + lid + '">Khôi phục (hiện lại)</button>' : '<button class="txtbtn" data-act="leadhide" data-id="' + lid + '">Ẩn câu này</button>') +
      (seedx && (ls.edits[lid]) ? ' <button class="txtbtn" data-act="leadreset" data-id="' + lid + '">Khôi phục bản gốc</button>' : '');
  } else if (pg === 'sets') {
    title = 'Set';
    body = st.sets.length ? '<div class="slist" style="margin-top:8px">' + st.sets.map(function (x) { return srow('setopen', 'data-id="' + x.id + '"', esc(C.setLabel(x)), money(C.setPrice(x), 'vi')); }).join('') + '</div>' : '<p class="foot" style="margin-top:8px">Chưa có set nào. Mở một mẫu rồi chạm “Ghép với mẫu khác”.</p>';
  } else if (parts[0] === 'list') {
    title = parts[1] === 'p' ? 'Mẫu' : 'Câu trả lời';
    var list = parts[1] === 'p' ? PL.map(function (p) { return srow('spage', 'data-p="edit:p:' + p.id + '"', esc(pv(p, 'emoji') + ' ' + pname(p, 'vi')), p.truncated && p.truncated.some(function (f) { return !ov(p.id)[f]; }) ? 'Cần kiểm tra' : null); }) :
      FL.filter(function (e) { return !!groupOf(e.id) || e.id === 'order-recap'; }).map(function (e) { return srow('spage', 'data-p="edit:f:' + e.id + '"', esc(eLabel(e)), st.ov[e.id] ? 'Đã sửa' : null); });
    body = '<div class="slist" style="margin-top:8px">' + list.join('') + '</div>';
  } else if (parts[0] === 'edit') {
    if (parts[1] === 'p') {
      var p = PM[parts[2]]; title = short(pname(p, 'vi'));
      body = field('Tên', p.id, 'name', pv(p, 'name')) + field('Emoji', p.id, 'emoji', pv(p, 'emoji')) + field('Giá (đ)', p.id, 'price', pv(p, 'price'), 'num') + field('Size (cách nhau dấu phẩy)', p.id, 'sizes', psizes(p).join(', ')) +
        field('Thông tin · VI', p.id, 'descVi', pv(p, 'descVi'), 'ta') + field('Thông tin · EN', p.id, 'descEn', pv(p, 'descEn'), 'ta') + field('Bảng size · VI', p.id, 'sizeVi', pv(p, 'sizeVi'), 'ta') + field('Bảng size · EN', p.id, 'sizeEn', pv(p, 'sizeEn'), 'ta') + field('Link bài viết Instagram', p.id, 'postUrl', pv(p, 'postUrl') || '') + field('Ghi chú nội bộ (không chép)', p.id, 'noteVi', pv(p, 'noteVi') || '', 'ta') +
        (p.truncated ? '<p class="foot" style="color:var(--destructive)">Cần kiểm tra: ' + p.truncated.join(', ') + ' trong sheet bị cắt.</p>' : '') + '<button class="txtbtn" data-act="resetitem" data-id="' + p.id + '">Khôi phục bản gốc</button>';
    } else {
      var e2 = FM[parts[2]]; title = short(eLabel(e2));
      body = field('Tên hiển thị', e2.id, 'labelVi', pv(e2, 'labelVi')) + field('Tin nhắn · VI', e2.id, 'vi', pv(e2, 'vi'), 'ta', 1) + field('Tin nhắn · EN', e2.id, 'en', pv(e2, 'en'), 'ta', 1) +
        '<p class="foot">Chèn {{item}}, {{size}}… để app tự điền.</p><button class="txtbtn" data-act="resetitem" data-id="' + e2.id + '">Khôi phục bản gốc</button>';
    }
  }
  return sNav(title, true) + '<div class="shb pad">' + body + (parts[0] === 'edit' || pg === 'ord' || pg === 'bank' || pg === 'ship' ? '<p class="saved" id="saved" style="text-align:right">Đã lưu</p>' : '') + '</div>';
}
function settingsGo(s, path, dir) {
  s.state.path = path;
  s.el.innerHTML = settingsPage(s);
  if (!reduce && s.el.animate) s.el.animate([{ opacity: 0, transform: 'translateX(' + (dir > 0 ? 30 : -30) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 280, easing: 'cubic-bezier(.32,.72,0,1)' });
  s.el.style.transform = 'translateY(0px)';
}
var saveFlash, ovT;
function flashSaved() { var sv = $('#saved'); if (sv) { sv.classList.add('on'); clearTimeout(saveFlash); saveFlash = setTimeout(function () { sv.classList.remove('on'); }, 1200); } }
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
  ovT = setTimeout(function () { IDX = null; renderHome(); updateOrderBar(); flashSaved(); }, 400);
}
function refreshAll() { IDX = null; renderHome(); updateOrderBar(); }

/* ---------- search ---------- */
var IDX = null, expanded = {};
function buildIndex() {
  IDX = [];
  PL.forEach(function (p) { IDX.push({ k: 'p', id: p.id, name: norm(pname(p, 'vi') + ' ' + pname(p, 'en')), title: norm(colorOf(p)), text: norm(ptext(p, 'desc', 'vi') + ' ' + ptext(p, 'desc', 'en')) }); });
  st.sets.forEach(function (x) { IDX.push({ k: 's', id: x.id, name: norm('set bo ' + C.setLabel(x)), title: '', text: '' }); });
  FL.forEach(function (e) { if (groupOf(e.id) || e.id === 'order-recap') IDX.push({ k: 'f', id: e.id, name: norm(eLabel(e)), title: norm(pv(e, 'titleVi') || ''), text: norm((pv(e, 'vi') || '') + ' ' + (pv(e, 'en') || '')) }); });
}
var lastRaw = null;
function doSearch(soft) {
  var raw = $('#q').value, q = norm(raw.trim()), box = $('#hbody');
  if (soft && raw === lastRaw) return;
  lastRaw = raw;
  if (!q) { expanded = {}; box.innerHTML = homeHtml; return; }
  if (!IDX) buildIndex();
  var hits = { p: [], s: [], f: [] }, h = '';
  IDX.forEach(function (x) {
    var r = x.name.indexOf(q) === 0 ? 0 : x.name.indexOf(q) > -1 ? 1 : x.title.indexOf(q) > -1 ? 2 : x.text.indexOf(q) > -1 ? 3 : -1;
    if (x.k === 's' && (q === 'set' || q === 'bo')) r = 0;
    if (r > -1) hits[x.k].push([r, x]);
  });
  var groups = [['p', 'Mẫu', function (x) { return pRow(PM[x.id]); }], ['s', 'Set', function (x) { var set = SM(x.id); return '<button class="row plain" data-open="s:' + x.id + '"><span class="rtxt"><span class="t">' + esc(C.setLabel(set)) + '</span><span class="sub s13">' + money(C.setPrice(set), 'vi') + '</span></span>' + ic('chev', 's13') + '</button>'; }],
    ['f', 'Câu trả lời', function (x) { return '<button class="row plain" data-open="f:' + x.id + '"><span class="rtxt"><span class="t">' + esc(eLabel(FM[x.id])) + '</span><span class="sub s13">' + esc(groupOf(x.id) || 'Đơn hàng') + '</span></span>' + ic('chev', 's13') + '</button>'; }]], any = false;
  if (q === 'set' || q === 'bo') groups.unshift(groups.splice(1, 1)[0]);
  groups.forEach(function (g) {
    var a = hits[g[0]].sort(function (x, y) { return x[0] - y[0]; }); if (!a.length) return; any = true;
    var shown = expanded[g[0]] ? a : a.slice(0, 5);
    h += '<h2 class="cap">' + g[1] + '</h2><div class="grp">' + shown.map(function (x) { return g[2](x[1]); }).join('') + '</div>' + (a.length > 5 && !expanded[g[0]] ? '<button class="txtbtn" data-act="more" data-g="' + g[0] + '" style="margin:4px calc(var(--margin) + 8px)">Xem tất cả ' + a.length + '</button>' : '');
  });
  if (!any) h = '<div class="empty">' + ic('search', 's34') + '<div class="tt">Chưa tìm thấy “' + esc(raw.trim()) + '”</div><p>Thử một tên ngắn hơn nhé.</p></div>';
  box.innerHTML = h;
}
(function () {
  var vv = window.visualViewport, box = $('#home'), pend = 0;
  if (!vv) return;
  function upd() {
    if (pend) return; pend = 1;
    requestAnimationFrame(function () { pend = 0; box.style.setProperty('--kb', Math.max(0, innerHeight - vv.height - vv.offsetTop) + 'px'); });
  }
  vv.addEventListener('resize', upd); vv.addEventListener('scroll', upd);
})();
var sq = 0;
function queueSearch() { if (!sq) sq = requestAnimationFrame(function () { sq = 0; doSearch(true); }); }
$('#q').addEventListener('input', queueSearch);
$('#q').addEventListener('compositionend', queueSearch);

/* ---------- main click delegation ---------- */
document.addEventListener('click', function (e) {
  if (Date.now() < suppress && !e.target.closest('#menu')) { e.preventDefault(); return; }
  var t = e.target.closest('[data-act],[data-open]'); if (!t) return;
  var a = t.getAttribute('data-act'), id = t.getAttribute('data-id'), v = t.getAttribute('data-v');
  if (!a && t.hasAttribute('data-open')) {
    var o = t.getAttribute('data-open'), k = o.charAt(0), oid = o.slice(2);
    if (k === 'p') openProduct(oid); else if (k === 's') openSet(oid); else openEntry(oid);
    return;
  }
  var s = topS(), A = t.dataset.a;
  switch (a) {
    case 'lang': setLang(v); break;
    case 'qclear': $('#q').value = ''; $('#q').focus(); doSearch(); break;
    case 'more': expanded[t.dataset.g] = 1; lastRaw = null; doSearch(); break;
    case 'hintx': hintDone(); break;
    case 'settings': openSettings(); break;
    case 'replies': openReplies(); break;
    case 'openorder': openOrder(); break;
    case 'editf': editEntry(id); break;
    case 'editp': editProduct(id); break;
    case 'bankset': openSettings(['main', 'bank']); break;
    case 'shclose': case 'shdim': closeTop(); break;
    case 'mclose': closeMenu(); break;
    case 'mi': menuAct(t.dataset.m, $('.mpanel', menuEl).dataset.k); break;
    /* product sheet */
    case 'popen': s.state.open = A; s.state.edit = null; s.state.full = false; rerender(s); break;
    case 'pcopy': productCopy(s, A, t); break;
    case 'pcopyalt': productCopy(s, A, t, other(lang)); break;
    case 'pcopyset': { var set = SM(id); bubbleCopy(s, t, 'a', null, set); break; }
    case 'moreprev': s.state.full = !s.state.full; checkMore(s); break;
    case 'addline': {
      addLine(id, v); toast('Đã thêm ' + pname(PM[id], 'vi') + ' · ' + v + ' vào đơn');
      var q = lineQty(id, v); t.innerHTML = v + '<span class="n"> · ' + q + '</span>';
      break;
    }
    case 'setpick': openSetPicker(id); break;
    /* lead-ins */
    case 'lead': leadClick(s, t); break;
    case 'leadadd': s.state.edit = { a: A, id: null }; refreshLeadZone(s, A); break;
    case 'leadcancel': { var ed = s.state.edit; s.state.edit = null; if (ed) refreshLeadZone(s, ed.a); break; }
    case 'leadsave': leadSave(s, t); break;
    /* replies / message */
    case 'fill': {
      s.state.fills[t.dataset.k] = v;
      if (t.dataset.k === 'item') { setCtxQuiet(v, ctx() && ctx().itemId === v ? ctx().size : null); var sz = psizes(PM[v]); if (s.state.fills.size && sz.indexOf(s.state.fills.size) < 0) delete s.state.fills.size; }
      else if (t.dataset.k === 'size') { setCtxQuiet(ctx() ? ctx().itemId : null, v); }
      rerender(s); break;
    }
    case 'pickfill': {
      var kk = t.dataset.k, ms = s;
      openPicker('pick', function (pid) { ms.state.fills[kk] = pid; if (kk === 'item') setCtxQuiet(pid, ctx() && ctx().itemId === pid ? ctx().size : null); rerender(ms); });
      break;
    }
    case 'pickone': {
      var ps = s.state;
      if (ps.mode === 'setnew') {
        if (!ps.first) { ps.first = id; $('#plist', s.el).innerHTML = pickerList(s); break; }
        if (ps.first === id) break;
      }
      var cb = ps.cb, f1 = ps.first; closeSheet(s); cb(f1 ? [f1, id] : id); break;
    }
    case 'pickadd': addLine(id, v); toast('Đã thêm ' + pname(PM[id], 'vi') + ' · ' + v + ' vào đơn'); t.classList.add('sealed'); setTimeout(function () { closeSheet(s); }, 250); break;
    case 'tok': { var row = s.el.querySelector('[data-k="' + t.dataset.k + '"]:not(.tok)') || s.el.querySelector('[data-fill="' + t.dataset.k + '"]'); var fr = (row || t).closest('.frow'); if (fr) { fr.scrollIntoView({ block: 'nearest' }); var inp = fr.querySelector('input'); if (inp) inp.focus(); } break; }
    case 'msgcopy': msgCopy(s, t); break;
    /* order */
    case 'sugg': { var c = ctx(); addLine(c.itemId, c.size); toast('Đã thêm ' + pname(PM[c.itemId], 'vi') + ' · ' + c.size + ' vào đơn'); break; }
    case 'addpick': openPicker('order'); break;
    case 'lineopen': if (!e.target.closest('[data-act=linesize],[data-act=qty],[data-act=linedel],.lexp')) { ordUI.open = ordUI.open === +t.dataset.i ? -1 : +t.dataset.i; rerender(s); } break;
    case 'linesize': { var L = st.draft.lines[+t.dataset.i], dup = st.draft.lines.find(function (x, j) { return j !== +t.dataset.i && x.pid === L.pid && x.size === v; }); if (dup) { dup.qty = Math.min(9, dup.qty + L.qty); st.draft.lines.splice(+t.dataset.i, 1); ordUI.open = -1; } else L.size = v; save(); updateOrderBar(); rerender(s); e.stopPropagation(); break; }
    case 'qty': { var L2 = st.draft.lines[+t.dataset.i]; L2.qty = Math.max(1, Math.min(9, L2.qty + (+t.dataset.d))); save(); updateOrderBar(); rerender(s); e.stopPropagation(); break; }
    case 'linedel': { var i2 = +t.dataset.i, snap = JSON.stringify(st.draft); var nm = PM[st.draft.lines[i2].pid]; st.draft.lines.splice(i2, 1); ordUI.open = -1; save(); updateOrderBar(); rerender(s); toast('Đã xoá ' + pname(nm, 'vi'), { undo: function () { st.draft = JSON.parse(snap); save(); updateOrderBar(); var os = sheetOf('order'); if (os) rerender(os); } }); e.stopPropagation(); break; }
    case 'ship': st.draft.ship = v; save(); updateOrderBar(); rerender(s); break;
    case 'pasteinfo': try { navigator.clipboard.readText().then(function (x) { st.draft.info = x; save(); rerender(s); }, function () { var ta = $('[data-in=info]'); if (ta) ta.focus(); }); } catch (x) { var ta2 = $('[data-in=info]'); if (ta2) ta2.focus(); } break;
    case 'prevtoggle': ordUI.prev = !ordUI.prev; rerender(s); break;
    case 'copyorder': {
      if (!st.draft.lines.length) break;
      var r = C.composeCopy('order', { sel: s.state.sel }, lang), total = calc().total;
      copy(r.text, { btn: t, msg: 'Đã chép đơn · ' + money(total, lang) + ' · ' + lu(), sub: 'Nhớ gửi mã QR nhé', icon: 'clip', label: 'Đơn', lang: lang, done: function (ok) { if (ok) { commitLeads(r.leadIds); st.draft.copiedAt = Date.now(); save(); afterPaint(function () { var sb = s.el.querySelector('.shb'); if (sb && !sb.querySelector('.ocard')) sb.insertAdjacentHTML('afterbegin', thankCard(s)); }); } } });
      break;
    }
    case 'thank': { var rt = C.composeCopy('thanks', { sel: s.state.sel }, lang); if (rt.missing) { toast('Chưa có bản ' + lu(), { bad: true }); break; } copy(rt.text, { btn: t, label: 'Lời cảm ơn', lang: lang, done: function (ok) { if (ok) commitLeads(rt.leadIds); } }); break; }
    case 'neworder': { var sn = JSON.stringify(st.draft); st.draft = { lines: [], ship: 'courier', custom: 0, info: '', bank: true, copiedAt: 0 }; ordUI.open = -1; save(); updateOrderBar(); closeSheet(s, true); toast('Đã làm mới đơn', { undo: function () { st.draft = JSON.parse(sn); save(); updateOrderBar(); } }); break; }
    case 'undo': if (toast.undoFn) { toast.undoFn(); toast.undoFn = null; $('.toast', toastEl) && $('.toast', toastEl).remove(); } break;
    /* sets */
    case 'setnew': openPicker('setnew', function (pair) { var set = createSet(pair); openSet(set.id); }, { title: 'Chọn 2 mẫu cho set' }); break;
    case 'bcopy': bubbleCopy(s, t, t.dataset.b, t.dataset.alt ? other(lang) : null); break;
    case 'bfull': s.state.full[t.dataset.b] = !s.state.full[t.dataset.b]; rerender(s); break;
    case 'setok': SM(s.state.id).checked = true; save(); rerender(s); break;
    case 'setsugg': { var sx = createSet([t.dataset.a, t.dataset.b], false); openSet(sx.id); break; }
    case 'linktoggle': s.state.link = !s.state.link; t.setAttribute('aria-pressed', !!s.state.link); refreshPreview(s, false); break;
    case 'linkedit': s.state.edit = { a: 'link' }; refreshLeadZone(s, 'link'); break;
    case 'linksave': { var pu = $('[data-lead=link] textarea', s.el).value.trim(); st.ov[s.state.id] = st.ov[s.state.id] || {}; st.ov[s.state.id].postUrl = pu; if (!pu) s.state.link = false; s.state.edit = null; save(); refreshLeadZone(s, 'link'); refreshPreview(s); break; }
    case 'setovedit': s.state.ed = 'ov'; rerender(s); break;
    case 'setovcancel': s.state.ed = null; rerender(s); break;
    case 'setovsave': { var set3 = SM(s.state.id), tx = $('[data-ovta]', s.el).value.trim(); var auto = C.setBubble(Object.assign({}, set3, { ov: {} }), 'a', lang); set3.ov = set3.ov || {}; set3.ov[lang] = tx && tx !== auto.text ? tx : null; s.state.ed = null; save(); rerender(s); break; }
    case 'setovreset': { var set4 = SM(s.state.id); set4.ov[lang] = null; save(); rerender(s); break; }
    case 'setadd': { var set5 = SM(s.state.id), ms2 = s; openPicker('setadd', function (pid) { set5.items.push(pid); save(); rerender(ms2); }, { title: 'Thêm mẫu vào set', skip: set5.items }); break; }
    case 'setdel': { var set6 = SM(s.state.id), ss = s; confirmBox('Xoá set này?', 'Xoá', function () { st.sets = st.sets.filter(function (x) { return x !== set6; }); save(); IDX = null; closeSheet(ss); toast('Đã xoá set'); }); break; }
    /* settings */
    case 'spage': settingsGo(s, s.state.path.concat([t.dataset.p]), 1); break;
    case 'sback': settingsGo(s, s.state.path.slice(0, -1), -1); break;
    case 'setopen': closeSheet(s); openSet(id); break;
    case 'setlang': lang = v; st.set.lang = v; save(); rerender(s); break;
    case 'ins': { var ta = s.state.lastTa; if (ta) { ta.setRangeText(t.dataset.t, ta.selectionStart, ta.selectionEnd, 'end'); ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus(); } break; }
    case 'resetitem': delete st.ov[id]; save(); refreshAll(); settingsGo(s, s.state.path, 0); toast('Đã khôi phục bản gốc'); break;
    case 'leadnew': { var nid = addLead(A, 'vi', ''); settingsGo(s, s.state.path.concat(['lead:' + A + ':' + nid]), 1); break; }
    case 'leadrm': { var u = removeLead(id); settingsGo(s, s.state.path.slice(0, -1), -1); toast('Đã xoá câu đệm', { undo: u }); break; }
    case 'leadhide': { var u2 = removeLead(id); settingsGo(s, s.state.path, 0); toast('Đã ẩn câu đệm', { undo: function () { u2(); } }); break; }
    case 'leadshow': { var ls = C.leadStore(); ls.hidden = ls.hidden.filter(function (x) { return x !== id; }); save(); settingsGo(s, s.state.path, 0); break; }
    case 'leadreset': delete C.leadStore().edits[id]; save(); settingsGo(s, s.state.path, 0); break;
    case 'resetall': confirmBox('Khôi phục toàn bộ nội dung gốc? Các chỉnh sửa của bạn sẽ mất.', 'Khôi phục', function () { st.ov = {}; st.lead = { sel: {}, custom: [], edits: {}, hidden: [] }; save(); refreshAll(); toast('Nội dung gốc đã được khôi phục'); }); break;
    case 'export': {
      var blob = new Blob([JSON.stringify({ v: 2, ov: st.ov, set: st.set, lead: st.lead, sets: st.sets }, null, 1)], { type: 'application/json' }), a2 = document.createElement('a');
      a2.href = URL.createObjectURL(blob); a2.download = 'softembrace-backup.json'; document.body.appendChild(a2); a2.click(); a2.remove(); setTimeout(function () { URL.revokeObjectURL(a2.href); }, 2000); break;
    }
    case 'import': $('#imp').click(); break;
    case 'dbtn': { var dd = t.closest('.dlg'), fn = dd._fns[+t.dataset.i]; dd.remove(); if (fn) fn(); break; }
  }
});
$('#imp').addEventListener('change', function (e) {
  var f = e.target.files[0]; if (!f) return;
  var rd = new FileReader();
  rd.onload = function () {
    try {
      var j = JSON.parse(rd.result); if (!j || typeof j.ov !== 'object') throw 0;
      confirmBox('Thay nội dung hiện tại bằng bản sao lưu?', 'Thay thế', function () { st.ov = j.ov; if (j.set) st.set = Object.assign(st.set, j.set); if (j.lead) st.lead = Object.assign({ sel: {}, custom: [], edits: {}, hidden: [] }, j.lead); if (j.sets) st.sets = j.sets; save(); refreshAll(); toast('Đã nhập bản sao lưu'); });
    } catch (x) { toast('File sao lưu không hợp lệ', { bad: true }); }
  };
  rd.readAsText(f); e.target.value = '';
});
/* inputs (delegated) */
document.addEventListener('input', function (e) {
  var t = e.target, s = topS();
  if (t.matches('[data-fill]') && s) { s.state.fills[t.dataset.fill] = t.value; refreshMsg(s); }
  else if (t.matches('[data-pq]') && s) { s.state.q = t.value; $('#plist', s.el).innerHTML = pickerList(s); }
  else if (t.matches('[data-sprice]') && s) { var d0 = t.value.replace(/\D/g, ''); SM(s.state.id).price = d0 ? parseInt(d0, 10) : null; save(); grow(t); refreshSet(s); }
  else if (t.matches('[data-lfi],[data-ovta]')) grow(t);
  else if (t.matches('[data-lfs]')) {
    var lid = t.dataset.id, ls = C.leadStore(), cu = ls.custom.filter(function (x) { return x.id === lid; })[0];
    if (cu) cu[t.dataset.lfs] = t.value; else { ls.edits[lid] = ls.edits[lid] || {}; ls.edits[lid][t.dataset.lfs] = t.value; }
    save(); flashSaved();
  }
  else if (t.matches('[data-ov]')) onOvInput(t);
  else if (t.matches('[data-in=info]')) { st.draft.info = t.value; save(); var pr = $('#ordprev'); if (pr && s) pr.textContent = sheetCompose(s).text; }
  else if (t.matches('[data-in=custom]')) { st.draft.custom = parseInt(t.value.replace(/\D/g, ''), 10) || 0; t.value = st.draft.custom ? nfV.format(st.draft.custom) : ''; save(); softTotals(); }
});
document.addEventListener('change', function (e) {
  var t = e.target, s0 = topS();
  if (t.matches('[data-spurl]') && s0) { SM(s0.state.id).postUrl = t.value.trim(); save(); rerender(s0); return; }
  if (t.matches('[data-in=bank]')) { st.draft.bank = t.checked; save(); var pr = $('#ordprev'), s = topS(); if (pr && s) pr.textContent = sheetCompose(s).text; }
});
document.addEventListener('focusin', function (e) { var s = topS('settings'); if (s && e.target.matches('textarea')) s.state.lastTa = e.target; });
function softTotals() { var c = calc(), tv = $('.ofoot .tv'); if (tv) tv.textContent = money(c.total, lang); updateOrderBar(); }
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('[data-fill],[data-pq],#q,[data-in=custom]')) e.target.blur(); });

/* ---------- boot ---------- */
paintGreet();
$('#hint').hidden = !!st.hintDone;
renderHome();
updateOrderBar();
observe();
idle(function () { if (!IDX) buildIndex(); idle(measureSafe); });
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', function () {
    var had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(function () { /* no worker: the app still runs online */ });
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (had) toast('Có bản mới — đóng và mở lại app nhé', { icon: 'sparkle', ms: 4000 }); had = true; });
  });
}
window.__SE = { boot: performance.now() - T0, st: st, calc: calc, composeCopy: C.composeCopy };
})();
