# Soft Embrace Reply v6: independent acceptance audit

Auditor: independent product/design review (judgment and traceability). Automated regression/UAT runs are in `docs/qa/qc-report.md` (separate agent) and are not repeated here.
Build audited: `main` @ `c0122ff` (equal to `origin/main`, checked with `git ls-remote`). `src/`, `build.py`, `dist/` and `tests/` were not modified.
Method: read all of `src/compose.js`, `src/app.js`, the tokens in `src/app.css`, `build.py`, `dist/sw.js`; compared `src/data.json` with `docs/source/CS_Flow_full.xlsx` (openpyxl, `data_only=True`, `python3 -I`) and `docs/ig-reference/instagram-message-references.md`; viewed 25+ screenshots in `shots/` (393 and 430, light and dark, v6, host frame, SE 375, keyboard) and a contact sheet of all 20 product photos; ran my own Playwright probes against `dist/` (Chromium `/opt/pw-browsers/chromium`, `NO_SYNTH=1` so no synthetic truncation flag) for composition, text scaling, target sizes, keyboard occlusion and a 4x CPU trace.

---

## 1. Verdict

**Ready to ship: YES, with conditions.** No P0 found. The copy path is safe in the founder's normal VI flow: preview equals clipboard, the language is printed on every copy button, unfilled `[size]`/`[món]` blanks block copying, and prices, sums and the 444.000đ example are correct.

Ship after these 4 P1 fixes (each under an hour):
1. **P1-1** On Tạo đơn, the total/Chép đơn dock covers the "Thông tin nhận" textarea while the keyboard is open.
2. **P1-2** The EN measurement request copies the literal placeholder `[bust / waist / hip]` to the customer.
3. **P1-3** The Flowy Skirt **taupe** photo shows a mauve/pink skirt with a fishtail hem (the cream variant's cut). It probably shows the wrong product.
4. **P1-4** Shipping defaults to "Khách trả shipper" after every "Khách mới", so the total excludes shipping unless she changes it. R14 says the shipping fee is included in the total.

The founder also needs to sign off on two deliberate v6 deviations from her written requirements: **R23** (no helper subtitle on Trả lời nhanh screens) and **R30** (card previews are clamped behind "Xem hết · N dòng" and edited in a sheet, not edited in place). See section 3.

---

## 2. Data fidelity (checked by me, not taken from reports)

| Check | Result | Evidence |
|---|---|---|
| 20 products: descVi, sizeVi, noteVi, descEn, sizeEn against sheet "Item description" | **Pass.** VI text is byte-exact for all 20. EN text is equal after whitespace normalisation: the sheet's one-line EN bullets were reflowed onto separate lines, and no words changed. | Script comparison: `descVi` EXACT 20/20, `sizeVi` EXACT or trailing-space only, `noteVi` EXACT or strip-equal. |
| Price field = "Giá:" line in VI and EN | **Pass** 20/20 | regex over descVi/descEn vs `price` |
| Flow entries vs sheet "Overview (RTW)" | **Pass with 2 intended deviations.** (a) `ask-measurements` VI uses her IG02 sentence instead of the sheet line "Nếu bạn cần tư vấn thêm, cho mình xin số đo…". This follows R11. (b) `fit-size` drops the sheet's literal example chart and uses `{{sizeChart}}` (documented in `note`). Check out adds IG03 to IG06 as `paid-ack`, `paid-thanks`, `tracking-note`, `ask-feedback`. | `src/data.json:483`, `:502` |
| IG01 to IG07 verbatim | **Pass.** IG01 = `li-size-1`, IG02 = `ask-measurements`.vi, `setMeasure`.vi and `li-size-2`, IG03 = `paid-ack` and `li-thanks-1`, IG04 = `paid-thanks` and `li-thanks-2`, IG05 = `tracking-note`, IG06 = `ask-feedback`, IG07 = Lace Top `descVi` + `postUrl` `https://instagram.com/softembrace.made/p/DUQkDk6kTDg/`. All character-identical, including emoji. | `src/data.json` flow + leadIns |
| Set Lace Top + Lace Skirt (cream) | **850.000đ** (380 + 470) | `composeCopy('set', …, bubble a)` gives "• Giá set: 850.000đ" |
| Butter Top + Embroidery Pants | **910.000đ** (390 + 520). Override 850.000 gives "(tiết kiệm 60.000đ)". | same |
| Order 1 × Lace Trim Blouse cream M + ship 24.000 | **444.000đ** VI and "Total: VND 444,000" EN | `orderText`, `src/compose.js:75-86` |
| Category counts | Tất cả 20 · Áo 11 · Váy 6 · Đầm 2 · Quần 1 (correct by hand count). Counts are hidden below 414 px (`.seg .n` at `app.css` `@media(max-width:413px)`), so the 393 phone shows no counts. | shots `393-light-03`, `430-dark-v6-06` |
| Collection labels | Fall 25 (6), Spring 26 (4), Summer 26 (10), derived from the sheet row order `released`. **Inferred, not verified.** She must confirm. | `src/data.json` `collection` |
| Image ↔ product (all 20 viewed in a contact sheet) | 18 match. **Flowy Skirt taupe**: the photo is a mauve/lilac skirt with a fishtail flounce, but its VI description says "dáng A suông" (fishtail is the *cream* variant: "đuôi cá nhẹ"). The `tint` `#A88292` is pink. **Lace Skirt cream**: the photo reads peach/salmon on screen (could be lighting); confirm. Ivory Dot Blouse: dots visible in the source, OK. | `assets/product-images/flowy-skirt-taupe.webp`, `tools/make_images.py:24`, `src/data.json:275-291` |
| Internal inconsistencies **in the source sheet** (copied faithfully, so EN and VI customers get different numbers) | Noir Dotty Top S waist VI 62-66 / EN 60–66. Ivory Dot Blouse VI eo 62-66 / 66-72, EN 62–68 / 68–72. Flowy Skirt taupe VI cạp 68-72 / 72-76, EN 70–74 / 74–78. Lace Trim Blouse blue VI 40-55 kg / 50-65 kg, EN 40–50 kg + height 155–163 / 50–60 kg + 163–170. Embroidery Pants S VI gives two lengths (94/97 cm by height), EN gives only 97 cm. Fleur Slip Dress yellow VI says "Màu: Xanh/ Vàng". | numeric diff of sizeVi vs sizeEn |

---

## 3. Requirements traceability (R01–R51)

Legend: **Met** / **Partly** / **Not met** / **NV** (not verifiable here). Tests: `compose` = `tests/compose.test.mjs`; `r6` = `tests/ui/round6.mjs`; `r5` = `round5.mjs`; `r4` = `round4.mjs`; `ui` = `ui.mjs`; `dupes` = `dupes.mjs`.

| ID | Verdict | Evidence (code · tests · screenshots) | Note |
|---|---|---|---|
| R01 | Met | Stages + cards `src/compose.js:292-300`; copy `src/app.js:96-117` · r6 "whole common flow … = 14 taps" · `393-light-v6-03` | |
| R02 | Partly | Home → stage 1 tap, copy 1 tap (`app.js:220-232`, `cardCopy 1237`) · r6 §10 tap counts | Too many options on screen for a non-expert: "Câu khác (4)", 3 greeting variants, lead-in rows, Sửa, Xem hết. The common path is short but the screens are dense (see P2-6). |
| R03 | Partly | Segmented controls, sheets with detents, switches, SF stack, 44 pt targets (my scan: 0 visible targets under 44×44 on home, greet, order, list, product sheet) | **No Dynamic Type**: every font size and 65 line-heights are fixed `px` (`app.css`), so iOS text size settings are ignored. See P2-1. |
| R04 | Met | Vanilla/Jet/Davy's Grey tokens `app.css:1-60`; serif titles; microcopy "Chỉnh một lần, dùng mãi nhé." · compose "no brown token", "Old Rose and brown are gone" | One copy issue: the set guard says the price is "lấy từ bài đăng" when it is the retail sum (P2-4). |
| R05 | Partly | Shots at 393×852 / 430×932 · r5 safe-area · my 4x trace: boot long task 95–175 ms, Home→stage tap handler **49 ms** (one cold run) | v6-report: picker open 50–60 ms warm (budget 40), strip tap ~11 ms (budget 8), gzip +11.9 KB (budget +8). "Instant/no flicker" cannot be verified without a real iPhone (NV part). |
| R06 | Met | Dark token block `app.css` `@media(prefers-color-scheme:dark)`; logo inverted · shots `*-dark-*` viewed (checkout, product sheet, ship sheet, search empty) | Parity good. In dark mode the done-stage ✓ and the "2" badge crowd each other on "4 Tạo đơn" (`393-dark-v6-17`), a cosmetic issue. |
| R10 | Met | Section 2 above · compose "full product sheet: 20 products, none truncated…" | The VI/EN discrepancies come from the sheet itself (risk register). |
| R11 | Met | Section 2 above · compose "ask-measurements is the IG02 sentence verbatim", "seed lead-ins: her verbatim IG phrases…" | IG07 link only on Lace Top (`postUrl`). |
| R12 | Met | `setBubble` a/b/c/d `compose.js:128-162`; set sheet per-bubble Chép `app.js:1532-1587` · compose "set bubble a/b/c/d" · `430-light-06-set-sheet` | In EN, bubble c has no text (`setMeasure.en = ""`), so the "Chép tin 3/4" sequence in EN stops with "Chưa có bản EN" (P2-7). |
| R13 | Met | `setPrice` `compose.js:115`; helper `app.js:1515-1519` · compose "custom set price override + saving note" | |
| R14 | Partly | Maths correct (444.000đ verified) `compose.js:50-86`; instruction line present and checked `app.js:723-726` | Default ship mode `courier` (`app.js:25`, reset again at `app.js:625`) gives "Tổng cộng là 850.000đ" with no shipping in the total (`393-light-v6-13`). P1-4. |
| R15 | Met | Lead-in picker with "Thêm câu mới" / "Lưu và dùng" `app.js:1113-1131`; default = none `compose.js:101-107` · compose "fresh install: nothing is pre-selected" | |
| R16 | Partly | `newest()` `compose.js:311` · compose "default sort is newest first…" | Labels are inferred (NV until she corrects them); "newest" assumes sheet row order = release order. |
| R20 | Met | 5 stages + Theo mẫu/Theo set `compose.js:292-300`, home `app.js:220-232` · compose "STAGES: exactly the 5 stages…" | |
| R21 | Met | `393-light-02-home`, resume row `app.js:214-218` · r4 "Home to any stage … in 1 tap" | |
| R22 | Met | Capsule + round "Đơn" `index.src.html` `#fbar`; `--bar-y` `app.css` · r5 safe-area · `393-host-frame-light`, `430-debug-insets-overlay-dark` | Real-device position NV. |
| R23 | Partly | Gear + real logo met. Subtitle on Home, Sản phẩm and sheets. | **No subtitle on Trả lời nhanh stages**: `STAGES[].desc` is defined (`compose.js:293-298`) but never rendered. Dropped on purpose in `docs/design-v6.md:27`. Needs founder sign-off. |
| R24 | Met | `tools/make_icons.py` PICK "B"; manifest background `#F2E7AB` `build.py` · compose "manifest background is Vanilla; apple-touch-icon…" · `shots/icon-preview.png` | |
| R25 | Met | Primary `#4D5162` / dark `#F2E7AB`; red only for destructive · compose "no brown…", "red only used through --destructive" | Brown appears only inside product photos (Still Cami taupe), which is acceptable. |
| R30 | Partly | Product sheet and set sheet: editable textareas, copied text = box (`app.js:995-1011`, `fullText 988`) · ui "editable boxes, internal scroll". | **Trả lời nhanh cards** are a read-only `.pv` clamped to 3/8/10 lines with "Xem hết · N dòng" (`app.js:462-466`, `558-565`; `app.css:482`). Editing opens a sheet. This contradicts "no show all expander / directly editable". On Tạo đơn the clamp hides the bank-transfer line that will be copied (`393-light-v6-13`). Deliberate per design-v6; needs sign-off. |
| R31 | Met | Photo rows, category segmented, color + category subline `app.js:667-687` · r4 photos 168/320 no 404 · `393-light-03` | One taupe photo is wrong (P1-3). |
| R32 | Met | `setRow` pair photos `app.js:654-658` · r4 "set rows with two photos" | |
| R33 | Met | No carousels; strips are fixed 4+1 cells · r4 "vertical swipe starting on a chip row scrolls the page" | |
| R34 | Met | Product sheet segmented Thông tin/Bảng size/Cả hai, single box, round avatars · `393-dark-04` | The header subtitle truncates ("380.000đ · Trắng k…"), and the "BẠN MUỐN GỬI" caption sits 4 pt under the 56 pt avatar (P2-9). |
| R35 | Partly | Icon+verb buttons ("⧉ Chép · VI", "✎ Sửa", "Dán", "Đổi ⌄") everywhere | "Khách mới" means two different things on one screen: the reset button (eyebrow) and the greeting variant segment (P2-5). "Chạm hai lần để sửa" in the aria-label vs single tap in reality. |
| R36 | Met | Sheet re-entry guard `app.js:793-797`; `assertUnique` `app.js:1968-1998` · dupes (fuzz 200 taps), compose "v6 sources: no pushSheet without the re-entry guard…" | |
| R37 | Met | Order stage renders message first `app.js:730-742` · r6 "message first: preview top ≤ 340" · `393-light-v6-13`, `375-se-order-empty` | |
| R38 | Met | Unified picker with grid, search, filter, recents, "Set hay hỏi" `app.js:1349-1459` · r6 picker checks · `393-light-v6-04`, `430-dark-v6-06` | Picker empty search has no "Xoá tìm kiếm" button (the old picker does). Minor. |
| R39 | Partly | Visual quality is high in all viewed v6 shots | Keyboard occlusion on Tạo đơn (P1-1). Typed card edits are not persisted (P2-8). Density (R02). |
| R40 | Partly | Language on every capsule/footer (`app.js:474-480`, `1188`); missing language blocks + "Chép bản VI" (`app.js:469`, `1145`); `[token]` blocks copy (`compose.js:16-20`, `app.js:376-377`, `477`); unchecked set price double-tap guard `app.js:1563-1564`; stale context caption after 2 h `app.js:396-397` · r6 token/disabled checks | **Gap:** the guard recognises only the app's own token words, so the sheet's EN placeholder `[bust / waist / hip]` copies to customers (P1-2; compose test "…is not a blank" asserts this behaviour on purpose). The stale-context caption is hidden on Tạo đơn (`paintCtxBar` hides the bar on order), so old lines can be copied in an order with no warning. |
| R50 | Met / NV | `origin/main` = `c0122ff` | GitHub Pages enablement needs her action in Settings → Pages (NV here). |
| R51 | NV | Out of scope by definition | Needs a Claude Desktop session on her computer. |

---

## 4. Findings

### P1 (fix before handing to the founder)

**P1-1 Keyboard: the order dock covers the receiver field.** Screen: Tạo đơn, "Thông tin nhận (tuỳ chọn)", typing.
Evidence: `shots/430-order-receiver-keyboard-dark.png` shows the yellow-ringed textarea under the dock. My probe (430×932, fake 336 pt keyboard): textarea y 504–596, dock y 524–588, overlap = true. The cause is `src/app.css:566` `body.kb #odock{bottom:8px}`, which keeps the dock above the keyboard and on top of the focused field. v2-report promised "the dock is hidden while [the keyboard] is open".
Fix (`src/app.css:566`):
```css
body.kb #odock{display:none}
```
Or, to keep Chép đơn reachable while typing:
```css
body.kb #odock{bottom:8px}
body.kb [data-in=info]{scroll-margin-bottom:96px}   /* scrollIntoView({block:'nearest'}) in app.js:1725 honours it */
body.kb .ostage{padding-bottom:96px}
```

**P1-2 A wrong-text risk: an EN placeholder is copied to customers.** Screen: Tư vấn size (EN) → "Kèm câu xin số đo", the "Xin số đo" card, set bubbles in EN.
Evidence: `src/data.json:483` `ask-measurements.en` = "…Could you send us your [bust / waist / hip] measurements…". `composeCopy('sizes',{ask:true},'en')` returns that text with `pending: []`, so it copies freely. The TOKRE whitelist is at `compose.js:18`.
Fix: (a) data, `flow[ask-measurements].en`: `"We’d be happy to help with sizing too. Could you send us your bust, waist and hip measurements and height? We’ll take a look and suggest the best fit."` (b) A general safety net in `compose.js` `finish()`: treat any remaining `/\[[^\]\n]{1,40}\]/` in generated text (not in her typed edits) as `pending` with the key `'blank'`, and map `NEEDV.blank = 'Điền chỗ trống'`. Update the compose test at line 520 accordingly.

**P1-3 Product photo mismatch: Flowy Skirt taupe.** Screens: Sản phẩm list, picker, strips, set "Butter Top + Flowy Skirt taupe", "Still Cami taupe + Flowy Skirt taupe".
Evidence: `assets/product-images/flowy-skirt-taupe.webp` shows a mauve/pink satin skirt with a fishtail flounce. The VI description for taupe says "dáng A suông"; fishtail ("đuôi cá") belongs to the cream variant. The derived `tint` `#A88292` is pink. She picks products by photo (R38), so this can make her send the wrong product's info or price.
Fix: the founder supplies the correct taupe photo. Replace the file and run `python3 build.py`, which regenerates `dist/img` and the tint. Until then, ask her to confirm. Lace Skirt cream (peach-looking photo) needs the same check.

**P1-4 Shipping missing from the total by default.** Screen: Tạo đơn.
Evidence: `app.js:25` and `app.js:625` reset `ship:'courier'`, so a fresh order reads "• Shipping: khách trả shipper / Tổng cộng là 850.000đ" (`393-light-v6-13`). Her real recap (OBS03) shows 420.000 + 24.000 = 444.000 collected. R14 says shipping is included in the total.
Fix: remember her last choice across customers.
```js
// app.js:625 (newCustomer)
st.draft = { lines: [], ship: st.set.lastShip || 'courier', custom: st.set.lastCustom || 0, info: '', bank: true, copiedAt: 0, done: {}, at: 0 };
// app.js:1890 (case 'shippick')
mutate(function () { st.draft.ship = v; st.set.lastShip = v; });
// app.js:1956 ([data-in=custom]) also: st.set.lastCustom = st.draft.custom;
```
Then ask her which mode is her real default. If she always collects the fee, use `'fee'` with `st.set.fee`.

### P2 (polish; can follow in v6.1)

| # | Screen | Evidence | Fix |
|---|---|---|---|
| P2-1 Dynamic Type | All | Fixed px fonts and 65 fixed px line-heights. My text-only ×1.41 simulation: lines collide (`.pv` `line-height:21px` at `app.css:480`), "Chép đơn · VI" overflows the dock, "Xin thông tin" wraps to 3 lines inside the stage segment, nav "Trả lời nha…". The clamp maths hard-codes 21 px (`app.js:561`). | Phase 1: replace px line-heights with unitless (`.pv{line-height:1.4}`) and read `parseFloat(getComputedStyle(pv).lineHeight)` in `measureClamps`. Phase 2: `html{font:-apple-system-body}` and rem sizes, capped with `clamp()` for the capsule and segmented controls. |
| P2-2 SW staleness | First launch after an update | `dist/sw.js` is cache-first for navigations too, so the first open after a deploy runs the old app; the toast "Có bản mới — đóng và mở lại app nhé" shows only on `controllerchange` (`app.js:2023`). | In `build.py` SW fetch: `if (r.mode==='navigate') return e.respondWith(fetch(r).then(x=>{caches.open(CACHE).then(c=>c.put('index.html',x.clone()));return x;}).catch(()=>caches.match('index.html')));` before the cache-first branch. |
| P2-3 Sheet VI/EN discrepancies | Product sheet EN, sizes EN | Section 2 list | Show the list to the founder and fix it in the sheet, then in Tuỳ chỉnh → Mẫu or in `data.json`. Do not "correct" silently. |
| P2-4 Misleading set guard copy | Set sheet from "Gợi ý ghép" | `app.js:1537` "Giá set lấy từ bài đăng, chưa kiểm tra." The price is actually the sum of retail prices (`compose.js:115`). | "Giá set đang = tổng giá lẻ. Kiểm tra lại trước khi gửi." |
| P2-5 Two meanings of "Khách mới" | Trả lời nhanh → Chào hỏi | Eyebrow reset button `index.src.html` `#newcust` + greeting segment "Khách mới" `app.js:519`. See `430-light-v6-20` (toast "Đã sang khách mới" right next to the segment). | Rename the reset to "↺ Khách khác" (and the end button to "Xong · Sang khách khác"), or rename the variants "Lần đầu / Quay lại / Chỉ thông tin". |
| P2-6 Density for a first-time user | Chào hỏi, Tư vấn size | Hero card = segmented + clamped preview + Xem hết + Sửa + Chép + strip caption + 5 photos; the strip sits under the floating capsule at rest (`393-light-v6-03`, `-08`). | Hide "Xem hết" when the card has no selected product; move the strip above the preview when the context is empty. |
| P2-7 EN set sequence stalls | Set sheet EN | `setMeasure.en = ""` (`src/data.json:821`) → bubble c "Chưa có bản EN" and no alt button (`app.js:1545`) | Add an EN measurement sentence (same as the P1-2 text) or drop missing bubbles from `setVis` (`app.js:1520`). |
| P2-8 Typed edits are not persisted | Any "Sửa" on a card; tracking code; sequence ✓ | `CED`/`FILL`/`SEQ` live in memory only (`app.js:250-251`); `st` is saved, these are not. iOS can evict the PWA while she is in Instagram. | Add `ed: CED, fill: FILL, seq: SEQ` to `st.draft` (cleared by `newCustomer`) or flush them into `st` in the `pagehide` handler (`app.js:37`). |
| P2-9 Product sheet header | Product sheet | `393-dark-04`: subtitle truncated "380.000đ · Trắng k…"; caption "BẠN MUỐN GỬI" 4 pt under the avatar | Put price and colour on two lines, or drop the size list from the subtitle (`app.js:1193`); add `margin-top:12px` to that caption. |
| P2-10 EN size chart glued to the sentence | Vừa size / Giữa 2 size, EN | "…for reference: • S: bust…" all on one line | `fit-size.en`/`between-sizes.en`: "Here’s the size chart for reference:\n\n{{sizeChart}}" |
| P2-11 Sheet alternatives copied verbatim | Vừa size VI, Quá size VI | "thoải mái/vừa vặn", "smocking/form dáng suông-rộng thoải mái/co giãn" are her sheet's options, and they reach customers with the slashes | Ask her: split them into variants or keep them. |
| P2-12 Stale context on Tạo đơn | Tạo đơn | The context bar (with "Từ N giờ trước · vẫn khách này?") is hidden on the order stage (`app.js:404`) | Show a one-line notice above "Món trong đơn" when `Date.now()-st.draft.at > 2h`. |
| P2-13 Screen-reader duplicate | Product sheet note | `app.js:1183` reads "Ghi chú nội bộ: Ghi chú nội bộ (không gửi cho khách): …" | Remove the `<span class="vh">Ghi chú nội bộ: </span>`. |
| P2-14 Stale version label | Tuỳ chỉnh | `app.js:1628` "Soft Embrace · 2.0" | "Soft Embrace · v6". |
| P2-15 Picker empty state | Chọn mẫu, search miss | `app.js:1385` has no "Xoá tìm kiếm" (the old picker has one at `app.js:1482`) | Add the same button with an action that clears `data-pkq`. |
| P2-16 Perf over budget | Home → stage, picker | My 4x trace: boot `ParseHTML` 175 ms + `EvaluateScript` 163 ms (cold), tile→stage click handler 49 ms, first copy click 16 ms; headless open→first copy ≈ 0.7 s wall including two scripted taps. v6-report: picker open 50–60 ms warm (budget 40), strip tap ~11 ms (budget 8), gzip +11.9 KB (budget +8). | Render only the active stage's cards at boot (`renderStage` is called during boot at `app.js:2017` even though Home shows first); defer `renderPI()` to `idle()`. |

Checked and found fine: reduced motion (`app.js:8`, `app.css:412-416`); focus moves into sheets and returns to the opener (`app.js:818`, `850`); Tab trap in sheets (`app.js:895-899`); every visible control has an accessible name (0 unnamed in my scan); 0 visible targets under 44×44 on 5 screens; no horizontal overflow at ×1.41 text; contrast tokens tested (`compose` "contrast light/dark"); empty states have actions (`375-se-order-empty`, `430-dark-v6-06`).

---

## 5. Risk register

| Risk | Kind | Likelihood / impact | Mitigation in app | Remaining action |
|---|---|---|---|---|
| EN placeholder `[bust / waist / hip]` sent | Wrong text | Med / Med | none (P1-2) | Fix data + general bracket guard |
| Wrong product photo (taupe skirt) leads her to send the wrong info | Wrong text | Med / High | Name + colour under every photo | Founder confirms photos (P1-3) |
| Sheet VI vs EN size numbers differ | Wrong text | High for EN customers / Med | none (faithful copy) | Founder fixes the source sheet |
| Unpicked alternatives "thoải mái/vừa vặn" sent | Wrong text | Med / Low | Visible in preview | Founder decision (P2-11) |
| Previous customer's lines used in a new order | Wrong text | Low / High | "Khách mới" + undo; stale caption after 2 h (not on Tạo đơn) | P2-12 |
| Total without shipping | Wrong amount | Med / Med | Ship row visible | P1-4 |
| Typed card edits / tracking code lost when iOS kills the PWA | Data loss | Med / Low | Edits are short-lived | P2-8 |
| "Khôi phục nội dung gốc" wipes `st.ov` + lead-ins (confirm dialog, **no undo, no automatic backup**) `app.js:1920` | Data loss | Low / High | Confirm dialog | Export a backup automatically into `st.bak` before wiping, or offer Hoàn tác |
| Export in standalone iOS PWA (`a[download]` blob, `app.js:1921-1923`) may open a viewer with no way back, or do nothing | Data loss | Unknown / Med | Import exists | Test on the iPhone (UAT step 9); fallback: `navigator.share({files})` |
| Import replaces everything with minimal validation (`typeof j.ov==='object'`) | Data loss | Low / Med | Confirm dialog | Validate `ov` keys against product/flow ids |
| localStorage cleared (iOS storage pressure, reinstalling the icon) | Data loss | Low / High | none | Remind her to export after editing templates |
| Service-worker cache serves the old version on the first open after deploy | Staleness | High / Low | Toast on controllerchange | P2-2 |
| Instagram DM limit "~1,000 chars" | Unverified assumption | ‑ | Not split; extension point `compose.js:213-215`. A 4-product greeting = 982 chars (measured). | Test one long greeting on her phone |
| `navigator.clipboard.readText()` in the home-screen app (Dán buttons) | Unverified assumption | iOS shows a "Dán" callout that needs an extra tap; denial falls back to focusing the field (`app.js:612-619`, `1282`) | OK by design | Confirm the feel on the device |
| `writeText` after async work | Unverified | Copy is synchronous from the click (`app.js:110-113`) | fallback sheet "Chép tay" | Confirm on the device |
| Collection labels Fall 25 / Spring 26 / Summer 26, newest = sheet row order | Inferred | ‑ | Labels editable only in data | Founder corrects |
| Size chart notes (Shimmer "v1 80 - v2 68…", Lace Skirt "Xin số đo eo ngang rốn…") are internal and correctly never copied | ‑ | ‑ | `noteVi` shown as an internal note only | none |
| Haptics via `<input switch>` click (`app.js:74`) | NV | iOS 18+ only | silent elsewhere | device |
| Safe areas, floating bar height, keyboard behaviour, 120 Hz smoothness, splash images | NV in the cloud | ‑ | Emulated (`r5`, CDP insets) | UAT on the iPhone |

---

## 6. Founder UAT on her iPhone (10 minutes)

Before starting: open the GitHub Pages link in Safari, choose Share → Add to Home Screen, then open the app from the icon. Dark mode can be on or off.

1. **Opening (30 s).** Tap the icon. *You should see:* the Vanilla icon with the Jet mark, then Home with the script logo at the top. No white flash in dark mode. The bar floats above the home line, not touching it and not too high.
2. **Greeting with two products (1 min).** Tap "Bước 1 · Chào hỏi" → "Chọn" → tap Lace Top and Lace Skirt · Kem → "Xong · 2 mẫu" → "Chép · VI". Paste into a test Instagram chat (to yourself or a friend). *You should see:* the greeting, then both product infos separated by a blank line, exactly as in the app. Note whether Instagram accepted it as one message (this checks the ~1,000-character limit).
3. **Size charts (1 min).** Tap "2 Tư vấn size" → "Chép · VI". *You should see* both charts in one message, each under its product name. Switch "Kèm câu xin số đo" on, switch the header to **EN**, and look at the preview. *Before the P1-2 fix* you will see "[bust / waist / hip]"; after the fix it should read "bust, waist and hip". Switch back to VI.
4. **Photos (1 min).** Tap Sản phẩm → scroll through all 20 photos. *Check:* every photo is the product and colour named under it. Pay attention to **Flowy Skirt · Taupe** and **Lace Skirt · Kem**. Also check that the collection headers (Summer 26 / Spring 26 / Fall 25) are right.
5. **Set (1 min).** Theo set → "Gợi ý ghép" Lace Top + Lace Skirt. *You should see* "Set · 850.000đ". Type 800000 in Giá set. *You should see* "Giá lẻ 380.000đ + 470.000đ = 850.000đ → Giá set 800.000đ". Tap Chép tin 1 twice (the first tap only arms it), then paste: it should show both infos and "• Giá set: 800.000đ (tiết kiệm 50.000đ)".
6. **Order and keyboard (2 min).** Tap the round "Đơn" button. Set sizes M and S. Tap "Phí ship" → Khác… → 24000 → Xong. *You should see* the total change to items + 24.000đ. Open "Thông tin nhận", tap into the box and type an address. *Check:* while the keyboard is open, can you still see what you type, or does the "Tổng / Chép đơn" card cover it? (Expected to fail before P1-1.) Tap Chép đơn and paste. *You should see* the Instagram-name transfer instruction.
7. **Paste permission (30 s).** Copy any text in Notes, come back, and tap "Dán". *You should see* the iOS "Dán" bubble once, and the text lands in the field.
8. **Check out (1 min).** Tap "5 Check out" → Chép tin 1, then Chép tin 2, and paste both. *You should see* "ui dạ mình nhận được rùi ạ" and then "cảm ơn bạn nhìu, Soft sẽ tranh thủ gói đơn gửi đến bạn ạ 💗" as two messages. Paste a tracking code into "Mã vận đơn" with Dán.
9. **Backup (1 min).** Tap the gear → "Xuất bản sao lưu (.json)". *Check:* iOS offers to save the file to Files, and you can get back to the app afterwards. (This is unverified in the cloud.)
10. **New customer and update (1 min).** Tap "Xong khách này · Khách mới". *You should see* everything cleared and a "Hoàn tác" toast; tap Hoàn tác and everything returns. Close the app from the app switcher and reopen it. *You should see* the same state (language, context). Also note whether the shipping choice went back to "Khách trả shipper" (P1-4).

Report anything that differs from "You should see", with a screenshot.

---

## 7. Commands and probes I ran (reproducible)

- Spreadsheet comparison: `python3 -I cmp.py <repo>` (openpyxl, `data_only=True`); the numeric VI/EN diff used the same approach.
- Compositions: `composeCopy` through `window.__SE` (set a/b/c/d, order 444.000đ, greet EN, sizes EN with ask, fit EN).
- Text scaling: every element's computed font-size ×1.24 and ×1.41 at 393×852 (home, greet, order, list, product sheet), checked for clipping and overflow, with screenshots.
- Targets and names: visible `button,input,textarea,[role=tab|radio]` on 5 screens at 430×932.
- Keyboard: `fakeVV` 336 pt with the receiver textarea focused; measured rects of textarea and `#odock`.
- Perf: 5 cold runs at `Emulation.setCPUThrottlingRate 4`, plus a Chromium trace of run 1 (EventDispatch/ParseHTML/EvaluateScript durations).
