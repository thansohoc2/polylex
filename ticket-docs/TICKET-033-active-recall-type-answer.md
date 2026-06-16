# TICKET-033: Active Recall — Chế độ "type_answer" & lựa chọn mode theo độ thuộc

**Status:** 🟡 In Progress
**Priority:** 🔥 P1 – Hiệu quả học (high impact)
**Platforms:** Web, Zalo Mini App, Capacitor (iOS/Android)
**Created:** June 15, 2026

---

## Bối cảnh & vấn đề

Engine ACRE ở `apps/backend/src/modules/review/acre/acre.engine.ts` đã hỗ trợ đầy đủ
6 chế độ học, đo `responseTimeMs`, `confidenceLevel`, phát hiện leech và **tự gợi ý chế độ
kế tiếp** (`recommendedMode`). Tuy nhiên frontend chỉ render **một** chế độ duy nhất là
`flashcard` (hardcode `useState<ReviewMode>('flashcard')` trong `ReviewPage.tsx`), nghĩa là:

- Người học chỉ "lật thẻ rồi tự chấm" → đây là **recognition (thụ động)**, kém hiệu quả hơn
  nhiều so với **active recall (chủ động)**.
- `recommendedMode` mà ACRE trả về sau mỗi lần review **bị bỏ đi hoàn toàn**.
- `confidenceLevel` được suy diễn máy móc từ `recallQuality` thay vì là tín hiệu thật.

Nghiên cứu về trí nhớ (testing effect / active recall) cho thấy việc **chủ động truy hồi**
(gõ lại đáp án) củng cố trí nhớ mạnh hơn đáng kể so với chỉ nhận diện. Đây là thay đổi có
tác động lớn nhất tới "học hiệu quả".

## Mục tiêu

1. Thêm chế độ **`type_answer`**: người học gõ lại nghĩa của từ, hệ thống tự chấm.
2. **Chọn chế độ theo độ thuộc của từ** (mirror logic `recommendMode` của ACRE):
   - Từ mới / yếu (`reviewCount === 0` hoặc `memoryStrength < 0.25`) → `flashcard` (giai đoạn làm quen).
   - Từ đã học (`reviewCount > 0` và `memoryStrength ≥ 0.25`) → `type_answer` (active recall).
3. Gửi đúng `reviewMode` + `confidenceLevel` **thật** lên backend để ACRE lập lịch chính xác hơn.

## Phạm vi (in scope)

- Component mới: `components/review/TypeAnswer.tsx`.
- Sửa `pages/ReviewPage.tsx`: chọn mode theo từng item, render `TypeAnswer` hoặc `FlashCard`.
- Chấm điểm `type_answer` phía client:
  - So khớp chuẩn hoá (trim + lowercase) với **bất kỳ** bản dịch nào của từ.
  - Chấp nhận sai chính tả nhẹ (Levenshtein ≤ 1) → coi là "gần đúng".
  - Map kết quả → `recallQuality` + `confidenceLevel`:
    | Kết quả | recallQuality | confidenceLevel |
    |---|---|---|
    | Đúng & nhanh (< 6s) | 5 | 5 |
    | Đúng & chậm | 4 | 4 |
    | Gần đúng (typo) | 3 | 3 |
    | Sai | 0 | 1 |
- i18n cho 3 ngôn ngữ: `en`, `vi`, `pt`.

## Ngoài phạm vi (out of scope)

- 4 chế độ còn lại (`reverse`, `listening`, `context`, `sentence`) — ticket sau.
- Thay đổi engine ACRE hay schema DB (không cần — backend đã sẵn sàng).

## Tiêu chí hoàn thành (Acceptance Criteria)

- [ ] Từ đang ôn (đã review ≥ 1 lần) hiển thị ô nhập để gõ đáp án thay vì chỉ lật thẻ.
- [ ] Gõ đúng (kể cả sai chính tả nhẹ) được ghi nhận là đúng; gõ sai hiển thị đáp án đúng.
- [ ] Request `POST /review/submit` gửi `reviewMode: 'type_answer'` cho các từ này.
- [ ] Từ mới vẫn dùng flashcard để làm quen.
- [ ] Có audio phát đáp án khi reveal; nút Enter để nộp.
- [ ] Lint + build frontend pass.
