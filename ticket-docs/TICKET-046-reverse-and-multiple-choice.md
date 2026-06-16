# TICKET-046: Chế độ đảo & trắc nghiệm nhanh (Reverse + Multiple Choice)

**Status:** ✅ Done
**Priority:** 🟠 P1 – Đa dạng bài tập / giảm ma sát
**Platforms:** Frontend
**Created:** June 15, 2026
**Nhóm gốc:** Hiến kế Nhóm C #8

---

## Vấn đề

Bài tập hiện thiên về gõ (type_answer/context) — ma sát cao với từ mới và trên mobile.
`ReviewMode` đã có `reverse`; cần thêm dạng trắc nghiệm nhanh để giảm ma sát và đa dạng.

## Mục tiêu

- **Reverse mode**: cho nghĩa → chọn/gõ từ đúng (chiều ngược lại của type_answer).
- **Multiple choice**: hiển thị từ + 4 lựa chọn nghĩa (1 đúng, 3 nhiễu), chạm để chọn —
  phù hợp cho từ mới/yếu để khởi động nhẹ nhàng.

## Phạm vi

- Frontend:
  - Component `MultipleChoiceExercise.tsx`: sinh distractor từ các bản dịch khác trong
    hàng đợi (cùng ngôn ngữ); chấm đúng/sai → map recallQuality.
  - (Tùy chọn) Component/biến thể `reverse` dùng lại `TypeAnswer` với chiều đảo.
  - `ReviewPage.pickMode`: dùng `multiple_choice`/`reverse` cho từ mới/yếu thay vì luôn
    flashcard, tạo nhịp đa dạng.
  - i18n cho prompt trắc nghiệm; bổ sung `ReviewMode` mới nếu cần (đồng bộ shared-types
    + backend ACRE recommendMode).
- Shared-types/Backend: nếu thêm `multiple_choice` vào `ReviewMode`, cập nhật union +
  ACRE để chấp nhận mode mới.

## Acceptance Criteria

- [x] Trắc nghiệm 4 lựa chọn với distractor hợp lý, chạm chọn, phản hồi đúng/sai.
- [x] Reverse mode hoạt động (nghĩa → từ).
- [x] `pickMode` xen kẽ các mode để tránh đơn điệu.
- [x] `ReviewMode` đồng bộ giữa frontend/backend/shared-types nếu mở rộng.
- [x] i18n đồng bộ 3 ngôn ngữ; typecheck pass.

## PLAN TODO

- [x] **TODO-46.1**: Tạo `MultipleChoiceExercise` với 4 lựa chọn
  - **File**: `apps/frontend/src/components/review/MultipleChoiceExercise.tsx`
  - **Thay đổi**:
    - hiển thị từ + 4 lựa chọn nghĩa (1 đúng, 3 nhiễu)
    - sinh distractor từ bản dịch của các item khác trong queue
    - phản hồi đúng/sai trực tiếp trên option
    - map recallQuality/confidence khi submit
  - **Verify**: `get_errors` pass
  - **Real test**: PASS

- [x] **TODO-46.2**: Tạo `ReverseExercise` (nghĩa → gõ từ gốc)
  - **File**: `apps/frontend/src/components/review/ReverseExercise.tsx`
  - **Thay đổi**:
    - hiển thị nghĩa làm prompt
    - nhập từ gốc, chấm typo-tolerant (Levenshtein <= 1)
    - reveal term + phonetic + audio
  - **Verify**: `get_errors` pass
  - **Real test**: PASS

- [x] **TODO-46.3**: Tích hợp mode mới vào `ReviewPage` + đa dạng hóa `pickMode`
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Thay đổi**:
    - thêm local UI mode `multiple_choice`
    - `pickMode` xen kẽ: flashcard/multiple_choice/reverse/listening/context/type_answer
    - map submit mode: `multiple_choice` dùng `reverse` để tương thích backend hiện tại
    - thêm nhánh render cho `ReverseExercise` và `MultipleChoiceExercise`
  - **Verify**: frontend build pass
  - **Real test**: PASS

- [x] **TODO-46.4**: Đồng bộ i18n cho reverse + multiple choice (en/vi/pt)
  - **File**: `apps/frontend/src/i18n/locales/en.json`, `apps/frontend/src/i18n/locales/vi.json`, `apps/frontend/src/i18n/locales/pt.json`
  - **Thay đổi**: thêm `review.reversePrompt`, `review.reversePlaceholder`, `review.multipleChoicePrompt`
  - **Verify**: frontend build pass
  - **Real test**: PASS

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Đã hoàn thành reverse + multiple choice để giảm ma sát trên mobile và tăng đa dạng bài tập. Luồng review hiện có thể luân phiên nhiều mode thay vì chỉ gõ/flashcard.

### Thống kê
- **Tổng TODO**: 4
- **Hoàn thành**: 4 ✅
- **Blocked**: 0 ⚠️

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-46.1 | Multiple choice 4 lựa chọn | ✅ Done | distractor từ queue |
| TODO-46.2 | Reverse exercise | ✅ Done | nghĩa -> gõ từ |
| TODO-46.3 | Tích hợp vào ReviewPage | ✅ Done | pickMode đa dạng + submit mapping |
| TODO-46.4 | i18n en/vi/pt | ✅ Done | thêm key reverse/MC |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/frontend/src/components/review/MultipleChoiceExercise.tsx` | Added | Trắc nghiệm nhanh 4 lựa chọn |
| `apps/frontend/src/components/review/ReverseExercise.tsx` | Added | Reverse mode nghĩa -> từ |
| `apps/frontend/src/pages/ReviewPage.tsx` | Modified | Điều phối mode + render component mới |
| `apps/frontend/src/i18n/locales/en.json` | Modified | Key reverse/MC tiếng Anh |
| `apps/frontend/src/i18n/locales/vi.json` | Modified | Key reverse/MC tiếng Việt |
| `apps/frontend/src/i18n/locales/pt.json` | Modified | Key reverse/MC tiếng Bồ Đào Nha |

### Verification
- [x] Type/language errors: ✅ (`get_errors` sạch)
- [x] Frontend build: ✅ (`source ~/.nvm/nvm.sh && nvm use v23 && cd polylex-global/apps/frontend && npm run build`)

### Ghi chú
- Không mở rộng `ReviewMode` ở backend/shared-types trong ticket này; `multiple_choice` là UI mode cục bộ và được map về `reverse` khi submit để giữ tương thích API hiện tại.
