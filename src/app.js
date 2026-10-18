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
  acts: { info: 'Thông tin', size: 'Bảng size', both: 'Cả hai' },
  lacts: { info: 'Thông tin', size: 'Bảng size', order: 'Đơn hàng', thanks: 'Lời cảm ơn' },
  tip: 'Mở Instagram và dán vào ô tin nhắn nhé.'
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
st.tips = Object.assign({ copy: 0, lead: false }, st.tips || {});
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
/* o: {sub, bad, icon, undo, act:{label,fn}, ms}. The action button ("Hoàn tác", "Xem đơn") runs fn once. */
function toast(msg, o) {
  o = o || {};
  var act = o.act || (o.undo ? { label: 'Hoàn tác', fn: o.undo } : null);
  clearTimeout(toastT); toastAt = performance.now();
  var el = document.createElement('div');
  el.className = 'toast' + (o.bad ? ' bad' : '');
  el.innerHTML = ic(o.icon || (o.bad ? 'warn' : 'checkc')) + '<span class="tx">' + esc(msg) + (o.sub ? '<small>' + esc(o.sub) + '</small>' : '') + '</span>' + (act ? '<button class="tact" data-act="toastact">' + esc(act.label) + '</button>' : '');
  if (o.bad) el.setAttribute('role', 'alert');
  toastEl.innerHTML = ''; toastEl.appendChild(el);
  toast.fn = act ? act.fn : null;
  requestAnimationFrame(function () { el.classList.add('in'); });
  toastT = setTimeout(function () { el.classList.remove('in'); el.classList.add('out'); setTimeout(function () { if (el.parentNode) el.remove(); }, 260); }, o.ms || (act ? 5000 : o.sub ? 2800 : 1700));
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
    var n = st.tips.copy || 0;
    toast(o.msg || ('Đã chép · ' + short(o.label || 'Văn bản') + ' · ' + l.toUpperCase()), { sub: o.sub || (n < 3 ? STR.tip : undefined), icon: o.icon });
    if (n < 3) { st.tips.copy = n + 1; save(); }
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
  btn.classList.add('guard'); btn.textContent = 'Chạm lại để chép';
  if (msg) toast(msg, { icon: 'info', ms: 2600 });
  return false;
}

/* ---------- insets: ONE source for the bottom/top edge (design-v5 section 4) ----------
   JS measures the platform insets once, decides whether anything outside the app already owns the edge
   (a host frame, or a host that shrank our box) and writes --inset-t / --inset-b. No CSS rule reads the platform insets except this probe. */
var INS = { sat: 0, sab: 0, framed: false, shrunk: false, b: 0, t: 0 };
function measureInsets() {
  if (document.body.classList.contains('kb')) return;   /* the keyboard shrinks .app on purpose: keep the last measurement */
  var probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:0;visibility:hidden;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
  document.body.appendChild(probe);
  var cs = getComputedStyle(probe), sat = parseFloat(cs.paddingTop) || 0, sab = parseFloat(cs.paddingBottom) || 0;
  probe.remove();
  var q = new URLSearchParams(location.hash.slice(1));          /* host override: #inset-b=0&inset-t=0 */
  var framed = false; try { framed = window.self !== window.top; } catch (e) { framed = true; }
  var kb = parseFloat(document.documentElement.style.getPropertyValue('--kb')) || 0;
  var shrunk = $('#app').getBoundingClientRect().bottom < window.innerHeight - kb - 1;   /* a host shrank our box: it owns the edge */
  var b = framed || shrunk ? 0 : sab, t = framed ? 0 : sat;
  if (q.has('inset-b')) b = Math.max(0, +q.get('inset-b') || 0);
  if (q.has('inset-t')) t = Math.max(0, +q.get('inset-t') || 0);
  var r = document.documentElement.style;
  r.setProperty('--inset-b', b + 'px'); r.setProperty('--inset-t', t + 'px');
  document.body.dataset.ctx = framed ? 'frame' : matchMedia('(display-mode: standalone)').matches || navigator.standalone ? 'pwa' : 'tab';
  INS = { sat: sat, sab: sab, framed: framed, shrunk: shrunk, b: b, t: t };
  paintDebug();
}
function insetT() { return INS.t; }
function paintDebug() {
  var on = new URLSearchParams(location.hash.slice(1)).get('debug') === 'insets', el = $('#dbg');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'dbg'; document.body.appendChild(el); }
  var vv = window.visualViewport;
  el.textContent = 'sat ' + INS.sat + '  sab ' + INS.sab + '\nframed ' + INS.framed + '  shrunk ' + INS.shrunk + '\ninnerHeight ' + innerHeight + '  screen ' + screen.height + '\nvisualViewport ' + (vv ? Math.round(vv.height) : '-') + '\n--inset-b ' + INS.b + '  --inset-t ' + INS.t + '\n--bar-y ' + Math.max(INS.b - 10, 12) + '  ctx ' + document.body.dataset.ctx;
}
measureInsets();
addEventListener('resize', measureInsets); addEventListener('orientationchange', function () { setTimeout(measureInsets, 60); }); addEventListener('hashchange', measureInsets);
if (window.visualViewport) visualViewport.addEventListener('resize', function () { var a = document.activeElement; if (!(a && a.matches && a.matches('input,textarea'))) measureInsets(); });

/* ---------- shell: header, floating bar, pages ---------- */
var UI = { top: 'home', view: 'p', more: {}, oq: '', filt: 'all', lastSeg: null };
var PAGE = { kind: 'page', state: { ed: {}, sel: {}, edit: null }, el: $('#stage') };
var homeEl = $('#home'), qrEl = $('#qr'), piEl = $('#pi');
var PS = C.PS;
var GLBL = { greet: 'Chào hỏi', size: 'Tư vấn size', info: 'Xin thông tin', order: 'Tạo đơn', out: 'Check out' };
var TILEDESC = { greet: 'Khách mới hoặc cũ', size: 'Số đo, bảng size', info: 'Tên, SĐT, địa chỉ', order: 'Món, ship, chốt đơn', out: 'Cảm ơn, mã vận đơn' };
function entryHidden(e) { return !entryText(e, 'vi').text.trim() && !entryText(e, 'en').text.trim(); }
function groupOf(id) { return GLBL[C.stageOf(id)] || ''; }
function stageDef(id) { return C.STAGES.filter(function (g) { return g.id === id; })[0] || C.STAGES[0]; }
function stageNo(id) { return C.STAGES.indexOf(stageDef(id)) + 1; }
/* product photo: always a circle (32 / 44 / 56 / 72), a content colour behind it so nothing shifts when the image decodes */
function avatar(p, sz, big) {
  var u = C.imgOf(p, big);
  return '<span class="av" style="width:' + sz + 'px;height:' + sz + 'px;background:' + (p && p.tint || 'var(--fill-3)') + '">' + (u ? '<img src="' + u + '" width="' + sz + '" height="' + sz + '" alt="" loading="lazy" decoding="async">' : '') + '</span>';
}
function pairHtml(ps, sz) { return '<span class="pair' + (sz >= 72 ? ' l72' : '') + '">' + ps.map(function (p) { return avatar(p, sz); }).join('') + '</span>'; }
/* segmented control: items = [value, html]; tab = switches a view (aria-selected), otherwise a value (aria-pressed) */
function segHtml(items, cur, act, o) {
  o = o || {};
  var i = Math.max(0, items.findIndex(function (x) { return x[0] === cur; })), sel = o.tab ? 'aria-selected' : 'aria-pressed';
  return '<div class="seg ' + (o.cls || '') + '"' + (o.id ? ' id="' + o.id + '"' : '') + ' role="' + (o.tab ? 'tablist' : 'group') + '"' + (o.label ? ' aria-label="' + esc(o.label) + '"' : '') + ' style="--n:' + items.length + ';--i:' + i + '"><span class="th"></span>' +
    items.map(function (x) { return '<button ' + (o.tab ? 'role="tab" ' : '') + 'data-act="' + act + '" ' + (o.attr || '') + ' data-v="' + x[0] + '" ' + sel + '="' + (x[0] === cur) + '">' + x[1] + '</button>'; }).join('') + '</div>';
}
function placeThumb(el) {
  if (!el) return;
  var b = $$('button', el), i = b.findIndex(function (x) { return x.getAttribute('aria-pressed') === 'true' || x.getAttribute('aria-selected') === 'true'; });
  el.style.setProperty('--i', Math.max(0, i));
}
function paintStages() {
  var box = $('#stseg'), seg = box.firstChild;
  if (!seg) {
    box.innerHTML = '<div class="seg stg" role="tablist" aria-label="Các bước trò chuyện" style="--n:5;--i:0"><span class="th"></span>' + C.STAGES.map(function (g, i) {
      return '<button class="sg" role="tab" data-act="stage" data-v="' + g.id + '" data-i="' + (i + 1) + '" aria-selected="false">' + g.lab[0].map(function (w) { return '<span>' + esc(w) + '</span>'; }).join(' ') + '</button>';
    }).join('') + '</div>';
    seg = box.firstChild;
  }
  $$('.sg', seg).forEach(function (b) {
    var g = b.dataset.v, n = g === 'order' ? calc().qty : 0;
    b.setAttribute('aria-selected', g === st.ui.stage);
    if (n) { b.dataset.n = n; b.setAttribute('aria-label', GLBL[g] + ', ' + n + ' món'); } else { delete b.dataset.n; b.removeAttribute('aria-label'); }
  });
  placeThumb(seg);
}
function paintDock() { paintStages(); updateOrderBar(); if (UI.top === 'home') paintHomeOrder(); }
function paintLang() { var el = $('#lsw'); $$('button', el).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === lang); }); placeThumb(el); }
function greetWord() { var h = new Date().getHours(); return h < 11 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'; }
function tileDesc(id) { var n = calc().qty; return id === 'order' && n ? TILEDESC.order + ' · ' + n + ' món' : TILEDESC[id]; }
function paintHomeOrder() { var t = $('#home [data-v=order] .td'); if (t) t.textContent = tileDesc('order'); }
function renderHomeScreen() {
  var tiles = C.STAGES.map(function (g, i) {
    var nm = esc(g.lab[0].join(' '));
    if (i === 4) return '<button class="tile wide" data-act="stage" data-v="' + g.id + '"><span class="tn">' + (i + 1) + '</span><span class="tcol"><span class="tt">' + nm + '</span><span class="td">' + esc(tileDesc(g.id)) + '</span></span>' + ic('chev', 's13') + '</button>';
    return '<button class="tile" data-act="stage" data-v="' + g.id + '"><span class="th1"><span class="tn">' + (i + 1) + '</span>Bước ' + (i + 1) + ic('chev', 's13') + '</span><span class="tt">' + nm + '</span><span class="td">' + esc(tileDesc(g.id)) + '</span></button>';
  }).join('');
  var sg = suggestions()[0];
  homeEl.innerHTML = '<div class="ttl"><h1 id="hgreet">' + greetWord() + '</h1><p class="sub" id="hsub">Khách đang ở bước nào? Chạm để mở câu trả lời.</p></div>' +
    '<h2 class="cap">Trả lời khách</h2><div class="tiles">' + tiles + '</div>' +
    '<h2 class="cap">Thông tin sản phẩm</h2><div class="tiles">' +
    '<button class="tile pt" data-act="pgo" data-v="p"><span class="pc">' + pairHtml(PS.slice(0, 3), 40) + '</span><span class="tt">Theo mẫu' + ic('chev', 's13') + '</span><span class="td">Giá, mô tả, bảng size</span></button>' +
    '<button class="tile pt" data-act="pgo" data-v="s"><span class="pc">' + pairHtml(sg ? [PM[sg[0]], PM[sg[1]]] : PS.slice(3, 5), 40) + '</span><span class="tt">Theo set' + ic('chev', 's13') + '</span><span class="td">Ghép 2 món thành set</span></button></div>';
}
function setTop(v) {
  UI.top = v; homeEl.hidden = v !== 'home'; qrEl.hidden = v !== 'qr'; piEl.hidden = v !== 'pi';
  document.body.dataset.top = v;
  $$('#fbar .fb').forEach(function (b) { b.setAttribute('aria-current', b.dataset.v === v ? 'page' : 'false'); });
  if (v === 'pi') renderPI(); else if (v === 'qr') renderStage(); else { var g = $('#hgreet'); if (g) g.textContent = greetWord(); }
  paintDock();
}
function gotoStage(id) {
  closeAllSheets(); st.ui.stage = id; save();
  if (UI.top !== 'qr') setTop('qr'); else { renderStage(); paintDock(); }
  qrEl.scrollTop = 0;
}
function entrySub(e) {
  if (entryHidden(e)) return '';
  var tx = mtext(e, lang).text, x = tx.replace(/\{\{(\w+)\}\}/g, '…').replace(/\s+/g, ' ').trim();
  return x || entryText(e, 'vi').text.replace(/\{\{(\w+)\}\}/g, '…').replace(/\s+/g, ' ').trim();
}
/* a message card is ONE tap target; a product card is a short list of rows (photo + name + ›) and a search row */
function qcard(c) {
  if (c.kind === 'info' || c.kind === 'size') {
    var ids = candidates().slice(0, 3);
    return '<div class="qc pcard" data-card="' + c.kind + '"><span class="qh" style="padding:0 16px"><span class="t">' + esc(c.t) + '</span></span><span class="q">Chọn mẫu khách hỏi</span><div class="qlst">' + ids.map(function (id) {
      var p = PM[id];
      return '<button class="prw" data-act="pchip" data-id="' + id + '" data-v="' + c.kind + '" aria-label="Mở ' + (c.kind === 'size' ? 'bảng size ' : 'thông tin ') + esc(pname(p, 'vi')) + '">' + avatar(p, 32) + '<span class="nm">' + esc(pname(p, 'vi')) + ' <span class="pp num">· ' + money(pv(p, 'price'), 'vi') + '</span></span>' + ic('chev', 's13') + '</button>';
    }).join('') + '<button class="prw find" data-act="pchoose" data-v="' + c.kind + '"><span class="fico">' + ic('search', 's20') + '</span><span class="nm">Tìm mẫu khác…</span>' + ic('chev', 's13') + '</button></div></div>';
  }
  var e = FM[c.id]; if (!e) return '';
  var hid = entryHidden(e), sub = entrySub(e);
  return '<button class="qc" data-open="f:' + c.id + '"><span class="qh"><span class="t">' + esc(c.t) + '</span>' + ic('chev', 's13') + '</span><span class="q">' + (hid ? 'Gửi kèm tệp: ' + esc(e.attach || eLabel(e)) : '“' + esc(sub) + '”') + '</span><span class="qf">' + (hid ? ic('clip', 's15') + 'Xem lời nhắc đính kèm' : ic('copy', 's15') + 'Mở để xem và chép') + '</span></button>';
}
function renderStage() {
  var g = stageDef(st.ui.stage), h = '';
  $('#qreb').textContent = 'Trả lời nhanh · Bước ' + stageNo(g.id) + '/5'; $('#qrtitle').textContent = GLBL[g.id]; $('#qrsub').textContent = g.desc;
  if (g.id === 'order') h += orderStageHtml();
  else {
    h += '<div class="qlist">' + g.cards.map(qcard).join('') + '</div>';
    if (g.more.length) {
      var on = !!UI.more[g.id];
      h += '<button class="morebtn" data-act="stmore" aria-expanded="' + on + '">Câu khác (' + g.more.length + ')' + ic(on ? 'chevd' : 'chevd', 's13') + '</button>' + (on ? '<div class="qlist">' + g.more.map(qcard).join('') + '</div>' : '');
    }
  }
  PAGE.el.innerHTML = h; qrEl.classList.toggle('o', g.id === 'order');
  paintStages();
  if (g.id === 'order') growAll(PAGE.el);
}
/* product tab */
var homeHtml = '';
function renderPI() {
  var isP = UI.view === 'p', pv0 = $('#pview');
  $$('button', pv0).forEach(function (b) { b.setAttribute('aria-selected', b.dataset.v === UI.view); }); placeThumb(pv0);
  $('#sfield').style.display = isP ? '' : 'none'; $('#pfilt').style.display = isP ? '' : 'none';
  $('#pititle').textContent = isP ? 'Theo mẫu' : 'Theo set';
  $('#pisub').textContent = isP ? 'Chọn mẫu khách hỏi để chép thông tin hoặc size.' : 'Ghép hai món thành một set cho khách.';
  if (isP) renderList(); else $('#hbody').innerHTML = setsViewHtml();
}
function setRow(items, attrs, sub) {
  var ps = items.map(function (id) { return PM[id]; }).filter(Boolean);
  return '<button class="row setrow" ' + attrs + ' aria-label="' + esc(ps.map(function (p) { return pname(p, 'vi'); }).join(' + ') + ', ' + sub) + '">' + pairHtml(ps, 56) +
    '<span class="rtxt"><span class="t">' + ps.map(function (p, i) { return (i ? '+ ' : '') + esc(pname(p, 'vi')); }).join('</span><span class="t">') + '</span><span class="sub s13 num">' + esc(sub) + '</span></span>' + ic('chev', 's13') + '</button>';
}
function setsViewHtml() {
  var h = '<h2 class="cap">Set đã lưu</h2><div class="grp"><button class="row newset" data-act="setnew"><span class="plus">' + ic('plus', 's20') + '</span><span class="rtxt"><span class="t">Tạo set mới</span><span class="sub s13">' + (st.sets.length ? 'Chọn 2 mẫu' : 'Chưa có set nào. Chọn 2 mẫu để ghép') + '</span></span>' + ic('chev', 's13') + '</button>' + st.sets.map(function (x) {
    return setRow(x.items, 'data-open="s:' + x.id + '"', money(C.setPrice(x), 'vi') + (x.checked === false ? ' · chưa kiểm giá' : ''));
  }).join('') + '</div>';
  var sg = suggestions();
  if (sg.length) h += '<h2 class="cap">Gợi ý ghép từ bài đăng</h2><div class="grp">' + sg.map(function (x) { return setRow(x, 'data-act="setsugg" data-a="' + x[0] + '" data-b="' + x[1] + '"', 'Gợi ý · ' + money(C.setSum({ items: x }), 'vi') + ' · chưa kiểm giá'); }).join('') + '</div>';
  return h;
}
function pRow(p) {
  var c = colorOf(p), cat = C.CATL[p.category] || '';
  return '<button class="row prow" data-open="p:' + p.id + '" aria-label="' + esc(pname(p) + ', ' + money(pv(p, 'price'), 'vi')) + '">' + avatar(p, 56) +
    '<span class="rtxt"><span class="t">' + esc(pv(p, 'name')) + '</span><span class="sub"><span class="num" style="flex:none">' + money(pv(p, 'price'), 'vi') + '</span><span class="st2">&nbsp;· ' + (c ? esc(c) + ' · ' : '') + esc(cat) + '</span></span></span>' + ic('chev', 's13') + '</button>';
}
function grp(items, fn) {
  if (items.length <= 20) return '<div class="grp">' + items.map(fn).join('') + '</div>';
  var out = '<div class="grp">';
  for (var i = 0; i < items.length; i += 20) out += '<div class="chunk">' + items.slice(i, i + 20).map(fn).join('') + '</div>';
  return out + '</div>';
}
function catSeg(cur, act, id) {
  var cc = C.catCounts(PS);
  return segHtml(['all'].concat(C.CATS.filter(function (c) { return cc[c]; })).map(function (c) { return [c, (c === 'all' ? 'Tất cả' : C.CATL[c]) + '<span class="n">' + cc[c] + '</span>']; }), cur, act, { tab: true, cls: 'sm5', label: 'Loại sản phẩm', id: id });
}
function paintFilt() { $('#pfilt').innerHTML = catSeg(UI.filt, 'pfilt'); }
function renderList() {
  paintFilt();
  homeHtml = C.collections(C.byCat(PS, UI.filt)).map(function (g) { return '<h2 class="cap">' + esc(g.name) + ' · ' + g.items.length + '</h2>' + grp(g.items, pRow); }).join('');
  if ($('#q').value.trim()) doSearch(); else $('#hbody').innerHTML = homeHtml;
}

/* ---------- order button: shortcut to the "Tạo đơn" stage ---------- */
function updateOrderBar() {
  var c = calc(), b = $('#obtn2'), bd = b.querySelector('.bd');
  bd.hidden = !c.qty; bd.textContent = c.qty;
  b.setAttribute('aria-label', c.count ? 'Đơn hàng, ' + c.qty + ' món, ' + money(c.total, 'vi') : 'Đơn hàng');
  b.classList.toggle('on', UI.top === 'qr' && st.ui.stage === 'order');
}
function bump() { var b = $('#obtn2'); if (b.animate && !reduce) b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 300 }); }
function addLine(pid, size, qty) {
  var d = st.draft, f = d.lines.find(function (L) { return L.pid === pid && L.size === size; });
  if (f) f.qty = Math.min(9, f.qty + (qty || 1)); else d.lines.push({ pid: pid, size: size, qty: qty || 1 });
  setCtxQuiet(pid, size); save(); orderChanged(); bump();
}
function lineQty(pid, size) { var f = st.draft.lines.filter(function (L) { return L.pid === pid && L.size === size; })[0]; return f ? f.qty : 0; }
function inOrderText(pid) { return st.draft.lines.filter(function (L) { return L.pid === pid; }).map(function (L) { return L.size + ' × ' + L.qty; }).join(', '); }
function addedToast(pid, size) { toast('Đã thêm ' + pname(PM[pid], 'vi') + ' · ' + size + ' vào đơn', { act: { label: 'Xem đơn', fn: function () { closeAllSheets(); gotoStage('order'); } } }); }
function orderChanged() { paintDock(); if (UI.top === 'qr' && st.ui.stage === 'order') redrawOrder(); }

/* ---------- order composer (stage "Tạo đơn") ---------- */
function oresHtml() {
  var q = norm(UI.oq || ''), ids = q ? PS.filter(function (p) { return norm(pname(p, 'vi') + ' ' + colorOf(p)).indexOf(q) > -1; }).map(function (p) { return p.id; }).slice(0, 8) : candidates().slice(0, 4);
  if (!ids.length) return '<div class="empty" style="padding-top:12px"><p>Chưa tìm thấy “' + esc(UI.oq) + '”. Thử một tên ngắn hơn nhé.</p><button class="btn tonal" data-act="oqclear">Xoá tìm kiếm</button></div>';
  var fresh = !ctx() && !st.recents.length;
  return (q ? '' : '<div class="secH"><h3 class="cap sm">' + (fresh ? 'Mẫu mới nhất' : 'Mẫu gần đây') + '</h3></div>') + '<div class="grp">' + ids.map(function (id) {
    var p = PM[id], io = inOrderText(id);
    return '<div class="oit" data-pid="' + id + '"><div class="oh">' + avatar(p, 44) + '<span class="rw"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub num">' + money(pv(p, 'price'), 'vi') + '</span></span></div><div class="addrow">' + psizes(p).map(function (z) {
      return '<button class="btn tonal" data-act="oadd" data-id="' + id + '" data-v="' + z + '" aria-label="Thêm ' + esc(pname(p, 'vi')) + ' size ' + z + ' vào đơn">' + ic('plus', 's15') + z + '</button>';
    }).join('') + '<span class="inord">' + (io ? 'Trong đơn: ' + esc(io) : '') + '</span></div></div>';
  }).join('') + '</div>';
}
function olinesHtml() {
  var d = st.draft, rows = '';
  d.lines.forEach(function (L, i) {
    var p = PM[L.pid]; if (!p) return;
    rows += '<button class="row lrow" data-act="lineopen" data-i="' + i + '" aria-label="Sửa món ' + esc(pname(p, 'vi')) + ', size ' + L.size + ', số lượng ' + L.qty + '">' + avatar(p, 44) + '<span class="rtxt"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub">Size ' + L.size + ' · SL ' + L.qty + '</span></span><span class="pr">' + money(pv(p, 'price') * L.qty, 'vi') + '</span>' + ic('chev', 's13') + '</button>';
  });
  return rows ? '<div class="grp">' + rows + '</div>' : '<div class="oempty"><p class="tt">Đơn còn trống</p><p>Chạm ＋ size bên dưới để thêm món nhé.</p></div>';
}
function oshipHtml() {
  var d = st.draft, labels = [['courier', 'Trả shipper'], ['fee', money(st.set.fee, 'vi')], ['free', 'Freeship'], ['custom', 'Khác']];
  return segHtml(labels.map(function (x) { return [x[0], esc(x[1])]; }), d.ship, 'ship', { label: 'Phí ship', cls: 'full' }) +
    (d.ship === 'custom' ? '<input class="fld" style="margin-top:8px" inputmode="numeric" data-in="custom" placeholder="Nhập phí ship (đ)" value="' + (d.custom ? nfV.format(d.custom) : '') + '" aria-label="Phí ship khác">' : '');
}
function ofootHtml() {
  var c = calc();
  return '<div><div class="tl">' + (c.count ? 'Tổng · ' + c.qty + ' món' : 'Chưa có món') + '</div><div class="tv num">' + money(c.total, lang) + '</div></div><button class="btn m" id="obtn" data-act="copyorder"' + (c.count ? '' : ' disabled') + '>' + lblBtn('Chép đơn · ' + lu()) + '</button>';
}
function tnoteHtml() {
  var t = ebVal(PAGE, 'order'), has = /chuyển khoản|transfer note/i.test(t) && /instagram/i.test(t);
  return has ? '<div class="notice row2">' + ic('check', 's15') + '<span class="nb">Đã kèm hướng dẫn ghi tên Instagram khi chuyển khoản</span></div>' : '<div class="notice row2">' + ic('info', 's15') + '<span class="nb">Tin chưa có hướng dẫn nội dung chuyển khoản</span></div>';
}
function postCardHtml() {
  return st.draft.copiedAt && Date.now() - st.draft.copiedAt < 864e5 ? '<button class="qc postcard" data-act="stage" data-v="out"><span class="qh"><span class="t">Khách đã chuyển khoản?</span>' + ic('chev', 's13') + '</span><span class="q">Sang Check out để cảm ơn và gửi mã vận đơn</span></button>' : '';
}
function orderStageHtml() {
  var d = st.draft, h = '<div class="ostage">';
  h += '<div class="secH"><h3 class="cap sm">1 · Món trong đơn</h3><button class="txtbtn" data-act="neworder">' + ic('undo', 's15') + 'Đơn mới</button></div><div id="olines">' + olinesHtml() + '</div>';
  h += '<div class="oadd">' + ic('search') + '<input id="oq" data-oq type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Tìm mẫu để thêm…" aria-label="Tìm mẫu để thêm" value="' + esc(UI.oq) + '"></div><div class="ores" id="ores">' + oresHtml() + '</div>';
  h += '<div class="secH"><h3 class="cap sm">2 · Phí ship</h3></div><div id="oship">' + oshipHtml() + '</div>';
  h += '<div class="secH"><h3 class="cap sm">3 · Thông tin nhận (tuỳ chọn)</h3><button class="btn tonal" data-act="pasteinfo">' + ic('paste', 's15') + 'Dán</button></div><textarea class="ta sel" data-in="info" placeholder="Dán tên, SĐT, địa chỉ khách gửi…" aria-label="Thông tin nhận">' + esc(d.info) + '</textarea>';
  h += '<div style="margin-top:12px">' + (st.set.bank.no ? '<label class="swrow"><span class="sl"><span class="t">Kèm thông tin chuyển khoản</span></span><span class="sw"><input type="checkbox" switch data-in="bank" aria-label="Kèm thông tin chuyển khoản"' + (d.bank ? ' checked' : '') + '><i></i></span></label>' : '<button class="swrow" data-act="bankset"><span class="sl"><span class="t">Thêm STK để kèm vào đơn</span></span>' + ic('chev', 's13') + '</button>') + '</div>';
  h += '<div class="eb" style="margin-top:16px"><div class="ebh"><h3 class="cap sm">4 · Tin chốt đơn</h3>' + editBtn('order') + '</div><div style="margin-bottom:12px">' + leadRow(PAGE, 'order', 'Câu mở đầu') + '</div>' + boxHtml(PAGE, 'order', { label: 'Tin chốt đơn', lead: 'order', leadLab: 'Câu mở đầu' }) + '' + estBlock(PAGE, 'order') + '</div><div id="tnote">' + tnoteHtml() + '</div><div id="opost">' + postCardHtml() + '</div>';
  h += '<div class="ofoot" id="ofoot">' + ofootHtml() + '</div></div>';
  return h;
}
function redrawOrder() {
  if (!$('#olines')) return;
  $('#olines').innerHTML = olinesHtml(); $('#ores').innerHTML = oresHtml(); $('#oship').innerHTML = oshipHtml(); $('#ofoot').innerHTML = ofootHtml();
  refreshPreview(PAGE);
}
/* ---------- sheets ---------- */
var SH = [], sheetsEl = $('#sheets'), appEl = $('#app');
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
  s.H = innerHeight - insetT() - 10;
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
  if (e.key === 'Escape') { if ($('.dlg')) $('.dlg').remove(); else if (SH.length) closeTop(); else if ($('#q').value) { $('#q').value = ''; doSearch(); } }
  if (e.key === 'Tab' && SH.length) {
    var s = topS(), f = $$('button,input,textarea,[tabindex="0"]', s.el).filter(function (x) { return !x.disabled && x.offsetParent; });
    if (!f.length) return; var i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0) { f[f.length - 1].focus(); e.preventDefault(); } else if (!e.shiftKey && i === f.length - 1) { f[0].focus(); e.preventDefault(); }
  }
});
function shHead(title, sub, extra, lead) {
  return '<div class="drag"><i class="grab"></i><div class="shh">' + (lead || '') + '<div class="tw"><h2>' + esc(title) + '</h2>' + (sub ? '<div class="st">' + sub + '</div>' : '') + '</div>' + (extra || '') +
    '<button class="iconbtn" data-act="shclose" aria-label="Đóng"><span class="c">' + ic('x', 's15') + '</span></button></div></div>';
}
function langSeg() { return '<div class="seg lang" role="group" aria-label="Ngôn ngữ" style="--n:2;--i:' + (lang === 'en' ? 1 : 0) + '"><span class="th"></span><button data-act="lang" data-v="vi" aria-pressed="' + (lang === 'vi') + '">VI</button><button data-act="lang" data-v="en" aria-pressed="' + (lang === 'en') + '">EN</button></div>'; }
function setLang(l) {
  if (l === lang) return;
  lang = l; st.set.lang = l; save(); hap(); paintLang();
  PAGE.state.ed = {}; PAGE.state.edit = null;
  if (UI.top === 'qr') { var sc = qrEl.scrollTop; renderStage(); qrEl.scrollTop = sc; }
  SH.forEach(function (s) { s.state.edit = null; s.state.ed = {}; if (s.kind === 'product' || s.kind === 'msg' || s.kind === 'set' || s.kind === 'lead') { rerender(s); afterPaint(function () { growAll(s.el); }); } });
  updateOrderBar();
}
function lblBtn(text, icon) {
  return '<span class="l1">' + (icon === false ? '' : ic('copy', 's20')) + esc(text) + '</span><span class="l2">' + ic('check', 's20') + 'Đã chép</span>';
}

/* ---------- lead-ins ("Câu mở đầu"): a dropdown row, a highlighted strip at the top of the box, a radio picker ----------
   The strip is never inside the textarea: clipboard of a box = strip text + blank line + textarea. */
function leadCur(s, a) {
  var key = a + ':' + lang, cur = Object.prototype.hasOwnProperty.call(s.state.sel, key) ? s.state.sel[key] : C.leadSel(a, lang);
  return C.leadList(a, lang).some(function (x) { return x.id === cur; }) ? cur : null;
}
function leadObj(s, a) { var id = leadCur(s, a); return id ? C.leadList(a, lang).filter(function (y) { return y.id === id; })[0] || null : null; }
function leadText(s, a) { var x = leadObj(s, a); return x ? clean(x.text) : ''; }
function leadRow(s, a, lab) {
  var x = leadObj(s, a), first = !x && !st.tips.lead;
  var val = x ? x.text : first ? 'Không kèm — chạm Đổi để thêm câu chào' : 'Không kèm';
  return '<button class="ddrow" data-act="leadopen" data-a="' + a + '" data-lead="' + a + '" data-lab="' + esc(lab) + '" aria-haspopup="dialog" aria-label="' + esc(lab + ': ' + (x ? x.text : 'Không kèm') + '. Đổi') + '"><span class="dl"><span class="dc">' + esc(lab) + '</span><span class="dv' + (first ? ' hint2' : '') + '">' + esc(val) + '</span></span><span class="dx">Đổi' + ic('chevd', 's13') + '</span></button>';
}
function stripHtml(s, a, lab) {
  var t = leadText(s, a);
  return t ? '<div class="lstrip" data-strip="' + a + '"><div class="lsb"><span class="lc">' + esc(lab || 'Câu mở đầu') + '</span><span class="lt">' + esc(t) + '</span></div><button class="lx" data-act="stripx" data-a="' + a + '" aria-label="Bỏ câu mở đầu">' + ic('x', 's15') + '</button></div>' : '';
}
function slotHtml(s, key, a, lab) { return a ? '<div class="lslot" data-slot="' + key + '" data-a="' + a + '" data-lab="' + esc(lab || 'Câu mở đầu') + '">' + stripHtml(s, a, lab) + '</div>' : ''; }
/* a box's lead action: product info/size, set bubbles a/b, the order message */
function leadKeyOf(s, key) {
  if (s.kind === 'product') return key;
  if (s.kind === 'set') return key === 'sa' ? 'info' : key === 'sb' ? 'size' : null;
  if (s.kind === 'page') return 'order';
  return null;
}
function leadSet(s, a, id) {
  s.state.sel[a + ':' + lang] = id;
  if (id && !st.tips.lead) { st.tips.lead = true; save(); }
  refreshLeadUi(s, a, true);
}
/* repaint every dropdown row and strip of lead action `a` in a scope; the strip that just arrived expands and flashes */
function refreshLeadUi(s, a, flash) {
  var root = s.el;
  $$('[data-lead="' + a + '"]', root).forEach(function (el) { var t = document.createElement('div'); t.innerHTML = leadRow(s, a, el.dataset.lab); el.replaceWith(t.firstChild); });
  $$('.lslot[data-a="' + a + '"]', root).forEach(function (slot) {
    var old = slot.querySelector('.lt'), was = old ? old.textContent : '';
    slot.innerHTML = stripHtml(s, a, slot.dataset.lab);
    var strip = slot.querySelector('.lstrip'), box = slot.parentNode;
    if (strip && flash && strip.querySelector('.lt').textContent !== was) {
      strip.classList.add('arrive');
      var ta = box.querySelector('textarea'); if (ta) ta.scrollTop = 0;
    }
    $$('textarea', box).forEach(growTa);
  });
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
/* ---------- editable boxes ----------
   Every preview is a <textarea>: it starts as the generated BODY, she can type over it, and the clipboard gets strip + box exactly as shown.
   scope.state.ed[key] holds the typed text only while it differs from the generated text; "Khôi phục" drops it, "Lưu làm mẫu" persists it. */
function scopeOf(el) {
  var sh = el && el.closest && el.closest('.sheet');
  if (sh) for (var i = 0; i < SH.length; i++) if (SH[i].el === sh) return SH[i];
  return PAGE;
}
function ebGen(s, key) {
  var k = s.kind, r;
  if (k === 'product') { r = sheetCompose(s, key); return C.stripLead(r.text, r.lead); }
  if (k === 'msg') return msgGen(s).text;
  if (k === 'set') { r = C.composeCopy('set', { set: SM(s.state.id), sel: s.state.sel, bubble: key.slice(1) }, lang); return C.stripLead(r.text, r.lead); }
  if (k === 'page') { r = C.composeCopy('order', { sel: s.state.sel }, lang); return C.stripLead(r.text, r.lead); }
  return '';
}
function ebVal(s, key) { var e = s.state.ed[key]; return e !== undefined ? e : ebGen(s, key); }
/* what the box shows in full (strip + text) = what Chép copies */
function fullText(s, key) { var a = leadKeyOf(s, key), t = a ? leadText(s, a) : '', body = ebVal(s, key); return clean(t ? t + '\n\n' + body : body); }
function estHtml(s, key, edited) {
  if (!edited) return '';
  return '<span class="ed"><b>Đã sửa</b><button class="txtbtn" data-act="ebreset" data-k="' + key + '">' + ic('undo', 's15') + 'Khôi phục</button><button class="txtbtn" data-act="ebsave" data-k="' + key + '">Lưu làm mẫu</button></span>';
}
function estBlock(s, key) { var ed = s.state.ed[key] !== undefined; return '<div class="est" data-est="' + key + '" data-on="' + (ed ? 1 : '') + '">' + estHtml(s, key, ed) + '</div>'; }
function editBtn(key) { return '<button class="txtbtn" data-act="ebedit" data-k="' + key + '">' + ic('pencil', 's15') + 'Sửa</button>'; }
function taHtml(s, key, o) {
  return '<textarea class="eta" data-eta="' + key + '" lang="' + (o.lang || lang) + '" rows="3" spellcheck="false" autocorrect="off" autocapitalize="off" aria-label="' + esc(o.label || 'Nội dung tin nhắn') + '">\n' + esc(ebVal(s, key)) + '</textarea>';
}
function boxHtml(s, key, o) { o = o || {}; return '<div class="ebox" data-box="' + key + '">' + slotHtml(s, key, o.lead, o.leadLab) + taHtml(s, key, o) + '</div>'; }
/* o: {cap, label, lead, leadLab, lang, ddFirst} -> [dropdown?] [caption + Sửa] [dropdown?] box [edited row] */
function ebHtml(s, key, o) {
  o = o || {};
  var dd = o.lead ? '<div class="ddw">' + leadRow(s, o.lead, o.leadLab) + '</div>' : '', head = o.cap ? '<div class="ebh"><h3 class="cap sm">' + esc(o.cap) + '</h3>' + editBtn(key) + '</div>' : '';
  return '<div class="eb" data-eb="' + key + '">' + (o.ddFirst ? dd + head : head + dd) + boxHtml(s, key, o) + estBlock(s, key) + '</div>';
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
/* an upstream choice (link, language, fill, order line...) changed: the generated text is new, the typed text of the old one is dropped (with undo) */
function takeEdits(s, only) {
  var snap = {}, any = false;
  Object.keys(s.state.ed).forEach(function (k) { if (!only || only.indexOf(k) > -1) { snap[k] = s.state.ed[k]; delete s.state.ed[k]; any = true; } });
  return any ? snap : null;
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
function ebFocus(s, key) {
  var ta = s.el.querySelector('[data-eta="' + key + '"]'); if (!ta) return;
  ta.focus(); var n = ta.value.length; try { ta.setSelectionRange(n, n); } catch (e) { /* ignore */ } ta.scrollTop = ta.scrollHeight;
}
function ebSave(s, key) {
  var text = s.state.ed[key]; if (text === undefined) return;
  var msg = null, sub = null, l = lang, body, f;
  if (!clean(text)) { toast('Khung đang trống, chưa lưu được', { bad: true }); return; }
  if (s.kind === 'product') {
    var p = PM[s.state.id]; body = text;
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
    var set = SM(s.state.id), b = key.slice(1); body = clean(text);
    if (b === 'a') { set.ov = set.ov || {}; set.ov[l] = body; } else { set.bov = set.bov || {}; set.bov[b] = set.bov[b] || {}; set.bov[b][l] = body; }
    msg = 'Đã lưu làm mẫu · ' + BLBL[b] + ' · ' + lu(); sub = 'Tin này không tự đổi theo mẫu và giá nữa';
  } else if (s.kind === 'page') {
    var d = st.draft, bk = st.set.bank;
    body = C.stripEnd(text, d.bank && bk.no ? (l === 'en' ? 'Bank transfer: ' : 'Chuyển khoản: ') + [bk.name, bk.no, bk.holder].filter(Boolean).join(' · ') : '');
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
function leadVals(a, id) {
  var ls = C.leadStore(), cu = ls.custom.filter(function (x) { return x.id === id; })[0], seed = (SEED.leadIns[a] || []).filter(function (x) { return x.id === id; })[0] || {}, ee = ls.edits[id] || {};
  return cu ? { vi: cu.vi, en: cu.en, custom: true } : { vi: ee.vi !== undefined ? ee.vi : seed.vi || '', en: ee.en !== undefined ? ee.en : seed.en || '', custom: false };
}
/* ---------- opening-line picker: medium sheet, radio rows, inline Sửa and Thêm ---------- */
function leadTitle(a) { return a === 'size' ? 'Câu trước bảng size' : a === 'order' ? 'Câu mở đầu tin chốt đơn' : 'Câu mở đầu'; }
function leadTarget(a) { return a === 'size' ? 'Bảng size' : a === 'order' ? 'Tin chốt đơn' : 'Thông tin'; }
function openLeadPicker(scope, a) {
  var s = pushSheet({ kind: 'lead', det: 'm', fixed: false, state: { scope: scope, a: a, edit: null, adding: false, sel: {}, ed: {} }, render: renderLead });
  return s;
}
function renderLead(s) {
  var a = s.state.a, sc = s.state.scope, cur = leadCur(sc, a), list = C.leadList(a, lang), h;
  h = shHead(leadTitle(a), 'Đứng đầu tin ' + leadTarget(a) + ' · ' + lu()) + '<div class="shb pad"><div class="grp sheetgrp" role="radiogroup" aria-label="' + esc(leadTitle(a)) + '">';
  var dot = '<span class="rd">' + ic('check') + '</span>';
  h += '<div class="rrow" role="radio" aria-checked="' + !cur + '"><button class="rmain" data-act="leadpick" data-id="">' + dot + '<span class="rt">Không kèm câu</span></button></div>';
  list.forEach(function (x) {
    if (s.state.edit === x.id) {
      var v = leadVals(a, x.id);
      h += '<div class="rrow edit"><div class="lf"><h3 class="cap sm">Tiếng Việt</h3><textarea rows="1" data-lfi="vi" aria-label="Câu mở đầu tiếng Việt">' + esc(v.vi) + '</textarea><h3 class="cap sm">Bản tiếng Anh (tuỳ chọn)</h3><textarea rows="1" data-lfi="en" aria-label="Bản tiếng Anh">' + esc(v.en) + '</textarea>' +
        '<div class="bs"><button class="txtbtn dest" data-act="leaddel" data-id="' + x.id + '">' + (v.custom ? 'Xoá câu này' : 'Ẩn câu này') + '</button><span style="flex:1"></span><button class="txtbtn" data-act="leadcancel">Huỷ</button><button class="btn tonal" data-act="leadsave" data-id="' + x.id + '">Lưu</button></div></div></div>';
      return;
    }
    h += '<div class="rrow" role="radio" aria-checked="' + (x.id === cur) + '"><button class="rmain" data-act="leadpick" data-id="' + x.id + '">' + dot + '<span class="rt">' + esc(x.text) + (x.seed ? '' : '<small>Câu của bạn</small>') + '</span></button><button class="txtbtn" data-act="leadedit" data-id="' + x.id + '" aria-label="Sửa câu: ' + esc(short(x.text, 30)) + '">' + ic('pencil', 's15') + 'Sửa</button></div>';
  });
  h += '</div>';
  if (s.state.adding) h += '<div class="lf addlead"><textarea rows="1" data-lfi="new" placeholder="Câu bạn hay nói trước khi gửi…" aria-label="Câu mở đầu mới"></textarea><div class="bs"><button class="txtbtn" data-act="leadcancel">Huỷ</button><button class="btn tonal" data-act="leadaddsave">Lưu và dùng</button></div></div>';
  else h += '<button class="txtbtn addlead" data-act="leadadd">' + ic('plus', 's15') + 'Thêm câu mới</button>';
  return h + '</div>';
}

/* ---------- product sheet: segmented "what to send", one box, one primary ---------- */
function openProduct(id, open) {
  var seg = open || UI.lastSeg || 'info';
  var s = pushSheet({ kind: 'product', det: 'l', fixed: true, state: { id: id, open: seg, sel: {}, ed: {}, edit: null, guard: null }, render: renderProd });
  afterPaint(function () { growAll(s.el); setCtx(id); });
}
function copyLabel(a) { return a === 'info' ? 'Chép thông tin' : a === 'size' ? 'Chép bảng size' : 'Chép cả hai'; }
function segTitle(a) { return STR.acts[a]; }
function partsOf(open) { return open === 'both' ? ['info', 'size'] : [open]; }
function leadLabFor(open, k) { return open === 'both' ? (k === 'info' ? 'Câu trước thông tin' : 'Câu trước bảng size') : k === 'size' ? 'Câu trước bảng size' : 'Câu mở đầu'; }
function missingNote(s, k) {
  var id = s.state.id, nm = k === 'size' ? 'Bảng size' : 'Thông tin', ol = other(lang).toUpperCase();
  return '<div class="notice card">' + ic('info', 's15') + '<div class="nb">Chưa có bản ' + lu() + ' của ' + nm + '<div class="acts"><button class="btn tonal" data-act="pcopyalt" data-a="' + k + '">' + ic('copy', 's15') + 'Chép bản ' + ol + '</button><button class="btn tonal" data-act="editp" data-id="' + id + '">' + ic('pencil', 's15') + 'Thêm bản ' + lu() + '</button></div></div></div>';
}
/* everything under the segmented control: the boxes, the extras, the sets */
function prodDyn(s) {
  var id = s.state.id, p = PM[id], l = lang, open = s.state.open, h = '', note = pv(p, 'noteVi');
  var parts = partsOf(open), rs = {};
  parts.forEach(function (k) { rs[k] = sheetCompose(s, k); });
  if (open === 'both') {
    var cap = 'Tin sẽ gửi · ' + segTitle('both');
    h += '<div class="dd2 ddw">' + parts.map(function (k) { return rs[k].missing ? '' : leadRow(s, k, leadLabFor(open, k)); }).join('') + '</div>';
    if (rs.info.missing) h += missingNote(s, 'info');
    else {
      h += '<div class="eb" data-eb="both"><div class="ebh"><h3 class="cap sm">' + cap + '</h3>' + editBtn('info') + '</div><div class="ebox both">' + slotHtml(s, 'info', 'info', leadLabFor(open, 'info')) + taHtml(s, 'info', { label: 'Thông tin' });
      if (rs.size.missing) h += '</div>' + '<div class="notice">' + ic('info', 's15') + '<span class="nb">Chưa có bảng size ' + lu() + ': chỉ chép thông tin. <button class="txtbtn" style="min-height:32px;padding:0" data-act="pcopyalt" data-a="size">Chép bản ' + other(l).toUpperCase() + '</button></span></div>';
      else h += '<div class="join">cùng một tin</div>' + slotHtml(s, 'size', 'size', leadLabFor(open, 'size')) + taHtml(s, 'size', { label: 'Bảng size' }) + '</div>';
      h += estBlock(s, 'info') + estBlock(s, 'size') + '</div>';
    }
  } else {
    var k = open;
    if (rs[k].missing) h += missingNote(s, k);
    else h += ebHtml(s, k, { cap: 'Tin sẽ gửi · ' + segTitle(k), label: segTitle(k), lead: k, leadLab: leadLabFor(open, k), ddFirst: true });
  }
  if (open !== 'size') {
    var u = String(pv(p, 'postUrl') || '').trim(), ed = s.state.edit;
    h += '<div class="sec"><div class="secH"><h3 class="cap sm">Gửi kèm</h3></div>';
    if (ed && ed.a === 'link') h += '<div class="lf" style="margin-top:0" data-lead="link"><textarea rows="1" data-lfi="url" placeholder="Link bài viết Instagram…" aria-label="Link bài viết">' + esc(u) + '</textarea><div class="bs"><button class="txtbtn" data-act="leadcancel">Huỷ</button><button class="btn tonal" data-act="linksave">Lưu</button></div></div>';
    else if (u) h += '<label class="swrow"><span style="color:var(--label-2)">' + ic('link', 's20') + '</span><span class="sl"><span class="t">Kèm link bài viết</span><span class="s">' + esc(u.replace(/^https?:\/\//, '')) + '</span></span><span class="sw"><input type="checkbox" switch data-act="linktoggle" aria-label="Kèm link bài viết"' + (s.state.link ? ' checked' : '') + '><i></i></span></label><button class="txtbtn" data-act="linkedit" style="margin-left:-8px">' + ic('pencil', 's15') + 'Sửa link</button>';
    else h += '<div class="grp sheetgrp"><button class="navrow" data-act="linkedit"><span style="color:var(--label-2)">' + ic('link', 's20') + '</span><span class="nt acc">Thêm link bài viết</span></button></div>';
    h += '</div>';
  }
  h += '<div class="sec"><div class="secH"><h3 class="cap sm">Thêm vào đơn</h3></div><div class="addrow">' + psizes(p).map(function (z) {
    return '<button class="btn tonal" data-act="addline" data-id="' + id + '" data-v="' + z + '" aria-label="Thêm ' + esc(pname(p, 'vi')) + ' size ' + z + ' vào đơn">' + ic('plus', 's15') + z + '</button>';
  }).join('') + '<span class="inord" id="pinord">' + (inOrderText(id) ? 'Trong đơn: ' + esc(inOrderText(id)) : '') + '</span></div></div>';
  var mine = st.sets.filter(function (x) { return x.items.indexOf(id) > -1; }).slice(0, 2);
  h += '<div class="sec"><div class="secH"><h3 class="cap sm">Set có mẫu này</h3></div><div class="grp sheetgrp">' + mine.map(function (x) {
    var oth = x.items.filter(function (y) { return y !== id && PM[y]; }), names = oth.map(function (y) { return pv(PM[y], 'name'); }).join(' + ');
    return '<button class="navrow" data-open="s:' + x.id + '">' + pairHtml(x.items.map(function (y) { return PM[y]; }).filter(Boolean), 32) + '<span class="nt">Set với ' + esc(names) + '</span><span class="ns num">' + money(C.setPrice(x), 'vi') + '</span>' + ic('chev', 's13') + '</button>';
  }).join('') + (PL.length > 1 ? '<button class="navrow" data-act="setpick" data-id="' + id + '"><span style="color:var(--label-2)">' + ic('plus', 's20') + '</span><span class="nt">Ghép set với mẫu khác</span>' + ic('chev', 's13') + '</button>' : '') + '</div></div>';
  if (note) h += '<div class="notice" style="margin-top:24px">' + ic('info', 's15') + '<span class="nb"><span class="vh">Ghi chú nội bộ: </span>Ghi chú nội bộ (không gửi cho khách): ' + esc(note) + '</span></div>';
  return h;
}
function prodFoot(s) {
  var open = s.state.open, miss = sheetCompose(s, 'info').missing && (open !== 'size') || sheetCompose(s, 'size').missing && open === 'size';
  return miss ? '<button class="btn dis wide" aria-disabled="true">Chưa có bản ' + lu() + '</button>' : '<button class="btn wide" data-act="pcopy" data-a="' + open + '">' + lblBtn(copyLabel(open) + ' · ' + lu()) + '</button>';
}
function renderProd(s) {
  var id = s.state.id, p = PM[id], l = lang, c = colorOf(p);
  var dt = ptrunc(p, 'desc', l), zt = ptrunc(p, 'size', l), h = '';
  h += shHead(pname(p, 'vi'), money(pv(p, 'price'), 'vi') + (c ? ' · ' + esc(c) : '') + ' · ' + psizes(p).join(' '), langSeg(), avatar(p, 56, true));
  h += '<div class="shb ebody">';
  if (dt || zt) h += '<div class="notice row2" style="margin:0 0 12px">' + ic('info', 's15') + '<span class="nb">' + (dt && zt ? 'Thông tin và bảng size' : dt ? 'Thông tin' : 'Bảng size') + ' bị cắt ở sheet gốc <button class="txtbtn" style="min-height:32px;padding:0 4px" data-act="editp" data-id="' + id + '">' + ic('pencil', 's15') + 'Sửa</button></span></div>';
  h += '<div class="cap sm" style="padding:0 0 6px">Bạn muốn gửi</div>' + segHtml([['info', 'Thông tin'], ['size', 'Bảng size'], ['both', 'Cả hai']], s.state.open, 'pseg', { tab: true, label: 'Bạn muốn gửi', id: 'pseg' }) +
    '<div id="pdyn" style="margin-top:16px">' + prodDyn(s) + '</div></div><div class="shf" id="pfoot">' + prodFoot(s) + '</div>';
  return h;
}
/* switching the segment keeps the thumb, the footer position and every typed edit (edits live per part) */
function prodSeg(s, v) {
  if (s.state.open === v) return;
  clearGuard(s); s.state.open = v; s.state.edit = null;
  var seg = s.el.querySelector('#pseg'); $$('button', seg).forEach(function (b) { b.setAttribute('aria-selected', b.dataset.v === v); }); placeThumb(seg);
  var d = s.el.querySelector('#pdyn'); d.innerHTML = prodDyn(s); if (!reduce) { d.classList.remove('pfade'); void d.offsetWidth; d.classList.add('pfade'); }
  s.el.querySelector('#pfoot').innerHTML = prodFoot(s); growAll(s.el);
}
function productCopy(s, open, btn, forceLang) {
  var l = forceLang || lang, id = s.state.id, p = PM[id], parts = partsOf(open), rs = {}, typed = false, trunc = false, ids = {};
  var shown = parts.filter(function (k) {
    rs[k] = C.composeCopy(k, { pid: id, sel: s.state.sel, link: s.state.link }, l);
    if (rs[k].missing) { if (open === 'both' && k === 'size') return false; return true; }
    return true;
  });
  if (shown.some(function (k) { return rs[k].missing; })) { toast('Chưa có bản ' + l.toUpperCase(), { bad: true }); return; }
  shown.forEach(function (k) {
    Object.keys(rs[k].leadIds).forEach(function (x) { ids[x] = rs[k].leadIds[x]; });
    if (rs[k].trunc && (forceLang || s.state.ed[k] === undefined)) trunc = true;
  });
  if (trunc && !guardPass(s, open + l, btn)) return;
  var text = forceLang ? shown.map(function (k) { return rs[k].text; }).join('\n\n') : shown.map(function (k) { return fullText(s, k); }).join('\n\n');
  var label = pname(p, 'vi') + (open === 'size' ? ' · size' : '');
  copy(text, { btn: btn, label: open === 'size' ? 'Bảng size ' + pname(p, 'vi') : pname(p, 'vi'), lang: l, rec: { k: 'p:' + id + ':' + open, label: label, ref: { t: 'p', id: id, w: open } }, done: function (ok) { if (ok) { commitLeads(ids); UI.lastSeg = open; } } });
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
  var alts = s.state.alts ? '<div class="altv">' + segHtml(s.state.alts.map(function (a) { return [a[0], esc(a[1])]; }), id, 'variant', { label: 'Loại đơn', tab: true }) + '</div>' : '';
  var n = msgPending(s), stg = C.stageOf(id), sub = stg ? 'Bước ' + stageNo(stg) + ' · ' + GLBL[stg] : '';
  return shHead(eLabel(e), sub, langSeg()) +
    '<div class="shb ebody">' +
    (et.fell ? '<div class="notice card" style="margin:0 0 12px">' + ic('info', 's15') + '<div class="nb">Chưa có bản ' + lu() + '. Bên dưới là bản ' + other(lang).toUpperCase() + ', chỉ chép khi bạn muốn gửi tiếng ' + (other(lang) === 'vi' ? 'Việt' : 'Anh') + '.<div class="acts"><button class="btn tonal" data-act="editf" data-id="' + id + '">' + ic('pencil', 's15') + 'Thêm bản ' + lu() + '</button></div></div></div>' : '') +
    alts + ebHtml(s, 'msg', { lang: et.fell ? other(lang) : lang, label: eLabel(e), cap: 'Tin sẽ gửi' }) +
    (e.attach && !isG ? '<div class="att">' + ic('clip', 's15') + 'Nhớ đính kèm: ' + esc(e.attach) + '</div>' : '') +
    (fr ? '<div class="sec"><div class="secH"><h3 class="cap sm">' + (isG ? 'Kèm thông tin mẫu (tuỳ chọn)' : 'Điền vào tin') + '</h3></div><div class="dd2">' + fr + '</div>' + (fromCtx ? '<p class="foot">Lấy từ ' + esc(ctxLabel()) + '</p>' : '') + '</div>' : '') + '</div>' +
    '<div class="shf"><button class="btn wide" id="mcopy" data-act="msgcopy" data-n="' + n + '"' + (n ? ' disabled' : '') + '>' + (n ? 'Điền ' + n + ' chỗ nữa' : lblBtn(msgCopyLabel(et))) + '</button></div>';
}
function candidates() {
  var out = [], c = ctx();
  if (c && c.itemId) out.push(c.itemId);
  st.recents.forEach(function (r) { var m = /^p:([^:]+):/.exec(r.k); if (m && PM[m[1]] && out.indexOf(m[1]) < 0) out.push(m[1]); });
  PS.forEach(function (p) { if (out.indexOf(p.id) < 0) out.push(p.id); });
  return out;
}
/* fills: product = dropdown row (opens the product picker), size = segmented, anything else = a field */
function fillRow(k, fills, s, opt) {
  var cur = opt ? fills.item : fillVal(k, fills), lab = (STR.tokl[k] || k).replace(/^./, function (x) { return x.toUpperCase(); });
  if (k === 'item' || k === 'otherItem') {
    var cur2 = k === 'item' ? cur : fills.otherItem, p = cur2 && PM[cur2];
    return '<button class="ddrow" data-act="pickfill" data-k="' + k + '"' + (opt ? ' data-opt="1"' : '') + ' aria-haspopup="dialog" aria-label="' + esc((opt ? 'Kèm thông tin mẫu' : lab) + ': ' + (p ? pname(p, 'vi') : 'Chưa chọn') + '. Đổi') + '"><span class="dl"><span class="dc">' + (opt ? 'Kèm thông tin mẫu' : esc(lab)) + '</span><span class="dv' + (p ? '' : ' hint2') + '">' + (p ? esc(pname(p, 'vi')) : opt ? 'Không kèm' : 'Chọn mẫu') + '</span></span><span class="dx">' + (p ? 'Đổi' : 'Chọn') + ic('chevd', 's13') + '</span></button>';
  }
  if (/^size/.test(k)) {
    var pid = fillVal('item', fills), sizes = pid ? psizes(PM[pid]) : ['S', 'M', 'L', 'XL'];
    return '<div><div class="dc" style="font-size:13px;line-height:18px;color:var(--label-2);padding:0 0 4px">' + esc(lab) + '</div>' + segHtml(sizes.map(function (z) { return [z, z]; }), cur, 'fill', { label: lab, attr: 'data-k="' + k + '"' }) + '</div>';
  }
  return '<div><div class="dc" style="font-size:13px;line-height:18px;color:var(--label-2);padding:0 0 4px">' + esc(lab) + '</div><input class="fld" data-fill="' + k + '" enterkeyhint="done" value="' + esc(fills[k] || '') + '" placeholder="' + esc(STR.tokl[k] || k) + '" aria-label="' + esc(STR.tokl[k] || k) + '"></div>';
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

/* ---------- product picker ---------- */
function openPicker(mode, cb, o) {
  o = o || {};
  pushSheet({
    kind: 'picker', det: 'l', fixed: true, state: { q: '', mode: mode, cb: cb, title: o.title, sub: o.sub, from: o.from, skip: o.skip || [], first: null, cat: 'all', none: !!o.none, cur: o.cur || null },
    render: function (s) {
      return shHead(s.state.title || 'Chọn mẫu', s.state.sub || 'Chạm một mẫu để chọn') +
        '<div style="padding:0 20px 8px"><div class="sfield" style="margin:0">' + ic('search') + '<input data-pq type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Tìm mẫu" aria-label="Tìm mẫu"></div></div>' +
        '<div class="pkf" id="pkf">' + pkFilt(s) + '</div><div class="shb pad" id="plist">' + pickerList(s) + '</div>';
    }
  });
}
function pkFilt(s) { return catSeg(s.state.cat || 'all', 'pkfilt'); }
function pickerList(s) {
  var q = norm(s.state.q || ''), skip = s.state.skip, from = s.state.from && PM[s.state.from];
  var ps = PS.filter(function (p) { return skip.indexOf(p.id) < 0 && (!s.state.cat || s.state.cat === 'all' || p.category === s.state.cat) && (!q || norm(pname(p, 'vi') + ' ' + colorOf(p)).indexOf(q) > -1); });
  if (from) {
    var sg = function (p) { return isSugg(from.id, p.id); };
    ps = ps.filter(sg).concat(ps.filter(function (p) { return !sg(p) && p.category !== from.category; }), ps.filter(function (p) { return !sg(p) && p.category === from.category; }));
  }
  var none = s.state.none && !q && (s.state.cat === 'all') ? '<button class="row pickrow" data-act="pickone" data-id=""><span class="rtxt"><span class="t">Không kèm</span></span>' + (s.state.cur ? '' : ic('check', 's20').replace('class="i ', 'class="i chk ')) + '</button>' : '';
  if (!ps.length) return '<div class="empty" style="padding-top:12px">' + ic('search', 's34') + '<div class="tt">Chưa tìm thấy' + (q ? ' “' + esc(s.state.q) + '”' : '') + '</div><p>Thử một tên ngắn hơn nhé.</p><button class="btn tonal" data-act="pkclear">Xoá tìm kiếm</button></div>';
  return '<div class="grp sheetgrp">' + none + ps.map(function (p) {
    var chosen = s.state.first === p.id || s.state.cur === p.id;
    return '<button class="row pickrow" data-act="pickone" data-id="' + p.id + '">' + avatar(p, 44) + '<span class="rtxt"><span class="t">' + esc(pname(p, 'vi')) + '</span><span class="sub num">' + money(pv(p, 'price'), 'vi') + '</span></span>' + (from && isSugg(from.id, p.id) ? '<span class="tag">Hay ghép</span>' : '') + (chosen ? ic('check', 's20').replace('class="i ', 'class="i chk ') : '') + '</button>';
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
  var s = pushSheet({ kind: 'set', det: 'l', fixed: true, state: { id: id, sel: {}, edit: null, ed: {}, guard: null, next: 'a', done: {} }, render: renderSet });
  afterPaint(function () { growAll(s.el); });
}
var BLBL = { a: 'Thông tin + giá set', b: 'Bảng size từng món', c: 'Xin số đo', d: 'Link bài viết' };
function setLine(set) {
  var ps = C.setItems(set), sum = C.setSum(set), price = C.setPrice(set);
  if (set.price == null || set.price === '') return 'Để trống = ' + money(sum, 'vi') + ' (tổng giá lẻ)';
  return price !== sum ? 'Giá lẻ ' + ps.map(function (p) { return money(pv(p, 'price'), 'vi'); }).join(' + ') + ' = ' + money(sum, 'vi') + ' → Giá set ' + money(price, 'vi') : 'Giá set ' + money(price, 'vi') + ' (= tổng giá lẻ)';
}
function setVis(s) { var set = SM(s.state.id); return C.SETB.filter(function (b) { return C.setBubble(set, b, lang); }); }
function setNext(s, from) {
  var vis = setVis(s), done = s.state.done, i0 = from ? vis.indexOf(from) : -1, k;
  for (k = 1; k <= vis.length; k++) { var b = vis[(i0 + k + vis.length) % vis.length]; if (!done[b]) return b; }
  return null;
}
function setFoot(s) {
  var vis = setVis(s), n = vis.length, nx = s.state.next, d = vis.filter(function (b) { return s.state.done[b]; }).length;
  if (!nx) return '<button class="btn tonal wide" id="bnext" disabled>' + ic('check', 's20') + 'Đã chép đủ ' + n + ' tin</button>';
  return '<button class="btn wide" id="bnext" data-act="bnext">' + lblBtn('Chép tin ' + (vis.indexOf(nx) + 1) + '/' + n + ' · ' + lu()) + '</button>';
}
function setProgress(s) { var vis = setVis(s); return 'Đã chép ' + vis.filter(function (b) { return s.state.done[b]; }).length + '/' + vis.length; }
function renderSet(s) {
  var set = SM(s.state.id), l = lang, h = '', i = 0, vis = setVis(s);
  if (!s.state.next || vis.indexOf(s.state.next) < 0) s.state.next = setNext(s, null);
  var next = s.state.next;
  h += shHead(C.setLabel(set), 'Set · ' + money(C.setPrice(set), 'vi'), langSeg()) + '<div class="shb pad ebody"><div class="setpic" aria-label="Các món trong set">' + C.setItems(set).map(function (p, i) { return (i ? '<span class="plus">+</span>' : '') + '<span class="sp">' + avatar(p, 72, true) + '<span class="n1">' + esc(pname(p, 'vi')) + '</span><span class="n2 num">' + money(pv(p, 'price'), 'vi') + '</span></span>'; }).join('') + '</div>';
  if (set.checked === false) h += '<div class="notice row2" style="margin:0 0 4px">' + ic('info', 's15') + '<span class="nb">Giá set lấy từ bài đăng, chưa kiểm tra.</span><button class="btn tonal" data-act="setok">Đã kiểm tra</button></div>';
  h += '<div class="sec"><div class="secH"><h3 class="cap sm">Giá set</h3></div><input class="fld" data-sprice inputmode="numeric" placeholder="' + nfV.format(C.setSum(set)) + '" aria-label="Giá set" value="' + (set.price != null && set.price !== '' ? set.price : '') + '"><p class="helper" id="pline">' + esc(setLine(set)) + '</p></div>' +
    '<div class="sec" style="margin-top:16px"><div class="secH"><h3 class="cap sm">Link bài viết (tuỳ chọn)</h3></div><input class="fld" data-spurl placeholder="Để trống = link bài của mẫu" aria-label="Link bài viết" value="' + esc(set.postUrl || '') + '"></div>';
  h += '<div class="sec"><div class="secH"><h3 class="cap sm">Gửi lần lượt ' + vis.length + ' tin</h3><span class="cn" id="sprog">' + setProgress(s) + '</span></div>';
  vis.forEach(function (b) {
    var sb = C.setBubble(set, b, l), r = C.composeCopy('set', { set: set, bubble: b, sel: s.state.sel }, l), done = !!s.state.done[b], isNext = b === next;
    i++;
    h += '<div class="bcard' + (isNext ? ' next' : '') + (done ? ' done' : '') + '" data-b="' + b + '"><div class="bh"><span class="bdisc">' + (done ? ic('check', 's15') : i) + '</span><h3 class="bt cap sm" style="text-transform:none;letter-spacing:0;font-size:15px;color:var(--label)">Tin ' + i + ' · ' + BLBL[b] + '</h3>' + (isNext ? '<span class="btag">Tiếp theo</span>' : done ? '<span class="bdone">Đã chép</span>' : '') + '</div>';
    if (r.missing) h += '<div class="notice card" style="margin:0">' + ic('info', 's15') + '<div class="nb">Chưa có bản ' + lu() + ' của tin này.' + (b === 'c' ? '' : '<div class="acts"><button class="btn tonal" data-act="bcopy" data-b="' + b + '" data-alt="1">' + ic('copy', 's15') + 'Chép bản ' + other(l).toUpperCase() + '</button></div>') + '</div></div>';
    else {
      var lk = b === 'a' ? 'info' : b === 'b' ? 'size' : null;
      h += (lk ? '<div class="ddw">' + leadRow(s, lk, lk === 'info' ? 'Câu mở đầu' : 'Câu trước bảng size') + '</div>' : '') + boxHtml(s, 's' + b, { lang: l, label: 'Tin ' + i, lead: lk, leadLab: lk === 'info' ? 'Câu mở đầu' : 'Câu trước bảng size' }) + estBlock(s, 's' + b);
      if (!sb.auto) h += '<div class="foot">Đang dùng bản đã lưu · <button class="txtbtn" style="min-height:44px;padding:0" data-act="setovreset" data-b="' + b + '">' + ic('undo', 's15') + 'Dùng bản tự soạn</button></div>';
      h += '<div class="bbtn"><button class="btn tonal" data-act="bcopy" data-b="' + b + '">' + lblBtn((done ? 'Chép lại tin ' : 'Chép tin ') + i, true) + '</button></div>';
    }
    h += '</div>';
  });
  h += '<div class="setbtns"><button class="txtbtn" data-act="setadd">' + ic('plus', 's15') + 'Thêm mẫu vào set</button><button class="txtbtn dest" data-act="setdel">Xoá set</button></div></div></div>' +
    '<div class="shf" id="sfoot">' + setFoot(s) + '</div>';
  return h;
}
/* one Instagram bubble of a set: synchronous, guarded when the text is truncated or the set price was never checked */
function bubbleCopy(s, t, b, forceLang, set) {
  var l = forceLang || lang; set = set || SM(s.state.id);
  var r = C.composeCopy('set', { set: set, bubble: b, sel: s.state.sel }, l), typed = s.kind === 'set' && !forceLang && s.state.ed['s' + b] !== undefined;
  if (r.missing) { toast('Chưa có bản ' + l.toUpperCase(), { bad: true }); return; }
  var unchecked = b === 'a' && set.checked === false;
  if (((r.trunc && !typed) || unchecked) && !guardPass(s, 'set' + b + l, t, unchecked ? 'Giá set chưa kiểm tra. Chạm lại để chép nếu giá đúng' : 0)) return;
  var text = forceLang ? r.text : s.kind === 'set' ? fullText(s, 's' + b) : r.text;
  copy(text, { btn: t, label: C.setLabel(set), lang: l, done: function (ok) {
    if (!ok) return;
    commitLeads(r.leadIds); if (set.checked === false) { set.checked = true; var qw = s.el.querySelector('.notice.row2 [data-act=setok]'); if (qw) qw.closest('.notice').remove(); } save();
    if (s.kind === 'set' && !forceLang) {
      s.state.done[b] = true; s.state.next = setNext(s, b);
      var vis = setVis(s);
      $$('.bcard', s.el).forEach(function (x) {
        var bb = x.dataset.b, nx = bb === s.state.next, dn = !!s.state.done[bb], idx = vis.indexOf(bb) + 1;
        x.classList.toggle('next', nx); x.classList.toggle('done', dn);
        x.querySelector('.bdisc').innerHTML = dn ? ic('check', 's15') : idx;
        var tg = x.querySelector('.btag, .bdone'); if (tg) tg.remove();
        if (nx || dn) { var sp = document.createElement('span'); sp.className = nx ? 'btag' : 'bdone'; sp.textContent = nx ? 'Tiếp theo' : 'Đã chép'; x.querySelector('.bh').appendChild(sp); }
        var cb = x.querySelector('.bbtn .l1'); if (cb) cb.lastChild.textContent = (dn ? 'Chép lại tin ' : 'Chép tin ') + idx;
      });
      var pg = s.el.querySelector('#sprog'); if (pg) pg.textContent = setProgress(s);
      s.el.querySelector('#sfoot').innerHTML = setFoot(s);
      var ni = s.state.next ? vis.indexOf(s.state.next) + 1 : 0;
      toast('Đã chép tin ' + (vis.indexOf(b) + 1) + (ni ? ' · Tiếp theo: tin ' + ni : ' · Đã chép đủ ' + vis.length + ' tin'));
      if (s.state.next) { var nc = s.el.querySelector('.bcard[data-b="' + s.state.next + '"]'), sb2 = s.el.querySelector('.shb'); if (nc && sb2) sb2.scrollTo({ top: Math.max(0, nc.offsetTop - sb2.offsetTop - 16), behavior: reduce ? 'auto' : 'smooth' }); }
    }
  } });
}

/* ---------- order line editor (medium sheet): Size, Số lượng, Xoá món ---------- */
function openLine(i) { pushSheet({ kind: 'line', det: 'm', fixed: false, state: { i: i, sel: {}, ed: {} }, render: renderLine }); }
function renderLine(s) {
  var L = st.draft.lines[s.state.i], p = L && PM[L.pid]; if (!p) return shHead('Sửa món', '');
  return shHead('Sửa món', esc(pname(p, 'vi')) + ' · ' + money(pv(p, 'price') * L.qty, 'vi'), '', avatar(p, 44)) + '<div class="shb pad">' +
    '<div class="sec" style="margin-top:8px"><div class="secH"><h3 class="cap sm">Size</h3></div>' + segHtml(psizes(p).map(function (z) { return [z, z]; }), L.size, 'linesize', { label: 'Size' }) + '</div>' +
    '<div class="sec"><div class="secH"><h3 class="cap sm">Số lượng</h3></div><div class="stepper"><button class="btn tonal" data-act="qty" data-d="-1" aria-label="Giảm số lượng">' + ic('minus', 's15') + '</button><span class="v num" id="lqty">' + L.qty + '</span><button class="btn tonal" data-act="qty" data-d="1" aria-label="Tăng số lượng">' + ic('plus', 's15') + '</button></div></div>' +
    '<div class="sec"><button class="txtbtn dest" data-act="linedel" style="margin-left:-8px">Xoá món</button></div></div><div class="shf"><button class="btn wide" data-act="shclose">Xong</button></div>';
}
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
  return '<div class="drag"><i class="grab"></i><div class="sbar">' + (back ? '<button class="txtbtn" data-act="sback" style="gap:2px;padding-left:0">' + ic('back', 's20') + 'Quay lại</button>' : '<span style="width:44px"></span>') + '<span class="tt">' + esc(title) + '</span><button class="txtbtn pri" data-act="shclose">Xong</button></div></div>';
}
function srow(act, data, label, val, chev) { return '<button class="srw" data-act="' + act + '" ' + data + '><span class="l">' + label + '</span>' + (val != null ? '<span class="v">' + esc(val) + '</span>' : '') + (chev === false ? '' : ic('chev', 's13')) + '</button>'; }
function field(label, id, f, val, kind, tokens) {
  var isTa = kind === 'ta';
  return '<h3 class="h2">' + esc(label) + '</h3>' + (isTa ? '<textarea class="fld sel" data-ov="' + id + '" data-f="' + f + '" aria-label="' + esc(label) + '" rows="5">' + esc(val) + '</textarea>' + (tokens ? '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:8px">' + CHIPTOK.map(function (t) { return '<button class="btn tonal" data-act="ins" data-t="' + t + '" aria-label="Chèn ' + t + '" style="height:44px;font-size:13px;padding:0 12px">' + ic('plus', 's13') + t + '</button>'; }).join('') + '</div>' : '') :
    '<input class="fld sel" data-ov="' + id + '" data-f="' + f + '" ' + (kind === 'num' ? 'inputmode="numeric"' : '') + ' value="' + esc(val) + '" aria-label="' + esc(label) + '">');
}
function needCheck() { return PL.filter(function (p) { return p.truncated && p.truncated.some(function (f) { return !ov(p.id)[f]; }); }).length; }
function leadRows(a) {
  var s = C.leadStore(), seeds = SEED.leadIns[a] || [], out = [];
  s.custom.filter(function (x) { return x.action === a; }).forEach(function (x) { out.push(srow('spage', 'data-p="lead:' + a + ':' + x.id + '"', esc(x.vi || x.en || '(trống)'), 'Câu của bạn').replace('class="srw"', 'class="srw two"')); });
  seeds.forEach(function (x) { var e = s.edits[x.id] || {}, hid = s.hidden.indexOf(x.id) > -1; out.push(srow('spage', 'data-p="lead:' + a + ':' + x.id + '"', esc((e.vi !== undefined ? e.vi : x.vi) || '(trống)'), hid ? 'Đã ẩn' : e.vi !== undefined || e.en !== undefined ? 'Đã sửa' : 'Câu gợi ý').replace('class="srw"', 'class="srw two"')); });
  return out;
}
function settingsPage(s) {
  var path = s.state.path, pg = path[path.length - 1], back = path.length > 1, body = '';
  var parts = pg.split(':');
  if (pg === 'main') {
    body = '<h3 class="h2" style="margin-top:8px">Ngôn ngữ đang dùng</h3>' + segHtml([['vi', 'Tiếng Việt'], ['en', 'English']], lang, 'setlang', { cls: 'full', label: 'Ngôn ngữ đang dùng' }) + '<p class="foot">App nhớ ngôn ngữ bạn chọn lần cuối.</p>' +
      '<h3 class="h2">Đơn hàng</h3><div class="slist">' + srow('spage', 'data-p="ship"', 'Phí ship', money(st.set.fee, 'vi')) + srow('spage', 'data-p="bank"', 'Chuyển khoản', st.set.bank.no ? st.set.bank.no : 'Chưa có') + '</div>' +
      '<h3 class="h2">Nội dung</h3><div class="slist">' + srow('spage', 'data-p="list:p"', 'Mẫu', needCheck() ? needCheck() + ' cần kiểm tra' : PL.length) + srow('spage', 'data-p="leads"', 'Câu mở đầu') + srow('spage', 'data-p="sets"', 'Set', st.sets.length) + srow('spage', 'data-p="list:f"', 'Câu trả lời', FL.filter(function (e) { return !!groupOf(e.id); }).length) + srow('spage', 'data-p="ord"', 'Mẫu tóm tắt đơn') + '</div>' +
      '<h3 class="h2">Dữ liệu</h3><div class="slist">' + srow('export', '', 'Xuất bản sao lưu (.json)', null, false) + srow('import', '', 'Nhập bản sao lưu', null, false) + srow('resetall', '', 'Khôi phục nội dung gốc', null, false).replace('class="srw"', 'class="srw dest"') + '</div>' +
      '<p class="foot" style="text-align:center;margin-top:24px">Soft Embrace · 2.0<br>Làm bằng sự dịu dàng.</p>';
    return sNav('Tuỳ chỉnh', false) + '<div class="shb pad"><p class="foot csub">Chỉnh một lần, dùng mãi nhé.</p>' + body + '</div>';
  }
  var title;
  if (pg === 'ship') { title = 'Phí ship'; body = field('Phí ship (đ)', '__set', 'fee', st.set.fee, 'num') + '<p class="foot">Dùng khi chọn mức phí cố định trong đơn hàng.</p>'; }
  else if (pg === 'bank') { title = 'Chuyển khoản'; body = field('Ngân hàng', '__bank', 'name', st.set.bank.name) + field('Số tài khoản', '__bank', 'no', st.set.bank.no, 'num') + field('Chủ tài khoản', '__bank', 'holder', st.set.bank.holder) + '<p class="foot">Được thêm cuối tin nhắn chốt đơn khi bật “Kèm thông tin chuyển khoản”.</p>'; }
  else if (pg === 'ord') {
    title = 'Tóm tắt đơn';
    var o = st.ov.__ord || {};
    body = field('Tóm tắt đơn · VI', '__ord', 'vi', o.vi !== undefined ? o.vi : SEED.orderTemplate.vi, 'ta') + field('Order recap · EN', '__ord', 'en', o.en !== undefined ? o.en : C.normEn(SEED.orderTemplate.en), 'ta') + '<p class="foot">Dùng {{orderLines}} và {{total}}. Dòng “• Shipping…” được thay theo mức phí đã chọn.</p><button class="txtbtn" data-act="resetitem" data-id="__ord">Khôi phục bản gốc</button>';
  } else if (pg === 'leads') {
    title = 'Câu mở đầu';
    body = '<p class="foot" style="margin-top:8px">Câu ngắn đứng đầu tin gửi. Thêm nhanh ngay trong màn hình chép; ở đây để sửa, ẩn hoặc khôi phục.</p><div class="slist">' + ['info', 'size', 'order', 'thanks'].map(function (a) { return srow('spage', 'data-p="leadlist:' + a + '"', STR.lacts[a], leadRows(a).length); }).join('') + '</div>';
  } else if (parts[0] === 'leadlist') {
    title = STR.lacts[parts[1]];
    body = '<div class="slist" style="margin-top:8px">' + leadRows(parts[1]).join('') + srow('leadnew', 'data-a="' + parts[1] + '"', 'Thêm câu mới', null, false).replace('class="srw"', 'class="srw acc"') + '</div>';
  } else if (parts[0] === 'lead') {
    var a = parts[1], lid = parts[2], ls = C.leadStore(), cu = ls.custom.filter(function (x) { return x.id === lid; })[0], seedx = (SEED.leadIns[a] || []).filter(function (x) { return x.id === lid; })[0], ee = ls.edits[lid] || {}, hid = ls.hidden.indexOf(lid) > -1;
    title = 'Sửa câu mở đầu';
    var vi = cu ? cu.vi : ee.vi !== undefined ? ee.vi : seedx.vi, en = cu ? cu.en : ee.en !== undefined ? ee.en : seedx.en;
    body = '<h3 class="h2">Tiếng Việt</h3><textarea class="fld sel" data-lfs="vi" data-id="' + lid + '" data-a="' + a + '" rows="3" aria-label="Tiếng Việt">' + esc(vi) + '</textarea><h3 class="h2">Tiếng Anh (tuỳ chọn)</h3><textarea class="fld sel" data-lfs="en" data-id="' + lid + '" data-a="' + a + '" rows="3" aria-label="Tiếng Anh">' + esc(en) + '</textarea><p class="saved" id="saved" style="text-align:right">Đã lưu</p>' +
      (cu ? '<button class="txtbtn dest" data-act="leadrm" data-id="' + lid + '">Xoá câu này</button>' : hid ? '<button class="txtbtn" data-act="leadshow" data-id="' + lid + '">Khôi phục (hiện lại)</button>' : '<button class="txtbtn" data-act="leadhide" data-id="' + lid + '">Ẩn câu này</button>') +
      (seedx && (ls.edits[lid]) ? ' <button class="txtbtn" data-act="leadreset" data-id="' + lid + '">Khôi phục bản gốc</button>' : '');
  } else if (pg === 'sets') {
    title = 'Set';
    body = st.sets.length ? '<div class="slist" style="margin-top:8px">' + st.sets.map(function (x) { return srow('setopen', 'data-id="' + x.id + '"', esc(C.setLabel(x)), money(C.setPrice(x), 'vi')); }).join('') + '</div>' : '<div class="empty" style="padding-top:16px"><p>Chưa có set nào. Chọn 2 mẫu để ghép nhé.</p><button class="btn tonal" data-act="setnew">' + ic('plus', 's15') + 'Tạo set mới</button></div>';
  } else if (parts[0] === 'list') {
    title = parts[1] === 'p' ? 'Mẫu' : 'Câu trả lời';
    var list = parts[1] === 'p' ? PS.map(function (p) { return srow('spage', 'data-p="edit:p:' + p.id + '"', esc(pname(p, 'vi')), p.truncated && p.truncated.some(function (f) { return !ov(p.id)[f]; }) ? 'Cần kiểm tra' : null); }) :
      FL.filter(function (e) { return !!groupOf(e.id) || e.id === 'order-recap'; }).map(function (e) { return srow('spage', 'data-p="edit:f:' + e.id + '"', esc(eLabel(e)), st.ov[e.id] ? 'Đã sửa' : null); });
    body = '<div class="slist" style="margin-top:8px">' + list.join('') + '</div>';
  } else if (parts[0] === 'edit') {
    if (parts[1] === 'p') {
      var p = PM[parts[2]]; title = short(pname(p, 'vi'));
      body = field('Tên', p.id, 'name', pv(p, 'name')) + field('Emoji', p.id, 'emoji', pv(p, 'emoji')) + field('Giá (đ)', p.id, 'price', pv(p, 'price'), 'num') + field('Size (cách nhau dấu phẩy)', p.id, 'sizes', psizes(p).join(', ')) +
        field('Thông tin · VI', p.id, 'descVi', pv(p, 'descVi'), 'ta') + field('Thông tin · EN', p.id, 'descEn', pv(p, 'descEn'), 'ta') + field('Bảng size · VI', p.id, 'sizeVi', pv(p, 'sizeVi'), 'ta') + field('Bảng size · EN', p.id, 'sizeEn', pv(p, 'sizeEn'), 'ta') + field('Link bài viết Instagram', p.id, 'postUrl', pv(p, 'postUrl') || '') + field('Ghi chú nội bộ (không chép)', p.id, 'noteVi', pv(p, 'noteVi') || '', 'ta') +
        (p.truncated ? '<div class="notice">' + ic('info', 's15') + '<span class="nb">Cần kiểm tra: ' + p.truncated.join(', ') + ' trong sheet bị cắt.</span></div>' : '') + '<button class="txtbtn" data-act="resetitem" data-id="' + p.id + '">Khôi phục bản gốc</button>';
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
function refreshAll() { IDX = null; renderList(); renderHomeScreen(); if (UI.top === 'pi' && UI.view === 's') renderPI(); if (UI.top === 'qr') renderStage(); paintDock(); }

/* ---------- search (product tab, "Theo mẫu") ---------- */
var IDX = null;
function buildIndex() {
  IDX = PS.map(function (p) { return { id: p.id, name: norm(pname(p, 'vi') + ' ' + pname(p, 'en')), title: norm(colorOf(p)), text: norm(ptext(p, 'desc', 'vi') + ' ' + ptext(p, 'desc', 'en')) }; });
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
  hits = hits.filter(function (x) { return UI.filt === 'all' || PM[x[1].id].category === UI.filt; });
  box.innerHTML = hits.length ? '<h2 class="cap">Kết quả · ' + hits.length + '</h2><div class="grp">' + hits.map(function (x) { return pRow(PM[x[1].id]); }).join('') + '</div>' : '<div class="empty">' + ic('search', 's34') + '<div class="tt">Chưa tìm thấy “' + esc(raw.trim()) + '”</div><p>Thử một tên ngắn hơn nhé.</p></div>';
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

/* press highlight on list rows (the long-press menu of round 4 is gone: every action has a visible button) */
(function () {
  var sx, sy, pressRow, pressT;
  document.addEventListener('pointerdown', function (e) {
    var r = e.target.closest('.row'); clearTimeout(pressT); sx = e.clientX; sy = e.clientY;
    if (r && !e.target.closest('button:not(.row)')) { pressRow = r; pressT = setTimeout(function () { if (pressRow) pressRow.classList.add('press'); }, 70); }
  }, { passive: true });
  document.addEventListener('pointermove', function (e) {
    if (pressRow && (Math.abs(e.clientX - sx) > 10 || Math.abs(e.clientY - sy) > 10)) { clearTimeout(pressT); pressRow.classList.remove('press'); pressRow = null; }
  }, { passive: true });
  function up() { clearTimeout(pressT); if (pressRow) { pressRow.classList.remove('press'); pressRow = null; } }
  document.addEventListener('pointerup', up, { passive: true });
  document.addEventListener('pointercancel', up, { passive: true });
})();
function selectSeg(seg, v) {
  if (!seg) return;
  $$('button', seg).forEach(function (b) { b.setAttribute(b.hasAttribute('aria-selected') ? 'aria-selected' : 'aria-pressed', b.dataset.v === v); });
  placeThumb(seg);
}

/* ---------- main click delegation ---------- */
document.addEventListener('click', function (e) {
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
    case 'top': if (v !== UI.top) setTop(v); else if (v !== 'home') { var sc0 = v === 'qr' ? qrEl : piEl; if (sc0.scrollTop > 0) sc0.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); } break;
    case 'stage': gotoStage(v); break;
    case 'stmore': UI.more[st.ui.stage] = !UI.more[st.ui.stage]; renderStage(); break;
    case 'pview': UI.view = v; renderPI(); break;
    case 'pgo': UI.view = v; setTop('pi'); piEl.scrollTop = 0; break;
    case 'pfilt': UI.filt = v; renderList(); break;
    case 'pkfilt': s.state.cat = v; selectSeg($('#pkf .seg', s.el), v); $('#plist', s.el).innerHTML = pickerList(s); break;
    case 'pkclear': { s.state.q = ''; var pq = $('[data-pq]', s.el); if (pq) pq.value = ''; $('#plist', s.el).innerHTML = pickerList(s); break; }
    case 'pchoose': { var kind = v; openPicker('pick', function (pid) { openProduct(pid, kind); }, { title: 'Chọn mẫu', sub: kind === 'size' ? 'Chạm một mẫu để gửi bảng size' : 'Chạm một mẫu để gửi thông tin' }); break; }
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
    case 'toastact': { var tf = toast.fn; toast.fn = null; var te = $('.toast', toastEl); if (te) te.remove(); if (tf) tf(); break; }
    /* product sheet */
    case 'pseg': prodSeg(s, v); break;
    case 'pcopy': productCopy(s, A, t); break;
    case 'pcopyalt': productCopy(s, A, t, other(lang)); break;
    case 'ebedit': ebFocus(s, t.dataset.k); break;
    case 'ebreset': ebReset(s, t.dataset.k); break;
    case 'ebsave': ebSave(s, t.dataset.k); break;
    case 'addline': {
      addLine(id, v); addedToast(id, v);
      var io = s.el.querySelector('#pinord'); if (io) io.textContent = 'Trong đơn: ' + inOrderText(id);
      break;
    }
    case 'setpick': openSetPicker(id); break;
    case 'linktoggle': s.state.link = t.checked; refreshPreview(s, ['info']); break;
    case 'linkedit': { s.state.edit = { a: 'link' }; $('#pdyn', s.el).innerHTML = prodDyn(s); var lt = $('[data-lead=link] textarea', s.el); if (lt) { lt.focus(); grow(lt); } break; }
    case 'linksave': {
      var pu = $('[data-lead=link] textarea', s.el).value.trim(); st.ov[s.state.id] = st.ov[s.state.id] || {}; st.ov[s.state.id].postUrl = pu; if (!pu) s.state.link = false;
      s.state.edit = null; save(); var snapL = takeEdits(s, ['info']); $('#pdyn', s.el).innerHTML = prodDyn(s); growAll(s.el); editsToast(s, snapL); break;
    }
    /* opening lines */
    case 'leadopen': openLeadPicker(s, A); break;
    case 'stripx': leadSet(s, A, null); break;
    case 'leadpick': {
      var ls0 = s.state.scope, la = s.state.a;
      $$('.rrow[role=radio]', s.el).forEach(function (r) { r.setAttribute('aria-checked', (r.querySelector('[data-act=leadpick]').dataset.id || '') === (id || '')); });
      leadSet(ls0, la, id || null); setTimeout(function () { closeSheet(s); }, 200); break;
    }
    case 'leadedit': s.state.edit = id; s.state.adding = false; rerender(s); { var fe = $('[data-lfi=vi]', s.el); if (fe) { fe.focus(); grow(fe); } grow($('[data-lfi=en]', s.el)); } break;
    case 'leadcancel':
      if (s.kind === 'lead') { s.state.edit = null; s.state.adding = false; rerender(s); }
      else { s.state.edit = null; $('#pdyn', s.el).innerHTML = prodDyn(s); growAll(s.el); }
      break;
    case 'leadsave': {
      var lv = {}; $$('[data-lfi]', s.el).forEach(function (x) { lv[x.dataset.lfi] = x.value; });
      saveLeadEdit(id, s.state.a, lv.vi || '', lv.en || ''); s.state.edit = null; toast('Đã lưu câu mở đầu'); refreshLeadUi(s.state.scope, s.state.a, false); rerender(s); break;
    }
    case 'leaddel': {
      var undo = removeLead(id), sc1 = s.state.scope, a1 = s.state.a;
      Object.keys(sc1.state.sel).forEach(function (k2) { if (sc1.state.sel[k2] === id) delete sc1.state.sel[k2]; });
      s.state.edit = null; rerender(s); refreshLeadUi(sc1, a1, false);
      toast('Đã bỏ câu mở đầu', { undo: function () { undo(); rerender(s); refreshLeadUi(sc1, a1, false); } }); break;
    }
    case 'leadadd': s.state.adding = true; s.state.edit = null; rerender(s); { var na = $('[data-lfi=new]', s.el); if (na) na.focus(); } break;
    case 'leadaddsave': {
      var tx = ($('[data-lfi=new]', s.el) || {}).value || '';
      if (tx.trim()) { var nid = addLead(s.state.a, lang, tx); leadSet(s.state.scope, s.state.a, nid); toast('Đã lưu câu mở đầu'); closeSheet(s, true); } else { s.state.adding = false; rerender(s); }
      break;
    }
    /* replies / message */
    case 'fill': {
      var snapF = takeEdits(s), fk = t.dataset.k;
      s.state.fills[fk] = v;
      if (fk === 'size') { setCtxQuiet(ctx() ? ctx().itemId : null, v); }
      rerender(s); afterPaint(function () { growAll(s.el); }); editsToast(s, snapF); break;
    }
    case 'pickfill': {
      var kk = t.dataset.k, ms = s, opt = !!t.dataset.opt, curId = kk === 'item' ? (opt ? ms.state.fills.item : fillVal('item', ms.state.fills)) : ms.state.fills.otherItem;
      openPicker('pick', function (pid) {
        var sn = takeEdits(ms); ms.state.fills[kk] = pid;
        if (kk === 'item' && pid) { setCtxQuiet(pid, ctx() && ctx().itemId === pid ? ctx().size : null); var sz = psizes(PM[pid]); if (ms.state.fills.size && sz.indexOf(ms.state.fills.size) < 0) delete ms.state.fills.size; }
        rerender(ms); afterPaint(function () { growAll(ms.el); }); editsToast(ms, sn);
      }, { none: opt, cur: curId || null, title: opt ? 'Kèm thông tin mẫu' : 'Chọn mẫu' });
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
    case 'tok': { var row = s.el.querySelector('[data-k="' + t.dataset.k + '"]:not(.tok)') || s.el.querySelector('[data-fill="' + t.dataset.k + '"]'); var fr = (row || t).closest('.frow'); if (fr) { fr.scrollIntoView({ block: 'nearest' }); var inp = fr.querySelector('input'); if (inp) inp.focus(); } break; }
    case 'msgcopy': msgCopy(s, t); break;
    /* order */
    case 'oadd': addLine(id, v); break;
    case 'oqclear': UI.oq = ''; { var oqi = $('#oq'); if (oqi) oqi.value = ''; var oe0 = $('#ores'); if (oe0) oe0.innerHTML = oresHtml(); } break;
    case 'lineopen': openLine(+t.dataset.i); break;
    case 'linesize': {
      var L = st.draft.lines[s.state.i], dup = st.draft.lines.find(function (x, j) { return j !== s.state.i && x.pid === L.pid && x.size === v; });
      if (dup) { dup.qty = Math.min(9, dup.qty + L.qty); st.draft.lines.splice(s.state.i, 1); save(); orderChanged(); closeSheet(s); break; }
      L.size = v; save(); orderChanged(); rerender(s); break;
    }
    case 'qty': { var L2 = st.draft.lines[s.state.i]; L2.qty = Math.max(1, Math.min(9, L2.qty + (+t.dataset.d))); save(); orderChanged(); rerender(s); break; }
    case 'linedel': { var i2 = s.state.i, snap = JSON.stringify(st.draft), nm = PM[st.draft.lines[i2].pid]; st.draft.lines.splice(i2, 1); save(); orderChanged(); closeSheet(s, true); toast('Đã xoá ' + pname(nm, 'vi'), { undo: function () { st.draft = JSON.parse(snap); save(); orderChanged(); } }); break; }
    case 'ship': st.draft.ship = v; save(); orderChanged(); break;
    case 'pasteinfo': try { navigator.clipboard.readText().then(function (x) { st.draft.info = x; save(); var ti = $('[data-in=info]'); if (ti) ti.value = x; refreshPreview(PAGE); }, function () { var ta = $('[data-in=info]'); if (ta) ta.focus(); }); } catch (x) { var ta2 = $('[data-in=info]'); if (ta2) ta2.focus(); } break;
    case 'copyorder': {
      if (!st.draft.lines.length) break;
      var r = C.composeCopy('order', { sel: PAGE.state.sel }, lang), total = calc().total, otext = fullText(PAGE, 'order');
      copy(otext, { btn: t, msg: 'Đã chép đơn · ' + money(total, lang) + ' · ' + lu(), sub: 'Nhớ gửi mã QR nhé', icon: 'clip', label: 'Đơn', lang: lang, done: function (ok) { if (ok) { commitLeads(r.leadIds); st.draft.copiedAt = Date.now(); save(); afterPaint(function () { var op = $('#opost'); if (op) op.innerHTML = postCardHtml(); }); } } });
      break;
    }
    case 'neworder': { var sn = JSON.stringify(st.draft); st.draft = { lines: [], ship: 'courier', custom: 0, info: '', bank: true, copiedAt: 0 }; PAGE.state.ed = {}; save(); renderStage(); paintDock(); updateOrderBar(); toast('Đã làm mới đơn', { undo: function () { st.draft = JSON.parse(sn); save(); renderStage(); paintDock(); updateOrderBar(); } }); break; }
    /* sets */
    case 'setnew': openPicker('setnew', function (pair) { var set = createSet(pair); openSet(set.id); }, { title: 'Chọn 2 mẫu cho set', sub: 'Chạm mẫu thứ nhất, rồi mẫu thứ hai' }); break;
    case 'bcopy': bubbleCopy(s, t, t.dataset.b, t.dataset.alt ? other(lang) : null); break;
    case 'bnext': bubbleCopy(s, t, s.state.next); break;
    case 'setok': SM(s.state.id).checked = true; save(); rerender(s); afterPaint(function () { growAll(s.el); }); break;
    case 'setsugg': { var sx = createSet([t.dataset.a, t.dataset.b], false); openSet(sx.id); break; }
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
    case 'leadnew': { var nid2 = addLead(A, 'vi', ''); settingsGo(s, s.state.path.concat(['lead:' + A + ':' + nid2]), 1); break; }
    case 'leadrm': { var u = removeLead(id); settingsGo(s, s.state.path.slice(0, -1), -1); toast('Đã xoá câu mở đầu', { undo: u }); break; }
    case 'leadhide': { var u2 = removeLead(id); settingsGo(s, s.state.path, 0); toast('Đã ẩn câu mở đầu', { undo: function () { u2(); } }); break; }
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
  else if (t.matches('[data-sprice]')) { var d0 = t.value.replace(/\D/g, ''); SM(s.state.id).price = d0 ? parseInt(d0, 10) : null; save(); refreshPreview(s, ['sa']); }
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
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('[data-fill],[data-pq],#q,#oq,[data-in=custom],[data-sprice],[data-spurl]')) e.target.blur(); });

/* ---------- boot ---------- */
$('#hint').hidden = !!st.hintDone;
paintLang(); renderHomeScreen(); renderStage(); renderPI(); setTop('home');
idle(function () { if (!IDX) buildIndex(); });
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', function () {
    var had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(function () { /* no worker: the app still runs online */ });
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (had) toast('Có bản mới — đóng và mở lại app nhé', { icon: 'sparkle', ms: 4000 }); had = true; });
  });
}
window.__SE = { boot: performance.now() - T0, st: st, calc: calc, PS: PS, composeCopy: C.composeCopy, STAGES: C.STAGES, ins: function () { return INS; }, measure: measureInsets, leadList: C.leadList, leadSet: function (a, id) { var s = topS(); leadSet(s || PAGE, a, id); } };
})();
