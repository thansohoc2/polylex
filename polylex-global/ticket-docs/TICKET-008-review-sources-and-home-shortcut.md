# TICKET-008 — Shortcut học nhanh trên Home + Phân loại nguồn Review

## Yêu cầu gốc

> Muốn có 1 shortcut ở màn hình home bấm vào đó thì vào học. Và phần học review cần phân biệt các từ mới cần học từ các bài học và từ quicknote. Để khi vào review chỉ học đúng các từ cần học. Ví dụ `/review/quicknotes`; `/review/a1`; `/review/...`

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-008 |
| **Tiêu đề** | Shortcut học nhanh trên Home + Phân loại nguồn từ vựng khi Review |
| **Mục tiêu** | (1) Thêm shortcut nhanh trên Dashboard để vào học từ QuickNote; (2) Review Queue phân biệt nguồn từ (quicknote / path / CEFR level), route `/review/:filter` tương ứng |
| **Phạm vi** | Backend (Prisma migration, ReviewService) + Frontend (Router, ReviewPage, DashboardPage, BottomNav) |
| **Độ ưu tiên** | Cao — ảnh hưởng trực tiếp đến UX học tập hàng ngày |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Thêm `sourceType` vào `UserVocabulary` | Thêm field `sourceType: 'quicknote' \| 'path' \| 'manual'` (nullable, migration) | DB | Nhỏ |
| REQ-02 | Gán `sourceType` khi add từ vào UserVocabulary | Khi QuickNote enrichment xong → `sourceType='quicknote'`; khi PathService enroll → `sourceType='path'`; khi user thêm tay → `sourceType='manual'` | Backend | Nhỏ |
| REQ-03 | Backend: filter review queue theo `sourceType` và `cefrLevel` | `GET /review/queue?sourceType=quicknote` hoặc `?cefrLevel=A1` — ReviewQueueQueryDto thêm 2 param mới | Backend | Nhỏ |
| REQ-04 | Frontend: route `/review/:filter` | ReviewPage đọc `filter` từ URL → map sang query params cho API. Filter: `quicknotes`, `a1`…`c2`, `all` | Frontend | Nhỏ |
| REQ-05 | Frontend: Home shortcut "⚡ Học QuickNote" | DashboardPage thêm shortcut với badge đếm số từ QuickNote đang pending review | Frontend | Nhỏ |
| REQ-06 | Frontend: ReviewPage hiển thị tiêu đề theo filter | Header ReviewPage thay đổi theo filter đang active (QuickNote / A1 / All…) | Frontend | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 ──> REQ-03 ──> REQ-04 ──> REQ-06
                                REQ-04 ──> REQ-05
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Thêm `sourceType` vào `UserVocabulary`
- **Mục tiêu**: Track từ đến từ đâu (quicknote / path / manual) để lọc khi review
- **Thay đổi DB**: Thêm column `source_type VARCHAR` nullable vào bảng `user_vocabulary`; default `null` (backward compat với bản ghi cũ)
- **Tiêu chí hoàn thành**: `npx prisma migrate dev` thành công, Prisma Client tái tạo
- **Phụ thuộc**: Không

##### REQ-02: Gán `sourceType` khi add từ vào UserVocabulary
- **Mục tiêu**: Đảm bảo mọi từ mới thêm vào đều có nguồn gốc rõ ràng
- **Điểm thay đổi**:
  - `QuickNoteProcessor` (sau khi enrich xong) → khi gọi `userVocabulary.create/upsert`, thêm `sourceType: 'quicknote'`
  - `PathsService.enrollUser()` và `completeStage()` → `sourceType: 'path'`
  - `VocabularyService.addToUserVocabulary()` (thêm tay) → `sourceType: 'manual'`
- **Phụ thuộc**: REQ-01

##### REQ-03: Backend filter review queue theo sourceType và cefrLevel
- **Mục tiêu**: Cho phép frontend lấy queue chỉ gồm từ từ 1 nguồn cụ thể
- **Thay đổi `ReviewQueueQueryDto`**:
  ```
  sourceType?: 'quicknote' | 'path' | 'manual'
  cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'
  ```
- **Thay đổi `ReviewService.getQueue()`**:
  - Nếu `sourceType` có → thêm `where.sourceType = sourceType`
  - Nếu `cefrLevel` có → thêm `where.vocabularyBase = { cefrLevel }`
  - 2 filter có thể kết hợp
- **Phụ thuộc**: REQ-01

##### REQ-04: Frontend route `/review/:filter`
- **Mục tiêu**: User có thể bookmark/chia sẻ link review theo nguồn
- **Filter map**:
  | URL | API params |
  |-----|-----------|
  | `/review/all` | (không filter) |
  | `/review/quicknotes` | `?sourceType=quicknote` |
  | `/review/a1` | `?cefrLevel=A1` |
  | `/review/b1` | `?cefrLevel=B1` |
  | `/review` (cũ) | redirect → `/review/all` |
- **Phụ thuộc**: REQ-03

##### REQ-05: Home shortcut "⚡ Học QuickNote"
- **Mục tiêu**: User bấm 1 nút trên Dashboard là vào review từ QuickNote ngay
- **Vị trí**: Trong `DashboardPage` — khu vực "Quick start buttons" (đã có grid 2 cột gồm "Start Review" và "Vocabulary")
- **Badge**: Gọi `GET /review/queue?sourceType=quicknote&limit=1` để lấy count → hiển thị số `(N)` hoặc ẩn badge nếu = 0
- **Điều hướng**: `navigate('/review/quicknotes')`
- **Phụ thuộc**: REQ-03, REQ-04

##### REQ-06: ReviewPage hiển thị tiêu đề theo filter
- **Mục tiêu**: UX rõ ràng — user biết đang học nguồn nào
- **Header map**:
  - `quicknotes` → "⚡ Quick Notes"
  - `a1`…`c2` → "📘 Level A1" (v.v.)
  - `all` | không có → "🔁 Review"
- **Phụ thuộc**: REQ-04

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng hiện tại**: User vào `/review` → `ReviewService.getQueue()` lấy TẤT CẢ từ due (`isSuspended=false`, `nextReview ≤ endOfDay`), không phân biệt nguồn. Kết quả mix từ QuickNote + Path + thêm tay.
- **Vấn đề**: User muốn practice chỉ từ QuickNote (từ mới gặp hôm nay) mà không bị trộn với từ SRS dài hạn từ bài học.
- **Thực thể quan trọng**: `UserVocabulary` (SRS state), `QuickNote` (→ `vocabularyBaseId`), `PathStageVocab` (→ `vocabularyBaseId`).
- **Quy tắc bảo toàn**: ACRE algorithm và `submitReview` không thay đổi — nguồn `sourceType` chỉ ảnh hưởng đến filter, không ảnh hưởng đến cách tính interval.

---

### 4. Ngữ cảnh kỹ thuật

#### Trạng thái hiện tại

| File | Vai trò |
|------|--------|
| `apps/backend/prisma/schema.prisma` | `UserVocabulary` — chưa có `sourceType` |
| `apps/backend/src/modules/review/review.service.ts` | `getQueue()` — filter hiện tại: `languageCode` + `limit` |
| `apps/backend/src/modules/review/dto/review.dto.ts` | `ReviewQueueQueryDto` — chỉ có `languageCode`, `limit` |
| `apps/backend/src/modules/quick-note/quick-note.processor.ts` | Sau khi enrich xong, link QuickNote → VocabularyBase (chưa add vào UserVocabulary) |
| `apps/backend/src/modules/paths/paths.service.ts` | `enrollUser()` + `completeStage()` — dùng `userVocabulary.createMany`, chưa có `sourceType` |
| `apps/backend/src/modules/vocabulary/vocabulary.service.ts` | `addToUserVocabulary()` — upsert, chưa có `sourceType` |
| `apps/frontend/src/App.tsx` | Route hiện tại: `<Route path="review" element={<ReviewPage />} />` — không có sub-route |
| `apps/frontend/src/pages/ReviewPage.tsx` | Gọi `reviewApi.getQueue({ limit: 20 })` — không truyền filter |
| `apps/frontend/src/pages/DashboardPage.tsx` | Grid 2 nút: "Start Review" + "Vocabulary" — chưa có QuickNote shortcut |
| `apps/frontend/src/api/client.ts` | `reviewApi.getQueue(params)` — đã có params nhưng chưa có `sourceType` |

#### Điểm quan trọng phát hiện

1. **QuickNote hiện KHÔNG tự add vào `UserVocabulary`** khi enrichment xong — cần kiểm tra `quick-note.processor.ts` xem flow hiện tại. Nếu chưa add, cần thêm bước đó.
2. **`PathsService` đã add vào `UserVocabulary`** (trong `enrollUser` và `completeStage`) — cần thêm `sourceType: 'path'`.
3. **`languageCode` filter hiện có** trong `ReviewQueueQueryDto` → pattern tương tự để thêm `sourceType` và `cefrLevel`.

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `UserVocabulary` không có `sourceType` | Có `sourceType` nullable: `quicknote/path/manual` | Prisma migration + code update |
| `getQueue()` chỉ filter theo `languageCode` | Filter thêm `sourceType`, `cefrLevel` | Mở rộng `ReviewQueueQueryDto` + `where` clause |
| `/review` route cố định | `/review/:filter` dynamic | Router update + ReviewPage đọc params |
| Dashboard có "Start Review" chung | Có shortcut "⚡ Học QuickNote" với badge | DashboardPage thêm card |
| QuickNote enrichment xong → chưa vào UserVocabulary | Sau enrich DONE → tự add vào UserVocabulary với `sourceType='quicknote'` | QuickNoteProcessor update |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **QuickNote chưa được add vào UserVocabulary**: Nếu processor hiện tại không làm bước này, shortcut Review QuickNote sẽ trả về queue rỗng → cần verify `quick-note.processor.ts` và thêm nếu thiếu.
- [ ] **Bản ghi UserVocabulary cũ** (`sourceType = null`) sẽ không xuất hiện khi filter `sourceType=quicknote` — đây là behavior đúng, nhưng cần thông báo user hoặc hiển thị gợi ý.

#### 6.2 Rủi ro kỹ thuật
- [ ] **Migration `sourceType` nullable**: Column mới nullable, default null → không break bản ghi cũ. An toàn.
- [ ] **Route change `/review` → `/review/:filter`**: Cần giữ backward compat — `/review` không có filter redirect sang `/review/all` hoặc tương đương để không break bookmark cũ và BottomNav link.
- [ ] **N+1 khi count badge**: `GET /review/queue?sourceType=quicknote&limit=1` để count không hiệu quả. Nên thêm endpoint `GET /review/count` hoặc thêm param `countOnly=true`. Hoặc đơn giản dùng chính `getQueue` và lấy `.length`.

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **cefrLevel filter kết hợp với sourceType**: Nếu user gọi `?sourceType=quicknote&cefrLevel=A1` — behavior cần rõ ràng (AND condition). Code hiện tại không hỗ trợ kết hợp — cần đảm bảo cả 2 where condition được AND.
- [ ] **Từ QuickNote chưa enrich xong (status = PENDING/PROCESSING)** sẽ chưa có `vocabularyBaseId` → chưa có trong `UserVocabulary` → không xuất hiện trong queue (đúng behavior, cần xử lý empty state tốt).

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Không thay đổi ACRE engine — học vẫn là SRS chuẩn | Migration DB cần chạy lại |
| Filter dựa trên `sourceType` rõ ràng, scalable (có thể thêm `sourceType='ai-path'` sau) | Bản ghi cũ `sourceType=null` cần xử lý graceful |
| Route `/review/:filter` dễ bookmark, dễ share | BottomNav "Review" cần quyết định nav đến `/review/all` hay `/review` |
| CEFR filter dùng lại data đã có (không cần thêm bảng) | |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**:
  1. Thêm `sourceType String?` vào `UserVocabulary` schema → migrate
  2. Cập nhật 3 điểm add vào `UserVocabulary`: QuickNoteProcessor, PathsService, VocabularyService
  3. Mở rộng `ReviewQueueQueryDto` + `getQueue()` where clause
  4. Frontend: thêm route `/review/:filter?` (optional param — không có = `all`), ReviewPage đọc param
  5. Dashboard: thêm shortcut card thứ 3 "⚡ QuickNote" navigate `/review/quicknotes`

- **Không cần**: Endpoint riêng `/review/count` — dùng lại `getQueue` với `limit=100` đủ cho badge count

- **Ước tính công sức**: ~4–5 giờ (2h backend migration + service, 2–3h frontend router + UI)

---

### 9. Câu hỏi mở

- [x] ~~`QuickNoteProcessor` hiện tại sau khi enrich xong có tự add từ vào `UserVocabulary` không?~~ → **ĐÃ XÁC NHẬN**: `quick-note.processor.ts` line 80 gọi `addToUserVocabulary(note.userId, vocabBaseId)` — từ QuickNote đã vào `UserVocabulary`, chỉ cần thêm `sourceType='quicknote'` vào lời gọi đó.
- [x] ~~BottomNav tab "Review" hiện navigate `/review` — sau khi đổi route, nên nav đến `/review/all` hay giữ nguyên?~~ → **Quyết định**: Giữ `/review` — khi vào không có filter sẽ tự detect và redirect.
- [x] ~~Home shortcut: nên mở rộng grid 2 cột → 3 cột?~~ → **Quyết định**: Mở rộng grid 3 cột.
- [x] ~~Filter `/review/path` có cần không?~~ → **Quyết định**: Có — đã thêm `sourceType=path` và route `/review/path`.

---

## KẾ HOẠCH TRIỂN KHAI (PLAN TODO)

### Phase 1 — Database

- [x] **TODO-1.1**: Thêm `sourceType String?` vào model `UserVocabulary`
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Model `UserVocabulary`, các relations hiện có
  - **Thay đổi**: Thêm field `sourceType String? @map("source_type")` — nullable để backward compat
  - **Verify**: Schema compile, không break relations hiện tại
  - **Kết quả**: Model có field mới

- [x] **TODO-1.2**: Tạo và chạy migration Prisma
  - **File**: `prisma/migrations/`
  - **Context**: Migration lock, các migration hiện có
  - **Thay đổi**: `npx prisma migrate dev --name add_source_type_to_user_vocabulary`
  - **Verify**: Migration áp dụng thành công, Prisma Client tái tạo
  - **Kết quả**: Migration `20260228093518_add_source_type_to_user_vocabulary` applied

---

### Phase 2 — Backend Service

- [x] **TODO-2.1**: Mở rộng `ReviewQueueQueryDto` — thêm `sourceType` và `cefrLevel`
  - **File**: `apps/backend/src/modules/review/dto/review.dto.ts`
  - **Context**: DTO hiện tại, `class-validator` decorators
  - **Thay đổi**: Thêm `sourceType?: string` với `@IsIn(['quicknote','path','manual'])` và `cefrLevel?: string` với `@IsIn(['A1','A2','B1','B2','C1','C2'])`
  - **Verify**: `npm run build`
  - **Kết quả**: DTO nhận 2 query params mới

- [x] **TODO-2.2**: Mở rộng `ReviewService.getQueue()` — filter theo `sourceType` và `cefrLevel`
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: `getQueue()` hiện tại, Prisma `where` clause
  - **Thay đổi**: Build `vocabBaseFilter` riêng cho `languageId` + `cefrLevel`, merge vào `where`; thêm `where['sourceType']` khi có
  - **Verify**: `npm run build`, query không N+1
  - **Kết quả**: `GET /review/queue?sourceType=quicknote` trả về đúng nguồn

- [x] **TODO-2.3**: Cập nhật `VocabularyService.addToUserVocabulary()` — nhận `sourceType?`
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.service.ts`
  - **Context**: `addToUserVocabulary()` hiện tại, `upsert` pattern
  - **Thay đổi**: Thêm param `sourceType?: string`; set trên `create`, không ghi đè trên `update` (preserve original source)
  - **Verify**: `npm run build`
  - **Kết quả**: Source được ghi vào bản ghi mới

- [x] **TODO-2.4**: Cập nhật `VocabularyController` — truyền `'manual'`
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.controller.ts`
  - **Context**: `addToMyList()` endpoint
  - **Thay đổi**: `addToUserVocabulary(user.id, id, 'manual')`
  - **Verify**: `npm run build`
  - **Kết quả**: Từ thêm tay có `sourceType='manual'`

- [x] **TODO-2.5**: Cập nhật `QuickNoteProcessor` — truyền `'quicknote'`
  - **File**: `apps/backend/src/modules/quick-note/quick-note.processor.ts`
  - **Context**: `handleEnrich()` — bước `addToUserVocabulary` sau enrich
  - **Thay đổi**: `addToUserVocabulary(note.userId, vocabBaseId, 'quicknote')`
  - **Verify**: `npm run build`
  - **Kết quả**: Từ QuickNote có `sourceType='quicknote'`

- [x] **TODO-2.6**: Cập nhật `PathsService` — truyền `sourceType='path'` tại 2 điểm
  - **File**: `apps/backend/src/modules/paths/paths.service.ts`
  - **Context**: `enrollUser()` và `completeStage()` — `createMany` calls
  - **Thay đổi**: Thêm `sourceType: 'path'` vào cả 2 `createMany` data objects
  - **Verify**: `npm run build`
  - **Kết quả**: Từ learning path có `sourceType='path'`

---

### Phase 3 — Frontend Router & API

- [x] **TODO-3.1**: Thêm route `/review/:filter` vào `App.tsx`
  - **File**: `apps/frontend/src/App.tsx`
  - **Context**: Routes hiện có trong `<RequireAuth>`
  - **Thay đổi**: Thêm `<Route path="review/:filter" element={<ReviewPage />} />` song song `/review`
  - **Verify**: `npx tsc --noEmit`
  - **Kết quả**: `/review/quicknotes`, `/review/a1`, v.v. đều render `ReviewPage`

- [x] **TODO-3.2**: Mở rộng `reviewApi.getQueue()` trong `client.ts`
  - **File**: `apps/frontend/src/api/client.ts`
  - **Context**: `reviewApi` object hiện tại
  - **Thay đổi**: Thêm `sourceType?: string` và `cefrLevel?: string` vào params type
  - **Verify**: `npx tsc --noEmit`
  - **Kết quả**: Frontend có thể gọi API với filter mới

---

### Phase 4 — ReviewPage

- [x] **TODO-4.1**: `ReviewPage` đọc `filter` từ URL và map sang API params
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: `ReviewPage` hiện tại, `useParams`, `useNavigate`
  - **Thay đổi**:
    - Import `useParams`, `useNavigate`
    - `getQueryParams(filter)`: map `quicknotes`→`{sourceType:'quicknote'}`, `a1`→`{cefrLevel:'A1'}`, v.v.
    - `loadQueue()` dùng `getQueryParams(filter)`
  - **Verify**: `npx tsc --noEmit`
  - **Kết quả**: Queue chỉ chứa từ đúng nguồn

- [x] **TODO-4.2**: Auto-redirect từ `/review` (không filter) đến filter phù hợp nhất
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: `useEffect`, `useNavigate`
  - **Thay đổi**: Khi `filter === undefined`, fetch all due → nếu có `quicknote` → redirect `/review/quicknotes`; nếu có `path` → `/review/path`; else → `/review/all`
  - **Verify**: `npx tsc --noEmit`
  - **Kết quả**: `/review` tự navigate thông minh

- [x] **TODO-4.3**: Dynamic title trên `ReviewPage` theo filter
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: `AppShell title` prop
  - **Thay đổi**: `getTitle(filter)` → `'⚡ Quick Notes'` / `'📘 Level A1'` / `'🔁 Review'`; pass vào `<AppShell title={title}>`
  - **Verify**: `npx tsc --noEmit`
  - **Kết quả**: Header phản ánh nguồn đang học

- [x] **TODO-4.4**: Empty state có nút "Review all instead →" khi filter không có kết quả
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: Phase `idle` render hiện tại
  - **Thay đổi**: Khi `phase === 'idle'` và `filter !== 'all'`, hiển thị `<button onClick={() => navigate('/review/all')}>Review all words instead →</button>`
  - **Verify**: `npx tsc --noEmit`
  - **Kết quả**: UX tốt hơn khi không có từ cần học theo filter

---

### Phase 5 — DashboardPage

- [x] **TODO-5.1**: Fetch `quickNoteCount` — số từ QuickNote đang due
  - **File**: `apps/frontend/src/pages/DashboardPage.tsx`
  - **Context**: `useEffect` fetch hiện tại, `reviewApi`
  - **Thay đổi**: Thêm `Promise.allSettled` call thứ 5: `reviewApi.getQueue({ sourceType: 'quicknote', limit: 20 })`; state `quickNoteCount`
  - **Verify**: `npx tsc --noEmit`
  - **Kết quả**: Có count cho badge

- [x] **TODO-5.2**: Đổi grid 2 cột → 3 cột, thêm card "⚡ Quick Notes"
  - **File**: `apps/frontend/src/pages/DashboardPage.tsx`
  - **Context**: "Quick start buttons" section
  - **Thay đổi**: `grid-cols-2` → `grid-cols-3`; thêm card "⚡ Quick Notes" với badge count, navigate `/review/quicknotes`; padding giảm cho vừa 3 cột
  - **Verify**: `npx tsc --noEmit`
  - **Kết quả**: Home có shortcut học QuickNote nổi bật

- [x] **TODO-5.3**: Cập nhật "Review all →" link dùng `/review/all`
  - **File**: `apps/frontend/src/pages/DashboardPage.tsx`
  - **Context**: Phần "Due for Review" section
  - **Thay đổi**: `navigate('/review')` → `navigate('/review/all')`
  - **Verify**: `npx tsc --noEmit`
  - **Kết quả**: Không bị loop redirect

---

### Phase 6 — BottomNav

- [x] **TODO-6.1**: BottomNav "Review" tab active khi ở bất kỳ `/review/*`
  - **File**: `apps/frontend/src/components/layout/BottomNav.tsx`
  - **Context**: `isActive` logic hiện tại
  - **Thay đổi**: `isActive = location.pathname === tab.path || location.pathname.startsWith(tab.path + '/')`
  - **Verify**: `npx tsc --noEmit`
  - **Kết quả**: Tab "Review" vẫn sáng khi ở `/review/quicknotes`, v.v.

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Thêm shortcut "⚡ Quick Notes" trên Home và phân loại nguồn từ vựng khi Review: `/review` tự detect và redirect đến filter phù hợp nhất; `/review/quicknotes`, `/review/path`, `/review/a1`–`/review/c2` đều hoạt động với queue đúng nguồn.

### Thống kê
- **Tổng TODO**: 15
- **Hoàn thành**: 15 ✅
- **Blocked**: 0

### TODO Status

| TODO | Tiêu đề | Status |
|------|---------|--------|
| TODO-1.1 | `sourceType` field vào schema | ✅ Done |
| TODO-1.2 | Prisma migration | ✅ Done |
| TODO-2.1 | `ReviewQueueQueryDto` — thêm 2 filters | ✅ Done |
| TODO-2.2 | `ReviewService.getQueue()` — filter logic | ✅ Done |
| TODO-2.3 | `VocabularyService.addToUserVocabulary()` — param `sourceType?` | ✅ Done |
| TODO-2.4 | `VocabularyController` — pass `'manual'` | ✅ Done |
| TODO-2.5 | `QuickNoteProcessor` — pass `'quicknote'` | ✅ Done |
| TODO-2.6 | `PathsService` — pass `'path'` tại 2 điểm | ✅ Done |
| TODO-3.1 | `App.tsx` — route `/review/:filter` | ✅ Done |
| TODO-3.2 | `client.ts` — extend `reviewApi` params | ✅ Done |
| TODO-4.1 | `ReviewPage` — đọc filter, map params | ✅ Done |
| TODO-4.2 | `ReviewPage` — auto-redirect khi không có filter | ✅ Done |
| TODO-4.3 | `ReviewPage` — dynamic title | ✅ Done |
| TODO-4.4 | `ReviewPage` — empty state fallback button | ✅ Done |
| TODO-5.1 | `DashboardPage` — fetch quickNoteCount | ✅ Done |
| TODO-5.2 | `DashboardPage` — grid 3 cột + card QuickNote | ✅ Done |
| TODO-5.3 | `DashboardPage` — "Review all →" dùng `/review/all` | ✅ Done |
| TODO-6.1 | `BottomNav` — active khi `/review/*` | ✅ Done |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/backend/prisma/schema.prisma` | Modified | Thêm `sourceType String? @map("source_type")` vào `UserVocabulary` |
| `apps/backend/prisma/migrations/20260228093518_add_source_type_to_user_vocabulary/migration.sql` | Created | ALTER TABLE thêm column `source_type` |
| `apps/backend/src/modules/review/dto/review.dto.ts` | Modified | Thêm `sourceType?` + `cefrLevel?` với `@IsIn` validation |
| `apps/backend/src/modules/review/review.service.ts` | Modified | `getQueue()` filter by `sourceType` và `cefrLevel` (AND với `languageId`) |
| `apps/backend/src/modules/vocabulary/vocabulary.service.ts` | Modified | `addToUserVocabulary(userId, vocabId, sourceType?)` — set on create |
| `apps/backend/src/modules/vocabulary/vocabulary.controller.ts` | Modified | Pass `'manual'` khi user thêm từ tay |
| `apps/backend/src/modules/quick-note/quick-note.processor.ts` | Modified | Pass `'quicknote'` sau khi enrich xong |
| `apps/backend/src/modules/paths/paths.service.ts` | Modified | `sourceType: 'path'` trong `enrollUser()` và `completeStage()` |
| `apps/frontend/src/App.tsx` | Modified | Thêm route `review/:filter` song song `review` |
| `apps/frontend/src/api/client.ts` | Modified | `reviewApi.getQueue` nhận `sourceType?` + `cefrLevel?` |
| `apps/frontend/src/pages/ReviewPage.tsx` | Modified | `useParams`, auto-redirect, dynamic title, empty state fallback |
| `apps/frontend/src/pages/DashboardPage.tsx` | Modified | Grid 3 cột, fetch quickNoteCount, card ⚡ Quick Notes với badge |
| `apps/frontend/src/components/layout/BottomNav.tsx` | Modified | `isActive` check dùng `startsWith` cho sub-routes |

### Verification
- ✅ Build thành công: `nest build` → exit 0
- ✅ Frontend type check: `npx tsc --noEmit` → exit 0
- ✅ Prisma migration applied: `20260228093518_add_source_type_to_user_vocabulary`
- ✅ Không có warning mới

### Ghi chú
- `sourceType` chỉ được set trên `create`, không ghi đè trên `update` (`upsert`) — tức là nếu từ đã có trong `UserVocabulary` trước khi được enrich qua QuickNote, `sourceType` của bản ghi gốc được giữ nguyên.
- `cefrLevel` filter yêu cầu join `vocabularyBase` — được handle trong `vocabBaseFilter` object, AND với `languageId` filter nếu cả 2 có mặt.
- Bản ghi `UserVocabulary` cũ (`sourceType = null`) sẽ không xuất hiện khi filter theo `sourceType` — đây là behavior đúng. Filter `/review/all` (không truyền `sourceType`) vẫn trả về tất cả kể cả null.

