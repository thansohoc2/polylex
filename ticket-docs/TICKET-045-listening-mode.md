# TICKET-045: Chế độ nghe (Listening Mode)

**Status:** ✅ Done
**Priority:** 🟠 P1 – Đa dạng bài tập
**Platforms:** Frontend
**Created:** June 15, 2026
**Nhóm gốc:** Hiến kế Nhóm C #7

---

## Vấn đề

`ReviewMode` của backend đã hỗ trợ `listening` và TTS/audio đã sẵn sàng, nhưng frontend
chưa có UI cho chế độ nghe → bài tập đơn điệu, thiếu kỹ năng nghe (rất quan trọng với
học ngôn ngữ).

## Mục tiêu

Thêm chế độ `listening`: phát âm thanh của từ/câu, người học **gõ lại từ vừa nghe**
(hoặc chọn đáp án), không hiển thị chữ trước khi trả lời.

## Phạm vi

- Frontend:
  - Component `ListeningExercise.tsx` (mẫu theo `TypeAnswer`/`ContextExercise`):
    - Tự phát audio khi vào (nút "nghe lại"), ẩn `term`.
    - Người dùng gõ lại từ; chấm điểm theo `term` (Levenshtein ≤ 1).
    - Khi lộ đáp án: hiện từ + phiên âm + nghĩa.
  - `ReviewPage.pickMode`: chèn `listening` vào escalation (vd từ đã quen, có audio,
    xen kẽ với context/type_answer để đa dạng).
  - Nhánh render `listening` trong `ReviewPage`.
  - i18n `listenPrompt`, `listenPlaceholder`, `replay` cho en/vi/pt.

## Acceptance Criteria

- [x] Chế độ nghe tự phát audio, ẩn chữ, có nút nghe lại.
- [x] Chấm điểm chịu được sai 1 ký tự; lộ đáp án đầy đủ.
- [x] Chỉ chọn `listening` khi từ có audio/đủ điều kiện; fallback hợp lý.
- [x] i18n đồng bộ 3 ngôn ngữ.
- [x] Typecheck pass (validate qua language server).

## PLAN TODO

- [x] **TODO-45.1**: Tạo component `ListeningExercise` cho bài tập nghe gõ lại
  - **File**: `apps/frontend/src/components/review/ListeningExercise.tsx`
  - **Thay đổi**:
    - autoplay audio khi vào câu mới
    - nút replay để nghe lại
    - ẩn term trước khi check
    - chấm điểm tolerant typo (Levenshtein <= 1)
    - reveal term + phonetic + translation + optional sentence playback
  - **Verify**: `get_errors` pass
  - **Real test**: PASS

- [x] **TODO-45.2**: Tích hợp listening mode vào `ReviewPage`
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Thay đổi**:
    - thêm `hasUsableListening()` kiểm tra điều kiện audio
    - cập nhật `pickMode()` để chọn `listening` cho từ đủ mạnh + có audio
    - thêm nhánh render `<ListeningExercise />`
  - **Verify**: frontend build pass
  - **Real test**: PASS

- [x] **TODO-45.3**: Đồng bộ i18n cho listening mode (en/vi/pt)
  - **File**: `apps/frontend/src/i18n/locales/en.json`, `apps/frontend/src/i18n/locales/vi.json`, `apps/frontend/src/i18n/locales/pt.json`
  - **Thay đổi**: thêm `review.listenPrompt`, `review.listenPlaceholder`, `review.replay`
  - **Verify**: frontend build pass
  - **Real test**: PASS

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Đã triển khai đầy đủ listening mode ở frontend: người dùng nghe audio trước, gõ lại từ, có replay, và nhận feedback/reveal đầy đủ sau khi chấm.

### Thống kê
- **Tổng TODO**: 3
- **Hoàn thành**: 3 ✅
- **Blocked**: 0 ⚠️

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-45.1 | Tạo ListeningExercise | ✅ Done | Autoplay + replay + grading |
| TODO-45.2 | Tích hợp vào ReviewPage | ✅ Done | pickMode + render listening |
| TODO-45.3 | Đồng bộ i18n en/vi/pt | ✅ Done | Thêm 3 key mới trong review |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/frontend/src/components/review/ListeningExercise.tsx` | Added | Component mới cho bài tập nghe |
| `apps/frontend/src/pages/ReviewPage.tsx` | Modified | Chọn/renders listening mode |
| `apps/frontend/src/i18n/locales/en.json` | Modified | Key listening tiếng Anh |
| `apps/frontend/src/i18n/locales/vi.json` | Modified | Key listening tiếng Việt |
| `apps/frontend/src/i18n/locales/pt.json` | Modified | Key listening tiếng Bồ Đào Nha |

### Verification
- [x] Type/language errors: ✅ (`get_errors` sạch cho file liên quan)
- [x] Frontend build: ✅ (`source ~/.nvm/nvm.sh && nvm use v23 && cd polylex-global/apps/frontend && npm run build`)

### Ghi chú
- Listening chỉ được chọn khi item có `audioUrl`; nếu không đủ điều kiện sẽ fallback sang `context` hoặc `type_answer`.
- Rule chọn mode hiện tại ưu tiên: `flashcard` (mới/yếu) → `listening` (memory >= 0.75 + có audio) → `context` (memory >= 0.6 + có sentence usable) → `type_answer`.
