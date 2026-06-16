# TICKET-035: Rating 4 mức — dùng đủ thang recallQuality 0–5

**Status:** 🟡 In Progress
**Priority:** 🟠 P2 – Hiệu quả học
**Platforms:** Web, Zalo Mini App, Capacitor
**Created:** June 15, 2026
**Nhóm gốc:** Nhóm 1 #2 (độ phân giải confidence) + #3 (thang 0–5)

---

## Vấn đề

`RatingButtons.tsx` chỉ có 3 nút Hard(0) / OK(3) / Easy(5). Việc gộp này làm mất độ phân giải
khi lập lịch của ACRE (engine nhận `recallQuality` 0–5 và suy `confidenceLevel` theo đó).
Thiếu mức "Again" (quên hẳn, cần học lại ngay) và "Good" (nhớ được, bình thường).

## Mục tiêu

Đổi sang 4 nút kiểu Anki, phủ đủ thang 0–5:

| Nút | recallQuality | Ý nghĩa |
|---|---|---|
| Again | 0 | Quên hẳn |
| Hard | 2 | Nhớ chật vật |
| Good | 3 | Nhớ được |
| Easy | 5 | Nhớ dễ dàng |

`confidenceLevel` suy ra từ recallQuality giữ nguyên công thức hiện có nhưng nay có độ phân
giải tốt hơn (0→1, 2→2, 3→4, 5→5). Kết hợp với TICKET-034: Again/Hard (≤2) sẽ được re-queue.

## Phạm vi

- `components/review/RatingButtons.tsx`: 4 nút, layout `grid-cols-4`.
- i18n: thêm khóa `again`, `good` cho en/vi/pt.

## Acceptance Criteria

- [ ] Hiển thị 4 nút Again/Hard/Good/Easy.
- [ ] Bấm gửi đúng recallQuality 0/2/3/5.
- [ ] Again & Hard kích hoạt re-queue (TICKET-034).
- [ ] Lint/typecheck pass.
