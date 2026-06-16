# TICKET-032: Demo Token — Trải nghiệm không cần đăng nhập (App Store & Google Play Compliance)

**Status:** 🔴 Required (Blocking App Review)
**Priority:** 🔥 P0 – Blocker
**Platforms:** iOS (App Store), Android (Google Play), Zalo Mini App
**Created:** March 26, 2026
**Updated:** Approach revised — Demo Token strategy (không thay đổi backend auth guards)

---

## Mô tả yêu cầu

Ứng dụng PolyLex hiện yêu cầu đăng nhập bắt buộc trước khi người dùng có thể xem bất kỳ
nội dung nào. Điều này vi phạm chính sách của Apple App Store, Google Play Store, và
guidelines của Zalo Mini App Platform, đồng thời gây ảnh hưởng tiêu cực đến trải nghiệm
người dùng mới.

**Chiến lược triển khai đã được chọn: Demo Token (không thay đổi auth guards phía backend).**
Thay vì mở các endpoint công khai hoặc thêm Optional JWT guard, ứng dụng sẽ tự động phát
hành một JWT demo ngay khi khởi động nếu người dùng chưa có phiên đăng nhập. Demo user có
thể sử dụng toàn bộ tính năng nhưng bị giới hạn: tối đa 1 learning path và 3 quick notes.
Khi chạm giới hạn, hiển thị CTA đăng ký tài khoản thật.

---

## Yêu cầu của các nền tảng

### Apple App Store — Guideline 2.1 (App Completeness)

> "Apps submitted for review, including apps to be reviewed for App Store features such as
> the Today tab, must contain all necessary metadata and be fully functional."

**Diễn giải thực tế:**
App Review team tại Apple phải có khả năng trải nghiệm đầy đủ tính năng cốt lõi mà **không
cần tạo tài khoản cá nhân** hoặc phụ thuộc vào dữ liệu thật của người dùng. Ứng dụng phải
cung cấp một trong hai lựa chọn:
- Tài khoản demo (demo credentials) được ghi rõ trong "Notes for App Review", HOẶC
- **Chế độ khách (Guest Mode)** cho phép duyệt tính năng mà không cần đăng nhập.

**Hậu quả nếu không thực hiện:** Apple sẽ reject build với lý do:
> "Guideline 2.1 – Performance – App Completeness: We were unable to review your app as it
> requires us to log in to an account."

### Apple App Store — Guideline 5.1.1 (Data Collection and Storage)

Apple kỳ vọng ứng dụng **không ép buộc** thu thập thông tin cá nhân trước khi người dùng có
thể trải nghiệm giá trị cơ bản của app. Yêu cầu đăng nhập ngay từ màn hình đầu tiên bị xem
là thu thập dữ liệu quá sớm.

### Google Play Store — Account Requirements Policy

> "If your app requires users to sign in to access core functionality, it must offer a
> guest/demo mode, OR you must provide Google with working test credentials in the
> declaration."

Google Play Developer Policy Center quy định:
- Ứng dụng yêu cầu đăng nhập phải cung cấp **chức năng demo có thể sử dụng được** mà không
  cần tạo tài khoản.
- Người dùng mới phải **hiểu được giá trị ứng dụng** trước khi được yêu cầu đăng ký.
- Nếu không có guest mode, nhà phát triển phải cung cấp test account trong App Content
  Declaration.

### Zalo Mini App Platform Guidelines

- Mini app **không được bắt buộc đăng nhập Zalo ngay khi khởi động**.
- Người dùng phải có thể xem và tương tác với nội dung cơ bản trước khi được gợi ý đăng nhập.
- Đăng nhập chỉ nên được yêu cầu khi người dùng cần tính năng **đồng bộ dữ liệu cá nhân**
  (lưu tiến độ học, xem từ vựng của mình).

---

## Acceptance Criteria

- [ ] Người dùng mới mở app (iOS/Android) **không bị redirect về `/login`** — demo token tự động được phát hành
- [ ] Demo user có thể browse vocabulary, xem roadmap, tạo 1 learning path và viết 3 quick notes
- [ ] Khi demo user chạm giới hạn (path hoặc note), hiển thị upgrade CTA (không crash, không 500)
- [ ] Backend trả `403 DEMO_PATH_LIMIT_REACHED` / `403 DEMO_NOTE_LIMIT_REACHED` với message rõ ràng
- [ ] Zalo Mini App: không bắt buộc đăng nhập Zalo khi khởi động — demo token tự động được dùng
- [ ] Apple App Review có thể duyệt toàn bộ luồng học từ vựng mà không cần tạo tài khoản
- [ ] Đăng nhập tài khoản thật vẫn hoạt động bình thường — thay thế demo session
- [ ] Không có màn hình 401 hoặc loading vô hạn với demo user

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-032 |
| **Tiêu đề** | Demo Token — Trải nghiệm không cần đăng nhập |
| **Mục tiêu** | Tự động phát hành JWT demo khi khởi động app — người dùng trải nghiệm đầy đủ tính năng với giới hạn (1 path, 3 notes), không thay đổi auth guards phía backend |
| **Phạm vi** | Backend (Prisma schema, AuthService, PathsService, QuickNoteService), Frontend (startup logic, upgrade CTA), Zalo Mini App (App.tsx tách riêng) |
| **Độ ưu tiên** | Khẩn cấp — đang chặn resubmit lên App Store/Google Play |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Backend: Thêm DEMO role vào Prisma schema | Thêm `DEMO` vào `enum UserRole` → chạy migration | DB/Schema | Nhỏ |
| REQ-02 | Backend: `POST /auth/demo` endpoint | Endpoint không cần auth — tạo User row với `role: DEMO`, trả access token 7 ngày | API | Nhỏ |
| REQ-03 | Backend: Giới hạn path creation cho DEMO user | Trong `PathsService.createFromAI()`: check `role === DEMO && count >= 1` → `ForbiddenException` | API | Nhỏ |
| REQ-04 | Backend: Giới hạn quick note creation cho DEMO user | Trong `QuickNoteService.create()`: check `role === DEMO && count >= 3` → `ForbiddenException` | API | Nhỏ |
| REQ-05 | Frontend: Auto-issue demo token on startup | Khi app khởi động và `accessToken === null`, tự gọi `POST /auth/demo` và lưu token vào auth store | UI/State | Nhỏ |
| REQ-06 | Frontend: Upgrade CTA khi chạm giới hạn | Khi backend trả 403 với code `DEMO_PATH_LIMIT_REACHED`/`DEMO_NOTE_LIMIT_REACHED`, hiện modal/banner gợi ý đăng ký | UI/State | Trung bình |
| REQ-07 | Zalo Mini App: Tách App.tsx riêng với demo init | Tạo `apps/zalo-miniapp/src/App.tsx` riêng (không re-export frontend App) với router Zalo-specific và auto-demo-token init | UI/State | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 (cần DEMO role trước khi tạo endpoint)
REQ-01 ──> REQ-03 (cần enum DEMO để so sánh)
REQ-01 ──> REQ-04 (cần enum DEMO để so sánh)

REQ-02 ──> REQ-05 (FE cần endpoint tồn tại)
REQ-02 ──> REQ-07 (Zalo cần endpoint tồn tại)

REQ-05 ──> REQ-06 (CTA chỉ cần sau khi auto-init xong)
REQ-07 độc lập với REQ-05 (song song)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Backend — Thêm DEMO role vào Prisma schema
- **Mục tiêu**: `enum UserRole` hiện có `LEARNER`, `ADMIN` — thêm `DEMO`
- **Đầu vào**: `apps/backend/prisma/schema.prisma` line 52
- **Đầu ra mong đợi**: Migration thành công, Prisma client regenerate, `UserRole.DEMO` available trong code
- **Tiêu chí hoàn thành**: `npx prisma migrate dev` thành công, không có TS error sau `generate`
- **Phụ thuộc**: Không

##### REQ-02: Backend — `POST /auth/demo` endpoint
- **Mục tiêu**: Endpoint không cần auth tạo một demo user và trả access token
- **Đầu vào**: Không cần body; rate-limit bằng `@Throttle` theo IP để chống abuse
- **Đầu ra mong đợi**: `200 OK` với `{ accessToken: string }` — access token có expiry 7 ngày (cấu hình qua `JWT_DEMO_EXPIRES_IN`)
- **Design**: Demo user được tạo với `email: \`demo-${uuidv4()}@polylex.guest\``, `passwordHash: null`, `role: DEMO`, `refreshToken: null`. Không có refresh token — khi expired, app tự gọi lại endpoint này
- **Tiêu chí hoàn thành**: `curl -X POST /api/v1/auth/demo` trả 200 với access token; decode JWT có `role: DEMO`
- **Phụ thuộc**: REQ-01

##### REQ-03: Backend — Giới hạn path creation cho DEMO user
- **Mục tiêu**: DEMO user chỉ được tạo tối đa 1 learning path (tổng cộng, không giới hạn theo ngày)
- **Vị trí**: `apps/backend/src/modules/paths/paths.service.ts` — `createFromAI()` method
- **Đầu vào**: `AuthUser` có `role === 'DEMO'` và `id` của demo user
- **Đầu ra mong đợi**: Lần đầu tạo path → thành công; lần hai → `ForbiddenException` với message `DEMO_PATH_LIMIT_REACHED`
- **Pattern sử dụng**: Giống rate limit hiện tại (max 3 paths/day) dùng `prisma.pathTemplate.count({ where: { createdByUserId: userId } })`
- **Tiêu chí hoàn thành**: DEMO user tạo 2 paths → lần 1 OK, lần 2 → 403 `DEMO_PATH_LIMIT_REACHED`
- **Phụ thuộc**: REQ-01

##### REQ-04: Backend — Giới hạn quick note creation cho DEMO user
- **Mục tiêu**: DEMO user chỉ được tạo tối đa 3 quick notes (tổng cộng)
- **Vị trí**: `apps/backend/src/modules/quick-note/quick-note.service.ts` — `create()` method
- **Đầu vào**: `userId` của demo user
- **Đầu ra mong đợi**: Notes 1-3 → thành công; note 4 → `ForbiddenException('DEMO_NOTE_LIMIT_REACHED')`
- **Pattern sử dụng**: `prisma.quickNote.count({ where: { userId } })`
- **Tiêu chí hoàn thành**: DEMO user tạo 4 notes → lần 1-3 OK, lần 4 → 403 `DEMO_NOTE_LIMIT_REACHED`
- **Phụ thuộc**: REQ-01

##### REQ-05: Frontend — Auto-issue demo token on startup
- **Mục tiêu**: Khi app mount lần đầu và `accessToken === null`, tự động gọi `POST /auth/demo` và lưu token
- **Vị trí**: `apps/frontend/src/App.tsx` — trước khi render router; hoặc trong auth store initializer
- **Đầu vào**: Zustand `useAuthStore` state, `accessToken === null`
- **Đầu ra mong đợi**: Trong vài giây đầu, `accessToken` được set với demo token → `RequireAuth` pass-through
- **Tiêu chí hoàn thành**: Fresh install → app mở trực tiếp vào home/vocabulary, không thấy login screen
- **Phụ thuộc**: REQ-02

##### REQ-06: Frontend — Upgrade CTA khi chạm giới hạn
- **Mục tiêu**: Khi backend trả `403` với error message `DEMO_PATH_LIMIT_REACHED` hoặc `DEMO_NOTE_LIMIT_REACHED`, hiển thị upgrade prompt
- **Vị trí**: Trang tạo path (RoadmapPage/PathGenerator) và quick note creation
- **Đầu vào**: HTTP 403 response body chứa `message: 'DEMO_PATH_LIMIT_REACHED'`
- **Đầu ra mong đợi**: Modal hoặc bottom sheet: "Bạn đã dùng hết lượt demo. Đăng ký để tiếp tục!" + nút "Đăng ký ngay" → navigate `/login`
- **Tiêu chí hoàn thành**: DEMO user tạo path thứ 2 → upgrade modal hiện ra → bấm "Đăng ký ngay" → `/login`
- **Phụ thuộc**: REQ-05

##### REQ-07: Zalo Mini App — Tách App.tsx riêng với demo init
- **Mục tiêu**: `apps/zalo-miniapp/src/App.tsx` hiện re-export `frontend/src/App` kéo theo `RequireAuth`. Cần tạo file riêng với router Zalo-specific và auto-demo-token init
- **Đầu vào**: `apps/zalo-miniapp/src/App.tsx`
- **Đầu ra mong đợi**: Zalo mini app khởi động không yêu cầu đăng nhập; demo token tự động được set; router Zalo dẫn tới VocabularyPage, LoginPage, v.v.
- **Tiêu chí hoàn thành**: Mở Zalo mini app → thấy VocabularyPage ngay (không bị redirect về login)
- **Phụ thuộc**: REQ-02

---

### 3. Ngữ cảnh nghiệp vụ

**Luồng hiện tại (broken):**
```
Mở app → RequireAuth kiểm tra accessToken → null → Navigate /login → [blocked]
```

**Luồng mong muốn (Demo Token):**
```
Mở app → accessToken null → auto POST /auth/demo → nhận demo JWT
        → RequireAuth pass-through (token có) → Vào app đầy đủ tính năng
        → Tạo path/note → backend check DEMO limits → 403 khi hết → Upgrade CTA
        → Đăng ký/đăng nhập → real JWT thay thế demo token → giới hạn bỏ
```

**Quy tắc nghiệp vụ áp dụng:**
- DEMO user được truy cập **tất cả** tính năng (vocabulary, roadmap, review, quick notes) nhưng giới hạn tạo mới
- Giới hạn creation cho DEMO: **1 learning path**, **3 quick notes** (tổng cộng, không reset theo ngày)
- Khi DEMO token hết hạn (7 ngày), app tự gọi lại `POST /auth/demo` → phiên mới với giới hạn mới
- Người dùng đăng nhập thật → demo session bị thay thế hoàn toàn, không merge dữ liệu demo

**Hành vi cần bảo toàn:**
- Người dùng đã đăng nhập không bị ảnh hưởng — token refresh flow không đổi
- Backend guards (`JwtAuthGuard`) giữ nguyên — không cần thay đổi
- DEMO role không có quyền admin, org management, hay xem analytics

---

### 4. Ngữ cảnh kỹ thuật

**Triển khai hiện tại:**

| Vị trí | Hiện tại | Vấn đề |
|--------|----------|--------|
| `apps/frontend/src/App.tsx` L19-21 | `RequireAuth` bao toàn bộ protected routes, redirect `/login` nếu `!accessToken` | Không có demo token → luôn redirect |
| `apps/zalo-miniapp/src/App.tsx` | `export { default } from '../../frontend/src/App'` | Kế thừa `RequireAuth`, không thể tự init demo token |
| `apps/backend/prisma/schema.prisma` L52 | `enum UserRole { LEARNER, ADMIN }` | Thiếu `DEMO` role |
| `apps/backend/src/modules/auth/auth.controller.ts` | 6 endpoints, không có `POST /auth/demo` | Không có cách auto-issue demo token |
| `apps/backend/src/modules/paths/paths.service.ts` | Rate limit 3 paths/day per user — chung cho mọi role | DEMO user không bị giới hạn riêng |
| `apps/backend/src/modules/quick-note/quick-note.service.ts` | Không có rate limit | DEMO user không bị giới hạn |

**Files bị ảnh hưởng:**
- `apps/backend/prisma/schema.prisma` — thêm `DEMO` vào `UserRole` enum
- `apps/backend/src/modules/auth/auth.service.ts` — thêm `issueGuestSession()` method
- `apps/backend/src/modules/auth/auth.controller.ts` — thêm `POST /auth/demo` handler
- `apps/backend/src/modules/paths/paths.service.ts` — thêm DEMO check trong `createFromAI()`
- `apps/backend/src/modules/quick-note/quick-note.service.ts` — thêm DEMO check trong `create()`
- `apps/frontend/src/App.tsx` — thêm demo token init trước router
- `apps/zalo-miniapp/src/App.tsx` — thay re-export bằng router riêng với demo init
- `packages/shared-types/src/api-endpoints.ts` — thêm `issueGuestSession()` vào `AuthApi`

**Điểm tích hợp:**
- `generateTokenPair(userId, email, role, orgId)` — private method trong `AuthService`, trả `{ accessToken, refreshToken }`. Demo endpoint sẽ dùng `jwt.signAsync` trực tiếp với expiry dài hơn (hoặc gọi `generateTokenPair` với custom expiry override)
- JWT payload: `{ sub: userId, email, role, orgId }` — `role` sẽ là `DEMO`, `orgId` null
- `createApiClientWithAuth` interceptor: khi demo access token hết hạn, refresh call sẽ fail (no refreshToken) → `onAuthFailed` → `clearSession()` → accessToken null → app tự gọi lại `POST /auth/demo`

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `RequireAuth` redirect về `/login` khi `!accessToken` | App tự phát hành demo token → `accessToken` luôn có giá trị | Thêm startup auto-init trong App.tsx |
| Không có `DEMO` trong UserRole | `UserRole.DEMO` tồn tại trong Prisma schema | Thêm vào enum + migration |
| Không có `POST /auth/demo` | Endpoint tạo DEMO user và trả access token | Thêm vào AuthController + AuthService |
| DEMO user có thể tạo unlimited paths và notes | Giới hạn 1 path + 3 notes cho DEMO | Thêm check trong PathsService và QuickNoteService |
| Không có upgrade CTA | Modal/banner khi chạm giới hạn DEMO | Thêm error handling trong path/note create flow |
| Zalo App.tsx = frontend App.tsx (có RequireAuth) | Zalo có router riêng, auto-init demo token | Tạo Zalo App.tsx riêng biệt |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Demo user DB rows tích lũy vô hạn**: Mỗi session tạo một User row với email `demo-xxx@polylex.guest` — cần định kỳ dọn dẹp — *Biện pháp*: Thêm scheduled cleanup job xóa DEMO users > 30 ngày (`createdAt < now - 30d`), hoặc hard delete khi demo token expire
- [ ] **DEMO email space có thể bị exploit**: `demo-{uuid}@polylex.guest` không bao giờ xác thực email — *Biện pháp*: rate-limit IP cho `POST /auth/demo`, validate rằng role DEMO không thể gọi được invite/org endpoints
- [ ] **Người dùng quay lại sau 7 ngày mất data demo**: Demo data (1 path, 3 notes) không chuyển sang tài khoản thật — *Biện pháp*: Đây là behaviour có chủ đích; CTA đăng ký rõ ràng trong toàn app

#### 6.2 Rủi ro kỹ thuật
- [ ] **`POST /auth/demo` bị DDoS tạo vô số User rows**: Mỗi call tạo 1 row — *Biện pháp*: `@Throttle({ default: { limit: 10, ttl: 60000 } })` per IP; hoặc kiểm tra IP-based rate limit ở NGINX/proxy trước
- [ ] **Khi demo token hết hạn (7 ngày), interceptor refresh fail → clearSession() → auto re-init loop**: App gọi `POST /auth/demo` lại, nhưng nếu network lỗi, có thể gọi lần nữa — *Biện pháp*: Guard bằng in-flight flag (`isInitializingDemo`) trong auth store để tránh gọi đồng thời
- [ ] **DEMO role bypass check nếu `UserRole.DEMO` === `undefined`**: Sau khi migration, cần đảm bảo Prisma client đã regenerate trước khi deploy — *Biện pháp*: `npx prisma generate` là bước bắt buộc trong Dockerfile/CI pipeline
- [ ] **Luồng đăng nhập sau demo không merge data**: User tạo 1 path với demo token, sau đó đăng nhập → path demo vẫn thuộc demo user (orphaned) — *Biện pháp*: Là behaviour có chủ đích; document rõ trong on-boarding UX rằng demo data không được giữ lại

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **ForbiddenException message phải nhất quán với FE error handler**: Backend ném `ForbiddenException('DEMO_PATH_LIMIT_REACHED')` nhưng NestJS wrap trong `{ statusCode, message, error }` — FE cần check `error.response.data.message === 'DEMO_PATH_LIMIT_REACHED'` — *Cách phòng tránh*: Thống nhất error code pattern trong response DTO hoặc dùng custom exception class
- [ ] **`RequireAuth` vẫn cần một loading state khi đang gọi `POST /auth/demo`**: Nếu render router trước khi demo token được set, `RequireAuth` nhìn thấy `null` → redirect — *Cách phòng tránh*: Thêm `isBootstrapping` state, render spinner/splash screen cho đến khi demo init xong
- [ ] **Zalo VocabularyPage có `if (!accessToken) { return; }` guard (L26-31)**: Với demo token, `accessToken` sẽ có giá trị → guard pass tự nhiên — không cần thay đổi; nhưng cần kiểm tra Zalo client dùng đúng store có token — *Cách phòng tránh*: Xác nhận `useAuthStore` được dùng nhất quán trong Zalo client.ts

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Backend guards **không thay đổi** — auth boundary sạch sẽ | Tạo DB rows rỗng cho DEMO users — cần cleanup job |
| Không cần `OptionalJwtAuthGuard` hay public endpoints | Demo data (path, notes) bị mất khi đăng ký tài khoản thật |
| DEMO user có trải nghiệm y hệt real user — không cần dual-mode pages | `POST /auth/demo` cần rate-limit kỹ để tránh abuse |
| Giải quyết Apple App Review, Google Play, và Zalo cùng một lượt | Cần migration Prisma (`DEMO` enum) — deploy coordinated |
| Loading state (`isBootstrapping`) dễ UX hơn "guest mode" split routing | DEMO user không thể dùng social login (tài khoản ảo) — nhưng đây là đúng behaviour |

---

### 8. Khuyến nghị

**Cách tiếp cận khuyến nghị: Demo Token với real DB row**

**Phase 1 — Backend (0.5 ngày):**
1. `schema.prisma`: thêm `DEMO` vào `UserRole` enum
2. Chạy `npx prisma migrate dev --name add-demo-role`
3. `AuthService.issueGuestSession()`: tạo DEMO user, sign access token 7 ngày (JWT_DEMO_EXPIRES_IN), không lưu refresh token
4. `AuthController`: thêm `@Post('demo') @Throttle({ default: { limit: 5, ttl: 60000 } })`
5. `PathsService.createFromAI()`: thêm DEMO check trước existing daily rate limit
6. `QuickNoteService.create()`: thêm DEMO check

**Phase 2 — Frontend (0.5 ngày):**
7. `App.tsx` (frontend): thêm `useEffect` bootstrap — gọi `POST /auth/demo` nếu không có token, set `isBootstrapping` state
8. Error handling trong PathGenerator và QuickNote create: catch 403 với DEMO codes → hiện upgrade modal
9. Shared-types: thêm `issueGuestSession(): Promise<{ accessToken: string }>` vào `AuthApi`

**Phase 3 — Zalo Mini App (0.5 ngày):**
10. Tạo `apps/zalo-miniapp/src/App.tsx` riêng với router + demo init
11. Kiểm tra `useAuthStore` inject đúng demo token vào Zalo api client

**Phụ thuộc:**
- Xác nhận `JWT_DEMO_EXPIRES_IN` env var được thêm vào `.env.example` và deployment config

**Ước tính công sức:** ~1.5 ngày kỹ thuật (0.5 BE + 0.5 FE + 0.5 Zalo + test)

---

### 9. Câu hỏi mở

- [ ] Khi DEMO token hết hạn và app tạo phiên demo mới — giới hạn reset về 0. Có muốn tracking theo device ID (fingerprint) để persistent limits không?
- [ ] Demo user tạo 1 path — khi đăng ký tài khoản thật, path đó có được migrate sang tài khoản mới không?
- [ ] `JWT_DEMO_EXPIRES_IN`: 7 ngày có phù hợp không, hay cần ngắn hơn (1 ngày)?
- [ ] Cleanup job cho DEMO user rows: cron hàng ngày xóa user `role = DEMO` và `createdAt < 30 ngày`?
- [ ] Upgrade modal UX: bottom sheet hay full-screen modal? Cần designer sign-off?

---

### 10. Danh sách re-check hồi quy

| Mã | Flow cũ cần re-check | Liên quan REQ | Mức ưu tiên | Cách re-check | Tiêu chí pass |
|----|----------------------|---------------|-------------|---------------|---------------|
| RC-01 | Auth user login thường vẫn hoạt động bình thường | REQ-02 | Cao | Đăng nhập email/password → nhận access + refresh token, `role: LEARNER` | Token pair đầy đủ; không bị lấy demo token |
| RC-02 | Social login (Google/Zalo/Apple) không bị ảnh hưởng | REQ-02 | Cao | Đăng nhập với Google → token có `role: LEARNER`, bukan DEMO | Social login flow không đụng vào `POST /auth/demo` |
| RC-03 | Token refresh flow không bị break | REQ-05 | Cao | Auth user gọi API với expired access token → interceptor refresh → 200 | Không thấy 401 giả, token mới được set |
| RC-04 | LEARNER user tạo nhiều paths vẫn theo giới hạn cũ (3/ngày) | REQ-03 | Cao | LEARNER user tạo path thứ 4 trong ngày → 403 "daily limit reached" (không phải DEMO message) | Error message đúng với LEARNER limit |
| RC-05 | LEARNER user tạo quick notes không giới hạn | REQ-04 | Cao | LEARNER user tạo >3 notes → thành công, không bị DEMO_NOTE_LIMIT | Không thấy 403 cho LEARNER |
| RC-06 | Demo token auto-init không loop vô hạn khi network lỗi | REQ-05 | Cao | Tắt network, mở app → spinner/error state, không crash loop | `isBootstrapping` flag prevent re-entrancy |
| RC-07 | Zalo login flow (đăng nhập Zalo SDK) vẫn hoạt động sau khi tách App.tsx | REQ-07 | Cao | Mở Zalo mini app → bấm "Đăng nhập với Zalo" → Zalo SDK authorize → navigate authenticated | User displayName hiển thị, my-list loaded |
| RC-08 | `/profile` và `/analytics` vẫn yêu cầu real auth (không accessible với DEMO) | REQ-05 | Trung bình | DEMO user navigate `/profile` → không crash, có thể hiển thị upgrade CTA | Không thấy lỗi 401 hay crash |
| RC-09 | `onAuthFailed` clear session khi DEMO refresh fails | REQ-05 | Trung bình | DEMO token expire → interceptor refresh fail (no refreshToken) → `clearSession()` → app re-init demo | `accessToken` = null sau fail, sau đó tự set lại demo token |


---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Backend: Optional JWT cho vocabulary search | Endpoint `GET /vocabulary` phải trả dữ liệu công khai khi không có token (không 401) | API | Nhỏ |
| REQ-02 | Frontend: Soft Auth routing | Thay `RequireAuth` hard-redirect bằng cơ chế guest path — một số route công khai, protected routes hiện inline CTA khi guest | UI/State | Trung bình |
| REQ-03 | Frontend: Guest mode cho VocabularyPage | VocabularyPage dùng `GET /vocabulary` (search công khai) khi guest thay vì `GET /vocabulary/my-list` (yêu cầu auth) | UI/State | Nhỏ |
| REQ-04 | Frontend: Guest mode cho RoadmapPage | RoadmapPage hiển thị danh sách path templates công khai khi guest, thay vì gọi `GET /paths/my` trả 401 | UI/State/API | Trung bình |
| REQ-05 | Frontend: Inline login CTA | Khi guest thao tác tính năng cần auth (thêm từ, save, review), hiển thị modal/banner gợi ý đăng nhập thay vì redirect | UI/State | Nhỏ |
| REQ-06 | Zalo Mini App: Tách routing riêng | Tách `src/App.tsx` khỏi re-export `frontend/src/App` — tạo router riêng không có `RequireAuth` bao ngoài toàn bộ | UI/State | Nhỏ |
| REQ-07 | Backend: Public roadmap endpoint | Thêm endpoint `GET /paths/templates` công khai trả danh sách path templates mẫu cho guest | API | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──────────────────────> REQ-03 (tuần tự — cần backend public trước)
                                REQ-04 ──> REQ-07 (tuần tự — FE cần BE public endpoint)

REQ-02 ──┬──> REQ-03 (liên quan — routing cần xong trước page logic)
         └──> REQ-05 (liên quan — CTA cần routing guest được xác định)

REQ-06 ──> (độc lập, song song với REQ-01..REQ-05)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Backend — Optional JWT cho vocabulary search
- **Mục tiêu**: `GET /api/v1/vocabulary` trả danh sách từ vựng công khai mà không yêu cầu Authorization header
- **Đầu vào**: Request không có hoặc có Bearer token
- **Đầu ra mong đợi**: `200 OK` với danh sách vocabulary trong cả hai trường hợp; nếu có token thì lọc theo `organizationId`, nếu guest thì trả kết quả global (không organization)
- **Tiêu chí hoàn thành**: `curl GET /api/v1/vocabulary?languageCode=en` không có header Auth trả 200
- **Phụ thuộc**: Không

##### REQ-02: Frontend — Soft Auth routing
- **Mục tiêu**: Thay thế component `RequireAuth` (hard redirect to `/login`) bằng cơ chế phân loại route: `public` (accessible mọi lúc) vs `auth-only` (`/profile`, `/analytics`)
- **Đầu vào**: Zustand auth store — `accessToken` null hoặc có giá trị
- **Đầu ra mong đợi**: Guest user vào `/vocabulary`, `/roadmap`, `/dashboard` thấy nội dung (dù giới hạn), không bị đẩy về `/login`
- **Tiêu chí hoàn thành**: Xóa token khỏi store, navigate đến `/vocabulary` → không redirect, thấy được danh sách từ vựng
- **Phụ thuộc**: REQ-01

##### REQ-03: Frontend — VocabularyPage guest mode
- **Mục tiêu**: Khi `accessToken === null`, VocabularyPage gọi `vocabularyApi.search({ languageCode: ... })` (public) thay vì `vocabularyApi.getMyList()` (cần auth)
- **Đầu vào**: Auth state từ Zustand store
- **Đầu ra mong đợi**: Guest thấy browse/search toàn bộ vocabulary catalog; nút "Add to My List" ẩn hoặc trigger login CTA
- **Tiêu chí hoàn thành**: Guest user thấy ≥10 từ vựng (global), không thấy lỗi 401
- **Phụ thuộc**: REQ-01, REQ-02

##### REQ-04: Frontend — RoadmapPage guest mode
- **Mục tiêu**: RoadmapPage hiển thị các path templates công khai (không phải `my paths`) khi guest, kèm CTA đăng nhập để bắt đầu học
- **Đầu vào**: `accessToken` null
- **Đầu ra mong đợi**: Hiển thị danh sách path templates có `isPublished: true`; nút "Bắt đầu" → trigger login CTA
- **Tiêu chí hoàn thành**: Guest vào `/roadmap`, thấy ít nhất 1 path template mẫu, không thấy lỗi
- **Phụ thuộc**: REQ-07, REQ-02

##### REQ-05: Frontend — Inline Login CTA
- **Mục tiêu**: Thay vì redirect `/login`, hiển thị bottom sheet hoặc modal nhỏ "Đăng nhập để lưu tiến độ" khi guest thực hiện thao tác cần auth
- **Đầu vào**: Guest user bấm "Add word", "Start review", "Save"
- **Đầu ra mong đợi**: Modal/banner xuất hiện với link đến `/login`, không mất context trang hiện tại
- **Tiêu chí hoàn thành**: Guest bấm "Add word" → modal hiện ra, bấm "Đăng nhập" → navigate `/login`
- **Phụ thuộc**: REQ-02

##### REQ-06: Zalo Mini App — Tách routing riêng
- **Mục tiêu**: File `apps/zalo-miniapp/src/App.tsx` hiện là `export { default } from '../../frontend/src/App'`, kéo theo `RequireAuth` của frontend. Cần tạo App riêng cho Zalo với routing không có auth guard toàn cục.
- **Đầu vào**: `apps/zalo-miniapp/src/App.tsx`
- **Đầu ra mong đợi**: Zalo Mini App có router riêng; nút "Bỏ qua đăng nhập" trong LoginPage dẫn thành công đến `/vocabulary`
- **Tiêu chí hoàn thành**: Mở Zalo mini app → bấm "Bỏ qua đăng nhập Zalo" → thấy VocabularyPage (không redirect về login)
- **Phụ thuộc**: Không (độc lập)

##### REQ-07: Backend — Public path templates endpoint
- **Mục tiêu**: Thêm endpoint `GET /api/v1/paths/templates` trả danh sách `PathTemplate` có `isPublished: true`, không yêu cầu auth
- **Đầu vào**: Query optional `targetLanguageCode`, `cefrLevel`
- **Đầu ra mong đợi**: Array `PathTemplate[]` cơ bản (title, emoji, description, totalWords, targetCefrLevel)
- **Tiêu chí hoàn thành**: `curl GET /api/v1/paths/templates` không có token trả 200 với array
- **Phụ thuộc**: Không

---

### 3. Ngữ cảnh nghiệp vụ

**Luồng hiện tại (broken):**
```
Mở app → RequireAuth kiểm tra accessToken → null → Navigate /login → [blocked]
```

**Luồng mong muốn:**
```
Mở app → Landing/Dashboard (guest) → Browse vocabulary/roadmap (public data)
         → Thao tác cần auth → Inline Login CTA → Login → full access
```

**Quy tắc nghiệp vụ áp dụng:**
- Dữ liệu **cá nhân** (my-list, my-paths, my-review queue, analytics, quick notes): luôn cần auth
- Dữ liệu **catalog** (vocabulary search, path templates public): có thể truy cập guest
- `organizationId` context: khi guest, vocabulary trả global (không filter theo organization)

**Hành vi cần bảo toàn:**
- Người dùng đã đăng nhập không bị ảnh hưởng — tiếp tục thấy `my-list`, `my-paths`, v.v.
- Token refresh flow không thay đổi
- `RequireAuth` vẫn áp dụng cho `/profile`, `/analytics`

---

### 4. Ngữ cảnh kỹ thuật

**Triển khai hiện tại:**

| Vị trí | Hiện tại | Vấn đề |
|--------|----------|--------|
| `apps/frontend/src/App.tsx` L19-21 | `RequireAuth` bao toàn bộ protected routes, redirect `/login` nếu `!accessToken` | Không có guest path nào |
| `apps/zalo-miniapp/src/App.tsx` | `export { default } from '../../frontend/src/App'` | Kế thừa `RequireAuth` của frontend, nút "Bỏ qua" không hoạt động |
| `apps/zalo-miniapp/src/pages/VocabularyPage.tsx` L26-31 | `if (!accessToken) { setItems([]); return; }` | Guest thấy trang trống rỗng |
| `apps/backend/src/modules/vocabulary/vocabulary.controller.ts` L27 | `@UseGuards(JwtAuthGuard)` bao toàn bộ controller | `GET /vocabulary` trả 401 khi không có token |
| `apps/backend/src/modules/auth/guards/jwt-auth.guard.ts` | `extends AuthGuard('jwt')` đơn thuần | Không có cơ chế `@Public()` decorator hoặc Optional JWT |

**Files bị ảnh hưởng:**
- `apps/frontend/src/App.tsx` — thay đổi routing structure
- `apps/frontend/src/pages/VocabularyPage.tsx` — dual mode (guest/auth)
- `apps/frontend/src/pages/RoadmapPage.tsx` — dual mode (guest/auth)
- `apps/frontend/src/pages/DashboardPage.tsx` — graceful fallback khi guest
- `apps/zalo-miniapp/src/App.tsx` — tách routing riêng
- `apps/zalo-miniapp/src/pages/VocabularyPage.tsx` — bỏ early return khi `!accessToken`
- `apps/backend/src/modules/vocabulary/vocabulary.controller.ts` — bỏ guard hoặc dùng optional jwt cho `GET /`
- `apps/backend/src/modules/paths/paths.controller.ts` — thêm public templates endpoint
- `apps/backend/src/modules/auth/guards/jwt-auth.guard.ts` — thêm Optional JWT guard

**Điểm tích hợp:**
- Zustand store `useAuthStore` — nguồn `accessToken` duy nhất cho cả hai app
- `createApiClientWithAuth` interceptor — inject token nếu có, không block nếu null
- Prisma query `findAll` trong `VocabularyService` — cần xử lý `organizationId = undefined` khi guest

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `RequireAuth` redirect toàn bộ protected routes về `/login` | Route public (`/vocabulary`, `/roadmap`) accessible khi guest | Thêm route phân loại, tách public/private |
| `GET /vocabulary` trả 401 khi guest | `GET /vocabulary` trả 200 với public data | Thêm `OptionalJwtAuthGuard` hoặc bỏ guard cho GET search |
| Zalo App.tsx = frontend App.tsx (có RequireAuth) | Zalo có router riêng, không bao RequireAuth toàn cục | Tạo Zalo App.tsx riêng biệt |
| VocabularyPage chỉ gọi `my-list` | VocabularyPage gọi public search khi guest, my-list khi authed | Conditional API call theo auth state |
| RoadmapPage chỉ gọi `my paths` | RoadmapPage gọi public templates khi guest | Cần new backend endpoint + conditional FE |
| Không có inline login CTA | Inline CTA xuất hiện khi guest thao tác cần auth | Thêm component `LoginPromptModal` |
| Dashboard gọi nhiều API auth-required | Dashboard fallback gracefully khi 401 | `Promise.allSettled` + empty state |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Guest xem dữ liệu organization của người khác**: Nếu `GET /vocabulary` không filter `organizationId` khi guest, vocabulary của một org có thể lộ — *Biện pháp*: Guest chỉ thấy vocabulary global (`organizationId = null`), không thấy org-private content
- [ ] **UX split không nhất quán**: Nếu một số feature hiện CTA, một số ẩn hoàn toàn với guest, tạo trải nghiệm khó đoán — *Biện pháp*: Định nghĩa rõ rule: feature cá nhân (`add to my list`, `review`, `quick note`) = hiện CTA; feature catalog (`search`, `browse path templates`) = accessible

#### 6.2 Rủi ro kỹ thuật
- [ ] **`DashboardPage` gọi nhiều API đều 401 khi guest**: `Promise.allSettled` hiện đã được dùng nhưng `navigate('/roadmap')` vẫn chạy — có thể gây loop nếu `/roadmap` cũng redirect — *Biện pháp*: Khi guest, Dashboard hiển thị landing/teaser thay vì gọi API auth
- [ ] **`OptionalJwtAuthGuard` cần passport strategy hỗ trợ**: NestJS `AuthGuard('jwt')` mặc định trả 401 nếu token invalid; cần subclass override `handleRequest` để trả `null` thay vì throw khi thiếu token — *Biện pháp*: Tạo `OptionalJwtAuthGuard extends JwtAuthGuard` với `handleRequest` không throw
- [ ] **Zalo Mini App routing hiện tại thiếu nhiều pages**: Sau khi tách App.tsx, cần đảm bảo Zalo có đủ routes (VocabularyPage, LoginPage), không re-export thiếu component — *Biện pháp*: Liệt kê đầy đủ routes Zalo cần trong router mới
- [ ] **Token presence ≠ valid session**: `accessToken` có thể là expired token; cần phân biệt guest (null) vs. unauthenticated (expired) trong error handling — *Biện pháp*: `onAuthFailed` callback trong api client đã `clearSession()`, đảm bảo expired token = null state sau khi refresh fails

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **VocabularyPage gọi `my-list` (auth) cho user đăng nhập, gọi `search` (public) cho guest**: Phải kiểm tra `accessToken` tại thời điểm render và re-fetch khi auth state thay đổi — *Cách phòng tránh*: Thêm `accessToken` vào dependency array của `useEffect`
- [ ] **Zalo VocabularyPage có `navigate('/login', { replace: true })` trong catch block (L68)**: Sau khi fix guest mode, nếu API error xảy ra với auth user, không được redirect về login trừ khi là 401 — *Cách phòng tránh*: Chỉ redirect khi `error.response.status === 401`, không phải mọi lỗi
- [ ] **Backend `findAll` nhận `user.organizationId` từ `@CurrentUser()`**: Khi dùng Optional JWT, `user` có thể là `null/undefined` — cần guard `user?.organizationId ?? undefined` — *Cách phòng tránh*: Cập nhật signature `findAll` nhận `organizationId?: string`

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Tuân thủ đầy đủ App Store, Google Play, Zalo platform guidelines | Tăng độ phức tạp của component VocabularyPage/RoadmapPage (dual mode) |
| Giảm friction cho người dùng mới — trải nghiệm giá trị trước khi đăng ký | Cần new backend endpoint (`GET /paths/templates`) — thêm surface attack |
| Giải quyết đồng thời vấn đề Zalo Mini App routing (App.tsx re-export) | Login CTA cần thiết kế UX cẩn thận để không gây annoyance |
| Không cần thay đổi Prisma schema — chỉ thay đổi guard và query filter | Guest data (catalog) cần pagination/giới hạn để tránh quá tải |
| Tách Zalo App.tsx giúp dễ maintain, customize riêng Zalo UX | Backend `OptionalJwtAuthGuard` mới cần test kỹ — passport flow phức tạp |

---

### 8. Khuyến nghị

**Cách tiếp cận khuyến nghị:**

**Phase 1 — Quick fix Zalo (1 ngày):**
- Tạo `apps/zalo-miniapp/src/App.tsx` riêng với router không có `RequireAuth`
- Fix `VocabularyPage` Zalo: bỏ early return khi `!accessToken`, gọi API public khi guest
- Fix `navigate('/login')` trong catch block — chỉ redirect khi 401

**Phase 2 — Backend guest support (1 ngày):**
- Tạo `OptionalJwtAuthGuard` trong NestJS override `handleRequest` trả `null` thay vì throw
- Áp dụng cho `GET /vocabulary` — truyền `organizationId?: string`
- Thêm `GET /paths/templates` public endpoint

**Phase 3 — Frontend guest UX (2 ngày):**
- Tách route thành public/auth-only trong `App.tsx`
- `VocabularyPage`: dual mode — guest gọi public search, auth user gọi my-list
- `RoadmapPage`: guest gọi public templates, auth user gọi my-paths
- `DashboardPage`: guest landing với teaser, không gọi API auth
- `LoginPromptModal` tái dụng ở mọi nơi cần inline CTA

**Các cách tiếp cận thay thế:**
- *Chỉ cung cấp demo account trong App Review notes*: Giải quyết App Store nhưng không cải thiện UX thật và không fix Zalo
- *Làm toàn bộ app public, gating bằng feature flags*: Quá phức tạp, overengineering cho scale hiện tại

**Phụ thuộc:**
- Review `@nestjs/passport` version để xác nhận `handleRequest` override pattern
- Quyết định UX cho `LoginPromptModal` (bottom sheet, toast, modal) — cần designer sign-off

**Ước tính công sức:** ~4 ngày kỹ thuật (1 BE + 2 FE + 1 test/integration)

---

### 9. Câu hỏi mở

- [ ] Khi guest dùng `/vocabulary` (public search) thấy từ vựng global — có giới hạn bao nhiêu từ không? Cần pagination/limit để tránh abuse?
- [ ] DashboardPage cho guest hiện gì? Chỉ landing/teaser? Hay một số widget public (streak, leaderboard)?
- [ ] Zalo Mini App: có cần hỗ trợ `ReviewPage` cho guest với bộ từ vựng demo không, hay scope Phase 1 chỉ là vocabulary browse?
- [ ] Backend `GET /paths/templates` — có cần filter theo `targetLanguageCode` không, hay trả tất cả?
- [ ] OAuth token trong Zalo (Zalo Access Token) — guest mode có hoàn toàn bỏ qua Zalo SDK init không?

---

### 10. Danh sách re-check hồi quy

| Mã | Flow cũ cần re-check | Liên quan REQ | Mức ưu tiên | Cách re-check | Tiêu chí pass |
|----|----------------------|---------------|-------------|---------------|---------------|
| RC-01 | Auth user vào `/vocabulary` vẫn thấy `my-list` (không mất dữ liệu cá nhân) | REQ-03 | Cao | Đăng nhập → navigate `/vocabulary` → kiểm tra items là my-list | Items có `isLearned`, `memoryStrength` field — xác nhận là my-list data |
| RC-02 | Token refresh flow không bị break bởi OptionalJwtAuthGuard | REQ-01 | Cao | Auth user gọi `GET /vocabulary` với expired access token → interceptor refresh → trả 200 | Không thấy 401, token mới được set |
| RC-03 | Zalo login flow (bấm "Đăng nhập với Zalo") vẫn hoạt động sau khi tách App.tsx | REQ-06 | Cao | Mở Zalo mini app → bấm "Đăng nhập với Zalo" → Zalo SDK authorize → navigate `/vocabulary` authed | User `displayName` hiển thị, my-list loaded |
| RC-04 | Auth user vào `/roadmap` vẫn thấy `my-paths` (không bị chuyển sang public templates) | REQ-04, REQ-07 | Cao | Đăng nhập → navigate `/roadmap` → kiểm tra paths có `currentStageOrder`, `userStages` | Paths có `completedAt` nếu đã hoàn thành — xác nhận là user paths |
| RC-05 | `/profile` và `/analytics` vẫn yêu cầu auth (không thành public route) | REQ-02 | Cao | Xóa token → navigate `/profile` → phải redirect về `/login` | Redirect xảy ra, không thấy được profile data |
| RC-06 | Add word modal vẫn hoạt động cho auth user sau khi thêm inline CTA | REQ-05 | Trung bình | Đăng nhập → vào `/vocabulary` → bấm `+` → Add Word Modal hiện đúng | Modal mở, submit tạo từ mới thành công |
| RC-07 | Backend `GET /vocabulary` với `organizationId` của auth user vẫn filter đúng | REQ-01 | Trung bình | Auth user thuộc org → gọi `GET /vocabulary` → chỉ thấy vocab của org hoặc global | Không thấy vocab của org khác |
| RC-08 | Dashboard redirect `/roadmap` khi auth user và no paths vẫn hoạt động | REQ-02 | Thấp | Auth user mới (no paths) → vào `/dashboard` → bị redirect tới `/roadmap` | Redirect tới `/roadmap` xảy ra, thấy path generator |
| RC-09 | `onAuthFailed` clear session khi token hết hạn | REQ-02 | Trung bình | Xóa refresh token ở BE → gọi API → interceptor refresh fail → `clearSession()` | `accessToken` = null, user thấy guest mode (không crash) |

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Triển khai Demo Token end-to-end để người dùng mới vào app mà không cần login ngay, nhưng vẫn giữ nguyên backend auth guard. Demo session bị giới hạn 1 learning path và 3 quick notes, khi chạm giới hạn sẽ hiện CTA đăng nhập/đăng ký.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: Backend hỗ trợ `UserRole.DEMO` và endpoint `POST /auth/demo` để cấp access token demo.
2. FR-02: Backend chặn DEMO user vượt limit tạo path (1) và quick note (3).
3. FR-03: Frontend app chính tự bootstrap demo token khi chưa có session.
4. FR-04: Zalo mini app có `App.tsx` riêng và bootstrap demo token độc lập.
5. FR-05: UI hiển thị upgrade CTA khi backend trả lỗi limit demo.

#### Ràng buộc phi chức năng
1. NFR-01: Không thay đổi cơ chế `JwtAuthGuard` hiện tại.
2. NFR-02: Giữ tương thích flow login/register/social/refresh hiện có.
3. NFR-03: Tuân thủ conventions monorepo npm workspaces (NestJS + React + shared-types).
4. NFR-04: Mỗi thay đổi verify được bằng build/type-check/test command theo repo.

#### Phụ thuộc
- DEP-01: Prisma migration `UserRole.DEMO` phải hoàn tất trước khi compile backend logic role-check.
- DEP-02: Shared types `AuthApi` cần cập nhật trước khi FE/Zalo gọi `POST /auth/demo` typed-safe.
- DEP-03: FE/Zalo bootstrap phụ thuộc backend endpoint `POST /auth/demo` đã sẵn sàng.

### Cách tiếp cận
> Đi theo thứ tự Data → Core Logic → Interface → Integration. Hoàn thành backend schema và API trước, sau đó wiring sang shared-types, frontend và zalo-miniapp. Mỗi TODO chỉ động vào 1 file để downstream agent thực thi/rollback nhanh.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `polylex-global/apps/backend/prisma/schema.prisma` | Thêm `DEMO` vào `enum UserRole` |
| Tạo mới | `polylex-global/apps/backend/prisma/migrations/<timestamp>_add_demo_role/migration.sql` | Migration thêm enum value `DEMO` |
| Sửa đổi | `polylex-global/apps/backend/src/modules/auth/auth.service.ts` | Thêm `issueDemoSession()` và logic sign demo access token |
| Sửa đổi | `polylex-global/apps/backend/src/modules/auth/auth.controller.ts` | Thêm endpoint `POST /auth/demo` |
| Sửa đổi | `polylex-global/apps/backend/src/modules/paths/paths.controller.ts` | Truyền role vào service để check limit DEMO |
| Sửa đổi | `polylex-global/apps/backend/src/modules/paths/paths.service.ts` | Chặn DEMO user tạo quá 1 path |
| Sửa đổi | `polylex-global/apps/backend/src/modules/quick-note/quick-note.controller.ts` | Truyền role vào service để check limit DEMO |
| Sửa đổi | `polylex-global/apps/backend/src/modules/quick-note/quick-note.service.ts` | Chặn DEMO user tạo quá 3 quick notes |
| Sửa đổi | `polylex-global/apps/backend/src/config/config.module.ts` | Thêm env validation cho `JWT_DEMO_EXPIRES_IN` |
| Sửa đổi | `polylex-global/apps/backend/.env.example` | Bổ sung `JWT_DEMO_EXPIRES_IN` |
| Sửa đổi | `polylex-global/packages/shared-types/src/auth-api.ts` | Mở rộng `AuthApi` với `issueDemoSession()` |
| Sửa đổi | `polylex-global/apps/frontend/src/App.tsx` | Bootstrap demo token + bootstrapping state |
| Sửa đổi | `polylex-global/apps/frontend/src/components/roadmap/PathGeneratorSheet.tsx` | Handle 403 demo-limit và trigger CTA |
| Sửa đổi | `polylex-global/apps/frontend/src/components/quick-note/AddQuickNoteSheet.tsx` | Handle 403 demo-limit và trigger CTA |
| Sửa đổi | `polylex-global/apps/frontend/src/i18n/locales/vi.json` | Thêm copy text cho demo-limit CTA |
| Sửa đổi | `polylex-global/apps/frontend/src/i18n/locales/en.json` | Thêm copy text cho demo-limit CTA |
| Sửa đổi | `polylex-global/apps/zalo-miniapp/src/App.tsx` | Thay re-export bằng router + demo bootstrap riêng |
| Sửa đổi | `polylex-global/apps/zalo-miniapp/src/api/client.ts` | Expose helper gọi `authApi.issueDemoSession()` |

---

## PLAN TODO

### Phase 1: Data Layer

#### REQ-01: Backend thêm DEMO role vào schema

- [x] **TODO-1.1.1**: Thêm enum value `DEMO` vào Prisma UserRole
  - **File**: `polylex-global/apps/backend/prisma/schema.prisma`
  - **Context**: Đọc `apps/backend/prisma/schema.prisma`, `apps/backend/src/modules/auth/auth.service.ts`
  - **Thay đổi**:
    - Thêm `DEMO` trong `enum UserRole`.
    - Không đổi default `role @default(LEARNER)`.
  - **Verify**: `cd polylex-global/apps/backend && npx prisma validate`
  - **Re-check**: Confirm `LEARNER/ADMIN` enum hiện tại vẫn giữ nguyên thứ tự/giá trị.
  - **Real-test hint**: Chạy prompt `4_real_test_completed_task.prompt.md` với kịch bản migrate schema local.
  - **Kết quả**: Prisma schema hợp lệ và compile được `UserRole.DEMO`.

- [x] **TODO-1.1.2**: Tạo migration SQL cho enum `DEMO`
  - **File**: `polylex-global/apps/backend/prisma/migrations/<timestamp>_add_demo_role/migration.sql`
  - **Context**: Đọc migration gần nhất trong `apps/backend/prisma/migrations/**`, `apps/backend/prisma/schema.prisma`
  - **Thay đổi**:
    - Thêm câu lệnh SQL thêm value `DEMO` vào enum user role.
  - **Verify**: `cd polylex-global/apps/backend && npx prisma migrate dev --name add_demo_role`
  - **Re-check**: Chạy `npx prisma migrate status` đảm bảo không drift migration cũ.
  - **Real-test hint**: Thử reset DB local rồi migrate lại full stack.
  - **Kết quả**: DB local có enum `DEMO`, migration được track trong repo.

### Phase 2: Core Logic Layer

#### REQ-02: Backend cấp demo token

- [x] **TODO-2.2.1**: Bổ sung env validation cho thời hạn demo token
  - **File**: `polylex-global/apps/backend/src/config/config.module.ts`
  - **Context**: Đọc `apps/backend/src/config/config.module.ts`, `apps/backend/.env.example`
  - **Thay đổi**:
    - Thêm `JWT_DEMO_EXPIRES_IN` vào Joi schema (default `7d`).
  - **Verify**: `cd polylex-global && npm run build --workspace=apps/backend`
  - **Re-check**: Ensure `JWT_ACCESS_EXPIRES_IN` và `JWT_REFRESH_EXPIRES_IN` vẫn hoạt động.
  - **Real-test hint**: Khởi động backend với/không khai báo `JWT_DEMO_EXPIRES_IN`.
  - **Kết quả**: Backend nhận biến env demo expiry an toàn.

- [x] **TODO-2.2.2**: Cập nhật `.env.example` cho demo token expiry
  - **File**: `polylex-global/apps/backend/.env.example`
  - **Context**: Đọc `apps/backend/.env.example`, `apps/backend/src/config/config.module.ts`
  - **Thay đổi**:
    - Thêm dòng `JWT_DEMO_EXPIRES_IN="7d"` trong block JWT.
  - **Verify**: So khớp key với config validation.
  - **Re-check**: Không thay đổi các giá trị env production hiện có.
  - **Real-test hint**: Copy `.env.example` sang `.env` và chạy backend local.
  - **Kết quả**: Tài liệu env đầy đủ cho downstream deploy.

- [x] **TODO-2.2.3**: Thêm business logic cấp demo session
  - **File**: `polylex-global/apps/backend/src/modules/auth/auth.service.ts`
  - **Context**: Đọc `apps/backend/src/modules/auth/auth.service.ts`, `apps/backend/src/modules/auth/strategies/jwt.strategy.ts`, `apps/backend/prisma/schema.prisma`
  - **Thay đổi**:
    - Tạo method `issueDemoSession()`:
      - tạo user role DEMO (email unique dạng `demo-<uuid>@polylex.guest`),
      - sign access token với payload chuẩn (`sub/email/role/orgId`),
      - dùng expiry từ `JWT_DEMO_EXPIRES_IN`,
      - không tạo refresh token.
  - **Verify**: `cd polylex-global && npm run build --workspace=apps/backend`
  - **Re-check**: `register/login/socialLogin/refresh` không thay đổi output contract.
  - **Real-test hint**: Gọi endpoint demo nhiều lần, xác nhận user DEMO mới được tạo mỗi phiên.
  - **Kết quả**: Có service-level API để controller cấp demo token.

- [x] **TODO-2.2.4**: Expose endpoint `POST /auth/demo`
  - **File**: `polylex-global/apps/backend/src/modules/auth/auth.controller.ts`
  - **Context**: Đọc `apps/backend/src/modules/auth/auth.controller.ts`, `apps/backend/src/modules/auth/auth.service.ts`
  - **Thay đổi**:
    - Thêm handler `@Post('demo')` trả `{ accessToken }` từ `issueDemoSession()`.
    - Bổ sung Swagger summary rõ scope demo session.
  - **Verify**: `cd polylex-global && npm run build --workspace=apps/backend`
  - **Re-check**: Các endpoint `/auth/register|login|refresh|logout|social` giữ nguyên status code.
  - **Real-test hint**: Dùng `curl -X POST /api/v1/auth/demo` kiểm tra 200 + JWT role DEMO.
  - **Kết quả**: API demo token sẵn sàng cho FE/Zalo gọi.

#### REQ-03: Giới hạn tạo path cho DEMO

- [x] **TODO-2.3.1**: Truyền role từ controller vào path service
  - **File**: `polylex-global/apps/backend/src/modules/paths/paths.controller.ts`
  - **Context**: Đọc `apps/backend/src/modules/paths/paths.controller.ts`, `apps/backend/src/modules/auth/decorators/current-user.decorator.ts`
  - **Thay đổi**:
    - Cập nhật call `createFromAI` để truyền thêm `user.role`.
  - **Verify**: `cd polylex-global && npm run build --workspace=apps/backend`
  - **Re-check**: Endpoint `POST /paths/generate` của user thường vẫn compile/run bình thường.
  - **Real-test hint**: Kiểm tra payload `CurrentUser` từ JWT strategy vẫn chứa role.
  - **Kết quả**: Service có đủ context role để enforce limit theo DEMO.

- [x] **TODO-2.3.2**: Enforce DEMO path limit ở service
  - **File**: `polylex-global/apps/backend/src/modules/paths/paths.service.ts`
  - **Context**: Đọc `apps/backend/src/modules/paths/paths.service.ts`, `apps/backend/prisma/schema.prisma`
  - **Thay đổi**:
    - Update signature `createFromAI(userId, dto, role)`.
    - Nếu `role === 'DEMO'` và `count(pathTemplate where createdByUserId=userId) >= 1` thì throw `ForbiddenException('DEMO_PATH_LIMIT_REACHED')`.
    - Giữ nguyên daily limit 3 path/day cho role non-DEMO.
  - **Verify**: `cd polylex-global && npm run build --workspace=apps/backend`
  - **Re-check**: Rule cũ “3 path/day” cho LEARNER vẫn hoạt động.
  - **Real-test hint**: DEMO tạo path lần 2 phải nhận 403 code demo; LEARNER tạo path lần 2 vẫn pass.
  - **Kết quả**: Backend chặn đúng quota path cho demo session.

#### REQ-04: Giới hạn quick note cho DEMO

- [x] **TODO-2.4.1**: Truyền role từ quick-note controller vào service
  - **File**: `polylex-global/apps/backend/src/modules/quick-note/quick-note.controller.ts`
  - **Context**: Đọc `apps/backend/src/modules/quick-note/quick-note.controller.ts`, `apps/backend/src/modules/auth/decorators/current-user.decorator.ts`
  - **Thay đổi**:
    - Cập nhật `create()` truyền thêm `user.role`.
  - **Verify**: `cd polylex-global && npm run build --workspace=apps/backend`
  - **Re-check**: Endpoint list/delete quick note không thay đổi behavior.
  - **Real-test hint**: Tạo quick note với token hợp lệ role LEARNER vẫn thành công.
  - **Kết quả**: Service có role context để giới hạn demo.

- [x] **TODO-2.4.2**: Enforce DEMO quick-note limit ở service
  - **File**: `polylex-global/apps/backend/src/modules/quick-note/quick-note.service.ts`
  - **Context**: Đọc `apps/backend/src/modules/quick-note/quick-note.service.ts`, `apps/backend/prisma/schema.prisma`
  - **Thay đổi**:
    - Update signature `create(userId, dto, role)`.
    - Nếu `role === 'DEMO'` và `count(quickNote by userId) >= 3` thì throw `ForbiddenException('DEMO_NOTE_LIMIT_REACHED')`.
  - **Verify**: `cd polylex-global && npm run build --workspace=apps/backend`
  - **Re-check**: Queue enrichment flow (`ENRICH_JOB`) vẫn enqueue đúng khi note hợp lệ.
  - **Real-test hint**: DEMO tạo note thứ 4 phải trả 403; note 1-3 vẫn vào queue.
  - **Kết quả**: Backend chặn đúng quota quick note cho demo session.

### Phase 3: Interface Layer

#### REQ-05: FE app chính bootstrap demo token

- [x] **TODO-3.5.1**: Mở rộng `AuthApi` với endpoint demo
  - **File**: `polylex-global/packages/shared-types/src/auth-api.ts`
  - **Context**: Đọc `packages/shared-types/src/auth-api.ts`, `apps/backend/src/modules/auth/auth.controller.ts`
  - **Thay đổi**:
    - Thêm method `issueDemoSession(): Promise<{ accessToken: string }>` vào interface + factory.
    - Map tới `POST /auth/demo`.
  - **Verify**: `cd polylex-global && npm run build --workspace=packages/shared-types`
  - **Re-check**: `register/login/logout/socialLogin` typings không bị breaking.
  - **Real-test hint**: FE import `createAuthApi` phải thấy method mới qua IntelliSense.
  - **Kết quả**: Shared contract đồng bộ giữa backend và 2 app client.

- [x] **TODO-3.5.2**: Bootstrap demo token trong app shell
  - **File**: `polylex-global/apps/frontend/src/App.tsx`
  - **Context**: Đọc `apps/frontend/src/App.tsx`, `apps/frontend/src/api/client.ts`, `apps/frontend/src/store/auth.store.ts`
  - **Thay đổi**:
    - Thêm bootstrap effect: nếu chưa có access token thì gọi `authApi.issueDemoSession()`.
    - Set token vào `useAuthStore` (refreshToken giữ null).
    - Thêm state `isBootstrapping` để tránh redirect `/login` trong lúc init.
  - **Verify**: `cd polylex-global && npm run type-check --workspace=apps/frontend`
  - **Re-check**: User đã login (token tồn tại) không bị override bằng demo token.
  - **Real-test hint**: Fresh browser storage trống -> mở app -> vào `/dashboard` không gặp login screen.
  - **Kết quả**: Người dùng mới vào app được auto-auth bằng demo token.

#### REQ-06: FE hiển thị upgrade CTA khi hết limit

- [x] **TODO-3.6.1**: Handle lỗi DEMO_PATH_LIMIT_REACHED ở generator sheet
  - **File**: `polylex-global/apps/frontend/src/components/roadmap/PathGeneratorSheet.tsx`
  - **Context**: Đọc `apps/frontend/src/components/roadmap/PathGeneratorSheet.tsx`, `apps/frontend/src/pages/RoadmapPage.tsx`
  - **Thay đổi**:
    - Trong catch path generate, detect message `DEMO_PATH_LIMIT_REACHED`.
    - Trigger CTA (toast + action hoặc modal state) điều hướng về `/login`.
  - **Verify**: `cd polylex-global && npm run type-check --workspace=apps/frontend`
  - **Re-check**: Lỗi generate khác (AI fail, validation) vẫn hiển thị message cũ.
  - **Real-test hint**: DEMO tạo path thứ 2 phải thấy CTA đăng ký, không crash sheet.
  - **Kết quả**: UX rõ ràng khi demo quota path đã hết.

- [x] **TODO-3.6.2**: Handle lỗi DEMO_NOTE_LIMIT_REACHED ở quick note sheet
  - **File**: `polylex-global/apps/frontend/src/components/quick-note/AddQuickNoteSheet.tsx`
  - **Context**: Đọc `apps/frontend/src/components/quick-note/AddQuickNoteSheet.tsx`, `apps/frontend/src/pages/QuickNotePage.tsx`
  - **Thay đổi**:
    - Trong flow submit quick note, detect `DEMO_NOTE_LIMIT_REACHED`.
    - Hiển thị CTA đăng nhập/đăng ký, giữ nguyên behavior lỗi khác.
  - **Verify**: `cd polylex-global && npm run type-check --workspace=apps/frontend`
  - **Re-check**: Tạo quick note thành công vẫn prepend note mới vào list.
  - **Real-test hint**: DEMO note thứ 4 hiển thị CTA, note không được tạo.
  - **Kết quả**: UX nhất quán cho limit quick-note.

- [x] **TODO-3.6.3**: Bổ sung i18n message demo-limit tiếng Việt
  - **File**: `polylex-global/apps/frontend/src/i18n/locales/vi.json`
  - **Context**: Đọc `apps/frontend/src/i18n/locales/vi.json`, `apps/frontend/src/components/roadmap/PathGeneratorSheet.tsx`
  - **Thay đổi**:
    - Thêm keys cho thông báo demo limit + CTA text tiếng Việt.
  - **Verify**: `cd polylex-global && npm run type-check --workspace=apps/frontend`
  - **Re-check**: JSON locale vẫn parse hợp lệ, không duplicate key.
  - **Real-test hint**: Đổi locale VI rồi kích hoạt lỗi demo-limit để kiểm tra nội dung.
  - **Kết quả**: Có bản dịch VI cho toàn bộ CTA demo.

- [x] **TODO-3.6.4**: Bổ sung i18n message demo-limit tiếng Anh
  - **File**: `polylex-global/apps/frontend/src/i18n/locales/en.json`
  - **Context**: Đọc `apps/frontend/src/i18n/locales/en.json`, `apps/frontend/src/i18n/locales/vi.json`
  - **Thay đổi**:
    - Thêm keys tương ứng bản EN cho message/CTA.
  - **Verify**: `cd polylex-global && npm run type-check --workspace=apps/frontend`
  - **Re-check**: Các key i18n hiện có không bị đổi tên.
  - **Real-test hint**: Chuyển locale EN, xác nhận text CTA hiển thị đúng.
  - **Kết quả**: i18n EN đồng bộ với VI.

#### REQ-07: Zalo mini app bootstrap demo token

- [x] **TODO-3.7.1**: Refactor Zalo API client để expose demo-session call
  - **File**: `polylex-global/apps/zalo-miniapp/src/api/client.ts`
  - **Context**: Đọc `apps/zalo-miniapp/src/api/client.ts`, `packages/shared-types/src/auth-api.ts`
  - **Thay đổi**:
    - Expose wrapper `issueDemoSession()` từ shared `createAuthApi`.
    - Giữ nguyên loginWithZalo contract hiện tại.
  - **Verify**: `cd polylex-global && npm run build --workspace=apps/zalo-miniapp`
  - **Re-check**: Flow `loginWithZalo()` không bị ảnh hưởng typing/runtime.
  - **Real-test hint**: Gọi helper demo từ console/test hook để xác nhận nhận accessToken.
  - **Kết quả**: Zalo app có API typed cho demo bootstrap.

- [x] **TODO-3.7.2**: Tạo `App.tsx` riêng cho Zalo với demo bootstrap
  - **File**: `polylex-global/apps/zalo-miniapp/src/App.tsx`
  - **Context**: Đọc `apps/zalo-miniapp/src/App.tsx`, `apps/frontend/src/App.tsx`, `apps/zalo-miniapp/src/store/auth.store.ts`
  - **Thay đổi**:
    - Bỏ re-export frontend app.
    - Tạo router Zalo riêng + effect bootstrap demo token khi chưa có session.
    - Thêm bootstrapping state để tránh redirect sai trong lúc init.
  - **Verify**: `cd polylex-global && npm run build --workspace=apps/zalo-miniapp`
  - **Re-check**: Nút login Zalo và route vocabulary vẫn hoạt động sau refactor app shell.
  - **Real-test hint**: Mở mini app mới (storage rỗng) phải vào được trang chính không cần login ngay.
  - **Kết quả**: Zalo mini app không còn phụ thuộc trực tiếp `frontend/src/App.tsx`.

### Phase 4: Integration & Verification

- [ ] **TODO-4.1**: Build shared-types + backend sau thay đổi auth/schema
  - **File**: `polylex-global/package.json`
  - **Context**: Đọc script trong `package.json`, `apps/backend/package.json`
  - **Thay đổi**: Chạy `npm run build --workspace=packages/shared-types && npm run build --workspace=apps/backend`
  - **Verify**: Build thành công, không có TS/Nest compile error.
  - **Re-check**: Confirm module auth cũ (register/login/refresh/social) vẫn compile.
  - **Real-test hint**: Chạy sau mỗi nhóm TODO backend để phát hiện lỗi sớm.
  - **Kết quả**: Artifact backend và shared-types sinh ra ổn định.

- [ ] **TODO-4.2**: Type-check frontend app chính
  - **File**: `polylex-global/apps/frontend/package.json`
  - **Context**: Đọc script `type-check` và các file FE đã sửa
  - **Thay đổi**: Chạy `npm run type-check --workspace=apps/frontend`
  - **Verify**: Không có TypeScript error mới.
  - **Re-check**: Các route `/login`, `/register`, `/profile` không bị mất type-safe.
  - **Real-test hint**: Kết hợp test manual với local storage rỗng và đã login.
  - **Kết quả**: FE chính pass type-check.

- [ ] **TODO-4.3**: Build zalo-miniapp sau tách App.tsx
  - **File**: `polylex-global/apps/zalo-miniapp/package.json`
  - **Context**: Đọc script `build`, `apps/zalo-miniapp/src/App.tsx`
  - **Thay đổi**: Chạy `npm run build --workspace=apps/zalo-miniapp`
  - **Verify**: Vite build pass, không lỗi route/auth imports.
  - **Re-check**: `zmp-vite-plugin` vẫn đọc `app-config.json` bình thường.
  - **Real-test hint**: Chạy `npm run dev:zalo` để smoke test login + demo bootstrap.
  - **Kết quả**: Bundle Zalo deploy được.

- [ ] **TODO-4.4**: Chạy backend unit tests có liên quan auth/paths/quick-note
  - **File**: `polylex-global/apps/backend/package.json`
  - **Context**: Đọc script test backend và các module vừa sửa
  - **Thay đổi**: Chạy `npm run test --workspace=apps/backend`
  - **Verify**: Test pass hoặc chỉ fail do test không liên quan đã tồn tại trước đó.
  - **Re-check**: So sánh lỗi mới phát sinh với baseline trước thay đổi.
  - **Real-test hint**: Ưu tiên thêm/điều chỉnh test cho path/quick-note limit demo nếu thiếu coverage.
  - **Kết quả**: Không có regression logic nghiêm trọng ở backend.

- [ ] **TODO-4.5**: Smoke test thủ công end-to-end demo flow
  - **File**: `polylex-global/README.md`
  - **Context**: Đọc `README.md`, `apps/frontend/src/App.tsx`, `apps/backend/src/modules/auth/auth.controller.ts`
  - **Thay đổi**:
    - Fresh session web: auto vào app bằng demo token.
    - Tạo path lần 1 pass, lần 2 fail với CTA.
    - Tạo quick note 1-3 pass, lần 4 fail với CTA.
    - Login thật sau demo vẫn vào app bình thường.
  - **Verify**: Các acceptance criteria chính của ticket đều pass bằng manual run.
  - **Re-check**: Flow cũ auth user (roadmap/review/profile) không đổi hành vi.
  - **Real-test hint**: Ghi checklist pass/fail theo prompt `4_real_test_completed_task.prompt.md`.
  - **Kết quả**: Sẵn sàng chuyển bước `3_implement_ticket.prompt.md` và review.

---

## Ghi chú triển khai
- Nên dùng cùng JWT payload shape hiện tại (`sub`, `email`, `role`, `orgId`) để không phải sửa `JwtStrategy`.
- Không merge dữ liệu demo sang tài khoản thật trong phase này để tránh tăng scope.
- Nếu muốn chống abuse mạnh hơn, cân nhắc thêm rate-limit layer ở gateway/proxy trong phase sau.

## Rủi ro cần theo dõi
- [ ] Risk-1: DB phình do tạo nhiều user DEMO — Biện pháp: thêm cleanup cron ticket follow-up.
- [ ] Risk-2: FE bootstrap demo lặp request khi network chập chờn — Biện pháp: in-flight guard + bootstrapping flag.
- [ ] Risk-3: Mismatch error message backend/FE cho demo-limit — Biện pháp: chuẩn hóa constants error code ở shared-types (follow-up nếu cần).

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Đã triển khai xong phần code cho Demo Token theo Phase 1-3: backend cấp demo JWT + giới hạn quota demo, frontend và Zalo bootstrap demo session tự động, kèm UI xử lý khi chạm giới hạn.

### Thống kê
- **Tổng TODO**: 23
- **Hoàn thành**: 18 ✅
- **Blocked**: 5 ⚠️

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-1.1.1 → TODO-3.7.2 | Data + Logic + Interface implementation | ✅ Done | Đã sửa code và kiểm tra lỗi qua VS Code diagnostics |
| TODO-4.1 | Build shared-types + backend | ⚠️ Blocked | Node runtime lỗi ICU (`libicui18n.74.dylib`), command exit 134 |
| TODO-4.2 | Type-check frontend | ⚠️ Blocked | Cùng blocker môi trường Node/ICU |
| TODO-4.3 | Build zalo-miniapp | ⚠️ Blocked | Cùng blocker môi trường Node/ICU |
| TODO-4.4 | Chạy backend unit tests | ⚠️ Blocked | Cùng blocker môi trường Node/ICU |
| TODO-4.5 | Smoke test thủ công end-to-end | ⚠️ Blocked | Chờ mở khóa môi trường build/test |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `polylex-global/apps/backend/prisma/schema.prisma` | Modified | Thêm `UserRole.DEMO` |
| `polylex-global/apps/backend/prisma/migrations/20260326140000_add_demo_role/migration.sql` | Added | Migration thêm enum value `DEMO` |
| `polylex-global/apps/backend/src/config/config.module.ts` | Modified | Thêm env `JWT_DEMO_EXPIRES_IN` |
| `polylex-global/apps/backend/.env.example` | Modified | Khai báo `JWT_DEMO_EXPIRES_IN="7d"` |
| `polylex-global/apps/backend/src/modules/auth/auth.service.ts` | Modified | Thêm `issueDemoSession()` |
| `polylex-global/apps/backend/src/modules/auth/auth.controller.ts` | Modified | Thêm `POST /auth/demo` |
| `polylex-global/apps/backend/src/modules/paths/paths.controller.ts` | Modified | Truyền role vào service generate path |
| `polylex-global/apps/backend/src/modules/paths/paths.service.ts` | Modified | Enforce `DEMO_PATH_LIMIT_REACHED` |
| `polylex-global/apps/backend/src/modules/quick-note/quick-note.controller.ts` | Modified | Truyền role vào service create quick note |
| `polylex-global/apps/backend/src/modules/quick-note/quick-note.service.ts` | Modified | Enforce `DEMO_NOTE_LIMIT_REACHED` |
| `polylex-global/packages/shared-types/src/auth-api.ts` | Modified | Thêm `issueDemoSession()` vào `AuthApi` |
| `polylex-global/apps/frontend/src/App.tsx` | Modified | Bootstrap demo token + bootstrapping gate |
| `polylex-global/apps/frontend/src/components/roadmap/PathGeneratorSheet.tsx` | Modified | CTA khi chạm path demo limit |
| `polylex-global/apps/frontend/src/components/quick-note/AddQuickNoteSheet.tsx` | Modified | CTA khi chạm quick-note demo limit |
| `polylex-global/apps/frontend/src/i18n/locales/vi.json` | Modified | Thêm text demo-limit tiếng Việt |
| `polylex-global/apps/frontend/src/i18n/locales/en.json` | Modified | Thêm text demo-limit tiếng Anh |
| `polylex-global/apps/zalo-miniapp/src/store/auth.store.ts` | Modified | Thêm `setDemoToken()` |
| `polylex-global/apps/zalo-miniapp/src/api/client.ts` | Modified | Expose `issueDemoSession()` |
| `polylex-global/apps/zalo-miniapp/src/App.tsx` | Modified | Router riêng + demo bootstrap |

### Verification
- [ ] Build thành công: ❌ (blocked bởi lỗi Node/ICU trong môi trường)
- [ ] Unit tests pass: ❌ (chưa chạy được vì cùng blocker)
- [x] Không có warning/error TypeScript mới trên file đã sửa (VS Code diagnostics): ✅
- [x] Re-check flow cũ không lỗi (code-level checks): ✅
- [ ] Real test theo từng TODO: ❌ (blocked, chưa chạy prompt `4_real_test_completed_task.prompt.md`)

### Ghi chú
- Để workaround type error tạm thời trước khi `prisma generate` chạy được, giá trị role DEMO trong `auth.service.ts` dùng cast `'DEMO' as any`.
- Sau khi sửa môi trường Node/ICU, cần chạy lại TODO-4.1 → TODO-4.5 theo đúng kế hoạch để chốt PASS thực tế.
