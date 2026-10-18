# Soft Embrace CS — UX/UI Design Spec

**Product:** a PWA ("Add to Home Screen" on iPhone) the Soft Embrace founder uses to answer Instagram DMs quickly: she picks a canned text, taps once to copy it, and pastes it into Instagram.
**Replaces:** copying by hand from the Google Sheet "CS Flow".
**Targets:** iPhone 14 Pro (393 × 852 pt, safe-area top 59 / bottom 34) and iPhone 15 Pro Max (430 × 932 pt, safe-area top 59 / bottom 34). Portrait only.
**Status:** Final design direction, version 1.0. Builders implement this spec as written. Each item is a decision, not a menu of options.
**Language:** The spec is in English. All UI copy is in Vietnamese and appears in quotes exactly as it should ship.

---

## 0. Decisions at a glance

| Topic | Decision |
|---|---|
| Tabs | 3 tabs: **Mẫu** (products, sets, greetings), **Kịch bản** (flow scenarios), **Đơn** (order composer). Search is a separate circular button next to the tab bar, as in the iOS 26 search tab. Settings opens as a sheet from the leading nav button on Mẫu. |
| Core gesture | Each row has a trailing **copy button** that copies in one tap. Tapping elsewhere on the row opens the detail sheet. Long-press opens a context menu. Swipe opens quick actions. |
| Speed device | **"Đang tư vấn" context**: the last product and size she handled auto-fill `[item]` and `[size]` placeholders and pre-fill the order. |
| Language | A global segmented control **VI \| EN** sits in the nav bar. It is sticky, and every toast states the language used. |
| Accent | One accent: **Rosewood** (dusty rose) `#9A5654` in light mode and `#D89A94` in dark mode. |
| Type | SF Pro via `-apple-system` for all UI. New York via `ui-serif` (Georgia as fallback) only for large titles, sheet titles, the greeting and empty-state titles. No web fonts. |
| Stack | One `index.html` with inline CSS, inline vanilla JS and inline JSON data, plus `manifest.webmanifest`, `sw.js` and icons. No framework. |
| Perf | Interactive in under 100 ms from a warm launch. HTML of 45 KB or less gzipped. Animation uses only `transform` and `opacity`. |

---

## 1. Design principles

### 1.1 Mapping Apple HIG principles to this app

| HIG principle | What it means here | Concrete rule |
|---|---|---|
| **Clarity** | The text she copies is the content. Nothing should compete with it. | Previews use Body 17 / Subhead 15 on a "paper" card. Every row has one primary verb: copy. A screen never shows more than 2 filled buttons. |
| **Deference** | The UI recedes and the brand shows through warmth, not decoration. | Hairline separators, translucent bars, no drop shadows on list content, no gradients on UI surfaces, no illustrations in working views. |
| **Depth** | Layers tell her where she is. | Sheets slide over a dimmed and scaled background. Context menus lift the row. Tab bar and nav bar are materials floating above content. |
| **Direct manipulation** | Text, rows and sheets respond to her fingers. | Sheets follow the finger with rubber-banding. Rows can be swiped. Placeholder tokens in a preview can be tapped to fill them. |
| **Feedback** | Every copy is confirmed without question, because she leaves the app right after. | Optimistic "copied" state within 1 frame: the icon turns into a seal with a checkmark, a toast reads "Đã chép · Lace Top · VI", and a haptic fires where available. |
| **Consistency** | Native iOS patterns only, so nothing has to be learned. | Large titles, inset grouped lists, segmented controls, sheets with detents, context menus, swipe actions and the system switch. No custom patterns where a native one exists. |
| **Reachability** (one-handed) | Primary actions sit in the bottom 40% of the screen. | Tab bar, search, sheet action bars, order total bar and the fill-sheet "Chép" button are all in the thumb zone (y > 510 on 852). The top zone holds only rarely used actions (settings, close, language). |

### 1.2 Mapping brand values to the app

| Brand value / trait | Translation into the app |
|---|---|
| **Unhurried Elegance** | Motion is soft and never fast-cut: springs with no more than 3% overshoot. She works quickly, but the screen stays calm. |
| **Considered Form** | Strict 8pt grid, one accent, a type scale with 7 sizes and nothing more. Every element earns its place. |
| **Mindful Creation** | Microcopy is short, warm and sincere. Delight is quiet: one small seal stamp when she copies, no confetti. |
| **Romantic Calm** voice ("clear whisper") | Vietnamese microcopy uses calm sentence case and soft particles ("nhé", "nha"). Never exclamation marks in UI chrome. |
| **Timeless Elegance** visual | Serif large titles echo the feel of an old letter. The cream and linen palette has a warm, film-like tone. |
| **Nostalgic belonging / quiet confidence** | A gentle time-of-day greeting on the home screen. Empty states read as a soft invitation, not an error. |
| Textures (lace, linen, knit) | Shown through color temperature and the "paper" card only. No texture images, which keeps it fast and avoids clutter. |
| Emojis sparingly | Emojis appear only where the CS Flow sheet already uses them: the product glyph and inside message texts. The UI chrome itself uses none. |

### 1.3 Product principles (tie-breakers)

1. **Copy first, read second.** A row can always be copied without opening it.
2. **Two taps or fewer** from app open for the top 5 tasks. Composing an order is the single exception and is argued in §2.3.
3. **Never lose a draft.** Order drafts, filled placeholders and edits persist on every change.
4. **No dead ends.** Every sheet can be dismissed by swiping down, and every destructive action can be undone through a toast.
5. **She is always right.** The text she sees is exactly the text that gets copied. The preview is WYSIWYG, including line breaks and emojis.

---

## 2. Mental model & information architecture

### 2.1 Mental model

She thinks in terms of the **customer conversation**, not database objects:

> "She is asking about the Lace Top → send info → she asks about size → ask her measurements → she fits an M → get her address → close the order → she paid → thank her."

The content splits into three kinds of *things she sends*:

1. **About a garment.** Product info, size chart, set info. These are nouns, chosen by *which item*.
2. **About the conversation step.** Greeting, size advice, shipping request, thank-you. These are verbs, chosen by *where we are*.
3. **About this order.** The itemised recap with a total. It is *assembled*, not chosen.

That gives exactly three tabs.

### 2.2 Content model (drives every screen)

```ts
Product {
  id: "lace-top"
  name: "Lace Top"               // shown as-is in both languages
  emoji: "🤍"                     // from the CS Flow sheet
  price: 450000                   // VND integer
  colors: [{ id:"cream", vi:"Kem", en:"Cream", swatch:"#EDE3CF" }, ...]
  sizes: ["S","M","L"]            // or ["F"] for free size
  desc:      { vi: "…", en: "…" } // full product-info message
  sizeChart: { vi: "…", en: "…" } // full size-chart message
  note:      { vi: "…", en: "…" } // internal hint, e.g. upsize advice; NOT copied by default
  fav: false
  order: 3                        // sheet order
}
Set {
  id: "ivory-dot-set"
  name: "Set Ivory Dot"
  items: ["ivory-dot-blouse", "ivory-dot-midi"]
  price: 890000                   // combined set price
  desc: { vi: "…[price]…", en: "…" }   // set message; [price] and [items] auto-filled
}
Scenario {
  id: "size-between"
  step: 2                         // 1 Mở đầu · 2 Tư vấn size · 3 Giao hàng · 4 Chốt đơn · 5 Set · 6 Cảm ơn
  title: { vi: "Giữa hai size" }
  variants: [{ id:"a", label:"Ngắn", text:{ vi:"…[size]…[alt_size]…", en:"…" } }]
}
Settings { lang:"vi", shippingFee:30000, bank:{ name, number, holder }, qrImage:dataURL|null }
Context  { itemId, colorId, size, updatedAt }    // "Đang tư vấn"; expires 20 min after the last update
Recent   { kind:"product-info"|"size-chart"|"set"|"scenario"|"order", refId, lang, at }  // max 8
Draft    { lines:[{productId,colorId,size,qty}], shipping:30000|0|custom, customerText:"", copiedAt|null }
```

**Placeholders.** These use bracket syntax, exactly as in the CS Flow sheet, and are parsed with `/\[([^\]]+)\]/g`.

| Token | Fill source | Control |
|---|---|---|
| `[item]` | Context item, or the last product copied | Product chips (recent 4) + "Chọn…" |
| `[size]`, `[alt_size]` | Context size | Size chips `S M L XL F` (product's sizes when item known) |
| `[alt_item]` | — | Product chips |
| `[color]` | Context color | Color chips of item |
| `[price]`, `[total]`, `[items]`, `[shipping]`, `[bank]` | Computed | None; always auto |
| `[tên]`, `[sđt]`, `[địa chỉ]`, `[số đo]`, any unknown | — | Single-line text field |

**Seed products** (illustrative; the real data is imported from the CS Flow sheet): Soft Halter Top (Trắng / Xanh), Noir Dotty Top, Ivory Dot Blouse, Ivory Dot Midi Skirt, Noir Midi Skirt, Shimmer Top, Lace Top, Lace Skirt (Kem / Đen), Still Cami Top (Trắng / Taupe), Flowy Skirt, Fleur Slip Dress, Butter Top.

**Swatch hexes** for color dots: Trắng `#F7F4EE`, Xanh `#A9BCD0`, Đen/Noir `#1E1B1A`, Ivory `#EFE7D6`, Kem `#EDE3CF`, Taupe `#A8968A`, Butter `#EED9A0`, Shimmer `#D9CBB5`. Each dot has a 0.5px `--separator` ring so white shows on cream.

### 2.3 Tab choice and tap-count analysis

Assumptions: the count starts at "app open, on the default tab", and copying counts as a tap. Scrolling within one screen is not counted, but it is noted.

**Top 5 tasks:**

- **T1** Send product info to a new customer (greeting + info)
- **T2** Send a size chart
- **T3** Reply to a set question
- **T4** Close an order (recap with total), 1 item
- **T5** Thank after payment

| IA option | T1 | T2 | T3 | T4 | T5 | Problems |
|---|---|---|---|---|---|---|
| **A. 3 tabs: Mẫu / Kịch bản / Đơn + search button (chosen)** | **2** | **2** (1 swipe-tap) | **1** | **3** with context / 4 without | **2** (1 if on Đơn) | None significant |
| B. 2 tabs: Thư viện (all texts) / Đơn | 2 | 2 | 1 + long scroll | 3 / 4 | 1 + long scroll | One long mixed list; scenarios bury products. Fails clarity. |
| C. Flow-first: home = steps 1–6 | 3 (step 1 → product → copy) | 3 | 2 | 3 / 4 | 1 | Products are the most frequent noun, and they sit one level deeper. |
| D. 4 tabs (+ Set or Cài đặt) | 2 | 2 | 2 | 3 / 4 | 2 | Settings is used about weekly, so it does not earn a tab. Sets fit naturally under Mẫu. Smaller tab targets. |

**Why A:** It has the lowest total tap count (10 with context, 11 without, against 11–13 for the others). It matches the three content kinds in §2.1. Its 3 tabs plus 1 search button fit in a single thumb-reachable bar.

**T4 exception:** Composing an order is assembly, not selection, so it needs at least: enter (1) + pick item and size (1 per item, because the picker's size chip both adds the item and closes the picker) + copy (1). The context suggestion row merges entering and picking, which brings T4 to 3. A single-item order without context costs 4. Each extra item costs +2.

### 2.4 Navigation map

```
App
├── Tab 1  Mẫu (default on cold launch)
│   ├── [nav leading] Cài đặt  → Settings sheet (large)
│   │                              ├── push: Sửa nội dung › list › edit form
│   │                              └── push: Chuyển khoản › bank + QR
│   ├── [nav trailing] VI | EN
│   ├── Gần đây (recent chips)          → tap = copy
│   ├── Lời chào: Khách mới | Khách quen → tap = copy
│   ├── Yêu thích (fav products)        → row: copy | sheet
│   ├── Set                              → row: copy | set sheet
│   └── Tất cả mẫu                       → row: copy | Product sheet (60% / large)
├── Tab 2  Kịch bản
│   ├── Context chip "Đang tư vấn: Lace Top · M"
│   └── Steps 1–6 → row: copy (if filled) | Message sheet (variants + fill)
├── Tab 3  Đơn
│   ├── "Khách đã chuyển khoản?" thank card (after an order was copied)
│   ├── Context suggestion "Thêm Lace Top · Kem · M"
│   ├── Món (lines) → "Thêm món" → Product picker sheet (large)
│   ├── Phí ship · Thông tin nhận (optional) · Xem trước
│   ├── Floating total bar → "Chép đơn"
│   └── QR sheet (share image)
└── Search button (bottom-right) → Search mode (field docked at bottom, results all kinds)
```

**Launch state:** If the app was backgrounded less than 30 minutes ago, it restores the last tab, its scroll position and any open sheet. Otherwise it opens on **Mẫu**, scrolled to the top. The order draft always persists.

---

## 3. Task flows with tap counts

The notation `⟶` means a tap. `[C]` marks the tap that copies. `✓` marks the toast and seal shown afterwards.

### T1: Send product info to a new customer (2 taps, 2 pastes)

```
Open app (Mẫu)
 ⟶ ① "Lời chào › Khách mới" tile         [C] ✓ "Đã chép · Lời chào khách mới · VI"
   → Instagram, paste, send, back to app (app is still on Mẫu)
 ⟶ ② copy button on "Lace Top" row        [C] ✓ "Đã chép · Lace Top · VI"
   → paste, send
Side effect: Context = { item: Lace Top }
```

*Alternative with one paste:* long-press the row → "Chép kèm lời chào" (one gesture plus one tap). The greeting and info are joined with a blank line.

### T2: Send a size chart (2 taps)

```
Open app (Mẫu)
 ⟶ ① tap "Lace Top" row (outside the copy button) → Product sheet opens at 60%
 ⟶ ② "Bảng size" button (bottom-left of sheet)    [C] ✓ "Đã chép · Bảng size Lace Top · VI"
Power path: swipe row left → "Size" action (1 gesture + 1 tap), or a full swipe (1 gesture).
```

### T3: Reply to a set question (1 tap)

```
Open app (Mẫu) — the "Set" section sits directly after "Yêu thích"
 ⟶ ① copy button on "Set Ivory Dot" row    [C] ✓ "Đã chép · Set Ivory Dot · VI"
Copied text = set.desc with [items] = "Ivory Dot Blouse + Ivory Dot Midi Skirt", [price] = "890.000đ"
```

### T4: Close an order (3 taps with context, 4 without)

```
With context (she was just discussing Lace Top · Kem, size M):
 ⟶ ① tab "Đơn"
 ⟶ ② suggestion row "Thêm Lace Top · Kem · M"     → line added, total updates
 ⟶ ③ "Chép đơn" (floating total bar)               [C] ✓ "Đã chép đơn · 480.000đ · VI"
   → paste, then share the QR (see the QR flow below)

Without context:
 ⟶ ① tab "Đơn"  ⟶ ② "Thêm món" → picker (large sheet)
 ⟶ ③ size chip "M" on row "Lace Top · Kem" → added and sheet closes
 ⟶ ④ "Chép đơn"                                       [C]
Each extra item: +2 (Thêm món, size chip).
Shortcut from Mẫu: in the Product sheet, the "Thêm vào đơn" size chips add in one tap without leaving.

QR flow: the bar after copy shows "Gửi QR" → QR sheet → "Chia sẻ QR" → iOS share sheet → Instagram (3 taps).
Tip shown once: "Lưu QR vào Ảnh một lần, lần sau gửi từ thư viện Instagram cho nhanh nhé."
```

### T5: Thank after payment (2 taps; 1 if already on Đơn)

```
Open app (Mẫu)
 ⟶ ① tab "Đơn"  → top card "Khách đã chuyển khoản?" (shown for 24 h after an order was copied)
 ⟶ ② "Chép lời cảm ơn"                           [C] ✓ "Đã chép · Cảm ơn · VI"
Secondary action on the card: "Đơn mới" clears the draft (with undo toast).
Alternative: Kịch bản › 6 Cảm ơn › copy (2 taps).
```

### T6 (frequent, not top-5): Size advice with a placeholder (1–3 taps)

```
Kịch bản tab, context = Lace Top · M
 ⟶ ① copy button on "Vừa size [size]"   → all placeholders auto-filled from context → [C]
If a placeholder is unfilled: ① opens the Message sheet with fill controls
 ⟶ ② size chip "M"  ⟶ ③ "Chép"                                                       [C]
```

### T7: Ask for shipping info (2 taps)

`⟶ Kịch bản  ⟶ copy on "3 · Xin thông tin nhận hàng"  [C]`

### T8: Switch to English for a foreign customer (+1 tap, sticky)

`⟶ "EN" in the nav bar` → all copies are in EN until she switches back. Toasts and copy buttons show "EN" so a mismatch is visible.

---

## 4. Screen-by-screen spec

**Wireframe scale:** 1 character ≈ 8 pt. Wireframes are drawn at 393 pt. Notes for 430 pt follow each screen.

**Global vertical layout (393 × 852):**

| Zone | y range | Height |
|---|---|---|
| Status bar + Dynamic Island (safe-area top) | 0 – 59 | 59 |
| Nav bar (compact) | 59 – 103 | 44 |
| Large title block | 103 – 155 | 52 (+20 when the greeting is shown) |
| Content | … | scrolls |
| Floating tab bar + search button | 770 – 832 | 62 (bottom edge 20 above screen bottom) |
| Home indicator | 818 – 852 | safe-area bottom 34 (the tab bar overlaps this deliberately, as in iOS 26) |

**Content bottom padding:** `20 + 62 + 16 = 98px`. On Đơn, the total bar adds 64 + 8, for a total of `170px`.

**Horizontal margins:** 16 pt at 393, 20 pt at 430 (`@media (min-width: 414px)`). Cells have 16 pt of inner padding in both cases.

---

### 4.1 Mẫu (Home / Pick)

```
┌─────────────────────────────────────────────────┐
│ 9:41          ⬬ Dynamic Island ⬬         ▂▄▆ ▭ │ 0–59
│ (⚙)                                  ┌────┬───┐ │ 59–103 nav bar
│                                       │ VI │EN │ │  seg 76×32
│                                       └────┴───┘ │
│ Chiều dịu dàng, Embrace                          │ greeting, serif italic 15, label-2
│ Mẫu                                              │ large title, serif 34
│ ───────────────────────────────────────────────  │ (no line; spacing only)
│ Gần đây                                          │ section header 15 semibold
│ (⧉ Lace Top)(⧉ Hỏi số đo)(⧉ Cảm ơn)(⧉ Set I… →  │ chips 36h, horizontal scroll
│                                                  │
│ Lời chào                                         │
│ ╭──────────────────────╮ ╭──────────────────────╮│
│ │ Khách mới            │ │ Khách quen           ││ tiles 64h
│ │ Lần đầu ghé      (⧉) │ │ Đã từng mua      (⧉) ││
│ ╰──────────────────────╯ ╰──────────────────────╯│
│ Yêu thích                                        │
│ ╭───────────────────────────────────────────────╮│
│ │ (🤍) Lace Top                            (⧉)  ││ 60h
│ │      ●● Kem, Đen · 450.000đ                   ││
│ │      ─────────────────────────────────────────││ separator inset 64
│ │ (🌙) Noir Dotty Top                      (⧉)  ││
│ │      ● Noir · 420.000đ                        ││
│ ╰───────────────────────────────────────────────╯│
│ Set                                              │
│ ╭───────────────────────────────────────────────╮│
│ │ (✦) Set Ivory Dot                        (⧉)  ││
│ │      Blouse + Midi Skirt · 890.000đ           ││
│ ╰───────────────────────────────────────────────╯│
│ Tất cả mẫu · 13                                  │
│ ╭───────────────────────────────────────────────╮│
│ │ …                                             ││
│   ╭─────────────────────────────────╮  ╭──────╮  │ 770–832
│   │ [⌂ Mẫu]   ✉ Kịch bản    ⊡ Đơn  │  │  ⌕   │  │ tab capsule + search
│   ╰─────────────────────────────────╯  ╰──────╯  │
│                    ▬▬▬▬▬▬▬                       │ home indicator
└─────────────────────────────────────────────────┘
```

**Details**

- **Nav bar.** The leading button is the `slider.horizontal` icon in a 44×44 hit area (glyph 22, `--label`), labelled "Cài đặt" for VoiceOver. The trailing control is the language segmented control (§5.4). At scroll 0 the bar has no title and no background. Once the large title scrolls under the bar, the inline title "Mẫu" (Headline 17 semibold) fades in and the bar turns into a material with a hairline (§8).
- **Greeting** (Subhead 15, `--font-display`, italic, `--label-2`), chosen by local time:
  - 05:00–10:59 "Chào buổi sáng, Embrace"
  - 11:00–13:59 "Buổi trưa an yên nhé"
  - 14:00–17:59 "Chiều dịu dàng, Embrace"
  - 18:00–21:59 "Tối êm, Embrace"
  - 22:00–04:59 "Khuya rồi, nghỉ ngơi sớm nhé"

  The greeting appears only on Mẫu and is hidden when the large title has collapsed.
- **Gần đây.** This section shows only when Recents is non-empty. It is a horizontal scroller with `scroll-snap-type: x proximity`, 16 pt leading inset, chips spaced 8 pt apart and up to 8 chips. A chip label is the item name followed by "· EN" if the item was copied in EN. Tapping a chip copies the same text again in its original language.
- **Lời chào tiles.** Two equal tiles, `(393 − 32 − 8) / 2 = 176.5` pt wide and 64 high, with `--bg-cell` background and radius 12. The title is Headline 17 and the subtitle is Footnote 13 `--label-2`. Each has a trailing copy glyph 20 in `--accent`. **The whole tile is the copy button.** Copy feedback is the seal over the glyph plus a toast.
- **Product row** (§5.7): a leading 36 pt emoji disc, a title, and a subtitle with color dots, color names and the price. The trailing copy button copies `desc` in the current language.
  - **Tap the row body** → Product sheet.
  - **Long-press** → context menu (§5.13).
  - **Swipe left** → actions "Size" (rosewood) and "Đơn" (ink).
  - **Swipe right** → "Yêu thích" heart.
- **Section order:** Gần đây, Lời chào, Yêu thích (hidden when empty), Set, Tất cả mẫu (manual order from data; the count appears in the header as "Tất cả mẫu · 13").
- **Empty favourites:** the section is hidden. A one-time footer hint under "Tất cả mẫu" reads "Chạm giữ một mẫu để thêm vào Yêu thích nhé."

**430 pt notes:** Margins are 20, so tiles are `(430 − 40 − 8)/2 = 191`. Chips show about 3.5 at a time. The tab capsule is 37 pt wider. All row heights stay the same: more air, not more density.

---

### 4.2 Product detail sheet

Detents are **medium = 60% of `innerHeight`** (511 pt on 852, 559 pt on 932) and **large** (top = safe-area top + 10 = 69). Opening lands on medium.

```
┌─────────────────────────────────────────────────┐
│ ░░░░░░░ Mẫu list, dim 20% black ░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
╭─────────────────────────────────────────────────╮ y=341 (medium)
│                     ━━━━━                       │ grabber 36×5, top 5
│ 🤍 Lace Top                         (♡)   (✕)   │ title serif 22; icons 30 discs
│ 450.000đ · ●● Kem, Đen                          │ subhead 15, label-2
│ ┌──────────────┬───────────────┐   ┌────┬────┐  │ 32h
│ │  Thông tin   │   Bảng size   │   │ VI │ EN │  │ content seg + lang seg
│ └──────────────┴───────────────┘   └────┴────┘  │
│ ╭─────────────────────────────────────────────╮ │
│ │ Lace Top 🤍                                  │ │ paper card, body 17/22
│ │ Áo ren mềm cổ vuông, chất ren Pháp …         │ │ scrolls inside sheet
│ │ …                                            │ │
│ ╰─────────────────────────────────────────────╯ │
│ ✦ Form ôm nhẹ — vòng 1 trên 88cm nên lên 1 size │ note callout (not copied)
│ Thêm vào đơn   (S) (M) (L)                      │ chips 36h
│ ╭──────────────────╮ ╭────────────────────────╮ │
│ │ ⟟  Bảng size     │ │ ⧉  Chép thông tin      │ │ 50h buttons
│ ╰──────────────────╯ ╰────────────────────────╯ │
│                     ▬▬▬▬▬▬                      │ safe-area bottom 34
╰─────────────────────────────────────────────────╯
```

**Details**

- **Header** (64 pt): the emoji and name in `--font-display` 22/28 weight 500, then a subtitle line with price and colors. Trailing are two 30×30 circular icon buttons (fill `--fill-3`, glyph 15, hit area 44):
  - **♡** toggles favourite (filled `--accent` when on).
  - **✕** closes the sheet.
- **Content segmented control** "Thông tin | Bảng size" switches the preview between `desc` and `sizeChart` and **swaps which bottom button is primary**:
  - In "Thông tin" view: the primary button is "Chép thông tin" and the secondary is "Bảng size".
  - In "Bảng size" view: the primary button is "Chép bảng size" and the secondary is "Thông tin".

  The secondary button always copies the *other* text, so either one is reachable in one tap.
- **Language segmented control** (76×32) is bound to the same global state as the nav bar control.
- **Paper card:** `--bg-paper` with a 0.5px `--separator` border, radius 14, padding 16. Text is Body 17/22, `white-space: pre-wrap`, and selectable (`user-select: text`), so she can also copy part of it by hand. Max height is the remaining space; it scrolls internally. Pulling down at scrollTop 0 drags the sheet.
- **Note callout** (only if `note` exists): `sparkle` icon 15 in `--accent`, Footnote 13/18 in `--label-2`, background `--accent-tint`, radius 10, padding 10×12. It is labelled with the visually hidden text "Ghi chú nội bộ" and is never copied.
- **"Thêm vào đơn" row:** a label (Subhead 15, `--label-2`) followed by size chips. If the product has 2+ colors, a color chip row appears first ("Kem", "Đen") with the context color pre-selected. Tapping a size chip:
  - adds the line to the draft,
  - sets context `{item, color, size}`,
  - shows the toast "Đã thêm Lace Top · Kem · M vào đơn",
  - bounces the Đơn tab badge.

  The sheet stays open.
- **Bottom action bar:** two buttons with 8 pt between them. Secondary is 1fr and primary is 1.35fr. Both are 50 high, radius 14, with 16 pt of padding below and then the safe area. After a successful copy, the sheet **stays open** so she can come back to it, and it dismisses with a swipe.
- Copying sets context `{item}`.

**Set sheet:** the same layout with no segmented control. The header subtitle reads "Blouse + Midi Skirt · 890.000đ (lẻ 960.000đ)". The preview shows `set.desc`. The bottom bar holds a single primary button "Chép thông tin set" at full width, and a row "Thêm cả set vào đơn" (button, tinted) above it.

**430 pt notes:** The medium detent is 559 pt, so the paper card shows about 2 more lines. Everything else is identical.

---

### 4.3 Kịch bản (Flow / Scenario list)

```
┌─────────────────────────────────────────────────┐
│ status                                           │
│                                      ┌────┬───┐  │
│                                      │ VI │EN │  │
│ Kịch bản                                         │ large title serif 34
│ ╭ ◉ Đang tư vấn: Lace Top · Kem · M       ✕ ╮   │ context chip 32h
│ 1 · Mở đầu                                       │
│ ╭───────────────────────────────────────────────╮│
│ │ Khách mới                                (⧉)  ││ 64h, 2 lines
│ │ Chào bạn, cảm ơn bạn đã ghé Soft Embr…        ││ preview, footnote 13
│ ├───────────────────────────────────────────────┤│
│ │ Khách quen                               (⧉)  ││
│ │ Ôi bạn quay lại rồi, Soft Embrace vui…        ││
│ ╰───────────────────────────────────────────────╯│
│ 2 · Tư vấn size                                  │
│ ╭───────────────────────────────────────────────╮│
│ │ Hỏi số đo                                (⧉)  ││
│ │ Bạn cho mình xin số đo 3 vòng và chiều…       ││
│ │ Vừa size [size]                          (⧉)  ││
│ │ Size M rất vừa với bạn nè…   ← filled from ctx││
│ │ Giữa hai size                            (✎)  ││ ← needs fill
│ │ Cần điền: size thay thế                       ││   (accent footnote)
│ │ Quá size — chưa có mẫu thay              (⧉)  ││
│ │ Quá size — có mẫu thay                   (✎)  ││
│ │ Size nhỏ quá                             (⧉)  ││
│ ╰───────────────────────────────────────────────╯│
│ 3 · Thông tin giao hàng                          │
│ 4 · Chốt đơn       (row "Tóm tắt đơn ›" → Đơn tab; row "Gửi STK & QR")
│ 5 · Set            (row per set, same as Mẫu)    │
│ 6 · Cảm ơn         (Đã nhận chuyển khoản · Hẹn gặp lại)
│   ╭─────────────────────────────────╮  ╭──────╮  │
│   │  ⌂ Mẫu  [✉ Kịch bản]   ⊡ Đơn   │  │  ⌕   │  │
│   ╰─────────────────────────────────╯  ╰──────╯  │
└─────────────────────────────────────────────────┘
```

**Details**

- **Context chip** (§5.15) appears only when context exists. Tapping it opens a small popover-style sheet (detent fit, about 240 pt) to change item and size. "✕" clears the context.
- **Section headers** use the format "N · Title". The number is in `--accent` with tabular-nums. There is no collapse: there are only 6 sections and about 16 rows.
- **Scenario row** is 64 high. The title is Body 17 and the preview is Footnote 13 in `--label-2`, on one line, ellipsized. The preview is rendered **with context values substituted**, so she sees what will be copied.
- **Trailing button state:**
  - **All placeholders resolvable** → copy glyph `doc.on.doc`. Tapping it copies directly.
  - **Some unfilled** → `pencil` glyph and the preview replaced by "Cần điền: size thay thế" in `--accent`. Tapping opens the Message sheet focused on the first empty field.
- **Row tap** (anywhere else) always opens the Message sheet, to read, pick a variant or edit fills.
- **"Tóm tắt đơn ›"** in step 4 is a navigation row (chevron) that switches to the Đơn tab. It does not copy.
- **Swipe left** on a scenario reveals "EN" (or "VI"), which copies in the opposite language once.

**430 pt notes:** The preview line shows about 6 more characters. Nothing else changes.

---

### 4.4 Message sheet: variant picker and placeholder fill

The default detent is medium (60%). It moves to **large automatically when a text field focuses**, so the keyboard does not cover it.

```
╭─────────────────────────────────────────────────╮ y=341
│                     ━━━━━                       │
│ Giữa hai size                     ┌────┬───┐(✕) │ title serif 22
│ 2 · Tư vấn size                   │ VI │EN │    │ footnote label-2
│ ┌────────────┬────────────┐       └────┴───┘    │ variant seg (only if ≥2)
│ │    Ngắn    │  Chi tiết  │                     │
│ └────────────┴────────────┘                     │
│ ╭─────────────────────────────────────────────╮ │
│ │ Số đo của bạn nằm giữa size ⟦M⟧ và ⟦ size ⟧, │ │ paper card
│ │ mình gợi ý bạn chọn ⟦M⟧ nếu thích mặc ôm…   │ │ ⟦ ⟧ = placeholder token
│ ╰─────────────────────────────────────────────╯ │
│ Điền nhanh                                      │ section header
│ Size        (S) [M] (L) (XL)        ← filled ✓  │ 44h rows, chips 36h
│ Size thay   (S) (M) (L) (XL)        ← empty     │
│ ╭─────────────────────────────────────────────╮ │
│ │ ⧉  Chép                                      │ │ primary 50h, full width
│ ╰─────────────────────────────────────────────╯ │ disabled label "Điền 1 chỗ nữa"
╰─────────────────────────────────────────────────╯
```

**Details**

- **Variant picker:**
  - A segmented control when the scenario has 2–3 variants. Labels come from `variant.label` (max 12 characters).
  - With 4+ variants, an inset list of radio rows with a checkmark (none in the current data, but supported).
  - The last-used variant per scenario is remembered.
- **Placeholder token** (inline in the preview):
  - **Unfilled:** `--accent-tint` background, `--accent` text, a 1px dashed bottom border, padding 1×6, radius 6, showing the human label ("size", "mẫu", "tên"). Tapping it scrolls its control into view and pulses it (scale 1 → 1.04 → 1, 240 ms).
  - **Filled:** ink text on `--accent-tint` at 60%, no dash.
  - Copied text never contains token styling or brackets.
- **Fill rows**, one per unique token in order of appearance. The label column is 96 wide (Subhead 15, `--label-2`) and the control is on the right.
  - Size: chips. Single-select. The selected chip is `--accent` fill with `--on-accent` label.
  - Item: the 4 most recent product chips plus a "Chọn…" chip that opens the Product picker (the same as §4.5, but without size).
  - Text fields: 44h, `--fill-4` background, radius 10, Body 17. The `enterkeyhint="done"` key blurs.
- **Auto-fill:** tokens with a context value arrive filled and show the footnote "Lấy từ Đang tư vấn" under the fill rows. Changing a size here **updates the context**.
- **Primary "Chép":** it is disabled (40% opacity) while any token is empty, and its label then reads "Điền N chỗ nữa". Once everything is filled it reads "Chép" with the `doc.on.doc` icon. The button rides 8 pt above the keyboard while a field is focused (§11.6).
- After a successful copy, **the sheet auto-dismisses after 600 ms**. This differs from the product sheet because the scenario step is done.

---

### 4.5 Đơn (Order composer)

```
┌─────────────────────────────────────────────────┐
│ status                                           │
│ (Đơn mới)                             ┌────┬───┐ │ leading text button
│                                       │ VI │EN │ │
│ Đơn hàng                                         │ large title serif 34
│ ╭───────────────────────────────────────────────╮│ thank card (24h after copy)
│ │ ✦ Khách đã chuyển khoản?                      ││ headline 17
│ │ Gửi lời cảm ơn thật ấm nhé.                   ││ footnote
│ │ ╭─────────────────────╮  ╭──────────────────╮ ││
│ │ │ ⧉ Chép lời cảm ơn   │  │    Đơn mới       │ ││ 44h
│ │ ╰─────────────────────╯  ╰──────────────────╯ ││
│ ╰───────────────────────────────────────────────╯│
│ Món                                              │
│ ╭───────────────────────────────────────────────╮│
│ │ ⊕ Thêm Lace Top · Kem · M         (gợi ý)     ││ suggestion row, accent tint
│ ├───────────────────────────────────────────────┤│
│ │ (🤍) Lace Top · Kem               450.000đ    ││ line row 60h
│ │      Size M · SL 1                            ││
│ ├───────────────────────────────────────────────┤│
│ │ (🌸) Lace Skirt · Kem             520.000đ    ││
│ │      Size S · SL 1                            ││
│ ├───────────────────────────────────────────────┤│
│ │ ⊕ Thêm món                                    ││ accent label 44h
│ ╰───────────────────────────────────────────────╯│
│ Phí ship                                         │
│ ┌──────────────┬──────────────┬──────────────┐   │ segmented 32h
│ │   30.000đ    │   Freeship   │     Khác     │   │
│ └──────────────┴──────────────┴──────────────┘   │
│ Thông tin nhận (tuỳ chọn)                        │
│ ╭───────────────────────────────────────────────╮│
│ │ Dán tên, SĐT, địa chỉ khách gửi…        (📋)  ││ textarea 88h, paste button
│ ╰───────────────────────────────────────────────╯│
│ Kèm thông tin chuyển khoản            [ ●── ]   │ switch row
│ Xem trước ›                                      │ disclosure → preview card
│ ╭───────────────────────────────────────────────╮│ total bar, floating
│ │ Tổng · 2 món          ╭──────────────────────╮││ 64h, material
│ │ 1.000.000đ            │ ⧉  Chép đơn          │││ total: Title2 22 tabular
│ │                       ╰──────────────────────╯││
│ ╰───────────────────────────────────────────────╯│
│   ╭─────────────────────────────────╮  ╭──────╮  │
│   │  ⌂ Mẫu   ✉ Kịch bản  [⊡ Đơn ²] │  │  ⌕   │  │ badge = line count
│   ╰─────────────────────────────────╯  ╰──────╯  │
└─────────────────────────────────────────────────┘
```

**Details**

- **Thank card:** visible when `draft.copiedAt` is within 24 hours. It sits on `--bg-cell` with radius 14 and padding 16.
  - "Chép lời cảm ơn" copies scenario step 6 "Đã nhận chuyển khoản" in the current language.
  - "Đơn mới" clears the draft with the undo toast "Đã làm mới đơn · Hoàn tác" (5 s).
  - The card hides once the draft is cleared.
- **Suggestion row:** visible when context has an item and size, and that combination is not already a line. It has an `--accent-tint` background, a ⊕ glyph and the label "Thêm Lace Top · Kem · M", with the footnote "gợi ý" on the right. One tap adds the line, after which the row is replaced by the new line (insert animation §8).
- **Line row:** emoji disc, then "Name · Color" (Body 17), then "Size M · SL 1" (Footnote 13, `--label-2`), with the price trailing (Body 17, tabular-nums).
  - **Tapping** the row expands it inline (+52 pt) to reveal size chips and a quantity stepper (§5.11). Collapsing is done with the transform and opacity technique in §8, not by animating height. Only one row is expanded at a time.
  - **Swipe left** shows "Xoá" (`--destructive`). A full swipe deletes. Undo is available through the toast.
- **Thêm món** opens the Product picker (large sheet):
  ```
  ╭───────────────────────────────────────────────╮
  │                   ━━━━━                       │
  │ Thêm món                               (✕)    │
  │ ╭───────────────────────────────────────────╮ │
  │ │ ⌕ Tìm mẫu                                 │ │  search field 36h (no autofocus)
  │ ╰───────────────────────────────────────────╯ │
  │ ╭───────────────────────────────────────────╮ │
  │ │ Lace Top · Kem          (S) (M) (L)       │ │  60h; one row per product×color
  │ │ 450.000đ                                  │ │
  │ │ Lace Top · Đen          (S) (M) (L)       │ │
  │ │ Set Ivory Dot           ( Thêm set )      │ │
  │ ╰───────────────────────────────────────────╯ │
  ```
  Tapping a size chip adds the line, plays the chip's seal, closes the sheet after 250 ms, and sets the context. Search here filters in place.
- **Phí ship segmented control:** the default value comes from Settings. "Khác" reveals a numeric field row (`inputmode="numeric"`, formatted live with `.` thousands separators).
- **Thông tin nhận:** a textarea, plus a trailing 44×44 paste button (`clipboard` glyph) that calls `navigator.clipboard.readText()`. iOS then shows its native "Paste" callout, which is expected. When filled, the text is added to the recap as "Giao đến:\n…".
- **Kèm thông tin chuyển khoản** (switch, default on): appends the bank block from Settings as `[bank]`.
- **Xem trước ›:** a disclosure that expands a paper card with the exact recap text.
- **Total bar:** pinned 8 pt above the tab bar, with horizontal margin equal to the page margin. Height 64, radius 18, material thick, shadow `--shadow-float`.
  - Left side: "Tổng · N món" (Footnote 13, `--label-2`) over the total (`--font-display` 22, tabular-nums).
  - Right side: the primary button "Chép đơn", 44h, min-width 148.
  - When the draft is empty, the button is disabled and the left side reads "Chưa có món".
- **After "Chép đơn":** the button morphs to "Đã chép ✓" for 1.2 s. The bar then shows a secondary chip "Gửi QR" (opens the QR sheet), and the thank card appears at the top.
- **Leading nav button "Đơn mới":** text button, `--accent`. It clears the draft with undo.

**QR sheet** (fit detent, about 520 pt):
- A QR image (max 280×280, radius 14, on white), with the bank name, account number and holder below (Subhead 15, selectable).
- A primary "Chia sẻ QR" button, which calls `navigator.share({ files:[qrFile] })`.
- A secondary "Chép số tài khoản" button.
- With no QR set, an empty state: "Chưa có mã QR. Thêm trong Cài đặt › Chuyển khoản nhé." plus the button "Mở Cài đặt".

**Recap template** (editable in Settings › Sửa nội dung › Chốt đơn; default VI):

```
Mình gửi bạn thông tin đơn nha ✨
[items]
Phí ship: [shipping]
Tổng cộng: [total]

[bank]
Nội dung chuyển khoản: tên + 4 số cuối SĐT giúp mình nha. Mình gửi mã QR ngay dưới đây 🤍
```

- `[items]` is one line per item: `• Lace Top – Kem – size M: 450.000đ`, with `x2` before the price when qty > 1.
- `[shipping]` renders as "Miễn phí" when 0.
- In EN, money is written `450,000 VND`. In VI it is written `450.000đ`.

**430 pt notes:** The total bar is 390 wide. The picker size chips fit 4 sizes plus the name without truncation.

---

### 4.6 Search

The circular search button (bottom-right) turns the screen into search mode. The tab capsule shrinks to a 62×62 circle showing only the active tab icon. The search button stretches into a **bottom-docked search field** (iOS 26 behaviour), and the keyboard opens because `focus()` runs inside the tap handler.

```
┌─────────────────────────────────────────────────┐
│ status                                           │
│ Tìm kiếm                                         │ large title serif 34
│ Mẫu                                              │ section headers per kind
│ ╭───────────────────────────────────────────────╮│
│ │ (🤍) Lace Top                            (⧉)  ││ ← "lace" matches
│ │ (🌸) Lace Skirt                          (⧉)  ││
│ ╰───────────────────────────────────────────────╯│
│ Kịch bản                                         │
│ ╭───────────────────────────────────────────────╮│
│ │ Xin thông tin nhận hàng                  (⧉)  ││
│ ╰───────────────────────────────────────────────╯│
│ ═══════════════ keyboard top ══════════════════  │
│ (⌂)  ╭──────────────────────────────────╮ (✕)   │ field 44h, 8pt above keyboard
│      │ ⌕ lace                       (⊗) │       │
│      ╰──────────────────────────────────╯       │
│ ┌───────────── iOS keyboard ─────────────────┐  │
```

- **Empty query:** the Gần đây list (up to 8, as rows) under the header "Gần đây". With no recents, the header shows the hint "Tìm theo tên mẫu, kịch bản, hay từ trong tin nhắn".
- **Matching:** diacritic-insensitive and case-insensitive. Both query and haystack are normalised with `NFD`, combining marks are stripped, and `đ` is treated as `d`. The haystack is name + scenario title + message text in both languages.
- **Ranking:** name prefix > name contains > title contains > text contains.
- Results update on every `input` event inside a `requestAnimationFrame`, with no debounce. The data is small, so filtering takes under 1 ms.
- **Groups** in this order: Mẫu, Set, Kịch bản. A group shows max 5 rows, plus "Xem tất cả N" if there are more.
- Rows are the same components as elsewhere, so the trailing copy works directly. **Copying does not close search** (she may copy several).
- **Leaving search:**
  - The ✕ button exits search, restores the tab bar and returns to the previous tab.
  - Scrolling results dismisses the keyboard (`blur` on `touchstart` of the result list once it moves more than 10 pt). The field stays docked at the bottom above the safe area.
- **No results:** the title "Chưa tìm thấy “lace x”" in serif 20, with the subtitle "Thử một tên ngắn hơn nhé."

---

### 4.7 Settings (Cài đặt)

Opens as a sheet at the **large** detent from the Mẫu nav leading button. It uses a grouped background and pushes sub-pages inside the sheet, with its own small nav bar (title Headline 17 centered, "Xong" text button trailing).

```
╭─────────────────────────────────────────────────╮ y=69
│                     ━━━━━                       │
│                    Cài đặt                Xong  │
│ Ngôn ngữ mặc định                               │
│ ╭───────────────────────────────────────────────╮│
│ │ ┌──────────────────┬──────────────────┐       ││
│ │ │   Tiếng Việt     │     English      │       ││ seg 32h full width
│ │ └──────────────────┴──────────────────┘       ││
│ ╰───────────────────────────────────────────────╯│
│ Mỗi lần mở app sẽ bắt đầu bằng ngôn ngữ này.    │ footer, footnote
│ Đơn hàng                                        │
│ │ Phí ship mặc định              30.000đ   ›   ││
│ │ Chuyển khoản & QR                        ›   ││
│ Nội dung                                        │
│ │ Mẫu                                13    ›   ││
│ │ Set                                 2    ›   ││
│ │ Kịch bản                           16    ›   ││
│ │ Mẫu tóm tắt đơn                          ›   ││
│ Yêu thích & Gần đây                             │
│ │ Xoá danh sách Gần đây                        ││ accent label
│ Dữ liệu                                         │
│ │ Xuất bản sao lưu (.json)                     ││
│ │ Nhập bản sao lưu                             ││
│ │ Khôi phục nội dung gốc                       ││ destructive label
│                                                 │
│      Soft Embrace · 1.0                         │ caption, centered
│      Làm bằng sự dịu dàng.                      │
╰─────────────────────────────────────────────────╯
```

- **Language default** is applied at cold launch. The nav segmented control changes only the current session state, and that state persists until the next cold launch.
- **Appearance** follows the system only. There is no in-app theme toggle (HIG).
- **Edit text** (Nội dung › Mẫu › Lace Top) is a pushed form:
  - Fields: Tên (text), Emoji (text, 1 grapheme), Giá (numeric), Màu (list with add and remove), Size (chips toggle), and then a segmented "VI | EN" that switches all four long fields below it: **Thông tin**, **Bảng size**, **Ghi chú**.
  - Each long field is an auto-growing textarea (Body 17, min 120h, `--bg-cell`).
  - **Autosave** 400 ms after the last keystroke. The footnote under the field reads "Đã lưu" and fades in and out in 200 ms. There is no save button.
  - A placeholder helper sits under message textareas: a chip row `[size] [item] [tên] …`. Tapping a chip inserts the token at the cursor.
- **Edit scenario:** title, then variants (add, rename, delete), then text VI/EN with the same helper chips.
- **Overrides:** edits are stored as overrides keyed by id over the seed data. The seed is never mutated. "Khôi phục nội dung gốc" is destructive and shows an action sheet: "Khôi phục toàn bộ nội dung gốc? Các chỉnh sửa của bạn sẽ mất." with buttons "Khôi phục" (destructive) and "Huỷ".
- **Chuyển khoản & QR:** Ngân hàng, Số tài khoản, Chủ tài khoản (text rows). Ảnh QR is a row with a thumbnail that opens `<input type="file" accept="image/*">`. The image is downscaled on a canvas to max 600 px PNG (≤ 80 KB) and stored. The row has the action "Xoá ảnh".
- **Export:** `navigator.share({ files:[backup.json] })`, falling back to a download link. **Import:** file input, validate the schema, then confirm "Thay nội dung hiện tại bằng bản sao lưu?"

---

## 5. Component library

All sizes are in CSS px (= pt on iPhone). Tokens are defined in §7. The hit target is ≥ 44×44 everywhere. Where the visual element is smaller, the hit area is enlarged with `::after { inset: -6px }` or with padding.

### 5.1 Navigation bar
- Height 44, positioned below `env(safe-area-inset-top)`, sticky inside each tab's scroller.
- **Scroll edge** (large title visible): transparent, no hairline, no inline title.
- **Scrolled:** background `--material-bar`, `backdrop-filter: saturate(180%) blur(20px)`, bottom hairline 0.5px `--separator`. The inline title (Headline 17/22 semibold, `--label`) is centered with opacity 0 → 1.
- The material layer extends up behind the status bar to y = 0, so status glyphs sit on it.
- Bar buttons: icon glyph 22 or text Body 17 in `--accent`, hit area 44×44, 8 pt from the margin edge.

### 5.2 Large title block
- Font `--font-display` 34/41, weight 500, `--label`. Padding: 16 margin, 3 top, 8 bottom.
- The optional greeting above it uses Subhead 15/20 italic display font, `--label-2`, 4 below.
- An IntersectionObserver sentinel 1 px tall at the title's baseline toggles `.nav--scrolled`.

### 5.3 Inset grouped list
- Group: margin 0 `--margin`, `--bg-cell`, radius `--r-group` (12), `overflow: clip`.
- **Section header:** Subhead 15/20 semibold, `--label-2`, sentence case. Padding 22 top (first section 8), 6 bottom, 16 left within the group margin.
- **Section footer:** Footnote 13/18, `--label-2`, padding 6 top, 16 sides.
- **Separator:** 0.5px `--separator`, inset to the start of the text (leading 64 for rows with a 36 disc, 16 for plain rows), none after the last row.
- The page background behind groups is `--bg-grouped`.

### 5.4 Segmented control
- Track: `--fill-4`, height 32, radius 9, padding 2.
- Thumb: `--bg-thumb` (light `#FFFFFF`, dark `#5A4E46`), radius 7, shadow `0 3px 8px rgba(0,0,0,.12), 0 3px 1px rgba(0,0,0,.04)`, moved with `transform: translateX()`.
- Label: Subhead 15/20 (13 semibold in the compact 76-wide language variant). The selected label is semibold `--label`, the unselected label is medium `--label`.
- **Language variant:** width 76, 2 segments, labels "VI" "EN". The hit area extends to 44 tall.
- Thin dividers (1 × 16, `--separator`) sit between unselected segments and hide next to the thumb.

### 5.5 Search field
- In-list (picker): height 36, `--fill-4`, radius 10, magnifying glass glyph 17 `--label-2` with 8 left padding, text Body 17, placeholder `--label-3`.
- Clear button `xmark.circle.fill` 17 appears when the field is not empty.
- **Docked bottom variant:** height 44, radius 22, `--material-thick` with blur, shadow `--shadow-float`.
- `font-size: 17px` prevents iOS zoom on focus.
- Attributes: `type="search"`, `enterkeyhint="search"`, `autocomplete="off"`, `autocorrect="off"`, `spellcheck="false"`.

### 5.6 Copy button (the most important component)
- Visual: a 32×32 circle filled `--fill-3` with the `doc.on.doc` glyph 17 in `--accent`. The hit area is 44 wide × full row height, at the trailing end of the row with 8 pt from the cell edge.

| State | Visual |
|---|---|
| Idle | as above |
| Pressed | circle `--fill-2`, scale 0.92 (100 ms) |
| Copied (1.4 s) | the circle becomes the **seal**: `--accent` fill, `checkmark` glyph 15 in `--on-accent` stroke 2, pop animation (§8); a 1px ring in `--accent` 40% expands from 32 → 44 and fades |
| Needs fill | `pencil` glyph in place of copy, same circle |
| Error | glyph `exclamationmark` in `--destructive` for 1.4 s, plus error toast |
| Disabled | 40% opacity |

- The label for VoiceOver is "Chép {name}" (EN: "Copy {name}").

### 5.7 Product row
- Height 60, padding 0 8 0 16.
- **Leading disc:** 36×36 circle `--bg-disc` (light `#F3EAE0`, dark `#33291F`), emoji at 20 px centered, with 12 pt from the disc to the text.
- **Title:** Body 17/22 `--label`, one line, ellipsis.
- **Subtitle:** Footnote 13/18 `--label-2`: color dots (8×8 circles with 0.5px ring, 3 apart), 6 pt, "Kem, Đen · 450.000đ". Prices use `font-variant-numeric: tabular-nums`.
- **Trailing:** copy button.
- **Pressed:** background `--fill-pressed`, applied instantly and fading out over 250 ms on release.
- `-webkit-touch-callout: none` and `user-select: none` on rows, so long-press gives our context menu instead of the native text callout.

### 5.8 Scenario row
- Height 64: padding 10 top and bottom, title Body 17/22, preview Footnote 13/18 one line.
- Unfilled state: the preview is replaced by "Cần điền: …" in `--accent`.
- Navigation rows ("Tóm tắt đơn ›") use a `chevron.right` 13 glyph in `--label-3` instead of the copy button.

### 5.9 Greeting tile
- 64h, `--bg-cell`, radius 12, padding 12 12 12 16.
- Title Headline 17/22, subtitle Footnote 13 `--label-2`, trailing glyph 20 in `--accent`.
- The whole tile is the copy hit area. Pressed: scale 0.97 plus `--fill-pressed` overlay.

### 5.10 Buttons
| Type | Height | Radius | Fill | Label | Pressed |
|---|---|---|---|---|---|
| Primary | 50 (44 in bars) | 14 | `--accent` | Headline 17 `--on-accent`, icon 20 leading, 8 gap | `--accent-pressed`, scale 0.97 |
| Secondary (tinted) | 50 / 44 | 14 | `--accent-tint` | Headline 17 `--accent` | opacity 0.7, scale 0.97 |
| Plain / text | 44 hit | — | none | Body 17 `--accent` | opacity 0.4 |
| Destructive text | 44 hit | — | none | Body 17 `--destructive` | opacity 0.4 |
| Icon circle | 30 visual / 44 hit | 50% | `--fill-3` | glyph 15 `--label-2` | `--fill-2` |
| Disabled | — | — | same fill at 40% opacity | — | none |

### 5.11 Chips (size, color, product, recent)
- Height 36, radius 18, min width 44, padding 0 14, Subhead 15 semibold.
- **Unselected:** `--fill-4` background, `--label` text. **Selected:** `--accent` fill with `--on-accent` text. **Pressed:** scale 0.94.
- Color chips have a 10×10 swatch dot leading, 6 gap.
- Recent chips have a `doc.on.doc` glyph 13 leading in `--accent`.
- Spacing between chips: 8.
- **Stepper** (quantity): 94×32, `--fill-4`, radius 9, with "−" and "+" glyphs 17 in halves split by a 1×18 divider. The value sits to the left of the stepper in Body 17 tabular. Min 1, max 9.

### 5.12 Switch
Native look: 51×31 track (off `--fill-1`, on `--accent`) with a 27×27 white knob carrying shadow `0 3px 8px rgba(0,0,0,.15)`. The knob moves with `translateX(20px)`. Built on `<input type="checkbox" switch>`, which on iOS 18+ Safari renders the real UISwitch and gives a native haptic, with the styled fallback for older systems.

### 5.13 Context menu
- Triggered by a 450 ms touch-hold without moving more than 8 pt.
- **Preview:** the row is cloned at its position, lifts to scale 1.03, gets radius 12 and shadow `--shadow-menu`. The background gets `backdrop-filter: blur(12px)` plus a dim of `rgba(20,14,10,.18)`.
- **Menu:** 250 wide, `--material-menu`, radius 14. Placed under the preview, or above it if there is less than 260 pt below.
- **Items:** 44h, Body 17 `--label`, trailing glyph 17. Separators 0.5px. Group gaps are 8px bands of `--separator` at 30% opacity.
- **Product menu items:**
  1. "Chép thông tin" (`doc.on.doc`)
  2. "Chép bảng size" (`ruler`)
  3. "Chép kèm lời chào" (`text.bubble`)
  4. "Chép bản English" / "Chép bản Tiếng Việt" (`globe`)
  5. — divider —
  6. "Thêm vào đơn" (`bag`), which opens the size chips inline in the menu as a submenu row
  7. "Yêu thích" / "Bỏ yêu thích" (`heart`)
  8. "Sửa nội dung" (`pencil`)
- **Dismiss:** tap outside, or the item action fires.

### 5.14 Swipe actions
- The row content translates with the finger. Actions are revealed underneath: each 74 wide, full row height, icon 20 over a Caption 12 label in white.
- Product row, trailing side: "Size" (`--accent`) and "Đơn" (`--action-ink`, light `#4A3F38`, dark `#6B5D53`). Leading side: "Yêu thích" (`--action-heart`, `#C27C76`).
- **Full swipe:** past 60% of row width it triggers the outermost action. The action expands to fill, the row snaps back after the action, and the toast confirms.
- **Snap rules:** release with more than 50% of the actions width revealed, or with velocity over 300 pt/s outward, snaps open. Otherwise it snaps closed. Only one row is open at a time, and scrolling closes it.

### 5.15 Context chip ("Đang tư vấn")
- 32h capsule, `--accent-tint` background, margin 0 `--margin`, 8 below the large title.
- Leading dot 6×6 `--accent`, then the label Footnote 13 semibold `--accent`: "Đang tư vấn: Lace Top · Kem · M". Trailing ✕ is 13, with a 44 hit area.
- Tapping the chip opens the edit sheet.

### 5.16 Sheet
- Background `--bg-sheet`. Top radius 20 (bottom corners 0 because the sheet touches the screen edge).
- **Grabber:** 36×5, radius 2.5, `--label-3` at 50%, centered 5 from the top.
- **Dim layer:** `rgba(0,0,0,.20)` light, `rgba(0,0,0,.45)` dark. Tapping the dim layer dismisses the sheet.
- **Large detent:** sheet top at `safe-area-top + 10`. The app root behind it scales to 0.92, gets radius 12 and translates so its top sits at `safe-area-top − 2`. At medium detent the root does not scale; it is dimmed only.
- **Drag area:** grabber plus header (`touch-action: none`). Pulling the content down from scrollTop 0 hands the drag to the sheet.
- **Rubber band** beyond the large detent: `offset = (1 − 1/(d·0.55/H + 1))·H`, where d is the raw drag and H is the sheet height.
- **Release rules:**
  - Dismiss if dragged down more than 35% of the current height, or velocity over 800 pt/s down.
  - Otherwise snap to the nearest detent, with the decision biased by velocity × 0.15 s.
- Each sheet is a `role="dialog"` with `aria-modal="true"` and focus trapped inside.

### 5.17 Floating tab bar and search button
- **Capsule:** height 62, radius 31, from x = margin to `100% − margin − 62 − 12`. Bottom edge is 20 above the screen bottom (`bottom: max(20px, calc(env(safe-area-inset-bottom) - 14px))`).
- Material: `--material-tab` with `backdrop-filter: saturate(180%) blur(24px)`, a 0.5px inner border `--glass-edge`, shadow `--shadow-float`.
- **Tabs:** 3 equal items with 4 padding. Each item has an icon 24 (stroke 1.75) and a label Caption 10/12 semibold, 2 gap, with color `--label`.
- **Selected tab:** a lozenge behind it (`--accent-tint`, radius 27, inset 4) that moves between tabs with `translateX`. Icon and label turn `--accent`, and the icon switches to its filled variant.
- **Badge** on Đơn: 16h min-width 16 capsule, `--accent` fill, Caption 11 semibold `--on-accent`, offset to the top-right of the icon. It shows the line count while lines > 0.
- **Search button:** 62×62 circle with the same material, `magnifyingglass` 22 `--label`.
- Tapping the active tab scrolls its list to the top (smooth, 0.35 s).

### 5.18 Toast ("Đã chép")
- Capsule 44h, auto width (max `100% − 2·margin`), padding 0 18 0 14, radius 22.
- Background `--toast-bg` with blur(20), text Subhead 15 semibold `--toast-label`, leading `checkmark.circle.fill` 20 in `--toast-accent`.
- **Position:** centered, 12 above the tab bar (or above the sheet's action bar when a sheet is open: in that case it sits above the bottom buttons).
- **Content:** "Đã chép · {thing} · {VI|EN}". The thing name truncates at 22 characters.
- **Undo variant:** "Đã xoá Lace Top" plus a trailing "Hoàn tác" text button in `--toast-accent`, shown for 5 s.
- Only one toast at a time; a new one replaces the old with a crossfade.
- `role="status"` with `aria-live="polite"`.

### 5.19 Empty state
- Centered block, max-width 280, with 48 padding top.
- Glyph 34 in `--label-3` (stroke 1.5), then 12 gap, then the title in `--font-display` 20/25 `--label`, then 6 gap, then the body Subhead 15/20 `--label-2`, then an optional plain button.

### 5.20 Note callout
Described in §4.2: `--accent-tint` background, radius 10, sparkle glyph 15, Footnote 13/18.

### 5.21 Paper card (message preview)
- `--bg-paper` (light `#FFFDF9`, dark `#2A231E`), 0.5px `--separator` border, radius 14, padding 16.
- Body 17/22, `white-space: pre-wrap`, `overflow-wrap: anywhere`. Emojis render as text.

---

## 6. Icons and app icon

### 6.1 Icon rules (SF Symbols-style, inline SVG)

- **Grid:** `viewBox="0 0 24 24"`. Live area 20×20 (2 px padding). Optical center is respected: a circle's diameter is 17, while a square's side is 15.
- **Attributes:**

  ```
  fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"
  ```

- **Stroke width** is set via CSS `--icon-stroke`: **1.6px** for glyphs 15–20, **1.75px** for 22–24 (tab bar and nav), **2px** for the seal checkmark.
- **Sizes used:** 13 (chevrons), 15, 17 (default inline), 20 (buttons, swipe), 22 (nav), 24 (tab bar), 34 (empty states).
- **Filled variants** for the selected state (tab icons and the active favourite): the same path with `fill="currentColor" fill-opacity=".18"` plus the stroke. The heart uses full `fill="currentColor"` when active.
- **Sprite:** one `<svg style="display:none">` with `<symbol id="i-copy">…`, referenced with `<svg class="i"><use href="#i-copy"/></svg>`. The total sprite is ≤ 4 KB.

### 6.2 Icon set (20)

| # | Name (SF analogue) | Used for | Path data (24 grid) |
|---|---|---|---|
| 1 | `doc.on.doc` | copy | `<rect x="8.5" y="8" width="11" height="13" rx="2.5"/><path d="M15.5 8V5.5A2.5 2.5 0 0 0 13 3H7a2.5 2.5 0 0 0-2.5 2.5v9A2.5 2.5 0 0 0 7 17h1.5"/>` |
| 2 | `checkmark` | seal, selected | `<path d="M5 12.5l4.5 4.5L19 7.5"/>` |
| 3 | `checkmark.circle.fill` | toast | `<circle cx="12" cy="12" r="9" fill="currentColor" stroke="none"/><path d="M7.8 12.3l2.9 2.9 5.6-5.8" stroke="var(--toast-bg)"/>` |
| 4 | `magnifyingglass` | search | `<circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.4 15.4L20 20"/>` |
| 5 | `xmark` | close, clear | `<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>` |
| 6 | `chevron.right` | disclosure | `<path d="M9.5 5.5L16 12l-6.5 6.5"/>` |
| 7 | `plus` | Thêm món | `<path d="M12 5v14M5 12h14"/>` |
| 8 | `minus` | stepper | `<path d="M5 12h14"/>` |
| 9 | `heart` | Yêu thích | `<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/>` |
| 10 | `clock` | Gần đây (empty state) | `<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>` |
| 11 | `hanger` | tab Mẫu | `<path d="M10 6.2a2 2 0 1 1 3 1.7c-.6.4-1 .9-1 1.6v.5"/><path d="M12 10l8.1 6.1c.9.7.4 2.1-.7 2.1H4.6c-1.1 0-1.6-1.4-.7-2.1L12 10z"/>` |
| 12 | `text.bubble` | tab Kịch bản, "kèm lời chào" | `<path d="M6.5 4h11A2.5 2.5 0 0 1 20 6.5v7.5a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 3.5v-3.5A2.5 2.5 0 0 1 4 14V6.5A2.5 2.5 0 0 1 6.5 4z"/><path d="M8 8.8h8M8 12h5"/>` |
| 13 | `bag` | tab Đơn, add to order | `<path d="M5.6 8h12.8l-.9 11.1a1.6 1.6 0 0 1-1.6 1.4H8.1a1.6 1.6 0 0 1-1.6-1.4L5.6 8z"/><path d="M9 10V7a3 3 0 0 1 6 0v3"/>` |
| 14 | `ruler` | size chart | `<rect x="3" y="8" width="18" height="8" rx="1.5"/><path d="M7 8v3M10.5 8v4.5M14 8v3M17.5 8v4.5"/>` |
| 15 | `globe` | language menu item | `<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.3 2.4 3.4 5.2 3.4 8.5s-1.1 6.1-3.4 8.5c-2.3-2.4-3.4-5.2-3.4-8.5s1.1-6.1 3.4-8.5z"/>` |
| 16 | `slider.horizontal.3` | Cài đặt | `<path d="M4 7h8.5M16.5 7H20M4 17h3.5M11.5 17H20"/><circle cx="14.5" cy="7" r="2"/><circle cx="9.5" cy="17" r="2"/>` |
| 17 | `pencil` | needs fill, edit | `<path d="M14.8 5.2l4 4L8.8 19.2H4.8v-4z"/><path d="M12.8 7.2l4 4"/>` |
| 18 | `sparkle` | note callout, thank card | `<path d="M12 3.5c.6 4.4 2.1 5.9 6.5 6.5-4.4.6-5.9 2.1-6.5 6.5-.6-4.4-2.1-5.9-6.5-6.5 4.4-.6 5.9-2.1 6.5-6.5z"/>` |
| 19 | `qrcode` | Gửi QR | `<rect x="4" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.2"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.2"/><path d="M13.5 13.5h2.5v2.5M20 13.5v.01M18 17.5V20h2M13.5 20h.01"/>` |
| 20 | `doc.on.clipboard` | paste customer info | `<rect x="5.5" y="5" width="13" height="16" rx="2.5"/><path d="M9 5V4.2c0-.7.5-1.2 1.2-1.2h3.6c.7 0 1.2.5 1.2 1.2V5M9 11h6M9 14.5h4"/>` |

Tab icons in their selected state add `fill="currentColor" fill-opacity=".18"` to the closed shapes: the hanger triangle, the bubble and the bag body.

**Drawing guidance for new icons:**
- Keep only 1.5–2 strokes of visual density.
- Corners use 1.2–2.5 radii (no sharp 90° corners except on the ruler ticks).
- Endpoints are rounded.
- Align strokes to whole and half units so a 1.75px stroke lands crisp on @3x.
- Never mix filled and outlined parts within one idle glyph.

### 6.3 App icon

**Concept, "The Seal":** an unhurried monogram pressed into warm paper, the same seal that appears when she copies, so the icon and the core interaction share one memory.

- **Canvas:** 1024 × 1024, square and full-bleed, with **no** rounded corners and **no** transparency (iOS applies the mask).
- **Background:** a vertical linear gradient from `#F6EFE5` (top) to `#EADFD1` (bottom), with a very soft paper grain: an `feTurbulence` baseFrequency 0.9, 1 octave, blended at 4% opacity in multiply mode. This is the film-like warmth.
- **Seal:** a circle centered at (512, 540), radius 300, fill `#9A5654` (Rosewood). It has an inner ring of radius 262, stroke 6, `#FFFCF7` at 35% opacity, which reads as the pressed wax edge. A shadow `0 18 40` `#5B2F2D` at 22% gives quiet depth.
- **Monogram:** the official Soft Embrace logomark (the "FA"-style monogram from the brand deck, imported as outlined vector paths, never retyped), filled `#F6EDE1` (cream). It is scaled so its bounding box is 300 × 300, centered optically in the seal (raised 8 px). The wordmark is **not** used, because text is illegible at 60 pt.
- **Keyline check:** the content sits inside the iOS 1024 grid circle (diameter 840) with ≥ 92 px of margin to the edge.
- **Production:**
  1. Author `icon-1024.svg` with the paths above, as pure SVG with no embedded raster.
  2. Rasterize: `rsvg-convert -w 1024 -h 1024 icon-1024.svg -o icon-1024.png`, then downscale with `magick icon-1024.png -filter Lanczos -resize 180x180 -strip apple-touch-icon.png`. Also export `icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` (the same art; the seal radius already fits the maskable 80% safe zone).
  3. Optimize: `oxipng -o 4 --strip all *.png`. Target `apple-touch-icon.png` ≤ 12 KB.
  4. Link it with `<link rel="apple-touch-icon" href="/apple-touch-icon.png">`, as the only size (iOS downsamples).
- **Launch images (splash):** the background fill `#FAF6F0` with the seal at 120 pt diameter, centered. No text. Light mode only (iOS does not pick a launch image by dark mode; the dark page paints within 1 frame).
  - `splash-1179x2556.png`, media `(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)`
  - `splash-1290x2796.png`, media `(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)`

---

## 7. Design tokens (paste-ready CSS)

**Accent choice: Rosewood (dusty rose).** The brand concept is *romance* of the past, and its textures are lace, film warmth and vintage interiors. A dusty rose carries that romance directly while staying muted, so it serves the "quiet confidence" emotion.
- Sage would read as botanical or wellness, which is a different brand register.
- Butter cannot reach 4.5:1 for text on cream without turning mustard, and it reads playful rather than poised.

Rosewood `#9A5654` reaches 5.1:1 on the cream background and 5.5:1 with a cream label on top of it, so a single hue works for links, icons and filled buttons.

```css
:root {
  color-scheme: light dark;

  /* ── Backgrounds ───────────────────────────── */
  --bg:               #FAF6F0;  /* plain background, launch, theme-color */
  --bg-grouped:       #F3EDE4;  /* page behind inset groups (linen) */
  --bg-cell:          #FFFCF7;  /* group cells, tiles */
  --bg-sheet:         #F7F2EA;  /* sheets (grouped-elevated) */
  --bg-paper:         #FFFDF9;  /* message preview card */
  --bg-disc:          #F3EAE0;  /* emoji disc */
  --bg-thumb:         #FFFFFF;  /* segmented thumb */

  /* ── Labels ────────────────────────────────── */
  --label:            #2B2420;  /* 13.1:1 on grouped */
  --label-2:          #6E625A;  /* 5.1:1 on grouped, 5.8:1 on cell */
  --label-3:          #8C8079;  /* 3.5:1 — placeholders, chevrons, disabled only */
  --label-4:          #B7ADA5;  /* decorative only */

  /* ── Accent (Rosewood) ─────────────────────── */
  --accent:           #9A5654;  /* 5.1:1 on bg, 4.7:1 on grouped */
  --accent-pressed:   #844745;
  --accent-tint:      #F6EAE6;
  --on-accent:        #FFFCF7;  /* 5.5:1 on accent */

  /* ── Semantic ──────────────────────────────── */
  --success:          #567253;  /* 5.0:1 on bg */
  --destructive:      #B0413E;  /* 5.3:1 on bg */
  --action-ink:       #4A3F38;
  --action-heart:     #C27C76;

  /* ── Fills & lines ─────────────────────────── */
  --fill-1:           rgba(120, 100, 85, 0.20);
  --fill-2:           rgba(120, 100, 85, 0.16);
  --fill-3:           rgba(120, 100, 85, 0.12);
  --fill-4:           rgba(120, 100, 85, 0.08);
  --fill-pressed:     rgba(60, 45, 35, 0.08);
  --separator:        rgba(60, 45, 35, 0.16);
  --separator-opaque: #E3DAD0;
  --glass-edge:       rgba(255, 255, 255, 0.55);

  /* ── Materials ─────────────────────────────── */
  --material-bar:     rgba(250, 246, 240, 0.78);
  --material-tab:     rgba(255, 252, 247, 0.72);
  --material-thick:   rgba(255, 252, 247, 0.86);
  --material-menu:    rgba(255, 252, 247, 0.80);
  --blur-bar:         saturate(180%) blur(20px);
  --blur-tab:         saturate(180%) blur(24px);

  /* ── Toast ─────────────────────────────────── */
  --toast-bg:         rgba(43, 36, 32, 0.90);
  --toast-label:      #FAF6F0;  /* 13:1 */
  --toast-accent:     #E8B4AE;

  /* ── Dim ───────────────────────────────────── */
  --dim:              rgba(0, 0, 0, 0.20);
  --dim-menu:         rgba(20, 14, 10, 0.18);

  /* ── Shadows ───────────────────────────────── */
  --shadow-float:     0 8px 24px rgba(43, 36, 32, 0.12), 0 1px 2px rgba(43, 36, 32, 0.06);
  --shadow-sheet:     0 -1px 0 rgba(43, 36, 32, 0.04), 0 -10px 30px rgba(43, 36, 32, 0.10);
  --shadow-menu:      0 16px 48px rgba(20, 14, 10, 0.18), 0 2px 6px rgba(20, 14, 10, 0.08);
  --shadow-thumb:     0 3px 8px rgba(0, 0, 0, 0.12), 0 3px 1px rgba(0, 0, 0, 0.04);

  /* ── Typography ────────────────────────────── */
  --font-ui:      -apple-system, BlinkMacSystemFont, "SF Pro Text", "Helvetica Neue", system-ui, sans-serif;
  --font-display: ui-serif, "New York", "Iowan Old Style", Georgia, serif;
  /* Sizes in rem: root = -apple-system-body (17px at default Dynamic Type). Caps keep layout safe. */
  --fs-large:     min(2rem,     44px);   /* 34 / 41  Large Title (display, 500) */
  --lh-large:     1.206;
  --fs-title2:    min(1.294rem, 30px);   /* 22 / 28  Title 2 (display, 500) */
  --lh-title2:    1.273;
  --fs-title3:    min(1.176rem, 26px);   /* 20 / 25  Title 3 (empty state, display) */
  --lh-title3:    1.25;
  --fs-headline:  min(1rem,     23px);   /* 17 / 22  Headline 600 */
  --fs-body:      min(1rem,     23px);   /* 17 / 22  Body 400 */
  --lh-body:      1.294;
  --fs-subhead:   min(0.882rem, 21px);   /* 15 / 20  Subhead */
  --lh-subhead:   1.333;
  --fs-footnote:  min(0.765rem, 19px);   /* 13 / 18  Footnote */
  --lh-footnote:  1.385;
  --fs-caption:   min(0.706rem, 17px);   /* 12 / 16  Caption 1 */
  --lh-caption:   1.333;
  --fs-tab:       10px;                  /* tab label, fixed (HIG) */
  --fw-regular: 400; --fw-medium: 500; --fw-semibold: 600; --fw-bold: 700;

  /* ── Spacing (8pt grid, 4 half-step) ───────── */
  --s-1: 4px;  --s-2: 8px;  --s-3: 12px; --s-4: 16px; --s-5: 20px;
  --s-6: 24px; --s-8: 32px; --s-10: 40px; --s-12: 48px;
  --margin: 16px;
  --hit: 44px;
  --nav-h: 44px;
  --tab-h: 62px;
  --tab-bottom: max(20px, calc(env(safe-area-inset-bottom) - 14px));
  --content-bottom: calc(var(--tab-bottom) + var(--tab-h) + 16px);
  --safe-top: env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);

  /* ── Radii (continuous where supported) ────── */
  --r-xs: 6px;     /* placeholder token */
  --r-sm: 9px;     /* segmented track, stepper */
  --r-md: 10px;    /* search field, callout */
  --r-group: 12px; /* inset group, tiles */
  --r-lg: 14px;    /* buttons, paper card, context menu */
  --r-xl: 20px;    /* sheet top */
  --r-full: 999px; /* chips, capsule, toast */

  /* ── Icons ─────────────────────────────────── */
  --icon-stroke: 1.6px;
  --icon-stroke-lg: 1.75px;

  /* ── Motion ────────────────────────────────── */
  --ease-sheet:   cubic-bezier(0.32, 0.72, 0, 1);
  --ease-out:     cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-in:      cubic-bezier(0.42, 0, 1, 1);
  --ease-spring:  linear(0, 0.009, 0.035 2.1%, 0.141 4.4%, 0.723 12.9%, 0.938 16.7%, 1.017 20.4%, 1.042 23.2%, 1.043 25.8%, 1.026 31.3%, 1.003 39.6%, 0.997 47.3%, 1);
  --d-press: 100ms;  --d-release: 200ms; --d-fast: 200ms; --d-base: 280ms;
  --d-sheet: 380ms;  --d-sheet-out: 300ms; --d-push: 420ms; --d-spring: 500ms;
}

@media (min-width: 414px) { :root { --margin: 20px; } }

@supports (corner-shape: squircle) {
  /* Continuous corners: a squircle needs a ~1.25× radius to read like Apple's continuous curve */
  :root { --r-group: 15px; --r-lg: 18px; --r-xl: 25px; }
  .cont { corner-shape: squircle; }
}

/* ── Dark ──────────────────────────────────── */
@media (prefers-color-scheme: dark) {
  :root {
    --bg:               #15110E;
    --bg-grouped:       #15110E;
    --bg-cell:          #221C18;
    --bg-sheet:         #1C1713;
    --bg-paper:         #2A231E;
    --bg-disc:          #33291F;
    --bg-thumb:         #5A4E46;

    --label:            #F3ECE3;  /* 14.4:1 on cell */
    --label-2:          #B4A89D;  /* 7.2:1 on cell */
    --label-3:          #8A7F76;  /* 4.3:1 — non-essential */
    --label-4:          #5E554E;

    --accent:           #D89A94;  /* 7.2:1 on cell */
    --accent-pressed:   #C6857F;
    --accent-tint:      rgba(216, 154, 148, 0.16);
    --on-accent:        #2B1715;  /* 7.2:1 on accent */

    --success:          #9CB898;
    --destructive:      #E07A72;
    --action-ink:       #6B5D53;
    --action-heart:     #B5716B;

    --fill-1:           rgba(200, 180, 165, 0.24);
    --fill-2:           rgba(200, 180, 165, 0.18);
    --fill-3:           rgba(200, 180, 165, 0.14);
    --fill-4:           rgba(200, 180, 165, 0.10);
    --fill-pressed:     rgba(243, 236, 227, 0.08);
    --separator:        rgba(243, 236, 227, 0.14);
    --separator-opaque: #3A312B;
    --glass-edge:       rgba(255, 255, 255, 0.10);

    --material-bar:     rgba(21, 17, 14, 0.76);
    --material-tab:     rgba(44, 37, 32, 0.72);
    --material-thick:   rgba(44, 37, 32, 0.88);
    --material-menu:    rgba(44, 37, 32, 0.82);

    --toast-bg:         rgba(58, 50, 44, 0.92);
    --toast-label:      #F3ECE3;
    --toast-accent:     #E8B4AE;

    --dim:              rgba(0, 0, 0, 0.45);
    --dim-menu:         rgba(0, 0, 0, 0.35);

    --shadow-float:     0 8px 24px rgba(0, 0, 0, 0.40), 0 1px 2px rgba(0, 0, 0, 0.30);
    --shadow-sheet:     0 -10px 30px rgba(0, 0, 0, 0.40);
    --shadow-menu:      0 16px 48px rgba(0, 0, 0, 0.50);
  }
}

/* ── Base (part of the same block) ─────────── */
html { font: -apple-system-body; background: var(--bg); -webkit-text-size-adjust: 100%; }
body {
  margin: 0; font-family: var(--font-ui); font-size: var(--fs-body); line-height: var(--lh-body);
  color: var(--label); background: var(--bg-grouped);
  -webkit-font-smoothing: antialiased; font-synthesis: none;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: none; position: fixed; inset: 0; overflow: hidden;
}
button, a, [role="button"], input, label { touch-action: manipulation; }
.num { font-variant-numeric: tabular-nums; }
.i { width: 17px; height: 17px; stroke-width: var(--icon-stroke); }
```

**Contrast verification (WCAG 2.x relative luminance, computed):**

| Pair | Ratio | Use |
|---|---|---|
| `--label` on `--bg-grouped` | 13.1 | body |
| `--label-2` on `--bg-grouped` / `--bg-cell` | 5.1 / 5.8 | secondary text |
| `--accent` on `--bg` / `--bg-grouped` / `--bg-cell` | 5.1 / 4.7 / 5.4 | links, icons, accent text |
| `--on-accent` on `--accent` | 5.5 | primary button label |
| `--accent` on `--accent-tint` | 4.65 | chips, callouts |
| `--toast-label` on `--toast-bg` (over cream) | ≥ 11 | toast |
| Dark `--label-2` on `--bg-cell` | 7.2 | secondary text |
| Dark `--accent` on `--bg-cell` | 7.2 | accent text |
| Dark `--on-accent` on `--accent` | 7.2 | primary label |
| `--label-3` (light) | 3.5 | **never used for essential text**: placeholder text, chevrons, disabled only |

---

## 8. Motion spec

All motion animates **`transform` and `opacity` only**. Two small exceptions:
- the stroke-dashoffset of SVG paths ≤ 24 px for checkmark drawing, which is negligible paint;
- the nav material, which is a pre-composited layer whose opacity fades.

| # | Interaction | Property | From → To | Duration | Curve | Notes |
|---|---|---|---|---|---|---|
| 1 | Press (buttons, tiles, chips) | transform | scale 1 → 0.97 (chips 0.94, copy circle 0.92) | 100 ms | `--ease-out` | fires on `pointerdown` |
| 2 | Release | transform | → 1 | 200 ms | `--ease-spring` (500 ms curve compressed) | on `pointerup` or cancel |
| 3 | Row highlight | opacity of `::before` (`--fill-pressed`) | 0 → 1 instant; 1 → 0 | 0 / 250 ms | linear | suppressed if the finger moves more than 10 pt (it was a scroll) |
| 4 | **Copy seal** | circle: opacity + transform | opacity 0 → 1, scale 0.6 → 1.12 → 1 | 320 ms | `--ease-spring` | replaces the copy glyph, which fades out over 100 ms |
| 4b | Seal checkmark | stroke-dashoffset | 18 → 0 | 220 ms, 80 ms delay | `--ease-out` | |
| 4c | Seal ring | transform + opacity | scale 1 → 1.4, opacity 0.4 → 0 | 450 ms | `--ease-out` | ring in `--accent` |
| 4d | Seal → idle | opacity crossfade | — | 200 ms after 1.4 s hold | linear | |
| 5 | Toast in | transform + opacity | translateY(12px) scale(.96), 0 → 0, 1 | 320 ms | `--ease-spring` | |
| 5b | Toast out | transform + opacity | → translateY(6px), 0 | 200 ms | `--ease-in` | after 1.6 s (5 s for undo) |
| 6 | Sheet open | transform | translateY(100%) → detent | **380 ms** | `--ease-sheet` | dim fades in over the same 380 ms |
| 6b | Background card (large detent) | transform | scale 1 → 0.92, translateY → `safe-top − 2` | 380 ms | `--ease-sheet` | plus `border-radius: 12px` set (not animated) on start |
| 6c | Sheet close | transform | → translateY(100%) | 300 ms | `--ease-sheet` | |
| 6d | Sheet snap after drag | transform | current → detent | `clamp(200, distance/velocity·1000, 380)` ms | `--ease-sheet` | velocity-aware |
| 6e | Rubber band | transform | formula §5.16 | live | — | rAF-driven |
| 7 | Large title collapse | opacity of nav material + inline title | 0 ↔ 1 | 200 ms | linear | triggered by IntersectionObserver, not a scroll handler |
| 8 | Tab switch | — | instant swap (iOS) | 0 | — | the tab lozenge slides with translateX over 280 ms `--ease-sheet`; the selected icon pops scale 0.88 → 1 over 300 ms `--ease-spring` |
| 9 | Push (settings sub-page) | transform | new: translateX(100%) → 0; old: 0 → −30%, plus a dim overlay 0 → 0.08 | 420 ms | `--ease-sheet` | edge swipe-back from x < 20 pt, interactive |
| 10 | Segmented thumb | transform | translateX | 250 ms | `--ease-sheet` | |
| 11 | Switch knob | transform | translateX(0 ↔ 20px) | 250 ms | `--ease-sheet` | |
| 12 | Swipe action settle | transform | translateX → open / 0 | 300 ms | `--ease-sheet` | |
| 13 | Context menu lift | transform + opacity | preview scale 1 → 1.03; menu scale .9 → 1, opacity 0 → 1 (origin at the preview edge) | 250 ms | `--ease-spring` | blur layer opacity 0 → 1 over 200 ms |
| 14 | Search enter | transform + opacity | tab capsule scaleX → circle (origin left), search circle → field (scaleX from right) | 320 ms | `--ease-sheet` | the field is a separate element that crossfades in at 50% |
| 15 | List insert (order line) | transform + opacity | translateY(−8px), 0 → 0, 1; rows below FLIP from the old position | 280 ms | `--ease-sheet` | **never animate height** |
| 16 | List delete | transform + opacity | translateX(−100%) over 200 ms, then FLIP the rows below upwards over 250 ms | 200 + 250 ms | `--ease-sheet` | |
| 17 | Inline row expand (order line) | transform + opacity | the expansion panel is absolutely positioned; following rows FLIP down 52 pt | 250 ms | `--ease-sheet` | |
| 18 | Placeholder pulse | transform | scale 1 → 1.04 → 1 | 240 ms | `--ease-out` | |
| 19 | Tab badge bump | transform | scale 1 → 1.25 → 1 | 300 ms | `--ease-spring` | |
| 20 | Button morph "Chép đơn" → "Đã chép ✓" | opacity crossfade of 2 stacked labels | — | 200 ms | linear | the width stays fixed (min-width 148) |

**Reduced motion** (`@media (prefers-reduced-motion: reduce)`):
- Every transform animation becomes an opacity-only fade of 150 ms, linear.
- Sheets still slide (they are spatial), but over 250 ms with `--ease-out`, **no background scaling** and no rubber band beyond 8 pt.
- The seal shows the filled state without the pop or ring.
- No tab icon pop, no badge bump, no placeholder pulse (a 2px outline flash instead).
- FLIP reorders are instant.

**Haptics** (iOS Safari has no `navigator.vibrate`):
- **Haptic shim:** a hidden `<label><input type="checkbox" switch></label>` that is toggled by `label.click()` *inside the same user-gesture handler*. On iOS 18+ this fires the system light haptic. It is used only for: copy success, full-swipe trigger, context menu open, and sheet snap-to-detent after a drag.
- **Android:** `navigator.vibrate(8)`.
- **Visual equivalents** always fire regardless: the seal pop (copy), the row lift (menu), and the grabber flash (opacity 0.5 → 1 over 120 ms on snap).

---

## 9. Emotional design & microcopy

### 9.1 Voice rules (Romantic Calm, "a clear whisper")
- Short: the UI never uses more than 8 words in a line.
- Sentence case, no exclamation marks, no ALL CAPS.
- Soft endings: "nhé", "nha" (max one per message).
- Address: in UI chrome she is "bạn". Brand self-reference is "Soft Embrace", never "chúng tôi".
- Emojis: none in UI chrome. Message texts keep whatever the CS Flow sheet uses.

### 9.2 Microcopy catalogue (VI, final)

| Context | Copy |
|---|---|
| Tab labels | "Mẫu", "Kịch bản", "Đơn" |
| Large titles | "Mẫu", "Kịch bản", "Đơn hàng", "Tìm kiếm", "Cài đặt" |
| Greetings | see §4.1 |
| Section headers | "Gần đây", "Lời chào", "Yêu thích", "Set", "Tất cả mẫu · N", "Món", "Phí ship", "Thông tin nhận (tuỳ chọn)", "Điền nhanh" |
| Greeting tiles | "Khách mới / Lần đầu ghé", "Khách quen / Đã từng mua" |
| Copy toast | "Đã chép · {tên} · VI" |
| Added to order | "Đã thêm {tên} · {màu} · {size} vào đơn" |
| Order copied | "Đã chép đơn · {tổng} · VI" |
| Undo toasts | "Đã xoá {tên} · Hoàn tác", "Đã làm mới đơn · Hoàn tác" |
| Copy failed | "Chưa chép được. Chạm giữ đoạn văn để chép tay nhé." |
| Needs fill (row) | "Cần điền: {tên ô}" |
| Fill button (disabled) | "Điền {N} chỗ nữa" |
| Auto-fill note | "Lấy từ Đang tư vấn" |
| Context chip | "Đang tư vấn: {tên} · {màu} · {size}" |
| Suggestion | "Thêm {tên} · {màu} · {size}" + "gợi ý" |
| Thank card | "Khách đã chuyển khoản?" / "Gửi lời cảm ơn thật ấm nhé." / "Chép lời cảm ơn" / "Đơn mới" |
| Total bar empty | "Chưa có món" |
| Autosave | "Đã lưu" |
| Order copied, footer | "Chúc đơn này đến tay thật êm." (Footnote under the total bar, 4 s) |
| QR tip (once) | "Lưu QR vào Ảnh một lần, lần sau gửi từ thư viện Instagram cho nhanh nhé." |
| Offline (never blocks) | none; the app is fully offline and shows no message |
| Update ready | "Có bản mới — mở lại app để cập nhật nhé." (toast, once) |

### 9.3 Empty states

| Where | Glyph | Title (serif) | Body | Action |
|---|---|---|---|---|
| Đơn, no lines | `bag` | "Đơn còn trống" | "Thêm món đầu tiên để bắt đầu nhé." | "Thêm món" |
| Search, no results | `magnifyingglass` | "Chưa tìm thấy “{q}”" | "Thử một tên ngắn hơn nhé." | — |
| Search, empty query, no recents | `clock` | "Tìm gì cũng nhanh" | "Tìm theo tên mẫu, kịch bản, hay từ trong tin nhắn." | — |
| QR not set | `qrcode` | "Chưa có mã QR" | "Thêm trong Cài đặt › Chuyển khoản nhé." | "Mở Cài đặt" |
| Content wiped (after restore) | `sparkle` | "Mọi thứ như mới" | "Nội dung gốc đã được khôi phục." | — |

### 9.4 Delight budget (deliberately small)
1. **The seal stamp** on every copy: the signature moment, tied to the app icon.
2. **The time-of-day greeting.**
3. **The serif titles** with the warm cream palette, which give a quiet "letter" feeling.
4. The order-sent footer line.

Nothing else: no sounds, no confetti, no streaks, no mascots.

---

## 10. Accessibility

- **Contrast:** every essential text pair is ≥ 4.5:1 (table in §7). Non-text UI (icons, focus, switch track) is ≥ 3:1. `--label-3` is never used for essential text.
- **Dynamic Type:** the root is `font: -apple-system-body`, so all `--fs-*` scale with the iOS Text Size setting and are capped (see the tokens).
  - Row heights are `min-height`, not `height`, so rows grow with the text.
  - At sizes ≥ 22 px body, product subtitles wrap to 2 lines and the greeting tiles stack vertically (`@container (max-width: 170px)`).
- **Hit targets** are ≥ 44×44 everywhere, including the language segments, the ✕ on the context chip, the stepper halves and the swipe actions.
- **VoiceOver:**
  - Tab bar: `role="tablist"`, items `role="tab"` with `aria-selected`. The badge is read as "Đơn, 2 món".
  - Rows: the row body is a button labelled "{tên}, {giá}, mở chi tiết". The copy button is a separate button labelled "Chép {tên}".
  - Swipe and context-menu actions are also exposed through `aria-describedby` hints and are **all available elsewhere**: in the sheet or in the menu button "Thêm" for VoiceOver users, so there are no gesture-only features.
  - Sheets: `role="dialog"`, `aria-modal`, labelled by the sheet title. Focus moves to the title on open and returns to the invoking control on close. The grabber is `aria-hidden`; there is an explicit close button.
  - Toasts: `role="status"` and `aria-live="polite"`. Error toasts use `role="alert"`.
  - Placeholder tokens in the preview are read as "ô trống: size". Filled tokens are read as their value.
  - Language: `<html lang="vi">`. EN previews get `lang="en"`.
- **Reduced motion:** see §8.
- **Reduced transparency / high contrast:** under `@media (prefers-contrast: more)`, materials turn solid (`--bg-cell`), separators become `--separator-opaque` at 1px, and `--label-2` darkens to `#5A4F48`. The same solid fallback applies when `backdrop-filter` is unsupported, via `@supports not`.
- **Focus:** `:focus-visible` gets a 2px `--accent` ring with 2px offset and radius matching the element (for hardware keyboards on iPad and Mac Safari).
- **No time limits:** the undo toast stays 5 s and pauses while touched. The context expiry does not interrupt anything.
- **Selection:** message previews are selectable text, so manual copy is always possible and acts as the clipboard fallback.

---

## 11. Performance budget & implementation rules

### 11.1 Budget (iPhone 14 Pro, standalone, measured with Safari Web Inspector)

| Metric | Budget |
|---|---|
| `index.html` (inline CSS + JS + data + icon sprite), raw / gzip | ≤ 150 KB / ≤ 45 KB |
| of which JS (minified) | ≤ 25 KB |
| of which CSS (minified) | ≤ 14 KB |
| Seed data JSON | ≤ 80 KB raw |
| Requests at launch (warm, from SW cache) | 1 (HTML). Manifest and icons are not on the critical path |
| Warm launch → first paint | ≤ 50 ms |
| Warm launch → interactive (handlers bound, list rendered) | **< 100 ms** |
| Cold launch (SW cache, app killed) → interactive | < 300 ms |
| Tap copy → visual feedback | ≤ 16 ms (same frame) |
| Interaction to Next Paint (any) | ≤ 50 ms |
| Long tasks > 50 ms | 0 after load |
| Frame rate during sheet drag, scroll, swipe | 120 fps on ProMotion, never < 60 |
| Search filtering per keystroke | ≤ 2 ms for 200 entries |
| localStorage total | ≤ 1 MB (QR ≤ 80 KB) |

### 11.2 File and architecture rules
1. Ship **one `index.html`** with inline `<style>` in `<head>`, an inline seed `<script type="application/json" id="seed">`, and an inline `<script>` at the end of `<body>` (not `defer`, not module). Next to it: `manifest.webmanifest`, `sw.js`, icons and splash PNGs. **No framework, no build-time runtime libraries, no web fonts, no external requests.**
2. The **first render is synchronous** in the end-of-body script: parse the seed, merge localStorage overrides, render the Mẫu tab HTML via one `innerHTML` string, bind delegated listeners. This runs before first paint, so there is no flash of unstyled or empty content. Other tabs render lazily on first visit (during idle via `setTimeout(…, 0)` after first paint).
3. **Event delegation:** one `click` listener per tab root, using `data-action` attributes. No per-row listeners.
4. **State:** a single plain object. Persistence to localStorage is debounced by 300 ms and wrapped in `try/catch`. Writes also happen on `visibilitychange → hidden`.
5. **Service worker:** cache-first for the app shell with a versioned cache name (`se-v1.0.0`). Updates download in the background and activate on the next launch. Never reload under her, then show the "Có bản mới" toast once.

### 11.3 Launch and no white flash
```html
<html lang="vi" style="background:#FAF6F0">
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="color-scheme" content="light dark">
<meta name="theme-color" content="#FAF6F0" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#15110E" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Soft Embrace">
<meta name="format-detection" content="telephone=no">
<link rel="apple-touch-icon" href="apple-touch-icon.png">
<link rel="apple-touch-startup-image" href="splash-1179x2556.png" media="(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)">
<link rel="apple-touch-startup-image" href="splash-1290x2796.png" media="(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)">
<link rel="manifest" href="manifest.webmanifest">
```
- The `<style>` block begins with `html{background:#FAF6F0}` and its dark media variant `#15110E`, **before** anything else.
- Manifest: `"display":"standalone"`, `"background_color":"#FAF6F0"`, `"theme_color":"#FAF6F0"`, `"orientation":"portrait"`, `"start_url":"./?source=pwa"`, `"scope":"./"`, `"name":"Soft Embrace CS"`, `"short_name":"Soft Embrace"`, icons 192, 512 and a 512 maskable.
- **Status bar:** use `black-translucent` so content draws under the status bar (safe-area top 59) and the nav material covers it.
  - **QA gate:** in light mode, status glyphs must render dark on cream. If a given iOS version renders them white, switch to `default`. The layout needs no change because every offset uses `env(safe-area-inset-top)`.

### 11.4 Rendering rules
- **Animate only `transform` and `opacity`.** Never animate `height`, `top`, `width`, `margin`, `box-shadow` or `filter`. Shadows that change are pre-rendered on a `::after` whose opacity animates.
- `will-change: transform` is set **only during** a gesture or animation and removed on `transitionend`. Permanent layers: tab bar, nav material, sheet.
- `backdrop-filter` appears only on: nav bar (when scrolled), tab bar, search button, total bar, toast, context menu backdrop. Never on sheets or scrolling content. Never stack more than 3 blurred layers at once.
- **No layout thrash:** read geometry (`getBoundingClientRect`) in one batch, then write in the next `requestAnimationFrame`. FLIP animations follow read, write, then invert in a transform.
- Long lists: each section uses `content-visibility: auto; contain-intrinsic-size: auto 600px`. Each row uses `contain: layout paint style`.
- Images: only the QR image, decoded with `img.decode()` before the sheet opens.
- Text: `text-rendering: optimizeLegibility` only on the large display titles; the default elsewhere.

### 11.5 Touch, scroll and gestures
- `body` is fixed and does not scroll. **Each tab has its own scroller** (`overflow-y: auto; overscroll-behavior-y: contain; -webkit-overflow-scrolling: touch`), which preserves per-tab scroll positions and keeps native rubber-banding inside the list while the bars stay still.
- `touch-action: manipulation` on all interactive elements (removes the 300 ms delay and double-tap zoom). `touch-action: none` only on sheet grabbers and headers and on swipeable row content while a horizontal swipe is locked (direction lock after 10 pt: |dx| > |dy| × 1.2).
- **Listeners:** `touchstart` and `touchmove` are `{ passive: true }` everywhere except the sheet drag handle (`passive: false` only there). An empty passive `touchstart` on `document` enables `:active` in iOS Safari.
- `-webkit-tap-highlight-color: transparent`, with our own pressed states (§5).
- `-webkit-touch-callout: none` and `user-select: none` on rows, chips and buttons. Previews stay selectable.
- **Pointer events** handle drags, using `setPointerCapture`. Velocity is computed from the last 100 ms of samples.

### 11.6 Keyboard (no jank)
- Inputs use `font-size ≥ 16px` (17 is used), so there is no auto-zoom. `maximum-scale` is not used, so pinch-zoom stays available.
- Bottom-docked elements (search field, fill-sheet "Chép" button) follow `visualViewport`. On `visualViewport` `resize` and `scroll`, set `transform: translateY(-(innerHeight − vv.height − vv.offsetTop)px)` inside rAF. Never change `bottom` or `height`.
- When a field focuses inside a sheet, snap the sheet to the large detent **before** calling `focus()`, in the same tap handler. Focus must stay inside the gesture so the keyboard opens.
- Prevent iOS from scrolling the page on focus: the focused field is already visible, and the body is fixed.

### 11.7 Clipboard (reliability is the product)
```js
function copy(text, meta) {
  showCopiedOptimistic(meta);                 // 1. feedback in the same frame
  let ok = false;
  try {                                        // 2. sync call inside the click handler (user gesture)
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(
        () => commitRecent(meta),
        () => { if (!legacyCopy(text)) rollbackCopied(meta); else commitRecent(meta); }
      );
      return;
    }
  } catch (_) {}
  ok = legacyCopy(text);
  ok ? commitRecent(meta) : rollbackCopied(meta);
}
function legacyCopy(text) {
  const ta = document.createElement('textarea');
  ta.value = text; ta.setAttribute('readonly', '');
  ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;font-size:16px;';
  document.body.appendChild(ta);
  ta.focus({ preventScroll: true });
  ta.setSelectionRange(0, text.length);
  let ok = false; try { ok = document.execCommand('copy'); } catch (_) {}
  ta.remove(); return ok;
}
```
- Copy runs on **`click`**, never on `touchstart` or after an `await` (an await loses the user activation on iOS).
- Build the text **synchronously** before the call: placeholder resolution, money formatting and the recap all run synchronously.
- **Rollback** (`rollbackCopied`): the seal swaps to the error glyph, the error toast shows, and a fallback sheet opens with the full text pre-selected for manual copy.
- **Normalisation:** line endings become `\n`, trailing spaces are trimmed, and runs of 3+ blank lines collapse to 1.

### 11.8 Implementation checklist for builders
- [ ] No `height` or `top` animations (grep the CSS for `transition: height`).
- [ ] No `setInterval`. Timers exist only for toasts and autosave debounce.
- [ ] No `scroll` listeners for UI state. Use IntersectionObserver.
- [ ] Every localStorage access is wrapped in `try/catch`.
- [ ] All strings live in one `STR` object (VI) for easy editing.
- [ ] Money formatting: `new Intl.NumberFormat('vi-VN').format(n) + 'đ'` (VI) and `new Intl.NumberFormat('en-US').format(n) + ' VND'` (EN). Cache the formatters.
- [ ] Diacritic-insensitive search: `s.normalize('NFD').replace(/\p{M}/gu,'').replace(/đ/gi,'d').toLowerCase()`, precomputed per entry.

---

## 12. QA checklist (audit round)

Run on a **real iPhone 14 Pro and 15 Pro Max**, installed via Add to Home Screen, in both light and dark mode. Each item passes or fails.

### 12.1 Launch & shell
- [ ] No white or black flash between the splash and the first paint, in light and dark mode.
- [ ] Opens standalone with no Safari UI. The status bar area shows cream (light) or warm black (dark), and the glyphs are legible (§11.3 gate).
- [ ] The home-screen icon is the seal on cream, crisp, with the label "Soft Embrace".
- [ ] Airplane mode: the app opens and every feature works.
- [ ] Warm launch reaches interactive in under 100 ms (Web Inspector timeline). Cold launch is under 300 ms.
- [ ] Relaunch within 30 minutes restores the tab, scroll position and open sheet. After 30 minutes it opens on Mẫu. The order draft always persists.

### 12.2 Layout per device
- [ ] At 393: margins 16, tab capsule bottom 20 pt above the screen edge, no content hidden behind the tab bar at the end of any list (98 / 170 padding).
- [ ] At 430: margins 20, tiles 191 wide, the medium sheet detent is 559 pt.
- [ ] Nothing overlaps the Dynamic Island. The nav bar sits at y = 59–103.
- [ ] No horizontal scroll on any screen. Long Vietnamese names ellipsize; they do not overflow.
- [ ] Every hit target is ≥ 44×44 (check with the Inspector overlay).

### 12.3 HIG components
- [ ] The large title collapses to the inline title with the material and hairline appearing exactly when the title passes under the bar.
- [ ] Inset grouped lists: radius 12, separators inset correctly, no separator after the last row.
- [ ] Segmented thumb slides; the language state is consistent between the nav bar and the sheets.
- [ ] Sheets: grabber present, medium and large detents, rubber band past large, swipe-down dismiss, tap-dim dismiss, background scales only at large.
- [ ] Context menu on a 450 ms hold, never the native text callout on rows.
- [ ] Swipe actions: reveal, snap, full-swipe trigger, only one open at a time, closed on scroll.
- [ ] The tab lozenge moves, the selected icon is filled, the badge shows the line count, and tapping the active tab scrolls to top.
- [ ] The search button morphs into a bottom field, the keyboard opens on the first tap, and the field rides above the keyboard with no jump.

### 12.4 Core tasks (time each with a stopwatch, target in brackets)
- [ ] T1 new customer: greeting + product info in 2 taps (< 4 s including the Instagram round trip).
- [ ] T2 size chart: 2 taps. Swipe-left "Size" also works.
- [ ] T3 set: 1 tap. The copied text contains the combined price.
- [ ] T4 order: 3 taps with context, 4 without. The total is correct across qty, freeship and custom fee.
- [ ] T5 thank-you: 2 taps from Mẫu, 1 from Đơn.
- [ ] Placeholders: context auto-fill works; unfilled rows show "Cần điền"; "Chép" stays disabled until filled; copied text has no brackets.
- [ ] EN mode: every copy is EN, toasts show "EN", money is in the "450,000 VND" format.

### 12.5 Clipboard reliability
- [ ] 50 consecutive copies across all copy surfaces: 50/50 succeed and paste correctly into Instagram DM (line breaks and emojis intact).
- [ ] Copy works on the first tap right after launch (no "first gesture" failure).
- [ ] A forced failure (simulate a rejection) shows the error toast and the manual-copy fallback sheet.
- [ ] The "Gần đây" list updates only after a successful copy.

### 12.6 Motion & feedback
- [ ] Seal and toast appear in the same frame as the tap (slow-motion screen recording: 0 frames delay).
- [ ] Sheet opens in 380 ms with the specified curve and no stutter at 120 Hz (Inspector frames: no frame > 16.7 ms).
- [ ] With Reduce Motion on, there is no scaling or springs, only fades; sheets slide with no background scale.
- [ ] The haptic shim fires on copy on iOS 18+. No errors on older versions.
- [ ] No animation of layout properties (Inspector "Layout" events during animations = 0).

### 12.7 Visual & dark mode
- [ ] Token hex values match §7 (spot-check 10 with a color picker on screenshots).
- [ ] Contrast spot-check of every text style in both modes ≥ 4.5:1 (except documented `--label-3` uses).
- [ ] Serif appears only on large titles, sheet titles, the greeting, empty-state titles and the total. Vietnamese diacritics render correctly in New York (check "Chiều dịu dàng", "Đơn hàng", "Kịch bản").
- [ ] No emoji in UI chrome. Product emojis appear only in discs and message texts.
- [ ] Dark mode: no pure black or pure white surfaces; the accent is `#D89A94`; materials stay legible.

### 12.8 Accessibility
- [ ] VoiceOver can complete T1–T5 without any gesture-only action.
- [ ] At Text Size XXL, nothing clips; rows grow; tiles stack.
- [ ] Increase Contrast gives solid materials and stronger separators.
- [ ] Focus returns to the invoking row after a sheet closes.

### 12.9 Performance & robustness
- [ ] `index.html` gzip ≤ 45 KB. No external network requests (Network tab).
- [ ] Scroll a 200-product stress dataset at 120 fps. Search on it stays ≤ 2 ms per keystroke.
- [ ] Private mode or blocked storage: the app still works (state in memory) with no crash.
- [ ] Edits autosave and survive a kill. Export → Import round-trips exactly. "Khôi phục nội dung gốc" restores the seed.
- [ ] A service worker update shows the "Có bản mới" toast once and applies on the next launch, never mid-session.
