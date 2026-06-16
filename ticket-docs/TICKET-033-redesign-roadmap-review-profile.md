# TICKET-033: Redesign 3 màn hình cốt lõi — Lộ trình / Ôn tập / Hồ sơ

**Status:** � Implemented (Playful Light theme — see TICKET-035)
**Priority:** 🟠 P1 – High (UX/Retention)
**Platforms:** iOS, Android, Web, Zalo Mini App
**Created:** 2026
**Type:** UX/UI Redesign
**Related:** TICKET-005 (mobile-first UI), TICKET-006 (vocabulary redesign)

---

## Mô tả yêu cầu

Ba màn hình cốt lõi của PolyLex — **Lộ trình (Roadmap)**, **Ôn tập (Review)** và
**Hồ sơ (Profile)** — hiện đã đầy đủ chức năng nhưng UX/UI còn nhiều điểm gây cản trở:
nội dung dài, thiếu phân lớp thông tin, lời gọi hành động không rõ, và một số rủi ro thao
tác (xóa tài khoản dễ nhầm). Ticket này redesign cả 3 màn hình theo các nguyên tắc UX đã
được kiểm chứng (Progressive Disclosure, Hick's / Fitts's / Miller's Law, Goal-Gradient,
Error Prevention) nhằm tăng khả năng quét, giảm tải nhận thức và cải thiện retention.

**Phạm vi:** Chỉ thay đổi giao diện/luồng trình bày phía frontend. **Không** thay đổi logic
nghiệp vụ, schema DB, hay API hợp đồng. Tận dụng tối đa component & token màu hiện có.

---

## Bối cảnh hiện trạng (code đã đọc)

### Lộ trình — `apps/frontend/src/pages/RoadmapPage.tsx`
- `AppShell` + danh sách `PathCard`; mỗi `PathCard` render **toàn bộ** `StageRow` cùng lúc.
- Empty state: emoji 🗺️ + nút tạo path đầu tiên. `rightAction` là nút "+" mở `PathGeneratorSheet`.

### Ôn tập — `apps/frontend/src/pages/ReviewPage.tsx`
- 6 chế độ bài tập (flashcard, type_answer, context, listening, reverse, multiple_choice).
- `RatingButtons` 5 mức (Again/Hard/OK/Good/Easy). `ProgressBar` + `SessionCelebration`.
- Vào thẳng phiên học, không có màn tổng quan trước session.

### Hồ sơ — `apps/frontend/src/pages/ProfilePage.tsx`
- 9+ section phẳng cùng cấp: streak, level, native language, voice, reminder, japanese,
  learning languages, settings menu, legal, sign out, delete account.
- "Delete Account" cùng cỡ/màu với "Sign Out"; xác nhận bằng `window.confirm()`.

---

## Mục tiêu thiết kế (Design Principles)

| Nguyên tắc | Áp dụng |
|---|---|
| **Progressive Disclosure** | Chỉ hiện chi tiết khi cần (collapse stages, settings sub-menu) |
| **Hick's Law** | Giảm số lựa chọn cùng lúc (5 → 3 nút rating; gom settings) |
| **Fitts's Law** | Nút hành động chính to, full-width, dễ chạm trên mobile |
| **Miller's Law / Chunking** | Gom thông tin thành nhóm 5±2 mục |
| **Goal-Gradient Effect** | Hiển thị tiến độ động viên giữa session ôn tập |
| **Error Prevention** | Tách "danger zone"; modal xác nhận thay `window.confirm` |
| **Recognition over Recall** | Highlight rõ "đang học stage nào" |

---

## Yêu cầu chi tiết

### 🗺️ Màn hình LỘ TRÌNH (Roadmap)

**REQ-01 — Collapse stages mặc định**
Chỉ path đang active được expand đầy đủ stages. Các path khác thu gọn thành card tóm tắt:
emoji + tên + progress ring (%) + nút "Tiếp tục". Người dùng bấm để expand/collapse.

**REQ-02 — Highlight stage hiện tại**
Stage đang học (`currentStageOrder`) có viền glow / badge "Đang học" nổi bật để nhận diện
ngay mà không phải dò tìm.

**REQ-03 — Nút "Tiếp tục học" cấp path**
Mỗi `PathCard` có CTA chính ở header → nhảy thẳng tới stage active (hoặc mở review của path).

**REQ-04 — Sticky mini-progress (tùy chọn)**
Khi scroll trong path dài, hiển thị thanh tiến độ thu nhỏ dính trên cùng để giữ ngữ cảnh.

---

### 🔁 Màn hình ÔN TẬP (Review)

**REQ-05 — Pre-session overview**
Trước khi vào phiên, hiện màn tóm tắt: "Bạn sắp ôn N từ · ~X phút" + nút "Bắt đầu" lớn.
Cho phép user biết phạm vi & ước lượng thời gian (Visibility of System Status).

**REQ-06 — Rút gọn rating còn 3 mức (mặc định)**
Mặc định hiển thị 3 nút full-width có màu phân biệt: **Khó / Ổn / Dễ** (map về thang
spaced-repetition hiện có). Nút to theo Fitts's Law, có haptic feedback trên mobile.
Giữ tùy chọn 5 mức ở chế độ nâng cao (settings) nếu cần.

**REQ-07 — Progress động viên giữa session**
Hiển thị "Còn N từ nữa 💪" và celebration nhẹ tại các mốc 25/50/75% (Goal-Gradient).

**REQ-08 — Swipe gestures (tùy chọn)**
Vuốt trái/phải để rate nhanh trên mobile, kèm hiệu ứng card (như Anki mobile / Tinder).

**REQ-09 — Bảo vệ tiến độ khi thoát**
Khi user thoát giữa session, hỏi xác nhận hoặc lưu tạm để tránh mất tiến độ (Error Prevention).

---

### 👤 Màn hình HỒ SƠ (Profile)

**REQ-10 — Tách 2 vùng: Hồ sơ/Stats (xem) vs Cài đặt (chỉnh)**
- *Vùng trên (chỉ xem)*: avatar, tên, email, level ring, streak, từ đã thuộc.
- *Vùng dưới (cài đặt)*: gom vào các nhóm/sub-menu thay vì list phẳng.

**REQ-11 — Gom Settings thành grouped list (kiểu iOS)**
Gom Voice / Reminder / Japanese / Ngôn ngữ / Tài khoản vào danh sách nhóm. Mỗi nhóm là 1
hàng có icon + chevron; bấm vào mới mở chi tiết (Progressive Disclosure + Chunking).

**REQ-12 — Danger Zone tách biệt + modal xác nhận**
"Delete Account" đặt cuối cùng trong khu vực riêng, màu nhạt/secondary, **không** dùng
`window.confirm()` — thay bằng modal xác nhận có nhập xác nhận hoặc nút giữ-để-xóa.
Phân biệt rõ "Sign Out" (thường) và "Delete Account" (nguy hiểm).

**REQ-13 — Sắp xếp lại thứ tự ưu tiên**
Đưa thông tin quan trọng (stats, streak, level) lên trên; cài đặt ít dùng xuống dưới.

---

## Phạm vi KHÔNG bao gồm (Out of scope)

- Không đổi logic spaced-repetition (chỉ đổi cách map UI 3 nút → thang điểm hiện có).
- Không đổi API endpoints hay shared-types contract.
- Không thêm tính năng học mới; chỉ tái cấu trúc trình bày.
- Backend/DB không thay đổi.

---

## Tiêu chí hoàn thành (Acceptance Criteria)

- [ ] Roadmap: path không-active thu gọn; chỉ path active expand; có nút "Tiếp tục".
- [ ] Roadmap: stage hiện tại được highlight rõ ràng.
- [ ] Review: có màn pre-session với số từ + ước lượng thời gian + nút "Bắt đầu".
- [ ] Review: rating mặc định 3 nút full-width, có haptic (mobile).
- [ ] Review: hiển thị tiến độ động viên + celebration theo mốc.
- [ ] Profile: tách vùng stats (xem) và settings (chỉnh); settings dạng grouped list.
- [ ] Profile: Delete Account ở danger zone riêng, dùng modal thay `window.confirm`.
- [ ] Tất cả text qua i18n (en/vi/pt); không hardcode chuỗi mới.
- [ ] Đạt tương phản WCAG AA cho text/nút trên nền tối.
- [ ] Không phá vỡ luồng hiện tại (review session, tạo path, cập nhật profile vẫn chạy).

---

## Ghi chú kỹ thuật

- Tái dùng token màu hiện có: nền `#0F0F1A`/`#1A1A2E`, accent `#6366F1`/`#8B5CF6`,
  success `#22C55E`/`#10B981`, danger `red-500/*`.
- Component liên quan: `PathCard`, `StageRow`, `RatingButtons`, `ProgressBar`,
  `SessionCelebration`, `AppShell`, `LanguageBadge`, `CefrBadge`.
- Modal xác nhận: tạo component dùng chung (vd. `ConfirmDialog`) để thay `window.confirm`.
- Haptic: dùng Capacitor Haptics trên native; no-op trên web/Zalo.
- Ưu tiên triển khai theo thứ tự: Profile (rủi ro xóa account) → Review → Roadmap.
