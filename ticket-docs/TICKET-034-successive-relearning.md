# TICKET-034: Successive Relearning — Học lại từ sai ngay trong phiên

**Status:** 🟡 In Progress
**Priority:** 🔥 P1 – Hiệu quả học
**Platforms:** Web, Zalo Mini App, Capacitor
**Created:** June 15, 2026
**Nhóm gốc:** Nhóm 2 #7

---

## Vấn đề

Trong `ReviewPage.tsx`, `handleRate` chỉ làm `current + 1` trên một snapshot queue cố định.
Từ trả lời sai (recallQuality thấp) bị ACRE đẩy lịch ~10 phút sau nhưng **không quay lại
trong phiên hiện tại** → mất cơ hội "successive relearning" (củng cố lặp lại trong cùng
phiên), vốn là một trong những yếu tố tăng ghi nhớ mạnh nhất.

## Mục tiêu

Khi người học trả lời sai/khó (`recallQuality ≤ 2`), từ đó được **chèn lại** vào hàng đợi
phiên để xuất hiện lại sau vài thẻ, tối đa 2 lần lặp lại / từ, cho tới khi nhớ được.

## Phạm vi

- Chỉ frontend: `pages/ReviewPage.tsx`.
- Theo dõi số lần relearn mỗi từ bằng ref (không gọi thêm API ngoài submit hiện có).
- Mỗi lần thử lại vẫn submit (ghi nhận nỗ lực thật cho ACRE).
- Chèn lại cách vị trí hiện tại ~4 thẻ (hoặc cuối hàng đợi nếu queue ngắn).

## Acceptance Criteria

- [ ] Trả lời sai → từ xuất hiện lại trong cùng phiên (tối đa 2 lần).
- [ ] Trả lời đúng → không lặp lại.
- [ ] Không lặp vô hạn; progress vẫn tiến triển và phiên kết thúc được.
- [ ] Lint/typecheck pass.
