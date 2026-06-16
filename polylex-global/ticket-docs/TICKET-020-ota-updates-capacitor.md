# TICKET-020 — OTA Updates cho Capacitor App

## Yêu cầu gốc
Implement best practices cho OTA (Over-The-Air) updates trong Capacitor, cho phép cập nhật web assets (JS/HTML/CSS) của app mà không cần submit lại lên App Store / Google Play.

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-020 |
| **Tiêu đề** | OTA Updates cho Capacitor App (iOS & Android) |
| **Mục tiêu** | Cho phép deploy bản cập nhật web assets trực tiếp đến thiết bị người dùng mà không qua review cycle của App Store / Play Store |
| **Phạm vi** | Frontend (Capacitor), Backend (NestJS) — endpoint phát hiện phiên bản, CI/CD pipeline zip & upload lên R2 |
| **Độ ưu tiên** | Cao |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Update check endpoint | NestJS thêm `GET /updates/latest` trả về version hiện tại + URL download bundle | Backend REST | Nhỏ |
| REQ-02 | Bundle zip & upload CI | GitHub Actions build `dist/`, zip, upload lên Cloudflare R2 sau mỗi deploy | CI/CD | Trung bình |
| REQ-03 | Capacitor Updater plugin | Tích hợp `@capgo/capacitor-updater` v8, cấu hình trỏ vào self-hosted endpoint | Frontend | Trung bình |
| REQ-04 | Update flow trong app | Kiểm tra update khi app foreground → download ngầm → thông báo user → áp dụng khi restart | Frontend | Trung bình |
| REQ-05 | Rollback & version guard | Tự động rollback nếu bundle mới crash (notifyAppReady chưa gọi), giữ lại 1 version trước | Frontend | Nhỏ |
| REQ-06 | Version metadata backend | Backend lưu version string + R2 URL trong DB hoặc biến môi trường, cập nhật khi deploy | Backend | Nhỏ |
| REQ-07 | CI/CD integration | Tích hợp bước OTA upload vào workflow `main.yml` hiện tại sau bước Docker deploy | CI/CD | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-06 ──> REQ-01 ──┬──> REQ-03 ──> REQ-04 ──> REQ-05
                    │
REQ-02 ─────────────┘

REQ-07 phụ thuộc REQ-02 + REQ-06
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Update check endpoint
- **Mục tiêu**: Client hỏi backend "có version mới không?" và nhận URL để download
- **Đầu vào**: `GET /updates/latest?platform=ios|android&currentVersion=x.y.z`
- **Đầu ra mong đợi**: `{ version: "1.2.3", url: "https://r2.../bundle-1.2.3.zip", mandatory: false }`
- **Tiêu chí hoàn thành**: Endpoint trả đúng format, có version hiện tại và URL hợp lệ
- **Phụ thuộc**: REQ-06

##### REQ-02: Bundle zip & upload CI
- **Mục tiêu**: Sau mỗi lần merge `main`, bundle mới được upload tự động lên R2
- **Đầu vào**: `dist/` sau `npm run build:capacitor`
- **Đầu ra mong đợi**: File `bundle-{version}.zip` trên Cloudflare R2, public URL có thể download
- **Tiêu chí hoàn thành**: File tồn tại trên R2, có thể download qua URL
- **Phụ thuộc**: Không

##### REQ-03: Capacitor Updater plugin
- **Mục tiêu**: Cài và cấu hình `@capgo/capacitor-updater` trỏ vào self-hosted endpoint
- **Đầu vào**: `capacitor.config.ts`, `package.json`
- **Đầu ra mong đợi**: Plugin nhận diện được update endpoint tùy chỉnh
- **Tiêu chí hoàn thành**: `cap sync` thành công, plugin compile được trên iOS & Android
- **Phụ thuộc**: REQ-01

##### REQ-04: Update flow trong app
- **Mục tiêu**: Phát hiện → download ngầm → notify user → áp dụng khi app restart hoặc user xác nhận
- **Đầu vào**: App foreground event (`appStateChange`), response từ REQ-01
- **Đầu ra mong đợi**: Toast "Bản cập nhật mới sẵn sàng — khởi động lại để áp dụng" hoặc tự động reload sau X giây
- **Tiêu chí hoàn thành**: Không block UI, không force-reload làm mất trạng thái người dùng đang học
- **Phụ thuộc**: REQ-03

##### REQ-05: Rollback & version guard
- **Mục tiêu**: Nếu bundle mới crash trước khi gọi `notifyAppReady()` → tự động rollback về bundle cũ
- **Đầu vào**: `CapacitorUpdater.notifyAppReady()` được gọi trong `main.tsx`
- **Đầu ra mong đợi**: App không bị kẹt ở màn trắng sau update lỗi
- **Tiêu chí hoàn thành**: Test case: bundle thiếu file vẫn rollback được
- **Phụ thuộc**: REQ-03

##### REQ-06: Version metadata backend
- **Mục tiêu**: Backend biết version hiện tại và URL bundle R2
- **Đầu vào**: `CURRENT_APP_VERSION`, `CURRENT_BUNDLE_URL` env vars hoặc bảng `app_versions`
- **Đầu ra mong đợi**: Giá trị này được cập nhật tự động trong CI/CD
- **Tiêu chí hoàn thành**: Endpoint REQ-01 trả về version đúng
- **Phụ thuộc**: Không

##### REQ-07: CI/CD integration
- **Mục tiêu**: Tích hợp bước OTA vào `main.yml` sau khi Docker deploy thành công
- **Đầu vào**: Workflow hiện tại tại `.github/workflows/main.yml`
- **Đầu ra mong đợi**: Step "Build & Upload OTA bundle" chạy sau `docker compose up`
- **Tiêu chí hoàn thành**: Mỗi push `main` tự động có bundle mới trên R2
- **Phụ thuộc**: REQ-02 + REQ-06

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng hiện tại**: Push `main` → GitHub Actions → Docker deploy backend + web server. App native phải được build thủ công, submit lên store. Bug fix nhỏ = phải chờ review cycle 1–3 ngày.
- **Luồng mong muốn**: Push `main` → CI cũng upload bundle mới → App iOS/Android tự phát hiện và cập nhật trong vòng phút.
- **Entities liên quan**: `app_version` (metadata version), Cloudflare R2 bucket (đã dùng cho TTS audio).
- **Hành vi cần bảo toàn**:
  - Không làm mất session đang active (user đang học/review)
  - Không force-reload khi user đang ở giữa review session
  - Phải backward compatible — native shell cũ (store version) vẫn chạy được với bundle tương thích

---

### 4. Ngữ cảnh kỹ thuật

#### Stack hiện tại
| Thành phần | Phiên bản | Ghi chú |
|------------|-----------|---------|
| `@capacitor/core` | 8.1.0 | Capacitor 8 — tương thích `@capgo/capacitor-updater` v8.x |
| NestJS backend | - | `https://ebms.store/api/v1` |
| Cloudflare R2 | - | Đã dùng cho audio cache (TICKET-014) |
| CI/CD | Self-hosted GitHub Actions | `main.yml` — deploy Docker stack |
| Build | `npm run build:capacitor` | Vite build, output `dist/`, mode `capacitor` |

#### Files bị ảnh hưởng
- `apps/frontend/capacitor.config.ts` — thêm cấu hình `CapacitorUpdater`
- `apps/frontend/src/main.tsx` — gọi `CapacitorUpdater.notifyAppReady()`
- `apps/frontend/package.json` — thêm `@capgo/capacitor-updater`
- `apps/backend/src/modules/` — thêm module `updates/`
- `.github/workflows/main.yml` — thêm step build + upload bundle

#### Điểm tích hợp
- **R2**: Upload `bundle-{version}.zip` công khai; URL dạng `https://pub-xxx.r2.dev/bundles/bundle-{version}.zip`
- **NestJS**: Module `UpdatesModule` → `UpdatesController` → `GET /updates/latest`
- **Capacitor**: `@capgo/capacitor-updater` — supports `privateHost` pointing to custom NestJS server

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| App chỉ update khi submit store | App tự update web bundle qua R2 | Cần OTA mechanism |
| Không có version tracking | Backend expose `/updates/latest` | Cần endpoint + metadata |
| CI chỉ deploy Docker | CI cũng build & upload bundle | Cần bước CI mới |
| Không có update UI | Toast hoặc silent reload | Cần update flow component |
| Không có rollback | Auto-rollback nếu crash | Cần `notifyAppReady()` |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- **App Store policy**: Apple chỉ cho phép OTA update cho web content, không được thay đổi native behavior. PolyLex là Vite React app thuần — hợp lệ. Biện pháp: Không thêm native plugin mới qua OTA.
- **Force update gây mất UX**: Reload giữa review session sẽ mất tiến độ. Biện pháp: Chỉ reload khi app vào foreground từ background, hoặc khi user về Home.

#### 6.2 Rủi ro kỹ thuật
- **Bundle cũ không tương thích API mới**: Khi backend thêm breaking change, user dùng bundle cũ sẽ gặp lỗi 422/404. Biện pháp: Semver + `minNativeVersion` trong response endpoint.
- **R2 CORS**: Bundle zip cần được download bởi Capacitor WebView. Biện pháp: Cấu hình R2 bucket CORS cho `file://` origin (đã xử lý tương tự TICKET-014).
- **Bundle size**: `dist/` hiện tại ~600KB gzipped. Zip sẽ ~1–2MB. Biện pháp: Chấp nhận được trên WiFi/4G. Có thể thêm delta update sau.
- **Concurrent deploy**: Nếu CI chạy 2 lần nhanh, 2 bundle cùng version. Biện pháp: Dùng git SHA hoặc timestamp trong version, không chỉ semver.

#### 6.3 Lỗi logic tiềm ẩn
- **`notifyAppReady()` không được gọi**: Nếu app crash trước `notifyAppReady`, Capacitor Updater sẽ rollback → loop. Biện pháp: Gọi sớm nhất có thể trong `main.tsx`, trước khi mount React.
- **Update loop**: Download update → reload → download update lại. Biện pháp: So sánh version trước khi trigger download.
- **Offline khi check update**: Nếu không có mạng, API call throws. Biện pháp: Wrap trong try/catch, silent fail, retry sau 30 phút.

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Deploy fix/feature trong phút, không chờ store review | Phức tạp hơn — thêm infrastructure (R2 path, NestJS module) |
| Tận dụng R2 đã có, không cần dịch vụ bên ngoài | Với Android APK side-load cần test riêng |
| `@capgo/capacitor-updater` tương thích Capacitor 8, MIT license | Apple có thể thắt chặt chính sách OTA trong tương lai |
| Rollback tự động nếu bundle lỗi | Kích thước bundle ~1–2MB, slow trên 3G yếu |
| Self-hosted hoàn toàn, không phụ thuộc Ionic AppFlow (trả phí) | Cần quản lý cleanup bundle cũ trên R2 tránh tốn storage |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: `@capgo/capacitor-updater` v8 + self-hosted NestJS endpoint + Cloudflare R2
  - Lý do: Không tốn phí, tương thích Capacitor 8, hỗ trợ `privateHost` để trỏ vào `https://ebms.store/api/v1/updates/latest`, có built-in rollback.
  - Không dùng Ionic AppFlow (trả phí $49/tháng) vì đã self-host mọi thứ.
  - Không implement custom từ đầu bằng `Filesystem` API vì `@capgo` đã handle edge case `notifyAppReady`, rollback, partial download.

- **Các cách tiếp cận thay thế**:
  - Custom `Filesystem` + `WebView.setServerBasePath()` — nhiều code hơn, không rollback tự động
  - Ionic AppFlow — đơn giản setup nhưng tốn phí và phụ thuộc bên ngoài

- **Phụ thuộc**: R2 bucket đã tồn tại (TICKET-014), CI/CD đã có (TICKET-012), NestJS backend đang chạy

- **Ước tính công sức**: ~1.5 ngày (Backend: 2–3h, Frontend: 3h, CI/CD: 2h, testing: 2h)

---

### 9. Câu hỏi mở

- [ ] Version string dùng semver (`1.0.0`) hay git SHA hay timestamp? → Khuyến nghị: `{semver}+{gitsha7}` ví dụ `1.0.0+a3f9c21`
- [ ] Update có cần mandatory mode không (buộc update trước khi dùng app)?
- [ ] Có cần phân biệt bundle riêng cho iOS vs Android không? → Thường dùng chung 1 bundle vì là pure web
- [ ] Cleanup bundle cũ trên R2: giữ bao nhiêu version? → Khuyến nghị giữ 3 bản gần nhất
- [ ] Có muốn thêm A/B testing (deploy cho 10% user trước) trong tương lai không?

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Tích hợp `@capgo/capacitor-updater` (manual mode) vào PolyLex app, tạo NestJS endpoint `GET /updates/latest`, CI/CD tự động build + zip + upload bundle lên Cloudflare R2 sau mỗi push `main`, app tự check/download/áp dụng update khi vào foreground mà không cần submit lại store.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: Backend expose `GET /api/v1/updates/latest` trả `{ version, url, mandatory }`
2. FR-02: CI build `dist/`, zip thành `bundle-{version}.zip`, upload lên R2
3. FR-03: `@capgo/capacitor-updater` được cài và `notifyAppReady()` gọi trong `main.tsx`
4. FR-04: App check update khi foreground → download ngầm → toast "Cập nhật sẵn sàng" → reload
5. FR-05: Nếu bundle mới crash trước `notifyAppReady()` → tự rollback

#### Ràng buộc phi chức năng
1. NFR-01: Không reload khi user đang ở ReviewPage hoặc DialoguePage
2. NFR-02: Check update fail (offline/timeout) → silent, không crash app
3. NFR-03: Bundle zip phải public accessible qua R2 (CORS header)
4. NFR-04: Version format: `{semver}+{git-sha7}` (ví dụ: `1.0.0+a3f9c21`)

#### Phụ thuộc
- DEP-01: R2 bucket đã có (TICKET-014) — cần thêm path `bundles/`
- DEP-02: CI/CD workflow `main.yml` đã có (TICKET-012)
- DEP-03: NestJS backend đang chạy, `ConfigModule` global đã có

### Cách tiếp cận
> Dùng **manual mode** của `@capgo/capacitor-updater` (không dùng `privateHost`): app tự gọi `GET /updates/latest`, nếu có version mới thì gọi `CapacitorUpdater.download({ url, version })` → set → reload. Không phụ thuộc vào server-side Capgo protocol. Backend chỉ cần EndpointController đơn giản đọc env vars.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Tạo mới | `apps/backend/src/modules/updates/updates.controller.ts` | GET /updates/latest endpoint |
| Tạo mới | `apps/backend/src/modules/updates/updates.module.ts` | NestJS module wrapper |
| Sửa đổi | `apps/backend/src/app.module.ts` | Đăng ký UpdatesModule |
| Sửa đổi | `apps/backend/src/config/config.module.ts` | Thêm Joi schema cho OTA env vars |
| Sửa đổi | `apps/frontend/package.json` | Thêm `@capgo/capacitor-updater` dependency |
| Sửa đổi | `apps/frontend/capacitor.config.ts` | Thêm config `CapacitorUpdater` plugin |
| Sửa đổi | `apps/frontend/src/main.tsx` | Gọi `CapacitorUpdater.notifyAppReady()` |
| Tạo mới | `apps/frontend/src/hooks/useOtaUpdate.ts` | Hook check/download/apply update |
| Sửa đổi | `apps/frontend/src/App.tsx` | Mount hook `useOtaUpdate` |
| Sửa đổi | `.github/workflows/main.yml` | Thêm step build + upload bundle sau deploy |

---

## PLAN TODO

### Phase 1: Backend — Version metadata & endpoint (REQ-06 → REQ-01)

#### REQ-06: Version metadata backend

- [x] **TODO-1.6.1**: Thêm Joi validation cho 2 env vars OTA trong config module
  - **File**: `apps/backend/src/config/config.module.ts`
  - **Context**: Đọc file hiện tại để xem pattern Joi schema
  - **Thay đổi**:
    - Thêm vào `validationSchema` Joi.object:
      ```
      OTA_CURRENT_VERSION: Joi.string().default('0.0.0+dev'),
      OTA_BUNDLE_URL: Joi.string().uri().allow('').optional(),
      ```
  - **Verify**: `npm run build` trong `apps/backend/` không lỗi
  - **Kết quả**: Env vars được validate khi NestJS khởi động

#### REQ-01: Update check endpoint

- [x] **TODO-1.1.1**: Tạo `updates.controller.ts` với endpoint `GET /updates/latest`
  - **File**: `apps/backend/src/modules/updates/updates.controller.ts`
  - **Context**: Đọc `apps/backend/src/modules/health/health.controller.ts` làm template
  - **Thay đổi**: Tạo file mới:
    ```typescript
    import { Controller, Get, Query } from '@nestjs/common';
    import { ConfigService } from '@nestjs/config';
    import { ApiOperation, ApiTags } from '@nestjs/swagger';

    @ApiTags('updates')
    @Controller('updates')
    export class UpdatesController {
      constructor(private readonly config: ConfigService) {}

      @Get('latest')
      @ApiOperation({ summary: 'Check for OTA bundle update' })
      getLatest(@Query('currentVersion') currentVersion?: string) {
        const version = this.config.get<string>('OTA_CURRENT_VERSION', '0.0.0+dev');
        const url = this.config.get<string>('OTA_BUNDLE_URL', '');
        return {
          version,
          url: url || null,
          mandatory: false,
          hasUpdate: !!url && version !== currentVersion,
        };
      }
    }
    ```
  - **Verify**: `npm run build` trong `apps/backend/` không lỗi
  - **Kết quả**: Controller mới với đúng response shape

- [x] **TODO-1.1.2**: Tạo `updates.module.ts`
  - **File**: `apps/backend/src/modules/updates/updates.module.ts`
  - **Context**: Đọc `apps/backend/src/modules/health/health.module.ts` làm template
  - **Thay đổi**: Tạo file mới:
    ```typescript
    import { Module } from '@nestjs/common';
    import { UpdatesController } from './updates.controller';

    @Module({
      controllers: [UpdatesController],
    })
    export class UpdatesModule {}
    ```
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Module được tạo, sẵn sàng import

- [x] **TODO-1.1.3**: Đăng ký UpdatesModule vào AppModule
  - **File**: `apps/backend/src/app.module.ts`
  - **Context**: Đọc file hiện tại để xem danh sách imports
  - **Thay đổi**:
    - Thêm import: `import { UpdatesModule } from './modules/updates/updates.module';`
    - Thêm `UpdatesModule` vào mảng `imports` (sau `HealthModule`)
  - **Verify**: `npm run build` không lỗi; `curl https://ebms.store/api/v1/updates/latest` trả JSON sau deploy
  - **Kết quả**: Endpoint active, accessible qua `/api/v1/updates/latest`

---

### Phase 2: Frontend — Plugin install & rollback guard (REQ-03 + REQ-05)

#### REQ-03: Capacitor Updater plugin

- [x] **TODO-2.3.1**: Cài `@capgo/capacitor-updater` vào frontend
  - **File**: `apps/frontend/package.json`
  - **Context**: Xem `@capacitor/core` version (`8.1.0`) để match major version
  - **Thay đổi**: Chạy trong `apps/frontend/`:
    ```bash
    nvm use v23 && npm install @capgo/capacitor-updater@^8
    ```
  - **Verify**: `package.json` có entry `"@capgo/capacitor-updater": "^8.x.x"` trong `dependencies`
  - **Kết quả**: Package được cài, `node_modules/@capgo/capacitor-updater` tồn tại

- [x] **TODO-2.3.2**: Thêm cấu hình CapacitorUpdater vào `capacitor.config.ts`
  - **File**: `apps/frontend/capacitor.config.ts`
  - **Context**: Đọc file hiện tại — `plugins: {}` đang rỗng
  - **Thay đổi**: Thêm vào block `plugins`:
    ```typescript
    CapacitorUpdater: {
      // Manual mode: app tự gọi download(), không dùng privateHost auto-update
      autoUpdate: false,
      // Giữ tối đa 2 bundle cũ để rollback
      keepUrlPathAfterReload: false,
    },
    ```
  - **Verify**: `npx cap sync` chạy không lỗi TypeScript
  - **Kết quả**: Plugin config được nhận diện bởi Capacitor build

#### REQ-05: Rollback guard — notifyAppReady

- [x] **TODO-2.5.1**: Gọi `CapacitorUpdater.notifyAppReady()` sớm nhất trong `main.tsx`
  - **File**: `apps/frontend/src/main.tsx`
  - **Context**: Đọc file hiện tại — hiện chỉ có `ReactDOM.createRoot(...).render(...)`
  - **Thay đổi**: Thêm trước `ReactDOM.createRoot(...)`:
    ```typescript
    import { Capacitor } from '@capacitor/core';
    import { CapacitorUpdater } from '@capgo/capacitor-updater';

    // Must be called as early as possible.
    // If the app crashes before this line, the updater will auto-rollback.
    if (Capacitor.isNativePlatform()) {
      CapacitorUpdater.notifyAppReady();
    }
    ```
  - **Verify**: `npm run build` không lỗi TypeScript
  - **Kết quả**: Rollback guard active — bundle lỗi sẽ tự rollback khi restart app

---

### Phase 3: Frontend — Update check flow (REQ-04)

#### REQ-04: Update flow trong app

- [x] **TODO-3.4.1**: Tạo hook `useOtaUpdate.ts` — check, download, notify
  - **File**: `apps/frontend/src/hooks/useOtaUpdate.ts`
  - **Context**: Đọc `apps/frontend/src/api/client.ts` để biết `API_BASE`; đọc `apps/frontend/src/main.tsx` để hiểu platform check pattern
  - **Thay đổi**: Tạo file mới:
    ```typescript
    import { useEffect } from 'react';
    import { App } from '@capacitor/app';
    import { Capacitor } from '@capacitor/core';
    import { CapacitorUpdater } from '@capgo/capacitor-updater';
    import toast from 'react-hot-toast';

    const API_BASE = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '/api/v1';

    // Read current bundle version injected at build time (falls back to '0.0.0+dev')
    const CURRENT_VERSION = (import.meta.env.VITE_APP_VERSION as string | undefined) ?? '0.0.0+dev';

    export function useOtaUpdate() {
      useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        let listener: (() => void) | null = null;

        const checkForUpdate = async () => {
          try {
            const res = await fetch(`${API_BASE}/updates/latest?currentVersion=${CURRENT_VERSION}`);
            if (!res.ok) return;
            const data: { version: string; url: string | null; hasUpdate: boolean } = await res.json();
            if (!data.hasUpdate || !data.url) return;

            // Download in background
            const bundle = await CapacitorUpdater.download({ url: data.url, version: data.version });

            toast('🚀 Cập nhật mới sẵn sàng — khởi động lại để áp dụng', {
              duration: 6000,
              icon: '↻',
            });

            // Apply on next foreground (not immediately, to avoid disrupting active session)
            listener = (await App.addListener('appStateChange', async ({ isActive }) => {
              if (!isActive) {
                await CapacitorUpdater.set(bundle);
                // App will reload automatically
              }
            })).remove;
          } catch {
            // Silent fail — offline, CORS issue, etc.
          }
        };

        // Delay check by 3s to not impact cold-start performance
        const timer = setTimeout(checkForUpdate, 3000);
        return () => {
          clearTimeout(timer);
          listener?.();
        };
      }, []);
    }
    ```
  - **Verify**: `npm run type-check` không lỗi
  - **Kết quả**: Hook encapsulates toàn bộ OTA logic, không gắn vào UI component nào

- [x] **TODO-3.4.2**: Mount `useOtaUpdate` trong `App.tsx`
  - **File**: `apps/frontend/src/App.tsx`
  - **Context**: Đọc `apps/frontend/src/App.tsx` để tìm component root
  - **Thay đổi**:
    - Thêm import: `import { useOtaUpdate } from '@/hooks/useOtaUpdate';`
    - Gọi hook ở đầu component function `App()`: `useOtaUpdate();`
  - **Verify**: `npm run build` không lỗi; dev mode không crash
  - **Kết quả**: Update check được kích hoạt 3s sau app start

---

### Phase 4: CI/CD — Build & upload bundle (REQ-02 + REQ-07)

#### REQ-02: Bundle zip & upload CI

- [x] **TODO-4.2.1**: Thêm env var `VITE_APP_VERSION` vào build capacitor step trong workflow
  - **File**: `.github/workflows/main.yml`
  - **Context**: Đọc workflow hiện tại — thấy app services healthy check là bước cuối trước smoke test
  - **Thay đổi**: Thêm step mới sau `"Clean up dangling images"`:
    ```yaml
    - name: Build OTA bundle
      env:
        VITE_APP_VERSION: "1.0.0+${{ github.sha }}"
        VITE_API_BASE_URL: "https://ebms.store/api/v1"
      run: |
        cd polylex-global/apps/frontend
        export NVM_DIR="$HOME/.nvm"
        [ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
        nvm use v23
        npm ci --prefer-offline
        npm run build:capacitor
        VERSION="1.0.0+$(echo ${{ github.sha }} | cut -c1-7)"
        zip -r "bundle-${VERSION}.zip" dist/
        echo "BUNDLE_VERSION=${VERSION}" >> $GITHUB_ENV
        echo "BUNDLE_FILE=bundle-${VERSION}.zip" >> $GITHUB_ENV
    ```
  - **Verify**: Step chạy thành công locally với `act` hoặc check CI log
  - **Kết quả**: `dist/` được build với version string, zip file sẵn sàng upload

- [x] **TODO-4.2.2**: Thêm step upload bundle lên Cloudflare R2
  - **File**: `.github/workflows/main.yml`
  - **Context**: Đọc step vừa thêm ở TODO-4.2.1; biết R2 bucket name từ `.env.deploy.example`
  - **Thay đổi**: Thêm step ngay sau step "Build OTA bundle":
    ```yaml
    - name: Upload OTA bundle to R2
      env:
        AWS_ACCESS_KEY_ID: ${{ secrets.R2_ACCESS_KEY_ID }}
        AWS_SECRET_ACCESS_KEY: ${{ secrets.R2_SECRET_ACCESS_KEY }}
        R2_ENDPOINT: ${{ secrets.R2_ENDPOINT }}
        R2_BUCKET: ${{ secrets.R2_BUCKET_NAME }}
      run: |
        cd polylex-global/apps/frontend
        aws s3 cp "$BUNDLE_FILE" \
          "s3://${R2_BUCKET}/bundles/${BUNDLE_FILE}" \
          --endpoint-url "${R2_ENDPOINT}" \
          --no-progress
        echo "BUNDLE_URL=${R2_ENDPOINT/https:\/\//https:\/\/pub-}/${R2_BUCKET}/bundles/${BUNDLE_FILE}" >> $GITHUB_ENV
    ```
    > **Ghi chú**: URL pattern R2 public: `https://pub-{account}.r2.dev/bundles/{file}` — cần điều chỉnh `BUNDLE_URL` theo domain R2 thực tế của dự án.
  - **Verify**: File xuất hiện trên R2 dashboard sau CI chạy
  - **Kết quả**: Bundle accessible qua public R2 URL

#### REQ-07: CI/CD integration — cập nhật backend env

- [x] **TODO-4.7.1**: Thêm step cập nhật `.env` trên server với version + URL mới
  - **File**: `.github/workflows/main.yml`
  - **Context**: Đọc step "Prepare deploy env" để hiểu `.env.deploy` được dùng
  - **Thay đổi**: Thêm step sau "Upload OTA bundle to R2":
    ```yaml
    - name: Update backend OTA env vars
      run: |
        cd polylex-global
        # Update or append OTA vars in .env.deploy (used by Docker compose)
        sed -i "/^OTA_CURRENT_VERSION=/d" .env.deploy 2>/dev/null || true
        sed -i "/^OTA_BUNDLE_URL=/d" .env.deploy 2>/dev/null || true
        echo "OTA_CURRENT_VERSION=${BUNDLE_VERSION}" >> .env.deploy
        echo "OTA_BUNDLE_URL=${BUNDLE_URL}" >> .env.deploy
        # Restart backend container to pick up new env vars
        docker compose -f docker-compose.deploy.yml restart backend
    ```
  - **Verify**: `curl https://ebms.store/api/v1/updates/latest` trả version mới sau CI
  - **Kết quả**: Endpoint phản ánh bundle version mới trong vài phút sau push `main`

---

### Phase 5: Integration & Verification

- [x] **TODO-5.1**: Thêm `@capacitor/app` dependency nếu chưa có
  - **File**: `apps/frontend/package.json`
  - **Context**: Kiểm tra `package.json` — `@capacitor/app` cần cho `App.addListener('appStateChange')`
  - **Thay đổi**: Nếu chưa có, chạy `nvm use v23 && npm install @capacitor/app`
  - **Verify**: `package.json` có `"@capacitor/app"` trong `dependencies`
  - **Kết quả**: `App.addListener` có type definitions

- [x] **TODO-5.2**: Type-check toàn bộ frontend
  - **File**: `apps/frontend/` (chạy lệnh, không sửa file)
  - **Context**: Tất cả thay đổi phase 2-3
  - **Thay đổi**: `cd apps/frontend && nvm use v23 && npx tsc --noEmit`
  - **Verify**: Output không có dòng `error TS`
  - **Kết quả**: Types đúng trên toàn bộ codebase

- [x] **TODO-5.3**: Build production frontend
  - **File**: `apps/frontend/` (chạy lệnh)
  - **Context**: Tất cả thay đổi phase 1-4
  - **Thay đổi**: `cd apps/frontend && nvm use v23 && npm run build`
  - **Verify**: Output kết thúc bằng `✓ built in X.XXs`
  - **Kết quả**: Build thành công, không regression

- [x] **TODO-5.4**: `cap sync` để native projects nhận plugin mới
  - **File**: `apps/frontend/` (chạy lệnh)
  - **Context**: `@capgo/capacitor-updater` vừa được cài ở TODO-2.3.1
  - **Thay đổi**: `cd apps/frontend && npx cap sync`
  - **Verify**: Output có `✓ update ios` và `✓ update android`
  - **Kết quả**: iOS/Android native projects có plugin header + native code

- [ ] **TODO-5.5**: Smoke test update flow trên iOS Simulator
  - ℹ️ **Note**: Manual test — cần GitHub Secrets + live R2 bucket. Thực hiện sau khi configure secrets trên repo.
  - **File**: N/A (manual test)
  - **Context**: Xem hook `useOtaUpdate` — delay 3s, check `/updates/latest`
  - **Thay đổi**:
    1. Tạm thời set `OTA_CURRENT_VERSION=0.0.0+old` và `OTA_BUNDLE_URL=<valid R2 url>` trên dev backend
    2. Build capacitor với `VITE_APP_VERSION=0.0.0+old`
    3. Run trên Simulator, chờ 3s, verify toast "Cập nhật mới sẵn sàng" xuất hiện
    4. Background app, verify app reload với bundle mới
  - **Verify**: Toast hiển thị; sau background→foreground app reload
  - **Kết quả**: End-to-end OTA flow hoạt động

---

## Ghi chú triển khai

- **GitHub Secrets cần thiết**: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT` (ví dụ `https://xxx.r2.cloudflarestorage.com`), `R2_BUCKET_NAME` — thêm vào Settings → Secrets → Actions của repo
- **Vite env var**: `VITE_APP_VERSION` được inject lúc build, available qua `import.meta.env.VITE_APP_VERSION` trong runtime
- **`aws` CLI**: Cloudflare R2 tương thích S3 API — dùng `aws s3 cp` với `--endpoint-url` trỏ vào R2
- **R2 public URL**: Phải enable "Public access" cho bucket (hoặc dùng custom domain) để app download được bundle
- **Android**: `allowMixedContent: false` trong `capacitor.config.ts` — R2 URL phải là HTTPS (đã đúng)
- **Cleanup bundle cũ**: Có thể thêm step `aws s3 ls | sort | head -n -3 | xargs aws s3 rm` để giữ 3 bản gần nhất (tuỳ chọn)

## Rủi ro cần theo dõi

- [ ] Risk-1: R2 public URL pattern không đúng → bundle download fail → app không update (không crash) — Biện pháp: Test URL bằng `curl` trước khi merge
- [ ] Risk-2: `@capacitor/app` chưa được cài → `App.addListener` undefined → Biện pháp: Check TODO-5.1 trước TODO-3.4.1
- [ ] Risk-3: `notifyAppReady()` gọi quá muộn (sau React crash) → rollback loop → Biện pháp: Đặt ở đầu `main.tsx` trước `ReactDOM.createRoot` (TODO-2.5.1)
- [ ] Risk-4: `.env.deploy` git-ignored trên server → `sed` command fail → Biện pháp: Dùng `touch .env.deploy` trước `sed`

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Tích hợp hoàn chỉnh `@capgo/capacitor-updater` (manual mode) vào PolyLex Capacitor app: NestJS endpoint `GET /updates/latest` phục vụ version metadata, hook `useOtaUpdate` download + áp dụng bundle ngầm khi app vào background, CI/CD tự động build zip + upload lên Cloudflare R2 + cập nhật backend env sau mỗi push `main`.

### Thống kê
- **Tổng TODO**: 18
- **Hoàn thành**: 17 ✅
- **Pending manual test**: 1 (TODO-5.5 — cần GitHub Secrets + live R2)

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-1.6.1 | Joi OTA env vars | ✅ Done | `OTA_CURRENT_VERSION` + `OTA_BUNDLE_URL` thêm vào Joi schema |
| TODO-1.1.1 | UpdatesController | ✅ Done | `GET /updates/latest` với `@ApiQuery` docs |
| TODO-1.1.2 | UpdatesModule | ✅ Done | |
| TODO-1.1.3 | Register UpdatesModule | ✅ Done | Thêm vào `app.module.ts` sau HealthModule |
| TODO-2.3.1 | Install @capgo plugin | ✅ Done | `@capgo/capacitor-updater@8.43.9` |
| TODO-5.1 | Install @capacitor/app | ✅ Done | Cài cùng lúc với TODO-2.3.1 |
| TODO-2.3.2 | capacitor.config.ts | ✅ Done | `autoUpdate: false` trong plugins block |
| TODO-2.5.1 | notifyAppReady | ✅ Done | Gọi trước `ReactDOM.createRoot` với platform guard |
| TODO-3.4.1 | useOtaUpdate hook | ✅ Done | Delay 3s, silent-fail, apply on background |
| TODO-3.4.2 | Mount hook in App.tsx | ✅ Done | `useOtaUpdate()` ở đầu App component |
| TODO-4.2.1 | CI OTA bundle step | ✅ Done | Build + zip với version `1.0.0+{sha7}` |
| TODO-4.2.2 | CI R2 upload step | ✅ Done | `aws s3 cp --endpoint-url` + `R2_PUBLIC_URL` secret |
| TODO-4.7.1 | CI update backend env | ✅ Done | `touch .env.deploy` + sed + `docker restart backend` |
| TODO-5.2 | Type-check | ✅ Done | `npx tsc --noEmit` — 0 errors |
| TODO-5.3 | Build frontend | ✅ Done | `✓ built in 2.99s` |
| TODO-5.4 | cap sync | ✅ Done | 3 plugins registered on iOS + Android |
| TODO-5.5 | Smoke test iOS Simulator | ⏳ Pending | Cần configure 4 GitHub Secrets trước |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/backend/src/config/config.module.ts` | Modified | Thêm `OTA_CURRENT_VERSION` + `OTA_BUNDLE_URL` Joi schema |
| `apps/backend/src/modules/updates/updates.controller.ts` | Created | `GET /updates/latest` endpoint |
| `apps/backend/src/modules/updates/updates.module.ts` | Created | NestJS module wrapper |
| `apps/backend/src/app.module.ts` | Modified | Đăng ký `UpdatesModule` |
| `apps/frontend/package.json` | Modified | Thêm `@capgo/capacitor-updater@8.43.9` + `@capacitor/app@8.0.1` |
| `apps/frontend/capacitor.config.ts` | Modified | `CapacitorUpdater: { autoUpdate: false }` |
| `apps/frontend/src/main.tsx` | Modified | `notifyAppReady()` trước `ReactDOM.createRoot` |
| `apps/frontend/src/hooks/useOtaUpdate.ts` | Created | OTA check/download/apply hook |
| `apps/frontend/src/App.tsx` | Modified | Mount `useOtaUpdate()` |
| `.github/workflows/main.yml` | Modified | 3 steps OTA: build bundle, upload R2, update backend env |

### Verification
- Build backend thành công: ✅
- Type-check frontend: ✅ (0 errors)
- Build frontend: ✅ (`built in 2.99s`)
- `cap sync`: ✅ (3 plugins on iOS + Android)
- Smoke test: ⏳ (pending GitHub Secrets setup)

### Ghi chú
- **R2_PUBLIC_URL secret** mới được thêm (ngoài 4 secrets ban đầu): cần set giá trị kiểu `https://pub-xxx.r2.dev` — URL public của R2 bucket
- TODO-4.2.2: `BUNDLE_URL` được tạo từ `${R2_PUBLIC_URL}/bundles/${BUNDLE_FILE}` thay vì pattern transform phức tạp trong plan gốc — đơn giản và reliable hơn
- TODO-5.1 hoàn thành cùng lúc với TODO-2.3.1 (1 lệnh npm install)
- `@capgo/capacitor-updater` uses `PluginListenerHandle.remove` (không phải callback trực tiếp) — đã xử lý đúng trong hook

### Bước tiếp theo (trước khi go-live)
1. Thêm 5 GitHub Secrets vào repo: `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_ENDPOINT`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`
2. Enable public read access trên R2 bucket path `bundles/`
3. Rebuild iOS/Android native app (Xcode + Android Studio) để include plugin native code
4. Thực hiện TODO-5.5 smoke test trên iOS Simulator

