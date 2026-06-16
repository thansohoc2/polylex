# TICKET-026: Tăng thời hạn token lên 30 ngày và sửa auto login

## Mô tả yêu cầu

Hiện tại ứng dụng bị đăng xuất rất nhanh (thực tế là sau 15 phút không hoạt động). Yêu cầu:
1. Hạn của token phải là **30 ngày** — người dùng không cần đăng nhập lại mỗi tuần
2. **Auto login** khi mở lại app nếu session vẫn còn hạn

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-026 |
| **Tiêu đề** | Tăng thời hạn token lên 30 ngày và sửa auto login |
| **Mục tiêu** | Session tồn tại 30 ngày, refresh hoạt động đúng, auto login khi mở lại app |
| **Phạm vi** | Backend (auth module, config) · Frontend (client interceptor, auth store) · Config (env) |
| **Độ ưu tiên** | Cao |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Sửa lỗi refresh endpoint | Gỡ `JwtAuthGuard` khỏi `/auth/refresh`, chuyển sang verify bằng refresh token JWT (dùng `JWT_REFRESH_SECRET`) | Backend (API) | TB |
| REQ-02 | Sửa lỗi register không lưu refresh token | `register()` không lưu hash refresh token vào DB — userx mới đăng ký bị forced logout sau 15 phút | Backend (API, DB) | Nhỏ |
| REQ-03 | Tăng thời hạn refresh token lên 30 ngày | Đổi `JWT_REFRESH_EXPIRES_IN` từ `7d` thành `30d` trong env và default config | Config | Nhỏ |
| REQ-04 | Xác nhận auto login frontend đã đúng | Kiểm tra Zustand persist + interceptor hoạt động đúng sau khi REQ-01 được fix | Frontend | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 (sửa refresh endpoint) ──────┐
                                    ├──> REQ-04 (xác nhận auto login)
REQ-02 (sửa register)               │
REQ-03 (đổi expires 30d) ───────────┘

REQ-01, REQ-02, REQ-03: Độc lập, có thể làm song song
REQ-04: Phụ thuộc vào REQ-01 đã hoàn thành
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Sửa lỗi refresh endpoint (Critical Bug Fix)
- **Mục tiêu**: Cho phép `/auth/refresh` hoạt động ngay cả khi access token đã hết hạn
- **Đầu vào**: `{ refreshToken: string }` trong request body
- **Đầu ra mong đợi**: Trả về `{ accessToken, refreshToken }` mới nếu refresh token hợp lệ và chưa hết hạn
- **Tiêu chí hoàn thành**: Gọi `POST /auth/refresh` với refresh token hợp lệ + access token đã hết hạn → nhận token mới thành công
- **Phụ thuộc**: Không

##### REQ-02: Sửa register không lưu refresh token
- **Mục tiêu**: Sau khi đăng ký, refresh token được lưu vào DB để silent refresh hoạt động
- **Đầu vào**: Quá trình `register()` tạo user xong và sinh token pair
- **Đầu ra mong đợi**: `users.refresh_token` được cập nhật với hash của refresh token mới
- **Tiêu chí hoàn thành**: Sau `POST /auth/register`, cột `refresh_token` trong DB không còn là `null`
- **Phụ thuộc**: Không

##### REQ-03: Tăng thời hạn refresh token lên 30 ngày
- **Mục tiêu**: Người dùng không bị đăng xuất sau 7 ngày
- **Đầu vào**: Biến môi trường `JWT_REFRESH_EXPIRES_IN`
- **Đầu ra mong đợi**: Refresh token có `exp` = now + 30 ngày
- **Tiêu chí hoàn thành**: Token được sinh ra sau khi login có thể dùng để refresh trong vòng 30 ngày
- **Phụ thuộc**: Không

##### REQ-04: Xác nhận auto login frontend hoạt động đúng
- **Mục tiêu**: Khi mở lại app sau nhiều ngày, app tự động dùng token đã lưu mà không yêu cầu đăng nhập lại
- **Đầu vào**: Zustand store đã hydrate từ storage với `accessToken` (có thể hết hạn) + `refreshToken` (còn hàn)
- **Đầu ra mong đợi**: Lần gọi API đầu tiên tự động trigger refresh, người dùng ở lại trên protected route
- **Tiêu chí hoàn thành**: Mở app sau 15+ phút không dùng → không bị redirect về `/login`
- **Phụ thuộc**: REQ-01

---

### 3. Ngữ cảnh nghiệp vụ

**Luồng nghiệp vụ liên quan:**
- Đăng nhập → nhận `accessToken` (15m) + `refreshToken` (7d hiện tại, sẽ thành 30d)
- Mọi API call → gắn `accessToken` vào `Authorization: Bearer`
- Khi API trả 401 → interceptor gọi `/auth/refresh` → lấy token mới → replay request gốc
- Nếu refresh thất bại → logout

**Thực thể domain liên quan:**
- `User` (bảng `users`): field `refresh_token` (VARCHAR, lưu bcrypt hash)
- `TokenPair`: `{ accessToken: string, refreshToken: string }` (shared-types)

**Hành vi hiện có cần bảo toàn:**
- Refresh token rotation (mỗi lần refresh → token cũ bị hủy, token mới được lưu)
- Logout xóa `refresh_token` khỏi DB
- Hash refresh token trước khi lưu vào DB (bcrypt, cost=10)

---

### 4. Ngữ cảnh kỹ thuật

**Root cause — Bug nghiêm trọng:**

`POST /auth/refresh` hiện đang dùng `@UseGuards(JwtAuthGuard)`:

```ts
// apps/backend/src/modules/auth/auth.controller.ts
@Post('refresh')
@UseGuards(JwtAuthGuard)   // ← BUG: guard này từ chối mọi expired access token
@ApiBearerAuth()
refresh(@CurrentUser() user: AuthUser, @Body() dto: RefreshTokenDto) {
  return this.authService.refresh(user.id, dto.refreshToken);
}
```

`JwtStrategy` được cấu hình `ignoreExpiration: false`:

```ts
// apps/backend/src/modules/auth/strategies/jwt.strategy.ts
super({
  ignoreExpiration: false,   // ← expired token → Unauthorized
  secretOrKey: config.get<string>('JWT_ACCESS_SECRET')!,
});
```

**Hệ quả**: Interceptor phía frontend nhận 401 → thử gọi `/auth/refresh` với access token đã hết hạn → `/auth/refresh` cũng trả 401 (vì guard reject) → interceptor catch → gọi `logout()`. Cơ chế silent refresh hoàn toàn không hoạt động.

**Các file bị ảnh hưởng:**

| File | Thay đổi cần thiết |
|------|--------------------|
| [apps/backend/src/modules/auth/auth.controller.ts](apps/backend/src/modules/auth/auth.controller.ts) | Xóa `@UseGuards(JwtAuthGuard)` và `@CurrentUser()` khỏi `refresh()`, truyền dto trực tiếp |
| [apps/backend/src/modules/auth/auth.service.ts](apps/backend/src/modules/auth/auth.service.ts) | Sửa signature `refresh()` để nhận `refreshToken` và tự decode lấy userId; sửa `register()` để lưu hash refresh token |
| [apps/backend/src/modules/auth/dto/auth.dto.ts](apps/backend/src/modules/auth/dto/auth.dto.ts) | Có thể cần thêm validation cho `RefreshTokenDto` |
| `.env.deploy.example` | Đổi `JWT_REFRESH_EXPIRES_IN` thành `30d` |
| [apps/backend/src/config/config.module.ts](apps/backend/src/config/config.module.ts) | Đổi default `JWT_REFRESH_EXPIRES_IN` thành `30d` |

**Bảng database liên quan:**
- `users.refresh_token` (VARCHAR nullable): lưu bcrypt hash của refresh token hiện hành

**Điểm tích hợp:**
- Frontend `axios` interceptor tại [apps/frontend/src/api/client.ts](apps/frontend/src/api/client.ts) — đã gửi `refreshToken` trong body, chỉ cần backend sửa
- Zustand store tại [apps/frontend/src/store/auth.store.ts](apps/frontend/src/store/auth.store.ts) — đã persist đúng, không cần sửa
- `RequireAuth` tại [apps/frontend/src/App.tsx](apps/frontend/src/App.tsx) — chỉ check `!!accessToken`, đã đúng

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `/auth/refresh` require valid access token → thực chất không thể refresh được | `/auth/refresh` chỉ cần refresh token hợp lệ | Sửa guard + service logic |
| `register()` không lưu refresh token vào DB → user mới đăng ký forced-logout sau 15 phút | `register()` lưu hash refresh token như `login()` | Thêm 2 dòng vào `register()` |
| `JWT_REFRESH_EXPIRES_IN=7d` | `JWT_REFRESH_EXPIRES_IN=30d` | Đổi giá trị env + config default |
| Auto login hoạt động ngầm nhưng thất bại do bug REQ-01 | Auto login hoạt động thực sự: app mở lại sau nhiều ngày → không cần login lại | Đã giải quyết sau REQ-01 + REQ-03 |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [x] **Extend session 30 ngày tăng window tấn công nếu refresh token bị lộ** — Giảm thiểu: rotation (đã có), bcrypt hash (đã có), user có thể logout để hủy session
- [x] **Người dùng hiện tại sẽ phải login lại 1 lần** sau khi deploy (vì refresh token cũ được lưu với `exp=7d` — không ảnh hưởng gì, chỉ annoy một lần)

#### 6.2 Rủi ro kỹ thuật
- [x] **Xóa JwtAuthGuard khỏi /auth/refresh → phải validate refresh token thủ công** — Backend cần dùng `JwtService.verifyAsync()` với `JWT_REFRESH_SECRET` trực tiếp, sai secret hoặc hết hạn → Unauthorized; không skip validation
- [x] **Race condition: 2 request đồng thời cùng trigger refresh** — Interceptor đã có `_retry` flag để tránh loop, nhưng nếu 2 tabs/request cùng lúc trigger 2 refresh calls, token cũ có thể bị invalidate trước khi 2nd request dùng. Giảm thiểu: dùng 1 promise singleton cho refresh (refresh lock) — *optional nhưng khuyến nghị cho web*
- [x] **Refresh token bị lộ qua localStorage trên web** — Đây là trade-off đã chấp nhận; native dùng Capacitor Preferences an toàn hơn. Giảm thiểu: HTTPS + SameSite cookie là alternative (scope ngoài ticket này)

#### 6.3 Lỗi logic tiềm ẩn
- [x] **Refresh token decode thất bại (malformed/wrong secret) không được handle** — Cần bọc `verifyAsync` trong try/catch và throw `UnauthorizedException`
- [x] **userId trong payload bị null/undefined khi decode** — Cần validate `payload.sub` sau khi decode
- [x] **Interceptor gọi đệ quy vô hạn nếu `/auth/refresh` trả 401** — Đã được ngăn bởi `_retry` flag trong interceptor hiện tại

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Sửa đúng root cause (bug kiến trúc), không chỉ kéo dài thời gian | Cần deploy lại backend |
| Không thay đổi frontend (interceptor đã gửi `refreshToken` đúng) | Người dùng hiện tại phải login lại 1 lần sau deploy |
| Đơn giản: verify bằng JWT refresh secret, không cần DB round-trip thêm | — |
| Rotation đã có sẵn → bảo mật tốt | — |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: 
  1. Xóa `@UseGuards(JwtAuthGuard)` khỏi `/auth/refresh`
  2. Trong `auth.service.refresh()`: nhận `refreshToken` string, dùng `this.jwt.verifyAsync(refreshToken, { secret: refreshSecret })` để lấy `userId` (tự verify expiry), sau đó xử lý như cũ
  3. Sửa `register()` để lưu hash refresh token (copy 2 dòng từ `login()`)
  4. Đổi `JWT_REFRESH_EXPIRES_IN` → `30d` trong env + config default
  
- **Các cách tiếp cận thay thế**:
  - Dùng `ignoreExpiration: true` trong JwtStrategy riêng cho `/auth/refresh` — phức tạp hơn không cần thiết
  - Refresh token là opaque string (random UUID) lưu hẳn trong DB → không cần verify JWT, chỉ DB lookup — đơn giản hơn nhưng cần migration schema và query thêm

- **Phụ thuộc**: Không có phụ thuộc ngoài, chỉ cần deploy backend + cập nhật env

- **Ước tính công sức**: Nhỏ (~2h implement + test)

---

### 9. Câu hỏi mở

- [ ] Có muốn implement **refresh lock** phía frontend (tránh race condition khi nhiều request cùng trigger refresh trong 1 session web) không, hay để đơn giản trước?
- [ ] Access token `JWT_ACCESS_EXPIRES_IN` có cần tăng lên (vd: `1h`) không? Hiện tại `15m` là ngắn nhưng sau khi bug fix, nó sẽ được auto-refresh transparent — có thể giữ nguyên để tăng bảo mật.

---

### 10. Danh sách re-check hồi quy

| Mã | Flow cũ cần re-check | Liên quan REQ | Mức ưu tiên | Cách re-check | Tiêu chí pass |
|----|----------------------|---------------|-------------|---------------|---------------|
| RC-01 | Login bình thường → nhận token | REQ-01, REQ-03 | Cao | `POST /auth/login` → check response + DB `refresh_token` không null | Nhận `accessToken` + `refreshToken`, DB có hash |
| RC-02 | Register → nhận token → refresh | REQ-02 | Cao | `POST /auth/register` → check DB → call `POST /auth/refresh` | DB có hash sau register; refresh thành công |
| RC-03 | Silent refresh khi access token hết hạn | REQ-01 | Cao | Login → đợi 15m (hoặc set `JWT_ACCESS_EXPIRES_IN=10s` khi test) → gọi bất kỳ API → kiểm tra token mới | API trả 200, không redirect về `/login`, token mới trong store |
| RC-04 | Logout hủy session đúng | REQ-01 | Cao | Logout → gọi `/auth/refresh` với token cũ | Trả 401 Unauthorized |
| RC-05 | Social login (Google/Apple) vẫn hoạt động | REQ-01 | Trung bình | Login với social provider → nhận token → refresh | Flow không thay đổi, token pair nhận được bình thường |
| RC-06 | Token rotation: dùng refresh token cũ sau khi đã rotation | REQ-01 | Trung bình | Refresh → dùng old refresh token để refresh lần 2 | Trả 401 (invalid refresh token) |
| RC-07 | Auto login khi mở app sau khi access token hết hạn | REQ-01, REQ-04 | Cao | Mô phỏng: lưu access token hết hạn + refresh token còn hạn → reload app → thực hiện action | App ở lại trên protected route, không redirect `/login` |

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Sửa triệt để luồng refresh để session thực sự tự gia hạn được, đồng thời tăng thời hạn refresh token lên 30 ngày. Sau thay đổi, người dùng mở lại app sẽ auto login nếu refresh token còn hạn.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: `POST /auth/refresh` phải hoạt động khi access token đã hết hạn.
2. FR-02: `register()` phải lưu hash refresh token vào `users.refresh_token`.
3. FR-03: Thời hạn refresh token phải là 30 ngày trong cấu hình runtime/deploy.
4. FR-04: Frontend giữ nguyên cơ chế persist + auto-refresh, không bị redirect về `/login` khi refresh còn hợp lệ.

#### Ràng buộc phi chức năng
1. NFR-01: Không phá vỡ refresh token rotation hiện có.
2. NFR-02: Controller giữ mỏng, validate/logic đặt ở service/DTO theo NestJS practice.
3. NFR-03: Không thay đổi schema DB/migration cho ticket này.
4. NFR-04: Tương thích với cả web (localStorage) và native (Capacitor Preferences).

#### Phụ thuộc
- DEP-01: REQ-04 phụ thuộc REQ-01 hoàn tất (refresh endpoint phải chạy đúng).
- DEP-02: Biến môi trường deploy thực tế cần cập nhật cùng lúc với code (`.env.deploy`).
- DEP-03: Sau deploy, token cũ của user hiện tại có thể cần đăng nhập lại một lần.

### Cách tiếp cận
> Triển khai theo 4 phase: (1) Config token TTL, (2) Core auth logic, (3) API interface, (4) Integration verification. Mỗi TODO chỉ chạm 1 file để downstream agent dễ thực thi, test, và rollback.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/backend/src/config/config.module.ts` | Đổi default `JWT_REFRESH_EXPIRES_IN` thành `30d` |
| Sửa đổi | `apps/backend/src/modules/auth/auth.service.ts` | Sửa fallback expiry, lưu refresh token sau register, verify refresh token payload bằng JWT refresh secret |
| Sửa đổi | `apps/backend/.env.example` | Đổi mẫu cấu hình refresh token thành `30d` |
| Sửa đổi | `.env.deploy.example` | Đổi mẫu deploy refresh token thành `30d` |
| Sửa đổi | `apps/backend/src/modules/auth/auth.controller.ts` | Bỏ guard ở endpoint `/auth/refresh`, chuyển nhận dữ liệu từ body |
| Sửa đổi | `apps/backend/src/modules/auth/dto/auth.dto.ts` | Tăng ràng buộc validate cho `RefreshTokenDto.refreshToken` |
| Tạo mới (Unit test) | `apps/backend/src/modules/auth/auth.service.spec.ts` | Unit test cho register lưu refresh token + refresh success/fail |

---

## PLAN TODO

### Phase 1: Config Layer

#### REQ-03: Tăng thời hạn refresh token lên 30 ngày

- [x] **TODO-1.3.1**: Đổi default refresh expiry trong config module
  - **File**: `apps/backend/src/config/config.module.ts`
  - **Context**: Đọc `apps/backend/src/config/config.module.ts`
  - **Thay đổi**:
    - Sửa `Joi.string().default('7d')` của `JWT_REFRESH_EXPIRES_IN` thành `Joi.string().default('30d')`
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Kết quả**: Backend có default TTL mới là 30 ngày khi env không override

- [x] **TODO-1.3.2**: Đổi fallback refresh expiry trong auth service
  - **File**: `apps/backend/src/modules/auth/auth.service.ts`
  - **Context**: Đọc `generateTokenPair()` trong `apps/backend/src/modules/auth/auth.service.ts`
  - **Thay đổi**:
    - Sửa fallback `this.config.get<string>('JWT_REFRESH_EXPIRES_IN', '7d')` thành `'30d'`
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Kết quả**: Không còn fallback 7 ngày ở tầng service

- [x] **TODO-1.3.3**: Cập nhật env mẫu backend
  - **File**: `apps/backend/.env.example`
  - **Context**: Đọc section JWT trong `apps/backend/.env.example`
  - **Thay đổi**:
    - Sửa `JWT_REFRESH_EXPIRES_IN="7d"` thành `JWT_REFRESH_EXPIRES_IN="30d"`
  - **Verify**: `grep -n "JWT_REFRESH_EXPIRES_IN" apps/backend/.env.example`
  - **Kết quả**: Người setup môi trường mới dùng đúng TTL 30 ngày

- [x] **TODO-1.3.4**: Cập nhật env mẫu deploy
  - **File**: `.env.deploy.example`
  - **Context**: Đọc section JWT trong `.env.deploy.example`
  - **Thay đổi**:
    - Sửa `JWT_REFRESH_EXPIRES_IN="7d"` thành `JWT_REFRESH_EXPIRES_IN="30d"`
  - **Verify**: `grep -n "JWT_REFRESH_EXPIRES_IN" .env.deploy.example`
  - **Kết quả**: Mẫu deploy đồng bộ TTL 30 ngày

### Phase 2: Core Logic Layer

#### REQ-02: Sửa register không lưu refresh token

- [x] **TODO-2.2.1**: Lưu hash refresh token ngay sau register
  - **File**: `apps/backend/src/modules/auth/auth.service.ts`
  - **Context**: Đọc `register()` và `login()` trong `apps/backend/src/modules/auth/auth.service.ts`
  - **Thay đổi**:
    - Trong `register()`, sau `generateTokenPair(...)`, hash `tokens.refreshToken` bằng bcrypt
    - Gọi `prisma.user.update()` để lưu `refreshToken` hash vào user vừa tạo
    - Giữ nguyên output trả về là `TokenPair`
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Kết quả**: User mới đăng ký có session refresh hợp lệ trong DB

- [x] **TODO-2.2.2**: Viết unit test cho register lưu refresh token
  - **File**: `apps/backend/src/modules/auth/auth.service.spec.ts`
  - **Context**: Đọc `apps/backend/src/modules/review/acre/acre.engine.spec.ts`, `apps/backend/src/modules/auth/auth.service.ts`
  - **Thay đổi**:
    - Tạo spec file mới cho `AuthService`
    - Thêm test case: `register()` gọi update lưu `refreshToken` hash và trả về token pair
  - **Verify**: `npm run test --workspace=apps/backend -- auth.service.spec.ts`
  - **Kết quả**: Logic lưu refresh token của register được khóa bằng test

#### REQ-01: Sửa lỗi refresh endpoint

- [x] **TODO-2.1.1**: Refactor logic refresh để tự verify bằng refresh secret
  - **File**: `apps/backend/src/modules/auth/auth.service.ts`
  - **Context**: Đọc `refresh()`, `generateTokenPair()` trong `apps/backend/src/modules/auth/auth.service.ts`
  - **Thay đổi**:
    - Đổi signature `refresh(userId: string, refreshToken: string)` thành chỉ nhận `refreshToken`
    - Dùng `this.jwt.verifyAsync(refreshToken, { secret: JWT_REFRESH_SECRET })` để lấy payload
    - Validate `payload.sub` tồn tại trước khi query user
    - Giữ nguyên check bcrypt compare + rotation refresh token
    - Bọc verify trong `try/catch` và throw `UnauthorizedException` nếu token invalid/expired
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Kết quả**: Refresh chạy được độc lập với access token

- [x] **TODO-2.1.2**: Viết unit test cho refresh success và failure paths
  - **File**: `apps/backend/src/modules/auth/auth.service.spec.ts`
  - **Context**: Đọc `apps/backend/src/modules/auth/auth.service.ts`
  - **Thay đổi**:
    - Thêm test case refresh thành công với refresh token hợp lệ
    - Thêm test case refresh thất bại khi verify JWT lỗi
    - Thêm test case refresh thất bại khi bcrypt compare fail
  - **Verify**: `npm run test --workspace=apps/backend -- auth.service.spec.ts`
  - **Kết quả**: Các nhánh quan trọng của refresh được phủ test

### Phase 3: Interface/API Layer

#### REQ-01: Cập nhật endpoint refresh theo luồng mới

- [x] **TODO-3.1.1**: Bỏ JwtAuthGuard khỏi endpoint refresh
  - **File**: `apps/backend/src/modules/auth/auth.controller.ts`
  - **Context**: Đọc `apps/backend/src/modules/auth/auth.controller.ts`, `apps/backend/src/modules/auth/auth.service.ts`
  - **Thay đổi**:
    - Xóa `@UseGuards(JwtAuthGuard)` và `@ApiBearerAuth()` ở `@Post('refresh')`
    - Xóa dependency `@CurrentUser()` tại method `refresh`
    - Method `refresh` chỉ nhận `@Body() dto` và gọi `authService.refresh(dto.refreshToken)`
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Kết quả**: `/auth/refresh` không còn phụ thuộc access token còn hạn

- [x] **TODO-3.1.2**: Tăng validation cho refresh token DTO
  - **File**: `apps/backend/src/modules/auth/dto/auth.dto.ts`
  - **Context**: Đọc `RefreshTokenDto` trong `apps/backend/src/modules/auth/dto/auth.dto.ts`
  - **Thay đổi**:
    - Giữ `@IsString()` và bổ sung ràng buộc độ dài tối thiểu hợp lý (ví dụ `@MinLength(10)`) cho `refreshToken`
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Kết quả**: Input refresh token bị rỗng/ngắn bất thường bị chặn sớm ở DTO

### Phase 4: Integration & Verification

#### REQ-04: Xác nhận auto login frontend hoạt động

- [x] **TODO-4.4.1**: Rà soát interceptor không cần sửa logic ngoài phạm vi ticket
  - **File**: `apps/frontend/src/api/client.ts`
  - **Context**: Đọc `apps/frontend/src/api/client.ts`, `apps/frontend/src/store/auth.store.ts`, `apps/backend/src/modules/auth/auth.controller.ts`
  - **Thay đổi**:
    - Không thay đổi code nếu backend refresh đã đáp ứng contract hiện có (`{ refreshToken }`)
    - Chỉ xác nhận flow 401 → refresh → replay request vẫn tương thích
  - **Verify**: Manual smoke sau deploy backend
  - **Kết quả**: Frontend auto login hoạt động nhờ backend refresh fix, không cần chỉnh FE
  - ℹ️ **Note**: Đã rà soát contract request/response; không cần sửa frontend cho scope ticket này.

- [x] **TODO-4.1**: Build backend sau toàn bộ thay đổi
  - **File**: `apps/backend/package.json`
  - **Context**: Đọc script `build`
  - **Thay đổi**: Chạy `npm run build --workspace=apps/backend`
  - **Verify**: Build thành công, không phát sinh lỗi TypeScript mới
  - **Kết quả**: Artifact `dist/` sẵn sàng chạy

- [ ] **TODO-4.2**: Chạy unit tests backend
  - **File**: `apps/backend/package.json`
  - **Context**: Đọc script `test`
  - **Thay đổi**: Chạy `npm run test --workspace=apps/backend`
  - **Verify**: Test pass (hoặc chỉ fail các test unrelated đã tồn tại trước đó)
  - **Kết quả**: Logic auth mới được xác nhận qua test
  - ⚠️ **BLOCKED**: Full test suite fail tại `src/modules/review/acre/acre.engine.spec.ts` do lỗi module mapping `@polylex/shared-types` (không thuộc thay đổi auth trong ticket này).
  - **Action needed**: Sửa cấu hình Jest `moduleNameMapper` cho package shared-types rồi chạy lại `npm run test --workspace=apps/backend`.

- [ ] **TODO-4.3**: Smoke test thủ công flow auth/refresh
  - **File**: `ticket-docs/TICKET-026-token-lifetime-and-auto-login.md`
  - **Context**: Đọc mục `### 10. Danh sách re-check hồi quy`
  - **Thay đổi**:
    - Chạy RC-01 → RC-07 theo checklist đã phân tích
    - Ghi nhận kết quả pass/fail vào ticket sau implement
  - **Verify**: Tất cả RC mức `Cao` pass
  - **Kết quả**: Ticket sẵn sàng chuyển review/QA
  - ⚠️ **BLOCKED**: Chưa có môi trường runtime backend + DB + frontend chạy đồng bộ trong phiên này để thực thi RC-01..RC-07 end-to-end.
  - **Action needed**: Khởi chạy stack local/QA và chạy manual checklist RC-01..RC-07.

---

## Ghi chú triển khai
- Cần cập nhật thêm file môi trường thực tế đang dùng khi deploy (`apps/backend/.env` hoặc secrets của CI/server), không chỉ file example.
- Không thay đổi `JWT_ACCESS_EXPIRES_IN` trong ticket này để tránh mở rộng scope.
- Nếu muốn giảm race condition refresh nhiều request đồng thời ở web, tạo ticket follow-up riêng (refresh lock ở frontend interceptor).

## Rủi ro cần theo dõi
- [ ] Risk-1: Sai khác env giữa file mẫu và env production — Biện pháp: checklist deploy bắt buộc verify `JWT_REFRESH_EXPIRES_IN=30d` trên server thực tế.
- [ ] Risk-2: Refresh token invalid sau deploy với user session cũ — Biện pháp: thông báo release note “có thể cần đăng nhập lại 1 lần”.

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Đã sửa luồng refresh token để không còn phụ thuộc access token hết hạn, đồng thời nâng thời hạn refresh token lên 30 ngày và bổ sung unit tests cho logic auth mới.

### Thống kê
- **Tổng TODO**: 14
- **Hoàn thành**: 12 ✅
- **Blocked**: 2 ⚠️

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-1.3.1 | Đổi default refresh expiry trong config module | ✅ Done | |
| TODO-1.3.2 | Đổi fallback refresh expiry trong auth service | ✅ Done | |
| TODO-1.3.3 | Cập nhật env mẫu backend | ✅ Done | |
| TODO-1.3.4 | Cập nhật env mẫu deploy | ✅ Done | |
| TODO-2.2.1 | Lưu hash refresh token ngay sau register | ✅ Done | |
| TODO-2.2.2 | Viết unit test cho register lưu refresh token | ✅ Done | Gộp trong `auth.service.spec.ts` |
| TODO-2.1.1 | Refactor logic refresh để tự verify bằng refresh secret | ✅ Done | |
| TODO-2.1.2 | Viết unit test cho refresh success và failure paths | ✅ Done | Gộp trong `auth.service.spec.ts` |
| TODO-3.1.1 | Bỏ JwtAuthGuard khỏi endpoint refresh | ✅ Done | |
| TODO-3.1.2 | Tăng validation cho refresh token DTO | ✅ Done | |
| TODO-4.4.1 | Rà soát interceptor không cần sửa logic ngoài phạm vi ticket | ✅ Done | Không cần đổi code frontend |
| TODO-4.1 | Build backend sau toàn bộ thay đổi | ✅ Done | `npm run build --workspace=apps/backend` pass |
| TODO-4.2 | Chạy unit tests backend | ⚠️ Blocked | Fail unrelated ở `acre.engine.spec.ts` do module mapper |
| TODO-4.3 | Smoke test thủ công flow auth/refresh | ⚠️ Blocked | Cần môi trường runtime đầy đủ để chạy RC checklist |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/backend/src/config/config.module.ts` | Modified | Đổi default `JWT_REFRESH_EXPIRES_IN` sang `30d` |
| `apps/backend/.env.example` | Modified | Đổi `JWT_REFRESH_EXPIRES_IN` sang `30d` |
| `.env.deploy.example` | Modified | Đổi `JWT_REFRESH_EXPIRES_IN` sang `30d` |
| `apps/backend/src/modules/auth/auth.service.ts` | Modified | Lưu refresh hash sau register; verify refresh token bằng JWT refresh secret; đổi fallback TTL `30d` |
| `apps/backend/src/modules/auth/auth.controller.ts` | Modified | Bỏ guard cho `/auth/refresh`, nhận `refreshToken` từ body |
| `apps/backend/src/modules/auth/dto/auth.dto.ts` | Modified | Thêm `@MinLength(10)` cho `refreshToken` |
| `apps/backend/src/modules/auth/auth.service.spec.ts` | Added | Thêm 4 unit tests cho register/refresh success/failure |

### Verification
- [ ] Build thành công: ✅
- [ ] Unit tests pass: ❌ (full suite fail unrelated module mapper); riêng `auth.service.spec.ts` pass ✅
- [ ] Không có warning mới: ✅/1

### Ghi chú
- Build lần đầu bị lỗi runtime Node (`icu4c`) trong terminal; đã chuyển Node qua `nvm use v23` và build pass.
- Không thay đổi frontend code vì contract refresh hiện có vẫn đúng sau khi backend fix.
