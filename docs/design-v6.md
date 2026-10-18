# Soft Embrace Reply — Design v6: "Khách đang hỏi gì, tin nằm ngay đó"

Status: **decided**. v6 redesigns the whole **Trả lời nhanh** area (the 5 stages, the greeting and message sheets as used from stages, Tạo đơn, Check out, the product picker). It is built **on top of v5** (`docs/design-v5.md`). Tokens (§2), radius and avatar system (§2.4), type (§2.5), spacing (§2.6), motion (§2.7), control grammar (§3), safe-area and `--inset-*` / `--bar-*` strategy (§4), floating nav and the "Đơn" button (§6.2), product sheet (§7.7), opening-line picker (§7.8), set sheet (§7.9) and every component in §8 stay exactly as v5 says. Where v6 replaces a v5 section, §0.2 says so explicitly and why.

Sources read: `docs/design-v5.md`, `docs/design-v2.md`, `docs/v2-report.md` (Round 3–4), `src/app.js`, `src/compose.js` (STAGES, composeCopy), `src/data.json` (flow, orderTemplate, leadIns, setSuggestions, 20 products), `src/app.css`, `src/index.src.html`, `tests/ui/round4.mjs`. Screens: the founder's iPhone 15 Pro Max dark screenshots 6.webp (Khách mới sheet), 7.webp (Tạo đơn), 8.webp (Tư vấn size).

Scale: pt = CSS px. Her screenshots are 923 px wide previews of a 430 pt screen (2.147 px = 1 pt).

---

## 0. The decisions on one page

### 0.1 Founder feedback → decision

| # | Feedback | Decision |
|---|---|---|
| 1 | Tapping produces duplicate UI (the "Mẫu" chip group appears twice) | **Root cause found** (§1): the greeting sheet renders one fill row per placeholder in the template *and* an extra optional product row; once a product is chosen, the template gains `{{itemInfo}}`, so the product row is rendered twice. Fixed by a hotfix (P0) and made impossible by design: products are no longer chosen inside message sheets at all. Plus three more duplicate sources (double-open of sheets, double-add in the picker, `+S` repeat taps) and a binding **idempotent-render contract** (§9). |
| 2 | Tạo đơn: "I don't understand what's happening, I fill many steps before I reach the message" | **Message first.** Tạo đơn opens with the order message "Dạ vậy đơn của bạn 🌷 …" at the top, already filled from what the customer asked about; empty parts show as `[món]` / `[size]` placeholders. Below it: the items (size + qty inline), one compact shipping row, receiver info collapsed. Total + "Chép đơn" in a solid dock that never overlaps the nav. The 4-product "Mẫu gần đây" list with S/M/L pills is deleted; "＋ Thêm món" opens one picker sheet where photo and size are chosen in the same step. |
| 3 | Size chart is critical, but "3 chips + Mẫu khác…" is shallow and hard to pick | **The size chart card shows the chart.** Products come from the shared "Khách đang hỏi" context. When nothing is chosen, the card itself shows a 5-cell photo strip (4 smart suggestions + "Tất cả"); one tap fills the chart. With one product chosen, the strip suggests what is usually bought with it (from `setSuggestions`), so **Lace Top + Lace Skirt = 3 taps** (photo, photo, Chép) and both charts arrive in **one message, labelled by product**. |
| 4 | Audit and redesign the whole quick-message flow | **One persistent customer context** ("Khách đang hỏi": 1–4 products, each with an optional size) chosen once and reused by every stage: greeting info slot, size chart, size replies, order lines. A sticky context bar shows it; "↺ Khách mới" resets everything. **One card anatomy**: a copy card shows the real message and a "⧉ Chép" capsule; a row with › opens something. Nothing else is tappable. ✓ marks on the stage switcher show where she has been for this customer. |

### 0.2 What v6 replaces in v5 (and only this)

| v5 section | v6 replacement | Why |
|---|---|---|
| §7.3 stage cards ("Mở để xem và chép" label, product rows "Chọn mẫu khách hỏi") | §6 copy cards with the message visible and a "⧉ Chép" tonal capsule; product rows replaced by the context bar (§5.1) and the photo strip (§5.3) | v5 still costs 2 taps (open sheet, copy) for every card and still picks the product per card. |
| §7.3 "TRẢ LỜI NHANH · BƯỚC n/5" header and 15 pt description line | Eyebrow kept; **description line dropped** on Trả lời nhanh; "↺ Khách mới" text button joins the eyebrow row | 20 pt of vertical space for the context bar; the stage title already says where she is. |
| §7.4 message sheet "ĐIỀN VÀO TIN · Mẫu / Đổi ⌄" | Message sheet keeps the box and the size fills; the product row becomes the read-only context row "Cho: Lace Top · M  Đổi ⌄" (opens the shared picker, writes the context) | Products are chosen in one place only. |
| §7.5 Tạo đơn (sections 1→4, message last, inline search, "＋ S" rows, line editor sheet, `.ofoot` floating card) | §7.4 message-first layout, inline size segmented + stepper per line, "＋ Thêm món" picker, dock | Feedback 2. The line editor sheet adds a layer for the field she edits most (size). |
| §9 `order.new` "Đơn mới" | "Khách mới" (global reset) | One reset for the whole customer, not just the order. |
| §8.17 Card (stage) | §6 `.mcard` | — |

Kept from v5 without change: header with VI/EN segmented and gear, home tiles, floating capsule and "Đơn" button, product sheet, set sheet, opening-line picker, toasts, dialogs, all tokens, the safe-area formula, the guard, reduced motion.

---

## 1. Root cause of the duplicate "Mẫu" group (her 6.webp) and the other duplicate sources

### 1.1 The bug in her screenshot

`src/app.js`, `renderMsg()` (line ~795):

```js
var fr = keys.map(function (k) { return fillRow(k, fills, s); }).join('') + (isG ? fillRow('item', fills, s, true) : '');
```

- `keys = keysOf(et.text)`: one row per placeholder found in the template text.
- `et = mtext(e, lang, fills)`: for the greetings (`open-first`, `open-returning`) the template **natively contains `{{itemInfo}}`** (see `data.json`). `mtext` strips it with `greetOnly()` **only while `fills.item` is empty**. As soon as she taps a product chip, `fills.item` is set, `{{itemInfo}}` stays in the text, so `keysOf` now returns `['item']` (via `tkey('itemInfo') → 'item'`).
- Result after one tap: row 1 = `fillRow('item', …)` (required variant: no "Không kèm", selection read through `fillVal`, which also falls back to the 20-minute `st.ctx`), row 2 = `fillRow('item', …, true)` (the optional variant with "Không kèm" first). Both are labelled "Mẫu" (`STR.tokl.item`). That is exactly 6.webp: first group starts with "Fleur Slip Dress · Xanh" (selected), the second group starts with "Không kèm" — the "Không kèm in the wrong place" is the first chip of the duplicated group.
- Before the first tap there is only one group, which is why it looks like "tapping produces duplicates".

**Hotfix (P0, ships before anything else):**

```js
// renderMsg: build rows from a de-duplicated key list; the greeting's product row is the optional variant, once.
var rowKeys = [];
keys.concat(isG ? ['item'] : []).forEach(function (k) { if (rowKeys.indexOf(k) < 0) rowKeys.push(k); });
var fr = rowKeys.map(function (k) { return fillRow(k, fills, s, isG && k === 'item'); }).join('');
```

and `fillRow` emits `data-row="<key>"` on its `.frow`. Test: after tapping each product chip and "Không kèm" in turn, `s.el.querySelectorAll('[data-row=item]').length === 1` and exactly one "Không kèm" exists, which is the first chip.

### 1.2 Other duplicate sources found in the code

| # | Where | What happens | Fix (v6) |
|---|---|---|---|
| D2 | `pushSheet()` from `data-open` / `pchip` / `pchoose` | No re-entry guard. A fast double tap on a card or chip pushes **two identical sheets** (two product sheets stacked; closing one reveals the twin). | `openSheet(kind, key)`: if the top sheet has the same `kind+key`, return it; ignore any push within 350 ms of the previous push (§9 rule 3). |
| D3 | Picker `pickadd` | Adds the line, then closes the sheet after 250 ms. A second tap inside those 250 ms adds a second unit (qty 2) or a second size. | Picker selection is a **toggle** (tap = select / tap again = unselect) committed by one "Xong" button (§5.2). |
| D4 | Tạo đơn "Mẫu gần đây" `oadd` (S/M/L pills) | Every tap is `qty + 1` with only a tiny "· 2" suffix; repeated taps silently stack quantity. | Deleted. Quantity changes only through the explicit stepper. |
| D5 | Same product in 3 places on Chào hỏi | "Khách mới" sheet product chips, "Khách cũ" sheet product chips, and "Gửi thông tin mẫu" chips → product sheet; the greeting + product info is the same text as product info with lead-in `li-info-1` (identical sentence). Three paths to one message, with three different product lists (`candidates()` is re-ranked by `st.ctx` and `st.recents` on every render). | One hero card on Chào hỏi with a variant segmented "Khách mới · Khách cũ · Chỉ thông tin" fed by the context (§7.1). |
| D6 | `setTop('qr')` + `gotoStage()` | `renderStage()` and `paintStages()` run twice per stage switch. Harmless now, but it re-runs `candidates()` so a chip list can reorder between the two paints. | One render per state change (§9 rule 1). Suggestion lists are frozen while a stage is open (§5.3). |

---

## 2. The job, and what the flow must do

She is answering an Instagram DM **in the next few seconds**, almost always about **1–2 products or one set**, in this order:

```
greet + info  →  size chart / size advice  →  ask shipping info  →  order recap  →  payment confirmed  →  thanks / tracking / feedback
 (Chào hỏi)        (Tư vấn size)               (Xin thông tin)       (Tạo đơn)        (Check out ……………………………………………………)
```

Design principles (decided, binding):

1. **Message first.** Every stage opens on the text she will copy, already filled from the context. Inputs sit *under* the message and refine it.
2. **Choose the product once.** "Khách đang hỏi" (the context) is chosen once and reused by every stage. Changing it in one place changes every message.
3. **Two shapes only for taps in a stage.** A **capsule** copies or acts ("⧉ Chép · VI", "Chọn size"). A **row with ›** or **⌄** opens something. The message preview is a rounded box: tapping it opens the editor ("✎ Sửa"). Card backgrounds are never tap targets.
4. **Common jobs ≤ 2 taps once on the stage**; honest counts in §10.
5. **Progressive disclosure.** Secondary replies under "Câu khác (n)"; receiver info, bank switch and opening line collapsed; editing in a sheet.
6. **Idempotent UI.** The same state always renders the same DOM; no tap can add a second copy of a group (§9).

---

## 3. Information architecture (final)

```
Trang chủ
├─ (new) "Đang trả lời: Lace Top + Lace Skirt · Bước 2 ›"  resume row, only when the context is not empty
├─ Trả lời khách: 5 stage tiles (v5 §7.2)
└─ Thông tin sản phẩm: Theo mẫu / Theo set (v5)

Trả lời nhanh  (one screen, stage = segmented)
├─ Eyebrow row: TRẢ LỜI NHANH · BƯỚC n/5 ……………… ↺ Khách mới
├─ Title: <stage name>
├─ STICKY: stage segmented (✓ on stages already copied for this customer)
├─ STICKY: context bar "Khách đang hỏi"  (hidden on Tạo đơn: the order lines are the context there)
└─ Stage body
   1 Chào hỏi      hero copy card "Chào khách"  [Khách mới | Khách cũ | Chỉ thông tin]
   2 Tư vấn size   hero copy card "Gửi bảng size" · copy cards Vừa size, Giữa 2 size, Xin số đo · Câu khác (4)
   3 Xin thông tin copy cards Xin thông tin giao hàng, Hỏi địa chỉ báo phí ship · row "Khách gửi địa chỉ rồi? Dán vào đơn ›" · Câu khác (1)
   4 Tạo đơn       message card (top) · Món trong đơn · Phí ship row · Thông tin nhận (collapsed) · dock [Tổng | Chép đơn]
   5 Check out     sequence card "Xác nhận thanh toán" (2 tin) · sequence card "Gửi mã vận đơn" (2 tin) · copy card Xin hình feedback · Câu khác (4) · "↺ Xong khách này"

Sheets used from Trả lời nhanh
├─ Chọn mẫu (shared product picker: photo grid, search, category, sets, selection tray with size)   §5.2
├─ Sửa tin (v5 message sheet: box, opening line, fills; product shown as context row)              §6.4
├─ Phí ship (radio sheet, medium detent)                                                           §7.4
└─ Câu mở đầu picker (v5 §7.8)
```

Data model (one source):

```js
// st.draft IS the customer context. Lines may have no size yet.
st.draft = {
  lines: [{ pid, size: null | 'M', qty: 1 }],     // max 4 distinct pids; same pid may appear with 2 sizes in Tạo đơn
  ship: 'courier' | 'fee' | 'free' | 'custom', custom: 0, info: '', bank: true,
  copiedAt: 0,                                     // order copied
  done: { greet: 0, size: 0, info: 0, order: 0, out: 0 },   // ✓ marks, timestamps
  at: 0                                            // last change, for the "stale" caption
};
st.ui = { stage, greetV: 'new' | 'back' | 'info', sizeAsk: false, more: {} };
```

- `st.ctx` (the 20-minute "last product handled") is **removed**. Migration on boot: if `st.ctx` is valid and `st.draft.lines` is empty, push `{pid: ctx.itemId, size: ctx.size || null, qty: 1}`; then `delete st.ctx`.
- Opening a product sheet from Sản phẩm **does not** change the context. "Thêm vào đơn ＋M" in the product sheet (v5 §7.7) adds to `st.draft.lines` (= the context) with that size: the same list, one meaning.
- The "Đơn" nav badge and the Tạo đơn stage badge count **lines that have a size** (sizeless lines are "being asked about", not ordered yet). `aria-label`: "Đơn hàng, 2 món, 850.000đ".

---

## 4. Screen frame of Trả lời nhanh (all stages)

### 4.1 Vertical budget

| | 430 × 932 PWA | 393 × 852 PWA |
|---|---|---|
| Header bottom (inset-t 59 + 44) | 103 | 103 |
| Eyebrow row (top pad 8, row 44 because of the "Khách mới" target, text 13/18 centred) | 111 → 155 | 111 → 155 |
| Title serif 28/34 | 155 → 189 | 155 → 189 |
| Gap | 12 | 12 |
| **Sticky block**: stage segmented 52 + gap 8 + context bar 56 + gap 8 (bg `--bg-grouped`, hairline under it once scrolled) | 201 → 325 | 201 → 325 |
| Body starts | 325 | 325 |
| Floating bar top (`--bar-top` 84 from bottom) | 848 | 768 |
| Body visible on open | **523** | **443** |
| Sticky block pinned position after scrolling | 103 → 227 | 103 → 227 |

On Tạo đơn the context bar is not rendered: the sticky block is 52 + 8 = 60, body starts at **269**.

### 4.2 Header wireframe (430, dark, Tư vấn size, context = Lace Top · M + Lace Skirt)

```
┌ 430 ──────────────────────────────────────────────────┐
│ Soft Embrace                      [ VI | EN ]   (⚙)    │ v5 header
│───────────────────────────────────────────────────────│
│ TRẢ LỜI NHANH · BƯỚC 2/5                 ↺ Khách mới   │ 13 caps l-2 · text button 15/600 accent-ui, 44 tall
│ Tư vấn size                                            │ serif 28/34
│ ┌───────────────────────────────────────────────────┐ │ STICKY ↓  stage segmented 52 (v5 §8.8)
│ │ ✓        │▐ 2 ████▌│ 3       │ 4  ②   │ 5        │ │ done stage: ✓ (13, label-2) replaces the number
│ │ Chào hỏi │ Tư vấn  │ Xin     │Tạo đơn │Check out │ │ selected: raised thumb, label 600
│ │          │ size    │thông tin│        │          │ │ badge on 4 = lines with size
│ └───────────────────────────────────────────────────┘ │ 8
│ ╭───────────────────────────────────────────────────╮ │ context bar 56, r14, --bg-cell
│ │ (●)(●)  KHÁCH ĐANG HỎI                     Đổi ⌄  │ │ circles 32 overlap 10 · caption 12/16 caps l-2
│ │         Lace Top · M + Lace Skirt · Kem           │ │ value 16/22 600, 1 line, ellipsis
│ ╰───────────────────────────────────────────────────╯ │ 8, then body
```

393 differences: same heights; segmented columns 72 pt; the context value truncates earlier ("Lace Top · M + Lace Sk…").

### 4.3 "↺ Khách mới"

- Text button (v5 §8.3), 15/600 `--accent-ui`, icon `i-undo` 15, min 44 × 44, right-aligned in the eyebrow row, 20 pt (430) / 16 pt (393) from the edge.
- Hidden when the context is empty **and** no stage is marked done (nothing to reset).
- Tap: snapshot `st.draft`, `PAGE` edits and `st.ui.stage`; reset `st.draft` to defaults (ship back to `courier`, `done` cleared, `copiedAt` 0), drop all card edits, go to stage 1, scroll to top. Toast: **"Đã sang khách mới"** with **[Hoàn tác]** (5 s). No confirm dialog: undo is the safety.
- `aria-label`: "Khách mới: xoá mẫu đang hỏi, đơn và chỉnh sửa".

### 4.4 Stage segmented ✓ marks

After any successful copy inside a stage, `st.draft.done[stage] = Date.now()`. A done stage shows ✓ (13 pt, `--label-2`) in place of its number; the selected stage always shows its number (you are here wins). VoiceOver: "Chào hỏi, đã gửi". Reset by "Khách mới".

---

## 5. Shared components

### 5.1 Context bar `.ctxbar` ("Khách đang hỏi")

Geometry: full width minus gutters, height 56, radius 14, `--bg-cell`, inset 0.5 pt `--separator`. Padding 0 8 0 12. Whole row is one button (`aria-haspopup="dialog"`), grammar = **dropdown row** (v5 §3): caption on top, value below, "Đổi ⌄" right.

| State | Left | Caption (12/16 caps l-2) | Value (16/22, 600) | Right |
|---|---|---|---|---|
| Empty | 32 disc `--tonal` with ＋ 15 `--label-2` | KHÁCH ĐANG HỎI | "Chưa chọn mẫu" in `--label-2` 400 | **Chọn ⌄** |
| 1 product | 32 circle | KHÁCH ĐANG HỎI | "Lace Top · Kem · M" (name · colour variant · size if set) | **Đổi ⌄** |
| 2 products | two 32 circles, overlap 10, 2 pt ring in `--bg-cell` | KHÁCH ĐANG HỎI | "Lace Top · M + Lace Skirt · Kem" | **Đổi ⌄** |
| 3–4 products | two circles + a 32 disc "+2" (12/600 on `--tonal`) | KHÁCH ĐANG HỎI · 4 MẪU | names joined with " + ", ellipsis | **Đổi ⌄** |
| Stale (last change > 2 h ago) | as above | **TỪ 3 GIỜ TRƯỚC · VẪN KHÁCH NÀY?** | as above | **Đổi ⌄** (the reset stays in the eyebrow row) |
| Pressed | `--fill-pressed` overlay | — | — | — |

- Tap → the shared picker (§5.2) in **context mode**, pre-checked with the current lines.
- Same product with two sizes (only possible from Tạo đơn) shows once: "Lace Top · S, M".
- `aria-label`: "Khách đang hỏi: Lace Top size M và Lace Skirt màu Kem. Đổi".
- Not rendered on Tạo đơn (the "Món trong đơn" list is the context there). Rendered on stages 1, 2, 3, 5.

### 5.2 Product picker sheet "Chọn mẫu" (one component, three modes)

Large detent (v5 sheet, top = `--inset-t` + 10). Replaces v5 §7.10 "Product picker" for everything opened from Trả lời nhanh; the set-pairing picker of the Sản phẩm tab keeps v5's list style.

| Mode | Opened from | Title (serif 22) | Subtitle (15 l-2) | Size in tray | Primary (footer) |
|---|---|---|---|---|---|
| `context` | context bar, strip "Tất cả", sheet context row | Khách đang hỏi mẫu nào? | Chọn 1 hoặc nhiều mẫu. Size chọn sau cũng được. | optional (no thumb until chosen) | **Xong · 2 mẫu** |
| `order` | Tạo đơn "＋ Thêm món" | Thêm món vào đơn | Chạm ảnh, rồi chọn size ngay bên dưới. | **required** | **Thêm 2 món vào đơn** |
| `size` | Tư vấn size strip "Tất cả" | Gửi bảng size mẫu nào? | Chọn 2 mẫu để gửi cả hai bảng trong một tin. | hidden | **Xong · 2 mẫu** |

Wireframe (430, dark, order mode, 2 selected):

```
┌ sheet top 69 ─────────────────────────────────────────┐
│                 ───                                   │ grabber
│ Thêm món vào đơn                               (✕)    │ serif 22 · close 44
│ Chạm ảnh, rồi chọn size ngay bên dưới.                │ 15 l-2
│ ╭ ⌕  Tìm tên, màu…                                ╮   │ search 44, r12, --fill-4 (v5)
│ [▐Tất cả▌| Áo | Váy | Đầm | Quần ]                    │ segmented 44 (v5 §7.6)
│ GẦN ĐÂY                                               │ 13 caps l-2, only in Tất cả with empty search
│   ( 104 )        ( 104 )✓       ( 104 )               │ 3 columns, circle 104 (430) / 96 (393)
│   Lace Top       Lace Skirt     Butter Top            │ name 13/16 600, ≤ 2 lines, centred
│   380.000đ       Kem · 470.000đ 390.000đ              │ 12/16 l-2
│ SET HAY HỎI                                           │
│   (64)(64)✓      (64)(64)       (64)(64)              │ pair cell: two 64 circles, overlap 14
│   Lace Top +     Butter Top +   Shimmer Top +         │
│   Lace Skirt     Flowy Skirt    Lace Skirt · Đen      │
│ SUMMER 26 · 10                                        │ then every collection, newest first (v5 data)
│   …                                                   │
├───────────────────────────────────────────────────────┤ sticky footer (.shf), top hairline
│ (●32) Lace Top        [ S |▐M▌| L ]            (✕)    │ tray row 52: seg 44 tall, 3×48 · ✕ 44 "Bỏ"
│ (●32) Lace Skirt·Kem  [ S | M | L ]  Chọn size (✕)    │ no thumb yet + 12/16 l-2 hint
│ [ Thêm 2 món vào đơn ]  (disabled: "Chọn size cho 1 món")│ primary 52
└───────────────────────────────────────────────────────┘
```

Grid geometry:

| | 430 | 393 |
|---|---|---|
| Side gutter / column gap / row gap | 20 / 12 / 16 | 16 / 12 / 16 |
| Column width | (430 − 40 − 24) / 3 = **122** | (393 − 32 − 24) / 3 = **112.3** |
| Single circle | **104** | **96** |
| Pair circles | 64 + 64 − 14 = 114 wide | 60 + 60 − 12 = 108 wide (pair at 393 is the one exception to the v5 size set; 64 does not fit 112) |
| Cell | pad-top 8, circle, 8, name 2 × 16, price 16, pad-bottom 8 = **184** | **176** |

Cell states:

| State | Visual |
|---|---|
| Default | circle (v5 avatar, 0.5 pt ring in dark), name `--label`, price `--label-2` |
| Pressed | cell background `--fill-pressed`, radius 16 |
| **Selected** | 24 pt check disc at the circle's top-right (45°, inset 4), fill `--primary`, ✓ 14 `--on-primary`; cell background `--sel-fill` radius 16. No coloured ring (v5 rule 6). |
| Already in the order (order mode) | selected look + caption "Trong đơn" instead of the price |
| Limit reached (4 products) | other cells `opacity .45`, tap shows toast "Tối đa 4 mẫu một lần — bỏ bớt một mẫu nhé" |
| Pair cell | selecting a pair selects both products (both single cells show their check); unselecting the pair unselects both |

Behaviour:

- **Tap = toggle** (idempotent). The tray updates in place; no closing on tap; nothing is committed until the primary. Closing with ✕ / drag discards the changes (no confirm; nothing was copied).
- **Size in the same step** (order mode): a newly selected product appends a tray row with the size segmented **without** a thumb and the hint "Chọn size". If the product has exactly one size, it is preselected. If the product was already in the context with a size, that size is preselected.
- The tray shows up to 3 rows (156 pt) and scrolls inside after that; the newest row scrolls into view.
- Search: accent-insensitive (`norm()`), name + colour; results replace the sections (single grid "KẾT QUẢ · n"). Empty: "Chưa tìm thấy “{q}”. Thử một tên ngắn hơn nhé." (v5).
- "GẦN ĐÂY" = up to 6: products copied or added in the last 7 days (`st.recents` p-keys and order history), newest first; hidden when empty. "SET HAY HỎI" = saved sets first, then `setSuggestions`, up to 6.
- Section order and contents are computed once when the sheet opens (frozen; §9 rule 4).
- Footer: `max(--inset-b, 12) + 8` bottom padding (v5 §4.2). Tray rows 52; primary 52; gaps 12.
- Commit (context/size mode): lines not in the selection are removed from `st.draft.lines` (with undo toast "Đã bỏ Butter Top khỏi khách đang hỏi · Hoàn tác" when something was removed), new ones are appended with their tray size (or `null`). Order mode: append/merge `{pid,size}`; merging the same pid+size adds nothing (qty stays) — quantity is the stepper's job.

### 5.3 Suggestion strip `.pstrip` (inside hero cards)

Purpose: the fastest possible first pick, without leaving the card.

```
430: card inner width 358                       393: card inner width 329
( 56 )  ( 56 )  ( 56 )  ( 56 )  ( ⌕ )           5 equal columns, gap 12 (430) / 10 (393)
Lace    Lace    Butter  Fleur   Tất cả          name 11/13 600, ≤ 2 lines, centred, ellipsis
Top     Skirt   Top     Slip…   mẫu
```

- 5 columns: 4 product circles (56) + one "Tất cả mẫu" disc (56, `--tonal`, ⌕ 20 `--label-2`) that opens the picker in the card's mode.
- Caption above the strip (13/18 l-2): with 0 products "Khách hỏi mẫu nào? Chạm ảnh để kèm vào tin."; with 1 product "Khách hỏi thêm mẫu? Chạm để gửi cả hai."
- **Suggestions** (computed when the stage renders, then frozen):
  1. with 1 product in the context: its `setSuggestions` partners and saved-set partners first (Lace Top → Lace Skirt · Kem, Flowy Skirt …);
  2. then recents (§5.2 "Gần đây");
  3. then newest released;
  minus products already in the context; first 4.
- **Tap = toggle into the context** (size `null`). The tapped cell gets the 20 pt check disc; the card preview above updates in place (one card repaint, no stage re-render). Tapping it again removes it.
- Shown when the context had **0 or 1** products at render time; stays visible (frozen) while she taps; replaced by the text button "＋ Thêm mẫu" (opens picker) when the stage is next rendered with ≥ 2 products.
- Cell hit area: full column × 92 pt.

### 5.4 Placeholder tokens

Unfilled data in any message shows as a bracketed word in the preview: `[món]`, `[size]`, `[mã vận đơn]`, `[link hình]`, `[giá]`, `[tổng]`. In the read-only preview (§6) the token is a `<span class="tok">`: `--label-3`, 1 pt dashed underline `--edge`, tappable (focuses / scrolls to the control that fills it, which flashes `--insert` for 600 ms). In the editor textarea it is plain text `[size]`. A message that still contains a token **cannot be copied**: the capsule names what is missing (§6.2).

---

## 6. Card anatomy (`.mcard`) — one card, two densities

### 6.1 Copy card

```
╭─────────────────────────────────────────────────────╮  r20, --bg-cell, pad 16, 0.5 inset separator
│ Gửi bảng size                         2 mẫu · ● Đã sửa│  title 17/22 600 · meta 13/18 l-2 (right)
│ 12                                                  │
│ [inputs row(s), only if the card has any]           │  segmented 44 / strip / field 52
│ 12                                                  │
│ ╭─────────────────────────────────────────────────╮ │  preview box: r14, 1 pt --edge, --bg-paper,
│ │ Dạ mình gửi bảng size để bạn tiện tham khảo nhen│ │  pad 12/14, text 15/21 --label, pre-wrap
│ │                                                 │ │  hero clamp 8 lines, compact clamp 3 lines,
│ │ Lace Top                                        │ │  bottom fade 24 pt into --bg-paper when clamped
│ │ • S: ngực 78-82, eo 62-66 …                     │ │
│ ╰─────────────────────────────────────────────────╯ │
│ ⌄ Xem hết · 14 dòng                                 │  text button 13/600 accent-ui, only if clamped
│ 12                                                  │
│ ✎ Sửa                               [ ⧉ Chép · VI ] │  text button 44 (left) · tonal capsule 44, min-w 120
╰─────────────────────────────────────────────────────╯
```

- **What can be tapped, and what it does** (the whole contract):
  - **⧉ Chép · VI** (tonal capsule): copies exactly the full message (all lines, including clamped ones) in the current language. Seal "✓ Đã chép" 1.2 s (v5 §8.2), toast (§11), stage marked done.
  - **Preview box** and **✎ Sửa**: open the "Sửa tin" sheet (v5 §7.4) with the textarea focused, caret at the end.
  - **⌄ Xem hết / ⌃ Thu gọn**: expands the preview in place (`aria-expanded`).
  - Inputs inside the card (segmented, strip, field): change the message; they never copy.
  - The card background: nothing (no hidden target, no press state).
- Edited state: meta shows "● Đã sửa" (dot `--accent-ui`); the preview shows the edited text; Chép copies the edited text.
- Compact density (secondary replies like "Xin số đo"): same anatomy, clamp 3 lines, no inputs row.
- In Tạo đơn the message card has **no** Chép capsule (the dock holds the one primary).

### 6.2 Capsule label by state

| State | Capsule | Enabled |
|---|---|---|
| Ready | ⧉ Chép · VI | yes |
| Token(s) unfilled | the verb of the first missing input: **Chọn size** / **Chọn mẫu** / **Dán mã** / **Thêm link** | yes — it focuses/scrolls to that input (does not copy) |
| Edited text still contains `[…]` | **Còn chỗ trống** | no (`aria-disabled`), notice under preview "ⓘ Xoá hoặc điền chỗ trong ngoặc [ ] rồi chép." |
| Language missing for the whole card | replaced by tonal **⧉ Chép bản VI** + text button **✎ Thêm bản EN**, notice "ⓘ Chưa có bản EN của tin này." | yes |
| Language missing for one product only | ⧉ Chép · EN, notice "ⓘ Lace Skirt chưa có bảng size EN — tin chỉ có Lace Top." | yes |
| Truncated source text (v5 guard) | first tap → tonal "Chạm lại để chép" (400 ms–3 s) | yes |
| Copied | ✓ Đã chép (1.2 s) | — |

### 6.3 Sequence card (Check out)

v5 bubble card (`.bcard`, §7.9 and §8.12) nested in a `.mcard` shell: title + "Đã chép 1/2" meta, then mini-bubbles "Tin 1 · …", "Tin 2 · …", each with its own 3-line preview and its own "⧉ Chép tin 1" capsule; the next one carries the "Tiếp theo" ring. No footer primary on the stage (that stays v5's set-sheet pattern only).

### 6.4 "Sửa tin" sheet (v5 §7.4 with the v6 context rule)

```
│ Gửi bảng size                         [VI|EN] (✕)  │
│ Bước 2 · Tư vấn size                               │
│ ╭ Cho      (●)(●) Lace Top + Lace Skirt    Đổi ⌄ ╮ │ context row (dropdown row 56) → picker, writes the context
│ ╭ Câu trước bảng size   Không kèm          Đổi ⌄ ╮ │ v5 opening-line row (only for cards that take one)
│ TIN SẼ GỬI                                 ✎ Sửa   │
│ ╭ box (strip + textarea), max-h min(34vh,280) ─╮   │
│ (edited) ● Đã sửa   ↺ Khôi phục   Lưu làm mẫu      │
│ ĐIỀN VÀO TIN (only when the message has a size/code/link token)
│ Size   [ S |▐M▌| L ]                               │ writes the context line's size
├────────────────────────────────────────────────────┤
│ [ ⧉ Chép · VI ]                                    │ primary 52 (v5)
```

- Never a product chip group. Exactly one row per fill key (`data-row`), built from a de-duplicated key list.
- The sheet edits the same per-card edit slot the card shows (`PAGE.state.ed[cardId + ':' + lang]`), so closing the sheet keeps the edit on the card.

---

## 7. Stages

All wireframes: dark, 430; 393 notes after each. Body starts at y = 325 (269 on Tạo đơn).

### 7.1 Bước 1 · Chào hỏi

**Default on open (no input needed):** the greeting hero card in the last used variant (default "Khách mới"), already including the info of every product in the context. With an empty context it is the greeting only, plus the strip. Below it: nothing else (the old "Khách cũ" and "Gửi thông tin mẫu" cards are merged into the variant control).

```
│ ╭ Chào khách ─────────────────────────── 1 mẫu ─╮ │ title · meta "1 mẫu" / "Chưa kèm mẫu"
│ │ [▐ Khách mới ▌|  Khách cũ  | Chỉ thông tin ]   │ │ segmented 44 (v5 §8.7), remembered in st.ui.greetV
│ │ ╭─────────────────────────────────────────────╮│ │
│ │ │ Soft Embrace chào bạn,                      ││ │ preview, clamp 8
│ │ │                                             ││ │
│ │ │ Cảm ơn bạn đã quan tâm đến sản phẩm của     ││ │
│ │ │ chúng mình, Soft xin gửi bạn thông tin sản  ││ │
│ │ │ phẩm ạ:                                     ││ │
│ │ │                                             ││ │
│ │ │ Lace Top 🦢                                 ││ │
│ │ │ • Dáng áo cổ vuông, viền ren thêu… (fade)   ││ │
│ │ ╰─────────────────────────────────────────────╯│ │
│ │ ⌄ Xem hết · 16 dòng                            │ │
│ │ ✎ Sửa                          [ ⧉ Chép · VI ] │ │
│ │ Khách hỏi thêm mẫu? Chạm để gửi cả hai.        │ │ strip caption (0 or 1 product)
│ │ (56)   (56)   (56)   (56)   (⌕)                │ │ strip §5.3
│ │ Lace   Flowy  Butter Fleur  Tất cả             │ │
│ ╰────────────────────────────────────────────────╯ │
│ ╭ Gửi thêm hình / link ……………………………………………… › ╮   │ nav row 56 → Sửa tin sheet (needs {{imageLinks}})
```

Composition (new `composeCopy('greet', {v, pids, sel}, l)`, §12):

| Variant | Text |
|---|---|
| Khách mới | `open-first` template; `{{itemInfo}}` = the info of each context product (`desc` in l), joined by a blank line |
| Khách cũ | `open-returning`, same slot |
| Chỉ thông tin | no greeting; the product info blocks; optional v5 "Câu trước thông tin" opening line (set in the Sửa tin sheet) |
| Any, no product | greeting with the product slot and the trailing colon removed (today's `greetOnly`) — "Chỉ thông tin" with no product shows the capsule **Chọn mẫu** |

**Instagram length.** Instagram DMs are limited to about 1,000 characters (verify on her phone with a 1,100-character paste before shipping this rule). When the composed text is longer than 1,000 characters, the card turns into a sequence card: "Gửi 2 tin" — tin 1 = greeting + product 1, tin 2 = product 2 (and so on), meta "2 tin · tin dài". Never split inside a product block.

Tap counts on this stage: context already set → **1** (Chép). Empty context → **2** (strip photo, Chép). Two products → 3. Product not in the strip → 4 (Tất cả, photo, Xong, Chép).

393: the preview clamps at 8 lines, so the Chép capsule sits at y ≈ 325 + 16 + 22 + 12 + 44 + 12 + 192 + 30 + 12 = 665 → fully above the bar (768). The strip ends at ~ 800, under the bar, reachable by scrolling 40 pt.

### 7.2 Bước 2 · Tư vấn size (the important one)

**Default on open:** the "Gửi bảng size" hero card **shows the size chart(s) of the context products**, labelled by product when there are two or more. Then "Vừa size" and "Giữa 2 size" copy cards with their size controls already pointing at the context product, then "Xin số đo" compact, then "Câu khác (4)".

```
│ ╭ Gửi bảng size ────────────────────────── 2 mẫu ─╮ │
│ │ ╭─────────────────────────────────────────────╮ │ │
│ │ │ Dạ mình gửi bảng size để bạn tiện tham khảo ││ │ │ opening line (v5 "Câu trước bảng size"), if chosen
│ │ │ nhen:                                       ││ │ │
│ │ │                                             ││ │ │
│ │ │ Lace Top                                    ││ │ │ product label = pname (with colour) in l
│ │ │ • S: ngực 78-82, eo 62-66                   ││ │ │
│ │ │ • M: ngực 82-86, eo 66-70                   ││ │ │
│ │ │                                             ││ │ │
│ │ │ Lace Skirt · Kem                    (fade)  ││ │ │
│ │ ╰─────────────────────────────────────────────╯│ │
│ │ ⌄ Xem hết · 13 dòng                            │ │
│ │ ╭ Kèm câu xin số đo                   (○══)  ╮ │ │ switch row 52 (v5 §8.10), remembered st.ui.sizeAsk
│ │ ✎ Sửa                          [ ⧉ Chép · VI ] │ │
│ │ ＋ Thêm mẫu                                     │ │ text button (≥ 2 products) — or the strip (0–1)
│ ╰────────────────────────────────────────────────╯ │
│ ╭ Vừa size ───────────────────────────────────────╮ │
│ │ Mẫu   (●✓) (●)   Lace Top                       │ │ item switcher: 40 circles, check on the chosen one,
│ │                                                 │ │ shown only with ≥ 2 products
│ │ Size  [ S |▐M▌| L ]                             │ │ segmented 44; writes that line's size in the context
│ │ ╭ Dạ vậy bạn mặc size M mẫu này sẽ thoải mái/ ╮ │ │ preview clamp 3
│ │ ╰ vừa vặn nhe … ──────────────────────────────╯ │ │
│ │ ✎ Sửa                          [ ⧉ Chép · VI ] │ │
│ ╰────────────────────────────────────────────────╯ │
│ ╭ Giữa 2 size ────────────────────────────────────╮ │
│ │ Vừa vặn    [ S |▐M▌| L ]                        │ │ sizeA (default = context size or first size)
│ │ Thoải mái  [ S | M |▐L▌]                        │ │ sizeB (default = next size up); does NOT write context
│ │ ╭ preview ╮                                     │ │
│ │ ✎ Sửa                          [ ⧉ Chép · VI ] │ │
│ ╰────────────────────────────────────────────────╯ │
│ ╭ Xin số đo ─────────────────────────────────────╮  │ compact copy card
│ │ ╭ Nếu bạn cần tư vấn thêm về size, cho Soft … ╮│  │
│ │ ✎ Sửa                          [ ⧉ Chép · VI ] │  │
│ ╰────────────────────────────────────────────────╯  │
│ ⌄ Câu khác (4)                                      │ Cân nhắc · Quá size có mẫu khác · Quá size không có · Quá nhỏ
```

Size chart composition (new `composeCopy('sizes', {pids, sel, ask}, l)`, §12):

- 1 product: `[opening line]` + chart (exactly today's `size` action body).
- ≥ 2 products: `[opening line]` + for each product `pname(p, l) + "\n" + chart`, blocks joined by a blank line — the same format as set bubble 2 (`setBubble 'b'`), so a set and two loose products read the same.
- `ask = true`: append a blank line + the `ask-measurements` text in l.
- A product without a chart in l is left out and reported in `out.partial` (notice §6.2). All missing → `out.missing`.
- Empty context: preview shows the line "[món] — chọn mẫu bên dưới" in token style; capsule **Chọn mẫu** scrolls to the strip; strip caption "Gửi bảng size mẫu nào? Chạm ảnh, chọn 2 mẫu để gửi cả hai."

The set case "Lace Top + Lace Skirt": she taps Lace Top in the strip → the strip (frozen) still shows Lace Skirt · Kem first among the others (because suggestions were computed with Lace Top in mind *only if* Lace Top was already in context; otherwise it shows recents) → taps Lace Skirt → Chép. **3 taps**, one message, both charts labelled. Via the picker's "SET HAY HỎI": Tất cả, set cell, Xong, Chép = 4.

Vừa size / Giữa 2 size: `{{sizeChart}}` = the chosen item's chart only; `{{size}}`, `{{sizeA}}`, `{{sizeB}}` from the segmented controls. With an empty context, the segmented shows S M L (no thumb) and the capsule reads **Chọn mẫu**.

393: the hero card with two charts is 16+22+12+192+30+12+52+12+44+12+44+16 ≈ 464 → Chép capsule at y ≈ 325+376 = 701, above the bar (768).

### 7.3 Bước 3 · Xin thông tin

```
│ ╭ Xin thông tin giao hàng ───────────────────────╮ │ compact copy card
│ │ ╭ ✍ Bạn cho Soft xin thông tin của mình nha   ╮│ │
│ │ ╰ • Tên người nhận • Số điện thoại …          ╯│ │
│ │ ✎ Sửa                          [ ⧉ Chép · VI ] │ │
│ ╰────────────────────────────────────────────────╯ │
│ ╭ Hỏi địa chỉ để báo phí ship ───────────────────╮ │ compact copy card
│ ╰────────────────────────────────────────────────╯ │
│ ╭ 📋 Khách gửi địa chỉ rồi? Dán vào đơn        › ╮ │ nav row 56: reads the clipboard into st.draft.info,
│ ╰────────────────────────────────────────────────╯ │ then goes to Tạo đơn with "Thông tin nhận" expanded
│ ⌄ Câu khác (1)                                      │ Gửi thêm hình / link
```

Default on open: both messages visible, copyable in 1 tap. If the clipboard read is refused, Tạo đơn opens with the receiver field focused (iOS paste menu).

### 7.4 Bước 4 · Tạo đơn (message first)

**Default on open:** the order message, filled from the context lines. With sizes known: ready to copy (1 tap on the dock). Lines without size show `[size]` tokens and their size segmented without a thumb; the dock button says "Chọn size cho 1 món". With no lines: the message shows `• [món] – size [size]: [giá]` and the "Món trong đơn" section shows the strip.

```
┌ 430 ─────────────────────────────────────────────────┐
│ TRẢ LỜI NHANH · BƯỚC 4/5                ↺ Khách mới  │
│ Tạo đơn                                              │
│ [ ✓ | ✓ | ✓ |▐ 4 Tạo đơn ▌| 5 ]   sticky 52         │ no context bar on this stage
│ ╭ Tin chốt đơn ──────────────────────────── VI ─╮    │ y 269 · title 17/600 · meta = language
│ │ ╭────────────────────────────────────────────╮│    │ preview, clamp 10 (this is the whole point)
│ │ │ Dạ vậy đơn của bạn 🌷                      ││    │
│ │ │ • Lace Top – size M: 380.000đ              ││    │
│ │ │ • Lace Skirt – Kem – size [size]: 470.000đ ││    │ [size] = token (§5.4), tap → that line's segmented
│ │ │ • Shipping: khách trả shipper              ││    │
│ │ │ Tổng cộng là 850.000đ                      ││    │
│ │ │                                            ││    │
│ │ │ Nội dung chuyển khoản bạn note tên         ││    │
│ │ │ Instagram và cho Soft xin ảnh chụp …       ││    │
│ │ ╰────────────────────────────────────────────╯│    │
│ │ ✎ Sửa                                         │    │ text button: Sửa tin sheet (opening line lives there)
│ ╰───────────────────────────────────────────────╯    │ 16
│ MÓN TRONG ĐƠN · 2                                    │ 13 caps l-2
│ ╭───────────────────────────────────────────────╮    │ grouped list r14
│ │ (●44) Lace Top                380.000đ    (✕) │    │ row 1: name 16/600, price 15 l-2 tabular, ✕ 44 "Bỏ món"
│ │       [ S |▐M▌| L ]          [ − ] 1 [ + ]    │    │ row 2: size seg 44 (3×52) · stepper 44 (108 wide)
│ │───────────────────────────────────────────────│    │ hairline inset 72
│ │ (●44) Lace Skirt · Kem        470.000đ    (✕) │    │
│ │       [ S | M | L ]  Chọn size [ − ] 1 [ + ]  │    │ no thumb + hint 12 l-2 until chosen
│ ╰───────────────────────────────────────────────╯    │ 12
│ [ ＋ Thêm món ]                                      │ tonal 44, full width → picker (order mode)
│ 24                                                   │
│ ╭ Phí ship     Khách trả shipper          Đổi ⌄ ╮    │ dropdown row 56 → "Phí ship" radio sheet
│ ╭ Thông tin nhận (tuỳ chọn)   [📋 Dán]         ⌄ ╮   │ collapsed row 56; Dán = tonal 36×… inside a 44 target
│ ╭ Kèm số tài khoản                      (●══)   ╮    │ switch row 52 (only when bank set; else "Thêm STK ›")
│ (after copy) ╭ Khách đã chuyển khoản? Sang Check out › ╮ │ nav row, v5 postcard
│                                                      │ bottom padding = bar-top + 8 + 64 + 16
│ ╭──────────────────────────────────────────────╮     │ DOCK: bottom = --bar-top + 8 (= 92 from app bottom)
│ │ Tổng · 2 món                [ ⧉ Chép đơn · VI ]│   │ 64 tall, r20, SOLID --bg-cell, --shadow-float
│ │ 850.000đ                                       │   │ primary 48, min-w 168
│ ╰──────────────────────────────────────────────╯     │
│ ░░░░░░░░ scrim band (--bg-grouped) ░░░░░░░░░░░░░     │ from app bottom up to dock top − 8, 12 pt fade on top
│ ╭ Trang chủ  Trả lời nhanh  Sản phẩm ╮  ( Đơn ② )    │ v5 floating bar
└──────────────────────────────────────────────────────┘
```

Vertical check (open, 2 lines, one sizeless):

| | 430 × 932 | 393 × 852 |
|---|---|---|
| Message card | 269 → 269+16+22+12+(9×21+24)+12+44+16 = **604** | 269 → **604** (the 1-line-longer wrap at 393 adds 21 → **625**) |
| "MÓN TRONG ĐƠN" + 2 line rows (2 × 112) | 620 → 862 | 641 → 883 |
| Dock | 776 → 840 | 696 → 760 |
| Visible without scrolling | message complete + section header + first line row | message complete + section header |

So at 393 she sees the full message and the dock on open; one short scroll shows the lines. That is the intended order: read → (fix) → copy.

Lines:

- Row height 112 (16 + 22 + 8 + 44 + 16 + hairline). Name ellipsis 1 line. Price = unit price × qty.
- Size segmented writes `L.size` (and the context). Choosing a size that the same pid already has on another line merges them (qty added), with toast "Đã gộp vào Lace Top · M".
- Stepper: − disabled at 1 (use ✕ to remove), + disabled at 9. 44 × 44 buttons, value 17 tabular.
- ✕ removes the line from the order **and** the context; toast "Đã bỏ Lace Skirt · Hoàn tác".
- Empty state (no lines): the grouped list is replaced by a card with caption "Khách mua mẫu nào?" and the strip (§5.3, order mode → tapping a photo adds a sizeless line). The message shows the `[món]` placeholder line.

Shipping: **one dropdown row**, value = current choice. Tap → medium sheet "Phí ship" with radio rows (v5 §8.9): "Khách trả shipper" · "25.000đ" (`st.set.fee`, formatted) · "Miễn phí" · "Khác…" (selecting it reveals a numeric input 52 "Nhập phí ship" in the sheet, "Xong" tonal). Selecting a fixed option closes after 200 ms (v5 picker behaviour).

Receiver info: collapsed row "Thông tin nhận (tuỳ chọn)" with a tonal "📋 Dán" inside the row. Dán = read clipboard → fill → expand. Tap elsewhere on the row = expand with an empty textarea (16/22, 3 rows, grows to 6) and placeholder "Tên, SĐT, địa chỉ khách gửi…". When filled and collapsed, the row value shows the first line ("Ngọc Anh · 09…"). The text appears in the message as "Giao đến:" (unchanged compose).

Transfer-note notice: shown only when the edited message lost the transfer instruction: "ⓘ Tin chưa có hướng dẫn ghi tên Instagram khi chuyển khoản." in `--label-2` (never red, v5 §2.1.5). The green "Đã kèm…" line is deleted.

Dock:

| State | Left | Button |
|---|---|---|
| No lines | "Chưa có món" / "0đ" | disabled tonal "Chọn món" → tapping scrolls to the strip |
| Sizeless lines | "Tổng · 2 món" / total | disabled tonal "Chọn size cho 1 món" (tap scrolls to the first sizeless line and flashes its segmented) |
| Edited text still has `[…]` | — | disabled "Còn chỗ trống" |
| Ready | "Tổng · 2 món" / "850.000đ" serif 22 | primary "⧉ Chép đơn · VI" |
| Copied | — | "✓ Đã chép" 1.2 s; toast "Đã chép đơn · 850.000đ · VI" + sub "Nhớ gửi mã QR nhé" + action **[Tiếp: Check out]** |
| Keyboard open | dock at `bottom: 8px` above the keyboard (bar hidden, v5) | — |

Geometry rules (binding, fixes 7.webp): the dock is `position:absolute` in `#app` (not sticky in the flow), `left/right: var(--margin)`, `bottom: calc(var(--bar-top) + 8px)`, height 64, **opaque** `--bg-cell` (no blur, so no text shows through), z-index above content and below sheets. `#qr.o` gets `padding-bottom: calc(var(--bar-top) + 88px)` so the last row scrolls fully above the dock. A scrim band `#qr.o::after` (`position:absolute; left:0; right:0; bottom:0; height: calc(var(--bar-top) + 80px)`; background `linear-gradient(to bottom, transparent, var(--bg-grouped) 12px)`; `pointer-events:none`) sits under the dock and the bar, so nothing peeks between dock and capsule (in 7.webp "520.000đ" shows through that gap).

### 7.5 Bước 5 · Check out

**Default on open:** the payment confirmation pair ready to copy, the thank-you variant chosen automatically from the order (any made-to-order line → "May đo").

```
│ ╭ Xác nhận thanh toán ─────────────── Đã chép 0/2 ─╮ │ sequence card §6.3
│ │ ╭ (1) Tin 1 · Đã nhận        [Tiếp theo] ──────╮│ │ ring on the next bubble
│ │ │ ╭ ui dạ mình nhận được rùi ạ ╮               ││ │
│ │ │                       [ ⧉ Chép tin 1 · VI ]   ││ │ tonal 44
│ │ ╰────────────────────────────────────────────────╯│ │ 12
│ │ ╭ (2) Tin 2 · Cảm ơn ───────────────────────────╮│ │
│ │ │ [▐ Có sẵn ▌| May đo ]                          ││ │ segmented 44, auto from the order, overridable
│ │ │ ╭ cảm ơn bạn nhìu, Soft sẽ tranh thủ gói đơn… ╮││ │
│ │ │                       [ ⧉ Chép tin 2 · VI ]   ││ │
│ │ ╰────────────────────────────────────────────────╯│ │
│ ╰──────────────────────────────────────────────────╯ │ 16
│ ╭ Gửi mã vận đơn ──────────────────── Đã chép 0/2 ─╮ │
│ │ ╭ Mã vận đơn  GHN…                    [📋 Dán] ╮ │ │ input 52 (numeric/alnum, 16/22) + tonal Dán inside
│ │ (1) Tin 1 · dạ mình gửi mvđ của Giao Hàng Nhanh… │ │
│ │                       [ ⧉ Chép tin 1 · VI ]      │ │
│ │ (2) Tin 2 · [mã vận đơn]          [ Dán mã ]     │ │ capsule names the missing input until filled
│ ╰──────────────────────────────────────────────────╯ │
│ ╭ Xin hình feedback ─────────────────────────────╮  │ compact copy card
│ ⌄ Câu khác (4)                                      │ Lời chúc kèm · Nhắc chính sách đổi trả · Đã nhận (ngắn) · Cảm ơn gộp 1 tin
│ [ ↺ Xong khách này · Khách mới ]                    │ tonal 44 full width = the eyebrow "Khách mới" action
```

- "Nhắc chính sách đổi trả" has no text (`return-policy` is empty) → keeps today's behaviour: a nav row whose tap shows the toast "Nhớ gửi đính kèm" (no copy capsule on a card that has nothing to copy).
- Tap counts: payment confirmed = 2 on the stage (tin 1, tin 2). Tracking = Dán (1), tin 1 (2), tin 2 (3).

---

## 8. Audit: every current control in the quick-reply area → problem → fix

| # | Current card / control (where) | Problem | v6 fix (§) |
|---|---|---|---|
| 1 | Title "Trả lời nhanh" + stage description line (all stages, 7.webp, 8.webp) | The title never says where she is; the description repeats the stage name and costs 20 pt. | Eyebrow "BƯỚC n/5" + stage name as title (v5); description dropped (§4.1). |
| 2 | Stage switcher, rose outline on the selected stage | Reads as error; no memory of what was already sent. | v5 segmented + ✓ marks for done stages (§4.4). |
| 3 | First-run hint "Chọn bước, chạm tin nhắn, rồi chạm Chép." | An instruction instead of an obvious UI. | Deleted; the copy card shows the message and its capsule (§6). |
| 4 | Chào hỏi · card "Khách mới" → sheet | 2 taps; the product is chosen inside the sheet. | Hero card variant "Khách mới" with the context product in it (§7.1). |
| 5 | Chào hỏi · card "Khách cũ" → sheet | Duplicate of 4 with another template. | Variant "Khách cũ" of the same card. |
| 6 | Chào hỏi · card "Gửi thông tin mẫu" (3 chips + "Mẫu khác…") | Third path to the same text; chips have no verb; ranking changes between renders. | Variant "Chỉ thông tin" + strip (§7.1, §5.3). |
| 7 | Greeting sheet "Kèm thông tin mẫu (tuỳ chọn)" with **two "Mẫu" groups** (6.webp) | The duplicate bug (§1.1); "Không kèm" lands mid-list; chips 5 deep. | Hotfix P0; v6 sheet has a context row only, never product chips (§6.4). |
| 8 | Greeting sheet box top cut off under the header (6.webp: the box has no visible top edge) | The body scrolls under the sheet header without a separator; the box's first line is hidden. | Sheet body starts 8 pt below the header; the header gets the 0.5 pt hairline when the body is scrolled (`.shb.scrolled`). |
| 9 | "Chạm vào khung để sửa trực tiếp" | Instruction text (v5 bans it). | v5 "✎ Sửa". |
| 10 | Rose "Chép · VI" | v5 colour rule. | v5 primary. |
| 11 | Tư vấn size · "Xin số đo" card (opens sheet) | 2 taps for a fixed sentence. | Compact copy card, 1 tap; also a switch in the size hero (§7.2). |
| 12 | Tư vấn size · "Gửi bảng size" (instruction "Chạm một mẫu rồi chạm Chép", 3 chips + "Mẫu khác…") (8.webp) | Chips are product names with no photos; 3 arbitrary picks; one product only; the chart is not visible; a set's two charts need two trips. | Hero card that **shows the chart**, multi-product, strip with photos and pair suggestions, picker with "Set hay hỏi" (§7.2). |
| 13 | Tư vấn size · "Vừa size" / "Giữa 2 size" cards, previews with "…" for the placeholders (8.webp) | The preview hides exactly what is missing; the size is chosen in another sheet. | Size segmented inside the card, preview with `[size]` tokens, capsule "Chọn size" (§7.2). |
| 14 | "› Thêm" toggle | Vague word, chevron rotates sideways. | "⌄ Câu khác (n)" (v5 wording) with ⌄/⌃. |
| 15 | Message sheet size chips "S M L" | Pills with no verb (v5 bans). | Segmented 44, inside the card. |
| 16 | Xin thông tin · 2 cards → sheets | 2 taps each for fixed sentences. | Compact copy cards, 1 tap; "Dán vào đơn" hand-off row (§7.3). |
| 17 | Tạo đơn · "1 · Món trong đơn" + "Đơn mới" (7.webp) | Opens on an empty list; "Đơn mới" resets only the order. | Message first; "Khách mới" is the global reset (§7.4, §4.3). |
| 18 | Tạo đơn · "Chưa có món nào. Chạm size bên dưới để thêm." | Instruction text. | Empty state = strip with photos + `[món]` token in the message. |
| 19 | Tạo đơn · inline search "Tìm mẫu để thêm…" | A second search field on the stage, keyboard pushes the whole page. | Search lives in the picker sheet. |
| 20 | Tạo đơn · "Mẫu gần đây": 4 products × (photo, name, price, S/M/L pills) ≈ 125 pt each (7.webp) | 500 pt of list before shipping; the pills add qty silently (D4). | Deleted. "＋ Thêm món" → picker with size in the tray (§5.2). |
| 21 | Tạo đơn · pills "S · 1" count suffix | Count hidden in a pill. | Stepper on the line. |
| 22 | Tạo đơn · tap a line to expand (`.lexp`) sizes, stepper, "Xoá" | Hidden controls; v5 wanted a sheet. | Always-visible size segmented + stepper + ✕ on the line (§7.4). |
| 23 | Tạo đơn · "2 · Phí ship" 4-way segmented ("Trả shipper / 25.000đ / Freeship / Khác") | Cramped at 393 (labels truncate), 4 numbers fighting. | Dropdown row + radio sheet (§7.4). |
| 24 | Tạo đơn · "3 · Thông tin nhận" always-open textarea + floating paste icon | Optional field takes 100 pt; icon-only button. | Collapsed row with a labelled "📋 Dán" (§7.4). |
| 25 | Tạo đơn · bank switch / "Thêm STK để kèm vào đơn" | Fine. | Kept, after receiver info. |
| 26 | Tạo đơn · "4 · Tin nhắn chốt đơn" box + lead chips at the bottom | The thing she came for is last. | Message card at the top; opening line in the Sửa tin sheet (§7.4). |
| 27 | Tạo đơn · green "Đã kèm hướng dẫn…" / red "Tin chưa có hướng dẫn…" | Always-on status line; red for a notice. | Grey ⓘ notice only when missing. |
| 28 | Tạo đơn · "Khách đã chuyển khoản?" card after copy | Fine but easy to miss. | Kept as a nav row + toast action "Tiếp: Check out". |
| 29 | Tạo đơn · floating footer "Chưa có món 0đ / Chép đơn" (7.webp) | Sticky inside the flow, translucent: it sits on top of list rows at rest, text shows through it and through the 8 pt gap above the nav. | Opaque dock outside the flow, reserved padding, scrim band (§7.4). |
| 30 | Check out · 5 separate cards (Đã nhận, Cảm ơn, Mã vận đơn tin 1, tin 2, feedback) | Pairs that are always sent together are split; the code is typed in a sheet. | 2 sequence cards with "Tiếp theo" + 1 compact card (§7.5). |
| 31 | Check out · "Có sẵn / May đo" chips in the sheet | Chips; v5 wants segmented. | Segmented inside tin 2, auto-selected. |
| 32 | "Đơn" nav button badge = qty of all lines | Will count sizeless "asked about" products once context = lines. | Badge counts lines with a size (§3). |
| 33 | Any card / chip, fast double tap | Two identical sheets (D2). | `openSheet` guard (§9). |
| 34 | `st.ctx` 20-minute memory used to prefill silently ("Lấy từ …" footnote) | Invisible state that expires; products appear "from nowhere". | Visible, persistent context bar; explicit reset (§5.1). |

---

## 9. Duplicate-proofing: the idempotent-render contract (binding)

1. **One owner per region.** Each region has one render function that replaces the innerHTML of one stable container: `#stage` (stage body), `#ctxbar`, `[data-card="<id>"]` (one card), `#odock`, `#tray` (picker footer). No `+=`, `append`, `insertAdjacentHTML` into live regions. A state change re-renders the smallest owning region **once** (strip tap → its card + `#ctxbar`; size segmented → the card(s) using it + `#odock`).
2. **Keyed rows.** Every repeated row carries a key attribute (`data-row`, `data-card`, `data-pid`, `data-line="<pid>:<size>"`). Row lists are built from a de-duplicated key array (`uniq()`), never from two concatenated sources.
3. **Sheets.** `openSheet(kind, key, …)`: if the top sheet has the same `kind` and `key`, return it; any push within 350 ms of the previous push is ignored. `rerender(s)` replaces `s.el` content (already true).
4. **Frozen suggestion lists.** Strip and picker sections are computed once per stage render / sheet open and stored on the render state; taps toggle checks in place, so nothing reorders under her finger.
5. **Toggles, not increments.** Picking is idempotent (select/unselect). The only increments are the stepper's + / −.
6. **Debug assert.** With `#debug=dupes`, after every render `assertUnique(root)` checks that no two siblings share a key attribute and that no `.frow`, `.mcard`, `.ctxbar`, `.pstrip` appears twice under its owner; failures log `console.error('dupe', key)`. UI tests run with this hash and fail on any such error.

---

## 10. Tap counts (honest, asserted)

Counted from the stage already open; add **1** from Home (tile) or from another stage (segment).

| Job | Context already set | Context empty |
|---|---|---|
| Greet new customer + product info | **1** (Chép) | **2** (strip photo, Chép) |
| Greet returning customer + info | 2 (variant, Chép) — 1 if "Khách cũ" was last used | 3 |
| Product info only | 2 (variant, Chép) | 3 |
| Size chart, 1 product | **1** | **2** (strip photo, Chép) |
| Size charts, 2 products ("Lace Top + Lace Skirt") | 1 | **3** (photo, photo, Chép); 4 via picker set cell |
| Product not in the strip | — | 4 (Tất cả, photo, Xong, Chép) + typing if searched |
| Vừa size with a size | 1 if the line has its size, else 2 (size, Chép) | 3 |
| Xin số đo / Xin thông tin giao hàng / phí ship | 1 | 1 |
| Order recap, lines already have sizes | **1** (dock); 2 from anywhere via the "Đơn" button | — |
| Order recap from an empty order, 1 product | — | 3 (strip photo, size, Chép) |
| Order recap, product not in the strip | — | 5 (＋ Thêm món, photo, size, Thêm, Chép) |
| Payment confirmed (2 bubbles) | 2 | 2 |
| Tracking (paste code, 2 bubbles) | 3 | 3 |
| New customer reset | 1 | — |

The **whole common flow** for one product with size M, from a cold app: Home tile Chào hỏi (1), strip photo (2), Chép (3) · segment Tư vấn size (4), Chép chart (5) · Vừa size: size M (6), Chép (7) · segment Xin thông tin (8), Chép (9) · "Đơn" (10), Chép đơn (11) · Check out from toast (12), tin 1 (13), tin 2 (14). Round 4 needed ≥ 23 for the same path (two sheets per message, product chosen four times).

---

## 11. Microcopy (Vietnamese)

| Key | Text |
|---|---|
| qr.eyebrow | Trả lời nhanh · Bước {n}/5 |
| qr.reset | Khách mới |
| qr.reset.toast | Đã sang khách mới · [Hoàn tác] |
| qr.done.aria | {Chào hỏi}, đã gửi |
| ctx.cap | Khách đang hỏi |
| ctx.cap.n | Khách đang hỏi · {4} mẫu |
| ctx.cap.stale | Từ {3} giờ trước · vẫn khách này? |
| ctx.empty | Chưa chọn mẫu |
| ctx.choose / ctx.change | Chọn / Đổi |
| ctx.removed | Đã bỏ {Butter Top} khỏi khách đang hỏi · [Hoàn tác] |
| pk.title.context | Khách đang hỏi mẫu nào? |
| pk.sub.context | Chọn 1 hoặc nhiều mẫu. Size chọn sau cũng được. |
| pk.title.order | Thêm món vào đơn |
| pk.sub.order | Chạm ảnh, rồi chọn size ngay bên dưới. |
| pk.title.size | Gửi bảng size mẫu nào? |
| pk.sub.size | Chọn 2 mẫu để gửi cả hai bảng trong một tin. |
| pk.search | Tìm tên, màu… |
| pk.sec | Gần đây · Set hay hỏi · {Summer 26} · {10} · Kết quả · {n} |
| pk.inOrder | Trong đơn |
| pk.pickSize | Chọn size |
| pk.remove.aria | Bỏ {Lace Top} |
| pk.cta.context | Xong · {2} mẫu |
| pk.cta.order | Thêm {2} món vào đơn |
| pk.cta.none | Chọn ít nhất 1 mẫu |
| pk.cta.needSize | Chọn size cho {1} món |
| pk.limit | Tối đa 4 mẫu một lần — bỏ bớt một mẫu nhé |
| strip.cap0 | Khách hỏi mẫu nào? Chạm ảnh để kèm vào tin. |
| strip.cap1 | Khách hỏi thêm mẫu? Chạm để gửi cả hai. |
| strip.capSize | Gửi bảng size mẫu nào? Chạm ảnh, chọn 2 mẫu để gửi cả hai. |
| strip.capOrder | Khách mua mẫu nào? |
| strip.all | Tất cả mẫu |
| strip.addMore | Thêm mẫu |
| card.copy | Chép · {VI} |
| card.copyN | Chép tin {1} · {VI} |
| card.edit | Sửa |
| card.edited | Đã sửa |
| card.more / less | Xem hết · {14} dòng / Thu gọn |
| card.need.size / item / code / link | Chọn size / Chọn mẫu / Dán mã / Thêm link |
| card.need.edited | Còn chỗ trống |
| card.need.edited.note | Xoá hoặc điền chỗ trong ngoặc [ ] rồi chép. |
| card.missing | Chưa có bản {EN} của tin này. · [Chép bản VI] · [Thêm bản EN] |
| card.partial | {Lace Skirt} chưa có bảng size {EN} — tin chỉ có {Lace Top}. |
| card.long | {2} tin · tin dài |
| tok | [món] · [size] · [giá] · [tổng] · [mã vận đơn] · [link hình] |
| greet.title | Chào khách |
| greet.seg | Khách mới · Khách cũ · Chỉ thông tin |
| greet.meta | {1} mẫu / Chưa kèm mẫu |
| size.title | Gửi bảng size |
| size.ask | Kèm câu xin số đo |
| fit.item / fit.size | Mẫu / Size |
| between.a / between.b | Vừa vặn / Thoải mái |
| more | Câu khác ({n}) |
| info.paste | Khách gửi địa chỉ rồi? Dán vào đơn |
| ord.title | Tin chốt đơn |
| ord.lines | Món trong đơn · {2} |
| ord.add | Thêm món |
| ord.remove.aria / toast | Bỏ món {Lace Top} / Đã bỏ {Lace Skirt} · [Hoàn tác] |
| ord.merge | Đã gộp vào {Lace Top · M} |
| ord.ship | Phí ship |
| ord.ship.opts | Khách trả shipper · {25.000đ} · Miễn phí · Khác… |
| ord.ship.custom | Nhập phí ship |
| ord.recv | Thông tin nhận (tuỳ chọn) |
| ord.recv.ph | Tên, SĐT, địa chỉ khách gửi… |
| ord.paste | Dán |
| ord.bank | Kèm số tài khoản |
| ord.bank.add | Thêm STK để kèm vào đơn |
| ord.noteMissing | Tin chưa có hướng dẫn ghi tên Instagram khi chuyển khoản. |
| ord.dock.none | Chưa có món · 0đ · [Chọn món] |
| ord.dock.total | Tổng · {2} món |
| ord.dock.cta | Chép đơn · {VI} |
| ord.copied | Đã chép đơn · {850.000đ} · {VI} — Nhớ gửi mã QR nhé · [Tiếp: Check out] |
| ord.post | Khách đã chuyển khoản? Sang Check out |
| out.pay | Xác nhận thanh toán |
| out.pay.t1 / t2 | Tin 1 · Đã nhận / Tin 2 · Cảm ơn |
| out.variant | Có sẵn · May đo |
| out.track | Gửi mã vận đơn |
| out.track.field | Mã vận đơn |
| out.feedback | Xin hình feedback |
| out.progress | Đã chép {1}/{2} |
| out.next | Tiếp theo |
| out.end | Xong khách này · Khách mới |
| toast.copied | Đã chép · {Chào khách} · {VI} — action [Tiếp: {Tư vấn size}] (only when the next stage is not done) |
| home.resume | Đang trả lời: {Lace Top + Lace Skirt} · Bước {2} |

---

## 12. Compose and code changes (for the implementer)

`src/compose.js` (pure; preview == clipboard stays the rule):

```js
// new actions in composeCopy(action, ref, l)
'greet'  ref {v:'new'|'back'|'info', pids:[...], sel}
         'new' → FM['open-first'], 'back' → FM['open-returning'], 'info' → no greeting (lead 'info' allowed)
         {{itemInfo}} = pids.map(desc in l).filter(Boolean).join('\n\n'); no pids → greetOnly(template)  (move greetOnly here)
         out.partial = pids without desc in l; out.bubbles = split at 1000 chars per product block (else null)
'sizes'  ref {pids, sel, ask}
         1 pid: lead('size') + chart; ≥2: lead + pids.map(pname(p,l) + '\n' + chart).join('\n\n'); ask → + '\n\n' + ask-measurements(l)
         out.partial = pids without chart in l; all missing → out.missing
'entry'  ref {tid, pid, fills:{size,sizeA,sizeB,trackingCode,imageLinks}}
         resolve tokens like app.js resolve(); unfilled → '[' + word + ']'; out.pending = [keys]
'order'  (existing) linesText: L.size null → 'size [size]'; no lines → '• [món] – size [size]: [giá]' and total '[tổng]';
         out.pending = ['item'] | ['size'] accordingly
```

`calc()` keeps counting sizeless lines in the total (price does not depend on size). Add `readyCount()` = lines with a size (badge).

`src/app.js`:
- Delete: `ctx()/setCtx()/setCtxQuiet()/ctxLabel()`, `candidates()`, `qcard()` chip branch, `oresHtml()`, `olinesHtml()` expand branch, `oshipHtml()` segmented, the greeting branch of `renderMsg` fill rows, `pickadd` timer close.
- Add: `ctxBarHtml()`, `openPick(mode)` + `pickGridHtml()` + `trayHtml()`, `stripHtml(cardId, mode)`, `mcardHtml(def)` + `paintCard(id)`, `seqCardHtml()`, `orderDockHtml()`, `shipSheet()`, `newCustomer()`, `openSheet()` guard, `assertUnique()` (debug), `CARDS` cache `{id: {text, pending, missing}}` filled at render.
- STAGES in `compose.js` gain `hero` and `kind` per card: `{id:'greet-hero', kind:'greet'}`, `{id:'size-hero', kind:'sizes'}`, `{id:'fit-size', kind:'entry', inputs:['item','size']}`, `{id:'between-sizes', kind:'entry', inputs:['sizeA','sizeB']}`, `{kind:'seq', id:'pay', items:['paid-ack', ['paid-thanks','thanks-custom']]}`, `{kind:'seq', id:'track', items:['tracking-note','tracking-code'], field:'trackingCode'}`. `open-first`, `open-returning` and the info chip card leave the list (kept in data for the compose).

`src/app.css`: `.ctxbar`, `.pgrid`, `.pcell`, `.pcell.sel .ck`, `.ppair`, `.tray`, `.pstrip`, `.mcard`, `.mcard .pv` (clamp + fade), `.tok`, `.odock`, `#qr.o::after` scrim, `.lrow2` (line second row), `.shb.scrolled` header hairline. Delete `.chipc`, `.chips` in stages, `.orow`, `.lexp`, `.ofoot` (renamed `.odock`), `.ores`, `.oadd`.

**Performance note.** The copy path is unchanged: a click on a capsule reads `CARDS[id].text` (or the card's edit) that was composed at render time and calls the same synchronous `copy()` → `navigator.clipboard.writeText` with `legacyCopy` fallback. No compose, layout or storage work runs before the write. Rendering a stage composes ≤ 7 texts (string work, < 1 ms at 4× CPU). A strip tap repaints one card and the context bar (no stage re-render). The picker renders ≤ 20 cells + ≤ 6 pairs; images use `imgOf(p, true)` (320 px webp) with `loading="lazy"`, `decoding="async"` and fixed width/height so nothing shifts. Budgets (v5 §10 kept): copy handler median < 3 ms at 4×, picker open < 40 ms to the second frame, strip tap → card repaint < 8 ms, typing < 2 ms, bundle + ≤ 8 KB gzip over v5.

---

## 13. Edge cases

| Case | Behaviour |
|---|---|
| No product chosen | Context bar "Chưa chọn mẫu · Chọn ⌄". Greeting = greeting only (meta "Chưa kèm mẫu"), copyable. "Chỉ thông tin", size hero, Vừa size, Giữa 2 size: capsule "Chọn mẫu" (scrolls to the strip). Order: `[món]` line, dock "Chọn món". |
| 5th product | Not possible: picker and strip disable further picks with the toast "Tối đa 4 mẫu…". |
| Same product, two sizes (customer buys S and M) | Two lines in Tạo đơn (picker merges only the same pid+size). Context bar "Lace Top · S, M". Size chart sends Lace Top once. |
| Size not chosen | Message shows `[size]`; dock disabled "Chọn size cho n món"; Vừa size capsule "Chọn size". |
| Product has one size only | Preselected everywhere; no hint. |
| Language missing (EN) for the whole message | Notice + "Chép bản VI" + "Thêm bản EN" (opens Tuỳ chỉnh at that text), v5 pattern. |
| EN missing for one of two products | That block is left out; notice names it; capsule still "Chép · EN". |
| Unfilled placeholder after editing | Capsule "Còn chỗ trống" disabled + notice; deleting the brackets enables it. |
| Edited text, then the context changes | The edit is dropped with the v3 toast "Tin đã cập nhật theo lựa chọn mới · Hoàn tác" (only for cards whose text depends on what changed). Edits live per card per language until "Khách mới". |
| Edited text, then language switch | Edits are per language: the EN edit slot starts from the generated EN text; switching back restores the VI edit. |
| Message > 1,000 characters | Greeting splits into bubbles by product (§7.1). Size hero with 3–4 charts: same rule, meta "2 tin · tin dài". Order recap is never split. |
| Truncated source text | v5 guard on the capsule ("Chạm lại để chép"). |
| Saved set in the order at set price | Notice under the lines "ⓘ Đơn có đủ set Lace Top + Lace Skirt (giá set 850.000đ)." with switch "Tính giá set" (P4, optional): when on, the two lines print as one "• Set Lace Top + Lace Skirt – size M/S: 850.000đ". Off by default. |
| Product removed from data / unknown pid in storage | Filtered out at boot (silent); context bar shows what remains. |
| Stale context (> 2 h) | Caption "Từ 3 giờ trước · vẫn khách này?"; nothing auto-clears. |
| Clipboard refused (Dán) | Field focuses; iOS shows its paste menu; no error toast. |
| Clipboard write fails | v5 rollback + "Chép tay" sheet (unchanged). |
| Keyboard open on Tạo đơn | Bar hidden, dock at 8 pt above the keyboard, focused field scrolled into view (v3 behaviour). |
| Reduced motion | No flash on tokens/segments, instant scroll, 150 ms cross-fades only. |
| VoiceOver | Copy card = group named by its title; capsule "Chép Chào khách, tiếng Việt"; preview "Tin sẽ gửi: …, chạm hai lần để sửa"; picker cells "Lace Top, 380.000đ, đã chọn"; strip cells "Kèm Lace Top vào tin". |

---

## 14. Build plan (for a cheaper implementer)

**Prerequisite:** v5 P0–P3 merged (tokens, insets, segmented, dropdown row, editable box, picker, bubble card). v6 only adds components on that base. Run after each step: `python3 build.py && node --test tests/compose.test.mjs && node tests/ui/ui.mjs && node tests/ui/round4.mjs` (+ `round6.mjs` once it exists).

### P0 — duplicate hotfix (0.25 day, can ship on the current build today)
1. `renderMsg`: de-duplicated `rowKeys` (§1.1); `fillRow` adds `data-row`.
2. `pushSheet` → wrap as `openSheet(kind, key)` with the same-key and 350 ms guards; call sites `data-open`, `pchip`, `pchoose`, `pickfill`, `setpick`, `setnew`.
3. `pickadd`: ignore taps while `s.closing` or within 300 ms of the last add in that sheet.
4. Test `tests/ui/dupes.mjs`: Khách mới sheet → tap each chip and "Không kèm" → exactly one `[data-row=item]`, one "Không kèm" as its first chip; double-tap (2 taps 40 ms apart) on a stage card and a product chip → `#sheets .sh` count 1; double-tap `pickadd` → line qty 1.
**Accept:** her 6.webp sequence reproduces with one group only, at 393 and 430.

### P1 — model and compose (0.5 day)
1. `compose.js`: `greet`, `sizes`, `entry` actions; order tokens and `pending`; `greetOnly` moved in; `readyCount`. STAGES card definitions (§12).
2. `app.js` boot migration (`st.ctx` → line; `st.draft.done`, `at`; `st.ui.greetV`, `sizeAsk`); delete `ctx*` helpers.
3. Unit tests: greet 3 variants × 0/1/2 products × VI/EN; sizes 1/2 products with and without lead and ask, labelled blocks; partial EN; order with sizeless line → `[size]` + pending; empty order → `[món]`; > 1000 char split boundaries at product blocks; migration.
**Accept:** all old compose tests still pass; `composeCopy('sizes', {pids:['lace-top','lace-skirt-cream']}, 'vi').text` starts each block with the product name.

### P2 — shared components (1 day)
1. Context bar (§5.1), sticky block (§4.1), "Khách mới" (§4.3), ✓ marks (§4.4).
2. Picker sheet: grid, sections, pair cells, search, category segmented, toggle, tray with size, commit rules (§5.2).
3. Strip (§5.3) with frozen suggestions.
4. Copy card `.mcard` with clamp, tokens, capsule states (§6.1–6.2); `CARDS` cache; `paintCard(id)`.
5. Sửa tin sheet wiring (§6.4): context row, per-card edit slots.
**Accept:** context bar states screenshot-match §5.1; picker tap twice = unselected; tray rows = selected count; no layout shift when images load (CLS 0 in the test).

### P3 — stages 1, 2, 3, 5 (1 day)
1. Chào hỏi hero (§7.1) with the 1,000-char split.
2. Tư vấn size hero + Vừa size + Giữa 2 size + Xin số đo + Câu khác (§7.2).
3. Xin thông tin + paste hand-off (§7.3).
4. Check out sequence cards + tracking field + end button (§7.5).
5. Toast action "Tiếp: {stage}"; home resume row.
**Accept:** §10 tap counts asserted; preview == clipboard for every card × VI/EN × 0/1/2 products × edited/unedited.

### P4 — Tạo đơn (1 day)
1. Message card on top, lines with inline size + stepper + ✕, "＋ Thêm món", ship dropdown + radio sheet, collapsed receiver row with Dán, bank switch, notice (§7.4).
2. Dock outside the flow + reserved padding + scrim band; keyboard behaviour.
3. Optional: set-price switch (§13).
**Accept:** §15 geometry checks.

### P5 — tests and screenshots (0.5 day)
`tests/ui/round6.mjs` at 393 × 852 and 430 × 932, light and dark, with `#debug=dupes`; screenshots listed in §16; update `docs/v2-report.md` with a "Round 6" section (numbers, deviations, "needs a real iPhone": the 1,000-character limit, clipboard read prompt in standalone mode, dock above the keyboard).

---

## 15. Acceptance criteria

1. **No duplicates.** Under `#debug=dupes`, zero `dupe` console errors across the full flow script (§10 cold path) and 200 random taps (seeded) on Trả lời nhanh and its sheets. `document.querySelectorAll('[data-row=item]').length ≤ 1` in every sheet at every step. Double-tap on any card, row, strip cell or picker cell never yields two sheets or qty 2.
2. **One product choice.** After choosing Lace Top · M + Lace Skirt in Chào hỏi, without any other input: the greeting includes both infos; the size hero shows both charts labelled; Vừa size shows size M for Lace Top; Tạo đơn shows both lines with Lace Top · M and Lace Skirt waiting for a size.
3. **Message first.** On every stage the first card's preview top edge is ≤ 340 pt from the top of the viewport (430 and 393), and on Tạo đơn the full order message (unclamped up to 10 lines) and the dock are both visible on open at 393 × 852.
4. **Dock geometry.** Dock bottom = bar top + 8 ± 1; dock and bar never intersect; at max scroll the last element's bottom ≤ dock top − 16; the 8 pt gap between dock and bar shows only `--bg-grouped` (pixel scan); the dock's computed background alpha = 1.
5. **Card contract.** Every `.mcard` has exactly one capsule or none (Tạo đơn message), the capsule's accessible name starts with a verb, and tapping the card background changes nothing (no handler on `.mcard` itself).
6. **Size chart.** "Lace Top + Lace Skirt" from an empty context = 3 taps (asserted), clipboard contains "Lace Top\n" and "Lace Skirt · Kem\n" (VI) blocks in that order.
7. **Tokens.** No copy is possible while `[…]` remains (capsule disabled or verb-redirect); the dock names the missing size count.
8. **Tap counts** in §10 asserted at 393 and 430.
9. **Preview == clipboard** for every card, every variant, VI/EN, with and without edits, with and without opening line.
10. **Performance** budgets in §12 hold at 4× CPU; zero console errors; no horizontal overflow; every hit target ≥ 44 × 44; no rose hex (v5 grep).

---

## 16. QA checklist (screenshots at 393 × 852 and 430 × 932, light and dark)

Screens to shoot (`shots/{393,430}-{light,dark}-v6-*.png`):

- [ ] `greet-empty` — Chào hỏi, empty context: greeting-only preview, strip caption "Khách hỏi mẫu nào?", context bar "Chưa chọn mẫu".
- [ ] `greet-one` — after one strip tap: info in the preview, check on the tapped cell, context bar updated, strip did not reorder.
- [ ] `greet-two-long` — two long products: "2 tin · tin dài" sequence.
- [ ] `picker-context` — grid, Gần đây, Set hay hỏi, 2 selected, tray.
- [ ] `picker-order-tray` — one tray row without size, primary disabled "Chọn size cho 1 món".
- [ ] `picker-search-empty` — "Chưa tìm thấy …".
- [ ] `size-empty` — size hero with strip and "Chọn mẫu" capsule.
- [ ] `size-two` — Lace Top + Lace Skirt charts labelled, switch "Kèm câu xin số đo" off/on.
- [ ] `size-fit` — Vừa size with item switcher (2 products) and size M.
- [ ] `info` — Xin thông tin cards + paste row.
- [ ] `order-empty` — `[món]` message, strip, dock "Chọn món".
- [ ] `order-sizeless` — `[size]` token, one line without thumb, dock "Chọn size cho 1 món".
- [ ] `order-ready` — dock primary, total; no content visible between dock and bar.
- [ ] `order-scrolled-end` — last row fully above the dock.
- [ ] `order-ship-sheet` — radio sheet, "Khác…" input.
- [ ] `order-receiver-open` — expanded field with pasted text; keyboard emulation shot with the dock above the keyboard.
- [ ] `checkout` — two sequence cards, "Tiếp theo" ring on tin 1; after tin 1 copied, ring on tin 2.
- [ ] `edit-sheet` — Sửa tin with context row, one fill row, edited state.
- [ ] `stage-done-marks` — ✓ on Chào hỏi and Tư vấn size, thumb on Tạo đơn.
- [ ] `new-customer-toast` — after "Khách mới" with Hoàn tác.

Visual checks on each shot:

- [ ] One product selection UI per screen (context bar or strip or picker) — never chips inside a message sheet.
- [ ] Every copyable message is visible as text before copying; capsule says "Chép · VI/EN" or the missing input's verb.
- [ ] Copy (capsule) vs open (› row, preview box) are visually different on every card.
- [ ] Circles only for product photos (v5); check discs use `--primary`, no coloured rings.
- [ ] Tokens `[size]` grey with dashed underline in the preview, plain in the textarea.
- [ ] Dark: dock `#2A2B2A` solid, scrim `#1C1D1C`, Vanilla primary with Jet text; light: Davy's Grey primary.
- [ ] 16 pt gutters at 393, 20 at 430; 12 pt between preview and capsule row; 16 between cards.
- [ ] Nothing truncated that matters: context value ellipsis only after the first product name.

Behaviour checks:

- [ ] Her three screenshots' sequences (6, 7, 8.webp) replayed: no duplicate groups; Tạo đơn opens on the message; size chart shows the chart.
- [ ] "Khách mới" resets context, order, edits, ✓ marks; Hoàn tác restores all of it.
- [ ] Language switch keeps context and per-language edits.
- [ ] Copy works offline and in standalone mode; first-copy tip (v5) still shows 3 times.
- [ ] VoiceOver reads context bar, card capsules, picker selection state and the dock total.
