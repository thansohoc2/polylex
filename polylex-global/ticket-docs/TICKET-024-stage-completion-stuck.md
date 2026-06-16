# TICKET-024: Stage không auto-complete khi đã học hết từ

## Mô tả lỗi

Sau khi học hết tất cả các từ trong một stage (review queue trả về `items: []`), stage vẫn hiển thị `isCompleted: false` và `wordsLearned` thấp hơn `wordCount`. Người dùng bị kẹt — không có gì để ôn, không thể hoàn thành stage, không thể tiến lên stage tiếp theo.

### Triệu chứng quan sát

```json
GET /api/v1/review/queue?userPathId=...
→ { "items": [], "currentPathStageId": "44fde8b4-..." }

Stage trong path response:
{
  "wordCount": 10,
  "isUnlocked": true,
  "isCompleted": false,
  "wordsLearned": 4
}
```

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-024 |
| **Tiêu đề** | Stage không auto-complete khi đã học hết từ |
| **Mục tiêu** | Stage tự động hoàn thành (hoặc cho phép thủ công hoàn thành) khi người dùng đã học hết tất cả từ trong stage, dù từ được học qua con đường nào |
| **Phạm vi** | REST API · DB (UserPathStage, UserVocabulary) · Review Queue |
| **Độ ưu tiên** | Khẩn cấp — người dùng bị block hoàn toàn |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Cập nhật `wordsLearned` khi enroll | Khi thêm vocab vào stage, đếm ngay số từ đã biết (`isLearned: true`) và set `wordsLearned` ban đầu | DB · paths.service | Nhỏ |
| REQ-02 | Fix `_updateWordsLearned` — dùng COUNT thực tế | Thay vì chỉ `+1`, lấy count thực từ DB (số vocab của stage đã `isLearned: true`) làm giá trị authoritative | DB · review.service | Nhỏ |
| REQ-03 | Trigger auto-complete khi queue trống | Khi `getQueue` trả `items: []` cho một path stage đang active, kiểm tra và auto-complete nếu tất cả vocab đã learned | REST · review.service | Trung bình |
| REQ-04 | Fix threshold `canComplete` trên frontend | `wordsLearned >= wordCount * 0.8` để hiển thị nút "Complete" — cần đảm bảo button hiện đúng khi `wordsLearned` được fix | Frontend | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02  (REQ-02 là fix bổ sung đảm bảo tính đúng đắn)

REQ-03 (độc lập — safety net cho cases không đi qua submitReview)

REQ-04 (độc lập — chỉ hiệu quả sau khi REQ-01/REQ-02 fix data đúng)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Cập nhật `wordsLearned` khi enroll / unlock stage
- **Mục tiêu**: Khi vocab của một stage được thêm vào `UserVocabulary` (lúc enroll stage 1, hoặc lúc unlock stage kế tiếp), đếm ngay số từ nào đã `isLearned: true` cho user này và set `wordsLearned` ban đầu bằng con số đó.
- **Đầu vào**: Danh sách `vocabularyBaseId` vừa được `createMany`, `userId`, `UserPathStage.id`
- **Đầu ra mong đợi**: `UserPathStage.wordsLearned` phản ánh đúng số từ đã biết từ đầu; nếu `>= wordCount`, stage tự động complete
- **Tiêu chí hoàn thành**: Khi enroll vào path có tất cả 10 từ đã biết, stage 1 ngay lập tức complete và stage 2 unlock
- **Phụ thuộc**: Không

##### REQ-02: Fix `_updateWordsLearned` dùng COUNT thực tế
- **Mục tiêu**: Thay vì `wordsLearned + 1`, truy vấn DB để đếm số vocab của stage đã `isLearned: true` cho user, dùng làm giá trị mới. Bảo vệ khỏi race condition và drift.
- **Đầu vào**: `userId`, `vocabularyBaseId` vừa được học
- **Đầu ra mong đợi**: `wordsLearned` luôn bằng count thực tế từ DB
- **Tiêu chí hoàn thành**: Không có drift giữa `wordsLearned` và số từ thực sự `isLearned`
- **Phụ thuộc**: REQ-01 (cùng file)

##### REQ-03: Trigger auto-complete khi queue trống
- **Mục tiêu**: Khi `getQueue` trả về `items: []` nhưng stage vẫn `isCompleted: false`, gọi `_autoCompleteStage` để giải quyết triệt để các trường hợp drift còn lại
- **Đầu vào**: `currentPathStageId`, `userId`, `items.length === 0`
- **Đầu ra mong đợi**: Stage auto-complete khi queue rỗng; response trả thêm `stageAutoCompleted: true` để frontend biết refresh
- **Tiêu chí hoàn thành**: Người dùng không còn bị kẹt ở stage rỗng bất kể nguyên nhân
- **Phụ thuộc**: Không

##### REQ-04: Đảm bảo nút Complete hiển thị đúng (frontend)
- **Mục tiêu**: Sau khi `wordsLearned` được fix đúng ở backend, frontend `canComplete` threshold `>= wordCount * 0.8` cần hoạt động đúng
- **Đầu vào**: `stage.wordsLearned`, `stage.wordCount` từ API
- **Đầu ra mong đợi**: Nút "Complete Stage" hiện khi đủ điều kiện
- **Tiêu chí hoàn thành**: Nút hiện và ẩn đúng
- **Phụ thuộc**: REQ-01 (backend fix cần đúng trước)

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng học**: User enroll path → Stage 1 vocab thêm vào `UserVocabulary` → User review từng từ → `submitReview` với `recallQuality >= 1` đánh dấu `isLearned: true` → `_updateWordsLearned` tăng `wordsLearned` → khi `wordsLearned >= wordCount`, `_autoCompleteStage` chạy → mở khóa stage tiếp theo.
- **Thực thể**: `UserPath`, `UserPathStage`, `PathStage`, `PathStageVocab`, `UserVocabulary`
- **Quy tắc nghiệp vụ bảo toàn**: Stage chỉ complete khi người dùng đã học đủ từ; stage tiếp theo không được unlock sớm.
- **Hành vi cần bảo toàn**: Auto-complete vẫn hoạt động cho luồng bình thường (không có pre-learned words), không tăng double XP.

---

### 4. Ngữ cảnh kỹ thuật

**Root cause chính xác:**

Trong `_updateWordsLearned()` (`review.service.ts` dòng 223):
```typescript
if (!uv.isLearned && dto.recallQuality >= 1) {
  await this._updateWordsLearned(userId, uv.vocabularyBaseId);
}
```

Hàm này chỉ được gọi khi `!uv.isLearned` — tức là chỉ đếm lần ĐẦU TIÊN từ được học. Nhưng nếu một từ **đã có `isLearned: true` trước khi stage bắt đầu** (user đã biết từ này từ path khác, quicknote, hay manual add), thì:

1. `createMany skipDuplicates: true` giữ nguyên record cũ với `isLearned: true`
2. Queue filter: `{ isLearned: false }` → false → từ không xuất hiện trong queue
3. `_updateWordsLearned` chưa bao giờ được gọi → `wordsLearned` không tăng
4. `wordsLearned < wordCount` mãi → stage không complete

**Ảnh hưởng phụ:**

Trong `_updateWordsLearned`, cập nhật dùng `ups.wordsLearned + 1` (in-memory increment):
```typescript
const newWordsLearned = ups.wordsLearned + 1;
await this.prisma.userPathStage.update({
  where: { id: ups.id },
  data: { wordsLearned: newWordsLearned },
});
```

Nếu hai words được submit review cùng lúc (concurrent), cả hai đọc `ups.wordsLearned = 4`, cả hai update lên 5 → count bị mất 1. Đây là race condition nhỏ (ít khả năng xảy ra trong thực tế nhưng vẫn là bug).

**Files bị ảnh hưởng:**
- `apps/backend/src/modules/review/review.service.ts` — `_updateWordsLearned()`, `getQueue()`
- `apps/backend/src/modules/paths/paths.service.ts` — `enrollUser()`, `completeStage()`, `_autoCompleteStage()`
- `apps/frontend/src/components/roadmap/StageRow.tsx` — `canComplete` logic (thứ yếu)

**Bảng DB liên quan:**
- `user_path_stages` — `words_learned`, `is_completed`
- `user_vocabularies` — `is_learned`
- `path_stage_vocabs` — join giữa stage và vocab

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `wordsLearned` chỉ đếm từ học *trong session hiện tại* qua `submitReview` | `wordsLearned` = số từ stage đã `isLearned: true` của user, bất kể học từ đâu | Thiếu logic đếm pre-learned words |
| `_updateWordsLearned` dùng `+1` in-memory | Dùng COUNT thực từ DB | Race condition tiềm ẩn |
| Không có safety net khi queue rỗng | Auto-complete khi queue rỗng cho one stage | Thiếu trigger |
| Nút Complete ẩn khi `wordsLearned` thấp dù đã học hết | Nút hiện đúng sau khi backend fix | Downstream từ lỗi backend |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Không complete đúng thời điểm**: Nếu check "queue rỗng" không chính xác (ví dụ user có nguồn vocab khác trùng), có thể auto-complete sai stage — Biện pháp: chỉ trigger khi `currentPathStageId` xác định và ALL vocab của stage đó `isLearned: true`
- [ ] **Double XP**: `_autoCompleteStage` tặng XP — nếu REQ-01 gọi nó sớm và sau đó REQ-03 cũng gọi, user được XP đôi — Biện pháp: `_autoCompleteStage` đã có guard `if (!ups || ups.isCompleted) return;`

#### 6.2 Rủi ro kỹ thuật
- [ ] **Race condition trong REQ-02**: Nếu dùng COUNT từ DB, nên dùng transaction hoặc `update ... where wordsLearned < wordCount` để atomic — Biện pháp: wrap trong transaction nhỏ
- [ ] **Migration data hiện tại**: `wordsLearned` của các user đang bị stuck có giá trị sai — Biện pháp: REQ-03 (queue empty trigger) sẽ fix on-the-go mà không cần data migration

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **Stage complete khi user chưa thực sự review**: Nếu user có 10/10 từ đã biết từ trước, stage sẽ complete ngay khi thêm vocab (REQ-01) — đây là behavior ĐÚNG (user đã biết hết, không cần học lại), nhưng cần confirm với product
- [ ] **`_updateWordsLearned` tìm `isCompleted: false`**: Nếu stage đã complete (do REQ-01), mà sau đó user vẫn submit review cho từ trong stage đó, `_updateWordsLearned` sẽ `continue` vì không tìm thấy `isCompleted: false` stage — đây là behavior đúng

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| REQ-01+REQ-02 fix data source of truth | REQ-02 thêm 1 DB query (COUNT) mỗi lần submitReview |
| REQ-03 là safety net không cần thay đổi DB schema | REQ-03 chạy mỗi khi queue rỗng, dù không cần thiết |
| Không cần migration — fix on-the-go | Pre-learned words sẽ skip review UI, có thể gây confusion |
| `_autoCompleteStage` đã có guard chống double-complete/XP | |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Triển khai REQ-01 + REQ-02 + REQ-03 cùng nhau. REQ-01 fix nguồn gốc, REQ-02 làm counter robust, REQ-03 là safety net cho data cũ và edge cases tương lai.
- **Các cách tiếp cận thay thế**:
  - Chỉ làm REQ-03 (safety net) — đơn giản nhất, không fix root cause nhưng unblock user ngay
  - Thay `wordsLearned` counter bằng computed field (COUNT query mỗi lần fetch) — correct but heavier
- **Phụ thuộc**: Không có dependency ngoài
- **Ước tính công sức**: Nhỏ — ~2-3 giờ code + test

---

### 9. Câu hỏi mở

- [ ] **Q1**: Nếu user đã biết hết tất cả từ của một stage, có nên cho phép stage tự complete ngay khi enroll (không cần review)? Hay cần 1 quick review pass? → Ảnh hưởng đến REQ-01
- [ ] **Q2**: Nên return `stageAutoCompleted: boolean` trong response `getQueue` để frontend biết tự refresh stage list không?

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Fix `wordsLearned` không tăng đúng khi từ đã biết trước khi stage bắt đầu, đảm bảo stage auto-complete khi queue rỗng, và đồng bộ `wordsLearned` ngay khi enroll/unlock.

### Cách tiếp cận
Ba lớp sửa: (1) REQ-02 — dùng COUNT thực từ DB thay vì `+1` in-memory, (2) REQ-01 — đồng bộ `wordsLearned` ngay sau mỗi `createMany` vocab, (3) REQ-03 — safety net auto-complete khi queue rỗng.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/backend/src/modules/review/review.service.ts` | Fix `_updateWordsLearned` dùng COUNT; sync next-stage wordsLearned trong `_autoCompleteStage`; safety net trong `getQueue` |
| Sửa đổi | `apps/backend/src/modules/paths/paths.service.ts` | Sync wordsLearned sau `createMany` trong `enrollUser` và `completeStage` |

---

## PLAN TODO

### Phase 1: Fix counter dùng COUNT thực (REQ-02)

- [x] **TODO-1.2.1**: Sửa `_updateWordsLearned` — dùng COUNT từ DB thay vì `+1`
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: Đọc `_updateWordsLearned` (dòng ~223) và `_autoCompleteStage` (dòng ~256)
  - **Thay đổi**:
    - Đổi include của `psvList` từ `{ pathStage: { select: { wordCount: true } } }` thành `{ pathStage: { include: { stageVocabs: { select: { vocabularyBaseId: true } } } } }`
    - Bỏ guard `ups.wordsLearned >= psv.pathStage.wordCount` (dùng COUNT nên không cần)
    - Thay `ups.wordsLearned + 1` bằng COUNT query: đếm `UserVocabulary` của user trong stage đang có `isLearned: true`
    - Dùng `Math.min(learnedCount, psv.pathStage.wordCount)` để tránh overflow
  - **Verify**: `npx tsc --noEmit --project tsconfig.build.json` — compile sạch
  - **Kết quả**: `wordsLearned` luôn phản ánh count thực tế, không bị drift

### Phase 2: Sync wordsLearned khi enroll/unlock stage (REQ-01)

- [x] **TODO-2.1.1**: Sync `wordsLearned` cho next stage trong `_autoCompleteStage`
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: Đọc `_autoCompleteStage` (dòng ~256), đặc biệt phần `createMany` cho next stage
  - **Thay đổi**: Sau `createMany` vocab cho next stage, đếm `isLearned: true` và update `wordsLearned` cho `UserPathStage` tương ứng
  - **Verify**: `npx tsc --noEmit --project tsconfig.build.json`
  - **Kết quả**: Stage được unlock có `wordsLearned` đúng ngay từ đầu

- [x] **TODO-2.1.2**: Sync `wordsLearned` cho stage 1 trong `enrollUser`
  - **File**: `apps/backend/src/modules/paths/paths.service.ts`
  - **Context**: Đọc `enrollUser` (dòng ~186), phần `createMany` stage 1 vocab
  - **Thay đổi**: Sau `createMany`, đếm `isLearned: true` cho vocab của stage 1 và update `UserPathStage.wordsLearned`
  - **Verify**: `npx tsc --noEmit --project tsconfig.build.json`
  - **Kết quả**: Khi enroll, `wordsLearned` đúng từ đầu

- [x] **TODO-2.1.3**: Sync `wordsLearned` cho next stage trong `completeStage`
  - **File**: `apps/backend/src/modules/paths/paths.service.ts`
  - **Context**: Đọc `completeStage` (dòng ~232), phần unlock và `createMany` next stage
  - **Thay đổi**: Sau `createMany` vocab cho next stage, đếm `isLearned: true` và update `wordsLearned`
  - **Verify**: `npx tsc --noEmit --project tsconfig.build.json`
  - **Kết quả**: Stage mới được unlock sau complete thủ công có `wordsLearned` đúng

### Phase 3: Safety net khi queue rỗng (REQ-03)

- [x] **TODO-3.3.1**: Thêm auto-complete trigger khi `getQueue` trả về `items: []`
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: Đọc `getQueue` (dòng ~16), đặc biệt đoạn build `items` và `return`
  - **Thay đổi**: Trước `return`, nếu `items.length === 0 && currentPathStageId`, query `UserPathStage` của stage đó, đếm vocab đã `isLearned`, nếu `>= wordCount` thì gọi `_autoCompleteStage`
  - **Verify**: `npx tsc --noEmit --project tsconfig.build.json`
  - **Kết quả**: User không còn bị kẹt ở stage rỗng; stage tự hoàn thành

### Phase 4: Verification

- [x] **TODO-4.1**: TypeScript compile check
  - **Thay đổi**: `cd apps/backend && npx tsc --noEmit --project tsconfig.build.json`
  - **Verify**: Exit code 0
  - **Kết quả**: Không có lỗi type mới

---

## TÓM TẮT TRIỂN KHAI

**Trạng thái**: ✅ HOÀN THÀNH — TypeScript compile sạch

### Các thay đổi đã thực hiện

| # | File | Hàm | Thay đổi |
|---|------|-----|----------|
| A | `review.service.ts` | `_updateWordsLearned` | Dùng `COUNT` từ DB thay vì `+1`; bỏ guard `wordsLearned >= wordCount`; include `stageVocabs` để lấy vocab IDs |
| B | `review.service.ts` | `_autoCompleteStage` | Thêm `wordCount` vào select; set `wordsLearned: wordCount` khi mark complete; sync next-stage `wordsLearned` sau `createMany` |
| C | `review.service.ts` | `getQueue` | Safety net trước `return`: nếu `items: []` và stage active, đếm learned words, auto-complete nếu đủ |
| D | `paths.service.ts` | `enrollUser` | Sau `createMany` stage 1: đếm `isLearned: true`, update `wordsLearned` nếu > 0 |
| E | `paths.service.ts` | `completeStage` | Sau `createMany` next stage: đếm `isLearned: true`, update `wordsLearned` nếu > 0 |

### REQ coverage
- **REQ-01** ✅ — Sync `wordsLearned` ngay khi enroll (Change D), auto-complete (Change B), manual complete (Change E)
- **REQ-02** ✅ — COUNT thực từ DB thay vì `+1` drift (Change A)
- **REQ-03** ✅ — Safety net auto-complete khi queue rỗng (Change C)

---

## KIỂM THU THỰC TẾ

### Tổng quan
- **TODOs đã test**: TODO-1.2.1 (A), TODO-2.1.1 (B), TODO-2.1.2 (D), TODO-2.1.3 (E), TODO-3.3.1 (C)
- **Trạng thái**: ✅ PASS toàn bộ
- **Phạm vi test**: enrollUser sync, safety net API, submitReview COUNT, regression flow, stage unlock chain
- **Phát hiện bổ sung**: `_autoCompleteStage` chưa set `wordsLearned = wordCount` khi mark complete → fix đã áp dụng (Change B mở rộng)

### Test Matrix

| Case | Mô tả | Cách test | Kết quả | Ghi chú |
|------|-------|-----------|---------|---------|
| A | REQ-01: enrollUser syncs wordsLearned khi tất cả 3 từ đã học trước | Prisma direct: preMark 3/3 → enrollViaService → check `ups.wordsLearned` | ✅ PASS | wordsLearned=3 |
| B | REQ-01: enrollUser syncs wordsLearned partial (2/3) | Prisma direct: preMark 2/3 → enrollViaService → check `ups.wordsLearned & isCompleted` | ✅ PASS | wordsLearned=2, isCompleted=false |
| C | REQ-03: Safety net getQueue auto-completes stuck stage | API: enroll → drift all to isLearned=true → `GET /review/queue?userPathId` → check stage | ✅ PASS | isCompleted=true, wordsLearned=3, stage2 unlocked |
| D | REQ-02: submitReview dùng COUNT (2 pre-learned, submit 1 cuối) | API: `POST /review/submit` recallQuality=4 → check stage | ✅ PASS | wordsLearned=3, isCompleted=true |
| E | Regression: normal review flow 3 words từ đầu | API: enroll (0 pre-learned) → submit 3 reviews → check stage + stage2 | ✅ PASS | isCompleted=true, stage2.isUnlocked=true |

### Runtime checks
- Console/log lỗi mới: ✅ PASS — không có lỗi mới
- API response contract: ✅ PASS — `items`, `pathTitle`, `currentPathStageId` đúng shape
- DB state sau mỗi case: ✅ PASS — `isCompleted`, `wordsLearned`, `isUnlocked` đúng kỳ vọng

### Kết luận
- **Kết quả cuối**: ✅ PASS
- **Lỗi phát hiện thêm trong test**: `_autoCompleteStage` không set `wordsLearned` cho stage bị complete → đã fix ngay (thêm `wordsLearned: ups.pathStage.wordCount` vào update, thêm `wordCount` vào pathStage select)
- **Hành động tiếp theo**: Sẵn sàng merge / deploy

