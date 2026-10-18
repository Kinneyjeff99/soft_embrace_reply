# Soft Embrace — Reply (v2)

Web app (PWA) để chọn và copy tin nhắn trả lời khách Instagram. Một màn hình "Khách đang hỏi gì?", chạm mẫu rồi chạm chép.

- `dist/` — bản build chạy được (index.html, sw.js, manifest, icons)
- `src/` — mã nguồn: `app.js` (UI), `compose.js` (hàm thuần `composeCopy`, dùng chung cho preview và clipboard, test được bằng Node), `app.css`, `index.src.html`, `data.json`
- `build.py` — `python3 build.py` ghi ra `dist/`
- `tests/compose.test.mjs` — `node --test tests/compose.test.mjs` (không cần cài gì)
- `tests/ui/` — kiểm tra headless Chromium (Playwright) và script chụp `shots/`; xem đầu file để đổi đường dẫn
- `docs/` — design spec v1, `design-v2.md`, audit, `v2-report.md` (kết quả nghiệm thu v2), `ig-reference/` (tin nhắn Instagram thật)
- `shots/` — ảnh chụp màn hình v2 (393×852 và 430×932, sáng/tối)
