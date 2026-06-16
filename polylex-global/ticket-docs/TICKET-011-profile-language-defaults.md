# TICKET-011 — Profile: Hiển thị ngôn ngữ mẹ đẻ / ngôn ngữ học / level + dùng làm default cho forms

## Mô tả yêu cầu

Profile page cần thể hiện rõ ba thông tin học tập cốt lõi:
1. **Ngôn ngữ mẹ đẻ** (native language)
2. **Ngôn ngữ muốn học** (target language)
3. **Level hiện tại** (current CEFR level)

Sau đó dùng ba giá trị này làm **giá trị mặc định** cho toàn bộ các form có liên quan:
- `AddWordModal` — form thêm từ mới
- `AddQuickNoteSheet` — form thêm quick note
- `PathGeneratorSheet` — form tạo lộ trình AI

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-011 |
| **Tiêu đề** | Profile hiển thị ngôn ngữ mẹ đẻ / học / level + smart defaults cho forms |
| **Mục tiêu** | User thấy ngay thông tin học tập trên profile; mọi form không cần user chọn lại thông tin đã có trong profile |
| **Phạm vi** | Backend: `shared-types`, `users.service.ts`; Frontend: `ProfilePage.tsx`, `AddWordModal.tsx`, `AddQuickNoteSheet.tsx`, `PathGeneratorSheet.tsx` |
| **Độ ưu tiên** | Trung bình — cải thiện UX, không blocking feature |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Thêm `nativeLanguageName` vào `UserProfile` | Type và backend chỉ trả `nativeLanguageCode`, cần thêm `nativeLanguageName` để hiển thị trên UI | BE: `shared-types`, `users.service.ts` | Nhỏ |
| REQ-02 | Cập nhật Profile page | Hiển thị native language nổi bật; làm rõ section học tập (target + level) | FE: `ProfilePage.tsx` | Nhỏ |
| REQ-03 | Tạo hook `useUserDefaults` | Tập trung logic lấy default lang/level từ `useAuthStore` | FE: hook mới | Nhỏ |
| REQ-04 | Apply defaults vào `AddWordModal` | `languageCode` ← target lang; `cefrLevel` ← current level; `translationTargetCode` ← native lang | FE: `AddWordModal.tsx` | Nhỏ |
| REQ-05 | Apply defaults vào `AddQuickNoteSheet` | `sourceLang` ← target lang; `targetLang` ← native lang | FE: `AddQuickNoteSheet.tsx` | Nhỏ |
| REQ-06 | Apply defaults vào `PathGeneratorSheet` | `targetLangCode` ← target lang; `nativeLangCode` ← native lang; `cefrLevel` ← current level | FE: `PathGeneratorSheet.tsx` | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 (nativeLanguageName cần có trước khi ProfilePage hiển thị)

REQ-03 (độc lập — hook utility)
   │
   ├──> REQ-04 (AddWordModal dùng hook)
   ├──> REQ-05 (AddQuickNoteSheet dùng hook)
   └──> REQ-06 (PathGeneratorSheet dùng hook)
```

REQ-01 và REQ-03 có thể làm song song.

#### Chi tiết từng yêu cầu con

##### REQ-01: Thêm `nativeLanguageName` vào `UserProfile`
- **Mục tiêu**: Frontend có đủ thông tin hiển thị native language (tên, flag) mà không cần fetch lại API
- **Hiện tại**: `UserProfile.nativeLanguageCode: string` — chỉ code, không có tên
- **Backend**: `getProfile()` đã `include: { nativeLanguage: true }` trong Prisma query nhưng không map `name`
- **Đầu ra**: `UserProfile` thêm `nativeLanguageName: string`; `getProfile()` map thêm field này
- **Phụ thuộc**: Không

##### REQ-02: Cập nhật Profile page
- **Mục tiêu**: Hiển thị 3 thông tin học tập rõ ràng trên profile, không chỉ list "Learning Languages"
- **Hiện tại**: Native language **không được hiển thị**; learning languages dạng list nhưng không label rõ "đang học" vs "mẹ đẻ"
- **Đầu ra**: Section mới "Học tập" với `NativeLanguage` (flag + tên) và mỗi learning language + level badge
- **Phụ thuộc**: REQ-01 (cần `nativeLanguageName`)

##### REQ-03: Tạo hook `useUserDefaults`
- **Mục tiêu**: Single source of truth cho 3 giá trị default; tránh lặp lại logic trong mỗi form
- **Đầu ra**:
  ```ts
  const { targetLangCode, nativeLangCode, currentCefrLevel } = useUserDefaults();
  // targetLangCode: learningLanguages[0].code || 'en'
  // nativeLangCode: nativeLanguageCode || 'vi'
  // currentCefrLevel: learningLanguages[0].currentCefrLevel || 'B1'
  ```
- **Phụ thuộc**: Không (đọc từ `useAuthStore`)

##### REQ-04: Apply defaults vào `AddWordModal`
- **Hiện tại**: `DEFAULT_FORM.languageCode = ''`, `cefrLevel = ''`, `translationTargetCode = ''`
- **Đầu ra**: Các field này được khởi tạo từ `useUserDefaults()` thay vì empty string
- **Lưu ý**: `DEFAULT_FORM` là constant — cần dùng state init từ hook hoặc đổi sang computed default
- **Phụ thuộc**: REQ-03

##### REQ-05: Apply defaults vào `AddQuickNoteSheet`
- **Hiện tại**: `sourceLang` hardcode `'en'`, `targetLang` hardcode `'vi'`
- **Đầu ra**: `sourceLang` = target lang từ profile; `targetLang` = native lang từ profile
- **Phụ thuộc**: REQ-03

##### REQ-06: Apply defaults vào `PathGeneratorSheet`
- **Hiện tại**: `targetLangCode` hardcode `'ja'`, `nativeLangCode` hardcode `'vi'`, `cefrLevel` hardcode `'B1'`
- **Đầu ra**: Ba giá trị này từ `useUserDefaults()`
- **Phụ thuộc**: REQ-03

---

### 3. Ngữ cảnh nghiệp vụ

**Luồng nghiệp vụ hiện tại:**
- User đăng ký → chọn `nativeLanguageCode` (RegisterPage) → tạo `LearningPath` với target language
- `LearningPath.currentCefrLevel` được cập nhật khi user học tiến bộ
- `getProfile()` trả về `UserProfile` → lưu vào `useAuthStore` → persist vào localStorage
- Mọi form hiện tại không tham chiếu thông tin profile để set default

**Thực thể domain liên quan:**
- `User.nativeLanguageCode` / `User.nativeLanguage`: ngôn ngữ mẹ đẻ
- `LearningPath.targetLanguageId` + `.currentCefrLevel`: ngôn ngữ học + level hiện tại
- `UserProfile.learningLanguages[0]`: assumed là ngôn ngữ học chính (first active)

**Quy tắc nghiệp vụ cần bảo toàn:**
- User có thể học nhiều ngôn ngữ → `useUserDefaults` dùng `learningLanguages[0]` làm primary
- Default chỉ là gợi ý — user vẫn có thể override trong form
- `useAuthStore` đã persist user profile → không cần fetch thêm API khi mở form

---

### 4. Ngữ cảnh kỹ thuật

#### State hiện tại

**`packages/shared-types/src/index.ts` — `UserProfile`:**
```ts
export interface UserProfile {
  id, email, displayName,
  nativeLanguageCode: string,  // ← chỉ code, không có name
  timezone, dailyGoal, totalXp, currentStreak,
  learningLanguages: { code, name, nativeName, currentCefrLevel, targetCefrLevel }[]
}
```

**`users.service.ts` — `getProfile()`:**
```ts
include: { nativeLanguage: true, ... }  // ← Prisma đã fetch name
return {
  nativeLanguageCode: user.nativeLanguage?.code ?? 'en',
  // nativeLanguageName: MISSING — không map field này
}
```

**`AddWordModal.tsx`:**
```ts
const DEFAULT_FORM = {
  languageCode: '',      // ← nên = targetLangCode
  cefrLevel: '',         // ← nên = currentCefrLevel
  translationTargetCode: '',  // ← nên = nativeLangCode
}
```
Problem: `DEFAULT_FORM` là top-level const → không thể dùng hook ở đây. Cần đổi thành init state bên trong component hoặc dùng `useEffect` sau mount.

**`AddQuickNoteSheet.tsx`:**
```ts
const [sourceLang, setSourceLang] = useState('en');  // ← hardcode
const [targetLang, setTargetLang] = useState('vi');  // ← hardcode
```

**`PathGeneratorSheet.tsx`:**
```ts
const [targetLangCode, setTargetLangCode] = useState('ja');  // ← hardcode
const [nativeLangCode, setNativeLangCode] = useState('vi');  // ← hardcode
const [cefrLevel, setCefrLevel] = useState('B1');            // ← hardcode
```

#### Files bị ảnh hưởng

| File | Thay đổi |
|------|----------|
| `packages/shared-types/src/index.ts` | Thêm `nativeLanguageName: string` vào `UserProfile` |
| `apps/backend/src/modules/users/users.service.ts` | Map `nativeLanguageName` trong `getProfile()` |
| `apps/frontend/src/hooks/useUserDefaults.ts` | Tạo mới — hook lấy defaults từ auth store |
| `apps/frontend/src/pages/ProfilePage.tsx` | Hiển thị native language + cải tiến layout |
| `apps/frontend/src/components/AddWordModal.tsx` | Init form từ `useUserDefaults` |
| `apps/frontend/src/components/quick-note/AddQuickNoteSheet.tsx` | Replace hardcode bằng hook |
| `apps/frontend/src/components/roadmap/PathGeneratorSheet.tsx` | Replace hardcode bằng hook |

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `UserProfile` thiếu `nativeLanguageName` | `UserProfile.nativeLanguageName: string` | Thêm field vào type + service |
| Profile không hiển thị native language | Profile có section "Học tập" rõ ràng với native + target + level | Sửa `ProfilePage.tsx` |
| Không có nguồn tập trung cho default lang/level | Hook `useUserDefaults` dùng chung | Tạo file mới |
| `AddWordModal` default form rỗng | Default từ profile | Dùng hook thay `DEFAULT_FORM` const |
| `AddQuickNoteSheet` hardcode `'en'` / `'vi'` | Default từ profile | Thay `useState('en')` → hook |
| `PathGeneratorSheet` hardcode `'ja'` / `'vi'` / `'B1'` | Default từ profile | Thay 3 `useState` hardcode → hook |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **User chưa có `learningLanguages`**: Nếu `learningLanguages` rỗng, `useUserDefaults` phải có fallback hợp lý (`'en'` / `'B1'`). Biện pháp: fallback rõ ràng trong hook.
- [ ] **Thay đổi `UserProfile` type breaking change**: Frontend cached trong localStorage dùng `persist`. Nếu `nativeLanguageName` thiếu ở bản cũ, `ProfilePage` có thể render `undefined`. Biện pháp: `nativeLanguageName: string` — không optional; force re-fetch profile sau login/refresh.

#### 6.2 Rủi ro kỹ thuật
- [ ] **`DEFAULT_FORM` const ngoài component** (AddWordModal): Không gọi hook ở top-level ngoài component được. Biện pháp: đổi init state dùng callback `useState(() => getDefaults())` hoặc `useEffect` sync sau mount.
- [ ] **Shared-types là package riêng**: Thay đổi interface `UserProfile` cần ensure package được rebuild và backend + frontend đều dùng type mới. Biện pháp: kiểm tra import path và rebuild.

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **`learningLanguages[0]` không luôn là ngôn ngữ "chính"**: User có thể học nhiều language, index 0 không đảm bảo theo thứ tự create. Biện pháp: dùng `[0]` as first và document rõ assumption. Cải tiến sau nếu cần.
- [ ] **`nativeLanguage` null trong DB**: User cũ có thể không có `nativeLanguage` relation. Backend đã handle với `?? 'en'` fallback. Biện pháp: thêm fallback tương tự cho `nativeLanguageName` = `'English'`.

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| UX tốt hơn — user không cần chọn lại ngôn ngữ mỗi lần | Cần sửa nhiều file (6 files) |
| Single source of truth qua `useUserDefaults` hook | `DEFAULT_FORM` const cần refactor |
| Không cần thêm API call, dùng dữ liệu đã có trong store | Breaking change nhỏ trong `UserProfile` type |
| Profile page informative hơn, thể hiện đúng mục tiêu học | |

---

### 8. Khuyến nghị

**Cách tiếp cận khuyến nghị**:
1. Thêm `nativeLanguageName` vào `UserProfile` (shared-types) và `getProfile()` backend
2. Tạo `useUserDefaults` hook: `{ targetLangCode, nativeLangCode, currentCefrLevel }`
3. Cập nhật `ProfilePage` — hiển thị section "Ngôn ngữ" với native flag + target lang + CEFR badge
4. Áp dụng hook vào 3 forms — thay hardcode bằng `useUserDefaults()`
5. Với `AddWordModal`: do `DEFAULT_FORM` là const, dùng `useMemo` hoặc truyền defaults qua prop

**Ước tính công sức**: Nhỏ (2–3 giờ)

---

### 9. Câu hỏi mở

- [x] **Q1**: Profile page chỉ hiển thị (read-only) hay cần thêm nút edit để user sửa native lang / target level ngay trên profile?
  → **Trả lời**: CÓ edit — profile cho phép sửa native language + chọn primary learning language
- [x] **Q2**: Khi user có nhiều learning languages, form default theo ngôn ngữ nào? Luôn là `[0]` (first) hay cần user chọn "primary language" trong profile?
  → **Trả lời**: CÓ "primary language" setting — user chọn ngôn ngữ chính trong profile; `useUserDefaults` dùng ngôn ngữ đó làm default

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Thêm `isPrimary` vào `LearningPath` (DB + type), bổ sung `nativeLanguageName` vào `UserProfile`, mở rộng `PATCH /users/me` để edit native language và chọn primary language, cập nhật `ProfilePage` với edit form + primary selector, tạo `useUserDefaults` hook và áp dụng vào 3 forms.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: `LearningPath` có field `isPrimary: boolean`; backfill set first active path làm primary
2. FR-02: `UserProfile.nativeLanguageName: string`; `learningLanguages[n].isPrimary: boolean`
3. FR-03: `GET /users/me` trả về `nativeLanguageName` + `isPrimary` per language
4. FR-04: `PATCH /users/me` chấp nhận `nativeLanguageCode?` + `primaryLearningLanguageCode?`
5. FR-05: `useUserDefaults` hook trả về `{ targetLangCode, nativeLangCode, currentCefrLevel }` ưu tiên primary lang
6. FR-06: `ProfilePage` hiển thị native lang + primary marker + edit form
7. FR-07: 3 forms dùng hook làm default

#### Ràng buộc phi chức năng
1. NFR-01: Chỉ có đúng một `isPrimary = true` trên mỗi user (enforced ở service layer)
2. NFR-02: Backfill migration — set first active path per user làm primary
3. NFR-03: Sau edit profile → `updateProfile()` trả về fresh `UserProfile` → `setUser()` → localStorage sync

#### Phụ thuộc
- DEP-01: Phase 1 (schema + type) phải xong trước Phase 2 + Phase 3
- DEP-02: TODO-3.3.1 (`useUserDefaults`) phải xong trước TODO-3.4.1/3.5.1/3.6.1
- DEP-03: TODO-1.1.3 (shared-types) phải xong trước TODO-2.1.1 (service mapping)

### Cách tiếp cận
> Thêm `isPrimary` vào `LearningPath` qua migration Prisma, mở rộng `UserProfile` shared-type với 2 field mới, extend `updateProfile()` để lookup Language by code và atomic-swap isPrimary, extend DTO ở controller, tạo hook frontend, refactor ProfilePage với edit form, áp dụng hook vào 3 forms.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/backend/prisma/schema.prisma` | Thêm `isPrimary Boolean @default(false)` vào `LearningPath` |
| Tạo mới | `apps/backend/prisma/migrations/20260228120000_add_learning_path_is_primary/migration.sql` | ALTER TABLE + backfill |
| Sửa đổi | `packages/shared-types/src/index.ts` | Thêm `nativeLanguageName`, `isPrimary` vào `UserProfile` |
| Sửa đổi | `apps/backend/src/modules/users/users.service.ts` | Map `nativeLanguageName` + `isPrimary`; extend `updateProfile()` |
| Sửa đổi | `apps/backend/src/modules/users/users.controller.ts` | Extend `UpdateProfileDto` |
| Sửa đổi | `apps/frontend/src/api/client.ts` | Extend `userApi.updateMe()` type |
| Tạo mới | `apps/frontend/src/hooks/useUserDefaults.ts` | Hook lấy defaults từ auth store |
| Sửa đổi | `apps/frontend/src/pages/ProfilePage.tsx` | Hiển thị native lang + primary indicator + edit form |
| Sửa đổi | `apps/frontend/src/components/AddWordModal.tsx` | Init form từ hook defaults |
| Sửa đổi | `apps/frontend/src/components/quick-note/AddQuickNoteSheet.tsx` | Replace hardcode với hook |
| Sửa đổi | `apps/frontend/src/components/roadmap/PathGeneratorSheet.tsx` | Replace 3 hardcode `useState` với hook |

---

## PLAN TODO

### Phase 1: Data Layer

#### REQ-01: Schema + Type — isPrimary và nativeLanguageName

- [x] **TODO-1.1.1**: Thêm field `isPrimary` vào model `LearningPath` trong Prisma schema
  - **File**: `apps/backend/prisma/schema.prisma`
  - **Context**: Đọc model `LearningPath` (line ~199) để hiểu cấu trúc và map conventions
  - **Thay đổi**: Thêm dòng sau `isActive Boolean @default(true) @map("is_active")`:
    `isPrimary  Boolean  @default(false) @map("is_primary")`
  - **Verify**: File lưu được, không syntax error Prisma
  - **Kết quả**: Schema có `isPrimary` field mới, chưa migrate

- [ ] **TODO-1.1.2**: Tạo file migration SQL cho `is_primary` + backfill rồi apply
  - ⚠️ **BLOCKED**: Không thể chạy `npx prisma migrate dev` vì chưa kết nối được PostgreSQL tại `localhost:5433` (`P1001`).
  - **Action needed**: Khởi động DB rồi chạy lại migration command để apply DB + regenerate Prisma Client.
  - **File**: `apps/backend/prisma/migrations/20260228120000_add_learning_path_is_primary/migration.sql` (tạo mới)
  - **Context**: Đọc `apps/backend/prisma/migrations/20260228000000_add_is_learned/migration.sql` để hiểu format; sau khi tạo file chạy `npx prisma migrate dev --name add_learning_path_is_primary` trong `apps/backend/`
  - **Thay đổi**: Nội dung file SQL — ALTER TABLE thêm cột + UPDATE backfill set first active path per user thành `is_primary = true`
  - **Verify**: `cd apps/backend && npx prisma migrate dev --name add_learning_path_is_primary` → exit 0, `Generated Prisma Client`
  - **Kết quả**: Migration applied, Prisma Client regenerated với `isPrimary` field

- [x] **TODO-1.1.3**: Thêm `nativeLanguageName` và `isPrimary` vào interface `UserProfile` trong shared-types
  - **File**: `packages/shared-types/src/index.ts`
  - **Context**: Tìm `export interface UserProfile` trong file để xem shape hiện tại; tìm `learningLanguages` array type
  - **Thay đổi**:
    - Thêm `nativeLanguageName: string;` ngay sau `nativeLanguageCode: string;`
    - Thêm `isPrimary: boolean;` vào object type trong `learningLanguages` array (sau `targetCefrLevel`)
  - **Verify**: `cd packages/shared-types && npx tsc --noEmit` — exit 0
  - **Kết quả**: `UserProfile.nativeLanguageName` và `learningLanguages[n].isPrimary` available cho backend + frontend

---

### Phase 2: Backend Logic

#### REQ-01: Map nativeLanguageName + isPrimary trong getProfile()

- [x] **TODO-2.1.1**: Map `nativeLanguageName` và `isPrimary` trong `getProfile()` của `UsersService`
  - **File**: `apps/backend/src/modules/users/users.service.ts`
  - **Context**: Đọc `getProfile()` method (line 9–36); đọc `UserProfile` interface vừa sửa ở TODO-1.1.3
  - **Thay đổi**:
    - Sau `nativeLanguageCode: user.nativeLanguage?.code ?? 'en',` thêm: `nativeLanguageName: user.nativeLanguage?.name ?? 'English',`
    - Trong `learningPaths.map(...)` thêm: `isPrimary: lp.isPrimary,`
  - **Verify**: `cd apps/backend && npx tsc --noEmit` — exit 0
  - **Kết quả**: `GET /users/me` response include `nativeLanguageName` + `isPrimary` per language

#### REQ-02: Extend updateProfile() để hỗ trợ nativeLanguageCode + primaryLearningLanguageCode

- [x] **TODO-2.2.1**: Thêm `nativeLanguageCode?` và `primaryLearningLanguageCode?` vào `UpdateProfileDto`
  - **File**: `apps/backend/src/modules/users/users.controller.ts`
  - **Context**: Đọc class `UpdateProfileDto` (line 17–21)
  - **Thay đổi**: Thêm vào class `UpdateProfileDto`:
    `@IsString() @IsOptional() nativeLanguageCode?: string;`
    `@IsString() @IsOptional() primaryLearningLanguageCode?: string;`
  - **Verify**: `cd apps/backend && npx tsc --noEmit` — exit 0
  - **Kết quả**: `PATCH /users/me` body chấp nhận 2 field mới

- [x] **TODO-2.2.2**: Viết lại `updateProfile()` trong `UsersService` để xử lý nativeLanguageCode + primaryLearningLanguageCode
  - **File**: `apps/backend/src/modules/users/users.service.ts`
  - **Context**: Đọc `updateProfile()` hiện tại (line 38–46); đọc `addLearningLanguage()` (line 49–64) cho pattern `prisma.language.findUniqueOrThrow`
  - **Thay đổi**: Thay thế toàn bộ `updateProfile()` — destructure `{ nativeLanguageCode, primaryLearningLanguageCode, ...basic }` từ data param; update basic fields nếu có; nếu `nativeLanguageCode` → lookup Language rồi update `User.nativeLanguageId`; nếu `primaryLearningLanguageCode` → lookup Language, `updateMany` set all `isPrimary: false`, `updateMany` set target `isPrimary: true`; return `this.getProfile(userId)`
  - **Verify**: `cd apps/backend && npx tsc --noEmit` — exit 0
  - **Kết quả**: `PATCH /users/me` swap primary; trả về fresh `UserProfile`

---

### Phase 3: Frontend — Utilities

#### REQ-03: Tạo useUserDefaults hook

- [x] **TODO-3.3.1**: Tạo file `useUserDefaults.ts`
  - **File**: `apps/frontend/src/hooks/useUserDefaults.ts` (tạo mới)
  - **Context**: Đọc `apps/frontend/src/store/auth.store.ts` để biết shape `useAuthStore`; đọc `UserProfile.learningLanguages` sau TODO-1.1.3
  - **Thay đổi**: Tạo hook `useUserDefaults()` trả về `{ targetLangCode, nativeLangCode, currentCefrLevel }` — dùng `learningLanguages.find(l => l.isPrimary) ?? learningLanguages[0]` làm primary lang; fallback `'en'`, `'vi'`, `'B1'`
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: Hook import được từ `@/hooks/useUserDefaults`

---

### Phase 4: Frontend — Form Defaults

#### REQ-04: Apply hook vào AddWordModal

- [x] **TODO-3.4.1**: Áp dụng `useUserDefaults` vào `AddWordModal.tsx`
  - **File**: `apps/frontend/src/components/AddWordModal.tsx`
  - **Context**: Đọc `AddWordModal.tsx` line 1–65 — `DEFAULT_FORM`, `useState(DEFAULT_FORM)`, reset `useEffect`
  - **Thay đổi**:
    1. Import: `import { useUserDefaults } from '@/hooks/useUserDefaults';`
    2. Đầu component: `const defaults = useUserDefaults();`
    3. Đổi `useState<FormState>(DEFAULT_FORM)` thành init callback với `defaults.targetLangCode`, `defaults.currentCefrLevel`, `defaults.nativeLangCode`
    4. Đổi `setForm(DEFAULT_FORM)` trong reset `useEffect` thành spread + override tương tự; thêm `defaults` vào deps
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: Modal mở pre-select ngôn ngữ học + level + ngôn ngữ dịch từ profile

#### REQ-05: Apply hook vào AddQuickNoteSheet

- [x] **TODO-3.5.1**: Áp dụng `useUserDefaults` vào `AddQuickNoteSheet.tsx`
  - **File**: `apps/frontend/src/components/quick-note/AddQuickNoteSheet.tsx`
  - **Context**: Đọc line 20–25 nơi có `useState('en')` / `useState('vi')`
  - **Thay đổi**: Import hook → `const defaults = useUserDefaults();` → `useState('en')` thành `useState(defaults.targetLangCode)` → `useState('vi')` thành `useState(defaults.nativeLangCode)`
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: Sheet pre-select source = ngôn ngữ học, target = native lang từ profile

#### REQ-06: Apply hook vào PathGeneratorSheet

- [x] **TODO-3.6.1**: Áp dụng `useUserDefaults` vào `PathGeneratorSheet.tsx`
  - **File**: `apps/frontend/src/components/roadmap/PathGeneratorSheet.tsx`
  - **Context**: Đọc line 24–32 nơi có `useState('ja')`, `useState('vi')`, `useState('B1')`
  - **Thay đổi**: Import hook → `const defaults = useUserDefaults();` → `useState('ja')` thành `useState(defaults.targetLangCode)` → `useState('vi')` thành `useState(defaults.nativeLangCode)` → `useState('B1')` thành `useState(defaults.currentCefrLevel)`
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: Sheet pre-select target lang + native lang + CEFR level từ profile

---

### Phase 5: Frontend — Profile Page

#### REQ-07: ProfilePage với native lang display + edit + primary selector

- [x] **TODO-3.7.1**: Extend `userApi.updateMe()` trong `api/client.ts` với 2 field mới
  - **File**: `apps/frontend/src/api/client.ts`
  - **Context**: Đọc `userApi.updateMe` (line 62–63)
  - **Thay đổi**: Thêm `nativeLanguageCode?: string;` và `primaryLearningLanguageCode?: string;` vào type parameter của `updateMe`
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: `userApi.updateMe({ nativeLanguageCode: 'en' })` type-safe

- [x] **TODO-3.7.2**: Viết lại `ProfilePage.tsx` với native lang section + primary indicator + edit form
  - **File**: `apps/frontend/src/pages/ProfilePage.tsx`
  - **Context**: Đọc toàn file `ProfilePage.tsx` (94 lines); đọc `auth.store.ts` (biết `setUser`); đọc `UserProfile` interface (biết `nativeLanguageName` + `isPrimary`); đọc `userApi.updateMe` (vừa sửa)
  - **Thay đổi**:
    - Import thêm: `{ useState, useEffect }`, `userApi`, `languageApi` từ `@/api/client`, `Pencil`, `Star` từ `lucide-react`
    - States: `editMode: boolean`, `nativeLangCode: string`, `languages: Language[]`, `saving: boolean`
    - `useEffect`: load `languageApi.getAll()` khi `editMode = true`
    - `useEffect`: sync `nativeLangCode` từ `user?.nativeLanguageCode` khi user thay đổi
    - `handleSave`: `userApi.updateMe({ nativeLanguageCode })` → cast result as `UserProfile` → `setUser(result)` → `setEditMode(false)`
    - `handleSetPrimary(code)`: `userApi.updateMe({ primaryLearningLanguageCode: code })` → `setUser(result)`
    - UI — section "Ngôn ngữ mẹ đẻ": `LanguageBadge` với `user?.nativeLanguageName`; `Pencil` icon toggle editMode; khi editMode hiển thị `<select>` dropdown native lang
    - UI — section "Đang học": mỗi item có `Star` icon (filled nếu `isPrimary`); click Star (nếu !isPrimary) gọi `handleSetPrimary(l.code)`
    - Nút Save + Cancel khi editMode
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — exit 0
  - **Kết quả**: ProfilePage hiển thị native lang, cho phép edit, cho phép đặt primary language

---

### Phase 6: Integration & Verification

- [x] **TODO-4.1**: Build backend
  - **Thay đổi**: `cd apps/backend && npm run build 2>&1 | tail -5`
  - **Verify**: Exit 0, không có TypeScript error mới
  - **Kết quả**: Backend artifact build sạch

- [x] **TODO-4.2**: TypeCheck frontend
  - **Thay đổi**: `cd apps/frontend && npx tsc --noEmit 2>&1 | tail -10`
  - **Verify**: Exit 0, không có TypeScript error
  - **Kết quả**: Frontend type-safe

---

## Ghi chú triển khai
- `isPrimary` swap dùng `updateMany` 2 bước (unset all → set one) — không cần DB unique constraint, service layer đủ
- Sau TODO-2.2.2, `updateProfile()` trả về full `UserProfile` (gọi `getProfile()` nội bộ) → frontend nhận về UserProfile mới, gọi `setUser()` trực tiếp
- `useUserDefaults` dùng `find(isPrimary) ?? [0]` → safe ngay cả khi backfill chưa set primary
- `DEFAULT_FORM` const trong `AddWordModal` giữ nguyên làm shape reference; chỉ override 3 field bằng hook values khi init và reset state
- `userApi.updateMe` return type hiện là `any`; trong `ProfilePage` cast kết quả sang `UserProfile` là acceptable

## Rủi ro cần theo dõi
- [ ] Risk-1: `nativeLanguageName` missing trong localStorage cache user cũ → ProfilePage render undefined — Biện pháp: `user?.nativeLanguageName ?? user?.nativeLanguageCode ?? '...'`
- [ ] Risk-2: `useState(defaults.targetLangCode)` captures stale initial value nếu user chưa load — Biện pháp: hook đọc từ zustand store (luôn sync); store hydrate từ localStorage trước component mount
- [ ] Risk-3: `languageApi.getAll()` cần load khi editMode — đã plan trong TODO-3.7.2 với `useEffect` và `editMode` condition

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Đã triển khai đầy đủ flow hiển thị và chỉnh sửa ngôn ngữ mẹ đẻ / ngôn ngữ học chính / level trên Profile, đồng thời áp dụng smart defaults từ profile vào 3 form chính (`AddWordModal`, `AddQuickNoteSheet`, `PathGeneratorSheet`).

### Thống kê
- **Tổng TODO**: 14
- **Hoàn thành**: 13 ✅
- **Blocked**: 1 ⚠️

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-1.1.1 | Thêm field `isPrimary` vào Prisma schema | ✅ Done | |
| TODO-1.1.2 | Tạo migration SQL + apply | ⚠️ Blocked | Đã tạo file migration, chưa apply do DB `localhost:5433` chưa sẵn sàng |
| TODO-1.1.3 | Cập nhật shared `UserProfile` type | ✅ Done | Đồng bộ cả `src` và declaration files |
| TODO-2.1.1 | Map `nativeLanguageName` + `isPrimary` trong `getProfile()` | ✅ Done | |
| TODO-2.2.1 | Extend `UpdateProfileDto` | ✅ Done | |
| TODO-2.2.2 | Extend `updateProfile()` xử lý native + primary | ✅ Done | Có transaction unset/set primary |
| TODO-3.3.1 | Tạo hook `useUserDefaults` | ✅ Done | Ưu tiên `isPrimary`, fallback `[0]` |
| TODO-3.4.1 | Apply defaults vào `AddWordModal` | ✅ Done | |
| TODO-3.5.1 | Apply defaults vào `AddQuickNoteSheet` | ✅ Done | |
| TODO-3.6.1 | Apply defaults vào `PathGeneratorSheet` | ✅ Done | |
| TODO-3.7.1 | Extend `userApi.updateMe` type | ✅ Done | |
| TODO-3.7.2 | Refactor `ProfilePage` edit + primary selector | ✅ Done | |
| TODO-4.1 | Build backend | ✅ Done | Đã chạy thành công với `nvm use v23` |
| TODO-4.2 | TypeCheck frontend | ✅ Done | Đã chạy thành công với `nvm use v23` |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/backend/prisma/schema.prisma` | Modified | Thêm `LearningPath.isPrimary` |
| `apps/backend/prisma/migrations/20260228120000_add_learning_path_is_primary/migration.sql` | Added | ALTER TABLE + backfill primary path |
| `packages/shared-types/src/index.ts` | Modified | Thêm `nativeLanguageName`, `isPrimary` |
| `packages/shared-types/src/index.d.ts` | Modified | Đồng bộ declarations cho `UserProfile` |
| `packages/shared-types/dist/index.d.ts` | Modified | Đồng bộ declarations cho package consumer |
| `apps/backend/src/modules/users/users.service.ts` | Modified | Map profile fields mới, update profile transaction, set primary logic |
| `apps/backend/src/modules/users/users.controller.ts` | Modified | Extend `UpdateProfileDto` |
| `apps/frontend/src/api/client.ts` | Modified | Extend `userApi.updateMe` payload type |
| `apps/frontend/src/hooks/useUserDefaults.ts` | Added | Hook defaults từ auth store |
| `apps/frontend/src/components/AddWordModal.tsx` | Modified | Init/reset form từ `useUserDefaults` |
| `apps/frontend/src/components/quick-note/AddQuickNoteSheet.tsx` | Modified | Replace hardcoded source/target lang |
| `apps/frontend/src/components/roadmap/PathGeneratorSheet.tsx` | Modified | Replace hardcoded target/native/CEFR |
| `apps/frontend/src/pages/ProfilePage.tsx` | Modified | Hiển thị native language, edit mode, primary selector |

### Verification
- [x] Build thành công: ✅ (backend build pass với `nvm use v23`)
- [ ] Unit tests pass: ❌ (không thể chạy test command do cùng lỗi runtime)
- [x] Không có warning mới: ✅ (frontend `npx tsc --noEmit` pass)

### Ghi chú
- Đã kiểm tra diagnostics theo file trong editor: các file frontend và backend đã sửa không còn TypeScript error cục bộ.
- Đã xác nhận cần dùng `nvm use v23` trước các lệnh Node trong workspace này.
- Còn lại duy nhất bước migrate DB: chạy lại `npx prisma migrate dev --name add_learning_path_is_primary` sau khi DB `localhost:5433` hoạt động.
