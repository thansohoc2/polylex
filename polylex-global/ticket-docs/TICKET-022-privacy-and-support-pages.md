# TICKET-022: Privacy Policy & Support Pages

## Mô tả
Thêm hai trang tĩnh công khai (không yêu cầu đăng nhập) vào ứng dụng:
- **Privacy Policy** tại URL `/privacy`
- **Support** tại URL `/support`

Đây là yêu cầu bắt buộc của Apple App Store và Google Play Store khi ứng dụng thu thập dữ liệu người dùng (đặc biệt khi có Social Login từ TICKET-021).

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-022 |
| **Tiêu đề** | Privacy Policy & Support Pages |
| **Mục tiêu** | Tạo 2 trang tĩnh công khai `/privacy` và `/support` phù hợp với App Store compliance và UX |
| **Phạm vi** | Frontend only (React + React Router + Tailwind) |
| **Độ ưu tiên** | Cao — Apple/Google yêu cầu URL Privacy Policy hợp lệ khi review app có Social Login |

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Tạo PrivacyPolicyPage | Trang tĩnh nội dung Privacy Policy tại `/privacy` | Frontend/Pages | Nhỏ |
| REQ-02 | Tạo SupportPage | Trang tĩnh Support tại `/support` với contact info / email link | Frontend/Pages | Nhỏ |
| REQ-03 | Đăng ký route công khai | Thêm `/privacy` và `/support` vào `App.tsx` ngoài `RequireAuth` | Frontend/Router | Nhỏ |
| REQ-04 | Liên kết từ LoginPage/RegisterPage | Thêm footer link đến `/privacy` và `/support` ở các trang auth | Frontend/Pages | Nhỏ |
| REQ-05 | (Tùy chọn) Liên kết từ ProfilePage | Thêm link "Privacy Policy" và "Support" trong menu cài đặt Profile | Frontend/Pages | Nhỏ |

#### Mối quan hệ phụ thuộc

```
REQ-01 ──┐
         ├──> REQ-03 (tuần tự: phải có component trước khi đăng ký route)
REQ-02 ──┘         │
                   └──> REQ-04 (tuần tự: phải có route trước khi link)
                        REQ-05 (độc lập với REQ-04)
```

#### Chi tiết từng yêu cầu con

##### REQ-01: Tạo PrivacyPolicyPage
- **Mục tiêu**: Component React hiển thị nội dung Privacy Policy đầy đủ
- **Đầu vào**: Không — nội dung tĩnh
- **Đầu ra mong đợi**: Trang `/privacy` load được mà không cần đăng nhập, nội dung hợp lệ cho App Store review
- **Tiêu chí hoàn thành**: Route `/privacy` accessible, responsive, dark theme nhất quán, có nút back về trang trước hoặc `/login`
- **Phụ thuộc**: Không

##### REQ-02: Tạo SupportPage
- **Mục tiêu**: Component React hiển thị thông tin hỗ trợ (email, FAQ cơ bản, link)
- **Đầu vào**: Không — nội dung tĩnh + email liên hệ
- **Đầu ra mong đợi**: Trang `/support` accessible công khai, có cách liên hệ rõ ràng
- **Tiêu chí hoàn thành**: Route `/support` accessible, có ít nhất 1 kênh liên hệ hành động được (mailto: link hoặc form)
- **Phụ thuộc**: Không

##### REQ-03: Đăng ký route công khai
- **Mục tiêu**: Thêm 2 route mới vào `App.tsx` **bên ngoài `<Route element={<RequireAuth />}>`**
- **Đầu vào**: Component `PrivacyPolicyPage` và `SupportPage`
- **Đầu ra mong đợi**: URL `/privacy` và `/support` không redirect về `/login` khi chưa đăng nhập
- **Tiêu chí hoàn thành**: Người dùng chưa đăng nhập truy cập được 2 trang này
- **Phụ thuộc**: REQ-01, REQ-02

##### REQ-04: Liên kết từ LoginPage/RegisterPage
- **Mục tiêu**: Footer của trang login/register có link đến Privacy Policy và Support — cần thiết cho Apple review
- **Đầu vào**: Route đã đăng ký
- **Đầu ra mong đợi**: Link nhỏ ở dưới form: "Privacy Policy · Support"
- **Tiêu chí hoàn thành**: Hai link hiển thị ở LoginPage.tsx và RegisterPage.tsx
- **Phụ thuộc**: REQ-03

##### REQ-05: Liên kết từ ProfilePage (tùy chọn)
- **Mục tiêu**: Người dùng đã đăng nhập cũng có thể truy cập từ Profile
- **Đầu vào**: Route đã đăng ký
- **Đầu ra mong đợi**: Section "About / Legal" trong ProfilePage với link tới `/privacy` và `/support`
- **Tiêu chí hoàn thành**: Link hiển thị đúng trong layout Profile
- **Phụ thuộc**: REQ-03

---

### 3. Ngữ cảnh nghiệp vụ

- **Lý do bắt buộc**: TICKET-021 đã thêm Social Login (Google/Apple). Apple App Store **yêu cầu URL Privacy Policy** trong app metadata khi app dùng Sign In with Apple hoặc thu thập dữ liệu cá nhân. Google Play có yêu cầu tương tự.
- **Người dùng mục tiêu**: Người dùng mới chưa đăng nhập (xem trước khi sign up) + người dùng đã đăng nhập (truy cập từ Profile).
- **Luồng liên quan**: Trang auth (LoginPage, RegisterPage) → link footer → PrivacyPolicyPage / SupportPage.
- **Hành vi cần bảo toàn**: Không ảnh hưởng đến `RequireAuth` guard — 2 trang mới hoàn toàn public.
- **Nội dung Privacy Policy**: Cần mô tả dữ liệu thu thập (email, tên, ngôn ngữ học, OAuth tokens), mục đích sử dụng, third-party services (Google/Apple OAuth, Asterisk nếu có TTS), quyền xóa dữ liệu của user.

---

### 4. Ngữ cảnh kỹ thuật

**Stack hiện tại:**
- React 18 + React Router v6 (BrowserRouter)
- Tailwind CSS v4 + dark theme (`bg-[#0F0F1A]`, `text-[#F1F5F9]`, `text-[#94A3B8]`, `bg-[#1A1A2E]`)
- i18n: `react-i18next` (xem xét có nên dịch nội dung tĩnh không — khuyến nghị: nội dung English-only cho pages pháp lý)
- Capacitor 8 (iOS/Android) — cùng web bundle

**File bị ảnh hưởng:**

| File | Thay đổi |
|------|---------|
| `apps/frontend/src/App.tsx` | Thêm 2 public route + import 2 page mới |
| `apps/frontend/src/pages/PrivacyPolicyPage.tsx` | Tạo mới |
| `apps/frontend/src/pages/SupportPage.tsx` | Tạo mới |
| `apps/frontend/src/pages/LoginPage.tsx` | Thêm footer links |
| `apps/frontend/src/pages/RegisterPage.tsx` | Thêm footer links |
| `apps/frontend/src/pages/ProfilePage.tsx` | Thêm section Legal (tùy chọn REQ-05) |

**Không có thay đổi backend** — toàn bộ là static content frontend.

**Routing pattern hiện tại trong `App.tsx`:**
```tsx
// Public
<Route path="/login" element={<LoginPage />} />
<Route path="/register" element={<RegisterPage />} />

// Protected (RequireAuth)
<Route element={<RequireAuth />}>
  ...
</Route>

// Fallback
<Route path="*" element={<Navigate to="/dashboard" replace />} />
```
→ Cần thêm `/privacy` và `/support` vào khu vực Public, **trước** fallback `*`.

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| Không có URL privacy policy | `/privacy` accessible công khai | Tạo `PrivacyPolicyPage.tsx` + route |
| Không có trang hỗ trợ | `/support` accessible công khai | Tạo `SupportPage.tsx` + route |
| LoginPage không có link pháp lý | Footer có link Privacy · Support | Sửa `LoginPage.tsx` |
| RegisterPage không có link pháp lý | Footer có link Privacy · Support | Sửa `RegisterPage.tsx` |
| ProfilePage không có mục Legal | Section "Legal" với 2 link | Sửa `ProfilePage.tsx` (optional) |
| Fallback `*` → `/dashboard` | Fallback vẫn như cũ | Không thay đổi |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ
- [ ] **App Store rejection**: Nếu không có Privacy Policy URL hợp lệ trước khi submit — **Giảm thiểu**: Triển khai ticket này trước khi submit app lên store.
- [ ] **Nội dung Privacy Policy không đầy đủ**: Apple/Google có thể từ chối nếu thiếu thông tin bắt buộc (third-party sharing, data retention) — **Giảm thiểu**: Soạn nội dung theo template GDPR/CCPA chuẩn, đề cập đủ: Google Sign-In, Apple Sign-In, dữ liệu lưu trữ.
- [ ] **URL thay đổi sau deploy**: Nếu domain thay đổi, URL submit lên Apple/Google cũng phải cập nhật — **Giảm thiểu**: Dùng path-based `/privacy` không hardcode domain.

#### 6.2 Rủi ro kỹ thuật
- [ ] **Route `/privacy` bị intercept bởi fallback `*`**: Nếu route được thêm **sau** fallback — **Giảm thiểu**: Đảm bảo route public thêm **trước** `<Route path="*" ...>`.
- [ ] **Capacitor deep link conflict**: Trên iOS/Android, Capacitor dùng custom scheme (`capacitor://`); `/privacy` là web URL — **Giảm thiểu**: Không cần xử lý thêm vì đây là internal route, không phải external deep link.
- [ ] **SEO/Meta tags**: Privacy Policy nên có proper title — **Giảm thiểu**: Dùng `document.title` effect hoặc React Helmet nếu cần SEO.

#### 6.3 Lỗi logic tiềm ẩn
- [ ] **RequireAuth bao phủ `/privacy`**: Nếu vô tình đặt route trong protected block, user chưa login sẽ bị redirect — **Phòng tránh**: Kiểm tra kỹ vị trí route trong `App.tsx`.
- [ ] **Fallback `*` → `/dashboard` che `/privacy`**: Nếu route order sai — **Phòng tránh**: Đặt public routes trước wildcard.
- [ ] **Link trong LoginPage dùng `<a href>` thay vì `<Link to>`**: Sẽ trigger full page reload — **Phòng tránh**: Dùng `react-router-dom` `<Link>` component.

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Giải pháp đơn giản, không cần backend | Nội dung Privacy Policy cần được soạn thảo cẩn thận (pháp lý) |
| Không ảnh hưởng code đã có | Nội dung tĩnh — cần cập nhật thủ công khi policy thay đổi |
| Đáp ứng ngay yêu cầu App Store review | Support page tĩnh không capture lead/ticket (nếu cần form phải thêm công việc) |
| Nhất quán với dark theme hiện có | |
| Zero backend changes | |

---

### 8. Khuyến nghị

- **Cách tiếp cận khuyến nghị**: Trang tĩnh React component thuần — nội dung hardcode trong JSX (không dùng i18n cho trang pháp lý, giữ 1 ngôn ngữ là tiếng Anh để tránh phức tạp dịch thuật pháp lý). Layout đơn giản: hero header nhỏ + scrollable content + back button.
- **Template nội dung**: Dùng template Privacy Policy chuẩn phù hợp GDPR, đề cập: data collected (email, name, OAuth tokens, learning analytics), purpose, retention period, third-parties (Google OAuth, Apple Sign-In), user rights (deletion via Support).
- **Support page**: Contact form đơn giản với `mailto:` link hoặc `<a href="mailto:support@polylex.app">` — đủ cho App Store. Có thể thêm FAQ cơ bản.
- **URL cho Support**: Đề xuất `/support` (đồng nhất với `/privacy`).
- **Các cách tiếp cận thay thế**:
  - Dùng trang ngoài (Notion, Carrd) → không khuyến nghị vì phụ thuộc bên ngoài và không nhất quán UX
  - Dùng CMS headless → overkill cho static legal pages
- **Phụ thuộc**: Không có dependency kỹ thuật từ ticket khác. Cần nội dung thực tế của Privacy Policy (email liên hệ, tên công ty/developer).
- **Ước tính công sức**: ~2–3 giờ (bao gồm soạn nội dung Privacy Policy cơ bản)

---

### 9. Câu hỏi mở

- [ ] **Email hỗ trợ**: Địa chỉ email liên hệ support là gì? (cần hardcode vào SupportPage)
- [ ] **Tên công ty/developer**: Cần điền vào Privacy Policy ("PolyLex" hay tên pháp nhân khác?)
- [ ] **Support page có cần contact form** (input fields + submit) hay chỉ cần `mailto:` link là đủ?
- [ ] **URL sẽ submit lên Apple/Google**: Sẽ là `https://<domain>/privacy` — domain production là gì? (dùng để submit, không ảnh hưởng code)
- [ ] **ProfilePage REQ-05**: Có muốn thêm link Privacy/Support trong ProfilePage không, hay chỉ cần ở LoginPage/RegisterPage?
