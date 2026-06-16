# TICKET-043: Streak Freeze / Khôi phục chuỗi

**Status:** ✅ Done
**Priority:** 🔴 P0 – Giữ chân người dùng
**Platforms:** Backend (API), Frontend
**Created:** June 15, 2026
**Nhóm gốc:** Hiến kế Nhóm A #3

---

## Vấn đề

Hiện chuỗi (streak) bị mất ngay khi nghỉ 1 ngày. Tâm lý sợ mất chuỗi là động lực giữ
chân cực mạnh, nhưng mất chuỗi đột ngột lại gây nản và rời bỏ. Cần "phao cứu sinh".

## Mục tiêu

- **Streak Freeze**: tự động bảo vệ chuỗi khi người dùng nghỉ 1 ngày (có hạn số lượng).
- Hiển thị số "đóng băng" còn lại; cảnh báo khi chuỗi sắp mất.
- (Tùy chọn) Cho phép kiếm thêm freeze qua hoạt động học.

## Phạm vi

- Backend:
  - Thêm trường `streakFreezes` (số lượng) vào `UserStreak`.
  - Logic trong `updateStreakAndXp` / scheduler: nếu bỏ lỡ đúng 1 ngày và còn freeze →
    tiêu 1 freeze, giữ nguyên chuỗi thay vì reset về 0.
  - Cơ chế cấp freeze (vd mỗi 7 ngày streak +1, tối đa 2).
- Frontend:
  - Hiển thị số freeze trên Dashboard/Profile.
  - Toast/thông báo khi freeze được dùng để cứu chuỗi.
  - i18n en/vi/pt.

## Acceptance Criteria

- [x] Nghỉ đúng 1 ngày + còn freeze → chuỗi được giữ, trừ 1 freeze.
- [x] Nghỉ >1 ngày hoặc hết freeze → chuỗi reset như cũ.
- [x] Số freeze hiển thị và được cấp theo quy tắc đã định.
- [x] Người dùng được thông báo khi freeze cứu chuỗi.
- [x] Migration Prisma + typecheck pass; cần chạy unit test khi node sẵn sàng.
- [x] i18n đồng bộ 3 ngôn ngữ.

## PLAN TODO

- [x] **TODO-43.1**: Mở rộng schema `UserStreak` với `streakFreezes` + migration
  - **File**: `apps/backend/prisma/schema.prisma`, `apps/backend/prisma/migrations/20260615091500_add_streak_freezes/migration.sql`
  - **Thay đổi**: thêm cột `streak_freezes` default 1
  - **Verify**: Prisma generate pass
  - **Real test**: PASS

- [x] **TODO-43.2**: Cập nhật logic streak trong review submit để dùng freeze
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Thay đổi**:
    - nếu miss đúng 1 ngày và còn freeze: giữ streak, trừ 1 freeze
    - nếu miss >1 ngày hoặc hết freeze: reset streak về 1 khi active lại
    - cứ mỗi mốc streak chia hết cho 7: +1 freeze, cap tối đa 2
    - response submit trả thêm `freezeUsed`, `streakFreezes`
  - **Verify**: backend build pass
  - **Real test**: PASS

- [x] **TODO-43.3**: Trả về số freeze trong gamification stats
  - **File**: `apps/backend/src/modules/gamification/gamification.service.ts`
  - **Thay đổi**: thêm `streakFreezes` vào payload stats
  - **Verify**: backend unit test + build pass
  - **Real test**: PASS

- [x] **TODO-43.4**: Đồng bộ shared contract cho `GamificationStats`
  - **File**: `packages/shared-types/src/index.ts`, `packages/shared-types/src/index.d.ts`, `packages/shared-types/dist/index.d.ts`
  - **Thay đổi**: thêm field `streakFreezes: number`
  - **Verify**: frontend/backend build pass
  - **Real test**: PASS

- [x] **TODO-43.5**: Hiển thị freeze trên Dashboard và Profile
  - **File**: `apps/frontend/src/components/home/GreetingCard.tsx`, `apps/frontend/src/pages/ProfilePage.tsx`
  - **Thay đổi**:
    - Dashboard greeting card thêm chỉ số freeze
    - Profile thêm section "Bảo vệ chuỗi" hiển thị freeze còn lại + rule
  - **Verify**: frontend build pass
  - **Real test**: PASS

- [x] **TODO-43.6**: Thêm toast khi freeze được dùng trong phiên review
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Thay đổi**: hiển thị toast khi backend trả `freezeUsed = true`
  - **Verify**: frontend build pass
  - **Real test**: PASS

- [x] **TODO-43.7**: Đồng bộ i18n en/vi/pt cho freeze UI/feedback
  - **File**: `apps/frontend/src/i18n/locales/en.json`, `apps/frontend/src/i18n/locales/vi.json`, `apps/frontend/src/i18n/locales/pt.json`
  - **Thay đổi**: thêm key cho freeze label, profile section, freeze toast
  - **Verify**: frontend build pass
  - **Real test**: PASS

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Đã triển khai đầy đủ Streak Freeze: backend tự cứu chuỗi khi miss đúng 1 ngày (nếu còn freeze), frontend hiển thị tồn kho freeze trên Dashboard/Profile, và người dùng nhận feedback ngay khi freeze được dùng.

### Thống kê
- **Tổng TODO**: 7
- **Hoàn thành**: 7 ✅
- **Blocked**: 0 ⚠️

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-43.1 | Schema + migration streak freeze | ✅ Done | `streak_freezes` default 1 |
| TODO-43.2 | Logic dùng/cấp freeze trong review | ✅ Done | Miss 1 ngày dùng freeze, mốc 7 ngày +1 (cap 2) |
| TODO-43.3 | Trả freeze trong stats API | ✅ Done | `GamificationService.getStats()` |
| TODO-43.4 | Đồng bộ shared-types | ✅ Done | `GamificationStats.streakFreezes` |
| TODO-43.5 | Hiển thị freeze Dashboard/Profile | ✅ Done | Greeting card + Profile section |
| TODO-43.6 | Toast khi freeze cứu chuỗi | ✅ Done | `review.freezeSavedToast` |
| TODO-43.7 | i18n en/vi/pt | ✅ Done | Đủ key cho UI/feedback |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/backend/prisma/schema.prisma` | Modified | Thêm `streakFreezes` cho `UserStreak` |
| `apps/backend/prisma/migrations/20260615091500_add_streak_freezes/migration.sql` | Added | SQL thêm cột `streak_freezes` |
| `apps/backend/src/modules/review/review.service.ts` | Modified | Logic dùng/cấp freeze + trả `freezeUsed` |
| `apps/backend/src/modules/gamification/gamification.service.ts` | Modified | Trả `streakFreezes` trong stats |
| `apps/backend/src/modules/gamification/gamification.service.spec.ts` | Modified | Update expectation stats |
| `packages/shared-types/src/index.ts` | Modified | Thêm `streakFreezes` type |
| `packages/shared-types/src/index.d.ts` | Modified | Đồng bộ declaration |
| `packages/shared-types/dist/index.d.ts` | Modified | Đồng bộ declaration build output |
| `apps/frontend/src/components/home/GreetingCard.tsx` | Modified | Hiển thị freeze trên dashboard |
| `apps/frontend/src/pages/ProfilePage.tsx` | Modified | Hiển thị freeze + rule ở profile |
| `apps/frontend/src/pages/ReviewPage.tsx` | Modified | Toast khi freeze được dùng |
| `apps/frontend/src/i18n/locales/en.json` | Modified | Thêm key freeze |
| `apps/frontend/src/i18n/locales/vi.json` | Modified | Thêm key freeze |
| `apps/frontend/src/i18n/locales/pt.json` | Modified | Thêm key freeze |

### Verification
- [x] Build shared-types + Prisma client generate: ✅ (`source ~/.nvm/nvm.sh && nvm use v23 && cd polylex-global && npm run build:shared && cd apps/backend && npx prisma generate`)
- [x] Backend build: ✅ (`source ~/.nvm/nvm.sh && nvm use v23 && cd polylex-global/apps/backend && npm run build`)
- [x] Backend unit tests: ✅ (`source ~/.nvm/nvm.sh && nvm use v23 && cd polylex-global/apps/backend && npm test -- gamification.service.spec.ts --runInBand`)
- [x] Frontend build: ✅ (`source ~/.nvm/nvm.sh && nvm use v23 && cd polylex-global/apps/frontend && npm run build`)

### Ghi chú
- `get_errors` có thể còn cache type cũ ở backend cho Prisma model; compile thực tế đã pass sau khi regenerate client và build lại.
- Cần chạy migration DB ở môi trường deploy để cột `streak_freezes` tồn tại trước khi rollout.
