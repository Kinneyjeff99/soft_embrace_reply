# Soft Embrace Reply — Design v2: "Một câu hỏi, hai chạm"

Status: decided. This document supersedes `design-spec.md` §2 (IA), §3 (flows), §4.1, §4.2, §4.3 and §4.5 placement. Everything else in `design-spec.md` stays in force: the tokens in §7, the motion in §8, the voice in §9, accessibility in §10, and the performance and clipboard rules in §11. Where this document is silent, v1 applies.

Founder feedback this answers:
1. "The main page is overwhelming. It's well organised, but there are too many things. It's a powerful tool that you have to learn." She wants a first screen a new user can act on at once, with nothing to learn.
2. "When I send a size chart or product info, I add a short line first." She wants to add those lines from the app, without the lines being baked in so she has to delete them when she doesn't want them.

The one-sentence design: **the app opens on the product list. One tap opens a small sheet. A second tap copies. Everything else stays out of sight until it is needed.**

---

## A. Diagnosis: what the current home shows

Sources: `shots/393-01-mau.png` (first viewport), `393-02-mau-bottom.png` (scrolled), `393-04-product-sheet.png`, `393-12-set-copy-warning.png`, `393-15/16-order-*.png` and `393-07-flow.png`.

### A.1 Inventory of the first viewport (393 × 852)

| # | Element | Interactive targets | Notes |
|---|---|---|---|
| 1 | Settings glyph (slider icon) | 1 | Icon only. A new user can't tell what it does. |
| 2 | VI / EN segmented control | 2 | Global state on the home screen, but it only matters at copy time. |
| 3 | Time greeting "Chiều dịu dàng, Embrace" | 0 | Pleasant, but it stacks over a second title. |
| 4 | Large title "Mẫu" | 0 | Names a tab instead of answering a question. |
| 5 | **Gần đây**: header plus ghost chip "Bản đã chép sẽ hiện ở đây" | 0 (later up to 8) | Empty on first run. Prime space spent saying "nothing here". |
| 6 | **Lời chào**: 2 tiles, each with its own copy glyph | 4 | The tile and its glyph both copy. Their subtitle "Chỉ lời chào" changes with hidden context. |
| 7 | "Thêm thông tin mẫu ›" | 1 | A mode switch phrased as a link. Needs to be learned. |
| 8 | **Set**: 3 placeholder rows "Chưa có câu — bấm để thêm", each with a pencil | 6 | Three rows of empty content above the real catalogue. |
| 9 | **Tất cả mẫu · 13**: about 2.5 product rows, each with a copy glyph | 4–5 | The same copy glyph means "copy info" here and "copy greeting" in row 6. |
| 10 | Tab bar: Mẫu / Kịch bản / Đơn | 3 | Three places to learn. |
| 11 | Floating search button | 1 | Icon only. |
| | **Total in the first viewport** | **≈ 22 targets** | 4 section headers, 6 distinct kinds of control. |

On the whole scrolled page there are **≈ 44 tap targets**:
- 13 product rows with 2 targets each.
- **20 icon-only buttons**: 15 copy glyphs, 3 pencils, settings and search.
- 5 destructive-tint "Cần kiểm tra" badges, on 38 % of the catalogue (shot 02).
- A footer that teaches a hidden gesture: "Chạm giữ một mẫu để thêm vào Yêu thích nhé."

The **Kịch bản** tab adds 18 scripts in 6 numbered stages (shot 07). The **Đơn** tab is a full page with a ship-fee segment, an address field, a bank (STK) row, a preview and the total (shots 15 and 16).

### A.2 Taps to the first useful copy (new user, cold start)

| Task | v1 taps | What has to be learned first |
|---|---|---|
| Product info | 1 (row glyph), but only if she guesses what the glyph copies. 2 via the sheet. | That the row glyph is a different action from the row tap |
| Greeting + product info | 3 ("Thêm thông tin mẫu" → pick → tile) | The hidden 5-minute "context" model |
| Size chart | 2 (row → "Bảng size") | That the secondary button copies, not switches |
| Order recap | 4–5 (row → size chip → Đơn tab → ship fee → Chép đơn) | That adding happens in Mẫu and copying in Đơn |
| Set answer | impossible (placeholder → editor) | — |
| Size advice script | 2–4 (Kịch bản tab → row → fill → Chép) | The 6-stage taxonomy |

### A.3 Verdict per element

| Element | v2 decision |
|---|---|
| Time greeting | **Keep** as a quiet eyebrow line, the brand warmth. Not a title. |
| Title "Mẫu" | **Replace** with the question "Khách đang hỏi gì?" |
| VI/EN on home | **Move** into the sheet, next to every copy button. |
| Settings glyph | **Replace** with a text button "Tuỳ chỉnh". |
| Gần đây | **Remove** from the UI. Keep writing `st.recents` (cheap) for candidate ordering in fill rows. |
| Yêu thích + long-press + its footer hint | **Remove.** 13 products don't need favourites, and search covers growth. Ignore `st.favs`; don't delete it. |
| Lời chào tiles + "Thêm thông tin mẫu" + greeting context | **Merge into Câu đệm (lead-ins).** Her two real greetings become the first lead-ins of the "Thông tin" action (§D). |
| Set placeholders | **Delete.** Sets exist only once she builds one (§E). |
| Row copy glyphs | **Remove.** The whole row is one target that opens the sheet. |
| "Cần kiểm tra" badges in the list | **Move** into the sheet as a quiet line. Show the count once in Tuỳ chỉnh. |
| Tab bar (3 tabs) | **Remove.** One screen plus sheets plus an order bar that appears only when needed. |
| Kịch bản tab | **Becomes** the "Câu trả lời khác" sheet, opened from one row on home. |
| Đơn tab | **Becomes** the Order sheet, opened from the order bar. |
| Floating search button | **Becomes** an always-visible search field at the top. |
| Context chip "Đang tư vấn" | **Hide.** The context still pre-fills `{{item}}`/`{{size}}` and is shown only inside fill rows ("Lấy từ Lace Top · M"). |
| Swipe actions on rows | **Remove.** |

---

## B. New information architecture

### B.1 The one question

The first screen answers **"Khách đang hỏi gì?"** In about 80 % of DMs the answer is a product: info, a size chart, or ordering it. So the product list *is* the main answer, and it starts on screen one. Everything that isn't about a product goes behind **one** entry, "Câu trả lời khác".

We deliberately use **one** intent entry, not 3–4. Entries like "Thông tin", "Bảng size" and "Đặt hàng" would each lead to the same product pick. That adds a decision without saving a tap. The three product intents live *inside* the product sheet, where the product is already known.

### B.2 Structure (no tabs)

```
Home (one screen)
├─ Search field ────────────► results in place: Mẫu · Set · Câu trả lời
├─ "Câu trả lời khác" row ──► Replies sheet (Chào · Tư vấn size · Giao hàng · Sau khi chốt · Set)
├─ Product list (13 rows) ──► Product sheet  ◄── the core loop (§C)
├─ "Tuỳ chỉnh" ─────────────► Settings sheet (unchanged pages + "Câu đệm", "Set")
└─ Order bar (only when the order has ≥1 item) ──► Order sheet (the v1 Đơn page, moved into a sheet)
```

Decisions:
- **Tabs: zero.** Kịch bản and Đơn were destinations only because they were tabs. In v2 they are things you open when you need them.
- **The order composer** lives in a sheet. Its entry, the **order bar**, appears only once an item has been added, from the product sheet's size chips. With an empty order there is no order UI anywhere on home.
- **Settings and editing** live in "Tuỳ chỉnh". Editing that happens during a conversation is the exception: lead-ins are added and edited inline (§D), and missing or truncated texts link straight to their editor page.
- **Language** is chosen in the sheet, right beside the copy button. It is sticky (last used) and shown in every copy label and toast.

### B.3 First screen wireframe (393 pt, light)

```
┌───────────────────────────────────────────┐ 393
│ (status bar / safe area)                  │
│                                           │
│ Chiều dịu dàng, Embrace        Tuỳ chỉnh  │  eyebrow 15 italic serif, label-2 · text button 17, label
│ Khách đang hỏi gì?                        │  serif 30/36, label
│                                           │  16
│ ┌───────────────────────────────────────┐ │
│ │ ⌕  Tìm mẫu hoặc câu trả lời…          │ │  44 pt field, fill-3
│ └───────────────────────────────────────┘ │
│  Chạm vào mẫu khách hỏi để chép thông   ✕ │  first-run hint (B.5), 13 label-2
│  tin, bảng size hoặc thêm vào đơn.        │
│                                           │  16
│ ┌───────────────────────────────────────┐ │
│ │ Câu trả lời khác                    › │ │  56 pt row, bg-cell
│ │ Chào · tư vấn size · ship · cảm ơn    │ │  13 label-2
│ └───────────────────────────────────────┘ │
│                                           │  24
│ MẪU · 13                                  │  13 caps label-2
│ ┌───────────────────────────────────────┐ │
│ │ (🕊) Soft Halter Top · Trắng        › │ │  60 pt rows, emoji disc 40
│ │      ○ 360.000đ                       │ │
│ │ ───────────────────────────────────── │ │  hairline, inset 68
│ │ (🫐) Soft Halter Top · Xanh         › │ │
│ │      ● 365.000đ                       │ │
│ │ ───────────────────────────────────── │ │
│ │ (♬) Noir Dotty Top                  › │ │
│ │      ● 390.000đ · Chấm bi đen         │ │
│ │ ───────────────────────────────────── │ │
│ │ (🫧) Ivory Dot Blouse               › │ │
│ │      ○ 380.000đ · Trắng kem           │ │
│ │ …  (9 more, plain scroll)             │ │
│ └───────────────────────────────────────┘ │
│                                           │
│ ┌───────────────────────────────────────┐ │  ORDER BAR, only if order ≥1 item
│ │ Đơn · 2 món · 850.000đ   [ Xem đơn ]  │ │  56 pt, material-thick, floats above safe area
│ └───────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

Visible interactive elements on first run: **Tuỳ chỉnh, search, hint ✕, Câu trả lời khác, product rows**. That is 4 controls plus one homogeneous list where each row has exactly one target. With an active order, the order bar makes 5.

### B.4 The zero-learning principle (binding rules)

1. **Every control has a word.** Icons are only allowed *next to* a label. The exceptions are the universal ✕ (close) and › (opens more), and each carries an `aria-label`. No glyph-only copy buttons anywhere.
2. **One tap target per row.** A row never hides a second action inside itself: no trailing glyph, no long-press, no swipe.
3. **At most 7 visible interactive controls** on the first screen, counting a homogeneous list as one. v2 uses 4 (5 with the order bar).
4. **No hidden modes.** State that changes what gets copied (language, lead-in) is shown *on* the copy button or *in* the preview, never somewhere else on screen.
5. **The preview is the truth.** What the paper card shows is byte-for-byte what lands on the clipboard. The lead-in is included and nothing is appended out of view.
6. **Nothing empty on screen.** No placeholder rows, no "will appear here" ghosts. A section appears when it has content.
7. **Labels are verbs the founder already says**: "Chép thông tin", "Chép bảng size", "Thêm vào đơn", "Xem đơn". None of these are app jargon (v1 used "Kịch bản", "Mẫu tóm tắt", "ngữ cảnh").

### B.5 First-run hint

- One line under the search field: **"Chạm vào mẫu khách hỏi để chép thông tin, bảng size hoặc thêm vào đơn."** with a ✕ (`aria-label="Ẩn gợi ý"`).
- It is dismissed by tapping ✕ **or automatically after the first successful copy**. Store `st.hintDone = 1`. It never returns, it is not a tutorial, and there is no coach-mark overlay.
- Style: 13/18, `--label-2`, no background, no accent.

### B.6 Search

- Typing filters in place. The list area becomes results grouped **Mẫu · Set · Câu trả lời**, with the group header shown only when the group has hits.
- A product result opens the Product sheet, a set result the Set sheet, and a reply result the Message sheet (v1 `openMessage`).
- Keep the existing `buildIndex` / `norm()` (diacritics-insensitive). Add a Set index entry for each set (§E). A query matching `set` or `bộ` lists all sets first.

---

## C. The core loop: 2 taps

### C.1 Product sheet ("action stack")

Medium detent. Three copy actions, **each copy-ready with one tap**, plus "Thêm vào đơn". Only one action is *open* at a time, meaning it shows a preview and lead-in chips. The others are a single compact row with their own copy button, so they still copy in one tap.

```
┌───────────────────────────────────────────┐
│                  ───                      │ grabber
│ 🦢 Lace Top                     [VI|EN] ✕ │ title serif 22 · seg 32pt · close
│ 380.000đ · Trắng kem · S M L              │ 15 label-2
│ · Thông tin bị cắt ở sheet gốc — Sửa      │ quiet warning line (only if truncated), 13
│                                           │
│ THÔNG TIN                    (open)       │ 13 caps label-2
│ ┌───────────────────────────────────────┐ │
│ │ Soft gửi bạn thông tin mẫu ạ          │ │ ← selected lead-in, plain text
│ │                                       │ │
│ │ Lace Top 🦢                           │ │ paper card, max 7 lines,
│ │ • Dáng áo cổ vuông, viền ren thêu,…   │ │ "Xem hết" expands in place
│ │ • Chất liệu: Lụa ánh kim phối ren     │ │
│ │                          Xem hết ⌄    │ │
│ └───────────────────────────────────────┘ │
│ [Không kèm] [Soft gửi bạn thông…✓] [Dạ c… │ lead-in chip row, h-scroll, 36pt
│                                 [+ Thêm câu]
│ ┌───────────────────────────────────────┐ │
│ │        ⧉  Chép thông tin · VI         │ │ primary, 50pt, the ONLY accent fill
│ └───────────────────────────────────────┘ │
│ ───────────────────────────────────────── │
│ Bảng size                    [Chép · VI]  │ 52pt row, tinted button (fill-3, label ink)
│ kèm: "Cho mình gửi bảng size…"            │ 13 label-2: lead-in state, or "không kèm câu"
│ ───────────────────────────────────────── │
│ Thông tin + bảng size        [Chép · VI]  │
│ ───────────────────────────────────────── │
│ Thêm vào đơn          ( S ) ( M ) ( L )   │ size chips 44pt; tap = add 1 to the order
│ Khách hỏi set? Ghép với mẫu khác ›        │ 15 label-2 link (§E); hidden if no other product
└───────────────────────────────────────────┘
```

Behaviour:
- **Tap 1** on a product row opens the sheet with **Thông tin** open. **Tap 2** on "Chép thông tin · VI" copies.
- Size chart is also **2 taps**: row, then the "Chép" on the Bảng size row. Tapping the *label* of a collapsed row (not its button) makes that action the open one, so she can preview or change its lead-in. The open action is remembered per sheet session only, and the sheet always opens on Thông tin.
- **"Thông tin + bảng size"** ("Chép cả hai") copies:
  `[info lead-in]\n\n[info]\n\n[size lead-in]\n\n[size chart]`
  Each part uses its own selected lead-in and empty parts are skipped. This is sensible because she often sends both back to back. When opened, its preview shows the full combined text.
- **Thêm vào đơn**: tapping a size chip adds that line, plays a bump on the order bar, and shows the toast "Đã thêm Lace Top · M vào đơn". The sheet stays open, and the chip shows a count badge "M ·1". This keeps the v1 `addLine`.
- Copy keeps the sheet open, since she often copies info and then size. The toast is "Đã chép · Lace Top · VI". The button seal works as in v1.
- The language segment `[VI|EN]` sits in the sheet header and is sticky globally. Every copy button label ends in "· VI" or "· EN".

### C.2 Safety features, kept but quiet

| v1 behaviour | v2 presentation |
|---|---|
| **Language visible on every copy** | Suffix on every copy button ("Chép · EN") and in the toast. Nothing else. |
| **Truncated text warning** (modal dialog, shot 28) | A quiet line under the sheet subtitle: a `--destructive` 6 pt dot plus "Thông tin bị cắt ở sheet gốc — **Sửa**" (13, label-2; "Sửa" opens the editor page). The copy is guarded **in place**: the first tap turns the button into "Chưa sửa — chạm lần nữa để chép" (label-2 on fill-2, not accent) for 3 s. A second tap within that window copies. Taps less than 400 ms apart are ignored so a double-tap can't bypass the guard. No modal. |
| **Missing language blocks the copy** | The button becomes disabled-looking with the text "Chưa có bản EN". Directly under it is one text button: "Chép bản VI" (copies the other language, toast says "· VI") or "Thêm bản EN" (editor). Inline, no modal. |
| **No unedited Set copy** | Placeholder sets no longer exist (§E), so there is nothing unedited to copy. Auto-composed set text uses only real product fields. |
| **Copy failure fallback** (shot 33) | Unchanged: rollback seal, error toast, fallback sheet with the text pre-selected. |

### C.3 Câu trả lời khác (the old Kịch bản)

A large-detent sheet with plain grouped rows. There are no stage numbers and no copy glyphs: a row opens the v1 Message sheet, whose button reads "Chép · VI".

| Group | Rows (`flow` ids) |
|---|---|
| Chào | Khách mới (greeting only, `greetOnly`), Khách cũ (greeting only), Thêm hình |
| Tư vấn size | Xin số đo, Vừa size, Giữa 2 size, Quá size – có mẫu khác, Quá size – không có mẫu khác, Quá nhỏ, Cân nhắc |
| Giao hàng | Thông tin giao, Giá ship |
| Sau khi chốt | Đã nhận, Cảm ơn (có sẵn), Cảm ơn (may đo), Lời kết, Đổi trả (hidden while empty) |
| Set | one row per saved set + "Tạo set" row (§E). The group is shown always, because this is the second door to sets. |

A row whose template needs `{{item}}`/`{{size}}` pre-fills from the last opened product, which is the v1 `ctx`. The fill row shows "Lấy từ Lace Top · M".

### C.4 Order sheet

This is the v1 `renderOrder` content unchanged, moved into a large-detent sheet: lines, Phí ship segment, Thông tin nhận, STK row, preview, total, and the "Chép đơn · VI" primary button. One addition is the **order lead-in chip row** directly above "Chép đơn" (§D). "Đơn mới" stays as a text button top-left. After "Chép đơn" the thank card (shot 18) appears inside the sheet, and its "Chép lời cảm ơn · VI" uses the **thanks** lead-ins (§D).

The order bar disappears when the order is emptied, or after "Đơn mới".

---

## D. Câu đệm (lead-in lines)

### D.1 Model

A lead-in is an optional short line placed **before** an action's content. It is never baked into templates. Each action has its own list.

```jsonc
// src/data.json (new top-level key)
"leadIns": {
  "info":   [ { "id": "li-info-1", "vi": "…", "en": "…", "default": false, "seed": "sheet" }, … ],
  "size":   [ … ],
  "order":  [ … ],
  "thanks": [ … ]
}
```

| Field | Meaning |
|---|---|
| `id` | Stable id. Seeds use `li-<action>-<n>`. User lines use `lu-<timestamp36>`. |
| `vi`, `en` | Text per language. Either may be `""`. A lead-in shows only in languages where it has text. |
| `default` | If `true`, it is pre-selected on a fresh install for that action and language. **All shipped seeds are `false`.** |
| `seed` | `"sheet"` = taken from her own CS sheet (real wording). `"draft"` = written by us, **to be replaced by her real IG phrases**. User lines omit `seed`. |

User state (localStorage `se.v1`, inside `st`):

```jsonc
"lead": {
  "sel":    { "info:vi": "li-info-2", "info:en": null, "size:vi": null, … },  // selection per action × language; null = none
  "custom": [ { "id": "lu-k3x9", "action": "size", "vi": "…", "en": "" } ],
  "edits":  { "li-info-3": { "vi": "…" } },          // edits to seeds
  "hidden": [ "li-size-4" ]                           // seeds she removed
}
```

Effective list per action and language: seeds (minus `hidden`, with `edits` applied) + `custom` for that action, keeping only those with non-empty text in that language. **Custom lines come first**, newest first, so her own wording is leftmost.

### D.2 Selection rule (anti-rigidity)

- **Single-select per action**, with an explicit first chip **"Không kèm"**. The state is always visible as exactly one selected chip.
- **Sticky (last used), per action and per language.** She "usually" adds a line, so if she used "Soft gửi bạn thông tin mẫu ạ" last time, it is already on next time. Turning it off is one visible tap on "Không kèm", and nothing ever needs deleting.
- **Fresh install = "Không kèm" everywhere**, because the seeds aren't yet her words.
- **A newly added line is auto-selected**, since she just wrote it to use it.
- **The selection persists only when a copy succeeds** with it. Changing chips and closing without copying does not change the remembered choice. This prevents leftover selections from browsing.

### D.3 UI (inside the sheet, directly above the copy button)

```
[Không kèm] [Soft gửi bạn thông tin mẫu ạ ✓] [Dạ chào bạn, Soft gửi bạn…] [+ Thêm câu]
```

- Chips are 36 pt tall, 15 pt text, max width 240 pt with an ellipsis, and the row scrolls horizontally with a 16 pt gutter.
- The row stays in the open action only. Collapsed rows show the state as text ("kèm: "Cho mình gửi bảng size…"" or "không kèm câu").
- Selected chip: `--accent-tint` background, `--label` text, and a 15 pt check. **Not** accent-filled, so the copy button stays the only accent fill.
- **Tap** a chip to select it. Tapping the selected chip returns to "Không kèm".
- **"+ Thêm câu"**: the chip row is replaced *in place* by a one-line growing field (16 pt, so iOS doesn't zoom) with the placeholder **"Câu bạn hay nói trước khi gửi…"** and two text buttons, **Lưu** and **Huỷ**.
  - The text is saved to the **current sheet language** for the current action.
  - On save, the line is auto-selected and the preview updates.
  - A line written in VI has no EN text, so it simply doesn't show in EN mode.
- **Long-press a chip** (450 ms, v1 menu component) opens the menu **Sửa · Xoá**. For seeds it shows **Sửa · Ẩn**.
  - "Sửa" opens the same inline field pre-filled, plus a second field **"Bản tiếng Anh (tuỳ chọn)"**. This is the only place EN is added inline.
  - This is the single long-press left in the app. It is safe because tapping does the obvious thing and editing is a power use.
- Full management (reorder, restore hidden seeds) lives in **Tuỳ chỉnh → Câu đệm**, but she never *needs* to go there.

### D.4 Output and preview

```
copyText = leadIn ? leadIn.trim() + "\n\n" + content : content
```

Then the existing `clean()` normalisation runs: CRLF→LF, trailing spaces trimmed, 3+ newlines collapsed.

- The preview paper renders `copyText` exactly. The lead-in is plain text in the same style.
- When a chip changes, the lead-in paragraph gets a 400 ms `--accent-tint` background fade (none with reduced motion), so she sees what changed.
- **EN behaviour:** the chips list EN lead-ins only, and the selection is the remembered `info:en`. If the content falls back to the other language (missing language, §C.2 "Chép bản VI"), the lead-in used is the one selected for *that* language, so a message never mixes languages.
- The order action places the lead-in before the recap's own first line ("Dạ vậy đơn của bạn 🌷"). Thanks places it before the thank text.

### D.5 Seeds

Rows marked **sheet** are her own wording, taken from the CS sheet already in `data.json`. Rows marked **draft** are ours, in the Romantic Calm voice, and **must be replaced by her real Instagram phrases**. We could not read her IG yet; the first pass of the IG export should overwrite every `draft` row.

**info** (before product info)

| id | seed | VI | EN |
|---|---|---|---|
| li-info-1 | sheet | Soft Embrace chào bạn, cảm ơn bạn đã quan tâm đến sản phẩm của chúng mình, Soft xin gửi bạn thông tin sản phẩm ạ: | Hi lovely! Thanks for your interest in Soft Embrace pieces 🤍 Here's a little more info on the piece you're interested in: |
| li-info-2 | sheet | Dạ chào bạn, Soft gửi bạn thông tin sản phẩm bạn quan tâm ạ | Hi again! Of course, here are the details 🤍 |
| li-info-3 | draft | Soft gửi bạn thông tin mẫu ạ 🌷 | Here are the details for you 🌷 |
| li-info-4 | draft | Dạ mẫu này còn bạn nhé, Soft gửi bạn thông tin ạ | Yes, this piece is still available, here are the details 🤍 |

**size** (before the size chart)

| id | seed | VI | EN |
|---|---|---|---|
| li-size-1 | sheet | Mình gửi bạn tham khảo bảng size nha | Here's the size chart for reference: |
| li-size-2 | draft | Cho mình gửi bảng size bạn tham khảo nha 🤍 | Here's our size guide, take a look 🤍 |
| li-size-3 | draft | Dạ đây là bảng size của mẫu này ạ, bạn cho mình xin số đo để Soft tư vấn kỹ hơn nhé | Here's the size chart. Feel free to share your measurements and we'll help you choose. |
| li-size-4 | draft | Bạn xem giúp Soft số đo ngực và eo nhé | Please check the bust and waist measurements below |

**order** (before the order recap)

| id | seed | VI | EN |
|---|---|---|---|
| li-order-1 | draft | Dạ Soft lên đơn cho bạn nha 🌷 | Lovely, here's your order 🌷 |
| li-order-2 | draft | Bạn kiểm tra giúp Soft đơn hàng nhé ạ | Could you double-check your order below? |
| li-order-3 | draft | Cảm ơn bạn đã chọn Soft Embrace, mình gửi bạn đơn nha 🤍 | Thank you for choosing Soft Embrace, here's your order recap 🤍 |

**thanks** (before the thank-you message)

| id | seed | VI | EN |
|---|---|---|---|
| li-thanks-1 | sheet | Soft nhận được rùi ạ | Got it, thank you! Your order is confirmed 🤍 |
| li-thanks-2 | draft | Dạ Soft đã nhận được chuyển khoản của bạn ạ 🌷 | We've received your payment, thank you 🌷 |
| li-thanks-3 | draft | Đơn của bạn đã được xác nhận rồi nha | Your order is all set |

The two `sheet` greetings (li-info-1 and li-info-2) replace the v1 greeting tiles. The `open-first`/`open-returning` templates stay as **greeting-only** rows in "Câu trả lời khác → Chào".

---

## E. Sets

### E.1 Construct

A set is 2 or more products, a combined price, an optional set discount, and a message **composed from product data**. It never holds free text we invented.

```jsonc
// st.sets (user data; data.json ships "sets": [] as the seed)
{ "id": "set-k3x9", "items": ["lace-top", "lace-skirt-cream"],
  "discount": 50000,             // đ, 0 = none
  "name": "",                    // optional; default "<A> + <B>"
  "ov": { "vi": null, "en": null } // optional manual override of the composed text; null = auto
}
```

Combined price = Σ product price − discount. It is computed at copy time, so editing a product price updates the set.

### E.2 Auto-composed text

VI:
```
Set Lace Top + Lace Skirt · Kem ✨

• Lace Top (Trắng kem): 380.000đ
• Lace Skirt (Kem): 470.000đ
• Size: S, M, L
• Giá set: 800.000đ (tiết kiệm 50.000đ)
```

EN:
```
Lace Top + Lace Skirt · Cream set ✨

• Lace Top (Cream): VND 380,000
• Lace Skirt (Cream): VND 470,000
• Sizes: S, M, L
• Set price: VND 800,000 (you save VND 50,000)
```

Rules:
- **Colour** comes from `colorOf(p)`. EN colour comes from `VAR[...].en`, or from the `Color:` line of `descEn`. If no EN colour exists, the EN copy is blocked with "Chưa có bản EN" (§C.2).
- **Size line:**
  - Members share the same sizes → one line, `Size: S, M`.
  - Members differ → one line per member: `• Size áo: S, M · Size chân váy: S, M, L`. The labels come from `category` (top → "áo"/"top", skirt → "chân váy"/"skirt").
- **No discount** → `• Giá set: 850.000đ` with no parenthesis.
- **Lead-in:** uses the **info** lead-ins (same selection) because a set answer is product info.
- If `ov.vi` is set, it is used verbatim and a quiet "Đã sửa tay" note shows. "Dùng bản tự soạn" resets it.

### E.3 Creating a set in ≤ 3 taps

From the product sheet of product A (e.g. Lace Top):
1. Tap **"Khách hỏi set? Ghép với mẫu khác ›"**. A picker sheet titled "Ghép Lace Top với…" lists the complementary category first (top → skirts, skirt → tops), then the rest.
2. Tap **product B**. The set is created and saved immediately. The Set sheet opens with the composed preview, the lead-in chips and **"Chép set · VI"**.
3. Tap **"Chép set · VI"**: copied.

The Set sheet also has:
- A discount chip row: **[Không giảm] [−20.000đ] [−50.000đ] [Khác…]**. "Khác…" opens an inline numeric field.
- **"+ Thêm mẫu vào set"** for 3+ items.
- **"Sửa câu"** opens the override editor.
- **"Xoá set"** (destructive, with confirm).

The second door is **Câu trả lời khác → Set → "Tạo set"**. It opens a picker in multi-select ("Chọn 2 mẫu"), and the set is created when the second item is tapped: 3 taps.

### E.4 Where sets surface (never on home)

- **Search:** "set", "bộ", or a member's name.
- **Product sheet** of a member: one extra row under "Thông tin + bảng size", reading **"Set với Lace Skirt · 800.000đ"** with its own **[Chép · VI]** button. It is shown only when such a set exists, and at most 2 set rows appear; any more go to search.
- **Câu trả lời khác → Set.**

---

## F. Visual simplification

The brand tokens are unchanged (`design-spec.md` §7: Rosewood `--accent #9A5654`, linen `--bg-grouped`, cream cells, serif titles, dark mode). Only usage changes.

| Rule | Spec |
|---|---|
| **One accent fill per view** | Home: none, except the order bar's "Xem đơn" when present. Sheet: only the open action's primary copy button. Chips, links and selected states use `--accent-tint` or `--label`, never accent fill. Text links ("Sửa", "Ghép với mẫu khác") use `--label-2`, underlined on press. |
| **Surfaces** | Home has exactly **two** cell surfaces: the "Câu trả lời khác" row and the product list group. No tiles, no section cards for empty states. |
| **Dividers** | Hairlines only inside the product list (inset 68 pt) and between rows of the action stack. No separator under the nav. The large title scrolls away and the compact nav keeps the v1 material blur. |
| **Spacing** | 16 pt side gutter. 8 pt grid. Between blocks: 16 (title→search, search→hint), 24 (before list header). Rows are 60 pt for products and 52–56 pt for action and reply rows. Sheet content padding is 20 pt. |
| **Type hierarchy (4 levels only)** | Title: serif 30 (home) or 22 (sheet). Body: 17 (row names, buttons). Meta: 15 `--label-2` (price, colour). Caption: 13 `--label-2` (section caps, hint, lead-in state). Nothing else, no bold except on buttons (600). |
| **Product row** | Emoji disc 40, name and variant (17), swatch dot + price + colour (15 label-2), chevron (label-3). No badges, no glyph buttons. |
| **Greeting** | It stays as an eyebrow above the question, in the time-of-day copy from v1 `greeting()`: serif italic 15, `--label-2`. It is the only decorative text on home. |
| **Warnings** | Inside sheets only, as one 13 pt line with a 6 pt `--destructive` dot. No tinted pills. |
| **Order bar** | `--material-thick`, `--shadow-float`, radius 18. It floats 12 pt above the safe area, in the v1 tab-bar slot. Left: "Đơn · 2 món · 850.000đ" (15/17). Right: an accent button "Xem đơn". It enters with the v1 sheet spring and bumps on add. |
| **Dark mode** | Same rules, with the v1 dark tokens. |

---

## G. Build plan (for the implementer)

Work in this order. Each step should leave the app working. `python3 build.py` → `dist/`.

### G.1 `src/data.json`
1. Add `"leadIns"` with the seeds of §D.5, exactly as tabled. Keep `\n` out of seeds.
2. Add `"sets": []`.
3. Leave `flow` untouched. The greeting tiles move out of the UI, not out of the data.

### G.2 `src/index.src.html`
1. Delete `<nav id="tabbar">` and the floating search button. Delete `#tab-flow` and `#tab-order`, so only one `<main>` section `#home` remains.
2. Replace the nav header contents with the eyebrow, the title "Khách đang hỏi gì?" and the text button "Tuỳ chỉnh". Move `#q` (search) into the home flow as a static field.
3. Add `<div id="obar" hidden>` (order bar) in the old tab-bar slot.
4. Icon sprite: remove `hanger`, `text.bubble`, `clock` and `heart` if they are no longer referenced.

### G.3 `src/app.js`
**Delete:**
- `recentChips`, `renderRecents`, and their calls. Keep `commitRecent` writing state, minus the render.
- `tile`, `syncGreet`, `greetCtx`, the `gadd`/`gchip` handlers, and `toggleFav`.
- The favourites section, the `fav` action, the swipe module (`closeSw` IIFE), and the row long-press for products.
- `renderFlow` as a tab, `go()` tab switching, `observe()` tab sentinels, `refreshTab` tab logic, `ctxChipHtml` on home, and `langSeg` on home.
- The 3 placeholder Set entries (line `[1,2,3].forEach(… 'set-'+n …)`) and Settings → "Set" (placeholder list).

**Merge / move:**
- `renderMau` → `renderHome()`: header + search + hint + "Câu trả lời khác" row + product list. `pRow` loses its `cbtn`; the row gets `data-act="open"`.
- `renderOrder` → the body of `openOrder()` sheet (large detent). `updateBadge` → `updateOrderBar()`: show or hide `#obar` and set its text.
- `renderFlow` content → `openReplies()` sheet, grouped as §C.3 (map `n` 1→Chào/extra-photos, 2→Tư vấn size, 3→Giao hàng, 4 and 6→Sau khi chốt, minus `order-recap`, which lives in the Order sheet).
- `truncBox` / `missingLangBox` dialogs → inline states on the copy button (§C.2). Keep `dlgBox` for destructive confirms only.

**New:**
- `composeCopy(action, ref, l)` → `{ text, lead, fellBack, trunc, missing }`. A **pure** function: no DOM, no state writes. `action ∈ info|size|both|set|order|thanks`. Every copy path calls it, and the preview renders `.text` from it, which is the single source of truth for "preview = clipboard".
- `leadList(action, l)`, `leadSel(action, l)`, `setLeadSel(action, l, id)` (committed only after a successful copy, via `copy(..., {done})`), `addLead(action, l, text)`, `editLead(id, patch)`, `hideOrDeleteLead(id)`.
- `leadChips(action)`: the chip row HTML plus the inline add/edit field.
- `openProduct(id)` rewritten as the action stack (§C.1), with state `{ open: 'info' }`.
- `composeSet(set, l)`, `openSet(id)`, `openSetPicker(fromPid)`, and Set entries in `buildIndex`.
- The first-run hint, with `st.hintDone` set in `copy()`'s success path.
- A data migration in `load()`: `st.lead ||= {sel:{},custom:[],edits:{},hidden:[]}` and `st.sets ||= []`. Leave `favs`/`recents` alone.

### G.4 `src/app.css`
- Delete: `.tiles`, `.tile`, `.gline`, `#tabbar`, the tab-switch transitions, `.cbtn` on rows (keep `.cbtn` styles only if still used), the favourites and swipe styles, and badge pills in rows.
- Add: `.obar`, `.stack` (action stack), `.arow` (collapsed action row), `.lead` (chip row), `.leadfield`, `.hint`, `.qwarn` (quiet warning line), and `.btn.guard` (truncation second-tap state).
- Enforce one accent: selected chips use `--accent-tint`/`--label`, and secondary copy buttons use `--fill-3`/`--label`.

### G.5 `docs/`
- Add a banner to `design-spec.md`: "IA and §4.1–4.5 superseded by design-v2.md". No other doc changes.

### G.6 Acceptance criteria
1. On first launch at 393 × 852, the first viewport contains **≤ 7 interactive controls** (counting the product list as one) and **zero icon-only buttons** besides ✕ and ›.
2. No tab bar, no VI/EN on home, no Gần đây, no Yêu thích, no Set rows, no "Cần kiểm tra" pills on home.
3. **Product info = 2 taps** and **size chart = 2 taps** from home. **Info + size = 2 taps.** **Add to order = 2 taps.** **Copy order = 2 more taps** (bar → Chép đơn).
4. Every copy button label and every toast shows the language ("· VI" / "· EN").
5. The preview text equals the clipboard text for every action, lead-in and language combination.
6. A truncated text never copies on a single tap. A missing-language text never copies in the requested language. No modal dialogs on the copy path.
7. A set can be created and copied in ≤ 3 taps from a product sheet, and its text contains only product-derived fields.
8. Lead-ins can be added, selected, deselected, edited and hidden without opening Tuỳ chỉnh.
9. A fresh install has "Không kèm" selected for every action and language.

### G.7 Tests

**Unit: `tests/compose.test.mjs`** (Node `node:test`, no deps). Load `src/data.json` and import `composeCopy`. Expose it by moving the pure helpers into a small block that `build.py` inlines, and that can also be `require`d.

| Case | Expectation |
|---|---|
| info, lang vi, lead none | `text === clean(descVi)` |
| info, vi, lead li-info-3 | `text === "Soft gửi bạn thông tin mẫu ạ 🌷\n\n" + clean(descVi)` |
| info, en, lead li-info-3 | uses the EN string; never contains the VI lead |
| info, en, lead = custom VI-only line | the chip is not listed in EN; the EN selection is independent (`info:en` null) → no lead |
| size, vi, lead li-size-1 | `"Mình gửi bạn tham khảo bảng size nha\n\n" + sizeVi` |
| both, vi, info lead + size lead | `infoLead\n\ninfo\n\nsizeLead\n\nsize`; no `\n{3,}` anywhere |
| both, vi, info lead only | `infoLead\n\ninfo\n\nsize` |
| both, vi, size text empty | info part only, with no trailing blank lines |
| order, vi, lead li-order-1 | starts with `"Dạ Soft lên đơn cho bạn nha 🌷\n\nDạ vậy đơn của bạn 🌷"` |
| thanks, vi, lead li-thanks-1 | `"Soft nhận được rùi ạ\n\n" + thanks-rtw` (or thanks-custom when an order line is `madeToOrder`) |
| set, vi, discount 50000 | contains `Giá set: 800.000đ (tiết kiệm 50.000đ)`; no `{{` |
| set, vi, mismatched sizes | contains `Size áo:` and `Size chân váy:` |
| set, en, member lacks EN colour | `missing === 'en'` |
| truncated product (lace-top, descVi) | `trunc === true`; the text is still composed (the guard is UI) |
| lead text with trailing spaces and `\r\n` | normalised by `clean()` |
| every action × {vi,en} × {none, each seed} | `text` never starts with `\n` and never contains `\n\n\n` (generated loop) |

**UI: headless Chromium** (same harness as `shots/`), 393 × 852:
- Tap-count assertions, with taps counted as dispatched `click`s from the home state to a clipboard write. The clipboard is stubbed via `navigator.clipboard.writeText` capture:
  - info 2, size 2, both 2, add-to-order 2, order copy 4 (from home), set create+copy 3 (from the product sheet), size-advice script 3 (Câu khác → row → Chép, with ctx pre-fill).
- Preview equals clipboard: for each action, compare `#preview.textContent` (normalised) with the captured clipboard string.
- Lead-in stickiness:
  - select li-info-3 → copy → close → reopen another product: li-info-3 is selected.
  - select li-info-4 → close without copying → reopen: li-info-3 is still selected.
- Add a lead-in: "+ Thêm câu" → type → Lưu. The chip appears first and selected, the preview starts with it, and it survives a reload.
- Truncation guard: one tap on lace-top "Chép thông tin" → no clipboard write. A second tap within 3 s → write. A second tap within 400 ms → no write.
- Missing EN: the button is disabled, and "Chép bản VI" writes VI text with "· VI" in the toast.
- First-run hint is gone after the first copy and stays gone after a reload.
- The first viewport's interactive-element count (`button, a, input, [role=button]` that are visible and not inside the list group) is ≤ 6.
- Re-shoot `shots/393-01…` and `430-01…` for the new home, product sheet, lead-in add, set sheet and order sheet, in light and dark.

### G.8 Performance rules (no regressions against `design-spec.md` §11.1)
- **The copy path stays synchronous.** `composeCopy` runs inside the click handler, then `copy()`. No `await`, no render before `writeText`. Seal feedback in the same frame (≤ 16 ms).
- Selection persistence, recents and `st.hintDone` are written in `afterPaint`/`save()` (debounced), never before the clipboard call.
- The home renders **once** at boot: 13 rows plus 2 elements. Sheets render on open only. The Replies, Order and Set sheets are not pre-rendered. The order bar updates by text patch, not re-render.
- Chip toggles patch only the preview paragraph and the chip `aria-pressed`. They don't re-render the sheet.
- Budget: JS minified ≤ 25 KB and CSS ≤ 14 KB. Net code should **shrink**, because the tab system, swipe, favourites, recents UI and greeting tiles are deleted. Check `build.py`'s size report against the v1 numbers in `docs/fix-report.md`.
- Warm launch to interactive < 100 ms. INP ≤ 50 ms. Zero long tasks after load. `localStorage` growth for lead-ins and sets stays under 20 KB.
