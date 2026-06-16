# TICKET-047: Cấp độ tổng & tiến độ thành thạo (Level & Mastery)

**Status:** ✅ Done
**Priority:** 🟠 P1 – Cảm giác tiến bộ dài hạn
**Platforms:** Backend (API), Frontend
**Created:** June 15, 2026
**Nhóm gốc:** Hiến kế Nhóm D #10

---

## Vấn đề

Người dùng tích lũy XP và học nhiều từ nhưng thiếu chỉ số tiến bộ tổng thể dễ hiểu.
`totalXp` và `memoryStrength` đã có nhưng chưa được quy đổi thành "cấp độ" hay
"số từ đã thành thạo" → khó cảm nhận mình đang tiến bộ.

## Mục tiêu

- **Level tổng** quy đổi từ `totalXp` (vd ngưỡng tăng dần) + thanh tiến độ tới cấp kế.
- Chỉ số **"từ đã thành thạo"** = số `UserVocabulary` có `memoryStrength > 0.8`.
- Hiển thị nổi bật trên Dashboard/Profile.

## Phạm vi

- Backend:
  - Bổ sung vào `GamificationService.getStats` (hoặc endpoint riêng): `level`,
    `xpInLevel`, `xpForNextLevel`, `masteredWordCount` (`memoryStrength > 0.8`).
  - Hàm quy đổi XP → level (thuần, dễ test).
- Frontend:
  - Component hiển thị Level + thanh tiến độ + số từ thành thạo.
  - Cập nhật `GamificationStatusDto`/shared-types tương ứng.
  - i18n en/vi/pt.

## Acceptance Criteria

- [x] API trả `level`, tiến độ trong cấp, `masteredWordCount`.
- [x] Hàm XP→level thuần, có ranh giới cấp rõ ràng.
- [x] UI hiển thị cấp độ + thanh tiến độ + từ thành thạo.
- [x] shared-types đồng bộ; typecheck pass.
- [x] i18n đồng bộ 3 ngôn ngữ.

## PLAN TODO

- [x] **TODO-47.1**: Mở rộng backend stats với level progression + mastered words
  - **File**: `apps/backend/src/modules/gamification/gamification.service.ts`
  - **Thay đổi**:
    - thêm hàm thuần `calculateLevelFromXp(totalXp)`
    - trả thêm `level`, `xpInLevel`, `xpForNextLevel`
    - tính `masteredWordCount` từ `UserVocabulary.memoryStrength > 0.8`
  - **Verify**: backend test + build pass
  - **Real test**: PASS

- [x] **TODO-47.2**: Cập nhật unit test cho logic level/mastery
  - **File**: `apps/backend/src/modules/gamification/gamification.service.spec.ts`
  - **Thay đổi**:
    - test thêm fields level/mastered trong `getStats`
    - test ranh giới `calculateLevelFromXp`
  - **Verify**: `npm test -- gamification.service.spec.ts --runInBand`
  - **Real test**: PASS

- [x] **TODO-47.3**: Đồng bộ shared-types cho contract stats mới
  - **File**: `packages/shared-types/src/index.ts`, `packages/shared-types/src/index.d.ts`, `packages/shared-types/dist/index.d.ts`
  - **Thay đổi**: thêm fields `level`, `xpInLevel`, `xpForNextLevel`, `masteredWordCount`
  - **Verify**: build shared-types pass
  - **Real test**: PASS

- [x] **TODO-47.4**: Hiển thị level/mastery trên Dashboard
  - **File**: `apps/frontend/src/components/home/LevelMasteryCard.tsx`, `apps/frontend/src/pages/DashboardPage.tsx`
  - **Thay đổi**:
    - thêm card hiển thị Level + progress bar + mastered words
    - render card tại dashboard
  - **Verify**: frontend build pass
  - **Real test**: PASS

- [x] **TODO-47.5**: Hiển thị level/mastery trên Profile
  - **File**: `apps/frontend/src/pages/ProfilePage.tsx`
  - **Thay đổi**: thêm section tiến độ tổng với level/progress/mastered words
  - **Verify**: frontend build pass
  - **Real test**: PASS

- [x] **TODO-47.6**: Đồng bộ i18n en/vi/pt
  - **File**: `apps/frontend/src/i18n/locales/en.json`, `apps/frontend/src/i18n/locales/vi.json`, `apps/frontend/src/i18n/locales/pt.json`
  - **Thay đổi**: thêm key text cho level/mastery ở dashboard/profile
  - **Verify**: frontend build pass
  - **Real test**: PASS

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Đã bổ sung tiến độ dài hạn rõ ràng bằng Level + thanh XP trong cấp + số từ thành thạo, hiển thị ở cả Dashboard và Profile.

### Thống kê
- **Tổng TODO**: 6
- **Hoàn thành**: 6 ✅
- **Blocked**: 0 ⚠️

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-47.1 | Backend level/mastery stats | ✅ Done | trả level/xpInLevel/xpForNext/mastered |
| TODO-47.2 | Unit test level function | ✅ Done | thêm boundary tests |
| TODO-47.3 | Shared-types contract | ✅ Done | sync src + d.ts + dist d.ts |
| TODO-47.4 | Dashboard UI | ✅ Done | card LevelMasteryCard |
| TODO-47.5 | Profile UI | ✅ Done | section tiến độ tổng |
| TODO-47.6 | i18n en/vi/pt | ✅ Done | key level/mastery đầy đủ |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/backend/src/modules/gamification/gamification.service.ts` | Modified | level helper + stats fields mới |
| `apps/backend/src/modules/gamification/gamification.service.spec.ts` | Modified | test level/mastery |
| `packages/shared-types/src/index.ts` | Modified | GamificationStats fields mới |
| `packages/shared-types/src/index.d.ts` | Modified | declaration sync |
| `packages/shared-types/dist/index.d.ts` | Modified | declaration sync |
| `apps/frontend/src/components/home/LevelMasteryCard.tsx` | Added | card level/mastery |
| `apps/frontend/src/pages/DashboardPage.tsx` | Modified | render level card |
| `apps/frontend/src/pages/ProfilePage.tsx` | Modified | section level progress |
| `apps/frontend/src/i18n/locales/en.json` | Modified | key level/mastery tiếng Anh |
| `apps/frontend/src/i18n/locales/vi.json` | Modified | key level/mastery tiếng Việt |
| `apps/frontend/src/i18n/locales/pt.json` | Modified | key level/mastery tiếng Bồ Đào Nha |

### Verification
- [x] Shared-types build: ✅ (`source ~/.nvm/nvm.sh && nvm use v23 && cd polylex-global && npm run build:shared`)
- [x] Backend tests: ✅ (`cd apps/backend && npm test -- gamification.service.spec.ts --runInBand`)
- [x] Backend build: ✅ (`cd apps/backend && npm run build`)
- [x] Frontend build: ✅ (`cd apps/frontend && npm run build`)

### Ghi chú
- Công thức level hiện dùng ngưỡng tăng dần dễ hiểu: level 1 cần 100 XP, mỗi level sau tăng thêm 50 XP.
- `masteredWordCount` dùng tiêu chí `memoryStrength > 0.8` theo yêu cầu ticket.
