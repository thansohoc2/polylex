# TICKET-034: Redesign màn hình Dashboard (Trang chủ)

**Status:** � Implemented (done as reference screen in TICKET-035)
**Priority:** 🟠 P1 – High (UX / First Impression / Retention)
**Platforms:** iOS, Android, Web, Zalo Mini App
**Created:** June 16, 2026
**Type:** UX/UI Redesign
**Related:** TICKET-005 (mobile-first UI), TICKET-033 (redesign Roadmap/Review/Profile)

---

## Mô tả yêu cầu

Dashboard (Trang chủ) là màn hình đầu tiên người dùng thấy sau khi đăng nhập và là điểm
khởi đầu cho mọi phiên học. Hiện trạng đã đầy đủ chức năng nhưng bố cục là một danh sách
dọc các card cùng trọng số, chưa có phân lớp thị giác rõ ràng, lời gọi hành động chính
("học tiếp") chưa nổi bật, và thông tin sắp xếp chưa theo mức ưu tiên hành vi. Ticket này
redesign Dashboard nhằm tạo một "command center" rõ ràng: user mở app là biết ngay nên làm
gì tiếp theo, tăng tỉ lệ bắt đầu phiên học và cải thiện retention.

**Phạm vi:** Chỉ thay đổi giao diện/luồng trình bày phía frontend. **Không** thay đổi logic
nghiệp vụ, schema DB, hay API contract. Tận dụng tối đa component & token màu hiện có.

---

## Bối cảnh hiện trạng (code đã đọc)

`apps/frontend/src/pages/DashboardPage.tsx` render trong `AppShell` một stack dọc gồm:

1. `GreetingCard` — lời chào + stats.
2. `DailyGoalRing` — vòng mục tiêu ngày (chọn 10/20/40 XP).
3. `LevelMasteryCard` — level + XP + số từ đã thuộc.
4. Nút Leaderboard (card full-width).
5. `Quick start` — grid 3 nút: Ôn tập 🔁 / Quick Notes ⚡ / Từ vựng 📚.
6. `Recent quick notes` — carousel ngang.
7. `Due for review` — danh sách `DueVocabItem`.

Dữ liệu nạp qua `Promise.allSettled` (6 calls). Nếu user chưa có path → redirect `/roadmap`.

**Nhận xét:** Mọi block có trọng số thị giác gần như nhau → mắt không biết nhìn đâu trước;
CTA học chính (Ôn tập) chỉ là 1 ô trong grid 3 ô nhỏ; thông tin gamification (level, goal)
chiếm phần lớn không gian đầu trang dù không phải hành động chính.

---

## Mục tiêu thiết kế (Design Principles)

| Nguyên tắc | Áp dụng |
|---|---|
| **Visual Hierarchy** | Một CTA chính nổi bật ("Học tiếp"); phần phụ giảm trọng số |
| **Hick's Law** | Giảm số lựa chọn ngang hàng ở đầu trang |
| **Fitts's Law** | Nút hành động chính to, dễ chạm, đặt vùng dễ với tay |
| **Miller's Law / Chunking** | Gom block theo nhóm: "Học hôm nay" / "Tiến độ" / "Gần đây" |
| **Goal-Gradient Effect** | Hiển thị tiến độ ngày để thúc đẩy hoàn thành |
| **Recognition over Recall** | Nêu rõ "còn N từ cần ôn" ngay CTA chính |
| **Aesthetic-Usability** | Bố cục thoáng, nhịp khoảng cách nhất quán |

---

## Yêu cầu chi tiết

**REQ-01 — CTA "Học tiếp" làm điểm nhấn chính**
Đưa hành động học quan trọng nhất (Ôn tập due / Quick Notes nếu có) thành **một CTA lớn,
full-width, nổi bật** ngay sau lời chào. Hiển thị số từ cần ôn + ước lượng thời gian.
Khi không còn gì để ôn → trạng thái "Đã hoàn thành hôm nay 🎉" + gợi ý hành động khác.

**REQ-02 — Phân lớp thị giác (Visual Hierarchy)**
Giảm trọng số các block phụ (Leaderboard, Vocabulary) so với CTA chính. Dùng kích thước,
màu, độ tương phản để dẫn mắt: Chào → Học tiếp → Tiến độ → Khám phá thêm.

**REQ-03 — Gom & sắp xếp lại theo nhóm hành vi**
Tổ chức Dashboard thành các nhóm rõ ràng (chunking):
- *Học hôm nay*: CTA chính + daily goal ring.
- *Tiến độ của bạn*: level/mastery + streak (gộp gọn).
- *Gần đây*: recent quick notes + due list.
- *Khám phá*: leaderboard, vocabulary, các shortcut phụ.

**REQ-04 — Daily goal gọn hơn, gắn với CTA**
`DailyGoalRing` đặt cạnh hoặc tích hợp với CTA "Học tiếp" để tạo liên kết "học → đạt mục
tiêu" (Goal-Gradient), thay vì là một block độc lập chiếm nhiều không gian.

**REQ-05 — Quick start gọn, ưu tiên đúng**
Giữ shortcut Ôn tập / Quick Notes / Từ vựng nhưng giảm trọng số (vì CTA chính đã có). Cân
nhắc đưa Vocabulary xuống nhóm "Khám phá".

**REQ-06 — Empty/edge states tử tế**
- User mới chưa có path: vẫn redirect roadmap như hiện tại (giữ nguyên hành vi).
- Không có due + không có quick notes: hiển thị trạng thái tích cực ("Bạn đang đúng tiến độ!")
  thay vì các section rỗng.

**REQ-07 — Micro-interactions**
Thêm hiệu ứng nhẹ: progress ring animate khi đạt mục tiêu, haptic khi bấm CTA chính (native),
skeleton mượt khi loading (đã có `SkeletonCard` — đảm bảo nhất quán toàn trang).

---

## Phạm vi KHÔNG bao gồm (Out of scope)

- Không đổi API endpoints hay shared-types contract.
- Không đổi logic gamification / spaced-repetition.
- Không thêm tính năng học mới; chỉ tái cấu trúc trình bày.
- Backend/DB không thay đổi.
- Giữ nguyên hành vi redirect `/roadmap` khi user chưa có path.

---

## Tiêu chí hoàn thành (Acceptance Criteria)

- [ ] Có một CTA "Học tiếp" lớn, full-width, nổi bật rõ so với phần còn lại.
- [ ] CTA chính hiển thị số từ cần ôn (+ ước lượng thời gian) và xử lý trạng thái "đã xong".
- [ ] Dashboard được chia nhóm rõ ràng (Học hôm nay / Tiến độ / Gần đây / Khám phá).
- [ ] Block phụ (leaderboard, vocabulary) có trọng số thị giác thấp hơn CTA chính.
- [ ] Daily goal liên kết trực quan với hành động học.
- [ ] Empty states tích cực thay cho section rỗng.
- [ ] Tất cả text qua i18n (en/vi/pt); không hardcode chuỗi mới.
- [ ] Đạt tương phản WCAG AA cho text/nút trên nền tối.
- [ ] Không phá vỡ luồng hiện tại (data load, redirect roadmap, chọn daily goal vẫn chạy).

---

## Ghi chú kỹ thuật

- Tái dùng token màu hiện có: nền `#0F0F1A`/`#1A1A2E`, accent `#6366F1`/`#A78BFA`/`#8B5CF6`,
  warning `#F59E0B`/`#FBBF24`, text `#F1F5F9`/`#94A3B8`.
- Component liên quan: `GreetingCard`, `DailyGoalRing`, `LevelMasteryCard`, `DueVocabItem`,
  `SkeletonCard`, `AppShell`, `QuickNoteCard`.
- Giữ nguyên cấu trúc nạp dữ liệu `Promise.allSettled` 6 calls; chỉ thay đổi cách trình bày.
- Haptic: dùng Capacitor Haptics trên native; no-op trên web/Zalo.
- Ưu tiên triển khai sau hoặc song song với TICKET-033 để đồng bộ ngôn ngữ thiết kế toàn app.
