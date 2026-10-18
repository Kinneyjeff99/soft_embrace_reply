# Design v2 build report

Build: `python3 build.py` -> `dist/`. Implemented per `design-v2.md`, plus the lead's follow-up from `docs/ig-reference/` (real lead-in phrases, bubble-by-bubble sets, post link, order total).
Tests: Node unit table (`node --test tests/compose.test.mjs`, 28 pass) and headless Chromium iPhone emulation at 393x852 and 430x932, light and dark (`tests/ui/ui.mjs`, 125 checks pass, scripts shipped in `tests/ui/`).
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
