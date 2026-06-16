# TICKET-004: Multi-Platform Wrapper — PWA · App Store · Google Play · Zalo Mini App

## Thông tin ticket
| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-004 |
| **Ngày tạo** | 2026-02-27 |
| **Người yêu cầu** | Product Owner |
| **Trạng thái** | Phân tích — Chờ lập kế hoạch |

## Mô tả yêu cầu gốc

Wrap frontend React/Vite hiện tại để có thể build và publish lên **nhiều platform**:
- **PWA** (Progressive Web App) — cài được từ browser
- **Apple App Store** (iOS native)
- **Google Play Store** (Android native)
- **Zalo Mini App**

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-004 |
| **Tiêu đề** | Multi-Platform Wrapper: PWA / iOS / Android / Zalo Mini App |
| **Mục tiêu** | Từ codebase React + Vite hiện tại, tạo artifact có thể deploy lên 4 platform khác nhau với ít duplicate code nhất |
| **Phạm vi** | Frontend (`apps/frontend/`) + build pipeline + một số thay đổi backend (CORS, Zalo OAuth) |
| **Độ ưu tiên** | Trung bình–Cao |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Chuẩn hóa FE Core | Tách API base URL sang env var, đổi storage layer thành pluggable adapter, responsive Layout cho mobile | Frontend | Trung bình |
| REQ-02 | PWA | Thêm Web App Manifest, Service Worker (Workbox), offline cache, install prompt | Frontend | Nhỏ |
| REQ-03 | Capacitor Setup | Tích hợp Capacitor 6, cấu hình iOS/Android project, đổi router sang HashRouter | Frontend/Native | Trung bình |
| REQ-04 | iOS Build & Submit | Build Xcode project, app icons/splash, sign & submit lên App Store Connect | Native/CI | Lớn |
| REQ-05 | Android Build & Submit | Build Gradle project, icons/splash, sign APK/AAB, submit lên Google Play Console | Native/CI | Lớn |
| REQ-06 | Capacitor Storage Adapter | Thay `localStorage` trong Zustand persist bằng `@capacitor/preferences` khi chạy native | Frontend | Nhỏ |
| REQ-07 | Zalo Mini App Shell | Tạo Zalo Mini App project riêng (dùng `zaui` hoặc React adapter), tích hợp Zalo Auth → JWT backend | Frontend/Zalo/Backend | Lớn |
| REQ-08 | Zalo OAuth Backend | BE nhận Zalo OAuth code → đổi lấy JWT access/refresh token (thêm `/auth/zalo` endpoint) | Backend REST | Trung bình |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──┬──> REQ-02 (PWA, độc lập sau khi core chuẩn hóa)
         ├──> REQ-03 ──> REQ-06 ──┬──> REQ-04 (iOS)
         │                        └──> REQ-05 (Android)
         └──> REQ-07 (Zalo, song song nhưng liên quan)

REQ-08 (độc lập, nhưng REQ-07 phụ thuộc REQ-08 để có auth flow hoàn chỉnh)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Chuẩn hóa FE Core
- **Mục tiêu**: Làm cho FE "platform-agnostic" — không hardcode URL, không hardcode storage, responsive trên màn hình nhỏ
- **Đầu vào**: Codebase hiện tại (`apps/frontend/`)
- **Đầu ra mong đợi**:
  - `VITE_API_BASE_URL` env var thay cho hardcode `/api/v1` trong `src/api/client.ts`
  - `storageAdapter` interface với 2 impl: `LocalStorageAdapter` (web) và `CapacitorStorageAdapter` (native)
  - Layout có bottom navigation bar cho màn hình < 768px thay cho sidebar cố định `w-64`
- **Tiêu chí hoàn thành**: App chạy đúng trên browser, API URL có thể cấu hình qua `.env`
- **Phụ thuộc**: Không

##### REQ-02: PWA
- **Mục tiêu**: App có thể install được từ Chrome/Safari, hoạt động offline ở mức cơ bản
- **Đầu vào**: Vite 5 + `vite-plugin-pwa` (Workbox)
- **Đầu ra mong đợi**:
  - `manifest.webmanifest` với tên, icons (192×192, 512×512, maskable), theme color
  - Service Worker cache: App Shell (offline fallback) + API response cache (review queue, vocabulary)
  - `index.html` có tags `<link rel="manifest">`, `<meta name="theme-color">`, `<meta name="apple-mobile-web-app-capable">`
  - Lighthouse PWA score ≥ 90
- **Tiêu chí hoàn thành**: Có thể Add to Home Screen trên Android Chrome và iOS Safari
- **Phụ thuộc**: REQ-01

##### REQ-03: Capacitor Setup
- **Mục tiêu**: Tích hợp Capacitor 6 vào Vite project, tạo iOS và Android native shell
- **Đầu vào**: Vite build output (`dist/`) + Capacitor 6 CLI
- **Đầu ra mong đợi**:
  - `capacitor.config.ts` với `appId`, `appName`, `webDir: 'dist'`
  - `ios/` và `android/` folder trong `apps/frontend/`
  - `BrowserRouter` → `HashRouter` (hoặc Capacitor sử dụng custom scheme `capacitor://localhost`)
  - Script `npm run cap:sync` trong `package.json`
- **Tiêu chí hoàn thành**: App load đúng trong iOS Simulator và Android Emulator
- **Phụ thuộc**: REQ-01

##### REQ-04: iOS Build & Submit
- **Mục tiêu**: Build .ipa và submit lên TestFlight / App Store Connect
- **Đầu vào**: iOS project từ REQ-03, Apple Developer Account
- **Đầu ra mong đợi**:
  - App icons theo Apple Human Interface Guidelines (1024×1024 + các kích thước)
  - Splash screen (LaunchScreen.storyboard)
  - `Info.plist` với usage descriptions (nếu dùng camera/mic)
  - Signed IPA build
- **Tiêu chí hoàn thành**: App lên được TestFlight, không bị reject do missing metadata
- **Phụ thuộc**: REQ-03, REQ-06

##### REQ-05: Android Build & Submit
- **Mục tiêu**: Build .aab và submit lên Google Play Console
- **Đầu vào**: Android project từ REQ-03, Google Play Developer Account
- **Đầu ra mong đợi**:
  - Adaptive icons (foreground + background layers)
  - Splash screen
  - Signed AAB (Android App Bundle)
  - `build.gradle` cấu hình đúng `applicationId`, `versionCode`, `versionName`
- **Tiêu chí hoàn thành**: AAB được upload lên Internal Testing track
- **Phụ thuộc**: REQ-03, REQ-06

##### REQ-06: Capacitor Storage Adapter
- **Mục tiêu**: Zustand persist hoạt động đúng trên native (không dùng `localStorage` trực tiếp)
- **Đầu vào**: `src/store/auth.store.ts` (hiện dùng `persist` middleware với default localStorage)
- **Đầu ra mong đợi**:
  - Custom Zustand storage: detect `Capacitor.isNativePlatform()` → dùng `@capacitor/preferences`, ngược lại dùng `localStorage`
  - Token `accessToken`, `refreshToken`, `user` persist đúng sau khi kill app
- **Tiêu chí hoàn thành**: Login 1 lần, kill app, mở lại vẫn còn session
- **Phụ thuộc**: REQ-03

##### REQ-07: Zalo Mini App Shell
- **Mục tiêu**: Tạo Zalo Mini App có thể chạy trong Zalo, tích hợp auth qua Zalo OAuth
- **Đầu vào**: Zalo Mini App Developer Account, Zalo JS SDK (`@zmp-sdk/react`)
- **Đầu ra mong đợi**:
  - Thư mục `apps/zalo-miniapp/` tách biệt (dùng `zaui` + React adapter hoặc Zalo's framework)
  - Chia sẻ business logic với `packages/shared-types`
  - Auth flow: `zmp.login()` → lấy `auth_code` → gọi `/api/v1/auth/zalo` → nhận JWT
  - UI tuân thủ Zalo Design System (ZDS), không dùng TailwindCSS hoặc fallback gracefully
- **Tiêu chí hoàn thành**: App chạy được trong Zalo App, login thành công, xem được vocabulary list
- **Phụ thuộc**: REQ-08

##### REQ-08: Zalo OAuth Backend
- **Mục tiêu**: Backend xử lý Zalo OAuth code exchange, trả về JWT như các flow auth khác
- **Đầu vào**: Zalo `auth_code` + `app_id` + `app_secret` từ Zalo OA
- **Đầu ra mong đợi**:
  - `POST /api/v1/auth/zalo` nhận `{ code: string }` → gọi Zalo API lấy `access_token` + user info → upsert user → trả về `{ accessToken, refreshToken }`
  - `ZALO_APP_ID`, `ZALO_APP_SECRET` trong `.env`
  - User có thể link tài khoản Zalo với email account (optional, nếu email đã tồn tại)
- **Tiêu chí hoàn thành**: Gọi endpoint với code hợp lệ trả về JWT pair
- **Phụ thuộc**: Không (độc lập với FE)

---

### 3. Ngữ cảnh nghiệp vụ

- PolyLex là app học từ vựng — **use case mobile-first rất cao** (ôn tập 5–10 phút/ngày trên di động)
- Review Session và Quick Note là tính năng dùng nhiều nhất → cần hoạt động **offline hoặc low-latency**
- Zalo có ~75M người dùng tại Việt Nam → kênh phân phối quan trọng cho thị trường VN
- Streak system (gamification) yêu cầu **push notification** để nhắc ôn tập hàng ngày — cần `@capacitor/push-notifications` (ngoài phạm vi ticket này nhưng cần thiết kế sẵn)
- Auth hiện tại là JWT (email/password) — cần extend để chấp nhận Zalo OAuth mà không phá vỡ flow cũ

### 4. Ngữ cảnh kỹ thuật

#### Hiện trạng Frontend

| Thành phần | Hiện trạng | Vấn đề với Multi-Platform |
|-----------|-----------|--------------------------|
| `src/api/client.ts` | `baseURL: '/api/v1'` (relative) | ❌ Native app không có proxy — cần absolute URL |
| `src/App.tsx` | `BrowserRouter` | ⚠️ Capacitor custom scheme cần `HashRouter` hoặc config đặc biệt |
| `src/store/auth.store.ts` | `persist` dùng `localStorage` | ⚠️ iOS WebView giới hạn localStorage, Android OK nhưng không persist qua clear cache |
| `src/components/Layout.tsx` | Sidebar `w-64` cố định | ❌ Không dùng được trên màn hình 375px |
| `index.html` | Không có manifest, không có apple-touch-icon | ❌ PWA / iOS Add to Home Screen không hoạt động |
| `vite.config.ts` | Không có PWA plugin | ❌ Không có Service Worker |

#### Files/Modules bị ảnh hưởng

- `apps/frontend/index.html` — thêm PWA meta tags
- `apps/frontend/vite.config.ts` — thêm `vite-plugin-pwa`
- `apps/frontend/src/api/client.ts` — `VITE_API_BASE_URL`
- `apps/frontend/src/App.tsx` — router mode
- `apps/frontend/src/store/auth.store.ts` — storage adapter
- `apps/frontend/src/components/Layout.tsx` — responsive mobile nav
- `apps/backend/src/modules/auth/` — thêm Zalo OAuth strategy
- `apps/backend/src/config/config.module.ts` — thêm `ZALO_APP_ID`, `ZALO_APP_SECRET`

#### Packages cần thêm

| Platform | Package |
|---------|---------|
| PWA | `vite-plugin-pwa` |
| Capacitor Core | `@capacitor/core`, `@capacitor/cli` |
| Capacitor Native | `@capacitor/ios`, `@capacitor/android` |
| Capacitor Storage | `@capacitor/preferences` |
| Capacitor Push (future) | `@capacitor/push-notifications` |
| Zalo Mini App | `@zmp-sdk/react` (Zalo SDK) |
| Backend Zalo | `@nestjs/passport` (đã có), `passport-custom` |

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| API URL hardcode `/api/v1` | URL cấu hình qua env `VITE_API_BASE_URL` | Sửa 1 file |
| Không có PWA manifest | `manifest.webmanifest` + icons đầy đủ | Thêm assets + plugin |
| Không có Service Worker | Workbox cache app shell + API | Config `vite-plugin-pwa` |
| `BrowserRouter` | `HashRouter` (native) / `BrowserRouter` (web) | Detection logic |
| `localStorage` trong Zustand | Pluggable storage adapter | Wrapper nhỏ |
| Sidebar desktop-only | Bottom nav responsive | Refactor Layout |
| Không có Capacitor | `ios/` + `android/` project | `cap init` + `cap add` |
| Không có Zalo OAuth | `POST /auth/zalo` + Zalo strategy | Module mới |
| Không có Zalo Mini App | `apps/zalo-miniapp/` | App mới |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Zalo Mini App review process**: Zalo có review process nghiêm ngặt, có thể bị reject nếu không tuân thủ Zalo Mini App Policy (nội dung giảng dạy cần có giấy phép) — Biện pháp: Đọc kỹ Zalo Mini App Policy trước khi build
- [ ] **App Store review (Apple)**: Apple yêu cầu giải thích rõ về "educational app", có thể yêu cầu demo content — Biện pháp: Chuẩn bị metadata, screenshots, demo account đầy đủ
- [ ] **Offline UX**: User kỳ vọng offline = fully functional, nhưng chúng ta chỉ cache được một phần — Biện pháp: Communicate rõ offline capabilities trong app

#### 6.2 Rủi ro kỹ thuật
- [ ] **iOS WKWebView localStorage giới hạn**: iOS có thể xóa localStorage khi thiếu dung lượng — Biện pháp: REQ-06 (Capacitor Preferences) giải quyết triệt để
- [ ] **CORS trên native app**: Khi app gọi API từ `capacitor://localhost`, backend cần whitelist origin này — Biện pháp: Thêm `capacitor://localhost` vào CORS config NestJS
- [ ] **Zalo Mini App không hỗ trợ toàn bộ Web API**: `localStorage`, `IndexedDB`, `WebSocket` có thể bị giới hạn trong Zalo WebView — Biện pháp: Test sớm trên Zalo Simulator, fallback về in-memory storage
- [ ] **Vite build output với HashRouter**: Route `/dashboard` thành `/#/dashboard` — cần đảm bảo toàn bộ `<Link>` và `navigate()` vẫn hoạt động — Biện pháp: Dùng env var `VITE_ROUTER_MODE` để switch
- [ ] **TailwindCSS 4 trong Zalo Mini App**: Zalo Mini App có môi trường CSS riêng, TailwindCSS có thể conflict — Biện pháp: `apps/zalo-miniapp/` là codebase riêng, dùng Zalo Design System

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **Token refresh trên native**: `apiClient.interceptors` gọi `axios.post('/api/v1/auth/refresh')` — URL relative sẽ fail trên native nếu base URL chưa được cấu hình đúng — Phòng tránh: REQ-01 đổi sang `import.meta.env.VITE_API_BASE_URL` trước khi làm REQ-03
- [ ] **Zalo auth code là one-time-use**: Nếu gọi `/auth/zalo` 2 lần cùng code → lỗi — Phòng tránh: Frontend chỉ submit code 1 lần, disable button sau submit
- [ ] **Capacitor `cap sync` overwrite**: Nếu run `cap sync` sau khi đã sửa native code (Info.plist, AndroidManifest) sẽ bị overwrite — Phòng tránh: Document rõ file nào sửa native, file nào Capacitor tự generate

---

### 7. Ưu điểm và Nhược điểm của từng approach

#### Approach A (Được khuyến nghị): Capacitor cho iOS/Android + vite-plugin-pwa cho PWA + Zalo riêng

| Ưu điểm | Nhược điểm |
|---------|------------|
| Tái dùng 95% code React hiện có | Zalo Mini App vẫn cần codebase riêng |
| Capacitor 6 hỗ trợ Vite 5 + React 19 tốt | Cần Mac + Xcode license để build iOS |
| PWA gần như không cần thêm code business logic | Capacitor WebView có gap nhỏ với native UX (scroll, animations) |
| One codebase → 3 artifacts (PWA, iOS, Android) | Không có access camera/GPS sâu nếu chưa thêm Capacitor plugins |
| Community lớn, docs tốt | Review time App Store/Play Store có thể 1–7 ngày |

#### Approach B: React Native rewrite

| Ưu điểm | Nhược điểm |
|---------|------------|
| UX native hoàn toàn | Viết lại toàn bộ UI (chi phí cực cao) |
| Expo support tốt | Mất toàn bộ TailwindCSS |
| | Web không share được code |

#### Approach C: Chỉ làm PWA — không làm App Store

| Ưu điểm | Nhược điểm |
|---------|------------|
| Nhanh nhất (1–2 ngày) | Không có trên App Store |
| Không cần developer account | Apple giới hạn PWA (no push notification on iOS < 16.4) |
| | Zalo Mini App không covered |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: **Approach A** — Dùng Capacitor + vite-plugin-pwa + Zalo riêng theo 3 phase:
  - **Phase 1** (1–2 ngày): REQ-01 + REQ-02 → PWA sẵn sàng
  - **Phase 2** (3–5 ngày): REQ-03 + REQ-06 + REQ-04 + REQ-05 → App Store / Google Play
  - **Phase 3** (5–7 ngày): REQ-07 + REQ-08 → Zalo Mini App

- **Phụ thuộc ngoài**:
  - Apple Developer Program ($99/năm) + Mac với Xcode 15+
  - Google Play Developer Account ($25 one-time)
  - Zalo Mini App Developer Account (miễn phí)
  - App icons và splash screen design assets

- **Ước tính công sức**:
  | Phase | Effort |
  |-------|--------|
  | Phase 1: PWA | 1–2 ngày |
  | Phase 2: Capacitor iOS + Android | 4–6 ngày |
  | Phase 3: Zalo Mini App | 5–7 ngày |
  | **Tổng** | **10–15 ngày** |

---

### 9. Câu hỏi mở

- [ ] **Q1**: Zalo Mini App cần nội dung gì để pass Zalo review? (Có yêu cầu giấy phép giảng dạy không?)
- [ ] **Q2**: Backend hiện deploy ở đâu? URL production để set `VITE_API_BASE_URL` cho native build là gì?
- [ ] **Q3**: Push notification cho streak reminder có thuộc phạm vi ticket này không? (Ảnh hưởng chọn Capacitor plugins)
- [ ] **Q4**: Zalo Mini App có cần hỗ trợ offline không hay chỉ cần online?
- [ ] **Q5**: Có cần account linking (user có thể login bằng email VÀ Zalo vào cùng 1 account) không?

---

## Trả lời câu hỏi mở

| Câu hỏi | Trả lời |
|---------|---------|
| Q1: Zalo Mini App | ❌ Không cần — REQ-07 và REQ-08 ngoài phạm vi |
| Q2: Backend production URL | `https://ebms.store/api/` |
| Q3: Push notification | ⏳ Ticket sau |
| Q4: Zalo Mini App offline | N/A (Zalo removed) |
| Q5: Account linking | ❌ Không cần |

**Phạm vi thực tế**: REQ-01 + REQ-02 + REQ-03 + REQ-06 (PWA + Capacitor). REQ-07 và REQ-08 (Zalo) bị loại bỏ.

---

## PLAN TODO

### Phase 1: FE Core Standardization (REQ-01)

- [x] **TODO-1.1**: Đổi API base URL sang env var `VITE_API_BASE_URL`
  - **File**: `apps/frontend/src/api/client.ts`
  - **Context**: Line 3–4 — `const API_BASE = '/api/v1'`
  - **Thay đổi**: Thay `'/api/v1'` bằng `import.meta.env.VITE_API_BASE_URL ?? '/api/v1'`; cũng cập nhật `axios.post(${API_BASE}/auth/refresh...)` trong interceptor
  - **Verify**: `npm run build --workspace=apps/frontend` pass
  - **Kết quả**: API URL cấu hình được qua env, native app dùng URL tuyệt đối

- [x] **TODO-1.2**: Tạo file `.env`, `.env.production`, `.env.capacitor`
  - **File**: `apps/frontend/.env`, `apps/frontend/.env.production`, `apps/frontend/.env.capacitor`
  - **Thay đổi**:
    - `.env` — để trống `VITE_API_BASE_URL` (dùng proxy dev)
    - `.env.production` — `VITE_API_BASE_URL=https://ebms.store/api/v1`
    - `.env.capacitor` — `VITE_API_BASE_URL=https://ebms.store/api/v1` (alias cho native builds)
  - **Verify**: File tồn tại, không commit vào git secret
  - **Kết quả**: Các env đã phân tách rõ ràng

### Phase 2: PWA (REQ-02)

- [x] **TODO-2.1**: Cài `vite-plugin-pwa`
  - **Thay đổi**: `npm install -D vite-plugin-pwa --workspace=apps/frontend`
  - **Verify**: Package xuất hiện trong `devDependencies` của `apps/frontend/package.json`
  - **Kết quả**: Plugin sẵn sàng cấu hình

- [x] **TODO-2.2**: Cấu hình PWA trong `vite.config.ts`
  - **File**: `apps/frontend/vite.config.ts`
  - **Thay đổi**: Import `VitePWA`, thêm vào `plugins[]` với manifest (name, icons, theme_color, display: standalone) và Workbox strategy (NetworkFirst cho API, CacheFirst cho assets)
  - **Verify**: Build tạo `sw.js` và `manifest.webmanifest` trong `dist/`
  - **Kết quả**: Service Worker hoạt động, PWA installable

- [x] **TODO-2.3**: Tạo PWA icons
  - **File**: `apps/frontend/public/icons/` — `pwa-192.png`, `pwa-512.png`, `pwa-maskable-512.png`, `apple-touch-icon.png`
  - **Thay đổi**: Tạo placeholder icons SVG render sang PNG (hoặc dùng vite-plugin-pwa asset generator)
  - **Verify**: Files tồn tại trong `public/icons/`
  - **Kết quả**: Icons hiển thị khi install PWA

- [x] **TODO-2.4**: Cập nhật `index.html` với PWA tags
  - **File**: `apps/frontend/index.html`
  - **Thay đổi**: Thêm `<link rel="manifest">`, `<link rel="apple-touch-icon">`, cập nhật favicon từ `vite.svg` sang `/icons/pwa-192.png`
  - **Verify**: HTML tags tồn tại trong source
  - **Kết quả**: Add to Home Screen hoạt động trên iOS/Android

### Phase 3: Capacitor Setup (REQ-03)

- [x] **TODO-3.1**: Cài Capacitor core packages
  - **Thay đổi**: `npm install @capacitor/core --workspace=apps/frontend && npm install -D @capacitor/cli --workspace=apps/frontend && npm install @capacitor/ios @capacitor/android --workspace=apps/frontend`
  - **Verify**: Packages trong `package.json`
  - **Kết quả**: Capacitor CLI và runtime sẵn sàng

- [x] **TODO-3.2**: Tạo `capacitor.config.ts`
  - **File**: `apps/frontend/capacitor.config.ts`
  - **Thay đổi**: `appId: 'com.truongphatlab.polylex.app'`, `appName: 'PolyLex'`, `webDir: 'dist'`, server URL cho dev
  - **Verify**: File hợp lệ TypeScript
  - **Kết quả**: Capacitor project configured

- [x] **TODO-3.3**: Thêm scripts Capacitor vào `package.json`
  - **File**: `apps/frontend/package.json`
  - **Thay đổi**: Thêm `"cap:add:ios"`, `"cap:add:android"`, `"cap:sync"`, `"cap:open:ios"`, `"cap:open:android"`, `"build:capacitor"` scripts
  - **Verify**: Scripts xuất hiện trong package.json
  - **Kết quả**: Developer có thể chạy `npm run cap:sync` sau khi build

- [x] **TODO-3.4**: Cập nhật CORS backend cho Capacitor origin
  - **File**: `apps/backend/src/main.ts`
  - **Thay đổi**: Whitelist `capacitor://localhost` và `http://localhost` trong `enableCors` origin list cho production
  - **Verify**: `npm run build --workspace=apps/backend` pass
  - **Kết quả**: Native app call API không bị CORS error

### Phase 4: Capacitor Storage Adapter (REQ-06)

- [x] **TODO-4.1**: Cài `@capacitor/preferences`
  - **Thay đổi**: `npm install @capacitor/preferences --workspace=apps/frontend`
  - **Verify**: Package trong dependencies
  - **Kết quả**: Native persistent storage available

- [x] **TODO-4.2**: Tạo `src/lib/storage.ts` — pluggable Zustand storage
  - **File**: `apps/frontend/src/lib/storage.ts`
  - **Thay đổi**: Export `createPlatformStorage()` function — detect `Capacitor.isNativePlatform()` → dùng `@capacitor/preferences` (async get/set/remove), fallback → `localStorage`
  - **Verify**: TypeScript compile, satisfies `StateStorage` interface từ Zustand
  - **Kết quả**: Adapter hoạt động cả web và native

- [x] **TODO-4.3**: Cập nhật `auth.store.ts` dùng platform storage
  - **File**: `apps/frontend/src/store/auth.store.ts`
  - **Thay đổi**: Import `createPlatformStorage`, truyền vào `persist({ storage: createPlatformStorage() })`
  - **Verify**: Build pass, web behavior không thay đổi
  - **Kết quả**: Token persist đúng trên native sau khi kill app

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
PWA hoàn chỉnh (Service Worker + manifest + icons) + Capacitor shell cấu hình sẵn cho iOS/Android + storage adapter persist token qua native app kills + API URL cấu hình được qua env var.

### Thống kê
- **Tổng TODO**: 13
- **Hoàn thành**: 13 ✅
- **Blocked**: 0

### TODO Status

| TODO | Tiêu đề | Status |
|------|---------|--------|
| TODO-1.1 | API base URL env var | ✅ Done |
| TODO-1.2 | .env files (dev / production / capacitor) | ✅ Done |
| TODO-2.1 | Install vite-plugin-pwa | ✅ Done |
| TODO-2.2 | vite.config.ts PWA config | ✅ Done |
| TODO-2.3 | Generate PWA icon PNGs | ✅ Done |
| TODO-2.4 | index.html PWA tags | ✅ Done |
| TODO-3.1 | Install Capacitor packages | ✅ Done |
| TODO-3.2 | capacitor.config.ts | ✅ Done |
| TODO-3.3 | Capacitor scripts in package.json | ✅ Done |
| TODO-3.4 | Backend CORS for Capacitor origins | ✅ Done |
| TODO-4.1 | Install @capacitor/preferences | ✅ Done |
| TODO-4.2 | src/lib/storage.ts adapter | ✅ Done |
| TODO-4.3 | auth.store.ts platform storage | ✅ Done |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/frontend/src/api/client.ts` | Modified | `VITE_API_BASE_URL` env var thay thế hardcode `/api/v1` |
| `apps/frontend/src/vite-env.d.ts` | Created | Vite ImportMeta env type definitions |
| `apps/frontend/.env` | Created | Dev env (VITE_API_BASE_URL để trống, dùng proxy) |
| `apps/frontend/.env.production` | Created | `VITE_API_BASE_URL=https://ebms.store/api/v1` |
| `apps/frontend/.env.capacitor` | Created | Capacitor build mode env |
| `apps/frontend/vite.config.ts` | Modified | VitePWA plugin với Workbox config + manifest |
| `apps/frontend/index.html` | Modified | `<link rel="manifest">`, `<link rel="apple-touch-icon">`, favicon → PNG |
| `apps/frontend/public/icons/icon.svg` | Created | Source SVG icon cho asset generator |
| `apps/frontend/public/icons/pwa-192x192.png` | Created | Generated PWA icon |
| `apps/frontend/public/icons/pwa-512x512.png` | Created | Generated PWA icon |
| `apps/frontend/public/icons/maskable-icon-512x512.png` | Created | Maskable PWA icon |
| `apps/frontend/public/icons/apple-touch-icon-180x180.png` | Created | iOS home screen icon |
| `apps/frontend/pwa-assets.config.ts` | Created | Config cho @vite-pwa/assets-generator |
| `apps/frontend/capacitor.config.ts` | Created | `appId: com.truongphatlab.polylex.app`, `webDir: dist` |
| `apps/frontend/package.json` | Modified | Thêm Capacitor + PWA scripts, dependencies |
| `apps/frontend/src/lib/storage.ts` | Created | Platform-aware Zustand storage adapter |
| `apps/frontend/src/store/auth.store.ts` | Modified | `createJSONStorage(createPlatformStorage)` |
| `apps/backend/src/main.ts` | Modified | CORS whitelist `capacitor://localhost`, `https://ebms.store` |

### Verification
- Build thành công: ✅ (`dist/sw.js`, `dist/workbox-*.js`, `dist/manifest.webmanifest` generated)
- Backend build: ✅ 0 errors
- Frontend build: ✅ 0 TS errors

### Ghi chú — Các bước tiếp theo (manual, cần developer machine)

**Khởi tạo Capacitor iOS/Android** (chạy 1 lần sau khi có Mac với Xcode & Android Studio):
```bash
cd apps/frontend
npm run build:capacitor   # build với production env
npm run cap:add:ios       # tạo ios/ project
npm run cap:add:android   # tạo android/ project
npm run cap:sync          # copy dist/ vào native projects
npm run cap:open:ios      # mở Xcode → sign & build
npm run cap:open:android  # mở Android Studio → sign & build
```

**Tái sinh icons** khi cần cập nhật:
```bash
cd apps/frontend && npm run generate:icons
```

### Quyết định kỹ thuật
- **`createJSONStorage` wrapper**: Zustand v4 `persist` yêu cầu `PersistStorage<S>` (handles JSON), không nhận `StateStorage` raw — phải wrap qua `createJSONStorage(factory)`
- **Capacitor lazy import**: `@capacitor/preferences` được dynamic import trong `storage.ts` để không bundle vào web-only builds (tree-shaking)
- **Icons generator**: Dùng `@vite-pwa/assets-generator` với SVG source → tự động generate 4 kích thước PNG, không cần tool thiết kế
- **CORS production**: Whitelist explicit thay vì `false` — cho phép `capacitor://localhost` từ native WebView và `https://ebms.store` từ production web

---

## PHÂN TÍCH TICKET (BỔ SUNG PHẠM VI ZALO MINI APP — 2026-03-21)

### 0. PROJECT_TECH_PROFILE (khóa ngữ cảnh)
- **Monorepo**: npm workspaces (`apps/*`, `packages/*`)
- **Backend**: NestJS 10 + Prisma + PostgreSQL + JWT (`apps/backend/`)
- **Frontend chính**: React 19 + Vite 5 + TailwindCSS 4 + Zustand + Capacitor (`apps/frontend/`)
- **Auth hiện tại**: email/password + social qua `POST /api/v1/auth/social` cho `google|apple|facebook`
- **Mâu thuẫn phạm vi đã ghi nhận**: phần trước của ticket từng chốt “Zalo removed”, nhưng yêu cầu mới hiện tại là **phân tích để thêm Zalo Mini App**. Phân tích này xem như **scope update** mới.

### 1. Tóm tắt yêu cầu
| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-004 (scope update) |
| **Tiêu đề** | Bổ sung nền tảng Zalo Mini App cho PolyLex |
| **Mục tiêu** | Tạo thêm artifact `apps/zalo-miniapp` để chạy trong Zalo, dùng SDK/Zalo ecosystem, xác thực người dùng qua backend JWT hiện có |
| **Phạm vi** | UI (Zalo app shell), Integration (Zalo SDK), API/Auth backend, cấu hình env/deploy |
| **Độ ưu tiên** | Cao (mở rộng kênh phân phối tại VN) |

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-Z01 | Tạo Zalo Mini App workspace | Khởi tạo `apps/zalo-miniapp` theo stack Zalo (React + `zmp-ui`/`zmp-sdk` hoặc template tương đương) | UI/Build | Trung bình |
| REQ-Z02 | Thiết lập auth bridge Zalo → JWT | Lấy token/code từ Zalo SDK, gọi backend để nhận `accessToken/refreshToken` chuẩn PolyLex | Integration/Auth | Lớn |
| REQ-Z03 | Mở rộng backend social provider cho Zalo | Mở rộng DTO/service/schema để nhận provider `zalo`, verify token/code, upsert SocialAccount | API/DB | Lớn |
| REQ-Z04 | Tách core API client dùng chung | Tách lớp gọi API từ FE chính để tái sử dụng trong Zalo app (hoặc package shared client nhẹ) | Integration/State | Trung bình |
| REQ-Z05 | Thiết lập CI/CD và deploy Zalo | Bổ sung script build/deploy bằng `zmp-cli`, quy trình env cho dev/stage/prod | Build/DevOps | Trung bình |
| REQ-Z06 | Compliance + review readiness | Chuẩn bị quyền truy cập user info, privacy/support, metadata để pass review | Business/Release | Trung bình |

#### Mối quan hệ phụ thuộc

```
REQ-Z01 ──> REQ-Z02 ──> REQ-Z04
     │           │
     │           └──> REQ-Z03 ──> REQ-Z05
     └──────────────────────────> REQ-Z06
```

#### Chi tiết từng yêu cầu con

##### REQ-Z01: Tạo Zalo Mini App workspace
- **Mục tiêu**: Có project độc lập `apps/zalo-miniapp/` chạy đúng trong môi trường Zalo.
- **Đầu vào**: Monorepo hiện tại + tài nguyên từ ecosystem `Zalo-MiniApp` (template/SDK).
- **Đầu ra mong đợi**:
  - Workspace mới với scripts `dev`, `build`, `deploy`.
  - Cấu hình build phù hợp mini app (base rỗng, output phù hợp deploy).
  - Router phù hợp mini app shell.
- **Tiêu chí hoàn thành**: Chạy local preview được và bundle deploy được bằng CLI của Zalo.
- **Phụ thuộc**: Không.

##### REQ-Z02: Thiết lập auth bridge Zalo → JWT
- **Mục tiêu**: User trong Zalo đăng nhập được vào hệ thống PolyLex.
- **Đầu vào**: SDK login/access token của Zalo Mini App.
- **Đầu ra mong đợi**:
  - Luồng đăng nhập trong mini app dùng API login của Zalo SDK.
  - FE gọi endpoint backend mới/chuẩn hóa để đổi token/code lấy JWT pair.
  - Session lưu trữ ổn định cho môi trường mini app.
- **Tiêu chí hoàn thành**: Người dùng mở mini app, đăng nhập 1 lần, gọi được API protected.
- **Phụ thuộc**: REQ-Z01, REQ-Z03.

##### REQ-Z03: Mở rộng backend social provider cho Zalo
- **Mục tiêu**: Backend hỗ trợ provider `zalo` như social provider hạng nhất.
- **Đầu vào**: Auth module hiện có (`/auth/social`) + schema Prisma `SocialProvider`.
- **Đầu ra mong đợi**:
  - DTO/provider mở rộng nhận `zalo`.
  - Service verify token/code từ Zalo API và map user profile.
  - Prisma migration thêm enum `ZALO` (nếu giữ mô hình enum hiện tại).
  - Env + validation cho `ZALO_APP_ID`, `ZALO_APP_SECRET` (hoặc key tương ứng theo docs chính thức).
- **Tiêu chí hoàn thành**: Gọi auth Zalo thành công, tạo/link user, trả JWT pair.
- **Phụ thuộc**: Không (nhưng phục vụ REQ-Z02).

##### REQ-Z04: Tách core API client dùng chung
- **Mục tiêu**: Hạn chế duplicate logic giữa FE chính và Zalo app.
- **Đầu vào**: `apps/frontend/src/api/client.ts` hiện đang gắn chặt React app chính.
- **Đầu ra mong đợi**:
  - Module API client tái sử dụng được cho mini app.
  - Chuẩn hóa cơ chế baseURL, interceptors refresh token.
  - Tránh phụ thuộc trực tiếp vào `useAuthStore` của app chính.
- **Tiêu chí hoàn thành**: Cùng một core API logic chạy ổn ở cả frontend web/capacitor và mini app.
- **Phụ thuộc**: REQ-Z02.

##### REQ-Z05: Thiết lập CI/CD và deploy Zalo
- **Mục tiêu**: Có pipeline build/deploy rõ ràng cho mini app.
- **Đầu vào**: `zmp-cli` workflow (tham khảo ecosystem Zalo-MiniApp).
- **Đầu ra mong đợi**:
  - Scripts root hoặc workspace để build/deploy Zalo app.
  - Tách env theo môi trường.
  - Tài liệu vận hành deploy (manual + CI).
- **Tiêu chí hoàn thành**: Có thể deploy bản build mới lên Zalo Mini App bằng một quy trình chuẩn.
- **Phụ thuộc**: REQ-Z03.

##### REQ-Z06: Compliance + review readiness
- **Mục tiêu**: Tránh reject khi submit/review mini app.
- **Đầu vào**: Quy định review/policy của Zalo Mini App.
- **Đầu ra mong đợi**:
  - Privacy/support hiển thị rõ trong mini app.
  - Danh sách quyền truy cập user info đúng mục đích.
  - Checklist release trước submit.
- **Tiêu chí hoàn thành**: Bản release đạt review checklist nội bộ trước khi gửi.
- **Phụ thuộc**: REQ-Z01 (và song song với các REQ khác).

### 3. Ngữ cảnh nghiệp vụ
- PolyLex là sản phẩm mobile-first; mở thêm Zalo Mini App giúp tăng acquisition tại VN.
- Cần bảo toàn hành vi cốt lõi: login, xem danh sách từ vựng, review queue, đồng bộ tiến độ học qua JWT backend hiện hữu.
- Quy tắc nghiệp vụ chính cần giữ nguyên: cùng một user identity trên backend, không tạo luồng người dùng “lệch hệ”.
- Vì đã có social login (Google/Apple/Facebook), Zalo nên đi theo cùng pattern account linking để giảm rủi ro dữ liệu phân mảnh.

### 4. Ngữ cảnh kỹ thuật
- **Hiện trạng đã có trong code**:
  - `apps/backend/src/modules/auth/auth.controller.ts`: endpoint `POST /auth/social`.
  - `apps/backend/src/modules/auth/dto/auth.dto.ts`: `provider` chỉ nhận `google|apple|facebook`.
  - `apps/backend/src/modules/auth/auth.service.ts`: verify social token cho Google/Apple/Facebook.
  - `apps/backend/prisma/schema.prisma`: enum `SocialProvider` chưa có `ZALO`.
  - `apps/backend/src/config/config.module.ts`: chưa có biến env Zalo.
  - `apps/frontend/src/hooks/useSocialLogin.ts`: đã có social flow cho Google/Apple (không có Zalo).
- **Thông tin từ ecosystem `Zalo-MiniApp` (tham khảo repo công khai)**:
  - Có template React/Vite dùng `zmp-ui`, `zmp-sdk`, plugin build cho mini app.
  - Pattern auth phổ biến dùng SDK login/access token (ví dụ flow `login` → lấy token từ SDK).
  - Deploy đi qua `zmp-cli` (`zmp start`, `zmp deploy`) trong các template.
- **Files/Modules dự kiến bị ảnh hưởng**:
  - FE mới: `apps/zalo-miniapp/**` (project mới).
  - BE auth: `apps/backend/src/modules/auth/**`.
  - Prisma: `apps/backend/prisma/schema.prisma` + migration.
  - Config/env: `apps/backend/.env.example`, `apps/backend/src/config/config.module.ts`.
  - Shared types (nếu tách dùng chung): `packages/shared-types/**`.

### 5. Phân tích khoảng cách
| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| Chưa có `apps/zalo-miniapp/` | Có mini app chạy được trong Zalo | Tạo app mới + build config |
| Social provider không có `zalo` | Hỗ trợ login Zalo chuẩn JWT | Sửa DTO/service + verify flow |
| Prisma enum chưa có `ZALO` | Lưu được social account provider ZALO | Cần migration DB |
| Chưa có env Zalo | Có `ZALO_*` trong config validation | Cập nhật env schema + docs |
| API client gắn chặt app frontend | Có lớp API tái dùng cho mini app | Refactor nhẹ shared layer |
| Chưa có deploy script Zalo | Có quy trình `zmp-cli` rõ ràng | Bổ sung script + tài liệu CI/CD |

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Scope creep giữa app chính và mini app**: Nếu cố full parity ngay từ đầu sẽ kéo dài tiến độ — **Giảm thiểu**: chốt MVP Zalo (auth + vocabulary list + review queue).
- [ ] **Review policy reject**: Thiếu mô tả quyền hoặc trang privacy/support — **Giảm thiểu**: checklist compliance trước deploy production.

#### 6.2 Rủi ro kỹ thuật
- [ ] **Mismatch token model**: Zalo SDK trả token/code khác mô hình hiện tại của `/auth/social` — **Giảm thiểu**: thiết kế contract riêng `POST /auth/zalo` hoặc mở rộng `/auth/social` rõ ràng theo provider.
- [ ] **DB enum migration impact**: thêm `ZALO` vào `SocialProvider` cần migration an toàn trên production — **Giảm thiểu**: migration riêng, chạy thử trên staging.
- [ ] **Runtime khác nhau**: Mini app WebView có giới hạn API/browser behavior so với web/capacitor — **Giảm thiểu**: tách adapter environment + smoke test trên Zalo runtime sớm.

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **Double submit auth code/token**: login callback bắn 2 lần gây lỗi xác thực one-time — **Phòng tránh**: lock UI trong lúc exchange token.
- [ ] **Account linking sai**: email null/không ổn định từ provider làm tạo trùng user — **Phòng tránh**: ưu tiên `providerId` là khóa chính liên kết, email chỉ bổ trợ.
- [ ] **Refresh loop**: interceptor refresh thất bại nhưng retry lặp — **Phòng tránh**: giữ cờ `_retry` và logout rõ ràng như pattern hiện tại.

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Tận dụng backend JWT và social architecture sẵn có | Cần thêm một app frontend mới để phù hợp runtime Zalo |
| Giảm duplicate business logic nếu tách shared API layer | Tăng độ phức tạp release pipeline (thêm một channel deploy) |
| Bám ecosystem chính thức (`zmp-sdk`, `zmp-ui`, `zmp-cli`) | Cần xử lý khác biệt UX/UI so với app web hiện tại |

### 8. Khuyến nghị
- **Cách tiếp cận khuyến nghị**: Triển khai theo 3 phase, ưu tiên backend contract trước để giảm block cho FE:
  - **Phase A (2–3 ngày)**: REQ-Z03 (backend provider zalo + migration + env).
  - **Phase B (3–4 ngày)**: REQ-Z01 + REQ-Z02 (mini app shell + đăng nhập + gọi API protected).
  - **Phase C (2–3 ngày)**: REQ-Z04 + REQ-Z05 + REQ-Z06 (shared client, deploy, compliance hardening).
- **Các cách tiếp cận thay thế**:
  - Tái dùng trực tiếp `apps/frontend` và “shim” môi trường Zalo (nhanh ban đầu nhưng rủi ro cao do runtime/UI mismatch).
  - Làm backend trước, hoãn mini app UI (giảm rủi ro kỹ thuật ngắn hạn, chậm time-to-market).
- **Phụ thuộc**: Zalo Mini App AppID/secret, quyền API tương ứng, môi trường staging backend public.
- **Ước tính công sức**: 7–10 ngày làm việc cho MVP Zalo Mini App.

### 9. Câu hỏi mở
- [ ] Có chọn strategy endpoint nào: mở rộng `/auth/social` hay tách riêng `/auth/zalo`?
- [ ] Dữ liệu user từ Zalo tối thiểu cần gì cho onboarding (displayName, avatar, phone/email)?
- [ ] MVP Zalo cần những màn nào bắt buộc ngoài login (vocabulary list, review, profile)?
- [ ] Có yêu cầu đồng bộ pixel/analytics riêng cho Zalo channel không?
- [ ] Có cần đồng bộ i18n đầy đủ ngay ở bản Zalo đầu tiên hay chỉ tiếng Việt?

### 10. Danh sách re-check hồi quy

| Mã | Flow cũ cần re-check | Liên quan REQ | Mức ưu tiên | Cách re-check | Tiêu chí pass |
|----|----------------------|---------------|-------------|---------------|---------------|
| RC-Z01 | Login email/password trên web frontend hiện tại | REQ-Z03 | Cao | `npm run dev` + test manual login | Không bị ảnh hưởng bởi thay đổi social provider |
| RC-Z02 | Login Google/Apple/Facebook đang hoạt động | REQ-Z03 | Cao | Manual social login + kiểm tra `social_accounts` | Provider cũ vẫn exchange token và tạo JWT bình thường |
| RC-Z03 | Refresh token interceptor (`/auth/refresh`) | REQ-Z04 | Cao | Ép access token hết hạn rồi gọi API protected | Refresh 1 lần thành công, không loop vô hạn |
| RC-Z04 | CORS cho web + capacitor origin | REQ-Z03/REQ-Z05 | Trung bình | Smoke test từ web + native shell hiện có | Không phát sinh CORS blocked ngoài whitelist hợp lệ |
| RC-Z05 | Prisma migration/deploy pipeline backend | REQ-Z03 | Cao | `npm run migrate:deploy --workspace=apps/backend` trên staging | Migration chạy sạch, không lỗi enum/schema |
| RC-Z06 | PWA install + offline cache flow hiện có | REQ-Z04 | Trung bình | Build FE chính và kiểm tra SW assets | Không regression ở `manifest`/`sw.js` |
| RC-Z07 | Zalo login-to-dashboard flow (mini app) | REQ-Z01/REQ-Z02 | Cao | `zmp start` + chạy thử trong môi trường mini app | User đăng nhập và gọi được endpoint protected |

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Xây dựng thêm kênh Zalo Mini App cho PolyLex theo kiến trúc monorepo hiện tại, dùng SDK/chuẩn deploy của Zalo, đồng thời mở rộng backend social auth để cấp JWT thống nhất với các kênh web/capacitor hiện có.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: Tạo workspace `apps/zalo-miniapp` có thể chạy local và build/deploy theo chuẩn Zalo Mini App.
2. FR-02: Bổ sung luồng đăng nhập Zalo trong mini app và đổi token/code sang JWT backend.
3. FR-03: Mở rộng backend auth để hỗ trợ provider `zalo` (verify + upsert social account + trả JWT).
4. FR-04: Chuẩn hóa lớp API/auth dùng chung để giảm duplicate logic giữa frontend chính và mini app.
5. FR-05: Bổ sung script và tài liệu vận hành để build/deploy/re-check an toàn.

#### Ràng buộc phi chức năng
1. NFR-01: Không làm regression các social provider hiện có (`google`, `apple`, `facebook`).
2. NFR-02: Mỗi TODO atomic chỉ sửa 1 file, verify được ngay sau khi làm.
3. NFR-03: Tuân thủ stack thực tế: NestJS + Prisma (BE), React/Vite (FE), npm workspace.
4. NFR-04: Luồng auth phải đảm bảo session consistency và tránh retry loop.
5. NFR-05: Mỗi phase có tối thiểu 1 bước re-check hồi quy.

#### Phụ thuộc
- DEP-01: Cần thông số Zalo App (`appId`, secret, quyền API) từ môi trường thật.
- DEP-02: Cần migration DB cho enum social provider trước khi rollout production.
- DEP-03: Cần `zmp-cli` cho quy trình deploy mini app.

### Cách tiếp cận
> Triển khai theo lớp: **Data/Schema → Core Logic → Interface → Integration/Verification**. Ưu tiên backend contract và migration trước, sau đó mới dựng mini app shell + auth bridge; cuối cùng chuẩn hóa script/tài liệu và chạy full re-check hồi quy.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Tạo mới | `apps/zalo-miniapp/package.json` | Khai báo workspace scripts/deps cho mini app |
| Tạo mới | `apps/zalo-miniapp/vite.config.ts` | Cấu hình build phù hợp runtime/deploy Zalo |
| Tạo mới | `apps/zalo-miniapp/src/main.tsx` | Entry point mini app |
| Tạo mới | `apps/zalo-miniapp/src/App.tsx` | Router/layout tối thiểu cho MVP |
| Tạo mới | `apps/zalo-miniapp/src/lib/zalo-auth.ts` | Adapter login/token lấy từ SDK |
| Tạo mới | `apps/zalo-miniapp/src/api/client.ts` | API client cho mini app |
| Tạo mới | `apps/zalo-miniapp/src/pages/LoginPage.tsx` | Giao diện login Zalo + exchange token |
| Tạo mới | `apps/zalo-miniapp/src/pages/VocabularyPage.tsx` | Màn vocabulary MVP |
| Tạo mới | `apps/zalo-miniapp/src/store/auth.store.ts` | Quản lý access/refresh/user cho mini app |
| Sửa đổi | `apps/backend/prisma/schema.prisma` | Thêm enum provider ZALO |
| Tạo mới | `apps/backend/prisma/migrations/<timestamp>_add_zalo_provider/migration.sql` | Migration DB cho social provider |
| Sửa đổi | `apps/backend/src/modules/auth/dto/auth.dto.ts` | Mở rộng DTO nhận provider `zalo` |
| Sửa đổi | `apps/backend/src/modules/auth/auth.service.ts` | Verify token/code zalo + social login flow |
| Sửa đổi | `apps/backend/src/config/config.module.ts` | Validate env Zalo |
| Sửa đổi | `apps/backend/.env.example` | Bổ sung biến môi trường Zalo |
| Sửa đổi | `apps/backend/src/modules/auth/auth.service.spec.ts` | Unit test cho nhánh social provider Zalo |
| Sửa đổi | `apps/backend/src/modules/auth/auth.controller.ts` | Cập nhật Swagger summary/description cho provider mới |
| Sửa đổi | `polylex-global/package.json` | Bổ sung scripts orchestration cho zalo mini app |
| Tạo mới | `apps/zalo-miniapp/README.md` | Tài liệu dev/build/deploy/re-check |
| Sửa đổi | `polylex-global/README.md` | Cập nhật kiến trúc và runbook có Zalo channel |

---

## PLAN TODO

### Phase 1: Data Layer

#### REQ-Z03: Mở rộng backend social provider cho Zalo

- [x] **TODO-1.3.1**: Thêm enum `ZALO` vào Prisma SocialProvider
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Đọc `apps/backend/prisma/schema.prisma`, `apps/backend/src/modules/auth/auth.service.ts`
  - **Thay đổi**:
    - Cập nhật `enum SocialProvider` để thêm giá trị `ZALO`.
    - Giữ nguyên mapping/model hiện có, không đổi tên enum khác.
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Re-check**: Xác nhận enum cũ `GOOGLE|APPLE|FACEBOOK` vẫn còn nguyên.
  - **Real-test hint**: Sau khi implement, chạy prompt `4_real_test_completed_task.prompt.md` để test login social cũ.
  - **Kết quả**: Schema hỗ trợ provider Zalo ở tầng dữ liệu.

- [ ] **TODO-1.3.2**: Tạo migration thêm provider ZALO
  - **Trạng thái**: BLOCKED ở bước verify deploy migration vì chưa có DB staging/dev phù hợp để chạy `migrate:deploy` an toàn trong phiên này.
  - **File**: `apps/backend/prisma/migrations/<timestamp>_add_zalo_provider/migration.sql`
  - **Context**: Đọc migration gần nhất trong `apps/backend/prisma/migrations/`, `apps/backend/prisma/schema.prisma`
  - **Thay đổi**:
    - Viết SQL migration tương ứng để thêm enum value `ZALO` theo PostgreSQL.
    - Không gộp thay đổi schema khác vào migration này.
  - **Verify**: `npm run migrate:deploy --workspace=apps/backend`
  - **Re-check**: Re-check migration cũ vẫn apply được theo thứ tự.
  - **Real-test hint**: Chạy migration trên DB staging clone trước khi chạy prod.
  - **Kết quả**: DB có thể lưu social account với provider ZALO.

- [x] **TODO-1.3.3**: Bổ sung biến môi trường Zalo trong env mẫu
  - **File**: `apps/backend/.env.example`
  - **Context**: Đọc `apps/backend/.env.example`, `apps/backend/src/config/config.module.ts`
  - **Thay đổi**:
    - Thêm `ZALO_APP_ID`, `ZALO_APP_SECRET` (và biến callback nếu cần).
    - Ghi chú ngắn mục đích từng biến theo style file hiện tại.
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Re-check**: Đảm bảo các biến env cũ không bị đổi tên.
  - **Real-test hint**: Test với env thật trên máy dev qua `.env` local.
  - **Kết quả**: Tài liệu env đầy đủ cho triển khai Zalo.

- [x] **TODO-1.3.4**: Validate env Zalo trong ConfigModule
  - **File**: `apps/backend/src/config/config.module.ts`
  - **Context**: Đọc `apps/backend/src/config/config.module.ts`, `apps/backend/.env.example`
  - **Thay đổi**:
    - Mở rộng Joi schema thêm khóa `ZALO_*` (optional hoặc conditional rõ ràng).
    - Không làm chặt validation gây fail môi trường chưa bật Zalo.
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Re-check**: Boot app với env cũ không Zalo vẫn chạy được.
  - **Real-test hint**: Khởi động backend bằng env hiện tại và env có Zalo để so sánh.
  - **Kết quả**: Config layer nhận diện biến Zalo an toàn.

### Phase 2: Logic Layer

#### REQ-Z03: Mở rộng backend social provider cho Zalo

- [x] **TODO-2.3.1**: Mở rộng DTO social provider nhận `zalo`
  - **File**: `apps/backend/src/modules/auth/dto/auth.dto.ts`
  - **Context**: Đọc `apps/backend/src/modules/auth/dto/auth.dto.ts`, `apps/backend/src/modules/auth/auth.service.ts`
  - **Thay đổi**:
    - Cập nhật `@IsIn([...])` và type union để hỗ trợ `'zalo'`.
    - Cập nhật `ApiProperty` enum mô tả provider.
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Re-check**: Request payload cho provider cũ vẫn validate pass.
  - **Real-test hint**: Dùng Swagger thử payload `google` và `zalo`.
  - **Kết quả**: Contract input auth chấp nhận provider Zalo.

- [x] **TODO-2.3.2**: Thêm verify branch Zalo trong AuthService
  - **File**: `apps/backend/src/modules/auth/auth.service.ts`
  - **Context**: Đọc `apps/backend/src/modules/auth/auth.service.ts`, `apps/backend/src/modules/auth/dto/auth.dto.ts`, `apps/backend/src/config/config.module.ts`
  - **Thay đổi**:
    - Mở rộng `verifySocialToken()` xử lý provider `zalo`.
    - Map `providerId/email/displayName/avatarUrl` theo response Zalo API.
    - Cập nhật ép kiểu provider enum để hỗ trợ `ZALO`.
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Re-check**: Luồng `google/apple/facebook` không thay đổi hành vi.
  - **Real-test hint**: Mock token Zalo + token cũ để test song song.
  - **Kết quả**: Auth service có logic đầy đủ cho provider Zalo.

- [x] **TODO-2.3.3**: Bổ sung unit test cho nhánh Zalo social auth
  - **File**: `apps/backend/src/modules/auth/auth.service.spec.ts`
  - **Context**: Đọc `apps/backend/src/modules/auth/auth.service.spec.ts`, `apps/backend/src/modules/auth/auth.service.ts`
  - **Thay đổi**:
    - Thêm test case happy path cho `provider='zalo'`.
    - Thêm test case fail path (token invalid / missing profile data).
  - **Verify**: `npm run test --workspace=apps/backend`
  - **Re-check**: Test suite social cũ vẫn pass.
  - **Real-test hint**: Đối chiếu kết quả unit test với manual API call trên dev.
  - **Kết quả**: Logic mới có coverage chống regression.

#### REQ-Z04: Tách core API client dùng chung

- [x] **TODO-2.4.1**: Tạo core auth API service độc lập cho mini app
  - **File**: `apps/zalo-miniapp/src/api/client.ts`
  - **Context**: Đọc `apps/frontend/src/api/client.ts`, `apps/backend/src/modules/auth/auth.controller.ts`
  - **Thay đổi**:
    - Tạo axios client với base URL env cho mini app.
    - Thêm method auth social/token refresh tối thiểu cho MVP.
  - **Verify**: `npm run build --workspace=apps/zalo-miniapp` (sau khi workspace được tạo)
  - **Re-check**: Không tác động file API client hiện tại của `apps/frontend`.
  - **Real-test hint**: Gọi thử endpoint `/auth/social` từ mini app runtime.
  - **Kết quả**: Mini app có lớp gọi API riêng, rõ ràng, tái dùng được.

- [x] **TODO-2.4.2**: Tạo adapter lấy token đăng nhập từ Zalo SDK
  - **File**: `apps/zalo-miniapp/src/lib/zalo-auth.ts`
  - **Context**: Đọc docs/template Zalo (`zmp-sdk` login flow), `apps/zalo-miniapp/src/api/client.ts`
  - **Thay đổi**:
    - Implement hàm login lấy token/code từ SDK.
    - Chuẩn hóa output trả về cho auth flow của app.
  - **Verify**: `npm run build --workspace=apps/zalo-miniapp`
  - **Re-check**: Fallback error handling không crash app khi user cancel login.
  - **Real-test hint**: Chạy mini app trong môi trường Zalo để xác nhận callback.
  - **Kết quả**: Có bridge ổn định giữa SDK Zalo và API auth.

### Phase 3: Interface Layer

#### REQ-Z01: Tạo Zalo Mini App workspace

- [x] **TODO-3.1.1**: Khởi tạo package manifest cho workspace Zalo mini app
  - **File**: `apps/zalo-miniapp/package.json`
  - **Context**: Đọc `apps/frontend/package.json`, template package từ ecosystem Zalo-MiniApp
  - **Thay đổi**:
    - Khai báo scripts `dev`, `build`, `deploy`, `lint` (nếu có).
    - Khai báo dependency tối thiểu: React, `zmp-ui`, `zmp-sdk`, vite/plugin tương thích.
  - **Verify**: `npm install` tại root không lỗi workspace.
  - **Re-check**: Workspace cũ (`apps/frontend`, `apps/backend`) vẫn cài deps bình thường.
  - **Real-test hint**: Chạy `npm run dev --workspace=apps/zalo-miniapp`.
  - **Kết quả**: Monorepo nhận diện workspace mới hợp lệ.

- [x] **TODO-3.1.2**: Tạo cấu hình Vite cho mini app
  - **File**: `apps/zalo-miniapp/vite.config.ts`
  - **Context**: Đọc `apps/frontend/vite.config.ts`, ví dụ template Zalo dùng vite plugin
  - **Thay đổi**:
    - Cấu hình base/output phù hợp deploy mini app.
    - Thêm plugin React + plugin Mini App phù hợp.
  - **Verify**: `npm run build --workspace=apps/zalo-miniapp`
  - **Re-check**: Build frontend chính không bị ảnh hưởng.
  - **Real-test hint**: Deploy dry-run artifact để kiểm tra asset path.
  - **Kết quả**: Build artifact mini app đúng format.

- [ ] **TODO-3.1.3**: Tạo entry point mini app
  - **Trạng thái**: BLOCKED ở bước verify `npm run dev --workspace=apps/zalo-miniapp` vì môi trường local lỗi Node/ICU (`libicui18n.74.dylib` thiếu), dù build production của mini app đã pass.
  - **File**: `apps/zalo-miniapp/src/main.tsx`
  - **Context**: Đọc `apps/frontend/src/main.tsx` (nếu có), `apps/zalo-miniapp/src/App.tsx`
  - **Thay đổi**:
    - Mount React app, import stylesheet/framework cần thiết cho mini app.
  - **Verify**: `npm run dev --workspace=apps/zalo-miniapp`
  - **Re-check**: App khởi động không lỗi runtime trắng màn hình.
  - **Real-test hint**: Mở preview local trong devtools của Zalo.
  - **Kết quả**: App entry chạy được.

- [x] **TODO-3.1.4**: Tạo khung router/layout MVP
  - **File**: `apps/zalo-miniapp/src/App.tsx`
  - **Context**: Đọc `apps/frontend/src/App.tsx`, cấu trúc route theo template mini app
  - **Thay đổi**:
    - Tạo route tối thiểu `login`/`vocabulary`.
    - Thêm guard cơ bản dựa trên trạng thái auth.
  - **Verify**: `npm run build --workspace=apps/zalo-miniapp`
  - **Re-check**: Điều hướng không bị loop khi chưa đăng nhập.
  - **Real-test hint**: Test chuyển route sau khi login thành công/thất bại.
  - **Kết quả**: Có skeleton UI sẵn cho flow auth → data.

#### REQ-Z02: Thiết lập auth bridge Zalo → JWT

- [x] **TODO-3.2.1**: Tạo store auth cho mini app
  - **File**: `apps/zalo-miniapp/src/store/auth.store.ts`
  - **Context**: Đọc `apps/frontend/src/store/auth.store.ts`, `apps/zalo-miniapp/src/api/client.ts`
  - **Thay đổi**:
    - Khai báo state `accessToken`, `refreshToken`, `user` + actions set/clear.
    - Thêm persist phù hợp runtime mini app.
  - **Verify**: `npm run build --workspace=apps/zalo-miniapp`
  - **Re-check**: Refresh app vẫn giữ/clear session đúng trạng thái mong muốn.
  - **Real-test hint**: Đăng nhập rồi đóng/mở lại mini app để kiểm tra session.
  - **Kết quả**: Auth state mini app ổn định.

- [ ] **TODO-3.2.2**: Tạo màn login Zalo và exchange token
  - **Trạng thái**: BLOCKED ở bước real test vì chưa có Zalo runtime/AppID/token thật để xác nhận luồng login SDK -> backend JWT ngoài môi trường build.
  - **File**: `apps/zalo-miniapp/src/pages/LoginPage.tsx`
  - **Context**: Đọc `apps/zalo-miniapp/src/lib/zalo-auth.ts`, `apps/zalo-miniapp/src/api/client.ts`, `apps/zalo-miniapp/src/store/auth.store.ts`
  - **Thay đổi**:
    - Nút login gọi SDK adapter.
    - Exchange token sang JWT qua backend và lưu store.
    - Khóa button khi đang submit để tránh double-submit.
  - **Verify**: `npm run build --workspace=apps/zalo-miniapp`
  - **Re-check**: Flow lỗi login hiển thị thông báo và không làm treo UI.
  - **Real-test hint**: Chạy test thực tế bằng prompt `4_real_test_completed_task.prompt.md` trên thiết bị Zalo.
  - **Kết quả**: User có thể đăng nhập từ mini app và nhận JWT hợp lệ.

- [ ] **TODO-3.2.3**: Tạo màn vocabulary MVP sau đăng nhập
  - **Trạng thái**: BLOCKED ở bước real test vì phụ thuộc TODO-3.2.2 và chưa có phiên Zalo đăng nhập thật để gọi API protected end-to-end.
  - **File**: `apps/zalo-miniapp/src/pages/VocabularyPage.tsx`
  - **Context**: Đọc `apps/zalo-miniapp/src/api/client.ts`, API `/vocabulary` ở backend
  - **Thay đổi**:
    - Gọi API danh sách vocabulary tối thiểu và render list.
    - Xử lý loading/error cơ bản.
  - **Verify**: `npm run build --workspace=apps/zalo-miniapp`
  - **Re-check**: Khi token hết hạn, app không crash (điều hướng về login hoặc báo lỗi rõ ràng).
  - **Real-test hint**: Test mạng yếu/timeout để xác nhận fallback UI.
  - **Kết quả**: Hoàn thành flow MVP login → xem vocabulary.

- [x] **TODO-3.2.4**: Cập nhật mô tả API auth endpoint cho provider mới
  - **File**: `apps/backend/src/modules/auth/auth.controller.ts`
  - **Context**: Đọc `apps/backend/src/modules/auth/auth.controller.ts`, `apps/backend/src/modules/auth/dto/auth.dto.ts`
  - **Thay đổi**:
    - Cập nhật summary/description Swagger cho endpoint social login để phản ánh có Zalo.
  - **Verify**: `npm run build --workspace=apps/backend`
  - **Re-check**: Swagger các endpoint auth khác không thay đổi route/status code.
  - **Real-test hint**: Mở `/api/docs` và kiểm tra enum provider hiển thị đúng.
  - **Kết quả**: API contract rõ ràng cho team FE/QA.

### Phase 4: Integration & Verification

#### REQ-Z05: Thiết lập CI/CD và deploy Zalo

- [x] **TODO-4.5.1**: Bổ sung scripts orchestration cho Zalo workspace ở root
  - **File**: `polylex-global/package.json`
  - **Context**: Đọc `polylex-global/package.json`, `apps/zalo-miniapp/package.json`
  - **Thay đổi**:
    - Thêm scripts root như `dev:zalo`, `build:zalo`, `deploy:zalo` (gọi workspace script).
  - **Verify**: `npm run build:zalo`
  - **Re-check**: Scripts root cũ (`dev`, `build`, `test`) vẫn hoạt động.
  - **Real-test hint**: Chạy script root trên máy CI tương đương local.
  - **Kết quả**: Vận hành build/deploy Zalo từ root thuận tiện.

- [x] **TODO-4.5.2**: Viết runbook dev/build/deploy cho mini app
  - **File**: `apps/zalo-miniapp/README.md`
  - **Context**: Đọc `README.md` root, script trong `apps/zalo-miniapp/package.json`
  - **Thay đổi**:
    - Tài liệu cách cài, chạy dev, build, deploy, env required.
    - Thêm checklist re-check trước release.
  - **Verify**: So khớp lệnh tài liệu với script thực tế đã tạo.
  - **Re-check**: Đồng bộ thuật ngữ với README root.
  - **Real-test hint**: Nhờ 1 dev khác chạy theo docs từ đầu để xác thực.
  - **Kết quả**: Có runbook thực thi được cho team.

- [x] **TODO-4.5.3**: Cập nhật tài liệu kiến trúc tổng ở README root
  - **File**: `polylex-global/README.md`
  - **Context**: Đọc `polylex-global/README.md`, `apps/zalo-miniapp/README.md`
  - **Thay đổi**:
    - Thêm mô tả channel Zalo Mini App vào architecture/commands chính.
  - **Verify**: Review markdown không lỗi, command tồn tại thật.
  - **Re-check**: Hướng dẫn hiện có cho backend/frontend không bị sai lệch.
  - **Real-test hint**: Chạy nhanh các command onboarding mới ghi trong README.
  - **Kết quả**: Tài liệu tổng quan phản ánh đúng trạng thái hệ thống.

- [x] **TODO-4.0.1**: Build backend sau toàn bộ thay đổi
  - **File**: `apps/backend/package.json`
  - **Context**: Đọc scripts build/test trong `apps/backend/package.json`
  - **Thay đổi**: Chạy `npm run build --workspace=apps/backend`.
  - **Verify**: Build thành công, không lỗi TypeScript mới.
  - **Re-check**: Build module auth cũ vẫn pass.
  - **Real-test hint**: Chạy thêm app start để xác nhận runtime không lỗi boot.
  - **Kết quả**: Backend sẵn sàng cho test tích hợp.

- [ ] **TODO-4.0.2**: Chạy unit test backend auth
  - **Trạng thái**: BLOCKED ở bước chạy full suite `npm run test --workspace=apps/backend -- --runInBand` vì môi trường local lỗi Node/ICU (`libicui18n.74.dylib` thiếu). Targeted test `auth.service.spec.ts` đã pass sau khi fix Jest mapper.
  - **File**: `apps/backend/package.json`
  - **Context**: Đọc `apps/backend/src/modules/auth/auth.service.spec.ts`, `apps/backend/package.json`
  - **Thay đổi**: Chạy `npm run test --workspace=apps/backend`.
  - **Verify**: Test pass, đặc biệt nhóm auth/social.
  - **Re-check**: Case provider cũ không fail sau khi thêm Zalo.
  - **Real-test hint**: Nếu flaky, chạy lại nhóm test auth riêng để xác định nguyên nhân.
  - **Kết quả**: Logic auth ổn định ở mức unit.

- [x] **TODO-4.0.3**: Build mini app sau tích hợp
  - **File**: `apps/zalo-miniapp/package.json`
  - **Context**: Đọc scripts build trong `apps/zalo-miniapp/package.json`, config `apps/zalo-miniapp/vite.config.ts`
  - **Thay đổi**: Chạy `npm run build --workspace=apps/zalo-miniapp`.
  - **Verify**: Artifact build được tạo thành công.
  - **Re-check**: Asset path/entrypoint không lỗi sau build.
  - **Real-test hint**: Nạp artifact vào môi trường preview của Zalo để kiểm tra thực thi.
  - **Kết quả**: Mini app buildable cho deploy.

- [ ] **TODO-4.0.4**: Re-check hồi quy liên kênh sau tích hợp
  - **Trạng thái**: BLOCKED vì chưa chạy đủ RC-Z01..RC-Z07 trên web/capacitor/Zalo runtime thật và môi trường local hiện có thêm blocker Node/ICU.
  - **File**: `ticket-docs/TICKET-004-multi-platform-wrapper.md`
  - **Context**: Đọc bảng re-check `RC-Z01..RC-Z07` trong ticket, `apps/frontend/src/hooks/useSocialLogin.ts`
  - **Thay đổi**:
    - Chạy lại checklist RC-Z01..RC-Z07 và cập nhật trạng thái pass/fail.
    - Ghi chú lỗi phát hiện (nếu có) vào ticket để feed cho bước implement fix.
  - **Verify**: Tất cả flow cũ và flow mới được ghi nhận kết quả.
  - **Re-check**: Bảo đảm không có regression ở web/capacitor/social cũ.
  - **Real-test hint**: Dùng prompt `4_real_test_completed_task.prompt.md` cho từng flow runtime quan trọng.
  - **Kết quả**: Có bằng chứng re-check đầy đủ trước code review/release.

---

## Ghi chú triển khai
- Chốt sớm quyết định endpoint: mở rộng `/auth/social` hay tách `/auth/zalo` để tránh rework FE/BE.
- Không copy nguyên mã template từ repo Zalo-MiniApp; chỉ tham chiếu kiến trúc và tự triển khai theo nhu cầu PolyLex.
- Ưu tiên MVP: login + vocabulary list + session refresh; các màn còn lại đưa vào ticket sau.

## Rủi ro cần theo dõi
- [ ] Risk-1: API contract Zalo thay đổi hoặc khác môi trường sandbox/prod — Biện pháp: có mock adapter + logging rõ ràng ở auth exchange.
- [ ] Risk-2: Migration enum trên production gây lock/rủi ro deploy — Biện pháp: chạy staging rehearsal + backup + cửa sổ deploy thấp tải.
- [ ] Risk-3: Regression social login cũ do chỉnh `auth.service.ts` — Biện pháp: bắt buộc test lại provider cũ trong mỗi lần merge.

---

## TÓM TẮT TRIỂN KHAI

### Kết quả tổng quan
- Đã hoàn thành phần lớn phạm vi implement cho Zalo Mini App MVP: **18 TODO hoàn tất**, **6 TODO đang BLOCKED** vì phụ thuộc runtime thật hoặc môi trường local hiện tại.
- Backend đã hỗ trợ provider `zalo` ở mức schema + DTO + service + Swagger + unit test nhánh auth mới.
- Monorepo đã có workspace mới `apps/zalo-miniapp/` với build pipeline riêng và script orchestration ở root.

### Các file đã tạo/sửa chính
- `apps/backend/prisma/schema.prisma`
- `apps/backend/prisma/migrations/20260321120000_add_zalo_provider/migration.sql`
- `apps/backend/.env.example`
- `apps/backend/src/config/config.module.ts`
- `apps/backend/src/modules/auth/dto/auth.dto.ts`
- `apps/backend/src/modules/auth/auth.service.ts`
- `apps/backend/src/modules/auth/auth.service.spec.ts`
- `apps/backend/src/modules/auth/auth.controller.ts`
- `apps/backend/package.json`
- `apps/zalo-miniapp/package.json`
- `apps/zalo-miniapp/tsconfig.json`
- `apps/zalo-miniapp/tsconfig.node.json`
- `apps/zalo-miniapp/vite.config.ts`
- `apps/zalo-miniapp/index.html`
- `apps/zalo-miniapp/app-config.json`
- `apps/zalo-miniapp/src/main.tsx`
- `apps/zalo-miniapp/src/App.tsx`
- `apps/zalo-miniapp/src/index.css`
- `apps/zalo-miniapp/src/api/client.ts`
- `apps/zalo-miniapp/src/lib/zalo-auth.ts`
- `apps/zalo-miniapp/src/store/auth.store.ts`
- `apps/zalo-miniapp/src/pages/LoginPage.tsx`
- `apps/zalo-miniapp/src/pages/VocabularyPage.tsx`
- `apps/zalo-miniapp/README.md`
- `package.json`
- `README.md`

### Verify đã chạy và kết quả
- `npx prisma generate` trong `apps/backend`: **PASS**
- `npm run build --workspace=apps/backend`: **PASS**
- `npm run test --workspace=apps/backend -- auth.service.spec.ts`: **PASS**
  - 6 test pass, gồm 2 test mới cho Zalo happy path và invalid token path.
- `npm run build --workspace=apps/zalo-miniapp`: **PASS**
- `npm run build:zalo`: **PASS**

### Verify bị chặn trong phiên này
- `npm run dev --workspace=apps/zalo-miniapp`: **BLOCKED**
  - Nguyên nhân: môi trường local lỗi Node/ICU, thiếu `libicui18n.74.dylib`.
- `npm run test --workspace=apps/backend -- --runInBand`: **BLOCKED**
  - Nguyên nhân: cùng blocker Node/ICU ở local shell hiện tại.
- `npm run migrate:deploy --workspace=apps/backend`: **CHƯA CHẠY**
  - Lý do: cần DB staging/dev an toàn để verify migration enum.
- Real test Zalo login/vocabulary trong Mini App runtime: **CHƯA CHẠY**
  - Lý do: chưa có AppID/runtime/token thật trong phiên này.

### Ghi chú kỹ thuật quan trọng đã xác nhận
- Phiên bản npm khả dụng cho ecosystem Zalo dùng trong ticket này:
  - `zmp-sdk@2.51.1`
  - `zmp-ui@1.11.13`
  - `zmp-vite-plugin@1.1.6`
- `zmp-vite-plugin` yêu cầu có `app-config.json`; thiếu file này thì build fail.
- Sau khi thêm enum Prisma, bắt buộc chạy lại `prisma generate` trước khi build backend.
- Jest mapper cho `@polylex/shared-types` trong `apps/backend/package.json` phải trỏ tới `../../../packages/shared-types/src$1` để test backend chạy đúng trong workspace hiện tại.

### Trạng thái re-check RC-Z01..RC-Z07
| Mã | Trạng thái | Ghi chú |
|----|------------|---------|
| RC-Z01 | CHƯA CHẠY | Chưa re-check login email/password web trong phiên này |
| RC-Z02 | CHƯA CHẠY | Chưa re-check Google/Apple/Facebook runtime |
| RC-Z03 | CHƯA CHẠY | Interceptor refresh của app chính chưa re-check end-to-end |
| RC-Z04 | CHƯA CHẠY | Chưa chạy smoke test CORS web/capacitor |
| RC-Z05 | BLOCKED | Chưa có DB staging/dev để chạy `migrate:deploy` |
| RC-Z06 | CHƯA CHẠY | Chưa build/review lại PWA app chính trong phiên này |
| RC-Z07 | BLOCKED | Chưa có Zalo runtime/AppID/token thật để test full login-to-dashboard |

### Kết luận
- Ticket đã đạt mức **code-complete cho phần implement chính**, nhưng **chưa đạt release-ready**.
- Để chuyển sang code review/release, còn cần xử lý 3 nhóm việc:
  1. Sửa môi trường local Node/ICU để chạy lại dev server và full backend test suite.
  2. Chạy `migrate:deploy` trên DB staging/dev an toàn.
  3. Chạy real test trên Zalo Mini App runtime và hoàn tất RC-Z01..RC-Z07.

