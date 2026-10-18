# Founder requirements ledger (for QC / UAT)

Source: the founder's own words across the project, translated. Each line is a testable requirement. IDs are stable so QC and UAT reports can reference them.

## Purpose and principles
- R01 Replace the manual flow (opening the CS Flow sheet, copying pieces, saved IG messages) with a mobile web app: pick the right text and copy it effortlessly to paste into an Instagram chat.
- R02 Key principle: minimal experience; reach and copy the right text with the fewest taps; clean and simple, not a powerful tool that takes time to learn.
- R03 Follow Apple's design system from principles down to components, icons and interactions, so it matches how she uses her iPhone.
- R04 Aesthetic and emotional design in line with Soft Embrace branding (fashion, soft, nostalgic, "Romantic Calm"), brand palette only.
- R05 Optimise for iPhone 14 Pro (393x852) and iPhone 15 Pro Max (430x932). Opens instantly, no flicker, smooth animation and transitions.
- R06 She uses dark mode on her phone: dark must be as polished as light.

## Content
- R10 Product info per item (VI and EN), size charts, notes, prices from the full CS Flow sheet (20 products, verbatim text).
- R11 Real phrases from her Instagram: size lead-in IG01, measurements request IG02, payment received IG03, thanks IG04, tracking IG05, feedback IG06, Lace Top info with post link IG07.
- R12 Set questions: when a customer asks about a 2-item set she sends info of both items and the price in ONE message, then a separate bubble with both size charts (labelled by product), then the measurement request, then optionally the post link. Each bubble has its own copy button.
- R13 Custom set price (override) now or later; default = sum of both items.
- R14 Order recap: items + shipping included in the total she collects, then the instruction to put the Instagram name in the transfer note and send a screenshot. The sheet's literal example total is wrong; compute from items and shipping.
- R15 Lead-in phrases ("Cho mình gửi bảng size bạn tham khảo nha") can be added simply from the app, never rigid, nothing to delete when not needed.
- R16 Collections: Fall 25 / Spring 26 / Summer 26 labels (inferred, she corrects); Theo mẫu sorted newest release first.

## Information architecture and navigation
- R20 Hierarchy: (1) Câu trả lời nhanh = Chào hỏi, Tư vấn size, Xin thông tin, Tạo đơn, Check out; (2) Thông tin sản phẩm = Theo mẫu, Theo set.
- R21 A Home screen to navigate quickly to any function.
- R22 Floating navigation bar (capsule), not docked; correctly positioned on every screen size (not too high); order button is a clear "Đơn" affordance, not a trash-can look.
- R23 Gear icon for settings; the real logo at the top; contextual changing subtitle on every screen (Claude-style helper text).
- R24 App icon uses a lighter brand colour (Vanilla + Jet logomark).
- R25 No brown anywhere (Liver removed); calm primary action colour (not rose/"dangerous").

## Interaction
- R30 Text boxes that show info before copying are directly editable and scroll inside (no "show all" expander); the copied text equals the box.
- R31 Product list: real photos, clear rows, tops vs skirts vs dresses vs pants distinction and filters.
- R32 Set list: shows which two items make the set (two photos).
- R33 No buggy swiping carousels; vertical scroll never fights with chip rows.
- R34 No accordion confusion in the product sheet; clear "where am I"; set sheet with proper spacing, consistent avatar shapes.
- R35 Controls are self-explanatory to non-experts without reading instructions (verbs, icons+words, no mystery outline chips).
- R36 No duplicate results or UI groups after taps.
- R37 Creating the order message (Tạo đơn) is obvious on open: the message she wants is visible first, no tour of many steps.
- R38 Sending a size chart makes picking the product easy (photo picker), including two products for a set.
- R39 The whole quick-reply flow is both beautiful and easy to use (v6 redesign).

## Safety (never send the wrong thing)
- R40 Language is always visible near copy; missing-language blocks with a choice; unfilled placeholders block copy; unedited placeholder sets never copy; stale context never silently attached.

## Delivery
- R50 Everything pushed to main of Kinneyjeff99/soft_embrace_reply; GitHub Pages enabled (needs her action in Settings → Pages).
- R51 Not yet possible from this cloud session: reading Instagram and organising KiotViet collections (needs a Claude Desktop session on her computer with the Chrome extension).
