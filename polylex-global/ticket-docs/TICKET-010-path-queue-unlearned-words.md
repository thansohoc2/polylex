# TICKET-010 — Path Queue: Từ chưa học không hiển thị khi tiến trình < 100%

## Mô tả vấn đề

Người dùng nhấn **"Học tiếp →"** khi stage đang ở 50% tiến trình (ví dụ: 4/8 từ)
nhưng màn hình review hiển thị **"Xong rồi!"** — không có từ nào để học.

**Screenshot minh hoạ:**
- Stage "Basic Introductions": `4/8 từ · 50%`
- Nhấn "Học tiếp →" → đến `/review/path/<id>` → hiện empty state "Xong rồi!"

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-010 |
| **Tiêu đề** | Path Queue hiển thị empty khi vẫn còn từ chưa học trong stage |
| **Mục tiêu** | "Học tiếp →" phải luôn hiển thị từ chưa được học thành công, bất kể lịch SRS |
| **Phạm vi** | Backend: `review.service.ts`, `review.dto.ts`; Frontend: `ReviewPage.tsx`, `StageRow.tsx` |
| **Độ ưu tiên** | Cao — ảnh hưởng trực tiếp đến core learning loop |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Fix `_updateWordsLearned` bỏ sót | `wordsLearned` không tăng khi từ fail lần đầu rồi pass lần sau | BE: `review.service.ts` | Nhỏ |
| REQ-02 | Path queue bao gồm từ chưa học thành công | `getQueue()` ở path mode phải trả về từ có `nextReview > now` nếu từ đó chưa được đánh dấu "đã học" | BE: `review.service.ts`, `review.dto.ts` | Trung bình |
| REQ-03 | Thêm flag `isLearned` vào `UserVocabulary` | Lưu trạng thái "đã học thành công ít nhất 1 lần" để phân biệt từ "chưa học" và từ "đã học, đang ôn" | DB: migration, BE: service | Trung bình |
| REQ-04 | Frontend: cập nhật empty state path mode | Phân biệt "hết từ mới để học" vs "hết từ ôn tập hôm nay" | FE: `ReviewPage.tsx` | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-03 ──> REQ-01 ──> REQ-02 ──> REQ-04
           (fix guard)   (queue filter)  (UI message)
```

REQ-03 cần làm trước để REQ-01 và REQ-02 có field để dùng.

#### Chi tiết từng yêu cầu con

##### REQ-01: Fix `_updateWordsLearned` bỏ sót
- **Mục tiêu**: `wordsLearned` phải tăng khi từ được học thành công, bất kể đây là lần thứ mấy review
- **Hiện tại**: `if (uv.reviewCount === 0 && dto.recallQuality >= 1)` — chỉ tính lần đầu
- **Vấn đề**: Nếu user fail lần 1 (`reviewCount` tăng thành 1), review lần 2 pass — `wordsLearned` KHÔNG tăng vì guard `reviewCount === 0` fail
- **Đầu ra mong đợi**: Dùng `isLearned` field (`false → true`) thay vì `reviewCount === 0` làm guard
- **Phụ thuộc**: REQ-03

##### REQ-02: Path queue bao gồm từ chưa học thành công
- **Mục tiêu**: Khi `userPathId` được truyền, queue phải chứa từ trong stage chưa có `isLearned = true`, dù `nextReview` là ngày nào
- **Hiện tại**: `getQueue()` filter cứng `nextReview: { lte: todayEndUtc }` — áp dụng đồng đều cho mọi từ
- **Đề xuất**: Trong path mode, sửa điều kiện thành `OR [nextReview <= todayEnd] OR [isLearned = false]`
- **Phụ thuộc**: REQ-03

##### REQ-03: Thêm field `isLearned` vào `UserVocabulary`
- **Mục tiêu**: Có flag rõ ràng "từ này đã được học thành công ít nhất một lần"
- **Đầu ra**: Prisma migration, default `false`, set `true` khi `recallQuality >= 1` (bất kể reviewCount)
- **Phụ thuộc**: Không

##### REQ-04: Frontend — phân biệt empty state
- **Mục tiêu**: Khi path queue empty vì "hết từ mới" (tất cả đã `isLearned = true`) vs "đang chờ SRS"
- **Hiện tại**: Chỉ có 1 message "Xong rồi! Bạn đã ôn hết từ vựng trong lộ trình này hôm nay."
- **Phụ thuộc**: REQ-02

---

### 3. Ngữ cảnh nghiệp vụ

**Luồng nghiệp vụ hiện tại:**
1. User join path → stage 1 vocab được thêm vào `UserVocabulary` với `nextReview = now()` (default)
2. User nhấn "Học tiếp →" → đến `/review/path/:userPathId`
3. Backend `getQueue()` filter `nextReview <= todayEnd` → trả về từ SRS-due
4. User review từ → ACRE tính `nextReview` mới → `reviewCount` tăng

**Luồng kỳ vọng của user:**
- "Học tiếp →" = "Cho tôi xem tất cả từ trong stage tôi chưa học thuộc"
- Học thuộc = đã review thành công ít nhất 1 lần với `recallQuality >= 1`

**Thực thể domain liên quan:**
- `UserVocabulary`: trạng thái SRS của từng từ theo user
- `UserPathStage`: tiến trình stage, field `wordsLearned / wordCount`
- `PathStageVocab`: danh sách từ trong stage

**Quy tắc nghiệp vụ cần bảo toàn:**
- SRS schedule vẫn hoạt động bình thường cho từ đã học (global review, không phải path mode)
- `wordsLearned` phản ánh số từ đã học thành công thực sự trong stage
- Stage tự hoàn thành khi `wordsLearned >= wordCount`

---

### 4. Ngữ cảnh kỹ thuật

#### Tóm tắt triển khai hiện tại

**`review.service.ts` `getQueue()`** (lines 16–97):
```ts
const where = {
  userId,
  isSuspended: false,
  nextReview: { lte: todayEndUtc },  // ← filter này block "từ chưa học" có SRS future
};
// path mode thêm vocabularyBaseId filter nhưng KHÔNG gỡ nextReview filter
```

**`_updateWordsLearned()`** (lines ~220–250):
```ts
// submitReview() triggers:
if (uv.reviewCount === 0 && dto.recallQuality >= 1) {
  await this._updateWordsLearned(userId, uv.vocabularyBaseId);
}
// ← Bug: reviewCount === 0 guard sai — bỏ sót trường hợp fail lần 1 pass lần 2
```

**ACRE engine** cho `recallQuality = 0`:
- `retention = 0` → `interval = 1/144 days` = **10 phút**
- `nextReview = now + 10 phút`

**ACRE engine** cho `recallQuality = 1` (lần review đầu tiên):
- `retention = 0.2` → `interval = currentInterval * 0.5 = 0.5 days` = **12 giờ**
- `nextReview = now + 12h`
- `_updateWordsLearned` ĐƯỢC gọi → `wordsLearned++`
- → Từ được tính là "đã học" nhưng sẽ không xuất hiện lại trong **12 giờ** nữa

**Kịch bản gây bug** (scenario chính):
| Word | Review 1 quality | reviewCount sau | wordsLearned | nextReview sau |
|------|-----------------|-----------------|--------------|----------------|
| word1 | 3 | 1 | +1 ✅ | +1 ngày |
| word2 | 3 | 1 | +1 ✅ | +1 ngày |
| word3 | 3 | 1 | +1 ✅ | +1 ngày |
| word4 | 3 | 1 | +1 ✅ | +1 ngày |
| word5 | 0 | 1 | 0 ❌ guard miss | +10 phút |
| word6 | 0 | 1 | 0 ❌ | +10 phút |
| word7 | 0 | 1 | 0 ❌ | +10 phút |
| word8 | 0 | 1 | 0 ❌ | +10 phút |

→ Sau 10 phút: word5–8 quay lại queue (`nextReview <= now`). Queue KHÔNG empty.

**Kịch bản gây bug thực tế** (scenario nguy hiểm hơn):
| Word | Review 1 | Review 2 | reviewCount | wordsLearned | nextReview |
|------|----------|----------|-------------|--------------|------------|
| word5 | quality=0→next+10min | quality=3 → ACRE | 2 | 0 ❌ (guard `reviewCount===0` fail) | +1 ngày |
| word6 | quality=0 | quality=3 | 2 | 0 ❌ | +1 ngày |
| word7 | quality=0 | quality=3 | 2 | 0 ❌ | +1 ngày |
| word8 | quality=0 | quality=3 | 2 | 0 ❌ | +1 ngày |

→ Sau lần review 2: word5–8 có `nextReview = +1 ngày` (ACRE với reviewCount=1), `wordsLearned` vẫn = 4. Queue EMPTY. User bị kẹt ở 50% mãi mãi dù đã thực sự học xong cả 8 từ.

**Đây là root cause chính xác** — bug số 2 (fail lần 1 → pass lần 2 → `reviewCount > 0` → guard miss → `wordsLearned` không tăng → từ scheduled cho ngày mai → queue empty).

#### Files bị ảnh hưởng

| File | Role |
|------|------|
| `apps/backend/prisma/schema.prisma` | Thêm `isLearned Boolean @default(false)` vào `UserVocabulary` |
| `apps/backend/prisma/migrations/` | Tạo migration mới |
| `apps/backend/src/modules/review/review.service.ts` | Fix guard + fix getQueue path filter |
| `apps/backend/src/modules/review/dto/review.dto.ts` | (nếu cần expose `isLearned` trong response) |
| `apps/frontend/src/pages/ReviewPage.tsx` | Phân biệt 2 loại empty state |

#### Bảng DB liên quan
- `user_vocabulary`: thêm column `is_learned boolean default false`
- Index: `@@index([userId, isLearned])` cần thêm nếu query nhiều

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `_updateWordsLearned` guard = `reviewCount === 0` | Guard = `isLearned === false` | Thay guard, dùng `isLearned` flag |
| `getQueue` path mode vẫn filter `nextReview <= today` | Path mode show từ `isLearned = false` bất kể SRS | Thêm OR condition cho path mode |
| Không có `isLearned` field | `isLearned: boolean` trong `UserVocabulary` | Migration + schema update |
| Empty state path mode chỉ 1 thông báo | 2 thông báo: "hết từ mới" vs "chờ SRS" | FE: logic phân nhánh |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Migration schema**: Thêm `isLearned` cần migration. Các bản ghi cũ sẽ có `isLearned = false` → user cũ sẽ thấy tất cả từ cũ như "chưa học" trong path mode. **Biện pháp**: Backfill `isLearned = true` cho `UserVocabulary` có `reviewCount >= 1` và `recallQuality >= 1` trong `ReviewHistory`. Hoặc: backfill `isLearned = true` cho `reviewCount >= 1` đơn giản.
- [ ] **wordsLearned hiện tại sai**: Với user đã có path trước fix, `wordsLearned` column trong `UserPathStage` có thể thấp hơn thực tế vì bug. **Biện pháp**: Có thể để tự nhiên — khi fix guard (REQ-01) thì `wordsLearned` sẽ tăng đúng từ đây. Không cần backfill.

#### 6.2 Rủi ro kỹ thuật
- [ ] **Migration fail nếu column đã tồn tại**: Kiểm tra không có column cũ trước khi push migration.
- [ ] **Performance**: `getQueue()` path mode với OR condition `[nextReview <= today OR isLearned = false]` cần index phù hợp. **Biện pháp**: Index `(userId, isLearned)` + index hiện có `(userId, nextReview)` là đủ.
- [ ] **`createMany` không trigger hooks**: `_updateWordsLearned` chỉ được gọi từ `submitReview`. Không ảnh hưởng tới `createMany` khi join path (đúng — words mới join có `isLearned = false`).

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **`isLearned` set nhiều lần**: Nếu user review 1 từ đã `isLearned = true`, không cần gọi `_updateWordsLearned` lại. **Phòng tránh**: Giữ nguyên guard `if (!uv.isLearned && dto.recallQuality >= 1)` thay vì dùng `reviewCount`.
- [ ] **Race condition**: Hai review đồng thời cho cùng 1 từ. Prisma `update` là atomic nên `isLearned = true` chỉ set 1 lần. `wordsLearned++` cũng atomic. Không có race condition.
- [ ] **`_autoCompleteStage` gọi 2 lần**: Nếu 2 từ trong stage được học đồng thời và cả 2 đều trigger complete, `_autoCompleteStage` chạy 2 lần. Guard `if (!ups || ups.isCompleted) return;` (đã có) bảo vệ điều này. ✅

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Fix đúng root cause — guard rõ ràng qua `isLearned` | Cần migration DB |
| Path mode UX nhất quán: "Học tiếp" luôn có từ để học nếu stage chưa xong | Backfill cần cẩn thận với user cũ |
| Tách biệt rõ "chưa học" (`isLearned=false`) và "đang ôn theo SRS" | Thêm complexity query `OR` |
| `isLearned` là dữ liệu hữu ích cho analytics và gamification | |

---

### 8. Khuyến nghị

**Cách tiếp cận khuyến nghị**:
1. **Migration**: Thêm `isLearned Boolean @default(false)` vào `UserVocabulary`
2. **Fix `submitReview()`**: Đổi guard từ `reviewCount === 0` → `!uv.isLearned`; thêm `isLearned: true` vào `userVocabulary.update` data khi `recallQuality >= 1`
3. **Fix `getQueue()` path mode**: Đổi `where` trong path mode để dùng `OR [nextReview <= today, isLearned = false]`
4. **Backfill** (migration script): Set `isLearned = true` cho tất cả `UserVocabulary` có `reviewCount >= 1` để user cũ không bị reset
5. **Frontend**: Thêm logic phân tách empty state (optional — có thể là follow-up)

**Ước tính công sức**: Nhỏ–Trung bình (1/2 ngày)

---

### 9. Câu hỏi mở

- [ ] **Q1**: Backfill `isLearned` cho user cũ — dùng `reviewCount >= 1` (đơn giản) hay check `ReviewHistory` tìm record có `recallQuality >= 1` (chính xác hơn)?
- [ ] **Q2**: Empty state phân biệt "hết từ mới" vs "chờ SRS" — có cần thiết ngay ticket này không hay defer sang UI polish?

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Thêm `isLearned` flag vào `UserVocabulary`, sửa guard trong `submitReview()` để đếm đúng `wordsLearned`, và mở rộng `getQueue()` để luôn trả về từ chưa học trong path mode dù SRS chưa đến hạn.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: `UserVocabulary` có field `isLearned: boolean @default(false)`
2. FR-02: `isLearned` được set `true` khi `recallQuality >= 1`, bất kể `reviewCount`
3. FR-03: `wordsLearned` tăng khi `isLearned` chuyển từ `false → true` (không tăng lần 2+)
4. FR-04: Path mode `getQueue()` trả về từ `isLearned = false` kể cả khi `nextReview > now`
5. FR-05: Backfill `isLearned = true` cho `UserVocabulary` cũ có `reviewCount >= 1`

#### Ràng buộc phi chức năng
1. NFR-01: SRS schedule toàn cục (non-path mode) không bị ảnh hưởng
2. NFR-02: Backend build + frontend `tsc --noEmit` pass không lỗi mới
3. NFR-03: Migration idempotent — không fail nếu DB đã có dữ liệu

#### Phụ thuộc
- DEP-01: Migration phải chạy trước khi backend service đọc/ghi `isLearned`
- DEP-02: `_updateWordsLearned` fix (REQ-01) phụ thuộc `isLearned` có trong schema (REQ-03)
- DEP-03: `getQueue()` fix (REQ-02) phụ thuộc `isLearned` có trong schema (REQ-03)

### Cách tiếp cận
> Migration thêm column `is_learned` với backfill trong cùng SQL, sau đó sửa `review.service.ts` (đổi guard + mở rộng WHERE clause), cuối cùng cập nhật `QueueItem` interface ở frontend để phản ánh field mới.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/backend/prisma/schema.prisma` | Thêm `isLearned Boolean @default(false)` vào `UserVocabulary` |
| Tạo mới | `apps/backend/prisma/migrations/YYYYMMDD_add_is_learned/migration.sql` | ALTER TABLE + backfill |
| Sửa đổi | `apps/backend/src/modules/review/review.service.ts` | Fix guard + fix getQueue path filter |
| Sửa đổi | `apps/frontend/src/pages/ReviewPage.tsx` | Thêm `isLearned` vào `QueueItem` interface |

---

## PLAN TODO

### Phase 1: Data Layer

#### REQ-03: Thêm field `isLearned` vào `UserVocabulary`

- [x] **TODO-1.3.1**: Thêm field `isLearned` vào Prisma schema
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Đọc `UserVocabulary` model (lines 147–170) để thấy vị trí chèn
  - **Thay đổi**:
    - Thêm dòng sau `isSuspended Boolean @default(false)`:
      ```prisma
      isLearned        Boolean   @default(false) @map("is_learned")
      ```
    - Thêm index sau `@@index([userId, isLeech])`:
      ```prisma
      @@index([userId, isLearned])
      ```
  - **Verify**: `cd apps/backend && npx prisma validate` — không lỗi
  - **Kết quả**: Schema có `isLearned` field, Prisma client tự regenerate khi migrate

- [x] **TODO-1.3.2**: Tạo migration SQL có backfill
  - **File**: `apps/backend/prisma/migrations/20260228000000_add_is_learned/migration.sql`
  - **Context**: Đọc migration hiện có tại `20260227013018_init/migration.sql` để thấy naming convention
  - **Thay đổi**: Tạo file với nội dung:
    ```sql
    -- AlterTable
    ALTER TABLE "user_vocabulary" ADD COLUMN "is_learned" BOOLEAN NOT NULL DEFAULT false;

    -- Backfill: mark as learned any word that has been reviewed at least once
    UPDATE "user_vocabulary" SET "is_learned" = true WHERE review_count >= 1;
    ```
  - **Verify**: File tồn tại và SQL hợp lệ (đọc lại file)
  - **Kết quả**: Migration sẵn sàng để apply

- [x] **TODO-1.3.3**: Apply migration và regenerate Prisma client
  - **File**: (terminal — không sửa file)
  - **Context**: Không có
  - **Thay đổi**: Chạy:
    ```bash
    cd apps/backend && npx prisma migrate dev --name add_is_learned
    ```
  - **Verify**: Output `✓ Generated Prisma Client`, không có lỗi migration
  - **Kết quả**: Column `is_learned` tồn tại trong DB; `PrismaClient` có type `isLearned: boolean`

---

### Phase 2: Logic Layer

#### REQ-01: Fix `_updateWordsLearned` bỏ sót

- [x] **TODO-2.1.1**: Thêm `isLearned: true` vào `userVocabulary.update` khi review pass
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: Đọc `submitReview()` method (lines 105–170), xem block `prisma.userVocabulary.update`
  - **Thay đổi**: Trong `prisma.userVocabulary.update({ data: { ... } })`, thêm điều kiện:
    ```ts
    ...(dto.recallQuality >= 1 && { isLearned: true }),
    ```
    Thêm sau dòng `lastReviewedAt: new Date(),` trong `data`.
  - **Verify**: `cd apps/backend && npm run build` — exit 0
  - **Kết quả**: `isLearned` được set `true` trên mọi review pass (idempotent)

- [x] **TODO-2.1.2**: Đổi guard `submitReview()` từ `reviewCount === 0` sang `!uv.isLearned`
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: Đọc dòng `if (uv.reviewCount === 0 && dto.recallQuality >= 1)` (~line 163)
  - **Thay đổi**: Thay thế guard:
    ```ts
    // Trước:
    if (uv.reviewCount === 0 && dto.recallQuality >= 1) {
    // Sau:
    if (!uv.isLearned && dto.recallQuality >= 1) {
    ```
  - **Verify**: `npm run build` — exit 0; logic: fail lần 1 (isLearned=false) → pass lần 2 → guard true → `_updateWordsLearned` được gọi ✅
  - **Kết quả**: `wordsLearned` tăng đúng khi từ được học thành công bất kể có fail trước đó

#### REQ-02: Path queue bao gồm từ chưa học thành công

- [x] **TODO-2.2.1**: Sửa `getQueue()` — gỡ `nextReview` filter cho từ `isLearned = false` trong path mode
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: Đọc block `if (query.userPathId)` (~lines 56–80) trong `getQueue()`
  - **Thay đổi**: Trong block `if (query.userPathId)`, sau khi resolve `vocabIds`, đổi `where['nextReview']`:
    ```ts
    // Thêm logic: từ trong path hiện ra nếu (SRS due TODAY) HOẶC (chưa học)
    where['nextReview'] = undefined; // bỏ filter nextReview toàn cục
    where['OR'] = [
      { nextReview: { lte: todayEndUtc } },
      { isLearned: false },
    ];
    ```
    Đặt sau dòng `where['vocabularyBaseId'] = { in: vocabIds };`
  - **Verify**: `npm run build` — exit 0
  - **Kết quả**: Path mode trả về cả từ `isLearned = false` dù SRS chưa đến hạn

---

### Phase 3: Frontend Layer

#### REQ-04: Frontend — cập nhật `QueueItem` interface

- [x] **TODO-3.4.1**: Thêm `isLearned` vào `QueueItem` interface trong ReviewPage
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: Đọc interface `QueueItem` (lines 11–24)
  - **Thay đổi**: Thêm field vào interface:
    ```ts
    isLearned: boolean;
    ```
    Thêm sau dòng `isLeech: boolean;`
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: Type-safe khi backend bắt đầu trả về `isLearned`

---

### Phase 4: Integration & Verification

- [x] **TODO-4.1**: Build backend
  - **Thay đổi**: `cd apps/backend && npm run build`
  - **Verify**: Exit 0, không có lỗi TypeScript mới
  - **Kết quả**: Backend artifact sạch

- [x] **TODO-4.2**: TypeScript check frontend
  - **Thay đổi**: `cd apps/frontend && npx tsc --noEmit`
  - **Verify**: Exit 0
  - **Kết quả**: Không có type error

---

## Ghi chú triển khai
- `where['nextReview'] = undefined` xoá key khỏi object Prisma where — Prisma bỏ qua các key `undefined`, nên cách này hoạt động đúng
- `isLearned: true` trong `update` là idempotent — ghi nhiều lần không gây hại
- Migration backfill dùng `review_count >= 1` thay vì join `ReviewHistory` để đơn giản và nhanh; đủ chính xác cho purpose này
- REQ-04 empty state phân biệt được defer — sau fix REQ-02, "Học tiếp" sẽ luôn có từ khi stage chưa xong

## Rủi ro cần theo dõi
- [ ] Risk-1: `prisma migrate dev` có thể fail nếu DB không chạy — Biện pháp: đảm bảo Docker/Postgres up trước khi TODO-1.3.3
- [ ] Risk-3: `userPathId_pathStageId` unique constraint tên — verify trong `schema.prisma` trước khi dùng trong `_autoCompleteStage` (TODO-1.2.2)

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Thêm `isLearned` flag vào `UserVocabulary`, sửa guard `submitReview()` để `wordsLearned` tăng đúng kể cả khi từ fail rồi pass, và mở rộng `getQueue()` để path mode luôn trả về từ chưa học dù SRS chưa đến hạn.

### Thống kê
- **Tổng TODO**: 9
- **Hoàn thành**: 9 ✅
- **Blocked**: 0

### TODO Status

| TODO | Tiêu đề | Status |
|------|---------|--------|
| TODO-1.3.1 | Thêm `isLearned` vào Prisma schema | ✅ Done |
| TODO-1.3.2 | Tạo migration SQL có backfill | ✅ Done |
| TODO-1.3.3 | Apply migration + regenerate Prisma client | ✅ Done |
| TODO-2.1.1 | Thêm `isLearned: true` vào `userVocabulary.update` | ✅ Done |
| TODO-2.1.2 | Đổi guard từ `reviewCount === 0` → `!uv.isLearned` | ✅ Done |
| TODO-2.2.1 | Fix `getQueue()` path mode OR filter | ✅ Done |
| TODO-3.4.1 | Thêm `isLearned` vào `QueueItem` interface | ✅ Done |
| TODO-4.1 | Build backend | ✅ Done |
| TODO-4.2 | TypeScript check frontend | ✅ Done |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/backend/prisma/schema.prisma` | Modified | Thêm `isLearned Boolean @default(false)` + `@@index([userId, isLearned])` |
| `apps/backend/prisma/migrations/20260228000000_add_is_learned/migration.sql` | Created | ALTER TABLE + CREATE INDEX + backfill UPDATE |
| `apps/backend/src/modules/review/review.service.ts` | Modified | 3 thay đổi: `isLearned:true` trong update; guard `!uv.isLearned`; OR filter trong getQueue |
| `apps/frontend/src/pages/ReviewPage.tsx` | Modified | Thêm `isLearned: boolean` vào `QueueItem` interface |

### Verification
- Build backend thành công: ✅ (`nest build` exit 0)
- TypeScript check frontend: ✅ (`tsc --noEmit` exit 0)
- Migration applied thành công: ✅ (`prisma migrate dev` exit 0, column + index created, backfill chạy)
- Không có warning mới: ✅

### Ghi chú
- `where['nextReview'] = undefined` trong path mode: Prisma bỏ qua key `undefined`, nên effective WHERE thành `userId + isSuspended + vocabularyBaseId + OR[nextReview<=today, isLearned=false]`
- Backfill trong migration: `UPDATE user_vocabulary SET is_learned = true WHERE review_count >= 1` — user cũ không bị reset toàn bộ path progress
- REQ-04 (empty state phân biệt) được defer sang UI polish ticket riêng vì không blocking core flow nữa
