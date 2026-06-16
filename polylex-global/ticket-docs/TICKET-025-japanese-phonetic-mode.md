# TICKET-025: Tùy chọn chế độ hiển thị phiên âm tiếng Nhật (Hiragana / Kanji)

## Mô tả yêu cầu

Khi học tiếng Nhật, người dùng cần có thể chọn cách hiển thị phiên âm (`phoneticRomaji`) theo 2 chế độ:
- **Hiragana**: Chỉ hiển thị phần đọc hiragana (ví dụ: `たべる`)
- **Kanji**: Hiển thị toàn bộ định dạng đầy đủ gồm kanji + furigana + romaji (ví dụ: `食べる (たべる, taberu)`) — đây là hành vi hiện tại

Lựa chọn này cần được lưu lại và áp dụng xuyên suốt toàn bộ UI (VocabularyPage, WordDetailSheet, FlashCard, ReviewPage).

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-025 |
| **Tiêu đề** | Tùy chọn chế độ hiển thị phiên âm tiếng Nhật (Hiragana / Kanji) |
| **Mục tiêu** | Cho phép người dùng chọn xem phiên âm tiếng Nhật dạng hiragana thuần hoặc dạng kanji đầy đủ |
| **Phạm vi** | Frontend (Zustand store, PhoneticDisplay, ProfilePage) · Không cần thay đổi backend/DB |
| **Độ ưu tiên** | Trung bình |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Lưu preference chế độ phiên âm | Thêm `japanesePhoneticMode: 'hiragana' \| 'kanji'` vào `audio-settings.store.ts` với `persist` (localStorage) | Frontend store | Nhỏ |
| REQ-02 | Parse hiragana từ `phoneticRomaji` | Viết utility function tách phần hiragana ra khỏi chuỗi định dạng `"漢字 (よみがな, romaji)"` | Frontend utils | Nhỏ |
| REQ-03 | PhoneticDisplay hỗ trợ 2 chế độ | Extend `PhoneticDisplay` nhận thêm prop `languageCode` và đọc store để lọc hiển thị theo mode | Frontend component | Nhỏ |
| REQ-04 | UI chọn chế độ trên ProfilePage | Thêm toggle/select "Japanese Reading" trên ProfilePage, chỉ hiện khi user đang học tiếng Nhật | Frontend page | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 ──> REQ-03 ──> REQ-04
(store)    (parse)   (display)   (UI)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Lưu preference chế độ phiên âm
- **Mục tiêu**: Thêm `japanesePhoneticMode` vào Zustand store với `persist` để lưu qua localStorage, mặc định là `'kanji'` (giữ hành vi hiện tại)
- **Đầu vào**: Lựa chọn của user (`'hiragana'` | `'kanji'`)
- **Đầu ra mong đợi**: Store được persist dưới key `polylex_audio_settings` (mở rộng store hiện có)
- **Tiêu chí hoàn thành**: Khi reload app, mode vẫn được giữ nguyên
- **Phụ thuộc**: Không

##### REQ-02: Parse hiragana từ `phoneticRomaji`
- **Mục tiêu**: Viết function `extractJapanesePhonetic(raw: string, mode: 'hiragana' | 'kanji')` trả về chuỗi phù hợp
- **Đầu vào**: Chuỗi `phoneticRomaji` dạng:
  - Có kanji: `"食べる (たべる, taberu)"` 
  - Thuần kana: `"ありがとう (arigatou)"`
- **Đầu ra mong đợi**:
  - `mode='kanji'`: trả về nguyên chuỗi gốc (hành vi cũ)
  - `mode='hiragana'`: trả về phần trong ngoặc trước dấu phẩy hoặc `)`: `"たべる"` / `"ありがとう"`
- **Tiêu chí hoàn thành**: Regex xử lý đúng cả 2 format; không crash khi chuỗi không đúng format
- **Phụ thuộc**: Không

##### REQ-03: PhoneticDisplay hỗ trợ 2 chế độ
- **Mục tiêu**: Khi `languageCode='ja'` và mode là `'hiragana'`, `PhoneticDisplay` chỉ hiển thị phần hiragana thay vì chuỗi đầy đủ
- **Đầu vào**: Props hiện tại (`phonetic`, `phoneticRomaji`, `className`) + prop mới `languageCode?: string`
- **Đầu ra mong đợi**: Hiển thị đúng theo mode; khi không phải tiếng Nhật thì không thay đổi gì
- **Tiêu chí hoàn thành**: Áp dụng cho tất cả nơi dùng `PhoneticDisplay`: `WordRow`, `WordDetailSheet`, `FlashCard`
- **Phụ thuộc**: REQ-01, REQ-02

##### REQ-04: UI chọn chế độ trên ProfilePage
- **Mục tiêu**: Thêm UI toggle hoặc select "Japanese reading" vào ProfilePage, chỉ hiển thị khi user đang học tiếng Nhật (language code `ja` trong `learningLanguages`)
- **Đầu vào**: `user.learningLanguages`, state từ store
- **Đầu ra mong đợi**: User thấy selector cho `Kana only (hiragana)` / `Full (kanji + furigana)`, thay đổi ngay tức thì
- **Tiêu chí hoàn thành**: Toggle hoạt động, persist sau reload
- **Phụ thuộc**: REQ-01, REQ-03

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng học**: User học từ tiếng Nhật → xem card từ → phiên âm hiện tại luôn là `"食べる (たべる, taberu)"` → với người mới học chữ kanji, format này khó đọc → cần option chỉ xem hiragana `"たべる"`
- **Thực thể liên quan**: `VocabularyBase.phoneticRomaji`, `User.learningLanguages`, frontend display preference
- **Quy tắc nghiệp vụ bảo toàn**: 
  - Default phải là `'kanji'` (giữ nguyên hành vi hiện tại — không break user cũ)
  - Khi `languageCode !== 'ja'`, `PhoneticDisplay` không thay đổi gì
  - Logic parse chỉ áp dụng cho `phoneticRomaji`, không ảnh hưởng `phonetic` (IPA)

---

### 4. Ngữ cảnh kỹ thuật

**DB format hiện tại của `phoneticRomaji` cho tiếng Nhật** (generate bởi `getPhoneticRomajiGuide` trong `ai.service.ts`):
- Từ có kanji: `"食べる (たべる, taberu)"`
- Từ thuần kana: `"ありがとう (arigatou)"`

**Files bị ảnh hưởng**:

| File | Thay đổi |
|------|---------|
| `apps/frontend/src/store/audio-settings.store.ts` | Thêm `japanesePhoneticMode` field và setter |
| `apps/frontend/src/components/ui/PhoneticDisplay.tsx` | Thêm prop `languageCode`, tích hợp store + parse logic |
| `apps/frontend/src/pages/ProfilePage.tsx` | Thêm UI selector điều kiện khi học tiếng Nhật |
| `apps/frontend/src/utils/japanese.ts` | Tạo mới: `extractJapanesePhonetic()` |

**Files gọi `PhoneticDisplay` cần truyền thêm `languageCode`**:
- `apps/frontend/src/components/vocab/WordRow.tsx` (line 35)
- `apps/frontend/src/components/vocab/WordDetailSheet.tsx` (line 44)
- `apps/frontend/src/components/review/FlashCard.tsx` (line 101)

**Store hiện tại** (`audio-settings.store.ts`): Đã dùng `persist` với key `polylex_audio_settings` — có thể mở rộng thêm field mà không cần tạo store mới.

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `PhoneticDisplay` luôn render nguyên chuỗi `phoneticRomaji` | Render dựa theo user preference | Thiếu mode switching logic |
| Không có preference Japanese phonetic trong store | `japanesePhoneticMode` trong Zustand với persist | Thiếu store field |
| `ProfilePage` chỉ có toggle voice gender | Có thêm Japanese phonetic mode selector | Thiếu UI section |
| `PhoneticDisplay` không nhận `languageCode` | Cần biết ngôn ngữ để quyết định có parse không | Thiếu prop |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **User cũ bị thay đổi mặc định**: Nếu default = `'hiragana'`, user cũ sẽ thấy khác. Biện pháp: Default phải là `'kanji'` (giữ nguyên hành vi cũ)
- [ ] **PhoneticDisplay không nhận languageCode → không parse**: Các nơi không truyền `languageCode` sẽ dùng hành vi cũ (safe fallback). Biện pháp: Prop optional, fallback không parse

#### 6.2 Rủi ro kỹ thuật
- [ ] **Format `phoneticRomaji` không nhất quán**: Một số từ cũ có thể được AI generate theo format khác. Biện pháp: regex phải robust, fallback về chuỗi gốc nếu không match
- [ ] **`languageCode` không luôn có sẵn tại điểm render**: `WordRow` nhận `VocabularyBase` — cần check xem `languageCode` có trong response không. Biện pháp: đọc từ `vocabularyBase.language.code` nếu có, hoặc từ context learningLanguage

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **Regex parse từ thuần kana bị sai**: `"ありがとう (arigatou)"` — phần trong ngoặc là romaji, không phải hiragana riêng. Cần detect: nếu text trước `(` là thuần hiragana/katakana, trả về chính nó (`ありがとう`). Biện pháp: check charset trước khi regex
- [ ] **Chuỗi chứa katakana**: Một số từ tiếng Nhật có katakana (e.g. `コンピューター`). Regex hiragana-only sẽ không match. Biện pháp: mở rộng regex nhận cả katakana nếu cần

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Không cần backend/DB change — thuần frontend | Preference không sync giữa thiết bị (localStorage only) |
| Zero migration risk | Nếu sau này cần sync, cần thêm backend |
| Mở rộng store hiện có, không tạo mới | Phải truyền `languageCode` qua tất cả caller của `PhoneticDisplay` |
| Parse từ chuỗi đã có — không cần reindex/migrate data | Phụ thuộc vào format cố định của AI — format thay đổi sẽ break parse |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Frontend-only Zustand preference (không cần backend). Lý do: đây là display preference thuần túy, không ảnh hưởng server; pattern nhất quán với `audioRate` đang dùng localStorage.
- **Các cách tiếp cận thay thế**: Lưu vào DB (`User.japanesePhoneticMode`) — phức tạp hơn nhưng sync cross-device.
- **Phụ thuộc**: Không có phụ thuộc ngoài. Có thể implement hoàn toàn độc lập.
- **Ước tính công sức**: Nhỏ — ~4 file thay đổi, không có DB migration.

---

### 9. Câu hỏi mở

- [x] **Q1**: `languageCode` của từ có sẵn trong props tại `WordRow` / `FlashCard` không, hay cần fetch thêm?
  - **Trả lời**: Có sẵn. `WordRow` và `WordDetailSheet` dùng `VocabItem` có `language: { code, name }`. `FlashCard` dùng `item.vocabularyBase.language.code`. Không cần fetch thêm.
- [x] **Q2**: Chế độ "hiragana" có nên cũng ẩn cả phần romaji IPA (`phonetic`) không, hay vẫn giữ?
  - **Trả lời**: Giữ nguyên `phonetic` (IPA). `phoneticRomaji` và `phonetic` là hai field riêng biệt. Chế độ hiragana chỉ ảnh hưởng cách render `phoneticRomaji`, không ẩn IPA.
- [x] **Q3**: Katakana có được xếp vào nhóm "hiragana (kana mode)" không? (e.g. `コーヒー` → mode hiragana có hiện không?)
  - **Trả lời**: Có. Chế độ "kana only" bao gồm cả hiragana lẫn katakana — đây là "native script mode". Regex parse chấp nhận cả hai Unicode ranges.

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Thêm preference `japanesePhoneticMode` (hiragana/kanji) vào Zustand store, viết parser utility, cập nhật `PhoneticDisplay` để áp dụng mode khi `languageCode='ja'`, và thêm UI toggle trên `ProfilePage` chỉ hiện với người học tiếng Nhật.

---

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: Store `japanesePhoneticMode: 'hiragana' | 'kanji'` được persist qua localStorage, mặc định `'kanji'`
2. FR-02: Function `extractJapanesePhonetic(raw, mode)` parse chuỗi `"食べる (たべる, taberu)"` → `"たべる"` khi mode=hiragana; trả về nguyên chuỗi khi mode=kanji; không crash khi format bất thường
3. FR-03: `PhoneticDisplay` khi nhận `languageCode='ja'` và mode=hiragana, render phần kana thay vì chuỗi đầy đủ
4. FR-04: ProfilePage hiển thị toggle "Japanese reading mode" chỉ khi `user.learningLanguages` chứa code `'ja'`

#### Ràng buộc phi chức năng
1. NFR-01: Mặc định là `'kanji'` — không thay đổi hành vi cho user hiện tại
2. NFR-02: `PhoneticDisplay` không bị ảnh hưởng khi `languageCode` không được truyền hoặc không phải `'ja'`
3. NFR-03: Không có DB migration, không có backend change
4. NFR-04: `partialize` của store phải include `japanesePhoneticMode` để persist đúng

#### Phụ thuộc
- DEP-01: REQ-01 (store) phải hoàn thành trước REQ-03 và REQ-04 (cả hai đọc store)
- DEP-02: REQ-02 (parse util) phải hoàn thành trước REQ-03 (PhoneticDisplay gọi util)
- DEP-03: REQ-03 (PhoneticDisplay) phải hoàn thành trước khi cập nhật call sites

---

### Cách tiếp cận
> Mở rộng Zustand store hiện có (không tạo store mới), thêm utility file nhỏ cho parse logic, extend `PhoneticDisplay` với optional prop `languageCode`, cập nhật 3 call sites, thêm UI section vào ProfilePage.

---

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Tạo mới | `apps/frontend/src/utils/japanese.ts` | `extractJapanesePhonetic()` parse hiragana/kanji |
| Sửa đổi | `apps/frontend/src/store/audio-settings.store.ts` | Thêm `japanesePhoneticMode` + setter |
| Sửa đổi | `apps/frontend/src/components/ui/PhoneticDisplay.tsx` | Thêm prop `languageCode`, tích hợp store + util |
| Sửa đổi | `apps/frontend/src/components/vocab/WordRow.tsx` | Truyền `languageCode={item.language.code}` |
| Sửa đổi | `apps/frontend/src/components/vocab/WordDetailSheet.tsx` | Truyền `languageCode={item.language.code}` |
| Sửa đổi | `apps/frontend/src/components/review/FlashCard.tsx` | Truyền `languageCode={item.vocabularyBase.language.code}` |
| Sửa đổi | `apps/frontend/src/pages/ProfilePage.tsx` | Thêm UI toggle Japanese reading mode |

---

## PLAN TODO

### Phase 1: Store (REQ-01)

#### REQ-01: Lưu preference chế độ phiên âm

- [x] **TODO-1.1.1**: Thêm type + field `japanesePhoneticMode` vào `AudioSettingsState`
  - **File**: `apps/frontend/src/store/audio-settings.store.ts`
  - **Context**: Đọc file hiện tại — chỉ có `rate` và `setRate`
  - **Thay đổi**:
    - Trong `interface AudioSettingsState`, thêm sau `setRate`:
      ```ts
      japanesePhoneticMode: 'hiragana' | 'kanji';
      setJapanesePhoneticMode: (mode: 'hiragana' | 'kanji') => void;
      ```
    - Trong `create()` set object, thêm sau `setRate`:
      ```ts
      japanesePhoneticMode: 'kanji',
      setJapanesePhoneticMode: (mode) => set({ japanesePhoneticMode: mode }),
      ```
    - Trong `partialize`, đổi từ `({ rate: state.rate })` thành `({ rate: state.rate, japanesePhoneticMode: state.japanesePhoneticMode })`
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — không có lỗi mới
  - **Kết quả**: Store có field mới, persist qua localStorage key `polylex_audio_settings`

---

### Phase 2: Core Logic / Utils (REQ-02)

#### REQ-02: Parse hiragana từ `phoneticRomaji`

- [x] **TODO-2.2.1**: Tạo file `japanese.ts` với function `extractJapanesePhonetic`
  - **File**: `apps/frontend/src/utils/japanese.ts` (tạo mới)
  - **Context**: Không cần đọc file khác; logic self-contained
  - **Thay đổi**: Tạo file với nội dung:
    ```ts
    /**
     * Extracts the appropriate Japanese phonetic string based on display mode.
     *
     * Input formats from AI:
     *   - With kanji: "食べる (たべる, taberu)"
     *   - Kana-only:  "ありがとう (arigatou)"
     *
     * Mode 'kanji'    → returns raw string unchanged
     * Mode 'hiragana' → returns only the kana part:
     *   "食べる (たべる, taberu)" → "たべる"
     *   "ありがとう (arigatou)"  → "ありがとう"  (text before '(' is already kana)
     */
    const KANA_RE = /^[\u3040-\u309F\u30A0-\u30FF\uFF65-\uFF9F\s]+$/;

    export function extractJapanesePhonetic(
      raw: string,
      mode: 'hiragana' | 'kanji',
    ): string {
      if (!raw || mode === 'kanji') return raw;

      const parenIdx = raw.indexOf('(');
      if (parenIdx === -1) return raw; // no parens → return as-is

      const beforeParen = raw.slice(0, parenIdx).trim();

      // If text before '(' is already pure kana, return it directly
      if (KANA_RE.test(beforeParen)) return beforeParen;

      // Extract content inside parens: "たべる, taberu" or "arigatou"
      const closeIdx = raw.indexOf(')', parenIdx);
      const inner = closeIdx === -1
        ? raw.slice(parenIdx + 1).trim()
        : raw.slice(parenIdx + 1, closeIdx).trim();

      // Take portion before the first comma (the kana reading)
      const commaIdx = inner.indexOf(',');
      const kana = commaIdx === -1 ? inner : inner.slice(0, commaIdx).trim();

      return kana || raw; // fallback to raw if parse fails
    }
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — không lỗi
  - **Kết quả**: Utility function parse đúng cả 2 format, fallback an toàn

---

### Phase 3: Component (REQ-03)

#### REQ-03: PhoneticDisplay hỗ trợ 2 chế độ

- [x] **TODO-3.3.1**: Thêm prop `languageCode` và tích hợp store/util vào `PhoneticDisplay`
  - **File**: `apps/frontend/src/components/ui/PhoneticDisplay.tsx`
  - **Context**: Đọc `audio-settings.store.ts` (TODO-1.1.1) và `utils/japanese.ts` (TODO-2.2.1)
  - **Thay đổi**:
    - Thêm import ở đầu file:
      ```ts
      import { useAudioSettingsStore } from '@/store/audio-settings.store';
      import { extractJapanesePhonetic } from '@/utils/japanese';
      ```
    - Thêm `languageCode?: string` vào `PhoneticDisplayProps` interface
    - Trong function body (trước `if (!phoneticRomaji && !phonetic)`), thêm:
      ```ts
      const japanesePhoneticMode = useAudioSettingsStore((s) => s.japanesePhoneticMode);
      const displayRomaji = phoneticRomaji && languageCode === 'ja'
        ? extractJapanesePhonetic(phoneticRomaji, japanesePhoneticMode)
        : phoneticRomaji;
      ```
    - Thay `{phoneticRomaji}` trong JSX thành `{displayRomaji}`
    - Cập nhật `if (!phoneticRomaji && !phonetic)` thành `if (!displayRomaji && !phonetic)`
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — không lỗi
  - **Kết quả**: `PhoneticDisplay` biết lọc theo mode khi `languageCode='ja'`; không thay đổi với ngôn ngữ khác

---

### Phase 4: Call Sites — Truyền `languageCode` prop (REQ-03 tiếp theo)

#### Call site 1: WordRow

- [x] **TODO-4.3.1**: Truyền `languageCode` vào `PhoneticDisplay` trong `WordRow`
  - **File**: `apps/frontend/src/components/vocab/WordRow.tsx`
  - **Context**: Đọc component — `item.language.code` có sẵn trong `VocabItem`
  - **Thay đổi**: Tại `<PhoneticDisplay>` call (dòng ~35), thêm prop:
    ```tsx
    <PhoneticDisplay
      phonetic={item.phonetic}
      phoneticRomaji={item.phoneticRomaji}
      languageCode={item.language.code}
      className="text-xs"
    />
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — không lỗi
  - **Kết quả**: `WordRow` truyền language code → `PhoneticDisplay` áp dụng mode đúng

#### Call site 2: WordDetailSheet

- [x] **TODO-4.3.2**: Truyền `languageCode` vào `PhoneticDisplay` trong `WordDetailSheet`
  - **File**: `apps/frontend/src/components/vocab/WordDetailSheet.tsx`
  - **Context**: Dùng `VocabItem` (cùng type với `WordRow`) — `item.language.code` có sẵn
  - **Thay đổi**: Tại `<PhoneticDisplay>` call (dòng ~44), thêm prop:
    ```tsx
    <PhoneticDisplay
      phonetic={item.phonetic}
      phoneticRomaji={item.phoneticRomaji}
      languageCode={item.language.code}
      className="text-sm"
    />
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — không lỗi
  - **Kết quả**: `WordDetailSheet` truyền đúng language code

#### Call site 3: FlashCard

- [x] **TODO-4.3.3**: Truyền `languageCode` vào `PhoneticDisplay` trong `FlashCard`
  - **File**: `apps/frontend/src/components/review/FlashCard.tsx`
  - **Context**: Dùng `item.vocabularyBase.language.code` (khác cấu trúc với `VocabItem`)
  - **Thay đổi**: Tại `<PhoneticDisplay>` call (dòng ~101), thêm prop:
    ```tsx
    <PhoneticDisplay
      phonetic={item.vocabularyBase.phonetic}
      phoneticRomaji={item.vocabularyBase.phoneticRomaji}
      languageCode={item.vocabularyBase.language.code}
      className="text-sm mb-3"
    />
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — không lỗi
  - **Kết quả**: FlashCard review screen áp dụng đúng mode

---

### Phase 5: UI Settings (REQ-04)

#### REQ-04: UI toggle chế độ phiên âm tiếng Nhật trên ProfilePage

- [x] **TODO-5.4.1**: Thêm `japanesePhoneticMode` từ store vào `ProfilePage`
  - **File**: `apps/frontend/src/pages/ProfilePage.tsx`
  - **Context**: Đọc phần `const { rate, setRate } = useAudioSettingsStore();` — ở dòng ~25
  - **Thay đổi**: Đổi dòng destructure store từ:
    ```ts
    const { rate, setRate } = useAudioSettingsStore();
    ```
    thành:
    ```ts
    const { rate, setRate, japanesePhoneticMode, setJapanesePhoneticMode } = useAudioSettingsStore();
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — không lỗi
  - **Kết quả**: `ProfilePage` có access vào store field mới

- [x] **TODO-5.4.2**: Thêm UI section "Japanese reading" vào ProfilePage
  - **File**: `apps/frontend/src/pages/ProfilePage.tsx`
  - **Context**: Đọc phần voice settings section (khoảng dòng 175–235) để hiểu pattern layout; section này chỉ hiển thị khi `user?.learningLanguages?.some(l => l.code === 'ja')`
  - **Thay đổi**: Sau closing `</section>` của "TTS Voice Settings" và trước `{/* Learning languages */}`, chèn block:
    ```tsx
    {/* Japanese Phonetic Mode — only shown when learning Japanese */}
    {user?.learningLanguages?.some((l) => l.code === 'ja') && (
      <section>
        <h3 className="text-sm font-semibold text-[#94A3B8] uppercase tracking-wider mb-3">
          {t('profile.japaneseReading')}
        </h3>
        <div className="bg-[#1A1A2E] rounded-2xl px-4 py-3 border border-white/5">
          <div className="grid grid-cols-2 gap-2">
            {(['hiragana', 'kanji'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setJapanesePhoneticMode(mode)}
                className={`py-2.5 rounded-xl text-xs font-medium transition-colors ${
                  japanesePhoneticMode === mode
                    ? 'bg-[#6366F1] text-white'
                    : 'bg-[#0F0F1A] text-[#94A3B8] border border-white/10 hover:border-[#6366F1]/50'
                }`}
              >
                {mode === 'hiragana' ? t('profile.kanaOnly') : t('profile.fullKanji')}
              </button>
            ))}
          </div>
        </div>
      </section>
    )}
    ```
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — không lỗi; UI hiển thị đúng khi user học tiếng Nhật
  - **Kết quả**: Toggle visible với user học Japanese; thay đổi persist ngay

- [x] **TODO-5.4.3**: Thêm i18n keys cho section mới vào translation files
  - **File**: `apps/frontend/src/i18n/` (tìm file `en.json` hoặc tương đương; thêm cùng key vào tất cả locale có sẵn)
  - **Context**: Tìm key `profile.voiceSettings` trong translation files để hiểu cấu trúc
  - **Thay đổi**: Thêm 3 key mới vào mỗi locale:
    ```json
    "profile.japaneseReading": "Japanese Reading",
    "profile.kanaOnly": "Kana only (hiragana)",
    "profile.fullKanji": "Full (kanji + reading)"
    ```
    (Dịch phù hợp theo từng locale — vi: `"Chế Độ Đọc Tiếng Nhật"`, `"Chỉ Kana"`, `"Đầy Đủ (Kanji + Furigana)"`)
  - **Verify**: `cd apps/frontend && npx tsc --noEmit` — không lỗi; không còn missing i18n key
  - **Kết quả**: Label hiển thị đúng theo ngôn ngữ app

---

### Phase 6: Integration & Verification

- [x] **TODO-6.1**: TypeScript build check toàn bộ frontend
  - **Thay đổi**: Chạy `cd apps/frontend && npx tsc --noEmit`
  - **Verify**: Zero errors
  - **Kết quả**: Tất cả types pass, không có regression

- [ ] **TODO-6.2**: Smoke test thủ công — chế độ hiragana _(manual)_
  - **Thay đổi**: Vào ProfilePage → toggle "Kana only" → mở VocabularyPage với từ tiếng Nhật → kiểm tra `PhoneticDisplay` hiện `たべる` thay vì `食べる (たべる, taberu)`
  - **Verify**: Display đúng; reload app → mode vẫn giữ nguyên
  - **Kết quả**: REQ-03 + REQ-04 confirmed

- [ ] **TODO-6.3**: Smoke test thủ công — FlashCard review _(manual)_
  - **Thay đổi**: Vào review session với từ tiếng Nhật → flip card → kiểm tra phonetic display trong mode hiragana
  - **Verify**: `PhoneticDisplay` trên back of card hiển thị kana (không có kanji + romaji)
  - **Kết quả**: REQ-03 confirmed trên review flow

- [ ] **TODO-6.4**: Verify fallback cho ngôn ngữ khác _(manual)_
  - **Thay đổi**: Switch profile về học tiếng Trung / Anh → xem VocabularyPage → kiểm tra `PhoneticDisplay` không thay đổi gì
  - **Verify**: Pinyin / IPA display không bị ảnh hưởng
  - **Kết quả**: NFR-02 confirmed

---

## Ghi chú triển khai

- `useAudioSettingsStore` được gọi trong `PhoneticDisplay` — component này là pure presentational hiện tại. Việc thêm store hook làm nó có side-effect nhỏ, nhưng đây là cách nhất quán với pattern đang dùng trong `WordDetailSheet` và `FlashCard` (đều gọi `useAudioSettingsStore` trực tiếp).
- Pattern `partialize` trong Zustand phải được cập nhật (TODO-1.1.1) — quên cập nhật `partialize` sẽ khiến `japanesePhoneticMode` không được persist.
- Thứ tự TODO quan trọng: 1.1.1 → 2.2.1 → 3.3.1 → 4.3.x → 5.4.x

## Rủi ro cần theo dõi

- [x] Risk-1: Format `phoneticRomaji` cho tiếng Nhật thuần kana — `"ありがとう (arigatou)"` → phần trước `(` là hiragana → `extractJapanesePhonetic` phải trả về `"ありがとう"` (không phải `"arigatou"`). Biện pháp: `KANA_RE` check trong TODO-2.2.1 xử lý case này. ✅ Đã xử lý trong `japanese.ts`.
- [x] Risk-2: `partialize` bị quên cập nhật → `japanesePhoneticMode` reset về default mỗi reload. Biện pháp: Verify step TODO-6.2 explicitly check reload. ✅ `partialize` đã include `japanesePhoneticMode`.
- [x] Risk-3: i18n key thiếu ở một số locale → fallback key hiển thị raw (e.g. `"profile.kanaOnly"`). Biện pháp: TODO-5.4.3 cập nhật tất cả locale files cùng lúc. ✅ Đã thêm vào `en.json`, `vi.json`, `pt.json`.

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Thêm thành công tùy chọn chế độ hiển thị phiên âm tiếng Nhật (hiragana / kanji đầy đủ), persist qua localStorage, áp dụng xuyên suốt VocabularyPage, WordDetailSheet, FlashCard; UI toggle trên ProfilePage chỉ hiện khi user học tiếng Nhật.

### Thống kê
- **Tổng TODO**: 13
- **Hoàn thành (code)**: 10 ✅
- **Manual test còn lại**: 3 (TODO-6.2, 6.3, 6.4 — cần browser)

### TODO Status

| TODO | Tiêu đề | Status |
|------|---------|--------|
| TODO-1.1.1 | Store `japanesePhoneticMode` | ✅ Done |
| TODO-2.2.1 | Tạo `japanese.ts` util | ✅ Done |
| TODO-3.3.1 | Update `PhoneticDisplay` | ✅ Done |
| TODO-4.3.1 | `WordRow` — truyền `languageCode` | ✅ Done |
| TODO-4.3.2 | `WordDetailSheet` — truyền `languageCode` | ✅ Done |
| TODO-4.3.3 | `FlashCard` — truyền `languageCode` | ✅ Done |
| TODO-5.4.1 | `ProfilePage` — destructure store | ✅ Done |
| TODO-5.4.2 | `ProfilePage` — UI section | ✅ Done |
| TODO-5.4.3 | i18n keys (en/vi/pt) | ✅ Done |
| TODO-6.1 | TypeScript build check | ✅ Done — EXIT:0 |
| TODO-6.2 | Smoke test hiragana mode | ⏳ Manual |
| TODO-6.3 | Smoke test FlashCard | ⏳ Manual |
| TODO-6.4 | Verify fallback ngôn ngữ khác | ⏳ Manual |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/frontend/src/store/audio-settings.store.ts` | Modified | Thêm `japanesePhoneticMode` + setter + partialize |
| `apps/frontend/src/utils/japanese.ts` | Created | `extractJapanesePhonetic()` với kana detection |
| `apps/frontend/src/components/ui/PhoneticDisplay.tsx` | Modified | Thêm prop `languageCode`, store hook, parse logic |
| `apps/frontend/src/components/vocab/WordRow.tsx` | Modified | Truyền `languageCode={item.language.code}` |
| `apps/frontend/src/components/vocab/WordDetailSheet.tsx` | Modified | Truyền `languageCode={item.language.code}` |
| `apps/frontend/src/components/review/FlashCard.tsx` | Modified | Truyền `languageCode={item.vocabularyBase.language.code}` |
| `apps/frontend/src/pages/ProfilePage.tsx` | Modified | Destructure store mới + UI section Japanese reading |
| `apps/frontend/src/i18n/locales/en.json` | Modified | 3 keys mới: `japaneseReading`, `kanaOnly`, `fullKanji` |
| `apps/frontend/src/i18n/locales/vi.json` | Modified | 3 keys mới (tiếng Việt) |
| `apps/frontend/src/i18n/locales/pt.json` | Modified | 3 keys mới (tiếng Bồ Đào Nha) |

### Verification
- Build thành công: ✅ (`npx tsc --noEmit` EXIT:0)
- Không có warning TypeScript mới: ✅
- Manual smoke tests: ⏳ cần thực hiện trên browser
