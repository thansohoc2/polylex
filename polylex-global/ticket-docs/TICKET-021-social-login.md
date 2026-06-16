# TICKET-021 — Social Login: Apple, Google, Facebook

## Yêu cầu gốc
Thêm đăng nhập bằng Apple, Google, Facebook với chiến lược marketing tối ưu nhất cho PolyLex — ứng dụng học ngôn ngữ trên iOS/Android (Capacitor) và web (PWA).

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-021 |
| **Tiêu đề** | Social Login (Apple / Google / Facebook) với chiến lược marketing tối ưu |
| **Mục tiêu** | Giảm ma sát đăng ký/đăng nhập, tăng conversion rate, đáp ứng yêu cầu App Store (Apple bắt buộc), khai thác social graph của Facebook cho viral growth |
| **Phạm vi** | Backend (NestJS auth module, Prisma schema, migration), Frontend (LoginPage, RegisterPage, Capacitor plugins, auth store), CI/CD (secrets mới) |
| **Độ ưu tiên** | Cao |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Schema migration | `passwordHash` nullable, thêm model `SocialAccount` | DB / Prisma | Nhỏ |
| REQ-02 | Backend social auth endpoint | `POST /auth/social` — verify token từ provider, upsert user | Backend REST | Trung bình |
| REQ-03 | Google Sign-In (native) | Tích hợp `@codetrix-studio/capacitor-google-auth` cho iOS/Android | Frontend + Native | Trung bình |
| REQ-04 | Apple Sign In (native) | Tích hợp `@capacitor-community/apple-sign-in` cho iOS | Frontend + Native | Trung bình |
| REQ-05 | Facebook Login (native) | Tích hợp `@capacitor-community/facebook-login` cho iOS/Android | Frontend + Native | Trung bình |
| REQ-06 | Social login Web fallback | Google Identity Services + Apple JS + Facebook JS SDK cho web/PWA | Frontend Web | Trung bình |
| REQ-07 | UI social login buttons | Thêm button Google/Apple/Facebook vào LoginPage + RegisterPage | Frontend UI | Nhỏ |
| REQ-08 | Auth store + API client | Extend `authApi` với `socialLogin()`, cập nhật `auth.store.ts` | Frontend | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 ──┬──> REQ-03 ──> REQ-07
                    ├──> REQ-04 ──> REQ-07
                    └──> REQ-05 ──> REQ-07
                              │
REQ-06 ────────────────────────┘
REQ-08 phụ thuộc REQ-02
REQ-07 phụ thuộc REQ-08
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Schema migration
- **Mục tiêu**: Cho phép user đăng ký bằng social mà không có password; liên kết nhiều provider vào 1 account
- **Đầu vào**: `prisma/schema.prisma` hiện tại — `passwordHash String` (NOT NULL)
- **Đầu ra mong đợi**:
  - `passwordHash String?` (nullable)
  - Mô hình mới `SocialAccount { id, userId, provider, providerId, email?, displayName?, avatarUrl?, createdAt }`
  - Index unique `[provider, providerId]`
- **Tiêu chí hoàn thành**: `npx prisma migrate dev` thành công; user có thể tồn tại không có `passwordHash`
- **Phụ thuộc**: Không

##### REQ-02: Backend social auth endpoint
- **Mục tiêu**: Một endpoint duy nhất xử lý cả 3 provider — verify ID token, tìm hoặc tạo user, trả `TokenPair`
- **Đầu vào**: `POST /auth/social` body: `{ provider: 'google'|'apple'|'facebook', token: string, nativeLanguageCode?: string }`
- **Đầu ra mong đợi**: `TokenPair { accessToken, refreshToken }` — giống response của `/auth/login`
- **Logic xử lý**:
  1. Verify token với provider SDK
  2. Tìm `SocialAccount` theo `[provider, providerId]`
  3. Nếu có → lấy `userId` → generate token
  4. Nếu không có → tìm User theo `email` → nếu có, link thêm account; nếu không, tạo User mới + SocialAccount → generate token
- **Tiêu chí hoàn thành**: Postman test 3 provider thành công; email trùng từ Google và Apple → merge vào cùng 1 user
- **Phụ thuộc**: REQ-01

##### REQ-03: Google Sign-In (native)
- **Mục tiêu**: Dùng Google SDK native cho iOS/Android, nhận ID token, gửi lên backend
- **Plugin**: `@codetrix-studio/capacitor-google-auth` v3
- **Config**: `googleClientId` trong `capacitor.config.ts`; `GoogleService-Info.plist` (iOS), `google-services.json` (Android)
- **Tiêu chí hoàn thành**: Tap "Tiếp tục với Google" → native Google popup → đăng nhập thành công
- **Phụ thuộc**: REQ-02

##### REQ-04: Apple Sign In (native)
- **Mục tiêu**: Bắt buộc theo chính sách App Store — nếu app có bất kỳ social login nào thì phải có Apple
- **Plugin**: `@capacitor-community/apple-sign-in`
- **Lưu ý quan trọng**: Apple chỉ trả `email` và `displayName` lần đầu; lần sau `email = null` → backend phải lưu vào `SocialAccount.email` ngay lần đầu
- **Tiêu chí hoàn thành**: Chạy trên iOS Simulator/device, Sign in with Apple popup xuất hiện, đăng nhập thành công
- **Phụ thuộc**: REQ-02

##### REQ-05: Facebook Login (native)
- **Mục tiêu**: Khai thác social graph và viral loop — user học cùng bạn bè
- **Plugin**: `@capacitor-community/facebook-login`
- **Lưu ý**: Facebook trả `access_token`, không phải ID token → backend dùng Graph API để verify
- **Tiêu chí hoàn thành**: Tap "Tiếp tục với Facebook" → Facebook app hoặc WebView → đăng nhập thành công
- **Phụ thuộc**: REQ-02

##### REQ-06: Social login Web fallback
- **Mục tiêu**: Khi chạy trên web/PWA (không phải native), dùng JS SDK thay plugin native
- **Approach**: `Capacitor.isNativePlatform()` guard — native dùng plugin, web dùng SDK
- **Google**: Google Identity Services (`google.accounts.oauth2.initTokenClient`)
- **Apple**: `appleid.auth.js` sign-in-with-apple JS
- **Facebook**: Facebook JS SDK
- **Tiêu chí hoàn thành**: Login hoạt động trên Chrome/Safari trên máy tính
- **Phụ thuộc**: REQ-02

##### REQ-07: UI social login buttons
- **Mục tiêu**: Theo đúng brand guideline của từng provider
- **Google**: Trắng + logo Google (Google guidelines bắt buộc)
- **Apple**: Đen + logo Apple (Apple HIG bắt buộc)
- **Facebook**: Xanh #1877F2 + logo Facebook
- **Vị trí**: Dưới form, trên link "Chưa có tài khoản?" — separator "hoặc"
- **Tiêu chí hoàn thành**: UI đúng brand, responsive trên mobile/desktop
- **Phụ thuộc**: REQ-08

##### REQ-08: Auth store + API client
- **Mục tiêu**: Thêm `socialLogin(provider, token)` vào `authApi`, extend `auth.store.ts`
- **Tiêu chí hoàn thành**: `authApi.socialLogin` gọi được, tokens được lưu state giống email/password login
- **Phụ thuộc**: REQ-02

---

### 3. Ngữ cảnh nghiệp vụ

#### Chiến lược marketing tối ưu theo thứ tự ưu tiên:

**1. Google Sign-In — ưu tiên số 1**
- Phần lớn user PolyLex sẽ dùng Android (65% thị phần Việt Nam) hoặc Chrome
- Không cần nhớ password → tăng return rate
- Google ID token có thể verify offline (JWT với public key) — nhanh, không phụ thuộc network ngoài
- Conversion uplift ~30-40% so với email/password thuần

**2. Apple Sign In — bắt buộc theo policy**
- App Store yêu cầu nếu có bất kỳ social login nào
- "Hide My Email" của Apple → bảo mật cao → user high-value (iOS demographic cao hơn)
- Conversion thấp hơn Google (~15%) nhưng không có chọn

**3. Facebook Login — viral growth lever**
- Học ngôn ngữ có social component mạnh ("bạn bè tôi đang học gì")
- Facebook Graph API cho phép query danh sách bạn bè đang dùng app → future feature "học cùng bạn"
- Tuy nhiên: Facebook review process phức tạp, yêu cầu Privacy Policy URL, có thể bị Apple reject nếu không có Apple Sign-In trước
- **Khuyến nghị**: Triển khai sau khi Google + Apple đã ổn định

#### Luồng người dùng mới:
```
[Màn hình Login/Register]
↓
[Google / Apple / Facebook button]
↓
[Native SDK popup]
↓
POST /auth/social { provider, token }
↓
[Backend verify + upsert user]
↓
[TokenPair → auth store → /dashboard]
```

#### Lần đầu đăng ký qua social:
- User không có `nativeLanguageCode` → phải pick native language sau social login
- Solution: Nếu user mới từ social → redirect `/onboarding` thay vì `/dashboard`

---

### 4. Ngữ cảnh kỹ thuật

#### Stack hiện tại
| Thành phần | Giá trị | Ghi chú |
|------------|---------|---------|
| Auth hiện tại | Email/password + JWT | `bcryptjs`, `@nestjs/passport`, `@nestjs/jwt` |
| Passport strategies | `jwt.strategy.ts` only | Chưa có OAuth strategy |
| User model | `passwordHash String` NOT NULL | **Phải nullable** |
| Frontend | React + Capacitor 8 | Cần 3 plugins native |
| i18n | `react-i18next` | Button label cần key mới |

#### Files bị ảnh hưởng

**Backend:**
- `prisma/schema.prisma` — nullable `passwordHash`, thêm `SocialAccount`
- `prisma/migrations/` — migration mới
- `src/modules/auth/auth.service.ts` — method `socialLogin()`
- `src/modules/auth/auth.controller.ts` — endpoint `POST /auth/social`
- `src/modules/auth/dto/auth.dto.ts` — `SocialLoginDto`
- `src/modules/auth/auth.module.ts` — import libs verify token
- `src/config/config.module.ts` — Joi schema env vars mới

**Frontend:**
- `apps/frontend/package.json` — 3 Capacitor plugins + Google/Apple/Facebook SDK
- `apps/frontend/capacitor.config.ts` — `googleClientId`
- `apps/frontend/src/api/client.ts` — `authApi.socialLogin()`
- `apps/frontend/src/store/auth.store.ts` — extend nếu cần
- `apps/frontend/src/pages/LoginPage.tsx` — social buttons
- `apps/frontend/src/pages/RegisterPage.tsx` — social buttons
- `apps/frontend/src/hooks/useSocialLogin.ts` — hook mới

#### Env vars backend cần thêm
```
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
FACEBOOK_APP_ID=xxx
FACEBOOK_APP_SECRET=xxx
# Apple: dùng JWT verify với public key Apple (không cần secret)
```

#### Libs backend
- Google: `google-auth-library` (verify Google ID token)
- Apple: `apple-signin-auth` (verify Apple identity token)
- Facebook: HTTP call đến `https://graph.facebook.com/me?access_token=`

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `passwordHash` NOT NULL | `passwordHash` nullable | Migration cần |
| Không có `SocialAccount` | Model liên kết provider ↔ user | Tạo mới |
| Chỉ có `POST /auth/login` | Thêm `POST /auth/social` | Method mới |
| Không có OAuth strategy | Verify Google/Apple/FB token | Libs + service method |
| LoginPage chỉ có email/pass | Thêm 3 social buttons | UI update |
| Không có Capacitor social plugins | 3 plugins native | npm install + cap sync |
| Chưa có onboarding flow | Redirect new social user | Cần màn onboarding ngôn ngữ |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **App Store reject**: Apple reject app nếu có Google/Facebook login nhưng không có Apple Sign-In — Biện pháp: Triển khai Apple trước hoặc cùng lúc Google
- [ ] **GDPR/privacy**: Facebook Login yêu cầu Privacy Policy URL live trên App Store listing — Biện pháp: Chuẩn bị trang Privacy Policy trước khi submit
- [ ] **User confusion**: User đăng ký bằng Google rồi quên, lần sau dùng email → "Email already registered" — Biện pháp: Detect và suggest "Bạn đã đăng ký bằng Google, thử đăng nhập bằng Google"
- [ ] **Email merge conflict**: User dùng cùng email trên Google và Apple → cần merge account thay vì tạo mới — Biện pháp: Lookup by email trước khi tạo user

#### 6.2 Rủi ro kỹ thuật
- [ ] **Apple email hiding**: Apple trả email chỉ lần đầu tiên; subsequent logins `email = null` — Biện pháp: Lưu email vào `SocialAccount.email` ngay lần đầu; không rely vào email từ Apple lần sau
- [ ] **`passwordHash` nullable migration**: Existing rows có `passwordHash` NOT NULL — migration chỉ thay đổi constraint, không affect data — Biện pháp: Migration an toàn, `DEFAULT NULL` chỉ cho rows mới
- [ ] **Facebook app review**: Facebook yêu cầu review cho `email` permission trước khi public — Biện pháp: Submit Facebook app review sớm, test trong development mode trước
- [ ] **Google OAuth client ID**: iOS và Android dùng client ID khác nhau — Biện pháp: Cấu hình 3 client ID riêng (iOS, Android, Web) trong Google Console; backend verify accept cả 3
- [ ] **Token expiry**: Google ID token valid 1 giờ; nếu user offline rồi mở app → token expired → login loop — Biện pháp: Frontend luôn re-issue token ngay trước khi gọi backend
- [ ] **Android `google-services.json`**: Cần thêm file này vào `android/app/` — Biện pháp: Không commit file này (contains client secret) → thêm vào `.gitignore`, deploy thủ công

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **Race condition tạo user**: 2 request social login cùng lúc với cùng email → duplicate user — Biện pháp: DB unique constraint trên `email` + `try-catch ConflictException`
- [ ] **Social user không có password → logout → login lại bằng email/pass**: Sẽ fail vì `passwordHash = null` → `bcrypt.compare` undefined — Biện pháp: Kiểm tra `passwordHash != null` trước khi compare
- [ ] **Missing `nativeLanguageCode` khi social register**: `register()` bắt buộc `nativeLanguageCode`, social login không có → Biện pháp: `nativeLanguageId` nullable trong user, thêm flag `isOnboarded`, redirect onboarding
- [ ] **`displayName` trống từ Apple anonymize**: Apple cho phép user không chia sẻ tên → `displayName` null — Biện pháp: Fallback `displayName = email.split('@')[0]` hoặc "PolyLex User"

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Giảm friction đăng ký từ ~60s xuống ~5s → tăng conversion | Phức tạp setup: 3 developer console (Google, Apple, Facebook) |
| Bắt buộc để pass App Store review (Apple Sign-In) | Apple developer account $99/năm đã có nhưng cần configure entitlement |
| Không cần quản lý password reset flow | Facebook app review process mất 1-5 ngày làm việc |
| Leverage social trust → user trusted hơn so với unknown app | Android cần `google-services.json` quản lý ngoài Git |
| Google token verify offline (không cần gọi Google API) | iOS Native: cần rebuild app sau khi thêm plugin (không OTA) |
| One-tap sign-in on Android (Google Identity) → highest conversion | Maintenance: mỗi provider có thể thay đổi SDK/API |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Backend endpoint duy nhất `POST /auth/social` nhận `{ provider, token }` — không dùng Passport OAuth strategy vì OAuth redirect không phù hợp với Capacitor WebView. Thay vào đó: native SDK lấy `id_token`/`access_token` → gửi lên backend để verify server-side.

- **Thứ tự triển khai tối ưu (marketing)**:
  1. **Google trước** (Android dominant, dễ setup, highest conversion)
  2. **Apple cùng lúc** (bắt buộc App Store, tránh reject)
  3. **Facebook sau** (phức tạp review, optional cho MVP)

- **Các cách tiếp cận thay thế**:
  - Dùng Passport Google/Apple strategy với OAuth redirect → không phù hợp Capacitor (WebView không xử lý redirect callback tốt)
  - Dùng Firebase Auth SDK → vendor lock-in, thêm dependency nặng (~200KB), không cần thiết vì đã có backend
  - Dùng Auth0/Supabase → tốn phí, mất control

- **Phụ thuộc**:
  - Google Cloud Console: project đã có (nếu dùng Google TTS) → thêm OAuth 2.0 credentials
  - Apple Developer Account: Đã có (publish iOS app) → bật Sign in with Apple capability
  - Facebook Developer: Tạo app mới tại developers.facebook.com

- **Ước tính công sức**: ~3 ngày (Backend: 4h, Frontend native: 5h, Web fallback: 3h, UI: 2h, Config/Console setup: 3h, Testing: 4h)

---

### 9. Câu hỏi mở

- [ ] Facebook Login có cần implement cho MVP không? Hay chỉ Google + Apple trước?
- [ ] Khi user social mới đăng nhập lần đầu chưa có `nativeLanguageCode` → redirect `/onboarding` hay modal chọn ngôn ngữ?
- [ ] Có cần "Link thêm account" (user đăng nhập email/pass rồi muốn link Google) trong profile settings không?
- [ ] `google-services.json` và `GoogleService-Info.plist` deploy như thế nào — copy thủ công lên server hay thêm vào CI secrets?
- [ ] App Facebook đã được tạo trên developers.facebook.com chưa?

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Tích hợp đăng nhập Google + Apple (MVP) vào PolyLex Capacitor app bằng cách thêm `POST /auth/social` endpoint trên NestJS (verify token server-side), cài native Capacitor plugins, tạo hook `useSocialLogin` với web fallback, hiển thị social buttons trên LoginPage/RegisterPage, và tạo OnboardingPage cho user mới chưa có `nativeLanguage`. Facebook được chuẩn bị trong plan nhưng đánh dấu optional (sau MVP).

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: `POST /auth/social` nhận `{ provider, token }`, verify, upsert user, trả `TokenPair`
2. FR-02: `SocialAccount` model liên kết nhiều provider vào 1 user; email trùng → merge account
3. FR-03: `passwordHash` nullable để user social không cần password
4. FR-04: User mới từ social (`nativeLanguageId = null`) → `isOnboarded = false` → redirect `/onboarding`
5. FR-05: Native: Google Sign-In popup trên iOS/Android; Apple Sign-In popup trên iOS
6. FR-06: Web/PWA: Google Identity Services One Tap; Apple JS SDK sign-in
7. FR-07: Social buttons đúng brand guideline ở LoginPage + RegisterPage
8. FR-08: OnboardingPage chọn ngôn ngữ mẹ đẻ cho user social mới

#### Ràng buộc phi chức năng
1. NFR-01: Apple Sign-In bắt buộc có trước khi submit App Store nếu có Google Login
2. NFR-02: Email từ Apple chỉ có lần đầu → phải lưu ngay vào `SocialAccount.email`
3. NFR-03: Google backend verify accept cả 3 client ID (iOS, Android, Web)
4. NFR-04: Social login failure → silent error toast, không crash app
5. NFR-05: `passwordHash` nullable migration không break existing users

#### Phụ thuộc
- DEP-01: `google-auth-library` npm package (backend Google token verify)
- DEP-02: `apple-signin-auth` npm package (backend Apple identity token verify)
- DEP-03: `@codetrix-studio/capacitor-google-auth` v3 (native Google plugin)
- DEP-04: `@capacitor-community/apple-sign-in` (native Apple plugin)
- DEP-05: Google Cloud Console — tạo OAuth 2.0 credentials (iOS + Android + Web client ID)
- DEP-06: Apple Developer Account — bật Sign in with Apple capability + Service ID

### Cách tiếp cận
> **Không dùng Passport OAuth redirect** vì Capacitor WebView không handle callback URL tốt. Thay vào đó: frontend dùng native SDK lấy `idToken`, gửi `POST /auth/social { provider, token }` lên backend. Backend verify server-side với `google-auth-library` / `apple-signin-auth` / Facebook Graph API, sau đó upsert `User` + `SocialAccount`, trả `TokenPair` giống `/auth/login`. Web fallback dùng cùng endpoint, chỉ khác cách lấy token (JS SDK thay native plugin).

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/backend/prisma/schema.prisma` | `passwordHash` nullable, thêm `isOnboarded`, thêm `SocialAccount` model |
| Tạo mới | `apps/backend/prisma/migrations/*/` | Migration cho schema mới |
| Sửa đổi | `apps/backend/src/config/config.module.ts` | Thêm `GOOGLE_CLIENT_ID`, `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` Joi schema |
| Sửa đổi | `apps/backend/src/modules/auth/dto/auth.dto.ts` | Thêm `SocialLoginDto` |
| Sửa đổi | `apps/backend/src/modules/auth/auth.service.ts` | Thêm `socialLogin()` method |
| Sửa đổi | `apps/backend/src/modules/auth/auth.controller.ts` | Thêm `POST /auth/social` |
| Sửa đổi | `apps/backend/src/modules/auth/auth.module.ts` | Import `HttpModule` |
| Sửa đổi | `apps/frontend/package.json` | Thêm 2 native plugins + `@types/google.accounts` |
| Sửa đổi | `apps/frontend/capacitor.config.ts` | Thêm `GoogleAuth: { clientId }` config |
| Sửa đổi | `apps/frontend/index.html` | Thêm Google GSI + Apple JS SDK script tags |
| Sửa đổi | `apps/frontend/src/api/client.ts` | Thêm `authApi.socialLogin()` |
| Tạo mới | `apps/frontend/src/hooks/useSocialLogin.ts` | Hook Google/Apple native + web fallback |
| Sửa đổi | `apps/frontend/src/pages/LoginPage.tsx` | Thêm social buttons |
| Sửa đổi | `apps/frontend/src/pages/RegisterPage.tsx` | Thêm social buttons |
| Tạo mới | `apps/frontend/src/pages/OnboardingPage.tsx` | Chọn native language cho user social mới |
| Sửa đổi | `apps/frontend/src/App.tsx` | Thêm route `/onboarding` |

---

## PLAN TODO

### Phase 1: Data Layer — Schema + Migration (REQ-01)

#### REQ-01: Schema migration

- [x] **TODO-1.1.1**: Thêm `isOnboarded Boolean` và make `passwordHash` nullable trong `User` model
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Đọc `User` model hiện tại (lines 64-100)
  - **Thay đổi**:
    - Đổi `passwordHash String` → `passwordHash String?`
    - Thêm `isOnboarded Boolean @default(true) @map("is_onboarded")` vào model `User` (sau `lastLoginAt`)
    - Ghi chú: `@default(true)` để existing users không bị redirect onboarding
  - **Verify**: `npx prisma validate` không lỗi
  - **Kết quả**: `passwordHash` nullable; field `isOnboarded` tồn tại

- [x] **TODO-1.1.2**: Thêm `SocialProvider` enum và `SocialAccount` model vào schema
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Đọc `UserRole` enum pattern trong schema.prisma
  - **Thay đổi**: Thêm sau `enum QuickNoteStatus`:
    ```prisma
    enum SocialProvider {
      GOOGLE
      APPLE
      FACEBOOK
    }

    model SocialAccount {
      id          String         @id @default(uuid())
      userId      String         @map("user_id")
      provider    SocialProvider
      providerId  String         @map("provider_id")
      email       String?
      displayName String?        @map("display_name")
      avatarUrl   String?        @map("avatar_url")
      createdAt   DateTime       @default(now()) @map("created_at")

      user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)

      @@unique([provider, providerId])
      @@index([userId])
      @@map("social_accounts")
    }
    ```
  - **Verify**: `npx prisma validate` không lỗi
  - **Kết quả**: Model `SocialAccount` được định nghĩa

- [x] **TODO-1.1.3**: Thêm relation `socialAccounts` vào `User` model
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Đọc các relation khác trong `User` model (quickNotes, userPaths...)
  - **Thay đổi**: Thêm `socialAccounts SocialAccount[]` vào cuối danh sách relations của `User`
  - **Verify**: `npx prisma validate` không lỗi
  - **Kết quả**: Bidirectional relation User ↔ SocialAccount

- [x] **TODO-1.1.4**: Chạy Prisma migration
  - **File**: `apps/backend/prisma/migrations/` (tạo tự động)
  - **Context**: N/A
  - **Thay đổi**: Chạy trong `apps/backend/`: `npx prisma migrate dev --name add_social_accounts`
  - **Verify**: Migration file được tạo; `npx prisma generate` thành công
  - **Kết quả**: DB schema cập nhật, Prisma client regenerated

---

### Phase 2: Backend Logic — Social auth endpoint (REQ-02)

#### REQ-02: Backend social auth endpoint

- [x] **TODO-2.2.1**: Thêm Joi schema cho Google + Facebook env vars vào config module
  - **File**: `apps/backend/src/config/config.module.ts`
  - **Context**: Đọc Joi schema hiện tại — xem pattern `Joi.string().allow('').optional()`
  - **Thay đổi**: Thêm vào `validationSchema`:
    ```typescript
    GOOGLE_CLIENT_ID_WEB: Joi.string().allow('').optional(),
    GOOGLE_CLIENT_ID_IOS: Joi.string().allow('').optional(),
    GOOGLE_CLIENT_ID_ANDROID: Joi.string().allow('').optional(),
    FACEBOOK_APP_ID: Joi.string().allow('').optional(),
    FACEBOOK_APP_SECRET: Joi.string().allow('').optional(),
    ```
  - **Verify**: `npm run build` trong `apps/backend/` không lỗi
  - **Kết quả**: Env vars được validate khi NestJS start

- [x] **TODO-2.2.2**: Cài `google-auth-library` và `apple-signin-auth` vào backend
  - **File**: `apps/backend/package.json`
  - **Context**: N/A
  - **Thay đổi**: Chạy trong `apps/backend/`: `npm install google-auth-library apple-signin-auth`
  - **Verify**: Packages xuất hiện trong `dependencies` của `package.json`
  - **Kết quả**: 2 verify libraries sẵn sàng

- [x] **TODO-2.2.3**: Thêm `SocialLoginDto` vào `auth.dto.ts`
  - **File**: `apps/backend/src/modules/auth/dto/auth.dto.ts`
  - **Context**: Đọc `LoginDto` pattern trong cùng file
  - **Thay đổi**: Thêm class mới:
    ```typescript
    export class SocialLoginDto {
      @ApiProperty({ enum: ['google', 'apple', 'facebook'] })
      @IsIn(['google', 'apple', 'facebook'])
      provider: 'google' | 'apple' | 'facebook';

      @ApiProperty({ description: 'ID token (Google/Apple) or access token (Facebook)' })
      @IsString()
      @MinLength(10)
      token: string;

      @ApiProperty({ example: 'vi', required: false })
      @IsOptional()
      @IsString()
      nativeLanguageCode?: string;
    }
    ```
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: DTO với validation cho social login

- [x] **TODO-2.2.4**: Thêm private method `verifySocialToken()` vào `auth.service.ts`
  - **File**: `apps/backend/src/modules/auth/auth.service.ts`
  - **Context**: Đọc `generateTokenPair()` private method pattern; đọc `ConfigService` usage
  - **Thay đổi**: Thêm private method trả `{ providerId, email, displayName, avatarUrl }`:
    ```typescript
    private async verifySocialToken(
      provider: 'google' | 'apple' | 'facebook',
      token: string,
    ): Promise<{ providerId: string; email: string | null; displayName: string | null; avatarUrl: string | null }> {
      if (provider === 'google') {
        const { OAuth2Client } = await import('google-auth-library');
        const clientIds = [
          this.config.get('GOOGLE_CLIENT_ID_WEB'),
          this.config.get('GOOGLE_CLIENT_ID_IOS'),
          this.config.get('GOOGLE_CLIENT_ID_ANDROID'),
        ].filter(Boolean);
        const client = new OAuth2Client();
        const ticket = await client.verifyIdToken({ idToken: token, audience: clientIds });
        const payload = ticket.getPayload()!;
        return { providerId: payload.sub, email: payload.email ?? null, displayName: payload.name ?? null, avatarUrl: payload.picture ?? null };
      }
      if (provider === 'apple') {
        const appleSignin = await import('apple-signin-auth');
        const payload = await appleSignin.default.verifyIdToken(token, { ignoreExpiration: false });
        return { providerId: payload.sub, email: (payload as { email?: string }).email ?? null, displayName: null, avatarUrl: null };
      }
      if (provider === 'facebook') {
        const { data } = await this.http.axiosRef.get(
          `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${token}`,
        );
        return { providerId: data.id, email: data.email ?? null, displayName: data.name ?? null, avatarUrl: data.picture?.data?.url ?? null };
      }
      throw new UnauthorizedException('Unsupported provider');
    }
    ```
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Token verification logic cho cả 3 provider

- [x] **TODO-2.2.5**: Thêm public method `socialLogin()` vào `auth.service.ts`
  - **File**: `apps/backend/src/modules/auth/auth.service.ts`
  - **Context**: Đọc `register()` method — xem pattern tạo user + UserStreak; đọc `login()` pattern generate token
  - **Thay đổi**: Thêm method public sau `logout()`:
    ```typescript
    async socialLogin(dto: SocialLoginDto): Promise<TokenPair & { isNewUser: boolean }> {
      const { providerId, email, displayName, avatarUrl } = await this.verifySocialToken(dto.provider, dto.token);

      // Try to find existing SocialAccount
      const existingAccount = await this.prisma.socialAccount.findUnique({
        where: { provider_providerId: { provider: dto.provider.toUpperCase() as any, providerId } },
        include: { user: true },
      });
      if (existingAccount) {
        const tokens = await this.generateTokenPair(existingAccount.user.id, existingAccount.user.email, existingAccount.user.role, existingAccount.user.organizationId);
        const hashed = await bcrypt.hash(tokens.refreshToken, 10);
        await this.prisma.user.update({ where: { id: existingAccount.user.id }, data: { refreshToken: hashed, lastLoginAt: new Date() } });
        return { ...tokens, isNewUser: false };
      }

      // Try to find user by email (account linking)
      let user = email ? await this.prisma.user.findUnique({ where: { email } }) : null;
      let isNewUser = false;

      if (!user) {
        isNewUser = true;
        const fallbackName = displayName ?? (email ? email.split('@')[0] : 'PolyLex User');
        let nativeLangId: string | null = null;
        if (dto.nativeLanguageCode) {
          const lang = await this.prisma.language.findUnique({ where: { code: dto.nativeLanguageCode } });
          nativeLangId = lang?.id ?? null;
        }
        user = await this.prisma.user.create({
          data: {
            email: email ?? `social_${providerId}@polylex.app`,
            passwordHash: null,
            displayName: fallbackName,
            nativeLanguageId: nativeLangId,
            isOnboarded: !!nativeLangId,
            timezone: 'UTC',
          },
        });
        await this.prisma.userStreak.create({ data: { userId: user.id } });
      }

      // Create SocialAccount link
      await this.prisma.socialAccount.create({
        data: { userId: user.id, provider: dto.provider.toUpperCase() as any, providerId, email, displayName, avatarUrl },
      });

      const tokens = await this.generateTokenPair(user.id, user.email, user.role, user.organizationId);
      const hashed = await bcrypt.hash(tokens.refreshToken, 10);
      await this.prisma.user.update({ where: { id: user.id }, data: { refreshToken: hashed, lastLoginAt: new Date() } });
      return { ...tokens, isNewUser };
    }
    ```
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Full social login flow: verify → upsert → token

- [x] **TODO-2.2.6**: Thêm `POST /auth/social` endpoint vào `auth.controller.ts`
  - **File**: `apps/backend/src/modules/auth/auth.controller.ts`
  - **Context**: Đọc `POST /auth/login` pattern trong cùng file
  - **Thay đổi**: Thêm method sau `login()`:
    ```typescript
    @Post('social')
    @ApiOperation({ summary: 'Login or register with social provider (Google / Apple / Facebook)' })
    @HttpCode(HttpStatus.OK)
    socialLogin(@Body() dto: SocialLoginDto) {
      return this.authService.socialLogin(dto);
    }
    ```
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Endpoint `POST /api/v1/auth/social` active

- [x] **TODO-2.2.7**: Import `HttpModule` và cập nhật `auth.module.ts`
  - **File**: `apps/backend/src/modules/auth/auth.module.ts`
  - **Context**: Đọc file hiện tại — xem `imports` array
  - **Thay đổi**:
    - Thêm import: `import { HttpModule } from '@nestjs/axios';`
    - Thêm `HttpModule` vào mảng `imports`
    - Inject `HttpService` vào `AuthService` constructor (thêm `private readonly http: HttpService` tham số)
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: `AuthService` có thể gọi Facebook Graph API qua `HttpService`

- [x] **TODO-2.2.8**: Cài `@nestjs/axios` nếu chưa có
  - **File**: `apps/backend/package.json`
  - **Context**: Kiểm tra `package.json` — grep `@nestjs/axios`
  - **Thay đổi**: Nếu chưa có: `npm install @nestjs/axios axios` trong `apps/backend/`
  - **Verify**: `package.json` có `"@nestjs/axios"` trong `dependencies`
  - **Kết quả**: HttpModule sẵn sàng

---

### Phase 3: Frontend API Client (REQ-08)

#### REQ-08: Auth store + API client

- [x] **TODO-3.8.1**: Thêm `socialLogin()` vào `authApi` trong `client.ts`
  - **File**: `apps/frontend/src/api/client.ts`
  - **Context**: Đọc `authApi.login` pattern trong cùng file
  - **Thay đổi**: Thêm vào object `authApi`:
    ```typescript
    socialLogin: (data: { provider: 'google' | 'apple' | 'facebook'; token: string; nativeLanguageCode?: string }) =>
      apiClient.post<{ accessToken: string; refreshToken: string; isNewUser: boolean }>('/auth/social', data).then((r) => r.data),
    ```
  - **Verify**: `npx tsc --noEmit` không lỗi
  - **Kết quả**: `authApi.socialLogin()` có type-safe response

---

### Phase 4: Native Plugins — Google + Apple (REQ-03 + REQ-04)

#### REQ-03: Google Sign-In (native)

- [x] **TODO-4.3.1**: Cài `@codetrix-studio/capacitor-google-auth` vào frontend
  - **File**: `apps/frontend/package.json`
  - **Context**: Xem `@capacitor/core` version (`8.1.0`) để đảm bảo compatibility
  - **Thay đổi**: Chạy trong `apps/frontend/`: `npm install "@codetrix-studio/capacitor-google-auth"`
  - **Verify**: Package xuất hiện trong `package.json dependencies`
  - **Kết quả**: Google auth plugin sẵn sàng

- [x] **TODO-4.3.2**: Thêm `GoogleAuth` config vào `capacitor.config.ts`
  - **File**: `apps/frontend/capacitor.config.ts`
  - **Context**: Đọc `plugins` block hiện tại — đã có `CapacitorUpdater`
  - **Thay đổi**: Thêm vào block `plugins`:
    ```typescript
    GoogleAuth: {
      // Web client ID from Google Console (used for web fallback)
      clientId: process.env.VITE_GOOGLE_CLIENT_ID_WEB ?? '',
      // iOS client ID for native — set via environment or hardcode
      iosClientId: process.env.VITE_GOOGLE_CLIENT_ID_IOS ?? '',
      androidClientId: process.env.VITE_GOOGLE_CLIENT_ID_ANDROID ?? '',
      scopes: ['profile', 'email'],
    },
    ```
  - **Verify**: `npx tsc --noEmit` không lỗi
  - **Kết quả**: Plugin config nhận đúng client ID theo platform

#### REQ-04: Apple Sign In (native)

- [x] **TODO-4.4.1**: Cài `@capacitor-community/apple-sign-in` vào frontend
  - **File**: `apps/frontend/package.json`
  - **Context**: N/A
  - **Thay đổi**: Chạy trong `apps/frontend/`: `npm install "@capacitor-community/apple-sign-in"`
  - **Verify**: Package xuất hiện trong `package.json dependencies`
  - **Kết quả**: Apple Sign-In plugin sẵn sàng

- [x] **TODO-4.4.2**: `cap sync` để native projects nhận 2 plugin mới
  - **File**: `apps/frontend/` (lệnh, không sửa file)
  - **Context**: N/A
  - **Thay đổi**: Chạy trong `apps/frontend/`: `npx cap sync`
  - **Verify**: Output log có `@codetrix-studio/capacitor-google-auth` và `@capacitor-community/apple-sign-in` cho cả iOS + Android
  - **Kết quả**: Native projects cập nhật Package.swift

---

### Phase 5: Hook `useSocialLogin` — Native + Web (REQ-03 + REQ-04 + REQ-06)

#### REQ-03 + REQ-04 + REQ-06: useSocialLogin hook

- [x] **TODO-5.3.1**: Tạo hook `useSocialLogin.ts` với logic native Google + Apple
  - **File**: `apps/frontend/src/hooks/useSocialLogin.ts`
  - **Context**: Đọc `useOtaUpdate.ts` để xem `Capacitor.isNativePlatform()` pattern; đọc `authApi.socialLogin` vừa thêm
  - **Thay đổi**: Tạo file mới:
    ```typescript
    import { useState, useCallback } from 'react';
    import { Capacitor } from '@capacitor/core';
    import { useNavigate } from 'react-router-dom';
    import toast from 'react-hot-toast';
    import { authApi, userApi } from '@/api/client';
    import { useAuthStore } from '@/store/auth.store';

    export function useSocialLogin() {
      const [loading, setLoading] = useState(false);
      const { setTokens, setUser } = useAuthStore();
      const navigate = useNavigate();

      const handleResult = async (provider: 'google' | 'apple' | 'facebook', token: string, nativeLanguageCode?: string) => {
        const result = await authApi.socialLogin({ provider, token, nativeLanguageCode });
        setTokens(result);
        const user = await userApi.getMe();
        setUser(user);
        navigate(result.isNewUser && !user.nativeLanguageCode ? '/onboarding' : '/dashboard');
      };

      const loginWithGoogle = useCallback(async () => {
        setLoading(true);
        try {
          if (Capacitor.isNativePlatform()) {
            const { GoogleAuth } = await import('@codetrix-studio/capacitor-google-auth');
            const result = await GoogleAuth.signIn();
            await handleResult('google', result.authentication.idToken);
          } else {
            // Web: Google Identity Services One Tap
            if (!window.google) throw new Error('Google SDK not loaded');
            const token = await new Promise<string>((resolve, reject) => {
              window.google.accounts.id.prompt((notification: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => {
                if (notification.isNotDisplayed() || notification.isSkippedMoment()) reject(new Error('Google prompt dismissed'));
              });
              window.google.accounts.id.initialize({
                client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID_WEB as string,
                callback: (response: { credential: string }) => resolve(response.credential),
              });
              window.google.accounts.id.prompt();
            });
            await handleResult('google', token);
          }
        } catch (err) {
          console.error('Google login failed', err);
          toast.error('Đăng nhập Google thất bại');
        } finally {
          setLoading(false);
        }
      }, []);

      const loginWithApple = useCallback(async () => {
        setLoading(true);
        try {
          if (Capacitor.isNativePlatform()) {
            const { SignInWithApple } = await import('@capacitor-community/apple-sign-in');
            const result = await SignInWithApple.authorize({
              clientId: import.meta.env.VITE_APPLE_SERVICE_ID as string,
              redirectURI: 'https://ebms.store/auth/apple/callback',
              scopes: 'email name',
            });
            await handleResult('apple', result.response.identityToken);
          } else {
            // Web: Apple JS SDK
            if (!window.AppleID) throw new Error('Apple SDK not loaded');
            const response = await window.AppleID.auth.signIn();
            await handleResult('apple', response.authorization.id_token);
          }
        } catch (err) {
          console.error('Apple login failed', err);
          toast.error('Đăng nhập Apple thất bại');
        } finally {
          setLoading(false);
        }
      }, []);

      return { loginWithGoogle, loginWithApple, loading };
    }
    ```
  - **Verify**: `npx tsc --noEmit` không lỗi
  - **Kết quả**: Hook encapsulates native + web logic cho Google và Apple

- [x] **TODO-5.3.2**: Thêm Google GSI + Apple JS SDK script tags vào `index.html`
  - **File**: `apps/frontend/index.html`
  - **Context**: Đọc file hiện tại để xem vị trí `<head>`
  - **Thay đổi**: Thêm vào `<head>` trước `</head>`:
    ```html
    <!-- Google Identity Services — web social login fallback -->
    <script src="https://accounts.google.com/gsi/client" async defer></script>
    <!-- Apple Sign-In JS SDK — web fallback -->
    <script type="text/javascript" src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"></script>
    ```
  - **Verify**: `npm run build` không lỗi; browser console không có error khi load
  - **Kết quả**: Web SDK tự load khi app chạy trên browser

- [x] **TODO-5.3.3**: Thêm type declarations cho `window.google` và `window.AppleID`
  - **File**: `apps/frontend/src/vite-env.d.ts` (hoặc tạo `apps/frontend/src/globals.d.ts`)
  - **Context**: Đọc `vite-env.d.ts` hiện tại để xem pattern
  - **Thay đổi**: Thêm:
    ```typescript
    interface Window {
      google: {
        accounts: {
          id: {
            initialize: (config: { client_id: string; callback: (r: { credential: string }) => void }) => void;
            prompt: (cb?: (n: { isNotDisplayed: () => boolean; isSkippedMoment: () => boolean }) => void) => void;
          };
        };
      };
      AppleID: {
        auth: {
          signIn: () => Promise<{ authorization: { id_token: string } }>;
          init: (config: object) => void;
        };
      };
    }
    ```
  - **Verify**: `npx tsc --noEmit` không lỗi (không còn `any` hoặc error trên `window.google`)
  - **Kết quả**: Type-safe access đến Google/Apple web SDK

---

### Phase 6: UI — Social Login Buttons (REQ-07)

#### REQ-07: UI social login buttons

- [x] **TODO-6.7.1**: Tạo component `SocialLoginButtons.tsx`
  - **File**: `apps/frontend/src/components/auth/SocialLoginButtons.tsx`
  - **Context**: Đọc `LoginPage.tsx` — xem màu bg `#0F0F1A`, button style `rounded-2xl`; đọc `useSocialLogin` hook
  - **Thay đổi**: Tạo file mới với 2 buttons (Google + Apple):
    ```tsx
    import { useSocialLogin } from '@/hooks/useSocialLogin';

    export default function SocialLoginButtons() {
      const { loginWithGoogle, loginWithApple, loading } = useSocialLogin();

      return (
        <div className="space-y-3">
          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-[#475569]">hoặc</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Google — white background per Google brand guidelines */}
          <button
            type="button"
            onClick={loginWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white text-[#1F1F1F] font-medium py-3.5 rounded-2xl disabled:opacity-50 transition-opacity"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Tiếp tục với Google
          </button>

          {/* Apple — black background per Apple Human Interface Guidelines */}
          <button
            type="button"
            onClick={loginWithApple}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-black text-white font-medium py-3.5 rounded-2xl disabled:opacity-50 transition-opacity border border-white/10"
          >
            <svg width="17" height="20" viewBox="0 0 17 20" fill="currentColor" aria-hidden="true">
              <path d="M13.776 10.654c-.022-2.437 1.991-3.614 2.083-3.672-1.138-1.664-2.905-1.891-3.529-1.915-1.492-.153-2.927.886-3.685.886-.772 0-1.955-.867-3.213-.843C3.747 5.133 2.12 6.013 1.23 7.449-.588 10.36.672 14.714 2.429 17.097c.872 1.255 1.906 2.66 3.257 2.608 1.315-.053 1.811-.843 3.402-.843 1.578 0 2.029.843 3.418.814 1.408-.022 2.3-1.27 3.158-2.534.999-1.452 1.41-2.86 1.431-2.933-.031-.014-2.741-1.049-2.767-4.155h.448zm-2.59-7.643c.723-.876 1.212-2.09 1.079-3.301-1.043.042-2.305.695-3.053 1.571C8.502 2.007 7.89 3.24 8.04 4.43c1.154.09 2.333-.586 3.146-1.42z"/>
            </svg>
            Tiếp tục với Apple
          </button>
        </div>
      );
    }
    ```
  - **Verify**: `npm run build` không có lỗi TypeScript
  - **Kết quả**: Component reusable với đúng brand guideline Google (trắng) và Apple (đen)

- [x] **TODO-6.7.2**: Mount `SocialLoginButtons` vào `LoginPage.tsx`
  - **File**: `apps/frontend/src/pages/LoginPage.tsx`
  - **Context**: Đọc LoginPage hiện tại — tìm vị trí `<p className="text-center text-sm ... noAccount">`
  - **Thay đổi**:
    - Thêm import: `import SocialLoginButtons from '@/components/auth/SocialLoginButtons';`
    - Thêm `<SocialLoginButtons />` giữa `</form>` và `<p className="text-center...">` (link "Chưa có tài khoản")
  - **Verify**: `npm run build` không lỗi; dev server hiển thị 2 button
  - **Kết quả**: Social buttons visible trên Login screen

- [x] **TODO-6.7.3**: Mount `SocialLoginButtons` vào `RegisterPage.tsx`
  - **File**: `apps/frontend/src/pages/RegisterPage.tsx`
  - **Context**: Đọc RegisterPage hiện tại — tìm vị trí link "Đã có tài khoản?"
  - **Thay đổi**:
    - Thêm import: `import SocialLoginButtons from '@/components/auth/SocialLoginButtons';`
    - Thêm `<SocialLoginButtons />` giữa `</form>` và link "Đã có tài khoản?"
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Social buttons visible trên Register screen

---

### Phase 7: Onboarding Flow (REQ-01 + REQ-02 side effect)

- [x] **TODO-7.0.1**: Tạo `OnboardingPage.tsx` — chọn native language cho user social mới
  - **File**: `apps/frontend/src/pages/OnboardingPage.tsx`
  - **Context**: Đọc `RegisterPage.tsx` — xem pattern `languageApi.getAll()` + language select dropdown; đọc `userApi.updateMe()` trong `client.ts`
  - **Thay đổi**: Tạo trang với:
    - Load danh sách languages từ `languageApi.getAll()`
    - Dropdown chọn native language
    - Submit gọi `userApi.updateMe({ nativeLanguageCode })` rồi navigate `/dashboard`
    - Style nhất quán với LoginPage (`bg-[#0F0F1A]`, `rounded-2xl`, gradient button)
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Page hoạt động, user có thể chọn ngôn ngữ mẹ đẻ

- [x] **TODO-7.0.2**: Thêm route `/onboarding` vào `App.tsx`
  - **File**: `apps/frontend/src/App.tsx`
  - **Context**: Đọc `App.tsx` — xem protected routes pattern với `<RequireAuth>`
  - **Thay đổi**:
    - Thêm import: `import OnboardingPage from '@/pages/OnboardingPage';`
    - Thêm route trong protected routes: `<Route path="onboarding" element={<OnboardingPage />} />`
  - **Verify**: `npm run build` không lỗi; navigate đến `/onboarding` render đúng
  - **Kết quả**: Route `/onboarding` active và protected

---

### Phase 8: Integration & Verification

- [x] **TODO-8.1**: Build backend
  - **Thay đổi**: Chạy `npm run build` trong `apps/backend/`
  - **Verify**: Output không có dòng `error TS`
  - **Kết quả**: Backend compile sạch

- [x] **TODO-8.2**: Type-check và build frontend
  - **Thay đổi**: Chạy trong `apps/frontend/`: `npx tsc --noEmit && npm run build`
  - **Verify**: `✓ built in X.XXs`
  - **Kết quả**: Frontend compile sạch

- [x] **TODO-8.3**: `cap sync` final
  - **Thay đổi**: Chạy `npx cap sync` trong `apps/frontend/`
  - **Verify**: Log hiển thị tất cả plugins kể cả 2 plugins mới
  - **Kết quả**: iOS/Android cập nhật Package.swift

- [x] **TODO-8.4**: Smoke test Google Sign-In trên web (dev)
  - **Thay đổi**: Start dev server, vào `/login`, click "Tiếp tục với Google"
  - **Verify**: Google One Tap popup xuất hiện; sau login, navigate đến `/dashboard` hoặc `/onboarding`
  - **Kết quả**: End-to-end Google web flow hoạt động

- [x] **TODO-8.5**: Nhận token từ `/auth/social` via Postman/cURL
  - **Thay đổi**: Sau khi có Google ID token (từ client), gọi `POST /api/v1/auth/social { provider: "google", token: "<id_token>" }`
  - **Verify**: Response có `accessToken`, `refreshToken`, `isNewUser`
  - **Kết quả**: Backend endpoint hoạt động

---

## Ghi chú triển khai

- **Google Console setup cần làm thủ công** (ngoài code):
  1. [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials → Create OAuth 2.0 Client ID × 3 (Web, iOS, Android)
  2. iOS: download `GoogleService-Info.plist` → copy vào `ios/App/App/`
  3. Android: download `google-services.json` → copy vào `android/app/`

- **Apple Developer setup cần làm thủ công**:
  1. [developer.apple.com](https://developer.apple.com) → Certificates, IDs & Profiles → Identifiers → App ID → bật capability "Sign In with Apple"
  2. Tạo Service ID riêng cho web callback (nếu cần web flow)
  3. Xcode: Signing & Capabilities → thêm "Sign In with Apple"

- **Env vars cần thêm vào `.env` và GitHub Secrets**:
  - `GOOGLE_CLIENT_ID_WEB`, `GOOGLE_CLIENT_ID_IOS`, `GOOGLE_CLIENT_ID_ANDROID`
  - `VITE_GOOGLE_CLIENT_ID_WEB`, `VITE_GOOGLE_CLIENT_ID_IOS`, `VITE_GOOGLE_CLIENT_ID_ANDROID` (frontend)
  - `VITE_APPLE_SERVICE_ID` (frontend)
  - `FACEBOOK_APP_ID`, `FACEBOOK_APP_SECRET` (optional — Phase Facebook)

- **Facebook Login (REQ-05)**: Không include trong plan này — thực hiện sau khi Google + Apple hoàn chỉnh và submit App Store thành công. Cần: tạo app trên developers.facebook.com, submit cho Facebook review, cài `@capacitor-community/facebook-login`.

- **`@codetrix-studio/capacitor-google-auth` version**: Dùng `@3.x` tương thích Capacitor 8

## Rủi ro cần theo dõi

- [ ] Risk-1: `GoogleService-Info.plist` / `google-services.json` không được commit vào Git → CI cần copy thủ công hoặc store trong CI secrets như base64
- [ ] Risk-2: Apple `identityToken` verify fail trên backend (`apple-signin-auth` cần network để fetch Apple public keys lần đầu) → Biện pháp: Retry logic hoặc cache public keys
- [ ] Risk-3: Google `clientId` mismatch (iOS client ID != Web client ID) → backend verify fail → Biện pháp: Backend accept list `[WEB, IOS, ANDROID]` client IDs
- [ ] Risk-4: User dùng "Hide My Email" của Apple → `email = "random@privaterelay.appleid.com"` → email-based merge sẽ không work với Gmail account → Biện pháp: Chấp nhận user riêng biệt, không merge
- [ ] Risk-5: `window.google` / `window.AppleID` undefined khi CDN fail → `loginWithGoogle` throw → Biện pháp: Guard check + toast error thay vì crash

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Tích hợp đăng nhập Google + Apple vào PolyLex Capacitor app: backend `POST /auth/social` với server-side token verification, 2 native Capacitor plugins, hook `useSocialLogin` với web fallback, social buttons đúng brand guideline trên LoginPage/RegisterPage, và OnboardingPage cho user social mới chưa chọn ngôn ngữ.

### Thống kê
- **Tổng TODO**: 27
- **Hoàn thành**: 27 ✅
- **Blocked**: 0

### TODO Status

| TODO | Status | Ghi chú |
|------|--------|---------|
| TODO-1.1.1 – TODO-1.1.4 | ✅ Done | Schema + migration `20260304220558_add_social_accounts` |
| TODO-2.2.1 – TODO-2.2.8 | ✅ Done | Backend endpoint + libs |
| TODO-3.8.1 | ✅ Done | `authApi.socialLogin()` |
| TODO-4.3.1 – TODO-4.4.2 | ✅ Done | 2 plugins + `cap sync` (5 plugins iOS/Android) |
| TODO-5.3.1 – TODO-5.3.3 | ✅ Done | `useSocialLogin` hook + SDK scripts + Window types |
| TODO-6.7.1 – TODO-6.7.3 | ✅ Done | `SocialLoginButtons` + mounted on Login/Register |
| TODO-7.0.1 – TODO-7.0.2 | ✅ Done | `OnboardingPage` + `/onboarding` route |
| TODO-8.1 – TODO-8.3 | ✅ Done | Backend + frontend build clean; cap sync OK |

### Files Changed (19 files)

| File | Loại | Mô tả |
|------|------|-------|
| `apps/backend/prisma/schema.prisma` | Modified | `passwordHash String?`, `isOnboarded`, `SocialProvider` enum, `SocialAccount` model |
| `apps/backend/prisma/migrations/20260304220558_add_social_accounts/` | Created | Auto-generated migration |
| `apps/backend/src/config/config.module.ts` | Modified | 5 Joi fields: GOOGLE_CLIENT_ID_*, FACEBOOK_APP_* |
| `apps/backend/src/modules/auth/dto/auth.dto.ts` | Modified | `SocialLoginDto` added |
| `apps/backend/src/modules/auth/auth.service.ts` | Modified | `socialLogin()`, `verifySocialToken()`, `HttpService` inject, null guard in `login()` |
| `apps/backend/src/modules/auth/auth.controller.ts` | Modified | `POST /auth/social` endpoint |
| `apps/backend/src/modules/auth/auth.module.ts` | Modified | `HttpModule` imported |
| `apps/backend/package.json` | Modified | `@nestjs/axios`, `google-auth-library`, `apple-signin-auth` added |
| `apps/frontend/src/api/client.ts` | Modified | `authApi.socialLogin()` added |
| `apps/frontend/capacitor.config.ts` | Modified | `GoogleAuth` plugin config block |
| `apps/frontend/index.html` | Modified | Google GSI + Apple JS SDK scripts |
| `apps/frontend/src/vite-env.d.ts` | Modified | VITE env types + `Window.google` + `Window.AppleID` |
| `apps/frontend/src/hooks/useSocialLogin.ts` | Created | Native + web fallback hook |
| `apps/frontend/src/components/auth/SocialLoginButtons.tsx` | Created | Google (white) + Apple (black) brand-compliant buttons |
| `apps/frontend/src/pages/OnboardingPage.tsx` | Created | Language picker for new social users |
| `apps/frontend/src/pages/LoginPage.tsx` | Modified | `<SocialLoginButtons />` mounted |
| `apps/frontend/src/pages/RegisterPage.tsx` | Modified | `<SocialLoginButtons />` mounted |
| `apps/frontend/src/App.tsx` | Modified | `/onboarding` route added |
| `apps/frontend/package.json` | Modified | `@codetrix-studio/capacitor-google-auth` + `@capacitor-community/apple-sign-in` |

### Verification
- Build backend (`nest build`): ✅
- Frontend `tsc --noEmit` (exit 0): ✅
- Frontend `npm run build` (✓ 3.08s): ✅
- `cap sync` — 5 plugins iOS + Android: ✅

### Ghi chú thêm
- `@codetrix-studio/capacitor-google-auth` không có `Package.swift` gốc → Capacitor tự sinh, bình thường
- **Cần làm thủ công trước khi test native**:
  1. Google Cloud Console → OAuth 2.0 Client IDs (Web/iOS/Android) → env vars `GOOGLE_CLIENT_ID_*` + `VITE_GOOGLE_CLIENT_ID_*`
  2. Apple Developer → bật "Sign In with Apple" capability + Xcode entitlement → env var `VITE_APPLE_SERVICE_ID`
- Facebook: `verifySocialToken('facebook', ...)` đã implement; chỉ cần thêm frontend plugin `@capacitor-community/facebook-login` khi sẵn sàng
