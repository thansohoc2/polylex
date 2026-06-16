# TICKET-006 — Thiết kế lại trang My Vocabulary

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-006 |
| **Tiêu đề** | Thiết kế lại trang My Vocabulary — hữu ích hơn, không trùng lặp chức năng |
| **Mục tiêu** | Loại bỏ nút FAB (+) trùng lặp, đổi layout danh sách từ dạng "collapsed deck" sang flat list có thể tương tác, thêm word detail sheet, lọc theo ngôn ngữ bằng tab |
| **Phạm vi** | Frontend — `VocabularyPage.tsx`, `DeckCard.tsx` (xoá), component mới `WordRow`, `WordDetailSheet` |
| **Độ ưu tiên** | Cao — UX hiện tại gây nhầm lẫn (hai nút + cùng màu tím trên cùng màn hình) |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Xoá FAB trùng lặp | Xoá nút FAB (+) fixed trong VocabularyPage; chuyển trigger "Add Word" lên TopBar (rightAction icon) | Frontend | Nhỏ |
| REQ-02 | Language filter tabs | Thêm horizontal scrollable tabs phía dưới SearchBar để lọc theo ngôn ngữ (All / English / ...) | Frontend | Nhỏ |
| REQ-03 | WordRow component | Component hiển thị 1 từ: term + phonetic (dòng 1), CEFR badge + translation (dòng 2) | Frontend | Nhỏ |
| REQ-04 | WordDetailSheet component | Bottom sheet hiển thị chi tiết: term to, phonetic, CEFR, partOfSpeech, exampleSentence, tất cả translations | Frontend | Trung bình |
| REQ-05 | Rewrite VocabularyPage | Gắn tất cả REQ-01..04 lại thành trang mới, xoá DeckCard dependency | Frontend | Trung bình |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──────────────────> REQ-05
REQ-02 ──────────────────> REQ-05
REQ-03 ──> REQ-04 ──────> REQ-05
```

REQ-03, REQ-02, REQ-01 độc lập nhau → có thể làm song song.

#### Chi tiết từng yêu cầu con

##### REQ-01: Xoá FAB trùng lặp
- **Mục tiêu**: Màn hình Vocabulary hiện có 2 nút tím `+` — một là FAB của chính trang (fixed bottom-right), một là FAB trung tâm trong BottomNav. Người dùng không biết nút nào là gì.
- **Chẩn đoán**: BottomNav FAB → `/quick-notes`; VocabularyPage FAB → mở `AddWordModal`. Hai hành động khác nhau nhưng icon/màu sắc giống hệt nhau.
- **Fix**: Xoá `<button FAB>` khỏi VocabularyPage. Thêm `<button>` icon `Plus` vào `rightAction` prop của `AppShell` → hiển thị ở góc phải TopBar.
- **Tiêu chí hoàn thành**: Chỉ còn 1 nút tím (+) duy nhất ở bottom center (BottomNav); "Add Word" ở TopBar dạng icon nhỏ.

##### REQ-02: Language filter tabs
- **Mục tiêu**: Giúp người dùng có nhiều ngôn ngữ lọc nhanh
- **Đầu vào**: Danh sách ngôn ngữ từ các từ hiện có (`allItems.map(w => w.language)`)
- **Đầu ra**: Scrollable chip row: `All | 🇬🇧 English | 🇯🇵 Japanese | ...`; chọn tab → filter `filtered` items
- **Tiêu chí hoàn thành**: Tab "All" mặc định; chọn ngôn ngữ → chỉ show từ của ngôn ngữ đó; count trên mỗi tab

##### REQ-03: WordRow component
- **Mục tiêu**: Hiển thị 1 từ trong flat list, đủ info để nhận dạng, có thể tap
- **Layout**:
  - Dòng 1: `[term] [phonetic muted]` trái; `CEFR badge` phải
  - Dòng 2: `[partOfSpeech italic muted]` trái; `[translation]` phải
  - Tap → gọi `onPress(item)`
- **Tiêu chí hoàn thành**: Render đúng, truncate dài, chevron phải

##### REQ-04: WordDetailSheet component
- **Mục tiêu**: Khi tap vào 1 từ, mở bottom sheet với đầy đủ chi tiết
- **Nội dung**:
  - Header: `term` lớn + `phonetic` + `LanguageBadge`
  - `CEFR badge` + `partOfSpeech`
  - `exampleSentence` (nếu có)
  - Section "Translations": list tất cả translations với target language badge
  - Nút "Practice this word" → navigate `/review`
- **Tiêu chí hoàn thành**: Mở/đóng smooth, hiển thị đúng dữ liệu

##### REQ-05: Rewrite VocabularyPage
- **Mục tiêu**: Gắn kết tất cả component mới
- **Layout mới**:
  1. SearchBar
  2. Language filter tabs (chỉ hiện khi > 1 ngôn ngữ)
  3. Summary stats row: "X words · Y due today" (placeholder)
  4. Flat WordRow list (không collapse)
  5. WordDetailSheet (conditional)
  6. AddWordModal (triggered từ TopBar)
- **Xoá**: DeckCard dependency, page-level FAB
- **Tiêu chí hoàn thành**: TypeScript build pass, không có 2 FAB trên màn hình

---

### 3. Ngữ cảnh nghiệp vụ

- Người dùng học nhiều ngôn ngữ → cần lọc/nhóm theo ngôn ngữ
- Vocabulary là trung tâm của app — cần vừa dễ browse, vừa cung cấp context học
- ReviewPage đọc từ SRS queue; VocabularyPage là nơi xem/thêm từ → không overlap logic
- AddWordModal đã hoạt động tốt (TICKET-002), chỉ cần đổi trigger

### 4. Ngữ cảnh kỹ thuật

- **Files ảnh hưởng**:
  - `apps/frontend/src/pages/VocabularyPage.tsx` — rewrite
  - `apps/frontend/src/components/vocab/DeckCard.tsx` — không dùng nữa (có thể giữ, chỉ không import)
  - `apps/frontend/src/components/vocab/WordRow.tsx` — tạo mới
  - `apps/frontend/src/components/vocab/WordDetailSheet.tsx` — tạo mới
- **API**: Chỉ dùng `vocabularyApi.getMyList(page, limit)` (đã fix route ordering ở session trước)
- **Existing reuse**: `AppShell`, `SearchBar`, `SkeletonCard`, `LanguageBadge`, `CefrBadge`, `BottomSheet`, `AddWordModal`
- **VocabItem interface**: Đã có `id, term, phonetic?, cefrLevel?, partOfSpeech?, exampleSentence?, language, translations[]`

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| 2 FAB nút (+) tím trùng màu | 1 FAB (BottomNav) + 1 icon nhỏ TopBar | Xoá page FAB, thêm TopBar rightAction |
| Danh sách từ bị collapse "+N more" | Flat list scroll toàn bộ | Đổi DeckCard → WordRow list |
| ProgressBar hardcode 0.6 | Ẩn progress hoặc lấy từ review stats | Ẩn hoặc integrate thực |
| Không tap vào từ được | Bottom sheet chi tiết khi tap | Tạo WordDetailSheet |
| Không có language filter | Horizontal tab filter | Thêm tab row |

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] Người dùng quen vị trí FAB → Giảm thiểu: thêm tooltip hoặc pulse animation lần đầu trên icon TopBar
- [ ] WordDetailSheet che mất list → Giảm thiểu: dùng `BottomSheet` với drag-to-close đã có

#### 6.2 Rủi ro kỹ thuật
- [ ] `VocabItem` từ API có thể thiếu trường (phonetic=null) → Dùng optional chaining `?.`
- [ ] Flat list 100 từ → performance → thêm `limit=50` hoặc virtual scroll sau
- [ ] `BottomSheet` import path cần đúng → `@/components/layout/BottomSheet`

#### 6.3 Lỗi logic tiềm ẩn
- [ ] Language tabs derived từ `allItems` → nếu user chọn tab TRƯỚC khi data load → show "All" disabled khi loading
- [ ] Search + language tab filter chạy độc lập → combine đúng thứ tự: language filter trước, search sau

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Không còn UI nhầm lẫn 2 FAB | DeckCard hiện tại không dùng — cần giữ file để không break import khác |
| Flat list dễ scroll, dễ tìm | Mất grouping visual theo ngôn ngữ (thay bằng tab filter) |
| Word detail sheet tăng giá trị học | Cần tạo thêm 2 component mới |
| Tab filter hiệu quả hơn expand/collapse | — |

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Flat list + language tab filter + TopBar icon trigger (không FAB)
- **Alternatives**: Giữ DeckCard nhưng thêm tap-to-expand từng word — phức tạp hơn, ít gain
- **Phụ thuộc**: `BottomSheet` component, `CefrBadge`, `LanguageBadge` (tất cả đã có)
- **Ước tính công sức**: ~2-3 giờ frontend

### 9. Câu hỏi mở
- [ ] Có cần xoá DeckCard.tsx khỏi codebase hay chỉ không dùng?
- [ ] "Practice this word" trong WordDetailSheet nên navigate thẳng `/review` hay filter review queue theo word?

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Thiết kế lại trang My Vocabulary thành flat interactive list với language filter tabs, word detail bottom sheet, và loại bỏ FAB trùng lặp — giúp màn hình rõ ràng, hữu ích hơn mà không trùng chức năng với BottomNav.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: Xoá nút FAB (+) cố định trong VocabularyPage; đưa "Add Word" lên icon góc phải TopBar
2. FR-02: Hiển thị danh sách từ dạng flat list thay vì collapsed deck với "+N more"
3. FR-03: Mỗi dòng từ hiển thị: term, phonetic, CEFR badge, first translation, chevron
4. FR-04: Tap vào từ → mở bottom sheet với đầy đủ: phonetic, CEFR, partOfSpeech, exampleSentence, tất cả translations, nút Practice
5. FR-05: Language filter tabs ngang (chỉ hiện khi ≥ 2 ngôn ngữ): All / per-language + count
6. FR-06: Khi tab "All" đang chọn và có ≥ 2 ngôn ngữ → nhóm words theo ngôn ngữ kèm section header
7. FR-07: Search filter kết hợp với language tab (language filter trước, search sau)

#### Ràng buộc phi chức năng
1. NFR-01: TypeScript strict — không có lỗi `npx tsc --noEmit`
2. NFR-02: Tái sử dụng components đã có: `BottomSheet`, `LanguageBadge`, `CefrBadge`, `SearchBar`, `SkeletonCard`, `AppShell`
3. NFR-03: `VocabItem` interface phải export từ `WordRow.tsx` để `WordDetailSheet.tsx` import lại (tránh duplication)
4. NFR-04: Không thay đổi `AddWordModal`, không thay đổi backend API

#### Phụ thuộc
- DEP-01: `apps/frontend/src/components/layout/BottomSheet.tsx` — đã có, props: `isOpen`, `onClose`, `title`, `children`
- DEP-02: `apps/frontend/src/components/ui/Badge.tsx` — exports `CefrBadge`, `LanguageBadge`
- DEP-03: `apps/frontend/src/components/layout/AppShell.tsx` — prop `rightAction?: React.ReactNode`
- DEP-04: `apps/frontend/src/components/AddWordModal.tsx` — props không đổi
- DEP-05: `vocabularyApi.getMyList(page, limit)` — đã fix route ordering ở TICKET-006 backend

### Cách tiếp cận
> Tách trách nhiệm: `WordRow` (presentational) → `WordDetailSheet` (stateless, nhận `item | null`) → `VocabularyPage` (state container). VocabItem interface export từ WordRow để share type. Filter logic dùng `useMemo` chain: language filter → search filter.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Tạo mới | `apps/frontend/src/components/vocab/WordRow.tsx` | Component row 1 từ + export `VocabItem` interface |
| Tạo mới | `apps/frontend/src/components/vocab/WordDetailSheet.tsx` | Bottom sheet chi tiết từ, import `VocabItem` từ WordRow |
| Sửa đổi | `apps/frontend/src/pages/VocabularyPage.tsx` | Rewrite: bỏ DeckCard, thêm WordRow list + filter tabs + detail sheet |

---

## PLAN TODO

### Phase 1: Component Layer

#### REQ-03: WordRow component

- [x] **TODO-1.3.1**: Tạo file `WordRow.tsx` với interface `VocabItem` và component render 1 từ
  - **File**: `apps/frontend/src/components/vocab/WordRow.tsx`
  - **Context**: Đọc `apps/frontend/src/components/ui/Badge.tsx` để biết props của `CefrBadge`
  - **Thay đổi**:
    - Export interface `VocabItem` với fields: `id, term, phonetic?, cefrLevel?, partOfSpeech?, exampleSentence?, language: {code, name}, translations: [{translation, targetLanguage: {code, name}}]`
    - Export default `WordRow({ item, onPress })` — layout 2 dòng:
      - Dòng 1 trái: `term` (bold) + `phonetic` (muted); phải: `CefrBadge` nếu có
      - Dòng 2: `partOfSpeech` italic + `·` + first `translation` truncated; phải: `ChevronRight`
    - `onClick={() => onPress(item)}`; `active:bg-white/5` hover
  - **Verify**: `npx tsc --noEmit` không lỗi
  - **Kết quả**: File ~55 dòng, export được WordRow và VocabItem

#### REQ-04: WordDetailSheet component

- [x] **TODO-1.4.1**: Tạo file `WordDetailSheet.tsx` — bottom sheet chi tiết từ
  - **File**: `apps/frontend/src/components/vocab/WordDetailSheet.tsx`
  - **Context**:
    - Đọc `apps/frontend/src/components/layout/BottomSheet.tsx` để biết props: `isOpen, onClose, title?, children`
    - Đọc `apps/frontend/src/components/vocab/WordRow.tsx` để import `VocabItem`
  - **Thay đổi**:
    - Props: `{ item: VocabItem | null; onClose: () => void }`
    - Render `<BottomSheet isOpen={!!item} onClose={onClose}>` — nội dung chỉ render khi `item` có giá trị
    - Section 1 — Header: `term` h2 bold lớn + `LanguageBadge`; sub-row: `phonetic` + `CefrBadge` + `partOfSpeech` (pill style)
    - Section 2 — Example: block indented với border-left tím `#6366F1`, chỉ hiện khi `exampleSentence` có giá trị
    - Section 3 — Translations: label "TRANSLATIONS" uppercase tiny; list `{translation} | LanguageBadge(targetLanguage)` mỗi item bg rgba trên card tối
    - Section 4 — CTA: button gradient "Practice this word" → `onClose(); navigate('/review')`
  - **Verify**: `npx tsc --noEmit` không lỗi
  - **Kết quả**: File ~100 dòng, mở/đóng smooth qua BottomSheet AnimatePresence

### Phase 2: Page Rewrite

#### REQ-01: Xoá FAB trùng lặp

- [x] **TODO-2.1.1**: Xoá `<button FAB>` fixed trong VocabularyPage và thêm `rightAction` vào AppShell
  - **File**: `apps/frontend/src/pages/VocabularyPage.tsx`
  - **Context**: Đọc `apps/frontend/src/components/layout/AppShell.tsx` để xác nhận prop `rightAction?: React.ReactNode`
  - **Thay đổi**:
    - Xoá block `{/* FAB */}` cuối file (button `fixed bottom-24 right-5`)
    - Thêm `const topBarAction = (<button onClick={() => setShowModal(true)} ...><Plus size={18} /></button>)`
    - Truyền `rightAction={topBarAction}` vào `<AppShell>`
  - **Verify**: Màn hình chỉ còn 1 nút tím (+) ở bottom center (BottomNav)
  - **Kết quả**: Không còn 2 FAB trên cùng màn hình

#### REQ-02: Language filter tabs

- [x] **TODO-2.2.1**: Thêm state `langFilter` và `useMemo` cho `availableLangs` vào VocabularyPage
  - **File**: `apps/frontend/src/pages/VocabularyPage.tsx`
  - **Context**: Đọc state hiện tại trong file
  - **Thay đổi**:
    - Thêm `const [langFilter, setLangFilter] = useState<string>('all')`
    - Thêm `useMemo` → `availableLangs: {code, name}[]` dedupe từ `allItems`
    - Cập nhật logic `filtered` thành `useMemo`: language filter (`allItems.filter(w => w.language.code === langFilter)`) trước → search sau
  - **Verify**: `npx tsc --noEmit` không lỗi; `filtered` đổi khi chọn tab khác
  - **Kết quả**: State và derived data sẵn sàng cho tabs render

- [x] **TODO-2.2.2**: Render language filter tabs JSX trong VocabularyPage
  - **File**: `apps/frontend/src/pages/VocabularyPage.tsx`
  - **Context**: Đọc state `langFilter`, `availableLangs`, `allItems` vừa thêm
  - **Thay đổi**:
    - Sau `<SearchBar>`, thêm conditional: `{availableLangs.length > 1 && (<div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">`)}`
    - Button "All · {allItems.length}": active = `bg-[#6366F1] text-white`; inactive = `bg-white/5 text-[#64748B]`
    - Map `availableLangs` → button `{flag} {lang.name} · {count}` với same active/inactive styles
  - **Verify**: Với dữ liệu 1 ngôn ngữ → tabs ẩn; với ≥2 ngôn ngữ → tabs hiện
  - **Kết quả**: Horizontal scrollable filter tabs dưới SearchBar

#### REQ-03 + REQ-04: WordRow list + WordDetailSheet wiring

- [x] **TODO-2.3.1**: Thêm state `selected` và import WordRow, WordDetailSheet vào VocabularyPage
  - **File**: `apps/frontend/src/pages/VocabularyPage.tsx`
  - **Context**: Đọc `WordRow.tsx` để biết props `{ item, onPress }`; đọc `WordDetailSheet.tsx` để biết props `{ item, onClose }`
  - **Thay đổi**:
    - Thêm import `WordRow` từ `@/components/vocab/WordRow`
    - Thêm import `WordDetailSheet` từ `@/components/vocab/WordDetailSheet`
    - Thêm import type `VocabItem` từ `@/components/vocab/WordRow`
    - Thêm `const [selected, setSelected] = useState<VocabItem | null>(null)`
    - Xoá local `interface VocabItem` và `type LangGroup` (dùng từ WordRow)
  - **Verify**: `npx tsc --noEmit` không lỗi về duplicate interface
  - **Kết quả**: Types thống nhất, import sẵn sàng

- [x] **TODO-2.3.2**: Thay DeckCard groups bằng flat WordRow list trong JSX VocabularyPage
  - **File**: `apps/frontend/src/pages/VocabularyPage.tsx`
  - **Context**: Đọc logic filter `filtered` và `availableLangs`
  - **Thay đổi**:
    - Xoá import `DeckCard` và tất cả `DeckCard` JSX
    - Render condition:
      - `langFilter === 'all' && availableLangs.length > 1` → nhóm theo ngôn ngữ: section header `LanguageBadge + count`, bên trong map `<WordRow item={item} onPress={setSelected} />`
      - Otherwise → flat list `<div rounded-2xl>` map `<WordRow>`
    - Mỗi WordRow ngăn cách bằng `borderTop: '1px solid rgba(255,255,255,0.04)'`
  - **Verify**: Danh sách hiển thị đúng, tap vào từ → `selected` được set
  - **Kết quả**: Flat list hoàn chỉnh thay thế collapsible DeckCard

- [x] **TODO-2.3.3**: Render WordDetailSheet và AddWordModal cuối VocabularyPage
  - **File**: `apps/frontend/src/pages/VocabularyPage.tsx`
  - **Context**: Đọc props của `WordDetailSheet` và `AddWordModal`
  - **Thay đổi**:
    - Thêm `<WordDetailSheet item={selected} onClose={() => setSelected(null)} />` trước closing `</AppShell>`
    - Chuyển `<AddWordModal>` ra ngoài `<div px-4>` (sibling của WordDetailSheet, cùng cấp trong AppShell)
  - **Verify**: Tap word → sheet mở; tap backdrop hoặc drag down → đóng; sheet không render bên trong scroll container
  - **Kết quả**: Detail sheet hoạt động đúng z-index, không bị clip bởi overflow-hidden

### Phase 3: Integration & Verification

- [x] **TODO-3.1**: TypeScript type-check toàn bộ frontend
  - **Thay đổi**: Chạy `npx tsc --noEmit` trong `apps/frontend/`
  - **Verify**: Exit code 0, không có lỗi mới
  - **Kết quả**: Tất cả types đúng: `VocabItem` shared, optional chaining đủ, props match

- [x] **TODO-3.2**: Smoke test thủ công màn hình Vocabulary
  - **Thay đổi**: Mở `http://localhost:5173/vocabulary` trên trình duyệt
  - **Verify**:
    - Chỉ 1 nút tím (+) duy nhất ở bottom center (không có FAB page-level)
    - Icon (+) nhỏ ở TopBar góc phải → mở AddWordModal ✓
    - Danh sách từ hiển thị flat, mỗi row có term + translation + CEFR ✓
    - Tap vào từ → WordDetailSheet mở từ dưới lên ✓
    - Tap backdrop → sheet đóng ✓
    - Nút "Practice this word" → navigate `/review` ✓
    - Nếu có ≥2 ngôn ngữ: tabs filter hiển thị, click tab → lọc đúng ✓
  - **Kết quả**: UX rõ ràng, không nhầm lẫn nút

---

## Ghi chú triển khai
- `VocabItem` interface được export từ `WordRow.tsx` để `WordDetailSheet.tsx` và `VocabularyPage.tsx` cùng dùng — tránh duplicate type definition
- `DeckCard.tsx` giữ nguyên file (không xoá) để tránh break bất kỳ import nào trong tương lai; chỉ đơn giản là không được import bởi VocabularyPage nữa
- Language tabs chỉ hiện khi `availableLangs.length > 1` — người dùng 1 ngôn ngữ không thấy UI thừa
- Filter order: `language → search` (language filter loại bỏ tập lớn trước, search chạy trên tập nhỏ hơn → performance tốt hơn)

## Rủi ro cần theo dõi
- [x] Risk-1: `VocabItem.translations[0]` có thể undefined nếu từ chưa có translation — Biện pháp: dùng `?.` optional chaining, không render translation section nếu `item.translations.length === 0`
- [x] Risk-2: BottomSheet z-index bị che bởi BottomNav — Biện pháp: BottomSheet dùng `z-50`, BottomNav dùng `z-50` nhưng BottomSheet mount sau trong DOM → render trên cùng
- [x] Risk-3: `langFilter` state stale khi user xoá từ cuối cùng của 1 ngôn ngữ → tab đó vẫn hiện — Biện pháp: `availableLangs` derived từ `allItems` sẽ tự update sau `loadMyList()`; `filtered` tự trả empty list

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Trang My Vocabulary đã được thiết kế lại thành flat interactive list với language filter tabs, word detail bottom sheet, và loại bỏ hoàn toàn FAB trùng lặp — màn hình rõ ràng, không nhầm lẫn chức năng với BottomNav center FAB.

### Thống kê
- **Tổng TODO**: 9
- **Hoàn thành**: 9 ✅
- **Blocked**: 0

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-1.3.1 | Tạo WordRow.tsx + export VocabItem | ✅ Done | 56 dòng |
| TODO-1.4.1 | Tạo WordDetailSheet.tsx | ✅ Done | 95 dòng |
| TODO-2.1.1 | Xoá FAB page-level, thêm TopBar rightAction | ✅ Done | |
| TODO-2.2.1 | Thêm state langFilter + useMemo availableLangs | ✅ Done | |
| TODO-2.2.2 | Render language filter tabs JSX | ✅ Done | |
| TODO-2.3.1 | Import WordRow, WordDetailSheet, state selected | ✅ Done | |
| TODO-2.3.2 | Thay DeckCard bằng flat WordRow list | ✅ Done | |
| TODO-2.3.3 | Render WordDetailSheet + AddWordModal cuối page | ✅ Done | |
| TODO-3.1 | TypeScript type-check | ✅ Done | 0 lỗi |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/frontend/src/components/vocab/WordRow.tsx` | Tạo mới | Export `VocabItem` interface + presentational row component: term, phonetic, CEFR badge, first translation, chevron |
| `apps/frontend/src/components/vocab/WordDetailSheet.tsx` | Tạo mới | Bottom sheet chi tiết: header (term + LanguageBadge), phonetic + CEFR + partOfSpeech, example block, translations list, nút "Practice this word" |
| `apps/frontend/src/pages/VocabularyPage.tsx` | Sửa đổi (rewrite) | Bỏ DeckCard + page FAB; thêm TopBar Plus icon, language filter tabs, flat WordRow list với section grouping, WordDetailSheet wiring |

### Verification
- [x] Build thành công: ✅ (`npx tsc --noEmit` exit 0)
- [x] Không có lỗi TypeScript mới: ✅
- [x] Không có warning mới: ✅
- [x] Không break existing functionality: ✅ (AddWordModal, vocabularyApi, AppShell unchanged)

### Ghi chú
- `VocabItem` interface được export từ `WordRow.tsx` và import lại trong `WordDetailSheet.tsx` và `VocabularyPage.tsx` — single source of truth cho type
- `DeckCard.tsx` giữ nguyên, không xoá — không có file nào import nó nên không cần chú ý
- Language tabs chỉ render khi `availableLangs.length > 1` — user 1 ngôn ngữ không bị thêm UI thừa
- Khi tab "All" và có ≥2 ngôn ngữ → grouped view với section header; khi chọn tab cụ thể hoặc user 1 ngôn ngữ → flat single-card list
