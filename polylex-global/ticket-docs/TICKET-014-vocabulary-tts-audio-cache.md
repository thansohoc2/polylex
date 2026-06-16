# TICKET-014: Phát âm từ vựng bằng Google Cloud TTS + Cache MP3 (Cloudflare R2)

## Mô tả
Tích hợp Google Cloud Text-to-Speech để phát âm từ vựng. Mỗi từ chỉ được gọi API TTS **một lần duy nhất** — kết quả MP3 được lưu vào **Cloudflare R2** (S3-compatible) và URL được ghi lại vào `VocabularyBase.audioUrl`. Mọi lần truy cập tiếp theo sẽ trả về URL đã lưu, tránh chi phí phát sinh. User có thể cấu hình giọng nam/nữ trong trang Profile.

## Mô tả
- User bấm play trên bất kỳ từ nào → nghe được phát âm chuẩn
- Chi phí TTS tối thiểu nhờ cache vĩnh viễn vào DB + Cloudflare R2
- User chọn giọng nam/nữ trong Profile, có thể nghe thử trực tiếp

## Tiêu chí chấp nhận
- `GET /vocabulary/:id/audio` trả về `{ audioUrl: string }`
- Lần đầu gọi: generate TTS → upload R2 → lưu DB → trả URL
- Lần sau: trả thẳng `audioUrl` từ DB (không gọi TTS)
- Hỗ trợ nhiều ngôn ngữ (dựa theo `VocabularyBase.languageId`)
- Trang Profile có setting chọn voice gender + nút nghe thử
- Khi tạo từ vựng mới: **tự động** dispatch job generate audio async (không block response); nếu từ đã tồn tại và đã có audio thì bỏ qua
- Khi học mà từ chưa có audio: user/frontend có thể gọi API để generate on-demand tức thì

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-014 |
| **Tiêu đề** | Vocabulary TTS Audio + MP3 Cache |
| **Mục tiêu** | Phát âm từ vựng qua Google Cloud TTS; cache MP3 vào GCS + DB để tránh trả phí lặp lại |
| **Phạm vi** | REST API · DB (VocabularyBase.audioUrl + User.ttsVoiceGender) · Google Cloud TTS · Cloudflare R2 |
| **Độ ưu tiên** | Trung bình |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Cài đặt & cấu hình GCP | Cài SDK Google TTS + GCS, thêm env vars, validate trong config module | Config / Package | Nhỏ |
| REQ-02 | TTS Service | Service khởi tạo Google TTS client, tổng hợp audio cho term + language | Service | TB |
| REQ-03 | R2 Storage Service | Service upload MP3 bytes lên Cloudflare R2 (S3-compatible), trả về public URL | Service | TB |
| REQ-04 | Audio endpoint | `GET /vocabulary/:id/audio` — kiểm tra cache DB → (nếu chưa có) gọi TTS + R2 → lưu `audioUrl` vào DB → trả URL | REST | Nhỏ |
| REQ-05 | Language → voice mapping | Map `language.code` (en, vi, ja…) sang Google TTS voice name + languageCode | Config / Service | Nhỏ |
| REQ-06 | Profile voice settings | Thêm field `ttsVoiceGender` vào User model; API get/update setting; endpoint nghe thử | REST · DB | TB |
| REQ-07 | Eager + lazy audio generation | Sau khi tạo từ: check `audioUrl`, nếu null → dispatch Bull job async generate TTS (eager). Khi học mà từ chưa có audio → `GET /vocabulary/:id/audio` generate on-demand (lazy fallback, đã có ở REQ-04) | Service · Queue | TB |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 ──┬──> REQ-04 (lazy fallback khi đang học)
                    │
REQ-01 ──> REQ-03 ──┘

REQ-05 ──> REQ-02 (cần mapping trước khi build TTS call)
REQ-06 ──> REQ-02 (voice gender từ user profile truyền vào TTS call)
REQ-07 ──> REQ-02 + REQ-03 (eager generation dùng cùng TTS + R2)
REQ-07 phụ thuộc REQ-01 (Bull queue đã có sẵn trong project)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Cài đặt & cấu hình GCP
- **Mục tiêu**: Có SDK sẵn sàng, env vars được validate khi startup
- **Đầu vào**: `GOOGLE_TTS_CREDENTIALS_JSON`, `GOOGLE_GCS_BUCKET_NAME`, `GOOGLE_TTS_ENABLED`
- **Đầu ra mong đợi**: App start thành công; nếu thiếu key+enabled=true thì throw validation error
- **Tiêu chí hoàn thành**: Joi schema trong `config.module.ts` validate đủ 3 biến; packages `@google-cloud/text-to-speech` và `@google-cloud/storage` được cài
- **Phụ thuộc**: Không

##### REQ-02: TTS Service
- **Mục tiêu**: Nhận `{ term, languageCode }` → trả về MP3 `Buffer`
- **Đầu vào**: term (string), languageCode (e.g. `"en"`, `"vi"`)
- **Đầu ra mong đợi**: `Buffer` chứa dữ liệu MP3
- **Tiêu chí hoàn thành**: Gọi được Google TTS API với đúng voice, trả MP3 buffer; xử lý lỗi nếu TTS disabled hoặc API fail
- **Phụ thuộc**: REQ-01, REQ-05

##### REQ-03: R2 Storage Service
- **Mục tiêu**: Upload MP3 buffer lên Cloudflare R2, trả về public URL
- **Đầu vào**: `Buffer` MP3, `key` (e.g. `tts/{vocabId}-{gender}.mp3`)
- **Đầu ra mong đợi**: Public URL dạng `https://{accountId}.r2.cloudflarestorage.com/{bucket}/tts/{vocabId}-{gender}.mp3` hoặc custom domain
- **Tiêu chí hoàn thành**: File upload thành công via S3-compatible API (`@aws-sdk/client-s3`); URL stable và public access; kiểm tra tồn tại trước khi upload để skip duplicate
- **Phụ thuộc**: REQ-01

##### REQ-04: Audio endpoint
- **Mục tiêu**: `GET /vocabulary/:id/audio` trả `{ audioUrl }`
- **Đầu vào**: `vocabularyBaseId` (path param), JWT auth (để lấy voice gender preference của user)
- **Đầu ra mong đợi**: `{ audioUrl: string }` — URL trỏ thẳng đến MP3 trên R2
- **Tiêu chí hoàn thành**:
  - Nếu `VocabularyBase.audioUrl` đã có → trả ngay, không gọi TTS (cache hit)
  - Nếu chưa có → lấy voice gender từ user profile → gọi REQ-02 + REQ-03 → update `audioUrl` trong DB → trả URL
  - Nếu vocab không tồn tại → 404
  - Nếu TTS disabled → `{ audioUrl: null, reason: 'tts_disabled' }` với HTTP 200 (frontend xử lý mềm)
- **Phụ thuộc**: REQ-02, REQ-03, REQ-06

##### REQ-05: Language-to-voice mapping
- **Mục tiêu**: Map `language.code` + gender preference sang Google TTS params
- **Đầu vào**: language code (`"en"`, `"vi"`, `"ja"`…), gender (`'MALE'` | `'FEMALE'`)
- **Đầu ra mong đợi**: `{ languageCode: string, name: string, ssmlGender: SsmlVoiceGender }`
- **Tiêu chí hoàn thành**: Mapping cho ít nhất `en`, `vi`, `ja`, `ko`, `zh`, `fr`, `de`; fallback sang `en-US FEMALE` nếu chưa có
- **Phụ thuộc**: Không

##### REQ-06: Profile voice settings
- **Mục tiêu**: User chọn giọng nam/nữ trong Profile, nghe thử ngay
- **Đầu vào**: `ttsVoiceGender: 'MALE' | 'FEMALE'` (default `'FEMALE'`)
- **Đầu ra mong đợi**:
  - `PATCH /users/me/preferences` nhận `{ ttsVoiceGender }` → lưu vào DB
  - `GET /users/me/preferences` trả `{ ttsVoiceGender, ... }`
  - `POST /vocabulary/tts-preview` nhận `{ term, languageCode }` → gọi TTS realtime với gender của user → trả MP3 stream (không cache) để nghe thử
- **Tiêu chí hoàn thành**: Frontend Profile page có dropdown Male/Female + nút Play để nghe thử; setting được lưu và dùng cho tất cả audio generation tiếp theo
- **Phụ thuộc**: REQ-02

> **Lưu ý cache**: `audioUrl` trong `VocabularyBase` là **gender-neutral cache** (dùng default gender). Nếu user đổi gender, audio cache cũ vẫn giữ nguyên — chỉ preview endpoint dùng gender thật của user. Thiết kế này giữ chi phí thấp.

##### REQ-07: Eager + lazy audio generation
- **Mục tiêu**: Audio được tạo sớm nhất có thể, **không block flow tạo từ**; lazy fallback cho từ chưa kịp có audio khi học
- **Eager flow** (sau khi tạo từ):
  1. `vocabulary.service.ts` method `create()` và `upsertBulk()` — sau khi upsert thành công, kiểm tra `audioUrl` của record vừa tạo/update
  2. Nếu `audioUrl != null` → **skip** (từ đã tồn tại và đã có audio trước đó, không gọi TTS)
  3. Nếu `audioUrl == null` → dispatch Bull job `tts-generate` với payload `{ vocabularyBaseId, term, languageCode }`
  4. Bull processor chạy async: generate TTS → upload R2 → `prisma.vocabularyBase.update({ audioUrl })` — retry tự động nếu fail
- **Lazy flow** (khi đang học, từ chưa có audio):
  - `GET /vocabulary/:id/audio` (REQ-04) xử lý synchronous, trả URL ngay trong response — đây là fallback cho trường hợp eager chưa kịp chạy hoặc bị fail
- **Đầu vào**: `vocabularyBaseId`, `term`, `languageCode` (từ record VocabularyBase)
- **Đầu ra mong đợi**: `audioUrl` được set trong DB — user nghe được âm thanh at most vài giây sau khi từ được tạo
- **Tiêu chí hoàn thành**:
  - Tạo từ mới → audio tự động generate trong nền (Bull job)
  - Tạo từ đã tồn tại (upsert hit) và từ đó đã có `audioUrl` → **không** dispatch job (tránh gọi TTS thừa)
  - `GET /vocabulary/:id/audio` vẫn hoạt động như lazy fallback khi job chưa chạy xong
  - Bull job thất bại không làm crash API tạo từ
- **Phụ thuộc**: REQ-02, REQ-03 (Bull + `@nestjs/bull` đã có sẵn trong `package.json`)

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng hiện tại**: User học từ vựng qua flashcard/review → cần nghe phát âm để học đúng. Hiện tại không có audio nào.
- **Thực thể liên quan**:
  - `VocabularyBase` — chứa `term` (từ cần đọc), `languageId`, và `audioUrl` (nullable)
  - `Language` — chứa `code` (`"en"`, `"vi"`, …) dùng để chọn voice TTS
- **Quy tắc nghiệp vụ**:
  - Mỗi từ chỉ gọi TTS API **1 lần duy nhất** (cache-first)
  - Audio gắn với từ (vocabulary-level), không phải user-level
  - Nếu TTS chưa được cấu hình (disabled), endpoint vẫn phải trả được response có thể xử lý ở frontend (không crash)
- **Hành vi cần bảo toàn**: `audioUrl` đã có trong schema từ trước (comment `// fallback if TTS unavailable`) — thiết kế mới phải tương thích.

---

### 4. Ngữ cảnh kỹ thuật

**Triển khai hiện tại:**
- `VocabularyBase.audioUrl` đã có trong Prisma schema (nullable String) → **không cần migration mới**
- `vocabulary.service.ts` có `findOne()`, `findAll()`, `create()` — chưa có bất kỳ logic audio nào
- `vocabulary.controller.ts` chưa có endpoint `/audio`
- `VocabularyModule` đơn giản, chưa import thêm gì ngoài `PrismaService`

**Infrastructure sẵn có:**
- **Redis** đã cài (`ioredis`, `cache-manager-ioredis-yet`, `@nestjs/cache-manager`) — có thể dùng thêm để cache in-flight requests (optional)
- **Bull queue** đã cài — có thể dùng cho async TTS generation nếu cần (optional, bước 2)
- **Config/Joi** — cần thêm env vars TTS vào Joi schema trong `config.module.ts`

**Packages chưa có (cần cài):**
- `@google-cloud/text-to-speech` — TTS API
- `@aws-sdk/client-s3` — Cloudflare R2 dùng S3-compatible API

**Files sẽ bị ảnh hưởng:**
- `apps/backend/package.json` — thêm 2 packages
- `apps/backend/src/config/config.module.ts` — thêm Joi validation cho env vars TTS + R2
- `apps/backend/src/modules/vocabulary/vocabulary.module.ts` — thêm providers
- `apps/backend/src/modules/vocabulary/vocabulary.controller.ts` — thêm 2 endpoint: `GET /:id/audio`, `POST /tts-preview`
- `apps/backend/src/modules/vocabulary/vocabulary.service.ts` — thêm `getAudioUrl()`, `previewTts()`
- `apps/backend/src/modules/vocabulary/tts.service.ts` (**mới**) — TTS client + language-voice mapping
- `apps/backend/src/modules/vocabulary/r2-storage.service.ts` (**mới**) — Cloudflare R2 upload via S3 SDK
- `apps/backend/src/modules/vocabulary/tts-audio.processor.ts` (**mới**) — Bull processor: nhận job `tts-generate` → TTS → R2 → DB update
- `apps/backend/src/modules/users/users.controller.ts` — thêm `PATCH /users/me/preferences`, `GET /users/me/preferences`
- `apps/backend/src/modules/users/users.service.ts` — thêm `getTtsPreferences()`, `updateTtsPreferences()`
- `apps/backend/prisma/schema.prisma` — thêm `ttsVoiceGender` vào `User` model

**Cần migration DB**: thêm field `ttsVoiceGender String @default("FEMALE")` vào `User`.

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| Không có audio endpoint | `GET /vocabulary/:id/audio` → `{ audioUrl }` | Thiếu controller method + service method |
| Không có TTS preview | `POST /vocabulary/tts-preview` → MP3 stream để nghe thử | Thiếu endpoint + service method |
| Không có TTS client | `TtsService` gọi Google Cloud TTS API | Cần tạo mới + cài `@google-cloud/text-to-speech` |
| Không có R2 client | `R2StorageService` upload MP3 via S3 SDK | Cần tạo mới + cài `@aws-sdk/client-s3` |
| `audioUrl` nullable, không được set | `audioUrl` được set tự động sau khi tạo từ (eager) hoặc khi học (lazy) | Cần Bull job processor + cache-first trong `GET /audio` |
| `create()` / `upsertBulk()` không trigger audio | Sau tạo từ → tự dispatch `tts-generate` job nếu `audioUrl == null` | Cần thêm dispatch call vào `VocabularyService` |
| Env vars chưa có TTS/R2 | Joi validate `GOOGLE_TTS_ENABLED`, credentials, `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Cần update config.module.ts |
| Language-to-voice chưa có | Mapping `language.code` + gender → Google TTS voice | Cần tạo constant/config |
| User không có voice preference | `User.ttsVoiceGender` field + PATCH/GET preferences API | Cần migration + users module update |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **TTS disabled nhưng frontend vẫn gọi**: Nếu `GOOGLE_TTS_ENABLED=false`, endpoint phải trả lỗi/thông báo có thể xử lý — Biện pháp: trả `503` hoặc `{ audioUrl: null, reason: 'tts_disabled' }` với status 200 (tùy UX)
- [ ] **Từ đã có `audioUrl` thủ công (legacy)**: Một số từ có thể đã có URL cũ → không nên ghi đè nếu đã có — Biện pháp: chỉ gọi TTS khi `audioUrl == null`

#### 6.2 Rủi ro kỹ thuật
- [ ] **Race condition eager + lazy**: Bull job đang chạy generate mà user đồng thời gọi `GET /vocabulary/:id/audio` → cả 2 đều gọi TTS — Biện pháp: trước khi generate (trong cả job lẫn endpoint), `findUnique` lại để recheck `audioUrl`; nếu đã có thì return URL luôn. Gọi thừa 1 lần TTS cost rất nhỏ, chấp nhận được cho MVP
- [ ] **Bull job fail silent**: Nếu job thất bại sau retry, từ vẫn không có audio → Biện pháp: lazy endpoint `GET /audio` sẽ generate lại đồng bộ khi user học đến; log lỗi job rõ ràng để monitor
- [ ] **Google TTS credentials**: Hỗ trợ cả `GOOGLE_APPLICATION_CREDENTIALS` (path) lẫn inline JSON base64 trong env — Biện pháp: kiểm tra env var nào tồn tại và dùng tương ứng khi khởi tạo client
- [ ] **Dependency nặng khi TTS disabled**: App load cả 2 package kể cả khi không dùng — Biện pháp: khởi tạo client lazily trong `OnModuleInit` với guard `if (!enabled) return`
- [ ] **R2 public access**: R2 bucket mặc định private; cần bật Public Access hoặc dùng custom domain qua Cloudflare — Biện pháp: cấu hình `R2_PUBLIC_URL` (e.g. `https://audio.yourdomain.com`) trong env; URL này stable và dùng Cloudflare CDN miễn phí
- [ ] **R2 vs GCS pricing**: R2 không tính phí egress (outbound) — ưu điểm lớn so với GCS khi serve audio nhiều lần

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **Language code không có trong mapping**: Nếu từ thuộc ngôn ngữ chưa được map → fallback sang `"en-US"` hoặc throw lỗi rõ ràng — Cách phòng tránh: định nghĩa fallback voice + log warning
- [ ] **TTS trả empty buffer**: Nếu term là ký tự đặc biệt hoặc quá dài → Cách phòng tránh: validate `term.length > 0 && term.length <= 500`
- [ ] **GCS upload fail nhưng không rollback**: URL không được lưu vào DB → lần sau sẽ thử lại (OK) — Cách phòng tránh: không update `audioUrl` nếu upload thất bại

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Cache vĩnh viễn vào DB — gọi TTS 1 lần/từ, chi phí TTS rất thấp | Cần setup R2 bucket + custom domain trên Cloudflare |
| **Eager generation**: audio sẵn sàng trước khi user học đến | Bull job async — audio có thể chưa ready ngay tức thì (vài giây) |
| **R2: không tính phí egress** — serve audio nhiều lần miễn phí | Thêm `@google-cloud/text-to-speech` + `@aws-sdk/client-s3` |
| `audioUrl` đã có sẵn trong schema | Cần migration nhỏ: thêm `ttsVoiceGender` vào User |
| Sync đơn giản — latency ~200-500ms chỉ lần đầu | Lần đầu truy cập từ mới có delay nhỏ |
| Cloudflare CDN tự động — URL fast globally | Google TTS credentials vẫn phải quản lý |  
| User customize voice gender + preview trong Profile | Voice gender không ảnh hưởng cache (audio mặc định dùng FEMALE) |
| Tách biệt `TtsService` và `R2StorageService` — dễ swap | — |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: **Synchronous cache-first + R2** — gọi TTS + upload R2 trong cùng request lần đầu, trả URL. Đơn giản, không cần queue, latency chấp nhận được (~200-500ms cho lần đầu). R2 không tính phí egress nên phù hợp serve audio nhiều lần.
- **Cách tiếp cận thay thế**: Async via Bull queue — phù hợp khi cần batch generate toàn bộ từ vựng hiện có; không cần thiết cho MVP.
- **Phụ thuộc bên ngoài**:
  - R2 bucket tạo trên Cloudflare dashboard, bật Public Access hoặc cấu hình custom domain
  - Google Cloud project với Cloud Text-to-Speech API enabled; service account key JSON
- **Ước tính công sức**: ~6-8h (cài packages + 3 service/logic mới + 2 endpoint vocabulary + 2 endpoint users preferences + migration + config + test manual)

---

### 9. Câu hỏi mở

- [x] **Storage**: ~~Dùng Google Cloud Storage hay một giải pháp khác?~~ → **Cloudflare R2** (S3-compatible, không phí egress)
- [x] **Credentials**: ~~File hay inline JSON?~~ → **Linh hoạt** — hỗ trợ cả `GOOGLE_APPLICATION_CREDENTIALS` (path) lẫn inline JSON base64
- [x] **Voice gender**: ~~Mặc định giọng nam hay nữ?~~ → **User tự cấu hình trong Profile** (default `FEMALE`); có nút nghe thử
- [x] **Fallback khi TTS disabled**: ~~503 hay 200?~~ → **Linh hoạt** — trả `{ audioUrl: null, reason: 'tts_disabled' }` HTTP 200 để frontend xử lý mềm
- [x] **Async generation**: ~~Sync hay async batch?~~ → **Tự xử lý** — sync cho MVP; Bull queue có sẵn nếu cần batch sau này

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Tích hợp Google Cloud TTS + Cloudflare R2 để phát âm từ vựng với chiến lược cache-first: audio được generate eager (Bull job async ngay sau khi tạo từ) và lazy fallback (sync khi user học). User cấu hình voice gender trong Profile và nghe thử realtime.

### Yêu cầu chức năng
1. FR-01: `GET /vocabulary/:id/audio` — trả `{ audioUrl }` từ DB cache hoặc generate TTS + upload R2 đồng bộ (lazy)
2. FR-02: `POST /vocabulary/tts-preview` — generate TTS realtime theo gender của user, trả MP3 stream (không cache)
3. FR-03: Sau `vocabulary.create()` và `upsertBulk()` — nếu `audioUrl == null` thì dispatch Bull job `tts-generate` async
4. FR-04: Bull processor `TtsAudioProcessor` — nhận job, generate TTS → upload R2 → update `audioUrl` trong DB
5. FR-05: `GET /users/me/tts-preferences` — trả `{ ttsVoiceGender }`
6. FR-06: `PATCH /users/me/tts-preferences` — lưu `ttsVoiceGender` vào `User`
7. FR-07: Frontend `ProfilePage` — dropdown Male/Female + nút Play nghe thử

### Ràng buộc phi chức năng
1. NFR-01: Controller mỏng — logic audio hoàn toàn trong `VocabularyService` và `TtsService`
2. NFR-02: Bull job fail **không** làm crash API tạo từ — wrap dispatch trong `try/catch`
3. NFR-03: Deduplication — cả job lẫn lazy endpoint đều `findUnique` recheck `audioUrl` trước khi gọi TTS
4. NFR-04: `npx tsc --noEmit` xanh sau mỗi phase
5. NFR-05: Joi validation cho tất cả env vars mới — app **không** start nếu `GOOGLE_TTS_ENABLED=true` mà thiếu credentials

### Phụ thuộc
- DEP-01: `@google-cloud/text-to-speech` — **chưa có** → cài ở Phase 0
- DEP-02: `@aws-sdk/client-s3` — **chưa có** → cài ở Phase 0
- DEP-03: `@nestjs/bull` + `bull` — **đã có** trong `package.json`
- DEP-04: `PrismaService` — **đã có**, inject qua DI
- DEP-05: `VocabularyService.upsertBulk()` — **đã có** (TICKET-007)
- DEP-06: `User.ttsVoiceGender` field — **chưa có** → migration ở Phase 1

### Cách tiếp cận
> **Phase-by-phase từ DB → Config → Services → Module wiring → Frontend.** Mỗi phase độc lập và có thể verify bằng `tsc --noEmit`. TTS và R2 tách thành 2 service riêng để dễ test và swap. Bull queue dùng cho eager async, lazy sync dùng cho fallback khi học.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa | `apps/backend/prisma/schema.prisma` | Thêm `ttsVoiceGender` vào model `User` |
| Tạo | `apps/backend/prisma/migrations/.../migration.sql` | Auto-generated bởi Prisma |
| Sửa | `apps/backend/src/config/config.module.ts` | Thêm Joi validation cho TTS + R2 env vars |
| Tạo | `apps/backend/src/modules/vocabulary/voice-map.constants.ts` | Language code → Google TTS voice mapping |
| Tạo | `apps/backend/src/modules/vocabulary/tts.service.ts` | Google Cloud TTS client, `synthesize()` method |
| Tạo | `apps/backend/src/modules/vocabulary/r2-storage.service.ts` | Cloudflare R2 upload via S3 SDK |
| Tạo | `apps/backend/src/modules/vocabulary/tts-audio.processor.ts` | Bull processor job `tts-generate` |
| Sửa | `apps/backend/src/modules/vocabulary/vocabulary.service.ts` | Thêm `getAudioUrl()`, `previewTts()`, dispatch job trong `create()` + `upsertBulk()` |
| Sửa | `apps/backend/src/modules/vocabulary/vocabulary.controller.ts` | Thêm `GET /:id/audio`, `POST /tts-preview` |
| Sửa | `apps/backend/src/modules/vocabulary/vocabulary.module.ts` | Import `BullModule`, register `TtsService`, `R2StorageService`, `TtsAudioProcessor` |
| Sửa | `apps/backend/src/modules/users/users.service.ts` | Thêm `getTtsPreferences()`, `updateTtsPreferences()` |
| Sửa | `apps/backend/src/modules/users/users.controller.ts` | Thêm `GET /me/tts-preferences`, `PATCH /me/tts-preferences` |
| Sửa | `apps/frontend/src/api/client.ts` | Thêm `vocabularyApi.getAudio()`, `vocabularyApi.ttsPreview()`, `userApi.getTtsPreferences()`, `userApi.updateTtsPreferences()` |
| Sửa | `apps/frontend/src/pages/ProfilePage.tsx` | Thêm TTS voice gender section (dropdown + preview button) |

---

## PLAN TODO

### Phase 0: Prerequisites

#### REQ-01: Cài packages

- [x] **TODO-0.1**: Cài `@google-cloud/text-to-speech` và `@aws-sdk/client-s3` vào backend
  - **File**: `apps/backend/package.json` (thay đổi gián tiếp qua npm)
  - **Context**: Đọc `apps/backend/package.json` — kiểm tra 2 package chưa có trong `dependencies`
  - **Thay đổi**: Chạy trong terminal:
    ```bash
    cd apps/backend && npm install @google-cloud/text-to-speech @aws-sdk/client-s3
    ```
  - **Verify**: Cả 2 package xuất hiện trong `dependencies` của `apps/backend/package.json`
  - **Kết quả**: `import { TextToSpeechClient } from '@google-cloud/text-to-speech'` và `import { S3Client } from '@aws-sdk/client-s3'` compile được

---

### Phase 1: Database Schema

#### REQ-06: Thêm ttsVoiceGender vào User

- [x] **TODO-1.1**: Thêm field `ttsVoiceGender` vào model `User` trong Prisma schema
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Đọc model `User` (lines 55–90) — tìm vị trí sau field `dailyGoal`
  - **Thay đổi**: Thêm 1 dòng vào model `User` sau `dailyGoal Int @default(10) @map("daily_goal")`:
    ```prisma
    ttsVoiceGender   String   @default("FEMALE") @map("tts_voice_gender")
    ```
  - **Verify**: Chạy `cd apps/backend && npx prisma validate` → exit 0, không lỗi
  - **Kết quả**: Schema hợp lệ, field mới sẵn sàng migrate

- [x] **TODO-1.2**: Chạy Prisma migration
  - **File**: `apps/backend/prisma/migrations/` (auto-generated)
  - **Context**: Schema đã validate ở TODO-1.1; DB đang chạy
  - **Thay đổi**: Chạy trong terminal:
    ```bash
    cd apps/backend && npx prisma migrate dev --name add_tts_voice_gender
    ```
  - **Verify**: Output có `✔ Generated Prisma Client`; migration file tạo cột `tts_voice_gender` trên bảng `users`
  - **Kết quả**: Cột `tts_voice_gender VARCHAR DEFAULT 'FEMALE'` tồn tại trong DB; Prisma Client được regenerate

---

### Phase 2: Config

#### REQ-01: Env vars validation

- [x] **TODO-2.1**: Thêm Joi validation cho TTS + R2 env vars vào config module
  - **File**: `apps/backend/src/config/config.module.ts`
  - **Context**: Đọc file hiện tại — xem pattern Joi validation cho `GEMINI_ENABLED` và `GEMINI_API_KEY` (conditional optional)
  - **Thay đổi**: Thêm các field sau vào `validationSchema` Joi object:
    ```typescript
    GOOGLE_TTS_ENABLED: Joi.boolean().default(false),
    GOOGLE_TTS_CREDENTIALS: Joi.string().allow('').optional(), // JSON string hoặc file path
    R2_ACCOUNT_ID: Joi.string().when('GOOGLE_TTS_ENABLED', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    R2_ACCESS_KEY_ID: Joi.string().when('GOOGLE_TTS_ENABLED', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    R2_SECRET_ACCESS_KEY: Joi.string().when('GOOGLE_TTS_ENABLED', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    R2_BUCKET_NAME: Joi.string().when('GOOGLE_TTS_ENABLED', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    R2_PUBLIC_URL: Joi.string().when('GOOGLE_TTS_ENABLED', { is: true, then: Joi.required(), otherwise: Joi.optional().allow('') }),
    ```
  - **Verify**: Chạy `cd apps/backend && npx tsc --noEmit` → không lỗi; start app với `.env` thiếu `R2_ACCOUNT_ID` khi `GOOGLE_TTS_ENABLED=true` → ValidationError
  - **Kết quả**: App không start nếu TTS enabled mà thiếu config; env vars type-safe

---

### Phase 3: Backend Services

#### REQ-05: Language → voice mapping

- [x] **TODO-3.1**: Tạo file constants `voice-map.constants.ts` với mapping language code → Google TTS voice
  - **File**: `apps/backend/src/modules/vocabulary/voice-map.constants.ts` **(tạo mới)**
  - **Context**: Không cần đọc file khác — tạo hoàn toàn mới
  - **Thay đổi**: Tạo file với nội dung:
    ```typescript
    import { protos } from '@google-cloud/text-to-speech';
    type SsmlVoiceGender = protos.google.cloud.texttospeech.v1.SsmlVoiceGender;

    export interface VoiceConfig {
      languageCode: string; // BCP-47: 'en-US', 'vi-VN'
      name: string;         // Google TTS voice name
      ssmlGender: SsmlVoiceGender;
    }

    const GENDER_MALE = 1 as SsmlVoiceGender;   // MALE
    const GENDER_FEMALE = 2 as SsmlVoiceGender; // FEMALE

    const VOICE_MAP: Record<string, { MALE: VoiceConfig; FEMALE: VoiceConfig }> = {
      en: {
        MALE:   { languageCode: 'en-US', name: 'en-US-Neural2-D', ssmlGender: GENDER_MALE },
        FEMALE: { languageCode: 'en-US', name: 'en-US-Neural2-F', ssmlGender: GENDER_FEMALE },
      },
      vi: {
        MALE:   { languageCode: 'vi-VN', name: 'vi-VN-Neural2-D', ssmlGender: GENDER_MALE },
        FEMALE: { languageCode: 'vi-VN', name: 'vi-VN-Neural2-A', ssmlGender: GENDER_FEMALE },
      },
      ja: {
        MALE:   { languageCode: 'ja-JP', name: 'ja-JP-Neural2-C', ssmlGender: GENDER_MALE },
        FEMALE: { languageCode: 'ja-JP', name: 'ja-JP-Neural2-B', ssmlGender: GENDER_FEMALE },
      },
      ko: {
        MALE:   { languageCode: 'ko-KR', name: 'ko-KR-Neural2-C', ssmlGender: GENDER_MALE },
        FEMALE: { languageCode: 'ko-KR', name: 'ko-KR-Neural2-A', ssmlGender: GENDER_FEMALE },
      },
      zh: {
        MALE:   { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-C', ssmlGender: GENDER_MALE },
        FEMALE: { languageCode: 'cmn-CN', name: 'cmn-CN-Wavenet-A', ssmlGender: GENDER_FEMALE },
      },
      fr: {
        MALE:   { languageCode: 'fr-FR', name: 'fr-FR-Neural2-B', ssmlGender: GENDER_MALE },
        FEMALE: { languageCode: 'fr-FR', name: 'fr-FR-Neural2-A', ssmlGender: GENDER_FEMALE },
      },
      de: {
        MALE:   { languageCode: 'de-DE', name: 'de-DE-Neural2-B', ssmlGender: GENDER_MALE },
        FEMALE: { languageCode: 'de-DE', name: 'de-DE-Neural2-F', ssmlGender: GENDER_FEMALE },
      },
    };

    const FALLBACK: { MALE: VoiceConfig; FEMALE: VoiceConfig } = VOICE_MAP['en'];

    export function getVoiceConfig(langCode: string, gender: 'MALE' | 'FEMALE'): VoiceConfig {
      const map = VOICE_MAP[langCode.toLowerCase()] ?? FALLBACK;
      return map[gender];
    }
    ```
  - **Verify**: `npx tsc --noEmit` → không lỗi
  - **Kết quả**: Hàm `getVoiceConfig('vi', 'FEMALE')` trả đúng config; fallback về `en-US` nếu langCode chưa có

#### REQ-02: TTS Service

- [x] **TODO-3.2**: Tạo `TtsService` — Google Cloud TTS client wrapper
  - **File**: `apps/backend/src/modules/vocabulary/tts.service.ts` **(tạo mới)**
  - **Context**: Đọc `apps/backend/src/modules/ai/ai.service.ts` lines 1–50 — xem pattern `OnModuleInit`, `ConfigService.get()`, lazy client init; đọc `voice-map.constants.ts` vừa tạo
  - **Thay đổi**: Tạo `@Injectable() TtsService` với:
    ```typescript
    import { Injectable, Logger, OnModuleInit, ServiceUnavailableException } from '@nestjs/common';
    import { ConfigService } from '@nestjs/config';
    import { TextToSpeechClient } from '@google-cloud/text-to-speech';
    import { getVoiceConfig } from './voice-map.constants';

    @Injectable()
    export class TtsService implements OnModuleInit {
      private readonly logger = new Logger(TtsService.name);
      private client: TextToSpeechClient | null = null;
      private readonly enabled: boolean;

      constructor(private readonly config: ConfigService) {
        this.enabled = this.config.get<boolean>('GOOGLE_TTS_ENABLED', false);
      }

      onModuleInit() {
        if (!this.enabled) return;
        const credentials = this.config.get<string>('GOOGLE_TTS_CREDENTIALS');
        try {
          // Hỗ trợ inline JSON hoặc file path
          const clientConfig = credentials?.startsWith('{')
            ? { credentials: JSON.parse(credentials) }
            : {}; // dùng GOOGLE_APPLICATION_CREDENTIALS env nếu là file path
          this.client = new TextToSpeechClient(clientConfig);
          this.logger.log('TTS client initialized');
        } catch (err) {
          this.logger.error('Failed to initialize TTS client', err);
        }
      }

      async synthesize(term: string, langCode: string, gender: 'MALE' | 'FEMALE' = 'FEMALE'): Promise<Buffer> {
        if (!this.enabled || !this.client) {
          throw new ServiceUnavailableException('TTS is disabled');
        }
        if (!term || term.length > 500) throw new Error('Invalid term length');

        const voice = getVoiceConfig(langCode, gender);
        const [response] = await this.client.synthesizeSpeech({
          input: { text: term },
          voice: { languageCode: voice.languageCode, name: voice.name, ssmlGender: voice.ssmlGender },
          audioConfig: { audioEncoding: 'MP3' },
        });
        if (!response.audioContent) throw new Error('TTS returned empty buffer');
        return Buffer.from(response.audioContent as Uint8Array);
      }

      get isEnabled(): boolean { return this.enabled; }
    }
    ```
  - **Verify**: `npx tsc --noEmit` → không lỗi
  - **Kết quả**: `TtsService.synthesize('apple', 'en', 'FEMALE')` trả `Buffer` MP3 khi TTS enabled; throw `ServiceUnavailableException` khi disabled

#### REQ-03: R2 Storage Service

- [x] **TODO-3.3**: Tạo `R2StorageService` — Cloudflare R2 upload via S3-compatible SDK
  - **File**: `apps/backend/src/modules/vocabulary/r2-storage.service.ts` **(tạo mới)**
  - **Context**: Đọc `apps/backend/src/config/config.module.ts` — xem cách `ConfigService.get()` dùng; không cần đọc file khác
  - **Thay đổi**: Tạo `@Injectable() R2StorageService` với:
    ```typescript
    import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
    import { ConfigService } from '@nestjs/config';
    import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';

    @Injectable()
    export class R2StorageService implements OnModuleInit {
      private readonly logger = new Logger(R2StorageService.name);
      private client: S3Client | null = null;
      private bucket = '';
      private publicUrl = '';

      constructor(private readonly config: ConfigService) {}

      onModuleInit() {
        const enabled = this.config.get<boolean>('GOOGLE_TTS_ENABLED', false);
        if (!enabled) return;
        const accountId = this.config.getOrThrow<string>('R2_ACCOUNT_ID');
        this.bucket = this.config.getOrThrow<string>('R2_BUCKET_NAME');
        this.publicUrl = this.config.getOrThrow<string>('R2_PUBLIC_URL');
        this.client = new S3Client({
          region: 'auto',
          endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: this.config.getOrThrow<string>('R2_ACCESS_KEY_ID'),
            secretAccessKey: this.config.getOrThrow<string>('R2_SECRET_ACCESS_KEY'),
          },
        });
        this.logger.log('R2 client initialized');
      }

      /** Upload MP3 buffer lên R2. Nếu key đã tồn tại thì skip và trả URL luôn. */
      async upload(key: string, buffer: Buffer): Promise<string> {
        if (!this.client) throw new Error('R2 client not initialized');
        // Check tồn tại trước để tránh gọi upload trùng
        try {
          await this.client.send(new HeadObjectCommand({ Bucket: this.bucket, Key: key }));
          return `${this.publicUrl}/${key}`; // đã tồn tại
        } catch {
          // không tồn tại → upload
        }
        await this.client.send(new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: 'audio/mpeg',
        }));
        return `${this.publicUrl}/${key}`;
      }
    }
    ```
  - **Verify**: `npx tsc --noEmit` → không lỗi
  - **Kết quả**: `R2StorageService.upload('tts/vocab-id.mp3', buffer)` upload file và trả URL; gọi lần 2 cùng key thì skip upload

---

### Phase 4: Vocabulary Module

#### REQ-04: Audio endpoint (lazy)

- [x] **TODO-4.1**: Thêm method `getAudioUrl()` vào `VocabularyService`
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.service.ts`
  - **Context**: Đọc `findOne()` (lines 113–120) — xem pattern query; đọc `tts.service.ts` và `r2-storage.service.ts` vừa tạo để biết method signature
  - **Thay đổi**: Thêm method sau `findOne()`:
    ```typescript
    async getAudioUrl(vocabId: string, userId: string): Promise<{ audioUrl: string | null; reason?: string }> {
      const vocab = await this.prisma.vocabularyBase.findUniqueOrThrow({
        where: { id: vocabId },
        include: { language: true },
      });
      // Cache hit
      if (vocab.audioUrl) return { audioUrl: vocab.audioUrl };
      // TTS disabled
      if (!this.ttsService.isEnabled) return { audioUrl: null, reason: 'tts_disabled' };
      // Lấy voice gender của user
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ttsVoiceGender: true } });
      const gender = (user.ttsVoiceGender as 'MALE' | 'FEMALE') ?? 'FEMALE';
      // Generate TTS + upload R2
      const mp3 = await this.ttsService.synthesize(vocab.term, vocab.language.code, gender);
      const key = `tts/${vocabId}.mp3`;
      const url = await this.r2Storage.upload(key, mp3);
      // Save to DB
      await this.prisma.vocabularyBase.update({ where: { id: vocabId }, data: { audioUrl: url } });
      return { audioUrl: url };
    }
    ```
    Cũng inject `TtsService` và `R2StorageService` vào constructor:
    ```typescript
    constructor(
      private readonly prisma: PrismaService,
      private readonly ttsService: TtsService,
      private readonly r2Storage: R2StorageService,
      @InjectQueue('tts') private readonly ttsQueue: Queue,
    ) {}
    ```
  - **Verify**: `npx tsc --noEmit` → không lỗi (có thể có lỗi vì chưa import đủ — sẽ fix khi wiring module)
  - **Kết quả**: Logic cache-first hoàn chỉnh; DB hit không gọi TTS

- [x] **TODO-4.2**: Thêm method `previewTts()` vào `VocabularyService`
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.service.ts`
  - **Context**: Đọc `getAudioUrl()` vừa thêm — cùng pattern nhưng không cache, dùng gender thật của user
  - **Thay đổi**: Thêm method sau `getAudioUrl()`:
    ```typescript
    async previewTts(term: string, langCode: string, userId: string): Promise<Buffer> {
      if (!this.ttsService.isEnabled) throw new ServiceUnavailableException('TTS is disabled');
      const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { ttsVoiceGender: true } });
      const gender = (user.ttsVoiceGender as 'MALE' | 'FEMALE') ?? 'FEMALE';
      return this.ttsService.synthesize(term, langCode, gender);
    }
    ```
    Thêm import `ServiceUnavailableException` từ `@nestjs/common` nếu chưa có.
  - **Verify**: `npx tsc --noEmit` → không lỗi
  - **Kết quả**: Preview TTS realtime theo gender user, không ghi vào DB

#### REQ-04: Audio endpoint (controller)

- [x] **TODO-4.3**: Thêm 2 endpoint `GET /:id/audio` và `POST /tts-preview` vào `VocabularyController`
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.controller.ts`
  - **Context**: Đọc `vocabulary.controller.ts` hiện tại — xem pattern `@CurrentUser()`, `@Param()`, `@Body()`, `@Res()`
  - **Thay đổi**: Thêm 2 method sau endpoint `addToMyList()`:
    ```typescript
    @Get(':id/audio')
    @ApiOperation({ summary: 'Get or generate TTS audio URL for vocabulary' })
    getAudio(@Param('id') id: string, @CurrentUser() user: AuthUser) {
      return this.svc.getAudioUrl(id, user.id);
    }

    @Post('tts-preview')
    @ApiOperation({ summary: 'Preview TTS audio realtime (no cache)' })
    @HttpCode(HttpStatus.OK)
    async ttsPreview(
      @Body() dto: TtsPreviewDto,
      @CurrentUser() user: AuthUser,
      @Res() res: Response,
    ) {
      const buffer = await this.svc.previewTts(dto.term, dto.languageCode, user.id);
      res.set({ 'Content-Type': 'audio/mpeg', 'Content-Length': buffer.length });
      res.send(buffer);
    }
    ```
    Thêm `TtsPreviewDto` class (inline trong file này hoặc thêm vào `vocabulary.dto.ts`):
    ```typescript
    class TtsPreviewDto {
      @IsString() @MinLength(1) @MaxLength(500) term: string;
      @IsString() languageCode: string;
    }
    ```
    Thêm các import thiếu: `Res`, `Response` từ `express`, `MinLength`, `MaxLength` từ `class-validator`.
  - **Verify**: `npx tsc --noEmit` → không lỗi
  - **Kết quả**: 2 endpoint khai báo đúng; controller không chứa logic

#### REQ-07: Bull processor (eager generation)

- [x] **TODO-4.4**: Tạo Bull processor `TtsAudioProcessor`
  - **File**: `apps/backend/src/modules/vocabulary/tts-audio.processor.ts` **(tạo mới)**
  - **Context**: Đọc `apps/backend/src/modules/ai/ai.service.ts` — xem pattern Logger; đọc `tts.service.ts` và `r2-storage.service.ts` — biết method signature
  - **Thay đổi**: Tạo file:
    ```typescript
    import { Processor, Process } from '@nestjs/bull';
    import { Logger } from '@nestjs/common';
    import { Job } from 'bull';
    import { PrismaService } from '../../prisma/prisma.service';
    import { TtsService } from './tts.service';
    import { R2StorageService } from './r2-storage.service';

    export interface TtsGenerateJob {
      vocabularyBaseId: string;
      term: string;
      languageCode: string;
    }

    @Processor('tts')
    export class TtsAudioProcessor {
      private readonly logger = new Logger(TtsAudioProcessor.name);

      constructor(
        private readonly ttsService: TtsService,
        private readonly r2Storage: R2StorageService,
        private readonly prisma: PrismaService,
      ) {}

      @Process('tts-generate')
      async handleGenerate(job: Job<TtsGenerateJob>): Promise<void> {
        const { vocabularyBaseId, term, languageCode } = job.data;
        // Deduplication: recheck trước khi gọi TTS
        const vocab = await this.prisma.vocabularyBase.findUnique({ where: { id: vocabularyBaseId } });
        if (!vocab || vocab.audioUrl) return; // đã có audio hoặc bị xóa
        try {
          const mp3 = await this.ttsService.synthesize(term, languageCode, 'FEMALE');
          const key = `tts/${vocabularyBaseId}.mp3`;
          const url = await this.r2Storage.upload(key, mp3);
          await this.prisma.vocabularyBase.update({ where: { id: vocabularyBaseId }, data: { audioUrl: url } });
          this.logger.log(`TTS generated for vocab ${vocabularyBaseId}`);
        } catch (err) {
          this.logger.error(`TTS generation failed for ${vocabularyBaseId}`, err);
          throw err; // re-throw để Bull retry
        }
      }
    }
    ```
  - **Verify**: `npx tsc --noEmit` → không lỗi
  - **Kết quả**: Processor lắng nghe queue `tts`, job `tts-generate`; deduplication recheck; lỗi retry tự động

#### REQ-07: Dispatch eager job trong VocabularyService

- [x] **TODO-4.5**: Thêm dispatch Bull job sau `create()` trong `VocabularyService`
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.service.ts`
  - **Context**: Đọc `create()` method (lines 23–44) — xem return value là full vocab object với `language`
  - **Thay đổi**: Sửa `create()` — sau `return await this.prisma.vocabularyBase.create(...)`, extract result vào biến, dispatch job nếu `audioUrl == null`, rồi return:
    ```typescript
    const result = await this.prisma.vocabularyBase.create({ ... });
    if (!result.audioUrl && this.ttsService.isEnabled) {
      try {
        await this.ttsQueue.add('tts-generate', {
          vocabularyBaseId: result.id,
          term: result.term,
          languageCode: (result as typeof result & { language: { code: string } }).language?.code ?? 'en',
        });
      } catch (e) {
        this.logger.warn(`Failed to dispatch TTS job for ${result.id}`, e);
      }
    }
    return result;
    ```
    Yêu cầu `create()` include `language` trong query (đã có) và thêm `private readonly logger = new Logger(VocabularyService.name)`.
  - **Verify**: `npx tsc --noEmit` → không lỗi
  - **Kết quả**: Mỗi từ mới được tạo sẽ tự động dispatch job TTS nếu TTS enabled và audioUrl chưa có

- [x] **TODO-4.6**: Thêm dispatch Bull job sau từng từ trong `upsertBulk()` trong `VocabularyService`
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.service.ts`
  - **Context**: Đọc `upsertBulk()` (lines ~160–223) — xem vòng lặp create/update; biết `languageId` và `languageCode` cần lấy từ DB trước
  - **Thay đổi**: Trong vòng lặp `upsertBulk()`, sau khi có `vocab.id` và `vocab.term`:
    - Query `language.code` từ `languageId` (1 lần ngoài vòng lặp để tránh N+1):
      ```typescript
      // Trước vòng lặp for:
      const language = await this.prisma.language.findUniqueOrThrow({ where: { id: languageId }, select: { code: true } });
      ```
    - Sau mỗi upsert, kiểm tra `audioUrl` của record và dispatch job nếu null:
      ```typescript
      const existingAudioUrl = existing?.audioUrl ?? null;
      if (!existingAudioUrl && this.ttsService.isEnabled) {
        try {
          await this.ttsQueue.add('tts-generate', {
            vocabularyBaseId: vocab.id, term: vocab.term, languageCode: language.code,
          });
        } catch (e) {
          this.logger.warn(`Failed to dispatch TTS job for ${vocab.id}`, e);
        }
      }
      ```
  - **Verify**: `npx tsc --noEmit` → không lỗi
  - **Kết quả**: Batch upsert (từ AI path generation) cũng tự dispatch TTS jobs; từ đã có audioUrl thì không dispatch

#### REQ-01: Module wiring

- [x] **TODO-4.7**: Update `VocabularyModule` — import BullModule + register providers mới
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.module.ts`
  - **Context**: Đọc `apps/backend/src/modules/paths/paths.module.ts` — xem cách import `AiModule`, `VocabularyModule`; đọc `app.module.ts` — xem cách `BullModule.forRootAsync` được setup globally
  - **Thay đổi**: Thay toàn bộ nội dung file:
    ```typescript
    import { Module } from '@nestjs/common';
    import { BullModule } from '@nestjs/bull';
    import { VocabularyController } from './vocabulary.controller';
    import { VocabularyService } from './vocabulary.service';
    import { TtsService } from './tts.service';
    import { R2StorageService } from './r2-storage.service';
    import { TtsAudioProcessor } from './tts-audio.processor';

    @Module({
      imports: [
        BullModule.registerQueue({ name: 'tts' }),
      ],
      controllers: [VocabularyController],
      providers: [VocabularyService, TtsService, R2StorageService, TtsAudioProcessor],
      exports: [VocabularyService],
    })
    export class VocabularyModule {}
    ```
  - **Verify**: `npx tsc --noEmit` → không lỗi
  - **Kết quả**: DI hoàn chỉnh; `TtsService`, `R2StorageService`, `TtsAudioProcessor` được inject đúng; queue `tts` được đăng ký

---

### Phase 5: Users Module

#### REQ-06: TTS preferences backend

- [x] **TODO-5.1**: Thêm `getTtsPreferences()` và `updateTtsPreferences()` vào `UsersService`
  - **File**: `apps/backend/src/modules/users/users.service.ts`
  - **Context**: Đọc `getProfile()` (lines 13–46) — xem pattern `prisma.user.findUniqueOrThrow`; đọc `updateProfile()` — xem pattern update
  - **Thay đổi**: Thêm 2 method mới sau `addLearningLanguage()`:
    ```typescript
    async getTtsPreferences(userId: string): Promise<{ ttsVoiceGender: string }> {
      const user = await this.prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: { ttsVoiceGender: true },
      });
      return { ttsVoiceGender: user.ttsVoiceGender };
    }

    async updateTtsPreferences(userId: string, ttsVoiceGender: 'MALE' | 'FEMALE'): Promise<{ ttsVoiceGender: string }> {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: { ttsVoiceGender },
        select: { ttsVoiceGender: true },
      });
      return { ttsVoiceGender: user.ttsVoiceGender };
    }
    ```
  - **Verify**: `npx tsc --noEmit` → không lỗi
  - **Kết quả**: 2 method service sẵn sàng, type-safe

- [x] **TODO-5.2**: Thêm DTO + 2 endpoint TTS preferences vào `UsersController`
  - **File**: `apps/backend/src/modules/users/users.controller.ts`
  - **Context**: Đọc `users.controller.ts` hiện tại — xem pattern `@Get('me')`, `@Patch('me')`, `@CurrentUser()`
  - **Thay đổi**: Thêm DTO class (inline trên `UsersController`):
    ```typescript
    class UpdateTtsPreferencesDto {
      @IsIn(['MALE', 'FEMALE']) ttsVoiceGender: 'MALE' | 'FEMALE';
    }
    ```
    Thêm 2 endpoint sau `addLanguage()`:
    ```typescript
    @Get('me/tts-preferences')
    @ApiOperation({ summary: 'Get TTS voice preferences' })
    getTtsPreferences(@CurrentUser() user: AuthUser) {
      return this.usersService.getTtsPreferences(user.id);
    }

    @Patch('me/tts-preferences')
    @ApiOperation({ summary: 'Update TTS voice gender preference' })
    updateTtsPreferences(@CurrentUser() user: AuthUser, @Body() dto: UpdateTtsPreferencesDto) {
      return this.usersService.updateTtsPreferences(user.id, dto.ttsVoiceGender);
    }
    ```
    Thêm `IsIn` vào import `class-validator`.
  - **Verify**: `npx tsc --noEmit` → không lỗi
  - **Kết quả**: `GET /api/v1/users/me/tts-preferences` và `PATCH /api/v1/users/me/tts-preferences` hoạt động

---

### Phase 6: Frontend

#### REQ-06 + REQ-04: API client

- [x] **TODO-6.1**: Thêm TTS methods vào `vocabularyApi` trong `api/client.ts`
  - **File**: `apps/frontend/src/api/client.ts`
  - **Context**: Đọc `vocabularyApi` block (lines ~81–95) — xem pattern `apiClient.get/post`
  - **Thay đổi**: Thêm 2 method vào `vocabularyApi`:
    ```typescript
    getAudio: (id: string) =>
      apiClient.get<{ audioUrl: string | null; reason?: string }>(`/vocabulary/${id}/audio`).then((r) => r.data),
    ttsPreview: (data: { term: string; languageCode: string }) =>
      apiClient.post('/vocabulary/tts-preview', data, { responseType: 'arraybuffer' }).then((r) => r.data as ArrayBuffer),
    ```
  - **Verify**: `npx tsc --noEmit` trong `apps/frontend` → không lỗi
  - **Kết quả**: `vocabularyApi.getAudio(id)` và `vocabularyApi.ttsPreview(...)` sẵn sàng import

- [x] **TODO-6.2**: Thêm TTS preferences methods vào `userApi` trong `api/client.ts`
  - **File**: `apps/frontend/src/api/client.ts`
  - **Context**: Đọc `userApi` block (lines ~56–70) — xem pattern
  - **Thay đổi**: Thêm 2 method vào `userApi`:
    ```typescript
    getTtsPreferences: () =>
      apiClient.get<{ ttsVoiceGender: string }>('/users/me/tts-preferences').then((r) => r.data),
    updateTtsPreferences: (data: { ttsVoiceGender: 'MALE' | 'FEMALE' }) =>
      apiClient.patch<{ ttsVoiceGender: string }>('/users/me/tts-preferences', data).then((r) => r.data),
    ```
  - **Verify**: `npx tsc --noEmit` trong `apps/frontend` → không lỗi
  - **Kết quả**: `userApi.getTtsPreferences()` và `userApi.updateTtsPreferences(...)` sẵn sàng

#### REQ-06: Profile page TTS section

- [x] **TODO-6.3**: Thêm TTS voice settings section vào `ProfilePage.tsx`
  - **File**: `apps/frontend/src/pages/ProfilePage.tsx`
  - **Context**: Đọc `ProfilePage.tsx` lines 1–80 — xem state management pattern (`useState`, `useEffect`), UI pattern với `className`, import style dùng Tailwind
  - **Thay đổi**:
    1. Thêm state: `const [voiceGender, setVoiceGender] = useState<'MALE' | 'FEMALE'>('FEMALE')` và `const [previewLoading, setPreviewLoading] = useState(false)`
    2. Trong `useEffect` đầu (hoặc tạo mới), load preference: `userApi.getTtsPreferences().then(d => setVoiceGender(d.ttsVoiceGender as 'MALE' | 'FEMALE'))`
    3. Handler `handleSaveVoice`: gọi `userApi.updateTtsPreferences({ ttsVoiceGender: voiceGender })`
    4. Handler `handlePreviewVoice`: gọi `vocabularyApi.ttsPreview({ term: 'Hello', languageCode: user?.nativeLanguageCode ?? 'en' })` → tạo `AudioContext` từ `ArrayBuffer` → play
    5. Thêm JSX section sau block "Native Language":
      ```tsx
      {/* TTS Voice Settings */}
      <div className="bg-[#1E293B] rounded-2xl p-4 space-y-3">
        <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wide">Voice Settings</h3>
        <div className="flex items-center gap-3">
          <select value={voiceGender} onChange={e => setVoiceGender(e.target.value as 'MALE' | 'FEMALE')}
            className="flex-1 bg-[#0F172A] text-[#F1F5F9] rounded-lg px-3 py-2 border border-[#334155]">
            <option value="FEMALE">Female</option>
            <option value="MALE">Male</option>
          </select>
          <button onClick={handlePreviewVoice} disabled={previewLoading}
            className="px-4 py-2 bg-[#6366F1] text-white rounded-lg text-sm disabled:opacity-50">
            {previewLoading ? '...' : '▶ Preview'}
          </button>
          <button onClick={handleSaveVoice}
            className="px-4 py-2 bg-[#10B981] text-white rounded-lg text-sm">
            Save
          </button>
        </div>
      </div>
      ```
  - **Verify**: `npx tsc --noEmit` trong `apps/frontend` → không lỗi
  - **Kết quả**: Profile page có section Voice Settings với dropdown Male/Female, nút Preview phát âm, nút Save lưu preference

---

### Phase 7: Integration & Verification

- [x] **TODO-7.1**: Build backend kiểm tra compile
  - **File**: N/A (terminal command)
  - **Thay đổi**: Chạy `cd apps/backend && npx tsc --noEmit && npm run build`
  - **Verify**: Exit code 0, không có lỗi TypeScript, `dist/` được tạo
  - **Kết quả**: Toàn bộ backend compile sạch

- [x] **TODO-7.2**: TypeScript strict check frontend
  - **File**: N/A (terminal command)
  - **Thay đổi**: Chạy `cd apps/frontend && npx tsc --noEmit`
  - **Verify**: Exit code 0, không có type error mới
  - **Kết quả**: Frontend types sạch

- [ ] **TODO-7.3**: Smoke test flow lazy audio
  - **File**: N/A (manual test với server đang chạy)
  - **Thay đổi**: Test sequence:
    1. Login → lấy JWT token
    2. `GET /api/v1/vocabulary` — lấy 1 `vocabId` có `audioUrl: null`
    3. `GET /api/v1/vocabulary/{vocabId}/audio` — lần đầu: expect TTS generate + trả URL
    4. `GET /api/v1/vocabulary/{vocabId}/audio` — lần 2: expect cùng URL, không gọi TTS (cache hit)
  - **Verify**: Response đúng format `{ audioUrl: "https://..." }`; URL trỏ đến MP3 playable
  - **Kết quả**: Lazy flow hoạt động end-to-end

- [ ] **TODO-7.4**: Smoke test TTS preferences
  - **File**: N/A (manual test)
  - **Thay đổi**: Test sequence:
    1. `PATCH /api/v1/users/me/tts-preferences` với `{ ttsVoiceGender: "MALE" }` → expect `{ ttsVoiceGender: "MALE" }`
    2. `GET /api/v1/users/me/tts-preferences` → expect `{ ttsVoiceGender: "MALE" }`
    3. `POST /api/v1/vocabulary/tts-preview` với `{ term: "hello", languageCode: "en" }` → expect MP3 binary response
  - **Verify**: Responses đúng format; audio preview phát được trong trình duyệt
  - **Kết quả**: Full preferences + preview flow hoạt động

---

## Ghi chú triển khai
- `BullModule.registerQueue({ name: 'tts' })` chỉ cần trong `VocabularyModule` — `BullModule.forRootAsync` đã được config globally trong `AppModule` với Redis connection
- `ttsVoiceGender` trên `User` là **preference toàn cục** — preview dùng gender thật; cached `audioUrl` dùng `FEMALE` mặc định để tránh bùng nổ số lượng file cache
- `TtsPreviewDto` có thể đặt inline trong `vocabulary.controller.ts` hoặc thêm vào `vocabulary.dto.ts` — ưu tiên thêm vào `vocabulary.dto.ts` để đúng pattern
- Nếu `GOOGLE_TTS_ENABLED=false`, tất cả TTS call return `{ audioUrl: null, reason: 'tts_disabled' }` — frontend phải handle gracefully (ẩn nút play hoặc hiện tooltip)

## Rủi ro cần theo dõi
- [x] Risk-1: `@aws-sdk/client-s3` kéo theo nhiều transitive deps — verify `npm install` không break build ✅
- [ ] Risk-2: Google TTS `vi-VN-Neural2-D` có thể chưa available ở mọi region — test thực tế; fallback sang `vi-VN-Wavenet-B` nếu cần
- [ ] Risk-3: `AudioContext.decodeAudioData` trong browser cần HTTPS — đảm bảo R2 public URL dùng HTTPS
- [x] Risk-4: `upsertBulk()` language query thêm 1 DB call ngoài vòng lặp — không ảnh hưởng perf vì chỉ 1 query cho toàn batch ✅

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Tích hợp Google Cloud TTS + Cloudflare R2 với chiến lược cache-first: audio được generate eager (Bull job async sau khi tạo từ) và lazy fallback (sync khi học). User cấu hình voice gender trong Profile và nghe thử realtime. Backend build sạch, TypeScript check frontend đạt.

### Thống kê
- **Tổng TODO**: 22
- **Hoàn thành**: 20 ✅
- **Pending**: 2 ⏳ (smoke tests 7.3 & 7.4 — cần server + TTS credentials thực)

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-0.1 | Install packages | ✅ Done | Node 22 broken (icu4c), dùng nvm v23.7.0 |
| TODO-1.1 | Add ttsVoiceGender to schema | ✅ Done | |
| TODO-1.2 | Run Prisma migration | ✅ Done | DB port 5433 (docker-compose), dùng DATABASE_URL override |
| TODO-2.1 | Add Joi env vars config | ✅ Done | 7 env vars mới, conditional required khi TTS_ENABLED=true |
| TODO-3.1 | Create voice-map.constants.ts | ✅ Done | Dùng số nguyên (1/2) thay vì import protos type |
| TODO-3.2 | Create TtsService | ✅ Done | |
| TODO-3.3 | Create R2StorageService | ✅ Done | HeadObject dedup + PutObject |
| TODO-4.1 | Add getAudioUrl() | ✅ Done | Cache-first, lazy TTS on miss |
| TODO-4.2 | Add previewTts() | ✅ Done | No cache, user gender |
| TODO-4.3 | Add endpoints to controller | ✅ Done | GET /:id/audio trước GET /:id (route order) |
| TODO-4.4 | Create TtsAudioProcessor | ✅ Done | Dedup recheck trước khi gọi TTS |
| TODO-4.5 | Dispatch job in create() | ✅ Done | try/catch không crash API |
| TODO-4.6 | Dispatch job in upsertBulk() | ✅ Done | language query 1 lần ngoài loop; audioUrl trong findFirst select |
| TODO-4.7 | Update VocabularyModule | ✅ Done | BullModule.registerQueue('tts') + 3 providers |
| TODO-5.1 | Add TTS methods to UsersService | ✅ Done | |
| TODO-5.2 | Add endpoints to UsersController | ✅ Done | UpdateTtsPreferencesDto inline |
| TODO-6.1 | Add vocabularyApi methods | ✅ Done | getAudio + ttsPreview (arraybuffer) |
| TODO-6.2 | Add userApi TTS preferences | ✅ Done | |
| TODO-6.3 | Add Voice Settings to ProfilePage | ✅ Done | AudioContext for preview playback |
| TODO-7.1 | Build backend | ✅ Done | `nest build` exit 0 |
| TODO-7.2 | TypeScript check frontend | ✅ Done | `tsc --noEmit` exit 0 |
| TODO-7.3 | Smoke test lazy audio flow | ⏳ Pending | Cần server + TTS credentials |
| TODO-7.4 | Smoke test TTS preferences | ⏳ Pending | Cần server + TTS credentials |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/backend/package.json` | Modified | `@google-cloud/text-to-speech`, `@aws-sdk/client-s3` |
| `apps/backend/prisma/schema.prisma` | Modified | `ttsVoiceGender String @default("FEMALE")` trên User |
| `apps/backend/prisma/migrations/20260302152036_add_tts_voice_gender/` | Created | Auto-generated migration |
| `apps/backend/src/config/config.module.ts` | Modified | 7 Joi env vars mới |
| `apps/backend/src/modules/vocabulary/voice-map.constants.ts` | Created | Language → TTS voice mapping |
| `apps/backend/src/modules/vocabulary/tts.service.ts` | Created | TtsService + synthesize() |
| `apps/backend/src/modules/vocabulary/r2-storage.service.ts` | Created | R2StorageService + upload() |
| `apps/backend/src/modules/vocabulary/tts-audio.processor.ts` | Created | Bull processor tts-generate |
| `apps/backend/src/modules/vocabulary/vocabulary.service.ts` | Modified | getAudioUrl, previewTts, TTS job dispatch |
| `apps/backend/src/modules/vocabulary/vocabulary.controller.ts` | Modified | GET :id/audio, POST tts-preview |
| `apps/backend/src/modules/vocabulary/dto/vocabulary.dto.ts` | Modified | TtsPreviewDto class |
| `apps/backend/src/modules/vocabulary/vocabulary.module.ts` | Modified | BullModule + 3 new providers |
| `apps/backend/src/modules/users/users.service.ts` | Modified | getTtsPreferences, updateTtsPreferences |
| `apps/backend/src/modules/users/users.controller.ts` | Modified | GET/PATCH me/tts-preferences |
| `apps/frontend/src/api/client.ts` | Modified | vocabularyApi + userApi TTS methods |
| `apps/frontend/src/pages/ProfilePage.tsx` | Modified | Voice Settings section (dropdown + preview + save) |

### Verification
- [x] Build thành công: ✅ (`nest build` exit 0)
- [x] TypeScript backend: ✅ (`tsc -p tsconfig.build.json --noEmit` exit 0)
- [x] TypeScript frontend: ✅ (`tsc --noEmit` exit 0)
- [x] Migration: ✅ (`20260302152036_add_tts_voice_gender` applied)
- [ ] Smoke tests: ⏳ (cần TTS credentials + server running)

### Ghi chú
- **Node.js**: Node 22.0.0 broken do icu4c mismatch; dùng nvm v23.7.0
- **DB port**: `.env` có port 5434, docker-compose map 5433 — cần align
- **Route order**: `GET /vocabulary/:id/audio` đặt trước `GET /vocabulary/:id`
- **SsmlVoiceGender**: Dùng số nguyên thay vì import protos để tránh type complexity; cast `as never` tại synthesizeSpeech call

