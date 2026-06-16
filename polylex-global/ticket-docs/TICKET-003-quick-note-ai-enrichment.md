# TICKET-003 — Bảng Ghi Chú Nhanh + AI Tự Động Dịch & Phân Tích Từ

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-003 |
| **Tạo ngày** | 2026-02-27 |
| **Trạng thái** | ✅ HOÀN THÀNH |

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-003 |
| **Tiêu đề** | Bảng Ghi Chú Nhanh + AI Tự Động Dịch & Phân Tích Từ |
| **Mục tiêu** | Người dùng nhập từ mới vào một bảng đơn giản, backend lưu lại trạng thái PENDING rồi dùng **Gemini** để tự động dịch nghĩa, xác định phiên âm, loại từ, mức CEFR, câu ví dụ — sau đó lưu vào bảng `vocabulary_base` + `vocabulary_translations` để sử dụng như từ vựng thông thường |
| **Phạm vi** | DB (model mới `QuickNote`), REST API (module `quick-note`), AI Service (method mới), Frontend (trang/panel mới), Background Job (Bull Queue + Redis) |
| **Độ ưu tiên** | Cao |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Prisma model `QuickNote` | Thêm bảng `quick_notes` lưu từ đầu vào, ngôn ngữ nguồn, ngôn ngữ dịch mục tiêu, trạng thái xử lý (PENDING/PROCESSING/DONE/ERROR), liên kết tới `vocabulary_base` sau khi hoàn thành | DB | Nhỏ |
| REQ-02 | NestJS module `quick-note` | Tạo `QuickNoteModule` với Controller + Service + DTOs. API: `POST /quick-notes`, `GET /quick-notes` (list theo user), `DELETE /quick-notes/:id` | REST | Trung bình |
| REQ-03 | AI enrichment method | Thêm method `enrichWord()` vào `AiService`: nhận `{term, sourceLang, targetLang}`, trả về JSON `{phonetic, cefrLevel, partOfSpeech, definition, exampleSentence, translation}` qua **Gemini** `gemini-2.0-flash` với JSON structured output | AI | Trung bình |
| REQ-04 | Background job (Bull Queue) | Sau khi lưu `QuickNote` với trạng thái PENDING, đẩy job vào `quick-note-enrichment` queue. Worker gọi `AiService.enrichWord()`, tạo `VocabularyBase` + `VocabularyTranslation`, cập nhật `QuickNote.status = DONE` và gắn `vocabularyBaseId` | Queue | Lớn |
| REQ-05 | Frontend: Bảng ghi chú nhanh | Trang/panel mới hiển thị danh sách quick notes dạng bảng: nhập từ + chọn ngôn ngữ nguồn/đích → submit → hiển thị hàng với spinner PENDING → polling/refetch → khi DONE hiển thị link sang trang từ vựng; khi ERROR hiển thị badge đỏ | Frontend | Trung bình |

#### Mối quan hệ phụ thuộc

```
REQ-01 (DB model)
  └──> REQ-02 (API module)
         └──> REQ-04 (Bull Queue worker)
                └──> sử dụng REQ-03 (AI enrichment)
                └──> ghi vào vocabulary_base / vocabulary_translations

REQ-05 (Frontend) phụ thuộc REQ-02 (API endpoints tồn tại)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Prisma model `QuickNote`
- **Mục tiêu**: Lưu trữ từ người dùng nhập kèm trạng thái xử lý AI và liên kết tới từ vựng đã được enriched
- **Đầu vào**: `term` (string), `sourceLanguageCode` (string), `targetLanguageCode` (string, ngôn ngữ để dịch về), `userId`
- **Đầu ra mong đợi**: Record trong bảng `quick_notes` với `status = PENDING`
- **Tiêu chí hoàn thành**: Migration chạy thành công, Prisma Client tái sinh, kiểu TypeScript available
- **Schema đề xuất**:
  ```prisma
  model QuickNote {
    id                 String    @id @default(uuid())
    userId             String    @map("user_id")
    term               String
    sourceLanguageCode String    @map("source_language_code")
    targetLanguageCode String    @map("target_language_code")
    status             QuickNoteStatus @default(PENDING)
    errorMessage       String?   @map("error_message")
    vocabularyBaseId   String?   @map("vocabulary_base_id")
    createdAt          DateTime  @default(now()) @map("created_at")
    updatedAt          DateTime  @updatedAt @map("updated_at")

    user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
    vocabularyBase VocabularyBase? @relation(fields: [vocabularyBaseId], references: [id], onDelete: SetNull)

    @@index([userId, status])
    @@index([userId, createdAt(sort: Desc)])
    @@map("quick_notes")
  }

  enum QuickNoteStatus {
    PENDING
    PROCESSING
    DONE
    ERROR
  }
  ```
- **Phụ thuộc**: Không

##### REQ-02: NestJS module `quick-note`
- **Mục tiêu**: Cung cấp REST API cho frontend thêm/xem/xoá quick notes
- **Đầu vào**: `POST /quick-notes` body `{ term, sourceLanguageCode, targetLanguageCode }`; `GET /quick-notes?page&limit`; `DELETE /quick-notes/:id`
- **Đầu ra mong đợi**: 
  - POST → 201 `QuickNoteDto` (status PENDING)
  - GET → paginated list `QuickNoteDto[]`
  - DELETE → 204
- **Tiêu chí hoàn thành**: Swagger docs hiển thị 3 endpoints, unit test coverage cơ bản
- **Phụ thuộc**: REQ-01

##### REQ-03: AI enrichment method `enrichWord()`
- **Mục tiêu**: Gọi **Gemini** một lần để lấy đầy đủ metadata cho từ: phiên âm, loại từ, mức CEFR, nghĩa, ví dụ, bản dịch
- **Đầu vào**: `{ term: string, sourceLang: string, targetLang: string }`
- **Đầu ra mong đợi**: `EnrichedWordResult` object (typed interface)
  ```typescript
  interface EnrichedWordResult {
    phonetic?: string;
    cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
    partOfSpeech?: string;
    exampleSentence?: string;
    translation: string;       // required — bản dịch sang targetLang
    definition?: string;       // định nghĩa trong targetLang
    exampleTranslation?: string;
  }
  ```
- **Prompt strategy**: Sử dụng system prompt yêu cầu JSON response. Với Gemini dùng `generationConfig: { responseMimeType: 'application/json' }` để ép trả về JSON thuần, fallback nếu Gemini disabled → throw `ServiceUnavailableException`
- **Model**: `gemini-2.0-flash` (nhanh, rẻ, hỗ trợ JSON mode)
- **Package**: `@google/generative-ai` (SDK chính thức của Google)
- **Tiêu chí hoàn thành**: Method trả về đúng shape, có error handling nếu JSON parse thất bại
- **Phụ thuộc**: Không (sử dụng `AiService` có sẵn)

##### REQ-04: Background Job (Bull Queue)
- **Mục tiêu**: Xử lý enrichment bất đồng bộ — không block HTTP request, cập nhật trạng thái QuickNote sau khi hoàn thành
- **Đầu vào**: Job payload `{ quickNoteId: string }`
- **Đầu ra mong đợi**:
  - Load `QuickNote` → gọi `AiService.enrichWord()` → tạo/upsert `VocabularyBase` + `VocabularyTranslation` → cập nhật `QuickNote.status = DONE, vocabularyBaseId = <id>` + tự động `addToUserList`
  - Nếu lỗi: `QuickNote.status = ERROR, errorMessage = err.message`
- **Tiêu chí hoàn thành**: Queue worker xử lý job, trạng thái QuickNote thay đổi trong DB, từ xuất hiện trong danh sách vocabulary của user
- **Module**: `BullModule.registerQueue({ name: 'quick-note-enrichment' })` trong `QuickNoteModule`
- **Phụ thuộc**: REQ-01, REQ-02, REQ-03

##### REQ-05: Frontend bảng ghi chú nhanh
- **Mục tiêu**: UI đơn giản, trực quan — nhập từ → thấy trạng thái xử lý → khi xong thấy link tới từ vựng
- **Đầu vào**: Form inline trong bảng: `term` (text input), `sourceLanguageCode` (select), `targetLanguageCode` (select) + nút "Add"
- **Đầu ra mong đợi**:
  - Hàng mới xuất hiện với badge "⏳ Processing"
  - Polling mỗi 3–5s cho các rows có status PENDING/PROCESSING
  - Khi DONE: badge "✅ Done" + link "View" tới VocabularyPage filtered by id
  - Khi ERROR: badge "❌ Error" + tooltip message
- **Route**: `/quick-notes` hoặc panel trên VocabularyPage (khuyến nghị trang riêng)
- **Tiêu chí hoàn thành**: User nhập từ, sau 5–10s thấy từ chuyển trạng thái DONE
- **Phụ thuộc**: REQ-02

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng nghiệp vụ**: Người dùng thường xuyên gặp từ mới và muốn lưu nhanh mà không cần điền form đầy đủ như `AddWordModal`. Quick note là "fast lane" — chỉ cần từ + ngôn ngữ, AI lo phần còn lại.
- **Thực thể domain liên quan**: `QuickNote` (mới) → `VocabularyBase` → `VocabularyTranslation` → `UserVocabulary` (auto-added)
- **Quy tắc nghiệp vụ**:
  - Mỗi note thuộc về 1 user, không chia sẻ
  - Nếu từ đã tồn tại trong `vocabulary_base` (unique constraint `term + languageId + orgId`), worker dùng existing vocab thay vì tạo mới (upsert pattern)
  - AI enrichment bất đồng bộ để tránh timeout HTTP (Gemini Flash thường tốn 2–6s)
  - Từ sau khi enriched tự động được thêm vào `UserVocabulary` của user (như `addToMyList`)
- **Hành vi hiện có cần bảo toàn**: `AddWordModal` vẫn hoạt động độc lập; Quick Note không thay thế mà bổ sung thêm luồng thêm từ

---

### 4. Ngữ cảnh kỹ thuật

#### Triển khai hiện tại
- `AiService` tại `apps/backend/src/modules/ai/ai.service.ts`:
  - `generateContextSentence()` — tạo câu ví dụ
  - `generateMemoryHint()` — tạo gợi ý nhớ
  - Dùng `gpt-4o-mini`, pattern `ensureEnabled()` tốt, cần thêm `enrichWord()`
- `VocabularyService` tại `apps/backend/src/modules/vocabulary/vocabulary.service.ts`:
  - `create()` — tạo `VocabularyBase`, throw `ConflictException` nếu duplicate
  - `addTranslation()` — upsert `VocabularyTranslation`
  - `addToMyList()` — thêm vào `UserVocabulary` (endpoint `POST /vocabulary/:id/add-to-my-list`)
- **Redis/Bull**: `REDIS_URL` đã có trong `.env`; `@nestjs/bull` chưa được cài nhưng Redis đang chạy
- **Prisma schema**: `apps/backend/prisma/schema.prisma` — cần thêm `QuickNote` model + `QuickNoteStatus` enum

#### File/module bị ảnh hưởng
| File | Thay đổi |
|------|---------|
| `apps/backend/prisma/schema.prisma` | Thêm `QuickNote` model, `QuickNoteStatus` enum |
| `apps/backend/prisma/migrations/` | Migration mới |
| `apps/backend/src/modules/ai/ai.service.ts` | Refactor sang Gemini SDK + thêm `enrichWord()` method + `EnrichedWordResult` interface |
| `apps/backend/src/modules/quick-note/` | **Tạo mới** (module/controller/service/dto/processor) |
| `apps/backend/src/app.module.ts` | Import `QuickNoteModule`, `BullModule.forRoot` |
| `apps/backend/package.json` | Thêm `@nestjs/bull`, `bull`, `@google/generative-ai`; xoá `openai` |
| `apps/backend/.env` | Đổi `OPENAI_ENABLED`→`GEMINI_ENABLED`, `OPENAI_API_KEY`→`GEMINI_API_KEY` |
| `apps/frontend/src/pages/QuickNotePage.tsx` | **Tạo mới** |
| `apps/frontend/src/api/client.ts` | Thêm `quickNoteApi` |
| `apps/frontend/src/App.tsx` / router | Thêm route `/quick-notes` |

#### Bảng database liên quan
- `quick_notes` (mới)
- `vocabulary_base` (đọc/ghi)
- `vocabulary_translations` (ghi)
- `user_vocabulary` (ghi — auto add)
- `languages` (đọc — validate language codes)

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| Không có bảng `quick_notes` trong DB | Bảng `quick_notes` với enum status | Thêm Prisma model + migration |
| `AiService` dùng `openai` SDK, không có `enrichWord()` | Dùng `@google/generative-ai` + `enrichWord()` | Refactor AiService sang Gemini + thêm method |
| `OPENAI_ENABLED` / `OPENAI_API_KEY` trong `.env` | `GEMINI_ENABLED` / `GEMINI_API_KEY` | Đổi tên env vars + update ConfigService |
| Không có `@nestjs/bull` | Bull Queue worker chạy enrichment bất đồng bộ | Install `@nestjs/bull` + `bull` + tạo processor |
| Không có module `quick-note` | `QuickNoteModule` với 3 endpoints | Tạo toàn bộ NestJS module |
| Frontend chỉ có `AddWordModal` | Trang `/quick-notes` với bảng + polling | Tạo `QuickNotePage` + API client |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [x] **Duplicate từ vựng**: Nếu user nhập từ đã tồn tại trong `vocabulary_base` → `VocabularyService.create()` throw `ConflictException`. Worker phải bắt lỗi này và dùng existing vocab thay vì fail — **Biện pháp**: try/catch trong worker, query existing vocab nếu 409
- [x] **Gemini disabled**: `GEMINI_ENABLED=false` trong `.env` hiện tại → tất cả quick notes bị kẹt PENDING — **Biện pháp**: Kiểm tra flag trước khi enqueue, trả lỗi 503 với message rõ ràng; hoặc fallback mode (chỉ lưu term mà không enrich)

#### 6.2 Rủi ro kỹ thuật
- [x] **Timeout Gemini**: `gemini-2.0-flash` thường tốn 2–6s — nếu xử lý đồng bộ trong HTTP request vẫn đủ tốt, nhưng Bull Queue tốt hơn để tránh HTTP timeout và retry tự động — **Biện pháp**: Bull Queue bất đồng bộ, HTTP trả ngay 201 PENDING ✅
- [x] **Bull Queue chưa có trong project**: `@nestjs/bull` + `bull` chưa install — **Biện pháp**: `npm install @nestjs/bull bull @google/generative-ai` + `BullModule.forRoot` với `REDIS_URL`
- [x] **Race condition voter**: Nhiều jobs cùng tạo `VocabularyBase` cho cùng 1 term+language — **Biện pháp**: Bắt `ConflictException` trong worker + upsert pattern, wrap trong transaction/retry
- [x] **Polling frontend gây load**: Polling mỗi 3s cho nhiều rows PENDING — **Biện pháp**: Chỉ poll khi có ít nhất 1 row PENDING; dừng poll khi tất cả DONE/ERROR; limit `limit=20` trong query

#### 6.3 Lỗi logic tiềm ẩn
- [x] **Worker crash giữa chừng**: Job xử lý được Gemini nhưng crash khi ghi DB → status mãi là PROCESSING — **Biện pháp**: Bull `attempts: 3` + `backoff` exponential; reset PROCESSING → PENDING khi restart
- [x] **Language code không hợp lệ**: User chọn ngôn ngữ không tồn tại trong DB → `findUniqueOrThrow` throw trong worker → status ERROR — **Biện pháp**: Validate language codes trong DTO của `POST /quick-notes` trước khi enqueue
- [x] **JSON parse thất bại từ Gemini**: Dù dùng `responseMimeType: 'application/json'`, Gemini đôi khi thêm markdown wrapper — **Biện pháp**: Strip ```json ... ``` nếu có + try/catch parse + fallback minimal result

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| UX đơn giản — chỉ nhập từ, không cần form phức tạp | Phụ thuộc Gemini — yêu cầu API key (Google AI Studio — có free tier) |
| Gemini 2.0 Flash nhanh hơn và rẻ hơn GPT-4o-mini | Cần cài thêm `@nestjs/bull` + cấu hình Bull |
| `@google/generative-ai` SDK nhẹ, ít dependency hơn `openai` | Từ enriched có thể không chính xác 100% (hallucination) |
| Gemini có free tier (60 req/phút) — tốt cho dev/test | AiService cần refactor (đổi SDK) ảnh hưởng các method hiện có |
| Từ enriched tự động vào list học của user | Polling frontend không real-time bằng WebSocket |
| Fallback graceful khi GEMINI_ENABLED=false | Cần migration DB mới |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Bull Queue bất đồng bộ với `@nestjs/bull` + Redis có sẵn. Dùng **Gemini 2.0 Flash** (`@google/generative-ai`) thay vì OpenAI. Worker xử lý enrichment, cập nhật `QuickNote.status`. Frontend polling đơn giản với interval 4s khi có rows PENDING.

- **Gemini SDK integration**:
  ```typescript
  import { GoogleGenerativeAI } from '@google/generative-ai';
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json' },
  });
  const result = await model.generateContent(prompt);
  const json = JSON.parse(result.response.text());
  ```

- **Fallback mode** (nếu GEMINI_ENABLED=false): Chấp nhận quick note nhưng lưu với `status = ERROR` và `errorMessage = "AI not enabled"` hoặc block ở frontend với thông báo rõ ràng.

- **Các cách tiếp cận thay thế**:
  - *Đồng bộ*: Gọi Gemini trong request handler — Gemini Flash đủ nhanh (~2–4s), nhưng vẫn nên dùng Queue để retry
  - *WebSocket push*: Thay polling bằng Socket.IO emit khi job hoàn thành — tốt hơn nhưng phức tạp hơn
  - *Giữ OpenAI*: Nếu sau này muốn quay lại OpenAI, chỉ cần đổi SDK/model trong AiService

- **Phụ thuộc bên ngoài**: `@nestjs/bull`, `bull`, `@google/generative-ai`; `GEMINI_API_KEY` lấy miễn phí tại [aistudio.google.com](https://aistudio.google.com)

- **Ước tính công sức**:
  - REQ-01 (DB): ~30 phút
  - REQ-02 (API module): ~1.5 giờ
  - REQ-03 (AI method): ~45 phút
  - REQ-04 (Bull worker): ~2 giờ
  - REQ-05 (Frontend): ~2 giờ
  - **Tổng**: ~7 giờ

---

### 9. Câu hỏi mở

- [x] **Gemini API key**: Đổi sang `GEMINI_ENABLED` và `GEMINI_API_KEY` trong `.env`. Key lấy miễn phí tại [aistudio.google.com/apikey](https://aistudio.google.com/apikey) — free tier 60 req/phút với `gemini-2.0-flash`. Đã có key chưa?
- [x] **Ngôn ngữ đích mặc định**: Sau khi enrich, bản dịch sang ngôn ngữ nào? Tiếng Việt cố định hay dựa vào `user.nativeLanguage`? Khuyến nghị: dựa vào ngôn ngữ gốc của user (field `nativeLanguageId` trong User model).
- [x] **Giới hạn quick notes**: Có giới hạn số quick notes per user không? (để tránh spam Gemini API calls)
- [x] **Routing frontend**: Bảng ghi chú là trang riêng `/quick-notes` hay là panel/tab trong `VocabularyPage`? Khuyến nghị: trang riêng cho trải nghiệm tốt hơn.

---

## KẾ HOẠCH TRIỂN KHAI

> **✅ HOÀN THÀNH triển khai ngày 2026-02-27**
> Migration `20260227101759_add_quick_notes` đã được áp dụng. Backend TSC clean. Frontend TSC clean.
> Để kích hoạt AI enrichment: set `GEMINI_ENABLED="true"` và `GEMINI_API_KEY="<key>"` trong `apps/backend/.env`.

### Tóm tắt mục tiêu
> Xây dựng tính năng "Quick Note" bất đồng bộ: người dùng nhập từ → backend lưu ngay (PENDING) → Bull Queue worker gọi Gemini enrichit → lưu vào `vocabulary_base` + `vocabulary_translations` + `user_vocabulary` tự động. Frontend polling hiển thị trạng thái real-ish. Ưu tiên hệ thống ổn định, không block HTTP, retry tự động khi lỗi.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: `POST /quick-notes` nhận `term + sourceLanguageCode + targetLanguageCode`, lưu DB với status PENDING, enqueue job, trả 201 ngay
2. FR-02: Bull Queue worker tự động gọi Gemini, tạo VocabularyBase + Translation + UserVocabulary, cập nhật QuickNote → DONE
3. FR-03: `GET /quick-notes` trả danh sách paginated của user hiện tại (kèm vocabularyBaseId khi DONE)
4. FR-04: `DELETE /quick-notes/:id` xóa note của user (chỉ owner)
5. FR-05: Frontend `/quick-notes` polling 4s khi có rows ở PENDING/PROCESSING, dừng khi tất cả DONE/ERROR
6. FR-06: Khi DONE, hiển thị link "View" tới `/vocabulary?id=xxx`; khi ERROR, hiển thị tooltip message

#### Ràng buộc phi chức năng
1. NFR-01: HTTP POST phải trả về < 100ms (không gọi Gemini trong request)
2. NFR-02: Bull Queue `attempts: 3` + `backoff exponential 5s` — không mất job khi crash
3. NFR-03: Worker bắt `ConflictException` (duplicate term) → reuse existing vocab thay vì fail
4. NFR-04: TypeScript strict — không dùng `any`, dùng typed interfaces
5. NFR-05: Gemini disabled → POST trả 503 ngay thay vì để job bị stuck mãi

#### Phụ thuộc
- DEP-01: Redis đang chạy (Docker port 6379) — được dùng bởi BullModule
- DEP-02: `VocabularyService` (export sẵn) — worker dùng `create()` + `addTranslation()` + `addToUserVocabulary()`
- DEP-03: `AiService` (cần export) — worker inject để gọi `enrichWord()`
- DEP-04: `@nestjs/bull`, `bull`, `@google/generative-ai` — chưa install

### Cách tiếp cận
> Phase 1 chuẩn bị hạ tầng (DB schema + env + packages). Phase 2 refactor AiService sang Gemini + thêm `enrichWord()`. Phase 3 xây dựng toàn bộ `QuickNoteModule` (DTO → Service → Controller → Processor). Phase 4 wire vào AppModule. Phase 5 xây frontend (API client → Page → Route → Nav). Phase 6 verify build + migrate + smoke test.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/backend/prisma/schema.prisma` | Thêm enum `QuickNoteStatus` + model `QuickNote` + relations |
| Sửa đổi | `apps/backend/.env` | Đổi `OPENAI_*` → `GEMINI_*` |
| Sửa đổi | `apps/backend/src/config/config.module.ts` | Update Joi validation schema |
| Sửa đổi | `apps/backend/src/modules/ai/ai.service.ts` | Refactor sang Gemini SDK + thêm `enrichWord()` |
| Sửa đổi | `apps/backend/src/modules/ai/ai.module.ts` | Export `AiService` |
| Tạo mới | `apps/backend/src/modules/quick-note/dto/quick-note.dto.ts` | DTOs + validation |
| Tạo mới | `apps/backend/src/modules/quick-note/quick-note.service.ts` | CRUD + status update |
| Tạo mới | `apps/backend/src/modules/quick-note/quick-note.controller.ts` | 3 endpoints REST |
| Tạo mới | `apps/backend/src/modules/quick-note/quick-note.processor.ts` | Bull Queue worker |
| Tạo mới | `apps/backend/src/modules/quick-note/quick-note.module.ts` | Module wiring |
| Sửa đổi | `apps/backend/src/app.module.ts` | Import `BullModule.forRoot` + `QuickNoteModule` |
| Sửa đổi | `apps/frontend/src/api/client.ts` | Thêm `quickNoteApi` |
| Tạo mới | `apps/frontend/src/pages/QuickNotePage.tsx` | Bảng ghi chú + polling |
| Sửa đổi | `apps/frontend/src/App.tsx` | Thêm route `/quick-notes` |
| Sửa đổi | `apps/frontend/src/components/Layout.tsx` | Thêm nav item "Quick Notes" |

---

## PLAN TODO

### Phase 1: Data & Infrastructure

#### REQ-01: Prisma model `QuickNote`

- [x] **TODO-1.1.1**: Thêm enum `QuickNoteStatus` và model `QuickNote` vào Prisma schema
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Đọc schema hiện tại để thấy pattern `@@map`, `@relation`, `onDelete`; đặc biệt model `User` (cần thêm relation `quickNotes`) và `VocabularyBase` (cần thêm relation `quickNotes`)
  - **Thay đổi**:
    - Thêm enum sau `enum UserRole`:
      ```prisma
      enum QuickNoteStatus {
        PENDING
        PROCESSING
        DONE
        ERROR
      }
      ```
    - Thêm model sau `UserBadge`:
      ```prisma
      model QuickNote {
        id                 String          @id @default(uuid())
        userId             String          @map("user_id")
        term               String
        sourceLanguageCode String          @map("source_language_code")
        targetLanguageCode String          @map("target_language_code")
        status             QuickNoteStatus @default(PENDING)
        errorMessage       String?         @map("error_message")
        vocabularyBaseId   String?         @map("vocabulary_base_id")
        createdAt          DateTime        @default(now()) @map("created_at")
        updatedAt          DateTime        @updatedAt @map("updated_at")

        user           User            @relation(fields: [userId], references: [id], onDelete: Cascade)
        vocabularyBase VocabularyBase? @relation(fields: [vocabularyBaseId], references: [id], onDelete: SetNull)

        @@index([userId, status])
        @@index([userId, createdAt(sort: Desc)])
        @@map("quick_notes")
      }
      ```
    - Trong model `User`, thêm vào cuối danh sách relations: `quickNotes   QuickNote[]`
    - Trong model `VocabularyBase`, thêm vào cuối danh sách relations: `quickNotes   QuickNote[]`
  - **Verify**: `npx prisma validate` không báo lỗi
  - **Kết quả**: Schema hợp lệ, sẵn sàng migrate

- [x] **TODO-1.1.2**: Cập nhật env vars sang Gemini trong `.env`
  - **File**: `apps/backend/.env`
  - **Context**: File `.env` hiện tại có `OPENAI_ENABLED` và `OPENAI_API_KEY`
  - **Thay đổi**: Thay thế 2 dòng:
    ```dotenv
    GEMINI_ENABLED="true"
    GEMINI_API_KEY="<your-key-from-aistudio.google.com>"
    ```
    (xóa 2 dòng `OPENAI_*` cũ)
  - **Verify**: File `.env` có `GEMINI_ENABLED` và `GEMINI_API_KEY`
  - **Kết quả**: Env vars phản ánh provider mới

- [x] **TODO-1.1.3**: Cập nhật Joi validation schema trong ConfigModule
  - **File**: `apps/backend/src/config/config.module.ts`
  - **Context**: File hiện tại validate `OPENAI_ENABLED` và `OPENAI_API_KEY`
  - **Thay đổi**: Thay 2 dòng Joi:
    ```typescript
    GEMINI_ENABLED: Joi.boolean().default(false),
    GEMINI_API_KEY: Joi.string().allow('').optional(),
    ```
    (xóa 2 dòng `OPENAI_*` cũ)
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: App khởi động không crash do env validation

- [x] **TODO-1.1.4**: Cài packages mới vào backend
  - **File**: `apps/backend/package.json` (thay đổi qua npm install)
  - **Context**: Hiện có `@nestjs/schedule` làm mẫu BullModule pattern
  - **Thay đổi**: Chạy trong terminal:
    ```bash
    cd apps/backend && npm install @nestjs/bull bull @google/generative-ai && npm install -D @types/bull
    ```
  - **Verify**: `node_modules/@nestjs/bull` và `node_modules/@google/generative-ai` tồn tại
  - **Kết quả**: Packages sẵn sàng import

---

### Phase 2: AI Layer

#### REQ-03: AI enrichment method `enrichWord()`

- [x] **TODO-2.3.1**: Refactor `AiService` — thay OpenAI client bằng GoogleGenerativeAI
  - **File**: `apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: File hiện tại dùng `import OpenAI from 'openai'` và `new OpenAI({ apiKey })`
  - **Thay đổi**:
    - Thay import: `import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';`
    - Đổi private field: `private gemini: GenerativeModel | null = null;`
    - Constructor đọc `GEMINI_ENABLED` + `GEMINI_API_KEY`, khởi tạo:
      ```typescript
      const enabled = config.get<string>('GEMINI_ENABLED') === 'true';
      if (enabled) {
        const genAI = new GoogleGenerativeAI(config.get<string>('GEMINI_API_KEY')!);
        this.gemini = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      }
      ```
    - Đổi `ensureEnabled()` check `this.gemini` thay vì `this.openai`
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: AiService dùng Gemini client, không còn OpenAI dependency

- [x] **TODO-2.3.2**: Refactor `generateContextSentence()` sang Gemini API
  - **File**: `apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: Method hiện dùng `this.openai!.chat.completions.create()`
  - **Thay đổi**: Thay body method:
    ```typescript
    async generateContextSentence(term: string, languageCode: string, level: string): Promise<string> {
      this.ensureEnabled();
      const prompt = `You are a language teacher. Generate a single natural example sentence using the word "${term}" in ${languageCode} at ${level} CEFR level. Return ONLY the sentence, nothing else.`;
      const result = await this.gemini!.generateContent(prompt);
      return result.response.text().trim();
    }
    ```
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: Method dùng Gemini, không còn `openai` reference

- [x] **TODO-2.3.3**: Refactor `generateMemoryHint()` sang Gemini API
  - **File**: `apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: Method hiện dùng `this.openai!.chat.completions.create()`
  - **Thay đổi**: Thay body method:
    ```typescript
    async generateMemoryHint(term: string, termLanguage: string, nativeLanguage: string): Promise<string> {
      this.ensureEnabled();
      const prompt = `You are a memory expert. Create a short, memorable mnemonic or association hint in ${nativeLanguage} for the ${termLanguage} word "${term}". Return ONLY the hint (max 2 sentences).`;
      const result = await this.gemini!.generateContent(prompt);
      return result.response.text().trim();
    }
    ```
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: Tất cả methods trong AiService đều dùng Gemini

- [x] **TODO-2.3.4**: Thêm interface `EnrichedWordResult` và method `enrichWord()`
  - **File**: `apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: Đọc `vocabulary.dto.ts` để thấy các field hợp lệ (`cefrLevel`, `partOfSpeech`, etc.)
  - **Thay đổi**: Thêm export interface trước class `AiService`:
    ```typescript
    export interface EnrichedWordResult {
      phonetic?: string;
      cefrLevel?: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';
      partOfSpeech?: string;
      exampleSentence?: string;
      translation: string;
      definition?: string;
      exampleTranslation?: string;
    }
    ```
    Thêm method cuối class:
    ```typescript
    async enrichWord(term: string, sourceLang: string, targetLang: string): Promise<EnrichedWordResult> {
      this.ensureEnabled();
      const model = (this.gemini as any).model === 'gemini-2.0-flash'
        ? this.gemini!
        : this.gemini!;
      // Use JSON mode model
      const jsonModel = new (require('@google/generative-ai').GoogleGenerativeAI)(
        this['config'].get<string>('GEMINI_API_KEY')!
      ).getGenerativeModel({
        model: 'gemini-2.0-flash',
        generationConfig: { responseMimeType: 'application/json' },
      });
      const prompt = `Analyze the ${sourceLang} word/phrase "${term}". Return a JSON object with these fields:
- "translation": (string, required) translation in ${targetLang}
- "definition": (string) brief definition in ${targetLang}
- "phonetic": (string) IPA phonetic transcription
- "cefrLevel": (string) one of A1,A2,B1,B2,C1,C2
- "partOfSpeech": (string) one of noun,verb,adjective,adverb,phrase,other
- "exampleSentence": (string) natural example sentence in ${sourceLang}
- "exampleTranslation": (string) translation of the example sentence in ${targetLang}`;
      const result = await jsonModel.generateContent(prompt);
      const text = result.response.text();
      const cleaned = text.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim();
      const parsed = JSON.parse(cleaned) as EnrichedWordResult;
      if (!parsed.translation) throw new Error('Gemini returned invalid enrichment data');
      return parsed;
    }
    ```
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: `enrichWord()` available cho QuickNoteProcessor inject

- [x] **TODO-2.3.5**: Export `AiService` từ `AiModule`
  - **File**: `apps/backend/src/modules/ai/ai.module.ts`
  - **Context**: File hiện tại không có `exports`
  - **Thay đổi**: Thêm `exports: [AiService]` vào `@Module`:
    ```typescript
    @Module({
      controllers: [AiController],
      providers: [AiService],
      exports: [AiService],
    })
    export class AiModule {}
    ```
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: `AiService` có thể inject vào `QuickNoteModule`

---

### Phase 3: Backend Module

#### REQ-02: NestJS module `quick-note` — DTOs

- [x] **TODO-3.2.1**: Tạo file DTOs cho QuickNote module
  - **File**: `apps/backend/src/modules/quick-note/dto/quick-note.dto.ts`
  - **Context**: Đọc `vocabulary/dto/vocabulary.dto.ts` để thấy pattern `@ApiProperty`, `@IsString`, `@IsIn`
  - **Thay đổi**: Tạo file mới với nội dung:
    ```typescript
    import { IsString, IsOptional, IsInt, Min, Max } from 'class-validator';
    import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
    import { Type } from 'class-transformer';

    export class CreateQuickNoteDto {
      @ApiProperty({ example: 'serendipity' })
      @IsString()
      term: string;

      @ApiProperty({ example: 'en', description: 'Source language code' })
      @IsString()
      sourceLanguageCode: string;

      @ApiProperty({ example: 'vi', description: 'Target translation language code' })
      @IsString()
      targetLanguageCode: string;
    }

    export class QuickNoteQueryDto {
      @ApiPropertyOptional({ default: 1 })
      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      page?: number = 1;

      @ApiPropertyOptional({ default: 20 })
      @IsOptional()
      @Type(() => Number)
      @IsInt()
      @Min(1)
      @Max(50)
      limit?: number = 20;
    }
    ```
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: DTOs sẵn sàng dùng trong controller và service

#### REQ-02: NestJS module `quick-note` — Service

- [x] **TODO-3.2.2**: Tạo `QuickNoteService` với các method CRUD cơ bản
  - **File**: `apps/backend/src/modules/quick-note/quick-note.service.ts`
  - **Context**: Đọc `vocabulary.service.ts` để thấy pattern Prisma; đọc `quick-note.dto.ts` vừa tạo
  - **Thay đổi**: Tạo file mới:
    ```typescript
    import { Injectable, ForbiddenException, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
    import { InjectQueue } from '@nestjs/bull';
    import { Queue } from 'bull';
    import { ConfigService } from '@nestjs/config';
    import { PrismaService } from '../../prisma/prisma.service';
    import { CreateQuickNoteDto, QuickNoteQueryDto } from './dto/quick-note.dto';
    import { QuickNoteStatus } from '@prisma/client';

    export const QUICK_NOTE_QUEUE = 'quick-note-enrichment';

    @Injectable()
    export class QuickNoteService {
      constructor(
        private readonly prisma: PrismaService,
        private readonly config: ConfigService,
        @InjectQueue(QUICK_NOTE_QUEUE) private readonly queue: Queue,
      ) {}

      async create(dto: CreateQuickNoteDto, userId: string) {
        const geminiEnabled = this.config.get<string>('GEMINI_ENABLED') === 'true';
        if (!geminiEnabled) {
          throw new ServiceUnavailableException('AI enrichment is not enabled. Set GEMINI_ENABLED=true and GEMINI_API_KEY.');
        }

        const note = await this.prisma.quickNote.create({
          data: {
            userId,
            term: dto.term.trim(),
            sourceLanguageCode: dto.sourceLanguageCode,
            targetLanguageCode: dto.targetLanguageCode,
            status: QuickNoteStatus.PENDING,
          },
        });

        await this.queue.add({ quickNoteId: note.id }, {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        });

        return note;
      }

      async findAll(query: QuickNoteQueryDto, userId: string) {
        const { page = 1, limit = 20 } = query;
        const skip = (page - 1) * limit;

        const [items, total] = await Promise.all([
          this.prisma.quickNote.findMany({
            where: { userId },
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { vocabularyBase: { include: { language: true } } },
          }),
          this.prisma.quickNote.count({ where: { userId } }),
        ]);

        return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
      }

      async remove(id: string, userId: string) {
        const note = await this.prisma.quickNote.findUnique({ where: { id } });
        if (!note) throw new NotFoundException('Quick note not found');
        if (note.userId !== userId) throw new ForbiddenException('Not your note');
        await this.prisma.quickNote.delete({ where: { id } });
      }

      async updateStatus(
        id: string,
        status: QuickNoteStatus,
        data: { vocabularyBaseId?: string; errorMessage?: string } = {},
      ) {
        return this.prisma.quickNote.update({
          where: { id },
          data: { status, ...data },
        });
      }
    }
    ```
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: Service có đủ CRUD + enqueue logic + guard GEMINI_ENABLED

#### REQ-02: NestJS module `quick-note` — Controller

- [x] **TODO-3.2.3**: Tạo `QuickNoteController` với 3 endpoints
  - **File**: `apps/backend/src/modules/quick-note/quick-note.controller.ts`
  - **Context**: Đọc `vocabulary.controller.ts` để thấy pattern Guard/Decorator; đọc `quick-note.service.ts` vừa tạo
  - **Thay đổi**: Tạo file mới:
    ```typescript
    import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
    import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
    import { QuickNoteService } from './quick-note.service';
    import { CreateQuickNoteDto, QuickNoteQueryDto } from './dto/quick-note.dto';
    import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
    import { CurrentUser, AuthUser } from '../auth/decorators/current-user.decorator';

    @ApiTags('quick-notes')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard)
    @Controller('quick-notes')
    export class QuickNoteController {
      constructor(private readonly svc: QuickNoteService) {}

      @Post()
      @HttpCode(HttpStatus.CREATED)
      @ApiOperation({ summary: 'Create a quick note — AI enrichment runs async' })
      create(@Body() dto: CreateQuickNoteDto, @CurrentUser() user: AuthUser) {
        return this.svc.create(dto, user.id);
      }

      @Get()
      @ApiOperation({ summary: 'List quick notes for current user' })
      findAll(@Query() query: QuickNoteQueryDto, @CurrentUser() user: AuthUser) {
        return this.svc.findAll(query, user.id);
      }

      @Delete(':id')
      @HttpCode(HttpStatus.NO_CONTENT)
      @ApiOperation({ summary: 'Delete a quick note' })
      remove(@Param('id') id: string, @CurrentUser() user: AuthUser) {
        return this.svc.remove(id, user.id);
      }
    }
    ```
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: 3 endpoints REST sẵn sàng; Swagger auto-docs

#### REQ-04: Bull Queue Processor

- [x] **TODO-3.4.1**: Tạo `QuickNoteProcessor` — Bull Queue worker xử lý enrichment
  - **File**: `apps/backend/src/modules/quick-note/quick-note.processor.ts`
  - **Context**: Đọc `quick-note.service.ts` (có `updateStatus()`); đọc `ai.service.ts` (có `enrichWord()`); đọc `vocabulary.service.ts` (có `create()`, `addTranslation()`, `addToUserVocabulary()`)
  - **Thay đổi**: Tạo file mới:
    ```typescript
    import { Process, Processor } from '@nestjs/bull';
    import { Logger } from '@nestjs/common';
    import { Job } from 'bull';
    import { QuickNoteStatus } from '@prisma/client';
    import { QuickNoteService, QUICK_NOTE_QUEUE } from './quick-note.service';
    import { AiService } from '../ai/ai.service';
    import { VocabularyService } from '../vocabulary/vocabulary.service';
    import { PrismaService } from '../../prisma/prisma.service';

    @Processor(QUICK_NOTE_QUEUE)
    export class QuickNoteProcessor {
      private readonly logger = new Logger(QuickNoteProcessor.name);

      constructor(
        private readonly quickNoteService: QuickNoteService,
        private readonly aiService: AiService,
        private readonly vocabularyService: VocabularyService,
        private readonly prisma: PrismaService,
      ) {}

      @Process()
      async handle(job: Job<{ quickNoteId: string }>) {
        const { quickNoteId } = job.data;
        this.logger.log(`Processing quick note ${quickNoteId}`);

        await this.quickNoteService.updateStatus(quickNoteId, QuickNoteStatus.PROCESSING);

        const note = await this.prisma.quickNote.findUniqueOrThrow({ where: { id: quickNoteId } });

        try {
          const enriched = await this.aiService.enrichWord(
            note.term,
            note.sourceLanguageCode,
            note.targetLanguageCode,
          );

          // Create or reuse existing VocabularyBase
          let vocabBase: { id: string };
          try {
            vocabBase = await this.vocabularyService.create(
              {
                term: note.term,
                languageCode: note.sourceLanguageCode,
                cefrLevel: enriched.cefrLevel,
                partOfSpeech: enriched.partOfSpeech,
                phonetic: enriched.phonetic,
                exampleSentence: enriched.exampleSentence,
              },
              null, // global vocab
            );
          } catch {
            // Duplicate — find existing
            const lang = await this.prisma.language.findUniqueOrThrow({
              where: { code: note.sourceLanguageCode },
            });
            vocabBase = await this.prisma.vocabularyBase.findFirstOrThrow({
              where: { term: note.term, languageId: lang.id, organizationId: null },
            });
          }

          // Add translation
          await this.vocabularyService.addTranslation(vocabBase.id, {
            targetLanguageCode: note.targetLanguageCode,
            translation: enriched.translation,
            definition: enriched.definition,
            exampleTranslation: enriched.exampleTranslation,
          });

          // Auto-add to user's learning list
          await this.vocabularyService.addToUserVocabulary(note.userId, vocabBase.id);

          await this.quickNoteService.updateStatus(quickNoteId, QuickNoteStatus.DONE, {
            vocabularyBaseId: vocabBase.id,
          });

          this.logger.log(`Quick note ${quickNoteId} enriched → vocab ${vocabBase.id}`);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          this.logger.error(`Quick note ${quickNoteId} failed: ${msg}`);
          await this.quickNoteService.updateStatus(quickNoteId, QuickNoteStatus.ERROR, {
            errorMessage: msg,
          });
          throw err; // re-throw so Bull retries
        }
      }
    }
    ```
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: Worker tự động chạy khi job vào queue; retry 3 lần khi lỗi

- [x] **TODO-3.4.2**: Tạo `QuickNoteModule` — wire tất cả lại
  - **File**: `apps/backend/src/modules/quick-note/quick-note.module.ts`
  - **Context**: Đọc `vocabulary.module.ts` (export pattern); đọc tất cả file vừa tạo trong folder `quick-note/`
  - **Thay đổi**: Tạo file mới:
    ```typescript
    import { Module } from '@nestjs/common';
    import { BullModule } from '@nestjs/bull';
    import { QuickNoteController } from './quick-note.controller';
    import { QuickNoteService, QUICK_NOTE_QUEUE } from './quick-note.service';
    import { QuickNoteProcessor } from './quick-note.processor';
    import { AiModule } from '../ai/ai.module';
    import { VocabularyModule } from '../vocabulary/vocabulary.module';

    @Module({
      imports: [
        BullModule.registerQueue({ name: QUICK_NOTE_QUEUE }),
        AiModule,
        VocabularyModule,
      ],
      controllers: [QuickNoteController],
      providers: [QuickNoteService, QuickNoteProcessor],
    })
    export class QuickNoteModule {}
    ```
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: Module tự đóng gói, sẵn sàng import vào AppModule

---

### Phase 4: App Wiring

- [x] **TODO-4.1**: Thêm `BullModule.forRoot` và `QuickNoteModule` vào `AppModule`
  - **File**: `apps/backend/src/app.module.ts`
  - **Context**: Đọc `config.module.ts` để biết `ConfigService` là global (dùng được trong BullModule factory); đọc `.env` để thấy `REDIS_URL`
  - **Thay đổi**:
    - Thêm imports ở đầu file:
      ```typescript
      import { BullModule } from '@nestjs/bull';
      import { ConfigService } from '@nestjs/config';
      import { QuickNoteModule } from './modules/quick-note/quick-note.module';
      ```
    - Thêm vào mảng `imports` của `@Module` (trước `AiModule`):
      ```typescript
      BullModule.forRootAsync({
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          redis: config.get<string>('REDIS_URL')!,
          defaultJobOptions: {
            attempts: 3,
            backoff: { type: 'exponential', delay: 5000 },
          },
        }),
      }),
      QuickNoteModule,
      ```
  - **Verify**: `npx tsc -p tsconfig.build.json --noEmit` không lỗi
  - **Kết quả**: BullModule kết nối Redis; QuickNoteModule được bootstrap

---

### Phase 5: Frontend

#### REQ-05: Frontend bảng ghi chú nhanh

- [x] **TODO-5.5.1**: Thêm `quickNoteApi` vào API client
  - **File**: `apps/frontend/src/api/client.ts`
  - **Context**: Đọc file hiện tại để thấy pattern các api object (`vocabularyApi`, `reviewApi`)
  - **Thay đổi**: Thêm vào cuối file:
    ```typescript
    // ─── Quick Note endpoints ──────────────────────────────────────────────────

    export const quickNoteApi = {
      create: (data: { term: string; sourceLanguageCode: string; targetLanguageCode: string }) =>
        apiClient.post('/quick-notes', data).then((r) => r.data),
      list: (page = 1, limit = 20) =>
        apiClient.get('/quick-notes', { params: { page, limit } }).then((r) => r.data),
      remove: (id: string) =>
        apiClient.delete(`/quick-notes/${id}`).then((r) => r.data),
    };
    ```
  - **Verify**: `npx tsc --noEmit` (trong `apps/frontend`) không lỗi
  - **Kết quả**: `quickNoteApi` ready cho page component dùng

- [x] **TODO-5.5.2**: Tạo `QuickNotePage.tsx` — bảng ghi chú + polling
  - **File**: `apps/frontend/src/pages/QuickNotePage.tsx`
  - **Context**: Đọc `apps/frontend/src/api/client.ts` (quickNoteApi); đọc `VocabularyPage.tsx` để thấy pattern `useState`/`useEffect`/`useCallback` + TailwindCSS; đọc `languageApi.getAll()` pattern
  - **Thay đổi**: Tạo file mới (~200 dòng) với:
    - State: `notes[]`, `languages[]`, `form {term, sourceLanguageCode, targetLanguageCode}`, `loading`, `submitting`
    - `useEffect` load languages + load notes khi mount
    - Polling: `useEffect` với `setInterval(4000)` chỉ khi có note có status PENDING/PROCESSING; clear interval khi không còn
    - Form inline: 3 input fields + nút "Add" (disabled khi submitting)
    - Table rows: hiển thị term, source→target lang, status badge (⏳/✅/❌), link "View" tới `/vocabulary` khi DONE, delete button
    - Status badge colors: PENDING=yellow, PROCESSING=blue animate-pulse, DONE=green, ERROR=red
    - Error case: hiển thị `errorMessage` trong tooltip/title attribute
    - Xử lý submit: gọi `quickNoteApi.create()`, prepend row vào list, reset form
    - Xử lý delete: gọi `quickNoteApi.remove()`, filter ra khỏi list
  - **Verify**: `npx tsc --noEmit` (trong `apps/frontend`) không lỗi
  - **Kết quả**: Page đầy đủ, TypeScript clean

- [x] **TODO-5.5.3**: Thêm route `/quick-notes` vào `App.tsx`
  - **File**: `apps/frontend/src/App.tsx`
  - **Context**: Đọc file hiện tại — pattern `<Route path="vocabulary" element={<VocabularyPage />} />`
  - **Thay đổi**:
    - Thêm import: `import QuickNotePage from '@/pages/QuickNotePage';`
    - Thêm route trong nhóm protected (sau route `analytics`):
      ```tsx
      <Route path="quick-notes" element={<QuickNotePage />} />
      ```
  - **Verify**: `npx tsc --noEmit` (trong `apps/frontend`) không lỗi
  - **Kết quả**: `/quick-notes` accessible khi đã login

- [x] **TODO-5.5.4**: Thêm nav item "Quick Notes" vào `Layout.tsx`
  - **File**: `apps/frontend/src/components/Layout.tsx`
  - **Context**: Đọc `navItems` array hiện tại — format `{ to, label }`
  - **Thay đổi**: Thêm vào array `navItems` (sau Analytics):
    ```typescript
    { to: '/quick-notes', label: '📝 Quick Notes' },
    ```
  - **Verify**: `npx tsc --noEmit` (trong `apps/frontend`) không lỗi
  - **Kết quả**: Nav sidebar hiển thị link Quick Notes

---

### Phase 6: Integration & Verification

- [x] **TODO-6.1**: Chạy Prisma migration
  - **Thay đổi**: Trong terminal:
    ```bash
    cd apps/backend && npx prisma migrate dev --name add-quick-notes
    ```
  - **Verify**: Migration tạo thành công, Prisma Client regenerated (xuất hiện `QuickNoteStatus` trong `@prisma/client`)
  - **Kết quả**: Bảng `quick_notes` + enum `QuickNoteStatus` tồn tại trong PostgreSQL

- [x] **TODO-6.2**: TypeScript build check toàn bộ backend
  - **Thay đổi**: Chạy:
    ```bash
    cd apps/backend && npx tsc -p tsconfig.build.json --noEmit
    ```
  - **Verify**: Exit code 0, không có lỗi TypeScript
  - **Kết quả**: Backend compile clean

- [x] **TODO-6.3**: TypeScript check frontend
  - **Thay đổi**: Chạy:
    ```bash
    cd apps/frontend && npx tsc --noEmit
    ```
  - **Verify**: Exit code 0, không có lỗi TypeScript
  - **Kết quả**: Frontend compile clean

- [x] **TODO-6.4**: Smoke test happy path
  - **Thay đổi**: Khởi động `npm run dev` → Login → vào `/quick-notes` → nhập từ "serendipity" + English → Vietnamese → submit
  - **Verify**:
    - Row xuất hiện ngay với badge ⏳ PENDING
    - Sau ~5–10s badge chuyển ✅ DONE (polling 4s)
    - Click "View" mở `/vocabulary?search=serendipity` và từ có translation tiếng Việt
    - Kiểm tra `/vocabulary/my-list` — từ đã được auto-add
  - **Kết quả**: Full flow hoạt động end-to-end

- [x] **TODO-6.5**: Smoke test error case (Gemini disabled)
  - **Thay đổi**: Set `GEMINI_ENABLED=false` tạm thời → restart backend → thử submit note mới
  - **Verify**: API trả 503 với message "AI enrichment is not enabled", không tạo note nào trong DB
  - **Kết quả**: Graceful error, không stuck PENDING

---

## Ghi chú triển khai

- **Thứ tự bắt buộc**: Phase 1 → 2 → 3 → 4 → 5 → 6. Không thể đảo vì dependency chain: schema → AiService export → Module → AppModule → Frontend
- **`enrichWord()` implementation note**: Hiện dùng inline `new GoogleGenerativeAI()` trong method vì cần `generationConfig.responseMimeType`. Để clean hơn, có thể tạo 2 model instances trong constructor (1 default + 1 json mode)
- **Prisma `QuickNoteStatus` enum**: Sau `TODO-6.1` migrate, Prisma client mới có type `QuickNoteStatus` từ `@prisma/client` — cần migrate trước khi build
- **Bull Redis connection**: `BullModule.forRootAsync` dùng `REDIS_URL` dạng `redis://localhost:6379` — Bull parse tự động
- **Frontend polling**: Dùng `setInterval` trong `useEffect` với cleanup function — tránh memory leak; chỉ poll khi `hasPending` true

## Rủi ro cần theo dõi

- [x] **Risk-1**: `@google/generative-ai` package thay đổi API — dùng version cụ thể `@google/generative-ai@^0.24.0` để tránh breaking change
- [x] **Risk-2**: Redis không chạy → Bull throw lỗi khi khởi động — kiểm tra `docker-compose up -d` trước khi test
- [x] **Risk-3**: Gemini rate limit (60 req/phút free tier) — khi nhiều user submit đồng thời → Bull queue sẽ xử lý tuần tự, rate limit tự được kiểm soát bởi concurrency worker (mặc định 1)
