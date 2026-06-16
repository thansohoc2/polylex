# TICKET-017: Frontend Internationalization (i18n) — Ngôn ngữ UI theo ngôn ngữ native của user

## Mô tả yêu cầu

Bổ sung tính năng đa ngôn ngữ (i18n) cho ứng dụng Frontend (React + Vite + TypeScript) để app hiển thị UI theo ngôn ngữ native của từng user. Toàn bộ text UI hiện đang hardcode bằng tiếng Anh, cần được thay thế bằng hệ thống translation key. Ngôn ngữ hiển thị được tự động xác định từ `nativeLanguageCode` trong profile của user.

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-017 |
| **Tiêu đề** | Frontend i18n — UI đa ngôn ngữ theo ngôn ngữ native của user |
| **Mục tiêu** | Thay thế toàn bộ hardcoded English string trong FE bằng translation keys; tự động render UI theo `nativeLanguageCode` của user |
| **Phạm vi** | Frontend (React/Vite) — toàn bộ pages + components; Auth store; không cần thay đổi backend |
| **Độ ưu tiên** | Trung bình |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Cài đặt & cấu hình i18n | Tích hợp thư viện `i18next` + `react-i18next`; cấu hình provider trong `main.tsx` | FE — Config | Nhỏ |
| REQ-02 | Tạo file translation | Tạo file JSON locale cho từng ngôn ngữ hỗ trợ (en, vi, ja, …); gộp toàn bộ UI keys | FE — Locale files | Trung bình |
| REQ-03 | Xác định ngôn ngữ từ user profile | Sau khi login + getMe(), đồng bộ `nativeLanguageCode` vào `i18n.changeLanguage()` | FE — Auth store | Nhỏ |
| REQ-04 | Replace hardcoded strings | Thay thế toàn bộ text hardcode trong pages/components bằng `t('key')` | FE — Pages + Components | Lớn |
| REQ-05 | Fallback & language không hỗ trợ | Khi locale chưa có bản dịch → fallback sang `en`; tránh crash | FE — i18n config | Nhỏ |
| REQ-06 | Persist ngôn ngữ UI ngoài session | Lưu ngôn ngữ đã chọn vào `localStorage` để tránh flicker khi reload trước khi fetch profile | FE — Store | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 ──> REQ-04 (tuần tự, REQ-04 phụ thuộc vào REQ-01 + REQ-02)
                 │
REQ-03 ──────────┘  (song song với REQ-02, nhưng thực thi sau REQ-01)

REQ-05 ──> (cùng lúc với REQ-01, là config của i18n)
REQ-06 ──> (sau REQ-03)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Cài đặt & cấu hình i18n
- **Mục tiêu**: Tích hợp `i18next` + `react-i18next` vào dự án; bọc app bằng `I18nextProvider`
- **Đầu vào**: `package.json`, `main.tsx`, `vite.config.ts`
- **Đầu ra mong đợi**: `src/i18n/index.ts` khởi tạo i18next; `main.tsx` import i18n trước khi render
- **Tiêu chí hoàn thành**: `useTranslation()` hook khả dụng trong mọi component
- **Phụ thuộc**: Không

##### REQ-02: Tạo file translation
- **Mục tiêu**: Tạo thư mục `src/i18n/locales/` với JSON files (ít nhất `en.json`, `vi.json`); namespaced theo module (common, nav, auth, dashboard, vocab, review, roadmap, profile, quicknote)
- **Đầu vào**: Toàn bộ hardcoded string hiện có trong các pages/components
- **Đầu ra mong đợi**: `en.json` (chuẩn), các locale khác có cùng key structure
- **Tiêu chí hoàn thành**: Không có key nào bị thiếu khi chạy ở locale bất kỳ
- **Phụ thuộc**: REQ-01

##### REQ-03: Xác định ngôn ngữ từ user profile
- **Mục tiêu**: Sau khi `userApi.getMe()` trả về, gọi `i18n.changeLanguage(user.nativeLanguageCode)` và persist vào `localStorage`
- **Đầu vào**: `user.nativeLanguageCode` từ `UserProfile` (shared-types), `auth.store.ts`
- **Đầu ra mong đợi**: Khi user login, UI tự động đổi sang ngôn ngữ native; persist qua reload
- **Tiêu chí hoàn thành**: User có `nativeLanguageCode = 'vi'` → UI hiển thị tiếng Việt
- **Phụ thuộc**: REQ-01

##### REQ-04: Replace hardcoded strings
- **Mục tiêu**: Thay thế mọi JSX string literal và attribute text bằng `const { t } = useTranslation('namespace')` + `t('key')`
- **Đầu vào**: Toàn bộ `src/pages/*.tsx`, `src/components/**/*.tsx`
- **Đầu ra mong đợi**: Không còn hardcoded UI string, mọi text render qua `t()`
- **Tiêu chí hoàn thành**: Build thành công, không có TypeScript error, UI hiển thị đúng theo locale
- **Phụ thuộc**: REQ-01, REQ-02

##### REQ-05: Fallback & language không hỗ trợ
- **Mục tiêu**: Nếu `nativeLanguageCode` chưa có file locale (vd: `ko`, `th`) → fallback về `en` tự động
- **Đầu vào**: i18n config, danh sách supported locales
- **Đầu ra mong đợi**: Không crash, hiển thị English thay vì missing key
- **Tiêu chí hoàn thành**: Test với locale không hỗ trợ → hiển thị English
- **Phụ thuộc**: REQ-01

##### REQ-06: Persist ngôn ngữ ngoài session
- **Mục tiêu**: Lưu ngôn ngữ đã xác định vào `localStorage` để khởi tạo i18n với đúng locale ngay lập tức (tránh flash tiếng Anh khi reload)
- **Đầu vào**: `i18next-browser-languagedetector` hoặc custom logic trong `i18n/index.ts`
- **Đầu ra mong đợi**: Sau reload, UI hiển thị đúng ngôn ngữ ngay khi render, trước khi API trả về
- **Tiêu chí hoàn thành**: Reload page → không thấy flash "Sign in" trước khi đổi sang "Đăng nhập"
- **Phụ thuộc**: REQ-03

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng nghiệp vụ**: User đăng nhập → `getMe()` trả về `nativeLanguageCode` (vd: `"vi"`) → UI toàn bộ ứng dụng hiển thị bằng tiếng Việt.
- **Thực thể domain liên quan**:
  - `UserProfile.nativeLanguageCode` (shared-types `index.ts`) — trường quyết định ngôn ngữ UI
  - `Language.code` (Prisma schema) — mã ngôn ngữ chuẩn ISO 639-1 (`en`, `vi`, `ja`, ...)
  - `User.nativeLanguageId` → `Language.code` (backend)
- **Quy tắc nghiệp vụ**:
  - Ngôn ngữ UI = `nativeLanguageCode` của user — không phải ngôn ngữ học (learningLanguages)
  - Nếu chưa set native language → default `en`
  - User có thể thay đổi native language trong ProfilePage → UI cập nhật ngay lập tức
- **Hành vi hiện có cần bảo toàn**:
  - `ProfilePage` cho phép user thay đổi `nativeLanguageCode` — sau khi save, UI phải reflect ngay
  - Toast messages (react-hot-toast) cần được i18n hóa
  - Tất cả error messages trong API calls cần dùng translation keys

---

### 4. Ngữ cảnh kỹ thuật

#### Triển khai hiện tại
- **Framework FE**: React 19 + Vite 5 + TypeScript 5 + Tailwind 4
- **State**: Zustand (`auth.store.ts`, `audio-settings.store.ts`)
- **Routing**: React Router DOM v6
- **Không có i18n**: Không có bất kỳ thư viện i18n nào được cài đặt
- **Toàn bộ strings hardcode**: `"Welcome back"`, `"Sign in"`, tab labels (`"Home"`, `"Review"`, ...), error messages, v.v.

#### Các file bị ảnh hưởng (scope lớn)
**Pages** (9 files):
- [apps/frontend/src/pages/LoginPage.tsx](apps/frontend/src/pages/LoginPage.tsx) — `"Welcome back"`, `"Sign in to continue learning"`, `"Invalid email or password"`, labels
- [apps/frontend/src/pages/RegisterPage.tsx](apps/frontend/src/pages/RegisterPage.tsx) — form strings
- [apps/frontend/src/pages/DashboardPage.tsx](apps/frontend/src/pages/DashboardPage.tsx) — `"Review"`, `"due"`, `"Caught up!"`, v.v.
- [apps/frontend/src/pages/ProfilePage.tsx](apps/frontend/src/pages/ProfilePage.tsx) — labels, buttons, section titles
- [apps/frontend/src/pages/VocabularyPage.tsx](apps/frontend/src/pages/VocabularyPage.tsx)
- [apps/frontend/src/pages/ReviewPage.tsx](apps/frontend/src/pages/ReviewPage.tsx)
- [apps/frontend/src/pages/RoadmapPage.tsx](apps/frontend/src/pages/RoadmapPage.tsx)
- [apps/frontend/src/pages/AnalyticsPage.tsx](apps/frontend/src/pages/AnalyticsPage.tsx)
- [apps/frontend/src/pages/QuickNotePage.tsx](apps/frontend/src/pages/QuickNotePage.tsx)

**Components** (nhiều files trong `src/components/`):
- [apps/frontend/src/components/layout/BottomNav.tsx](apps/frontend/src/components/layout/BottomNav.tsx) — tab labels `"Home"`, `"Roadmap"`, `"Notes"`, `"Review"`, `"Profile"`
- [apps/frontend/src/components/layout/TopBar.tsx](apps/frontend/src/components/layout/TopBar.tsx) — title prop (truyền từ pages)
- [apps/frontend/src/components/AddWordModal.tsx](apps/frontend/src/components/AddWordModal.tsx)
- Tất cả components trong `home/`, `vocab/`, `review/`, `roadmap/`, `quick-note/`, `ui/`

**Store**:
- [apps/frontend/src/store/auth.store.ts](apps/frontend/src/store/auth.store.ts) — cần trigger `i18n.changeLanguage()` khi `setUser()` được gọi

#### Bảng database liên quan
- `languages` — danh sách language codes hỗ trợ (dùng để biết locale nào cần translate file)
- `users.native_language_id` → `languages.code` — nguồn dữ liệu quyết định UI locale

#### Điểm tích hợp
- **FE ↔ Backend**: Chỉ đọc `nativeLanguageCode` từ `GET /users/me` response — không cần thay đổi backend API
- **Auth flow**: `LoginPage` → `userApi.getMe()` → `setUser()` → trigger `changeLanguage()`

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| Không có thư viện i18n | `i18next` + `react-i18next` được cài và cấu hình | Cần install + setup provider |
| Toàn bộ UI text hardcode bằng English | Text render qua `t('key')` | Replace ~200–400 string literals trên 20+ files |
| Ngôn ngữ UI luôn luôn là tiếng Anh | UI tự đổi ngôn ngữ theo `nativeLanguageCode` của user | Cần hook `setUser()` vào `changeLanguage()` |
| Không có file locale | `src/i18n/locales/en.json`, `vi.json` (ít nhất) | Cần tạo file và điền đầy đủ keys |
| Không có fallback | Fallback tự động về `en` nếu locale không hỗ trợ | Cần cấu hình fallbackLng trong i18next |
| Không persist locale | Locale lưu vào `localStorage`, restore khi reload | Cần persist logic |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Scope lớn**: Số lượng strings cần replace nhiều (~200–400) dải khắp 20+ file — dễ bỏ sót → Dùng ESLint plugin `i18next` để detect hardcoded strings còn sót
- [ ] **Bản dịch không chính xác**: Text tiếng Việt/Nhật dịch sai thuật ngữ domain → Review bản dịch với domain expert trước khi deploy
- [ ] **Ngôn ngữ học ≠ ngôn ngữ UI**: User đang học tiếng Anh nhưng native là tiếng Việt → UI nên hiển thị tiếng Việt (UX tốt hơn) — Đây là hành vi đúng theo yêu cầu, cần đảm bảo logic không nhầm `learningLanguages` với `nativeLanguageCode`

#### 6.2 Rủi ro kỹ thuật
- [ ] **Flash of untranslated content (FOUC)**: Khi reload, i18n load async → UI hiển thị key hoặc English trước khi locale load xong → Dùng `Suspense` + `i18next-browser-languagedetector` với `localStorage` để init đồng bộ
- [ ] **TypeScript type safety cho translation keys**: Dùng string key `t('auth.login.title')` → không có type check → Cân nhắc dùng `i18next-typescript` hoặc `typesafe-i18n` để gen types
- [ ] **Bundle size tăng**: Load tất cả locale files → waste bandwidth → Dùng lazy loading (dynamic import) cho locale khác ngoài `en`, chỉ load khi cần
- [ ] **Dynamic strings**: Một số string có interpolation (vd: `${dueItems.length} due`) → Cần dùng i18next interpolation syntax `{{count}} due` và plural forms
- [ ] **Tương thích với react-hot-toast**: Toast messages hiện là inline string → cần gọi `t()` trước khi pass vào toast — phải import `i18n` instance trực tiếp ở nơi toast được gọi ngoài component

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **Race condition setUser + changeLanguage**: `setUser()` và `i18n.changeLanguage()` gọi gần nhau → UI có thể render với old locale trong 1 frame → Dùng `useEffect` watch `user.nativeLanguageCode` hoặc gọi `changeLanguage` trước `setUser`
- [ ] **Profile update không trigger UI update**: User thay đổi native language trong `ProfilePage` + save → `setUser(updated)` được gọi nhưng `changeLanguage()` chưa được gọi → Cần watch `user.nativeLanguageCode` trong một hook hoặc trong `setUser` của store
- [ ] **Missing key in production**: Nếu developer thêm string mới nhưng quên thêm vào file locale → key thô hiển thị → Cần CI check validate locale files completeness
- [ ] **Plural forms**: Tiếng Việt không chia số nhiều, tiếng Nhật/Anh có → Cần dùng i18next `plurals` đúng cách cho mỗi locale

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| `i18next` là thư viện i18n phổ biến nhất trong React ecosystem, đầy đủ tính năng | Bundle size tăng (i18next ~20KB gzipped) |
| Tự động theo `nativeLanguageCode` từ profile — UX liền mạch, không cần user chọn ngôn ngữ thủ công | Effort replace strings lớn, cần kiểm thử kỹ |
| Hỗ trợ namespace, lazy load, pluralization, interpolation out-of-the-box | Cần duy trì đồng bộ nhiều file locale khi thêm tính năng mới |
| Fallback về English tự động nếu locale không có translation | Rủi ro bản dịch sai nếu không review |
| TypeScript integration tốt qua `i18next` types | Setup initial phức tạp hơn approach đơn giản |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Dùng `i18next` + `react-i18next` với JSON locale files. Namespace theo module (common/nav/auth/dashboard/...). Init i18n trước khi React render để tránh flash. Hook `changeLanguage()` vào `setUser()` trong `auth.store.ts` và also vào một `useEffect` trong `App.tsx` để catch profile updates.

- **Các cách tiếp cận thay thế**:
  1. **`typesafe-i18n`** — Type-safe nhưng ít plugin hơn, phức tạp setup hơn
  2. **Custom Context** — Tự build translation context đơn giản với JSON files — phù hợp nếu app nhỏ, nhưng thiếu nhiều tính năng (plurals, interpolation, lazy load)
  3. **`FormatJS / react-intl`** — Chuẩn ICU message format, tốt cho enterprise nhưng verbose hơn i18next

- **Thứ tự triển khai**: REQ-01 → REQ-05 → REQ-02 → REQ-03 → REQ-06 → REQ-04 (replace strings là bước cuối, sau khi đã có đủ keys)

- **Ước tính công sức**:
  - REQ-01 (setup): 1–2 giờ
  - REQ-02 (tạo locale files): 4–6 giờ (audit + điền đủ keys)
  - REQ-03 (changeLanguage hook): 1 giờ
  - REQ-04 (replace strings): 6–10 giờ (nhiều file, cần review kỹ)
  - REQ-05 + REQ-06 (fallback + persist): 1 giờ
  - **Tổng**: ~13–20 giờ

---

### 9. Câu hỏi mở

- [ ] Ứng dụng cần hỗ trợ những ngôn ngữ nào trong phiên bản đầu? (Tối thiểu `en` + `vi`? Hay thêm `ja`, `ko`, `zh`?)
- [ ] Ai chịu trách nhiệm dịch nội dung? Developer tự dịch hay có translation team?
- [ ] Khi user chưa set `nativeLanguageCode` (null), nên fallback sang `en` hay dùng browser language (`navigator.language`)?
- [ ] Các string trong error responses từ backend (vd: validation errors) có cần i18n hóa không, hay chỉ FE strings?
- [ ] `date-fns` locale (format ngày tháng) có cần đồng bộ với i18n locale không? (vd: user Việt thấy `03/03/2026` thay vì `March 3, 2026`)
