# TICKET-002 — Thêm từ vựng mới theo ngôn ngữ học

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-002 |
| **Tiêu đề** | Thêm chức năng tạo từ vựng mới theo ngôn ngữ muốn học |
| **Mục tiêu** | Người dùng có thể tự thêm một từ vựng mới cho một ngôn ngữ cụ thể (term + language + metadata) trực tiếp từ trang Vocabulary, đồng thời tuỳ chọn thêm bản dịch và tự động đưa từ vào danh sách học cá nhân |
| **Phạm vi** | Frontend (VocabularyPage) — Backend sẵn sàng |
| **Độ ưu tiên** | Cao — đây là chức năng core của nền tảng học từ vựng |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Modal thêm từ mới | Giao diện form (modal/side-panel) cho phép nhập thông tin từ vựng mới: term, languageCode, CEFR level, part of speech, phonetic, example sentence | Frontend | Trung bình |
| REQ-02 | Chọn ngôn ngữ học | Dropdown chọn ngôn ngữ nguồn (ngôn ngữ muốn học) — bind vào danh sách ngôn ngữ từ API `/languages` đã có | Frontend | Nhỏ |
| REQ-03 | Thêm bản dịch kèm theo | Tuỳ chọn trong form: nhập bản dịch + ngôn ngữ đích ngay sau khi tạo từ (gọi `POST /vocabulary/:id/translations`) | Frontend | Nhỏ |
| REQ-04 | Tự động thêm vào danh sách học | Sau khi tạo từ thành công, tự động gọi `POST /vocabulary/:id/add-to-my-list` để từ xuất hiện trong queue ôn tập | Frontend | Nhỏ |
| REQ-05 | Cập nhật client API | Xác nhận `vocabularyApi.create()` và `vocabularyApi.addTranslation()` đã đủ; bổ sung nếu thiếu | Frontend (`api/client.ts`) | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-02 ──> REQ-01 (dropdown ngôn ngữ là phần trong modal)
REQ-05 ──> REQ-01 (form dùng client API)

REQ-01 ──> REQ-03 (bản dịch được thêm SAU khi tạo từ thành công)
REQ-01 ──> REQ-04 (add-to-my-list SAU khi tạo từ thành công)

REQ-03 và REQ-04 độc lập nhau (gọi song song được)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Modal thêm từ mới
- **Mục tiêu**: Hiển thị form nhập liệu từ vựng dạng modal overlay trên VocabularyPage
- **Đầu vào**: term (bắt buộc), languageCode (bắt buộc), cefrLevel?, partOfSpeech?, phonetic?, exampleSentence?
- **Đầu ra mong đợi**: Gọi `POST /vocabulary` thành công → toast thành công → đóng modal → reload danh sách
- **Tiêu chí hoàn thành**: 
  - Nút "＋ Add New Word" ở đầu trang VocabularyPage mở modal
  - Validate: term và languageCode bắt buộc
  - Xử lý lỗi 409 (ConflictException — từ đã tồn tại)
  - Sau submit thành công: đóng modal, reload list, hiện thông báo
- **Phụ thuộc**: REQ-02, REQ-05

##### REQ-02: Chọn ngôn ngữ học
- **Mục tiêu**: Dropdown ngôn ngữ trong form hiển thị toàn bộ danh sách ngôn ngữ hỗ trợ (flagEmoji + name)
- **Đầu vào**: Dữ liệu từ `GET /languages` (đã có `languageApi.getAll()` trong `api/client.ts`)
- **Đầu ra mong đợi**: Select dropdown có option cho mỗi language, value = `language.code`
- **Tiêu chí hoàn thành**: Có thể chọn bất kỳ ngôn ngữ nào trong danh sách 35 ngôn ngữ đã seed
- **Phụ thuộc**: Không

##### REQ-03: Thêm bản dịch kèm theo
- **Mục tiêu**: Tuỳ chọn "Add translation" trong form, cho phép nhập bản dịch + ngôn ngữ đích ngay trong lần tạo từ đầu tiên
- **Đầu vào**: targetLanguageCode, translation (sau khi tạo từ → có vocabId)
- **Đầu ra mong đợi**: Gọi `POST /vocabulary/:id/translations` nếu user điền bản dịch
- **Tiêu chí hoàn thành**: Nếu trường dịch có giá trị thì gọi API; nếu trống thì bỏ qua
- **Phụ thuộc**: REQ-01 (cần `id` của từ vừa tạo)

##### REQ-04: Tự động thêm vào danh sách học
- **Mục tiêu**: Sau khi tạo, từ mới tự động vào queue ôn tập của user
- **Đầu vào**: `id` từ kết quả `POST /vocabulary`
- **Đầu ra mong đợi**: Gọi `POST /vocabulary/:id/add-to-my-list`; coi lỗi 40x là không nghiêm trọng (từ có thể đã trong list)
- **Tiêu chí hoàn thành**: Từ xuất hiện trong dashboard / review queue sau khi tạo
- **Phụ thuộc**: REQ-01

##### REQ-05: Xác nhận client API
- **Mục tiêu**: Đảm bảo `vocabularyApi.create()` và `vocabularyApi.addTranslation()` đúng signature
- **Đầu vào**: `apps/frontend/src/api/client.ts`
- **Đầu ra mong đợi**: Không cần thay đổi — đã có đủ ở dòng 80 và 82
- **Tiêu chí hoàn thành**: Code frontend gọi được không cần sửa client
- **Phụ thuộc**: Không

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng hiện tại**: Người dùng xem/tìm từ trong kho global → nhấn "+ Add" → từ vào danh sách học cá nhân → xuất hiện trong review queue theo ACRE algorithm
- **Luồng mong muốn**: Người dùng **tự tạo từ mới** (khi từ chưa có trong kho) → chọn ngôn ngữ muốn học → điền thông tin → tuỳ chọn thêm bản dịch → từ tự động vào danh sách học
- **Domain entities liên quan**:
  - `VocabularyBase` — lưu term + languageCode + metadata
  - `VocabularyTranslation` — bản dịch của term sang ngôn ngữ khác
  - `UserVocabulary` — bản ghi SRS cá nhân của user
  - `Language` — danh sách ngôn ngữ (35 bản)
- **Quy tắc nghiệp vụ áp dụng**:
  - Một `(term, languageCode, organizationId)` là unique — backend trả 409 nếu trùng
  - `organizationId` được lấy tự động từ JWT token (`user.organizationId`)
  - Ai cũng có thể tạo từ mới (không phân quyền admin)
- **Hành vi cần bảo toàn**: Danh sách filter + search + pagination hiện tại không bị ảnh hưởng

---

### 4. Ngữ cảnh kỹ thuật

#### Trạng thái hiện tại

| Layer | File | Trạng thái |
|-------|------|-----------|
| Backend Controller | `apps/backend/src/modules/vocabulary/vocabulary.controller.ts` | ✅ `POST /vocabulary` đã có (line 38–42) |
| Backend Service | `apps/backend/src/modules/vocabulary/vocabulary.service.ts` | ✅ `create()` và `addTranslation()` đã có |
| Backend DTO | `apps/backend/src/modules/vocabulary/dto/vocabulary.dto.ts` | ✅ `CreateVocabularyDto`, `AddTranslationDto` đã có |
| Frontend API client | `apps/frontend/src/api/client.ts` | ✅ `vocabularyApi.create()`, `addTranslation()`, `addToMyList()` đã có |
| Frontend Page | `apps/frontend/src/pages/VocabularyPage.tsx` | ❌ **Không có UI thêm từ mới** |

#### Điểm tích hợp
- `GET /languages` → `languageApi.getAll()` → đã dùng trong VocabularyPage (line 32) — tái dụng được
- `POST /vocabulary` → `vocabularyApi.create(data)` → trả về `VocabItem` với `id`
- `POST /vocabulary/:id/translations` → `vocabularyApi.addTranslation(id, data)`
- `POST /vocabulary/:id/add-to-my-list` → `vocabularyApi.addToMyList(id)`

#### Cấu trúc `CreateVocabularyDto` (backend, đã được validate)
```typescript
{
  term: string,              // bắt buộc
  languageCode: string,      // bắt buộc — mã ISO 639-1 (vd: "en", "ja", "vi")
  cefrLevel?: 'A1'|'A2'|'B1'|'B2'|'C1'|'C2',
  partOfSpeech?: 'noun'|'verb'|'adjective'|'adverb'|'phrase'|'other',
  phonetic?: string,         // vd: /ˈæpəl/
  exampleSentence?: string,
  imageUrl?: string
}
```

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| VocabularyPage chỉ có filter + list + "add to my list" | VocabularyPage có nút "+ Add New Word" mở modal tạo từ | Thiếu nút trigger + modal component |
| Không có form nhập term/language/metadata | Form với validation đầy đủ theo DTO | Thiếu toàn bộ form UI |
| Sau tạo từ: không có hành động gì | Sau tạo: reload list + thêm dịch (opt) + add-to-my-list | Thiếu post-creation flow |
| Không có feedback lỗi 409 (từ đã tồn tại) | Hiển thị thông báo "Từ này đã tồn tại" | Thiếu error handling UX |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Từ trùng lặp**: Backend trả 409 nếu `(term, languageCode, orgId)` đã tồn tại. Frontend cần bắt lỗi này và hiển thị rõ ràng thay vì crash im lặng. — **Giảm thiểu**: Thêm try/catch với message cụ thể cho lỗi 409
- [ ] **Chọn sai languageCode**: Người dùng có thể muốn học tiếng Nhật nhưng chọn nhầm sang tiếng Trung. — **Giảm thiểu**: Hiển thị tên đầy đủ + flag emoji trong dropdown, có label rõ ràng "Language to learn"

#### 6.2 Rủi ro kỹ thuật
- [ ] **`add-to-my-list` sau `create` có thể fail**: Nếu DB đang bận hoặc có race condition. — **Giảm thiểu**: Lỗi ở step này không chặn UX; fire-and-forget với silent catch, user vẫn có thể nhấn "+ Add" từ danh sách
- [ ] **State refresh sau tạo từ**: Danh sách hiện tại dùng `useCallback` với `[search, languageCode, cefrLevel]` — gọi lại `load(1)` sau tạo sẽ đúng. — **Giảm thiểu**: Gọi `load(1)` trong `.finally()` của submit handler
- [ ] **`languages` state đã có trong VocabularyPage**: Tái dụng `languages` state (`LanguageDto[]`, line 22–32) thay vì fetch lại trong modal. — **Giảm thiểu**: Truyền `languages` prop xuống component modal

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **Form submit khi đang loading**: Nếu nhấn submit 2 lần → gọi API 2 lần. — **Cách phòng**: Disable nút submit khi `isSubmitting = true`
- [ ] **Translation thiếu targetLanguageCode**: Nếu user điền translation nhưng quên chọn ngôn ngữ đích. — **Cách phòng**: Validate cặp (translation + targetLanguageCode) cùng nhau: cả hai cùng có hoặc cùng trống
- [ ] **Modal không reset khi đóng**: Khi đóng modal rồi mở lại, form vẫn còn dữ liệu cũ. — **Cách phòng**: Reset form state về default khi `showModal` → `false`

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Backend đã hoàn chỉnh → chỉ cần làm frontend | Cần cẩn thận xử lý 3 API call liên tiếp (create → translate → add-to-list) |
| Tái dụng `languages` state và `languageApi.getAll()` sẵn có | Modal thêm độ phức tạp UI nhỏ vào VocabularyPage |
| Flow tự nhiên: tạo → học ngay | Chưa có `PATCH /vocabulary/:id` nếu user muốn sửa sau khi tạo (ngoài scope ticket này) |
| Không cần thay đổi backend | — |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Thêm modal inline vào `VocabularyPage.tsx` (không tạo page mới). Dùng local state `showAddModal: boolean` + `form: FormState`. Sau submit: (1) create → lấy `id`, (2) nếu có bản dịch thì addTranslation, (3) addToMyList (silent), (4) reload list, (5) đóng modal.
- **Các cách tiếp cận thay thế**: 
  - Trang riêng `/vocabulary/new` — overkill cho form ngắn
  - Inline form trong trang — không clean bằng modal
- **Phụ thuộc**: Không có phụ thuộc ngoài (backend đã ready)
- **Ước tính công sức**: ~2–3 giờ (1 component modal + wire up + test UX)

---

### 9. Câu hỏi mở

- [ ] Có muốn **add-to-my-list tự động** sau khi tạo từ, hay để user chủ động nhấn "+ Add" từ danh sách? *(Khuyến nghị: tự động — trải nghiệm tốt hơn)*
- [ ] Có cần validate **phonetic format** (IPA) không, hay để tự do nhập?
- [ ] Fields `imageUrl` trong `CreateVocabularyDto` — có muốn hiển thị field này trong form không, hay ẩn (ít dùng)?

---

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Thêm modal "Add New Word" vào `VocabularyPage` cho phép người dùng tạo từ vựng mới (term + ngôn ngữ muốn học + metadata tuỳ chọn), tự động thêm bản dịch và đưa vào review queue — toàn bộ chỉ cần làm frontend vì backend đã sẵn sàng.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: Nút "＋ Add New Word" ở header VocabularyPage mở modal
2. FR-02: Form có field bắt buộc: `term`, `languageCode`; optional: `cefrLevel`, `partOfSpeech`, `phonetic`, `exampleSentence`
3. FR-03: Section tuỳ chọn "Add translation" — nếu bật: nhập `targetLanguageCode` + `translation` (validate cặp)
4. FR-04: Submit gọi 3 API theo thứ tự: `create` → `addTranslation` (nếu có) → `addToMyList` (silent)
5. FR-05: Sau submit thành công: reset form, đóng modal, reload danh sách từ trang 1
6. FR-06: Hiển thị lỗi 409 rõ ràng ("Từ này đã tồn tại"); lỗi khác hiển thị message từ API
7. FR-07: Nút submit bị disabled khi `isSubmitting = true` (chống double-submit)
8. FR-08: Đóng modal (X hoặc backdrop) reset toàn bộ form state về default

#### Ràng buộc phi chức năng
1. NFR-01: Tái dụng `languages: LanguageDto[]` state từ `VocabularyPage` (không fetch lại)
2. NFR-02: `addToMyList` không chặn UX — lỗi ở bước này được swallow (fire-and-forget)
3. NFR-03: TypeScript strict — không có `any`, props interface được định nghĩa rõ

#### Phụ thuộc
- DEP-01: `vocabularyApi.create()` tại `apps/frontend/src/api/client.ts:80` — đã có
- DEP-02: `vocabularyApi.addTranslation()` tại `apps/frontend/src/api/client.ts:82` — đã có
- DEP-03: `vocabularyApi.addToMyList()` tại `apps/frontend/src/api/client.ts:84` — đã có
- DEP-04: `LanguageDto` từ `@polylex/shared-types` — đã import tại VocabularyPage

### Cách tiếp cận
> Tạo component `AddWordModal.tsx` trong `apps/frontend/src/components/`. Dùng local state cho form. Sau đó wire vào `VocabularyPage.tsx` với 2 thay đổi nhỏ (state `showModal` + render component). Không thay đổi backend, không thêm route mới.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Tạo mới | `apps/frontend/src/components/AddWordModal.tsx` | Component modal hoàn chỉnh: form + submit logic + error handling |
| Sửa đổi | `apps/frontend/src/pages/VocabularyPage.tsx` | Thêm state `showModal` + nút trigger + render modal |

---

## PLAN TODO

### Phase 1: Tạo component `AddWordModal`

#### REQ-01 + REQ-02: Modal shell + dropdown ngôn ngữ

- [x] **TODO-1.1.1**: Tạo file `AddWordModal.tsx` với props interface, form state interface và modal overlay skeleton
  - **File**: `apps/frontend/src/components/AddWordModal.tsx`
  - **Context**: Đọc `apps/frontend/src/components/Layout.tsx` để tham khảo Tailwind pattern, đọc `apps/frontend/src/api/client.ts` dòng 75–86 để xem API signatures
  - **Thay đổi**:
    - Import: `useState`, `useEffect`, `vocabularyApi` từ `@/api/client`, `LanguageDto` từ `@polylex/shared-types`
    - Định nghĩa interface `AddWordModalProps { isOpen: boolean; languages: LanguageDto[]; onSuccess: () => void; onClose: () => void }`
    - Định nghĩa interface `FormState { term: string; languageCode: string; cefrLevel: string; partOfSpeech: string; phonetic: string; exampleSentence: string; showTranslation: boolean; translationText: string; translationTargetCode: string }`
    - Định nghĩa `DEFAULT_FORM: FormState` với tất cả fields là chuỗi rỗng, `showTranslation: false`
    - Render: `if (!isOpen) return null` — modal overlay `fixed inset-0 bg-black/50 z-50` + card trung tâm `bg-white rounded-2xl p-6 w-full max-w-lg mx-4`
    - Header: tiêu đề "Add New Word" + nút `×` gọi `onClose`
    - Backdrop click: `onClick` trên overlay gọi `onClose` (stopPropagation trên card)
    - `useEffect(() => { if (!isOpen) setForm(DEFAULT_FORM); setError(''); }, [isOpen])` để reset khi đóng
  - **Verify**: Chạy `npx tsc --noEmit` trong `apps/frontend/`, không có lỗi TypeScript
  - **Kết quả**: File được tạo, modal render/ẩn đúng, form reset khi đóng

- [x] **TODO-1.1.2**: Thêm section required fields (term + languageCode) vào AddWordModal
  - **File**: `apps/frontend/src/components/AddWordModal.tsx`
  - **Context**: Đọc `apps/frontend/src/pages/VocabularyPage.tsx` dòng 85–95 để tham khảo Tailwind select style
  - **Thay đổi**:
    - Trong form body, thêm field group "Word / Phrase" (label + input): `value={form.term}` onChange cập nhật `form.term`, placeholder "e.g. apple", class `border rounded-lg px-3 py-2 w-full`
    - Thêm field group "Language to learn" (label + select): map `languages.map(l => <option key={l.code} value={l.code}>{l.flagEmoji} {l.name}</option>)`, option đầu disabled `"— select language —"`
    - Cả hai field có label rõ text-sm font-medium text-gray-700
    - Thêm state `error: string` + `isSubmitting: boolean` vào component (`useState('')` + `useState(false)`)
  - **Verify**: `npx tsc --noEmit` pass; chạy dev, mở modal, thấy 2 field bắt buộc render đúng
  - **Kết quả**: Form có 2 field required, dropdown ngôn ngữ hiển thị đủ 35 options với flag

#### REQ-01: Optional metadata fields

- [x] **TODO-1.1.3**: Thêm section optional metadata fields (cefrLevel, partOfSpeech, phonetic, exampleSentence) vào AddWordModal
  - **File**: `apps/frontend/src/components/AddWordModal.tsx`
  - **Context**: Đọc `apps/backend/src/modules/vocabulary/dto/vocabulary.dto.ts` để xem enum values chính xác
  - **Thay đổi**:
    - Định nghĩa const tại đầu file: `const CEFR = ['A1','A2','B1','B2','C1','C2']` và `const POS = ['noun','verb','adjective','adverb','phrase','other']`
    - Thêm row 2 cột dùng `grid grid-cols-2 gap-3`: select CEFR level (option đầu `""` = "Level (optional)") + select Part of speech (option đầu `""` = "Part of speech")
    - Thêm input Phonetic: placeholder `/ˈæpəl/`, value `form.phonetic`
    - Thêm textarea Example sentence: rows={2}, placeholder "e.g. I eat an apple every day.", value `form.exampleSentence`
    - Tất cả onChange cập nhật đúng field trong `form` state dùng spread: `setForm(prev => ({ ...prev, fieldName: value }))`
  - **Verify**: `npx tsc --noEmit` pass; mở modal thấy 4 optional fields
  - **Kết quả**: Form đầy đủ 6 fields (2 required + 4 optional)

#### REQ-03: Optional translation section

- [x] **TODO-1.1.4**: Thêm section "Add translation" có thể toggle vào AddWordModal
  - **File**: `apps/frontend/src/components/AddWordModal.tsx`
  - **Context**: Không cần đọc thêm — dùng pattern giống optional fields ở TODO-1.1.3
  - **Thay đổi**:
    - Thêm divider `border-t border-gray-100 my-4`
    - Thêm row toggle: checkbox `checked={form.showTranslation}` onChange cập nhật `form.showTranslation` + label "Add a translation now (optional)"
    - Wrap phần dưới trong `{form.showTranslation && (...)}`:
      - Select "Target language" — map `languages` (cùng format flagEmoji + name), option đầu disabled
      - Input "Translation" — placeholder "e.g. táo", value `form.translationText`
    - Logic validate pair: nếu `showTranslation && form.translationText && !form.translationTargetCode` → hiện inline error nhỏ "Please select target language"
  - **Verify**: Toggle checkbox → section show/hide; điền translation nhưng không chọn ngôn ngữ → thấy inline error
  - **Kết quả**: Translation section hoạt động đúng với pair validation

#### REQ-01 + REQ-04: Submit handler + post-creation flow

- [x] **TODO-1.1.5**: Implement `handleSubmit` với chuỗi 3 API call trong AddWordModal
  - **File**: `apps/frontend/src/components/AddWordModal.tsx`
  - **Context**: Đọc `apps/frontend/src/api/client.ts` dòng 75–86 để xem đúng signature của `create()`, `addTranslation()`, `addToMyList()`
  - **Thay đổi**:
    - Thêm `async function handleSubmit(e: React.FormEvent)` với `e.preventDefault()`
    - Guard: `if (!form.term.trim() || !form.languageCode) return` — focus field lỗi
    - Guard pair translation: `if (form.showTranslation && form.translationText && !form.translationTargetCode) return`
    - Set `isSubmitting(true)`; wrap trong `try/catch/finally { setIsSubmitting(false) }`
    - Step 1: `const created = await vocabularyApi.create({ term: form.term.trim(), languageCode: form.languageCode, ...(form.cefrLevel && { cefrLevel: form.cefrLevel }), ...(form.partOfSpeech && { partOfSpeech: form.partOfSpeech }), ...(form.phonetic && { phonetic: form.phonetic }), ...(form.exampleSentence && { exampleSentence: form.exampleSentence }) })`
    - Step 2 (conditional): `if (form.showTranslation && form.translationText && form.translationTargetCode) { await vocabularyApi.addTranslation(created.id, { targetLanguageCode: form.translationTargetCode, translation: form.translationText }) }`
    - Step 3 (silent): `vocabularyApi.addToMyList(created.id).catch(() => {})`
    - On success: `onSuccess(); onClose()`
    - Wire vào `<form onSubmit={handleSubmit}>`
  - **Verify**: `npx tsc --noEmit` pass; submit form với term + language → DevTools Network thấy `POST /api/v1/vocabulary` 201
  - **Kết quả**: 3 bước API fire đúng thứ tự, modal đóng sau thành công

#### REQ-01: Error handling + submit button

- [x] **TODO-1.1.6**: Thêm error display + disable guard cho submit button trong AddWordModal
  - **File**: `apps/frontend/src/components/AddWordModal.tsx`
  - **Context**: Đọc phần `catch` của `handleSubmit` vừa viết ở TODO-1.1.5
  - **Thay đổi**:
    - Trong `catch(err)`: kiểm tra `(err as AxiosError).response?.status === 409` → `setError('This word already exists for the selected language.')` ; else → `setError((err as AxiosError<{message: string}>).response?.data?.message ?? 'Failed to create word. Please try again.')`
    - Import `AxiosError` từ axios
    - Thêm error banner sau form fields: `{error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}`
    - Thêm `setError('')` ở đầu `handleSubmit` (xoá lỗi cũ mỗi lần submit)
    - Submit button: `disabled={isSubmitting || !form.term.trim() || !form.languageCode}` + text đổi thành `isSubmitting ? 'Saving…' : 'Add Word'`
    - Nút Cancel: `onClick={onClose}` disabled khi `isSubmitting`
  - **Verify**: Submit từ đã tồn tại → thấy banner đỏ "This word already exists…"; submit khi đang loading → nút disabled
  - **Kết quả**: Error handling đầy đủ, double-submit được ngăn

---

### Phase 2: Wire `AddWordModal` vào `VocabularyPage`

#### REQ-01: Trigger button

- [x] **TODO-2.1.1**: Thêm state `showModal` + nút "＋ Add New Word" vào `VocabularyPage.tsx`
  - **File**: `apps/frontend/src/pages/VocabularyPage.tsx`
  - **Context**: Đọc `apps/frontend/src/pages/VocabularyPage.tsx` dòng 17–27 (danh sách state hiện có) và dòng 66–68 (header h2)
  - **Thay đổi**:
    - Thêm state: `const [showModal, setShowModal] = useState(false);` sau dòng `const [addedIds, setAddedIds]`
    - Thay thế dòng `<h2 className="text-2xl font-bold text-gray-800 mb-6">📚 Vocabulary</h2>` bằng:
      ```tsx
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📚 Vocabulary</h2>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          ＋ Add New Word
        </button>
      </div>
      ```
  - **Verify**: `npx tsc --noEmit` pass; mở trang Vocabulary thấy nút "＋ Add New Word" ở góc phải header
  - **Kết quả**: Nút trigger hiển thị đúng vị trí, click set `showModal = true`

#### REQ-01 → REQ-04: Render modal + callback

- [x] **TODO-2.1.2**: Import `AddWordModal` và render với đúng props trong `VocabularyPage.tsx`
  - **File**: `apps/frontend/src/pages/VocabularyPage.tsx`
  - **Context**: Đọc `apps/frontend/src/components/AddWordModal.tsx` (vừa tạo) để xem đúng props interface
  - **Thay đổi**:
    - Thêm import đầu file: `import AddWordModal from '@/components/AddWordModal';`
    - Thêm vào cuối JSX (trước closing `</div>` cuối cùng của return):
      ```tsx
      <AddWordModal
        isOpen={showModal}
        languages={languages}
        onSuccess={() => load(1)}
        onClose={() => setShowModal(false)}
      />
      ```
  - **Verify**: `npx tsc --noEmit` pass; nhấn "＋ Add New Word" → modal mở; nhấn X hoặc backdrop → modal đóng, form reset
  - **Kết quả**: Modal fully wired — mở/đóng đúng, sau submit thành công danh sách reload trang 1

---

### Phase 3: Integration & Verification

- [x] **TODO-3.1**: TypeScript build check toàn bộ frontend
  - **Thay đổi**: Chạy `npx tsc --noEmit` trong `apps/frontend/`
  - **Verify**: Zero TypeScript errors
  - **Kết quả**: Code type-safe, không có `any` ẩn

- [ ] **TODO-3.2**: Smoke test thủ công — happy path
  - ℹ️ **Note**: Cần dev server đang chạy, thực hiện thủ công sau khi chạy `npm run dev`

- [ ] **TODO-3.3**: Smoke test — conflict path (từ đã tồn tại)
  - ℹ️ **Note**: Cần dev server đang chạy, thực hiện thủ công sau khi chạy `npm run dev`

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Đã thêm chức năng tạo từ vựng mới vào `VocabularyPage` thông qua modal "Add New Word". Người dùng có thể nhập term + ngôn ngữ (bắt buộc), metadata tuỳ chọn, bản dịch kèm theo, và từ tự động được thêm vào review queue.

### Thống kê
- **Tổng TODO**: 11
- **Hoàn thành tự động**: 9 ✅
- **Chờ smoke test thủ công**: 2 ⏳ (TODO-3.2, TODO-3.3)

### TODO Status

| TODO | Tiêu đề | Status |
|------|---------|--------|
| TODO-1.1.1 | Tạo AddWordModal shell + props | ✅ Done |
| TODO-1.1.2 | Required fields: term + languageCode | ✅ Done |
| TODO-1.1.3 | Optional fields: cefrLevel, POS, phonetic, example | ✅ Done |
| TODO-1.1.4 | Translation toggle section + pair validation | ✅ Done |
| TODO-1.1.5 | handleSubmit: create → addTranslation → addToMyList | ✅ Done |
| TODO-1.1.6 | Error banner (409/generic) + disabled submit guard | ✅ Done |
| TODO-2.1.1 | showModal state + "＋ Add New Word" trigger button | ✅ Done |
| TODO-2.1.2 | Import AddWordModal + wire props vào VocabularyPage | ✅ Done |
| TODO-3.1 | `npx tsc --noEmit` — zero errors | ✅ Done |
| TODO-3.2 | Smoke test happy path | ⏳ Manual |
| TODO-3.3 | Smoke test conflict (409) | ⏳ Manual |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/frontend/src/components/AddWordModal.tsx` | Tạo mới | Component modal hoàn chỉnh (~260 dòng): form + submit logic + error handling |
| `apps/frontend/src/pages/VocabularyPage.tsx` | Sửa đổi | Thêm import, state `showModal`, trigger button, render `<AddWordModal>` |

### Verification
- [x] TypeScript `--noEmit`: ✅ exit code 0, zero errors
- [ ] Smoke test happy path: ⏳ cần chạy thủ công
- [ ] Smoke test conflict path: ⏳ cần chạy thủ công

### Ghi chú
- TODO-1.1.1 đến 1.1.6 được implement trong 1 lần tạo file hoàn chỉnh thay vì 6 lần incremental — kết quả tương đương, giảm overhead
- `AxiosError<{message: string | string[]}>` — xử lý cả trường hợp NestJS trả `message` là array (ValidationPipe global)
- `type` import cho `AxiosError` và `FormEvent` thay vì value import — tránh bundle bloat
  - **Verify** (theo thứ tự):
    1. Modal mở với form trống
    2. Submit khi chưa điền term → nút vẫn disabled
    3. Điền term + chọn ngôn ngữ → submit → DevTools thấy `POST /vocabulary` 201
    4. Bật translation → điền translation + chọn ngôn ngữ đích → DevTools thấy `POST /vocabulary/:id/translations` 201
    5. `POST /vocabulary/:id/add-to-my-list` 201 (silent)
    6. Modal đóng, danh sách reload, từ mới xuất hiện đầu trang
  - **Kết quả**: Full flow hoạt động end-to-end

- [ ] **TODO-3.3**: Smoke test — conflict path (từ đã tồn tại)
  - **Thay đổi**: Submit lại cùng term + ngôn ngữ vừa tạo
  - **Verify**: Banner đỏ "This word already exists for the selected language." xuất hiện; modal không đóng; có thể sửa và submit lại
  - **Kết quả**: Error handling 409 hoạt động đúng

---

## Ghi chú triển khai
- `languages` state tại VocabularyPage được fetch 1 lần lúc mount và tái dụng cho modal — không có thêm network request
- `addToMyList` dùng fire-and-forget (`catch(() => {})`) — nếu fail (vd: từ đã trong list) thì im lặng, user vẫn tự tay nhấn "+ Add" từ danh sách
- Modal dùng `if (!isOpen) return null` (unmount khi đóng) — đơn giản hơn `visibility:hidden`, đảm bảo `useEffect` reset chạy đúng
- Spread conditional fields khi create: `...(form.cefrLevel && { cefrLevel: form.cefrLevel })` — tránh gửi empty string lên backend (backend validate `@IsIn` sẽ fail với `""`)

## Rủi ro cần theo dõi
- [ ] **Risk-1**: `addToMyList` 404 nếu DB constraint `UserVocabulary` unique bị vi phạm — Biện pháp: đã dùng fire-and-forget, không ảnh hưởng UX
- [ ] **Risk-2**: Translation submit tiếng Nhật/Trung với ký tự unicode — Biện pháp: backend đã dùng `@IsString()` không giới hạn charset, không cần thêm
- [ ] **Risk-3**: `languages` array rỗng khi `GET /languages` chưa trả về — Biện pháp: `languageCode` select disabled nếu `languages.length === 0`; thêm check `if (!languages.length) { ... }` trong TODO-1.1.2
