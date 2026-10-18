# Soft Embrace Reply — Design v5: "Biết mình đang ở đâu, biết chạm vào đâu"

Status: **decided**. This spec supersedes the visual and interaction parts of Round 4 (`docs/v2-report.md` § Round 4) and of `design-v2.md` §C.1, §D.3, §E.3 and §F. Data model, `composeCopy`, lead-in storage, sets data, the clipboard path, the guards and the performance rules stay as they are. Where this document is silent, the current build (Round 4) applies.

Sources read: `docs/design-v2.md`, `docs/v2-report.md`, `src/app.css`, `src/app.js`, `src/index.src.html`, `src/compose.js` (STAGES). Screens viewed: the founder's iPhone 15 Pro Max dark-mode screenshots (home, product list, product sheet, set sheet) and `shots/393-02`, `393-09`, `393-18` (light).

Scale used below: **pt = CSS px**. Her screenshots are 1290 px wide, so 3 px = 1 pt. In the 923 px previews, 2.147 px = 1 pt.

---

## 0. The decisions on one page

| # | Founder feedback | Decision |
|---|---|---|
| 1 | Icon | **Candidate B: Vanilla `#F2E7AB` tile with a Jet `#2A2B2A` logomark** (11.37 : 1). `PICK = "B"`, and the manifest `background_color` becomes `#F2E7AB`. |
| 2 | Nav sits too high | The bottom inset was counted twice: once by the host page and once by the app. From now on there is **one source**, `--inset-b`, measured in JS. When anything outside the app already owns the bottom edge (Safari's toolbar, a host frame, or a host that shrank our box), it is 0. The bar sits at `max(inset-b − 10, 12)` above the app's bottom edge: **24 pt on a 15 Pro Max home screen app, 12 pt everywhere else**. `html` and `body` use the app background, so no band can show. |
| 3 | Cart looks like a trash can | The bag becomes a **clipboard with a list (receipt)** glyph plus the word **"Đơn"** under it, and a count badge. |
| 4 | Product sheet is confusing | **No accordion.** A segmented control **Thông tin · Bảng size · Cả hai** sets what is being sent. There is **one** always-visible box titled "Tin sẽ gửi" and **one** primary button, "Chép thông tin · VI". The opening line is a **dropdown row** ("Câu mở đầu: Không kèm ⌄") that opens a radio picker. Add to order, link and set sit in **separate labelled sections** below. |
| 5 | Set sheet is bad | It becomes a vertical list of **bubble cards**: number, name, box, then the card's own "Chép tin n" button. There are **16 pt gaps** between cards, **16 pt card padding** and **12 pt** between box and button. Exactly one card is tagged **"Tiếp theo"**. **Product photos are circles everywhere**, at fixed sizes 32/44/56/72. |
| 6 | Rose reads as danger | **The primary action colour is Davy's Grey `#4D5162` in light mode** (Baby powder text, 7.59 : 1) **and Vanilla `#F2E7AB` in dark mode** (Jet text, 11.37 : 1). **Old Rose is removed from the UI completely.** Selection never uses a coloured ring: it uses a raised thumb, a filled radio or a check. |
| 7 | Controls must explain themselves | One control grammar, applied everywhere: **capsule = it does something** (always a verb), **rounded box = content you can edit** (with a "✎ Sửa" button), **row with ⌄ = choose from a list**, **row with › = opens a page**, **switch = on/off**, **segmented = which view**. Outline chips no longer exist. An inserted opening line appears as a **highlighted strip at the top of the box**. |

---

## 1. Audit: current screens → problems → fixes

| Screen (current) | Problem seen | Fix in v5 (section) |
|---|---|---|
| **All screens, bottom** (her 2.webp, 3.webp) | The bar's bottom edge sits about **91 pt** above the glass. Under the app is a flat dark band of about **60 pt** (1872→2000 px in the 923 preview), and the bar floats **31 pt** above that band, which is exactly the app's own `max(34−12,0)+10`. The host already reserved the bottom and the app added the inset again. The band is a different colour from the app background (host or `html` background showing through). | §4: single `--inset-b`, frame and shrink detection, a host override, `html`/`body` painted `--bg-grouped`, bar at 24 / 12 pt. |
| **Nav: order button** | The bag glyph is a trapezoid that narrows toward the bottom, with a short handle on top, so it reads as a bin. It has no label. The badge is rose, which reads as an alert. | §6.2: clipboard-list glyph, the label "Đơn", a neutral ink badge. |
| **Header VI/EN** | The selected language is a rose-outlined pill, which looks like a validation error. | §7.1: neutral segmented control with a raised thumb. |
| **Home tiles** | Rose number discs. No sign that a tile opens something. | §7.2: neutral step discs and a › on every tile. |
| **Trả lời nhanh: stage switcher** | The selected stage gets a rose outline, which reads as "error". The title stays "Trả lời nhanh" whatever the stage, so there is no "you are here". | §7.3: segmented control with a thumb. The title becomes the stage name, with the eyebrow "Bước 2/5". |
| **Stage cards** | Product chips ("Butter Top", "Fleur…", "Mẫu khác…") are pills with no verb, and it is unclear whether a tap copies, selects or opens. | §7.3: product rows with a photo and a › that read "Mở thông tin mẫu", and "Tìm mẫu khác" as a search row. |
| **Message sheet** | "Chạm vào khung để sửa trực tiếp" is an instruction, not a control. The fill chips are pills. | §7.4: "✎ Sửa" button on the box. Fills use a segmented control (size) or dropdown rows (product). |
| **Tạo đơn** | Size pills "S · 1" have no verb. The rose "1" badge on the stage. The footer's rose "Chép đơn". | §7.5: "+ S" tonal buttons, a count line "Trong đơn: S × 1", neutral badges, a Davy/Vanilla primary. |
| **Sản phẩm: filters** | Five pills, with the selected one rose-outlined. | §7.6: one segmented control "Tất cả · Áo · Váy · Đầm · Quần". |
| **Product sheet** (her 4.webp) | (a) The accordion: tapping "Bảng size" collapses the info box, and nothing says which part is open. (b) Four 34 pt outlined/grey lead chips plus "+ Thêm câu" plus "+ Link bài viết" fill half the screen, and it is not obvious that a tap inserts a sentence. (c) Two "Chép · VI" buttons plus a rose primary: three copy buttons with different targets. (d) The header language control again, and a box with its top clipped under the header. | §7.7: segmented control, one box, one primary, a dropdown for the opening line, sections below. |
| **Set sheet** (her 5.webp) | The "Chép · VI" button touches the box's top-right corner (0 pt gap). The section caps are long ("GIÁ SET (ĐỂ TRỐNG = TỔNG GIÁ LẺ)"). Photos are rounded squares here but circles in the list. Two rose fills compete (bubble button and footer). The red dot plus "chưa kiểm tra giá" reads as an error. | §7.8: bubble cards, a circle-only avatar system, one primary in the footer, a neutral ⓘ notice. |
| **Settings** | Mostly fine. The rose "Xong" and rose switches. | §7.10: accent tokens. |
| **Pickers** | Pill filters, rose selection fill (`--accent-tint` row). | §7.9: segmented filter and a check mark on the chosen row. |

---

## 2. Foundations

### 2.1 Colour: rules

1. **One action colour per mode, used only for "do it now" fills**:
   - Light: `--primary #4D5162` (Davy's Grey), with text `--on-primary #FCFBF5`.
   - Dark: `--primary #F2E7AB` (Vanilla), with text `--on-primary #2A2B2A`.

   Why two hues: on the dark ground Davy's Grey is only 2.15 : 1 (it fails the 3 : 1 non-text rule), and in light mode Vanilla on Baby powder is 1.21 : 1 (invisible). Each mode therefore takes the brand colour that is clearly visible on its ground. Both are calm: a cool slate and a soft butter. Neither sits in the red family. Dark Vanilla also echoes the new icon.
2. **`--accent-ui`** is the same hue as `--primary`, used as text and lines for links, the radio dot, the check, the focus ring, the selected nav icon and the "Tiếp theo" ring. Light `#4D5162`, dark `#F2E7AB`.
3. **`--insert`** is Vanilla. It is used in **both modes** for one meaning only: *"this sentence was added to your message"*, i.e. the opening-line strip and its arrival flash.
4. **Old Rose `#CC8C87` and `#A84E47` are removed from every UI token, glyph and badge.** Rose survives only inside the founder's own copy text (🌷 emoji) and product photos. The unit test that greps for brown is extended to also fail on `CC8C87`, `A84E47`, `93443E`, `DDA39E`, `F4E9E3` and `E3B0AB` in `src/` and `build.py`.
5. **Red (`--destructive`) appears only on**: the "Xoá" / "Xoá set" text buttons, destructive confirm dialogs, and the copy-failure toast icon. A "chưa kiểm tra giá" notice, a missing language or a truncated text are **notices, not errors**. They use an ⓘ glyph in `--label-2`.
6. **Selected state is never a coloured outline.** Segmented controls use a raised thumb, lists use a check or filled radio, binary options use a switch, and nav uses a tinted pill plus the accent icon.

### 2.2 Light tokens (replace the `:root` block)

| Token | Value | Use | Contrast (text tokens vs their main surface) |
|---|---|---|---|
| `--bg` | `#FCFBF5` Baby powder | header, `html`, `body` background in light | — |
| `--bg-grouped` | `#F6F4EE` | screen ground | — |
| `--bg-cell` | `#FFFEFB` | cards, rows, dropdown rows | — |
| `--bg-sheet` | `#FBFAF5` | sheets | — |
| `--bg-paper` | `#FFFEFB` | text boxes | — |
| `--label` | `#2A2B2A` Jet | primary text | 12.92 on grouped, 13.71 on bg |
| `--label-2` | `#545553` | secondary text | 6.82 on grouped, 7.17 on sheet |
| `--label-3` | `#666765` | tertiary, chevrons | 5.17 on grouped, 5.44 on sheet |
| `--label-4` | `#B2B2AE` | placeholder, disabled (decorative) | below 4.5 by design |
| `--icon` | `#6B6C69` | nav icons and labels, unselected | 5.10 on bar material |
| `--primary` | `#4D5162` Davy's Grey | primary fill | 7.59 vs bg (shape) |
| `--primary-pressed` | `#3C3F4D` | pressed primary | — |
| `--on-primary` | `#FCFBF5` | text on primary | **7.59** on `#4D5162`, **10.08** on pressed |
| `--accent-ui` | `#4D5162` | links, radio, check, focus, selected nav | 7.53 on sheet, 7.80 on cell |
| `--sel-fill` | `#EDEDEC` (Davy 10 % on cell) | selected nav pill, selected list row | Jet on it 11.71 |
| `--tonal` | `#E6E6E3` (Davy 12 % on sheet) | secondary (tonal) buttons | Jet on it 11.37 |
| `--tonal-pressed` | `rgba(77,81,98,.20)` | — | — |
| `--insert` | `#F7F0CB` (Vanilla 60 % on paper) | arrival flash of an inserted line | Jet on it 12.37 |
| `--insert-rest` | `#FAF6E2` (Vanilla 30 %) | resting tint of the opening-line strip | Jet ≥ 12.8 |
| `--thumb` | `#FFFFFF` | segmented thumb | — |
| `--seg-track` | `rgba(42,43,42,.06)` | segmented track | — |
| `--separator` | `rgba(42,43,42,.11)` | hairlines | — |
| `--edge` | `#8E9099` | 1 pt edge of inputs and text boxes (non-text 3 : 1) | **3.04** on sheet |
| `--badge-bg` / `--badge-fg` | `#2A2B2A` / `#FCFBF5` | count badges | 13.71 |
| `--destructive` | `#B3261E` | Xoá, errors only | 6.25 on sheet, 6.48 on cell |
| `--success` | `#3F6B4A` | "Đã lưu" | 5.89 on sheet |
| `--focus` | `0 0 0 3px rgba(77,81,98,.35)` | focus ring | — |

### 2.3 Dark tokens (the founder's daily mode: polish this first)

| Token | Value | Use | Contrast |
|---|---|---|---|
| `--bg` | `#1C1D1C` | header, `html`, `body` | — |
| `--bg-grouped` | `#1C1D1C` | screen ground | — |
| `--bg-cell` | `#2A2B2A` Jet | cards, rows | — |
| `--bg-sheet` | `#242524` | sheets | — |
| `--bg-paper` | `#333433` | text boxes | — |
| `--label` | `#FCFBF5` | text | 16.31 bg, 13.71 cell, 12.06 paper |
| `--label-2` | `#C4C4C0` | secondary | 9.67 bg, 8.13 cell, 8.79 sheet, 7.15 paper |
| `--label-3` | `#A2A29E` | tertiary | 5.55 cell, 6.01 sheet, 4.88 paper |
| `--label-4` | `#5F605E` | placeholder (decorative) | — |
| `--icon` | `#A2A29E` | nav icons | 5.55 on bar |
| `--primary` | `#F2E7AB` Vanilla | primary fill | 13.52 vs bg (shape) |
| `--primary-pressed` | `#E3D69A` | pressed | — |
| `--on-primary` | `#2A2B2A` | text on primary | **11.37** on Vanilla, **9.71** on pressed |
| `--accent-ui` | `#F2E7AB` | links, radio, check, focus, selected nav | 12.30 sheet, 11.37 cell, 10.00 paper |
| `--sel-fill` | `#46453C` (Vanilla 14 % on cell) | selected nav pill, selected row | Baby powder on it 9.31 |
| `--tonal` | `#3E3F3D` (Baby powder 12 % on sheet) | tonal buttons | Baby powder on it 10.21 |
| `--insert` | `#59584B` (Vanilla 20 % on paper) | arrival flash | Baby powder 6.93 |
| `--insert-rest` | `#403F38` (Vanilla 10 % on paper) | strip rest | Baby powder ≥ 9 |
| `--thumb` | `#5A5B5A` | segmented thumb | — |
| `--seg-track` | `rgba(252,251,245,.09)` | — | — |
| `--separator` | `rgba(252,251,245,.14)` | — | — |
| `--edge` | `#6E7076` | input and box edge | **3.11** on sheet |
| `--badge-bg` / `--badge-fg` | `#F2E7AB` / `#2A2B2A` | count badges | 11.37 |
| `--destructive` | `#FF8A80` | Xoá, errors | 6.74 sheet, 6.23 cell |
| `--success` | `#9CC2A0` | — | 7.79 sheet |
| `--material-bar` | `rgba(42,43,42,.86)` + blur 24 | floating capsule | — |

Dark-mode polish rules:
- No pure black and no pure white.
- Product photos get `filter:none` but a 0.5 pt `rgba(252,251,245,.18)` ring so dark garments don't disappear into Jet.
- The logo wordmark is `invert(1)` at 0.92 opacity (unchanged).
- `theme-color` meta for dark is `#1C1D1C`, the exact `--bg`.

### 2.4 Shape and avatar system (one radius scale)

| Element | Radius | Rule |
|---|---|---|
| **Product photos** | **50 % (circle), always** | Sizes: **32** (inline/picker chips), **44** (order lines, picker rows), **56** (product list, set list, sheet header), **72** (set sheet). The set sheet's rounded-square 96 pt photos are removed. Sets show **two overlapping circles** (overlap 14 at 56, 18 at 72; 2.5 pt ring in the surface colour). |
| Buttons (primary, tonal, text-with-fill) | **capsule** (height ÷ 2) | Capsule always means "tap to act". |
| Text boxes and inputs | 14 | "Content you can edit". |
| Cards (stage cards, bubble cards, tiles, dropdown rows, grouped lists) | 20 for cards and tiles, 14 for dropdown rows, 14 for grouped lists | — |
| Sheets | 24 top corners | — |
| Floating capsule | 30 (= height ÷ 2) | — |
| Badges | 10 (pill) | — |

### 2.5 Type (unchanged scale, 4 levels)

Titles use serif 28/34 (screen) and 22/28 (sheet). Body is 17/22, meta 15/20 and caption 13/18 (caps for section headers, tracking .04em). Buttons are 17/600 (primary) and 15/600 (tonal). Text boxes are 16/22, so iOS does not zoom. Nav labels are 11/13, 600.

### 2.6 Spacing

- 8 pt grid. Side gutter 16 at < 414 pt, 20 at ≥ 414 pt. Sheet inner padding is 20.
- Section gap 24; inside a section 12. Card padding 16; gap between cards 16.
- **No interactive element may touch another element's edge: minimum 8 pt, and 12 pt between a box and its button.**
- Every hit target is ≥ 44 × 44 pt.

### 2.7 Motion

- Sheets: unchanged (380 ms `--ease-sheet`).
- Segment thumb: 250 ms.
- Opening-line arrival: the strip expands 0 → auto in 220 ms ease-out, its background goes `--insert` → `--insert-rest` over 1200 ms linear, and the box scrolls to top.
- Badge bump: 300 ms, as now.
- Next-card focus: smooth scroll, 300 ms.
- Reduced motion: no expand, no flash (the strip shows at `--insert-rest`), no scale, instant scrolls, cross-fades of 150 ms only.

---

## 3. Affordance system (the control grammar)

The founder should know what a tap does from shape plus word alone. Each shape below has **one** meaning across the whole app.

| Shape | Looks like | Means | Label rule | Example |
|---|---|---|---|---|
| **Primary button** | Capsule, filled `--primary`, 52 pt, full width, in a sticky footer | "Do the main thing on this screen now" | Verb + object + language: icon ⧉ + "Chép thông tin · VI" | Chép thông tin · VI · Chép đơn · VI · Chép tin 2 · VI |
| **Tonal button** | Capsule, `--tonal` fill, `--label` text, 44 pt | A secondary action | Verb first, with a leading icon | ⧉ Chép tin 1 · ＋ S · 📋 Dán · ↺ Khôi phục |
| **Text button** | `--accent-ui` text, no fill, 44 pt target, leading icon | A small edit or navigation action | Verb, icon on the left | ✎ Sửa · ＋ Thêm câu mới · ✕ Bỏ câu |
| **Destructive text** | `--destructive` text | Removes something | "Xoá …" | Xoá món · Xoá set |
| **Dropdown row** | Row, 56 pt, `--bg-cell`, radius 14. Caption label on top, current value below, **"Đổi ⌄"** right | "Choose one from a list" (opens a picker sheet) | `<Label>` / `<value>` | Câu mở đầu / Không kèm  **Đổi ⌄** |
| **Navigation row** | Row with **›** | "Opens a page or sheet" | Noun | Lace Top · 380.000đ › |
| **Segmented control** | Track with a raised thumb, 44 pt (36 pt in the header) | "Which view or variant" (changes what you see, never acts) | Nouns | Thông tin · Bảng size · Cả hai |
| **Switch** | iOS switch, on = `--primary` | On/off add-on | Verb phrase | Kèm link bài viết |
| **Radio row** | 24 pt circle at the left (filled `--accent-ui` with ✓ when chosen), text wraps | Pick one in a picker | The full sentence, no ellipsis up to 3 lines | ◉ Soft gửi bạn thông tin mẫu ạ 🌷 |
| **Editable box** | Rounded box 14, 1 pt `--edge`, label **"TIN SẼ GỬI"** above, **"✎ Sửa"** text button top-right | "This exact text is what gets copied, and you may change it" | — | — |
| **Inserted-line strip** | Inside the top of the box: `--insert-rest` band, caption "Câu mở đầu", the sentence, **✕** at the right | "This sentence was added in front of your message" | — | — |
| **Count badge** | 20 pt pill, `--badge-bg`, number | "How many in the order" | Digits only | 3 |
| **Notice line** | ⓘ glyph (15) + 13 pt `--label-2` text + optional tonal button | Something to check, not an error | Sentence, plus the action as a verb | ⓘ Giá set lấy từ bài đăng — **Đã kiểm tra** |

Banned from v5:
- outline pills (`.chip.ghost`, `.lchip.add`, `.lchip`);
- rose anything;
- long-press as the only way to reach an action (the lead-in long-press menu is replaced by visible "Sửa" in the picker; long-press may remain as a duplicate);
- instruction sentences under boxes ("Chạm vào khung để sửa trực tiếp");
- icon-only buttons except ✕ (close), ⌕ in the search field, and the gear (with `aria-label`, unchanged per the founder's Round 4 request).

**Icon + text pairs (fixed vocabulary, never swapped):**

| Glyph | Word | Used for |
|---|---|---|
| ⧉ copy (two sheets) | Chép | every copy |
| ✓ check | Đã chép / chosen | copied seal, chosen radio |
| ✎ pencil | Sửa | edit a box, a line or a link |
| ＋ plus | Thêm | add a line, add to order (＋ S) |
| ⌄ chevron down | Đổi | open a chooser |
| › chevron right | (none) | open a page |
| clipboard-list | Đơn | order |
| ⓘ info circle | (notice) | check-me notices |
| ↺ arrow | Khôi phục | undo an edit |
| 📋 paste (clipboard) | Dán | paste receiver info |
| 🔗 link | Link bài viết | post link |
| ✕ | Bỏ / Đóng | remove a line, close a sheet |

**Teach by doing, no tutorial:**
1. The **first copy** toast carries a second line, "Mở Instagram và dán vào ô tin nhắn nhé.", for the first 3 copies only (`st.tips.copy < 3`).
2. The **first "＋ size"** bumps the order button. The toast says "Đã thêm Lace Top · M vào đơn" with a **"Xem đơn"** action.
3. **Before the first edit**, a box shows its "✎ Sửa" button. Tapping it focuses the textarea with the caret at the end; tapping the text itself also works. After an edit, the row under the box shows "● Đã sửa · ↺ Khôi phục · Lưu làm mẫu".
4. On **first open of the product sheet**, the opening-line row value reads "Không kèm — chạm Đổi để thêm câu chào". After the first selection it shows just the value.
5. **Empty states** contain the action: an empty order shows "Đơn còn trống" plus search and the newest products with "＋ S/M/L" right there, and an empty sets list shows the "Tạo set mới" row first.

---

## 4. Safe area and the floating bar

### 4.1 Diagnosis (from her 15 Pro Max screenshot)

- The app's painted area ends about **60 pt above the glass** (y = 1872 of 2000 in the preview, which is 128 px ÷ 2.147). Below it is a uniform band of a slightly different near-black: the host's or `html`'s background.
- The capsule's bottom edge is at about **31 pt above that band** (1805 → 1872). That is exactly the current CSS `bottom: max(34 − 12, 0) + 10 = 32`, so **the app still applied the 34 pt home-indicator inset even though its box no longer touches the home indicator**. The host had already padded or shortened the page by about 60 pt (34 inset plus host chrome or padding).
- Result: bar bottom at about 91 pt above the glass, against Apple's floating bars at about 21–25 pt. Hence "floats too high". At 393 pt the same code gives the same double count.
- Also wrong today: `env()` is read in seven places (`--safe-bottom` in `.shf`, `.shb.pad`, `#toast`, `--bar`, `#fbar`, the picker list and `.sheet` top), so a fix in one place does not fix the others.

### 4.2 Strategy (binding)

1. **One source per edge.** JS writes `--inset-t` and `--inset-b` on `:root`. **No CSS rule may reference `env(safe-area-inset-*)` except the probe.** `--safe-top` and `--safe-bottom` are deleted and replaced everywhere by `--inset-t` and `--inset-b`.
2. **Measure, don't assume.** `measureInsets()` runs at boot, on `resize`, on `orientationchange` and on `visualViewport.resize` when no text field is focused:
   ```js
   function measureInsets() {
     const probe = document.createElement('div');
     probe.style.cssText = 'position:fixed;left:0;top:0;width:0;visibility:hidden;' +
       'padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)';
     document.body.appendChild(probe);
     const cs = getComputedStyle(probe), sat = parseFloat(cs.paddingTop) || 0, sab = parseFloat(cs.paddingBottom) || 0;
     probe.remove();
     const q = new URLSearchParams(location.hash.slice(1));          // host override: #inset-b=0&inset-t=0
     const framed = window.self !== window.top;
     const app = document.getElementById('app').getBoundingClientRect();
     const shrunk = app.bottom < window.innerHeight - 1;             // a host shrank our box: it owns the edge
     let b = framed || shrunk ? 0 : sab, t = framed ? 0 : sat;
     if (q.has('inset-b')) b = Math.max(0, +q.get('inset-b') || 0);
     if (q.has('inset-t')) t = Math.max(0, +q.get('inset-t') || 0);
     const r = document.documentElement.style;
     r.setProperty('--inset-b', b + 'px'); r.setProperty('--inset-t', t + 'px');
     document.body.dataset.ctx = framed ? 'frame' : matchMedia('(display-mode: standalone)').matches || navigator.standalone ? 'pwa' : 'tab';
   }
   ```
3. **Never `100vh` / `100dvh`.** `.app` stays `position:fixed; inset:0 0 var(--kb,0) 0`. Sheet heights derive from `top: calc(var(--inset-t) + 10px)` and `bottom: var(--kb)`.
4. **No band can show.** `html`, `body` and `.app` all paint `var(--bg-grouped)`. The `theme-color` metas equal `--bg` (light `#FCFBF5`, dark `#1C1D1C`). `body` stays fixed, so Safari keeps its toolbar expanded and stable.
5. **Bar position (one formula):**
   ```css
   --bar-h: 60px;
   --bar-y: max(calc(var(--inset-b) - 10px), 12px);   /* gap from the app's bottom edge to the bar's bottom edge */
   --bar-top: calc(var(--bar-y) + var(--bar-h));      /* everything that must clear the bar uses this */
   #fbar { bottom: var(--bar-y); }
   .tab { padding-bottom: calc(var(--bar-top) + 16px); }
   #toast { bottom: calc(var(--bar-top) + 12px); }
   .ofoot { bottom: calc(var(--bar-top) + 8px); }
   .shf { padding-bottom: calc(max(var(--inset-b), 12px) + 8px); }
   ```
   Why `inset − 10`: the home indicator occupies roughly the bottom 13 pt. With a 34 pt inset the bar's bottom lands at 24 pt, about 11 pt above the indicator. That is clear of the system swipe zone and as low as Apple's own floating bars. Where nothing is below (SE, Safari's toolbar, a host frame), 12 pt keeps the shadow visible.
6. **Host contract** (for whoever builds the wrapper page). Render the app **full-bleed** (no `:root` padding, iframe `position:fixed; inset:0`) and let the app handle insets. If the host *must* reserve the edges, it either shrinks the frame (the app detects `framed` → 0) or appends `#inset-b=0&inset-t=0`. The wrapper's own background must be `#1C1D1C` (dark) / `#F6F4EE` (light).
7. **Debug overlay**: `#debug=insets` shows a small card at top-left with `sat`, `sab`, `framed`, `shrunk`, `innerHeight`, `screen.height`, `visualViewport.height`, `--inset-b` and `--bar-y`. One screenshot from her phone settles any doubt. It is not shipped visibly; it is inert without the hash.

### 4.3 Geometry results (must match ± 1 pt)

| Device / context | `--inset-t` | `--inset-b` | `--bar-y` | Bar spans (pt from app bottom) | Sheet top |
|---|---|---|---|---|---|
| iPhone 15 Pro Max 430 × 932, PWA | 59 | 34 | **24** | 24 → 84 | 69 |
| iPhone 14 Pro 393 × 852, PWA | 59 | 34 | **24** | 24 → 84 | 69 |
| iPhone SE 375 × 667, PWA (no home indicator) | 20 | 0 | **12** | 12 → 72 | 30 |
| Any, Safari tab (toolbar below) | env top (usually 0–59) | 0 if Safari reports 0; if Safari reports 34 with content under a floating toolbar, 34 | 12 or 24 | — | — |
| Any, inside a host frame or shrunk box | 0 | 0 | **12** | 12 → 72 | 10 |
| Any, `#inset-b=0` | — | 0 | 12 | — | — |
| Keyboard open | — | — | bar hidden (`body.kb`) | — | unchanged |

---

## 5. App icon

- `tools/make_icons.py`: `PICK = "B"` (Vanilla `#F2E7AB` background, Jet logomark). Keep the thin-line thickening at small sizes.
- `build.py` manifest: `"background_color": "#F2E7AB"`, `"theme_color": "#FCFBF5"`. The splashes are regenerated (Vanilla ground, Jet mark at 40 %).
- Jet on Vanilla is 11.37 : 1 (A was about 5 : 1), so the double ring stays crisp at 29 pt. Vanilla is bright but not white, so it separates from Apple's white icons. To counter "washed out on white wallpaper", the 180 px icon gets an inner 1 px `rgba(42,43,42,.08)` edge baked in.
- Update `shots/icon-preview.png` with the "picked" label on B.
- The unit test `manifest brightness` still passes (Vanilla luminance 0.79 > 0.35).

---

## 6. Information architecture and navigation

### 6.1 IA (unchanged structure, sharper labels)

```
Trang chủ (always opens here)
├─ Trả lời khách: 5 stage tiles ──────► Trả lời nhanh · Bước n
├─ Thông tin sản phẩm: Theo mẫu / Theo set ─► Sản phẩm
Floating capsule: Trang chủ · Trả lời nhanh · Sản phẩm   +   round button "Đơn" (→ Trả lời nhanh · Bước 4 Tạo đơn)
Sheets: Product sheet · Set sheet · Message sheet · Câu mở đầu picker · Product picker · Tuỳ chỉnh
```

### 6.2 Floating bar geometry

```
430 pt wide (margin 20)                                   393 pt wide (margin 16)
|20|──────────── capsule 320 ────────────|10|─ 60 ─|20|      |16|────────── capsule 291 ──────────|10|─ 60 ─|16|
   ╭─────────────────────────────────────╮   ╭────╮            ╭──────────────────────────────────╮  ╭────╮
   │ ⌂        ▢ chat        hanger       │   │ ▤ ③│            │  ⌂       ▢          hanger       │  │ ▤ ③│
   │Trang chủ Trả lời nhanh  Sản phẩm    │   │ Đơn│            │Trang chủ Trả lời nhanh Sản phẩm  │  │ Đơn│
   ╰─────────────────────────────────────╯   ╰────╯            ╰──────────────────────────────────╯  ╰────╯
   ↑ bottom at --bar-y (24 on Face ID PWA, 12 elsewhere)
```

- **Capsule**: height 60, radius 30, padding 4, 3 equal items (430: 104 pt each; 393: 94.3 pt each). `--material-bar` plus 24 pt blur, `--shadow-float`, 0.5 pt glass edge.
- **Item**: icon 22 at the top, label 11/13 at 600, 3 pt gap. Unselected: `--icon`. Selected: a pill 52 tall with `--sel-fill`, icon and label in `--accent-ui`. No rose.
- **Order button "Đơn"**: a 60 × 60 circle with the same material. It contains the **clipboard-list glyph** (22 pt) and the label **"Đơn"** (11/13, 600) under it, mirroring capsule items so it reads as a sibling.
  - Badge: min 20 × 20, radius 10, `--badge-bg` / `--badge-fg`, 12/20 bold, at top 2, right 2. It is hidden at 0.
  - Selected (Tạo đơn open): `--sel-fill` disc with the glyph and label in `--accent-ui`.
  - `aria-label`: "Đơn hàng, 3 món, 1.240.000đ".
- **Glyph `i-order`** (24 grid, stroke 1.6, round):
  ```svg
  <symbol id="i-order" viewBox="0 0 24 24">
    <rect x="5" y="4.5" width="14" height="17" rx="2.5"/>
    <path d="M9 4.5V3.8c0-.7.5-1.3 1.2-1.3h3.6c.7 0 1.2.6 1.2 1.3v.7"/>
    <path d="M8.5 10h.01M11 10h4.5M8.5 13.5h.01M11 13.5h4.5M8.5 17h.01M11 17h3"/>
  </symbol>
  ```
  Why: a clipboard with a bulleted list is an order or receipt in every Vietnamese seller's mental model (phiếu đơn), and it cannot be mistaken for a bin (no taper, no lid) or a bag. The word "Đơn" removes the rest of the doubt. `i-bag` is deleted.
- Keyboard open: the bar is hidden (unchanged).

---

## 7. Screens

All wireframes show **dark mode at 430 pt** (her phone), then the 393 differences. Light is the same geometry with the light tokens.

### 7.1 App header (all top-level screens)

```
430 ─────────────────────────────────────────────────────────── (inset-t 59)
|20| Soft Embrace (logo 28h)            [ VI | EN ] |8| (⚙) |10|
       height 44                         seg 88×32      44×44
```
- VI/EN is a **segmented control** (track `--seg-track`, raised `--thumb`, selected text `--label` at 600, unselected `--label-2`). The rose ring is removed.
- 0.5 pt separator under the header.

### 7.2 Home (Trang chủ)

```
┌ 430 ───────────────────────────────────────────┐
│ header                                         │
│ Chào buổi tối                     serif 28/34  │
│ Khách đang ở bước nào? Chạm để mở câu trả lời. │ 15 label-2
│                                                │ 24
│ TRẢ LỜI KHÁCH                                  │ 13 caps
│ ╭───────────────────╮ 12 ╭───────────────────╮ │ tiles 189×104 (430) / 174.5×104 (393)
│ │ ① Bước 1        › │    │ ② Bước 2        › │ │ step disc 24: --tonal bg, --label-2 text
│ │ Chào hỏi          │    │ Tư vấn size       │ │ 17/600
│ │ Khách mới hoặc cũ │    │ Số đo, bảng size  │ │ 13 label-2
│ ╰───────────────────╯    ╰───────────────────╯ │
│ ╭ ③ Xin thông tin › ╮    ╭ ④ Tạo đơn       › ╮ │
│ ╰───────────────────╯    ╰───────────────────╯ │
│ ╭ ⑤ Check out · Cảm ơn, mã vận đơn         › ╮ │ wide 84
│ ╰────────────────────────────────────────────╯ │
│ THÔNG TIN SẢN PHẨM                             │
│ ╭ (●●●) Theo mẫu  › ╮    ╭ (●●) Theo set   › ╮ │ circles 40, overlap 14
│ ╰───────────────────╯    ╰───────────────────╯ │
│                                                │
│      [ floating bar at --bar-y ]               │
└────────────────────────────────────────────────┘
```
- Tile: radius 20, `--bg-cell`, 0.5 pt separator inset. › in `--label-3` at the top-right; the step disc moves to the top-left with "Bước n" caption beside it.
- Pressed: scale .97 with `--tonal` background.
- The Tạo đơn tile shows the live count when the order is not empty: "Món, ship, chốt đơn · **2 món**".

### 7.3 Trả lời nhanh (stages)

```
┌ 430 ───────────────────────────────────────────┐
│ header                                         │
│ TRẢ LỜI NHANH · BƯỚC 2/5          13 caps l-2  │ ← you are here (eyebrow)
│ Tư vấn size                       serif 28/34  │ ← the stage name is the title
│ Khách hỏi về size, form dáng, số đo.  15 l-2   │
│ ┌────────────────────────────────────────────┐ │ sticky segmented, 52 tall, 5 columns
│ │ 1      │▐2 ███▌│ 3      │ 4  ③  │ 5        │ │ number 11 l-3 over label 12/14 600
│ │Chào hỏi│Tư vấn │Xin     │Tạo đơn│Check out │ │ selected: raised thumb + bold, NO outline
│ │        │size   │th.tin  │       │          │ │ badge on 4 = --badge colours
│ └────────────────────────────────────────────┘ │
│ ╭────────────────────────────────────────────╮ │ message card, radius 20, padding 16
│ │ Xin số đo                                › │ │ 17/600
│ │ "Bạn cho Soft xin số đo ngực, eo, chiều…"  │ │ 13 l-2, 2 lines, in quotes = it's a message
│ │ ⧉ Mở để xem và chép                        │ │ 13/600 --accent-ui (label, not a 2nd target)
│ ╰────────────────────────────────────────────╯ │ 12 gap
│ ╭ GỬI BẢNG SIZE ─────────────────────────────╮ │ product card
│ │ Chọn mẫu khách hỏi                         │ │ 13 l-2
│ │ (●) Butter Top · 390.000đ                › │ │ rows 56, avatar 32 circle
│ │ (●) Fleur Slip Dress · Xanh              › │ │
│ │ (●) Fleur Slip Dress · Vàng              › │ │
│ │ ⌕  Tìm mẫu khác…                         › │ │ opens picker
│ ╰────────────────────────────────────────────╯ │
│ ⌄ Câu khác (4)                                 │ text button, expands in place
└────────────────────────────────────────────────┘
```
- 393: the segmented labels wrap the same way (columns 72 pt).
- The product rows open the product sheet with the segment preset (Chào hỏi → Thông tin, Tư vấn size → Bảng size).
- "Thêm" is renamed **"Câu khác (n)"** with ⌄/⌃ and `aria-expanded`.

### 7.4 Message sheet (a quick reply)

```
┌ sheet (top = inset-t + 10) ────────────────────┐
│            ───                                 │
│ Xin số đo                        [VI|EN] (✕)   │ serif 22 · seg 76×32 · close 44
│ Bước 2 · Tư vấn size                           │ 15 l-2  ← you are here
│                                                │
│ TIN SẼ GỬI                           ✎ Sửa     │ caps 13 · text button 44
│ ╭────────────────────────────────────────────╮ │ editable box (§8.4)
│ │ Bạn cho Soft xin số đo ngực, eo, chiều cao │ │
│ │ và cân nặng để Soft tư vấn size chuẩn nha… │ │
│ ╰────────────────────────────────────────────╯ │
│ (edited only) ● Đã sửa   ↺ Khôi phục   Lưu làm mẫu │
│                                                │ 24
│ ĐIỀN VÀO TIN                                   │ only if the template has blanks
│ ╭ Mẫu            Lace Top            Đổi ⌄ ╮   │ dropdown row → product picker
│ Size   [  S  |▐ M ▌|  L  |  XL ]               │ segmented 44
├────────────────────────────────────────────────┤
│ [ ⧉  Chép · VI ]                 primary 52    │ "Điền 1 chỗ nữa" disabled when a blank is open
└────────────────────────────────────────────────┘
```
- The greeting variant's optional product uses a dropdown row: **"Kèm thông tin mẫu: Không kèm  Đổi ⌄"**.
- Variants (Có sẵn / May đo) use a segmented control.

### 7.5 Tạo đơn (order composer, stage 4)

```
│ TRẢ LỜI NHANH · BƯỚC 4/5                       │
│ Tạo đơn                                        │
│ Chọn món, phí ship, rồi chép tin chốt đơn.     │
│ [segmented stages]                             │
│ 1 · MÓN TRONG ĐƠN                ↺ Đơn mới     │ text button (confirm)
│ ╭────────────────────────────────────────────╮ │
│ │ (●44) Butter Top          390.000đ       › │ │ row opens line editor (sheet, §8.9)
│ │       Size S · SL 1                        │ │
│ ╰────────────────────────────────────────────╯ │
│ ╭ ⌕  Tìm mẫu để thêm…                      ╮ │
│ MẪU MỚI NHẤT                                   │
│ ╭────────────────────────────────────────────╮ │
│ │ (●44) Butter Top · 390.000đ                │ │
│ │  [＋ S]  [＋ M]  [＋ L]   Trong đơn: S × 1  │ │ tonal capsules 44, min 64 wide, gap 8
│ ╰────────────────────────────────────────────╯ │
│ 2 · PHÍ SHIP   [ 24.000đ | Miễn phí | Khác ]   │ segmented
│ 3 · THÔNG TIN NHẬN (tuỳ chọn)        📋 Dán    │ tonal 44
│ ╭ textarea ────────────────────────────────╮   │
│ Kèm thông tin chuyển khoản            (●══)    │ switch
│ 4 · TIN CHỐT ĐƠN                     ✎ Sửa     │
│ ╭ Câu mở đầu      Không kèm          Đổi ⌄ ╮   │ dropdown row
│ ╭ box (strip + text) ──────────────────────╮   │
│ ╭──────────────────────────────────────────╮   │ floating footer card, bottom = --bar-top + 8
│ │ Tổng · 1 món              [⧉ Chép đơn · VI]│ │ primary 48
│ │ 414.000đ                                   │ │
│ ╰──────────────────────────────────────────╯   │
```
- The inline expanding line (`.lexp`) is replaced by a **line editor sheet** (medium detent) with "Size" segmented, a stepper "Số lượng − 1 +", and "Xoá món" (destructive). One tap on a row opens one obvious place, so there is no collapse/expand.

### 7.6 Sản phẩm (list, filters, sets list)

```
│ SẢN PHẨM                                        │ eyebrow
│ Theo mẫu                          serif 28      │ title = current view
│ Chọn mẫu khách hỏi để chép thông tin hoặc size. │
│ [▐ Theo mẫu ▌|  Theo set  ]       segmented 44  │
│ ╭ ⌕  Tìm mẫu…                              ╮   │
│ [▐Tất cả 20▌| Áo 11 | Váy 6 | Đầm 2 | Quần 1]   │ ONE segmented control, 44, counts in l-3
│ SUMMER 26 · 10                                  │
│ ╭───────────────────────────────────────────╮  │
│ │ (●56) Butter Top                       ›  │  │ 72 rows, hairline inset 84
│ │       390.000đ · Vàng bơ · Áo             │  │ category merged into the grey line
│ ╰───────────────────────────────────────────╯  │
```
- At 393 the filter segment labels are "Tất cả · Áo · Váy · Đầm · Quần" at 13 pt and the counts drop below 393 pt (counts shown only at ≥ 414 pt).
- **Theo set**: rows of 84 with two overlapping 56 circles, two name lines and "850.000đ" (or "Gợi ý · 850.000đ · chưa kiểm giá" in `--label-2`). The first row is **"＋ Tạo set mới — chọn 2 mẫu"**.

### 7.7 Product sheet (the main fix)

```
┌ 430 · sheet top 69 ────────────────────────────────┐
│               ───                                  │ grabber
│ (●56) Butter Top                    [VI|EN]  (✕)  │ serif 22 / meta 15 l-2
│       390.000đ · Vàng bơ · S M L                   │
│                                                    │ 8
│ BẠN MUỐN GỬI                                       │ 13 caps l-2
│ [▐ Thông tin ▌|  Bảng size  |  Cả hai  ]           │ segmented 44, full width 390
│                                                    │ 16
│ ╭──────────────────────────────────────────────╮   │ dropdown row 56, radius 14
│ │ Câu mở đầu                                   │   │ 13 l-2
│ │ Soft gửi bạn thông tin mẫu ạ 🌷        Đổi ⌄ │   │ 16 label (1 line, ellipsis) · 15/600 accent-ui
│ ╰──────────────────────────────────────────────╯   │
│                                                    │ 16
│ TIN SẼ GỬI · THÔNG TIN                  ✎ Sửa      │ caps + text button (44 target)
│ ╭──────────────────────────────────────────────╮   │ editable box, max-h min(34vh,280)
│ │┌────────────────────────────────────────────┐│   │ inserted-line strip (§8.5)
│ ││ Câu mở đầu                              ✕  ││   │ 12 l-2 · ✕ = "Bỏ câu mở đầu"
│ ││ Soft gửi bạn thông tin mẫu ạ 🌷            ││   │ 16 label, Vanilla tint
│ │└────────────────────────────────────────────┘│   │
│ │ Butter Top 🧈                                │   │ textarea (body)
│ │ • Áo lệch vai, xếp ly ở vai và thân áo tạo…  │   │ scrolls inside
│ │ • Chất liệu: Tơ cotton                       │   │
│ ╰──────────────────────────────────────────────╯   │
│ (edited) ● Đã sửa    ↺ Khôi phục    Lưu làm mẫu    │ 44 row, only when edited
│                                                    │ 24
│ GỬI KÈM                                            │
│ ╭ 🔗 Kèm link bài viết                    (○══) ╮  │ switch row 56; sub: instagram.com/p/…
│ ╰ (no link: "＋ Thêm link bài viết" text row) ╯  │
│                                                    │ 24
│ THÊM VÀO ĐƠN                                       │
│ [＋ S]  [＋ M]  [＋ L]        Trong đơn: M × 1      │ tonal 44 × 64, gap 8 · 13 l-2
│                                                    │ 24
│ SET CÓ MẪU NÀY                                     │
│ ╭ (●●) Set với Flowy Skirt · 800.000đ        › ╮  │ opens Set sheet
│ ╰ ＋ Ghép set với mẫu khác                   › ╯  │
│                                                    │
│ ⓘ Ghi chú nội bộ: …                                │ 13 l-2, never copied
├────────────────────────────────────────────────────┤ sticky footer, top hairline
│ [ ⧉  Chép thông tin · VI ]                         │ primary 52, full width
│                                    (inset-b 34)    │
└────────────────────────────────────────────────────┘
```

**Vertical budget (must hold, light and dark):**

| | 430 × 932 PWA | 393 × 852 PWA | 375 × 667 SE |
|---|---|---|---|
| Sheet top | 69 | 69 | 30 |
| Segmented control | 163–207 | 163–207 | 124–168 |
| Dropdown row | 223–279 | 223–279 | 184–240 |
| Box top → max bottom | 311 → 591 | 311 → 591 (280 cap) | 272 → 499 (34vh = 227) |
| Footer top (52 btn + 8 + 12 + inset) | 826 | 746 | 595 |

So with the full 280 pt box, the "Gửi kèm" header is visible above the footer at 430 and 393. The primary is always on screen (sticky).

**Behaviour:**
- **Segment = what is sent.** "Thông tin" shows the info box; "Bảng size" shows the size box (its dropdown reads "Câu trước bảng size"); "Cả hai" shows both parts stacked **inside one outer box** with a centred caption "— cùng một tin —" between them, and **two** dropdown rows ("Câu trước thông tin", "Câu trước bảng size").
- **Edits live per part** (`ed.info`, `ed.size`) and survive segment switches. "Cả hai" uses the same two parts, so typing in Thông tin is still there in Cả hai. The `both` edit key is retired. "Lưu làm mẫu" is therefore always possible (per part).
- **The footer label follows the segment**: "Chép thông tin · VI" / "Chép bảng size · VI" / "Chép cả hai · VI". This is the **only** copy button on the sheet. Tap count stays at 2 from a product row: row → primary. Size chart is 3 from the list (row → "Bảng size" → primary) **or 2 from Trả lời nhanh → Tư vấn size** (the sheet opens preset to Bảng size). The product sheet also opens on the segment the user last copied from in this session, so repeated size answers are 2 taps.
- **"You are here"**: the segmented thumb, the box caption "TIN SẼ GỬI · BẢNG SIZE" and the footer verb all say the same thing. Switching segments cross-fades the box (150 ms) and never moves the footer.
- Missing language: the box is replaced by a notice ("ⓘ Chưa có bản EN của Bảng size") with tonal buttons **[⧉ Chép bản VI]** and **[✎ Thêm bản EN]**, and the footer is disabled with the label "Chưa có bản EN".
- Truncation guard: unchanged (two taps, 400 ms to 3 s). The guarded label is "Chạm lại để chép" on `--tonal`, **not** red.
- The lead-in long-press is removed from this sheet (editing moves into the picker).

### 7.8 Opening-line picker ("Câu mở đầu")

```
┌ sheet, medium detent (60% of height) ──────────┐
│             ───                                │
│ Câu mở đầu                               (✕)   │ serif 22
│ Đứng đầu tin Thông tin · VI                    │ 15 l-2
│ ╭────────────────────────────────────────────╮ │ grouped list, radius 14
│ │ ◉ Không kèm câu                            │ │ 24 radio · 17 text · rows ≥ 52
│ │────────────────────────────────────────────│ │
│ │ ○ Soft Embrace chào bạn, cảm ơn bạn đã     │ │ wraps up to 3 lines (no ellipsis below that)
│ │   quan tâm đến sản phẩm của chúng mình…    │ │
│ │                                   ✎ Sửa    │ │ text button, bottom-right of the row
│ │────────────────────────────────────────────│ │
│ │ ○ Soft gửi bạn thông tin mẫu ạ 🌷  ✎ Sửa   │ │
│ │   Câu của bạn                              │ │ 12 l-3 tag for custom lines
│ ╰────────────────────────────────────────────╯ │
│ ＋ Thêm câu mới                                │ text button row 52, accent-ui
└────────────────────────────────────────────────┘
```
- **Tap a row**: the radio fills, then the sheet closes after 200 ms. In the product sheet the strip expands at the top of the box with the Vanilla arrival flash, and the dropdown value updates. Selection memory is unchanged (it commits only on a successful copy).
- **"✎ Sửa"** turns that row into an inline editor in the picker: VI textarea, "Bản tiếng Anh (tuỳ chọn)" textarea, and the buttons **[Lưu]** (tonal) **Huỷ** · **Ẩn câu này** / **Xoá câu này** (destructive text).
- **"＋ Thêm câu mới"** opens an inline textarea with placeholder "Câu bạn hay nói trước khi gửi…" and **[Lưu và dùng]** (tonal). Saving selects the line and closes the picker.
- Picker variants: "Câu trước bảng size", "Câu mở đầu tin chốt đơn" (order). The set sheet reuses the info and size lists.

### 7.9 Set sheet

```
┌ 430 · sheet top 69 ────────────────────────────────┐
│               ───                                  │
│ Lace Top + Lace Skirt              [VI|EN]  (✕)   │ serif 22
│ Set · 850.000đ                                     │ 15 l-2
│                                                    │ 12
│        (●72 Lace Top)   ＋   (●72 Lace Skirt)      │ circles, 24 gap, "+" 20 l-3
│        Lace Top            Lace Skirt · Kem        │ 13/600, centred, max 140
│        380.000đ            470.000đ                │ 13 l-2
│                                                    │ 16
│ ⓘ Giá set lấy từ bài đăng, chưa kiểm tra. [Đã kiểm tra] │ notice + tonal 44 (only when unchecked)
│                                                    │ 24
│ GIÁ SET                                            │
│ ╭ 850.000                                   đ  ╮   │ input 52, numeric, --edge
│ Để trống = 850.000đ (tổng giá lẻ)                  │ 13 l-2 helper under the field
│ LINK BÀI VIẾT (tuỳ chọn)                           │
│ ╭ Để trống = link bài của mẫu                  ╮   │ input 52
│                                                    │ 24
│ GỬI LẦN LƯỢT 4 TIN            Đã chép 1/4          │ caps · 13 l-2
│ ╭──────────────────────────────────────────────╮   │ bubble card: --bg-cell, r20, pad 16
│ │ (✓) Tin 1 · Thông tin + giá set    Đã chép   │   │ disc 28: ✓ on --tonal
│ │ 12                                           │   │
│ │ ╭ Câu mở đầu   Không kèm          Đổi ⌄ ╮    │   │ dropdown row (bubbles 1 and 2 only)
│ │ ╭ box (strip + text), max-h min(28vh,220) ╮  │   │
│ │ 12                                           │   │
│ │                          [ ⧉ Chép lại tin 1 ]│   │ tonal 44, right-aligned, min-w 140
│ ╰──────────────────────────────────────────────╯   │ 16 gap
│ ╭──────────────────────────────────────────────╮   │ NEXT card: 1.5 pt --accent-ui ring
│ │ (2) Tin 2 · Bảng size từng món  [Tiếp theo]  │   │ disc 28 filled --primary · tag pill --sel-fill 13/600
│ │ ╭ Câu trước bảng size  Không kèm   Đổi ⌄ ╮   │   │
│ │ ╭ box ─────────────────────────────────╮     │   │
│ │                             [ ⧉ Chép tin 2 ] │   │ tonal
│ ╰──────────────────────────────────────────────╯   │
│ ╭ (3) Tin 3 · Xin số đo …  [ ⧉ Chép tin 3 ] ╮      │ later card: disc outline 1.5 --edge
│ ╭ (4) Tin 4 · Link bài viết … ╮                    │
│                                                    │
│ ＋ Thêm mẫu vào set          Xoá set               │ text buttons, 44, 24 apart
├────────────────────────────────────────────────────┤
│ [ ⧉  Chép tin 2/4 · VI ]                           │ the ONLY primary; follows "Tiếp theo"
└────────────────────────────────────────────────────┘
```
- Spacing rules (fix for "buttons stick to the boxes"): card padding 16; header row 44; 12 between header and dropdown, dropdown and box, and box and button; **the button is a separate row inside the card, never on the header line**; 16 between cards.
- After a copy: that card's disc becomes ✓, "Đã chép" shows, its button becomes "Chép lại tin n", the next card gets the ring and tag, the footer updates, and the sheet scrolls the next card so its top sits 16 pt below the sheet header (instant under reduced motion). The toast reads "Đã chép tin 1 · Tiếp theo: tin 2".
- When all are copied: the footer becomes tonal "✓ Đã chép đủ 4 tin" (disabled), and each card keeps "Chép lại".
- `.setpic .av{border-radius:18px}` is deleted.

### 7.10 Pickers, settings, toasts, dialogs

- **Product picker**: title, sub, search field 44, **segmented category filter**, rows with a 44 circle. The row picked as "first" shows a ✓ at the right instead of a rose background. For set pairing the hint tag "Hay ghép" is a 12/600 `--label-2` text tag (no colour).
- **Tuỳ chỉnh**: unchanged structure.
  - "Xong" → `--accent-ui` 17/600.
  - Switches on → `--primary`.
  - "Câu đệm" page renamed **"Câu mở đầu"**, with rows that show the full text (2 lines) and the tags "Câu của bạn" / "Câu gợi ý" / "Đã ẩn".
  - "Khôi phục nội dung gốc" stays destructive.
- **Toast**: light card / dark `#3E3F3E`. Its icon uses `--accent-ui` (check), and errors use `--destructive`.
- **Dialogs**: the default button uses `--accent-ui`; destructive uses `--destructive`.

---

## 8. Component specs (with states)

| # | Component | Size | Default | Pressed | Selected / on | Disabled | Focus | Other |
|---|---|---|---|---|---|---|---|---|
| 8.1 | **Primary button** `.btn` | h 52, capsule, full width in footer; 17/600; icon 20 + 8 gap | `--primary` / `--on-primary` | `--primary-pressed`, scale .97 | Copied: label cross-fades to "✓ Đã chép" for 1.2 s (no colour change) | `--tonal` bg, `--label-3` text, `aria-disabled` | `--focus` ring | Guard: `--tonal` + "Chạm lại để chép" |
| 8.2 | **Tonal button** `.btn.tonal` | h 44, capsule, padding 0 16, min-w 64; 15/600 | `--tonal` / `--label` | `--tonal-pressed` | Copied: "✓ Đã chép" 1.2 s | opacity .45 | ring | — |
| 8.3 | **Text button** `.txtbtn` | min 44 × 44, 15/600, icon 15 | `--accent-ui` | opacity .6 | — | `--label-4` | ring | Destructive variant `--destructive` |
| 8.4 | **Editable box** `.ebox` | radius 14, 1 pt `--edge`, `--bg-paper`, padding 14/16, text 16/22, min-h 92, max-h `min(34vh,280px)` (bubble cards `min(28vh,220px)`), scrolls inside | caption "TIN SẼ GỬI" + "✎ Sửa" above | — | Focused: 2 pt `--accent-ui` border (no glow) | — | — | Edited row: "● Đã sửa" (dot `--accent-ui`) · "↺ Khôi phục" · "Lưu làm mẫu" (600) |
| 8.5 | **Inserted-line strip** `.lstrip` (inside 8.4, above the textarea) | radius 10, margin 8 8 0, padding 8 12 10, caption 12/16 l-2 "Câu mở đầu", text 16/22, ✕ 44 target at right | `--insert-rest` | — | Arrival: `--insert` → `--insert-rest` 1.2 s; expand 220 ms | — | ✕ ring | ✕ sets the selection to none (same as "Không kèm") and collapses the strip |
| 8.6 | **Dropdown row** `.ddrow` | h 56, radius 14, `--bg-cell`, padding 0 8 0 16; caption 13 l-2 above value 16 label; trailing "Đổi" 15/600 `--accent-ui` + ⌄ 13 | — | `--fill-pressed` overlay | — | — | ring | `aria-haspopup="dialog"`, label "Câu mở đầu: Không kèm. Đổi" |
| 8.7 | **Segmented** `.seg` | h 44 (sheet/body), 36 (header); track radius 12, thumb radius 10, inset 2 | `--seg-track`, text `--label-2` 15/500 | — | thumb `--thumb` + shadow, text `--label` 600 | — | ring per segment | `role="tablist"` when it switches views; `aria-selected` |
| 8.8 | **Stage segmented** | h 52, 5 cols, number 11 l-3 over label 12/14 600 | as 8.7 | — | thumb | — | — | badge on 4 |
| 8.9 | **Radio row** `.rrow` | min-h 52, padding 12 16, radio 24 (1.5 pt `--edge` ring) | — | `--fill-pressed` | filled `--accent-ui` disc with ✓ in `--bg-cell` | — | ring | Text wraps ≤ 3 lines; `role="radio"` within `role="radiogroup"` |
| 8.10 | **Switch** | 51 × 31 | off `--fill-1` | — | on `--primary` (dark: Vanilla, knob Jet `#2A2B2A`) | .45 | ring | — |
| 8.11 | **Size add button** | tonal 44 × 64, label "＋ M" | — | — | after add, the right-hand line updates "Trong đơn: M × 2" (no state on the button) | — | — | `aria-label="Thêm Butter Top size M vào đơn"` |
| 8.12 | **Bubble card** `.bcard` | `--bg-cell`, r 20, pad 16, gap 16 | disc 28 outline | — | next: 1.5 pt `--accent-ui` ring + filled disc + "Tiếp theo" tag | — | — | done: ✓ disc + "Đã chép" 13 l-2 |
| 8.13 | **Avatar** `.av` | 32/44/56/72, circle, `--fill-3` + product tint behind, 0.5 pt ring | — | — | — | — | — | Pair overlap 14 (≤ 56) / 18 (72), ring 2.5 pt in surface colour |
| 8.14 | **Nav item** `.fb` | ⅓ capsule, icon 22, label 11 | `--icon` | `--fill-4` | pill `--sel-fill`, `--accent-ui` | — | ring | `aria-current="page"` |
| 8.15 | **Order button** `.rbtn` | 60 circle, glyph 22 + "Đơn" 11/600 | `--icon` | scale .94 | `--sel-fill`, `--accent-ui` | — | ring | Badge 20 `--badge-*`; bump on add |
| 8.16 | **Notice** `.notice` | ⓘ 15 + 13/18 l-2 text; optional tonal 44 | — | — | — | — | — | Never red |
| 8.17 | **Card (stage)** `.qc` | r 20, pad 16, gap 12 | — | scale .98 + `--tonal` | — | — | ring | Footer label "⧉ Mở để xem và chép" 13/600 `--accent-ui` |

---

## 9. Microcopy (Vietnamese, Romantic Calm)

| Key | Text |
|---|---|
| home.sub | Khách đang ở bước nào? Chạm để mở câu trả lời. |
| home.cap1 / cap2 | Trả lời khách · Thông tin sản phẩm |
| tile.step | Bước {n} |
| qr.eyebrow | Trả lời nhanh · Bước {n}/5 |
| card.open | Mở để xem và chép |
| card.pickProduct | Chọn mẫu khách hỏi |
| card.findMore | Tìm mẫu khác… |
| qr.moreToggle | Câu khác ({n}) |
| sheet.box | Tin sẽ gửi |
| sheet.box.part | Tin sẽ gửi · {Thông tin / Bảng size / Cả hai} |
| sheet.edit | Sửa |
| sheet.edited | Đã sửa |
| sheet.restore | Khôi phục |
| sheet.saveTpl | Lưu làm mẫu |
| p.seg.cap | Bạn muốn gửi |
| p.seg | Thông tin · Bảng size · Cả hai |
| p.lead.label | Câu mở đầu |
| p.lead.labelSize | Câu trước bảng size |
| p.lead.labelInfo | Câu trước thông tin |
| p.lead.none | Không kèm |
| p.lead.noneFirst | Không kèm — chạm Đổi để thêm câu chào |
| p.lead.change | Đổi |
| p.lead.remove (aria) | Bỏ câu mở đầu |
| p.both.join | — cùng một tin — |
| p.cta | Chép thông tin · {VI} / Chép bảng size · {VI} / Chép cả hai · {VI} |
| p.sec.attach | Gửi kèm |
| p.link.on | Kèm link bài viết |
| p.link.add | Thêm link bài viết |
| p.link.edit | Sửa link |
| p.sec.order | Thêm vào đơn |
| p.inOrder | Trong đơn: {M × 1, L × 2} |
| p.sec.set | Set có mẫu này |
| p.set.row | Set với {Flowy Skirt} · {800.000đ} |
| p.set.pair | Ghép set với mẫu khác |
| p.note | Ghi chú nội bộ (không gửi cho khách) |
| missing | Chưa có bản {EN} của {Bảng size} · [Chép bản VI] · [Thêm bản EN] |
| guard | Chạm lại để chép |
| picker.lead.title / sub | Câu mở đầu · Đứng đầu tin {Thông tin} · {VI} |
| picker.lead.none | Không kèm câu |
| picker.lead.add | Thêm câu mới |
| picker.lead.ph | Câu bạn hay nói trước khi gửi… |
| picker.lead.save | Lưu và dùng |
| picker.lead.en | Bản tiếng Anh (tuỳ chọn) |
| picker.lead.tag | Câu của bạn · Câu gợi ý |
| picker.lead.hide / del | Ẩn câu này · Xoá câu này |
| set.sec.send | Gửi lần lượt {4} tin |
| set.progress | Đã chép {1}/{4} |
| set.next | Tiếp theo |
| set.copy | Chép tin {n} |
| set.recopy | Chép lại tin {n} |
| set.cta | Chép tin {2}/{4} · {VI} |
| set.done | Đã chép đủ {4} tin |
| set.price | Giá set |
| set.price.help | Để trống = {850.000đ} (tổng giá lẻ) |
| set.link | Link bài viết (tuỳ chọn) |
| set.link.ph | Để trống = link bài của mẫu |
| set.unchecked | Giá set lấy từ bài đăng, chưa kiểm tra. |
| set.checked.btn | Đã kiểm tra |
| set.add / del | Thêm mẫu vào set · Xoá set |
| order.newest | Mẫu mới nhất |
| order.new | Đơn mới |
| order.empty | Đơn còn trống. Chạm ＋ size bên dưới để thêm món nhé. |
| order.paste | Dán |
| order.bank | Kèm thông tin chuyển khoản |
| order.total | Tổng · {n} món |
| order.cta | Chép đơn · {VI} |
| order.line.title | Sửa món · Size · Số lượng · Xoá món |
| nav | Trang chủ · Trả lời nhanh · Sản phẩm · Đơn |
| nav.order.aria | Đơn hàng, {n} món, {tổng} |
| toast.copied | Đã chép · {Thông tin Butter Top} · {VI} |
| toast.copied.tip (first 3) | Mở Instagram và dán vào ô tin nhắn nhé. |
| toast.added | Đã thêm {Lace Top · M} vào đơn · [Xem đơn] |
| toast.set | Đã chép tin {1} · Tiếp theo: tin {2} |
| toast.leadSaved | Đã lưu câu mở đầu |
| toast.regen | Tin đã cập nhật theo lựa chọn mới · [Hoàn tác] |
| search.empty | Chưa tìm thấy “{q}”. Thử một tên ngắn hơn nhé. |

---

## 10. Build plan (for the implementer, in priority order)

Each step leaves the app working. Run `python3 build.py`, then `node --test tests/compose.test.mjs`, then the UI suites.

### P0: safe area, colour, nav, icon (1 day)

1. **`src/index.src.html`**
   - Update the `theme-color` metas to `#FCFBF5` / `#1C1D1C`.
   - Add the `i-order`, `i-info`, `i-undo` and `i-link` symbols; delete `i-bag`.
   - Change the order button to `<button class="rbtn" …><svg …#i-order/><span>Đơn</span><b class="bd" hidden></b></button>`.
   - Change the nav `aria-pressed` to `aria-current`.
2. **`src/app.css`**
   - Replace both token blocks with §2.2 and §2.3. Rename `--accent*` usages to `--primary`, `--accent-ui`, `--sel-fill` or `--tonal` per §8.
   - Delete `--safe-top`/`--safe-bottom` and every `env(` except none (the probe is inline in JS).
   - Add `--inset-t`, `--inset-b`, `--bar-h`, `--bar-y`, `--bar-top` (§4.2) and rewrite `.tab`, `#toast`, `.ofoot`, `.shf`, `.shb.pad`, `.sheet` top, `#nav` padding and `#fbar`.
   - `html, body { background: var(--bg-grouped) }`.
   - Restyle `.lsw` as a segmented control and `.fb`/`.rbtn`/`.bd` per §8.14–8.15.
3. **`src/app.js`**
   - Replace `measureSafe()` with `measureInsets()` (§4.2) and wire it to boot, `resize`, `orientationchange` and `visualViewport.resize` when not focused.
   - Add the `#debug=insets` overlay.
   - `updateOrderBar()` sets the aria-label per microcopy.
4. **`tools/make_icons.py`** `PICK = "B"` plus the baked 1 px edge. **`build.py`** manifest `background_color: "#F2E7AB"`. Regenerate icons, splashes and `shots/icon-preview.png`.
5. **`tests/compose.test.mjs`**: extend the colour grep to the rose hexes (§2.1.4).

**Acceptance P0**
- At 430 × 932 and 393 × 852 with emulated insets (59/34) the bar's bottom is **24 ± 1 pt** above the viewport bottom. With the app in an iframe or with `#inset-b=0` it is **12 ± 1**. On SE 375 × 667 it is **12**.
- There is no pixel row between the app's last painted row and the viewport bottom whose colour differs from `--bg-grouped` (screenshot scan of the bottom 80 pt).
- `grep -c "env(safe-area" dist/index.html` equals 1 (the probe string).
- No rose hex in `src/` or `build.py`.
- The order button shows the glyph, "Đơn" and a neutral badge.
- The manifest background is Vanilla and `apple-touch-icon.png` has a Vanilla corner pixel.

### P1: product sheet and opening-line picker (1.5 days)

1. **`src/app.js`**
   - Rewrite `renderProd` per §7.7: header, segmented (`data-act="pseg"`), dropdown row(s), `ebHtml` with strip, sections, a single footer.
   - Delete the `.arow` collapsed rows, `pcopy` from secondary rows, `leadZone` chip markup in this sheet, `linkZone` chips (→ switch row) and `popen`.
   - Edits keyed `info`/`size`. The `both` text is computed as `join(infoPart, sizePart)`, where each part = strip text + `\n\n` + its textarea. `composeCopy('both')` must still equal the joined UI text (assert).
   - New `openLeadPicker(scope, action)`: a medium sheet with radio rows, inline add and inline edit (reuse `addLead`, `saveLeadEdit`, `removeLead`).
   - New `leadStripHtml(s, action)` and `flashStrip(el)`. When `prefers-reduced-motion`, no flash.
   - The clipboard for a box is `strip ? strip + "\n\n" + ta.value : ta.value`. `C.stripLead` is no longer needed for saving (the strip is never inside the textarea).
2. **`src/app.css`**: add `.seg` 44 variant, `.ddrow`, `.ebox`, `.lstrip`, `.rrow`, `.section`, `.notice`, `.btn.tonal`. Delete `.arow`, `.lead`, `.lchip*` and `.acard`.
3. **`src/compose.js`**: none (verify that `composeCopy('both', …)` order matches §7.7).

**Acceptance P1**
- The product sheet has **exactly one** element with `data-act` that copies.
- The segmented control's selection equals the box caption equals the footer label (all three combinations).
- Preview equals clipboard for info/size/both × each lead × VI/EN (re-run the existing 70-combination test against the new DOM).
- No horizontal scroll and no outline chips (`.lchip`, `.chip.ghost` count = 0).
- The 393/430 vertical budget table in §7.7 holds ± 4 pt.
- Taps: product info from the list = 2; size chart from Tư vấn size = 2.
- Choosing a line in the picker shows the strip within 1 frame after close.

### P2: set sheet (0.5 day)

1. **`src/app.js` `renderSet`**: bubble cards per §7.9. The button goes inside the card in its own row. Add the "Đã chép n/m" progress, the next ring and tag, a scroll-to-next after copy, `bnext` footer text "Chép tin n/m · VI", and the done state. Price and link become `input` 52 with helper text below.
2. **`src/app.css`**: `.bcard` padding 16 / gap 16 / ring. Delete `.setpic .av{border-radius:18px}` and set the size to 72 circles.

**Acceptance P2**
- For every bubble card, the distance between the textarea's bottom and the button's top is ≥ 12 pt, and the button's right edge is ≤ card right − 16 (asserted via `getBoundingClientRect`).
- All `.av` elements report `border-radius` 50 % (computed style), app-wide.
- Exactly one `.bcard.next`.
- After copying tin 1, tin 2 is next and in view.

### P3: affordance sweep (1 day)

1. **`src/app.js`**
   - `renderHomeScreen` (§7.2), `paintStages` and the stage title/eyebrow (§7.3).
   - `qcard` for product cards → rows (§7.3).
   - `renderMsg` fills → dropdown/segmented (§7.4).
   - The order composer: "＋ S" buttons, the "Trong đơn" line, and a line editor sheet in place of `.lexp` (§7.5).
   - `paintFilt` → segmented (§7.6); picker filter → segmented (§7.10); settings rename "Câu mở đầu".
   - Toast tip for the first 3 copies (`st.tips`).
2. **`src/app.css`**: delete `.chip.ghost`, `.fc`, `.sg[aria-pressed]` outline and `.tile .tn` rose. Restyle `.qc` with its footer label.

**Acceptance P3**
- `document.querySelectorAll('.chip.ghost,.lchip,.fc').length === 0`.
- Every button's accessible name starts with a verb, or is a noun on a › row or a segment (lint list in tests).
- Every interactive element ≥ 44 × 44.
- No computed colour on any element equals a rose hex.

### P4: tests and screenshots (0.5 day)

- New `tests/ui/round5.mjs` (Playwright, 393 × 852 and 430 × 932, light and dark), covering P0–P3 acceptance plus the safe-area matrix (§11.2), emulated by injecting `--inset-*` through `#inset-b`/`#inset-t` and by loading the app inside an iframe page `tests/ui/host.html` that pads `:root` by 59/34.
- Re-shoot `shots/` for: home, stage 2, message sheet, Tạo đơn, Sản phẩm, product sheet (Thông tin / Bảng size / Cả hai / strip arrival / edited), lead picker, set sheet (fresh / after tin 1 / done), settings, and the nav with badge. Do this at 393 and 430, light and dark, plus `shots/430-host-frame-dark.png` and `shots/375-se-pwa.png`.
- Update `docs/v2-report.md` with a "Round 5" section: numbers, deviations, "needs a real iPhone".

**Kept constraints (re-assert):**
- Copy ≤ 2 taps for product info from a product list or a stage card.
- Editable, internally scrolling boxes.
- Truncation, missing-language and set price guards.
- Copy handler synchronous (median < 3 ms at 4× CPU).
- No render on typing.
- Sheet open ≤ 40 ms to second frame at 4×.
- 44 pt targets.
- Reduced motion.
- Zero console errors.
- No horizontal scrollers.

---

## 11. QA checklist

### 11.1 Visual (each at 393 and 430, light and dark)

- [ ] No rose anywhere: buttons, badges, selected stage, VI/EN, chips, switches, toast icons, the "Xong" link.
- [ ] At most one filled primary per screen: Home, the stage lists and Sản phẩm have none; the Tạo đơn footer has one; each sheet has one, in its footer.
- [ ] Product photos are circles on home tiles, list, set list, product sheet, set sheet, pickers and order lines.
- [ ] Set sheet: 16 pt between cards, ≥ 12 pt between box and button, button inset 16 from the card edge.
- [ ] Product sheet: the segment, box caption and footer verb agree; the strip is visible when a line is selected; nothing collapses when switching.
- [ ] Every editable box shows "✎ Sửa"; no "Chạm vào khung…" sentence remains.
- [ ] Dropdown rows show "Đổi ⌄"; radio pickers show the full sentences.
- [ ] Notices (ⓘ) are grey, not red; red appears only on Xoá and errors.
- [ ] Dark: no pure black or white; text boxes `#333433`; Vanilla primary text is Jet; photos have the faint ring.
- [ ] Contrast spot-check with a picker tool: on-primary ≥ 7.5 (light) / ≥ 11 (dark); `--label-3` ≥ 4.5 on its surfaces.

### 11.2 Safe-area matrix (bar bottom above the app's bottom edge; no band of a different colour)

| Device (viewport) | Safari tab | Home-screen app | Host wrapper (iframe, root padded 59/34) | Keyboard open |
|---|---|---|---|---|
| iPhone SE 3 (375 × 667, no indicator) | 12 | 12 | 12 | bar hidden, footer above keyboard |
| iPhone 14 Pro (393 × 852) | 12 (toolbar below), or 24 if Safari reports a 34 inset | **24** | 12 | same |
| iPhone 15 Pro Max (430 × 932) | same as 14 Pro | **24** | 12 | same |
| Any, `#inset-b=0` | 12 | 12 | 12 | — |

- [ ] The `#debug=insets` overlay values match the table on her real phone (ask for one screenshot in each context she uses).
- [ ] No `100vh` / `dvh` in the CSS; `env(` appears only in the probe.
- [ ] The sheet top equals `--inset-t + 10`; the sheet footer clears the home indicator by ≥ 8 pt.
- [ ] Rotation (if allowed) or resize re-measures without reload.

### 11.3 Behaviour

- [ ] Taps: product info 2 (list row → Chép); size chart 2 from Tư vấn size; greeting 2 inside Chào hỏi; set bubble 1 is 3 from a product sheet; order created 2, copy is the 3rd.
- [ ] Preview equals clipboard for every action × lead × language, the both-join and every set bubble.
- [ ] Lead selection persists only after a successful copy; ✕ on the strip = "Không kèm".
- [ ] Edits survive segment switches; "Khôi phục" and "Lưu làm mẫu" work per part.
- [ ] Guard: the first tap arms (tonal "Chạm lại để chép"); < 400 ms is ignored; 400 ms–3 s copies.
- [ ] Missing EN: the footer is disabled, and "Chép bản VI" copies VI with the toast "· VI".
- [ ] First-copy tip shows 3 times, then never.
- [ ] VoiceOver: segments announce "Thông tin, đã chọn, 1 trên 3"; dropdown rows announce label, value, "Đổi"; the order button announces count and total; the radio group works.
- [ ] Reduced motion: no flash, no scale, no smooth scroll.
- [ ] Performance: copy handler median < 3 ms at 4× CPU; typing < 2 ms; picker open < 40 ms to second frame; the bundle grows ≤ 6 KB gzip over Round 4.
