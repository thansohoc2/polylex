# TICKET-044: Bảng xếp hạng tuần (Weekly Leaderboard)

**Status:** ✅ Done
**Priority:** 🔴 P0 – Cạnh tranh & giữ chân
**Platforms:** Backend (API), Frontend
**Created:** June 15, 2026
**Nhóm gốc:** Hiến kế Nhóm B #4

---

## Vấn đề

Học một mình, không có yếu tố cạnh tranh. Hạ tầng đã sẵn: `UserStreak.weeklyXp` +
`GamificationService.resetWeeklyXp` (scheduler) nhưng **chưa có endpoint/UI** để xếp hạng.
Đây là quick win lớn cho động lực.

## Mục tiêu

- API trả về **bảng xếp hạng theo `weeklyXp`** (top N + thứ hạng của chính người dùng).
- UI bảng xếp hạng: avatar, tên, XP tuần, huy chương top 3, highlight bản thân.
- Hiển thị thời điểm reset tuần.

## Phạm vi

- Backend:
  - `GET /gamification/leaderboard?limit=` → danh sách `{ rank, displayName, weeklyXp, isMe }`
    sắp theo `weeklyXp desc`.
  - Bao gồm thứ hạng người dùng hiện tại kể cả khi ngoài top N.
  - Đảm bảo `resetWeeklyXp` đã chạy đúng đầu tuần (kiểm tra scheduler).
- Frontend:
  - Trang/section Leaderboard (vào từ Dashboard hoặc Profile).
  - Endpoint client trong `api-endpoints.ts` + `GamificationApi`.
  - i18n en/vi/pt.

## Acceptance Criteria

- [x] API trả top N theo XP tuần + thứ hạng bản thân.
- [x] UI hiển thị danh sách, highlight bản thân, huy chương top 3.
- [x] Reset đúng đầu tuần (XP tuần về 0).
- [x] Hiệu năng tốt với nhiều người dùng (index hợp lý).
- [x] i18n đồng bộ 3 ngôn ngữ.

## PLAN TODO

- [x] **TODO-44.1**: Thêm contract leaderboard vào backend (DTO + controller endpoint)
  - **File**: `apps/backend/src/modules/gamification/dto/leaderboard.dto.ts`, `apps/backend/src/modules/gamification/gamification.controller.ts`
  - **Thay đổi**: `GET /gamification/leaderboard?limit=` với validation `limit` (1-100)
  - **Verify**: Backend build pass

- [x] **TODO-44.2**: Implement business logic xếp hạng tuần
  - **File**: `apps/backend/src/modules/gamification/gamification.service.ts`
  - **Thay đổi**:
    - Lấy top N theo `weeklyXp desc`, tie-break `userId asc`
    - Trả `me` kể cả khi ngoài top N
    - Trả thêm `resetAt` (thời điểm reset kế tiếp, UTC)
  - **Verify**: Unit test + backend build pass

- [x] **TODO-44.3**: Unit test cho leaderboard service
  - **File**: `apps/backend/src/modules/gamification/gamification.service.spec.ts`
  - **Thay đổi**: Thêm 2 test case leaderboard (me trong top / ngoài top)
  - **Verify**: `npm test -- gamification.service.spec.ts --runInBand` pass

- [x] **TODO-44.4**: Tối ưu query bằng index cho `weeklyXp`
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Thay đổi**: Thêm `@@index([weeklyXp(sort: Desc), userId])` cho `UserStreak`
  - **Verify**: Prisma schema không lỗi, backend build pass
  - ℹ️ **Note**: Cần chạy migration ở môi trường DB triển khai

- [x] **TODO-44.5**: Mở rộng shared API contract cho leaderboard
  - **File**: `packages/shared-types/src/index.ts`, `packages/shared-types/src/index.d.ts`, `packages/shared-types/dist/index.d.ts`, `packages/shared-types/src/types/gamification.types.ts`, `packages/shared-types/src/api-endpoints.ts`
  - **Thay đổi**: Thêm `WeeklyLeaderboardEntry/Response`, `GamificationApi.getLeaderboard()`
  - **Verify**: Frontend/Backend typecheck pass

- [x] **TODO-44.6**: Tạo UI trang leaderboard + route + điều hướng
  - **File**: `apps/frontend/src/pages/LeaderboardPage.tsx`, `apps/frontend/src/App.tsx`, `apps/frontend/src/pages/DashboardPage.tsx`, `apps/frontend/src/pages/ProfilePage.tsx`
  - **Thay đổi**:
    - Trang `/leaderboard` hiển thị top 20, huy chương top 3, highlight current user
    - Hiển thị hạng cá nhân nếu nằm ngoài top
    - Link vào từ Dashboard và Profile
  - **Verify**: Frontend build pass

- [x] **TODO-44.7**: Đồng bộ i18n en/vi/pt cho leaderboard
  - **File**: `apps/frontend/src/i18n/locales/en.json`, `apps/frontend/src/i18n/locales/vi.json`, `apps/frontend/src/i18n/locales/pt.json`
  - **Verify**: Frontend build pass

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Đã triển khai đầy đủ leaderboard tuần từ backend đến frontend: API top N + hạng cá nhân ngoài top, UI bảng xếp hạng có huy chương và highlight bản thân, kèm hiển thị thời điểm reset tuần.

### Thống kê
- **Tổng TODO**: 7
- **Hoàn thành**: 7 ✅
- **Blocked**: 0 ⚠️

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-44.1 | Endpoint leaderboard + DTO | ✅ Done | Validate `limit` 1-100 |
| TODO-44.2 | Logic xếp hạng tuần | ✅ Done | Top N + me + resetAt |
| TODO-44.3 | Unit test service | ✅ Done | Thêm 2 test leaderboard |
| TODO-44.4 | Index weeklyXp | ✅ Done | Cần migration DB |
| TODO-44.5 | Shared API contract | ✅ Done | Thêm types + API method |
| TODO-44.6 | UI + route + điều hướng | ✅ Done | Dashboard/Profile -> Leaderboard |
| TODO-44.7 | i18n en/vi/pt | ✅ Done | Đồng bộ key đầy đủ |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/backend/src/modules/gamification/dto/leaderboard.dto.ts` | Added | DTO validate query `limit` |
| `apps/backend/src/modules/gamification/gamification.controller.ts` | Modified | Thêm `GET /gamification/leaderboard` |
| `apps/backend/src/modules/gamification/gamification.service.ts` | Modified | Implement ranking logic + `resetAt` |
| `apps/backend/src/modules/gamification/gamification.service.spec.ts` | Modified | Thêm 2 unit tests leaderboard |
| `apps/backend/prisma/schema.prisma` | Modified | Thêm index `weeklyXp` cho `UserStreak` |
| `packages/shared-types/src/index.ts` | Modified | Thêm `WeeklyLeaderboardEntry/Response` |
| `packages/shared-types/src/index.d.ts` | Modified | Đồng bộ declaration leaderboard |
| `packages/shared-types/dist/index.d.ts` | Modified | Đồng bộ declaration leaderboard |
| `packages/shared-types/src/types/gamification.types.ts` | Modified | Thêm alias DTO leaderboard |
| `packages/shared-types/src/api-endpoints.ts` | Modified | Thêm `GamificationApi.getLeaderboard()` |
| `apps/frontend/src/pages/LeaderboardPage.tsx` | Added | Trang leaderboard tuần |
| `apps/frontend/src/App.tsx` | Modified | Thêm route `/leaderboard` |
| `apps/frontend/src/pages/DashboardPage.tsx` | Modified | Thêm CTA vào leaderboard |
| `apps/frontend/src/pages/ProfilePage.tsx` | Modified | Thêm menu leaderboard |
| `apps/frontend/src/i18n/locales/en.json` | Modified | Key leaderboard tiếng Anh |
| `apps/frontend/src/i18n/locales/vi.json` | Modified | Key leaderboard tiếng Việt |
| `apps/frontend/src/i18n/locales/pt.json` | Modified | Key leaderboard tiếng Bồ Đào Nha |

### Verification
- [x] Build thành công: ✅ (`nvm use v23 && npm run build` backend/frontend)
- [x] Unit tests pass: ✅ (`nvm use v23 && npm test -- gamification.service.spec.ts --runInBand`)
- [x] Không có warning mới: ✅ (typecheck + get_errors sạch)

### Ghi chú
- `resetWeeklyXp` scheduler hiện dùng `CronExpression.EVERY_WEEK`; logic reset tuần vẫn giữ nguyên và leaderboard hiển thị `resetAt` để người dùng biết vòng tuần kế tiếp.
- Đã thêm index schema cho hiệu năng query leaderboard; cần áp dụng migration DB ở môi trường triển khai.
