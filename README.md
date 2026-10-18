# Soft Embrace — Reply (v2, round 4)

Web app (PWA) để chọn và copy tin nhắn trả lời khách Instagram. App mở ra **Trang chủ**: vài ô lớn dẫn thẳng tới 5 bước trả lời nhanh (Chào hỏi · Tư vấn size · Xin thông tin · Tạo đơn · Check out) và Thông tin sản phẩm (Theo mẫu · Theo set). Một thanh nổi (capsule) ở dưới cùng: Trang chủ · Trả lời nhanh · Sản phẩm, cộng một nút tròn mở đơn đang soạn. Mỗi màn hình có một dòng gợi ý đổi theo ngữ cảnh. Sản phẩm có ảnh thật, sắp xếp mới nhất trước, lọc Áo/Váy/Đầm/Quần; set hiển thị cặp ảnh của hai món. Mọi khung xem trước đều sửa được ngay tại chỗ.

- `dist/` — bản build chạy được (index.html, sw.js, manifest, icons)
- `src/` — mã nguồn: `app.js` (UI), `compose.js` (hàm thuần `composeCopy`, `STAGES`, hàm sửa/lưu mẫu; test được bằng Node), `app.css`, `index.src.html`, `data.json`
- `build.py` — `python3 build.py` ghi ra `dist/` (tự chạy `tools/make_images.py` khi ảnh nguồn đổi)
- `tools/make_images.py` — tạo `dist/img/` (ảnh vuông 168 và 320 px WebP từ `assets/product-images/`, logo chữ `logo.webp` từ `brand/logo-primary-FA.png`) và ghi `img`, `tint`, `released`, `collection` vào `src/data.json`. Ảnh không bao giờ nhúng trong index.html
- `tools/make_icons.py` — dựng lại icon, splash và contact sheet `shots/icon-preview.png` (6 phương án ở 180/60/29 px) từ `brand/logomark-FA.png`; đang dùng Old Rose + Jet (`PICK`)
- `tests/compose.test.mjs` — `node --test tests/compose.test.mjs` (không cần cài gì)
- `tests/ui/` — Playwright headless (`ui.mjs`, `list.mjs`, `round4.mjs`) và script chụp `shots/` (`shots.mjs`); xem `lib.mjs` để đổi đường dẫn
- `docs/` — design spec v1, `design-v2.md`, audit, `v2-report.md` (nghiệm thu v2 và Round 2, 3, 4), `ig-reference/` (tin nhắn Instagram thật)
- `shots/` — ảnh chụp màn hình hiện tại (393×852 và 430×932, sáng/tối)
