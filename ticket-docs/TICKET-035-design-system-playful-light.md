# TICKET-035: Design System Refresh — "Playful Light" (Hướng B + C)

**Status:** � Implemented (foundation + reference Dashboard)
**Priority:** 🔥 P0 – Foundation (nền tảng cho TICKET-033 & TICKET-034)
**Platforms:** iOS, Android, Web, Zalo Mini App
**Created:** June 16, 2026
**Type:** Design System / Visual Refresh
**Related:** TICKET-005 (mobile-first UI), TICKET-033 (redesign 3 màn), TICKET-034 (redesign Dashboard)

---

## Mô tả yêu cầu

App hiện dùng dark theme indigo/purple nhất quán nhưng mang cảm giác "an toàn/generic"
(giống nhiều template SaaS). Ticket này thiết lập một **Design System mới** kết hợp hai
phong cách:

- **Hướng B — Playful Energy:** màu ấm, năng lượng tích cực, gamification nổi bật, phù hợp
  app học ngôn ngữ (tinh thần Duolingo).
- **Hướng C — Light + Bold:** light theme, nhiều khoảng trắng, typography lớn/đậm, cảm giác
  premium & hiện đại.

Kết quả mong muốn: một phong cách **"Playful Light"** — nền sáng, sạch, typography mạnh,
accent ấm rực rỡ và micro-interactions vui mắt. Đây là **nền tảng** phải chốt trước khi
triển khai redesign UX ở TICKET-033 (Roadmap/Review/Profile) và TICKET-034 (Dashboard),
để tránh sửa giao diện hai lần.

**Phạm vi:** Thiết lập design tokens + component nền + 1 màn hình mẫu để chốt phong cách.
**Không** redesign toàn bộ app trong ticket này (việc đó thuộc TICKET-033/034).

---

## Bối cảnh hiện trạng (code đã đọc)

Hệ thống token nằm ở `apps/frontend/src/index.css` (Tailwind v4, khối `@theme`):

```css
@theme {
  --color-surface: #0F0F1A;      /* nền tối */
  --color-surface-2: #1A1A2E;
  --color-surface-3: #16213E;
  --color-primary: #6366F1;       /* indigo */
  --color-primary-dark: #4F46E5;
  --color-accent: #A78BFA;        /* purple */
  --color-text-1: #F1F5F9;
  --color-text-2: #94A3B8;
  --color-text-3: #475569;
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-border: rgba(99, 102, 241, 0.2);
  --font-family-sans: "Inter", system-ui, sans-serif;
}
```

Toàn app dùng các biến này + nhiều giá trị hex hardcode rải rác trong component
(`#1A1A2E`, `#6366F1`, `#94A3B8`...). Đây là điểm cần gom về tokens.

---

## Định hướng phong cách "Playful Light"

| Yếu tố | Hiện tại (Dark generic) | Mới (Playful Light) |
|---|---|---|
| **Nền** | Tối `#0F0F1A` | Sáng, sạch (off-white / soft neutral) |
| **Accent** | Indigo/purple lạnh | Gradient ấm rực (cam/hồng/coral + 1 màu phụ vui) |
| **Typography** | Inter, 1 scale phẳng | Display font đậm cho tiêu đề + type scale rõ ràng |
| **Card** | Phẳng, viền mờ tối | Nền trắng, shadow mềm có màu, bo góc lớn |
| **Cảm xúc** | Nghiêm túc/SaaS | Vui, khích lệ, năng lượng học tập |
| **Gamification** | Chìm | Nổi bật (streak, XP, badge rực rỡ) |

> Lưu ý: Light theme là mặc định mới. Cân nhắc giữ dark mode như tùy chọn (xem REQ-08).

---

## Yêu cầu chi tiết

**REQ-01 — Bảng màu mới (Color Tokens)**
Định nghĩa lại token màu trong `@theme` cho light theme + accent ấm:
- Surface sáng: nền chính, nền card, nền nâng (elevated).
- Brand accent ấm: primary (vd. coral/cam), secondary (vd. hồng/vàng), tạo được gradient.
- Text trên nền sáng: đảm bảo độ tương phản WCAG AA (≥ 4.5:1 cho body).
- Semantic: success / warning / error / info hài hòa với palette mới.
- Bổ sung token cho gamification (streak, XP, badge) rực rỡ nhưng có kiểm soát.

**REQ-02 — Type Scale & Display Font**
- Thêm display font đậm cho tiêu đề (vd. một geometric/rounded sans) + giữ Inter cho body.
- Định nghĩa type scale rõ ràng (display / h1 / h2 / body / caption) với line-height & weight.
- Tiêu đề lớn, đậm (tinh thần "Bold") để tạo cảm giác hiện đại.

**REQ-03 — Elevation & Shadow (mềm, có màu)**
Định nghĩa hệ thống shadow mềm, có hơi nhuốm màu accent (kiểu "colored soft shadow") thay
cho viền tối hiện tại. Định nghĩa các cấp elevation (0/1/2/3).

**REQ-04 — Radius, Spacing & Border tokens**
Chuẩn hóa radius (sm/md/lg/xl/pill), spacing scale, và border token. Gom các giá trị
hardcode đang rải rác về tokens.

**REQ-05 — Motion & Micro-interactions tokens**
Định nghĩa duration/easing chuẩn (vd. spring cho nút, ease-out cho transition). Bổ sung
keyframes vui mắt (pop, bounce nhẹ, confetti-ready). Gắn haptic cho hành động chính (native).

**REQ-06 — Component nền cập nhật theo style mới**
Cập nhật một bộ component nền dùng chung sang phong cách mới (KHÔNG redesign toàn app):
- `Button` (primary/secondary/ghost/danger) — kích thước to, bo tròn, gradient ấm.
- `Card` / surface — nền sáng + soft shadow.
- `Badge` (`LanguageBadge`, `CefrBadge`) — màu mới.
- `ProgressBar` / ring — accent mới + animation.
- `AppShell` — nền sáng, nav bar cập nhật.

**REQ-07 — Màn hình mẫu (Reference Screen)**
Dựng lại **1 màn hình mẫu** (đề xuất: Dashboard) hoàn chỉnh theo Design System mới để chốt
phong cách trực quan trước khi nhân rộng. Đây là "north star" cho TICKET-033/034.

**REQ-08 — Theme switching (tùy chọn)**
Cân nhắc hỗ trợ light (mặc định) + dark (tùy chọn) qua token. Nếu phức tạp, có thể tách
thành ticket riêng — tối thiểu đảm bảo kiến trúc token không chặn việc thêm dark mode sau.

**REQ-09 — Tài liệu hóa tokens**
Ghi chú ngắn (trong code/comment hoặc 1 file tham chiếu) liệt kê tokens & cách dùng, để các
ticket sau (033/034) bám theo, tránh hardcode lại.

---

## Phạm vi KHÔNG bao gồm (Out of scope)

- Không redesign toàn bộ các màn (thuộc TICKET-033 & 034).
- Không đổi logic nghiệp vụ, API, schema DB.
- Không bắt buộc hoàn thiện dark mode (REQ-08 là tùy chọn).
- Không thay thư viện UI framework (vẫn Tailwind v4 + component hiện có).

---

## Tiêu chí hoàn thành (Acceptance Criteria)

- [ ] `@theme` cập nhật bộ color tokens light + accent ấm; gom giá trị hardcode chính về tokens.
- [ ] Có type scale + display font cho tiêu đề; body vẫn Inter.
- [ ] Có hệ thống soft shadow / elevation thay viền tối.
- [ ] Tokens radius / spacing / motion được định nghĩa và sử dụng.
- [ ] Bộ component nền (Button/Card/Badge/ProgressBar/AppShell) cập nhật style mới.
- [ ] 1 màn hình mẫu (Dashboard) hoàn chỉnh theo phong cách "Playful Light".
- [ ] Đạt tương phản WCAG AA cho text/nút trên nền sáng.
- [ ] Không phá vỡ build (frontend + shared-types) và các luồng hiện có.
- [ ] Có ghi chú tokens để TICKET-033/034 tham chiếu.

---

## Ghi chú kỹ thuật

- Token định nghĩa trong `apps/frontend/src/index.css` khối `@theme` (Tailwind v4).
- Display font: nạp qua `@font-face` hoặc Google Fonts; cân nhắc self-host để tối ưu Zalo/native.
- Soft shadow: dùng `box-shadow` đa lớp nhuốm màu accent (vd. `0 8px 24px rgba(accent, .15)`).
- Giữ rule chống zoom input (`font-size: max(16px, 1em)`) đã có.
- Haptic: Capacitor Haptics trên native; no-op web/Zalo.
- Component liên quan: `AppShell`, `Button`, `Badge`, `ProgressBar`, `SkeletonCard`,
  `GreetingCard`, `DailyGoalRing`, `LevelMasteryCard`.
- **Thứ tự triển khai khuyến nghị:** TICKET-035 (chốt style) → TICKET-034 (Dashboard) →
  TICKET-033 (Roadmap/Review/Profile).
- Đề xuất kiểm tra contrast bằng công cụ (WCAG AA) cho mọi cặp text/nền mới.

---

## TOKEN REFERENCE (REQ-09)

Tokens định nghĩa trong `apps/frontend/src/index.css` (`@theme`). Tokens dark cũ được giữ
lại để màn chưa migrate vẫn chạy; tokens "Playful Light" là hướng mặc định mới.

### Màu (Tailwind utilities: `bg-*`, `text-*`, `border-*`)
| Token | Giá trị | Dùng cho |
|---|---|---|
| `--color-canvas` | `#FBF6F2` | Nền app (warm off-white) |
| `--color-card` | `#FFFFFF` | Nền card / elevated |
| `--color-card-2` | `#FFF3EC` | Surface tinted nhẹ |
| `--color-line` | `#EFE6DE` | Hairline border trên nền sáng |
| `--color-coral` | `#FF6B4A` | Primary accent |
| `--color-coral-2` | `#FF8A3D` | Gradient partner (cam) |
| `--color-pink` | `#FF4D8D` | Secondary accent |
| `--color-gold` | `#FFB627` | Tertiary / XP |
| `--color-grape` | `#7C5CFC` | Cool accent cân bằng |
| `--color-ink` | `#221B2E` | Heading (AA) |
| `--color-ink-2` | `#5B5366` | Body (AA) |
| `--color-ink-3` | `#8E8798` | Caption / muted |
| `--color-ok/warn/bad/info` | … | Semantic (light) |
| `--color-streak/xp/mastery` | … | Gamification |

### Elevation / Radius / Motion / Font
| Token | Dùng cho |
|---|---|
| `--shadow-soft` / `.shadow-soft` | Card thường |
| `--shadow-pop` / `.shadow-pop` | Card nổi bật |
| `--shadow-coral` / `.shadow-coral` | CTA / surface coral |
| `--shadow-grape` / `.shadow-grape` | Surface grape |
| `--radius-card` (20px) | Bo góc card chính (`rounded-[var(--radius-card)]`) |
| `--ease-spring` / `--ease-out-soft` | Easing chuẩn |
| `--font-display` (Poppins) | Tiêu đề (`.font-display`, `.text-display/.text-h1/.text-h2`) |

### Helper classes
`.text-display`, `.text-h1`, `.text-h2`, `.font-display`, `.shadow-soft/pop/coral/grape`,
`.animate-pop`, `.animate-bounce-soft`, `.animate-wiggle`, `.press` (press feedback).

### Components mới / theme-aware
- **Mới:** `ui/Button.tsx` (primary/secondary/ghost/danger), `ui/Card.tsx` (plain/tinted/coral/grape).
- **Theme-aware (prop bổ sung, mặc định giữ dark):** `AppShell`/`TopBar`/`BottomNav` (`theme`),
  `Badge` (`light`), `ProgressBar` (`tone`), `SkeletonCard` (`light`).
- **Reference screen (light):** `DashboardPage` (`theme="light"`) + home components đã restyle.

> Cách dùng: màn muốn theo style mới → bọc bằng `<AppShell theme="light">` và dùng tokens
> `bg-card`, `text-ink`, `shadow-soft`, `rounded-[var(--radius-card)]`, `font-display`…

---

## PLAN TODO (đã thực hiện)

- [x] **TODO-1**: Thêm color/shadow/radius/motion/font tokens vào `@theme` (`index.css`) — additive, không xóa token dark.
- [x] **TODO-2**: Display font (Poppins) + type scale (`.text-display/h1/h2`) + keyframes (pop/bounce/wiggle) + helper classes.
- [x] **TODO-3**: Tạo `ui/Button.tsx` (Playful Light, 4 variant, 3 size).
- [x] **TODO-4**: Tạo `ui/Card.tsx`; cập nhật `Badge` (`light`) & `ProgressBar` (`tone`) — additive.
- [x] **TODO-5**: Thêm prop `theme` cho `AppShell`/`TopBar`/`BottomNav` (mặc định `dark`).
- [x] **TODO-6**: Reference Dashboard (`theme="light"`) + restyle `GreetingCard`/`DailyGoalRing`/`LevelMasteryCard`/`DueVocabItem` + hero CTA "Học tiếp" + `SkeletonCard light`.
- [x] **TODO-7**: Token reference (REQ-09) + verify `npm run build` (frontend pass).

---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> Thiết lập nền tảng Design System "Playful Light" (tokens + base components + shell
> theme-aware) và dựng Dashboard làm màn hình mẫu, KHÔNG phá vỡ các màn dark hiện có.

### Thống kê
- **Tổng TODO**: 7
- **Hoàn thành**: 7 ✅
- **Blocked**: 0

### Files Changed
| File | Loại | Mô tả |
|---|---|---|
| `apps/frontend/src/index.css` | Modified | Thêm tokens Playful Light, font Poppins, keyframes, helper classes |
| `apps/frontend/src/components/ui/Button.tsx` | New | Base button (4 variant/3 size) |
| `apps/frontend/src/components/ui/Card.tsx` | New | Base card (4 tone) |
| `apps/frontend/src/components/ui/Badge.tsx` | Modified | Thêm prop `light` |
| `apps/frontend/src/components/ui/ProgressBar.tsx` | Modified | Thêm prop `tone` |
| `apps/frontend/src/components/ui/SkeletonCard.tsx` | Modified | Thêm prop `light` |
| `apps/frontend/src/components/layout/AppShell.tsx` | Modified | Prop `theme` |
| `apps/frontend/src/components/layout/TopBar.tsx` | Modified | Prop `theme` (light chrome) |
| `apps/frontend/src/components/layout/BottomNav.tsx` | Modified | Prop `theme` (light chrome) |
| `apps/frontend/src/components/home/GreetingCard.tsx` | Modified | Restyle coral gradient |
| `apps/frontend/src/components/home/DailyGoalRing.tsx` | Modified | Restyle light + coral ring |
| `apps/frontend/src/components/home/LevelMasteryCard.tsx` | Modified | Restyle light + grape bar |
| `apps/frontend/src/components/home/DueVocabItem.tsx` | Modified | Restyle light tokens |
| `apps/frontend/src/pages/DashboardPage.tsx` | Modified | `theme="light"` + hero CTA + restyle |

### Verification
- Build frontend (`npm run build`): ✅ (warning chunk-size là cũ, không liên quan)
- TypeScript errors: ✅ none
- Không phá vỡ màn dark khác: ✅ (mọi thay đổi shared đều additive, mặc định dark)

### Ghi chú & phần còn lại
- **REQ-08 (dark mode toggle):** kiến trúc đã sẵn sàng qua prop `theme`, nhưng **chưa** làm
  bộ chuyển theme toàn cục — để lại cho ticket riêng nếu cần.
- Các màn Roadmap/Review/Profile… vẫn dark; sẽ migrate sang Playful Light ở TICKET-033/034.
- Font Poppins đang nạp qua Google Fonts; cân nhắc self-host để tối ưu Zalo/native (ghi chú kỹ thuật).

