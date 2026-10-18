# Fix report: design and performance audits

Build: `python3 build.py` produces `dist/index.html`, `manifest.webmanifest` and `sw.js`.
Verified with Playwright (Chromium, iPhone emulation, DPR 3) at 393x852 and 430x932, light and dark, plus reduced motion.
Result: all checks pass at both sizes, with zero console errors, warnings or failed requests. Source test scripts are not shipped.

## Design audit

| ID | Finding | Status | What changed |
|---|---|---|---|
| D P0-1 | Nav VI/EN thumb 0 px wide; control shows VI while app is EN | Fixed | `.seg.lang .th` has a width. `syncLangNav()` runs at boot and in `setLang`, with the thumb transition suppressed at boot. The active label is tinted. Verified with default language EN: aria-pressed, thumb `translateX(100%)`, width 42 px. |
| D P0-2 | Placeholder Set texts copyable and stored in recents/search | Fixed | `copyEntry`, `msgCopy`, `copyGreeting` and the row/open handlers all redirect placeholders to the Settings editor. Unedited sets render as compact 44 px rows "Set n · Chưa có câu — bấm để thêm" with a pencil. They are excluded from Search at query time, and from Gần đây (old placeholder and old-format recents are purged on load). The "derive real sets from data" idea is deferred, because it is a content decision. |
| D P0-3 | Greeting tiles attach a stale product | Fixed | Tile subtitle shows `kèm <product name>` or `Chỉ lời chào`. Only context from the last 5 minutes counts, and a timer re-syncs the tiles when it expires. A chip under the tiles shows the attached product (tap changes it, ✕ clears it). With no context the tile copies the greeting alone in 1 tap (slot and dangling `:`/`for {{item}}` stripped) and the toast says "chỉ chép lời chào". "Thêm thông tin mẫu ›" opens the picker and sets the context. The toast names the product (`Lời chào + …`). |
| D P0-4 | Truncated product text copies in one tap | Fixed | One shared guard (`truncIn`/`truncBox`) covers product copy, greetings, flow rows and the message sheet. A dialog opens with [Sửa nội dung] (goes straight to that product's editor), [Vẫn chép] and [Huỷ]. The product sheet callout has a "Sửa nội dung" button and the new wording. Recents replay through the same guard. |
| D P1-1 | Silent wrong-language fallback | Fixed | `copyEntry` opens the message sheet when the language is missing. The sheet shows a blocking note, and the button reads "Chép bản VI". A "Thêm bản EN" link opens the editor. For products and greetings, a dialog offers Thêm bản / Chép bản other / Huỷ. Flow rows show "Chưa có bản EN — chạm để chọn". The menu no longer offers a fallback-language copy. |
| D P1-2 | Toast before clipboard resolves | Fixed | The seal stays optimistic. The toast, the recents write and `done` run only after `writeText` resolves. On failure: error toast, seal rolled back, manual-copy sheet. Verified that no success toast appears on rejection. |
| D P1-3 | Recents/search re-copy stale snapshots | Fixed | Recents store references `{t,id,w,pid}` and rebuild the text through the normal copy paths, so placeholder, truncation, language and context guards apply. Orders are no longer recorded. |
| D P1-4 | Bank toggle on with no bank; no QR flow | Partly fixed | With no account set, the row becomes "Thêm STK để kèm vào đơn ›", which opens Settings › Chuyển khoản. The order toast adds "Nhớ gửi mã QR nhé". The QR sheet itself is not built (new feature): deferred. |
| D P1-5 | Toast covers and blocks controls | Fixed | `.toast{pointer-events:none}` (the undo button stays tappable). The toast sits above the total bar on Đơn, above the action bar (and the chip row on product sheets) in sheets, and is cleared on sheet open/close. A toast fired in the same gesture, such as copy-and-close, is kept. |
| D P1-6 | Fill controls below the fold in message sheet | Fixed | Sheets with tokens open at the large detent. Verified that the Size chips sit above the action bar. |
| D P1-7 | Product sheet clips callout; chips below fold | Fixed | Paper capped at `min(38vh,320px)` and scrollable. "Thêm vào đơn" chips moved into the action bar. |
| D P1-8 | Nav bar loses scrolled state after Đơn re-render | Fixed | Title and sentinel render once per tab; only the body container re-renders (Mẫu, Kịch bản and Đơn). Sentinel observation is idempotent. Entries from hidden tabs are ignored. |
| D P1-9 | Green copied state | Fixed | `.btn.copied` uses the accent pressed token. Sheet and total-bar buttons crossfade to ✓ "Đã chép". |
| D P1-10 | Language invisible at copy point | Fixed | `body.lang-en` puts an EN badge on copy buttons only (not on pencil or clip buttons). |
| D P1-11 | Swipe actions missing | Fixed | Product rows swipe left to reveal Size and Đơn. Order lines reveal Xoá. Direction lock at 10 px (dx > 1.2·dy), snap at half, click suppressed after a drag, one row open at a time. Rows are `touch-action:pan-y`. Verified by touch drag plus tap on Size. |
| D P2-1 | Gần đây misaligned | Fixed | Scroll padding added, inline padding removed. |
| D P2-2 | Lang control off the grid | Fixed | Bar right padding is the margin. |
| D P2-3 | Segment hit width under 44 | Fixed | Width 88 px. |
| D P2-4, P2-5 | Price truncation; duplicate colour | Fixed | Price first and never ellipsized; variants show only swatch and price. |
| D P2-6 | Six red "Cần kiểm tra" pills | Deferred | Brand call. The pills now also explain the dialog. |
| D P2-7 | Attach tags clutter | Fixed | Replaced by a small clip glyph with a visually hidden label. |
| D P2-8 | Reminder uses success glyph | Fixed | `toast` takes an `icon`. Used for attach reminders. |
| D P2-9 | Thank-card label wraps | Fixed | `nowrap`, 15 px. |
| D P2-10 | Ship control cramped | Fixed | 13 px labels. |
| D P2-11 | Picker separators | Fixed | |
| D P2-12 | Double ✕ in search | Fixed | `:has(:placeholder-shown)`. |
| D P2-13 | Menu group divider | Fixed | `it[3]` now emits `.dv`. |
| D P2-14 | Dark Noir dot invisible | Fixed | |
| D P2-15 | Footer line under tab bar | Fixed | The line is removed; the toast carries the message. |
| D P2-16 | Microcopy | Fixed | Khách quen, wording of the callout. The subtitle "Đã từng mua" is replaced by the product name. |
| D P2-17 | Emoji discs | Won't fix | Data and brand decision. |

## Performance audit

| ID | Finding | Status | What changed |
|---|---|---|---|
| P P0-1 | Copy waits for tab re-renders | Fixed | Copy runs first. Context updates in rAF+timeout. `setCtx` is a no-op when nothing changed. Only the visible tab renders, others are marked dirty and flushed in `go()`. `hap()` runs after `writeText`, with no double vibrate. |
| P P0-2 | No service worker | Fixed | `build.py` emits `dist/sw.js` (cache-first shell, `ignoreSearch`, content-hash cache `se-<hash>`, old caches deleted, skipWaiting/claim). It is registered on load with the relative URL `sw.js`, and all shell URLs are relative. A "Có bản mới" toast appears on update. Verified: it installs, controls the page after reload, and an offline launch of `?source=pwa` renders with no errors. Not yet tested from a real sub-path host. |
| P P1-1 | Tab switch restyles whole tab | Fixed | `content-visibility:hidden` for inactive tabs, with `visibility` as fallback. |
| P P1-2 | Pre-render long task | Fixed | Flow, Order, search index and safe-area measure each run as a separate idle task. |
| P P1-3 | Gần đây insertion jump | Fixed | Block is always rendered with a ghost chip. Verified the tapped row moves 0 px on the first copy. |
| P P1-4 | CLS 0.094 after Chép đơn | Fixed | The delayed `renderOrder` is removed. The thank-you card appears on the next visit or when the app is foregrounded. Verified: layout position identical before and after +1.8 s. |
| P P1-5 | content-visibility granularity/jump | Fixed | `.sec` no longer uses it. Lists over 20 rows use 20-row `.chunk` blocks. Stable shells avoid re-created placeholders. |
| P P1-6 | Full-screen blur on menu | Fixed | Solid dim, no backdrop-filter. |
| P P1-7 | Sheet forced layout + extra frames | Fixed | `H = innerHeight - safeTop - 10`, with safe-top measured once and re-measured on resize. The slide uses a WAAPI animation started immediately (no double rAF, no forced style). Focus restore moved into the post-slide timeout. Verified computed H equals real height. |
| P P1-8 | Search under keyboard, renders per input | Fixed | `--kb` is applied to `#search` padding. One render per frame, skipped if the text is identical, with a `compositionend` hook for Telex. |
| P P2-1 | `hap` forced layout | Fixed | Moved after the write; duplicate vibrate removed. |
| P P2-2 | scrollTop read/write around innerHTML | Fixed | Removed (body-only re-render). |
| P P2-3 | IO observes detached sentinels | Fixed | Stable sentinels. |
| P P2-4 | Press highlight flash | Fixed | 70 ms delay. |
| P P2-5 | Too many blur layers | Partly fixed | Total bar opaque, toast blur and menu blur removed. |
| P P2-6 | Unchanged lists re-render | Partly fixed | Hidden tabs are deferred through dirty flags. Qty and favourite taps still re-render the visible tab: deferred, 8-16 ms. |
| P P2-7 | Seed after shell | Fixed | Seed JSON moved into `<head>`. |
| P P2-8 | `linear()` no fallback | Fixed | cubic-bezier fallback plus `@supports`. |
| P P2-9 | Detent snap after focus | Fixed | Snap on `pointerdown` as well. |
| P P2-10 | Minifier | Partly fixed | No esbuild/terser offline. Replaced with a safe in-repo tokenizer minifier (strings, regex and comments aware). JS: 90.3 KB source to 73.5 KB. |
| P P2-11 | Splash, status-bar glyphs, behind repaint | Deferred | Needs a real device. |

## Numbers (headless Chromium, 4x CPU throttle)

| Metric | Before | After |
|---|---|---|
| Copy product, synchronous click dispatch, base | 25-59 ms (median about 28) | median 6 ms (4.6-7); first cold click 20 ms |
| Copy product, handler to first frame, base | 34.7 ms | 11.8 ms |
| Copy product, handler, 208 products | 197 ms, long task 250 ms | 40 ms, no long task |
| Tab switch, click to first frame, base | 20 ms | 12 ms |
| Tab switch, click to first frame, 208 products | 105 ms, long task 106 ms | 21 ms, no long task |
| First-copy row jump | 69 px | 0 px |
| CLS after Chép đơn | 0.094 | 0 |
| Open product sheet, handler | 57 ms | 54 ms (render dominates; first moving frame is now the next frame) |
| Offline launch | fails | works |
| dist/index.html raw / gzip | 130.1 / 36.2 KB | 133.4 / 38.3 KB (more features; JS minified smaller) |

The <16 ms target is met by the median (6 ms). The first click after launch is 20 ms, from JIT warm-up.

## Needs a real device

- Haptic from the `<input switch>` trick when called after the `writeText` call. It is still synchronous in the gesture, but iOS is the judge.
- `content-visibility:hidden` tab scroll retention on iOS 18, and the fallback path on older iOS.
- WAAPI sheet slide with the app scale-behind, and `touch-action:pan-y` swipes on iOS Safari.
- The SW update flow and offline launch from the Home Screen, and hosting from a sub-path.
- Keyboard height and Telex behaviour in search.
- Status-bar glyphs (`black-translucent`) and dark splash images.
- Greeting-only copy still reads "…thông tin sản phẩm ạ" (colon removed). Review this wording.
