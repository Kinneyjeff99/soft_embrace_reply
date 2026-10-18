# Soft Embrace CS — Independent Design Audit (HIG + brand)

Scope: built app in `src/` (app.css, app.js, index.src.html, data.json) against `docs/design-spec.md`, using every screenshot in `shots/` (393 × 852 and 430 × 932, light and dark).
Line references are `file:line` in `src/`. Screenshot references are filenames in `shots/`.
Priority: **P0** means it can send the wrong thing to a customer, or it breaks a top-5 task. **P1** means visible HIG or brand breakage, or an extra tap or a block on a top task. **P2** means polish.

---

## P0: the wrong thing gets sent, or a top task breaks

### P0-1 The nav language control does not show the active language at launch, and it can show VI while the app copies EN
- **Screens:** Mẫu, Kịch bản and Đơn at launch. Evidence: `393-01-mau.png`, `430-01-mau.png` and `393-07-flow.png` show the VI and EN labels on the bare track with no thumb. The thumb only appears after the first switch (`393-24`).
- **Cause:**
  - `app.css:68` `.seg .th` has no `width`, and `index.src.html:56` gives only `--n:2`, so the thumb is 0 px wide.
  - `index.src.html:56` hard-codes `aria-pressed="true"` on VI. If Settings › Ngôn ngữ mặc định = English, `lang` starts as `'en'` (`app.js:34`) but the nav still marks VI as selected. `setLang` (`app.js:386`) only runs on a change.
- **Fix:**
  ```css
  #lang .th{width:calc((100% - 4px)/2)}
  ```
  ```js
  // boot, after go(tab,true) (app.js:956)
  $$('#lang button').forEach(function(b){b.setAttribute('aria-pressed', b.dataset.v===lang);}); segThumb($('#lang'));
  ```
  Also tint the selected label (`.seg.lang button[aria-pressed=true]{color:var(--accent)}`) so VI and EN differ by more than 500 vs 600 weight.

### P0-2 Placeholder "Set" texts can be copied in one tap and then live in Gần đây and Search
- **Screens:** Mẫu (Set section), Kịch bản step 5, Search. Evidence: `393-12-set-copy-warning.png` and `430-12-set-copy-warning.png` show the seal ✓ and "Đã chép · Set 1 · VI" with the sub-line "Chưa xác nhận — câu giữ chỗ". After that, the "Set 1" chip appears in Gần đây (`393-12`) and in the search recents (`393-20`). The clipboard now holds "Chưa xác nhận — thay bằng câu thật".
- **Cause:**
  - `app.js:42` seeds 3 placeholder sets.
  - `copyEntry` (`app.js:700`) and `msgcopy` (`app.js:880`) copy anyway and only add a toast sub-line. A toast is the wrong safeguard, because she leaves the app right after the seal.
  - T3, the set question, therefore cannot be done at all, and the Set section takes about 200 pt above every product on the home screen.
- **Fix:**
  1. Never copy a placeholder. In `copyEntry` and `msgcopy`, add `if (isPh(e)) { openSettings(['main','list:s','edit:f:'+e.id]); return; }`.
  2. In `fRow`, render placeholder rows with the pencil button (`data-act="cf"`, `ic('pencil')`), not `cbtn`.
  3. In `renderMau` (`app.js:265`), hide placeholder sets: `sets = sets.filter(function(e){return !isPh(e);})`, and drop the "Set" section when it is empty. Add a one-line footer to Tất cả mẫu: "Chưa có set nào — thêm trong Cài đặt nhé."
  4. Better still, derive real sets from the data. The Ivory Dot Blouse and Ivory Dot Midi Skirt already form the spec's "Set Ivory Dot". Give each set a combined price (`[items]`, `[price]`) as §2.2 specifies.
  5. Purge `ph` entries from `st.recents` on load.

### P0-3 The greeting tiles silently append another product's info from a stale context
- **Screens:** Mẫu › Lời chào; Gần đây chips. Evidence: `393-12` (the "Khách mới" tile sealed, no product named anywhere), `393-20` (the "Khách mới" recent holds the full greeting plus product text).
- **Cause:**
  - In the data, `open-first` and `open-returning` end with `{{itemInfo}}`.
  - `tile()` (`app.js:259`) shows only "Lần đầu ghé", but `copyEntry` resolves `{{itemInfo}}` from `ctx()` (`app.js:91`). That context is whatever product she touched in the last 20 minutes, possibly for a different customer in another DM.
  - The toast only says "Khách mới". The Đang tư vấn chip appears only on Kịch bản, not on Mẫu where the tiles are.
  - With no context, the tile opens a fill sheet instead of copying, so T1 grows from 2 taps to 3–4.
- **Fix:**
  - Make the item explicit on the tile. Subtitle: `ctx() ? 'kèm ' + pname(PM[ctx().itemId]) : 'Chọn mẫu…'`. Toast label: `'Lời chào + ' + pname(p)`.
  - With no context, open `openPicker('pick', function(pid){ copyProduct(pid,'desc',null,true); })`. That makes 2 taps, and the copy runs inside the pick tap.
  - Shorten the context lifetime for greeting use to 5 min: `ctxFresh = Date.now()-c.at < 5*60000`.
  - Show the same `ctxChipHtml()` under the Mẫu large title so she always sees what will be auto-filled.

### P0-4 Product info marked as truncated ("Cần kiểm tra") still copies in one tap
- **Screens:** Mẫu rows, product sheet. Evidence:
  - `393-03-copy-seal.png`: Lace Top sealed; toast "Cần kiểm tra: bản này có thể bị cắt".
  - `393-04` and `393-28`: the preview ends "Size: S, M, L..." and "Size: S, M...".
  - 6 of 13 products carry the badge (`393-01`, `393-02`).
- **Cause:** `copyProduct` (`app.js:529`) only passes `warn`. The customer receives a message that ends in "...".
- **Fix:**
  - In `copyProduct`, add `if (ptrunc(p,w,l)) { openProduct(id); toast('Đoạn này bị cắt ở sheet gốc — sửa trước khi gửi nhé', {bad:true}); return; }`. The sheet then shows the callout plus a "Sửa nội dung" text button (`openSettings(['main','list:p','edit:p:'+id])`).
  - In `pRow`, swap the copy glyph for the pencil while truncated.
  - Real fix: re-import the full texts from the CS Flow sheet. Until then the app must refuse, not warn.

---

## P1: HIG or brand breakage, or friction in the top-5 tasks

### P1-1 Wrong-language fallback copies silently
- **Where:** `entryText` (`app.js:69-71`) falls back to the other language, and `copyEntry` (`app.js:700`) copies it with only a toast sub-line. Example: `thanks-generic` has `en: ''`, so in EN mode the VI "Cảm ơn bạn đã chọn Soft Embrace…" gets copied.
- **Fix:** When `et.fell` and the user is not in the Message sheet, open `openMessage(id)` instead of copying (the sheet already shows the "Chưa có bản EN" note, `app.js:543`). In the sheet, label the button "Chép bản VI", so choosing the other language is a deliberate act.

### P1-2 The "Đã chép" toast fires before the clipboard write resolves
- **Where:** `copy()` (`app.js:197-199`). On a rejected write, she has usually already switched to Instagram and pastes the previous clipboard, which is another customer's text. `393-33` shows the rollback arriving after the success state.
- **Fix:** Keep the optimistic seal (it costs 1 frame), but post the toast in `ok()`: move `toast(...)` into `var ok = function(){ toast(...); ... }`. `writeText` resolves in under 1 frame on iOS, so the spec's "same frame" feedback is still met by the seal.

### P1-3 Gần đây and Search re-copy stale snapshots (old orders, old context fills)
- **Where:** `commitRecent` stores the resolved `text` (`app.js:213`), and `rcopy` (`app.js:854`) re-sends it.
  - "Đơn 1,745,000 VND · EN" and "Đơn 1.745.000đ" sit in recents (`393-20`, `393-24`) and are one tap away from being sent to the next customer.
  - Edited texts are also never refreshed.
- **Fix:**
  - Do not record orders: in `copyorder`, drop `rec`.
  - For entries, store a key, not text: `{k, label, lang, ref:{kind,id,w}}`, and rebuild the text on tap through `copyProduct` or `copyEntry`, so placeholder, truncation and language guards apply.
  - Add the item to the label when the text came from context, e.g. "Vừa size · M".

### P1-4 "Kèm thông tin chuyển khoản" is ON by default but appends nothing when no bank is set; no QR flow exists
- **Where:** `orderText` (`app.js:148`) requires `b.no`. Settings shows "Chuyển khoản · Chưa có" (`393-25`) while the switch reads on (`393-13`, `393-16`). The spec's "Gửi QR" chip and QR sheet (§4.5, T4) are not built (no `qr` code anywhere). The "QR code" attach tag on Chốt đơn is the only trace.
- **Fix:**
  - When `!st.set.bank.no`, render the row as "Thêm STK để kèm vào đơn ›", which opens Settings › Chuyển khoản, and force the switch off.
  - After a successful `copyorder`, set the toast `sub:'Nhớ gửi mã QR'` until the QR sheet is built.

### P1-5 The toast covers, and blocks taps on, primary controls
- **Evidence:**
  - Đơn: the toast sits exactly over the total bar and "Chép đơn" (`393-15`, `393-17`, `393-19`).
  - Message sheet: the toast covers the Size 1 and Size 2 chips (`393-10`, `430-10`).
  - Product sheet: the toast covers the note callout (`393-04`, `430-04`).
- **Cause:** `#toast` bottom equals the total-bar zone (`app.css:268`), and `.toast{pointer-events:auto}` (`app.css:271`) swallows taps on "Chép đơn".
- **Fix:**
  ```css
  .toast{pointer-events:none}.toast .undo{pointer-events:auto}
  body.on-order:not(.sheet-open):not(.searching) #toast{bottom:calc(var(--tab-bottom) + var(--tab-h) + 8px + 64px + 8px)}
  body.sheet-open #toast{bottom:calc(var(--safe-bottom) + 12px + 50px + 8px + 4px)} /* hug the action bar, not the content */
  ```
  In `go()`, add `document.body.classList.toggle('on-order', t==='order')`. In `pushSheet`, clear any toast older than 300 ms (`toastEl.innerHTML=''`). `393-10` and `393-28` show a previous screen's toast ("Chính sách đổi trả", "Lace Top · EN") over an unrelated sheet.

### P1-6 The fill controls are below the fold in the Message sheet at the medium detent
- **Evidence:** `393-10` and `430-10` show the Size 1 and Size 2 chip rows clipped under the disabled "Điền 2 chỗ nữa" button. T6 needs a drag or scroll before the first tap.
- **Fix:** In `openMessage` (`app.js:534`), use `det: keysOf(entryText(FM[id],lang).text).length ? 'l' : 'm'`. Alternatively, render the `Điền nhanh` block above the paper card and cap the card with `#mprev{max-height:34vh;overflow:auto}`. The tokens in the preview already scroll to their control.

### P1-7 The product sheet hides its own shortcut and clips its callout
- **Evidence:** `393-04`, `393-28` and `430-04`. The "Cần kiểm tra" callout is cut mid-sentence by the action bar, and the "Thêm vào đơn" size chips are entirely below the fold at the medium detent. At the large detent, about 55% of the sheet is empty (`393-06`, `430-32`).
- **Fix:**
  ```css
  .sheet .shb .paper{max-height:min(38vh,320px);overflow:auto}
  ```
  Move the "Thêm vào đơn" row into `.shf` above the buttons (`.shf{flex-direction:column}` with an inner row for the buttons), so the chips sit in the thumb zone as §1.1 Reachability requires.

### P1-8 The nav bar does not switch to its scrolled material after the Đơn tab re-renders
- **Evidence:** In `393-15`, the large title "Đơn hàng" sits in the status-bar and Dynamic Island band (y ≈ 25–55 pt) on a transparent bar, and the "Món" header collides with the "Đơn mới" button.
- **Cause:** `renderOrder` replaces the whole tab `innerHTML`, sentinel included (`app.js:299, 326-327`). The scrolled flag then depends on a fresh IntersectionObserver entry for a node that never crossed the threshold.
- **Fix:** Render the title and sentinel once, then render only a body container: `t.innerHTML = '<h1 class="lt">Đơn hàng</h1><div class="sent" data-tab="order"></div><div id="order-body"></div>'` on first run, and afterwards `$('#order-body').innerHTML = h`. Apply the same to `renderFlow` (`app.js:286-287`).

### P1-9 The success state turns green, which is off-palette
- **Evidence:** `393-06` ("Chép bảng size" turns forest green), `393-17` and `393-19` ("Đã chép" on the total bar).
- **Cause:** `app.css:144` `.btn.copied{background:var(--success);color:#fff}`. The only accent is Rosewood (§0). The seal, the brand's signature moment, should carry the confirmation.
- **Fix:**
  ```css
  .btn.copied{background:var(--accent-pressed);color:var(--on-accent)}
  ```
  Swap the icon to `i-check` for 1.2 s (the `l1`/`l2` crossfade already exists for the total bar; reuse it in `.shf .btn`).

### P1-10 The language state is invisible at the point of copying
- **Evidence:** In EN mode (`393-27`), nothing on the rows or copy buttons says EN. Only the 76 pt control in the top corner does. Spec T8 asks that "copy buttons show EN".
- **Fix:**
  ```css
  body.lang-en .cb::after{content:"EN";position:absolute;right:-4px;bottom:-4px;font:600 9px/14px var(--font-ui);padding:0 4px;border-radius:7px;background:var(--accent);color:var(--on-accent)}
  ```
  Toggle `body.lang-en` in `setLang` and at boot.

### P1-11 Two spec-mandated gestures are missing (swipe actions)
- **Where:** No swipe code exists (grep `swipe` returns 0 hits). The T2 power path ("Size" on a left swipe) and swipe-to-delete on order lines are absent. Deletion needs tap → expand → "Xoá" (`393-15`).
- **Fix:** Implement §5.14 for `.row[data-menu^="p:"]` (actions "Size" and "Đơn") and `.lrow` ("Xoá"), with a direction lock at 10 pt (|dx| > |dy| × 1.2), translating `.row` content only.

---

## P2: polish, consistency, brand finish

1. **Gần đây is misaligned, and the first chip is flush to the screen edge.** In `393-12`, `393-24` and `430-12`, the "Set 1" chip sits at x = 0 and the "Gần đây" header is 16 pt left of every other header.
   - Cause: `scroll-snap-align:start` with no scroll padding, and an inline `padding-left:var(--margin)` (`app.js:254`).
   - Fix: add `.chips{scroll-padding-inline:var(--margin)}` and delete `padding-left:var(--margin)` from the inline style in `recentChips()`.
2. **The nav language control is not on the content grid.** It sits 8 pt from the edge at 393 and 12 pt at 430, while the content margin is 16 or 20 pt (`393-01`, `430-01`).
   - Fix: `#nav .bar{padding:0 var(--margin) 0 calc(var(--margin) - 8px)}` (`app.css:61`). The leading glyph keeps its optical 8 pt; the bordered control aligns to the margin.
3. **The language segment hit width is about 40 pt (below 44).** `.seg.lang` is 76 wide, so each segment is 36 wide plus a 2 px `::after` (`app.css:69,72-73`).
   - Fix: `.seg.lang{width:88px}` or `.seg.lang button::after{inset:-6px -4px}`. That costs nothing visually at 393.
4. **Product prices get truncated before the color does.** `393-02` shows "Trắng kem · 380.00…".
   - Fix: in `pRow`, render price first, `<span class="num" style="flex:none">380.000đ</span> · <span class="st2">Trắng kem</span>`, so the price never ellipsizes.
5. **Color is said twice on variant rows.** "Soft Halter Top · Trắng / Trắng · 360.000đ" (`393-01`).
   - Fix: when `p.variant`, the subtitle shows only the swatch and price (`app.js:227`).
6. **Six red "Cần kiểm tra" pills on the home screen** read as an error list and fight the Romantic Calm tone (`393-01`, `393-02`, `430-29`). After P0-4, demote them to a 13 pt `--label-2` pencil glyph in place of the copy glyph, and keep one summary footer: "6 mẫu cần sửa nội dung ›".
7. **Attach tags clutter Kịch bản and mix languages:** "Thông tin sản phẩm & giá", "Size chart", "QR code", and "Giá ship" repeating the title (`393-07`, `393-08`, `430-30`).
   - Fix: replace the pill (`app.js:244`) with `ic('clip','s13')` in `--label-3` after the title. The full text already appears in the sheet ("Nhớ đính kèm: …").
8. **A reminder uses the success glyph.** "Nhớ gửi đính kèm" shows `checkmark.circle.fill` (`393-09`).
   - Fix: add `o.icon` support in `toast()` (`app.js:159`) and pass `'clip'` from the `att` action (`app.js:853`) and `copyEntry` (`app.js:696`).
9. **The thank-card primary label wraps to 2 lines** at both sizes and in dark mode (`393-18`, `393-31`).
   - Fix: `.ocard .btn{white-space:nowrap;font-size:15px}`, or the label "Chép cảm ơn". "Đơn mới" also appears twice (nav plus card); keep the card version and hide the nav one while the card shows.
10. **The ship segmented control is cramped.** "Trả shipper" touches the thumb edges at 393 (`393-13`).
    - Fix: `.seg.full[style*="--n:4"] button{font-size:13px}`, or the label "Shipper thu".
11. **The picker's separators are inset 64 with no disc** (`393-14`, `430-14`). The same applies to `.lrow` after the plain suggestion row.
    - Fix: `#plist .row+.row::after{left:16px}`.
12. **Search shows two ✕ buttons** (clear plus close) even when the field is empty (`393-20`, `393-22`).
    - Fix: `.sfield:has(input:placeholder-shown) [data-act=qclear]{display:none}`.
13. **The context menu lacks the group divider before "Thêm vào đơn"** (`393-23`). The `it[3]` flag is set but never used (`app.js:627,636`).
    - Fix: `'<button class="mi' + (it[3] ? ' dv' : '') + '"…'`.
14. **Dark mode: the Đen/Noir swatch dots are invisible.** The `#1E1B1A` dot on a `#221C18` cell with a 0.14 ring shows as an empty ring (`393-29`, `430-29`).
    - Fix: `@media(prefers-color-scheme:dark){.dot{box-shadow:0 0 0 1px rgba(243,236,227,.35)}}`.
15. **The order-sent footer line renders under the tab bar** (`393-18`, `430-18`). Move it into `#totbar` as a second line, or float it above the bar, per §9.2 ("Footnote under the total bar").
16. **Microcopy drifts from §9.2:**
    - "Khách cũ / Đã từng ghé" should be "Khách quen / Đã từng mua" (`app.js:261, 267`). "Khách cũ" reads as "former customer", which is cooler than the brand.
    - The truncation callout "Hãy sửa lại trong Cài đặt trước khi gửi." is imperative and runs over 8 words. Use: "Đoạn này bị cắt ở sheet gốc — sửa trước khi gửi nhé."
17. **The emoji discs are the least on-brand surface.** The ♬ text glyph for Noir Dotty Top, ☕ for a skirt, 🧺 and 🫐 read as random rather than vintage (`393-02`). They are data, not code. A spec-compatible option: tint `--bg-disc` with the product swatch at 25% (`background:color-mix(in srgb, var(--sw) 25%, var(--bg-disc))`) so each disc carries the garment's color story.

---

## What already works well (keep it)

- **The seal-on-copy moment works.** The Rosewood disc with a check, the 1.4 s hold and the paired toast "Đã chép · Lace Top · VI" give clear confirmation that also feels like the brand (`393-03`, `430-12`).
- **The palette and type are right.** Cream (#F3EDE4) behind warm-white cells, the serif New York large titles and the italic greeting "Chiều dịu dàng, Embrace" give the film-like, letter-like warmth the brand asks for in both light and dark (`393-01`, `393-29`). Dark mode uses warm blacks, not #000.
- **The placeholder fill sheet behaves as specified.** Inline dashed tokens, "Điền 2 chỗ nữa", chips that fill and recompute live, and a WYSIWYG preview that includes the expanded size chart (`393-10`, `393-11`).
- **T4 meets the spec with context.** Đơn tab → "Thêm … · M (gợi ý)" → "Chép đơn" is 3 taps, the floating total bar sits in the thumb zone, and the VI and EN money formats are correct (`393-13`, `393-19`).
- **The shell is solid.** Floating tab capsule plus a separate search circle, a correct Dynamic Island inset (nav at y 59–103), 44 pt chip and stepper targets, and a manual-copy fallback sheet with the text pre-selected (`393-33`).
