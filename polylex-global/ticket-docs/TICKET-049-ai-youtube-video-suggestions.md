# TICKET-049 — AI YouTube Video Suggestions per Stage

## Yêu cầu gốc

Khi tạo một learning path, dùng AI (Gemini) phân tích nội dung học của từng stage (từ vựng, chủ đề, trình độ CEFR, ngôn ngữ đích) để sinh ra câu truy vấn tìm kiếm tối ưu, gọi YouTube Data API lấy video thật, rồi dùng AI xếp hạng lại để chọn các video phù hợp nhất về **trình độ** và **nội dung**. Video được generate sẵn ngay khi tạo path (giống Dialogue) và cache vào DB. Trên màn hình Path, mỗi stage có thêm một nút "Xem video" (tương tự nút "Xem hội thoại") dẫn tới một page riêng hiển thị danh sách video nhúng để user xem học thêm.

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-049 |
| **Tiêu đề** | AI YouTube Video Suggestions — gợi ý video học thêm per-stage |
| **Mục tiêu** | Gắn 3–5 video YouTube phù hợp trình độ/nội dung vào mỗi stage; generate sẵn khi tạo path; xem qua page riêng |
| **Phạm vi** | Backend: DB migration, YoutubeService, AiService (2 method), PathsService, PathsController · Frontend: VideosPage mới, StageRow, router · shared-types |
| **Độ ưu tiên** | Trung bình |
| **Quyết định đã chốt** | (1) Mức **stage**; (2) Không có user nhỏ tuổi nhưng vẫn `safeSearch=strict`; (3) Provider **Gemini**; (4) Generate **sẵn khi tạo path**; (5) **1 query/stage** + xin tăng quota; (6) Chỉ áp dụng cho **path tạo mới từ giờ** |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | DB: Bảng `path_stage_videos` | Model Prisma + migration lưu danh sách video per PathStage | DB | Nhỏ |
| REQ-02 | Backend: `YoutubeService` | Wrapper YouTube Data API v3 `search.list` với bộ lọc an toàn/embed/level | Backend | Trung bình |
| REQ-03 | AI: Sinh query + re-rank | 2 method Gemini: `generateVideoQuery()` và `rankVideos()` | Backend | Trung bình |
| REQ-04 | Backend: Generate video khi tạo path | Trong `PathsService.createFromAI()`, chạy song song fail-safe per stage | Backend | Trung bình |
| REQ-05 | API: Endpoint lấy video của stage | `GET /paths/stages/:pathStageId/videos` | REST API | Nhỏ |
| REQ-06 | shared-types: `VideoDto` + `hasVideos` | Bổ sung type và cờ vào `PathStageDto` | Shared | Nhỏ |
| REQ-07 | FE: Nút "Xem video" trên stage | Trong `StageRow.tsx`, thêm button dẫn `/videos/:pathStageId` | Frontend | Nhỏ |
| REQ-08 | FE: Màn hình `VideosPage` | Route `/videos/:pathStageId`, nhúng iframe YouTube + chip lý do AI | Frontend | Trung bình |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 ──> REQ-03 ──> REQ-04   (DB → YouTube → AI → tích hợp)
REQ-01 ──> REQ-05
REQ-05 ──> REQ-06 ──> REQ-07 / REQ-08
```

#### Chi tiết từng yêu cầu con

##### REQ-01: DB — Bảng `path_stage_videos`
- **Mục tiêu**: Cache danh sách video gắn với từng `PathStage` (one-to-many, 3–5 video)
- **Schema đề xuất**:
  ```prisma
  model PathStageVideo {
    id             String   @id @default(uuid())
    pathStageId    String   @map("path_stage_id")
    youtubeVideoId String   @map("youtube_video_id")
    title          String
    channelTitle   String?  @map("channel_title")
    thumbnailUrl   String?  @map("thumbnail_url")
    durationSeconds Int?    @map("duration_seconds")
    relevanceScore Float    @default(0) @map("relevance_score")
    aiReason       String?  @map("ai_reason")
    order          Int      @default(0)
    createdAt      DateTime @default(now()) @map("created_at")

    pathStage PathStage @relation(fields: [pathStageId], references: [id], onDelete: Cascade)

    @@index([pathStageId])
    @@map("path_stage_videos")
  }
  ```
  Thêm vào `model PathStage`: `videos PathStageVideo[]`
- **Tiêu chí hoàn thành**: Migration chạy OK, Prisma client regenerate
- **Phụ thuộc**: Không

##### REQ-02: Backend — `YoutubeService`
- **Mục tiêu**: Gọi YouTube Data API v3 lấy danh sách video thật, có metadata để AI re-rank
- **Env**: `YOUTUBE_API_KEY` (server-side, không lộ ra client)
- **Endpoint Google**: `GET https://www.googleapis.com/youtube/v3/search` rồi `videos.list` để lấy duration/contentDetails
- **Bộ lọc cứng**:
  - `type=video`, `videoEmbeddable=true`, `safeSearch=strict`
  - `relevanceLanguage=<targetLanguageCode>`
  - `videoDuration=medium` (ưu tiên 4–20 phút; có thể nới)
  - `maxResults=10` (lấy 10 candidate cho AI re-rank chọn 3–5)
- **Fail-safe**: Nếu thiếu API key hoặc lỗi → trả mảng rỗng, không chặn việc tạo path
- **Quota**: `search.list` = 100 units/lần. Theo quyết định **1 query/stage** → 6–7 search/path. Cần xin tăng quota qua Google Cloud Console (form "YouTube API Services - Audit and Quota Extension")

##### REQ-03: AI — Sinh query + re-rank (Gemini)
- **`generateVideoQuery(terms, targetLanguage, stageTitle, cefrLevel)`**
  - Trả về **1 câu truy vấn YouTube tối ưu** (string) hướng tới nội dung học, đúng trình độ. Ví dụ output: `"basic family vocabulary Spanish A1 for beginners"`
- **`rankVideos(candidates, context)`**
  - Input: danh sách candidate (title, channelTitle, description, durationSeconds) + context (stageTitle, cefrLevel, terms)
  - Output: JSON top 3–5 gồm `{ youtubeVideoId, relevanceScore (0–1), aiReason }`
  - **Quan trọng**: AI chỉ được chọn trong danh sách candidate thật → **không bịa video ID**
  - Validate bằng Zod, fail-safe nếu JSON hỏng

##### REQ-04: Backend — Generate khi tạo path
- **Vị trí**: `PathsService.createFromAI()`, ngay sau block generate Dialogue
- **Logic**: `Promise.all` qua các stage; mỗi stage:
  1. `generateVideoQuery()` → query
  2. `youtubeService.search(query)` → candidates
  3. `rankVideos(candidates)` → top N
  4. `prisma.pathStageVideo.createMany()`
- **Fail-safe**: try/catch mỗi stage, lỗi thì `logger.warn` và skip (giống Dialogue)
- **Điều kiện**: chỉ chạy khi `aiService.isEnabled` và có `YOUTUBE_API_KEY`

##### REQ-05: API — Endpoint lấy video
- `GET /paths/stages/:pathStageId/videos` → `VideoDto[]` (order asc)
- Trả `[]` nếu chưa có

##### REQ-06: shared-types
- Thêm `VideoDto { id, youtubeVideoId, title, channelTitle, thumbnailUrl, durationSeconds, aiReason }`
- Thêm `hasVideos: boolean` vào `PathStageDto` (map từ `videos.length > 0`)

##### REQ-07: FE — Nút "Xem video" trên stage
- Trong `StageRow.tsx`: khi `stage.hasVideos`, render nút `▶️ {t('review.viewVideos')}` cạnh nút Dialogue, style tương tự (đổi tông màu, ví dụ đỏ/hồng YouTube hoặc xanh dương), `onClick={() => navigate('/videos/' + stage.pathStageId)}`
- Hiển thị ở cả trạng thái in-progress và completed (giống nút Dialogue)

##### REQ-08: FE — `VideosPage`
- Route `/videos/:pathStageId`, layout trong `AppShell`
- Fetch `pathApi.getStageVideos(pathStageId)`
- Mỗi video: nhúng `<iframe>` YouTube embed (`https://www.youtube.com/embed/<id>`) + tiêu đề + tên kênh + **chip lý do AI** (`aiReason`)
- Loading/error/empty states giống `DialoguePage`

---

## PLAN TODO

- [ ] REQ-01: Thêm model `PathStageVideo` + relation, tạo migration, regenerate Prisma
- [ ] REQ-02: Tạo `YoutubeService` + đăng ký trong module, thêm env `YOUTUBE_API_KEY`
- [ ] REQ-03: Thêm `generateVideoQuery()` + `rankVideos()` vào `AiService` (+ Zod schema)
- [ ] REQ-04: Tích hợp generate vào `PathsService.createFromAI()` (Promise.all fail-safe)
- [ ] REQ-05: Thêm endpoint `GET /paths/stages/:id/videos` (controller + service)
- [ ] REQ-06: Cập nhật `shared-types`: `VideoDto`, `hasVideos`; rebuild package
- [ ] REQ-07: Thêm nút "Xem video" vào `StageRow.tsx` + i18n keys (en/vi/pt)
- [ ] REQ-08: Tạo `VideosPage.tsx` + đăng ký route trong router
- [ ] Build backend + frontend, kiểm thử tạo path mới → xác nhận có video

---

## Verification

- [ ] Tạo path mới → mỗi stage có 3–5 video thật, embed được, không 404
- [ ] Video phù hợp trình độ CEFR và chủ đề stage (kiểm tra `aiReason`)
- [ ] Path cũ không bị ảnh hưởng (không có nút video)
- [ ] Thiếu `YOUTUBE_API_KEY` → path vẫn tạo bình thường, chỉ không có video (fail-safe)
- [ ] Nút "Xem video" hiển thị đúng, điều hướng tới `/videos/:id`
- [ ] `npm run build` pass cả backend lẫn frontend
- [ ] Quota YouTube: xác nhận đã gửi yêu cầu tăng quota trước khi bật trên production

---

## Ghi chú vận hành

- **Quota**: Mặc định 10.000 units/ngày → ~16 path/ngày với 1 query/stage. Cần xin tăng quota (miễn phí) cho production.
- **Bảo mật**: `YOUTUBE_API_KEY` chỉ dùng server-side; client chỉ nhận `youtubeVideoId` để nhúng iframe.
- **Chi phí AI**: 2 lần gọi Gemini/stage khi tạo path (query + rank) — generate 1 lần, cache vĩnh viễn.
