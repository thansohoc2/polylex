# TICKET-017 — Fix: Mobile Input Focus Auto-Zoom

## Mô tả
Trên điện thoại (iOS Safari / Android Chrome), khi vào trang Login và focus vào các input (email, mật khẩu), trình duyệt tự động zoom to trang lên. Hành vi này không mong muốn và ảnh hưởng xấu đến UX trên mobile.

## Môi trường xảy ra
- iOS Safari (iPhone)
- Android Chrome

## Hành vi mong đợi
Khi focus vào input, trang không được zoom to lên.

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-017 |
| **Tiêu đề** | Fix: Mobile Input Focus Auto-Zoom trên trang Login |
| **Mục tiêu** | Ngăn iOS/Android tự động zoom trang khi focus vào input |
| **Phạm vi** | Frontend CSS + toàn bộ trang có input (Login, AddWordModal, SearchBar, AddQuickNoteSheet) |
| **Độ ưu tiên** | Cao — ảnh hưởng trực tiếp đến UX mobile, đặc biệt là trang Login (điểm vào đầu tiên) |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Fix CSS font-size input toàn cục | Thêm rule CSS đặt `font-size: max(16px, 1em)` cho tất cả input/textarea/select | CSS global | Nhỏ |
| REQ-02 | Kiểm tra viewport meta tag | Đảm bảo viewport không có `maximum-scale=1` (phá accessibility) — giữ nguyên cách tiếp cận CSS | HTML | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-02 (verify) ──> REQ-01 (implement)
```

REQ-01 là giải pháp đủ, REQ-02 chỉ là xác nhận không dùng workaround sai.

#### Chi tiết từng yêu cầu con

##### REQ-01: Fix CSS font-size input toàn cục
- **Mục tiêu**: Đặt font-size tối thiểu 16px cho tất cả input trên toàn app
- **Đầu vào**: `apps/frontend/src/index.css`
- **Đầu ra mong đợi**: iOS und Android không zoom khi focus input ở bất kỳ trang nào
- **Tiêu chí hoàn thành**: Trên iOS Safari, focus vào email input tại `/login` không trigger zoom
- **Phụ thuộc**: Không

##### REQ-02: Kiểm tra viewport meta tag
- **Mục tiêu**: Xác nhận viewport hiện tại không dùng `maximum-scale=1` (vốn là workaround tồi, phá accessibility)
- **Đầu vào**: `apps/frontend/index.html`
- **Đầu ra mong đợi**: Viewport giữ `initial-scale=1.0, viewport-fit=cover` — không thêm `maximum-scale`
- **Tiêu chí hoàn thành**: index.html không thay đổi (đã đúng rồi)
- **Phụ thuộc**: Không

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng bị ảnh hưởng**: Đăng nhập (trang Login là entry point chính) → trải nghiệm đầu tiên của user
- **Trang bị ảnh hưởng**: LoginPage, RegisterPage (nếu có input), AddWordModal, SearchBar, AddQuickNoteSheet
- **Quy tắc UX**: Trang phải stable khi focus input trên mobile; không tự zoom
- **Hành vi cần bảo toàn**: User vẫn có thể pinch-zoom thủ công (không được disable)

---

### 4. Ngữ cảnh kỹ thuật

#### Nguyên nhân gốc rễ
iOS Safari và Android Chrome **tự động zoom** trang khi focus vào bất kỳ form input nào có **`font-size < 16px`**. Đây là hành vi built-in của browser nhằm hỗ trợ đọc text nhỏ.

Tất cả input hiện tại đang dùng class Tailwind **`text-sm`** = `font-size: 0.875rem` = **14px** → nhỏ hơn ngưỡng 16px → trigger auto-zoom.

#### File bị ảnh hưởng

| File | Input bị zoom |
|------|--------------|
| `src/pages/LoginPage.tsx` | `type="email"` (line 56), `type="password"` (line 68) — dùng `text-sm` |
| `src/components/AddWordModal.tsx` | 3 × `type="text"` (lines 179, 242, 300) |
| `src/components/quick-note/AddQuickNoteSheet.tsx` | `type="text"` (line 83) |
| `src/components/ui/SearchBar.tsx` | `type="text"` (line 21) |
| `src/pages/RegisterPage.tsx` | (chưa kiểm tra — cần confirm) |

#### Viewport meta tag hiện tại (`index.html` line 8):
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
```
✅ Đúng — không có `maximum-scale=1`; không nên thêm vào.

#### CSS hiện tại (`src/index.css`):
- Không có bất kỳ rule nào override `font-size` của `<input>` elements
- Tailwind v4 đặt utility classes trong `@layer` → rule ngoài `@layer` sẽ thắng về cascade priority

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| Input dùng `text-sm` = 14px → browser tự zoom khi focus | Input render >= 16px → không zoom | Thiếu global CSS rule đặt min font-size 16px cho inputs |
| Không có rule nào trong index.css cho inputs | Global rule `font-size: max(16px, 1em)` trong index.css | Cần thêm ~4 dòng CSS |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Visual thay đổi nhẹ**: Input text hiển thị 16px thay vì 14px — gần như không nhận ra, nhưng label vẫn 14px (label không bị ảnh hưởng). **Biện pháp**: Dùng `max(16px, 1em)` giới hạn ảnh hưởng; font chỉ to lên 2px.

#### 6.2 Rủi ro kỹ thuật
- [ ] **Tailwind override**: Nếu đặt rule trong `@layer base`, Tailwind utility `text-sm` sẽ thắng và vẫn zoom. **Biện pháp**: Đặt rule **ngoài** `@layer` trong `index.css` — rule unlayered luôn thắng layered styles.
- [ ] **`!important` cascade**: Không cần dùng `!important` nếu đặt ngoài @layer đúng cách.

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **Workaround sai (maximum-scale=1)**: Một số hướng dẫn cũ đề xuất thêm `maximum-scale=1` vào viewport — điều này disable pinch-zoom của user, vi phạm accessibility (WCAG 1.4.4). **Cách phòng tránh**: Không dùng cách này; chỉ fix CSS.

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Fix toàn cục — áp dụng cho tất cả input trong app, không chỉ LoginPage | Input text to hơn 2px (14→16px) — ảnh hưởng thẩm mỹ nhỏ |
| Không cần sửa từng component riêng lẻ | — |
| Bảo toàn accessibility (user vẫn pinch-zoom được) | — |
| 1 rule CSS duy nhất — minimal change | — |
| Chuẩn web — đây là best practice cho mobile forms | — |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Thêm rule CSS toàn cục vào `apps/frontend/src/index.css` (ngoài `@layer`):
  ```css
  /* Prevent iOS/Android auto-zoom on input focus (triggered when font-size < 16px) */
  input, textarea, select {
    font-size: max(16px, 1em);
  }
  ```
  `max(16px, 1em)` đảm bảo: tối thiểu 16px (ngăn zoom), nhưng nếu context font-size lớn hơn thì scale theo.

- **Cách tiếp cận thay thế** (KHÔNG khuyến nghị): `maximum-scale=1` trong viewport meta — phá accessibility.
- **Phụ thuộc**: Không
- **Ước tính công sức**: ~15 phút — chỉ 3 dòng CSS

---

### 9. Câu hỏi mở
- [ ] RegisterPage có inputs không? (Khả năng cao là có — cùng fix global sẽ cover luôn)
- [ ] Có input nào cần font-size thực sự nhỏ hơn 16px vì lý do thiết kế đặc biệt không? (Hiện tại không thấy)

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Thêm 1 CSS rule toàn cục vào `index.css` để đặt `font-size: max(16px, 1em)` cho tất cả input — ngăn iOS/Android tự động zoom khi focus, áp dụng toàn bộ app trong một thay đổi duy nhất.

---

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: Khi focus vào bất kỳ `<input>`, `<textarea>`, `<select>` nào trên mobile, trang không được zoom to
2. FR-02: User vẫn có thể pinch-zoom thủ công (accessibility phải được bảo toàn)
3. FR-03: Viewport meta tag **không được** thêm `maximum-scale=1`

#### Ràng buộc phi chức năng
1. NFR-01: CSS rule phải đặt **ngoài** `@layer` để thắng Tailwind utility `text-sm`
2. NFR-02: Chỉ thay đổi 1 file CSS — không sửa từng component riêng lẻ
3. NFR-03: Giải pháp tuân thủ WCAG 1.4.4 (không disable user zoom)

#### Phụ thuộc
- DEP-01: Tailwind v4 — các utility như `text-sm` nằm trong `@layer utilities`, bị rule unlayered override ✅ (đã xác nhận)
- DEP-02: Vite build — `index.css` được bundle, rule có hiệu lực sau `npm run build` và `npm run dev`

---

### Cách tiếp cận
> Thêm rule `input, textarea, select { font-size: max(16px, 1em); }` vào `apps/frontend/src/index.css` ngoài bất kỳ `@layer` nào. Rule này thắng mọi Tailwind layered utility, đảm bảo font-size >= 16px trên tất cả inputs trong toàn app mà không cần chạm vào từng component.

---

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/frontend/src/index.css` | Thêm global rule `font-size: max(16px, 1em)` cho `input, textarea, select` |
| Giữ nguyên | `apps/frontend/index.html` | Viewport đã đúng — không thêm `maximum-scale` |

---

## PLAN TODO

### Phase 1: CSS Fix (Data/Style Layer)

#### REQ-01: Fix CSS font-size input toàn cục

- [x] **TODO-1.1.1**: Thêm global CSS rule ngăn auto-zoom vào `index.css`
  - **File**: `apps/frontend/src/index.css`
  - **Context**: Đọc `apps/frontend/src/index.css` — xem vị trí các rule base hiện có (sau block `html, body, #root`)
  - **Thay đổi**:
    - Thêm sau block `html, body, #root { ... }`:
      ```css
      /* Prevent iOS/Android auto-zoom on input focus (browsers zoom when font-size < 16px) */
      input, textarea, select {
        font-size: max(16px, 1em);
      }
      ```
    - Rule đặt **ngoài** `@layer` — thắng Tailwind utility `text-sm` (14px) theo CSS cascade
    - `max(16px, 1em)` đảm bảo ≥ 16px khi context nhỏ, scale theo context nếu lớn hơn
  - **Verify**: Bật DevTools mobile emulation, focus vào email input tại `/login` — viewport không shift/zoom
  - **Kết quả**: ✅ **ĐÃ THỰC HIỆN** — rule được thêm tại line 50-52 của `index.css`

#### REQ-02: Kiểm tra viewport meta tag

- [x] **TODO-1.2.1**: Xác nhận viewport meta tag trong `index.html` không có `maximum-scale`
  - **File**: `apps/frontend/index.html`
  - **Context**: Đọc `apps/frontend/index.html` — xem dòng `<meta name="viewport" ...>`
  - **Thay đổi**: Không có thay đổi — chỉ verify
    - Hiện tại: `content="width=device-width, initial-scale=1.0, viewport-fit=cover"` ✅
    - KHÔNG thêm `maximum-scale=1` (vi phạm WCAG 1.4.4 — disable pinch-zoom)
  - **Verify**: Inspect HTML source — không thấy `maximum-scale`
  - **Kết quả**: ✅ **ĐÃ XÁC NHẬN** — viewport meta đúng, không cần thay đổi

---

### Phase 2: Scope Confirmation

#### REQ-01 (Scope Verify — toàn bộ inputs bị ảnh hưởng)

- [x] **TODO-2.1.1**: Xác nhận danh sách tất cả `<input>` trong app được cover bởi rule toàn cục
  - **File**: Tất cả `*.tsx` có `<input>`
  - **Context**: Grep `type="email"|type="password"|type="text"|type="search"` trong `apps/frontend/src/`
  - **Thay đổi**: Không — chỉ verify scope
  - **Confirm**: Các file sau đều có input, tất cả được fix tự động:

    | File | Inputs | Status |
    |------|--------|--------|
    | `src/pages/LoginPage.tsx` | `type="email"` (line 56), `type="password"` (line 68) | ✅ Covered |
    | `src/pages/RegisterPage.tsx` | `type="text"`, `type="email"`, `type="password"`, `<select>` | ✅ Covered |
    | `src/components/AddWordModal.tsx` | 3 × `type="text"` (lines 179, 242, 300) | ✅ Covered |
    | `src/components/quick-note/AddQuickNoteSheet.tsx` | `type="text"` (line 83) | ✅ Covered |
    | `src/components/ui/SearchBar.tsx` | `type="text"` (line 21) | ✅ Covered |

  - **Kết quả**: ✅ **XÁC NHẬN** — 1 rule CSS cover toàn bộ, không cần sửa component nào

---

### Phase 3: Integration & Verification

- [x] **TODO-3.1**: Build frontend production để verify không có lỗi
  - **File**: `apps/frontend/` (run từ thư mục này)
  - **Context**: Không cần — chỉ run build
  - **Thay đổi**: Chạy `nvm use v23 && npm run build` tại `apps/frontend/`
  - **Verify**: Output `dist/` được tạo, không có error hoặc CSS warning ✅
  - **Kết quả**: ✅ Build thành công — `dist/assets/index-L2x52UvO.css` (33.90 kB), `dist/sw.js` generated, 0 errors, rule mới được bundle

- [x] **TODO-3.2**: Smoke test thủ công trên iOS Safari / Chrome mobile
  - **File**: Không có file — manual test
  - **Context**: Deploy hoặc dùng `npm run dev` với DevTools mobile emulation
  - **Thay đổi**: Không
  - **Test steps**:
    1. Mở `/login` trên thiết bị thật hoặc DevTools → iPhone emulation
    2. Tap vào input Email → viewport **không** bị zoom to
    3. Tap vào input Password → viewport **không** bị zoom to
    4. Mở `/register` → test 3 inputs + select → không zoom
    5. Mở Search → tap vào search input → không zoom
  - **Verify**: Không có viewport shift khi focus input
  - **Kết quả**: ℹ️ **Manual test cần thực hiện trên thiết bị thật** — CSS rule đã được bundle vào build, cơ chế fix là chuẩn web đã được kiểm chứng

---

## Ghi chú triển khai
- Fix đã được apply tại bước phân tích — `TODO-1.1.1` và `TODO-1.2.1` đã hoàn thành
- Còn lại: build verification (`TODO-3.1`) và smoke test thủ công trên thiết bị thật (`TODO-3.2`)
- `RegisterPage.tsx` dùng cả `<input>` và `<select>` cho native language — cả hai đều được cover bởi rule `input, textarea, select`
- Nếu sau này cần input nhỏ hơn 16px vì lý do design → dùng `font-size: 0.875rem` trực tiếp trên component đó (unlayered inline style thắng global rule)

## Rủi ro cần theo dõi
- [x] Risk-1: Một số browser cũ không hỗ trợ `max()` CSS function — **Biện pháp**: `max()` được hỗ trợ từ iOS 11.1+ / Chrome 79+ — đủ coverage cho target users
- [x] Risk-2: Input text trông hơi to hơn 2px trên desktop — **Biện pháp**: Difference 14→16px không đáng kể; nếu cần thiết kế pixel-perfect có thể dùng `@media (hover: none)` để chỉ apply trên touch devices

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Đã thêm 1 CSS rule toàn cục vào `index.css` đặt `font-size: max(16px, 1em)` cho tất cả `input`, `textarea`, `select` — ngăn iOS/Android trigger auto-zoom khi focus, áp dụng cho toàn bộ app trong một thay đổi duy nhất, build production thành công.

### Thống kê
- **Tổng TODO**: 5
- **Hoàn thành**: 4 ✅
- **Manual test pending**: 1 ⏳

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-1.1.1 | Thêm global CSS rule vào `index.css` | ✅ Done | Rule tại line 50-52 |
| TODO-1.2.1 | Xác nhận viewport meta không có `maximum-scale` | ✅ Done | Không cần thay đổi |
| TODO-2.1.1 | Xác nhận scope coverage toàn bộ inputs | ✅ Done | 5 file, tất cả covered |
| TODO-3.1 | Build production verify | ✅ Done | Build 3.18s, 0 errors |
| TODO-3.2 | Smoke test trên thiết bị thật | ⏳ Manual | Cần test trên iPhone/Android |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/frontend/src/index.css` | Modified | Thêm 4 dòng: global rule `font-size: max(16px, 1em)` cho `input, textarea, select` |
| `apps/frontend/index.html` | Unchanged | Viewport đúng — không cần thay đổi |

### Verification
- Build thành công: ✅
- Không có TypeScript errors: ✅
- Không có CSS errors: ✅
- Không có warning mới (chunk size warning tồn tại từ trước): ✅
- Smoke test thiết bị thật: ⏳ Pending manual

### Ghi chú
- Toàn bộ fix chỉ gồm 4 dòng CSS — zero component changes, zero risk của regression
- Rule `font-size: max(16px, 1em)` đặt ngoài `@layer` nên thắng Tailwind `text-sm` (14px) theo CSS cascade spec
- `CSS max()` function: browser support iOS 11.3+, Chrome 79+, Firefox 75+ — an toàn cho production
- Nếu cần input nhỏ hơn 16px trong tương lai: dùng `style={{ fontSize: '0.75rem' }}` inline (specificity cao hơn global rule)
