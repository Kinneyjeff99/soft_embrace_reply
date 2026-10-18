# Soft Embrace CS — Performance & Interaction-Smoothness Audit

Audited build: `dist/index.html` (130.1 KB raw / 36.2 KB gzip; JS 74.2 KB / 22.0 KB gz, CSS 27.7 KB / 6.6 KB gz, seed 21.2 KB / 5.8 KB gz). Sources: `src/app.js`, `src/app.css`, `src/index.src.html`, `build.py`. No app files were changed.

## Method

- Playwright 1.56 with Chromium (`/opt/pw-browsers/chromium`), headless. iPhone emulation: 393×852 and 430×932, DPR 3, `isMobile`, `hasTouch`, light and dark color schemes. The page was served from `http://127.0.0.1` so the context is secure and the async Clipboard API works.
- CPU throttling through CDP `Emulation.setCPUThrottlingRate`: **4×** (the main column) and **1×** (unthrottled, closer to an A16/A17 core on this host). Real iPhones fall somewhere between the two columns. Treat 4× as the worst case.
- What was collected:
  - `PerformanceObserver` for `paint`, `largest-contentful-paint`, `longtask`, `layout-shift` and `event` (Event Timing, `durationThreshold:16`).
  - Per-frame deltas from `requestAnimationFrame`. A dropped frame is counted as `round(Δ/16.67) − 1`.
  - Chrome trace (`devtools.timeline` + `.stack`) for each interaction: Layout and UpdateLayoutTree counts and milliseconds, **forced layouts with their JS stack**, and the `EventDispatch` duration (= handler cost).
  - A `MutationObserver` count of added nodes.
- `*{overflow-anchor:none}` was injected so the measurements behave like WebKit. Safari has **no scroll anchoring**, so Chromium would otherwise hide content jumps.
- Two datasets:
  - **base** is the shipped seed: 13 products, 21 flow entries, 744 DOM nodes.
  - **stress** has 208 products and 83 flow entries (4,569 nodes). The spec's §12.9 calls for a 200-product stress set.
- Interaction numbers are medians of 3 runs (base) or 2 runs (stress). Caveat: headless Chromium rasterizes in software, so GPU-bound effects (`backdrop-filter`) cost more here than on an iPhone GPU. Treat those as relative (A/B) evidence.

## 1. Measured numbers

### 1.1 Launch (median of 7 cold loads per row)

| Build · width · scheme · CPU | FP | FCP | LCP | DCL | load | JS boot (`__SE.boot`) | TBT (Σ long task − 50) | Long tasks (ms) | CLS | DOM nodes |
|---|---|---|---|---|---|---|---|---|---|---|
| base · 393 · light · 1× | 88 | 88 | 88 | 75 | 102 | **30** | 0 | — | 0 | 744 |
| base · 393 · light · 4× | 100 | 332 | 332 | 353 | 450 | 121 | 114 | 120, 70 | 0 | 744 |
| base · 393 · dark · 4× | 76 | 364 | 364 | 390 | 522 | 138 | 184 | 217, 110, 70, 60 | 0 | 744 |
| base · 430 · light · 4× | 96 | 324 | 324 | 353 | 498 | 119 | 167 | 131, 94, 76, 65, 51 | 0 | 744 |
| base · 430 · dark · 4× | 108 | 308 | 308 | 380 | 478 | 125 | 143 | 179, 85, 59 | 0 | 744 |
| stress · 393 · light · 4× | 112 | **164** | 164 | **907** | 1187 | 151 | **758** | 179, **506**, 96, 153, 206 | 0 | 4569 |
| stress · 393 · dark · 4× | 104 | 188 | 188 | 1028 | 1254 | 156 | 793 | 192, 374, 104, 171, 216 | 0 | 4569 |
| stress · 430 · light · 4× | 100 | 168 | 168 | 832 | 1125 | 174 | 687 | 165, 367, 90, 135, 180 | 0 | 4569 |
| stress · 430 · dark · 4× | 112 | 156 | 156 | 1009 | 1216 | 172 | 771 | 167, 337, 85, 145, 140 | 0 | 4569 |

What the launch numbers show:
- **No dark-mode flash.** The computed `html` background is `rgb(250,246,240)` in light mode and `rgb(21,17,14)` in dark mode from the very first paint, and load CLS is 0 in every configuration.
- No web fonts, so there is no font-swap shift.
- On base, FCP comes **after** the boot script, so the list paints together with the shell.
- On the stress build, FCP (164 ms) lands **~740 ms before DCL**. The parser yielded inside the large inline seed, so the shell (tab bar, VI/EN) painted **with empty tabs** before the list existed. See P2-7.
- The second load-time long task (70–110 ms at 4×, 337–521 ms on stress) is the `setTimeout(…,0)` that pre-renders the Flow and Order tabs and builds the search index (`app.js:960`). See P1-2.

### 1.2 Interactions — base dataset, 393×852, light (handler = trace `EventDispatch` of the click or input)

| Interaction | Handler 1× / 4× ms | Event→paint 4× ms (Event Timing) | Dropped frames 4× (worst frame) | Long tasks 4× | Layout / style ms 4× | Forced layouts (JS stack) | Nodes added |
|---|---|---|---|---|---|---|---|
| Tab Mẫu→Kịch bản | 2 / 6 | 80 | 3 (50 ms) | 0 | 3 / 28 | 0 | 1 |
| Tab Kịch bản→Đơn | 1 / 4 | 72 | 1 (33) | 0 | 3 / 28 | 0 | 2 |
| Tab Đơn→Mẫu | 1 / 3 | 64 | 1 (33) | 0 | 3 / 21 | 0 | 2 |
| Scroll Mẫu, touch fling 1,800 px | 0 | — | **0** (17) | 0 | 0 / 0 | 0 | 0 |
| **Copy product row (1st copy)** | **13 / 56** | **168** | **7 (133)** | 2 (max 88) | 43 / 49 | 6: `hap`, `renderFlow`×2, `renderOrder` | 23 |
| Copy product row (2nd copy) | 9 / 37 | 120 | 4 (83) | 1 (91) | 38 / 43 | 6 (same) | 23 |
| Copy flow row (no ctx change) | 3 / 11 | 56 | 1 (33) | 0 | 15 / 24 | 2: `hap` | 2 |
| Product sheet open (medium) | 12 / 40 | 96 | 3 (67) | 1 (61) | 28 / 35 | 1: `pushSheet` `offsetHeight` (19.7 ms @4×) | 4 |
| Sheet drag → large (30 touch moves) | — | 56 | **0** (17) | 0 | 1 / 50 (≈1.7 ms/move) | 0 in move handler | 0 |
| Sheet drag → medium | — | 56 | **0** (17) | 0 | 4 / 52 | 0 | 0 |
| Sheet drag-dismiss | — | 40 | **0** (17) | 0 | 6 / 40 | 1: `closeSheet` focus | 0 |
| Sheet segment Thông tin→Bảng size | 3 / 15 | 48 | 0 | 0 | 6 / 7 | 1: `rerender` scrollTop | 3 |
| Add to order (size chip in sheet) | 7 / 28 | 104 | 4 (67) | 2 (max 52) | 36 / 39 | 3: `renderFlow`×2, `renderOrder` | 21 |
| Copy in sheet (main button) | 8 / 38 | 112 | 4 (83) | 2 (max 64) | 32 / 34 | 6 | 22 |
| Settings sheet open (app scales behind) | 4 / 18 | 56 | 0 | 0 | 9 / 22 | 1: `pushSheet` | 3 |
| Long-press menu open | 2 / 10 | 72 | **2 (33) even at 1×** | 0 | 8 / 15 | 2: `hap`, `openMenu` rect | 3 |
| Search open (focus) | 3 / 14 | 48 | 0 | 0 | 6 / 23 | 1: `enterSearch` focus | 2 |
| Search, type 2 chars | 1 / 2 (+ rAF render) | 56 | 3 (33) | 1 (max 95) | **29** / 14 | 0 | 6 |
| Search close | 0 / 1 | 56 | 0 | 0 | 2 / 20 | 0 | 0 |
| Order line qty + | 3 / 10 | 56 | 0 | 0 | 8 / 5 | 1: `renderOrder` | 10 |
| Copy order (total bar) | 3 / 16 | 48 | 1 (33) | 0 | 20 / 32 | 2 | 14 → **CLS 0.094 at +1.25 s** |

The 430×932 viewport (light and dark) matched within noise: copy product 46–75 ms handler at 4×, sheet open 35 ms, copy order CLS 0.098.

### 1.3 Scaling — stress dataset (208 products), 393×852, 4×

| Interaction | Handler ms (1× / 4×) | Event→paint 4× | Dropped frames 4× (worst) | Style recalc 4× |
|---|---|---|---|---|
| Tab Mẫu→Kịch bản | 2 / 11 | **248** | **14 (183)** | **126 ms** |
| Tab Đơn→Mẫu | 1 / 3 | **260** | **13 (233)** | **145 ms** |
| Tab → Kịch bản after it was re-rendered while hidden | 0 / 2 | **360** | **22 (317)** | **244 ms** |
| Copy product row (1st) | 27 / **117** | **380** | **24 (333)** | 94 ms (+114 ms layout) |
| Copy in sheet | 14 / 123 | 304 | 17 (258) | 65 ms |
| Add to order | — / 75 | 268 | 14 (217) | 56 ms |
| Search close | 0 / 4 | 320 | 30 (275); long tasks 210/141 ms not attributed to style/layout (likely GC after repeated full re-renders) | 31 ms |
| Scroll fling 1,800 px | 0 | 36 | 1 (25) | 3 ms |

### 1.4 Targeted probes

| Probe | Result |
|---|---|
| **First copy → "Gần đây" chip row inserted above the list** | The tapped row moves **69 px** under the finger at scrollTop 0. At scrollTop 400 with WebKit-like no-anchoring it also moves **69 px** (Chromium's anchoring hides this: 0 px). Event Timing does **not** count it as CLS because of `hadRecentInput`, but the user sees it. |
| **content-visibility placeholder jump** (Kịch bản scrolled to 900, then a copy on Mẫu re-renders Kịch bản while it is hidden, then the user switches back) | Reference row jumps **+38 px** and scrollHeight changes 1822 → 1860. This reproduced in 4/4 runs. |
| Real section heights vs the `contain-intrinsic-size: 400px` placeholder | Mẫu: 115 / 239 / 864 px (stress: 12,564 px in **one** section). Kịch bản: 239 / 495 / 175 / 239 / 239 / 239 (stress: 559 / 2735 / 815 / 879 / 239 / 559). |
| **A/B: inactive tabs `content-visibility:hidden`** instead of `visibility:hidden` (stress, 4×, style ms) | Mẫu→Kịch bản **77 → 35**. Kịch bản→Mẫu **169 → 17**. Copy-product layout **96 → 37**. Switch after hidden re-render **112 → 34**. |
| A/B: per-row `content-visibility:auto` (stress) | Kịch bản→Mẫu style 169 → 35. Mẫu→Kịch bản 77 → 31. |
| A/B: `display:none` inactive tabs | Worse on show: 143 ms layout on Kịch bản→Mẫu. Rejected. |
| **A/B: long-press menu with vs without the full-screen `backdrop-filter` on `.mdim`** (4 runs each) | 1×: **3–8 dropped frames with blur, 0 without**. 4×: 2–7 vs 0–1. |
| localStorage footprint after the session | 1,186 bytes. Writes are debounced by 300 ms. No writes in hot paths. |

### 1.5 What is already good (measured)

- Scrolling: 0 dropped frames at 1× and 4× on base. There are no scroll listeners. The large-title or nav state uses an `IntersectionObserver` sentinel (`app.js:365-378`) with no layout reads.
- Sheet drag: the `pointermove` handler (`app.js:454-460`) only writes `transform`, with 0 forced layouts and 0 dropped frames. Velocity uses the last 100 ms of samples.
- Every animation is transform or opacity: sheet, dim, tab lozenge, segment thumb, seal and ring (WAAPI transform/opacity), and toast. Nothing animates `height`, `top`, `box-shadow` or `filter`.
- `touchstart` and `touchmove` are passive. `touch-action:none` is set only on the grabber (`app.css:184`). `touch-action:manipulation` is on controls and `-webkit-tap-highlight-color:transparent` is set. An empty passive `touchstart` enables `:active`.
- The body is fixed with `overscroll-behavior:none`, and each tab is its own scroller with `overscroll-behavior-y:contain`. There is no `100vh`; layout uses `inset:0` plus `env(safe-area-inset-*)`.
- `clipboard.writeText` is called synchronously inside the click (user gesture).
- The keyboard dock follows `visualViewport` through a transform inside rAF (`app.js:817-828`).

---

## 2. Findings (ranked)

### P0-1 — Copy feedback (seal) waits for two full tab re-renders
**Evidence.** `copyProduct` calls `setCtx(id)` **before** `copy()` (`app.js:528-529`). `setCtx` → `renderCtxBits` (`app.js:289-293`) → `renderFlow()` **and** `renderOrder()`. Those are full `innerHTML` rewrites of two hidden tabs plus the total bar, each with a `scrollTop` read and write that forces layout (`app.js:286-287`, `326-327`). `setCtxQuiet` (`app.js:339`) does the same through `addLine`. Measured on a product copy:
- 6 forced layouts.
- Handler **13 ms at 1×, 56 ms at 4×, 117 ms at 4× on stress**, compared with **3 / 11 / 21 ms** for a flow-row copy that doesn't touch ctx.
- 4–7 dropped frames at 4× (24 on stress). Event→paint 120–168 ms (380 ms on stress).

The spec budget is "Tap copy → visual feedback ≤ 16 ms (same frame)". At 120 Hz the frame budget is 8.3 ms, so 13 ms at 1× already misses 1–2 ProMotion frames. The work also runs even when the context did not change (the second copy of the same product: 37 ms at 4×).

**Fix** (`app.js`). Give feedback and do the clipboard write first, defer the rest, and don't re-render tabs the user can't see:
```js
// 1) copyProduct: copy first, context after paint
function copyProduct(id, w, btn, withGreet, l) {
  /* …build text/label as today… */
  copy(text, { btn: btn, label: label, lang: l, warn: …, rec: … });
  afterPaint(function () { setCtx(id); });
}
function afterPaint(fn) { requestAnimationFrame(function () { setTimeout(fn, 0); }); }

// 2) setCtx: no-op when nothing changed (only refresh the timestamp)
function setCtx(pid, size) {
  var c = ctx() || {};
  var n = { itemId: pid != null ? pid : c.itemId, size: size !== undefined ? size : c.size, at: Date.now() };
  if (pid != null && c.itemId !== pid && size === undefined) n.size = null;
  var same = c.itemId === n.itemId && c.size === n.size;
  st.ctx = n; save();
  if (!same) renderCtxBits();
}

// 3) renderCtxBits / setCtxQuiet: render only the visible tab, mark the others dirty
var dirty = { flow: false, order: false };
function renderCtxBits() {
  var c = $('#ctxchip'); if (c) { c.hidden = !ctx(); var b = c.querySelector('.tx'); if (b) b.textContent = 'Đang tư vấn: ' + ctxLabel(); }
  ['flow', 'order'].forEach(function (t) {
    if (!tabsReady[t]) return;
    if (tab === t) (t === 'flow' ? renderFlow : renderOrder)(); else dirty[t] = true;
  });
}
// in go(t), before toggling classes:
if (dirty[t]) { dirty[t] = false; (t === 'flow' ? renderFlow : renderOrder)(); }
```
In `copy()` (`app.js:194-209`), call `seal(o.btn)` and then `navigator.clipboard.writeText` **before** `hap()` and `toast()`. `hap()` forces a layout through `label.click()` (P2-1).

Expected result: the product-copy handler drops to about flow-row cost (≈3 ms at 1×), so the seal lands in the next frame.

### P0-2 — No service worker: a standalone launch goes to the network every time
**Evidence.** `build.py` writes only `index.html` and `manifest.webmanifest`. There is no `sw.js` and no `navigator.serviceWorker.register` anywhere (grep on `src/` and `dist/`). The spec (§11.1, §11.2-5) requires it. In iOS standalone mode, every cold launch (iOS evicts PWAs aggressively) revalidates `index.html` over the network. On cellular that means 0.3–2 s of splash or blank screen, and **offline the app does not open at all**. The in-page work at 1× is only ~30 ms (§1.1), so the network is the whole launch cost.

**Fix.** Emit `dist/sw.js` from `build.py` with a content-hash cache name, and register it after first paint.
```python
# build.py (after writing index.html)
import hashlib
ver = hashlib.sha1(raw).hexdigest()[:10]
(DIST / "sw.js").write_text("""const C='se-%s';const A=['./','./index.html','./manifest.webmanifest','./icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting();});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET')return;e.respondWith(caches.match(e.request,{ignoreSearch:true}).then(r=>r||fetch(e.request)));});""" % ver)
```
```js
// app.js boot, after the first render
if ('serviceWorker' in navigator) addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
```
`ignoreSearch` lets `start_url: ./?source=pwa` hit the cache. Add the "Có bản mới" toast on `controllerchange` as specified.

### P1-1 — Tab switch cost scales with list size (`visibility` toggling restyles the whole tab)
**Evidence.** `.tab{visibility:hidden}` / `.tab.on{visibility:visible}` (`app.css:76-77`, `app.js:352`). Because `visibility` is inherited, every row is restyled on each switch:
- Base: 21–28 ms of style at 4× and 1–3 dropped frames.
- Stress: **126–145 ms style, 13–14 dropped frames, 248–260 ms event→paint**. That rises to **244 ms / 22 drops** right after a hidden re-render.

A/B with `content-visibility:hidden` cut Kịch bản→Mẫu style from **169 to 17 ms** (§1.4).

**Fix** (`app.css:76-77`). Keep `visibility` as the fallback for iOS < 18:
```css
.tab{…;visibility:hidden}
.tab.on{visibility:visible;z-index:1}
@supports (content-visibility:hidden){
  .tab{visibility:visible}
  .tab:not(.on){content-visibility:hidden;pointer-events:none}
}
```
`content-visibility:hidden` keeps the subtree's layout cached, skips its style, layout and paint, and removes it from hit-testing and the accessibility tree. Verify that the tab's `scrollTop` is preserved on iOS 18 (it was in Chromium).

### P1-2 — Load-time second long task (pre-render of Flow, Order and the search index)
**Evidence.** `setTimeout(function(){ renderFlow(); renderOrder(); buildIndex(); }, 0)` (`app.js:960`) is one task: **70–110 ms at 4×** on base and **337–521 ms** on stress. It starts right after first paint, so the first tap or scroll in the first ~0.5 s waits for it.

**Fix.** One unit of work per task, and the index only when needed (`enterSearch` already calls `buildIndex` lazily):
```js
setTimeout(function () { if (!tabsReady.flow) renderFlow();
  setTimeout(function () { if (!tabsReady.order) renderOrder(); }, 0); }, 0);
```
With P1-1 the hidden tabs cost far less to render. With P1-5, render rows in chunks.

### P1-3 — First copy inserts "Gần đây" above the list: 69 px jump under the finger
**Evidence.** `commitRecent` → `renderRecents` → `insertAdjacentHTML('afterend', …)` above every section (`app.js:211-216`, `258`). It runs in the clipboard promise callback ~1 frame after the tap, so the seal animation plays on a button that has just moved **69 px**. Safari has no scroll anchoring, so the same 69 px jump happens when the list is scrolled (§1.4). It recurs after "Xoá danh sách Gần đây" (`app.js:913`). CLS does not count it because of `hadRecentInput`, but users see it.

**Fix.** Always render the recents block so its height is constant:
```js
function recentChips() {
  var body = st.recents.length ? st.recents.map(/* …as today… */).join('')
    : '<span class="chip ghost" aria-disabled="true">Bản đã chép sẽ hiện ở đây</span>';
  return '<div class="sec" id="recents">…<div class="chips">' + body + '</div></div>';
}
function renderRecents() { var r = $('#recents .chips'); if (r) r.innerHTML = /* chips html */; }
```
If you prefer to hide the block when it is empty, insert it only while Mẫu is not the visible tab, or compensate with `t.scrollTop += t.scrollHeight - h0` when `t.scrollTop > 0`. That compensation does not help at scrollTop 0, which is why the reserved block is the real fix.

### P1-4 — "Khách đã chuyển khoản?" card inserted at the top of Đơn 1.25 s after "Chép đơn": CLS 0.094
**Evidence.** `copyorder` → `done` → `setTimeout(renderOrder, 1250)` (`app.js:902`). The new `.ocard` (`app.js:300-302`) and the `.foot` line push the entire order form down by ~140 px. The layout-shift sources are `.swrow`, `.prevb` and `.foot`. CLS was **0.094 at 393 px and 0.098 at 430 px** in every run, while the user may be reading the preview.

**Fix.** Don't re-render the whole tab 1.25 s later. Either:
- show the thank-you action inside the fixed `#totbar` (swap the button label and action: "Chép lời cảm ơn" for 24 h), or
- render the card at the bottom of the form, or only on the next visit to the tab, using `dirty.order = true` from P0-1.

Drop the `setTimeout(renderOrder, 1250)`.

### P1-5 — `content-visibility` is applied at the wrong granularity and breaks on re-render
**Evidence.** `.sec{content-visibility:auto;contain-intrinsic-size:auto 400px}` (`app.css:85`). Real section heights range from 115 to 864 px (12,564 px on stress, where the whole product list is **one** section, so CV saves nothing there). Every `innerHTML` re-render (`renderFlow` and `renderMau`, which run on copy, language change, favorite and settings edits) creates new elements and loses the "auto" remembered sizes. Off-screen sections above the viewport fall back to 400 px, and the visible list jumps (**+38 px measured**, `scrollHeight` 1822 → 1860).

**Fix** (`app.css:85`, `app.js:247`, `263-288`):
```css
.sec{content-visibility:visible}                 /* small sections: no CV */
.chunk{content-visibility:auto;contain-intrinsic-size:auto 1200px} /* 20 rows × 60 px */
```
```js
function chunked(rows, html) { var out = ''; for (var i = 0; i < rows.length; i += 20) out += '<div class="chunk">' + rows.slice(i, i + 20).map(html).join('') + '</div>'; return out; }
// renderMau: '<div class="grp">' + chunked(PL, pRow) + '</div>'
```
Stop re-rendering lists that did not change (P0-1 dirty flags). When a list must refresh, patch the affected rows (`row.querySelector('.sub').textContent = …`) instead of replacing the tab.

### P1-6 — Long-press menu: full-screen `backdrop-filter` fading in drops frames
**Evidence.** `#menu .mdim{backdrop-filter:blur(12px);…;transition:opacity .2s}` (`app.css:282`) covers 393×852 pt. The blur must be recomputed on every frame of the opacity fade, plus `.mpanel` adds another `saturate(180%) blur(24px)` (`app.css:284`). A/B over 4 runs: **3–8 dropped frames at 1× with the blur, 0 without**. Headless rasterizes in software, so on device the cost is lower but not zero: a full-screen blur under an animated opacity is a known WebKit hotspot. The spec also caps simultaneous blurred layers at 3. With the menu open the count is nav + tab bar + search button + `.mdim` + `.mpanel` = 5.

**Fix:**
```css
#menu .mdim{-webkit-backdrop-filter:none;backdrop-filter:none;background:rgba(20,14,10,.30)}
@media(prefers-color-scheme:dark){#menu .mdim{background:rgba(0,0,0,.50)}}
```
If you want to keep the blur, don't animate the blur layer's opacity. Show it at full opacity and fade only a solid dim layer above it.

### P1-7 — Sheet open: forced layout plus two frames of added latency
**Evidence.** `pushSheet` reads `s.el.offsetHeight` right after `innerHTML` (`app.js:406`). That is a forced layout of the whole new sheet: **19.7 ms at 4×, ~10 ms at 1×**. It then waits a **double** rAF (`app.js:411`) before starting the transition, so the slide begins ~2 frames after the tap (33 ms at 60 Hz). Measured: 3 dropped frames and 96 ms event→paint at 4×. The height being measured is constant: `.sheet` is `top:calc(var(--safe-top) + 10px); bottom:0` (`app.css:181`), so it never depends on content.

**Fix:**
```js
var SAFE_TOP = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--safe-top')) || 0; // read once at boot (re-read on resize)
…
s.H = innerHeight - SAFE_TOP - 10;            // no layout read
s.offMed = s.fixed ? 0 : Math.max(0, Math.round(s.H - 0.6 * innerHeight));
…
requestAnimationFrame(function () { s.wrap.classList.add('in'); s.el.style.transform = 'translateY(' + s.off + 'px)'; behind(); });  // single rAF
```
The custom property `--safe-top` holds an `env()` expression, so if `getPropertyValue` returns it unresolved, measure it once with a probe element at boot instead. Apply the same idea to `closeSheet`: move `opener.focus()` (forced layout, `app.js:440`) into the `setTimeout` that runs after the slide-out.

### P1-8 — Search: results sit under the keyboard and rendering isn't coalesced
**Evidence:**
- `#search` padding-bottom is `calc(var(--safe-bottom) + 90px)` (`app.css:164`) and ignores the ~336 pt keyboard. `--kb` is set only on `#dock` (`app.js:823`). With "Xem tất cả" expanded, the last results can't be scrolled above the keyboard.
- `input` → `requestAnimationFrame(doSearch)` (`app.js:829`) schedules one render **per input event**. Vietnamese Telex/VNI composition fires several input events per visible character, so several full `#search.innerHTML` renders can run in one frame.
- Measured per 2 keystrokes at 4×: 29 ms of layout, 3 dropped frames, one 65–95 ms long task. At 1× it was 6 ms of layout and 0 drops.

**Fix:**
```js
// keyboard height on :root so any scroller can use it
document.documentElement.style.setProperty('--kb', kb + 'px');   // in the vv upd() rAF
var sq = 0; $('#q').addEventListener('input', function () { if (!sq) sq = requestAnimationFrame(function () { sq = 0; doSearch(); }); });
```
```css
#search{padding-bottom:calc(var(--kb,0px) + var(--safe-bottom) + 90px)}
#search{contain:strict}  /* a fixed-size scroller: keeps result layout local */
```

### P2-1 — `hap()` forces a layout and dispatches nested events on every copy, drag snap and menu
`h.parentNode.click()` on the hidden `<label><input switch>` (`app.js:168`) is a forced layout (it appears in the trace stack as `hap`, 1–3 ms at 4×). It also dispatches 2 nested `click` events and 1 `input`/`change` that run through the document-level delegated handlers. `navigator.vibrate(8)` is also called a second time even when the switch path ran. Fix: call it **after** `clipboard.writeText`, and remove the duplicate vibrate:
```js
function hap() { try { var h = document.getElementById('hap'); if (h) h.parentNode.click(); else if (navigator.vibrate) navigator.vibrate(8); } catch (e) {} }
```

### P2-2 — `renderFlow` and `renderOrder` read and write `scrollTop` around `innerHTML`, forcing 2 layouts each
`keep = t.scrollTop; t.innerHTML = h; t.scrollTop = keep;` (`app.js:286-287`, `326-327`, `rerender` at `417-419`). The browser already preserves `scrollTop` when the content stays at least as tall. Drop the write, or do it only if `t.scrollTop !== keep`, read inside the same rAF. Once P0-1, P1-3 and P1-5 are in, most of these calls go away.

### P2-3 — The `IntersectionObserver` keeps observing detached sentinels
`observe()` (`app.js:377`) calls `io.observe` on every `.sent` after each re-render but never unobserves the old ones. Observations accumulate, one per copy, add or language change. A detached sentinel reports `isIntersecting:false` with `top:0 < navH`, which could flip `scrolled[t]` to true for a frame. No flicker was observed in Chromium (40-frame probe), so this is latent. Fix: `io.disconnect()` at the top of `observe()` and re-observe the three current sentinels, or keep sentinels outside the re-rendered `innerHTML`.

### P2-4 — The row press highlight turns on at `pointerdown`, so it flashes on every scroll start
`r.classList.add('press')` happens immediately (`app.js:675`) and is removed after 10 px of movement. Every scroll gesture that starts on a row flashes the highlight. Native iOS delays the highlight by about 70–100 ms. Fix:
```js
var pressT; … pressT = setTimeout(function () { if (pressRow) pressRow.classList.add('press'); }, 70);  // clear in move/up
```

### P2-5 — Up to 4–5 simultaneous `backdrop-filter` layers on the Đơn tab
Nav bar (`app.css:59`), tab bar (`154`), search button (`161`) and total bar (`254`) give 4 blurred layers, and a toast (`271`) makes 5, all `saturate(180%) blur(20–24px)` re-sampled on every scroll frame. The spec says "never more than 3". Scrolling measured 0 drops, but on device this costs GPU and battery. Make `#totbar` opaque (`background:var(--bg-cell)`) or drop its blur.

### P2-6 — Lists are re-rendered when they did not change
- `toggleFav` → full `renderMau()` (`app.js:665`).
- Settings typing → `renderMau` + `renderFlow` + `renderOrder` every 400 ms (`app.js:781`).
- `setLang` → both tabs plus open sheets (`app.js:391-393`).
- Every qty or size tap → full `renderOrder` + `#totbar.innerHTML` (8–16 ms at 4×, `app.js:892-893`).

Use the dirty-flag pattern from P0-1 for hidden tabs. For qty, patch `.v`, `.sub`, `.pr` and `#totbar .tv` in place (as `softTotals()` already does at `app.js:951`).

### P2-7 — The inline seed sits between the shell and the script, so the parser can paint an empty shell
`<script type="application/json" id="seed">` comes after the full `#app` markup (`index.src.html:50-80`). On the stress build, FCP came 740 ms **before** DCL: the tab bar and VI/EN painted with empty tabs, then the list popped in. Base is not affected today (FCP is after boot), but this grows with the catalogue. Fix: move the seed `<script type="application/json">` into `<head>` (after `<style>`). Optionally add `<html class="boot">` with `.boot main{visibility:hidden}` and remove the class at the end of the synchronous boot.

### P2-8 — `--ease-spring: linear(…)` has no fallback
`linear()` needs iOS 17.2+. On older WebKit, every `transition` that uses `var(--ease-spring)` is invalid at computed-value time, so it has **no transition at all**: `.cb` press, `.tile`, `.chip`, `.btn`, `.toast` and `.mpanel` (`app.css:26`, `105`, `114`, `121`, `138`, `271`, `284`). Fix: `--ease-spring: cubic-bezier(.34,1.56,.64,1);` in `:root`, and override it with the `linear()` value inside `@supports (transition-timing-function: linear(0, 1)) { :root{ --ease-spring: linear(…) } }`.

### P2-9 — Focus inside a sheet snaps the detent after the keyboard has started
`focusin` → `setDetent(s,'l')` (`app.js:477-479`). The sheet slides up while iOS animates the keyboard and may scroll the visual viewport, which shows as a brief double motion. The spec (§11.6) asks to snap **before** `focus()` in the same tap handler. Fix: in the click delegation for `[data-fill]` / `.fld` targets inside a sheet, call `setDetent(s,'l')` before the element receives focus. Alternatively, listen to `pointerdown` on inputs and snap there.

### P2-10 — The JS/CSS minifier is minimal
`min_js` only strips comment lines (`build.py:15-22`). JS is 74.2 KB raw, compared with the spec's 25 KB minified budget. CSS is 27.7 KB raw against 14 KB. The total of 36.2 KB gzip is still under the 45 KB budget, and parse cost is small (boot is 30 ms at 1×), so this is low priority. A real minifier (for example `esbuild --minify` as a build-only tool) would bring JS to ~35 KB raw.

### P2-11 — iOS launch and status-bar details to verify
- The splash images are light-only (`index.src.html:17-18`), so dark-mode users see cream, then dark. Try adding `(prefers-color-scheme: dark)` variants to the `media` query of additional `apple-touch-startup-image` links.
- `black-translucent` (`index.src.html:11`) renders white status-bar glyphs on some iOS versions, which would be invisible on cream. This is the spec's QA gate.
- `.app.behind` toggles `overflow:hidden` and `border-radius` at the start of the scale transition (`app.css:57`). That costs one full-app repaint. The scaled layer also contains 3 backdrop-filter layers that WebKit must re-sample for 380 ms. Settings-open measured 0 drops in Chromium; check on device.

---

## 3. Expected impact of the P0/P1 fixes (from the A/B and breakdown data)

| Metric (4× CPU) | Now (base / stress) | After |
|---|---|---|
| Copy product handler | 56 / 117 ms | ≈ 11 / 21 ms (flow-row path) |
| Tab switch style recalc | 21–28 / 126–169 ms | ≈ 14–27 / 17–35 ms |
| Visible jump on first copy | 69 px | 0 |
| CLS after "Chép đơn" | 0.094 | 0 |
| Content-visibility jump | 38 px | 0 |
| Menu open dropped frames (1×) | 3–8 | 0 |
| Sheet open: first moving frame | +2 frames + 10–20 ms forced layout | next frame, no forced layout |
| Cold standalone launch | network-bound; fails offline | from cache |

## 4. Real-device checklist (iPhone 14 Pro 393×852 and 15 Pro Max 430×932, Safari and Home Screen app)

Use Safari Web Inspector → Timelines, with Frames + JavaScript & Events + Layout & Rendering, and ProMotion on.

1. **Cold launch, standalone, airplane mode** (after P0-2): the app opens from cache. Online, measure the time from tap to first list paint; the target is < 300 ms.
2. **Dark mode launch:** no cream flash after the splash (beyond the light splash itself). Status-bar glyphs are readable in both modes.
3. **Copy seal:** tap a product's copy button 10× quickly. In Timelines, every tap's first frame with `.copied` is ≤ 8.3 ms after the touch end. The row does **not** move on the first copy (clear "Gần đây" in Settings first).
4. **Paste into Instagram DM** after each copy type (row, sheet, recent chip, menu "Chép bản English", order). Check that the text matches and that the fallback sheet appears only when the clipboard is denied.
5. **Tab switching:** Mẫu ↔ Kịch bản ↔ Đơn, 20 switches. No frame > 16.7 ms in Frames. Scroll positions are kept per tab. Also test with the 200-product stress seed.
6. **Kịch bản jump:** scroll Kịch bản halfway, go to Mẫu, copy a product, then come back. The visible row must not shift.
7. **Sheet:** open a product sheet, drag the grabber slowly and fast, snap medium ↔ large, and fling to dismiss. Expect 120 fps during the drag and no rubber-band of the page behind. Test the settings sheet as well (the app scales behind it).
8. **Long-press menu:** hold a row and check the blur fade for dropped frames in Frames (both devices).
9. **Search with the keyboard:** tap search. The keyboard opens in the same gesture, and the dock rides on top of the keyboard without lag. Type in Vietnamese Telex ("ao so mi"): no stutter. Expand "Xem tất cả" and confirm the last result can be scrolled above the keyboard. Dismiss the keyboard by scrolling.
10. **Order tab:** add 5 lines, change qty and sizes, toggle ship options, then "Chép đơn". Nothing in the form moves afterwards (no shift at +1.25 s).
11. **Scroll a long list** (stress seed) with fast flings and edge rubber-banding. The nav material appears or disappears at the title without flicker, and the tab bar blur shows no frame drops.
12. **Older iOS (16 / 17.0–17.1, if available):** press animations still animate (P2-8), and tabs still hide correctly without `content-visibility`.
13. **Rotation and lock/unlock** while a sheet is open, and **pagehide → relaunch** within 30 min: the tab is restored and the draft persists.
