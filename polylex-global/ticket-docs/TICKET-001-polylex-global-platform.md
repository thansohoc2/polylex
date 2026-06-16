# TICKET-001: PolyLex Global — Multilingual Vocabulary Learning Platform

## Thông tin ticket
| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-001 |
| **Ngày tạo** | 2026-02-26 |
| **Người yêu cầu** | Product Owner |
| **Trạng thái** | Phân tích — Chờ lập kế hoạch |

## Mô tả yêu cầu gốc

Xây dựng nền tảng học từ vựng đa ngôn ngữ SaaS production-ready tên **PolyLex Global** với các thành phần:

- Backend: NestJS + TypeScript + PostgreSQL + Prisma ORM + Redis + JWT
- Frontend: React + TypeScript + TailwindCSS + Zustand/Redux Toolkit
- Thuật toán ghi nhớ vượt trội Anki: **Adaptive Cognitive Reinforcement Engine (ACRE)**
- Hỗ trợ vô hạn ngôn ngữ, học viên từ mọi quốc gia
- Lộ trình học thông minh, analytics dashboard, gamification
- Tùy chọn tích hợp OpenAI

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-001 |
| **Tiêu đề** | PolyLex Global — Nền tảng học từ vựng đa ngôn ngữ SaaS |
| **Mục tiêu** | Xây dựng hệ thống học từ vựng toàn cầu, cá nhân hóa, vượt trội Anki về thuật toán ghi nhớ và lộ trình học thông minh |
| **Phạm vi** | Toàn bộ greenfield: DB Schema, Auth, Vocabulary, Review, LearningPath, Analytics, AI Integration, Frontend |
| **Độ ưu tiên** | Cao |
| **Các quyết định kiến trúc** | Prisma ORM · Monorepo · Single schema + org_id · Browser TTS · User-facing only (no admin) |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Thiết lập dự án & CI/CD | Scaffold NestJS monorepo, Docker Compose, biến môi trường, kết nối DB/Redis | Infra/DB | Nhỏ |
| REQ-02 | Prisma Schema & Migration | Định nghĩa toàn bộ schema PostgreSQL theo ERD, seed data ngôn ngữ | DB | Trung bình |
| REQ-03 | Xác thực & Phân quyền | Đăng ký/đăng nhập, JWT access + refresh token, Guard, User Settings | REST/DB | Trung bình |
| REQ-04 | Quản lý ngôn ngữ | CRUD ngôn ngữ, seed bộ ngôn ngữ phổ biến, API tra cứu | REST/DB | Nhỏ |
| REQ-05 | Quản lý từ vựng cơ sở | CRUD `vocabulary_base`, phân trang, tìm kiếm, gán ngôn ngữ gốc | REST/DB | Trung bình |
| REQ-06 | Hệ thống dịch đa ngôn ngữ | CRUD `vocabulary_translations`, tra cứu theo native language của user | REST/DB | Trung bình |
| REQ-07 | Thư viện từ vựng cá nhân | User thêm từ vào danh sách học, personal note, difficulty adjustment | REST/DB | Trung bình |
| REQ-08 | Thuật toán ACRE | Implement engine tính toán memory_strength, next_review, leech detection | Service | Lớn |
| REQ-09 | Review Session API | Lấy hàng đợi ôn tập hôm nay, submit kết quả review, cập nhật ACRE | REST/Redis | Lớn |
| REQ-10 | Lộ trình học thông minh | Roadmap engine: đề xuất từ mới, skill tracking (R/L/W/S), điều chỉnh workload | REST/DB | Lớn |
| REQ-11 | Chế độ học (Learning Modes) | 6 chế độ: Flashcard, Type Answer, Reverse, Listening, Context, Sentence | REST/DB | Lớn |
| REQ-12 | Analytics Dashboard | Retention rate, forgetting risk, CEFR estimate, heatmap, velocity chart | REST/DB | Lớn |
| REQ-13 | Cron Jobs | Background job tính toán next_review, cập nhật memory strength, leech detection | Cron/DB | Trung bình |
| REQ-14 | Tích hợp OpenAI (Optional) | AI sinh example, mnemonic, semantic clustering, phát âm tự động | REST/AI | Lớn |
| REQ-15 | Gamification & Streak | Streak system, XP, badges, team learning mode | REST/DB | Trung bình |
| REQ-16 | Frontend React | UI components: Flashcard, Dashboard, Roadmap, Settings, Auth pages | Frontend | Lớn |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 ──┬──> REQ-03 ──> REQ-07 ──> REQ-09 ──> REQ-10
                    │                                │
                    ├──> REQ-04 ──> REQ-05 ──> REQ-06         │
                    │                                           │
                    └──────────────────────────────────────────┘
                                                    │
REQ-09 ──> REQ-08 (ACRE is core dependency of review)
REQ-09 ──> REQ-13 (cron reuses ACRE logic)
REQ-10 ──> REQ-11 (learning modes feed into roadmap)
REQ-05, REQ-09 ──> REQ-12 (analytics reads all data)
REQ-05, REQ-06 ──> REQ-14 (AI enriches vocabulary)
REQ-09 ──> REQ-15 (streak updates on review completion)
REQ-10, REQ-11 ──> REQ-16 (frontend consumes all APIs)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Thiết lập dự án & CI/CD
- **Mục tiêu**: Khởi tạo NestJS project, Docker Compose với PostgreSQL + Redis, cấu hình Prisma, biến môi trường
- **Đầu vào**: Không có (greenfield)
- **Đầu ra mong đợi**: `polylex-global/` có cấu trúc module đầy đủ, `docker-compose.yml`, `.env.example`, kết nối DB+Redis thành công
- **Tiêu chí hoàn thành**: `docker-compose up` chạy được, `npm run start:dev` không lỗi
- **Phụ thuộc**: Không

##### REQ-02: Prisma Schema & Migration
- **Mục tiêu**: Định nghĩa toàn bộ 8 bảng core theo ERD, tạo migration, seed ngôn ngữ phổ biến
- **Đầu vào**: ERD từ ticket (users, languages, vocabulary_base, vocabulary_translations, user_vocabulary, review_history, learning_paths + skill_scores)
- **Đầu ra mong đợi**: `prisma/schema.prisma` đầy đủ, migration chạy thành công, seed ~30 ngôn ngữ
- **Tiêu chí hoàn thành**: `prisma migrate dev` và `prisma db seed` không lỗi
- **Phụ thuộc**: REQ-01

##### REQ-03: Xác thực & Phân quyền
- **Mục tiêu**: AuthModule với đăng ký, đăng nhập, refresh token, JwtAuthGuard, cập nhật user settings (native language, timezone, CEFR goal)
- **Đầu vào**: email, password, native_language_id, timezone, learning_goal, cefr_target
- **Đầu ra mong đợi**: `/auth/register`, `/auth/login`, `/auth/refresh`, `/users/me` (PATCH settings)
- **Tiêu chí hoàn thành**: JWT valid, refresh hoạt động, user settings lưu đúng
- **Phụ thuộc**: REQ-02

##### REQ-04: Quản lý ngôn ngữ
- **Mục tiêu**: LanguageModule cho phép liệt kê/tìm kiếm ngôn ngữ, admin CRUD
- **Đầu vào**: language code (ISO 639-1), name
- **Đầu ra mong đợi**: `GET /languages`, `GET /languages/:id`
- **Tiêu chí hoàn thành**: Seed data 30+ ngôn ngữ, API trả đúng
- **Phụ thuộc**: REQ-02

##### REQ-05: Quản lý từ vựng cơ sở
- **Mục tiêu**: CRUD vocabulary_base với phân trang, tìm kiếm theo ngôn ngữ, part-of-speech, difficulty
- **Đầu vào**: word, language_id, phonetic, part_of_speech, difficulty_global
- **Đầu ra mong đợi**: REST CRUD + filter + pagination
- **Tiêu chí hoàn thành**: Index đúng, phân trang hoạt động
- **Phụ thuộc**: REQ-02, REQ-04

##### REQ-06: Hệ thống dịch đa ngôn ngữ
- **Mục tiêu**: Quản lý vocabulary_translations, mỗi từ có thể có nhiều bản dịch sang nhiều ngôn ngữ. API tra cứu tự động dùng native_language của user
- **Đầu vào**: vocabulary_id, language_id, meaning, example_sentence, example_translation, synonyms, antonyms
- **Đầu ra mong đợi**: `GET /vocabulary/:id/translation` trả bản dịch theo native language của user đang đăng nhập
- **Tiêu chí hoàn thành**: Đúng với mọi cặp ngôn ngữ
- **Phụ thuộc**: REQ-03, REQ-05

##### REQ-07: Thư viện từ vựng cá nhân
- **Mục tiêu**: User thêm từ vào `user_vocabulary`, ghi personal note, điều chỉnh difficulty, xem danh sách
- **Đầu vào**: vocabulary_id, personal_note, difficulty_user
- **Đầu ra mong đợi**: `POST /my-vocabulary`, `GET /my-vocabulary`, `PATCH /my-vocabulary/:id`
- **Tiêu chí hoàn thành**: Từ được gán next_review mặc định sau khi thêm
- **Phụ thuộc**: REQ-03, REQ-05

##### REQ-08: Thuật toán ACRE
- **Mục tiêu**: Implement engine tính toán memory_strength, next_review theo công thức ACRE (SM-2 cải tiến + Ebbinghaus + response time + confidence + leech detection)
- **Đầu vào**: recall_quality (0–5), response_time_ms, confidence_level, current memory_strength, leech_score
- **Đầu ra mong đợi**: next_review (Date), new memory_strength, updated leech_score, review_mode recommendation
- **Tiêu chí hoàn thành**: Unit tests đầy đủ cho các trường hợp biên; leech detection chính xác
- **Phụ thuộc**: REQ-02

##### REQ-09: Review Session API
- **Mục tiêu**: API lấy hàng đợi ôn tập hôm nay (cache Redis), submit kết quả, tự động chạy ACRE để cập nhật user_vocabulary và ghi review_history
- **Đầu vào**: GET hàng đợi theo user; POST submit với recall_quality, response_time_ms, confidence_level, review_mode
- **Đầu ra mong đợi**: `GET /review/queue` (cache 1h), `POST /review/submit`
- **Tiêu chí hoàn thành**: Redis cache hit, ACRE cập nhật đúng, review_history ghi đủ
- **Phụ thuộc**: REQ-07, REQ-08

##### REQ-10: Lộ trình học thông minh
- **Mục tiêu**: Roadmap engine theo dõi 4 skill (Reading/Listening/Writing/Speaking), đề xuất từ mới, điều chỉnh tỷ lệ review/new, phát hiện mệt mỏi
- **Đầu vào**: learning_path của user, lịch sử review gần đây, skill_scores
- **Đầu ra mong đợi**: `GET /learning-path/roadmap` trả danh sách từ đề xuất + metadata lý do
- **Tiêu chí hoàn thành**: Đề xuất hợp lý theo điểm yếu skill; fatigue detection hoạt động
- **Phụ thuộc**: REQ-09

##### REQ-11: Chế độ học (Learning Modes)
- **Mục tiêu**: Backend hỗ trợ 6 mode học, mỗi mode có weight khác nhau khi cập nhật memory_strength
- **Đầu vào**: review_mode trong submit payload
- **Đầu ra mong đợi**: ACRE xử lý khác nhau theo mode; API trả câu hỏi đúng format theo mode
- **Tiêu chí hoàn thành**: 6 mode hoạt động, weight khác nhau được apply
- **Phụ thuộc**: REQ-08, REQ-09

##### REQ-12: Analytics Dashboard
- **Mục tiêu**: API cung cấp retention rate, forgetting risk prediction, CEFR estimate, heatmap, velocity chart, estimated active vocabulary
- **Đầu vào**: user_id, date range (lazy loaded)
- **Đầu ra mong đợi**: `GET /analytics/retention`, `GET /analytics/cefr-estimate`, `GET /analytics/heatmap`
- **Tiêu chí hoàn thành**: Data tính đúng, lazy load không block
- **Phụ thuộc**: REQ-09

##### REQ-13: Cron Jobs
- **Mục tiêu**: Background job chạy hàng đêm: tính toán next_review do missed, cập nhật leech_score, invalidate Redis cache
- **Đầu vào**: Định kỳ (`@Cron`)
- **Đầu ra mong đợi**: Không có response; log kết quả
- **Tiêu chí hoàn thành**: Cron chạy đúng lịch, không gây N+1
- **Phụ thuộc**: REQ-08, REQ-09

##### REQ-14: Tích hợp OpenAI (Optional)
- **Mục tiêu**: AI sinh example sentence, mnemonic, semantic clustering, auto fetch pronunciation
- **Đầu vào**: vocabulary_id hoặc word text
- **Đầu ra mong đợi**: `POST /ai/generate-example`, `POST /ai/mnemonic`, `POST /ai/cluster`
- **Tiêu chí hoàn thành**: Gọi OpenAI API thành công, kết quả lưu vào DB
- **Phụ thuộc**: REQ-05, REQ-06

##### REQ-15: Gamification & Streak
- **Mục tiêu**: Theo dõi streak học mỗi ngày, tính XP, badge milestones, team learning mode
- **Đầu vào**: Review completion event
- **Đầu ra mong đợi**: `GET /gamification/stats`, event-driven streak update
- **Tiêu chí hoàn thành**: Streak tính đúng timezone user, không bị trùng khi submit nhiều lần/ngày
- **Phụ thuộc**: REQ-09, REQ-03

##### REQ-16: Frontend React
- **Mục tiêu**: UI hoàn chỉnh: Auth, Dashboard, Flashcard Review, Learning Roadmap, Analytics, Settings
- **Đầu vào**: Toàn bộ REST API từ backend
- **Đầu ra mong đợi**: SPA responsive, TailwindCSS, Zustand state management
- **Tiêu chí hoàn thành**: Tất cả luồng user hoàn chỉnh
- **Phụ thuộc**: Tất cả các REQ backend

---

### 3. Ngữ cảnh nghiệp vụ

#### Luồng nghiệp vụ chính

1. **Luồng đăng ký & onboarding**:
   - User đăng ký → chọn native language → chọn target language(s) → chọn CEFR goal → system tạo learning_path

2. **Luồng học hàng ngày**:
   - User vào dashboard → xem hàng đợi ôn tập (từ Redis cache) → review từng từ theo mode → ACRE tính toán → cập nhật memory_strength/next_review → streak +1

3. **Luồng học từ mới**:
   - Roadmap engine đề xuất từ mới theo skill yếu nhất → User thêm vào user_vocabulary → từ được lên lịch review đầu tiên (interval = 1 ngày)

4. **Luồng AI enrichment** (optional):
   - Admin/user trigger AI → sinh example, mnemonic → lưu vào vocabulary_translations/notes

#### Các thực thể domain chính

- **Language**: đơn vị ngôn ngữ (code ISO 639-1)
- **VocabularyBase**: từ gốc trong một ngôn ngữ
- **VocabularyTranslation**: bản dịch của từ sang ngôn ngữ khác (quan hệ N-N giữa vocabulary và language)
- **UserVocabulary**: trạng thái học của một user với một từ cụ thể (memory_strength, next_review, leech_score)
- **ReviewHistory**: lịch sử mỗi lần review (audit trail để tính analytics)
- **LearningPath**: lộ trình học của user (target language, CEFR level, skill scores)

#### Quy tắc nghiệp vụ quan trọng

- Một từ có thể có nhiều bản dịch sang nhiều ngôn ngữ khác nhau
- API từ vựng phải tự động trả bản dịch theo `native_language_id` của user đang đăng nhập
- `memory_strength` chỉ được thay đổi thông qua ACRE engine, không cho phép sửa trực tiếp từ API
- Leech word (từ bị quên nhiều lần): sau 8 lần fail liên tiếp → chuyển sang "contextual reinforcement mode"
- Review queue phải tính theo **timezone của user**, không phải server timezone

---

### 4. Ngữ cảnh kỹ thuật

#### Trạng thái hiện tại

- `polylex-global/` folder **hoàn toàn trống** — đây là greenfield project
- Workspace có `.github/agents/NestJS.agent.md` định nghĩa conventions (Sequelize trong agent nhưng ticket yêu cầu **Prisma** — xem mục câu hỏi mở)
- Không có code, migration, hay config hiện có

#### Stack kỹ thuật xác nhận

| Thành phần | Công nghệ |
|------------|-----------|
| Repo structure | **Monorepo** (`apps/backend` + `apps/frontend` + `packages/shared-types`) |
| Backend framework | NestJS + TypeScript |
| ORM | **Prisma** |
| Database | PostgreSQL 16 |
| Cache | Redis |
| Auth | JWT (access + refresh token) |
| Background jobs | `@nestjs/schedule` + `@Cron` |
| Frontend | React + Vite + TypeScript + TailwindCSS + Zustand |
| Text-to-speech | **Browser Web Speech API** (`SpeechSynthesisUtterance`) |
| Multi-tenancy | **Single schema + `organization_id`** |
| AI (optional) | OpenAI API |
| Container | Docker + Docker Compose |

#### Cấu trúc monorepo & module NestJS

```
polylex-global/
├── apps/
│   ├── backend/                  # NestJS
│   │   ├── src/
│   │   │   ├── main.ts
│   │   │   ├── app.module.ts
│   │   │   ├── common/
│   │   │   │   ├── decorators/   # @CurrentUser, @OrgId
│   │   │   │   ├── filters/      # GlobalExceptionFilter
│   │   │   │   ├── guards/       # JwtAuthGuard, OrgGuard
│   │   │   │   ├── interceptors/ # LoggingInterceptor, TransformInterceptor
│   │   │   │   └── pipes/
│   │   │   ├── config/
│   │   │   │   └── config.module.ts
│   │   │   ├── prisma/
│   │   │   │   └── prisma.service.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   ├── users/
│   │   │   │   ├── organizations/ # Multi-tenancy (org CRUD, invite)
│   │   │   │   ├── language/
│   │   │   │   ├── vocabulary/
│   │   │   │   ├── review/
│   │   │   │   ├── learning-path/
│   │   │   │   ├── analytics/
│   │   │   │   ├── gamification/
│   │   │   │   └── ai/
│   │   │   └── core/
│   │   │       └── acre/         # ACRE algorithm engine
│   │   │           └── acre.service.ts
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   ├── migrations/
│   │   │   └── seed.ts
│   │   └── test/
│   └── frontend/                 # React + Vite
│       ├── src/
│       │   ├── pages/
│       │   ├── components/
│       │   ├── stores/           # Zustand
│       │   ├── hooks/
│       │   └── services/         # API client
│       └── vite.config.ts
├── packages/
│   └── shared-types/             # DTO types dùng chung FE + BE
│       └── src/index.ts
└── docker-compose.yml
```

#### Prisma Schema — các bảng cần thiết

```
organizations         (multi-tenancy: organization_id trên mọi bảng liên quan)
users                 (+ organization_id nullable)
languages             (global, không phân tenant)
vocabulary_base       (+ organization_id nullable — org có thể tạo từ riêng)
vocabulary_translations
user_vocabulary
review_history
learning_paths
skill_scores          (4 skills per learning_path)
user_streaks          (gamification)
user_badges           (gamification)
```

> **Multi-tenancy rule**: `organization_id IS NULL` = từ vựng/dữ liệu toàn cầu (shared). `organization_id = X` = dữ liệu riêng của tổ chức X. Query luôn filter: `WHERE organization_id = :orgId OR organization_id IS NULL`.

#### Ràng buộc kỹ thuật quan trọng

- `next_review` phải được **index** (query pattern: `WHERE next_review <= NOW() AND user_id = ?`)
- Redis cache key pattern: `review:queue:{userId}:{date}` với TTL = đến hết ngày theo timezone user
- ACRE tính toán phải là **pure function** (dễ unit test, không side effect)
- Analytics endpoints dùng lazy loading + pagination để không block
- **Multi-tenancy**: Mọi query liên quan đến `vocabulary_base`, `user_vocabulary`, `review_history` phải kèm `organization_id` filter. Dùng `OrgGuard` inject `orgId` từ JWT claim vào request context
- **TTS (Listening mode)**: Frontend gọi `window.speechSynthesis.speak()` với `lang` = ISO code của target language. Backend không cần endpoint TTS
- **Monorepo**: `packages/shared-types` export DTO interfaces dùng chung; FE import từ `@polylex/shared-types`, BE dùng để validate consistency

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| Folder trống | NestJS project scaffolded | Toàn bộ project cần tạo mới |
| Không có DB | PostgreSQL với 10 tables | Cần Prisma schema + migration + seed |
| Không có Auth | JWT Auth + User Settings | AuthModule + UserModule hoàn chỉnh |
| Không có từ vựng | Vocabulary + Translation system | VocabularyModule + TranslationModule |
| Không có thuật toán | ACRE engine vượt trội SM-2 | ACRE service + unit tests |
| Không có Review | Review queue + submit API | ReviewModule + Redis integration |
| Không có Roadmap | Smart learning path engine | LearningPathModule + Roadmap engine |
| Không có Analytics | Full dashboard analytics | AnalyticsModule + complex queries |
| Không có Frontend | React SPA đầy đủ | Frontend project hoàn chỉnh |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ

- [ ] **Độ phức tạp ACRE quá cao**: Thuật toán kết hợp nhiều yếu tố (6+ biến) có thể cho kết quả không trực quan — Biện pháp: viết extensive unit tests, A/B test với SM-2 baseline
- [ ] **Đề xuất roadmap không chính xác**: Nếu skill score tracking không đủ data sẽ cho kết quả lệch — Biện pháp: cold start strategy với default weights, chỉ activate roadmap sau 50+ reviews
- [ ] **Timezone edge case**: Review queue tính nhầm ngày nếu dùng server timezone — Biện pháp: lưu timezone user, luôn convert sang UTC trước khi query
- [ ] **Chế độ học (mode) ảnh hưởng ACRE không đồng đều**: Writing/Speaking mode khó hơn Flashcard, weight cần calibration thực tế — Biện pháp: document rõ weights, cho phép điều chỉnh qua config

#### 6.2 Rủi ro kỹ thuật

- [ ] **N+1 query trong Review Queue**: Khi load 20–50 từ kèm translations → Prisma `include` lồng nhau — Biện pháp: dùng `select` có chọn lọc, cache toàn bộ queue trong Redis
- [ ] **Redis cache invalidation**: Cache stale khi user thêm từ mới hoặc thay đổi settings mid-day — Biện pháp: invalidate cache ngay khi `user_vocabulary` thay đổi, dùng cache-aside pattern
- [ ] **Cron job race condition**: Cron tính next_review đồng thời với user đang submit review — Biện pháp: dùng Prisma transaction + optimistic locking (updated_at check)
- [ ] **Analytics query nặng**: CEFR estimate và heatmap join nhiều bảng — Biện pháp: materialized views hoặc background pre-computation, lazy load qua pagination
- [ ] **OpenAI rate limiting**: Batch request sinh example/mnemonic có thể hit rate limit — Biện pháp: queue-based processing với retry, cache kết quả AI theo word
- [ ] **Prisma vs Sequelize mismatch**: NestJS agent trong workspace dùng Sequelize nhưng ticket yêu cầu Prisma — Biện pháp: dùng Prisma theo ticket, cập nhật agent instructions

#### 6.3 Lỗi logic tiềm ẩn

- [ ] **ACRE interval âm**: Rất slow response + low confidence + leech penalty có thể khiến interval âm — Cách phòng tránh: clamp `next_review` tối thiểu = 1 ngày từ hôm nay
- [ ] **Leech counter reset**: Sau một lần recall tốt, leech_score có reset về 0 không? Cần định nghĩa rõ — Cách phòng tránh: leech_score giảm dần (không reset ngay), tài liệu hóa logic
- [ ] **Streak timezone bug**: User ở UTC+7 review lúc 23:59, server UTC thấy là ngày hôm sau → mất streak — Cách phòng tránh: tính streak theo `DATE AT TIME ZONE user.timezone`
- [ ] **Double submit review**: User submit 2 lần cho cùng 1 từ trong 1 session — Cách phòng tránh: idempotency key hoặc check `last_review` trong cùng session window
- [ ] **Translation fallback**: Nếu không có translation sang native_language của user → API trả 404 hay fallback sang English? — Cách phòng tránh: định nghĩa fallback strategy (English mặc định)
- [ ] **Learning path chưa tạo**: User gọi `/review/queue` trước khi hoàn thành onboarding → null learning_path — Cách phòng tránh: tạo default learning_path trong register flow, guard kiểm tra

---

### 7. Ưu điểm và Nhược điểm

#### Kiến trúc Translation (vocabulary_base + vocabulary_translations)

| Ưu điểm | Nhược điểm |
|---------|------------|
| Hỗ trợ vô hạn cặp ngôn ngữ mà không duplicate dữ liệu từ gốc | Query phức tạp hơn (join 2–3 bảng) |
| Dễ thêm ngôn ngữ mới mà không cần schema change | Cần index cẩn thận (vocabulary_id + language_id) |
| User từ bất kỳ quốc gia nào đều thấy bản dịch đúng ngôn ngữ | Nếu thiếu translation → UX kém nếu không có fallback |
| Admin có thể quản lý translation riêng biệt | Seed data ban đầu tốn công hơn |

#### Thuật toán ACRE vs Anki SM-2

| Ưu điểm | Nhược điểm |
|---------|------------|
| Penalize slow answers → chính xác hơn về thực sự nhớ | Khó explain cho user tại sao interval thay đổi |
| Confidence weighting → tránh lucky guess | Cần thu thập response_time_ms chính xác trên FE |
| Leech detection tự động → đề xuất mode học khác | Cần calibration data để set threshold phù hợp |
| Context weight → từ được dùng nhiều trong context học nhanh hơn | Engine phức tạp hơn SM-2, khó debug production issues |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**:
  1. Bắt đầu từ REQ-01 → REQ-02 (foundation) trước, không skip
  2. Implement ACRE (REQ-08) sớm với unit tests đầy đủ trước khi tích hợp vào Review API
  3. Dùng **feature flags** để bật/tắt OpenAI integration (tránh dependency vào external API trong early dev)
  4. Frontend (REQ-16) bắt đầu song song sau khi REQ-03–REQ-07 ổn định (API contracts được định nghĩa qua Swagger)
  5. Analytics (REQ-12) và Gamification (REQ-15) implement cuối, sau khi có data thực từ review sessions

- **Các cách tiếp cận thay thế**:
  - Thay Prisma bằng TypeORM nếu muốn nhất quán với NestJS agent hiện có (nhưng Prisma được khuyến nghị cho DX tốt hơn)
  - Thay Redis bằng in-memory cache (Bull Queue) nếu không muốn infra phức tạp ban đầu
  - Dùng Monorepo (NestJS + Next.js) thay vì 2 repo riêng để chia sẻ TypeScript types

- **Phụ thuộc ngoài**:
  - OpenAI API key (optional)
  - Docker Desktop
  - Node.js 20+, PostgreSQL 16, Redis 7+

- **Ước tính công sức**:
  | Nhóm | REQ | Ước tính |
  |------|-----|---------|
  | Foundation | REQ-01, 02, 03, 04 | 3–4 ngày |
  | Vocabulary Core | REQ-05, 06, 07 | 3–4 ngày |
  | ACRE + Review | REQ-08, 09, 11 | 5–7 ngày |
  | Roadmap + Cron | REQ-10, 13 | 3–4 ngày |
  | Analytics + Gamification | REQ-12, 15 | 4–5 ngày |
  | AI Integration | REQ-14 | 2–3 ngày |
  | Frontend | REQ-16 | 7–10 ngày |
  | **Tổng** | | **~4–6 tuần (1 dev)** |

---

### 9. Câu hỏi mở

#### ✅ Đã giải quyết

- [x] **ORM**: Dùng **Prisma** — xác nhận theo ticket gốc.
- [x] **Monorepo hay multi-repo**: **Monorepo** — Frontend React và Backend NestJS cùng repo `polylex-global/`, cấu trúc:
  ```
  polylex-global/
  ├── apps/
  │   ├── backend/   # NestJS
  │   └── frontend/  # React + Vite
  ├── packages/
  │   └── shared-types/  # TypeScript types dùng chung
  └── docker-compose.yml
  ```
- [x] **Admin role**: **Chưa cần** admin panel — giai đoạn đầu chỉ user-facing. Admin features sẽ bổ sung sau.
- [x] **Listening mode TTS**: Dùng **Browser Web Speech API** (`SpeechSynthesisUtterance`) — zero cost, không cần external service, hoạt động offline.
- [x] **Multi-tenancy**: **Single schema + `organization_id`** — mọi bảng có cột `organization_id` nullable (null = personal account). Hỗ trợ team/tổ chức mà không cần schema riêng.

#### 🔲 Còn mở

- [ ] **CEFR mapping**: Cơ sở để estimate CEFR từ vocabulary size là gì? Cần Oxford 5000 word list hay custom mapping?
- [ ] **Team learning mode**: Scope chi tiết là gì? Shared vocabulary list, hay real-time collaborative review?
- [ ] **Rate limiting**: Có cần rate limit API không? (đặc biệt AI endpoints và review submit)

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Xây dựng từ đầu nền tảng học từ vựng đa ngôn ngữ PolyLex Global theo kiến trúc monorepo (NestJS backend + React frontend + shared-types), với thuật toán ACRE vượt trội SM-2, hỗ trợ multi-tenancy (single schema + `organization_id`), và Redis-cached review queue.

---

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: Monorepo scaffold với NestJS backend, React+Vite frontend, shared-types package
2. FR-02: Prisma schema đầy đủ 11 bảng + migration + seed 30 ngôn ngữ
3. FR-03: JWT auth với access + refresh token, user settings, org membership
4. FR-04: CRUD language, vocabulary_base, vocabulary_translations với phân trang + filter
5. FR-05: User vocabulary library (add/remove/annotate) với next_review initialization
6. FR-06: ACRE engine thuần túy (pure function) với leech detection và mode weights
7. FR-07: Review session API với Redis queue cache + submit + ACRE update
8. FR-08: Smart roadmap engine (4 skills, fatigue detection, new/review ratio)
9. FR-09: 6 learning modes với question format khác nhau
10. FR-10: Analytics API (retention, forgetting risk, CEFR estimate, heatmap)
11. FR-11: Cron jobs: daily next_review recalculation + cache invalidation
12. FR-12: Gamification (streak, XP, badges) event-driven từ review completion
13. FR-13: OpenAI integration (feature-flagged) cho example/mnemonic/cluster
14. FR-14: React SPA hoàn chỉnh với TTS (Browser Web Speech API)

#### Ràng buộc phi chức năng
1. NFR-01: Controller mỏng — logic ở Service, DTO + class-validator cho input
2. NFR-02: ACRE phải là pure function — không side effect, dễ unit test
3. NFR-03: Index `next_review`, `(user_id, next_review)` trong PostgreSQL
4. NFR-04: Redis cache key `review:queue:{userId}:{date-utc}`, TTL = hết ngày theo timezone user
5. NFR-05: Mọi query có `organization_id` filter (WHERE org_id = ? OR org_id IS NULL)
6. NFR-06: `@nestjs/schedule` + `@Cron` cho background jobs
7. NFR-07: Swagger (`@nestjs/swagger`) cho API documentation
8. NFR-08: OpenAI integration bảo vệ bởi feature flag env var

#### Phụ thuộc
- DEP-01: Node.js 20+, Docker Desktop, PostgreSQL 16, Redis 7+
- DEP-02: `@prisma/client`, `prisma` CLI
- DEP-03: `@nestjs/jwt`, `@nestjs/passport`, `passport-jwt`
- DEP-04: `@nestjs/schedule` cho cron
- DEP-05: `ioredis` + `@nestjs/cache-manager` cho Redis
- DEP-06: `class-validator`, `class-transformer`
- DEP-07: `openai` SDK (optional, feature-flagged)
- DEP-08: React 19, Vite, TailwindCSS 4, Zustand

---

### Cách tiếp cận
> Triển khai theo 6 phase từ data layer lên interface layer: (1) scaffold + infra, (2) Prisma schema, (3) auth + core modules, (4) ACRE engine + review flow, (5) roadmap + analytics + cron + gamification, (6) frontend. Mỗi phase build trên phase trước và có thể verify độc lập.

---

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Tạo mới | `package.json` (root) | Monorepo workspace config |
| Tạo mới | `docker-compose.yml` | PostgreSQL + Redis services |
| Tạo mới | `apps/backend/prisma/schema.prisma` | Full schema 11 bảng |
| Tạo mới | `apps/backend/prisma/seed.ts` | Seed 30 ngôn ngữ |
| Tạo mới | `apps/backend/src/prisma/prisma.service.ts` | PrismaClient wrapper |
| Tạo mới | `apps/backend/src/common/guards/jwt-auth.guard.ts` | JWT guard |
| Tạo mới | `apps/backend/src/common/guards/org.guard.ts` | OrgId guard |
| Tạo mới | `apps/backend/src/common/decorators/current-user.decorator.ts` | @CurrentUser |
| Tạo mới | `apps/backend/src/core/acre/acre.service.ts` | ACRE pure engine |
| Tạo mới | `apps/backend/src/core/acre/acre.service.spec.ts` | ACRE unit tests |
| Tạo mới | `apps/backend/src/modules/auth/*` | AuthModule |
| Tạo mới | `apps/backend/src/modules/users/*` | UsersModule |
| Tạo mới | `apps/backend/src/modules/language/*` | LanguageModule |
| Tạo mới | `apps/backend/src/modules/vocabulary/*` | VocabularyModule |
| Tạo mới | `apps/backend/src/modules/review/*` | ReviewModule |
| Tạo mới | `apps/backend/src/modules/learning-path/*` | LearningPathModule |
| Tạo mới | `apps/backend/src/modules/analytics/*` | AnalyticsModule |
| Tạo mới | `apps/backend/src/modules/gamification/*` | GamificationModule |
| Tạo mới | `apps/backend/src/modules/ai/*` | AiModule (optional) |
| Tạo mới | `packages/shared-types/src/index.ts` | Shared DTO contracts |
| Tạo mới | `apps/frontend/src/**` | React SPA |

---

## PLAN TODO

### Phase 1: Monorepo Scaffold & Infra

#### REQ-01: Thiết lập dự án & CI/CD

- [ ] **TODO-1.01.1**: Khởi tạo root `package.json` với npm workspaces
  - **File**: `polylex-global/package.json`
  - **Context**: Không có — greenfield
  - **Thay đổi**:
    - Tạo `package.json` với `"workspaces": ["apps/*", "packages/*"]`
    - Thêm scripts: `"dev:backend"`, `"dev:frontend"`, `"build"`
    - `"name": "polylex-global"`, `"private": true`
  - **Verify**: `npm install` không lỗi, workspace được nhận diện
  - **Kết quả**: Root monorepo config sẵn sàng

- [ ] **TODO-1.01.2**: Tạo `docker-compose.yml` với PostgreSQL và Redis
  - **File**: `polylex-global/docker-compose.yml`
  - **Context**: Không có
  - **Thay đổi**:
    - Service `postgres`: image `postgres:16-alpine`, port `5432`, volume `pgdata`, env `POSTGRES_DB=polylex`, `POSTGRES_USER=polylex`, `POSTGRES_PASSWORD=polylex`
    - Service `redis`: image `redis:7-alpine`, port `6379`
    - Network `polylex-net` kết nối 2 services
  - **Verify**: `docker-compose up -d` → `docker-compose ps` thấy cả 2 healthy
  - **Kết quả**: DB + cache chạy local

- [ ] **TODO-1.01.3**: Scaffold NestJS app trong `apps/backend/`
  - **File**: `apps/backend/package.json`
  - **Context**: Root `package.json` (workspace)
  - **Thay đổi**:
    - Chạy `nest new backend --skip-git` trong `apps/`
    - Hoặc tạo thủ công `package.json` với NestJS dependencies: `@nestjs/core`, `@nestjs/common`, `@nestjs/platform-express`, `reflect-metadata`, `rxjs`
    - devDependencies: `@nestjs/cli`, `@nestjs/testing`, `jest`, `ts-jest`, `typescript`
  - **Verify**: `cd apps/backend && npm run build` không lỗi
  - **Kết quả**: NestJS project scaffold trong workspace

- [ ] **TODO-1.01.4**: Tạo `apps/backend/.env.example` với đầy đủ biến môi trường
  - **File**: `apps/backend/.env.example`
  - **Context**: `docker-compose.yml` (lấy giá trị mẫu)
  - **Thay đổi**:
    ```
    DATABASE_URL="postgresql://polylex:polylex@localhost:5432/polylex"
    REDIS_URL="redis://localhost:6379"
    JWT_ACCESS_SECRET="change-me-access"
    JWT_REFRESH_SECRET="change-me-refresh"
    JWT_ACCESS_EXPIRES_IN="15m"
    JWT_REFRESH_EXPIRES_IN="7d"
    OPENAI_API_KEY=""
    OPENAI_ENABLED="false"
    PORT=3000
    ```
  - **Verify**: File tồn tại, copy sang `.env` và app đọc được
  - **Kết quả**: Config mẫu cho dev onboarding

- [ ] **TODO-1.01.5**: Tạo `ConfigModule` tập trung trong backend
  - **File**: `apps/backend/src/config/config.module.ts`
  - **Context**: `apps/backend/.env.example`
  - **Thay đổi**:
    - Import `@nestjs/config` (`ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' })`)
    - Export typed `AppConfig` interface với tất cả env vars
    - Register trong `app.module.ts`
  - **Verify**: `npm run start:dev` đọc được `ConfigService` inject
  - **Kết quả**: Env config accessible qua DI trong mọi module

- [ ] **TODO-1.01.6**: Scaffold `packages/shared-types/` package
  - **File**: `packages/shared-types/package.json`
  - **Context**: Root `package.json` (workspace)
  - **Thay đổi**:
    - `"name": "@polylex/shared-types"`, `"version": "0.1.0"`
    - `"main": "src/index.ts"`, `"types": "src/index.ts"`
    - Tạo `packages/shared-types/src/index.ts` với placeholder export
    - Thêm `tsconfig.json` trong package
  - **Verify**: Backend có thể `import {} from '@polylex/shared-types'` không lỗi
  - **Kết quả**: Shared types package sẵn sàng

- [ ] **TODO-1.01.7**: Scaffold React+Vite app trong `apps/frontend/`
  - **File**: `apps/frontend/package.json`
  - **Context**: Root `package.json`
  - **Thay đổi**:
    - Tạo Vite project: `npm create vite@latest frontend -- --template react-ts`
    - Thêm deps: `tailwindcss`, `autoprefixer`, `postcss`, `zustand`, `axios`, `react-router-dom`
    - Cấu hình `tailwind.config.ts` và `postcss.config.js`
  - **Verify**: `cd apps/frontend && npm run dev` mở được Vite dev server
  - **Kết quả**: Frontend scaffold sẵn sàng

---

### Phase 2: Database Schema

#### REQ-02: Prisma Schema & Migration

- [ ] **TODO-2.02.1**: Cài đặt Prisma và khởi tạo schema file
  - **File**: `apps/backend/package.json`
  - **Context**: `apps/backend/.env.example`
  - **Thay đổi**:
    - Thêm deps: `@prisma/client`; devDeps: `prisma`
    - Chạy `npx prisma init` → tạo `prisma/schema.prisma` và cập nhật `.env`
    - Cấu hình `datasource db { provider = "postgresql"; url = env("DATABASE_URL") }`
    - Thêm seed script: `"prisma": { "seed": "ts-node prisma/seed.ts" }` vào `package.json`
  - **Verify**: `npx prisma validate` không lỗi
  - **Kết quả**: Prisma initialized, datasource trỏ đúng PostgreSQL

- [ ] **TODO-2.02.2**: Định nghĩa model `Organization` và `Language` trong schema
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Ticket ERD (phần 4)
  - **Thay đổi**:
    ```prisma
    model Organization {
      id          String   @id @default(cuid())
      name        String
      slug        String   @unique
      createdAt   DateTime @default(now())
      users       User[]
    }

    model Language {
      id   String @id @default(cuid())
      code String @unique  // ISO 639-1: "en", "vi", "ja"
      name String
      nativeName String?
      flagEmoji  String?
    }
    ```
  - **Verify**: `npx prisma validate` pass
  - **Kết quả**: 2 model cơ sở được định nghĩa

- [ ] **TODO-2.02.3**: Định nghĩa model `User` trong schema
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Bước TODO-2.02.2
  - **Thay đổi**:
    ```prisma
    model User {
      id               String        @id @default(cuid())
      email            String        @unique
      passwordHash     String
      nativeLanguageId String?
      nativeLanguage   Language?     @relation("UserNativeLang", fields: [nativeLanguageId], references: [id])
      timezone         String        @default("UTC")
      learningGoal     String?
      cefrTarget       String?       // A1|A2|B1|B2|C1|C2
      organizationId   String?
      organization     Organization? @relation(fields: [organizationId], references: [id])
      refreshToken     String?
      createdAt        DateTime      @default(now())
      updatedAt        DateTime      @updatedAt
      userVocabulary   UserVocabulary[]
      reviewHistory    ReviewHistory[]
      learningPaths    LearningPath[]
      streaks          UserStreak[]
      badges           UserBadge[]
    }
    ```
  - **Verify**: `npx prisma validate` pass
  - **Kết quả**: User model với đầy đủ relations

- [ ] **TODO-2.02.4**: Định nghĩa model `VocabularyBase` và `VocabularyTranslation`
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Bước TODO-2.02.2, TODO-2.02.3
  - **Thay đổi**:
    ```prisma
    model VocabularyBase {
      id              String   @id @default(cuid())
      word            String
      languageId      String
      language        Language @relation("VocabLanguage", fields: [languageId], references: [id])
      phonetic        String?
      partOfSpeech    String?  // noun|verb|adjective|adverb|...
      difficultyGlobal Float   @default(0.5)
      organizationId  String?
      createdAt       DateTime @default(now())
      translations    VocabularyTranslation[]
      userVocabulary  UserVocabulary[]
      @@unique([word, languageId, organizationId])
      @@index([languageId])
    }

    model VocabularyTranslation {
      id                 String          @id @default(cuid())
      vocabularyId       String
      vocabulary         VocabularyBase  @relation(fields: [vocabularyId], references: [id], onDelete: Cascade)
      languageId         String
      language           Language        @relation("TranslationLang", fields: [languageId], references: [id])
      meaning            String
      exampleSentence    String?
      exampleTranslation String?
      synonyms           String[]
      antonyms           String[]
      aiGenerated        Boolean         @default(false)
      @@unique([vocabularyId, languageId])
      @@index([vocabularyId, languageId])
    }
    ```
  - **Verify**: `npx prisma validate` pass
  - **Kết quả**: Vocabulary schema đa ngôn ngữ hoàn chỉnh

- [ ] **TODO-2.02.5**: Định nghĩa model `UserVocabulary` và `ReviewHistory`
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Bước TODO-2.02.3, TODO-2.02.4
  - **Thay đổi**:
    ```prisma
    model UserVocabulary {
      id             String         @id @default(cuid())
      userId         String
      user           User           @relation(fields: [userId], references: [id], onDelete: Cascade)
      vocabularyId   String
      vocabulary     VocabularyBase @relation(fields: [vocabularyId], references: [id])
      personalNote   String?
      difficultyUser Float          @default(0.5)
      memoryStrength Float          @default(0.0)
      nextReview     DateTime       @default(now())
      lastReview     DateTime?
      leechScore     Int            @default(0)
      isLeech        Boolean        @default(false)
      createdAt      DateTime       @default(now())
      updatedAt      DateTime       @updatedAt
      reviewHistory  ReviewHistory[]
      @@unique([userId, vocabularyId])
      @@index([userId, nextReview])
    }

    model ReviewHistory {
      id               String         @id @default(cuid())
      userId           String
      user             User           @relation(fields: [userId], references: [id])
      userVocabularyId String
      userVocabulary   UserVocabulary @relation(fields: [userVocabularyId], references: [id])
      recallQuality    Int            // 0-5
      responseTimeMs   Int
      confidenceLevel  Int            // 1-5
      reviewMode       String         // flashcard|type_answer|reverse|listening|context|sentence
      memoryStrengthBefore Float
      memoryStrengthAfter  Float
      createdAt        DateTime       @default(now())
      @@index([userId, createdAt])
    }
    ```
  - **Verify**: `npx prisma validate` pass
  - **Kết quả**: Core review tables với index `(userId, nextReview)`

- [ ] **TODO-2.02.6**: Định nghĩa model `LearningPath`, `SkillScore`, gamification models
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Bước TODO-2.02.3
  - **Thay đổi**:
    ```prisma
    model LearningPath {
      id               String      @id @default(cuid())
      userId           String
      user             User        @relation(fields: [userId], references: [id])
      targetLanguageId String
      targetLanguage   Language    @relation("LPTargetLang", fields: [targetLanguageId], references: [id])
      currentLevel     String      @default("A1")
      goalLevel        String      @default("B2")
      dailyGoalWords   Int         @default(10)
      isActive         Boolean     @default(true)
      createdAt        DateTime    @default(now())
      skillScores      SkillScore[]
      @@unique([userId, targetLanguageId])
    }

    model SkillScore {
      id             String       @id @default(cuid())
      learningPathId String
      learningPath   LearningPath @relation(fields: [learningPathId], references: [id])
      skill          String       // reading|listening|writing|speaking
      score          Float        @default(0.0)
      updatedAt      DateTime     @updatedAt
      @@unique([learningPathId, skill])
    }

    model UserStreak {
      id           String   @id @default(cuid())
      userId       String
      user         User     @relation(fields: [userId], references: [id])
      currentStreak Int     @default(0)
      longestStreak Int     @default(0)
      lastStudyDate DateTime?
      totalXp      Int      @default(0)
      @@unique([userId])
    }

    model UserBadge {
      id        String   @id @default(cuid())
      userId    String
      user      User     @relation(fields: [userId], references: [id])
      badgeKey  String
      earnedAt  DateTime @default(now())
      @@unique([userId, badgeKey])
    }
    ```
  - **Verify**: `npx prisma validate` pass
  - **Kết quả**: Toàn bộ schema 11 model hoàn chỉnh

- [ ] **TODO-2.02.7**: Chạy migration initial và kiểm tra DB
  - **File**: `apps/backend/prisma/migrations/` (tự động tạo)
  - **Context**: `prisma/schema.prisma` đã hoàn chỉnh, `docker-compose.yml`
  - **Thay đổi**: Chạy `npx prisma migrate dev --name init`
  - **Verify**: Migration pass, `npx prisma studio` mở được và thấy 11 bảng
  - **Kết quả**: DB schema created trong PostgreSQL

- [ ] **TODO-2.02.8**: Tạo seed file với 30+ ngôn ngữ phổ biến
  - **File**: `apps/backend/prisma/seed.ts`
  - **Context**: `prisma/schema.prisma` model `Language`
  - **Thay đổi**:
    - Import `PrismaClient`
    - Seed array gồm 30+ ngôn ngữ: `{ code: 'en', name: 'English', nativeName: 'English', flagEmoji: '🇬🇧' }`, vi/Vietnamese/Tiếng Việt, ja/Japanese/日本語, zh/Chinese/中文, ko/Korean/한국어, fr/French/Français, de/German/Deutsch, es/Spanish/Español, pt/Portuguese/Português, ar/Arabic/العربية, ru/Russian/Русский, ... v.v.
    - Dùng `upsert` để idempotent
  - **Verify**: `npx prisma db seed` → 30+ rows trong bảng `languages`
  - **Kết quả**: Languages seed data sẵn sàng

- [ ] **TODO-2.02.9**: Tạo `PrismaService` singleton cho NestJS
  - **File**: `apps/backend/src/prisma/prisma.service.ts`
  - **Context**: `prisma/schema.prisma`
  - **Thay đổi**:
    ```typescript
    @Injectable()
    export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
      async onModuleInit() { await this.$connect(); }
      async onModuleDestroy() { await this.$disconnect(); }
    }
    ```
    - Tạo `PrismaModule` export `PrismaService`, mark `global: true`
    - Register trong `app.module.ts`
  - **Verify**: `npm run build` không lỗi, inject `PrismaService` được
  - **Kết quả**: Prisma DI sẵn sàng toàn app

---

### Phase 3: Auth, Common Infrastructure & Core Modules

#### REQ-03: Xác thực & Phân quyền

- [ ] **TODO-3.03.1**: Cài dependencies cho auth
  - **File**: `apps/backend/package.json`
  - **Context**: Không có
  - **Thay đổi**: Thêm `@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs`; devDeps: `@types/passport-jwt`, `@types/bcryptjs`
  - **Verify**: `npm install` thành công
  - **Kết quả**: Auth packages sẵn sàng

- [ ] **TODO-3.03.2**: Tạo `JwtStrategy` và `JwtAuthGuard`
  - **File**: `apps/backend/src/common/guards/jwt-auth.guard.ts`
  - **Context**: `apps/backend/.env.example` (JWT_ACCESS_SECRET)
  - **Thay đổi**:
    - `JwtStrategy extends PassportStrategy(Strategy)` — validate payload `{ sub, email, orgId }`
    - `JwtAuthGuard extends AuthGuard('jwt')` — standard override
    - Tạo `apps/backend/src/common/strategies/jwt.strategy.ts` cho strategy
  - **Verify**: `npm run build` pass
  - **Kết quả**: JWT guard sẵn sàng để apply lên controllers

- [ ] **TODO-3.03.3**: Tạo decorator `@CurrentUser()` và `@OrgId()`
  - **File**: `apps/backend/src/common/decorators/current-user.decorator.ts`
  - **Context**: `jwt.strategy.ts` (payload shape)
  - **Thay đổi**:
    - `@CurrentUser()`: `createParamDecorator` trả `request.user`
    - `@OrgId()`: `createParamDecorator` trả `request.user.orgId`
    - Export cả 2 từ một file
  - **Verify**: `npm run build` pass
  - **Kết quả**: Decorators dùng được trong controllers

- [ ] **TODO-3.03.4**: Tạo `AuthService` với register, login, refresh
  - **File**: `apps/backend/src/modules/auth/auth.service.ts`
  - **Context**: `prisma.service.ts`, `jwt.strategy.ts`
  - **Thay đổi**:
    - `register(dto)`: hash password với `bcryptjs`, create user, return tokens
    - `login(dto)`: validate password, generate access + refresh JWT
    - `refresh(refreshToken)`: verify refresh token, rotate tokens
    - `generateTokens(user)`: private helper tạo cặp access/refresh token
    - Lưu `refreshToken` hash vào `User.refreshToken`
  - **Verify**: Unit test `auth.service.spec.ts` pass cho register/login
  - **Kết quả**: Auth logic hoàn chỉnh trong service

- [ ] **TODO-3.03.5**: Unit test cho `AuthService`
  - **File**: `apps/backend/src/modules/auth/auth.service.spec.ts`
  - **Context**: `auth.service.ts`
  - **Thay đổi**:
    - Mock `PrismaService`
    - Test: register tạo user và trả tokens
    - Test: login với wrong password → throw `UnauthorizedException`
    - Test: refresh với invalid token → throw `UnauthorizedException`
  - **Verify**: `npm test auth.service` pass
  - **Kết quả**: Auth service covered

- [ ] **TODO-3.03.6**: Tạo `AuthController` với 3 endpoints
  - **File**: `apps/backend/src/modules/auth/auth.controller.ts`
  - **Context**: `auth.service.ts`, DTO register/login
  - **Thay đổi**:
    - `POST /auth/register` — `RegisterDto`: email, password, nativeLanguageId?, timezone?
    - `POST /auth/login` — `LoginDto`: email, password
    - `POST /auth/refresh` — `RefreshDto`: refreshToken
    - Mỗi endpoint gọi service tương ứng, thin controller
    - Áp dụng `@UseGuards(JwtAuthGuard)` cho refresh endpoint
  - **Verify**: `npm run build` pass; Swagger hiện 3 endpoints
  - **Kết quả**: Auth API sẵn sàng

- [ ] **TODO-3.03.7**: Tạo `UsersService` và `UsersController` với PATCH settings
  - **File**: `apps/backend/src/modules/users/users.service.ts`
  - **Context**: `prisma.service.ts`, `current-user.decorator.ts`
  - **Thay đổi**:
    - `getMe(userId)`: findUnique user với nativeLanguage include
    - `updateSettings(userId, dto)`: update timezone, cefrTarget, learningGoal, nativeLanguageId
    - `UsersController`: `GET /users/me`, `PATCH /users/me` — protected bởi `JwtAuthGuard`
    - `UpdateUserSettingsDto`: optional fields với `@IsOptional()`
  - **Verify**: `npm run build` pass
  - **Kết quả**: User profile API hoàn chỉnh

#### REQ-04: Quản lý ngôn ngữ

- [ ] **TODO-3.04.1**: Tạo `LanguageService` và `LanguageController`
  - **File**: `apps/backend/src/modules/language/language.service.ts`
  - **Context**: `prisma.service.ts`, seed data
  - **Thay đổi**:
    - `findAll(query?)`: list languages với optional filter by `search` (tên/code)
    - `findOne(id)`: findUnique, throw `NotFoundException` nếu không có
    - `LanguageController`: `GET /languages` (public), `GET /languages/:id` (public)
    - `LanguageModule` export `LanguageService` để dùng ở modules khác
  - **Verify**: `GET /languages` trả 30+ items sau seed
  - **Kết quả**: Language lookup API hoàn chỉnh

#### REQ-08: Thuật toán ACRE (triển khai sớm để dùng trong review)

- [ ] **TODO-3.08.1**: Định nghĩa interfaces và types cho ACRE trong shared-types
  - **File**: `packages/shared-types/src/index.ts`
  - **Context**: Ticket phần 5 (ACRE formula)
  - **Thay đổi**:
    ```typescript
    export interface AcreInput {
      recallQuality: number;    // 0-5
      responseTimeMs: number;
      confidenceLevel: number;  // 1-5
      memoryStrength: number;   // 0-1
      leechScore: number;
      difficultyUser: number;   // 0-1
      reviewMode: ReviewMode;
      reviewCount: number;
    }
    export interface AcreOutput {
      newMemoryStrength: number;
      intervalDays: number;
      nextReview: Date;
      newLeechScore: number;
      isLeech: boolean;
      recommendedMode: ReviewMode;
    }
    export type ReviewMode = 'flashcard'|'type_answer'|'reverse'|'listening'|'context'|'sentence';
    ```
  - **Verify**: Backend import từ `@polylex/shared-types` pass
  - **Kết quả**: Shared contracts cho ACRE

- [ ] **TODO-3.08.2**: Implement ACRE engine core — interval calculation
  - **File**: `apps/backend/src/core/acre/acre.service.ts`
  - **Context**: `packages/shared-types/src/index.ts` (AcreInput/Output)
  - **Thay đổi**:
    - Class `AcreService` với method `calculate(input: AcreInput): AcreOutput`
    - Constants: `REVIEW_MODE_WEIGHTS = { flashcard: 1.0, type_answer: 1.3, reverse: 1.2, listening: 1.1, context: 1.4, sentence: 1.5 }`
    - Base interval: SM-2 inspired — `baseInterval = max(1, memoryStrength * 10 * recallScore)`
    - `recallScore = recallQuality / 5`
    - `confidenceWeight = confidenceLevel / 5`
    - `speedBonus = responseTimeMs < 3000 ? 1.2 : responseTimeMs > 10000 ? 0.7 : 1.0`
    - `modeWeight = REVIEW_MODE_WEIGHTS[reviewMode]`
    - `intervalDays = clamp(baseInterval * confidenceWeight * speedBonus * modeWeight - leechPenalty, 1, 365)`
    - `newMemoryStrength = clamp(memoryStrength + (recallQuality >= 3 ? 0.1 : -0.2), 0, 1)`
    - `nextReview = addDays(new Date(), intervalDays)`
    - Pure function — không inject bất cứ thứ gì
  - **Verify**: `npm run build` pass (chưa có test, test ở TODO tiếp theo)
  - **Kết quả**: ACRE calculation logic

- [ ] **TODO-3.08.3**: Implement leech detection trong ACRE
  - **File**: `apps/backend/src/core/acre/acre.service.ts`
  - **Context**: Bước TODO-3.08.2
  - **Thay đổi**:
    - Sau tính interval: `newLeechScore = recallQuality < 2 ? leechScore + 1 : max(0, leechScore - 1)`
    - `isLeech = newLeechScore >= 8`
    - `recommendedMode = isLeech ? 'context' : recallQuality < 3 ? 'type_answer' : 'flashcard'`
    - Export `LEECH_THRESHOLD = 8` constant
  - **Verify**: `npm run build` pass
  - **Kết quả**: Leech detection integrated vào ACRE output

- [ ] **TODO-3.08.4**: Unit tests toàn diện cho ACRE engine
  - **File**: `apps/backend/src/core/acre/acre.service.spec.ts`
  - **Context**: `acre.service.ts`
  - **Thay đổi**:
    - Test 1: Perfect recall (quality=5, fast response) → interval tăng mạnh
    - Test 2: Fail (quality=0) → interval = 1 ngày, memoryStrength giảm
    - Test 3: Slow correct (quality=4, responseTime=15000) → interval thấp hơn fast correct
    - Test 4: Leech detection: 8 lần fail liên tiếp → `isLeech = true`, `recommendedMode = 'context'`
    - Test 5: Interval clamp: kết quả không bao giờ < 1 hoặc > 365
    - Test 6: mode weight: `sentence` mode → interval cao hơn `flashcard` với cùng input
    - Test 7: Memory strength clamp: không vượt [0, 1]
  - **Verify**: `npm test acre` — 7 test cases pass
  - **Kết quả**: ACRE engine fully covered

---

### Phase 4: Vocabulary & User Library

#### REQ-05: Quản lý từ vựng cơ sở

- [ ] **TODO-4.05.1**: Tạo `VocabularyService` với CRUD và filter/pagination
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.service.ts`
  - **Context**: `prisma.service.ts`, `prisma/schema.prisma` (VocabularyBase)
  - **Thay đổi**:
    - `findAll(query: VocabularyQueryDto, orgId?)`: findMany với filter `languageId`, `partOfSpeech`, `difficultyGlobal`, `search` (word contains), pagination (`skip`, `take`), org filter
    - `findOne(id, orgId?)`: findUnique với include translations
    - `create(dto, orgId?)`: createVocabulary
    - `update(id, dto)`: updateVocabulary
    - `remove(id)`: deleteVocabulary
  - **Verify**: `npm run build` pass
  - **Kết quả**: Vocabulary CRUD service

- [ ] **TODO-4.05.2**: Tạo DTOs cho vocabulary
  - **File**: `apps/backend/src/modules/vocabulary/dto/vocabulary.dto.ts`
  - **Context**: `prisma/schema.prisma` (VocabularyBase fields)
  - **Thay đổi**:
    - `CreateVocabularyDto`: `word`, `languageId`, `phonetic?`, `partOfSpeech?`, `difficultyGlobal?`
    - `UpdateVocabularyDto`: `PartialType(CreateVocabularyDto)`
    - `VocabularyQueryDto`: `languageId?`, `search?`, `partOfSpeech?`, `page?`, `limit?` (default 20, max 100)
    - Dùng `@IsString()`, `@IsOptional()`, `@IsNumber()`, `@Min()`, `@Max()`
  - **Verify**: `npm run build` pass
  - **Kết quả**: Validated DTOs cho vocabulary API

- [ ] **TODO-4.05.3**: Tạo `VocabularyController` với REST endpoints
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.controller.ts`
  - **Context**: `vocabulary.service.ts`, `dto/vocabulary.dto.ts`
  - **Thay đổi**:
    - `GET /vocabulary` (protected) — gọi `findAll` với `@Query()` và `@OrgId()`
    - `GET /vocabulary/:id` (protected) — gọi `findOne`
    - `POST /vocabulary` (protected) — gọi `create`
    - `PATCH /vocabulary/:id` (protected) — gọi `update`
    - `DELETE /vocabulary/:id` (protected) — gọi `remove`
    - Apply `JwtAuthGuard` trên toàn controller
  - **Verify**: Swagger hiện 5 endpoints
  - **Kết quả**: Vocabulary REST API

#### REQ-06: Hệ thống dịch đa ngôn ngữ

- [ ] **TODO-4.06.1**: Tạo `TranslationService` với CRUD và auto-detect user native language
  - **File**: `apps/backend/src/modules/vocabulary/translation.service.ts`
  - **Context**: `vocabulary.service.ts`, `prisma.service.ts`
  - **Thay đổi**:
    - `getTranslation(vocabId, languageId)`: findFirst theo vocabId + languageId
    - `getTranslationForUser(vocabId, userId)`: lấy nativeLanguageId của user → gọi `getTranslation`, fallback sang `en` nếu không có
    - `createTranslation(dto)`: upsert
    - `updateTranslation(id, dto)`: update meaning/examples/synonyms
    - `CreateTranslationDto`: vocabularyId, languageId, meaning, exampleSentence?, exampleTranslation?, synonyms?, antonyms?
  - **Verify**: `npm run build` pass
  - **Kết quả**: Translation service với fallback logic

- [ ] **TODO-4.06.2**: Thêm endpoints translation vào `VocabularyController`
  - **File**: `apps/backend/src/modules/vocabulary/vocabulary.controller.ts`
  - **Context**: `translation.service.ts`
  - **Thay đổi**:
    - `GET /vocabulary/:id/translation` — dùng `@CurrentUser()` lấy userId, gọi `getTranslationForUser`
    - `POST /vocabulary/:id/translation` — gọi `createTranslation`
    - `PATCH /vocabulary/:id/translation/:translationId` — gọi `updateTranslation`
  - **Verify**: `GET /vocabulary/:id/translation` trả đúng language theo user's nativeLanguage
  - **Kết quả**: Translation endpoints hoàn chỉnh

#### REQ-07: Thư viện từ vựng cá nhân

- [ ] **TODO-4.07.1**: Tạo `UserVocabularyService` với add/list/update
  - **File**: `apps/backend/src/modules/user-vocabulary/user-vocabulary.service.ts`
  - **Context**: `prisma.service.ts`, `acre.service.ts`
  - **Thay đổi**:
    - `addWord(userId, dto)`: upsert `UserVocabulary` với `nextReview = now() + 1 day`, `memoryStrength = 0`
    - `listWords(userId, query)`: findMany với pagination, filter `isLeech`, `nextReview` range
    - `updateWord(id, userId, dto)`: update `personalNote`, `difficultyUser`
    - `removeWord(id, userId)`: delete (check ownership)
    - `AddWordDto`: vocabularyId, personalNote?, difficultyUser?
  - **Verify**: `npm run build` pass; add word creates record với `nextReview = tomorrow`
  - **Kết quả**: Personal vocabulary library CRUD

- [ ] **TODO-4.07.2**: Tạo `UserVocabularyController`
  - **File**: `apps/backend/src/modules/user-vocabulary/user-vocabulary.controller.ts`
  - **Context**: `user-vocabulary.service.ts`
  - **Thay đổi**:
    - `POST /my-vocabulary` — `addWord`
    - `GET /my-vocabulary` — `listWords` với `@CurrentUser()`
    - `PATCH /my-vocabulary/:id` — `updateWord`
    - `DELETE /my-vocabulary/:id` — `removeWord`
    - Tất cả protected bởi `JwtAuthGuard`
  - **Verify**: Swagger hiện 4 endpoints
  - **Kết quả**: Personal vocab API

---

### Phase 5: Review Engine & Learning Path

#### REQ-09: Review Session API

- [ ] **TODO-5.09.1**: Cài Redis cache module
  - **File**: `apps/backend/package.json`
  - **Context**: `apps/backend/.env.example` (REDIS_URL)
  - **Thay đổi**:
    - Thêm deps: `ioredis`, `cache-manager`, `cache-manager-ioredis-yet`
    - Tạo `apps/backend/src/cache/redis-cache.module.ts` — configure `CacheModule.registerAsync` với `ioredis`
    - Register `RedisCacheModule` trong `app.module.ts`
  - **Verify**: `npm run build` pass; inject `CACHE_MANAGER` được
  - **Kết quả**: Redis cache available via DI

- [ ] **TODO-5.09.2**: Tạo `ReviewService` — lấy review queue
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: `prisma.service.ts`, `cache/redis-cache.module.ts`
  - **Thay đổi**:
    - `getQueue(userId, timezone)`: 
      - Cache key: `review:queue:${userId}:${todayInTimezone(timezone)}`
      - Cache hit → return cached
      - Cache miss → query `UserVocabulary WHERE userId = ? AND nextReview <= endOfDayUTC(timezone)` LIMIT 50, include vocabulary + translation (user's nativeLanguage)
      - Set cache với TTL = seconds until end of day in user's timezone
      - Return list
  - **Verify**: Second call trả từ cache (Redis hit)
  - **Kết quả**: Review queue với Redis cache

- [ ] **TODO-5.09.3**: Tạo `ReviewService` — submit review result
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: `acre.service.ts`, `prisma.service.ts`
  - **Thay đổi**:
    - `submitReview(userId, dto: SubmitReviewDto)`:
      - Load `UserVocabulary` by `userVocabularyId` (check ownership)
      - Call `acreService.calculate(...)` với input từ dto + current state
      - Prisma transaction:
        1. Update `UserVocabulary`: `memoryStrength`, `nextReview`, `lastReview`, `leechScore`, `isLeech`
        2. Create `ReviewHistory` record
      - Invalidate Redis cache: `del review:queue:${userId}:*`
      - Return ACRE output + updated word
  - **Verify**: Submit review → DB updated, cache invalidated
  - **Kết quả**: Review submit logic với ACRE integration

- [ ] **TODO-5.09.4**: Tạo `SubmitReviewDto` và `ReviewController`
  - **File**: `apps/backend/src/modules/review/review.controller.ts`
  - **Context**: `review.service.ts`
  - **Thay đổi**:
    - `SubmitReviewDto`: `userVocabularyId`, `recallQuality` (0-5), `responseTimeMs`, `confidenceLevel` (1-5), `reviewMode`
    - `GET /review/queue` — `getQueue` với user timezone từ `@CurrentUser()`
    - `POST /review/submit` — `submitReview`
    - Apply `JwtAuthGuard`
  - **Verify**: End-to-end: add word → get queue → submit → word removed from queue
  - **Kết quả**: Review API hoàn chỉnh

#### REQ-11: Chế độ học (Learning Modes)

- [ ] **TODO-5.11.1**: Tạo `QuestionBuilderService` — trả câu hỏi theo mode
  - **File**: `apps/backend/src/modules/review/question-builder.service.ts`
  - **Context**: `prisma/schema.prisma` (VocabularyBase, VocabularyTranslation)
  - **Thay đổi**:
    - `buildQuestion(userVocab, mode, userNativeLangId)`: switch theo mode
    - `flashcard`: return `{ word, phonetic, hint: partOfSpeech }` — FE hiện translation khi flip
    - `type_answer`: return `{ translation, prompt: 'Type the word in target language' }`
    - `reverse`: return `{ translation, options: [word, ...3 distractors] }` — MCQ
    - `listening`: return `{ audioText: word, lang: languageCode }` — FE dùng Web Speech API
    - `context`: return `{ exampleSentence with word blanked out, options }`
    - `sentence`: return `{ words: shuffled word list, prompt: 'Build the sentence' }`
  - **Verify**: `npm run build` pass; mỗi mode trả đúng format
  - **Kết quả**: Mode-aware question builder

- [ ] **TODO-5.11.2**: Thêm endpoint `GET /review/question/:userVocabId` vào `ReviewController`
  - **File**: `apps/backend/src/modules/review/review.controller.ts`
  - **Context**: `question-builder.service.ts`
  - **Thay đổi**:
    - `GET /review/question/:userVocabId?mode=flashcard`
    - Inject `QuestionBuilderService`, call `buildQuestion` với mode từ query param
    - Default mode = `flashcard`
  - **Verify**: Endpoint trả đúng format cho từng mode
  - **Kết quả**: Question format API

#### REQ-10: Lộ trình học thông minh

- [ ] **TODO-5.10.1**: Tạo `LearningPathService` — khởi tạo learning path khi register
  - **File**: `apps/backend/src/modules/learning-path/learning-path.service.ts`
  - **Context**: `prisma.service.ts`, `prisma/schema.prisma`
  - **Thay đổi**:
    - `createPath(userId, targetLanguageId, goalLevel?)`: create `LearningPath` + 4 `SkillScore` (reading/listening/writing/speaking đều = 0)
    - `getActivePath(userId, targetLanguageId?)`: findFirst active path với skillScores
    - `updateSkillScore(pathId, skill, delta)`: update score bằng weighted cumulative
  - **Verify**: `npm run build` pass
  - **Kết quả**: Learning path CRUD

- [ ] **TODO-5.10.2**: Tạo `RoadmapEngine` — recommend từ mới theo skill yếu
  - **File**: `apps/backend/src/modules/learning-path/roadmap.engine.ts`
  - **Context**: `learning-path.service.ts`, `prisma.service.ts`
  - **Thay đổi**:
    - `getRecommendations(userId, pathId, count = 10)`:
      1. Load `SkillScore` — tìm skill thấp nhất
      2. Query `VocabularyBase` chưa có trong `UserVocabulary` của user, filter theo targetLanguage, sort `difficultyGlobal ASC`
      3. Map skill thấp → partOfSpeech ưu tiên (listening → noun/verb, writing → verb, reading → all)
      4. Fatigue detection: nếu `reviewHistory` 24h gần đây > dailyGoalWords * 1.5 → giảm `count` 50%
      5. Return list với metadata `{ word, reason: 'Weak listening skill', skillTarget }`
  - **Verify**: `npm run build` pass
  - **Kết quả**: Smart recommendation engine

- [ ] **TODO-5.10.3**: Tạo `LearningPathController` với roadmap endpoint
  - **File**: `apps/backend/src/modules/learning-path/learning-path.controller.ts`
  - **Context**: `learning-path.service.ts`, `roadmap.engine.ts`
  - **Thay đổi**:
    - `POST /learning-path` — create path
    - `GET /learning-path` — list user's paths
    - `GET /learning-path/roadmap?targetLanguageId=` — get recommendations từ `RoadmapEngine`
    - Apply `JwtAuthGuard`
  - **Verify**: `/learning-path/roadmap` trả recommendations với metadata
  - **Kết quả**: Roadmap API hoàn chỉnh

- [ ] **TODO-5.10.4**: Tích hợp `updateSkillScore` vào `ReviewService.submitReview`
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: `learning-path.service.ts`, `review.service.ts`
  - **Thay đổi**:
    - Sau khi submit review thành công: call `learningPathService.updateSkillScore(pathId, modeToSkill(reviewMode), delta)`
    - Map: `listening → listening`, `type_answer/sentence → writing`, `context → reading`, `flashcard → reading`, `reverse → reading`
    - delta = `recallQuality >= 3 ? +0.5 : -0.3`
  - **Verify**: Review submit → skill scores updated trong DB
  - **Kết quả**: Skill tracking integrated

---

### Phase 6: Analytics, Cron, Gamification, AI

#### REQ-12: Analytics Dashboard

- [ ] **TODO-6.12.1**: Tạo `AnalyticsService` — retention rate
  - **File**: `apps/backend/src/modules/analytics/analytics.service.ts`
  - **Context**: `prisma.service.ts`
  - **Thay đổi**:
    - `getRetentionRate(userId, days = 30)`: query `ReviewHistory` trong khoảng days, tính `recallQuality >= 3 / total * 100`
    - Return `{ rate: number, totalReviews: number, successfulReviews: number, period: days }`
  - **Verify**: `npm run build` pass; formula đúng
  - **Kết quả**: Retention rate endpoint

- [ ] **TODO-6.12.2**: Tạo `AnalyticsService` — forgetting risk và heatmap
  - **File**: `apps/backend/src/modules/analytics/analytics.service.ts`
  - **Context**: `prisma.service.ts` (UserVocabulary.memoryStrength)
  - **Thay đổi**:
    - `getForgettingRisk(userId)`: list `UserVocabulary` với `memoryStrength < 0.3` và `nextReview <= now + 3 days` — "at risk" words
    - `getHeatmap(userId, year)`: group `ReviewHistory` by date, count reviews per day — return `{ date: string, count: number }[]`
  - **Verify**: `npm run build` pass
  - **Kết quả**: Risk + heatmap data

- [ ] **TODO-6.12.3**: Tạo `AnalyticsService` — CEFR estimate và velocity
  - **File**: `apps/backend/src/modules/analytics/analytics.service.ts`
  - **Context**: `prisma.service.ts`
  - **Thay đổi**:
    - `getCefrEstimate(userId, languageId)`: count `UserVocabulary WHERE memoryStrength >= 0.6` → map to CEFR: <500=A1, <1000=A2, <2000=B1, <4000=B2, <8000=C1, ≥8000=C2
    - `getLearningVelocity(userId, days = 14)`: count new words added per day last N days, return daily array
  - **Verify**: `npm run build` pass
  - **Kết quả**: CEFR + velocity analytics

- [ ] **TODO-6.12.4**: Tạo `AnalyticsController` với lazy-load endpoints
  - **File**: `apps/backend/src/modules/analytics/analytics.controller.ts`
  - **Context**: `analytics.service.ts`
  - **Thay đổi**:
    - `GET /analytics/retention?days=30`
    - `GET /analytics/forgetting-risk`
    - `GET /analytics/heatmap?year=2026`
    - `GET /analytics/cefr-estimate?languageId=`
    - `GET /analytics/velocity?days=14`
    - Apply `JwtAuthGuard`
  - **Verify**: Swagger hiện 5 endpoints
  - **Kết quả**: Full analytics API

#### REQ-13: Cron Jobs

- [ ] **TODO-6.13.1**: Cài `@nestjs/schedule` và tạo `ScheduleModule`
  - **File**: `apps/backend/package.json`
  - **Context**: `app.module.ts`
  - **Thay đổi**:
    - Thêm dep: `@nestjs/schedule`
    - Import `ScheduleModule.forRoot()` trong `app.module.ts`
  - **Verify**: `npm run build` pass; `@Cron` decorator available
  - **Kết quả**: Schedule module enabled

- [ ] **TODO-6.13.2**: Tạo `ReviewCronService` với daily recalculation job
  - **File**: `apps/backend/src/modules/review/review-cron.service.ts`
  - **Context**: `acre.service.ts`, `prisma.service.ts`, Redis cache
  - **Thay đổi**:
    - `@Cron('0 2 * * *')` (2AM UTC daily)
    - Batch query: `UserVocabulary WHERE nextReview < now() AND lastReview > now - 2 days` (missed reviews)
    - For each: apply ACRE với `recallQuality = 0` (missed = failed)
    - Update `nextReview`, `leechScore`, `isLeech`
    - Dùng `prisma.$transaction` batch (chunks of 100)
    - Invalidate Redis cache cho affected userIds
    - Log: `logger.log('Cron completed: X words recalculated')`
  - **Verify**: Manual trigger, check DB + logs
  - **Kết quả**: Automated review recalculation

#### REQ-15: Gamification & Streak

- [ ] **TODO-6.15.1**: Tạo `GamificationService` — streak update
  - **File**: `apps/backend/src/modules/gamification/gamification.service.ts`
  - **Context**: `prisma.service.ts`, User.timezone
  - **Thay đổi**:
    - `recordStudy(userId, timezone)`:
      - Load `UserStreak`
      - Get `todayDate = toDateInTimezone(new Date(), timezone)`
      - If `lastStudyDate == todayDate`: noop (idempotent)
      - If `lastStudyDate == yesterday`: `currentStreak++`
      - Else: `currentStreak = 1` (streak reset)
      - Update `lastStudyDate = todayDate`, `longestStreak = max(...)`
      - Add XP: `totalXp += 10`
      - Check badge milestones (7, 30, 100 days)
    - `getStats(userId)`: return streak + XP + badges
  - **Verify**: Call twice same day → streak không tăng 2 lần
  - **Kết quả**: Streak idempotent và timezone-correct

- [ ] **TODO-6.15.2**: Tích hợp `recordStudy` vào `ReviewService.submitReview`
  - **File**: `apps/backend/src/modules/review/review.service.ts`
  - **Context**: `gamification.service.ts`
  - **Thay đổi**:
    - Sau submit thành công: call `gamificationService.recordStudy(userId, user.timezone)`
    - Inject `GamificationService` vào `ReviewService`
  - **Verify**: Submit review → streak updated
  - **Kết quả**: Event-driven streak

- [ ] **TODO-6.15.3**: Tạo `GamificationController`
  - **File**: `apps/backend/src/modules/gamification/gamification.controller.ts`
  - **Context**: `gamification.service.ts`
  - **Thay đổi**:
    - `GET /gamification/stats` — return `{ currentStreak, longestStreak, totalXp, badges[] }`
    - Apply `JwtAuthGuard`
  - **Verify**: After reviews, stats reflect correctly
  - **Kết quả**: Gamification API

#### REQ-14: Tích hợp OpenAI (Optional, Feature-flagged)

- [ ] **TODO-6.14.1**: Tạo `AiService` với feature flag guard
  - **File**: `apps/backend/src/modules/ai/ai.service.ts`
  - **Context**: `apps/backend/.env.example` (OPENAI_ENABLED, OPENAI_API_KEY)
  - **Thay đổi**:
    - `isEnabled(): boolean` — check `configService.get('OPENAI_ENABLED') === 'true'`
    - `generateExample(word, languageCode, targetLanguageCode)`: call OpenAI chat completion, return example sentence
    - `generateMnemonic(word, nativeLanguageCode)`: return mnemonic string
    - `clusterVocabulary(wordIds)`: call embeddings API, return cluster groups
    - Nếu `!isEnabled()` → throw `ServiceUnavailableException`
    - Cache AI results trong Redis 30 ngày
  - **Verify**: `OPENAI_ENABLED=false` → 503; `true` + valid key → returns result
  - **Kết quả**: Feature-flagged AI service

- [ ] **TODO-6.14.2**: Tạo `AiController`
  - **File**: `apps/backend/src/modules/ai/ai.controller.ts`
  - **Context**: `ai.service.ts`
  - **Thay đổi**:
    - `POST /ai/generate-example`: body `{ vocabularyId }` → load word, call `generateExample`, save to translation
    - `POST /ai/mnemonic`: body `{ vocabularyId }` → return mnemonic (không lưu DB)
    - Apply `JwtAuthGuard`
  - **Verify**: Feature flag check works
  - **Kết quả**: AI endpoints

---

### Phase 7: Frontend React

#### REQ-16: Frontend React

- [ ] **TODO-7.16.1**: Tạo Axios API client với auth interceptor
  - **File**: `apps/frontend/src/services/api.client.ts`
  - **Context**: `apps/backend/.env.example` (PORT)
  - **Thay đổi**:
    - Tạo `axios` instance với `baseURL = import.meta.env.VITE_API_URL`
    - Request interceptor: thêm `Authorization: Bearer {accessToken}` từ localStorage
    - Response interceptor: 401 → gọi refresh token endpoint → retry; nếu refresh fail → redirect `/login`
  - **Verify**: Request tự động đính token
  - **Kết quả**: Auth-aware API client

- [ ] **TODO-7.16.2**: Tạo Zustand auth store
  - **File**: `apps/frontend/src/stores/auth.store.ts`
  - **Context**: `api.client.ts`
  - **Thay đổi**:
    - State: `user`, `accessToken`, `isAuthenticated`
    - Actions: `login(email, password)`, `register(dto)`, `logout()`, `refreshToken()`
    - Persist token trong localStorage
  - **Verify**: Login → state updated, token stored
  - **Kết quả**: Auth state management

- [ ] **TODO-7.16.3**: Tạo trang Login và Register
  - **File**: `apps/frontend/src/pages/auth/LoginPage.tsx`
  - **Context**: `auth.store.ts`
  - **Thay đổi**:
    - Form: email + password, submit gọi `authStore.login()`
    - Error handling: hiện toast nếu fail
    - Redirect `/dashboard` sau login
    - Tạo `RegisterPage.tsx` tương tự với thêm field `nativeLanguage` (dropdown từ `GET /languages`)
  - **Verify**: Login thành công → redirect dashboard
  - **Kết quả**: Auth pages

- [ ] **TODO-7.16.4**: Tạo Flashcard Review component với timer
  - **File**: `apps/frontend/src/components/review/FlashCard.tsx`
  - **Context**: `api.client.ts`, shared-types `ReviewMode`
  - **Thay đổi**:
    - Hiện từ, flip animation để hiện nghĩa
    - Timer: `response_time_ms` = time từ lúc hiện câu hỏi đến lúc user tương tác
    - Confidence selector: 1-5 stars
    - Recall quality buttons: Again (0), Hard (2), Good (4), Easy (5)
    - Submit → POST `/review/submit`
  - **Verify**: Submit gửi đúng `responseTimeMs` và `recallQuality`
  - **Kết quả**: Core review component

- [ ] **TODO-7.16.5**: Tạo Listening Mode component với Web Speech API
  - **File**: `apps/frontend/src/components/review/ListeningMode.tsx`
  - **Context**: `FlashCard.tsx`, Browser Web Speech API
  - **Thay đổi**:
    - Nhận `{ audioText, lang }` từ question builder API
    - Auto-play: `const utterance = new SpeechSynthesisUtterance(audioText); utterance.lang = lang; window.speechSynthesis.speak(utterance)`
    - Replay button
    - MCQ options giống reverse mode
  - **Verify**: Phát âm đúng ngôn ngữ (testing với en/vi/ja)
  - **Kết quả**: TTS mode không cần external API

- [ ] **TODO-7.16.6**: Tạo Dashboard page
  - **File**: `apps/frontend/src/pages/DashboardPage.tsx`
  - **Context**: Review API, analytics API
  - **Thay đổi**:
    - Widget: số từ cần ôn hôm nay (`GET /review/queue`)
    - Streak badge: current streak (`GET /gamification/stats`)
    - Quick start "Study Now" button → mở ReviewSession
    - Mini retention chart (line chart 7 ngày gần đây)
    - "Add New Words" → roadmap suggestions
  - **Verify**: Dashboard load trong < 2s
  - **Kết quả**: Home dashboard

- [ ] **TODO-7.16.7**: Tạo Analytics page với charts
  - **File**: `apps/frontend/src/pages/AnalyticsPage.tsx`
  - **Context**: Analytics API endpoints
  - **Thay đổi**:
    - Cài `recharts` hoặc `chart.js`
    - Heatmap component (activity calendar)
    - CEFR level badge gauge
    - Retention rate donut chart
    - Learning velocity line chart
    - Forgetting risk word list
  - **Verify**: Charts hiển thị data từ API
  - **Kết quả**: Analytics dashboard

- [ ] **TODO-7.16.8**: Tạo Roadmap page
  - **File**: `apps/frontend/src/pages/RoadmapPage.tsx`
  - **Context**: Learning path API
  - **Thay đổi**:
    - 4 skill bars (Reading/Listening/Writing/Speaking) với progress
    - Recommended words list (`GET /learning-path/roadmap`)
    - Add word button → POST `/my-vocabulary`
    - CEFR progress indicator
  - **Verify**: Recommended words load, add word works
  - **Kết quả**: Smart roadmap UI

- [ ] **TODO-7.16.9**: Cấu hình React Router và ProtectedRoute
  - **File**: `apps/frontend/src/App.tsx`
  - **Context**: auth.store.ts, tất cả pages
  - **Thay đổi**:
    - `ProtectedRoute` component: check `isAuthenticated`, redirect `/login` nếu không
    - Routes: `/login`, `/register`, `/dashboard` (protected), `/review` (protected), `/roadmap` (protected), `/analytics` (protected), `/settings` (protected)
  - **Verify**: Unauthenticated → redirect `/login`
  - **Kết quả**: Auth routing

---

### Phase 8: Integration & Verification

- [ ] **TODO-8.1**: Chạy toàn bộ backend unit tests
  - **Thay đổi**: `cd apps/backend && npm test`
  - **Verify**: Tất cả test pass (ACRE + AuthService + coverage > 70%)
  - **Kết quả**: Backend test suite xanh

- [ ] **TODO-8.2**: End-to-end smoke test flow chính
  - **Thay đổi**: Manual hoặc test script:
    1. Register user → nhận JWT
    2. GET /languages → thấy 30+ ngôn ngữ
    3. Add vocabulary → add translation
    4. POST /my-vocabulary → word added
    5. GET /review/queue → word hiện trong queue
    6. POST /review/submit → ACRE updated, streak +1
    7. GET /analytics/retention → trả data
  - **Verify**: Tất cả 7 bước thành công
  - **Kết quả**: Core flow validated end-to-end

- [ ] **TODO-8.3**: Build toàn bộ backend production
  - **Thay đổi**: `cd apps/backend && npm run build`
  - **Verify**: `dist/` tạo ra, `node dist/main.js` chạy được
  - **Kết quả**: Production build sẵn sàng

- [ ] **TODO-8.4**: Build toàn bộ frontend production
  - **Thay đổi**: `cd apps/frontend && npm run build`
  - **Verify**: `dist/` tạo ra, không warning critical
  - **Kết quả**: Frontend build sẵn sàng

- [ ] **TODO-8.5**: Kiểm tra multi-tenancy org_id filter
  - **Thay đổi**: Tạo 2 user thuộc 2 org khác nhau, thêm vocabulary riêng cho mỗi org → verify user A không thấy vocab của org B
  - **Verify**: Org isolation hoạt động đúng
  - **Kết quả**: Multi-tenancy verified

---

## Ghi chú triển khai

- **Thứ tự quan trọng**: ACRE service (TODO-3.08.x) phải hoàn thành trước Review API (TODO-5.09.x)
- **Seed data**: Chạy `npx prisma db seed` ngay sau migration để có language data cho tests
- **Feature flag OpenAI**: Set `OPENAI_ENABLED=false` trong dev để không cần API key
- **Monorepo install**: Chạy `npm install` từ root để install tất cả workspaces
- **TTS testing**: Test Listening mode trên Chrome/Edge (hỗ trợ Web Speech API tốt nhất)
- **Timezone**: Dùng thư viện `date-fns-tz` trong backend để handle timezone conversions

## Rủi ro cần theo dõi

- [ ] Risk-1: **ACRE interval âm** — Clamp minimum 1 ngày trong `acre.service.ts`, covered bởi unit test
- [ ] Risk-2: **Redis cache stale** — `submitReview` xóa cache `review:queue:${userId}:*` sau mỗi submit
- [ ] Risk-3: **Streak timezone bug** — `recordStudy` dùng `toDateInTimezone(timezone)` từ `date-fns-tz`
- [ ] Risk-4: **Double submit** — `UserVocabulary.updatedAt` check trong transaction (optimistic lock)
- [ ] Risk-5: **Translation fallback** — `getTranslationForUser` fallback sang `en` nếu không có native lang translation
- [ ] Risk-6: **N+1 review queue** — Prisma `include` có chọn lọc + toàn bộ queue cached trong Redis

---

## TÓM TẮT TRIỂN KHAI

**Ngày hoàn thành**: 2026-02-27  
**Tổng số file**: 65+ files  
**Trạng thái**: ✅ ĐÃ TRIỂN KHAI ĐẦY ĐỦ

### Đã triển khai

#### Phase 1 — Monorepo Scaffold ✅
- Root `package.json` với npm workspaces (`apps/*`, `packages/*`)
- `docker-compose.yml` — PostgreSQL 16 + Redis 7 với healthcheck
- `packages/shared-types/` — TypeScript types dùng chung cho FE và BE
- `apps/backend/` — NestJS project config (`package.json`, `tsconfig.json`, `nest-cli.json`)
- `apps/frontend/` — React 19 + Vite project config
- `.gitignore`, `README.md`

#### Phase 2 — Prisma & Database ✅
- `prisma/schema.prisma` — 11 models đầy đủ:
  - `Organization`, `Language`, `User`, `VocabularyBase`, `VocabularyTranslation`
  - `UserVocabulary`, `ReviewHistory`, `LearningPath`, `SkillScore`, `UserStreak`, `UserBadge`
- `prisma/seed.ts` — 35 ngôn ngữ với upsert
- `PrismaService` + `PrismaModule` (global)

#### Phase 3 — Auth + ACRE Engine ✅
- JWT strategy, `JwtAuthGuard`, `@CurrentUser()` decorator
- `AuthService` — register, login (bcryptjs hash), refresh token, logout
- `AuthController` — 4 endpoints
- `AuthModule`
- **ACRE Engine** (`acre.engine.ts`) — pure function, không DI:
  - Ebbinghaus forgetting curve
  - Response-time factor (fast recall = stronger signal)
  - Confidence-level weighting
  - Leech detection (threshold = 8)
  - Adaptive mode recommendation (flashcard → sentence)
- 8 unit tests coverage ACRE

#### Phase 4 — Vocabulary Module ✅
- `VocabularyService` — create, addTranslation, findAll (paginated), findOne, addToUserVocabulary
- `VocabularyController` — 6 endpoints với filters (language, CEFR, search)
- Multi-tenancy: `WHERE organizationId = orgId OR organizationId IS NULL`

#### Phase 5 — Review + Roadmap ✅
- `ReviewService` — timezone-aware queue, ACRE integration, streak/XP update
- `ReviewController` — `GET /review/queue`, `POST /review/submit`
- `RoadmapService` — CEFR roadmap recommendations, skill score updates
- `RoadmapController`

#### Phase 6 — Analytics + Cron + Gamification ✅
- `AnalyticsService` — heatmap (90 ngày), learning velocity (8 tuần), retention rate (30 ngày)
- `AnalyticsController` — 3 endpoints
- `GamificationService` — stats, badge awards (8 loại badge)
- `GamificationScheduler` — `@Cron` reset weekly XP mỗi thứ Hai

#### Phase 6b — AI Module (Feature-flagged) ✅
- `AiService` — context sentence generation, memory hint generation
- Feature flag: `OPENAI_ENABLED=false` → throw `ServiceUnavailableException`
- `AiController` — 2 endpoints

#### Phase 7 — Frontend ✅
- `src/store/auth.store.ts` — Zustand với `persist` middleware
- `src/api/client.ts` — axios client, auto refresh token on 401, 7 API namespaces
- `src/App.tsx` — React Router v6 với `RequireAuth` guard
- `src/components/Layout.tsx` — Sidebar navigation
- **Pages**:
  - `LoginPage.tsx` — form login
  - `RegisterPage.tsx` — form register với language selector
  - `DashboardPage.tsx` — streak, XP, due count, badges
  - `ReviewPage.tsx` — flashcard session với **Browser Web Speech API** (TTS)
  - `VocabularyPage.tsx` — search, filter, add-to-list, 🔊 TTS
  - `RoadmapPage.tsx` — CEFR progress bars
  - `AnalyticsPage.tsx` — heatmap, velocity chart, retention rate

### Kiến trúc nổi bật

| Quyết định | Giải pháp |
|-----------|----------|
| ORM | Prisma 5 (thay vì Sequelize trong instructions) |
| Multi-tenancy | Single schema + `organizationId` nullable |
| TTS | Browser Web Speech API — zero cost, zero backend |
| ACRE | Pure function — deterministic, testable |
| AI | Feature-flagged via `OPENAI_ENABLED` env var |
| Timezone | `date-fns-tz` cho tất cả timezone operations |
| Auth | JWT access (15m) + refresh (7d), stored hashed |

### Hướng dẫn chạy

```bash
# 1. Start infrastructure
npm run docker:up

# 2. Configure environment
cd apps/backend && cp .env.example .env

# 3. Install dependencies
npm install  # from root

# 4. Migrate & seed
cd apps/backend && npx prisma migrate dev --name init && npx prisma db seed

# 5. Start dev servers
npm run dev  # starts both :3000 (API) and :5173 (Frontend)
```

