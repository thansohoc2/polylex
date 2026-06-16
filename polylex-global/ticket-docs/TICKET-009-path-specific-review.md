# TICKET-009 — Review theo lộ trình học cụ thể

## Yêu cầu gốc

> Trong lộ trình học cần biết đang học cho lộ trình nào. Khi nào học xong để mở khoá học tiếp. Khi bấm vào học thì vào đúng path `/review/path-dang-hoc`.

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-009 |
| **Tiêu đề** | Review từ vựng theo lộ trình học cụ thể + cập nhật tiến độ chặng |
| **Mục tiêu** | (1) Nút "Học tiếp →" trong StageRow dẫn đến route `/review/path/<userPathId>` đúng với lộ trình đang học; (2) Tiến độ `wordsLearned` trên `UserPathStage` được cập nhật sau mỗi lần review; (3) ReviewPage hiển thị tên lộ trình đang học khi vào từ path cụ thể |
| **Phạm vi** | Backend (ReviewService, PathsService, ReviewDto) + Frontend (Router, ReviewPage, PathCard, StageRow, client.ts) |
| **Độ ưu tiên** | Cao — không có tính năng này thì tiến độ học của lộ trình luôn đứng ở 0% |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Backend: filter review queue theo `userPathId` | `GET /review/queue?userPathId=<id>` trả về chỉ từ của lộ trình đó (các stage đã unlock) | Backend | Trung bình |
| REQ-02 | Backend: cập nhật `wordsLearned` sau review | Sau mỗi `submitReview()`, tìm `UserPathStage` chứa từ vừa review và tăng `wordsLearned` | Backend | Trung bình |
| REQ-03 | Backend: trả về `pathTitle` trong review queue | `ReviewPage` cần biết tên lộ trình để hiển thị header | Backend | Nhỏ |
| REQ-04 | Frontend: route `/review/path/:userPathId` | Thêm route mới, `ReviewPage` xử lý param `userPathId` | Frontend | Nhỏ |
| REQ-05 | Frontend: "Học tiếp →" navigate đúng path | `StageRow` nhận `userPathId`, nút navigate `/review/path/<userPathId>` | Frontend | Nhỏ |
| REQ-06 | Frontend: ReviewPage title & context khi học path | Header hiển thị "🗺️ <Tên lộ trình>" thay vì generic "🔁 Review" | Frontend | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-04 ──> REQ-05
                 └──> REQ-06
REQ-02 (độc lập — background update sau review)
REQ-03 ──> REQ-06
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Backend filter review queue theo `userPathId`
- **Mục tiêu**: Khi frontend gọi `GET /review/queue?userPathId=abc-123`, trả về các `UserVocabulary` thuộc về path đó (và đang due)
- **Cơ chế**: Không cần migration — tính toán vocab IDs tại query time qua JOIN:
  `UserPath(id) → UserPathStage(isUnlocked=true) → PathStage → PathStageVocab → vocabularyBaseId`
  Sau đó filter `UserVocabulary.vocabularyBaseId IN [...]`
- **Phụ thuộc**: Không

##### REQ-02: Cập nhật `wordsLearned` sau review
- **Mục tiêu**: Mỗi khi user `submitReview()` thành công (recallQuality ≥ 1), tìm `UserPathStage` chứa từ đó và increment `wordsLearned` (nếu chưa được count lần này)
- **Logic điều kiện**: Một từ chỉ được count một lần cho mỗi chặng (dùng `reviewCount = 1` lần đầu làm mốc, hoặc kiểm tra `wordsLearned < wordCount`)
- **Cơ chế**:
  1. Lấy `vocabularyBaseId` từ `UserVocabulary` vừa review
  2. Tìm `PathStageVocab` có `vocabularyBaseId` đó → lấy `pathStageId`
  3. Tìm `UserPathStage` có `pathStageId` đó và `userPath.userId = userId` và `isUnlocked = true`
  4. Nếu tìm thấy và `wordsLearned < wordCount` → `wordsLearned++`
- **Phụ thuộc**: Không (nhưng cần implement trước REQ-06 vì REQ-06 phụ thuộc vào dữ liệu này)

##### REQ-03: `getQueue()` trả về `pathTitle` khi filter theo `userPathId`
- **Mục tiêu**: Frontend có thể hiển thị tên lộ trình trong header ReviewPage
- **Cách làm**: `ReviewService.getQueue()` khi có `userPathId` → join lấy `UserPath → PathTemplate.title`, trả về `{ items, pathTitle? }` thay vì chỉ array
- **Phụ thuộc**: REQ-01

##### REQ-04: Frontend route `/review/path/:userPathId`
- **Mục tiêu**: URL clean và có thể bookmark; `ReviewPage` hiểu được đang review path nào
- **Thay đổi**: `App.tsx` thêm `<Route path="review/path/:userPathId" element={<ReviewPage />} />`; `ReviewPage` dùng `useParams()` kiểm tra cả `filter` lẫn `userPathId`
- **Phụ thuộc**: Không

##### REQ-05: "Học tiếp →" trong `StageRow` navigate đúng path
- **Mục tiêu**: User bấm "Học tiếp →" trên stage đang học → review đúng lộ trình đó
- **Thay đổi**:
  - `PathCard` truyền `path.id` (= `UserPath.id`) xuống `StageRow` qua prop `userPathId`
  - `StageRow` nút "Học tiếp →": `navigate('/review/path/' + userPathId)`
- **Phụ thuộc**: REQ-04

##### REQ-06: ReviewPage hiển thị tên lộ trình
- **Mục tiêu**: Khi review path cụ thể, header hiển thị "🗺️ Giao tiếp hằng ngày A1" thay vì "🔁 Review"
- **Thay đổi**: `ReviewPage` giữ state `pathTitle`, set từ response của `getQueue()`; `AppShell title={pathTitle || getTitle(filter)}`
- **Phụ thuộc**: REQ-03, REQ-04

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng hiện tại**:
  1. User có lộ trình học (UserPath) với các chặng (UserPathStage)
  2. Chặng 1 mở ngay khi enroll; chặng tiếp theo mở sau khi complete chặng trước
  3. Để "complete" chặng, cần `wordsLearned >= wordCount * 0.8` — nhưng `wordsLearned` LUÔN = 0 (không bao giờ được cập nhật)
  4. Nút "Học tiếp →" navigate đến `/review` chung chung (tất cả từ due, không phân biệt path)

- **Vấn đề cốt lõi**:
  - `wordsLearned` = 0 mãi → `canComplete` = false mãi → user KHÔNG THỂ complete chặng thông qua review
  - "Học tiếp →" không biết đang học path nào → review mix với tất cả từ khác
  - Không có feedback cho user biết họ đang học bao nhiêu từ của path này

- **Quy tắc nghiệp vụ cần bảo toàn**:
  - Một từ được "learned" khi `recallQuality >= 1` (không phải 0 = quên hoàn toàn)
  - `wordsLearned` tăng tối đa đến `wordCount` (không tăng quá)
  - Mỗi từ chỉ được count 1 lần cho 1 chặng (tránh count nhiều lần khi review lại)
  - Unlock chặng tiếp vẫn dùng nút thủ công "✅ Hoàn thành chặng" — giữ nguyên behavior

---

### 4. Ngữ cảnh kỹ thuật

#### Trạng thái hiện tại

| File | Vai trò | Vấn đề |
|------|--------|--------|
| `schema.prisma` | `UserPathStage.wordsLearned` — field tồn tại nhưng = 0 mãi | Không có cơ chế update |
| `review.service.ts` | `getQueue()` — filter `sourceType`, `cefrLevel`, `languageCode` | Không có `userPathId` filter |
| `review.service.ts` | `submitReview()` — cập nhật ACRE + lịch sử | Không update `wordsLearned` |
| `review.dto.ts` | `ReviewQueueQueryDto` — `sourceType`, `cefrLevel`, `languageCode`, `limit` | Thiếu `userPathId?` |
| `paths.service.ts` | `enrollUser()`, `completeStage()` — logic unlock | `completeStage()` không check `wordsLearned` (phụ thuộc FE) |
| `StageRow.tsx` | Button "Học tiếp →" → `navigate('/review')` | Sai route |
| `PathCard.tsx` | Render `StageRow` — có `path.id` (UserPath.id) | Không truyền `userPathId` xuống StageRow |
| `client.ts` | `reviewApi.getQueue(params)` | Thiếu `userPathId?` |
| `App.tsx` | Routes review | Thiếu route `/review/path/:userPathId` |

#### Data model liên quan

```
UserPath (id, userId, pathTemplateId, currentStageOrder)
  └─> UserPathStage (id, userPathId, pathStageId, isUnlocked, wordsLearned)
        └─> PathStage (id, pathTemplateId, order, wordCount)
              └─> PathStageVocab (pathStageId, vocabularyBaseId)
                    └─> VocabularyBase (id, term, cefrLevel)
                          └─> UserVocabulary (userId, vocabularyBaseId, sourceType)
```

**Điểm join để filter**: `UserPath.id → UserPathStage.userPathId (isUnlocked) → PathStage.id → PathStageVocab.pathStageId → PathStageVocab.vocabularyBaseId`

**Điểm join để update wordsLearned**: `ReviewHistory.vocabularyBaseId → PathStageVocab.vocabularyBaseId → PathStage.id → UserPathStage.pathStageId (userId từ userPath.userId)`

#### `wordsLearned` hiện tại

```
UserPathStage.wordsLearned
  → Được tạo với giá trị 0 trong enrollUser() và completeStage()
  → Không có UPDATE nào trong toàn bộ codebase
  → StageRow.canComplete = wordsLearned >= wordCount * 0.8 → luôn false
```

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `wordsLearned` = 0 mãi | Tăng sau mỗi lần review đúng | `submitReview()` update `UserPathStage.wordsLearned` |
| `getQueue()` không biết `userPathId` | Filter queue theo path cụ thể | Thêm `userPathId` filter qua JOIN |
| "Học tiếp →" → `/review` | "Học tiếp →" → `/review/path/<userPathId>` | `StageRow` nhận `userPathId`, navigate đúng |
| `ReviewPage` title generic | Title hiển thị tên lộ trình đang học | `getQueue()` trả kèm `pathTitle`; `ReviewPage` hiển thị |
| Không có route `/review/path/:id` | Route `/review/path/:userPathId` tồn tại | `App.tsx` + `ReviewPage` handle param mới |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Đếm `wordsLearned` nhiều lần**: Nếu user review cùng một từ nhiều lần trong ngày, `wordsLearned` có thể tăng quá `wordCount`. → Biện pháp: chỉ increment nếu `wordsLearned < wordCount` và đây là lần review "để học" (`reviewCount` cộng từ 0→1, hoặc dùng `lastReviewedAt` so sánh với `unlockedAt`)
- [ ] **Từ thuộc nhiều path**: Một `vocabularyBaseId` có thể xuất hiện trong nhiều `PathStageVocab` khác nhau. Cần cẩn thận khi update — chỉ update `UserPathStage` của path mà user đang trong session review (hoặc tất cả path có chứa từ đó và đã unlock)

#### 6.2 Rủi ro kỹ thuật
- [ ] **Performance của JOIN filter**: Khi filter `userPathId`, sub-query để lấy vocab IDs của path có thể lớn nếu path có nhiều từ (~100 từ). → Biện pháp: `WHERE vocabularyBaseId IN (SELECT ...)` hiệu quả với index đã có trên `PathStageVocab.pathStageId` và `UserVocabulary.userId`
- [ ] **Update `wordsLearned` trong `submitReview()`**: Thêm 2 query (findMany PathStageVocab + updateMany UserPathStage) vào critical path của review. → Biện pháp: dùng `upsert` / `updateMany` với `where` chính xác, wrap trong cùng transaction
- [ ] **Response type thay đổi**: `getQueue()` hiện trả về `UserVocabulary[]`. Nếu thêm `pathTitle`, cần wrap thành `{ items, pathTitle? }`. → Có thể break frontend nếu không handle gracefully. → Thêm optional field hoặc dùng separate endpoint `GET /review/path-info/:userPathId`

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **Queue rỗng cho path**: Nếu tất cả từ của path chưa due (nextReview > endOfDay), queue trả về rỗng. → `ReviewPage` cần empty state riêng cho path: "Tất cả từ trong lộ trình này đã học hôm nay — quay lại sau!" kèm nút "Về lộ trình"
- [ ] **Path không tồn tại / user không enroll**: `GET /review/queue?userPathId=invalid` → `ReviewService` nên trả về `[]` (không throw 404) để không crash ReviewPage
- [ ] **Khi complete stage rồi vào review path**: Stage cũ đã completed nhưng stage mới chưa có từ do (nextReview > today) → queue rỗng. Expected behavior nhưng cần empty state rõ ràng
- [ ] **`wordsLearned` reset khi stage completed**: Sau khi complete stage và unlock stage mới, `wordsLearned` của stage mới = 0 (đúng). Stage cũ đã completed không cần update nữa.

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Không cần migration DB (JOIN at query time) | Query phức tạp hơn trong `getQueue()` |
| URL clean, bookmarkable `/review/path/<id>` | `ReviewPage` phải xử lý nhiều loại params hơn |
| `wordsLearned` track được tiến độ thực tế | `submitReview()` chậm hơn một chút (2 thêm query) |
| User biết rõ đang học lộ trình nào | Cần refactor response type của `getQueue()` nhẹ |
| Giải quyết `canComplete` luôn false | |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**:
  1. Thêm `userPathId?` vào `ReviewQueueQueryDto`; `getQueue()` filter qua JOIN khi có `userPathId`
  2. `getQueue()` trả về `{ items: UserVocabulary[], pathTitle?: string }` khi có `userPathId` (backward compat: nếu không có `userPathId` thì response giữ nguyên là array, hoặc luôn wrap trong object)
  3. `submitReview()` sau khi update ACRE → tìm và update `wordsLearned` cho `UserPathStage` liên quan
  4. Thêm route `review/path/:userPathId` trong `App.tsx`
  5. `PathCard` truyền `path.id` (UserPath.id) xuống `StageRow`; "Học tiếp →" dùng route mới
  6. `ReviewPage` detect `userPathId` param, set pathTitle, empty state riêng

- **Thay thế response type**: Thay vì thay đổi format response (có thể break), thêm endpoint `GET /review/queue` (giữ array) và `GET /review/path-context/:userPathId` chỉ trả `{ pathTitle, totalWords, wordsLearned }` để frontend tự fetch. → Cleaner API nhưng thêm 1 round-trip.

- **Ước tính công sức**: ~3–4 giờ (1.5h backend query + wordsLearned, 1.5–2h frontend router + component)

---

### 9. Câu hỏi mở

- [x] ~~**Response format `getQueue()`**~~ → **Quyết định**: Luôn wrap response thành `{ items: [...], pathTitle?: string }` — client cũ được cập nhật đồng thời, đơn giản và nhất quán hơn dùng 2 endpoint riêng.
- [x] ~~**`wordsLearned` counting rule**~~ → **Quyết định**: Count khi `recallQuality >= 1` **VÀ** `uv.reviewCount === 0` (tức là lần review đầu tiên — trước khi increment). Đây là mốc "biết từ lần đầu", tránh inflate khi review lại nhiều lần.
- [x] ~~**Hoàn thành chặng tự động hay thủ công**~~ → **Quyết định**: **Tự động** — khi `submitReview()` gây ra `wordsLearned >= wordCount`, backend tự gọi `completeStage()` logic luôn (unlock stage tiếp, award XP). Frontend chỉ cần refresh path data sau review.
- [x] ~~**Từ thuộc nhiều path**~~ → **Quyết định**: Update `wordsLearned` **cho TẤT CẢ** `UserPathStage` đang unlock có chứa từ đó (thuộc về user). Hành vi công bằng nhất — review 1 từ được tính cho tất cả path có từ đó.

---

### 10. Quyết định thiết kế đã chốt

| # | Vấn đề | Quyết định |
|---|--------|-----------|
| 1 | Response format `getQueue()` | Wrap `{ items, pathTitle? }` — update client đồng thời |
| 2 | `wordsLearned` counting | `recallQuality >= 1` VÀ `reviewCount === 0` (lần đầu tiên review từ đó) |
| 3 | Complete stage | Tự động — backend tự trigger khi `wordsLearned >= wordCount` |
| 4 | Từ thuộc nhiều path | Update tất cả `UserPathStage` đang unlock của user có chứa từ đó |

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Cho phép user review từ vựng theo lộ trình học cụ thể bằng cách fix route "Học tiếp →", lọc queue theo `userPathId`, và cập nhật tiến độ `wordsLearned` sau mỗi lần review — sửa bug cốt lõi khiến tiến độ lộ trình luôn = 0%.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: `GET /review/queue?userPathId=<id>` trả về `{ items, pathTitle }` chỉ gồm từ của path đó (stage đang unlock)
2. FR-02: `POST /review/submit` cập nhật `UserPathStage.wordsLearned++` khi `recallQuality >= 1` VÀ `reviewCount === 0`
3. FR-03: Khi `wordsLearned >= wordCount`, backend tự động complete stage và unlock stage tiếp theo
4. FR-04: Route `/review/path/:userPathId` tồn tại trong React Router
5. FR-05: Nút "Học tiếp →" navigate đến `/review/path/<userPathId>` đúng lộ trình
6. FR-06: `ReviewPage` hiển thị tên lộ trình khi đang review path cụ thể

#### Ràng buộc phi chức năng
1. NFR-01: Không cần migration DB — `wordsLearned Int @default(0)` đã có trong schema
2. NFR-02: `getQueue()` response luôn wrap `{ items, pathTitle? }` — frontend cập nhật đồng thời
3. NFR-03: `wordsLearned` chỉ tăng 1 lần/từ/chặng (guard bằng `reviewCount === 0`)
4. NFR-04: Cập nhật `wordsLearned` cho TẤT CẢ `UserPathStage` đang unlock có chứa từ đó (thuộc user)

#### Phụ thuộc
- DEP-01: T-01 (DTO) phải hoàn thành trước T-03 (Service getQueue)
- DEP-02: T-03 (Service getQueue return type) phải hoàn thành trước T-08 (client.ts)
- DEP-03: T-08 (client.ts) phải hoàn thành trước T-09/T-10/T-11/T-12/T-14 (ReviewPage, DashboardPage)
- DEP-04: T-05 (App.tsx route) phải hoàn thành trước T-09 (ReviewPage useParams)
- DEP-05: T-13 (StageRow prop) phải hoàn thành trước T-15 (PathCard truyền prop)

### Cách tiếp cận
> Backend-first: sửa DTO → service getQueue (wrap response + filter) → service submitReview (wordsLearned + auto-complete). Frontend sau: client.ts type → App.tsx route → ReviewPage (useParams + pathTitle + empty state) → DashboardPage (fix response.items) → PathCard → StageRow.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/backend/src/modules/review/dto/review.dto.ts` | Thêm `userPathId?` vào `ReviewQueueQueryDto` |
| Sửa đổi | `apps/backend/src/modules/review/review.service.ts` | Wrap getQueue response + filter userPathId + updateWordsLearned + _autoCompleteStage |
| Sửa đổi | `apps/frontend/src/api/client.ts` | Thêm `userPathId?` param + wrap response type `{ items, pathTitle? }` |
| Sửa đổi | `apps/frontend/src/App.tsx` | Thêm route `review/path/:userPathId` |
| Sửa đổi | `apps/frontend/src/pages/ReviewPage.tsx` | useParams userPathId + pathTitle state + loadQueue + redirect + empty state + done |
| Sửa đổi | `apps/frontend/src/pages/DashboardPage.tsx` | Dùng `response.items` thay vì `response` trực tiếp |
| Sửa đổi | `apps/frontend/src/components/roadmap/StageRow.tsx` | Thêm prop `userPathId?` + fix navigate |
| Sửa đổi | `apps/frontend/src/components/roadmap/PathCard.tsx` | Truyền `userPathId={path.id}` xuống StageRow |

---

## PLAN TODO

### Phase 1: Backend — DTO & Service Logic

#### REQ-01 + REQ-03: Filter queue theo `userPathId` và trả về `pathTitle`

- [x] **TODO-1.1.1**: Thêm field `userPathId?` vào `ReviewQueueQueryDto`
  - **File**: `apps/backend/src/modules/review/dto/review.dto.ts`
  - **Context**: Đọc `review.dto.ts` (toàn file, 77 dòng) để xem cấu trúc hiện có
  - **Thay đổi**:
    - Sau field `limit?`, thêm:
      ```ts
      @ApiPropertyOptional({ description: 'Filter by UserPath ID — returns only words from that path' })
      @IsOptional()
      @IsString()
      userPathId?: string;
      ```
  - **Verify**: `cd apps/backend && nvm use v23 && npm run build` — exit 0
  - **Kết quả**: DTO chấp nhận `?userPathId=<id>` trên query string

- [x] **TODO-1.1.2**: Cập nhật `getQueue()` trong `ReviewService` — filter theo `userPathId`
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: Đọc `review.service.ts` lines 1-70 (getQueue hiện tại); đọc `schema.prisma` models `UserPath`, `UserPathStage`, `PathStageVocab` để hiểu relations
  - **Thay đổi**:
    - Sau block `if (query.sourceType)`, thêm block filter userPathId:
      ```ts
      let pathTitle: string | undefined;

      if (query.userPathId) {
        const userPath = await this.prisma.userPath.findFirst({
          where: { id: query.userPathId, userId },
          include: {
            pathTemplate: { select: { title: true } },
            userStages: {
              where: { isUnlocked: true, isCompleted: false },
              include: {
                pathStage: {
                  include: { stageVocabs: { select: { vocabularyBaseId: true } } },
                },
              },
            },
          },
        });
        if (userPath) {
          pathTitle = userPath.pathTemplate.title;
          const vocabIds = userPath.userStages.flatMap((us) =>
            us.pathStage.stageVocabs.map((sv) => sv.vocabularyBaseId),
          );
          where['vocabularyBaseId'] = { in: vocabIds };
        }
      }
      ```
    - Đổi return statement cuối thành:
      ```ts
      const items = await this.prisma.userVocabulary.findMany({
        where,
        take: query.limit ?? 20,
        orderBy: [{ isLeech: 'desc' }, { nextReview: 'asc' }],
        include: {
          vocabularyBase: {
            include: {
              language: true,
              translations: { include: { targetLanguage: true } },
            },
          },
        },
      });

      return { items, pathTitle };
      ```
  - **Verify**: `cd apps/backend && nvm use v23 && npm run build` — exit 0
  - **Kết quả**: `GET /review/queue` trả về `{ items: [...], pathTitle?: string }` thay vì array thuần

---

#### REQ-02: Cập nhật `wordsLearned` sau review + auto-complete stage

- [x] **TODO-1.2.1**: Thêm private method `_updateWordsLearned()` vào `ReviewService`
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: Đọc `schema.prisma` models `PathStageVocab`, `UserPathStage`, `UserPath` để hiểu relations; đọc `review.service.ts` để thấy vị trí append
  - **Thay đổi**: Append method sau `updateStreakAndXp()`:
    ```ts
    private async _updateWordsLearned(userId: string, vocabularyBaseId: string): Promise<void> {
      // Find all PathStageVocab entries for this word
      const psvList = await this.prisma.pathStageVocab.findMany({
        where: { vocabularyBaseId },
        include: { pathStage: { select: { wordCount: true } } },
      });

      for (const psv of psvList) {
        // Find unlocked, incomplete UserPathStage belonging to this user
        const ups = await this.prisma.userPathStage.findFirst({
          where: {
            pathStageId: psv.pathStageId,
            isUnlocked: true,
            isCompleted: false,
            userPath: { userId },
          },
        });

        if (!ups || ups.wordsLearned >= psv.pathStage.wordCount) continue;

        const newWordsLearned = ups.wordsLearned + 1;
        await this.prisma.userPathStage.update({
          where: { id: ups.id },
          data: { wordsLearned: newWordsLearned },
        });

        // Auto-complete stage when threshold reached
        if (newWordsLearned >= psv.pathStage.wordCount) {
          await this._autoCompleteStage(userId, ups.id);
        }
      }
    }
    ```
  - **Verify**: `cd apps/backend && nvm use v23 && npm run build` — exit 0
  - **Kết quả**: Method tồn tại trong service, logic update wordsLearned chính xác

- [x] **TODO-1.2.2**: Thêm private method `_autoCompleteStage()` vào `ReviewService`
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: Đọc `paths.service.ts` `completeStage()` (lines 197-262) để tham khảo logic unlock; đọc `schema.prisma` models `UserPathStage`, `PathStage`, `UserPath`
  - **Thay đổi**: Append method sau `_updateWordsLearned()`:
    ```ts
    private async _autoCompleteStage(userId: string, userPathStageId: string): Promise<void> {
      const ups = await this.prisma.userPathStage.findUnique({
        where: { id: userPathStageId },
        include: {
          userPath: true,
          pathStage: { select: { order: true, xpReward: true, pathTemplateId: true } },
        },
      });
      if (!ups || ups.isCompleted) return;

      const completedAt = new Date();
      await this.prisma.userPathStage.update({
        where: { id: userPathStageId },
        data: { isCompleted: true, completedAt },
      });

      // Find and unlock next stage
      const nextPathStage = await this.prisma.pathStage.findFirst({
        where: {
          pathTemplateId: ups.pathStage.pathTemplateId,
          order: ups.pathStage.order + 1,
        },
        include: { stageVocabs: true },
      });

      if (nextPathStage) {
        await this.prisma.userPathStage.update({
          where: { userPathId_pathStageId: { userPathId: ups.userPathId, pathStageId: nextPathStage.id } },
          data: { isUnlocked: true, unlockedAt: new Date() },
        });
        if (nextPathStage.stageVocabs.length > 0) {
          await this.prisma.userVocabulary.createMany({
            data: nextPathStage.stageVocabs.map((sv) => ({
              userId,
              vocabularyBaseId: sv.vocabularyBaseId,
              sourceType: 'path',
            })),
            skipDuplicates: true,
          });
        }
        await this.prisma.userPath.update({
          where: { id: ups.userPathId },
          data: { currentStageOrder: nextPathStage.order },
        });
      } else {
        // Path fully completed
        await this.prisma.userPath.update({
          where: { id: ups.userPathId },
          data: { completedAt },
        });
      }

      // Award XP
      await this.prisma.userStreak.upsert({
        where: { userId },
        create: { userId, totalXp: ups.pathStage.xpReward },
        update: { totalXp: { increment: ups.pathStage.xpReward } },
      });
    }
    ```
  - **Verify**: `cd apps/backend && nvm use v23 && npm run build` — exit 0
  - **Kết quả**: Method tự động complete stage, unlock stage tiếp, award XP

- [x] **TODO-1.2.3**: Gọi `_updateWordsLearned()` từ `submitReview()` sau khi ACRE update
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: Đọc `submitReview()` (lines 72-136) — cần tìm điểm chèn sau `userVocabulary.update`, trước `updateStreakAndXp`; lưu ý `uv.reviewCount` là giá trị TRƯỚC khi increment
  - **Thay đổi**: Sau block `await this.prisma.reviewHistory.create(...)`, thêm:
    ```ts
    // Update wordsLearned for path stages containing this word (first review only)
    if (uv.reviewCount === 0 && dto.recallQuality >= 1) {
      await this._updateWordsLearned(userId, uv.vocabularyBaseId);
    }
    ```
  - **Verify**: `cd apps/backend && nvm use v23 && npm run build` — exit 0
  - **Kết quả**: Mỗi lần submit review đầu tiên với recall >= 1, `wordsLearned` tăng cho các path chứa từ đó

---

### Phase 2: Frontend

#### REQ-04: Route `/review/path/:userPathId`

- [x] **TODO-2.1.1**: Thêm route `review/path/:userPathId` vào React Router
  - **File**: `apps/frontend/src/App.tsx`
  - **Context**: Đọc `App.tsx` (toàn file, 45 dòng) để xem cấu trúc routes hiện tại
  - **Thay đổi**: Trong block `<Route element={<RequireAuth />}>`, thêm route MỚI **trước** `review/:filter`:
    ```tsx
    <Route path="review/path/:userPathId" element={<ReviewPage />} />
    ```
    Kết quả sau khi thêm (thứ tự quan trọng — specific trước generic):
    ```tsx
    <Route path="review" element={<ReviewPage />} />
    <Route path="review/path/:userPathId" element={<ReviewPage />} />
    <Route path="review/:filter" element={<ReviewPage />} />
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: Route `/review/path/abc-123` match đúng, không bị `review/:filter` bắt nhầm

---

#### REQ-05: "Học tiếp →" navigate đúng path

- [x] **TODO-2.2.1**: Thêm prop `userPathId?` vào interface `Props` của `StageRow`
  - **File**: `apps/frontend/src/components/roadmap/StageRow.tsx`
  - **Context**: Đọc `StageRow.tsx` lines 1-32 để xem interface `Props` hiện tại
  - **Thay đổi**: Sửa interface `Props`:
    ```ts
    interface Props {
      stage: PathStageDto;
      isLast: boolean;
      onComplete: () => void;
      userPathId?: string;  // THÊM
    }
    ```
    Sửa destructure:
    ```ts
    export default function StageRow({ stage, isLast, onComplete, userPathId }: Props) {
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: Component chấp nhận prop `userPathId` mà không TypeScript error

- [x] **TODO-2.2.2**: Fix "Học tiếp →" button navigate đúng route
  - **File**: `apps/frontend/src/components/roadmap/StageRow.tsx`
  - **Context**: Đọc `StageRow.tsx` lines 120-140 để thấy button "Học tiếp →" hiện tại dùng `navigate('/review')`
  - **Thay đổi**: Sửa `onClick` của button "Học tiếp →":
    ```tsx
    onClick={() => navigate(userPathId ? `/review/path/${userPathId}` : '/review/path')}
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: User bấm "Học tiếp →" → navigate đến `/review/path/<userPathId>` đúng lộ trình

- [x] **TODO-2.2.3**: Truyền `userPathId={path.id}` từ `PathCard` xuống `StageRow`
  - **File**: `apps/frontend/src/components/roadmap/PathCard.tsx`
  - **Context**: Đọc `PathCard.tsx` để tìm chỗ render `<StageRow>` — prop `path.id` (UserPath.id) đã có sẵn
  - **Thay đổi**: Trong `path.stages.map(...)`, thêm prop vào `<StageRow>`:
    ```tsx
    <StageRow
      key={stage.id}
      stage={stage}
      isLast={i === path.stages.length - 1}
      onComplete={() => onStageComplete(stage.id)}
      userPathId={path.id}
    />
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: `StageRow` nhận đúng `userPathId` từ `path.id` (UserPath.id)

---

#### REQ-06: ReviewPage — title lộ trình + state + empty state

- [x] **TODO-2.3.1**: Cập nhật `reviewApi.getQueue()` trong `client.ts` — thêm `userPathId?` và wrap response type
  - **File**: `apps/frontend/src/api/client.ts`
  - **Context**: Đọc `client.ts` lines 91-107 để xem `reviewApi` hiện tại; `reviewApi.getQueue` hiện trả về `any` (`.then(r => r.data)`)
  - **Thay đổi**: Sửa `reviewApi`:
    ```ts
    export interface ReviewQueueResponse {
      items: unknown[];
      pathTitle?: string;
    }

    export const reviewApi = {
      getQueue: (params?: {
        languageCode?: string;
        sourceType?: string;
        cefrLevel?: string;
        limit?: number;
        userPathId?: string;
      }): Promise<ReviewQueueResponse> =>
        apiClient.get('/review/queue', { params }).then((r) => r.data),
      submit: (data: {
        userVocabularyId: string;
        reviewMode: string;
        recallQuality: number;
        responseTimeMs: number;
        confidenceLevel: number;
      }) => apiClient.post('/review/submit', data).then((r) => r.data),
    };
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — xem lỗi TypeScript từ callers, sẽ fix ở các TODO tiếp
  - **Kết quả**: `reviewApi.getQueue()` có kiểu trả về `Promise<ReviewQueueResponse>` với `items` và `pathTitle?`

- [x] **TODO-2.3.2**: Cập nhật `ReviewPage` — mở rộng `useParams` và `getQueryParams/getTitle`
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: Đọc `ReviewPage.tsx` lines 1-50 để xem `useParams`, `getQueryParams`, `getTitle` hiện tại
  - **Thay đổi**:
    - Sửa `useParams`: `const { filter, userPathId } = useParams<{ filter?: string; userPathId?: string }>()`
    - Sửa `getQueryParams` thêm param `userPathId`:
      ```ts
      function getQueryParams(filter?: string, userPathId?: string): { sourceType?: string; cefrLevel?: string; limit: number; userPathId?: string } {
        if (userPathId) return { userPathId, limit: 20 };
        if (!filter || filter === 'all') return { limit: 20 };
        if (filter === 'quicknotes') return { sourceType: 'quicknote', limit: 20 };
        if (filter === 'path') return { sourceType: 'path', limit: 20 };
        if (CEFR_LEVELS.includes(filter)) return { cefrLevel: filter.toUpperCase(), limit: 20 };
        return { limit: 20 };
      }
      ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit`
  - **Kết quả**: `userPathId` từ route `/review/path/:userPathId` được đọc đúng

- [x] **TODO-2.3.3**: Thêm `pathTitle` state và cập nhật `loadQueue()` trong `ReviewPage`
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: Đọc `ReviewPage.tsx` lines 50-100 để xem state declarations và `loadQueue`
  - **Thay đổi**:
    - Thêm state: `const [pathTitle, setPathTitle] = useState<string | undefined>()`
    - Sửa `loadQueue()`:
      ```ts
      const loadQueue = useCallback(async () => {
        if (filter === undefined && userPathId === undefined) return;
        setPhase('loading');
        try {
          const params = getQueryParams(filter, userPathId);
          const response = await reviewApi.getQueue(params);
          const q = response.items as QueueItem[];
          setQueue(q);
          setPathTitle(response.pathTitle);
          setPhase(q.length > 0 ? 'card' : 'idle');
          setCurrent(0);
          setShowAnswer(false);
          setStartTime(Date.now());
        } catch {
          setPhase('idle');
        }
      }, [filter, userPathId]);
      ```
    - Sửa `title` computation: `const title = pathTitle ? \`🗺️ ${pathTitle}\` : getTitle(filter)`
    - Sửa `useEffect loadQueue`: `[loadQueue, userPathId]` dep nếu cần
  - **Verify**: `cd apps/frontend && npx tsc --noEmit`
  - **Kết quả**: `ReviewPage` fetch đúng queue theo `userPathId`; `pathTitle` state được set từ response

- [x] **TODO-2.3.4**: Cập nhật auto-redirect effect trong `ReviewPage` dùng `response.items`
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: Đọc `ReviewPage.tsx` lines 60-82 — effect hiện tại dùng `q` trực tiếp như `QueueItem[]`
  - **Thay đổi**: Sửa effect auto-redirect:
    ```ts
    useEffect(() => {
      if (filter !== undefined || userPathId !== undefined) return;

      setPhase('redirecting');
      reviewApi
        .getQueue({ limit: 100 })
        .then((response) => {
          const q = response.items as QueueItem[];
          const quicknoteCount = q.filter((i) => i.sourceType === 'quicknote').length;
          const pathCount = q.filter((i) => i.sourceType === 'path').length;

          if (quicknoteCount > 0) {
            navigate('/review/quicknotes', { replace: true });
          } else if (pathCount > 0) {
            navigate('/review/path', { replace: true });
          } else {
            navigate('/review/all', { replace: true });
          }
        })
        .catch(() => navigate('/review/all', { replace: true }));
    }, [filter, userPathId, navigate]);
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: Auto-redirect vẫn hoạt động đúng với response type mới

- [x] **TODO-2.3.5**: Thêm path-specific empty state vào `ReviewPage` (`idle` phase)
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: Đọc `ReviewPage.tsx` lines 160-200 để tìm block render khi `phase === 'idle'`
  - **Thay đổi**: Trong block `phase === 'idle'`, thêm nhánh khi có `userPathId`:
    ```tsx
    if (userPathId) {
      return (
        <AppShell title={title}>
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center gap-4">
            <p className="text-4xl">🎉</p>
            <p className="text-[#F1F5F9] font-semibold text-lg">Xong rồi!</p>
            <p className="text-[#94A3B8] text-sm">
              Bạn đã ôn hết từ vựng trong lộ trình này hôm nay.
              <br />Quay lại sau khi từ mới được mở khoá.
            </p>
            <button
              onClick={() => navigate('/roadmap')}
              className="mt-2 rounded-xl px-5 py-2.5 text-sm font-medium text-white"
              style={{ background: 'linear-gradient(135deg, #6366F1, #8B5CF6)' }}
            >
              ← Về lộ trình
            </button>
          </div>
        </AppShell>
      );
    }
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: Khi không có từ due trong path, user thấy empty state riêng với nút "← Về lộ trình"

- [x] **TODO-2.3.6**: Thêm nút "← Về lộ trình" vào done screen của `ReviewPage`
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: Đọc `ReviewPage.tsx` lines 200-236 để tìm block render khi `phase === 'done'` (màn hình kết thúc session)
  - **Thay đổi**: Trong block `phase === 'done'`, thêm nút sau nút "Review again":
    ```tsx
    {userPathId && (
      <button
        onClick={() => navigate('/roadmap')}
        className="w-full rounded-xl px-4 py-3 text-sm font-medium text-[#94A3B8]"
        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
      >
        ← Về lộ trình
      </button>
    )}
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: Sau khi hoàn thành session review path, user có thể về lộ trình ngay

- [x] **TODO-2.3.7**: Cập nhật `DashboardPage` dùng `response.items`
  - **File**: `apps/frontend/src/pages/DashboardPage.tsx`
  - **Context**: Đọc `DashboardPage.tsx` lines 28-42 để xem các `reviewApi.getQueue()` call và cách dùng kết quả
  - **Thay đổi**: Sửa 2 caller của `reviewApi.getQueue()`:
    ```ts
    // Call 1: dueItems (limit: 5)
    if (q.status === 'fulfilled') setDueItems((q.value as ReviewQueueResponse).items as QueueItem[]);

    // Call 2: quickNoteCount
    if (qn.status === 'fulfilled') setQuickNoteCount(((qn.value as ReviewQueueResponse).items as QueueItem[]).length);
    ```
    Thêm import type từ client.ts: `import { ..., ReviewQueueResponse } from '@/api/client'`
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: DashboardPage không crash, `dueItems` và `quickNoteCount` hiển thị đúng

---

### Phase 3: Integration & Verification

- [x] **TODO-3.1**: Build backend — verify không có lỗi TypeScript mới
  - **Thay đổi**: Chạy từ `apps/backend/`: `nvm use v23 && npm run build`
  - **Verify**: Exit 0, không có error liên quan đến các file đã sửa
  - **Kết quả**: Backend artifact được tạo thành công

- [x] **TODO-3.2**: TypeScript check frontend — verify toàn bộ types nhất quán
  - **Thay đổi**: Chạy từ `apps/frontend/`: `npx tsc --noEmit`
  - **Verify**: Exit 0, không còn lỗi type về `reviewApi.getQueue()` response
  - **Kết quả**: Frontend type-safe hoàn toàn

---

## Ghi chú triển khai
- `review.service.ts` nhận nhiều thay đổi (TODO-1.1.2, 1.2.1, 1.2.2, 1.2.3) — implement theo thứ tự để tránh conflict
- `ReviewPage.tsx` cũng nhận nhiều thay đổi (TODO-2.3.2 → 2.3.6) — implement theo thứ tự
- `ReviewQueueResponse.items` dùng `unknown[]` để không tạo circular type dep giữa `client.ts` và các page — các component cast về `QueueItem[]` theo local interface
- Nút "✅ Hoàn thành chặng" trong `StageRow` vẫn giữ nguyên như backup thủ công — sau khi backend auto-complete, `stage.isCompleted` sẽ = true khi fetch lại và nút tự ẩn

## Rủi ro cần theo dõi
- [ ] Risk-1: `userPath.userStages` chỉ include `isUnlocked=true, isCompleted=false` trong T-03 — nếu TẤT CẢ stages đã completed thì `vocabIds` = [] → queue rỗng → empty state cho path. Expected behavior, đã xử lý ở T-05.
- [ ] Risk-2: `PathStage.xpReward` field cần tồn tại trong schema — verify trước khi implement `_autoCompleteStage`; nếu không có thì dùng default value (e.g., 50)
- [ ] Risk-3: `userPathId_pathStageId` unique constraint tên — verify trong `schema.prisma` trước khi dùng trong `_autoCompleteStage` (TODO-1.2.2)

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Sửa bug cốt lõi khiến `wordsLearned` luôn = 0%, cho phép review theo lộ trình cụ thể qua route `/review/path/:userPathId`, và tự động unlock stage tiếp khi học đủ từ.

### Thống kê
- **Tổng TODO**: 17
- **Hoàn thành**: 17 ✅
- **Blocked**: 0

### TODO Status

| TODO | Tiêu đề | Status |
|------|---------|--------|
| TODO-1.1.1 | Thêm `userPathId?` vào DTO | ✅ Done |
| TODO-1.1.2 | `getQueue()` filter + wrap `{ items, pathTitle }` | ✅ Done |
| TODO-1.2.1 | `_updateWordsLearned()` private method | ✅ Done |
| TODO-1.2.2 | `_autoCompleteStage()` private method | ✅ Done |
| TODO-1.2.3 | Gọi `_updateWordsLearned()` từ `submitReview()` | ✅ Done |
| TODO-2.1.1 | Route `review/path/:userPathId` trong App.tsx | ✅ Done |
| TODO-2.2.1 | StageRow prop `userPathId?` | ✅ Done |
| TODO-2.2.2 | StageRow fix "Học tiếp →" navigate | ✅ Done |
| TODO-2.2.3 | PathCard truyền `userPathId={path.id}` | ✅ Done |
| TODO-2.3.1 | `client.ts` — `ReviewQueueResponse` type | ✅ Done |
| TODO-2.3.2 | ReviewPage `useParams` + `getQueryParams` | ✅ Done |
| TODO-2.3.3 | ReviewPage `pathTitle` state + `loadQueue` | ✅ Done |
| TODO-2.3.4 | ReviewPage redirect effect dùng `response.items` | ✅ Done |
| TODO-2.3.5 | ReviewPage path-specific empty state | ✅ Done |
| TODO-2.3.6 | ReviewPage done screen nút "← Về lộ trình" | ✅ Done |
| TODO-2.3.7 | DashboardPage dùng `response.items` | ✅ Done |
| TODO-3.1/3.2 | Build backend + frontend TypeScript check | ✅ Done |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/backend/src/modules/review/dto/review.dto.ts` | Modified | Thêm `userPathId?: string` vào `ReviewQueueQueryDto` |
| `apps/backend/src/modules/review/review.service.ts` | Modified | `getQueue()` wrap response + filter; `submitReview()` gọi `_updateWordsLearned`; thêm 2 private methods |
| `apps/frontend/src/api/client.ts` | Modified | Export `ReviewQueueResponse` interface; `getQueue()` typed + `userPathId?` param |
| `apps/frontend/src/App.tsx` | Modified | Route `review/path/:userPathId` thêm trước `review/:filter` |
| `apps/frontend/src/pages/ReviewPage.tsx` | Modified | `useParams` mở rộng + `pathTitle` state + `loadQueue` + redirect effect + idle/done screens |
| `apps/frontend/src/pages/DashboardPage.tsx` | Modified | Import `ReviewQueueResponse`; dùng `response.items` thay vì `response` trực tiếp |
| `apps/frontend/src/components/roadmap/StageRow.tsx` | Modified | Prop `userPathId?` + fix "Học tiếp →" navigate đúng route |
| `apps/frontend/src/components/roadmap/PathCard.tsx` | Modified | Truyền `userPathId={path.id}` xuống `StageRow` |

### Verification
- Build backend thành công: ✅ (`nest build` exit 0)
- TypeScript check frontend: ✅ (`tsc --noEmit` exit 0)
- Không có warning mới: ✅

### Ghi chú
- `ReviewQueueResponse.items` dùng `unknown[]` để tránh circular type dep — các component tự cast về `QueueItem[]` theo local interface riêng
- Nút "✅ Hoàn thành chặng" trong `StageRow` giữ nguyên như fallback thủ công — sau khi backend auto-complete, `isCompleted = true` và nút tự ẩn khi fetch lại
- `_autoCompleteStage` không được gọi từ `PathsService.completeStage()` (tránh duplicate logic) — chỉ được trigger từ review flow

### Thứ tự thực hiện

```
Backend trước:
  T-01 (dto) → T-02 (module) → T-03 (service getQueue) → T-04 (service submitReview)

Frontend sau:
  T-05 (client.ts) → T-06 (App.tsx) → T-07…T-11 (ReviewPage) → T-12 (DashboardPage) → T-13 (PathCard) → T-14…T-17 (StageRow)
```

### TODO chi tiết

#### Backend

- [ ] **T-01** — `apps/backend/src/modules/review/dto/review.dto.ts`
  - Thêm field `userPathId?: string` vào `ReviewQueueQueryDto` với decorator `@IsOptional() @IsString()` và Swagger `@ApiPropertyOptional`

- [ ] **T-02** — `apps/backend/src/modules/review/review.module.ts`
  - Không cần thay đổi module (ReviewService dùng PrismaService trực tiếp — không inject PathsService để tránh circular dep)

- [ ] **T-03** — `apps/backend/src/modules/review/review.service.ts` — `getQueue()`
  - Thêm logic khi `query.userPathId` có giá trị:
    1. Tìm `UserPath` theo `id = userPathId AND userId` → lấy `pathTemplate.title` làm `pathTitle`
    2. Lấy tất cả `vocabularyBaseId` thuộc các stage đang unlock:
       ```
       UserPathStage (userPathId, isUnlocked=true, isCompleted=false)
         → PathStage.id
         → PathStageVocab.vocabularyBaseId → collect as vocabIds[]
       ```
    3. Thêm `where.vocabularyBaseId = { in: vocabIds }` vào query
  - Đổi return type từ `UserVocabulary[]` sang `{ items: UserVocabulary[], pathTitle?: string }`:
    - Luôn wrap — khi không có `userPathId` thì `pathTitle` là `undefined`
    - Cập nhật `ReviewController` handler tương ứng

- [ ] **T-04** — `apps/backend/src/modules/review/review.service.ts` — `submitReview()`
  - **Bước A — Cập nhật `wordsLearned`**: Sau khi update ACRE, nếu `uv.reviewCount === 0` (trước khi increment) VÀ `dto.recallQuality >= 1`:
    1. `const psvList = await prisma.pathStageVocab.findMany({ where: { vocabularyBaseId: uv.vocabularyBaseId }, include: { pathStage: true } })`
    2. Với mỗi `psv`:
       - Tìm `UserPathStage` WHERE `pathStageId = psv.pathStageId AND isUnlocked = true AND isCompleted = false AND userPath.userId = userId`
       - Nếu tìm thấy và `ups.wordsLearned < psv.pathStage.wordCount`:
         - `newWordsLearned = ups.wordsLearned + 1`
         - Update `ups.wordsLearned = newWordsLearned`
         - Nếu `newWordsLearned >= psv.pathStage.wordCount` → gọi `this._autoCompleteStage(userId, ups)`
  - **Bước B — `_autoCompleteStage(userId, userPathStage)`** (private method inline):
    1. Mark `userPathStage.isCompleted = true, completedAt = now`
    2. Find `nextPathStage` WHERE `pathTemplateId = ups.userPath.pathTemplateId AND order = pathStage.order + 1` (include `stageVocabs`)
    3. Nếu có `nextPathStage`:
       - Unlock `UserPathStage` của nextPathStage
       - `UserVocabulary.createMany` next stage vocab với `sourceType: 'path'` + `skipDuplicates: true`
       - Update `UserPath.currentStageOrder = nextPathStage.order`
    4. Nếu không có `nextPathStage`: Update `UserPath.completedAt = now`
    5. Upsert `UserStreak.totalXp += pathStage.xpReward`

#### Frontend

- [ ] **T-05** — `apps/frontend/src/api/client.ts`
  - Thêm `userPathId?: string` vào params của `reviewApi.getQueue()`
  - Thêm interface `ReviewQueueResponse = { items: QueueItem[], pathTitle?: string }` (hoặc inline)
  - `getQueue()` return type: `Promise<ReviewQueueResponse>` thay vì `Promise<QueueItem[]>`

- [ ] **T-06** — `apps/frontend/src/App.tsx`
  - Thêm route: `<Route path="review/path/:userPathId" element={<ReviewPage />} />` — đặt trước `review/:filter` để tránh bị match nhầm

- [ ] **T-07** — `apps/frontend/src/pages/ReviewPage.tsx` — extend `useParams`
  - `const { filter, userPathId } = useParams<{ filter?: string; userPathId?: string }>()`
  - Cập nhật `getQueryParams()` nhận thêm `userPathId?: string`:
    ```ts
    function getQueryParams(filter?: string, userPathId?: string) {
      if (userPathId) return { userPathId, limit: 20 };
      // ...existing logic...
    }
    ```
  - Cập nhật `getTitle()` nhận thêm `pathTitle?: string` — nếu có `pathTitle` trả về `🗺️ ${pathTitle}`

- [ ] **T-08** — `apps/frontend/src/pages/ReviewPage.tsx` — `pathTitle` state
  - Thêm `const [pathTitle, setPathTitle] = useState<string | undefined>()`
  - Trong `loadQueue()`: `const response = await reviewApi.getQueue(params); setQueue(response.items); setPathTitle(response.pathTitle)`
  - Update AppShell: `title={pathTitle ? \`🗺️ ${pathTitle}\` : getTitle(filter)}`

- [ ] **T-09** — `apps/frontend/src/pages/ReviewPage.tsx` — cập nhật redirect effect
  - Effect auto-redirect: `const response = await reviewApi.getQueue({ limit: 100 })` → `const q = response.items`
  - Giữ nguyên logic filter `quicknoteCount`, `pathCount` nhưng dùng `q` từ `response.items`

- [ ] **T-10** — `apps/frontend/src/pages/ReviewPage.tsx` — path-specific empty state (`idle`)
  - Khi `userPathId` có giá trị và queue rỗng:
    ```tsx
    <p>Bạn đã ôn hết từ vựng trong lộ trình này hôm nay! 🎉</p>
    <p>Quay lại sau khi từ mới được mở khoá.</p>
    <button onClick={() => navigate('/roadmap')}>← Về lộ trình</button>
    ```
  - Existing empty state giữ nguyên cho các filter khác

- [ ] **T-11** — `apps/frontend/src/pages/ReviewPage.tsx` — done screen thêm nút về lộ trình
  - Khi `userPathId` có giá trị và `phase === 'done'`: thêm nút `<button onClick={() => navigate('/roadmap')}>← Về lộ trình</button>`

- [ ] **T-12** — `apps/frontend/src/pages/DashboardPage.tsx`
  - Cập nhật call `reviewApi.getQueue({ sourceType: 'quicknote', limit: 20 })`:
    - `const response = await reviewApi.getQueue(...)` → `setQuickNoteCount(response.items.length)`
  - Cập nhật tương tự nếu có call `getQueue()` khác trong file

- [ ] **T-13** — `apps/frontend/src/components/roadmap/PathCard.tsx`
  - Truyền `userPathId={path.id}` xuống mỗi `<StageRow>`:
    ```tsx
    <StageRow
      key={stage.id}
      stage={stage}
      isLast={i === path.stages.length - 1}
      onComplete={() => onStageComplete(stage.id)}
      userPathId={path.id}   {/* THÊM */}
    />
    ```

- [ ] **T-14** — `apps/frontend/src/components/roadmap/StageRow.tsx` — thêm prop
  - Thêm `userPathId?: string` vào interface props của `StageRow`

- [ ] **T-15** — `apps/frontend/src/components/roadmap/StageRow.tsx` — fix navigate
  - Đổi `onClick={() => navigate('/review')}` → `onClick={() => navigate(userPathId ? \`/review/path/${userPathId}\` : '/review/path')}`

- [ ] **T-16** — `apps/frontend/src/components/roadmap/StageRow.tsx` — cập nhật `canComplete`
  - Giữ nguyên `canComplete = stage.isUnlocked && !stage.isCompleted && stage.wordsLearned >= stage.wordCount * 0.8`
  - Nút "✅ Hoàn thành chặng" vẫn giữ như backup — khi backend auto-complete, stage sẽ refresh thành `isCompleted = true` và nút này ẩn đi tự nhiên
  - Cập nhật text hiển thị tiến độ: `${stage.wordsLearned}/${stage.wordCount} từ đã học`

- [ ] **T-17** — Build validation
  - `cd apps/backend && nvm use v23 && npm run build` — exit 0
  - `cd apps/frontend && npx tsc --noEmit` — exit 0

### Sơ đồ luồng dữ liệu sau khi implement

```
User bấm "Học tiếp →" trên StageRow
  → navigate('/review/path/<userPathId>')
  → ReviewPage nhận userPathId từ useParams
  → reviewApi.getQueue({ userPathId, limit: 20 })
  → GET /review/queue?userPathId=<id>
  → ReviewService.getQueue(): JOIN filter → { items: [...], pathTitle: "Giao tiếp hằng ngày A1" }
  → ReviewPage hiển thị "🗺️ Giao tiếp hằng ngày A1"
  → User review từng từ
  → reviewApi.submit(...)
  → ReviewService.submitReview():
      - ACRE update
      - wordsLearned++ (nếu reviewCount === 0 và recallQuality >= 1)
      - Nếu wordsLearned >= wordCount → _autoCompleteStage()
          → isCompleted = true, unlock next stage, add next vocab, award XP
  → User về Roadmap → PathCard refetch → stage mới đã unlock ✅
```

