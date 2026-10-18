# QC / UAT report: Soft Embrace Reply (main at v6, c0122ff)

Generated 2026-10-18T19:58:58.571Z. Browser: Chromium (/opt/pw-browsers/chromium) with iPhone emulation (touch, DPR 3, iOS UA). **Not real iOS Safari.** Nothing under src/, build.py, dist/ or existing tests was modified; new files are under tests/uat/ and docs/qa/ only.

## 1. Headline

- Build: `python3 build.py` reproduces dist byte-for-byte (`git diff --stat dist/` empty, `git status` clean).
- Existing suites: compose 67/67; ui 460/460; list 46/46; round4 205/205; round5 1171/1171; dupes 32/32; **round6 518/519 (1 failure, deterministic, 2 of 2 runs)**. No flaky test between two runs.
- New UAT (tests/uat/uat.mjs, 2 viewports x light/dark, 896 assertions in the final run): **846 pass, 50 fail**. Every exact-clipboard assertion for S1-S9 passed in all four viewport/theme combos (character-for-character against strings composed from src/data.json and docs/ig-reference).
- Distinct failures: **0 P0, 1 P1, 5 P2** (F-01 to F-06; F-06 is an existing round6 failure) (section 5). No wrong text was copied by any intended flow.

## 2. Job 1: regression

Build: `python3 build.py` 0.12 s, output `dist/index.html raw 236.2 KB gzip 65.9 KB`; `git diff --stat dist/` printed nothing.

| Suite | Run 1 pass/fail | Run 2 pass/fail | Wall (run 1 / run 2) | Console errors | Differing tests |
|---|---|---|---|---|---|
| tests/compose.test.mjs (node --test) | 67/0 | (single run, 0.22 s) | 0.29 s | n/a (pure functions) | n/a |
| tests/ui/ui.mjs | 460/0 | 460/0 | 300 s / 300 s | 0 (each suite asserts zero console errors/warnings/failed requests/pageerrors; all those assertions pass) | none |
| tests/ui/list.mjs | 46/0 | 46/0 | 13 s / 12 s | 0 (each suite asserts zero console errors/warnings/failed requests/pageerrors; all those assertions pass) | none |
| tests/ui/round4.mjs | 205/0 | 205/0 | 121 s / 121 s | 0 (each suite asserts zero console errors/warnings/failed requests/pageerrors; all those assertions pass) | none |
| tests/ui/round5.mjs | 1171/0 | 1171/0 | 164 s / 162 s | 0 (each suite asserts zero console errors/warnings/failed requests/pageerrors; all those assertions pass) | none |
| tests/ui/round6.mjs | 518/1 | 518/1 | 451 s / 450 s | 0 (each suite asserts zero console errors/warnings/failed requests/pageerrors; all those assertions pass) | none (same 1 FAIL both runs; numbers in the title differ: 148/67 ms vs 164/74 ms) |
| tests/ui/dupes.mjs | 32/0 | 32/0 | 155 s / 156 s | 0 (each suite asserts zero console errors/warnings/failed requests/pageerrors; all those assertions pass) | none by name; fuzz titles "exercised N controls" vary (33 vs 29, timing-dependent), all pass |
| tests/ui/shots.mjs | not run in place | - | 185 s (sandbox copy) | 0 | - |

`tests/ui/shots.mjs` is a screenshot generator that **deletes and rewrites the tracked `shots/` folder**. To respect the no-modification rule I ran a copy with its output redirected outside the repo: it completed and produced 113 files; `shots/` is untouched (114 entries, `git status` clean). It has no assertions.

Total wall time for the existing suites, one pass: about 1,200 s (compose 0.3, ui 300, list 13, round4 121, round5 163, round6 451, dupes 155). UAT full run: about 740 s.

### 2.1 Copy path under 4x CPU throttle

`tests/uat/perf-throttle.mjs`, real touch taps, 393x852 @3x, median of 8 taps. *clip* = click event timestamp to `navigator.clipboard.writeText` call. *paint* = click to the second animation frame (the seal is on screen).

| Action | 1x clip | 1x paint | 4x clip | 4x paint | 4x worst clip / paint |
|---|---|---|---|---|---|
| Home > Chào hỏi (stage switch) | - | 28.6 ms | - | 57.6 ms | - |
| open "Tất cả mẫu" picker | - | 33.6 ms | - | 69.9 ms | - |
| pick a product (cell) | - | 24.7 ms | - | 48.2 ms | - |
| picker "Xong" (commit context) | - | 32.9 ms | - | 98.5 ms | - |
| COPY greeting card (2 products) | 3.4 ms | 27.4 ms | 13.8 ms | 23.4 ms | 25.5 / 43 ms |
| stage switch > Tư vấn size | - | 31.1 ms | - | 61 ms | - |
| COPY size charts (2 products, labelled) | 4.7 ms | 23.6 ms | 16.6 ms | 30.3 ms | 26 / 41.9 ms |
| COPY Vừa size card | 4.1 ms | 28 ms | 13.9 ms | 29.1 ms | 30.1 / 50.2 ms |
| stage switch > Tạo đơn | - | 32.7 ms | - | 62.7 ms | - |
| COPY order (dock "Chép đơn") | 3.9 ms | 22.7 ms | 12.2 ms | 29.4 ms | 19.1 / 35 ms |
| stage switch > Check out | - | 24.7 ms | - | 54.4 ms | - |
| COPY Check-out bubble 1 (IG03) | 3.8 ms | 22 ms | 17.9 ms | 28.9 ms | 43.3 / 52.8 ms |
| open product sheet (row tap) | - | 33.9 ms | - | 77.7 ms | - |
| COPY product sheet "Chép thông tin" | 4.1 ms | 24.1 ms | 14.6 ms | 27.2 ms | 31.8 / 40.8 ms |
| open set sheet (suggestion row) | - | 24.3 ms | - | 126 ms | - |
| COPY set bubble 1 (info of both + price) | 4.3 ms | 29.5 ms | 17.3 ms | 31.3 ms | 20.5 / 35 ms |

Boot (script run / DOMContentLoaded / first contentful paint): 1x 27 / 82 / 108 ms; 4x 132 / 329 / 324 ms. Console errors: 0. Reading: copy writes the clipboard inside the tap handler in 4 ms (1x) to 18 ms (4x); every copy confirms on screen within 52 ms even at 4x. Slowest at 4x: opening the set sheet (126 ms), picker Xong (98 ms), product sheet (78 ms).

## 3. Job 2: UAT results

Method: new browser context (fresh localStorage) per scenario, real touch taps (`locator.tap` / `touchscreen.tap`) counted from app open on Home, clipboard permissions granted, every `writeText` logged and the real clipboard read back. Taps that needed a scroll are noted. Viewports 393x852 and 430x932, light and dark (4 combos). Expected strings: `tests/uat/expect.mjs` (reads only src/data.json and docs/ig-reference/instagram-message-references.md; never src/compose.js). Whitespace rule applied to expected text: no trailing spaces, no 3+ newlines, trimmed; every copied text is also checked for raw `{{ }}`, `[token]`, undefined/NaN.

### 3.1 Scenario matrix (assertions passed / total, per viewport and theme)

| Scenario | 393x852 light | 393x852 dark | 430x932 light | 430x932 dark | Result |
|---|---|---|---|---|---|
| S1 new customer, Lace Top | 11/12 | 11/12 | 11/12 | 11/12 | FAIL (see 5) |
| S2 returning, Butter Top EN | 7/7 | 7/7 | 7/7 | 7/7 | PASS |
| S3 size chart, Lace Skirt M | 7/9 | 7/9 | 7/9 | 7/9 | FAIL (see 5) |
| S4 set Lace Top + Lace Skirt (default and 800.000đ) | 23/23 | 23/23 | 23/23 | 23/23 | PASS |
| S5 set Butter Top + Embroidery Pants | 10/10 | 10/10 | 10/10 | 10/10 | PASS |
| S6 orders (1 item; 2 items qty 2, free/custom/courier ship) | 14/14 | 14/14 | 14/14 | 14/14 | PASS |
| S7 payment received | 10/10 | 10/10 | 10/10 | 10/10 | PASS |
| S8 tracking | 6/6 | 6/6 | 6/6 | 6/6 | PASS |
| S9 feedback | 3/3 | 3/3 | 3/3 | 3/3 | PASS |
| S10 edge cases | 66/70 | 65/70 | 66/70 | 65/70 | FAIL (see 5) |
| S11 navigation | 31/36 | 31/36 | 31/36 | 31/36 | FAIL (see 5) |
| S12 safe-area | 11/11 | 11/11 | 11/11 | 11/11 | PASS |
| S13 contrast | 13/13 | 13/13 | 13/13 | 13/13 | PASS |

### 3.2 Taps from app open (393x852 light; identical in all four combos)

| Scenario | Actual | Limit | Scrolls | Path | Verdict |
|---|---|---|---|---|---|
| S1 greeting + product info | 5 | 3 | 1 | Home > Chào hỏi > Tất cả mẫu > chọn Lace Top (scroll) > Xong > Chép | **FAIL** |
| S1b info only via Theo mẫu | 3 | 3 | 1 | Home > Theo mẫu > Lace Top row (scroll) > Chép thông tin | PASS |
| S1b greeting + info + link via product sheet (taps from app open, informational) | 8 | not stated | 0 | Home > Theo mẫu > Lace Top row (scroll) > Chép thông tin > Kèm link bài viết > Chép > Câu mở đầu: Đổi > chọn câu chào > Chép | info |
| S2 returning customer EN info | 5 | 5 | 0 | Home > Chào hỏi > Khách cũ > EN > Butter Top (strip) > Chép | PASS |
| S2 info-only variant taps (informational) | 7 | not stated | 0 | Chỉ thông tin > Chép | info |
| S3 size chart for one product | 5 | 3 | 1 | Home > Tư vấn size > Tất cả mẫu > Lace Skirt Kem (scroll) > Xong > Chép | **FAIL** |
| S3b extra taps for the "size M" message | 2 | not stated | 0 | taps after the chart was copied | info |
| S3-alt size chart via Theo mẫu | 4 | 3 | 1 | Home > Theo mẫu > Lace Skirt row (scroll) > Bảng size > Chép bảng size | **FAIL** |
| S4 set message sequence (4 bubbles) | 7 | 8 | 1 | Home > Theo set > suggested set Lace Top + Lace Skirt > Chép tin 1 (arms) (scroll) > Chép tin 1 (confirm) > Chép tin 2 > Chép tin 3 > Chép tin 4 | PASS |
| S4b set message sequence (4 bubbles) | 8 | 8 | 1 | Home > Theo set > suggested set custom 800.000đ > Giá set > Chép tin 1 (arms) (scroll) > Chép tin 1 (confirm) > Chép tin 2 > Chép tin 3 > Chép tin 4 | PASS |
| S5 set message sequence (3 bubbles) | 6 | 7 | 2 | Home > Theo set > suggested set Butter Top + Embroidery Pants (scroll) > Chép tin 1 (arms) (scroll) > Chép tin 1 (confirm) > Chép tin 2 > Chép tin 3 | PASS |
| S6 one-item order | 9 | not stated | 0 | Home > Tạo đơn > Thêm món > Lace Trim Blouse Kem > size M > Thêm 1 món vào đơn > Phí ship > Khác… > Xong > Chép đơn | info |
| S7 payment received (IG03 then IG04) | 3 | 3 | 0 | Home > Check out > Chép tin 1 > Chép tin 2 | PASS |
| S8 tracking IG05 then code | 4 | 4 | 1 | Home > Check out > Chép tin 1 (scroll) > Dán > Chép tin 2 | PASS |
| S9 feedback request | 2 | 2 | 1 | Home > Check out > Chép (scroll) | PASS |

Limits for S2, S4 and S5 were not stated in the brief; I used the floor I measured (S2 5, S4 8, S5 7) so they read PASS: treat those three as "recorded", not "met". The first set bubble from a suggested set needs two taps (price-unchecked guard, by design).

### 3.3 Every assertion (aggregated over the four combos)

| Scenario | Assertion | Result | Note on failure |
|---|---|---|---|
| S1 | Chào hỏi opens with the greeting card, no product yet ("Chưa kèm mẫu") | PASS |  |
| S1 | preview shows exactly the message that will be copied | PASS |  |
| S1 | clipboard = Khách mới greeting + Lace Top info (exact) | PASS |  |
| S1 | Lace Top info block equals the founder's real IG07 message minus the link | PASS |  |
| S1b | S1b Theo mẫu > Lace Top > Chép thông tin = info only (no greeting) | PASS |  |
| S1b | S1b with post link toggled = IG07 verbatim (info + link) | PASS |  |
| S1b | S1b greeting lead-in + IG07 = greeting + info + link | PASS |  |
| S2 | language is visible on the copy button ("Chép · EN") | PASS |  |
| S2 | preview == expected EN returning greeting | PASS |  |
| S2 | clipboard = returning-customer EN greeting + Butter Top EN info (exact) | PASS |  |
| S2 | S2b "Chỉ thông tin" EN = Butter Top EN info only (exact) | PASS |  |
| S3 | size hero preview == Lace Skirt size chart | PASS |  |
| S3 | clipboard = Lace Skirt (Kem) size chart only (exact) | PASS |  |
| S3 | S3b "Vừa size" M message with Lace Skirt chart (exact) | PASS |  |
| S3b | S3-alt Theo mẫu > Lace Skirt > Bảng size > Chép = chart (exact) | PASS |  |
| S4 | set sheet has 4 bubbles (a,b,c,d), each with its own copy button | PASS |  |
| S4 | unchecked set price: first tap does not copy ("Chạm lại để chép") | PASS |  |
| S4 | bubble 1 = info of both + set price in ONE message (exact) | PASS |  |
| S4 | bubble 2 = both size charts labelled by product (exact) | PASS |  |
| S4 | bubble 3 = measurement request IG02 (exact) | PASS |  |
| S4 | bubble 3 equals IG02 | PASS |  |
| S4 | bubble 4 = post link (exact) | PASS |  |
| S4 | footer says all copied | PASS |  |
| S4 | S4 default set price = sum 850.000đ and no saving line | PASS |  |
| S4b | set price line shows retail prices and the set price | PASS |  |
| S4b | set sheet has 4 bubbles (a,b,c,d), each with its own copy button | PASS |  |
| S4b | unchecked set price: first tap does not copy ("Chạm lại để chép") | PASS |  |
| S4b | bubble 1 = info of both + set price in ONE message (exact) | PASS |  |
| S4b | bubble 2 = both size charts labelled by product (exact) | PASS |  |
| S4b | bubble 3 = measurement request IG02 (exact) | PASS |  |
| S4b | bubble 3 equals IG02 | PASS |  |
| S4b | bubble 4 = post link (exact) | PASS |  |
| S4b | footer says all copied | PASS |  |
| S4b | S4b custom price 800.000đ shows retail and set lines + saving | PASS |  |
| S5 | set sheet has 3 bubbles (a,b,c), each with its own copy button | PASS |  |
| S5 | unchecked set price: first tap does not copy ("Chạm lại để chép") | PASS |  |
| S5 | bubble 1 = info of both + set price in ONE message (exact) | PASS |  |
| S5 | bubble 2 = both size charts labelled by product (exact) | PASS |  |
| S5 | bubble 3 = measurement request IG02 (exact) | PASS |  |
| S5 | bubble 3 equals IG02 | PASS |  |
| S5 | footer says all copied | PASS |  |
| S5 | S5 source prices are 390.000đ and 520.000đ and the set quote is 910.000đ | PASS |  |
| S6 | Tạo đơn opens with the message visible first (placeholder [món] for the empty order) | PASS |  |
| S6 | order preview == expected recap | PASS |  |
| S6 | order button label is "Đơn" with badge 1 | PASS |  |
| S6 | dock shows total 444.000đ | PASS |  |
| S6 | clipboard = OBS03 order recap: Lace Trim Blouse Kem M 420.000đ + ship 24.000đ = 444.000đ + transfer-note instruction (exact) | PASS |  |
| S6 | message has "Dạ vậy đơn của bạn", total 444.000đ and the Instagram-name transfer note | PASS |  |
| S6b | badge counts 3 pieces | PASS |  |
| S6b | S6b 2 items (Lace Top M x2 + Butter Top S) free ship = 1.150.000đ (exact) | PASS |  |
| S6b | S6c same order, custom ship 30.000đ = 1.180.000đ (exact) | PASS |  |
| S6b | S6d courier-paid ship (default wording) = 1.150.000đ (exact) | PASS |  |
| S6b | order preview is still one group (no duplicate cards) | PASS |  |
| S7 | S7 bubble 1 = IG03 "ui dạ mình nhận được rùi ạ" (exact) | PASS |  |
| S7 | S7 bubble 2 = IG04 thanks, ready-to-wear (exact, separate message) | PASS |  |
| S7 | both bubbles were separate clipboard writes | PASS |  |
| S7 | S7b custom (may đo) thanks (exact) | PASS |  |
| S7 | S7c switching back to Có sẵn gives IG04 again (exact) | PASS |  |
| S7d | made-to-order item in the order defaults the thanks to "May đo" | PASS |  |
| S7d | S7d made-to-order default thanks (exact) | PASS |  |
| S8 | code bubble is blocked while empty ("Dán mã") | PASS |  |
| S8 | S8 bubble 1 = IG05 Giao Hàng Nhanh note (exact) | PASS |  |
| S8 | pasted code is in the field and bubble 2 shows it | PASS |  |
| S8 | S8 bubble 2 = the pasted tracking code only (exact) | PASS |  |
| S9 | S9 feedback request = IG06 (exact) | PASS |  |
| S10a | product sheet EN: "Chưa có bản EN" with explicit "Chép bản VI" / "Thêm bản EN" choices | PASS |  |
| S10a | main footer button is disabled ("Chưa có bản EN"), not a copy button | PASS |  |
| S10a | tapping the disabled main button copies nothing (no silent VI) | PASS |  |
| S10a | explicit "Chép bản VI" copies the VI text (exact) | PASS |  |
| S10a2 | EN card without EN text: notice + button names the language that will be copied ("Chép bản VI") | PASS |  |
| S10a2 | nothing was copied just by showing the card | PASS |  |
| S10a2 | explicit tap copies the VI bubble (IG03, exact) | PASS |  |
| S10b | tracking code bubble with no code: "Dán mã" does not copy | PASS |  |
| S10b | "Vừa size" without product/size shows the missing item on the button, not a copy button | PASS |  |
| S10b | tapping it does not copy | PASS |  |
| S10b2 | empty order: dock says "Chọn món", no copy button | PASS |  |
| S10b2 | tapping "Chọn món" copies nothing | PASS |  |
| S10b3 | order with a sizeless line: dock "Chọn size cho 1 món", message shows [size], badge empty | PASS |  |
| S10b3 | tapping "Chọn size" copies nothing | PASS |  |
| S10b4 | card sheet: "[size]" typed in the text disables the copy button ("Điền 1 chỗ nữa") | PASS |  |
| S10b4 | tapping the disabled sheet button copies nothing | PASS |  |
| S10b4 | stage capsule shows "Còn chỗ trống" (aria-disabled) while the edit has [size] | PASS |  |
| S10b4 | tapping the blocked capsule copies nothing | PASS |  |
| S10c | "Đã sửa" marker and "Khôi phục" appear after typing | PASS |  |
| S10c | edited text is exactly what is copied | PASS |  |
| S10c | Khôi phục puts the original text back in the box | PASS |  |
| S10c | after Khôi phục the original info is copied (exact) | PASS |  |
| S10c2 | card sheet: edited greeting is what is copied (exact) | PASS |  |
| S10c2 | stage card shows "Đã sửa" and the edited text | PASS |  |
| S10c2 | after Khôi phục the stage preview is the generated greeting again | PASS |  |
| S10d | IG01 lead-in equals the seed lead-in li-size-1 | PASS |  |
| S10d | lead-in strip is shown above the box with the chosen sentence | PASS |  |
| S10d | failed copy shows the error toast and the manual-copy sheet | PASS |  |
| S10d | lead-in is NOT remembered after a failed copy | PASS |  |
| S10d | clipboard = IG01 lead-in + blank line + Embroidery Pants chart (exact) | PASS |  |
| S10d | lead-in is remembered after the successful copy | PASS |  |
| S10d | after reload the remembered lead-in is already in the preview | PASS |  |
| S10e | unchecked set: a double tap (60ms apart) arms the guard but never copies the unchecked price | PASS |  |
| S10e | set bubble containing a typed "[giá]" placeholder must not be copied (R40) | **FAIL 4/4** | COPIED: Set này [giá] nhé |
| S10e | product sheet text containing a typed "[size]" placeholder must not be copied (R40) | **FAIL 4/4** | COPIED: Lace Top size [size] nhé |
| S10f | double-tap on Home tile: one stage, one greeting card | PASS |  |
| S10f | double-tap on "Tất cả mẫu": exactly one picker sheet | PASS |  |
| S10f | double-tap on a picker cell toggles (select+deselect) without duplicate tray rows | PASS |  |
| S10f | double-tap on "Xong": picker closed, exactly one line in the context | PASS |  |
| S10f | double-tap (100ms) on "Sửa": one card sheet, kept open | PASS |  |
| S10f | double-tap (100ms) on the context bar: one picker (no duplicate), second tap must not act on picker content | PASS |  |
| S10f | fast double tap (30ms) on "Sửa": no duplicate sheet, and the sheet stays open (second tap must not land on the dim) | **FLAKY 2/4** | {"sheets":0,"cards":["greet"],"lines":1,"dupes":[],"rows":0,"tray":0} second tap hit: cardedit>shdim |
| S10f | fast double tap (30ms) on "context bar": no duplicate sheet, and the sheet stays open (second tap must not land on the dim) | **FAIL 4/4** | {"sheets":0,"cards":["greet"],"lines":1,"dupes":[],"rows":0,"tray":0} second tap hit: ctxpick>shdim |
| S10f | rapid stage/language hopping leaves one card of each kind and no duplicate groups | PASS |  |
| S10f | double-tap (100ms) on "Phí ship": one sheet, kept open | **FAIL 4/4** | {"sheets":0,"cards":["order"],"lines":1,"dupes":[],"rows":1,"tray":0} hits: shipopen>shippick |
| S10f | double-tap on a ship option: sheet closes, one odock | PASS |  |
| S10f | double-tap on a product row: one product sheet | PASS |  |
| S10f | double-tap on Chép: no duplicate UI; clipboard writes are identical texts | PASS |  |
| S10f | double-tap on a suggested set: one set sheet, set created once | PASS |  |
| S10f | no console errors during all double/rapid-tap sequences (#debug=dupes active) | PASS |  |
| S10g | error toast "Chưa chép được…" is shown | PASS |  |
| S10g | manual-copy sheet "Chép tay" opens with exactly the message | PASS |  |
| S10g | the manual-copy text is pre-selected for long-press copy | PASS |  |
| S10g | step is NOT marked sent after a failed copy (no ✓ on Chào hỏi) | PASS |  |
| S10g | legacy execCommand fallback succeeds silently: success toast, no manual sheet | PASS |  |
| S10g | after the fallback success the step is marked sent | PASS |  |
| S10g2 | order copy failure: error + manual sheet with the full order message | PASS |  |
| S10g2 | failed order copy does not mark "copied" (no Check out suggestion) | PASS |  |
| S11 | logo image is present and loaded | PASS |  |
| S11 | settings gear is present in the header | PASS |  |
| S11 | floating bar has at most 4 items | PASS |  |
| S11 | order button label is "Đơn" | PASS |  |
| S11 | Home has a subtitle | PASS |  |
| S11 | Home > Chào hỏi is reachable in 1 tap | PASS |  |
| S11 | subtitle / helper line is shown on the Chào hỏi screen (R23) | **FAIL 4/4** | no subtitle element under the title on Trả lời nhanh screens |
| S11 | Home > Tư vấn size is reachable in 1 tap | PASS |  |
| S11 | subtitle / helper line is shown on the Tư vấn size screen (R23) | **FAIL 4/4** | no subtitle element under the title on Trả lời nhanh screens |
| S11 | Home > Xin thông tin is reachable in 1 tap | PASS |  |
| S11 | subtitle / helper line is shown on the Xin thông tin screen (R23) | **FAIL 4/4** | no subtitle element under the title on Trả lời nhanh screens |
| S11 | Home > Tạo đơn is reachable in 1 tap | PASS |  |
| S11 | subtitle / helper line is shown on the Tạo đơn screen (R23) | **FAIL 4/4** | no subtitle element under the title on Trả lời nhanh screens |
| S11 | Home > Check out is reachable in 1 tap | PASS |  |
| S11 | subtitle / helper line is shown on the Check out screen (R23) | **FAIL 4/4** | no subtitle element under the title on Trả lời nhanh screens |
| S11 | Home > Theo mẫu is reachable in 1 tap | PASS |  |
| S11 | Theo mẫu has a subtitle | PASS |  |
| S11 | Home > Theo set is reachable in 1 tap | PASS |  |
| S11 | Theo set has a subtitle | PASS |  |
| S11 | Theo mẫu lists all 20 products newest first (released desc) | PASS |  |
| S11 | collection headers in newest-first order with counts | PASS |  |
| S11 | filter segments Áo/Váy/Đầm/Quần show counts 11/6/2/1 | PASS |  |
| S11 | counts agree with data.json categories | PASS |  |
| S11 | filter top shows 11 rows | PASS |  |
| S11 | filter skirt shows 6 rows | PASS |  |
| S11 | filter dress shows 2 rows | PASS |  |
| S11 | filter pants shows 1 rows | PASS |  |
| S11 | 20 real product photos load (no 404, none broken) | PASS |  |
| S11 | no layout shift while photos load (CLS < 0.005) | PASS |  |
| S11 | control: swipe on a product row scrolls the list (test validity) | PASS |  |
| S11 | vertical swipe that starts on the Áo/Váy/Đầm/Quần chips scrolls the list | PASS |  |
| S11 | vertical swipe that starts on the photo strip scrolls the page | PASS |  |
| S11 | photo strip is not a horizontal scroller (no carousel fighting the page) | PASS |  |
| S11 | Đơn button shows a badge with the item count | PASS |  |
| S11 | no horizontal overflow on any screen | PASS |  |
| S12 | plain browser tab (bottom inset 0): bar gap 12pt above the app edge | PASS |  |
| S12 | plain browser tab (bottom inset 0): no uncovered strip at the bottom edge | PASS |  |
| S12 | plain browser tab that reports a 34pt inset: bar gap 24pt above the app edge | PASS |  |
| S12 | plain browser tab that reports a 34pt inset: no uncovered strip at the bottom edge | PASS |  |
| S12 | standalone home-screen app (59/34): bar gap 24pt above the app edge | PASS |  |
| S12 | standalone home-screen app (59/34): no uncovered strip at the bottom edge | PASS |  |
| S12 | root-padded host wrapper (html padding 59/34): bar gap 24pt above the app edge | PASS |  |
| S12 | root-padded host wrapper (html padding 59/34): app stays full-bleed (no double count) | PASS |  |
| S12 | root-padded host wrapper (html padding 59/34): no uncovered strip at the bottom edge | PASS |  |
| S12 | iframe wrapper: framed app uses a 12pt bar gap (host owns the edge) | PASS |  |
| S12 | iframe wrapper: no uncovered strip | PASS |  |
| S13 | Home: all 36 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Chào hỏi: all 31 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Tư vấn size: all 31 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Xin thông tin: all 29 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Tạo đơn: all 36 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Check out: all 36 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Theo mẫu: all 35 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Theo set: all 31 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Product sheet: all 57 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Set sheet: all 56 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Picker sheet: all 63 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Settings sheet: all 58 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Tư vấn size: all 35 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Tạo đơn: all 38 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Check out: all 37 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Theo mẫu: all 41 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Theo set: all 33 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Product sheet: all 60 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Set sheet: all 58 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| S13 | Picker sheet: all 68 sampled text/CTA pairs reach 4.5:1 | PASS |  |
| all | zero console errors / failed requests / HTTP >= 400 at the end of each scenario | 112/112 PASS | |
## 4. Requirement coverage (R01-R51)

| Requirements | Evidence | Status |
|---|---|---|
| R10, R11 content verbatim | S1-S9 exact clipboard (IG01-IG07 from docs/ig-reference, products from data.json); IG07 equals Lace Top info + link | covered, pass |
| R12 set bubbles | S4, S5: info of both + set price in ONE message, then labelled size charts, then IG02, then post link (only when a link exists); each bubble its own copy button | pass |
| R13 custom set price | S4b 800.000đ: line "Giá lẻ 380.000đ + 470.000đ = 850.000đ -> Giá set 800.000đ", message "Giá set: 800.000đ (tiết kiệm 50.000đ)" | pass |
| R14 order recap | S6: 420.000đ + 24.000đ = 444.000đ with the transfer-note instruction; qty 2, free, custom and courier ship | pass |
| R15 lead-ins | S1b, S10d: IG01 lead-in shows in preview and clipboard | pass |
| R16, R31 list | S11: newest first, collection headers, Áo/Váy/Đầm/Quần 11/6/2/1 | pass |
| R20-R23 IA / nav | S11: every function 1 tap from Home, bar 4 items, "Đơn" + badge, gear, logo; **subtitle missing on the five Trả lời nhanh screens** | partial (F-04) |
| R05 viewports, R06 dark | all scenarios x 393x852 / 430x932 x light/dark; S13 contrast >= 4.5:1 on 12 screens in both themes (lowest 4.88:1 on the "[size]" token, dark) | pass |
| R22 bar position | S12: gap 12 (plain tab), 24 (inset 34, standalone, root-padded wrapper), 12 (iframe); no uncovered strip | pass |
| R30 editable preview | S10c: edited text is what is copied, Khôi phục restores (product sheet and card sheet) | pass |
| R33 swipe | S11: vertical touch drag starting on chips and on the photo strip scrolls the page | pass |
| R36 no duplicates | S10f with #debug=dupes: no duplicated group/sheet in any double/rapid-tap sequence | pass (see F-01/F-02 for side effects) |
| R40 safety | language-missing blocks (S10a), unfilled blocks (S10b), failed copy not marked sent (S10g); **typed brackets in product sheet / set bubble are not blocked (F-05)** | partial |
| R37, R38, R39 | S6 message first; S3/S4 pickers; overall flow works but exceeds the tap budget in S1/S3 (F-06) | partial |
| R01-R04, R24, R25, R32, R34, R35 | not asserted by UAT (visual/brand judgement); screenshots in docs/qa/shots/ for review; the existing round4/5/6 suites assert colours and shapes | not UAT-tested |
| R50, R51 | delivery items outside this session (GitHub Pages setting, Instagram reading, KiotViet) | not testable here |

## 5. Failures (distinct), severity, reproduction, suspected cause

Severity: P0 wrong text copied or blocked flow; P1 broken UX; P2 polish. **No P0 found.**

### F-01 (P1) Double tap on "Phí ship" silently picks a shipping option
Result: S10f "double-tap (100ms) on Phí ship" fails 4/4 combos. Screenshot: docs/qa/shots/uat-S10f-393-light-FAIL2.jpg.
Repro: Home > Tạo đơn, add any item with a size (e.g. Lace Top M), set Phí ship to "Miễn phí" or "Khác…". Double tap the "Phí ship" row (two touch taps about 100 ms apart on the same point). The sheet opens, the second tap lands on the radio row under the finger ("Khách trả shipper"), selects it and closes the sheet: the ship line and total in the order message change without any toast.
Cause: sheets accept input while sliding in (380 ms). `pushSheet` only prevents a second push (src/app.js:793-797); rows are live immediately (`shippick`, src/app.js:1888-1894). The order preview and dock total do change, so a careful look catches it; a rushed copy would send the wrong shipping.

### F-02 (P2) Fast double tap on an opener closes the sheet it just opened
Result: S10f "fast double tap (30ms)" on the context bar fails 4/4, on "Sửa" 2 of 4 (timing dependent; run 1 1/4, run 3 2/4).
Repro: Chào hỏi with one product; double tap "Đổi/Chọn" on the context bar very quickly. The second tap hits `.dim` (`data-act="shdim"`), which calls `closeTop` (src/app.js:1784) while the sheet is still sliding; the sheet disappears. A probe at 120/350 ms gaps (not in the suite) showed the second tap landing on picker content under the finger (category chip `pkcat`, set pair `pkpair`), pre-selecting items. No duplicate sheet or group in any case (#debug=dupes clean).
Cause: same as F-01: no input shield during the open animation; `.dim` is tappable from the first frame (src/app.css:167-168).

### F-03 (P2) Typed `[size]` / `[giá]` is not blocked outside card sheets (R40)
Result: S10e, 2 assertions, 4/4 combos. Screenshots: uat-S10e-393-light-FAIL1.jpg, FAIL2.jpg.
Repro: Theo mẫu > Lace Top > type "Lace Top size [size] nhé" in the box > Chép thông tin: copied as typed. Same in a set bubble ("Set này [giá] nhé", after the price guard is passed).
Cause: `productCopy` (src/app.js:1208-1224) and `bubbleCopy` (src/app.js:1559-1587) have no `tokKeys` check; only the card sheet and stage cards block ("Còn chỗ trống", src/app.js:1239, 1342). The app itself never generates a bracket in those two sheets, so this needs a deliberate typed bracket.

### F-04 (P2) No subtitle on the Trả lời nhanh screens (R23)
Result: S11 five assertions (Chào hỏi, Tư vấn size, Xin thông tin, Tạo đơn, Check out) fail 4/4. Screenshots: uat-S11-393-light-FAIL1..5.jpg and uat-S11-393-light-stage-greet.jpg.
Repro: Home > any step: eyebrow "TRẢ LỜI NHANH · BƯỚC n/5" and title only. Home, Theo mẫu and Theo set do have one.
Cause: markup src/index.src.html:64 has no `.sub`; `renderStage` (src/app.js:587-592) sets only eyebrow and title. `STAGES[].desc` strings (src/compose.js:293-299) are no longer rendered. May be a deliberate v6 trade-off (the context bar plays the helper role), but R23 says every screen.

### F-05 (P2) Tap budget exceeded for "new customer asks about Lace Top" and "size chart for one product"
Result: S1 5 taps vs 3 (all combos; +1 scroll in the picker); S3 5 vs 3; S3 alternative through Theo mẫu 4 vs 3.
Repro S1: Home > Chào hỏi > Tất cả mẫu > Lace Top (scroll) > Xong > Chép. S3: Home > Tư vấn size > Tất cả mẫu > Lace Skirt Kem (scroll) > Xong > Chép. Text is correct (exact) in both.
Cause: with fresh storage the strip shows the 4 newest products (`suggest()`, src/app.js:429-439), not the one asked; the product must be found in the picker grid. Only Theo mẫu > row > Chép thông tin reaches 3 taps, and that sends info without the greeting (S1b: 8 taps for greeting + info + link that way). With her real recents the strip would usually shorten this; not simulated (fresh storage was required).

### F-06 (P2, existing suite) round6 "picker open at 4x CPU" budget missed
tests/ui/round6.mjs:433: cold 148 ms / 164 ms (assert < 140), warm median 67 / 74 ms (assert < 70), run 1 / run 2. Deterministic on this 4-vCPU sandbox, so it is either a perf regression since the budget was set or a slower machine than the one the budget came from. Not user-visible in my 1x numbers (picker opens in 34 ms to second frame at 1x, 70 ms at 4x). Suspected: the first-paint partial grid plus the second paint in `openPick` (src/app.js:1364-1370).

### Observations (not counted as failures)
- Strip labels truncate: "Fleur Slip Dress ·…" for the blue and yellow variants (see stage-greet screenshot), and "Embroidery" clips. The two dresses cannot be told apart by name in the strip, only by photo.
- Suggested sets start "price unchecked": the first bubble needs two taps (S4: 7 taps for 4 bubbles; S5: 6 for 3). Intended guard, but it is the one place a tap is spent without a visible reason before the first press.
- EN returning greeting joins the info with a blank line although the sheet's template has a space ("🤍 {{itemInfo}}"); I treated the blank line as acceptable.
- S4b, S5 etc. assume the label format "Lace Skirt · Kem" for size charts (OBS01 only says "ghi rõ tên từng món").
- Fuzz-test control coverage (dupes.mjs) varies run to run although seeded (timing).

## 6. What I could not test or only partly tested
- **Real iPhone / WebKit**: everything ran in Chromium with emulation. Not covered: iOS clipboard permission prompts, `navigator.clipboard` user-activation rules in Safari, haptics, the on-screen keyboard (only mocked in existing round5), Safari toolbar collapse, true env(safe-area) values (CDP override used), rubber-band scrolling, backdrop blur rendering, Dynamic Type, VoiceOver.
- Service worker and offline mode: blocked in every run (`serviceWorkers: 'block'`), so install, caching and update toast were not exercised.
- Pasting into Instagram and the Instagram message length limit (unverified in the app too).
- Fresh storage was mandatory, so returning-user effects (recents in the strip, remembered lead-ins and language across days) were only sampled (S10d reload).
- Contrast: computed from text nodes on their effective background (alpha composited); excludes icons, borders, placeholders, disabled controls and anything over photos. Large text uses 3:1.
- Swipe tests use CDP touch events (finger drag), not physical gestures; the strip test ran only where the page had scroll range.
- Brand/visual requirements (R01-R04, R24, R25, R32, R34, R35) need a human eye; screenshots are provided but not judged.
- Not done: GitHub Pages deployment (R50), Instagram reading and KiotViet collections (R51).
- UAT variants I chose where the brief was ambiguous: S3 uses Lace Skirt Kem (cream); S2 tests "Khách cũ" greeting plus the "Chỉ thông tin" variant; S6 ship 24.000đ is entered as a custom fee (default fee in settings is 25.000đ); "unedited Set placeholders" was interpreted as the unchecked suggested-set price guard plus typed placeholders.
- Test validity: a mutated build (changed one letter of IG03 and "Tổng cộng là") was served to the UAT and the exact-text assertions failed with the character offset, so the checks can fail.

## 7. Flakiness
- Existing suites: two runs each; identical pass/fail sets; only timing numbers inside titles differ.
- UAT: full run 1 versus final run: one assertion flipped ("fast double tap 30ms on Sửa", 393x852 dark: pass then fail; a timing race, see F-02). Everything else identical. (A middle run aborted S10 because of a bug in my new check; fixed and rerun.)

## 8. Artifacts
- tests/uat/uat.mjs (UAT), tests/uat/expect.mjs (independent expected texts), tests/uat/perf-throttle.mjs (4x CPU copy path).
- docs/qa/uat-results.json (every assertion, taps, notes, screenshot path), docs/qa/perf-throttle.json.
- docs/qa/shots/ (51 JPEGs, 393x852 light plus key dark screens; failing screens are `*-FAIL<n>` / `*-TAPS`, numbered in assertion order within the scenario; 430x932 failures are identical and not stored).
- Run: `node tests/uat/uat.mjs` (add `S4 S6 --quick` to limit, `--url` to point at another build); `node tests/uat/perf-throttle.mjs`.
