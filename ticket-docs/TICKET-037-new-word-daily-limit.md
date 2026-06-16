# TICKET-037: Giới hạn từ mới mỗi phiên & ưu tiên từ đến hạn

**Status:** ✅ Done
**Priority:** 🟠 P2 – Hiệu quả học
**Platforms:** Backend (API), Frontend
**Created:** June 15, 2026
**Nhóm gốc:** Nhóm 1 #4

---

## Vấn đề

`getQueue` (`review.service.ts`) trộn lẫn từ mới (`reviewCount = 0`, `nextReview` mặc định
`now()`) với từ đến hạn (`reviewCount > 0`) và chỉ giới hạn bằng `take: limit`. Khi có nhiều
từ mới (vd vừa mở stage), người học bị "dội" hàng loạt từ chưa từng thấy cùng lúc → quá tải,
giảm hiệu quả và dễ bỏ cuộc.

## Mục tiêu

- Thêm tham số `newLimit` (mặc định 10) cho `/review/queue`.
- Trong chế độ thường (không phải path), **ưu tiên từ đến hạn**, sau đó mới bổ sung tối đa
  `newLimit` từ mới (cũ nhất trước) trong phần dung lượng còn lại của `limit`.
- Giữ nguyên hành vi path-mode (không đổi logic OR unlearned).

## Phạm vi

- `review/dto/review.dto.ts`: thêm `newLimit` (optional, 0–100).
- `review/review.service.ts`: tách 2 truy vấn due/new trong nhánh non-path.

## Ngoài phạm vi

- Cap "theo ngày" tuyệt đối (đếm số từ đã bắt đầu học trong ngày) — cần thêm trường dữ liệu,
  để ticket sau. Bản này cap theo từng phiên/batch.

## Acceptance Criteria

- [x] Mỗi batch review chứa tối đa `newLimit` từ mới.
- [x] Từ đến hạn luôn được ưu tiên trước từ mới.
- [x] Path-mode hoạt động như cũ.
- [x] Typecheck pass (validate qua language server). (Cần chạy `npm test` backend khi môi trường node sẵn sàng.)
