# TICKET-019 — Tạo icon & logo đầy đủ kích thước cho iOS, Android, PWA

## Mô tả
App hiện tại vẫn đang dùng icon mặc định của Capacitor (Android: robot teal, iOS: chưa có PNG thực tế). Source SVG của PolyLex đã có nhưng chưa được generate ra đủ kích thước cho iOS, Android và PWA. Cần tạo bộ icon hoàn chỉnh từ source SVG, đáp ứng tất cả kích thước yêu cầu của từng platform.

## Môi trường
- Frontend: `apps/frontend/` (Vite + React + Capacitor)
- iOS project: `apps/frontend/ios/App/`
- Android project: `apps/frontend/android/`
- PWA: `apps/frontend/public/icons/`

## Hành vi mong đợi
- **iOS**: App Store + Home Screen hiển thị icon PolyLex (gradient tím/indigo)
- **Android**: Launcher hiển thị icon PolyLex với adaptive icon support
- **PWA**: Install prompt, Add to Home Screen hiển thị icon PolyLex đúng kích thước

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-019 |
| **Tiêu đề** | Tạo icon & logo đầy đủ kích thước cho iOS, Android, PWA |
| **Mục tiêu** | Thay thế Capacitor default icons bằng PolyLex brand icon, đủ kích thước cho 3 platform |
| **Phạm vi** | Frontend assets (PWA), iOS AppIcon.appiconset, Android mipmap + adaptive icons |
| **Độ ưu tiên** | Cao — icon là brand identity, Capacitor default vẫn hiển thị trên iOS/Android |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Cải thiện SVG source icon | Redesign source SVG để render rõ ở kích thước nhỏ (20px, 29px) | Frontend assets | Trung bình |
| REQ-02 | Generate & cập nhật PWA icons | Bổ sung size 144, 256, 384 còn thiếu; update pwa-assets.config.ts và vite.config.ts | PWA | Nhỏ |
| REQ-03 | Tạo iOS AppIcon đầy đủ kích thước | Generate tất cả kích thước iOS (1024×1024 universal + Contents.json) và copy vào AppIcon.appiconset | iOS Xcode | Trung bình |
| REQ-04 | Tạo Android mipmap icons | Replace Capacitor default: generate PNG tại mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi (regular + round) | Android | Trung bình |
| REQ-05 | Tạo Android adaptive icon (vector) | Thay thế background.xml + foreground.xml bằng PolyLex branding | Android | Nhỏ |
| REQ-06 | Automation script generate icons | Script `generate-icons.ts` dùng `sharp` để tự động generate tất cả từ SVG source | DevOps/Scripts | Trung bình || REQ-07 | Update splash screen iOS + Android | Replace Capacitor default splash bằng PolyLex branded splash (dark bg + centered logo) | iOS + Android | Nhỏ |
#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 (SVG source cần hoàn thiện trước khi generate)
       └──> REQ-03
       └──> REQ-04
       └──> REQ-05
       └──> REQ-07

REQ-06 ──> (thực thi REQ-02, REQ-03, REQ-04) — automation của 3 REQ trên

REQ-02, REQ-03, REQ-04, REQ-05, REQ-07: Độc lập nhau sau khi REQ-01 xong
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Cải thiện SVG source icon
- **Mục tiêu**: SVG hiện tại dùng nhiều rect phức tạp — khi render ở 20×20px (iOS notification) sẽ mờ. Cần đơn giản hóa mark, đặc biệt đảm bảo readable ở small sizes.
- **Đầu vào**: `public/icons/icon.svg` (hiện tại: chữ "P" từ nhiều rect + 3 circle accent)
- **Đầu ra mong đợi**: SVG clear, bold mark đọc được ở 20px, vẫn đẹp ở 1024px
- **Tiêu chí hoàn thành**: Render SVG ở 20×20 vẫn nhận ra là "PL" hoặc mark PolyLex
- **Phụ thuộc**: Không

##### REQ-02: Generate & cập nhật PWA icons
- **Mục tiêu**: PWA hiện thiếu size 144×144 (Windows tiles, Chrome legacy). Cần bổ sung và update manifest.
- **Đầu vào**: `pwa-assets.config.ts`, `vite.config.ts`
- **Đầu ra mong đợi**: Manifest có đủ ios: 180, pwa: 64/144/192/512, maskable: 512
- **Tiêu chí hoàn thành**: `npx @vite-pwa/assets-generator` tạo `pwa-144x144.png`; `vite.config.ts` manifest có entry size 144
- **Phụ thuộc**: REQ-01

##### REQ-03: Tạo iOS AppIcon đầy đủ kích thước
- **Mục tiêu**: `AppIcon.appiconset/Contents.json` hiện chỉ có 1 entry (1024×1024 universal). Xcode 13+ hỗ trợ single 1024 universal, nhưng cần PNG thực tế từ PolyLex SVG (không phải Capacitor default).
- **Đầu vào**: SVG source → generate PNG 1024×1024 → copy vào AppIcon.appiconset
- **Đầu ra mong đợi**: `AppIcon-512@2x.png` (1024px) là PolyLex icon (background `#0F172A`, rounded không cần — Xcode tự clip)
- **Tiêu chí hoàn thành**: Mở Xcode → General → App Icons → thấy PolyLex icon
- **Phụ thuộc**: REQ-01, REQ-06

##### REQ-04: Tạo Android mipmap icons
- **Mục tiêu**: Thay thế toàn bộ `ic_launcher.png` và `ic_launcher_round.png` tại 5 mipmap densities bằng PolyLex icon.
- **Đầu vào**: SVG source → generate PNG theo bảng kích thước Android
- **Đầu ra mong đợi**:

  | Density | Thư mục | Kích thước |
  |---------|---------|-----------|
  | mdpi | mipmap-mdpi | 48×48 |
  | hdpi | mipmap-hdpi | 72×72 |
  | xhdpi | mipmap-xhdpi | 96×96 |
  | xxhdpi | mipmap-xxhdpi | 144×144 |
  | xxxhdpi | mipmap-xxxhdpi | 192×192 |

- **Tiêu chí hoàn thành**: Tất cả `ic_launcher.png` và `ic_launcher_round.png` là PolyLex icon
- **Phụ thuộc**: REQ-01, REQ-06

##### REQ-05: Android adaptive icon (vector)
- **Mục tiêu**: Thay `ic_launcher_background.xml` (teal Capacitor) và `ic_launcher_foreground.xml` bằng PolyLex colors + logo.
- **Đầu vào**: Android vector drawable XML
- **Đầu ra mong đợi**: Background `#0F172A` (navy), foreground là simplified "PL" mark màu `#6366F1`/`#A78BFA`
- **Tiêu chí hoàn thành**: Android adaptive icon hiển thị đúng màu PolyLex
- **Phụ thuộc**: REQ-01

##### REQ-06: Automation script generate icons
- **Mục tiêu**: Script `scripts/generate-icons.ts` dùng `sharp` để tự động generate tất cả kích thước cần thiết từ SVG, copy đúng vị trí
- **Đầu vào**: `public/icons/icon.svg`
- **Đầu ra mong đợi**: Chạy `npx tsx scripts/generate-icons.ts` → tất cả PNG được tạo tại đúng thư mục
- **Tiêu chí hoàn thành**: Script chạy thành công, không manual step nào cần thiết
- **Phụ thuộc**: REQ-01

##### REQ-07: Update splash screen iOS + Android
- **Mục tiêu**: Thay thế Capacitor default splash screen bằng PolyLex branded splash: nền dark `#0F172A`, logo "P" centered, giống design app
- **Đầu vào**: `ios/App/App/Assets.xcassets/Splash.imageset/Contents.json`, SVG source
- **Đầu ra mong đợi**: iOS splash là `2732×2732` PNG centered logo trên dark background; Android `splash.png` tương tự
- **Tiêu chí hoàn thành**: Khi launch app, splash screen hiển thị PolyLex logo (không phải Capacitor teal)
- **Phụ thuộc**: REQ-01, REQ-06

---

### 3. Ngữ cảnh nghiệp vụ

- **Brand identity**: PolyLex dùng màu `#6366F1` (indigo) → `#A78BFA` (violet) gradient trên nền `#0F0F1A`/`#0F172A` (dark navy)
- **Logo hiện tại**: Chữ "P" lớn (pixel art style) + 3 circle accent nhỏ thể hiện đa ngôn ngữ
- **App name**: "PolyLex" — `short_name: 'PolyLex'`
- **Luồng bị ảnh hưởng**: 
  - Người dùng install PWA → thấy icon trên Home Screen
  - Người dùng install iOS App → thấy icon trên App Store + Home Screen
  - Người dùng install Android App → thấy adaptive icon tại Launcher
- **Hành vi cần bảo toàn**: File `manifest.webmanifest` đang được PWA workbox cache — cần giữ nguyên icon path conventions (`/icons/pwa-*.png`)

---

### 4. Ngữ cảnh kỹ thuật

#### Trạng thái hiện tại

**PWA** (`public/icons/`):
- ✅ Source: `icon.svg` — PolyLex brand
- ✅ Generated: `pwa-64x64.png`, `pwa-192x192.png`, `pwa-512x512.png`, `maskable-icon-512x512.png`, `apple-touch-icon-180x180.png`, `favicon.ico`
- ❌ Thiếu: `pwa-144x144.png` (needed cho Windows tiles, Chrome Android legacy)
- ⚠️ `pwa-assets.config.ts` chỉ config sizes `[64, 192, 512]`

**iOS** (`ios/App/App/Assets.xcassets/AppIcon.appiconset/`):
- `Contents.json`: Chỉ có 1 entry `AppIcon-512@2x.png` (1024×1024 universal) — Xcode 13+ format ✅
- ❌ Chưa có file `AppIcon-512@2x.png` trong thư mục (hoặc là Capacitor default PNG)
- Xcode 26.3 dùng `"platform": "ios", "size": "1024x1024"` — single image đủ rồi

**Android** (`android/app/src/main/res/`):
- ❌ `ic_launcher_background.xml`: Capacitor default teal (`#26A69A`) + grid lines
- ❌ `ic_launcher_foreground.xml`: Capacitor robot icon (white vector)
- ❌ `mipmap-*/ic_launcher.png` + `ic_launcher_round.png`: Capacitor default images
- ✅ `mipmap-anydpi-v26/ic_launcher.xml` + `ic_launcher_round.xml`: adaptive icon references — có thể reuse

#### Tools có sẵn
- `@vite-pwa/assets-generator` — đã installed, dùng được cho PWA
- `pwa-assets.config.ts` — đã có, cần update
- `sharp` — cần install thêm (`npm install --save-dev sharp tsx`)
- Capacitor: `npx cap sync` để sync web assets vào native

**Splash screen hiện tại:**

iOS (`Splash.imageset/Contents.json`): 3 file `splash-2732x2732.png` (×1, ×2, ×3) — đều là Capacitor default

Android splash: 11 file PNG tại các drawable-port/land-* densities — đều là Capacitor default

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| SVG có nhiều rect phức tạp → blur ở 20px | SVG simplified, readable ở 20px | Redesign SVG |
| PWA thiếu `pwa-144x144.png` | Manifest có size 144 | Thêm vào pwa-assets.config.ts |
| iOS chưa có PNG thực tế (Capacitor default) | `AppIcon-512@2x.png` = PolyLex 1024px | Generate PNG, copy vào appiconset |
| Android dùng Capacitor teal default icons | `ic_launcher.png` = PolyLex icon toàn bộ densities | Generate 10 PNG (5 densities × 2 variants) |
| Android adaptive: teal background, robot foreground | background `#0F172A`, foreground "PL" mark | Viết lại 2 XML vector |
| Splash screen iOS: 3× Capacitor default PNG | Splash PNG = logo PolyLex centered trên `#0F172A` | Generate 3 splash PNG (2732×2732) |
| Splash screen Android: 11× Capacitor default PNG | Splash PNG = logo PolyLex cho mọi orientation/density | Generate splash PNG cho ~11 drawable dir |
| Không có automation script | `scripts/generate-icons.ts` chạy 1 lệnh | Tạo script mới |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Brand mismatch**: SVG hiện tại nặng về detail → mất ở size nhỏ (20-48px) — **Biện pháp**: Thiết kế lại SVG đơn giản hơn, bold hơn; thêm padding đủ
- [ ] **iOS App Store review**: Icon 1024×1024 không được có alpha channel, không bo góc (Xcode tự xử lý) — **Biện pháp**: Xuất với background solid `#0F172A`

#### 6.2 Rủi ro kỹ thuật
- [ ] **sharp native bindings**: `sharp` cần native binary → có thể cần `npm rebuild` sau install — **Biện pháp**: Dùng `@resvg/resvg-js` nếu `sharp` fail; hoặc dùng `@vite-pwa/assets-generator` chạy offline
- [ ] **iOS: Capacitor sync override**: `npx cap sync` có thể override assets — **Biện pháp**: Kiểm tra Capacitor config để confirm assets không bị overwrite khi sync
- [ ] **Android round icon**: Round variant cần clip vòng tròn, không chỉ scale PNG — **Biện pháp**: Dùng sharp với `{ fit: 'contain', background: '#0F172A' }` + composite circle mask
- [ ] **PWA cache**: Manifest đang được Workbox cache — thay đổi icon path sẽ trigger cache invalidation  — **Biện pháp**: Giữ nguyên naming convention (`pwa-*.png`), không đổi path

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **pwa-assets.config.ts transparent vs maskable**: Maskable icon cần safe zone 20% padding — `@vite-pwa/assets-generator` xử lý qua `padding: 0.3` — đã đúng
- [ ] **Android API < 26 không có adaptive icons**: Cần fallback PNG tại tất cả mipmap densities — đã cover bởi REQ-04

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Automation script → dễ re-generate khi đổi brand | Cần install `sharp` (native dependency) |
| Single SVG source → consistent brand toàn platform | Mất thời gian redesign SVG cho small size readability |
| Đáp ứng đầy đủ Apple/Google/PWA guidelines | Android adaptive icon vector phức tạp hơn PNG đơn giản |
| `@vite-pwa/assets-generator` giữ nguyên workflow PWA existing | — |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**:
  1. Viết lại SVG đơn giản + bold hơn (letter "PL" hoặc đơn giản chỉ "P" với gradient) — đọc được ở 20px
  2. Dùng `@vite-pwa/assets-generator` cho PWA icons (đã có config) — chỉ cần update sizes trong config
  3. Viết script `scripts/generate-icons.ts` dùng `sharp` để generate iOS + Android PNG
  4. Viết lại Android adaptive icon XML (background/foreground) với PolyLex colors
  5. Copy 1024px PNG vào iOS appiconset

- **Cách tiếp cận thay thế**: Dùng tool online (appicon.co, makeappicon.com) để generate → manual copy — nhanh nhưng không reproducible, không automation
- **Phụ thuộc**: `sharp`, `tsx` (devDependencies)
- **Ước tính công sức**: ~2-3 giờ (SVG redesign + script + integration)

---

### 9. Câu hỏi mở
- [x] **SVG design**: Giữ nguyên thiết kế "P" phức tạp hay đơn giản hóa? → **Quyết định**: Giữ chữ "P", đơn giản hóa cho rõ hơn ở small sizes, giữ màu brand gradient indigo/violet
- [x] **Splash screen**: Có cần update không? → **Quyết định**: Có — update cả splash screen iOS + Android
- [x] **Custom logo**: Design hoàn toàn mới hay giữ "PL"? → **Quyết định**: Giữ chữ "P" làm mark chính, đơn giản bold hơn

> **Scope update**: Thêm **REQ-07** — Update splash screen iOS (`Splash.imageset`) và Android (`splash.png` nếu có)

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Redesign SVG source thành dạng bold/simple, tạo automation script dùng `sharp` để generate toàn bộ PNG icon và splash cho iOS + Android, đồng thời bổ sung kích thước 144px còn thiếu cho PWA — tất cả từ một lệnh duy nhất `npm run generate:icons`.

---

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: `icon.svg` readable ở 20×20px sau khi simplify
2. FR-02: PWA manifest có đủ sizes: 64, 144, 192, 512 (transparent) + 512 (maskable) + 180 (apple)
3. FR-03: iOS `AppIcon-512@2x.png` (1024×1024) là PolyLex icon, solid bg, no alpha
4. FR-04: Android mipmap `ic_launcher.png` + `ic_launcher_round.png` tại 5 densities là PolyLex icon
5. FR-05: Android adaptive icon background = `#0F172A`, foreground = PolyLex icon PNG
6. FR-06: iOS splash 3× `2732×2732` = PolyLex logo centered trên `#0F172A`
7. FR-07: Android splash 11 files (6 portrait + 5 landscape) = PolyLex logo centered trên `#0F172A`
8. FR-08: Script `npm run generate:icons` tự động sinh tất cả assets trên

#### Ràng buộc phi chức năng
1. NFR-01: iOS AppIcon không có alpha channel (App Store requirement)
2. NFR-02: Maskable PWA icon phải có safe zone 20% (đã đúng với `padding: 0.3`)
3. NFR-03: Giữ nguyên naming convention PWA (`/icons/pwa-*.png`) để không phá Workbox cache
4. NFR-04: Không dùng `npx cap sync` để override assets — files trong native project được commit trực tiếp

#### Phụ thuộc
- DEP-01: `sharp` (npm) — SVG→PNG conversion với native bindings
- DEP-02: `tsx` (npm) — chạy TypeScript script trực tiếp
- DEP-03: `@vite-pwa/assets-generator` — đã có, dùng cho PWA icons
- DEP-04: `icon.svg` redesign (REQ-01) phải xong trước các phase còn lại

---

### Cách tiếp cận
> Phase 1 redesign SVG source. Phase 2 bổ sung PWA 144px qua tool hiện có. Phase 3 viết script `sharp` để generate tất cả iOS + Android PNG. Phase 4 thực thi script. Phase 5 cập nhật Android adaptive XML vectors. Phase 6 integration và verify.

---

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/frontend/public/icons/icon.svg` | Simplified "P" mark, bold, readable ở 20px |
| Tạo mới | `apps/frontend/public/icons/splash.svg` | Splash source: 2732×2732, dark bg, centered logo |
| Sửa đổi | `apps/frontend/pwa-assets.config.ts` | Thêm size 144 vào transparent |
| Sửa đổi | `apps/frontend/vite.config.ts` | Thêm `pwa-144x144.png` vào manifest icons |
| Sửa đổi | `apps/frontend/package.json` | Thêm deps sharp+tsx, script generate:icons |
| Tạo mới | `apps/frontend/scripts/generate-icons.ts` | Automation script — toàn bộ PNG generation |
| Sửa đổi | `apps/frontend/android/app/src/main/res/values/ic_launcher_background.xml` | Color `#0F172A` |
| Sửa đổi | `apps/frontend/android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml` | PolyLex "P" vector |
| Sửa đổi | `apps/frontend/android/app/src/main/res/drawable/ic_launcher_background.xml` | PolyLex dark bg vector |
| Generated | `apps/frontend/public/icons/pwa-144x144.png` | Via @vite-pwa/assets-generator |
| Generated | `apps/frontend/ios/.../AppIcon.appiconset/AppIcon-512@2x.png` | Via script, 1024×1024 |
| Generated | `apps/frontend/ios/.../Splash.imageset/splash-2732x2732*.png` (3 files) | Via script |
| Generated | `apps/frontend/android/.../mipmap-*/ic_launcher*.png` (15 files) | Via script |
| Generated | `apps/frontend/android/.../drawable-*/splash.png` (11 files) | Via script |

---

## PLAN TODO

### Phase 1: SVG Source Assets

#### REQ-01: Cải thiện SVG source icon

- [ ] **TODO-1.1.1**: Redesign `icon.svg` — simplified bold "P" mark, readable ở 20px
  - **File**: `apps/frontend/public/icons/icon.svg`
  - **Context**: Đọc file hiện tại để giữ màu brand; xem `src/index.css` để lấy brand colors
  - **Thay đổi**: Thay thế toàn bộ nội dung SVG bằng thiết kế mới:
    - Viewbox: `0 0 512 512`, background rect `#0F172A` `rx="96"`
    - Chữ "P" dùng 2 rect (stem + bowl) bold — không dùng nhiều rect nhỏ như hiện tại
    - Stem: `x="112" y="112" width="72" height="288" rx="20"` gradient `#6366F1→#A78BFA`
    - Bowl top: `x="112" y="112" width="192" height="72" rx="20"` gradient
    - Bowl mid: `x="112" y="240" width="192" height="72" rx="20"` gradient
    - Bowl arc: ellipse/path đơn giản nối stem+bowl thành hình "P" đầy đặn
    - Không dùng circle accent (quá nhỏ khi render 20px)
  - **Verify**: Mở file trong browser, resize xuống 20×20px trong DevTools → vẫn nhận ra chữ "P"
  - **Kết quả**: `icon.svg` mới, simplified, bold, export không cần rasterize vẫn clear

- [ ] **TODO-1.1.2**: Tạo `splash.svg` — splash source 2732×2732, dark bg, centered logo
  - **File**: `apps/frontend/public/icons/splash.svg`
  - **Context**: Đọc `icon.svg` vừa redesign để reuse mark
  - **Thay đổi**: Tạo file mới với:
    - Viewbox: `0 0 2732 2732`
    - Background rect full size, fill `#0F172A`
    - Nhúng "P" mark ở center (x=1110 y=1110, width=512 height=512) — translate/scale từ icon.svg
    - Dưới logo: text "PolyLex" (optional — có thể bỏ nếu muốn minimal)
  - **Verify**: Mở SVG trong browser, thấy logo PolyLex centered trên nền dark
  - **Kết quả**: `splash.svg` mới tại `public/icons/splash.svg`

---

### Phase 2: PWA Icons

#### REQ-02: Generate & cập nhật PWA icons (size 144)

- [ ] **TODO-2.2.1**: Thêm size `144` vào `pwa-assets.config.ts`
  - **File**: `apps/frontend/pwa-assets.config.ts`
  - **Context**: Đọc file hiện tại — thấy `transparent.sizes: [64, 192, 512]`
  - **Thay đổi**: Sửa `transparent.sizes` từ `[64, 192, 512]` thành `[64, 144, 192, 512]`
  - **Verify**: Đọc lại file, xác nhận array có `144`
  - **Kết quả**: Generator sẽ tạo `pwa-144x144.png` khi chạy

- [ ] **TODO-2.2.2**: Thêm entry `pwa-144x144.png` vào manifest icons trong `vite.config.ts`
  - **File**: `apps/frontend/vite.config.ts`
  - **Context**: Đọc block `manifest.icons` hiện tại (3 entries: 192, 512, 512 maskable)
  - **Thay đổi**: Thêm entry mới sau `192x192`:
    ```ts
    {
      src: '/icons/pwa-144x144.png',
      sizes: '144x144',
      type: 'image/png',
    },
    ```
  - **Verify**: `npm run build` thành công, `dist/manifest.webmanifest` có size 144
  - **Kết quả**: PWA manifest đủ sizes

- [ ] **TODO-2.2.3**: Chạy `@vite-pwa/assets-generator` để generate `pwa-144x144.png`
  - **File**: `apps/frontend/public/icons/pwa-144x144.png` (file được tạo ra)
  - **Context**: Đọc `pwa-assets.config.ts` — đảm bảo size 144 đã được thêm ở TODO-2.2.1
  - **Thay đổi**: Chạy lệnh: `cd apps/frontend && npx @vite-pwa/assets-generator --config pwa-assets.config.ts`
  - **Verify**: `ls public/icons/` thấy `pwa-144x144.png` mới
  - **Kết quả**: `pwa-144x144.png` (144×144px) được tạo tại `public/icons/`

---

### Phase 3: Script Automation Setup

#### REQ-06: Automation script generate icons

- [ ] **TODO-3.6.1**: Cài đặt `sharp` và `tsx` vào devDependencies
  - **File**: `apps/frontend/package.json`
  - **Context**: Đọc `devDependencies` hiện tại để tránh trùng
  - **Thay đổi**: Chạy `cd apps/frontend && npm install --save-dev sharp tsx @types/sharp`
  - **Verify**: `cat package.json | grep -E '"sharp|"tsx'` hiển thị phiên bản installed
  - **Kết quả**: `sharp`, `tsx`, `@types/sharp` xuất hiện trong `devDependencies`

- [ ] **TODO-3.6.2**: Thêm script `generate:icons` vào `package.json`
  - **File**: `apps/frontend/package.json`
  - **Context**: Đọc block `"scripts"` hiện tại
  - **Thay đổi**: Thêm dòng sau vào `"scripts"`:
    ```json
    "generate:icons": "tsx scripts/generate-icons.ts"
    ```
  - **Verify**: `cat package.json | grep generate:icons`
  - **Kết quả**: Script có thể chạy bằng `npm run generate:icons`

- [ ] **TODO-3.6.3**: Tạo phần khởi tạo và iOS icon generation trong `scripts/generate-icons.ts`
  - **File**: `apps/frontend/scripts/generate-icons.ts`
  - **Context**: Đọc `public/icons/icon.svg` để biết source path; đọc `ios/App/App/Assets.xcassets/AppIcon.appiconset/Contents.json` để xác nhận output filename
  - **Thay đổi**: Tạo file mới với:
    ```ts
    import sharp from 'sharp';
    import { readFileSync, mkdirSync } from 'fs';
    import { resolve, dirname } from 'path';
    import { fileURLToPath } from 'url';

    const __dirname = dirname(fileURLToPath(import.meta.url));
    const root = resolve(__dirname, '..');

    const iconSvg = readFileSync(resolve(root, 'public/icons/icon.svg'));
    const splashSvg = readFileSync(resolve(root, 'public/icons/splash.svg'));

    async function generate(svgBuffer: Buffer, size: number, outPath: string) {
      mkdirSync(dirname(outPath), { recursive: true });
      await sharp(svgBuffer).resize(size, size).png().toFile(outPath);
      console.log(`✓ ${outPath} (${size}×${size})`);
    }

    async function main() {
      console.log('🎨 Generating iOS AppIcon (1024×1024)...');
      await generate(
        iconSvg, 1024,
        resolve(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png')
      );
    }

    main().catch(console.error);
    ```
  - **Verify**: `npm run generate:icons` creates `AppIcon-512@2x.png`; check `ls ios/.../AppIcon.appiconset/`
  - **Kết quả**: Script khởi chạy được, iOS AppIcon được tạo

- [ ] **TODO-3.6.4**: Thêm Android mipmap generation vào `scripts/generate-icons.ts`
  - **File**: `apps/frontend/scripts/generate-icons.ts`
  - **Context**: Đọc file hiện tại; xem structure `android/app/src/main/res/mipmap-*/`
  - **Thay đổi**: Trong function `main()`, thêm sau iOS section:
    ```ts
    console.log('🤖 Generating Android mipmap icons...');
    const androidMipmaps = [
      { density: 'mdpi',    size: 48  },
      { density: 'hdpi',    size: 72  },
      { density: 'xhdpi',   size: 96  },
      { density: 'xxhdpi',  size: 144 },
      { density: 'xxxhdpi', size: 192 },
    ];
    for (const { density, size } of androidMipmaps) {
      const dir = resolve(root, `android/app/src/main/res/mipmap-${density}`);
      await generate(iconSvg, size, resolve(dir, 'ic_launcher.png'));
      await generate(iconSvg, size, resolve(dir, 'ic_launcher_round.png'));
      await generate(iconSvg, size, resolve(dir, 'ic_launcher_foreground.png'));
    }
    ```
    - `ic_launcher_round.png` dùng cùng SVG (square icon; Android sẽ tự clip thành circle cho round variant) 
  - **Verify**: `npm run generate:icons` → `ls android/.../mipmap-mdpi/` hiển thị 3 file PNG PolyLex
  - **Kết quả**: 15 PNG mipmap files (5 densities × 3 variants) được generate

- [ ] **TODO-3.6.5**: Thêm iOS splash generation vào `scripts/generate-icons.ts`
  - **File**: `apps/frontend/scripts/generate-icons.ts`
  - **Context**: Đọc `ios/.../Splash.imageset/Contents.json` — thấy 3 filenames: `splash-2732x2732.png`, `splash-2732x2732-1.png`, `splash-2732x2732-2.png`
  - **Thay đổi**: Thêm trong `main()`:
    ```ts
    console.log('📱 Generating iOS splash screens...');
    const splashDir = resolve(root, 'ios/App/App/Assets.xcassets/Splash.imageset');
    const splashFiles = ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png'];
    for (const filename of splashFiles) {
      await generate(splashSvg, 2732, resolve(splashDir, filename));
    }
    ```
  - **Verify**: `npm run generate:icons` → `ls ios/.../Splash.imageset/` hiển thị 3 PNG
  - **Kết quả**: 3 iOS splash PNG (2732×2732) được generate từ `splash.svg`

- [ ] **TODO-3.6.6**: Thêm Android splash generation vào `scripts/generate-icons.ts`
  - **File**: `apps/frontend/scripts/generate-icons.ts`
  - **Context**: Đọc output của `find android -name "splash.png"` — thấy 11 paths trong drawable-port/land-* + drawable/
  - **Thay đổi**: Thêm trong `main()`:
    ```ts
    console.log('🤖 Generating Android splash screens...');
    const androidSplash = [
      { dir: 'drawable',               w: 480,  h: 800  },
      { dir: 'drawable-port-mdpi',     w: 320,  h: 480  },
      { dir: 'drawable-port-hdpi',     w: 480,  h: 800  },
      { dir: 'drawable-port-xhdpi',    w: 720,  h: 1280 },
      { dir: 'drawable-port-xxhdpi',   w: 960,  h: 1600 },
      { dir: 'drawable-port-xxxhdpi',  w: 1280, h: 1920 },
      { dir: 'drawable-land-mdpi',     w: 480,  h: 320  },
      { dir: 'drawable-land-hdpi',     w: 800,  h: 480  },
      { dir: 'drawable-land-xhdpi',    w: 1280, h: 720  },
      { dir: 'drawable-land-xxhdpi',   w: 1600, h: 960  },
      { dir: 'drawable-land-xxxhdpi',  w: 1920, h: 1280 },
    ];
    for (const { dir, w, h } of androidSplash) {
      const outPath = resolve(root, `android/app/src/main/res/${dir}/splash.png`);
      mkdirSync(dirname(outPath), { recursive: true });
      // Render splash.svg centered on background of correct size
      await sharp(splashSvg)
        .resize(Math.min(w, h), Math.min(w, h))  // fit logo in shorter dimension
        .toBuffer()
        .then(logo =>
          sharp({ create: { width: w, height: h, channels: 4, background: '#0F172A' } })
            .composite([{ input: logo, gravity: 'center' }])
            .png()
            .toFile(outPath)
        );
      console.log(`✓ ${dir}/splash.png (${w}×${h})`);
    }
    ```
  - **Verify**: `npm run generate:icons` → `ls android/.../drawable/splash.png` exists; check file size > 0
  - **Kết quả**: 11 Android splash PNG được generate tại đúng drawable dirs

---

### Phase 4: Android Adaptive Icon XML

#### REQ-05: Android adaptive icon XML

- [ ] **TODO-4.5.1**: Cập nhật màu background adaptive icon trong `values/ic_launcher_background.xml`
  - **File**: `apps/frontend/android/app/src/main/res/values/ic_launcher_background.xml`
  - **Context**: Đọc `mipmap-anydpi-v26/ic_launcher.xml` — xác nhận reference là `@color/ic_launcher_background`
  - **Thay đổi**: Sửa giá trị color từ `#FFFFFF` thành `#0F172A`:
    ```xml
    <color name="ic_launcher_background">#0F172A</color>
    ```
  - **Verify**: Đọc lại file — thấy `#0F172A`
  - **Kết quả**: Android adaptive icon background = dark navy PolyLex

- [ ] **TODO-4.5.2**: Thay thế `drawable/ic_launcher_background.xml` bằng PolyLex dark bg vector
  - **File**: `apps/frontend/android/app/src/main/res/drawable/ic_launcher_background.xml`
  - **Context**: File hiện tại là Capacitor teal `#26A69A` vector với nhiều grid lines — cần thay hoàn toàn
  - **Thay đổi**: Thay bằng vector đơn giản:
    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <vector xmlns:android="http://schemas.android.com/apk/res/android"
        android:width="108dp"
        android:height="108dp"
        android:viewportWidth="108"
        android:viewportHeight="108">
        <path
            android:fillColor="#0F172A"
            android:pathData="M0,0h108v108h-108z"/>
    </vector>
    ```
  - **Verify**: Đọc lại file — thấy dark color và không còn grid lines
  - **Kết quả**: Background vector = solid `#0F172A`

- [ ] **TODO-4.5.3**: Thay thế `drawable-v24/ic_launcher_foreground.xml` bằng PolyLex "P" vector
  - **File**: `apps/frontend/android/app/src/main/res/drawable-v24/ic_launcher_foreground.xml`
  - **Context**: File hiện tại là Capacitor robot icon vector; cần thay bằng "P" mark đơn giản
  - **Thay đổi**: Thay bằng vector "P" mark (108dp canvas, safe zone nội tâm 72dp, centered):
    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <vector xmlns:android="http://schemas.android.com/apk/res/android"
        android:width="108dp"
        android:height="108dp"
        android:viewportWidth="108"
        android:viewportHeight="108">
        <!-- Stem -->
        <path
            android:fillColor="#6366F1"
            android:pathData="M30,20 L30,88 Q30,92 34,92 L44,92 Q48,92 48,88 L48,20 Q48,16 44,16 L34,16 Q30,16 30,20Z"/>
        <!-- Bowl top bar -->
        <path
            android:fillColor="#6366F1"
            android:pathData="M30,16 L72,16 Q83,16 83,27 L83,27 Q83,38 72,38 L30,38 L30,16Z"/>
        <!-- Bowl mid bar -->
        <path
            android:fillColor="#A78BFA"
            android:pathData="M30,50 L68,50 Q78,50 78,61 L78,61 Q78,72 68,72 L30,72 L30,50Z"/>
    </vector>
    ```
  - **Verify**: Đọc lại file — thấy PolyLex colors `#6366F1`/`#A78BFA` và không còn robot
  - **Kết quả**: Adaptive icon foreground vector = PolyLex "P" mark

---

### Phase 5: Thực thi Script

#### REQ-03 + REQ-04 + REQ-07: Generate tất cả PNG assets

- [ ] **TODO-5.1**: Chạy automation script để generate tất cả PNG icons và splashes
  - **File**: (không có file cụ thể — run command)
  - **Context**: Đảm bảo TODO-1.1.1, TODO-1.1.2, TODO-3.6.1→3.6.6 đã hoàn thành
  - **Thay đổi**: Chạy: `cd apps/frontend && npm run generate:icons`
  - **Verify**: Kiểm tra output:
    - `ls ios/App/App/Assets.xcassets/AppIcon.appiconset/` → `AppIcon-512@2x.png` size > 100KB
    - `ls ios/App/App/Assets.xcassets/Splash.imageset/*.png` → 3 files
    - `ls android/app/src/main/res/mipmap-xxxhdpi/` → có 3 `ic_launcher*.png` mới
    - `ls android/app/src/main/res/drawable/splash.png` → exists
  - **Kết quả**: Tất cả 30+ PNG files được generate, không có error trong console

---

### Phase 6: Integration & Verification

- [ ] **TODO-6.1**: Build frontend production để xác nhận không có lỗi TypeScript/CSS
  - **File**: (command)
  - **Context**: Không cần
  - **Thay đổi**: Chạy `cd apps/frontend && nvm use v23 && npm run build`
  - **Verify**: `dist/manifest.webmanifest` có đủ 4 icon entries (64, 144, 192, 512)
  - **Kết quả**: Build thành công, manifest đủ sizes

- [ ] **TODO-6.2**: Verify PWA manifest có đủ icon sizes
  - **File**: (check command)
  - **Context**: Không cần
  - **Thay đổi**: Chạy `cat apps/frontend/dist/manifest.webmanifest | grep sizes`
  - **Verify**: Output có `144x144`, `192x192`, `512x512`, `180` (apple touch)
  - **Kết quả**: PWA icon manifest đầy đủ

- [ ] **TODO-6.3**: Smoke test PWA icon trên Chrome mobile emulation
  - **File**: (manual)
  - **Context**: Chạy `npm run dev` tại `apps/frontend`
  - **Thay đổi**: Mở DevTools → Application → Manifest → xem icon PolyLex được hiển thị đúng
  - **Verify**: Tất cả icon entries trong manifest tab hiển thị PolyLex logo (không phải chữ "PL" text mặc định)
  - **Kết quả**: PWA manifest icons ✅

- [ ] **TODO-6.4**: Smoke test iOS icon trong Xcode (visual check)
  - **File**: (manual)
  - **Context**: Mở `ios/App/App.xcodeproj`
  - **Thay đổi**: Xcode → App target → General → App Icons → Xem `AppIcon.appiconset`
  - **Verify**: Icon 1024×1024 hiển thị PolyLex gradient logo
  - **Kết quả**: iOS AppIcon ✅

---

## Ghi chú triển khai
- Script dùng `import.meta.url` nên cần `"type": "module"` trong package.json hoặc thêm `.js` extension — dùng `tsx` sẽ tự handle
- `sharp` SVG rendering yêu cầu `librsvg` trên Linux/macOS — đã built-in khi install trên macOS với Homebrew node
- Android `ic_launcher_round.png`: Capacitor dùng PNG round icon; `sharp` chưa tự clip thành circle — round variant sẽ là rectangle với bo góc tự nhiên từ `icon.svg` (đủ dùng vì Android launcher tự clip)
- Nếu `sharp` fail convert SVG: thêm `density: 300` option vào sharp constructor: `sharp(svgBuffer, { density: 300 })`

## Rủi ro cần theo dõi
- [ ] Risk-1: `sharp` không render SVG gradient đúng (native libvips version cũ) — **Biện pháp**: Thêm option `{ density: 300 }` hoặc dùng `@resvg/resvg-js` làm fallback SVG renderer
- [ ] Risk-2: Android splash `composite` API khác nhau giữa sharp v0.32 và v0.33+ — **Biện pháp**: Kiểm tra sharp version, dùng `sharp.create()` pattern phù hợp
- [ ] Risk-3: `cap sync` override icon files sau khi generate — **Biện pháp**: Không dùng `cap sync` sau khi generate; chỉ dùng khi sync web assets
