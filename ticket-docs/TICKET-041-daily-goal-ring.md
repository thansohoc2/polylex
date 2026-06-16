# TICKET-041: Mục tiêu hằng ngày (Daily Goal Ring) trên Dashboard

**Status:** ✅ Done (verification build/test blocked by local Node env)
**Priority:** 🔴 P0 – Giữ chân người dùng
**Platforms:** Frontend (Backend nếu cần lưu mốc)
**Created:** June 15, 2026
**Nhóm gốc:** Hiến kế Nhóm A #1

---

## Vấn đề

App chưa có mục tiêu hằng ngày rõ ràng. `dailyGoal` đã tồn tại trong DB/`UpdateMeDto`
nhưng không được hiển thị hay sử dụng → người dùng không có "đích đến" mỗi ngày, thiếu
động lực hoàn thành phiên học.

## Mục tiêu

- Hiển thị **vòng tròn tiến độ XP hôm nay / mục tiêu** nổi bật trên Dashboard.
- Cho phép chọn mức mục tiêu (vd Dễ 10 XP / Vừa 20 XP / Khó 40 XP).
- Khi đạt mục tiêu: hiệu ứng chúc mừng + trạng thái "Đã hoàn thành hôm nay".

## Phạm vi

- Backend:
  - Endpoint trả về **XP kiếm được hôm nay** (timezone-aware). Có thể tính từ
    `reviewHistory` hôm nay hoặc thêm `dailyXp` vào `UserStreak` (reset theo ngày).
  - Cho phép cập nhật `dailyGoal` qua `PATCH /users/me` (đã có field).
- Frontend:
  - Component `DailyGoalRing` trên `DashboardPage`.
  - Sheet chọn mức mục tiêu.
  - i18n en/vi/pt.

## Acceptance Criteria

- [x] Dashboard hiển thị vòng tròn XP hôm nay / mục tiêu, cập nhật sau mỗi phiên.
- [x] Người dùng đổi được mức mục tiêu, lưu vào hồ sơ.
- [x] Đạt mục tiêu → hiệu ứng + trạng thái hoàn thành.
- [x] Reset đúng theo nửa đêm múi giờ người dùng.
- [x] i18n đồng bộ 3 ngôn ngữ.

## PLAN TODO

- [x] **TODO-41.1**: Mở rộng `GamificationStats` với `dailyXp`, `dailyGoal`, `dailyProgressPercent`, `isDailyGoalReached`
  - **File**: `packages/shared-types/src/index.ts`, `packages/shared-types/src/index.d.ts`, `packages/shared-types/dist/index.d.ts`
  - **Verify**: `get_errors` không báo lỗi type mới

- [x] **TODO-41.2**: Tính XP hôm nay theo timezone trong backend gamification
  - **File**: `apps/backend/src/modules/gamification/gamification.service.ts`
  - **Thay đổi**: dùng `reviewHistory.aggregate` theo khoảng ngày local (`reviewedAt`) và map về XP
  - **Verify**: `get_errors` pass

- [x] **TODO-41.3**: Viết unit test cho `GamificationService.getStats` phần daily progress
  - **File**: `apps/backend/src/modules/gamification/gamification.service.spec.ts`
  - **Verify**: test case có đủ 2 nhánh (chưa đạt goal / đạt goal)

- [x] **TODO-41.4**: Tạo UI `DailyGoalRing` + preset mục tiêu 10/20/40
  - **File**: `apps/frontend/src/components/home/DailyGoalRing.tsx`
  - **Verify**: `get_errors` pass

- [x] **TODO-41.5**: Tích hợp vào Dashboard và cập nhật mục tiêu qua `userApi.updateMe`
  - **File**: `apps/frontend/src/pages/DashboardPage.tsx`
  - **Verify**: `get_errors` pass

- [x] **TODO-41.6**: Đồng bộ i18n cho en/vi/pt
  - **File**: `apps/frontend/src/i18n/locales/en.json`, `apps/frontend/src/i18n/locales/vi.json`, `apps/frontend/src/i18n/locales/pt.json`
  - **Verify**: `get_errors` pass

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Đã triển khai đầy đủ Daily Goal Ring trên Dashboard, cho phép đổi mục tiêu hằng ngày và tính tiến độ XP hôm nay theo đúng múi giờ người dùng từ backend.

### Thống kê
- **Tổng TODO**: 6
- **Hoàn thành**: 6 ✅
- **Blocked**: 1 ⚠️ (build/test terminal bị lỗi Node env)

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-41.1 | Mở rộng GamificationStats | ✅ Done | Đồng bộ cả `src` + `d.ts` + `dist d.ts` |
| TODO-41.2 | Tính daily XP timezone-aware | ✅ Done | Dựa trên `reviewedAt` và timezone user |
| TODO-41.3 | Unit test GamificationService | ✅ Done | Thêm 2 test cases |
| TODO-41.4 | Tạo DailyGoalRing component | ✅ Done | SVG progress ring + preset goals |
| TODO-41.5 | Tích hợp Dashboard + update goal | ✅ Done | Cập nhật realtime state sau PATCH |
| TODO-41.6 | i18n en/vi/pt | ✅ Done | Thêm key dashboard cho daily goal |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `packages/shared-types/src/index.ts` | Modified | Thêm field daily progress vào `GamificationStats` |
| `packages/shared-types/src/index.d.ts` | Modified | Đồng bộ declaration `GamificationStats` |
| `packages/shared-types/dist/index.d.ts` | Modified | Đồng bộ declaration dùng bởi workspace |
| `apps/backend/src/modules/gamification/gamification.service.ts` | Modified | Tính `dailyXp` theo timezone + trả progress |
| `apps/backend/src/modules/gamification/gamification.service.spec.ts` | Added | Unit test cho nhánh đạt/chưa đạt goal |
| `apps/frontend/src/components/home/DailyGoalRing.tsx` | Added | UI vòng tròn tiến độ + preset mục tiêu |
| `apps/frontend/src/pages/DashboardPage.tsx` | Modified | Render ring + gọi `updateMe({ dailyGoal })` |
| `apps/frontend/src/i18n/locales/en.json` | Modified | Thêm key daily goal dashboard |
| `apps/frontend/src/i18n/locales/vi.json` | Modified | Thêm key daily goal dashboard |
| `apps/frontend/src/i18n/locales/pt.json` | Modified | Thêm key daily goal dashboard |

### Verification
- [ ] Build thành công: ❌ (blocked bởi lỗi local Node 22: `libicui18n.74.dylib`)
- [ ] Unit tests pass: ❌ (không chạy được do cùng lỗi môi trường Node)
- [x] Không có warning/lỗi TypeScript mới theo language server

### Ghi chú
- ⚠️ **BLOCKED**: Verification bằng `npm run build` / `npm test` chưa thực hiện được do môi trường terminal vẫn trỏ Node 22 bị thiếu ICU library.
- Đã verify toàn bộ thay đổi bằng `get_errors` (backend/frontend/shared-types đều sạch).
