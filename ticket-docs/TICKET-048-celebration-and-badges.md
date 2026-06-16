# TICKET-048: Mừng hoàn thành & mở rộng huy hiệu (Celebration + Badges)

**Status:** ✅ Done
**Priority:** 🟠 P1 – Tưởng thưởng & động lực
**Platforms:** Backend (API), Frontend
**Created:** June 15, 2026
**Nhóm gốc:** Hiến kế Nhóm D #11

---

## Vấn đề

Hoàn thành phiên ôn/stage hiện kết thúc khá "phẳng", thiếu khoảnh khắc tưởng thưởng.
Bộ huy hiệu còn ít (9 badge) và chưa bao phủ nhiều hành vi đáng khích lệ.

## Mục tiêu

- **Màn celebration** khi hoàn thành phiên ôn và khi hoàn thành stage (confetti/animation,
  tóm tắt XP, độ chính xác, chuỗi, huy hiệu mới).
- **Mở rộng huy hiệu** theo hành vi: cú đêm, dậy sớm, phiên hoàn hảo 100%, học cuối tuần,
  mốc chuỗi/level mới...

## Phạm vi

- Backend:
  - Bổ sung badge mới vào `BADGES` + logic trong `checkAndAwardBadges`
    (vd `PERFECT_SESSION`, `NIGHT_OWL`, `EARLY_BIRD`, `WEEKEND_WARRIOR`).
  - Cần dữ liệu phiên (độ chính xác, thời điểm) — truyền từ `submitReview`/session nếu cần.
- Frontend:
  - Component `SessionCelebration` hiển thị ở màn `done` của `ReviewPage` + sau khi
    hoàn thành stage; confetti + tóm tắt + huy hiệu mới (đã có `newBadges` từ TICKET-039).
  - Nhãn badge mới trong i18n `review.badges.*` (en/vi/pt).

## Acceptance Criteria

- [x] Hoàn thành phiên/stage hiển thị màn chúc mừng có tóm tắt + animation.
- [x] Huy hiệu mới được trao đúng điều kiện và hiển thị trong celebration.
- [x] Nhãn huy hiệu đồng bộ 3 ngôn ngữ.
- [x] Typecheck pass; unit test backend pass.

## Implementation Notes

- Backend mở rộng `BADGES` và logic `checkAndAwardBadges`:
  - `PERFECT_SESSION`: 5 review gần nhất đều `recallQuality >= 4`.
  - `NIGHT_OWL`: học vào khung giờ trước 05:00 theo timezone user.
  - `EARLY_BIRD`: học trong khung 05:00-07:59 theo timezone user.
  - `WEEKEND_WARRIOR`: học vào Thứ 7/CN theo timezone user.
  - `LEVEL_10`: đạt level 10 theo tổng XP.
- Frontend thêm `SessionCelebration` và tích hợp vào `ReviewPage` màn hoàn thành:
  - Hiển thị confetti animation, accuracy, XP phiên, streak hiện tại, badge mới.
  - Áp dụng cho cả completion của review session thường và stage flow.
  - Gom badge mới trong toàn session (không chỉ toast từng câu).
- i18n bổ sung nhãn celebration + badge mới cho `en/vi/pt`.

## Verification

- `source ~/.nvm/nvm.sh && nvm use v23`
- `cd polylex-global/apps/backend && npm test -- gamification.service.spec.ts --runInBand`
- `cd polylex-global/apps/backend && npm run build`
- `cd polylex-global/apps/frontend && npm run build`
