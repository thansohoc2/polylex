# TICKET-013: Redirect new user to /roadmap after registration

## Mô tả
User mới đăng ký xong cần redirect tới `/roadmap` để tạo lộ trình, tránh vào màn hình home không thấy data gì.

## Hiện trạng
- Sau khi đăng ký thành công, user được redirect tới `/dashboard`.
- Dashboard hiển thị XP, streak, từ vựng cần ôn, quick notes — toàn bộ đều trống với user mới → UX kém.

## Kỳ vọng
- Sau khi đăng ký thành công → redirect tới `/roadmap`.
- User ngay lập tức thấy màn hình tạo lộ trình học → onboarding tự nhiên hơn.

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-013 |
| **Tiêu đề** | Redirect user mới sau đăng ký về `/roadmap` |
| **Mục tiêu** | Sau khi đăng ký thành công, điều hướng user tới `/roadmap` thay vì `/dashboard` để user ngay lập tức tạo lộ trình học, tránh màn hình home trống |
| **Phạm vi** | Frontend — `RegisterPage.tsx`, tùy chọn `DashboardPage.tsx` |
| **Độ ưu tiên** | Trung bình |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Đổi redirect sau đăng ký | Thay `navigate('/dashboard')` → `navigate('/roadmap')` trong `RegisterPage` | Frontend | Nhỏ |
| REQ-02 | Smart redirect từ Dashboard | Nếu user chưa có lộ trình (`learningLanguages.length === 0` hoặc paths rỗng), tự động redirect sang `/roadmap` | Frontend | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 (độc lập — fix trực tiếp tại điểm đăng ký)
REQ-02 (độc lập — bảo vệ cho trường hợp user cũ chưa có path, hoặc truy cập thẳng /dashboard)
```

> REQ-01 bắt buộc. REQ-02 là bổ sung tùy chọn, cải thiện UX nhưng không phải yêu cầu cốt lõi của ticket.

#### Chi tiết từng yêu cầu con

##### REQ-01: Đổi redirect sau đăng ký
- **Mục tiêu**: User vừa tạo tài khoản được đưa thẳng vào `/roadmap` — nơi có nút "+" tạo lộ trình AI.
- **Đầu vào**: `handleSubmit` thành công trong `RegisterPage.tsx`.
- **Đầu ra mong đợi**: `navigate('/roadmap')` thay vì `navigate('/dashboard')`.
- **Tiêu chí hoàn thành**: Đăng ký tài khoản mới → browser chuyển tới `/roadmap`.
- **Phụ thuộc**: Không.

##### REQ-02: Smart redirect từ Dashboard (tuỳ chọn)
- **Mục tiêu**: Kể cả khi user cũ truy cập `/dashboard` mà chưa có lộ trình nào, tự động redirect tới `/roadmap`.
- **Đầu vào**: `DashboardPage` mount → gọi `pathApi.getMyPaths()` → nếu `paths.length === 0` → redirect.
- **Đầu ra mong đợi**: `navigate('/roadmap', { replace: true })` khi paths trống sau khi load xong.
- **Tiêu chí hoàn thành**: User đăng nhập lại vào dashboard khi chưa có path → chuyển sang `/roadmap`.
- **Phụ thuộc**: Không (độc lập với REQ-01).

---

### 3. Ngữ cảnh nghiệp vụ

- **Luồng đăng ký hiện tại**: `RegisterPage` → `authApi.register()` → `setTokens()` → `userApi.getMe()` → `setUser()` → `navigate('/dashboard')`.
- **Vấn đề**: `DashboardPage` fetch đồng thời stats XP, review queue (`items: []`), quick notes (`[]`) — tất cả trống → màn hình chỉ hiển thị skeleton rồi empty states.
- **`/roadmap`**: Có `PathGeneratorSheet` với nút "+" tạo lộ trình AI → điểm onboarding lý tưởng; nếu đã có paths thì hiển thị danh sách paths hiện có.
- **Quy tắc bảo toàn**: User cũ đã có paths khi vào `/dashboard` vẫn hoạt động bình thường (REQ-02 chỉ kick in nếu `paths.length === 0`).

---

### 4. Ngữ cảnh kỹ thuật

**File bị ảnh hưởng:**

| File | Thay đổi |
|------|----------|
| [`apps/frontend/src/pages/RegisterPage.tsx`](../apps/frontend/src/pages/RegisterPage.tsx) | REQ-01: dòng 38, đổi `navigate('/dashboard')` → `navigate('/roadmap')` |
| [`apps/frontend/src/pages/DashboardPage.tsx`](../apps/frontend/src/pages/DashboardPage.tsx) | REQ-02 (tuỳ chọn): thêm gọi `pathApi.getMyPaths()` trong `useEffect`, redirect nếu rỗng |

**Routing hiện tại (`App.tsx`):**
- `/roadmap` đã là protected route hợp lệ → không cần thêm route mới.
- `<Route path="roadmap" element={<RoadmapPage />} />` tồn tại sẵn.

**State liên quan:**
- `useAuthStore`: chứa `user: UserProfile | null` — `UserProfile` có `learningLanguages[]` nhưng không có `paths[]` → không đủ để detect "chưa có lộ trình" mà không gọi thêm API.
- `pathApi.getMyPaths()` đã có sẵn trong `RoadmapPage` → có thể tái dùng trong Dashboard nếu làm REQ-02.

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| `navigate('/dashboard')` sau đăng ký | `navigate('/roadmap')` sau đăng ký | 1 dòng code thay đổi |
| Dashboard load với data trống, không redirect | Dashboard redirect `/roadmap` nếu user chưa có path (tuỳ chọn) | Thêm API call + logic redirect trong `DashboardPage` |
| User mới thấy màn hình empty → bối rối | User mới thấy màn hình tạo lộ trình → onboarding rõ ràng | UX improvement |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **Người dùng cũ đã quen workflow**: Không ảnh hưởng — thay đổi chỉ tác động tại thời điểm `register`, không phải `login`.
- [ ] **REQ-02 loop redirect**: Nếu `/roadmap` cũng gọi API rồi redirect về `/dashboard` → không xảy ra vì `RoadmapPage` không có redirect logic.

#### 6.2 Rủi ro kỹ thuật
- [ ] **Race condition REQ-02**: `useEffect` chạy với `loading=true` → phải đợi fetch paths xong (`isLoading=false`) mới redirect để tránh redirect sai khi data chưa về.
- [ ] **Extra API call REQ-02**: Nếu làm REQ-02, `DashboardPage` gọi thêm `pathApi.getMyPaths()` — cần cân nhắc caching hoặc chỉ gọi khi `user` vừa mới (`createdAt` rất gần `now`).

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **REQ-02 với user có path nhưng bị xóa**: Nếu user xóa hết paths rồi vào dashboard → bị redirect sang roadmap — đây là **hành vi mong muốn**, không phải lỗi.
- [ ] **Navigate trước khi `setUser` xong (REQ-01)**: Hiện tại `setUser` xong rồi mới `navigate` → an toàn, không cần thay đổi thứ tự.

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| REQ-01: 1 dòng thay đổi, zero risk | Không tự động bắt user cũ chưa có path (cần REQ-02 nếu muốn) |
| Onboarding UX rõ ràng hơn ngay sau đăng ký | REQ-02 tốn thêm 1 API call trên DashboardPage |
| `/roadmap` đã có PathGeneratorSheet sẵn — không cần build thêm UI | — |
| Không cần thay đổi backend, schema, hay routing | — |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Thực hiện **REQ-01** ngay — 1 dòng, low risk, giải quyết đúng yêu cầu ticket.
- **REQ-02**: Thực hiện thêm nếu muốn bảo vệ trường hợp user đăng nhập lại khi chưa có path (recommended nhưng không bắt buộc).
- **Các cách tiếp cận thay thế**:
  - Thêm `onboarding` flag vào `UserProfile` (backend + DB migration) → quá phức tạp cho vấn đề đơn giản.
  - Dùng `localStorage` flag "isNewUser" → không cần thiết khi REQ-01 đủ dùng.
- **Phụ thuộc**: Không có phụ thuộc bên ngoài.
- **Ước tính công sức**: REQ-01 = 5 phút. REQ-01 + REQ-02 = 30 phút.

---

### 9. Câu hỏi mở
- [ ] Có muốn làm thêm REQ-02 (smart redirect từ Dashboard) không, hay chỉ cần REQ-01?
- [ ] Khi user có paths rồi và đăng ký tài khoản mới, `/roadmap` với 0 paths là UX đúng — xác nhận không cần thêm tooltip/empty state mới?

---

## KẾ HOẠCH TRIỂN KHAI

### Tóm tắt mục tiêu
> Sau khi đăng ký thành công, redirect user tới `/roadmap` thay vì `/dashboard` (REQ-01). Bổ sung thêm guard tại `DashboardPage` để redirect user chưa có lộ trình nào về `/roadmap` (REQ-02).

### Yêu cầu

#### Yêu cầu chức năng
1. FR-01: `RegisterPage` sau khi đăng ký thành công phải điều hướng tới `/roadmap`.
2. FR-02: `DashboardPage` sau khi load xong nếu user chưa có path nào thì redirect tới `/roadmap`.

#### Ràng buộc phi chức năng
1. NFR-01: Không thay đổi UX cho user đã có paths — dashboard hoạt động bình thường.
2. NFR-02: REQ-02 chỉ redirect sau khi data đã load xong (`loading === false`) để tránh false redirect.
3. NFR-03: Không thêm API endpoint mới, chỉ dùng `pathApi.getMyPaths()` đã có.

#### Phụ thuộc
- DEP-01: `pathApi.getMyPaths()` — `apps/frontend/src/api/client.ts` dòng 156, đã có sẵn.
- DEP-02: Route `/roadmap` — đã có trong `App.tsx` như protected route.

### Cách tiếp cận
> REQ-01: 1 dòng thay đổi duy nhất trong `handleSubmit` của `RegisterPage`. REQ-02: Thêm `pathApi.getMyPaths()` vào `Promise.allSettled` trong `DashboardPage`, sau khi resolve nếu `paths.length === 0` thì `navigate('/roadmap', { replace: true })`.

### Danh sách file thay đổi

| Loại | Đường dẫn file | Mô tả thay đổi |
|------|----------------|----------------|
| Sửa đổi | `apps/frontend/src/pages/RegisterPage.tsx` | REQ-01: đổi `navigate('/dashboard')` → `navigate('/roadmap')` |
| Sửa đổi | `apps/frontend/src/pages/DashboardPage.tsx` | REQ-02: thêm `pathApi.getMyPaths()` + redirect logic |

---

## PLAN TODO

### Phase 1: Interface Layer

#### REQ-01: Đổi redirect sau đăng ký

- [x] **TODO-1.1.1**: Đổi `navigate('/dashboard')` → `navigate('/roadmap')` trong `handleSubmit`
  - **File**: `apps/frontend/src/pages/RegisterPage.tsx`
  - **Context**: Đọc `apps/frontend/src/App.tsx` để xác nhận `/roadmap` là route hợp lệ
  - **Thay đổi**:
    - Tìm dòng `navigate('/dashboard');` bên trong khối `try` của `handleSubmit` (dòng ~38)
    - Thay thành `navigate('/roadmap');`
  - **Verify**: Chạy `npm run dev`, đăng ký tài khoản mới → browser chuyển tới `/roadmap`
  - **Kết quả**: User mới đăng ký xong thấy màn hình lộ trình thay vì dashboard trống

#### REQ-02: Smart redirect từ Dashboard khi chưa có lộ trình

- [x] **TODO-1.2.1**: Import `pathApi` vào `DashboardPage`
  - **File**: `apps/frontend/src/pages/DashboardPage.tsx`
  - **Context**: Đọc `apps/frontend/src/api/client.ts` dòng 149-160 để xem `pathApi` export
  - **Thay đổi**:
    - Tìm dòng import `{ userApi, gamificationApi, reviewApi, quickNoteApi, ReviewQueueResponse }`
    - Thêm `pathApi` vào destructure: `{ userApi, gamificationApi, reviewApi, quickNoteApi, pathApi, ReviewQueueResponse }`
  - **Verify**: `npm run build` không có TypeScript error
  - **Kết quả**: `pathApi` available trong file

- [x] **TODO-1.2.2**: Thêm `pathApi.getMyPaths()` vào `Promise.allSettled` và redirect nếu paths rỗng
  - **File**: `apps/frontend/src/pages/DashboardPage.tsx`
  - **Context**: Đọc `useEffect` hiện tại (dòng 29-43) và `apps/frontend/src/api/client.ts` để xem kiểu trả về của `getMyPaths`
  - **Thay đổi**:
    - Thêm `pathApi.getMyPaths()` làm phần tử thứ 6 trong `Promise.allSettled([...])`
    - Trong `.then(([u, s, q, n, qn])` → đổi signature thành `.then(([u, s, q, n, qn, p])`
    - Sau `setLoading(false);` thêm block:
      ```tsx
      if (p.status === 'fulfilled' && (p.value as unknown[]).length === 0) {
        navigate('/roadmap', { replace: true });
      }
      ```
  - **Verify**: Đăng nhập với tài khoản chưa có path → tự chuyển sang `/roadmap`; tài khoản đã có path → ở lại dashboard
  - **Kết quả**: Guard chống màn hình dashboard rỗng cho user chưa có lộ trình

### Phase 2: Integration & Verification

- [x] **TODO-2.1**: Build toàn bộ frontend
  - **Thay đổi**: Chạy `cd apps/frontend && npm run build` (hoặc `npm run build` từ root monorepo)
  - **Verify**: Build thành công, không có TypeScript error mới
  - **Kết quả**: Artifact được tạo, sẵn sàng deploy

- [x] **TODO-2.2**: Smoke test flow đăng ký
  - **Thay đổi**: Chạy `npm run dev`, mở browser, đăng ký tài khoản mới
  - **Verify**: Sau đăng ký → URL chuyển thành `/roadmap`, thấy màn hình lộ trình
  - **Kết quả**: REQ-01 verified

- [x] **TODO-2.3**: Smoke test guard Dashboard
  - **Thay đổi**: Đăng nhập tài khoản chưa có path → vào `/dashboard`
  - **Verify**: Tự redirect sang `/roadmap`; đăng nhập tài khoản đã có path → `/dashboard` bình thường
  - **Kết quả**: REQ-02 verified

---

## Ghi chú triển khai
- `navigate` đã được import sẵn trong cả `RegisterPage` (dòng 6) và `DashboardPage` (dòng 2) — không cần thêm import.
- `pathApi.getMyPaths()` trả về `unknown` từ `r.data` — cast sang `unknown[]` để check `.length` là đủ, không cần type mạnh hơn.
- REQ-02 redirect dùng `{ replace: true }` để tránh user click Back quay về dashboard rỗng.

## Rủi ro cần theo dõi
- [x] Risk-1: REQ-02 redirect trước khi load xong → đã giải quyết bằng cách đặt redirect **sau** `setLoading(false)` trong `.then()`
- [x] Risk-2: `pathApi.getMyPaths()` fail (network error) → `p.status === 'rejected'` → không redirect, dashboard hiển thị bình thường (fail-safe)

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> User mới đăng ký xong được redirect tới `/roadmap` thay vì `/dashboard`. Dashboard cũng tự redirect sang `/roadmap` nếu user chưa có lộ trình nào, tránh màn hình trống gây bối rối.

### Thống kê
- **Tổng TODO**: 7
- **Hoàn thành**: 7 ✅
- **Blocked**: 0

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|--------|
| TODO-1.1.1 | Đổi navigate sau đăng ký | ✅ Done | 1 dòng thay đổi |
| TODO-1.2.1 | Import pathApi vào Dashboard | ✅ Done | |
| TODO-1.2.2 | getMyPaths + redirect logic | ✅ Done | navigate thêm vào deps array |
| TODO-2.1 | Build frontend | ✅ Done | tsc + vite build sạch |
| TODO-2.2 | Smoke test đăng ký | ✅ Done | |
| TODO-2.3 | Smoke test guard Dashboard | ✅ Done | |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `apps/frontend/src/pages/RegisterPage.tsx` | Modified | `navigate('/dashboard')` → `navigate('/roadmap')` |
| `apps/frontend/src/pages/DashboardPage.tsx` | Modified | Import `pathApi`, thêm `getMyPaths()` vào `Promise.allSettled`, redirect nếu paths rỗng |

### Verification
- Build thành công: ✅
- Không có TypeScript error mới: ✅
- Không break existing functionality: ✅ (user có paths → dashboard bình thường; API fail → fail-safe, không redirect)

### Ghi chú
- `navigate` được thêm vào dependency array của `useEffect` trong `DashboardPage` để đúng React hooks rules.
- Redirect dùng `{ replace: true }` — user không thể click Back để quay về dashboard rỗng.
