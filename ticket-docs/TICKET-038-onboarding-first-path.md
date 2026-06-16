# TICKET-038: Onboarding tạo lộ trình học đầu tiên

**Status:** ✅ Done
**Priority:** 🟠 P2 – Trải nghiệm người mới
**Platforms:** Frontend
**Created:** June 15, 2026
**Nhóm gốc:** Nhóm 2 #5

---

## Vấn đề

Onboarding cũ chỉ hỏi **ngôn ngữ mẹ đẻ** rồi đẩy thẳng người dùng vào `/dashboard`
(hoặc roadmap trống). Người mới chưa có ngôn ngữ học, chưa có lộ trình, chưa có từ nào
để ôn → màn hình trống, không biết bắt đầu từ đâu, dễ rời bỏ.

## Mục tiêu

Hoàn tất onboarding với đủ thông tin để người dùng có nội dung học ngay:

- Ngôn ngữ mẹ đẻ.
- Ngôn ngữ muốn học (loại trừ ngôn ngữ mẹ đẻ).
- Mục tiêu học (preset chips + nhập tự do).
- Trình độ CEFR hiện tại.

Sau đó tự động tạo lộ trình học đầu tiên và đưa người dùng tới `/roadmap`.

## Phạm vi

- `apps/frontend/src/pages/OnboardingPage.tsx`:
  - Chuyển thành luồng 2 bước (chọn mẹ đẻ → chọn mục tiêu).
  - Bước 2: chọn ngôn ngữ học, mục tiêu (5 preset + textarea), CEFR (A1–C2).
  - Khi hoàn tất: `updateMe({ nativeLanguageCode })` →
    `addLanguage({ languageCode, targetCefrLevel })` →
    `pathApi.generate({ goal, targetLanguageCode, nativeLanguageCode, targetCefrLevel })`.
  - Lỗi tạo lộ trình không chặn onboarding (toast cảnh báo, vẫn vào app).
  - Có nút "Bỏ qua, tạo sau" (chỉ lưu ngôn ngữ mẹ đẻ → `/dashboard`) và "Quay lại".

## Acceptance Criteria

- [x] Người mới chọn được mẹ đẻ + ngôn ngữ học + mục tiêu + CEFR.
- [x] Hoàn tất sẽ tạo learning language + lộ trình đầu tiên, điều hướng tới `/roadmap`.
- [x] Tạo lộ trình thất bại không làm hỏng onboarding (vẫn vào được app).
- [x] Có đường thoát nhanh "Bỏ qua, tạo sau".
- [x] Typecheck pass (validate qua language server).
