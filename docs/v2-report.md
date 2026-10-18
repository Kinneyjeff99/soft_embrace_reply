# Design v2 build report

Build: `python3 build.py` -> `dist/`. Implemented per `design-v2.md`, plus the lead's follow-up from `docs/ig-reference/` (real lead-in phrases, bubble-by-bubble sets, post link, order total).
Tests: Node unit table (`node --test tests/compose.test.mjs`, 28 pass) and headless Chromium iPhone emulation at 393x852 and 430x932, light and dark (`tests/ui/ui.mjs`, 125 checks pass, scripts shipped in `tests/ui/`).
Note: Round 3 (end of file) replaces the v2 home, replies sheet and order sheet described in the tables below (no home list, no "Câu trả lời khác" sheet, no order sheet, tab bar and stage switcher are back by the founder's request).
Screenshots in `shots/` are v2 only (25 per size).

## Acceptance criteria (design-v2 G.6 and follow-ups)

| # | Criterion | Result | Evidence |
|---|---|---|---|
| 1 | First viewport at most 7 controls, no icon-only buttons except x and > | Pass | 3 controls outside the product list (Tuỳ chỉnh, search, hint x) plus "Câu trả lời khác" is inside the list group count, so at most 4 + the list. Zero unlabeled buttons, all targets at least 44 pt. |
| 2 | No tab bar, no VI/EN on home, no Gần đây, no Yêu thích, no Set rows, no "Cần kiểm tra" pills on home | Pass | Removed from DOM, CSS, JS. |
| 3 | Product info 2 taps, size chart 2, info+size 2, add to order 2, copy order 2 more | Pass | Click-counted (haptic label click excluded). Order: bar then "Chép đơn". |
| 4 | Language on every copy button and toast | Pass | Buttons end in "· VI/EN", toast "Đã chép · name · VI". |
| 5 | Preview equals clipboard for every action, lead-in, language | Pass | Exhaustive: info/size/both x every lead combination x VI/EN (70 combos), order and thanks leads VI/EN, set bubbles a/b leads VI/EN, set bubbles a-d exact strings. |
| 6 | Truncated never copies on one tap; missing language never copies in requested language; no modal on copy path | Pass | Guard: 1st tap arms, tap under 400 ms ignored, copy in 400 ms to 3 s, expiry after 3 s re-arms. Missing EN: disabled button, "Chép bản VI" copies VI and toast says VI. |
| 7 | Set created and copied in at most 3 taps from a product sheet; text only from product fields | Pass | Ghép (1), partner (2), "Chép · VI" on bubble 1 (3). |
| 8 | Lead-ins add, select, deselect, edit, hide without Tuỳ chỉnh | Pass | Add and reload survive, long-press menu Sửa/Xoá (seeds: Ẩn) with undo. |
| 9 | Fresh install has "Không kèm" everywhere | Pass | Unit test and UI. |
| 10 | Lead-in memory only after successful copy | Pass | Select li-info-3, copy, other product shows it; select another, close without copy, still li-info-3. |
| 11 | First-run hint gone after first copy and after reload; x dismisses | Pass | |
| 12 | Zero console errors, light and dark, with service worker | Pass | Separate run with the service worker enabled: installs, controls after reload, no warnings. (Playwright prints "SW registration blocked" only in the contexts where I block it on purpose.) |
| 13 | No horizontal overflow (home and product sheet), both sizes, light and dark | Pass | |
| 14 | Copy path performance | Pass | See numbers below. |
| 15 | Size-advice script 3 taps with context pre-fill | Pass | Câu khác, row, Chép (with context from the last added size). |
| 16 | Budget: JS <= 25 KB, CSS <= 14 KB minified | Fail | JS 85.1 KB, CSS 25.3 KB. The in-repo whitespace minifier does not rename identifiers and no real minifier is available offline. v1 was JS 73.5 KB. Net JS grew because v2 adds sheets, leads, sets, bubbles. dist/index.html 141.9 KB raw, 41.1 KB gzip (v1 133.4 / 38.3). Not "shrunk" as G.8 hoped. |

### Follow-up items from the founder material

| Item | Result |
|---|---|
| Real lead-ins, verbatim, marked `sheet`: IG01 (size lead), IG02 (measurement request, also a size lead-in), IG03 and IG04 (thanks leads), no English invented (en is empty) | Done. CS-sheet lines from v2 (li-info-1, li-info-2) stay `sheet`. Everything else stays `draft`. Unit test checks verbatim text and `seed`. |
| IG03 and IG04 as separate bubbles | Done in "Câu trả lời khác > Sau khi chốt": "Đã nhận (tin 1)" and "Cảm ơn (tin 2)" are separate rows. As lead-ins they still prepend to the thank text in one bubble (see deviations). |
| IG05 tracking: sentence, then separate empty-placeholder bubble | Done: "Gửi mã vận đơn (tin 1)" and "Mã vận đơn (tin 2)" (`{{trackingCode}}`, copy disabled until a code is typed, copies the code alone). |
| IG06 feedback | Done: "Xin hình feedback". |
| Sets as separate bubbles: (a) info of all members plus price line, (b) all size charts labelled by product, (c) IG02, (d) post link | Done. Each bubble has its own preview and "Chép · VI". The accent button moves to the next bubble after each copy. Bubble d only exists when a link exists. |
| Set price override, line "Giá lẻ 380.000đ + 470.000đ = 850.000đ → Giá set 800.000đ" | Done. Empty field means the sum. Bubble a adds "(tiết kiệm …)" only when the override is below the sum. |
| Sets saved, editable (price, link, add member, edit bubble 1 text, delete), reachable from search, member sheet, "Câu trả lời khác" | Done. |
| Suggested pairs (unsaved, price check required) | 6 pairs from her posts, listed in "Câu trả lời khác > Gợi ý ghép từ bài đăng". Creating one from there needs a second tap with "Kiểm tra giá set rồi chạm lại để chép" until "Đã kiểm tra" or the first copy. In the product-sheet picker they are sorted first with "hay ghép", and a set created there is treated as deliberate (no price guard). |
| `postUrl` per product, chip "Kèm link bài viết" off by default, editable | Done: Lace Top pre-filled with the IG07 link, appended after the info part (also in "cả hai"). "Sửa link" / "+ Link bài viết" inline, also in Tuỳ chỉnh > Mẫu. Others empty. |
| Order total = items + shipping | Already computed from items and shipping mode. Test: 420.000đ + 24.000đ = 444.000đ; the template's literal 25.000đ example is replaced. |

## Numbers (headless Chromium, 4x CPU throttle)

| Metric | Result |
|---|---|
| Copy click handler (synchronous clipboard call, seal class added) | median 1.8 ms, 1.0 to 2.5 ms warm, first cold click 7.8 ms. Under the 16 ms target. |
| Open product sheet, handler / to second frame | 15.7 ms / 31.4 ms |
| Haptic label click | 1 extra synthetic click per copy, excluded from tap counts |

## Deviations from design-v2.md

1. **Product sheet opens at the large detent**, not medium. At medium the collapsed rows' copy buttons and "Thêm vào đơn" fall below the fold, so size chart would need a scroll. Large keeps the wireframe whole and the tap counts true. All large sheets are fixed (drag to dismiss only).
2. **Lead-in memory** stores selection per action and language; the post-link chip is session-only (always off by default).
3. **Set sheet is bubble-based** (follow-up from the lead) instead of design-v2 E's single composed text, and the discount chips were replaced by the "giá set" override field. No "Giảm giá" chips, no EN text for the measurement bubble (her EN was not given, so EN shows "Chưa có bản EN").
4. Set heading colour ("· Kem") is no longer used because the set message now starts from each product's own description.
5. **Thanks lead-ins** (IG03, IG04) are single-select and send in one bubble with the thank text. For true separate bubbles use the two Replies rows above.
6. **Settings > Câu đệm** lets her edit, hide, restore and add lines, but there is no reorder.
7. "Gần đây" UI is removed but `st.recents` is still written (candidate ordering in fill rows). `st.favs` is ignored.
8. Cold-start Order sheet: the thank card is inserted at the top right after "Chép đơn" (v1 deferred it to avoid layout shift; here the footer button, which holds the seal, does not move).
9. Settings language row is now "Ngôn ngữ đang dùng" (same sticky value as the sheet segment) because language is sticky.
10. I did not add the superseded banner to `design-spec.md` (instruction: do not touch `docs/design-*.md`).
11. Budgets in G.8 (JS 25 KB, CSS 14 KB) missed, see criterion 16.

## Missing products (superseded by Round 2: all 20 products now exist)

Butter Top, Embroidery Pants, Fleur Slip Dress, Lace Trim Blouse. The suggested pair "Butter Top + Flowy Skirt" is therefore not listed. Her posts also mention Still Cami with Embroidery Pants (missing). Colour choices for suggested pairs are my reading and need her check: Still Cami Top uses the taupe variant (Flowy Skirt exists only in taupe), Soft Halter Top uses white with Lace Skirt cream, Shimmer Top uses Lace Skirt black. Lace Top + Lace Skirt uses cream.

## Known issues

- JS and CSS size budgets missed (above).
- (Resolved in Round 2: no description is truncated any more.)
- The set bubble "Xem hết" toggle re-renders the sheet, which drops an active seal highlight.
- Lead-in chips: a very long phrase is shown ellipsized (full text in the preview after selecting).
- Seed lead-ins marked `draft` and `li-info-1/2` EN strings are still ours and need her words.
- Playwright `serviceWorkers: 'block'` is used in most checks to avoid cache interference; SW behaviour is covered by one dedicated check only.

## Needs a real iPhone

- Haptic from the `<input switch>` trick after `writeText`, and clipboard permission behaviour in standalone mode.
- Long-press (450 ms) on a lead-in chip inside a horizontally scrolling row: scroll vs hold conflict, iOS callout suppression.
- Keyboard handling for the inline lead-in field, the set price field and search in the in-flow search field (the `--kb` padding).
- Sheet drag at the fixed large detent, scale-behind effect, safe-area insets (59 top / 34 bottom) on real devices.
- Service worker update and offline launch from the Home Screen, sub-path hosting.
- Pasting each bubble into Instagram: line breaks and emoji (including variation selectors) across IG DM.


## Round 2

Scope: full product sheet, real logo, brand palette. No commit made.

### 1. Product data (20 products, not 22)
`docs/source/CS_Flow_full.xlsx`, tab "Item description", has 20 data rows (13 old + Flowy Skirt cream, Lace Trim Blouse cream and blue, Embroidery Pants, Fleur Slip Dress blue and yellow, Butter Top). The brief said 22; the sheet has 20. `src/data.json` products were rebuilt from it (descVi, descEn, sizeVi, sizeEn, noteVi verbatim; only flattened " • " English bullets split into lines and outer whitespace trimmed). Prices are parsed from the "Giá" line (470.000đ and 470,000đ both give 470000); the text is untouched. Every `truncated` flag is removed (Noir Dotty Top, Ivory Dot Blouse, Ivory Dot Midi Skirt, Shimmer Top, Lace Top now have full text). Kept: flow entries, leadIns, Lace Top postUrl, empty `sets`. Added a `yellow` variant colour and swatches for Butter Top and Embroidery Pants. Categories `pants` and `dress` are new (only used to order partner suggestions).

Suggested pairs (unsaved, price check still required before copy): 9 now: Lace Top + Lace Skirt cream, Shimmer Top + Lace Skirt black, Butter Top + Flowy Skirt taupe, Still Cami Top taupe + Flowy Skirt taupe, Still Cami Top white + Embroidery Pants, Soft Halter Top white + Lace Skirt cream, Ivory Dot Blouse + Ivory Dot Midi Skirt, Noir Midi Skirt + Soft Halter Top white, Butter Top + Embroidery Pants (observed 390.000đ + 520.000đ). Colour choices are my reading of her posts (Still Cami + Pants uses white; the sheet has both colours) and need her check.

Source anomalies kept verbatim, for the founder to review:
- Embroidery Pants has no Note cell in the sheet, so `noteVi` is null; the length lives in the size chart (VI chart: S 94 cm under 1m6 / 97 cm over 1m6; EN chart says S length 97 cm only).
- Lace Trim Blouse blue: EN size chart (S 40-50 kg, height 155-163; M 50-60 kg) differs from the VI chart and from the cream variant (S 40-55, M 50-65).
- Fleur Slip Dress: both colours share one VI description ("Màu: Xanh/ Vàng"); the EN descriptions differ per colour. Dress-length Note is `noteVi` on both.
- Ivory Dot Blouse EN has a line without a bullet ("Fabric: Silk blend"), Ivory Dot Midi Skirt VI price uses a comma (470,000đ).
- Shimmer Top note ("v1 80 - v2 68 ...") is still an internal scribble copied as noteVi.

Truncation guard: no product depends on being truncated. App code is generic (`p.truncated` only). Unit tests use a synthetic flagged product; the UI tests serve dist with `"truncated":["descVi"]` injected into Lace Top at serve time (`tests/ui/lib.mjs`, `NO_SYNTH=1` disables), dist itself has no flags.

Home list and search with 20 products: one plain group (the chunk size is 20, so `.chunk` / `content-visibility:auto` is not used; the rule stays for bigger catalogues and is asserted). New `tests/ui/list.mjs` (46 checks): 20 rows, accent-insensitive search hits (butter, fleur, quan, dam, lace trim), no overflow, zero console errors, search handler under 1 ms at 4x CPU, to the second frame max about 50 ms at 4x.

### 2. Real logo
Brand PNGs viewed. `shots/icon-preview.png` compares four backgrounds (Baby powder, Jet, Liver, Dun) at 180, 60, 29 px. The thin double ring nearly vanishes at 29-60 px on Baby powder and Dun; Liver with a Baby powder logomark is crisp and distinct on a home screen, so it was chosen. All of `dist/icons/` rebuilt from `logomark-FA.png` (tight-cropped, Lanczos): `apple-touch-icon.png` 180 RGB without alpha, `icon-192`, `icon-512`, new `icon-maskable-512` (mark at 62 percent), `favicon.png` 64 (replaces the SVG, which was the old SE drawing; `icon-source.svg` removed), splash 1179x2556 and 1290x2796 (mark at 40 percent width). 16-colour quantisation, no dithering; edges stay crisp. Sizes: 18.8, 5.2, 20.1, 14.5, 1.2, 29.1, 30.9 KB. Manifest, SW shell list and `<link rel=icon>` updated. The in-app seal is unchanged (it never used an SE monogram). The logomark appears once, 18 px, in front of the home greeting (0.8 KB PNG data URI in CSS, inverted in dark mode); no new controls.

### 3. Brand colours (tokens only, `src/app.css`, manifest and theme-color)
Sampled from palette.png: Dun #C5B9A8, Jet #2A2B2A, Baby powder #FCFBF5, Liver #5F3E31, Vanilla #F2E7AB, Davy's Grey #4D5162, Chocolate cosmo #49121F, Old Rose #CC8C87.
Light: bg and cell Baby powder, grouped #F2EEE5 (Baby powder toward Dun), text Jet, secondary text from Liver/Jet #5E5048, accent Old Rose darkened to #A84E47 (same hue), pressed #93443E, destructive #B3261E. Dark: bg #181716, cell #242321, paper Jet, text Baby powder, secondary Dun-tinted #BDB3A8, accent Old Rose #CC8C87 with Jet button text, disc tint from Liver.

Contrast ratios (WCAG, text vs surface):

| Token | bg #FCFBF5 | grouped #F2EEE5 | sheet #F8F6EF | paper #FEFDFA |
|---|---|---|---|---|
| label #2A2B2A | 13.71 | 12.28 | 13.14 | 13.97 |
| label-2 #5E5048 | 7.46 | 6.68 | 7.15 | 7.60 |
| label-3 #6F635B | 5.61 | 5.02 | 5.38 | 5.72 |
| accent text #A84E47 | 5.27 | 4.72 | 5.05 | 5.37 |
| destructive #B3261E | 6.31 | 5.65 | 6.04 | 6.43 |
| success #4A6B47 | 5.81 | 5.20 | 5.57 | 5.92 |

Light buttons: Baby powder on accent 5.27, on pressed 6.46; accent text on accent-tint 4.58.

| Dark token | bg #181716 | cell #242321 | sheet #1E1D1C | paper #2A2B2A |
|---|---|---|---|---|
| label #FCFBF5 | 17.27 | 15.15 | 16.23 | 13.71 |
| label-2 #BDB3A8 | 8.68 | 7.61 | 8.16 | 6.89 |
| label-3 #9A9186 | 5.77 | 5.06 | 5.42 | 4.58 |
| accent #CC8C87 | 6.54 | 5.73 | 6.15 | 5.19 |
| destructive #F08A80 | 7.38 | 6.47 | 6.93 | 5.86 |
| success #9CB898 | 8.29 | 7.27 | 7.79 | 6.58 |

Dark buttons: Jet on accent 5.19, on pressed #DDA39E 6.64; accent on its tint (7 percent) 4.64 on paper, 5.16 on cell. The dark tint was lowered from 16 to 7 percent so accent text on it passes 4.5. label-4 (placeholders, disabled) is decorative and below 4.5 by design, as before. Product swatch dots are product colours, unchanged.

### Results
- Node unit tests: 29 pass (synthetic-flag guard tests, 20-product data checks, 9 suggested pairs).
- Playwright `tests/ui/ui.mjs` at 393x852 and 430x932, light and dark: 125/125 pass; `tests/ui/list.mjs`: 46/46. Zero console errors, no horizontal overflow.
- Taps from home: product info 2, size chart 2, info+size 2, add to order 2, copy order 2 more, set 3 from the product sheet, size-advice script 3 (all asserted and passing).
- Copy handler at 4x CPU: median 1.9 ms (12 runs, first 10.9 ms, all under 16 ms). Product sheet open handler 17.7 ms, to second frame 36.5 ms at 4x.
- dist: index.html 150.2 KB raw / 43.5 KB gzip (css 26.6, js 85.2, data 28.8); whole dist about 275 KB including icons and splashes. JS/CSS budgets from G.8 are still missed (unchanged cause).
- Shots in `shots/` regenerated (v2 screens, 25 at 393 and 430 wide, plus icon-preview.png). Shot 10 uses the synthetic truncation flag.

### Needs a real device
Home Screen icon crispness at 60/29 px and the apple-touch-icon corner masking, the splash on iPhone 15/16 sizes, Liver icon against her other apps, dark-mode accent on an OLED, and the 18 px greeting logomark.


## Round 3

Scope: founder feedback A (editable, internally scrolling boxes), B (new information architecture with 5 stages), C (brown removed from the brand colours). No commit made. Superseded screens in `shots/` are replaced; the shots show the current app only (27 per size plus `icon-preview.png`).

### A. Editable preview boxes
- Every box that shows text before copying is now a `<textarea>` (16 px so iOS does not zoom, `spellcheck/autocorrect/autocapitalize` off): product info, size chart, info + size, the 4 set bubbles, every quick-reply message, and the order message. No "Xem hết" expander exists any more.
- Fixed `max-height: min(36vh, 300px)`; the box grows with its text up to that height, then scrolls inside. The sheet and the page never grow (asserted with 40 extra lines).
- The clipboard gets exactly what is in the box (the same `composeCopy` text when untouched, the typed text otherwise). Collapsed product rows ("Chép" next to Bảng size, Thông tin + bảng size) also copy typed text. Preview == clipboard is still asserted for every lead combination, VI and EN, sets and order.
- Under each box a quiet 44 pt row. Before an edit it only says "Chạm vào khung để sửa trực tiếp". After an edit it shows "Đã sửa", "Khôi phục" and "Lưu làm mẫu". The row has a fixed height, so nothing jumps when it changes.
- Khôi phục drops the typed text. Lưu làm mẫu persists it for that item and language: product info / size chart become `descVi/descEn/sizeVi/sizeEn` overrides (so it also resolves a truncation flag); a quick reply becomes `ov[id].vi/en` and placeholders that are still in the text are turned back into `{{item}}`, `{{size}}`, `{{itemInfo}}`... (`untemplate`); the order message becomes the order template with `{{orderLines}}` and `{{total}}` restored, so it still follows quantity and shipping (tested); set bubble 1 uses the existing set override, bubbles 2-4 use new per-set `bov`. The lead-in and the appended receiver/bank/link parts are stripped before saving, so they are not baked into the template.
- Typing never re-renders anything: the input handler only updates the edit flag and the textarea height (rAF-throttled). 4x CPU: median 1.0 ms, max 4.7 ms per keystroke; copy handler median 1.7 ms (first click 8.7 ms), message sheet copy 0.2 ms.
- Keyboard: `visualViewport` resize sets `--kb` on the root and `body.kb`. The app and the sheet layer shrink to the area above the keyboard, the dock is hidden while it is open, and every primary Chép button is outside the scrolling body: product sheet and message sheet in a sticky footer, set sheet in a footer that follows "next bubble" plus a Chép button next to each bubble title, order composer in a sticky footer with the total. Sheets are all full-height and fixed (no detent change on focus), so the sheet does not jump. Tested with a fake `visualViewport` (336 px): Chép bottom stays above the keyboard, sheet top unchanged, copy works while "typing".

### B. Information architecture
- Top-level: a two-tab bar at the bottom ("Câu trả lời nhanh" | "Thông tin sản phẩm", 48 pt), thumb reachable at 393 and 430; first screen is always Câu trả lời nhanh. Above it, only on Câu trả lời nhanh, the stage switcher: 5 equal 56 pt buttons with a step number, labels exactly "Chào hỏi", "Tư vấn size", "Xin thông tin", "Tạo đơn", "Check out" (words wrap as whole units, so no scrolling is needed at 393 or 430). The last used stage is remembered (`st.ui.stage`); a badge on "Tạo đơn" shows the item count.
- Header: logomark + "Soft Embrace", VI/EN switch (44 pt each) and one text button "Tuỳ chỉnh". First-run hint is one line.
- Only the selected stage's content is shown, as large cards. One tap opens a full-height message sheet with the editable box and Chép.

| Stage | Primary cards | Behind "Thêm" |
|---|---|---|
| Chào hỏi | Khách mới, Khách cũ, Gửi thông tin mẫu (chip row of all 20 products; tap opens the product sheet on Thông tin) | none |
| Tư vấn size | Xin số đo (IG02 sentence), Gửi bảng size (chip row, opens on Bảng size), Vừa size, Giữa 2 size | Khách cần cân nhắc, Quá size có/không có mẫu khác, Quá nhỏ |
| Xin thông tin | Xin thông tin giao hàng, Hỏi địa chỉ để báo phí ship | Gửi thêm hình / link |
| Tạo đơn | The order composer (below) | none |
| Check out | Đã nhận thanh toán (IG03), Cảm ơn · gói đơn (IG04, with Có sẵn / May đo variants, default by the order's made-to-order flag), Gửi mã vận đơn tin 1 (IG05), Mã vận đơn tin 2 (code only, copy blocked until typed), Xin hình feedback (IG06) | Lời chúc kèm (tuỳ chọn), Nhắc chính sách đổi trả (attachment reminder), Đã nhận (ngắn), Cảm ơn gộp 1 tin |

- Tạo đơn is a first-class stage, not a sheet: 1 · items (lines with size chips, quantity, delete; search + the 4 most recent products with size chips), 2 · shipping, 3 · receiver info (optional, paste button), bank switch, 4 · the generated "Dạ vậy đơn của bạn 🌷 …" message in an editable scrolling box with lead-in chips, a line confirming the transfer-note instruction is in the text, and a sticky footer with the live total and Chép đơn. After copying, a card offers to jump to Check out. The order bar (after "Thêm vào đơn") stays and jumps to this stage; it hides while you are on the stage.
- Thông tin sản phẩm: "Theo mẫu" (20 products, accent-insensitive search) and "Theo set" (saved sets, "Tạo set mới", 9 suggested pairs). Set sheets keep separate bubbles with custom "giá set".
- Greeting product slot: the greeting sheets have an optional "Kèm thông tin mẫu" row ("Không kèm" by default = greeting only, as before); choosing a product appends its info after the greeting.
- Placeholders in a reply (`{{size}}` etc.) now show as `[size]` in the box; Chép stays disabled ("Điền n chỗ nữa") while a marker is still in the text, filled by the chips below or by typing over it.

### C. Colour (brown removed)
No Liver (#5F3E31) and no brown-derived tint, grey or shadow remains in the UI, icons, splash, manifest or meta tags (unit test greps for the old values). Used: Dun #C5B9A8 (surfaces only), Jet #2A2B2A, Baby powder #FCFBF5, Old Rose #CC8C87 (darkened to #A84E47 for text/buttons, pressed #93443E, same hue). Greys are Jet at fixed opacity (light: label-2 #545553, label-3 #666765, fills rgba(42,43,42,.06-.20)); light surfaces are Baby powder mixed with Dun (grouped #EEEAE2, sheet #F6F4ED). Dark is Jet-based: bg #202020, cell Jet #2A2B2A, sheet #252625, paper #343534, text Baby powder, accent Old Rose with Jet button text. Shadows and scrims are black or Jet.

Contrast (WCAG, text on surface):

| Light token | bg #FCFBF5 | grouped #EEEAE2 | sheet #F6F4ED | paper #FEFDFA |
|---|---|---|---|---|
| label #2A2B2A | 13.71 | 11.85 | 12.92 | 13.97 |
| label-2 #545553 | 7.23 | 6.25 | 6.81 | 7.37 |
| label-3 #666765 | 5.49 | 4.74 | 5.17 | 5.59 |
| accent text #A84E47 | 5.27 | 4.55 | 4.96 | 5.37 |
| destructive #B3261E | 6.31 | 5.45 | 5.94 | 6.43 |
| success #4A6B47 | 5.81 | 5.02 | 5.48 | 5.92 |

Light buttons: Baby powder on accent 5.27, on pressed 6.46; accent on accent-tint 4.58.

| Dark token | bg #202020 | cell #2A2B2A | sheet #252625 | paper #343534 |
|---|---|---|---|---|
| label #FCFBF5 | 15.72 | 13.71 | 14.65 | 11.88 |
| label-2 #C4C4C0 | 9.31 | 8.13 | 8.68 | 7.04 |
| label-3 #A2A29E | 6.36 | 5.55 | 5.93 | 4.81 |
| accent #CC8C87 | 5.95 | 5.19 | 5.55 | 4.50 |
| destructive #F08A80 | 6.71 | 5.86 | 6.26 | 5.08 |
| success #9CB898 | 7.54 | 6.58 | 7.03 | 5.70 |

Dark buttons: Jet on accent 5.19, on pressed 6.64; accent on its 7 percent tint 4.64 (cell), 4.97 (sheet). label-4 (placeholders, disabled) is decorative and below 4.5 by design.

Icons and splash: rebuilt by `tools/make_icons.py` from `brand/logomark-FA.png`, Jet background, Baby powder logomark (home-screen 180 px with no alpha, 192, 512, maskable 512 at 62 percent, favicon 64, splash 1179x2556 and 1290x2796). Contact sheet at 180/120/60/29 px, maskable, favicon, splash and on a dark wallpaper: `shots/icon-preview.png` (viewed: the double ring stays legible down to 60 px; at 29 px it reads as a ring with the S). The 18 px header logomark is now an alpha mask coloured by `--label`, so it is Jet in light and Baby powder in dark with one image. Manifest: `background_color` Jet (matches the splash and icons), `theme_color` Baby powder; `theme-color` meta Baby powder (light) and #202020 (dark).

Product swatch dots keep each product's real colour (taupe #A8968A in `compose.js` is the garment colour "Taupe"; the beige cream/shimmer dots are product colours too). They are data, not UI colour. A hue/saturation scan of every hex in `src/` and `build.py` finds only that taupe.

### Tap counts (asserted, 393 and 430)
| Action | Taps |
|---|---|
| Greeting (Khách mới/cũ) from app open | 2 (card, Chép) |
| Product info from app open | 2 (chip in Chào hỏi, Chép) |
| Size chart | 2 once on Tư vấn size (chip, Chép), 3 from app open including the stage tap; from Theo mẫu 2 on the row (+1 for the tab) |
| Theo mẫu product info | row, Chép = 2 (+1 to switch tab) |
| Size-advice script with context | 2 on the stage (+1 stage tap) |
| Order: stage open, first item added, message "Dạ vậy đơn của bạn" generated | 2 from app open; Chép đơn is the 3rd |
| Add to order from product, jump to order | Theo mẫu: tab, row, size chip, close, "Xem đơn" |
| Set created and bubble 1 copied from a product sheet | 3 |

### Results
- Node unit tests: 39 pass (new: STAGES shape and placement, IG02 phrase, isEdited, strip/untemplate, order template round trip, set `bov`, brown grep).
- `tests/ui/ui.mjs` (Playwright, 393x852 and 430x932, light and dark where relevant): 335 of 335 pass (393x852 and 430x932, light and dark: stage switcher, one stage at a time, order in 2 taps, editable boxes, internal scroll, Khôi phục, Lưu làm mẫu, keyboard emulation, tap counts, copy and typing handler at 4x CPU); zero console errors, no horizontal overflow, service worker installs and controls.
- `tests/ui/list.mjs`: 46 of 46 pass (list and search now behind the tab).
- dist/index.html about 173 KB raw (css 35 KB, js 94 KB, data 29 KB). The G.8 size budgets are still missed (same reason as before).

### Deviations and decisions made for the founder
1. Reply search was dropped: the stages replace it. Search exists only in Theo mẫu (products).
2. Stage and tab bar sit at the bottom (thumb reach); the order bar sits above them.
3. Size chart is 2 taps once on Tư vấn size, not 2 from app open (the stage must be selected first). Product info is 2 from app open because Chào hỏi is the first stage.
4. An upstream change (lead chip, language, fills, order lines or receiver info) regenerates the text and drops what she typed, with a "Hoàn tác" toast. Edits are kept only for the open sheet or stage session, not stored.
5. "Lưu làm mẫu" is not offered for "Thông tin + bảng size" (it cannot be split reliably); the row says to open Thông tin or Bảng size.
6. A saved set bubble no longer follows product text or set price; a "Dùng bản tự soạn" link resets it.
7. "Xin ảnh/link": the data has no customer-facing request for photos or links, so "Gửi thêm hình / link" sits under Xin thông tin > Thêm and "Xin hình feedback" under Check out.
8. Thank-you lead chips and the "Khách đã chuyển khoản?" card of the old order sheet are replaced by the Check out stage; the lead-in data and `thanks` compose action are kept.
9. Ask-measurements text in `data.json` is now the IG02 sentence verbatim (it matches the set bubble 3 and size lead-in 2).
10. Message sheets still close 0.6 s after a successful copy (unchanged).

### Needs a real iPhone
- Caret placement, selection handles, autocorrect off and the Vietnamese IME (telex) inside the textareas; whether iOS scrolls the focused box far enough above the keyboard (the layout is tested only with an emulated `visualViewport`).
- `visualViewport` offsetTop behaviour when Safari pans the page on focus, and the 80 px threshold that separates the keyboard from the toolbar.
- Nested scrolling (box inside sheet, sheet drag) feel; the sticky order footer inside the scrolling stage.
- The 5-button stage switcher with Dynamic Type larger text; the stage badge.
- Home-screen icon on Jet, the splash, and the header mask logomark at 18 px in dark mode.
- Haptics, clipboard permission in standalone mode, service worker update and offline start (unchanged from earlier rounds).
