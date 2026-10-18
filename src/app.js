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
st.ui = Object.assign({ stage: 'greet' }, st.ui || {});
var saveT;
function save() { clearTimeout(saveT); saveT = setTimeout(flush, 300); }
function flush() { try { localStorage.setItem(LS, JSON.stringify(st)); } catch (e) { /* storage blocked: stay in memory */ } }
document.addEventListener('visibilitychange', function () { if (document.hidden) { st.active = Date.now(); flush(); } });
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
function mtext(e, l, fills) {
  var et = entryText(e, l);
  if (GREET[e.id]) { if (fills && fills.item) { if (!/\{\{itemInfo\}\}/.test(et.text)) et.text = et.text + '\n\n{{itemInfo}}'; } else et.text = clean(greetOnly(et.text)); }
  return et;
}

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
function resolve(tpl, l, fills, html, mark) {
  var missing = [], out = '', vals = [];
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
    if (v == null || v === '') { if (missing.indexOf(k) < 0) missing.push(k); if (mark) vals.push([t, '[' + (STR.tokl[k] || k) + ']']); }
    else vals.push([t, String(v)]);
    if (mark && !html) { out += v == null || v === '' ? '[' + (STR.tokl[k] || k) + ']' : v; continue; }
    if (html) out += '<span class="tok' + (v == null || v === '' ? '' : ' ok') + '" data-act="tok" data-k="' + k + '">' + (v == null || v === '' ? esc(STR.tokl[k] || k) : esc(v)) + '</span>';
    else out += v == null ? '' : v;
  }
  return { text: html ? out : clean(out), missing: missing, vals: vals };
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

/* ---------- shell: header, dock (stages + two top-level views), pages ---------- */
var UI = { top: 'qr', view: 'p', more: {}, ordOpen: -1, oq: '' };
var PAGE = { kind: 'page', state: { ed: {}, sel: {}, edit: null }, el: $('#stage') };
var qrEl = $('#qr'), piEl = $('#pi');
var GLBL = { greet: 'Chào hỏi', size: 'Tư vấn size', info: 'Xin thông tin', order: 'Tạo đơn', out: 'Check out' };
function entryHidden(e) { return !entryText(e, 'vi').text.trim() && !entryText(e, 'en').text.trim(); }
function groupOf(id) { return GLBL[C.stageOf(id)] || ''; }
function stageDef(id) { return C.STAGES.filter(function (g) { return g.id === id; })[0] || C.STAGES[0]; }
function paintDock() {
  $('#stages').innerHTML = C.STAGES.map(function (g) {
    var n = g.id === 'order' ? calc().qty : 0;
    return '<button class="stb" data-act="stage" data-v="' + g.id + '" aria-pressed="' + (g.id === st.ui.stage) + '"' + (n ? ' data-n="' + n + '" aria-label="' + esc(g.lab[0].join(' ')) + ', ' + n + ' món"' : '') + '>' + g.lab[0].map(function (w) { return '<span>' + esc(w) + '</span>'; }).join(' ') + '</button>';
  }).join('');
}
function paintLang() { $$('#lsw button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === lang); }); }
function setTop(v) {
  UI.top = v; qrEl.hidden = v !== 'qr'; piEl.hidden = v !== 'pi';
  document.body.classList.toggle('pi', v === 'pi');
  $$('#tabs .tbb').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === v); });
  if (v === 'pi') renderPI(); else renderStage();
  paintDock(); updateOrderBar();
}
function gotoStage(id) {
  closeAllSheets(); st.ui.stage = id; save();
  if (UI.top !== 'qr') setTop('qr'); else { renderStage(); paintDock(); updateOrderBar(); }
  qrEl.scrollTop = 0;
}
function entrySub(e) {
  if (entryHidden(e)) return 'Gửi kèm tệp: ' + (e.attach || eLabel(e));
  var tx = mtext(e, lang).text, x = tx.replace(/\{\{(\w+)\}\}/g, '…').replace(/\s+/g, ' ').trim();
  return x || entryText(e, 'vi').text.replace(/\{\{(\w+)\}\}/g, '…').replace(/\s+/g, ' ').trim();
}
function qcard(c) {
  if (c.kind === 'info' || c.kind === 'size') {
    return '<div class="qc chipc"><span class="qt"><span class="t">' + esc(c.t) + '</span><span class="s">' + esc(c.s) + '</span></span><div class="chips">' + candidates().map(function (id) { return '<button class="chip" data-act="pchip" data-id="' + id + '" data-v="' + c.kind + '">' + esc(pname(PM[id], 'vi')) + '</button>'; }).join('') + '</div></div>';
  }
  var e = FM[c.id]; if (!e) return '';
  return '<button class="qc" data-open="f:' + c.id + '"><span class="qt"><span class="t">' + esc(c.t) + '</span><span class="s">' + esc(entrySub(e)) + '</span></span>' + ic('chev', 's13') + '</button>';
}
function renderStage() {
  var g = stageDef(st.ui.stage), h = '<p class="sdesc">' + esc(g.desc) + '</p>';
  if (g.id === 'order') h += orderStageHtml();
  else {
    h += '<div class="qlist">' + g.cards.map(qcard).join('') + '</div>';
    if (g.more.length) {
      var on = !!UI.more[g.id];
      h += '<button class="morebtn" data-act="stmore" aria-expanded="' + on + '">' + ic('chev', 's13') + 'Thêm</button>' + (on ? '<div class="qlist">' + g.more.map(qcard).join('') + '</div>' : '');
    }
  }
  PAGE.el.innerHTML = h; qrEl.classList.toggle('o', g.id === 'order');
  if (g.id === 'order') growAll(PAGE.el);
}
/* product tab */
var homeHtml = '';
function renderPI() {
  $$('.sub2 button').forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === UI.view); });
  $('#sfield').style.display = UI.view === 'p' ? '' : 'none';
  if (UI.view === 'p') renderHome(); else $('#hbody').innerHTML = setsViewHtml();
}
function setsViewHtml() {
  var h = '<h2 class="cap">Set đã lưu</h2><div class="grp">' + st.sets.map(function (x) {
    return '<button class="row plain" data-open="s:' + x.id + '"><span class="rtxt"><span class="t">' + esc(C.setLabel(x)) + '</span><span class="sub s13">' + money(C.setPrice(x), 'vi') + '</span></span>' + ic('chev', 's13') + '</button>';
  }).join('') + '<button class="row plain" data-act="setnew"><span class="rtxt"><span class="t">Tạo set mới</span><span class="sub s13">Chọn 2 mẫu</span></span>' + ic('plus', 's15') + '</button></div>';
  var sg = suggestions();
  if (sg.length) h += '<h2 class="cap">Gợi ý ghép từ bài đăng</h2><div class="grp">' + sg.map(function (x) { return '<button class="row plain" data-act="setsugg" data-a="' + x[0] + '" data-b="' + x[1] + '"><span class="rtxt"><span class="t">' + esc(C.setLabel({ items: x })) + '</span><span class="sub s13">kiểm tra giá trước khi gửi</span></span>' + ic('chev', 's13') + '</button>'; }).join('') + '</div>';
  return h;
}
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
function renderHome() {
  homeHtml = '<h2 class="cap">Mẫu · ' + PL.length + '</h2>' + grp(PL, pRow);
  if ($('#q').value.trim()) doSearch(); else $('#hbody').innerHTML = homeHtml;
}

/* ---------- order bar: shortcut to the "Tạo đơn" stage ---------- */
function updateOrderBar() {
  var c = calc(), b = $('#obar'), txt = 'Đơn · ' + c.qty + ' món · ' + money(c.total, 'vi');
  var show = c.count > 0 && !(UI.top === 'qr' && st.ui.stage === 'order');
  document.body.classList.toggle('has-order', show);
  if (!show) { b.hidden = true; return; }
  if (b.hidden || !b.firstChild) { b.innerHTML = '<span class="ot">' + esc(txt) + '</span><button class="btn sm" data-act="openorder">Xem đơn</button>'; b.hidden = false; }
  else b.firstChild.textContent = txt;
}
function bump() { var b = $('#obar'); if (b.animate && !reduce && !b.hidden) b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.04)' }, { transform: 'scale(1)' }], { duration: 300 }); }
function addLine(pid, size, qty) {
  var d = st.draft, f = d.lines.find(function (L) { return L.pid === pid && L.size === size; });
  if (f) f.qty = Math.min(9, f.qty + (qty || 1)); else d.lines.push({ pid: pid, size: size, qty: qty || 1 });
  setCtxQuiet(pid, size); save(); orderChanged(); bump();
}
function lineQty(pid, size) { var f = st.draft.lines.filter(function (L) { return L.pid === pid && L.size === size; })[0]; return f ? f.qty : 0; }
function orderChanged() { updateOrderBar(); paintDock(); if (UI.top === 'qr' && st.ui.stage === 'order') redrawOrder(); }

/* ---------- order composer (stage "Tạo đơn") ---------- */
function oresHtml() {
  var q = norm(UI.oq || ''), ids = q ? PL.filter(function (p) { return norm(pname(p, 'vi') + ' ' + colorOf(p)).indexOf(q) > -1; }).map(function (p) { return p.id; }).slice(0, 8) : candidates().slice(0, 4);
  if (!ids.length) return '<p class="foot">Chưa tìm thấy mẫu nào.</p>';
  return (q ? '' : '<h3 class="h2" style="margin-top:4px">Mẫu gần đây</h3>') + '<div class="grp">' + ids.map(function (id) {
    var p = PM[id];
    return '<div class="row" style="flex-direction:column;align-items:stretch;gap:2px;padding:8px 16px 10px"><span class="rtxt" style="padding:0"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub num">' + money(pv(p, 'price'), 'vi') + '</span></span><span class="chips">' + psizes(p).map(function (z) {
      var n = lineQty(id, z);
      return '<button class="chip tall" data-act="oadd" data-id="' + id + '" data-v="' + z + '" aria-label="Thêm ' + esc(pname(p, 'vi')) + ' size ' + z + '">' + z + (n ? '<span class="n"> · ' + n + '</span>' : '') + '</button>';
    }).join('') + '</span></div>';
  }).join('') + '</div>';
}
function olinesHtml() {
  var d = st.draft, rows = '';
  d.lines.forEach(function (L, i) {
    var p = PM[L.pid]; if (!p) return;
    rows += '<div class="row lrow' + (UI.ordOpen === i ? ' open' : '') + '" data-act="lineopen" data-i="' + i + '"><div class="lm"><span class="disc">' + esc(pv(p, 'emoji')) + '</span><span class="rtxt"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub">Size ' + L.size + ' · SL ' + L.qty + '</span></span><span class="pr">' + money(pv(p, 'price') * L.qty, 'vi') + '</span></div>' +
      '<div class="lexp"><div class="chips wrapc">' + psizes(p).map(function (z) { return '<button class="chip" data-act="linesize" data-i="' + i + '" data-v="' + z + '" aria-pressed="' + (z === L.size) + '">' + z + '</button>'; }).join('') + '</div>' +
      '<span class="step"><button data-act="qty" data-i="' + i + '" data-d="-1" aria-label="Giảm">' + ic('minus') + '</button><span class="v num">' + L.qty + '</span><button data-act="qty" data-i="' + i + '" data-d="1" aria-label="Tăng">' + ic('plus') + '</button></span>' +
      '<button class="txtbtn dest" data-act="linedel" data-i="' + i + '">Xoá</button></div></div>';
  });
  return rows ? '<div class="grp" style="margin-bottom:10px">' + rows + '</div>' : '<p class="foot" style="margin:0 0 8px">Chưa có món nào. Chạm size bên dưới để thêm.</p>';
}
function oshipHtml() {
  var d = st.draft, labels = [['courier', 'Trả shipper'], ['fee', money(st.set.fee, 'vi')], ['free', 'Freeship'], ['custom', 'Khác']], idx = labels.findIndex(function (x) { return x[0] === d.ship; });
  return '<div class="seg full" role="group" aria-label="Phí ship" style="--n:4"><span class="th" style="--n:4;width:calc((100% - 4px)/4);transform:translateX(' + (idx * 100) + '%)"></span>' + labels.map(function (x) { return '<button data-act="ship" data-v="' + x[0] + '" aria-pressed="' + (d.ship === x[0]) + '" style="min-width:0;padding:0 4px">' + esc(x[1]) + '</button>'; }).join('') + '</div>' +
    (d.ship === 'custom' ? '<input class="fld" style="margin-top:8px" inputmode="numeric" data-in="custom" placeholder="Nhập phí ship (đ)" value="' + (d.custom ? nfV.format(d.custom) : '') + '" aria-label="Phí ship khác">' : '');
}
function ofootHtml() {
  var c = calc();
  return '<div><div class="tl">' + (c.count ? 'Tổng · ' + c.qty + ' món' : 'Chưa có món') + '</div><div class="tv num">' + money(c.total, lang) + '</div></div><button class="btn" id="obtn" data-act="copyorder"' + (c.count ? '' : ' disabled') + '>' + lblBtn('Chép đơn · ' + lu()) + '</button>';
}
function tnoteHtml() {
  var t = ebVal(PAGE, 'order'), has = /chuyển khoản|transfer note/i.test(t) && /instagram/i.test(t);
  return has ? '<div class="tnote">' + ic('check', 's15') + 'Đã kèm hướng dẫn ghi tên Instagram khi chuyển khoản</div>' : '<div class="tnote" style="color:var(--destructive)">' + ic('warn', 's15') + 'Tin chưa có hướng dẫn nội dung chuyển khoản</div>';
}
function postCardHtml() {
  return st.draft.copiedAt && Date.now() - st.draft.copiedAt < 864e5 ? '<button class="qc postcard" data-act="stage" data-v="out"><span class="qt"><span class="t">Khách đã chuyển khoản?</span><span class="s">Sang Check out để cảm ơn và gửi mã vận đơn</span></span>' + ic('chev', 's13') + '</button>' : '';
}
function orderStageHtml() {
  var d = st.draft, h = '<div class="ostage">';
  h += '<div class="hrow"><h3 class="h2">1 · Món trong đơn</h3><button class="txtbtn" data-act="neworder">Đơn mới</button></div><div id="olines">' + olinesHtml() + '</div>';
  h += '<div class="oadd">' + ic('search') + '<input id="oq" data-oq type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Tìm mẫu để thêm…" aria-label="Tìm mẫu để thêm" value="' + esc(UI.oq) + '"></div><div class="ores" id="ores">' + oresHtml() + '</div>';
  h += '<h3 class="h2">2 · Phí ship</h3><div id="oship">' + oshipHtml() + '</div>';
  h += '<h3 class="h2">3 · Thông tin nhận (tuỳ chọn)</h3><div style="position:relative"><textarea class="ta sel" data-in="info" placeholder="Dán tên, SĐT, địa chỉ khách gửi…" aria-label="Thông tin nhận" style="padding-right:48px">' + esc(d.info) + '</textarea><button class="iconbtn" data-act="pasteinfo" aria-label="Dán" style="position:absolute;right:2px;top:2px"><span class="c bare">' + ic('paste', 's20') + '</span></button></div>';
  h += st.set.bank.no ? '<div class="swrow"><span>Kèm thông tin chuyển khoản</span><label class="sw"><input type="checkbox" switch data-in="bank" aria-label="Kèm thông tin chuyển khoản"' + (d.bank ? ' checked' : '') + '><i></i></label></div>' : '<button class="swrow" data-act="bankset"><span>Thêm STK để kèm vào đơn</span>' + ic('chev', 's13') + '</button>';
  h += '<h3 class="h2">4 · Tin nhắn chốt đơn</h3>' + ebHtml(PAGE, 'order', { label: 'Tin nhắn chốt đơn — chạm để sửa' }) + leadZone(PAGE, 'order') + '<div id="tnote">' + tnoteHtml() + '</div><div id="opost">' + postCardHtml() + '</div>';
  h += '<div class="ofoot" id="ofoot">' + ofootHtml() + '</div></div>';
  return h;
}
function redrawOrder() {
  if (!$('#olines')) return;
  $('#olines').innerHTML = olinesHtml(); $('#ores').innerHTML = oresHtml(); $('#oship').innerHTML = oshipHtml(); $('#ofoot').innerHTML = ofootHtml();
  refreshPreview(PAGE);
}

/* ---------- sheets ---------- */
var SH = [], sheetsEl = $('#sheets'), appEl = $('#app'), SAFE_TOP = null;
function measureSafe() { var d = document.createElement('div'); d.style.cssText = 'position:absolute;visibility:hidden;width:0;height:var(--safe-top)'; document.body.appendChild(d); SAFE_TOP = d.getBoundingClientRect().height; d.remove(); }
addEventListener('resize', function () { SAFE_TOP = null; });
function syncSheetBody() {
  var top = SH[SH.length - 1];
  document.body.classList.toggle('sheet-open', !!top);
  document.body.classList.toggle('has-foot', !!top && !!top.el.querySelector('.shf'));
}
function pushSheet(o) {
  dismissToast();
  var wrap = document.createElement('div'); wrap.className = 'sh';
  wrap.innerHTML = '<div class="dim" data-act="shdim"></div><section class="sheet" role="dialog" aria-modal="true" tabindex="-1"></section>';
  sheetsEl.appendChild(wrap);
  var s = { wrap: wrap, el: wrap.lastChild, det: o.det || 'm', fixed: !!o.fixed, render: o.render, state: o.state || {}, kind: o.kind, opener: document.activeElement, onClose: o.onClose };
  s.el.innerHTML = o.render(s);
  SH.push(s); growAll(s.el);
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
  syncSheetBody(); growAll(s.el);
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
  lang = l; st.set.lang = l; save(); hap(); paintLang();
  PAGE.state.ed = {}; PAGE.state.edit = null;
  if (UI.top === 'qr') { var sc = qrEl.scrollTop; renderStage(); qrEl.scrollTop = sc; }
  SH.forEach(function (s) { s.state.edit = null; s.state.ed = {}; if (s.kind === 'product' || s.kind === 'msg' || s.kind === 'set') { rerender(s); afterPaint(function () { growAll(s.el); }); } });
  updateOrderBar();
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
  if (k === 'page') return C.composeCopy('order', { sel: s.state.sel }, lang);
  return null;
}
/* ---------- editable boxes (round 3) ----------
   Every preview is a <textarea>: it starts as the generated text, she can type over it, and the clipboard gets exactly what is in the box.
   scope.state.ed[key] holds the typed text only while it differs from the generated text; "Khôi phục" drops it, "Lưu làm mẫu" persists it. */
function scopeOf(el) {
  var sh = el && el.closest && el.closest('.sheet');
  if (sh) for (var i = 0; i < SH.length; i++) if (SH[i].el === sh) return SH[i];
  return PAGE;
}
function ebGen(s, key) {
  var k = s.kind;
  if (k === 'product') return sheetCompose(s, key).text;
  if (k === 'msg') return msgGen(s).text;
  if (k === 'set') return C.composeCopy('set', { set: SM(s.state.id), sel: s.state.sel, bubble: key.slice(1) }, lang).text;
  if (k === 'page') return C.composeCopy('order', { sel: s.state.sel }, lang).text;
  return '';
}
function ebVal(s, key) { var e = s.state.ed[key]; return e !== undefined ? e : ebGen(s, key); }
function ebCanSave(s, key) { return !(s.kind === 'product' && key === 'both'); }
function estHtml(s, key, edited) {
  if (!edited) return '<span>Chạm vào khung để sửa trực tiếp</span>';
  return '<span class="ed"><b>Đã sửa</b><button class="txtbtn" data-act="ebreset" data-k="' + key + '">Khôi phục</button>' + (ebCanSave(s, key) ? '<button class="txtbtn sv" data-act="ebsave" data-k="' + key + '">Lưu làm mẫu</button>' : '<span class="nosave">Mở Thông tin hoặc Bảng size để lưu mẫu</span>') + '</span>';
}
function ebHtml(s, key, o) {
  o = o || {};
  var ed = s.state.ed[key] !== undefined;
  return '<div class="eb" data-eb="' + key + '"><textarea class="eta" data-eta="' + key + '" lang="' + (o.lang || lang) + '" rows="3" spellcheck="false" autocorrect="off" autocapitalize="off" aria-label="' + esc(o.label || 'Nội dung tin nhắn — chạm để sửa') + '">\n' + esc(ebVal(s, key)) + '</textarea><div class="est" data-est="' + key + '" data-on="' + (ed ? 1 : '') + '">' + estHtml(s, key, ed) + '</div></div>';
}
function growTa(ta) {
  if (!ta.offsetParent) return;
  var sc = ta.closest('.shb,.tab'), top = sc ? sc.scrollTop : 0;
  ta.style.height = 'auto'; ta.style.height = (ta.scrollHeight + 2) + 'px';
  if (sc) sc.scrollTop = top;
}
function growAll(root) { $$('textarea.eta', root).forEach(growTa); }
function setEst(s, key) {
  var est = s.el.querySelector('[data-est="' + key + '"]'), ed = s.state.ed[key] !== undefined; if (!est || est.dataset.on === (ed ? '1' : '')) return;
  est.dataset.on = ed ? '1' : ''; est.innerHTML = estHtml(s, key, ed);
}
function msgPending(s) {
  if (s.kind !== 'msg') return 0;
  var ta = s.el.querySelector('[data-eta=msg]'), g = msgGen(s), t = ta ? ta.value : g.text;
  return g.missing.filter(function (k) { return t.indexOf('[' + (STR.tokl[k] || k) + ']') > -1; }).length;
}
function updateMsgBtn(s) {
  var b = s.el.querySelector('#mcopy'); if (!b) return;
  var n = msgPending(s), et = msgGen(s).et, was = b.dataset.n;
  b.disabled = !!n;
  if (was !== String(n)) { b.dataset.n = n; b.innerHTML = n ? 'Điền ' + n + ' chỗ nữa' : lblBtn(msgCopyLabel(et)); }
}
function syncBoxes(s) {
  $$('[data-eta]', s.el).forEach(function (ta) {
    var k = ta.dataset.eta, v = ebVal(s, k);
    if (ta.value !== v) { ta.value = v; growTa(ta); }
    setEst(s, k);
  });
  if (s.kind === 'msg') updateMsgBtn(s);
  if (s.kind === 'page') { var tn = $('#tnote'); if (tn) tn.innerHTML = tnoteHtml(); }
  if (s.kind === 'set') { var set = SM(s.state.id), pl = s.el.querySelector('#pline'); if (pl) pl.textContent = setLine(set); var sub = s.el.querySelector('.shh .st'); if (sub) sub.textContent = 'Set · ' + money(C.setPrice(set), 'vi'); }
}
/* an upstream choice (lead chip, language, fill, order line...) changed: the generated text is new, the typed text of the old one is dropped (with undo) */
function takeEdits(s, only) {
  var snap = {}, any = false;
  Object.keys(s.state.ed).forEach(function (k) { if (!only || only.indexOf(k) > -1) { snap[k] = s.state.ed[k]; delete s.state.ed[k]; any = true; } });
  return any ? snap : null;
}
function leadKeys(s, a) {
  if (s.kind === 'product') return a === 'info' ? ['info', 'both'] : a === 'size' ? ['size', 'both'] : [a];
  if (s.kind === 'set') return a === 'info' ? ['sa'] : a === 'size' ? ['sb'] : [];
  if (s.kind === 'page') return ['order'];
  return null;
}
function editsToast(s, snap) {
  if (!snap) return;
  toast('Tin đã cập nhật theo lựa chọn mới', { sub: 'Phần bạn sửa trước đó đã bỏ', undo: function () { Object.keys(snap).forEach(function (k) { s.state.ed[k] = snap[k]; }); syncBoxes(s); } });
}
function refreshPreview(s, only) { var snap = takeEdits(s, only); syncBoxes(s); editsToast(s, snap); }
function onEta(t) {
  var s = scopeOf(t), k = t.dataset.eta, gen = ebGen(s, k);
  if (C.isEdited(gen, t.value)) s.state.ed[k] = t.value; else delete s.state.ed[k];
  setEst(s, k);
  if (s.kind === 'msg') updateMsgBtn(s);
  if (s.kind === 'page') { var tn = $('#tnote'); if (tn) tn.innerHTML = tnoteHtml(); }
  if (!t._g) t._g = requestAnimationFrame(function () { t._g = 0; growTa(t); });
}
function ebReset(s, key) { delete s.state.ed[key]; syncBoxes(s); }
function ebSave(s, key) {
  var text = s.state.ed[key]; if (text === undefined) return;
  var msg = null, sub = null, l = lang, r, body, f;
  if (!clean(text)) { toast('Khung đang trống, chưa lưu được', { bad: true }); return; }
  if (s.kind === 'product') {
    var p = PM[s.state.id]; r = sheetCompose(s, key); body = C.stripLead(text, r.lead);
    if (key === 'info' && s.state.link) body = C.stripEnd(body, pv(p, 'postUrl'));
    f = (key === 'size' ? 'size' : 'desc') + (l === 'en' ? 'En' : 'Vi');
    st.ov[p.id] = st.ov[p.id] || {}; st.ov[p.id][f] = clean(body); IDX = null;
    msg = 'Đã lưu làm mẫu · ' + pname(p, 'vi') + ' · ' + lu(); sub = key === 'size' ? 'Bảng size mới' : 'Thông tin mới';
  } else if (s.kind === 'msg') {
    var g = msgGen(s), u = C.untemplate(text, g.vals), cl = g.et.fell ? other(l) : l, id = s.state.id;
    st.ov[id] = st.ov[id] || {}; st.ov[id][cl] = u.tpl;
    msg = 'Đã lưu làm mẫu · ' + short(eLabel(FM[id])) + ' · ' + cl.toUpperCase();
    if (u.lost.length) sub = 'Phần sửa thay chỗ tự điền, lần sau không tự điền nữa';
  } else if (s.kind === 'set') {
    var set = SM(s.state.id), b = key.slice(1); r = C.composeCopy('set', { set: set, bubble: b, sel: s.state.sel }, l); body = clean(C.stripLead(text, r.lead));
    if (b === 'a') { set.ov = set.ov || {}; set.ov[l] = body; } else { set.bov = set.bov || {}; set.bov[b] = set.bov[b] || {}; set.bov[b][l] = body; }
    msg = 'Đã lưu làm mẫu · ' + BLBL[b] + ' · ' + lu(); sub = 'Tin này không tự đổi theo mẫu và giá nữa';
  } else if (s.kind === 'page') {
    var d = st.draft, bk = st.set.bank, lead = C.composeCopy('order', { sel: s.state.sel }, l).lead;
    body = C.stripLead(text, lead);
    body = C.stripEnd(body, d.bank && bk.no ? (l === 'en' ? 'Bank transfer: ' : 'Chuyển khoản: ') + [bk.name, bk.no, bk.holder].filter(Boolean).join(' · ') : '');
    body = C.stripEnd(body, d.info.trim() ? (l === 'en' ? 'Ship to:' : 'Giao đến:') + '\n' + d.info.trim() : '');
    var pairs = d.lines.length ? [['orderLines', C.linesText(l)], ['total', C.totalStr(l)]] : [], uo = C.untemplate(body, pairs);
    st.ov.__ord = st.ov.__ord || {}; st.ov.__ord[l] = uo.tpl;
    msg = 'Đã lưu làm mẫu · Tin chốt đơn · ' + lu(); if (uo.lost.length) sub = 'Phần sửa thay chỗ tự điền, lần sau không tự điền nữa';
  }
  save(); delete s.state.ed[key]; syncBoxes(s); refreshAll();
  if (s.kind === 'set') { rerender(s); afterPaint(function () { growAll(s.el); }); }
  toast(msg, { sub: sub });
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
  refreshPreview(s, leadKeys(s, a));
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
  refreshLeadZone(s, a); refreshPreview(s, leadKeys(s, a));
}

/* ---------- product sheet: the action stack ---------- */
function openProduct(id, open) {
  var s = pushSheet({ kind: 'product', det: 'l', fixed: true, state: { id: id, open: open || 'info', sel: {}, ed: {}, edit: null, guard: null }, render: renderProd });
  afterPaint(function () { growAll(s.el); setCtx(id); });
}
function copyLabel(a) { return a === 'info' ? 'Chép thông tin' : a === 'size' ? 'Chép bảng size' : 'Chép cả hai'; }
function altRow(a, id) {
  var ol = other(lang);
  return '<div class="alt"><button class="txtbtn" data-act="pcopyalt" data-a="' + a + '" data-id="' + id + '">Chép bản ' + ol.toUpperCase() + '</button><button class="txtbtn" data-act="editp" data-id="' + id + '">Thêm bản ' + lu() + '</button></div>';
}
function renderProd(s) {
  var id = s.state.id, p = PM[id], l = lang, open = s.state.open, c = colorOf(p), note = pv(p, 'noteVi'), h = '', foot = '';
  var dt = ptrunc(p, 'desc', l), zt = ptrunc(p, 'size', l);
  h += shHead(pv(p, 'emoji') + ' ' + pname(p, 'vi'), money(pv(p, 'price'), 'vi') + (c ? ' · ' + esc(c) : '') + ' · ' + psizes(p).join(' '), langSeg());
  h += '<div class="shb ebody">';
  if (dt || zt) h += '<div class="qwarn">' + (dt && zt ? 'Thông tin và bảng size' : dt ? 'Thông tin' : 'Bảng size') + ' bị cắt ở sheet gốc — <button class="txtbtn" data-act="editp" data-id="' + id + '">Sửa</button></div>';
  ['info', 'size', 'both'].forEach(function (a) {
    var r = sheetCompose(s, a), edited = s.state.ed[a] !== undefined;
    if (a === open) {
      h += '<div class="acard">' + (a === 'info' ? '' : '<div style="border-top:.5px solid var(--separator);margin-bottom:8px"></div>') + '<h3 class="cap sm">' + STR.acts[a] + '</h3>' +
        (r.missing ? '<div class="paper" style="color:var(--label-2)">Chưa có bản ' + lu() + ' của phần này.</div>' : ebHtml(s, a, { lang: l, label: STR.acts[a] + ' — chạm để sửa' })) +
        (a === 'both' ? leadZone(s, 'info', 'Trước thông tin') + leadZone(s, 'size', 'Trước bảng size') : leadZone(s, a)) + (a === 'size' ? '' : linkZone(s)) +
        (r.partial ? '<div class="foot">Chưa có bảng size ' + lu() + ': chỉ chép thông tin.</div>' : '') +
        (r.missing ? altRow(a, id) : '') + '</div>';
      foot = r.missing ? '<button class="btn dis wide" aria-disabled="true">Chưa có bản ' + lu() + '</button>' : '<button class="btn wide" data-act="pcopy" data-a="' + a + '">' + lblBtn(copyLabel(a) + ' · ' + lu()) + '</button>';
    } else {
      var sub = a === 'both' ? [leadState(s, 'info'), leadState(s, 'size')].filter(Boolean).join(' · ') : leadState(s, a);
      h += '<div class="arow"><button class="al" data-act="popen" data-a="' + a + '"><span class="t">' + STR.acts[a] + '</span><span class="s">' + (edited ? 'đã sửa · ' : '') + (sub ? 'kèm: ' + sub : 'không kèm câu') + '</span></button>' +
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
  return h + '</div><div class="shf">' + foot + '</div>';
}
function productCopy(s, a, btn, forceLang) {
  var l = forceLang || lang, id = s.state.id, p = PM[id];
  var r = C.composeCopy(a, { pid: id, sel: s.state.sel, link: s.state.link }, l), typed = !forceLang && s.state.ed[a] !== undefined;
  if (r.missing) { toast('Chưa có bản ' + l.toUpperCase(), { bad: true }); return; }
  if (r.trunc && !typed && !guardPass(s, a + l, btn)) return;
  var label = pname(p, 'vi') + (a === 'size' ? ' · size' : '');
  copy(typed ? s.state.ed[a] : r.text, { btn: btn, label: a === 'size' ? 'Bảng size ' + pname(p, 'vi') : pname(p, 'vi'), lang: l, rec: { k: 'p:' + id + ':' + a, label: label, ref: { t: 'p', id: id, w: a } }, done: function (ok) { if (ok) commitLeads(r.leadIds); } });
}

/* ---------- message sheet (quick replies) ---------- */
function openEntry(id) {
  var e = FM[id];
  if (id === 'order-recap') { gotoStage('order'); return; }
  if (entryHidden(e)) { toast('Nhớ gửi đính kèm', { sub: e.attach || eLabel(e), icon: 'clip' }); return; }
  var alts = null;
  C.STAGES.forEach(function (g) { g.cards.forEach(function (c) { if (c.alts && c.alts.some(function (a) { return a[0] === id; })) alts = c.alts; }); });
  if (alts && st.draft.lines.some(function (L) { return PM[L.pid] && PM[L.pid].madeToOrder; })) id = alts[alts.length - 1][0];
  pushSheet({ kind: 'msg', det: 'l', fixed: true, state: { id: id, fills: {}, ed: {}, sel: {}, guard: null, alts: alts }, render: renderMsg, onClose: null });
}
function msgGen(s) {
  var e = FM[s.state.id], et = mtext(e, lang, s.state.fills), r = resolve(et.text, lang, s.state.fills, false, true);
  return { et: et, text: r.text, missing: r.missing, vals: r.vals };
}
function msgCopyLabel(et) { return et.fell ? 'Chép bản ' + other(lang).toUpperCase() : 'Chép · ' + lu(); }
function renderMsg(s) {
  var id = s.state.id, e = FM[id], g = msgGen(s), et = g.et, fills = s.state.fills, keys = keysOf(et.text), isG = !!GREET[id];
  var fr = keys.map(function (k) { return fillRow(k, fills, s); }).join('') + (isG ? fillRow('item', fills, s, true) : '');
  var fromCtx = keys.some(function (k) { return (k === 'item' || k === 'size') && !fills[k] && fillVal(k, fills); });
  var alts = s.state.alts ? '<div class="altv" role="group" aria-label="Loại đơn">' + s.state.alts.map(function (a) { return '<button class="chip" data-act="variant" data-v="' + a[0] + '" aria-pressed="' + (a[0] === id) + '">' + esc(a[1]) + '</button>'; }).join('') + '</div>' : '';
  var n = msgPending(s);
  return shHead(eLabel(e), groupOf(id), langSeg()) +
    '<div class="shb ebody">' +
    (et.fell ? '<div class="note" style="margin:0 0 10px">' + ic('warn', 's15') + '<span><b style="color:var(--destructive)">Chưa có bản ' + lu() + '.</b> Bên dưới là bản ' + other(lang).toUpperCase() + ' — chỉ chép khi bạn muốn gửi tiếng ' + (other(lang) === 'vi' ? 'Việt' : 'Anh') + '.<br><button class="txtbtn" data-act="editf" data-id="' + id + '" style="min-height:32px;padding:0">Thêm bản ' + lu() + '</button></span></div>' : '') +
    alts + ebHtml(s, 'msg', { lang: et.fell ? other(lang) : lang, label: eLabel(e) + ' — chạm để sửa' }) +
    (e.attach && !isG ? '<div class="att">' + ic('clip', 's15') + 'Nhớ đính kèm: ' + esc(e.attach) + '</div>' : '') +
    (fr ? '<h3 class="h2">' + (isG ? 'Kèm thông tin mẫu (tuỳ chọn)' : 'Điền nhanh') + '</h3>' + fr + (fromCtx ? '<p class="foot">Lấy từ ' + esc(ctxLabel()) + '</p>' : '') : '') + '</div>' +
    '<div class="shf"><button class="btn wide" id="mcopy" data-act="msgcopy" data-n="' + n + '"' + (n ? ' disabled' : '') + '>' + (n ? 'Điền ' + n + ' chỗ nữa' : lblBtn(msgCopyLabel(et))) + '</button></div>';
}
function candidates() {
  var out = [], c = ctx();
  if (c && c.itemId) out.push(c.itemId);
  st.recents.forEach(function (r) { var m = /^p:([^:]+):/.exec(r.k); if (m && PM[m[1]] && out.indexOf(m[1]) < 0) out.push(m[1]); });
  PL.forEach(function (p) { if (out.indexOf(p.id) < 0) out.push(p.id); });
  return out;
}
function fillRow(k, fills, s, opt) {
  var lb = '<span class="lb">' + esc((STR.tokl[k] || k).replace(/^./, function (x) { return x.toUpperCase(); })) + '</span>', cur = opt ? fills.item : fillVal(k, fills), c = '';
  if (k === 'item' || k === 'otherItem') {
    var cur2 = k === 'item' ? cur : fills.otherItem, cands = candidates().slice(0, 4);
    if (cur2 && cands.indexOf(cur2) < 0) cands.unshift(cur2);
    c = '<div class="chips">' + (opt ? '<button class="chip" data-act="fill" data-k="item" data-v="" aria-pressed="' + !cur2 + '">Không kèm</button>' : '') + cands.map(function (id) { return '<button class="chip" data-act="fill" data-k="' + k + '" data-v="' + id + '" aria-pressed="' + (id === cur2) + '">' + esc(pname(PM[id], 'vi')) + '</button>'; }).join('') + '<button class="chip ghost" data-act="pickfill" data-k="' + k + '">Chọn…</button></div>';
  } else if (/^size/.test(k)) {
    var pid = fillVal('item', fills), sizes = pid ? psizes(PM[pid]) : ['S', 'M', 'L', 'XL'];
    c = '<div class="chips">' + sizes.map(function (z) { return '<button class="chip" data-act="fill" data-k="' + k + '" data-v="' + z + '" aria-pressed="' + (z === cur) + '">' + z + '</button>'; }).join('') + '</div>';
  } else c = '<input class="fld" data-fill="' + k + '" enterkeyhint="done" value="' + esc(fills[k] || '') + '" placeholder="' + esc(STR.tokl[k] || k) + '" aria-label="' + esc(STR.tokl[k] || k) + '">';
  return '<div class="frow">' + lb + c + '</div>';
}
function msgCopy(s, t) {
  var g = msgGen(s), et = g.et, ent = FM[s.state.id];
  if (msgPending(s)) return;
  var ta = s.el.querySelector('[data-eta=msg]'), text = ta ? ta.value : g.text, typed = s.state.ed.msg !== undefined;
  var p = PM[fillVal('item', s.state.fills)];
  var tr = p && ((/\{\{itemInfo\}\}/.test(et.text) && ptrunc(p, 'desc', lang)) || (/\{\{sizeChart\}\}/.test(et.text) && ptrunc(p, 'size', lang)));
  if (tr && !typed && !guardPass(s, 'm' + lang, t)) return;
  var cl = et.fell ? other(lang) : lang;
  copy(text, { btn: t, label: eLabel(ent), lang: cl, rec: { k: 'f:' + ent.id, label: eLabel(ent), ref: { t: 'f', id: ent.id } }, done: function (ok) { if (ok) setTimeout(function () { closeSheet(s, true); }, 600); } });
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

/* ---------- sets ---------- */
function isSugg(a, b) { return (SEED.setSuggestions || []).some(function (x) { return (x[0] === a && x[1] === b) || (x[0] === b && x[1] === a); }); }
function suggestions() {
  return (SEED.setSuggestions || []).filter(function (x) { return PM[x[0]] && PM[x[1]] && !st.sets.some(function (y) { return y.items.slice().sort().join('|') === x.slice().sort().join('|'); }); });
}
function createSet(items, checked) {
  var key = items.slice().sort().join('|'), ex = st.sets.filter(function (x) { return x.items.slice().sort().join('|') === key; })[0];
  if (ex) return ex;
  var set = { id: uid('set-'), items: items, price: null, name: '', postUrl: '', checked: checked !== false, ov: { vi: null, en: null } };
  st.sets.push(set); IDX = null; save(); if (UI.top === 'pi' && UI.view === 's') renderPI(); return set;
}
function openSetPicker(fromPid) {
  var p = PM[fromPid];
  openPicker('set', function (pid) { var set = createSet([fromPid, pid], true); openSet(set.id); }, { title: 'Ghép ' + pname(p, 'vi') + ' với…', from: fromPid, skip: [fromPid] });
}
function openSet(id) {
  var s = pushSheet({ kind: 'set', det: 'l', fixed: true, state: { id: id, sel: {}, edit: null, ed: {}, guard: null, next: 'a' }, render: renderSet });
  afterPaint(function () { growAll(s.el); });
}
var BLBL = { a: 'Thông tin + giá set', b: 'Bảng size từng món', c: 'Xin số đo', d: 'Link bài viết' };
function setLine(set) {
  var ps = C.setItems(set), sum = C.setSum(set), price = C.setPrice(set);
  return price !== sum ? 'Giá lẻ ' + ps.map(function (p) { return money(pv(p, 'price'), 'vi'); }).join(' + ') + ' = ' + money(sum, 'vi') + ' → Giá set ' + money(price, 'vi') : 'Giá set ' + money(price, 'vi') + ' (= tổng giá lẻ)';
}
function nextLabel(s) { var vis = C.SETB.filter(function (b) { return C.setBubble(SM(s.state.id), b, lang); }), n = vis.indexOf(s.state.next) + 1; return 'Chép tin ' + (n || 1) + ' · ' + lu(); }
function renderSet(s) {
  var set = SM(s.state.id), l = lang, h = '', i = 0, vis = C.SETB.filter(function (b) { return C.setBubble(set, b, l); });
  var next = vis.indexOf(s.state.next) > -1 ? s.state.next : vis[0]; s.state.next = next;
  h += shHead(C.setLabel(set), 'Set · ' + money(C.setPrice(set), 'vi'), langSeg()) + '<div class="shb pad ebody">';
  if (set.checked === false) h += '<div class="qwarn">Gợi ý từ bài đăng, chưa kiểm tra giá — <button class="txtbtn" data-act="setok">Đã kiểm tra</button></div>';
  h += '<div class="foot" id="pline" style="margin-top:0">' + esc(setLine(set)) + '</div>' +
    '<h3 class="cap sm" style="padding-bottom:0">Giá set (để trống = tổng giá lẻ)</h3><div class="lf" style="margin-top:6px"><textarea rows="1" data-sprice inputmode="numeric" placeholder="' + nfV.format(C.setSum(set)) + '" aria-label="Giá set">' + (set.price != null && set.price !== '' ? set.price : '') + '</textarea></div>' +
    '<h3 class="cap sm" style="padding-bottom:0">Link bài viết (tuỳ chọn)</h3><div class="lf" style="margin-top:6px"><textarea rows="1" data-spurl placeholder="Để trống = link bài của mẫu" aria-label="Link bài viết">' + esc(set.postUrl || '') + '</textarea></div>';
  vis.forEach(function (b) {
    var sb = C.setBubble(set, b, l), r = C.composeCopy('set', { set: set, bubble: b, sel: s.state.sel }, l);
    i++;
    h += '<div class="bub bcard' + (b === next ? ' next' : '') + '" data-b="' + b + '"><div class="bh"><h3 class="cap sm">' + i + ' · ' + BLBL[b] + '</h3>' +
      (r.missing ? (b === 'c' ? '' : '<button class="btn dis sm" aria-disabled="true">Chưa có ' + lu() + '</button>') : '<button class="btn sm" data-act="bcopy" data-b="' + b + '">' + lblBtn('Chép · ' + lu(), false) + '</button>') + '</div>';
    if (r.missing) h += '<div class="paper" style="color:var(--label-2)">Chưa có bản ' + lu() + ' của tin này.</div>' + (b === 'c' ? '' : '<div class="alt"><button class="txtbtn" data-act="bcopy" data-b="' + b + '" data-alt="1">Chép bản ' + other(l).toUpperCase() + '</button></div>');
    else {
      h += ebHtml(s, 's' + b, { lang: l, label: 'Tin ' + i + ' — chạm để sửa' });
      if (!sb.auto) h += '<div class="foot">Đang dùng bản đã lưu · <button class="txtbtn" style="min-height:44px;padding:0" data-act="setovreset" data-b="' + b + '">Dùng bản tự soạn</button></div>';
      if (b === 'a') h += leadZone(s, 'info'); else if (b === 'b') h += leadZone(s, 'size');
    }
    h += '</div>';
  });
  h += '<div style="margin-top:8px"><button class="txtbtn" data-act="setadd">+ Thêm mẫu vào set</button> <button class="txtbtn dest" data-act="setdel">Xoá set</button></div></div>' +
    '<div class="shf"><button class="btn wide" id="bnext" data-act="bnext">' + lblBtn(nextLabel(s)) + '</button></div>';
  return h;
}
/* one Instagram bubble of a set: synchronous, guarded when the text is truncated or the set price was never checked */
function bubbleCopy(s, t, b, forceLang, set) {
  var l = forceLang || lang; set = set || SM(s.state.id);
  var r = C.composeCopy('set', { set: set, bubble: b, sel: s.state.sel }, l), typed = s.kind === 'set' && !forceLang && s.state.ed['s' + b] !== undefined;
  if (r.missing) { toast('Chưa có bản ' + l.toUpperCase(), { bad: true }); return; }
  var unchecked = b === 'a' && set.checked === false;
  if (((r.trunc && !typed) || unchecked) && !guardPass(s, 'set' + b + l, t, unchecked ? 'Kiểm tra giá set rồi chạm lại để chép' : 0)) return;
  var vis = C.SETB.filter(function (x) { return C.setBubble(set, x, lang); });
  copy(typed ? s.state.ed['s' + b] : r.text, { btn: t, label: C.setLabel(set), lang: l, done: function (ok) {
    if (!ok) return;
    commitLeads(r.leadIds); if (set.checked === false) { set.checked = true; var qw = s.el.querySelector('.qwarn'); if (qw) qw.remove(); } save();
    if (s.kind === 'set') {
      var nx = vis[vis.indexOf(b) + 1] || b; s.state.next = nx;
      $$('.bub', s.el).forEach(function (x) { x.classList.toggle('next', x.dataset.b === nx); });
      var nb = s.el.querySelector('#bnext .l1'); if (nb) nb.lastChild.textContent = nextLabel(s);
    }
  } });
}

/* ---------- long-press menu (lead-in chips) ---------- */
var menuEl = $('#menu'), suppress = 0, menuScope = null;
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
  menuScope = scopeOf(el); hap(); suppress = Date.now() + 700;
}
function menuAct(m, key) {
  var parts = key.split(':'), id = parts[1], a = parts[2], s = menuScope;
  closeMenu(); if (!s) return;
  if (m === 'lead-edit') { s.state.edit = { a: a, id: id }; refreshLeadZone(s, a); }
  else if (m === 'lead-del') {
    var undo = removeLead(id);
    if (s.state.sel) Object.keys(s.state.sel).forEach(function (k) { if (s.state.sel[k] === id) delete s.state.sel[k]; });
    refreshLeadZone(s, a); refreshPreview(s, leadKeys(s, a));
    toast('Đã bỏ câu đệm', { undo: function () { undo(); refreshLeadZone(s, a); refreshPreview(s, leadKeys(s, a)); } });
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
  ovT = setTimeout(function () { refreshAll(); flashSaved(); }, 400);
}
function refreshAll() { IDX = null; renderHome(); if (UI.top === 'pi' && UI.view === 's') renderPI(); if (UI.top === 'qr') renderStage(); updateOrderBar(); paintDock(); }

/* ---------- search (product tab, "Theo mẫu") ---------- */
var IDX = null;
function buildIndex() {
  IDX = PL.map(function (p) { return { id: p.id, name: norm(pname(p, 'vi') + ' ' + pname(p, 'en')), title: norm(colorOf(p)), text: norm(ptext(p, 'desc', 'vi') + ' ' + ptext(p, 'desc', 'en')) }; });
}
var lastRaw = null;
function doSearch(soft) {
  var raw = $('#q').value, q = norm(raw.trim()), box = $('#hbody');
  if (soft && raw === lastRaw) return;
  lastRaw = raw;
  if (!q) { box.innerHTML = homeHtml; return; }
  if (!IDX) buildIndex();
  var hits = [];
  IDX.forEach(function (x) {
    var r = x.name.indexOf(q) === 0 ? 0 : x.name.indexOf(q) > -1 ? 1 : x.title.indexOf(q) > -1 ? 2 : x.text.indexOf(q) > -1 ? 3 : -1;
    if (r > -1) hits.push([r, x]);
  });
  hits.sort(function (x, y) { return x[0] - y[0]; });
  box.innerHTML = hits.length ? '<h2 class="cap">Mẫu</h2><div class="grp">' + hits.map(function (x) { return pRow(PM[x[1].id]); }).join('') + '</div>' : '<div class="empty">' + ic('search', 's34') + '<div class="tt">Chưa tìm thấy “' + esc(raw.trim()) + '”</div><p>Thử một tên ngắn hơn nhé.</p></div>';
}
(function () {
  var vv = window.visualViewport, pend = 0;
  if (!vv) return;
  function upd() {
    if (pend) return; pend = 1;
    requestAnimationFrame(function () {
      pend = 0;
      var kb = Math.max(0, Math.round(innerHeight - vv.height - vv.offsetTop)); if (kb < 80) kb = 0;   /* small deltas are the browser toolbar, not the keyboard */
      document.documentElement.style.setProperty('--kb', kb + 'px'); document.body.classList.toggle('kb', kb > 0);
      var ae = document.activeElement; if (kb && ae && ae.matches && ae.matches('textarea,input') && ae.scrollIntoView) ae.scrollIntoView({ block: 'nearest' });
    });
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
  var s = scopeOf(t), A = t.dataset.a;
  switch (a) {
    case 'lang': setLang(v); break;
    case 'top': if (v !== UI.top) setTop(v); break;
    case 'stage': gotoStage(v); break;
    case 'stmore': UI.more[st.ui.stage] = !UI.more[st.ui.stage]; renderStage(); break;
    case 'pview': UI.view = v; renderPI(); break;
    case 'pchip': openProduct(id, v); break;
    case 'variant': { var snap0 = takeEdits(s); s.state.id = v; rerender(s); editsToast(s, snap0); break; }
    case 'qclear': $('#q').value = ''; $('#q').focus(); doSearch(); break;
    case 'hintx': hintDone(); break;
    case 'settings': openSettings(); break;
    case 'openorder': gotoStage('order'); break;
    case 'editf': editEntry(id); break;
    case 'editp': editProduct(id); break;
    case 'bankset': openSettings(['main', 'bank']); break;
    case 'shclose': case 'shdim': closeTop(); break;
    case 'mclose': closeMenu(); break;
    case 'mi': menuAct(t.dataset.m, $('.mpanel', menuEl).dataset.k); break;
    /* product sheet */
    case 'popen': s.state.open = A; s.state.edit = null; rerender(s); afterPaint(function () { growAll(s.el); }); break;
    case 'pcopy': productCopy(s, A, t); break;
    case 'pcopyalt': productCopy(s, A, t, other(lang)); break;
    case 'pcopyset': { var set = SM(id); bubbleCopy(s, t, 'a', null, set); break; }
    case 'ebreset': ebReset(s, t.dataset.k); break;
    case 'ebsave': ebSave(s, t.dataset.k); break;
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
      var snapF = takeEdits(s);
      s.state.fills[t.dataset.k] = v;
      if (t.dataset.k === 'item' && v) { setCtxQuiet(v, ctx() && ctx().itemId === v ? ctx().size : null); var sz = psizes(PM[v]); if (s.state.fills.size && sz.indexOf(s.state.fills.size) < 0) delete s.state.fills.size; }
      else if (t.dataset.k === 'size') { setCtxQuiet(ctx() ? ctx().itemId : null, v); }
      rerender(s); afterPaint(function () { growAll(s.el); }); editsToast(s, snapF); break;
    }
    case 'pickfill': {
      var kk = t.dataset.k, ms = s;
      openPicker('pick', function (pid) { var sn = takeEdits(ms); ms.state.fills[kk] = pid; if (kk === 'item') setCtxQuiet(pid, ctx() && ctx().itemId === pid ? ctx().size : null); rerender(ms); afterPaint(function () { growAll(ms.el); }); editsToast(ms, sn); });
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
    case 'oadd': addLine(id, v); break;
    case 'lineopen': if (!e.target.closest('[data-act=linesize],[data-act=qty],[data-act=linedel],.lexp')) { UI.ordOpen = UI.ordOpen === +t.dataset.i ? -1 : +t.dataset.i; redrawOrder(); } break;
    case 'linesize': { var L = st.draft.lines[+t.dataset.i], dup = st.draft.lines.find(function (x, j) { return j !== +t.dataset.i && x.pid === L.pid && x.size === v; }); if (dup) { dup.qty = Math.min(9, dup.qty + L.qty); st.draft.lines.splice(+t.dataset.i, 1); UI.ordOpen = -1; } else L.size = v; save(); orderChanged(); e.stopPropagation(); break; }
    case 'qty': { var L2 = st.draft.lines[+t.dataset.i]; L2.qty = Math.max(1, Math.min(9, L2.qty + (+t.dataset.d))); save(); orderChanged(); e.stopPropagation(); break; }
    case 'linedel': { var i2 = +t.dataset.i, snap = JSON.stringify(st.draft); var nm = PM[st.draft.lines[i2].pid]; st.draft.lines.splice(i2, 1); UI.ordOpen = -1; save(); orderChanged(); toast('Đã xoá ' + pname(nm, 'vi'), { undo: function () { st.draft = JSON.parse(snap); save(); orderChanged(); } }); e.stopPropagation(); break; }
    case 'ship': st.draft.ship = v; save(); orderChanged(); break;
    case 'pasteinfo': try { navigator.clipboard.readText().then(function (x) { st.draft.info = x; save(); var ti = $('[data-in=info]'); if (ti) ti.value = x; refreshPreview(PAGE); }, function () { var ta = $('[data-in=info]'); if (ta) ta.focus(); }); } catch (x) { var ta2 = $('[data-in=info]'); if (ta2) ta2.focus(); } break;

    case 'copyorder': {
      if (!st.draft.lines.length) break;
      var r = C.composeCopy('order', { sel: PAGE.state.sel }, lang), total = calc().total, ota = $('[data-eta=order]'), otext = ota ? ota.value : r.text;
      copy(otext, { btn: t, msg: 'Đã chép đơn · ' + money(total, lang) + ' · ' + lu(), sub: 'Nhớ gửi mã QR nhé', icon: 'clip', label: 'Đơn', lang: lang, done: function (ok) { if (ok) { commitLeads(r.leadIds); st.draft.copiedAt = Date.now(); save(); afterPaint(function () { var op = $('#opost'); if (op) op.innerHTML = postCardHtml(); }); } } });
      break;
    }

    case 'neworder': { var sn = JSON.stringify(st.draft); st.draft = { lines: [], ship: 'courier', custom: 0, info: '', bank: true, copiedAt: 0 }; UI.ordOpen = -1; PAGE.state.ed = {}; save(); renderStage(); paintDock(); updateOrderBar(); toast('Đã làm mới đơn', { undo: function () { st.draft = JSON.parse(sn); save(); renderStage(); paintDock(); updateOrderBar(); } }); break; }
    case 'undo': if (toast.undoFn) { toast.undoFn(); toast.undoFn = null; $('.toast', toastEl) && $('.toast', toastEl).remove(); } break;
    /* sets */
    case 'setnew': openPicker('setnew', function (pair) { var set = createSet(pair); openSet(set.id); }, { title: 'Chọn 2 mẫu cho set' }); break;
    case 'bcopy': bubbleCopy(s, t, t.dataset.b, t.dataset.alt ? other(lang) : null); break;
    case 'bnext': bubbleCopy(s, t, s.state.next); break;
    case 'setok': SM(s.state.id).checked = true; save(); rerender(s); afterPaint(function () { growAll(s.el); }); break;
    case 'setsugg': { var sx = createSet([t.dataset.a, t.dataset.b], false); openSet(sx.id); break; }
    case 'linktoggle': s.state.link = !s.state.link; t.setAttribute('aria-pressed', !!s.state.link); refreshPreview(s, ['info', 'both']); break;
    case 'linkedit': s.state.edit = { a: 'link' }; refreshLeadZone(s, 'link'); break;
    case 'linksave': { var pu = $('[data-lead=link] textarea', s.el).value.trim(); st.ov[s.state.id] = st.ov[s.state.id] || {}; st.ov[s.state.id].postUrl = pu; if (!pu) s.state.link = false; s.state.edit = null; save(); refreshLeadZone(s, 'link'); refreshPreview(s, ['info', 'both']); break; }



    case 'setovreset': { var set4 = SM(s.state.id), bb = t.dataset.b; if (bb === 'a') set4.ov[lang] = null; else if (set4.bov && set4.bov[bb]) set4.bov[bb][lang] = null; save(); delete s.state.ed['s' + bb]; rerender(s); afterPaint(function () { growAll(s.el); }); break; }
    case 'setadd': { var set5 = SM(s.state.id), ms2 = s; openPicker('setadd', function (pid) { set5.items.push(pid); save(); ms2.state.ed = {}; rerender(ms2); afterPaint(function () { growAll(ms2.el); }); }, { title: 'Thêm mẫu vào set', skip: set5.items }); break; }
    case 'setdel': { var set6 = SM(s.state.id), ss = s; confirmBox('Xoá set này?', 'Xoá', function () { st.sets = st.sets.filter(function (x) { return x !== set6; }); save(); IDX = null; closeSheet(ss); if (UI.top === 'pi' && UI.view === 's') renderPI(); toast('Đã xoá set'); }); break; }
    /* settings */
    case 'spage': settingsGo(s, s.state.path.concat([t.dataset.p]), 1); break;
    case 'sback': settingsGo(s, s.state.path.slice(0, -1), -1); break;
    case 'setopen': closeSheet(s); openSet(id); break;
    case 'setlang': setLang(v); rerender(s); break;
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
  var t = e.target, s = scopeOf(t);
  if (t.matches('[data-eta]')) onEta(t);
  else if (t.matches('[data-fill]')) { s.state.fills[t.dataset.fill] = t.value; refreshPreview(s); }
  else if (t.matches('[data-pq]')) { s.state.q = t.value; $('#plist', s.el).innerHTML = pickerList(s); }
  else if (t.matches('[data-sprice]')) { var d0 = t.value.replace(/\D/g, ''); SM(s.state.id).price = d0 ? parseInt(d0, 10) : null; save(); grow(t); refreshPreview(s, ['sa']); }
  else if (t.matches('[data-oq]')) { UI.oq = t.value; var oe = $('#ores'); if (oe) oe.innerHTML = oresHtml(); }
  else if (t.matches('[data-lfi],[data-ovta]')) grow(t);
  else if (t.matches('[data-lfs]')) {
    var lid = t.dataset.id, ls = C.leadStore(), cu = ls.custom.filter(function (x) { return x.id === lid; })[0];
    if (cu) cu[t.dataset.lfs] = t.value; else { ls.edits[lid] = ls.edits[lid] || {}; ls.edits[lid][t.dataset.lfs] = t.value; }
    save(); flashSaved();
  }
  else if (t.matches('[data-ov]')) onOvInput(t);
  else if (t.matches('[data-in=info]')) { st.draft.info = t.value; save(); refreshPreview(PAGE); }
  else if (t.matches('[data-in=custom]')) { st.draft.custom = parseInt(t.value.replace(/\D/g, ''), 10) || 0; t.value = st.draft.custom ? nfV.format(st.draft.custom) : ''; save(); $('#ofoot').innerHTML = ofootHtml(); updateOrderBar(); refreshPreview(PAGE); }
});
document.addEventListener('change', function (e) {
  var t = e.target, s0 = scopeOf(t);
  if (t.matches('[data-spurl]')) { SM(s0.state.id).postUrl = t.value.trim(); save(); s0.state.ed = {}; rerender(s0); afterPaint(function () { growAll(s0.el); }); return; }
  if (t.matches('[data-in=bank]')) { st.draft.bank = t.checked; save(); refreshPreview(PAGE); }
});
document.addEventListener('focusin', function (e) { var s = topS('settings'); if (s && e.target.matches('textarea')) s.state.lastTa = e.target; });
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('[data-fill],[data-pq],#q,#oq,[data-in=custom]')) e.target.blur(); });

/* ---------- boot ---------- */
$('#hint').hidden = !!st.hintDone;
paintLang(); paintDock(); renderStage(); renderPI(); updateOrderBar();
idle(function () { if (!IDX) buildIndex(); idle(measureSafe); });
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', function () {
    var had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(function () { /* no worker: the app still runs online */ });
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (had) toast('Có bản mới — đóng và mở lại app nhé', { icon: 'sparkle', ms: 4000 }); had = true; });
  });
}
window.__SE = { boot: performance.now() - T0, st: st, calc: calc, composeCopy: C.composeCopy, STAGES: C.STAGES };
})();
