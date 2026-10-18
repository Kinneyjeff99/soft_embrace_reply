# Soft Embrace — Reply (v2, round 3)

Web app (PWA) để chọn và copy tin nhắn trả lời khách Instagram. Màn hình đầu là **Câu trả lời nhanh** với 5 bước theo quy trình bán hàng (Chào hỏi · Tư vấn size · Xin thông tin · Tạo đơn · Check out); tab thứ hai là **Thông tin sản phẩm** (Theo mẫu / Theo set). Mọi khung xem trước đều sửa được ngay tại chỗ, nội dung trong khung chính là nội dung được chép.

- `dist/` — bản build chạy được (index.html, sw.js, manifest, icons)
- `src/` — mã nguồn: `app.js` (UI), `compose.js` (hàm thuần `composeCopy`, `STAGES`, hàm sửa/lưu mẫu; test được bằng Node), `app.css`, `index.src.html`, `data.json`
- `build.py` — `python3 build.py` ghi ra `dist/`
- `tools/make_icons.py` — dựng lại icon, splash và contact sheet `shots/icon-preview.png` từ `brand/logomark-FA.png` (nền Jet, logomark Baby powder)
- `tests/compose.test.mjs` — `node --test tests/compose.test.mjs` (không cần cài gì)
- `tests/ui/` — Playwright headless (`ui.mjs`, `list.mjs`) và script chụp `shots/` (`shots.mjs`); xem `lib.mjs` để đổi đường dẫn
- `docs/` — design spec v1, `design-v2.md`, audit, `v2-report.md` (nghiệm thu v2 và Round 2, Round 3), `ig-reference/` (tin nhắn Instagram thật)
- `shots/` — ảnh chụp màn hình hiện tại (393×852 và 430×932, sáng/tối)
