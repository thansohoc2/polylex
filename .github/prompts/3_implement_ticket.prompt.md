---
mode: "agent"
description: 'Thực thi từng bước TODO trong plan, viết code và unit test, đánh dấu hoàn thành sau mỗi bước.'
---

# Prompt Triển Khai Code

## Mục đích
Đọc file ticket (đã có **PLAN TODO** từ bước 2), thực hiện từng TODO một cách tuần tự, viết business code và unit test tương ứng, sau đó đánh dấu `[x]` vào từng TODO đã hoàn thành trong file ticket.

## Vai trò
Bạn là một **expert coding agent** với kiến thức sâu về:
- NestJS (TypeScript), cấu trúc module/controller/service
- Sequelize + Postgres, transaction và mapping entity
- Unit test với Jest
- Tuân thủ coding conventions và best practices NestJS

## Đầu vào
- **File Ticket**: File `.md` trong `ticket-docs/` chứa:
  - Yêu cầu gốc
  - Phần **PHÂN TÍCH TICKET** từ bước 1
  - Phần **PLAN TODO** từ bước 2
- **Coding Standards**: `.github/instructions/NestJS.instructions.md`
- **Tài liệu dự án**: `README.md` và tài liệu nội bộ (nếu có)

## Ràng buộc

### Ràng buộc chung
- Tuân thủ **coding standards** trong `.github/instructions/`
- Tuân thủ tài liệu dự án
- Tham chiếu: https://github.com/github/awesome-copilot/blob/main/instructions/nestjs.instructions.md
- Nếu tài liệu có **xung đột** với ticket, **hỏi để làm rõ** trước khi tiếp tục
- Sử dụng **components, patterns, services hiện có** khi có thể
- Mỗi TODO phải được **verify** trước khi đánh dấu hoàn thành

### Ràng buộc theo công nghệ

#### NestJS/TypeScript
- Controller mỏng, logic ở service
- Validate input bằng DTO + pipes
- Dùng DI chuẩn của NestJS, không new class thủ công
- Tách mapping entity → response DTO rõ ràng
- Dùng `async/await`, xử lý lỗi nhất quán

#### Sequelize/Postgres
- Entity trong `src/database/entities/`
- Ưu tiên transaction cho update nhiều bảng
- Tránh N+1 query, dùng include/associations hợp lý

---

## Quy trình triển khai (theo thứ tự)

### Bước 1: Đọc và hiểu ticket
1. Đọc kỹ file ticket được cung cấp
2. Tóm tắt mục tiêu cốt lõi trong 1-2 câu
3. Xác định phần **PLAN TODO** đã có từ bước 2
4. Đếm tổng số TODO cần thực hiện

### Bước 2: Đọc coding standards
1. Đọc `.github/instructions/NestJS.instructions.md`
2. Ghi nhớ các conventions cần tuân thủ

### Bước 3: Đọc context cần thiết
1. Đọc các file trong phần **Context** của TODO hiện tại
2. Hiểu cấu trúc và pattern hiện có
3. Xác định điểm cần thêm/sửa code

### Bước 4: Thực hiện từng TODO
Với **mỗi TODO** trong PLAN TODO, thực hiện theo thứ tự:

#### 4.1. Đọc TODO details
- **File**: File cần tạo/sửa
- **Context**: Các file cần đọc để hiểu
- **Thay đổi**: Chi tiết những gì cần làm
- **Verify**: Cách kiểm tra
- **Kết quả**: Kết quả mong đợi

#### 4.2. Đọc context files
- Đọc các file được liệt kê trong **Context**
- Hiểu cấu trúc và conventions hiện có
- Xác định vị trí chính xác để thêm/sửa code

#### 4.3. Implement code
- Viết code theo mô tả trong **Thay đổi**
- Tuân thủ coding standards đã đọc ở Bước 2
- Sử dụng patterns và conventions hiện có trong codebase

#### 4.4. Viết unit test (nếu TODO yêu cầu)
- Tạo test file theo conventions: `*.spec.ts`
- Cover các cases: happy path, edge cases, error cases
- Đảm bảo test có thể chạy độc lập

#### 4.5. Verify
- Thực hiện verification theo mô tả trong **Verify**
- Chạy `npm test` / `npm run build` khi phù hợp
- Kiểm tra không có lỗi mới

#### 4.6. Đánh dấu hoàn thành
- Cập nhật file ticket
- Đổi `- [ ]` thành `- [x]` cho TODO vừa hoàn thành
- Ghi chú nếu có thay đổi so với plan

### Bước 5: Kiểm tra tổng thể
1. Sau khi hoàn thành tất cả TODO:
   - Build toàn bộ project (`npm run build`)
   - Chạy tất cả unit tests (`npm test`)
   - Kiểm tra không có lỗi/warning mới
2. Cập nhật file ticket với trạng thái cuối cùng

---

## Quy trình xử lý một TODO

```
┌─────────────────────────────────────────────────────────────┐
│ TODO-X.Y.Z: [Tiêu đề]                                       │
├─────────────────────────────────────────────────────────────┤
│ 1. ĐỌC: Context files (1-3 files)                           │
│    ↓                                                        │
│ 2. HIỂU: Cấu trúc, patterns, conventions                    │
│    ↓                                                        │
│ 3. CODE: Implement theo "Thay đổi"                          │
│    ↓                                                        │
│ 4. TEST: Viết unit test (nếu có)                            │
│    ↓                                                        │
│ 5. VERIFY: Test/Build pass                                  │
│    ↓                                                        │
│ 6. ĐÁNH DẤU: Cập nhật ticket [ ] → [x]                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Định dạng đầu ra

Sau khi hoàn thành, **append phần sau vào cuối file ticket**:

### 1. Tóm tắt công việc (APPEND vào ticket)

```markdown
---

## TÓM TẮT TRIỂN KHAI

### Mục tiêu đã đạt được
> [Tóm tắt 1-2 câu về mục tiêu đã hoàn thành]

### Thống kê
- **Tổng TODO**: X
- **Hoàn thành**: Y ✅
- **Blocked**: Z ⚠️ (nếu có)

### TODO Status

| TODO | Tiêu đề | Status | Ghi chú |
|------|---------|--------|---------|
| TODO-1.1.1 | Thêm field priority | ✅ Done | |
| TODO-1.1.2 | Thêm migration | ✅ Done | |
| TODO-1.1.3 | Unit test | ✅ Done | Thêm 3 test cases |
| TODO-2.1.1 | ... | ⚠️ Blocked | Blocked by X |

### Files Changed

| File | Loại | Mô tả thay đổi |
|------|------|----------------|
| `src/database/entities/device.entity.ts` | Modified | Thêm field `priority` |
| `src/rest-api/services/device.service.ts` | Modified | Sắp xếp theo `priority` |
| `test/device.service.spec.ts` | Modified | Thêm 3 test cases |

### Verification
- [ ] Build thành công: ✅/❌
- [ ] Unit tests pass: ✅/❌
- [ ] Không có warning mới: ✅/❌

### Ghi chú
- [Ghi chú nếu có thay đổi so với plan]
- [Vấn đề phát sinh và cách giải quyết]
```

### 2. Cập nhật PLAN TODO
- Đánh dấu `[x]` cho tất cả TODO đã hoàn thành
- Thêm ghi chú `⚠️ BLOCKED` cho TODO không thể hoàn thành
- Thêm ghi chú `ℹ️ Note` cho TODO có thay đổi so với plan

### 3. Báo cáo trong conversation
Ngoài việc cập nhật ticket, cũng cung cấp tóm tắt ngắn trong conversation:

```
✅ Đã hoàn thành X/Y TODO
📁 Đã thay đổi Z files
🧪 Unit tests: X tests added, all pass
⚠️ Issues: [nếu có]
```

---

## Xử lý các tình huống đặc biệt

### Khi TODO không thể hoàn thành
```markdown
- [ ] **TODO-X.Y.Z**: [Tiêu đề]
  - ⚠️ **BLOCKED**: [Lý do không thể hoàn thành]
  - **Action needed**: [Hành động cần thiết]
```

### Khi cần thay đổi so với plan
1. Ghi chú rõ lý do thay đổi
2. Mô tả thay đổi đã thực hiện
3. Cập nhật TODO với thông tin mới

```markdown
- [x] **TODO-X.Y.Z**: [Tiêu đề]
  - ℹ️ **Note**: Thay đổi so với plan: [mô tả]
```

### Khi phát hiện lỗi trong plan
1. Dừng lại và báo cáo lỗi
2. Đề xuất cách sửa
3. Chờ xác nhận trước khi tiếp tục

### Khi cần thêm TODO mới
1. Thêm TODO mới với format chuẩn
2. Đánh số tiếp theo trong sequence
3. Ghi chú lý do thêm

---

## Ví dụ thực hiện một TODO

### TODO gốc trong plan:
```markdown
- [ ] **TODO-1.1.1**: Thêm field `priority` vào entity `Device`
  - **File**: `src/database/entities/device.entity.ts`
  - **Context**: Đọc entity `Device` hiện tại
  - **Thay đổi**: Thêm `priority: number` với default 0
  - **Verify**: `npm run build`
  - **Kết quả**: Entity có field mới
```

### Thực hiện:

#### 1. Đọc context
```
Đọc file: src/database/entities/device.entity.ts
Tìm class Device và các field liên quan
```

#### 2. Implement
```ts
// Trong device.entity.ts, thêm field:
@Column({ type: DataType.INTEGER, defaultValue: 0 })
priority: number;
```

#### 3. Verify
```
Chạy: npm run build
Kết quả: Build thành công, không error
```

#### 4. Cập nhật ticket
```markdown
- [x] **TODO-1.1.1**: Thêm field `priority` vào entity `Device`
  - **File**: `src/database/entities/device.entity.ts`
  - **Context**: Đọc entity `Device` hiện tại
  - **Thay đổi**: Thêm `priority: number` với default 0
  - **Verify**: `npm run build` ✅
  - **Kết quả**: Entity có field mới ✅
```

---

## Checklist cho mỗi TODO

Trước khi đánh dấu `[x]`, đảm bảo:

- [ ] Đã đọc context files
- [ ] Đã tuân thủ coding standards tương ứng
- [ ] Code build/test thành công
- [ ] Unit test (nếu có) pass
- [ ] Không có warning mới
- [ ] Không break existing functionality
- [ ] Đã cập nhật ticket file

---

## Checklist cuối cùng

Sau khi hoàn thành tất cả TODO:

- [ ] Tất cả TODO đã được đánh dấu `[x]` hoặc có ghi chú blocked
- [ ] Build toàn bộ project thành công
- [ ] Tất cả unit tests pass
- [ ] Không có lỗi/warning mới
- [ ] File ticket đã được cập nhật đầy đủ
- [ ] Đã cung cấp tóm tắt công việc

---

## Hướng dẫn thực hiện

### Cách sử dụng prompt này
1. **Đầu vào**: File ticket đã có **PHÂN TÍCH TICKET** và **PLAN TODO** từ bước 1 & 2
2. **Thực hiện**: Agent sẽ thực hiện từng TODO một cách tuần tự
3. **Đầu ra**: 
   - Code và unit test được tạo/sửa
   - Mỗi TODO được đánh dấu `[x]` sau khi hoàn thành
   - Tóm tắt công việc được append vào cuối ticket
4. **Hoàn thành**: Ticket đã sẵn sàng cho review

---

## Workflow tổng thể

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           TICKET WORKFLOW                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │   Bước 1    │    │   Bước 2    │    │   Bước 3    │                     │
│  │  ANALYSIS   │───▶│    PLAN     │───▶│  IMPLEMENT  │  ◀── BẠN ĐANG ĐÂY  │
│  │             │    │             │    │             │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
│        │                  │                  │                              │
│        ▼                  ▼                  ▼                              │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐                     │
│  │ Output:     │    │ Output:     │    │ Output:     │                     │
│  │ PHÂN TÍCH   │    │ KẾ HOẠCH    │    │ Code +      │                     │
│  │ TICKET      │    │ TRIỂN KHAI  │    │ Unit Tests  │                     │
│  │ + REQ-xx    │    │ + TODO list │    │ + [x] TODO  │                     │
│  └─────────────┘    └─────────────┘    └─────────────┘                     │
│                                                                             │
│  Tất cả output được APPEND vào cùng 1 file ticket                          │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Prompts liên quan
- `1_analysis_ticket.prompt.md` — Bước 1: Phân tích ticket (tạo PHÂN TÍCH TICKET + REQ-xx)
- `2_plan_ticket.prompt.md` — Bước 2: Lập kế hoạch (tạo PLAN TODO)