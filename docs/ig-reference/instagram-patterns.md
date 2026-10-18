# Instagram reply observations

Observed 17 October 2026, Soft Embrace account. Read-only inspection; no messages sent. Initial inbox and Lace example observed in Chrome before user requested Safari. All subsequent inspection uses Safari. No customer identifiers, measurements, addresses, payment screenshots or tracking numbers are retained here or seeded in the app.

## Patterns directly observed

1. **Product/set information:** full product descriptions with silhouette, material, color, individual price and size availability. Multiple items can be combined in one bubble, with a blank line between products.
2. **Size tables separately:** Lace Top + Lace Skirt information appears in one message, followed by a distinct message containing both full size charts, each labeled by product. Do not compress these into an automatic size recommendation.
3. **Measurement request separately:** `Nếu bạn cần tư vấn thêm về size, cho Soft xin số đo 3 vòng, chiều cao và cân nặng nhen 💕` recurs across recent conversations. No actual customer measurements are copied to app data.
4. **Butter + Embroidery:** combined information message uses Butter Top 390.000đ and Embroidery Pants 520.000đ. Then an optional image/post and the measurement request in a separate message. The Drive Shopee source's Butter 468.000đ explicitly includes a 20% markup; it must not overwrite the Instagram workbook price.
5. **Payment confirmation:** `ui dạ mình nhận được rùi ạ` followed by its own message `cảm ơn bạn nhìu, Soft sẽ tranh thủ gói đơn gửi đến bạn ạ 💗`. This is a manually chosen acknowledgement after the merchant has checked payment, never an automatic claim.
6. **Aftercare/tracking:** `dạ mình gửi mvđ của Giao Hàng Nhanh để bạn tiện theo dõi nhen` followed by a separate tracking code. Use an empty placeholder, never the actual observed code.
7. **Feedback:** `dạ có hình feedback xinh xinh bạn cho Soft ngắm với nhen 💗` after a satisfied customer.
8. **Actual order recap:** a sent recap for one Lace Trim Blouse (cream), size M, shows 420.000đ + shipping 24.000đ = 444.000đ, followed by the instruction to use the Instagram name as the transfer note and send a transfer screenshot. This confirms shipping can be included in the amount the shop collects. These are observed example amounts, not a universal current shipping rate.

## Voice and implementation implications

- Warm and conversational Vietnamese; Soft/mình/bạn, “nhen”, “nhìu”, restrained flower/heart imagery. Avoid salesy automatic claims.
- Source order recap logic and delivery information request from workbook. Its literal example total is incorrect; compute an integer VND total from actual chosen items and shipping mode instead.
- Support full information, size-only, and custom snippet combinations rather than one irreversible generated reply. Allow edit, reorder, delete, copy per bubble and full draft.
- Do not infer live stock, payment status, shipping charge, bank account or return policy from an old conversation or an empty workbook label.
- Native saved-message management was not inspected; this evidence describes sent-message patterns and supplied CS Flow.

