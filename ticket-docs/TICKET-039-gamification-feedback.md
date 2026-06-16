# TICKET-039: Trao huy hiệu & thông báo chuỗi sau khi ôn tập

**Status:** ✅ Done
**Priority:** 🟠 P2 – Gamification
**Platforms:** Backend (API), Frontend
**Created:** June 15, 2026
**Nhóm gốc:** Nhóm 3 #9

---

## Vấn đề

- `submitReview` cập nhật streak & XP nhưng **không bao giờ gọi** `checkAndAwardBadges`
  → huy hiệu (FIRST_REVIEW, STREAK_*, WORDS_*) không bao giờ được trao trong luồng ôn tập.
- Người dùng tăng chuỗi / mở khoá huy hiệu nhưng **không nhận phản hồi tức thì** → mất
  cảm giác tưởng thưởng, giảm động lực quay lại.

## Mục tiêu

- Trao huy hiệu ngay trong `submitReview`.
- Trả về thông tin gamification (XP, chuỗi hiện tại, huy hiệu mới) để frontend hiển thị.
- Hiện toast tức thì khi tăng chuỗi hoặc mở khoá huy hiệu mới.

## Phạm vi

- `apps/backend/src/modules/review/review.module.ts`: import `GamificationModule`.
- `apps/backend/src/modules/review/review.service.ts`:
  - Inject `GamificationService`.
  - Sau khi cập nhật streak/XP, gọi `checkAndAwardBadges(userId)`.
  - `updateStreakAndXp` trả `{ xpGained, currentStreak, streakIncreased }`.
  - `submitReview` trả thêm `xpGained`, `currentStreak`, `streakIncreased`, `newBadges`.
- `apps/frontend/src/pages/ReviewPage.tsx`: đọc response, toast chuỗi (`review.streakToast`)
  và từng huy hiệu mới (`review.badgeToast` + nhãn `review.badges.*`).
- i18n: thêm `streakToast`, `badgeToast`, `badges.*` cho **en/vi/pt**.

## Acceptance Criteria

- [x] Huy hiệu được trao sau khi ôn (FIRST_REVIEW, STREAK_*, WORDS_*).
- [x] `submitReview` trả `newBadges`, `currentStreak`, `streakIncreased`, `xpGained`.
- [x] Toast hiện khi tăng chuỗi (>1) và khi mở khoá huy hiệu.
- [x] Nhãn huy hiệu đồng bộ 3 ngôn ngữ.
- [x] Typecheck pass (validate qua language server).
- [ ] Unit test backend cần chạy lại khi môi trường node được sửa.
