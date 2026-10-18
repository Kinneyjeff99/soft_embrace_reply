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
st.draft = Object.assign({ lines: [], ship: 'courier', custom: 0, info: '', bank: true, copiedAt: 0, done: {}, at: 0, eds: {}, fill: {}, seq: {} }, st.draft || {});
st.draft.done = st.draft.done || {};
st.rp = Array.isArray(st.rp) ? st.rp : [];   /* recent products: [{p, at}] — copied or added in the last 7 days */
st.set = Object.assign({ lang: 'vi', fee: 25000, bank: { name: '', no: '', holder: '' } }, st.set || {});
st.lead = Object.assign({ sel: {}, custom: [], edits: {}, hidden: [] }, st.lead || {});
st.sets = st.sets || [];
st.ui = Object.assign({ stage: 'greet', greetV: 'new', sizeAsk: false, thanksV: null }, st.ui || {});
st.tips = Object.assign({ copy: 0, lead: false }, st.tips || {});
var saveT;
function save() { clearTimeout(saveT); saveT = setTimeout(flush, 300); }
/* typed card edits, the tracking code and the sequence ticks are part of the customer draft (st.draft.eds / fill / seq): an iOS app kill must not lose them.
   An edit already sent (successful copy) is not persisted again; it stays in the card for this session only. */
function flush() { try { st.draft.eds = buildEds(); st.draft.fill = FILL; st.draft.seq = SEQ; localStorage.setItem(LS, JSON.stringify(st)); } catch (e) { /* storage blocked: stay in memory */ } }
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
    toast(o.msg || ('Đã chép · ' + short(o.label || 'Văn bản') + ' · ' + l.toUpperCase()), { sub: o.sub || (n < 3 ? STR.tip : undefined), icon: o.icon, act: o.act });
    if (n < 3) { st.tips.copy = n + 1; save(); }
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
function commitRecent(key, l) {
  st.recents = st.recents.filter(function (r) { return r.k !== key.k + l; });
  st.recents.unshift({ k: key.k + l, label: key.label, lang: l, ref: key.ref });
  st.recents = st.recents.slice(0, 8);
  save();
}
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
  var on = new URLSearchParams(location.hash.slice(1)).getAll('debug').indexOf('insets') > -1, el = $('#dbg');
  if (!on) { if (el) el.remove(); return; }
  if (!el) { el = document.createElement('div'); el.id = 'dbg'; document.body.appendChild(el); }
  var vv = window.visualViewport;
  el.textContent = 'sat ' + INS.sat + '  sab ' + INS.sab + '\nframed ' + INS.framed + '  shrunk ' + INS.shrunk + '\ninnerHeight ' + innerHeight + '  screen ' + screen.height + '\nvisualViewport ' + (vv ? Math.round(vv.height) : '-') + '\n--inset-b ' + INS.b + '  --inset-t ' + INS.t + '\n--bar-y ' + Math.max(INS.b - 10, 12) + '  ctx ' + document.body.dataset.ctx;
}
/* Dynamic Type: every font size in the CSS is calc(Npx * var(--ts)). On iOS "font: -apple-system-body" reports the size she chose in Settings; elsewhere it stays 17px, so --ts = 1.
   #ts=1.41 forces a scale (tests). Capped so the layout stays usable. */
function textScale() {
  var q = new URLSearchParams(location.hash.slice(1)).get('ts'), ts = 1;
  if (q) ts = parseFloat(q) || 1;
  else { var p = document.createElement('span'); p.style.cssText = 'position:absolute;visibility:hidden;font:-apple-system-body'; p.textContent = 'A'; document.body.appendChild(p); ts = (parseFloat(getComputedStyle(p).fontSize) || 17) / 17; p.remove(); }
  ts = Math.max(1, Math.min(1.5, ts)); document.documentElement.style.setProperty('--ts', ts.toFixed(3)); document.documentElement.classList.toggle('tsx', ts > 1.04);   /* .tsx: large text, labels may wrap */
}
textScale();
document.addEventListener('visibilitychange', function () { if (!document.hidden) textScale(); });
addEventListener('hashchange', textScale);
measureInsets();
addEventListener('resize', measureInsets); addEventListener('orientationchange', function () { setTimeout(measureInsets, 60); }); addEventListener('hashchange', measureInsets);
if (window.visualViewport) visualViewport.addEventListener('resize', function () { var a = document.activeElement; if (!(a && a.matches && a.matches('input,textarea'))) measureInsets(); });

/* ---------- shell: header, floating bar, pages ---------- */
var UI = { top: 'home', view: 'p', more: {}, oq: '', filt: 'all', lastSeg: null, recv: false, xtra: false };
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
  var ix = items.findIndex(function (x) { return x[0] === cur; }), i = Math.max(0, ix), sel = o.tab ? 'aria-selected' : 'aria-pressed';
  return '<div class="seg ' + (o.cls || '') + (ix < 0 ? ' none' : '') + '"' + (o.id ? ' id="' + o.id + '"' : '') + ' role="' + (o.tab ? 'tablist' : 'group') + '"' + (o.label ? ' aria-label="' + esc(o.label) + '"' : '') + ' style="--n:' + items.length + ';--i:' + i + '"><span class="th"></span>' +
    items.map(function (x) { return '<button ' + (o.tab ? 'role="tab" ' : '') + 'data-act="' + act + '" ' + (o.attr || '') + ' data-v="' + x[0] + '" ' + sel + '="' + (x[0] === cur) + '">' + x[1] + '</button>'; }).join('') + '</div>';
}
function placeThumb(el) {
  if (!el) return;
  var b = $$('button', el), i = b.findIndex(function (x) { return x.getAttribute('aria-pressed') === 'true' || x.getAttribute('aria-selected') === 'true'; });
  el.style.setProperty('--i', Math.max(0, i));
}
function paintLang() { var el = $('#lsw'); $$('button', el).forEach(function (b) { b.setAttribute('aria-pressed', b.dataset.v === lang); }); placeThumb(el); }
function greetWord() { var h = new Date().getHours(); return h < 11 ? 'Chào buổi sáng' : h < 18 ? 'Chào buổi chiều' : 'Chào buổi tối'; }
function tileDesc(id) { var n = C.readyCount(); return id === 'order' && n ? TILEDESC.order + ' · ' + n + ' món' : TILEDESC[id]; }
function paintHomeOrder() { var t = $('#home [data-v=order] .td'); if (t) t.textContent = tileDesc('order'); }
function resumeHtml() {
  var n = ctxPids().length; if (!n) return '';
  var nm = ctxPids().map(function (id) { return pv(PM[id], 'name') + (PM[id].variant ? ' · ' + C.VAR[PM[id].variant].vi : ''); }).join(' + ');
  return '<button class="resume" data-act="stage" data-v="' + st.ui.stage + '" aria-label="' + esc('Đang trả lời: ' + nm + ', Bước ' + stageNo(st.ui.stage) + '. Mở') + '">' + avatarStack(ctxPids()) + '<span class="dl"><span class="dc">Đang trả lời · Bước ' + stageNo(st.ui.stage) + '</span><span class="dv">' + esc(nm) + '</span></span>' + ic('chev', 's13') + '</button>';
}
function paintResume() { var r = $('#resume'); if (r) r.innerHTML = resumeHtml(); }
function renderHomeScreen() {
  var tiles = C.STAGES.map(function (g, i) {
    var nm = esc(g.lab[0].join(' '));
    if (i === 4) return '<button class="tile wide" data-act="stage" data-v="' + g.id + '"><span class="tn">' + (i + 1) + '</span><span class="tcol"><span class="tt">' + nm + '</span><span class="td">' + esc(tileDesc(g.id)) + '</span></span>' + ic('chev', 's13') + '</button>';
    return '<button class="tile" data-act="stage" data-v="' + g.id + '"><span class="th1"><span class="tn">' + (i + 1) + '</span>Bước ' + (i + 1) + ic('chev', 's13') + '</span><span class="tt">' + nm + '</span><span class="td">' + esc(tileDesc(g.id)) + '</span></button>';
  }).join('');
  var sg = suggestions()[0];
  homeEl.innerHTML = '<div class="ttl"><h1 id="hgreet">' + greetWord() + '</h1><p class="sub" id="hsub">Khách đang ở bước nào? Chạm để mở câu trả lời.</p></div><div id="resume">' + resumeHtml() + '</div>' +
    '<h2 class="cap">Trả lời khách</h2><div class="tiles">' + tiles + '</div>' +
    '<h2 class="cap">Thông tin sản phẩm</h2><div class="tiles">' +
    '<button class="tile pt" data-act="pgo" data-v="p"><span class="pc">' + pairHtml(PS.slice(0, 3), 40) + '</span><span class="tt">Theo mẫu' + ic('chev', 's13') + '</span><span class="td">Giá, mô tả, bảng size</span></button>' +
    '<button class="tile pt" data-act="pgo" data-v="s"><span class="pc">' + pairHtml(sg ? [PM[sg[0]], PM[sg[1]]] : PS.slice(3, 5), 40) + '</span><span class="tt">Theo set' + ic('chev', 's13') + '</span><span class="td">Ghép 2 món thành set</span></button></div>';
}
var navT = 0;
/* a double tap on a Home tile / the bar must not land on whatever the new screen has under the finger */
function settleNav() { document.body.classList.add('navset'); clearTimeout(navT); navT = setTimeout(function () { document.body.classList.remove('navset'); }, 250); }
function setTop(v) {
  if (v !== UI.top) settleNav();
  UI.top = v; homeEl.hidden = v !== 'home'; qrEl.hidden = v !== 'qr'; piEl.hidden = v !== 'pi';
  document.body.dataset.top = v;
  $$('#fbar .fb').forEach(function (b) { b.setAttribute('aria-current', b.dataset.v === v ? 'page' : 'false'); });
  if (v === 'pi') renderPI(); else if (v === 'qr') renderStage(); else { var g = $('#hgreet'); if (g) g.textContent = greetWord(); }
  paintDock();
}
function gotoStage(id) {
  closeAllSheets(); st.ui.stage = id; save();
  if (UI.top !== 'qr') setTop('qr'); else { renderStage(); paintDock(); }
  wantTop = true; queueMeasure();   /* the scroll reset needs a layout: done once per frame in queueMeasure, not inside the tap */
}
/* ======================= v6 · Trả lời nhanh =======================
   One customer context ("Khách đang hỏi") = st.draft.lines. Every stage reads it; changing it anywhere changes every message.
   Each message is one card: the real text, one "⧉ Chép", one "✎ Sửa". Cards are composed by composeCopy and cached in CARDS at render time,
   so the copy handler only reads CARDS[id].text (preview == clipboard). Every region has one render function (design-v6 section 9). */
var MAXP = 4, STALE_MS = 2 * 36e5;   /* a context older than this is shown as "từ N giờ trước" */
var CED = PAGE.state.ed;                      /* typed text over a generated message: { 'cardKey:lang': text } */
var FILL = {}, SEQ = {}, SENT = {}, CARDS = {}, FROZEN = { strip: {}, show: {} }, DEFS = {};
var SEQT = { pay: ['Đã nhận', 'Cảm ơn'], track: ['Lời dẫn', 'Mã vận đơn'] };
(function () {   /* registry of every card, by id (sequence bubbles get "<seq>.<n>") */
  C.STAGES.forEach(function (g) {
    g.cards.concat(g.more, g.nav || []).forEach(function (c) {
      if (!c.id) return;
      DEFS[c.id] = Object.assign({}, DEFS[c.id] || {}, { stage: g.id }, c);
      if (c.kind === 'seq') c.items.forEach(function (it, i) {
        DEFS[c.id + '.' + (i + 1)] = { id: c.id + '.' + (i + 1), kind: 'entry', tid: Array.isArray(it) ? it[0] : it, parent: c.id, n: i + 1, stage: g.id, t: 'Tin ' + (i + 1) + ' · ' + SEQT[c.id][i], inputs: c.field && i === 1 ? [c.field] : [] };
      });
    });
  });
  DEFS['extra-photos'].stage = 'info';
})();
function thanksTid() { return st.ui.thanksV || (st.draft.lines.some(function (L) { return PM[L.pid] && PM[L.pid].madeToOrder; }) ? 'thanks-custom' : 'paid-thanks'); }
function tidOf(d) { return d.tidO || (d.id === 'pay.2' ? thanksTid() : d.tid || d.id); }
function cardKey(d) { if (d.id === 'greet') return 'greet.' + (d.v || st.ui.greetV); if (d.id === 'pay.2') return 'pay.2.' + tidOf(d); return d.id; }
function defKeyed(key) {
  if (key.indexOf('greet.') === 0) return Object.assign({}, DEFS.greet, { v: key.slice(6) });
  if (key.indexOf('pay.2.') === 0) return Object.assign({}, DEFS['pay.2'], { tidO: key.slice(6) });
  return DEFS[key];
}
function leadActOf(d) { return d.id === 'greet' ? ((d.v || st.ui.greetV) === 'info' ? 'info' : null) : d.id === 'sizes' ? 'size' : d.kind === 'composer' ? 'order' : null; }
function replaceObj(t, src) { Object.keys(t).forEach(function (k) { delete t[k]; }); Object.assign(t, src || {}); }

/* ---------- the context ---------- */
function ctxPids() { var o = []; st.draft.lines.forEach(function (L) { if (PM[L.pid] && o.indexOf(L.pid) < 0) o.push(L.pid); }); return o; }
function lineOf(pid) { return st.draft.lines.filter(function (L) { return L.pid === pid; })[0]; }
function ctxValue() {
  return ctxPids().map(function (pid) {
    var z = st.draft.lines.filter(function (L) { return L.pid === pid && L.size; }).map(function (L) { return L.size; });
    return pname(PM[pid], 'vi') + (z.length ? ' · ' + z.join(', ') : '');
  }).join(' + ');
}
function touch() { st.draft.at = Date.now(); save(); }
function noteRecent(pids) {
  var now = Date.now();
  pids.forEach(function (p) { st.rp = st.rp.filter(function (x) { return x.p !== p; }); st.rp.unshift({ p: p, at: now }); });
  st.rp = st.rp.slice(0, 16); save();
}
function recents(n) {
  var out = [], lim = Date.now() - 7 * 864e5;
  st.rp.forEach(function (x) { if (x.at >= lim && PM[x.p] && out.indexOf(x.p) < 0) out.push(x.p); });
  return out.slice(0, n);
}
function markDone(stg) { st.draft.done[stg] = Date.now(); st.draft.at = Date.now(); save(); paintStages(); paintNewBtn(); }
function nextStage(id) { var i = C.STAGES.indexOf(stageDef(id)); return C.STAGES[i + 1] ? C.STAGES[i + 1].id : null; }
function snapAll() { return JSON.stringify({ d: st.draft, ed: CED, fl: FILL, sq: SEQ, ui: { greetV: st.ui.greetV, sizeAsk: st.ui.sizeAsk, thanksV: st.ui.thanksV, stage: st.ui.stage } }); }
function restoreAll(js) {
  var o = JSON.parse(js);
  st.draft = o.d; replaceObj(CED, o.ed); replaceObj(FILL, o.fl); replaceObj(SEQ, o.sq); Object.assign(st.ui, o.ui); save();
  if (UI.top === 'qr') renderStage(); else ctxChanged();
  paintDock();
}
/* a typed edit belongs to the text it was typed over: when the generated text changes (context, size, variant) the edit is dropped, with undo */
function edGen(ek) { var i = ek.lastIndexOf(':'), d = defKeyed(ek.slice(0, i)); return d ? compute(d, ek.slice(i + 1)).body : null; }
function genSnap() { var o = {}; Object.keys(CED).forEach(function (ek) { o[ek] = edGen(ek); }); return o; }
/* drafts that survive an app kill: { 'cardKey:lang': { t: typed text, g: the generated text it was typed over } }; restored only while the generated text is still the same */
function buildEds() {
  var o = {};
  try { Object.keys(CED).forEach(function (ek) { if (SENT[ek]) return; var g = edGen(ek); if (g != null) o[ek] = { t: CED[ek], g: g }; }); } catch (e) { /* never block the save */ }
  return o;
}
function dropStale(before) { var any = false; Object.keys(before).forEach(function (ek) { if (CED[ek] !== undefined && edGen(ek) !== before[ek]) { delete CED[ek]; any = true; } }); return any; }
/* every change of the context goes through here: snapshot, change, drop stale edits, repaint each owning region once, one toast with undo */
function mutate(fn, o) {
  o = o || {};
  var snap = snapAll(), before = genSnap();
  fn(); touch();
  var dropped = dropStale(before);
  ctxChanged();
  var undo = function () { restoreAll(snap); };
  if (o.msg) toast(o.msg, { undo: undo, icon: o.icon });
  else if (dropped) toast('Tin đã cập nhật theo lựa chọn mới', { sub: 'Phần bạn sửa trước đó đã bỏ', undo: undo });
}
function ctxChanged() {
  paintStages(); updateOrderBar(); paintNewBtn();
  if (UI.top === 'home') { paintHomeOrder(); paintResume(); }
  if (UI.top === 'qr') { paintCtxBar(); if (st.ui.stage === 'order') paintStageBody(); else paintStageCards(); paintOdock(); }
}
function ctxToggle(pid) {
  var has = lineOf(pid);
  if (!has && ctxPids().length >= MAXP) { toast('Tối đa 4 mẫu một lần — bỏ bớt một mẫu nhé', { icon: 'info' }); return; }
  mutate(function () {
    if (has) st.draft.lines = st.draft.lines.filter(function (L) { return L.pid !== pid; });
    else st.draft.lines.push({ pid: pid, size: null, qty: 1 });
  }, has ? { msg: 'Đã bỏ ' + pv(PM[pid], 'name') + ' khỏi khách đang hỏi' } : null);
  if (!has) noteRecent([pid]);
}
/* size of the first line of a product (the Vừa size segmented). Merging with a line of the same product and size adds quantities. */
function setLineSize(pid, size) {
  mutate(function () {
    var L = lineOf(pid); if (!L) return;
    var dup = st.draft.lines.filter(function (x) { return x !== L && x.pid === pid && x.size === size; })[0];
    if (dup) { dup.qty = Math.min(9, dup.qty + L.qty); st.draft.lines.splice(st.draft.lines.indexOf(L), 1); } else L.size = size;
  });
}
function itemPid() {
  var pids = ctxPids(), f = FILL._item;
  if (f && pids.indexOf(f) > -1) return f;
  var ws = st.draft.lines.filter(function (L) { return L.size && PM[L.pid]; })[0];
  return ws ? ws.pid : pids[0] || null;
}
function nextUp(p, a) { var z = psizes(p), i = z.indexOf(a); return z[Math.min(z.length - 1, i < 0 ? 1 : i + 1)] || z[0]; }
function fillsOf(d) {
  var f = FILL[d.parent || d.id] || {}, pid = itemPid(), L = pid ? lineOf(pid) : null, p = pid && PM[pid], o = {};
  o.size = L && L.size || null;
  o.sizeA = f.sizeA || (L && L.size) || (p ? psizes(p)[0] : null);
  o.sizeB = f.sizeB || (p ? nextUp(p, o.sizeA) : null);
  ['trackingCode', 'imageLinks', 'otherItem', 'fitStyle'].forEach(function (k) { if (f[k]) o[k] = f[k]; });
  return o;
}

/* ---------- composing one card ---------- */
function rawCompose(d, l) {
  var sel = PAGE.state.sel;
  if (d.id === 'greet') return C.composeCopy('greet', { v: d.v || st.ui.greetV, pids: ctxPids(), sel: sel }, l);
  if (d.id === 'sizes') return C.composeCopy('sizes', { pids: ctxPids(), ask: st.ui.sizeAsk, sel: sel }, l);
  if (d.kind === 'composer') return C.composeCopy('order', { sel: sel }, l);
  return C.composeCopy('entry', { tid: tidOf(d), pid: itemPid(), fills: fillsOf(d) }, l);
}
/* -> { def, id, key, l (language shown), alt (other language shown because l is missing), r, lead, body, ed, edited, text, pending, tokens, blocked, partial, trunc } */
function compute(d, l) {
  l = l || lang;
  var r = rawCompose(d, l), c = { def: d, id: d.id, key: cardKey(d), l: l, alt: false, miss: null };
  if (r.missing) { var ol = other(l), r2 = rawCompose(d, ol); c.miss = l; if (r2.text) { c.alt = true; c.l = ol; r = r2; } }
  c.r = r; c.lead = r.lead || ''; c.body = C.stripLead(r.text, r.lead);
  c.ed = c.alt ? undefined : CED[c.key + ':' + l]; c.edited = c.ed !== undefined;
  c.text = clean(c.edited ? (c.lead ? c.lead + '\n\n' + c.ed : c.ed) : r.text);
  c.tokens = c.edited ? C.tokKeys(c.ed) : [];
  c.blocked = c.edited && c.tokens.length > 0;
  c.blk = c.edited ? C.blanks(c.ed) : [];   /* other [..] / {{..}} she typed or left: copy asks for a second tap */
  c.pending = c.edited ? [] : (r.pending || []).slice().sort(function (x, y) { return (x === 'item' ? 0 : 1) - (y === 'item' ? 0 : 1); });   /* the product comes first */
  c.partial = r.partial; c.trunc = !!r.trunc && !c.edited;
  return c;
}
var NEEDV = { item: 'Chọn mẫu', otherItem: 'Chọn mẫu', size: 'Chọn size', sizeA: 'Chọn size', sizeB: 'Chọn size', trackingCode: 'Dán mã', imageLinks: 'Thêm link', fitStyle: 'Điền chỗ trống', blank: 'Kiểm tra chỗ [ ]' };
function pname2(id) { return PM[id] ? pname(PM[id], lang) : ''; }

/* ---------- frame: eyebrow, "↺ Khách mới", sticky segmented + context bar ---------- */
function ctxEmpty() { return !st.draft.lines.length; }
function paintNewBtn() { var b = $('#newcust'); if (b) b.classList.toggle('off', ctxEmpty() && !Object.keys(st.draft.done).length); }
function avatarStack(pids) {
  var show = pids.slice(0, pids.length > 2 ? 2 : pids.length), h = show.map(function (id) { return avatar(PM[id], 32); }).join('');
  if (pids.length > 2) h += '<span class="more2">+' + (pids.length - 2) + '</span>';
  return '<span class="cav">' + h + '</span>';
}
function ctxBarHtml() {
  var pids = ctxPids(), n = pids.length, stale = n && Date.now() - st.draft.at > STALE_MS;
  var cap = stale ? 'Từ ' + Math.max(2, Math.round((Date.now() - st.draft.at) / 36e5)) + ' giờ trước · vẫn khách này?' : n > 2 ? 'Khách đang hỏi · ' + n + ' mẫu' : 'Khách đang hỏi';
  var left = n ? avatarStack(pids) : '<span class="cav"><span class="plus0">' + ic('plus', 's15') + '</span></span>';
  var val = n ? ctxValue() : 'Chưa chọn mẫu';
  return '<button class="ctxbar" data-act="ctxpick" data-m="context" data-ctx="bar" aria-haspopup="dialog" aria-label="' + esc(n ? 'Khách đang hỏi: ' + val + '. Đổi' : 'Khách đang hỏi: chưa chọn mẫu. Chọn') + '">' + left + '<span class="dl"><span class="dc">' + esc(cap) + '</span><span class="dv' + (n ? '' : ' none') + '">' + esc(val) + '</span></span><span class="dx">' + (n ? 'Đổi' : 'Chọn') + ic('chevd', 's13') + '</span></button>';
}
function paintCtxBar() {
  var box = $('#ctxbar'); if (!box) return;
  var show = st.ui.stage !== 'order';
  box.hidden = !show; box.innerHTML = show ? ctxBarHtml() : '';
}
/* ---------- stage segmented: number, or ✓ once that stage was copied for this customer; badge on Tạo đơn = lines with a size ---------- */
function paintStages() {
  var box = $('#stseg .segbox'), seg = box.firstChild;
  if (!seg) {
    box.innerHTML = '<div class="seg stg" role="tablist" aria-label="Các bước trò chuyện" style="--n:5;--i:0"><span class="th"></span>' + C.STAGES.map(function (g, i) {
      return '<button class="sg" role="tab" data-act="stage" data-v="' + g.id + '" data-i="' + (i + 1) + '" aria-selected="false">' + g.lab[0].map(function (w) { return '<span>' + esc(w) + '</span>'; }).join(' ') + '</button>';
    }).join('') + '</div>';
    seg = box.firstChild;
  }
  $$('.sg', seg).forEach(function (b) {
    var g = b.dataset.v, n = g === 'order' ? C.readyCount() : 0, done = !!st.draft.done[g] && g !== st.ui.stage;
    b.setAttribute('aria-selected', g === st.ui.stage);
    if (done) b.dataset.done = '1'; else delete b.dataset.done;
    var lab = GLBL[g] + (done ? ', đã gửi' : '') + (n ? ', ' + n + ' món' : '');
    if (n) b.dataset.n = n; else delete b.dataset.n;
    if (done || n) b.setAttribute('aria-label', lab); else b.removeAttribute('aria-label');
  });
  placeThumb(seg);
}
function paintDock() { paintStages(); updateOrderBar(); if (UI.top === 'home') { paintHomeOrder(); paintResume(); } }

/* ---------- strips: 4 photos + "Tất cả mẫu"; suggestions are frozen while a stage is open so nothing reorders under her finger ---------- */
function suggest() {
  var pids = ctxPids(), out = [];
  function add(id) { if (PM[id] && pids.indexOf(id) < 0 && out.indexOf(id) < 0) out.push(id); }
  if (pids.length === 1) {
    var me = pids[0];
    st.sets.forEach(function (x) { if (x.items.indexOf(me) > -1) x.items.forEach(add); });
    (SEED.setSuggestions || []).forEach(function (x) { if (x[0] === me) add(x[1]); else if (x[1] === me) add(x[0]); });
  }
  recents(12).forEach(add);
  ((SEED.setSuggestions || [])[0] || []).forEach(add);   /* first run, no recents yet: the pair from her Instagram post, then the newest */
  PS.forEach(function (p) { add(p.id); });
  return pids.slice(0, 1).concat(out).slice(0, 4);   /* the product she is discussing stays in the strip (checked) */
}
function freezeStrips(g) {
  g.cards.forEach(function (c) { if (c.id === 'greet' || c.id === 'sizes' || c.id === 'order') { FROZEN.strip[c.id] = suggest(); FROZEN.show[c.id] = ctxPids().length <= 1; } });
}
/* name on up to two lines, the colour on its own line with a dot: Fleur Slip Dress Xanh and Vàng can no longer look alike */
function scLabel(p) {
  var col = p.variant ? C.VAR[p.variant].vi : '';
  return '<span class="nm"><span class="n">' + esc(pv(p, 'name')) + '</span>' + (col ? '<span class="cl"><i class="dot" style="background:' + swatch(p) + '"></i>' + esc(col) + '</span>' : '') + '</span>';
}
function pstripHtml(id, mode) {
  var ids = FROZEN.strip[id] || [], n = ctxPids().length;
  var cap = mode === 'order' ? 'Khách mua mẫu nào?' : n ? 'Khách hỏi thêm mẫu? Chạm để gửi cả hai.' : mode === 'size' ? 'Gửi bảng size mẫu nào? Chạm ảnh, chọn 2 mẫu để gửi cả hai.' : 'Khách hỏi mẫu nào? Chạm ảnh để kèm vào tin.';
  return '<div class="pstrip" data-strip="' + id + '" data-need="item"><p class="cp">' + esc(cap) + '</p><div class="row5">' + ids.map(function (pid) {
    var on = !!lineOf(pid);
    return '<button class="sc" data-act="stripset" data-pid="' + pid + '" data-c="' + id + '" aria-pressed="' + on + '" aria-label="' + esc('Kèm ' + pname(PM[pid], 'vi') + ' vào tin') + '"><span class="pa">' + avatar(PM[pid], 56, true) + '<i class="ck">' + ic('check') + '</i></span>' + scLabel(PM[pid]) + '</button>';
  }).join('') + '<button class="sc all" data-act="stripall" data-m="' + mode + '" data-c="' + id + '" aria-label="Tất cả mẫu"><span class="allc">' + ic('search', 's20') + '</span><span class="nm">Tất cả mẫu</span></button></div></div>';
}
function addMoreHtml(id, mode) { return '<button class="txtbtn addmore" data-act="stripall" data-m="' + mode + '" data-c="' + id + '">' + ic('plus', 's15') + 'Thêm mẫu</button>'; }
function stripOrMore(id, mode) { return FROZEN.show[id] ? pstripHtml(id, mode) : addMoreHtml(id, mode); }

/* ---------- the one card anatomy ---------- */
function metaHtml(c, d) {
  var m = [], n = ctxPids().length;
  if (d.id === 'greet') m.push(n ? n + ' mẫu' : 'Chưa kèm mẫu'); else if (d.id === 'sizes') m.push(n ? n + ' mẫu' : 'Chưa chọn mẫu'); else if (d.kind === 'composer') m.push(lu());
  return esc(m.join(' · '));
}
/* ---------- the message box: editable IN PLACE (R30) ----------
   One bordered box = [opening-line strip] + a textarea that holds the text she can type over. It grows to its text up to a fixed number of lines
   (--n) and scrolls INSIDE after that; the copied text is exactly strip + textarea. Typed text lives in CED (and, persisted, in st.draft.eds). */
var VW = innerWidth; addEventListener('resize', function () { VW = innerWidth; });
function estRows(text, n) {
  var cpl = Math.max(22, Math.floor((VW - 100) / 8.6)), ln = 0;   /* VW is cached: reading innerWidth in the middle of a render forces a layout */
  String(text).split('\n').forEach(function (l) { ln += Math.max(1, Math.ceil(l.length / cpl)); });
  return Math.max(2, Math.min(n, ln));
}
function boxText(c) { return c.alt ? c.text : c.edited ? c.ed : c.body; }
function canSaveTpl(d) { return d.id !== 'greet' && d.id !== 'sizes'; }
function estInner(d) { return '<span class="ed"><b>Đã sửa</b><button class="txtbtn" data-act="cardreset" data-c="' + d.id + '">' + ic('undo', 's15') + 'Khôi phục</button>' + (canSaveTpl(d) ? '<button class="txtbtn" data-act="cardsave" data-c="' + d.id + '">Lưu làm mẫu</button>' : '') + '</span>'; }
function pvHtml(c, d, n) {
  var shown = boxText(c), la = c.alt ? null : leadActOf(d), on = c.edited && !c.alt;
  return '<div class="pvbox" data-box="' + d.id + '">' + (la ? slotHtml(PAGE, d.id, la, la === 'size' ? 'Câu trước bảng size' : la === 'order' ? 'Câu mở đầu' : 'Câu trước thông tin') : '') +
    '<textarea class="pv" data-ced="' + d.id + '" style="--n:' + n + '" rows="' + estRows(shown, n) + '" lang="' + c.l + '" spellcheck="false" autocorrect="off" autocapitalize="off"' + (c.alt ? ' readonly' : '') + ' aria-label="' + esc('Tin sẽ gửi: ' + d.t) + '">\n' + esc(shown) + '</textarea></div>' +
    '<div class="est" data-est="' + d.id + '" data-on="' + (on ? 1 : '') + '">' + (on ? estInner(d) : '') + '</div>';
}
function noticeHtml(c, d) {
  var h = '';
  if (c.alt) h += '<div class="notice">' + ic('info', 's15') + '<span class="nb">Chưa có bản ' + c.miss.toUpperCase() + ' của tin này.</span></div>';
  else if (c.partial && c.partial.length) h += '<div class="notice">' + ic('info', 's15') + '<span class="nb">' + esc(c.partial.map(pname2).join(', ')) + ' chưa có ' + (d.id === 'sizes' ? 'bảng size' : 'thông tin') + ' ' + lu() + ' — tin chỉ có ' + esc(ctxPids().filter(function (x) { return c.partial.indexOf(x) < 0; }).map(pname2).join(', ')) + '.</span></div>';
  if (c.blocked) h += '<div class="notice">' + ic('info', 's15') + '<span class="nb">Xoá hoặc điền chỗ trong ngoặc [ ] rồi chép.</span></div>';
  else if (c.pending.indexOf('blank') > -1) h += '<div class="notice">' + ic('info', 's15') + '<span class="nb">Trong tin còn “' + esc(c.r.blanks[0]) + '” chưa điền. Sửa trong khung rồi chép.</span></div>';
  else if (c.blk.length) h += '<div class="notice">' + ic('info', 's15') + '<span class="nb">Tin có “' + esc(c.blk[0]) + '”. Nếu đúng ý, chạm Chép hai lần.</span></div>';
  return h;
}
function capsuleHtml(c, d, label) {
  var id = d.id;
  if (c.alt) return '<button class="btn tonal ccap" data-act="cardcopy" data-c="' + id + '">' + lblBtn('Chép bản ' + c.l.toUpperCase()) + '</button>';
  if (c.blocked) return '<button class="btn tonal ccap" aria-disabled="true" data-c="' + id + '">Còn chỗ trống</button>';
  if (c.pending.length) return '<button class="btn tonal ccap need" data-act="cardneed" data-c="' + id + '" data-k="' + c.pending[0] + '">' + esc(NEEDV[c.pending[0]] || 'Điền chỗ trống') + '</button>';
  return '<button class="btn tonal ccap" data-act="cardcopy" data-c="' + id + '">' + lblBtn((label || 'Chép') + ' · ' + lu()) + '</button>';
}
function actHtml(c, d, label) {
  var la = leadActOf(d), extra;
  if (c.alt) extra = '<button class="txtbtn" data-act="addlang" data-c="' + d.id + '">' + ic('pencil', 's15') + 'Thêm bản ' + c.miss.toUpperCase() + '</button>';
  else extra = '<button class="txtbtn" data-act="cardfocus" data-c="' + d.id + '">' + ic('pencil', 's15') + 'Sửa</button>' + (la ? '<button class="txtbtn" data-act="leadopen" data-a="' + la + '" aria-label="' + (c.lead ? 'Đổi câu mở đầu' : 'Chọn câu mở đầu') + '">' + (c.lead ? 'Đổi câu' : 'Câu mở đầu') + '</button>' : '');
  return '<div class="mact"><span class="mex">' + extra + '</span><span class="mcap">' + (d.kind === 'composer' ? '' : capsuleHtml(c, d, label)) + '</span></div>';
}
/* item switcher (two or more products) and the inputs of an entry card */
function itemSwitch(d) {
  var pids = ctxPids(); if (pids.length < 2) return '';
  var cur = itemPid();
  return '<div class="frow itsw" data-row="item" data-need="item"><span class="dc">Mẫu</span><span class="cir">' + pids.map(function (id) {
    return '<button class="cb" data-act="fititem" data-pid="' + id + '" data-c="' + d.id + '" aria-pressed="' + (id === cur) + '" aria-label="' + esc(pname(PM[id], 'vi')) + '">' + avatar(PM[id], 40) + '<i class="ck">' + ic('check') + '</i></button>';
  }).join('') + '</span><span class="cn">' + esc(pname2(cur)) + '</span></div>';
}
function sizeSeg(d, k, lab, cur) {
  var pid = itemPid(), p = pid && PM[pid], sizes = p ? psizes(p) : ['S', 'M', 'L'];
  return '<div class="frow" data-row="' + k + '"' + (k === 'size' ? ' data-need="size"' : '') + '><div class="dc">' + esc(lab) + '</div>' + segHtml(sizes.map(function (z) { return [z, z]; }), cur, k === 'size' ? 'fitsize' : 'fillseg', { label: lab, attr: 'data-c="' + d.id + '" data-k="' + k + '"' + (p ? '' : ' disabled') }) + '</div>';
}
function fieldHtml(d, k, ph) {
  var f = FILL[d.parent || d.id] || {};
  return '<div class="frow fldrow" data-row="' + k + '" data-need="' + k + '"><input class="fld" data-fill="' + k + '" data-c="' + d.id + '" enterkeyhint="done" autocomplete="off" autocapitalize="off" spellcheck="false" value="' + esc(f[k] || '') + '" placeholder="' + esc(ph) + '" aria-label="' + esc(ph) + '"><button class="btn tonal" data-act="pastefill" data-k="' + k + '" data-c="' + d.id + '">' + ic('paste', 's15') + 'Dán</button></div>';
}
/* the blanks a flow message can have, from its template (both languages) */
function entryKeys(d) {
  var e = FM[tidOf(d)], ks = []; if (!e) return ks;
  ['vi', 'en'].forEach(function (l) { (entryText(e, l).text.match(/\{\{(\w+)\}\}/g) || []).forEach(function (m) { var k = m.slice(2, -2); if (/^(item|itemInfo|sizeChart)$/.test(k)) return; if (ks.indexOf(k) < 0) ks.push(k); }); });
  return ks;
}
function otherRow(d) {
  var oi = (FILL[d.parent || d.id] || {}).otherItem, p = oi && PM[oi];
  return '<button class="ddrow frow" data-row="otherItem" data-need="otherItem" data-act="pickother" data-c="' + d.id + '" aria-haspopup="dialog"><span class="dl"><span class="dc">Mẫu thay thế</span><span class="dv' + (p ? '' : ' hint2') + '">' + (p ? esc(pname(p, 'vi')) : 'Chọn mẫu') + '</span></span><span class="dx">' + (p ? 'Đổi' : 'Chọn') + ic('chevd', 's13') + '</span></button>';
}
function inputsHtml(d) {
  var h = '', f = fillsOf(d), ks = (d.inputs || []).slice();
  entryKeys(d).forEach(function (k) { if (ks.indexOf(k) < 0) ks.push(k); });
  if (ks.some(function (k) { return /^size/.test(k); }) && ks.indexOf('item') < 0 && d.kind === 'entry') ks.unshift('item');
  ks.forEach(function (k) {
    if (k === 'item') h += itemSwitch(d);
    else if (k === 'size') h += sizeSeg(d, 'size', 'Size', f.size);
    else if (k === 'sizeA') h += sizeSeg(d, 'sizeA', 'Vừa vặn', f.sizeA);
    else if (k === 'sizeB') h += sizeSeg(d, 'sizeB', 'Thoải mái', f.sizeB);
    else if (k === 'otherItem') h += otherRow(d);
    else if (k === 'fitStyle') h += '<div class="frow fldrow" data-row="fitStyle" data-need="fitStyle"><input class="fld" data-fill="fitStyle" data-c="' + d.id + '" enterkeyhint="done" autocomplete="off" spellcheck="false" value="' + esc((FILL[d.parent || d.id] || {}).fitStyle || '') + '" placeholder="Kiểu dáng (vd: suông, ôm nhẹ)" aria-label="Kiểu dáng"></div>';
    else if (k === 'trackingCode') h += fieldHtml(d, k, 'Mã vận đơn');
    else if (k === 'imageLinks') h += fieldHtml(d, k, 'Link hình');
  });
  return h;
}
function cardHtml(d) {
  if (d.kind === 'seq') return seqHtml(d);
  var c = compute(d); CARDS[d.id] = c;
  var hero = d.id === 'greet' || d.id === 'sizes' || d.kind === 'composer', n = d.kind === 'composer' ? 8 : hero ? 6 : 5;
  var h = '<section class="mcard ' + (hero ? 'hero' : 'compact') + '" data-card="' + d.id + '" aria-label="' + esc(d.t) + '"><div class="mh"><h3 class="mt">' + esc(d.t) + '</h3><span class="mm">' + metaHtml(c, d) + '</span></div>';
  if (d.id === 'greet') h += segHtml([['new', 'Khách mới'], ['back', 'Khách cũ'], ['info', 'Chỉ thông tin']], st.ui.greetV, 'greetv', { label: 'Kiểu chào', attr: 'data-c="greet"' });
  h += '<div class="mi">' + inputsHtml(d) + '</div>' + pvHtml(c, d, n) + '<div class="mn">' + noticeHtml(c, d) + '</div>';
  if (d.id === 'sizes') h += '<label class="swrow sask"><span class="sl"><span class="t">Kèm câu xin số đo</span></span><span class="sw"><input type="checkbox" switch data-in="sizeask" aria-label="Kèm câu xin số đo"' + (st.ui.sizeAsk ? ' checked' : '') + '><i></i></span></label>';
  h += actHtml(c, d);
  if (d.id === 'greet') h += stripOrMore('greet', 'context');
  if (d.id === 'sizes') h += stripOrMore('sizes', 'size');
  return h + '</section>';
}
/* a sequence of messages sent together (Check out): one mini-card per message, the next one carries the ring */
function seqHtml(d) {
  var subs = [1, 2].map(function (i) { return DEFS[d.id + '.' + i]; }), done = SEQ[d.id] || {}, nx = subs.findIndex(function (s, i) { return !done[i]; });
  var k = subs.filter(function (s, i) { return done[i]; }).length;
  var h = '<section class="mcard seq compact" data-card="' + d.id + '" aria-label="' + esc(d.t) + '"><div class="mh"><h3 class="mt">' + esc(d.t) + '</h3><span class="mm" data-seqm>Đã chép ' + k + '/2</span></div>';
  if (d.field) h += fieldHtml(subs[1], d.field, 'Mã vận đơn');
  subs.forEach(function (s, i) {
    var c = compute(s); CARDS[s.id] = c;
    var isNext = i === nx, isDone = !!done[i];
    h += '<div class="mb' + (isNext ? ' next' : '') + (isDone ? ' done' : '') + '" data-b="' + (i + 1) + '"><div class="bh"><span class="bdisc">' + (isDone ? ic('check', 's15') : (i + 1)) + '</span><h4 class="bt">' + esc(s.t) + '</h4>' + (isNext ? '<span class="btag">Tiếp theo</span>' : isDone ? '<span class="bdone">Đã chép</span>' : '') + '</div>';
    if (s.id === 'pay.2') h += segHtml([['paid-thanks', 'Có sẵn'], ['thanks-custom', 'May đo']], thanksTid(), 'thanksv', { label: 'Loại đơn' });
    h += pvHtml(c, s, 4) + '<div class="mn">' + noticeHtml(c, s) + '</div>' + actHtml(c, s, 'Chép tin ' + (i + 1)) + '</div>';
  });
  return h + '</section>';
}
function stageCardsHtml(g) {
  var h = '<div class="qlist">';
  g.cards.forEach(function (c) { h += cardHtml(DEFS[c.id]); });
  if (g.id === 'greet') h += UI.xtra ? cardHtml(DEFS['extra-photos']) : '<button class="nrow" data-act="extrashow">' + ic('clip', 's20') + '<span class="nt">Gửi thêm hình / link</span>' + ic('chev', 's13') + '</button>';
  if (g.id === 'info') h += '<button class="nrow" data-act="pastego">' + ic('paste', 's20') + '<span class="nt">Khách gửi địa chỉ rồi? Dán vào đơn</span>' + ic('chev', 's13') + '</button>';
  if (g.more.length) {
    var on = !!UI.more[g.id];
    h += '<button class="morebtn" data-act="stmore" aria-expanded="' + on + '">Câu khác (' + g.more.length + ')' + ic('chevd', 's13') + '</button>';
    if (on) g.more.forEach(function (c) {
      if (c.id === 'return-policy' && entryHidden(FM[c.id])) h += '<button class="nrow" data-act="attach" data-id="' + c.id + '">' + ic('clip', 's20') + '<span class="nt">' + esc(c.t) + '</span>' + ic('chev', 's13') + '</button>';
      else h += cardHtml(DEFS[c.id]);
    });
  }
  if (g.id === 'out') h += '<button class="btn tonal wide endbtn" data-act="newcust">' + ic('undo', 's15') + 'Xong khách này · Sang khách khác</button>';
  return h + '</div>';
}
/* grow every message box to its text (the CSS max-height, --n lines, stops it and the box scrolls inside); one layout pass per frame, never inside a tap handler */
function fitPv(ta) {
  if (!ta.offsetParent) return;
  ta.style.height = '0px'; ta.style.height = (ta.scrollHeight + 2) + 'px'; markMore(ta);
}
function markMore(ta) { var b = ta.parentNode; if (b) b.classList.toggle('more', ta.scrollHeight - ta.scrollTop - ta.clientHeight > 3); }
var mq = 0, wantTop = false;
function queueMeasure() {
  if (mq) return;
  mq = requestAnimationFrame(function () {   /* write all, read all, write all: one layout for every box of the stage instead of one per box */
    mq = 0; if (wantTop) { wantTop = false; qrEl.scrollTop = 0; }
    var ts = $$('textarea.pv', PAGE.el).filter(function (t) { return t.offsetParent; });
    ts.forEach(function (t) { t.style.height = '0px'; });
    var hs = ts.map(function (t) { return t.scrollHeight + 2; });
    ts.forEach(function (t, i) { t.style.height = hs[i] + 'px'; markMore(t); });
  });
}
function paintStageBody() {
  var g = stageDef(st.ui.stage);
  PAGE.el.innerHTML = g.id === 'order' ? orderStageHtml() : stageCardsHtml(g);
  qrEl.classList.toggle('o', g.id === 'order');
  queueMeasure();
}
/* a change of the context repaints each card in place (the strip keeps its frozen photos) */
function paintStageCards() {
  var changed = false;
  $$('#stage [data-card]').forEach(function (el) {
    var d = DEFS[el.dataset.card]; if (!d) return;
    var html = cardHtml(d);
    if (el._h === html) return;   /* nothing in this card depends on what changed: leave the DOM alone */
    var t = document.createElement('div'); t.innerHTML = html;
    t.firstChild._h = html; el.replaceWith(t.firstChild); changed = true;
  });
  if (changed) queueMeasure();
}
function renderStage() {
  var g = stageDef(st.ui.stage);
  $('#qreb').textContent = 'Trả lời nhanh · Bước ' + stageNo(g.id) + '/5'; $('#qrtitle').textContent = GLBL[g.id]; $('#qrsub').textContent = g.desc;   /* the one-line helper (R23) */
  document.body.dataset.stage = g.id; CARDS = {}; freezeStrips(g);
  paintStageBody(); paintStages(); paintCtxBar(); paintNewBtn(); paintOdock();
}

function paintCard(id) {
  var el = $('#stage [data-card="' + id + '"]'), d = DEFS[id]; if (!el || !d) return;
  var html = cardHtml(d), t = document.createElement('div'); t.innerHTML = html; t.firstChild._h = html; el.replaceWith(t.firstChild); queueMeasure();
}
/* a choice that is not part of the context (item switcher, A/B sizes, Có sẵn / May đo, "kèm câu xin số đo"): repaint, and drop an edit that no longer matches */
function fillShift(fn) {
  var before = genSnap(); fn(); var dropped = dropStale(before);
  ctxChanged();
  if (dropped) toast('Tin đã cập nhật theo lựa chọn mới', { sub: 'Phần bạn sửa trước đó đã bỏ' });
}
function orderTyped(fn) {
  var before = genSnap(); fn(); touch(); var dropped = dropStale(before);
  patchOrder();
  if (dropped) toast('Tin đã cập nhật theo lựa chọn mới', { sub: 'Phần bạn sửa trước đó đã bỏ' });
}
function setInfo(x) { mutate(function () { st.draft.info = x; }); }
function pasteInfo() {
  UI.recv = true;
  function refuse() { paintStageBody(); var ta = $('[data-in=info]'); if (ta) ta.focus(); }
  try { navigator.clipboard.readText().then(function (x) { x = String(x || '').trim(); if (x) setInfo(x); else paintStageBody(); }, refuse); } catch (e) { refuse(); }
}
/* "Khách gửi địa chỉ rồi? Dán vào đơn": paste into the receiver field and go to Tạo đơn with it open (a refused read still opens the field) */
function pasteGo() {
  UI.recv = true;
  function go() { gotoStage('order'); }
  try { navigator.clipboard.readText().then(function (x) { x = String(x || '').trim(); if (x) { st.draft.info = x; touch(); } go(); }, function () { go(); afterPaint(function () { var ta = $('[data-in=info]'); if (ta) ta.focus(); }); }); } catch (e) { go(); }
}
/* "↺ Khách khác": one reset for the whole customer, with undo; nothing is lost without a way back */
function newCustomer() {
  var snap = snapAll();
  closeAllSheets();
  st.draft = { lines: [], ship: st.set.lastShip || 'courier', custom: st.set.lastCustom || 0, info: '', bank: true, copiedAt: 0, done: {}, at: 0, eds: {}, fill: {}, seq: {} };   /* her last shipping choice carries over */
  replaceObj(CED, {}); replaceObj(FILL, {}); replaceObj(SEQ, {}); replaceObj(SENT, {}); st.ui.thanksV = null; UI.recv = false; UI.more = {}; UI.xtra = false;
  st.ui.stage = 'greet'; save();
  if (UI.top === 'qr') { renderStage(); qrEl.scrollTop = 0; } else ctxChanged();
  paintDock();
  toast('Đã sang khách khác', { undo: function () { restoreAll(snap); qrEl.scrollTop = 0; } });
}
/* one card or one bubble changed without touching its inputs (typing): refresh the text, the notices and the capsule only */
function patchCard(id, typing) {
  var d = DEFS[id], root = d && $('#stage [data-card="' + (d.parent || d.id) + '"]'); if (!d || !root) return;
  var c = compute(d); CARDS[id] = c;
  var scope = d.parent ? root.querySelector('.mb[data-b="' + d.n + '"]') : root; if (!scope) return;
  var ta = scope.querySelector('textarea.pv');
  if (ta) { var want = boxText(c); if (!typing && ta.value !== want) ta.value = want; ta.readOnly = !!c.alt; }
  var est = scope.querySelector('.est'), on = c.edited && !c.alt; if (est && est.dataset.on !== (on ? '1' : '')) { est.dataset.on = on ? '1' : ''; est.innerHTML = on ? estInner(d) : ''; }
  var mn = scope.querySelector('.mn'); if (mn) mn.innerHTML = noticeHtml(c, d);
  var mc = scope.querySelector('.mcap'); if (mc && d.kind !== 'composer') mc.innerHTML = capsuleHtml(c, d, d.parent ? 'Chép tin ' + d.n : '');
  var mm = root.querySelector('.mm'); if (mm && !d.parent) mm.innerHTML = metaHtml(c, d);
  if (ta && !typing) fitPv(ta); else if (ta) markMore(ta);
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
  if (sg.length) h += '<h2 class="cap">Gợi ý ghép từ bài đăng</h2><div class="grp">' + sg.map(function (x) { return setRow(x, 'data-act="setsugg" data-a="' + x[0] + '" data-sb="' + x[1] + '"', 'Gợi ý · ' + money(C.setSum({ items: x }), 'vi') + ' · chưa kiểm giá'); }).join('') + '</div>';
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


/* ---------- Tạo đơn: message first, then the lines, one shipping row, collapsed receiver info, a solid dock ---------- */
function updateOrderBar() {
  var c = calc(), n = C.readyCount(), b = $('#obtn2'), bd = b.querySelector('.bd');
  bd.hidden = !n; bd.textContent = n;
  b.setAttribute('aria-label', n ? 'Đơn hàng, ' + n + ' món, ' + money(c.total, 'vi') : 'Đơn hàng');
  b.classList.toggle('on', UI.top === 'qr' && st.ui.stage === 'order');
}
function bump() { var b = $('#obtn2'); if (b.animate && !reduce) b.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.12)' }, { transform: 'scale(1)' }], { duration: 300 }); }
/* "＋ M" in the product sheet: fills a waiting line of that product, or adds one; never raises a quantity */
function addLine(pid, size) {
  var d = st.draft, f = d.lines.filter(function (L) { return L.pid === pid && L.size === size; })[0];
  if (f) { toast('Đã có ' + pname(PM[pid], 'vi') + ' · ' + size + ' trong đơn', { icon: 'info' }); return false; }
  var wait = d.lines.filter(function (L) { return L.pid === pid && !L.size; })[0];
  if (!wait && ctxPids().indexOf(pid) < 0 && ctxPids().length >= MAXP) { toast('Tối đa 4 mẫu một lần — bỏ bớt một mẫu nhé', { icon: 'info' }); return false; }
  mutate(function () { if (wait) wait.size = size; else d.lines.push({ pid: pid, size: size, qty: 1 }); });
  noteRecent([pid]); bump(); return true;
}
function inOrderText(pid) { return st.draft.lines.filter(function (L) { return L.pid === pid && L.size; }).map(function (L) { return L.size + ' × ' + L.qty; }).join(', '); }
function addedToast(pid, size) { toast('Đã thêm ' + pname(PM[pid], 'vi') + ' · ' + size + ' vào đơn', { act: { label: 'Xem đơn', fn: function () { closeAllSheets(); gotoStage('order'); } } }); }
function shipValue() { var d = st.draft; return d.ship === 'courier' ? 'Khách trả shipper' : d.ship === 'fee' ? money(st.set.fee, 'vi') : d.ship === 'free' ? 'Miễn phí' : d.custom ? money(d.custom, 'vi') : 'Khác…'; }
function lineRowHtml(L, i) {
  var p = PM[L.pid]; if (!p) return '';
  var nm = esc(pname(p, 'vi'));
  return '<div class="lrow2' + (L.size ? '' : ' nosz') + '" data-line="' + L.pid + ':' + (L.size || '') + '"><div class="l1r">' + avatar(p, 44) + '<span class="ln"><span class="t">' + nm + '</span><span class="sub num">' + money(pv(p, 'price') * L.qty, 'vi') + (L.size ? '' : ' · Chọn size') + '</span></span>' +
    '<button class="iconbtn" data-act="lnrm" data-i="' + i + '" aria-label="Bỏ món ' + nm + '"><span class="c bare">' + ic('x', 's15') + '</span></button></div>' +
    '<div class="l2r"><span data-need="size">' + segHtml(psizes(p).map(function (z) { return [z, z]; }), L.size, 'lnsize', { label: 'Size ' + pname(p, 'vi'), attr: 'data-i="' + i + '"' }) + '</span>' +
    '<span class="stp"><button class="btn tonal" data-act="lnqty" data-i="' + i + '" data-d="-1" aria-label="Giảm số lượng ' + nm + '"' + (L.qty <= 1 ? ' disabled' : '') + '>' + ic('minus', 's15') + '</button><span class="v num">' + L.qty + '</span><button class="btn tonal" data-act="lnqty" data-i="' + i + '" data-d="1" aria-label="Tăng số lượng ' + nm + '"' + (L.qty >= 9 ? ' disabled' : '') + '>' + ic('plus', 's15') + '</button></span></div></div>';
}
function recvHtml() {
  var d = st.draft, first = d.info.trim().split('\n')[0], open = UI.recv;
  return '<div class="recvw"><div class="ddrow recvrow" data-row="recv"><button class="rmain3" data-act="recvtoggle" aria-expanded="' + open + '"><span class="dl"><span class="dc">Thông tin nhận (tuỳ chọn)</span><span class="dv' + (first ? '' : ' hint2') + '">' + esc(first || 'Tên, SĐT, địa chỉ khách gửi…') + '</span></span>' + ic('chevd', 's13') + '</button><button class="btn tonal" data-act="pasteinfo">' + ic('paste', 's15') + 'Dán</button></div>' +
    (open ? '<textarea class="ta sel" data-in="info" rows="3" placeholder="Tên, SĐT, địa chỉ khách gửi…" aria-label="Thông tin nhận">' + esc(d.info) + '</textarea>' : '') + '</div>';
}
function orderNotice(c) {
  var t = c.text, has = /chuyển khoản|transfer note/i.test(t) && /instagram/i.test(t);
  return has ? '' : '<div class="notice">' + ic('info', 's15') + '<span class="nb">Tin chưa có hướng dẫn ghi tên Instagram khi chuyển khoản.</span></div>';
}
function postRowHtml() {
  return st.draft.copiedAt && Date.now() - st.draft.copiedAt < 864e5 ? '<button class="nrow" data-act="stage" data-v="out"><span class="nt">Khách đã chuyển khoản? Sang Check out</span>' + ic('chev', 's13') + '</button>' : '';
}
function orderStageHtml() {
  var d = st.draft, n = d.lines.filter(function (L) { return PM[L.pid]; }).length, h = '<div class="ostage">';
  h += cardHtml(DEFS.order);
  if (n && Date.now() - d.at > STALE_MS) h += '<div class="notice card stale" data-row="stale">' + ic('info', 's15') + '<div class="nb">Đơn này từ ' + Math.max(2, Math.round((Date.now() - d.at) / 36e5)) + ' giờ trước. Vẫn là khách này?<div class="acts"><button class="btn tonal" data-act="newcust">' + ic('undo', 's15') + 'Sang khách khác</button></div></div></div>';
  h += '<div class="secH"><h3 class="cap sm">Món trong đơn · ' + n + '</h3></div>';
  if (!n) h += '<div class="oempty2" data-need="item">' + pstripHtml('order', 'order') + '</div>';
  else h += '<div class="grp lines">' + d.lines.map(lineRowHtml).join('') + '</div>';
  h += '<button class="btn tonal wide addbtn" data-act="oadd2" data-need="item">' + ic('plus', 's15') + 'Thêm món</button>';
  h += '<div class="ogap"></div><button class="ddrow" data-row="ship" data-act="shipopen" aria-haspopup="dialog" aria-label="Phí ship: ' + esc(shipValue()) + '. Đổi"><span class="dl"><span class="dc">Phí ship</span><span class="dv">' + esc(shipValue()) + '</span></span><span class="dx">Đổi' + ic('chevd', 's13') + '</span></button>';
  h += recvHtml();
  h += '<div class="bankw">' + (st.set.bank.no ? '<label class="swrow"><span class="sl"><span class="t">Kèm số tài khoản</span></span><span class="sw"><input type="checkbox" switch data-in="bank" aria-label="Kèm số tài khoản"' + (d.bank ? ' checked' : '') + '><i></i></span></label>' : '<button class="swrow" data-act="bankset"><span class="sl"><span class="t">Thêm STK để kèm vào đơn</span></span>' + ic('chev', 's13') + '</button>') + '</div>';
  h += '<div id="onote">' + orderNotice(CARDS.order) + '</div><div id="opost">' + postRowHtml() + '</div></div>';
  return h;
}
/* the dock lives outside the scrolling page (position absolute in <main>), is opaque, and a scrim band under it keeps the gap to the capsule clean */
function dockHtml() {
  var c = calc(), sl = C.sizelessCount(), cd = CARDS.order || (CARDS.order = compute(DEFS.order)), btn;
  if (!c.count) btn = '<button class="btn tonal" id="obtn" data-act="dockneed" data-k="item">Chọn món</button>';
  else if (sl) btn = '<button class="btn tonal" id="obtn" data-act="dockneed" data-k="size">Chọn size cho ' + sl + ' món</button>';
  else if (cd.blocked) btn = '<button class="btn tonal" id="obtn" aria-disabled="true">Còn chỗ trống</button>';
  else if (cd.pending.indexOf('blank') > -1) btn = '<button class="btn tonal" id="obtn" data-act="dockneed" data-k="blank">Kiểm tra chỗ [ ]</button>';
  else btn = '<button class="btn m" id="obtn" data-act="copyorder">' + lblBtn('Chép đơn · ' + lu()) + '</button>';
  var noShip = c.count && st.draft.ship !== 'free' && !c.ship;   /* the total leaves shipping out: say so where she reads the number */
  return '<div class="dl2"><div class="tl">' + (c.count ? noShip ? 'Tổng · chưa gồm ship' : 'Tổng · ' + c.qty + ' món' : 'Chưa có món') + '</div><div class="tv num">' + (c.count ? money(c.total, lang) : '0đ') + '</div></div>' + btn;
}
/* the dock can grow at large text sizes: the page and the scrim reserve exactly its measured height */
if (window.ResizeObserver) new ResizeObserver(function () { var h = Math.round($('#odock').getBoundingClientRect().height); if (h > 0) document.documentElement.style.setProperty('--dock-h', h + 'px'); }).observe($('#odock'));
function paintOdock() {
  var on = UI.top === 'qr' && st.ui.stage === 'order', dk = $('#odock'), sc = $('#oscrim');
  dk.hidden = !on; sc.hidden = !on;
  if (on) dk.innerHTML = dockHtml();
}
/* typing in the receiver box, a custom fee or the bank switch: refresh the message, notice and dock without touching the inputs */
function patchOrder() {
  patchCard('order'); var n = $('#onote'); if (n) n.innerHTML = orderNotice(CARDS.order);
  var sv = $('#stage [data-row=ship] .dv'); if (sv) { sv.textContent = shipValue(); $('#stage [data-row=ship]').setAttribute('aria-label', 'Phí ship: ' + shipValue() + '. Đổi'); }
  paintOdock(); updateOrderBar();
}
function lineMutate(fn, msg) { mutate(fn, msg ? { msg: msg } : null); }
function orderCopy(btn) {
  var c = CARDS.order || compute(DEFS.order), total = calc().total;
  if (!copyGate(PAGE, c.text, c.edited, btn, 'order')) return;
  copy(c.text, { btn: btn, msg: 'Đã chép đơn · ' + money(total, lang) + ' · ' + lu(), sub: 'Nhớ gửi mã QR nhé', icon: 'clip', lang: lang, act: { label: 'Tiếp: Check out', fn: function () { gotoStage('out'); } },
    done: function (ok) {
      if (!ok) return;
      commitLeads(c.r.leadIds); st.draft.copiedAt = Date.now(); noteRecent(ctxPids()); markDone('order');
      if (c.edited) { SENT[c.key + ':' + lang] = 1; save(); }
      afterPaint(function () { var op = $('#opost'); if (op) op.innerHTML = postRowHtml(); });
    } });
}
/* ship sheet: radio rows; picking a fixed option closes it, "Khác…" opens a numeric field in the sheet */
function openShip() { return pushSheet({ kind: 'ship', key: 'ship', det: 'm', fixed: false, state: {}, render: renderShip }); }
function renderShip(s) {
  var d = st.draft, dot = '<span class="rd">' + ic('check') + '</span>';
  var opts = [['courier', 'Khách trả shipper'], ['fee', money(st.set.fee, 'vi')], ['free', 'Miễn phí'], ['custom', 'Khác…']];
  return shHead('Phí ship', 'Tính vào tin chốt đơn') + '<div class="shb pad"><div class="grp sheetgrp" role="radiogroup" aria-label="Phí ship">' + opts.map(function (o) {
    return '<div class="rrow" role="radio" aria-checked="' + (d.ship === o[0]) + '"><button class="rmain" data-act="shippick" data-v="' + o[0] + '">' + dot + '<span class="rt">' + esc(o[1]) + '</span></button></div>';
  }).join('') + '</div>' + (d.ship === 'custom' ? '<div class="lf"><input class="fld" inputmode="numeric" data-in="custom" placeholder="Nhập phí ship" aria-label="Nhập phí ship" value="' + (d.custom ? nfV.format(d.custom) : '') + '"><div class="bs"><button class="btn tonal" data-act="shipdone">Xong</button></div></div>' : '') + '</div>';
}

/* ---------- sheets ---------- */
var SH = [], sheetsEl = $('#sheets'), appEl = $('#app');
function syncSheetBody() {
  var top = SH[SH.length - 1];
  document.body.classList.toggle('sheet-open', !!top);
  document.body.classList.toggle('has-foot', !!top && !!top.el.querySelector('.shf'));
  if (!fhq) fhq = requestAnimationFrame(function () {   /* toasts clear the sheet footer (the picker tray is taller); measured next frame: a read here would force a layout inside the tap */
    fhq = 0; var t2 = SH[SH.length - 1], f = t2 && t2.el.querySelector('.shf');
    document.documentElement.style.setProperty('--foot-h', (f ? Math.round(f.getBoundingClientRect().height) : 72) + 'px');
  });
}
var fhq = 0;
var lastPush = 0;
function pushSheet(o) {
  /* P0: re-entry guard. A second push of the same kind+key, or any push within 350 ms of the previous one while a sheet is up, returns the sheet that is already there. */
  var top0 = SH[SH.length - 1], k0 = o.kind + ':' + (o.key == null ? '' : o.key), now0 = performance.now();
  if (top0 && !top0.closing && (top0.k === k0 || now0 - lastPush < 350)) return top0;
  lastPush = now0;
  dismissToast();
  var wrap = document.createElement('div'); wrap.className = 'sh settle';   /* .settle: ignores every tap until the slide-in has finished (F-01 / F-02) */
  wrap.innerHTML = '<div class="dim" data-act="shdim"></div><section class="sheet" role="dialog" aria-modal="true" tabindex="-1"></section>';
  sheetsEl.appendChild(wrap);
  var s = { k: k0, wrap: wrap, el: wrap.lastChild, det: o.det || 'm', fixed: !!o.fixed, render: o.render, state: o.state || {}, kind: o.kind, opener: document.activeElement, onClose: o.onClose };
  s.el.innerHTML = o.render(s);
  SH.push(s);
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
  setTimeout(function () { wrap.classList.remove('settle'); }, reduce ? 330 : 480);
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
  PAGE.state.edit = null;   /* typed edits are kept per language (CED keys end with :vi / :en) */
  if (UI.top === 'qr') { var sc = qrEl.scrollTop; renderStage(); qrEl.scrollTop = sc; }
  SH.forEach(function (s) { s.state.edit = null; s.state.ed = {}; if (s.kind === 'product' || s.kind === 'set' || s.kind === 'lead') { rerender(s); afterPaint(function () { growAll(s.el); }); } });
  updateOrderBar(); if (UI.top === 'home') paintResume();
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
  return null;
}
function leadSet(s, a, id) {
  s.state.sel[a + ':' + lang] = id;
  if (id && !st.tips.lead) { st.tips.lead = true; save(); }
  if (s === PAGE) { if (UI.top === 'qr') { if (st.ui.stage === 'order') { paintCard('order'); paintOdock(); } else paintStageCards(); } return; }   /* the cards compose with the new line */
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
  if (k === 'set') { r = C.composeCopy('set', { set: SM(s.state.id), sel: s.state.sel, bubble: key.slice(1) }, lang); return C.stripLead(r.text, r.lead); }
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
function growAll(root) {   /* write all, read all, write all: one layout for every box of a sheet instead of one per box */
  var ts = $$('textarea.eta', root).filter(function (t) { return t.offsetParent; }); if (!ts.length) return;
  var sc = ts[0].closest('.shb,.tab'), top = sc ? sc.scrollTop : 0;
  ts.forEach(function (t) { t.style.height = 'auto'; });
  var hs = ts.map(function (t) { return t.scrollHeight + 2; });
  ts.forEach(function (t, i) { t.style.height = hs[i] + 'px'; });
  if (sc) sc.scrollTop = top;
}
function setEst(s, key) {
  var est = s.el.querySelector('[data-est="' + key + '"]'), ed = s.state.ed[key] !== undefined; if (!est || est.dataset.on === (ed ? '1' : '')) return;
  est.dataset.on = ed ? '1' : ''; est.innerHTML = estHtml(s, key, ed);
}
function syncBoxes(s) {
  $$('[data-eta]', s.el).forEach(function (ta) {
    var k = ta.dataset.eta, v = ebVal(s, k);
    if (ta.value !== v) { ta.value = v; growTa(ta); }
    setEst(s, k);
  });
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
  } else if (s.kind === 'set') {
    var set = SM(s.state.id), b = key.slice(1); body = clean(text);
    if (b === 'a') { set.ov = set.ov || {}; set.ov[l] = body; } else { set.bov = set.bov || {}; set.bov[b] = set.bov[b] || {}; set.bov[b][l] = body; }
    msg = 'Đã lưu làm mẫu · ' + BLBL[b] + ' · ' + lu(); sub = 'Tin này không tự đổi theo mẫu và giá nữa';
  }
  save(); delete s.state.ed[key]; syncBoxes(s); refreshAll();
  if (s.kind === 'set') { rerender(s); afterPaint(function () { growAll(s.el); }); }
  toast(msg, { sub: sub });
}
/* ---------- in-place message boxes on the stage cards ---------- */
function onCedInput(t) {
  var id = t.dataset.ced, c = CARDS[id]; if (!c || c.alt) return;
  var ek = c.key + ':' + lang;
  if (C.isEdited(c.body, t.value)) CED[ek] = t.value; else delete CED[ek];
  delete SENT[ek]; save();
  patchCard(id, true);
  if (id === 'order') { var dk = $('#odock'); if (dk && !dk.hidden) dk.innerHTML = dockHtml(); var on = $('#onote'); if (on) on.innerHTML = orderNotice(CARDS.order); }
  if (!t._g) t._g = requestAnimationFrame(function () { t._g = 0; fitPv(t); });
}
function cardReset(id) {
  var c = CARDS[id]; if (!c) return;
  var ek = c.key + ':' + lang, old = CED[ek]; if (old === undefined) return;
  delete CED[ek]; patchCard(id); paintOdock(); save();
  toast('Đã khôi phục tin gốc', { undo: function () { CED[ek] = old; patchCard(id); paintOdock(); save(); } });
}
function cardSave(id) {
  var d = DEFS[id], c = CARDS[id]; if (!d || !c || c.alt) return;
  var ek = c.key + ':' + lang, text = CED[ek]; if (text === undefined) return;
  if (!clean(text)) { toast('Khung đang trống, chưa lưu được', { bad: true }); return; }
  var msg, sub = null, cl = c.l;
  if (d.kind === 'composer') {
    var dr = st.draft, bk = st.set.bank, body = C.stripEnd(text, dr.bank && bk.no ? (cl === 'en' ? 'Bank transfer: ' : 'Chuyển khoản: ') + [bk.name, bk.no, bk.holder].filter(Boolean).join(' · ') : '');
    body = C.stripEnd(body, dr.info.trim() ? (cl === 'en' ? 'Ship to:' : 'Giao đến:') + '\n' + dr.info.trim() : '');
    var uo = C.untemplate(body, dr.lines.length ? [['orderLines', C.linesText(cl)], ['total', C.totalStr(cl)]] : []);
    st.ov.__ord = st.ov.__ord || {}; st.ov.__ord[cl] = uo.tpl;
    msg = 'Đã lưu làm mẫu · Tin chốt đơn · ' + cl.toUpperCase(); if (uo.lost.length) sub = 'Phần sửa thay chỗ tự điền, lần sau không tự điền nữa';
  } else {
    var tid = tidOf(d), pid0 = itemPid(), p0 = pid0 && PM[pid0], f0 = fillsOf(d);
    var u = C.untemplate(text, [['sizeChart', p0 ? ptext(p0, 'size', cl).trim() : ''], ['itemInfo', p0 ? ptext(p0, 'desc', cl).trim() : ''], ['item', p0 ? C.pitem(p0, cl) : ''], ['size', f0.size], ['sizeA', f0.sizeA], ['sizeB', f0.sizeB], ['trackingCode', f0.trackingCode], ['imageLinks', f0.imageLinks]]);
    st.ov[tid] = st.ov[tid] || {}; st.ov[tid][cl] = u.tpl;
    msg = 'Đã lưu làm mẫu · ' + short(eLabel(FM[tid])) + ' · ' + cl.toUpperCase();
    if (u.lost.length) sub = 'Phần sửa thay chỗ tự điền, lần sau không tự điền nữa';
  }
  save(); delete CED[ek]; refreshAll(); toast(msg, { sub: sub });
}
/* typed text the app must not send blindly: its own blanks ([size]) never; any other [..] / {{..}} only after a second tap (generated text: never, edit it first) */
function copyGate(s, text, edited, btn, key) {
  var kt = C.tokKeys(text); if (kt.length) { toast('Còn chỗ trống ' + C.tok(kt[0]), { bad: true, icon: 'warn' }); return false; }
  var ub = C.blanks(text); if (!ub.length) return true;
  if (!edited) { toast('Còn “' + short(ub[0], 30) + '” trong tin. Sửa trong khung rồi chép.', { bad: true, icon: 'warn' }); return false; }
  return guardPass(s, 'blank' + key, btn, 'Tin có “' + short(ub[0], 30) + '”. Chạm lại để chép nếu đúng ý');
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
  var s = pushSheet({ kind: 'lead', key: a, det: 'm', fixed: false, state: { scope: scope, a: a, edit: null, adding: false, sel: {}, ed: {} }, render: renderLead });
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
  var s = pushSheet({ kind: 'product', key: id, det: 'l', fixed: true, state: { id: id, open: seg, sel: {}, ed: {}, edit: null, guard: null }, render: renderProd });
  afterPaint(function () { growAll(s.el); });   /* opening a product does NOT change the customer context (design-v6 section 3) */
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
  if (note) h += '<div class="notice" style="margin-top:24px">' + ic('info', 's15') + '<span class="nb">Ghi chú nội bộ (không gửi cho khách): ' + esc(note) + '</span></div>';
  return h;
}
function prodFoot(s) {
  var open = s.state.open, miss = sheetCompose(s, 'info').missing && (open !== 'size') || sheetCompose(s, 'size').missing && open === 'size';
  return miss ? '<button class="btn dis wide" aria-disabled="true">Chưa có bản ' + lu() + '</button>' : '<button class="btn wide" data-act="pcopy" data-a="' + open + '">' + lblBtn(copyLabel(open) + ' · ' + lu()) + '</button>';
}
function renderProd(s) {
  var id = s.state.id, p = PM[id], l = lang, c = colorOf(p);
  var dt = ptrunc(p, 'desc', l), zt = ptrunc(p, 'size', l), h = '';
  h += shHead(pname(p, 'vi'), money(pv(p, 'price'), 'vi') + (c ? ' · ' + esc(c) : ''), langSeg(), avatar(p, 56, true));
  h += '<div class="shb ebody">';
  if (dt || zt) h += '<div class="notice row2" style="margin:0 0 12px">' + ic('info', 's15') + '<span class="nb">' + (dt && zt ? 'Thông tin và bảng size' : dt ? 'Thông tin' : 'Bảng size') + ' bị cắt ở sheet gốc <button class="txtbtn" style="min-height:32px;padding:0 4px" data-act="editp" data-id="' + id + '">' + ic('pencil', 's15') + 'Sửa</button></span></div>';
  h += '<div class="cap sm" style="padding:4px 0 6px">Bạn muốn gửi</div>' + segHtml([['info', 'Thông tin'], ['size', 'Bảng size'], ['both', 'Cả hai']], s.state.open, 'pseg', { tab: true, label: 'Bạn muốn gửi', id: 'pseg' }) +
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
  var text = forceLang ? shown.map(function (k) { return rs[k].text; }).join('\n\n') : shown.map(function (k) { return fullText(s, k); }).join('\n\n');
  if (!copyGate(s, text, !forceLang && shown.some(function (k) { return s.state.ed[k] !== undefined; }), btn, 'p' + open + l)) return;   /* F-03: typed [size] / [giá] never leaves */
  if (trunc && !guardPass(s, open + l, btn)) return;
  var label = pname(p, 'vi') + (open === 'size' ? ' · size' : '');
  copy(text, { btn: btn, label: open === 'size' ? 'Bảng size ' + pname(p, 'vi') : pname(p, 'vi'), lang: l, rec: { k: 'p:' + id + ':' + open, label: label, ref: { t: 'p', id: id, w: open } }, done: function (ok) { if (ok) { commitLeads(ids); UI.lastSeg = open; } } });
}


/* ---------- copying a card: reads CARDS[id] (composed at render time), nothing else runs before the clipboard write ---------- */
function cardAct(d) {
  var stg = d.stage, nx = nextStage(stg);
  if (d.kind === 'composer' || !nx || st.draft.done[nx] || d.parent) return null;
  return { label: 'Tiếp: ' + GLBL[nx], fn: function () { gotoStage(nx); } };
}
function cardDone(d, c) {
  commitLeads(c.r.leadIds); noteRecent(ctxPids());
  markDone(d.stage);
}
function cardCopy(id, btn) {
  var d = DEFS[id], c = CARDS[id], text;
  if (!c) return;
  text = c.text;
  if (!copyGate(PAGE, text, c.edited, btn, 'c' + id + c.l)) return;
  if (c.trunc && !guardPass(PAGE, 'c' + id + c.l, btn)) return;
  var seq = d.parent, ix = d.n, ek = c.key + ':' + lang;
  copy(text, { btn: btn, label: d.t.replace(/^Tin \d · /, ''), lang: c.l, act: cardAct(d), rec: null,
    msg: seq ? 'Đã chép tin ' + ix + ' · ' + lu() : undefined,
    done: function (ok) {
      if (!ok) return;
      cardDone(d, c);
      if (c.edited) { SENT[ek] = 1; save(); }   /* sent: the draft is no longer kept across an app restart */
      if (seq) seqMark(d.parent, ix - 1);
    } });
}
function seqMark(pid, i) {
  SEQ[pid] = SEQ[pid] || {}; SEQ[pid][i] = true;
  var card = $('#stage [data-card="' + pid + '"]'); if (!card) return;
  var subs = [0, 1], nx = subs.findIndex(function (k) { return !SEQ[pid][k]; }), k = subs.filter(function (j) { return SEQ[pid][j]; }).length;
  $$('.mb', card).forEach(function (el, j) {
    var dn = !!SEQ[pid][j], nt = j === nx;
    el.classList.toggle('done', dn); el.classList.toggle('next', nt);
    el.querySelector('.bdisc').innerHTML = dn ? ic('check', 's15') : (j + 1);
    var tg = el.querySelector('.btag, .bdone'); if (tg) tg.remove();
    if (dn || nt) { var sp = document.createElement('span'); sp.className = nt ? 'btag' : 'bdone'; sp.textContent = nt ? 'Tiếp theo' : 'Đã chép'; el.querySelector('.bh').appendChild(sp); }
  });
  var mm = card.querySelector('[data-seqm]'); if (mm) mm.textContent = 'Đã chép ' + k + '/2';
  if (nx >= 0) toast('Đã chép tin ' + (i + 1) + ' · Tiếp theo: tin ' + (nx + 1) + ' · ' + lu());
}
/* the capsule names what is missing; tapping it goes there instead of copying */
function flashEl(el) { if (!el) return; el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); setTimeout(function () { el.classList.remove('flash'); }, 700); }
function pickOther(id) {
  var pd = DEFS[id], pk0 = pd.parent || pd.id;
  openPicker('pick', function (pid) { fillShift(function () { (FILL[pk0] = FILL[pk0] || {}).otherItem = pid; }); }, { title: 'Mẫu thay thế', sub: 'Chạm một mẫu để gợi ý cho khách' });
}
function goInput(k, id) {
  var d = DEFS[id], par = d && (d.parent || d.id), root = $('#stage'), scope = (par && root.querySelector('[data-card="' + par + '"]')) || root, el;
  if (id === 'dock' || (d && d.kind === 'composer')) scope = root;
  if (k === 'blank') {   /* put the cursor on the first leftover [..] of the message */
    var bt = $('#stage textarea.pv[data-ced="' + (id === 'dock' ? 'order' : id) + '"]'), bs = (CARDS[id === 'dock' ? 'order' : id] || { r: { blanks: [] } }).r.blanks[0] || '';
    if (bt) { bt.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); bt.focus({ preventScroll: true }); var bi = bt.value.indexOf(bs); try { bt.setSelectionRange(bi < 0 ? 0 : bi, bi < 0 ? 0 : bi + bs.length); } catch (e) { /* ignore */ } }
    return;
  }
  if (k === 'size' && scope === root) el = root.querySelector('.lrow2.nosz [data-need=size]') || root.querySelector('[data-need=size]');
  else el = scope.querySelector('[data-need="' + k + '"]') || (k === 'item' || k === 'otherItem' ? root.querySelector('[data-need=item]') : null);
  if (k === 'trackingCode' && el) { var inp = el.querySelector('input'); if (inp) { pasteFill(inp, id); } return; }
  if (k === 'otherItem' && d) { pickOther(id); return; }
  if (el) { el.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' }); flashEl(el); var f = el.querySelector('input'); if (f && k !== 'size') f.focus({ preventScroll: true }); return; }
  if (k === 'item') { openPick(d && d.id === 'sizes' ? 'size' : d && d.kind === 'composer' ? 'order' : 'context', true); return; }
}
function pasteFill(inp, id) {
  var d = DEFS[id], k = inp.dataset.fill;
  function put(x) { x = String(x || '').trim(); if (!x) { inp.focus(); return; } inp.value = x; fillTyped(id, k, x); }
  try { navigator.clipboard.readText().then(put, function () { inp.focus(); }); } catch (e) { inp.focus(); }
}
function fillTyped(id, k, v) {
  var d = DEFS[id], key = d.parent || d.id, before = genSnap();
  (FILL[key] = FILL[key] || {})[k] = v;
  var dropped = dropStale(before);
  if (d.parent) { patchCard(d.parent + '.1'); patchCard(d.parent + '.2'); } else patchCard(d.id);
  if (dropped) toast('Tin đã cập nhật theo lựa chọn mới', { sub: 'Phần bạn sửa trước đó đã bỏ' });
}
function addLangTarget(id) {
  var d = DEFS[id];
  if (d.id === 'greet' || d.id === 'sizes') { var f = ctxPids().filter(function (pid) { return !ptext(PM[pid], d.id === 'sizes' ? 'size' : 'desc', lang).trim(); })[0] || ctxPids()[0]; if (f) editProduct(f); return; }
  editEntry(tidOf(d));
}

/* ---------- the unified product picker "Chọn mẫu": photo grid, search, category, recents, common sets, size chosen in the same step ----------
   Modes: context (size optional), order (size required), size (several charts in one message). Tap = toggle; nothing is committed until the footer button.
   Sections are computed once when the sheet opens (frozen); toggles only update the checks and the tray. */
var PKT = { context: ['Khách đang hỏi mẫu nào?', 'Chọn 1 hoặc nhiều mẫu. Size chọn sau cũng được.'], order: ['Thêm món vào đơn', 'Chạm ảnh, rồi chọn size ngay bên dưới.'], size: ['Gửi bảng size mẫu nào?', 'Chọn 2 mẫu để gửi cả hai bảng trong một tin.'] };
var PKA = { context: 'Chạm một mẫu là xong. Muốn gửi thêm mẫu: chạm “Thêm mẫu” sau.', size: 'Chạm một mẫu là xong. Cần 2 mẫu: chọn “Set hay hỏi” hoặc “Thêm mẫu”.' };
function pkSize() { return innerWidth >= 414 ? 104 : 96; }
function setPairs() {
  var out = [];
  st.sets.forEach(function (x) { if (x.items.length === 2 && x.items.every(function (id) { return PM[id]; })) out.push(x.items.slice()); });
  (SEED.setSuggestions || []).forEach(function (x) {
    if (!PM[x[0]] || !PM[x[1]]) return;
    if (out.some(function (y) { return y.slice().sort().join('|') === x.slice().sort().join('|'); })) return;
    out.push(x.slice());
  });
  return out.slice(0, 6);
}
function openPick(mode, quick) {   /* quick: opened from a strip ("Tất cả mẫu"): with an empty context one tap on a photo is the whole job */
  var pk = [];
  if (mode !== 'order') ctxPids().forEach(function (pid) { pk.push({ pid: pid, size: lineOf(pid).size || null }); });
  var sh = pushSheet({ kind: 'pick', key: mode, det: 'l', fixed: true, state: { mode: mode, pk: pk, q: '', cat: 'all', rec: recents(6), sets: setPairs(), inOrder: ctxPids(), part: true, auto: !!quick && mode !== 'order' && !pk.length }, render: renderPick });
  if (sh.kind === 'pick' && sh.state.part) afterPaint(function () { if (sh.closing || !sh.state.part) return; sh.state.part = false; var b = $('#pkbody', sh.el); if (b) b.innerHTML = pkBody(sh); });
  return sh;
}
function pkHas(s, pid) { return s.state.pk.some(function (r) { return r.pid === pid; }); }
function pkCell(s, p) {
  var on = pkHas(s, p.id), ino = s.state.mode === 'order' && s.state.inOrder.indexOf(p.id) > -1, c = colorOf(p);
  var sub = ino ? 'Trong đơn' : money(pv(p, 'price'), 'vi');
  return '<button class="pcell' + (on ? ' sel' : '') + (ino ? ' ino' : '') + '" data-act="pkcell" data-pid="' + p.id + '" aria-pressed="' + on + '" aria-label="' + esc(pname(p, 'vi') + ', ' + money(pv(p, 'price'), 'vi') + (on ? ', đã chọn' : '')) + '"><span class="pa">' + avatar(p, pkSize(), true) + '<i class="ck">' + ic('check') + '</i></span><span class="nm">' + esc(pname(p, 'vi')) + '</span><span class="pc num">' + esc(sub) + '</span></button>';
}
function pkPair(s, pr) {
  var ps = pr.map(function (id) { return PM[id]; }), on = pr.every(function (id) { return pkHas(s, id); });
  return '<button class="pcell ppair' + (on ? ' sel' : '') + '" data-act="pkpair" data-pair="' + pr.join('|') + '" data-pa="' + pr[0] + '" data-pb="' + pr[1] + '" aria-pressed="' + on + '" aria-label="' + esc('Set ' + C.setLabel({ items: pr }) + (on ? ', đã chọn' : '')) + '"><span class="pa"><span class="pair2">' + ps.map(function (p) { return avatar(p, innerWidth >= 414 ? 64 : 60); }).join('') + '</span><i class="ck">' + ic('check') + '</i></span><span class="nm">' + esc(C.setLabel({ items: pr })) + '</span></button>';
}
function pkBody(s) {
  var q = norm(s.state.q || ''), cat = s.state.cat, list = C.byCat(PS, cat), h = '';
  if (q) {
    var hit = list.filter(function (p) { return norm(pname(p, 'vi') + ' ' + colorOf(p)).indexOf(q) > -1; });
    if (!hit.length) return '<div class="empty" style="padding-top:12px">' + ic('search', 's34') + '<div class="tt">Chưa tìm thấy “' + esc(s.state.q) + '”</div><p>Thử một tên ngắn hơn nhé.</p><button class="btn tonal" data-act="pkqclear">Xoá tìm kiếm</button></div>';
    return '<h2 class="cap sm pkh">Kết quả · ' + hit.length + '</h2><div class="pgrid">' + hit.map(function (p) { return pkCell(s, p); }).join('') + '</div>';
  }
  if (s.state.part) {   /* first paint: only the first row, the rest follows one frame later (the sheet opens fast, the grid is long) */
    var firstIds = (s.state.rec.length ? s.state.rec : list.map(function (p) { return p.id; })).slice(0, 6);
    return '<h2 class="cap sm pkh">' + (s.state.rec.length ? 'Gần đây' : 'Chọn mẫu') + '</h2><div class="pgrid">' + firstIds.map(function (id) { return pkCell(s, PM[id]); }).join('') + '</div>';
  }
  if (cat === 'all') {
    if (s.state.rec.length) h += '<h2 class="cap sm pkh">Gần đây</h2><div class="pgrid">' + s.state.rec.map(function (id) { return pkCell(s, PM[id]); }).join('') + '</div>';
    if (s.state.sets.length) h += '<h2 class="cap sm pkh">Set hay hỏi</h2><div class="pgrid">' + s.state.sets.map(function (pr) { return pkPair(s, pr); }).join('') + '</div>';
  }
  C.collections(list).forEach(function (g) { h += '<h2 class="cap sm pkh">' + esc(g.name) + ' · ' + g.items.length + '</h2><div class="pgrid">' + g.items.map(function (p) { return pkCell(s, p); }).join('') + '</div>'; });
  return h;
}
function pkTray(s) {
  var m = s.state.mode, pk = s.state.pk, need = pk.filter(function (r) { return !r.size; }).length, rows = '';
  pk.forEach(function (r) {
    var p = PM[r.pid];
    rows += '<div class="trow" data-pid="' + r.pid + '">' + avatar(p, 32) + '<span class="tn"><span class="t">' + esc(pname(p, 'vi')) + '</span>' + (m !== 'size' && !r.size ? '<span class="h">Chọn size</span>' : '') + '</span>' +
      (m === 'size' ? '' : segHtml(psizes(p).map(function (z) { return [z, z]; }), r.size, 'pksize', { label: 'Size ' + pname(p, 'vi'), attr: 'data-p="' + r.pid + '"' })) +
      '<button class="iconbtn" data-act="pkrm" data-p="' + r.pid + '" aria-label="Bỏ ' + esc(pname(p, 'vi')) + '"><span class="c bare">' + ic('x', 's15') + '</span></button></div>';
  });
  var n = pk.length, btn;
  if (!n) btn = '<button class="btn wide dis" aria-disabled="true">Chọn ít nhất 1 mẫu</button>';
  else if (m === 'order' && need) btn = '<button class="btn wide dis" aria-disabled="true">Chọn size cho ' + need + ' món</button>';
  else btn = '<button class="btn wide" data-act="pkdone">' + (m === 'order' ? 'Thêm ' + n + ' món vào đơn' : 'Xong · ' + n + ' mẫu') + '</button>';
  return (rows ? '<div class="trows">' + rows + '</div>' : '') + btn;
}
function renderPick(s) {
  var m = s.state.mode;
  return shHead(PKT[m][0], '<span class="wr">' + esc(s.state.auto ? PKA[m] : PKT[m][1]) + '</span>') + '<div class="pkq"><div class="sfield" style="margin:0">' + ic('search') + '<input data-pkq type="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" placeholder="Tìm tên, màu…" aria-label="Tìm tên, màu"></div></div>' +
    '<div class="pkf" id="pkf">' + catSeg(s.state.cat, 'pkcat') + '</div><div class="shb pad pkb" id="pkbody">' + pkBody(s) + '</div><div class="shf tray" id="tray">' + pkTray(s) + '</div>';
}
function paintPick(s, scrollEnd) {
  $$('.pcell[data-pid]', s.el).forEach(function (b) { var on = pkHas(s, b.dataset.pid); b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on); });
  $$('.ppair', s.el).forEach(function (b) { var on = pkHas(s, b.dataset.pa) && pkHas(s, b.dataset.pb); b.classList.toggle('sel', on); b.setAttribute('aria-pressed', on); });
  var tr = $('#tray', s.el), old = $('.trows', tr), keep = old ? old.scrollTop : 0;
  tr.innerHTML = pkTray(s);
  var nw = $('.trows', tr); if (nw) nw.scrollTop = scrollEnd ? nw.scrollHeight : keep;
  syncSheetBody();
}
function pkAdd(s, pid) {
  if (pkHas(s, pid)) return true;
  var all = ctxPids().concat(s.state.pk.map(function (r) { return r.pid; })).filter(function (x, i, a) { return a.indexOf(x) === i; });
  if (all.indexOf(pid) < 0 && all.length >= MAXP) { toast('Tối đa 4 mẫu một lần — bỏ bớt một mẫu nhé', { icon: 'info' }); return false; }
  var L = s.state.mode === 'order' ? null : lineOf(pid), z = psizes(PM[pid]);
  s.state.pk.push({ pid: pid, size: z.length === 1 ? z[0] : L && L.size || null });
  return true;
}
/* an empty context + one tap on a photo (or a "Set hay hỏi" pair) = the job is done: show the check for a beat, then commit */
function pkAuto(s) {
  if (!s.state.auto || s.state.fin || !s.state.pk.length) return;
  s.state.fin = true;
  setTimeout(function () { if (!s.closing && !s.done) pkCommit(s); }, 140);
}
function pkCommit(s) {
  var m = s.state.mode, pk = s.state.pk, gone = m === 'order' ? [] : ctxPids().filter(function (pid) { return !pkHas(s, pid); });
  if (s.done) return; s.done = true;
  mutate(function () {
    var ls = st.draft.lines;
    if (m === 'order') {
      pk.forEach(function (r) {
        if (ls.some(function (L) { return L.pid === r.pid && L.size === r.size; })) return;
        var wait = ls.filter(function (L) { return L.pid === r.pid && !L.size; })[0];
        if (wait) wait.size = r.size; else ls.push({ pid: r.pid, size: r.size, qty: 1 });
      });
    } else {
      st.draft.lines = ls.filter(function (L) { return gone.indexOf(L.pid) < 0; });
      pk.forEach(function (r) {
        var L = lineOf(r.pid);
        if (!L) st.draft.lines.push({ pid: r.pid, size: m === 'size' ? null : r.size, qty: 1 });
        else if (m !== 'size' && r.size && L.size !== r.size) {
          var dup = st.draft.lines.filter(function (x) { return x !== L && x.pid === r.pid && x.size === r.size; })[0];
          if (dup) { dup.qty = Math.min(9, dup.qty + L.qty); st.draft.lines.splice(st.draft.lines.indexOf(L), 1); } else L.size = r.size;
        }
      });
    }
  }, gone.length ? { msg: 'Đã bỏ ' + gone.map(function (id) { return pv(PM[id], 'name'); }).join(', ') + ' khỏi khách đang hỏi' } : m === 'order' ? { msg: 'Đã thêm ' + pk.length + ' món vào đơn', icon: 'checkc' } : null);
  noteRecent(pk.map(function (r) { return r.pid; })); if (m === 'order') bump();
  closeSheet(s, true);
}

/* ---------- product picker ---------- */
function openPicker(mode, cb, o) {
  o = o || {};
  pushSheet({
    kind: 'picker', key: mode + '|' + (o.title || ''), det: 'l', fixed: true, state: { q: '', mode: mode, cb: cb, title: o.title, sub: o.sub, from: o.from, skip: o.skip || [], first: null, cat: 'all', none: !!o.none, cur: o.cur || null },
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
  var s = pushSheet({ kind: 'set', key: id, det: 'l', fixed: true, state: { id: id, sel: {}, edit: null, ed: {}, guard: null, next: 'a', done: {} }, render: renderSet });
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
  if (set.checked === false) h += '<div class="notice row2" style="margin:0 0 4px">' + ic('info', 's15') + '<span class="nb">Giá set đang bằng tổng giá lẻ, chưa kiểm tra. Xem lại trước khi gửi.</span><button class="btn tonal" data-act="setok">Đã kiểm tra</button></div>';
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
  var text = forceLang ? r.text : s.kind === 'set' ? fullText(s, 's' + b) : r.text;
  if (!copyGate(s, text, typed, t, 'set' + b + l)) return;
  if (((r.trunc && !typed) || unchecked) && !guardPass(s, 'set' + b + l, t, unchecked ? 'Giá set chưa kiểm tra. Chạm lại để chép nếu giá đúng' : 0)) return;
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

/* ---------- dialogs ---------- */
function dlgBox(msg, buttons) {
  var d = document.createElement('div'); d.className = 'dlg'; d.setAttribute('role', 'alertdialog');
  d.innerHTML = '<div><p>' + esc(msg) + '</p><div class="bs">' + buttons.map(function (b, i) { return '<button class="' + (b[2] || '') + '" data-act="dbtn" data-i="' + i + '">' + esc(b[0]) + '</button>'; }).join('') + '</div></div>';
  d._fns = buttons.map(function (b) { return b[1]; }); d.classList.add('settle'); $('#app').parentNode.appendChild(d);
  setTimeout(function () { d.classList.remove('settle'); }, 320);   /* a double tap on the opener must not land on "Xoá" */
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
      '<h3 class="h2">Dữ liệu</h3><div class="slist">' + srow('export', '', 'Xuất bản sao lưu (.json)', null, false) + srow('import', '', 'Nhập bản sao lưu', null, false) + srow('resetall', '', 'Khôi phục nội dung gốc', null, false).replace('class="srw"', 'class="srw dest"') + (st.bak ? srow('restorebak', '', 'Trả lại nội dung trước khi khôi phục', new Date(st.bak.at).toLocaleDateString('vi-VN'), false) : '') + '</div>' +
      '<p class="foot" style="text-align:center;margin-top:24px">Soft Embrace · v7<br>Làm bằng sự dịu dàng.</p>';
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
/* undo of "Khôi phục nội dung gốc": the content that was replaced is kept in st.bak until the next reset */
function restoreBak() {
  var b = st.bak; if (!b) return;
  try { st.ov = JSON.parse(b.ov); st.lead = Object.assign({ sel: {}, custom: [], edits: {}, hidden: [] }, JSON.parse(b.lead)); } catch (e) { return; }
  delete st.bak; IDX = null; save(); refreshAll(); toast('Đã trả lại nội dung trước đó');
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
    if (k === 'p') openProduct(oid); else if (k === 's') openSet(oid);
    return;
  }
  var s = scopeOf(t), A = t.dataset.a;
  /* a tap that lands on a sheet that is already closing (double tap) finds no scope: ignore it instead of acting on the page */
  if (/^(pk(cell|pair|size|rm|done|cat)|shippick|shipdone|leadpick|leadedit|leadsave|leaddel|leadadd|leadaddsave|pickone)$/.test(a) && s.kind === 'page') return;
  switch (a) {
    case 'lang': setLang(v); break;
    case 'top': if (v !== UI.top) setTop(v); else if (v !== 'home') { var sc0 = v === 'qr' ? qrEl : piEl; if (sc0.scrollTop > 0) sc0.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); } break;
    case 'stage': gotoStage(v); break;
    case 'stmore': UI.more[st.ui.stage] = !UI.more[st.ui.stage]; paintStageBody(); break;
    case 'pview': UI.view = v; renderPI(); break;
    case 'pgo': UI.view = v; setTop('pi'); piEl.scrollTop = 0; break;
    case 'pfilt': UI.filt = v; renderList(); break;
    case 'pkfilt': s.state.cat = v; selectSeg($('#pkf .seg', s.el), v); $('#plist', s.el).innerHTML = pickerList(s); break;
    case 'pkqclear': { s.state.q = ''; var pq2 = $('[data-pkq]', s.el); if (pq2) { pq2.value = ''; pq2.focus(); } $('#pkbody', s.el).innerHTML = pkBody(s); break; }
    case 'pkclear': { s.state.q = ''; var pq = $('[data-pq]', s.el); if (pq) pq.value = ''; $('#plist', s.el).innerHTML = pickerList(s); break; }
    case 'qclear': $('#q').value = ''; $('#q').focus(); doSearch(); break;
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
      if (addLine(id, v)) addedToast(id, v);
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
      if (s.closing || s.picked) break; s.picked = true;
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
    case 'pickone': {
      var ps = s.state; if (s.closing) break;
      if (ps.mode === 'setnew') {
        if (!ps.first) { ps.first = id; $('#plist', s.el).innerHTML = pickerList(s); break; }
        if (ps.first === id) break;
      }
      var cb = ps.cb, f1 = ps.first; closeSheet(s); cb(f1 ? [f1, id] : id); break;
    }
    /* the customer context, cards and strips */
    case 'newcust': newCustomer(); break;
    case 'ctxpick': openPick(t.dataset.m || 'context'); break;
    case 'stripset': ctxToggle(t.dataset.pid); break;
    case 'stripall': openPick(t.dataset.m, true); break;
    case 'greetv': st.ui.greetV = v; save(); paintCard('greet'); break;
    case 'cardcopy': cardCopy(t.dataset.c, t); break;
    case 'cardfocus': { var fta = $('#stage textarea.pv[data-ced="' + t.dataset.c + '"]'); if (fta && !fta.readOnly) { fta.focus({ preventScroll: true }); var fl = fta.value.length; try { fta.setSelectionRange(fl, fl); } catch (e) { /* ignore */ } fta.scrollTop = fta.scrollHeight; fta.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); } break; }
    case 'cardreset': cardReset(t.dataset.c); break;
    case 'cardsave': cardSave(t.dataset.c); break;
    case 'extrashow': UI.xtra = true; paintStageBody(); break;
    case 'cardneed': goInput(t.dataset.k, t.dataset.c); break;
    case 'dockneed': goInput(t.dataset.k, 'dock'); break;
    case 'fititem': fillShift(function () { FILL._item = t.dataset.pid; }); break;
    case 'fitsize': setLineSize(itemPid(), v); break;
    case 'fillseg': { var dd = DEFS[t.dataset.c], fk = dd.parent || dd.id, fkk = t.dataset.k; fillShift(function () { (FILL[fk] = FILL[fk] || {})[fkk] = v; }); break; }
    case 'thanksv': fillShift(function () { st.ui.thanksV = v; save(); }); break;
    case 'pastefill': pasteFill(t.parentNode.querySelector('input'), t.dataset.c); break;
    case 'pastego': pasteGo(); break;
    case 'attach': toast('Nhớ gửi đính kèm', { sub: FM[id].attach || eLabel(FM[id]), icon: 'clip' }); break;
    case 'addlang': addLangTarget(t.dataset.c); break;
    case 'pickother': pickOther(t.dataset.c); break;
    /* unified picker */
    case 'pkcell': { var pid1 = t.dataset.pid, had = pkHas(s, pid1); if (s.state.fin) break; if (had) s.state.pk = s.state.pk.filter(function (r) { return r.pid !== pid1; }); else if (!pkAdd(s, pid1)) break; paintPick(s, !had); if (!had) pkAuto(s); break; }
    case 'pkpair': {
      if (s.state.fin) break;
      var pa = t.dataset.pa, pb = t.dataset.pb;
      if (pkHas(s, pa) && pkHas(s, pb)) s.state.pk = s.state.pk.filter(function (r) { return r.pid !== pa && r.pid !== pb; });
      else { var all = ctxPids().concat(s.state.pk.map(function (r) { return r.pid; }), [pa, pb]).filter(function (x, i, arr) { return arr.indexOf(x) === i; }); if (all.length > MAXP) { toast('Tối đa 4 mẫu một lần — bỏ bớt một mẫu nhé', { icon: 'info' }); break; } pkAdd(s, pa); pkAdd(s, pb); }
      paintPick(s, true); pkAuto(s); break;
    }
    case 'pksize': { var rr = s.state.pk.filter(function (x) { return x.pid === t.dataset.p; })[0]; if (rr) rr.size = v; paintPick(s); break; }
    case 'pkrm': s.state.pk = s.state.pk.filter(function (r) { return r.pid !== t.dataset.p; }); paintPick(s); break;
    case 'pkdone': pkCommit(s); break;
    case 'pkcat': s.state.cat = v; selectSeg($('#pkf .seg', s.el), v); $('#pkbody', s.el).innerHTML = pkBody(s); break;
    /* order */
    case 'oadd2': openPick('order'); break;
    case 'lnrm': { var li = +t.dataset.i, Lr = st.draft.lines[li]; if (!Lr) break; mutate(function () { st.draft.lines.splice(li, 1); }, { msg: 'Đã bỏ ' + pname(PM[Lr.pid], 'vi') }); break; }
    case 'lnqty': { var Lq = st.draft.lines[+t.dataset.i]; if (!Lq) break; mutate(function () { Lq.qty = Math.max(1, Math.min(9, Lq.qty + (+t.dataset.d))); }); break; }
    case 'lnsize': {
      var L3 = st.draft.lines[+t.dataset.i]; if (!L3 || L3.size === v) break;
      var dup2 = st.draft.lines.filter(function (x) { return x !== L3 && x.pid === L3.pid && x.size === v; })[0];
      mutate(function () { if (dup2) { dup2.qty = Math.min(9, dup2.qty + L3.qty); st.draft.lines.splice(st.draft.lines.indexOf(L3), 1); } else L3.size = v; }, dup2 ? { msg: 'Đã gộp vào ' + pname(PM[L3.pid], 'vi') + ' · ' + v } : null);
      break;
    }
    case 'shipopen': openShip(); break;
    case 'shippick': {
      if (s.closing) break;
      mutate(function () { st.draft.ship = v; st.set.lastShip = v; if (v === 'custom') st.set.lastCustom = st.draft.custom || 0; });
      if (v === 'custom') { rerender(s); var ci = $('[data-in=custom]', s.el); if (ci) ci.focus(); }
      else { $$('.rrow[role=radio]', s.el).forEach(function (r) { r.setAttribute('aria-checked', r.querySelector('[data-act=shippick]').dataset.v === v); }); setTimeout(function () { closeSheet(s); }, 200); }
      break;
    }
    case 'shipdone': closeSheet(s); break;
    case 'recvtoggle': UI.recv = !UI.recv; paintStageBody(); if (UI.recv) { var ri = $('[data-in=info]'); if (ri) ri.focus(); } break;
    case 'pasteinfo': pasteInfo(); break;
    case 'copyorder': orderCopy(t); break;
    /* sets */
    case 'setnew': openPicker('setnew', function (pair) { var set = createSet(pair); openSet(set.id); }, { title: 'Chọn 2 mẫu cho set', sub: 'Chạm mẫu thứ nhất, rồi mẫu thứ hai' }); break;
    case 'bcopy': bubbleCopy(s, t, t.dataset.b, t.dataset.alt ? other(lang) : null); break;
    case 'bnext': bubbleCopy(s, t, s.state.next); break;
    case 'setok': SM(s.state.id).checked = true; save(); rerender(s); afterPaint(function () { growAll(s.el); }); break;
    case 'setsugg': { var sx = createSet([t.dataset.a, t.dataset.sb], false); openSet(sx.id); break; }
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
    case 'resetall': confirmBox('Khôi phục toàn bộ nội dung gốc? Mẫu, câu mở đầu và tin đã lưu của bạn sẽ về như ban đầu. Bạn có thể Hoàn tác ngay sau đó.', 'Khôi phục', function () {
      var back = { at: Date.now(), ov: JSON.stringify(st.ov), lead: JSON.stringify(st.lead) };
      st.bak = back; st.ov = {}; st.lead = { sel: {}, custom: [], edits: {}, hidden: [] }; IDX = null; save(); refreshAll();
      toast('Nội dung gốc đã được khôi phục', { ms: 9000, undo: function () { restoreBak(); } });
    }); break;
    case 'restorebak': restoreBak(); { var sb = topS('settings'); if (sb) settingsGo(sb, sb.state.path, 0); } break;
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
  else if (t.matches('[data-ced]')) onCedInput(t);
  else if (t.matches('[data-fill]')) fillTyped(t.dataset.c, t.dataset.fill, t.value);
  else if (t.matches('[data-pkq]')) { s.state.q = t.value; $('#pkbody', s.el).innerHTML = pkBody(s); }
  else if (t.matches('[data-pq]')) { s.state.q = t.value; $('#plist', s.el).innerHTML = pickerList(s); }
  else if (t.matches('[data-sprice]')) { var d0 = t.value.replace(/\D/g, ''); SM(s.state.id).price = d0 ? parseInt(d0, 10) : null; save(); refreshPreview(s, ['sa']); }
  else if (t.matches('[data-lfi],[data-ovta]')) grow(t);
  else if (t.matches('[data-lfs]')) {
    var lid = t.dataset.id, ls = C.leadStore(), cu = ls.custom.filter(function (x) { return x.id === lid; })[0];
    if (cu) cu[t.dataset.lfs] = t.value; else { ls.edits[lid] = ls.edits[lid] || {}; ls.edits[lid][t.dataset.lfs] = t.value; }
    save(); flashSaved();
  }
  else if (t.matches('[data-ov]')) onOvInput(t);
  else if (t.matches('[data-in=info]')) orderTyped(function () { st.draft.info = t.value; });
  else if (t.matches('[data-in=custom]')) orderTyped(function () { st.draft.custom = parseInt(t.value.replace(/\D/g, ''), 10) || 0; st.set.lastCustom = st.draft.custom; t.value = st.draft.custom ? nfV.format(st.draft.custom) : ''; });
});
document.addEventListener('change', function (e) {
  var t = e.target, s0 = scopeOf(t);
  if (t.matches('[data-spurl]')) { SM(s0.state.id).postUrl = t.value.trim(); save(); s0.state.ed = {}; rerender(s0); afterPaint(function () { growAll(s0.el); }); return; }
  if (t.matches('[data-in=bank]')) { orderTyped(function () { st.draft.bank = t.checked; }); return; }
  if (t.matches('[data-in=sizeask]')) { fillShift(function () { st.ui.sizeAsk = t.checked; save(); }); return; }
});
document.addEventListener('focusin', function (e) { var s = topS('settings'); if (s && e.target.matches('textarea')) s.state.lastTa = e.target; });
document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.matches('[data-fill],[data-pq],[data-pkq],#q,[data-in=custom],[data-sprice],[data-spurl]')) e.target.blur(); });


/* ---------- #debug=dupes: the idempotent-render contract made checkable (design-v6 section 9.6) ----------
   After every DOM change (one check per frame) no two siblings may share a key attribute, no keyed group may appear twice under its owner, and no two
   sheets of the same kind+key may be stacked. A failure logs console.error('dupe', ...), which the UI tests treat as a test failure. Inert without the hash. */
function dbgOn(n) { return new URLSearchParams(location.hash.slice(1)).getAll('debug').indexOf(n) > -1; }
function assertUnique() {
  var bad = [], KEYS = ['data-row', 'data-card', 'data-line', 'data-b', 'data-slot', 'data-box', 'data-eb', 'data-est', 'data-pid', 'data-pair', 'data-strip', 'data-ctx'];
  $$('body *').forEach(function (el) {
    if (!el.parentNode) return;
    KEYS.forEach(function (a) {
      var v = el.getAttribute(a); if (v === null) return;
      var sib = el.parentNode.children;
      for (var i = 0; i < sib.length; i++) if (sib[i] !== el && sib[i].getAttribute(a) === v && sib[i].tagName === el.tagName) { bad.push(a + '=' + v); return; }
    });
  });
  ['.mcard', '.ctxbar', '#odock'].forEach(function (sel) {
    var seen = {};
    $$(sel).forEach(function (el) { var k = sel + (el.dataset.card || ''); if (seen[k]) bad.push(k); seen[k] = 1; });
  });
  $$('.pstrip').forEach(function (el, i, all) { var c = el.closest('[data-card]'); if (c && all.some(function (o, j) { return j !== i && o.closest('[data-card]') === c; })) bad.push('pstrip in ' + c.dataset.card); });
  $$('.sheet').forEach(function (sh) {
    var seen = {}; $$('[data-row]', sh).forEach(function (r) { if (seen[r.dataset.row]) bad.push('row ' + r.dataset.row); seen[r.dataset.row] = 1; });
  });
  var live = $$('#sheets .sh.in').length; if (live !== SH.filter(function (x) { return !x.closing; }).length) bad.push('sheet count ' + live + '/' + SH.length);
  for (var i = 1; i < SH.length; i++) if (SH[i].k === SH[i - 1].k && !SH[i].closing && !SH[i - 1].closing) bad.push('stacked sheet ' + SH[i].k);
  bad.forEach(function (b) { console.error('dupe', b); });
  return bad;
}
if (dbgOn('dupes')) {
  var dq = 0;
  new MutationObserver(function () { if (!dq) dq = requestAnimationFrame(function () { dq = 0; assertUnique(); }); }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['class', 'data-pid', 'data-row'] });
}

/* ---------- boot ---------- */
/* migration: the old 20-minute st.ctx becomes a line of the context; unknown products and impossible sizes are dropped silently */
(function () {
  var c = st.ctx, d = st.draft;
  if (c && c.itemId && Date.now() - c.at < 20 * 60000 && !d.lines.length && PM[c.itemId]) d.lines.push({ pid: c.itemId, size: c.size || null, qty: 1 });
  delete st.ctx; delete st.hintDone;
  d.lines = d.lines.filter(function (L) { return PM[L.pid]; }).slice(0, 8);
  d.lines.forEach(function (L) { L.qty = Math.max(1, Math.min(9, +L.qty || 1)); if (L.size && psizes(PM[L.pid]).indexOf(L.size) < 0) L.size = null; });
  if (d.lines.length && !d.at) d.at = Date.now();
  if (['courier', 'fee', 'free', 'custom'].indexOf(d.ship) < 0) d.ship = 'courier';
  if (['new', 'back', 'info'].indexOf(st.ui.greetV) < 0) st.ui.greetV = 'new';
  if (!C.STAGES.some(function (g) { return g.id === st.ui.stage; })) st.ui.stage = 'greet';
  /* restore the unsent drafts of the last session (typed card edits, tracking code, sequence ticks) */
  try {
    var eds = d.eds || {};
    Object.keys(eds).forEach(function (ek) { var e = eds[ek]; if (e && typeof e.t === 'string' && edGen(ek) === e.g) CED[ek] = e.t; });
    Object.assign(FILL, d.fill || {}); Object.assign(SEQ, d.seq || {});
  } catch (x) { /* a damaged draft is dropped */ }
})();
(function () {
  var on = false, bar = $('#stseg');
  qrEl.addEventListener('scroll', function () { var n = qrEl.scrollTop > 4; if (n !== on) { on = n; bar.classList.toggle('scr', n); } }, { passive: true });
})();
paintLang(); renderHomeScreen(); renderStage(); renderPI(); setTop('home');
idle(function () { if (!IDX) buildIndex(); });
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  addEventListener('load', function () {
    var had = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.register('sw.js').catch(function () { /* no worker: the app still runs online */ });
    navigator.serviceWorker.addEventListener('controllerchange', function () { if (had) toast('Có bản mới — đóng và mở lại app nhé', { icon: 'sparkle', ms: 4000 }); had = true; });
  });
}
window.__SE = { cards: function () { return CARDS; }, defs: DEFS, fill: FILL, compute: compute, ctxPids: ctxPids, assertUnique: assertUnique, boot: performance.now() - T0, st: st, calc: calc, PS: PS, composeCopy: C.composeCopy, STAGES: C.STAGES, ins: function () { return INS; }, measure: measureInsets, leadList: C.leadList, leadSet: function (a, id) { var s = topS(); leadSet(s || PAGE, a, id); } };
})();
