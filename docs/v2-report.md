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

## Round 4

Scope: founder feedback after testing round 3 on her iPhone: (1) one floating navigation capsule and a Home screen, (2) gear icon and the real logo in the header, (3) contextual subtitles on every screen, (4) set rows that show the two products, (5) newest-first product order with collections, (6) no more swipeable carousels, (7) a clearer product list with photos and category filters, (8) lighter icon, splash and chrome. No commit made. `shots/` holds the current screens only (29 per size plus `icon-preview.png`).

### Changes
- **Navigation.** The docked two-level bars are gone. There is one `<nav id="fbar">`: a translucent, blurred capsule floating above the home indicator (64 pt, fully rounded ends, 16/20 pt side margins, `Trang chủ · Trả lời nhanh · Sản phẩm`) and a separate 64 pt round button on its right that opens Tạo đơn and carries the item-count badge. 3 items in the capsule + 1 round button = 4 targets. The stage switcher moved into the Trả lời nhanh header as a 5-column segmented control (equal columns, words wrap whole, no scrolling, sticky under the title, badge on Tạo đơn). The old "Xem đơn" bar is replaced by the round button; in Tạo đơn the total + Chép đơn footer is a floating card sitting just above the capsule (it never hides behind it). The keyboard hides the capsule as before.
- **Home** (first screen, always): greeting by time of day, then 5 large stage tiles (2 columns, Check out full width; each has a number, name and a short description) and 2 product tiles with photo pairs (Theo mẫu, Theo set). No lists. Any function is reachable with 1 tap; the tiles and the capsule are the same one-tap targets from everywhere.
- **Header.** Real logo (`dist/img/logo.webp`, wordmark only, 405x84 px, 7.0 KB, shown 28 pt tall; a single black-on-transparent file, inverted by CSS in dark mode), VI/EN switch, and a gear icon button (44 pt, `aria-label="Tuỳ chỉnh"`) replacing the text button.
- **Subtitles.** A one-line helper text under every screen title: Home "Chạm một ô để bắt đầu nhé.", each stage keeps its existing line ("Khách vừa nhắn lần đầu hoặc quay lại." ... "Chọn món, phí ship, rồi chép tin chốt đơn."), Theo mẫu "Chọn mẫu, rồi chạm Chép thông tin hoặc size.", Theo set "Ghép hai món thành một set cho khách.", picker and settings sheets too. The first-run hint "Chọn bước, chạm tin nhắn, rồi chạm Chép." stays (dismissible).
- **Theo set.** Every set row (saved and suggested) shows two overlapping 56 pt photos, both names on two lines and the combined price (suggestions: sum, marked "gợi ý"). The set sheet opens with the two 320 px photos, names and prices side by side with a "+" between.
- **Theo mẫu.** Default order is newest first by an explicit `released` field; `collection` gives quiet section headers ("Summer 26 · 10", "Spring 26 · 4", "Fall 25 · 6"). Variants of one product share a `released` value and keep their sheet order (Fleur Xanh before Vàng).
- **Carousels removed everywhere.** `.chips` and the lead-in chip rows now wrap; no element in the app has `overflow-x: auto/scroll` (asserted on all three screens). The greeting and size chooser shows 3 product chips + "Mẫu khác…", which opens the picker sheet (photos, search, Tất cả/Áo/Váy/Đầm/Quần). Lead-in chips wrap to full width and read as a short pick list. No `touch-action: pan-x` scroller was needed, so a vertical swipe starting on any chip scrolls the page or sheet (tested with a real CDP touch sequence), and a horizontal swipe on the chip row moves nothing.
- **Product list.** Instagram-follower style row: 56 pt round photo, bold name, grey "price · colour" line, quiet category tag (Áo/Váy/Đầm/Quần) and chevron. Filter chips `Tất cả 20 · Áo 11 · Váy 6 · Đầm 2 · Quần 1` (one row at 393 and 430, 44 pt, search respects the filter). Variant rows show the base name and the colour in the grey line.
- **Photos.** `tools/make_images.py` maps all 20 files in `assets/product-images/` to product ids (soft-halter-white to soft-halter-top-white, still-cami-taupe to still-cami-top-taupe, fleur-slip-blue to fleur-slip-dress-blue, and so on; the script asserts the map covers all 20 exactly once), crops a square with a per-garment vertical bias (about 0.45 to 0.62 of the height, so garments show and faces mostly fall out) and writes 168 px (3.1 KB average, 5.5 KB max) and 320 px (8.2 KB average, 19 KB max) WebP. Images are `<img loading="lazy" decoding="async" width height>` inside a fixed-size circle with the photo's average colour behind it. The 320 size is used in the product sheet header, set sheets and the picker/order thumbnails use 168. Photos are never inlined.
- **Light chrome.** Light surfaces are brighter (grouped #F8F6F0, cells #FFFEFB, sheet #FBFAF5), separators and fills softer, bar and row icons use a soft grey (#7B7C79 light, #A2A29E dark) or the accent, and the near-black toast is now a light card in light mode (dark mode unchanged). No brown token was added (the unit test still greps the sources).

### Decisions made on her behalf
1. The app always opens on Home (not on the last screen); the last stage is still remembered and reopened by "Trả lời nhanh".
2. The order bar became the round button; the total is on the button's accessible label, not shown as text. The Tạo đơn footer carries the live total.
3. Capsule label "Trả lời nhanh" and "Sản phẩm" (short for Thông tin sản phẩm); the Home section keeps the longer name.
4. 3 recent/newest product chips + "Mẫu khác…" instead of 4 chips (wrapping would be too tall). The default chips are now the newest products (Butter Top, Fleur Xanh, Fleur Vàng) until she uses others.
5. Lead-in chips wrap instead of scrolling; each long chip may take a full line.
6. Variant rows in the list show "Fleur Slip Dress" twice, distinguished by photo and colour; sheet, picker, order and set names still use "Fleur Slip Dress · Xanh".
7. Wordmark only for the logo (the stacked monogram would be unreadable at 28 pt).
8. `released` is one number per product in sheet order (14 values); newest first means descending.
9. Search results ignore collection headers and respect the category filter.

### Inferred collections (she should correct these)
Inferred from `docs/ig-reference/instagram-posts.json` (post dates and captions) and the sheet row order; the data field is `collection` in `src/data.json`:
- **Fall 25**: Soft Halter Top (white, blue), Noir Dotty Top, Ivory Dot Blouse, Ivory Dot Midi Skirt, Noir Midi Skirt (posts from Oct to Nov 2025).
- **Spring 26**: Shimmer Top, Lace Top, Lace Skirt (cream, black) (Feb 2026 posts "mùa xuân").
- **Summer 26**: Still Cami Top (white, taupe), Flowy Skirt (cream, taupe), Lace Trim Blouse (cream, blue), Embroidery Pants, Fleur Slip Dress (blue, yellow), Butter Top ("Our first summer ... new pieces, coming this June").
The Soft Halter Top and Lace Skirt also appear in an April 2026 post, so Halter could be argued as Spring. Her sheet order was used for `released`, so only the labels would change.

### Icon candidates (shots/icon-preview.png, viewed at 180 / 120 / 60 / 29 px, on light and dark wallpaper, maskable and splash)
A Old Rose #CC8C87 + Jet (picked), B Vanilla #F2E7AB + Jet (runner-up), C Baby powder + Old Rose dark, D Old Rose + Baby powder, E Vanilla + Old Rose dark, F Dun + Jet (reads brownish, rejected). Why A: Jet on Old Rose has about 5:1 contrast so the thin double ring survives at 60 px and still reads at 29 px; it is clearly warmer than the old Jet tile; Baby-powder-on-rose (D) is the weakest (about 2.6:1). Runner-up B is brighter and more summery but yellow-cream next to the white wallpaper looks washed out. Thin lines are thickened slightly at small sizes (before downscaling). Manifest `background_color` is now #CC8C87 (matches icon and splash), `theme_color` stays Baby powder; the apple-touch icon is 180 px without alpha. To switch: change `PICK` in `tools/make_icons.py` and `background_color` in `build.py`.

### Numbers
- Unit tests: 45 pass (new: image map covers all 20 and files exist, newest-first sort and collections, category counts and filter, no inlined bitmaps, SW precache list, manifest brightness).
- `tests/ui/ui.mjs` 333/333, `tests/ui/round4.mjs` 202/202 (393x852 and 430x932, light and dark: Home, one floating bar with 3+1 items and no docked bars, rounded translucent capsule, logo loaded and 28 pt, gear opens settings, subtitle on every screen, Home to any stage or product view in 1 tap, set rows with two photos, newest-first order, section headers, filter counts and tags, all 20 photos load with no 404 at 168 and 320, CLS below 0.01, no horizontal scrollers, vertical swipe starting on a chip row scrolls the page and a lead-in chip scrolls the sheet, horizontal swipe moves nothing, zero console errors), `tests/ui/list.mjs` 46/46.
- Tap counts (asserted, from Home): greeting 3 (tile, card, Chép), 2 inside Chào hỏi; product info in Chào hỏi 2 (chip, Chép); Theo mẫu info 2 from the list (row, Chép), 3 from Home; size chart 3 from Home (tile, chip, Chép); order created and message generated 2 (Tạo đơn tile, size chip), Chép đơn is the 3rd. The count is honest: the extra tap to leave Home is included.
- Performance at 4x CPU: copy handler median 1.6 to 2.7 ms (first click up to 9 ms); typing median 0.9 ms; list scroll with photos 171 frames, 0 frames over 33 ms, 0 over 50 ms, p95 16.8 ms; search handler median under 2 ms.
- Sizes: dist/index.html 177.7 KB raw (49.9 KB gzip: css 35.0, js 99.2, data 30.3); dist/img 41 files, 234 KB precached (168 px: 63 KB for 20, 320 px: 164 KB for 20, logo 7 KB). Service worker installs all of it (offline start shows the photos, tested). The G.8 size budgets are still missed for the same reason as before.

### Needs a real iPhone
- Whether the capsule's blur and the order footer card above it feel light enough over the list; the 64 pt capsule height against the home indicator on 15 Pro Max.
- Lazy image decoding while flinging on a real GPU; photo crops (a few show a face edge or a skirt hem: Flowy Skirt taupe appears mauve in the source photo).
- The wordmark logo at 28 pt on a retina screen in light and dark.
- The new home-screen icon and splash on the real wallpaper; iOS caches icons, remove and re-add the app to see it.
- Lead-in chips as a wrapped list in the product sheet (is it too long?) and the 5-column stage control at larger Dynamic Type.
- Everything listed under Round 3 (IME in textareas, keyboard layout, nested scroll feel, clipboard permission, SW update).

## Round 5

Scope: `docs/design-v5.md` implemented in full (P0 to P4). No commit made; `docs/design-*.md` untouched. `shots/` holds the current screens only: 27 per size and mode (393 and 430, light and dark, shot as a home-screen app with 59/34 insets), the safe-area wrapper simulations, `icon-preview.png` (117 files).

### Changes
- **Icon (P0).** `PICK = "B"`: Vanilla #F2E7AB tile, Jet logomark (11.37 : 1). Icons, splash (Vanilla ground), `apple-touch-icon` with a baked 1 px inner edge (rounded, corner pixel stays Vanilla), manifest `background_color` #F2E7AB, `shots/icon-preview.png` marks B as picked.
- **Single-source insets (P0).** `measureInsets()` (boot, `resize`, `orientationchange`, `visualViewport.resize` when no field is focused, `hashchange`) writes `--inset-t` / `--inset-b`; it is 0 when framed, when `#app` was shrunk by a host, or when `#inset-b=0&inset-t=0` is in the hash. `--bar-y = max(inset-b - 10, 12)`, `--bar-top = bar-y + 60`; `.tab`, `#toast`, `.ofoot`, `.shf`, `.shb.pad`, `.sheet` top and `#fbar` all derive from them. `html`, `body`, `.app` paint `--bg-grouped`. No `100vh`, `--safe-*` deleted, the CSS has no `env()`, `dist/index.html` has one probe (`grep -c "env(safe-area" dist/index.html` = 1). `#debug=insets` overlay (sat, sab, framed, shrunk, innerHeight, screen, visualViewport, --inset-b, --bar-y, ctx). While the keyboard is open the insets are not re-measured (the shrunk app is not mistaken for a host box).
- **Colour (P0).** Tokens replaced by spec 2.2 and 2.3. Primary action Davy's Grey #4D5162 (light) / Vanilla #F2E7AB (dark); Old Rose gone from every token, glyph, badge and test; red only on Xoá, errors and the copy-failure toast icon; selected states are a raised thumb, a filled radio, a check, a tinted nav pill (no coloured outline). Dark `--bg` #1C1D1C, text boxes #333433, photos get a 0.5 pt ring.
- **Nav.** Order button is a clipboard-list glyph + "Đơn" + neutral count badge (`aria-label` "Đơn hàng, 3 món, 1.240.000đ"); bar 60 pt, items with tinted pill; `aria-current` replaces `aria-pressed`.
- **Product sheet (P1).** No accordion. Segmented Thông tin | Bảng size | Cả hai ("Bạn muốn gửi"), dropdown row "Câu mở đầu / Không kèm / Đổi ⌄", one always-visible box "TIN SẼ GỬI · …" with "✎ Sửa" and an edited row (● Đã sửa, ↺ Khôi phục, Lưu làm mẫu), highlighted strip with ✕ at the top of the box, one footer primary that follows the segment ("Chép thông tin · VI" / bảng size / cả hai). Separate labelled sections: Gửi kèm (link switch or "Thêm link bài viết"), Thêm vào đơn (＋ S/M/L capsules + "Trong đơn: …"), Set có mẫu này (nav rows + "Ghép set với mẫu khác"), a grey ⓘ note. Edits live per part (`info`, `size`), survive segment switches, and now also survive an opening-line change (the strip is separate from the textarea). Clipboard of a box = strip + blank line + textarea; `Cả hai` = the two parts in one outer box. The sheet opens on the segment last copied from (and preset to Bảng size from Tư vấn size).
- **Opening-line picker (P1).** Medium sheet with radio rows, full sentences, "✎ Sửa" per row (inline VI/EN editor, Lưu, Huỷ, Ẩn/Xoá câu này), "＋ Thêm câu mới" ("Lưu và dùng"); the strip arrives with a 220 ms expand and a 1.2 s Vanilla flash (none under reduced motion). The long-press menu is removed (every action has a visible button).
- **Set sheet (P2).** 72 pt circle pair, notice with "Đã kiểm tra", price and link fields (52 pt) with helper text, "Gửi lần lượt n tin · Đã chép k/n", bubble cards (16 padding, 16 gap, 12 between box and button, button in its own row right-aligned), one "Tiếp theo" card with ring and tag, ✓ and "Chép lại tin n" after a copy, scroll to the next card, footer "Chép tin 2/4 · VI" then "Đã chép đủ 4 tin".
- **Affordance sweep (P3), every screen.** Home tiles (step disc, "Bước n", ›, live "· 2 món"), stage screens (eyebrow "Trả lời nhanh · Bước n/5", title = stage name, segmented stage control with thumb, message cards with quoted preview and "Mở để xem và chép", product cards as photo rows + "Tìm mẫu khác…", "Câu khác (n)"), message sheet (✎ Sửa, dropdown rows for product, segmented size, segmented variants), Tạo đơn (＋ size capsules, "Trong đơn", ship segmented, Dán tonal, switch row, dropdown + strip, line editor sheet instead of the inline expander, "Đơn còn trống" empty state), Sản phẩm (title = view, one segmented category filter, category merged into the grey line, "＋ Tạo set mới" first row), pickers (segmented filter, ✓ row, "Không kèm"), settings ("Câu mở đầu", tags Câu của bạn / Câu gợi ý / Đã ẩn, "Xong" in accent), dialogs and toasts. First-use teaching: copy tip for the first 3 copies (`st.tips.copy`), "Xem đơn" on the add-to-order toast, first-open hint in the dropdown ("Không kèm — chạm Đổi để thêm câu chào"), empty states with an action (empty order, empty search "Xoá tìm kiếm", empty sets list).
- **Service worker.** Cache name is now `se-v5-<hash>`; the old `se-*` caches are deleted on activate. Precache list unchanged (41 images, icons, shell).

### Deviations from the spec (and why)
1. **Product sheet box top is 335 pt, not 311** (430 and 393). The "✎ Sửa" button keeps a real 44 pt row above the box instead of overlapping it; segmented 163-207, dropdown 223-279 and footer top 825/745/594 match the table (asserted within 4 pt). With the 280 pt cap the "Gửi kèm" header is still above the footer at 430 and 393.
2. **Sheet footer bottom padding is `inset-b + 12`** (not `max(inset-b,12) + 8`) so the footer tops match the budget table (826 / 746 / 595).
3. **The first-open hint wraps to two lines below 380 pt** (SE); at 393 and up it is one line. The dropdown row is 56 pt everywhere except that one hint state on SE.
4. **Root-padded wrapper without an iframe** keeps the app full-bleed (fixed), so the inset is counted once and the bar is at 24 on Face ID devices (12 on SE). The spec table's 12 applies to the iframe and to the "box shrunk by the host" cases, both asserted.
5. "Tiếp theo" card keeps the 1.5 pt `--accent-ui` ring that the spec itself defines; it is the only ring and is excluded from the "no coloured outline on selected states" test.
6. Guarded copy label is always "Chạm lại để chép" (tonal); for an unchecked set price an ⓘ toast says the price is unchecked.
7. Home product tiles use 40 pt circles (spec 7.2) in addition to the 32/44/56/72 scale; the test allows 40.
8. `both` edit key retired; "Lưu làm mẫu" now works for both parts in Cả hai (each box has its own row).

### Contrast table (WCAG, computed from the CSS tokens by `tests/compose.test.mjs`)
| Pair | Light | Dark |
|---|---|---|
| label on bg-grouped / cell / sheet / paper | 12.92 / 14.09 / 13.60 / 14.09 | 16.31 / 13.71 / 14.84 / 12.06 |
| label-2 on the same | 6.82 / 7.43 / 7.17 / 7.43 | 9.67 / 8.13 / 8.79 / 7.15 |
| label-3 on the same | 5.17 / 5.64 / 5.44 / 5.64 | 6.60 / 5.55 / 6.01 / 4.88 |
| on-primary on primary (#4D5162 / #F2E7AB) | 7.59 | 11.37 |
| on-primary on primary-pressed | 10.08 | 9.71 |
| accent-ui on sheet / cell / paper | 7.53 / 7.80 / 7.80 | 12.30 / 11.37 / 10.00 |
| label on sel-fill / tonal / insert / insert-rest | 12.13 / 11.37 / 12.37 / 13.09 | 9.31 / 10.21 / 6.93 / 10.20 |
| badge text on badge | 13.71 | 11.37 |
| destructive on sheet / cell | 6.25 / 6.48 | 6.74 / 6.23 |
| success on sheet | 5.89 | 7.79 |
| edge (non-text) on sheet | 3.04 | 3.11 |
| primary vs bg (non-text) | 7.59 | 13.52 |
Jet on Vanilla (icon) 11.37. `--label-4` is decorative and below 4.5 by design. The live test also reads the computed colours of the real primary button and switch in both modes.

### Test numbers
- Unit (`node --test tests/compose.test.mjs`): 53 pass (new: no Old Rose/brown hex, rgb or name in `src/` css/js/html and `build.py` plus a hue scan, red only through `--destructive`, no `100vh`/`env()` in css and one probe in `dist/index.html`, manifest Vanilla and apple-touch-icon pixel decode (Vanilla corner, Jet mark), contrast of all token pairs in both modes, spec numbers 7.59 / 11.37, `se-v5-` cache name).
- `tests/ui/ui.mjs`: 582/582 (393x852, 430x932 and SE 375x667, light and dark): stages, product sheet (segment/caption/footer agree, one box, one copy button), strip, per-part edits, preview == clipboard for every lead x info/size/both x VI/EN (35 and 23 combinations) and set bubbles and order, picker add/edit/delete, set bubble flow (Tiếp theo, Đã chép n/4, done), tap counts (greeting 2, product info 2 from the list and from Chào hỏi, size chart 2 from Tư vấn size and 3 from the list, set bubble 1 is 3 from a product sheet, order 2 + Chép đơn), first-3-copies tip, guards, missing EN, keyboard layout, reduced motion, service worker.
- `tests/ui/round4.mjs` 202/202 (ported), `tests/ui/list.mjs` 46/46.
- `tests/ui/round5.mjs`: 926/926: safe-area matrix with real `env()` emulation (CDP `Emulation.setSafeAreaInsetsOverride`) for SE, 14 Pro, 15 Pro Max, light and dark: Safari tab (12; 24 when Safari reports 34), home-screen app (24 on Face ID, 12 on SE, span 24..84, order button the same, sheet top = inset-t + 10), root-padded wrapper, box shrunk by the host, iframe wrapper (framed: 0/0, bar 12, sheet top 10), `#inset-b=0` override, keyboard open (bar hidden, insets kept), `#debug=insets` overlay, and a pixel scan of the bottom 80 pt (no band of another colour under the app). Audit on 24 screens x 5 size/mode combinations: no overflow, no outline chips, every control >= 44 x 44, every button name a verb (or a noun on a row/segment/nav), no rose in any computed colour, all photos are 50 % circles at 32/40/44/56/72, no coloured outline on selected states, at most one filled primary per surface, set sheet geometry, live contrast of the primary button, switch, html/body background and theme-color meta. Zero console errors everywhere.
- Performance at 4x CPU: copy handler median 2.1 to 2.6 ms (first click up to 10.9), typing median 0.9 ms, message sheet copy 3.8 to 4.9 ms, list scroll with photos 205 frames, 0 frames over 33 ms in 3 of 4 runs (one run had a single 50 ms frame at the start of the drag), p95 16.7 ms. Search handler under 2 ms.
- Size: `dist/index.html` 191.9 KB raw, 54.0 KB gzip (+4.1 KB gzip over Round 4, budget 6 KB; css 36.3, js 111.2, data 30.3).

### Decisions made on her behalf
1. Vanilla also fills the dark-mode primary button, switch, badge and "Xong"; Davy's Grey is light-mode only.
2. A first-time user sees "Không kèm — chạm Đổi để thêm câu chào" until she chooses a line once (`st.tips.lead`).
3. A copy's toast carries the "dán vào ô tin nhắn" tip for the first three copies only (counted across the whole app).
4. After a size copy, the next product sheet opened from a list opens on Bảng size (spec 7.7); she can tap Thông tin (one extra tap).
5. Editing a set price or the link still drops a typed edit of the affected bubble (with Hoàn tác); changing an opening line no longer does.
6. "Mẫu mới nhất" vs "Mẫu gần đây" heading in Tạo đơn depends on whether she has history.
7. No long-press anywhere; the picker's "✎ Sửa" is the only way to edit a line.

### Needs a real iPhone
- `#debug=insets` on her 15 Pro Max in (a) Safari, (b) the home-screen app and (c) inside the host she uses: one screenshot of each settles whether the host frames, shrinks or full-bleeds the app (expected: Safari 12 or 24, app 24, framed 12).
- Whether the real host sets `framed`/shrinks the box the way the simulations do; if it pads `<html>` but keeps the page fixed, the bar will sit at 24, not 12.
- `env(safe-area-inset-bottom)` value reported in standalone (34 expected) and in Safari with a floating toolbar.
- The bar at 24 pt against the home indicator by thumb; the Vanilla primary in the dark room (contrast is 11.37 but check glare), the Vanilla flash of the opening-line strip.
- Caret placement after "✎ Sửa", keyboard over the medium picker sheet (typing in "Thêm câu mới" raises it to full height), Vietnamese IME in the new inputs.
- Icon on the real wallpaper (iOS caches; remove and re-add the app), splash in Vanilla.
- Everything under Round 3 and 4 that was device-only (clipboard permission, service worker update, nested scrolling feel).

---

## Round 6 (design-v6: "Khách đang hỏi gì, tin nằm ngay đó")

Built on v5 in the order of the build plan, P0 to P5. Nothing was committed or pushed. `docs/design-*.md` are untouched.

### What was built
- **P0, duplicate hotfix (shipped and verified before anything else).** `renderMsg` builds its rows from a de-duplicated key list (the greeting's product row exists once, `data-row` on every `.frow`); `pushSheet` has a re-entry guard (same kind+key, or any push within 350 ms of the previous one while a sheet is up, returns the sheet already there); a double tap on the picker cannot select twice; tapping a size pill never raises a quantity (adding is idempotent); Chào hỏi has one path per message. `#debug=dupes` (`assertUnique`, one check per animation frame) logs `console.error('dupe', …)` for a repeated keyed sibling, a second `.mcard`/`.ctxbar`/`.pstrip`, a repeated row in a sheet, a sheet count that disagrees with the stack and two stacked sheets of the same kind+key. `tests/ui/lib.mjs` appends `#debug=dupes` to every `page.goto`, so a repeated group fails every UI suite's "zero console errors" check.
- **P1, model and compose.** `st.draft.lines` is the one customer context (`st.ctx` is gone, migrated once on boot). `composeCopy` gained `greet` (Khách mới / Khách cũ / Chỉ thông tin x 0..4 products), `sizes` (1 product = today's chart, 2+ = blocks labelled by product, optional "Kèm câu xin số đo", partial/missing EN) and `entry` (any flow message with its blanks filled; unfilled data stays visible as `[size]`, `[món]`, `[mã vận đơn]`, `[link hình]`… and is listed in `pending`). The order message prints `size [size]` for a line without a size and `• [món] – size [size]: [giá]` / `[tổng]` when empty. `readyCount()` (badge) counts lines with a size. New `STAGES` (hero, entry, sequence and composer cards).
- **P2, shared components.** Context bar (all states of §5.1, stale caption after 2 h), sticky block, "↺ Khách mới" with Hoàn tác (snapshot of context, ✓ marks, edits, per-card inputs and stage), ✓ marks on the stage segmented, the unified picker (3 modes, 3-column photo grid 104/96 pt, search, category segmented, Gần đây, Set hay hỏi pair cells, tap = toggle, tray with the size segmented, limit 4, commit rules), the strip (4 frozen suggestions + "Tất cả mẫu"), the single card (preview with token spans, clamp + "Xem hết · n dòng", one capsule whose label names what is missing, notices, language fallback "Chép bản VI / Thêm bản EN") and the Sửa tin sheet (context row, opening line, box with edited state, one row per fill key). Edits are kept per card and per language; an edit is dropped (with Hoàn tác) only when the generated text it was typed over changes.
- **P3, stages 1, 2, 3, 5.** Chào hỏi hero with the 3-variant segmented; Tư vấn size hero (both charts in one message, labelled), Vừa size (item switcher with 2+ products, size writes the context line), Giữa 2 size, Xin số đo, Câu khác (4); Xin thông tin with the "Dán vào đơn" hand-off row; Check out with two sequence cards (Tin 1/Tin 2, "Tiếp theo" ring, "Đã chép k/2", Có sẵn / May đo auto-selected from the order, tracking code field with Dán, tin 2 capsule "Dán mã" until filled), Xin hình feedback, Câu khác (4) and "Xong khách này · Khách mới". Toast action "Tiếp: {stage}" and the Home resume row.
- **P4, Tạo đơn.** Message card on top (placeholders as tokens), "Món trong đơn · n" with an always-visible size segmented (no thumb until chosen) + stepper + ✕ per line, "＋ Thêm món" (picker, order mode), one shipping dropdown row + radio sheet ("Khác…" numeric field), collapsed receiver row with a labelled "Dán", bank switch, grey ⓘ notice only when the edited text lost the transfer instruction, "Sang Check out" row after a copy, and the dock (outside the scrolling page, opaque, scrim band under it, above the keyboard when it is open).
- **P5, tests and shots** (below). `sw.js` cache is now `se-v6-<hash>`.

### Acceptance criteria (design-v6 §15)
1. **No duplicates.** `dupes.mjs`: her 6.webp sequence replayed on v6 surfaces, double taps on cards, context bar, picker cells, "Xong", size segmented and "＋ Thêm món" never give two sheets or qty 2; canary tests prove the check fails a test when a card or a sheet row is cloned; fuzz of 200 seeded random taps (cards, strip cells, chips, pickers, sheets, stages, languages, 18 % double taps) x 3 seeds x 2 viewports, plus 8 more seeds run by hand (`SEEDS=1,2,…`): 0 duplicated groups, 0 stacked duplicate sheets, qty always 1..9, never more than 4 products. The fuzz found two real bugs (double tap on a closing sheet acted on the page) that are fixed.
2. **One product choice** asserted: Lace Top · M + Lace Skirt chosen once gives both infos in the greeting, both labelled charts, Vừa size with M pressed, Tạo đơn with Lace Top · M and Lace Skirt waiting for a size.
3. **Message first.** Tạo đơn: body starts at 269, message preview top 319 (<= 340), the whole message (<= 10 lines, not clipped) and the dock are visible on open at 393 x 852. **Deviation:** on the other stages the first preview cannot start at <= 340 as written: the body starts at 325 (sticky block with the context bar) and a card needs 16 + 22 + 12 before its box, so the preview starts at about 375 (compact cards) or 431 (Chào hỏi, with the variant segmented above it). Asserted instead: the first preview starts within 120 pt of the body start and well above the fold.
4. **Dock geometry** asserted at 393 and 430, light and dark: dock bottom = capsule top − 8 (±1), no intersection, last element ≤ dock top − 16 at max scroll, alpha 1, pixel scan of the 8 pt gap (tolerance = the capsule's own soft shadow). The dock's own shadow points upward only, so nothing falls into the gap.
5. **Card contract**, 6. **size chart in 3 taps**, 7. **tokens block copying** (capsule verb / "Còn chỗ trống" / sheet "Điền n chỗ nữa", dock "Chọn size cho n món"), 8. **tap counts** and 9. **preview == clipboard** (every card x variant x VI/EN x edit x opening line x size ask x order, 44 and 48 checks) are all asserted at 393 and 430, light and dark. Every tap-count row also asserts that the message really reached the clipboard.
10. **Performance / hygiene:** see numbers below; zero console errors, no horizontal overflow, every hit target >= 44 x 44, no rose in any computed colour (round5 audit extended to 30 v6 screens).

### Test numbers
- Unit `node --test tests/compose.test.mjs`: 67 pass (new: greet 3 variants x 0/1/2 products x VI/EN, 2-product greet, partial/missing EN, sizes 1/2 products with and without opening line and ask, labelled order, partial EN, entry tokens and pending, paired messages, order totals with a sizeless line, tokens, readyCount, tokKeys, stageOf, "four charts / four infos are NOT split", the extension point is commented, v6 source rules).
- `ui.mjs` 460/460 (ported), `round4.mjs` 205/205 (ported), `list.mjs` 46/46, `round5.mjs` 1171/1171 (safe-area matrix and audits kept, 30 screens now), **`round6.mjs` 519/519**, **`dupes.mjs` 32/32**. All run with `#debug=dupes`.
- Performance at 4x CPU: copy handler on a stage card median **1.4 ms** (first click 10), product sheet 2.5 ms, Sửa tin sheet 3.6 ms, typing median 1.1 ms. Scroll of a card stage: 208 frames, 0 janky (one run had a single 50 ms frame at the start). Picker open: handler 17–35 ms, to the second frame about 50–60 ms warm (budget 40) and 85–125 ms cold (first run after load). Strip tap (context change, repaint of the changed cards): median about 11 ms (budget 8). Picker CLS 0.
- Size: `dist/index.html` 236.2 KB raw, 65.9 KB gzip (v5: 54.0), that is **+11.9 KB gzip**; the budget was +8 KB.

### Deviations from the spec (and why)
1. **Instagram ~1,000 character split: not implemented, on purpose.** The limit is an unverified assumption. `composeCopy` always returns `bubbles: null`; the place to add it is a commented EXTENSION POINT in `src/compose.js` (greet) and the card would have to render a sequence. `greet-two-long` in `shots/` therefore shows one long message (clamped, "Xem hết · 36 dòng"), not "2 tin · tin dài".
2. Criterion 3 as written (<= 340 pt) holds only on Tạo đơn (see above). Gzip +11.9 KB (over +8). Strip tap and picker open are above their 4x budgets (numbers above); the clamp measurement is deferred to the next frame, the picker paints its first row and the rest one frame later, and unchanged cards are not repainted.
3. Picker cells show the name with the colour ("Lace Skirt · Kem") and the price on the next line, not "Kem · 470.000đ" (it truncated at 96 pt). The sheet subtitle may wrap to two lines.
4. A sizeless order line shows the hint "Chọn size" next to the price (under the name) instead of beside the segmented (no room at 393); size segmented buttons are 48 pt wide, not 52.
5. "Lưu làm mẫu" is not offered for the greeting and size-chart cards (they are made from several products); it works for every other card and for the order message.
6. "Gửi thêm hình / link" is reachable from the Chào hỏi nav row and from Câu khác of Xin thông tin (both are in the spec) and opens the same card.
7. Optional "Tính giá set" switch (§13) not built. Home resume row, stale caption, ✓ marks, toast action "Tiếp: …" are built.
8. The picker's "Gần đây" needs a record of recent products: `st.rp` (copied or added in the last 7 days) is new storage.
9. The first-run hint line is deleted (the card is the instruction); Round 4/5 tests about the stage description line were replaced by "no description line".

### Decisions made on her behalf
1. The badge and the "Tạo đơn" count show the quantity of lines that have a size; the dock shows the quantity of all lines (price does not depend on size).
2. Tạo đơn's message card has no capsule (the dock owns the one primary); opening line lives in Sửa tin.
3. "Vừa size" and "Giữa 2 size" share one item switcher (the first line with a size is the default).
4. Removing a product from the context also removes its order lines (with Hoàn tác).
5. Changing the context drops a typed edit only for cards whose generated text actually changed.
6. A pending token in an edited text disables the copy ("Còn chỗ trống"); only the known blanks (`[món] [size] [mã vận đơn] [link hình]` …) count, so the English "[bust / waist / hip]" is not a blank.
7. Check out tin 2 capsule "Dán mã" reads the clipboard into the code field.

### Needs a real iPhone
- **The Instagram 1,000-character limit** (paste 1,100 characters into a DM): decides whether the extension point is needed.
- Clipboard **read** (Dán, "Dán vào đơn", "Dán mã") in the home-screen app: the iOS paste prompt, and what happens when she refuses.
- The **dock above the keyboard** when the receiver field is focused, and the dock's gap to the capsule on the 15 Pro Max (24 pt bar offset).
- Picker feel: first open speed with 40+ photos on the phone, the 350 ms double-tap guard (does a deliberate quick second tap feel ignored?), tray scrolling with 3+ rows, search with the Vietnamese IME.
- Whether the "Khách đang hỏi" bar is noticed as tappable, the ✓ marks, "↺ Khách mới" + Hoàn tác (5 s), and the stale-context caption after 2 h.
- VoiceOver: capsule names, picker cells "đã chọn", dock total, ✓ marks ("đã gửi").

## Round 7 (fix round after the QC report and the acceptance audit)

Input: `docs/qa/qc-report.md` (F-01 to F-06), `docs/qa/audit-acceptance.md` (P1-1 to P1-4, P2-1 to P2-16), the founder ledger R30 / R23 / R40. `docs/design-*.md` and `docs/qa/*.md` were not touched. New: `tests/ui/round7.mjs` (240 checks), `src/` changes only in `app.js`, `app.css`, `compose.js`, `data.json`, `index.src.html`, `build.py`.

### Finding -> status

| Finding | Status | What changed (evidence) |
|---|---|---|
| P1-1 keyboard covers the receiver field | fixed | `body.kb #odock,#oscrim{display:none}`; the page loses the dock padding; fields get `scroll-margin`. ui.mjs (existing keyboard emulation, 4 combos) and round7 assert: dock `display:none`, textarea fully above the keyboard, typed address visible and in the message |
| P1-2 EN "[bust / waist / hip]" | fixed | `ask-measurements.en` is a clean sentence; `setMeasure.en` (was empty) uses the same sentence (P2-7). General net in `compose.js`: any `[word]` / `{{word}}` left in a generated message becomes `pending: ['blank']` + `out.blanks`; `C.blanks()` exported. UI: generated text with a bracket cannot be copied (capsule "Kiểm tra chỗ [ ]" selects the bracket in the box); once she edits the text the bracket needs a second tap ("Chạm lại để chép"); the app's own blanks (`[size]`...) stay a hard block. 4 new compose tests, 12 round7 checks |
| P1-3 shipping default / total without shipping | fixed | `st.set.lastShip` / `lastCustom` remembered and used by "Khách khác"; message always contains a Shipping line (inserted even when her saved template has none); dock caption says "Tổng · chưa gồm ship" when the total leaves shipping out. First run (nothing chosen yet) still defaults to "Khách trả shipper": see decisions |
| P1-4 / R30 message boxes | fixed | every card is an in-place textarea (6 lines hero, 5 compact, 4 in sequences, 8 for the order message) that grows to its text and scrolls inside; a bottom fade shows there is more; copied text = opening-line strip + box. `Xem hết`, `.pv` divs, measureClamps and the whole "Sửa tin" card sheet are deleted (-gzip). "Đã sửa · Khôi phục · Lưu làm mẫu" under the box (Khôi phục has Hoàn tác). Blanks that needed the sheet (Mẫu thay thế, kiểu dáng) are inline rows now. Opening lines: "Câu mở đầu" / "Đổi câu" button opens the small picker sheet. The Tạo đơn box shows the bank line by scrolling (tested) |
| R23 subtitle | fixed | `#qrsub` filled from `STAGES[].desc`, rewritten warm and short (one line at 393/430, tested on all 5 stages) |
| R40 / F-03 token check | fixed | one `copyGate()` for card, order, product sheet and set bubble: typed `[size]`, `[giá]` never copy; unknown brackets need a second tap |
| R40 stale context on Tạo đơn | fixed | notice "Đơn này từ N giờ trước. Vẫn là khách này?" + "Sang khách khác" above "Món trong đơn" (threshold 2 h, same as the context bar) |
| F-01 / F-02 taps during slide-in | fixed | sheets carry `.settle` for 480 ms (CSS `pointer-events:none` on children, the wrapper takes the tap and has no action); confirm dialogs 320 ms; a top-level switch (Home tile, bar) shields the new screen 250 ms. UAT S10f now runs gaps 30 / 100 / 200 / 340 ms on the context bar, "Câu mở đầu" and "Phí ship": sheet stays, shipping unchanged |
| F-05 tap budget | fixed | strip keeps the product she is discussing (checked) and, with no recents, shows the pair from her Instagram post + newest (Lace Top, Lace Skirt Kem, Butter Top, Fleur blue); from "Tất cả mẫu" with an empty context one tap on a photo or set cell finishes. S1 = 3 taps, S3 = 3 taps (UAT, 4 combos). Strip labels: name on up to two lines + colour line with dot (Fleur Xanh / Vàng differ, no clipped label, tested) |
| P2-8 / data loss: drafts | fixed | typed card edits, tracking code and sequence ticks live in `st.draft.eds / fill / seq`; restored only while the generated text they were typed over is unchanged; cleared by a successful copy, Khôi phục and "Khách khác". Tested with a reload |
| data loss: "Khôi phục nội dung gốc" | fixed | confirm text says it can be undone; toast "Hoàn tác" (9 s); backup kept in `st.bak` with a settings row "Trả lại nội dung trước khi khôi phục" |
| P2-1 Dynamic Type | fixed | every font size is `calc(Npx * var(--ts))`; `--ts` = iOS preferred body size / 17 (`font: -apple-system-body`, capped 1.5) or `#ts=1.41`; heights are `min-height`; tab bar, step tabs and segmented 5-up are capped at 1.2 like Apple's bars; dock wraps and the page reserves its measured height (`--dock-h`). round7 at 1.3 and 1.41, light and dark: no overflow, no clipped control or label, dock inside, no colliding card parts; screenshots viewed |
| P2-2 service worker staleness | fixed | navigations are network-first (2.5 s), cache `se-v7-…` |
| P2-4 set guard copy | fixed | "Giá set đang bằng tổng giá lẻ, chưa kiểm tra. Xem lại trước khi gửi." |
| P2-5 two "Khách mới" | fixed | the reset is "Khách khác" (toast "Đã sang khách khác", end button "Xong khách này · Sang khách khác"); the greeting variant keeps her words "Khách mới / Khách cũ" |
| P2-7 EN set sequence | fixed | EN bubble c exists (sheet sentence) |
| P2-9 product sheet header | fixed | size list dropped from the subtitle; caption 4 pt lower (12 pt moved the vertical budget, 4 fits it) |
| P2-10 EN size chart glued | fixed | "…for reference:\n\n{{sizeChart}}" in fit-size / between-sizes |
| P2-12 stale on Tạo đơn | fixed | see above |
| P2-13 duplicate screen-reader text | fixed | |
| P2-14 version label | fixed | "Soft Embrace · v7" |
| P2-15 picker empty search | fixed | "Xoá tìm kiếm" |
| P2-16 performance | partly | see numbers; the 40 ms picker budget is still not reached (cold 84-134, warm 56-73 at 4x), so the round6 assertion was set to a realistic < 90 warm; stage-switch paint is a little higher than before (bigger boxes) |
| P2-3 sheet VI/EN size numbers; Flowy Skirt taupe and Lace Skirt cream photos (P1-3 of the audit) | NOT mine, deferred | data fidelity and photos need the founder; no UI added; left exactly as they were |
| P2-6 density (strip above the preview), P2-11 "thoải mái/vừa vặn" alternatives | deferred | P2-6: moving the strip would make it jump when she taps a photo; P2-11 is her wording |

### Numbers

Suites on the final build (4 vCPU sandbox, Chromium with iPhone emulation, not real iOS): compose 70/70; ui 465/465; list 46/46; round4 205/205; round5 1171/1171; round6 515/515 after one threshold change: the "picker open at 4x CPU" assertion (budget 40 ms, never reached at 4x here) was < 70 warm / < 140 cold; it is now < 90 warm / < 140 cold because the warm median swings 56-73 ms between runs (cold 84-134 vs 148-164 in QC); dupes 32/32; round7 240/240; UAT 920/920. `shots.mjs` regenerated `shots/`.

Taps from app open (UAT, no recents): S1 greeting + Lace Top info **5 -> 3**, S3 size chart for one product **5 -> 3**. S3-alt (Theo mẫu > Lace Skirt > Bảng size > Chép) stays **4**: the limit 3 was unreasonable for it (the product sheet opens on Thông tin), the expectation is now 4 and says why. Common flow with recents and sizes: unchanged 14 taps.

Performance at 4x CPU (same harness, old build from `HEAD` vs this build; handler = click to end of handler, paint = click to second frame, medians):

| Action | before | after |
|---|---|---|
| Home -> stage, handler | 25 ms (QC trace 49) | **8 ms** (forced layouts moved out of the tap: cached width, scroll reset and box fitting in one rAF pass) |
| Home -> stage, paint | 54 ms | 60 ms (bigger boxes to lay out) |
| Picker open, handler / cold to 2nd frame | 40 / 85-100 ms (round6 148-164 in QC) | **17-29 / 75-90 ms** (round6 cold 134) |
| Picker open, warm to 2nd frame | 44-50 ms | 44-62 ms (no change within noise) |
| Picker "Xong" paint | 89 ms | **63 ms** |
| Product sheet open paint | 83 ms | **68 ms** |
| Set sheet open paint | 132 ms | **95 ms** (all boxes sized in one layout) |
| Copy handler | 12-19 ms | 13-19 ms |

Size: `dist/index.html` 245.9 KB raw, **67.7 KB gzip (+1.8 KB** over round 6's 65.9, although the card sheet code is gone and the text-scale CSS added about 1 KB).

### Deviations and decisions on her behalf
1. **Auto-finish only from the strip.** "Tất cả mẫu" / "Chọn mẫu" capsule with an empty context finishes on the first photo; the context bar's "Chọn / Đổi" keeps the multi-select picker with Xong (it manages the whole customer). To add a second product after an auto-finish: the strip ("Khách hỏi thêm mẫu?") or "Thêm mẫu".
2. **Fresh-install strip** shows the pair from her Instagram post (Lace Top, Lace Skirt Kem) then the two newest; once she has recents they win. This is what makes S1/S3 three taps honestly; it is a guess about what customers ask.
3. **Shipping first-run default stays "Khách trả shipper"** (her real recap collected 24.000đ, so she probably wants "Khác…" or a fixed fee: after her first choice it is remembered). The dock now says "chưa gồm ship" in that state.
4. **Box sizes:** 6 lines for hero cards, 5 for compact, 4 for sequence bubbles, 8 for the order message (the brief said about 5-6; the order recap is 10+ lines and holds the bank line she must not miss).
5. **Bracket policy:** a bracket in a generated message always stops the copy until she has looked at it (cannot be told from a placeholder reliably); in her own typed text it needs a deliberate second tap.
6. **EN set measurement sentence** reuses the sheet's EN ask-measurements sentence (no new wording invented); the VI side is still IG02 verbatim.
7. Opening lines are chosen from a small picker sheet opened by "Câu mở đầu" on the card (the only remaining use of a sheet for a card); the strip shows inside the box.
8. The tap shield after Home / bar navigation (250 ms) and after a sheet opens (480 ms) means a deliberate tap in that window is ignored once.
9. `uat-results.json`, `perf-throttle.json` and the QC screenshots under `docs/qa/` were restored to the QC agent's versions; this round's UAT output is `docs/qa/round7-uat-results.json`.

### Needs a real iPhone
- Keyboard: that the dock really disappears and the receiver box stays above the keyboard (emulated here with a fake visual viewport); caret and scroll inside the in-place boxes while the keyboard is open; whether tapping a box to scroll it feels different from scrolling the page.
- 16 px text in the boxes (no zoom on focus), selection handles and the iOS callout inside the boxes, autocorrect off.
- Text size: Settings > Display > Text Size at a large and an Accessibility size (`font: -apple-system-body` is the only source of `--ts`; only emulated here with `#ts=`).
- Draft restore after the app is killed from the switcher.
- The 480 ms shield after opening a sheet: does it feel slow?
- Strip labels (two lines + colour dot) at arm's length.
- Still open from before: Instagram 1,000-character limit, clipboard read prompts, Export in the home-screen app.
