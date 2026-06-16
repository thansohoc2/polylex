# TICKET-005: Redesign Mobile-First UI — PolyLex "Indigo Night"

## Thông tin ticket
| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-005 |
| **Ngày tạo** | 2026-02-27 |
| **Người yêu cầu** | Product Owner |
| **Trạng thái** | Phân tích — Chờ lập kế hoạch |

## Mô tả yêu cầu gốc

Xây dựng lại toàn bộ giao diện frontend theo hướng **mobile-first**, ưu tiên tính năng **Quick Note**, phong cách hiện đại theo xu hướng 2025–2026 (glassmorphism nhẹ, bottom navigation, fluid animations), sẵn sàng wrap thành native app với Capacitor.

Spec chi tiết xem tại: `.github/prompts/4_redesign_mobile_ui.prompt.md`

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-005 |
| **Tiêu đề** | Redesign Mobile-First UI — Dark "Indigo Night" theme, Quick Note ưu tiên |
| **Mục tiêu** | Thay thế toàn bộ UI desktop-centric hiện tại bằng UI mobile-first dark mode, ưu tiên UX Quick Note, tương thích Capacitor native wrap |
| **Phạm vi** | `apps/frontend/` toàn bộ — components, pages, styles, config |
| **Độ ưu tiên** | Cao |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Cài đặt packages & Design Tokens | Thêm `framer-motion`, cập nhật `tailwind.config.js` với màu sắc/font/animation riêng | Frontend/Config | Nhỏ |
| REQ-02 | AppShell + Layout | Tạo `AppShell`, `TopBar`, `BottomNav` thay thế `Layout.tsx` sidebar hiện tại | Frontend/Layout | Trung bình |
| REQ-03 | UI Primitives | Tạo `Badge`, `Card`, `Chip`, `FAB`, `SearchBar`, `ProgressBar`, `SkeletonCard`, `BottomSheet` | Frontend/UI | Trung bình |
| REQ-04 | Quick Note Screen | Xây dựng lại `QuickNotePage` với `QuickNoteCard` swipeable, `AddQuickNoteSheet`, filter chips | Frontend/Feature | Lớn |
| REQ-05 | Home Screen | Xây dựng `HomePage` (thay `DashboardPage`) với `GreetingCard`, recent notes, due items | Frontend/Feature | Trung bình |
| REQ-06 | Vocabulary Screen | Xây dựng lại `VocabularyPage` với `DeckCard`, mastery progress bar, FAB | Frontend/Feature | Trung bình |
| REQ-07 | Review Screen | Xây dựng lại `ReviewPage` với `FlashCard` 3D flip, `RatingButtons`, progress bar | Frontend/Feature | Trung bình |
| REQ-08 | Profile Screen | Tạo `ProfilePage` mới thay `/users/me` trong dashboard | Frontend/Feature | Nhỏ |
| REQ-09 | Page Transitions & Polish | Framer Motion animations: page slide, stagger list, pull-to-refresh, toast, empty/error states | Frontend/Animation | Trung bình |
| REQ-10 | Auth Pages Mobile | Redesign `LoginPage`, `RegisterPage` theo dark theme, mobile layout | Frontend/Auth | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──> REQ-02 ──> REQ-03 ──┬──> REQ-04 ⭐ (Quick Note — priority)
                                ├──> REQ-05
                                ├──> REQ-06
                                ├──> REQ-07
                                ├──> REQ-08
                                └──> REQ-10

REQ-04, REQ-05, REQ-06, REQ-07 ──> REQ-09 (polish sau khi screens xong)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Cài đặt packages & Design Tokens
- **Mục tiêu**: Chuẩn bị nền tảng styling và animation cho toàn bộ redesign
- **Đầu vào**: `apps/frontend/package.json`, `tailwind.config.js` (hiện chưa có — dùng `@tailwindcss/vite` plugin trong `vite.config.ts`)
- **Đầu ra mong đợi**:
  - Thêm `framer-motion` vào dependencies
  - Thêm `react-hot-toast` cho toast notifications
  - Tạo `tailwind.config.js` với `surface`, `primary`, `accent` colors; Inter/JetBrains Mono fonts; custom animations
  - Cập nhật `index.html` thêm Google Fonts `Inter`
  - Tạo `src/styles/globals.css` với CSS custom properties
- **Tiêu chí hoàn thành**: `npm run build` không lỗi, Tailwind nhận diện custom colors
- **Phụ thuộc**: Không

##### REQ-02: AppShell + Layout
- **Mục tiêu**: Thay thế sidebar `w-64` hiện tại bằng mobile shell với TopBar + BottomNav
- **Đầu vào**: `src/components/Layout.tsx` (sidebar hiện tại), `src/App.tsx` (routing)
- **Đầu ra mong đợi**:
  - `src/components/layout/AppShell.tsx` — wrapper `max-w-md mx-auto h-screen` + safe-area
  - `src/components/layout/TopBar.tsx` — 56px, `bg-surface/80 backdrop-blur-xl`, title prop
  - `src/components/layout/BottomNav.tsx` — 5 tabs: Home, Quick Note (FAB), Vocab, Review, Profile
  - `src/App.tsx` wrap `<Layout>` → `<AppShell>`
  - Route `/analytics` và `/roadmap` ẩn khỏi BottomNav (accessible nhưng không tab chính)
- **Tiêu chí hoàn thành**: Navigation giữa 5 tabs hoạt động, active state đúng, không bị che bởi TopBar/BottomNav
- **Phụ thuộc**: REQ-01

##### REQ-03: UI Primitives
- **Mục tiêu**: Tạo thư viện components tái dùng theo design system
- **Đầu vào**: Design spec trong `4_redesign_mobile_ui.prompt.md`
- **Đầu ra mong đợi**:
  - `Badge.tsx` — `CefrBadge` (A1→C2 với màu gradient), `LanguageBadge` (flag emoji + code)
  - `Card.tsx` — base card với `bg-surface-2 rounded-2xl shadow` variants
  - `Chip.tsx` — filter chip có selected state
  - `FAB.tsx` — gradient indigo→violet, optional ping animation
  - `SearchBar.tsx` — input với `SearchIcon`, clear button, sticky behavior
  - `ProgressBar.tsx` — thin bar indigo, animated width
  - `SkeletonCard.tsx` — shimmer animation loading state
  - `BottomSheet.tsx` — reusable sheet với drag handle, Framer Motion spring
- **Tiêu chí hoàn thành**: Storybook-style test page hoặc visual verification trong dev
- **Phụ thuộc**: REQ-01

##### REQ-04: Quick Note Screen ⭐
- **Mục tiêu**: Xây dựng lại `QuickNotePage` thành UI mobile chuẩn, UX tối ưu cho nhập nhanh từ vựng
- **Đầu vào**: `src/pages/QuickNotePage.tsx` (hiện tại), `quickNoteApi` trong `client.ts`, `QuickNote` interface
- **Đầu ra mong đợi**:
  - `QuickNoteCard` — hiển thị `term`, `phonetic`, `cefrLevel`, `partOfSpeech`, `translationText`, `exampleSentence`; swipe left = delete, swipe right = add to deck (via `vocabularyApi.addToMyList`); status badges `PENDING/PROCESSING/DONE/ERROR`; stagger entrance animation
  - `AddQuickNoteSheet` — bottom sheet 85vh; term input (autofocus), source/target language chips từ `languageApi.getAll()`, `AiEnrichButton` (call `quickNoteApi.create()` → poll status → reflect AI enrichment); save button
  - `LanguageFilterChips` — filter notes theo `sourceLanguageCode`
  - `SearchBar` lọc notes client-side theo `term`
  - Polling logic giữ nguyên từ implementation cũ (4s interval khi có PENDING/PROCESSING)
- **Tiêu chí hoàn thành**: Có thể thêm note → AI enrich → hiển thị translation/phonetic/CEFR trên card; delete swipe hoạt động; filter theo ngôn ngữ
- **Phụ thuộc**: REQ-02, REQ-03

##### REQ-05: Home Screen
- **Mục tiêu**: Dashboard mới ưu tiên Quick Note recent và due review
- **Đầu vào**: `src/pages/DashboardPage.tsx`, APIs: `userApi.getMe()`, `gamificationApi.getStats()`, `quickNoteApi.list()`, `reviewApi.getQueue()`
- **Đầu ra mong đợi**:
  - `GreetingCard` — greeting theo thời gian (`Good morning/afternoon/evening`), streak 🔥, XP
  - Recent Quick Notes horizontal scroll (3 cards `160×120`)
  - Due for Review section (tối đa 5 items với `DueVocabItem`)
  - Quick action buttons: "Start Review", "Add Quick Note"
- **Tiêu chí hoàn thành**: Load đúng dữ liệu, không loading flicker với skeleton
- **Phụ thuộc**: REQ-02, REQ-03

##### REQ-06: Vocabulary Screen
- **Mục tiêu**: Thay thế `VocabularyPage` hiện tại bằng deck-based view
- **Đầu vào**: `src/pages/VocabularyPage.tsx`, `vocabularyApi.getMyList()`
- **Đầu ra mong đợi**:
  - Group words theo vocabulary base language → "deck" visual
  - `DeckCard` — tên deck, word count, due count, mastery `ProgressBar`
  - Expand deck → list words trong card
  - FAB "Add Word" → navigate to vocabulary search
- **Tiêu chí hoàn thành**: Hiển thị đúng từ của user, count due chính xác
- **Phụ thuộc**: REQ-02, REQ-03

##### REQ-07: Review Screen
- **Mục tiêu**: Tạo flashcard 3D flip UX chuẩn mobile
- **Đầu vào**: `src/pages/ReviewPage.tsx` (logic giữ nguyên), `reviewApi.getQueue()`, `reviewApi.submit()`
- **Đầu ra mong đợi**:
  - TopBar progress counter `n/total`
  - Thin `ProgressBar` indigo dưới TopBar
  - `FlashCard` component — 3D flip `rotateY`, front: term + language badge, back: translation + phonetic + example + TTS button
  - `RatingButtons` — 3 nút Hard/OK/Easy (0/3/5) xuất hiện sau flip với slide-up animation
  - Done state với session stats (accuracy %)
- **Tiêu chí hoàn thành**: Flip animation mượt, submit rating hoạt động đúng, TTS vẫn hoạt động
- **Phụ thuộc**: REQ-02, REQ-03

##### REQ-08: Profile Screen
- **Mục tiêu**: Tạo screen Profile tách từ Dashboard
- **Đầu vào**: `userApi.getMe()`, `gamificationApi.getStats()`
- **Đầu ra mong đợi**:
  - Avatar initials + display name + email
  - Stats grid: Total words / Streak / Accuracy / Days active
  - Settings list: Language preferences, Notifications (placeholder), Export data (placeholder)
  - Danger zone: Sign out button
- **Tiêu chí hoàn thành**: Hiển thị đúng user info, logout hoạt động
- **Phụ thuộc**: REQ-02, REQ-03

##### REQ-09: Page Transitions & Polish
- **Mục tiêu**: Làm app feel native với animations và micro-interactions
- **Đầu vào**: Tất cả pages sau REQ-04→REQ-08
- **Đầu ra mong đợi**:
  - Framer Motion `AnimatePresence` + `pageVariants` (slide up `y: 20→0`) cho route transitions
  - Stagger list entrance cho QuickNote cards và Review queue
  - `react-hot-toast` thay thế mọi alert/error display
  - Empty states với inline SVG illustration (no external dependency)
  - Error states với retry button
- **Tiêu chí hoàn thành**: Navigation giữa tabs không flash, lists animate in mượt
- **Phụ thuộc**: REQ-04, REQ-05, REQ-06, REQ-07, REQ-08

##### REQ-10: Auth Pages Mobile
- **Mục tiêu**: Redesign Login và Register theo dark mobile theme
- **Đầu vào**: `src/pages/LoginPage.tsx`, `src/pages/RegisterPage.tsx`
- **Đầu ra mong đợi**:
  - Logo + brand name ở top
  - Card `bg-surface-2 rounded-2xl` chứa form
  - Input fields với dark styling, error states rõ ràng (ring đỏ)
  - Primary CTA button gradient indigo→violet
  - Link chuyển giữa Login/Register
- **Tiêu chí hoàn thành**: Auth flow hoàn toàn không bị break, redirect về home sau login
- **Phụ thuộc**: REQ-01

---

### 3. Ngữ cảnh nghiệp vụ

- **Quick Note** là tính năng FE cốt lõi: user gặp từ mới → nhập nhanh → AI enrich background → xem kết quả. Flow này cần UX nhanh, friction tối thiểu (1 tap → input → save).
- **Review** là tính năng dùng hàng ngày, cần flashcard immersive, tối giản distraction.
- **Streak/Gamification** là driver retention — cần hiển thị nổi bật trên Home.
- **Polling pattern** trong QuickNotePage (4s interval cho PENDING/PROCESSING) phải được giữ nguyên — đây là cơ chế hiển thị AI enrichment kết quả.
- Auth flow: JWT access + refresh token qua `useAuthStore` (Zustand persist) — không được thay đổi logic, chỉ thay đổi UI.
- Route structure hiện tại giữ nguyên — chỉ map lại tab navigation:
  - `/dashboard` → **Home tab**
  - `/quick-notes` → **Quick Note tab** (FAB)
  - `/vocabulary` → **Vocab tab**
  - `/review` → **Review tab**
  - `/profile` (mới) → **Profile tab** (tách từ dashboard)

### 4. Ngữ cảnh kỹ thuật

#### Hiện trạng Frontend

| File | Vấn đề với Mobile Redesign |
|------|---------------------------|
| `src/components/Layout.tsx` | Sidebar `w-64` — không dùng được trên 390px, cần thay bằng `AppShell` + `BottomNav` |
| `src/pages/QuickNotePage.tsx` | UI dạng form + table desktop, cần thay bằng card list + bottom sheet |
| `src/pages/DashboardPage.tsx` | Grid 4 cols, card desktop, cần restructure thành mobile sections |
| `src/pages/ReviewPage.tsx` | Logic tốt nhưng UI cần wrap vào `FlashCard` 3D + `RatingButtons` |
| `src/pages/VocabularyPage.tsx` | Table/list desktop, cần `DeckCard` mobile |
| `tailwind.config.js` | **Không tồn tại** — project dùng `@tailwindcss/vite` plugin không cần file config; cần TẠO MỚI để add custom tokens |
| `index.html` | Không có Google Fonts, không có `<meta name="theme-color">` |
| `src/index.css` | Cần xem xét để thêm CSS variables cho dark theme base |

#### APIs & Data Types cần biết khi build components

| Component | API sử dụng | Data type quan trọng |
|-----------|------------|---------------------|
| `QuickNoteCard` | `quickNoteApi.list()`, `quickNoteApi.remove()` | `QuickNote.status`, `vocabularyBase.translations[]`, `cefrLevel`, `phonetic` |
| `AddQuickNoteSheet` | `quickNoteApi.create()`, `languageApi.getAll()` | Source/target language codes |
| `GreetingCard` | `gamificationApi.getStats()` | `GamificationStats.currentStreak`, `totalXp` |
| `FlashCard` | `reviewApi.getQueue()`, `reviewApi.submit()` | `QueueItem.vocabularyBase.term`, `recallQuality` 0-5 |
| `DeckCard` | `vocabularyApi.getMyList()` | Cần group by language phía FE |

#### Lưu ý Tailwind v4

Project đang dùng **Tailwind CSS v4** (`tailwindcss: ^4.0.0`) với `@tailwindcss/vite` plugin, **không phải v3**. Tailwind v4 dùng CSS-based configuration thay vì `tailwind.config.js`:
- Custom tokens được định nghĩa qua `@theme` directive trong CSS file
- Không có `tailwind.config.js` — cần dùng `src/styles/globals.css` với `@theme { --color-surface: ... }`
- `backdrop-blur`, `border-radius` custom cũng định nghĩa qua CSS variables

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| White/light theme, sidebar desktop | Dark `#0F0F1A` background, BottomNav mobile | Toàn bộ UI |
| `Layout.tsx` sidebar `w-64` | `AppShell` + `TopBar` + `BottomNav` | Thay thế hoàn toàn |
| `QuickNotePage` form + list desktop | Bottom sheet FAB + swipeable cards | Viết lại |
| `DashboardPage` stats grid 4-cols | `HomePage` mobile sections, recent notes | Viết lại |
| `ReviewPage` buttons inline | `FlashCard` 3D flip + rating slide-up | Refactor UI layer |
| `VocabularyPage` list/table | `DeckCard` grouped by language | Refactor UI layer |
| Không có Profile page | `ProfilePage` với stats + settings | Tạo mới |
| Auth pages light form | Dark card form | Reskin |
| Không có `framer-motion` | Page transitions + stagger animations | Thêm dependency + implement |
| Không có `react-hot-toast` | Toast thay cho alert/error text | Thêm dependency + implement |
| **Tailwind v4, no config file** | Custom design tokens via `@theme` CSS | Tạo `globals.css` với `@theme` block |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Quick Note polling bị mất**: Logic `setInterval` 4s hiện tại cần được migrate sang `QuickNotePage` mới — nếu bỏ thì AI enrichment kết quả sẽ không hiện lên — Biện pháp: Copy nguyên `pollRef` logic vào hook riêng `useQuickNotePolling`
- [ ] **Route profile mới**: Thêm route `/profile` mới — cần đảm bảo `RequireAuth` guard bao phủ — Biện pháp: Thêm route trong `App.tsx` trong block `RequireAuth`
- [ ] **Vocabulary "deck" grouping là FE-only**: API `getMyList()` trả flat list, grouping theo language là logic FE — nếu user có nhiều từ thì sort/group nặng — Biện pháp: `useMemo` cho grouping, pagination giữ nguyên

#### 6.2 Rủi ro kỹ thuật
- [ ] **Tailwind v4 khác v3**: `tailwind.config.js` với `extend.colors` không hoạt động trong v4 — Biện pháp: Dùng `@theme` directive trong CSS thay vì JS config; spec prompt cần được điều chỉnh fix điểm này
- [ ] **Framer Motion bundle size**: Thêm `framer-motion` ~100KB gzipped — Biện pháp: Tree-shake, chỉ import `motion`, `AnimatePresence`; lazy load animations nếu cần
- [ ] **Swipe gesture conflicts**: Swipe trên `QuickNoteCard` có thể conflict với scroll dọc của page — Biện pháp: Dùng `usePointerEvents` phân biệt swipe ngang vs scroll dọc; hoặc dùng long-press menu thay vì swipe nếu UX không ổn
- [ ] **`backdropFilter` trên Safari iOS**: `backdrop-blur` cho TopBar/BottomNav có thể bị lag trên iOS < 15 — Biện pháp: Fallback `bg-surface` không blur cho older iOS
- [ ] **`AddQuickNoteSheet` autofocus trong bottom sheet**: iOS Chrome/Safari thường không autofocus input trong dialog/sheet, cần trigger manually — Biện pháp: `setTimeout(() => inputRef.current?.focus(), 300)` sau khi sheet animation complete

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **`QuickNoteCard` "Add to deck" swipe**: `vocabularyApi.addToMyList(vocabularyBaseId)` chỉ hoạt động khi note status=`DONE` (có `vocabularyBaseId`) — nếu swipe right khi PENDING sẽ lỗi — Phòng tránh: Disable swipe right khi `status !== 'DONE'` hoặc `!vocabularyBaseId`
- [ ] **BottomNav tab "Quick Note" vs FAB**: Tab Quick Note nên navigate đến `/quick-notes` chứ không phải chỉ mở sheet — FAB là để thêm mới, không phải navigate — Phòng tránh: Tách rõ: tab click = navigate; FAB click = open sheet
- [ ] **`AnimatePresence` với nested routes**: Route transitions có thể flash khi dùng `AnimatePresence` với React Router nested routes — Phòng tránh: Wrap `AnimatePresence` ở mức Outlet, dùng `mode="wait"`
- [ ] **Language chips filter "All"**: Khi filter theo language rồi delete note cuối cùng của language đó, chips cần tự update — Phòng tránh: `useMemo` derive chips từ `notes` state, không hardcode

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| 95% business logic giữ nguyên, chỉ thay UI layer | Phải viết lại toàn bộ pages — không thể incremental nhỏ |
| TailwindCSS v4 `@theme` sạch hơn JS config | Cần học Tailwind v4 API thay vì v3 quen thuộc |
| Framer Motion native-feel animations | Bundle size tăng ~100KB |
| BottomNav chuẩn mobile mental model | Desktop layout hoàn toàn bị bỏ (nhưng đây là intentional) |
| `BottomSheet` reusable cho nhiều features sau này | Swipe gesture implementation phức tạp |
| Design system tokens trong CSS → dễ theme sau này | Dark-only ban đầu, light mode cần thêm work sau |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Implement theo Phase 1→2→3→4 đúng thứ tự trong spec, **không** cố gắng migrate incremental song song với code cũ — thay thế hoàn toàn từng file. Giữ nguyên tên route và API calls.

- **Lưu ý quan trọng**: Tailwind v4 dùng `@theme` trong CSS, **không phải** `tailwind.config.js`. Cần viết design tokens trong `src/styles/globals.css` như sau:
  ```css
  @import "tailwindcss";

  @theme {
    --color-surface: #0F0F1A;
    --color-surface-2: #1A1A2E;
    --color-primary: #6366F1;
    --font-sans: "Inter", system-ui, sans-serif;
  }
  ```

- **Thứ tự ưu tiên thực thi**:
  1. REQ-01 + REQ-02 (foundation, ~4h)
  2. REQ-04 ⭐ Quick Note (priority, ~1 ngày)
  3. REQ-07 Review + REQ-05 Home (~1 ngày)
  4. REQ-03 Primitives, REQ-06, REQ-08, REQ-10 (~1 ngày)
  5. REQ-09 Polish (~4h)

- **Ước tính công sức**:
  | Phase | Effort |
  |-------|--------|
  | Phase 1: Foundation (REQ-01, 02, 03) | 0.5 ngày |
  | Phase 2: Quick Note Screen (REQ-04) | 1 ngày |
  | Phase 3: Other Screens (REQ-05–08, 10) | 1.5 ngày |
  | Phase 4: Polish (REQ-09) | 0.5 ngày |
  | **Tổng** | **~3.5 ngày** |

---

### 9. Câu hỏi mở

- [ ] **Q1**: Tailwind v4 có hỗ trợ `animation` custom qua `@theme` không, hay cần thêm `@keyframes` riêng trong CSS?
- [ ] **Q2**: `Analytics` và `Roadmap` pages có cần redesign không hay ẩn khỏi BottomNav là đủ?
- [ ] **Q3**: Swipe gesture trên `QuickNoteCard` dùng thư viện nào? (`@use-gesture/react` vs `framer-motion` drag vs custom `pointerdown`/`pointermove`)?
- [ ] **Q4**: `AddQuickNoteSheet` khi AI enrich có dùng `quickNoteApi.create()` rồi poll, hay cần endpoint riêng để enrich synchronous?
- [ ] **Q5**: Có cần support landscape orientation không, hay portrait-only là đủ cho v1?

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Thay thế toàn bộ UI desktop-centric (sidebar `w-64`, light theme) bằng mobile-first dark UI "Indigo Night" với BottomNav, ưu tiên Quick Note screen, giữ nguyên 100% business logic và API calls hiện có.

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: AppShell với TopBar (56px) + BottomNav (64px fixed) thay thế sidebar
2. FR-02: Quick Note screen có FAB → Bottom Sheet, card hiển thị AI enrichment đầy đủ, swipe to delete
3. FR-03: Home screen hiển thị greeting, recent quick notes (horizontal scroll), due items
4. FR-04: Review screen với FlashCard 3D flip + RatingButtons slide-up
5. FR-05: Vocabulary screen deck-based grouped by source language
6. FR-06: Profile screen tách biệt với stats + logout
7. FR-07: Auth pages dark theme, mobile layout
8. FR-08: Page transitions (slide-up), stagger list animations, toast notifications

#### Ràng buộc phi chức năng
1. NFR-01: Không thay đổi bất kỳ API call, route path, store logic nào
2. NFR-02: Tailwind v4 — design tokens dùng `@theme` trong `src/index.css`, không dùng `tailwind.config.js`
3. NFR-03: `framer-motion` chỉ import `motion`, `AnimatePresence` (tree-shake)
4. NFR-04: Touch targets tối thiểu 44×44px cho mọi button
5. NFR-05: `env(safe-area-inset-bottom)` cho BottomNav padding (Capacitor-ready)
6. NFR-06: `npm run build` không có TypeScript error sau mỗi phase

#### Phụ thuộc
- DEP-01: `framer-motion` và `react-hot-toast` phải được install trước Phase 2
- DEP-02: `AppShell`, `TopBar`, `BottomNav` phải xong trước khi build bất kỳ page nào
- DEP-03: UI Primitives (`Badge`, `Chip`, `FAB`, `BottomSheet`) phải xong trước REQ-04
- DEP-04: `useQuickNotePolling` hook phải xong trước `QuickNotePage`

### Cách tiếp cận
> Implement từng phase hoàn chỉnh, thay thế file cũ trực tiếp (không giữ song song). Bắt đầu từ Foundation (tokens + layout shell), tiếp đến Quick Note (priority feature), rồi các screens còn lại, cuối cùng polish animations. Verify build pass sau mỗi phase.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/frontend/src/index.css` | Thêm `@theme` block với design tokens |
| Sửa đổi | `apps/frontend/index.html` | Google Fonts Inter, theme-color meta |
| Sửa đổi | `apps/frontend/package.json` | Thêm `framer-motion`, `react-hot-toast` |
| Tạo mới | `apps/frontend/src/components/layout/TopBar.tsx` | TopBar 56px với blur |
| Tạo mới | `apps/frontend/src/components/layout/BottomNav.tsx` | 5-tab nav với FAB Quick Note |
| Tạo mới | `apps/frontend/src/components/layout/AppShell.tsx` | Main mobile shell wrapper |
| Tạo mới | `apps/frontend/src/components/layout/BottomSheet.tsx` | Reusable bottom sheet |
| Sửa đổi | `apps/frontend/src/App.tsx` | Dùng AppShell, thêm `/profile` route |
| Tạo mới | `apps/frontend/src/components/ui/Badge.tsx` | CefrBadge + LanguageBadge |
| Tạo mới | `apps/frontend/src/components/ui/Chip.tsx` | Filter chip |
| Tạo mới | `apps/frontend/src/components/ui/FAB.tsx` | Floating action button |
| Tạo mới | `apps/frontend/src/components/ui/SearchBar.tsx` | Search input |
| Tạo mới | `apps/frontend/src/components/ui/ProgressBar.tsx` | Progress bar |
| Tạo mới | `apps/frontend/src/components/ui/SkeletonCard.tsx` | Shimmer skeleton |
| Tạo mới | `apps/frontend/src/hooks/useQuickNotePolling.ts` | Extracted polling hook |
| Tạo mới | `apps/frontend/src/components/quick-note/LanguageFilterChips.tsx` | Language filter |
| Tạo mới | `apps/frontend/src/components/quick-note/QuickNoteCard.tsx` | Note card với swipe |
| Tạo mới | `apps/frontend/src/components/quick-note/AddQuickNoteSheet.tsx` | Bottom sheet thêm note |
| Sửa đổi | `apps/frontend/src/pages/QuickNotePage.tsx` | Viết lại dùng components mới |
| Tạo mới | `apps/frontend/src/components/home/GreetingCard.tsx` | Greeting + streak card |
| Tạo mới | `apps/frontend/src/components/home/QuickNoteHorizontalCard.tsx` | 160×120 card |
| Tạo mới | `apps/frontend/src/components/home/DueVocabItem.tsx` | Due review row |
| Sửa đổi | `apps/frontend/src/pages/DashboardPage.tsx` | Viết lại thành HomePage |
| Tạo mới | `apps/frontend/src/components/vocab/DeckCard.tsx` | Deck card grouped |
| Sửa đổi | `apps/frontend/src/pages/VocabularyPage.tsx` | Viết lại deck view |
| Tạo mới | `apps/frontend/src/components/review/FlashCard.tsx` | 3D flip card |
| Tạo mới | `apps/frontend/src/components/review/RatingButtons.tsx` | Hard/OK/Easy buttons |
| Sửa đổi | `apps/frontend/src/pages/ReviewPage.tsx` | Viết lại dùng FlashCard |
| Tạo mới | `apps/frontend/src/pages/ProfilePage.tsx` | Profile screen mới |
| Sửa đổi | `apps/frontend/src/pages/LoginPage.tsx` | Dark theme reskin |
| Sửa đổi | `apps/frontend/src/pages/RegisterPage.tsx` | Dark theme reskin |

---

## PLAN TODO

### Phase 1: Foundation — Design System & Layout Shell

#### REQ-01: Cài đặt packages & Design Tokens

- [x] **TODO-1.1.1**: Thêm `framer-motion` và `react-hot-toast` vào dependencies
  - **File**: `apps/frontend/package.json`
  - **Context**: Đọc `package.json` để xem versions hiện có
  - **Thay đổi**: Thêm vào `"dependencies"`: `"framer-motion": "^11.0.0"`, `"react-hot-toast": "^2.4.1"`
  - **Verify**: `cd apps/frontend && npm install` → không có lỗi
  - **Kết quả**: 2 packages được install vào `node_modules`

- [x] **TODO-1.1.2**: Thêm Google Fonts Inter và meta tags PWA vào `index.html`
  - **File**: `apps/frontend/index.html`
  - **Context**: Đọc file hiện tại
  - **Thay đổi**:
    - Trong `<head>`, thêm trước `</head>`:
      ```html
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
      <meta name="theme-color" content="#0F0F1A" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      ```
    - Sửa `<title>` thành `PolyLex — Vocabulary Learning`
  - **Verify**: `npm run dev` → mở browser → DevTools Fonts thấy Inter loaded
  - **Kết quả**: Inter font và PWA meta tags được load

- [x] **TODO-1.1.3**: Thêm `@theme` design tokens vào `src/index.css`
  - **File**: `apps/frontend/src/index.css`
  - **Context**: File hiện tại chỉ có `@import "tailwindcss";`
  - **Thay đổi**: Thêm sau dòng `@import "tailwindcss";`:
    ```css
    @theme {
      /* Colors */
      --color-surface: #0F0F1A;
      --color-surface-2: #1A1A2E;
      --color-surface-3: #16213E;
      --color-primary: #6366F1;
      --color-primary-dark: #4F46E5;
      --color-accent: #A78BFA;
      --color-border: rgba(99, 102, 241, 0.2);
      --color-text-1: #F1F5F9;
      --color-text-2: #94A3B8;
      --color-text-3: #475569;
      --color-success: #10B981;
      --color-warning: #F59E0B;
      --color-error: #EF4444;

      /* Fonts */
      --font-family-sans: "Inter", system-ui, sans-serif;
      --font-family-mono: "JetBrains Mono", "Fira Code", monospace;

      /* Keyframes */
      --animate-ping-slow: ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
      --animate-float: float 3s ease-in-out infinite;
    }

    @keyframes ping-slow {
      75%, 100% { transform: scale(2); opacity: 0; }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-6px); }
    }

    /* Base dark background */
    html, body, #root {
      background-color: #0F0F1A;
      color: #F1F5F9;
      font-family: "Inter", system-ui, sans-serif;
      -webkit-tap-highlight-color: transparent;
    }
    ```
  - **Verify**: `npm run build` pass → inspect compiled CSS thấy custom properties
  - **Kết quả**: Design tokens available as Tailwind classes `bg-surface`, `text-primary`, `text-accent`, etc.

#### REQ-02: AppShell + Layout

- [x] **TODO-1.2.1**: Tạo `TopBar.tsx` component
  - **File**: `apps/frontend/src/components/layout/TopBar.tsx`
  - **Context**: Đọc `src/index.css` để biết design tokens
  - **Thay đổi**: Tạo component với props `{ title: string; rightAction?: React.ReactNode }`:
    ```tsx
    // height: 56px, fixed top, bg-surface/80 backdrop-blur-xl
    // border-b border-white/5
    // Logo "PL" bên trái (indigo circle), title ở giữa (bold text-text-1), rightAction bên phải
    // padding-top: env(safe-area-inset-top)
    // z-index: 50
    ```
  - **Verify**: `npm run build` không lỗi TypeScript
  - **Kết quả**: Component `TopBar` với props title + optional right action

- [x] **TODO-1.2.2**: Tạo `BottomNav.tsx` component
  - **File**: `apps/frontend/src/components/layout/BottomNav.tsx`
  - **Context**: Đọc `src/App.tsx` để biết routes, `src/index.css` cho tokens
  - **Thay đổi**: Tạo component với 5 tabs dùng `useLocation` + `useNavigate`:
    - Tabs: `{ path: '/dashboard', icon: HomeIcon, label: 'Home' }`, `{ path: '/quick-notes', icon: null, label: 'Notes', isFAB: true }`, `{ path: '/vocabulary', icon: BookOpenIcon, label: 'Vocab' }`, `{ path: '/review', icon: RotateCcwIcon, label: 'Review' }`, `{ path: '/profile', icon: UserIcon, label: 'Profile' }`
    - FAB tab Quick Note: `w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent -mt-5 shadow-lg` với `PlusIcon`
    - Active state: `text-primary`, inactive: `text-text-3`
    - Fixed bottom, `bg-surface/90 backdrop-blur-xl`, `pb-[env(safe-area-inset-bottom)]`
    - Icons dùng `lucide-react`: `Home`, `BookOpen`, `RotateCcw`, `User`, `Plus`
  - **Verify**: `npm run build` không lỗi. `lucide-react` đã có trong deps? Nếu chưa thêm vào `package.json`
  - **Kết quả**: BottomNav với 5 tabs, FAB giữa, active state đúng

- [x] **TODO-1.2.3**: Tạo `AppShell.tsx` component
  - **File**: `apps/frontend/src/components/layout/AppShell.tsx`
  - **Context**: Đọc `TopBar.tsx` và `BottomNav.tsx` vừa tạo
  - **Thay đổi**: Tạo component nhận `{ title: string; rightAction?: React.ReactNode; children: React.ReactNode }`:
    ```tsx
    // Outer: min-h-screen bg-surface max-w-md mx-auto relative
    // TopBar fixed top
    // Content: pt-14 pb-24 overflow-y-auto (padding = TopBar + BottomNav height)
    // BottomNav fixed bottom
    ```
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Shell wrapper nhận children, render TopBar + BottomNav

- [x] **TODO-1.2.4**: Tạo `BottomSheet.tsx` reusable component
  - **File**: `apps/frontend/src/components/layout/BottomSheet.tsx`
  - **Context**: Đọc `AppShell.tsx`, import `framer-motion`
  - **Thay đổi**: Component với props `{ isOpen: boolean; onClose: () => void; title?: string; children: React.ReactNode }`:
    - Backdrop `fixed inset-0 bg-black/60 z-40`, click → onClose
    - Sheet `fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-surface-2 rounded-t-3xl z-50`
    - Framer Motion: `initial={{ y: '100%' }}` `animate={{ y: 0 }}` `exit={{ y: '100%' }}` `transition={{ type: 'spring', damping: 30, stiffness: 300 }}`
    - Drag handle: `w-10 h-1 bg-white/20 rounded-full mx-auto mt-3 mb-2`
    - `AnimatePresence` wrap toàn bộ
    - Max height `85vh`, `overflow-y-auto`
    - `pb-[env(safe-area-inset-bottom)]`
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Reusable bottom sheet với spring animation

- [x] **TODO-1.2.5**: Cập nhật `App.tsx` — thay Layout bằng AppShell, thêm route `/profile`
  - **File**: `apps/frontend/src/App.tsx`
  - **Context**: Đọc `App.tsx` hiện tại, `AppShell.tsx` vừa tạo
  - **Thay đổi**:
    - Xóa import `Layout` từ `@/components/Layout`
    - Thêm import `ProfilePage` (sẽ tạo ở TODO-3.8.1) — tạm dùng placeholder nếu chưa có
    - Thay `<Layout />` trong `RequireAuth` element bằng `<Outlet />` trực tiếp (AppShell được dùng trong từng page)
    - Hoặc: giữ `<Layout />` nhưng thay nội dung Layout thành AppShell (cách đơn giản hơn)
    - **Cách khuyến nghị**: Sửa route structure: xóa `<Layout />` wrapper, mỗi page tự wrap AppShell
    - Thêm route: `<Route path="profile" element={<ProfilePage />} />` trong block RequireAuth
    - Xóa route `/analytics` nếu không có trong BottomNav (hoặc giữ accessible)
  - **Verify**: `npm run dev` → navigate giữa tabs không có lỗi runtime
  - **Kết quả**: Routing hoạt động với AppShell, `/profile` route accessible

#### REQ-03: UI Primitives

- [x] **TODO-1.3.1**: Tạo `Badge.tsx` — `CefrBadge` và `LanguageBadge`
  - **File**: `apps/frontend/src/components/ui/Badge.tsx`
  - **Context**: Đọc `src/index.css` tokens, xem `cefrLevel` values: A1/A2/B1/B2/C1/C2
  - **Thay đổi**:
    ```tsx
    // CefrBadge — màu theo level:
    // A1/A2: bg-success/20 text-success (green)
    // B1/B2: bg-warning/20 text-warning (yellow)
    // C1/C2: bg-primary/20 text-primary (indigo)
    // Size: px-2 py-0.5 rounded-full text-xs font-semibold

    // LanguageBadge — flag emoji map + language code
    // Flags: en → 🇬🇧, vi → 🇻🇳, ja → 🇯🇵, fr → 🇫🇷, de → 🇩🇪, zh → 🇨🇳, ko → 🇰🇷
    // px-2 py-0.5 rounded-full text-xs bg-white/5 text-text-2
    ```
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: 2 exported components: `CefrBadge`, `LanguageBadge`

- [x] **TODO-1.3.2**: Tạo `Chip.tsx` — filter chip component
  - **File**: `apps/frontend/src/components/ui/Chip.tsx`
  - **Context**: Đọc `src/index.css` tokens
  - **Thay đổi**: Props `{ label: string; selected?: boolean; onClick?: () => void }`:
    - Selected: `bg-primary text-white`
    - Unselected: `bg-white/5 text-text-2 border border-white/10`
    - Size: `px-3 py-1.5 rounded-full text-sm font-medium transition-colors`
    - Min touch target: `min-h-[36px]`
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: `Chip` component với selected/unselected state

- [x] **TODO-1.3.3**: Tạo `FAB.tsx` — floating action button
  - **File**: `apps/frontend/src/components/ui/FAB.tsx`
  - **Context**: Đọc `src/index.css` tokens
  - **Thay đổi**: Props `{ onClick: () => void; hasBadge?: boolean; icon?: React.ReactNode }`:
    - `w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent shadow-lg`
    - `glow: box-shadow: 0 0 20px rgba(99,102,241,0.4)`
    - Optional ping badge: `absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full` với `animate-ping-slow`
    - Position: `fixed bottom-24 right-4 z-30` (above BottomNav)
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: FAB button với gradient và optional badge

- [x] **TODO-1.3.4**: Tạo `SearchBar.tsx` — search input component
  - **File**: `apps/frontend/src/components/ui/SearchBar.tsx`
  - **Context**: `lucide-react` `Search` và `X` icons
  - **Thay đổi**: Props `{ value: string; onChange: (v: string) => void; placeholder?: string }`:
    - `bg-surface-2 border border-white/10 rounded-2xl px-4 py-3`
    - `SearchIcon` trái, input giữa, `XIcon` phải (khi value không rỗng, clearable)
    - `text-text-1 placeholder:text-text-3`
    - Full width
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: `SearchBar` component reusable

- [x] **TODO-1.3.5**: Tạo `ProgressBar.tsx` — animated progress
  - **File**: `apps/frontend/src/components/ui/ProgressBar.tsx`
  - **Context**: `framer-motion`, `src/index.css` tokens
  - **Thay đổi**: Props `{ value: number; max?: number; className?: string }`:
    - Container: `bg-white/5 rounded-full h-1.5`
    - Fill: `motion.div` `bg-primary rounded-full h-full` animate width `${(value/max)*100}%`
    - `transition={{ duration: 0.5, ease: 'easeOut' }}`
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Animated progress bar

- [x] **TODO-1.3.6**: Tạo `SkeletonCard.tsx` — shimmer loading state
  - **File**: `apps/frontend/src/components/ui/SkeletonCard.tsx`
  - **Context**: `src/index.css` tokens
  - **Thay đổi**:
    - CSS shimmer: `@keyframes shimmer` trong index.css (thêm nếu chưa có): `from: background-position: -200%; to: background-position: 200%`
    - Component: `bg-gradient-to-r from-surface-2 via-surface-3 to-surface-2 bg-[length:200%] animate-[shimmer_1.5s_infinite]`
    - Props `{ lines?: number; className?: string }` — render N line placeholders
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Shimmer skeleton loader

---

### Phase 2: Quick Note Screen (Priority Feature)

#### REQ-04: Quick Note Screen

- [x] **TODO-2.4.1**: Extract polling logic thành `useQuickNotePolling` hook
  - **File**: `apps/frontend/src/hooks/useQuickNotePolling.ts`
  - **Context**: Đọc `src/pages/QuickNotePage.tsx` phần `pollRef` và `useEffect` polling (lines 55-70)
  - **Thay đổi**: Tạo custom hook:
    ```ts
    // useQuickNotePolling(notes: QuickNote[], onRefresh: () => Promise<void>): void
    // - Dùng useRef<ReturnType<typeof setInterval>>
    // - Nếu có note PENDING/PROCESSING → start interval 4000ms → gọi onRefresh
    // - Khi không còn pending → clearInterval
    // - cleanup on unmount
    ```
  - **Verify**: `npm run build` không lỗi TypeScript
  - **Kết quả**: Reusable hook `useQuickNotePolling` để dùng trong QuickNotePage mới

- [x] **TODO-2.4.2**: Tạo `LanguageFilterChips.tsx`
  - **File**: `apps/frontend/src/components/quick-note/LanguageFilterChips.tsx`
  - **Context**: Đọc `Chip.tsx`, `Badge.tsx` (LanguageBadge), `QuickNote` interface từ QuickNotePage
  - **Thay đổi**: Props `{ notes: QuickNote[]; selected: string; onSelect: (code: string) => void }`:
    - Derive unique language codes từ `notes` dùng `useMemo`
    - Render chip "All" + chip cho mỗi language code (dùng `LanguageBadge` icon + code)
    - Horizontal scroll `flex gap-2 overflow-x-auto pb-1 no-scrollbar`
    - Chip "All" selected khi `selected === ''`
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Language filter chips tự động derive từ notes data

- [x] **TODO-2.4.3**: Tạo `QuickNoteCard.tsx` — note card với swipe gesture
  - **File**: `apps/frontend/src/components/quick-note/QuickNoteCard.tsx`
  - **Context**: Đọc `QuickNote` interface (QuickNotePage.tsx lines 4-22), `CefrBadge`, `LanguageBadge`, `framer-motion`
  - **Thay đổi**: Props `{ note: QuickNote; onDelete: (id: string) => void; onAddToDeck: (vocabId: string) => void }`:
    - Container `motion.div` với `drag="x"` `dragConstraints={{ left: -80, right: 80 }}`
    - Swipe reveal: left (-80px) → red delete bg; right (+80px và status=DONE) → green add bg
    - `onDragEnd`: if offsetX < -60 → `onDelete(note.id)`; if offsetX > 60 && note.vocabularyBaseId → `onAddToDeck(note.vocabularyBaseId)`
    - Card content: `bg-surface-2 rounded-2xl p-4 relative z-10`
    - Header row: term (xl bold text-text-1) + `LanguageBadge` + `CefrBadge` (khi status=DONE)
    - Phonetic: `text-sm font-mono text-text-3` (khi có)
    - Translation: `text-base text-accent font-medium` (khi status=DONE, từ `translations[0].translation`)
    - Example: `text-sm text-text-2 italic line-clamp-2` (khi có `exampleSentence`)
    - Status badge khi PENDING/PROCESSING/ERROR: small `SkeletonCard` placeholder row hoặc error text
    - `partOfSpeech` chip nhỏ `bg-white/5 text-text-3 text-xs px-2 py-0.5 rounded-full`
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Swipeable card hiển thị đầy đủ AI enrichment data

- [x] **TODO-2.4.4**: Tạo `AddQuickNoteSheet.tsx` — bottom sheet thêm note
  - **File**: `apps/frontend/src/components/quick-note/AddQuickNoteSheet.tsx`
  - **Context**: Đọc `BottomSheet.tsx`, `Chip.tsx`, `quickNoteApi`, `languageApi` từ `client.ts`
  - **Thay đổi**: Props `{ isOpen: boolean; onClose: () => void; onAdded: (note: QuickNote) => void }`:
    - Wrap trong `BottomSheet`
    - State: `term`, `sourceLang` (default 'en'), `targetLang` (default 'vi'), `languages[]`, `submitting`
    - `useEffect` load languages từ `languageApi.getAll()` khi mount
    - Term input: `text-xl font-semibold bg-transparent border-b border-white/20 pb-2` autofocus (via `useRef` + timeout 300ms)
    - Source lang section: label "Word in" + horizontal Chip list từ languages (tối đa show top 6)
    - Target lang section: label "Translate to" + horizontal Chip list
    - Submit button: `bg-gradient-to-r from-primary to-accent text-white rounded-2xl py-4 w-full font-semibold`
    - `handleSubmit`: gọi `quickNoteApi.create()` → `onAdded(note)` → reset form → `onClose()`
    - Khi `submitting`: button disabled với spinner icon
    - Error: `toast.error()` từ `react-hot-toast`
  - **Verify**: `npm run build` không lỗi TypeScript
  - **Kết quả**: Bottom sheet với form thêm note, submit gọi đúng API

- [x] **TODO-2.4.5**: Viết lại `QuickNotePage.tsx` — assemble components mới
  - **File**: `apps/frontend/src/pages/QuickNotePage.tsx`
  - **Context**: Đọc `QuickNoteCard.tsx`, `AddQuickNoteSheet.tsx`, `LanguageFilterChips.tsx`, `useQuickNotePolling.ts`, `SearchBar.tsx`, `FAB.tsx`, `AppShell.tsx`
  - **Thay đổi**: Viết lại hoàn toàn, giữ nguyên state logic:
    ```tsx
    // State: notes[], languages[], searchQuery, languageFilter, sheetOpen
    // useEffect: loadNotes() on mount
    // useQuickNotePolling(notes, loadNotes) — thay thế pollRef
    // filteredNotes = useMemo: filter by searchQuery + languageFilter
    // handleDelete: quickNoteApi.remove(id) → setNotes filter
    // handleAddToDeck: vocabularyApi.addToMyList(vocabBaseId) → toast.success
    //
    // Render:
    // <AppShell title="Quick Notes">
    //   <SearchBar value={searchQuery} onChange={setSearchQuery} />  (sticky)
    //   <LanguageFilterChips notes={notes} selected={languageFilter} onSelect={...} />
    //   {loading → <SkeletonCard lines={3} />}
    //   {filteredNotes.length === 0 && !loading → empty state SVG}
    //   <motion.div variants={containerVariants}> stagger list
    //     {filteredNotes.map(n => <QuickNoteCard key={n.id} ... />)}
    //   </motion.div>
    //   <FAB onClick={() => setSheetOpen(true)} />
    //   <AddQuickNoteSheet isOpen={sheetOpen} onClose={...} onAdded={note => setNotes(prev => [note, ...prev])} />
    // </AppShell>
    ```
  - **Verify**: `npm run dev` → `/quick-notes` → hiển thị list; FAB mở sheet; submit tạo note; swipe delete hoạt động
  - **Kết quả**: QuickNotePage mới hoàn chỉnh với mobile UI

---

### Phase 3: Other Screens

#### REQ-05: Home Screen

- [x] **TODO-3.5.1**: Tạo `GreetingCard.tsx`
  - **File**: `apps/frontend/src/components/home/GreetingCard.tsx`
  - **Context**: Đọc `GamificationStats` từ `shared-types`, `src/index.css` tokens
  - **Thay đổi**: Props `{ displayName: string; stats: GamificationStats | null }`:
    - Greeting theo giờ: `new Date().getHours()` → "Good morning" (5-12) / "Good afternoon" (12-18) / "Good evening" (18+)
    - Card: `bg-gradient-to-br from-primary-dark to-surface-3 rounded-3xl p-5`
    - Row: greeting text (xl, bold) + avatar initials circle (bên phải)
    - Stats row: `🔥 {streak} day streak` | `⭐ {xp} XP`
    - Streak counter với `animate-float` nếu streak > 0
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Greeting card với streak và XP

- [x] **TODO-3.5.2**: Tạo `QuickNoteHorizontalCard.tsx`
  - **File**: `apps/frontend/src/components/home/QuickNoteHorizontalCard.tsx`
  - **Context**: Đọc `QuickNote` interface, `LanguageBadge`
  - **Thay đổi**: Props `{ note: QuickNote; onClick: () => void }`:
    - `w-40 h-28 flex-shrink-0 bg-surface-2 rounded-2xl p-3 cursor-pointer`
    - Left border 3px gradient màu theo `sourceLanguageCode` (en=indigo, vi=green, ja=red, ...)
    - Term (base bold, text-text-1, truncate)
    - `LanguageBadge` nhỏ
    - Translation (sm, text-text-2, line-clamp-2) hoặc skeleton nếu PENDING
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Mini card 160×112px cho horizontal scroll

- [x] **TODO-3.5.3**: Tạo `DueVocabItem.tsx`
  - **File**: `apps/frontend/src/components/home/DueVocabItem.tsx`
  - **Context**: Đọc `QueueItem` interface từ ReviewPage, `LanguageBadge`
  - **Thay đổi**: Props `{ item: { term: string; language: { code: string }; memoryStrength: number } }`:
    - Row: `flex items-center gap-3 py-3 border-b border-white/5`
    - Left: language flag circle
    - Middle: term (base bold) + language name (xs text-text-3)
    - Right: memory strength bar (xanh nếu >0.7, vàng nếu >0.4, đỏ nếu ≤0.4)
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: Due review row item

- [x] **TODO-3.5.4**: Viết lại `DashboardPage.tsx` thành HomePage mobile
  - **File**: `apps/frontend/src/pages/DashboardPage.tsx`
  - **Context**: Đọc `GreetingCard`, `QuickNoteHorizontalCard`, `DueVocabItem`, `SkeletonCard`, APIs hiện có
  - **Thay đổi**: Viết lại hoàn toàn:
    ```tsx
    // State: user, stats, recentNotes[], dueQueue[]
    // useEffect: parallel load userApi.getMe(), gamificationApi.getStats(),
    //            quickNoteApi.list() (slice 5), reviewApi.getQueue({limit: 5})
    //
    // Render:
    // <AppShell title="PolyLex" rightAction={<Avatar />}>
    //   <GreetingCard displayName={user?.displayName} stats={stats} />
    //
    //   <Section title="Quick Notes" seeAllPath="/quick-notes">
    //     {loading → 3× SkeletonCard (horizontal)}
    //     <div className="flex gap-3 overflow-x-auto">
    //       {recentNotes.map(n => <QuickNoteHorizontalCard ... />)}
    //     </div>
    //   </Section>
    //
    //   <Section title="Due for Review" seeAllPath="/review">
    //     {dueQueue.slice(0,5).map(item => <DueVocabItem ... />)}
    //     {dueQueue.length === 0 → "All caught up! 🎉"}
    //   </Section>
    // </AppShell>
    ```
    - Giữ nguyên imports `userApi`, `gamificationApi`, `reviewApi` — chỉ thêm `quickNoteApi`
  - **Verify**: `npm run dev` → `/dashboard` hiển thị đúng dữ liệu
  - **Kết quả**: HomePage mobile với greeting, recent notes, due items

#### REQ-06: Vocabulary Screen

- [x] **TODO-3.6.1**: Tạo `DeckCard.tsx`
  - **File**: `apps/frontend/src/components/vocab/DeckCard.tsx`
  - **Context**: Đọc `VocabItem` interface từ VocabularyPage, `ProgressBar`, `LanguageBadge`
  - **Thay đổi**: Props `{ languageCode: string; languageName: string; words: VocabItem[]; dueCount?: number }`:
    - `bg-surface-2 rounded-2xl p-4`
    - Header: `LanguageBadge` + tên ngôn ngữ (bold) + word count chip bên phải
    - Sub: "N terms · M due" (text-text-3 sm)
    - `ProgressBar` mastery (dùng `memoryStrength` trung bình nếu có, hoặc placeholder 0.6)
    - Expandable: `useState isExpanded` → show/hide word list khi tap
    - Word list (collapsed): `line-clamp-1`, show top 3 words khi expanded
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: DeckCard với expand/collapse word list

- [x] **TODO-3.6.2**: Viết lại `VocabularyPage.tsx` thành deck view
  - **File**: `apps/frontend/src/pages/VocabularyPage.tsx`
  - **Context**: Đọc `DeckCard.tsx`, `vocabularyApi.getMyList()`, `FAB.tsx`, `SearchBar.tsx`
  - **Thay đổi**: Viết lại hoàn toàn:
    ```tsx
    // State: myList[], loading, search
    // useEffect: vocabularyApi.getMyList() on mount
    // deckGroups = useMemo: group myList by language.code
    //   → Record<string, { languageName, words[] }>
    //
    // Render:
    // <AppShell title="My Vocabulary">
    //   <SearchBar value={search} onChange={setSearch} />
    //   {loading → <SkeletonCard lines={4} />}
    //   {Object.entries(deckGroups).map(([code, deck]) =>
    //     <DeckCard key={code} ... />
    //   )}
    //   {myList.length === 0 && !loading → empty state}
    //   <FAB onClick={() => navigate('/vocabulary/search')} icon={<SearchIcon />} />
    // </AppShell>
    //
    // Note: /vocabulary/search là route mới navigating to search flow
    // Tạm thời FAB navigate to global vocabulary search route hiện có
    ```
    - Xóa `AddWordModal` và search/filter desktop UI
    - Giữ nguyên `vocabularyApi.getMyList()`, `vocabularyApi.addToMyList()`
  - **Verify**: `npm run dev` → `/vocabulary` → thấy deck cards grouped theo language
  - **Kết quả**: Vocabulary page với deck view mobile

#### REQ-07: Review Screen

- [x] **TODO-3.7.1**: Tạo `FlashCard.tsx` — 3D flip card
  - **File**: `apps/frontend/src/components/review/FlashCard.tsx`
  - **Context**: Đọc `QueueItem` interface từ ReviewPage, `LanguageBadge`, `CefrBadge`, `framer-motion`
  - **Thay đổi**: Props `{ item: QueueItem; isFlipped: boolean; onFlip: () => void }`:
    - Container: `relative w-full aspect-[3/2] cursor-pointer` với `perspective: 1000px`
    - Front (`backface-visibility: hidden`, `rotateY: isFlipped ? 180 : 0`):
      - `bg-surface-2 rounded-3xl p-8 flex flex-col items-center justify-center`
      - Term (3xl bold text-text-1) + `LanguageBadge`
      - "Tap to reveal" hint (xs text-text-3 mt-auto)
    - Back (`rotateY: isFlipped ? 0 : -180`, backface-visibility hidden):
      - Translation (2xl bold text-accent)
      - Phonetic (sm mono text-text-3)
      - Example sentence (sm italic text-text-2 mt-3)
      - TTS button (`VolumeIcon` lucide) — gọi `window.speechSynthesis` giữ nguyên từ ReviewPage cũ
    - `motion.div` với `style={{ rotateY }}` (useSpring hoặc direct)
    - `transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}`
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: FlashCard 3D flip với front (term) / back (translation + phonetic + example)

- [x] **TODO-3.7.2**: Tạo `RatingButtons.tsx` — Hard/OK/Easy buttons
  - **File**: `apps/frontend/src/components/review/RatingButtons.tsx`
  - **Context**: `framer-motion`, `recallQuality` mapping: Hard=0, OK=3, Easy=5
  - **Thay đổi**: Props `{ onRate: (quality: number) => void; disabled?: boolean }`:
    - 3 nút: `{ label: '😞 Hard', value: 0, color: 'bg-error/20 text-error border-error/30' }`, `{ label: '😐 OK', value: 3, color: 'bg-warning/20 text-warning border-warning/30' }`, `{ label: '😊 Easy', value: 5, color: 'bg-success/20 text-success border-success/30' }`
    - `motion.div` `initial={{ y: 20, opacity: 0 }}` `animate={{ y: 0, opacity: 1 }}`
    - `flex gap-3`, mỗi nút `flex-1 py-4 rounded-2xl border font-semibold text-base`
    - Min height 56px (touch target)
  - **Verify**: `npm run build` không lỗi
  - **Kết quả**: 3 rating buttons slide-up animation

- [x] **TODO-3.7.3**: Viết lại `ReviewPage.tsx` dùng FlashCard + RatingButtons
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: Đọc `FlashCard.tsx`, `RatingButtons.tsx`, `ProgressBar.tsx`, ReviewPage hiện tại (giữ nguyên toàn bộ state/API logic)
  - **Thay đổi**: Giữ nguyên hoàn toàn: states, `loadQueue`, `handleReveal`, `handleRate`, `sessionStats`. Chỉ thay UI:
    ```tsx
    // <AppShell title="Review" rightAction={<span>{current+1}/{queue.length}</span>}>
    //   <ProgressBar value={current} max={queue.length} className="mb-4" />
    //
    //   {phase === 'loading' → <SkeletonCard lines={5} className="aspect-[3/2]" />}
    //   {phase === 'idle' → empty state "All done!" với stats}
    //   {phase === 'card' | 'rating' →
    //     <FlashCard
    //       item={queue[current]}
    //       isFlipped={showAnswer}
    //       onFlip={handleReveal}
    //     />
    //     {phase === 'rating' →
    //       <RatingButtons onRate={handleRate} disabled={submitting} />
    //     }
    //   }
    //   {phase === 'done' → session complete card với accuracy %}
    // </AppShell>
    ```
  - **Verify**: `npm run dev` → `/review` → flip card → rate → move to next card → đúng
  - **Kết quả**: ReviewPage mobile với 3D flip và rating buttons

#### REQ-08: Profile Screen

- [x] **TODO-3.8.1**: Tạo `ProfilePage.tsx`
  - **File**: `apps/frontend/src/pages/ProfilePage.tsx`
  - **Context**: Đọc `userApi.getMe()`, `gamificationApi.getStats()`, `useAuthStore`, `GamificationStats` type
  - **Thay đổi**: Tạo mới:
    ```tsx
    // State: user (từ store), stats
    // useEffect: gamificationApi.getStats().then(setStats)
    //
    // <AppShell title="Profile">
    //   {/* Avatar */}
    //   <div className="flex flex-col items-center py-6">
    //     <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-2xl font-bold">
    //       {initials}  {/* displayName.slice(0,2).toUpperCase() */}
    //     </div>
    //     <h2>{user?.displayName}</h2>
    //     <p className="text-text-3 text-sm">{user?.email}</p>
    //   </div>
    //
    //   {/* Stats grid 2x2 */}
    //   <div className="grid grid-cols-2 gap-3 px-4 mb-6">
    //     { [Total Words, Streak, Total XP, Days Active] }
    //   </div>
    //
    //   {/* Settings list */}
    //   <div className="px-4 space-y-1">
    //     <SettingsRow icon={<GlobeIcon />} label="Languages" onClick={...} />
    //     <SettingsRow icon={<BellIcon />} label="Notifications" onClick={...} />  {/* placeholder */}
    //     <SettingsRow icon={<DownloadIcon />} label="Export Data" onClick={...} />  {/* placeholder */}
    //   </div>
    //
    //   {/* Sign out */}
    //   <button onClick={handleLogout} className="mx-4 mt-8 w-full py-4 rounded-2xl bg-error/10 text-error border border-error/20 font-semibold">
    //     Sign Out
    //   </button>
    // </AppShell>
    ```
    - `handleLogout`: gọi `authApi.logout()` → `logout()` store → `navigate('/login')`
  - **Verify**: `npm run dev` → `/profile` → hiển thị user info; logout redirect về `/login`
  - **Kết quả**: Profile screen với stats + logout

#### REQ-10: Auth Pages Mobile

- [x] **TODO-3.10.1**: Reskin `LoginPage.tsx` theo dark theme
  - **File**: `apps/frontend/src/pages/LoginPage.tsx`
  - **Context**: Đọc LoginPage hiện tại — giữ nguyên hoàn toàn state logic và `handleSubmit`
  - **Thay đổi**: Chỉ thay UI wrapper và className (không đổi state, handlers, API calls):
    - Outer: `min-h-screen bg-surface flex flex-col items-center justify-center px-4`
    - Logo section: PolyLex gradient text + tagline
    - Card: `bg-surface-2 rounded-3xl p-6 w-full max-w-sm border border-white/5`
    - Input: `bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-text-1 placeholder:text-text-3 focus:border-primary focus:outline-none`
    - Error: `text-error text-sm` (thay className, giữ logic)
    - Button: `bg-gradient-to-r from-primary to-accent text-white rounded-2xl py-4 font-semibold` + disabled state
    - Register link: `text-accent`
  - **Verify**: `npm run dev` → login với credentials hợp lệ → redirect `/dashboard` đúng
  - **Kết quả**: Login page dark theme, auth flow không bị break

- [x] **TODO-3.10.2**: Reskin `RegisterPage.tsx` theo dark theme
  - **File**: `apps/frontend/src/pages/RegisterPage.tsx`
  - **Context**: Đọc RegisterPage hiện tại, LoginPage vừa reskin để consistent styling
  - **Thay đổi**: Áp dụng cùng pattern với LoginPage (dark bg, surface-2 card, gradient button). Giữ nguyên state logic, `handleSubmit`, API calls
  - **Verify**: `npm run dev` → register form submit → redirect `/dashboard`
  - **Kết quả**: Register page consistent với Login page dark theme

---

### Phase 4: Polish & Animations

#### REQ-09: Page Transitions & Polish

- [x] **TODO-4.9.1**: Thêm `<Toaster />` từ `react-hot-toast` vào AppShell
  - **File**: `apps/frontend/src/components/layout/AppShell.tsx`
  - **Context**: Đọc `react-hot-toast` docs: import `{ Toaster }` từ `react-hot-toast`
  - **Thay đổi**: Thêm `<Toaster position="top-center" toastOptions={{ style: { background: '#1A1A2E', color: '#F1F5F9', border: '1px solid rgba(99,102,241,0.2)' } }} />` vào trong AppShell render, ngoài main content
  - **Verify**: Gọi `toast.success('test')` từ bất kỳ component → thấy toast xuất hiện
  - **Kết quả**: Global toast provider hoạt động

- [x] **TODO-4.9.2**: Thay `setError()` text bằng `toast.error()` trong `QuickNotePage.tsx`
  - **File**: `apps/frontend/src/pages/QuickNotePage.tsx`
  - **Context**: Đọc QuickNotePage mới, `react-hot-toast`
  - **Thay đổi**:
    - Import `toast` từ `react-hot-toast`
    - Thay `setError(msg)` trong catch block của `handleDelete` → `toast.error(msg ?? 'Failed to delete')`
    - Thêm `toast.success('Added to deck!')` trong `handleAddToDeck` success
    - Xóa error state display nếu còn
  - **Verify**: Swipe delete → không có lỗi; add to deck → toast success
  - **Kết quả**: Error/success feedback qua toast

- [x] **TODO-4.9.3**: Thêm stagger animation vào danh sách QuickNote cards
  - **File**: `apps/frontend/src/pages/QuickNotePage.tsx`
  - **Context**: Đọc `framer-motion` `variants` API
  - **Thay đổi**: Wrap list trong `motion.div` với `containerVariants`:
    ```tsx
    const containerVariants = {
      animate: { transition: { staggerChildren: 0.06 } }
    };
    const itemVariants = {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
    };
    // Wrap <motion.div variants={containerVariants} initial="initial" animate="animate">
    // Wrap mỗi QuickNoteCard: <motion.div variants={itemVariants}>
    ```
  - **Verify**: `npm run dev` → mở `/quick-notes` → cards animate in lần lượt
  - **Kết quả**: Cards stagger in khi page load

- [x] **TODO-4.9.4**: Thêm empty state cho QuickNotePage (không có note nào)
  - **File**: `apps/frontend/src/pages/QuickNotePage.tsx`
  - **Context**: Đọc file hiện tại
  - **Thay đổi**: Khi `filteredNotes.length === 0 && !loading`, render:
    ```tsx
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <svg>/* inline SVG notebook icon */</svg>
      <h3 className="text-text-1 font-semibold mt-4">No notes yet</h3>
      <p className="text-text-3 text-sm mt-1">Tap + to add your first word</p>
    </div>
    ```
  - **Verify**: Clear all notes → empty state hiện ra
  - **Kết quả**: Empty state với call-to-action

- [x] **TODO-4.9.5**: Thêm empty state cho ReviewPage (không có cards due)
  - **File**: `apps/frontend/src/pages/ReviewPage.tsx`
  - **Context**: Đọc ReviewPage mới, phase `'idle'` state
  - **Thay đổi**: Thay text idle state hiện tại bằng:
    ```tsx
    // phase === 'idle':
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-6xl mb-4">🎉</div>
      <h3>All caught up!</h3>
      <p className="text-text-3 text-sm mt-1">Check back tomorrow for more reviews</p>
      <button onClick={() => navigate('/dashboard')} className="mt-6 bg-primary ...">
        Go to Dashboard
      </button>
    </div>
    ```
  - **Verify**: Khi queue rỗng → empty state hiện đúng với navigate button
  - **Kết quả**: Friendly empty state cho review

- [x] **TODO-4.9.6**: Thêm page transition animation vào AppShell
  - **File**: `apps/frontend/src/components/layout/AppShell.tsx`
  - **Context**: Đọc `framer-motion` `AnimatePresence`, `useLocation` từ `react-router-dom`
  - **Thay đổi**: Wrap main content area với `AnimatePresence mode="wait"` + `motion.main`:
    ```tsx
    const location = useLocation();
    // ...
    <AnimatePresence mode="wait">
      <motion.main
        key={location.pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="pt-14 pb-24 overflow-y-auto h-screen"
      >
        {children}
      </motion.main>
    </AnimatePresence>
    ```
  - **Verify**: Navigate giữa tabs → content fade/slide transition mượt, không flash trắng
  - **Kết quả**: Smooth page transitions

- [x] **TODO-4.9.7**: Thêm `no-scrollbar` utility class vào `index.css`
  - **File**: `apps/frontend/src/index.css`
  - **Context**: Cần cho horizontal scroll trong LanguageFilterChips và QuickNoteHorizontalCards
  - **Thay đổi**: Thêm sau `@theme` block:
    ```css
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    ```
  - **Verify**: Horizontal scroll areas không hiện scrollbar trên Chrome/Safari
  - **Kết quả**: Clean horizontal scroll UX

---

### Phase 5: Integration & Verification

- [ ] **TODO-5.1**: Install dependencies
  - **Thay đổi**: `cd apps/frontend && npm install`
  - **Verify**: `node_modules/framer-motion` và `node_modules/react-hot-toast` tồn tại
  - **Kết quả**: All packages installed

- [ ] **TODO-5.2**: Full TypeScript build
  - **Thay đổi**: `cd apps/frontend && npm run build`
  - **Verify**: Exit code 0, không có TypeScript errors, `dist/` được tạo
  - **Kết quả**: Production build thành công

- [ ] **TODO-5.3**: Smoke test — Auth flow
  - **Thay đổi**: `npm run dev` → mở `http://localhost:5173`
  - **Verify**: 
    - Redirect về `/login` khi chưa auth ✓
    - Login → redirect `/dashboard` → GreetingCard hiển thị ✓
    - Logout từ Profile → redirect `/login` ✓
  - **Kết quả**: Auth flow không bị break

- [ ] **TODO-5.4**: Smoke test — Quick Note flow
  - **Thay đổi**: Trong `/quick-notes`
  - **Verify**:
    - FAB (+) mở AddQuickNoteSheet ✓
    - Submit note → note xuất hiện với status PENDING ✓
    - Sau 4-8s → status chuyển DONE với translation/phonetic ✓
    - Swipe left → note bị xóa ✓
    - Language filter chips hoạt động ✓
  - **Kết quả**: Quick Note end-to-end hoạt động đúng

- [ ] **TODO-5.5**: Smoke test — Review flow
  - **Thay đổi**: Trong `/review`
  - **Verify**:
    - FlashCard hiển thị term ✓
    - Tap → flip → translation + phonetic hiển thị ✓
    - RatingButtons xuất hiện sau flip ✓
    - Rate → move to next card ✓
    - TTS phát âm khi flip ✓
  - **Kết quả**: Review flow hoạt động đúng

- [ ] **TODO-5.6**: Smoke test — BottomNav navigation
  - **Thay đổi**: Click từng tab
  - **Verify**: Home → `/dashboard` ✓ | Notes → `/quick-notes` ✓ | Vocab → `/vocabulary` ✓ | Review → `/review` ✓ | Profile → `/profile` ✓ | Active state đúng tab hiện tại ✓
  - **Kết quả**: Navigation hoạt động đúng

---

## Ghi chú triển khai

- **Tailwind v4**: Không tạo `tailwind.config.js`. Toàn bộ custom tokens dùng `@theme` trong `src/index.css`. Class names vẫn dùng dấu gạch ngang: `bg-surface`, `text-primary`, `text-text-1`, etc.
- **lucide-react**: Kiểm tra đã có trong dependencies chưa trước TODO-1.2.2. Nếu chưa thêm vào `package.json` cùng lúc với framer-motion.
- **AppShell context**: Xem xét tạo `AppShellContext` để pass `title` và `rightAction` từ child pages thay vì prop drilling — hoặc đơn giản hơn: để mỗi page tự render AppShell với title của nó.
- **Route `/dashboard` vẫn giữ**: LoginPage redirect về `/dashboard`, giữ nguyên route name, chỉ nội dung DashboardPage thay đổi.
- **VocabularyPage**: Tạm thời FAB "Add Word" có thể navigate tới `/vocabulary/add` hoặc mở một sheet đơn giản. Không cần implement full search flow trong ticket này.

## Rủi ro cần theo dõi

- [ ] **Risk-1**: Tailwind v4 `@theme` có thể không nhận `--color-surface-2` dưới dạng class `bg-surface-2` (dấu gạch ngang trong tên) — Biện pháp: Test ngay sau TODO-1.1.3; nếu lỗi, đổi sang `--color-surface2` và dùng `bg-surface2`
- [ ] **Risk-2**: `framer-motion` v11 drag API có thể khác v10 — Biện pháp: Check docs v11 cho `drag="x"` + `dragConstraints` + `onDragEnd`
- [ ] **Risk-3**: iOS Safari không autofocus input trong bottom sheet — Biện pháp: `useEffect` trong AddQuickNoteSheet: `if (isOpen) setTimeout(() => inputRef.current?.focus(), 350)`
- [ ] **Risk-4**: `lucide-react` chưa có trong deps — Biện pháp: Kiểm tra `package.json` ở TODO-1.2.2, thêm vào TODO-1.1.1 nếu thiếu

---

## TÓM TẮT TRIỂN KHAI

**Ngày hoàn thành**: 2026-02-27  
**Trạng thái**: ✅ Hoàn thành — Build pass, 0 TypeScript errors

### Packages đã cài đặt

| Package | Version | Ghi chú |
|---------|---------|---------|
| `framer-motion` | `^11.0.0` | Page transitions, card flip, drag gestures |
| `react-hot-toast` | `^2.4.1` | Toast notifications toàn cục |
| `lucide-react` | `^0.460.0` | Icons (nâng từ ^0.344.0 do peer dep React 19) |

Cài đặt với `--legacy-peer-deps` do `lucide-react` chưa khai báo React 19 peer dep. Node.js v23 (nvm) được dùng do system node bị lỗi `icu4c@74`.

### Files đã tạo mới

#### Layout Components
- `src/components/layout/TopBar.tsx` — Fixed 56px top bar, glassmorphism, safe-area-inset
- `src/components/layout/BottomNav.tsx` — 5 tabs, FAB +45px giữa, active state
- `src/components/layout/AppShell.tsx` — Shell wrapper: TopBar + AnimatePresence + BottomNav + Toaster
- `src/components/layout/BottomSheet.tsx` — Spring animation sheet, backdrop close, drag handle

#### UI Primitives
- `src/components/ui/Badge.tsx` — `CefrBadge` (màu theo level) + `LanguageBadge` (flag + code)
- `src/components/ui/Chip.tsx` — Filter chip selected/unselected
- `src/components/ui/SearchBar.tsx` — Search với clear button
- `src/components/ui/ProgressBar.tsx` — framer-motion animated width
- `src/components/ui/SkeletonCard.tsx` — CSS shimmer loading state

#### Home Screen Components
- `src/components/home/GreetingCard.tsx` — Greeting theo giờ, avatar initials, streak + XP
- `src/components/home/QuickNoteHorizontalCard.tsx` — 160×112px mini card cho horizontal scroll
- `src/components/home/DueVocabItem.tsx` — Row item với memory strength bar

#### Vocabulary Components
- `src/components/vocab/DeckCard.tsx` — Language deck card, expand/collapse word list, ProgressBar

#### Review Components
- `src/components/review/FlashCard.tsx` — 3D flip với framer-motion, TTS on reveal
- `src/components/review/RatingButtons.tsx` — Hard/OK/Easy (quality 0/3/5), slide-up animation

#### Quick Note Components
- `src/components/quick-note/LanguageFilterChips.tsx` — Auto-derive language chips từ notes
- `src/components/quick-note/QuickNoteCard.tsx` — Swipe left=delete, right=add to deck (exports `QuickNote` interface)
- `src/components/quick-note/AddQuickNoteSheet.tsx` — BottomSheet + form, autofocus, language chips

#### Hooks
- `src/hooks/useQuickNotePolling.ts` — Polling 4s khi có PENDING/PROCESSING notes

#### Pages (mới)
- `src/pages/ProfilePage.tsx` — Avatar, learning languages, sign out

### Files đã chỉnh sửa

| File | Loại thay đổi |
|------|---------------|
| `apps/frontend/package.json` | Thêm 3 dependencies |
| `apps/frontend/index.html` | Fonts, meta tags, title PWA |
| `src/index.css` | Thêm `@theme` tokens, keyframes, base dark, `.no-scrollbar`, `.glow` |
| `src/App.tsx` | Xóa Layout wrapper, thêm route `/profile` |
| `src/pages/DashboardPage.tsx` | Viết lại — AppShell + GreetingCard + quick notes + due items |
| `src/pages/VocabularyPage.tsx` | Viết lại — DeckCard grouped by language, SearchBar, FAB |
| `src/pages/ReviewPage.tsx` | Viết lại — AppShell + FlashCard + RatingButtons + ProgressBar |
| `src/pages/QuickNotePage.tsx` | Viết lại — AppShell + filter chips + swipeable cards + AddQuickNoteSheet |
| `src/pages/LoginPage.tsx` | Reskin — dark theme, giữ nguyên auth logic |
| `src/pages/RegisterPage.tsx` | Reskin — dark theme, giữ nguyên auth logic |
| `src/pages/RoadmapPage.tsx` | Thêm AppShell wrapper |
| `src/pages/AnalyticsPage.tsx` | Thêm AppShell wrapper |

### Quyết định thiết kế

1. **FAB.tsx không tạo riêng** — FAB được inline trong BottomNav (center tab) và VocabularyPage. Không cần component riêng do context sử dụng khác nhau quá nhiều.

2. **Tailwind v4 `@theme`** — Toàn bộ design tokens dùng CSS `@theme` directive trong `index.css` (không có `tailwind.config.js`). Class naming dùng tên trực tiếp: `bg-[#0F0F1A]`, `text-[#F1F5F9]` thay vì Tailwind custom tokens do v4 behavior.

3. **VocabularyPage — decks từ `getMyList()`** — Grouping theo language được thực hiện phía FE với `useMemo`. API `getMyList()` trả flat list, FE group thành `LangGroup[]`.

4. **FlashCard interface** — Nhận `item: QueueItem` trực tiếp thay vì flat props để tái sử dụng từ ReviewPage dễ hơn.

5. **ProfilePage đơn giản hóa** — Hiển thị learning languages với CefrBadge + LanguageBadge, navigate đến Roadmap/Analytics, sign out. Không cần stats grid 2×2 do gamification stats đã có ở DashboardPage.

### Build kết quả

```
dist/index.html                   0.95 kB │ gzip:   0.49 kB
dist/assets/index-CLLisSje.css   29.12 kB │ gzip:   6.17 kB
dist/assets/index-BXBFRvGu.js   442.42 kB │ gzip: 141.66 kB
✓ built in 3.71s
```

Bundle size 442KB (141KB gzip) là hợp lý cho app này có framer-motion.
