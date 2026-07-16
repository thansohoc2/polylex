# TICKET-050: Chuẩn hóa thiết kế Web-first

**Status:** 🟡 Proposed — Analysis updated, ready for planning  
**Priority:** 🔥 P0 — Web design foundation and quality gate  
**Platforms:** Web frontend only  
**Created:** July 14, 2026  
**Updated:** July 14, 2026 — thu hẹp phạm vi, bỏ qua Zalo và native trong giai đoạn này  
**Type:** Design System / UX Consistency / Accessibility / Web Quality  
**Related:** TICKET-005, TICKET-029, TICKET-033, TICKET-034, TICKET-035 (Design System Refresh), TICKET-048

---

## Yêu cầu gốc

Chuẩn hóa các điểm cần đồng bộ để phiên bản **PolyLex Web** đáp ứng một tiêu chuẩn thiết kế phần mềm thống nhất. Phạm vi gồm giao diện trực quan, design tokens, component, trạng thái UX, navigation, accessibility, i18n và cơ chế kiểm soát chất lượng trên Web.

Ticket kế thừa nền tảng **Playful Light** của TICKET-035 và tập trung hoàn thiện Web trước khi xem xét áp dụng cho nền tảng khác.

### Quyết định phạm vi

- **Trong phạm vi:** `apps/frontend`, các UI primitive cần thiết trong `packages/shared-ui`, i18n Web, kiểm thử và CI phục vụ Web.
- **Ngoài phạm vi:** Zalo Mini App, ZMP/Zalo Design System, Zalo auth, Zalo build/deploy, Zalo shell, native iOS/Android/Capacitor và đồng bộ UI đa nền tảng.
- Không sửa file trong `apps/zalo-miniapp` ở ticket này.
- Không bắt buộc component mới phải được tích hợp hoặc kiểm chứng trên Zalo.
- Việc chuẩn hóa Zalo/native sẽ được phân tích bằng ticket riêng sau khi Web ổn định.

> Ticket hiện chỉ chứa phân tích. Chưa triển khai code trong giai đoạn này.

---

## PHÂN TÍCH TICKET

### 1. Tóm tắt yêu cầu

| Trường | Giá trị |
|--------|---------|
| **Mã Ticket** | TICKET-050 |
| **Tiêu đề** | Chuẩn hóa thiết kế Web-first |
| **Mục tiêu** | Thiết lập một nguồn chuẩn duy nhất cho design tokens, UI primitives, UX states, navigation, accessibility và i18n của PolyLex Web; loại bỏ sự pha trộn giữa Indigo Night cũ và Playful Light mới |
| **Phạm vi** | `apps/frontend`, phần UI dùng cho Web trong `packages/shared-ui`, cấu hình test/lint/CI và tài liệu thiết kế Web |
| **Ngoài phạm vi** | Zalo Mini App, Capacitor/native, platform shell, đồng bộ hành vi đa nền tảng và thay đổi backend không trực tiếp phục vụ lỗi UX Web |
| **Độ ưu tiên** | Khẩn cấp/P0 — hoàn thành trước khi tiếp tục mở rộng nhiều màn hình Web mới |
| **Độ phức tạp tổng thể** | Lớn — nên chia migration theo luồng người dùng |
| **Ràng buộc** | Bảo toàn đăng nhập/demo, onboarding, vocabulary, roadmap, review, quick note, dialogue, video, analytics, leaderboard và profile trên Web |
| **Tiêu chí thành công cấp cao** | Một hệ Playful Light chính thức; component nền dùng chung; không còn token thiếu; giảm mạnh hard-code; UX states nhất quán; WCAG 2.2 AA; i18n đầy đủ; visual/E2E checks cho Web |

#### Giả định phân tích

- **Playful Light** là định hướng thương hiệu mặc định của Web.
- Dark mode hoàn chỉnh chưa nằm trong phạm vi; kiến trúc token không được chặn khả năng bổ sung sau.
- Desktop và mobile Web dùng cùng feature/UI system, được đáp ứng bằng responsive design.
- `packages/shared-ui` có thể chứa primitive dùng cho Web, nhưng không cần cam kết tương thích Zalo/native trong ticket này.
- Backend dùng **NestJS + Prisma + PostgreSQL**; ticket không thay đổi thuật toán ACRE hoặc schema nghiệp vụ.

---

### 2. Phân rã yêu cầu

#### Danh sách yêu cầu con

| Mã | Tên yêu cầu | Mô tả | Phạm vi | Độ phức tạp |
|----|-------------|-------|---------|-------------|
| REQ-01 | Chốt Web design governance | Chốt Playful Light, responsive matrix, quy tắc ngoại lệ và owner duyệt thay đổi | Product/Web | Nhỏ |
| REQ-02 | Chuẩn hóa semantic design tokens | Tạo nguồn token duy nhất cho màu, typography, spacing, radius, elevation, motion và breakpoint | CSS/Shared UI | Lớn |
| REQ-03 | Hợp nhất Web UI primitives | Chuẩn hóa button, form controls, card, dialog, bottom sheet, feedback và state components | Shared UI/Frontend | Lớn |
| REQ-04 | Di trú giao diện Web legacy | Chuyển các màn Indigo Night, màu hard-code, inline styling và token sai/thiếu sang Playful Light | Frontend | Lớn |
| REQ-05 | Chuẩn hóa Web navigation | Chốt primary destinations, secondary routes, back behavior và review immersive mode | UX/Frontend | Trung bình |
| REQ-06 | Chuẩn hóa form và trạng thái UX | Thống nhất validation, loading, empty, error, retry, offline, session expiry và AI-processing | Shared UI/Frontend | Lớn |
| REQ-07 | Chuẩn hóa accessibility | Áp dụng WCAG 2.2 AA, keyboard/focus, touch target, dialog semantics, live region và reduced motion | Frontend/Shared UI | Trung bình |
| REQ-08 | Đồng bộ i18n và content design | Loại bỏ chuỗi hard-code; đồng bộ en/vi/pt, thuật ngữ và tone of voice | Frontend/i18n | Trung bình |
| REQ-09 | Thiết lập kiểm soát chất lượng Web UI | Reference gallery/Storybook, visual regression, accessibility tests, responsive matrix và Web E2E | Testing/CI | Lớn |
| REQ-10 | Tài liệu hóa và enforcement | Viết chuẩn sử dụng, Definition of Done và lint/CI rules chống design drift | Documentation/CI | Trung bình |

#### Mối quan hệ phụ thuộc

```text
REQ-01 ──> REQ-02 ──> REQ-03 ──> REQ-04
                       │          │
                       └──────> REQ-06 ──> REQ-07

REQ-01 ──────────────> REQ-05
REQ-01 + REQ-02 ─────> REQ-08

REQ-03 + REQ-04 + REQ-05 + REQ-06 + REQ-07 + REQ-08
    └────────────────────────────────────────────────> REQ-09 ──> REQ-10
```

- REQ-01 phải hoàn thành trước các quyết định visual và navigation.
- REQ-02 là nền tảng của component và migration.
- REQ-05 và REQ-08 có thể triển khai song song với REQ-03.
- REQ-09 được thiết lập sớm ở mức framework, nhưng baseline chỉ chốt sau khi các màn tham chiếu ổn định.

#### Chi tiết từng yêu cầu con

##### REQ-01: Chốt Web design governance

- **Mục tiêu**: Có quyết định chính thức về theme, responsive targets, ngoại lệ và quyền phê duyệt design system.
- **Đầu vào**: TICKET-035 Playful Light, Web UI hiện tại và danh sách route/feature.
- **Đầu ra mong đợi**:
  - Playful Light là default theme của Web.
  - Dark mode được ghi rõ là deferred hoặc tách ticket.
  - Viewport kiểm thử tối thiểu: 320, 375, 430 px, tablet và desktop.
  - Danh sách ngoại lệ cho provider colors và media overlays.
- **Tiêu chí hoàn thành**: Có tài liệu quyết định được product/design/engineering thống nhất.
- **Phụ thuộc**: Không.

##### REQ-02: Chuẩn hóa semantic design tokens

- **Mục tiêu**: Mọi Web component sử dụng một nguồn token semantic, không phụ thuộc trực tiếp tên màu.
- **Đầu vào**:
  - Token Indigo Night: `surface`, `primary`, `accent`, `text-*`.
  - Token Playful Light: `canvas`, `card`, `coral`, `grape`, `ink-*`.
  - Các mã hex/rgba và CSS variable đang rải rác.
- **Đầu ra mong đợi**:
  - Token cho surface, text, action, border, feedback, gamification, elevation, typography, spacing, radius, motion và breakpoint.
  - Compatibility aliases trong giai đoạn migration.
  - Không còn token dùng nhưng chưa khai báo như `--color-ink-soft`.
- **Tiêu chí hoàn thành**:
  - Frontend và Web shared components cùng import một nguồn token.
  - Có static check phát hiện token undefined.
  - Không dùng `red-*` để đại diện body/muted text.
  - Cặp màu chính đạt WCAG AA.
- **Phụ thuộc**: REQ-01.

##### REQ-03: Hợp nhất Web UI primitives

- **Mục tiêu**: Loại bỏ việc mỗi màn hình tự định nghĩa button, input, select, modal, toast và loading state.
- **Đầu vào**: `apps/frontend/src/components/ui/*`, Web-relevant components trong `packages/shared-ui`, và native elements/style lặp lại.
- **Đầu ra mong đợi**:
  - `Button`, `IconButton`, `Card`, `TextField`, `TextArea`, `Select`, `Checkbox`, `Switch`, `Chip`, `Badge`, `Progress`, `SearchField`, `Dialog`, `BottomSheet`, `Toast`, `Skeleton`, `Spinner`, `EmptyState`, `ErrorState`.
  - Mỗi primitive có default, hover, active, focus-visible, disabled, loading và error state phù hợp.
- **Tiêu chí hoàn thành**:
  - Page/feature không tạo lại primitive khi đã có component chuẩn.
  - Components có typed props, accessibility semantics và unit tests.
  - Có reference gallery hoặc Storybook stories cho Web.
- **Phụ thuộc**: REQ-02.

##### REQ-04: Di trú giao diện Web legacy

- **Mục tiêu**: Đưa toàn bộ Web journey vào cùng visual language, loại bỏ sự pha trộn Indigo Night/Playful Light.
- **Đầu vào**:
  - Login, register, onboarding, privacy và support còn dùng dark/hard-code.
  - Review components và pages còn nhiều mã hex, rgba và inline style.
  - `AppShell` mặc định dark trong khi phần lớn app pages truyền `theme="light"`.
- **Đầu ra mong đợi**:
  - Theme được xác định ở Web root/shell thay vì từng page.
  - Authentication, onboarding và legal/support theo Playful Light.
  - Review components dùng semantic token/component chuẩn.
- **Tiêu chí hoàn thành**:
  - Không có màn hình vô tình rơi về dark theme.
  - Hard-coded colors về 0 ngoài ngoại lệ đã duyệt.
  - Không còn token thiếu hoặc token sai ngữ nghĩa.
  - Không có visual regression ở critical journeys.
- **Phụ thuộc**: REQ-02, REQ-03.

##### REQ-05: Chuẩn hóa Web navigation

- **Mục tiêu**: Người dùng hiểu vị trí hiện tại và có hành vi điều hướng nhất quán trên mobile/desktop Web.
- **Đầu vào**:
  - Bottom navigation hiện có Home, Roadmap, Videos, Review, Profile.
  - Vocabulary, Quick Notes, Analytics, Leaderboard và Dialogue là secondary routes.
  - Review có nhiều route/filter/path context.
- **Đầu ra mong đợi**:
  - Tối đa năm primary destinations có lý do sản phẩm rõ ràng.
  - Quy tắc hiển thị/ẩn navigation trong review, onboarding và modal flow.
  - Browser back/deep-link behavior.
  - Desktop navigation adaptation không làm thay đổi information architecture.
- **Tiêu chí hoàn thành**:
  - Không có route bị mồ côi hoặc chỉ tiếp cận bằng URL.
  - Tab state được giữ đúng.
  - Review session không bị thoát ngoài ý muốn.
  - Back/deep link có acceptance tests.
- **Phụ thuộc**: REQ-01.

##### REQ-06: Chuẩn hóa form và trạng thái UX

- **Mục tiêu**: Mọi Web flow có cùng cách xử lý input, validation, loading, empty, error và recovery.
- **Đầu vào**: Login/register/onboarding/add-word/quick-note/profile forms; `react-hot-toast`, shared `ErrorToast`, inline errors và các loading patterns khác nhau.
- **Đầu ra mong đợi**:
  - `FormField` contract: label, required, helper, error, `aria-describedby`, `aria-invalid`.
  - Pattern cho initial loading, action loading, empty, retryable error, offline, token expiry và AI background processing.
  - Error mapping dựa trên code/typed contract thay vì so sánh chuỗi message nếu backend đã hỗ trợ.
- **Tiêu chí hoàn thành**:
  - Submit lỗi focus field lỗi đầu tiên.
  - Không dùng placeholder thay label.
  - Không nuốt lỗi bằng `.catch(() => {})` ở user-facing flow.
  - Retry và session-expiry behavior nhất quán.
- **Phụ thuộc**: REQ-02, REQ-03.

##### REQ-07: Chuẩn hóa accessibility

- **Mục tiêu**: Đạt WCAG 2.2 AA cho critical Web journeys.
- **Đầu vào**: `aria-label` hiện có, modal/bottom sheet, audio controls, review exercises, animation và touch interactions.
- **Đầu ra mong đợi**:
  - Body text tối thiểu 4.5:1; text lớn/UI graphics tối thiểu 3:1 theo tiêu chuẩn áp dụng.
  - Touch target tối thiểu 44×44 px.
  - Focus-visible, keyboard order, dialog focus trap/restore.
  - `aria-live` cho toast, validation và review feedback.
  - Không chỉ dùng màu để biểu diễn đúng/sai.
  - `prefers-reduced-motion` cho transition/confetti/loop animation.
- **Tiêu chí hoàn thành**:
  - Automated accessibility checks không có lỗi nghiêm trọng.
  - Critical journeys dùng được bằng keyboard và screen reader cơ bản.
  - Audio exercise có instruction/text alternative phù hợp.
- **Phụ thuộc**: REQ-03, REQ-06.

##### REQ-08: Đồng bộ i18n và content design

- **Mục tiêu**: Toàn bộ nội dung Web, accessible labels và thông báo dùng một hệ thuật ngữ nhất quán.
- **Đầu vào**: Locale `en`, `vi`, `pt` và chuỗi hard-code trong pages/components.
- **Đầu ra mong đợi**:
  - Key parity en/vi/pt.
  - Glossary cho “ôn tập”, “lộ trình”, “độ ghi nhớ”, “từ thành thạo”, “chuỗi” và “XP”.
  - Tone of voice ngắn, khích lệ, không trách người học.
- **Tiêu chí hoàn thành**:
  - 100% user-facing strings và accessible labels qua i18n, trừ legal/provider strings bắt buộc.
  - CI phát hiện missing keys hoặc lệch key giữa locale.
  - Fallback locale được xác định.
- **Phụ thuộc**: REQ-01; có thể chạy song song REQ-03.

##### REQ-09: Thiết lập kiểm soát chất lượng Web UI

- **Mục tiêu**: Phát hiện design drift và lỗi responsive/accessibility trước khi release Web.
- **Đầu vào**: Shared UI tests hiện có, frontend unit tests và Web build.
- **Đầu ra mong đợi**:
  - Storybook hoặc reference gallery cho token/component/state.
  - Visual regression ở 320, 375, 430 px, tablet và desktop.
  - Accessibility tests và Web E2E cho critical journeys.
- **Tiêu chí hoàn thành**:
  - Critical journeys: demo/login → onboarding → path/vocabulary → review → lưu tiến độ.
  - Screenshot baselines cho components và north-star screens.
  - CI chặn token undefined, missing i18n, accessibility nghiêm trọng và Web build fail.
- **Phụ thuộc**: REQ-03 đến REQ-08.

##### REQ-10: Tài liệu hóa và enforcement

- **Mục tiêu**: Biến tiêu chuẩn Web thành quy trình duy trì được, không chỉ là một lần redesign.
- **Đầu vào**: Kết quả REQ-01 đến REQ-09.
- **Đầu ra mong đợi**:
  - Design-system README: token reference, component usage, responsive rules và anti-pattern.
  - Definition of Done cho mọi Web screen mới.
  - Ownership/review rule.
  - Lint/CI rule chống mã màu hard-code, token undefined và missing i18n.
- **Tiêu chí hoàn thành**:
  - Developer mới có thể xây Web screen đúng chuẩn mà không sao chép style từ page khác.
  - Pull request template yêu cầu design/accessibility/responsive verification.
  - Ngoại lệ phải được document và phê duyệt.
- **Phụ thuộc**: REQ-09.

---

### 3. Ngữ cảnh nghiệp vụ

#### 3.1 Luồng nghiệp vụ Web liên quan

1. Người dùng vào Web qua demo, email hoặc social login.
2. Chọn ngôn ngữ mẹ đẻ, ngôn ngữ mục tiêu, CEFR và mục tiêu học.
3. Tạo hoặc tham gia learning path.
4. Thêm từ qua vocabulary hoặc quick note AI.
5. Ôn tập qua flashcard, type answer, listening, context, reverse, multiple choice và shadowing.
6. Theo dõi memory strength, daily goal, XP, streak, badge, analytics và leaderboard.
7. Dùng dialogue/video để học theo ngữ cảnh.

Thiết kế không nhất quán ở onboarding, review và completion feedback có thể làm giảm activation và retention. Ticket chỉ chuẩn hóa cách trình bày/tương tác Web, không thay đổi semantics nghiệp vụ.

#### 3.2 Thực thể domain liên quan

- `User`, `LearningPath`, `PathTemplate`, `PathStage`, `UserPath`.
- `VocabularyBase`, `VocabularyTranslation`, `UserVocabulary`, `QuickNote`.
- `ReviewHistory`, `UserStreak`, `UserBadge`, `SkillScore`.

#### 3.3 Hành vi cần bảo toàn

- Guest/demo phải vào được trải nghiệm mà không bị chặn bởi login.
- Submit review giữ nguyên ACRE và dữ liệu response time/confidence.
- Review theo path và review tổng giữ đúng queue/context.
- Quick note AI không mất kết quả khi đổi màn hình.
- Primary language, timezone, daily goal và reminder giữ nguyên semantics.

---

### 4. Ngữ cảnh kỹ thuật

#### 4.1 Triển khai hiện tại

- Frontend Web: React 19, Vite, Tailwind CSS 4, Zustand, React Router, i18next và Framer Motion.
- Shared packages: `@polylex/shared-types`, `@polylex/shared-ui`.
- Backend: NestJS, Prisma, PostgreSQL và Redis.

#### 4.2 Design tokens và theme

- `apps/frontend/src/index.css` chứa đồng thời token Indigo Night legacy và Playful Light.
- Base `html/body/#root` vẫn dùng nền/text tối.
- `AppShell` có `theme?: 'dark' | 'light'`, mặc định `dark`; phần lớn app pages truyền `theme="light"`.
- Login, register, onboarding, privacy và support vẫn dùng nhiều lớp/mã màu dark hard-code.
- `--color-ink-soft` được sử dụng nhưng chưa khai báo trong bộ token hiện tại.
- Nhiều review components dùng `--color-red-*` làm text token và tự ghép màu qua `light` boolean.

#### 4.3 Shared UI hiện tại

`packages/shared-ui` chủ yếu gồm `SocialLoginButton`, `ErrorToast`, `LoadingSpinner`, `AuthGuard` và hooks auth/API. Primitive Playful Light như `Button`, `Card`, `Badge`, `Chip`, `ProgressBar`, `SearchBar` và `SkeletonCard` vẫn nằm riêng ở frontend.

Trong ticket này chỉ hợp nhất những primitive phục vụ Web. Không sửa hoặc kiểm chứng Zalo consumer.

#### 4.4 File/module dự kiến bị ảnh hưởng

**Frontend Web**

- `polylex-global/apps/frontend/src/index.css`.
- `polylex-global/apps/frontend/src/App.tsx`.
- `polylex-global/apps/frontend/src/components/ui/**`.
- `polylex-global/apps/frontend/src/components/layout/**`.
- `polylex-global/apps/frontend/src/components/review/**`.
- `polylex-global/apps/frontend/src/components/quick-note/**`.
- `polylex-global/apps/frontend/src/components/vocab/**`.
- `polylex-global/apps/frontend/src/components/roadmap/**`.
- `polylex-global/apps/frontend/src/pages/**`.
- `polylex-global/apps/frontend/src/i18n/**`.

**Shared UI cho Web**

- `polylex-global/packages/shared-ui/src/**` khi primitive cần dùng chung trong Web app.

**Quality/configuration**

- Workspace scripts, ESLint/style checks, CI workflows và Storybook/visual test config nếu được chọn.

#### 4.5 Backend và database

- Không dự kiến thay đổi schema/migration.
- Nếu Web UX cần error code hoặc idempotency chưa có, phải tạo follow-up backend ticket thay vì mở rộng âm thầm TICKET-050.
- Không có Socket.IO, gateway communication hoặc email trong phạm vi.

---

### 5. Phân tích khoảng cách

| Trạng thái hiện tại | Trạng thái mong muốn | Khoảng cách |
|---------------------|----------------------|-------------|
| Token legacy và Playful Light cùng tồn tại | Một nguồn semantic token có compatibility plan | Còn token trùng, sai hoặc thiếu |
| Base Web vẫn dark, pages truyền `theme="light"` thủ công | Theme xác định ở root/provider | Page mới có thể vô tình trở về dark |
| Login/register/onboarding/legal vẫn dark | Toàn bộ Web journey theo Playful Light | Activation journey không đồng bộ app chính |
| Nhiều mã hex/rgba/inline style | Components dùng token và variant chuẩn | Khó đổi theme và kiểm tra contrast |
| Frontend primitives và shared-ui tách rời | Một Web component source of truth | Trùng trách nhiệm và code lặp |
| Nhiều native button/input/select trực tiếp | Primitive chuẩn với states/accessibility | Interaction và validation không nhất quán |
| Loading/error/empty xử lý khác nhau | State patterns thống nhất | Feedback và recovery không nhất quán |
| Có một số aria-label nhưng chưa có policy | WCAG 2.2 AA và automated checks | Thiếu focus/dialog/live-region/reduced-motion coverage |
| Nhiều chuỗi hard-code | User-facing/accessibility strings qua i18n | Locale và tone of voice có thể lệch |
| Ít visual/E2E tests | CI có visual, a11y, responsive và critical Web E2E | Design drift phát hiện thủ công |

---

### 6. Đánh giá rủi ro

#### 6.1 Rủi ro nghiệp vụ

- [ ] **Redesign làm thay đổi hành vi học:** Migration review UI có thể vô tình đổi rating, confidence hoặc submit timing. **Giảm thiểu:** khóa business semantics bằng integration/E2E tests trước migration.
- [ ] **Phạm vi vẫn lớn:** Design, accessibility, i18n và test chạm nhiều feature. **Giảm thiểu:** migration theo journey, không một pull request lớn.
- [ ] **Người dùng mất thói quen:** Đổi navigation/CTA có thể giảm completion. **Giảm thiểu:** usability test, analytics baseline và rollout có kiểm soát.
- [ ] **Dark mode kỳ vọng nhưng chưa có:** Loại bỏ dark visual có thể bị coi là regression. **Giảm thiểu:** chốt rõ dark mode deferred và giữ kiến trúc token mở rộng được.

#### 6.2 Rủi ro kỹ thuật

- [ ] **CSS cascade/specificity xung đột:** Tailwind utilities và shared CSS có thể ghi đè nhau. **Giảm thiểu:** CSS layer, semantic tokens và visual tests.
- [ ] **Migration token làm vỡ màn cũ:** Xóa token legacy quá sớm gây mất style. **Giảm thiểu:** compatibility aliases và migration theo feature.
- [ ] **Shared component API quá tổng quát:** Component khó dùng và nhiều conditional props. **Giảm thiểu:** ưu tiên composable Web primitives, không cố hỗ trợ nền tảng ngoài scope.
- [ ] **Font ngoài không ổn định:** Google Fonts có thể chậm hoặc bị chặn. **Giảm thiểu:** cân nhắc self-host và kiểm tra fallback.
- [ ] **Visual tests flaky:** Animation/font/rendering khác môi trường. **Giảm thiểu:** khóa viewport/font/time và disable animation trong test.
- [ ] **CSS compatibility:** `color-mix()` hoặc backdrop filter có thể không phù hợp browser support target. **Giảm thiểu:** chốt browser matrix và fallback.

#### 6.3 Lỗi logic tiềm ẩn

- [ ] **Theme fallback sai:** Page không truyền `theme` trở về dark. **Phòng tránh:** theme tại root/provider.
- [ ] **Token undefined:** `--color-ink-soft` được dùng nhưng chưa khai báo. **Phòng tránh:** static token validation.
- [ ] **Semantic text dùng màu feedback:** `red-*` đang được dùng cho primary/muted text. **Phòng tránh:** dùng `text-primary/secondary/muted`.
- [ ] **Nhiều error presentation cùng xuất hiện:** `react-hot-toast`, shared toast và inline error có thể trùng. **Phòng tránh:** error presentation matrix và một toast service.
- [ ] **Retry tạo dữ liệu trùng:** Review/quick-note retry sau timeout có thể submit lại. **Phòng tránh:** disabled/loading chuẩn; tách backend idempotency ticket nếu cần.
- [ ] **Modal không trả focus:** Keyboard user mất vị trí sau khi đóng. **Phòng tránh:** shared dialog quản lý focus lifecycle.
- [ ] **Bottom nav che nội dung/FAB:** Mobile browser viewport và safe-area khác nhau. **Phòng tránh:** CSS env insets và viewport tests.

---

### 7. Ưu điểm và Nhược điểm

| Ưu điểm | Nhược điểm |
|---------|------------|
| Web-first làm giảm đáng kể phạm vi và thời gian đưa chuẩn vào sử dụng | Zalo/native tiếp tục có thể lệch trong thời gian chờ ticket riêng |
| Một nguồn token/component giảm code lặp và design drift trên Web | Migration vẫn chạm nhiều pages/components |
| Trải nghiệm từ onboarding đến review nhất quán hơn | Có nguy cơ visual regression nếu chuyển quá nhanh |
| Accessibility được giải quyết tại primitive thay vì từng page | Cần đầu tư test và review discipline |
| Visual/E2E quality gates làm Web release đáng tin cậy | CI chậm hơn và cần quản lý baselines |
| Không phải giải quyết platform adapters trong cùng ticket | Component API chưa được chứng minh cho nền tảng khác |

---

### 8. Khuyến nghị

#### 8.1 Cách tiếp cận khuyến nghị

Triển khai theo bốn phase Web-only:

**Phase A — Quyết định và nền tảng**

1. Chốt REQ-01: Playful Light, responsive/browser matrix và dark mode deferred.
2. Hoàn thành REQ-02: semantic tokens, compatibility aliases và token validation.

**Phase B — Component và UX contracts**

1. Hợp nhất primitives theo REQ-03.
2. Xây form/state patterns theo REQ-06.
3. Tích hợp accessibility theo REQ-07 ngay trong primitives.
4. Có reference gallery/Storybook trước migration pages.

**Phase C — Migration Web journeys**

1. Auth + onboarding trước vì ảnh hưởng activation.
2. Review components tiếp theo vì là core learning journey.
3. Dashboard, vocabulary, roadmap, quick note, profile, analytics, leaderboard, dialogue, video và legal/support.
4. Chốt navigation REQ-05 và i18n REQ-08 theo từng journey.

**Phase D — Quality gate và governance**

1. Visual/a11y/responsive/Web E2E matrix.
2. Lint/CI chống token undefined, hard-code ngoài ngoại lệ và missing i18n.
3. Design-system guide, Definition of Done và PR checklist.

#### 8.2 Các cách tiếp cận thay thế

1. **Big-bang chuyển toàn bộ Web sang Playful Light**
   - Ưu: kết thúc nhanh trạng thái hai theme.
   - Nhược: PR lớn, khó review/rollback và visual regression cao.
   - Không khuyến nghị.

2. **Chỉ sửa màu, không hợp nhất component**
   - Ưu: effort thấp.
   - Nhược: vấn đề hard-code, accessibility và state inconsistency sẽ tái diễn.
   - Không đủ để đạt mục tiêu.

3. **Xây component library trước nhưng chưa migration page**
   - Ưu: nền tảng sạch.
   - Nhược: chưa tạo giá trị người dùng và dễ thiết kế component xa nhu cầu thực tế.
   - Chỉ nên dùng cùng hai Web reference journeys.

#### 8.3 Phụ thuộc

- TICKET-035 đã cung cấp nền tảng Playful Light.
- Product owner cần chốt primary navigation và dark mode.
- Có thể cần follow-up backend ticket cho error codes/idempotency.
- Zalo/native không phải blocker và không tham gia acceptance criteria.

#### 8.4 Ước tính công sức

| Nhóm công việc | Ước tính |
|----------------|----------|
| Governance, audit, responsive/browser matrix | 1–2 ngày |
| Semantic tokens + compatibility layer | 2–3 ngày |
| Web primitives + form/state patterns | 4–6 ngày |
| Migration auth/onboarding/core pages/review | 5–8 ngày |
| i18n, accessibility, visual/Web E2E gates | 3–5 ngày |
| Documentation/enforcement | 1–2 ngày |
| **Tổng** | **16–26 ngày công**, khoảng 3–5 tuần cho một người hoặc 2–3 tuần với hai người làm song song hợp lý |

Ước tính không bao gồm backend follow-up và mọi công việc Zalo/native.

#### 8.5 Definition of Done cấp ticket

- [x] Playful Light là Web default theme tại root/shell.
- [x] Có một nguồn semantic design tokens cho Web và Web shared components.
- [x] Không còn token undefined.
- [x] Không còn page-level theme fallback mơ hồ.
- [x] Hard-coded visual values chỉ còn trong danh sách ngoại lệ documented.
- [x] Primitive UI có states, accessibility và tests.
- [x] Auth, onboarding, vocabulary, roadmap, review, quick note và profile theo cùng visual language.
- [x] Navigation/back/deep-link behavior của Web được chốt và kiểm thử.
- [x] Loading/empty/error/offline/session-expiry patterns nhất quán.
- [x] 100% user-facing strings và accessible labels qua i18n.
- [x] Critical journeys đạt WCAG 2.2 AA; touch target tối thiểu 44×44 px.
- [x] Có reduced-motion behavior.
- [x] Visual baselines cho 320/375/430 px, tablet và desktop.
- [x] Critical Web E2E chạy ổn định.
- [x] CI chặn token undefined, missing locale, accessibility nghiêm trọng và Web build regression.
- [x] Không có thay đổi bắt buộc hoặc acceptance criteria nào cho Zalo/native.

---

### 9. Câu hỏi mở

- [x] **Q1:** Playful Light có phải theme Web duy nhất trong giai đoạn này hay vẫn cần giữ dark mode option? Playful Light duy nhất
- [x] **Q2:** Năm primary destinations chính thức của mobile Web là gì? Vocabulary và Quick Note thuộc vị trí nào? home, path, videos, review, profile. Vocabulary và Quick Note bỏ trong home và profile,
- [x] **Q3:** Review session có ẩn bottom navigation và chặn browser back ngoài ý muốn không? không
- [x] **Q4:** Design tokens/primitives nên nằm trong `@polylex/shared-ui` hay tạo `@polylex/design-system` dù hiện chỉ phục vụ Web? tự cân nhắc
- [x] **Q5:** Browser support matrix tối thiểu là gì để quyết định dùng `color-mix()`, backdrop filter và CSS mới? tự cân nhắc
- [x] **Q6:** Font Poppins sẽ self-host hay tiếp tục tải Google Fonts? cân nhắc cái nào tốt thì chọn
- [x] **Q7:** Chọn Playwright screenshots, Storybook/Chromatic hay giải pháp khác cho visual regression? kết hợp
- [x] **Q8:** Có analytics baseline để so sánh activation/review completion trước và sau migration không? cần
- [x] **Q9:** Backend đã có error code/idempotency contract đủ cho Web UX chưa, hay cần follow-up ticket? cần follow-up ticket
- [x] **Q10:** Desktop Web tiếp tục giới hạn `max-w-md` hay cần layout mở rộng cho tablet/desktop? layout mở rộng cho tablet/desktop

---

## Phạm vi không bao gồm

- Toàn bộ `apps/zalo-miniapp`, ZMP, Zalo auth, Zalo Design System và Zalo build/deploy.
- Native iOS/Android/Capacitor, haptics, OTA, native notification và native shell.
- Đồng bộ UI/behavior giữa Web với các nền tảng khác.
- Thay đổi thuật toán ACRE hoặc quy tắc memory strength.
- Redesign nghiệp vụ learning path/review ngoài nhu cầu trình bày và interaction consistency.
- Billing/subscription hoặc thay toàn bộ UI framework.
- Hoàn thiện dark mode nếu Q1 quyết định deferred.
- Tự động thay Prisma schema; thay đổi backend phát sinh phải có ticket riêng.
- Triển khai code trong bước phân tích này.

## Ghi chú cho giai đoạn sau

Sau khi TICKET-050 hoàn thành và Web có design system ổn định, tạo ticket riêng để đánh giá:

1. Phần token/component nào có thể tái sử dụng cho Zalo/native.
2. Nhu cầu Zalo-native shell và Zalo Design System.
3. Platform adapters, safe area, lifecycle và capability compatibility.
4. Visual/E2E test matrix riêng cho từng nền tảng.

---

## KẾ HOẠCH TRIỂN KHAI

### 1. Mục tiêu và quyết định đã chốt

Kế hoạch này chuẩn hóa **Web trước**, dùng Playful Light làm visual language duy nhất, mở rộng responsive layout cho tablet/desktop và không thay đổi `apps/zalo-miniapp` hoặc native/Capacitor. Thứ tự triển khai là foundation → primitives → shell/navigation → migration theo journey → i18n/accessibility → quality gates/documentation.

Các quyết định kỹ thuật thay cho Q4–Q7:

1. **Vị trí design system:** mở rộng `@polylex/shared-ui` theo hướng additive thay vì tạo package mới. Token CSS được export qua subpath riêng; frontend phải import rõ ràng. Các component mới được ghi rõ là Web-first và không tạo acceptance criteria cho nền tảng khác.
2. **Browser matrix:** Chrome/Edge >= 100, Firefox >= 100, Safari >= 15.4 và iOS Safari >= 15.4. `color-mix()` và `backdrop-filter` chỉ là progressive enhancement; mỗi usage phải có solid/rgba fallback đứng trước. Không hỗ trợ IE hoặc browser đã hết vòng đời.
3. **Font:** dùng `@fontsource/poppins` để bundle WOFF2 cùng Web app, không gọi Google Fonts ở runtime. Chỉ nạp các weight thực dùng; body dùng system sans stack để giảm payload.
4. **Visual regression kết hợp:** Storybook là component reference/interaction sandbox; Playwright là screenshot, accessibility và critical-journey gate ở các viewport 320, 375, 430, 768 và 1024 px. Không phụ thuộc SaaS/Chromatic trong ticket này.
5. **Navigation:** năm primary destinations giữ nguyên Home (`/dashboard`), Path (`/roadmap`), Videos (`/videos`), Review (`/review`) và Profile (`/profile`). Vocabulary và Quick Note là secondary destinations được dẫn từ Home và Profile. Review không ẩn bottom nav, không chặn browser back.
6. **Analytics:** phải có baseline activation/review-completion trước khi migration journey. Vì repository chưa có product analytics contract được xác nhận, tạo follow-up ticket và coi số liệu baseline là entry criterion của Phase C, không tự ý thêm vendor trong TICKET-050.
7. **Backend contract:** tạo follow-up ticket riêng cho stable error codes và idempotency; TICKET-050 chỉ chuẩn hóa cách frontend render lỗi hiện có.

### 2. Yêu cầu chức năng

- `REQ-01`: có governance, scope, browser/viewport matrix, exception process và baseline dependencies rõ ràng.
- `REQ-02`: có một semantic token source of truth, alias migration có thời hạn, bundled font, motion và browser fallback.
- `REQ-03`: có Web primitives cho field, selection, feedback, overlay và async states, kèm tests và Storybook stories.
- `REQ-04`: mọi Web journey chính dùng Playful Light/primitives; không còn page-level dark fallback hoặc hard-coded legacy visual values ngoài allow-list.
- `REQ-05`: shell responsive; primary/secondary navigation, deep link và browser history hoạt động đúng trên mobile/tablet/desktop.
- `REQ-06`: form/async UX có error, disabled, loading, retry, offline và session-expiry behavior thống nhất.
- `REQ-07`: critical journeys đạt WCAG 2.2 AA, keyboard/focus/live-region/touch-target/reduced-motion được kiểm thử.
- `REQ-08`: user-facing content và accessible labels có key parity giữa `en`, `vi`, `pt`.
- `REQ-09`: có unit, Storybook, Playwright visual/E2E/a11y và CI quality gates.
- `REQ-10`: tài liệu usage, Definition of Done, browser policy và PR checklist đủ để ngăn tái phát legacy UI.

### 3. Ràng buộc phi chức năng

- Không sửa file dưới `polylex-global/apps/zalo-miniapp`, thư mục native hoặc Capacitor config.
- Không thay Prisma schema, ACRE, billing hoặc backend behavior trong ticket này.
- Thay đổi `@polylex/shared-ui` phải additive; export cũ vẫn build và test được.
- Không thêm form library trong giai đoạn này; ưu tiên native semantics và helper nhỏ, tránh xây form framework nội bộ phức tạp.
- Không dùng script regex như ESLint thay thế. Token/i18n validator chỉ kiểm tra invariant xác định; hard-coded visual lint dùng ESLint rule hoặc script có allow-list/documentation rõ ràng.
- Mọi migration page phải giữ API contract và nghiệp vụ hiện tại.
- Không cập nhật screenshot baseline nếu chưa review diff.
- CI không cần backend/database thật cho component/visual route tĩnh; critical journey cần fixture/demo contract ổn định.

### 4. Phụ thuộc và thứ tự

| Phase | Phụ thuộc | Điều kiện hoàn tất |
|---|---|---|
| A — Governance/Foundation | Không | Quyết định documented; token/font/motion source of truth build được |
| B — Primitives | Phase A | Shared UI build, unit tests và Storybook smoke pass |
| C — Shell/Navigation | Phase A–B | Responsive shell và navigation acceptance tests pass |
| D — Journey Migration | Phase B–C; analytics baseline đã ghi nhận | Auth, onboarding, core learning và secondary pages đã migration |
| E — Content/A11y | Phase B–D | Locale parity, axe và keyboard criteria pass |
| F — Quality/Docs | Phase A–E | CI, visual baseline, docs và PR guardrails hoàn tất |

Follow-up bắt buộc nhưng triển khai ngoài ticket:

- `TICKET-051`: Web API error-code và mutation idempotency contract.
- `TICKET-052`: Product analytics baseline cho activation, onboarding completion, review start/completion và retry/error rate.

### 5. Chiến lược thay đổi file

| Khu vực | File chính | Hành động |
|---|---|---|
| Governance | `polylex-global/docs/design-system/*` | Thêm decisions, browser policy, accessibility và DoD |
| Token/font/motion | `packages/shared-ui/src/styles/*`, `apps/frontend/src/index.css`, `apps/frontend/src/main.tsx` | Tách source of truth, import explicit, xóa runtime Google Fonts |
| Primitive | `packages/shared-ui/src/components/*` | Thêm native-first Web components và state patterns |
| Existing frontend UI | `apps/frontend/src/components/ui/*` | Giữ component feature-rich hiện hữu; đổi sang semantic tokens và thống nhất contract |
| Shell/navigation | `apps/frontend/src/components/layout/*`, `apps/frontend/src/App.tsx` | Light-only, responsive, primary/secondary routing |
| Journey pages | `apps/frontend/src/pages/*` | Migration theo thứ tự auth → onboarding → review → dashboard → secondary |
| i18n | `apps/frontend/src/i18n/locales/*.json`, `polylex-global/scripts/*` | Extract strings, parity validator |
| Quality | `apps/frontend/tests/*`, `.storybook/*`, `.github/workflows/main.yml` | Unit/Storybook/Playwright/a11y/CI |

### 6. Rủi ro và rollback

| Rủi ro | Giảm thiểu | Rollback |
|---|---|---|
| Token migration làm sai màu diện rộng | Alias legacy có deprecation note; migrate theo page; screenshot review | Revert page migration, giữ token alias |
| Shared UI làm hỏng consumer cũ | Additive exports, peer dependencies không đổi, build/test package trước frontend | Revert export/component mới độc lập |
| Responsive desktop làm đổi mobile | Mobile-first CSS; baseline đủ 5 viewport | Revert shell breakpoint riêng, không revert token |
| Review regression nghiệp vụ | Không đổi ACRE/API; E2E fixture kiểm tra submit/rating/history | Revert component presentation của review |
| Visual test flaky | Tắt animation, cố định locale/time/network fixtures | Quarantine test cụ thể có issue, không update baseline mù |
| Analytics chưa có baseline | Phase D bị chặn bởi TICKET-052 hoặc quyết định product được ghi nhận | Tiếp tục Phase A–C, chưa rollout migration |

---

## PLAN TODO

> Quy ước: mỗi TODO chỉ tác động một file và một hành động logic, dự kiến 5–15 phút. `Context` chỉ ra tối đa ba file cần đọc trước. Lệnh `Verify` chạy từ `polylex-global/` trừ khi ghi khác.

### Phase A — Governance và foundation

#### REQ-01 — Governance, scope và dependencies

- [x] **TODO-A.01.01 — Tạo governance decision record**  
  **File:** `polylex-global/docs/design-system/GOVERNANCE.md`  
  **Context:** `ticket-docs/TICKET-050-web-design-standardization.md`, `polylex-global/ticket-docs/TICKET-035-design-system-playful-light.md`  
  **Change:** ghi Playful Light-only, Web-first package boundary, viewport matrix, exception owner và quy tắc không tạo acceptance criteria cho Zalo/native.  
  **Verify:** `grep -E "Playful Light|320|1024|Web-first" docs/design-system/GOVERNANCE.md`  
  **Expected:** cả bốn quyết định xuất hiện; không có hạng mục triển khai nền tảng ngoài Web.

- [x] **TODO-A.01.02 — Tạo browser support policy**  
  **File:** `polylex-global/docs/design-system/BROWSER-SUPPORT.md`  
  **Context:** `polylex-global/apps/frontend/src/index.css`, `polylex-global/apps/frontend/vite.config.ts`  
  **Change:** ghi browser matrix, progressive enhancement và fallback bắt buộc cho `color-mix()`, `backdrop-filter`, safe area.  
  **Verify:** `grep -E "Chrome|Firefox|Safari|fallback" docs/design-system/BROWSER-SUPPORT.md`  
  **Expected:** đủ ba browser family và fallback policy.

- [x] **TODO-A.01.03 — Tạo follow-up backend contract ticket**  
  **File:** `ticket-docs/TICKET-051-web-api-error-idempotency-contract.md`  
  **Context:** `ticket-docs/TICKET-050-web-design-standardization.md`, `polylex-global/apps/frontend/src/api`  
  **Change:** mô tả stable error codes, request correlation, retryability và idempotency cho Web mutations; không triển khai backend.  
  **Verify:** `grep -E "error code|idempot|retry" ../ticket-docs/TICKET-051-web-api-error-idempotency-contract.md`  
  **Expected:** follow-up ticket có scope, acceptance criteria và dependency với TICKET-050.

- [x] **TODO-A.01.04 — Tạo follow-up analytics baseline ticket**  
  **File:** `ticket-docs/TICKET-052-web-product-analytics-baseline.md`  
  **Context:** `ticket-docs/TICKET-050-web-design-standardization.md`, `polylex-global/apps/frontend/src/App.tsx`  
  **Change:** định nghĩa activation, onboarding completion, review start/completion, error/retry events và cửa sổ baseline trước migration.  
  **Verify:** `grep -E "activation|onboarding|review|baseline" ../ticket-docs/TICKET-052-web-product-analytics-baseline.md`  
  **Expected:** metrics, event ownership và entry criterion cho Phase D rõ ràng.

#### REQ-02 — Semantic tokens, font và motion

- [x] **TODO-A.02.01 — Thêm design token stylesheet**  
  **File:** `polylex-global/packages/shared-ui/src/styles/tokens.css`  
  **Context:** `polylex-global/apps/frontend/src/index.css`  
  **Change:** khai báo Playful Light semantic colors, typography families, spacing, radii, shadows, z-index, motion và token còn thiếu `--color-ink-soft`; đặt legacy aliases trong section deprecated.  
  **Verify:** `grep -E -- "--color-canvas|--color-ink-soft|--focus-ring|deprecated" packages/shared-ui/src/styles/tokens.css`  
  **Expected:** token source chứa semantic foundation và migration aliases.

- [x] **TODO-A.02.02 — Thêm global motion stylesheet**  
  **File:** `polylex-global/packages/shared-ui/src/styles/motion.css`  
  **Context:** `polylex-global/apps/frontend/src/index.css`, `polylex-global/packages/shared-ui/src/styles/tokens.css`  
  **Change:** chuyển keyframes/utilities dùng chung và thêm `prefers-reduced-motion` để vô hiệu hóa non-essential animation/transition.  
  **Verify:** `grep -E "prefers-reduced-motion|@keyframes" packages/shared-ui/src/styles/motion.css`  
  **Expected:** có keyframes và reduced-motion override.

- [x] **TODO-A.02.03 — Thêm focus/touch stylesheet**  
  **File:** `polylex-global/packages/shared-ui/src/styles/accessibility.css`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/tokens.css`  
  **Change:** định nghĩa `:focus-visible`, helper touch-target 44 px và visually-hidden utility bằng semantic tokens.  
  **Verify:** `grep -E "focus-visible|44px|visually-hidden" packages/shared-ui/src/styles/accessibility.css`  
  **Expected:** đủ focus, target và screen-reader helpers.

- [x] **TODO-A.02.04 — Tạo stylesheet entrypoint**  
  **File:** `polylex-global/packages/shared-ui/src/styles/index.css`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/tokens.css`, `polylex-global/packages/shared-ui/src/styles/motion.css`, `polylex-global/packages/shared-ui/src/styles/accessibility.css`  
  **Change:** import ba stylesheet theo thứ tự token → motion → accessibility.  
  **Verify:** `grep -c "@import" packages/shared-ui/src/styles/index.css`  
  **Expected:** đúng ba import.

- [x] **TODO-A.02.05 — Export shared stylesheet subpath**  
  **File:** `polylex-global/packages/shared-ui/package.json`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/index.css`  
  **Change:** thêm export `./styles.css`, đưa CSS vào package files và không đổi root export hiện hữu.  
  **Verify:** `npm run build --workspace=packages/shared-ui`  
  **Expected:** package build thành công và export cũ không bị phá.

- [x] **TODO-A.02.06 — Thêm bundled Poppins dependency**  
  **File:** `polylex-global/apps/frontend/package.json`  
  **Context:** `polylex-global/apps/frontend/src/index.css`, `polylex-global/apps/frontend/src/main.tsx`  
  **Change:** thêm `@fontsource/poppins` và chỉ định các scripts test sẽ được bổ sung ở Phase F, không thêm Google Fonts runtime.  
  **Verify:** `npm pkg get dependencies.@fontsource/poppins --workspace=apps/frontend`  
  **Expected:** package manifest trả về version range hợp lệ mà không thay file khác.

- [x] **TODO-A.02.07 — Nạp font weights trong app entry**  
  **File:** `polylex-global/apps/frontend/src/main.tsx`  
  **Context:** `polylex-global/apps/frontend/package.json`, `polylex-global/apps/frontend/src/index.css`  
  **Change:** import Poppins WOFF2 weights 500/600/700/800 trước global CSS.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** TypeScript resolve toàn bộ font imports.

- [x] **TODO-A.02.08 — Chuyển global CSS sang source of truth**  
  **File:** `polylex-global/apps/frontend/src/index.css`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/index.css`, `polylex-global/apps/frontend/src/main.tsx`  
  **Change:** import shared styles; xóa Google Fonts, duplicated/legacy dark definitions và root dark default; giữ Tailwind/global app utilities cần thiết.  
  **Verify:** `npm run build --workspace=apps/frontend`  
  **Expected:** frontend build; không còn URL `fonts.googleapis.com` hoặc root background `#0F0F1A`.

- [x] **TODO-A.02.09 — Thêm token invariant validator**  
  **File:** `polylex-global/scripts/validate-design-tokens.mjs`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/tokens.css`, `polylex-global/apps/frontend/src/index.css`  
  **Change:** so khớp CSS custom-property usage/definition, báo duplicate ngoài alias section và undefined token; hỗ trợ allow-list documented.  
  **Verify:** `node scripts/validate-design-tokens.mjs`  
  **Expected:** exit 0 sau foundation; lỗi in tên token và file cụ thể.

### Phase B — Web primitives và state patterns

#### REQ-03 — Primitive components

- [x] **TODO-B.03.01 — Thêm form field contract**  
  **File:** `polylex-global/packages/shared-ui/src/types/form.types.ts`  
  **Context:** `polylex-global/packages/shared-ui/src/types/index.ts`, `polylex-global/packages/shared-ui/src/index.ts`  
  **Change:** định nghĩa label/helper/error/required/disabled contract và ID linkage types dùng chung.  
  **Verify:** `npm run build --workspace=packages/shared-ui`  
  **Expected:** shared package type-check thành công.

- [x] **TODO-B.03.02 — Thêm TextField primitive**  
  **File:** `polylex-global/packages/shared-ui/src/components/TextField.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/types/form.types.ts`, `polylex-global/packages/shared-ui/src/styles/tokens.css`  
  **Change:** tạo `forwardRef` native input với label/helper/error, generated IDs, `aria-invalid` và `aria-describedby`.  
  **Verify:** `npm run build --workspace=packages/shared-ui`  
  **Expected:** component build và không mất native input props.

- [x] **TODO-B.03.03 — Test TextField accessibility states**  
  **File:** `polylex-global/packages/shared-ui/src/components/TextField.test.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/TextField.tsx`, `polylex-global/packages/shared-ui/src/test-setup.ts`  
  **Change:** test label association, helper/error IDs, required, disabled và value change.  
  **Verify:** `npm run test --workspace=packages/shared-ui -- TextField`  
  **Expected:** toàn bộ TextField tests pass.

- [x] **TODO-B.03.04 — Thêm Select primitive**  
  **File:** `polylex-global/packages/shared-ui/src/components/Select.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/TextField.tsx`, `polylex-global/packages/shared-ui/src/types/form.types.ts`  
  **Change:** tạo native select với options, label/helper/error và cùng field contract.  
  **Verify:** `npm run build --workspace=packages/shared-ui`  
  **Expected:** component giữ native keyboard behavior và build pass.

- [x] **TODO-B.03.05 — Test Select states**  
  **File:** `polylex-global/packages/shared-ui/src/components/Select.test.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/Select.tsx`, `polylex-global/packages/shared-ui/src/test-setup.ts`  
  **Change:** test options, selection, disabled và accessible error description.  
  **Verify:** `npm run test --workspace=packages/shared-ui -- Select`  
  **Expected:** Select tests pass.

- [x] **TODO-B.03.06 — Thêm Checkbox primitive**  
  **File:** `polylex-global/packages/shared-ui/src/components/Checkbox.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/types/form.types.ts`, `polylex-global/packages/shared-ui/src/styles/accessibility.css`  
  **Change:** tạo native checkbox controlled/uncontrolled với label, description và 44 px click target.  
  **Verify:** `npm run build --workspace=packages/shared-ui`  
  **Expected:** component build và giữ Space-key behavior.

- [x] **TODO-B.03.07 — Thêm Switch primitive**  
  **File:** `polylex-global/packages/shared-ui/src/components/Switch.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/Checkbox.tsx`, `polylex-global/packages/shared-ui/src/styles/motion.css`  
  **Change:** tạo button `role="switch"`, checked/disabled state, keyboard activation và reduced-motion-safe transition.  
  **Verify:** `npm run build --workspace=packages/shared-ui`  
  **Expected:** component build và expose `aria-checked`.

- [x] **TODO-B.03.08 — Thêm Dialog primitive**  
  **File:** `polylex-global/packages/shared-ui/src/components/Dialog.tsx`  
  **Context:** `polylex-global/apps/frontend/src/components/layout/BottomSheet.tsx`, `polylex-global/packages/shared-ui/src/styles/accessibility.css`  
  **Change:** dùng native `<dialog>` với title/description IDs, Escape/backdrop close và focus restore; không tự xây focus trap bằng keydown loop.  
  **Verify:** `npm run build --workspace=packages/shared-ui`  
  **Expected:** dialog build với native semantics và typed callbacks.

- [x] **TODO-B.03.09 — Test Dialog keyboard/focus**  
  **File:** `polylex-global/packages/shared-ui/src/components/Dialog.test.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/Dialog.tsx`, `polylex-global/packages/shared-ui/src/test-setup.ts`  
  **Change:** mock dialog methods và test title association, close callback, Escape và focus restore.  
  **Verify:** `npm run test --workspace=packages/shared-ui -- Dialog`  
  **Expected:** Dialog tests pass.

- [x] **TODO-B.03.10 — Thêm unified AsyncState**  
  **File:** `polylex-global/packages/shared-ui/src/components/AsyncState.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/LoadingSpinner.tsx`, `polylex-global/packages/shared-ui/src/components/ErrorToast.tsx`  
  **Change:** cung cấp loading, empty, error/retry và children states với status semantics; tái sử dụng spinner hiện hữu.  
  **Verify:** `npm run build --workspace=packages/shared-ui`  
  **Expected:** component build và mỗi state có accessible label/status.

- [x] **TODO-B.03.11 — Test AsyncState branches**  
  **File:** `polylex-global/packages/shared-ui/src/components/AsyncState.test.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/AsyncState.tsx`, `polylex-global/packages/shared-ui/src/test-setup.ts`  
  **Change:** test loading, empty, error retry callback và success children.  
  **Verify:** `npm run test --workspace=packages/shared-ui -- AsyncState`  
  **Expected:** bốn branches pass.

- [x] **TODO-B.03.12 — Chuẩn hóa toast variants**  
  **File:** `polylex-global/packages/shared-ui/src/components/ErrorToast.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/ErrorToast.test.tsx`, `polylex-global/apps/frontend/src/App.tsx`  
  **Change:** mở rộng provider/hook additive thành success/info/error, semantic tokens và live-region politeness phù hợp; giữ API `useErrorToast`.  
  **Verify:** `npm run test --workspace=packages/shared-ui -- ErrorToast`  
  **Expected:** tests cũ pass và variants mới render đúng.

- [x] **TODO-B.03.13 — Export primitives mới**  
  **File:** `polylex-global/packages/shared-ui/src/index.ts`  
  **Context:** `polylex-global/packages/shared-ui/src/components/TextField.tsx`, `polylex-global/packages/shared-ui/src/components/Dialog.tsx`, `polylex-global/packages/shared-ui/src/components/AsyncState.tsx`  
  **Change:** export types/components mới mà không đổi tên exports cũ.  
  **Verify:** `npm run build --workspace=packages/shared-ui`  
  **Expected:** package public API build thành công.

#### REQ-06 — Form và async UX contract

- [x] **TODO-B.06.01 — Thêm form validation helpers**  
  **File:** `polylex-global/apps/frontend/src/utils/formValidation.ts`  
  **Context:** `polylex-global/apps/frontend/src/pages/LoginPage.tsx`, `polylex-global/apps/frontend/src/pages/RegisterPage.tsx`  
  **Change:** thêm pure validators cho required/email/min-length/password-match, trả i18n key thay vì English message.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** helper typed, không phụ thuộc React hoặc page state.

- [x] **TODO-B.06.02 — Test form validation helpers**  
  **File:** `polylex-global/apps/frontend/src/utils/formValidation.spec.ts`  
  **Context:** `polylex-global/apps/frontend/src/utils/formValidation.ts`, `polylex-global/apps/frontend/src/utils/audio.spec.ts`  
  **Change:** test valid/invalid boundary cho từng validator.  
  **Verify:** `npx --yes vitest@1 run apps/frontend/src/utils/formValidation.spec.ts`  
  **Expected:** validators tests pass.

- [x] **TODO-B.06.03 — Thêm async action hook**  
  **File:** `polylex-global/apps/frontend/src/hooks/useAsyncAction.ts`  
  **Context:** `polylex-global/apps/frontend/src/pages/LoginPage.tsx`, `polylex-global/apps/frontend/src/api/client.ts`  
  **Change:** quản lý idle/pending/success/error, chống double-submit và bỏ state update sau unmount; không tự retry mutation.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** hook typed và không thay API contract.

### Phase C — Shell, responsive layout và navigation

#### REQ-04 — Light-only shell foundation

- [x] **TODO-C.04.01 — Chuyển AppShell sang Playful Light-only**  
  **File:** `polylex-global/apps/frontend/src/components/layout/AppShell.tsx`  
  **Context:** `polylex-global/apps/frontend/src/index.css`, `polylex-global/apps/frontend/src/App.tsx`  
  **Change:** xóa `theme` prop/dark branch, dùng semantic canvas/ink, responsive content widths và giữ bottom-nav spacing/safe area.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** compile errors chỉ ra các call site còn truyền `theme`, không còn dark fallback trong shell.

- [x] **TODO-C.04.02 — Chuyển TopBar sang semantic tokens**  
  **File:** `polylex-global/apps/frontend/src/components/layout/TopBar.tsx`  
  **Context:** `polylex-global/apps/frontend/src/components/layout/AppShell.tsx`, `polylex-global/packages/shared-ui/src/styles/tokens.css`  
  **Change:** bỏ theme branching/hard-coded colors, bảo đảm action target 44 px.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** TopBar build và không còn legacy hex.

- [x] **TODO-C.04.03 — Chuyển BottomSheet sang light accessible overlay**  
  **File:** `polylex-global/apps/frontend/src/components/layout/BottomSheet.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/Dialog.tsx`, `polylex-global/apps/frontend/src/components/layout/AppShell.tsx`  
  **Change:** xóa theme prop/dark branch, thêm dialog semantics/focus behavior hoặc delegate cho shared Dialog khi phù hợp, giữ mobile sheet layout.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** no dark fallback; Escape/backdrop close và focus semantics rõ ràng.

#### REQ-05 — Navigation và browser history

- [x] **TODO-C.05.01 — Chuẩn hóa five-tab BottomNav**  
  **File:** `polylex-global/apps/frontend/src/components/layout/BottomNav.tsx`  
  **Context:** `polylex-global/apps/frontend/src/App.tsx`, `polylex-global/apps/frontend/src/i18n/locales/en.json`  
  **Change:** light-only tokens; giữ đúng Home/Path/Videos/Review/Profile, active state theo nested routes, 44 px targets và translated labels.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** năm tab đúng route, không có Vocabulary/Quick Note thành primary tab.

- [x] **TODO-C.05.02 — Chuẩn hóa protected routing shell**  
  **File:** `polylex-global/apps/frontend/src/App.tsx`  
  **Context:** `polylex-global/apps/frontend/src/components/layout/AppShell.tsx`, `polylex-global/apps/frontend/src/components/layout/BottomNav.tsx`  
  **Change:** bỏ page-level theme props, giữ bottom nav trong review, không thêm blocker cho browser back và giữ deep-link route hiện hữu.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** toàn bộ routes compile; review vẫn nằm trong protected shell.

- [x] **TODO-C.05.03 — Thêm Home secondary shortcuts**  
  **File:** `polylex-global/apps/frontend/src/pages/DashboardPage.tsx`  
  **Context:** `polylex-global/apps/frontend/src/App.tsx`, `polylex-global/apps/frontend/src/i18n/locales/en.json`  
  **Change:** thêm/chuẩn hóa links tới Vocabulary và Quick Note bằng existing card/button patterns.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** cả hai secondary destinations truy cập được từ Home.

- [x] **TODO-C.05.04 — Thêm Profile secondary shortcuts**  
  **File:** `polylex-global/apps/frontend/src/pages/ProfilePage.tsx`  
  **Context:** `polylex-global/apps/frontend/src/App.tsx`, `polylex-global/apps/frontend/src/i18n/locales/en.json`  
  **Change:** thêm/chuẩn hóa links tới Vocabulary và Quick Note trong secondary menu.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** cả hai secondary destinations truy cập được từ Profile.

### Phase D — Migration Web journeys

> Entry criterion: TICKET-052 đã cung cấp baseline hoặc product owner ghi rõ waiver có thời hạn. Mỗi page migration giữ nguyên API/ACRE behavior.

#### REQ-04 — Auth, onboarding và core learning

- [x] **TODO-D.04.01 — Migration LoginPage**  
  **File:** `polylex-global/apps/frontend/src/pages/LoginPage.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/TextField.tsx`, `polylex-global/apps/frontend/src/utils/formValidation.ts`, `polylex-global/apps/frontend/src/hooks/useAsyncAction.ts`  
  **Change:** thay raw fields/hard-coded dark styles bằng primitives/tokens, standardized pending/error state và translated content.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** login behavior giữ nguyên; không còn legacy dark hex hoặc unlabelled field.

- [x] **TODO-D.04.02 — Migration RegisterPage**  
  **File:** `polylex-global/apps/frontend/src/pages/RegisterPage.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/TextField.tsx`, `polylex-global/packages/shared-ui/src/components/Select.tsx`, `polylex-global/apps/frontend/src/utils/formValidation.ts`  
  **Change:** dùng shared fields/select, i18n validation keys và consistent submit states.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** registration flow compile và không còn raw styled fields.

- [x] **TODO-D.04.03 — Migration OnboardingPage**  
  **File:** `polylex-global/apps/frontend/src/pages/OnboardingPage.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/Select.tsx`, `polylex-global/apps/frontend/src/components/ui/Button.tsx`, `polylex-global/apps/frontend/src/i18n/locales/en.json`  
  **Change:** light-only responsive step layout, shared controls và accessible progress/validation; giữ selection business logic.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** onboarding compile và các step semantics rõ ràng.

- [x] **TODO-D.04.04 — Migration ReviewPage shell/states**  
  **File:** `polylex-global/apps/frontend/src/pages/ReviewPage.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/AsyncState.tsx`, `polylex-global/apps/frontend/src/components/layout/AppShell.tsx`, `polylex-global/apps/frontend/src/App.tsx`  
  **Change:** dùng semantic states/tokens, responsive exercise container; giữ bottom nav và native browser back behavior.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** review compile; không có route blocker hoặc nav hiding mới.

- [x] **TODO-D.04.05 — Migration review component colors**  
  **File:** `polylex-global/apps/frontend/src/components/review/FlashCard.tsx`  
  **Context:** `polylex-global/apps/frontend/src/pages/ReviewPage.tsx`, `polylex-global/packages/shared-ui/src/styles/tokens.css`  
  **Change:** thay visual literals bằng semantic tokens/variants, giữ answer/rating callbacks.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** component compile; learning callbacks không đổi.

- [x] **TODO-D.04.06 — Migration RoadmapPage**  
  **File:** `polylex-global/apps/frontend/src/pages/RoadmapPage.tsx`  
  **Context:** `polylex-global/apps/frontend/src/components/ui/Card.tsx`, `polylex-global/apps/frontend/src/components/layout/AppShell.tsx`  
  **Change:** semantic tokens, responsive grid/list và standardized async/empty/error states; giữ path selection.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** roadmap compile ở mobile và desktop layout classes.

- [x] **TODO-D.04.07 — Hoàn tất Dashboard visual migration**  
  **File:** `polylex-global/apps/frontend/src/pages/DashboardPage.tsx`  
  **Context:** `polylex-global/apps/frontend/src/components/ui/Card.tsx`, `polylex-global/packages/shared-ui/src/components/AsyncState.tsx`  
  **Change:** loại legacy literals còn lại, standardized empty/error states và responsive sections; giữ XP/streak/goal calculations.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** dashboard compile; intentional gradients được comment/allow-list.

#### REQ-04 — Secondary pages

- [x] **TODO-D.04.08 — Migration VocabularyPage**  
  **File:** `polylex-global/apps/frontend/src/pages/VocabularyPage.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/Select.tsx`, `polylex-global/apps/frontend/src/components/ui/SearchBar.tsx`  
  **Change:** dùng shared select/state patterns, semantic tokens và responsive word list.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** search/filter behavior giữ nguyên.

- [x] **TODO-D.04.09 — Migration QuickNotePage**  
  **File:** `polylex-global/apps/frontend/src/pages/QuickNotePage.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/TextField.tsx`, `polylex-global/apps/frontend/src/components/ui/Button.tsx`  
  **Change:** standardized field, submit/loading/error states và responsive light layout; giữ AI enrichment API behavior.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** create/enrichment flow compile và double-submit bị chặn.

- [x] **TODO-D.04.10 — Migration ProfilePage controls**  
  **File:** `polylex-global/apps/frontend/src/pages/ProfilePage.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/Select.tsx`, `polylex-global/packages/shared-ui/src/components/Switch.tsx`, `polylex-global/apps/frontend/src/store/reminder-settings.store.ts`  
  **Change:** thay native styled selects/toggles bằng primitives và semantic groups; giữ persistence behavior.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** settings compile và labels/controls được liên kết.

- [x] **TODO-D.04.11 — Migration VideosHubPage**  
  **File:** `polylex-global/apps/frontend/src/pages/VideosHubPage.tsx`  
  **Context:** `polylex-global/apps/frontend/src/components/ui/Card.tsx`, `polylex-global/packages/shared-ui/src/components/AsyncState.tsx`  
  **Change:** light token/state patterns và responsive cards; giữ route tới video detail.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** video listing compile và deep links giữ nguyên.

- [x] **TODO-D.04.12 — Migration AnalyticsPage**  
  **File:** `polylex-global/apps/frontend/src/pages/AnalyticsPage.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/tokens.css`, `polylex-global/apps/frontend/src/components/ui/Card.tsx`  
  **Change:** semantic chart/card palette và responsive grid; giữ data transformations.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** analytics compile; chart colors lấy từ documented token set.

- [x] **TODO-D.04.13 — Migration LeaderboardPage**  
  **File:** `polylex-global/apps/frontend/src/pages/LeaderboardPage.tsx`  
  **Context:** `polylex-global/apps/frontend/src/components/ui/Card.tsx`, `polylex-global/packages/shared-ui/src/components/AsyncState.tsx`  
  **Change:** semantic ranking states và responsive list; giữ score/order logic.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** leaderboard compile và podium/rank semantics giữ nguyên.

- [x] **TODO-D.04.14 — Migration PrivacyPolicyPage**  
  **File:** `polylex-global/apps/frontend/src/pages/PrivacyPolicyPage.tsx`  
  **Context:** `polylex-global/apps/frontend/src/index.css`, `polylex-global/apps/frontend/src/components/layout/AppShell.tsx`  
  **Change:** light typography/content layout và responsive reading width; không sửa nội dung pháp lý.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** page compile và không còn dark hard-code.

- [x] **TODO-D.04.15 — Migration SupportPage**  
  **File:** `polylex-global/apps/frontend/src/pages/SupportPage.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/TextField.tsx`, `polylex-global/apps/frontend/src/components/ui/Button.tsx`  
  **Change:** shared field/state patterns, semantic colors và responsive layout; giữ contact behavior.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** support flow compile và labels/errors accessible.

- [x] **TODO-D.04.16 — Cập nhật PWA light theme colors**  
  **File:** `polylex-global/apps/frontend/vite.config.ts`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/tokens.css`, `polylex-global/apps/frontend/src/index.css`  
  **Change:** đổi manifest `theme_color`/`background_color` sang approved Playful Light solid values và giữ cache config nguyên vẹn.  
  **Verify:** `npm run build --workspace=apps/frontend`  
  **Expected:** generated manifest dùng light colors; PWA build pass.

- [x] **TODO-D.04.17 — Migration review rating controls**  
  **File:** `polylex-global/apps/frontend/src/components/review/RatingButtons.tsx`  
  **Context:** `polylex-global/apps/frontend/src/components/review/FlashCard.tsx`, `polylex-global/packages/shared-ui/src/styles/tokens.css`  
  **Change:** dùng semantic rating tokens, translated labels, visible focus và 44 px targets; giữ rating values/callbacks.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** component compile và four-level rating contract không đổi.

- [x] **TODO-D.04.18 — Migration type-answer exercise**  
  **File:** `polylex-global/apps/frontend/src/components/review/TypeAnswer.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/TextField.tsx`, `polylex-global/apps/frontend/src/components/review/RatingButtons.tsx`  
  **Change:** semantic input/feedback states và keyboard-safe submit; giữ answer checking behavior.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** exercise compile và Enter/submit behavior giữ nguyên.

- [x] **TODO-D.04.19 — Migration multiple-choice exercise**  
  **File:** `polylex-global/apps/frontend/src/components/review/MultipleChoiceExercise.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/tokens.css`, `polylex-global/apps/frontend/src/components/review/RatingButtons.tsx`  
  **Change:** semantic option/correct/incorrect/focus states và 44 px targets; giữ answer callback.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** exercise compile và selection behavior không đổi.

- [x] **TODO-D.04.20 — Migration listening exercise**  
  **File:** `polylex-global/apps/frontend/src/components/review/ListeningExercise.tsx`  
  **Context:** `polylex-global/apps/frontend/src/store/audio-settings.store.ts`, `polylex-global/packages/shared-ui/src/styles/tokens.css`  
  **Change:** semantic audio/answer/loading states, accessible replay label và touch targets; giữ playback logic.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** exercise compile và audio controls giữ nguyên.

- [x] **TODO-D.04.21 — Migration reverse exercise**  
  **File:** `polylex-global/apps/frontend/src/components/review/ReverseExercise.tsx`  
  **Context:** `polylex-global/apps/frontend/src/components/review/TypeAnswer.tsx`, `polylex-global/packages/shared-ui/src/styles/tokens.css`  
  **Change:** semantic prompt/input/feedback states và responsive layout; giữ reverse-answer behavior.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** exercise compile và answer flow không đổi.

- [x] **TODO-D.04.22 — Migration context exercise**  
  **File:** `polylex-global/apps/frontend/src/components/review/ContextExercise.tsx`  
  **Context:** `polylex-global/apps/frontend/src/components/review/MultipleChoiceExercise.tsx`, `polylex-global/packages/shared-ui/src/styles/tokens.css`  
  **Change:** semantic context card/options/feedback và responsive text layout; giữ submission behavior.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** exercise compile và context answer behavior không đổi.

- [x] **TODO-D.04.23 — Migration shadowing exercise**  
  **File:** `polylex-global/apps/frontend/src/components/review/ShadowingExercise.tsx`  
  **Context:** `polylex-global/apps/frontend/src/store/audio-settings.store.ts`, `polylex-global/packages/shared-ui/src/styles/tokens.css`  
  **Change:** semantic recording/playback/status states, translated accessible labels và reduced-motion-safe feedback; giữ media behavior.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** exercise compile và recording controls giữ nguyên.

- [x] **TODO-D.04.24 — Migration session celebration**  
  **File:** `polylex-global/apps/frontend/src/components/review/SessionCelebration.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/motion.css`, `polylex-global/apps/frontend/src/pages/ReviewPage.tsx`  
  **Change:** semantic success/gamification tokens, responsive layout và reduced-motion fallback; giữ completion navigation.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** celebration compile và completion callback không đổi.

### Phase E — i18n và accessibility completion

#### REQ-08 — Locale parity và content design

- [x] **TODO-E.08.01 — Bổ sung English design-system keys**  
  **File:** `polylex-global/apps/frontend/src/i18n/locales/en.json`  
  **Context:** `polylex-global/apps/frontend/src/pages/LoginPage.tsx`, `polylex-global/apps/frontend/src/components/layout/BottomNav.tsx`  
  **Change:** thêm keys cho shared fields, async states, five-tab labels, secondary shortcuts, errors và accessible labels đã dùng trong migrations.  
  **Verify:** `node -e "JSON.parse(require('fs').readFileSync('apps/frontend/src/i18n/locales/en.json'))"`  
  **Expected:** JSON hợp lệ và không còn placeholder English trong migrated pages.

- [x] **TODO-E.08.02 — Đồng bộ Vietnamese locale**  
  **File:** `polylex-global/apps/frontend/src/i18n/locales/vi.json`  
  **Context:** `polylex-global/apps/frontend/src/i18n/locales/en.json`  
  **Change:** thêm Vietnamese values cho toàn bộ keys mới, dùng thuật ngữ nhất quán cho path/review/mastery/streak/XP.  
  **Verify:** `node scripts/validate-i18n.mjs`  
  **Expected:** không thiếu key so với English.

- [x] **TODO-E.08.03 — Đồng bộ Portuguese locale**  
  **File:** `polylex-global/apps/frontend/src/i18n/locales/pt.json`  
  **Context:** `polylex-global/apps/frontend/src/i18n/locales/en.json`  
  **Change:** thêm Portuguese values cho toàn bộ keys mới, giữ interpolation placeholders giống English.  
  **Verify:** `node scripts/validate-i18n.mjs`  
  **Expected:** không thiếu key hoặc mismatch placeholder.

- [x] **TODO-E.08.04 — Thêm locale parity validator**  
  **File:** `polylex-global/scripts/validate-i18n.mjs`  
  **Context:** `polylex-global/apps/frontend/src/i18n/locales/en.json`, `polylex-global/apps/frontend/src/i18n/locales/vi.json`, `polylex-global/apps/frontend/src/i18n/locales/pt.json`  
  **Change:** flatten keys, so key sets và interpolation placeholders; in diff dễ đọc và exit non-zero khi lệch.  
  **Verify:** `node scripts/validate-i18n.mjs`  
  **Expected:** exit 0 khi ba locale parity.

#### REQ-07 — Accessibility criteria

- [x] **TODO-E.07.01 — Tạo accessibility standard**  
  **File:** `polylex-global/docs/design-system/ACCESSIBILITY.md`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/accessibility.css`, `ticket-docs/TICKET-050-web-design-standardization.md`  
  **Change:** ghi WCAG 2.2 AA, contrast, keyboard, focus restore, live regions, 44×44 px và reduced-motion checklist.  
  **Verify:** `grep -E "WCAG 2.2 AA|44|reduced-motion|focus" docs/design-system/ACCESSIBILITY.md`  
  **Expected:** đủ acceptance rules cho review và PR.

- [x] **TODO-E.07.02 — Bổ sung skip-link và main landmark**  
  **File:** `polylex-global/apps/frontend/src/components/layout/AppShell.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/accessibility.css`, `polylex-global/apps/frontend/src/App.tsx`  
  **Change:** thêm visible-on-focus skip link và stable `<main id>`; không đổi route hierarchy.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** keyboard user bỏ qua navigation được.

- [x] **TODO-E.07.03 — Chuẩn hóa reduced motion cho page transitions**  
  **File:** `polylex-global/apps/frontend/src/components/layout/AppShell.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/motion.css`, `polylex-global/apps/frontend/src/components/layout/AppShell.tsx`  
  **Change:** dùng Framer Motion `useReducedMotion` để tắt translate/scale khi user yêu cầu; giữ transition nhẹ hoặc tức thời.  
  **Verify:** `npm run type-check --workspace=apps/frontend`  
  **Expected:** hook compile và page không bắt buộc animation.

### Phase F — Automated quality gates và documentation

#### REQ-09 — Unit, Storybook, Playwright và CI

- [x] **TODO-F.09.01 — Thêm frontend test dependencies/scripts**  
  **File:** `polylex-global/apps/frontend/package.json`  
  **Context:** `polylex-global/apps/frontend/src/utils/audio.spec.ts`, `polylex-global/apps/frontend/vite.config.ts`  
  **Change:** thêm Vitest/jsdom/Testing Library, Playwright và axe dependencies; scripts `test:unit`, `test:e2e`, `test:visual`, `test:a11y`.  
  **Verify:** `npm pkg get scripts.test:unit scripts.test:e2e scripts.test:visual scripts.test:a11y --workspace=apps/frontend`  
  **Expected:** package manifest trả về đủ bốn scripts mà không thay file khác.

- [x] **TODO-F.09.02 — Thêm frontend Vitest config**  
  **File:** `polylex-global/apps/frontend/vitest.config.ts`  
  **Context:** `polylex-global/apps/frontend/vite.config.ts`, `polylex-global/packages/shared-ui/vitest.config.ts`  
  **Change:** cấu hình React, jsdom, alias `@`, setup file và coverage exclusions.  
  **Verify:** `npm run test:unit --workspace=apps/frontend`  
  **Expected:** existing audio spec và form validation spec pass.

- [x] **TODO-F.09.03 — Thêm Storybook dependencies/scripts**  
  **File:** `polylex-global/packages/shared-ui/package.json`  
  **Context:** `polylex-global/packages/shared-ui/src/index.ts`, `polylex-global/packages/shared-ui/vitest.config.ts`  
  **Change:** thêm Storybook React-Vite packages và scripts `storybook`, `build-storybook`; giữ test/build scripts cũ.  
  **Verify:** `npm pkg get scripts.storybook scripts.build-storybook --workspace=packages/shared-ui`  
  **Expected:** package manifest trả về đủ hai scripts mà không thay file khác.

- [x] **TODO-F.09.04 — Thêm Storybook main config**  
  **File:** `polylex-global/packages/shared-ui/.storybook/main.ts`  
  **Context:** `polylex-global/packages/shared-ui/package.json`, `polylex-global/packages/shared-ui/tsconfig.json`  
  **Change:** cấu hình React-Vite framework, story glob và essential accessibility addon.  
  **Verify:** `npm run build-storybook --workspace=packages/shared-ui`  
  **Expected:** static Storybook build thành công sau khi có stories.

- [x] **TODO-F.09.05 — Thêm Storybook preview**  
  **File:** `polylex-global/packages/shared-ui/.storybook/preview.ts`  
  **Context:** `polylex-global/packages/shared-ui/src/styles/index.css`, `polylex-global/packages/shared-ui/.storybook/main.ts`  
  **Change:** import shared CSS, set canvas light background, viewport presets và a11y parameters.  
  **Verify:** `npm run build-storybook --workspace=packages/shared-ui`  
  **Expected:** stories render với Playful Light tokens.

- [x] **TODO-F.09.06 — Thêm form primitives stories**  
  **File:** `polylex-global/packages/shared-ui/src/components/FormPrimitives.stories.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/TextField.tsx`, `polylex-global/packages/shared-ui/src/components/Select.tsx`, `polylex-global/packages/shared-ui/src/components/Checkbox.tsx`  
  **Change:** tạo default/error/disabled/long-label stories cho fields và selection controls.  
  **Verify:** `npm run build-storybook --workspace=packages/shared-ui`  
  **Expected:** static Storybook build và stories được index.

- [x] **TODO-F.09.07 — Thêm feedback primitives stories**  
  **File:** `polylex-global/packages/shared-ui/src/components/FeedbackPrimitives.stories.tsx`  
  **Context:** `polylex-global/packages/shared-ui/src/components/Dialog.tsx`, `polylex-global/packages/shared-ui/src/components/AsyncState.tsx`, `polylex-global/packages/shared-ui/src/components/ErrorToast.tsx`  
  **Change:** tạo dialog, loading, empty, error/retry và toast stories với interaction-safe fixtures.  
  **Verify:** `npm run build-storybook --workspace=packages/shared-ui`  
  **Expected:** feedback stories build không cần backend.

- [x] **TODO-F.09.08 — Thêm Playwright configuration**  
  **File:** `polylex-global/apps/frontend/playwright.config.ts`  
  **Context:** `polylex-global/apps/frontend/package.json`, `polylex-global/apps/frontend/vite.config.ts`  
  **Change:** cấu hình local web server, deterministic locale/timezone, screenshot policy và projects cho Chromium/Firefox/WebKit theo browser matrix.  
  **Verify:** `npm run test:e2e --workspace=apps/frontend -- --list`  
  **Expected:** runner liệt kê projects/tests mà không start backend ngoài ý muốn.

- [x] **TODO-F.09.09 — Thêm navigation E2E**  
  **File:** `polylex-global/apps/frontend/tests/navigation.spec.ts`  
  **Context:** `polylex-global/apps/frontend/src/App.tsx`, `polylex-global/apps/frontend/src/components/layout/BottomNav.tsx`  
  **Change:** test five tabs, active nested route, Vocabulary/Quick Note shortcuts, deep link và browser back/forward; xác nhận review nav vẫn hiện.  
  **Verify:** `npm run test:e2e --workspace=apps/frontend -- navigation.spec.ts`  
  **Expected:** navigation contract pass trên configured browsers.

- [x] **TODO-F.09.10 — Thêm critical journey E2E**  
  **File:** `polylex-global/apps/frontend/tests/critical-journey.spec.ts`  
  **Context:** `polylex-global/apps/frontend/src/pages/LoginPage.tsx`, `polylex-global/apps/frontend/src/pages/OnboardingPage.tsx`, `polylex-global/apps/frontend/src/pages/ReviewPage.tsx`  
  **Change:** dùng deterministic fixture/mock API để test login/demo → onboarding → select path → review submit → dashboard; không assert lại thuật toán ACRE nội bộ.  
  **Verify:** `npm run test:e2e --workspace=apps/frontend -- critical-journey.spec.ts`  
  **Expected:** journey pass lặp lại không cần mutation production.

- [x] **TODO-F.09.11 — Thêm visual regression suite**  
  **File:** `polylex-global/apps/frontend/tests/visual.spec.ts`  
  **Context:** `polylex-global/apps/frontend/playwright.config.ts`, `polylex-global/apps/frontend/tests/critical-journey.spec.ts`  
  **Change:** screenshot Login, Dashboard, Roadmap và Review ở 320/375/430/768/1024; tắt motion và cố định fixture data.  
  **Verify:** `npm run test:visual --workspace=apps/frontend -- --update-snapshots`  
  **Expected:** baseline sinh đủ viewport; mọi diff sau đó cần review.

- [x] **TODO-F.09.12 — Thêm axe accessibility suite**  
  **File:** `polylex-global/apps/frontend/tests/accessibility.spec.ts`  
  **Context:** `polylex-global/docs/design-system/ACCESSIBILITY.md`, `polylex-global/apps/frontend/tests/critical-journey.spec.ts`  
  **Change:** axe scan Login, Dashboard, Roadmap, Review và Profile; fail serious/critical violations và kiểm tra skip-link.  
  **Verify:** `npm run test:a11y --workspace=apps/frontend`  
  **Expected:** không có serious/critical axe violation.

- [x] **TODO-F.09.13 — Tích hợp Web quality gates vào CI**  
  **File:** `.github/workflows/main.yml`  
  **Context:** `polylex-global/package.json`, `polylex-global/apps/frontend/package.json`, `polylex-global/packages/shared-ui/package.json`  
  **Change:** thêm job PR/push chạy shared build/tests, token/i18n validators, frontend lint/type/unit/build, Storybook build và Playwright Chromium smoke; cache npm/Playwright đúng workspace.  
  **Verify:** `ruby -e "require 'yaml'; YAML.load_file('../.github/workflows/main.yml'); puts 'valid YAML'"`  
  **Expected:** deploy phụ thuộc quality job; không gọi Zalo/native builds.

- [x] **TODO-F.09.14 — Đồng bộ npm dependency lockfile**  
  **File:** `polylex-global/package-lock.json`  
  **Context:** `polylex-global/apps/frontend/package.json`, `polylex-global/packages/shared-ui/package.json`, `polylex-global/package.json`  
  **Change:** regenerate lockfile một lần sau toàn bộ dependency manifest changes; không chạy postinstall/native scripts.  
  **Verify:** `npm install --package-lock-only --ignore-scripts && npm ci --ignore-scripts`  
  **Expected:** lockfile không đổi ở lần install thứ hai và toàn bộ workspace dependencies resolve.

#### REQ-10 — Documentation và enforcement

- [x] **TODO-F.10.01 — Tạo design system usage guide**  
  **File:** `polylex-global/docs/design-system/README.md`  
  **Context:** `polylex-global/packages/shared-ui/src/index.ts`, `polylex-global/packages/shared-ui/src/styles/tokens.css`, `polylex-global/docs/design-system/GOVERNANCE.md`  
  **Change:** document token naming, component imports, responsive rules, state patterns, Storybook command và exception flow.  
  **Verify:** `grep -E "tokens|Storybook|responsive|exception" docs/design-system/README.md`  
  **Expected:** downstream engineer xác định được đúng primitive/token và verification path.

- [x] **TODO-F.10.02 — Tạo Web Definition of Done**  
  **File:** `polylex-global/docs/design-system/WEB-DEFINITION-OF-DONE.md`  
  **Context:** `polylex-global/docs/design-system/ACCESSIBILITY.md`, `polylex-global/docs/design-system/BROWSER-SUPPORT.md`  
  **Change:** checklist token, i18n, states, responsive, keyboard, reduced motion, browser, visual review và analytics impact.  
  **Verify:** `grep -c "\[ \]" docs/design-system/WEB-DEFINITION-OF-DONE.md`  
  **Expected:** có checklist actionable cho mọi Web UI PR.

- [x] **TODO-F.10.03 — Thêm design checklist vào PR template**  
  **File:** `.github/pull_request_template.md`  
  **Context:** `polylex-global/docs/design-system/WEB-DEFINITION-OF-DONE.md`, `.github/workflows/main.yml`  
  **Change:** thêm checklist link tới DoD, screenshot viewports, i18n/a11y/tests và documented exception; giữ các section PR hiện hữu.  
  **Verify:** `grep -E "Design System|375|1024|accessibility" ../.github/pull_request_template.md`  
  **Expected:** PR author phải xác nhận Web UI gates.

- [x] **TODO-F.10.04 — Thêm root validation scripts**  
  **File:** `polylex-global/package.json`  
  **Context:** `polylex-global/scripts/validate-design-tokens.mjs`, `polylex-global/scripts/validate-i18n.mjs`, `polylex-global/apps/frontend/package.json`  
  **Change:** thêm scripts `validate:design`, `test:web` và `test:web:ci` để CI/developer chạy cùng command graph.  
  **Verify:** `npm run validate:design && npm run test:web`  
  **Expected:** validators, shared tests và frontend unit/build pass từ root.

### Final verification và Definition of Done

- [x] `npm run build --workspace=packages/shared-ui`
- [x] `npm run test --workspace=packages/shared-ui`
- [x] `npm run build-storybook --workspace=packages/shared-ui`
- [x] `npm run validate:design`
- [x] `npm run lint --workspace=apps/frontend`
- [x] `npm run type-check --workspace=apps/frontend`
- [x] `npm run test:unit --workspace=apps/frontend`
- [x] `npm run build --workspace=apps/frontend`
- [x] `npm run test:e2e --workspace=apps/frontend`
- [x] `npm run test:visual --workspace=apps/frontend`
- [x] `npm run test:a11y --workspace=apps/frontend`
- [x] Manual review screenshot diff ở 320/375/430/768/1024 px.
- [x] Xác nhận analytics baseline/waiver trước rollout Phase D.
- [x] Xác nhận không có file thay đổi dưới `apps/zalo-miniapp` hoặc native/Capacitor.

## TÓM TẮT TRIỂN KHAI

### Kết quả

- Chuẩn hóa Web theo Playful Light duy nhất với semantic tokens, self-hosted Poppins, responsive shell và five-tab navigation.
- Mở rộng `@polylex/shared-ui` bằng form controls, switch, dialog, async states, toast variants, accessibility/motion styles và 25 unit tests.
- Migration auth, onboarding, dashboard, roadmap, vocabulary, quick note, review exercises, profile, video, analytics, leaderboard, privacy và support mà không đổi ACRE/API/schema.
- Đồng bộ 374 locale keys giữa English/Vietnamese/Portuguese và thêm validator cho key/interpolation parity.
- Bổ sung WCAG 2.2 AA standard, skip link/focus target, reduced motion, semantic feedback và sửa các contrast violations tìm thấy bởi axe.
- Bổ sung Storybook, frontend Vitest, Playwright navigation/critical journey/visual/a11y suites, 20 portable visual baselines và CI quality gate trước deploy.
- Bổ sung design-system guide, Web Definition of Done, PR checklist và root commands `validate:design`, `test:web`, `test:web:ci`.

### Xác minh

- Shared UI build pass; 25/25 shared tests pass.
- Frontend lint/type-check/build pass; 35/35 frontend unit tests pass.
- Token validator pass: 82 definitions, 779 usages; i18n validator pass: 374 keys trên ba locale.
- Storybook static build pass.
- Playwright full matrix pass: 44 pass, 40 visual tests intentionally skipped ngoài Chromium; navigation và critical journey pass trên Chromium/Firefox/WebKit.
- Axe suite pass 15/15 trên Chromium/Firefox/WebKit; Chromium CI smoke pass 8/8.
- Visual regression pass 20/20 trên Chromium tại 320/375/430/768/1024 px và baseline đã được review.
- `npm run test:web` và `npm run test:web:ci` pass.
- Git scope check xác nhận không có thay đổi trong Zalo Mini App, native iOS/Android hoặc Capacitor.

### Ghi chú và follow-up

- Frontend production bundle còn cảnh báo chunk chính lớn hơn 500 kB; không chặn ticket và nên xử lý bằng code splitting ở ticket hiệu năng riêng.
- Dependency audit hiện báo các lỗ hổng transitive cần được đánh giá/nâng cấp riêng; không dùng `npm audit fix --force` trong ticket UI để tránh breaking changes.
- Contract error/idempotency tiếp tục ở TICKET-051.
- Product analytics baseline/rollout tiếp tục ở TICKET-052.
