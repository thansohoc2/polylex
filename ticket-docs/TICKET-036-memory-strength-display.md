# TICKET-036: Hiển thị độ thuộc (memoryStrength) trên thẻ review

**Status:** 🟡 In Progress
**Priority:** 🟢 P3 – Trải nghiệm / động lực
**Platforms:** Web, Zalo Mini App, Capacitor
**Created:** June 15, 2026
**Nhóm gốc:** Nhóm 2 #6

---

## Vấn đề

`memoryStrength` được tính và trả về trên mỗi từ nhưng chỉ hiển thị ở Dashboard
(`DueVocabItem`). Trong phiên học (FlashCard / TypeAnswer) người dùng không thấy mức độ
thuộc → thiếu phản hồi và động lực.

## Mục tiêu

Hiển thị một chỉ báo độ thuộc gọn (thanh + %) trên thẻ review, dùng quy ước màu giống
Dashboard: xanh (mạnh > 0.7) → vàng (0.4–0.7) → đỏ (yếu).

## Phạm vi

- Component mới dùng chung: `components/ui/StrengthBar.tsx`.
- Gắn vào `components/review/FlashCard.tsx` và `components/review/TypeAnswer.tsx`.
- i18n: khóa `review.strength`.

## Acceptance Criteria

- [ ] Thẻ flashcard và type_answer hiển thị thanh độ thuộc + %.
- [ ] Màu phản ánh đúng ngưỡng.
- [ ] Lint/typecheck pass.
