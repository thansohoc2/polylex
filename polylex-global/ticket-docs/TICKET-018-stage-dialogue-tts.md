# TICKET-018 — Stage Dialogue & TTS Playback

## Yêu cầu gốc

Khi tạo một learning path, AI cũng tạo thêm một đoạn hội thoại ngắn chứa tất cả các từ mới của từng stage. Sau khi user Review hết các từ trong stage thì thay nút "Review again" bằng nút "Xem hội thoại". Màn hình hội thoại hiển thị các câu theo dòng, có nút đọc bằng Web Speech API, khi đọc tới câu/từ nào thì highlight câu và từ đó tự nhiên. Trên màn hình Path (danh sách stages), mỗi stage cũng có thêm button để vào xem hội thoại.

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-018 |
| **Tiêu đề** | Stage Dialogue — AI tạo hội thoại per-stage + màn hình TTS highlight |
| **Mục tiêu** | Gắn một đoạn hội thoại ngữ cảnh vào mỗi stage của learning path; cho phép user nghe + đọc hội thoại sau khi review xong stage; highlight từ/câu realtime khi TTS chạy |
| **Phạm vi** | Backend: DB migration, AI service, Paths service, Paths controller · Frontend: DialoguePage mới, ReviewPage, StageRow, PathCard, router |
| **Độ ưu tiên** | Trung bình |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | DB: Bảng `path_stage_dialogues` | Tạo model Prisma + migration lưu hội thoại per PathStage | DB | Nhỏ |
| REQ-02 | AI: Sinh hội thoại per-stage | Thêm method `generateStageDialogue()` vào `AiService` gọi Gemini | Backend | Trung bình |
| REQ-03 | Backend: Lưu hội thoại khi tạo path | Trong `PathsService.createFromAI()` gọi AI sinh dialogue cho mỗi stage và lưu vào DB | Backend | Nhỏ |
| REQ-04 | API: Endpoint lấy dialogue của stage | `GET /paths/stages/:pathStageId/dialogue` trả về danh sách lines + vocab terms | REST API | Nhỏ |
| REQ-05 | FE: Màn hình hội thoại `DialoguePage` | Route `/dialogue/:pathStageId`, hiển thị lines, nút play, TTS bằng Web Speech API | Frontend | Lớn |
| REQ-06 | FE: Thay nút "Review again" → "Xem hội thoại" | Trong `ReviewPage` (phase `done` khi có `userPathId`), thay hoặc thêm nút điều hướng sang dialogue | Frontend | Nhỏ |
| REQ-07 | FE: Nút hội thoại trên từng stage | Trong `StageRow.tsx`, thêm button "Hội thoại" dẫn tới `DialoguePage` | Frontend | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 ──> REQ-03   (tuần tự: DB trước, rồi AI, rồi tích hợp)
REQ-01 ──> REQ-04               (endpoint cần schema)
REQ-04 ──> REQ-05               (FE cần có API)
REQ-04 ──> REQ-06               (FE cần biết có dialogue không)
REQ-04 ──> REQ-07               (FE cần pathStageId)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: DB — Bảng `path_stage_dialogues`
- **Mục tiêu**: Lưu trữ nội dung hội thoại gắn với từng `PathStage`
- **Đầu vào**: `pathStageId`, mảng `lines` (JSON)
- **Đầu ra mong đợi**: Model Prisma `PathStageDialogue`, migration SQL
- **Schema đề xuất**:
  ```prisma
  model PathStageDialogue {
    id          String   @id @default(uuid())
    pathStageId String   @unique @map("path_stage_id")
    lines       Json     // DialogueLine[]
    createdAt   DateTime @default(now()) @map("created_at")

    pathStage PathStage @relation(fields: [pathStageId], references: [id], onDelete: Cascade)

    @@map("path_stage_dialogues")
  }
  ```
  Trong đó `lines` là JSON array với type:
  ```typescript
  interface DialogueLine {
    speaker: string;      // "A" | "B"
    text: string;         // Câu tiếng học (target language)
    translation?: string; // Dịch nghĩa (native language)
    vocabTerms: string[]; // Các từ vựng của stage xuất hiện trong câu này
  }
  ```
- **Tiêu chí hoàn thành**: Migration chạy thành công, Prisma client tạo lại được
- **Phụ thuộc**: Không

##### REQ-02: AI — Sinh hội thoại per-stage
- **Mục tiêu**: Gọi Gemini để sinh một đoạn hội thoại ngắn (6–10 lượt) chứa tất cả từ vựng của một stage
- **Đầu vào**: Danh sách vocab terms của stage, target language, native language, CEFR level, stage title
- **Đầu ra mong đợi**: Mảng `DialogueLine[]` đã validate bằng Zod
- **Prompt strategy**:
  ```
  Generate a short dialogue (6–10 exchanges) between two people (A and B) in {targetLanguage}.
  The dialogue must naturally use ALL of these words: {terms}.
  CEFR level: {cefrLevel}. Context: {stageTitle}.
  For each line include: speaker, text, translation ({nativeLanguage}), vocabTerms (subset of the word list that appears in this line).
  Return JSON array.
  ```
- **Zod schema**: `DialogueLineSchema`, `DialogueSchema = z.array(DialogueLineSchema).min(3)`
- **Tiêu chí hoàn thành**: Method hoạt động, trả về JSON hợp lệ
- **Phụ thuộc**: REQ-01 (để biết kiểu dữ liệu lưu)

##### REQ-03: Backend — Tích hợp sinh dialogue vào `createFromAI()`
- **Mục tiêu**: Sau khi upsert vocab cho mỗi stage, gọi `aiService.generateStageDialogue()` và lưu vào `PathStageDialogue`
- **Lưu ý**: Gọi AI per-stage có thể chậm (5–7 stages × ~5s = 30–40s). Hai lựa chọn:
  - **Option A (đồng bộ)**: Sinh trong transaction loop, user chờ lâu hơn nhưng dialogue sẵn sàng ngay
  - **Option B (ngoài transaction)**: Sinh sau khi transaction xong, lưu bất đồng bộ — dialogue có thể chưa có khi user vào xem lần đầu
- **Khuyến nghị**: Option A — gọi bên ngoài transaction chính nhưng vẫn tuần tự (không async), đơn giản nhất và tránh race condition
- **Tiêu chí hoàn thành**: Mỗi stage sau khi tạo path đều có dialogue trong DB
- **Phụ thuộc**: REQ-01, REQ-02

##### REQ-04: API — `GET /paths/stages/:pathStageId/dialogue`
- **Mục tiêu**: Trả về dialogue lines kèm metadata cho FE render
- **Auth**: JWT required, chỉ trả về nếu user có quyền với stage này (thông qua `UserPathStage`)
- **Response DTO**:
  ```typescript
  class StageDialogueDto {
    pathStageId: string;
    stageTitle: string;
    targetLanguageCode: string;
    lines: DialogueLineDto[];
  }
  class DialogueLineDto {
    speaker: string;
    text: string;
    translation?: string;
    vocabTerms: string[];
  }
  ```
- **Tiêu chí hoàn thành**: Endpoint hoạt động, trả 404 nếu không có dialogue, 403 nếu không có quyền
- **Phụ thuộc**: REQ-01

##### REQ-05: FE — `DialoguePage.tsx`
- **Route**: `/dialogue/:pathStageId`
- **Mục tiêu**: Màn hình hội thoại có TTS realtime highlight
- **UI layout**:
  - Header: tiêu đề stage + nút back
  - List các `DialogueLine`:
    - Avatar/label speaker (A bên trái, B bên phải, bubble chat style)
    - Câu gốc (target lang) với từ vựng có thể highlight
    - Câu dịch nhỏ bên dưới (toggle show/hide)
  - Thanh control phía dưới: Nút ▶ Play All / ⏸ Pause, tốc độ đọc
- **TTS highlight logic** (Web Speech API):
  ```
  utterance.onboundary = (e) => {
    // e.charIndex = vị trí bắt đầu từ đang đọc trong utterance.text
    // Tính chỉ số từ → highlight từ trong DOM tương ứng
  }
  ```
  - Khi bắt đầu đọc 1 line: highlight background toàn bộ bubble đó
  - Khi `onboundary` fire: highlight từ đang đọc (nếu là vocab term thì highlight màu accent)
  - Khi line xong (`onend`): chuyển sang line tiếp theo, remove highlight line cũ
- **Tiêu chí hoàn thành**: Toàn bộ hội thoại có thể nghe được, highlight hoạt động mượt, responsive
- **Phụ thuộc**: REQ-04

##### REQ-06: FE — Thay "Review again" → "Xem hội thoại"
- **File**: `apps/frontend/src/pages/ReviewPage.tsx`
- **Điều kiện**: `phase === 'done' && userPathId !== undefined`
- **Thay đổi**: Cần biết `pathStageId` của stage vừa review xong để điều hướng. Hiện tại ReviewPage nhận `userPathId` từ route params. Cần thêm `stageId` vào context review hoặc lấy từ API.
- **Đề xuất**: Trong response của `reviewApi.getQueue({ userPathId })`, thêm trường `currentPathStageId` để FE có thể navigate `/dialogue/:stageId`
- **Nút thay thế**: Thay nút "Review again" bằng hai nút: "Xem hội thoại" (primary) + "Ôn lại" (secondary)
- **i18n keys cần thêm**: `review.viewDialogue`
- **Tiêu chí hoàn thành**: Sau khi review xong stage, nút dẫn đúng tới dialogue page
- **Phụ thuộc**: REQ-04, REQ-05

##### REQ-07: FE — Nút hội thoại trên `StageRow`
- **File**: `apps/frontend/src/components/roadmap/StageRow.tsx`
- **Điều kiện hiển thị**: Chỉ hiện nút khi stage `isUnlocked === true` (đã mở khoá)
- **Đề xuất**: Thêm icon 💬 hoặc nút nhỏ "Hội thoại" cạnh nút "Học tiếp →"
- **Props cần thêm**: `pathStageId` vào `PathStageDto` (hiện tại `id` trong DTO là `userStage.id` — cần thêm `stageId` thực của `PathStage`)
- **Tiêu chí hoàn thành**: Nút hiển thị đúng, navigate đúng tới `/dialogue/:pathStageId`
- **Phụ thuộc**: REQ-04, REQ-05

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng hiện tại**: User tạo path → AI sinh vocab + stage → User ôn từng stage trong ReviewPage → Hoàn thành stage → Mở khoá stage tiếp.
- **Luồng mới thêm**: AI sinh đồng thời dialogue cho từng stage → User ôn xong stage → Thấy nút "Xem hội thoại" → Đọc/nghe hội thoại phủ toàn bộ từ vựng vừa học → Củng cố ngữ cảnh sử dụng từ.
- **Thực thể domain**: `PathTemplate` → `PathStage` → `PathStageVocab` + **`PathStageDialogue` (mới)**.
- **Quy tắc nghiệp vụ**:
  - Dialogue gắn với `PathStage` (không phải `UserPathStage`) → dùng chung cho mọi user học cùng stage.
  - Dialogue chỉ hiển thị nút khi stage đã được `isUnlocked` (user đã mở khoá stage đó).
  - Nếu AI không sinh được dialogue (lỗi quota/timeout), path vẫn được tạo thành công; dialogue có thể để trống — FE ẩn nút nếu `dialogue === null`.

---

### 4. Ngữ cảnh kỹ thuật

**Backend files ảnh hưởng:**
- `apps/backend/prisma/schema.prisma` — thêm `PathStageDialogue` model
- `apps/backend/prisma/migrations/` — migration mới
- `apps/backend/src/modules/ai/ai.service.ts` — thêm `generateStageDialogue()`, Zod schema mới
- `apps/backend/src/modules/paths/paths.service.ts` — gọi AI sinh dialogue trong `createFromAI()`
- `apps/backend/src/modules/paths/paths.controller.ts` — thêm endpoint GET dialogue
- `apps/backend/src/modules/paths/dto/paths.dto.ts` — thêm `StageDialogueDto`, `DialogueLineDto`

**Frontend files ảnh hưởng:**
- `apps/frontend/src/pages/ReviewPage.tsx` — thay nút, thêm điều hướng
- `apps/frontend/src/components/roadmap/StageRow.tsx` — thêm nút dialogue
- `apps/frontend/src/pages/DialoguePage.tsx` — **tạo mới**
- `apps/frontend/src/App.tsx` hoặc router — thêm route `/dialogue/:pathStageId`
- `apps/frontend/src/api/client.ts` — thêm `pathsApi.getStageDialogue()`
- `apps/frontend/src/i18n/locales/en|vi|pt.json` — thêm keys `review.viewDialogue`, `dialogue.*`

**DB tables liên quan:**
- `path_stages` (đọc, join)
- `path_stage_dialogues` (tạo mới, đọc)
- `user_path_stages` (kiểm tra quyền truy cập)

**Web Speech API:** Browser-native, không cần cài thêm package. Event `onboundary` hỗ trợ Chrome/Edge tốt, Firefox có giới hạn.

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `generateLearningPath()` trả về vocab chỉ | Trả về vocab + sinh dialogue per stage | Thêm AI call + lưu DB |
| Không có bảng `PathStageDialogue` | Có bảng để lưu JSON dialogue | DB migration + Prisma model |
| Không có endpoint dialogue | `GET /paths/stages/:id/dialogue` | Controller + Service method |
| `ReviewPage` chỉ có "Review again" | Có thêm "Xem hội thoại" khi đang ôn path | Sửa ReviewPage, thêm `currentPathStageId` vào API response |
| `StageRow` không có dialogue | Có nút 💬 điều hướng | Sửa StageRow + cần `stageId` trong DTO |
| Không có `DialoguePage` | Màn hình hội thoại đầy đủ với TTS | Tạo mới hoàn toàn |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ

- [ ] **Dialogue có thể không bao gồm tất cả từ vựng**: AI đôi khi bỏ sót từ — Biện pháp: validate sau khi sinh, retry nếu thiếu từ; hoặc chấp nhận "phủ phần lớn" (≥ 80%).
- [ ] **Dialogue kém chất lượng ở CEFR thấp (A1)**: Câu đơn giản khó đưa vào hội thoại tự nhiên — Biện pháp: Điều chỉnh prompt theo level, cho phép hội thoại đơn giản.
- [ ] **Path tạo chậm hơn đáng kể**: Thêm 5–7 AI calls per stage → 30–60s thêm — Biện pháp: Sinh dialogue song song (Promise.all) hoặc thông báo "đang chuẩn bị hội thoại…" async.

#### 6.2 Rủi ro kỹ thuật

- [ ] **`onboundary` không hoạt động trên Safari/Firefox**: Safari Web Speech API không hỗ trợ `onboundary` event — Biện pháp: Fallback highlight toàn câu (không highlight từng từ) khi `onboundary` không fire.
- [ ] **`pathStageId` chưa có trong `StageRow` props**: DTO hiện tại dùng `userStage.id` làm `stage.id` — cần thêm trường `pathStageId` riêng vào `PathStageDto` — Biện pháp: Sửa `mapToPathDto()` trong service.
- [ ] **`currentPathStageId` chưa có trong review queue response**: ReviewPage cần biết đang ôn stage nào — Biện pháp: Thêm `currentPathStageId` vào `ReviewQueueResponse` DTO trong review module.
- [ ] **Dialogue overload token Gemini**: Sinh 7 stage × 10 dòng hội thoại có thể tốn nhiều token — Biện pháp: Giới hạn 6–8 dòng, dùng `gemini-2.5-flash`.

#### 6.3 Lỗi logic tiềm ẩn

- [ ] **Dialogue không tồn tại khi user ấn nút**: Nếu AI lỗi khi tạo path → dialogue null → FE crash — Cách phòng tránh: API trả 404, FE ẩn nút nếu `hasDialogue === false`.
- [ ] **`vocabTerms` trong dialogue không khớp với term trong DB**: AI có thể trả về dạng biến thể (inflection) của từ — Cách phòng tránh: Matching case-insensitive + trim, hoặc chỉ dùng vocabTerms để highlight không dùng để query DB.
- [ ] **TTS không dừng khi user navigate away**: `speechSynthesis.cancel()` phải được gọi trong cleanup (`useEffect` return) — Cách phòng tránh: `return () => window.speechSynthesis.cancel()` trong DialoguePage.
- [ ] **Race condition khi play nhiều line**: Nếu user ấn play line khác khi line trước chưa xong — Cách phòng tránh: Cancel utterance hiện tại trước khi bắt đầu utterance mới.

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Củng cố từ vựng trong ngữ cảnh thực tế | Tăng thời gian tạo path (~30–60s thêm) |
| Không cần backend TTS — dùng Web Speech API của browser, không tốn chi phí | Web Speech API không đồng nhất cross-browser |
| Dialogue dùng chung cho mọi user cùng stage (tiết kiệm AI calls) | Cần thêm nhiều fields vào DTO hiện có |
| UI hội thoại trực quan, tăng engagement | Phức tạp ở phần highlight từng từ realtime |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**:
  1. Sinh dialogue **đồng bộ** trong `createFromAI()`, gọi `Promise.all()` cho các stages để giảm latency (song song thay vì tuần tự).
  2. Nếu một stage fail → log warning, tiếp tục (không fail cả path).
  3. `PathStageDialogue` lưu JSON column cho `lines` — đơn giản, không cần thêm bảng phụ.
  4. FE thêm trường `hasDialogue: boolean` trong `PathStageDto` để StageRow biết hiển thị nút hay không mà không cần gọi thêm API.
  5. `DialoguePage` dùng bubble chat layout (A trái, B phải), khi TTS chạy: dùng `onboundary` cho word-highlight, fallback graceful cho browser không hỗ trợ.

- **Các cách tiếp cận thay thế**:
  - Sinh dialogue **async sau khi tạo path** (background job): Phức tạp hơn (cần queue/worker), nhưng tránh timeout; phù hợp nếu thêm nhiều stages.
  - Sinh dialogue **on-demand** khi user lần đầu vào DialoguePage: Đơn giản nhất phía backend, nhưng user phải chờ lần đầu.

- **Phụ thuộc**:
  - Gemini API key còn quota (hiện dùng `gemini-2.5-flash`)
  - Browser hỗ trợ Web Speech API (`window.speechSynthesis`)

- **Ước tính công sức**:
  - Backend (REQ-01 → REQ-04): ~4–6h
  - Frontend DialoguePage (REQ-05): ~6–8h
  - Frontend integration (REQ-06, REQ-07): ~2–3h
  - **Tổng**: ~12–17h

---

### 9. Câu hỏi mở → Đã giải đáp

- [x] Nút hội thoại trên StageRow chỉ hiện khi `isUnlocked`, hay hiện ở mọi stage (kể cả stage bị khoá) để preview? — **→ Chỉ hiện khi `isUnlocked`**
- [x] Có cần hiển thị bản dịch của từng dòng hội thoại mặc định, hay ẩn và chỉ hiện khi user bấm? — **→ Ẩn mặc định, hiện khi user bấm từng dòng**
- [x] Khi AI không tạo được dialogue cho một stage (lỗi quota), có retry sau khi tạo path hay bỏ qua hoàn toàn? — **→ Bỏ qua (skip silently), path vẫn tạo thành công**
- [x] Số lượng dòng dialogue mong muốn mỗi stage là bao nhiêu? — **→ 8–10 lượt trao đổi** (Miller's Law: 7±2 working memory chunks)
- [x] Có cần sinh dialogue theo ngôn ngữ bản địa của user (native language) hay chỉ target language + dịch nghĩa từng dòng — **→ Target language + dịch nghĩa từng dòng**

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Tạo `PathStageDialogue` (DB → AI → Service → API), sinh hội thoại 8–10 lượt khi user tạo path, và xây dựng `DialoguePage` với Web Speech API TTS + highlight; thêm nút truy cập dialogue từ `ReviewPage` (phase done) và `StageRow` (khi unlocked).

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: AI sinh 8–10 lượt hội thoại (target language + translation per line) chứa tất cả từ vựng của stage khi tạo path
2. FR-02: Dialogue lưu vào `path_stage_dialogues` gắn với `PathStage.id` (dùng chung, không phải per-user)
3. FR-03: `PathStageDto` trả thêm `pathStageId: string` và `hasDialogue: boolean`
4. FR-04: `GET /paths/stages/:pathStageId/dialogue` trả `StageDialogueDto` (JWT required, kiểm tra user có `UserPathStage` cho stage đó)
5. FR-05: `ReviewQueueResponse` trả thêm `currentPathStageId?: string` khi query bằng `userPathId`
6. FR-06: `ReviewPage` khi `phase === 'done' && userPathId`: nút "Xem hội thoại" (primary) và "Ôn lại" (secondary); nút dialogue ẩn nếu `!currentPathStageId`
7. FR-07: `StageRow` khi `isUnlocked && hasDialogue`: hiển thị nút 💬 dẫn tới `/dialogue/:pathStageId`
8. FR-08: `DialoguePage` — bubble chat layout, TTS play-all, word highlight (onboundary) hoặc line highlight (fallback), dịch nghĩa ẩn mặc định

#### Ràng buộc phi chức năng
1. NFR-01: AI fail cho 1 stage → log warning + skip, path vẫn tạo thành công
2. NFR-02: Translation ẩn mặc định, hiện khi user tap từng dòng
3. NFR-03: Nút dialogue StageRow chỉ hiện khi `isUnlocked === true`
4. NFR-04: `speechSynthesis.cancel()` gọi trong `useEffect` cleanup của DialoguePage
5. NFR-05: Số lượng lines: 8–10 lượt (Miller's Law 7±2 chunks) — nêu rõ trong prompt AI
6. NFR-06: Dialogue sinh song song (`Promise.all`) cho tất cả stages để giảm latency

#### Phụ thuộc
- DEP-01: `PathStageDialogue` DB model (TODO-1.1.x) → tất cả TODO khác
- DEP-02: `generateStageDialogue()` AI method (TODO-2.2.x) → TODO-3.3.3
- DEP-03: `pathStageId` + `hasDialogue` trong `PathStageDto` (TODO-3.4.2) → TODO-8.7.1
- DEP-04: `currentPathStageId` trong review queue (TODO-4.6.x) → TODO-8.6.1
- DEP-05: `GET stages/:pathStageId/dialogue` endpoint (TODO-3.4.4 → TODO-3.4.5) → DialoguePage

### Cách tiếp cận
> Backend-first: DB schema → AI service → Paths service/DTO → Controller → Review queue update. Sau đó frontend: API client types → i18n → route → DialoguePage → ReviewPage update → StageRow update. Dialogue generation dùng `Promise.all()` per stage bên ngoài transaction, try-catch per stage (skip silently). `pathStageId` và `hasDialogue` được inject vào `PathStageDto` trong `mapToPathDto()`.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/backend/prisma/schema.prisma` | Thêm model `PathStageDialogue` + back-relation vào `PathStage` |
| Tạo mới | `apps/backend/prisma/migrations/*/` | Migration SQL tự sinh bởi Prisma |
| Sửa đổi | `apps/backend/src/modules/ai/ai.service.ts` | Thêm `DialogueLine` interface, Zod schema, `generateStageDialogue()` |
| Sửa đổi | `apps/backend/src/modules/paths/dto/paths.dto.ts` | Thêm `DialogueLineDto`, `StageDialogueDto`; mở rộng `PathStageDto` |
| Sửa đổi | `apps/backend/src/modules/paths/paths.service.ts` | Dialogue generation + `getStageDialogue()` + update `mapToPathDto()` + update includes |
| Sửa đổi | `apps/backend/src/modules/paths/paths.controller.ts` | Thêm `GET stages/:pathStageId/dialogue` |
| Sửa đổi | `apps/backend/src/modules/review/review.service.ts` | Trả `currentPathStageId` khi query bằng `userPathId` |
| Sửa đổi | `apps/frontend/src/api/client.ts` | Thêm `pathApi.getStageDialogue()`, cập nhật `ReviewQueueResponse` |
| Sửa đổi | `apps/frontend/src/i18n/locales/en.json` | Thêm keys `review.viewDialogue`, `review.reviewAgainBtn`, `dialogue.*` |
| Sửa đổi | `apps/frontend/src/i18n/locales/vi.json` | Keys tương đương tiếng Việt |
| Sửa đổi | `apps/frontend/src/i18n/locales/pt.json` | Keys tương đương tiếng Bồ |
| Sửa đổi | `apps/frontend/src/App.tsx` | Thêm route `/dialogue/:pathStageId` |
| Tạo mới | `apps/frontend/src/pages/DialoguePage.tsx` | Màn hình hội thoại + TTS + highlight |
| Sửa đổi | `apps/frontend/src/pages/ReviewPage.tsx` | View Dialogue button + track `currentPathStageId` |
| Sửa đổi | `apps/frontend/src/components/roadmap/StageRow.tsx` | Cập nhật `PathStageDto` interface + thêm 💬 button |

---

## PLAN TODO

### Phase 1: Data Layer

#### REQ-01: DB — Bảng `path_stage_dialogues`

- [x] **TODO-1.1.1**: Thêm model `PathStageDialogue` vào schema.prisma
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Đọc model `PathStage` và `UserPathStage` để hiểu pattern quan hệ
  - **Thay đổi**: Thêm model sau `UserPathStage`:
    ```prisma
    model PathStageDialogue {
      id          String   @id @default(uuid())
      pathStageId String   @unique @map("path_stage_id")
      lines       Json     // DialogueLine[] — { speaker, text, translation, vocabTerms }
      createdAt   DateTime @default(now()) @map("created_at")

      pathStage PathStage @relation(fields: [pathStageId], references: [id], onDelete: Cascade)

      @@map("path_stage_dialogues")
    }
    ```
  - **Verify**: File save không báo lỗi Prisma syntax
  - **Kết quả**: Model `PathStageDialogue` được định nghĩa trong schema

- [x] **TODO-1.1.2**: Thêm back-relation `dialogue` vào model `PathStage`
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Đọc `PathStage` model hiện tại (dòng ~295–310)
  - **Thay đổi**: Trong `PathStage`, thêm field sau `userStages UserPathStage[]`:
    ```prisma
    dialogue     PathStageDialogue?
    ```
  - **Verify**: `npx prisma validate` pass (chạy trong `apps/backend/`)
  - **Kết quả**: Relation 1–1 giữa `PathStage` và `PathStageDialogue` hoàn chỉnh

- [x] **TODO-1.1.3**: Chạy Prisma migration để tạo bảng `path_stage_dialogues`
  - **File**: `apps/backend/prisma/migrations/` (tự sinh)
  - **Context**: Schema đã cập nhật ở TODO-1.1.1 + TODO-1.1.2
  - **Thay đổi**: Chạy lệnh:
    ```bash
    cd apps/backend && npx prisma migrate dev --name add_stage_dialogues
    ```
  - **Verify**: Migration chạy thành công, không có error; file migration SQL được tạo trong `migrations/`
  - **Kết quả**: Bảng `path_stage_dialogues` tồn tại trong DB, Prisma Client được tái sinh

---

### Phase 2: AI Service

#### REQ-02: AI — Method `generateStageDialogue()`

- [x] **TODO-2.2.1**: Thêm interface `DialogueLine` và Zod schemas vào ai.service.ts
  - **File**: `apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: Đọc pattern Zod hiện tại (`GeneratedPathVocabSchema`, `GeneratedPathSchema`) — dòng ~65–85
  - **Thay đổi**: Thêm sau block Zod schemas hiện có:
    ```typescript
    export interface DialogueLine {
      speaker: 'A' | 'B';
      text: string;         // target language
      translation: string;  // native language translation
      vocabTerms: string[]; // subset of stage vocab appearing in this line
    }

    const DialogueLineSchema = z.object({
      speaker: z.enum(['A', 'B']),
      text: z.string().min(1),
      translation: z.string().min(1),
      vocabTerms: z.array(z.string()),
    });

    const DialogueSchema = z.array(DialogueLineSchema).min(6).max(20);
    ```
  - **Verify**: `cd apps/backend && npm run build` pass (TypeScript compile)
  - **Kết quả**: Types và Zod schema sẵn sàng cho method mới

- [x] **TODO-2.2.2**: Thêm method `generateStageDialogue()` vào class `AiService`
  - **File**: `apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: Đọc pattern `generateLearningPath()` (dòng ~196–233) để theo cấu trúc prompt + retry + Zod validate
  - **Thay đổi**: Thêm method sau `generateLearningPath()`:
    ```typescript
    async generateStageDialogue(
      terms: string[],
      targetLanguage: string,
      nativeLanguage: string,
      cefrLevel: string,
      stageTitle: string,
    ): Promise<DialogueLine[]> {
      this.ensureEnabled();

      const prompt = `You are a language teacher creating a contextual dialogue.
    Generate a natural dialogue of 8–10 exchanges (turns) between two people (speaker A and B) in ${targetLanguage}.
    CEFR level: ${cefrLevel}. Topic: "${stageTitle}".
    The dialogue MUST naturally use ALL of these vocabulary words: ${terms.join(', ')}.
    For each line return: speaker ("A" or "B"), text (in ${targetLanguage}), translation (in ${nativeLanguage}), vocabTerms (array of the vocabulary words from the list that appear in this line).
    Return a JSON array only.`;

      const result = await this.withRetry(() => this.geminiJson!.generateContent(prompt));
      const raw = result.response.text().trim();
      const cleaned = raw.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();

      let json: unknown;
      try {
        json = JSON.parse(cleaned);
      } catch {
        throw new Error('AI returned invalid JSON for dialogue');
      }

      return DialogueSchema.parse(json);
    }
    ```
  - **Verify**: `cd apps/backend && npm run build` pass
  - **Kết quả**: `aiService.generateStageDialogue()` callable, returns `DialogueLine[]`

---

### Phase 3: Backend Service & DTO

#### REQ-04: DTO — Mở rộng `PathStageDto` + thêm `StageDialogueDto`

- [x] **TODO-3.4.1**: Thêm `DialogueLineDto` và `StageDialogueDto` vào paths.dto.ts
  - **File**: `apps/backend/src/modules/paths/dto/paths.dto.ts`
  - **Context**: Đọc file hiện tại để biết vị trí thêm (sau `CompleteStageResponseDto`)
  - **Thay đổi**: Thêm ở cuối file:
    ```typescript
    export class DialogueLineDto {
      speaker: 'A' | 'B';
      text: string;
      translation: string;
      vocabTerms: string[];
    }

    export class StageDialogueDto {
      pathStageId: string;
      stageTitle: string;
      targetLanguageCode: string;
      lines: DialogueLineDto[];
    }
    ```
  - **Verify**: `npm run build` pass
  - **Kết quả**: DTOs sẵn sàng cho controller response

- [x] **TODO-3.4.2**: Thêm `pathStageId` và `hasDialogue` vào `PathStageDto`
  - **File**: `apps/backend/src/modules/paths/dto/paths.dto.ts`
  - **Context**: Đọc `PathStageDto` hiện tại (dòng ~35–48)
  - **Thay đổi**: Thêm hai fields vào `PathStageDto`:
    ```typescript
    pathStageId: string;   // ID của PathStage (khác với id = UserPathStage.id)
    hasDialogue: boolean;  // true nếu PathStageDialogue tồn tại cho stage này
    ```
  - **Verify**: `npm run build` — TypeScript báo lỗi ở `mapToPathDto()` vì thiếu fields → sẽ fix ở TODO-3.4.3
  - **Kết quả**: DTO contract mở rộng

#### REQ-03: Service — Tích hợp dialogue generation + `mapToPathDto()` + `getStageDialogue()`

- [x] **TODO-3.4.3**: Cập nhật `getMyPaths()` và `getPathById()` includes để join `dialogue`
  - **File**: `apps/backend/src/modules/paths/paths.service.ts`
  - **Context**: Đọc `getMyPaths()` (dòng ~212) và `getPathById()` (dòng ~242) — cả hai có cấu trúc `include.pathTemplate.include.stages`
  - **Thay đổi**: Trong cả 2 method, thêm `include: { dialogue: true }` vào include của `stages`:
    ```typescript
    stages: {
      orderBy: { order: 'asc' },
      include: {
        dialogue: true,   // ← thêm dòng này
        stageVocabs: { ... }
      }
    }
    ```
  - **Verify**: `npm run build` pass (Prisma types phải nhận `dialogue` sau migration TODO-1.1.3)
  - **Kết quả**: `stage.dialogue` available trong `mapToPathDto()`

- [x] **TODO-3.4.4**: Cập nhật `mapToPathDto()` để populate `pathStageId` và `hasDialogue`
  - **File**: `apps/backend/src/modules/paths/paths.service.ts`
  - **Context**: Đọc `mapToPathDto()` (dòng ~267–315) — đặc biệt đoạn `return { id: userStage?.id ?? stage.id, ... }`
  - **Thay đổi**: Trong object return của stage map, thêm 2 fields:
    ```typescript
    return {
      id: userStage?.id ?? stage.id,
      pathStageId: stage.id,          // ← thêm: ID thực của PathStage
      hasDialogue: !!stage.dialogue,  // ← thêm: boolean check
      order: stage.order,
      // ... rest unchanged
    } as PathStageDto;
    ```
  - **Verify**: `npm run build` pass (TypeScript không còn báo thiếu `pathStageId`/`hasDialogue`)
  - **Kết quả**: `PathStageDto` trả đúng `pathStageId` và `hasDialogue` qua API

- [x] **TODO-3.4.5**: Thêm method `getStageDialogue()` vào PathsService
  - **File**: `apps/backend/src/modules/paths/paths.service.ts`
  - **Context**: Đọc `completeStage()` để hiểu pattern kiểm tra quyền user (dòng ~145); đọc `StageDialogueDto` vừa tạo
  - **Thay đổi**: Thêm method sau `getPathById()`:
    ```typescript
    async getStageDialogue(userId: string, pathStageId: string): Promise<StageDialogueDto> {
      // Verify user has access to this stage via UserPathStage
      const userStage = await this.prisma.userPathStage.findFirst({
        where: { pathStageId, userPath: { userId } },
        include: {
          pathStage: {
            include: {
              dialogue: true,
              pathTemplate: {
                include: { targetLanguage: true },
              },
            },
          },
        },
      });

      if (!userStage) {
        throw new ForbiddenException('No access to this stage');
      }

      const dialogue = userStage.pathStage.dialogue;
      if (!dialogue) {
        throw new NotFoundException('Dialogue not available for this stage');
      }

      return {
        pathStageId,
        stageTitle: userStage.pathStage.title,
        targetLanguageCode: userStage.pathStage.pathTemplate.targetLanguage.code,
        lines: dialogue.lines as DialogueLineDto[],
      };
    }
    ```
  - **Verify**: `npm run build` pass
  - **Kết quả**: Service method sẵn sàng cho controller

- [x] **TODO-3.4.6**: Thêm dialogue generation loop vào `createFromAI()`
  - **File**: `apps/backend/src/modules/paths/paths.service.ts`
  - **Context**: Đọc `createFromAI()` (dòng ~24–135) — đặc biệt đoạn sau `await this.enrollUser(userId, pathTemplateId!)` (dòng ~133)
  - **Thay đổi**: Sau dòng `await this.enrollUser(...)`, thêm:
    ```typescript
    // Generate dialogue for each stage — parallel, fail-safe (skip on error)
    const stagesWithVocab = await this.prisma.pathStage.findMany({
      where: { pathTemplateId: pathTemplateId! },
      orderBy: { order: 'asc' },
      include: {
        stageVocabs: {
          include: { vocabularyBase: { select: { term: true } } },
        },
      },
    });

    if (this.aiService.isEnabled) {
      const nativeLangNameResolved = nativeLangName; // already computed above
      await Promise.all(
        stagesWithVocab.map(async (stage) => {
          try {
            const terms = stage.stageVocabs.map((sv) => sv.vocabularyBase.term);
            const lines = await this.aiService.generateStageDialogue(
              terms,
              targetLang.name,
              nativeLangNameResolved,
              aiResult.stages.find((s) => s.order === stage.order)?.vocab[0]?.cefrLevel ?? dto.targetCefrLevel,
              stage.title,
            );
            await this.prisma.pathStageDialogue.create({
              data: { pathStageId: stage.id, lines: lines as any },
            });
          } catch (err) {
            this.logger.warn(`Dialogue generation skipped for stage ${stage.id}: ${err}`);
          }
        }),
      );
    }
    ```
  - **Verify**: `npm run build` pass; path creation still works even if Gemini is disabled (`isEnabled === false`)
  - **Kết quả**: Mỗi stage có `PathStageDialogue` sau khi tạo path thành công

#### REQ-04: Controller — Endpoint `GET stages/:pathStageId/dialogue`

- [x] **TODO-3.4.7**: Thêm endpoint `GET stages/:pathStageId/dialogue` vào PathsController
  - **File**: `apps/backend/src/modules/paths/paths.controller.ts`
  - **Context**: Đọc controller hiện tại — pattern `@Get`, `@Param`, `@CurrentUser`
  - **Thay đổi**: Thêm sau endpoint `completeStage`:
    ```typescript
    @Get('stages/:pathStageId/dialogue')
    @ApiOperation({ summary: 'Get AI-generated dialogue for a specific stage' })
    getStageDialogue(
      @Param('pathStageId') pathStageId: string,
      @CurrentUser() user: AuthUser,
    ) {
      return this.svc.getStageDialogue(user.id, pathStageId);
    }
    ```
  - **Verify**: `npm run build` pass; `curl -H "Authorization: Bearer ..." GET /api/v1/paths/stages/:id/dialogue` trả 404 hoặc JSON
  - **Kết quả**: Endpoint hoạt động, trả `StageDialogueDto` hoặc 404/403

---

### Phase 4: Review Queue Update

#### REQ-06 prerequisite — `currentPathStageId` trong queue response

- [x] **TODO-4.6.1**: Cập nhật `getQueue()` trong review.service.ts để trả `currentPathStageId`
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: Đọc đoạn xử lý `if (query.userPathId)` (dòng ~58–85) và `return { items, pathTitle }` (dòng ~101)
  - **Thay đổi**:
    1. Trong block `if (userPath)`, thêm đoạn tìm `currentPathStageId`:
    ```typescript
    // Find the pathStageId of the current active stage
    let currentPathStageId: string | undefined;
    const currentStage = userPath.userStages.find(
      (us) => us.isUnlocked && !us.isCompleted,
    );
    currentPathStageId = currentStage?.pathStage.id;
    ```
    2. Cập nhật `return` ở cuối method:
    ```typescript
    return { items, pathTitle, currentPathStageId };
    ```
  - **Verify**: `npm run build` pass; API `GET /review/queue?userPathId=...` trả thêm `currentPathStageId`
  - **Kết quả**: Frontend có thể đọc `currentPathStageId` từ review queue response

---

### Phase 5: Frontend — API Client & i18n & Route

- [x] **TODO-5.1**: Cập nhật `pathApi` trong api/client.ts thêm `getStageDialogue()`
  - **File**: `apps/frontend/src/api/client.ts`
  - **Context**: Đọc `pathApi` object hiện tại (dòng ~163–170)
  - **Thay đổi**: Thêm method vào `pathApi`:
    ```typescript
    getStageDialogue: (pathStageId: string) =>
      apiClient.get(`/paths/stages/${pathStageId}/dialogue`).then((r) => r.data as StageDialogueDto),
    ```
    Và thêm interface trước `pathApi`:
    ```typescript
    export interface DialogueLine {
      speaker: 'A' | 'B';
      text: string;
      translation: string;
      vocabTerms: string[];
    }

    export interface StageDialogueDto {
      pathStageId: string;
      stageTitle: string;
      targetLanguageCode: string;
      lines: DialogueLine[];
    }
    ```
  - **Verify**: `cd apps/frontend && npm run build` — TypeScript pass
  - **Kết quả**: `pathApi.getStageDialogue()` typed và ready

- [x] **TODO-5.2**: Cập nhật `ReviewQueueResponse` interface trong api/client.ts
  - **File**: `apps/frontend/src/api/client.ts`
  - **Context**: Đọc `ReviewQueueResponse` interface (dòng ~110–113)
  - **Thay đổi**: Thêm optional field:
    ```typescript
    export interface ReviewQueueResponse {
      items: unknown[];
      pathTitle?: string;
      currentPathStageId?: string;  // ← thêm
    }
    ```
  - **Verify**: `npm run build` pass (frontend)
  - **Kết quả**: `response.currentPathStageId` typed trong ReviewPage

- [x] **TODO-5.3**: Thêm i18n keys cho dialogue vào `en.json`
  - **File**: `apps/frontend/src/i18n/locales/en.json`
  - **Context**: Đọc cấu trúc file JSON hiện tại để biết vị trí (cuối file trước `}`)
  - **Thay đổi**: Thêm vào cuối JSON trước dấu `}` ngoài cùng:
    ```json
    "dialogue": {
      "title": "Stage Dialogue",
      "playAll": "▶ Play All",
      "pause": "⏸ Pause",
      "showTranslation": "Show translation",
      "hideTranslation": "Hide",
      "speakerA": "A",
      "speakerB": "B",
      "back": "Back",
      "noDialogue": "Dialogue not available for this stage",
      "loading": "Loading dialogue…"
    },
    "review": {
      "viewDialogue": "View Dialogue",
      "reviewAgainBtn": "Study Again"
    }
    ```
    > **Lưu ý**: Chỉ thêm `dialogue` key mới và `review.viewDialogue` / `review.reviewAgainBtn` nếu chưa có. Không xóa các keys hiện có trong `review`.
  - **Verify**: JSON valid (no syntax error)
  - **Kết quả**: English keys sẵn sàng

- [x] **TODO-5.4**: Thêm i18n keys tương đương vào `vi.json`
  - **File**: `apps/frontend/src/i18n/locales/vi.json`
  - **Context**: Đọc cấu trúc `vi.json` để khớp vị trí
  - **Thay đổi**: Thêm cùng vị trí:
    ```json
    "dialogue": {
      "title": "Hội thoại Stage",
      "playAll": "▶ Phát tất cả",
      "pause": "⏸ Tạm dừng",
      "showTranslation": "Xem bản dịch",
      "hideTranslation": "Ẩn",
      "speakerA": "A",
      "speakerB": "B",
      "back": "Quay lại",
      "noDialogue": "Stage này chưa có hội thoại",
      "loading": "Đang tải hội thoại…"
    },
    "review": {
      "viewDialogue": "Xem hội thoại",
      "reviewAgainBtn": "Ôn lại"
    }
    ```
    > Chỉ thêm keys mới, không ghi đè keys `review` hiện tại.
  - **Verify**: JSON valid
  - **Kết quả**: Vietnamese keys sẵn sàng

- [x] **TODO-5.5**: Thêm i18n keys tương đương vào `pt.json`
  - **File**: `apps/frontend/src/i18n/locales/pt.json`
  - **Context**: Đọc cấu trúc `pt.json`
  - **Thay đổi**: Thêm:
    ```json
    "dialogue": {
      "title": "Diálogo do Estágio",
      "playAll": "▶ Reproduzir Tudo",
      "pause": "⏸ Pausar",
      "showTranslation": "Ver tradução",
      "hideTranslation": "Ocultar",
      "speakerA": "A",
      "speakerB": "B",
      "back": "Voltar",
      "noDialogue": "Diálogo não disponível para este estágio",
      "loading": "Carregando diálogo…"
    },
    "review": {
      "viewDialogue": "Ver Diálogo",
      "reviewAgainBtn": "Estudar Novamente"
    }
    ```
  - **Verify**: JSON valid
  - **Kết quả**: Portuguese keys sẵn sàng

- [x] **TODO-5.6**: Thêm route `/dialogue/:pathStageId` vào App.tsx
  - **File**: `apps/frontend/src/App.tsx`
  - **Context**: Đọc file hiện tại — danh sách Routes trong `<RequireAuth>` block (dòng ~30–43)
  - **Thay đổi**:
    1. Thêm import ở đầu file: `import DialoguePage from '@/pages/DialoguePage';`
    2. Thêm route trong `<RequireAuth>` block:
    ```tsx
    <Route path="dialogue/:pathStageId" element={<DialoguePage />} />
    ```
  - **Verify**: `npm run build` pass (DialoguePage phải đã tồn tại ở TODO-6.5.1)
  - **Kết quả**: Route `/dialogue/:pathStageId` hoạt động

---

### Phase 6: Frontend Components

#### REQ-05: Tạo `DialoguePage.tsx`

- [x] **TODO-6.5.1**: Tạo file `DialoguePage.tsx` với đầy đủ TTS và highlight logic
  - **File**: `apps/frontend/src/pages/DialoguePage.tsx`
  - **Context**: Đọc `ReviewPage.tsx` để hiểu AppShell pattern; đọc `StageDialogueDto` interface trong `api/client.ts`
  - **Thay đổi**: Tạo mới file với:
    - `useParams<{ pathStageId: string }>()` để lấy `pathStageId`
    - `useEffect` fetch `pathApi.getStageDialogue(pathStageId)` → lưu vào state
    - State: `lines: DialogueLine[]`, `activeLineIdx: number | null`, `activeWordIdx: number | null`, `isPlaying: boolean`, `showTranslation: Set<number>` (per-line toggle)
    - Mỗi `DialogueLine` render thành bubble:
      - `speaker === 'A'` → bubble trái (màu slate)
      - `speaker === 'B'` → bubble phải (màu indigo gradient)
      - `text` được split thành words, mỗi word là `<span>` — vocab terms được highlight màu accent khi `isPlaying && word ∈ vocabTerms` (case-insensitive match)
      - Active line (đang được đọc): background highlighted
      - Nút 👁 per line → toggle dòng dịch
    - TTS play-all logic:
      ```typescript
      const playAll = () => {
        window.speechSynthesis.cancel();
        let idx = 0;
        const playLine = (i: number) => {
          if (i >= lines.length) { setIsPlaying(false); setActiveLineIdx(null); return; }
          setActiveLineIdx(i);
          const utter = new SpeechSynthesisUtterance(lines[i].text);
          utter.lang = targetLanguageCode;
          utter.onboundary = (e) => {
            if (e.name === 'word') {
              const wordIdx = getWordIndexAtChar(lines[i].text, e.charIndex);
              setActiveWordIdx(wordIdx);
            }
          };
          utter.onend = () => playLine(i + 1);
          window.speechSynthesis.speak(utter);
        };
        setIsPlaying(true);
        playLine(0);
      };
      ```
    - `useEffect` cleanup: `return () => window.speechSynthesis.cancel()`
    - Thanh control: nút ▶ / ⏸ toggle `playAll` / `speechSynthesis.cancel()`
    - Helper `getWordIndexAtChar(text, charIndex)`: đếm số khoảng trắng trước `charIndex`
  - **Verify**: `npm run build` pass; navigation `/dialogue/:id` render không crash
  - **Kết quả**: `DialoguePage` hoàn chỉnh, sẵn sàng test với data thật

#### REQ-06: Cập nhật `ReviewPage.tsx` — nút View Dialogue

- [x] **TODO-6.6.1**: Lưu `currentPathStageId` từ queue response vào state trong ReviewPage
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: Đọc `loadQueue()` callback (dòng ~99–113): `const response = await reviewApi.getQueue(params)`
  - **Thay đổi**:
    1. Thêm state: `const [currentPathStageId, setCurrentPathStageId] = useState<string | undefined>();`
    2. Trong `loadQueue()`, sau `setPathTitle(response.pathTitle)`, thêm:
    ```typescript
    setCurrentPathStageId(response.currentPathStageId);
    ```
  - **Verify**: `npm run build` pass
  - **Kết quả**: `currentPathStageId` được track sau mỗi lần load queue

- [x] **TODO-6.6.2**: Thay "Review again" bằng "Xem hội thoại" + "Ôn lại" trong phase `done`
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: Đọc đoạn `if (phase === 'done')` (dòng ~214–240) — nút "Review again" và "Back to Roadmap"
  - **Thay đổi**: Thay nút "Review again" bằng 2 nút có điều kiện:
    ```tsx
    {currentPathStageId ? (
      <button
        onClick={() => navigate(`/dialogue/${currentPathStageId}`)}
        className="mt-8 bg-gradient-to-r from-[#6366F1] to-[#A78BFA] text-white px-8 py-3 rounded-2xl font-medium"
      >
        {t('review.viewDialogue')}
      </button>
    ) : null}
    <button
      onClick={loadQueue}
      className={`${currentPathStageId ? 'mt-3' : 'mt-8'} w-full rounded-xl px-4 py-3 text-sm font-medium text-[#94A3B8]`}
      style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
    >
      {t('review.reviewAgainBtn')}
    </button>
    ```
  - **Verify**: `npm run build` pass; khi `currentPathStageId` undefined → nút dialogue ẩn, nút "Ôn lại" vẫn hiện
  - **Kết quả**: UX post-review đúng spec: dialogue primary, study again secondary

#### REQ-07: Cập nhật `StageRow.tsx` — nút 💬 dialogue

- [x] **TODO-6.7.1**: Cập nhật `PathStageDto` interface trong StageRow.tsx thêm 2 fields mới
  - **File**: `apps/frontend/src/components/roadmap/StageRow.tsx`
  - **Context**: Đọc `PathStageDto` interface (dòng ~4–23) trong file này (frontend có interface riêng)
  - **Thay đổi**: Thêm 2 fields vào `PathStageDto`:
    ```typescript
    pathStageId: string;
    hasDialogue: boolean;
    ```
  - **Verify**: `npm run build` — TypeScript sẽ không báo lỗi nếu backend đã trả đúng fields
  - **Kết quả**: Interface sync với backend DTO

- [x] **TODO-6.7.2**: Thêm nút 💬 dialogue vào StageRow khi `isUnlocked && hasDialogue`
  - **File**: `apps/frontend/src/components/roadmap/StageRow.tsx`
  - **Context**: Đọc đoạn `{stage.isUnlocked && !stage.isCompleted && (...)}` (dòng ~120–140) — khu vực buttons "Học tiếp" và "Hoàn thành stage"
  - **Thay đổi**: Thêm nút sau nút `canComplete` (bên trong `div className="mt-2 flex gap-2"`):
    ```tsx
    {stage.hasDialogue && (
      <button
        onClick={() => navigate(`/dialogue/${stage.pathStageId}`)}
        className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-90"
        style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}
        title="Xem hội thoại"
      >
        💬
      </button>
    )}
    ```
    Nút cũng cần hiện ở `stage.isCompleted` state — thêm tương tự trong block `{stage.isCompleted && (...)}`:
    ```tsx
    {stage.hasDialogue && (
      <button
        onClick={() => navigate(`/dialogue/${stage.pathStageId}`)}
        className="mt-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all hover:opacity-90"
        style={{ background: 'rgba(139,92,246,0.15)', color: '#A78BFA', border: '1px solid rgba(139,92,246,0.3)' }}
      >
        💬 {t('dialogue.title')}
      </button>
    )}
    ```
  - **Verify**: `npm run build` pass; StageRow hiển thị nút 💬 khi `isUnlocked && hasDialogue`
  - **Kết quả**: User có thể vào dialogue từ Roadmap page

---

### Phase 7: Integration & Verification

- [x] **TODO-7.1**: Build backend và verify không có lỗi TypeScript
  - **Thay đổi**: Chạy `cd apps/backend && npm run build`
  - **Verify**: Build thành công, 0 errors
  - **Kết quả**: Backend artifact sẵn sàng

- [x] **TODO-7.2**: Build frontend và verify không có lỗi TypeScript
  - **Thay đổi**: Chạy `cd apps/frontend && npm run build`
  - **Verify**: Build thành công, 0 errors/warnings liên quan code mới
  - **Kết quả**: Frontend bundle sẵn sàng

- [x] **TODO-7.3**: Smoke test — tạo path mới và verify dialogue được sinh
  - **Thay đổi**: Chạy backend + frontend dev, tạo 1 learning path qua UI
  - **Verify**:
    - DB: `SELECT * FROM path_stage_dialogues` có rows sau khi tạo path
    - API: `GET /paths/stages/:pathStageId/dialogue` trả JSON hợp lệ
    - UI: `StageRow` hiển thị nút 💬 cho stage đã unlock có dialogue
  - **Kết quả**: End-to-end flow hoạt động

- [x] **TODO-7.4**: Smoke test — review stage và verify dialogue button xuất hiện
  - **Thay đổi**: Review hết các từ trong stage 1 của path vừa tạo
  - **Verify**:
    - `ReviewPage` phase `done`: nút "Xem hội thoại" xuất hiện (nếu `currentPathStageId` có)
    - Click → navigate đúng `/dialogue/:pathStageId`
    - `DialoguePage` load và hiển thị hội thoại
  - **Kết quả**: User flow hoàn chỉnh từ review → dialogue

- [x] **TODO-7.5**: Smoke test — TTS trong DialoguePage
  - **Thay đổi**: Trên DialoguePage, ấn nút ▶ Play All (dùng Chrome/Edge)
  - **Verify**:
    - TTS đọc từng line theo thứ tự
    - Active line được highlight
    - Vocab terms trong line đang đọc được highlight màu accent (Chrome `onboundary` support)
    - Nút toggle dịch nghĩa hoạt động per-line
    - Navigate away → audio dừng (cleanup)
  - **Kết quả**: DialoguePage hoạt động đúng spec

---

## Ghi chú triển khai

- `PathStageDto.id` vẫn giữ nguyên là `UserPathStage.id` (dùng cho `completeStage` endpoint) — `pathStageId` là field **mới thêm** riêng biệt, không phá vỡ API hiện có
- `DialoguePage` dùng `window.speechSynthesis` — không cần npm package, nhưng cần `lang` code chuẩn BCP-47 (e.g. `ja-JP`, `en-US`). Hiện tại `targetLanguageCode` là 2-char code (e.g. `ja`) — đủ để Web Speech API nhận nhưng quality thấp hơn; có thể map sang full locale nếu cần
- `onboundary` chỉ hỗ trợ trên Chrome/Edge — Safari và Firefox sẽ fall back sang line-level highlight (active bubble highlight). Không cần polyfill, chỉ cần `utter.onboundary` không crash khi không được gọi
- Nếu muốn dialogue button hiển thị cho **stage đã completed**, logic ở TODO-6.7.2 đã cover cả case này (thêm nút vào completed state block)
- Prisma `lines` column type là `Json` — khi đọc ra, phải cast `as DialogueLineDto[]` (no runtime validation); nếu muốn thêm validation, thêm Zod parse trong `getStageDialogue()`

## Rủi ro cần theo dõi

- [ ] Risk-1: `createFromAI()` có thể timeout ở client nếu sinh dialogue cho 7 stages × ~5s = 35s — **Biện pháp**: Frontend UX hiển thị "Đang tạo path..." toast không đóng cho đến khi API trả về; hoặc tách dialogue generation sang background job sau này
- [ ] Risk-2: Gemini `onboundary` không fire với một số browser → word highlight không hoạt động — **Biện pháp**: Code đã có fallback line-level highlight (active bubble); không crash
- [ ] Risk-3: `pathStageId` có thể không được truyền đúng trong `mapToPathDto()` khi unenrolled user (chỉ xem path, không phải user path) — **Biện pháp**: Hiện `getPathById` chỉ gọi cho enrolled users (`userPath.findFirstOrThrow`), nên `stage.id` luôn available
- [ ] Risk-4: i18n keys `review.viewDialogue` và `review.reviewAgainBtn` có thể conflict với key `review.reviewAgain` hiện có — **Biện pháp**: TODO-5.3/5.4/5.5 thêm keys mới, không xóa key cũ; `review.reviewAgain` vẫn giữ nguyên cho non-path review mode

---

## TÓM TẮT TRIỂN KHAI

**Ngày hoàn thành**: 2025-03-03  
**Trạng thái**: ✅ Hoàn thành toàn bộ 24 TODOs, 2 builds pass

### Những thay đổi đã thực hiện

#### Backend

| File | Thay đổi |
|------|---------|
| `prisma/schema.prisma` | Thêm model `PathStageDialogue` + back-relation `dialogue PathStageDialogue?` vào `PathStage` |
| `prisma/migrations/20260303123939_add_stage_dialogues/` | Migration tạo bảng `path_stage_dialogues` (id, path_stage_id FK unique, lines Json, created_at) |
| `src/modules/ai/ai.service.ts` | Thêm `DialogueLine` interface (exported), `DialogueLineSchema`/`DialogueSchema` Zod, method `generateStageDialogue()` |
| `src/modules/paths/dto/paths.dto.ts` | Thêm `pathStageId: string` + `hasDialogue: boolean` vào `PathStageDto`; thêm `DialogueLineDto` + `StageDialogueDto` |
| `src/modules/paths/paths.service.ts` | Thêm `dialogue: true` include; cập nhật `mapToPathDto()`; thêm `getStageDialogue()`; tạo dialogue cho tất cả stage trong `createFromAI()` (Promise.all, fail-safe) |
| `src/modules/paths/paths.controller.ts` | Thêm `GET stages/:pathStageId/dialogue` endpoint |
| `src/modules/review/review.service.ts` | Thêm `currentPathStageId` (stage đang active) vào response của `getQueue()` |

#### Frontend

| File | Thay đổi |
|------|---------|
| `src/api/client.ts` | Thêm interfaces `DialogueLine`, `StageDialogueDto`; thêm `currentPathStageId?` vào `ReviewQueueResponse`; thêm `pathApi.getStageDialogue()` |
| `src/i18n/locales/en.json` | Thêm `review.viewDialogue`, `review.studyAgain`; thêm namespace `dialogue.*` (13 keys) |
| `src/i18n/locales/vi.json` | Dịch tương tự |
| `src/i18n/locales/pt.json` | Dịch tương tự |
| `src/App.tsx` | Import `DialoguePage` + route `/dialogue/:pathStageId` |
| `src/pages/DialoguePage.tsx` | **MỚI**: Bubble-chat layout, TTS Web Speech API, word-boundary highlight với fallback vocab-term highlight, per-line toggle dịch nghĩa, Play All / Stop |
| `src/pages/ReviewPage.tsx` | Thêm `currentPathStageId` state; màn hình "done" thay "Review again" bằng "View Dialogue" (primary) + "Study Again" (secondary) khi có dialogue |
| `src/components/roadmap/StageRow.tsx` | Thêm `pathStageId` + `hasDialogue` vào `PathStageDto` interface; thêm nút 💬 cho cả `isUnlocked && hasDialogue` và `isCompleted && hasDialogue` |

### Quyết định kỹ thuật

- **Cast `dialogue.lines`**: Prisma trả về `Json` → cast `as unknown as DialogueLineDto[]` (no runtime validation ở layer đọc; Zod validate khi AI ghi)
- **TTS word highlight**: `SpeechSynthesisUtterance.onboundary` (Chrome/Edge); fallback tự động sang vocab-term highlight khi `onboundary` không fire (Safari/Firefox)
- **Dialogue generation**: `Promise.all()` trong `createFromAI()` sau khi enroll, mỗi stage wrap trong try/catch — lỗi AI không phá vỡ việc tạo path
- **`pathStageId` vs `id` trong StageRow**: `id` = `UserPathStage.id` (dùng cho `completeStage`); `pathStageId` = `PathStage.id` (dùng cho dialogue API) — hai trường riêng biệt, không breaking change
- **`currentPathStageId`**: Lấy từ `userStages[0].pathStage.id` (query đã filter `isUnlocked: true, isCompleted: false`) — không cần thêm include mới vào review query

### Build verification

- ✅ `npm run build --workspace=apps/backend` — 0 errors
- ✅ `npm run build --workspace=apps/frontend` — 0 errors (Vite bundle 541KB)
