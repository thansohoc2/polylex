# TICKET-040: Chế độ Context (điền từ vào câu ví dụ)

**Status:** ✅ Done
**Priority:** 🟡 P3 – Hiệu quả học (nâng cao)
**Platforms:** Frontend
**Created:** June 15, 2026
**Nhóm gốc:** Nhóm 3 #8

---

## Vấn đề

Backend hỗ trợ 6 chế độ ôn tập nhưng frontend mới chỉ dùng `flashcard` và
`type_answer`. Từ đã nhớ tốt vẫn chỉ lặp lại nhận diện / dịch nghĩa → thiếu bước
**vận dụng trong ngữ cảnh**, vốn quan trọng để chuyển từ "nhận ra" sang "dùng được".

## Mục tiêu

Thêm chế độ `context`: hiển thị câu ví dụ với từ mục tiêu bị che (`_____`), người
học gõ lại từ còn thiếu. Áp dụng cho các từ đã nhớ tốt và có câu ví dụ chứa từ.

## Phạm vi

- `apps/frontend/src/components/review/ContextExercise.tsx` (mới):
  - Che từ mục tiêu trong câu ví dụ (regex không phân biệt hoa thường).
  - Chấm điểm theo `term` 6(chấp nhận sai 1 ký tự qua Levenshtein).
  - Khi lộ đáp án: highlight từ trong câu, hiện phiên âm + bản dịch + phát âm câu.
  - Map điểm: đúng nhanh (<8s)=5/5, đúng chậm=4/4, gần đúng=3/3, sai=0/1.
  - Có nút "thật ra sai" và phím Enter để check/continue.
- `apps/frontend/src/pages/ReviewPage.tsx`:
  - `hasUsableContext(item)`: chỉ chọn context khi câu ví dụ chứa từ.
  - `pickMode`: `memoryStrength >= 0.6` + có context → `context`.
  - Thêm nhánh render `ContextExercise`.
- i18n: `contextPrompt`, `contextPlaceholder` cho **en/vi/pt**.

## Acceptance Criteria

- [x] Từ nhớ tốt + có câu ví dụ chứa từ sẽ chuyển sang chế độ điền chỗ trống.
- [x] Câu ví dụ hiển thị với từ bị che; chấm điểm chịu được sai 1 ký tự.
- [x] Lộ đáp án highlight từ trong câu, có phát âm câu + bản dịch.
- [x] Từ không có câu ví dụ phù hợp vẫn fallback type_answer/flashcard.
- [x] i18n đồng bộ 3 ngôn ngữ.
- [x] Typecheck pass (validate qua language server).
